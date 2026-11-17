// The player's progress in the story campaign: which scenarios are won, kept in this browser (localStorage). A scenario opens when the one before it is won.

import type { Campaign, Scenario } from '../engine/campaign';

const KEY = 'skd-campaign';

export function readDone(campaignId: string): string[] {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, unknown>;
    const done = all[campaignId];
    return Array.isArray(done) ? done.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Remembers a won scenario (once). */
export function markDone(campaignId: string, scenarioId: string): void {
  const done = readDone(campaignId);
  if (done.includes(scenarioId)) return;
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, unknown>;
    localStorage.setItem(KEY, JSON.stringify({ ...all, [campaignId]: [...done, scenarioId] }));
  } catch {
    /* private mode: the progress lives for this visit only */
  }
}

export function resetProgress(campaignId: string): void {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, unknown>;
    delete all[campaignId];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* nothing to reset */
  }
}

/** A scenario can be played when it is the first or the one before it is won. */
export const isOpen = (campaign: Campaign, scenario: Scenario, done: string[]): boolean => {
  const i = campaign.scenarios.indexOf(scenario);
  return i === 0 || done.includes(campaign.scenarios[i - 1].id);
};
