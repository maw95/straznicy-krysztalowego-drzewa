// Level 3 "Osada" (digital, rule `kingdom`, built on hero growth): gold, settlements with buildings, gold mines, a market of artifacts, a hospital,
// recruitment of supports and a team that grows. Design: docs/POZIOM_3_KROLESTWO.md (the author's decisions of 13.11.2026). Every number here is
// provisional: the simulations tune them. Gold is small (the cheapest thing costs 1) and shared by the whole faction.

import { ALL_TEAM_IDS, byTeam, raceOf, teamsOf } from './teams';
import { byPack } from './factions';
import { FACTION_NAMES, SUPPORTS_PER_BATTLE, UNITS, type FactionId, type TeamId } from './data';
import { distance, parseKey, type HexKey } from './hex';
import { encounterUnits, stillConnected } from './encounters';
import { awardXp, levelOf } from './growth';
import { log } from './log';
import { mapNeighbors, revealAround, tileCost, treeOf } from './map';
import { Rng } from './rng';
import { costText, ECONOMY, SIEGE, OBJECTS, OBJECT_NAMES, objectReady, thingsText, type Hut, type MapObject, emptyResources, RESOURCE_IDS, RESOURCE_NAMES, MINE_NAMES, type Cost, type ResourceId, type Resources } from './economy';
import { ARTIFACT_BY_ID, ARTIFACT_ODDS, artifactPool, completeSets, drawArtifact, gearOf, SETS, setCount, type ArtifactDef, giveArtifact, passTargets, SHARDS_ID, type Rarity } from './sites';
import { ENCOUNTER_MOTIFS, type EncounterMotif } from './data';
import { computerFaction, type Action, type Crystal, type GameState, type HeroState } from './types';
import { circleSpells, MAGIC, SPELL_CIRCLES, SPELLS, towerSpells, type SpellId } from './magic';
import { HERO_TYPES } from './heroTypes';
import { FACTION_MECHANICS, mayBuildSpark, mechanicLevel, pickUpShard, placeShards, shardCollector, SPARK_NAMES, spendShards, summedLevel } from './empire';
import { commanderName, commanderOf, freeCommanders, heroLabel, mayRansom, ransomPrice, REALM } from './realm';

export type BuildingId = 'barracks' | 'market' | 'hospital' | 'treasury' | 'forge' | 'walls' | 'tavern' | 'magic' | 'spark' | 'shrine' | 'nursery' | 'grove' | 'bloodPit' | 'plunder' | 'wolfDen' | 'hoofStone' | 'pastures' | 'refuge';

export interface Settlement {
  id: string;
  at: HexKey;
  /** The faction whose land it lies on (decides the name and who may recruit there). */
  land: TeamId;
  name: string;
  /** Who holds it now (null: still held by neutrals, the fight for it is on). */
  owner: TeamId | null;
  /** Level of each building: 0 not built, 1 built, 2 upgraded (the treasury has 2 as well). The forge exists in level 4 only (missing = 0: read it with `buildingLevel`). */
  buildings: Record<BuildingId, number>;
  /** Offers of the current market period already bought (the offer itself is drawn from the seed, see `marketStock`). */
  bought: string[];
  boughtEpoch: number;
  /** Level 4: supports left here by the owner; they defend the settlement when it is attacked (at most SIEGE.garrisonMax). */
  garrison?: string[];
}

export interface KingdomState {
  gold: Record<TeamId, number>;
  settlements: Record<string, Settlement>;
  /** `res`: the resource a mine gives (missing: gold). */
  mines: Record<HexKey, { owner: TeamId | null; res?: ResourceId }>;
  /** Level 4 (rule `economy`): wood, ore and Gwiezdny Pył of each faction, and the round of the last building (one a round per faction). */
  res?: Record<TeamId, Resources>;
  /** Level 4: huts with a quest, by hex. */
  huts?: Record<HexKey, Hut>;
  /** Level 4: mills, wells and stores, by hex. */
  objects?: Record<HexKey, MapObject>;
  /** Level 6: Odłamki Pierwotnej Iskry lying on the map (how many on a hex) and how many the game has in all (empire.ts). */
  shards?: Record<HexKey, number>;
  shardTotal?: number;
  /** Level 6: the units of tiers 2-5 whose dwelling each faction has built (one per tier). */
  dwellings?: Record<TeamId, string[]>;
  /** A hero opened a chest and has to choose: its contents (an artifact) or gold. */
  chest: { heroId: string } | null;
}

export const KINGDOM = {
  startGold: 2,
  /** Income per round: from every settlement it holds (the starting one too), from a mine, from a treasury. */
  incomeSettlement: 2,
  incomeMine: 1,
  /** Gold a round from a treasury, by level (the big treasury brings two). */
  incomeTreasury: [1, 2],
  /** Gold in a chest chosen instead of the artifact. */
  chestGold: 3,
  /** Cost of each level of a building. */
  cost: { barracks: [3, 6], market: [3, 5], hospital: [3, 5], treasury: [4, 6], forge: [], walls: [], tavern: [], magic: [], spark: [], shrine: [], nursery: [], grove: [], bloodPit: [], plunder: [], wolfDen: [], hoofStone: [], pastures: [], refuge: [] } as Record<BuildingId, number[]>,
  /** Price of an artifact in the market, by rarity (zwykły, rzadki, legendarny). */
  artifactPrice: [2, 5, 10],
  /** Offers in the market (the big market has more) and how many rounds an offer stays. */
  offers: [3, 5],
  stockRounds: 3,
  /** The coop automaton's reinforcements: its fallen supports return every this many rounds. */
  reinforceRounds: 3,
  /** The hospital brings a fallen support back for this share of its price (rounded up, at least 1): level 1 a half, level 2 a third. */
  heal: [2, 3],
  /** Settlements to conquer and mines on the map, by map size (even, half on each side). */
  settlements: { short: 2, medium: 4, long: 4, veryLong: 6, huge: 6, giant: 8 } as Record<string, number>,
  mines: { short: 2, medium: 2, long: 4, veryLong: 4, huge: 6, giant: 6 } as Record<string, number>,
  /** Places of the team: 2 at the start, +1 at hero level 3 and 6, +1 for upgraded barracks; never more than 5. */
  slotsBase: 2,
  slotsMax: 5,
};

/** What the hero pays for an artifact in the market: the rarity's price, less the Kapelusz Kupca discount (never below 1). */
export const artifactCost = (hero: HeroState, art: ArtifactDef): number =>
  Math.max(1, KINGDOM.artifactPrice[art.rarity - 1] - gearOf(hero).reduce((n, a) => n + (a.marketDiscount ?? 0), 0));

/** Prices of the recruits by tier (provisional: tuned with the simulations, docs/JEDNOSTKI_POZIOMU_3.md). */
export const RECRUIT_COSTS = [2, 3, 5, 8, 12];

/** The supports a faction can recruit, by tier: tier 1 are the supports it starts the game with in the other levels, tiers 2–5 are the new units (tiers 4–5 need upgraded barracks). */
/** The legendary unit of level 6: gold and Gwiezdny Pył, one per faction, in upgraded barracks. */
export const LEGEND = { gold: 20, dust: 3 };
export const LEGENDS: Record<FactionId, string> = byPack((p) => p.legend);
export interface Recruit { id: string; tier: number; cost: number; /** Gwiezdny Pył on top of the gold (the level 6 unit). */ dust?: number; /** The other unit of its tier (level 6 only). */ alt?: true }

/** Level 6: the second unit of tiers 2-5. Each unit of those tiers has a dwelling; a faction builds one dwelling per tier, which shuts the other out for the whole game. */
export const ALT_UNITS: Record<FactionId, string[]> = byPack((p) => p.altUnits);
export const DWELLING_NAMES: Record<string, string> = {
  hedgehog: 'Legowisko Jeżozwierzy', silverFox: 'Lisia Nora', centaur: 'Stajnie Centaurów', dawnOwl: 'Sowia Dziupla', boar: 'Dębowa Zagroda', dryadArcher: 'Gaj Driad', treeGuardian: 'Prastary Zagajnik', whiteStag: 'Polana Jeleni', dawnPhoenix: 'Gniazdo Feniksa',
  faunSlinger: 'Fauni Zagajnik', tarpan: 'Tarpanie Błonia', forestBison: 'Żubrza Ostoja', satyrLancer: 'Obóz Kopijników', steppeHippogriff: 'Gniazdo na Urwisku', drumElephant: 'Krąg Bębnów', warRhino: 'Błotne Brody', bullMoose: 'Łosie Mokradło', indrik: 'Źródło Indrika',
  ratman: 'Szczurze Nory', goblinSlinger: 'Obóz Procarzy', hellhound: 'Psiarnia Ogarów', gargoyle: 'Kamienna Grzęda', salamander: 'Popielna Jama', caveTroll: 'Trollowa Pieczara', minotaurChief: 'Labirynt Minotaurów', shadowWyvern: 'Gniazdo Wiwern', doomBehemoth: 'Jaskinia Zagłady',
};
/** What a dwelling does, in words (the unit's name in the genitive). */
const GENITIVE: Record<string, string> = {
  hedgehog: 'Jeżozwierza', silverFox: 'Srebrnego Lisa', centaur: 'Centaura', dawnOwl: 'Sowy Świtu', boar: 'Alabastrowego Odyńca', dryadArcher: 'Driady Łuczniczki', treeGuardian: 'Opiekuna Drzewa', whiteStag: 'Białego Jelenia', dawnPhoenix: 'Feniksa Świtu',
  faunSlinger: 'Fauna Procarza', tarpan: 'Tarpana', forestBison: 'Żubra Puszczańskiego', satyrLancer: 'Satyra Kopijnika', steppeHippogriff: 'Hipogryfa Stepowego', drumElephant: 'Słonia z Bębnem', warRhino: 'Nosorożca Bojowego', bullMoose: 'Łosia Rogacza', indrik: 'Indrika',
  ratman: 'Szczurołaka', goblinSlinger: 'Goblina Procarza', hellhound: 'Piekielnego Ogara', gargoyle: 'Gargulca', salamander: 'Salamandry Popiołu', caveTroll: 'Trolla Jaskiniowego', minotaurChief: 'Herszta Minotaurów', shadowWyvern: 'Wiwerny Cienia', doomBehemoth: 'Behemota Zagłady',
};
export const DWELLING_TEXTS: Record<string, string> = Object.fromEntries(Object.entries(GENITIVE).map(([id, g]) => [id, `Umożliwia wykupienie ${g} jako pomocnika.`]));
/** Price of a dwelling, by the tier of its unit (2-6; the tier 6 unit has one dwelling only, no alternative). */
export const DWELLING_COST: Cost[] = [{ gold: 2, wood: 1 }, { gold: 3, wood: 2 }, { gold: 4, ore: 2 }, { gold: 5, ore: 2, dust: 1 }, { gold: 6, ore: 3, dust: 2 }];

/** Every recruit of a faction by tier; tier 6 and the alternative units belong to level 6 only (list the offer of a game with `recruitsOf`). */
export const RECRUITS: Record<FactionId, Recruit[]> = byPack((p): Recruit[] => [
  ...p.supports.map((id) => ({ id, tier: 1, cost: RECRUIT_COSTS[0] })),
  ...p.tierUnits.map((id, i) => ({ id, tier: i + 2, cost: RECRUIT_COSTS[i + 1] })),
  ...p.altUnits.map((id, i) => ({ id, tier: i + 2, cost: RECRUIT_COSTS[i + 1], alt: true as const })),
  { id: p.legend, tier: 6, cost: LEGEND.gold, dust: LEGEND.dust },
]);

/** The recruits a faction may buy in this game, by tier (level 6: both units of tiers 2-5; which one can be recruited is `dwellingOf`). */
export const recruitsOf = (state: GameState, f: TeamId): Recruit[] => {
  const pastures = state.rules.empire ? Math.max(0, ...settlementsOf(state, f).map((s) => buildingLevel(s, 'pastures'))) : 0;
  return RECRUITS[raceOf(state, f)]
    .filter((r) => (r.tier < 6 && !r.alt) || Boolean(state.rules.empire))
    // Wielkie Pastwiska (the Herds): the recruits are cheaper by a gold piece (tiers 1-3, with the second level 1-5).
    .map((r) => (pastures >= 1 && r.tier <= (pastures >= 2 ? 5 : 3) ? { ...r, cost: Math.max(1, r.cost - FACTION_MECHANICS.pastureDiscount) } : r))
    .sort((a, b) => a.tier - b.tier);
};

/** Level 6: whether tiers 2-5 need a dwelling in this game. */
export const needsDwelling = (state: GameState, r: Recruit): boolean => Boolean(state.rules.empire) && r.tier >= 2 && r.tier <= 6;
/** Level 6: the unit whose dwelling the faction has built for this tier (undefined: none yet). */
export const dwellingOf = (state: GameState, f: TeamId, tier: number): string | undefined =>
  (state.kingdom?.dwellings?.[f] ?? []).find((id) => RECRUITS[raceOf(state, f)].find((r) => r.id === id)?.tier === tier);
/** Whether the faction may recruit this unit as far as dwellings go. */
export const dwellingReady = (state: GameState, f: TeamId, r: Recruit): boolean => !needsDwelling(state, r) || dwellingOf(state, f, r.tier) === r.id;

const NAMES: Record<FactionId, string[]> = byPack((p) => p.settlementNames);

export const BUILDING_NAMES: Record<BuildingId, string[]> = {
  barracks: ['Koszary', 'Rozbudowane koszary'],
  market: ['Targ', 'Duży targ'],
  hospital: ['Szpital', 'Ulepszony szpital'],
  treasury: ['Skarbiec', 'Wielki skarbiec'],
  forge: ['Kuźnia', 'Wielka kuźnia'],
  walls: ['Fosa', 'Mury z wieżyczkami'],
  tavern: ['Karczma'],
  magic: ['Wieża maga', 'Wielka wieża maga', 'Arcywieża maga'],
  spark: ['Pierwotna Iskra'],
  shrine: ['Kapliczka Świtu', 'Kapliczka Dwóch Promieni', 'Kapliczka Złotego Poranka', 'Wielka Kapliczka Świtu'],
  nursery: ['Szkółka Drzewa', 'Wielka szkółka Drzewa'],
  grove: ['Krąg Gaju'],
  bloodPit: ['Jama Krwi', 'Jama Szału', 'Jama Uczty', 'Wielka Jama Krwi'],
  plunder: ['Szabrownia'],
  wolfDen: ['Wilcze Legowisko'],
  hoofStone: ['Kamień Tętentu', 'Kamień Grzmiących Kopyt', 'Kamień Stu Stad', 'Wielki Kamień Tętentu'],
  pastures: ['Wielkie Pastwiska', 'Pastwiska bez Granic'],
  refuge: ['Ostoja Wędrówek'],
};

/** Level 6: the buildings only one faction has (the faction's mechanic first, then the two others). */
export const FACTION_BUILDINGS: Record<FactionId, BuildingId[]> = byPack((p) => p.buildings as BuildingId[]);
/** The faction's mechanic building: Kapliczka Świtu (Blask Świtu) or Jama Krwi (Żądza Krwi), four levels. */
export const MECHANIC_BUILDING: Record<FactionId, BuildingId> = byPack((p) => p.mechanic.building as BuildingId);

/** The buildings a settlement may have in this game, in the order of the screen (the forge comes with level 4). */
export const buildingsOf = (state: GameState): BuildingId[] => ['barracks', 'market', 'hospital', 'treasury', ...(state.rules.economy ? ['forge' as const, 'walls' as const] : []), ...(state.rules.realm ? ['tavern' as const, 'magic' as const] : []), ...(state.rules.empire ? ['spark' as const] : [])];

/** The buildings this faction can build in this game: the common ones and, from level 6, its own three (Kapliczka Świtu, Szkółka Drzewa, Krąg Gaju / Jama Krwi, Szabrownia, Wilcze Legowisko). */
export const buildingsFor = (state: GameState, f: TeamId): BuildingId[] => [...buildingsOf(state), ...(state.rules.empire ? FACTION_BUILDINGS[raceOf(state, f)] : [])];

export const buildingLevel = (s: Settlement, b: BuildingId): number => s.buildings[b] ?? 0;

/** The best forge among the faction's settlements (0: none). */
export const forgeLevel = (state: GameState, f: TeamId): number => (state.rules.economy ? Math.max(0, ...settlementsOf(state, f).map((s) => buildingLevel(s, 'forge'))) : 0);

const CIRCLE_WORDS = ['pierwszego', 'drugiego', 'trzeciego', 'czwartego', 'piątego'];
/** What each level of the mage tower teaches: one circle of spells per level (SPELL_CIRCLES). */
const circleTexts = (): string[] =>
  Array.from({ length: SPELL_CIRCLES }, (_, i) => `Uczy ${i ? 'też ' : 'bohaterów '}czarów ${CIRCLE_WORDS[i]} kręgu: ${circleSpells(i + 1).map((id) => SPELLS[id].name).join(', ')}.`);

export const BUILDING_TEXTS: Record<BuildingId, string[]> = {
  barracks: ['Pozwalają rekrutować pomocników.', 'Dodatkowe miejsce w drużynie i dostęp do najmocniejszych jednostek.'],
  market: ['Trzy artefakty w ofercie, nowa oferta co 3 rundy.', 'Pięć artefaktów w ofercie.'],
  hospital: ['Wskrzesza poległych pomocników za połowę ich ceny.', 'Wskrzesza za jedną trzecią ceny.'],
  treasury: ['Przynosi +1 złota na rundę.', 'Przynosi +2 złota na rundę (zamiast +1).'],
  forge: ['Pomocnicy całej frakcji walczą z +1 A.', 'Pomocnicy dostają też +1 Ż.'],
  shrine: [
    `Blask Świtu: na początku każdej rundy bitwy najciężej ranna jednostka Przymierza odzyskuje ${FACTION_MECHANICS.dawnHeal} Ż. Bez tego budynku frakcja nie ma tego efektu.`,
    `Blask Świtu leczy o ${FACTION_MECHANICS.dawnHeal + 1} Ż.`,
    'Blask Świtu leczy dwie najciężej ranne jednostki.',
    `Każda jednostka Przymierza zaczyna bitwę z +${FACTION_MECHANICS.dawnStartHp} Ż.`,
  ],
  bloodPit: [
    `Żądza Krwi: gdy w bitwie ginie wróg Hordy, wszystkie jej jednostki dostają +${FACTION_MECHANICS.hordeAttack} A do końca bitwy (raz na bitwę). Bez tego budynku frakcja nie ma tego efektu.`,
    'Żądza Krwi działa dwa razy w bitwie.',
    'Żądza Krwi działa trzy razy w bitwie.',
    `Przy Żądzy Krwi jednostki Hordy odzyskują też ${FACTION_MECHANICS.hordeHeal} Ż.`,
  ],
  nursery: ['+1 drewna na rundę (sumuje się ze wszystkich osad).', '+2 drewna na rundę (sumuje się ze wszystkich osad).'],
  grove: ['Bohater, który wchodzi na pole własnej osady, odnawia całą manę.'],
  plunder: [`Po wygranej z bohaterem lub strażnikiem frakcja dostaje +${FACTION_MECHANICS.plunderGold} zł (sumuje się ze wszystkich osad).`],
  wolfDen: ['Bohaterowie Hordy mają +1 punkt ruchu na mapie.'],
  hoofStone: [
    `Tętent: jednostka Stad, która przed atakiem wręcz przebiegła co najmniej ${FACTION_MECHANICS.herdsRun} pola, odpycha cel o 1 pole (zderzenie rani). Bez tego budynku frakcja nie ma tego efektu.`,
    `Zderzenia Stad ranią o ${FACTION_MECHANICS.herdsCollision} więcej.`,
    `Wystarczy rozbieg o ${FACTION_MECHANICS.herdsRunShort} pola.`,
    `Cel, który uderzył w coś po zderzeniu, ma −${FACTION_MECHANICS.herdsSlow} S w swojej następnej aktywacji.`,
  ],
  pastures: [`Rekrutacja pomocników poziomów 1–3 jest tańsza o ${FACTION_MECHANICS.pastureDiscount} zł.`, `Rekrutacja pomocników poziomów 1–5 jest tańsza o ${FACTION_MECHANICS.pastureDiscount} zł.`],
  refuge: ['Bohater stojący w osadzie z Ostoją może raz na rundę przenieść się do innej własnej osady z Ostoją.'],
  spark: ['Budynek Pierwotnej Iskry: jego ceną są wszystkie Odłamki z mapy. Daje frakcji wielką premię, a w celu „Relikt” wygrywa grę.'],
  magic: circleTexts(),
  tavern: ['Tu najmiesz dowódcę: drugiego bohatera z własnym pionkiem, doświadczeniem i artefaktami. Tu też wykupisz dowódcę, który poległ.'],
  walls: ['W bitwie o osadę wroga zatrzymuje fosa z kolcami: kto w nią wejdzie, traci turę i dostaje 2 obrażenia. Przejście jest tylko po moście.', 'Za fosą staje mur z bramą i dwie wieżyczki, które co rundę strzelają do napastników. Mur burzy tylko katapulta atakującego.'],
};

/** The coop Horde is steered by the automaton: it earns no gold and shops nowhere; reinforcements come to it instead. */
export const isAutomaton = (state: GameState, f: TeamId): boolean => state.setup.mode === 'coop' && f === 'horde';

/** A bot with this much gold walks home to spend it. */
export const KINGDOM_BIG_PILE = 12;

export const kingdomOn = (state: GameState): boolean => Boolean(state.kingdom);

export const goldOf = (state: GameState, f: TeamId): number => state.kingdom?.gold[f] ?? 0;

/** The settlement standing on `hex`, if any. */
export const settlementAt = (state: GameState, hex: HexKey): Settlement | undefined =>
  state.kingdom ? Object.values(state.kingdom.settlements).find((s) => s.at === hex) : undefined;

/** The faction's settlements. */
export const settlementsOf = (state: GameState, f: TeamId): Settlement[] =>
  state.kingdom ? Object.values(state.kingdom.settlements).filter((s) => s.owner === f) : [];

/** The supports standing in the faction's garrisons. */
export const garrisoned = (state: GameState, f: TeamId): string[] => settlementsOf(state, f).flatMap((s) => s.garrison ?? []);

/** Whether the faction has this unit already: in the team, fallen, or in a garrison (one unit of a kind per faction). */
export const hasUnit = (state: GameState, f: TeamId, id: string): boolean =>
  state.factions[f].supportsAlive.includes(id) || state.factions[f].supportsDead.includes(id) || garrisoned(state, f).includes(id);

/** The enemy settlement on `hex` that somebody defends from inside (a garrison), seen by faction `f`. */
export function garrisonAt(state: GameState, hex: HexKey, f: TeamId): Settlement | undefined {
  const s = settlementAt(state, hex);
  return s && s.owner && s.owner !== f && s.garrison?.length ? s : undefined;
}

/** Gold per round the faction earns now, with where it comes from. */
export function incomeBreakdown(state: GameState, f: TeamId): Array<{ label: string; gold: number }> {
  const k = state.kingdom;
  if (!k) return [];
  const rows: Array<{ label: string; gold: number }> = [];
  for (const s of Object.values(k.settlements)) {
    if (s.owner !== f) continue;
    rows.push({ label: s.name, gold: KINGDOM.incomeSettlement });
    if (s.buildings.treasury) rows.push({ label: `${BUILDING_NAMES.treasury[Math.min(s.buildings.treasury, 2) - 1]} (${s.name})`, gold: KINGDOM.incomeTreasury[Math.min(s.buildings.treasury, 2) - 1] });
  }
  for (const [hex, m] of Object.entries(k.mines)) if (m.owner === f) rows.push({ label: `${MINE_NAMES.gold} (pole ${hex})`, gold: KINGDOM.incomeMine });
  // Strój Kupca (three of three): +1 gold a round, once for the faction.
  const merchants = Object.values(state.heroes).filter((h) => h.faction === f && h.alive && completeSets(h).some((d) => d.income));
  if (merchants.length) rows.push({ label: SETS.merchant.name, gold: SETS.merchant.income! });
  // Easy: the help the level gives the Przymierza (tuning.ts).
  if (f === 'dawn' && state.rules.dawnGoldBonus) rows.push({ label: 'Pomoc na Łatwym poziomie', gold: state.rules.dawnGoldBonus });
  return rows;
}

export const incomeOf = (state: GameState, f: TeamId): number => incomeBreakdown(state, f).reduce((s, r) => s + r.gold, 0);

/** How many supports a faction brings into a battle: 2 in the other levels, the team's places here. */
export const supportSlots = (state: GameState, f: TeamId): number => (state.rules.arenaSize === 6 ? ARENA_SUPPORTS - (computerFaction(state, f) ? 0 : state.rules.arenaHandicap?.playerLess ?? 0) : state.kingdom ? teamSlots(state, f) : SUPPORTS_PER_BATTLE);

/** The 6 on 6 arena: the supports a side brings (with its hero that makes six) and the fixed pool it chooses them from, tiers 2-5 of both unit lines. */
export const ARENA_SUPPORTS = 5;
export const ARENA_POOL: Record<FactionId, string[]> = byPack((p) => [...p.tierUnits, ...p.altUnits]);

/** Places in the team: a hero of this faction at level 3 and 6, and upgraded barracks, each add one. */
export function teamSlots(state: GameState, f: TeamId): number {
  if (!state.kingdom) return 2;
  const heroes = Object.values(state.heroes).filter((h) => h.faction === f);
  const level = Math.max(1, ...heroes.map((h) => levelOf(h)));
  const barracks = settlementsOf(state, f).some((s) => s.buildings.barracks >= 2) ? 1 : 0;
  return Math.min(KINGDOM.slotsMax, KINGDOM.slotsBase + (level >= 3 ? 1 : 0) + (level >= 6 ? 1 : 0) + barracks);
}

// ------------------------------------------------------------------ the map

/** Settlements (the starting ones and the ones to conquer, each with its neutral defenders) and gold mines; called when a game is made. */
export function initKingdom(state: GameState): void {
  const teams = teamsOf(state);
  const k: KingdomState = { gold: byTeam(teams, () => KINGDOM.startGold), settlements: {}, mines: {}, chest: null };
  state.kingdom = k;
  if (state.rules.economy) {
    const res = byTeam(teams, () => ({ ...ECONOMY.start }));
    k.res = res;
    // The computer's start advantage of the highest difficulty (COMPUTER_HANDICAP): some resources more.
    for (const f of teams) if (computerFaction(state, f)) for (const r of RESOURCE_IDS) res[f][r] += state.rules.computerResources?.[r] ?? 0;
  }
  const rng = new Rng((state.setup.seed ^ 0x3c6ef372) | 0);
  const nameBag = byTeam(teams, (t) => rng.shuffle([...NAMES[raceOf(state, t)]]));
  // Level 6: the barracks stand from the start in every settlement (the dwellings of the units are built beside them).
  const empty = (): Record<BuildingId, number> => ({ barracks: state.rules.empire ? 1 : 0, market: 0, hospital: 0, treasury: 0, ...(state.rules.economy ? { forge: 0, walls: 0 } : {}), ...(state.rules.realm ? { tavern: 0, magic: 0 } : {}), ...(state.rules.empire ? { spark: 0, shrine: 0, nursery: 0, grove: 0, bloodPit: 0, plunder: 0, wolfDen: 0, hoofStone: 0, pastures: 0, refuge: 0 } : {}) }) as Record<BuildingId, number>;
  const add = (id: string, at: HexKey, land: TeamId, owner: TeamId | null) => {
    k.settlements[id] = { id, at, land, name: nameBag[land].pop() ?? `${FACTION_NAMES[raceOf(state, land)]} ${Object.keys(k.settlements).length + 1}`, owner, buildings: empty(), bought: [], boughtEpoch: -1 };
    state.tiles[at].place = { kind: 'settlement', id };
  };
  // The starting settlement stands on the base.
  for (const t of Object.values(state.tiles)) if (t.home) add(`start-${t.home}`, t.key, t.home, t.home);

  const homes = Object.values(state.tiles).filter((t) => t.home).map((t) => parseKey(t.key));
  const tree = Object.values(state.tiles).find((t) => t.tree);
  const near = (key: string, n: number) => [...homes, ...(tree ? [parseKey(tree.key)] : [])].some((h) => distance(h, parseKey(key)) <= n);
  const blocked = new Set<string>(Object.values(state.crystals).filter((c) => c.guardian && state.tiles[c.at]).map((c) => c.at));
  // A hex with a treasure may hold a settlement or a mine too (the maps are small): whoever steps there takes both. The first pass keeps a hex clear of the
  // bases and the Tree; a small map that cannot hold everything that way gets a second, looser pass.
  const free = (clear: number) => rng.shuffle(Object.values(state.tiles).filter((t) => !t.home && !t.tree && !t.crystalId && !t.site && !t.place && t.terrain !== 'bridge' && tileCost(t) !== null && !near(t.key, clear)));

  // Settlements to conquer: half on each side's land (the same number on both), spread apart, each guarded by a group a little stronger than a crystal's guardian.
  const want = (KINGDOM.settlements[state.setup.mapSize] ?? 2) / 2;
  const picked = byTeam(teams, (): string[] => []);
  const all = () => teams.flatMap((t) => picked[t]);
  for (const [clear, gap] of [[1, 2], [1, 1], [0, 1]] as const) {
    for (const land of teams) {
      for (const t of free(clear).filter((x) => x.side === land)) {
        if (picked[land].length >= want) break;
        if (all().some((c) => distance(parseKey(c), parseKey(t.key)) <= gap - 1 + (gap > 1 ? 1 : 0))) continue;
        if (!stillConnected(state, new Set([...blocked, ...all(), t.key]))) continue;
        picked[land].push(t.key);
      }
    }
  }
  // Both sides get the same number.
  const each = Math.min(...teams.map((t) => picked[t].length));
  const chosen = teams.flatMap((t) => picked[t].slice(0, each));
  const motifs = Object.keys(ENCOUNTER_MOTIFS) as EncounterMotif[];
  chosen.forEach((hex, i) => {
    const land = state.tiles[hex].side;
    add(`set${i + 1}`, hex, land, null);
    const units = encounterUnits(1, rng.pick(motifs), rng);
    const id = `def${i + 1}`;
    const crystal: Crystal = { id, guardian: units[0], at: hex, decoy: true, encounter: units, tier: 1 };
    state.crystals[id] = crystal;
    state.tiles[hex].crystalId = id;
  });

  // Level 6: the shards of the Pierwotna Iskra come before the mines and huts, so the smaller maps still have room for them.
  placeShards(state);

  // Gold mines: free hexes, not next to a settlement or a guardian.
  const wantMines = KINGDOM.mines[state.setup.mapSize] ?? 2;
  const taken: string[] = [...chosen];
  for (const clear of [1, 0]) {
    for (const t of free(clear)) {
      if (Object.keys(k.mines).length >= wantMines) break;
      if (taken.some((c) => distance(parseKey(c), parseKey(t.key)) <= 1) || mapNeighbors(state.tiles, t.key).some((n) => state.tiles[n].crystalId)) continue;
      k.mines[t.key] = { owner: null };
      state.tiles[t.key].place = { kind: 'mine', id: t.key };
      taken.push(t.key);
    }
  }
  // Level 4: mines of wood, ore and Gwiezdny Pył, placed like the gold ones.
  if (k.res) {
    for (const res of RESOURCE_IDS) {
      const want = ECONOMY.mines[res][state.setup.mapSize] ?? 1;
      let placed = 0;
      // Three passes, looser each time: the small maps hold few free hexes.
      for (const [clear, gap] of [[1, 1], [0, 1], [0, 0]] as const) {
        for (const t of free(clear)) {
          if (placed >= want) break;
          if (taken.some((c) => distance(parseKey(c), parseKey(t.key)) <= gap) || (gap > 0 && mapNeighbors(state.tiles, t.key).some((n) => state.tiles[n].crystalId))) continue;
          k.mines[t.key] = { owner: null, res };
          state.tiles[t.key].place = { kind: 'mine', id: t.key };
          taken.push(t.key);
          placed++;
        }
      }
    }
  }
  // Level 4: huts with a quest (bring something, get something worth half as much again), placed like the mines.
  if (k.res) {
    k.huts = {};
    const want = ECONOMY.huts[state.setup.mapSize] ?? 1;
    for (const [clear, gap] of [[1, 1], [0, 1], [0, 0]] as const) {
      for (const t of free(clear)) {
        if (Object.keys(k.huts).length >= want) break;
        if (taken.some((c) => distance(parseKey(c), parseKey(t.key)) <= gap) || (gap > 0 && mapNeighbors(state.tiles, t.key).some((n) => state.tiles[n].crystalId))) continue;
        k.huts[t.key] = makeHut(rng);
        state.tiles[t.key].place = { kind: 'hut', id: t.key };
        taken.push(t.key);
      }
    }
  }
  // Level 4: the map's own objects (a mill, a store of a resource, a well), placed like the huts.
  if (k.res) {
    k.objects = {};
    const want = OBJECTS.count[state.setup.mapSize] ?? 1;
    for (const [clear, gap] of [[1, 1], [0, 1], [0, 0]] as const) {
      for (const t of free(clear)) {
        const n = Object.keys(k.objects).length;
        if (n >= want) break;
        if (taken.some((c) => distance(parseKey(c), parseKey(t.key)) <= gap) || (gap > 0 && mapNeighbors(state.tiles, t.key).some((x) => state.tiles[x].crystalId))) continue;
        const kind = OBJECTS.order[n % OBJECTS.order.length];
        const res = kind === 'store' ? rng.pick(RESOURCE_IDS) : undefined;
        k.objects[t.key] = kind === 'store' ? { kind, res, amount: OBJECTS.store[res!] } : { kind };
        state.tiles[t.key].place = { kind: 'object', id: t.key };
        taken.push(t.key);
      }
    }
  }
  // Every faction starts with its three tier-1 supports, as in the other levels; the recruits are the new tiers (RECRUITS, docs/JEDNOSTKI_POZIOMU_3.md).
}

/** A quest: what the hut asks for and what it pays (about `hutProfit` times as much, in a different thing). */
function makeHut(rng: Rng): Hut {
  const V = ECONOMY.value;
  const kinds = ['gold', 'gold', 'gold', 'wood', 'wood', 'ore', 'ore', 'dust', 'artifact'] as const;
  const ask = rng.pick([...kinds]);
  const amount = ask === 'gold' ? 4 + rng.int(4) : ask === 'dust' ? 1 + rng.int(2) : ask === 'artifact' ? 1 : 3 + rng.int(3);
  const worth = amount * V[ask];
  const gives = rng.pick((['gold', 'wood', 'ore', 'dust', 'xp', 'artifact'] as const).filter((r) => r !== ask));
  const pay = worth * ECONOMY.hutProfit;
  const reward: Hut['reward'] = gives === 'artifact' ? { artifact: true } : { [gives]: Math.max(1, Math.round(pay / V[gives])) };
  return { want: ask === 'artifact' ? { artifact: true } : { [ask]: amount }, reward, done: false };
}

/** A hero ends its move on a settlement or a mine: it passes to the hero's faction (a settlement still guarded cannot be stood on). */
export function enterPlace(state: GameState, hero: HeroState): void {
  const k = state.kingdom;
  const place = state.tiles[hero.pos]?.place;
  if (!k || !place) return;
  if (place.kind === 'shard') return pickUpShard(state, hero);
  const name = UNITS[hero.id].name;
  if (place.kind === 'settlement') {
    const s = k.settlements[place.id];
    if (s.owner === hero.faction) return;
    const before = s.owner;
    s.owner = hero.faction;
    s.garrison = [];
    log(state, 'info', `${name} zajmuje osadę ${s.name}${before ? ` (należała do: ${FACTION_NAMES[raceOf(state, before)]})` : ''}.`);
    firstPlaceGold(state, hero);
  } else if (place.kind === 'mine') {
    const m = k.mines[place.id];
    if (m.owner === hero.faction) return;
    m.owner = hero.faction;
    log(state, 'info', `${name} zajmuje: ${MINE_NAMES[m.res ?? 'gold'].toLowerCase()}.`);
    firstPlaceGold(state, hero);
  } else if (place.kind === 'object') {
    const o = k.objects?.[place.id];
    if (!o || !objectReady(o, state.round)) return;
    if (o.kind === 'mill') {
      o.used = state.round;
      k.gold[hero.faction] += OBJECTS.millGold;
      log(state, 'info', `${name} zabiera z młyna ${OBJECTS.millGold} zł (młyn miele znów za ${OBJECTS.millRounds} rundy).`);
      lootEvent(state, hero, OBJECTS.millGold);
    } else if (o.kind === 'well') {
      // Only the hero whose turn it is can use the extra steps.
      if (state.heroes[state.turnOrder[state.turnIndex]]?.id !== hero.id) return;
      o.used = state.round;
      state.movePoints += OBJECTS.wellMove;
      log(state, 'info', `${name} pije ze Studni Wędrowców: +${OBJECTS.wellMove} do ruchu w tej turze.`);
    } else if (k.res) {
      o.done = true;
      k.res[hero.faction][o.res!] += o.amount!;
      log(state, 'info', `${name} opróżnia ${OBJECT_NAMES.store.toLowerCase()}: ${o.amount} × ${RESOURCE_NAMES[o.res!]}.`);
      lootEvent(state, hero, 0, { [o.res!]: o.amount! });
    }
  }
}

/** Announces gold and resources a hero just took: the event rides on the log line just written (the screen floats it over the hero, with a sound). */
function lootEvent(state: GameState, hero: HeroState, gold: number, res: Partial<Record<ResourceId, number>> = {}): void {
  const got = Object.fromEntries(Object.entries(res).filter(([, n]) => n)) as Partial<Record<ResourceId, number>>;
  const last = state.log[state.log.length - 1];
  if ((!gold && !Object.keys(got).length) || !last || last.event) return;
  last.event = { type: 'loot', heroId: hero.id, ...(gold ? { gold } : {}), ...(Object.keys(got).length ? { res: got } : {}) };
}

/** Buty Handlarza: the first place the hero takes pays a gold coin, once. */
function firstPlaceGold(state: GameState, hero: HeroState): void {
  const gold = gearOf(hero).reduce((n, a) => n + (a.firstPlaceGold ?? 0), 0);
  if (!gold || hero.placeGoldPaid) return;
  hero.placeGoldPaid = true;
  state.kingdom!.gold[hero.faction] += gold;
  log(state, 'info', `${UNITS[hero.id].name} dostaje ${gold} zł za pierwsze zajęcie miejsca (Buty Handlarza).`);
  lootEvent(state, hero, gold);
}

/** The end of a round: every faction collects its income. */
export function collectIncome(state: GameState): void {
  const k = state.kingdom;
  if (!k) return;
  for (const f of teamsOf(state)) {
    if (isAutomaton(state, f)) {
      // Reinforcements instead of gold: every few rounds the fallen supports of the automaton are back at the base.
      const fs = state.factions[f];
      if (state.round % KINGDOM.reinforceRounds === 0 && fs.supportsDead.length) {
        log(state, 'info', `Posiłki Hordy: wracają ${fs.supportsDead.map((id) => UNITS[id].name).join(', ')}.`);
        fs.supportsAlive.push(...fs.supportsDead);
        fs.supportsDead = [];
      }
      continue;
    }
    // The computer's advantage of the higher levels: its income is multiplied (COMPUTER_HANDICAP); the people's is not.
    const mult = computerFaction(state, f) ? state.rules.computerGold ?? 1 : 1;
    if (k.res) {
      const got = resourceIncomeOf(state, f);
      if (mult !== 1) for (const r of RESOURCE_IDS) got[r] = Math.round(got[r] * mult);
      const parts = RESOURCE_IDS.filter((r) => got[r] > 0).map((r) => `${got[r]} × ${RESOURCE_NAMES[r]}`);
      for (const r of RESOURCE_IDS) k.res[f][r] += got[r];
      if (parts.length) log(state, 'info', `${FACTION_NAMES[raceOf(state, f)]}: surowce ${parts.join(', ')}.`, f);
    }
    const income = Math.round(incomeOf(state, f) * mult);
    if (income <= 0) continue;
    k.gold[f] += income;
    log(state, 'info', `${FACTION_NAMES[raceOf(state, f)]}: dochód ${income} zł (razem ${k.gold[f]}).`, f);
  }
}

// ------------------------------------------------------------------ the market

const marketEpoch = (state: GameState) => Math.floor((state.round - 1) / KINGDOM.stockRounds);

/** The market's offer now: artifacts drawn from the game's seed, fresh every `stockRounds` rounds, minus what was bought in this period. */
export function marketStock(state: GameState, s: Settlement): string[] {
  const n = KINGDOM.offers[s.buildings.market >= 2 ? 1 : 0];
  const epoch = marketEpoch(state);
  const rng = new Rng((state.setup.seed ^ 0x1f83d9ab ^ (epoch * 7919) ^ (s.at.length * 131 + s.id.length * 17)) | 0);
  const picks: string[] = [];
  while (picks.length < n) {
    const roll = rng.int(10);
    const rarity: Rarity = roll < 6 ? 1 : roll < 9 ? 2 : 3;
    const art = rng.pick(artifactPool(state, rarity));
    if (!picks.includes(art.id)) picks.push(art.id);
  }
  return s.boughtEpoch === epoch ? picks.filter((id) => !s.bought.includes(id)) : picks;
}

// ------------------------------------------------------------------ actions

function serviceSettlement(state: GameState, id: string): { s: Settlement; hero: HeroState } {
  const k = state.kingdom;
  const hero = state.phase === 'adventure' ? state.heroes[state.turnOrder[state.turnIndex]] : undefined;
  const s = k?.settlements[id];
  if (!k || !s) throw new Error('Nie ma takiej osady.');
  if (!hero?.alive) throw new Error('Teraz nie ma bohatera w turze.');
  // Shopping needs no walk: the settlement only has to be the faction's (the active hero is the buyer of artifacts).
  if (s.owner !== hero.faction) throw new Error('Ta osada nie należy do twojej frakcji.');
  return { s, hero };
}

/** What learning a spell costs. */
export const spellPrice = (spell: SpellId): Cost => MAGIC.price[SPELLS[spell].circle - 1];

/** The own settlement with an Ostoja Wędrówek the hero stands in (null: there is none). */
export function refugeHere(state: GameState, hero: HeroState): Settlement | null {
  if (!state.rules.empire) return null;
  return Object.values(state.kingdom?.settlements ?? {}).find((s) => s.at === hero.pos && s.owner === hero.faction && buildingLevel(s, 'refuge') >= 1) ?? null;
}

/** The own settlements with an Ostoja the hero could jump to now (empty when it cannot jump this round). */
export function refugeTargets(state: GameState, hero: HeroState): Settlement[] {
  const from = refugeHere(state, hero);
  if (!from || hero.refugeRound === state.round) return [];
  return settlementsOf(state, hero.faction).filter((s) => s.id !== from.id && buildingLevel(s, 'refuge') >= 1);
}

/** Puts a hero that appears in a settlement on its hex, or on the nearest free one when somebody stands there (one hero per hex outside the bases). */
function standIn(state: GameState, hero: HeroState, at: HexKey): void {
  const taken = (k: HexKey) => Object.values(state.heroes).some((h) => h.alive && !h.entering && h.id !== hero.id && h.pos === k);
  const open = (k: HexKey) => tileCost(state.tiles[k]) !== null && !(state.tiles[k].crystalId && state.crystals[state.tiles[k].crystalId!].guardian) && (!taken(k) || (state.tiles[k].home === hero.faction && !Object.values(state.heroes).some((h) => h.alive && h.pos === k && h.faction !== hero.faction)));
  if (open(at)) {
    hero.pos = at;
    return;
  }
  const origin = parseKey(at);
  const free = Object.keys(state.tiles).filter(open).sort((a, b) => distance(origin, parseKey(a)) - distance(origin, parseKey(b)) || (a < b ? -1 : 1));
  hero.pos = free[0] ?? at;
  state.tiles[hero.pos].revealed = true;
}

function pay(state: GameState, f: TeamId, price: number) {
  const k = state.kingdom!;
  if (k.gold[f] < price) throw new Error(`Za mało złota (potrzeba ${price}).`);
  k.gold[f] -= price;
}

/** What it costs to build or upgrade a building next (null: it is complete). */
export const nextCost = (s: Settlement, b: BuildingId): number | null => KINGDOM.cost[b][buildingLevel(s, b)] ?? null;

/** The full price of the next level of a building: gold only in level 3, gold and resources in level 4 (null: it is complete). */
export function buildCost(state: GameState, s: Settlement, b: BuildingId): Cost | null {
  if (state.rules.economy) return ECONOMY.cost[b]?.[buildingLevel(s, b)] ?? null;
  const gold = nextCost(s, b);
  return gold === null ? null : { gold };
}

/** Gold for one unit of a resource bought in this settlement (the market there makes it cheaper). */
export const tradeBuyPrice = (s: Settlement, res: ResourceId): number => ECONOMY.tradeBuy[res][Math.min(2, buildingLevel(s, 'market'))];

/** What an artifact costs in the market for this hero: gold, and Gwiezdny Pył for a legendary one in level 4. */
export const artifactBill = (state: GameState, hero: HeroState, art: ArtifactDef): Cost => ({
  gold: artifactCost(hero, art),
  ...(state.rules.economy && art.rarity === 3 ? { dust: ECONOMY.legendaryDust } : {}),
});

export const resOf = (state: GameState, f: TeamId): Resources => state.kingdom?.res?.[f] ?? emptyResources();

export function canPay(state: GameState, f: TeamId, c: Cost): boolean {
  const k = state.kingdom;
  return Boolean(k) && k!.gold[f] >= c.gold && RESOURCE_IDS.every((r) => resOf(state, f)[r] >= (c[r] ?? 0));
}

/** Pays a price from the faction's stock (throws, naming what is missing). */
export function payCost(state: GameState, f: TeamId, c: Cost): void {
  const k = state.kingdom!;
  const missing = [...(k.gold[f] < c.gold ? [`${c.gold - k.gold[f]} zł`] : []), ...RESOURCE_IDS.filter((r) => resOf(state, f)[r] < (c[r] ?? 0)).map((r) => `${c[r]! - resOf(state, f)[r]} × ${RESOURCE_NAMES[r]}`)];
  if (k.gold[f] < c.gold && missing.length === 1) throw new Error(`Za mało złota (potrzeba ${c.gold}).`);
  if (missing.length) throw new Error(`Brakuje: ${missing.join(', ')}.`);
  k.gold[f] -= c.gold;
  for (const r of RESOURCE_IDS) if (c[r]) k.res![f][r] -= c[r]!;
}

/**
 * Which building's first level must stand in the settlement before another can be started (docs/BUDYNKI.md 0a: a tree, one parent each;
 * the Rada Osady, the root, is always there; the Iskra needs only the shards, the dwellings the barracks, see `kingdomDwelling`).
 */
export const BUILDING_PARENT: Partial<Record<BuildingId, BuildingId>> = { forge: 'barracks', walls: 'barracks', hospital: 'barracks', magic: 'hospital', tavern: 'market', shrine: 'hospital', grove: 'magic', nursery: 'treasury', bloodPit: 'forge', wolfDen: 'walls', plunder: 'market', hoofStone: 'barracks', pastures: 'market', refuge: 'tavern' };

/** Why a building cannot be started here for lack of its parent (null: nothing in the way). Upgrades of a standing building are never blocked. */
export function buildBlock(s: Settlement, b: BuildingId): string | null {
  const parent = BUILDING_PARENT[b];
  if (!parent || buildingLevel(s, b) >= 1 || buildingLevel(s, parent) >= 1) return null;
  return `Najpierw: ${BUILDING_NAMES[parent][0]}.`;
}

/** Resources per round the faction earns now, with where they come from. */
export function resourceIncomeBreakdown(state: GameState, f: TeamId): Array<{ label: string; res: ResourceId; amount: number }> {
  const k = state.kingdom;
  if (!k?.res) return [];
  const rows: Array<{ label: string; res: ResourceId; amount: number }> = [];
  for (const s of Object.values(k.settlements)) {
    if (s.owner !== f) continue;
    for (const r of RESOURCE_IDS) if (ECONOMY.incomeSettlement[r]) rows.push({ label: s.name, res: r, amount: ECONOMY.incomeSettlement[r] });
  }
  for (const [hex, m] of Object.entries(k.mines)) if (m.owner === f && m.res) rows.push({ label: `${MINE_NAMES[m.res]} (pole ${hex})`, res: m.res, amount: ECONOMY.incomeMine[m.res] });
  // Level 6, the Przymierze: the Szkółka Drzewa gives wood, a level at a time, from every settlement that has one.
  const nursery = state.rules.empire ? summedLevel(state, f, 'nursery') : 0;
  if (nursery) rows.push({ label: 'Szkółka Drzewa', res: 'wood', amount: nursery * FACTION_MECHANICS.nurseryWood });
  return rows;
}

export const resourceIncomeOf = (state: GameState, f: TeamId): Resources => {
  const out = emptyResources();
  for (const row of resourceIncomeBreakdown(state, f)) out[row.res] += row.amount;
  return out;
};

/** Recruiting, healing and trading are for the land's own faction: a captured foreign settlement gives income, the market and the hospital only. */
export const mayRecruit = (s: Settlement, f: TeamId) => s.land === f && s.owner === f;

export function kingdomAction(state: GameState, action: Action): void {
  const k = state.kingdom;
  if (!k) throw new Error('To nie jest poziom Osada.');
  switch (action.type) {
    case 'kingdomBuild': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      const b = action.building;
      if (b === 'spark') {
        // Level 6: the Iskra costs every shard of the game, carried by the faction's heroes; the builder stands in the settlement.
        if (!state.rules.empire) throw new Error('Pierwotna Iskra jest dopiero na poziomie Imperium.');
        if (buildingLevel(s, 'spark') > 0) throw new Error('Ten budynek jest już w pełni rozbudowany.');
        if (hero.pos !== s.at) throw new Error('Pierwotną Iskrę wznosi bohater stojący w osadzie.');
        if (!mayBuildSpark(state, hero)) throw new Error('Do Pierwotnej Iskry potrzeba wszystkich Odłamków przy jednym bohaterze.');
        spendShards(state, hero.faction);
        s.buildings.spark = 1;
        log(state, 'crystal', `${FACTION_NAMES[raceOf(state, hero.faction)]} wznosi w osadzie ${s.name} budynek: ${SPARK_NAMES[raceOf(state, hero.faction)]}.`, undefined, { type: 'fx', kind: 'iskra', hex: s.at });
        break;
      }
      if (!buildingsFor(state, hero.faction).includes(b)) throw new Error('Ten budynek nie jest dostępny dla tej frakcji na tym poziomie gry.');
      const price = buildCost(state, s, b);
      if (price === null) throw new Error('Ten budynek jest już w pełni rozbudowany.');
      if (b === 'barracks' && s.land !== hero.faction) throw new Error('Obcej osady nie rozbudujesz o koszary.');
      const block = buildBlock(s, b);
      if (block) throw new Error(block);
      payCost(state, hero.faction, price);
      s.buildings[b] = buildingLevel(s, b) + 1;
      log(state, 'info', `${FACTION_NAMES[raceOf(state, hero.faction)]}: ${BUILDING_NAMES[b][s.buildings[b] - 1]} w osadzie ${s.name} (${costText(price)}).`);
      break;
    }
    case 'kingdomRecruit': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      if (!mayRecruit(s, hero.faction) || s.buildings.barracks < 1) throw new Error('Tu nie da się rekrutować: potrzebne koszary w osadzie własnej frakcji.');
      const entry = recruitsOf(state, hero.faction).find((r) => r.id === action.unitId);
      if (!entry) throw new Error('Tej jednostki nie ma w ofercie.');
      if (entry.tier >= 4 && s.buildings.barracks < 2) throw new Error('Tę jednostkę rekrutuje się w rozbudowanych koszarach.');
      if (!dwellingReady(state, hero.faction, entry)) throw new Error(dwellingOf(state, hero.faction, entry.tier) ? 'Frakcja wybrała już inne siedlisko tego poziomu.' : 'Najpierw zbuduj siedlisko tej jednostki.');
      const fs = state.factions[hero.faction];
      if (hasUnit(state, hero.faction, entry.id)) throw new Error('Ta jednostka jest już w twojej drużynie.');
      payCost(state, hero.faction, { gold: entry.cost, ...(entry.dust ? { dust: entry.dust } : {}) });
      fs.supportsAlive.push(entry.id);
      log(state, 'info', `${FACTION_NAMES[raceOf(state, hero.faction)]} rekrutuje: ${UNITS[entry.id].name} (${costText({ gold: entry.cost, ...(entry.dust ? { dust: entry.dust } : {}) })}).`);
      break;
    }
    case 'kingdomHeal': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      if (s.buildings.hospital < 1) throw new Error('W tej osadzie nie ma szpitala.');
      const fs = state.factions[hero.faction];
      if (!fs.supportsDead.includes(action.unitId)) throw new Error('Ta jednostka nie poległa.');
      const base = RECRUITS[raceOf(state, hero.faction)].find((r) => r.id === action.unitId)?.cost ?? 2;
      const price = Math.max(1, Math.ceil(base / KINGDOM.heal[s.buildings.hospital >= 2 ? 1 : 0]));
      pay(state, hero.faction, price);
      fs.supportsDead = fs.supportsDead.filter((id) => id !== action.unitId);
      fs.supportsAlive.push(action.unitId);
      log(state, 'info', `${FACTION_NAMES[raceOf(state, hero.faction)]}: w szpitalu wraca ${UNITS[action.unitId].name} (${price} zł).`);
      break;
    }
    case 'kingdomBuyArtifact': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      if (s.buildings.market < 1) throw new Error('W tej osadzie nie ma targu.');
      const stock = marketStock(state, s);
      if (!stock.includes(action.artifactId)) throw new Error('Tego artefaktu nie ma dziś w ofercie.');
      const art = ARTIFACT_BY_ID[action.artifactId];
      payCost(state, hero.faction, artifactBill(state, hero, art));
      const epoch = marketEpoch(state);
      if (s.boughtEpoch !== epoch) s.bought = [];
      s.boughtEpoch = epoch;
      s.bought.push(art.id);
      giveArtifact(state, hero, art, `targ w osadzie ${s.name}`);
      break;
    }
    case 'kingdomTrade': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      if (!k.res) throw new Error('Wymiana surowców jest dopiero na poziomie Księstwo.');
      const f = hero.faction;
      if (action.dir === 'buy') {
        const price = tradeBuyPrice(s, action.res);
        pay(state, f, price);
        k.res[f][action.res] += 1;
        log(state, 'info', `${FACTION_NAMES[raceOf(state, f)]} kupuje: ${RESOURCE_NAMES[action.res]} (${price} zł).`, f);
      } else {
        if (buildingLevel(s, 'market') < 1) throw new Error('Surowce sprzedaje się na targu.');
        if (k.res[f][action.res] < 1) throw new Error(`Brakuje: 1 × ${RESOURCE_NAMES[action.res]}.`);
        k.res[f][action.res] -= 1;
        k.gold[f] += ECONOMY.tradeSell[action.res];
        log(state, 'info', `${FACTION_NAMES[raceOf(state, f)]} sprzedaje: ${RESOURCE_NAMES[action.res]} (${ECONOMY.tradeSell[action.res]} zł).`, f);
      }
      break;
    }
    case 'kingdomSwap': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      if (!k.res) throw new Error('Wymiana surowców jest dopiero na poziomie Księstwo.');
      const f = hero.faction;
      if (action.from === action.to) throw new Error('Wybierz dwa różne surowce.');
      if (buildingLevel(s, 'market') < 1) throw new Error('Surowce wymienia się na targu.');
      if (k.res[f][action.from] < 1) throw new Error(`Brakuje: 1 × ${RESOURCE_NAMES[action.from]}.`);
      // One sale and one purchase at the market's prices: the gold from the sale goes toward the price of the other resource.
      const sell = ECONOMY.tradeSell[action.from];
      const price = tradeBuyPrice(s, action.to);
      if (k.gold[f] + sell < price) throw new Error(`Za mało złota (potrzeba ${price - sell}).`);
      k.res[f][action.from] -= 1;
      k.gold[f] += sell - price;
      k.res[f][action.to] += 1;
      log(state, 'info', `${FACTION_NAMES[raceOf(state, f)]} wymienia: ${RESOURCE_NAMES[action.from]} na ${RESOURCE_NAMES[action.to]} (${price - sell} zł dopłaty).`, f);
      break;
    }
    case 'kingdomDwelling': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      const f = hero.faction;
      const entry = recruitsOf(state, f).find((r) => r.id === action.unitId);
      if (!state.rules.empire || !entry || !needsDwelling(state, entry)) throw new Error('Siedliska jednostek są dopiero na poziomie Imperium.');
      if (!mayRecruit(s, f) || s.buildings.barracks < 1) throw new Error('Siedlisko buduje się w osadzie własnej frakcji, przy koszarach.');
      if (dwellingOf(state, f, entry.tier)) throw new Error('Frakcja ma już siedlisko tego poziomu: drugie jest wykluczone.');
      if (entry.tier > 2 && !dwellingOf(state, f, entry.tier - 1)) throw new Error(`Najpierw zbuduj siedlisko jednostki poziomu ${entry.tier - 1}.`);
      const price = DWELLING_COST[entry.tier - 2];
      payCost(state, f, price);
      ((k.dwellings ??= byTeam(teamsOf(state), (): string[] => []))[f]).push(entry.id);
      log(state, 'info', `${FACTION_NAMES[raceOf(state, f)]} buduje siedlisko: ${DWELLING_NAMES[entry.id]} (${costText(price)}). Od teraz rekrutuje: ${UNITS[entry.id].name}.`);
      break;
    }
    case 'kingdomLearn': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      if (!state.rules.realm) throw new Error('Czary są dopiero na poziomie Królestwo.');
      if (!towerSpells(buildingLevel(s, 'magic')).includes(action.spell)) throw new Error('Tego czaru nie uczy wieża maga tej osady.');
      if (hero.spells?.includes(action.spell)) throw new Error('Bohater zna już ten czar.');
      payCost(state, hero.faction, spellPrice(action.spell));
      (hero.spells ??= []).push(action.spell);
      log(state, 'info', `${UNITS[hero.id].name} uczy się czaru: ${SPELLS[action.spell].name} (${costText(spellPrice(action.spell))}).`);
      break;
    }
    case 'kingdomHire': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      if (!state.rules.realm) throw new Error('Dowódców najmuje się dopiero na poziomie Królestwo.');
      if (buildingLevel(s, 'tavern') < 1) throw new Error('W tej osadzie nie ma karczmy.');
      if (!hero.playerId) throw new Error('Dowódców najmują gracze.');
      if (commanderOf(state, hero.playerId)) throw new Error('Masz już dowódcę: gracz prowadzi jednego.');
      if (!freeCommanders(state, hero.faction).includes(action.unitId)) throw new Error('Tego dowódcy nie ma w karczmie.');
      pay(state, hero.faction, REALM.hireGold);
      const fresh: HeroState = { id: action.unitId, faction: hero.faction, playerId: hero.playerId, pos: s.at, alive: true, crystals: [], secondary: true, name: commanderName(state, action.unitId), kind: HERO_TYPES[action.unitId] };
      state.heroes[fresh.id] = fresh;
      standIn(state, fresh, s.at);
      log(state, 'info', `${FACTION_NAMES[raceOf(state, hero.faction)]} najmuje dowódcę: ${heroLabel(fresh)} (${REALM.hireGold} zł). Rusza od następnej rundy.`);
      break;
    }
    case 'kingdomRefuge': {
      // Ostoja Wędrówek: from a settlement with an Ostoja to another own one, once a round (the hero keeps its move points).
      const { s: to, hero } = serviceSettlement(state, action.settlementId);
      const from = refugeHere(state, hero);
      if (!from) throw new Error('Bohater musi stać w własnej osadzie z Ostoją Wędrówek.');
      if (to.id === from.id || buildingLevel(to, 'refuge') < 1) throw new Error('Cel skoku musi być inną własną osadą z Ostoją Wędrówek.');
      if (hero.refugeRound === state.round) throw new Error('Ostoja przenosi bohatera raz na rundę.');
      hero.refugeRound = state.round;
      standIn(state, hero, to.at);
      revealAround(state, hero.pos);
      log(state, 'info', `${heroLabel(hero)} przenosi się przez Ostoję Wędrówek do osady ${to.name}.`, hero.faction);
      break;
    }
    case 'kingdomRansom': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      if (buildingLevel(s, 'tavern') < 1) throw new Error('W tej osadzie nie ma karczmy.');
      const fallen = state.heroes[action.heroId];
      if (!fallen?.secondary || fallen.playerId !== hero.playerId) throw new Error('To nie jest twój dowódca.');
      if (!mayRansom(state, fallen)) throw new Error(fallen.alive ? 'Ten dowódca żyje.' : 'Tego dowódcy nie da się teraz wykupić.');
      const price = ransomPrice(fallen);
      pay(state, hero.faction, price);
      fallen.alive = true;
      delete fallen.fallen;
      fallen.crystals = [];
      standIn(state, fallen, s.at);
      log(state, 'info', `${FACTION_NAMES[raceOf(state, hero.faction)]} wykupuje dowódcę: ${heroLabel(fallen)} (${price} zł). Rusza od następnej rundy.`);
      break;
    }
    case 'kingdomGarrison': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      if (!state.rules.economy) throw new Error('Garnizon jest dopiero na poziomie Księstwo.');
      if (hero.pos !== s.at) throw new Error('Garnizon zmienia bohater stojący w osadzie.');
      const fs = state.factions[hero.faction];
      const g = (s.garrison ??= []);
      if (action.dir === 'in') {
        if (!fs.supportsAlive.includes(action.unitId)) throw new Error('Tej jednostki nie ma w drużynie.');
        if (g.length >= SIEGE.garrisonMax) throw new Error(`Garnizon mieści ${SIEGE.garrisonMax} jednostki.`);
        fs.supportsAlive.splice(fs.supportsAlive.indexOf(action.unitId), 1);
        g.push(action.unitId);
        log(state, 'info', `${UNITS[action.unitId].name} zostaje w garnizonie osady ${s.name}.`);
      } else {
        if (!g.includes(action.unitId)) throw new Error('Tej jednostki nie ma w garnizonie.');
        g.splice(g.indexOf(action.unitId), 1);
        fs.supportsAlive.push(action.unitId);
        log(state, 'info', `${UNITS[action.unitId].name} wraca z garnizonu osady ${s.name} do drużyny.`);
      }
      break;
    }
    case 'hutDeliver': {
      const hero = state.phase === 'adventure' ? state.heroes[state.turnOrder[state.turnIndex]] : undefined;
      const hut = hero ? k.huts?.[hero.pos] : undefined;
      if (!hero?.alive || !hut) throw new Error('Tu nie ma chatki.');
      if (hut.done) throw new Error('Ta chatka dostała już, czego chciała.');
      const f = hero.faction;
      const cost: Cost = { gold: hut.want.gold ?? 0, wood: hut.want.wood, ore: hut.want.ore, dust: hut.want.dust };
      const pickArtifact = () => [...(hero.pack ?? [])].sort((a, b) => ARTIFACT_BY_ID[a].rarity - ARTIFACT_BY_ID[b].rarity)[0];
      if (hut.want.artifact && !pickArtifact()) throw new Error('Chatka chce artefaktu z plecaka, a plecak jest pusty.');
      payCost(state, f, cost);
      if (hut.want.artifact) {
        const id = pickArtifact();
        hero.pack!.splice(hero.pack!.indexOf(id), 1);
      }
      const r = hut.reward;
      k.gold[f] += r.gold ?? 0;
      for (const res of RESOURCE_IDS) if (r[res]) k.res![f][res] += r[res]!;
      if (r.artifact) giveArtifact(state, hero, drawArtifact(state, hero, ARTIFACT_ODDS.chest, 0x7a3f1c5d), 'chatka');
      if (r.xp) awardXp(state, hero, r.xp, 'zadanie z chatki');
      hut.done = true;
      log(state, 'info', `${UNITS[hero.id].name} załatwia zadanie chatki: oddaje ${thingsText(hut.want)}, dostaje ${thingsText(hut.reward)}.`);
      lootEvent(state, hero, r.gold ?? 0, { wood: r.wood, ore: r.ore, dust: r.dust });
      break;
    }
    case 'chestTake': {
      const chest = k.chest;
      const hero = chest ? state.heroes[chest.heroId] : undefined;
      if (!chest || !hero) throw new Error('Nie ma skrzyni do otwarcia.');
      k.chest = null;
      if (action.what === 'gold') {
        k.gold[hero.faction] += KINGDOM.chestGold;
        log(state, 'info', `${UNITS[hero.id].name} bierze ze skrzyni ${KINGDOM.chestGold} zł.`);
        lootEvent(state, hero, KINGDOM.chestGold);
      } else {
        giveArtifact(state, hero, drawArtifact(state, hero, ARTIFACT_ODDS.chest, 0x2545f491), 'skrzynia');
      }
      // Kaftan Poborcy: the chest gives gold on top, whatever the player chose.
      const extra = gearOf(hero).reduce((n, a) => n + (a.chestGold ?? 0), 0);
      if (extra) {
        k.gold[hero.faction] += extra;
        log(state, 'info', `${UNITS[hero.id].name} dostaje jeszcze ${extra} zł (Kaftan Poborcy).`);
        lootEvent(state, hero, extra);
      }
      break;
    }
    default:
      throw new Error('Nieznane polecenie Osady.');
  }
}

/** The artifact a chest would give if it were chosen: the same draw as `chestTake`, for the screen (never changes the game). */
export function chestPreview(state: GameState, hero: HeroState): string {
  return drawArtifact(state, hero, ARTIFACT_ODDS.chest, 0x2545f491).id;
}

// ------------------------------------------------------------------ the bots

/** What a bot buys in a settlement it stands in, by priority (null: nothing it wants and can pay for). */
export function botPurchase(state: GameState, f: TeamId, s: Settlement): Action | null {
  const k = state.kingdom;
  if (!k || s.owner !== f) return null;
  const gold = k.gold[f];
  const fs = state.factions[f];
  const id = s.id;
  const afford = (price: number | null) => price !== null && gold >= price;
  // A building needs its whole price (level 4: resources too) and the round's one build still free.
  const buildable = (b: BuildingId) => { const c = buildCost(state, s, b); return c !== null && !buildBlock(s, b) && canPay(state, f, c); };
  const own = s.land === f;
  if (own && s.buildings.barracks < 1 && buildable('barracks')) return { type: 'kingdomBuild', settlementId: id, building: 'barracks' };
  if (own && s.buildings.barracks >= 1 && state.rules.empire) {
    // Level 6: the dwelling of the lowest tier that has none (which of the two units: by the game's seed, so the games differ), when it and its unit can be paid for.
    for (const tier of [2, 3, 4, 5, 6]) {
      if (dwellingOf(state, f, tier) || (tier >= 4 && s.buildings.barracks < 2)) continue;
      const options = recruitsOf(state, f).filter((r) => r.tier === tier);
      const pick = options[(state.setup.seed + tier + ALL_TEAM_IDS.indexOf(f)) % options.length];
      const price = DWELLING_COST[tier - 2];
      if (pick && canPay(state, f, { ...price, gold: price.gold + pick.cost })) return { type: 'kingdomDwelling', settlementId: id, unitId: pick.id };
      break;
    }
  }
  if (own && s.buildings.barracks >= 1) {
    // Like a player: the strongest recruit it can pay for now.
    const missing = recruitsOf(state, f).filter((r) => !hasUnit(state, f, r.id) && dwellingReady(state, f, r) && (r.tier < 4 || s.buildings.barracks >= 2) && afford(r.cost) && resOf(state, f).dust >= (r.dust ?? 0)).sort((a, b) => b.tier - a.tier)[0];
    if (missing) return { type: 'kingdomRecruit', settlementId: id, unitId: missing.id };
    // Every cheaper recruit is in the team and the strongest ones wait behind the bigger barracks: build them.
    const waiting = recruitsOf(state, f).some((r) => r.tier >= 4 && !hasUnit(state, f, r.id) && (!needsDwelling(state, r) || dwellingOf(state, f, r.tier) === undefined || dwellingReady(state, f, r)));
    if (waiting && s.buildings.barracks === 1 && recruitsOf(state, f).every((r) => r.tier >= 4 || hasUnit(state, f, r.id) || (needsDwelling(state, r) && dwellingOf(state, f, r.tier) !== r.id && dwellingOf(state, f, r.tier) !== undefined)) && buildable('barracks')) return { type: 'kingdomBuild', settlementId: id, building: 'barracks' };
  }
  if (s.buildings.hospital >= 1 && fs.supportsDead.length) {
    const dead = fs.supportsDead[0];
    const base = RECRUITS[raceOf(state, f)].find((r) => r.id === dead)?.cost ?? 2;
    if (afford(Math.max(1, Math.ceil(base / KINGDOM.heal[s.buildings.hospital >= 2 ? 1 : 0])))) return { type: 'kingdomHeal', settlementId: id, unitId: dead };
  }
  if (s.buildings.treasury < 1 && buildable('treasury')) return { type: 'kingdomBuild', settlementId: id, building: 'treasury' };
  if (state.rules.economy && buildingLevel(s, 'forge') < 1 && forgeLevel(state, f) < 1 && buildable('forge')) return { type: 'kingdomBuild', settlementId: id, building: 'forge' };
  if (s.buildings.hospital < 1 && fs.supportsDead.length && buildable('hospital')) return { type: 'kingdomBuild', settlementId: id, building: 'hospital' };
  if (s.buildings.market >= 1) {
    const buyer = state.heroes[state.turnOrder[state.turnIndex]];
    const who = buyer?.faction === f ? buyer : undefined;
    const bill = (a: ArtifactDef): Cost => (who ? artifactBill(state, who, a) : { gold: KINGDOM.artifactPrice[a.rarity - 1] });
    // A bot prefers the rarer artifact, and a piece of a set it is already collecting above the others.
    const worth = (a: ArtifactDef) => a.rarity * 10 + (a.set && who ? setCount(who, a.set) * 6 : 0);
    const best = marketStock(state, s).map((a) => ARTIFACT_BY_ID[a]).filter((a) => canPay(state, f, bill(a))).sort((a, b) => worth(b) - worth(a))[0];
    if (best) return { type: 'kingdomBuyArtifact', settlementId: id, artifactId: best.id };
  } else if (buildable('market')) return { type: 'kingdomBuild', settlementId: id, building: 'market' };
  if (own && s.buildings.barracks === 1 && s.buildings.market >= 1 && buildable('barracks')) return { type: 'kingdomBuild', settlementId: id, building: 'barracks' };
  if (state.rules.economy && buildingLevel(s, 'forge') === 1 && forgeLevel(state, f) === 1 && buildable('forge')) return { type: 'kingdomBuild', settlementId: id, building: 'forge' };
  // Level 5: a tavern on own land, once the barracks stand (a second hero is worth more than the last buildings).
  if (state.rules.realm && own && s.buildings.barracks >= 1 && buildingLevel(s, 'tavern') < 1 && !settlementsOf(state, f).some((x) => buildingLevel(x, 'tavern') >= 1) && buildable('tavern')) return { type: 'kingdomBuild', settlementId: id, building: 'tavern' };
  // Level 5: one mage tower for the faction, and its upgrade once there is Gwiezdny Pył to spare.
  if (state.rules.realm && own && s.buildings.barracks >= 1 && !settlementsOf(state, f).some((x) => x.id !== s.id && buildingLevel(x, 'magic') >= 1) && buildCost(state, s, 'magic') && buildable('magic')) return { type: 'kingdomBuild', settlementId: id, building: 'magic' };
  // Level 6: the faction's own buildings. The mechanic comes first (Kapliczka Świtu / Jama Krwi, one settlement is enough: the best level counts), through its
  // parent building when that is missing; then its levels, then the others (the grove and the den only once, the nursery and the plunder house add up).
  if (state.rules.empire && own) {
    const mech = MECHANIC_BUILDING[raceOf(state, f)];
    const best = mechanicLevel(state, f);
    const parent = BUILDING_PARENT[mech];
    if (best < 1 && parent && buildingLevel(s, parent) < 1 && buildable(parent) && canPay(state, f, { ...buildCost(state, s, parent)!, gold: buildCost(state, s, parent)!.gold + 2 })) return { type: 'kingdomBuild', settlementId: id, building: parent };
    const wanted = FACTION_BUILDINGS[raceOf(state, f)].filter((x) => {
      if (x === mech) return buildingLevel(s, x) >= best && best < 4;
      if (x === 'refuge') return buildingLevel(s, x) < 1 && settlementsOf(state, f).filter((y) => buildingLevel(y, x) >= 1).length < 2;
      if (x === 'grove' || x === 'wolfDen') return !settlementsOf(state, f).some((y) => buildingLevel(y, x) >= 1);
      return true;
    });
    for (const b of [mech, ...wanted.filter((x) => x !== mech)].filter((x) => wanted.includes(x))) {
      const price = buildCost(state, s, b);
      if (price && buildable(b) && canPay(state, f, { ...price, gold: price.gold + 2 })) return { type: 'kingdomBuild', settlementId: id, building: b };
    }
  }
  // Defences last, and only where somebody stands guard.
  if (state.rules.economy && s.garrison?.length && buildCost(state, s, 'walls') && buildable('walls')) return { type: 'kingdomBuild', settlementId: id, building: 'walls' };
  return botTrade(state, f, s);
}

/**
 * Level 4: a bot that sits on gold while a building waits for one resource buys that resource (one unit an action). It keeps the gold of the
 * building itself and never trades in a round in which it has already built.
 */
function botTrade(state: GameState, f: TeamId, s: Settlement): Action | null {
  const k = state.kingdom!;
  if (!k.res) return null;
  const fs = state.factions[f];
  const own = s.land === f;
  const wanted: BuildingId[] = [];
  if (own && s.buildings.barracks < 1) wanted.push('barracks');
  if (s.buildings.treasury < 1) wanted.push('treasury');
  if (s.buildings.market < 1) wanted.push('market');
  if (forgeLevel(state, f) < 1) wanted.push('forge');
  if (s.buildings.hospital < 1 && fs.supportsDead.length) wanted.push('hospital');
  if (state.rules.realm && own && s.buildings.barracks >= 1) {
    if (!settlementsOf(state, f).some((x) => buildingLevel(x, 'tavern') >= 1)) wanted.push('tavern');
    if (!settlementsOf(state, f).some((x) => buildingLevel(x, 'magic') >= 1)) wanted.push('magic');
  }
  if (own && s.buildings.barracks === 1) wanted.push('barracks');
  if (buildingLevel(s, 'forge') === 1) wanted.push('forge');
  for (const b of wanted) {
    const c = buildCost(state, s, b);
    if (!c) continue;
    const missing = RESOURCE_IDS.filter((r) => k.res![f][r] < (c[r] ?? 0));
    if (!missing.length) continue;
    const bill = c.gold + missing.reduce((n, r) => n + (c[r]! - k.res![f][r]) * tradeBuyPrice(s, r), 0);
    if (k.gold[f] >= bill) return { type: 'kingdomTrade', settlementId: s.id, res: missing[0], dir: 'buy' };
  }
  return null;
}

/** Whether the hero can pay what the hut on its hex asks for now. */
export function hutPayable(state: GameState, hero: HeroState): boolean {
  const hut = state.kingdom?.huts?.[hero.pos];
  if (!hut || hut.done) return false;
  if (hut.want.artifact) return Boolean(hero.pack?.length);
  return canPay(state, hero.faction, { gold: hut.want.gold ?? 0, wood: hut.want.wood, ore: hut.want.ore, dust: hut.want.dust });
}

/** Whether a bot is willing to do this hut's quest now: it can pay and keeps a reserve for its buildings and recruits. */
export function botWantsHut(state: GameState, hero: HeroState, hex: HexKey): boolean {
  const hut = state.kingdom?.huts?.[hex];
  if (!hut || hut.done) return false;
  const f = hero.faction;
  const w = hut.want;
  if (w.artifact) return Boolean(hero.pack?.length);
  const res = resOf(state, f);
  return state.kingdom!.gold[f] >= (w.gold ?? 0) + (w.gold ? 4 : 0) && RESOURCE_IDS.every((r) => res[r] >= (w[r] ?? 0) + (w[r] ? 2 : 0));
}

/** The kingdom's part of a bot's turn: open a chest, then shop where the hero stands. */
export function kingdomBotAction(state: GameState, hero: HeroState): Action | null {
  const k = state.kingdom;
  if (!k) return null;
  if (k.chest) return { type: 'chestTake', what: 'artifact' };
  if (botWantsHut(state, hero, hero.pos)) return { type: 'hutDeliver' };
  // Set pieces in the backpack: wear one when it brings the best set a piece closer (strictly, so the bot never swaps back and forth).
  const best = (h: HeroState) => Math.max(0, ...(Object.keys(SETS) as Array<keyof typeof SETS>).map((id) => setCount(h, id)));
  for (const art of (hero.pack ?? []).map((id) => ARTIFACT_BY_ID[id]).filter((a) => a?.set)) {
    const trial = { gear: { ...hero.gear, [art.slot]: art.id } };
    if (best(trial as HeroState) > best(hero)) return { type: 'equipArtifact', artifactId: art.id };
  }
  // Level 6: all the shards in hand and the hero in its own settlement: the Iskra goes up.
  if (state.rules.empire && mayBuildSpark(state, hero)) {
    const at = settlementAt(state, hero.pos);
    if (at && at.owner === hero.faction) return { type: 'kingdomBuild', settlementId: at.id, building: 'spark' };
  }
  // Shards in several hands: hand them to the ally who collects (the most shards, then the nearest own settlement) when it is next to us.
  if (state.rules.empire && (hero.shards ?? 0) > 0) {
    const to = shardCollector(state, hero.faction);
    if (to && to.id !== hero.id && passTargets(state, hero).some((h) => h.id === to.id)) return { type: 'passArtifact', artifactId: SHARDS_ID, toHeroId: to.id };
  }
  // The Herds' Ostoja Wędrówek: jump to the other Ostoja when it lies nearer the Tree (where the game is decided), once a round.
  const jumps = refugeTargets(state, hero);
  if (jumps.length) {
    const tree = parseKey(state.control ? state.control.points[0] : treeOf(state));
    const toTree = (k: HexKey) => distance(parseKey(k), tree);
    const to = jumps.sort((a, b) => toTree(a.at) - toTree(b.at) || (a.id < b.id ? -1 : 1))[0];
    if (toTree(to.at) + 2 <= toTree(hero.pos)) return { type: 'kingdomRefuge', settlementId: to.id };
  }
  // Level 4: supports that do not fit into the team (more alive than places) stay to guard the settlement the hero stands in; a team with
  // a free place takes them back.
  const here = state.rules.economy ? settlementAt(state, hero.pos) : undefined;
  if (here && here.owner === hero.faction) {
    const fs = state.factions[hero.faction];
    const slots = teamSlots(state, hero.faction);
    const worth = (id: string) => UNITS[id].hp + UNITS[id].attack * 1.5;
    if (fs.supportsAlive.length > slots && (here.garrison?.length ?? 0) < SIEGE.garrisonMax) {
      const weakest = [...fs.supportsAlive].sort((a, b) => worth(a) - worth(b) || (a < b ? -1 : 1))[0];
      return { type: 'kingdomGarrison', settlementId: here.id, unitId: weakest, dir: 'in' };
    }
    if (fs.supportsAlive.length < slots && here.garrison?.length) {
      const strongest = [...here.garrison].sort((a, b) => worth(b) - worth(a) || (a < b ? -1 : 1))[0];
      return { type: 'kingdomGarrison', settlementId: here.id, unitId: strongest, dir: 'out' };
    }
  }
  // Level 5: learn the spells of the faction's towers, the fighting ones first (a few coins stay for recruits).
  if (state.rules.realm && hero.playerId) {
    const order: SpellId[] = ['bolt', 'mend', 'fireball', 'thunder', 'stoneskin', 'curse', 'shield', 'inspire', 'slow'];
    for (const s of settlementsOf(state, hero.faction)) {
      const teach = towerSpells(buildingLevel(s, 'magic'));
      const spell = order.find((id) => teach.includes(id) && !hero.spells?.includes(id));
      if (spell && canPay(state, hero.faction, { ...spellPrice(spell), gold: spellPrice(spell).gold + 2 })) return { type: 'kingdomLearn', settlementId: s.id, spell };
    }
  }
  // Level 5: buy the fallen commander back, hire one (the first free archetype; a reserve of gold stays for recruits).
  if (state.rules.realm && hero.playerId) {
    const tavern = settlementsOf(state, hero.faction).find((s) => buildingLevel(s, 'tavern') >= 1);
    const mine = commanderOf(state, hero.playerId);
    if (tavern && mine && mayRansom(state, mine) && k.gold[hero.faction] >= ransomPrice(mine)) return { type: 'kingdomRansom', settlementId: tavern.id, heroId: mine.id };
    const free = freeCommanders(state, hero.faction);
    if (tavern && !mine && !hero.secondary && free.length && k.gold[hero.faction] >= REALM.hireGold + 2) return { type: 'kingdomHire', settlementId: tavern.id, unitId: free[(state.setup.seed + state.players.findIndex((p) => p.id === hero.playerId)) % free.length] };
  }
  // Shopping needs no walk (a human opens the settlement list from anywhere), so a bot shops from where it stands too.
  for (const s of settlementsOf(state, hero.faction)) {
    const buy = botPurchase(state, hero.faction, s);
    if (buy) return buy;
  }
  return null;
}

/** Family mode: an adult (a human who is not a child) plays the same faction as this hero's player. */
export function hasParent(state: GameState, hero: HeroState): boolean {
  const me = state.players.find((p) => p.id === hero.playerId);
  return Boolean(me?.child) && state.players.some((p) => p.id !== me!.id && p.faction === hero.faction && p.controller === 'human' && !p.child);
}

/**
 * Family mode, levels 3 and 4: what the autopilot does for a child's hero in its turn (null: nothing). The child walks and fights; the layers
 * above that are run for it. With an adult of the same faction at the table the economy is the adult's (gold and resources are shared, so the
 * autopilot must not spend them): only the child's own things are done (a chest, a set piece from the backpack). Without one the autopilot
 * runs everything, like a bot.
 */
export function autopilotAction(state: GameState, hero: HeroState): Action | null {
  const k = state.kingdom;
  if (!k || !state.players.find((p) => p.id === hero.playerId)?.child) return null;
  if (!hasParent(state, hero)) return kingdomBotAction(state, hero);
  if (k.chest) return { type: 'chestTake', what: 'artifact' };
  const a = kingdomBotAction(state, hero);
  return a?.type === 'equipArtifact' ? a : null;
}

/** Whether a bot of this faction has something to buy in one of its settlements (a reason to walk back to it). */
export const kingdomWish = (state: GameState, f: TeamId): Settlement | null => settlementsOf(state, f).find((s) => botPurchase(state, f, s)) ?? null;
