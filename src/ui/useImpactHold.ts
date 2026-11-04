// Digital ruleset: the blow of a unit with sprites lands when its attack animation reaches it, not when the attack is clicked.
// The engine already holds the result, so the screen keeps showing the state before the attack until the sprite layer reports the
// impact (or a timeout passes); damage, life bars, hit and death animations then follow from the new state.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

/** The state to draw (the one before a sprite unit's blow until it lands), the attack to animate, and whether the screen is waiting. */
export function useImpactHold(live: GameState) {
  const prev = useRef(live);
  const [hold, setHold] = useState<{ view: GameState; attack: AttackNow } | null>(null);
  const timer = useRef<number | null>(null);
  const release = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setHold(null);
  }, []);

  // A layout effect: the hold is in place before the new state is first painted.
  useLayoutEffect(() => {
    const before = prev.current;
    prev.current = live;
    if (before === live || hold) return;
    const attack = spriteAttackBetween(before, live);
    if (!attack) return;
    setHold({ view: before, attack });
    timer.current = window.setTimeout(release, IMPACT_TIMEOUT_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  useEffect(() => {
    if (!hold) return;
    return onImpact((id) => id === hold.attack.unitId && release());
  }, [hold, release]);
  useEffect(() => () => void (timer.current && window.clearTimeout(timer.current)), []);

  return { view: hold ? hold.view : live, attack: hold?.attack ?? null, holding: hold !== null };
}

export { emitImpact };
