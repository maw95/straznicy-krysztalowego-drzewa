// Tester journal: every game played in this browser (setup, actions, bug reports, result),
// kept in localStorage. "INFO DLA TESTERÓW" turns it into one file the tester sends to the designer;
// scripts/testers.ts reads such files back (live-player win rates, feedback, bug reports).

import { DEFAULT_RULES, type GameState, type SetupOptions } from '../engine/types';
import type { SaveFile } from './saves';

const KEY = 'skd-journal';

export type LevelName = 'kids' | 'normal' | 'hard' | 'custom';

export interface JournalGame {
  /** Same setup = same game (the engine is deterministic), so the setup identifies it. */
  id: string;
  startedAt: string;
  updatedAt: string;
  level: LevelName;
  save: SaveFile;
  result: { winner: string; reason: string; round: number } | null;
}

export interface Journal {
  testerId: string;
  games: JournalGame[];
}

export interface TesterExport {
  kind: 'skd-tester-export';
  exportedAt: string;
  testerId: string;
  name: string;
  feedback: string;
  userAgent: string;
  stats: JournalStats;
  games: JournalGame[];
}

export function levelOf(setup: SetupOptions): LevelName {
  const r = setup.rules;
  const base = r.treasures && !r.heroReplacement && r.initiativeTie === DEFAULT_RULES.initiativeTie;
  const easy = r.treasures && r.heroReplacement && r.ritual === false && r.initiativeTie === DEFAULT_RULES.initiativeTie;
  if (easy && setup.battleMode === 'board' && !r.abilities && !r.useDice && !r.extraEvilHero) return 'kids';
  if (base && setup.battleMode === 'arena' && r.abilities && !r.useDice) return r.extraEvilHero ? (setup.mode === 'coop' ? 'hard' : 'custom') : 'normal';
  return 'custom';
}

export const LEVEL_NAMES: Record<LevelName, string> = { kids: 'Łatwy', normal: 'Normalny', hard: 'Trudny', custom: 'Własny' };

const gameId = (setup: SetupOptions) => `${setup.seed}:${setup.mode}:${setup.mapSize}:${setup.seats.map((s) => `${s.faction}/${s.heroId}/${s.controller}`).join(',')}`;

export function readJournal(): Journal {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && typeof data.testerId === 'string' && Array.isArray(data.games)) return data;
  } catch {
    // unreadable or blocked storage: start a fresh journal
  }
  return { testerId: Math.random().toString(36).slice(2, 10), games: [] };
}

function writeJournal(j: Journal) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      localStorage.setItem(KEY, JSON.stringify(j));
      return;
    } catch {
      // Storage full: drop the move list of the oldest finished game (its result and reports stay).
      const old = j.games.find((g) => g.result && g.save.actions.length);
      if (!old) return;
      old.save = { ...old.save, actions: [] };
    }
  }
}

/** Records the current state of a game (called after every action and every bug report). */
export function recordGame(save: SaveFile, game: GameState) {
  // Test hooks (?steps=…) fast-forward bot games; they are not real play.
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('steps')) return;
  const j = readJournal();
  const id = gameId(save.setup);
  const now = new Date().toISOString();
  let entry = j.games.find((g) => g.id === id);
  if (!entry) {
    entry = { id, startedAt: now, updatedAt: now, level: levelOf(save.setup), save, result: null };
    j.games.push(entry);
  }
  entry.updatedAt = now;
  entry.save = save;
  entry.result = game.phase === 'over' ? { winner: game.winner ?? 'none', reason: game.endReason ?? '', round: game.round } : null;
  writeJournal(j);
}

export interface JournalStats {
  played: number;
  finished: number;
  coop: { won: number; lost: number };
  pvp: { dawn: number; horde: number };
  reports: number;
}

export function journalStats(j: Journal = readJournal()): JournalStats {
  const s: JournalStats = { played: j.games.length, finished: 0, coop: { won: 0, lost: 0 }, pvp: { dawn: 0, horde: 0 }, reports: 0 };
  for (const g of j.games) {
    s.reports += g.save.reports?.length ?? 0;
    if (!g.result) continue;
    s.finished++;
    if (g.save.setup.mode === 'coop') {
      if (g.result.winner === 'dawn') s.coop.won++;
      else s.coop.lost++;
    } else if (g.result.winner === 'dawn') s.pvp.dawn++;
    else s.pvp.horde++;
  }
  return s;
}

export function buildExport(name: string, feedback: string): TesterExport {
  const j = readJournal();
  return {
    kind: 'skd-tester-export',
    exportedAt: new Date().toISOString(),
    testerId: j.testerId,
    name: name.trim(),
    feedback: feedback.trim(),
    userAgent: navigator.userAgent,
    stats: journalStats(j),
    games: j.games,
  };
}
