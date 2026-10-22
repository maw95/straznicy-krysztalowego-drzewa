// Title screen at every launch: the logo over the cover art and one START button. Browsers allow
// full screen and music only after a click or a key press, so START is that first gesture.
// Once per browser session (a reload in the same tab goes straight to the menu).

import { useEffect } from 'react';
import { asset } from './common';
import { autoFullscreen, enterFullscreen } from './fullscreen';
import { firstTrack, music } from './music';
import { introSeen, SLIDES } from './Intro';

const KEY = 'skd-title-done';

export function titlePending(): boolean {
  try {
    return sessionStorage.getItem(KEY) !== 'done';
  } catch {
    return true;
  }
}

function markDone() {
  try {
    sessionStorage.setItem(KEY, 'done');
  } catch {
    // storage unavailable: the title shows again on the next load
  }
}

/**
 * While the title is on screen, fetch what comes right after START: the menu music and, on the first
 * visit, the intro art (first slide first). Later loads come from the browser cache. A file that fails
 * to load just loads again when it is needed.
 */
function preloadNext() {
  const images = introSeen() ? [] : SLIDES.map((s) => `intro/${s.id}.jpg`);
  for (const src of images) new Image().src = asset(src);
  if (typeof fetch === 'function') fetch(asset(firstTrack('menu'))).catch(() => {});
}

export function TitleScreen({ onStart }: { onStart: () => void }) {
  useEffect(preloadNext, []);

  const start = () => {
    if (autoFullscreen()) enterFullscreen();
    music.unlock();
    markDone();
    onStart();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A focused button already starts on Enter and Space.
      if (e.target instanceof HTMLButtonElement) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        start();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="title-screen" role="dialog" aria-label="Strażnicy Kryształowego Drzewa">
      {/* The box cover carries its own logo at the top, which a tall screen would show: there, the night Tree from the intro. */}
      <picture>
        <source media="(max-aspect-ratio: 1/1)" srcSet={asset('intro/01-drzewo.jpg')} />
        <img className="ken-burns title-art" src={asset('ui/cover.jpg')} alt="" />
      </picture>
      <div className="title-shade" aria-hidden="true" />
      {Array.from({ length: 26 }, (_, i) => (
        <span
          key={i}
          className="firefly"
          aria-hidden="true"
          style={{ left: `${(i * 41) % 100}%`, top: `${12 + ((i * 29) % 80)}%`, ['--fx' as string]: `${((i * 11) % 80) - 40}px`, ['--fy' as string]: `${((i * 23) % 60) - 40}px`, ['--fd' as string]: `${7 + (i % 5) * 1.5}s`, ['--fdl' as string]: `${-(i * 0.8)}s` } as React.CSSProperties}
        />
      ))}
      <div className="title-body">
        <h1>
          <img className="logo-glow" src={asset('ui/logo.png')} alt="Strażnicy Kryształowego Drzewa" />
        </h1>
        <p className="title-motto">Wybierz stronę. Drzewo czeka.</p>
        <button className="btn prim title-start" onClick={start} autoFocus>
          Start
        </button>
        <p className="title-sub">Gra przygodowa dla 1–4 graczy od 5 lat · z muzyką, najlepiej na pełnym ekranie</p>
      </div>
      <div className="title-version">Wersja {__APP_VERSION__}</div>
    </div>
  );
}
