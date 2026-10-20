// Card back drawn in code: gilded frame, dark slate field, the faction crest in the middle.
// Same 63:88 proportions as every face (see CARD_H in UnitCard).

import { useEffect, useState } from 'react';
import type { ItemKind, Side } from '../engine/data';
import { asset } from './common';
import { TreasureCard } from './TreasureCard';

export function CardBack({ width = 300, crest = 'neutral' }: { width?: number; crest?: Side }) {
  const h = (width * 88) / 63;
  const k = width / 300;
  return (
    <div
      style={{
        position: 'relative',
        width,
        height: h,
        flex: 'none',
        borderRadius: 16 * k,
        padding: 9 * k,
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #FFF0B0 0%, #E2B04A 18%, #9A6A18 45%, #F0CF78 70%, #7A520E 100%)',
        boxShadow: '0 0 0 2px #1E1204, 0 14px 20px rgba(0,0,0,0.6)',
      }}
    >
      <div
        className="slate"
        style={{
          position: 'relative',
          height: '100%',
          borderRadius: 10 * k,
          overflow: 'hidden',
          boxShadow: 'inset 0 0 0 2px #1E1204, inset 0 0 0 4px #C99A3C, inset 0 0 40px rgba(0,0,0,0.7)',
        }}
      >
        {/* Fine diamond lattice */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.22,
            backgroundImage: 'repeating-linear-gradient(45deg, #E8C46A 0 1px, transparent 1px 100%), repeating-linear-gradient(-45deg, #E8C46A 0 1px, transparent 1px 100%)',
            backgroundSize: `${22 * k}px ${22 * k}px`,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(158,228,255,0.28) 0%, rgba(0,0,0,0) 55%)' }} />
        {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
          <svg
            key={c}
            viewBox="0 0 72 72"
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: 56 * k,
              height: 56 * k,
              left: c.endsWith('l') ? 2 * k : undefined,
              right: c.endsWith('r') ? 2 * k : undefined,
              top: c.startsWith('t') ? 2 * k : undefined,
              bottom: c.startsWith('b') ? 2 * k : undefined,
              transform: `scale(${c.endsWith('r') ? -1 : 1}, ${c.startsWith('b') ? -1 : 1})`,
            }}
          >
            <use href="#ornCorner" />
          </svg>
        ))}
        <div style={{ position: 'absolute', inset: 14 * k, borderRadius: 6 * k, border: `${1.5 * k}px solid rgba(232,196,106,0.7)`, boxShadow: `inset 0 0 0 ${3 * k}px rgba(30,18,4,0.6), inset 0 0 0 ${4.5 * k}px rgba(232,196,106,0.35)` }} />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 260 * k,
            height: 260 * k,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'repeating-conic-gradient(from 0deg, rgba(243,210,122,0.22) 0deg 4deg, rgba(243,210,122,0) 4deg 15deg)',
            maskImage: 'radial-gradient(circle, transparent 28%, #000 32%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 28%, #000 32%, transparent 70%)',
          }}
        />
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 150 * k, height: 150 * k, transform: 'translate(-50%, -50%)', borderRadius: '50%', border: `${2 * k}px solid #C99A3C`, boxShadow: '0 0 0 1px #1E1204, 0 0 30px rgba(158,228,255,0.25)' }} />
        <img
          src={asset(`cards/crests/${crest}.png`)}
          alt=""
          className="crest-glint"
          style={{ position: 'absolute', left: '50%', top: '50%', width: 118 * k, transform: 'translate(-50%, -50%)', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.6))' }}
        />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34 * k, textAlign: 'center', fontWeight: 800, fontSize: 15 * k, letterSpacing: '0.2em', color: '#E7CF8F', textShadow: '0 2px 0 #1E1204' }}>STRAŻNICY</div>
      </div>
    </div>
  );
}

/** Shows the back, turns over, and reveals the treasure. */
export function TreasureReveal({ kind, width = 300 }: { kind: ItemKind; width?: number }) {
  const [front, setFront] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setFront(true), 650);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div style={{ animation: 'rise-in 0.4s ease-out both' }}>
      <div className="card-flip" style={{ animationDelay: '0.2s' }}>
        {front ? <TreasureCard kind={kind} width={width} /> : <CardBack width={width} />}
      </div>
    </div>
  );
}
