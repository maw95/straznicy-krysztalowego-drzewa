import { useRef, useState } from 'react';
import { FACTION_HEROES, FACTION_NAMES, MAP_SIZE_NAMES, UNITS, type FactionId, type MapSize } from '../engine/data';
import { DEFAULT_RULES, type BattleMode, type Controller, type Mode, type RulesConfig, type SeatSetup, type SetupOptions } from '../engine/types';
import { asset, Frame, Portrait, Ribbon, SIDE_RING } from './common';
import { UnitCard } from './UnitCard';
import { describeSave, parseSave, type SaveFile } from './saves';
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

export function SetupScreen({ onStart, onLoad, autosave, onRules }: { onStart: (s: SetupOptions) => void; onLoad: (s: SaveFile) => void; autosave: SaveFile | null; onRules: () => void }) {
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
  const [preview, setPreview] = useState<string>('goldDragon');

  const changeMode = (m: Mode) => {
    const c = m === 'pvp' ? Math.max(2, count) : Math.min(2, count);
    setMode(m);
    setCount(c);
    setSeats(defaultSeats(m, c));
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
          <img className="crest-glint" src={asset('ui/logo.png')} alt="Strażnicy Kryształowego Drzewa" style={{ height: 'clamp(90px, 15vh, 150px)', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.7))' }} />
        </h1>
        <div style={{ fontSize: 18, color: 'var(--muted)' }}>Nowa partia · prototyp do testów</div>
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
            <button className={choice(mode === 'coop')} style={chip} onClick={() => changeMode('coop')}>Kooperacja (wszyscy przeciw AI)</button>
            <button className={choice(mode === 'pvp')} style={chip} onClick={() => changeMode('pvp')}>Rywalizacja (dobro kontra zło)</button>
          </Row>
          <Row label="Gracze">
            {/* At most 2 players per faction: coop (all Przymierze) takes 1–2, PvP 2–4. */}
            {(mode === 'coop' ? [1, 2] : [2, 3, 4]).map((n) => (
              <button key={n} className={choice(count === n)} style={chip} onClick={() => changeCount(n)}>{n}</button>
            ))}
          </Row>
          <Row label="Mapa">
            {(['short', 'medium', 'long'] as MapSize[]).map((m) => (
              <button key={m} className={choice(mapSize === m)} style={chip} onClick={() => setMapSize(m)}>{MAP_SIZE_NAMES[m]}</button>
            ))}
          </Row>
          <Row label="Bitwy">
            <button className={choice(battleMode === 'arena')} style={chip} onClick={() => setBattleMode('arena')}>Osobna arena (3 na 3)</button>
            <button className={choice(battleMode === 'board')} style={chip} onClick={() => setBattleMode('board')}>Na planszy głównej (pojedynek 1 na 1)</button>
          </Row>
          <Row label="Ułatwienia">
            {EASES.map(([label, on, patch]) => (
              <button key={label} className={choice(on(rules))} style={chip} aria-pressed={on(rules)} onClick={() => setRules({ ...rules, ...patch(!on(rules)) })}>
                {label}
              </button>
            ))}
          </Row>
          <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -6 }}>Pełna gra to wszystko wyłączone. Ułatwienia można dowolnie łączyć.</div>
          {mode === 'coop' && (
            <Row label="Utrudnienia">
              <button className={choice(rules.extraEvilHero)} style={chip} aria-pressed={rules.extraEvilHero} onClick={() => setRules({ ...rules, extraEvilHero: !rules.extraEvilHero })}>
                Dodatkowy bohater Hordy
              </button>
            </Row>
          )}
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
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <button className="btn prim" disabled={!valid} style={{ height: 56, padding: '0 40px', fontSize: 24 }} onClick={() => onStart({ mode, mapSize, battleMode, seed, seats, rules: { ...rules, extraEvilHero: mode === 'coop' && rules.extraEvilHero } })}>
              Rozpocznij grę
            </button>
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

/** Optional simplifications of the full game: label, whether it is on, how to switch it. */
const EASES: Array<[string, (r: RulesConfig) => boolean, (on: boolean) => Partial<RulesConfig>]> = [
  ['Bez zdolności', (r) => !r.abilities, (on) => ({ abilities: !on })],
  ['Bez skarbów', (r) => !r.treasures, (on) => ({ treasures: !on })],
  ['Bez rzutu kością', (r) => !r.useDice, (on) => ({ useDice: !on })],
  ['Rezerwowy bohater po śmierci', (r) => r.heroReplacement, (on) => ({ heroReplacement: on })],
];

/** Seat background tinted by faction: green for Przymierze Świtu, burgundy for Mroczna Horda. */
const SEAT_TINT: Record<FactionId, string> = {
  dawn: 'linear-gradient(100deg, rgba(36, 112, 64, 0.62), rgba(14, 50, 30, 0.55))',
  horde: 'linear-gradient(100deg, rgba(128, 22, 34, 0.62), rgba(52, 8, 14, 0.58))',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div className="lbl" style={{ width: 90 }}>{label}</div>
      {children}
    </div>
  );
}
