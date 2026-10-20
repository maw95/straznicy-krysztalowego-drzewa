import { currentActor } from '../game';
import type { Action, GameState } from '../types';
import { adventureAction } from './adventureAi';
import { chooseBattleAction } from './battleAi';

/** Next action for whoever must act now (bot seat, automaton or a human on autoplay). */
export function chooseAction(state: GameState): Action | null {
  if (currentActor(state).kind === 'none') return null;
  if (state.phase === 'battle') return chooseBattleAction(state);
  return adventureAction(state);
}
