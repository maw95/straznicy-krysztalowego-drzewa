// Card preview on hover: any element can announce "show this card here";
// a single layer near the pointer renders it. Only on devices with a real pointer.

import { useEffect, useState } from 'react';
import type { ItemKind } from '../engine/data';
import { TreasureCard } from './TreasureCard';
import { UnitCard } from './UnitCard';

interface HoverTarget {
  id: string;
  x: number;
  y: number;
}

let current: HoverTarget | null = null;
const listeners = new Set<() => void>();
const canHover = () => typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

function set(t: HoverTarget | null) {
  current = t;
  listeners.forEach((fn) => fn());
}

/** Props to spread on an element that should preview a unit (`unitId`) or treasure (`item:<kind>`). */
export function hoverCard(id: string) {
  return {
    onMouseEnter: (e: React.MouseEvent) => canHover() && set({ id, x: e.clientX, y: e.clientY }),
    onMouseMove: (e: React.MouseEvent) => current?.id === id && set({ id, x: e.clientX, y: e.clientY }),
    onMouseLeave: () => current?.id === id && set(null),
  };
}

export function hideHoverCard() {
  set(null);
}

const W = 220;

export function HoverCardLayer() {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick((t) => t + 1);
    listeners.add(fn);
    const hide = () => set(null);
    window.addEventListener('pointerdown', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      listeners.delete(fn);
      window.removeEventListener('pointerdown', hide);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);
  if (!current) return null;
  const h = (W * 88) / 63;
  const left = current.x + 24 + W > window.innerWidth ? current.x - W - 24 : current.x + 24;
  const top = Math.max(8, Math.min(window.innerHeight - h - 8, current.y - h / 2));
  return (
    <div style={{ position: 'fixed', left, top, zIndex: 90, pointerEvents: 'none', animation: 'fade-in 0.15s ease-out both' }}>
      {current.id.startsWith('item:') ? <TreasureCard kind={current.id.slice(5) as ItemKind} width={W} /> : <UnitCard unitId={current.id} width={W} />}
    </div>
  );
}
