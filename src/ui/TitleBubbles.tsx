// Hover hints in the game's own style instead of the browser's: what the game says in `title` attributes (a price, an ability, a shortcut, the reason a
// button is shut) appears in a parchment bubble near the pointer, after a short rest over the element. The browser's own tooltip would show the same text
// in its plain grey box, so the attribute is moved to `data-title` the moment the pointer is over it (the text, and its English, stay where they were).
// Only on devices with a real pointer; a touch screen has `TouchTitles`.

import { useEffect, useState } from 'react';
import { StatText } from './markers';

const DELAY_MS = 350;
const canHover = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Takes the browser tooltip off every element from `el` up and returns the hint of the nearest one that has any. */
function hintAt(el: Element | null): { el: Element; text: string } | null {
  let found: { el: Element; text: string } | null = null;
  for (let n = el; n; n = n.parentElement) {
    const t = n.getAttribute('title');
    if (t !== null) {
      if (t.trim()) n.setAttribute('data-title', t);
      n.removeAttribute('title');
    }
    const d = n.getAttribute('data-title')?.trim();
    if (d && !found) found = { el: n, text: d };
  }
  return found;
}

export function TitleBubbles() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  useEffect(() => {
    if (!canHover()) return;
    let timer = 0;
    let raf = 0;
    let current: Element | null = null;
    let at = { x: 0, y: 0 };
    const hide = () => {
      window.clearTimeout(timer);
      current = null;
      setTip(null);
    };
    // elementFromPoint, not the event target: a disabled button gets no mouse events in some browsers, and its reason is the hint most worth showing.
    const look = () => {
      raf = 0;
      const hit = hintAt(document.elementFromPoint(at.x, at.y));
      if (!hit) return hide();
      if (hit.el === current) return setTip((t) => (t ? { ...t, x: at.x, y: at.y } : t));
      hide();
      current = hit.el;
      timer = window.setTimeout(() => setTip({ text: hit.text, x: at.x, y: at.y }), DELAY_MS);
    };
    const onMove = (e: MouseEvent) => {
      at = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(look);
    };
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('pointerdown', hide, true);
    window.addEventListener('scroll', hide, true);
    document.addEventListener('mouseleave', hide);
    return () => {
      window.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('pointerdown', hide, true);
      window.removeEventListener('scroll', hide, true);
      document.removeEventListener('mouseleave', hide);
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, []);
  if (!tip) return null;
  const left = tip.x + 18 + 340 > window.innerWidth ? undefined : tip.x + 18;
  const right = left === undefined ? Math.max(8, window.innerWidth - tip.x + 18) : undefined;
  const below = tip.y < window.innerHeight * 0.6;
  return (
    <div
      role="tooltip"
      data-title-bubble
      className="plate parch"
      style={{ position: 'fixed', left, right, top: below ? tip.y + 20 : undefined, bottom: below ? undefined : window.innerHeight - tip.y + 14, zIndex: 95, pointerEvents: 'none', padding: '5px 12px', fontSize: 15, lineHeight: 1.3, maxWidth: 340, animation: 'fade-in 0.15s ease-out both' }}
    >
      <StatText text={tip.text} />
    </div>
  );
}
