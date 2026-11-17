// ?sprity: every 2D unit sprite with all its clips looping side by side, drawn at the size and speed it has on the arena
// (`SPRITES` in sprites.ts), with the frame and the feet line marked, to judge the clips without playing a battle.
// ?sprity=troll,feniks shows only the units whose id or folder contains one of the words.

import { useEffect, useRef, useState } from 'react';
import { UNITS } from '../engine/data';
import { SPRITES, loadSprites, type SpriteSet } from './sprites';

/** One clip (or a still) in a canvas: the frame outline, the feet line, the picture cut from its sheet. */
function ClipView({ set, clip, slow }: { set: SpriteSet; clip: string; slow: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const slowRef = useRef(slow);
  slowRef.current = slow;
  const dw = Math.round(set.width);
  const dh = Math.round((set.width * set.frameH) / set.frameW);
  useEffect(() => {
    const g = ref.current?.getContext('2d');
    if (!g) return;
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      g.clearRect(0, 0, dw, dh);
      g.strokeStyle = 'rgba(243,210,122,.35)';
      g.strokeRect(0.5, 0.5, dw - 1, dh - 1);
      g.strokeStyle = 'rgba(255,80,80,.7)';
      const fy = Math.round(set.feet * dh) + 0.5;
      g.beginPath();
      g.moveTo(0, fy);
      g.lineTo(dw, fy);
      g.stroke();
      if (clip === 'stoi') g.drawImage(set.stoi, 0, 0, dw, dh);
      else if (clip === 'martwy') {
        g.save();
        g.translate(dw / 2, set.corpse.dy + dh / 2);
        g.scale(set.corpse.scale, set.corpse.scale);
        g.drawImage(set.martwy, -dw / 2, -dh / 2, dw, dh);
        g.restore();
      } else {
        const sheet = set.sheets[clip];
        const n = set.frames[clip];
        if (sheet && n) {
          const i = Math.floor(((now - t0) / 1000) * set.fps * (set.spec.speed[clip] ?? 1) * slowRef.current) % n;
          g.drawImage(sheet, (i % set.cols) * set.frameW, Math.floor(i / set.cols) * set.frameH, set.frameW, set.frameH, 0, 0, dw, dh);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [set, clip, dw, dh]);
  return (
    <div style={{ textAlign: 'center', fontSize: 12, color: '#cdbf9a' }}>
      <canvas ref={ref} width={dw} height={dh} style={{ display: 'block', background: 'rgba(0,0,0,.25)' }} />
      {clip}
      {set.frames[clip] ? ` (${set.frames[clip]})` : ''}
    </div>
  );
}

function UnitRow({ id, slow }: { id: string; slow: number }) {
  const [set, setSet] = useState<SpriteSet | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    void loadSprites(id).then(
      (s) => void s.ready.then(() => live && setSet(s)),
      () => live && setErr(true),
    );
    return () => {
      live = false;
    };
  }, [id]);
  return (
    <div className="well" data-unit={id} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: 6, flexWrap: 'wrap' }}>
      <div style={{ width: 150, fontWeight: 700, color: '#F3D27A', alignSelf: 'center' }}>
        {UNITS[id]?.name ?? id}
        <div style={{ fontWeight: 400, fontSize: 11 }}>{id}</div>
      </div>
      {err ? <span>brak plików</span> : !set ? <span>wczytywanie…</span> : ['stoi', ...Object.keys(set.frames), 'martwy'].map((c) => <ClipView key={c} set={set} clip={c} slow={slow} />)}
    </div>
  );
}

export function SpriteGallery() {
  const words = (new URLSearchParams(window.location.search).get('sprity') ?? '').toLowerCase().split(',').filter(Boolean);
  const ids = Object.keys(SPRITES).filter((id) => !words.length || words.some((w) => id.toLowerCase().includes(w) || SPRITES[id].dir.includes(w) || (UNITS[id]?.name ?? '').toLowerCase().includes(w)));
  const [slow, setSlow] = useState(1);
  return (
    <div className="screen slate" style={{ alignItems: 'flex-start', padding: 16, gap: 10, overflow: 'auto', height: '100vh' }}>
      <div style={{ color: '#F3D27A' }}>
        Tempo:{' '}
        {[1, 0.5, 0.25].map((v) => (
          <button key={v} className="btn" onClick={() => setSlow(v)} style={{ marginRight: 6, opacity: slow === v ? 1 : 0.6 }}>
            ×{v}
          </button>
        ))}
        <span style={{ fontSize: 12 }}> Czerwona linia: stopy. Ramka: kadr klipu.</span>
      </div>
      {ids.map((id) => (
        <UnitRow key={id} id={id} slow={slow} />
      ))}
    </div>
  );
}
