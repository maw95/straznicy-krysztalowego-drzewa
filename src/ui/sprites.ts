// 2D unit sprites (the digital edition): sheets of frames cut from AI clips (docs/POTOK_ANIMACJI.md).
// A unit has one sheet per clip plus two stills; every unit faces right, the other side is a mirror image.

import { asset } from './common';

/** How a unit with sprites is drawn. Add a unit here once its folder in public/assets/jednostki is accepted. */
export interface SpriteSpec {
  /** Folder under public/assets (anim.json, stoi.webp, martwy.webp and one sheet per clip). */
  dir: string;
  /** Width (canvas pixels) the frame is drawn at (units packed before anim.json held the body measures). */
  width?: number;
  /** The box (canvas pixels) the unit's body is fitted into: LARGE for a unit on two hexes, SMALL on one; the frame follows from it. */
  box?: readonly [number, number];
  /** Where the feet stand, as a fraction of the frame height (when anim.json does not say). */
  feet?: number;
  /** Playback speed of each clip against its recorded 24 fps (the take-off and landing are slowed or sped up here). */
  speed: Record<string, number>;
}

/** Body boxes: a unit on two hexes and a unit on one (width × height of the visible body, canvas pixels). */
const LARGE = [150, 120] as const;
const SMALL = [76, 96] as const;

export const SPRITES: Record<string, SpriteSpec> = {
  goldDragon: { dir: 'jednostki/zloty_smok', width: 250, feet: 0.85, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  pegasus: { dir: 'jednostki/pegaz', box: SMALL, speed: { lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  werewolfLord: { dir: 'jednostki/wladca_wilkolakow', box: SMALL, speed: { chod: 1.4, atak: 1.5, smierc: 1.5 } },
  ironFistOgre: { dir: 'jednostki/ogr_zelazna_piesc', box: LARGE, speed: { chod: 1.4, atak: 1.5, trafienie: 1.4 } },
  unicornKing: { dir: 'jednostki/krol_jednorozcow', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  elfDruid: { dir: 'jednostki/elf_druid', box: SMALL, speed: { chod: 1.4, smierc: 1.5, trafienie: 1.4 } },
  nymph: { dir: 'jednostki/nimfa', box: SMALL, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  goblinShaman: { dir: 'jednostki/goblin_szaman', box: SMALL, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  caveSpider: { dir: 'jednostki/pajak_jaskiniowy', box: SMALL, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  shadowBat: { dir: 'jednostki/nietoperz_cienia', box: SMALL, speed: { lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  blackDragon: { dir: 'jednostki/czarny_smok', box: LARGE, speed: { lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  cyclops: { dir: 'jednostki/cyklop', box: LARGE, speed: { chod: 1.4, smierc: 1.5, trafienie: 1.4 } },
  hydra: { dir: 'jednostki/hydra', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5 } },
  ancientBear: { dir: 'jednostki/prastary_niedzwiedz', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
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

/** Size in pixels of the visible part (alpha above a threshold, ignoring specks) of a picture, or null when the browser cannot tell. */
function measureBody(im: HTMLImageElement): { w: number; h: number } | null {
  try {
    const c = document.createElement('canvas');
    c.width = im.width;
    c.height = im.height;
    const g = c.getContext('2d');
    if (!g) return null;
    g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    const colHits = new Uint16Array(c.width);
    const rowHits = new Uint16Array(c.height);
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) (colHits[x]++, rowHits[y]++);
    for (let x = 0; x < c.width; x++) if (colHits[x] > 2) (x0 = Math.min(x0, x), (x1 = Math.max(x1, x)));
    for (let y = 0; y < c.height; y++) if (rowHits[y] > 2) (y0 = Math.min(y0, y), (y1 = Math.max(y1, y)));
    return x1 < 0 ? null : { w: x1 - x0 + 1, h: y1 - y0 + 1 };
  } catch {
    return null;
  }
}

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
      // Fit the visible body (measured on the standing picture) into the unit's box.
      const body = measureBody(stoi);
      const box = spec.box ?? SMALL;
      const width = spec.width ?? (body ? meta.frame[0] * Math.min(box[0] / body.w, box[1] / body.h) : (box[0] / (meta.body ?? 0.55)));
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
