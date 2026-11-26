// Neutral encounters on the adventure map (digital Expedition, hero growth): groups of neutral units guard a hex. The deeper from the bases, the
// stronger the group (weak units, a guardian with two of them, a boss with two of them) and the better the reward.
// An encounter is a crystal marked `decoy` (it blocks the hex and is fought like a guardian) that carries the list of its units.
// Half of the groups are supports of a free faction (a finished one nobody at the table plays), picked to be about as strong as a neutral group
// of the same tier; they guard like neutrals (the same side, behaviour and reward).

import { ENCOUNTERS, ENCOUNTER_GUARDS, ENCOUNTER_MOTIFS, UNITS, type EncounterMotif, type FactionId } from './data';
import { FACTION_PACKS, PLAYABLE_IDS } from './factions';
import { distance, parseKey } from './hex';
import { growthOn } from './growth';
import { mapNeighbors, tileCost, treeOf } from './map';
import { Rng } from './rng';
import { raceOf, teamsOf } from './teams';
import { isDigital, type Crystal, type GameState } from './types';

const MOTIFS = Object.keys(ENCOUNTER_MOTIFS) as EncounterMotif[];

/** Units of an encounter of this tier and motif; the first one is the lead (what the map shows). */
export function encounterUnits(tier: 0 | 1 | 2, motif: EncounterMotif, rng: Rng): string[] {
  const m = ENCOUNTER_MOTIFS[motif];
  const weak = (n: number) => Array.from({ length: n }, () => rng.pick([...m.weak]));
  if (tier === 0) {
    const group = weak(2 + rng.int(2));
    return group;
  }
  if (tier === 1) return [m.guardian, ...weak(2)];
  // The Kraken stands with its tentacles and, like every boss, with two weak units of its motif (the crab and the bog creature).
  return motif === 'water' ? [m.boss, ...Array.from({ length: ENCOUNTERS.krakenTentacles }, () => 'tentacle'), ...weak(2)] : [m.boss, ...weak(2)];
}

export type EncounterTier = 0 | 1 | 2;

/** The finished factions nobody at this table plays: their supports may guard the map. */
export const freeFactions = (state: GameState): FactionId[] => PLAYABLE_IDS.filter((f) => !teamsOf(state).some((t) => raceOf(state, t) === f));

/** A rough strength of a group: the root of (all Życie × all Atak), the shooters' Atak counted higher. */
export function groupPower(ids: readonly string[]): number {
  const hp = ids.reduce((n, id) => n + UNITS[id].hp, 0);
  const attack = ids.reduce((n, id) => n + UNITS[id].attack * (UNITS[id].attackType === 'ranged' ? ENCOUNTER_GUARDS.rangedWeight : 1), 0);
  return Math.sqrt(hp * attack);
}

/** Every multiset of `n` units of the pool, no unit more than twice. */
function multisets(pool: readonly string[], n: number, from = 0): string[][] {
  if (!n) return [[]];
  const out: string[][] = [];
  for (let i = from; i < pool.length; i++) {
    for (const rest of multisets(pool, n - 1, i)) if (rest.filter((id) => id === pool[i]).length < 2) out.push([pool[i], ...rest]);
  }
  return out;
}

/** The compositions a faction can field for a tier: the leader first (what the map shows). The legend leads only the strongest groups. */
function compositions(faction: FactionId, tier: EncounterTier): string[][] {
  const p = FACTION_PACKS[faction];
  const byTier = (t: number): string[] => (t === 1 ? p.supports : t === 6 ? [p.legend] : [p.tierUnits[t - 2], p.altUnits[t - 2]]);
  const { leaders, followers, sizes } = ENCOUNTER_GUARDS.tiers[tier];
  const pool = followers.flatMap(byTier);
  if (!leaders.length) return sizes.flatMap((n) => multisets(pool, n));
  return leaders.flatMap(byTier).flatMap((lead) => sizes.flatMap((n) => multisets(pool, n).map((rest) => [lead, ...rest])));
}

/** The strength a group of this faction needs to be as hard to beat as a neutral group of the strength `neutral`. */
export const guardTarget = (faction: FactionId, tier: EncounterTier, neutral: number): number => neutral * (ENCOUNTER_GUARDS.tiers[tier].strength[faction] ?? 1);

/** A group of a faction's supports about as strong as `target`: one of those within the tolerance, else the closest. */
export function factionUnits(faction: FactionId, tier: EncounterTier, target: number, rng: Rng): string[] {
  const all = compositions(faction, tier).map((ids) => ({ ids, off: Math.abs(groupPower(ids) / target - 1) }));
  const near = all.filter((c) => c.off <= ENCOUNTER_GUARDS.tolerance);
  return (near.length ? rng.pick(near) : all.reduce((best, c) => (c.off < best.off ? c : best))).ids;
}

/** A neutral group of a random motif. */
export const neutralGroup = (tier: EncounterTier, rng: Rng): string[] => encounterUnits(tier, rng.pick(MOTIFS), rng);

/** The stream the free factions' guards are drawn from. */
export const guardRng = (state: GameState, salt: number): Rng => new Rng((state.setup.seed ^ salt) | 0);

/** Which of `n` groups come from a free faction: always half of them (of an odd number the last half is a draw). */
export function factionShare(n: number, rng: Rng): boolean[] {
  const from = Math.floor(n / 2) + (n % 2 ? rng.int(2) : 0);
  return rng.shuffle(Array.from({ length: n }, (_, i) => i < from));
}

/**
 * The units that guard a hex: the drawn `neutral` group or, if `fromFaction` and one is free, a group of a free faction as strong as that. `rng` is a
 * stream of its own: what lies where on the map does not depend on who guards it.
 */
export function guardUnits(state: GameState, tier: EncounterTier, neutral: string[], fromFaction: boolean, rng: Rng): string[] {
  const free = freeFactions(state);
  if (!fromFaction || !free.length) return neutral;
  const faction = rng.pick(free);
  return factionUnits(faction, tier, guardTarget(faction, tier, groupPower(neutral)), rng);
}

/**
 * Whether every passable hex without an encounter or an unbeaten guardian can still be reached from the first one. Only the main land counts (the part of
 * the map the Tree can be reached from): a pocket or an island cut off by the terrain itself must not forbid every encounter and settlement.
 */
export function stillConnected(state: GameState, blocked: Set<string>): boolean {
  const passable = (k: string) => tileCost(state.tiles[k]) !== null;
  const middle = treeOf(state);
  const tree = passable(middle) ? middle : Object.values(state.tiles).find((t) => passable(t.key))?.key;
  if (!tree) return true;
  const flood = (start: string, skip: (k: string) => boolean): Set<string> => {
    const seen = new Set<string>([start]);
    const queue = [start];
    for (let i = 0; i < queue.length; i++) {
      for (const n of mapNeighbors(state.tiles, queue[i])) {
        if (!seen.has(n) && passable(n) && !skip(n)) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    return seen;
  };
  const land = flood(tree, () => false);
  const open = [...land].filter((k) => !blocked.has(k));
  if (!open.length) return true;
  return flood(open[0], (k) => blocked.has(k) || !land.has(k)).size === open.length;
}

/** Puts the encounters on free passable hexes, never closing a road; the deepest third of them is the strongest. */
export function placeEncounters(state: GameState): void {
  if (!growthOn(state) || !isDigital(state.rules) || state.setup.mode === 'arena' || state.setup.battleMode !== 'arena') return;
  const rng = new Rng((state.setup.seed ^ 0x2b7e1516) | 0);
  const homes = Object.values(state.tiles).filter((t) => t.home).map((t) => parseKey(t.key));
  const tree = Object.values(state.tiles).find((t) => t.tree);
  // Nothing close to a base or to the Tree: the first steps and the delivery of crystals must stay open.
  const nearBase = (k: string) => [...homes, ...(tree ? [parseKey(tree.key)] : [])].some((h) => distance(h, parseKey(k)) <= ENCOUNTERS.minDistance);
  const depthOf = (k: string) => Math.min(...homes.map((h) => distance(h, parseKey(k))));
  // Guardians and their lairs already block hexes: a road must stay open past them as well.
  const blocked = new Set<string>(Object.values(state.crystals).filter((c) => c.guardian && state.tiles[c.at]).map((c) => c.at));
  const candidates = rng.shuffle(Object.values(state.tiles).filter((t) => !t.home && !t.tree && !nearBase(t.key) && !t.crystalId && !t.treasureId && !t.site && t.terrain !== 'bridge' && tileCost(t) !== null));
  const chosen: string[] = [];
  const want = ENCOUNTERS.count[state.setup.mapSize] ?? 2;
  for (const t of candidates) {
    if (chosen.length >= want) break;
    // Not next to another encounter (they would form a wall) and not where it would cut the map.
    if (chosen.some((k) => distance(parseKey(k), parseKey(t.key)) <= 1)) continue;
    const next = new Set([...blocked, ...chosen, t.key]);
    if (!stillConnected(state, next)) continue;
    chosen.push(t.key);
  }
  const byDepth = [...chosen].sort((a, b) => depthOf(a) - depthOf(b));
  const guards = guardRng(state, 0x517cc1b7);
  const share = factionShare(byDepth.length, guards);
  byDepth.forEach((k, i) => {
    const tier = Math.min(2, Math.floor((i * 3) / byDepth.length)) as EncounterTier;
    const units = guardUnits(state, tier, neutralGroup(tier, rng), share[i], guards);
    const id = `enc${i + 1}`;
    const crystal: Crystal = { id, guardian: units[0], at: k, decoy: true, encounter: units, tier };
    state.crystals[id] = crystal;
    state.tiles[k].crystalId = id;
  });
}
