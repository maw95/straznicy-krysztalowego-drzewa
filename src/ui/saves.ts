// Saved games are the setup plus the action log; replaying them through the
// engine rebuilds the exact state (the engine is deterministic).

import { applyAction, createGame } from '../engine/game';
import type { Action, GameState, SetupOptions } from '../engine/types';

export interface SaveFile {
  setup: SetupOptions;
  actions: Action[];
  /** Bug reports written during this game (they do not affect the replay). */
  reports?: BugReport[];
}

/** A problem described by a player, pinned to the moment of the game it happened in. */
export interface BugReport {
  createdAt: string;
  /** Number of actions played when the report was written: replay this many to see the moment. */
  actionIndex: number;
  round: number;
  /** 'adventure', 'battle:fight', 'battle:deploy', 'over'… */
  screen: string;
  text: string;
  /** Last log lines the player could see. */
  recentLog: string[];
  viewport: string;
  userAgent: string;
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
  // Saves from before the rule switches (abilities/treasures) replay differently: refuse them clearly.
  if (typeof data.setup.rules?.abilities !== 'boolean') throw new Error('Zapis pochodzi ze starszej wersji gry i nie da się go wczytać.');
  return { setup: data.setup, actions: data.actions, reports: Array.isArray(data.reports) ? data.reports : [] };
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

/**
 * Sends a report to the development server, which writes it to bug-reports/ in the project.
 * Returns the file name, or null when no server takes reports (e.g. a static build).
 */
export async function sendReport(save: SaveFile): Promise<string | null> {
  try {
    const res = await fetch('./__bug-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(save) });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.file === 'string' ? data.file : null;
  } catch {
    return null;
  }
}
