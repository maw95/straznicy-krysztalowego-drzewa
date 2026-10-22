// Intro shown on the first launch: a slide show with the story, the basic ideas of the game and
// where to find the full rules. Each slide's art is public/assets/intro/<id>.jpg; until that file
// exists the slide shows stand-in art that is already in the game.

import { useEffect, useState } from 'react';
import { asset } from './common';

const KEY = 'skd-intro';

export function introSeen(): boolean {
  try {
    return localStorage.getItem(KEY) === 'seen';
  } catch {
    return true; // no storage: don't replay the intro on every visit
  }
}

function markSeen() {
  try {
    localStorage.setItem(KEY, 'seen');
  } catch {
    // storage unavailable
  }
}

interface Slide {
  id: string;
  title: string;
  text: string[];
  /** Stand-in art until intro/<id>.jpg exists; several images are shown side by side. */
  stand: string[];
  /** Slow camera move over the art: start and end transform. */
  pan: [string, string];
  /** Which part of the art stays in view (CSS object-position). */
  focus?: string;
}

export const SLIDES: Slide[] = [
  {
    id: '01-drzewo',
    title: 'Kryształowe Drzewo',
    text: [
      'Dawno temu, zanim pierwsze rzeki odnalazły drogę do morza, na szczycie świata wyrosło Kryształowe Drzewo.',
      'Jego liście z czystego kryształu chwytały światło gwiazd i rozpraszały je po całej krainie. Dzięki niemu ziemia była żyzna, wody czyste, a każde stworzenie miało swoje miejsce.',
    ],
    stand: ['ui/cover.jpg'],
    pan: ['scale(1.18) translate(0, 4%)', 'scale(1.04) translate(0, -2%)'],
    focus: 'center 30%',
  },
  {
    id: '02-noc',
    title: 'Noc Utraconego Blasku',
    text: [
      'Aż pewnej nocy nadleciał Czarny Smok. Zazdrosny o moc Drzewa, uderzył w jego pień z taką siłą, że trzy Kryształy Opieki wypadły spomiędzy gałęzi i rozproszyły się po świecie.',
      'Drzewo zaczęło słabnąć. Liście gasną, rzeki mętnieją, a cień smoka sięga coraz dalej.',
    ],
    stand: ['cards/art/blackDragon.jpg'],
    pan: ['scale(1.05) translate(-2%, 0)', 'scale(1.16) translate(2%, 1%)'],
    focus: 'center 25%',
  },
  {
    id: '03-straznicy',
    title: 'Strażnicy kryształów',
    text: [
      'Pierwszy kryształ trafił do jaskini chciwego Cyklopa. Drugi porwał Gryf do gniazda pełnego błyskotek. Trzeci zatonął w ruinach, których pilnuje wielogłowa Hydra.',
      'Strażnicy nie są ani dobrzy, ani źli — po prostu nie oddają tego, co wpadło im w łapy.',
    ],
    stand: ['cards/art/cyclops.jpg', 'cards/art/griffin.jpg', 'cards/art/hydra.jpg'],
    pan: ['scale(1.02)', 'scale(1.1)'],
    focus: 'center 25%',
  },
  {
    id: '04-dwie-potegi',
    title: 'Dwie potęgi',
    text: [
      'Przymierze Świtu — Złoty Smok, Król Jednorożców i Prastary Niedźwiedź — chce odnaleźć kryształy i oddać je Drzewu, zanim zgaśnie na zawsze.',
      'Mroczna Horda — Czarny Smok, Władca Wilkołaków i Ogr Żelazna Pięść — chce do tego nie dopuścić, a światło Drzewa zagarnąć dla siebie.',
    ],
    stand: ['ui/cover.jpg'],
    pan: ['scale(1.04) translate(3%, 0)', 'scale(1.04) translate(-3%, 0)'],
    focus: 'center 40%',
  },
  {
    id: '05-cel',
    title: 'Jak wygrać',
    text: [
      'Przymierze wygrywa, gdy zaniesie do Drzewa wszystkie potrzebne kryształy — dwa albo trzy, zależnie od liczby bohaterów.',
      'Horda wygrywa, gdy skończy się limit rund, gdy pokona wszystkich bohaterów Przymierza albo gdy odprawi przy Drzewie mroczny rytuał. Drzewo nie pyta, kto jest silniejszy — pyta, kto zdąży.',
    ],
    stand: ['ui/round_track.png'],
    pan: ['scale(0.9) rotate(-4deg)', 'scale(0.98) rotate(4deg)'],
  },
  {
    id: '06-wedrowka',
    title: 'Wędrówka po krainie',
    text: [
      'Kraina to sześciokątne kafelki ukryte rewersem do góry. W swojej turze bohater ma 3 punkty ruchu: wchodząc na pole, odkrywa pola wokół.',
      'Łatwy teren kosztuje 1 punkt, trudny 2, a góry i przepaści trzeba obejść. Po drodze leżą skarby, które trafiają do wspólnego ekwipunku frakcji.',
    ],
    stand: ['tiles/back_dawn.jpg', 'tiles/forest_1.jpg', 'tiles/back_horde.jpg'],
    pan: ['scale(1.02)', 'scale(1.1)'],
  },
  {
    id: '07-bitwa',
    title: 'Bitwa',
    text: [
      'Gdy bohater stanie przy wrogu albo wejdzie do siedliska strażnika, zaczyna się bitwa — na osobnej arenie 3 na 3 albo w szybkim pojedynku na planszy.',
      'Każda jednostka ma trzy liczby: Życie, Atak i Szybkość. Szybsi działają pierwsi, cios zadaje tyle obrażeń, ile wynosi Atak, a większość jednostek ma jeszcze zdolność na jedną bitwę.',
    ],
    stand: ['arena/dawn.jpg'],
    pan: ['scale(1.1) translate(-3%, 0)', 'scale(1.1) translate(3%, 0)'],
  },
  {
    id: '08-tryby',
    title: 'Razem albo przeciwko sobie',
    text: [
      'W kooperacji wszyscy gracie Przymierzem, a Hordę prowadzi automat. W rywalizacji jedni biorą Przymierze, drudzy Hordę.',
      'Poziom Łatwy da się ogarnąć w kilka minut — nawet z pięciolatkiem. Normalny to pełna gra, a Trudny to wyzwanie dla dorosłych.',
    ],
    stand: ['cards/art/goldDragon.jpg', 'cards/art/werewolfLord.jpg'],
    pan: ['scale(1.03)', 'scale(1.12)'],
    focus: 'center 25%',
  },
  {
    id: '09-instrukcja',
    title: 'Drzewo czeka',
    text: [
      'To tylko zarys. Pełne zasady, wszystkie karty jednostek i skarbów znajdziesz w instrukcji: w menu głównym kliknij „Zasady i karty”, a potem zakładkę „Instrukcja”.',
      'W czasie gry zasady otwiera przycisk „Zasady” na dolnym pasku albo klawisz R. Ten wstęp obejrzysz ponownie przyciskiem „Wprowadzenie” w menu. Wybierz stronę!',
    ],
    stand: ['ui/parchment.jpg'],
    pan: ['scale(1.02)', 'scale(1.08)'],
  },
];

export function Intro({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const last = index === SLIDES.length - 1;
  const close = () => {
    markSeen();
    onClose();
  };
  const next = () => (last ? close() : setIndex(index + 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Enter and Space on a focused button already click it.
      const onButton = e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ');
      if (e.key === 'Escape') close();
      else if (!onButton && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' && index > 0) setIndex(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="intro" role="dialog" aria-label="Wprowadzenie">
      {SLIDES.map((s, i) => {
        const own = !missing.has(s.id);
        const art = own ? [`intro/${s.id}.jpg`] : s.stand;
        // Only the current slide and its neighbours are in the page: cross-fades without loading everything at once.
        if (Math.abs(i - index) > 1) return null;
        return (
          <div key={s.id} className={`intro-slide ${i === index ? 'on' : ''}`} aria-hidden={i !== index}>
            <div className="intro-art" style={{ ['--pan-from' as string]: s.pan[0], ['--pan-to' as string]: s.pan[1] } as React.CSSProperties}>
              {art.map((src) => (
                <img
                  key={src}
                  src={asset(src)}
                  alt=""
                  style={{ objectPosition: s.focus ?? 'center', objectFit: src.endsWith('.png') ? 'contain' : 'cover' }}
                  onError={own ? () => setMissing((m) => new Set(m).add(s.id)) : undefined}
                />
              ))}
            </div>
          </div>
        );
      })}
      <div className="intro-fireflies" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <span
            key={i}
            className="firefly"
            style={{ left: `${(i * 53) % 100}%`, top: `${15 + ((i * 37) % 70)}%`, ['--fx' as string]: `${((i * 17) % 80) - 40}px`, ['--fy' as string]: `${((i * 23) % 60) - 40}px`, ['--fd' as string]: `${8 + (i % 4) * 1.7}s`, ['--fdl' as string]: `${-(i * 1.1)}s` } as React.CSSProperties}
          />
        ))}
      </div>
      <button className="btn plate parch intro-skip" onClick={close}>
        Pomiń
      </button>
      <div className="intro-panel">
        <div key={index} className="intro-text">
          <h2>{SLIDES[index].title}</h2>
          {SLIDES[index].text.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="intro-nav">
          <div className="intro-dots" aria-label={`Slajd ${index + 1} z ${SLIDES.length}`}>
            {SLIDES.map((s, i) => (
              <button key={s.id} className={i === index ? 'on' : ''} aria-label={`Slajd ${i + 1}`} onClick={() => setIndex(i)} />
            ))}
          </div>
          <button className="btn prim intro-next" onClick={next} autoFocus>
            Dalej
          </button>
        </div>
      </div>
    </div>
  );
}
