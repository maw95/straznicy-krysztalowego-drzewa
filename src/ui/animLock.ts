// The engine finishes an action at once, but what the player sees takes time: a walk, a blow, the hit and the death after it.
// A machine player (bot, automaton, autoplay) must not start its next action before that is over, or the screen shows two
// actions at the same moment (a hydra striking while the elf's blow is still landing). This tiny lock tells the bot timer
// how long to wait: for a fixed time after an action, and for as long as a hold (waiting for a blow to land) lasts.

import { scaledMs } from './animSpeed';

let busyUntil = 0;
let holds = 0;

/** The next machine action waits at least `ms` more from now. */
export function holdFor(ms: number) {
  busyUntil = Math.max(busyUntil, Date.now() + scaledMs(ms));
}

/** The screen is waiting for something (a blow to land, the result of a battle): nothing machine-driven starts until it ends. */
export function beginHold() {
  holds++;
}
export function endHold(afterMs = 0) {
  holds = Math.max(0, holds - 1);
  if (afterMs) holdFor(afterMs);
}

/** Milliseconds a machine action should still wait (a short poll interval while a hold lasts). */
export function animationWait(): number {
  return holds > 0 ? 100 : Math.max(0, busyUntil - Date.now());
}

/** Forget everything (a game was left or another started). */
export function resetAnimLock() {
  busyUntil = 0;
  holds = 0;
}

/** Time the arena needs to show one attack by a unit (turn, the blow, the hit shake) before the next action may begin. */
export const ATTACK_SHOW_MS = 1100;
/** Extra time after a blow landed, so its hit clip and floating numbers play out. */
export const AFTER_IMPACT_MS = 700;
/** The same, when the blow felled a unit (the death clip of a large unit is long). */
export const AFTER_KILL_MS = 1500;
