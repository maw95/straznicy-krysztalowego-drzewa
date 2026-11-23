// Pieces of the game setup shared by the local setup screen and the online room: level names and hints,
// explanations, the faction tint of a seat, labelled rows, the option buttons and the heroes of a fresh table.

import { useEffect, useState } from 'react';
import { FACTION_HEROES, FACTION_NAMES, heroPool, MAP_VARIANTS, UNITS, type FactionId, type TeamId, type MapSize } from '../engine/data';
import { FACTION_PACKS } from '../engine/factions';
import { asset, Portrait } from './common';
import type { Level, MapShape, Mode, SeatSetup } from '../engine/types';

/** Class of an option button; the chosen one is lit. */
export const choice = (active: boolean) => `btn plate parch ${active ? 'on' : ''}`;
/** A small option button (mode, map, level, rules); the chosen one is lit. */
export const chip = (active: boolean) => `${choice(active)} chip`;

/**
 * Factions and heroes of a fresh table, the same locally and online: the arena pits the first hero of each side,
 * coop seats the Przymierze heroes in turn, and rivalry alternates the sides (Przymierze first).
 */
export const defaultHeroes = (mode: Mode, count: number): Array<{ faction: 'dawn' | 'horde'; heroId: string }> =>
  mode === 'arena'
    ? [
        { faction: 'dawn', heroId: FACTION_HEROES.dawn[0] },
        { faction: 'horde', heroId: FACTION_HEROES.horde[0] },
      ]
    : Array.from({ length: count }, (_, i) => {
        const faction = mode === 'coop' || i % 2 === 0 ? ('dawn' as const) : ('horde' as const);
        return { faction, heroId: heroPool(faction, count)[mode === 'coop' ? i % FACTION_HEROES.dawn.length : Math.floor(i / 2)] };
      });

/** The board edition keeps the printed levels: its "Łatwy" is level 0 (duels on the board). */
export const BOARD_LEVELS: Array<[Level | 'custom', string]> = [
  ['zero', 'Łatwy'],
  ['normal', 'Normalny'],
  ['hard', 'Trudny'],
  ['custom', 'Własny'],
];

export const LEVELS: Array<[Level | 'custom', string]> = [
  ['kids', 'Łatwy'],
  ['normal', 'Normalny'],
  ['hard', 'Trudny'],
  ['veryHard', 'Bardzo trudny'],
  ['custom', 'Własny'],
];

export const LEVEL_HINT: Record<Level | 'custom', string> = {
  zero: 'Krótkie pojedynki na planszy, bez zdolności, bez kości i bez rytuału, a poległego bohatera zastępuje rezerwowy — zasady do ogarnięcia w kilka minut.',
  kids: 'Te same zasady co na Normalnym, ale komputer zaczyna słabszy: mniej skarbów i słabsza Horda. Dobry na pierwsze partie.',
  normal: 'Pełna gra: bitwy 3 na 3 na arenie, zdolności i skarby.',
  hard: 'Pełna gra, a automat zła ma o jednego bohatera więcej (co najmniej trzech) i 2 losowe skarby na start, ale nie dostaje posiłków. Wyzwanie dla dorosłych.',
  veryHard: 'Jak Trudny, a komputer ma jeszcze przewagę: 2 skarby więcej na start, dodatkowe surowce (drewno, ruda, Pył), artefakt dla głównego bohatera i większe dochody. Dla najlepszych.',
  custom: 'Wybierz sam: rodzaj bitew, ułatwienia i utrudnienia, które można dowolnie łączyć.',
};

export const ARENA_HINT = 'Jedna bitwa. Szybka (3 na 3): bohater, dwóch pomocników i 2 skarby ze wspólnej talii. Pełna (6 na 6): bohater, pięciu pomocników z puli ośmiu, artefakt i dwa czary. Ok. 5–15 minut.';

export const ARENA_LEVEL_TIPS: Record<Level, string> = {
  zero: 'Komputer wybiera pomocników i skarby na chybił trafił.',
  kids: 'Komputer wybiera pomocników i skarby na chybił trafił (w pełnej arenie 6 na 6 ma jeden dodatkowy artefakt).',
  normal: 'Komputer wybiera rozsądnie, ale nie zawsze najlepszy skarb.',
  hard: 'Komputer zawsze bierze najmocniejszych pomocników i najlepsze skarby (w pełnej arenie 6 na 6 ma jeszcze +1 many).',
  veryHard: 'Komputer gra bez błędów. W szybkiej arenie dobiera o jeden skarb więcej, a w pełnej 6 na 6 jego bohater ma więcej many, jeden czar więcej i dwa dodatkowe artefakty.',
};

/** Explanations shown when hovering the setup buttons. */
export const TIPS = {
  arenaMode: 'Szybka bitwa bez mapy: Przymierze Świtu kontra Mroczna Horda, z komputerem albo z drugim graczem. Bohater, dwóch pomocników i 2 skarby dobierane ze wspólnej talii — na zmianę jeden z kilku pokazanych (Przymierze widzi 3, Horda 4).',
  coop: 'Wszyscy gracie razem Przymierzem Świtu, a Hordę prowadzi automat według prostych zasad. Dobry wybór na pierwsze partie i do gry z dziećmi.',
  skirmish: 'Pełna gra na mapie, w której sam wybierasz cel, poziom, mapę, frakcje i graczy. Sam albo ze znajomymi prowadzisz Przymierze Świtu przeciw Hordzie prowadzonej przez komputer, możecie też grać przeciw sobie, a do gry mogą dojść inne frakcje.',
  pvp: 'Jedni prowadzą Przymierze Świtu, drudzy Mroczną Hordę (najwyżej 3 graczy na stronę, razem do 6). Przymierze zbiera kryształy dla Drzewa, Horda poluje na jego bohaterów albo odprawia rytuał.',
  arena: 'Bitwa przenosi się na osobną planszę areny: każda strona wystawia bohatera i dwóch pomocników, jednostki chodzą, strzelają i używają zdolności. Ok. 5–10 minut na bitwę.',
  board: 'Szybki pojedynek bez ruchu: walczą tylko dwaj bohaterowie (albo bohater ze strażnikiem, który ma wtedy mniej Życia) i na zmianę zadają ciosy. Ok. 1–2 minut.',
  dice: 'Do każdego ciosu dolicza się rzut kością −1 / 0 / +1. Więcej losowości: słabszy czasem wygra, silniejszy czasem chybi.',
  digital: 'Wersja cyfrowa: jednostki w nowej grafice 2D z animacjami, arena z poziomymi heksami, duże jednostki na dwóch polach, trupy zostają na planszy, ruch bez ataku kończy turę. Mapa świata zostaje z figurkami 3D. Wersja planszowa to wierna planszówka.',
  extraHero: 'Automat zła prowadzi o jednego bohatera więcej niż gracze. Trudniej, ale wciąż do wygrania.',
};

export const LEVEL_TIPS: Record<Level | 'custom', string> = {
  kids: 'Pełna gra jak na Normalnym (arena, zdolności, skarby), ale komputer ma łatwiej przegrać: zaczyna z mniejszą liczbą skarbów, a Horda jest słabsza. Dla początkujących i rodzin.',
  zero: 'Dla najmłodszych (od 5 lat): bitwy to szybkie pojedynki bohaterów na planszy, bez zdolności i bez kości — wystarczy porównać liczby na kartach. Nie ma rytuału, a gdy bohater polegnie, gracz bierze rezerwowego.',
  normal: 'Pełna gra: bitwy 3 na 3 na osobnej arenie, zdolności jednostek i skarby. Obrażenia zawsze równe Atakowi.',
  hard: 'Pełna gra, a automat zła dostaje jednego bohatera więcej (co najmniej trzech) i 2 losowe skarby na start, ale nie dostaje posiłków. Wyzwanie dla dorosłych.',
  veryHard: 'Jak Trudny, a komputer ma przewagę: 2 skarby więcej na start, dodatkowe surowce (drewno, ruda, Pył), artefakt dla głównego bohatera i większe dochody (w kooperacji zło dostaje też dodatkowego bohatera i skarby). Dla najlepszych.',
  custom: 'Sami składacie zasady: rodzaj bitew, ułatwienia i utrudnienia — wszystko można łączyć.',
};

/** The digital game has no automaton (the Horde is an ordinary bot), so its two hardest levels read differently from the board edition's. */
export const DIGITAL_LEVEL_TIPS: Partial<Record<Level | 'custom', string>> = {
  hard: 'Pełna gra, a komputer dostaje 2 losowe skarby na start. Wyzwanie dla dorosłych.',
  veryHard: 'Jak Trudny, a komputer ma jeszcze przewagę: 2 skarby więcej na start, dodatkowe surowce (drewno, ruda, Pył), artefakt dla głównego bohatera i większe dochody. Dla najlepszych.',
};

/** Approximate time at the table with one hero per side (simulated game length). */
const MAP_TIME: Record<MapSize, string> = { short: '20–45', medium: '25–55', long: '30–65', veryLong: '35–70', huge: '45–90', giant: '55–110' };

export function mapTip(m: MapSize): string {
  const v = MAP_VARIANTS[m];
  const st = v.startTreasures;
  const start = st ? ` · Przymierze zaczyna z ${st.resurrections + st.others} ${st.resurrections + st.others === 1 ? 'skarbem' : 'skarbami'}` : '';
  return `${v.rows} rzędów (${(v.rows * (v.rows + 1)) / 2} pól) · kryształy do zebrania: 2 przy jednym bohaterze Przymierza, 3 przy dwóch · skarby: ${v.resurrections} × Eliksir Odrodzenia + ${v.otherTreasures} inne${start} · limit ${v.roundLimit} rund · ok. ${MAP_TIME[m]} minut przy stole.`;
}

/** A button with an explanation that appears on hover (or keyboard focus), or with `rightClick` only after a right click (a long press on a phone). */
export function Tip({ text, children, rightClick = false }: { text: string; children: React.ReactNode; rightClick?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('pointerdown', close, true);
    document.addEventListener('keydown', close, true);
    return () => {
      document.removeEventListener('pointerdown', close, true);
      document.removeEventListener('keydown', close, true);
    };
  }, [open]);
  if (rightClick) {
    return (
      <span className={`tip tip-rc${open ? ' open' : ''}`} onContextMenu={(e) => { e.preventDefault(); setOpen(true); }}>
        {children}
        <span className="tip-pop" role="tooltip">{text}</span>
      </span>
    );
  }
  return (
    <span className="tip">
      {children}
      <span className="tip-pop" role="tooltip">{text}</span>
    </span>
  );
}

/** Seat background tinted by faction (seats) or side (the online table): green for Przymierze, burgundy for Horda, and amber and violet for the next two factions; the colours of SIDE_RING. */
export const SEAT_TINT: Record<TeamId | FactionId | 'random', string> = {
  // A faction left to chance: sapphire blue, a colour no faction has.
  random: 'linear-gradient(100deg, rgba(52, 88, 176, 0.62), rgba(20, 34, 84, 0.58))',
  dawn: 'linear-gradient(100deg, rgba(36, 112, 64, 0.62), rgba(14, 50, 30, 0.55))',
  horde: 'linear-gradient(100deg, rgba(128, 22, 34, 0.62), rgba(52, 8, 14, 0.58))',
  third: 'linear-gradient(100deg, rgba(150, 104, 18, 0.62), rgba(62, 42, 6, 0.58))',
  fourth: 'linear-gradient(100deg, rgba(92, 52, 138, 0.62), rgba(38, 20, 62, 0.58))',
  // Dzikie Stado: ochre and straw.
  herds: 'linear-gradient(100deg, rgba(176, 136, 48, 0.62), rgba(84, 60, 18, 0.58))',
  // Królestwo Umarłych: ash green.
  // Żelazny Klan: steel and brass.
  clans: 'linear-gradient(100deg, rgba(112, 120, 134, 0.62), rgba(46, 50, 60, 0.58))',
  undead: 'linear-gradient(100deg, rgba(112, 128, 104, 0.62), rgba(46, 56, 44, 0.58))',
  // Dwór Wiecznego Szronu: pearl white and ice (the UI may be pale blue, the figures may not).
  frost: 'linear-gradient(100deg, rgba(160, 196, 220, 0.62), rgba(58, 80, 96, 0.58))',
  // Wolna Kompania: rusty orange and leather.
  free: 'linear-gradient(100deg, rgba(196, 118, 56, 0.62), rgba(84, 52, 30, 0.58))',
  // Imperium Piasków: sand and ochre with a touch of jade.
  sands: 'linear-gradient(100deg, rgba(212, 178, 92, 0.62), rgba(110, 82, 40, 0.58))',
  // Rój Puszczy: umbra and moss with a glow of fireflies.
  swarm: 'linear-gradient(100deg, rgba(150, 132, 62, 0.62), rgba(70, 52, 34, 0.58))',
  // Bractwo Przypływu: sea green, jade and pearl (no blue in the figures).
  tides: 'linear-gradient(100deg, rgba(72, 140, 118, 0.62), rgba(30, 64, 56, 0.58))',
};


/**
 * One layout rule for every section of the setup screens: a big centred title (`.section-title`) and under it the choices in a centred,
 * wrapping line (`.section-choices`). `Row` is the same thing under its old name (it used to put a small label beside the buttons, which
 * overlapped the next section when the buttons wrapped).
 */
export function CentredChoice({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="section">
      <div className="section-title">{label}</div>
      <div className="section-choices">{children}</div>
    </div>
  );
}
export const Row = CentredChoice;

/** Which cells (col, row of a 9×9 hex grid) a map shape fills; the pictures of the shape buttons. */
const SHAPE_FILL: Record<string, (c: number, r: number) => boolean> = {
  triangle: (c, r) => Math.abs(c - 4) <= r / 2 + 0.3,
  rectangle: () => true,
  ring: (c, r) => Math.hypot(c - 4, (r - 4) * 0.9) > 1.7 && Math.hypot(c - 4, (r - 4) * 0.9) < 4.6,
  islands: (c, r) => [[1.5, 1.5], [6.5, 2.2], [3.5, 6.8], [7, 6.5]].some(([x, y]) => Math.hypot(c - x, (r - y) * 0.9) < 1.9),
};

/** A map shape drawn from hexes. */
export function ShapeIcon({ shape, width = 64 }: { shape: string; width?: number }) {
  const fill = SHAPE_FILL[shape] ?? SHAPE_FILL.rectangle;
  const R = 6;
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    if (!fill(c, r)) continue;
    const x = (c + (r % 2 ? 0.5 : 0)) * Math.sqrt(3) * R + R;
    const y = r * 1.5 * R + R;
    const pts = [0, 1, 2, 3, 4, 5].map((i) => `${(x + R * 0.92 * Math.cos(Math.PI / 6 + (i * Math.PI) / 3)).toFixed(1)},${(y + R * 0.92 * Math.sin(Math.PI / 6 + (i * Math.PI) / 3)).toFixed(1)}`).join(' ');
    cells.push(<polygon key={`${c}-${r}`} points={pts} fill="#6FB07A" stroke="#1E3A24" strokeWidth={0.8} />);
  }
  const w = 9.5 * Math.sqrt(3) * R + R;
  const h = 8 * 1.5 * R + 2 * R;
  return <svg width={width} height={(width * h) / w} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">{cells}</svg>;
}

/** A two-line size button: a big letter code over the name. */
export const SIZE_CODES: Record<string, string> = { short: 'S', medium: 'M', long: 'L', veryLong: 'XL', huge: 'XXL', giant: '3XL' };

export const SHAPE_NAMES: Record<MapShape, string> = { triangle: 'Trójkąt', rectangle: 'Prostokąt', ring: 'Pierścień', islands: 'Wyspy', custom: 'Własna mapa' };
export const SHAPE_TIPS: Record<MapShape, string> = {
  triangle: 'Mapa z planszówki: trójkąt, Drzewo na szczycie, bazy w dolnych rogach.',
  rectangle: 'Prostokąt: bazy pośrodku krótszych boków, Drzewo w środku mapy.',
  ring: 'Pierścień wokół jeziora: Drzewo i obie bazy na rogach, do każdego dwie drogi.',
  islands: 'Trzy wyspy rozdzielone wodą: bazy po bokach, Drzewo na środkowej wyspie, dojście po mostach.',
  custom: 'Gotowa, ręcznie narysowana mapa (wybierz ją obok).',
};

/** A seat on the setup screen: what the engine reads, plus the two things left to chance until the game starts. */
export type SeatDraft = SeatSetup & { randomRace?: boolean; randomHero?: boolean };

/**
 * The seats as the game takes them: every "random faction" and "random hero" seat gets its draw. A random faction always comes with a random hero (the
 * heroes belong to a faction). The draw is repeated until the table is a legal one: heroes differ, a faction has at most three seats, and a rivalry has
 * at least two factions.
 */
export function resolveRandomSeats(
  seats: readonly SeatDraft[],
  o: { offered: readonly FactionId[]; heroesOf: (race: FactionId) => string[]; twoFactions: boolean; rnd?: () => number },
): SeatSetup[] {
  const rnd = o.rnd ?? Math.random;
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
  const clean = ({ randomRace: _r, randomHero: _h, ...s }: SeatDraft): SeatSetup => s;
  const drawn = (s: SeatDraft) => Boolean(s.randomRace || s.randomHero);
  if (!seats.some(drawn)) return seats.map(clean);
  const raceOf = (s: SeatSetup) => (s.race ?? s.faction) as FactionId;
  for (let attempt = 0; attempt < 400; attempt++) {
    const out = seats.map((s) => (s.randomRace ? { ...clean(s), race: pick(o.offered) } : clean(s)));
    const taken = new Set(out.filter((_, i) => !drawn(seats[i])).map((s) => s.heroId));
    let ok = true;
    out.forEach((s, i) => {
      if (!ok || !drawn(seats[i])) return;
      const free = o.heroesOf(raceOf(s)).filter((h) => !taken.has(h));
      if (!free.length) { ok = false; return; }
      s.heroId = pick(free);
      taken.add(s.heroId);
    });
    if (!ok) continue;
    const races = out.map(raceOf);
    if (o.twoFactions && new Set(races).size < 2) continue;
    if (races.some((r) => races.filter((x) => x === r).length > 3)) continue;
    return out;
  }
  return seats.map(clean);
}

/** A die (the "random" choice of a faction or a hero), drawn with the gold of the other icons. */
export function DiceIcon({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" style={{ display: 'block', filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.6))' }}>
      <defs>
        <linearGradient id="dice-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F6DD93" /><stop offset="1" stopColor="#B98A2E" /></linearGradient>
      </defs>
      <rect x="4" y="4" width="24" height="24" rx="5" fill="url(#dice-g)" stroke="#5A3A0C" strokeWidth="1.6" />
      {[[11, 11], [21, 11], [16, 16], [11, 21], [21, 21]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.1" fill="#3A2308" />)}
    </svg>
  );
}

/** A small cross (remove a seat). */
export function CrossIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** A short description of each faction for the window under the right button on its crest. */
export const FACTION_BLURBS: Record<FactionId, string> = {
  dawn: 'Strażnicy Kryształowego Drzewa: elfy, leśne zwierzęta i smok światła. Biegają i leczą, a z jasnych zamków ruszają po kryształy.',
  horde: 'Zastępy z płonących wzgórz: ogry, wilkołaki, gobliny i smok cienia. Biją mocno i zbierają siłę z każdej walki.',
  herds: 'Wędrowne stada stepów i puszcz: tury, żubry, nosorożce i łosie, prowadzone przez satyrów. Rozpędzone spychają wrogów na głazy.',
  undead: 'Królestwo Umarłych: kurhany we mgle, szkielety i duchy dawnych strażników. Polegli pomocnicy wracają na arenę.',
  clans: 'Żelazny Klan: krasnoludy, mechanizmy z brązu i bojowe niedźwiedzie. Stawiają mur tarcz i kują runy na jednostkach.',
  frost: 'Dwór Wiecznego Szronu: olbrzymy, wiedźmy zamieci, ryś i mamut. Ich ciosy zamrażają, a zamrożony traci aktywację.',
  free: 'Wolna Kompania: zwierzoludzie z lasów i rzek, trochę zbójnicy, trochę najemnicy. Zastawiają sidła i wchodzą od tyłu.',
  sands: 'Imperium Piasków: oazy, karawany i kamienni strażnicy grobowców. Wojownik na wydmie bywa mirażem.',
  swarm: 'Rój Puszczy: grzybnia, chrząszcze i modliszki spod korzeni starego lasu. Jedna wola, wiele ciał.',
  tides: 'Bractwo Przypływu: trytony, syreny, kraboludy i żółwie z rafy. Wychodzą na ląd z przypływem i zabierają go ze sobą.',
};

/** The window under the right button on a faction's crest: the name, a short description and all its supports with portraits. */
export function FactionDetails({ race }: { race: FactionId }) {
  const pack = FACTION_PACKS[race];
  const supports = [...pack.supports, ...pack.tierUnits.flatMap((u, i) => [u, pack.altUnits[i]]), pack.legend].filter((id, i, a) => id && a.indexOf(id) === i);
  return (
    <div className="plate parch" style={{ width: 320, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }} data-faction-details={race}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={asset(`cards/crests/${race}.png`)} alt="" width={44} height={44} style={{ objectFit: 'contain' }} />
        <div style={{ fontWeight: 800, fontSize: 21, lineHeight: 1.1 }}>{FACTION_NAMES[race]}</div>
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.3 }}>{FACTION_BLURBS[race]}</div>
      <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B4A22' }}>Pomocnicy</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {supports.map((id) => (
          <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center', fontSize: 12, lineHeight: 1.1, fontWeight: 700 }}>
            <Portrait unitId={id} size={44} preview={false} tip={false} title={UNITS[id].name} />
            {UNITS[id].name}
          </div>
        ))}
      </div>
    </div>
  );
}
