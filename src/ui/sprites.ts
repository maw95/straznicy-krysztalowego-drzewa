// 2D unit sprites (the digital edition): sheets of frames cut from AI clips (docs/POTOK_ANIMACJI.md).
// A unit has one sheet per clip plus two stills; every unit faces right, the other side is a mirror image.

import { asset } from './common';

/** How a unit with sprites is drawn. Add a unit here once its folder in public/assets/jednostki is accepted. */
export interface SpriteSpec {
  /** Folder under public/assets (anim.json, stoi.webp, martwy.webp and one sheet per clip). */
  dir: string;
  /** Width (canvas pixels) the frame is drawn at (units packed before anim.json held the body measures). */
  width?: number;
  /** Width the unit's body is drawn at (canvas pixels): about 140 for a unit on two hexes, 70 on one; the frame follows from it. */
  bodyW?: number;
  /** Where the feet stand, as a fraction of the frame height (when anim.json does not say). */
  feet?: number;
  /** Playback speed of each clip against its recorded 24 fps (the take-off and landing are slowed or sped up here). */
  speed: Record<string, number>;
}

export const SPRITES: Record<string, SpriteSpec> = {
  goldDragon: { dir: 'jednostki/zloty_smok', width: 250, feet: 0.85, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  ancientBear: { dir: 'jednostki/prastary_niedzwiedz', bodyW: 140, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
};

/** Whether the unit is drawn from sprites in the digital ruleset (otherwise: 3D figure or portrait token). */
export const hasSprites = (defId: string): boolean => defId in SPRITES;

interface AnimJson {
  frame: [number, number];
  cols: number;
  fps: number;
  clips: Record<string, number>;
  /** Measured on the standing picture (fractions of the cropped frame): feet line, horizontal middle, body width. */
  feet?: number;
  cx?: number;
  body?: number;
}

export interface SpriteSet {
  spec: SpriteSpec;
  /** Drawn width of the frame (canvas pixels), where the feet stand (fraction of the frame height) and its horizontal middle (fraction of the width). */
  width: number;
  feet: number;
  cx: number;
  /** Width of the body as a fraction of the frame (for the shadow). */
  body: number;
  /** The clip that carries it over the board: the flight loop, the walk loop, or none. */
  moveClip: 'lot' | 'chod' | null;
  frameW: number;
  frameH: number;
  cols: number;
  fps: number;
  /** Frames per clip. */
  frames: Record<string, number>;
  sheets: Record<string, HTMLImageElement>;
  stoi: HTMLImageElement;
  martwy: HTMLImageElement;
}

const cache = new Map<string, Promise<SpriteSet>>();

const image = (src: string) =>
  new Promise<HTMLImageElement>((ok, fail) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => fail(new Error(`Nie udało się wczytać ${src}`));
    im.src = src;
  });

export function loadSprites(defId: string): Promise<SpriteSet> {
  let p = cache.get(defId);
  if (!p) {
    const spec = SPRITES[defId];
    p = (async () => {
      const url = (f: string) => asset(`${spec.dir}/${f}`);
      const meta = (await (await fetch(url('anim.json'))).json()) as AnimJson;
      const names = Object.keys(meta.clips);
      const [stoi, martwy, ...sheets] = await Promise.all([image(url('stoi.webp')), image(url('martwy.webp')), ...names.map((n) => image(url(`${n}.webp`)))]);
      const width = spec.width ?? (spec.bodyW ?? 70) / (meta.body ?? 0.55);
      return {
        spec,
        width,
        feet: meta.feet ?? spec.feet ?? 0.85,
        cx: meta.cx ?? 0.5,
        body: meta.body ?? 0.55,
        moveClip: meta.clips.lot ? 'lot' : meta.clips.chod ? 'chod' : null,
        frameW: meta.frame[0],
        frameH: meta.frame[1],
        cols: meta.cols,
        fps: meta.fps,
        frames: meta.clips,
        sheets: Object.fromEntries(names.map((n, i) => [n, sheets[i]])),
        stoi,
        martwy,
      } satisfies SpriteSet;
    })();
    p.catch(() => cache.delete(defId));
    cache.set(defId, p);
  }
  return p;
}
