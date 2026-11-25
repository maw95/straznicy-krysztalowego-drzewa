// The settlement window (level 3 "Osada"): a landscape of the faction with the buildings of the settlement as clickable cards, and under it
// the service of the chosen building: recruitment (barracks), artifacts for gold (market), healing the fallen (hospital), the treasury. Actions go to
// the engine (kingdom.ts); the window only asks and shows what the engine allows.

import { raceOf } from '../engine/teams';
import { useEffect, useState, type ReactNode } from 'react';
import { FACTION_NAMES, UNITS, type FactionId, type TeamId } from '../engine/data';
import { artifactBill, fenceSellPrice, BUILDING_NAMES, BUILDING_TEXTS, buildBlock, buildCost, buildingLevel, buildingsFor, canPay, forgeLevel, goldOf, hasUnit, healPrice, incomeOf, refugeHere, refugeTargets, RUNE_NAMES, RUNES, runeBlock, runesOf, KINGDOM, marketStock, mayRecruit, recruitsOf, needsDwelling, dwellingOf, dwellingReady, DWELLING_COST, DWELLING_NAMES, DWELLING_TEXTS, resOf, spellPrice, tradeBuyPrice, tradeSellPrice, type BuildingId } from '../engine/kingdom';
import { costText, ECONOMY, RESOURCE_IDS, RESOURCE_TITLES, SIEGE, type Cost } from '../engine/economy';
import { ARTIFACT_BY_ID, packOf, RARITY_NAMES, SETS } from '../engine/sites';
import { ARCHETYPE_NAMES, archetypeOf, commanderName, commanderOf, freeCommanders, heroLabel, mayRansom, ransomPrice, REALM } from '../engine/realm';
import { levelOf } from '../engine/growth';
import { FACTION_MECHANICS, mayBuildSpark, shardsOf, shardTotal, SPARK_NAMES, SPARK_TEXTS } from '../engine/empire';
import { MAGIC, manaOf, maxMana, SPELLS, towerSpells } from '../engine/magic';
import type { Action, GameState } from '../engine/types';
import { asset, COMPACT_QUERY, Modal, Portrait, Ribbon, teamFaction, useMedia } from './common';
import { ArtifactMedal } from './growthUi';
import { StatIcon, StatText, RuleText } from './markers';
import { CostIcons, RESOURCE_ICON, ResourceStrip } from './resources';
import { details } from './details';

import { sfx } from './sfx';
import { BarracksScreen } from './BarracksScreen';
import { UnitCard } from './UnitCard';
import { BuildingTree, COUNCIL, type ExtraNode } from './BuildingTree';

/**
 * Where each building stands in the landscape of each faction (chosen with the author on 25.11, so nothing stands on water, rocks or in the air).
 * The landscape is a stage of a fixed shape (the picture's own), scaled to cover the screen, so a spot is a place on the terrain and not on the
 * screen: [x, y] (percent of the stage) is the foot of the building, h its height (percent of the stage's height). Bigger buildings for a higher
 * rank: the council and the barracks first, the dwellings grow with the tier of their unit ('dwelling-2' ... 'dwelling-6'). The factions
 * without a land of their own stand on the land of the Przymierze, their unique buildings on the spots of the ones whose pictures they borrow.
 * The walls (moat, then wall with a gate) run along the bottom edge as the entrance of the town: their third number is a width (percent of the
 * stage's width), and their foot lies below the picture's edge, so only the top of the wall shows in front of the town.
 */
type Spot = { x: number; y: number; h: number };
type SpotKey = BuildingId | 'council' | `dwelling-${number}`;
const LAYOUTS: Record<'dawn' | 'horde' | 'herds' | 'clans' | 'tides', Partial<Record<SpotKey, [number, number, number]>>> = {
  dawn: { magic: [14, 47, 24.2], shrine: [30, 45, 18.7], council: [50, 48, 27.5], grove: [68, 46, 18.7], spark: [84, 48, 19.8], tavern: [9, 65, 15.4], hospital: [24, 63, 18.7], market: [39, 65, 22], forge: [62, 64, 19.8], 'dwelling-6': [79, 65, 23.1], 'dwelling-2': [19, 80, 16.5], treasury: [32, 80, 22], barracks: [51, 81, 29.7], 'dwelling-5': [67, 81, 18.7], nursery: [82, 79, 17.6], 'dwelling-3': [7, 90, 18.7], 'dwelling-4': [91, 93, 19.8], walls: [50, 104, 56] },
  horde: { magic: [13, 38, 24], bloodPit: [29, 36, 19], council: [50, 40, 27], wolfDen: [71, 37, 17], spark: [87, 38, 18], tavern: [8, 58, 15], hospital: [23, 57, 19], 'dwelling-2': [37, 55, 15], 'dwelling-3': [63, 55, 17], forge: [78, 58, 20], plunder: [93, 62, 17], 'dwelling-4': [12, 80, 20], treasury: [30, 80, 22], barracks: [50, 79, 30], 'dwelling-5': [70, 80, 22], 'dwelling-6': [88, 86, 27], market: [8, 93, 21], walls: [50, 104, 56] },
  herds: { magic: [15, 38, 28.8], hoofStone: [33, 36, 21.6], council: [50, 42, 32.4], refuge: [67, 36, 21.6], pastures: [82, 37, 19], tavern: [8, 62, 18], hospital: [24, 58, 22.8], spark: [38, 55, 20.4], forge: [63, 58, 24], 'dwelling-6': [78, 66, 25], 'dwelling-4': [10, 82, 22.8], 'dwelling-2': [25, 79, 18], treasury: [39, 80, 26.4], barracks: [56, 80, 36], 'dwelling-3': [70, 82, 19], 'dwelling-5': [93, 93, 23], walls: [50, 104, 56], market: [86, 82, 25] },
  clans: { deepMine: [19, 37, 19], shieldHall: [35, 36, 19], council: [50, 43, 27], runeForge: [65, 36, 19], magic: [81, 40, 24], tavern: [9, 58, 15], hospital: [24, 57, 19], spark: [38, 55, 17], forge: [63, 57, 20], 'dwelling-6': [79, 60, 24], treasury: [14, 79, 22], 'dwelling-2': [30, 76, 15], barracks: [50, 79, 30], 'dwelling-3': [69, 76, 17], market: [85, 79, 22], 'dwelling-4': [8, 89, 19], walls: [50, 104, 56], 'dwelling-5': [92, 93, 21] },
  tides: { lighthouse: [86, 27, 22], tideTemple: [37, 30, 19], spark: [66, 29, 17], 'dwelling-3': [20, 38, 17], council: [51, 42, 27], magic: [77, 45, 24], pearlBanks: [7, 47, 17], tavern: [12, 63, 15], hospital: [29, 58, 19], market: [39, 70, 22], forge: [66, 61, 20], 'dwelling-6': [85, 65, 24], treasury: [31, 79, 22], 'dwelling-2': [8, 88, 15], barracks: [55, 80, 30], 'dwelling-4': [75, 80, 19], 'dwelling-5': [90, 90, 21], walls: [50, 104, 56] },
};
const landOfPictures = (land: FactionId): keyof typeof LAYOUTS => (land in LAYOUTS ? (land as keyof typeof LAYOUTS) : 'dawn');
const spotOf = (b: SpotKey, land: FactionId): Spot => {
  const layout = LAYOUTS[landOfPictures(land)];
  const t = layout[b] ?? layout[(BORROWED as Record<string, BuildingId | undefined>)[b] ?? b] ?? layout.council!;
  return { x: t[0], y: t[1], h: t[2] };
};
/** Whose picture a building of one faction has (level 6: Kapliczka, Szkółka, Krąg for the Przymierze; Jama, Szabrownia, Legowisko for the Horde). */
const UNIQUE_OWNER: Partial<Record<BuildingId, FactionId>> = { shrine: 'dawn', nursery: 'dawn', grove: 'dawn', bloodPit: 'horde', plunder: 'horde', wolfDen: 'horde', hoofStone: 'herds', pastures: 'herds', refuge: 'herds', tideTemple: 'tides', pearlBanks: 'tides', lighthouse: 'tides', shieldHall: 'clans', runeForge: 'clans', deepMine: 'clans' };
/** Placeholders (docs/BACKLOG.md 2a): the factions without pictures of their own yet borrow the land of Przymierze and its three unique buildings (the Herds, the Tides and the Clans have their own: osady/herds_*, tides_*, clans_*). */
const BORROWED: Partial<Record<BuildingId, BuildingId>> = { barrow: 'shrine', ossuary: 'nursery', bellTower: 'grove', frostPalace: 'shrine', blizzardTower: 'grove', crystalGrotto: 'nursery', trapWorkshop: 'shrine', smugglerTrails: 'grove', fence: 'nursery', mirageHall: 'shrine', sandGate: 'grove', caravanRoad: 'nursery', myceliumHeart: 'shrine', tunnels: 'grove', mushroomGarden: 'nursery' };
const buildingPicture = (landOf: FactionId, building: BuildingId, level: number) => {
  const land: FactionId = landOf === 'undead' || landOf === 'frost' || landOf === 'free' || landOf === 'sands' || landOf === 'swarm' ? 'dawn' : landOf;
  const b = BORROWED[building] ?? building;
  const own = UNIQUE_OWNER[b];
  if (own) return level === 0 ? `osady/${own}_plot.webp` : `osady/${own}_${b}1.webp`;
  return level === 0 ? `osady/${land}_plot.webp` : (b === 'treasury' ? `osady/${land}_treasury${Math.min(level, 2) === 2 ? 2 : ''}.webp` : `osady/${land}_${b}${b === 'tavern' || b === 'spark' ? 1 : Math.min(level, 2)}.webp`);
};

/** A framed plate with what a building (or a dwelling) is: picture, name, what it does, an optional card, the cost and the button. */
function DetailPlate({ id, picture, title, text, note, card, cost, action, modal = false, blocked = false }: { id: string; picture?: string; title: string; text: string; note?: string; card?: ReactNode; cost?: ReactNode; action?: ReactNode; modal?: boolean; blocked?: boolean }) {
  const body = (
    <>
      {picture && !modal && <img className="td-pic" src={asset(picture)} alt="" />}
      <div className="td-text">
        <div className="td-title">{title}</div>
        <div className="td-desc"><RuleText text={text} /></div>
        {note && <div className={`td-note ${blocked ? 'bad' : ''}`}>{note}</div>}
      </div>
      {card && <div className="td-card">{card}</div>}
      {(cost || action) && <div className="td-buy">{cost}{action}</div>}
    </>
  );
  if (modal) return <div className="td-modal" data-tree-detail={id}>{body}</div>;
  return (
    <div className="gf tree-detail" data-tree-detail={id}>
      <div className="gi slate tree-detail-in">{body}</div>
    </div>
  );
}

export function SettlementDialog({ state, settlementId, faction, onAction, onClose }: { state: GameState; settlementId: string; faction: TeamId; onAction: (a: Action) => void; onClose: () => void }) {
  const compact = useMedia(COMPACT_QUERY);
  const s = state.kingdom!.settlements[settlementId];
  // A click on a building opens a page of this screen (the barracks, the Rada Osady with the tree of buildings) or a modal (everything else); Esc comes back to the landscape first.
  const [view, setView] = useState<'town' | 'tree' | 'barracks'>('town');
  const [modal, setModal] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => {
    if (view === 'town') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setView('town'); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [view]);
  const gold = goldOf(state, faction);
  const own = s.land === faction;
  /** The race whose land the settlement stands on (the pictures and the building names are the race's). */
  const landRace = raceOf(state, s.land);
  const councilSpot = spotOf('council', landRace);
  const fs = state.factions[faction];
  const buyer = Object.values(state.heroes).find((h) => h.id === state.turnOrder[state.turnIndex] && h.faction === faction);
  const price = (b: BuildingId) => buildCost(state, s, b);
  const ORDER = buildingsFor(state, faction);
  const act = (a: Action) => {
    // Purchases ring: a building goes up with hammering, everything else with coins.
    // The Iskra has its own fanfare (played from the log, App.tsx); a commander is hired over a mug.
    if (a.type === 'kingdomBuild' && a.building === 'spark') return onAction(a);
    sfx.play(a.type === 'kingdomForgeRune' ? 'clans_runeForge' : a.type === 'kingdomBuild' || a.type === 'kingdomDwelling' ? 'build' : a.type === 'kingdomHire' || a.type === 'kingdomRansom' ? 'tavern_hire' : 'coins_buy');
    onAction(a);
  };
  const buildButton = (b: BuildingId) => {
    const cost = price(b);
    const level = buildingLevel(s, b);
    if (cost === null) return <b style={{ color: '#2E7A32' }}>Gotowe</b>;
    const parentBlock = buildBlock(s, b);
    const blocked = (b === 'barracks' && !own) || Boolean(parentBlock);
    const poor = !canPay(state, faction, cost);
    return (
      <button className="btn prim" disabled={poor || blocked} title={parentBlock ? parentBlock : blocked ? 'Koszary buduje się tylko w osadzie własnej frakcji.' : poor ? `Za mało: potrzeba ${costText(cost)}.` : undefined} data-build={b} onClick={() => act({ type: 'kingdomBuild', settlementId: s.id, building: b })} style={{ padding: '4px 16px', fontSize: 17 }}>
        {level === 0 ? 'Zbuduj' : 'Rozbuduj'}: {BUILDING_NAMES[b][level]} <CostIcons cost={cost} size={16} light />
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
          <span style={{ flex: 1, minWidth: 110 }}><b>{RESOURCE_TITLES[r]}</b>: {res[r]}</span>
          <button className="btn prim" data-trade-buy={r} disabled={gold < tradeBuyPrice(s, r)} onClick={() => act({ type: 'kingdomTrade', settlementId: s.id, res: r, dir: 'buy' })} style={{ padding: '3px 12px', fontSize: 15 }}>Kup 1 (<StatText text={`${tradeBuyPrice(s, r)} zł`} />)</button>
          <button className="btn prim b" data-trade-sell={r} disabled={buildingLevel(s, 'market') < 1 || res[r] < 1} title={buildingLevel(s, 'market') < 1 ? 'Sprzedaż wymaga targu.' : undefined} onClick={() => act({ type: 'kingdomTrade', settlementId: s.id, res: r, dir: 'sell' })} style={{ padding: '3px 12px', fontSize: 15 }}>Sprzedaj 1 (<StatText text={`+${tradeSellPrice(state, faction, s, r)} zł`} />)</button>
        </div>
      ))}
      {buildingLevel(s, 'market') > 0 && (
        <div data-swap style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 14, color: '#6B4A22' }}>Wymiana: 1 surowiec na 1 inny (sprzedaż i kupno po cenach targu, dopłata w złocie).</span>
          {RESOURCE_IDS.map((from) => (
            <div key={from} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <img src={asset(RESOURCE_ICON[from])} alt="" width={22} height={22} />
              <span style={{ minWidth: 70 }}>{RESOURCE_TITLES[from]} →</span>
              {RESOURCE_IDS.filter((to) => to !== from).map((to) => {
                const extra = tradeBuyPrice(s, to) - tradeSellPrice(state, faction, s, from);
                return (
                  <button key={to} className="btn prim b" data-swap-from={from} data-swap-to={to} disabled={res[from] < 1 || gold + tradeSellPrice(state, faction, s, from) < tradeBuyPrice(s, to)} onClick={() => act({ type: 'kingdomSwap', settlementId: s.id, from, to })} style={{ padding: '3px 10px', fontSize: 14 }}>
                    <img src={asset(RESOURCE_ICON[to])} alt="" width={18} height={18} style={{ verticalAlign: 'middle' }} /> {RESOURCE_TITLES[to]} (<StatText text={extra > 0 ? `+${extra} zł` : extra < 0 ? `${-extra} zł dla ciebie` : 'bez dopłaty'} />)
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  ) : null;

  // Level 4: the garrison. The hero standing in the settlement leaves supports to guard it or takes them back (the slots in the bottom bar).
  const garrison = s.garrison ?? [];
  const heroHere = Boolean(buyer && buyer.pos === s.at);
  const garrisonRule = `Garnizon broni osady pod nieobecność bohatera: wróg musi go pokonać, żeby ją zająć, a w bitwie dowodzi nim właściciel osady. Maksymalnie ${SIEGE.garrisonMax} jednostki. Zostawiasz je i zabierasz, stojąc w osadzie${heroHere ? '' : ' (teraz nie stoi tu bohater, którego jest tura)'}.`;
  const garrisonPanel = state.rules.economy ? (
    <div className="sb-garrison" data-garrison title={garrisonRule}>
      <div className="sb-label"><img src={asset('ikony/frakcje/garnizon.webp')} alt="" width={26} height={26} />Garnizon ({garrison.length}/{SIEGE.garrisonMax})</div>
      <div className="sb-slots" data-garrison-slots>
        {Array.from({ length: SIEGE.garrisonMax }, (_, i) => garrison[i] ? (
          <button key={i} className="sb-slot full" data-garrison-out={garrison[i]} disabled={!heroHere} title={`${UNITS[garrison[i]].name}${heroHere ? ': zabierz do drużyny' : ''}`} onClick={() => onAction({ type: 'kingdomGarrison', settlementId: s.id, unitId: garrison[i], dir: 'out' })}>
            <Portrait unitId={garrison[i]} size={44} />
          </button>
        ) : <div key={i} className="sb-slot" title="Puste miejsce garnizonu"><span>+</span></div>)}
      </div>
      {heroHere && garrison.length < SIEGE.garrisonMax && fs.supportsAlive.length > 0 && (
        <div className="sb-team"><span className="sb-sub">w drużynie, kliknij by zostawić:</span>
          {fs.supportsAlive.map((id) => (
            <button key={id} className="sb-slot small" data-garrison-in={id} title={`${UNITS[id].name}: zostaw w garnizonie`} onClick={() => onAction({ type: 'kingdomGarrison', settlementId: s.id, unitId: id, dir: 'in' })}>
              <Portrait unitId={id} size={32} />
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;

  const panel = (b: BuildingId) => {
    if (buildingLevel(s, b) === 0 && b !== 'spark') {
      return (
        <div data-panel={b} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <div><RuleText text={BUILDING_TEXTS[b][0]} /></div>
          {buildButton(b)}
          {b === 'market' && trade}
        </div>
      );
    }
    // Building and upgrading belong to the Rada Osady only: here the next level is just described.
    const upgrade = price(b) !== null ? (
      <div data-upgrade-hint style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 14, color: '#6B4A22' }}><RuleText text={BUILDING_TEXTS[b][1] ?? ''} /></span>
        <i style={{ fontSize: 14, color: '#8A5A3A' }}>Rozbudowa: w Radzie Osady.</i>
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
                  <div style={{ fontSize: 14 }}><StatIcon stat="Ż" /> {UNITS[r.id].hp} · <StatIcon stat="A" /> {UNITS[r.id].attack} · <StatIcon stat="S" /> {UNITS[r.id].speed}{state.rules.empire ? ` · ${UNITS[r.id].abilityName}` : ''}</div>
                </div>
                {have ? <b style={{ color: '#2E7A32' }}>{garrison.includes(r.id) || !(fs.supportsAlive.includes(r.id) || fs.supportsDead.includes(r.id)) ? 'W garnizonie' : 'W drużynie'}</b> : needsDwelling(state, r) && dwellingOf(state, faction, r.tier) === undefined ? (
                  <button className="btn prim b" disabled={!mayHire || locked || !canPay(state, faction, DWELLING_COST[r.tier - 2])} data-dwelling={r.id} title={locked ? 'Potrzebne rozbudowane koszary.' : 'Siedlisko jednej jednostki wyklucza drugą jednostkę tego poziomu do końca gry.'} onClick={() => act({ type: 'kingdomDwelling', settlementId: s.id, unitId: r.id })} style={{ padding: '3px 12px', fontSize: 15 }}>
                    <img src={asset(`ikony/siedliska/${r.id}.webp`)} alt="" width={30} height={30} style={{ verticalAlign: 'middle', marginRight: 6 }} />Zbuduj: {DWELLING_NAMES[r.id]} (<StatText text={costText(DWELLING_COST[r.tier - 2])} />)
                  </button>
                ) : !dwellingReady(state, faction, r) ? <i data-excluded={r.id} style={{ color: '#8A5A3A' }}>wykluczone: wybrano {DWELLING_NAMES[dwellingOf(state, faction, r.tier)!]}</i> : (
                  <button className="btn prim" disabled={!mayHire || locked || gold < r.cost || res.dust < (r.dust ?? 0)} data-recruit={r.id} title={locked ? 'Potrzebne rozbudowane koszary.' : undefined} onClick={() => act({ type: 'kingdomRecruit', settlementId: s.id, unitId: r.id })} style={{ padding: '3px 14px', fontSize: 16 }}>
                    Rekrutuj (<StatText text={costText({ gold: r.cost, ...(r.dust ? { dust: r.dust } : {}) })} />)
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
                  Kup (<StatText text={costText(cost)} />)
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
      const ready = Boolean(buyer && mayBuildSpark(state, buyer));
      return (
        <div data-panel="spark" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <b>{SPARK_NAMES[raceOf(state, faction)]}</b>
          <div><RuleText text={SPARK_TEXTS[raceOf(state, faction)]} /> {state.rules.objective === 'relic' ? 'W tej grze jego wzniesienie wygrywa.' : ''}</div>
          {built ? <b style={{ color: '#2E7A32' }}>Iskra płonie w tej osadzie.</b> : (
            <>
              <span style={{ fontSize: 14, color: '#6B4A22' }}>Cena: wszystkie Odłamki Pierwotnej Iskry (frakcja ma {shardsOf(state, faction)} z {shardTotal(state)}). Buduje bohater stojący w tej osadzie, który sam niesie wszystkie Odłamki{buyer ? ` (${heroLabel(buyer)} niesie ${buyer.shards ?? 0})` : ''}: przekaż je sobie wcześniej na mapie.</span>
              <button className="btn prim" data-build="spark" disabled={!ready || !buyer || buyer.pos !== s.at} title={!ready ? 'Jeden bohater musi nieść wszystkie Odłamki.' : buyer?.pos !== s.at ? 'Bohater musi stać w tej osadzie.' : undefined} onClick={() => act({ type: 'kingdomBuild', settlementId: s.id, building: 'spark' })} style={{ padding: '4px 16px', fontSize: 17 }}>
                Wznieś: {SPARK_NAMES[raceOf(state, faction)]}
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
                    Naucz się (<StatText text={costText(cost)} />)
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
                  Wykup (<StatText text={`${ransomPrice(mine)} zł`} />)
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
                    <div style={{ fontSize: 14 }}><StatIcon stat="Ż" /> {UNITS[id].hp} · <StatIcon stat="A" /> {UNITS[id].attack} · <StatIcon stat="S" /> {UNITS[id].speed} · {UNITS[id].abilityName}</div>
                  </div>
                  <button className="btn prim" data-hire={id} disabled={!buyer?.playerId || gold < REALM.hireGold} onClick={() => act({ type: 'kingdomHire', settlementId: s.id, unitId: id })} style={{ padding: '3px 14px', fontSize: 16 }}>
                    Najmij (<StatText text={`${REALM.hireGold} zł`} />)
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
        </div>
      );
    }
    if (b === 'hospital') {
      return (
        <div data-panel="hospital" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fs.supportsDead.length === 0 && <i>Nikt z drużyny nie poległ.</i>}
          {fs.supportsDead.map((id) => {
            const cost = healPrice(state, faction, s, id);
            return (
              <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Portrait unitId={id} size={44} dim />
                <div style={{ flex: 1 }}><b>{UNITS[id].name}</b> <span style={{ fontSize: 13, color: '#6B4A22' }}>poległ</span></div>
                <button className="btn prim" disabled={gold < cost} data-heal={id} onClick={() => act({ type: 'kingdomHeal', settlementId: s.id, unitId: id })} style={{ padding: '3px 14px', fontSize: 16 }}>
                  Wskrześ (<StatText text={`${cost} zł`} />)
                </button>
              </div>
            );
          })}
          {upgrade}
        </div>
      );
    }
    // Level 6, the Wild Herds: the Ostoja Wędrówek jumps the hero standing here to another own settlement with an Ostoja, once a round.
    if (b === 'refuge') {
      const targets = buyer ? refugeTargets(state, buyer) : [];
      const here = Boolean(buyer && refugeHere(state, buyer)?.id === s.id);
      return (
        <div data-panel="refuge" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RuleText text={BUILDING_TEXTS.refuge[0]} />
          {!here && <i>Bohater musi stać w tej osadzie, żeby się przenieść.</i>}
          {here && targets.length === 0 && <i>{buyer?.refugeRound === state.round ? 'Bohater przeniósł się już w tej rundzie.' : 'Nie ma drugiej własnej osady z Ostoją Wędrówek.'}</i>}
          {here && targets.map((t) => (
            <button key={t.id} className="btn prim" data-refuge-to={t.id} onClick={() => act({ type: 'kingdomRefuge', settlementId: t.id })} style={{ padding: '3px 14px', fontSize: 16 }}>Przenieś bohatera do osady {t.name}</button>
          ))}
          {upgrade}
        </div>
      );
    }
    // Level 6, the Iron Clans: the Runiczna Kuźnia forges a rune on a support of the pool, once a round for the faction.
    if (b === 'runeForge') {
      const pool = [...fs.supportsAlive, ...fs.supportsDead];
      const done = fs.runeRound === state.round;
      return (
        <div data-panel="runeForge" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RuleText text={BUILDING_TEXTS.runeForge[Math.min(buildingLevel(s, 'runeForge'), 2) - 1]} />
          {done && <i data-rune-done>Kuźnia wybiła już w tej rundzie runę.</i>}
          {pool.length === 0 && <i>W drużynie nie ma pomocników.</i>}
          {pool.map((id) => (
            <div key={id} data-rune-unit={id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Portrait unitId={id} size={44} dim={fs.supportsDead.includes(id)} />
              <div style={{ flex: 1 }}><b>{UNITS[id].name}</b> <span style={{ fontSize: 13, color: '#6B4A22' }}>{runesOf(state, faction, id).map((r) => RUNE_NAMES[r]).join(', ') || 'bez run'}</span></div>
              {RUNES.map((r) => {
                const why = runeBlock(state, faction, s, id, r);
                return (
                  <button key={r} className="btn prim" disabled={Boolean(why)} title={why ?? `Wybij runę: ${RUNE_NAMES[r]}`} data-rune-forge={`${id}:${r}`} onClick={() => act({ type: 'kingdomForgeRune', settlementId: s.id, unitId: id, rune: r })} style={{ padding: '3px 10px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <img src={asset(`ikony/runy/${r}.webp`)} alt="" width={22} height={22} style={{ borderRadius: '50%' }} /><StatText text={RUNE_NAMES[r]} />
                  </button>
                );
              })}
            </div>
          ))}
          <span style={{ fontSize: 14, color: '#6B4A22' }}>Cena runy: <StatText text={costText({ gold: FACTION_MECHANICS.runePrice.gold, ore: FACTION_MECHANICS.runePrice.ore })} />.</span>
          {upgrade}
        </div>
      );
    }
    if (b === 'fence') {
      const lvl = buildingLevel(s, 'fence');
      const pack = buyer ? packOf(buyer) : [];
      return (
        <div data-panel="fence" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BUILDING_TEXTS.fence.slice(0, lvl).map((t, i) => (
            <div key={i} data-effect-level={i + 1} style={{ display: 'flex', gap: 8 }}><b style={{ color: '#2E7A32' }}>{i + 1}.</b><RuleText text={t} /></div>
          ))}
          {!buyer && <i>Artefakty sprzedaje bohater w swojej turze.</i>}
          {buyer && pack.length === 0 && <i data-fence-empty>Plecak bohatera jest pusty.</i>}
          {pack.map((art, i) => (
            <div key={`${art.id}-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <ArtifactMedal art={art} size={46} />
              <div style={{ flex: 1, fontSize: 15, lineHeight: 1.25 }}>
                <b>{art.name}</b> <span className={`rarity r${art.rarity}`}>{RARITY_NAMES[art.rarity]}</span>
                <div><RuleText text={art.text} /></div>
              </div>
              <button className="btn prim" data-sell={art.id} onClick={() => act({ type: 'kingdomSellArtifact', settlementId: s.id, artifactId: art.id })} style={{ padding: '3px 14px', fontSize: 16 }}>
                Sprzedaj (<StatText text={`+${fenceSellPrice(art)} zł`} />)
              </button>
            </div>
          ))}
          {upgrade}
        </div>
      );
    }
    if (UNIQUE_OWNER[b] || BORROWED[b]) {
      const lvl = buildingLevel(s, b);
      return (
        <div data-panel={b} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {BUILDING_TEXTS[b].slice(0, lvl).map((t, i) => (
            <div key={i} data-effect-level={i + 1} style={{ display: 'flex', gap: 8 }}><b style={{ color: '#2E7A32' }}>{i + 1}.</b><RuleText text={t} /></div>
          ))}
          {upgrade}
        </div>
      );
    }
    return (
      <div data-panel="treasury" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <b style={{ color: '#2E7A32' }}>{BUILDING_NAMES.treasury[Math.min(buildingLevel(s, 'treasury'), 2) - 1]} stoi: <StatText text={`+${KINGDOM.incomeTreasury[Math.min(buildingLevel(s, 'treasury'), 2) - 1]} zł`} /> na rundę.</b>
        {upgrade}
      </div>
    );
  };

  const councilPic = `osady/${landRace}_council1.webp`;
  // Level 6: the dwellings of the unit tiers 2-6 hang in the tree under the barracks, one tier after another; both units of a tier stand side by side
  // (the choice of one shuts the other out), a tier waits for the dwelling of the tier before it.
  const mayHireHere = mayRecruit(s, faction);
  const dwellingArt = (id: string) => `osady/dwelling_${id}.webp`;
  const extras: ExtraNode[] = state.rules.empire ? [2, 3, 4, 5, 6].flatMap((tier) => {
    const built = dwellingOf(state, faction, tier);
    const prevOk = tier === 2 || Boolean(dwellingOf(state, faction, tier - 1));
    const options = recruitsOf(state, faction).filter((r) => r.tier === tier);
    const price = DWELLING_COST[tier - 2];
    const parents = tier === 2 ? ['barracks'] : recruitsOf(state, faction).filter((r) => r.tier === tier - 1).map((r) => `dwelling-${r.id}`);
    return options.map((r) => {
      const open = mayHireHere && s.buildings.barracks >= 1 && prevOk;
      const st = built === r.id ? 'built' : built ? 'excluded' : !open ? 'blocked' : canPay(state, faction, price) ? 'open' : 'poor';
      const sub = built === r.id ? `rekrutuje: ${UNITS[r.id].name}` : !mayHireHere ? 'Tylko w osadzie własnej frakcji.' : s.buildings.barracks < 1 ? 'Najpierw: Koszary.' : !prevOk ? `Najpierw: siedlisko poziomu ${tier - 1}.` : undefined;
      return { id: `dwelling-${r.id}`, parents, name: DWELLING_NAMES[r.id], ...(sub ? { sub } : {}), cost: price, picture: dwellingArt(r.id), state: st, ...(options.length > 1 ? { choice: `tier-${tier}` } : {}) } as ExtraNode;
    });
  }) : [];
  // The detail under the tree (and in the modal of a dwelling): the name, what it does, the card of the unit, the cost and the button.
  const dwellingDetail = (unitId: string, modal = false) => {
    const r = recruitsOf(state, faction).find((x) => x.id === unitId)!;
    const tier = r.tier;
    const built = dwellingOf(state, faction, tier);
    const prevOk = tier === 2 || Boolean(dwellingOf(state, faction, tier - 1));
    const price = DWELLING_COST[tier - 2];
    const note = built ? undefined : !mayHireHere ? 'Siedliska buduje się tylko w osadzie własnej frakcji.' : s.buildings.barracks < 1 ? 'Najpierw zbuduj Koszary.' : !prevOk ? `Najpierw zbuduj siedlisko poziomu ${tier - 1}.` : tier === 6 ? undefined : 'Zbudowanie tego siedliska wyklucza drugie siedlisko tego poziomu do końca gry.';
    const action = built === unitId ? <b className="td-ok">Zbudowane</b> : built ? <i data-excluded={unitId} className="td-no">wybrano alternatywne siedlisko tego poziomu</i> : (
      <button className="btn prim" data-dwelling={unitId} disabled={!mayHireHere || s.buildings.barracks < 1 || !prevOk || !canPay(state, faction, price)} onClick={() => act({ type: 'kingdomDwelling', settlementId: s.id, unitId })}>Zbuduj</button>
    );
    return (
      <DetailPlate id={`dwelling-${unitId}`} modal={modal} picture={dwellingArt(unitId)} title={DWELLING_NAMES[unitId]} text={DWELLING_TEXTS[unitId]} note={note}
        card={<UnitCard unitId={unitId} width={modal ? 190 : 104} digital />} cost={built ? undefined : <CostIcons cost={price} have={{ gold, res: resOf(state, faction) }} size={26} />} action={action} />
    );
  };
  const sparkDetail = () => {
    const built = buildingLevel(s, 'spark') > 0;
    const ready = Boolean(buyer && mayBuildSpark(state, buyer));
    const race = raceOf(state, faction);
    const note = built ? undefined : `Cena: wszystkie Odłamki Pierwotnej Iskry (frakcja ma ${shardsOf(state, faction)} z ${shardTotal(state)}). Buduje bohater stojący w tej osadzie, który sam niesie wszystkie Odłamki${buyer ? ` (${heroLabel(buyer)} niesie ${buyer.shards ?? 0})` : ''}: przekaż je sobie wcześniej na mapie.`;
    const action = built ? <b className="td-ok">Iskra płonie w tej osadzie</b> : (
      <button className="btn prim" data-build="spark" disabled={!ready || !buyer || buyer.pos !== s.at} title={!ready ? 'Jeden bohater musi nieść wszystkie Odłamki.' : buyer?.pos !== s.at ? 'Bohater musi stać w tej osadzie.' : undefined} onClick={() => act({ type: 'kingdomBuild', settlementId: s.id, building: 'spark' })}>Wznieś</button>
    );
    return <DetailPlate id="spark" picture={buildingPicture(landRace, 'spark', 1)} title={SPARK_NAMES[race]} text={`${SPARK_TEXTS[race]}${state.rules.objective === 'relic' ? ' W tej grze jego wzniesienie wygrywa.' : ''}`} note={note} action={action} />;
  };
  const buildingDetail = (b: BuildingId) => {
    const level = buildingLevel(s, b);
    const cost = price(b);
    const parentBlock = buildBlock(s, b);
    const blocked = (b === 'barracks' && !own) || Boolean(parentBlock);
    const poor = cost !== null && !canPay(state, faction, cost);
    // A building that stands is shown as it stands now, with its upgrade described in the note; one that does not yet, as it will be.
    const shown = Math.max(0, Math.min(level, BUILDING_NAMES[b].length) - 1);
    const note = blocked ? (parentBlock ?? 'Koszary buduje się tylko w osadzie własnej frakcji.') : cost !== null && level > 0 ? `Rozbudowa na „${BUILDING_NAMES[b][level]}”: ${BUILDING_TEXTS[b][level] ?? ''}` : undefined;
    const action = cost === null ? <b className="td-ok">Gotowe</b> : (
      <button className="btn prim" disabled={poor || blocked} title={poor && !blocked ? `Za mało: potrzeba ${costText(cost)}.` : undefined} data-build={b} onClick={() => act({ type: 'kingdomBuild', settlementId: s.id, building: b })}>{level === 0 ? 'Zbuduj' : 'Rozbuduj'}</button>
    );
    return <DetailPlate id={b} picture={buildingPicture(landRace, b, Math.max(level, 1))} title={BUILDING_NAMES[b][shown]} text={BUILDING_TEXTS[b][shown] ?? ''} note={note} blocked={blocked} cost={cost === null ? undefined : <CostIcons cost={cost} have={{ gold, res: resOf(state, faction) }} size={26} />} action={action} />;
  };
  // The window of the right button (a long press on a phone) on a building, in the landscape and in the tree: what it is, its level, the price and effect of the next level.
  const info = (n: string): ReactNode => {
    const have = { gold, res: resOf(state, faction) };
    const plate = (picture: string, title: string, sub: string | null, text: string, next?: { label: string; text?: string; cost?: ReactNode }) => (
      <div className="plate parch" data-building-info={n} style={{ width: 330, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={asset(picture)} alt="" width={64} height={64} style={{ objectFit: 'contain', flex: 'none' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 21, lineHeight: 1.1 }}>{title}</div>
            {sub && <div style={{ fontSize: 14, color: '#6B4A22', fontWeight: 700 }}>{sub}</div>}
          </div>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.3 }}><RuleText text={text} /></div>
        {next && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid rgba(107, 74, 34, 0.4)', paddingTop: 6 }}>
            <b style={{ fontSize: 15 }}>{next.label}</b>
            {next.text && <div style={{ fontSize: 14, lineHeight: 1.25 }}><RuleText text={next.text} /></div>}
            {next.cost}
          </div>
        )}
      </div>
    );
    if (n === COUNCIL) return plate(councilPic, 'Rada Osady', null, 'Rada stoi w każdej osadzie od początku i nic nie kosztuje. Z niej wychodzą wszystkie budynki.');
    if (n === 'spark') return plate(buildingPicture(landRace, 'spark', 1), SPARK_NAMES[raceOf(state, faction)], buildingLevel(s, 'spark') > 0 ? 'płonie' : 'niewzniesiona', SPARK_TEXTS[raceOf(state, faction)]);
    if (n.startsWith('dwelling-')) {
      const id = n.slice(9);
      const tier = recruitsOf(state, faction).find((x) => x.id === id)?.tier ?? 2;
      const built = dwellingOf(state, faction, tier);
      return plate(dwellingArt(id), DWELLING_NAMES[id], built === id ? 'zbudowane' : built ? 'wybrano alternatywne siedlisko' : 'niezbudowane', DWELLING_TEXTS[id], built ? undefined : { label: 'Koszt budowy', cost: <CostIcons cost={DWELLING_COST[tier - 2]} have={have} size={24} /> });
    }
    const b = n as BuildingId;
    const level = buildingLevel(s, b);
    const max = BUILDING_NAMES[b].length;
    const cost = price(b);
    const shown = Math.max(0, Math.min(level, max) - 1);
    const next = cost === null ? { label: 'Najwyższy poziom: nic więcej nie da się rozbudować.' } : level === 0 ? { label: 'Koszt budowy', cost: <CostIcons cost={cost} have={have} size={24} /> } : { label: `Następny poziom: ${BUILDING_NAMES[b][level]}`, text: BUILDING_TEXTS[b][level], cost: <CostIcons cost={cost} have={have} size={24} /> };
    return plate(buildingPicture(landRace, b, Math.max(level, 1)), BUILDING_NAMES[b][shown], level === 0 ? 'jeszcze nie zbudowane' : `poziom ${level} z ${max}`, BUILDING_TEXTS[b][shown] ?? '', next);
  };
  const detail = pick?.startsWith('dwelling-') ? dwellingDetail(pick.slice(9)) : pick === 'spark' ? sparkDetail() : pick && pick !== COUNCIL ? buildingDetail(pick as BuildingId) : (
    <DetailPlate id="council" picture={councilPic} title="Rada Osady" text="Rada stoi w każdej osadzie od początku i nic nie kosztuje. Z niej wychodzą wszystkie budynki: kliknij budynek w drzewku, żeby zobaczyć jego cenę i działanie, a potem go zbudować." />
  );
  // What the landscape shows: only what stands (the Iskra's plot appears once the faction holds a shard, as it is built by the shards and not from the council).
  const standing = ORDER.filter((b) => buildingLevel(s, b) > 0);
  const dwellingsStanding = mayHireHere && state.rules.empire ? [2, 3, 4, 5, 6].filter((tier) => dwellingOf(state, faction, tier)) : [];
  const nameOf = (b: BuildingId) => { const level = buildingLevel(s, b); return level ? BUILDING_NAMES[b][Math.min(level, BUILDING_NAMES[b].length) - 1] : BUILDING_NAMES[b][0]; };
  const openBuilding = (b: BuildingId | 'council') => {
    setHover(null);
    if (b === 'council') { setView('tree'); setPick(null); } else if (b === 'barracks') setView('barracks'); else setModal(b);
  };
  const hoverInfo = (() => {
    if (!hover) return null;
    if (hover === 'council') return { name: 'Rada Osady', text: 'Tu buduje się i rozbudowuje wszystko: drzewko budynków z cenami i działaniem.' };
    if (hover.startsWith('dwelling-')) { const id = dwellingOf(state, faction, Number(hover.slice(9))); return id ? { name: DWELLING_NAMES[id], text: `Siedlisko poziomu ${hover.slice(9)}: rekrutuje ${UNITS[id].name}.` } : null; }
    const b = hover as BuildingId;
    return { name: nameOf(b), text: BUILDING_TEXTS[b][Math.min(Math.max(buildingLevel(s, b), 1), BUILDING_TEXTS[b].length) - 1] ?? '' };
  })();
  const hoverProps = (id: string) => ({ onMouseEnter: () => setHover(id), onMouseLeave: () => setHover((h) => (h === id ? null : h)), onFocus: () => setHover(id), onBlur: () => setHover((h) => (h === id ? null : h)) });
  const modalTitle = modal && !modal.startsWith('dwelling-') ? nameOf(modal as BuildingId) : '';
  const header = (
    <div className="settlement-top">
      <Ribbon side={teamFaction(state, faction)} style={{ width: 'min(520px, 90vw)' }}>{s.name}</Ribbon>
      <div className="settlement-info">
        Osada {FACTION_NAMES[raceOf(state, s.land)]}{s.owner !== s.land ? ` (zajęta przez: ${FACTION_NAMES[raceOf(state, s.owner!)]})` : ''}
      </div>
    </div>
  );
  const exitButton = <button className="sb-exit" data-enter title="Wyjdź z osady" aria-label="Wyjdź z osady" onClick={onClose}><img src={asset('ui/wyjscie.webp')} alt="" /></button>;
  // The way back from a page to the landscape: the exit button turned the other way round.
  const backButton = <button className="sb-exit back" data-tree-back title="Wróć do osady" aria-label="Wróć do osady" onClick={() => setView('town')}><img src={asset('ui/wyjscie.webp')} alt="" /></button>;
  const goldLine = (
    <div className="sb-treasury">
      <ResourceStrip state={state} faction={faction} size={view === 'barracks' ? (compact ? 20 : 26) : compact ? 24 : 32} gold={{ have: gold, income: incomeOf(state, faction) }} />
    </div>
  );
  return (
    <div className="settlement-full" data-settlement={s.id} data-view={view}>
      <div className="settlement-view">
      <div className="settlement-stage" style={{ backgroundImage: `url(${asset(`osady/land_${landRace}.jpg`)})` }}>
        {view === 'town' && (
          <>
            {standing.map((b) => {
              const level = buildingLevel(s, b);
              const at = spotOf(b, landRace);
              // An empty plot for the walls stands just inside the picture (the wall itself has its foot below the edge).
              const spot = b === 'walls' && level === 0 ? { ...at, y: Math.min(at.y, 97) } : at;
              return (
                <button key={b} className="settlement-bld" style={{ left: `${spot.x}%`, top: `${spot.y}%`, zIndex: Math.round(spot.y * 10) }} onClick={() => openBuilding(b)} aria-label={nameOf(b)} data-building={b} data-level={level} {...hoverProps(b)} {...details(() => info(b))}>
                  <img src={asset(buildingPicture(landRace, b, level))} alt="" className="settlement-pic" style={b === 'walls' ? (level > 0 ? { width: `${spot.h}cqw` } : { height: '14cqh' }) : { height: `${b === 'treasury' && level >= 2 ? spot.h * 1.15 : spot.h}cqh` }} />
                </button>
              );
            })}
            {dwellingsStanding.map((tier) => {
              const id = dwellingOf(state, faction, tier)!;
              const spot = spotOf(`dwelling-${tier}`, landRace);
              return (
                <button key={`dwelling-${tier}`} className="settlement-bld dwelling" style={{ left: `${spot.x}%`, top: `${spot.y}%`, zIndex: Math.round(spot.y * 10) }} onClick={() => { setHover(null); setModal(`dwelling-${tier}`); }} aria-label={DWELLING_NAMES[id]} data-dwelling-site={tier} {...hoverProps(`dwelling-${tier}`)} {...details(() => info(`dwelling-${id}`))}>
                  <img src={asset(`osady/dwelling_${id}.webp`)} alt="" className="settlement-pic" style={{ height: `${spot.h}cqh` }} />
                </button>
              );
            })}
            <button className="settlement-bld" style={{ left: `${councilSpot.x}%`, top: `${councilSpot.y}%`, zIndex: Math.round(councilSpot.y * 10) }} onClick={() => openBuilding('council')} aria-label="Rada Osady" data-building="council" data-level="1" {...hoverProps('council')} {...details(() => info(COUNCIL))}>
              <img src={asset(councilPic)} alt="" className="settlement-pic" style={{ height: `${councilSpot.h}cqh` }} />
            </button>
          </>
        )}
      </div>
      {view === 'town' && header}
      </div>
      {view === 'town' && (
        <>
          <div className="settlement-bar" data-service-bar>
            {heroHere && buyer && (
              <div className="sb-hero" data-hero-here>
                <Portrait unitId={buyer.id} size={56} />
                <div><b>{heroLabel(buyer)}</b><span className="sb-sub">bohater w osadzie</span></div>
              </div>
            )}
            {garrisonPanel}
            <div className="sb-info" data-hover-info>
              {hoverInfo ? <><b>{hoverInfo.name}</b><RuleText text={hoverInfo.text} /></> : <span className="sb-sub">Najedź na budynek, żeby zobaczyć jego działanie; kliknij, żeby go otworzyć. Buduje się w Radzie Osady.</span>}
            </div>
            {goldLine}
            {exitButton}
          </div>
        </>
      )}
      {view === 'tree' && (
        <div className="settlement-page">
          {header}
          <div className="settlement-field tree">
            <BuildingTree state={state} s={s} faction={faction} order={ORDER} picture={(b, level) => buildingPicture(landRace, b, Math.max(level, 1))} selected={pick} onSelect={setPick} council={{ picture: councilPic, name: 'Rada Osady' }} extras={extras} info={info} />
          </div>
          <div className="settlement-foot">
            {detail}
            <div className="settlement-actions row">{goldLine}{backButton}</div>
          </div>
        </div>
      )}
      {view === 'barracks' && (
        <div className="settlement-page">
          <div className="settlement-field sheet wide">
            <BarracksScreen state={state} s={s} faction={faction} act={act} picture={(level) => buildingPicture(landRace, 'barracks', level)} footer={<div className="settlement-actions row">{goldLine}{backButton}</div>} />
          </div>
        </div>
      )}
      <Modal open={modal !== null} onClose={() => setModal(null)}>
        {modal && (
          <div className="settlement-modal" data-service>
            <div className="gf">
              <button className="modal-x" aria-label="Zamknij" title="Zamknij" data-modal-close onClick={() => setModal(null)}>×</button>
              <div className="gi parch" style={{ padding: '14px 18px' }}>
              {modal.startsWith('dwelling-') ? dwellingDetail(dwellingOf(state, faction, Number(modal.slice(9))) ?? '', true) : (
                <>
                  <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8, paddingRight: 36 }}>{modalTitle}</div>
                  {panel(modal as BuildingId)}
                </>
              )}
            </div></div>
            <div style={{ textAlign: 'right' }}><button className="btn prim" data-enter onClick={() => setModal(null)} style={{ padding: '4px 24px', fontSize: 17 }}>Zamknij</button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
