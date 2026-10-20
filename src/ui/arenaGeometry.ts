// Where the arena cells sit on the painted boards (public/assets/arena/<dawn|horde>.jpg).
// Both paintings share one grid, measured from their gold lines: rows of hex edges get
// taller towards the bottom and columns spread out (a slight perspective).

import { cellOf } from '../engine/battle';
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

/** Outline of a cell (flat-topped hexagon), optionally shrunk by `ins` pixels. */
export function hexPoints(k: HexKey, ins = 0): string {
  const { col, half } = cellOf(k);
  const top = HALF_Y[half - 1] * K + ins;
  const bottom = HALF_Y[half + 1] * K - ins;
  const y = HALF_Y[half] * K;
  const x = columnX(col, HALF_Y[half]) * K;
  const r = ((spacing(HALF_Y[half]) * 2) / 3) * K - ins;
  return [
    [x - r, y],
    [x - r / 2, top],
    [x + r / 2, top],
    [x + r, y],
    [x + r / 2, bottom],
    [x - r / 2, bottom],
  ]
    .map((p) => p.map((v) => v.toFixed(1)).join(','))
    .join(' ');
}
