// A unit's animated sprite in a small canvas (the same sheets as the arena): its walk (or flight) loop, then a blow, over and over; a unit with no
// loop stands still between the blows. With `zoom` the unit is drawn at its size on the arena times that factor (a dragon is bigger than a druid, as in
// a battle); without it the frame is fitted into the canvas by its width.
// Used where a unit is shown outside a battle (the barracks screen).

import { useEffect, useRef, useState } from 'react';
import { loadSprites, type SpriteSet } from './sprites';

/** How many walk cycles are played before each blow. */
const WALKS = 2;

export function UnitSprite({ unitId, size = 220, height = size, zoom }: { unitId: string; size?: number; height?: number; zoom?: number }) {
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
    const move = set.moveClip && set.frames[set.moveClip] ? set.moveClip : null;
    // The blows: the melee and the ranged one, one after the other when the unit has both.
    const blows = ['atak', 'atak_wrecz'].filter((c) => set.frames[c] && set.sheets[c]);
    const clipSecs = (c: string) => set.frames[c] / (set.fps * (set.spec.speed[c] ?? 1));
    const k = zoom ? (set.width * zoom) / set.frameW : size / set.frameW;
    const dw = set.frameW * k;
    const dh = set.frameH * k;
    const dy = Math.round(height * 0.9 - set.feet * dh);
    // One round of the loop: the walk WALKS times, a blow, the next round the other blow.
    const walkSecs = move ? clipSecs(move) * WALKS : 1.2;
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      g.clearRect(0, 0, size, height);
      const t = (now - t0) / 1000;
      // Which round it is depends on the blows' lengths, so walk through them.
      let rest = t;
      let round = 0;
      for (;;) {
        const blow = blows.length ? blows[round % blows.length] : null;
        const len = walkSecs + (blow ? clipSecs(blow) : 0);
        if (rest < len) break;
        rest -= len;
        round++;
      }
      const blow = blows.length ? blows[round % blows.length] : null;
      let clip: string | null = null;
      let at = 0;
      if (rest < walkSecs) { clip = move; at = rest; } else { clip = blow; at = rest - walkSecs; }
      const sheet = clip ? set.sheets[clip] : undefined;
      if (clip && sheet) {
        const n = set.frames[clip];
        const i = Math.min(n - 1, Math.floor(at * set.fps * (set.spec.speed[clip] ?? 1)) % Math.max(n, 1));
        g.drawImage(sheet, (i % set.cols) * set.frameW, Math.floor(i / set.cols) * set.frameH, set.frameW, set.frameH, (size - dw) / 2, dy, dw, dh);
      } else g.drawImage(set.stoi, (size - dw) / 2, dy, dw, dh);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [set, size, height, zoom]);
  return <canvas ref={ref} width={size} height={height} data-unit-sprite={unitId} style={{ display: 'block', width: size, height, filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.6))' }} />;
}
