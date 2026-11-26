// Level 3 "Osada" (digital, rule `kingdom`, built on hero growth): gold, settlements with buildings, gold mines, a market of artifacts, a hospital,
// recruitment of supports and a team that grows. Design: docs/POZIOM_3_KROLESTWO.md (the author's decisions of 13.11.2026). Every number here is
// provisional: the simulations tune them. Gold is small (the cheapest thing costs 1) and shared by the whole faction.

import { ALL_TEAM_IDS, byTeam, raceOf, teamsOf } from './teams';
import { byPack } from './factions';
import { ABILITY, FACTION_NAMES, itemDef, NON_RESURRECTION_ITEMS, SUPPORTS_PER_BATTLE, UNITS, supportTier, type FactionId, type TeamId } from './data';
import { distance, parseKey, type HexKey } from './hex';
import { factionShare, guardRng, guardUnits, neutralGroup, stillConnected } from './encounters';
import { awardXp, levelOf } from './growth';
import { log } from './log';
import { mapNeighbors, revealAround, seeHex, tileCost, treeOf } from './map';
import { Rng } from './rng';
import { costText, ECONOMY, SIEGE, OBJECTS, OBJECT_NAMES, objectReady, thingsText, type Hut, type MapObject, emptyResources, RESOURCE_IDS, RESOURCE_NAMES, MINE_NAMES, type Cost, type ResourceId, type Resources } from './economy';
import { ARTIFACT_BY_ID, ARTIFACT_ODDS, artifactPool, completeSets, drawArtifact, gearOf, packOf, SETS, setCount, type ArtifactDef, giveArtifact, passTargets, SHARDS_ID, type Rarity } from './sites';
import { advantagedFaction, computerFaction, isDigital, type Action, type Crystal, type GameState, type HeroState, type Rune } from './types';
import { circleSpells, MAGIC, SPELL_CIRCLES, SPELLS, towerSpells, type SpellId } from './magic';
import { HERO_TYPES } from './heroTypes';
import { FACTION_MECHANICS, mayBuildSpark, mechanicLevel, pickUpShard, placeShards, shardCollector, SPARK_NAMES, spendShards, summedLevel } from './empire';
import { commanderName, commanderOf, freeCommanders, heroLabel, mayRansom, ransomPrice, REALM } from './realm';

export type BuildingId = 'barracks' | 'market' | 'hospital' | 'treasury' | 'forge' | 'walls' | 'tavern' | 'magic' | 'spark' | 'shrine' | 'nursery' | 'grove' | 'bloodPit' | 'plunder' | 'wolfDen' | 'hoofStone' | 'pastures' | 'refuge' | 'barrow' | 'ossuary' | 'bellTower' | 'shieldHall' | 'runeForge' | 'deepMine' | 'frostPalace' | 'crystalGrotto' | 'blizzardTower' | 'trapWorkshop' | 'fence' | 'smugglerTrails' | 'mirageHall' | 'caravanRoad' | 'sandGate' | 'myceliumHeart' | 'mushroomGarden' | 'tunnels' | 'tideTemple' | 'pearlBanks' | 'lighthouse';

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
  cost: { barracks: [3, 6], market: [3, 5], hospital: [3, 5], treasury: [4, 6], forge: [], walls: [], tavern: [], magic: [], spark: [], shrine: [], nursery: [], grove: [], bloodPit: [], plunder: [], wolfDen: [], hoofStone: [], pastures: [], refuge: [], barrow: [], ossuary: [], bellTower: [], shieldHall: [], runeForge: [], deepMine: [], frostPalace: [], crystalGrotto: [], blizzardTower: [], trapWorkshop: [], fence: [], smugglerTrails: [], mirageHall: [], caravanRoad: [], sandGate: [], myceliumHeart: [], mushroomGarden: [], tunnels: [], tideTemple: [], pearlBanks: [], lighthouse: [] } as Record<BuildingId, number[]>,
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
  skeletonArcher: 'Zbrojownia Kości', scarecrow: 'Opuszczone Pole', hauntedArmor: 'Rycerska Krypta', vampire: 'Krypta Wampira', viy: 'Wielki Kurhan', strzyga: 'Dom Strzygi', lich: 'Biblioteka Umarłych', kostucha: 'Kaplica Tańca Śmierci', boneDragon: 'Smocze Cmentarzysko',
  armoredBear: 'Gawra Zbrojna', battleSmith: 'Polowa Kuźnia', bronzeSentinel: 'Warsztat Mechanizmów', ramGoat: 'Koźla Zagroda', giantSlayer: 'Sala Pogromców', skarbnik: 'Stary Szyb', hammerGuard: 'Sala Gwardii', dwarfCannon: 'Ludwisarnia', clanColossus: 'Wielka Kuźnia Kolosa',
  steppeArcher: 'Łucznicze Błonia', muskOx: 'Piżmowe Zimowisko', forestBison: 'Żubrza Ostoja', arkar: 'Pasmo Arkarów', steppeLamignat: 'Gniazdo na Urwisku', drumElephant: 'Krąg Bębnów', warRhino: 'Błotne Brody', bullMoose: 'Łosie Mokradło', indrik: 'Źródło Indrika',
  weaselKnife: 'Kryjówka w Żywopłocie', beaverEngineer: 'Żeremie', polecatPoisoner: 'Warzelnia', raccoonDogSpy: 'Leśna Czatownia', wolverine: 'Rosomacza Nora', marmotPetard: 'Prochownia', toadGunner: 'Rusznikarnia', catFencer: 'Fechtownia', towerMonitor: 'Wielka Stajnia Kompanii',
  blizzardWitch: 'Chata na Lodzie', glacierYak: 'Zagroda Jaków', iceSentinel: 'Lodowa Strażnica', frostSprite: 'Sopelkowa Grota', youngGiant: 'Obóz Olbrzymów', dziadMroz: 'Chata Dziada Mroza', elderGiant: 'Gradowa Turnia', auroraSpirit: 'Wieża Zorzy', frostMammoth: 'Mamucia Grań',
  bedouinNomad: 'Namiot Nomadów', rootCaterpillar: 'Zielony Kokon', dustMoth: 'Kokonownia', mushroomGuard: 'Krąg Muchomorów', bombardier: 'Żwirowisko', dragonfly: 'Staw Ważek', mycoMother: 'Wilgotna Piwnica', centipede: 'Skalna Szczelina', armoredSnail: 'Mszysty Głaz', emperorCicada: 'Komora Cykady',
  crabShield: 'Krabia Skała', inkOctopus: 'Atramentowa Grota', sharkman: 'Rekinia Grota', pearlPriestess: 'Perłowy Ołtarz', lobsterKnight: 'Homarza Rafa', albatross: 'Gniazdo Albatrosa', reefGolem: 'Koralowa Jaskinia', seaWitch: 'Zatopiona Chata', leviathan: 'Rów Głębinowy',
  sandScorpion: 'Gniazdo Skorpionów', cobra: 'Wężowa Studnia', mirageDancer: 'Dom Tancerek', ushabti: 'Grobowiec Strażników', lamassu: 'Brama Lamassu', oasisCrocodile: 'Rozlewisko Krokodyli', roc: 'Gniazdo Roka', sandWyrm: 'Ruchome Piaski',
  ratman: 'Szczurze Nory', goblinSlinger: 'Obóz Procarzy', hellhound: 'Psiarnia Ogarów', gargoyle: 'Kamienna Grzęda', salamander: 'Popielna Jama', caveTroll: 'Trollowa Pieczara', minotaurChief: 'Labirynt Minotaurów', shadowWyvern: 'Gniazdo Wiwern', doomBehemoth: 'Jaskinia Zagłady',
};
/** What a dwelling does, in words (the unit's name in the genitive). */
const GENITIVE: Record<string, string> = {
  hedgehog: 'Jeżozwierza', silverFox: 'Srebrnego Lisa', centaur: 'Centaura', dawnOwl: 'Sowy Świtu', boar: 'Alabastrowego Odyńca', dryadArcher: 'Driady Łuczniczki', treeGuardian: 'Opiekuna Drzewa', whiteStag: 'Białego Jelenia', dawnPhoenix: 'Feniksa Świtu',
  skeletonArcher: 'Szkieletu Łucznika', scarecrow: 'Strachu Polnego', hauntedArmor: 'Nawiedzonej Zbroi', vampire: 'Wampira', viy: 'Wija Podziemnego', strzyga: 'Strzygi', lich: 'Lisza', kostucha: 'Kostuchy', boneDragon: 'Kościanego Smoka',
  armoredBear: 'Niedźwiedzia w Zbroi', battleSmith: 'Kowala Bitewnego', bronzeSentinel: 'Wartownika z Brązu', ramGoat: 'Kozła Taranowego', giantSlayer: 'Pogromcy Olbrzymów', skarbnik: 'Skarbnika', hammerGuard: 'Gwardii Młota', dwarfCannon: 'Armaty Klanów', clanColossus: 'Kolosa Kuźni',
  steppeArcher: 'Łucznika Stepowego', muskOx: 'Wołu Piżmowego', forestBison: 'Żubra Puszczańskiego', arkar: 'Arkara', steppeLamignat: 'Łamignata Stepowego', drumElephant: 'Słonia z Bębnem', warRhino: 'Nosorożca Bojowego', bullMoose: 'Łosia Rogacza', indrik: 'Indrika',
  weaselKnife: 'Łasicy Nożowniczki', beaverEngineer: 'Bobra Inżyniera', polecatPoisoner: 'Tchórza Smrodnika', raccoonDogSpy: 'Jenota Szpiega', wolverine: 'Rosomaka Zabijaki', marmotPetard: 'Świstaka Petardnika', toadGunner: 'Ropucha z Hakownicą', catFencer: 'Kocura Fechmistrza', towerMonitor: 'Warana Wieżowego',
  blizzardWitch: 'Wiedźmy Zamieci', glacierYak: 'Jaka Lodowcowego', iceSentinel: 'Rycerza Lodowej Zbroi', frostSprite: 'Rusałki Szronu', youngGiant: 'Młodego Olbrzyma Szronu', dziadMroz: 'Dziada Mroza', elderGiant: 'Olbrzyma Gradu', auroraSpirit: 'Ducha Zorzy', frostMammoth: 'Mamuta Wiecznej Zimy',
  bedouinNomad: 'Beduina Nomady', rootCaterpillar: 'Gąsienicy Korzennej', dustMoth: 'Ćmy Pyłowej', mushroomGuard: 'Muchomora Gwardzisty', bombardier: 'Żuka Bombardiera', dragonfly: 'Ważki Łowczyni', mycoMother: 'Matki Grzybni', centipede: 'Skolopendry Głębin', armoredSnail: 'Ślimaka Pancernego', emperorCicada: 'Cesarskiej Cykady',
  crabShield: 'Kraboluda Tarczownika', inkOctopus: 'Ośmiornicy Atramentowej', sharkman: 'Rekinołaka', pearlPriestess: 'Kapłanki Pereł', lobsterKnight: 'Homara Pancernego', albatross: 'Albatrosa', reefGolem: 'Rafowego Golema', seaWitch: 'Morskiej Wiedźmy', leviathan: 'Lewiatana',
  sandScorpion: 'Skorpiona Piaskowego', cobra: 'Kobry Królewskiej', mirageDancer: 'Tancerki Fata Morgany', ushabti: 'Kamiennego Strażnika Grobowca', lamassu: 'Lamassu', oasisCrocodile: 'Krokodyla Oazowego', roc: 'Ptaka Roka', sandWyrm: 'Czerwia Pustyni',
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

/** What the hospital of `s` asks for raising a fallen support: a half or a third of its price, and for the Kingdom of the Dead the Ossuarium takes off a gold piece (second level: nothing for tiers 1-2). */
export function healPrice(state: GameState, f: TeamId, s: Settlement, unitId: string): number {
  const base = RECRUITS[raceOf(state, f)].find((r) => r.id === unitId)?.cost ?? 2;
  let price = Math.max(1, Math.ceil(base / KINGDOM.heal[s.buildings.hospital >= 2 ? 1 : 0]));
  const ossuary = state.rules.empire ? Math.max(0, ...settlementsOf(state, f).map((x) => buildingLevel(x, 'ossuary'))) : 0;
  if (ossuary >= 1) price = Math.max(1, price - FACTION_MECHANICS.ossuaryDiscount);
  if (ossuary >= 2 && supportTier(unitId) <= FACTION_MECHANICS.ossuaryFreeTier) price = 0;
  return price;
}

/** The runes of the Runiczna Kuźnia (the Iron Clans): names and what each does in a battle. */
export const RUNE_NAMES: Record<Rune, string> = { attack: '+1 A', life: '+1 Ż', armour: 'pancerz 1' };
export const RUNES: Rune[] = ['attack', 'life', 'armour'];

/** The runes a faction's unit carries. */
export const runesOf = (state: GameState, f: TeamId, unitId: string): Rune[] => state.factions[f].runes?.[unitId] ?? [];

/** The level of the best Runiczna Kuźnia of the faction (0: none). */
export const runeForgeLevel = (state: GameState, f: TeamId): number => (state.rules.empire ? Math.max(0, ...settlementsOf(state, f).map((s) => buildingLevel(s, 'runeForge'))) : 0);

/** Why a rune cannot be forged now (null: it can). The unit must be one of the faction's pool (alive or fallen: the rune waits for its return). */
export function runeBlock(state: GameState, f: TeamId, s: Settlement, unitId: string, rune: Rune): string | null {
  const fs = state.factions[f];
  if (buildingLevel(s, 'runeForge') < 1) return 'W tej osadzie nie ma Runicznej Kuźni.';
  if (!RUNES.includes(rune)) return 'Nie ma takiej runy.';
  if (!fs.supportsAlive.includes(unitId) && !fs.supportsDead.includes(unitId)) return 'Tej jednostki nie ma w drużynie.';
  if (fs.runeRound === state.round) return 'Kuźnia wybija jedną runę na rundę.';
  const cap = FACTION_MECHANICS.runesPerUnit[Math.min(runeForgeLevel(state, f), 2) - 1];
  const have = runesOf(state, f, unitId);
  if (have.length >= cap) return cap > 1 ? 'Ta jednostka ma już komplet run.' : 'Ta jednostka ma już runę (druga runa na jednostkę wymaga drugiego poziomu Kuźni).';
  if (have.includes(rune)) return 'Ta jednostka ma już taką runę.';
  if (!canPay(state, f, FACTION_MECHANICS.runePrice)) return 'Brakuje zasobów na runę.';
  return null;
}

/** What a bot forges now: the strongest unit of the pool that can take a rune, and the rune that suits it (shooters strike harder, the rest keep their skin). */
export function botRune(state: GameState, f: TeamId, s: Settlement): { unitId: string; rune: Rune } | null {
  const fs = state.factions[f];
  const pool = [...fs.supportsAlive, ...fs.supportsDead].sort((a, b) => supportTier(b) - supportTier(a) || (a < b ? -1 : 1));
  for (const unitId of pool) {
    const ranged = UNITS[unitId].attackType === 'ranged';
    for (const rune of ranged ? (['attack', 'life', 'armour'] as Rune[]) : (['armour', 'life', 'attack'] as Rune[])) if (!runeBlock(state, f, s, unitId, rune)) return { unitId, rune };
  }
  return null;
}

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
  barrow: ['Kurhan Wiecznej Warty', 'Kurhan Północnej Warty', 'Kurhan Dwóch Straży', 'Wielki Kurhan Wiecznej Warty'],
  ossuary: ['Ossuarium', 'Wielkie Ossuarium'],
  bellTower: ['Dzwonnica Zaduszna'],
  shieldHall: ['Sala Tarcz', 'Wielka Sala Tarcz', 'Sala Nieruchomych Tarcz', 'Sala Tarcz Przodków'],
  runeForge: ['Runiczna Kuźnia', 'Wielka Runiczna Kuźnia'],
  deepMine: ['Głęboka Sztolnia', 'Najgłębsza Sztolnia'],
  frostPalace: ['Pałac Szronu', 'Wielki Pałac Szronu', 'Pałac Kruchego Lodu', 'Pałac Wiecznego Szronu'],
  crystalGrotto: ['Kryształowa Grota', 'Głęboka Kryształowa Grota'],
  blizzardTower: ['Wieża Zamieci', 'Wielka Wieża Zamieci'],
  trapWorkshop: ['Warsztat Sideł', 'Wielki Warsztat Sideł', 'Warsztat Sideł Unieruchamiających', 'Warsztat Mistrzowskich Sideł'],
  fence: ['Paserka', 'Dobra Paserka'],
  smugglerTrails: ['Szlaki Przemytnicze'],
  mirageHall: ['Pałac Mirażu', 'Wielki Pałac Mirażu', 'Pałac Zamiennych Luster', 'Pałac Oślepiających Luster'],
  caravanRoad: ['Szlak Karawan', 'Wielki Szlak Karawan'],
  sandGate: ['Brama Wydm'],
  myceliumHeart: ['Serce Grzybni', 'Rozrosłe Serce Grzybni', 'Trujące Serce Grzybni', 'Pradawne Serce Grzybni'],
  mushroomGarden: ['Ogród Grzybów', 'Wielki Ogród Grzybów'],
  tunnels: ['Podziemne Korytarze', 'Głębokie Korytarze'],
  tideTemple: ['Świątynia Pływów', 'Wielka Świątynia Pływów', 'Świątynia Osłony Fal', 'Świątynia Żywej Wody'],
  pearlBanks: ['Perłowe Ławice', 'Wielkie Perłowe Ławice'],
  lighthouse: ['Latarnia Morska', 'Wielka Latarnia Morska'],
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
    `Tętent: jednostka Stada, która przed atakiem wręcz przebiegła co najmniej ${FACTION_MECHANICS.herdsRun} pola, odpycha cel o 1 pole (zderzenie rani). Bez tego budynku frakcja nie ma tego efektu.`,
    `Zderzenia Stada ranią o ${FACTION_MECHANICS.herdsCollision} więcej.`,
    `Wystarczy rozbieg o ${FACTION_MECHANICS.herdsRunShort} pola.`,
    `Cel, który uderzył w coś po zderzeniu, ma −${FACTION_MECHANICS.herdsSlow} S w swojej następnej aktywacji.`,
  ],
  pastures: [`Rekrutacja pomocników poziomów 1–3 jest tańsza o ${FACTION_MECHANICS.pastureDiscount} zł.`, `Rekrutacja pomocników poziomów 1–5 jest tańsza o ${FACTION_MECHANICS.pastureDiscount} zł.`],
  refuge: ['Bohater stojący w osadzie z Ostoją może raz na rundę przenieść się do innej własnej osady z Ostoją.'],
  barrow: [
    'Wieczna Warta: raz na bitwę, na końcu rundy, najtańszy poległy pomocnik Umarłych wstaje z 1 Ż (na swoim polu albo najbliższym wolnym). Bohaterowie nie wstają. Bez tego budynku frakcja nie ma tego efektu.',
    'Pomocnik wstaje z połową Ż.',
    'Warta wstaje dwa razy na bitwę.',
    'Pomocnik wstaje z pełnym Ż.',
  ],
  ossuary: [`Wskrzeszenie w szpitalu jest tańsze o ${FACTION_MECHANICS.ossuaryDiscount} zł.`, `Pomocnicy poziomów 1–${FACTION_MECHANICS.ossuaryFreeTier} wracają ze szpitala za darmo.`],
  shieldHall: [
    `Mur Tarcz: jednostka Klanu z co najmniej ${FACTION_MECHANICS.shieldMates[0]} sąsiednimi sojusznikami ma −${FACTION_MECHANICS.shieldArmor} obrażeń z każdego ciosu. Bez tego budynku frakcja nie ma tego efektu.`,
    `Wystarczy ${FACTION_MECHANICS.shieldMates[1]} sąsiad.`,
    'Jednostki w szyku nie da się odepchnąć ani przyciągnąć.',
    `Kto atakuje wręcz jednostkę w szyku, traci ${FACTION_MECHANICS.shieldArmor} Ż.`,
  ],
  runeForge: [
    `Raz na rundę jeden pomocnik w drużynie dostaje trwałą runę (+1 A, +1 Ż albo pancerz 1; ${costText({ gold: FACTION_MECHANICS.runePrice.gold, ore: FACTION_MECHANICS.runePrice.ore })}). Jedna runa na jednostkę; runa zostaje po śmierci pomocnika i jego powrocie do drużyny.`,
    'Pomocnik może nosić dwie runy.',
  ],
  deepMine: [`+${FACTION_MECHANICS.mineOre} rudy na rundę z każdej osady z Głęboką Sztolnią.`, `Także +${FACTION_MECHANICS.mineDust} Gwiezdnego Pyłu co ${FACTION_MECHANICS.mineDustEvery} rundy z każdej osady z drugim poziomem.`],
  frostPalace: [
    `Szron: każdy cios jednostki Dworu nakłada na cel 1 szron; przy ${FACTION_MECHANICS.frostThreshold[0]} szronach cel zamarza (traci następną aktywację, szron znika). Bez tego budynku frakcja nie ma tego efektu.`,
    `Cel zamarza już przy ${FACTION_MECHANICS.frostThreshold[1]} szronach.`,
    'Zamrożony dostaje +1 obrażeń od następnego ciosu (pęka lód).',
    'Każdy szron na jednostce to także −1 S.',
  ],
  crystalGrotto: [`+${FACTION_MECHANICS.mineOre} rudy na rundę z każdej osady z Kryształową Grotą.`, `Także +${FACTION_MECHANICS.mineDust} Gwiezdnego Pyłu co ${FACTION_MECHANICS.mineDustEvery} rundy z każdej osady z drugim poziomem.`],
  trapWorkshop: [
    `Sidła: przed bitwą Kompania kładzie ${FACTION_MECHANICS.trapCount[0]} ukrytą pułapkę na swojej połowie areny; wróg, który na nią wejdzie, dostaje ${ABILITY.trapDamage} obrażeń i kończy ruch. Bez tego budynku frakcja nie ma tego efektu (poza Iskrą).`,
    `${FACTION_MECHANICS.trapCount[1]} pułapki przed bitwą.`,
    'Trafiony pułapką nie rusza się do końca swojej następnej aktywacji.',
    `${FACTION_MECHANICS.trapCount[3]} pułapki przed bitwą.`,
  ],
  fence: [`Paserka skupuje artefakty z plecaka aktywnego bohatera za pełną cenę targową (${KINGDOM.artifactPrice[0]} / ${KINGDOM.artifactPrice[1]} / ${KINGDOM.artifactPrice[2]} zł za zwykły / rzadki / legendarny), a skrzynie dają +${FACTION_MECHANICS.fenceChestGold} zł.`, `Co ${FACTION_MECHANICS.fenceTreasureEvery} rundy Paserka przynosi losowy skarb.`],
  mirageHall: [
    `Miraż: na początku bitwy ${FACTION_MECHANICS.mirageCount[0]} jednostka (nie bohater) dostaje miraż: atrapę na wolnym polu twojej strefy, którą wróg bierze za prawdziwą. Miraż nie atakuje i znika po trafieniu (atak przepada). Bez tego budynku frakcja nie ma tego efektu.`,
    `${FACTION_MECHANICS.mirageCount[1]} miraże na początku bitwy.`,
    'Raz na bitwę jednostka może zamienić się miejscami ze swoim mirażem.',
    `Rozbity miraż oślepia atakującego: −${FACTION_MECHANICS.mirageBlind} A w jego następnej aktywacji.`,
  ],
  caravanRoad: [`+1 zł na rundę za każde ${FACTION_MECHANICS.caravanMines} kopalnie frakcji.`, 'Wymiana surowców na Targu bez straty (kupno i sprzedaż po tej samej cenie).'],
  myceliumHeart: [
    `Grzybnia: pola rozstawienia Roju i pola, na których zginęła jakakolwiek jednostka, porasta grzybnia; jednostka Roju na grzybni ma +${FACTION_MECHANICS.myceliumAttack} A. Bez tego budynku frakcja nie ma tego efektu.`,
    'Grzybnia porasta też pola, z których jednostka Roju atakowała.',
    `Wróg, który skończy ruch na grzybni, zostaje zatruty (traci ${ABILITY.poisonDamage} Ż na początku ${ABILITY.poisonTicks} następnych aktywacji).`,
    `Jednostka Roju na grzybni odzyskuje ${FACTION_MECHANICS.myceliumHeal} Ż na początku swojej aktywacji.`,
  ],
  mushroomGarden: [`+1 drewna i +1 rudy co ${FACTION_MECHANICS.gardenEvery[0]} rundy z każdej osady z Ogrodem Grzybów.`, '+1 drewna i +1 rudy co rundę.'],
  tunnels: [`Wolne kopalnie w promieniu ${FACTION_MECHANICS.tunnelRadius[0]} pól od osady z Korytarzami przechodzą na początku rundy do Roju (wrogi bohater, który na nie wejdzie, zajmuje je jak zwykle).`, `Promień ${FACTION_MECHANICS.tunnelRadius[1]} pola.`],
  tideTemple: [
    `Przypływ: raz na bitwę jednostka Bractwa przed swoją aktywacją (zanim się ruszy) zamienia się miejscami z sojusznikiem w zasięgu ${FACTION_MECHANICS.tideRange} pól. Bez tego budynku frakcja nie ma tego efektu.`,
    'Zamiana raz na rundę.',
    `Jednostka, która weszła na miejsce rannego sojusznika, ma pancerz ${ABILITY.oathArmor} do końca rundy.`,
    `Obie jednostki po zamianie odzyskują ${FACTION_MECHANICS.tideHeal} Ż.`,
  ],
  pearlBanks: [`+${FACTION_MECHANICS.pearlGold} zł na rundę z każdej osady z Perłowymi Ławicami.`, `Także +${FACTION_MECHANICS.pearlDust} Gwiezdnego Pyłu co ${FACTION_MECHANICS.pearlDustEvery} rundy z każdej osady z drugim poziomem.`],
  lighthouse: [`Na początku każdej rundy odkrywa mapę w promieniu ${FACTION_MECHANICS.lighthouseRadius[0]} pól wokół osady (widać też wrogich bohaterów w tym zasięgu).`, `Promień ${FACTION_MECHANICS.lighthouseRadius[1]} pól.`],
  sandGate: [`Raz na ${FACTION_MECHANICS.gateEvery} rundy bohater stojący w osadzie z Bramą Wydm przenosi się na dowolne odkryte, wolne pole w odległości do ${FACTION_MECHANICS.gateReach}.`],
  smugglerTrails: [`Raz na rundę bohater Kompanii może przejść przez pole strażnika kryształu albo neutralnych bez walki.`],
  blizzardTower: [`Wrodzy bohaterowie w promieniu ${FACTION_MECHANICS.blizzardRadius[0]} pól od osady mają −${FACTION_MECHANICS.blizzardMove} punkt ruchu na mapie.`, `Promień ${FACTION_MECHANICS.blizzardRadius[1]} pola.`],
  bellTower: ['Po wygranej bitwie z neutralnymi jeden poległy pomocnik poziomu 1–2 wraca do drużyny bez szpitala (raz na rundę).'],
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
  // Szlak Karawan (the Desert Empire): a coin a round for every few mines of the faction.
  if (raceOf(state, f) === 'sands' && bestLevel(state, f, 'caravanRoad') >= 1) {
    const caravan = Math.floor(Object.values(k.mines).filter((m) => m.owner === f).length / FACTION_MECHANICS.caravanMines);
    if (caravan > 0) rows.push({ label: BUILDING_NAMES.caravanRoad[0], gold: caravan });
  }
  // Perłowe Ławice (the Tides): a coin a round from every settlement with the banks.
  if (state.rules.empire && raceOf(state, f) === 'tides') {
    const banks = settlementsOf(state, f).filter((x) => buildingLevel(x, 'pearlBanks') >= 1).length;
    if (banks) rows.push({ label: BUILDING_NAMES.pearlBanks[0], gold: banks * FACTION_MECHANICS.pearlGold });
  }
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
    for (const f of teams) if (advantagedFaction(state, f)) for (const r of RESOURCE_IDS) res[f][r] += state.rules.computerResources?.[r] ?? 0;
  }
  const rng = new Rng((state.setup.seed ^ 0x3c6ef372) | 0);
  const nameBag = byTeam(teams, (t) => rng.shuffle([...NAMES[raceOf(state, t)]]));
  // Level 6: the barracks stand from the start in every settlement (the dwellings of the units are built beside them).
  const empty = (): Record<BuildingId, number> => ({ barracks: state.rules.empire ? 1 : 0, market: 0, hospital: 0, treasury: 0, ...(state.rules.economy ? { forge: 0, walls: 0 } : {}), ...(state.rules.realm ? { tavern: 0, magic: 0 } : {}), ...(state.rules.empire ? { spark: 0, shrine: 0, nursery: 0, grove: 0, bloodPit: 0, plunder: 0, wolfDen: 0, hoofStone: 0, pastures: 0, refuge: 0, barrow: 0, ossuary: 0, bellTower: 0, shieldHall: 0, runeForge: 0, deepMine: 0, frostPalace: 0, crystalGrotto: 0, blizzardTower: 0, trapWorkshop: 0, fence: 0, smugglerTrails: 0, mirageHall: 0, caravanRoad: 0, sandGate: 0, myceliumHeart: 0, mushroomGarden: 0, tunnels: 0, tideTemple: 0, pearlBanks: 0, lighthouse: 0 } : {}) }) as Record<BuildingId, number>;
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
  const guards = guardRng(state, 0x27220a95);
  const share = factionShare(chosen.length, guards);
  chosen.forEach((hex, i) => {
    const land = state.tiles[hex].side;
    add(`set${i + 1}`, hex, land, null);
    const units = guardUnits(state, 1, neutralGroup(1, rng), share[i], guards);
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
  // Level 4: every side has a sawmill and an ore mine not far from its starting settlement (the nearest free hex of its own land, at least 2 away).
  if (k.res) {
    const open = Object.values(state.tiles).filter((t) => !t.home && !t.tree && !t.crystalId && !t.site && !t.place && t.terrain !== 'bridge' && tileCost(t) !== null && !near(t.key, 1));
    const spread = (key: string) => [...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, state.setup.seed | 0);
    for (const res of ['wood', 'ore'] as const) {
      for (const team of teams) {
        const home = parseKey(Object.values(state.tiles).find((t) => t.home === team)!.key);
        const options = open
          .filter((t) => t.side === team && !t.place && distance(home, parseKey(t.key)) >= 2)
          .filter((t) => !taken.some((c) => distance(parseKey(c), parseKey(t.key)) <= 1) && !mapNeighbors(state.tiles, t.key).some((n) => state.tiles[n].crystalId))
          .sort((x, y) => distance(home, parseKey(x.key)) - distance(home, parseKey(y.key)) || spread(x.key) - spread(y.key));
        const t = options[0];
        if (!t) continue;
        k.mines[t.key] = { owner: null, res };
        t.place = { kind: 'mine', id: t.key };
        taken.push(t.key);
      }
    }
  }
  for (const clear of [1, 0]) {
    for (const t of free(clear)) {
      if (Object.values(k.mines).filter((m) => !m.res).length >= wantMines) break;
      if (taken.some((c) => distance(parseKey(c), parseKey(t.key)) <= 1) || mapNeighbors(state.tiles, t.key).some((n) => state.tiles[n].crystalId)) continue;
      k.mines[t.key] = { owner: null };
      state.tiles[t.key].place = { kind: 'mine', id: t.key };
      taken.push(t.key);
    }
  }
  // Level 4: mines of wood, ore and Gwiezdny Pył, placed like the gold ones.
  if (k.res) {
    for (const res of RESOURCE_IDS) {
      const want = res === 'dust' ? ECONOMY.mines[res][state.setup.mapSize] ?? 1 : Math.max(ECONOMY.mines[res][state.setup.mapSize] ?? 1, teams.length);
      let placed = Object.values(k.mines).filter((m) => m.res === res).length;
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
    // Paserka, second level: every few rounds a random treasure comes to the faction's inventory.
    const fs = state.factions[f];
    if (bestLevel(state, f, 'fence') >= 2 && state.round % FACTION_MECHANICS.fenceTreasureEvery === 0 && fs.fenceRound !== state.round) {
      fs.fenceRound = state.round;
      const kind = new Rng((state.setup.seed ^ 0x2f4a7c15 ^ (state.round * 7919)) | 0).pick(NON_RESURRECTION_ITEMS);
      const item = { id: `it${Object.keys(state.items).length + 1}`, kind, owner: f, foundBy: null };
      state.items[item.id] = item;
      fs.inventory.push(item.id);
      log(state, 'item', `${FACTION_NAMES[raceOf(state, f)]}: Paserka przynosi skarb: ${itemDef(kind, isDigital(state.rules)).name}.`, f);
    }
    // Podziemne Korytarze (the Swarm): the free mines round a settlement with the tunnels go to the faction.
    tunnelMines(state, f);
    // Latarnia Morska (the Tides): the land round a settlement with the lighthouse is revealed.
    lighthouseReveal(state, f);
    // The computer's advantage of the higher levels: its income is multiplied (COMPUTER_HANDICAP); the people's is not.
    const mult = advantagedFaction(state, f) ? state.rules.computerGold ?? 1 : 1;
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
  seeHex(state, hero.pos, hero.faction);
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
/** What the market pays for one resource: its price, and with the second level of the Szlak Karawan (the Desert Empire) as much as buying it costs there. */
export const tradeSellPrice = (state: GameState, f: TeamId, s: Settlement, res: ResourceId): number =>
  raceOf(state, f) === 'sands' && bestLevel(state, f, 'caravanRoad') >= 2 ? Math.max(ECONOMY.tradeSell[res], tradeBuyPrice(s, res)) : ECONOMY.tradeSell[res];

/** What an artifact costs in the market for this hero: gold, and Gwiezdny Pył for a legendary one in level 4. */
export const artifactBill = (state: GameState, hero: HeroState, art: ArtifactDef): Cost => ({
  gold: artifactCost(hero, art),
  ...(state.rules.economy && art.rarity === 3 ? { dust: ECONOMY.legendaryDust } : {}),
});

/** The best level of a building of the faction among the settlements it holds (0: none; only a level 6 game has the buildings of the factions). */
export const bestLevel = (state: GameState, f: TeamId, b: BuildingId): number =>
  state.rules.empire ? Math.max(0, ...Object.values(state.kingdom?.settlements ?? {}).filter((s) => s.owner === f).map((s) => buildingLevel(s, b))) : 0;
/** Paserka: what the fence pays for an artifact from the backpack: the full market price of its rarity (never reduced by the Kapelusz Kupca). */
export const fenceSellPrice = (art: ArtifactDef): number => KINGDOM.artifactPrice[art.rarity - 1];

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
export const BUILDING_PARENT: Partial<Record<BuildingId, BuildingId>> = { forge: 'barracks', walls: 'barracks', hospital: 'barracks', magic: 'hospital', tavern: 'market', shrine: 'hospital', grove: 'magic', nursery: 'treasury', bloodPit: 'forge', wolfDen: 'walls', plunder: 'market', hoofStone: 'barracks', pastures: 'market', refuge: 'tavern', barrow: 'hospital', ossuary: 'treasury', bellTower: 'barracks', shieldHall: 'walls', runeForge: 'forge', deepMine: 'treasury', frostPalace: 'magic', crystalGrotto: 'treasury', blizzardTower: 'walls', trapWorkshop: 'market', fence: 'market', smugglerTrails: 'tavern', mirageHall: 'market', caravanRoad: 'market', sandGate: 'tavern', myceliumHeart: 'hospital', mushroomGarden: 'treasury', tunnels: 'barracks', tideTemple: 'walls', pearlBanks: 'treasury', lighthouse: 'market' };

/** Why a building cannot be started here for lack of its parent (null: nothing in the way). Upgrades of a standing building are never blocked. */
export function buildBlock(s: Settlement, b: BuildingId): string | null {
  const parent = BUILDING_PARENT[b];
  if (!parent || buildingLevel(s, b) >= 1 || buildingLevel(s, parent) >= 1) return null;
  return `Najpierw: ${BUILDING_NAMES[parent][0]}.`;
}

/**
 * Podziemne Korytarze (the Swarm of the Wilds): at the start of a round every mine nobody holds within the tunnels' radius of a settlement of the faction goes to it.
 * A mine an enemy hero has taken stays the enemy's (it is not free), until a hero of the Swarm takes it back.
 */
export function tunnelMines(state: GameState, f: TeamId): void {
  const k = state.kingdom;
  if (!k || !state.rules.empire || raceOf(state, f) !== 'swarm') return;
  const holes = settlementsOf(state, f).filter((s) => buildingLevel(s, 'tunnels') >= 1);
  if (!holes.length) return;
  for (const [hex, m] of Object.entries(k.mines)) {
    if (m.owner !== null) continue;
    const near = holes.find((s) => distance(parseKey(s.at), parseKey(hex)) <= FACTION_MECHANICS.tunnelRadius[Math.min(buildingLevel(s, 'tunnels'), 2) - 1]);
    if (!near) continue;
    m.owner = f;
    log(state, 'info', `${FACTION_NAMES[raceOf(state, f)]}: Podziemne Korytarze (${near.name}) przejmują: ${MINE_NAMES[m.res ?? 'gold'].toLowerCase()}.`, f);
  }
}

/**
 * Latarnia Morska (the Brotherhood of the Tide): at the start of a round the hexes within the lighthouse's radius of every settlement of the faction that has one are
 * revealed for the faction (with the enemy heroes standing there).
 */
export function lighthouseReveal(state: GameState, f: TeamId): number {
  if (!state.kingdom || !state.rules.empire || raceOf(state, f) !== 'tides') return 0;
  let n = 0;
  for (const s of settlementsOf(state, f)) {
    const level = buildingLevel(s, 'lighthouse');
    if (level >= 1) n += revealAround(state, s.at, FACTION_MECHANICS.lighthouseRadius[Math.min(level, 2) - 1], f).length;
  }
  if (n) log(state, 'info', `${FACTION_NAMES[raceOf(state, f)]}: Latarnia Morska odkrywa pola (${n}).`, f);
  return n;
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
  // Level 6, the Iron Clans: the Głęboka Sztolnia gives ore from every settlement that has one, and with its second level Pył every few rounds.
  // The Court of Everfrost has the same in the Kryształowa Grota.
  if (state.rules.empire) {
    for (const b of ['deepMine', 'crystalGrotto'] as const) {
      const mines = settlementsOf(state, f).filter((x) => buildingLevel(x, b) >= 1);
      if (mines.length) rows.push({ label: BUILDING_NAMES[b][0], res: 'ore', amount: mines.length * FACTION_MECHANICS.mineOre });
      const deep = mines.filter((x) => buildingLevel(x, b) >= 2).length;
      if (deep && state.round % FACTION_MECHANICS.mineDustEvery === 0) rows.push({ label: BUILDING_NAMES[b][1], res: 'dust', amount: deep * FACTION_MECHANICS.mineDust });
    }
    // Ogród Grzybów (the Swarm): wood and ore from every settlement with the garden, every second round (every round with its second level).
    const gardens = settlementsOf(state, f).filter((x) => buildingLevel(x, 'mushroomGarden') >= 1 && state.round % FACTION_MECHANICS.gardenEvery[Math.min(buildingLevel(x, 'mushroomGarden'), 2) - 1] === 0);
    if (gardens.length) {
      rows.push({ label: BUILDING_NAMES.mushroomGarden[0], res: 'wood', amount: gardens.length });
      rows.push({ label: BUILDING_NAMES.mushroomGarden[0], res: 'ore', amount: gardens.length });
    }
    // Perłowe Ławice II (the Tides): Pył every few rounds from every settlement with the second level.
    const pearls = settlementsOf(state, f).filter((x) => buildingLevel(x, 'pearlBanks') >= 2).length;
    if (pearls && state.round % FACTION_MECHANICS.pearlDustEvery === 0) rows.push({ label: BUILDING_NAMES.pearlBanks[1], res: 'dust', amount: pearls * FACTION_MECHANICS.pearlDust });
  }
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
      const price = healPrice(state, hero.faction, s, action.unitId);
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
    case 'kingdomSellArtifact': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      if (buildingLevel(s, 'fence') < 1) throw new Error('Artefakty z plecaka skupuje Paserka.');
      const art = ARTIFACT_BY_ID[action.artifactId];
      const at = (hero.pack ?? []).indexOf(action.artifactId);
      if (!art || at < 0) throw new Error('Tego artefaktu nie ma w plecaku bohatera.');
      hero.pack = (hero.pack ?? []).filter((_, i) => i !== at);
      const price = fenceSellPrice(art);
      k.gold[hero.faction] += price;
      log(state, 'info', `${UNITS[hero.id].name} sprzedaje w Paserce: ${art.name} (${price} zł).`, hero.faction);
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
        const paid = tradeSellPrice(state, f, s, action.res);
        k.gold[f] += paid;
        log(state, 'info', `${FACTION_NAMES[raceOf(state, f)]} sprzedaje: ${RESOURCE_NAMES[action.res]} (${paid} zł).`, f);
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
      const sell = tradeSellPrice(state, f, s, action.from);
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
      revealAround(state, hero.pos, 1, hero.faction);
      log(state, 'info', `${heroLabel(hero)} przenosi się przez Ostoję Wędrówek do osady ${to.name}.`, hero.faction);
      break;
    }
    case 'kingdomForgeRune': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      const why = runeBlock(state, hero.faction, s, action.unitId, action.rune);
      if (why) throw new Error(why);
      payCost(state, hero.faction, FACTION_MECHANICS.runePrice);
      const fs = state.factions[hero.faction];
      (fs.runes ??= {})[action.unitId] = [...(fs.runes[action.unitId] ?? []), action.rune];
      fs.runeRound = state.round;
      log(state, 'info', `${FACTION_NAMES[raceOf(state, hero.faction)]}: kowal wybija runę (${RUNE_NAMES[action.rune]}) na jednostce ${UNITS[action.unitId].name} (${costText(FACTION_MECHANICS.runePrice)}).`);
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
      // Paserka: the chest gives gold on top, whatever the player chose.
      const fenceGold = bestLevel(state, hero.faction, 'fence') >= 1 ? FACTION_MECHANICS.fenceChestGold : 0;
      if (fenceGold) {
        k.gold[hero.faction] += fenceGold;
        log(state, 'info', `${UNITS[hero.id].name} dostaje jeszcze ${fenceGold} zł (Paserka).`);
        lootEvent(state, hero, fenceGold);
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

/** Level 6: the next building a bot raises on the way to its faction's mechanic building (the missing parent first), null when the mechanic stands or the barracks do not. */
function mechanicStep(state: GameState, f: TeamId, s: Settlement): BuildingId | null {
  if (!state.rules.empire || s.land !== f || s.buildings.barracks < 1 || mechanicLevel(state, f) >= 1 || !dwellingOf(state, f, 2)) return null;
  const chain: BuildingId[] = [];
  for (let b: BuildingId | undefined = MECHANIC_BUILDING[raceOf(state, f)]; b && buildingLevel(s, b) < 1; b = BUILDING_PARENT[b]) chain.unshift(b);
  return chain[0] ?? null;
}

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
  if (state.rules.empire && buildingLevel(s, 'runeForge') >= 1) {
    const forged = botRune(state, f, s);
    if (forged) return { type: 'kingdomForgeRune', settlementId: id, ...forged };
  }
  // Level 6: the faction's mechanic building right after the barracks (and the recruits it can pay for), through its parent buildings, the same for every faction.
  const mechStep = mechanicStep(state, f, s);
  if (mechStep) {
    if (buildable(mechStep)) return { type: 'kingdomBuild', settlementId: id, building: mechStep };
    // Short of a resource or of the gold for one: trade for it, and keep the gold for it meanwhile (nothing else is bought).
    return tradeToward(state, f, s, mechStep);
  }
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
    if (afford(healPrice(state, f, s, dead))) return { type: 'kingdomHeal', settlementId: id, unitId: dead };
  }
  if (s.buildings.treasury < 1 && buildable('treasury')) return { type: 'kingdomBuild', settlementId: id, building: 'treasury' };
  if (state.rules.economy && buildingLevel(s, 'forge') < 1 && forgeLevel(state, f) < 1 && buildable('forge')) return { type: 'kingdomBuild', settlementId: id, building: 'forge' };
  // The Iron Clans live by their mine and their forge of runes: the Sztolnia first (it pays the ore), the Runiczna Kuźnia as soon as the forge stands.
  if (state.rules.empire && own && raceOf(state, f) === 'clans' && s.buildings.treasury >= 1) {
    if (buildingLevel(s, 'deepMine') < 1 && buildable('deepMine')) return { type: 'kingdomBuild', settlementId: id, building: 'deepMine' };
    if (forgeLevel(state, f) >= 1 && buildingLevel(s, 'forge') >= 1 && !settlementsOf(state, f).some((x) => buildingLevel(x, 'runeForge') >= 1) && buildable('runeForge')) return { type: 'kingdomBuild', settlementId: id, building: 'runeForge' };
  }
  // The Kingdom of the Dead builds the hospital at once (the Kurhan Wiecznej Warty stands on it), the others only when somebody has fallen.
  const wardRoad = state.rules.empire && own && raceOf(state, f) === 'undead' && s.buildings.barracks >= 1;
  if (s.buildings.hospital < 1 && (fs.supportsDead.length || wardRoad) && buildable('hospital')) return { type: 'kingdomBuild', settlementId: id, building: 'hospital' };
  if (wardRoad && s.buildings.hospital >= 1 && buildingLevel(s, 'barrow') < 1 && buildable('barrow') && canPay(state, f, { ...buildCost(state, s, 'barrow')!, gold: buildCost(state, s, 'barrow')!.gold + 1 })) return { type: 'kingdomBuild', settlementId: id, building: 'barrow' };
  // The Companies' bot sells the backpack's spare artifacts at the fence (not a piece of a set it collects).
  if (buildingLevel(s, 'fence') >= 1) {
    const seller = state.heroes[state.turnOrder[state.turnIndex]];
    const spare = seller?.faction === f && seller.alive ? packOf(seller).find((a) => !a.set || setCount(seller, a.set) < 2) : undefined;
    if (spare) return { type: 'kingdomSellArtifact', settlementId: id, artifactId: spare.id };
  }
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
      if (x === 'grove' || x === 'wolfDen' || x === 'smugglerTrails' || x === 'sandGate' || x === 'tunnels' || x === 'lighthouse') return !settlementsOf(state, f).some((y) => buildingLevel(y, x) >= 1);
      return true;
    });
    // The Clans build the mine and the rune forge first (the forge is what makes them strong over the long run), the shield hall after them.
    const order = raceOf(state, f) === 'clans' ? ['deepMine', 'runeForge', mech, ...wanted] : [mech, ...wanted];
    for (const b of [...new Set(order)].filter((x) => wanted.includes(x as BuildingId)) as BuildingId[]) {
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
  const mechStep = mechanicStep(state, f, s);
  if (mechStep) wanted.push(mechStep);
  if (s.buildings.treasury < 1) wanted.push('treasury');
  if (s.buildings.market < 1) wanted.push('market');
  if (forgeLevel(state, f) < 1) wanted.push('forge');
  if (state.rules.empire && own && raceOf(state, f) === 'clans' && s.buildings.treasury >= 1) wanted.push(buildingLevel(s, 'deepMine') < 1 ? 'deepMine' : 'runeForge');
  if (s.buildings.hospital < 1 && fs.supportsDead.length) wanted.push('hospital');
  if (state.rules.realm && own && s.buildings.barracks >= 1) {
    if (!settlementsOf(state, f).some((x) => buildingLevel(x, 'tavern') >= 1)) wanted.push('tavern');
    if (!settlementsOf(state, f).some((x) => buildingLevel(x, 'magic') >= 1)) wanted.push('magic');
  }
  if (own && s.buildings.barracks === 1) wanted.push('barracks');
  if (buildingLevel(s, 'forge') === 1) wanted.push('forge');
  for (const b of wanted) {
    const buy = tradeToward(state, f, s, b);
    if (buy) return buy;
  }
  return null;
}

/** Buys one unit of a resource the building still lacks, when the gold for the whole bill (building and every missing unit) is there (null: nothing to buy yet). */
function tradeToward(state: GameState, f: TeamId, s: Settlement, b: BuildingId): Action | null {
  const k = state.kingdom!;
  if (!k.res) return null;
  const c = buildCost(state, s, b);
  if (!c) return null;
  const missing = RESOURCE_IDS.filter((r) => k.res![f][r] < (c[r] ?? 0));
  if (!missing.length) return null;
  const bill = c.gold + missing.reduce((n, r) => n + (c[r]! - k.res![f][r]) * tradeBuyPrice(s, r), 0);
  return k.gold[f] >= bill ? { type: 'kingdomTrade', settlementId: s.id, res: missing[0], dir: 'buy' } : null;
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
