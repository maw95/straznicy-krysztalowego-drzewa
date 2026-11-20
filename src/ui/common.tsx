import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { FactionId, Side } from '../engine/data';
import type { Tile } from '../engine/types';
import { SVG_DEFS } from './svgDefs';
import { hoverCard } from './hover';

const BASE = import.meta.env?.BASE_URL ?? '/';
export const asset = (path: string) => `${BASE}assets/${path}`;
/** Id of the files (portrait, card art) a unit is drawn from: its own id. */
export const artId = (unitId: string) => unitId;
/** Id of the ability icon files. */
/** Abilities that have no icon of their own yet borrow one (docs/BACKLOG.md, section 2a). */
const ABILITY_ART: Record<string, string> = {
  // Dzikie Stado (placeholders until the faction's own icons: docs/BACKLOG.md 2a).
  headbutt: 'boulder', rhythm: 'giftOfLife', mountainLeap: 'airDash', momentum: 'lightCharge', unmoved: 'bloodRage', pierce: 'fireBreath', hippoStrike: 'dive',
  drumBeat: 'sunburst', ram: 'headlong', roar: 'curse', tremor: 'runeGolem', ancestralHorns: 'boulder', wanderHorn: 'sunburst', runOn: 'airDash',
  // Królestwo Umarłych (placeholders as well: docs/BACKLOG.md 2a).
  barrowCall: 'giftOfLife', dimLight: 'curse', spectralCharge: 'backstab', bonesReturn: 'rebirth', incorporeal: 'hardHead', armorPierce: 'fireBreath', dread: 'curse', hollow: 'hardHead',
  // Żelazny Klan (placeholders: docs/BACKLOG.md 2a).
  shieldOath: 'hardHead', stoneRune: 'runeGolem', bulwark: 'hardHead', standShot: 'fireBreath', temper: 'sunburst', bronzeQuills: 'quills', giantBane: 'headlong',
  misleadLight: 'web', stunBlow: 'boulder', ramBlow: 'boulder', cannonFire: 'fireBreath', fortify: 'runeGolem',
  // Dwór Wiecznego Szronu (placeholders: docs/BACKLOG.md 2a).
  iceWall: 'runeGolem', iceBlow: 'boulder', blizzardTrail: 'airDash', frostSlow: 'entanglingRoots', crystalArrow: 'fireBreath', thickFur: 'hardHead', frostArmor: 'quills',
  bellOfGlass: 'web', frostGrip: 'web', abduct: 'airDash', hailStones: 'fireBreath', coldLight: 'curse', longNight: 'sunburst',
  wail: 'curse', viyGaze: 'web', breathAgain: 'giftOfLife', manaReap: 'giftOfLife', graveBreath: 'fireBreath', toll: 'sunburst',
};
export const abilityArt = (ability: string) => ABILITY_ART[ability] ?? ability;
export const portrait = (unitId: string) => asset(`cards/portraits/${artId(unitId)}.jpg`);
/** Face of a map tile (one of the art variants, or `art`: the picture of a settlement or an object standing on it), or its green/red back while hidden. */
export const tileImage = (t: Tile, art?: string) =>
  asset(t.revealed ? (art ? `tiles/${art}.jpg` : `tiles/${t.terrain}_${t.variant}.jpg`) : `tiles/back_${t.side === 'third' ? 'dawn' : t.side === 'fourth' ? 'horde' : t.side}.jpg`);

/** The colour of each side (also of the seats in the setup): green, red, amber and violet; the neutral creatures are blue. */
export const SIDE_RING: Record<Side, string> = { dawn: '#2C7048', horde: '#9A2226', third: '#B9801A', fourth: '#6A3E98', neutral: '#2A5E9A' };
/** The thin outline round the base of the active 3D figure (the only mark a figure gets). */
export const ACTIVE_FIGURE_RING = '#F3C842';
/** The ribbons are painted in three colours only: the third and fourth team borrow the green and the red ones. */
export const SIDE_RIBBON: Record<Side | FactionId, 'g' | 'r' | 'b'> = { dawn: 'g', horde: 'r', third: 'g', fourth: 'r', neutral: 'b', herds: 'g', undead: 'g', clans: 'r', frost: 'g', free: 'r' };

/** The phone layout (the same condition as the media query in styles.css). */
export const COMPACT_QUERY = '(max-width: 900px), (max-height: 560px) and (max-width: 1100px)';

function mediaMatches(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

/** Whether a media query matches, kept up to date as the window turns or resizes. */
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => mediaMatches(query));
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const m = window.matchMedia(query);
    const on = () => setMatches(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return matches;
}

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

/** Heraldic ribbon: a painted silk band with gold embroidery (Scenario), one colour per faction (green Przymierze, red Horda, blue neutral, purple for the next ones). */
export function Ribbon({ side = 'dawn', children, style }: { side?: Side | FactionId; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={`rib ${SIDE_RIBBON[side]}`} style={style}>
      <span className={`rib-text ${typeof children === 'string' && children.length > 16 ? 'long' : ''}`}>{children}</span>
    </div>
  );
}

/** Open dialogs, newest last: Enter belongs to the one on top. */
const openModals: object[] = [];

/**
 * A dialog over the screen: it fades and scales in, and plays a closing animation before unmounting
 * (`open` drives it; the last children stay on screen while it closes). Enter presses its button marked `data-enter` (confirm / close / next),
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
  // What was on screen last, for the closing animation (kept in a ref: an open dialog gets new children
  // on every render of its parent, and state would render it twice).
  const content = useRef<ReactNode>(children);
  if (open) content.current = children;
  useEffect(() => {
    if (open) {
      setShown(true);
      setLeaving(false);
    } else if (shown) setLeaving(true);
  }, [open, shown]);
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
        {open ? children : content.current}
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

export function Portrait({ unitId, size = 50, ring, glow, dim, title, preview = true, tip = true }: { unitId: string; size?: number; ring?: string; glow?: string; dim?: boolean; title?: string; preview?: boolean; tip?: boolean }) {
  return (
    <div
      className="medal-ring"
      {...(preview ? hoverCard(unitId, { tip }) : {})}
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
