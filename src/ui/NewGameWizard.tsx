// The new-game wizard, shared by the game on this computer and by a new table online: one page per decision, each with big
// buttons (a picture, a name, a sentence), and a "Wstecz" below. The mode and the edition are chosen before it (the menu's second page and the "Wersja
// planszowa" link); a wizard opened without them (a table online started from its menu) asks for the mode first. Single choices (level, mode) move on by
// themselves; the pages with several settings have "Dalej →". It ends with a `TableConfig` (the same shape the online tables use).

import { LevelIcon, type LevelIconKind } from './LevelIcons';
import { useEffect, useState } from 'react';
import { BOARD_MAP_SIZES, MAP_SIZE_NAMES, type MapSize } from '../engine/data';
import { readyMaps } from '../engine/customMaps';
import { OBJECTIVES } from '../engine/objectives';
import { defaultCustom, sizeAllowed } from '../engine/presets';
import { SCENARIO_BY_ID, SCENARIOS } from '../engine/scenarios';
import { ScenarioPicker } from './ScenarioPicker';
import type { Level, MapShape, Mode, ObjectiveId } from '../engine/types';
import type { TableConfig } from '../online/api';
import { asset, Frame, Ribbon } from './common';
import { CoopSwitchRows, CustomSwitchRows } from './CustomSwitchRows';
import { DIGITAL_LEVEL_TIPS, ARENA_HINT, ARENA_LEVEL_TIPS, BOARD_LEVELS, CentredChoice, chip, defaultHeroes, LEVEL_HINT, LEVEL_TIPS, LEVELS, mapTip, Row, ShapeIcon, SHAPE_NAMES, SHAPE_TIPS, SIZE_CODES, Tip, TIPS } from './setupShared';

export const EDITION_KEY = 'skd-edition';
/** The edition picked last time in this browser: digital unless the board edition was chosen. */
export function savedDigital(): boolean {
  try { return localStorage.getItem(EDITION_KEY) !== 'board'; } catch { return true; }
}

type Page = 'tier' | 'mode' | 'objective' | 'map' | 'players' | 'custom';
type Tier = TableConfig['tier'];

interface Draft {
  digital: boolean;
  tier: Tier;
  mode: Mode;
  objective: ObjectiveId;
  /** The map: a random one of a shape, or a ready one (shape "custom" and `customMapId`). */
  shape: MapShape;
  customMapId: string;
  noHorde: boolean;
  mapSize: MapSize;
  level: Level;
  count: number;
  /** Arena: 3 on 3 (quick) or 6 on 6 (full; offline only). */
  arenaSize: 3 | 6;
  custom: ReturnType<typeof defaultCustom> | null;
  /** A ready scenario (scenarios.ts) instead of a level and a map: its id, or null. */
  scenario: string | null;
}

/** The draft a finished table was made from (to come back to the wizard's last page with everything as it was). */
function draftOf(t: TableConfig): Draft {
  return {
    digital: t.digital,
    tier: t.tier,
    mode: t.mode,
    objective: t.objective,
    shape: t.shape,
    customMapId: t.customMapId ?? readyMaps()[0]?.id ?? '',
    noHorde: t.noHorde === true,
    mapSize: t.mapSize,
    level: t.level,
    count: t.seats.length,
    arenaSize: t.arenaSize === 6 ? 6 : 3,
    custom: t.tier === 'custom' && t.rules && t.battleMode ? { growth: t.growth === true, layer: t.layer ?? 'none', battleMode: t.battleMode, rules: t.rules } : null,
    scenario: t.scenario && SCENARIO_BY_ID[t.scenario] ? t.scenario : null,
  };
}

const READY_MAPS = readyMaps;

/** The digital rivalry (Potyczka): the difficulty is chosen at each bot on the seats page (backlog 94), so the wizard asks none. */
const levelsAtBots = (d: Pick<Draft, 'digital' | 'mode'>) => d.digital && d.mode === 'pvp';

/** Whether this draft plays a ready scenario (only the digital Potyczka has them). */
const readyScenario = (d: Pick<Draft, 'scenario' | 'digital' | 'mode'>) => d.scenario !== null && d.digital && d.mode === 'pvp';
/** The ready scenarios of a complexity level (none for Spacer, Przygoda and the custom settings). */
const scenariosOf = (tier: Tier) => SCENARIOS.filter((sc) => sc.tier === tier);

/** The pages this draft goes through, in order (the mode page only when no mode was chosen before the wizard). */
function pagesOf(d: Draft, askMode: boolean, online = false): Page[] {
  const pages: Page[] = [];
  if (askMode) pages.push('mode');
  // The arena has no levels of complexity: it is always the arena battle.
  if (d.digital && d.mode !== 'arena') pages.push('tier');
  // "Własne ustawienia" come right after the card; what depends on the mode waits for the players page.
  if (d.digital && d.tier === 'custom' && d.mode !== 'arena') pages.push('custom');
  const adventure = d.digital && d.tier !== 'adventure' && d.mode !== 'arena';
  // The map page: a random map (shape and size) or a ready scenario (the fuller levels), only the size elsewhere (the arena has no map).
  if (d.mode !== 'arena') pages.push('map');
  // A ready scenario brings its own goal.
  if (adventure && !readyScenario(d)) pages.push('objective');
  // The players page has nothing to ask in a Potyczka on this computer (the seats page comes next).
  if (!levelsAtBots(d) || online) pages.push('players');
  return pages;
}

const TITLES: Record<Page, string> = {
  tier: 'Jaki poziom złożoności?',
  mode: 'Jaki tryb gry?',
  objective: 'Jaki cel gry?',
  map: 'Jaka mapa?',
  players: 'Gracze i trudność',
  custom: 'Własne ustawienia',
};

/** A big choice: a picture, a name and a sentence. */
function Card({ img, title, text, on, onClick, disabled, wide, badge }: { img: React.ReactNode; title: string; badge?: string; text: string; on?: boolean; onClick: () => void; disabled?: boolean; wide?: boolean }) {
  return (
    <button className={`opt-card ${on ? 'on' : ''} ${wide ? 'wide' : ''}`} aria-pressed={on} disabled={disabled} onClick={onClick}>
      {badge && <span className="opt-card-badge" aria-hidden="true">{badge}</span>}
      <span className="opt-card-img">{img}</span>
      <span className="opt-card-title">{title}</span>
      <span className="opt-card-text">{text}</span>
    </button>
  );
}

/** The animal that shows how hard a difficulty level is: a rabbit, a wolf, a bear, a dragon (one-colour SVG icons, see LevelIcons.tsx). */
const LEVEL_ANIMAL: Record<string, LevelIconKind> = { zero: 'rabbit', kids: 'rabbit', normal: 'wolf', hard: 'bear', veryHard: 'dragon' };

const pic = (src: string) => <img src={src} alt="" />;

const OBJECTIVE_ICON: Record<ObjectiveId, string> = {
  crystals: 'ui/menu/krysztaly.webp',
  control: 'ui/menu/kontrola.webp',
  survival: 'ui/menu/przetrwanie.webp',
  boss: 'ui/menu/boss.webp',
  artifact: 'ikony/artefakty/blade2.webp',
  conquest: 'ui/menu/podboj.webp',
  relic: 'ui/menu/relikt.webp',
};

/** The draft with a mode picked: the player count and the level a mode allows. */
function withMode(d: Draft, mode: Mode, _online: boolean): Draft {
  // One player against the Horde's computer is a table of its own in the digital game (the online game needs two people at least).
  const count = mode === 'pvp' ? Math.max(2, d.count) : mode === 'arena' ? 2 : Math.min(3, d.count);
  const level = mode === 'pvp' && d.level === 'hard' && !d.digital ? 'normal' : mode === 'arena' && d.level === 'zero' ? 'kids' : d.level;
  return { ...d, mode, count, level, ...(mode === 'arena' ? { tier: 'adventure' as Tier } : {}) };
}

export function NewGameWizard({ online, onBack, onFinish, links, initial, mode: fixedMode, digital: fixedDigital }: { online: boolean; onBack: () => void; onFinish: (table: TableConfig) => void; links?: React.ReactNode; initial?: TableConfig; mode?: Mode; digital?: boolean }) {
  /** Without a mode chosen before, the wizard starts with the mode page. */
  const askMode = fixedMode === undefined;
  const [d, setD] = useState<Draft>(() => (initial ? draftOf(initial) : withMode({
    digital: fixedDigital ?? true,
    tier: 'adventure',
    mode: 'pvp',
    objective: 'crystals',
    shape: 'triangle',
    customMapId: readyMaps()[0]?.id ?? '',
    noHorde: false,
    mapSize: 'short',
    level: 'normal',
    count: 1,
    arenaSize: 3,
    custom: null,
    scenario: null,
  }, fixedMode ?? ((fixedDigital ?? true) ? 'pvp' : 'coop'), online)));
  /** The level and the goal start with nothing lit (there is no "Dalej" on those pages: a lit default would look like a choice already made); editing a table has both. */
  const [picked, setPicked] = useState({ tier: initial !== undefined, objective: initial !== undefined });
  const [page, setPage] = useState<Page>(() => { const list = pagesOf(d, askMode, online); return initial ? list[list.length - 1] : list[0]; });
  const pages = pagesOf(d, askMode, online);
  const at = pages.indexOf(page);
  // On a phone the next page must start at its top, not where the last one was scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0);
    for (const el of Array.from(document.querySelectorAll('.scroll'))) el.scrollTop = 0;
  }, [page]);
  const markPicked = (p: Partial<Draft>) => {
    if ('tier' in p || 'objective' in p) setPicked((cur) => ({ tier: cur.tier || 'tier' in p, objective: cur.objective || 'objective' in p }));
  };
  const patch = (p: Partial<Draft>) => {
    markPicked(p);
    setD((cur) => ({ ...cur, ...p }));
  };
  /** The next page of the draft `next` (it may change which pages exist). */
  const goFrom = (cur: Page, next: Draft) => {
    const list = pagesOf(next, askMode, online);
    const i = list.indexOf(cur);
    // A choice on the last page (a goal, when nothing follows it) finishes the table.
    if (i >= list.length - 1) return finish(next.custom, next);
    setPage(list[i + 1]);
  };
  const choose = (p: Partial<Draft>, advance = true) => {
    markPicked(p);
    // Another level leaves the scenario of the old one.
    const next = { ...d, ...('tier' in p && !('scenario' in p) && d.scenario !== null && SCENARIO_BY_ID[d.scenario]?.tier !== p.tier ? { scenario: null, shape: d.shape === 'custom' ? ('triangle' as MapShape) : d.shape } : {}), ...p };
    // The custom page starts from what the level preset sets (the mode is not known yet: the mode-bound switches come on the players page).
    if (next.tier === 'custom' && !next.custom) next.custom = defaultCustom(next.level, next.mode);
    setD(next);
    if (advance) goFrom(page, next);
  };
  const back = () => (at <= 0 ? onBack() : setPage(pages[at - 1]));

  const arena = d.mode === 'arena';
  /** Level 0 belongs to the first card only: every other tier plays a difficulty of the full game. */
  const notZero: Level = d.level === 'zero' ? 'kids' : d.level;
  const ready = d.shape === 'custom';
  const scenarioOn = readyScenario(d);
  /** The Potyczka of a level that has ready scenarios offers them beside the random map. */
  const scenarioOffer = d.digital && d.mode === 'pvp' && d.tier !== 'adventure' && scenariosOf(d.tier).length > 0;
  /** The goal the game will be played for (Spacer and Przygoda: the crystals). */
  const goalNow: ObjectiveId = d.digital && d.tier !== 'adventure' && d.mode !== 'arena' ? d.objective : 'crystals';
  // A goal that is not offered on the chosen size moves the size to the nearest one it is offered on.
  useEffect(() => {
    if (!d.digital || sizeAllowed(goalNow, d.mapSize)) return;
    const at = sizes.indexOf(d.mapSize);
    const nearest = sizes.filter((m) => sizeAllowed(goalNow, m)).sort((a, b) => Math.abs(sizes.indexOf(a) - at) - Math.abs(sizes.indexOf(b) - at))[0];
    if (nearest) setD((cur) => ({ ...cur, mapSize: nearest }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalNow, d.mapSize, d.digital]);
  /** The map page of the fuller levels also picks the map (random of a shape, or a ready one); elsewhere (Spacer, Przygoda, the board edition) only its size. */
  const fullMap = d.digital && d.tier !== 'adventure';
  const sizes = (Object.keys(MAP_SIZE_NAMES) as MapSize[]).filter((m) => d.digital || BOARD_MAP_SIZES.includes(m));

  const setMode = (mode: Mode) => {
    const next = withMode(d, mode, online);
    setD(next);
    goFrom(page, next);
  };

  /** The finished table: what the online room and the local setup are made from. */
  const finish = (custom = d.custom, dd: Draft = d) => {
    const sc = readyScenario(dd) ? SCENARIO_BY_ID[dd.scenario!] : undefined;
    if (sc) {
      try { localStorage.setItem(EDITION_KEY, 'digital'); } catch { /* private mode */ }
      return onFinish({ mode: dd.mode, digital: true, tier: sc.tier, objective: sc.objective, shape: 'custom', customMapId: sc.mapId, mapSize: sc.mapSize, level: 'normal', scenario: sc.id, seats: defaultHeroes(dd.mode, dd.count).map((seat) => ({ ...seat, bot: false })) });
    }
    const tier: Tier = !dd.digital || dd.mode === 'arena' ? 'adventure' : dd.tier;
    const table: TableConfig = {
      mode: dd.mode,
      digital: dd.digital,
      tier,
      objective: tier === 'adventure' ? 'crystals' : dd.objective,
      shape: tier === 'adventure' ? 'triangle' : dd.shape,
      ...(tier !== 'adventure' && dd.shape === 'custom' ? { customMapId: dd.customMapId } : {}),
      ...(tier !== 'adventure' && dd.mode === 'coop' && dd.objective === 'boss' && dd.noHorde ? { noHorde: true } : {}),
      mapSize: dd.mapSize,
      // A Potyczka plays the rules of its complexity level (level 0's or Normal's); the bots have their levels.
      level: levelsAtBots(dd) ? (dd.level === 'zero' ? 'zero' : 'normal') : dd.level,
      ...(dd.mode === 'arena' && dd.arenaSize === 6 ? { arenaSize: 6 as const } : {}),
      ...(tier === 'custom' && custom ? { growth: custom.growth, layer: custom.layer, battleMode: custom.battleMode, rules: custom.rules } : {}),
      // Online every seat waits for a player, except the arena's opponent.
      seats: defaultHeroes(dd.mode, dd.count).map((seat, i) => ({ ...seat, bot: dd.mode === 'arena' && i === 1 })),
    };
    // The rules window shows the cards of the edition played last.
    try { localStorage.setItem(EDITION_KEY, dd.digital ? 'digital' : 'board'); } catch { /* private mode: only for this visit */ }
    onFinish(table);
  };
  const next = () => {
    if (at >= pages.length - 1) return finish();
    setPage(pages[at + 1]);
  };
  const last = at >= pages.length - 1;

  return (
    <Frame crest style={{ width: 'min(1100px, 96vw)', position: 'relative' }} innerClass="slate scroll" innerStyle={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {links}
      <Ribbon style={{ width: 'min(520px, 90vw)', alignSelf: 'center' }}>{page === 'map' && !fullMap ? 'Jak duża mapa?' : page === 'players' && !online && !arena ? 'Trudność' : TITLES[page]}</Ribbon>
      <div style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', marginTop: -6 }}>
        Krok {at + 1} z {pages.length}{d.digital ? '' : ' · wersja planszowa'}{online ? ' · stół online' : ''}
      </div>

      {page === 'tier' && (
        <div className="opt-grid" data-wizard-page="tier">
          <Card on={picked.tier && d.tier === 'adventure' && d.level === 'zero'} title="Spacer" badge="I" text="Dla najmłodszych (od 5 lat): krótkie pojedynki bohaterów na planszy, bez zdolności i kości, bez rytuału. Zasady do ogarnięcia w kilka minut." img={pic(asset('ui/menu/krolik.webp'))} onClick={() => choose({ tier: 'adventure', level: 'zero' })} />
          <Card on={picked.tier && d.tier === 'adventure' && d.level !== 'zero'} title="Przygoda" badge="II" text="Pełne bitwy na arenie, kryształy do Drzewa, mapa-trójkąt, bohaterowie bez rozwoju. Najprostszy start z pełną grą." img={pic(asset('ui/menu/przygoda.webp'))} onClick={() => choose({ tier: 'adventure', level: notZero })} />
          <Card on={picked.tier && d.tier === 'expedition'} title="Wyprawa" badge="III" text="Bohaterowie zdobywają doświadczenie, artefakty i umiejętności; do wyboru cel gry i mapa." img={pic(asset('ui/menu/wyprawa.webp'))} onClick={() => choose({ tier: 'expedition', level: notZero })} />
          <Card on={picked.tier && d.tier === 'kingdom'} title="Osada" badge="IV" text="Osady, złoto i rekrutacja: dochód z osad i kopalni, budynki, targ z artefaktami, szpital i drużyna do pięciu pomocników." img={pic(asset('ui/menu/osada.webp'))} onClick={() => choose({ tier: 'kingdom', level: notZero })} />
          <Card on={picked.tier && d.tier === 'economy'} title="Księstwo" badge="V" text="Osada plus gospodarka: drewno, ruda i Gwiezdny Pył z kopalni i osad, budynki za surowce (jeden na rundę), legendarne artefakty za Pył." img={pic(asset('ui/menu/ksiestwo.webp'))} onClick={() => choose({ tier: 'economy', level: notZero })} />
          <Card on={picked.tier && d.tier === 'realm'} title="Królestwo" badge="VI" text="Księstwo plus bohaterowie i magia: drugi bohater-dowódca najęty w karczmie, czary w bitwie i na mapie, specjalności bohaterów." img={pic(asset('ui/menu/krolestwo.webp'))} onClick={() => choose({ tier: 'realm', level: notZero })} />
          <Card on={picked.tier && d.tier === 'empire'} title="Imperium" badge="VII" text="Królestwo plus frakcje i Relikt: Odłamki Pierwotnej Iskry, budynek Pierwotnej Iskry, mechaniki i legendarna jednostka frakcji." img={pic(asset('ui/menu/imperium.webp'))} onClick={() => choose({ tier: 'empire', level: notZero })} />
          <Card on={picked.tier && d.tier === 'custom'} title="Własne ustawienia" badge="?" text="Każdy przełącznik osobno: rozwój bohatera, rodzaj bitew, ułatwienia i utrudnienia." img={pic(asset('ui/menu/wlasne.webp'))} onClick={() => choose({ tier: 'custom', level: notZero, custom: null })} />
        </div>
      )}

      {page === 'mode' && (
        <div className="opt-grid" data-wizard-page="mode">
          {!d.digital && <Card on={d.mode === 'coop'} title="Kooperacja" text={TIPS.coop} img={pic(asset('ui/menu/koop.webp'))} onClick={() => setMode('coop')} />}
          <Card on={d.mode === 'pvp'} title={d.digital ? 'Potyczka' : 'Rywalizacja'} text={d.digital ? TIPS.skirmish : TIPS.pvp} img={pic(asset('ui/menu/rywal.webp'))} onClick={() => setMode('pvp')} />
          <Card on={arena} title="Arena" text={TIPS.arenaMode} img={pic(asset('ui/menu/arena.webp'))} onClick={() => setMode('arena')} />
        </div>
      )}

      {page === 'objective' && (
        <>
          <div className="opt-grid" data-wizard-page="objective">
            {(['crystals', 'control', 'survival', 'boss', 'artifact', 'conquest', 'relic'] as const).filter((o) => (o !== 'conquest' || ['economy', 'realm', 'empire'].includes(d.tier)) && (o !== 'relic' || d.tier === 'empire')).map((o) => (
              <Card key={o} on={picked.objective && d.objective === o} title={OBJECTIVES[o].name} text={OBJECTIVES[o].summary} img={pic(asset(OBJECTIVE_ICON[o]))} onClick={() => (d.mode === 'coop' && o === 'boss' ? patch({ objective: o }) : choose({ objective: o }))} />
            ))}
          </div>
          {d.mode === 'coop' && d.objective === 'boss' && (
            <Row label="Horda">
              <Tip text="Horda prowadzi swoich bohaterów i też atakuje Bossa."><button className={chip(!d.noHorde)} aria-pressed={!d.noHorde} onClick={() => patch({ noHorde: false })}>Gra przeciw nam</button></Tip>
              <Tip text="Wszyscy gracze razem przeciw samemu Bossowi: Horda nie ma bohaterów, a Boss ma trochę więcej Życia."><button className={chip(d.noHorde)} aria-pressed={d.noHorde} onClick={() => patch({ noHorde: true })}>Bez Hordy, wszyscy przeciw Bossowi</button></Tip>
            </Row>
          )}
        </>
      )}

      {page === 'map' && (
        <div data-wizard-page="map" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fullMap && (
            <>
              <div className="opt-grid compact">
                <Card on={!scenarioOn && !ready} title="Losowa" text="Mapa zrobiona na nowo przy każdej partii, w wybranym kształcie i rozmiarze." img={pic(asset('ui/menu/losowa.webp'))} onClick={() => patch({ scenario: null, ...(ready ? { shape: 'triangle' as MapShape } : {}) })} />
                {(scenarioOffer || scenarioOn) && <Card on={scenarioOn} title="Gotowy scenariusz" text="Ręcznie narysowana mapa z gotowym celem: wybierasz z listy scenariuszy tego poziomu." img={pic(asset('ui/menu/gotowa.webp'))} onClick={() => patch({ scenario: d.scenario ?? scenariosOf(d.tier)[0].id })} />}
                {/* A table made before the scenarios existed keeps its ready map. */}
                {ready && !scenarioOn && <Card on title="Gotowa" text="Ręcznie narysowana mapa, zawsze taka sama, w jednym rozmiarze." img={pic(asset('ui/menu/gotowa.webp'))} onClick={() => undefined} />}
              </div>
              {scenarioOn ? (
                <ScenarioPicker selected={d.scenario} tier={d.tier as Exclude<Tier, 'adventure' | 'custom'>} onSelect={(id) => patch({ scenario: id })} />
              ) : !ready ? (
                <CentredChoice label="Wybierz kształt">
                  {(Object.keys(SHAPE_NAMES) as MapShape[]).filter((sh) => sh !== 'custom').map((sh) => (
                    <Tip key={sh} text={SHAPE_TIPS[sh]} rightClick>
                      <button className={`${chip(d.shape === sh)} shape-btn`} aria-pressed={d.shape === sh} data-shape={sh} onClick={() => patch({ shape: sh })}>
                        <ShapeIcon shape={sh} width={92} />
                        <span>{SHAPE_NAMES[sh]}</span>
                      </button>
                    </Tip>
                  ))}
                </CentredChoice>
              ) : (
                <CentredChoice label="Wybierz mapę">
                  {READY_MAPS().map((m) => (
                    <Tip key={m.id} text={m.summary} rightClick><button className={`${chip(d.customMapId === m.id)} shape-btn`} aria-pressed={d.customMapId === m.id} data-map={m.id} onClick={() => patch({ customMapId: m.id })}>{m.name}</button></Tip>
                  ))}
                </CentredChoice>
              )}
            </>
          )}
          {!(fullMap && ready) && !scenarioOn && (
            <CentredChoice label="Wielkość mapy">
              {sizes.map((m) => {
                const off = d.digital && !sizeAllowed(goalNow, m);
                return (
                  <span key={m} className="size-slot">
                    <Tip text={mapTip(m)} rightClick>
                      <button className={`${chip(d.mapSize === m)} size-btn map-size-btn`} aria-pressed={d.mapSize === m} data-size={m} disabled={off} onClick={() => patch({ mapSize: m })}>
                        <b className="size-code">{SIZE_CODES[m]}</b>
                        <span>{MAP_SIZE_NAMES[m]}</span>
                      </button>
                    </Tip>
                    {off && <span className="size-off">Rozmiar niedostępny dla tego celu</span>}
                  </span>
                );
              })}
            </CentredChoice>
          )}
        </div>
      )}

      {page === 'players' && (
        <div data-wizard-page="players" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {arena ? (
            <>
              <div style={{ fontSize: 15, color: 'var(--muted)', textAlign: 'center' }}>{ARENA_HINT}</div>
              {(
                <Row label="Wielkość bitwy">
                  <Tip text="Szybka: bohater i dwóch pomocników, skarby z talii. Pełna: bohater i pięciu pomocników z puli ośmiu, artefakt do wyboru z trzech i dwa czary.">
                    <button className={chip(d.arenaSize === 3)} aria-pressed={d.arenaSize === 3} data-arena-size="3" onClick={() => patch({ arenaSize: 3 })}>3 na 3 (szybka)</button>
                  </Tip>
                  <Tip text="Pełna: bohater i pięciu pomocników z puli ośmiu, artefakt do wyboru z trzech i dwa czary z kręgów I–II.">
                    <button className={chip(d.arenaSize === 6)} aria-pressed={d.arenaSize === 6} data-arena-size="6" onClick={() => patch({ arenaSize: 6 })}>6 na 6 (pełna)</button>
                  </Tip>
                </Row>
              )}
            </>
          ) : online && (
            <Row label="Liczba graczy">
              {/* At most 3 players per faction (its three heroes): coop (all Przymierze) takes 1–3, PvP 2–6; 7–8 players (a fourth hero a side) only on the levels without the tavern commanders. */}
              {(d.mode === 'coop' ? [1, 2, 3] : [2, 3, 4, 5, 6, 7, 8]).map((n) => (
                <button key={n} className={`${chip(d.count === n)} count-chip`} aria-pressed={d.count === n} onClick={() => patch({ count: n })}>{n}</button>
              ))}
            </Row>
          )}
          {(arena || (d.level !== 'zero' && !levelsAtBots(d)) || !d.digital) && (
          <Row label={arena ? 'Komputer' : 'Trudność'}>
            {(arena || d.digital ? LEVELS : BOARD_LEVELS).filter(([l]) => l !== 'custom' && (l !== 'hard' || d.mode !== 'pvp' || d.digital)).map(([l, label]) => (
              <Tip key={l} text={arena ? ARENA_LEVEL_TIPS[l as Level] : (d.digital && DIGITAL_LEVEL_TIPS[l]) || LEVEL_TIPS[l]}>
                <button className={`${chip(d.level === l)} size-btn level-btn`} aria-pressed={d.level === l} data-level={l} onClick={() => patch({ level: l as Level, custom: null })}>
                  {LEVEL_ANIMAL[l as string] && <span className="level-btn-icon"><LevelIcon kind={LEVEL_ANIMAL[l as string]} size="100%" /></span>}
                  <span>{label}</span>
                </button>
              </Tip>
            ))}
          </Row>
          )}
          {levelsAtBots(d) && <div style={{ fontSize: 15, color: 'var(--muted)', textAlign: 'center' }}>Poziom trudności wybierzesz przy każdym bocie, przy stole.</div>}
          {!arena && !levelsAtBots(d) && <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -4, textAlign: 'center' }}>{(d.digital && DIGITAL_LEVEL_TIPS[d.level]) || LEVEL_HINT[d.level]}</div>}
          {d.tier === 'custom' && d.custom && d.mode === 'coop' && !arena && <CoopSwitchRows rules={d.custom.rules} onRules={(r) => patch({ custom: { ...d.custom!, rules: { ...d.custom!.rules, ...r } } })} />}
        </div>
      )}

      
      {page === 'custom' && d.custom && (
        <div data-wizard-page="custom">
          <CustomSwitchRows
            growth={d.custom.growth}
            layer={d.custom.layer}
            battleMode={d.custom.battleMode}
            rules={d.custom.rules}
            onGrowth={(growth) => patch({ custom: { ...d.custom!, growth, ...(growth ? {} : { layer: 'none' as const }) } })}
            // A layer button also switches growth on (onGrowth(true) runs just before, from the same stale `d.custom`), so it has to set growth itself.
            onLayer={(layer) => patch({ custom: { ...d.custom!, growth: true, layer } })}
            onBattleMode={(battleMode) => patch({ custom: { ...d.custom!, battleMode } })}
            onRules={(r) => patch({ custom: { ...d.custom!, rules: { ...d.custom!.rules, ...r } } })}
          />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
        <button className="btn plate parch wizard-nav" onClick={back} data-wizard-back>← Wstecz</button>
        {/* The objective goes on by itself when one is picked; the coop Boss still needs its Horde choice, so it keeps the button. */}
        {(page === 'players' || page === 'custom' || page === 'map' || (page === 'objective' && d.mode === 'coop' && d.objective === 'boss')) && (
          <button className="btn prim wizard-nav" onClick={next} data-wizard-next>{last ? (online ? 'Utwórz stół' : 'Dalej →') : 'Dalej →'}</button>
        )}
      </div>
    </Frame>
  );
}
