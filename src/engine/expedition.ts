// "Ekspedycja": a roguelike run made of the 6 on 6 arena matches. A run is a row of STAGES; the person has one life (the first lost battle ends the run), the
// computer's side grows stronger stage by stage, and after each won battle the person picks one of three RELICS that stay for the rest of the run. Everything
// here is plain data and pure functions: `expeditionSetup` turns a stage into the set-up of an ordinary arena game, marked with `setup.expedition`, and the
// engine plays it as any other (the relics are `rules.arenaBoost`, the computer's growth is `rules.arenaHandicap`). The run itself (which relics, how far) is
// kept by the screen (src/ui/expeditionRun.ts); the same seed always gives the same opponents and the same offers, which is what the daily run relies on.

import { FACTION_HEROES } from './data';
import { Rng } from './rng';
import { arenaSetup, type ArenaHandicap, type SetupOptions } from './types';

/** What the person's side gets on top in the 6 on 6 arena (the mirror of `ArenaHandicap`, which the computer's side gets at the high difficulties). */
export interface ArenaBoost {
  /** More mana for the hero. */
  mana: number;
  /** More spells for the hero (taken as the best of the pool the hero did not choose). */
  spells: number;
  /** More artifacts for the hero (of other slots than the ones worn). */
  gear: number;
}

export const NO_BOOST: ArenaBoost = { mana: 0, spells: 0, gear: 0 };

export interface Relic {
  id: string;
  name: string;
  text: string;
  boost: Partial<ArenaBoost>;
}

export const RELICS: Relic[] = [
  { id: 'manaCrystal', name: 'Kryształ Many', text: 'Bohater ma o 1 punkt many więcej.', boost: { mana: 1 } },
  { id: 'manaSpring', name: 'Źródło Many', text: 'Bohater ma o 2 punkty many więcej.', boost: { mana: 2 } },
  { id: 'spareBook', name: 'Zapasowa Księga', text: 'Bohater zna jeden dodatkowy czar.', boost: { spells: 1 } },
  { id: 'masterChest', name: 'Skrzynia Mistrza', text: 'Bohater zakłada jeden dodatkowy artefakt.', boost: { gear: 1 } },
  { id: 'sageSatchel', name: 'Torba Mędrca', text: 'Bohater ma o 1 punkt many więcej i zna jeden dodatkowy czar.', boost: { mana: 1, spells: 1 } },
  { id: 'wanderersKit', name: 'Rynsztunek Wędrowca', text: 'Jeden dodatkowy artefakt i o 1 punkt many więcej.', boost: { gear: 1, mana: 1 } },
];

export const RELIC_BY_ID: Record<string, Relic> = Object.fromEntries(RELICS.map((r) => [r.id, r]));

/** The boosts of all the relics held, added up. */
export function boostOf(relics: string[]): ArenaBoost {
  const sum = { ...NO_BOOST };
  for (const id of relics) {
    const b = RELIC_BY_ID[id]?.boost;
    if (b) {
      sum.mana += b.mana ?? 0;
      sum.spells += b.spells ?? 0;
      sum.gear += b.gear ?? 0;
    }
  }
  return sum;
}

/** How many battles a run has: the last one is the boss fight. */
export const STAGES = 8;

export interface Stage {
  /** 0-based. */
  index: number;
  /** The computer's difficulty in the arena's own terms (flags: who counts as "hard" for the bot's play). */
  level: 'kids' | 'normal' | 'hard' | 'veryHard';
  /** What the computer's side gets on top, growing with the stage. */
  handicap: ArenaHandicap;
  name: string;
  boss: boolean;
}

const STAGE_NAMES = ['Brama Lasu', 'Rozstaje', 'Zgliszcza', 'Kamienny Bród', 'Bagna Cienia', 'Przełęcz Wilków', 'Czarna Fosa', 'Tron Hordy'];
const LEVELS: Stage['level'][] = ['kids', 'normal', 'normal', 'hard', 'hard', 'hard', 'veryHard', 'veryHard'];

/** The computer's growth: mana every second stage, a spell and an artifact from the middle of the run on, the most at the boss. */
export function stageOf(index: number): Stage {
  const i = Math.max(0, Math.min(STAGES - 1, index));
  const handicap: ArenaHandicap = { mana: Math.floor(i / 2), spells: i >= 4 ? 1 : 0, gear: i >= 3 ? Math.floor((i - 1) / 2) : 0, playerLess: 0 };
  return { index: i, level: LEVELS[i], handicap, name: STAGE_NAMES[i], boss: i === STAGES - 1 };
}

/** The run as the screen keeps it. */
export interface Run {
  /** The seed of the run: opponents and offers follow from it. */
  seed: number;
  hero: string;
  /** Won stages so far (= the index of the stage to play). */
  cleared: number;
  relics: string[];
  /** Set when a battle was lost: the run is over. */
  lost?: boolean;
  /** A run of the day (the same seed for everybody on that date). */
  daily?: string;
}

export const newRun = (seed: number, hero: string, daily?: string): Run => ({ seed, hero, cleared: 0, relics: [], ...(daily ? { daily } : {}) });

/** The computer's hero at a stage (the boss is always the Black Dragon). */
export function opponentOf(run: Run, stage: number): string {
  if (stage === STAGES - 1) return 'blackDragon';
  const pool = FACTION_HEROES.horde.filter((h) => h !== 'blackDragon');
  return pool[Math.floor(new Rng(run.seed * 31 + stage).next() * pool.length)];
}

/** Three different relics to choose from after a stage (not the ones that would only repeat a held one more than twice). */
export function relicOffer(run: Run, stage: number): Relic[] {
  const rng = new Rng(run.seed * 17 + stage * 101 + 7);
  const held = (id: string) => run.relics.filter((r) => r === id).length;
  const pool = RELICS.filter((r) => held(r.id) < 2);
  return rng.shuffle(pool).slice(0, 3);
}

/** The set-up of the arena game of the run's current stage. */
export function expeditionSetup(run: Run, name = 'Gracz'): SetupOptions {
  const stage = stageOf(run.cleared);
  const base = arenaSetup(
    [
      { name, faction: 'dawn', controller: 'human', heroId: run.hero },
      { name: 'Komputer', faction: 'horde', controller: 'bot', heroId: opponentOf(run, stage.index) },
    ],
    run.seed * 13 + stage.index,
    stage.level === 'veryHard' ? 'veryHard' : stage.level,
    6,
  );
  const boost = boostOf(run.relics);
  return {
    ...base,
    rules: {
      ...base.rules,
      arenaHandicap: stage.handicap,
      ...(boost.mana || boost.spells || boost.gear ? { arenaBoost: boost } : {}),
    },
    expedition: { stage: stage.index, seed: run.seed, relics: run.relics, ...(run.daily ? { daily: run.daily } : {}) },
  };
}

/** The run read back from the set-up of one of its games (to continue it after a win). */
export function runOf(setup: SetupOptions): Run | null {
  const e = setup.expedition;
  if (!e) return null;
  const hero = setup.seats.find((s) => s.faction === 'dawn')?.heroId;
  if (!hero) return null;
  return { seed: e.seed, hero, cleared: e.stage, relics: e.relics, ...(e.daily ? { daily: e.daily } : {}) };
}

/** Points of a run (for the daily ranking and the profile): 100 per cleared stage, a bonus for the whole run. */
export const runScore = (cleared: number): number => cleared * 100 + (cleared >= STAGES ? 200 : 0);

/** A date as the seed of that day's run: the same for everybody (YYYY-MM-DD, in UTC). */
export function dailySeed(day: string): number {
  let h = 2166136261;
  for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return (h % 900000) + 1000;
}

export const today = (now = new Date()): string => now.toISOString().slice(0, 10);

/** Heroes the person can start a run with: two from the start, the third after a run that cleared four stages, the Easter egg duck after a whole run. */
export function unlockedHeroes(bestCleared: number, finished: number): string[] {
  return ['goldDragon', 'unicornKing', ...(bestCleared >= 4 ? ['ancientBear'] : []), ...(finished > 0 ? ['braveDuck'] : [])];
}
