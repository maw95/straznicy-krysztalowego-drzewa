// Heuristic battle AI. It is greedy and deterministic: equal scores are broken
// by stable ordering, so simulations replay exactly from a seed.

import { ABILITY, ITEM_EFFECT, UNITS, type FactionId } from '../data';
import { supportSlots } from '../kingdom';
import { ARTIFACT_BY_ID, type ArtifactDef } from '../sites';
import {
  abilityActive,
  abilityOf,
  attackDamage,
  attackTargets,
  ATTACK_ABILITIES,
  breathSecondTarget,
  canAttackAfterMove,
  canHitTwo,
  canUseBattleItem,
  catapultTargets,
  layoutCells,
  cellsOf,
  deployCells,
  deployHeads,
  enemiesOf,
  footprintAt,
  isLarge,
  tailOptions,
  teleportCells,
  scrollCells,
  hopCells,
  livingUnits,
  middleDistance,
  reachableCells,
  hpScaleOf,
  scaleOf,
  unitAttackBase,
  unitDistance,
  unitSpeed,
} from '../battle';
import { distance, neighborKeys, parseKey, type HexKey } from '../hex';
import { wideCellOf } from '../arenaLayout';
import { botSpell } from '../magic';
import { SIEGE } from '../economy';
import type { Action, BattleUnit, GameState } from '../types';
import type { ItemKind } from '../data';

const dist = (a: HexKey, b: HexKey) => distance(parseKey(a), parseKey(b));
/** Shortest distance between two sets of cells: a large unit lies on two, so it is as near as its nearer cell. */
const dist2 = (a: readonly HexKey[], b: readonly HexKey[]) => Math.min(...a.flatMap((x) => b.map((y) => dist(x, y))));

/**
 * Siege: how many steps a walker needs from each cell to the nearest enemy, around the walls still standing (units are ignored, a moat cell
 * costs three steps more: it stops the unit and hurts it). Null outside a siege and for flyers: the straight distance is right there.
 */
function siegeField(state: GameState, u: BattleUnit): Map<HexKey, number> | null {
  const b = state.battle!;
  if (!b.siege || UNITS[u.defId].movement === 'fly') return null;
  const blocked = new Set(b.obstacles);
  const moat = new Set(b.siege.moat);
  const cells = new Set(layoutCells(b));
  const field = new Map<HexKey, number>();
  let frontier: HexKey[] = enemiesOf(b, u).flatMap(cellsOf);
  for (const k of frontier) field.set(k, 0);
  // Dijkstra with small whole costs: a plain loop over growing distances is enough on 117 cells.
  for (let guard = 0; frontier.length && guard < 400; guard++) {
    const next: HexKey[] = [];
    for (const cur of frontier) {
      const d = field.get(cur)!;
      for (const n of neighborKeys(cur)) {
        if (!cells.has(n) || blocked.has(n)) continue;
        const cost = d + 1 + (moat.has(n) ? 3 : 0);
        if (cost < (field.get(n) ?? Infinity)) {
          field.set(n, cost);
          next.push(n);
        }
      }
    }
    frontier = next;
  }
  return field;
}

/** How near the enemy the cells `mine` are: steps around the walls in a siege, the straight distance otherwise. */
function nearness(field: Map<HexKey, number> | null, enemies: BattleUnit[], mine: readonly HexKey[]): number {
  if (!field) return Math.min(...enemies.map((e) => dist2(cellsOf(e), mine)));
  return Math.min(...mine.map((k) => field.get(k) ?? 99));
}

/** The battle bot's judgement in numbers (tuned with simulations; changing one changes the games). */
const AI_TUNING = {
  /** Ognisty Oddech: how much a blow on an ally standing behind the target weighs against the breath (1 = as much as the same blow on an enemy is worth). */
  friendlyFire: 1.2,
  /** A shooter's reach when weighing danger: anywhere on the arena. */
  rangedReach: 99,
  /** Caution fades over this many battle rounds, so nobody kites forever. */
  cautionRounds: 6,
  /** Bonus for using Splątane Korzenie or Złowroga Klątwa with an attack. */
  debuffBonus: 1.5,
  /** How much a shooter and a melee unit mind the danger of the cell they attack from. */
  attackRiskRanged: 3,
  attackRiskMelee: 1.5,
  /** A shooter attacking with an enemy next to it. */
  rangedCrowded: 2,
  /** Where a unit that does not attack stands: shooters this far from the nearest enemy, melee as close as it gets. */
  rangedDistance: 4,
  rangedDistanceWeight: 0.4,
  meleeClosing: 0.6,
  /** How much a shooter and a melee unit mind danger when only moving. */
  moveRiskRanged: 2.5,
  moveRiskMelee: 1,
  /** A blow that kills: its base score, more for a leader. */
  killScore: 12,
  killLeader: 8,
  /** A blow that does not kill: damage counts this much more on a leader, plus the target's wounds. */
  leaderDamage: 1.3,
  woundWeight: 0.15,
  /** Choosing supports: Atak weighs this much against Życie, and a shooter gets a bonus. */
  supportAttackWeight: 1.5,
  supportRangedBonus: 2,
  /** Wielki Eliksir Uzdrowienia: drunk by a unit missing at least this much Życie and down to half. */
  healMissing: 4,
  /** Tarcza Strażnika: raised by a hero down to this much Życie. */
  shieldHp: 5,
};

export function chooseSupports(state: GameState, faction: FactionId): Action {
  const pool = [...state.factions[faction].supportsAlive];
  const automaton = state.setup.mode === 'coop' && faction === 'horde';
  // The easy arena bot picks its supports at random, as the automaton does.
  const careless = state.setup.mode === 'arena' && state.setup.botLevel === 'kids';
  let picked: string[];
  if (automaton || careless) {
    // Spec: coop evil supports are chosen at random among the living.
    picked = pool.slice().sort((a, b) => hashPick(state, a) - hashPick(state, b)).slice(0, supportSlots(state, faction));
  } else {
    picked = pool.slice().sort((a, b) => supportValue(b) - supportValue(a)).slice(0, supportSlots(state, faction));
  }
  return { type: 'selectSupports', faction, supportIds: picked };
}

/**
 * How much a treasure is worth to the bot in an arena draft. Kinds it cannot use (see itemToUse)
 * are worth nothing, so it never drafts them unless nothing else is offered.
 */
export const DRAFT_VALUE: Partial<Record<ItemKind, number>> = { resurrection: 9, stone: 8, sword: 7, seed: 7, lightning: 7, heal: 6, damage_scroll: 6, shield: 6, vitality: 6, boots: 4, teleport: 3 };

/**
 * Arena draft: the hard bot takes the most valuable card, the normal one usually does (now and then
 * the second best), the easy one picks at random.
 */
/** How much an artifact helps a hero in an arena battle (the 6 on 6 choice of one of three). */
const gearValue = (a: ArtifactDef): number =>
  (a.attack ?? 0) * 3 + (a.hp ?? 0) + (a.speed ?? 0) * 2 + (a.supportHp ?? 0) * 2 + (a.thorns ?? 0) * 2 + (a.vsWounded ?? 0) + (a.defense ?? 0) * 3 + a.rarity;

/** 6 on 6 arena: the easy bot picks at random, the normal one usually the best artifact, the hard one always. */
export function chooseGearPick(state: GameState, faction: FactionId): Action {
  const offer = state.draft!.gear!.offer;
  const level = state.setup.botLevel ?? 'normal';
  const ranked = [...offer].sort((x, y) => gearValue(ARTIFACT_BY_ID[y]) - gearValue(ARTIFACT_BY_ID[x]) || (x < y ? -1 : 1));
  const artifactId = level === 'kids' ? offer[hashPick(state, faction) % offer.length] : level === 'normal' && ranked.length > 1 && hashPick(state, faction) % 3 === 0 ? ranked[1] : ranked[0];
  return { type: 'pickGear', faction, artifactId };
}

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
  return d.hp + d.attack * AI_TUNING.supportAttackWeight + (d.attackType === 'ranged' ? AI_TUNING.supportRangedBonus : 0);
}

/** Where `u`'s enemies stand, how far they reach next round and how hard they hit. */
interface Threat {
  /** The cells the enemy lies on. */
  cells: HexKey[];
  reach: number;
  attack: number;
}

function threatsTo(state: GameState, u: BattleUnit): Threat[] {
  return enemiesOf(state.battle!, u).map((e) => ({ cells: cellsOf(e), reach: unitSpeed(e) + (UNITS[e.defId].attackType === 'ranged' ? AI_TUNING.rangedReach : 1), attack: unitAttackBase(e) }));
}

/** Danger of standing on `cell`: how much damage enemies could deal there next round. */
function danger(threats: Threat[], mine: readonly HexKey[]): number {
  let total = 0;
  for (const t of threats) if (dist2(t.cells, mine) <= t.reach) total += t.attack;
  return total;
}

/**
 * Where a large unit puts its tail when its head goes to `head`: on the side away from the enemies (the head faces them), so
 * the tail is the cell they reach last. Ties keep the engine's own order (the side it lies on already, or the turn).
 */
function tailFor(state: GameState, u: BattleUnit, head: HexKey): HexKey | undefined {
  const b = state.battle!;
  const options = tailOptions(b, u, head);
  if (options.length < 2) return options[0];
  const enemies = enemiesOf(b, u);
  if (!enemies.length) return options[0];
  const gap = (k: HexKey) => Math.min(...enemies.map((e) => dist2(cellsOf(e), [k])));
  return options.reduce((best, k) => (gap(k) > gap(best) ? k : best));
}

/** The cells the unit would cover with its head on `cell`: head plus the tail it would choose. */
function plannedFootprint(state: GameState, u: BattleUnit, cell: HexKey): HexKey[] {
  if (cell === u.pos || !isLarge(state, u)) return footprintAt(state, u, cell);
  const t = tailFor(state, u, cell);
  return t ? [cell, t] : [cell];
}

/** A move to `to`, with the tail of a large unit on its tactical side. */
function moveTo(state: GameState, u: BattleUnit, to: HexKey): Action {
  const tail = to === u.pos || !isLarge(state, u) ? undefined : tailFor(state, u, to);
  return tail ? { type: 'battleMove', to, tail } : { type: 'battleMove', to };
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
  const threats = threatsTo(state, u);
  const field = siegeField(state, u);
  // Caution fades as the battle drags on, so nobody kites forever.
  const caution = Math.max(0, 1 - (b.round - 1) / AI_TUNING.cautionRounds);
  let best: Plan = { moveTo: null, target: null, second: null, useAbility: false, score: -Infinity };
  for (const [cell, steps] of options) {
    const moved = act.movedDistance + steps;
    // A large unit standing on `cell` also lies on the cell of its tail.
    const mine = plannedFootprint(state, u, cell);
    const risk = (danger(threats, mine) / Math.max(1, u.hp)) * caution;
    // A shooter of the digital ruleset cannot shoot after moving: from another cell it only takes a position.
    const targets = act.attacked || act.moveOnly || (cell !== u.pos && !canAttackAfterMove(state, u)) ? [] : attackTargets(state, u, cell);
    for (const t of targets) {
      for (const useAbility of abilityChoices(state, u)) {
        const dmg = attackDamage(state, u, t, useAbility, moved);
        let score = scoreHit(t, dmg);
        let second: BattleUnit | null = null;
        if (useAbility && abilityOf(u) === 'fireBreath') {
          second = breathSecondTarget(state, u, t, cell);
          if (!second) continue;
          // An ally behind the target burns too: that counts against the breath, and a kill of an ally counts most.
          score += second.side === u.side ? -AI_TUNING.friendlyFire * scoreHit(second, dmg) : scoreHit(second, dmg);
        }
        if (canHitTwo(state, u)) {
          second = targets.filter((x) => x.id !== t.id && dist2(cellsOf(x), mine) === 1).sort((x, y) => scoreHit(y, dmg) - scoreHit(x, dmg))[0] ?? null;
          if (second) score += scoreHit(second, dmg);
        }
        if (useAbility && ['entanglingRoots', 'curse'].includes(abilityOf(u))) score += AI_TUNING.debuffBonus;
        score -= risk * (ranged ? AI_TUNING.attackRiskRanged : AI_TUNING.attackRiskMelee);
        if (ranged && targets.some((x) => dist2(cellsOf(x), mine) === 1)) score -= AI_TUNING.rangedCrowded;
        if (score > best.score) best = { moveTo: cell === u.pos ? null : cell, target: t, second, useAbility, score };
      }
    }
    // Positional value when not attacking from this cell.
    const nearest = nearness(field, enemies, mine);
    let pos = ranged ? -Math.abs(nearest - AI_TUNING.rangedDistance) * AI_TUNING.rangedDistanceWeight : -nearest * AI_TUNING.meleeClosing;
    pos -= risk * (ranged ? AI_TUNING.moveRiskRanged : AI_TUNING.moveRiskMelee);
    // Siege: the moat hurts and ends the turn, so a unit stops there only when it is the way in.
    if (b.siege && cell !== u.pos && mine.some((k) => b.siege!.moat.includes(k))) pos -= 2;
    // Siege: the defenders hold the wall line while it stands (they go out only to strike), so the towers and the gate work for them.
    if (b.siege?.walls.length && u.side === b.defender && mine.some((k) => wideCellOf(k).col <= SIEGE.wallColumn)) pos -= 4;
    if (pos > best.score) best = { moveTo: cell === u.pos ? null : cell, target: null, second: null, useAbility: false, score: pos };
  }
  return best;
}

function abilityChoices(state: GameState, u: BattleUnit): boolean[] {
  const ab = abilityOf(u);
  if (u.abilityUsed || !abilityActive(state) || !ATTACK_ABILITIES.includes(ab)) return [false];
  return [true, false];
}

function scoreHit(t: BattleUnit, dmg: number): number {
  const isLeader = UNITS[t.defId].kind !== 'support';
  if (dmg >= t.hp) return AI_TUNING.killScore + (isLeader ? AI_TUNING.killLeader : 0) + UNITS[t.defId].attack;
  // The weights were tuned on the board game's numbers: with larger numbers the damage and the wounds are counted back in those.
  const k = t.scale ?? 1;
  const hk = t.hpScale ?? k;
  return (dmg / k) * (isLeader ? AI_TUNING.leaderDamage : 1) + ((t.maxHp - t.hp) / hk) * AI_TUNING.woundWeight;
}

function freeAbility(state: GameState, u: BattleUnit): Action | null {
  if (u.abilityUsed || !abilityActive(state)) return null;
  const b = state.battle!;
  const ab = abilityOf(u);
  // In a duel the dragon is alone, and its own +3 is worth it all the same.
  if (ab === 'sunburst' && (livingUnits(b, u.side).length >= 2 || b.duel)) return { type: 'battleAbility' };
  if (ab === 'giftOfLife') {
    const hurt = livingUnits(b, u.side)
      .filter((x) => x.maxHp - x.hp >= 3 * hpScaleOf(state))
      .sort((x, y) => (UNITS[y.defId].kind === 'support' ? 0 : 1) - (UNITS[x.defId].kind === 'support' ? 0 : 1))[0];
    if (hurt) return { type: 'battleAbility', targetId: hurt.id };
  }
  if (ab === 'web') {
    const t = enemiesOf(b, u)
      .filter((e) => unitDistance(e, u) <= ABILITY.webRange)
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
        const t = own.find((x) => x.maxHp - x.hp >= AI_TUNING.healMissing * hpScaleOf(state) && x.hp <= x.maxHp / 2);
        if (t) return { type: 'battleItem', itemId: item.id, targetId: t.id };
        break;
      }
      case 'seed':
        // Worth it when at least two units can take the whole gift.
        if (own.filter((x) => x.maxHp - x.hp >= ITEM_EFFECT.seedHeal * hpScaleOf(state)).length >= 2) return { type: 'battleItem', itemId: item.id };
        break;
      case 'damage_scroll': {
        const t = enemies.find((e) => e.hp <= ITEM_EFFECT.scrollDamage * scaleOf(state));
        if (t) return { type: 'battleItem', itemId: item.id, targetId: t.id };
        break;
      }
      case 'lightning': {
        const ts = enemies.filter((e) => e.hp <= ITEM_EFFECT.lightningDamage * scaleOf(state));
        if (ts.length || enemies.length >= 2) return { type: 'battleItem', itemId: item.id, targetIds: (ts.length ? ts : enemies).slice(0, ITEM_EFFECT.lightningTargets).map((e) => e.id) };
        break;
      }
      case 'sword':
      case 'vitality':
      case 'stone':
        if (UNITS[u.defId].kind === 'hero' && b.round === 1) return { type: 'battleItem', itemId: item.id, targetId: u.id };
        break;
      case 'shield':
        if (UNITS[u.defId].kind === 'hero' && u.hp <= AI_TUNING.shieldHp * hpScaleOf(state)) return { type: 'battleItem', itemId: item.id, targetId: u.id };
        break;
      case 'boots':
        // Not the coop automaton: it keeps to the rulebook's list of treasures it uses.
        if (!followsRulebook(state, u) && UNITS[u.defId].kind === 'hero' && b.round === 1) return { type: 'battleItem', itemId: item.id, targetId: u.id };
        break;
      case 'courage_horn': {
        // The next attack of the hero hits harder: blow it when the hero is about to strike this activation.
        if (followsRulebook(state, u) || UNITS[u.defId].kind !== 'hero' || !planActivation(state, u).target) break;
        const next = own.find((x) => x.id !== u.id && unitDistance(u, x) === 1);
        return { type: 'battleItem', itemId: item.id, targetIds: next ? [u.id, next.id] : [u.id] };
      }
      case 'hourglass': {
        // A hero that cannot strike this activation gets a second move to close in.
        if (followsRulebook(state, u) || UNITS[u.defId].kind !== 'hero' || b.activation!.moved || b.round > 2) break;
        const plan = planActivation(state, u);
        if (!plan.target && plan.moveTo) return { type: 'battleItem', itemId: item.id, targetId: u.id };
        break;
      }
      case 'horn': {
        // A living supporter that can strike now acts once more.
        if (followsRulebook(state, u)) break;
        const striker = own
          .filter((x) => UNITS[x.defId].kind === 'support' && attackTargets(state, x).length > 0)
          .sort((x, y) => unitAttackBase(y) - unitAttackBase(x))[0];
        if (striker) return { type: 'battleItem', itemId: item.id, targetId: striker.id, hornMode: 'extra' };
        break;
      }
      case 'teleport': {
        // Not the coop automaton, which keeps to the rulebook's list of treasures.
        if (followsRulebook(state, u)) break;
        const cell = scrollJump(state, u, own, enemies);
        if (cell) return { type: 'battleItem', itemId: item.id, targetId: u.id, to: cell };
        break;
      }
      default:
        break;
    }
  }
  return null;
}

/**
 * Zwój Teleportacji for the acting unit: jump next to an ally that a stronger enemy (or two enemies) is pressing, or, with nobody
 * to strike this turn, next to the ally nearest the enemy so the unit closes in at once. Null when the jump is not worth the scroll.
 */
function scrollJump(state: GameState, u: BattleUnit, own: BattleUnit[], enemies: BattleUnit[]): HexKey | null {
  if (!enemies.length || u.status.battleSpeedBonus < 0) return null;
  const cells = scrollCells(state, u);
  if (!cells.length) return null;
  const here = Math.min(...enemies.map((e) => unitDistance(e, u)));
  // The unit already fights (or will after its own move): the scroll stays in the bag.
  if (here <= unitSpeed(u) + 1) return null;
  const at = (k: HexKey) => footprintAt(state, u, k);
  const toEnemy = (k: HexKey, e: BattleUnit) => dist2(at(k), cellsOf(e));
  // Rescue: an ally pressed by enemies that together hit harder than it can bear, or by one that outguns it.
  const pressed = own
    .filter((a) => a.id !== u.id)
    .map((a) => {
      const near = enemies.filter((e) => unitDistance(e, a) <= 1);
      const blow = near.reduce((sum, e) => sum + unitAttackBase(e), 0);
      return { a, near, hurt: near.length >= 2 || (near.length === 1 && unitAttackBase(near[0]) > unitAttackBase(a)) || blow >= a.hp };
    })
    .filter((x) => x.hurt && x.near.length)
    .sort((x, y) => x.a.hp - y.a.hp)[0];
  if (pressed) {
    const foe = pressed.near.slice().sort((x, y) => x.hp - y.hp)[0];
    const next = cells.filter((k) => toEnemy(k, foe) === 1).sort((x, y) => (x < y ? -1 : 1))[0];
    if (next && attackReachFrom(state, u, next)) return next;
  }
  // Closing in: nobody can be struck this turn, and the jump takes the unit at least three steps nearer the enemy.
  if (planActivation(state, u).target) return null;
  let bestCell: HexKey | null = null;
  let bestGap = here;
  for (const k of cells) {
    const gap = Math.min(...enemies.map((e) => toEnemy(k, e)));
    if (gap < bestGap || (gap === bestGap && bestCell !== null && k < bestCell)) {
      bestGap = gap;
      bestCell = k;
    }
  }
  return bestCell && here - bestGap >= 3 ? bestCell : null;
}

/** Whether a unit put on `cell` could strike an enemy from there without moving (the rescuer must be able to help at once). */
function attackReachFrom(state: GameState, u: BattleUnit, cell: HexKey): boolean {
  const b = state.battle!;
  return enemiesOf(b, u).some((e) => dist2(footprintAt(state, u, cell), cellsOf(e)) === 1) || UNITS[u.defId].attackType === 'ranged';
}

/** Bots keep heroes central, put shooters on the rows farthest from the enemy's strongest unit. */
function chooseDeployment(state: GameState, faction: FactionId): Action {
  const b = state.battle!;
  const own = Object.values(b.units).filter((u) => u.side === faction);
  const cells = deployCells(b, faction).sort((x, y) => middleDistance(b, x) - middleDistance(b, y));
  const order = own.slice().sort((x, y) => rank(x) - rank(y));
  const positions: Record<string, HexKey> = {};
  // Melee first takes central cells, shooters the outer ones. A large unit's head reaches into the next column (more than one column when the
  // hero is a Taktyk), so the cell it will take is kept free for it.
  const taken = new Set<HexKey>();
  for (const u of order) {
    const k = cells.find((c) => !taken.has(c) && (!isLarge(state, u) || deployHeads(b, faction, c).some((h) => !taken.has(h))))!;
    taken.add(k);
    if (isLarge(state, u)) taken.add(deployHeads(b, faction, k).find((h) => !taken.has(h))!);
    positions[u.id] = k;
  }
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
  const attackFrom = (cell: HexKey | null) => (canAttack && (cell === u.pos || canAttackAfterMove(state, u)) ? attackTargets(state, u, cell) : []);
  const here = attackFrom(u.pos);
  const strike = (t: BattleUnit): Action => {
    const ab = abilityOf(u);
    let useAbility = !u.abilityUsed && abilityActive(state) && ATTACK_ABILITIES.includes(ab);
    let second: BattleUnit | null = null;
    if (useAbility && ab === 'fireBreath') {
      second = breathSecondTarget(state, u, t);
      // Not breathing (no second target, or an ally would burn): the second target goes too, the engine refuses it for a plain attack.
      if (!second || second.side === u.side) {
        useAbility = false;
        second = null;
      }
    }
    if (canHitTwo(state, u)) second = rulebookTarget(here.filter((x) => x.id !== t.id && dist2(cellsOf(x), cellsOf(u)) === 1));
    return { type: 'battleAttack', targetId: t.id, useAbility, secondTargetId: second?.id };
  };
  const tp = rulebookTeleport(state, u, here);
  if (tp) return tp;
  const now = rulebookTarget(here);
  if (now) return strike(now);
  if (act.moved || act.attacked) return { type: 'endActivation' };
  // Move: to a cell from which the chosen enemy can be hit (fewest steps), else towards the nearest enemy.
  const cells = [...reachableCells(state, u)].sort((x, y) => x[1] - y[1] || (x[0] < y[0] ? -1 : 1));
  const from = new Map(cells.map(([cell]) => [cell, attackFrom(cell)]));
  const reachable = [...from.values()].flat();
  const goal = rulebookTarget([...new Map(reachable.map((t) => [t.id, t])).values()]);
  if (goal) {
    const cell = cells.find(([c]) => from.get(c)!.some((t) => t.id === goal.id));
    if (cell) return moveTo(state, u, cell[0]);
  }
  const enemies = enemiesOf(b, u);
  const field = siegeField(state, u);
  const gap = (cell: HexKey) => nearness(field, enemies, plannedFootprint(state, u, cell));
  const closer = cells.filter(([c]) => gap(c) < gap(u.pos!)).sort((x, y) => gap(x[0]) - gap(y[0]) || x[1] - y[1] || (x[0] < y[0] ? -1 : 1))[0];
  return closer ? moveTo(state, u, closer[0]) : { type: 'endActivation' };
}

/**
 * Teleports of the neutral units (the move that ends the turn): the Król Burzy jumps away from an enemy next to him (it shocks no one, but he
 * wants to shoot, and his old field stays charged) to a cell from which he can shoot; the Podkopnik digs in when no enemy can be reached on foot,
 * and comes up as near the enemy as it can.
 */
function rulebookTeleport(state: GameState, u: BattleUnit, hereTargets: BattleUnit[]): Action | null {
  const ab = abilityOf(u);
  const cells = teleportCells(state, u);
  if (!cells.length) return null;
  const b = state.battle!;
  const enemies = enemiesOf(b, u);
  const gap = (cell: HexKey) => Math.min(...enemies.map((e) => dist2(cellsOf(e), plannedFootprint(state, u, cell))));
  if (ab === 'stormKing') {
    if (!enemies.some((e) => unitDistance(e, u) === 1)) return null;
    const good = cells.filter((c) => gap(c) > 1 && attackTargets(state, u, c).length > 0).sort((x, y) => gap(y) - gap(x) || (x < y ? -1 : 1));
    return good.length ? { type: 'battleTeleport', to: good[0] } : null;
  }
  if (ab === 'burrow') {
    if (hereTargets.length) return null;
    const walk = [...reachableCells(state, u)].some(([c]) => attackTargets(state, u, c).length > 0);
    if (walk) return null;
    const best = cells.slice().sort((x, y) => gap(x) - gap(y) || (x < y ? -1 : 1))[0];
    return best && gap(best) < Math.min(...enemies.map((e) => unitDistance(e, u))) ? { type: 'battleTeleport', to: best } : null;
  }
  return null;
}

/** Rulebook use of the abilities that need no attack (Pajęcze Sidła): at once, on the rulebook target. */
function rulebookFreeAbility(state: GameState, u: BattleUnit): Action | null {
  if (u.abilityUsed || !abilityActive(state) || abilityOf(u) !== 'web') return null;
  const inRange = enemiesOf(state.battle!, u).filter((e) => unitDistance(e, u) <= ABILITY.webRange);
  const t = rulebookTarget(inRange);
  return t ? { type: 'battleAbility', targetId: t.id } : null;
}

export function chooseBattleAction(state: GameState): Action {
  const b = state.battle!;
  if (b.stage === 'gear') return chooseGearPick(state, state.draft!.gear!.order[0]);
  if (b.stage === 'select') return chooseSupports(state, b.needsSelection[0]);
  if (b.stage === 'deploy') return chooseDeployment(state, b.needsDeploy[0]);
  if (b.stage === 'draft') return chooseDraftPick(state, state.draft!.order[0]);
  const act = b.activation!;
  const u = b.units[act.unitId];
  if (act.hop) {
    const threats = threatsTo(state, u);
    const cells = hopCells(state, u, act.hop).sort((x, y) => danger(threats, footprintAt(state, u, x)) - danger(threats, footprintAt(state, u, y)) || (x < y ? -1 : 1));
    return cells.length ? { type: 'battleHop', to: cells[0] } : { type: 'endActivation' };
  }
  // Siege: the catapult shoots as soon as it may: the gate first (the way in), then the towers.
  if (b.siege && catapultTargets(state).length) {
    const target = b.siege.gate ?? b.siege.towers[0];
    if (target) return { type: 'battleCatapult', cell: target };
  }
  // Level 5: the hero's spell, when one is worth its mana.
  const cast = botSpell(state);
  if (cast) return { type: 'battleSpell', spell: cast.spell, targetId: cast.targetId };
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
  if (plan.moveTo && !act.moved && !act.attacked) return moveTo(state, u, plan.moveTo);
  if (plan.target && !act.attacked && !act.moveOnly) {
    return { type: 'battleAttack', targetId: plan.target.id, useAbility: plan.useAbility, secondTargetId: plan.second?.id };
  }
  return { type: 'endActivation' };
}
