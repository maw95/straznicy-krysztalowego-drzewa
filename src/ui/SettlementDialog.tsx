// The settlement window (level 3 "Królestwo"): a landscape of the faction with the buildings of the settlement as clickable cards, and under it
// the service of the chosen building: recruitment (barracks), artifacts for gold (market), healing the fallen (hospital), the treasury. Actions go to
// the engine (kingdom.ts); the window only asks and shows what the engine allows.

import { useState } from 'react';
import { FACTION_NAMES, UNITS, type FactionId } from '../engine/data';
import { artifactCost, BUILDING_NAMES, BUILDING_TEXTS, goldOf, incomeOf, KINGDOM, marketStock, mayRecruit, nextCost, RECRUITS, type BuildingId } from '../engine/kingdom';
import { ARTIFACT_BY_ID, RARITY_NAMES, SETS } from '../engine/sites';
import type { Action, GameState } from '../engine/types';
import { asset, Portrait, Ribbon } from './common';
import { ArtifactMedal } from './growthUi';
import { RuleText } from './statScale';

const ORDER: BuildingId[] = ['barracks', 'market', 'hospital', 'treasury'];
/** Where the building stands in the landscape (percent of the picture). */
const SPOT: Record<BuildingId, { left: number; top: number }> = {
  barracks: { left: 16, top: 52 },
  market: { left: 40, top: 30 },
  hospital: { left: 64, top: 52 },
  treasury: { left: 84, top: 28 },
};
const ICON: Record<BuildingId, string> = {
  barracks: 'ikony/mapa/camp.webp',
  market: 'ikony/mapa/chest.webp',
  hospital: 'ikony/mapa/shrine.webp',
  treasury: 'ikony/mapa/zloto.webp',
};

export function SettlementDialog({ state, settlementId, faction, onAction, onClose }: { state: GameState; settlementId: string; faction: FactionId; onAction: (a: Action) => void; onClose: () => void }) {
  const s = state.kingdom!.settlements[settlementId];
  const [open, setOpen] = useState<BuildingId>('barracks');
  const gold = goldOf(state, faction);
  const own = s.land === faction;
  const fs = state.factions[faction];
  const buyer = Object.values(state.heroes).find((h) => h.id === state.turnOrder[state.turnIndex] && h.faction === faction);
  const price = (b: BuildingId) => nextCost(s, b);
  const act = (a: Action) => onAction(a);
  const buildButton = (b: BuildingId) => {
    const cost = price(b);
    const level = s.buildings[b];
    if (cost === null) return <b style={{ color: '#2E7A32' }}>Gotowe</b>;
    const blocked = b === 'barracks' && !own;
    return (
      <button className="btn prim" disabled={gold < cost || blocked} title={blocked ? 'Koszary buduje się tylko w osadzie własnej frakcji.' : gold < cost ? `Brakuje ${cost - gold} zł.` : undefined} data-build={b} onClick={() => act({ type: 'kingdomBuild', settlementId: s.id, building: b })} style={{ padding: '4px 16px', fontSize: 17 }}>
        {level === 0 ? 'Zbuduj' : 'Rozbuduj'}: {BUILDING_NAMES[b][level]} ({cost} zł)
      </button>
    );
  };

  const panel = (b: BuildingId) => {
    if (s.buildings[b] === 0) {
      return (
        <div data-panel={b} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <div>{BUILDING_TEXTS[b][0]}</div>
          {buildButton(b)}
        </div>
      );
    }
    const upgrade = s.buildings[b] < KINGDOM.cost[b].length ? (
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 14, color: '#6B4A22' }}>{BUILDING_TEXTS[b][1]}</span>
        {buildButton(b)}
      </div>
    ) : null;
    if (b === 'barracks') {
      const mayHire = mayRecruit(s, faction);
      return (
        <div data-panel="barracks" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!mayHire && <i>Ta osada należy do obcej frakcji: nie rekrutujesz tu jednostek.</i>}
          {RECRUITS[faction].map((r) => {
            const have = fs.supportsAlive.includes(r.id) || fs.supportsDead.includes(r.id);
            const locked = r.tier >= 4 && s.buildings.barracks < 2;
            return (
              <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Portrait unitId={r.id} size={44} />
                <div style={{ flex: 1 }}>
                  <b>{UNITS[r.id].name}</b> <span style={{ fontSize: 13, color: '#6B4A22' }}>poziom {r.tier}</span>
                  <div style={{ fontSize: 14 }}>Życie {UNITS[r.id].hp} · Atak {UNITS[r.id].attack} · Szybkość {UNITS[r.id].speed}</div>
                </div>
                {have ? <b style={{ color: '#2E7A32' }}>W drużynie</b> : (
                  <button className="btn prim" disabled={!mayHire || locked || gold < r.cost} data-recruit={r.id} title={locked ? 'Potrzebne rozbudowane koszary.' : undefined} onClick={() => act({ type: 'kingdomRecruit', settlementId: s.id, unitId: r.id })} style={{ padding: '3px 14px', fontSize: 16 }}>
                    Rekrutuj ({r.cost} zł)
                  </button>
                )}
              </div>
            );
          })}
          {upgrade}
        </div>
      );
    }
    if (b === 'market') {
      const stock = marketStock(state, s);
      return (
        <div data-panel="market" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stock.length === 0 && <i>Wyprzedane do następnej oferty (co {KINGDOM.stockRounds} rundy).</i>}
          {stock.map((id) => {
            const art = ARTIFACT_BY_ID[id];
            const cost = buyer ? artifactCost(buyer, art) : KINGDOM.artifactPrice[art.rarity - 1];
            return (
              <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <ArtifactMedal art={art} size={46} />
                <div style={{ flex: 1, fontSize: 15, lineHeight: 1.25 }}>
                  <b>{art.name}</b> <span className={`rarity r${art.rarity}`}>{RARITY_NAMES[art.rarity]}</span>{art.set && <span style={{ marginLeft: 6, color: '#7A4EA0' }}>zestaw: {SETS[art.set].name}</span>}
                  <div><RuleText text={art.text} /></div>
                </div>
                <button className="btn prim" disabled={gold < cost} data-buy={id} onClick={() => act({ type: 'kingdomBuyArtifact', settlementId: s.id, artifactId: id })} style={{ padding: '3px 14px', fontSize: 16 }}>
                  Kup ({cost} zł)
                </button>
              </div>
            );
          })}
          {upgrade}
        </div>
      );
    }
    if (b === 'hospital') {
      return (
        <div data-panel="hospital" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fs.supportsDead.length === 0 && <i>Nikt z drużyny nie poległ.</i>}
          {fs.supportsDead.map((id) => {
            const cost = Math.max(1, Math.ceil((RECRUITS[faction].find((r) => r.id === id)?.cost ?? 2) / KINGDOM.heal[s.buildings.hospital >= 2 ? 1 : 0]));
            return (
              <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Portrait unitId={id} size={44} dim />
                <div style={{ flex: 1 }}><b>{UNITS[id].name}</b> <span style={{ fontSize: 13, color: '#6B4A22' }}>poległ</span></div>
                <button className="btn prim" disabled={gold < cost} data-heal={id} onClick={() => act({ type: 'kingdomHeal', settlementId: s.id, unitId: id })} style={{ padding: '3px 14px', fontSize: 16 }}>
                  Wskrześ ({cost} zł)
                </button>
              </div>
            );
          })}
          {upgrade}
        </div>
      );
    }
    return (
      <div data-panel="treasury" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <b style={{ color: '#2E7A32' }}>Skarbiec stoi: +{KINGDOM.incomeTreasury} zł na rundę.</b>
      </div>
    );
  };

  return (
    <div className="hero-sheet hero-sheet-wide" data-settlement={s.id}>
      <Ribbon side={faction} style={{ width: 'min(520px, 90vw)', alignSelf: 'center' }}>{s.name}</Ribbon>
      <div style={{ textAlign: 'center', fontSize: 15, color: '#6B4A22' }}>
        Osada {FACTION_NAMES[s.land]}{s.owner !== s.land ? ` (zajęta przez: ${FACTION_NAMES[s.owner!]})` : ''} · złoto: <b data-gold>{gold}</b> · dochód: +{incomeOf(state, faction)} na rundę
      </div>
      <div className="settlement-scene" style={{ backgroundImage: `url(${asset('ui/landscape.jpg')})` }}>
        {ORDER.map((b) => {
          const level = s.buildings[b];
          return (
            <button key={b} className={`settlement-bld ${open === b ? 'on' : ''} ${level ? 'built' : ''}`} style={{ left: `${SPOT[b].left}%`, top: `${SPOT[b].top}%` }} onClick={() => setOpen(b)} aria-pressed={open === b} data-building={b} data-level={level}>
              <img src={asset(ICON[b])} alt="" width={64} height={64} />
              <span>{level ? BUILDING_NAMES[b][Math.min(level, BUILDING_NAMES[b].length) - 1] : `${BUILDING_NAMES[b][0]} (do zbudowania)`}</span>
            </button>
          );
        })}
      </div>
      <div className="plate parch" style={{ padding: '12px 16px', minHeight: 120 }}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{BUILDING_NAMES[open][0]}</div>
        {panel(open)}
      </div>
      <button className="btn prim" data-enter style={{ padding: '6px 28px', fontSize: 20, alignSelf: 'center' }} onClick={onClose}>Wyjdź z osady</button>
    </div>
  );
}
