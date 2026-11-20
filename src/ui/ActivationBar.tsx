// The bar under the arena: the active unit and what it can do, its ability and end buttons, the initiative queue.

import { abilityTextFor, FACTION_NAMES, scaleText, UNITS, type TeamId } from '../engine/data';
import { FACTION_MECHANICS } from '../engine/empire';
import { abilityOf, CELL_ABILITIES, livingUnits, unitSpeed, UNTARGETED_ABILITIES } from '../engine/battle';
import { isDigital, type Action, type BattleState, type BattleUnit, type GameState } from '../engine/types';
import { abilityArt, asset, Frame, Medal, Portrait, SIDE_RING } from './common';
import { statusList, StatusBadge } from './battleStatus';

/** The line under the active unit's name: what the player can do now. */
export function activationHint(b: BattleState, o: { deploySide: TeamId | null; picked: string | null; trapMode?: boolean; myTurn: boolean; moves: number; targets: number; sideName?: (t: TeamId) => string }): string {
  if (b.stage === 'deploy') {
    if (!o.deploySide) return `${o.sideName ? o.sideName(b.needsDeploy[0]) : FACTION_NAMES[b.needsDeploy[0]]} ustawia jednostki…`;
    if (b.rearrange) return `Iskra: przestaw najwyżej ${FACTION_MECHANICS.sparkRearrange} jednostki (kliknij jednostkę, potem pole)`;
    return o.trapMode ? 'Kliknij pole swojej połowy, by położyć sidło' : o.picked ? 'Wskaż złote pole w swojej kolumnie' : 'Kliknij jednostkę, potem pole';
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
  deploySide: TeamId | null;
  placing: Record<string, string>;
  /** The Free Companies' traps while deploying: how many may be laid, the cells chosen, and the mode in which a click on the arena lays one. */
  trapSlots?: number;
  traps?: string[];
  trapMode?: boolean;
  setTrapMode?: (v: boolean) => void;
  attackAbility: boolean;
  useAbility: boolean;
  setUseAbility: (v: boolean) => void;
  freeAbilityReady: boolean;
  freeAbility: boolean;
  setFreeAbility: (v: boolean) => void;
  /** Piaskowa Brama, Lustro Wydm: the ally picked (the next click is the cell; without a cell the engine takes the best one). */
  allyPick?: string | null;
  /** Pałac Mirażu (third level): the active unit may swap places with its mirage now. */
  mirageSwap?: boolean;
  onAction: (a: Action) => void;
  reset: () => void;
  footer: React.ReactNode;
}

export function ActivationBar({ state, active, hint, myTurn, deploySide, placing, trapSlots = 0, traps = [], trapMode = false, setTrapMode, attackAbility, useAbility, setUseAbility, freeAbilityReady, freeAbility, setFreeAbility, allyPick = null, mirageSwap = false, onAction, reset, footer }: Props) {
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
            {/* The title over the arena is gone: the round is here, on every screen. */}
            {b.stage !== 'deploy' && <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>Runda bitwy {b.round}</span>}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>{hint}</div>
        </div>
      </div>
      {deploySide && trapSlots > 0 && (
        <button className={`btn plate parch act-btn ${trapMode ? 'on' : ''}`} data-trap-mode style={{ height: 60, padding: '0 14px', fontSize: 15 }} title="Sidła są ukryte przed wrogiem. Kliknij pole swojej połowy, by położyć sidło (albo je zdjąć); nieustawione położy za ciebie komputer." onClick={() => { setTrapMode?.(!trapMode); }}>
          Sidła {traps.length}/{trapSlots}{trapMode ? ' ✓' : ''}
        </button>
      )}
      {deploySide && (
        <button
          className="btn prim"
          style={{ height: 60, padding: '0 22px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 19 }}
          onClick={() => onAction({ type: 'deployUnits', faction: deploySide, positions: placing, ...(trapSlots > 0 ? { traps } : {}) })}
        >
          <Medal fill="mRed" glyph="gSwords" size={32} />
          Gotowe — do bitwy
        </button>
      )}
      {myTurn && active && (
        <div style={{ display: 'flex', gap: 8 }}>
          {attackAbility && (
            <button className={`btn plate parch act-btn ${useAbility ? 'on' : ''}`} style={{ width: 120, height: 74, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }} onClick={() => setUseAbility(!useAbility)} title={scaleText(abilityTextFor(active.defId, isDigital(state.rules)), state.rules.statScale ?? 1, state.rules.hpScale)}>
              <img src={asset(`cards/abilities/${abilityArt(abilityOf(active))}.png`)} alt="" style={{ width: 34, height: 34 }} />
              <span style={{ fontSize: 13, lineHeight: 1.05, textAlign: 'center' }}>{UNITS[active.defId].abilityName}{useAbility ? ' ✓' : ''}</span>
            </button>
          )}
          {freeAbilityReady && (
            <button
              className={`btn plate parch act-btn ${freeAbility ? 'on' : ''}`}
              style={{ width: 120, height: 74, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
              title={scaleText(abilityTextFor(active.defId, isDigital(state.rules)), state.rules.statScale ?? 1, state.rules.hpScale)}
              onClick={() => (ab && UNTARGETED_ABILITIES.includes(ab) ? onAction({ type: 'battleAbility' }) : setFreeAbility(!freeAbility))}
            >
              <img src={asset(`cards/abilities/${abilityArt(abilityOf(active))}.png`)} alt="" style={{ width: 34, height: 34 }} />
              <span style={{ fontSize: 13, lineHeight: 1.05, textAlign: 'center' }}>{UNITS[active.defId].abilityName}</span>
            </button>
          )}
          {freeAbility && allyPick && (
            <button className="btn plate parch act-btn" data-auto-cell style={{ width: 96, height: 74, fontSize: 13 }} title="Wskaż pole na arenie albo wybierz najlepsze pole za mnie." onClick={() => { onAction({ type: 'battleAbility', targetId: allyPick }); reset(); }}>Najlepsze pole</button>
          )}
          {mirageSwap && (
            <button className="btn plate parch act-btn" data-mirage-swap style={{ width: 96, height: 74, fontSize: 13 }} title="Pałac Mirażu: raz na bitwę jednostka zamienia się miejscami ze swoim mirażem." onClick={() => onAction({ type: 'battleMirageSwap' })}>Zamiana z mirażem</button>
          )}
          {freeAbility && ab && CELL_ABILITIES.includes(ab) && (
            <button className="btn plate parch act-btn" data-auto-cell style={{ width: 96, height: 74, fontSize: 13 }} title="Zdolność działa na polu: wskaż je na arenie albo wybierz najlepsze pole za mnie." onClick={() => onAction({ type: 'battleAbility' })}>Najlepsze pole</button>
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
