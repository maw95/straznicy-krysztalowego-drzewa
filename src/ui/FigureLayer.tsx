// 3D figures standing on the flat board (the map and the arena), as in Heroes III: the board stays 2D,
// the figures are drawn by three.js on one transparent canvas over it, seen by a camera tilted forward.
// The layer follows the positions the screen gives (screen pixels of each figure's base): a figure glides
// there, turning to face the way it goes; it faces its target and lunges when it attacks, shakes when hit,
// and a thin outline round its base marks the active unit. Clicks go to the board below.

import { useEffect, useRef } from 'react';
import type { Group, Mesh, Object3D, OrthographicCamera, Scene, WebGLRenderer } from 'three';
import { hasFigure, lightRoom, loadFigure, threeLib } from './figures';

export interface Piece {
  key: string;
  unitId: string;
  /** Screen position of the middle of the base (pixels in the layer). */
  x: number;
  y: number;
  /** Base diameter in pixels. */
  size: number;
  /** How long the glide to a new position takes (ms). */
  moveMs?: number;
  /** A thin outline round the base (CSS colour), or none. */
  ring?: string | null;
  /** Lunging at this screen point (an attack); the figure turns to it first. A new `key` is a new lunge. */
  lungeAt?: { x: number; y: number; key?: number } | null;
  /** Just hit: a short shake. */
  hit?: boolean;
  /** Turns to face this screen point (a shot); stays facing it. */
  lookAt?: { x: number; y: number } | null;
  /** Screen direction the figure faces while it has not moved yet (default: towards the viewer). */
  face?: { x: number; y: number };
}

/** The camera's elevation above the board (degrees): higher shows more of the top, lower more of the front. */
const TILT = 35;
const SIN = Math.sin((TILT * Math.PI) / 180);
const TURN_MS = 160;
const LUNGE_MS = 420;
const SHAKE_MS = 300;

interface Live {
  piece: Piece;
  node: Group;
  figure: Object3D | null;
  ring: Mesh | null;
  from: { x: number; y: number };
  to: { x: number; y: number };
  moveStart: number;
  moveMs: number;
  angle: number;
  angleFrom: number;
  angleTo: number;
  turnStart: number;
  lungeStart: number;
  shakeStart: number;
}

/** Facing (rotation about the vertical axis) towards a screen direction: +Z (towards the viewer) is 0. */
const angleOf = (dx: number, dy: number) => Math.atan2(dx, dy / SIN);
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

class Stage {
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: OrthographicCamera | null = null;
  private live = new Map<string, Live>();
  private frame = 0;
  private three: typeof import('three') | null = null;
  disposed = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private width: number,
    private height: number,
  ) {}

  async init() {
    const { THREE } = await threeLib();
    if (this.disposed) return;
    this.three = THREE;
    const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer = renderer;
    const scene = new THREE.Scene();
    scene.environment = await lightRoom(renderer);
    scene.environmentIntensity = 0.3;
    scene.add(new THREE.HemisphereLight(0xfff4dd, 0x4a5a40, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-300, 800, 600);
    scene.add(sun);
    // A light from behind draws a bright edge round each figure, so dark ones show on the dark Horde arena too.
    const rim = new THREE.DirectionalLight(0xffe2b0, 1.8);
    rim.position.set(200, 500, -900);
    scene.add(rim);
    this.scene = scene;
    // An orthographic camera tilted by TILT: a point on the board at screen (x, y) is the world point
    // (x, 0, y / sin TILT), and the camera sits on the line through the origin, so screen and world agree.
    const camera = new THREE.OrthographicCamera(0, 1, 0, -1, 1, 40000);
    const r = (TILT * Math.PI) / 180;
    camera.position.set(0, Math.sin(r) * 20000, Math.cos(r) * 20000);
    camera.up.set(0, Math.cos(r), -Math.sin(r));
    camera.lookAt(0, 0, 0);
    this.camera = camera;
    this.resize(this.width, this.height);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    if (!this.renderer || !this.camera) return;
    this.renderer.setSize(width, height, false);
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = 0;
    this.camera.bottom = -height;
    this.camera.updateProjectionMatrix();
    this.kick();
  }

  update(pieces: Piece[]) {
    const THREE = this.three;
    if (!THREE || !this.scene) return;
    const now = performance.now();
    const seen = new Set<string>();
    // The views pass new pieces on every render (a hover is enough): draw only when something changed.
    let changed = false;
    for (const p of pieces) {
      seen.add(p.key);
      let l = this.live.get(p.key);
      if (!l) {
        changed = true;
        const node = new THREE.Group();
        this.scene.add(node);
        const facing = p.face ? angleOf(p.face.x, p.face.y) : 0;
        l = { piece: p, node, figure: null, ring: null, from: { x: p.x, y: p.y }, to: { x: p.x, y: p.y }, moveStart: 0, moveMs: 0, angle: facing, angleFrom: facing, angleTo: facing, turnStart: 0, lungeStart: 0, shakeStart: 0 };
        this.live.set(p.key, l);
        const entry = l;
        loadFigure(p.unitId)
          .then((figure) => {
            if (this.disposed || !this.live.has(p.key)) return;
            entry.figure = figure;
            node.add(figure);
            this.kick();
          })
          .catch(() => undefined);
      } else if (p.x !== l.to.x || p.y !== l.to.y) {
        changed = true;
        const at = this.position(l, now);
        l.from = at;
        l.to = { x: p.x, y: p.y };
        l.moveStart = now;
        l.moveMs = p.moveMs ?? 300;
        this.turnTo(l, angleOf(p.x - at.x, p.y - at.y), now);
      }
      if (p.lungeAt && (!l.piece.lungeAt || p.lungeAt.key !== l.piece.lungeAt.key)) {
        changed = true;
        l.lungeStart = now;
        this.turnTo(l, angleOf(p.lungeAt.x - p.x, p.lungeAt.y - p.y), now);
      }
      if (p.hit && !l.piece.hit) {
        changed = true;
        l.shakeStart = now;
      }
      if (p.lookAt && (p.lookAt.x !== l.piece.lookAt?.x || p.lookAt.y !== l.piece.lookAt?.y)) {
        changed = true;
        this.turnTo(l, angleOf(p.lookAt.x - p.x, p.lookAt.y - p.y), now);
      }
      if ((p.ring ?? null) !== (l.piece.ring ?? null) || p.size !== l.piece.size) changed = true;
      this.setRing(l, p.ring ?? null);
      l.piece = p;
    }
    for (const [key, l] of this.live) {
      if (seen.has(key)) continue;
      changed = true;
      this.setRing(l, null);
      this.scene.remove(l.node);
      this.live.delete(key);
    }
    if (changed) this.kick();
  }

  private turnTo(l: Live, angle: number, now: number) {
    l.angleFrom = l.angle;
    // The short way round.
    l.angleTo = l.angle + Math.atan2(Math.sin(angle - l.angle), Math.cos(angle - l.angle));
    l.turnStart = now;
  }

  private outline: import('three').RingGeometry | null = null;

  /** The outline every marked figure shares: a thin line just outside the base. */
  private outlineGeometry() {
    this.outline ??= new this.three!.RingGeometry(0.52, 0.57, 48);
    return this.outline;
  }

  private setRing(l: Live, color: string | null) {
    const THREE = this.three!;
    if (!color) {
      if (l.ring) {
        l.node.remove(l.ring);
        (l.ring.material as import('three').Material).dispose();
      }
      l.ring = null;
      return;
    }
    if (!l.ring) {
      l.ring = new THREE.Mesh(this.outlineGeometry(), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false }));
      l.ring.rotation.x = -Math.PI / 2;
      l.ring.position.y = 0.01;
      l.node.add(l.ring);
    }
    (l.ring.material as import('three').MeshBasicMaterial).color.set(color);
  }

  private position(l: Live, now: number) {
    const t = l.moveMs ? Math.min(1, (now - l.moveStart) / l.moveMs) : 1;
    return { x: l.from.x + (l.to.x - l.from.x) * t, y: l.from.y + (l.to.y - l.from.y) * t };
  }

  /** Draws the next frame, and keeps drawing while anything moves. */
  private kick() {
    if (!this.frame) this.frame = requestAnimationFrame(() => this.draw());
  }

  private draw() {
    this.frame = 0;
    if (!this.renderer || !this.scene || !this.camera || this.disposed) return;
    const now = performance.now();
    let busy = false;
    for (const l of this.live.values()) {
      const p = l.piece;
      const at = this.position(l, now);
      if (l.moveMs && now - l.moveStart < l.moveMs) busy = true;
      let { x, y } = at;
      const turn = Math.min(1, (now - l.turnStart) / TURN_MS);
      l.angle = l.angleFrom + (l.angleTo - l.angleFrom) * ease(turn);
      if (turn < 1) busy = true;
      const lunge = (now - l.lungeStart) / LUNGE_MS;
      if (p.lungeAt && lunge < 1) {
        const k = Math.sin(lunge * Math.PI) * 0.35;
        x += (p.lungeAt.x - x) * k;
        y += (p.lungeAt.y - y) * k;
        busy = true;
      }
      const shake = (now - l.shakeStart) / SHAKE_MS;
      if (shake < 1) {
        x += Math.sin(shake * Math.PI * 6) * 3 * (1 - shake);
        busy = true;
      }
      l.node.position.set(x, 0, y / SIN);
      l.node.rotation.y = l.angle;
      l.node.scale.setScalar(p.size);
    }
    this.renderer.render(this.scene, this.camera);
    if (busy) this.kick();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    for (const l of this.live.values()) this.setRing(l, null);
    this.outline?.dispose();
    // Each battle and each map view opens a new canvas: give the WebGL context back at once,
    // or long sessions run into the browser's limit of live contexts.
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
  }
}

/** The figures for `pieces`, on a transparent canvas the size of the board (it lets clicks through). */
export function FigureLayer({ width, height, pieces, style }: { width: number; height: number; pieces: Piece[]; style?: React.CSSProperties }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage | null>(null);
  const latest = useRef(pieces);
  latest.current = pieces;

  useEffect(() => {
    if (!canvas.current) return;
    const s = new Stage(canvas.current, width, height);
    stage.current = s;
    s.init().then(() => s.update(latest.current), () => undefined);
    return () => {
      s.dispose();
      stage.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => stage.current?.resize(width, height), [width, height]);
  useEffect(() => stage.current?.update(pieces), [pieces]);

  // A dark shadow under and a thin dark edge round every figure, so it stands out from the busy board art.
  return (
    <canvas
      ref={canvas}
      width={width}
      height={height}
      aria-hidden="true"
      style={{ position: 'absolute', left: 0, top: 0, width, height, pointerEvents: 'none', filter: 'drop-shadow(0 0 1px rgba(20,12,4,0.95)) drop-shadow(0 4px 4px rgba(0,0,0,0.65))', ...style }}
    />
  );
}

const SWITCH = 'skd-figures';

let switchedOn: boolean | null = null;

/** "Figurki 3D" in the options: on unless the player switched them off (slow computers keep the portraits).
 *  Read from storage once; the views ask for every unit on every render. */
export function figuresOn(): boolean {
  if (switchedOn === null) {
    try {
      switchedOn = localStorage.getItem(SWITCH) !== 'off';
    } catch {
      switchedOn = true;
    }
  }
  return switchedOn;
}

export function setFiguresOn(on: boolean) {
  switchedOn = on;
  try {
    if (on) localStorage.removeItem(SWITCH);
    else localStorage.setItem(SWITCH, 'off');
  } catch {
    // No storage: the choice lasts until the page is closed.
  }
}

/** Whether a unit is drawn as a 3D figure (it has a model, they are switched on, and the browser can draw them). */
export function figureFor(unitId: string): boolean {
  return hasFigure(unitId) && figuresOn() && webgl();
}

let webglOk: boolean | null = null;
function webgl(): boolean {
  if (webglOk === null) {
    try {
      webglOk = typeof document !== 'undefined' && Boolean(document.createElement('canvas').getContext('webgl2'));
    } catch {
      webglOk = false;
    }
  }
  return webglOk;
}
