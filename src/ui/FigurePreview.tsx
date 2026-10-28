// One unit's 3D figure turning slowly on its own canvas: next to the hero card in the setup screen,
// and in the gallery (?figury). Nothing is drawn for units without a model (or without WebGL).

import { useEffect, useRef, useState } from 'react';
import type { Camera, Object3D, Scene, WebGLRenderer } from 'three';
import { figureHeight, hasFigure, lightRoom, loadFigure, threeLib } from './figures';

/** The scene every preview uses: warm light from above and the front, the camera a little above the figure. */
async function stage(figure: Object3D, height: number, renderer: WebGLRenderer): Promise<{ scene: Scene; camera: Camera }> {
  const { THREE } = await threeLib();
  // The figure is 1 base wide and `height` tall: frame whichever is bigger.
  const span = Math.max(1.1, height);
  const scene = new THREE.Scene();
  scene.environment = await lightRoom(renderer);
  scene.environmentIntensity = 0.3;
  scene.add(new THREE.HemisphereLight(0xfff4dd, 0x30402a, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(2, 4, 3);
  scene.add(sun);
  scene.add(figure);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, span * 0.75, span * 2.4);
  camera.lookAt(0, span * 0.45, 0);
  return { scene, camera };
}

let stills: Promise<WebGLRenderer> | null = null;

/** A still picture of a figure turned by `turn` (one shared renderer, however many pictures). */
export async function figureStill(unitId: string, turn: number, size: number): Promise<string> {
  const { THREE } = await threeLib();
  stills ??= Promise.resolve(new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }));
  const renderer = await stills;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setSize(size, size, false);
  const figure = await loadFigure(unitId);
  figure.rotation.y = turn;
  const { scene, camera } = await stage(figure, figureHeight(unitId), renderer);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL();
}

export function FigureStill({ unitId, size, turn }: { unitId: string; size: number; turn: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    figureStill(unitId, turn, size).then((s) => live && setSrc(s), () => undefined);
    return () => {
      live = false;
    };
  }, [unitId, size, turn]);
  return src ? <img src={src} alt="" width={size} height={size} /> : <div style={{ width: size, height: size }} />;
}

export function FigurePreview({ unitId, size = 260, spin = true, turn = 0 }: { unitId: string; size?: number; spin?: boolean; turn?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // One renderer for the canvas while it is on screen; hovering other heroes only swaps the figure.
  const renderer = useRef<WebGLRenderer | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => {
    renderer.current?.dispose();
    renderer.current = null;
  }, []);

  useEffect(() => {
    setFailed(false);
    if (!hasFigure(unitId) || !canvas.current) return;
    let stop = false;
    let frame = 0;
    (async () => {
      const { THREE } = await threeLib();
      const figure = await loadFigure(unitId);
      if (stop || !canvas.current) return;
      if (renderer.current?.domElement !== canvas.current) {
        renderer.current?.dispose();
        renderer.current = new THREE.WebGLRenderer({ canvas: canvas.current, alpha: true, antialias: true });
      }
      const r = renderer.current;
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      r.setSize(size, size, false);
      r.toneMapping = THREE.ACESFilmicToneMapping;
      const { scene, camera } = await stage(figure, figureHeight(unitId), r);
      // Another hero may have been picked while the scene was being set up: that one draws, not this.
      if (stop) return;
      figure.rotation.y = turn;
      const start = performance.now();
      const draw = () => {
        if (stop) return;
        if (spin) figure.rotation.y = turn + ((performance.now() - start) / 1000) * 0.6;
        r.render(scene, camera);
        if (spin) frame = requestAnimationFrame(draw);
      };
      draw();
    })().catch(() => !stop && setFailed(true));
    return () => {
      stop = true;
      cancelAnimationFrame(frame);
    };
  }, [unitId, size, spin, turn]);

  if (!hasFigure(unitId) || failed) return null;
  return <canvas ref={canvas} width={size} height={size} style={{ width: size, height: size, display: 'block' }} aria-label="Figurka 3D" />;
}
