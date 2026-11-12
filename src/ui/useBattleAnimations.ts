// What moves on the arena between two game states: units walking their path, damage and healing
// numbers, blows and shots, fading fallen units, ability seals, shards and die rolls.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { UNITS, type Side } from '../engine/data';
import { movePath, unitDistance } from '../engine/battle';
import type { HexKey } from '../engine/hex';
import type { AttackRoll, GameState } from '../engine/types';
import { geometryOf, TOKEN_H as H, TOKEN_W as W } from './arenaGeometry';
import { sfx } from './sfx';

/** The Cyclops' boulder leaves his hands 0.62 s after the blow is announced and flies for 0.5 s (styles.css, .projectile.boulder): the hit shows when it lands. */
const BOULDER_LANDS_MS = 1120;

/** Time per cell when a unit walks along its path (matches .token.walking in styles.css). */
export const WALK_STEP_MS = 170;
/** Units whose blow is a spell (it has its own sound, not a blade or a bowstring; report 216950). */
const MAGIC_ATTACKERS = new Set(['goblinShaman', 'elfDruid', 'nymph']);

export interface Strike {
  key: number;
  from: HexKey;
  to: HexKey;
  ranged: boolean;
  attacker: string;
}

export type BattleAnimations = ReturnType<typeof useBattleAnimations>;

export function useBattleAnimations(state: GameState) {
  const b = state.battle!;
  const { cellPos } = geometryOf(b.layout);

  // Animation clean-ups run to the end even when the next action comes first (bots act every 120–450 ms);
  // they are dropped only when the arena goes away.
  const timers = useRef(new Set<number>());
  const later = (f: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      f();
    }, ms);
    timers.current.add(t);
  };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Walking: a unit that moved several cells is shown stepping hex by hex along the path it
  // really took (around obstacles and enemies), worked out on the state before the move.
  const prevState = useRef(state);
  const [walk, setWalk] = useState<Record<string, HexKey>>({});
  useLayoutEffect(() => {
    const before = prevState.current;
    prevState.current = state;
    const pb = before.battle;
    if (!pb || pb === b) return;
    for (const u of Object.values(b.units)) {
      const was = pb.units[u.id];
      if (!was?.pos || !u.pos || was.pos === u.pos || !was.alive || !u.alive) continue;
      const path = movePath(before, was, u.pos);
      if (path.length < 3) continue;
      setWalk((w) => ({ ...w, [u.id]: path[0] }));
      // Step by step, then hand the token back to its real position.
      const steps = path.slice(1);
      const timer = (ms: number, f: (w: Record<string, HexKey>) => void) =>
        later(() => setWalk((w) => { const next = { ...w }; f(next); return next; }), ms);
      steps.forEach((k, i) => timer(20 + i * WALK_STEP_MS, (w) => (w[u.id] = k)));
      timer(20 + steps.length * WALK_STEP_MS, (w) => delete w[u.id]);
    }
  }, [b]);

  // Floating damage / healing numbers: diff unit HP between renders.
  // Also drives the attack animations: who struck whom, and fading-out fallen units.
  const lastSeen = useRef<Record<string, { hp: number; pos: HexKey | null; alive: boolean }>>({});
  const prevActive = useRef<string | null>(null);
  const [floaters, setFloaters] = useState<Array<{ key: number; amount: number; x: number; y: number }>>([]);
  const [hitIds, setHitIds] = useState<string[]>([]);
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [ghosts, setGhosts] = useState<Array<{ key: number; defId: string; side: Side; pos: HexKey }>>([]);
  const [seals, setSeals] = useState<Array<{ key: number; ability: string; pos: HexKey; color: string }>>([]);
  const [shards, setShards] = useState<Array<{ key: number; pos: HexKey; gold: boolean }>>([]);
  const abilitySeen = useRef<Record<string, boolean>>({});
  const healsSeen = useRef(0);
  useEffect(() => {
    const fresh: Array<{ key: number; amount: number; x: number; y: number }> = [];
    const hit: string[] = [];
    const newStrikes: typeof strikes = [];
    const newGhosts: typeof ghosts = [];
    const attacker = prevActive.current ? b.units[prevActive.current] : undefined;
    // Life a unit regained by itself since the last render (the next activation began right after a blow): shown apart from the blow, not netted against it.
    const allHeals = b.heals ?? [];
    if (allHeals.length < healsSeen.current) healsSeen.current = 0; // a new battle
    const healedBy: Record<string, number> = {};
    for (const h of allHeals.slice(healsSeen.current)) healedBy[h.unitId] = (healedBy[h.unitId] ?? 0) + h.amount;
    healsSeen.current = allHeals.length;
    const healFresh: typeof fresh = [];
    for (const u of Object.values(b.units)) {
      const prev = lastSeen.current[u.id];
      const healed = healedBy[u.id] ?? 0;
      if (prev && (prev.hp !== u.hp || healed)) {
        const where = u.pos ?? prev.pos;
        const delta = u.hp - prev.hp - healed;
        if (where) {
          const { x, y } = cellPos(where);
          if (delta) fresh.push({ key: Math.random(), amount: delta, x: x + W / 2, y: y + H / 2 - 40 });
          if (healed) healFresh.push({ key: Math.random(), amount: healed, x: x + W / 2, y: y + H / 2 - 40 });
          if (delta < 0 && attacker && attacker.id !== u.id && attacker.side !== u.side && attacker.pos) {
            // A shooter next to its target fights in melee: no arrow or boulder flies (it has its own close-combat clip).
            newStrikes.push({ key: Math.random(), from: attacker.pos, to: where, ranged: UNITS[attacker.defId].attackType === 'ranged' && unitDistance(attacker, u) > 1, attacker: attacker.id });
          }
        }
        if (delta < 0) hit.push(u.id);
      }
      if (prev?.alive && !u.alive && !u.swappedOut && prev.pos) newGhosts.push({ key: Math.random(), defId: u.defId, side: u.side, pos: prev.pos });
      lastSeen.current[u.id] = { hp: u.hp, pos: u.pos ?? prev?.pos ?? null, alive: u.alive };
    }
    prevActive.current = b.activation?.unitId ?? null;
    // Ability seals: a unit's ability flag flipped since the last render.
    const newSeals: typeof seals = [];
    for (const u of Object.values(b.units)) {
      if (u.abilityUsed && abilitySeen.current[u.id] === false && (u.pos ?? lastSeen.current[u.id]?.pos)) {
        newSeals.push({ key: Math.random(), ability: UNITS[u.defId].ability, pos: (u.pos ?? lastSeen.current[u.id].pos)!, color: u.side === 'dawn' ? '#9BE88A' : u.side === 'horde' ? '#FF7A5A' : '#9EE4FF' });
      }
      abilitySeen.current[u.id] = u.abilityUsed;
    }
    const newShards = hit.map((id) => {
      const u = b.units[id];
      return { key: Math.random(), pos: (u.pos ?? lastSeen.current[id]?.pos)!, gold: !u.alive };
    }).filter((x) => x.pos);
    if (newSeals.length) {
      sfx.play('magic_cast');
      setSeals((x) => [...x, ...newSeals]);
      later(() => setSeals((x) => x.filter((s) => !newSeals.includes(s))), 1400);
    }
    // A thrown boulder is still in the air: the hit, its sparks and the damage numbers wait until it lands.
    const wait = newStrikes.some((st) => st.ranged && st.attacker === 'cyclops') ? BOULDER_LANDS_MS : 0;
    const whenLanded = (f: () => void) => (wait ? later(f, wait) : f());
    if (newShards.length) {
      whenLanded(() => {
        setShards((x) => [...x, ...newShards]);
        later(() => setShards((x) => x.filter((s) => !newShards.includes(s))), 700);
      });
    }
    if (healFresh.length) {
      // After the blow's number, so both are read: −6, then +5.
      later(() => {
        setFloaters((f) => [...f, ...healFresh]);
        later(() => setFloaters((f) => f.filter((x) => !healFresh.includes(x))), 1150);
      }, wait + 700);
    }
    if (!fresh.length && !newGhosts.length) return;
    // One sound per attacker: a blade for a melee blow, a bowstring for a shot.
    for (const st of newStrikes.filter((x, i, all) => all.findIndex((o) => o.attacker === x.attacker && o.ranged === x.ranged) === i)) sfx.play(MAGIC_ATTACKERS.has(st.attacker) ? 'magic_attack' : st.ranged ? 'arrow_shot' : 'sword_hit');
    setStrikes((x) => [...x, ...newStrikes.filter((st, i, all) => all.findIndex((o) => o.attacker === st.attacker) === i || st.ranged)]);
    setGhosts((g) => [...g, ...newGhosts]);
    whenLanded(() => {
      setFloaters((f) => [...f, ...fresh]);
      setHitIds((ids) => [...ids.filter((id) => !hit.includes(id)), ...hit]);
      later(() => {
        setFloaters((f) => f.filter((x) => !fresh.includes(x)));
        setHitIds((ids) => ids.filter((id) => !hit.includes(id)));
      }, 1150);
    });
    later(() => {
      setStrikes((x) => x.filter((st) => !newStrikes.includes(st)));
      setGhosts((g) => g.filter((x) => !newGhosts.includes(x)));
    }, wait + 1150);
  }, [b]);

  /** The newest blow of a unit still being animated (a fast bot may strike again before the last one fades). */
  const lastStrike = (id: string, ranged: boolean) => [...strikes].reverse().find((st) => st.attacker === id && st.ranged === ranged);

  // Die rolls: each new attack shows its die over the unit that took the blow
  // (a blow cut to 0 shows a 0 drop too, since no HP changed).
  const rollSeen = useRef(b.rolls?.[b.rolls.length - 1]?.seq ?? 0);
  const [rollPops, setRollPops] = useState<Array<{ key: number; roll: AttackRoll; x: number; y: number }>>([]);
  useEffect(() => {
    const rolls = b.rolls ?? [];
    const latest = rolls[rolls.length - 1]?.seq ?? 0;
    if (latest < rollSeen.current) rollSeen.current = 0; // a new battle starts counting again
    const fresh = rolls.filter((r) => r.seq > rollSeen.current);
    rollSeen.current = latest;
    const pops = fresh.flatMap((roll) => {
      const where = b.units[roll.targetId].pos ?? lastSeen.current[roll.targetId]?.pos;
      if (!where || (roll.die === null && roll.damage > 0)) return [];
      const { x, y } = cellPos(where);
      return [{ key: Math.random(), roll, x: x + W / 2 - (roll.damage > 0 ? 34 : 0), y: y + H / 2 - 44 }];
    });
    if (!pops.length) return;
    setRollPops((p) => [...p, ...pops]);
    later(() => setRollPops((p) => p.filter((x) => !pops.includes(x))), 2200);
  }, [b]);

  return { walk, floaters, hitIds, strikes, ghosts, seals, shards, rollPops, lastStrike };
}
