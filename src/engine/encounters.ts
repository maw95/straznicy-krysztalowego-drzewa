// Neutral encounters on the adventure map (digital Expedition, hero growth): groups of neutral units guard a hex. The deeper from the bases, the
// stronger the group (weak units, a guardian with two of them, a boss with two of them) and the better the reward.
// An encounter is a crystal marked `decoy` (it blocks the hex and is fought like a guardian) that carries the list of its units.

import { ENCOUNTERS, ENCOUNTER_MOTIFS, type EncounterMotif } from './data';
import { distance, parseKey } from './hex';
import { growthOn } from './growth';
import { mapNeighbors, tileCost } from './map';
import { Rng } from './rng';
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

/** Whether every passable hex without an encounter or an unbeaten guardian can still be reached from the first one. */
function stillConnected(state: GameState, blocked: Set<string>): boolean {
  const open = Object.values(state.tiles).filter((t) => tileCost(t) !== null && !blocked.has(t.key));
  if (!open.length) return true;
  const seen = new Set<string>([open[0].key]);
  const queue = [open[0].key];
  for (let i = 0; i < queue.length; i++) {
    for (const n of mapNeighbors(state.tiles, queue[i])) {
      if (!seen.has(n) && tileCost(state.tiles[n]) !== null && !blocked.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return seen.size === open.length;
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
  byDepth.forEach((k, i) => {
    const tier = Math.min(2, Math.floor((i * 3) / byDepth.length)) as 0 | 1 | 2;
    const units = encounterUnits(tier, rng.pick(MOTIFS), rng);
    const id = `enc${i + 1}`;
    const crystal: Crystal = { id, guardian: units[0], at: k, decoy: true, encounter: units, tier };
    state.crystals[id] = crystal;
    state.tiles[k].crystalId = id;
  });
}
