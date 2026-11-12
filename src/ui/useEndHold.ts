// The last blow of a battle ends it at once: the engine drops the battle and the screen would jump to the result before the
// fallen unit's death animation was seen. In the digital ruleset the last fight state is held for a moment, with the units the
// final blow felled shown as fallen, before the result and the summary appear.

import { useEffect, useState } from 'react';
import { isDigital, type BattleReport, type GameState } from '../engine/types';
import { AFTER_KILL_MS, beginHold, endHold } from './animLock';
import { IMPACT_TIMEOUT_MS, onImpact } from './impact';
import { hasSprites } from './sprites';
import { scaledMs } from './animSpeed';
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
  const [prev, setPrev] = useState<GameState | null>(game);
  const [held, setHeld] = useState<EndHold | null>(null);
  /** The result waiting for the last blow of a unit with sprites to land (the screen shows the fight as it was until then). */
  const [waiting, setWaiting] = useState<{ unitId: string; final: GameState } | null>(null);
  // Worked out while rendering, not in an effect: the screen must go from the fight straight to the held fight, without a frame of the
  // map in between (the arena would be torn down and built again: a flash of black, and every unit standing as at the start).
  if (game !== prev) {
    setPrev(game);
    const before = prev;
    if (game && before) {
      const fought = before.phase === 'battle' && before.battle?.stage === 'fight';
      const over = !(game.phase === 'battle' && game.battle?.stage === 'fight');
      if (fought && over && isDigital(game.rules) && game.lastBattle && game.lastBattle.id !== before.lastBattle?.id) {
        const final = finalView(before, game.lastBattle);
        const bb = before.battle!;
        const att = bb.activation ? bb.units[bb.activation.unitId] : null;
        if (att && hasSprites(att.defId) && !bb.activation!.attacked) {
          // The last blow of a unit with sprites: show the fight as it was until the blow lands, then the result.
          const target = Object.values(bb.units).find((u) => u.alive && u.side !== att.side);
          setWaiting({ unitId: att.id, final });
          setHeld({ view: before, attack: { unitId: att.id, targetId: target?.id ?? att.id, key: Date.now() } });
        } else {
          setWaiting(null);
          setHeld({ view: final, attack: null });
        }
      } else if (game.setup.seed !== before.setup.seed || game.actionCount < before.actionCount) {
        // A different game was started or loaded: drop any hold.
        setWaiting(null);
        setHeld(null);
      }
    }
  }
  // The blow lands (or never does: a sprite that did not load, a hidden tab): the result follows.
  useEffect(() => {
    if (!waiting) return;
    const show = () => {
      setWaiting(null);
      setHeld({ view: waiting.final, attack: null });
    };
    const off = onImpact((id) => id === waiting.unitId && show());
    const timer = window.setTimeout(show, IMPACT_TIMEOUT_MS);
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, [waiting]);
  // The finished battle stays for a moment (the death clip of a large unit takes about two seconds), then the result.
  const showing = held !== null && waiting === null;
  useEffect(() => {
    if (!showing) return;
    const timer = window.setTimeout(() => setHeld(null), scaledMs(END_HOLD_MS));
    return () => window.clearTimeout(timer);
  }, [showing, held]);
  // Nothing machine-driven starts on the adventure map while the finished battle is still on screen.
  const holding = held !== null;
  useEffect(() => {
    if (!holding) return;
    beginHold();
    return () => endHold(AFTER_KILL_MS / 3);
  }, [holding]);
  return held;
}
