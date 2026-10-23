// The sword and the arrows turned towards the target, as in Heroes III: the sword points the way the blow
// goes (from the cell the attacker strikes from), the arrows the way the shot flies. The pictures are
// turned on a canvas once per direction (every 15°) and kept; the click point turns with the tip.
// The canvas is a little bigger than the 32 px picture (its diagonal), so a turned picture keeps its size.

import { asset } from './common';

export type AimedCursor = 'atak' | 'strzal' | 'strzal_zablokowany';

const SIZE = 32;
const CANVAS = Math.ceil(SIZE * Math.SQRT2);
const STEP = 15;
/** Where each picture points (degrees, screen coordinates: 0° is right, 90° is down) and its click point at 32 px. */
const PICTURES: Record<AimedCursor, { points: number; hot: [number, number]; fallback: string }> = {
  atak: { points: -135, hot: [6, 4], fallback: 'crosshair' },
  strzal: { points: -135, hot: [5, 2], fallback: 'crosshair' },
  strzal_zablokowany: { points: -45, hot: [16, 16], fallback: 'not-allowed' },
};

const images = new Map<AimedCursor, HTMLImageElement>();
const cache = new Map<string, string>();

function picture(kind: AimedCursor): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  let img = images.get(kind);
  if (!img) {
    img = new Image();
    // The double-size picture, drawn at half size: sharper after turning.
    img.src = asset(`cursors/${kind}@2x.png`);
    images.set(kind, img);
  }
  return img.complete && img.naturalWidth ? img : null;
}

/**
 * The CSS cursor for `kind` pointing at `angle` (degrees, as from Math.atan2 on screen), or null while the
 * picture is still loading (the unturned cursor from styles.css shows meanwhile).
 */
export function aimedCursor(kind: AimedCursor, angle: number): string | null {
  const turn = (((Math.round(angle / STEP) * STEP - PICTURES[kind].points) % 360) + 360) % 360;
  const key = `${kind}:${turn}`;
  const known = cache.get(key);
  if (known) return known;
  const img = picture(kind);
  if (!img) return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = CANVAS;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const rad = (turn * Math.PI) / 180;
  ctx.translate(CANVAS / 2, CANVAS / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
  const [hx, hy] = PICTURES[kind].hot.map((v) => v - SIZE / 2);
  const x = Math.round(CANVAS / 2 + hx * Math.cos(rad) - hy * Math.sin(rad));
  const y = Math.round(CANVAS / 2 + hx * Math.sin(rad) + hy * Math.cos(rad));
  const clamp = (v: number) => Math.max(0, Math.min(CANVAS - 1, v));
  const css = `url(${canvas.toDataURL()}) ${clamp(x)} ${clamp(y)}, ${PICTURES[kind].fallback}`;
  cache.set(key, css);
  return css;
}

/** Starts loading the pictures early, so the first aimed cursor is ready when it is needed. */
export function preloadAimedCursors() {
  for (const kind of Object.keys(PICTURES) as AimedCursor[]) picture(kind);
}
