// Hidden information (the Free Companies: traps, veiled units): what a viewer may see of the state. The engine always works on the full state; whoever shows
// the game to people (the server for an online table, the screen for hot-seat) shows `redactHidden(state, viewers)` instead. No import from the rest of the
// engine but types, so the server and the screens can use it freely.

import type { Side } from './data';
import type { GameState, GroundEffect } from './types';

/** Whether the sides in `viewers` know of the effect: it is not hidden, or it is theirs, or the Oko Kruka has uncovered it for them. */
export const knowsEffect = (g: GroundEffect, viewers: readonly Side[] | null): boolean => !g.hidden || (viewers ?? []).some((v) => v === g.owner || g.seenBy?.includes(v));

/**
 * The game as the sides in `viewers` may see it (null: nobody, a spectator or a game of bots): the hidden traps of the others are left out of the battle
 * and a veiled unit of another side has no place on the arena (it is on the list of the units, but nowhere on the board). The state is returned as it is when there is
 * nothing to hide, so a screen may call this every time. It does not change its argument.
 */
export function redactHidden(state: GameState, viewers: readonly Side[] | null): GameState {
  const b = state.battle;
  if (!b) return state;
  const traps = (b.ground ?? []).filter((g) => !knowsEffect(g, viewers));
  const veiled = Object.values(b.units).filter((u) => u.status.veiled && u.pos !== null && !(viewers ?? []).includes(u.side));
  if (!traps.length && !veiled.length) return state;
  const units = { ...b.units };
  for (const u of veiled) {
    const { tail: _tail, ...rest } = u;
    units[u.id] = { ...rest, pos: null };
  }
  return { ...state, battle: { ...b, ground: (b.ground ?? []).filter((g) => knowsEffect(g, viewers)), units } };
}
