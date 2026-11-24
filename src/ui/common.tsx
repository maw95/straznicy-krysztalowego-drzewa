import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { FactionId, Side, TeamId } from '../engine/data';
import type { Tile } from '../engine/types';
import { raceOf } from '../engine/teams';
import { SVG_DEFS } from './svgDefs';
import { hoverCard } from './hover';

const BASE = import.meta.env?.BASE_URL ?? '/';
export const asset = (path: string) => `${BASE}assets/${path}`;
/** Id of the files (portrait, card art) a unit is drawn from: its own id. */
export const artId = (unitId: string) => unitId;
/** Id of the ability icon files. */
/** Abilities that have no icon of their own yet borrow one (docs/BACKLOG.md, section 2a). */
const ABILITY_ART: Record<string, string> = {
  // Królestwo Umarłych (placeholders as well: docs/BACKLOG.md 2a).
  barrowCall: 'giftOfLife', dimLight: 'curse', spectralCharge: 'backstab', bonesReturn: 'rebirth', incorporeal: 'hardHead', armorPierce: 'fireBreath', dread: 'curse', hollow: 'hardHead',
  // Żelazny Klan has its own icons for all twelve abilities (public/assets/cards/abilities; the rest are shared: hardHead, pierce, burrow, giftOfLife).
  // Dwór Wiecznego Szronu (placeholders: docs/BACKLOG.md 2a).
  iceWall: 'runeGolem', iceBlow: 'boulder', blizzardTrail: 'airDash', frostSlow: 'entanglingRoots', crystalArrow: 'fireBreath', thickFur: 'hardHead', frostArmor: 'quills',
  bellOfGlass: 'web', frostGrip: 'web', beardChill: 'web', hailStones: 'fireBreath', coldLight: 'curse', longNight: 'sunburst',
  // Rój Puszczy (placeholders: docs/BACKLOG.md 2a).
  lastCut: 'backstab', sleepSpores: 'poisonClaw', chitinWall: 'hardHead', puffball: 'shardBurst', anthill: 'packHunt', metamorphosis: 'rebirth', homeGround: 'bogRegrowth',
  airHunt: 'dive', spreadSpores: 'treeRoots', coil: 'tentacles', slimeTrail: 'bogRegrowth', greatChorus: 'stormKing',
  // Bractwo Przypływu has its own icons for all fifteen abilities (public/assets/cards/abilities).
  wail: 'curse', viyGaze: 'web', breathAgain: 'giftOfLife', manaReap: 'giftOfLife', graveBreath: 'fireBreath', toll: 'sunburst',
};
/** Units whose ability has a picture of its own (the same ability on another unit keeps the shared one): `cards/abilities/u_<unit>.png`. */
export const UNIT_ABILITY_ART: ReadonlySet<string> = new Set(['silverFox', 'dryadArcher', 'whiteStag', 'goblinSlinger', 'gargoyle', 'caveTroll', 'shadowWyvern', 'doomBehemoth']);
export const abilityArt = (ability: string, unitId?: string) => (unitId && UNIT_ABILITY_ART.has(unitId) ? `u_${unitId}` : ABILITY_ART[ability] ?? ability);
export const portrait = (unitId: string) => asset(`cards/portraits/${artId(unitId)}.jpg`);
/**
 * Tile art made for the land of one faction (the rest of the factions share the Przymierze / Horda tiles): name of the picture without extension -> number of
 * variants. Files are `tiles/<faction>_<name>[_<n>].jpg` and the reverse `tiles/back_<faction>.jpg`; `scripts/assets/herds_tiles.py` makes the Wild Herd's.
 * A new faction's land is a new entry here (backlog: "G4 for a faction" includes the tiles).
 */
export const FACTION_TILE_ART: Partial<Record<FactionId, Record<string, number>>> = {
  herds: {
    back: 1, hill: 2, river: 2, bridge: 1, mountain: 2, chasm: 2, barren: 2, osada_1: 1,
    obj_shrine: 1, obj_camp: 1, obj_chest: 1, obj_studnia: 1, obj_tartak: 1, obj_kopalnia: 1, obj_kopalnia_ruda: 1, obj_zrodlo_pylu: 1, obj_chatka: 1,
    obj_skladnica: 1, obj_odlamek: 1, obj_mlyn: 1,
  },
  // `scripts/assets/tides_map.py`: the shore tiles, the harbour and treasury are new terrain types (shore_<n>, baseTides_1, treasureTides_1), the rest replaces the shared ground.
  tides: {
    back: 1, hill: 1, river: 1, bridge: 1, mountain: 1, chasm: 1, barren: 1, osada_1: 1,
    obj_shrine: 1, obj_camp: 1, obj_chest: 1, obj_studnia: 1, obj_tartak: 1, obj_kopalnia: 1, obj_kopalnia_ruda: 1, obj_zrodlo_pylu: 1, obj_chatka: 1,
    obj_skladnica: 1, obj_odlamek: 1, obj_mlyn: 1,
  },
  // `scripts/assets/clans_map.py`: the mountain meadow, the stronghold and the treasury are new terrain types (highland_<n>, baseClans_1, treasureClans_1), the rest replaces the shared ground.
  clans: {
    back: 1, hill: 1, river: 1, bridge: 1, mountain: 1, chasm: 1, barren: 1, osada_1: 1,
    obj_shrine: 1, obj_camp: 1, obj_chest: 1, obj_studnia: 1, obj_tartak: 1, obj_kopalnia: 1, obj_kopalnia_ruda: 1, obj_zrodlo_pylu: 1, obj_chatka: 1,
    obj_skladnica: 1, obj_odlamek: 1, obj_mlyn: 1,
  },
};
export const hasTileArt = (race: FactionId | undefined, name: string) => !!(race && FACTION_TILE_ART[race]?.[name]);
/**
 * Face of a map tile (one of the art variants, or `art`: the picture of a settlement or an object standing on it), or the back of its deck while hidden.
 * `race` is the faction of the tile's side: its own pictures, when it has them, replace the shared ones.
 */
export const tileImage = (t: Tile, art?: string, race?: FactionId) => {
  const own = race ? FACTION_TILE_ART[race] : undefined;
  if (!t.revealed) return asset(own?.back ? `tiles/back_${race}.jpg` : `tiles/back_${t.side === 'third' ? 'dawn' : t.side === 'fourth' ? 'horde' : t.side}.jpg`);
  if (art) return asset(own?.[art] ? `tiles/${race}_${art}.jpg` : `tiles/${art}.jpg`);
  const n = own?.[t.terrain];
  return asset(n ? `tiles/${race}_${t.terrain}_${((t.variant - 1) % n) + 1}.jpg` : `tiles/${t.terrain}_${t.variant}.jpg`);
};

/** The colour of each side (also of the seats in the setup): green, red, amber and violet; the neutral creatures are blue. */
export const SIDE_RING: Record<Side, string> = { dawn: '#2C7048', horde: '#9A2226', third: '#B9801A', fourth: '#6A3E98', neutral: '#2A5E9A' };
/** The thin outline round the base of the active 3D figure (the only mark a figure gets). */
export const ACTIVE_FIGURE_RING = '#F3C842';
/** Every faction has a ribbon of its own colour (`wstazka_<faction>.webp`; the Covenant, the Horde, the Dead and Szron use the four originals, see scripts/assets/ribbon_tints.py for the rest). */
export const FACTION_RIBBON: Record<FactionId, string> = {
  dawn: 'g', horde: 'r', undead: 'p', frost: 'b', herds: 'herds', clans: 'clans', free: 'free', sands: 'sands', swarm: 'swarm', tides: 'tides',
};
/** The ring round a portrait that belongs to a faction (the hero pickers of the setup screens): the colour of the faction, whatever seat it sits in. */
export const FACTION_RING: Record<FactionId, string> = {
  dawn: '#2C7048', horde: '#9A2226', herds: '#B8731E', undead: '#6A3E98', clans: '#8B8478', frost: '#3E8FB8', free: '#6E4B2E', sands: '#C79A1E', swarm: '#2A8A80', tides: '#2BB3C0',
};
/** The ribbon (or ring) key of a team seat: the faction that sits there, not the seat itself (a Covenant player in the second seat does not get the Horde's red). */
export const teamFaction = (state: unknown, team: Side | FactionId | 'draw' | null | undefined): Side | FactionId => (!team || team === 'draw' || team === 'neutral' ? 'neutral' : raceOf(state, team as TeamId));

/** The ring of a team seat's portrait: the colour of the faction that sits there (neutral creatures keep blue). */
export const sideRing = (state: unknown, side: Side): string => (side === 'neutral' ? SIDE_RING.neutral : FACTION_RING[raceOf(state, side)]);

/** The ribbons of the sides that are not a faction (the third and fourth team borrow green and red; the neutral creatures are blue). */
export const SIDE_RIBBON: Record<Side, 'g' | 'r' | 'b'> = { dawn: 'g', horde: 'r', third: 'g', fourth: 'r', neutral: 'b' };

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
export function Ribbon({ side, children, style }: { side?: Side | FactionId; children: ReactNode; style?: CSSProperties }) {
  // Without a side the ribbon follows the faction at the screen (css `.rib.auto`).
  const cls = side === undefined ? 'auto' : side in FACTION_RIBBON ? FACTION_RIBBON[side as FactionId] : SIDE_RIBBON[side as Side];
  return (
    <div className={`rib ${cls}`} style={style}>
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
    }, body.current?.querySelector('.chestbox, .spellbook') ? 760 : 320);
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
