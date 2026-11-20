// The library of rule primitives for the new factions (docs/FRAKCJE_MACIERZ_I_PRYMITYWY.md, section 1): small, parametrised rules that the abilities of a
// faction pack are built from. Each one changes the state passed in (like the rest of the battle engine) and returns what it did, so that the caller can log
// it. Only primitives the engine did not have are here (pull, swap, group bonus, exhaustion, ground effects); the old abilities (push of the Cyclops, poison,
// slow, root...) stay where they are until `golden.test.ts` can watch a mechanical refactor. The Dzikie Stado use the push with a collision, the resistance to being moved, the bonus for the target's state and the taunt (docs/frakcje/herds.md).

import { distance, key, line, parseKey, type HexKey } from './hex';
import { abilityActive, abilityOf, battleFx, cellsOf, dealDamage, fitsAt, formationAnchored, freeCellNear, inLayout, nearestFreeCell, placeUnit, pushCell, scaleOf, stepOnFields, unitAt, unitDistance } from './battle';
import { log } from './log';
import { supportTier, UNITS, type AbilityId, type Side } from './data';
import { manaOf } from './magic';
import type { BattleState, BattleUnit, GameState, GroundEffect } from './types';

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

export type { GroundEffect } from './types';

export function placeGround(b: BattleState, effect: GroundEffect): boolean {
  if (!inLayout(b, effect.cell) || b.obstacles.includes(effect.cell)) return false;
  (b.ground ??= []).push(effect);
  return true;
}

export const groundAt = (b: BattleState, cell: HexKey): GroundEffect[] => (b.ground ?? []).filter((g) => g.cell === cell && (g.until === undefined || g.until >= b.round));

// ---------------------------------------------------------------- the Herds: push with a collision, resistance, a bonus for the target's state, taunt

/** Abilities of units that cannot be pushed, pulled or moved (Niewzruszony, Ziemia Drży). */
export const IMMOVABLE_ABILITIES: readonly AbilityId[] = ['unmoved', 'tremor', 'fortify', 'longNight', 'livingReef'];

/** Whether the unit may be moved against its will: not a large one, not in a duel, not an immovable one. */
export function canBeMoved(state: GameState, u: BattleUnit): boolean {
  const b = state.battle;
  if (!b || b.duel || u.tail || !u.pos || !u.alive) return false;
  // Runa Kamienia and the Sala Tarcz (level III, in formation) hold a unit in place as well.
  if (u.status.unmovable || u.status.dugIn || formationAnchored(state, u)) return false;
  // Strażnik Bram: the Lamassu keeps its neighbours in place.
  if (abilityActive(state) && Object.values(b.units).some((x) => x.alive && x.pos && x.side === u.side && x.id !== u.id && !x.status.mirage && abilityOf(x) === 'gateWard' && unitDistance(x, u) === 1)) return false;
  return !(abilityActive(state) && IMMOVABLE_ABILITIES.includes(abilityOf(u)));
}

/** What a push did: the cells moved and what stopped it (null: it went the whole way). */
export interface PushOutcome {
  moved: number;
  /** 'edge' (the arena ends), 'obstacle' (a boulder, a wall) or 'unit' (another unit stands there); null when nothing stopped the push. */
  stoppedBy: 'edge' | 'obstacle' | 'unit' | 'immovable' | null;
  /** The unit that was hit, when `stoppedBy` is 'unit'. */
  hit?: BattleUnit;
}

/** The cell one step straight away from `from` through `target`, and what is there. */
function pushStep(state: GameState, from: HexKey, target: HexKey): { cell: HexKey | null; stoppedBy: PushOutcome['stoppedBy']; hit?: BattleUnit } {
  const b = state.battle!;
  const a = parseKey(from);
  const t = parseKey(target);
  const cell = line(a, { q: 2 * t.q - a.q, r: 2 * t.r - a.r })[distance(a, t) + 1];
  if (!cell) return { cell: null, stoppedBy: 'edge' };
  const k = key(cell);
  if (!inLayout(b, k)) return { cell: null, stoppedBy: 'edge' };
  if (b.obstacles.includes(k)) return { cell: null, stoppedBy: 'obstacle' };
  const hit = unitAt(b, k);
  if (hit) return { cell: null, stoppedBy: 'unit', hit };
  return { cell: k, stoppedBy: null };
}

/**
 * Tętent: pushes the target up to `steps` cells straight away from `source`. A target that is stopped (by the edge of the arena, an obstacle or another
 * unit) COLLIDES: it takes `damage` (a damage already in the battle's scale; 0 = a plain push) and so does the unit it hits. A unit that cannot be moved
 * (large, immovable, in a duel) does not move and does not collide. The target is marked as pushed in this round (Lot na Strzelców reads it), steps on
 * charged fields on the way, and a living target keeps its place; a unit that dies of the collision leaves the board (the caller checks the battle's end).
 */
export function pushWithCollision(state: GameState, target: BattleUnit, source: BattleUnit, steps: number, damage: number, label: string): PushOutcome {
  const b = state.battle!;
  if (!canBeMoved(state, target)) {
    if (target.alive && (target.status.unmovable || formationAnchored(state, target) || (abilityActive(state) && IMMOVABLE_ABILITIES.includes(abilityOf(target))))) log(state, 'ability', `${UNITS[target.defId].name} stoi niewzruszenie (${label}).`);
    return { moved: 0, stoppedBy: 'immovable' };
  }
  let moved = 0;
  let stoppedBy: PushOutcome['stoppedBy'] = null;
  let hit: BattleUnit | undefined;
  for (let i = 0; i < steps; i++) {
    const step = pushStep(state, nearestCell(source, target.pos!), target.pos!);
    if (!step.cell) {
      stoppedBy = step.stoppedBy;
      hit = step.hit;
      break;
    }
    target.pos = step.cell;
    moved++;
  }
  if (moved > 0) {
    target.status.pushedRound = b.round;
    stepOnFields(state, target);
    log(state, 'ability', `${UNITS[target.defId].name} zostaje odepchnięty (pól: ${moved}; ${label}).`);
  }
  if (stoppedBy && target.alive) {
    if (moved === 0) target.status.pushedRound = b.round;
    const where = stoppedBy === 'edge' ? 'w krawędź areny' : stoppedBy === 'obstacle' ? 'w głaz' : `w jednostkę ${hit ? UNITS[hit.defId].name : ''}`;
    if (damage > 0) {
      log(state, 'ability', `${UNITS[target.defId].name} uderza ${where}: zderzenie (${label}).`);
      dealDamage(state, target, damage, `Zderzenie (${label})`);
      if (hit && hit.alive) dealDamage(state, hit, damage, `Zderzenie (${label})`);
    }
  }
  return { moved, stoppedBy, ...(hit ? { hit } : {}) };
}

/** What a push would do, without doing it (the bots weigh a blow by it): the cells it would move and what would stop it. */
export function previewPush(state: GameState, target: BattleUnit, source: BattleUnit, steps: number): PushOutcome {
  if (!canBeMoved(state, target)) return { moved: 0, stoppedBy: 'immovable' };
  let pos = target.pos!;
  let moved = 0;
  for (let i = 0; i < steps; i++) {
    const step = pushStep(state, nearestCell(source, pos), pos);
    if (!step.cell) return { moved, stoppedBy: step.stoppedBy, ...(step.hit ? { hit: step.hit } : {}) };
    pos = step.cell;
    moved++;
  }
  return { moved, stoppedBy: null };
}

/** Premia za stan celu: whether the unit was pushed in the round that is going on. */
export const pushedThisRound = (state: GameState, u: BattleUnit): boolean => state.battle !== null && u.status.pushedRound === state.battle.round;

/** Prowokacja: whether `u` is forced to attack only its challenger now (the challenger lives and stands on the board). */
export function taunter(state: GameState, u: BattleUnit): BattleUnit | null {
  const id = u.status.tauntedBy;
  const t = id ? state.battle?.units[id] : undefined;
  return t && t.alive && t.pos ? t : null;
}

/** The scale of a collision's damage in this battle (the numbers of `ABILITY` are small-scale). */
export const collisionOf = (state: GameState, smallScale: number): number => smallScale * scaleOf(state);

// ---------------------------------------------------------------- the Kingdom of the Dead: raising the fallen in the field

/** The supports of `side` that lie fallen in the battle (they can rise again), the strongest tier first, then the most Życie, then by id; `maxTier` limits the tier. */
export function fallenSupports(state: GameState, side: Side, maxTier = 6): BattleUnit[] {
  const b = state.battle;
  if (!b || b.duel) return [];
  return Object.values(b.units)
    .filter((u) => !u.alive && !u.pos && !u.swappedOut && u.side === side && UNITS[u.defId].kind === 'support' && supportTier(u.defId) <= maxTier)
    .sort((x, y) => supportTier(y.defId) - supportTier(x.defId) || y.maxHp - x.maxHp || (x.id < y.id ? -1 : 1));
}

/**
 * Raising in the field: a fallen unit stands up with `hp` Życie (at least 1, at most its maximum) on the free cell nearest to `near` (the cell where it fell,
 * or the unit that calls it: pass its cell), or on a free cell of its side's start when `near` is null. Its temporary statuses are cleared; it is marked as
 * having risen (a Resurrection treasure does not raise it again). Returns false when there is no room.
 */
export function raiseUnit(state: GameState, unit: BattleUnit, near: HexKey | null, hp: number, label: string): boolean {
  const b = state.battle!;
  if (unit.alive || b.duel) return false;
  const cell = near ? nearestFreeCell(state, unit, near) : freeCellNear(state, unit.side, unit);
  if (!cell || !fitsAt(state, unit, cell)) return false;
  const tail = cell === unit.corpse ? unit.corpseTail : undefined;
  unit.alive = true;
  unit.hp = Math.max(1, Math.min(unit.maxHp, hp));
  placeUnit(state, unit, cell, tail);
  delete unit.corpse;
  delete unit.corpseTail;
  unit.status.slowNext = 0;
  unit.status.rootedNext = false;
  unit.status.cursedNext = 0;
  delete unit.status.poisoned;
  delete unit.status.tauntedBy;
  delete unit.status.reassemble;
  unit.status.risen = true;
  battleFx(state, 'odrodzenie', unit.pos);
  (b.heals ??= []).push({ unitId: unit.id, amount: unit.hp });
  log(state, 'ability', `${UNITS[unit.defId].name} wstaje (Ż ${unit.hp}/${unit.maxHp}; ${label}).`);
  return true;
}
