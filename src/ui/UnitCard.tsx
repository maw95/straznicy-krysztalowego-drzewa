// Unit card composed at runtime from separate pieces (docs/grafika, cut by
// scripts/assets/extract.py): frame for the faction and role, portrait, type glyph,
// ability medallion, stat icons, and the text from the unit data.
// Coordinates are in frame pixels (551×713), measured on each frame.

import { guardianDuelHp, UNITS } from '../engine/data';
import { asset } from './common';

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface FrameLayout {
  file: string;
  /** Visible card edge inside the frame image; it is stretched to fill the card exactly. */
  bounds: Box;
  art: Box;
  name: Box;
  role: Box;
  /** Role plate is a dark band on support frames, a parchment plate on hero frames. */
  roleOnDark: boolean;
  stats: [Box, Box, Box];
  type: { cx: number; cy: number; r: number };
  ability: { cx: number; cy: number; r: number };
  band: Box;
  desc: Box;
}

const b = (x0: number, y0: number, x1: number, y1: number): Box => ({ x0, y0, x1, y1 });

const FRAMES: Record<string, FrameLayout> = {
  dawn_hero: {
    file: 'dawn_hero',
    bounds: b(45, 1, 506, 666),
    art: b(63, 32, 488, 320),
    name: b(132, 337, 404, 372),
    role: b(216, 384, 338, 402),
    roleOnDark: false,
    stats: [b(78, 419, 201, 495), b(207, 419, 345, 495), b(350, 420, 472, 495)],
    type: { cx: 458.5, cy: 361.5, r: 32.5 },
    ability: { cx: 115.5, cy: 551.5, r: 47 },
    band: b(181, 507, 444, 549),
    desc: b(151, 560, 446, 627),
  },
  dawn_support: {
    file: 'dawn_support',
    bounds: b(29, 3, 518, 685),
    art: b(46, 34, 500, 324),
    name: b(103, 339, 415, 380),
    role: b(187, 386, 358, 415),
    roleOnDark: true,
    stats: [b(61, 428, 193, 505), b(199, 428, 346, 507), b(352, 428, 486, 507)],
    type: { cx: 468.5, cy: 367.5, r: 34.5 },
    ability: { cx: 100, cy: 565.5, r: 48 },
    band: b(174, 519, 458, 561),
    desc: b(128, 572, 464, 643),
  },
  horde_hero: {
    file: 'horde_hero',
    bounds: b(34, 5, 517, 691),
    art: b(51, 37, 499, 334),
    name: b(135, 354, 400, 387),
    role: b(213, 403, 338, 420),
    roleOnDark: false,
    stats: [b(80, 442, 196, 512), b(202, 442, 349, 515), b(355, 442, 471, 511)],
    type: { cx: 470.5, cy: 378, r: 34 },
    ability: { cx: 111.5, cy: 571, r: 48 },
    band: b(177, 527, 452, 566),
    desc: b(172, 584, 438, 644),
  },
  horde_support: {
    file: 'horde_support',
    bounds: b(32, 5, 519, 684),
    art: b(48, 36, 502, 326),
    name: b(96, 344, 411, 384),
    role: b(187, 389, 362, 417),
    roleOnDark: true,
    stats: [b(68, 434, 195, 510), b(201, 435, 349, 510), b(355, 436, 486, 510)],
    type: { cx: 472, cy: 370, r: 35 },
    ability: { cx: 102, cy: 568, r: 47 },
    band: b(170, 521, 470, 563),
    desc: b(147, 577, 461, 644),
  },
  neutral_hero: {
    file: 'neutral_hero',
    bounds: b(35, 5, 516, 692),
    art: b(51, 36, 500, 336),
    name: b(123, 353, 415, 392),
    role: b(212, 405, 339, 423),
    roleOnDark: false,
    stats: [b(72, 443, 196, 517), b(203, 443, 348, 517), b(355, 443, 482, 517)],
    type: { cx: 468.5, cy: 380.5, r: 34 },
    ability: { cx: 105.5, cy: 576.5, r: 48.5 },
    band: b(186, 535, 462, 570),
    desc: b(144, 586, 448, 651),
  },
};

const FRAME_W = 551;
const SRC_H = 713;
/** Every card (units and treasures) renders at the same 63:88 proportions. */
export const CARD_H = Math.round((FRAME_W * 88) / 63);

/** Maps frame-image pixels onto the card box (frames have different margins). */
export function cardSpace(bounds: Box) {
  const kx = FRAME_W / (bounds.x1 - bounds.x0);
  const ky = CARD_H / (bounds.y1 - bounds.y0);
  const X = (x: number) => (x - bounds.x0) * kx;
  const Y = (y: number) => (y - bounds.y0) * ky;
  return {
    kx,
    ky,
    X,
    Y,
    at: (r: Box) => ({ position: 'absolute' as const, left: X(r.x0), top: Y(r.y0), width: (r.x1 - r.x0) * kx, height: (r.y1 - r.y0) * ky }),
    circle: (cx: number, cy: number, r: number) => ({ position: 'absolute' as const, left: X(cx - r), top: Y(cy - r), width: 2 * r * kx, height: 2 * r * ky }),
  };
}
/** Role plate: the Horde has its own names for heroes and supports (the rules call them all heroes and supports). */
const ROLE = { hero: 'Bohater', support: 'Pomocnik', neutral: 'Strażnik' } as const;
const HORDE_ROLE = { hero: 'Wódz', support: 'Poplecznik', neutral: 'Strażnik' } as const;
const STAT_LABEL = ['Życie', 'Atak', 'Szybkość'];
const STAT_ICON = ['hp', 'attack', 'speed'];

function frameFor(unitId: string): FrameLayout {
  const def = UNITS[unitId];
  if (def.side === 'neutral') return FRAMES.neutral_hero;
  return FRAMES[`${def.side}_${def.kind === 'support' ? 'support' : 'hero'}`];
}

/** One type per unit: a flyer shows only the wing, a shooter only the bow. */
function typeIcon(unitId: string): string {
  const def = UNITS[unitId];
  if (def.movement === 'fly') return 'fly';
  return def.attackType === 'ranged' ? 'ranged' : 'melee';
}

const centered = { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const };

/**
 * Largest font (in frame pixels) at which `text` fits a box when wrapped word by word.
 * Glyph widths are estimated (about 0.47 em for this serif at weight 600).
 */
export function fitFont(text: string, width: number, height: number, max = 26, min = 13): number {
  const words = text.split(/\s+/);
  for (let size = max; size > min; size -= 0.5) {
    const charW = size * 0.47;
    let lines = 1;
    let line = 0;
    for (const w of words) {
      const len = w.length * charW;
      if (line && line + charW + len > width) {
        lines++;
        line = len;
      } else line += (line ? charW : 0) + len;
    }
    if (lines * size * 1.12 <= height) return size;
  }
  return min;
}

export function UnitCard({ unitId, width = 300, hp, attack, speed }: { unitId: string; width?: number; hp?: number; attack?: number; speed?: number }) {
  const def = UNITS[unitId];
  const L = frameFor(unitId);
  const scale = width / FRAME_W;
  const { at, circle, kx, ky, X, Y } = cardSpace(L.bounds);
  const nameW = L.name.x1 - L.name.x0;
  const nameSize = Math.min(40, (nameW / Math.max(8, def.name.length)) * 2.05);
  const values = [hp ?? def.hp, attack ?? def.attack, speed ?? def.speed];
  // The description starts right of the ability medallion and gets the largest font that fits.
  const desc = { ...L.desc, x0: Math.max(L.desc.x0, L.ability.cx + L.ability.r + 8), y0: L.desc.y0 - 4, y1: L.desc.y1 + 3 };
  const descSize = fitFont(def.abilityText, (desc.x1 - desc.x0) * kx - 16, (desc.y1 - desc.y0) * ky);
  return (
    <div className="card-sheen" style={{ position: 'relative', width, height: CARD_H * scale, flex: 'none', filter: 'drop-shadow(0 14px 20px rgba(0,0,0,0.6))' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: FRAME_W, height: CARD_H, overflow: 'hidden', transform: `scale(${scale})`, transformOrigin: '0 0', fontFamily: "'Crimson Pro', Georgia, serif" }}>
        <img src={asset(`cards/art/${unitId}.jpg`)} alt={def.name} style={{ ...at(L.art), objectFit: 'cover', objectPosition: 'center 35%' }} />
        <img src={asset(`cards/frames/${L.file}.png`)} alt="" style={{ position: 'absolute', left: X(0), top: Y(0), width: FRAME_W * kx, height: SRC_H * ky }} />

        <div style={{ ...at(L.name), ...centered, fontWeight: 800, fontSize: nameSize, lineHeight: 1, color: '#20160C', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>{def.name}</div>
        <div style={{ ...at(L.role), ...centered, fontWeight: 800, fontSize: 19, letterSpacing: '0.1em', textTransform: 'uppercase', color: L.roleOnDark ? '#F7EDD2' : '#2B1D10', textShadow: L.roleOnDark ? '0 1px 0 rgba(0,0,0,0.6)' : 'none' }}>
          {(def.side === 'horde' ? HORDE_ROLE : ROLE)[def.kind]}
        </div>

        <img
          src={asset(`cards/types/${typeIcon(unitId)}.png`)}
          alt=""
          title={def.movement === 'fly' ? 'Latający' : def.attackType === 'ranged' ? 'Strzelec' : 'Walka wręcz'}
          style={{ ...circle(L.type.cx, L.type.cy, L.type.r * 0.78), objectFit: 'contain' }}
        />

        {L.stats.map((box, i) => {
          const h = (box.y1 - box.y0) * ky;
          return (
            <div key={i} style={{ ...at(box), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: h * 0.64 }}>
                <img src={asset(`cards/stats/${STAT_ICON[i]}.png`)} alt="" style={{ width: h * 0.56, height: h * 0.56, objectFit: 'contain' }} />
                <span style={{ fontWeight: 800, fontSize: h * 0.56, lineHeight: 1, color: '#17100A' }}>{values[i]}</span>
                {/* Guardians fight a lone hero (duel on the board) with less Życie. */}
                {i === 0 && def.kind === 'neutral' && hp === undefined && (
                  <span title="Życie w pojedynku na planszy" style={{ fontWeight: 700, fontSize: h * 0.3, lineHeight: 1, color: '#3A2A16', alignSelf: 'flex-end' }}>({guardianDuelHp(unitId)})</span>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1, color: '#2B1D10' }}>{STAT_LABEL[i]}</div>
            </div>
          );
        })}

        <img
          src={asset(`cards/abilities/${def.ability}_inner.png`)}
          alt=""
          style={{ ...circle(L.ability.cx, L.ability.cy, L.ability.r), borderRadius: '50%' }}
        />
        <div style={{ ...at(L.band), ...centered, fontWeight: 800, fontSize: def.abilityName.length > 15 ? 17 : 20, letterSpacing: def.abilityName.length > 15 ? '0.05em' : '0.1em', textTransform: 'uppercase', lineHeight: 1, paddingTop: 1, boxSizing: 'border-box', color: '#F7EDD2', textShadow: '0 2px 0 rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>{def.abilityName}</div>
        <div style={{ ...at(desc), ...centered, padding: '0 8px', boxSizing: 'border-box', fontWeight: 600, fontSize: descSize, lineHeight: 1.12, color: '#1A1209' }}>{def.abilityText}</div>
      </div>
    </div>
  );
}
