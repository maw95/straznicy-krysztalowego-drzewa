// The last blow of a battle ends it at once: the engine drops the battle and the screen would jump to the result before the
// fallen unit's death animation was seen. In the digital ruleset the last fight state is held for a moment, with the units the
// final blow felled shown as fallen, before the result and the summary appear.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { isDigital, type BattleReport, type GameState } from '../engine/types';

/** How long the finished battle stays on screen (the death clip of a large unit takes about two seconds). */
export const END_HOLD_MS = 2800;

/** The fight state `before` with the results of the final blow applied: fallen units lie where they fell, the battle is over. */
export function finalView(before: GameState, report: BattleReport): GameState {
  const view = structuredClone(before);
  const b = view.battle!;
  const taken = new Set<string>();
  for (const r of report.units) {
    const u = Object.values(b.units).find((x) => x.defId === r.defId && x.side === r.side && !taken.has(x.id));
    if (!u) continue;
    taken.add(u.id);
    u.hp = r.hp;
    if (u.alive && !r.alive) {
      u.alive = false;
      if (u.pos) {
        u.corpse = u.pos;
        if (u.tail) u.corpseTail = u.tail;
      }
      u.pos = null;
      delete u.tail;
    }
  }
  b.stage = 'over';
  b.activation = null;
  b.winner = report.winner;
  return view;
}

/** The finished battle to keep showing for a moment, or null. */
export function useEndHold(game: GameState | null): GameState | null {
  const prev = useRef<GameState | null>(null);
  const timer = useRef<number | null>(null);
  const [held, setHeld] = useState<GameState | null>(null);
  // A layout effect, so the hold is set before the first paint of the finished game (no flash of the result).
  useLayoutEffect(() => {
    const before = prev.current;
    prev.current = game;
    if (!game || !before) return;
    const fought = before.phase === 'battle' && before.battle?.stage === 'fight';
    const over = !(game.phase === 'battle' && game.battle?.stage === 'fight');
    if (fought && over && isDigital(game.rules) && game.lastBattle && game.lastBattle.id !== before.lastBattle?.id) {
      const v = finalView(before, game.lastBattle);
      setHeld(v);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setHeld(null), END_HOLD_MS);
    } else if (game.setup.seed !== before.setup.seed || game.actionCount < before.actionCount) {
      // A different game was started or loaded: drop any hold.
      if (timer.current) window.clearTimeout(timer.current);
      setHeld(null);
    }
  }, [game]);
  useEffect(() => () => void (timer.current && window.clearTimeout(timer.current)), []);
  return held;
}
