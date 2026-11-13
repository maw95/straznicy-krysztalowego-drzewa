// Level 3 "Królestwo" (digital, rule `kingdom`, built on hero growth): gold, settlements with buildings, gold mines, a market of artifacts, a hospital,
// recruitment of supports and a team that grows. Design: docs/POZIOM_3_KROLESTWO.md (the author's decisions of 13.11.2026). Every number here is
// provisional: the simulations tune them. Gold is small (the cheapest thing costs 1) and shared by the whole faction.

import { FACTION_NAMES, FACTION_SUPPORTS, SUPPORTS_PER_BATTLE, UNITS, type FactionId } from './data';
import { distance, parseKey, type HexKey } from './hex';
import { encounterUnits, stillConnected } from './encounters';
import { levelOf } from './growth';
import { log } from './log';
import { mapNeighbors, tileCost } from './map';
import { Rng } from './rng';
import { ARTIFACT_BY_ID, ARTIFACT_ODDS, artifactPool, completeSets, drawArtifact, gearOf, SETS, setCount, type ArtifactDef, giveArtifact, type Rarity } from './sites';
import { ENCOUNTER_MOTIFS, type EncounterMotif } from './data';
import type { Action, Crystal, GameState, HeroState } from './types';

export type BuildingId = 'barracks' | 'market' | 'hospital' | 'treasury';

export interface Settlement {
  id: string;
  at: HexKey;
  /** The faction whose land it lies on (decides the name and who may recruit there). */
  land: FactionId;
  name: string;
  /** Who holds it now (null: still held by neutrals, the fight for it is on). */
  owner: FactionId | null;
  /** Level of each building: 0 not built, 1 built, 2 upgraded (the treasury has only 1). */
  buildings: Record<BuildingId, number>;
  /** Offers of the current market period already bought (the offer itself is drawn from the seed, see `marketStock`). */
  bought: string[];
  boughtEpoch: number;
}

export interface KingdomState {
  gold: Record<FactionId, number>;
  settlements: Record<string, Settlement>;
  mines: Record<HexKey, { owner: FactionId | null }>;
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
  cost: { barracks: [3, 6], market: [3, 5], hospital: [3, 5], treasury: [4] } as Record<BuildingId, number[]>,
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
};

export const BUILDING_TEXTS: Record<BuildingId, [string, string?]> = {
  barracks: ['Pozwalają rekrutować pomocników.', 'Dodatkowe miejsce w drużynie i dostęp do najmocniejszych jednostek.'],
  market: ['Trzy artefakty w ofercie, nowa oferta co 3 rundy.', 'Pięć artefaktów w ofercie.'],
  hospital: ['Wskrzesza poległych pomocników za połowę ich ceny.', 'Wskrzesza za jedną trzecią ceny.'],
  treasury: ['Przynosi +1 złota na rundę.'],
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
  const rng = new Rng((state.setup.seed ^ 0x3c6ef372) | 0);
  const nameBag: Record<FactionId, string[]> = { dawn: rng.shuffle([...NAMES.dawn]), horde: rng.shuffle([...NAMES.horde]) };
  const empty = (): Record<BuildingId, number> => ({ barracks: 0, market: 0, hospital: 0, treasury: 0 });
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
  // Every faction starts with its three tier-1 supports, as in the other levels; the recruits are the new tiers (RECRUITS, docs/JEDNOSTKI_POZIOMU_3.md).
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
  } else {
    const m = k.mines[place.id];
    if (m.owner === hero.faction) return;
    m.owner = hero.faction;
    log(state, 'info', `${name} zajmuje kopalnię złota.`);
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
  if (hero.pos !== s.at) throw new Error('Bohater musi stać w osadzie.');
  if (s.owner !== hero.faction) throw new Error('Ta osada nie należy do twojej frakcji.');
  return { s, hero };
}

function pay(state: GameState, f: FactionId, price: number) {
  const k = state.kingdom!;
  if (k.gold[f] < price) throw new Error(`Za mało złota (potrzeba ${price}).`);
  k.gold[f] -= price;
}

/** What it costs to build or upgrade a building next (null: it is complete). */
export const nextCost = (s: Settlement, b: BuildingId): number | null => KINGDOM.cost[b][s.buildings[b]] ?? null;

/** Recruiting, healing and trading are for the land's own faction: a captured foreign settlement gives income, the market and the hospital only. */
export const mayRecruit = (s: Settlement, f: FactionId) => s.land === f && s.owner === f;

export function kingdomAction(state: GameState, action: Action): void {
  const k = state.kingdom;
  if (!k) throw new Error('To nie jest poziom Królestwo.');
  switch (action.type) {
    case 'kingdomBuild': {
      const { s, hero } = serviceSettlement(state, action.settlementId);
      const b = action.building;
      const price = nextCost(s, b);
      if (price === null) throw new Error('Ten budynek jest już w pełni rozbudowany.');
      if (b === 'barracks' && s.land !== hero.faction) throw new Error('Obcej osady nie rozbudujesz o koszary.');
      pay(state, hero.faction, price);
      s.buildings[b] += 1;
      log(state, 'info', `${FACTION_NAMES[hero.faction]}: ${BUILDING_NAMES[b][s.buildings[b] - 1]} w osadzie ${s.name} (${price} zł).`);
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
      pay(state, hero.faction, artifactCost(hero, art));
      const epoch = marketEpoch(state);
      if (s.boughtEpoch !== epoch) s.bought = [];
      s.boughtEpoch = epoch;
      s.bought.push(art.id);
      giveArtifact(state, hero, art, `targ w osadzie ${s.name}`);
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
      throw new Error('Nieznane polecenie Królestwa.');
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
  const own = s.land === f;
  if (own && s.buildings.barracks < 1 && afford(nextCost(s, 'barracks'))) return { type: 'kingdomBuild', settlementId: id, building: 'barracks' };
  if (own && s.buildings.barracks >= 1) {
    const missing = RECRUITS[f].filter((r) => !fs.supportsAlive.includes(r.id) && !fs.supportsDead.includes(r.id) && (r.tier < 4 || s.buildings.barracks >= 2)).sort((a, b) => a.cost - b.cost || b.tier - a.tier)[0];
    if (missing && afford(missing.cost)) return { type: 'kingdomRecruit', settlementId: id, unitId: missing.id };
  }
  if (s.buildings.hospital >= 1 && fs.supportsDead.length) {
    const dead = fs.supportsDead[0];
    const base = RECRUITS[f].find((r) => r.id === dead)?.cost ?? 2;
    if (afford(Math.max(1, Math.ceil(base / KINGDOM.heal[s.buildings.hospital >= 2 ? 1 : 0])))) return { type: 'kingdomHeal', settlementId: id, unitId: dead };
  }
  if (s.buildings.treasury < 1 && afford(nextCost(s, 'treasury'))) return { type: 'kingdomBuild', settlementId: id, building: 'treasury' };
  if (s.buildings.hospital < 1 && fs.supportsDead.length && afford(nextCost(s, 'hospital'))) return { type: 'kingdomBuild', settlementId: id, building: 'hospital' };
  if (s.buildings.market >= 1) {
    const buyer = state.heroes[state.turnOrder[state.turnIndex]];
    const who = buyer?.faction === f ? buyer : undefined;
    const cost = (a: ArtifactDef) => (who ? artifactCost(who, a) : KINGDOM.artifactPrice[a.rarity - 1]);
    // A bot prefers the rarer artifact, and a piece of a set it is already collecting above the others.
    const worth = (a: ArtifactDef) => a.rarity * 10 + (a.set && who ? setCount(who, a.set) * 6 : 0);
    const best = marketStock(state, s).map((a) => ARTIFACT_BY_ID[a]).filter((a) => gold >= cost(a)).sort((a, b) => worth(b) - worth(a))[0];
    if (best) return { type: 'kingdomBuyArtifact', settlementId: id, artifactId: best.id };
  } else if (afford(nextCost(s, 'market'))) return { type: 'kingdomBuild', settlementId: id, building: 'market' };
  if (own && s.buildings.barracks === 1 && s.buildings.market >= 1 && afford(nextCost(s, 'barracks'))) return { type: 'kingdomBuild', settlementId: id, building: 'barracks' };
  return null;
}

/** The kingdom's part of a bot's turn: open a chest, then shop where the hero stands. */
export function kingdomBotAction(state: GameState, hero: HeroState): Action | null {
  const k = state.kingdom;
  if (!k) return null;
  if (k.chest) return { type: 'chestTake', what: 'artifact' };
  // Set pieces in the backpack: wear one when it brings the best set a piece closer (strictly, so the bot never swaps back and forth).
  const best = (h: HeroState) => Math.max(0, ...(Object.keys(SETS) as Array<keyof typeof SETS>).map((id) => setCount(h, id)));
  for (const art of (hero.pack ?? []).map((id) => ARTIFACT_BY_ID[id]).filter((a) => a?.set)) {
    const trial = { gear: { ...hero.gear, [art.slot]: art.id } };
    if (best(trial as HeroState) > best(hero)) return { type: 'equipArtifact', artifactId: art.id };
  }
  const s = settlementAt(state, hero.pos);
  return s ? botPurchase(state, hero.faction, s) : null;
}

/** Whether a bot of this faction has something to buy in one of its settlements (a reason to walk back to it). */
export const kingdomWish = (state: GameState, f: FactionId): Settlement | null => settlementsOf(state, f).find((s) => botPurchase(state, f, s)) ?? null;
