// Intro shown on the first launch: a short slide show with the story only (the rules are taught by the trainings and the manual). Each slide's art is public/assets/intro/<id>.jpg; until that file
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
  /** Slow camera move over the stand-in art: start and end transform. */
  pan: [string, string];
  /** Which part of the art stays in view (CSS object-position). */
  focus?: string;
}

/** The slide pictures hold no text, so both languages share them. */
export const slideArt = (id: string) => `intro/${id}.jpg`;

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
    id: '04-przymierze-horda',
    title: 'Świt i Cień',
    text: [
      'Pierwsze ruszyło Przymierze Świtu: Złoty Smok, Król Jednorożców i Prastary Niedźwiedź. Chcą odnaleźć kryształy i oddać je Drzewu, zanim jego blask zgaśnie na zawsze.',
      'Za nimi z cienia wyszła Mroczna Horda Czarnego Smoka: wilkołaki, ogry i gobliny. Horda nie chce ratować Drzewa. Chce jego światła dla siebie.',
    ],
    stand: ['cards/art/goldDragon.jpg', 'cards/art/werewolfLord.jpg'],
    pan: ['scale(1.03)', 'scale(1.12)'],
    focus: 'center 25%',
  },
  {
    id: '05-ludy',
    title: 'Przebudzone ludy',
    text: [
      'Gasnące Drzewo poczuły też inne ludy. Dzikie Stado zeszło ze stepów, bo wysychają jego wodopoje. Żelazny Klan wyszedł z gór, gdy w kopalniach zgasły kryształowe żyły.',
      'Z przypływem na brzeg wyszło Bractwo Przypływu, bo bledną rafy. Każdy lud ma własny powód, żeby szukać kryształów, i własne zdanie o tym, komu powinny przypaść.',
    ],
    stand: ['cards/art/greatAurochs.jpg', 'cards/art/ironThane.jpg', 'cards/art/tritonKing.jpg'],
    pan: ['scale(1.02)', 'scale(1.1)'],
    focus: 'center 25%',
  },
  {
    id: '06-drzewo-czeka',
    title: 'Drzewo czeka',
    text: [
      'Kryształy wciąż leżą w legowiskach strażników, a ścieżki do nich za każdym razem wiodą inaczej. Kto pierwszy dotrze z nimi do Drzewa, ten zdecyduje o losie krainy.',
      'Wybierz stronę. Drzewo czeka.',
    ],
    stand: ['ui/cover.jpg'],
    pan: ['scale(1.04) translate(3%, 0)', 'scale(1.04) translate(-3%, 0)'],
    focus: 'center 40%',
  },
];

/** The real slide art is composed for a 16:9 screen: only a gentle push-in, nothing cut off or turned. */
const ART_PAN: [string, string] = ['scale(1)', 'scale(1.06)'];

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
        const art = own ? [slideArt(s.id)] : s.stand;
        const pan = own ? ART_PAN : s.pan;
        // Only the current slide and its neighbours are in the page: cross-fades without loading everything at once.
        if (Math.abs(i - index) > 1) return null;
        return (
          <div key={s.id} className={`intro-slide ${i === index ? 'on' : ''}`} aria-hidden={i !== index}>
            <div className="intro-art" style={{ ['--pan-from' as string]: pan[0], ['--pan-to' as string]: pan[1] } as React.CSSProperties}>
              {art.map((src) => (
                <img
                  key={src}
                  src={asset(src)}
                  alt=""
                  style={{ objectPosition: own ? 'center top' : s.focus ?? 'center', objectFit: src.endsWith('.png') ? 'contain' : 'cover' }}
                  onError={own ? () => setMissing((m) => new Set(m).add(s.id)) : undefined}
                />
              ))}
            </div>
          </div>
        );
      })}
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
