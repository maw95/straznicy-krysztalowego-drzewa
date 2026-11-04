// Where the arena cells sit on the painted boards (public/assets/arena/<dawn|horde>.jpg).
// Both paintings share one grid, measured from their gold lines: rows of hex edges get
// taller towards the bottom and columns spread out (a slight perspective).

import { arenaCells, cellOf, layoutCells, wideCellOf, WIDE_COLUMNS, WIDE_ROWS } from '../engine/battle';
import type { HexKey } from '../engine/hex';

/** Painting size in pixels and the scale it is shown at. */
const ART_W = 1448;
const ART_H = 1086;
const K = 0.62;
/** The painting's gold frame ends here; below it is only a strip of filler. */
const FRAME_BOTTOM = 1032;
export const ART_SIZE = { w: ART_W * K, h: ART_H * K };
export const CANVAS_W = ART_W * K;
export const CANVAS_H = FRAME_BOTTOM * K;

/** y of every half-row on the painting (cell centres and the edges between them). */
const HALF_Y = [105, 149, 192, 235, 281.5, 327, 374, 421, 470, 518.5, 569, 619, 671, 722.5, 776, 829, 880, 930];

/** Column spacing at height y: the grid widens slightly towards the bottom. */
const spacing = (y: number) => 85.2 + 0.01429 * (y - 192);
const columnX = (col: number, y: number) => 726 + (col - 6) * spacing(y);

export function cellCenter(k: HexKey): { x: number; y: number } {
  const { col, half } = cellOf(k);
  const y = HALF_Y[half];
  return { x: columnX(col, y) * K, y: y * K };
}

/**
 * Outline of a cell (flat-topped hexagon), optionally shrunk by `ins` pixels. Every corner is placed by
 * the grid's perspective at its own height, so neighbouring cells share their corners exactly (placing
 * them all from the cell's centre row made neighbours overlap where the columns spread out).
 */
export function hexPoints(k: HexKey, ins = 0): string {
  const { col, half } = cellOf(k);
  // Corners in grid units: a third of a column to the side on the rows above and below, two thirds on the centre row.
  const corners: Array<[number, number]> = [
    [col - 2 / 3, half],
    [col - 1 / 3, half - 1],
    [col + 1 / 3, half - 1],
    [col + 2 / 3, half],
    [col + 1 / 3, half + 1],
    [col - 1 / 3, half + 1],
  ];
  const cx = columnX(col, HALF_Y[half]) * K;
  const cy = HALF_Y[half] * K;
  return corners
    .map(([c, h]) => {
      let x = columnX(c, HALF_Y[h]) * K;
      let y = HALF_Y[h] * K;
      if (ins) {
        const d = Math.hypot(cx - x, cy - y);
        x += ((cx - x) * ins) / d;
        y += ((cy - y) * ins) / d;
      }
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** The arena never changes shape: its cells and their outlines are worked out once. */
export const CELLS = arenaCells();
export const CELL_POINTS = new Map(CELLS.map((k) => [k, hexPoints(k)]));

/** Box a unit token is laid out in, centred on its cell. */
export const TOKEN_W = 66;
export const TOKEN_H = 76;

/** Top-left corner of the token box on a cell. */
export function cellPos(k: HexKey) {
  const c = cellCenter(k);
  return { x: c.x - TOKEN_W / 2, y: c.y - TOKEN_H / 2 };
}

// ---------------------------------------------------------------- the digital arena (pointy-topped hexes in rows)

/**
 * Where the cells of one arena sit on its picture. The classic arena is painted (above); the digital one ("wide") is a plain
 * picture (public/assets/arena/cyfrowa/*.webp) with the grid drawn over it by the code: pointy-topped hexes in 9 rows of 13,
 * odd rows shifted half a cell to the right.
 */
export interface ArenaGeometry {
  cells: readonly HexKey[];
  cellPoints: Map<HexKey, string>;
  cellCenter: (k: HexKey) => { x: number; y: number };
  hexPoints: (k: HexKey, ins?: number) => string;
  /** Top-left corner of the unit token box on a cell. */
  cellPos: (k: HexKey) => { x: number; y: number };
  canvasW: number;
  canvasH: number;
  /** Size the picture is shown at. */
  art: { w: number; h: number };
  fullView: { x: number; y: number; w: number; h: number };
  phoneView: { x: number; y: number; w: number; h: number };
}

const CLASSIC_GEOMETRY: ArenaGeometry = {
  cells: CELLS,
  cellPoints: CELL_POINTS,
  cellCenter,
  hexPoints,
  cellPos,
  canvasW: CANVAS_W,
  canvasH: CANVAS_H,
  art: ART_SIZE,
  fullView: { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H },
  phoneView: { x: 55, y: 40, w: 790, h: CANVAS_H - 40 },
};

/** Width of one hex of the wide arena and the picture's size (3:2, like the generated pictures). */
const WIDE_HEX_W = 62;
const WIDE_HEX_S = WIDE_HEX_W / Math.sqrt(3);
const WIDE_W = 1000;
const WIDE_H = 667;
const WIDE_X0 = (WIDE_W - (WIDE_COLUMNS + 0.5) * WIDE_HEX_W) / 2;
const WIDE_Y0 = (WIDE_H - (WIDE_ROWS * 1.5 + 0.5) * WIDE_HEX_S) / 2;

function wideCenter(k: HexKey) {
  const { col, row } = wideCellOf(k);
  return { x: WIDE_X0 + WIDE_HEX_W * (col + 0.5 + (row & 1) / 2), y: WIDE_Y0 + WIDE_HEX_S + 1.5 * WIDE_HEX_S * row };
}

function wideHexPoints(k: HexKey, ins = 0): string {
  const c = wideCenter(k);
  const r = WIDE_HEX_S - ins;
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((30 + 60 * i) * Math.PI) / 180;
    return `${(c.x + r * Math.cos(a)).toFixed(1)},${(c.y + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

const WIDE_CELL_LIST = layoutCells({ layout: 'wide' });

const WIDE_GEOMETRY: ArenaGeometry = {
  cells: WIDE_CELL_LIST,
  cellPoints: new Map(WIDE_CELL_LIST.map((k) => [k, wideHexPoints(k)])),
  cellCenter: wideCenter,
  hexPoints: wideHexPoints,
  cellPos: (k) => {
    const c = wideCenter(k);
    return { x: c.x - TOKEN_W / 2, y: c.y - TOKEN_H / 2 };
  },
  canvasW: WIDE_W,
  canvasH: WIDE_H,
  art: { w: WIDE_W, h: WIDE_H },
  fullView: { x: 0, y: 0, w: WIDE_W, h: WIDE_H },
  phoneView: { x: 50, y: 50, w: 900, h: WIDE_H - 70 },
};

/** The geometry of a battle's arena (`BattleState.layout`). */
export const geometryOf = (layout?: 'wide'): ArenaGeometry => (layout === 'wide' ? WIDE_GEOMETRY : CLASSIC_GEOMETRY);
