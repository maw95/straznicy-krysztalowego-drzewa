// The barracks as a screen of its own (the page of the settlement screen): a gold-framed shelf with a column per unit tier and the cards of the units in
// it (tier 1: the three supports; tiers 2-6: the units, two to choose from at the dwellings), under each card its state and button (recruit, build the
// dwelling, in the team, shut out). Selecting a card shows the animated sprite of the unit with its numbers and ability on the right.

import { useState } from 'react';
import { abilityTextFor, battleStats, UNITS } from '../engine/data';
import { DWELLING_COST, DWELLING_NAMES, dwellingOf, dwellingReady, hasUnit, mayRecruit, needsDwelling, recruitsOf, resOf, goldOf, canPay } from '../engine/kingdom';
import type { TeamId } from '../engine/data';
import type { Settlement } from '../engine/kingdom';
import type { Action, GameState } from '../engine/types';
import { CostIcons } from './resources';
import { RuleText, useScales } from './statScale';
import { UnitCard } from './UnitCard';
import { UnitSprite } from './UnitSprite';

export function BarracksScreen({ state, s, faction, act }: { state: GameState; s: Settlement; faction: TeamId; act: (a: Action) => void }) {
  const [scale, hpScale] = useScales();
  const recruits = recruitsOf(state, faction);
  const tiers = [...new Set(recruits.map((r) => r.tier))];
  const mayHire = mayRecruit(s, faction);
  const gold = goldOf(state, faction);
  const dust = resOf(state, faction).dust;
  const garrison = s.garrison ?? [];
  const fs = state.factions[faction];
  const [pick, setPick] = useState<string>(recruits.find((r) => r.tier === 2)?.id ?? recruits[0].id);
  const sel = recruits.find((r) => r.id === pick) ?? recruits[0];
  const stats = battleStats(sel.id, true, scale, hpScale);
  const have = { gold, res: resOf(state, faction) };

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
          {DWELLING_NAMES[r.id]} <CostIcons cost={price} have={have} size={15} light />
        </button>
      );
    }
    if (!dwellingReady(state, faction, r)) return <i className="bk-state no" data-excluded={r.id}>wybrano: {DWELLING_NAMES[dwellingOf(state, faction, r.tier)!]}</i>;
    const cost = { gold: r.cost, ...(r.dust ? { dust: r.dust } : {}) };
    return (
      <button className="btn prim" data-recruit={r.id} disabled={!mayHire || locked || gold < r.cost || dust < (r.dust ?? 0)} title={locked ? lockText : undefined} onClick={(e) => { e.stopPropagation(); act({ type: 'kingdomRecruit', settlementId: s.id, unitId: r.id }); }}>
        Rekrutuj <CostIcons cost={cost} have={have} size={15} light />
      </button>
    );
  };

  return (
    <div className="gf barracks-frame" data-panel="barracks">
      <div className="gi slate barracks-inner">
        {!mayHire && <i className="bk-note">Ta osada należy do obcej frakcji: nie rekrutujesz tu jednostek.</i>}
        <div className="bk-shelf">
          {tiers.map((tier) => (
            <div key={tier} className="bk-col" data-tier={tier}>
              <div className="bk-tier">poziom {tier}</div>
              {recruits.filter((r) => r.tier === tier).map((r) => {
                const out = needsDwelling(state, r) && !dwellingReady(state, faction, r) && dwellingOf(state, faction, r.tier) !== undefined;
                return (
                  <div key={r.id} className={`bk-unit ${pick === r.id ? 'on' : ''} ${out ? 'out' : ''}`} data-unit={r.id} onClick={() => setPick(r.id)}>
                    <button className="bk-card" aria-label={UNITS[r.id].name} onClick={() => setPick(r.id)}><UnitCard unitId={r.id} width={106} digital /></button>
                    <div className="bk-ctl">{control(r)}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="bk-detail" data-bk-detail={sel.id}>
          <UnitSprite unitId={sel.id} size={230} />
          <div className="bk-name">{UNITS[sel.id].name}</div>
          <div className="bk-tier-line">poziom {sel.tier}{needsDwelling(state, sel) ? ` · ${DWELLING_NAMES[sel.id]}` : ''}</div>
          <div className="bk-stats"><span>Życie <b>{stats.hp}</b></span><span>Atak <b>{stats.attack}</b></span><span>Szybkość <b>{stats.speed}</b></span></div>
          <div className="bk-ability"><b>{UNITS[sel.id].abilityName}</b><RuleText text={abilityTextFor(sel.id, true)} /></div>
        </div>
      </div>
    </div>
  );
}
