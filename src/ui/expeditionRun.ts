// The Expedition's run and profile, kept in this browser (localStorage): the run in progress (so that a closed tab does not lose it), and the profile that
// lasts between runs (best result, runs finished, the heroes unlocked by them, the best of each day's run).

import { STAGES, today, unlockedHeroes, type Run } from '../engine/expedition';

const RUN_KEY = 'skd-expedition-run';
const PROFILE_KEY = 'skd-expedition-profile';

export interface Profile {
  runs: number;
  /** Runs that cleared every stage. */
  finished: number;
  /** The most stages cleared in one run. */
  bestCleared: number;
  /** Day (YYYY-MM-DD) -> stages cleared in that day's run (the best of the attempts). */
  daily: Record<string, number>;
}

const EMPTY: Profile = { runs: 0, finished: 0, bestCleared: 0, daily: {} };

const read = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const write = (key: string, value: unknown) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode: the run lives for this visit only */
  }
};

export function readProfile(): Profile {
  const p = read<Partial<Profile>>(PROFILE_KEY) ?? {};
  return { runs: Number(p.runs) || 0, finished: Number(p.finished) || 0, bestCleared: Number(p.bestCleared) || 0, daily: p.daily && typeof p.daily === 'object' ? p.daily : {} };
}

export const readRun = (): Run | null => {
  const r = read<Run>(RUN_KEY);
  return r && typeof r.seed === 'number' && typeof r.hero === 'string' && Array.isArray(r.relics) && typeof r.cleared === 'number' ? r : null;
};

export const saveRun = (run: Run | null): void => write(RUN_KEY, run);

/** A run ended (lost, or all stages cleared): the profile takes its result, the run in progress is dropped. */
export function finishRun(run: Run): Profile {
  const p = readProfile();
  const next: Profile = {
    runs: p.runs + 1,
    finished: p.finished + (run.cleared >= STAGES ? 1 : 0),
    bestCleared: Math.max(p.bestCleared, run.cleared),
    daily: run.daily ? { ...p.daily, [run.daily]: Math.max(p.daily[run.daily] ?? 0, run.cleared) } : p.daily,
  };
  write(PROFILE_KEY, next);
  saveRun(null);
  return next;
}

export const heroesOf = (p: Profile): string[] => unlockedHeroes(p.bestCleared, p.finished);
export const dailyDone = (p: Profile, day = today()): number | null => (day in p.daily ? p.daily[day] : null);
export { EMPTY as EMPTY_PROFILE };
