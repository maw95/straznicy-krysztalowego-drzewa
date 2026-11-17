// A phone has no hover: what the game says in `title` attributes (the mana, the move points, the income, a map field) is shown here for a moment when
// the element is touched. Only on screens without hover; buttons and links are left alone (a tap on them does something else).

import { useEffect, useState } from 'react';

const SHOWN_MS = 3200;

export function TouchTitles() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number; key: number } | null>(null);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function' || !window.matchMedia('(hover: none)').matches) return;
    let timer = 0;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[title]') as HTMLElement | null;
      window.clearTimeout(timer);
      const text = el?.getAttribute('title')?.trim();
      if (!el || !text || el.closest('button, a, input, select, textarea, [data-touch-title]')) {
        setTip(null);
        return;
      }
      setTip({ text, x: e.clientX, y: e.clientY, key: Date.now() });
      timer = window.setTimeout(() => setTip(null), SHOWN_MS);
    };
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('click', onClick, true);
      window.clearTimeout(timer);
    };
  }, []);
  if (!tip) return null;
  const left = Math.max(8, Math.min(tip.x - 130, window.innerWidth - 268));
  const below = tip.y < window.innerHeight / 2;
  return (
    <div role="status" data-touch-title className="plate parch" style={{ position: 'fixed', left, top: below ? tip.y + 18 : undefined, bottom: below ? undefined : window.innerHeight - tip.y + 18, width: 260, padding: '8px 12px', zIndex: 300, fontSize: 14, lineHeight: 1.3, pointerEvents: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.6)' }}>
      {tip.text}
    </div>
  );
}
