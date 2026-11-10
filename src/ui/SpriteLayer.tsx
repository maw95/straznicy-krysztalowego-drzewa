// 2D unit sprites standing on the arena (the digital edition). One transparent canvas over the board; every unit is a small
// state machine: it stands (a still image), takes off, flies (the loop repeats over the distance), lands (the take-off played
// backwards), attacks, dies (the last frame stays as the corpse) and stands up again (the death played backwards).
// A hit is a shake and a flash in code. Clicks go to the board below.

import { useEffect, useRef } from 'react';
import { emitImpact } from './impact';
import { sfx } from './sfx';
import { loadSprites, releaseSpritesExcept, SPRITES, type SpriteSet } from './sprites';

export interface SpritePiece {
  key: string;
  defId: string;
  /** Where the feet stand (canvas pixels): the middle of the hex, or between the two hexes of a large unit. */
  x: number;
  y: number;
  /** Faces left (the sprites face right). */
  flip: boolean;
  dead: boolean;
  /** Outline round the feet (CSS colour) marking the active unit. */
  ring?: string | null;
  /** A melee blow: a new `key` plays the attack once; the unit turns towards `towardX` while it lasts. */
  attack?: { key: number; towardX: number; /** The target stands next to the attacker: a shooter uses its close-combat clip (`atak_wrecz`) when it has one. */ melee?: boolean } | null;
  /** Just hit: a short shake and flash. */
  hit?: boolean;
  /** Stand at the new place at once instead of flying there (setting up units before a battle). */
  snap?: boolean;
  /** A walker's way over the board (feet positions, the first one where it started): it follows it instead of a straight line. */
  path?: Array<{ x: number; y: number }> | null;
}

/** Flight speed over the board (canvas pixels per second); take-off and landing add their own time. */
const FLY_SPEED = 420;
/** Walking speed over the board (canvas pixels per second). */
const WALK_SPEED = 300;
const MIN_GLIDE_MS = 250;
const HIT_MS = 320;
/** A unit turning round (the picture narrows, hops and leans, then widens on the other side): there is no turn clip yet. */
const TURN_MS = 300;
/** The blow of an attack clip lands this far into it. */
const IMPACT_AT = 0.45;

/** One stretch of a unit's motion; they run one after another. */
type Seg =
  | { kind: 'turn'; to: boolean; ms: number }
  | { kind: 'clip'; clip: string; reverse: boolean; ms: number; then?: 'corpse' | 'stand'; /** An attack clip: announces its blow (once) when it gets there. */ impact?: { unit: string; done: boolean } }
  | { kind: 'glide'; from: { x: number; y: number }; to: { x: number; y: number }; ms: number; /** Stops of a walker's way (from first to last), when it is not a straight line. */ path?: Array<{ x: number; y: number }>; walk?: boolean };

interface Live {
  piece: SpritePiece;
  /** Where it is drawn now. */
  x: number;
  y: number;
  flip: boolean;
  /** Which way it faces when the queued motion ends (a turn is queued whenever the next stretch needs the other way). */
  endFlip: boolean;
  /** Where it will be when the queued motion ends (a new move starts from there). */
  endX: number;
  endY: number;
  queue: Seg[];
  seg: Seg | null;
  segStart: number;
  /** The state between segments. */
  rest: 'stand' | 'corpse';
  hitStart: number;
  attackKey: number | null;
}

const clipMs = (set: SpriteSet, clip: string) => ((set.frames[clip] ?? 1) / set.fps / (set.spec.speed[clip] ?? 1)) * 1000;

class Stage {
  private ctx: CanvasRenderingContext2D | null;
  private live = new Map<string, Live>();
  private sets = new Map<string, SpriteSet>();
  private pieces: SpritePiece[] = [];
  private frame = 0;
  private disposed = false;
  /** Canvas pixels per layout pixel: the board is scaled on the screen, and screens are denser than 1:1. */
  private res = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  update(pieces: SpritePiece[]) {
    this.pieces = pieces;
    // A different set of units on the board (a new battle): the decoded sheets of units that are gone are let go, tens of megabytes each.
    const ids = new Set(pieces.map((p) => p.defId));
    if (ids.size && [...this.sets.keys()].some((id) => !ids.has(id))) {
      releaseSpritesExcept(ids);
      for (const id of [...this.sets.keys()]) if (!ids.has(id)) this.sets.delete(id);
    }
    for (const p of pieces) {
      if (!this.sets.has(p.defId)) {
        this.sets.set(p.defId, null as never);
        loadSprites(p.defId).then(
          (set) => {
            this.sets.set(p.defId, set);
            this.apply(this.pieces);
            this.start();
          },
          () => this.sets.delete(p.defId),
        );
      }
    }
    this.apply(pieces);
    this.start();
  }

  private apply(pieces: SpritePiece[]) {
    const now = performance.now();
    const keys = new Set(pieces.map((p) => p.key));
    for (const k of this.live.keys()) if (!keys.has(k)) (this.live.delete(k), sfx.walking(k, false));
    for (const p of pieces) {
      const set = this.sets.get(p.defId);
      if (!set) continue;
      let l = this.live.get(p.key);
      if (!l) {
        // A unit that appears with an attack to play (the arena is rebuilt for the last blow of a battle) plays it: the blow must not be skipped.
        l = { piece: p, x: p.x, y: p.y, flip: p.flip, endFlip: p.flip, endX: p.x, endY: p.y, queue: [], seg: null, segStart: now, rest: p.dead ? 'corpse' : 'stand', hitStart: -1e9, attackKey: null };
        this.live.set(p.key, l);
        if (!p.attack) continue;
      }
      const was = l.piece;
      l.piece = p;
      // Dying and standing up again.
      if (!was.dead && p.dead) l.queue.push({ kind: 'clip', clip: 'smierc', reverse: false, ms: clipMs(set, 'smierc'), then: 'corpse' });
      if (was.dead && !p.dead) {
        l.rest = 'stand';
        l.queue.push({ kind: 'clip', clip: 'smierc', reverse: true, ms: clipMs(set, 'smierc'), then: 'stand' });
      }
      // A move: take off where it stood, glide, land. A corpse never moves.
      if (p.snap) {
        l.queue = [];
        l.seg = null;
        l.x = l.endX = p.x;
        l.y = l.endY = p.y;
        l.flip = l.endFlip = p.flip;
      } else if (!p.dead && Math.hypot(p.x - l.endX, p.y - l.endY) > 4) {
        const from = { x: l.endX, y: l.endY };
        const to = { x: p.x, y: p.y };
        const flies = Boolean(set.frames.wzbicie && set.frames.lot);
        const stops = !flies && p.path && p.path.length >= 2 ? [from, ...p.path.slice(1, -1), to] : undefined;
        const length = stops ? stops.slice(1).reduce((m, q, i) => m + Math.hypot(q.x - stops[i].x, q.y - stops[i].y), 0) : Math.hypot(to.x - from.x, to.y - from.y);
        const ms = Math.max(MIN_GLIDE_MS, (length / (flies ? FLY_SPEED : WALK_SPEED)) * 1000);
        // A unit always faces the way it goes: it turns first (a flyer too: it used to take off facing the enemy and fly backwards).
        if (Math.abs(to.x - from.x) > 4) this.faceTo(l, to.x < from.x);
        if (flies) l.queue.push({ kind: 'clip', clip: 'wzbicie', reverse: false, ms: clipMs(set, 'wzbicie') });
        l.queue.push({ kind: 'glide', from, to, ms, path: stops, walk: !flies });
        if (flies) l.queue.push({ kind: 'clip', clip: 'wzbicie', reverse: true, ms: clipMs(set, 'wzbicie') });
        l.endX = p.x;
        l.endY = p.y;
      } else if (!l.queue.length && !l.seg) {
        l.x = p.x;
        l.y = p.y;
        l.endX = p.x;
        l.endY = p.y;
      }
      if (p.attack && p.attack.key !== l.attackKey) {
        l.attackKey = p.attack.key;
        // Move, then turn to the target, then strike.
        this.faceTo(l, p.attack.towardX < l.endX);
        const clip = p.attack.melee && set.frames.atak_wrecz ? 'atak_wrecz' : 'atak';
        if (set.frames[clip]) l.queue.push({ kind: 'clip', clip, reverse: false, ms: clipMs(set, clip), impact: { unit: p.key, done: false } });
        else window.setTimeout(() => emitImpact(p.key), 0); // no clip: the blow lands at once
      }
      if (p.hit && !was.hit) {
        // A hit clip (when the unit has one) plays after what is running; otherwise a shake and a flash in code.
        if (set.frames.trafienie && !p.dead) l.queue.push({ kind: 'clip', clip: 'trafienie', reverse: false, ms: clipMs(set, 'trafienie') });
        else l.hitStart = now;
      }
    }
  }

  /** Queues a turn when the unit does not already face that way once the queued motion ends. */
  private faceTo(l: Live, flip: boolean) {
    if (l.endFlip === flip) return;
    l.queue.push({ kind: 'turn', to: flip, ms: TURN_MS });
    l.endFlip = flip;
  }

  private start() {
    if (this.frame || this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.frame = 0;
    if (this.disposed) return;
    this.draw(now);
    // Keep drawing while anything moves; a still board needs no frames.
    const busy = [...this.live.values()].some((l) => l.seg || l.queue.length || now - l.hitStart < HIT_MS);
    if (busy) this.frame = requestAnimationFrame(this.tick);
  };

  private advance(l: Live, now: number) {
    for (;;) {
      if (!l.seg) {
        const next = l.queue.shift();
        if (!next) return;
        l.seg = next;
        l.segStart = now;
        if (next.kind === 'glide' && next.walk) sfx.walking(l.piece.key, true);
      }
      const seg = l.seg;
      if (seg.kind === 'clip' && seg.impact && !seg.impact.done && now - l.segStart >= seg.ms * IMPACT_AT) {
        seg.impact.done = true;
        emitImpact(seg.impact.unit);
      }
      if (now - l.segStart < seg.ms) return;
      // Segment done.
      if (seg.kind === 'glide') {
        l.x = seg.to.x;
        l.y = seg.to.y;
        if (seg.walk) sfx.walking(l.piece.key, false);
      } else if (seg.kind === 'turn') l.flip = seg.to;
      else if (seg.then) l.rest = seg.then;
      l.segStart += seg.ms;
      l.seg = null;
    }
  }

  private draw(now: number) {
    const { ctx, canvas } = this;
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(this.res, 0, 0, this.res, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const lives = [...this.live.values()];
    for (const l of lives) this.advance(l, now);
    // Corpses lie under the living; the rest are drawn from the back (top of the board) to the front.
    lives.sort((a, b) => Number(isCorpse(b)) - Number(isCorpse(a)) || a.y - b.y);
    for (const l of lives) {
      const set = this.sets.get(l.piece.defId);
      if (set) this.drawUnit(ctx, l, set, now);
    }
  }

  private drawUnit(ctx: CanvasRenderingContext2D, l: Live, set: SpriteSet, now: number) {
    const { frameW, frameH, cols } = set;
    let x = l.x;
    const y = l.y;
    let img: CanvasImageSource = l.rest === 'corpse' ? set.martwy : set.stoi;
    let sx = 0;
    let sy = 0;
    let sw = (img as HTMLImageElement).width;
    let sh = (img as HTMLImageElement).height;
    /** The next frame of the clip and how far the clock is between the two: both are drawn, the second one faded in, so the motion
     *  is smooth at any screen rate (the clips have 12 frames a second, a screen 60 or more). */
    let blend: { sx: number; sy: number; alpha: number } | null = null;
    const seg = l.seg;
    /** Horizontal scale of a turn in progress: 1 → 0 → -1 (relative to the way it faced before). */
    let turn = 1;
    let turnLift = 0;
    let turnLean = 0;
    if (seg) {
      const t = Math.min(1, (now - l.segStart) / seg.ms);
      if (seg.kind === 'glide') {
        // A flyer eases in and out; a walker goes at a steady pace along its way, turned the way it goes.
        const at = seg.walk ? t : easeInOut(t);
        const pts = seg.path ?? [seg.from, seg.to];
        const lens = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y));
        let d = at * lens.reduce((m, v) => m + v, 0);
        let leg = 0;
        while (leg < lens.length - 1 && d > lens[leg]) d -= lens[leg++];
        const f = lens[leg] > 0 ? Math.min(1, d / lens[leg]) : 1;
        x = pts[leg].x + (pts[leg + 1].x - pts[leg].x) * f;
        l.x = x;
        l.y = pts[leg].y + (pts[leg + 1].y - pts[leg].y) * f;
        const dx = pts[leg + 1].x - pts[leg].x;
        if (seg.walk && Math.abs(dx) > 1) {
          l.flip = dx < 0;
          l.endFlip = l.flip;
        }
      }
      if (seg.kind === 'turn') {
        // No turn clip yet: the picture never thins to a sheet of paper. It narrows only to about half, hops a little and leans
        // into the turn, and the mirror image takes over at the middle, where the hop hides the switch.
        const c = Math.cos(Math.PI * easeInOut(t));
        const swing = Math.sin(Math.PI * t);
        turn = Math.sign(c || 1) * (0.5 + 0.5 * Math.abs(c));
        turnLift = swing * 7;
        turnLean = (t < 0.5 ? 1 : -1) * swing * 0.1 * (l.flip ? -1 : 1);
      }
      const clip = seg.kind === 'glide' ? set.moveClip ?? '' : seg.kind === 'turn' ? '' : seg.clip;
      const n = set.frames[clip];
      const sheet = set.sheets[clip];
      if (n && sheet) {
        // Glide: the loop repeats for as long as it moves (its phase follows the clock, so a walk path does not restart the stride
        // at every turn); a clip plays once (a reversed one backwards).
        const looped = seg.kind === 'glide';
        const pos = looped ? ((now / 1000) * set.fps * (set.spec.speed[clip] ?? 1)) % n : Math.min(n - 1, t * (n - 1));
        const frame = Math.floor(pos);
        const fade = pos - frame;
        const at = (f: number) => (seg.kind === 'clip' && seg.reverse ? n - 1 - f : f);
        const next = looped ? (frame + 1) % n : Math.min(n - 1, frame + 1);
        const idx = at(frame);
        img = sheet;
        sx = (idx % cols) * frameW;
        sy = Math.floor(idx / cols) * frameH;
        sw = frameW;
        sh = frameH;
        if (fade > 0.02 && next !== frame) blend = { sx: (at(next) % cols) * frameW, sy: Math.floor(at(next) / cols) * frameH, alpha: fade };
      }
    }
    const dw = set.width;
    const dh = (dw * frameH) / frameW;
    const bodyPx = dw * set.body;
    const gy = l.seg?.kind === 'glide' ? l.y : y;
    // Ring for the picked unit (no shadow: the pictures already stand on the ground).
    ctx.save();
    if (l.piece.ring && !l.piece.dead) {
      ctx.strokeStyle = l.piece.ring;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(x, gy + 2, bodyPx * 0.44, bodyPx * 0.13, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Hit: shake and flash.
    const since = now - l.hitStart;
    if (since < HIT_MS) {
      x += Math.sin(since / 22) * 4 * (1 - since / HIT_MS);
      ctx.filter = `brightness(${1 + 1.2 * (1 - since / HIT_MS)})`;
    }
    // The fallen unit is drawn smaller and lower than the standing one (set.corpse); the death clip eases into that pose, standing up eases out of it.
    let lie = l.rest === 'corpse' && !seg ? 1 : 0;
    if (seg?.kind === 'clip' && seg.clip === 'smierc') lie = seg.reverse ? 1 - Math.min(1, (now - l.segStart) / seg.ms) : Math.min(1, (now - l.segStart) / seg.ms);
    const k = 1 + (set.corpse.scale - 1) * lie;
    ctx.translate(x, gy - turnLift);
    ctx.rotate(turnLean);
    ctx.scale((l.flip ? -1 : 1) * turn * k, k * (set.spec.stretchY ?? 1));
    ctx.translate(0, (set.corpse.dy * lie) / k);
    ctx.drawImage(img, sx, sy, sw, sh, -set.cx * dw, -set.feet * dh, dw, dh);
    if (blend) {
      ctx.globalAlpha = blend.alpha;
      ctx.drawImage(img, blend.sx, blend.sy, sw, sh, -set.cx * dw, -set.feet * dh, dw, dh);
    }
    ctx.restore();
  }

  /** The canvas covers w × h layout pixels, drawn with `res` canvas pixels each (the bitmap is that much sharper). */
  resize(w: number, h: number, res: number) {
    this.res = res;
    this.canvas.width = Math.round(w * res);
    this.canvas.height = Math.round(h * res);
    this.start();
  }

  dispose() {
    this.disposed = true;
    for (const k of this.live.keys()) sfx.walking(k, false);
    cancelAnimationFrame(this.frame);
  }
}

const isCorpse = (l: Live) => l.rest === 'corpse' && !l.seg;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Sprites for `pieces` on a transparent canvas the size of the board (it lets clicks through). */
/** Biggest bitmap side (canvas pixels): a huge board on a dense screen must not eat the memory. */
const MAX_SIDE = 4096;

export function SpriteLayer({ width, height, pieces, scale = 1, style }: { width: number; height: number; pieces: SpritePiece[]; /** How much the board is scaled on the screen. */ scale?: number; style?: React.CSSProperties }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage | null>(null);
  const latest = useRef(pieces);
  latest.current = pieces;

  useEffect(() => {
    if (!canvas.current) return;
    const s = new Stage(canvas.current);
    stage.current = s;
    s.update(latest.current);
    return () => {
      s.dispose();
      stage.current = null;
    };
  }, []);
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const res = Math.max(1, Math.min(3, scale * dpr, MAX_SIDE / width, MAX_SIDE / height));
  useEffect(() => stage.current?.resize(width, height, res), [width, height, res]);
  useEffect(() => stage.current?.update(pieces), [pieces]);

  return <canvas ref={canvas} width={Math.round(width * res)} height={Math.round(height * res)} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, width, height, pointerEvents: 'none', ...style }} />;
}

export const spriteIds = Object.keys(SPRITES);
