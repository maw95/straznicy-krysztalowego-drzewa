// Adventure map: triangle generation (variant A), costs and path finding.

import { EASY_TERRAINS, HARD_TERRAINS, MAP_VARIANTS, TERRAIN_COST, type MapSize, type Terrain } from './data';
import { distance, key, neighbors, parseKey, triToHex, type HexKey } from './hex';
import { Rng } from './rng';
import type { GameState, Tile } from './types';

export function tileCost(t: Tile): number | null {
  return TERRAIN_COST[t.terrain];
}

export function mapNeighbors(tiles: Record<HexKey, Tile>, k: HexKey): HexKey[] {
  return neighbors(parseKey(k))
    .map(key)
    .filter((n) => n in tiles);
}

export function treeKey(): HexKey {
  return key(triToHex(0, 0));
}

export function homeKey(rows: number, faction: 'dawn' | 'horde'): HexKey {
  return key(triToHex(rows - 1, faction === 'dawn' ? 0 : rows - 1));
}

/** Breadth-first reachability through passable hexes. */
export function reachableFrom(tiles: Record<HexKey, Tile>, start: HexKey, blocked: (k: HexKey) => boolean = () => false): Set<HexKey> {
  const seen = new Set<HexKey>([start]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const n of mapNeighbors(tiles, cur)) {
      if (seen.has(n) || tileCost(tiles[n]) === null || blocked(n)) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return seen;
}

export interface PathResult {
  cost: number;
  path: HexKey[];
}

/**
 * Dijkstra over map costs. `costOf` lets callers model knowledge
 * (e.g. the coop AI treats hidden hexes as cost 1).
 */
export function shortestPaths(
  tiles: Record<HexKey, Tile>,
  start: HexKey,
  costOf: (k: HexKey) => number | null,
): Map<HexKey, PathResult> {
  const best = new Map<HexKey, PathResult>([[start, { cost: 0, path: [start] }]]);
  const open: HexKey[] = [start];
  while (open.length) {
    open.sort((a, b) => best.get(a)!.cost - best.get(b)!.cost || (a < b ? -1 : 1));
    const cur = open.shift()!;
    const base = best.get(cur)!;
    for (const n of mapNeighbors(tiles, cur)) {
      const c = costOf(n);
      if (c === null) continue;
      const next = base.cost + c;
      const old = best.get(n);
      if (!old || next < old.cost) {
        best.set(n, { cost: next, path: [...base.path, n] });
        if (!open.includes(n)) open.push(n);
      }
    }
  }
  return best;
}

export function revealAround(state: GameState, k: HexKey): HexKey[] {
  const revealed: HexKey[] = [];
  for (const n of [k, ...mapNeighbors(state.tiles, k)]) {
    if (!state.tiles[n].revealed) {
      state.tiles[n].revealed = true;
      revealed.push(n);
    }
  }
  return revealed;
}

export interface GeneratedMap {
  rows: number;
  tiles: Record<HexKey, Tile>;
  crystalHexes: HexKey[];
  treasureHexes: HexKey[];
}

export function generateMap(size: MapSize, rng: Rng, treasureCount: number): GeneratedMap {
  const variant = MAP_VARIANTS[size];
  const rows = variant.rows;
  for (let attempt = 0; attempt < 200; attempt++) {
    const tiles: Record<HexKey, Tile> = {};
    const mountains = new Set(variant.mountains.map(([r, c]) => `${r}:${c}`));
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col <= row; col++) {
        const k = key(triToHex(row, col));
        let terrain: Terrain;
        if (mountains.has(`${row}:${col}`)) terrain = 'mountain';
        else terrain = rng.next() < 1 / 3 ? rng.pick(HARD_TERRAINS) : rng.pick(EASY_TERRAINS);
        tiles[k] = { key: k, row, col, terrain, revealed: false, crystalId: null, treasureId: null, home: null, tree: false };
      }
    }
    const tree = treeKey();
    const dawn = homeKey(rows, 'dawn');
    const horde = homeKey(rows, 'horde');
    tiles[tree].terrain = 'tree';
    tiles[tree].tree = true;
    tiles[dawn].terrain = 'baseDawn';
    tiles[dawn].home = 'dawn';
    tiles[horde].terrain = 'baseHorde';
    tiles[horde].home = 'horde';

    const reach = reachableFrom(tiles, dawn);
    if (!reach.has(tree) || !reach.has(horde)) continue;

    const reserved = new Set<HexKey>([tree, dawn, horde, ...mapNeighbors(tiles, dawn), ...mapNeighbors(tiles, horde)]);
    const candidates = [...reach].filter((k) => !reserved.has(k));
    const crystalHexes = pickSpread(candidates, variant.crystals, rng, tiles);
    if (crystalHexes.length < variant.crystals) continue;
    // A guarded crystal must not cut the map in two: evil cannot enter guarded hexes.
    const guarded = new Set(crystalHexes);
    const hordeReach = reachableFrom(tiles, horde, (k) => guarded.has(k));
    if (!hordeReach.has(tree)) continue;
    const rest = rng.shuffle(candidates.filter((k) => !guarded.has(k)));
    if (rest.length < treasureCount) continue;
    for (const k of crystalHexes) tiles[k].terrain = 'cave';
    return { rows, tiles, crystalHexes, treasureHexes: rest.slice(0, treasureCount) };
  }
  throw new Error('Nie udało się wygenerować poprawnej mapy');
}

/** Picks hexes far from each other so crystals spread over the map. */
function pickSpread(candidates: HexKey[], count: number, rng: Rng, tiles: Record<HexKey, Tile>): HexKey[] {
  const rows = Math.max(...Object.values(tiles).map((t) => t.row)) + 1;
  const pool = rng.shuffle(candidates);
  const chosen: HexKey[] = [];
  for (const minGap of [3, 2, 1]) {
    for (const k of pool) {
      if (chosen.length >= count) break;
      if (chosen.includes(k)) continue;
      // Keep crystals off the two bottom rows (unless nothing else fits) so the race is not trivial.
      if (minGap > 1 && tiles[k].row >= rows - 2) continue;
      if (!chosen.some((c) => distance(parseKey(c), parseKey(k)) < minGap)) chosen.push(k);
    }
    if (chosen.length >= count) break;
  }
  return chosen;
}
