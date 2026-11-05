// Digital ruleset: the blow of a unit with sprites lands when its attack animation reaches it, not when the attack is clicked.
// The engine already holds the result, so the screen keeps showing the state before the attack until the sprite layer reports the
// impact (or a timeout passes); damage, life bars, hit and death animations then follow from the new state.

import { useCallback, useEffect, useRef, useState } from 'react';
import { isDigital, type GameState } from '../engine/types';
import { emitImpact, IMPACT_TIMEOUT_MS, onImpact } from './impact';
import { hasSprites } from './sprites';

export interface AttackNow {
  /** The attacker (a battle unit id) and the unit it attacks. */
  unitId: string;
  targetId: string;
  /** Plays the attack clip once per key. */
  key: number;
}

let counter = 0;

/** The attack that happened between two states of the same battle, when a unit with sprites made it. */
export function spriteAttackBetween(before: GameState, after: GameState): AttackNow | null {
  const ab = after.battle;
  const bb = before.battle;
  if (!isDigital(after.rules) || !ab || !bb) return null;
  const seen = bb.rolls?.[bb.rolls.length - 1]?.seq ?? 0;
  const roll = (ab.rolls ?? []).find((r) => r.seq > seen && ab.units[r.attackerId] && hasSprites(ab.units[r.attackerId].defId));
  return roll ? { unitId: roll.attackerId, targetId: roll.targetId, key: ++counter } : null;
}

/** The state before the blow, but with the attacker already standing where it struck from: a unit that moves and hits in one action
 *  first goes there (its way is drawn from the two states), then attacks; the damage waits for the blow. */
function withAttackerMoved(before: GameState, after: GameState, unitId: string): GameState {
  const bb = before.battle;
  const moved = after.battle?.units[unitId];
  const was = bb?.units[unitId];
  if (!bb || !moved || !was || !moved.alive || !was.alive || moved.pos === was.pos) return before;
  return { ...before, battle: { ...bb, units: { ...bb.units, [unitId]: { ...was, pos: moved.pos, tail: moved.tail } } } };
}

/** The state to draw (the one before a sprite unit's blow until it lands), the attack to animate, and whether the screen is waiting. */
export function useImpactHold(live: GameState) {
  const [seen, setSeen] = useState(live);
  const [hold, setHold] = useState<{ view: GameState; attack: AttackNow } | null>(null);
  const timer = useRef<number | null>(null);
  const release = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setHold(null);
  }, []);

  // Worked out while rendering (React renders again at once, before anything is committed): were the hold set in an effect, the sprite
  // layer would see the new state for a moment, then the old one, then the new one again, and a unit would die, stand up and die.
  if (seen !== live) {
    setSeen(live);
    if (!hold) {
      const attack = spriteAttackBetween(seen, live);
      if (attack) setHold({ view: withAttackerMoved(seen, live, attack.unitId), attack });
    }
  }

  useEffect(() => {
    if (!hold) return;
    timer.current = window.setTimeout(release, IMPACT_TIMEOUT_MS);
    const off = onImpact((id) => id === hold.attack.unitId && release());
    return () => {
      off();
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
    };
  }, [hold, release]);

  return { view: hold ? hold.view : live, attack: hold?.attack ?? null, holding: hold !== null };
}

export { emitImpact };
