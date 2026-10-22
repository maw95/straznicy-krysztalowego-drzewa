// Points for a won game: map length × the measured difficulty of the variant for the side the humans
// played (simulated difficulty on the 1–10 scale of the rulebook, chapter 13). The biggest map on the
// hard level scores 30, every other variant proportionally less.
// The ratings are the rulebook tables: round(1 + 9 × (1 − Przymierze win rate)) from the balance
// simulations (docs/NOTATKI_DLA_AGENTA_PLANSZOWKI.md, section 7); update them after rebalancing.

import type { FactionId, MapSize } from '../engine/data';
import type { SetupOptions } from '../engine/types';

/** One map's ratings: the levels, then the full game with one custom option switched on. */
interface Ratings {
  normal: number;
  kids: number;
  hard?: number;
  /** The normal level's rating when the single options were measured: their effect is counted from it. */
  optionBase: number;
  noAbilities: number;
  elixirs: number;
  reserve: number;
  duels: number;
  dice: number;
}

const r = (normal: number, kids: number, hard: number | undefined, optionBase: number, noAbilities: number, elixirs: number, reserve: number, duels: number, dice: number): Ratings => ({ normal, kids, hard, optionBase, noAbilities, elixirs, reserve, duels, dice });
type Table = Record<MapSize, Ratings>;

/**
 * Difficulty for Przymierze in coop, by the number of players. The level columns follow the Horde
 * reinforcement rule (2026-10-22); the single options were measured before it, against optionBase.
 */
const COOP: Record<1 | 2, Table> = {
  1: { short: r(4, 2, 8, 5, 7, 5, 5, 6, 5), medium: r(4, 2, 8, 5, 7, 6, 4, 6, 5), long: r(5, 3, 8, 5, 6, 6, 5, 7, 5), veryLong: r(4, 3, 7, 5, 6, 7, 4, 7, 5) },
  2: { short: r(5, 3, 7, 4, 7, 5, 4, 4, 4), medium: r(5, 3, 7, 4, 6, 5, 5, 4, 5), long: r(5, 4, 7, 4, 5, 5, 4, 4, 4), veryLong: r(4, 3, 5, 3, 4, 4, 3, 4, 3) },
};

/** Difficulty for Przymierze in PvP (the Horde's is 11 minus it), 1 on 1 and 2 on 2. */
const PVP: Record<1 | 2, Table> = {
  1: { short: r(5, 2, undefined, 5, 5, 6, 5, 4, 5), medium: r(6, 2, undefined, 6, 5, 6, 5, 5, 6), long: r(6, 2, undefined, 6, 6, 6, 6, 5, 6), veryLong: r(6, 3, undefined, 6, 6, 7, 6, 6, 6) },
  2: { short: r(5, 3, undefined, 5, 7, 5, 5, 4, 5), medium: r(5, 3, undefined, 5, 7, 6, 6, 5, 6), long: r(6, 4, undefined, 6, 7, 6, 6, 6, 5), veryLong: r(6, 5, undefined, 6, 6, 6, 6, 7, 5) },
};

/** Longer maps take longer to win. */
export const MAP_WEIGHT: Record<MapSize, number> = { short: 0.4, medium: 0.6, long: 0.8, veryLong: 1 };
export const MAX_POINTS = 30;
/** The rating that scores MAX_POINTS on the biggest map: the hard level, one player. */
const TOP_RATING = COOP[1].veryLong.hard!;

/**
 * Measured difficulty (1–10) of a setup for one side. A preset level reads its column; a custom setup
 * starts from the full game and adds what each switched-on option changes on its own.
 */
export function difficultyRating(setup: SetupOptions, level: 'kids' | 'normal' | 'hard' | 'custom', side: FactionId): number {
  const pvp = setup.mode === 'pvp';
  const perSide = Math.max(...(['dawn', 'horde'] as const).map((f) => setup.seats.filter((s) => s.faction === f).length));
  const t = (pvp ? PVP : COOP)[perSide >= 2 ? 2 : 1][setup.mapSize];
  let dawn: number;
  if (level !== 'custom') dawn = t[level] ?? t.normal;
  else {
    const ru = setup.rules;
    const on: Array<[boolean, number]> = [
      [!ru.abilities, t.noAbilities],
      [!ru.treasures, t.elixirs],
      [ru.heroReplacement, t.reserve],
      [setup.battleMode === 'board', t.duels],
      [ru.useDice, t.dice],
      // Measured only together with the Horde's start treasures (the hard level).
      [!pvp && ru.extraEvilHero, (t.hard ?? t.normal) - t.normal + t.optionBase],
    ];
    dawn = on.reduce((sum, [active, rating]) => sum + (active ? rating - t.optionBase : 0), t.normal);
  }
  dawn = Math.min(10, Math.max(1, dawn));
  return side === 'dawn' ? dawn : 11 - dawn;
}

export function pointsFor(setup: SetupOptions, level: 'kids' | 'normal' | 'hard' | 'custom', side: FactionId): number {
  const raw = (MAX_POINTS * MAP_WEIGHT[setup.mapSize] * difficultyRating(setup, level, side)) / TOP_RATING;
  return Math.min(MAX_POINTS, Math.max(1, Math.round(raw)));
}
