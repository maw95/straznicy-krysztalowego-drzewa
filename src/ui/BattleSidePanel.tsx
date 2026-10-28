// A side of the battle next to the arena: its units with Życie, Atak, Szybkość and effects, and its reserve.

import { FACTION_NAMES, UNITS, type FactionId, type Side } from '../engine/data';
import { unitSpeed } from '../engine/battle';
import type { BattleUnit, GameState } from '../engine/types';
import { Frame, HpBar, Portrait, Ribbon, SIDE_RING } from './common';
import { Marker, StatIcon } from './markers';
import { details } from './details';
import { StatusChips, UnitDetails } from './battleStatus';

interface Props {
  s: Side;
  state: GameState;
  active: BattleUnit | null;
  onUnit: (u: BattleUnit) => void;
}

export function SidePanel({ s, state, active, onUnit }: Props) {
  const b = state.battle!;
  const units = Object.values(b.units).filter((u) => u.side === s && !u.swappedOut);
  return (
    <Frame className="side side-battle" innerStyle={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Ribbon side={s}>{FACTION_NAMES[s]}</Ribbon>
      {units.map((u) => {
        const isActive = active?.id === u.id;
        return (
          <button key={u.id} className="btn" onClick={() => onUnit(u)} {...details(() => <UnitDetails u={u} />)} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', opacity: u.alive ? 1 : 0.5 }}>
            <Portrait unitId={u.defId} size={50} ring={SIDE_RING[s]} dim={!u.alive} glow={isActive ? '0 0 0 2.5px #9EE4FF, 0 0 10px 3px rgba(158,228,255,0.6)' : undefined} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#F7EDD2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{UNITS[u.defId].name}</div>
              <HpBar hp={u.hp} max={u.maxHp} />
              <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6 }}>
                <StatIcon stat="Ż" light /> {u.hp}/{u.maxHp} · <StatIcon stat="A" light /> {UNITS[u.defId].attack + u.status.battleAttackBonus} · <StatIcon stat="S" light /> {unitSpeed(u)}
                {u.abilityUsed && (
                  <>
                    {' · '}
                    <Marker name="ability_used" size={16} title="Zdolność zużyta" /> zużyta
                  </>
                )}
              </div>
              <StatusChips u={u} />
            </div>
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      {s !== 'neutral' && (
        <div style={{ fontSize: 14, color: 'var(--muted)', padding: '0 0 10px 8px' }}>
          Rezerwa: {reserveOf(state, s).map((id) => UNITS[id].name).join(', ') || '—'}
        </div>
      )}
    </Frame>
  );
}

/** Supports of a faction still alive but not on the arena. */
export const reserveOf = (state: GameState, s: FactionId) => state.factions[s].supportsAlive.filter((id) => !state.battle!.units[id]);
