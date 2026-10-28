// Points for a won game: map length × the measured difficulty of the variant for the side the humans
// played (simulated difficulty on the 1–10 scale of the rulebook, chapter 13). The biggest map on the
// hard level scores 30, every other variant proportionally less.
// The ratings are the rulebook tables: round(1 + 9 × (1 − Przymierze win rate)) from the balance
// simulations (docs/NOTATKI_DLA_AGENTA_PLANSZOWKI.md, section 7); update them after rebalancing.

import type { FactionId, MapSize } from './data';
import { DEFAULT_RULES, type Level, type SetupOptions } from './types';

/** A preset level, or 'custom' for a setup with single options switched on. */
export type LevelName = Level | 'custom';

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

type Table = Record<MapSize, Ratings>;

/** One map's Ratings as a row of numbers, in this order (null: not measured). */
type Row = [normal: number, kids: number, hard: number | null, optionBase: number, noAbilities: number, elixirs: number, reserve: number, duels: number, dice: number];

/** Ratings rows, one per map. */
function table(rows: Record<MapSize, Row>): Table {
  const out = {} as Table;
  for (const size of Object.keys(rows) as MapSize[]) {
    const [normal, kids, hard, optionBase, noAbilities, elixirs, reserve, duels, dice] = rows[size];
    out[size] = { normal, kids, hard: hard ?? undefined, optionBase, noAbilities, elixirs, reserve, duels, dice };
  }
  return out;
}

/**
 * Difficulty for Przymierze in coop, by the number of players. The level columns follow the unit balance
 * of 2026-10-22 (notes section 9); the single options were measured before it, against optionBase
 * (duels re-measured on 2026-10-28, notes section 13: the change against the normal level, added to optionBase).
 */
const COOP: Record<1 | 2, Table> = {
  // normal, kids, hard, optionBase, noAbilities, elixirs, reserve, duels, dice (see Row)
  1: table({
    short:    [5, 2, 7, 5, 7, 5, 5, 4, 5],
    medium:   [4, 2, 8, 5, 7, 6, 4, 4, 5],
    long:     [5, 3, 8, 5, 6, 6, 5, 4, 5],
    veryLong: [4, 3, 7, 5, 6, 7, 4, 6, 5],
  }),
  2: table({
    short:    [4, 3, 7, 4, 7, 5, 4, 2, 4],
    medium:   [5, 3, 7, 4, 6, 5, 5, 3, 5],
    long:     [5, 4, 6, 4, 5, 5, 4, 3, 4],
    veryLong: [4, 3, 5, 3, 4, 4, 3, 3, 3],
  }),
};

/** Difficulty for Przymierze in PvP (the Horde's is 11 minus it), 1 on 1 and 2 on 2. There is no hard level. */
const PVP: Record<1 | 2, Table> = {
  // normal, kids, hard, optionBase, noAbilities, elixirs, reserve, duels, dice (see Row)
  1: table({
    short:    [5, 2, null, 5, 5, 6, 5, 3, 5],
    medium:   [6, 2, null, 6, 5, 6, 5, 4, 6],
    long:     [6, 2, null, 6, 6, 6, 6, 5, 6],
    veryLong: [6, 3, null, 6, 6, 7, 6, 5, 6],
  }),
  2: table({
    short:    [5, 3, null, 5, 7, 5, 5, 2, 5],
    medium:   [6, 4, null, 5, 7, 6, 6, 3, 6],
    long:     [6, 4, null, 6, 7, 6, 6, 5, 5],
    veryLong: [6, 4, null, 6, 6, 6, 6, 6, 5],
  }),
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
export function difficultyRating(setup: SetupOptions, level: LevelName, side: FactionId): number {
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

/**
 * Arena: one battle (5–10 minutes) instead of a whole game with 3–5 battles, so a win against the
 * computer scores little — per hour of play no more than an ordinary game on an easy setting.
 */
export const ARENA_POINTS: Record<Level, number> = { kids: 1, normal: 2, hard: 3 };

export function pointsFor(setup: SetupOptions, level: LevelName, side: FactionId): number {
  if (setup.mode === 'arena') return ARENA_POINTS[level === 'custom' ? 'normal' : level];
  const raw = (MAX_POINTS * MAP_WEIGHT[setup.mapSize] * difficultyRating(setup, level, side)) / TOP_RATING;
  return Math.min(MAX_POINTS, Math.max(1, Math.round(raw)));
}

/** The preset level a setup matches, or 'custom' (the scoring reads its column). */
export function levelOf(setup: SetupOptions): LevelName {
  // Arena: the computer's strength (two people at one screen play "Normalny").
  if (setup.mode === 'arena') return setup.seats.some((s) => s.controller === 'bot') ? setup.botLevel ?? 'normal' : 'normal';
  const r = setup.rules;
  // Easy and normal: as many Horde heroes as players, reinforcements in the base; hard: neither.
  const automaton = r.minEvilHeroes === DEFAULT_RULES.minEvilHeroes && Boolean(r.hordeRespawn);
  const hardAutomaton = r.minEvilHeroes === 2 && !r.hordeRespawn;
  const base = r.treasures && !r.heroReplacement && r.initiativeTie === DEFAULT_RULES.initiativeTie;
  const easy = r.treasures && r.heroReplacement && r.ritual === false && r.initiativeTie === DEFAULT_RULES.initiativeTie;
  if (easy && automaton && setup.battleMode === 'board' && !r.abilities && !r.useDice && !r.extraEvilHero) return 'kids';
  if (base && setup.battleMode === 'arena' && r.abilities && !r.useDice) {
    if (r.extraEvilHero) return setup.mode === 'coop' && hardAutomaton ? 'hard' : 'custom';
    if (automaton) return 'normal';
  }
  return 'custom';
}
