// The settlement window (level 3 "Osada"): a landscape of the faction with the buildings of the settlement as clickable cards, and under it
// the service of the chosen building: recruitment (barracks), artifacts for gold (market), healing the fallen (hospital), the treasury. Actions go to
// the engine (kingdom.ts); the window only asks and shows what the engine allows.

import { useState } from 'react';
import { FACTION_NAMES, UNITS, type FactionId } from '../engine/data';
import { artifactBill, BUILDING_NAMES, BUILDING_TEXTS, buildCost, buildingLevel, buildingsOf, canPay, forgeLevel, goldOf, hasUnit, incomeOf, KINGDOM, marketStock, mayBuildNow, mayRecruit, RECRUITS, recruitsOf, needsDwelling, dwellingOf, dwellingReady, DWELLING_COST, DWELLING_NAMES, resOf, spellPrice, tradeBuyPrice, type BuildingId } from '../engine/kingdom';
import { costText, ECONOMY, RESOURCE_IDS, RESOURCE_NAMES, SIEGE, type Cost } from '../engine/economy';
import { ARTIFACT_BY_ID, RARITY_NAMES, SETS } from '../engine/sites';
import { ARCHETYPE_NAMES, archetypeOf, commanderName, commanderOf, freeCommanders, heroLabel, mayRansom, ransomPrice, REALM } from '../engine/realm';
import { levelOf } from '../engine/growth';
import { FACTION_MECHANICS, mayBuildSpark, MECHANIC_NAMES, MECHANIC_TEXTS, shardsOf, shardTotal, SPARK_NAMES, SPARK_TEXTS, TREE_NAMES, TREE_TEXTS } from '../engine/empire';
import { MAGIC, manaOf, maxMana, SPELLS, towerSpells } from '../engine/magic';
import type { Action, GameState } from '../engine/types';
import { asset, Portrait, Ribbon } from './common';
import { ArtifactMedal } from './growthUi';
import { RESOURCE_ICON, ResourceStrip } from './resources';
import { RuleText } from './statScale';
import { sfx } from './sfx';

/** Where the building stands in the landscape (percent of the picture): four buildings in level 3. */
const SPOT: Partial<Record<BuildingId, { left: number; top: number }>> = {
  barracks: { left: 16, top: 52 },
  market: { left: 40, top: 30 },
  hospital: { left: 64, top: 52 },
  treasury: { left: 84, top: 28 },
};
/** Levels 4 and up have more buildings: they stand in two rows, spread evenly across the picture. */
const spotOf = (order: BuildingId[], b: BuildingId): { left: number; top: number } => {
  if (order.length <= 4) return SPOT[b] ?? { left: 50, top: 50 };
  const i = order.indexOf(b);
  return { left: 8 + (i * 84) / (order.length - 1), top: i % 2 ? 30 : 64 };
};
/** The picture of a building in the landscape: the faction's plot while it is not built, then its level (the treasury has one). */
const buildingPicture = (land: FactionId, b: BuildingId, level: number) => (level === 0 ? `osady/${land}_plot.webp` : (b === 'treasury' ? `osady/${land}_treasury.webp` : `osady/${land}_${b}${b === 'tavern' || b === 'magic' || b === 'spark' ? 1 : Math.min(level, 2)}.webp`));

export function SettlementDialog({ state, settlementId, faction, onAction, onClose }: { state: GameState; settlementId: string; faction: FactionId; onAction: (a: Action) => void; onClose: () => void }) {
  const s = state.kingdom!.settlements[settlementId];
  const [open, setOpen] = useState<BuildingId>('barracks');
  const gold = goldOf(state, faction);
  const own = s.land === faction;
  const fs = state.factions[faction];
  const buyer = Object.values(state.heroes).find((h) => h.id === state.turnOrder[state.turnIndex] && h.faction === faction);
  const price = (b: BuildingId) => buildCost(state, s, b);
  const ORDER = buildingsOf(state);
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
    if (buildingLevel(s, b) === 0 && b !== 'spark') {
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
          {recruitsOf(state, faction).map((r) => {
            const have = hasUnit(state, faction, r.id);
            const locked = r.tier >= 4 && s.buildings.barracks < 2;
            return (
              <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Portrait unitId={r.id} size={44} />
                <div style={{ flex: 1 }}>
                  <b>{UNITS[r.id].name}</b> <span style={{ fontSize: 13, color: '#6B4A22' }}>poziom {r.tier}</span>
                  <div style={{ fontSize: 14 }}>Życie {UNITS[r.id].hp} · Atak {UNITS[r.id].attack} · Szybkość {UNITS[r.id].speed}{state.rules.empire ? ` · ${UNITS[r.id].abilityName}` : ''}</div>
                </div>
                {have ? <b style={{ color: '#2E7A32' }}>{garrison.includes(r.id) || !(fs.supportsAlive.includes(r.id) || fs.supportsDead.includes(r.id)) ? 'W garnizonie' : 'W drużynie'}</b> : needsDwelling(state, r) && dwellingOf(state, faction, r.tier) === undefined ? (
                  <button className="btn" disabled={!mayHire || locked || !mayBuildNow(state, faction) || !canPay(state, faction, DWELLING_COST[r.tier - 2])} data-dwelling={r.id} title={locked ? 'Potrzebne rozbudowane koszary.' : 'Siedlisko jednej jednostki wyklucza drugą jednostkę tego poziomu do końca gry.'} onClick={() => act({ type: 'kingdomDwelling', settlementId: s.id, unitId: r.id })} style={{ padding: '3px 12px', fontSize: 15 }}>
                    Zbuduj: {DWELLING_NAMES[r.id]} ({costText(DWELLING_COST[r.tier - 2])})
                  </button>
                ) : !dwellingReady(state, faction, r) ? <i data-excluded={r.id} style={{ color: '#8A5A3A' }}>wykluczone: wybrano {DWELLING_NAMES[dwellingOf(state, faction, r.tier)!]}</i> : (
                  <button className="btn prim" disabled={!mayHire || locked || gold < r.cost || res.dust < (r.dust ?? 0)} data-recruit={r.id} title={locked ? 'Potrzebne rozbudowane koszary.' : undefined} onClick={() => act({ type: 'kingdomRecruit', settlementId: s.id, unitId: r.id })} style={{ padding: '3px 14px', fontSize: 16 }}>
                    Rekrutuj ({costText({ gold: r.cost, ...(r.dust ? { dust: r.dust } : {}) })})
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
    if (b === 'spark') {
      const built = buildingLevel(s, 'spark') > 0;
      const ready = mayBuildSpark(state, faction);
      return (
        <div data-panel="spark" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <b>{SPARK_NAMES[faction]}</b>
          <div><RuleText text={SPARK_TEXTS[faction]} /> {state.rules.objective === 'relic' ? 'W tej grze jego wzniesienie wygrywa.' : ''}</div>
          {built ? <b style={{ color: '#2E7A32' }}>Iskra płonie w tej osadzie.</b> : (
            <>
              <span style={{ fontSize: 14, color: '#6B4A22' }}>Cena: wszystkie Odłamki Pierwotnej Iskry (frakcja ma {shardsOf(state, faction)} z {shardTotal(state)}). Buduje bohater stojący w tej osadzie.</span>
              <button className="btn prim" data-build="spark" disabled={!ready || !buyer || buyer.pos !== s.at} title={!ready ? 'Bohaterowie frakcji muszą nieść wszystkie Odłamki.' : buyer?.pos !== s.at ? 'Bohater musi stać w tej osadzie.' : undefined} onClick={() => act({ type: 'kingdomBuild', settlementId: s.id, building: 'spark' })} style={{ padding: '4px 16px', fontSize: 17 }}>
                Wznieś: {SPARK_NAMES[faction]}
              </button>
            </>
          )}
        </div>
      );
    }
    if (b === 'magic') {
      const teach = towerSpells(buildingLevel(s, 'magic'));
      return (
        <div data-panel="magic" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {buyer ? <span style={{ fontSize: 14, color: '#6B4A22' }}>Uczy się {heroLabel(buyer)} (bohater, którego jest tura). Mana: <b data-mana>{manaOf(buyer)}</b> / {maxMana(buyer)}, wraca po {MAGIC.regen} na rundę.</span> : <i>Czarów uczy się bohater w swojej turze.</i>}
          {teach.map((id) => {
            const known = Boolean(buyer?.spells?.includes(id));
            const cost = spellPrice(id);
            return (
              <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <img src={asset(`ikony/czary/${id}.webp`)} alt="" width={46} height={46} />
                <div style={{ flex: 1, fontSize: 15, lineHeight: 1.25 }}>
                  <b>{SPELLS[id].name}</b> <span style={{ fontSize: 13, color: '#6B4A22' }}>krąg {SPELLS[id].circle} · mana {SPELLS[id].mana} · {SPELLS[id].where === 'map' ? 'na mapie' : 'w bitwie'}</span>
                  <div><RuleText text={SPELLS[id].text} /></div>
                </div>
                {known ? <b style={{ color: '#2E7A32' }}>Znany</b> : (
                  <button className="btn prim" data-learn={id} disabled={!buyer || !canPay(state, faction, cost)} onClick={() => { sfx.play('magic_cast'); onAction({ type: 'kingdomLearn', settlementId: s.id, spell: id }); }} style={{ padding: '3px 14px', fontSize: 16 }}>
                    Naucz się ({costText(cost)})
                  </button>
                )}
              </div>
            );
          })}
          {upgrade}
        </div>
      );
    }
    if (b === 'tavern') {
      const mine = commanderOf(state, buyer?.playerId ?? null);
      return (
        <div data-panel="tavern" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mine ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Portrait unitId={mine.id} size={52} dim={!mine.alive} />
              <div style={{ flex: 1 }}>
                <b>{heroLabel(mine)}</b> <span style={{ fontSize: 13, color: '#6B4A22' }}>poziom {levelOf(mine)} · {ARCHETYPE_NAMES[archetypeOf(mine.id) ?? 'warrior']}</span>
                <div style={{ fontSize: 14 }}>{mine.alive ? 'Twój dowódca jest w drodze. Gracz prowadzi jednego dowódcę.' : mayRansom(state, mine) ? 'Poległ. Możesz go wykupić: zachowa poziom i umiejętności, artefakty stracił.' : 'Poległ. Wykup będzie możliwy od następnej rundy, o ile żyje Twój główny bohater.'}</div>
              </div>
              {!mine.alive && (
                <button className="btn prim" data-ransom={mine.id} disabled={!mayRansom(state, mine) || gold < ransomPrice(mine)} onClick={() => act({ type: 'kingdomRansom', settlementId: s.id, heroId: mine.id })} style={{ padding: '3px 14px', fontSize: 16 }}>
                  Wykup ({ransomPrice(mine)} zł)
                </button>
              )}
            </div>
          ) : (
            <>
              <i>Dowódca to Twój drugi bohater: własny pionek, doświadczenie, umiejętności i artefakty. Walczy z pomocnikami frakcji tak jak bohater główny i rusza od następnej rundy.</i>
              {freeCommanders(state, faction).map((id) => (
                <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Portrait unitId={id} size={52} />
                  <div style={{ flex: 1 }}>
                    <b>{commanderName(state, id)}, {UNITS[id].name}</b> <span style={{ fontSize: 13, color: '#6B4A22' }}>{ARCHETYPE_NAMES[archetypeOf(id) ?? 'warrior']}</span>
                    <div style={{ fontSize: 14 }}>Życie {UNITS[id].hp} · Atak {UNITS[id].attack} · Szybkość {UNITS[id].speed} · {UNITS[id].abilityName}</div>
                  </div>
                  <button className="btn prim" data-hire={id} disabled={!buyer?.playerId || gold < REALM.hireGold} onClick={() => act({ type: 'kingdomHire', settlementId: s.id, unitId: id })} style={{ padding: '3px 14px', fontSize: 16 }}>
                    Najmij ({REALM.hireGold} zł)
                  </button>
                </div>
              ))}
            </>
          )}
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
      <div className="settlement-scene" style={{ flex: 'none', backgroundImage: `url(${asset(`osady/land_${s.land}.jpg`)})` }}>
        {ORDER.map((b) => {
          const level = buildingLevel(s, b);
          return (
            <button key={b} className={`settlement-bld ${open === b ? 'on' : ''} ${level ? 'built' : ''}`} style={{ left: `${spotOf(ORDER, b).left}%`, top: `${spotOf(ORDER, b).top}%`, ...(ORDER.length > 6 ? { width: 104 } : {}) }} onClick={() => setOpen(b)} aria-pressed={open === b} data-building={b} data-level={level}>
              <img src={asset(buildingPicture(s.land, b, level))} alt="" className="settlement-pic" />
              <span>{level ? BUILDING_NAMES[b][Math.min(level, BUILDING_NAMES[b].length) - 1] : `${BUILDING_NAMES[b][0]} (do zbudowania)`}</span>
            </button>
          );
        })}
      </div>
      {state.rules.empire && (() => {
        // Level 6: the faction's own mechanic and its tree of three ranks (bought here, from any own settlement).
        const rank = state.kingdom!.tree?.[faction] ?? 0;
        const next = FACTION_MECHANICS.treeCost[rank];
        return (
          <div className="plate parch" data-tree data-rank={rank} style={{ flex: 'none', padding: '8px 14px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260, fontSize: 14, lineHeight: 1.3 }}>
              <b style={{ fontSize: 16 }}>{MECHANIC_NAMES[faction]}</b> <span style={{ color: '#6B4A22' }}>mechanika frakcji · drzewko {rank}/3</span>
              <div><RuleText text={MECHANIC_TEXTS[faction]} /></div>
              {TREE_NAMES[faction].map((name, i) => (
                <div key={name} style={{ opacity: i < rank ? 1 : 0.6 }}>{i < rank ? '✓' : '○'} <b>{name}</b>: <RuleText text={TREE_TEXTS[faction][i]} /></div>
              ))}
            </div>
            {next ? (
              <button className="btn prim" data-tree-buy disabled={!buyer || !canPay(state, faction, next)} onClick={() => act({ type: 'kingdomTree', settlementId: s.id })} style={{ padding: '4px 14px', fontSize: 16 }}>
                Rozwiń: {TREE_NAMES[faction][rank]} ({costText(next)})
              </button>
            ) : <b style={{ color: '#2E7A32' }}>Drzewko pełne</b>}
          </div>
        );
      })()}
      <div className="plate parch" data-service style={{ padding: '12px 16px', minHeight: 120, ...(state.rules.economy ? { maxHeight: '36vh', overflowY: 'auto' as const, flex: 'none' } : {}) }}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{BUILDING_NAMES[open][0]}</div>
        {panel(open)}
      </div>
      <button className="btn prim" data-enter style={{ padding: '6px 28px', fontSize: 20, alignSelf: 'center' }} onClick={onClose}>Wyjdź z osady</button>
    </div>
  );
}
