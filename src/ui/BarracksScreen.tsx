// The barracks as a screen of its own (the page of the settlement screen): a gold-framed shelf with a column per unit tier and the cards of the units in
// it (tier 1: the three supports; tiers 2-6: the units, two to choose from at the dwellings), under each card its state and button (recruit, build the
// dwelling, in the team, shut out). Selecting a card shows the animated sprite of the unit with its numbers and ability on the right.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { UNITS } from '../engine/data';
import { DWELLING_COST, DWELLING_NAMES, dwellingOf, dwellingReady, hasUnit, mayRecruit, needsDwelling, recruitsOf, resOf, goldOf, canPay } from '../engine/kingdom';
import type { TeamId } from '../engine/data';
import type { Settlement } from '../engine/kingdom';
import type { Action, GameState } from '../engine/types';
import { CostIcons } from './resources';
import { UnitCard } from './UnitCard';
import { UnitSprite } from './UnitSprite';

/** The widest card of the shelf's cards (px, the card's height is 1.29 of it) and the room the sprite stage and the big card on the right take. */
const CARD_RATIO = 713 / 551;
const CTL_H = 54;
/** The height the gold and the way back take at the bottom of the right column. */
const FOOT_H = 88;

export function BarracksScreen({ state, s, faction, act, footer }: { state: GameState; s: Settlement; faction: TeamId; act: (a: Action) => void; footer?: ReactNode }) {
  // The sizes follow the room: the shelf has two cards on top of each other at most (the first tier lies in two columns), the cards are as big as they can be.
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ w: 1300, h: 560 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setRoom({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const recruits = recruitsOf(state, faction);
  const tiers = [...new Set(recruits.map((r) => r.tier))];
  const mayHire = mayRecruit(s, faction);
  const gold = goldOf(state, faction);
  const dust = resOf(state, faction).dust;
  const garrison = s.garrison ?? [];
  const fs = state.factions[faction];
  const [pick, setPick] = useState<string>(recruits.find((r) => r.tier === 2)?.id ?? recruits[0].id);
  const sel = recruits.find((r) => r.id === pick) ?? recruits[0];
  const have = { gold, res: resOf(state, faction) };
  const wide = room.w >= 760;
  // A low window (a phone held sideways) keeps only the animated unit on the right: the big card would not fit, and the shelf scrolls.
  const low = room.h < 480;
  const stage = wide ? Math.round(Math.max(low ? 110 : 150, Math.min(room.h * (low ? 0.6 : 0.44), 460))) : Math.round(Math.min(room.w - 40, 240));
  const bigCard = low || !wide ? 0 : Math.round(Math.max(150, Math.min(380, (room.h - stage - 60 - CTL_H - (footer ? FOOT_H : 0)) / CARD_RATIO)));
  const side = wide ? Math.max(bigCard, stage) + 34 : 0;
  // The first tier (three supports) lies in two columns of two rows, or, where the window is tall enough for the bigger cards, in one column of three rows.
  const later = tiers.filter((x) => x > 1).length;
  const fit = (columns: number, rows: number) => Math.min((room.w - side - 40 - columns * 18 - (columns - 1) * 14) / columns, (room.h - 24 - 30 - 40 - rows * 28) / rows / CARD_RATIO);
  const oneColumn = wide && fit(1 + later, 3) > fit(2 + later, 2);
  const cardW = Math.round(Math.max(84, Math.min(380, wide ? Math.max(fit(1 + later, 3), fit(2 + later, 2)) : 106)));

  /** What the shelf shows by a glow instead of a button under each card: in the team (green), can be recruited now (yellow), its dwelling can be built (blue), cannot be (red). */
  const stateOf = (r: (typeof recruits)[number]): { kind: 'team' | 'ready' | 'build' | 'blocked'; hint: string } => {
    if (hasUnit(state, faction, r.id)) return { kind: 'team', hint: 'W drużynie' };
    if (needsDwelling(state, r) && dwellingOf(state, faction, r.tier) === undefined) {
      const locked = r.tier >= 4 && s.buildings.barracks < 2;
      const prevOk = r.tier === 2 || Boolean(dwellingOf(state, faction, r.tier - 1));
      if (!mayHire) return { kind: 'blocked', hint: 'Ta osada należy do obcej frakcji.' };
      if (locked) return { kind: 'blocked', hint: 'Potrzebne rozbudowane koszary.' };
      if (!prevOk) return { kind: 'blocked', hint: `Najpierw: siedlisko poziomu ${r.tier - 1}.` };
      return { kind: 'build', hint: 'Można wybudować siedlisko.' };
    }
    if (!dwellingReady(state, faction, r)) return { kind: 'blocked', hint: `Wybrano inne siedlisko: ${DWELLING_NAMES[dwellingOf(state, faction, r.tier)!]}.` };
    if (!mayHire) return { kind: 'blocked', hint: 'Ta osada należy do obcej frakcji.' };
    if (r.tier >= 4 && s.buildings.barracks < 2) return { kind: 'blocked', hint: 'Potrzebne rozbudowane koszary.' };
    return { kind: 'ready', hint: 'Można zrekrutować.' };
  };
  // The buttons under the cards grow with the cards.
  const ico = Math.round(Math.max(15, Math.min(26, cardW * 0.09)));
  const control = (r: (typeof recruits)[number]) => {
    const locked = r.tier >= 4 && s.buildings.barracks < 2;
    const lockText = 'Potrzebne rozbudowane koszary.';
    if (hasUnit(state, faction, r.id)) {
      const inGarrison = garrison.includes(r.id) || !(fs.supportsAlive.includes(r.id) || fs.supportsDead.includes(r.id));
      return <b className="bk-state ok">{inGarrison ? 'W garnizonie' : 'W drużynie'}</b>;
    }
    if (needsDwelling(state, r) && dwellingOf(state, faction, r.tier) === undefined) {
      const prevOk = r.tier === 2 || Boolean(dwellingOf(state, faction, r.tier - 1));
      const price = DWELLING_COST[r.tier - 2];
      return (
        <button className="btn prim b" data-dwelling={r.id} disabled={!mayHire || locked || !prevOk || !canPay(state, faction, price)} title={locked ? lockText : !prevOk ? `Najpierw: siedlisko poziomu ${r.tier - 1}.` : 'Siedlisko jednej jednostki wyklucza drugą jednostkę tego poziomu do końca gry.'} onClick={(e) => { e.stopPropagation(); act({ type: 'kingdomDwelling', settlementId: s.id, unitId: r.id }); }}>
          {DWELLING_NAMES[r.id]} <CostIcons cost={price} have={have} size={ico} light />
        </button>
      );
    }
    if (!dwellingReady(state, faction, r)) return <i className="bk-state no" data-excluded={r.id}>wybrano: {DWELLING_NAMES[dwellingOf(state, faction, r.tier)!]}</i>;
    const cost = { gold: r.cost, ...(r.dust ? { dust: r.dust } : {}) };
    return (
      <button className="btn prim" data-recruit={r.id} disabled={!mayHire || locked || gold < r.cost || dust < (r.dust ?? 0)} title={locked ? lockText : undefined} onClick={(e) => { e.stopPropagation(); act({ type: 'kingdomRecruit', settlementId: s.id, unitId: r.id }); }}>
        Rekrutuj <CostIcons cost={cost} have={have} size={ico} light />
      </button>
    );
  };

  return (
    <div className="gf barracks-frame" data-panel="barracks">
      <div className="gi slate barracks-inner" ref={box}>
        {!mayHire && <i className="bk-note">Ta osada należy do obcej frakcji: nie rekrutujesz tu jednostek.</i>}
        <div className="bk-left">
        <div className="bk-shelf">
          {tiers.map((tier) => (
            <div key={tier} className={`bk-col ${tier === 1 ? (oneColumn ? 'first one' : 'first') : ''}`} data-tier={tier}>
              <div className="bk-tier">poziom {tier}</div>
              <div className="bk-units">
              {recruits.filter((r) => r.tier === tier).map((r) => {
                const st = stateOf(r);
                return (
                  <div key={r.id} className={`bk-unit st-${st.kind} ${pick === r.id ? 'on' : ''}`} data-unit={r.id} data-state={st.kind} title={`${UNITS[r.id].name}: ${st.hint}`} onClick={() => setPick(r.id)}>
                    <button className="bk-card" aria-label={UNITS[r.id].name} onClick={() => setPick(r.id)}><UnitCard unitId={r.id} width={cardW} digital /></button>
                  </div>
                );
              })}
              </div>
            </div>
          ))}
        </div>
        <div className="bk-legend" data-bk-legend>
          <span><i className="dot st-team" />W drużynie</span>
          <span><i className="dot st-ready" />Do zrekrutowania</span>
          <span><i className="dot st-build" />Siedlisko do zbudowania</span>
          <span><i className="dot st-blocked" />Niedostępne</span>
        </div>
        </div>
        <div className="bk-detail" data-bk-detail={sel.id} style={wide ? { flexBasis: side } : undefined}>
          <UnitSprite unitId={sel.id} size={wide ? side - 14 : stage} height={stage} zoom={stage / 185} />
          {bigCard > 0 && <UnitCard unitId={sel.id} width={bigCard} digital />}
          {bigCard === 0 && <div className="bk-name">{UNITS[sel.id].name}</div>}
          <div className="bk-ctl bk-ctl-side" style={{ width: bigCard > 0 ? bigCard + 2 : Math.min(side || room.w - 40, 280) }}>{control(sel)}</div>
          <div className="bk-tier-line">{s.name} · poziom {sel.tier}{needsDwelling(state, sel) ? ` · ${DWELLING_NAMES[sel.id]}` : ''}</div>
          {footer && <div className="bk-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
