// Hex geometry on axial coordinates {q, r}, shared by both boards: the triangular adventure map
// (triToHex below) and the arena of flat-topped hexes (its (col, half) cells: battle.ts).

export interface Hex {
  q: number;
  r: number;
}

export type HexKey = string;

export const key = (h: Hex): HexKey => `${h.q},${h.r}`;

/** Parsed keys: a game uses a few hundred hexes and parses them all the time. */
const PARSED = new Map<HexKey, Readonly<Hex>>();

/** The hex of a key. The result is shared: never change it. */
export function parseKey(k: HexKey): Hex {
  let h = PARSED.get(k);
  if (!h) {
    const [q, r] = k.split(',').map(Number);
    PARSED.set(k, (h = Object.freeze({ q, r })));
  }
  return h;
}

export const DIRECTIONS: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export const add = (a: Hex, b: Hex): Hex => ({ q: a.q + b.q, r: a.r + b.r });

export function neighbors(h: Hex): Hex[] {
  return DIRECTIONS.map((d) => add(h, d));
}

const NEAR = new Map<HexKey, readonly HexKey[]>();

/** Keys of the six neighbours of a hex, on or off any board (shared: never change the list). */
export function neighborKeys(k: HexKey): readonly HexKey[] {
  let near = NEAR.get(k);
  if (!near) NEAR.set(k, (near = neighbors(parseKey(k)).map(key)));
  return near;
}

export function distance(a: Hex, b: Hex): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

export function directionBetween(from: Hex, to: Hex): Hex | null {
  const d = { q: to.q - from.q, r: to.r - from.r };
  return DIRECTIONS.find((x) => x.q === d.q && x.r === d.r) ?? null;
}

/** Triangular map: row `row` (0 = top) has row + 1 hexes, `col` in [0, row]. */
export const triToHex = (row: number, col: number): Hex => ({ q: col - row, r: row });

function cubeRound(x: number, y: number, z: number): Hex {
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx, r: rz };
}

/**
 * Hexes crossed by a straight segment between two hex centres (both ends included).
 * Ambiguous edge cases are resolved with a fixed tiny nudge toward +q/+r, so the
 * result is deterministic and symmetric enough for line-of-sight checks.
 */
export function line(a: Hex, b: Hex): Hex[] {
  const n = distance(a, b);
  if (n === 0) return [a];
  const ax = a.q + 1e-6, az = a.r + 2e-6, ay = -ax - az;
  const bx = b.q + 1e-6, bz = b.r + 2e-6, by = -bx - bz;
  const out: Hex[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push(cubeRound(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t));
  }
  return out;
}
