// Saved games are the setup plus the action log; replaying them through the
// engine rebuilds the exact state (the engine is deterministic).

import { applyAction, createGame } from '../engine/game';
import type { Action, GameState, SetupOptions } from '../engine/types';

export interface SaveFile {
  setup: SetupOptions;
  actions: Action[];
}

const KEY = 'skd-autosave';

export function replay(save: SaveFile): GameState {
  let s = createGame(save.setup);
  for (const a of save.actions) s = applyAction(s, a);
  return s;
}

export function writeAutosave(save: SaveFile | null) {
  try {
    if (save) localStorage.setItem(KEY, JSON.stringify(save));
    else localStorage.removeItem(KEY);
  } catch {
    // storage unavailable: the game just isn't kept across reloads
  }
}

export function readAutosave(): SaveFile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseSave(raw) : null;
  } catch {
    return null;
  }
}

/** Validates the shape of a save before replaying it. */
export function parseSave(text: string): SaveFile {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || !data.setup || !Array.isArray(data.actions)) throw new Error('To nie jest plik zapisu gry.');
  if (!Array.isArray(data.setup.seats) || typeof data.setup.seed !== 'number') throw new Error('Plik zapisu jest uszkodzony.');
  return { setup: data.setup, actions: data.actions };
}

export function describeSave(save: SaveFile): string {
  try {
    const s = replay(save);
    const heroes = save.setup.seats.map((x) => x.name).join(', ');
    return `${save.setup.mode === 'coop' ? 'Kooperacja' : 'Rywalizacja'} · runda ${s.round} · ${heroes}`;
  } catch {
    return 'Zapis nie daje się odtworzyć';
  }
}
