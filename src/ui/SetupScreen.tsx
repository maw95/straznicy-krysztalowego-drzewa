import { useMemo, useRef, useState } from 'react';
import { FACTION_HEROES, FACTION_NAMES, SECRET_HEROES, MAP_SIZE_NAMES, UNITS, type FactionId, type MapSize } from '../engine/data';
import { CUSTOM_MAPS } from '../engine/customMaps';
import { resolveTier, TIERS, type Tier } from '../engine/presets';
import { OBJECTIVES } from '../engine/objectives';
import { arenaSetup, DEFAULT_RULES, levelSettings, type BattleMode, type Level, type MapShape, type Controller, type Mode, type ObjectiveId, type RulesConfig, type SeatSetup, type SetupOptions } from '../engine/types';
import { asset, Frame, Portrait, Ribbon, SIDE_RING } from './common';
import { UnitCard } from './UnitCard';
import { FigurePreview } from './FigurePreview';
import { hasFigure } from './figures';
import { describeSave, parseSave, type SaveFile } from './saves';
import { journalStats } from './journal';
import { tutorialEnabled, setTutorialEnabled } from './Tutorial';
import { autoFullscreen, fullscreenSupported, setAutoFullscreen } from './fullscreen';
import { ARENA_HINT, ARENA_LEVEL_TIPS, chip, defaultHeroes, LEVEL_HINT, LEVEL_TIPS, LEVELS, mapTip, Row, SEAT_TINT, Tip, TIPS } from './setupShared';

/** Fresh seats: the first player is a person (both players of a two-sided game), the rest are bots. */
const defaultSeats = (mode: Mode, count: number): SeatSetup[] =>
  defaultHeroes(mode, count).map(({ faction, heroId }, i) => {
    const human = mode === 'pvp' ? i < 2 : i === 0;
    return { name: mode === 'arena' && !human ? 'Komputer' : `Gracz ${i + 1}`, faction, controller: human ? 'human' : 'bot', heroId };
  });

/** The set-up with the digital edition's rules switched on when asked (the arena battles; the board duels of the easy level are the same), and its objective. */
function withRuleset(setup: SetupOptions, digital: boolean, objective: ObjectiveId = 'crystals', shape: MapShape = 'triangle', customMapId?: string, growth = false): SetupOptions {
  if (!digital) return setup;
  return { ...setup, ...(shape !== 'triangle' && setup.mode !== 'arena' ? { mapShape: shape, ...(shape === 'custom' ? { customMapId } : {}) } : {}), rules: { ...setup.rules, ruleset: 'digital', ...(growth && setup.mode !== 'arena' ? { heroGrowth: true } : {}), ...(objective !== 'crystals' && (objective !== 'survival' || setup.mode === 'coop') && setup.mode !== 'arena' ? { objective } : {}) } };
}

const SHAPE_NAMES: Record<MapShape, string> = { triangle: 'Trójkąt', rectangle: 'Prostokąt', ring: 'Pierścień', islands: 'Wyspy', custom: 'Własna mapa' };
const SHAPE_TIPS: Record<MapShape, string> = {
  triangle: 'Mapa z planszówki: trójkąt, Drzewo na szczycie, bazy w dolnych rogach.',
  rectangle: 'Prostokąt: bazy pośrodku krótszych boków, Drzewo w środku mapy.',
  ring: 'Pierścień wokół jeziora: Drzewo i obie bazy na rogach, do każdego dwie drogi.',
  islands: 'Trzy wyspy rozdzielone wodą: bazy po bokach, Drzewo na środkowej wyspie, dojście po mostach.',
  custom: 'Gotowa, ręcznie narysowana mapa (wybierz ją obok).',
};

const EDITION_KEY = 'skd-edition';
/** The edition picked last time in this browser: digital unless the board edition was chosen. */
function savedDigital(): boolean {
  try { return localStorage.getItem(EDITION_KEY) !== 'board'; } catch { return true; }
}

export function SetupScreen({ online, onOnline, onStart, onLoad, autosave, onRules, onTesters, onStats, onIntro, onChangelog }: { online: { label: string; title: string }; onOnline: () => void; onStart: (s: SetupOptions) => void; onLoad: (s: SaveFile) => void; autosave: SaveFile | null; onRules: () => void; onTesters: () => void; onStats: () => void; onIntro: () => void; onChangelog: () => void }) {
  // Both read and replay saved games: once per visit to the menu, not on every hover and keystroke.
  const stats = useMemo(journalStats, []);
  const saveLabel = useMemo(() => autosave && describeSave(autosave), [autosave]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tutorial, setTutorial] = useState(tutorialEnabled());
  const [fullscreen, setFullscreen] = useState(autoFullscreen);
  const [mode, setMode] = useState<Mode>('coop');
  const [count, setCount] = useState(1);
  const [seats, setSeats] = useState<SeatSetup[]>(defaultSeats('coop', 1));
  const [mapSize, setMapSize] = useState<MapSize>('short');
  const [battleMode, setBattleMode] = useState<BattleMode>('arena');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [rules, setRules] = useState({ ...DEFAULT_RULES });
  const [level, setLevel] = useState<Level | 'custom'>('normal');
  /** The digital edition (2D units, its rules) or the board edition (3D figures, the board game's rules); remembered in this browser. */
  const [digital, setDigitalState] = useState(savedDigital);
  /** The goal of an adventure game (the digital edition only): the crystals, or the control points. */
  const [objective, setObjective] = useState<ObjectiveId>('crystals');
  const [shape, setShape] = useState<MapShape>('triangle');
  const [growth, setGrowth] = useState(false);
  /** The complexity level of a digital adventure (presets.ts): decides which of the switches below the player may change. */
  const [tier, setTier] = useState<Tier>('adventure');
  const [customId, setCustomId] = useState(Object.keys(CUSTOM_MAPS)[0]);
  const setDigital = (on: boolean) => {
    setDigitalState(on);
    try { localStorage.setItem(EDITION_KEY, on ? 'digital' : 'board'); } catch { /* private mode: only for this visit */ }
  };
  const pickLevel = (l: Level, m: Mode = mode) => {
    const preset = levelSettings(l, m);
    setLevel(l);
    setBattleMode(preset.battleMode);
    // The levels play the default tie rule; another one is a custom setup.
    setRules({ ...preset.rules });
  };
  const [preview, setPreview] = useState<string>('goldDragon');
  // Easter egg: five clicks on a Dawn crest wake up the Brave Duck (remembered in this browser).
  const [duck, setDuck] = useState(() => { try { return localStorage.getItem('skd-duck') === '1'; } catch { return false; } });
  const crestClicks = useRef(0);
  const crestClick = (f: FactionId, i: number) => {
    if (f !== 'dawn' || duck || ++crestClicks.current < 5) return;
    try { localStorage.setItem('skd-duck', '1'); } catch { /* private mode: only for this visit */ }
    setDuck(true);
    update(i, { heroId: SECRET_HEROES.dawn[0] });
    setPreview(SECRET_HEROES.dawn[0]);
  };
  const heroesOf = (f: FactionId) => (duck ? [...FACTION_HEROES[f], ...SECRET_HEROES[f]] : FACTION_HEROES[f]);

  const changeMode = (m: Mode) => {
    const c = m === 'pvp' ? Math.max(2, count) : m === 'arena' ? 2 : Math.min(2, count);
    setMode(m);
    setCount(c);
    setSeats(defaultSeats(m, c));
    // "Trudny" exists for coop only; in the arena the level is the computer's strength (no "Własny").
    if (level === 'hard' && m === 'pvp') pickLevel('normal', m);
    if (level === 'custom' && m === 'arena') pickLevel('normal', m);
  };
  const arena = mode === 'arena';
  const versusBot = seats.some((s) => s.controller === 'bot');
  const changeCount = (c: number) => {
    setCount(c);
    setSeats(defaultSeats(mode, c));
  };
  const update = (i: number, patch: Partial<SeatSetup>) => setSeats(seats.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const takenBy = (heroId: string, i: number) => seats.some((s, j) => j !== i && s.heroId === heroId);
  const valid =
    seats.every((s, i) => !takenBy(s.heroId, i)) &&
    (mode === 'coop' || (seats.some((s) => s.faction === 'dawn') && seats.some((s) => s.faction === 'horde'))) &&
    (['dawn', 'horde'] as FactionId[]).every((f) => seats.filter((s) => s.faction === f).length <= 2);


  return (
    <div className="screen slate screen-enter" style={{ alignItems: 'center', paddingTop: 16, gap: 18 }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* The box cover: the Tree in the middle, Przymierze on the left, the Horde on the right. */}
        <img className="ken-burns" src={asset('ui/cover.jpg')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 38%', opacity: 0.42 }} />
        {Array.from({ length: 22 }, (_, i) => (
          <span
            key={i}
            className="firefly"
            style={{ left: `${(i * 47) % 100}%`, top: `${20 + ((i * 31) % 75)}%`, ['--fx' as string]: `${((i * 13) % 80) - 40}px`, ['--fy' as string]: `${((i * 29) % 60) - 40}px`, ['--fd' as string]: `${7 + (i % 5) * 1.6}s`, ['--fdl' as string]: `${-(i * 0.9)}s` } as React.CSSProperties}
          />
        ))}
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ margin: 0, lineHeight: 0 }}>
          <img className="logo-glow" src={asset('ui/logo.png')} alt="Strażnicy Kryształowego Drzewa" style={{ height: 'clamp(90px, 15vh, 150px)' }} />
        </h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
          {autosave && (
            <button className="btn prim" style={{ padding: '6px 18px', fontSize: 17 }} title={saveLabel ?? undefined} onClick={() => onLoad(autosave)}>
              Kontynuuj zapisaną partię
            </button>
          )}
          <button className="btn prim" style={{ padding: '6px 18px', fontSize: 17 }} onClick={onOnline} title={online.title}>
            {online.label}
          </button>
          <button className="btn plate parch" style={{ padding: '6px 14px', fontSize: 16 }} onClick={() => fileRef.current?.click()}>
            Wczytaj z pliku
          </button>
          <button className="btn plate parch" style={{ padding: '6px 14px', fontSize: 16 }} onClick={onRules}>
            Zasady i karty
          </button>
          <button className="btn plate parch" style={{ padding: '6px 14px', fontSize: 16 }} onClick={onIntro}>
            Wprowadzenie
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                onLoad(parseSave(await f.text()));
              } catch (err) {
                setLoadError((err as Error).message);
              }
            }}
          />
        </div>
        {autosave && <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{saveLabel}</div>}
        {loadError && <div style={{ fontSize: 15, color: '#F08A7A', marginTop: 4 }}>{loadError}</div>}
      </div>
      <div className="main-row setup-row" style={{ position: 'relative', width: '100%', maxWidth: 1400 }}>
        <Frame crest className="grow" innerClass="slate scroll" innerStyle={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Row label="Tryb">
            <Tip text={TIPS.coop}><button className={chip(mode === 'coop')} onClick={() => changeMode('coop')}>Kooperacja (wszyscy przeciw AI)</button></Tip>
            <Tip text={TIPS.pvp}><button className={chip(mode === 'pvp')} onClick={() => changeMode('pvp')}>Rywalizacja (dobro kontra zło)</button></Tip>
            <Tip text={TIPS.arenaMode}><button className={chip(arena)} onClick={() => changeMode('arena')}>Arena (jedna bitwa)</button></Tip>
          </Row>
          {!arena && (
          <>
          <Row label="Gracze">
            {/* At most 2 players per faction: coop (all Przymierze) takes 1–2, PvP 2–4. */}
            {(mode === 'coop' ? [1, 2] : [2, 3, 4]).map((n) => (
              <button key={n} className={chip(count === n)} onClick={() => changeCount(n)}>{n}</button>
            ))}
          </Row>
          <Row label="Mapa">
            {(Object.keys(MAP_SIZE_NAMES) as MapSize[]).map((m) => (
              <Tip key={m} text={mapTip(m)}><button className={chip(mapSize === m)} onClick={() => setMapSize(m)}>{MAP_SIZE_NAMES[m]}</button></Tip>
            ))}
          </Row>
          </>
          )}
          {arena && <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -6 }}>{ARENA_HINT}</div>}
          <Row label="Wersja">
            <Tip text={TIPS.digital}><button className={chip(digital)} aria-pressed={digital} onClick={() => setDigital(true)}>Cyfrowa</button></Tip>
            <Tip text="Zasady planszówki, bez zmian: malowana arena i figurki 3D."><button className={chip(!digital)} aria-pressed={!digital} onClick={() => setDigital(false)}>Planszowa</button></Tip>
          </Row>
          {digital && !arena && tier !== 'adventure' && (
            <Row label="Cel">
              {(['crystals', 'control', 'survival', 'boss', 'artifact'] as const).filter((o) => o !== 'survival' || mode === 'coop').map((o) => (
                <Tip key={o} text={OBJECTIVES[o].summary}><button className={chip(objective === o)} aria-pressed={objective === o} onClick={() => setObjective(o)}>{OBJECTIVES[o].name}</button></Tip>
              ))}
            </Row>
          )}
          {digital && !arena && (
            <Row label="Poziom gry">
              {(Object.keys(TIERS) as Tier[]).map((t) => (
                <Tip key={t} text={TIERS[t].summary}><button className={chip(tier === t)} aria-pressed={tier === t} onClick={() => setTier(t)}>{TIERS[t].name}</button></Tip>
              ))}
            </Row>
          )}
          {digital && !arena && tier === 'custom' && (
            <Row label="Rozwój bohatera">
              <Tip text="Bohaterowie zbierają punkty doświadczenia z bitew i skarbów, awansują i wybierają jedną z trzech umiejętności."><button className={chip(growth)} aria-pressed={growth} onClick={() => setGrowth(true)}>Włączony</button></Tip>
              <Tip text="Bohaterowie mają stałe liczby przez całą grę."><button className={chip(!growth)} aria-pressed={!growth} onClick={() => setGrowth(false)}>Wyłączony</button></Tip>
            </Row>
          )}
          {digital && !arena && tier !== 'adventure' && (
            <Row label="Kształt mapy">
              {(Object.keys(SHAPE_NAMES) as MapShape[]).map((sh) => (
                <Tip key={sh} text={SHAPE_TIPS[sh]}><button className={chip(shape === sh)} aria-pressed={shape === sh} onClick={() => setShape(sh)}>{SHAPE_NAMES[sh]}</button></Tip>
              ))}
            </Row>
          )}
          {digital && !arena && tier !== 'adventure' && shape === 'custom' && (
            <Row label="Mapa">
              {Object.values(CUSTOM_MAPS).map((m) => (
                <Tip key={m.id} text={m.summary}><button className={chip(customId === m.id)} aria-pressed={customId === m.id} onClick={() => setCustomId(m.id)}>{m.name}</button></Tip>
              ))}
            </Row>
          )}
          {arena && versusBot && (
            <Row label="Komputer">
              {LEVELS.filter(([l]) => l !== 'custom').map(([l, label]) => (
                <Tip key={l} text={ARENA_LEVEL_TIPS[l as Level]}>
                  <button className={chip(level === l)} aria-pressed={level === l} onClick={() => pickLevel(l as Level)}>
                    {label}
                  </button>
                </Tip>
              ))}
            </Row>
          )}
          {!arena && (
          <>
          <Row label="Poziom">
            {LEVELS.filter(([l]) => l !== 'hard' || mode === 'coop').map(([l, label]) => (
              <Tip key={l} text={LEVEL_TIPS[l]}>
                <button className={chip(level === l)} aria-pressed={level === l} onClick={() => (l === 'custom' ? setLevel('custom') : pickLevel(l))}>
                  {label}
                </button>
              </Tip>
            ))}
          </Row>
          <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -6 }}>{LEVEL_HINT[level]}</div>
          </>
          )}
          {!arena && level === 'custom' && (
          <>
          <Row label="Bitwy">
            <Tip text={TIPS.arena}><button className={chip(battleMode === 'arena')} onClick={() => setBattleMode('arena')}>Osobna arena (3 na 3)</button></Tip>
            <Tip text={TIPS.board}><button className={chip(battleMode === 'board')} onClick={() => setBattleMode('board')}>Na planszy głównej (pojedynek 1 na 1)</button></Tip>
          </Row>
          <Row label="Ułatwienia">
            {EASES.map(([label, on, patch, tip]) => (
              <Tip key={label} text={tip}>
                <button className={chip(on(rules))} aria-pressed={on(rules)} onClick={() => setRules({ ...rules, ...patch(!on(rules)) })}>
                  {label}
                </button>
              </Tip>
            ))}
          </Row>
          <Row label="Utrudnienia">
            <Tip text={TIPS.dice}>
              <button className={chip(rules.useDice)} aria-pressed={rules.useDice} onClick={() => setRules({ ...rules, useDice: !rules.useDice })}>
                Rzut kością
              </button>
            </Tip>
            {mode === 'coop' && (
              <Tip text={TIPS.extraHero}>
                <button className={chip(rules.extraEvilHero)} aria-pressed={rules.extraEvilHero} onClick={() => setRules({ ...rules, extraEvilHero: !rules.extraEvilHero })}>
                  Dodatkowy bohater Hordy
                </button>
              </Tip>
            )}
          </Row>
          <Row label="Remis inicjatywy">
            {TIE_MODES.map(([m, label, tip]) => (
              <Tip key={m} text={tip}>
                <button className={chip(rules.initiativeTie === m)} aria-pressed={rules.initiativeTie === m} onClick={() => setRules({ ...rules, initiativeTie: m })}>
                  {label}
                </button>
              </Tip>
            ))}
          </Row>
          <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -6 }}>Pełna gra to wszystko wyłączone i obrońca pierwszy. Ułatwienia i utrudnienia można dowolnie łączyć.</div>
          </>
          )}
          <label style={{ fontSize: 16, marginTop: 6 }}>
            <input
              type="checkbox"
              checked={tutorial}
              onChange={(e) => {
                setTutorial(e.target.checked);
                setTutorialEnabled(e.target.checked);
              }}
            />{' '}
            Samouczek (podpowiedzi w pierwszej partii)
          </label>
          {fullscreenSupported() && (
            <label style={{ fontSize: 16 }} data-fullscreen-control title="Gra przechodzi na pełny ekran przy pierwszym kliknięciu albo klawiszu — jak F11 w przeglądarce. Esc wraca do okna.">
              <input
                type="checkbox"
                checked={fullscreen}
                onChange={(e) => {
                  setFullscreen(e.target.checked);
                  setAutoFullscreen(e.target.checked);
                }}
              />{' '}
              Pełny ekran przy uruchomieniu
            </label>
          )}
          <div className="lbl">Zasady testowe</div>
          <div style={{ display: 'flex', gap: '12px 22px', flexWrap: 'wrap', alignItems: 'center', fontSize: 16 }}>
            <label>
              Ziarno losowania <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} style={{ width: 110 }} />
            </label>
          </div>
          <div className="lbl" style={{ marginTop: 6 }}>Miejsca przy stole</div>
          {seats.map((s, i) => (
            <div key={i} className="well" style={{ padding: '6px 12px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: SEAT_TINT[s.faction], transition: 'background 0.35s' }}>
              <img src={asset(`cards/crests/${s.faction}.png`)} alt="" title={FACTION_NAMES[s.faction]} onClick={() => crestClick(s.faction, i)} style={{ width: 46, height: 46, objectFit: 'contain', flex: 'none', filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.5))' }} />
              <input type="text" value={s.name} onChange={(e) => update(i, { name: e.target.value })} style={{ width: 130 }} aria-label="Imię gracza" />
              {mode === 'pvp' && (
                <select value={s.faction} aria-label="Frakcja" onChange={(e) => update(i, { faction: e.target.value as FactionId, heroId: FACTION_HEROES[e.target.value as FactionId][0] })}>
                  <option value="dawn">{FACTION_NAMES.dawn}</option>
                  <option value="horde">{FACTION_NAMES.horde}</option>
                </select>
              )}
              <select value={s.controller} aria-label="Kto gra" onChange={(e) => update(i, { controller: e.target.value as Controller })}>
                <option value="human">Człowiek</option>
                <option value="bot">Bot</option>
              </select>
              {digital && mode === 'coop' && s.controller === 'human' && (
                <label title="Tryb rodzinny: bohater dziecka ma więcej życia i ruchu, a na ekranie jest przycisk Podpowiedź." style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 15 }}>
                  <input type="checkbox" checked={Boolean(s.child)} aria-label="Dziecko" onChange={(e) => update(i, { child: e.target.checked })} /> Dziecko
                </label>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                {heroesOf(s.faction).map((h) => (
                  <button key={h} className="btn" title={UNITS[h].name} onMouseEnter={() => setPreview(h)} onClick={() => { update(i, { heroId: h }); setPreview(h); }} disabled={takenBy(h, i)} style={{ background: 'none', border: 0, padding: 0 }}>
                    <Portrait unitId={h} size={46} ring={SIDE_RING[s.faction]} glow={s.heroId === h ? '0 0 0 3px #9EE4FF, 0 0 10px 3px rgba(158,228,255,0.6)' : undefined} dim={takenBy(h, i)} />
                  </button>
                ))}
              </div>
              <div style={{ fontWeight: 700, color: '#F3D27A' }}>{UNITS[s.heroId].name}</div>
            </div>
          ))}
          {mode === 'coop' && (
            <div style={{ fontSize: 15, color: 'var(--muted)' }}>
              Zło prowadzi automat: tylu bohaterów Hordy, ilu bohaterów Przymierza{rules.minEvilHeroes > 1 ? `, ale co najmniej ${rules.minEvilHeroes === 2 ? 'dwóch' : rules.minEvilHeroes}` : ''}
              {rules.extraEvilHero ? ' — i jeszcze jeden' : ''}.{rules.hordeRespawn ? ' Gdy polegną wszyscy, w bazie Hordy pojawia się kolejny.' : ''}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
            <button className="btn prim r tester-btn" style={{ height: 56, padding: '0 28px', fontSize: 21 }} onClick={onTesters} title="Informacje dla testerów, statystyki i plik z uwagami dla twórcy">
              INFO DLA TESTERÓW
            </button>
            <button className="btn prim" disabled={!valid} style={{ height: 56, padding: '0 40px', fontSize: 24 }} onClick={() => onStart(withRuleset(arena ? arenaSetup(seats, seed, level === 'custom' ? 'normal' : level) : { mode, mapSize, battleMode, seed, seats, rules: { ...rules, extraEvilHero: mode === 'coop' && rules.extraEvilHero } }, digital, ...(() => { const r = resolveTier(tier, { objective, shape, customMapId: customId, growth }); return [r.objective, r.shape, r.customMapId, r.growth] as const; })()))}>
              Rozpocznij grę
            </button>
          </div>
          {/* The game version bottom-left, the tester's record in this browser bottom-right. */}
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <button className="app-version" title="Historia zmian" onClick={onChangelog}>
              Wersja {__APP_VERSION__}
            </button>
            <div className="stats-box" aria-label="Twoje partie">
              <div className="stats-title">Twoje partie</div>
              <div className="stats-grid">
                <span>Rozegrane</span>
                <b>{stats.finished}</b>
                <span>Kooperacja</span>
                <b>
                  <span className="win">{stats.coop.won} wygr.</span> · <span className="loss">{stats.coop.lost} przegr.</span>
                </b>
                <span>Rywalizacja</span>
                <b>
                  <span className="win">Przymierze {stats.pvp.dawn}</span> · <span className="loss">Horda {stats.pvp.horde}</span>
                </b>
                {stats.arena.won + stats.arena.lost > 0 && (
                  <>
                    <span>Arena</span>
                    <b>
                      <span className="win">{stats.arena.won} wygr.</span> · <span className="loss">{stats.arena.lost} przegr.</span>
                    </b>
                  </>
                )}
                <span>Procent wygranych</span>
                <b>{stats.winRate === null ? '—' : `${stats.winRate}%`}</b>
                <span>Punkty</span>
                <b className="points">{stats.points}</b>
                {stats.reports > 0 && (
                  <>
                    <span>Zgłoszone błędy</span>
                    <b>{stats.reports}</b>
                  </>
                )}
              </div>
              <button className="btn plate parch stats-more" onClick={onStats}>
                Dokładne dane
              </button>
            </div>
          </div>
        </Frame>
        <Frame className="side" style={{ width: 420 }} innerStyle={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Ribbon side={UNITS[preview].side} style={{ width: '100%' }}>{UNITS[preview].name}</Ribbon>
          {/* The card above the turning figure, both in the middle of the space left under the ribbon. */}
          <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0' }}>
            <UnitCard unitId={preview} width={hasFigure(preview) ? 280 : 340} digital={digital} />
            <FigurePreview unitId={preview} size={300} />
          </div>
        </Frame>
      </div>
    </div>
  );
}

/** Who strikes first when both units are equally fast: label, mode, explanation. */
const TIE_MODES: Array<[RulesConfig['initiativeTie'], string, string]> = [
  ['defender', 'Obrońca pierwszy', 'Przy równej Szybkości pierwsza działa jednostka strony, która została zaatakowana. Tak gra się na każdym poziomie.'],
  ['rotating', 'Na zmianę', 'Przy równej Szybkości strony zaczynają na zmianę: w nieparzystych rundach bitwy atakujący, w parzystych obrońca.'],
];

/** Optional simplifications of the full game: label, whether it is on, how to switch it, what it does. */
const EASES: Array<[string, (r: RulesConfig) => boolean, (on: boolean) => Partial<RulesConfig>, string]> = [
  ['Bez zdolności', (r) => !r.abilities, (on) => ({ abilities: !on }), 'Nikt nie używa zdolności z kart — także strażnicy kryształów. Mniej zasad do zapamiętania: liczą się tylko Życie, Atak i Szybkość.'],
  ['Same Eliksiry Odrodzenia', (r) => !r.treasures, (on) => ({ treasures: !on }), 'Zamiast talii różnych skarbów na mapie leżą tylko Eliksiry Odrodzenia (1 / 2 / 3 / 4 zależnie od mapy). Jedna prosta karta: wskrzesza poległą jednostkę. Strażnicy nic nie zostawiają.'],
  ['Rezerwowy bohater po śmierci', (r) => r.heroReplacement, (on) => ({ heroReplacement: on }), 'Gdy bohater zginie, gracz bierze nowego, nieużywanego bohatera swojej frakcji. Wkracza on na wolne pole najbliżej miejsca, w którym padł poprzednik — nikt nie odpada z gry.'],
];
