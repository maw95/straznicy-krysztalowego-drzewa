import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Side } from '../engine/data';
import type { Tile } from '../engine/types';
import { SVG_DEFS } from './svgDefs';
import { hoverCard } from './hover';

const BASE = import.meta.env?.BASE_URL ?? '/';
export const asset = (path: string) => `${BASE}assets/${path}`;
export const portrait = (unitId: string) => asset(`cards/portraits/${unitId}.jpg`);
/** Face of a map tile (one of the art variants), or its green/red back while hidden. */
export const tileImage = (t: Tile) => asset(t.revealed ? `tiles/${t.terrain}_${t.variant}.jpg` : `tiles/back_${t.side}.jpg`);

export const SIDE_RING: Record<Side, string> = { dawn: '#2C7048', horde: '#9A2226', neutral: '#2A5E9A' };
export const SIDE_RIBBON: Record<Side, 'g' | 'r' | 'b'> = { dawn: 'g', horde: 'r', neutral: 'b' };
export const SIDE_MEDAL: Record<Side, string> = { dawn: 'mGreen', horde: 'mRed', neutral: 'mBlue' };

export function SvgDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
      <defs dangerouslySetInnerHTML={{ __html: SVG_DEFS }} />
    </svg>
  );
}

export function Frame(props: {
  children?: ReactNode;
  crest?: boolean;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
  innerClass?: string;
  className?: string;
}) {
  return (
    <div className={`gf ${props.className ?? ''}`} style={props.style}>
      <div className={`gi ${props.innerClass ?? 'slate'}`} style={props.innerStyle}>
        {props.children}
      </div>
      {props.crest && (
        <svg className="crest" viewBox="0 0 140 66" aria-hidden="true">
          <use href="#ornCrest" />
        </svg>
      )}
    </div>
  );
}

/** Heraldic ribbon: a cloth band with gilded edges and swallowtail ends folded behind it. */
export function Ribbon({ side = 'dawn', children, style }: { side?: Side; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={`rib ${SIDE_RIBBON[side]}`} style={style}>
      <svg className="rib-tail l" viewBox="0 0 34 36" aria-hidden="true">
        <path d="M34 4H2l9 14.5L2 33h32z" className="rib-tail-cloth" />
        <path d="M34 4H2l9 14.5L2 33h32z" fill="url(#ribShade)" />
        <path d="M5 6.8h29M5 30.2h29" stroke="#E8C46A" strokeWidth="1.4" />
        <path d="M26 26h8v10z" fill="#140A02" />
      </svg>
      <div className="rib-band">
        <span className={typeof children === 'string' && children.length > 16 ? 'long' : undefined}>{children}</span>
      </div>
      <svg className="rib-tail r" viewBox="0 0 34 36" aria-hidden="true">
        <path d="M34 4H2l9 14.5L2 33h32z" className="rib-tail-cloth" />
        <path d="M34 4H2l9 14.5L2 33h32z" fill="url(#ribShade)" />
        <path d="M5 6.8h29M5 30.2h29" stroke="#E8C46A" strokeWidth="1.4" />
        <path d="M26 26h8v10z" fill="#140A02" />
      </svg>
    </div>
  );
}

/**
 * Modal layer that fades/scales in and plays a closing animation before unmounting.
 * `open` drives visibility; children are kept while the exit animation runs.
 */
/** Open dialogs, newest last: Enter belongs to the one on top. */
const openModals: object[] = [];

/**
 * A dialog over the screen. Enter presses its button marked `data-enter` (confirm / close / next),
 * or closes it when it has none; typing in a text field and a focused button keep their own Enter.
 */
export function Modal({ open, onClose, children, dim = true }: { open: boolean; onClose?: () => void; children: ReactNode; dim?: boolean }) {
  const [shown, setShown] = useState(open);
  const body = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const me = {};
    openModals.push(me);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || openModals[openModals.length - 1] !== me || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.tagName === 'BUTTON')) return;
      const button = body.current?.querySelector<HTMLButtonElement>('button[data-enter]:not(:disabled)');
      if (button) button.click();
      else if (closeRef.current) closeRef.current();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      openModals.splice(openModals.indexOf(me), 1);
    };
  }, [open]);
  const [leaving, setLeaving] = useState(false);
  const [content, setContent] = useState<ReactNode>(children);
  useEffect(() => {
    if (open) {
      setShown(true);
      setLeaving(false);
      setContent(children);
    } else if (shown) setLeaving(true);
  }, [open, children, shown]);
  // Fallback in case animationend never fires (background tabs, reduced-motion quirks, tests).
  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => {
      setShown(false);
      setLeaving(false);
    }, 320);
    return () => window.clearTimeout(t);
  }, [leaving]);
  if (!shown) return null;
  return (
    <div
      className={`overlay ${dim ? '' : 'clear'} ${leaving ? 'leaving' : ''}`}
      onClick={onClose}
      onAnimationEnd={(e) => {
        if (leaving && e.target === e.currentTarget) {
          setShown(false);
          setLeaving(false);
        }
      }}
    >
      <div ref={body} className="modal-body" onClick={(e) => e.stopPropagation()}>
        {open ? children : content}
      </div>
    </div>
  );
}

export function Medal({ fill, glyph, size = 36 }: { fill: string; glyph: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40" style={{ flex: 'none' }}>
      <circle cx="20" cy="20" r="19" fill="url(#mRing)" stroke="#1E1204" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="15.2" fill={`url(#${fill})`} stroke="#1E1204" strokeWidth="1" />
      <use href={`#${glyph}`} />
    </svg>
  );
}

export function Portrait({ unitId, size = 50, ring, glow, dim, title, preview = true }: { unitId: string; size?: number; ring?: string; glow?: string; dim?: boolean; title?: string; preview?: boolean }) {
  return (
    <div
      className="medal-ring"
      {...(preview ? hoverCard(unitId) : {})}
      title={preview ? undefined : title}
      style={{ width: size, height: size, boxShadow: glow ?? '0 0 0 1.5px #1E1204', opacity: dim ? 0.45 : 1, filter: dim ? 'grayscale(0.8)' : undefined }}
    >
      <img src={portrait(unitId)} alt={title ?? ''} style={ring ? { boxShadow: `0 0 0 2.5px ${ring}` } : undefined} />
    </div>
  );
}

export function HpBar({ hp, max }: { hp: number; max: number }) {
  const pct = Math.max(0, Math.min(1, hp / max));
  const color = pct > 0.5 ? 'linear-gradient(180deg,#9BE88A,#2E8A3A)' : pct > 0.25 ? 'linear-gradient(180deg,#F2D06A,#B8860E)' : 'linear-gradient(180deg,#F07A4A,#A8321E)';
  return (
    <div className="hpbar">
      <div style={{ width: `${pct * 100}%`, background: color }} />
    </div>
  );
}

export function Pips({ total, left }: { total: number; left: number }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ width: 9, height: 9, transform: 'rotate(45deg)', background: i < left ? '#9EE4FF' : '#2A3A40', boxShadow: '0 0 0 1.5px #1E1204' }} />
      ))}
    </div>
  );
}
