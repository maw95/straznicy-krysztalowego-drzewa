import { useMemo, useRef, useState } from 'react';
import { FACTION_HEROES, FACTION_NAMES, SECRET_HEROES, MAP_SIZE_NAMES, BOARD_MAP_SIZES, UNITS, type FactionId, type MapSize } from '../engine/data';
import { CUSTOM_MAPS } from '../engine/customMaps';
import { resolveTier, TIERS, withRuleset, type Tier } from '../engine/presets';
import { OBJECTIVES } from '../engine/objectives';
import { arenaSetup, DEFAULT_RULES, levelSettings, type BattleMode, type Level, type MapShape, type Controller, type Mode, type ObjectiveId, type SeatSetup, type SetupOptions } from '../engine/types';
import { asset, Frame, Portrait, Ribbon, SIDE_RING } from './common';
import { UnitCard } from './UnitCard';
import { FigurePreview } from './FigurePreview';
import { hasFigure } from './figures';
import { describeSave, parseSave, type SaveFile } from './saves';
import { journalStats } from './journal';
import { tutorialEnabled, setTutorialEnabled } from './Tutorial';
import { autoFullscreen, fullscreenSupported, setAutoFullscreen } from './fullscreen';
import { CustomSwitchRows } from './CustomSwitchRows';
import { SHAPE_NAMES, SHAPE_TIPS, ARENA_HINT, ARENA_LEVEL_TIPS, choice, chip, defaultHeroes, LEVEL_HINT, LEVEL_TIPS, LEVELS, mapTip, Row, SEAT_TINT, Tip, TIPS } from './setupShared';

/** Fresh seats: the first player is a person (both players of a two-sided game), the rest are bots. */
const defaultSeats = (mode: Mode, count: number): SeatSetup[] =>
  defaultHeroes(mode, count).map(({ faction, heroId }, i) => {
    const human = mode === 'pvp' ? i < 2 : i === 0;
    return { name: mode === 'arena' && !human ? 'Komputer' : `Gracz ${i + 1}`, faction, controller: human ? 'human' : 'bot', heroId };
  });


/** The pages of the new-game wizard: the edition, the game's options, the seats at the table. */
type Step = 'start' | 'options' | 'table';

const EDITION_KEY = 'skd-edition';
/** The edition picked last time in this browser: digital unless the board edition was chosen. */
function savedDigital(): boolean {
  try { return localStorage.getItem(EDITION_KEY) !== 'board'; } catch { return true; }
}

export function SetupScreen({ online, onOnline, onStart, onLoad, autosave, onRules, onTesters, onStats, onIntro, onChangelog, onCredits }: { online: { label: string; title: string }; onOnline: () => void; onStart: (s: SetupOptions) => void; onLoad: (s: SaveFile) => void; autosave: SaveFile | null; onRules: () => void; onTesters: () => void; onStats: () => void; onIntro: () => void; onChangelog: () => void; onCredits: () => void }) {
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
  // The shuffle seed is no longer a menu choice: every game gets a fresh random one.
  const [seed] = useState(() => Math.floor(Math.random() * 1e6));
  const [step, setStep] = useState<Step>('start');
  const [rules, setRules] = useState({ ...DEFAULT_RULES });
  const [level, setLevel] = useState<Level | 'custom'>('normal');
  /** The digital edition (2D units, its rules) or the board edition (3D figures, the board game's rules); remembered in this browser. */
  const [digital, setDigitalState] = useState(savedDigital);
  /** The goal of an adventure game (the digital edition only): the crystals, or the control points. */
  const [objective, setObjective] = useState<ObjectiveId>('crystals');
  const [shape, setShape] = useState<MapShape>('triangle');
  const [growth, setGrowth] = useState(false);
  const [noHorde, setNoHorde] = useState(false);
  /** The complexity level of a digital adventure (presets.ts): decides which of the switches below the player may change. */
  const [tier, setTier] = useState<Tier>('adventure');
  const [customId, setCustomId] = useState(Object.keys(CUSTOM_MAPS)[0]);
  const setDigital = (on: boolean) => {
    setDigitalState(on);
    // The XL and XXL maps are the digital edition's.
    if (!on && !BOARD_MAP_SIZES.includes(mapSize)) setMapSize('veryLong');
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


  const startGame = () => {
    const r = resolveTier(tier, { objective, shape, customMapId: customId, growth });
    onStart(withRuleset(arena ? arenaSetup(seats, seed, level === 'custom' ? 'normal' : level) : { mode, mapSize, battleMode, seed, seats, rules: { ...rules, extraEvilHero: mode === 'coop' && rules.extraEvilHero, ...(noHorde && mode === 'coop' && r.objective === 'boss' ? { noHorde: true } : {}) } }, digital, r.objective, r.shape, r.customMapId, r.growth));
  };
  const backBtn = (to: Step) => <button className="btn plate parch" style={{ height: 52, padding: '0 28px', fontSize: 20 }} onClick={() => setStep(to)}>← Wstecz</button>;
  const stepName = step === 'start' ? '' : `Krok ${step === 'options' ? 2 : 3} z 3: ${step === 'options' ? 'Ustawienia gry' : 'Miejsca przy stole'} · ${digital ? 'wersja cyfrowa' : 'wersja planszowa'}`;

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
          <img className="logo-glow" src={asset('ui/logo.png')} alt="Gleamroot: Strażnicy Kryształowego Drzewa" style={{ height: step === 'start' ? 'clamp(90px, 15vh, 150px)' : 'clamp(60px, 10vh, 100px)' }} />
        </h1>
        {step === 'start' && (
          <>
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
              <button className="btn plate parch btn-testers" style={{ padding: '6px 14px', fontSize: 16 }} onClick={onTesters} title="Informacje dla testerów, statystyki i uwagi dla twórcy">
                Dla testerów
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
          </>
        )}
        {stepName && <div style={{ fontSize: 16, color: '#F3D27A', marginTop: 6, letterSpacing: '0.04em' }}>{stepName}</div>}
      </div>

      {step === 'start' && (
        <div className="main-row setup-row" style={{ position: 'relative', width: '100%', maxWidth: 1100 }}>
          <Frame crest className="grow" innerClass="slate scroll" innerStyle={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="lbl">Krok 1 z 3: w którą wersję gramy?</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {([
                [false, 'Planszowa', 'Wierna planszówka: zasady bez zmian, malowana arena i figurki 3D. Do grania przy jednym ekranie tak, jakby karty i plansza leżały na stole.'],
                [true, 'Cyfrowa', TIPS.digital],
              ] as const).map(([on, label, text]) => (
                <div key={label} className="well" onClick={() => setDigital(on)} style={{ flex: '1 1 300px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', boxShadow: digital === on ? '0 0 0 3px #9EE4FF' : undefined }}>
                  <button className={choice(digital === on)} aria-pressed={digital === on} onClick={() => setDigital(on)} style={{ fontSize: 24, fontWeight: 800, alignSelf: 'flex-start' }}>{label}</button>
                  <span style={{ fontSize: 15, lineHeight: 1.4 }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
              <button className="btn prim" style={{ height: 56, padding: '0 40px', fontSize: 24 }} onClick={() => setStep('options')}>Dalej →</button>
            </div>
            {/* The tester's record in this browser sits on the first page: it is the place a returning player lands on. */}
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <button className="app-version" title="Historia zmian" onClick={onChangelog}>
                  Wersja {__APP_VERSION__}
                </button>
                <button className="app-version" title="Autorzy muzyki, grafiki i gry" onClick={onCredits} data-credits-open>
                  Autorzy
                </button>
              </div>
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
        </div>
      )}

      {step === 'options' && (
        <div className="main-row setup-row" style={{ position: 'relative', width: '100%', maxWidth: 1000 }}>
          <Frame crest className="grow" innerClass="slate scroll" innerStyle={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Row label="Tryb">
              <Tip text={TIPS.coop}><button className={chip(mode === 'coop')} onClick={() => changeMode('coop')}>Kooperacja (wszyscy przeciw AI)</button></Tip>
              <Tip text={TIPS.pvp}><button className={chip(mode === 'pvp')} onClick={() => changeMode('pvp')}>Rywalizacja (dobro kontra zło)</button></Tip>
              <Tip text={TIPS.arenaMode}><button className={chip(arena)} onClick={() => changeMode('arena')}>Arena (jedna bitwa)</button></Tip>
            </Row>
            {arena && <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -6 }}>{ARENA_HINT}</div>}
            {digital && !arena && (
              <Row label="Poziom">
                {(Object.keys(TIERS) as Tier[]).map((t) => (
                  <Tip key={t} text={TIERS[t].summary}><button className={chip(tier === t)} aria-pressed={tier === t} onClick={() => setTier(t)}>{TIERS[t].name}</button></Tip>
                ))}
              </Row>
            )}
            {digital && !arena && tier === 'custom' && (
              <CustomSwitchRows mode={mode} growth={growth} battleMode={battleMode} rules={rules} onGrowth={setGrowth} onBattleMode={setBattleMode} onRules={(patch) => setRules({ ...rules, ...patch })} />
            )}
            {digital && !arena && tier !== 'adventure' && (
              <Row label="Cel">
                {(['crystals', 'control', 'survival', 'boss', 'artifact'] as const).filter((o) => o !== 'survival' || mode === 'coop').map((o) => (
                  <Tip key={o} text={OBJECTIVES[o].summary}><button className={chip(objective === o)} aria-pressed={objective === o} onClick={() => setObjective(o)}>{OBJECTIVES[o].name}</button></Tip>
                ))}
              </Row>
            )}
            {digital && !arena && tier !== 'adventure' && mode === 'coop' && objective === 'boss' && (
              <Row label="Horda">
                <Tip text="Horda prowadzi swoich bohaterów i też atakuje Bossa."><button className={chip(!noHorde)} aria-pressed={!noHorde} onClick={() => setNoHorde(false)}>Gra przeciw nam</button></Tip>
                <Tip text="Wszyscy gracze razem przeciw samemu Bossowi: Horda nie ma bohaterów, a Boss ma trochę więcej Życia."><button className={chip(noHorde)} aria-pressed={noHorde} onClick={() => setNoHorde(true)}>Bez Hordy, wszyscy przeciw Bossowi</button></Tip>
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
              <Row label="Własna mapa">
                {Object.values(CUSTOM_MAPS).map((m) => (
                  <Tip key={m.id} text={m.summary}><button className={chip(customId === m.id)} aria-pressed={customId === m.id} onClick={() => setCustomId(m.id)}>{m.name}</button></Tip>
                ))}
              </Row>
            )}
            {!arena && (
              <Row label="Wielkość mapy">
                {(Object.keys(MAP_SIZE_NAMES) as MapSize[]).filter((m) => digital || BOARD_MAP_SIZES.includes(m)).map((m) => (
                  <Tip key={m} text={mapTip(m)}><button className={chip(mapSize === m)} onClick={() => setMapSize(m)}>{MAP_SIZE_NAMES[m]}</button></Tip>
                ))}
              </Row>
            )}
            {arena && versusBot && (
              <Row label="Trudność">
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
                <Row label="Trudność">
                  {LEVELS.filter(([l]) => l !== 'custom' && (l !== 'hard' || mode === 'coop')).map(([l, label]) => (
                    <Tip key={l} text={LEVEL_TIPS[l]}>
                      <button className={chip(level === l)} aria-pressed={level === l} onClick={() => pickLevel(l as Level)}>
                        {label}
                      </button>
                    </Tip>
                  ))}
                </Row>
                <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -6 }}>{LEVEL_HINT[level]}</div>
              </>
            )}
            {!arena && (
              <Row label="Liczba graczy">
                {/* At most 2 players per faction: coop (all Przymierze) takes 1–2, PvP 2–4. */}
                {(mode === 'coop' ? [1, 2] : [2, 3, 4]).map((n) => (
                  <button key={n} className={chip(count === n)} onClick={() => changeCount(n)}>{n}</button>
                ))}
              </Row>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
              {backBtn('start')}
              <button className="btn prim" style={{ height: 52, padding: '0 40px', fontSize: 22 }} onClick={() => setStep('table')}>Dalej →</button>
            </div>
          </Frame>
        </div>
      )}

      {step === 'table' && (
        <div className="main-row setup-row" style={{ position: 'relative', width: '100%', maxWidth: 1400 }}>
          <Frame crest className="grow" innerClass="slate scroll" innerStyle={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="lbl">Miejsca przy stole</div>
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
                      <Portrait unitId={h} size={46} ring={SIDE_RING[s.faction]} glow={s.heroId === h ? '0 0 0 3px #9EE4FF, 0 0 10px 3px rgba(158,228,255,0.6)' : undefined} dim={takenBy(h, i)} tip={false} />
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
            <div className="lbl" style={{ marginTop: 6 }}>Opcje</div>
            <label style={{ fontSize: 16 }}>
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
              {backBtn('options')}
              <button className="btn prim" disabled={!valid} style={{ height: 56, padding: '0 40px', fontSize: 24 }} onClick={startGame}>
                Rozpocznij grę
              </button>
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
      )}
    </div>
  );
}
