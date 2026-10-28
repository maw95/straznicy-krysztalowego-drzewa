// Board battle variant: a 1-on-1 duel shown over the adventure map.
// Nobody moves; the active unit attacks, uses its ability or a treasure, or passes.

import { useEffect, useRef, useState } from 'react';
import { FACTION_NAMES, ITEMS, UNITS, type FactionId, type ItemKind } from '../engine/data';
import { abilityActive, abilityOf, attackTargets, ATTACK_ABILITIES, canUseBattleItem, FREE_ABILITIES, unitSpeed } from '../engine/battle';
import type { Action, BattleUnit, GameState } from '../engine/types';
import { asset, Frame, HpBar, Medal, Ribbon } from './common';
import { DamageDrop, DieFace, LastAttack, Marker, StatIcon } from './markers';
import { UnitCard } from './UnitCard';

/** Treasures that make sense with only two units on the field, and who they target. */
const DUEL_ITEMS: Partial<Record<ItemKind, 'self' | 'enemy' | 'none'>> = {
  heal: 'self',
  seed: 'none',
  damage_scroll: 'enemy',
  lightning: 'enemy',
  sword: 'self',
  shield: 'self',
  vitality: 'self',
  boots: 'self',
  stone: 'self',
  courage_horn: 'self',
};

interface Props {
  state: GameState;
  canAct: boolean;
  onAction: (a: Action) => void;
  footer: React.ReactNode;
}

export function DuelView({ state, canAct, onAction, footer }: Props) {
  const b = state.battle!;
  const act = b.activation;
  const active = act ? b.units[act.unitId] : null;
  const units = [b.units[b.attackerHero], b.units[b.defenderHero ?? b.neutralId!]];
  const myTurn = canAct && b.stage === 'fight' && Boolean(active);
  const [useAbility, setUseAbility] = useState(false);

  // Floating damage numbers per unit.
  const lastHp = useRef<Record<string, number>>({});
  const [floats, setFloats] = useState<Array<{ key: number; id: string; amount: number }>>([]);
  useEffect(() => {
    const fresh: Array<{ key: number; id: string; amount: number }> = [];
    for (const u of units) {
      const prev = lastHp.current[u.id];
      if (prev !== undefined && prev !== u.hp) fresh.push({ key: Math.random(), id: u.id, amount: u.hp - prev });
      lastHp.current[u.id] = u.hp;
    }
    if (!fresh.length) return;
    setFloats((f) => [...f, ...fresh]);
    const t = window.setTimeout(() => setFloats((f) => f.filter((x) => !fresh.includes(x))), 1150);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b]);

  // Die rolls: each new attack shows its die by the card that took the blow.
  const rollSeen = useRef(b.rolls?.[b.rolls.length - 1]?.seq ?? 0);
  const [rollPops, setRollPops] = useState<Array<{ key: number; id: string; die: number | null; damage: number }>>([]);
  useEffect(() => {
    const rolls = b.rolls ?? [];
    const latest = rolls[rolls.length - 1]?.seq ?? 0;
    if (latest < rollSeen.current) rollSeen.current = 0;
    const pops = rolls.filter((r) => r.seq > rollSeen.current && (r.die !== null || r.damage === 0)).map((r) => ({ key: Math.random(), id: r.targetId, die: r.die, damage: r.damage }));
    rollSeen.current = latest;
    if (!pops.length) return;
    setRollPops((p) => [...p, ...pops]);
    window.setTimeout(() => setRollPops((p) => p.filter((x) => !pops.includes(x))), 2200);
  }, [b]);
  const lastRoll = b.rolls?.[b.rolls.length - 1];

  const enemy = active ? units.find((u) => u.id !== active.id)! : null;
  const canAttack = Boolean(myTurn && active && !act!.attacked && !act!.moveOnly && attackTargets(state, active).length);
  const ab = active ? abilityOf(active) : null;
  const abilityReady = Boolean(active && !active.abilityUsed && abilityActive(state));
  const attackAbility = abilityReady && ab !== null && ATTACK_ABILITIES.includes(ab);
  const freeAbility = abilityReady && ab !== null && FREE_ABILITIES.includes(ab);
  const side: FactionId | null = active && active.side !== 'neutral' ? active.side : null;
  const items = side && myTurn && canUseBattleItem(state, side) ? state.factions[side].inventory.map((id) => state.items[id]).filter((it) => DUEL_ITEMS[it.kind]) : [];

  const useItem = (id: string) => {
    const mode = DUEL_ITEMS[state.items[id].kind];
    if (mode === 'self') onAction({ type: 'battleItem', itemId: id, targetId: active!.id, targetIds: [active!.id] });
    else if (mode === 'enemy') onAction({ type: 'battleItem', itemId: id, targetId: enemy!.id, targetIds: [enemy!.id] });
    else onAction({ type: 'battleItem', itemId: id });
  };

  const fighter = (u: BattleUnit) => {
    const isActive = active?.id === u.id;
    return (
      <div key={u.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: u.alive ? 1 : 0.4, transition: 'opacity 0.4s' }}>
        <div className={isActive ? 'active-token' : undefined} style={{ borderRadius: 14, boxShadow: isActive ? '0 0 0 3px #9EE4FF, 0 0 24px 6px rgba(158,228,255,0.55)' : 'none', transition: 'box-shadow 0.3s' }}>
          <UnitCard unitId={u.defId} width={Math.min(230, (window.innerWidth - 90) / 2)} hp={u.hp} attack={UNITS[u.defId].attack + u.status.battleAttackBonus} speed={unitSpeed(u)} />
        </div>
        <div style={{ width: '90%' }}>
          <HpBar hp={u.hp} max={u.maxHp} />
        </div>
        <div style={{ fontSize: 15, color: 'var(--muted)', textAlign: 'center' }}>
          <StatIcon stat="Ż" light /> {u.hp}/{u.maxHp}
          {u.abilityUsed && (
            <>
              {' · '}
              <Marker name="ability_used" size={18} title="Zdolność zużyta" /> zdolność zużyta
            </>
          )}
        </div>
        {rollPops
          .filter((p) => p.id === u.id)
          .map((p) => (
            <div key={p.key} className="roll-pop" style={{ left: p.damage > 0 ? '28%' : '50%', top: '35%' }}>
              {p.die !== null && <DieFace value={p.die} size={40} />}
              {p.damage === 0 && <DamageDrop amount={0} size={44} />}
            </div>
          ))}
        {floats
          .filter((f) => f.id === u.id)
          .map((f) => (
            <div key={f.key} className={`dmg ${f.amount > 0 ? 'heal' : ''}`} style={{ top: '35%', fontSize: 40 }}>
              {f.amount > 0 ? `+${f.amount}` : <DamageDrop amount={-f.amount} size={44} />}
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="overlay" style={{ zIndex: 40 }}>
      <div className="modal-body">
        <Frame crest style={{ width: 'min(620px, 96vw)' }} innerStyle={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Ribbon side={units[0].side} style={{ width: 'min(420px, 90%)' }}>{`Pojedynek · runda ${b.round}`}</Ribbon>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {fighter(units[0])}
            <div style={{ fontWeight: 900, fontSize: 30, color: '#F3D27A', textShadow: '0 2px 0 #1E1204' }}>VS</div>
            {fighter(units[1])}
          </div>
          {lastRoll && (
            <div className="plate parch" style={{ padding: '4px 12px', fontSize: 15 }}>
              <LastAttack roll={lastRoll} units={b.units} size={22} />
            </div>
          )}
          <div style={{ fontSize: 16, color: 'var(--muted)', textAlign: 'center' }}>
            {active ? `${UNITS[active.defId].name} (${FACTION_NAMES[active.side]}) — ${myTurn ? 'Twoja kolej' : 'ruch przeciwnika…'}` : 'Koniec pojedynku'}
          </div>
          {myTurn && active && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {attackAbility && (
                <button className={`btn plate parch ${useAbility ? 'on' : ''}`} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }} title={UNITS[active.defId].abilityText} onClick={() => setUseAbility(!useAbility)}>
                  <img src={asset(`cards/abilities/${abilityOf(active)}.png`)} alt="" style={{ width: 30, height: 30 }} />
                  {UNITS[active.defId].abilityName}
                  {useAbility ? ' ✓' : ''}
                </button>
              )}
              {freeAbility && (
                <button
                  className="btn plate parch"
                  style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}
                  title={UNITS[active.defId].abilityText}
                  onClick={() => onAction({ type: 'battleAbility', targetId: ab === 'web' ? enemy!.id : active.id })}
                >
                  <img src={asset(`cards/abilities/${abilityOf(active)}.png`)} alt="" style={{ width: 30, height: 30 }} />
                  {UNITS[active.defId].abilityName}
                </button>
              )}
              <button
                className="btn prim r"
                disabled={!canAttack}
                style={{ padding: '6px 22px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 19 }}
                onClick={() => {
                  onAction({ type: 'battleAttack', targetId: enemy!.id, useAbility: useAbility && attackAbility });
                  setUseAbility(false);
                }}
              >
                <Medal fill="mRed" glyph="gSwords" size={28} />
                Atakuj
              </button>
              <button className="btn prim" style={{ padding: '6px 16px', fontSize: 17 }} onClick={() => onAction({ type: 'endActivation' })}>
                Pas
              </button>
            </div>
          )}
          {items.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {items.map((it) => (
                <button key={it.id} className="btn plate parch" style={{ padding: '4px 10px', fontSize: 14 }} title={ITEMS[it.kind].text} onClick={() => useItem(it.id)}>
                  {ITEMS[it.kind].name}
                </button>
              ))}
            </div>
          )}
          <div style={{ width: '100%' }}>{footer}</div>
        </Frame>
      </div>
    </div>
  );
}
