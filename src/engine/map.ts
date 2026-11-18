// Adventure map: triangle generation (variant A), costs and path finding.

import { GUARDIAN_LAIRS, MAP_SHAPES, MAP_VARIANTS, TERRAIN_COST, TERRAIN_VARIANTS, TILE_POOLS, type FactionId, type MapSize, type TeamId, type Terrain, type TileSide } from './data';
import { distance, key, neighborKeys, parseKey, triToHex, type HexKey } from './hex';
import { Rng } from './rng';
import { byTeam, TEAM_IDS } from './teams';
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

export function homeKey(rows: number, faction: TeamId): HexKey {
  // The triangle has two corners for bases: the left one is the first team's, the right one every other team's (a triangle game has two teams).
  return key(triToHex(rows - 1, faction === 'dawn' ? 0 : rows - 1));
}

/** The Tree of this game's map (the triangle's corner in a game saved before other shapes existed). */
export const treeOf = (state: Pick<GameState, 'tree'>): HexKey => state.tree ?? treeKey();

/** The base of `faction` on this game's map. */
export const homeOf = (state: Pick<GameState, 'homes' | 'rows'>, faction: TeamId): HexKey => state.homes?.[faction] ?? homeKey(state.rows, faction);

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

/** Reveals the hex and every hex within `radius` steps of it (1 = the neighbours); returns the newly revealed ones. */
export function revealAround(state: GameState, k: HexKey, radius = 1): HexKey[] {
  const revealed: HexKey[] = [];
  const seen = new Set<HexKey>([k]);
  let ring: HexKey[] = [k];
  for (let step = 0; step <= radius; step++) {
    const next: HexKey[] = [];
    for (const h of ring) {
      if (!state.tiles[h].revealed) {
        state.tiles[h].revealed = true;
        revealed.push(h);
      }
      if (step < radius) for (const n of mapNeighbors(state.tiles, h)) if (!seen.has(n)) (seen.add(n), next.push(n));
    }
    ring = next;
  }
  return revealed;
}

export interface GeneratedMap {
  rows: number;
  tiles: Record<HexKey, Tile>;
  crystals: Array<{ hex: HexKey; guardian: string }>;
  treasureHexes: HexKey[];
  tree: HexKey;
  homes: Record<TeamId, HexKey>;
}

/** The hexes of a map shape in the order they are generated, with the Tree and the bases (the triangle's order is what the golden test hashes). */
interface Layout {
  cells: Array<{ row: number; col: number; hex: { q: number; r: number } }>;
  rows: number;
  tree: HexKey;
  /** Bases of the first two teams; a shape for more teams also has 'third' and 'fourth'. */
  homes: Pick<Record<TeamId, HexKey>, 'dawn' | 'horde'> & Partial<Record<TeamId, HexKey>>;
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
  const cells: Layout['cells'] = [];
  for (let row = 0; row < height; row++) for (let col = 0; col < width; col++) cells.push({ row, col, hex: { q: col - Math.floor(row / 2), r: row } });
  const mid = Math.floor(height / 2);
  const at = (col: number) => key({ q: col - Math.floor(mid / 2), r: mid });
  const tree = at(Math.floor(width / 2));
  // Teams three and four: on the top and the bottom row, at the column whose distance to the Tree is nearest the distance of the first two bases
  // (so all four bases are about as far from the Tree).
  const want = distance(parseKey(tree), parseKey(at(0)));
  const onRow = (row: number) => {
    const best = cells.filter((c) => c.row === row).map((c) => ({ k: key(c.hex), d: Math.abs(distance(parseKey(tree), c.hex) - want) + Math.abs(c.col - Math.floor(width / 2)) / 1000 })).sort((a, b) => a.d - b.d)[0];
    return best.k;
  };
  return { cells, rows: height, tree, homes: { dawn: at(0), horde: at(width - 1), third: onRow(0), fourth: onRow(height - 1) } };
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

/** The most start zones a map can have (one per team). */
export const MAX_START_ZONES = 4;

/**
 * Splits hexes into N zones, one per start hex: every hex goes to the nearest start; on a tie the hex goes to one of the tied zones by the parity
 * (row + col) % tied, so the border zigzags and never favours one zone. With two starts this is the old two-halves rule of the non-triangle maps.
 * Returns the zone index (0..N-1, the order of `starts`) of each cell.
 */
export function splitZones(cells: Array<{ row: number; col: number; hex: { q: number; r: number } }>, starts: HexKey[]): number[] {
  if (starts.length < 1 || starts.length > MAX_START_ZONES) throw new Error(`Map needs 1 to ${MAX_START_ZONES} start zones, got ${starts.length}`);
  const points = starts.map((k) => parseKey(k));
  return cells.map(({ row, col, hex }) => {
    const d = points.map((p) => distance(hex, p));
    const best = Math.min(...d);
    const tied = d.flatMap((x, i) => (x === best ? [i] : []));
    return tied[(row + col) % tied.length];
  });
}

function setTerrain(tile: Tile, terrain: Terrain, rng: Rng) {
  tile.terrain = terrain;
  tile.variant = 1 + rng.int(TERRAIN_VARIANTS[terrain]);
}

export interface MapTeams {
  /** The teams of the game in order (default: the two teams); zone i of the map belongs to team i. */
  teams?: readonly TeamId[];
  /** The race whose land a team has (terrain tiles, bases, treasures); default: the race of the team's id. */
  race?: (team: TeamId) => FactionId;
}

export function generateMap(size: MapSize, rng: Rng, treasureCount: number, crystalCount: number, shape: MapShape = 'triangle', customMapId?: string, opts: MapTeams = {}): GeneratedMap {
  const layout = layoutOf(shape, size, rng, customMapId);
  const { rows } = layout;
  const teams = opts.teams ?? TEAM_IDS;
  const race = opts.race ?? ((t: TeamId): FactionId => (t === 'horde' || t === 'fourth' ? 'horde' : 'dawn'));
  const homes = Object.fromEntries(teams.map((t) => [t, layout.homes[t]])) as Record<TeamId, HexKey>;
  if (teams.some((t) => !homes[t])) throw new Error('Ta mapa ma miejsce tylko dla dwóch stron.');
  if (teams.length > 2 && shape === 'triangle') throw new Error('Mapa trójkątna ma miejsce tylko dla dwóch stron.');
  // The start zones in team order (up to MAX_START_ZONES): zone i belongs to team teams[i].
  const starts = teams.map((t) => homes[t]);
  const zones = shape === 'triangle' ? null : splitZones(layout.cells, starts);
  const sideAt = (i: number, row: number, col: number): TileSide => (zones ? teams[zones[i]] : sideOf(row, col));
  for (let attempt = 0; attempt < 400; attempt++) {
    const tiles: Record<HexKey, Tile> = {};
    for (const [i, { row, col, hex }] of layout.cells.entries()) {
      const k = key(hex);
      const side = sideAt(i, row, col);
      const tile: Tile = { key: k, row, col, terrain: 'meadow', side, variant: 1, revealed: false, crystalId: null, treasureId: null, home: null, tree: false };
      setTerrain(tile, rng.pick(TILE_POOLS[race(side)]), rng);
      const fixed = layout.forced?.[k];
      if (fixed) setTerrain(tile, fixed === 'bridge' ? 'bridge' : layout.wallTerrain ?? (race(side) === 'dawn' ? 'chasm' : 'deadThicket'), rng);
      // Water has nothing hidden under it: it is on the map from the start, which is what shows the islands.
      if (tile.terrain === 'water') tile.revealed = true;
      tiles[k] = tile;
    }
    const tree = layout.tree;
    const baseList = teams.map((t) => homes[t]);
    setTerrain(tiles[tree], 'tree', rng);
    tiles[tree].tree = true;
    for (const t of teams) {
      setTerrain(tiles[homes[t]], race(t) === 'dawn' ? 'baseDawn' : 'baseHorde', rng);
      tiles[homes[t]].home = t;
      tiles[homes[t]].side = t;
    }
    // Starting neighbourhoods stay passable so nobody is walled in on turn one.
    for (const base of baseList) {
      for (const n of mapNeighbors(tiles, base)) if (tileCost(tiles[n]) === null && !layout.forced?.[n]) setTerrain(tiles[n], race(tiles[n].side) === 'dawn' ? 'meadow' : 'scorched', rng);
    }

    const reach = reachableFrom(tiles, homes.dawn);
    if (!reach.has(tree) || baseList.some((b) => !reach.has(b))) continue;

    // Guardians: Cyclops and Hydra live on Horda land, the Griffin on Przymierze land.
    const guardians = rng.shuffle(Object.keys(GUARDIAN_LAIRS)).slice(0, crystalCount);
    // Bridges stay bridges (a guardian or a treasure there would also block the road).
    const reserved = new Set<HexKey>([tree, ...baseList, ...baseList.flatMap((b) => mapNeighbors(tiles, b)), ...Object.keys(layout.forced ?? {})]);
    const crystals: Array<{ hex: HexKey; guardian: string }> = [];
    for (const g of guardians) {
      const lair = GUARDIAN_LAIRS[g];
      const options = [...reach].filter((k) => !reserved.has(k) && tiles[k].side === lair.side && tileCost(tiles[k]) !== null);
      const spot = pickSpread(options, rng, (k) => (shape === 'triangle' ? tiles[k].row >= rows - 2 : baseList.some((b) => distance(parseKey(k), parseKey(b)) <= 2)), crystals.map((c) => c.hex));
      if (!spot) break;
      crystals.push({ hex: spot, guardian: g });
      reserved.add(spot);
    }
    if (crystals.length < crystalCount) continue;
    for (const c of crystals) setTerrain(tiles[c.hex], GUARDIAN_LAIRS[c.guardian].terrain, rng);
    // Evil cannot cross guarded hexes, so the Tree must stay reachable around them.
    const guarded = new Set(crystals.map((c) => c.hex));
    const hordeReach = reachableFrom(tiles, homes.horde, (k) => guarded.has(k));
    if (!hordeReach.has(tree)) continue;
    const rest = rng.shuffle([...reach].filter((k) => !reserved.has(k) && tileCost(tiles[k]) !== null));
    if (rest.length < treasureCount) continue;
    const treasureHexes = rest.slice(0, treasureCount);
    for (const k of treasureHexes) setTerrain(tiles[k], race(tiles[k].side) === 'dawn' ? 'treasureDawn' : 'treasureHorde', rng);
    return { rows, tiles, crystals, treasureHexes, tree, homes: byTeam(teams, (t) => homes[t]) };
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
