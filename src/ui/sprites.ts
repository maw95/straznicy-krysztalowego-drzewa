// 2D unit sprites (the digital edition): sheets of frames cut from AI clips (docs/POTOK_ANIMACJI.md).
// A unit has one sheet per clip plus two stills; every unit faces right, the other side is a mirror image.

import { asset } from './common';

/** How a unit with sprites is drawn. Add a unit here once its folder in public/assets/jednostki is accepted. */
export interface SpriteSpec {
  /** Folder under public/assets (anim.json, stoi.webp, martwy.webp and one sheet per clip). */
  dir: string;
  /** Width (canvas pixels) the frame is drawn at. */
  width: number;
  /** Where the feet stand, as a fraction of the frame height. */
  feet: number;
  /** Playback speed of each clip against its recorded 24 fps (the take-off and landing are slowed or sped up here). */
  speed: Record<string, number>;
}

export const SPRITES: Record<string, SpriteSpec> = {
  goldDragon: { dir: 'jednostki/zloty_smok', width: 250, feet: 0.85, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
};

/** Whether the unit is drawn from sprites in the digital ruleset (otherwise: 3D figure or portrait token). */
export const hasSprites = (defId: string): boolean => defId in SPRITES;

interface AnimJson {
  frame: [number, number];
  cols: number;
  fps: number;
  clips: Record<string, number>;
}

export interface SpriteSet {
  spec: SpriteSpec;
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
      return { spec, frameW: meta.frame[0], frameH: meta.frame[1], cols: meta.cols, fps: meta.fps, frames: meta.clips, sheets: Object.fromEntries(names.map((n, i) => [n, sheets[i]])), stoi, martwy } satisfies SpriteSet;
    })();
    p.catch(() => cache.delete(defId));
    cache.set(defId, p);
  }
  return p;
}
