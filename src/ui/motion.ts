// Smooth changes of the interface: screens of the menu cross-fade, sections unfold, the colours of a faction melt into another's.
// Done with the browser's View Transitions (one snapshot of the old screen fades into the new one) where they exist, and with CSS
// animations where they do not. Switched off by the system's "reduce motion" and by the option "Płynne przejścia".
import { flushSync } from 'react-dom';

const KEY = 'skd-motion';

const supported = () => typeof document !== 'undefined' && typeof (document as Document & { startViewTransition?: unknown }).startViewTransition === 'function';

export function motionEnabled(): boolean {
  try {
    if (localStorage.getItem(KEY) === 'off') return false;
  } catch {
    /* storage unavailable: motion stays on */
  }
  return !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

/** The option "Płynne przejścia" (the system's "reduce motion" switches motion off whatever this says). */
export function motionOption(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

/** Puts the state of the option on the page (`html.no-motion` stops the animations of this file). */
export function applyMotionClass() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('no-motion', !motionEnabled());
  document.documentElement.classList.toggle('no-vt', !supported());
}

export function setMotionOption(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* storage unavailable: the option lasts for this visit only */
  }
  applyMotionClass();
}

/**
 * Runs `change` (a state change of React, or a change of the page) as a cross-fade from the old look to the new one.
 * `ms` is the length of the fade (it is the default of the stylesheet when missing).
 */
export function withTransition(change: () => void, ms?: number) {
  if (!supported() || !motionEnabled()) return change();
  const root = document.documentElement;
  if (ms) root.style.setProperty('--vt-ms', `${ms}ms`);
  const t = (document as Document & { startViewTransition: (cb: () => void) => { finished: Promise<void> } }).startViewTransition(() => flushSync(change));
  const clear = () => root.style.removeProperty('--vt-ms');
  t.finished.then(clear, clear);
}

applyMotionClass();
