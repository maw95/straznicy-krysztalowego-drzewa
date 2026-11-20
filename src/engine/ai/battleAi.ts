// Heuristic battle AI. It is greedy and deterministic: equal scores are broken
// by stable ordering, so simulations replay exactly from a seed.

import { ABILITY, ITEM_EFFECT, supportTier, UNITS, type TeamId } from '../data';
import { supportSlots } from '../kingdom';
import { ARTIFACT_BY_ID, type ArtifactDef } from '../sites';
import {
  pushValue,
  isBreath,
  resistsStatus,
  abilityActive,
  abilityOf,
  attackDamage,
  attackTargets,
  ATTACK_ABILITIES,
  ramCharged,
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
  fortifyCells,
  autoTrapCells,
  bestBlastTrap,
  blastValue,
  damCell,
  leapOnlyCells,
  iceWallCells,
  frostLevel,
  frostThreshold,
  footprintAt,
  isLarge,
  tailOptions,
  teleportCells,
  scrollCells,
  hopCells,
  livingUnits,
  middleDistance,
  nearestFreeCell,
  reachableCells,
  hpScaleOf,
  scaleOf,
  unitAttackBase,
  unitDistance,
  unitSpeed,
  ambushCells,
  buriesAtDeploy,
  deployCellOf,
  isMirage,
  miragesOf,
  mirageSwapReady,
  portalCells,
  sandsAllyTargets,
  teleportCells as wyrmCells,
  throwTargets,
} from '../battle';
import { redactHidden } from '../hidden';
import { FACTION_MECHANICS } from '../empire';
import { distance, neighborKeys, parseKey, type HexKey } from '../hex';
import { wideCellOf } from '../arenaLayout';
import { ARENA_SPELL_POOL, botSpell, SPELL_VALUE, type SpellId } from '../magic';
import { canBeMoved, fallenSupports } from '../primitives';
import { SIEGE } from '../economy';
import type { Action, BattleUnit, GameState } from '../types';
import type { ItemKind } from '../data';

const dist = (a: HexKey, b: HexKey) => distance(parseKey(a), parseKey(b));
/** Iskra of the Desert Empire: how many units the bot moves after both sides deployed. */
const FACTION_MECHANICS_REARRANGE = FACTION_MECHANICS.sparkRearrange;
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

export function chooseSupports(state: GameState, faction: TeamId): Action {
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
export function chooseGearPick(state: GameState, faction: TeamId): Action {
  const offer = state.draft!.gear!.offer;
  const level = state.setup.botLevel ?? 'normal';
  const ranked = [...offer].sort((x, y) => gearValue(ARTIFACT_BY_ID[y]) - gearValue(ARTIFACT_BY_ID[x]) || (x < y ? -1 : 1));
  const artifactId = level === 'kids' ? offer[hashPick(state, faction) % offer.length] : level === 'normal' && ranked.length > 1 && hashPick(state, faction) % 3 === 0 ? ranked[1] : ranked[0];
  return { type: 'pickGear', faction, artifactId };
}

/** 6 on 6 arena: the easy bot picks two spells at random, the others the two most valuable (the normal one now and then swaps the second). */
export function chooseSpellPick(state: GameState, faction: TeamId): Action {
  const level = state.setup.botLevel ?? 'normal';
  const pool = [...ARENA_SPELL_POOL];
  const ranked = pool.sort((x, y) => SPELL_VALUE[y] - SPELL_VALUE[x] || (x < y ? -1 : 1));
  const h = hashPick(state, faction);
  let spells: SpellId[];
  if (level === 'kids') spells = [ranked[h % 3], ranked[3 + (h % 3)]];
  else if (level === 'normal' && h % 3 === 0) spells = [ranked[0], ranked[2]];
  else spells = [ranked[0], ranked[1]];
  return { type: 'pickSpells', faction, spells };
}

export function chooseDraftPick(state: GameState, faction: TeamId): Action {
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
  if (!act.moved && (!act.attacked || act.thrown)) for (const [k, d] of reachableCells(state, u)) options.push([k, d]);
  const enemies = enemiesOf(b, u);
  const ranged = UNITS[u.defId].attackType === 'ranged';
  const threats = threatsTo(state, u);
  const field = siegeField(state, u);
  // Caution fades as the battle drags on, so nobody kites forever.
  const caution = Math.max(0, 1 - (b.round - 1) / AI_TUNING.cautionRounds);
  let best: Plan = { moveTo: null, target: null, second: null, useAbility: false, score: -Infinity };
  const leapOnly = leapOnlyCells(state, u);
  const mates = (cell: HexKey) => livingUnits(b, u.side).filter((x) => x.id !== u.id && dist2(cellsOf(x), plannedFootprint(state, u, cell)) === 1).length;
  for (const [cell, steps] of options) {
    const moved = act.movedDistance + steps;
    // A large unit standing on `cell` also lies on the cell of its tail.
    const mine = plannedFootprint(state, u, cell);
    const risk = (danger(threats, mine) / Math.max(1, u.hp)) * caution;
    // A shooter of the digital ruleset cannot shoot after moving: from another cell it only takes a position.
    const targets = act.attacked || act.moveOnly || (cell !== u.pos && !canAttackAfterMove(state, u)) ? [] : attackTargets(state, u, cell);
    // Rzut Sztyletem: the Beduin throws from where it stands (before its move), at a target it cannot reach with a blow.
    if (cell === u.pos && !act.attacked && !act.moveOnly) {
      for (const t of throwTargets(state, u, cell)) {
        const score = scoreHit(t, attackDamage(state, u, t, true, moved)) - risk * AI_TUNING.attackRiskMelee + (UNITS[t.defId].attackType === 'ranged' ? 1 : 0);
        if (score > best.score) best = { moveTo: null, target: t, second: null, useAbility: true, score };
      }
    }
    for (const t of targets) {
      for (const useAbility of abilityChoices(state, u)) {
        const dmg = attackDamage(state, u, t, useAbility, moved);
        let score = scoreHit(t, dmg);
        let second: BattleUnit | null = null;
        if (useAbility && isBreath(abilityOf(u))) {
          second = breathSecondTarget(state, u, t, cell);
          if (!second) continue;
          // An ally behind the target burns too: that counts against the breath, and a kill of an ally counts most.
          score += second.side === u.side ? -AI_TUNING.friendlyFire * scoreHit(second, dmg) : scoreHit(second, dmg);
        }
        if (canHitTwo(state, u)) {
          second = targets.filter((x) => x.id !== t.id && dist2(cellsOf(x), mine) === 1).sort((x, y) => scoreHit(y, dmg) - scoreHit(x, dmg))[0] ?? null;
          if (second) score += scoreHit(second, dmg);
        }
        if (useAbility && ['entanglingRoots', 'curse', 'dimLight', 'graveBreath', 'frostSlow', 'frostGrip', 'stinkBomb'].includes(abilityOf(u))) score += AI_TUNING.debuffBonus;
        // The Free Companies pile their blows on the marked enemy (the Kruk marks it), and a stink bomb is worth more when it reaches several enemies.
        if (t.status.marked && t.status.marked.by === u.side && t.status.marked.round === b.round) score += 1;
        if (useAbility && abilityOf(u) === 'stinkBomb') score += targets.filter((x) => x.id !== t.id && dist2(cellsOf(x), cellsOf(t)) === 1).length * 1.2;
        if (useAbility && abilityOf(u) === 'iceBlow') score += AI_TUNING.debuffBonus * 2;
        // The Court of Everfrost puts all its blows on one target to freeze it (it does not spread the frost); the weak melee ones do not rush in.
        if (UNITS[u.defId].side === 'frost') {
          const frost = t.status.frost ?? 0;
          score += frost * 0.8 + (frostLevel(state, u.side) >= 1 && t.hp > dmg && frost + 1 >= frostThreshold(state, u.side) ? 2 : 0);
          if (!ranged && UNITS[u.defId].kind === 'support' && supportTier(u.defId) <= 2) score -= risk * 0.5;
        }
        // The Herds: a push that ends in a boulder, the edge or another unit hurts (and the others hurt more when they run, and reach the shooters).
        const collision = pushValue(state, u, t, useAbility, moved);
        if (collision > 0) score += scoreHit(t, collision) * 0.6;
        else if (collision < 0) score -= scoreHit(t, -collision) * 0.6;
        if (UNITS[u.defId].side === 'herds' && UNITS[t.defId].attackType === 'ranged' && UNITS[u.defId].attackType === 'melee') score += 1;
        if (UNITS[u.defId].side === 'herds' && moved >= 3) score += 0.5;
        // The Kingdom of the Dead plays for time: it does not throw its heroes forward (they do not rise), its shooters go for the enemy leaders with mana.
        if (UNITS[u.defId].side === 'undead' && UNITS[u.defId].kind === 'hero') score -= risk * 0.5;
        if (UNITS[u.defId].side === 'undead' && ['manaReap', 'dimLight'].includes(abilityOf(u)) && UNITS[t.defId].kind === 'hero') score += 0.5;
        // The Iron Clans fight in formation: a cell next to allies is worth more (the Mur Tarcz), and a cannonade hits the neighbours of the target as well.
        if (UNITS[u.defId].side === 'clans') score += Math.min(2, mates(cell)) * 0.4;
        if (abilityOf(u) === 'cannonFire' || abilityOf(u) === 'hailStones') score += targets.filter((x) => x.id !== t.id && dist2(cellsOf(x), cellsOf(t)) === 1).reduce((n, x) => n + scoreHit(x, dmg), 0);
        score -= risk * (ranged ? AI_TUNING.attackRiskRanged : AI_TUNING.attackRiskMelee);
        if (ranged && targets.some((x) => dist2(cellsOf(x), mine) === 1)) score -= AI_TUNING.rangedCrowded;
        if (score > best.score) best = { moveTo: cell === u.pos ? null : cell, target: t, second, useAbility, score };
      }
    }
    // Szalony Skok is kept for a blow: a cell only the leap reaches counts when something can be hit from it, never as a mere position.
    if (leapOnly.has(cell)) continue;
    // Positional value when not attacking from this cell.
    const nearest = nearness(field, enemies, mine);
    let pos = ranged ? -Math.abs(nearest - AI_TUNING.rangedDistance) * AI_TUNING.rangedDistanceWeight : -nearest * AI_TUNING.meleeClosing;
    pos -= risk * (ranged ? AI_TUNING.moveRiskRanged : AI_TUNING.moveRiskMelee);
    // The Iron Clans wait in formation: they step to a cell next to their allies, and not far from where they stand.
    if (UNITS[u.defId].side === 'clans') pos += Math.min(2, mates(cell)) * 0.5 - steps * 0.2;
    // The Court of Everfrost keeps its distance: a shooter or a witch stays out of reach.
    if (UNITS[u.defId].side === 'frost' && ranged) pos -= risk * 0.5;
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
  if (u.abilityUsed || !abilityActive(state) || !ATTACK_ABILITIES.includes(ab) || ab === 'daggerThrow') return [false];
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
  // Dzikie Stado: the horn and the drum when the herd is together, the roar at the strongest shooter, the tremor when it shakes something loose.
  if (ab === 'wanderHorn' && livingUnits(b, u.side).length >= 2) return { type: 'battleAbility' };
  if (ab === 'rhythm') {
    const ally = livingUnits(b, u.side).filter((x) => x.id !== u.id).sort((x, y) => unitAttackBase(y) - unitAttackBase(x) || (x.id < y.id ? -1 : 1))[0];
    if (ally) return { type: 'battleAbility', targetId: ally.id };
  }
  if (ab === 'roar') {
    const t = enemiesOf(b, u)
      .filter((e) => unitDistance(e, u) <= ABILITY.roarRange)
      .sort((x, y) => Number(UNITS[y.defId].attackType === 'ranged') - Number(UNITS[x.defId].attackType === 'ranged') || unitAttackBase(y) - unitAttackBase(x))[0];
    if (t) return { type: 'battleAbility', targetId: t.id };
  }
  if (ab === 'tremor' && enemiesOf(b, u).some((e) => canBeMoved(state, e) && unitDistance(e, u) <= ABILITY.tremorRadius)) return { type: 'battleAbility' };
  // Królestwo Umarłych: raise whoever has fallen at once, wail and toll when two enemies are in reach, the Wij stares at the strongest enemy that can be held.
  if (ab === 'barrowCall' || ab === 'breathAgain') {
    const rising = fallenSupports(state, u.side, ab === 'breathAgain' ? ABILITY.breathAgainTier : 6)[0];
    if (rising && u.pos && nearestFreeCell(state, rising, u.pos)) return { type: 'battleAbility' };
  }
  if (ab === 'wail' && enemiesOf(b, u).filter((e) => unitDistance(e, u) <= ABILITY.wailRadius && !resistsStatus(state, e, false)).length >= 2) return { type: 'battleAbility' };
  if (ab === 'toll' && enemiesOf(b, u).filter((e) => unitDistance(e, u) === 1 && !resistsStatus(state, e, true)).length >= 1) return { type: 'battleAbility' };
  if (ab === 'viyGaze') {
    const t = enemiesOf(b, u)
      .filter((e) => unitDistance(e, u) <= ABILITY.gazeRange && !resistsStatus(state, e, true))
      .sort((x, y) => unitAttackBase(y) - unitAttackBase(x) || (x.id < y.id ? -1 : 1))[0];
    if (t) return { type: 'battleAbility', targetId: t.id };
  }
  // Żelazny Klan: the oath and the hardening when the line is in contact, the stone rune on the sturdiest ally at the front, the Skarbnik's light on a shooter, the wall in front of the Colossus.
  const foesNear = (r: number) => enemiesOf(b, u).some((e) => unitDistance(e, u) <= r);
  if (ab === 'shieldOath' && foesNear(3) && livingUnits(b, u.side).some((x) => x.id !== u.id && unitDistance(x, u) === 1)) return { type: 'battleAbility' };
  if (ab === 'stoneRune' && foesNear(5)) {
    const ally = livingUnits(b, u.side).filter((x) => x.id !== u.id && !x.status.unmovable).sort((x, y) => y.maxHp - x.maxHp || (x.id < y.id ? -1 : 1))[0];
    if (ally) return { type: 'battleAbility', targetId: ally.id };
  }
  if (ab === 'temper' && foesNear(4)) {
    const ally = livingUnits(b, u.side).filter((x) => x.id !== u.id && unitDistance(x, u) === 1).sort((x, y) => unitAttackBase(y) - unitAttackBase(x) || (x.id < y.id ? -1 : 1))[0];
    if (ally) return { type: 'battleAbility', targetId: ally.id };
  }
  if (ab === 'misleadLight') {
    const t = enemiesOf(b, u)
      .filter((e) => unitDistance(e, u) <= ABILITY.misleadRange && canBeMoved(state, e))
      .sort((x, y) => Number(UNITS[y.defId].attackType === 'ranged') - Number(UNITS[x.defId].attackType === 'ranged') || unitAttackBase(y) - unitAttackBase(x) || (x.id < y.id ? -1 : 1))[0];
    if (t) return { type: 'battleAbility', targetId: t.id };
  }
  if (ab === 'fortify' && foesNear(4) && fortifyCells(state, u)) return { type: 'battleAbility' };
  // Dwór Wiecznego Szronu: the wall cuts the enemy from its allies when it is near, the bell freezes the one that has the most frost, the Strzyga carries off a shooter, the long night when two enemies are near.
  if (ab === 'iceWall' && foesNear(5) && iceWallCells(state, u)) return { type: 'battleAbility' };
  if (ab === 'bellOfGlass') {
    const t = enemiesOf(b, u)
      .filter((e) => unitDistance(e, u) <= ABILITY.bellRange && (e.status.frost ?? 0) >= 1 && !e.status.stunned)
      .sort((x, y) => (y.status.frost ?? 0) - (x.status.frost ?? 0) || unitAttackBase(y) - unitAttackBase(x) || (x.id < y.id ? -1 : 1))[0];
    if (t) return { type: 'battleAbility', targetId: t.id };
  }
  if (ab === 'beardChill') {
    // The enemy closest to freezing first, then the one that hits hardest.
    const t = enemiesOf(b, u)
      .filter((e) => unitDistance(e, u) <= ABILITY.beardRange)
      .sort((x, y) => (y.status.frost ?? 0) - (x.status.frost ?? 0) || unitAttackBase(y) - unitAttackBase(x) || (x.id < y.id ? -1 : 1))[0];
    if (t) return { type: 'battleAbility', targetId: t.id };
  }
  if (ab === 'longNight' && enemiesOf(b, u).filter((e) => unitDistance(e, u) <= 5).length >= 2) return { type: 'battleAbility' };
  // Wolna Kompania: one more trap while the enemy is still coming, the dugin when the line is in contact, the Kruk marks the enemy that is easiest to finish (so the others focus it),
  // the dam in front of a pack, the charge when a trap of its own would hurt more of them than of us.
  if (ab === 'ploy' && foesNear(8) && autoTrapCells(state, u.side, 1).length) return { type: 'battleAbility' };
  if (ab === 'dugIn' && foesNear(3)) return { type: 'battleAbility' };
  if (ab === 'ravenEye' && livingUnits(b, u.side).length >= 2) {
    const t = enemiesOf(b, u)
      .filter((e) => unitDistance(e, u) <= ABILITY.ravenRange)
      .sort((x, y) => x.hp - y.hp || unitAttackBase(y) - unitAttackBase(x) || (x.id < y.id ? -1 : 1))[0];
    if (t) return { type: 'battleAbility', targetId: t.id };
  }
  if (ab === 'dam' && foesNear(4) && enemiesOf(b, u).filter((e) => unitDistance(e, u) <= 6).length >= 2 && damCell(state, u)) return { type: 'battleAbility' };
  if (ab === 'blast') {
    const at = bestBlastTrap(state, u);
    if (at && blastValue(state, u, at) >= 4 * scaleOf(state)) return { type: 'battleAbility', cell: at };
  }
  // Pustynne Cesarstwo: the Wezyr takes a wounded ally out of the fight or puts a fighter next to an enemy shooter, the Sfinks puzzles the enemy that hits hardest,
  // Bastia lies down when the enemy comes, the Dancer copies the most valuable unit, the Rok carries a fighter that has a long way to go.
  if (ab === 'sandPortal') {
    const allies = sandsAllyTargets(state, u);
    const enemies = enemiesOf(b, u);
    const gap = (k: HexKey) => Math.min(99, ...enemies.flatMap(cellsOf).map((c) => dist(c, k)));
    const hurt = allies.filter((x) => x.hp * 2 <= x.maxHp && enemies.some((e) => unitDistance(e, x) === 1)).sort((x, y) => x.hp - y.hp || (x.id < y.id ? -1 : 1))[0];
    if (hurt) {
      const cell = portalCells(state, u, hurt).sort((x, y) => gap(y) - gap(x) || (x < y ? -1 : 1))[0];
      if (cell && gap(cell) >= 3) return { type: 'battleAbility', targetId: hurt.id, cell };
    }
    const shooters = enemies.filter((e) => UNITS[e.defId].attackType === 'ranged');
    for (const x of allies.filter((a) => UNITS[a.defId].attackType === 'melee' && !enemies.some((e) => unitDistance(e, a) <= 1)).sort((p, q) => unitAttackBase(q) - unitAttackBase(p) || (p.id < q.id ? -1 : 1))) {
      const cell = portalCells(state, u, x).filter((k) => shooters.some((e) => cellsOf(e).some((c) => dist(c, k) === 1))).sort()[0];
      if (cell) return { type: 'battleAbility', targetId: x.id, cell };
    }
  }
  if (ab === 'riddle') {
    const t = enemiesOf(b, u)
      .filter((e) => unitDistance(e, u) <= ABILITY.riddleRange && !e.status.riddled)
      .sort((x, y) => unitAttackBase(y) - unitAttackBase(x) || (x.id < y.id ? -1 : 1))[0];
    if (t && foesNear(4)) return { type: 'battleAbility', targetId: t.id };
  }
  if (ab === 'napWatch' && !b.activation!.moved && foesNear(3)) return { type: 'battleAbility' };
  if (ab === 'mirageMake' && foesNear(9)) {
    const t = sandsAllyTargets(state, u).sort((x, y) => y.maxHp + unitAttackBase(y) * 2 - (x.maxHp + unitAttackBase(x) * 2) || (x.id < y.id ? -1 : 1))[0];
    if (t) return { type: 'battleAbility', targetId: t.id };
  }
  if (ab === 'rocLift' && !b.activation!.moved && !enemiesOf(b, u).some((e) => unitDistance(e, u) <= 1)) {
    const t = sandsAllyTargets(state, u).filter((x) => UNITS[x.defId].attackType === 'melee' && !enemiesOf(b, x).some((e) => unitDistance(e, x) <= 2)).sort((x, y) => unitAttackBase(y) - unitAttackBase(x) || (x.id < y.id ? -1 : 1))[0];
    if (t) return { type: 'battleAbility', targetId: t.id };
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
  const faction = u.side as TeamId;
  if (!canUseBattleItem(state, faction)) return null;
  const b = state.battle!;
  const inv = state.factions[faction].inventory.map((id) => state.items[id]);
  const own = livingUnits(b, faction);
  const enemies = enemiesOf(b, u);
  for (const item of inv) {
    switch (item.kind) {
      case 'resurrection': {
        const deadLeader = Object.values(b.units).find((x) => x.side === faction && !x.alive && !x.swappedOut && !x.status.risen && UNITS[x.defId].kind === 'hero' && !state.heroes[x.defId]?.revived);
        if (deadLeader) return { type: 'battleItem', itemId: item.id, targetId: deadLeader.id };
        // In the arena the elixir is worth nothing after the battle: a fallen support comes back too.
        const deadSupport = state.setup.mode === 'arena' && Object.values(b.units).find((x) => x.side === faction && !x.alive && !x.swappedOut && !x.status.risen && !state.heroes[x.defId]?.revived);
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
function chooseDeployment(state: GameState, faction: TeamId): Action {
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
  // Zasadzka Spod Piasku: the Queen lies buried on her half, as near the enemy's shooters as she can.
  for (const u of own.filter((x) => buriesAtDeploy(state, x))) {
    const cell = ambushSpot(state, faction, u, new Set(Object.entries(positions).filter(([id]) => id !== u.id).map(([, k]) => k)));
    if (cell) positions[u.id] = cell;
  }
  return { type: 'deployUnits', faction, positions };
}

/** Where the buried Queen waits: the free cell of her half nearest the enemy's shooters (their hero when they have none), not right next to an enemy. */
function ambushSpot(state: GameState, faction: TeamId, u: BattleUnit, taken: Set<HexKey>): HexKey | null {
  const b = state.battle!;
  const foes = Object.values(b.units).filter((x) => x.side !== faction && x.alive && x.pos);
  const marks = foes.filter((x) => UNITS[x.defId].attackType === 'ranged');
  const aim = (marks.length ? marks : foes.filter((x) => UNITS[x.defId].kind !== 'support')).flatMap(cellsOf);
  if (!aim.length) return null;
  const busy = new Set([...taken, ...Object.values(b.units).filter((x) => x.id !== u.id && x.side !== faction && x.alive).flatMap(cellsOf)]);
  const cells = ambushCells(b, faction).filter((k) => !busy.has(k) && !foes.some((x) => cellsOf(x).some((c) => dist(c, k) <= 1)));
  const near = (k: HexKey) => Math.min(...aim.map((c) => dist(c, k)));
  return cells.sort((x, y) => near(x) - near(y) || (x < y ? -1 : 1))[0] ?? null;
}

/**
 * Iskra of the Desert Empire: when both sides stand, the bot moves at most two units: the Queen nearer to the enemy's shooters it now sees, then the wounded
 * and the shooters to the start cells farthest from the enemy's melee units.
 */
function chooseRearrange(state: GameState, faction: TeamId): Action {
  const b = state.battle!;
  const own = Object.values(b.units).filter((u) => u.side === faction && u.pos);
  const positions: Record<string, HexKey> = Object.fromEntries(own.map((u) => [u.id, deployCellOf(u)!]));
  const moves: string[] = [];
  const takenBy = () => new Set(Object.values(b.units).filter((x) => x.side !== faction && x.alive).flatMap(cellsOf).concat(own.flatMap((x) => (moves.includes(x.id) ? [positions[x.id]] : cellsOf(x)))));
  for (const q of own.filter((x) => buriesAtDeploy(state, x))) {
    const spot = ambushSpot(state, faction, q, new Set(own.filter((x) => x.id !== q.id).flatMap(cellsOf)));
    const aim = Object.values(b.units).filter((x) => x.side !== faction && x.alive && x.pos && UNITS[x.defId].attackType === 'ranged').flatMap(cellsOf);
    const near = (k: HexKey) => (aim.length ? Math.min(...aim.map((c) => dist(c, k))) : 0);
    if (spot && q.pos && near(spot) + 2 <= near(q.pos)) {
      positions[q.id] = spot;
      moves.push(q.id);
    }
  }
  const melee = Object.values(b.units).filter((x) => x.side !== faction && x.alive && x.pos && UNITS[x.defId].attackType === 'melee').flatMap(cellsOf);
  const safety = (k: HexKey) => (melee.length ? Math.min(...melee.map((c) => dist(c, k))) : 0);
  const keep = own
    .filter((x) => !isLarge(state, x) && !buriesAtDeploy(state, x) && (x.hp < x.maxHp || UNITS[x.defId].attackType === 'ranged'))
    .sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp || (x.id < y.id ? -1 : 1));
  for (const u of keep) {
    if (moves.length >= FACTION_MECHANICS_REARRANGE) break;
    const busy = takenBy();
    const cell = deployCells(b, faction).filter((k) => !busy.has(k)).sort((x, y) => safety(y) - safety(x) || (x < y ? -1 : 1))[0];
    if (cell && u.pos && safety(cell) >= safety(u.pos) + 2) {
      positions[u.id] = cell;
      moves.push(u.id);
    }
  }
  return { type: 'deployUnits', faction, positions };
}

/**
 * The Desert Empire's own moves before the plan: a unit in trouble swaps places with its mirage (Pałac Mirażu III) when the mirage stands safer, and the
 * Czerw comes up from the sand next to the enemy when it cannot reach anyone on foot.
 */
function sandsMove(state: GameState, u: BattleUnit): Action | null {
  const b = state.battle!;
  const act = b.activation!;
  if (mirageSwapReady(state, u) && u.hp * 2 <= u.maxHp) {
    const threats = threatsTo(state, u);
    const m = miragesOf(b, u.id).filter((x) => x.pos).sort((x, y) => danger(threats, cellsOf(x)) - danger(threats, cellsOf(y)) || (x.id < y.id ? -1 : 1))[0];
    if (m && danger(threats, cellsOf(m)) + 2 <= danger(threats, cellsOf(u))) return { type: 'battleMirageSwap', mirageId: m.id };
  }
  if (abilityOf(u) === 'wyrmBurrow' && !act.moved && !act.attacked && !attackTargets(state, u).length) {
    const walk = [...reachableCells(state, u)].some(([c]) => attackTargets(state, u, c).length > 0);
    if (walk) return null;
    const enemies = enemiesOf(b, u);
    const gap = (k: HexKey) => Math.min(99, ...enemies.map((e) => dist2(cellsOf(e), footprintAt(state, u, k))));
    const best = wyrmCells(state, u).sort((x, y) => gap(x) - gap(y) || (x < y ? -1 : 1))[0];
    if (best && gap(best) < Math.min(99, ...enemies.map((e) => unitDistance(e, u)))) return { type: 'battleTeleport', to: best };
  }
  return null;
}

function rank(u: BattleUnit): number {
  const d = UNITS[u.defId];
  // The Kingdom of the Dead: the cheap skeletons stand in front (they rise again), the heroes and the shooters (the Lisz, the Wróżka) behind.
  if (d.side === 'undead') return d.kind === 'hero' || d.attackType === 'ranged' ? 3 : d.movement === 'fly' ? 2 : supportTier(d.id) <= 1 ? 0 : 1;
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
    let useAbility = !u.abilityUsed && abilityActive(state) && ATTACK_ABILITIES.includes(ab) && (ab !== 'ramBlow' || ramCharged(state, u));
    let second: BattleUnit | null = null;
    if (useAbility && isBreath(ab)) {
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

/**
 * The bot of a side never reads what that side may not see: when another side has mirages or buried units in the battle, it plans on the view of its own
 * side (`redactHidden`), where a mirage looks like the unit it copies under a mixed-up id; the engine turns the ids of its action back (`unmaskId`). Equal
 * choices are broken by those ids, so which body of a group it goes for follows the game's seed, never the truth.
 */
export function chooseBattleAction(state: GameState): Action {
  const b = state.battle!;
  const side = b.stage === 'fight' && b.activation ? b.units[b.activation.unitId]?.side : b.stage === 'deploy' ? b.needsDeploy[0] : undefined;
  if (side && Object.values(b.units).some((x) => x.side !== side && x.alive && (x.status.mirage || (x.status.veiled && x.pos)))) return planBattleAction(redactHidden(state, [side]));
  return planBattleAction(state);
}

function planBattleAction(state: GameState): Action {
  const b = state.battle!;
  if (b.stage === 'gear') return chooseGearPick(state, state.draft!.gear!.order[0]);
  if (b.stage === 'spells') return chooseSpellPick(state, state.draft!.spells!.order[0]);
  if (b.stage === 'select') return chooseSupports(state, b.needsSelection[0]);
  if (b.stage === 'deploy') return b.rearrange?.side === b.needsDeploy[0] ? chooseRearrange(state, b.needsDeploy[0]) : chooseDeployment(state, b.needsDeploy[0]);
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
  if (u.side !== 'neutral' && !act.acted && !isMirage(u)) {
    const item = itemToUse(state, u);
    if (item) return item;
  }
  const sands = sandsMove(state, u);
  if (sands) return sands;
  if (followsRulebook(state, u)) {
    const free = rulebookFreeAbility(state, u);
    if (free) return free;
    return rulebookAction(state, u);
  }
  const free = freeAbility(state, u);
  if (free) return free;
  const plan = planActivation(state, u);
  // Zasadzka Spod Piasku: the buried Queen stays under the sand until she can strike from where she comes out.
  if (u.status.veiled && abilityOf(u) === 'sandAmbush' && !plan.target) return { type: 'endActivation' };
  if (plan.moveTo && !act.moved && (!act.attacked || act.thrown)) return moveTo(state, u, plan.moveTo);
  if (plan.target && !act.attacked && !act.moveOnly) {
    // The plan may count on a charge the unit did not get on its way (Taran needs a run of 2+ cells): the engine rejects such a blow.
    const useAbility = plan.useAbility && (abilityOf(u) !== 'ramBlow' || ramCharged(state, u));
    return { type: 'battleAttack', targetId: plan.target.id, useAbility, secondTargetId: plan.second?.id };
  }
  return { type: 'endActivation' };
}
