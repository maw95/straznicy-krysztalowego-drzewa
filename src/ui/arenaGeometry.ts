// Where the arena cells sit on the painted boards (public/assets/arena/<dawn|horde>.jpg).
// Both paintings share one grid, measured from their gold lines: rows of hex edges get
// taller towards the bottom and columns spread out (a slight perspective).

import { arenaCells, cellOf } from '../engine/battle';
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
