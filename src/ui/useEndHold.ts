// The last blow of a battle ends it at once: the engine drops the battle and the screen would jump to the result before the
// fallen unit's death animation was seen. In the digital ruleset the last fight state is held for a moment, with the units the
// final blow felled shown as fallen, before the result and the summary appear.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { isDigital, type BattleReport, type GameState } from '../engine/types';
import { IMPACT_TIMEOUT_MS, onImpact } from './impact';
import { hasSprites } from './sprites';
import type { AttackNow } from './useImpactHold';

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

/** The finished battle to keep showing for a moment (and the attack to animate while it waits for the last blow to land), or null. */
export interface EndHold {
  view: GameState;
  attack: AttackNow | null;
}

export function useEndHold(game: GameState | null): EndHold | null {
  const prev = useRef<GameState | null>(null);
  const timer = useRef<number | null>(null);
  const [held, setHeld] = useState<EndHold | null>(null);
  /** The result waiting for the last blow of a unit with sprites to land. */
  const waiting = useRef<{ unitId: string; final: GameState } | null>(null);
  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  const show = (final: GameState) => {
    waiting.current = null;
    clear();
    setHeld({ view: final, attack: null });
    timer.current = window.setTimeout(() => setHeld(null), END_HOLD_MS);
  };
  // A layout effect, so the hold is set before the first paint of the finished game (no flash of the result).
  useLayoutEffect(() => {
    const before = prev.current;
    prev.current = game;
    if (!game || !before) return;
    const fought = before.phase === 'battle' && before.battle?.stage === 'fight';
    const over = !(game.phase === 'battle' && game.battle?.stage === 'fight');
    if (fought && over && isDigital(game.rules) && game.lastBattle && game.lastBattle.id !== before.lastBattle?.id) {
      const final = finalView(before, game.lastBattle);
      const bb = before.battle!;
      const att = bb.activation ? bb.units[bb.activation.unitId] : null;
      if (att && hasSprites(att.defId) && !bb.activation!.attacked) {
        // The last blow of a unit with sprites: show the fight as it was until the blow lands, then the result.
        const target = Object.values(bb.units).find((u) => u.alive && u.side !== att.side);
        waiting.current = { unitId: att.id, final };
        setHeld({ view: before, attack: { unitId: att.id, targetId: target?.id ?? att.id, key: Date.now() } });
        clear();
        timer.current = window.setTimeout(() => waiting.current && show(waiting.current.final), IMPACT_TIMEOUT_MS);
      } else show(final);
    } else if (game.setup.seed !== before.setup.seed || game.actionCount < before.actionCount) {
      // A different game was started or loaded: drop any hold.
      waiting.current = null;
      clear();
      setHeld(null);
    }
  }, [game]);
  useEffect(() => onImpact((id) => waiting.current?.unitId === id && show(waiting.current.final)), []);
  useEffect(() => () => clear(), []);
  return held;
}
