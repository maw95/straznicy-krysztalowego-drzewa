// A unit's animated sprite in a small canvas (the same sheets as the arena): about three seconds of its walk (or flight) loop, a moment of standing, a blow and
// a moment of recovery (a flyer: takeoff, flight, landing, the blow), over and over (the melee and the ranged blow one after the other when the unit has both); a unit with no
// loop stands still between the blows. With `zoom` the unit is drawn at its size on the arena times that factor (a dragon is bigger than a druid, as in
// a battle); without it the frame is fitted into the canvas by its width.
// Used where a unit is shown outside a battle (the barracks screen).

import { useEffect, useRef, useState } from 'react';
import { loadSprites, type SpriteSet } from './sprites';

/** About how long the unit moves before each blow (the walk cycle is repeated a whole number of times, so the loop never jumps). */
const MOVE_SECS = 3;
/** A breath of standing before the blow (the wind-up) and after it (the recovery), in seconds. */
const WIND_UP = 0.3;
const RECOVER = 0.5;

export function UnitSprite({ unitId, size = 220, height = size, zoom }: { unitId: string; size?: number; height?: number; zoom?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [set, setSet] = useState<SpriteSet | null>(null);
  /** The walk and the blows are in: before that the unit stands (its standing picture is there as soon as the set is). */
  const [clips, setClips] = useState(false);
  useEffect(() => {
    let live = true;
    setSet(null);
    setClips(false);
    // The previous unit's last frame must not stay on the canvas while the next one loads.
    ref.current?.getContext('2d')?.clearRect(0, 0, ref.current.width, ref.current.height);
    void loadSprites(unitId).then((s) => {
      if (!live) return;
      setSet(s);
      // Only the clips this screen plays, all at once (the rest of the sheets keep arriving behind them).
      void s.ensure(['atak', 'atak_wrecz', 'lot', 'chod', 'wzbicie']).then(() => live && setClips(true));
    }, () => undefined);
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
    // One round of the loop: the walk (a whole number of cycles that comes closest to MOVE_SECS), a breath of standing, the blow, a breath of recovery;
    // the next round brings the other blow. A unit without a walk stands still for that time.
    const cycle = move ? clipSecs(move) : 0;
    const walkSecs = cycle ? Math.max(1, Math.round(MOVE_SECS / cycle)) * cycle : MOVE_SECS;
    // A flyer takes off before the flight and lands after it (the takeoff clip played forwards and then backwards, as in the arena), then stands, strikes and recovers.
    const flies = Boolean(move === 'lot' && set.frames.wzbicie && set.sheets.wzbicie);
    type Part = { clip: string | null; secs: number; reverse?: boolean };
    const roundOf = (blow: string | null): Part[] => [
      ...(flies ? [{ clip: 'wzbicie', secs: clipSecs('wzbicie') }] : []),
      { clip: move, secs: walkSecs },
      ...(flies ? [{ clip: 'wzbicie', secs: clipSecs('wzbicie'), reverse: true }] : []),
      ...(blow ? [{ clip: null, secs: WIND_UP }, { clip: blow, secs: clipSecs(blow) }, { clip: null, secs: RECOVER }] : []),
    ];
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      g.clearRect(0, 0, size, height);
      const t = (now - t0) / 1000;
      const lenOf = (blow: string | null) => roundOf(blow).reduce((sum, x) => sum + x.secs, 0);
      // Which round it is depends on the blows' lengths, so walk through them.
      let rest = t;
      let round = 0;
      for (;;) {
        const len = lenOf(blows.length ? blows[round % blows.length] : null);
        if (rest < len) break;
        rest -= len;
        round++;
      }
      const blow = blows.length ? blows[round % blows.length] : null;
      let clip: string | null = null;
      let at = 0;
      let backwards = false;
      for (const part of roundOf(blow)) {
        if (rest < part.secs) { clip = part.clip; at = rest; backwards = Boolean(part.reverse); break; }
        rest -= part.secs;
      }
      const sheet = clip ? set.sheets[clip] : undefined;
      if (clip && sheet) {
        const n = set.frames[clip];
        const f = Math.min(n - 1, Math.floor(at * set.fps * (set.spec.speed[clip] ?? 1)) % Math.max(n, 1));
        const i = backwards ? n - 1 - f : f;
        g.drawImage(sheet, (i % set.cols) * set.frameW, Math.floor(i / set.cols) * set.frameH, set.frameW, set.frameH, (size - dw) / 2, dy, dw, dh);
      } else g.drawImage(set.stoi, (size - dw) / 2, dy, dw, dh);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [set, clips, size, height, zoom]);
  return <canvas ref={ref} width={size} height={height} data-unit-sprite={unitId} style={{ display: 'block', width: size, height, filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.6))' }} />;
}
