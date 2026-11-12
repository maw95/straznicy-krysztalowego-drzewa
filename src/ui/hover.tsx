// Card preview on hover: any element can announce "show this card here";
// a single layer near the pointer renders it. Only on devices with a real pointer.

import { useEffect, useState } from 'react';
import type { ItemKind } from '../engine/data';
import { details } from './details';
import { TreasureCard } from './TreasureCard';
import { UnitCard, UnitTip } from './UnitCard';
import { useItem } from './statScale';

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

/** The card of a unit (`unitId`) or a treasure (`item:<kind>`). */
export function CardFor({ id, width }: { id: string; width: number }) {
  return id.startsWith('item:') ? <TreasureCard kind={id.slice(5) as ItemKind} width={width} /> : <UnitCard unitId={id} width={width} />;
}

/** The small hint shown on hover: name and stats of a unit, name of a treasure. */
function TipFor({ id }: { id: string }) {
  return id.startsWith('item:') ? <ItemTip kind={id.slice(5) as ItemKind} /> : <UnitTip unitId={id} />;
}
function ItemTip({ kind }: { kind: ItemKind }) {
  return <b>{useItem(kind).def.name}</b>;
}

/**
 * Props to spread on an element that should preview a unit (`unitId`) or treasure (`item:<kind>`):
 * the card on hover, and the card under the right mouse button (details.tsx).
 */
export function hoverCard(id: string) {
  return {
    ...details(() => <CardFor id={id} width={280} />, { pin: true }),
    onMouseEnter: (e: React.MouseEvent) => canHover() && set({ id, x: e.clientX, y: e.clientY }),
    onMouseMove: (e: React.MouseEvent) => current?.id === id && set({ id, x: e.clientX, y: e.clientY }),
    onMouseLeave: () => current?.id === id && set(null),
  };
}

export function hideHoverCard() {
  set(null);
}

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
  const left = current.x + 18 + 300 > window.innerWidth ? undefined : current.x + 18;
  const right = left === undefined ? window.innerWidth - current.x + 18 : undefined;
  const top = Math.max(8, Math.min(window.innerHeight - 40, current.y - 14));
  return (
    <div className="plate parch" style={{ position: 'fixed', left, right, top, zIndex: 90, pointerEvents: 'none', padding: '3px 10px', fontSize: 15, whiteSpace: 'nowrap', animation: 'fade-in 0.15s ease-out both' }}>
      <TipFor id={current.id} />
    </div>
  );
}
