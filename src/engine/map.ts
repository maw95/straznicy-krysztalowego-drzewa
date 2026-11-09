// Adventure map: triangle generation (variant A), costs and path finding.

import { GUARDIAN_LAIRS, MAP_SHAPES, MAP_VARIANTS, TERRAIN_COST, TERRAIN_VARIANTS, TILE_POOLS, type MapSize, type Terrain, type TileSide } from './data';
import { distance, key, neighborKeys, parseKey, triToHex, type HexKey } from './hex';
import { Rng } from './rng';
import { CUSTOM_MAPS } from './customMaps';
import type { GameState, MapShape, Tile } from './types';

export function tileCost(t: Tile): number | null {
  return TERRAIN_COST[t.terrain];
}

export function mapNeighbors(tiles: Record<HexKey, Tile>, k: HexKey): HexKey[] {
  return neighborKeys(k).filter((n) => n in tiles);
}

export function treeKey(): HexKey {
  return key(triToHex(0, 0));
}

export function homeKey(rows: number, faction: 'dawn' | 'horde'): HexKey {
  return key(triToHex(rows - 1, faction === 'dawn' ? 0 : rows - 1));
}

/** The Tree of this game's map (the triangle's corner in a game saved before other shapes existed). */
export const treeOf = (state: Pick<GameState, 'tree'>): HexKey => state.tree ?? treeKey();

/** The base of `faction` on this game's map. */
export const homeOf = (state: Pick<GameState, 'homes' | 'rows'>, faction: 'dawn' | 'horde'): HexKey => state.homes?.[faction] ?? homeKey(state.rows, faction);

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

/** Cheapest first, ties by key: a total order, so the search visits hexes in a fixed order. */
const before = (a: { cost: number; k: HexKey }, b: { cost: number; k: HexKey }) => a.cost < b.cost || (a.cost === b.cost && a.k < b.k);

/**
 * Dijkstra over map costs. `costOf` lets callers model knowledge
 * (e.g. the coop AI treats hidden hexes as cost 1). Hexes are settled cheapest first, ties by
 * key; a hex's path goes through the first settled hex that reached it at its final cost.
 * Paths are built only when read.
 */
export function shortestPaths(
  tiles: Record<HexKey, Tile>,
  start: HexKey,
  costOf: (k: HexKey) => number | null,
): Map<HexKey, PathResult> {
  const cost = new Map<HexKey, number>([[start, 0]]);
  const parent = new Map<HexKey, HexKey>();
  const done = new Set<HexKey>();
  // Binary heap of (cost, hex); an entry whose cost is out of date is skipped when it comes up.
  const heap: Array<{ cost: number; k: HexKey }> = [{ cost: 0, k: start }];
  const push = (e: { cost: number; k: HexKey }) => {
    let i = heap.push(e) - 1;
    while (i > 0) {
      const up = (i - 1) >> 1;
      if (!before(heap[i], heap[up])) break;
      [heap[i], heap[up]] = [heap[up], heap[i]];
      i = up;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && before(heap[l], heap[m])) m = l;
        if (r < heap.length && before(heap[r], heap[m])) m = r;
        if (m === i) break;
        [heap[i], heap[m]] = [heap[m], heap[i]];
        i = m;
      }
    }
    return top;
  };
  while (heap.length) {
    const { cost: d, k: cur } = pop();
    if (done.has(cur) || d !== cost.get(cur)) continue;
    done.add(cur);
    for (const n of mapNeighbors(tiles, cur)) {
      const c = costOf(n);
      if (c === null) continue;
      const next = d + c;
      const old = cost.get(n);
      if (old === undefined || next < old) {
        cost.set(n, next);
        parent.set(n, cur);
        push({ cost: next, k: n });
      }
    }
  }
  const out = new Map<HexKey, PathResult>();
  for (const [k, c] of cost) out.set(k, new LazyPath(k, c, parent));
  return out;
}

class LazyPath implements PathResult {
  private steps: HexKey[] | null = null;
  constructor(
    private readonly to: HexKey,
    readonly cost: number,
    private readonly parent: Map<HexKey, HexKey>,
  ) {}

  get path(): HexKey[] {
    if (!this.steps) {
      const out = [this.to];
      for (let k = this.parent.get(this.to); k !== undefined; k = this.parent.get(k)) out.push(k);
      this.steps = out.reverse();
    }
    return this.steps;
  }
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
  tree: HexKey;
  homes: Record<'dawn' | 'horde', HexKey>;
}

/** The hexes of a map shape in the order they are generated, with the Tree and the bases (the triangle's order is what the golden test hashes). */
interface Layout {
  cells: Array<{ row: number; col: number; hex: { q: number; r: number } }>;
  rows: number;
  tree: HexKey;
  homes: Record<'dawn' | 'horde', HexKey>;
  /** Hexes whose terrain is fixed by the map ('#' impassable, '=' bridge); the others are drawn from the side's tile pool. */
  forced?: Record<HexKey, 'wall' | 'bridge'>;
  /** What the '#' hexes are: water (always visible, so the islands can be seen) instead of the side's own obstacle tile. */
  wallTerrain?: 'water';
}

function triangleLayout(size: MapSize): Layout {
  const rows = MAP_VARIANTS[size].rows;
  const cells = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col <= row; col++) cells.push({ row, col, hex: triToHex(row, col) });
  return { cells, rows, tree: treeKey(), homes: { dawn: homeKey(rows, 'dawn'), horde: homeKey(rows, 'horde') } };
}

/** Pointy-topped rows, odd rows shifted half a hex to the right: (col, row) is the hex {q: col - floor(row / 2), r: row}. */
function rectangleLayout(size: MapSize): Layout {
  const { width, height } = MAP_SHAPES.rectangle[size];
  const cells = [];
  for (let row = 0; row < height; row++) for (let col = 0; col < width; col++) cells.push({ row, col, hex: { q: col - Math.floor(row / 2), r: row } });
  const mid = Math.floor(height / 2);
  const at = (col: number) => key({ q: col - Math.floor(mid / 2), r: mid });
  return { cells, rows: height, tree: at(Math.floor(width / 2)), homes: { dawn: at(0), horde: at(width - 1) } };
}

/** The ring of hexes at distance radius-1 and radius from the middle; the Tree, the Przymierze and the Horda stand on three corners of it. */
function ringLayout(size: MapSize): Layout {
  const R = MAP_SHAPES.ring[size].radius;
  const cells = [];
  let n = 0;
  for (let r = -R; r <= R; r++) {
    for (let q = Math.max(-R, -R - r); q <= Math.min(R, R - r); q++) {
      const d = distance({ q: 0, r: 0 }, { q, r });
      if (d >= R - 2) cells.push({ row: r + R, col: n++, hex: { q, r } });
    }
  }
  // Corners of the hexagon of radius R: (-R,0), (R,-R) and (0,R) are 2R apart from each other (the Tree on the left, the bases on the right).
  return { cells, rows: 2 * R + 1, tree: key({ q: -R, r: 0 }), homes: { dawn: key({ q: R, r: -R }), horde: key({ q: 0, r: R }) } };
}

/** A map drawn as text (see customMaps.ts): rows of pointy-topped hexes, odd rows shifted half a hex to the right. */
function gridLayout(rows: string[]): Layout {
  const cells: Layout['cells'] = [];
  const forced: Record<HexKey, 'wall' | 'bridge'> = {};
  const found: Record<string, HexKey> = {};
  rows.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === ' ') continue;
      const hex = { q: col - Math.floor(row / 2), r: row };
      cells.push({ row, col, hex });
      if (ch === '#') forced[key(hex)] = 'wall';
      else if (ch === '=') forced[key(hex)] = 'bridge';
      else if (ch === 'T' || ch === 'D' || ch === 'H') found[ch] = key(hex);
    }
  });
  return { cells, rows: rows.length, tree: found.T, homes: { dawn: found.D, horde: found.H }, forced };
}

/**
 * Three islands side by side (the Przymierza's, the Tree's in the middle, the Horda's) with a channel of water between them; a few hexes of each
 * channel (the same rows in both) are bridges, so both bases have the same roads to the Tree. The rows of the bridges come from the generator.
 */
function islandsLayout(size: MapSize, rng: Rng): Layout {
  const { width, height, bridges } = MAP_SHAPES.islands[size];
  const channel = Math.round(width / 4);
  const bridgeRows = new Set(rng.shuffle([...Array(height).keys()]).slice(0, bridges));
  const rows: string[] = [];
  const mid = Math.floor(height / 2);
  for (let r = 0; r < height; r++) {
    let line = '';
    for (let c = 0; c < width; c++) {
      if (c === channel - 1 || c === width - channel) line += bridgeRows.has(r) ? '=' : '#';
      else if (r === mid && c === 0) line += 'D';
      else if (r === mid && c === width - 1) line += 'H';
      else if (r === mid && c === Math.floor(width / 2)) line += 'T';
      else line += '.';
    }
    rows.push(line);
  }
  return { ...gridLayout(rows), wallTerrain: 'water' };
}

function customLayout(id: string | undefined): Layout {
  const map = CUSTOM_MAPS[id ?? ''];
  if (!map) throw new Error(`Nie ma takiej mapy: ${id}.`);
  return gridLayout(map.rows);
}

const layoutOf = (shape: MapShape, size: MapSize, rng: Rng, customMapId?: string): Layout =>
  shape === 'rectangle' ? rectangleLayout(size) : shape === 'ring' ? ringLayout(size) : shape === 'islands' ? islandsLayout(size, rng) : shape === 'custom' ? customLayout(customMapId) : triangleLayout(size);

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

export function generateMap(size: MapSize, rng: Rng, treasureCount: number, crystalCount: number, shape: MapShape = 'triangle', customMapId?: string): GeneratedMap {
  const layout = layoutOf(shape, size, rng, customMapId);
  const { rows } = layout;
  const sideAt = (row: number, col: number, hex: { q: number; r: number }): TileSide => {
    if (shape === 'triangle') return sideOf(row, col);
    const a = distance(hex, parseKey(layout.homes.dawn));
    const b = distance(hex, parseKey(layout.homes.horde));
    return a < b ? 'dawn' : a > b ? 'horde' : (row + col) % 2 === 0 ? 'dawn' : 'horde';
  };
  for (let attempt = 0; attempt < 400; attempt++) {
    const tiles: Record<HexKey, Tile> = {};
    for (const { row, col, hex } of layout.cells) {
      const k = key(hex);
      const side = sideAt(row, col, hex);
      const tile: Tile = { key: k, row, col, terrain: 'meadow', side, variant: 1, revealed: false, crystalId: null, treasureId: null, home: null, tree: false };
      setTerrain(tile, rng.pick(TILE_POOLS[side]), rng);
      const fixed = layout.forced?.[k];
      if (fixed) setTerrain(tile, fixed === 'bridge' ? 'bridge' : layout.wallTerrain ?? (side === 'dawn' ? 'chasm' : 'deadThicket'), rng);
      // Water has nothing hidden under it: it is on the map from the start, which is what shows the islands.
      if (tile.terrain === 'water') tile.revealed = true;
      tiles[k] = tile;
    }
    const tree = layout.tree;
    const dawn = layout.homes.dawn;
    const horde = layout.homes.horde;
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
      for (const n of mapNeighbors(tiles, base)) if (tileCost(tiles[n]) === null && !layout.forced?.[n]) setTerrain(tiles[n], tiles[n].side === 'dawn' ? 'meadow' : 'scorched', rng);
    }

    const reach = reachableFrom(tiles, dawn);
    if (!reach.has(tree) || !reach.has(horde)) continue;

    // Guardians: Cyclops and Hydra live on Horda land, the Griffin on Przymierze land.
    const guardians = rng.shuffle(Object.keys(GUARDIAN_LAIRS)).slice(0, crystalCount);
    // Bridges stay bridges (a guardian or a treasure there would also block the road).
    const reserved = new Set<HexKey>([tree, dawn, horde, ...mapNeighbors(tiles, dawn), ...mapNeighbors(tiles, horde), ...Object.keys(layout.forced ?? {})]);
    const crystals: Array<{ hex: HexKey; guardian: string }> = [];
    for (const g of guardians) {
      const lair = GUARDIAN_LAIRS[g];
      const options = [...reach].filter((k) => !reserved.has(k) && tiles[k].side === lair.side && tileCost(tiles[k]) !== null);
      const spot = pickSpread(options, rng, (k) => (shape === 'triangle' ? tiles[k].row >= rows - 2 : distance(parseKey(k), parseKey(dawn)) <= 2 || distance(parseKey(k), parseKey(horde)) <= 2), crystals.map((c) => c.hex));
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
    return { rows, tiles, crystals, treasureHexes, tree, homes: { dawn, horde } };
  }
  throw new Error('Nie udało się wygenerować poprawnej mapy');
}

/**
 * Picks a hex far from the ones already taken so crystals spread over the map: at least 3 hexes
 * away if it can, then 2, then 1, from a shuffled pool (one shuffle, whatever is found).
 */
function pickSpread(candidates: HexKey[], rng: Rng, nearBase: (k: HexKey) => boolean, taken: HexKey[]): HexKey | undefined {
  const pool = rng.shuffle(candidates);
  for (const minGap of [3, 2, 1]) {
    for (const k of pool) {
      // Keep crystals off the two bottom rows of the triangle, or the hexes near a base, so the race is not trivial (unless nothing else fits).
      if (minGap > 1 && nearBase(k)) continue;
      if (!taken.some((c) => distance(parseKey(c), parseKey(k)) < minGap)) return k;
    }
  }
  return undefined;
}
