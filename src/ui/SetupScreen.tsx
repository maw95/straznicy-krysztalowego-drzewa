import { useMemo, useRef, useState } from 'react';
import { FACTION_HEROES, FACTION_NAMES, SECRET_HEROES, UNITS, type FactionId, type MapSize } from '../engine/data';
import { CUSTOM_MAPS } from '../engine/customMaps';
import { resolveTier, withRuleset, type Tier } from '../engine/presets';
import { arenaSetup, DEFAULT_RULES, levelSettings, type BattleMode, type Level, type MapShape, type Controller, type Mode, type ObjectiveId, type SeatSetup, type SetupOptions } from '../engine/types';
import { asset, Frame, Portrait, Ribbon, SIDE_RING } from './common';
import { UnitCard } from './UnitCard';
import { FigurePreview } from './FigurePreview';
import { hasFigure } from './figures';
import { describeSave, parseSave, type SaveFile } from './saves';
import { journalStats } from './journal';
import { tutorialEnabled, setTutorialEnabled } from './Tutorial';
import { autoFullscreen, fullscreenSupported, setAutoFullscreen } from './fullscreen';
import { defaultHeroes, SEAT_TINT } from './setupShared';
import { NewGameWizard, savedDigital } from './NewGameWizard';
import { deleteNamedSave, listNamedSaves, type NamedSave } from './saves';
import type { TableConfig } from '../online/api';

/** Fresh seats: the first player is a person (both players of a two-sided game), the rest are bots. */
const defaultSeats = (mode: Mode, count: number): SeatSetup[] =>
  defaultHeroes(mode, count).map(({ faction, heroId }, i) => {
    const human = mode === 'pvp' ? i < 2 : i === 0;
    return { name: mode === 'arena' && !human ? 'Komputer' : `Gracz ${i + 1}`, faction, controller: human ? 'human' : 'bot', heroId };
  });


/** The pages of the menu: the first choice, where to play, the new-game wizard, the saved games, the seats at the table. */
type Step = 'home' | 'where' | 'wizard' | 'load' | 'table';

export function SetupScreen({ session, online, onOnline, onStart, onLoad, autosave, onRules, onTesters, onStats, onIntro, onChangelog, onCredits }: { session: boolean; online: { label: string; title: string }; onOnline: (intent: 'new' | 'load') => void; onStart: (s: SetupOptions) => void; onLoad: (s: SaveFile) => void; autosave: SaveFile | null; onRules: () => void; onTesters: () => void; onStats: () => void; onIntro: () => void; onChangelog: () => void; onCredits: () => void }) {
  // Both read and replay saved games: once per visit to the menu, not on every hover and keystroke.
  const stats = useMemo(journalStats, []);
  const saveLabel = useMemo(() => autosave && describeSave(autosave), [autosave]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tutorial, setTutorial] = useState(tutorialEnabled());
  const [fullscreen, setFullscreen] = useState(autoFullscreen);
  const [mode, setMode] = useState<Mode>('coop');
  const [, setCount] = useState(1);
  const [seats, setSeats] = useState<SeatSetup[]>(defaultSeats('coop', 1));
  const [mapSize, setMapSize] = useState<MapSize>('short');
  const [battleMode, setBattleMode] = useState<BattleMode>('arena');
  // The shuffle seed is no longer a menu choice: every game gets a fresh random one.
  const [seed] = useState(() => Math.floor(Math.random() * 1e6));
  const [step, setStep] = useState<Step>('home');
  /** What the first page was clicked for: a new game or a saved one (both then ask where to play). */
  const [intent, setIntent] = useState<'new' | 'load'>('new');
  const [lastTable, setLastTable] = useState<TableConfig | null>(null);
  const [named, setNamed] = useState<NamedSave[]>(listNamedSaves);
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

  const arena = mode === 'arena';
  const update = (i: number, patch: Partial<SeatSetup>) => setSeats(seats.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const takenBy = (heroId: string, i: number) => seats.some((s, j) => j !== i && s.heroId === heroId);
  const valid =
    seats.every((s, i) => !takenBy(s.heroId, i)) &&
    (mode === 'coop' || (seats.some((s) => s.faction === 'dawn') && seats.some((s) => s.faction === 'horde'))) &&
    (['dawn', 'horde'] as FactionId[]).every((f) => seats.filter((s) => s.faction === f).length <= 3);


  const startGame = () => {
    const r = resolveTier(tier, { objective, shape, customMapId: customId, growth });
    onStart(withRuleset(arena ? arenaSetup(seats, seed, level === 'custom' ? 'normal' : level) : { mode, mapSize, battleMode, seed, seats, rules: { ...rules, extraEvilHero: mode === 'coop' && rules.extraEvilHero, ...(noHorde && mode === 'coop' && r.objective === 'boss' ? { noHorde: true } : {}) } }, digital, r.objective, r.shape, r.customMapId, r.growth, r.kingdom));
  };
  /** The wizard is done: its choices become this screen's state, and the seats come next. */
  const applyWizard = (t: TableConfig) => {
    const preset = levelSettings(t.level, t.mode);
    const count = t.seats.length;
    setLastTable(t);
    setDigitalState(t.digital);
    setMode(t.mode);
    setCount(count);
    setSeats(defaultSeats(t.mode, count));
    setMapSize(t.mapSize);
    setLevel(t.level);
    setBattleMode(t.battleMode ?? preset.battleMode);
    setRules({ ...preset.rules, ...(t.rules ?? {}) });
    setTier(t.tier);
    setObjective(t.objective);
    setShape(t.shape);
    if (t.customMapId) setCustomId(t.customMapId);
    setGrowth(t.growth === true);
    setNoHorde(t.noHorde === true);
    setStep('table');
  };
  const backBtn = (to: Step) => <button className="btn plate parch" style={{ height: 52, padding: '0 28px', fontSize: 20 }} onClick={() => setStep(to)}>← Wstecz</button>;
  const menuLinks = (
    <div className="menu-links" data-menu-links>
      <button className="btn plate parch" style={{ padding: '6px 14px', fontSize: 16 }} onClick={onRules}>Zasady i karty</button>
      <button className="btn plate parch" style={{ padding: '6px 14px', fontSize: 16 }} onClick={onIntro}>Wprowadzenie</button>
      <button className="btn plate parch btn-testers" style={{ padding: '6px 14px', fontSize: 16 }} onClick={onTesters} title="Informacje dla testerów, statystyki i uwagi dla twórcy">Dla testerów</button>
    </div>
  );
  const pickWhere = (where: 'here' | 'online') => {
    if (where === 'online') return onOnline(intent);
    setStep(intent === 'new' ? 'wizard' : 'load');
  };
  const stepName = step === 'table' ? `Miejsca przy stole · ${digital ? 'wersja cyfrowa' : 'wersja planszowa'}` : '';

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
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <h1 style={{ margin: 0, lineHeight: 0 }}>
          <img className="logo-glow" src={asset('ui/logo.png')} alt="Gleamroot: Strażnicy Kryształowego Drzewa" style={{ height: step === 'home' ? 'clamp(90px, 15vh, 150px)' : 'clamp(60px, 10vh, 100px)' }} />
        </h1>
        {step !== 'table' && menuLinks}
        {stepName && <div style={{ fontSize: 16, color: '#F3D27A', marginTop: 2, letterSpacing: '0.04em' }}>{stepName}</div>}
      </div>

      {step === 'home' && (
        <div className="main-row setup-row" style={{ position: 'relative', width: '100%', maxWidth: 1100 }}>
          <Frame crest className="grow" innerClass="slate scroll" innerStyle={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="home-big" data-wizard-page="home">
              <button className="opt-card wide" onClick={() => { setIntent('new'); setStep('where'); }}>
                <span className="opt-card-img"><img src={asset('ikony/mapa/shrine.webp')} alt="" /></span>
                <span className="opt-card-title">Nowa gra</span>
                <span className="opt-card-text">Wybierz wersję, poziom i tryb, a potem frakcje i bohaterów.</span>
              </button>
              <button className="opt-card wide" onClick={() => { setIntent('load'); setStep('where'); }}>
                <span className="opt-card-img"><img src={asset('ikony/mapa/chest.webp')} alt="" /></span>
                <span className="opt-card-title">Wczytaj grę</span>
                <span className="opt-card-text">Wróć do zapisanej partii.</span>
              </button>
            </div>
            {loadError && <div style={{ fontSize: 15, color: '#F08A7A', textAlign: 'center' }}>{loadError}</div>}
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

      {step === 'where' && (
        <Frame crest style={{ width: 'min(900px, 96vw)', position: 'relative' }} innerClass="slate scroll" innerStyle={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Ribbon style={{ width: 'min(520px, 90vw)', alignSelf: 'center' }}>{intent === 'new' ? 'Gdzie grasz?' : 'Skąd wczytać grę?'}</Ribbon>
          <div className="opt-grid" data-wizard-page="where">
            <button className="opt-card" onClick={() => pickWhere('here')}>
              <span className="opt-card-img"><img src={asset('ui/menu/komputer.webp')} alt="" /></span>
              <span className="opt-card-title">Ten komputer</span>
              <span className="opt-card-text">Z botami albo z kimś przy jednym ekranie. Bez konta.</span>
            </button>
            <button className="opt-card" onClick={() => pickWhere('online')} title={online.title}>
              <span className="opt-card-img"><img src={asset('ui/menu/internet.webp')} alt="" /></span>
              <span className="opt-card-title">Przez internet</span>
              <span className="opt-card-text">{session ? 'Z innymi graczami, z rankingiem i zapisami na koncie.' : 'Wymaga konta: zalogujesz się albo założysz konto.'}</span>
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>{backBtn('home')}</div>
        </Frame>
      )}

      {step === 'wizard' && (
        <NewGameWizard online={false} initial={lastTable ?? undefined} onBack={() => setStep('where')} onFinish={applyWizard} />
      )}

      {step === 'load' && (
        <Frame crest style={{ width: 'min(900px, 96vw)', position: 'relative' }} innerClass="slate scroll" innerStyle={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Ribbon style={{ width: 'min(520px, 90vw)', alignSelf: 'center' }}>Zapisane gry</Ribbon>
          <div data-wizard-page="load" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {autosave && (
              <div className="well" style={{ padding: '8px 14px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <b style={{ color: '#F3D27A' }}>Ostatnia partia (autozapis)</b>
                  <div style={{ fontSize: 14, color: 'var(--muted)' }}>{saveLabel}</div>
                </div>
                <button className="btn prim" style={{ padding: '6px 18px', fontSize: 17 }} onClick={() => onLoad(autosave)}>Wczytaj</button>
              </div>
            )}
            {named.map((n) => (
              <div key={n.id} className="well" style={{ padding: '8px 14px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <b style={{ color: '#F3D27A' }}>{n.name}</b>
                  <div style={{ fontSize: 14, color: 'var(--muted)' }}>{new Date(n.savedAt).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })} · {describeSave(n.save)}</div>
                </div>
                <button className="btn prim" style={{ padding: '6px 18px', fontSize: 17 }} onClick={() => onLoad(n.save)}>Wczytaj</button>
                <button className="btn plate parch" style={{ padding: '6px 12px', fontSize: 15 }} aria-label={`Usuń zapis ${n.name}`} onClick={() => { deleteNamedSave(n.id); setNamed(listNamedSaves()); }}>Usuń</button>
              </div>
            ))}
            {!autosave && named.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' }}>Brak zapisanych gier. W trakcie partii zapiszesz ją w Opcjach („Zapisz grę”) albo przy wyjściu z gry.</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            {backBtn('where')}
            <button className="btn plate parch" style={{ height: 52, padding: '0 24px', fontSize: 18 }} onClick={() => fileRef.current?.click()}>Wczytaj z pliku</button>
          </div>
          {loadError && <div style={{ fontSize: 15, color: '#F08A7A', textAlign: 'center' }}>{loadError}</div>}
        </Frame>
      )}
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
                  <label title="Tryb rodzinny: bohater dziecka ma więcej życia i ruchu, a na ekranie jest przycisk Podpowiedź. Na poziomie Królestwo zakupy dziecka robi autopilot." style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 15 }}>
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
              {backBtn('wizard')}
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
