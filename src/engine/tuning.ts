// Digital ruleset: balance levers on top of the level presets (types.ts LEVEL_RULES), so the board game's levels stay as printed.
// createGame applies the matching entries to the rules of the game (the setup keeps the preset: ranking and saves read it as before).
// Tuned with `SIM_DIGITAL=1 [SIM_OBJECTIVE=control] make sim-tabele` (see docs/ZASADY_CYFROWE.md for the targets and results).

import { levelOf } from './scoring';
import { isDigital, type MapShape, type RulesConfig, type SetupOptions } from './types';
import type { MapSize } from './data';
import { AUTO_TUNING } from './tuningAuto';

export interface DigitalTune {
  /** Where it applies; a missing field matches everything. */
  objective?: 'crystals' | 'control' | 'survival' | 'boss' | 'artifact' | 'conquest' | 'relic';
  level?: 'zero' | 'kids' | 'normal' | 'hard';
  mode?: 'coop' | 'pvp';
  /** Przymierza seats (players on the good side). */
  players?: number;
  maps?: MapSize[];
  /** Hero growth switched on (missing = any). */
  growth?: boolean;
  /** A hand-made map (shape 'custom'): its id; missing = every one. */
  customMapId?: string;
  /** Map shape (missing = any; the triangle is what a setup without `mapShape` plays). */
  shape?: MapShape;
  /** Level 3 "Osada" switched on (missing = any). */
  kingdom?: boolean;
  /** Level 5 "Królestwo" switched on (missing = any). */
  realm?: boolean;
  /** Level 6 "Imperium" switched on (missing = any). */
  empire?: boolean;
  /** Changes to the rules; applied in order, later entries win. */
  rules: Partial<RulesConfig>;
}

/**
 * The levers (numbers from simulations, 200+ games per cell; targets: Easy 70-90 percent, Normal 45-65, Hard 30-50 wins of the Przymierza).
 * "Treasures" = random treasure cards the Horde holds from the start (hordeStartTreasures) or the Przymierza (dawnStartTreasures).
 */
export const DIGITAL_TUNING: DigitalTune[] = [
  // --- Hero growth (first, so the cells below keep their own numbers): the Przymierza meet the guardians and so take most of the artifacts; the Horde start with treasures.
  { growth: true, objective: 'crystals', rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 2 } } },
  // --- Goal 'crystals' ---
  // Easy: a dead hero is replaced in the board duels, which made 1-hero games on medium maps too easy and 1 against 1 on short ones too.
  { objective: 'crystals', level: 'zero', mode: 'coop', players: 1, maps: ['medium'], rules: { heroReplacement: false } },
  { objective: 'crystals', level: 'zero', mode: 'pvp', players: 1, maps: ['short', 'medium'], rules: { heroReplacement: false } },
  { objective: 'crystals', level: 'zero', mode: 'pvp', players: 2, maps: ['long'], rules: { heroMovePoints: 4, roundLimitBonus: 6 } },
  { objective: 'crystals', level: 'zero', mode: 'pvp', players: 2, maps: ['veryLong'], rules: { heroMovePoints: 4, roundLimitBonus: 6, dawnStartTreasures: { resurrections: 0, others: 0, random: 3 } } },
  { growth: true, objective: 'crystals', level: 'zero', mode: 'pvp', players: 1, maps: ['veryLong'], rules: { heroMovePoints: 4, roundLimitBonus: 6 } },
  { growth: true, objective: 'crystals', level: 'zero', mode: 'coop', players: 1, maps: ['short'], rules: { heroReplacement: false } },
  // Normal and Hard, two players: the second hero made the largest maps too easy.
  { objective: 'crystals', level: 'normal', mode: 'coop', players: 2, maps: ['short'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 1 } } },
  { objective: 'crystals', level: 'normal', mode: 'coop', players: 2, maps: ['veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 2 } } },
  { objective: 'crystals', level: 'hard', mode: 'coop', players: 2, maps: ['veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 4 } } },
  { objective: 'crystals', level: 'normal', mode: 'pvp', players: 2, maps: ['medium'], rules: { dawnStartTreasures: { resurrections: 0, others: 0, random: 1 } } },
  { objective: 'crystals', level: 'normal', mode: 'pvp', players: 1, maps: ['long'], rules: { dawnStartTreasures: { resurrections: 0, others: 0, random: 1 } } },
  { objective: 'crystals', level: 'normal', mode: 'pvp', players: 2, maps: ['long'], rules: { dawnStartTreasures: { resurrections: 0, others: 0, random: 1 } } },
  // --- Goal 'control' ---
  { objective: 'control', level: 'hard', mode: 'coop', players: 1, rules: { extraEvilHero: false } },
  { objective: 'control', level: 'hard', mode: 'coop', players: 1, maps: ['short', 'medium'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 1 } } },
  { objective: 'control', level: 'normal', mode: 'coop', players: 2, rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 1 } } },
  { objective: 'control', level: 'normal', mode: 'coop', players: 2, maps: ['veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 3 } } },
  { objective: 'control', level: 'hard', mode: 'coop', players: 2, maps: ['veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 4 } } },
  { objective: 'control', level: 'normal', mode: 'pvp', players: 1, maps: ['short', 'medium'], rules: { dawnStartTreasures: { resurrections: 0, others: 0, random: 1 } } },
  { objective: 'control', level: 'normal', mode: 'pvp', players: 2, maps: ['long'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 1 } } },
  { objective: 'control', level: 'normal', mode: 'pvp', players: 2, maps: ['veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 2 } } },
  // --- Goal 'survival' (coop only): Easy plays board duels with a replacement hero, which made it nearly unlosable; two players made Normal too easy.
  { objective: 'survival', level: 'zero', mode: 'coop', players: 1, maps: ['short'], rules: { heroReplacement: false, dawnStartTreasures: { resurrections: 0, others: 0, random: 4 } } },
  { objective: 'survival', level: 'zero', mode: 'coop', players: 1, maps: ['medium', 'long', 'veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 4 } } },
  { growth: true, objective: 'survival', level: 'zero', mode: 'coop', players: 1, maps: ['medium', 'long', 'veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 0 }, dawnStartTreasures: { resurrections: 0, others: 0, random: 2 } } },
  { objective: 'survival', level: 'zero', mode: 'coop', players: 2, rules: { heroReplacement: false } },
  { growth: true, objective: 'survival', level: 'zero', mode: 'coop', players: 2, rules: { heroReplacement: true } },
  { objective: 'survival', level: 'normal', mode: 'coop', players: 2, rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 2 } } },
  { objective: 'survival', level: 'hard', mode: 'coop', players: 2, rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 2 } } },
  { objective: 'survival', level: 'hard', mode: 'coop', players: 2, maps: ['veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 4 } } },
  // --- Goal 'artifact': the Przymierza move first and reach the middle first, which tells on long maps.
  { objective: 'artifact', level: 'normal', maps: ['long'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 2 } } },
  { objective: 'artifact', level: 'normal', maps: ['veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 4 } } },

  // --- Hero growth on the triangle map (after the cells above, so they win): the growth entry above gave the Horde treasures at every level, which made Easy too hard
  // and left two-player Hard too easy, so these cells are set again.
  { growth: true, shape: 'triangle', objective: 'crystals', level: 'zero', rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 0 } } },
  { growth: true, shape: 'triangle', objective: 'crystals', level: 'normal', mode: 'coop', players: 2, maps: ['veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 3 } } },
  { growth: true, shape: 'triangle', objective: 'crystals', level: 'hard', mode: 'coop', players: 2, maps: ['short', 'medium', 'long'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 3 } } },
  { growth: true, shape: 'triangle', objective: 'crystals', level: 'hard', mode: 'coop', players: 2, maps: ['veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 5 } } },

  // --- Map shapes other than the triangle, goal 'crystals' (last, so they win over the entries above): the Przymierza are weaker there
  // (the Tree is open on more sides, the roads cross), so they start with treasures (ring: also one more move point and an Eliksir).
  { objective: 'crystals', shape: 'rectangle', rules: { dawnStartTreasures: { resurrections: 0, others: 0, random: 3 } } },
  { objective: 'crystals', shape: 'ring', rules: { heroMovePoints: 4, dawnStartTreasures: { resurrections: 0, others: 0, random: 4 } } },
  // Islands and hand-made maps: the roads are narrow (a bridge, a gap), so the Przymierza start with treasures and a move point more; in coop they get one treasure more.
  { objective: 'crystals', shape: 'islands', rules: { heroMovePoints: 4, dawnStartTreasures: { resurrections: 0, others: 0, random: 4 } } },
  { objective: 'crystals', shape: 'custom', rules: { heroMovePoints: 4, dawnStartTreasures: { resurrections: 0, others: 0, random: 4 } } },
  { objective: 'crystals', shape: 'custom', mode: 'coop', rules: { dawnStartTreasures: { resurrections: 1, others: 0, random: 9 } } },
  // Generated entries (scripts/sim/tune.ts), last: they win over everything above on the triangle map.
  ...AUTO_TUNING,

  // --- Level 3 "Osada" (after everything; scripts/sim/tuneKingdom.ts, 120 games per probe). levelOf says 'custom' for it, so digitalRules tunes it as the level it is built on.
  // Only the goal 'crystals' is tuned. Easy has no entries: its board duels switch the kingdom off (see BACKLOG); PvP has no Hard level.
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'coop', players: 1, maps: ['short'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 1}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'coop', players: 2, maps: ['short'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 1}, dawnStartTreasures: {resurrections: 0, others: 0, random: 0}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'pvp', players: 1, maps: ['short'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 1}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'pvp', players: 2, maps: ['short'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 1}, dawnStartTreasures: {resurrections: 0, others: 0, random: 0}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'coop', players: 1, maps: ['medium'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 4}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'coop', players: 2, maps: ['medium'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 6}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'pvp', players: 1, maps: ['medium'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 4}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'pvp', players: 2, maps: ['medium'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 6}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'coop', players: 1, maps: ['long'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 4}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'coop', players: 2, maps: ['long'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 6}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'pvp', players: 1, maps: ['long'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 4}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'pvp', players: 2, maps: ['long'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 6}} },
  { kingdom: true, objective: 'crystals', level: 'hard', mode: 'coop', players: 1, maps: ['short'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 2}, dawnStartTreasures: {resurrections: 0, others: 0, random: 0}} },
  { kingdom: true, objective: 'crystals', level: 'hard', mode: 'coop', players: 2, maps: ['short'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 3}, dawnStartTreasures: {resurrections: 0, others: 0, random: 0}} },
  { kingdom: true, objective: 'crystals', level: 'hard', mode: 'coop', players: 1, maps: ['medium'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 1}, dawnStartTreasures: {resurrections: 0, others: 0, random: 0}} },
  { kingdom: true, objective: 'crystals', level: 'hard', mode: 'coop', players: 2, maps: ['medium'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 1}, dawnStartTreasures: {resurrections: 0, others: 0, random: 0}} },
  { kingdom: true, objective: 'crystals', level: 'hard', mode: 'coop', players: 1, maps: ['long'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 2}} },
  { kingdom: true, objective: 'crystals', level: 'hard', mode: 'coop', players: 2, maps: ['long'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 2}} },
  // Normal and Hard of the Kingdom, retuned 15.11 after the bots learned to shop from anywhere (later entries win over the earlier ones above).
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'pvp', players: 1, maps: ['short'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 0}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'coop', players: 1, maps: ['veryLong'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 6}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'coop', players: 2, maps: ['veryLong'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 3}} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'pvp', players: 1, maps: ['veryLong'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 8}, dawnGoldBonus: 1} },
  { kingdom: true, objective: 'crystals', level: 'normal', mode: 'pvp', players: 2, maps: ['veryLong'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 8}, dawnGoldBonus: 1} },
  { kingdom: true, objective: 'crystals', level: 'hard', mode: 'coop', players: 2, maps: ['medium'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 2}, dawnStartTreasures: {resurrections: 0, others: 0, random: 0}} },
  { kingdom: true, objective: 'crystals', level: 'hard', mode: 'coop', players: 1, maps: ['long'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 1}, dawnStartTreasures: {resurrections: 0, others: 0, random: 0}} },
  { kingdom: true, objective: 'crystals', level: 'hard', mode: 'coop', players: 2, maps: ['long'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 3}, dawnStartTreasures: {resurrections: 0, others: 0, random: 0}} },
  { kingdom: true, objective: 'crystals', level: 'hard', mode: 'coop', players: 1, maps: ['veryLong'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 3}} },
  { kingdom: true, objective: 'crystals', level: 'hard', mode: 'coop', players: 2, maps: ['veryLong'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 4}, dawnStartTreasures: {resurrections: 0, others: 0, random: 0}} },
  // Easy of the Kingdom (15.11, scripts/sim/tuneKingdom.ts kids; 100 games per probe, short maps 40): about 65-85 percent (2 on 2 on the medium map stays at 64-67: the ladder ends).
  { kingdom: true, objective: 'crystals', level: 'kids', mode: 'coop', players: 1, maps: ['short'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 3}} },
  { kingdom: true, objective: 'crystals', level: 'kids', mode: 'coop', players: 2, maps: ['short'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 3}} },
  { kingdom: true, objective: 'crystals', level: 'kids', mode: 'pvp', players: 1, maps: ['short'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 2}} },
  { kingdom: true, objective: 'crystals', level: 'kids', mode: 'pvp', players: 2, maps: ['short'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 13}, hordeRespawn: false, heroMovePoints: 4} },
  { kingdom: true, objective: 'crystals', level: 'kids', mode: 'coop', players: 1, maps: ['medium'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 13}, dawnGoldBonus: 2, hordeRespawn: false} },
  { kingdom: true, objective: 'crystals', level: 'kids', mode: 'coop', players: 2, maps: ['medium'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 13}, dawnGoldBonus: 4, hordeRespawn: false, heroMovePoints: 4, roundLimitBonus: 6} },
  { kingdom: true, objective: 'crystals', level: 'kids', mode: 'pvp', players: 1, maps: ['medium'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 13}, dawnGoldBonus: 2, hordeRespawn: false} },
  { kingdom: true, objective: 'crystals', level: 'kids', mode: 'pvp', players: 2, maps: ['medium'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 13}, dawnGoldBonus: 4, hordeRespawn: false, heroMovePoints: 4, roundLimitBonus: 6} },
  { kingdom: true, objective: 'crystals', level: 'kids', mode: 'coop', players: 1, maps: ['long'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 10}, dawnGoldBonus: 2} },
  { kingdom: true, objective: 'crystals', level: 'kids', mode: 'coop', players: 2, maps: ['long'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 13}, dawnGoldBonus: 3, hordeRespawn: false, heroMovePoints: 4} },
  { kingdom: true, objective: 'crystals', level: 'kids', mode: 'pvp', players: 1, maps: ['long'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 6}} },
  { kingdom: true, objective: 'crystals', level: 'kids', mode: 'pvp', players: 2, maps: ['long'], rules: {hordeStartTreasures: {resurrections: 0, others: 0, random: 0}, dawnStartTreasures: {resurrections: 0, others: 0, random: 13}, dawnGoldBonus: 4, hordeRespawn: false, heroMovePoints: 4, roundLimitBonus: 6} },
  // --- Goal 'conquest' (level 4, 15.11; scripts/sim/kingdom.ts with SIM_ECONOMY=1 SIM_OBJECTIVE=conquest, 60 games a cell): one hero alone is short of
  // time and strength against the automaton, two heroes are too many for the Horde.
  { objective: 'conquest', level: 'normal', mode: 'coop', players: 1, rules: { roundLimitBonus: 2, dawnStartTreasures: { resurrections: 0, others: 0, random: 2 } } },
  { objective: 'conquest', level: 'normal', mode: 'coop', players: 2, rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 3 } } },
  { objective: 'conquest', level: 'normal', mode: 'pvp', players: 2, maps: ['short', 'long', 'veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 3 } } },
  { objective: 'conquest', level: 'normal', mode: 'coop', players: 2, maps: ['medium'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 2 } } },
  { objective: 'conquest', level: 'normal', mode: 'coop', players: 1, maps: ['veryLong'], rules: { roundLimitBonus: 2, dawnStartTreasures: { resurrections: 0, others: 0, random: 4 } } },
  // --- Level 5 "Królestwo" (15.11; SIM_ECONOMY=1 SIM_REALM=1 scripts/sim/kingdom.ts, 60 games a cell): the second hero, the starting spell and the
  // growth by type help the Przymierza more where one hero plays; the Horde start with treasures on top.
  { realm: true, objective: 'crystals', level: 'normal', mode: 'coop', players: 1, rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 3 } } },
  { realm: true, objective: 'crystals', level: 'normal', mode: 'pvp', players: 1, maps: ['short'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 1 } } },
  { realm: true, objective: 'crystals', level: 'normal', mode: 'pvp', players: 1, maps: ['medium'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 3 } } },
  { realm: true, objective: 'crystals', level: 'normal', mode: 'coop', players: 2, maps: ['long', 'veryLong'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 4 } } },
  // --- Goal 'relic' (level 6, 15.11; SIM_ECONOMY=1 SIM_EMPIRE=1 SIM_OBJECTIVE=relic scripts/sim/kingdom.ts, 40-60 games a cell): the Przymierza move first
  // and reach the shards first; the Horde start with treasures.
  { objective: 'relic', level: 'normal', rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 1 } } },
  { objective: 'relic', level: 'normal', maps: ['long'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 2 } } },
  { objective: 'relic', level: 'normal', players: 2, maps: ['long'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 3 } } },
  { objective: 'relic', level: 'normal', maps: ['veryLong', 'huge', 'giant'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 4 } } },
  { objective: 'relic', level: 'normal', mode: 'coop', players: 2, maps: ['short', 'medium'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 2 } } },
  { objective: 'relic', level: 'normal', mode: 'coop', maps: ['veryLong', 'huge', 'giant'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 5 } } },
  { objective: 'relic', level: 'normal', mode: 'pvp', players: 2, maps: ['veryLong', 'huge', 'giant'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 5 } } },
  // --- Level 6 "Imperium", goal 'crystals' (15.11, 40-60 games a cell): Blask Świtu helps the Przymierza from the first round, Żądza Krwi only after a kill.
  { empire: true, objective: 'crystals', level: 'normal', mode: 'pvp', players: 1, maps: ['short'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 3 } } },
  { empire: true, objective: 'crystals', level: 'normal', mode: 'coop', players: 1, maps: ['medium'], rules: { hordeStartTreasures: { resurrections: 0, others: 0, random: 5 } } },
];

/** The rules a game is played with: the setup's, plus the digital levers that match it. */
export function digitalRules(setup: SetupOptions): RulesConfig {
  const base = setup.rules;
  if (!isDigital(base) || setup.mode === 'arena') return base;
  // The Kingdom table has no ranking level (levelOf says 'custom'), but its difficulty is tuned like the level it is built on.
  const level = levelOf(base.kingdom ? { ...setup, rules: { ...base, kingdom: false, economy: false } } : setup);
  // Only the ready-made levels are tuned; "Własny" is exactly what the player switched on.
  if (level === 'custom') return base;
  const players = setup.seats.filter((s) => s.faction === 'dawn').length;
  const objective = base.objective === 'control' || base.objective === 'survival' || base.objective === 'boss' || base.objective === 'artifact' || base.objective === 'conquest' || base.objective === 'relic' ? base.objective : 'crystals';
  let rules = base;
  for (const t of DIGITAL_TUNING) {
    if (t.objective && t.objective !== objective) continue;
    if (t.level && t.level !== level) continue;
    if (t.mode && t.mode !== setup.mode) continue;
    if (t.players && t.players !== players) continue;
    if (t.maps && !t.maps.includes(setup.mapSize)) continue;
    if (t.growth !== undefined && t.growth !== Boolean(base.heroGrowth)) continue;
    if (t.kingdom !== undefined && t.kingdom !== Boolean(base.kingdom)) continue;
    if (t.realm !== undefined && t.realm !== Boolean(base.realm)) continue;
    if (t.empire !== undefined && t.empire !== Boolean(base.empire)) continue;
    if (t.shape && t.shape !== (setup.mapShape ?? 'triangle')) continue;
    if (t.customMapId && t.customMapId !== setup.customMapId) continue;
    rules = { ...rules, ...t.rules };
  }
  return rules;
}
