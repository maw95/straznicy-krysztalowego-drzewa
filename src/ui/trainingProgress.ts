// The player's progress in the training: which trainings were finished (won), kept in this browser (localStorage). Nothing is locked by it.

const KEY = 'skd-training';
const WELCOME = 'skd-welcome';

export function readTrained(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function markTrained(id: string): void {
  const done = readTrained();
  if (done.includes(id)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...done, id]));
  } catch {
    /* private mode: the progress lives for this visit only */
  }
}

/** The welcome window ("play a short training?") is shown once, on the first launch. */
export const welcomeSeen = (): boolean => {
  try {
    return localStorage.getItem(WELCOME) === 'seen';
  } catch {
    return true;
  }
};
export const markWelcomeSeen = (): void => {
  try {
    localStorage.setItem(WELCOME, 'seen');
  } catch {
    /* nothing to remember */
  }
};
