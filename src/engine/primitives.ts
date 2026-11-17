// The library of rule primitives for the new factions (docs/FRAKCJE_MACIERZ_I_PRYMITYWY.md, section 1): small, parametrised rules that the abilities of a
// faction pack are built from. Each one changes the state passed in (like the rest of the battle engine) and returns what it did, so that the caller can log
// it. Only primitives the engine did not have are here (pull, swap, group bonus, exhaustion, ground effects); the old abilities (push of the Cyclops, poison,
// slow, root...) stay where they are until `golden.test.ts` can watch a mechanical refactor. Nothing here is used by the two playable factions yet.

import { distance, key, line, parseKey, type HexKey } from './hex';
import { cellsOf, inLayout, pushCell, unitAt } from './battle';
import { manaOf } from './magic';
import type { BattleState, BattleUnit, GameState } from './types';

const nearestCell = (u: BattleUnit, to: HexKey): HexKey => cellsOf(u).reduce((a, c) => (distance(parseKey(c), parseKey(to)) < distance(parseKey(a), parseKey(to)) ? c : a));
const free = (b: BattleState, k: HexKey) => inLayout(b, k) && !b.obstacles.includes(k) && !unitAt(b, k);

/**
 * Push: the target is moved up to `steps` cells straight away from `source` (stops at the arena's edge, an obstacle or a unit). Large units and duels are not
 * pushed. Returns the cells moved (0 when it could not move at all) and `blocked` when it stopped before the full distance (a "collision": the caller may
 * add damage, as the Herds' charge does).
 */
export function pushAway(state: GameState, target: BattleUnit, source: BattleUnit, steps = 1): { moved: number; blocked: boolean } {
  const b = state.battle!;
  if (b.duel || target.tail || !target.pos || !target.alive) return { moved: 0, blocked: true };
  let moved = 0;
  for (let i = 0; i < steps; i++) {
    const to = pushCell(state, nearestCell(source, target.pos), target.pos);
    if (!to) break;
    target.pos = to;
    moved++;
  }
  return { moved, blocked: moved < steps };
}

/**
 * Pull: the target is moved up to `steps` cells straight towards `source`, never onto the source's cell or a taken one, and it stops next to the source.
 * Large units and duels are not pulled. Returns the cells moved.
 */
export function pullIn(state: GameState, target: BattleUnit, source: BattleUnit, steps = 1): { moved: number } {
  const b = state.battle!;
  if (b.duel || target.tail || !target.pos || !target.alive || !source.pos) return { moved: 0 };
  let moved = 0;
  for (let i = 0; i < steps; i++) {
    const from = nearestCell(source, target.pos);
    if (distance(parseKey(from), parseKey(target.pos)) <= 1) break;
    const next = key(line(parseKey(target.pos), parseKey(from))[1]);
    if (!free(b, next)) break;
    target.pos = next;
    moved++;
  }
  return { moved };
}

/** Swap: two living, single-cell units trade cells (an ally with an ally, or an ally with an enemy). False when one of them cannot move that way. */
export function swapPlaces(state: GameState, a: BattleUnit, c: BattleUnit): boolean {
  if (state.battle?.duel || a.id === c.id || !a.alive || !c.alive || !a.pos || !c.pos || a.tail || c.tail) return false;
  [a.pos, c.pos] = [c.pos, a.pos];
  return true;
}

/** Group bonus: `perAlly` for every living ally of the same kind (`defId`) standing next to the unit, at most `max` of them (the Pack and the Swarm). */
export function groupBonus(state: GameState, unit: BattleUnit, perAlly: number, max = 6): number {
  const b = state.battle;
  if (!b || !unit.pos) return 0;
  const own = cellsOf(unit);
  let n = 0;
  for (const x of Object.values(b.units)) {
    if (x.id === unit.id || !x.alive || x.side !== unit.side || x.defId !== unit.defId || !x.pos) continue;
    if (cellsOf(x).some((c) => own.some((o) => distance(parseKey(c), parseKey(o)) === 1))) n++;
  }
  return Math.min(n, max) * perAlly;
}

/** Aura: the living units of `side` within `radius` cells of `center` (the unit itself excluded): the caller applies the effect to each. */
export function inAura(state: GameState, center: BattleUnit, radius: number, side: 'ally' | 'enemy'): BattleUnit[] {
  const b = state.battle;
  if (!b || !center.pos || !center.alive) return [];
  return Object.values(b.units).filter((x) => x.alive && x.pos && x.id !== center.id && (side === 'ally' ? x.side === center.side : x.side !== center.side && x.side !== 'neutral') && distance(parseKey(nearestCell(center, x.pos)), parseKey(x.pos)) <= radius);
}

/** Slow: the unit's next activation has `n` less Szybkość. Stacks to the larger value, not the sum. */
export const slow = (u: BattleUnit, n: number): void => {
  u.status.slowNext = Math.max(u.status.slowNext, n);
};

/** Root: the unit cannot move in its next activation. */
export const root = (u: BattleUnit): void => {
  u.status.rootedNext = true;
};

/** Poison: the unit loses life at the start of each of its next `activations` activations (the longer poison stays, a second one does not add). */
export const poison = (u: BattleUnit, activations: number): void => {
  u.status.poisoned = Math.max(u.status.poisoned ?? 0, activations);
};

/** Exhaustion: the hero loses up to `n` mana (never below 0). Returns what was taken. */
export function drainMana(state: GameState, heroId: string, n: number): number {
  const h = state.heroes[heroId];
  if (!h) return 0;
  const have = manaOf(h);
  const taken = Math.min(have, n);
  h.mana = have - taken;
  return taken;
}

/**
 * A ground effect: a cell that does something to the unit that enters it (a trap, a mire, a claimed field). Kept in the battle state so that the engine's
 * movement can ask `groundAt`; `hidden` ones are not shown to the enemy of the owner. `until` is the round it ends after (missing = the whole battle).
 */
export interface GroundEffect {
  cell: HexKey;
  owner: 'dawn' | 'horde' | string;
  kind: 'trap' | 'mire' | 'claimed';
  /** Damage (trap), Szybkość lost (mire) or the bonus of the claim. */
  power: number;
  hidden?: boolean;
  until?: number;
}

export function placeGround(b: BattleState & { ground?: GroundEffect[] }, effect: GroundEffect): boolean {
  if (!inLayout(b, effect.cell) || b.obstacles.includes(effect.cell)) return false;
  (b.ground ??= []).push(effect);
  return true;
}

export const groundAt = (b: BattleState & { ground?: GroundEffect[] }, cell: HexKey): GroundEffect[] => (b.ground ?? []).filter((g) => g.cell === cell && (g.until === undefined || g.until >= b.round));
