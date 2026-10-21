// Adventure map: triangle generation (variant A), costs and path finding.

import { GUARDIAN_LAIRS, MAP_VARIANTS, TERRAIN_COST, TERRAIN_VARIANTS, TILE_POOLS, type MapSize, type Terrain, type TileSide } from './data';
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
  crystals: Array<{ hex: HexKey; guardian: string }>;
  treasureHexes: HexKey[];
}

/**
 * Left half of the triangle is Przymierze land, right half Horda land. Rows with an odd
 * number of hexes have one on the axis: those alternate between the halves (a fixed zigzag
 * border, never random), so the halves differ by at most one hex.
 */
export function sideOf(row: number, col: number): TileSide {
  const x = col - row / 2;
  if (x < 0) return 'dawn';
  if (x > 0) return 'horde';
  return (row / 2) % 2 === 1 ? 'dawn' : 'horde';
}

function setTerrain(tile: Tile, terrain: Terrain, rng: Rng) {
  tile.terrain = terrain;
  tile.variant = 1 + rng.int(TERRAIN_VARIANTS[terrain]);
}

export function generateMap(size: MapSize, rng: Rng, treasureCount: number, crystalCount: number): GeneratedMap {
  const variant = MAP_VARIANTS[size];
  const rows = variant.rows;
  for (let attempt = 0; attempt < 400; attempt++) {
    const tiles: Record<HexKey, Tile> = {};
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col <= row; col++) {
        const k = key(triToHex(row, col));
        const side = sideOf(row, col);
        const tile: Tile = { key: k, row, col, terrain: 'meadow', side, variant: 1, revealed: false, crystalId: null, treasureId: null, home: null, tree: false };
        setTerrain(tile, rng.pick(TILE_POOLS[side]), rng);
        tiles[k] = tile;
      }
    }
    const tree = treeKey();
    const dawn = homeKey(rows, 'dawn');
    const horde = homeKey(rows, 'horde');
    setTerrain(tiles[tree], 'tree', rng);
    tiles[tree].tree = true;
    setTerrain(tiles[dawn], 'baseDawn', rng);
    tiles[dawn].home = 'dawn';
    tiles[dawn].side = 'dawn';
    setTerrain(tiles[horde], 'baseHorde', rng);
    tiles[horde].home = 'horde';
    tiles[horde].side = 'horde';
    // Starting neighbourhoods stay passable so nobody is walled in on turn one.
    for (const base of [dawn, horde]) {
      for (const n of mapNeighbors(tiles, base)) if (tileCost(tiles[n]) === null) setTerrain(tiles[n], tiles[n].side === 'dawn' ? 'meadow' : 'scorched', rng);
    }

    const reach = reachableFrom(tiles, dawn);
    if (!reach.has(tree) || !reach.has(horde)) continue;

    // Guardians: Cyclops and Hydra live on Horda land, the Griffin on Przymierze land.
    const guardians = rng.shuffle(Object.keys(GUARDIAN_LAIRS)).slice(0, crystalCount);
    const reserved = new Set<HexKey>([tree, dawn, horde, ...mapNeighbors(tiles, dawn), ...mapNeighbors(tiles, horde)]);
    const crystals: Array<{ hex: HexKey; guardian: string }> = [];
    for (const g of guardians) {
      const lair = GUARDIAN_LAIRS[g];
      const options = [...reach].filter((k) => !reserved.has(k) && tiles[k].side === lair.side && tileCost(tiles[k]) !== null);
      const spot = pickSpread(options, 1, rng, tiles, crystals.map((c) => c.hex))[0];
      if (!spot) break;
      crystals.push({ hex: spot, guardian: g });
      reserved.add(spot);
    }
    if (crystals.length < crystalCount) continue;
    for (const c of crystals) setTerrain(tiles[c.hex], GUARDIAN_LAIRS[c.guardian].terrain, rng);
    // Evil cannot cross guarded hexes, so the Tree must stay reachable around them.
    const guarded = new Set(crystals.map((c) => c.hex));
    const hordeReach = reachableFrom(tiles, horde, (k) => guarded.has(k));
    if (!hordeReach.has(tree)) continue;
    const rest = rng.shuffle([...reach].filter((k) => !reserved.has(k) && tileCost(tiles[k]) !== null));
    if (rest.length < treasureCount) continue;
    const treasureHexes = rest.slice(0, treasureCount);
    for (const k of treasureHexes) setTerrain(tiles[k], tiles[k].side === 'dawn' ? 'treasureDawn' : 'treasureHorde', rng);
    return { rows, tiles, crystals, treasureHexes };
  }
  throw new Error('Nie udało się wygenerować poprawnej mapy');
}

/** Picks hexes far from already chosen ones so crystals spread over the map. */
function pickSpread(candidates: HexKey[], count: number, rng: Rng, tiles: Record<HexKey, Tile>, taken: HexKey[] = []): HexKey[] {
  const rows = Math.max(...Object.values(tiles).map((t) => t.row)) + 1;
  const pool = rng.shuffle(candidates);
  const chosen: HexKey[] = [];
  for (const minGap of [3, 2, 1]) {
    for (const k of pool) {
      if (chosen.length >= count) break;
      if (chosen.includes(k)) continue;
      // Keep crystals off the two bottom rows (unless nothing else fits) so the race is not trivial.
      if (minGap > 1 && tiles[k].row >= rows - 2) continue;
      if (![...taken, ...chosen].some((c) => distance(parseKey(c), parseKey(k)) < minGap)) chosen.push(k);
    }
    if (chosen.length >= count) break;
  }
  return chosen;
}
