// Markers of the board game (docs/grafika/ikony/znaczniki.png, cut by scripts/assets/markers.py):
// the same tokens the players put on the table, shown on the screen.

import { UNITS } from '../engine/data';
import type { AttackRoll, BattleState } from '../engine/types';
import { asset } from './common';

export type MarkerName = 'ability_used' | 'rooted' | 'slowed' | 'cursed' | 'attack_up' | 'speed_up' | 'shield' | 'vitality' | 'damage_empty';

export function Marker({ name, size = 22, title }: { name: MarkerName; size?: number; title?: string }) {
  return <img src={asset(`markers/${name}.png`)} alt={title ?? ''} title={title} style={{ width: size, height: size, objectFit: 'contain', flex: 'none', verticalAlign: 'middle', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.55))' }} />;
}

/** Damage as one empty drop with the number written on it. */
export function DamageDrop({ amount, size = 34 }: { amount: number; size?: number }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, flex: 'none' }} aria-label={`−${amount} Życia`}>
      <Marker name="damage_empty" size={size} />
      <span
        style={{
          position: 'absolute', left: 0, right: 0, top: '22%', textAlign: 'center', lineHeight: 1,
          fontSize: size * 0.5, fontWeight: 700, color: '#F7E9C4',
          textShadow: '0 0 2px #2A0705, 0 1px 2px #2A0705, 1px 0 2px #2A0705, -1px 0 2px #2A0705',
        }}
      >
        {amount}
      </span>
    </span>
  );
}

/** The −1 / 0 / +1 die as a small ivory cube with the result on top. */
export function DieFace({ value, size = 30 }: { value: number; size?: number }) {
  const label = value > 0 ? '+1' : value < 0 ? '−1' : '0';
  return (
    <span
      title={`Rzut kością: ${label}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
        width: size, height: size, borderRadius: size * 0.22, verticalAlign: 'middle',
        background: 'linear-gradient(145deg, #FFF8E6, #DCCAA2)',
        boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.18), 0 0 0 2px #1E1204, 0 3px 6px rgba(0,0,0,0.6)',
        color: value > 0 ? '#2E7D32' : value < 0 ? '#A2241A' : '#4A3A22',
        fontWeight: 900, fontSize: size * 0.5, lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}

/** One line about the latest attack: who hit whom, the attack, the die and the damage that landed. */
export function LastAttack({ roll, units, size = 22 }: { roll: AttackRoll; units: BattleState['units']; size?: number }) {
  const name = (id: string) => UNITS[units[id].defId].name;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span>{name(roll.attackerId)} → {name(roll.targetId)}:</span>
      <span>Atak {roll.attack}</span>
      {roll.die !== null && (
        <>
          <span>+ kość</span>
          <DieFace value={roll.die} size={size} />
        </>
      )}
      <span>=</span>
      <DamageDrop amount={roll.damage} size={size + 6} />
    </span>
  );
}
