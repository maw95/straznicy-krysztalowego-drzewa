// The language of the interface: Polish (the language the game is written in) or English. The first choice comes from the browser (and so from the
// system in a PWA or a desktop shell such as Electron or Tauri, whose web view reports the system language); the player's own choice, made with the
// flags or in the options, is kept in localStorage and wins from then on.

import { useSyncExternalStore } from 'react';

export type Lang = 'pl' | 'en';
export const LANGS: Lang[] = ['pl', 'en'];
const KEY = 'skd-lang';

/** The language the browser asks for: Polish for a Polish browser, English for every other (English is the only other language so far). */
export function browserLang(languages: readonly string[] = typeof navigator !== 'undefined' ? navigator.languages?.length ? navigator.languages : [navigator.language] : []): Lang {
  const first = (languages[0] ?? '').toLowerCase();
  return first.startsWith('pl') ? 'pl' : 'en';
}

function readChoice(): Lang | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'pl' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

/** ?lang=en (or pl) in the address: for checks and screenshots; it is not remembered. */
const fromUrl = (): Lang | null => {
  try {
    const v = new URLSearchParams(window.location.search).get('lang');
    return v === 'pl' || v === 'en' ? v : null;
  } catch {
    return null;
  }
};

let current: Lang = fromUrl() ?? readChoice() ?? browserLang();
const listeners = new Set<() => void>();
const apply = () => {
  if (typeof document !== 'undefined') document.documentElement.lang = current;
};
apply();

export const getLang = (): Lang => current;

/** Switches the language (and remembers it). */
export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* private mode: only for this visit */
  }
  apply();
  for (const f of listeners) f();
}

export const subscribeLang = (f: () => void): (() => void) => {
  listeners.add(f);
  return () => listeners.delete(f);
};

/** The current language and a way to change it, for a component. */
export function useLang(): [Lang, (lang: Lang) => void] {
  const lang = useSyncExternalStore(subscribeLang, getLang, getLang);
  return [lang, setLang];
}
