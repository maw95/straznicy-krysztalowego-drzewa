// The difficulty of a computer player in the digital game (backlog 94): a bot of a lower level now and then makes a worse choice than its best,
// in a few chosen places: a step off its way on the map (the one that counts most: measured 26.11, the battle choices alone move the results by a
// few points), the target of a blow, a blind move in battle, a fight with a stronger hero, a treasure on the way, a skill or a treasure card, a
// purchase, the supports for a battle, the walk back to the Tree. The draw is a hash of the game's state (its random state and the
// number of actions so far) and the place, so the same state always gives the same choice: a saved game, a replay and the server agree.

import { currentActor } from '../game';
import type { BotLevel, GameState } from '../types';

/**
 * How often a bot of each level slips at one of those places (0-1). Hard and Very hard play their best; Very hard has the computer's advantages
 * on top (COMPUTER_HANDICAP in types.ts). The author's assumption (26.11): a person plays about as well as a Normal bot. Tuned with
 * `npx tsx scripts/sim/botLevels.ts` (goals control, boss, artifact, maps S/M/L, 150 games a cell): a Normal bot standing in for the person wins
 * 74 percent against Easy (band 65-85), 50 against Normal (45-65), 37 against Hard (30-45), 20 against Very hard (15-30).
 */
export const BOT_SLIPS: Record<BotLevel, number> = { kids: 0.75, normal: 0.25, hard: 0, veryHard: 0 };

/** The level of the computer player who must act now, or null (a person, the automaton, the neutrals, a bot without a level: the old games). */
export function actingBotLevel(state: GameState): BotLevel | null {
  const actor = currentActor(state);
  if (actor.kind !== 'bot') return null;
  return state.players.find((p) => p.id === actor.playerId)?.botLevel ?? null;
}

/** A number in [0, 1) from the game's state and the place of the choice. */
function roll(state: GameState, place: string): number {
  let h = (state.rng ^ Math.imul(state.actionCount + 1, 0x9e3779b1)) | 0;
  for (let i = 0; i < place.length; i++) h = Math.imul(h ^ place.charCodeAt(i), 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** One of `n` choices picked by the same draw (for a slip that takes some other option than the best one). */
export function slipPick(state: GameState, place: string, n: number): number {
  return Math.floor(roll(state, `${place}#`) * n);
}

/** Whether the bot acting now makes the worse choice at `place` this time. */
export function slips(state: GameState, place: string): boolean {
  const level = actingBotLevel(state);
  const rate = level ? BOT_SLIPS[level] : 0;
  return rate > 0 && roll(state, place) < rate;
}
