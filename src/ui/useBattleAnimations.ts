// What moves on the arena between two game states: units walking their path, damage and healing
// numbers, blows and shots, fading fallen units, ability seals, shards and die rolls.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { UNITS, type Side } from '../engine/data';
import { movePath, unitDistance } from '../engine/battle';
import { distance, parseKey, type HexKey } from '../engine/hex';
import type { AttackRoll, GameState } from '../engine/types';
import { geometryOf, TOKEN_H as H, TOKEN_W as W } from './arenaGeometry';
import { sfx } from './sfx';
import { scaledMs } from './animSpeed';

/** The Cyclops' boulder leaves his hands 0.62 s after the blow is announced and flies for 0.5 s (styles.css, .projectile.boulder): the hit shows when it lands. */
const BOULDER_LANDS_MS = 1120;

/** Time per cell when a unit walks along its path (matches .token.walking in styles.css). */
export const WALK_STEP_MS = 170;
/** Abilities that have their own sound from the mechanics' effects (not the common spell sound). */
const MECHANIC_SOUNDS = new Set(['waterWall', 'deepWhirl', 'roar', 'tremor', 'shellUp']);
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
    }, scaledMs(ms));
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
  const tideSwapsSeen = useRef(0);
  const healsSeen = useRef(0);
  const teleportsSeen = useRef(0);
  const fxSeen = useRef(0);
  const [fxs, setFxs] = useState<Array<{ key: number; cell: HexKey; kind: string; to?: HexKey }>>([]);
  // Effects of the mechanics (Tides, Herds, Clans) are worked out here from what changed on the board: no engine events needed.
  const actStart = useRef<{ id: string; pos: HexKey | null }>({ id: '', pos: null });
  const logSeen = useRef(0);
  const statusSeen = useRef<Record<string, { pearl: number; shelled: boolean }>>({});
  const runesShown = useRef(new Set<string>());
  const runeBattle = useRef('');
  const wasFighting = useRef(false);
  const [bursts, setBursts] = useState<Array<{ key: number; pos: HexKey; kind: 'storm' | 'scroll'; late: boolean }>>([]);
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
    const moved: Array<{ u: (typeof b.units)[string]; from: HexKey }> = [];
    for (const u of Object.values(b.units)) {
      const prev = lastSeen.current[u.id];
      if (prev?.pos && u.pos && u.alive && prev.pos !== u.pos) moved.push({ u, from: prev.pos });
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
    // A teleport: a burst of light where the unit leaves, and a later one where it lands (the sprite fades out, then in: SpriteLayer's blink).
    const allTp = b.teleports ?? [];
    if (allTp.length < teleportsSeen.current) teleportsSeen.current = 0;
    const newBursts = allTp.slice(teleportsSeen.current).flatMap((t) => (t.kind === 'burrow' ? [] : [{ key: Math.random(), pos: t.from, kind: t.kind as 'storm' | 'scroll', late: false }, { key: Math.random(), pos: t.to, kind: t.kind as 'storm' | 'scroll', late: true }]));
    teleportsSeen.current = allTp.length;
    if (newBursts.length) {
      sfx.play('magic_cast');
      setBursts((x) => [...x, ...newBursts]);
      later(() => setBursts((x) => x.filter((e) => !newBursts.includes(e))), 1500);
    }
    // Light effects of spells, the siege and a rebirth (BattleState.fx).
    const allFx = b.fx ?? [];
    if (allFx.length < fxSeen.current) fxSeen.current = 0;
    const newFx: Array<{ key: number; cell: HexKey; kind: string }> = allFx.slice(fxSeen.current).map((f) => ({ key: Math.random(), cell: f.cell, kind: f.kind }));
    fxSeen.current = allFx.length;
    if (newFx.length) {
      setFxs((x) => [...x, ...newFx]);
      later(() => setFxs((x) => x.filter((e) => !newFx.includes(e))), 1800);
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
    // Effects of the mechanics: the Tides' waves, ropes, pearls and shells, the Herds' pushes, collisions, charges and roars, the Clans' runes.
    const mech: Array<{ key: number; cell: HexKey; kind: string; to?: HexKey }> = [];
    const addFx = (kind: string, cell: HexKey | null | undefined, to?: HexKey) => {
      if (cell) mech.push({ key: Math.random(), cell, kind, ...(to ? { to } : {}) });
    };
    const swaps = b.tideSwaps?.length ?? 0;
    const sounds = new Set<'herds_push' | 'herds_collision' | 'herds_charge' | 'herds_roar' | 'tides_shell' | 'tides_waterWall' | 'tides_whirl'>();
    const activeId = b.activation?.unitId ?? '';
    if (activeId && actStart.current.id !== activeId) actStart.current = { id: activeId, pos: b.units[activeId]?.pos ?? null };
    const sealed = (ab: string) => newSeals.filter((x) => x.ability === ab);
    // The log of this change tells who was really pushed, pulled or swapped (several actions can arrive in one render).
    if (state.log.length < logSeen.current) logSeen.current = 0;
    const newLog = state.log.slice(logSeen.current).filter((l) => l.kind === 'ability').map((l) => l.text);
    logSeen.current = state.log.length;
    const told = (u: { defId: string }, what: string) => newLog.some((t) => t.includes(UNITS[u.defId].name) && t.includes(what));
    // A wave where two units traded places (Przypływ, Odpływ, Wir).
    const swappedNow = swaps > tideSwapsSeen.current || newSeals.some((x) => x.ability === 'ebbTide' || x.ability === 'whirl');
    if (swappedNow) for (const m of moved.filter((x) => told(x.u, 'miejscami'))) addFx('tides_wave', m.u.pos);
    // A rope from the shooter (or the Wąż Morski) to where the pulled enemy stood.
    for (const sl of newSeals.filter((x) => x.ability === 'harpoon' || x.ability === 'deepCoil')) {
      const puller = Object.values(b.units).find((x) => x.pos === sl.pos);
      for (const m of moved.filter((x) => puller && x.u.side !== puller.side && told(x.u, 'przyciągnięty'))) addFx('tides_rope', sl.pos, m.from);
    }
    for (const sl of sealed('deepWhirl')) addFx('tides_whirl', sl.pos);
    for (const sl of sealed('waterWall')) (addFx('tides_waterwall', sl.pos), sounds.add('tides_waterWall'));
    if (sealed('deepWhirl').length) sounds.add('tides_whirl');
    for (const sl of [...sealed('roar'), ...sealed('tremor')]) (addFx('herds_roar', sl.pos), sounds.add('herds_roar'));
    // Pearl shield and shell: a status that was not there a moment ago (the first sight of a unit is not news: the Spark gives the pearl at the start).
    for (const u of Object.values(b.units)) {
      const seen = statusSeen.current[u.id];
      const now = { pearl: u.status.pearl ?? 0, shelled: Boolean(u.status.shelled) };
      if (seen && wasFighting.current && u.pos && u.alive) {
        if (now.pearl > seen.pearl) addFx('tides_pearl', u.pos);
        if (now.shelled && !seen.shelled) (addFx('tides_shell', u.pos), sounds.add('tides_shell'));
      }
      statusSeen.current[u.id] = now;
    }
    // Herds: the target of a blow is pushed (dust), what it hits shakes (collision), a unit that ran before its blow raises dust (charge).
    const attackerNow = prevActive.current ? b.units[prevActive.current] : undefined;
    if (attackerNow && UNITS[attackerNow.defId].side === 'herds') {
      for (const m of moved.filter((x) => x.u.side !== attackerNow.side && x.u.id !== attackerNow.id && told(x.u, 'odepchnięty'))) (addFx('herds_push', m.u.pos), sounds.add('herds_push'));
      const ran = actStart.current.id === attackerNow.id && actStart.current.pos && attackerNow.pos ? distance(parseKey(actStart.current.pos), parseKey(attackerNow.pos)) : 0;
      if (ran >= 2 && newStrikes.some((st) => st.attacker === attackerNow.id && !st.ranged)) (addFx('herds_charge', attackerNow.pos), sounds.add('herds_charge'));
    }
    for (const t of newLog) {
      if (!t.includes(': zderzenie (')) continue;
      const name = t.split(' uderza ')[0];
      const hitUnit = Object.values(b.units).find((x) => x.pos && UNITS[x.defId].name === name);
      if (hitUnit) (addFx('herds_collision', hitUnit.pos), sounds.add('herds_collision'));
    }
    // Runes glow on a unit of the Clans when its first activation in the battle begins.
    const battleKey = Object.keys(b.units).join();
    if (runeBattle.current !== battleKey) (runeBattle.current = battleKey, runesShown.current.clear());
    const act = b.units[activeId];
    if (act?.pos && act.alive && act.side !== 'neutral' && !runesShown.current.has(act.id)) {
      runesShown.current.add(act.id);
      if ((state.factions[act.side as keyof typeof state.factions]?.runes?.[act.defId] ?? []).length) addFx('clans_rune', act.pos);
    }
    wasFighting.current = b.stage === 'fight';
    for (const n of sounds) sfx.play(n);
    if (mech.length) {
      setFxs((x) => [...x, ...mech]);
      later(() => setFxs((x) => x.filter((e) => !mech.includes(e))), 1800);
    }
    const newShards = hit.map((id) => {
      const u = b.units[id];
      return { key: Math.random(), pos: (u.pos ?? lastSeen.current[id]?.pos)!, gold: !u.alive };
    }).filter((x) => x.pos);
    // Brotherhood of the Tide: a tide swap (Przypływ) has its own wave sound; harpoon pulls and pearl shields their own too.
    if (swaps > tideSwapsSeen.current) sfx.play('tides_tideSwap');
    tideSwapsSeen.current = swaps;
    if (newSeals.length) {
      const named = newSeals.map((x) => x.ability);
      // Iron Clan: a wall of shields (Przysięga Tarczy, Fortyfikacja) and the ancestors' hammer stun have their own sounds.
      const seal = named.includes('pearlShield') ? 'tides_pearlShield' : named.some((a) => a === 'harpoon' || a === 'deepCoil') ? 'tides_harpoonPull' : named.some((a) => a === 'shieldOath' || a === 'fortify') ? 'clans_shieldWall' : named.includes('stunBlow') ? 'clans_stun' : named.some((a) => MECHANIC_SOUNDS.has(a)) ? null : 'magic_cast';
      if (seal) sfx.play(seal);
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
    for (const st of newStrikes.filter((x, i, all) => all.findIndex((o) => o.attacker === x.attacker && o.ranged === x.ranged) === i)) sfx.unit(b.units[st.attacker]?.defId ?? st.attacker, 'atak', MAGIC_ATTACKERS.has(st.attacker) ? 'magic_attack' : st.ranged ? 'arrow_shot' : 'sword_hit');
    setStrikes((x) => [...x, ...newStrikes.filter((st, i, all) => all.findIndex((o) => o.attacker === st.attacker) === i || st.ranged)]);
    setGhosts((g) => [...g, ...newGhosts]);
    // A fallen unit's own cry, as the blow that killed it lands.
    whenLanded(() => later(() => newGhosts.forEach((gh) => sfx.unit(gh.defId, 'smierc')), 250));
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

  return { walk, floaters, hitIds, strikes, ghosts, seals, shards, bursts, fxs, rollPops, lastStrike };
}
