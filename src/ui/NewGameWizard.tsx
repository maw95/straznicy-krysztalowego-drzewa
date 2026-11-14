// The new-game wizard, shared by the game on this computer and by a new table online: one page per decision, each with big
// buttons (a picture, a name, a sentence), and a "Wstecz" below. Single choices (edition, level, mode) move on by themselves;
// the pages with several settings have "Dalej →". It ends with a `TableConfig` (the same shape the online tables use).

import { useState } from 'react';
import { BOARD_MAP_SIZES, MAP_SIZE_NAMES, type MapSize } from '../engine/data';
import { CUSTOM_MAPS } from '../engine/customMaps';
import { OBJECTIVES } from '../engine/objectives';
import { defaultCustom } from '../engine/presets';
import type { Level, MapShape, Mode, ObjectiveId } from '../engine/types';
import type { TableConfig } from '../online/api';
import { asset, Frame, Ribbon } from './common';
import { CustomSwitchRows } from './CustomSwitchRows';
import { ARENA_HINT, ARENA_LEVEL_TIPS, CentredChoice, chip, defaultHeroes, LEVEL_HINT, LEVEL_TIPS, LEVELS, mapTip, Row, ShapeIcon, SHAPE_NAMES, SHAPE_TIPS, SIZE_CODES, Tip, TIPS } from './setupShared';

export const EDITION_KEY = 'skd-edition';
/** The edition picked last time in this browser: digital unless the board edition was chosen. */
export function savedDigital(): boolean {
  try { return localStorage.getItem(EDITION_KEY) !== 'board'; } catch { return true; }
}

type Page = 'edition' | 'tier' | 'mode' | 'objective' | 'map' | 'players' | 'custom';
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
  custom: ReturnType<typeof defaultCustom> | null;
}

/** The draft a finished table was made from (to come back to the wizard's last page with everything as it was). */
function draftOf(t: TableConfig): Draft {
  return {
    digital: t.digital,
    tier: t.tier,
    mode: t.mode,
    objective: t.objective,
    shape: t.shape,
    customMapId: t.customMapId ?? Object.keys(CUSTOM_MAPS)[0] ?? '',
    noHorde: t.noHorde === true,
    mapSize: t.mapSize,
    level: t.level,
    count: t.seats.length,
    custom: t.tier === 'custom' && t.rules && t.battleMode ? { growth: t.growth === true, battleMode: t.battleMode, rules: t.rules } : null,
  };
}

const READY_MAPS = () => Object.values(CUSTOM_MAPS);

/** The pages this draft goes through, in order. */
function pagesOf(d: Draft): Page[] {
  const pages: Page[] = ['edition'];
  if (d.digital) pages.push('tier');
  pages.push('mode');
  const adventure = d.digital && d.tier !== 'adventure' && d.mode !== 'arena';
  if (adventure) pages.push('objective', 'map');
  pages.push('players');
  if (adventure && d.tier === 'custom') pages.push('custom');
  return pages;
}

const TITLES: Record<Page, string> = {
  edition: 'W którą wersję gramy?',
  tier: 'Jaki poziom złożoności?',
  mode: 'Jaki tryb gry?',
  objective: 'Jaki cel gry?',
  map: 'Jaka mapa?',
  players: 'Gracze, wielkość mapy i trudność',
  custom: 'Własne ustawienia',
};

/** A big choice: a picture, a name and a sentence. */
function Card({ img, title, text, on, onClick, disabled, wide }: { img: React.ReactNode; title: string; text: string; on?: boolean; onClick: () => void; disabled?: boolean; wide?: boolean }) {
  return (
    <button className={`opt-card ${on ? 'on' : ''} ${wide ? 'wide' : ''}`} aria-pressed={on} disabled={disabled} onClick={onClick}>
      <span className="opt-card-img">{img}</span>
      <span className="opt-card-title">{title}</span>
      <span className="opt-card-text">{text}</span>
    </button>
  );
}

/** The animal that shows how hard a difficulty level is: a rabbit, a wolf, a dragon. */
const LEVEL_ANIMAL: Record<string, string> = { kids: 'krolik', normal: 'wilk', hard: 'smok' };

const pic = (src: string) => <img src={src} alt="" />;

const OBJECTIVE_ICON: Record<ObjectiveId, string> = {
  crystals: 'ui/menu/krysztaly.webp',
  control: 'ikony/mapa/kontrola_dawn.webp',
  survival: 'ui/menu/przetrwanie.webp',
  boss: 'ui/menu/boss.webp',
  artifact: 'ikony/artefakty/blade2.webp',
};

export function NewGameWizard({ online, onBack, onFinish, links, initial }: { online: boolean; onBack: () => void; onFinish: (table: TableConfig) => void; links?: React.ReactNode; initial?: TableConfig }) {
  const [d, setD] = useState<Draft>(() => (initial ? draftOf(initial) : {
    digital: savedDigital(),
    tier: 'adventure',
    mode: 'coop',
    objective: 'crystals',
    shape: 'triangle',
    customMapId: Object.keys(CUSTOM_MAPS)[0] ?? '',
    noHorde: false,
    mapSize: 'short',
    level: 'normal',
    count: 1,
    custom: null,
  }));
  const [page, setPage] = useState<Page>(initial ? 'players' : 'edition');
  const pages = pagesOf(d);
  const at = pages.indexOf(page);
  const patch = (p: Partial<Draft>) => setD((cur) => ({ ...cur, ...p }));
  /** The next page of the draft `next` (it may change which pages exist). */
  const goFrom = (cur: Page, next: Draft) => {
    const list = pagesOf(next);
    const i = list.indexOf(cur);
    setPage(list[Math.min(list.length - 1, i + 1)]);
  };
  const choose = (p: Partial<Draft>, advance = true) => {
    const next = { ...d, ...p };
    setD(next);
    if (advance) goFrom(page, next);
  };
  const back = () => (at <= 0 ? onBack() : setPage(pages[at - 1]));

  const arena = d.mode === 'arena';
  const ready = d.shape === 'custom';
  const sizes = (Object.keys(MAP_SIZE_NAMES) as MapSize[]).filter((m) => d.digital || BOARD_MAP_SIZES.includes(m));

  const setEdition = (digital: boolean) => {
    try { localStorage.setItem(EDITION_KEY, digital ? 'digital' : 'board'); } catch { /* private mode: only for this visit */ }
    // The board edition has no levels and fewer map sizes.
    choose({ digital, ...(digital ? {} : { tier: 'adventure' as Tier, objective: 'crystals' as ObjectiveId, shape: 'triangle' as MapShape, ...(BOARD_MAP_SIZES.includes(d.mapSize) ? {} : { mapSize: 'veryLong' as MapSize }) }) });
  };
  const setMode = (mode: Mode) => {
    const count = mode === 'pvp' ? Math.max(2, d.count) : mode === 'arena' ? 2 : Math.min(3, d.count);
    const level = mode === 'pvp' && d.level === 'hard' ? 'normal' : d.level;
    choose({ mode, count, level, custom: null, ...(mode !== 'coop' && d.objective === 'survival' ? { objective: 'crystals' as ObjectiveId } : {}) });
  };

  /** The finished table: what the online room and the local setup are made from. */
  const finish = (custom = d.custom) => {
    const tier: Tier = !d.digital || arena ? 'adventure' : d.tier;
    const table: TableConfig = {
      mode: d.mode,
      digital: d.digital,
      tier,
      objective: tier === 'adventure' ? 'crystals' : d.objective,
      shape: tier === 'adventure' ? 'triangle' : d.shape,
      ...(tier !== 'adventure' && d.shape === 'custom' ? { customMapId: d.customMapId } : {}),
      ...(tier !== 'adventure' && d.mode === 'coop' && d.objective === 'boss' && d.noHorde ? { noHorde: true } : {}),
      mapSize: d.mapSize,
      level: d.level,
      ...(tier === 'custom' && custom ? { growth: custom.growth, battleMode: custom.battleMode, rules: custom.rules } : {}),
      // Online every seat waits for a player, except the arena's opponent.
      seats: defaultHeroes(d.mode, d.count).map((seat, i) => ({ ...seat, bot: d.mode === 'arena' && i === 1 })),
    };
    onFinish(table);
  };
  const next = () => {
    if (page === 'players' && pages.includes('custom')) {
      const custom = d.custom ?? defaultCustom(d.level, d.mode);
      patch({ custom });
      setPage('custom');
      return;
    }
    if (at >= pages.length - 1) return finish();
    setPage(pages[at + 1]);
  };
  const last = at >= pages.length - 1;

  return (
    <Frame crest style={{ width: 'min(1100px, 96vw)', position: 'relative' }} innerClass="slate scroll" innerStyle={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {links}
      <Ribbon style={{ width: 'min(520px, 90vw)', alignSelf: 'center' }}>{TITLES[page]}</Ribbon>
      <div style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', marginTop: -6 }}>
        Krok {at + 1} z {pages.length} · {d.digital ? 'wersja cyfrowa' : 'wersja planszowa'}{online ? ' · stół online' : ''}
      </div>

      {page === 'edition' && (
        <div className="opt-grid" data-wizard-page="edition">
          <Card on={d.digital} title="Cyfrowa" text={TIPS.digital} img={pic(asset('ui/menu/cyfrowa.webp'))} onClick={() => setEdition(true)} />
          <Card on={!d.digital} title="Planszowa" text="Wierna planszówka: zasady bez zmian, malowana arena i figurki 3D. Do grania tak, jakby karty i plansza leżały na stole." img={pic(asset('ui/menu/planszowa.webp'))} onClick={() => setEdition(false)} />
        </div>
      )}

      {page === 'tier' && (
        <div className="opt-grid" data-wizard-page="tier">
          <Card on={d.tier === 'adventure'} title="Przygoda" text="Poziom 1. Zasady z planszówki w wersji cyfrowej: kryształy do Drzewa, mapa-trójkąt, bohaterowie bez rozwoju. Najprostszy start, także dla dzieci." img={pic(asset('ui/menu/przygoda.webp'))} onClick={() => choose({ tier: 'adventure' })} />
          <Card on={d.tier === 'expedition'} title="Wyprawa" text="Poziom 2. Bohaterowie zdobywają doświadczenie, artefakty i umiejętności; do wyboru cel gry i mapa." img={pic(asset('ikony/mapa/camp.webp'))} onClick={() => choose({ tier: 'expedition' })} />
          <Card on={d.tier === 'kingdom'} title="Królestwo" text="Poziom 3. Osady, złoto i rekrutacja: dochód z osad i kopalni, budynki, targ z artefaktami, szpital i drużyna do pięciu pomocników." img={pic(asset('ikony/mapa/treasure.webp'))} onClick={() => choose({ tier: 'kingdom' })} />
          <Card on={d.tier === 'custom'} title="Własne ustawienia" text="Każdy przełącznik osobno: rozwój bohatera, rodzaj bitew, ułatwienia i utrudnienia." img={pic(asset('ui/menu/wlasne.webp'))} onClick={() => choose({ tier: 'custom', custom: null })} />
        </div>
      )}

      {page === 'mode' && (
        <div className="opt-grid" data-wizard-page="mode">
          <Card on={d.mode === 'coop'} title="Kooperacja" text={TIPS.coop} img={pic(asset('ui/menu/koop.webp'))} onClick={() => setMode('coop')} />
          <Card on={d.mode === 'pvp'} title="Rywalizacja" text={TIPS.pvp} img={pic(asset('ui/menu/rywal.webp'))} onClick={() => setMode('pvp')} />
          <Card on={arena} title="Arena" text={TIPS.arenaMode} img={pic(asset('ui/menu/arena.webp'))} onClick={() => setMode('arena')} />
        </div>
      )}

      {page === 'objective' && (
        <>
          <div className="opt-grid" data-wizard-page="objective">
            {(['crystals', 'control', 'survival', 'boss', 'artifact'] as const).filter((o) => o !== 'survival' || d.mode === 'coop').map((o) => (
              <Card key={o} on={d.objective === o} title={OBJECTIVES[o].name} text={OBJECTIVES[o].summary} img={pic(asset(OBJECTIVE_ICON[o]))} onClick={() => patch({ objective: o })} />
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
        <>
          <div className="opt-grid" data-wizard-page="map">
            <Card on={!ready} title="Losowa" text="Mapa zrobiona na nowo przy każdej partii, w wybranym kształcie i rozmiarze." img={pic(asset('ui/menu/losowa.webp'))} onClick={() => patch({ shape: !ready ? d.shape : 'triangle' })} />
            <Card on={ready} disabled={READY_MAPS().length === 0} title="Gotowa" text="Ręcznie narysowana mapa, zawsze taka sama, w jednym rozmiarze." img={pic(asset('ui/menu/gotowa.webp'))} onClick={() => patch({ shape: 'custom' })} />
          </div>
          {!ready ? (
            <CentredChoice label="Wybierz kształt">
              {(Object.keys(SHAPE_NAMES) as MapShape[]).filter((sh) => sh !== 'custom').map((sh) => (
                <Tip key={sh} text={SHAPE_TIPS[sh]}>
                  <button className={`${chip(d.shape === sh)} shape-btn`} aria-pressed={d.shape === sh} onClick={() => patch({ shape: sh })}>
                    <ShapeIcon shape={sh} width={92} />
                    <span>{SHAPE_NAMES[sh]}</span>
                  </button>
                </Tip>
              ))}
            </CentredChoice>
          ) : (
            <CentredChoice label="Wybierz mapę">
              {READY_MAPS().map((m) => (
                <Tip key={m.id} text={m.summary}><button className={`${chip(d.customMapId === m.id)} shape-btn`} aria-pressed={d.customMapId === m.id} onClick={() => patch({ customMapId: m.id })}>{m.name}</button></Tip>
              ))}
            </CentredChoice>
          )}
        </>
      )}

      {page === 'players' && (
        <div data-wizard-page="players" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {arena ? (
            <div style={{ fontSize: 15, color: 'var(--muted)' }}>{ARENA_HINT}</div>
          ) : (
            <Row label="Liczba graczy">
              {/* At most 3 players per faction (its three heroes): coop (all Przymierze) takes 1–3, PvP 2–6. */}
              {(d.mode === 'coop' ? [1, 2, 3] : [2, 3, 4, 5, 6]).map((n) => (
                <button key={n} className={chip(d.count === n)} aria-pressed={d.count === n} onClick={() => patch({ count: n })}>{n}</button>
              ))}
            </Row>
          )}
          {!arena && !(d.digital && d.tier !== 'adventure' && ready) && (
            <CentredChoice label="Wielkość mapy">
              {sizes.map((m) => (
                <Tip key={m} text={mapTip(m)}>
                  <button className={`${chip(d.mapSize === m)} size-btn`} aria-pressed={d.mapSize === m} onClick={() => patch({ mapSize: m })}>
                    <b className="size-code">{SIZE_CODES[m]}</b>
                    <span>{MAP_SIZE_NAMES[m]}</span>
                  </button>
                </Tip>
              ))}
            </CentredChoice>
          )}
          <Row label={arena ? 'Komputer' : 'Trudność'}>
            {LEVELS.filter(([l]) => l !== 'custom' && (l !== 'hard' || d.mode !== 'pvp')).map(([l, label]) => (
              <Tip key={l} text={arena ? ARENA_LEVEL_TIPS[l as Level] : LEVEL_TIPS[l]}>
                <button className={chip(d.level === l)} aria-pressed={d.level === l} onClick={() => patch({ level: l as Level, custom: null })}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {LEVEL_ANIMAL[l as string] && <img src={asset(`ui/menu/${LEVEL_ANIMAL[l as string]}.webp`)} alt="" width={36} height={36} />}
                    {label}
                  </span>
                </button>
              </Tip>
            ))}
          </Row>
          {!arena && <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -4 }}>{LEVEL_HINT[d.level]}</div>}
        </div>
      )}

      {page === 'custom' && d.custom && (
        <div data-wizard-page="custom">
          <CustomSwitchRows
            mode={d.mode}
            growth={d.custom.growth}
            battleMode={d.custom.battleMode}
            rules={d.custom.rules}
            onGrowth={(growth) => patch({ custom: { ...d.custom!, growth } })}
            onBattleMode={(battleMode) => patch({ custom: { ...d.custom!, battleMode } })}
            onRules={(r) => patch({ custom: { ...d.custom!, rules: { ...d.custom!.rules, ...r } } })}
          />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
        <button className="btn plate parch" style={{ height: 52, padding: '0 28px', fontSize: 20 }} onClick={back}>← Wstecz</button>
        {(page === 'objective' || page === 'map' || page === 'players' || page === 'custom') && (
          <button className="btn prim" style={{ height: 52, padding: '0 40px', fontSize: 22 }} onClick={next} data-wizard-next>{last ? (online ? 'Utwórz stół' : 'Dalej →') : 'Dalej →'}</button>
        )}
      </div>
    </Frame>
  );
}
