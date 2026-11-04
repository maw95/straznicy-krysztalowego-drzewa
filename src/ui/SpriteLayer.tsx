// 2D unit sprites standing on the arena (the digital edition). One transparent canvas over the board; every unit is a small
// state machine: it stands (a still image), takes off, flies (the loop repeats over the distance), lands (the take-off played
// backwards), attacks, dies (the last frame stays as the corpse) and stands up again (the death played backwards).
// A hit is a shake and a flash in code. Clicks go to the board below.

import { useEffect, useRef } from 'react';
import { loadSprites, SPRITES, type SpriteSet } from './sprites';

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
  attack?: { key: number; towardX: number } | null;
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

/** One stretch of a unit's motion; they run one after another. */
type Seg =
  | { kind: 'clip'; clip: string; reverse: boolean; ms: number; then?: 'corpse' | 'stand' }
  | { kind: 'glide'; from: { x: number; y: number }; to: { x: number; y: number }; ms: number; /** Stops of a walker's way (from first to last), when it is not a straight line. */ path?: Array<{ x: number; y: number }>; walk?: boolean };

interface Live {
  piece: SpritePiece;
  /** Where it is drawn now. */
  x: number;
  y: number;
  flip: boolean;
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

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  update(pieces: SpritePiece[]) {
    this.pieces = pieces;
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
    for (const k of this.live.keys()) if (!keys.has(k)) this.live.delete(k);
    for (const p of pieces) {
      const set = this.sets.get(p.defId);
      if (!set) continue;
      let l = this.live.get(p.key);
      if (!l) {
        l = { piece: p, x: p.x, y: p.y, flip: p.flip, endX: p.x, endY: p.y, queue: [], seg: null, segStart: now, rest: p.dead ? 'corpse' : 'stand', hitStart: -1e9, attackKey: p.attack?.key ?? null };
        this.live.set(p.key, l);
        continue;
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
        l.flip = p.flip;
      } else if (!p.dead && Math.hypot(p.x - l.endX, p.y - l.endY) > 4) {
        const from = { x: l.endX, y: l.endY };
        const to = { x: p.x, y: p.y };
        const flies = Boolean(set.frames.wzbicie && set.frames.lot);
        const stops = !flies && p.path && p.path.length >= 2 ? [from, ...p.path.slice(1, -1), to] : undefined;
        const length = stops ? stops.slice(1).reduce((m, q, i) => m + Math.hypot(q.x - stops[i].x, q.y - stops[i].y), 0) : Math.hypot(to.x - from.x, to.y - from.y);
        const ms = Math.max(MIN_GLIDE_MS, (length / (flies ? FLY_SPEED : WALK_SPEED)) * 1000);
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
      if (p.attack && p.attack.key !== l.attackKey && set.frames.atak) {
        l.attackKey = p.attack.key;
        l.queue.push({ kind: 'clip', clip: 'atak', reverse: false, ms: clipMs(set, 'atak') });
      }
      if (p.hit && !was.hit) {
        // A hit clip (when the unit has one) plays after what is running; otherwise a shake and a flash in code.
        if (set.frames.trafienie && !p.dead) l.queue.push({ kind: 'clip', clip: 'trafienie', reverse: false, ms: clipMs(set, 'trafienie') });
        else l.hitStart = now;
      }
      if (!l.queue.length && !l.seg) l.flip = p.flip;
    }
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
        if (next.kind === 'clip' && next.clip === 'wzbicie' && !next.reverse) l.flip = l.piece.flip;
        if (next.kind === 'clip' && next.clip === 'atak' && l.piece.attack) l.flip = l.piece.attack.towardX < l.x;
      }
      const seg = l.seg;
      if (now - l.segStart < seg.ms) return;
      // Segment done.
      if (seg.kind === 'glide') {
        l.x = seg.to.x;
        l.y = seg.to.y;
      } else if (seg.then) l.rest = seg.then;
      if (seg.kind === 'clip' && seg.clip === 'atak') l.flip = l.piece.flip;
      l.segStart += seg.ms;
      l.seg = null;
    }
  }

  private draw(now: number) {
    const { ctx, canvas } = this;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    let img: HTMLImageElement = l.rest === 'corpse' ? set.martwy : set.stoi;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;
    const seg = l.seg;
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
        if (seg.walk && Math.abs(dx) > 1) l.flip = dx < 0;
      }
      const clip = seg.kind === 'glide' ? set.moveClip ?? '' : seg.clip;
      const n = set.frames[clip];
      if (n) {
        // Glide: the loop repeats for as long as it moves (its phase follows the clock, so a walk path does not restart the stride
        // at every turn); a clip plays once (a reversed one backwards).
        const frame = seg.kind === 'glide' ? Math.floor((now / 1000) * set.fps * (set.spec.speed[clip] ?? 1)) % n : Math.min(n - 1, Math.floor(t * n));
        const idx = seg.kind === 'clip' && seg.reverse ? n - 1 - frame : frame;
        img = set.sheets[clip];
        sx = (idx % cols) * frameW;
        sy = Math.floor(idx / cols) * frameH;
        sw = frameW;
        sh = frameH;
      }
    }
    const dw = set.width;
    const dh = (dw * frameH) / frameW;
    const bodyPx = dw * set.body;
    const gy = l.seg?.kind === 'glide' ? l.y : y;
    // Shadow on the ground, ring for the active unit.
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.ellipse(x, gy + 2, bodyPx * 0.36, bodyPx * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.translate(x, 0);
    if (l.flip) ctx.scale(-1, 1);
    ctx.drawImage(img, sx, sy, sw, sh, -set.cx * dw, gy - set.feet * dh, dw, dh);
    ctx.restore();
  }

  resize(w: number, h: number) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.start();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
  }
}

const isCorpse = (l: Live) => l.rest === 'corpse' && !l.seg;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Sprites for `pieces` on a transparent canvas the size of the board (it lets clicks through). */
export function SpriteLayer({ width, height, pieces, style }: { width: number; height: number; pieces: SpritePiece[]; style?: React.CSSProperties }) {
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
  useEffect(() => stage.current?.resize(width, height), [width, height]);
  useEffect(() => stage.current?.update(pieces), [pieces]);

  return <canvas ref={canvas} width={width} height={height} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, width, height, pointerEvents: 'none', ...style }} />;
}

export const spriteIds = Object.keys(SPRITES);
