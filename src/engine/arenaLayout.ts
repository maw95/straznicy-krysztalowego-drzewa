// Arena geometry: the painted 13-column arena and the wide (digital) arena, their cells and obstacles. Pure data and lookups.

import type { HexKey } from './hex';
import { key, parseKey } from './hex';
import type { FactionId } from './data';
import type { BattleState } from './types';

/**
 * The arena drawn by the designer (docs/grafika/areny/arena_walki_*.png): 13 columns of
 * flat-topped hexes. A cell is (col, half-row): `half` counts half-hex steps down the board,
 * so one column holds every second value and neighbouring columns are offset by one.
 * Columns hold 5–7 hexes; the start columns 0 and 12 hold 5 (85 cells in all).
 */
export const ARENA_COLUMNS = 13;
/** First and last half-row of each column. */
export const COLUMN_SPAN: ReadonlyArray<readonly [number, number]> = [
  [4, 12], [3, 13], [2, 14], [3, 15], [2, 14], [3, 15], [2, 14], [3, 15], [2, 14], [3, 15], [2, 14], [3, 13], [4, 12],
];
/** Half-row of the middle of a start column. */
export const MIDDLE_HALF = 8;

/** An arena picture: the land of a race (a battle on a team's land is fought on the arena of the race it plays). */
export type ArenaId = FactionId;

/** Obstacles painted on each arena, as [col, half]: 7 pieces, two of them 2 cells wide. Start columns stay free. */
export const ARENA_OBSTACLES: Record<ArenaId, Array<[number, number]>> = {
  dawn: [[3, 3], [9, 3], [3, 7], [6, 8], [9, 9], [10, 10], [3, 13], [4, 14], [9, 13]],
  horde: [[3, 3], [9, 3], [3, 7], [2, 8], [6, 8], [9, 9], [10, 10], [3, 13], [9, 13]],
  // The painted arena of the Herds does not exist yet: the board edition's arena is not played with them (digital only), the picture of Przymierze stands in.
  herds: [[3, 3], [9, 3], [3, 7], [6, 8], [9, 9], [10, 10], [3, 13], [4, 14], [9, 13]],
  // Same stand-in for the Kingdom of the Dead (backlog 2a).
  undead: [[3, 3], [9, 3], [3, 7], [6, 8], [9, 9], [10, 10], [3, 13], [4, 14], [9, 13]],
  // And for the Iron Clans (a mountain pass with statues of the ancestors wants its own arena).
  clans: [[3, 3], [9, 3], [3, 7], [6, 8], [9, 9], [10, 10], [3, 13], [4, 14], [9, 13]],
  // And for the Court of Everfrost (a frozen lake with snowy firs and ice spikes wants its own arena).
  frost: [[3, 3], [9, 3], [3, 7], [6, 8], [9, 9], [10, 10], [3, 13], [4, 14], [9, 13]],
  // And for the Free Companies (a forest camp by a ruined mill wants its own arena).
  free: [[3, 3], [9, 3], [3, 7], [6, 8], [9, 9], [10, 10], [3, 13], [4, 14], [9, 13]],
  // And for the Sands (an oasis with ruined columns, dunes and palms wants its own arena).
  sands: [[3, 3], [9, 3], [3, 7], [6, 8], [9, 9], [10, 10], [3, 13], [4, 14], [9, 13]],
  // And for the Swarm (a cave under the roots with mushrooms as tall as trees wants its own arena).
  swarm: [[3, 3], [9, 3], [3, 7], [6, 8], [9, 9], [10, 10], [3, 13], [4, 14], [9, 13]],
  // And for the Tides (a beach by the reef at low tide, with rocks, nets and pools wants its own arena).
  tides: [[3, 3], [9, 3], [3, 7], [6, 8], [9, 9], [10, 10], [3, 13], [4, 14], [9, 13]],
};

export const arenaCell = (col: number, half: number): HexKey => key({ q: col, r: (half - col) / 2 });

/** Column and half-row of an arena cell. */
export function cellOf(k: HexKey): { col: number; half: number } {
  const h = parseKey(k);
  return { col: h.q, half: 2 * h.r + h.q };
}

const ARENA_CELLS: readonly HexKey[] = Object.freeze(
  COLUMN_SPAN.flatMap(([from, to], col) => {
    const out: HexKey[] = [];
    for (let half = from; half <= to; half += 2) out.push(arenaCell(col, half));
    return out;
  }),
);

/** Every cell of the arena, column by column (shared: never change the list). */
export function arenaCells(): readonly HexKey[] {
  return ARENA_CELLS;
}

/** Cells of one column, from the middle outwards. */
export function columnCells(col: number): HexKey[] {
  const [from, to] = COLUMN_SPAN[col];
  const halves: number[] = [];
  for (let half = from; half <= to; half += 2) halves.push(half);
  return halves.sort((a, b) => Math.abs(a - MIDDLE_HALF) - Math.abs(b - MIDDLE_HALF) || a - b).map((half) => arenaCell(col, half));
}

export function arenaObstacles(arena: ArenaId, layout?: 'wide'): HexKey[] {
  return layout === 'wide' ? wideObstacleGroups(arena).flatMap((g) => g.cells) : ARENA_OBSTACLES[arena].map(([c, h]) => arenaCell(c, h));
}

const ARENA_SET = new Set(ARENA_CELLS);
export const inArena = (k: HexKey) => ARENA_SET.has(k);

// ---------------------------------------------------------------- the digital arena ("wide")
// Pointy-topped hexes in horizontal rows, like Heroes III: 13 columns × 9 rows, odd rows shifted half a cell to the right
// (axial q = col − ⌊row / 2⌋). Units fit side by side in a row, so a large unit is simply two neighbours in one row.

export const WIDE_COLUMNS = 13;
export const WIDE_ROWS = 9;
export const WIDE_MIDDLE_ROW = 4;

export const wideCell = (col: number, row: number): HexKey => key({ q: col - (row - (row & 1)) / 2, r: row });

/** Column and row of a cell of the wide arena. */
export function wideCellOf(k: HexKey): { col: number; row: number } {
  const h = parseKey(k);
  return { col: h.q + (h.r - (h.r & 1)) / 2, row: h.r };
}

const WIDE_CELLS: readonly HexKey[] = Object.freeze(Array.from({ length: WIDE_ROWS }, (_, row) => Array.from({ length: WIDE_COLUMNS }, (_, col) => wideCell(col, row))).flat());
export const WIDE_SET = new Set(WIDE_CELLS);

/** One obstacle of a wide arena: one or two neighbouring cells [col, row] (side by side in a row, or on a slant across two rows) and the name of its picture (public/assets/arena/cyfrowa). */
export interface ObstacleGroup {
  art: string;
  cells: Array<[number, number]>;
}

/**
 * Obstacles of the wide arenas. The start columns 0 and 12 and the columns next to them (where a large unit's head lies) stay
 * free, every free cell stays reachable (tests), and no picture repeats on one arena.
 */
export const WIDE_OBSTACLES: Record<ArenaId, ObstacleGroup[]> = {
  dawn: [
    { art: 'log', cells: [[3, 1], [4, 1]] },
    { art: 'wall', cells: [[8, 6], [8, 7]] },
    { art: 'ridge', cells: [[5, 4], [6, 4]] },
    { art: 'boulders', cells: [[9, 2]] },
    { art: 'ruin', cells: [[3, 6]] },
    { art: 'pine', cells: [[10, 5]] },
    { art: 'brambles', cells: [[7, 1]] },
    { art: 'statue', cells: [[6, 7]] },
  ],
  horde: [
    { art: 'bones', cells: [[3, 2], [4, 2]] },
    { art: 'barricade', cells: [[9, 5], [9, 6]] },
    { art: 'siegecart', cells: [[5, 5], [6, 5]] },
    { art: 'spires', cells: [[9, 3]] },
    { art: 'deadtree', cells: [[2, 6]] },
    { art: 'crystals', cells: [[6, 2]] },
    { art: 'totem', cells: [[10, 5]] },
  ],
  // The steppe of the Herds: standing stones, cairns and boulders (public/assets/arena/cyfrowa).
  herds: [
    { art: 'rockledge', cells: [[3, 1], [4, 1]] },
    { art: 'stonecircle', cells: [[8, 6], [8, 7]] },
    { art: 'boulderfield', cells: [[5, 4], [6, 4]] },
    { art: 'menhir', cells: [[9, 2]] },
    { art: 'cairn', cells: [[3, 6]] },
    { art: 'grasstuft', cells: [[10, 5]] },
    { art: 'thornbush', cells: [[7, 1]] },
    { art: 'boulders', cells: [[6, 7]] },
  ],
  // Placeholder (docs/BACKLOG.md 2a): barrows in the mist want their own arena (mounds, crooked birches, stone lanterns); until then the pictures of Przymierze, rearranged.
  undead: [
    { art: 'wall', cells: [[3, 1], [4, 1]] },
    { art: 'ridge', cells: [[8, 6], [8, 7]] },
    { art: 'log', cells: [[5, 4], [6, 4]] },
    { art: 'statue', cells: [[9, 2]] },
    { art: 'ruin', cells: [[3, 6]] },
    { art: 'boulders', cells: [[10, 5]] },
    { art: 'pine', cells: [[7, 1]] },
    { art: 'brambles', cells: [[6, 7]] },
  ],
  // A mountain pass with statues of the ancestors and a stone bridge: a rock wall, granite, ancestors, an ore cart, an anvil, scree and a brazier (public/assets/arena/cyfrowa).
  clans: [
    { art: 'rockwall', cells: [[4, 1], [5, 1]] },
    { art: 'granite', cells: [[8, 5], [8, 6]] },
    { art: 'ancestor', cells: [[3, 4]] },
    { art: 'ancestor', cells: [[10, 2]] },
    { art: 'orecart', cells: [[6, 6]] },
    { art: 'anvil', cells: [[9, 7]] },
    { art: 'scree', cells: [[5, 3], [6, 3]] },
    { art: 'brazier', cells: [[7, 1]] },
  ],
  // Placeholder (docs/BACKLOG.md 2a): a frozen lake with snowy firs and spikes of ice; until then the pictures of Przymierze and Horda, rearranged.
  frost: [
    { art: 'pine', cells: [[3, 2], [4, 2]] },
    { art: 'crystals', cells: [[8, 5], [8, 6]] },
    { art: 'spires', cells: [[6, 3]] },
    { art: 'boulders', cells: [[10, 2]] },
    { art: 'statue', cells: [[3, 6]] },
    { art: 'ruin', cells: [[9, 7]] },
    { art: 'brambles', cells: [[6, 7]] },
  ],
  // A forest camp by a ruined watermill: a felled oak with stakes, a supply wagon, barrels, a palisade, millstones, firewood and a campfire (public/assets/arena/cyfrowa).
  free: [
    { art: 'felledoak', cells: [[4, 1], [5, 1]] },
    { art: 'campwagon', cells: [[8, 5], [8, 6]] },
    { art: 'barrelstack', cells: [[3, 4]] },
    { art: 'stakefence', cells: [[9, 2]] },
    { art: 'millstones', cells: [[10, 7]] },
    { art: 'woodpile', cells: [[6, 3]] },
    { art: 'campfire', cells: [[6, 7]] },
  ],
  // Placeholder (docs/BACKLOG.md 2a): an oasis with ruined columns, dunes (boulders) and dry palms until the arena of its own is painted.
  sands: [
    { art: 'ruin', cells: [[4, 1], [5, 1]] },
    { art: 'statue', cells: [[8, 5], [8, 6]] },
    { art: 'ruin', cells: [[3, 4]] },
    { art: 'deadtree', cells: [[9, 2]] },
    { art: 'boulders', cells: [[10, 7]] },
    { art: 'boulders', cells: [[6, 3]] },
    { art: 'deadtree', cells: [[6, 7]] },
  ],
  // Placeholder (docs/BACKLOG.md 2a): a cave under old roots (dead trees for the roots, boulders, brambles for the mushrooms) until the arena of its own is painted.
  swarm: [
    { art: 'deadtree', cells: [[4, 1], [5, 1]] },
    { art: 'boulders', cells: [[8, 5], [8, 6]] },
    { art: 'brambles', cells: [[3, 4]] },
    { art: 'deadtree', cells: [[9, 2]] },
    { art: 'brambles', cells: [[10, 7]] },
    { art: 'boulders', cells: [[6, 3]] },
    { art: 'log', cells: [[6, 7]] },
  ],
  // A beach by the reef at low tide: reef ledges, a wreck, a drying net, a sea stack, driftwood, a tide pool and kelp (public/assets/arena/cyfrowa).
  tides: [
    { art: 'reefledge', cells: [[4, 1], [5, 1]] },
    { art: 'wreck', cells: [[8, 5], [8, 6]] },
    { art: 'netrack', cells: [[3, 4]] },
    { art: 'seastack', cells: [[9, 2]] },
    { art: 'driftwood', cells: [[10, 7]] },
    { art: 'tidepool', cells: [[6, 3]] },
    { art: 'kelpheap', cells: [[6, 7]] },
  ],
};

/** The obstacle groups of a wide arena with their cells as keys (for drawing). */
export const wideObstacleGroups = (arena: ArenaId): Array<{ art: string; cells: HexKey[] }> =>
  WIDE_OBSTACLES[arena].map((g) => ({ art: g.art, cells: g.cells.map(([c, r]) => wideCell(c, r)) }));

/** Every cell of the arena of this battle (shared: never change the list). */
export const layoutCells = (b: Pick<BattleState, 'layout'>): readonly HexKey[] => (b.layout === 'wide' ? WIDE_CELLS : ARENA_CELLS);
export const inLayout = (b: Pick<BattleState, 'layout'>, k: HexKey): boolean => (b.layout === 'wide' ? WIDE_SET : ARENA_SET).has(k);

/** How far a cell lies from the middle row (the rows next to it first): the order units are deployed in. */
export function middleDistance(b: Pick<BattleState, 'layout'>, k: HexKey): number {
  return b.layout === 'wide' ? Math.abs(wideCellOf(k).row - WIDE_MIDDLE_ROW) : Math.abs(cellOf(k).half - MIDDLE_HALF);
}

/** Cells of one column of the wide arena, from the middle row outwards. */
export function wideColumnCells(col: number): HexKey[] {
  return Array.from({ length: WIDE_ROWS }, (_, row) => row)
    .sort((a, b) => Math.abs(a - WIDE_MIDDLE_ROW) - Math.abs(b - WIDE_MIDDLE_ROW) || a - b)
    .map((row) => wideCell(col, row));
}
