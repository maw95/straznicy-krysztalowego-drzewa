// The bar under the arena: the active unit and what it can do, its ability and end buttons, the initiative queue.

import { FACTION_NAMES, UNITS, type FactionId } from '../engine/data';
import { abilityOf, livingUnits, unitSpeed } from '../engine/battle';
import type { Action, BattleState, BattleUnit, GameState } from '../engine/types';
import { asset, Frame, Medal, Portrait, SIDE_RING } from './common';
import { statusList, StatusBadge } from './battleStatus';

/** The line under the active unit's name: what the player can do now. */
export function activationHint(b: BattleState, o: { deploySide: FactionId | null; picked: string | null; myTurn: boolean; moves: number; targets: number }): string {
  if (b.stage === 'deploy') {
    if (!o.deploySide) return `${FACTION_NAMES[b.needsDeploy[0]]} ustawia jednostki…`;
    return o.picked ? 'Wskaż złote pole w swojej kolumnie' : 'Kliknij jednostkę, potem pole';
  }
  if (!o.myTurn) return 'Ruch przeciwnika…';
  const act = b.activation!;
  const active = b.units[act.unitId];
  if (act.hop) return 'Wybierz pole odskoku';
  if (!act.acted && active.status.rootedNext) return o.targets ? 'Unieruchomiony — może tylko atakować' : 'Unieruchomiony (Pajęcze Sidła) — zakończ';
  if (!act.acted && o.moves === 0 && o.targets === 0) return 'Brak ruchu i celu — zakończ';
  if (act.moveOnly) return 'Dodatkowy ruch';
  if (act.attacked) return 'Atak wykonany';
  if (act.moved) return o.targets ? 'Wybierz cel ataku' : 'Brak celu — zakończ';
  return 'Ruch, potem atak';
}

interface Props {
  state: GameState;
  active: BattleUnit | null;
  hint: string;
  myTurn: boolean;
  deploySide: FactionId | null;
  placing: Record<string, string>;
  attackAbility: boolean;
  useAbility: boolean;
  setUseAbility: (v: boolean) => void;
  freeAbilityReady: boolean;
  freeAbility: boolean;
  setFreeAbility: (v: boolean) => void;
  onAction: (a: Action) => void;
  reset: () => void;
  footer: React.ReactNode;
}

export function ActivationBar({ state, active, hint, myTurn, deploySide, placing, attackAbility, useAbility, setUseAbility, freeAbilityReady, freeAbility, setFreeAbility, onAction, reset, footer }: Props) {
  const b = state.battle!;
  const act = b.activation;
  const ab = active ? abilityOf(active) : null;
  // Initiative order of the round (fastest first); units that already acted are dimmed.
  const queue = b.order.map((id, i) => ({ id, done: i < b.index, current: id === act?.unitId })).filter((q) => b.units[q.id]?.alive);
  /** Next round's initiative (living units by Speed). */
  const nextRound = livingUnits(b).sort((x, y) => unitSpeed(y) - unitSpeed(x)).map((u) => u.id);
  return (
    <Frame className="bar sticky-mobile" style={{ height: 112 }} innerStyle={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {active && (
          <span className="hide-mobile" style={{ position: 'relative' }}>
            <Portrait unitId={active.defId} size={56} ring={SIDE_RING[active.side]} glow="0 0 0 2.5px #9EE4FF" />
            {/* The active unit's markers (e.g. the Gold Dragon's +3 after Słoneczny Blask) on the portrait's lower edge. */}
            <span style={{ position: 'absolute', left: '50%', bottom: -8, transform: 'translateX(-50%)', display: 'flex', gap: 1 }}>
              {statusList(active).map((st) => <StatusBadge key={st.label} st={{ ...st, value: undefined }} size={20} />)}
            </span>
          </span>
        )}
        <div className="act-info" style={{ width: 170 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#F3D27A', lineHeight: 1.1 }}>
            {b.stage === 'deploy' ? 'Ustawienie wojsk' : active ? UNITS[active.defId].name : '—'}
            {/* Phones hide the title over the arena: the round is here instead. */}
            {b.stage !== 'deploy' && <span className="show-mobile" style={{ display: 'none', fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>Runda bitwy {b.round}</span>}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>{hint}</div>
        </div>
      </div>
      {deploySide && (
        <button
          className="btn prim"
          style={{ height: 60, padding: '0 22px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 19 }}
          onClick={() => onAction({ type: 'deployUnits', faction: deploySide, positions: placing })}
        >
          <Medal fill="mRed" glyph="gSwords" size={32} />
          Gotowe — do bitwy
        </button>
      )}
      {myTurn && active && (
        <div style={{ display: 'flex', gap: 8 }}>
          {attackAbility && (
            <button className={`btn plate parch act-btn ${useAbility ? 'on' : ''}`} style={{ width: 120, height: 74, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }} onClick={() => setUseAbility(!useAbility)} title={UNITS[active.defId].abilityText}>
              <img src={asset(`cards/abilities/${abilityOf(active)}.png`)} alt="" style={{ width: 34, height: 34 }} />
              <span style={{ fontSize: 13, lineHeight: 1.05, textAlign: 'center' }}>{UNITS[active.defId].abilityName}{useAbility ? ' ✓' : ''}</span>
            </button>
          )}
          {freeAbilityReady && (
            <button
              className={`btn plate parch act-btn ${freeAbility ? 'on' : ''}`}
              style={{ width: 120, height: 74, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
              title={UNITS[active.defId].abilityText}
              onClick={() => (ab === 'sunburst' ? onAction({ type: 'battleAbility' }) : setFreeAbility(!freeAbility))}
            >
              <img src={asset(`cards/abilities/${abilityOf(active)}.png`)} alt="" style={{ width: 34, height: 34 }} />
              <span style={{ fontSize: 13, lineHeight: 1.05, textAlign: 'center' }}>{UNITS[active.defId].abilityName}</span>
            </button>
          )}
          <button className="btn prim act-btn" style={{ width: 96, height: 74, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, fontSize: 15 }} onClick={() => { reset(); onAction({ type: 'endActivation' }); }}>
            <Medal fill="mGreen" glyph="gHourglass" size={30} />
            {act!.hop ? 'Pomiń' : 'Koniec'}
          </button>
        </div>
      )}
      <div className="well hide-mobile" style={{ height: 76, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden', maxWidth: 520 }}>
        <div className="lbl" style={{ marginRight: 2 }}>Kolejka</div>
        {queue
          .filter((q) => !q.done || q.current)
          .map((q) => (
            <div key={q.id} style={{ position: 'relative', flex: 'none' }} title={UNITS[b.units[q.id].defId].name}>
              <Portrait unitId={b.units[q.id].defId} size={q.current ? 48 : 38} ring={SIDE_RING[b.units[q.id].side]} glow={q.current ? '0 0 0 2.5px #9EE4FF' : undefined} />
              <div className="plate parch" style={{ position: 'absolute', right: -6, bottom: -6, width: 20, height: 18, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>{unitSpeed(b.units[q.id])}</div>
            </div>
          ))}
        <div title="Następna runda" style={{ flex: 'none', alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 4, margin: '0 2px', color: '#E7CF8F', fontWeight: 800, fontSize: 13 }}>
          <div style={{ width: 2, height: '60%', background: 'linear-gradient(#0000, #B88A35, #0000)' }} />R{b.round + 1}
        </div>
        {nextRound.map((id) => (
          <div key={`n${id}`} style={{ flex: 'none', opacity: 0.6 }} title={`${UNITS[b.units[id].defId].name} — następna runda`}>
            <Portrait unitId={b.units[id].defId} size={30} ring={SIDE_RING[b.units[id].side]} />
          </div>
        ))}
      </div>
      <div className="footer-slot" style={{ flex: 1, minWidth: 0 }}>{footer}</div>
    </Frame>
  );
}
