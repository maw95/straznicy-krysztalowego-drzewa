// A unit's animated sprite in a small canvas (the same sheets as the arena): its walk (or flight) loop, or its still when it has no loop.
// Used where a unit is shown outside a battle (the barracks screen).

import { useEffect, useRef, useState } from 'react';
import { loadSprites, type SpriteSet } from './sprites';

export function UnitSprite({ unitId, size = 220 }: { unitId: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [set, setSet] = useState<SpriteSet | null>(null);
  useEffect(() => {
    let live = true;
    setSet(null);
    void loadSprites(unitId).then((s) => void s.ready.then(() => live && setSet(s)), () => undefined);
    return () => { live = false; };
  }, [unitId]);
  useEffect(() => {
    const g = ref.current?.getContext('2d');
    if (!g || !set) return;
    const clip = set.moveClip ?? Object.keys(set.frames)[0];
    const n = clip ? set.frames[clip] : 0;
    // The frame is fitted into the canvas by its width; the unit stands on the feet line.
    const k = size / set.frameW;
    const dw = set.frameW * k;
    const dh = set.frameH * k;
    const dy = Math.round(size * 0.9 - set.feet * dh);
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      g.clearRect(0, 0, size, size);
      const sheet = clip ? set.sheets[clip] : undefined;
      if (sheet && n) {
        const i = Math.floor(((now - t0) / 1000) * set.fps * (set.spec.speed[clip!] ?? 1)) % n;
        g.drawImage(sheet, (i % set.cols) * set.frameW, Math.floor(i / set.cols) * set.frameH, set.frameW, set.frameH, (size - dw) / 2, dy, dw, dh);
      } else g.drawImage(set.stoi, (size - dw) / 2, dy, dw, dh);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [set, size]);
  return <canvas ref={ref} width={size} height={size} data-unit-sprite={unitId} style={{ display: 'block', width: size, height: size, filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.6))' }} />;
}
