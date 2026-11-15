// Level 3 "Osada" (digital, rule `kingdom`, built on hero growth): gold, settlements with buildings, gold mines, a market of artifacts, a hospital,
// recruitment of supports and a team that grows. Design: docs/POZIOM_3_KROLESTWO.md (the author's decisions of 13.11.2026). Every number here is
// provisional: the simulations tune them. Gold is small (the cheapest thing costs 1) and shared by the whole faction.

import { FACTION_NAMES, FACTION_SUPPORTS, SUPPORTS_PER_BATTLE, UNITS, type FactionId } from './data';
import { distance, parseKey, type HexKey } from './hex';
import { encounterUnits, stillConnected } from './encounters';
import { awardXp, levelOf } from './growth';
import { log } from './log';
import { mapNeighbors, tileCost } from './map';
import { Rng } from './rng';
import { costText, ECONOMY, thingsText, type Hut, emptyResources, RESOURCE_IDS, RESOURCE_NAMES, MINE_NAMES, type Cost, type ResourceId, type Resources } from './economy';
import { ARTIFACT_BY_ID, ARTIFACT_ODDS, artifactPool, completeSets, drawArtifact, gearOf, SETS, setCount, type ArtifactDef, giveArtifact, type Rarity } from './sites';
import { ENCOUNTER_MOTIFS, type EncounterMotif } from './data';
import type { Action, Crystal, GameState, HeroState } from './types';

export type BuildingId = 'barracks' | 'market' | 'hospital' | 'treasury' | 'forge';

export interface Settlement {
  id: string;
  at: HexKey;
  /** The faction whose land it lies on (decides the name and who may recruit there). */
  land: FactionId;
  name: string;
  /** Who holds it now (null: still held by neutrals, the fight for it is on). */
  owner: FactionId | null;
  /** Level of each building: 0 not built, 1 built, 2 upgraded (the treasury has only 1). The forge exists in level 4 only (missing = 0: read it with `buildingLevel`). */
  buildings: Record<BuildingId, number>;
  /** Offers of the current market period already bought (the offer itself is drawn from the seed, see `marketStock`). */
  bought: string[];
  boughtEpoch: number;
}

export interface KingdomState {
  gold: Record<FactionId, number>;
  settlements: Record<string, Settlement>;
  /** `res`: the resource a mine gives (missing: gold). */
  mines: Record<HexKey, { owner: FactionId | null; res?: ResourceId }>;
  /** Level 4 (rule `economy`): wood, ore and Gwiezdny Pył of each faction, and the round of the last building (one a round per faction). */
  res?: Record<FactionId, Resources>;
  /** Level 4: huts with a quest, by hex. */
  huts?: Record<HexKey, Hut>;
  built?: Record<FactionId, number>;
  /** A hero opened a chest and has to choose: its contents (an artifact) or gold. */
  chest: { heroId: string } | null;
}

export const KINGDOM = {
  startGold: 2,
  /** Income per round: from every settlement it holds (the starting one too), from a mine, from a treasury. */
  incomeSettlement: 2,
  incomeMine: 1,
  incomeTreasury: 1,
  /** Gold in a chest chosen instead of the artifact. */
  chestGold: 3,
  /** Cost of each level of a building. */
  cost: { barracks: [3, 6], market: [3, 5], hospital: [3, 5], treasury: [4], forge: [] } as Record<BuildingId, number[]>,
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
const TIER_UNITS: Record<FactionId, string[]> = {
  dawn: ['hedgehog', 'centaur', 'boar', 'treeGuardian'],
  horde: ['ratman', 'hellhound', 'salamander', 'minotaurChief'],
};

/** The supports a faction can recruit, by tier: tier 1 are the supports it starts the game with in the other levels, tiers 2–5 are the new units (tiers 4–5 need upgraded barracks). */
export const RECRUITS: Record<FactionId, Array<{ id: string; tier: number; cost: number }>> = {
  dawn: [...FACTION_SUPPORTS.dawn.map((id) => ({ id, tier: 1, cost: RECRUIT_COSTS[0] })), ...TIER_UNITS.dawn.map((id, i) => ({ id, tier: i + 2, cost: RECRUIT_COSTS[i + 1] }))],
  horde: [...FACTION_SUPPORTS.horde.map((id) => ({ id, tier: 1, cost: RECRUIT_COSTS[0] })), ...TIER_UNITS.horde.map((id, i) => ({ id, tier: i + 2, cost: RECRUIT_COSTS[i + 1] }))],
};

const NAMES: Record<FactionId, string[]> = {
  dawn: ['Świtogaj', 'Srebrzysty Bród', 'Złotolist', 'Jasna Polana', 'Perłowa Wieża', 'Kryształowa Przystań', 'Wiosenny Gród', 'Miodowy Dwór', 'Zorzyca', 'Białe Mosty', 'Rosogród', 'Słonecznik', 'Lazurowa Zatoka', 'Skrzydlata Przystań', 'Malwowa Dolina', 'Wierzbowy Gaj'],
  horde: ['Czarnogrzęd', 'Żelazna Brama', 'Popielisko', 'Krwawy Bród', 'Sadzawa Cieni', 'Kościany Szaniec', 'Węglowisko', 'Gniewogród', 'Smolna Twierdza', 'Ciernisty Gród', 'Ogrza Warownia', 'Czerwony Szaniec', 'Dymiące Wrota', 'Trupia Przełęcz', 'Mglisty Kopiec', 'Wilcza Jama'],
};

export const BUILDING_NAMES: Record<BuildingId, [string, string?]> = {
  barracks: ['Koszary', 'Rozbudowane koszary'],
  market: ['Targ', 'Duży targ'],
  hospital: ['Szpital', 'Ulepszony szpital'],
  treasury: ['Skarbiec'],
  forge: ['Kuźnia', 'Wielka kuźnia'],
};

/** The buildings a settlement may have in this game, in the order of the screen (the forge comes with level 4). */
export const buildingsOf = (state: GameState): BuildingId[] => ['barracks', 'market', 'hospital', 'treasury', ...(state.rules.economy ? ['forge' as const] : [])];

export const buildingLevel = (s: Settlement, b: BuildingId): number => s.buildings[b] ?? 0;

/** The best forge among the faction's settlements (0: none). */
export const forgeLevel = (state: GameState, f: FactionId): number => (state.rules.economy ? Math.max(0, ...settlementsOf(state, f).map((s) => buildingLevel(s, 'forge'))) : 0);

export const BUILDING_TEXTS: Record<BuildingId, [string, string?]> = {
  barracks: ['Pozwalają rekrutować pomocników.', 'Dodatkowe miejsce w drużynie i dostęp do najmocniejszych jednostek.'],
  market: ['Trzy artefakty w ofercie, nowa oferta co 3 rundy.', 'Pięć artefaktów w ofercie.'],
  hospital: ['Wskrzesza poległych pomocników za połowę ich ceny.', 'Wskrzesza za jedną trzecią ceny.'],
  treasury: ['Przynosi +1 złota na rundę.'],
  forge: ['Pomocnicy całej frakcji walczą z +1 do Ataku.', 'Pomocnicy dostają też +1 do Życia.'],
};

/** The coop Horde is steered by the automaton: it earns no gold and shops nowhere; reinforcements come to it instead. */
export const isAutomaton = (state: GameState, f: FactionId): boolean => state.setup.mode === 'coop' && f === 'horde';

/** A bot with this much gold walks home to spend it. */
export const KINGDOM_BIG_PILE = 12;

export const kingdomOn = (state: GameState): boolean => Boolean(state.kingdom);

export const goldOf = (state: GameState, f: FactionId): number => state.kingdom?.gold[f] ?? 0;

/** The settlement standing on `hex`, if any. */
export const settlementAt = (state: GameState, hex: HexKey): Settlement | undefined =>
  state.kingdom ? Object.values(state.kingdom.settlements).find((s) => s.at === hex) : undefined;

/** The faction's settlements. */
export const settlementsOf = (state: GameState, f: FactionId): Settlement[] =>
  state.kingdom ? Object.values(state.kingdom.settlements).filter((s) => s.owner === f) : [];

/** Gold per round the faction earns now, with where it comes from. */
export function incomeBreakdown(state: GameState, f: FactionId): Array<{ label: string; gold: number }> {
  const k = state.kingdom;
  if (!k) return [];
  const rows: Array<{ label: string; gold: number }> = [];
  for (const s of Object.values(k.settlements)) {
    if (s.owner !== f) continue;
    rows.push({ label: s.name, gold: KINGDOM.incomeSettlement });
    if (s.buildings.treasury) rows.push({ label: `Skarbiec (${s.name})`, gold: KINGDOM.incomeTreasury });
  }
  for (const [hex, m] of Object.entries(k.mines)) if (m.owner === f) rows.push({ label: `Kopalnia (${hex})`, gold: KINGDOM.incomeMine });
  // Strój Kupca (three of three): +1 gold a round, once for the faction.
  const merchants = Object.values(state.heroes).filter((h) => h.faction === f && h.alive && completeSets(h).some((d) => d.income));
  if (merchants.length) rows.push({ label: SETS.merchant.name, gold: SETS.merchant.income! });
  // Easy: the help the level gives the Przymierza (tuning.ts).
  if (f === 'dawn' && state.rules.dawnGoldBonus) rows.push({ label: 'Pomoc na Łatwym poziomie', gold: state.rules.dawnGoldBonus });
  return rows;
}

export const incomeOf = (state: GameState, f: FactionId): number => incomeBreakdown(state, f).reduce((s, r) => s + r.gold, 0);

/** How many supports a faction brings into a battle: 2 in the other levels, the team's places here. */
export const supportSlots = (state: GameState, f: FactionId): number => (state.kingdom ? teamSlots(state, f) : SUPPORTS_PER_BATTLE);

/** Places in the team: a hero of this faction at level 3 and 6, and upgraded barracks, each add one. */
export function teamSlots(state: GameState, f: FactionId): number {
  if (!state.kingdom) return 2;
  const heroes = Object.values(state.heroes).filter((h) => h.faction === f);
  const level = Math.max(1, ...heroes.map((h) => levelOf(h)));
  const barracks = settlementsOf(state, f).some((s) => s.buildings.barracks >= 2) ? 1 : 0;
  return Math.min(KINGDOM.slotsMax, KINGDOM.slotsBase + (level >= 3 ? 1 : 0) + (level >= 6 ? 1 : 0) + barracks);
}

// ------------------------------------------------------------------ the map

/** Settlements (the starting ones and the ones to conquer, each with its neutral defenders) and gold mines; called when a game is made. */
export function initKingdom(state: GameState): void {
  const k: KingdomState = { gold: { dawn: KINGDOM.startGold, horde: KINGDOM.startGold }, settlements: {}, mines: {}, chest: null };
  state.kingdom = k;
  if (state.rules.economy) k.res = { dawn: { ...ECONOMY.start }, horde: { ...ECONOMY.start } };
  const rng = new Rng((state.setup.seed ^ 0x3c6ef372) | 0);
  const nameBag: Record<FactionId, string[]> = { dawn: rng.shuffle([...NAMES.dawn]), horde: rng.shuffle([...NAMES.horde]) };
  const empty = (): Record<BuildingId, number> => ({ barracks: 0, market: 0, hospital: 0, treasury: 0, ...(state.rules.economy ? { forge: 0 } : {}) }) as Record<BuildingId, number>;
  const add = (id: string, at: HexKey, land: FactionId, owner: FactionId | null) => {
    k.settlements[id] = { id, at, land, name: nameBag[land].pop() ?? `${FACTION_NAMES[land]} ${Object.keys(k.settlements).length + 1}`, owner, buildings: empty(), bought: [], boughtEpoch: -1 };
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
  const picked: Record<FactionId, string[]> = { dawn: [], horde: [] };
  const all = () => [...picked.dawn, ...picked.horde];
  for (const [clear, gap] of [[1, 2], [1, 1], [0, 1]] as const) {
    for (const land of ['dawn', 'horde'] as FactionId[]) {
      for (const t of free(clear).filter((x) => x.side === land)) {
        if (picked[land].length >= want) break;
        if (all().some((c) => distance(parseKey(c), parseKey(t.key)) <= gap - 1 + (gap > 1 ? 1 : 0))) continue;
        if (!stillConnected(state, new Set([...blocked, ...all(), t.key]))) continue;
        picked[land].push(t.key);
      }
    }
  }
  // Both sides get the same number.
  const each = Math.min(picked.dawn.length, picked.horde.length);
  const chosen = [...picked.dawn.slice(0, each), ...picked.horde.slice(0, each)];
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
  const name = UNITS[hero.id].name;
  if (place.kind === 'settlement') {
    const s = k.settlements[place.id];
    if (s.owner === hero.faction) return;
    const before = s.owner;
    s.owner = hero.faction;
    log(state, 'info', `${name} zajmuje osadę ${s.name}${before ? ` (należała do: ${FACTION_NAMES[before]})` : ''}.`);
    firstPlaceGold(state, hero);
  } else if (place.kind === 'mine') {
    const m = k.mines[place.id];
    if (m.owner === hero.faction) return;
    m.owner = hero.faction;
    log(state, 'info', `${name} zajmuje: ${MINE_NAMES[m.res ?? 'gold'].toLowerCase()}.`);
    firstPlaceGold(state, hero);
  }
}

/** Buty Handlarza: the first place the hero takes pays a gold coin, once. */
function firstPlaceGold(state: GameState, hero: HeroState): void {
  const gold = gearOf(hero).reduce((n, a) => n + (a.firstPlaceGold ?? 0), 0);
  if (!gold || hero.placeGoldPaid) return;
  hero.placeGoldPaid = true;
  state.kingdom!.gold[hero.faction] += gold;
  log(state, 'info', `${UNITS[hero.id].name} dostaje ${gold} zł za pierwsze zajęcie miejsca (Buty Handlarza).`);
}

/** The end of a round: every faction collects its income. */
export function collectIncome(state: GameState): void {
  const k = state.kingdom;
  if (!k) return;
  for (const f of ['dawn', 'horde'] as FactionId[]) {
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
    if (k.res) {
      const got = resourceIncomeOf(state, f);
      const parts = RESOURCE_IDS.filter((r) => got[r] > 0).map((r) => `${got[r]} × ${RESOURCE_NAMES[r]}`);
      for (const r of RESOURCE_IDS) k.res[f][r] += got[r];
      if (parts.length) log(state, 'info', `${FACTION_NAMES[f]}: surowce ${parts.join(', ')}.`, f);
    }
    const income = incomeOf(state, f);
    if (income <= 0) continue;
    k.gold[f] += income;
    log(state, 'info', `${FACTION_NAMES[f]}: dochód ${income} zł (razem ${k.gold[f]}).`, f);
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

function pay(state: GameState, f: FactionId, price: number) {
  const k = state.kingdom!;
  if (k.gold[f] < price) throw new Error(`Za mało złota (potrzeba ${price}).`);
  k.gold[f] -= price;
}

/** What it costs to build or upgrade a building next (null: it is complete). */
export const nextCost = (s: Settlement, b: BuildingId): number | null => KINGDOM.cost[b][buildingLevel(s, b)] ?? null;

/** The full price of the next level of a building: gold only in level 3, gold and resources in level 4 (null: it is complete). */
export function buildCost(state: GameState, s: Settlement, b: BuildingId): Cost | null {
  if (state.rules.economy) return ECONOMY.cost[b][buildingLevel(s, b)] ?? null;
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

export const resOf = (state: GameState, f: FactionId): Resources => state.kingdom?.res?.[f] ?? emptyResources();

export function canPay(state: GameState, f: FactionId, c: Cost): boolean {
  const k = state.kingdom;
  return Boolean(k) && k!.gold[f] >= c.gold && RESOURCE_IDS.every((r) => resOf(state, f)[r] >= (c[r] ?? 0));
}

/** Pays a price from the faction's stock (throws, naming what is missing). */
export function payCost(state: GameState, f: FactionId, c: Cost): void {
  const k = state.kingdom!;
  const missing = [...(k.gold[f] < c.gold ? [`${c.gold - k.gold[f]} zł`] : []), ...RESOURCE_IDS.filter((r) => resOf(state, f)[r] < (c[r] ?? 0)).map((r) => `${c[r]! - resOf(state, f)[r]} × ${RESOURCE_NAMES[r]}`)];
  if (k.gold[f] < c.gold && missing.length === 1) throw new Error(`Za mało złota (potrzeba ${c.gold}).`);
  if (missing.length) throw new Error(`Brakuje: ${missing.join(', ')}.`);
  k.gold[f] -= c.gold;
  for (const r of RESOURCE_IDS) if (c[r]) k.res![f][r] -= c[r]!;
}

/** Level 4 allows one building (or upgrade) a round per faction. */
export const mayBuildNow = (state: GameState, f: FactionId): boolean => !state.rules.economy || state.kingdom?.built?.[f] !== state.round;

/** Resources per round the faction earns now, with where they come from. */
export function resourceIncomeBreakdown(state: GameState, f: FactionId): Array<{ label: string; res: ResourceId; amount: number }> {
  const k = state.kingdom;
  if (!k?.res) return [];
  const rows: Array<{ label: string; res: ResourceId; amount: number }> = [];
  for (const s of Object.values(k.settlements)) {
    if (s.owner !== f) continue;
    for (const r of RESOURCE_IDS) if (ECONOMY.incomeSettlement[r]) rows.push({ label: s.name, res: r, amount: ECONOMY.incomeSettlement[r] });
  }
  for (const [hex, m] of Object.entries(k.mines)) if (m.owner === f && m.res) rows.push({ label: `${MINE_NAMES[m.res]} (${hex})`, res: m.res, amount: ECONOMY.incomeMine[m.res] });
  return rows;
}

export const resourceIncomeOf = (state: GameState, f: FactionId): Resources => {
  const out = emptyResources();
  for (const row of resourceIncomeBreakdown(state, f)) out[row.res] += row.amount;
  return out;
};

/** Recruiting, healing and trading are for the land's own faction: a captured foreign settlement gives income, the market and the hospital only. */
export const mayRecruit = (s: Settlement, f: FactionId) => s.land === f && s.owner === f;

export function kingdomAction(state: GameState, action: Action): void {
  const k = state.kingdom;
  if (!k) throw new Error('To nie jest poziom Osada.');
  switch (action.type) {
    case 'kingdomBuild': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      const b = action.building;
      const price = buildCost(state, s, b);
      if (price === null) throw new Error('Ten budynek jest już w pełni rozbudowany.');
      if (b === 'barracks' && s.land !== hero.faction) throw new Error('Obcej osady nie rozbudujesz o koszary.');
      if (!mayBuildNow(state, hero.faction)) throw new Error('W tej rundzie budowaliście już: jeden budynek na rundę.');
      payCost(state, hero.faction, price);
      if (state.rules.economy) (k.built ??= { dawn: 0, horde: 0 })[hero.faction] = state.round;
      s.buildings[b] = buildingLevel(s, b) + 1;
      log(state, 'info', `${FACTION_NAMES[hero.faction]}: ${BUILDING_NAMES[b][s.buildings[b] - 1]} w osadzie ${s.name} (${costText(price)}).`);
      break;
    }
    case 'kingdomRecruit': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      if (!mayRecruit(s, hero.faction) || s.buildings.barracks < 1) throw new Error('Tu nie da się rekrutować: potrzebne koszary w osadzie własnej frakcji.');
      const entry = RECRUITS[hero.faction].find((r) => r.id === action.unitId);
      if (!entry) throw new Error('Tej jednostki nie ma w ofercie.');
      if (entry.tier >= 4 && s.buildings.barracks < 2) throw new Error('Tę jednostkę rekrutuje się w rozbudowanych koszarach.');
      const fs = state.factions[hero.faction];
      if (fs.supportsAlive.includes(entry.id) || fs.supportsDead.includes(entry.id)) throw new Error('Ta jednostka jest już w twojej drużynie.');
      pay(state, hero.faction, entry.cost);
      fs.supportsAlive.push(entry.id);
      log(state, 'info', `${FACTION_NAMES[hero.faction]} rekrutuje: ${UNITS[entry.id].name} (${entry.cost} zł).`);
      break;
    }
    case 'kingdomHeal': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      if (s.buildings.hospital < 1) throw new Error('W tej osadzie nie ma szpitala.');
      const fs = state.factions[hero.faction];
      if (!fs.supportsDead.includes(action.unitId)) throw new Error('Ta jednostka nie poległa.');
      const base = RECRUITS[hero.faction].find((r) => r.id === action.unitId)?.cost ?? 2;
      const price = Math.max(1, Math.ceil(base / KINGDOM.heal[s.buildings.hospital >= 2 ? 1 : 0]));
      pay(state, hero.faction, price);
      fs.supportsDead = fs.supportsDead.filter((id) => id !== action.unitId);
      fs.supportsAlive.push(action.unitId);
      log(state, 'info', `${FACTION_NAMES[hero.faction]}: w szpitalu wraca ${UNITS[action.unitId].name} (${price} zł).`);
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
        log(state, 'info', `${FACTION_NAMES[f]} kupuje: ${RESOURCE_NAMES[action.res]} (${price} zł).`, f);
      } else {
        if (buildingLevel(s, 'market') < 1) throw new Error('Surowce sprzedaje się na targu.');
        if (k.res[f][action.res] < 1) throw new Error(`Brakuje: 1 × ${RESOURCE_NAMES[action.res]}.`);
        k.res[f][action.res] -= 1;
        k.gold[f] += ECONOMY.tradeSell[action.res];
        log(state, 'info', `${FACTION_NAMES[f]} sprzedaje: ${RESOURCE_NAMES[action.res]} (${ECONOMY.tradeSell[action.res]} zł).`, f);
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
      } else {
        giveArtifact(state, hero, drawArtifact(state, hero, ARTIFACT_ODDS.chest, 0x2545f491), 'skrzynia');
      }
      // Kaftan Poborcy: the chest gives gold on top, whatever the player chose.
      const extra = gearOf(hero).reduce((n, a) => n + (a.chestGold ?? 0), 0);
      if (extra) {
        k.gold[hero.faction] += extra;
        log(state, 'info', `${UNITS[hero.id].name} dostaje jeszcze ${extra} zł (Kaftan Poborcy).`);
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
export function botPurchase(state: GameState, f: FactionId, s: Settlement): Action | null {
  const k = state.kingdom;
  if (!k || s.owner !== f) return null;
  const gold = k.gold[f];
  const fs = state.factions[f];
  const id = s.id;
  const afford = (price: number | null) => price !== null && gold >= price;
  // A building needs its whole price (level 4: resources too) and the round's one build still free.
  const buildable = (b: BuildingId) => { const c = buildCost(state, s, b); return c !== null && canPay(state, f, c) && mayBuildNow(state, f); };
  const own = s.land === f;
  if (own && s.buildings.barracks < 1 && buildable('barracks')) return { type: 'kingdomBuild', settlementId: id, building: 'barracks' };
  if (own && s.buildings.barracks >= 1) {
    // Like a player: the strongest recruit it can pay for now.
    const missing = RECRUITS[f].filter((r) => !fs.supportsAlive.includes(r.id) && !fs.supportsDead.includes(r.id) && (r.tier < 4 || s.buildings.barracks >= 2) && afford(r.cost)).sort((a, b) => b.tier - a.tier)[0];
    if (missing) return { type: 'kingdomRecruit', settlementId: id, unitId: missing.id };
    // Every cheaper recruit is in the team and the strongest ones wait behind the bigger barracks: build them.
    const waiting = RECRUITS[f].some((r) => r.tier >= 4 && !fs.supportsAlive.includes(r.id) && !fs.supportsDead.includes(r.id));
    if (waiting && s.buildings.barracks === 1 && RECRUITS[f].every((r) => r.tier >= 4 || fs.supportsAlive.includes(r.id) || fs.supportsDead.includes(r.id)) && buildable('barracks')) return { type: 'kingdomBuild', settlementId: id, building: 'barracks' };
  }
  if (s.buildings.hospital >= 1 && fs.supportsDead.length) {
    const dead = fs.supportsDead[0];
    const base = RECRUITS[f].find((r) => r.id === dead)?.cost ?? 2;
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
  return botTrade(state, f, s);
}

/**
 * Level 4: a bot that sits on gold while a building waits for one resource buys that resource (one unit an action). It keeps the gold of the
 * building itself and never trades in a round in which it has already built.
 */
function botTrade(state: GameState, f: FactionId, s: Settlement): Action | null {
  const k = state.kingdom!;
  if (!k.res || !mayBuildNow(state, f)) return null;
  const fs = state.factions[f];
  const own = s.land === f;
  const wanted: BuildingId[] = [];
  if (own && s.buildings.barracks < 1) wanted.push('barracks');
  if (s.buildings.treasury < 1) wanted.push('treasury');
  if (s.buildings.market < 1) wanted.push('market');
  if (forgeLevel(state, f) < 1) wanted.push('forge');
  if (s.buildings.hospital < 1 && fs.supportsDead.length) wanted.push('hospital');
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
  // Shopping needs no walk (a human opens the settlement list from anywhere), so a bot shops from where it stands too.
  for (const s of settlementsOf(state, hero.faction)) {
    const buy = botPurchase(state, hero.faction, s);
    if (buy) return buy;
  }
  return null;
}

/** Whether a bot of this faction has something to buy in one of its settlements (a reason to walk back to it). */
export const kingdomWish = (state: GameState, f: FactionId): Settlement | null => settlementsOf(state, f).find((s) => botPurchase(state, f, s)) ?? null;
