import { useRef, useState } from 'react';
import { FACTION_HEROES, FACTION_NAMES, MAP_SIZE_NAMES, MAP_VARIANTS, UNITS, type FactionId, type MapSize } from '../engine/data';
import { DEFAULT_RULES, levelSettings, type BattleMode, type Level, type Controller, type Mode, type RulesConfig, type SeatSetup, type SetupOptions } from '../engine/types';
import { asset, Frame, Portrait, Ribbon, SIDE_RING } from './common';
import { UnitCard } from './UnitCard';
import { describeSave, parseSave, type SaveFile } from './saves';
import { journalStats } from './journal';
import { tutorialEnabled, setTutorialEnabled } from './Tutorial';

const defaultSeats = (mode: Mode, count: number): SeatSetup[] => {
  if (mode === 'coop') {
    return Array.from({ length: count }, (_, i) => ({ name: `Gracz ${i + 1}`, faction: 'dawn' as FactionId, controller: (i === 0 ? 'human' : 'bot') as Controller, heroId: FACTION_HEROES.dawn[i % 3] }));
  }
  const out: SeatSetup[] = [];
  for (let i = 0; i < count; i++) {
    const faction: FactionId = i % 2 === 0 ? 'dawn' : 'horde';
    out.push({ name: `Gracz ${i + 1}`, faction, controller: i < 2 ? 'human' : 'bot', heroId: FACTION_HEROES[faction][Math.floor(i / 2)] });
  }
  return out;
};

export function SetupScreen({ onStart, onLoad, autosave, onRules, onTesters }: { onStart: (s: SetupOptions) => void; onLoad: (s: SaveFile) => void; autosave: SaveFile | null; onRules: () => void; onTesters: () => void }) {
  const stats = journalStats();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tutorial, setTutorial] = useState(tutorialEnabled());
  const [mode, setMode] = useState<Mode>('coop');
  const [count, setCount] = useState(1);
  const [seats, setSeats] = useState<SeatSetup[]>(defaultSeats('coop', 1));
  const [mapSize, setMapSize] = useState<MapSize>('short');
  const [battleMode, setBattleMode] = useState<BattleMode>('arena');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [rules, setRules] = useState({ ...DEFAULT_RULES });
  const [level, setLevel] = useState<Level | 'custom'>('normal');
  const pickLevel = (l: Level, m: Mode = mode) => {
    const preset = levelSettings(l, m);
    setLevel(l);
    setBattleMode(preset.battleMode);
    setRules({ ...preset.rules, initiativeTie: rules.initiativeTie });
  };
  const [preview, setPreview] = useState<string>('goldDragon');

  const changeMode = (m: Mode) => {
    const c = m === 'pvp' ? Math.max(2, count) : Math.min(2, count);
    setMode(m);
    setCount(c);
    setSeats(defaultSeats(m, c));
    // "Trudny" exists for coop only.
    if (level === 'hard' && m === 'pvp') pickLevel('normal', m);
  };
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

  const choice = (active: boolean) => `btn plate parch ${active ? 'on' : ''}`;
  const chip = { padding: '4px 14px', fontSize: 17 };

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
            <button className="btn prim" style={{ padding: '6px 18px', fontSize: 17 }} title={describeSave(autosave)} onClick={() => onLoad(autosave)}>
              Kontynuuj zapisaną partię
            </button>
          )}
          <button className="btn plate parch" style={{ padding: '6px 14px', fontSize: 16 }} onClick={() => fileRef.current?.click()}>
            Wczytaj z pliku
          </button>
          <button className="btn plate parch" style={{ padding: '6px 14px', fontSize: 16 }} onClick={onRules}>
            Zasady i karty
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
        {autosave && <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{describeSave(autosave)}</div>}
        {loadError && <div style={{ fontSize: 15, color: '#F08A7A', marginTop: 4 }}>{loadError}</div>}
      </div>
      <div className="main-row setup-row" style={{ position: 'relative', width: '100%', maxWidth: 1400 }}>
        <Frame crest className="grow" innerClass="slate scroll" innerStyle={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Row label="Tryb">
            <Tip text={TIPS.coop}><button className={choice(mode === 'coop')} style={chip} onClick={() => changeMode('coop')}>Kooperacja (wszyscy przeciw AI)</button></Tip>
            <Tip text={TIPS.pvp}><button className={choice(mode === 'pvp')} style={chip} onClick={() => changeMode('pvp')}>Rywalizacja (dobro kontra zło)</button></Tip>
          </Row>
          <Row label="Gracze">
            {/* At most 2 players per faction: coop (all Przymierze) takes 1–2, PvP 2–4. */}
            {(mode === 'coop' ? [1, 2] : [2, 3, 4]).map((n) => (
              <button key={n} className={choice(count === n)} style={chip} onClick={() => changeCount(n)}>{n}</button>
            ))}
          </Row>
          <Row label="Mapa">
            {(Object.keys(MAP_SIZE_NAMES) as MapSize[]).map((m) => (
              <Tip key={m} text={mapTip(m)}><button className={choice(mapSize === m)} style={chip} onClick={() => setMapSize(m)}>{MAP_SIZE_NAMES[m]}</button></Tip>
            ))}
          </Row>
          <Row label="Poziom">
            {LEVELS.filter(([l]) => l !== 'hard' || mode === 'coop').map(([l, label]) => (
              <Tip key={l} text={LEVEL_TIPS[l]}>
                <button className={choice(level === l)} style={chip} aria-pressed={level === l} onClick={() => (l === 'custom' ? setLevel('custom') : pickLevel(l))}>
                  {label}
                </button>
              </Tip>
            ))}
          </Row>
          <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -6 }}>{LEVEL_HINT[level]}</div>
          {level === 'custom' && (
          <>
          <Row label="Bitwy">
            <Tip text={TIPS.arena}><button className={choice(battleMode === 'arena')} style={chip} onClick={() => setBattleMode('arena')}>Osobna arena (3 na 3)</button></Tip>
            <Tip text={TIPS.board}><button className={choice(battleMode === 'board')} style={chip} onClick={() => setBattleMode('board')}>Na planszy głównej (pojedynek 1 na 1)</button></Tip>
          </Row>
          <Row label="Ułatwienia">
            {EASES.map(([label, on, patch, tip]) => (
              <Tip key={label} text={tip}>
                <button className={choice(on(rules))} style={chip} aria-pressed={on(rules)} onClick={() => setRules({ ...rules, ...patch(!on(rules)) })}>
                  {label}
                </button>
              </Tip>
            ))}
          </Row>
          <Row label="Utrudnienia">
            <Tip text={TIPS.dice}>
              <button className={choice(rules.useDice)} style={chip} aria-pressed={rules.useDice} onClick={() => setRules({ ...rules, useDice: !rules.useDice })}>
                Rzut kością
              </button>
            </Tip>
            {mode === 'coop' && (
              <Tip text={TIPS.extraHero}>
                <button className={choice(rules.extraEvilHero)} style={chip} aria-pressed={rules.extraEvilHero} onClick={() => setRules({ ...rules, extraEvilHero: !rules.extraEvilHero })}>
                  Dodatkowy bohater Hordy
                </button>
              </Tip>
            )}
          </Row>
          <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -6 }}>Pełna gra to wszystko wyłączone. Ułatwienia i utrudnienia można dowolnie łączyć.</div>
          </>
          )}
          <div className="lbl" style={{ marginTop: 6 }}>Zasady testowe</div>
          <div style={{ display: 'flex', gap: '12px 22px', flexWrap: 'wrap', alignItems: 'center', fontSize: 16 }}>
            <label>
              Remis inicjatywy{' '}
              <select value={rules.initiativeTie} onChange={(e) => setRules({ ...rules, initiativeTie: e.target.value as typeof rules.initiativeTie })}>
                <option value="rotating">rotacyjnie</option>
                <option value="defender">obrońca pierwszy</option>
              </select>
            </label>
            <label>
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
            <label>
              Ziarno losowania <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} style={{ width: 110 }} />
            </label>
          </div>
          <div className="lbl" style={{ marginTop: 6 }}>Miejsca przy stole</div>
          {seats.map((s, i) => (
            <div key={i} className="well" style={{ padding: '6px 12px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: SEAT_TINT[s.faction], transition: 'background 0.35s' }}>
              <img src={asset(`cards/crests/${s.faction}.png`)} alt="" title={FACTION_NAMES[s.faction]} style={{ width: 46, height: 46, objectFit: 'contain', flex: 'none', filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.5))' }} />
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
              <div style={{ display: 'flex', gap: 6 }}>
                {FACTION_HEROES[s.faction].map((h) => (
                  <button key={h} className="btn" title={UNITS[h].name} onMouseEnter={() => setPreview(h)} onClick={() => { update(i, { heroId: h }); setPreview(h); }} disabled={takenBy(h, i)} style={{ background: 'none', border: 0, padding: 0 }}>
                    <Portrait unitId={h} size={46} ring={SIDE_RING[s.faction]} glow={s.heroId === h ? '0 0 0 3px #9EE4FF, 0 0 10px 3px rgba(158,228,255,0.6)' : undefined} dim={takenBy(h, i)} />
                  </button>
                ))}
              </div>
              <div style={{ fontWeight: 700, color: '#F3D27A' }}>{UNITS[s.heroId].name}</div>
            </div>
          ))}
          {mode === 'coop' && <div style={{ fontSize: 15, color: 'var(--muted)' }}>Zło prowadzi automat: tylu bohaterów Hordy, ilu bohaterów Przymierza{rules.extraEvilHero ? ' — i jeszcze jeden' : ''}.</div>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
            <button className="btn prim r tester-btn" style={{ height: 56, padding: '0 28px', fontSize: 21 }} onClick={onTesters} title="Informacje dla testerów, statystyki i plik z uwagami dla twórcy">
              INFO DLA TESTERÓW
            </button>
            <button className="btn prim" disabled={!valid} style={{ height: 56, padding: '0 40px', fontSize: 24 }} onClick={() => onStart({ mode, mapSize, battleMode, seed, seats, rules: { ...rules, extraEvilHero: mode === 'coop' && rules.extraEvilHero } })}>
              Rozpocznij grę
            </button>
          </div>
          {/* The game version bottom-left, the tester's record in this browser bottom-right. */}
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="app-version">Wersja {__APP_VERSION__}</div>
            <div className="stats-box" aria-label="Twoje partie">
              <div className="stats-title">Twoje partie</div>
              <div className="stats-grid">
                <span>Rozegrane</span>
                <b>{stats.played}</b>
                <span>Kooperacja</span>
                <b>
                  <span className="win">{stats.coop.won} wygr.</span> · <span className="loss">{stats.coop.lost} przegr.</span>
                </b>
                <span>Rywalizacja</span>
                <b>
                  <span className="win">Przymierze {stats.pvp.dawn}</span> · <span className="loss">Horda {stats.pvp.horde}</span>
                </b>
                {stats.reports > 0 && (
                  <>
                    <span>Zgłoszone błędy</span>
                    <b>{stats.reports}</b>
                  </>
                )}
              </div>
            </div>
          </div>
        </Frame>
        <Frame className="side" style={{ width: 420 }} innerStyle={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Ribbon side={UNITS[preview].side} style={{ width: '100%' }}>Karta bohatera</Ribbon>
          {/* The card sits in the middle of the space left under the ribbon. */}
          <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
            <UnitCard unitId={preview} width={340} />
          </div>
        </Frame>
      </div>
    </div>
  );
}

const LEVELS: Array<[Level | 'custom', string]> = [
  ['kids', 'Łatwy'],
  ['normal', 'Normalny'],
  ['hard', 'Trudny'],
  ['custom', 'Własny'],
];

const LEVEL_HINT: Record<Level | 'custom', string> = {
  kids: 'Krótkie pojedynki na planszy, bez zdolności, bez kości i bez rytuału, a poległego bohatera zastępuje rezerwowy — zasady do ogarnięcia w kilka minut.',
  normal: 'Pełna gra: bitwy 3 na 3 na arenie, zdolności i skarby.',
  hard: 'Pełna gra, a automat zła ma o jednego bohatera więcej i 2 losowe skarby na start. Wyzwanie dla dorosłych.',
  custom: 'Wybierz sam: rodzaj bitew, ułatwienia i utrudnienia, które można dowolnie łączyć.',
};

/** Optional simplifications of the full game: label, whether it is on, how to switch it, what it does. */
const EASES: Array<[string, (r: RulesConfig) => boolean, (on: boolean) => Partial<RulesConfig>, string]> = [
  ['Bez zdolności', (r) => !r.abilities, (on) => ({ abilities: !on }), 'Nikt nie używa zdolności z kart — także strażnicy kryształów. Mniej zasad do zapamiętania: liczą się tylko Życie, Atak i Szybkość.'],
  ['Same Eliksiry Odrodzenia', (r) => !r.treasures, (on) => ({ treasures: !on }), 'Zamiast talii różnych skarbów na mapie leżą tylko Eliksiry Odrodzenia (1 / 2 / 3 / 4 zależnie od mapy). Jedna prosta karta: wskrzesza poległą jednostkę. Strażnicy nic nie zostawiają.'],
  ['Rezerwowy bohater po śmierci', (r) => r.heroReplacement, (on) => ({ heroReplacement: on }), 'Gdy bohater zginie, gracz bierze nowego, nieużywanego bohatera swojej frakcji. Wkracza on na wolne pole najbliżej miejsca, w którym padł poprzednik — nikt nie odpada z gry.'],
];

/** Explanations shown when hovering the setup buttons. */
const TIPS = {
  coop: 'Wszyscy gracie razem Przymierzem Świtu, a Hordę prowadzi automat według prostych zasad. Dobry wybór na pierwsze partie i do gry z dziećmi.',
  pvp: 'Jedni prowadzą Przymierze Świtu, drudzy Mroczną Hordę (najwyżej 2 graczy na stronę). Przymierze zbiera kryształy dla Drzewa, Horda poluje na jego bohaterów albo odprawia rytuał.',
  arena: 'Bitwa przenosi się na osobną planszę areny: każda strona wystawia bohatera i dwóch pomocników, jednostki chodzą, strzelają i używają zdolności. Ok. 5–10 minut na bitwę.',
  board: 'Szybki pojedynek bez ruchu: walczą tylko dwaj bohaterowie (albo bohater ze strażnikiem, który ma wtedy mniej Życia) i na zmianę zadają ciosy. Ok. 1–2 minut.',
  dice: 'Do każdego ciosu dolicza się rzut kością −1 / 0 / +1. Więcej losowości: słabszy czasem wygra, silniejszy czasem chybi.',
  extraHero: 'Automat zła prowadzi o jednego bohatera więcej niż gracze. Trudniej, ale wciąż do wygrania.',
};

const LEVEL_TIPS: Record<Level | 'custom', string> = {
  kids: 'Dla najmłodszych (od 5 lat): bitwy to szybkie pojedynki bohaterów na planszy, bez zdolności i bez kości — wystarczy porównać liczby na kartach. Nie ma rytuału, a gdy bohater polegnie, gracz bierze rezerwowego.',
  normal: 'Pełna gra: bitwy 3 na 3 na osobnej arenie, zdolności jednostek i skarby. Obrażenia zawsze równe Atakowi.',
  hard: 'Pełna gra, a automat zła dostaje jednego bohatera więcej i 2 losowe skarby na start. Wyzwanie dla dorosłych (tylko kooperacja).',
  custom: 'Sami składacie zasady: rodzaj bitew, ułatwienia i utrudnienia — wszystko można łączyć.',
};

/** Approximate time at the table with one hero per side (simulated game length). */
const MAP_TIME: Record<MapSize, string> = { short: '20–45', medium: '25–55', long: '30–65', veryLong: '35–70' };

function mapTip(m: MapSize): string {
  const v = MAP_VARIANTS[m];
  const st = v.startTreasures;
  const start = st ? ` · Przymierze zaczyna z ${st.resurrections + st.others} ${st.resurrections + st.others === 1 ? 'skarbem' : 'skarbami'}` : '';
  return `${v.rows} rzędów (${(v.rows * (v.rows + 1)) / 2} pól) · kryształy do zebrania: 2 przy jednym bohaterze Przymierza, 3 przy dwóch · skarby: ${v.resurrections} × Eliksir Odrodzenia + ${v.otherTreasures} inne${start} · limit ${v.roundLimit} rund · ok. ${MAP_TIME[m]} minut przy stole.`;
}

/** A button with an explanation that appears on hover (or keyboard focus). */
function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="tip">
      {children}
      <span className="tip-pop" role="tooltip">{text}</span>
    </span>
  );
}

/** Seat background tinted by faction: green for Przymierze Świtu, burgundy for Mroczna Horda. */
const SEAT_TINT: Record<FactionId, string> = {
  dawn: 'linear-gradient(100deg, rgba(36, 112, 64, 0.62), rgba(14, 50, 30, 0.55))',
  horde: 'linear-gradient(100deg, rgba(128, 22, 34, 0.62), rgba(52, 8, 14, 0.58))',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div className="lbl" style={{ width: 118, flex: 'none' }}>{label}</div>
      {children}
    </div>
  );
}
