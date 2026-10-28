// How a unit's state shows in battle: effect badges on its token, the list of effects on the side panel
// and the right-button card.

import type { BattleUnit } from '../engine/types';
import { UNITS } from '../engine/data';
import { unitSpeed } from '../engine/battle';
import { asset, HpBar } from './common';
import { Marker, StatIcon, StatText, type MarkerName } from './markers';
import { UnitCard } from './UnitCard';

export interface StatusInfo {
  label: string;
  glyph: string;
  /** Board-game marker for this state, when there is one. */
  marker?: MarkerName;
  buff: boolean;
  /** Small value shown on the badge (e.g. −2, +1). */
  value?: string;
}

/** Visible effects on a unit, so rules like Pajęcze Sidła never look like a frozen turn. */
export function statusList(u: BattleUnit): StatusInfo[] {
  const s = u.status;
  const out: StatusInfo[] = [];
  // A marker carries its own number; the badge repeats it only when the value differs.
  if (s.rootedNext) out.push({ label: 'Unieruchomiony w następnej aktywacji (Pajęcze Sidła)', glyph: 'sWeb', marker: 'rooted', buff: false });
  if (s.slowNext) out.push({ label: `−${s.slowNext} S w następnej aktywacji (Splątane Korzenie)`, glyph: 'sRoot', marker: 'slowed', buff: false, value: s.slowNext !== 2 ? `−${s.slowNext}` : undefined });
  if (s.cursedNext) out.push({ label: `−${s.cursedNext} A przy następnym ataku (Złowroga Klątwa)`, glyph: 'sSkull', marker: 'cursed', buff: false, value: s.cursedNext !== 1 ? `−${s.cursedNext}` : undefined });
  if (s.nextAttackBonus) out.push({ label: `+${s.nextAttackBonus} A przy następnym ataku`, glyph: 'sBlade', marker: 'attack_up', buff: true, value: s.nextAttackBonus !== 1 ? `+${s.nextAttackBonus}` : undefined });
  if (s.shieldArmed) out.push({ label: 'Tarcza Strażnika: neguje następny atak', glyph: 'sGuard', marker: 'shield', buff: true });
  if (u.maxHp > UNITS[u.defId].hp) out.push({ label: `+${u.maxHp - UNITS[u.defId].hp} maks. Ż do końca bitwy (Eliksir Żywotności)`, glyph: 'sGuard', marker: 'vitality', buff: true, value: u.maxHp - UNITS[u.defId].hp !== 4 ? `+${u.maxHp - UNITS[u.defId].hp}` : undefined });
  if (s.battleAttackBonus) out.push({ label: `+${s.battleAttackBonus} A do końca bitwy`, glyph: 'sBlade', buff: true, value: `+${s.battleAttackBonus}` });
  if (s.battleSpeedBonus) out.push({ label: `+${s.battleSpeedBonus} S do końca bitwy`, glyph: 'sBoltG', marker: 'speed_up', buff: true, value: s.battleSpeedBonus !== 3 ? `+${s.battleSpeedBonus}` : undefined });
  if (s.damageReduction) out.push({ label: `−${s.damageReduction} otrzymanych obrażeń`, glyph: 'sStone', buff: true, value: `−${s.damageReduction}` });
  return out;
}

/** Small gilded medallion: green for buffs, crimson for debuffs, value on a parchment tab. */
export function StatusBadge({ st, size = 22 }: { st: StatusInfo; size?: number }) {
  return (
    <span title={st.label} style={{ position: 'relative', width: size, height: size, flex: 'none', display: 'inline-block', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.55))', animation: 'pop-in 0.3s ease-out both' }}>
      {st.marker ? (
        <img src={asset(`markers/${st.marker}.png`)} alt="" style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
      ) : (
        <svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="19" fill="url(#mRing)" stroke="#1E1204" strokeWidth="1.4" />
          <circle cx="20" cy="20" r="15.4" fill={st.buff ? 'url(#stBuff)' : 'url(#stDebuff)'} stroke="#1E1204" strokeWidth="1" />
          <use href={`#${st.glyph}`} />
        </svg>
      )}
      {st.value && (
        <span
          className="parch"
          style={{ position: 'absolute', left: '50%', bottom: -7, transform: 'translateX(-50%)', padding: '0 3px', borderRadius: 3, border: '1px solid #B88A35', fontSize: 10, fontWeight: 800, lineHeight: '11px', color: st.buff ? '#1D5233' : '#7A1418', whiteSpace: 'nowrap' }}
        >
          {st.value}
        </span>
      )}
    </span>
  );
}

/** Right button on a unit in battle: its card with the current values, Życie and every effect on it. */
export function UnitDetails({ u }: { u: BattleUnit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 280 }}>
      <UnitCard unitId={u.defId} width={280} hp={u.hp} attack={UNITS[u.defId].attack + u.status.battleAttackBonus} speed={unitSpeed(u)} />
      <div className="plate slate" style={{ padding: '8px 12px', borderRadius: 10, boxShadow: '0 0 0 2px #B88A35, 0 8px 18px rgba(0,0,0,0.6)' }}>
        <HpBar hp={u.hp} max={u.maxHp} />
        <div style={{ fontSize: 15, color: '#F7EDD2', marginTop: 6 }}>
          <StatIcon stat="Ż" light /> {u.hp}/{u.maxHp}
          {u.abilityUsed && (
            <>
              {' · '}
              <Marker name="ability_used" size={18} title="Zdolność zużyta" /> zdolność zużyta
            </>
          )}
        </div>
        {statusList(u).length === 0 && !u.abilityUsed && <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>Bez dodatkowych efektów.</div>}
        <StatusChips u={u} />
      </div>
    </div>
  );
}

export function StatusChips({ u }: { u: BattleUnit }) {
  const list = statusList(u);
  if (!list.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
      {list.map((x) => (
        <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, lineHeight: 1.15, color: x.buff ? '#BFE6B0' : '#F2B6AA' }}>
          <StatusBadge st={{ ...x, value: undefined }} size={18} />
          <StatText text={x.label} />
        </div>
      ))}
    </div>
  );
}
