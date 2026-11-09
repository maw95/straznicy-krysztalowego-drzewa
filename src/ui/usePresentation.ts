// Online, the server plays the bots and sends every new state at once, however long the screen needs to show the last one.
// Left alone, the screen would jump over states (two blows at the same moment, a battle that ends before its last blow is seen).
// Here the states wait in a queue and are shown one by one, each after the animations of the one before are over (animLock).

import { useEffect, useRef } from 'react';
import type { OnlineSession } from '../online/api';
import { movePath } from '../engine/battle';
import type { GameState } from '../engine/types';
import { animationWait, ATTACK_SHOW_MS, holdFor, resetAnimLock } from './animLock';
import { WALK_STEP_MS } from './useBattleAnimations';

/** More waiting states than this: the player was away (a hidden tab, a slow connection), so jump to the newest instead of replaying. */
const MAX_QUEUE = 40;
/** Time the map needs to show a hero's step. */
const ADVENTURE_STEP_MS = 220;

/** How long the screen needs to show the change from `prev` to `next`. */
export function presentationMs(prev: GameState, next: GameState): number {
  const pb = prev.battle;
  const nb = next.battle;
  if (pb && nb && pb !== nb) {
    const seen = pb.rolls?.[pb.rolls.length - 1]?.seq ?? 0;
    if ((nb.rolls ?? []).some((r) => r.seq > seen)) return ATTACK_SHOW_MS;
    let walk = 0;
    for (const u of Object.values(nb.units)) {
      const was = pb.units[u.id];
      if (!was?.pos || !u.pos || was.pos === u.pos || !was.alive || !u.alive) continue;
      walk = Math.max(walk, (movePath(prev, was, u.pos).length - 1) * WALK_STEP_MS);
    }
    return walk;
  }
  if (!pb && nb) return 400;
  if (prev.phase === 'battle' && next.phase !== 'battle') return ATTACK_SHOW_MS;
  if (prev.phase === 'adventure' && next.phase === 'adventure' && prev.actionCount !== next.actionCount) return ADVENTURE_STEP_MS;
  return 0;
}

/**
 * Feeds `apply` with the online game's states in order. `live` is the latest state (it starts the game and ends it); every
 * state the server sends goes through `session.onGameState` into the queue.
 */
export function usePresentation(session: OnlineSession | null, live: GameState | null, apply: (g: GameState | null) => void) {
  const queue = useRef<GameState[]>([]);
  const shown = useRef<GameState | null>(null);
  const tail = useRef<GameState | null>(null);
  const timer = useRef(0);
  const applyRef = useRef(apply);
  applyRef.current = apply;

  const show = (g: GameState | null) => {
    shown.current = g;
    applyRef.current(g);
  };
  const reset = (g: GameState | null) => {
    queue.current = [];
    window.clearTimeout(timer.current);
    timer.current = 0;
    resetAnimLock();
    tail.current = g;
    show(g);
  };
  const pump = () => {
    if (timer.current) return;
    const step = () => {
      timer.current = 0;
      const wait = animationWait();
      if (wait > 0) {
        timer.current = window.setTimeout(step, wait);
        return;
      }
      const next = queue.current.shift();
      if (!next) return;
      const prev = shown.current;
      show(next);
      if (prev) holdFor(presentationMs(prev, next));
      if (queue.current.length) timer.current = window.setTimeout(step, 30);
    };
    step();
  };
  const enqueue = (g: GameState) => {
    const last = tail.current;
    tail.current = g;
    // Another game, or one that went back in time (a reload from the server): show it at once.
    if (!shown.current || !last || g.setup.seed !== last.setup.seed || g.actionCount < last.actionCount) {
      reset(g);
      return;
    }
    queue.current.push(g);
    if (queue.current.length > MAX_QUEUE) {
      reset(g);
      return;
    }
    pump();
  };

  useEffect(() => {
    if (!session) return;
    const off = session.onGameState((g) => enqueue(g));
    return () => {
      off();
      queue.current = [];
      window.clearTimeout(timer.current);
      timer.current = 0;
      shown.current = null;
      tail.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // The state already there when the table opens, and the end of a game (the room closes, the state goes away).
  useEffect(() => {
    if (!session) return;
    if (!live) {
      if (shown.current || tail.current) reset(null);
    } else if (!shown.current && tail.current !== live) reset(live);
    else if (!shown.current) show(live);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, session]);

  useEffect(() => () => window.clearTimeout(timer.current), []);
}
