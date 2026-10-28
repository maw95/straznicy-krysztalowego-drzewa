// Details under the right mouse button, as in Heroes: holding the right button over a unit, a treasure or
// a map hex shows a window with its details, and letting go hides it. A short right click (a touchpad's
// two-finger click cannot be held) leaves the window open until the next click; on a touch screen holding
// a finger does what holding the right button does. The browser's own menu never opens (main.tsx).

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { hideHoverCard } from './hover';

/** Held longer than this (ms), the window closes with the button; a shorter click leaves it open. */
const HOLD_MS = 300;
/** A finger held this long (ms) opens the window. */
const LONG_PRESS_MS = 450;
/** A finger moving further than this (px) is scrolling, not holding. */
const TOUCH_SLOP = 10;

interface Shown {
  content: ReactNode;
  x: number;
  y: number;
}

let shown: Shown | null = null;
const listeners = new Set<() => void>();
function show(next: Shown | null) {
  shown = next;
  listeners.forEach((fn) => fn());
}

/**
 * The details of the press under way. Elements nest (a guardian's portrait on a map hex), and the press
 * reaches the inner one first: each sets the candidate and the outer one, set last, wins — it is the one
 * that knows most (the hex tells about its guardian too). The layer picks the candidate up afterwards.
 */
let candidate: { render: () => ReactNode; touch: boolean } | null = null;

/** Props for an element that has details: `render` builds the window's content when it opens. */
export function details(render: () => ReactNode) {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      const touch = e.pointerType === 'touch';
      if ((touch && e.button === 0) || (!touch && e.button === 2)) candidate = { render, touch };
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

/** Whether a details window is open (hover hints step aside meanwhile). */
export function useDetailsShown(): boolean {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick((t) => t + 1);
    listeners.add(fn);
    return () => void listeners.delete(fn);
  }, []);
  return shown !== null;
}

/** The window itself, near the pointer and kept inside the screen. Mount once, next to the card preview layer. */
export function DetailsLayer() {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick((t) => t + 1);
    listeners.add(fn);
    let pinned = false;
    let pressTimer = 0;
    let touchStart: { x: number; y: number } | null = null;
    let suppressClick = false;
    // The listener waiting for the right button to come up, if any (removed with the layer).
    let rightUp: ((e: PointerEvent) => void) | null = null;

    const onDown = (e: PointerEvent) => {
      // Any press closes a window left open by a short right click.
      if (shown && pinned) {
        show(null);
        pinned = false;
      }
      const c = candidate;
      candidate = null;
      if (!c) return;
      if (c.touch) {
        touchStart = { x: e.clientX, y: e.clientY };
        pressTimer = window.setTimeout(() => {
          hideHoverCard();
          show({ content: c.render(), x: touchStart!.x, y: touchStart!.y });
          suppressClick = true;
        }, LONG_PRESS_MS);
        return;
      }
      hideHoverCard();
      show({ content: c.render(), x: e.clientX, y: e.clientY });
      const opened = Date.now();
      if (rightUp) window.removeEventListener('pointerup', rightUp);
      const onUp = (up: PointerEvent) => {
        if (up.button !== 2) return;
        window.removeEventListener('pointerup', onUp);
        rightUp = null;
        if (Date.now() - opened >= HOLD_MS) show(null);
        else pinned = true;
      };
      rightUp = onUp;
      window.addEventListener('pointerup', onUp);
    };
    const onMove = (e: PointerEvent) => {
      if (touchStart && !shown && Math.hypot(e.clientX - touchStart.x, e.clientY - touchStart.y) > TOUCH_SLOP) {
        window.clearTimeout(pressTimer);
        touchStart = null;
      }
    };
    const onTouchEnd = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      window.clearTimeout(pressTimer);
      touchStart = null;
      if (shown && !pinned) show(null);
    };
    // The click that ends a long press must not also move a hero or attack.
    const onClick = (e: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      e.stopPropagation();
      e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shown) {
        show(null);
        pinned = false;
      }
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onTouchEnd);
    window.addEventListener('pointercancel', onTouchEnd);
    window.addEventListener('click', onClick, true);
    window.addEventListener('keydown', onKey);
    return () => {
      listeners.delete(fn);
      window.clearTimeout(pressTimer);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onTouchEnd);
      window.removeEventListener('pointercancel', onTouchEnd);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKey);
      if (rightUp) window.removeEventListener('pointerup', rightUp);
    };
  }, []);

  const box = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (!shown || !box.current) return setPlace(null);
    const { width, height } = box.current.getBoundingClientRect();
    const gap = 18;
    const left = shown.x + gap + width < window.innerWidth - 8 ? shown.x + gap : Math.max(8, shown.x - gap - width);
    const top = Math.max(8, Math.min(window.innerHeight - height - 8, shown.y - height / 2));
    setPlace({ left, top });
  }, [shown]);

  if (!shown) return null;
  return (
    <div
      ref={box}
      role="dialog"
      aria-label="Szczegóły"
      onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'fixed', left: place?.left ?? -9999, top: place?.top ?? 0, zIndex: 95, pointerEvents: 'none', animation: 'fade-in 0.12s ease-out both' }}
    >
      {shown.content}
    </div>
  );
}
