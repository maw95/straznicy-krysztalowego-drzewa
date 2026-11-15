// The settlement window (level 3 "Osada"): a landscape of the faction with the buildings of the settlement as clickable cards, and under it
// the service of the chosen building: recruitment (barracks), artifacts for gold (market), healing the fallen (hospital), the treasury. Actions go to
// the engine (kingdom.ts); the window only asks and shows what the engine allows.

import { useState } from 'react';
import { FACTION_NAMES, UNITS, type FactionId } from '../engine/data';
import { artifactBill, BUILDING_NAMES, BUILDING_TEXTS, buildCost, buildingLevel, buildingsOf, canPay, forgeLevel, goldOf, hasUnit, incomeOf, KINGDOM, marketStock, mayBuildNow, mayRecruit, RECRUITS, resOf, tradeBuyPrice, type BuildingId } from '../engine/kingdom';
import { costText, ECONOMY, RESOURCE_IDS, RESOURCE_NAMES, SIEGE, type Cost } from '../engine/economy';
import { ARTIFACT_BY_ID, RARITY_NAMES, SETS } from '../engine/sites';
import type { Action, GameState } from '../engine/types';
import { asset, Portrait, Ribbon } from './common';
import { ArtifactMedal } from './growthUi';
import { RESOURCE_ICON, ResourceStrip } from './resources';
import { RuleText } from './statScale';
import { sfx } from './sfx';

/** Where the building stands in the landscape (percent of the picture): four buildings in level 3, five (with the forge) in level 4. */
const SPOT: Record<BuildingId, { left: number; top: number }> = {
  barracks: { left: 16, top: 52 },
  market: { left: 40, top: 30 },
  hospital: { left: 64, top: 52 },
  treasury: { left: 84, top: 28 },
  forge: { left: 50, top: 50 },
  walls: { left: 50, top: 50 },
};
const SPOT5: Record<BuildingId, { left: number; top: number }> = {
  barracks: { left: 10, top: 62 },
  market: { left: 26, top: 30 },
  hospital: { left: 42, top: 64 },
  treasury: { left: 58, top: 30 },
  forge: { left: 74, top: 64 },
  walls: { left: 90, top: 30 },
};
/** The picture of a building in the landscape: the faction's plot while it is not built, then its level (the treasury has one). */
const buildingPicture = (land: FactionId, b: BuildingId, level: number) => (level === 0 ? `osady/${land}_plot.webp` : (b === 'treasury' ? `osady/${land}_treasury.webp` : `osady/${land}_${b}${Math.min(level, 2)}.webp`));

export function SettlementDialog({ state, settlementId, faction, onAction, onClose }: { state: GameState; settlementId: string; faction: FactionId; onAction: (a: Action) => void; onClose: () => void }) {
  const s = state.kingdom!.settlements[settlementId];
  const [open, setOpen] = useState<BuildingId>('barracks');
  const gold = goldOf(state, faction);
  const own = s.land === faction;
  const fs = state.factions[faction];
  const buyer = Object.values(state.heroes).find((h) => h.id === state.turnOrder[state.turnIndex] && h.faction === faction);
  const price = (b: BuildingId) => buildCost(state, s, b);
  const ORDER = buildingsOf(state);
  const spots = ORDER.length > 4 ? SPOT5 : SPOT;
  const act = (a: Action) => {
    // Purchases ring: a building goes up with hammering, everything else with coins.
    sfx.play(a.type === 'kingdomBuild' ? 'build' : 'coins_buy');
    onAction(a);
  };
  const buildButton = (b: BuildingId) => {
    const cost = price(b);
    const level = buildingLevel(s, b);
    if (cost === null) return <b style={{ color: '#2E7A32' }}>Gotowe</b>;
    const blocked = b === 'barracks' && !own;
    const poor = !canPay(state, faction, cost);
    const late = !mayBuildNow(state, faction);
    return (
      <button className="btn prim" disabled={poor || blocked || late} title={blocked ? 'Koszary buduje się tylko w osadzie własnej frakcji.' : late ? 'W tej rundzie budowaliście już: jeden budynek na rundę.' : poor ? `Za mało: potrzeba ${costText(cost)}.` : undefined} data-build={b} onClick={() => act({ type: 'kingdomBuild', settlementId: s.id, building: b })} style={{ padding: '4px 16px', fontSize: 17 }}>
        {level === 0 ? 'Zbuduj' : 'Rozbuduj'}: {BUILDING_NAMES[b][level]} ({costText(cost)})
      </button>
    );
  };

  // Level 4: one unit of a resource for gold (cheaper with a market), and surplus sold on the market.
  const res = resOf(state, faction);
  const trade = state.kingdom!.res ? (
    <div data-trade style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'stretch' }}>
      <b>Wymiana surowców</b>
      <span style={{ fontSize: 14, color: '#6B4A22' }}>{buildingLevel(s, 'market') ? 'Targ kupuje i sprzedaje surowce.' : 'Bez targu surowce kupisz drożej, a sprzedać ich nie można.'}</span>
      {RESOURCE_IDS.map((r) => (
        <div key={r} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <img src={asset(RESOURCE_ICON[r])} alt="" width={30} height={30} />
          <span style={{ flex: 1, minWidth: 110 }}><b>{RESOURCE_NAMES[r]}</b>: {res[r]}</span>
          <button className="btn prim" data-trade-buy={r} disabled={gold < tradeBuyPrice(s, r)} onClick={() => act({ type: 'kingdomTrade', settlementId: s.id, res: r, dir: 'buy' })} style={{ padding: '3px 12px', fontSize: 15 }}>Kup 1 ({tradeBuyPrice(s, r)} zł)</button>
          <button className="btn" data-trade-sell={r} disabled={buildingLevel(s, 'market') < 1 || res[r] < 1} title={buildingLevel(s, 'market') < 1 ? 'Sprzedaż wymaga targu.' : undefined} onClick={() => act({ type: 'kingdomTrade', settlementId: s.id, res: r, dir: 'sell' })} style={{ padding: '3px 12px', fontSize: 15 }}>Sprzedaj 1 (+{ECONOMY.tradeSell[r]} zł)</button>
        </div>
      ))}
    </div>
  ) : null;

  // Level 4: the garrison. The hero standing in the settlement leaves supports to guard it or takes them back.
  const garrison = s.garrison ?? [];
  const heroHere = Boolean(buyer && buyer.pos === s.at);
  const garrisonPanel = state.rules.economy ? (
    <div data-garrison style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'stretch' }}>
      <b>Garnizon ({garrison.length}/{SIEGE.garrisonMax})</b>
      <span style={{ fontSize: 14, color: '#6B4A22' }}>{heroHere ? 'Jednostki zostawione w garnizonie bronią osady, gdy bohater odejdzie. Wróg musi je pokonać, żeby ją zająć.' : 'Garnizon zmienia bohater stojący w tej osadzie.'}</span>
      {garrison.map((id) => (
        <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Portrait unitId={id} size={40} />
          <b style={{ flex: 1 }}>{UNITS[id].name}</b>
          <button className="btn" data-garrison-out={id} disabled={!heroHere} onClick={() => onAction({ type: 'kingdomGarrison', settlementId: s.id, unitId: id, dir: 'out' })} style={{ padding: '3px 12px', fontSize: 15 }}>Zabierz do drużyny</button>
        </div>
      ))}
      {heroHere && garrison.length < SIEGE.garrisonMax && fs.supportsAlive.map((id) => (
        <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Portrait unitId={id} size={40} />
          <span style={{ flex: 1 }}>{UNITS[id].name} <span style={{ fontSize: 13, color: '#6B4A22' }}>w drużynie</span></span>
          <button className="btn prim" data-garrison-in={id} onClick={() => onAction({ type: 'kingdomGarrison', settlementId: s.id, unitId: id, dir: 'in' })} style={{ padding: '3px 12px', fontSize: 15 }}>Zostaw w garnizonie</button>
        </div>
      ))}
    </div>
  ) : null;

  const panel = (b: BuildingId) => {
    if (buildingLevel(s, b) === 0) {
      return (
        <div data-panel={b} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <div><RuleText text={BUILDING_TEXTS[b][0]} /></div>
          {buildButton(b)}
          {b === 'market' && trade}
          {b === 'walls' && garrisonPanel}
        </div>
      );
    }
    const upgrade = price(b) !== null ? (
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 14, color: '#6B4A22' }}><RuleText text={BUILDING_TEXTS[b][1] ?? ''} /></span>
        {buildButton(b)}
      </div>
    ) : null;
    if (b === 'barracks') {
      const mayHire = mayRecruit(s, faction);
      return (
        <div data-panel="barracks" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!mayHire && <i>Ta osada należy do obcej frakcji: nie rekrutujesz tu jednostek.</i>}
          {RECRUITS[faction].map((r) => {
            const have = hasUnit(state, faction, r.id);
            const locked = r.tier >= 4 && s.buildings.barracks < 2;
            return (
              <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Portrait unitId={r.id} size={44} />
                <div style={{ flex: 1 }}>
                  <b>{UNITS[r.id].name}</b> <span style={{ fontSize: 13, color: '#6B4A22' }}>poziom {r.tier}</span>
                  <div style={{ fontSize: 14 }}>Życie {UNITS[r.id].hp} · Atak {UNITS[r.id].attack} · Szybkość {UNITS[r.id].speed}</div>
                </div>
                {have ? <b style={{ color: '#2E7A32' }}>{garrison.includes(r.id) || !(fs.supportsAlive.includes(r.id) || fs.supportsDead.includes(r.id)) ? 'W garnizonie' : 'W drużynie'}</b> : (
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
            const cost: Cost = buyer ? artifactBill(state, buyer, art) : { gold: KINGDOM.artifactPrice[art.rarity - 1] };
            return (
              <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <ArtifactMedal art={art} size={46} />
                <div style={{ flex: 1, fontSize: 15, lineHeight: 1.25 }}>
                  <b>{art.name}</b> <span className={`rarity r${art.rarity}`}>{RARITY_NAMES[art.rarity]}</span>{art.set && <span style={{ marginLeft: 6, color: '#7A4EA0' }}>zestaw: {SETS[art.set].name}</span>}
                  <div><RuleText text={art.text} /></div>
                </div>
                <button className="btn prim" disabled={!canPay(state, faction, cost)} data-buy={id} onClick={() => act({ type: 'kingdomBuyArtifact', settlementId: s.id, artifactId: id })} style={{ padding: '3px 14px', fontSize: 16 }}>
                  Kup ({costText(cost)})
                </button>
              </div>
            );
          })}
          {upgrade}
          {trade}
        </div>
      );
    }
    if (b === 'forge') {
      const best = forgeLevel(state, faction);
      return (
        <div data-panel="forge" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <b style={{ color: '#2E7A32' }}><RuleText text={`Kuźnia pracuje: pomocnicy frakcji mają +${ECONOMY.forgeAttack} A${best >= 2 ? ` i +${ECONOMY.forgeHp} Ż` : ''}.`} /></b>
          <span style={{ fontSize: 14, color: '#6B4A22' }}>Liczy się najlepsza kuźnia frakcji; premie z kilku kuźni się nie sumują.</span>
          {upgrade}
        </div>
      );
    }
    if (b === 'walls') {
      return (
        <div data-panel="walls" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <b style={{ color: '#2E7A32' }}>{buildingLevel(s, 'walls') >= 2 ? 'Fosa, mur z bramą i dwie wieżyczki bronią osady.' : 'Fosa z kolcami broni osady.'}</b>
          <span style={{ fontSize: 14, color: '#6B4A22' }}>Umocnienia działają w bitwie o osadę, gdy broni jej garnizon albo bohater właściciela.</span>
          {upgrade}
          {garrisonPanel}
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
        {state.kingdom!.res && <span style={{ marginLeft: 12, display: 'inline-flex', gap: 10, verticalAlign: 'middle' }}><ResourceStrip state={state} faction={faction} size={22} /></span>}
      </div>
      <div className="settlement-scene" style={{ backgroundImage: `url(${asset(`osady/land_${s.land}.jpg`)})` }}>
        {ORDER.map((b) => {
          const level = buildingLevel(s, b);
          return (
            <button key={b} className={`settlement-bld ${open === b ? 'on' : ''} ${level ? 'built' : ''}`} style={{ left: `${spots[b].left}%`, top: `${spots[b].top}%` }} onClick={() => setOpen(b)} aria-pressed={open === b} data-building={b} data-level={level}>
              <img src={asset(buildingPicture(s.land, b, level))} alt="" className="settlement-pic" />
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
