// Treasure card composed at runtime: frame + circular illustration + name + text.
// Coordinates are in frame pixels (551×789), measured on the blank frame.

import { ITEMS, type ItemKind } from '../engine/data';
import { asset } from './common';
import { StatText } from './markers';
import { CARD_H, cardSpace } from './UnitCard';

const FRAME_W = 551;
const SRC_H = 789;
const { at } = cardSpace({ x0: 0, y0: 0, x1: FRAME_W, y1: SRC_H });
const SY = CARD_H / SRC_H;
/** The opening is slightly taller than wide. */
const ART = { cx: 274, cy: 258, rx: 203, ry: 212 };
const NAME = { x0: 66, y0: 505, x1: 486, y1: 551 };
const ROLE = { x0: 194, y0: 558, x1: 360, y1: 587 };
const DESC = { x0: 64, y0: 622, x1: 482, y1: 730 };

const centered = { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const };

/** Where a treasure can be used, shown on the small plate under the name. */
function usage(kind: ItemKind): string {
  const u = ITEMS[kind].usableIn;
  if (kind === 'shield') return 'Skarb · reakcja';
  if (u.includes('map') && u.includes('battle')) return 'Skarb · mapa i bitwa';
  return u.includes('map') ? 'Skarb · mapa' : 'Skarb · bitwa';
}

export function TreasureCard({ kind, width = 300 }: { kind: ItemKind; width?: number }) {
  const def = ITEMS[kind];
  const scale = width / FRAME_W;
  const nameSize = Math.min(38, ((NAME.x1 - NAME.x0 - 40) / Math.max(10, def.name.length)) * 1.95);
  return (
    <div className="card-sheen" style={{ position: 'relative', width, height: CARD_H * scale, flex: 'none', filter: 'drop-shadow(0 14px 20px rgba(0,0,0,0.6))' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: FRAME_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: '0 0', fontFamily: "'Crimson Pro', Georgia, serif" }}>
        <img src={asset('cards/frames/treasure.png')} alt="" style={{ position: 'absolute', inset: 0, width: FRAME_W, height: CARD_H }} />
        <img
          src={asset(`cards/treasures/${kind}.jpg`)}
          alt={def.name}
          style={{ position: 'absolute', left: ART.cx - ART.rx, top: (ART.cy - ART.ry) * SY, width: ART.rx * 2, height: ART.ry * 2 * SY, borderRadius: '50%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', left: ART.cx - ART.rx, top: (ART.cy - ART.ry) * SY, width: ART.rx * 2, height: ART.ry * 2 * SY, borderRadius: '50%', boxShadow: 'inset 0 0 22px 6px rgba(40,22,4,0.55)' }} />
        <div style={{ ...at(NAME), ...centered, fontWeight: 800, fontSize: nameSize, lineHeight: 1, color: '#20160C', whiteSpace: 'nowrap' }}>{def.name}</div>
        <div style={{ ...at(ROLE), ...centered, fontWeight: 800, fontSize: usage(kind).length > 16 ? 14 : 16, letterSpacing: '0.01em', textTransform: 'uppercase', color: '#2B1D10', whiteSpace: 'nowrap', padding: '0 6px', boxSizing: 'border-box' }}>{usage(kind)}</div>
        <div style={{ ...at(DESC), ...centered, padding: '0 28px', boxSizing: 'border-box', fontWeight: 600, fontSize: def.text.length > 70 ? 19 : 21, lineHeight: 1.2, color: '#1A1209' }}><StatText text={def.text} /></div>
      </div>
    </div>
  );
}
