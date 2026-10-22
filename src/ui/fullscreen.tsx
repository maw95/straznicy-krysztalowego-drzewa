// Full screen like the browser's F11. Browsers allow it only from a click or a key press, so
// "on start" means: on the first click or key press after the game loads.

import { useEffect, useState } from 'react';

const KEY = 'skd-fullscreen-auto';

export const fullscreenSupported = () => typeof document !== 'undefined' && typeof document.documentElement.requestFullscreen === 'function' && document.fullscreenEnabled !== false;
export const isFullscreen = () => typeof document !== 'undefined' && Boolean(document.fullscreenElement);

export function enterFullscreen() {
  if (!fullscreenSupported() || isFullscreen()) return;
  // Refused without a user gesture or by the page's host: the game simply stays in the window.
  document.documentElement.requestFullscreen().catch(() => {});
}

export function toggleFullscreen() {
  if (isFullscreen()) document.exitFullscreen?.().catch(() => {});
  else enterFullscreen();
}

export function autoFullscreen(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setAutoFullscreen(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // storage unavailable: the setting lasts for this visit only
  }
}

/** Re-renders when the page enters or leaves full screen (also through Esc or F11). */
export function useFullscreen(): boolean {
  const [on, setOn] = useState(isFullscreen);
  useEffect(() => {
    const update = () => setOn(isFullscreen());
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  return on;
}

/** Enters full screen on the first click or key press of the visit, when the player wants that. */
export function useAutoFullscreen(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !autoFullscreen() || !fullscreenSupported()) return;
    const go = (e: Event) => {
      // Esc cannot start full screen (it is the browser's way out of it).
      if (e instanceof KeyboardEvent && e.key === 'Escape') return;
      // Clicking the "full screen on start" switch (or this button) is a choice of its own.
      if (e.target instanceof Element && e.target.closest('[data-fullscreen-control]')) return;
      enterFullscreen();
      window.removeEventListener('pointerup', go);
      window.removeEventListener('keydown', go);
    };
    window.addEventListener('pointerup', go);
    window.addEventListener('keydown', go);
    return () => {
      window.removeEventListener('pointerup', go);
      window.removeEventListener('keydown', go);
    };
  }, [enabled]);
}

/** Corner button next to the music one: four corners pointing out (enter) or in (leave). */
export function FullscreenButton() {
  const on = useFullscreen();
  if (!fullscreenSupported()) return null;
  const label = on ? 'Zamknij pełny ekran' : 'Pełny ekran';
  const out = 'M2 6V2h4 M10 2h4v4 M14 10v4h-4 M6 14H2v-4';
  const inward = 'M6 2v4H2 M10 2v4h4 M14 10h-4v4 M2 10h4v4';
  return (
    <button className="btn plate parch fullscreen-btn" data-fullscreen-control title={label} aria-label={label} onClick={toggleFullscreen}>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path d={on ? inward : out} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
