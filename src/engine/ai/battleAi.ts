// Heuristic battle AI. It is greedy and deterministic: equal scores are broken
// by stable ordering, so simulations replay exactly from a seed.

import { ABILITY, UNITS, type FactionId } from '../data';
import {
  abilityActive,
  abilityOf,
  attackDamage,
  attackTargets,
  ATTACK_ABILITIES,
  breathSecondTarget,
  canHitTwo,
  canUseBattleItem,
  deployCells,
  cellOf,
  enemiesOf,
  hopCells,
  livingUnits,
  MIDDLE_HALF,
  reachableCells,
  unitAttackBase,
  unitSpeed,
} from '../battle';
import { distance, parseKey, type HexKey } from '../hex';
import type { Action, BattleUnit, GameState } from '../types';
import type { ItemKind } from '../data';

const dist = (a: HexKey, b: HexKey) => distance(parseKey(a), parseKey(b));

export function chooseSupports(state: GameState, faction: FactionId): Action {
  const pool = [...state.factions[faction].supportsAlive];
  const automaton = state.setup.mode === 'coop' && faction === 'horde';
  // The easy arena bot picks its supports at random, as the automaton does.
  const careless = state.setup.mode === 'arena' && state.setup.botLevel === 'kids';
  let picked: string[];
  if (automaton || careless) {
    // Spec: coop evil supports are chosen at random among the living.
    picked = pool.slice().sort((a, b) => hashPick(state, a) - hashPick(state, b)).slice(0, 2);
  } else {
    picked = pool.slice().sort((a, b) => supportValue(b) - supportValue(a)).slice(0, 2);
  }
  return { type: 'selectSupports', faction, supportIds: picked };
}

/**
 * How much a treasure is worth to the bot in an arena draft. Kinds it cannot use (see itemToUse)
 * are worth nothing, so it never drafts them unless nothing else is offered.
 */
const DRAFT_VALUE: Partial<Record<ItemKind, number>> = { resurrection: 9, stone: 8, sword: 7, seed: 7, lightning: 7, heal: 6, damage_scroll: 6, shield: 6, vitality: 6, boots: 4 };

/**
 * Arena draft: the hard bot takes the most valuable card, the normal one usually does (now and then
 * the second best), the easy one picks at random.
 */
export function chooseDraftPick(state: GameState, faction: FactionId): Action {
  const offer = state.draft!.offer;
  const level = state.setup.botLevel ?? 'normal';
  let kind: ItemKind;
  if (level === 'kids') kind = offer[hashPick(state, faction) % offer.length];
  else {
    const ranked = [...offer].sort((a, b) => (DRAFT_VALUE[b] ?? 0) - (DRAFT_VALUE[a] ?? 0) || (a < b ? -1 : 1));
    const second = level === 'normal' && ranked.length > 1 && (DRAFT_VALUE[ranked[1]] ?? 0) > 0 && hashPick(state, faction) % 3 === 0;
    kind = second ? ranked[1] : ranked[0];
  }
  return { type: 'draftPick', faction, kind };
}

function hashPick(state: GameState, id: string): number {
  let h = state.rng ^ state.actionCount;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function supportValue(id: string): number {
  const d = UNITS[id];
  return d.hp + d.attack * 1.5 + (d.attackType === 'ranged' ? 2 : 0);
}

/** Danger of standing on `cell`: how much damage enemies could deal there next round. */
function danger(state: GameState, u: BattleUnit, cell: HexKey): number {
  let total = 0;
  for (const e of enemiesOf(state.battle!, u)) {
    const reach = unitSpeed(e) + (UNITS[e.defId].attackType === 'ranged' ? 99 : 1);
    if (dist(e.pos!, cell) <= reach) total += unitAttackBase(e);
  }
  return total;
}

interface Plan {
  moveTo: HexKey | null;
  target: BattleUnit | null;
  second: BattleUnit | null;
  useAbility: boolean;
  score: number;
}

function planActivation(state: GameState, u: BattleUnit): Plan {
  const b = state.battle!;
  const act = b.activation!;
  const options: Array<[HexKey, number]> = [[u.pos!, 0]];
  if (!act.moved && !act.attacked) for (const [k, d] of reachableCells(state, u)) options.push([k, d]);
  const enemies = enemiesOf(b, u);
  const ranged = UNITS[u.defId].attackType === 'ranged';
  let best: Plan = { moveTo: null, target: null, second: null, useAbility: false, score: -Infinity };
  for (const [cell, steps] of options) {
    const moved = act.movedDistance + steps;
    // Caution fades as the battle drags on, so nobody kites forever.
    const caution = Math.max(0, 1 - (b.round - 1) / 6);
    const risk = (danger(state, u, cell) / Math.max(1, u.hp)) * caution;
    const targets = act.attacked || act.moveOnly ? [] : attackTargets(state, u, cell);
    for (const t of targets) {
      for (const useAbility of abilityChoices(state, u)) {
        const dmg = attackDamage(state, u, t, useAbility, moved);
        let score = scoreHit(t, dmg);
        let second: BattleUnit | null = null;
        if (useAbility && abilityOf(u) === 'fireBreath') {
          second = breathSecondTarget(state, u, t, cell);
          if (!second) continue;
          score += scoreHit(second, dmg);
        }
        if (canHitTwo(state, u)) {
          second = targets.filter((x) => x.id !== t.id && dist(x.pos!, cell) === 1).sort((x, y) => scoreHit(y, dmg) - scoreHit(x, dmg))[0] ?? null;
          if (second) score += scoreHit(second, dmg);
        }
        if (useAbility && ['entanglingRoots', 'curse'].includes(abilityOf(u))) score += 1.5;
        score -= risk * (ranged ? 3 : 1.5);
        if (ranged && targets.some((x) => dist(x.pos!, cell) === 1)) score -= 2;
        if (score > best.score) best = { moveTo: cell === u.pos ? null : cell, target: t, second, useAbility, score };
      }
    }
    // Positional value when not attacking from this cell.
    const nearest = Math.min(...enemies.map((e) => dist(e.pos!, cell)));
    let pos = ranged ? -Math.abs(nearest - 4) * 0.4 : -nearest * 0.6;
    pos -= risk * (ranged ? 2.5 : 1);
    if (pos > best.score) best = { moveTo: cell === u.pos ? null : cell, target: null, second: null, useAbility: false, score: pos };
  }
  return best;
}

function abilityChoices(state: GameState, u: BattleUnit): boolean[] {
  const ab = abilityOf(u);
  if (u.abilityUsed || !abilityActive(state, u) || !ATTACK_ABILITIES.includes(ab)) return [false];
  return [true, false];
}

function scoreHit(t: BattleUnit, dmg: number): number {
  const isLeader = UNITS[t.defId].kind !== 'support';
  if (dmg >= t.hp) return 12 + (isLeader ? 8 : 0) + UNITS[t.defId].attack;
  return dmg * (isLeader ? 1.3 : 1) + (t.maxHp - t.hp) * 0.15;
}

function freeAbility(state: GameState, u: BattleUnit): Action | null {
  if (u.abilityUsed || !abilityActive(state, u)) return null;
  const b = state.battle!;
  const ab = abilityOf(u);
  if (ab === 'sunburst' && livingUnits(b, u.side).length >= 2) return { type: 'battleAbility' };
  if (ab === 'giftOfLife') {
    const hurt = livingUnits(b, u.side)
      .filter((x) => x.maxHp - x.hp >= 3)
      .sort((x, y) => (UNITS[y.defId].kind === 'support' ? 0 : 1) - (UNITS[x.defId].kind === 'support' ? 0 : 1))[0];
    if (hurt) return { type: 'battleAbility', targetId: hurt.id };
  }
  if (ab === 'web') {
    const t = enemiesOf(b, u)
      .filter((e) => dist(e.pos!, u.pos!) <= ABILITY.webRange)
      .sort((x, y) => unitAttackBase(y) - unitAttackBase(x))[0];
    if (t) return { type: 'battleAbility', targetId: t.id };
  }
  return null;
}

function itemToUse(state: GameState, u: BattleUnit): Action | null {
  const faction = u.side as FactionId;
  if (!canUseBattleItem(state, faction)) return null;
  const b = state.battle!;
  const inv = state.factions[faction].inventory.map((id) => state.items[id]);
  const own = livingUnits(b, faction);
  const enemies = enemiesOf(b, u);
  for (const item of inv) {
    switch (item.kind) {
      case 'resurrection': {
        const deadLeader = Object.values(b.units).find((x) => x.side === faction && !x.alive && !x.swappedOut && UNITS[x.defId].kind === 'hero');
        if (deadLeader) return { type: 'battleItem', itemId: item.id, targetId: deadLeader.id };
        // In the arena the elixir is worth nothing after the battle: a fallen support comes back too.
        const deadSupport = state.setup.mode === 'arena' && Object.values(b.units).find((x) => x.side === faction && !x.alive && !x.swappedOut);
        if (deadSupport) return { type: 'battleItem', itemId: item.id, targetId: deadSupport.id };
        break;
      }
      case 'heal': {
        const t = own.find((x) => x.maxHp - x.hp >= 4 && x.hp <= x.maxHp / 2);
        if (t) return { type: 'battleItem', itemId: item.id, targetId: t.id };
        break;
      }
      case 'seed':
        if (own.filter((x) => x.maxHp - x.hp >= 2).length >= 2) return { type: 'battleItem', itemId: item.id };
        break;
      case 'damage_scroll': {
        const t = enemies.find((e) => e.hp <= 3);
        if (t) return { type: 'battleItem', itemId: item.id, targetId: t.id };
        break;
      }
      case 'lightning': {
        const ts = enemies.filter((e) => e.hp <= 2);
        if (ts.length || enemies.length >= 2) return { type: 'battleItem', itemId: item.id, targetIds: (ts.length ? ts : enemies).slice(0, 2).map((e) => e.id) };
        break;
      }
      case 'sword':
      case 'vitality':
      case 'stone':
        if (UNITS[u.defId].kind === 'hero' && b.round === 1) return { type: 'battleItem', itemId: item.id, targetId: u.id };
        break;
      case 'shield':
        if (UNITS[u.defId].kind === 'hero' && u.hp <= 5) return { type: 'battleItem', itemId: item.id, targetId: u.id };
        break;
      case 'boots':
        // Arena only: the coop automaton keeps to the rulebook's list of treasures it uses.
        if (state.setup.mode === 'arena' && UNITS[u.defId].kind === 'hero' && b.round === 1) return { type: 'battleItem', itemId: item.id, targetId: u.id };
        break;
      default:
        break;
    }
  }
  return null;
}

/** Bots keep heroes central, put shooters on the rows farthest from the enemy's strongest unit. */
function chooseDeployment(state: GameState, faction: FactionId): Action {
  const b = state.battle!;
  const own = Object.values(b.units).filter((u) => u.side === faction);
  const cells = deployCells(b, faction).sort((x, y) => Math.abs(cellOf(x).half - MIDDLE_HALF) - Math.abs(cellOf(y).half - MIDDLE_HALF));
  const order = own.slice().sort((x, y) => rank(x) - rank(y));
  const positions: Record<string, HexKey> = {};
  // Melee first takes central cells, shooters the outer ones.
  order.forEach((u, i) => (positions[u.id] = cells[i]));
  return { type: 'deployUnits', faction, positions };
}

function rank(u: BattleUnit): number {
  const d = UNITS[u.defId];
  if (d.attackType === 'ranged') return 3;
  return d.kind === 'hero' ? 0 : d.movement === 'fly' ? 2 : 1;
}

// ------------------------------------------------------------------ rulebook units
// The coop automaton's units and the neutral guardians act by the rules printed in the
// rulebook, so players at the table move them the same way:
//  - abilities are used at the first opportunity;
//  - a hero or guardian attacks the enemy hero when it can, otherwise the support with the
//    least Życie; a support prefers the enemy supports (least Życie first), then the hero;
//  - a unit with nobody to attack walks towards the nearest enemy.

const isLeader = (u: BattleUnit) => UNITS[u.defId].kind !== 'support';

/** Rulebook choice among the enemies `u` can hit: the one with the least Życie; on a tie the hero, then the stable id order. */
function rulebookTarget(targets: BattleUnit[]): BattleUnit | null {
  return targets.slice().sort((a, b) => a.hp - b.hp || Number(isLeader(b)) - Number(isLeader(a)) || (a.id < b.id ? -1 : 1))[0] ?? null;
}

export function followsRulebook(state: GameState, u: BattleUnit): boolean {
  return u.side === 'neutral' || (state.setup.mode === 'coop' && u.side === 'horde');
}

function rulebookAction(state: GameState, u: BattleUnit): Action {
  const b = state.battle!;
  const act = b.activation!;
  const canAttack = !act.attacked && !act.moveOnly;
  const attackFrom = (cell: HexKey | null) => (canAttack ? attackTargets(state, u, cell) : []);
  const here = attackFrom(u.pos);
  const strike = (t: BattleUnit): Action => {
    const ab = abilityOf(u);
    let useAbility = !u.abilityUsed && abilityActive(state, u) && ATTACK_ABILITIES.includes(ab);
    let second: BattleUnit | null = null;
    if (useAbility && ab === 'fireBreath') {
      second = breathSecondTarget(state, u, t);
      if (!second) useAbility = false;
    }
    if (canHitTwo(state, u)) second = rulebookTarget(here.filter((x) => x.id !== t.id && dist(x.pos!, u.pos!) === 1));
    return { type: 'battleAttack', targetId: t.id, useAbility, secondTargetId: second?.id };
  };
  const now = rulebookTarget(here);
  if (now) return strike(now);
  if (act.moved || act.attacked) return { type: 'endActivation' };
  // Move: to a cell from which the chosen enemy can be hit (fewest steps), else towards the nearest enemy.
  const cells = [...reachableCells(state, u)].sort((x, y) => x[1] - y[1] || (x[0] < y[0] ? -1 : 1));
  const reachable = cells.flatMap(([cell]) => attackFrom(cell));
  const goal = rulebookTarget([...new Map(reachable.map((t) => [t.id, t])).values()]);
  if (goal) {
    const cell = cells.find(([c]) => attackFrom(c).some((t) => t.id === goal.id));
    if (cell) return { type: 'battleMove', to: cell[0] };
  }
  const enemies = enemiesOf(b, u);
  const gap = (cell: HexKey) => Math.min(...enemies.map((e) => dist(e.pos!, cell)));
  const closer = cells.filter(([c]) => gap(c) < gap(u.pos!)).sort((x, y) => gap(x[0]) - gap(y[0]) || x[1] - y[1] || (x[0] < y[0] ? -1 : 1))[0];
  return closer ? { type: 'battleMove', to: closer[0] } : { type: 'endActivation' };
}

/** Rulebook use of the abilities that need no attack (Pajęcze Sidła): at once, on the rulebook target. */
function rulebookFreeAbility(state: GameState, u: BattleUnit): Action | null {
  if (u.abilityUsed || !abilityActive(state, u) || abilityOf(u) !== 'web') return null;
  const inRange = enemiesOf(state.battle!, u).filter((e) => dist(e.pos!, u.pos!) <= ABILITY.webRange);
  const t = rulebookTarget(inRange);
  return t ? { type: 'battleAbility', targetId: t.id } : null;
}

export function chooseBattleAction(state: GameState): Action {
  const b = state.battle!;
  if (b.stage === 'select') return chooseSupports(state, b.needsSelection[0]);
  if (b.stage === 'deploy') return chooseDeployment(state, b.needsDeploy[0]);
  if (b.stage === 'draft') return chooseDraftPick(state, state.draft!.order[0]);
  const act = b.activation!;
  const u = b.units[act.unitId];
  if (act.hop) {
    const cells = hopCells(state, u, act.hop).sort((x, y) => danger(state, u, x) - danger(state, u, y) || (x < y ? -1 : 1));
    return cells.length ? { type: 'battleHop', to: cells[0] } : { type: 'endActivation' };
  }
  if (u.side !== 'neutral' && !act.acted) {
    const item = itemToUse(state, u);
    if (item) return item;
  }
  if (followsRulebook(state, u)) {
    const free = rulebookFreeAbility(state, u);
    if (free) return free;
    return rulebookAction(state, u);
  }
  const free = freeAbility(state, u);
  if (free) return free;
  const plan = planActivation(state, u);
  if (plan.moveTo && !act.moved && !act.attacked) return { type: 'battleMove', to: plan.moveTo };
  if (plan.target && !act.attacked && !act.moveOnly) {
    return { type: 'battleAttack', targetId: plan.target.id, useAbility: plan.useAbility, secondTargetId: plan.second?.id };
  }
  return { type: 'endActivation' };
}
