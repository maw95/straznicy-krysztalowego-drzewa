// How hard a fight on the map would be for the active hero: the fight is played out by the bots on both sides on a copy of the game
// (so levels, artifacts, treasures and abilities all count as they do in a real fight) and the result is put into four words.

import { chooseAction } from './ai';
import { applyActionInPlace, fightAt } from './game';
import type { HexKey } from './hex';
import type { BattleState, GameState } from './types';

export type FightLevel = 'easy' | 'even' | 'dangerous' | 'impossible';

export const FIGHT_LEVEL_NAMES: Record<FightLevel, string> = { easy: 'łatwa', even: 'wyrównana', dangerous: 'groźna', impossible: 'niemożliwa' };

/** The longest a simulated fight may take (actions); a fight that does not end by then is called even. */
const MAX_ACTIONS = 600;

/** Life left of a side at the end of a fight, as a share of its maximum. */
function share(b: BattleState, side: string): number {
  const units = Object.values(b.units).filter((u) => u.side === side);
  const max = units.reduce((a, u) => a + u.maxHp, 0);
  return max ? units.reduce((a, u) => a + (u.alive ? Math.max(0, u.hp) : 0), 0) / max : 0;
}

/** Puts a finished fight into a level: how much of its life the hero's side kept, or how much of the enemy's it failed to take. */
export function levelOfFight(b: BattleState): FightLevel {
  const mine = share(b, b.attacker);
  const theirs = share(b, b.defender);
  if (b.winner === b.attacker) return mine >= 0.5 ? 'easy' : 'even';
  if (b.winner === null || b.winner === 'draw') return 'even';
  // Lost: a narrow defeat is still an even fight, a hopeless one is not worth starting.
  if (theirs <= 0.3) return 'even';
  return theirs < 0.65 ? 'dangerous' : 'impossible';
}

/** The level of the fight the active hero would start by going to `to`, or null when there is no fight there (or it could not be played). */
export function fightDifficulty(state: GameState, to: HexKey): FightLevel | null {
  const s = fightAt(state, to);
  if (!s) return null;
  let last: BattleState | null = s.battle;
  for (let i = 0; i < MAX_ACTIONS && s.phase === 'battle'; i++) {
    if (s.battle) last = s.battle;
    if (s.battle?.winner) break;
    const a = chooseAction(s);
    if (!a) break;
    try {
      applyActionInPlace(s, a);
    } catch {
      return null;
    }
  }
  const b = s.battle ?? last;
  return b ? levelOfFight(b) : null;
}
