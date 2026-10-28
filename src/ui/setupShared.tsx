// Pieces of the game setup shared by the local setup screen and the online room: level names and hints,
// explanations, the faction tint of a seat, labelled rows and the option buttons.

import { MAP_VARIANTS, type FactionId, type MapSize } from '../engine/data';
import type { Level } from '../engine/types';

/** Class of an option button; the chosen one is lit. */
export const choice = (active: boolean) => `btn plate parch ${active ? 'on' : ''}`;
/** A small option button (mode, map, level, rules); the chosen one is lit. */
export const chip = (active: boolean) => `${choice(active)} chip`;

export const LEVELS: Array<[Level | 'custom', string]> = [
  ['kids', 'Łatwy'],
  ['normal', 'Normalny'],
  ['hard', 'Trudny'],
  ['custom', 'Własny'],
];

export const LEVEL_HINT: Record<Level | 'custom', string> = {
  kids: 'Krótkie pojedynki na planszy, bez zdolności, bez kości i bez rytuału, a poległego bohatera zastępuje rezerwowy — zasady do ogarnięcia w kilka minut.',
  normal: 'Pełna gra: bitwy 3 na 3 na arenie, zdolności i skarby.',
  hard: 'Pełna gra, a automat zła ma o jednego bohatera więcej (co najmniej trzech) i 2 losowe skarby na start, ale nie dostaje posiłków. Wyzwanie dla dorosłych.',
  custom: 'Wybierz sam: rodzaj bitew, ułatwienia i utrudnienia, które można dowolnie łączyć.',
};

export const ARENA_HINT = 'Jedna bitwa 3 na 3: każdy wybiera bohatera, dwóch pomocników i na zmianę dobiera 2 skarby ze wspólnej talii. Ok. 5–10 minut.';

export const ARENA_LEVEL_TIPS: Record<Level, string> = {
  kids: 'Komputer wybiera pomocników i skarby na chybił trafił.',
  normal: 'Komputer wybiera rozsądnie, ale nie zawsze najlepszy skarb.',
  hard: 'Komputer zawsze bierze najmocniejszych pomocników i najlepsze skarby.',
};

/** Explanations shown when hovering the setup buttons. */
export const TIPS = {
  arenaMode: 'Szybka bitwa bez mapy: Przymierze Świtu kontra Mroczna Horda, z komputerem albo z drugim graczem. Bohater, dwóch pomocników i 2 skarby dobierane ze wspólnej talii — na zmianę jeden z kilku pokazanych (Przymierze widzi 3, Horda 4).',
  coop: 'Wszyscy gracie razem Przymierzem Świtu, a Hordę prowadzi automat według prostych zasad. Dobry wybór na pierwsze partie i do gry z dziećmi.',
  pvp: 'Jedni prowadzą Przymierze Świtu, drudzy Mroczną Hordę (najwyżej 2 graczy na stronę). Przymierze zbiera kryształy dla Drzewa, Horda poluje na jego bohaterów albo odprawia rytuał.',
  arena: 'Bitwa przenosi się na osobną planszę areny: każda strona wystawia bohatera i dwóch pomocników, jednostki chodzą, strzelają i używają zdolności. Ok. 5–10 minut na bitwę.',
  board: 'Szybki pojedynek bez ruchu: walczą tylko dwaj bohaterowie (albo bohater ze strażnikiem, który ma wtedy mniej Życia) i na zmianę zadają ciosy. Ok. 1–2 minut.',
  dice: 'Do każdego ciosu dolicza się rzut kością −1 / 0 / +1. Więcej losowości: słabszy czasem wygra, silniejszy czasem chybi.',
  extraHero: 'Automat zła prowadzi o jednego bohatera więcej niż gracze. Trudniej, ale wciąż do wygrania.',
};

export const LEVEL_TIPS: Record<Level | 'custom', string> = {
  kids: 'Dla najmłodszych (od 5 lat): bitwy to szybkie pojedynki bohaterów na planszy, bez zdolności i bez kości — wystarczy porównać liczby na kartach. Nie ma rytuału, a gdy bohater polegnie, gracz bierze rezerwowego.',
  normal: 'Pełna gra: bitwy 3 na 3 na osobnej arenie, zdolności jednostek i skarby. Obrażenia zawsze równe Atakowi.',
  hard: 'Pełna gra, a automat zła dostaje jednego bohatera więcej (co najmniej trzech) i 2 losowe skarby na start, ale nie dostaje posiłków. Wyzwanie dla dorosłych (tylko kooperacja).',
  custom: 'Sami składacie zasady: rodzaj bitew, ułatwienia i utrudnienia — wszystko można łączyć.',
};

/** Approximate time at the table with one hero per side (simulated game length). */
const MAP_TIME: Record<MapSize, string> = { short: '20–45', medium: '25–55', long: '30–65', veryLong: '35–70' };

export function mapTip(m: MapSize): string {
  const v = MAP_VARIANTS[m];
  const st = v.startTreasures;
  const start = st ? ` · Przymierze zaczyna z ${st.resurrections + st.others} ${st.resurrections + st.others === 1 ? 'skarbem' : 'skarbami'}` : '';
  return `${v.rows} rzędów (${(v.rows * (v.rows + 1)) / 2} pól) · kryształy do zebrania: 2 przy jednym bohaterze Przymierza, 3 przy dwóch · skarby: ${v.resurrections} × Eliksir Odrodzenia + ${v.otherTreasures} inne${start} · limit ${v.roundLimit} rund · ok. ${MAP_TIME[m]} minut przy stole.`;
}

/** A button with an explanation that appears on hover (or keyboard focus). */
export function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="tip">
      {children}
      <span className="tip-pop" role="tooltip">{text}</span>
    </span>
  );
}

/** Seat background tinted by faction: green for Przymierze Świtu, burgundy for Mroczna Horda. */
export const SEAT_TINT: Record<FactionId, string> = {
  dawn: 'linear-gradient(100deg, rgba(36, 112, 64, 0.62), rgba(14, 50, 30, 0.55))',
  horde: 'linear-gradient(100deg, rgba(128, 22, 34, 0.62), rgba(52, 8, 14, 0.58))',
};

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div className="lbl" style={{ width: 118, flex: 'none' }}>{label}</div>
      {children}
    </div>
  );
}
