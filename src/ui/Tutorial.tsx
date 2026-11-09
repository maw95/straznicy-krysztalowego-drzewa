// First-game tutorial: short tips that appear once, when the situation they explain
// first comes up. Progress is remembered in the browser; it can be switched off in setup.

import { useEffect, useState } from 'react';
import { controlRoundsToWin, objectiveOf, OBJECTIVES } from '../engine/objectives';
import type { GameState } from '../engine/types';

interface Tip {
  id: string;
  title: string;
  /** The tip's text; a function when it depends on the game (the objective). */
  text: string | ((s: GameState) => string);
  when: (s: GameState) => boolean;
}

/** The first tip: what this game is played for (the objective chosen in the setup). */
function welcomeText(s: GameState): string {
  switch (objectiveOf(s)) {
    case 'control':
      return `Twoim celem są punkty kontrolne: flagi na mapie. Stań bohaterem na punkcie i utrzymaj więcej punktów niż Horda przez ${controlRoundsToWin(s, 'dawn')} rundy z rzędu. Środkowy punkt jest wart 2, boczne po 1.`;
    case 'survival':
      return `Twoim celem jest przetrwać ${s.survival?.rounds ?? ''} rund. Co dwie rundy w bazie Hordy pojawia się kolejny bohater, więc trzymajcie się razem. Kryształów i Drzewa tu nie ma: liczy się, czy choć jeden bohater Przymierza dożyje końca.`;
    case 'boss':
      return `Twoim celem jest Boss: ${OBJECTIVES.boss.summary}`;
    case 'artifact':
      return `Twoim celem jest Artefakt: ${OBJECTIVES.artifact.summary}`;
    default:
      return 'Twoim celem jest odnaleźć kryształy, odebrać je strażnikom i zanieść do Drzewa na szczycie mapy, zanim minie limit rund.';
  }
}

const TIPS: Tip[] = [
  {
    id: 'welcome',
    title: 'Witaj w Krainie Kryształowego Drzewa',
    text: welcomeText,
    when: (s) => s.phase === 'adventure',
  },
  {
    id: 'move',
    title: 'Ruch po mapie',
    text: 'Pola podświetlone na niebiesko są w zasięgu — liczba to koszt dojścia. Kliknij pole, by tam pójść. Trudny teren (rzeka, wzgórza, bagno, jaskinia, ruiny) kosztuje 2 punkty, przeszkody są nieprzechodnie. Najechanie na pole pokazuje szczegóły.',
    when: (s) => s.phase === 'adventure',
  },
  {
    id: 'fog',
    title: 'Mgła',
    text: 'Zakryte pola odsłaniają się, gdy staniesz obok nich. Pomyliłeś krok, który niczego nie odkrył? Przycisk „Cofnij” (lub klawisz U) go wycofa.',
    when: (s) => s.phase === 'adventure' && s.round >= 1,
  },
  {
    id: 'guardian',
    title: 'Strażnik kryształu',
    text: (s) =>
      objectiveOf(s) === 'survival'
        ? 'Widzisz strażnika? Wejście na jego pole rozpocznie walkę. Strażnik jest silny — dobrze mieć pełną drużynę pomocników — ale pokonany zostawia skarb. Kryształów tu nie ma.'
        : 'Widzisz kryształ pod strażą? Wejście na jego pole rozpocznie walkę. Strażnik jest silny — dobrze mieć pełną drużynę pomocników.',
    when: (s) => s.phase === 'adventure' && Object.values(s.crystals).some((c) => c.guardian && s.tiles[c.at]?.revealed),
  },
  {
    id: 'treasure',
    title: 'Skarby',
    text: 'Znaleziony skarb trafia do wspólnego ekwipunku frakcji. Kliknij jego miniaturę, by zobaczyć kartę. Większości skarbów używa się w bitwie, przed akcją własnej jednostki.',
    when: (s) => s.phase === 'adventure' && s.factions.dawn.inventory.length + s.factions.horde.inventory.length > 0,
  },
  {
    id: 'deploy',
    title: 'Ustawienie wojsk',
    text: 'Przed walką możesz ustawić swoje jednostki na złotych polach swojej skrajnej kolumny: kliknij jednostkę, potem pole (zajęte pole zamieni je miejscami). Atakujący ustawia się pierwszy.',
    when: (s) => s.phase === 'battle' && s.battle?.stage === 'deploy',
  },
  {
    id: 'battle',
    title: 'Bitwa',
    text: 'Jednostki działają po kolei od najszybszej. Aktywna ma niebieską poświatę: kliknij podświetlone pole, by się ruszyć, a wroga z czerwoną obwódką, by zaatakować. Najechanie na wroga pokaże przewidywane obrażenia. Klawisz T pokazuje, gdzie dosięgną Cię wrogowie.',
    when: (s) => s.phase === 'battle' && s.battle?.stage === 'fight',
  },
  {
    id: 'abilities',
    title: 'Zdolności',
    text: 'Każda jednostka ma zdolność — większość działa raz na bitwę, zdolności strażników przy każdym ataku. Przycisk z ikoną (lub klawisz Z) włącza ją przed atakiem albo używa od razu.',
    when: (s) => s.phase === 'battle' && s.battle?.stage === 'fight' && s.rules.abilities,
  },
  {
    id: 'crystal',
    title: 'Masz kryształ!',
    text: 'Zanieś go na pole Drzewa na szczycie mapy. Jeśli zginiesz, kryształ upadnie na pole bitwy.',
    when: (s) => s.phase === 'adventure' && objectiveOf(s) === 'crystals' && Object.values(s.heroes).some((h) => h.crystals.length > 0),
  },
];

const KEY = 'skd-tutorial';

function readSeen(): { enabled: boolean; seen: string[] } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '');
    if (typeof v.enabled === 'boolean' && Array.isArray(v.seen)) return v;
  } catch {
    // first run
  }
  return { enabled: true, seen: [] };
}

function write(v: { enabled: boolean; seen: string[] }) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // storage unavailable
  }
}

export const tutorialEnabled = () => readSeen().enabled;
export function setTutorialEnabled(enabled: boolean) {
  write({ enabled, seen: enabled ? [] : readSeen().seen });
}

export function Tutorial({ state, active }: { state: GameState; active: boolean }) {
  const [store, setStore] = useState(readSeen);
  const tip = store.enabled && active ? TIPS.find((t) => !store.seen.includes(t.id) && t.when(state)) : undefined;
  useEffect(() => write(store), [store]);
  if (!tip) return null;
  const left = TIPS.filter((t) => !store.seen.includes(t.id)).length;
  return (
    <div
      key={tip.id}
      className="plate parch"
      role="dialog"
      aria-label={tip.title}
      style={{ position: 'fixed', left: '50%', bottom: 110, transform: 'translateX(-50%)', zIndex: 45, width: 'min(520px, 92vw)', padding: '12px 16px', animation: 'pop-in 0.3s ease-out both', boxShadow: '0 0 0 2px #9EE4FF, 0 12px 30px rgba(0,0,0,0.6)' }}
    >
      <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 4 }}>{tip.title}</div>
      <div style={{ fontSize: 16, lineHeight: 1.35 }}>{typeof tip.text === 'function' ? tip.text(state) : tip.text}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button className="btn" style={{ background: 'none', border: 0, color: '#6B5233', fontSize: 14, textDecoration: 'underline', padding: 0 }} onClick={() => setStore({ enabled: false, seen: store.seen })}>
          Wyłącz samouczek
        </button>
        <button className="btn prim" style={{ padding: '4px 18px', fontSize: 16 }} onClick={() => setStore({ ...store, seen: [...store.seen, tip.id] })}>
          {left > 1 ? 'Rozumiem' : 'Koniec samouczka'}
        </button>
      </div>
    </div>
  );
}
