// Battle engine: the painted arena (13 columns, 85 cells), initiative, movement, attacks,
// abilities and items. Functions change the GameState passed in.

import { raceOf } from './teams';
import { ABILITY, ABILITY_TIERS, MILESTONE_TIER, STAT_SCALE, supportTier, battleStats, DIGITAL_RANGED_BONUS, boardRangedBonus, FACTION_NAMES, ITEM_EFFECT, itemDef, ITEMS, UNITS, type AbilityId, type TeamId, type ItemKind, type Side } from './data';
import { distance, directionBetween, add, key, line, neighborKeys, parseKey, DIRECTIONS, type HexKey } from './hex';
import { log } from './log';
import { Rng } from './rng';
import { ARENA_COLUMNS, MIDDLE_HALF, arenaCell, cellOf, columnCells, inArena, WIDE_COLUMNS, WIDE_MIDDLE_ROW, WIDE_ROWS, wideCell, wideCellOf, layoutCells, inLayout, middleDistance, wideColumnCells, WIDE_SET } from './arenaLayout';
export * from './arenaLayout';
import { isDigital, type BattleState, type BattleUnit, type GameState, type GroundEffect, type SiegeState, type UnitStatus } from './types';
import { SIEGE } from './economy';
import { pushWithCollision, previewPush, pushedThisRound, taunter, canBeMoved, raiseUnit, fallenSupports, drainMana, pushAway, pullIn } from './primitives';
import { FACTION_MECHANICS, hasSpark, mechanicLevel, SPARK_NAMES } from './empire';


const OBSTACLE_SETS = new WeakMap<HexKey[], Set<HexKey>>();

/** The battle's obstacles as a set, built once per obstacle list. */
function obstacleSet(b: BattleState): Set<HexKey> {
  let set = OBSTACLE_SETS.get(b.obstacles);
  if (!set) OBSTACLE_SETS.set(b.obstacles, (set = new Set(b.obstacles)));
  return set;
}

/** The cells a living unit lies on: its head, and for a large unit (digital ruleset) its tail. */
export function cellsOf(u: BattleUnit): HexKey[] {
  return u.pos ? (u.tail ? [u.pos, u.tail] : [u.pos]) : [];
}

/** Digital ruleset: whether the unit lies on two cells (head + tail). Duels never use large units. */
export function isLarge(state: GameState, u: BattleUnit): boolean {
  return isDigital(state.rules) && UNITS[u.defId].size === 2 && !state.battle?.duel;
}

/** Living units by cell, for searches that look up many cells (the first listed, as unitAt finds it); `skip` leaves one unit out. */
function occupancy(b: BattleState, skip?: BattleUnit): Map<HexKey, BattleUnit> {
  const out = new Map<HexKey, BattleUnit>();
  for (const u of Object.values(b.units)) {
    if (!u.alive || u === skip) continue;
    for (const c of cellsOf(u)) if (!out.has(c)) out.set(c, u);
  }
  return out;
}

/**
 * Cells where the tail of a large unit may lie when its head is on `head`: the four neighbours in the next columns
 * (column ±1, half-row ±1), free of obstacles and other units. The side it already lies on comes first, so a unit keeps
 * its facing unless the move turns it (a move to the right faces right, the tail trails on the left).
 */
export function tailOptions(b: BattleState, u: BattleUnit, head: HexKey, units: Map<HexKey, BattleUnit> = occupancy(b, u)): HexKey[] {
  if (b.layout === 'wide') return wideTailOptions(b, u, head, units);
  const { col, half } = cellOf(head);
  let prefer = u.side === b.attacker ? -1 : 1;
  if (u.pos && u.tail) prefer = Math.sign(cellOf(u.tail).col - cellOf(u.pos).col) || prefer;
  if (u.pos && u.pos !== head) {
    const dc = col - cellOf(u.pos).col;
    if (dc) prefer = -Math.sign(dc);
  }
  const obstacles = obstacleSet(b);
  const out: HexKey[] = [];
  for (const side of [prefer, -prefer]) {
    for (const dh of [-1, 1]) {
      const k = arenaCell(col + side, half + dh);
      if (inArena(k) && !obstacles.has(k) && !units.has(k)) out.push(k);
    }
  }
  return out;
}

/**
 * Wide arena: the tail lies in the same row, right or left of the head. The side it already lies on comes first, and a move
 * turns the unit the way it goes (a move to the right trails the tail on the left), so the second option is the turn.
 */
function wideTailOptions(b: BattleState, u: BattleUnit, head: HexKey, units: Map<HexKey, BattleUnit>): HexKey[] {
  const h = parseKey(head);
  const x = (k: { q: number; r: number }) => k.q + k.r / 2;
  let prefer = u.side === b.attacker ? -1 : 1;
  if (u.pos && u.tail) prefer = Math.sign(x(parseKey(u.tail)) - x(parseKey(u.pos))) || prefer;
  if (u.pos && u.pos !== head) {
    const dx = x(h) - x(parseKey(u.pos));
    if (Math.abs(dx) > 0.01) prefer = -Math.sign(dx);
  }
  const obstacles = obstacleSet(b);
  return [prefer, -prefer].map((d) => key({ q: h.q + d, r: h.r })).filter((k) => WIDE_SET.has(k) && !obstacles.has(k) && !units.has(k));
}

/** Puts the unit's head on `head` (and for a large unit its tail on `tail`, or the first legal tail). False when it does not fit. */
export function placeUnit(state: GameState, u: BattleUnit, head: HexKey, tail?: HexKey): boolean {
  if (!isLarge(state, u)) {
    u.pos = head;
    delete u.tail;
    return true;
  }
  const options = tailOptions(state.battle!, u, head);
  const t = tail && options.includes(tail) ? tail : options[0];
  if (!t) return false;
  u.pos = head;
  u.tail = t;
  return true;
}

/** Whether a unit could stand with its head on `head` (always for a small one). */
export function fitsAt(state: GameState, u: BattleUnit, head: HexKey): boolean {
  return !isLarge(state, u) || tailOptions(state.battle!, u, head).length > 0;
}

/** The cells the unit would cover with its head on `from` (a planned move): head plus the first legal tail. */
export function footprintAt(state: GameState, u: BattleUnit, from: HexKey): HexKey[] {
  if (from === u.pos) return cellsOf(u);
  if (!isLarge(state, u)) return [from];
  const t = tailOptions(state.battle!, u, from)[0];
  return t ? [from, t] : [from];
}

/** A fallen unit leaves the board (its cells become free) and, in the digital ruleset, a corpse where it lay. */
function removeFromBoard(state: GameState, u: BattleUnit, corpse: boolean) {
  if (corpse && isDigital(state.rules) && u.pos) {
    u.corpse = u.pos;
    if (u.tail) u.corpseTail = u.tail;
  }
  u.pos = null;
  delete u.tail;
}

const SIGHT_LINES = new Map<string, readonly HexKey[]>();

/** The cells strictly between two cells on a straight line. */
function cellsBetween(from: HexKey, to: HexKey): readonly HexKey[] {
  const k = `${from}|${to}`;
  let cells = SIGHT_LINES.get(k);
  if (!cells) SIGHT_LINES.set(k, (cells = line(parseKey(from), parseKey(to)).map(key).slice(1, -1)));
  return cells;
}

/** How many times larger than the board game's the numbers of this game are (the Życie and Atak of units and everything that adds or takes them): 1 or, in the digital Expedition, 3. */
export const scaleOf = (state: Pick<GameState, 'rules'>): number => state.rules.statScale ?? 1;
/** The same for Życie and for what restores it (healing): its own scale, by default the same as Atak's. */
export const hpScaleOf = (state: Pick<GameState, 'rules'>): number => state.rules.hpScale ?? scaleOf(state);

export function newStatus(): UnitStatus {
  return { slowNext: 0, rootedNext: false, cursedNext: 0, nextAttackBonus: 0, battleAttackBonus: 0, battleSpeedBonus: 0, damageReduction: 0, shieldArmed: false };
}

export function makeBattleUnit(defId: string, side: Side, digital = false, scale = 1, hpScale = scale, arena: boolean | 3 | 6 = false, share = 1): BattleUnit {
  const { hp } = battleStats(defId, digital, scale, hpScale, arena, share);
  return { id: defId, defId, side, hp, maxHp: hp, ...(digital ? { digital: true as const } : {}), ...(arena ? { arena: arena === true ? (true as const) : arena } : {}), ...(!arena && share !== 1 ? { bonusShare: share } : {}), ...(scale !== 1 ? { scale } : {}), ...(hpScale !== scale ? { hpScale } : {}), pos: null, alive: true, abilityUsed: false, swappedOut: false, status: newStatus() };
}

/** Asks the screen for a light effect on `cell` (see BattleState.fx). */
export function battleFx(state: GameState, kind: NonNullable<BattleState['fx']>[number]['kind'], cell: HexKey | null | undefined): void {
  if (state.battle && cell) (state.battle.fx ??= []).push({ kind, cell });
}

const unitName = (u: BattleUnit) => UNITS[u.defId].name;

/** The hero that leads the side opposed to `side` (the id of its unit in the battle; may be no hero at all, e.g. a guardian's den). */
export const enemyHeroId = (b: BattleState, side: Side): string => ((side === b.attacker ? b.defenderHero : b.attackerHero) ?? '');

// ---------------------------------------------------------------- queries

export function abilityActive(state: GameState): boolean {
  return state.rules.abilities;
}

/** A hero ability's number for the milestone this unit has reached (small scale: multiply by `scaleOf`). */
export const abilityNum = (u: BattleUnit, key: keyof typeof ABILITY_TIERS): number => ABILITY_TIERS[key][u.tier ?? 0];

/**
 * Whether poison, curses, slows and roots do not work on the unit: the Kingdom of the Dead (the Spark, and the Nawiedzona Zbroja on its own) are immune to all of them;
 * with `unboundToo` also whoever wears boots that free from roots and slows (the old artifacts, which never covered poison and curses).
 */
export const resistsStatus = (state: GameState, u: BattleUnit, unboundToo: boolean): boolean =>
  Boolean(u.status.immune) || (abilityActive(state) && abilityOf(u) === 'hollow') || (unboundToo && Boolean(u.gear?.unbound));

/** Whether poison does not work on the unit: whoever resists every status, the Niedźwiedź w Zbroi, and the Mangusta Faraona (Odporność na Jad: poison only). */
export const resistsPoison = (state: GameState, u: BattleUnit): boolean =>
  resistsStatus(state, u, false) || abilityOf(u) === 'bronzeQuills' || (abilityActive(state) && abilityOf(u) === 'venomImmune');

/** The breath of fire: Ognisty Oddech and Oddech Grobu hit the target and the unit behind it. */
export const isBreath = (ab: AbilityId): boolean => ab === 'fireBreath' || ab === 'graveBreath';

export function abilityOf(u: BattleUnit): AbilityId {
  return u.ability ?? UNITS[u.defId].ability;
}

export function livingUnits(b: BattleState, side?: Side): BattleUnit[] {
  return Object.values(b.units).filter((u) => u.alive && u.pos !== null && (side === undefined || u.side === side));
}

export function unitAt(b: BattleState, k: HexKey): BattleUnit | undefined {
  return Object.values(b.units).find((u) => u.alive && (u.pos === k || u.tail === k));
}

/** The enemies the unit can see: a veiled one (Ukryty) is not among them, so nobody can choose it as a target, and the bots do not know it is there. */
export function enemiesOf(b: BattleState, u: BattleUnit): BattleUnit[] {
  return livingUnits(b).filter((o) => o.side !== u.side && !o.status.veiled);
}

export function alliesOf(b: BattleState, u: BattleUnit): BattleUnit[] {
  return livingUnits(b).filter((o) => o.side === u.side && o.id !== u.id && !o.status.mirage);
}

export function activeUnit(b: BattleState): BattleUnit | null {
  return b.activation ? b.units[b.activation.unitId] : null;
}

export function unitSpeed(u: BattleUnit): number {
  return battleStats(u.defId, u.digital, u.scale, u.hpScale, u.arena, u.bonusShare).speed + u.status.battleSpeedBonus + (u.status.auraSpeed ?? 0) - (u.status.auraChill ?? 0) - (u.status.frost ?? 0) * (u.status.frostSlow ?? 0);
}

export function unitAttackBase(u: BattleUnit): number {
  return battleStats(u.defId, u.digital, u.scale, u.hpScale, u.arena, u.bonusShare).attack + u.status.battleAttackBonus;
}

/** How much a unit's reach is cut by slows (a slow of the last hit, frost, the cold light of a Duch Zorzy); every movement ability (hop, teleport, leap) is cut by it like a walk. */
export const slowCut = (u: BattleUnit): number => u.status.slowNext + (u.status.auraChill ?? 0) + (u.status.frost ?? 0) * (u.status.frostSlow ?? 0);

/** A fixed range of a movement ability, cut by slows; a rooted unit does not move at all. */
export const slowedRange = (u: BattleUnit, range: number): number => (u.status.rootedNext ? 0 : Math.max(0, range - slowCut(u)));

export function moveRange(u: BattleUnit): number {
  if (u.status.rootedNext) return 0;
  return Math.max(0, unitSpeed(u) - u.status.slowNext);
}

/**
 * Breadth-first search over the cells a walker can pass: not through obstacles nor any other unit
 * (allies included, since 2026-10-22: the user's decision).
 */
function walkSearch(state: GameState, u: BattleUnit, leaping = canLeap(state, u)): { dist: Map<HexKey, number>; parent: Map<HexKey, HexKey> } {
  const b = state.battle!;
  const range = moveRange(u);
  const obstacles = obstacleSet(b);
  const units = occupancy(b, u);
  // A large unit drags its tail along: it may only pass cells where some tail cell is free (a gap of one cell between two units is too narrow).
  const large = isLarge(state, u);
  const leaps = leaping;
  const dist = new Map<HexKey, number>([[u.pos!, 0]]);
  const parent = new Map<HexKey, HexKey>();
  const queue = [u.pos!];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    const d = dist.get(cur)!;
    if (d >= range) continue;
    // Siege: a walker that steps into the moat stops there.
    if (head > 0 && b.siege?.moat.includes(cur)) continue;
    for (const n of neighborKeys(cur)) {
      if (!inLayout(b, n) || dist.has(n)) continue;
      if (!leaps && (obstacles.has(n) || units.has(n))) continue;
      if (large && tailOptions(b, u, n, units).length === 0) continue;
      dist.set(n, d + 1);
      parent.set(n, cur);
      queue.push(n);
    }
  }
  return { dist, parent };
}

/** Skok po Turniach: the unit walks through obstacles and units (it cannot stop on them), except over the walls of a siege. */
export const canLeap = (state: GameState, u: BattleUnit): boolean => abilityOf(u) === 'mountainLeap' && abilityActive(state) && !state.battle?.siege && !isLarge(state, u);

/** Taran (Kozioł Taranowy): the blow is charged when the unit has run at least this far in this activation. */
export const ramCharged = (state: GameState, u: BattleUnit): boolean => {
  const act = state.battle?.activation;
  return Boolean(act && act.unitId === u.id && act.movedDistance >= ABILITY.ramBlowMinMove);
};

/** Cells the unit can end its move on, with the number of steps used. */
export function reachableCells(state: GameState, u: BattleUnit): Map<HexKey, number> {
  const b = state.battle!;
  const out = new Map<HexKey, number>();
  if (!u.pos || b.duel) return out;
  const range = moveRange(u);
  const obstacles = obstacleSet(b);
  const units = occupancy(b, u);
  const occupant = (k: HexKey) => units.get(k);
  // A large unit needs room for its tail as well: the head may only go where some tail cell is free.
  const large = isLarge(state, u);
  const roomy = (k: HexKey) => !large || tailOptions(b, u, k, units).length > 0;
  if (flies(u)) {
    for (const k of layoutCells(b)) {
      if (k === u.pos || obstacles.has(k) || occupant(k)) continue;
      const d = distance(parseKey(u.pos), parseKey(k));
      if (d <= range && roomy(k)) out.set(k, d);
    }
    return out;
  }
  const walked = walkSearch(state, u);
  for (const [k, d] of walked.dist) if (d > 0 && !occupant(k) && !obstacles.has(k) && roomy(k)) out.set(k, d);
  // Szalony Skok adds the cells within the leap's range that the walk does not reach.
  for (const k of leapOnlyCells(state, u)) out.set(k, distance(parseKey(u.pos), parseKey(k)));
  return out;
}

/**
 * The cells a unit passes on its way to `to`, both ends included: hex by hex around obstacles
 * and enemies for a walker, straight over everything for a flyer. Call it on the state before
 * the move. Falls back to [from, to] when there is no walking path (e.g. a teleport).
 */
export function movePath(state: GameState, u: BattleUnit, to: HexKey): HexKey[] {
  if (!u.pos) return [to];
  if (u.pos === to) return [to];
  if (state.battle!.duel || flies(u)) return [u.pos, to];
  const { parent } = walkSearch(state, u);
  if (!parent.has(to)) return [u.pos, to];
  const path = [to];
  while (path[0] !== u.pos) path.unshift(parent.get(path[0])!);
  return path;
}

/** Obstacles block a shot; units standing in the way do not, unless `rules.unitsBlockSight` is on. */
export function hasLineOfSight(state: GameState, from: HexKey, to: HexKey): boolean {
  const b = state.battle!;
  const obstacles = obstacleSet(b);
  const between = cellsBetween(from, to);
  // A siege has no other obstacles than the walls, and shots fly over walls.
  if (!b.siege && between.some((k) => obstacles.has(k))) return false;
  if (!state.rules.unitsBlockSight) return true;
  // A unit's own cells (a large unit's tail) never hide it from itself, so cells of the shooter and target are ignored.
  const all = Object.values(b.units);
  const ends = new Set(all.filter((u) => cellsOf(u).some((c) => c === from || c === to)).flatMap(cellsOf));
  return !all.some((u) => u.pos && !ends.has(u.pos) && cellsOf(u).some((c) => between.includes(c)));
}

const adjacent = (a: HexKey, b: HexKey) => distance(parseKey(a), parseKey(b)) === 1;

/** Distance between two units: the shortest distance between any of their cells. */
export function unitDistance(a: BattleUnit, b: BattleUnit): number {
  let best = Infinity;
  for (const x of cellsOf(a)) for (const y of cellsOf(b)) best = Math.min(best, distance(parseKey(x), parseKey(y)));
  return best;
}

const unitsAdjacent = (a: BattleUnit, b: BattleUnit) => unitDistance(a, b) === 1;

/** Kraken's head is untouchable while any tentacle of its side lives. */
export const headCovered = (state: GameState, u: BattleUnit) =>
  abilityOf(u) === 'tentacles' && abilityActive(state) && livingUnits(state.battle!, u.side).some((x) => x.defId === 'tentacle');

/** Legal attack targets from the unit's current position. */
export function attackTargets(state: GameState, u: BattleUnit, from: HexKey | null = u.pos): BattleUnit[] {
  const b = state.battle!;
  if (!from || u.status.mirage || u.status.riddled) return [];
  // Kraken: the head cannot be hit while a tentacle lives.
  const enemies = enemiesOf(b, u).filter((e) => !headCovered(state, e));
  const mine = footprintAt(state, u, from);
  const near = enemies.filter((e) => cellsOf(e).some((c) => mine.some((m) => adjacent(m, c))));
  // Rykowisko: a challenged unit may attack only the one that called it out.
  const challenger = taunter(state, u);
  const only = (list: BattleUnit[]) => (challenger ? list.filter((e) => e.id === challenger.id) : list);
  if (UNITS[u.defId].attackType === 'melee') return only(near);
  if (near.length) return only(near);
  return only(enemies.filter((e) => cellsOf(e).some((c) => hasLineOfSight(state, from, c))));
}

/**
 * What the unit can reach this turn, for the Ctrl-hover display: the cells it can walk to, and the other cells it could hit
 * from where it stands or from any of them (next to its head or, for a large unit, its tail; shooters: any cell in sight of the
 * head). It follows `attackTargets`, which counts the whole footprint.
 */
export function unitReach(state: GameState, u: BattleUnit): { walk: Set<HexKey>; hit: Set<HexKey> } {
  const b = state.battle!;
  const walk = new Set<HexKey>(reachableCells(state, u).keys());
  const hit = new Set<HexKey>();
  if (!u.pos) return { walk, hit };
  const stands = [{ head: u.pos, cells: cellsOf(u) }, ...[...walk].map((k) => ({ head: k, cells: footprintAt(state, u, k) }))];
  const ranged = UNITS[u.defId].attackType === 'ranged';
  const obstacles = obstacleSet(b);
  const own = new Set(cellsOf(u));
  for (const c of layoutCells(b)) {
    if (obstacles.has(c) || walk.has(c) || own.has(c)) continue;
    if (stands.some((s) => s.cells.some((m) => adjacent(m, c)) || (ranged && hasLineOfSight(state, s.head, c)))) hit.add(c);
  }
  return { walk, hit };
}

/**
 * Second target for Ognisty Oddech: the unit standing right behind the first one, in line from the
 * dragon (standing on `from`, its own cell unless a plan tries another).
 */
export function breathSecondTarget(state: GameState, u: BattleUnit, first: BattleUnit, from: HexKey | null = u.pos): BattleUnit | null {
  const b = state.battle!;
  if (!from || !first.pos) return null;
  const dir = directionBetween(parseKey(from), parseKey(first.pos));
  if (!dir) return null;
  const behind = key(add(parseKey(first.pos), dir));
  const other = unitAt(b, behind);
  // The digital ruleset: the flame does not know friends from foes, an ally standing behind the target burns too (the author's decision of 10.11).
  return other && other.id !== first.id && (other.side !== u.side || isDigital(state.rules)) ? other : null;
}

/** Digital ruleset: the target's front is where it last moved or attacked; a unit that has done neither faces its nearest enemy. */
function frontOf(state: GameState, target: BattleUnit): { q: number; r: number } | null {
  if (target.facing) return target.facing;
  if (!target.pos) return null;
  const me = parseKey(target.pos);
  const near = enemiesOf(state.battle!, target)
    .filter((e) => e.pos)
    .sort((a, b) => unitDistance(target, a) - unitDistance(target, b))[0];
  return near?.pos ? { q: parseKey(near.pos).q - me.q, r: parseKey(near.pos).r - me.r } : null;
}

const cartesian = (v: { q: number; r: number }) => ({ x: v.q + v.r / 2, y: v.r * 0.8660254 });

/** Zajście od tyłu: whether the attacker stands in the half-plane behind the target's front. */
export function fromBehind(state: GameState, att: BattleUnit, target: BattleUnit): boolean {
  if (!att.pos || !target.pos) return false;
  const front = frontOf(state, target);
  if (!front) return false;
  const a = parseKey(att.pos);
  const t = parseKey(target.pos);
  const f = cartesian(front);
  const d = cartesian({ q: a.q - t.q, r: a.r - t.r });
  return f.x * d.x + f.y * d.y < -1e-9;
}

/** Czołowe Natarcie: whether the attacker stands in the half-plane in front of the target (the opposite of `fromBehind`). */
export function fromFront(state: GameState, att: BattleUnit, target: BattleUnit): boolean {
  if (!att.pos || !target.pos) return false;
  const front = frontOf(state, target);
  if (!front) return false;
  const a = parseKey(att.pos);
  const t = parseKey(target.pos);
  const f = cartesian(front);
  const d = cartesian({ q: a.q - t.q, r: a.r - t.r });
  return f.x * d.x + f.y * d.y > 1e-9;
}

/** Obława: whether another ally of the attacker stands next to the target. */
const packNearby = (state: GameState, att: BattleUnit, target: BattleUnit) =>
  livingUnits(state.battle!, att.side).some((x) => x.id !== att.id && unitsAdjacent(x, target));

/** Kamienny Golem: its rune core is bare once it has lost half its Życie. */
export const coreExposed = (u: BattleUnit) => abilityOf(u) === 'runeGolem' && u.hp * 2 <= u.maxHp;

/** Expected damage of a plain attack, before the defender's reactions. */
export function attackDamage(state: GameState, att: BattleUnit, target: BattleUnit, useAbility: boolean, movedDistance: number): number {
  let dmg = unitAttackBase(att) + att.status.nextAttackBonus - att.status.cursedNext - (att.status.blinded ?? 0);
  if (UNITS[att.defId].attackType === 'ranged') dmg += (isDigital(state.rules) ? DIGITAL_RANGED_BONUS : boardRangedBonus(att.defId)) * scaleOf(state);
  if (att.gear?.vsWounded && target.hp < target.maxHp) dmg += att.gear.vsWounded;
  if (att.gear?.firstStrike) dmg += att.gear.firstStrike;
  if (abilityActive(state)) {
    const ab = abilityOf(att);
    if (ab === 'lightCharge' && movedDistance >= ABILITY.lightChargeMinMove) dmg += abilityNum(att, 'lightChargeBonus') * scaleOf(state);
    if (ab === 'huntDive' && movedDistance >= ABILITY.huntDiveMinMove) dmg += ABILITY.huntDiveBonus * scaleOf(state);
    if (ab === 'bloodCall' && target.hp < target.maxHp) dmg += abilityNum(att, 'bloodCallBonus') * scaleOf(state);
    if (useAbility && ab === 'fireBreath') dmg += abilityNum(att, 'breathBonus') * scaleOf(state);
    if (useAbility && ab === 'ramBlow' && movedDistance >= ABILITY.ramBlowMinMove) dmg += ABILITY.ramBlowBonus * scaleOf(state);
    if (ab === 'standShot' && movedDistance === 0) dmg += ABILITY.standShotBonus * scaleOf(state);
    if (ab === 'giantBane' && isLarge(state, target)) dmg += ABILITY.giantBonus * scaleOf(state);
    // Strzał zza Wydmy: the archer next to an obstacle shoots harder.
    if (ab === 'coverShot' && att.pos && cellsOf(att).some((c) => neighborKeys(c).some((k) => obstacleSet(state.battle!).has(k)))) dmg += ABILITY.coverBonus * scaleOf(state);
    // Wolna Kompania. Oznaczenie: every attack of the marker's side on a marked target (this round) hits harder, and the squirrel's arrow harder still.
    const mark = target.status.marked;
    if (mark && mark.by === att.side && mark.round === state.battle!.round) dmg += (ABILITY.markBonus + (ab === 'branchShot' ? ABILITY.branchBonus : 0)) * scaleOf(state);
    if (ab === 'woundFury') dmg += Math.min(ABILITY.furyMax, Math.floor((att.maxHp - att.hp) / (ABILITY.furyStep * hpScaleOf(state)))) * scaleOf(state);
    if (ab === 'veiled' && att.status.veiled) dmg += ABILITY.veilBonus * scaleOf(state);
    if (ab === 'wildLeap' && state.battle!.activation?.unitId === att.id && state.battle!.activation.leaped) dmg += ABILITY.wildLeapBonus * scaleOf(state);
    // Kryształowa Strzała: a target that has frost takes more.
    if (ab === 'crystalArrow' && (target.status.frost ?? 0) >= 1) dmg += ABILITY.crystalBonus * scaleOf(state);
    if (useAbility && ab === 'spectralCharge') dmg += (ABILITY.spectralBonus + (fromBehind(state, att, target) ? ABILITY.spectralBehind : 0)) * scaleOf(state);
    if (useAbility && ab === 'nightAmbush') dmg += ABILITY.nightAmbushBonus * scaleOf(state);
    if (ab === 'dive' && movedDistance >= ABILITY.diveMinMove) dmg += ABILITY.diveBonus * scaleOf(state);
    if (ab === 'backstab' && fromBehind(state, att, target)) dmg += ABILITY.backstabBonus * scaleOf(state);
    if (ab === 'headlong' && fromFront(state, att, target)) dmg += ABILITY.headlongBonus * scaleOf(state);
    if (ab === 'packHunt' && packNearby(state, att, target)) dmg += ABILITY.packHuntBonus * scaleOf(state);
    if (ab === 'momentum' && movedDistance >= ABILITY.momentumMinMove) dmg += ABILITY.momentumBonus * scaleOf(state);
    if (ab === 'hippoStrike' && pushedThisRound(state, target)) dmg += ABILITY.hippoBonus * scaleOf(state);
    // Rój Puszczy: Ostatnie Cięcie at a wounded target, Mrowisko and Chitynowa Ściana in a group, Polowanie w Locie at flyers and shooters.
    if (ab === 'lastCut' && target.hp * 2 <= target.maxHp) dmg += ABILITY.lastCutBonus * scaleOf(state);
    if ((ab === 'anthill' || ab === 'chitinWall') && att.pos) dmg += groupMates(state.battle!, att) * ABILITY.groupBonus * scaleOf(state);
    if (ab === 'airHunt' && (flies(target) || UNITS[target.defId].attackType === 'ranged')) dmg += ABILITY.airHuntBonus * scaleOf(state);
    // Postrach: a Strach Polny next to the attacker takes some of its strength (several scarecrows do not add up).
    if (livingUnits(state.battle!).some((x) => x.side !== att.side && abilityOf(x) === 'dread' && unitsAdjacent(x, att))) dmg -= ABILITY.dreadMinus * scaleOf(state);
  }
  // Grzybnia: a unit of the Swarm on its own mycelium hits harder (the Serce Grzybni).
  if (state.battle && myceliumLevel(state, att.side) >= 1 && onOwnMycelium(state.battle, att)) dmg += FACTION_MECHANICS.myceliumAttack * scaleOf(state);
  return Math.max(0, dmg);
}

/** Abilities that are switched on for a single attack. */
export const ATTACK_ABILITIES: AbilityId[] = ['entanglingRoots', 'fireBreath', 'curse', 'nightAmbush', 'poisonClaw', 'inferno', 'ancestralHorns', 'dimLight', 'spectralCharge', 'graveBreath', 'stunBlow', 'ramBlow', 'frostSlow', 'frostGrip', 'iceBlow', 'stinkBomb', 'hypnosis', 'daggerThrow', 'sleepSpores', 'harpoon', 'inkCloud', 'whirl'];
/** Guardian abilities work on every attack, with no once-per-battle limit. */
export const UNLIMITED_ABILITIES: AbilityId[] = ['duckFury', 'huntDive', 'boulder', 'nestLeap', 'manyHeads', 'stoneSkin', 'thiefClaw', 'regrowth', 'shardBurst', 'burrow', 'dive', 'backstab', 'grab', 'bogRegrowth', 'runeGolem', 'stormKing', 'tentacles', 'quills', 'headlong', 'packHunt', 'bloodRage', 'headbutt', 'mountainLeap', 'momentum', 'unmoved', 'pierce', 'hippoStrike', 'drumBeat', 'ram', 'armorPierce', 'dread', 'hollow', 'manaReap', 'bulwark', 'standShot', 'bronzeQuills', 'giantBane', 'cannonFire', 'crystalArrow', 'thickFur', 'frostArmor', 'hailStones', 'coldLight', 'blizzardTrail', 'pickpocket', 'branchShot', 'veiled', 'woundFury', 'riposte', 'towerShot', 'wildLeap', 'sandAmbush', 'jackalWatch', 'venomImmune', 'coverShot', 'awakening', 'gateWard', 'wyrmBurrow', 'decoy', 'lastCut', 'chitinWall', 'puffball', 'anthill', 'metamorphosis', 'homeGround', 'airHunt', 'coil', 'slimeTrail', 'tuskShove', 'pincers', 'livingReef'];

/** Whether the attacker may hit a second adjacent enemy with this attack (Paszcze Otchłani). */
export function canHitTwo(state: GameState, u: BattleUnit): boolean {
  return abilityOf(u) === 'manyHeads' && abilityActive(state);
}

/**
 * Miażdżący Głaz: the cell the target is pushed to — the next hex on the line from the
 * attacker through the target — or null when it is off the arena, an obstacle or taken.
 */
export function pushCell(state: GameState, from: HexKey, target: HexKey): HexKey | null {
  const b = state.battle!;
  const a = parseKey(from);
  const t = parseKey(target);
  const path = line(a, { q: 2 * t.q - a.q, r: 2 * t.r - a.r });
  const cell = path[distance(a, t) + 1];
  if (!cell) return null;
  const k = key(cell);
  if (!inLayout(b, k) || b.obstacles.includes(k) || unitAt(b, k)) return null;
  return k;
}
/** Abilities used as a free action during the unit's activation. */
export const FREE_ABILITIES: AbilityId[] = ['beardChill', 'sunburst', 'giftOfLife', 'web', 'rhythm', 'wanderHorn', 'roar', 'tremor', 'barrowCall', 'breathAgain', 'wail', 'toll', 'viyGaze', 'shieldOath', 'stoneRune', 'temper', 'misleadLight', 'fortify', 'iceWall', 'bellOfGlass', 'longNight', 'ploy', 'dugIn', 'ravenEye', 'dam', 'blast', 'sandPortal', 'riddle', 'napWatch', 'mirageMake', 'rocLift', 'spreadSpores', 'greatChorus', 'waterWall', 'sirenSong', 'deepCoil', 'molt', 'shellUp', 'pearlShield', 'wingBeat', 'ebbTide', 'deepWhirl'];
/** The free abilities that need no target (one click fires them); the others ask the player to pick a unit. */
export const UNTARGETED_ABILITIES: AbilityId[] = ['sunburst', 'wanderHorn', 'tremor', 'barrowCall', 'breathAgain', 'wail', 'toll', 'shieldOath', 'fortify', 'iceWall', 'longNight', 'dugIn', 'napWatch', 'greatChorus', 'waterWall', 'molt', 'shellUp', 'wingBeat', 'deepWhirl'];
/** The free abilities that work on a cell: the player may pick it (the action's `cell`), without one the best cell for the unit is taken (Fortel, Tama, Ładunek). */
export const CELL_ABILITIES: AbilityId[] = ['ploy', 'dam', 'blast', 'spreadSpores'];

// ---------------------------------------------------------------- lifecycle

/** After support selection: default placement, then each faction may rearrange (attacker first). */
export function startBattleFight(state: GameState) {
  const b = state.battle!;
  deploy(state);
  // Pałac Mirażu: the mirages stand with the units from the start (each side deploys them like its own units).
  setUpMirages(state);
  b.needsDeploy = b.duel ? [] : ([b.attacker, b.defender].filter((s) => s !== 'neutral') as TeamId[]);
  if (b.needsDeploy.length) {
    b.stage = 'deploy';
    return;
  }
  beginFight(state);
}

/** The Iskra of the Court of Everfrost: its enemies start the battle with frost (once, when the fight begins). */
export function sparkFrost(state: GameState): void {
  const b = state.battle!;
  for (const side of [b.attacker, b.defender]) {
    if (side === 'neutral' || raceOf(state, side) !== 'frost' || !hasSpark(state, side)) continue;
    const slow = mechLevel(state, side) >= FACTION_MECHANICS.frostSlowLevel ? 1 : 0;
    for (const x of Object.values(b.units)) {
      if (x.side === side) continue;
      x.status.frost = (x.status.frost ?? 0) + FACTION_MECHANICS.sparkFrost;
      if (slow) x.status.frostSlow = 1;
    }
    log(state, 'ability', `${FACTION_NAMES[raceOf(state, side)]}: wrogowie zaczynają bitwę z ${FACTION_MECHANICS.sparkFrost} szronem (Lodowy Tron).`);
  }
}

function beginFight(state: GameState) {
  const b = state.battle!;
  b.stage = 'fight';
  log(state, 'battle', 'Bitwa się rozpoczyna.');
  sparkFrost(state);
  // Grzybnia: the deploy cells of the Swarm (and with its Spark the middle of the arena) are its mycelium from the start.
  myceliumAtStart(state);
  // Ukryty: the Jenot Szpieg starts the fight unseen.
  if (abilityActive(state) && !b.duel) for (const x of Object.values(b.units)) if (x.alive && abilityOf(x) === 'veiled') x.status.veiled = true;
  // Przebudzenie: the stone guardians start the fight dormant.
  if (abilityActive(state) && !b.duel) for (const x of Object.values(b.units)) if (x.alive && abilityOf(x) === 'awakening') x.status.dormant = true;
  beginRound(state, 1);
}

/** Cells a side may deploy on: its edge column, minus obstacles. */
export function deployCells(b: BattleState, side: Side): HexKey[] {
  const wide = b.layout === 'wide';
  const attacking = side === b.attacker;
  const last = (wide ? WIDE_COLUMNS : ARENA_COLUMNS) - 1;
  const cells: HexKey[] = [];
  // The edge column first, then the extra columns of a side whose hero is a Taktyk.
  for (let d = 0; d <= (b.deployDepth?.[side] ?? 0); d++) {
    const col = attacking ? d : last - d;
    cells.push(...(wide ? wideColumnCells(col) : columnCells(col)));
  }
  return cells.filter((k) => !b.obstacles.includes(k));
}

/** Duel spots: the two leaders on neighbouring cells in the middle. */
const duelSpot = (b: BattleState, side: Side) =>
  b.layout === 'wide' ? wideCell(side === b.attacker ? 6 : 7, WIDE_MIDDLE_ROW) : side === b.attacker ? arenaCell(5, 9) : arenaCell(6, 10);

/**
 * The cell a unit holds in its side's start column. For a large unit that is its tail: the head lies one column
 * further towards the enemy (so a unit placed in column 0 faces right and one in column 12 faces left).
 */
export const deployCellOf = (u: BattleUnit): HexKey | null => u.tail ?? u.pos;

/** Head cells for a large unit whose tail lies on the deploy cell `k` of its side, nearest the middle row first. */
export function deployHeads(b: BattleState, side: Side, k: HexKey): HexKey[] {
  const towards = side === b.attacker ? 1 : -1;
  if (b.layout === 'wide') {
    const h = parseKey(k);
    const head = key({ q: h.q + towards, r: h.r });
    return WIDE_SET.has(head) && !b.obstacles.includes(head) ? [head] : [];
  }
  const { col, half } = cellOf(k);
  return [half - 1, half + 1]
    .sort((x, y) => Math.abs(x - MIDDLE_HALF) - Math.abs(y - MIDDLE_HALF) || x - y)
    .map((h) => arenaCell(col + towards, h))
    .filter((c) => inArena(c) && !b.obstacles.includes(c));
}

export function deployUnits(state: GameState, faction: TeamId, positions: Record<string, HexKey>, traps?: HexKey[]) {
  const b = state.battle!;
  if (b.stage !== 'deploy' || b.needsDeploy[0] !== faction) throw new Error('Teraz nie ustawia ta frakcja.');
  const own = Object.values(b.units).filter((u) => u.side === faction);
  const allowed = new Set(deployCells(b, faction));
  // Zasadzka Spod Piasku: the Queen may lie anywhere on her half.
  const ambush = own.some((u) => buriesAtDeploy(state, u)) ? new Set(ambushCells(b, faction)) : null;
  // Iskra of the Desert Empire: after both sides have deployed the side moves at most a few of its units.
  const rearranging = b.rearrange?.side === faction ? b.rearrange : null;
  if (rearranging) {
    const moved = own.filter((u) => positions[u.id] !== undefined && positions[u.id] !== rearranging.from[u.id]).length;
    if (moved > FACTION_MECHANICS.sparkRearrange) throw new Error(`Iskra pozwala przestawić najwyżej ${FACTION_MECHANICS.sparkRearrange} jednostki.`);
    if (traps?.length) throw new Error('Teraz tylko się przestawia jednostki.');
  }
  // Cells already taken by the other side count too (a large unit's head reaches into the next column).
  const used = new Set<HexKey>(Object.values(b.units).filter((u) => u.side !== faction).flatMap(cellsOf));
  const placed = new Map<string, { pos: HexKey; tail?: HexKey }>();
  // First every unit claims its own cell (a large one its tail); only then the large ones pick a head, so a head never takes a cell someone chose.
  const cellFor = new Map<string, HexKey>();
  for (const u of own) {
    const k = positions[u.id] ?? deployCellOf(u);
    if (!k || !(allowed.has(k) || (ambush?.has(k) && buriesAtDeploy(state, u)) || (rearranging && k === rearranging.from[u.id]))) throw new Error('Jednostki można ustawić tylko w swoich kolumnach startowych.');
    if (used.has(k)) throw new Error('Dwie jednostki nie mogą stać na jednym polu.');
    used.add(k);
    cellFor.set(u.id, k);
  }
  for (const u of own) {
    const k = cellFor.get(u.id)!;
    if (isLarge(state, u)) {
      const keep = u.pos && u.tail === k && !used.has(u.pos) ? [u.pos] : [];
      const head = [...keep, ...deployHeads(b, faction, k)].find((c) => !used.has(c));
      if (!head) throw new Error('Duża jednostka nie zmieści się na tym polu.');
      used.add(head);
      placed.set(u.id, { pos: head, tail: k });
    } else placed.set(u.id, { pos: k });
  }
  for (const u of own) {
    const at = placed.get(u.id)!;
    u.pos = at.pos;
    if (at.tail) u.tail = at.tail;
    else delete u.tail;
  }
  // Zasadzka Spod Piasku: the Queen lies buried, unseen by the enemy until she moves or strikes.
  for (const u of own) if (buriesAtDeploy(state, u)) u.status.veiled = true;
  b.needsDeploy.shift();
  if (rearranging) {
    delete b.rearrange;
    log(state, 'battle', `${FACTION_NAMES[raceOf(state, faction)]} przestawia jednostki (${SPARK_NAMES[raceOf(state, faction)]}).`);
  } else {
    // Sidła: the Free Companies lay their hidden traps with the units (the cells they chose, the rest are laid for them); nothing is said of where.
    const slots = trapSlots(state, faction);
    if (slots) layDeployTraps(state, faction, traps, slots);
    else if (traps?.length) throw new Error('Ta frakcja nie kładzie pułapek.');
    log(state, 'battle', `${FACTION_NAMES[raceOf(state, faction)]} ustawia swoje jednostki${slots ? ' i przygotowuje sidła' : ''}.`);
  }
  if (b.needsDeploy.length) return;
  // Iskra of the Desert Empire: when both sides stand, it may still move a few of its units.
  const spark = rearrangeDue(state);
  if (spark) {
    (b.rearranged ??= []).push(spark);
    b.rearrange = { side: spark, from: Object.fromEntries(Object.values(b.units).filter((x) => x.side === spark && x.pos).map((x) => [x.id, deployCellOf(x)!])) };
    b.needsDeploy = [spark];
    return;
  }
  beginFight(state);
}

function deploy(state: GameState) {
  const b = state.battle!;
  if (b.duel) {
    // Duel: the two leaders face each other on neighbouring cells.
    for (const u of Object.values(b.units)) u.pos = duelSpot(b, u.side);
    return;
  }
  for (const side of [b.attacker, b.defender]) {
    const cells = deployCells(b, side);
    const units = Object.values(b.units).filter((u) => u.side === side);
    // Hero (or guardian) in the middle, supports above and below.
    units.sort((x, y) => (UNITS[x.defId].kind === 'support' ? 1 : 0) - (UNITS[y.defId].kind === 'support' ? 1 : 0));
    const taken = new Set<HexKey>();
    units.forEach((u, i) => {
      // The first cell nobody holds (with a second start column a large unit's head may lie on a cell of that column).
      const k = cells.slice(i).find((c) => !taken.has(c)) ?? cells[i];
      if (isLarge(state, u)) {
        // Tail on the deploy cell, head one column towards the enemy (first free of the two).
        const head = deployHeads(b, side, k).find((c) => !taken.has(c));
        u.tail = k;
        u.pos = head ?? k;
        if (!head) delete u.tail;
        taken.add(u.pos);
        if (u.tail) taken.add(u.tail);
      } else {
        u.pos = k;
        delete u.tail;
        taken.add(k);
      }
    });
  }
}

function sidePriority(state: GameState, b: BattleState, side: Side): number {
  const attackerFirst = state.rules.initiativeTie === 'defender' ? false : b.round % 2 === 1;
  return (side === b.attacker) === attackerFirst ? 0 : 1;
}

function beginRound(state: GameState, round: number) {
  const b = state.battle!;
  if (round > state.rules.battleRoundLimit) {
    const hp = (side: Side) => realUnits(b, side).reduce((a, x) => a + x.hp, 0);
    const loser = hp(b.attacker) >= hp(b.defender) ? b.defender : b.attacker;
    log(state, 'battle', 'Bitwa trwa zbyt długo — strona z mniejszą sumą Ż przegrywa.');
    for (const x of realUnits(b, loser)) {
      x.alive = false;
      removeFromBoard(state, x, false);
    }
    checkBattleEnd(state);
    return;
  }
  if (round > 1) risingsAtRoundEnd(state);
  b.round = round;
  if (b.fields) b.fields = b.fields.filter((f) => f.until >= round);
  // Lodowa Ściana melts after its rounds; the Ślad Zamieci lasts only the round it was run in.
  if (b.ice?.some((i) => i.until < round)) {
    const gone = b.ice.filter((i) => i.until < round).map((i) => i.cell);
    b.ice = b.ice.filter((i) => i.until >= round);
    b.obstacles = b.obstacles.filter((c) => !gone.includes(c));
    b.raised = (b.raised ?? []).filter((c) => !gone.includes(c));
    log(state, 'ability', 'Lodowa ściana topnieje.');
  }
  if (b.trail) b.trail = b.trail.filter((t) => t.until >= round);
  refreshAuras(state);
  const ids = Object.keys(b.units);
  b.order = livingUnits(b)
    .sort((x, y) => unitSpeed(y) - unitSpeed(x) || sidePriority(state, b, x.side) - sidePriority(state, b, y.side) || ids.indexOf(x.id) - ids.indexOf(y.id))
    .map((u) => u.id);
  shuffleMirageTurns(state);
  b.index = 0;
  log(state, 'battle', `Runda bitwy ${round}.`);
  dawnLight(state);
  // Siege: every tower still standing shoots the weakest attacker.
  for (const tower of b.siege?.towers ?? []) {
    const target = livingUnits(b, b.attacker).sort((x, y) => x.hp - y.hp || ids.indexOf(x.id) - ids.indexOf(y.id))[0];
    if (!target) break;
    void tower;
    dealDamage(state, target, SIEGE.towerDamage * scaleOf(state), 'Wieżyczka');
  }
  if (b.siege?.towers.length) {
    if (checkBattleEnd(state)) return;
    b.order = b.order.filter((id) => b.units[id].alive);
  }
  // Płaszcz z Mchu: the hero regains Życie at the start of every round.
  for (const x of livingUnits(b)) {
    if (!x.gear?.regen || x.hp >= x.maxHp) continue;
    const healed = Math.min(x.gear.regen, x.maxHp - x.hp);
    x.hp += healed;
    log(state, 'ability', `${unitName(x)} odzyskuje ${healed} Ż (Płaszcz z Mchu).`);
    (b.heals ??= []).push({ unitId: x.id, amount: healed });
  }
  beginActivation(state, b.order[0], false);
}

/** Bęben Wędrówki: every unit with a drum of its side nearby has the aura's S (it does not add up). Counted when a round and an activation begin. */
export function refreshAuras(state: GameState) {
  const b = state.battle!;
  const drums = abilityActive(state) ? livingUnits(b).filter((x) => abilityOf(x) === 'drumBeat') : [];
  // Zimne Światło: the enemies of a Duch Zorzy within its radius are slower (it does not add up).
  const lights = abilityActive(state) ? livingUnits(b).filter((x) => abilityOf(x) === 'coldLight') : [];
  for (const x of Object.values(b.units)) {
    if (!x.alive || !x.pos) continue;
    if (lights.some((d) => d.side !== x.side && unitDistance(d, x) <= ABILITY.chillRadius)) x.status.auraChill = ABILITY.chillSlow;
    else delete x.status.auraChill;
    const near = drums.some((d) => d.side === x.side && d.id !== x.id && unitDistance(d, x) <= ABILITY.drumRadius);
    if (near) x.status.auraSpeed = ABILITY.drumHaste;
    else delete x.status.auraSpeed;
  }
}

function beginActivation(state: GameState, unitId: string, moveOnly: boolean) {
  const b = state.battle!;
  refreshAuras(state);
  b.activation = { unitId, moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly, hop: 0 };
  const u = b.units[unitId];
  if (u.status.slowLater) {
    u.status.slowNext += u.status.slowLater;
    u.status.slowLater = 0;
  }
  u.status.anchored = false;
  // Skorupa: the turtle comes out of its shell when its next activation begins.
  if (u.status.shelled) delete u.status.shelled;
  // Pałac Mirażu (fourth level): the one that broke a mirage is blinded in this activation.
  if (u.status.blindLater) {
    u.status.blinded = u.status.blindLater;
    delete u.status.blindLater;
  }
  // Przebudzenie: the dormant stone guardian stands still.
  if (u.status.dormant) {
    b.activation.skipped = true;
    log(state, 'ability', `${unitName(u)} stoi uśpiony (${UNITS[u.defId].abilityName}).`);
    return endActivation(state);
  }
  // Sidła (third level): a unit that was held by a trap cannot move in this activation.
  if (u.status.rootLater) {
    delete u.status.rootLater;
    u.status.rootedNext = true;
  }
  // Młot Przodków: a stunned unit loses its activation.
  if (u.status.stunned) {
    b.activation.skipped = true;
    delete u.status.stunned;
    delete u.status.brittle;
    log(state, 'ability', `${unitName(u)} jest ogłuszony i traci aktywację.`);
    return endActivation(state);
  }
  // Zatruty Pazur: the poison bites at the start of the activation; a unit that dies of it loses its turn.
  if (u.status.poisoned) {
    u.status.poisoned -= 1;
    dealDamage(state, u, ABILITY.poisonDamage * scaleOf(state), 'Trucizna');
    if (!u.alive) return endActivation(state);
  }
  // Na Swojej Ziemi, Serce Grzybni IV: a unit of the Swarm on its mycelium regains Życie.
  if (b.ground?.length) myceliumHeal(state, u);
  // Korzenie Drzewa: once per battle the Opiekun heals its wounded neighbours.
  if (abilityOf(u) === 'treeRoots' && !u.abilityUsed && abilityActive(state)) {
    const hurt = livingUnits(b, u.side).filter((x) => x.id !== u.id && x.hp < x.maxHp && unitsAdjacent(u, x));
    if (hurt.length) {
      u.abilityUsed = true;
      for (const x of hurt) {
        const healed = Math.min(ABILITY.treeRootsHeal * hpScaleOf(state), x.maxHp - x.hp);
        x.hp += healed;
        log(state, 'ability', `${unitName(x)} odzyskuje ${healed} Ż (Korzenie Drzewa).`);
        (b.heals ??= []).push({ unitId: x.id, amount: healed });
      }
    }
  }
  if (abilityOf(u) === 'regrowth' && abilityActive(state) && u.hp < u.maxHp) {
    const healed = Math.min(ABILITY.regrowthHeal * hpScaleOf(state), u.maxHp - u.hp);
    u.hp += healed;
    log(state, 'ability', `${unitName(u)} odzyskuje ${healed} Ż (Odrastające Głowy).`);
    (b.heals ??= []).push({ unitId: u.id, amount: healed });
  }
  if (abilityOf(u) === 'bogRegrowth' && abilityActive(state) && u.hp < u.maxHp) {
    const healed = Math.min(ABILITY.bogRegrowthHeal * hpScaleOf(state), u.maxHp - u.hp);
    u.hp += healed;
    log(state, 'ability', `${unitName(u)} odzyskuje ${healed} Ż (Bagienne Odrastanie).`);
    (b.heals ??= []).push({ unitId: u.id, amount: healed });
  }
}

/** Moves to the next activation, the next round, or nothing if the battle ended. */
export function endActivation(state: GameState) {
  const b = state.battle!;
  const act = b.activation;
  // A mirage that vanished in its own activation (it stepped up to a watching Jackal) is no longer on the list of units.
  if (act && b.units[act.unitId]) {
    const u = b.units[act.unitId];
    // Zagadka and the blindness of the Pałac Mirażu last for one activation.
    if (!act.skipped) delete u.status.riddled;
    delete u.status.blinded;
    if (u.status.napStruck && !u.status.dugIn) delete u.status.napStruck;
    // Effects that applied to "the next activation" are now spent.
    u.status.slowNext = 0;
    u.status.rootedNext = false;
    delete u.status.tauntedBy;
    // Siege: a unit that ends its turn standing in the moat is hurt (once per activation: not again when it has just walked in).
    if (u.alive && inMoat(b, u)) moatHurts(state, u);
    // Okop wears off after the Saper's next activation; the Waran's turret shoots once a round.
    if (u.status.dugIn && !act.skipped) {
      u.status.dugIn -= 1;
      if (!u.status.dugIn) {
        delete u.status.dugIn;
        delete u.status.napStruck;
      }
    }
    if (u.alive && !act.skipped) towerFire(state, u);
    // Buty Wartownika (Zakotwiczenie): standing still hardens the hero until its next activation.
    if (u.gear?.anchor && u.alive && !act.moved) u.status.anchored = true;
  }
  if (checkBattleEnd(state)) return;
  if (b.extra.length) {
    const next = b.extra.shift()!;
    if (b.units[next.unitId]?.alive) {
      if (next.speedBonus) b.units[next.unitId].status.slowNext -= next.speedBonus;
      beginActivation(state, next.unitId, next.moveOnly);
      return;
    }
  }
  for (let i = b.index + 1; i < b.order.length; i++) {
    const u = b.units[b.order[i]];
    if (u && u.alive && u.pos) {
      b.index = i;
      beginActivation(state, u.id, false);
      return;
    }
  }
  beginRound(state, b.round + 1);
}

/** Returns true when one side has no units left (the battle is then over). */
export function checkBattleEnd(state: GameState): boolean {
  const b = state.battle!;
  if (b.stage !== 'fight') return b.stage === 'over';
  // Ukryty: a side whose every living unit is veiled has nobody left to show the enemy: they step out (so the fight cannot stall on a target nobody may choose).
  for (const side of [b.attacker, b.defender]) {
    const mine = livingUnits(b, side);
    if (mine.length && mine.every((x) => x.status.veiled)) for (const x of mine) unveil(state, x);
  }
  const a = realUnits(b, b.attacker).length;
  const d = realUnits(b, b.defender).length;
  if (a > 0 && d > 0) return false;
  if (b.mirageAlias) purgeMirages(b);
  b.stage = 'over';
  b.activation = null;
  b.winner = a > 0 ? b.attacker : d > 0 ? b.defender : 'draw';
  return true;
}

// ---------------------------------------------------------------- faction mechanics (level 6)

/** Level of a faction's mechanic building (0-4): 0 below level 6 and while the faction has not built it. Level N works as rank N-1 of the old tree. */
const mechLevel = (state: GameState, f: TeamId): number => (state.rules.empire ? mechanicLevel(state, f) : 0);

/**
 * Blask Świtu, the Przymierza's mechanic: at the start of every battle round the most wounded unit of the Przymierza regains Życie
 * (rank I of the tree: more of it; rank II: two units; rank III is applied when the battle starts, see game.ts).
 */
function dawnLight(state: GameState) {
  const b = state.battle!;
  // Every side in the battle that plays Przymierze has the light (a side's mechanic is its own).
  for (const side of [b.attacker, b.defender]) if (side !== 'neutral' && raceOf(state, side) === 'dawn') dawnLightOf(state, side);
}

function dawnLightOf(state: GameState, side: TeamId) {
  const b = state.battle!;
  if (mechLevel(state, side) < 1) return;
  const rank = mechLevel(state, side) - 1;
  const heal = (FACTION_MECHANICS.dawnHeal + (rank >= 1 ? 1 : 0)) * hpScaleOf(state);
  const hurt = livingUnits(b, side).filter((u) => u.hp < u.maxHp && u.pos).sort((x, y) => (y.maxHp - y.hp) - (x.maxHp - x.hp) || (x.id < y.id ? -1 : 1));
  for (const u of hurt.slice(0, rank >= 2 ? 2 : 1)) {
    const got = Math.min(heal, u.maxHp - u.hp);
    u.hp += got;
    (b.heals ??= []).push({ unitId: u.id, amount: got });
    log(state, 'ability', `${unitName(u)} odzyskuje ${got} Ż (Blask Świtu).`);
  }
}

/**
 * Żądza Krwi, the Horde's mechanic: when an enemy of the Horde falls, every living unit of the Horde strikes harder until the end of the battle
 * (once at rank 0, up to the rank's limit; at rank III they also regain Życie).
 */
function bloodlust(state: GameState, fallen: BattleUnit) {
  const b = state.battle!;
  // The first side of the battle that plays Horda has the lust (one counter per battle).
  const side = ([b.attacker, b.defender] as Side[]).find((x) => x !== 'neutral' && raceOf(state, x) === 'horde');
  if (!side || side === 'neutral' || fallen.side === side || mechLevel(state, side) < 1) return;
  const rank = mechLevel(state, side) - 1;
  const cap = 1 + Math.min(rank, 2);
  if ((b.bloodlust ?? 0) >= cap) return;
  b.bloodlust = (b.bloodlust ?? 0) + 1;
  const horde = livingUnits(b, side);
  for (const u of horde) {
    u.status.battleAttackBonus += FACTION_MECHANICS.hordeAttack * scaleOf(state);
    if (rank >= 3 && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + FACTION_MECHANICS.hordeHeal * hpScaleOf(state));
  }
  if (horde.length) log(state, 'ability', `Żądza Krwi: jednostki Hordy mają +${FACTION_MECHANICS.hordeAttack * scaleOf(state)} A do końca bitwy (${b.bloodlust}/${cap}).`);
}

/** The level of the Kurhan Wiecznej Warty a side has (0: another faction, or no Kurhan built). */
export const wardLevel = (state: GameState, side: Side): number => (side !== 'neutral' && raceOf(state, side) === 'undead' ? mechLevel(state, side) : 0);

/** The level of the Sala Tarcz a side has (0: another faction, or no hall built). */
export const shieldLevel = (state: GameState, side: Side): number => (side !== 'neutral' && raceOf(state, side) === 'clans' ? mechLevel(state, side) : 0);

/** The level of the Pałac Szronu (the Court of Everfrost) a side has: 0 for any other faction or without the building. */
export const frostLevel = (state: GameState, side: Side): number => (side !== 'neutral' && raceOf(state, side) === 'frost' ? mechLevel(state, side) : 0);

/** Szron: how much frost freezes a unit when the Court of `source` puts it (the Pałac Szronu's level: 3 without the building or at the first level). */
export const frostThreshold = (state: GameState, source: Side): number => FACTION_MECHANICS.frostThreshold[Math.max(1, Math.min(frostLevel(state, source), 4)) - 1];

/** Zamrożenie: the unit loses its next activation, the frost on it goes; with the third level of the Pałac Szronu it also takes one more damage from the next blow. */
export function freezeUnit(state: GameState, source: Side, target: BattleUnit): void {
  target.status.frost = 0;
  target.status.stunned = true;
  if (frostLevel(state, source) >= FACTION_MECHANICS.frostBrittleLevel) target.status.brittle = true;
  log(state, 'ability', `${unitName(target)} zamarza i traci następną aktywację.`);
}

/** Szron: puts `n` frost on the target; at the threshold of the Court of `source` the target freezes. */
export function applyFrost(state: GameState, source: Side, target: BattleUnit, n: number = ABILITY.frostPut): void {
  if (!target.alive) return;
  const threshold = frostThreshold(state, source);
  target.status.frost = (target.status.frost ?? 0) + n;
  if (frostLevel(state, source) >= FACTION_MECHANICS.frostSlowLevel) target.status.frostSlow = 1;
  log(state, 'ability', `${unitName(target)} dostaje szron (${target.status.frost}/${threshold}).`);
  if (target.status.frost >= threshold) freezeUnit(state, source, target);
}

/** Mur Tarcz: whether the unit of the Clans stands in formation (enough living allies next to it for the level of its Sala Tarcz). */
export function inFormation(state: GameState, u: BattleUnit): boolean {
  const level = shieldLevel(state, u.side);
  if (level < 1 || !abilityActive(state) || !u.alive || !u.pos || state.battle?.duel) return false;
  const mates = livingUnits(state.battle!, u.side).filter((x) => x.id !== u.id && unitsAdjacent(u, x)).length;
  return mates >= FACTION_MECHANICS.shieldMates[Math.min(level, 4) - 1];
}

/** Mur Tarcz, level III: a unit in formation cannot be pushed or pulled. */
export const formationAnchored = (state: GameState, u: BattleUnit): boolean => shieldLevel(state, u.side) >= FACTION_MECHANICS.shieldAnchorLevel && inFormation(state, u);

/** The Życie a fallen support rises with by the Kurhan's level (I: 1 Ż, II and III: half, IV: all). */
const wardHp = (state: GameState, u: BattleUnit, level: number): number => {
  const share = FACTION_MECHANICS.wardShare[Math.min(level, 4) - 1];
  return share === 0 ? ABILITY.bonesHp * hpScaleOf(state) : Math.ceil(u.maxHp / share);
};

/**
 * Wieczna Warta, the mechanic of the Kingdom of the Dead, and Kości Wracają: at the end of a round (when the next one begins) the skeletons that lay down put
 * themselves together, and each side with a Kurhan raises its cheapest fallen support (the Kurhan's level says how many times in a battle and with how much Życie).
 * Heroes never rise by it. A fallen unit lies on its corpse; without corpses (the classic ruleset) it stands up at the start of its side.
 */
function risingsAtRoundEnd(state: GameState) {
  const b = state.battle!;
  if (b.duel || !abilityActive(state)) return;
  for (const u of Object.values(b.units)) {
    if (u.alive || !u.status.reassemble) continue;
    delete u.status.reassemble;
    raiseUnit(state, u, u.corpse ?? null, ABILITY.bonesHp * hpScaleOf(state), UNITS[u.defId].abilityName);
  }
  for (const side of [b.attacker, b.defender]) {
    const level = wardLevel(state, side);
    if (level < 1) continue;
    if ((b.ward?.[side] ?? 0) >= FACTION_MECHANICS.wardRises[level - 1]) continue;
    const cheapest = fallenSupports(state, side).sort((x, y) => supportTier(x.defId) - supportTier(y.defId) || x.maxHp - y.maxHp || (x.id < y.id ? -1 : 1))[0];
    if (!cheapest) continue;
    if (raiseUnit(state, cheapest, cheapest.corpse ?? null, wardHp(state, cheapest, level), 'Wieczna Warta')) (b.ward ??= {})[side] = (b.ward?.[side] ?? 0) + 1;
  }
}

// ---------------------------------------------------------------- siege

/** The defences of a settlement for a battle on the wide arena: `level` 1 is the moat with a bridge, 2 adds the wall with a gate and two towers. */
export function makeSiege(level: number): SiegeState | undefined {
  if (level < 1) return undefined;
  const rows = Array.from({ length: WIDE_ROWS }, (_, r) => r);
  const moat = rows.filter((r) => r !== SIEGE.gateRow).map((r) => wideCell(SIEGE.moatColumn, r));
  if (level < 2) return { level: 1, walls: [], gate: null, gateHp: 0, towers: [], moat, shot: 0 };
  return {
    level: 2,
    walls: rows.filter((r) => r !== SIEGE.gateRow).map((r) => wideCell(SIEGE.wallColumn, r)),
    gate: wideCell(SIEGE.wallColumn, SIEGE.gateRow),
    gateHp: SIEGE.gateHits,
    towers: SIEGE.towerRows.map((r) => wideCell(SIEGE.wallColumn, r)),
    moat,
    shot: 0,
  };
}

/** The obstacles of a siege: the walls and the gate still standing (a new list every time, so the cached set follows). */
export const siegeObstacles = (s: SiegeState): HexKey[] => [...s.walls, ...(s.gate ? [s.gate] : [])];

const inMoat = (b: BattleState, u: BattleUnit): boolean => Boolean(b.siege?.moat.length) && cellsOf(u).some((c) => b.siege!.moat.includes(c));

function moatHurts(state: GameState, u: BattleUnit) {
  const act = state.battle!.activation;
  if (!act || act.unitId !== u.id || act.moat) return;
  act.moat = true;
  battleFx(state, 'oblezenie_fosa', u.pos);
  dealDamage(state, u, SIEGE.moatDamage * scaleOf(state), 'Fosa');
}

/** What the catapult may shoot now: nothing when it has shot in this round or it is not the attacker's activation. */
export function catapultTargets(state: GameState): HexKey[] {
  const b = state.battle;
  if (!b?.siege || b.stage !== 'fight' || !b.activation || b.units[b.activation.unitId].side !== b.attacker || b.siege.shot === b.round) return [];
  return siegeObstacles(b.siege);
}

/** The attacker's catapult: one shot a round, at any time in an activation of the attacker; the wall segment, gate or tower it hits falls. */
export function battleCatapult(state: GameState, cell: HexKey) {
  const b = state.battle!;
  if (!b.siege) throw new Error('To nie jest oblężenie.');
  if (!catapultTargets(state).includes(cell)) throw new Error(b.siege.shot === b.round ? 'Katapulta strzelała już w tej rundzie.' : 'Katapulta strzela w mur, bramę albo wieżyczkę.');
  const s = b.siege;
  s.shot = b.round;
  battleFx(state, 'oblezenie_kamien', cell);
  // Stratowanie: with a Nosorożec Bojowy in the attacking army the gate falls to one hit.
  const rammed = abilityActive(state) && livingUnits(b, b.attacker).some((x) => abilityOf(x) === 'ram' || abilityOf(x) === 'cannonFire');
  if (s.gate === cell && s.gateHp > 1 && !rammed) {
    s.gateHp -= 1;
    log(state, 'battle', 'Katapulta trafia w bramę: brama pęka, ale jeszcze stoi.');
    return;
  }
  const what = s.gate === cell ? 'bramę' : s.towers.includes(cell) ? 'wieżyczkę' : 'mur';
  if (s.gate === cell) s.gate = null;
  s.walls = s.walls.filter((k) => k !== cell);
  s.towers = s.towers.filter((k) => k !== cell);
  b.obstacles = siegeObstacles(s);
  log(state, 'battle', `Katapulta burzy ${what}.`);
}

// ---------------------------------------------------------------- damage

function rollDie(state: GameState): number {
  if (!state.rules.useDice) return 0;
  const rng = new Rng(state.rng);
  const v = rng.int(3) - 1;
  state.rng = rng.state;
  return v * scaleOf(state);
}

export function dealDamage(state: GameState, target: BattleUnit, amount: number, source: string) {
  // Miraż: whatever hurts a mirage only makes it vanish.
  if (target.status.mirage && state.battle) {
    const act = state.battle.activation;
    return dispelMirage(state, target, act ? (state.battle.units[act.unitId] ?? null) : null);
  }
  // Skorupa: nothing hurts the turtle in its shell (poison, collisions, blasts included).
  const dmg = target.status.shelled ? 0 : Math.max(0, amount);
  target.hp -= dmg;
  // Zbroja Wartownika: once per battle the hero is left with 1 Życie instead of falling.
  if (target.hp <= 0 && dmg > 0 && target.gear?.lastStand) {
    delete target.gear.lastStand;
    target.hp = 1;
    log(state, 'ability', `${unitName(target)} zostaje przy 1 Ż (Ostatnia Szansa).`);
  }
  log(state, 'damage', `${source} → ${unitName(target)}: ${dmg} obrażeń (Ż ${Math.max(0, target.hp)}/${target.maxHp}).`);
  // Przebudzenie: a blow wakes the stone guardian.
  if (target.status.dormant && target.hp > 0) wake(state, target);
  // Przepoczwarzenie: at half its Życie the caterpillar turns into a butterfly.
  if (target.hp > 0 && dmg > 0) metamorphose(state, target);
  // Odrodzenie z Popiołów (Feniks Świtu): once per battle it rises where it stood, with half its Życie.
  if (target.hp <= 0 && dmg > 0 && abilityOf(target) === 'rebirth' && !target.abilityUsed && abilityActive(state)) {
    target.abilityUsed = true;
    target.hp = Math.ceil(target.maxHp / 2);
    battleFx(state, 'odrodzenie', target.pos);
    log(state, 'ability', `${unitName(target)} odradza się z popiołów (Ż ${target.hp}/${target.maxHp}).`);
    if (state.battle) (state.battle.heals ??= []).push({ unitId: target.id, amount: target.hp });
    return;
  }
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    const diedOn = cellsOf(target);
    removeFromBoard(state, target, true);
    log(state, 'death', `${unitName(target)} poległ(a).`);
    if (state.battle?.mirageAlias) fadeMiragesOf(state, target);
    // Grzybnia: the mycelium grows where a unit fell; Pyłek: the Purchawka poisons everyone next to it, allies too.
    if (state.battle) myceliumOnDeath(state, diedOn);
    if (abilityOf(target) === 'puffball' && abilityActive(state) && state.battle && !state.battle.duel) puffballBurst(state, target, diedOn);
    // Kości Wracają: the skeleton lies where it fell and puts itself together at the end of the round.
    if (abilityOf(target) === 'bonesReturn' && !target.abilityUsed && abilityActive(state) && !state.battle?.duel) {
      target.abilityUsed = true;
      target.status.reassemble = true;
    }
    // Rozprysk: a Kruszyniec bursts into shards that hurt everyone next to it.
    if (abilityOf(target) === 'shardBurst' && abilityActive(state) && state.battle) {
      const cells = diedOn;
      const hit = Object.values(state.battle.units).filter((x) => x.alive && x.id !== target.id && cellsOf(x).some((c) => cells.some((k) => adjacent(k, c))));
      for (const x of hit) if (x.alive) dealDamage(state, x, ABILITY.shardBurstDamage * scaleOf(state), `Rozprysk (${unitName(target)})`);
    }
    if (state.battle) bloodlust(state, target);
  }
}

/** Opiekun Gaju: whether `bear` can still take the blow aimed at `x` (itself, or an ally next to it). */
export function bearCanGuard(state: GameState, bear: BattleUnit, x: BattleUnit): boolean {
  if (abilityOf(bear) !== 'guardian' || bear.abilityUsed || !abilityActive(state)) return false;
  return bear.id === x.id || (!!bear.pos && !!x.pos && ((bear.tier ?? 0) >= MILESTONE_TIER.bearAnyAlly || unitsAdjacent(bear, x)));
}

export interface DamagePrediction {
  /** Attack value before the die. */
  base: number;
  /** The unit that takes the blow: the target, or the bear when Opiekun Gaju steps in for it. */
  victim: BattleUnit;
  /** Damage that lands on the victim after every reaction. */
  damage: number;
  /** Opiekun Gaju fires: the bear takes over an ally's blow ('ally') or softens a lethal one on itself ('self'). */
  bearGuard: 'ally' | 'self' | null;
  /** Damage Twardogłowy ignores (null when it does not fire). */
  hardHead: number | null;
  /** Tarcza Strażnika stops the whole blow. */
  shield: boolean;
  /** Bezcielesna: the first ranged blow passes through the ghost. */
  ghost?: boolean;
  /** Perłowa Tarcza: damage of this blow the pearl shield soaks up (it is taken off the shield). */
  pearl?: number;
  /** Skorupa: the turtle in its shell takes nothing. */
  shelled?: boolean;
  /** The victim falls. */
  lethal: boolean;
}

/**
 * What an attack of `att` on `target` does, with the defender's reactions in the engine's order:
 * Opiekun Gaju (for an ally), Tarcza Strażnika, Opiekun Gaju (the bear itself), Twardogłowy, then
 * Kamień Ochrony. Pure: the battle uses it to resolve the blow and the screen to preview it.
 * `die` is the damage die's result (0 without the die or for a preview).
 */
export function predictDamage(
  state: GameState,
  att: BattleUnit,
  target: BattleUnit,
  opts: { useAbility: boolean; movedDistance: number; die?: number },
): DamagePrediction {
  const b = state.battle!;
  const base = attackDamage(state, att, target, opts.useAbility, opts.movedDistance);
  let dmg = Math.max(0, base + (opts.die ?? 0));
  let bearGuard: DamagePrediction['bearGuard'] = null;
  // Opiekun Gaju: the bear takes a lethal blow aimed at an adjacent ally, if it survives it.
  const bear = livingUnits(b, target.side).find((x) => x.id !== target.id && bearCanGuard(state, x, target));
  let victim = target;
  if (bear && dmg >= target.hp && dmg - abilityNum(bear, 'guardianIgnore') * scaleOf(state) - Math.min(dmg, bear.status.damageReduction) < bear.hp) {
    bearGuard = 'ally';
    victim = bear;
    dmg = Math.max(0, dmg - abilityNum(bear, 'guardianIgnore') * scaleOf(state));
  }
  if (victim.status.shieldArmed) return { base, victim, damage: 0, bearGuard, hardHead: null, shield: true, lethal: false };
  // Skorupa: the turtle hidden in its shell takes no damage at all.
  if (victim.status.shelled) return { base, victim, damage: 0, bearGuard, hardHead: null, shield: false, shelled: true, lethal: false };
  // Bezcielesna: the first ranged blow of the battle passes through the ghost.
  if (abilityOf(victim) === 'incorporeal' && !victim.abilityUsed && abilityActive(state) && UNITS[att.defId].attackType === 'ranged') return { base, victim, damage: 0, bearGuard, hardHead: null, shield: false, ghost: true, lethal: false };
  // Grot Przez Zbroję: the arrow ignores every armour (the unit's own, a spell's, the artifacts').
  const armour = !(abilityOf(att) === 'armorPierce' && abilityActive(state));
  // Opiekun Gaju guards the bear itself too: a lethal blow loses part of its strength.
  if (victim === target && bearCanGuard(state, victim, victim) && dmg >= victim.hp) {
    bearGuard = 'self';
    dmg = Math.max(0, dmg - abilityNum(victim, 'guardianIgnore') * scaleOf(state));
  }
  let hardHead: number | null = null;
  if (abilityOf(victim) === 'hardHead' && !victim.abilityUsed && abilityActive(state) && dmg >= HARD_HEAD_MIN_DAMAGE * scaleOf(state)) {
    hardHead = Math.min(abilityNum(victim, 'hardHeadIgnore') * scaleOf(state), dmg);
    dmg -= hardHead;
  }
  if (armour) dmg = Math.max(0, dmg - victim.status.damageReduction);
  // Kamienna Skóra of the Golem boss: a blow that lands takes at least 1.
  if (armour && abilityOf(victim) === 'runeGolem' && abilityActive(state) && !coreExposed(victim) && dmg > 0) dmg = Math.max(1, dmg - ABILITY.runeSkinIgnore * scaleOf(state));
  // Bitewny Szał: the Herszt's armour takes a bit off every blow that lands (at least 1 gets through).
  if (armour && abilityOf(victim) === 'bloodRage' && abilityActive(state) && dmg > 0) dmg = Math.max(1, dmg - ABILITY.bloodRageArmor * scaleOf(state));
  // Niewzruszony: the Żubr's hide takes a bit off every blow that lands (at least 1 gets through).
  if (armour && abilityOf(victim) === 'unmoved' && abilityActive(state) && dmg > 0) dmg = Math.max(1, dmg - ABILITY.unmovedArmor * scaleOf(state));
  // Pusta w Środku: the empty armour takes a bit off every blow that lands (at least 1 gets through).
  if (armour && abilityOf(victim) === 'hollow' && abilityActive(state) && dmg > 0) dmg = Math.max(1, dmg - ABILITY.hollowArmor * scaleOf(state));
  // Żelazny Klan: Pawęż and Kolczuga (and the Kolos), Przysięga Tarczy until the end of the round, the Mur Tarcz in formation: each takes a bit off every blow that lands.
  if (armour && dmg > 0 && abilityActive(state)) {
    if (['bulwark', 'fortify'].includes(abilityOf(victim))) dmg = Math.max(1, dmg - ABILITY.bulwarkArmor * scaleOf(state));
    if (victim.status.oathRound === b.round) dmg = Math.max(1, dmg - ABILITY.oathArmor * scaleOf(state));
    if (inFormation(state, victim)) dmg = Math.max(1, dmg - FACTION_MECHANICS.shieldArmor * scaleOf(state));
  }
  // Gęste Futro (Jak Lodowcowy): arrows and bolts lose a bit (at least 1 gets through).
  if (armour && dmg > 0 && abilityOf(victim) === 'thickFur' && abilityActive(state) && UNITS[att.defId].attackType === 'ranged') dmg = Math.max(1, dmg - ABILITY.furArmor * scaleOf(state));
  // Okop: the Saper dug in takes a bit off every blow that lands (at least 1 gets through).
  if (armour && dmg > 0 && victim.status.dugIn) dmg = Math.max(1, dmg - ABILITY.dugInArmor * scaleOf(state));
  // Przebudzenie, Strażnik Bram: the stone guardian and the Lamassu take a bit off every blow that lands (at least 1 gets through).
  if (armour && dmg > 0 && abilityActive(state) && abilityOf(victim) === 'awakening') dmg = Math.max(1, dmg - ABILITY.awakeningArmor * scaleOf(state));
  if (armour && dmg > 0 && abilityActive(state) && abilityOf(victim) === 'gateWard') dmg = Math.max(1, dmg - ABILITY.gateWardArmor * scaleOf(state));
  // Chitynowa Ściana, Śluzowy Szlak: the Goliat's chitin and the snail's shell take a bit off every blow that lands.
  if (armour && dmg > 0 && abilityActive(state) && abilityOf(victim) === 'chitinWall') dmg = Math.max(1, dmg - ABILITY.chitinArmor * scaleOf(state));
  if (armour && dmg > 0 && abilityActive(state) && abilityOf(victim) === 'slimeTrail') dmg = Math.max(1, dmg - ABILITY.snailArmor * scaleOf(state));
  // Szczypce: the Homar's shell; Żywa Rafa: a Rafowy Golem next to the victim shields it (several golems do not add up).
  if (armour && dmg > 0 && abilityActive(state) && abilityOf(victim) === 'pincers') dmg = Math.max(1, dmg - ABILITY.pincerArmor * scaleOf(state));
  if (armour && dmg > 0 && abilityActive(state) && livingUnits(b, victim.side).some((x) => x.id !== victim.id && x.pos && !x.status.mirage && abilityOf(x) === 'livingReef' && unitsAdjacent(x, victim))) dmg = Math.max(1, dmg - ABILITY.reefArmor * scaleOf(state));
  // A frozen unit (third level of the Pałac Szronu): the next blow cracks the ice and does one more.
  if (victim.status.brittle && dmg > 0) dmg += scaleOf(state);
  // The hero's shield (artifacts): the first blow of the battle is halved, every blow is weaker by its defence, but a blow that lands takes at least 1.
  if (victim.gear && dmg > 0) {
    if (victim.gear.firstHit) dmg = Math.ceil(dmg / 2);
    if (victim.gear.defense && armour) dmg = Math.max(1, dmg - victim.gear.defense);
  }
  // Set pieces (docs/ZESTAWY_ARTEFAKTOW.md): a blow that lands takes at least 1.
  if (dmg > 0) {
    const weaker = (points: number) => Math.max(1, Math.round((points * scaleOf(state)) / STAT_SCALE));
    if (armour && victim.gear?.rangedDefense && UNITS[att.defId].attackType === 'ranged') dmg = Math.max(1, dmg - victim.gear.rangedDefense);
    if (armour && victim.status.anchored) dmg = Math.max(1, dmg - weaker(1));
    if (armour && UNITS[victim.defId].kind === 'support') {
      const guard = livingUnits(b, victim.side).find((x) => x.gear?.guardAura && unitsAdjacent(x, victim));
      if (guard) dmg = Math.max(1, dmg - guard.gear!.guardAura!);
    }
  }
  // Perłowa Tarcza (and the Spark of the Tides): the pearl soaks up the blow before it reaches the Życie.
  const pearl = Math.min(dmg, victim.status.pearl ?? 0);
  if (pearl > 0) dmg -= pearl;
  return { base, victim, damage: dmg, bearGuard, hardHead, shield: false, ...(pearl > 0 ? { pearl } : {}), lethal: dmg >= victim.hp };
}

/** Twardogłowy fires only on a blow of at least this much damage. */
const HARD_HEAD_MIN_DAMAGE = 2;

function resolveAttack(state: GameState, att: BattleUnit, target: BattleUnit, useAbility: boolean, movedDistance: number) {
  const b = state.battle!;
  if (target.status.mirage) return dispelMirage(state, target, att);
  const die = rollDie(state);
  const p = predictDamage(state, att, target, { useAbility, movedDistance, die });
  // The roll is logged so a blow that the die cut to 0 does not look like a bug.
  if (state.rules.useDice) log(state, 'damage', `Rzut kością: ${die > 0 ? `+${die}` : die < 0 ? `−${-die}` : '0'} (${p.base} ${die < 0 ? '−' : '+'} ${Math.abs(die)} = ${Math.max(0, p.base + die)}).`);
  const victim = p.victim;
  if (p.bearGuard === 'ally') {
    victim.abilityUsed = true;
    log(state, 'ability', `${unitName(victim)} przejmuje atak i ignoruje ${abilityNum(victim, 'guardianIgnore') * scaleOf(state)} obrażenia (Opiekun Gaju).`);
  }
  if (p.ghost) {
    victim.abilityUsed = true;
    log(state, 'ability', `${unitName(att)} strzela w ${unitName(victim)}, ale pocisk przelatuje przez widmo (${UNITS[victim.defId].abilityName}).`);
    recordRoll(state, att, victim, p.base, die, 0);
    return;
  }
  if (p.shield) {
    victim.status.shieldArmed = false;
    log(state, 'item', `${itemDef('shield', isDigital(state.rules)).name} chroni: ${unitName(victim)}.`);
    recordRoll(state, att, victim, p.base, die, 0);
    return;
  }
  if (p.bearGuard === 'self') {
    victim.abilityUsed = true;
    log(state, 'ability', `${unitName(victim)} ignoruje ${abilityNum(victim, 'guardianIgnore') * scaleOf(state)} obrażenia (Opiekun Gaju).`);
  }
  if (p.hardHead !== null) {
    victim.abilityUsed = true;
    log(state, 'ability', `${unitName(victim)} ignoruje ${p.hardHead} obrażeń (Twardogłowy).`);
  }
  if (p.shelled) {
    log(state, 'ability', `${unitName(victim)} chowa się w skorupie: cios nic nie robi.`);
    recordRoll(state, att, victim, p.base, die, 0);
    return;
  }
  if (p.pearl) {
    victim.status.pearl = (victim.status.pearl ?? 0) - p.pearl;
    if (victim.status.pearl <= 0) delete victim.status.pearl;
    log(state, 'ability', `Perłowa tarcza ${unitName(victim)} pochłania ${p.pearl} obrażeń${victim.status.pearl ? ` (zostaje ${victim.status.pearl})` : ' i pęka'}.`);
  }
  b.damageBy[att.id] = (b.damageBy[att.id] ?? 0) + Math.min(p.damage, Math.max(0, victim.hp));
  recordRoll(state, att, victim, p.base, die, p.damage);
  if (victim.gear?.firstHit && p.damage > 0) delete victim.gear.firstHit;
  dealDamage(state, victim, p.damage, unitName(att));
  if (victim.status.brittle && p.damage > 0) {
    delete victim.status.brittle;
    log(state, 'ability', `Lód na ${unitName(victim)} pęka.`);
  }
  // Kieszonkowiec: the first blow of the Kuna at a hero in this battle takes a coin off it.
  if (abilityOf(att) === 'pickpocket' && abilityActive(state) && !att.abilityUsed && p.damage > 0 && att.side !== 'neutral' && UNITS[victim.defId].kind === 'hero' && state.kingdom) {
    att.abilityUsed = true;
    state.kingdom.gold[att.side] += ABILITY.pickpocketGold;
    log(state, 'ability', `${unitName(att)} podkrada ${ABILITY.pickpocketGold} zł (${UNITS[att.defId].abilityName}).`, att.side);
  }
  // Riposta: whoever strikes the Kocur in melee and both live through it takes a counterblow.
  if (abilityOf(victim) === 'riposte' && abilityActive(state) && victim.alive && att.alive && UNITS[att.defId].attackType === 'melee' && unitsAdjacent(att, victim)) dealDamage(state, att, ABILITY.riposteDamage * scaleOf(state), `Riposta (${unitName(victim)})`);
  // Mroźna Zbroja: whoever hits the Rycerz Lodowej Zbroi in melee gets frost.
  if (abilityOf(victim) === 'frostArmor' && abilityActive(state) && p.damage > 0 && att.alive && UNITS[att.defId].attackType === 'melee' && unitsAdjacent(att, victim)) applyFrost(state, victim.side, att);
  // Wyładowanie: whoever strikes the Król Burzy from close by is shocked.
  if (abilityOf(victim) === 'stormKing' && abilityActive(state) && att.alive && unitsAdjacent(att, victim)) dealDamage(state, att, ABILITY.dischargeDamage * scaleOf(state), 'Wyładowanie');
  // Kolce: whoever hits a Jeżozwierz in melee is pricked.
  if ((abilityOf(victim) === 'quills' || abilityOf(victim) === 'bronzeQuills') && abilityActive(state) && att.alive && UNITS[att.defId].attackType === 'melee' && unitsAdjacent(att, victim)) {
    dealDamage(state, att, ABILITY.quillsDamage * scaleOf(state), `Kolce (${unitName(victim)})`);
  }
  // Mur Tarcz, level IV: whoever hits a unit in formation in melee loses Życie.
  if (p.damage > 0 && att.alive && UNITS[att.defId].attackType === 'melee' && shieldLevel(state, victim.side) >= FACTION_MECHANICS.shieldThornsLevel && inFormation(state, victim)) dealDamage(state, att, FACTION_MECHANICS.shieldArmor * scaleOf(state), `Mur Tarcz (${unitName(victim)})`);
  // Tarcza Wartownika: whoever hits the hero in melee is slowed in its next activation.
  if (victim.gear?.slowAttacker && p.damage > 0 && att.alive && UNITS[att.defId].attackType === 'melee' && !resistsStatus(state, att, true)) {
    att.status.slowLater = (att.status.slowLater ?? 0) + victim.gear.slowAttacker;
    log(state, 'ability', `${unitName(att)} będzie wolniejszy o ${victim.gear.slowAttacker} S (${unitName(victim)}).`);
  }
  // Kolczuga Cierni: whoever hits the hero in melee is pricked itself.
  if (victim.gear?.thorns && p.damage > 0 && att.alive && UNITS[att.defId].attackType === 'melee') dealDamage(state, att, victim.gear.thorns, 'Ciernie zbroi');
}

/** Attacks kept in BattleState.rolls for the screen. */
const ROLLS_KEPT = 4;

function recordRoll(state: GameState, att: BattleUnit, victim: BattleUnit, attack: number, die: number, damage: number) {
  const b = state.battle!;
  const rolls = b.rolls ?? [];
  const seq = (rolls[rolls.length - 1]?.seq ?? 0) + 1;
  b.rolls = [...rolls, { seq, attackerId: att.id, targetId: victim.id, attack, die: state.rules.useDice ? die : null, damage }].slice(-ROLLS_KEPT);
}

// ---------------------------------------------------------------- actions

export function battleMove(state: GameState, to: HexKey, tail?: HexKey) {
  const b = state.battle!;
  const act = b.activation!;
  const u = b.units[act.unitId];
  if (act.moved || (act.attacked && !act.thrown)) throw new Error('Ta jednostka już się ruszyła.');
  // Ukryty: a unit that walks into the cell of a veiled enemy finds it there: the Jenot is uncovered, and nobody moves.
  const bumped = unitAt(b, to);
  if (bumped && bumped.status.veiled && bumped.side !== u.side) {
    unveil(state, bumped);
    return;
  }
  const cells = reachableCells(state, u);
  let steps = cells.get(to);
  if (steps === undefined) {
    // A way that a veiled enemy blocks (its owner's side sees it, the mover does not): the mover walks into it on the way, the enemy is uncovered, and nobody moves.
    const hidden = Object.values(b.units).filter((x) => x.alive && x.pos && x.side !== u.side && x.status.veiled);
    if (hidden.length) {
      for (const x of hidden) x.alive = false;
      const open = reachableCells(state, u).has(to);
      for (const x of hidden) x.alive = true;
      if (open) {
        const nearest = hidden.reduce((best, x) => (unitDistance(u, x) < unitDistance(u, best) ? x : best));
        unveil(state, nearest);
        return;
      }
    }
    throw new Error('Pole poza zasięgiem ruchu.');
  }
  if (tail && isLarge(state, u) && !tailOptions(b, u, to).includes(tail)) throw new Error('Ogon nie zmieści się na tym polu.');
  let leapt = false;
  // Szalony Skok: the leap goes over everything and the blow after it is harder.
  if (wildLeapReady(state, u) && leapOnlyCells(state, u).has(to)) {
    u.status.leapUsed = true;
    act.leaped = true;
    leapt = true;
    log(state, 'ability', `${unitName(u)} skacze ponad wszystkim (${UNITS[u.defId].abilityName}).`);
  }
  // Sidła: a walker stops on the first cell of its way that holds a trap of the enemy (it ends its move there, and the trap goes off); a flyer, a leap and a hop only meet the one they land on.
  if (b.ground?.length && !leapt && !b.duel) {
    const path = movePath(state, u, to);
    for (let i = 1; i < path.length - 1; i++) {
      if (!enemyTrapAt(b, u.side, path[i])) continue;
      if (isLarge(state, u) && !tailOptions(b, u, path[i]).length) continue;
      to = path[i];
      steps = i;
      tail = undefined;
      break;
    }
  }
  const from = u.pos ? parseKey(u.pos) : null;
  const before = neighboursOf(b, u);
  // Zasadzka Spod Piasku: the Queen comes out of the sand when she moves.
  if (u.status.veiled && abilityOf(u) === 'sandAmbush') unveil(state, u);
  // Ślad Zamieci: the Ryś leaves a trail on the cells it runs through; an enemy that steps on one (this round) is slowed in its next activation.
  if (abilityActive(state) && !b.duel && (abilityOf(u) === 'blizzardTrail' || b.trail?.length)) {
    const path = movePath(state, u, to);
    if (abilityOf(u) === 'blizzardTrail') {
      b.trail = (b.trail ?? []).filter((t) => !(t.side === u.side && path.includes(t.cell)));
      for (const c of path) b.trail.push({ cell: c, side: u.side, until: b.round });
    } else if (b.trail?.some((t) => t.side !== u.side && t.until >= b.round && path.includes(t.cell)) && !resistsStatus(state, u, true)) {
      u.status.slowLater = (u.status.slowLater ?? 0) + ABILITY.trailSlow;
      log(state, 'ability', `${unitName(u)} wpada na ślad zamieci: −${ABILITY.trailSlow} S w następnej aktywacji.`);
    }
  }
  // Śluzowy Szlak: the snail leaves mycelium on the cells it walks through.
  const trail = abilityOf(u) === 'slimeTrail' && abilityActive(state) && !b.duel ? movePath(state, u, to) : null;
  placeUnit(state, u, to, tail);
  if (trail) claimCells(state, u.side, [...trail, ...cellsOf(u)]);
  if (from) u.facing = { q: parseKey(to).q - from.q, r: parseKey(to).r - from.r };
  act.moved = true;
  act.acted = true;
  act.movedDistance = steps;
  stepOnFields(state, u);
  if (u.alive && act.lift) landPassenger(state, u);
  // Czujność, Czujna Drzemka, Przebudzenie: stepping up next to them.
  if (u.alive) steppedUp(state, u, before);
  // Grzybnia (third level): an enemy that ends its move on the mycelium of the Swarm is poisoned.
  if (u.alive && b.ground?.length) myceliumPoisons(state, u);
  if (!u.alive) return endActivation(state);
  // Siege: entering the moat hurts and ends the turn.
  if (inMoat(b, u)) {
    moatHurts(state, u);
    return endActivation(state);
  }
  // A shooter cannot move and shoot (both editions); digital ruleset: moving without attacking ends the turn, and a melee unit keeps its turn
  // only when its move brought an enemy within reach (the attack that follows is the other half of the same click).
  if (act.moveOnly || act.attacked || !canAttackAfterMove(state, u) || (isDigital(state.rules) && attackTargets(state, u).length === 0 && throwTargets(state, u).length === 0)) endActivation(state);
}

/** Whether the unit may still attack after moving: never for a shooter (both editions since backlog 95). */
export function canAttackAfterMove(_state: GameState, u: BattleUnit): boolean {
  // Both editions (the board one since backlog 95): a shooter that moved does not shoot in that activation.
  return UNITS[u.defId].attackType !== 'ranged';
}

/** The level of the Herds' mechanic building (Kamień Tętentu) a side has: 0 for any other faction or without the building. */
const herdsLevel = (state: GameState, side: Side): number => (side !== 'neutral' && raceOf(state, side) === 'herds' ? mechLevel(state, side) : 0);

/** A push of the Herds: its collision hurts one more with the second level of the Kamień Tętentu, and at the fourth the collided target is slowed. */
function herdsPush(state: GameState, att: BattleUnit, target: BattleUnit, steps: number, damage: number, label: string) {
  const level = herdsLevel(state, att.side);
  const out = pushWithCollision(state, target, att, steps, (damage + (level >= 2 ? FACTION_MECHANICS.herdsCollision : 0)) * scaleOf(state), label);
  if (level >= 4 && target.alive && out.stoppedBy && out.stoppedBy !== 'immovable' && !resistsStatus(state, target, true)) {
    target.status.slowNext += FACTION_MECHANICS.herdsSlow;
    log(state, 'ability', `${unitName(target)}: −${FACTION_MECHANICS.herdsSlow} S w następnej aktywacji (Kamień Tętentu).`);
  }
  return out;
}

/** The push a blow of the unit makes after its damage (null: none), in the small scale: how many cells and the collision damage before the level's extra. */
export function plannedPush(state: GameState, att: BattleUnit, usedAbility: boolean, moved: number): { steps: number; damage: number; label: string } | null {
  if (!abilityActive(state) || state.battle?.duel) return null;
  const ab = abilityOf(att);
  const name = UNITS[att.defId].abilityName;
  if (ab === 'headbutt') return { steps: ABILITY.headbuttPush, damage: ABILITY.collisionDamage, label: name };
  if (ab === 'ram' && moved >= ABILITY.ramMinMove) return { steps: ABILITY.ramPush, damage: ABILITY.ramCollisionDamage, label: name };
  if (ab === 'ancestralHorns' && usedAbility) return { steps: ABILITY.hornsPush, damage: ABILITY.collisionDamage, label: name };
  const level = herdsLevel(state, att.side);
  if (level >= 1 && UNITS[att.defId].attackType === 'melee' && moved >= (level >= 3 ? FACTION_MECHANICS.herdsRunShort : FACTION_MECHANICS.herdsRun)) return { steps: 1, damage: ABILITY.collisionDamage, label: 'Kamień Tętentu' };
  return null;
}

/** What a blow of a unit of the Herds does to the target after the damage: pushes it (and the collision hurts). */
function herdsBlow(state: GameState, att: BattleUnit, t: BattleUnit, usedAbility: boolean, moved: number) {
  const push = plannedPush(state, att, usedAbility, moved);
  if (push) herdsPush(state, att, t, push.steps, push.damage, push.label);
}

/** The damage a push of the unit would add to this blow, by the collision it would end in (0: it ends in a free cell or the target cannot be moved); for the bots. */
export function pushValue(state: GameState, att: BattleUnit, t: BattleUnit, usedAbility: boolean, moved: number): number {
  const push = plannedPush(state, att, usedAbility, moved);
  if (!push || !t.pos) return 0;
  const out = previewPush(state, t, att, push.steps);
  if (!out.stoppedBy || out.stoppedBy === 'immovable') return 0;
  const damage = (push.damage + (herdsLevel(state, att.side) >= 2 ? FACTION_MECHANICS.herdsCollision : 0)) * scaleOf(state);
  // The unit that is hit takes it too: good for the pusher when it is an enemy, bad when it is an ally.
  return damage - (out.hit ? (out.hit.side === att.side ? damage : -damage) : 0);
}

export function battleAttack(state: GameState, targetId: string, useAbility: boolean, secondTargetId?: string) {
  const b = state.battle!;
  const act = b.activation!;
  const u = b.units[act.unitId];
  if (act.attacked) throw new Error('Ta jednostka już atakowała.');
  if (act.moveOnly) throw new Error('Ta aktywacja pozwala tylko na ruch.');
  const target = b.units[targetId];
  const ab = abilityOf(u);
  // Rzut Sztyletem: the throw goes at an enemy in sight that does not stand next to the Beduin.
  const throwing = useAbility && ab === 'daggerThrow' && throwTargets(state, u).some((t) => t.id === targetId);
  const legal = throwing ? throwTargets(state, u) : attackTargets(state, u);
  if (!target || !legal.some((t) => t.id === targetId)) throw new Error('Nieprawidłowy cel ataku.');
  if (useAbility && ab === 'daggerThrow' && !throwing) throw new Error('Sztyletem rzuca się we wroga, który nie stoi obok.');
  const canUse = useAbility && !u.abilityUsed && abilityActive(state) && ATTACK_ABILITIES.includes(ab) && (ab !== 'ramBlow' || ramCharged(state, u));
  if (useAbility && !canUse) throw new Error('Zdolność jest niedostępna.');

  const targets: BattleUnit[] = [target];
  if (canUse && isBreath(ab)) {
    const second = breathSecondTarget(state, u, target);
    if (second) targets.push(second);
  }
  // Przebicie: the lance goes through the target into the enemy right behind it.
  if (ab === 'pierce' && abilityActive(state) && !secondTargetId) {
    const behind = breathSecondTarget(state, u, target);
    if (behind && behind.side !== u.side) {
      targets.push(behind);
      log(state, 'ability', `${unitName(u)}: ${UNITS[u.defId].abilityName}.`);
    }
  }
  // Ostrzał: the cannon's shot hits the target and every enemy next to it.
  if ((ab === 'cannonFire' || ab === 'hailStones') && abilityActive(state)) {
    const tc = cellsOf(target);
    for (const e of enemiesOf(b, u)) if (e.id !== target.id && cellsOf(e).some((c) => tc.some((k) => adjacent(k, c)))) targets.push(e);
    if (targets.length > 1) log(state, 'ability', `${unitName(u)}: ${UNITS[u.defId].abilityName}.`);
  }
  if (secondTargetId && !(canUse && isBreath(ab))) {
    const second = b.units[secondTargetId];
    if (!canHitTwo(state, u)) throw new Error('Ta jednostka atakuje jeden cel.');
    if (!second || second.id === target.id || !unitsAdjacent(u, target) || !unitsAdjacent(u, second) || !legal.some((t) => t.id === second.id)) {
      throw new Error('Drugi cel musi sąsiadować z atakującym.');
    }
    targets.push(second);
    log(state, 'ability', `${unitName(u)}: ${UNITS[u.defId].abilityName}.`);
  }
  if (canUse) {
    // Ognisty Oddech at milestone 3 can be used twice in a battle.
    if (u.abilityExtra) u.abilityExtra = false;
    else u.abilityUsed = true;
    log(state, 'ability', `${unitName(u)} używa zdolności: ${UNITS[u.defId].abilityName}${u.abilityExtra ? ' (zostaje jeszcze jeden Oddech)' : ''}.`);
  }
  log(state, 'battle', `${unitName(u)} atakuje: ${targets.map(unitName).join(', ')}.`);
  if (u.pos && target.pos) u.facing = { q: parseKey(target.pos).q - parseKey(u.pos).q, r: parseKey(target.pos).r - parseKey(u.pos).r };
  for (const t of targets) {
    if (!t.alive || !u.alive) continue;
    const before = t.hp;
    const tCells = cellsOf(t);
    resolveAttack(state, u, t, canUse, act.movedDistance);
    // Szron: every blow of a unit of the Court puts frost on the target (the Pałac Szronu); the Grad Głazów puts it on everything it hits, whatever the palace.
    if (u.alive && t.alive && t.hp < before && (frostLevel(state, u.side) >= 1 || (ab === 'hailStones' && abilityActive(state)))) applyFrost(state, u.side, t);
    // Miecz Jutrzenki (Fala Ostrza): the blow also cuts one more enemy next to the target.
    if (u.gear?.cleave && u.alive && (!t.alive || t.hp < before)) {
      const other = Object.values(b.units).find((x) => x.alive && x.side !== u.side && x.id !== t.id && !targets.includes(x) && cellsOf(x).some((c) => tCells.some((k) => adjacent(k, c))));
      if (other) dealDamage(state, other, u.gear.cleave, `Fala Ostrza (${unitName(u)})`);
    }
    // Żniwo Many: every hit of the Lisz takes mana from the enemy hero and mends the Lisz.
    if (ab === 'manaReap' && abilityActive(state) && u.alive && t.hp < before) {
      const lost = drainMana(state, enemyHeroId(b, u.side), ABILITY.reapMana);
      const mended = Math.min(ABILITY.reapHeal * hpScaleOf(state), u.maxHp - u.hp);
      if (mended > 0) {
        u.hp += mended;
        (b.heals ??= []).push({ unitId: u.id, amount: mended });
      }
      if (lost > 0 || mended > 0) log(state, 'ability', `${unitName(u)}: ${UNITS[u.defId].abilityName}${lost > 0 ? ` (wróg traci ${lost} many)` : ''}${mended > 0 ? `, +${mended} Ż` : ''}.`);
    }
    if (ab === 'thiefClaw' && abilityActive(state) && u.alive && t.hp < before && u.hp < u.maxHp) {
      u.hp = Math.min(u.maxHp, u.hp + ABILITY.thiefClawHeal * hpScaleOf(state));
      log(state, 'ability', `${unitName(u)} odzyskuje ${ABILITY.thiefClawHeal * hpScaleOf(state)} Ż (Złodziejski Szpon).`);
    }
    // Zasadzka Spod Piasku: every hit of the Queen poisons.
    if (ab === 'sandAmbush' && abilityActive(state) && t.alive && t.hp < before) {
      if (resistsPoison(state, t)) log(state, 'ability', `${unitName(t)} jest odporny na truciznę.`);
      else t.status.poisoned = ABILITY.poisonTicks;
    }
    // Oplot: every hit of the Skolopendra holds the one hit and poisons it.
    if (ab === 'coil' && abilityActive(state) && t.alive && t.hp < before) {
      if (resistsStatus(state, t, true)) log(state, 'ability', `${unitName(t)} jest odporny na unieruchomienie.`);
      else {
        t.status.rootedNext = true;
        log(state, 'ability', `${unitName(t)} zostaje oplątany i nie ruszy się w swojej następnej aktywacji (${UNITS[u.defId].abilityName}).`);
      }
      swarmPoison(state, t, UNITS[u.defId].abilityName);
    }
    // Szczypce: every hit of the Homar holds the one hit in place.
    if (ab === 'pincers' && abilityActive(state) && t.alive && t.hp < before) {
      if (resistsStatus(state, t, true)) log(state, 'ability', `${unitName(t)} jest odporny na unieruchomienie.`);
      else {
        t.status.rootedNext = true;
        log(state, 'ability', `${unitName(t)} zostaje złapany w szczypce i nie ruszy się w swojej następnej aktywacji (${UNITS[u.defId].abilityName}).`);
      }
    }
    if (ab === 'grab' && abilityActive(state) && t.alive && t.hp < before && !resistsStatus(state, t, true)) {
      t.status.rootedNext = true;
      log(state, 'ability', `${unitName(t)} zostaje schwytany i nie ruszy się w swojej następnej aktywacji (${UNITS[u.defId].abilityName}).`);
    }
    if (canUse && ab === 'inferno' && t.pos) {
      // Pożoga: the flames spread to the target's neighbours on its side (the shooter's own side is spared).
      const burn = Object.values(b.units).filter((x) => x.alive && x.id !== t.id && x.side === t.side && unitsAdjacent(x, t));
      for (const x of burn) dealDamage(state, x, ABILITY.infernoDamage * scaleOf(state), `Pożoga (${unitName(u)})`);
    }
    if (canUse && t.alive) {
      if (ab === 'entanglingRoots') {
        if (resistsStatus(state, t, true)) log(state, 'ability', `${unitName(t)} jest odporny na korzenie.`);
        else {
          t.status.slowNext += ABILITY.rootsSlow;
          log(state, 'ability', `${unitName(t)}: −${ABILITY.rootsSlow} S w następnej aktywacji.`);
        }
      }
      if (ab === 'poisonClaw') {
        if (resistsPoison(state, t)) log(state, 'ability', `${unitName(t)} jest odporny na truciznę.`);
        else {
          t.status.poisoned = ABILITY.poisonTicks;
          log(state, 'ability', `${unitName(t)} zostaje zatruty: straci ${ABILITY.poisonDamage * scaleOf(state)} Ż na początku ${ABILITY.poisonTicks} następnych aktywacji.`);
        }
      }
      if (ab === 'curse' || ab === 'dimLight') {
        if (resistsStatus(state, t, false)) log(state, 'ability', `${unitName(t)} jest odporny na klątwę.`);
        else {
          t.status.cursedNext += ABILITY.curseMinus * scaleOf(state);
          log(state, 'ability', `${unitName(t)}: −${ABILITY.curseMinus * scaleOf(state)} A przy następnym ataku.`);
        }
      }
      // Lodowa Igła: the one hit is slower in its next activation.
      if (ab === 'frostSlow') {
        if (resistsStatus(state, t, true)) log(state, 'ability', `${unitName(t)} jest odporny na spowolnienie.`);
        else {
          t.status.slowNext += ABILITY.needleSlow;
          log(state, 'ability', `${unitName(t)}: −${ABILITY.needleSlow} S w następnej aktywacji.`);
        }
      }
      // Lodowy Cios: the one hit freezes at once.
      if (ab === 'iceBlow') freezeUnit(state, u.side, t);
      // Zmrażający Uścisk: the one hit cannot move in its next activation and gets frost.
      if (ab === 'frostGrip') {
        if (resistsStatus(state, t, true)) log(state, 'ability', `${unitName(t)} jest odporny na unieruchomienie.`);
        else {
          t.status.rootedNext = true;
          log(state, 'ability', `${unitName(t)} zostaje unieruchomiony do swojej następnej aktywacji (${UNITS[u.defId].abilityName}).`);
        }
        applyFrost(state, u.side, t);
      }
      // Smrodliwa Mikstura: the target and the enemies next to it are poisoned.
      if (ab === 'stinkBomb') {
        const cloud = [t, ...enemiesOf(b, u).filter((x) => x.id !== t.id && x.alive && unitsAdjacent(x, t))];
        for (const x of cloud) {
          if (resistsPoison(state, x)) log(state, 'ability', `${unitName(x)} jest odporny na truciznę.`);
          else {
            x.status.poisoned = ABILITY.poisonTicks;
            log(state, 'ability', `${unitName(x)} zostaje zatruty: straci ${ABILITY.poisonDamage * scaleOf(state)} Ż na początku ${ABILITY.poisonTicks} następnych aktywacji.`);
          }
        }
      }
      // Zarodniki Snu: the target and the enemies next to it are slowed and poisoned.
      if (ab === 'sleepSpores') {
        const cloud = [t, ...enemiesOf(b, u).filter((x) => x.id !== t.id && x.alive && unitsAdjacent(x, t))];
        for (const x of cloud) {
          if (resistsStatus(state, x, true)) log(state, 'ability', `${unitName(x)} jest odporny na spowolnienie.`);
          else {
            x.status.slowNext += ABILITY.sporesSlow;
            log(state, 'ability', `${unitName(x)}: −${ABILITY.sporesSlow} S w następnej aktywacji.`);
          }
          swarmPoison(state, x, UNITS[u.defId].abilityName);
        }
      }
      // Bractwo Przypływu. Harpun: the one hit is pulled towards the shooter; Atrament: the target and its neighbours are weaker at their next attack; Wir: the Rekinołak
      // and the target change places.
      if (ab === 'harpoon') tidePull(state, t, u, ABILITY.harpoonPull, UNITS[u.defId].abilityName);
      if (ab === 'inkCloud') {
        const cloud = [t, ...enemiesOf(b, u).filter((x) => x.id !== t.id && x.alive && unitsAdjacent(x, t))];
        for (const x of cloud) {
          if (resistsStatus(state, x, false)) log(state, 'ability', `${unitName(x)} jest odporny na klątwę.`);
          else {
            x.status.cursedNext += ABILITY.inkMinus * scaleOf(state);
            log(state, 'ability', `${unitName(x)} zalany atramentem: −${ABILITY.inkMinus * scaleOf(state)} A przy następnym ataku.`);
          }
        }
      }
      if (ab === 'whirl') {
        if (!canBeMoved(state, t) || isLarge(state, t) || isLarge(state, u)) log(state, 'ability', `${unitName(t)} nie da się przestawić (${UNITS[u.defId].abilityName}).`);
        else if (swapCells(u, t)) {
          log(state, 'ability', `${unitName(u)} kręci wir i zamienia się miejscami z ${unitName(t)}.`);
          stepOnFields(state, t);
          stepOnFields(state, u);
        }
      }
      // Hipnoza: the one hit cannot move in its next activation.
      if (ab === 'hypnosis') {
        if (resistsStatus(state, t, true)) log(state, 'ability', `${unitName(t)} jest odporny na unieruchomienie.`);
        else {
          t.status.rootedNext = true;
          log(state, 'ability', `${unitName(t)} jest zahipnotyzowany i nie ruszy się w swojej następnej aktywacji (${UNITS[u.defId].abilityName}).`);
        }
      }
      // Młot Przodków, Taran, Stratowanie: the one hit loses its next activation.
      if (ab === 'stunBlow' || ab === 'ramBlow') {
        t.status.stunned = true;
        log(state, 'ability', `${unitName(t)} traci następną aktywację (${UNITS[u.defId].abilityName}).`);
      }
      // Zgaszone Światło: the lantern also puts out the enemy hero's mana.
      if (ab === 'dimLight') {
        const lost = drainMana(state, enemyHeroId(b, u.side), ABILITY.dimLightMana);
        if (lost > 0) log(state, 'ability', `Bohater wroga traci ${lost} many (${UNITS[u.defId].abilityName}).`);
      }
      // Oddech Grobu: the ones the breath hit are slowed.
      if (ab === 'graveBreath') {
        if (resistsStatus(state, t, true)) log(state, 'ability', `${unitName(t)} jest odporny na spowolnienie.`);
        else {
          t.status.slowNext += ABILITY.graveBreathSlow;
          log(state, 'ability', `${unitName(t)}: −${ABILITY.graveBreathSlow} S w następnej aktywacji.`);
        }
      }
    }
    // No pushing in a duel: nobody moves there, so the two leaders would never meet again.
    // Large units (digital ruleset) are too heavy to push.
    if (ab === 'boulder' && t.alive && t.tail && !b.duel && abilityActive(state)) log(state, 'ability', `${unitName(t)} jest zbyt ciężki, by go odepchnąć (${UNITS[u.defId].abilityName}).`);
    if (ab === 'boulder' && t.alive && !t.tail && !b.duel && abilityActive(state)) {
      const from = cellsOf(u).reduce((a, c) => (distance(parseKey(c), parseKey(t.pos!)) < distance(parseKey(a), parseKey(t.pos!)) ? c : a));
      const to = pushCell(state, from, t.pos!);
      if (to) {
        t.pos = to;
        stepOnFields(state, t);
        log(state, 'ability', `${unitName(t)} zostaje odepchnięty o 1 pole (${UNITS[u.defId].abilityName}).`);
      } else log(state, 'ability', `${unitName(t)} nie ma gdzie się cofnąć (${UNITS[u.defId].abilityName}).`);
    }
    // Kły Kapitana: the Mors pushes the one it hit 1 away, without a collision.
    if (ab === 'tuskShove' && t.alive && u.alive && !b.duel && abilityActive(state)) pushWithCollision(state, t, u, 1, 0, UNITS[u.defId].abilityName);
    // Dzikie Stado: the blows that push (Byczy Łeb, Taran, Rogi Przodków, and the Kamień Tętentu after a run).
    if (t.alive && u.alive && !b.duel && abilityActive(state)) herdsBlow(state, u, t, canUse, act.movedDistance);
  }
  // Trzęsienie: the Golem with its rune core bare shakes everything around it after each attack.
  if (ab === 'runeGolem' && abilityActive(state) && u.alive && coreExposed(u)) {
    log(state, 'ability', `${unitName(u)}: Trzęsienie.`);
    for (const x of Object.values(b.units)) if (x.alive && x.id !== u.id && x.pos && unitsAdjacent(u, x)) dealDamage(state, x, ABILITY.quakeDamage * scaleOf(state), 'Trzęsienie');
  }
  u.status.nextAttackBonus = 0;
  u.status.cursedNext = 0;
  if (u.gear?.firstStrike) delete u.gear.firstStrike;
  // Grzybnia (second level of the Serce Grzybni): the cells a unit of the Swarm attacked from become mycelium.
  if (u.alive && u.pos && !b.duel && myceliumLevel(state, u.side) >= FACTION_MECHANICS.myceliumAttackLevel) claimCells(state, u.side, cellsOf(u));
  // Ukryty: the attack uncovers the Jenot.
  if (u.status.veiled) unveil(state, u);
  // Bitewny Szał: a kill feeds the next blow.
  if (ab === 'bloodRage' && abilityActive(state) && u.alive && targets.some((t) => !t.alive)) {
    u.status.nextAttackBonus += ABILITY.bloodRageBonus * scaleOf(state);
    log(state, 'ability', `${unitName(u)} wpada w szał: następny cios +${ABILITY.bloodRageBonus * scaleOf(state)} A (${UNITS[u.defId].abilityName}).`);
  }
  act.attacked = true;
  act.acted = true;
  if (checkBattleEnd(state)) return;
  // The attacker fell on the thorns of the hero's armour: its activation is over.
  if (!u.alive) return endActivation(state);
  // Rzut Sztyletem: after the throw the Beduin may still make its move (it has not moved yet), then its activation ends.
  if (throwing) {
    act.thrown = true;
    if (!act.moved && moveRange(u) > 0 && reachableCells(state, u).size) return;
    return endActivation(state);
  }
  // Kacza Furia: a kill gives the duck another full activation right away.
  if (ab === 'duckFury' && abilityActive(state) && u.alive && targets.some((t) => !t.alive)) {
    const haste = (u.tier ?? 0) >= MILESTONE_TIER.duckHaste ? 1 : 0;
    b.extra.unshift({ unitId: u.id, moveOnly: false, ...(haste ? { speedBonus: haste } : {}) });
    log(state, 'ability', `${unitName(u)} wpada w szał i aktywuje się ponownie (${UNITS[u.defId].abilityName})${haste ? ', szybciej o 1 S' : ''}.`);
    const heal = abilityNum(u, 'duckKillHeal') * hpScaleOf(state);
    if (heal > 0 && u.hp < u.maxHp) {
      u.hp = Math.min(u.maxHp, u.hp + heal);
      log(state, 'ability', `${unitName(u)} odzyskuje ${heal} Ż po zabiciu wroga.`);
    }
  }
  const hopAbility = ab === 'airDash' || ab === 'nestLeap' || ab === 'gallop' || ab === 'runOn';
  if (hopAbility && !b.duel && (!u.abilityUsed || ab === 'nestLeap') && abilityActive(state) && u.alive) {
    // W Biegu: the move is finished with the cells the unit did not use before the attack.
    const range = ab === 'runOn' ? Math.max(0, moveRange(u) - act.movedDistance) : slowedRange(u, ab === 'airDash' ? ABILITY.airDashRange : ab === 'gallop' ? ABILITY.gallopRange : ABILITY.nestLeapRange);
    if (range > 0) {
      act.hop = range;
      return;
    }
  }
  endActivation(state);
}

export function hopCells(state: GameState, u: BattleUnit, range: number): HexKey[] {
  const b = state.battle!;
  const obstacles = obstacleSet(b);
  const units = occupancy(b, u);
  // A unit on two hexes hops as far as a small one in the direction it faces: the range counts from the nearer of its two cells (report 187493: the Pegasus
  // got only two hexes out of three once it lay on two).
  const reach = (k: HexKey) => Math.min(...cellsOf(u).map((c) => distance(parseKey(c), parseKey(k))));
  return layoutCells(b).filter((k) => !obstacles.has(k) && !units.has(k) && u.pos && reach(k) <= range && k !== u.pos && fitsAt(state, u, k));
}

export function battleHop(state: GameState, to: HexKey) {
  const b = state.battle!;
  const act = b.activation!;
  const u = b.units[act.unitId];
  if (!act.hop) throw new Error('Odskok jest niedostępny.');
  if (!hopCells(state, u, act.hop).includes(to)) throw new Error('Pole poza zasięgiem odskoku.');
  const before = neighboursOf(b, u);
  placeUnit(state, u, to);
  if (!UNLIMITED_ABILITIES.includes(abilityOf(u))) u.abilityUsed = true;
  act.hop = 0;
  log(state, 'ability', `${unitName(u)} odskakuje (${UNITS[u.defId].abilityName}).`);
  stepOnFields(state, u);
  steppedUp(state, u, before);
  endActivation(state);
}

/** How far the unit may teleport instead of moving (Podkop, Król Burzy); 0 when it cannot. */
export function teleportRange(state: GameState, u: BattleUnit): number {
  if (!abilityActive(state) || !isDigital(state.rules)) return 0;
  const ab = abilityOf(u);
  return slowedRange(u, ab === 'burrow' ? ABILITY.burrowRange : ab === 'stormKing' ? ABILITY.stormTeleportRange : ab === 'wyrmBurrow' ? ABILITY.wyrmRange : 0);
}

/** Cells the active unit may teleport to (empty when it has already moved or attacked, or in a duel). */
export function teleportCells(state: GameState, u: BattleUnit): HexKey[] {
  const b = state.battle!;
  const act = b.activation;
  const range = teleportRange(state, u);
  if (!range || b.duel || !act || act.unitId !== u.id || act.moved || act.attacked || act.moveOnly || u.status.rootedNext) return [];
  return hopCells(state, u, range);
}

/** Podkop / Teleport: the unit leaves the field and its turn ends (a teleport is a move: no attack after it). */
export function battleTeleport(state: GameState, to: HexKey) {
  const b = state.battle!;
  const act = b.activation!;
  const u = b.units[act.unitId];
  if (!teleportCells(state, u).includes(to)) throw new Error('Pole poza zasięgiem teleportu.');
  const from = u.pos!;
  const ab = abilityOf(u);
  const before = neighboursOf(b, u);
  placeUnit(state, u, to);
  (b.teleports ??= []).push({ unitId: u.id, from, to, kind: ab === 'stormKing' ? 'storm' : 'burrow' });
  act.moved = true;
  act.acted = true;
  log(state, 'ability', `${unitName(u)} ${ab === 'burrow' ? 'wychodzi spod ziemi' : ab === 'wyrmBurrow' ? 'wynurza się spod piasku' : 'teleportuje się'} (${UNITS[u.defId].abilityName}).`);
  if (ab === 'wyrmBurrow') wyrmRises(state, u);
  steppedUp(state, u, before);
  if (ab === 'stormKing') {
    (b.fields ??= []).push({ cell: from, until: b.round + ABILITY.chargedFieldRounds - 1 });
    log(state, 'ability', 'Opuszczone pole zostaje naładowane.');
  }
  stepOnFields(state, u);
  endActivation(state);
}

/** Pola Naładowane: a unit that has stepped on a charged field takes damage. */
export function stepOnFields(state: GameState, u: BattleUnit) {
  const b = state.battle!;
  if (!u.alive) return;
  triggerTraps(state, u);
  if (!b.fields?.length || !u.alive) return;
  const here = cellsOf(u);
  if (b.fields.some((f) => f.until >= b.round && here.includes(f.cell))) dealDamage(state, u, ABILITY.chargedFieldDamage * scaleOf(state), 'Pole Naładowane');
}

// ---------------------------------------------------------------- the Free Companies: hidden traps (Sidła), the mark, the veil

/** The level of the Warsztat Sideł (the Free Companies' mechanic) a side has: 0 for any other faction or without the building. */
export const trapLevel = (state: GameState, side: Side): number => (side !== 'neutral' && raceOf(state, side) === 'free' ? mechLevel(state, side) : 0);

/** How many hidden traps a side lays before a battle: the Warsztat Sideł by its level, and the Iskra's two on top (none in a duel, none without abilities). */
export function trapSlots(state: GameState, side: Side): number {
  if (side === 'neutral' || raceOf(state, side) !== 'free' || !abilityActive(state) || state.battle?.duel) return 0;
  const level = trapLevel(state, side);
  return (level ? FACTION_MECHANICS.trapCount[Math.min(level, 4) - 1] : 0) + (hasSpark(state, side) ? FACTION_MECHANICS.sparkTraps : 0);
}

const columnOf = (b: BattleState, k: HexKey): number => (b.layout === 'wide' ? wideCellOf(k).col : cellOf(k).col);

/** The cells where a side may lay a trap: its own half of the arena, without its start columns (the units stand there) and the middle column, and without obstacles. */
export function trapZone(b: BattleState, side: Side): HexKey[] {
  const last = (b.layout === 'wide' ? WIDE_COLUMNS : ARENA_COLUMNS) - 1;
  const middle = last / 2;
  const depth = b.deployDepth?.[side] ?? 0;
  const attacking = side === b.attacker;
  return layoutCells(b).filter((k) => {
    const col = columnOf(b, k);
    return !b.obstacles.includes(k) && (attacking ? col > depth && col < middle : col < last - depth && col > middle);
  });
}

/** The traps a side has in the field (its own: it always knows them). */
export const trapsOf = (b: BattleState, side: Side): GroundEffect[] => (b.ground ?? []).filter((g) => g.kind === 'trap' && g.owner === side);

/** Whether a trap of another side than `side` lies on the cell (the engine's knowledge: the rules decide with it, no bot and no screen reads it). */
export const enemyTrapAt = (b: BattleState, side: Side, cell: HexKey): boolean => (b.ground ?? []).some((g) => g.kind === 'trap' && g.owner !== side && g.cell === cell && (g.until === undefined || g.until >= b.round));

/** Whether a side may lay a trap on the cell now: in its zone, free of units, with no trap of its own there. */
export const mayLayTrap = (b: BattleState, side: Side, cell: HexKey): boolean => trapZone(b, side).includes(cell) && !unitAt(b, cell) && !trapsOf(b, side).some((g) => g.cell === cell);

export function layTrap(state: GameState, side: Side, cell: HexKey): void {
  const b = state.battle!;
  (b.ground ??= []).push({ cell, owner: side, kind: 'trap', power: ABILITY.trapDamage * scaleOf(state), hidden: true, ...(trapLevel(state, side) >= FACTION_MECHANICS.trapHoldLevel ? { hold: true } : {}) });
}

/**
 * Where a side lays `n` more traps when nobody tells it (the bots, and the humans who lay fewer than they may): in front of its own shooters (the units
 * the enemy wants to reach), near the middle, never next to each other. Reads only what is on the arena for everybody (positions of units), never another side's traps.
 */
export function autoTrapCells(state: GameState, side: Side, n: number): HexKey[] {
  const b = state.battle!;
  const foes = b.attacker === side ? b.defender : b.attacker;
  // Where the enemy is (positions are public) or, before it is deployed, where it will come from: the cells of its side of the arena.
  const foeCells = (foes === 'neutral' ? Object.values(b.units).filter((x) => x.side === 'neutral' && x.alive) : livingUnits(b, foes)).flatMap(cellsOf);
  const last = (b.layout === 'wide' ? WIDE_COLUMNS : ARENA_COLUMNS) - 1;
  const foeColumn = side === b.attacker ? last : 0;
  const chosen: HexKey[] = [];
  const zone = trapZone(b, side).filter((k) => mayLayTrap(b, side, k));
  for (let i = 0; i < n; i++) {
    let best: { k: HexKey; score: number } | null = null;
    for (const k of zone) {
      if (chosen.includes(k)) continue;
      const h = parseKey(k);
      // On the enemy's road: as close to the enemy as the own half allows (the cells just before the middle line), in front of its units rather than behind its flank.
      const toFoe = foeCells.length ? Math.min(...foeCells.map((g) => distance(parseKey(g), h))) : Math.abs(columnOf(b, k) - foeColumn);
      let score = -toFoe - Math.abs(wideOrHalfRow(b, k)) * 0.15;
      for (const c of chosen) { const d = distance(parseKey(c), h); if (d <= 1) score -= 8; else if (d <= 2) score -= 2; }
      if (!best || score > best.score + 1e-9 || (Math.abs(score - best.score) <= 1e-9 && k < best.k)) best = { k, score };
    }
    if (!best) break;
    chosen.push(best.k);
  }
  return chosen;
}

/** How far a cell lies from the middle row (signed distance is not needed: the middle rows are the ones traps are best laid in). */
const wideOrHalfRow = (b: BattleState, k: HexKey): number => middleDistance(b, k) / (b.layout === 'wide' ? 1 : 2);

/** The traps a side lays when it deploys: the cells it chose (checked) and the rest laid for it. */
function layDeployTraps(state: GameState, side: Side, chosen: HexKey[] | undefined, slots: number): void {
  const b = state.battle!;
  const picks = chosen ?? [];
  if (new Set(picks).size !== picks.length) throw new Error('Dwie pułapki nie mogą leżeć na jednym polu.');
  if (picks.length > slots) throw new Error(`Można położyć najwyżej ${slots} pułapek.`);
  for (const k of picks) if (!mayLayTrap(b, side, k)) throw new Error('Pułapkę można położyć tylko na wolnym polu swojej połowy areny.');
  for (const k of picks) layTrap(state, side, k);
  for (const k of autoTrapCells(state, side, slots - picks.length)) layTrap(state, side, k);
}

/** A unit stands on a trap of the enemy: the trap goes off (it is spent and everybody sees it), hurts the unit and with the third level of the Warsztat holds it. */
function triggerTraps(state: GameState, u: BattleUnit): void {
  const b = state.battle!;
  if (!b.ground?.length) return;
  const here = cellsOf(u);
  for (const g of [...b.ground]) {
    if (g.kind !== 'trap' || g.owner === u.side || !here.includes(g.cell) || (g.until !== undefined && g.until < b.round)) continue;
    b.ground = b.ground.filter((x) => x !== g);
    log(state, 'ability', `${unitName(u)} wpada w sidła!`);
    dealDamage(state, u, g.power, 'Sidła');
    if (u.alive && g.hold) {
      if (resistsStatus(state, u, true)) log(state, 'ability', `${unitName(u)} jest odporny na unieruchomienie.`);
      else {
        u.status.rootLater = true;
        log(state, 'ability', `${unitName(u)} zostaje unieruchomiony do końca swojej następnej aktywacji (sidła).`);
      }
    }
    if (!u.alive) return;
  }
}

/** Ukryty: the unit steps out of hiding (the enemy sees and may choose it from now on). */
export function unveil(state: GameState, u: BattleUnit): void {
  if (!u.status.veiled) return;
  delete u.status.veiled;
  log(state, 'ability', `${unitName(u)} wychodzi z ukrycia.`);
}

/** Ruchoma Twierdza: the turret on the Waran's back shoots the nearest enemy in its line of sight, once a round (at the end of the Waran's activation). */
function towerFire(state: GameState, u: BattleUnit): void {
  const b = state.battle!;
  if (abilityOf(u) !== 'towerShot' || !abilityActive(state) || b.duel || !u.pos || u.status.towerRound === b.round) return;
  const sees = (e: BattleUnit) => cellsOf(e).some((c) => hasLineOfSight(state, u.pos!, c));
  const t = enemiesOf(b, u).filter(sees).sort((x, y) => unitDistance(u, x) - unitDistance(u, y) || x.hp - y.hp || (x.id < y.id ? -1 : 1))[0];
  if (!t) return;
  u.status.towerRound = b.round;
  log(state, 'ability', `${unitName(u)}: wieżyczka strzela do ${unitName(t)}.`);
  dealDamage(state, t, ABILITY.towerDamage * scaleOf(state), 'Wieżyczka');
}

/** Szalony Skok: Żbiczka may leap once per battle (not in a siege, not rooted). */
export const wildLeapReady = (state: GameState, u: BattleUnit): boolean =>
  abilityOf(u) === 'wildLeap' && abilityActive(state) && !u.status.leapUsed && !u.status.rootedNext && !state.battle?.siege && !state.battle?.duel && !isLarge(state, u);

/** The cells the unit can reach only by a leap (Szalony Skok): within its range, free, and not already within its walk. */
export function leapOnlyCells(state: GameState, u: BattleUnit): Set<HexKey> {
  const b = state.battle!;
  const out = new Set<HexKey>();
  if (!wildLeapReady(state, u) || !u.pos) return out;
  const obstacles = obstacleSet(b);
  const walk = walkSearch(state, u).dist;
  const units = occupancy(b, u);
  for (const k of layoutCells(b)) {
    if (walk.has(k) || obstacles.has(k) || units.has(k) || distance(parseKey(u.pos), parseKey(k)) > slowedRange(u, ABILITY.wildLeapRange)) continue;
    out.add(k);
  }
  return out;
}

/** Oko Kruka: marks the enemy to the end of the round and uncovers the traps and veiled units around the Raven (the traps stay hidden from everybody else). */
function ravenEye(state: GameState, u: BattleUnit, t: BattleUnit): void {
  const b = state.battle!;
  t.status.marked = { by: u.side, round: b.round };
  log(state, 'ability', `${unitName(t)} jest oznaczony do końca rundy.`);
  const near = (c: HexKey) => cellsOf(u).some((m) => distance(parseKey(m), parseKey(c)) <= ABILITY.ravenRadius);
  let found = 0;
  for (const g of b.ground ?? []) {
    if (g.kind !== 'trap' || g.owner === u.side || !g.hidden || g.seenBy?.includes(u.side) || !near(g.cell)) continue;
    (g.seenBy ??= []).push(u.side);
    found++;
  }
  for (const x of Object.values(b.units)) if (x.alive && x.pos && x.side !== u.side && x.status.veiled && cellsOf(x).some(near)) (unveil(state, x), found++);
  if (found) log(state, 'ability', `${unitName(u)} odsłania ukryte ślady wokół siebie.`);
}

/** Tama: the free cell next to the unit nearest to the closest enemy (null: no room). */
export function damCell(state: GameState, u: BattleUnit): HexKey | null {
  const b = state.battle!;
  if (b.duel || !u.pos) return null;
  const obstacles = obstacleSet(b);
  const foes = enemiesOf(b, u).flatMap(cellsOf);
  const gap = (k: HexKey) => Math.min(...foes.map((f) => distance(parseKey(f), parseKey(k))), 99);
  return neighborKeys(u.pos).concat(u.tail ? neighborKeys(u.tail) : []).filter((k, i, all) => all.indexOf(k) === i && inLayout(b, k) && !obstacles.has(k) && !unitAt(b, k)).sort((x, y) => gap(x) - gap(y) || (x < y ? -1 : 1))[0] ?? null;
}

/** Ładunek: how much a blast on `cell` is worth to `u`'s side: damage to the enemies (kills count double) less damage to its own, in the unit's scale (for the bots and for the choice of a default trap). */
export function blastValue(state: GameState, u: BattleUnit, cell: HexKey): number {
  const b = state.battle!;
  const area = [cell, ...neighborKeys(cell)];
  const dmg = ABILITY.blastDamage * scaleOf(state);
  let value = 0;
  for (const x of Object.values(b.units)) {
    if (!x.alive || !x.pos || !cellsOf(x).some((c) => area.includes(c))) continue;
    const worth = Math.min(dmg, x.hp) + (dmg >= x.hp ? 3 * scaleOf(state) : 0);
    value += x.side === u.side ? -worth : worth;
  }
  return value;
}

/** The own trap the Petardnik blows up when nobody says which: the one whose blast is worth most to its side. */
export function bestBlastTrap(state: GameState, u: BattleUnit): HexKey | null {
  const traps = trapsOf(state.battle!, u.side).map((g) => g.cell).sort();
  return traps.sort((x, y) => blastValue(state, u, y) - blastValue(state, u, x) || (x < y ? -1 : 1))[0] ?? null;
}

// ---------------------------------------------------------------- the Swarm of the Wilds: the mycelium, the group, the change of form

/** The level of the Serce Grzybni (the Swarm's mechanic) a side has: 0 for any other faction or without the building. */
export const myceliumLevel = (state: GameState, side: Side): number => (side !== 'neutral' && raceOf(state, side) === 'swarm' ? mechLevel(state, side) : 0);

/** Whether the cell is mycelium of `side`. */
export const myceliumAt = (b: BattleState, side: Side, cell: HexKey): boolean => (b.ground ?? []).some((g) => g.kind === 'claimed' && g.owner === side && g.cell === cell);

/** The cells of the mycelium of a side. */
export const myceliumOf = (b: BattleState, side: Side): HexKey[] => (b.ground ?? []).filter((g) => g.kind === 'claimed' && g.owner === side).map((g) => g.cell);

/** Whether the unit stands on the mycelium of its own side (a large one: with its head or its tail). */
export const onOwnMycelium = (b: BattleState, u: BattleUnit): boolean => Boolean(u.pos) && cellsOf(u).some((c) => myceliumAt(b, u.side, c));

/** The mycelium of `side` grows over the cells (only cells of the arena that are not obstacles; a cell is claimed once). */
export function claimCells(state: GameState, side: Side, cells: readonly HexKey[]): number {
  const b = state.battle!;
  const blocked = obstacleSet(b);
  let n = 0;
  for (const c of cells) {
    if (!inLayout(b, c) || blocked.has(c) || myceliumAt(b, side, c)) continue;
    (b.ground ??= []).push({ cell: c, owner: side, kind: 'claimed', power: 0 });
    n++;
  }
  return n;
}

/** The middle column of the arena (the Swarm's Spark covers it). */
function middleColumn(b: BattleState): HexKey[] {
  const wide = b.layout === 'wide';
  const mid = Math.floor(((wide ? WIDE_COLUMNS : ARENA_COLUMNS) - 1) / 2);
  return wide ? wideColumnCells(mid) : columnCells(mid);
}

/** When the fight begins: the Serce Grzybni grows over the deploy cells of the Swarm, and its Spark (Matecznik) over them and the middle column of the arena. */
function myceliumAtStart(state: GameState): void {
  const b = state.battle!;
  if (b.duel) return;
  for (const side of [b.attacker, b.defender]) {
    if (side === 'neutral' || raceOf(state, side) !== 'swarm') continue;
    const spark = hasSpark(state, side);
    if (myceliumLevel(state, side) >= 1 || spark) claimCells(state, side, deployCells(b, side));
    if (spark) {
      claimCells(state, side, middleColumn(b));
      log(state, 'ability', `${SPARK_NAMES.swarm}: grzybnia pokrywa pola Roju i środek areny.`);
    }
  }
}

/** A unit has fallen on `cells`: the mycelium of every Swarm with the Serce Grzybni grows there. */
function myceliumOnDeath(state: GameState, cells: readonly HexKey[]): void {
  const b = state.battle!;
  if (b.duel) return;
  for (const side of [b.attacker, b.defender]) if (myceliumLevel(state, side) >= 1) claimCells(state, side, cells);
}

/** How many allies (not mirages) stand next to the unit, at most `ABILITY.groupMax` (Mrowisko, Chitynowa Ściana). */
export const groupMates = (b: BattleState, u: BattleUnit): number =>
  Math.min(ABILITY.groupMax, livingUnits(b, u.side).filter((x) => x.id !== u.id && !x.status.mirage && x.pos && unitsAdjacent(x, u)).length);

/** Whether the unit flies: by its card, or as the butterfly of the Gąsienica Korzenna. */
export const flies = (u: BattleUnit): boolean => UNITS[u.defId].movement === 'fly' || Boolean(u.status.winged);

/** Poisons the unit unless it resists (the poison of the Swarm: Pyłek, Zarodniki Snu, Oplot, the mycelium of the third level). */
function swarmPoison(state: GameState, t: BattleUnit, source: string): void {
  if (!t.alive) return;
  if (resistsPoison(state, t)) log(state, 'ability', `${unitName(t)} jest odporny na truciznę.`);
  else {
    t.status.poisoned = ABILITY.poisonTicks;
    log(state, 'ability', `${unitName(t)} zostaje zatruty (${source}): straci ${ABILITY.poisonDamage * scaleOf(state)} Ż na początku ${ABILITY.poisonTicks} następnych aktywacji.`);
  }
}

/** Pyłek: the fallen Purchawka poisons every unit next to the cells it lay on, its allies as well as the enemies. */
function puffballBurst(state: GameState, dead: BattleUnit, cells: readonly HexKey[]): void {
  const b = state.battle!;
  const near = livingUnits(b).filter((x) => x.pos && cellsOf(x).some((c) => cells.some((k) => adjacent(k, c))));
  if (near.length) log(state, 'ability', `${unitName(dead)} pęka chmurą pyłku (${UNITS[dead.defId].abilityName}).`);
  for (const x of near) swarmPoison(state, x, UNITS[dead.defId].abilityName);
}

/** Przepoczwarzenie: the first time the caterpillar drops to half its Życie (and lives) it turns into a butterfly: Życie back and flight. */
function metamorphose(state: GameState, u: BattleUnit): void {
  if (!u.alive || u.abilityUsed || u.hp * 2 > u.maxHp || abilityOf(u) !== 'metamorphosis' || !abilityActive(state)) return;
  u.abilityUsed = true;
  const healed = Math.min(ABILITY.morphHeal * hpScaleOf(state), u.maxHp - u.hp);
  u.hp += healed;
  u.status.winged = true;
  log(state, 'ability', `${unitName(u)} przepoczwarza się w Motyla Korzennego: +${healed} Ż i od teraz lata.`);
  if (state.battle && healed > 0) (state.battle.heals ??= []).push({ unitId: u.id, amount: healed });
}

/** At the start of a unit's activation: Na Swojej Ziemi and the fourth level of the Serce Grzybni heal a unit of the Swarm on its mycelium. */
function myceliumHeal(state: GameState, u: BattleUnit): void {
  const b = state.battle!;
  if (!u.alive || u.hp >= u.maxHp || !onOwnMycelium(b, u)) return;
  let heal = 0;
  if (abilityOf(u) === 'homeGround' && abilityActive(state)) heal += ABILITY.homeHeal;
  if (myceliumLevel(state, u.side) >= FACTION_MECHANICS.myceliumHealLevel) heal += FACTION_MECHANICS.myceliumHeal;
  if (!heal) return;
  const healed = Math.min(heal * hpScaleOf(state), u.maxHp - u.hp);
  u.hp += healed;
  log(state, 'ability', `${unitName(u)} odzyskuje ${healed} Ż na grzybni.`);
  (b.heals ??= []).push({ unitId: u.id, amount: healed });
}

/** The third level of the Serce Grzybni: an enemy that ends its move on the mycelium is poisoned. */
function myceliumPoisons(state: GameState, u: BattleUnit): void {
  const b = state.battle!;
  if (!u.alive || !u.pos || b.duel || u.status.mirage) return;
  for (const side of [b.attacker, b.defender]) {
    if (side === u.side || myceliumLevel(state, side) < FACTION_MECHANICS.myceliumPoisonLevel) continue;
    if (cellsOf(u).some((c) => myceliumAt(b, side, c))) return swarmPoison(state, u, 'Grzybnia');
  }
}

/** Rozsiew: the cells the mycelium of the Matka covers when she picks `cell`: the cell and its nearest free neighbours, `ABILITY.sporeCells` in all. */
export function sporeArea(state: GameState, u: BattleUnit, cell: HexKey): HexKey[] {
  const b = state.battle!;
  const blocked = obstacleSet(b);
  const near = neighborKeys(cell)
    .filter((k) => inLayout(b, k) && !blocked.has(k))
    .sort((x, y) => Number(myceliumAt(b, u.side, x)) - Number(myceliumAt(b, u.side, y)) || (x < y ? -1 : 1));
  return [cell, ...near].slice(0, ABILITY.sporeCells);
}

/** Rozsiew: the cells the Matka may pick (in her range, on the arena, no obstacle). */
export function sporeCells(state: GameState, u: BattleUnit): HexKey[] {
  const b = state.battle!;
  if (!u.pos) return [];
  const blocked = obstacleSet(b);
  return layoutCells(b).filter((k) => !blocked.has(k) && Math.min(...cellsOf(u).map((c) => distance(parseKey(c), parseKey(k)))) <= ABILITY.sporeRange);
}

/** Rozsiew without a chosen cell: the one whose new mycelium lies under the most units of the side (then the most new cells, then the nearest to the enemy). */
export function bestSporeCell(state: GameState, u: BattleUnit): HexKey | null {
  const b = state.battle!;
  const own = livingUnits(b, u.side).flatMap(cellsOf);
  const foes = enemiesOf(b, u).flatMap(cellsOf);
  const gap = (k: HexKey) => Math.min(99, ...foes.map((f) => distance(parseKey(f), parseKey(k))));
  const value = (k: HexKey) => {
    const fresh = sporeArea(state, u, k).filter((c) => !myceliumAt(b, u.side, c));
    return fresh.filter((c) => own.includes(c)).length * 3 + fresh.length;
  };
  return sporeCells(state, u).sort((x, y) => value(y) - value(x) || gap(x) - gap(y) || (x < y ? -1 : 1))[0] ?? null;
}

// ---------------------------------------------------------------- the Brotherhood of the Tide: the swap of places, pulls, pushes without a collision, shields

/** The level of the Świątynia Pływów (the Tides' mechanic) a side has: 0 for any other faction or without the building. */
export const tideLevel = (state: GameState, side: Side): number => (side !== 'neutral' && raceOf(state, side) === 'tides' ? mechLevel(state, side) : 0);

/** Two single-cell units trade their cells (false when one of them lies on two cells or off the board). */
function swapCells(a: BattleUnit, c: BattleUnit): boolean {
  if (a.tail || c.tail || !a.pos || !c.pos || a.id === c.id) return false;
  [a.pos, c.pos] = [c.pos, a.pos];
  return true;
}

/** A pull of the Tides (Harpun, Pieśń Syreny, Oplot Głębin, Wir Głębin): the target goes up to `steps` cells towards `source` and steps on what lies there. */
export function tidePull(state: GameState, t: BattleUnit, source: BattleUnit, steps: number, label: string): number {
  if (!t.alive || !t.pos) return 0;
  if (!canBeMoved(state, t)) {
    log(state, 'ability', `${unitName(t)} nie da się przyciągnąć (${label}).`);
    return 0;
  }
  const { moved } = pullIn(state, t, source, steps);
  if (moved > 0) {
    log(state, 'ability', `${unitName(t)} zostaje przyciągnięty (pól: ${moved}; ${label}).`);
    stepOnFields(state, t);
  }
  return moved;
}

/** The allies the active unit of the Tides may swap places with now (Świątynia Pływów): single-cell, movable, within the temple's reach. */
export function tideTargets(state: GameState, u: BattleUnit): BattleUnit[] {
  const b = state.battle!;
  if (!u.pos || isLarge(state, u) || !canBeMoved(state, u)) return [];
  return livingUnits(b, u.side).filter((x) => x.id !== u.id && x.pos && !isLarge(state, x) && !x.status.mirage && unitDistance(u, x) <= FACTION_MECHANICS.tideRange && canBeMoved(state, x));
}

/** Przypływ: whether the active unit may swap places with an ally now (before it has moved or acted; once a battle, from the second level once a round). */
export function tideSwapReady(state: GameState, u: BattleUnit): boolean {
  const b = state.battle!;
  const level = tideLevel(state, u.side);
  const act = b.activation;
  if (level < 1 || b.duel || !act || act.unitId !== u.id || act.acted || act.moved || act.moveOnly || u.status.mirage) return false;
  const used = (b.tideSwaps ?? []).filter((x) => x.side === u.side);
  if (level >= FACTION_MECHANICS.tideRoundLevel ? used.some((x) => x.round === b.round) : used.length > 0) return false;
  return tideTargets(state, u).length > 0;
}

/**
 * Przypływ, the swap itself: the active unit and the ally trade cells, then the unit goes on with its activation. Third level: of the two, the one that took the
 * place of a wounded ally (the less hurt one, when the other is hurt) has armour to the end of the round. Fourth level: both regain Życie.
 */
export function battleTideSwap(state: GameState, targetId: string): void {
  const b = state.battle!;
  const u = b.units[b.activation!.unitId];
  if (!tideSwapReady(state, u)) throw new Error('Przypływ jest niedostępny.');
  const t = b.units[targetId];
  if (!t || !tideTargets(state, u).some((x) => x.id === t.id)) throw new Error(`Wybierz sojusznika w zasięgu ${FACTION_MECHANICS.tideRange} pól.`);
  swapCells(u, t);
  (b.tideSwaps ??= []).push({ side: u.side, round: b.round });
  log(state, 'ability', `${unitName(u)} i ${unitName(t)} zamieniają się miejscami (Przypływ).`);
  const level = tideLevel(state, u.side);
  if (level >= FACTION_MECHANICS.tideGuardLevel) {
    const share = (x: BattleUnit) => x.hp / x.maxHp;
    const [fresh, hurt] = share(u) >= share(t) ? [u, t] : [t, u];
    if (hurt.hp < hurt.maxHp && share(fresh) > share(hurt)) {
      fresh.status.oathRound = b.round;
      log(state, 'ability', `${unitName(fresh)} wchodzi na miejsce rannego: pancerz ${ABILITY.oathArmor * scaleOf(state)} do końca rundy (Świątynia Pływów).`);
    }
  }
  if (level >= FACTION_MECHANICS.tideHealLevel) {
    for (const x of [u, t]) {
      const healed = Math.min(FACTION_MECHANICS.tideHeal * hpScaleOf(state), x.maxHp - x.hp);
      if (healed <= 0) continue;
      x.hp += healed;
      (b.heals ??= []).push({ unitId: x.id, amount: healed });
      log(state, 'ability', `${unitName(x)} odzyskuje ${healed} Ż (Świątynia Pływów).`);
    }
  }
  stepOnFields(state, t);
  stepOnFields(state, u);
  if (!u.alive) endActivation(state);
}

/** Odpływ: the units the Morska Wiedźma may swap (single-cell, movable, not unseen, within her range; herself too). */
export function ebbTargets(state: GameState, u: BattleUnit): BattleUnit[] {
  const b = state.battle!;
  if (!u.pos) return [];
  return livingUnits(b).filter((x) => x.pos && !isLarge(state, x) && !(x.side !== u.side && x.status.veiled) && unitDistance(u, x) <= ABILITY.ebbRange && canBeMoved(state, x));
}

/** Odpływ without a second unit named: the partner of `first` is a unit of the other side (if any), the farthest from it. */
export function ebbPartner(state: GameState, u: BattleUnit, first: BattleUnit): BattleUnit | null {
  const all = ebbTargets(state, u).filter((x) => x.id !== first.id);
  const other = all.filter((x) => x.side !== first.side);
  return (other.length ? other : all).sort((x, y) => unitDistance(y, first) - unitDistance(x, first) || (x.id < y.id ? -1 : 1))[0] ?? null;
}

/** Wylinka: the bad states the Sefiran sheds with its skin. */
function shedStatuses(u: BattleUnit): number {
  const s = u.status;
  let n = 0;
  const drop = (cond: unknown, f: () => void) => {
    if (cond) {
      f();
      n++;
    }
  };
  drop(s.poisoned, () => delete s.poisoned);
  drop(s.slowNext > 0, () => (s.slowNext = 0));
  drop(s.slowLater, () => delete s.slowLater);
  drop(s.rootedNext, () => (s.rootedNext = false));
  drop(s.rootLater, () => delete s.rootLater);
  drop(s.cursedNext > 0, () => (s.cursedNext = 0));
  drop(s.tauntedBy, () => delete s.tauntedBy);
  drop(s.stunned, () => delete s.stunned);
  drop(s.frost, () => delete s.frost);
  drop(s.frostSlow, () => delete s.frostSlow);
  drop(s.brittle, () => delete s.brittle);
  drop(s.marked, () => delete s.marked);
  drop(s.riddled, () => delete s.riddled);
  drop(s.blindLater || s.blinded, () => {
    delete s.blindLater;
    delete s.blinded;
  });
  return n;
}

// ---------------------------------------------------------------- the Desert Empire: mirages, the buried Queen, the watch, the dormant guardian, moving its own

/** The level of the Pałac Mirażu (the Desert Empire's mechanic) a side has: 0 for any other faction or without the building. */
export const mirageLevel = (state: GameState, side: Side): number => (side !== 'neutral' && raceOf(state, side) === 'sands' ? mechLevel(state, side) : 0);

/** How many mirages a side puts up when a battle begins (none in a duel, none without abilities). */
export function mirageSlots(state: GameState, side: Side): number {
  if (side === 'neutral' || !abilityActive(state) || state.battle?.duel) return 0;
  const level = mirageLevel(state, side);
  return level ? FACTION_MECHANICS.mirageCount[Math.min(level, 4) - 1] : 0;
}

/** Whether the unit is a mirage (only the engine and its own side know it). */
export const isMirage = (u: BattleUnit): boolean => Boolean(u.status.mirage);

/** The living units of a side that are not mirages (the ones that count for the end of the battle). */
export const realUnits = (b: BattleState, side: Side): BattleUnit[] => livingUnits(b, side).filter((x) => !x.status.mirage);

/** The mirages of a unit on the field. */
export const miragesOf = (b: BattleState, realId: string): BattleUnit[] => Object.values(b.units).filter((x) => x.alive && x.status.mirage?.of === realId);

/** How much a unit is worth guarding with a mirage (the bots and the default choice): its Życie and Atak, shooters a bit more. */
const mirageWorth = (u: BattleUnit): number => u.maxHp + unitAttackBase(u) * 2 + (UNITS[u.defId].attackType === 'ranged' ? 2 : 0) + supportTier(u.defId);

/** Draws a new mix-up of the ids every body of the group of `realId` is shown under to the other sides (the Rng of the game: the same game replays the same). */
function realiasGroup(state: GameState, realId: string): void {
  const b = state.battle!;
  const bodies = [realId, ...miragesOf(b, realId).map((m) => m.id)].filter((id) => b.units[id]);
  const rng = new Rng(state.rng);
  const shown = rng.shuffle(bodies);
  state.rng = rng.state;
  b.mirageAlias ??= {};
  bodies.forEach((id, i) => (b.mirageAlias![id] = shown[i]));
}

/** A mirage of `real` standing with its head on `head` (and its tail on `tail`); null when it does not fit there. */
export function makeMirage(state: GameState, real: BattleUnit, head: HexKey, tail?: HexKey): BattleUnit | null {
  const b = state.battle!;
  let n = 1;
  while (b.units[`${real.id}~m${n}`]) n++;
  const id = `${real.id}~m${n}`;
  const copy: BattleUnit = { ...structuredClone(real), id, ability: 'decoy', pos: null, status: { ...structuredClone(real.status), mirage: { of: real.id } } };
  delete copy.tail;
  delete copy.facing;
  b.units[id] = copy;
  if (!placeUnit(state, copy, head, tail)) {
    delete b.units[id];
    return null;
  }
  realiasGroup(state, real.id);
  return copy;
}

/**
 * Pałac Mirażu: when a battle begins (before the sides deploy) every side with the palace gets its mirages: of its most valuable units that are not heroes, on free
 * cells of its start columns; a coin decides whether the mirage or the unit stands on the cell given to the copy (so the default places tell nothing either).
 */
export function setUpMirages(state: GameState): void {
  const b = state.battle!;
  for (const side of [b.attacker, b.defender]) {
    const slots = mirageSlots(state, side);
    if (!slots) continue;
    placeMirages(state, side, defaultMirageUnits(state, side).slice(0, slots));
  }
}

/** The units the mirages of a side copy by default (the bots keep them): its most valuable supports first. */
export function defaultMirageUnits(state: GameState, side: Side): BattleUnit[] {
  return mirageCandidates(state.battle!, side).sort((x, y) => mirageWorth(y) - mirageWorth(x) || (x.id < y.id ? -1 : 1));
}

/** The units of a side a mirage may copy: its living supports (not the heroes, not mirages). */
export const mirageCandidates = (b: BattleState, side: Side): BattleUnit[] => livingUnits(b, side).filter((x) => UNITS[x.defId].kind === 'support' && !x.status.mirage);

/** One mirage of each of `picks` on a free cell of the side's start columns; a coin decides whether the mirage or the unit stands on the cell given to the copy. */
function placeMirages(state: GameState, side: Side, picks: BattleUnit[]): void {
  const b = state.battle!;
  for (const real of picks) {
    const used = new Set(Object.values(b.units).filter((x) => x.alive).flatMap(cellsOf));
    const cell = deployCells(b, side).find((k) => !used.has(k) && (!isLarge(state, real) || deployHeads(b, side, k).some((h) => !used.has(h))));
    if (!cell) break;
    const head = isLarge(state, real) ? deployHeads(b, side, cell).find((h) => !used.has(h))! : cell;
    const m = makeMirage(state, real, head, isLarge(state, real) ? cell : undefined);
    if (!m) continue;
    const rng = new Rng(state.rng);
    if (rng.int(2) === 1) swapPlaces(m, real);
    state.rng = rng.state;
  }
}

/**
 * Pałac Mirażu: the player picks the units his mirages copy (in his deployment step, before the units are placed; the bots keep the default choice). The old
 * mirages go and new ones stand on free cells of the start columns, each a coin away from its unit, so the placement tells the opponent nothing.
 */
export function pickMirages(state: GameState, faction: TeamId, unitIds: string[]): void {
  const b = state.battle!;
  if (b.stage !== 'deploy' || b.needsDeploy[0] !== faction || b.rearrange) throw new Error('Miraże wybiera się przy ustawianiu wojsk.');
  const slots = mirageSlots(state, faction);
  if (!slots) throw new Error('Ta strona nie ma mirażów.');
  if (unitIds.length > slots) throw new Error(`Pałac Mirażu daje najwyżej ${slots} miraży.`);
  if (new Set(unitIds).size !== unitIds.length) throw new Error('Każda jednostka może mieć tylko jeden miraż.');
  const allowed = new Map(mirageCandidates(b, faction).map((u) => [u.id, u]));
  const picks = unitIds.map((id) => allowed.get(id));
  if (picks.some((u) => !u)) throw new Error('Miraż może skopiować tylko twojego pomocnika.');
  // Tried on a copy first: a pick that does not fit on the free start cells changes nothing.
  const trial = structuredClone(state);
  const tb = trial.battle!;
  for (const m of Object.values(tb.units))
    if (m.side === faction && m.status.mirage) {
      removeMirage(tb, m);
      if (tb.mirageAlias) delete tb.mirageAlias[m.status.mirage.of];
    }
  placeMirages(trial, faction, picks.map((u) => tb.units[u!.id]));
  const made = Object.values(tb.units).filter((m) => m.side === faction && m.status.mirage).length;
  if (made < picks.length) throw new Error(`Na polach startowych zmieści się tylko ${made} ${made === 1 ? 'miraż' : 'miraże'}.`);
  if (tb.mirageAlias && !Object.keys(tb.mirageAlias).length) delete tb.mirageAlias;
  state.battle = tb;
  state.rng = trial.rng;
}

const swapPlaces = (x: BattleUnit, y: BattleUnit): void => {
  const [pos, tail] = [x.pos, x.tail];
  x.pos = y.pos;
  if (y.tail) x.tail = y.tail;
  else delete x.tail;
  y.pos = pos;
  if (tail) y.tail = tail;
  else delete y.tail;
};

/**
 * A mirage is struck (any blow or damage): it vanishes and whatever hit it is wasted. With the fourth level of the palace the enemy unit that broke it is blinded
 * (−A at its attacks in its next activation). The mirage leaves the battle at once (nothing of it is counted after the battle).
 */
export function dispelMirage(state: GameState, m: BattleUnit, by: BattleUnit | null): void {
  const b = state.battle!;
  if (!b.units[m.id]) return;
  log(state, 'ability', `To był miraż! ${unitName(m)} rozwiewa się w powietrzu.`);
  if (by && by.alive && by.side !== m.side && mirageLevel(state, m.side) >= FACTION_MECHANICS.mirageBlindLevel) {
    by.status.blindLater = (by.status.blindLater ?? 0) + FACTION_MECHANICS.mirageBlind * scaleOf(state);
    log(state, 'ability', `${unitName(by)} jest oślepiony: −${FACTION_MECHANICS.mirageBlind * scaleOf(state)} A w następnej aktywacji (Pałac Mirażu).`);
  }
  removeMirage(b, m);
}

function removeMirage(b: BattleState, m: BattleUnit): void {
  m.alive = false;
  m.pos = null;
  delete m.tail;
  delete b.units[m.id];
  const at = b.order.indexOf(m.id);
  if (at >= 0) {
    b.order.splice(at, 1);
    if (at < b.index || (at === b.index && b.activation?.unitId === m.id)) b.index -= 1;
  }
  b.extra = b.extra.filter((e) => e.unitId !== m.id);
  if (b.mirageAlias) delete b.mirageAlias[m.id];
}

/** The unit has fallen: its mirages fade with it. */
function fadeMiragesOf(state: GameState, real: BattleUnit): void {
  const b = state.battle!;
  const gone = miragesOf(b, real.id);
  if (!gone.length) return;
  for (const m of gone) removeMirage(b, m);
  log(state, 'ability', `Miraże ${unitName(real)} rozwiewają się.`);
}

/** The battle is over: every mirage leaves it (they are never counted among the fallen or the survivors). */
function purgeMirages(b: BattleState): void {
  for (const m of Object.values(b.units)) if (m.status.mirage) removeMirage(b, m);
  delete b.mirageAlias;
}

/** Pałac Mirażu (third level): whether the active unit may swap places with a mirage of its own now. */
export function mirageSwapReady(state: GameState, u: BattleUnit): boolean {
  const b = state.battle!;
  return Boolean(b.activation?.unitId === u.id && !u.status.mirage && u.pos && mirageLevel(state, u.side) >= FACTION_MECHANICS.mirageSwapLevel && !(b.mirageSwapped ?? []).includes(u.side) && miragesOf(b, u.id).some((m) => m.pos));
}

/** The swap itself: the unit and its mirage exchange their cells (the enemy sees two alike figures change places). */
export function battleMirageSwap(state: GameState, mirageId?: string): void {
  const b = state.battle!;
  const u = b.units[b.activation!.unitId];
  if (!mirageSwapReady(state, u)) throw new Error('Zamiana z mirażem jest niedostępna.');
  const m = miragesOf(b, u.id).find((x) => !mirageId || x.id === mirageId);
  if (!m || !m.pos) throw new Error('Ta jednostka nie ma takiego mirażu.');
  swapPlaces(u, m);
  (b.mirageSwapped ??= []).push(u.side);
  log(state, 'ability', `${unitName(u)} zamienia się miejscami ze swoim mirażem (Pałac Mirażu).`, u.side as TeamId);
  stepOnFields(state, u);
  if (!u.alive) endActivation(state);
}

/** Within each mirage group the bodies take their turns in a fresh order every round (the order of the units would otherwise give the real one away). */
function shuffleMirageTurns(state: GameState): void {
  const b = state.battle!;
  if (!b.mirageAlias) return;
  const rng = new Rng(state.rng);
  const groups = new Map<string, number[]>();
  b.order.forEach((id, i) => {
    const u = b.units[id];
    if (!u || !(id in b.mirageAlias!)) return;
    const g = u.status.mirage?.of ?? id;
    groups.set(g, [...(groups.get(g) ?? []), i]);
  });
  for (const slots of groups.values()) {
    if (slots.length < 2) continue;
    const ids = rng.shuffle(slots.map((i) => b.order[i]));
    slots.forEach((i, j) => (b.order[i] = ids[j]));
  }
  state.rng = rng.state;
}

/** Zasadzka Spod Piasku: the cells of its own half of the arena where the Queen may lie buried (not the middle column, no obstacles). */
export function ambushCells(b: BattleState, side: Side): HexKey[] {
  const last = (b.layout === 'wide' ? WIDE_COLUMNS : ARENA_COLUMNS) - 1;
  const middle = last / 2;
  const attacking = side === b.attacker;
  return layoutCells(b).filter((k) => !b.obstacles.includes(k) && (attacking ? columnOf(b, k) < middle : columnOf(b, k) > middle));
}

/** Whether the unit may be deployed anywhere on its half (the buried Queen of Scorpions). */
export const buriesAtDeploy = (state: GameState, u: BattleUnit): boolean => abilityOf(u) === 'sandAmbush' && abilityActive(state) && !state.battle?.duel && !isLarge(state, u);

/**
 * Czujność, Czujna Drzemka, Przebudzenie: an enemy has just stepped up next to units of the other side (`before`: the units it stood next to before the move).
 * A watching Jackal (once a round) and the lying Bastia (once a lie-down) strike it at once; a dormant stone guardian wakes up.
 */
function steppedUp(state: GameState, mover: BattleUnit, before: Set<string>): void {
  const b = state.battle!;
  if (!abilityActive(state) || b.duel || !mover.alive || !mover.pos) return;
  for (const w of livingUnits(b)) {
    if (!mover.alive) return;
    if (w.side === mover.side || w.status.mirage || before.has(w.id) || !unitsAdjacent(w, mover)) continue;
    const ab = abilityOf(w);
    if (w.status.dormant) wake(state, w);
    const jackal = ab === 'jackalWatch' && w.status.watchRound !== b.round;
    const nap = ab === 'napWatch' && Boolean(w.status.dugIn) && !w.status.napStruck;
    if (!jackal && !nap) continue;
    if (jackal) w.status.watchRound = b.round;
    if (nap) w.status.napStruck = true;
    log(state, 'ability', `${unitName(w)} czuwa: cios w ${unitName(mover)} (${UNITS[w.defId].abilityName}).`);
    dealDamage(state, mover, ABILITY.watchDamage * scaleOf(state), unitName(w));
  }
}

/** The units of the other sides the unit stands next to now (taken before a move, for `steppedUp`). */
const neighboursOf = (b: BattleState, u: BattleUnit): Set<string> => new Set(livingUnits(b).filter((x) => x.side !== u.side && unitsAdjacent(x, u)).map((x) => x.id));

/** Przebudzenie: the stone guardian wakes for the rest of the battle with more Atak. */
function wake(state: GameState, u: BattleUnit): void {
  if (!u.status.dormant) return;
  delete u.status.dormant;
  u.status.battleAttackBonus += ABILITY.awakeningBonus * scaleOf(state);
  log(state, 'ability', `${unitName(u)} budzi się: +${ABILITY.awakeningBonus * scaleOf(state)} A do końca bitwy (${UNITS[u.defId].abilityName}).`);
}

/** Rzut Sztyletem: the enemies the unit may throw its dagger at from `from`: in sight and not next to it (a neighbour is struck in melee). */
export function throwTargets(state: GameState, u: BattleUnit, from: HexKey | null = u.pos): BattleUnit[] {
  const b = state.battle!;
  if (!from || abilityOf(u) !== 'daggerThrow' || u.abilityUsed || !abilityActive(state) || u.status.riddled || u.status.mirage) return [];
  const mine = footprintAt(state, u, from);
  const challenger = taunter(state, u);
  return enemiesOf(b, u).filter((e) => !headCovered(state, e) && (!challenger || e.id === challenger.id) && !cellsOf(e).some((c) => mine.some((m) => adjacent(m, c))) && cellsOf(e).some((c) => hasLineOfSight(state, from, c)));
}

/** Piaskowa Brama: the free cells within the Wezyr's radius an ally may be put down on. */
export function portalCells(state: GameState, u: BattleUnit, ally: BattleUnit): HexKey[] {
  const b = state.battle!;
  if (!u.pos || b.duel) return [];
  const obstacles = obstacleSet(b);
  const units = occupancy(b, ally);
  return layoutCells(b).filter((k) => k !== ally.pos && !obstacles.has(k) && !units.has(k) && distance(parseKey(u.pos!), parseKey(k)) <= ABILITY.gateRadius && fitsAt(state, ally, k));
}

/** Lustro Wydm: the free cells near the Dancer where a mirage may appear. */
export function mirageMakeCells(state: GameState, u: BattleUnit, ally: BattleUnit): HexKey[] {
  const b = state.battle!;
  if (!u.pos || b.duel) return [];
  const obstacles = obstacleSet(b);
  const units = occupancy(b);
  return layoutCells(b).filter((k) => !obstacles.has(k) && !units.has(k) && distance(parseKey(u.pos!), parseKey(k)) <= ABILITY.mirageReach && fitsAt(state, ally, k));
}

/** The allies a free ability of the Desert Empire may be used on: Piaskowa Brama (any but the Wezyr), Lustro Wydm (no heroes), Lot ze Skrzydłem (a small neighbour). */
export function sandsAllyTargets(state: GameState, u: BattleUnit): BattleUnit[] {
  const b = state.battle!;
  const ab = abilityOf(u);
  const own = livingUnits(b, u.side).filter((x) => x.id !== u.id && !x.status.mirage);
  if (ab === 'sandPortal') return own.filter((x) => portalCells(state, u, x).length);
  if (ab === 'mirageMake') return own.filter((x) => UNITS[x.defId].kind === 'support' && mirageMakeCells(state, u, x).length);
  if (ab === 'rocLift') return own.filter((x) => !isLarge(state, x) && unitsAdjacent(x, u) && !b.activation?.moved);
  return [];
}

/** Lot ze Skrzydłem: the Rok has landed; its passenger lands on the free cell next to it nearest to where it was carried from. */
function landPassenger(state: GameState, u: BattleUnit): void {
  const b = state.battle!;
  const act = b.activation!;
  const p = act.lift ? b.units[act.lift] : undefined;
  delete act.lift;
  if (!p || !p.alive || !p.pos || !u.pos) return;
  const from = parseKey(p.pos);
  const spots = [...new Set(cellsOf(u).flatMap(neighborKeys))].filter((k) => inLayout(b, k) && !obstacleSet(b).has(k) && !unitAt(b, k)).sort((x, y) => distance(from, parseKey(x)) - distance(from, parseKey(y)) || (x < y ? -1 : 1));
  if (!spots.length) return log(state, 'ability', `${unitName(p)} nie ma gdzie wylądować i zostaje na miejscu.`);
  const before = neighboursOf(b, p);
  p.pos = spots[0];
  log(state, 'ability', `${unitName(p)} ląduje obok ${unitName(u)} (${UNITS[u.defId].abilityName}).`);
  stepOnFields(state, p);
  steppedUp(state, p, before);
}

/** Spod Piasku: the Czerw comes up and pushes the enemies next to it one cell away. */
function wyrmRises(state: GameState, u: BattleUnit): void {
  const b = state.battle!;
  for (const x of livingUnits(b).filter((e) => e.side !== u.side && unitsAdjacent(e, u))) {
    if (!canBeMoved(state, x)) continue;
    const out = pushAway(state, x, u, 1);
    if (out.moved) {
      log(state, 'ability', `${unitName(x)} zostaje odepchnięty o 1 pole (${UNITS[u.defId].abilityName}).`);
      stepOnFields(state, x);
    }
  }
}

/** Iskra of the Desert Empire: after both sides have deployed, the side may move up to this many of its units within its zone (once a battle). */
const rearrangeDue = (state: GameState): TeamId | null => {
  const b = state.battle!;
  if (b.duel) return null;
  for (const side of [b.attacker, b.defender]) if (side !== 'neutral' && raceOf(state, side) === 'sands' && hasSpark(state, side) && !(b.rearranged ?? []).includes(side)) return side;
  return null;
};

/**
 * Fortyfikacja: the two cells next to each other where the Kolos puts up its wall: free cells within 2 of it, the pair closest to the nearest enemy first (null: no room).
 * The wall never shuts a unit in (only free cells are used), and it lasts to the end of the battle.
 */
export function fortifyCells(state: GameState, u: BattleUnit): [HexKey, HexKey] | null {
  const b = state.battle!;
  if (b.duel || !u.pos) return null;
  const mine = cellsOf(u);
  const foes = enemiesOf(b, u).flatMap(cellsOf);
  const gap = (k: HexKey) => Math.min(...foes.map((f) => distance(parseKey(f), parseKey(k))), 99);
  const obstacles = obstacleSet(b);
  const open = layoutCells(b).filter((k) => !obstacles.has(k) && !unitAt(b, k) && mine.some((m) => distance(parseKey(m), parseKey(k)) <= ABILITY.fortifyCells)).sort((x, y) => gap(x) - gap(y) || (x < y ? -1 : 1));
  for (const c of open) {
    const mate = open.find((o) => o !== c && adjacent(o, c));
    if (mate) return [c, mate];
  }
  return null;
}

/**
 * Lodowa Ściana: the three cells in a line (one of the three axes) where Marzanna raises her wall: free cells within reach of her, the wall closest to the
 * nearest enemy first and, of those, the one that lies most across the line to that enemy (null: no room, or nobody to wall off).
 */
export function iceWallCells(state: GameState, u: BattleUnit): HexKey[] | null {
  const b = state.battle!;
  if (b.duel || !u.pos) return null;
  const mine = cellsOf(u);
  const foes = enemiesOf(b, u).flatMap(cellsOf);
  if (!foes.length) return null;
  const obstacles = obstacleSet(b);
  const open = (k: HexKey) => inLayout(b, k) && !obstacles.has(k) && !unitAt(b, k);
  let best: { cells: HexKey[]; gap: number; across: number } | null = null;
  for (const c of layoutCells(b)) {
    if (!open(c) || !mine.some((m) => distance(parseKey(m), parseKey(c)) <= ABILITY.iceWallReach)) continue;
    const h = parseKey(c);
    const near = foes.reduce((a, f) => (distance(parseKey(f), h) < distance(parseKey(a), h) ? f : a));
    const gap = distance(parseKey(near), h);
    const toFoe = cartesian({ q: parseKey(near).q - h.q, r: parseKey(near).r - h.r });
    for (const d of DIRECTIONS.slice(0, 3)) {
      const a = key({ q: h.q - d.q, r: h.r - d.r });
      const z = key({ q: h.q + d.q, r: h.r + d.r });
      if (!open(a) || !open(z)) continue;
      const along = cartesian(d);
      const across = Math.abs(toFoe.x * along.x + toFoe.y * along.y) / (Math.hypot(toFoe.x, toFoe.y) * Math.hypot(along.x, along.y) || 1);
      const cells = [a, c, z].sort();
      if (!best || gap < best.gap || (gap === best.gap && (across < best.across - 1e-9 || (Math.abs(across - best.across) <= 1e-9 && cells.join() < best.cells.join())))) best = { cells, gap, across };
    }
  }
  return best ? best.cells : null;
}

export function battleAbility(state: GameState, targetId?: string, cell?: HexKey, from?: HexKey) {
  const b = state.battle!;
  const u = b.units[b.activation!.unitId];
  const ab = abilityOf(u);
  if (u.abilityUsed || !abilityActive(state) || !FREE_ABILITIES.includes(ab)) throw new Error('Zdolność jest niedostępna.');
  if (ab === 'sunburst') {
    for (const ally of livingUnits(b, u.side)) ally.status.nextAttackBonus += ally.id === u.id ? abilityNum(u, 'sunburstSelfBonus') * scaleOf(state) : abilityNum(u, 'sunburstBonus') * scaleOf(state);
  } else if (ab === 'giftOfLife') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side !== u.side) throw new Error('Wybierz żyjącego sojusznika.');
    t.hp = Math.min(t.maxHp, t.hp + ABILITY.giftOfLifeHeal * hpScaleOf(state));
  } else if (ab === 'rhythm') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side !== u.side || t.id === u.id) throw new Error('Wybierz żyjącego sojusznika.');
    t.status.slowNext -= ABILITY.rhythmHaste;
    log(state, 'ability', `${unitName(t)}: +${ABILITY.rhythmHaste} S w następnej aktywacji.`);
  } else if (ab === 'wanderHorn') {
    for (const ally of livingUnits(b, u.side)) {
      ally.status.slowNext -= ABILITY.hornHaste;
      log(state, 'ability', `${unitName(ally)}: +${ABILITY.hornHaste} S w następnej aktywacji.`);
    }
  } else if (ab === 'roar') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side === u.side || t.side === undefined || unitDistance(u, t) > ABILITY.roarRange) throw new Error(`Wybierz wroga w zasięgu ${ABILITY.roarRange} pól.`);
    t.status.tauntedBy = u.id;
    log(state, 'ability', `${unitName(t)} jest wyzwany: w swojej następnej aktywacji może atakować tylko ${unitName(u)}.`);
  } else if (ab === 'tremor') {
    const shaken = Object.values(b.units).filter((x) => x.alive && x.pos && x.side !== u.side && canBeMoved(state, x) && unitDistance(u, x) <= ABILITY.tremorRadius);
    log(state, 'ability', `${unitName(u)}: ziemia drży.`);
    for (const x of shaken) if (x.alive) herdsPush(state, u, x, 1, ABILITY.collisionDamage, UNITS[u.defId].abilityName);
    checkBattleEnd(state);
  } else if (ab === 'barrowCall' || ab === 'breathAgain') {
    // Wezwanie z Kurhanu / Ponowny Oddech: the strongest fallen support (for the Wróżka: of tier 3 or lower) stands up next to the caller with half its Życie.
    const rising = fallenSupports(state, u.side, ab === 'breathAgain' ? ABILITY.breathAgainTier : 6)[0];
    if (!rising) throw new Error('Nie ma poległego pomocnika, którego można podnieść.');
    if (!raiseUnit(state, rising, u.pos, Math.ceil(rising.maxHp / 2), UNITS[u.defId].abilityName)) throw new Error('Brak wolnego pola.');
  } else if (ab === 'wail') {
    for (const x of enemiesOf(b, u).filter((e) => unitDistance(e, u) <= ABILITY.wailRadius)) {
      if (resistsStatus(state, x, false)) log(state, 'ability', `${unitName(x)} jest odporny na klątwę.`);
      else {
        x.status.cursedNext += ABILITY.wailMinus * scaleOf(state);
        log(state, 'ability', `${unitName(x)}: −${ABILITY.wailMinus * scaleOf(state)} A przy następnym ataku.`);
      }
    }
  } else if (ab === 'toll') {
    for (const x of enemiesOf(b, u).filter((e) => unitsAdjacent(e, u))) {
      if (resistsStatus(state, x, true)) log(state, 'ability', `${unitName(x)} jest odporny na spowolnienie.`);
      else {
        x.status.slowNext += ABILITY.tollSlow;
        log(state, 'ability', `${unitName(x)}: −${ABILITY.tollSlow} S w następnej aktywacji.`);
      }
    }
  } else if (ab === 'viyGaze') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side === u.side || !t.pos || unitDistance(u, t) > ABILITY.gazeRange) throw new Error(`Wybierz wroga w zasięgu ${ABILITY.gazeRange} pól.`);
    if (resistsStatus(state, t, true)) log(state, 'ability', `${unitName(t)} jest odporny na unieruchomienie.`);
    else {
      t.status.rootedNext = true;
      log(state, 'ability', `${unitName(t)} zostaje unieruchomiony do swojej następnej aktywacji.`);
    }
  } else if (ab === 'shieldOath') {
    const near = livingUnits(b, u.side).filter((x) => x.id !== u.id && unitsAdjacent(u, x));
    for (const x of near) x.status.oathRound = b.round;
    log(state, 'ability', `${unitName(u)}: ${UNITS[u.defId].abilityName} (osłoniętych: ${near.length}).`);
  } else if (ab === 'stoneRune') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side !== u.side || t.id === u.id) throw new Error('Wybierz żyjącego sojusznika.');
    t.status.damageReduction += ABILITY.runeStoneArmor * scaleOf(state);
    t.status.unmovable = true;
    log(state, 'ability', `${unitName(t)} dostaje runę kamienia: pancerz ${ABILITY.runeStoneArmor * scaleOf(state)} i nie da się go odepchnąć.`);
  } else if (ab === 'temper') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side !== u.side || t.id === u.id || !unitsAdjacent(u, t)) throw new Error('Wybierz sąsiedniego sojusznika.');
    t.status.battleAttackBonus += ABILITY.temperBonus * scaleOf(state);
    log(state, 'ability', `${unitName(t)} ma +${ABILITY.temperBonus * scaleOf(state)} A do końca bitwy (${UNITS[u.defId].abilityName}).`);
  } else if (ab === 'misleadLight') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side === u.side || !t.pos || unitDistance(u, t) > ABILITY.misleadRange) throw new Error(`Wybierz wroga w zasięgu ${ABILITY.misleadRange} pól.`);
    if (!canBeMoved(state, t)) log(state, 'ability', `${unitName(t)} nie da się przestawić.`);
    else {
      const out = pushAway(state, t, u, ABILITY.misleadSteps);
      log(state, 'ability', `${unitName(t)} błądzi za światłem i ląduje ${out.moved} ${out.moved === 1 ? 'pole' : 'pola'} dalej (${UNITS[u.defId].abilityName}).`);
      if (out.moved > 0) stepOnFields(state, t);
    }
  } else if (ab === 'fortify') {
    const cells = fortifyCells(state, u);
    if (!cells) throw new Error('Brak miejsca na mur.');
    b.obstacles = [...b.obstacles, ...cells];
    b.raised = [...(b.raised ?? []), ...cells];
    log(state, 'ability', `${unitName(u)} stawia mur (${UNITS[u.defId].abilityName}).`);
  } else if (ab === 'iceWall') {
    const cells = iceWallCells(state, u);
    if (!cells) throw new Error('Brak miejsca na lodową ścianę.');
    b.obstacles = [...b.obstacles, ...cells];
    b.raised = [...(b.raised ?? []), ...cells];
    b.ice = [...(b.ice ?? []), ...cells.map((cell) => ({ cell, until: b.round + ABILITY.iceWallRounds - 1 }))];
    log(state, 'ability', `${unitName(u)} wznosi ścianę z lodu (${UNITS[u.defId].abilityName}).`);
  } else if (ab === 'bellOfGlass') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side === u.side || !t.pos || unitDistance(u, t) > ABILITY.bellRange) throw new Error(`Wybierz wroga w zasięgu ${ABILITY.bellRange} pól.`);
    if (!(t.status.frost ?? 0)) throw new Error('Wybierz wroga, który ma szron.');
    freezeUnit(state, u.side, t);
  } else if (ab === 'beardChill') {
    // Uścisk Mrozu: the icy beard touches an enemy close by (no flight): 2 frosts, and at the threshold it freezes.
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side === u.side || !t.pos || unitDistance(u, t) > ABILITY.beardRange) throw new Error(`Wybierz wroga w zasięgu ${ABILITY.beardRange} pól.`);
    log(state, 'ability', `${unitName(u)} dotyka lodową brodą: ${unitName(t)} (${UNITS[u.defId].abilityName}).`);
    applyFrost(state, u.side, t, ABILITY.beardFrost);
  } else if (ab === 'longNight') {
    log(state, 'ability', `${unitName(u)}: zapada długa noc.`);
    for (const e of enemiesOf(b, u)) applyFrost(state, u.side, e);
  } else if (ab === 'ploy') {
    // Fortel: one more hidden trap, or one of the own traps moved (the place is chosen by the player, or the best one is taken).
    const to = cell ?? autoTrapCells(state, u.side, 1)[0];
    if (!to || !mayLayTrap(b, u.side, to)) throw new Error('Pułapkę można położyć tylko na wolnym polu swojej połowy areny.');
    if (from) {
      const own = trapsOf(b, u.side).find((g) => g.cell === from);
      if (!own) throw new Error('Nie masz pułapki na tym polu.');
      own.cell = to;
    } else layTrap(state, u.side, to);
  } else if (ab === 'dugIn') {
    u.status.dugIn = ABILITY.dugInActivations;
  } else if (ab === 'ravenEye') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side === u.side || !t.pos || t.status.veiled || unitDistance(u, t) > ABILITY.ravenRange) throw new Error(`Wybierz wroga w zasięgu ${ABILITY.ravenRange} pól.`);
    ravenEye(state, u, t);
  } else if (ab === 'dam') {
    const to = cell ?? damCell(state, u);
    if (!to || !u.pos || ![...cellsOf(u)].some((c) => adjacent(c, to)) || !inLayout(b, to) || obstacleSet(b).has(to) || unitAt(b, to)) throw new Error('Tamę można postawić na wolnym polu obok bobra.');
    b.obstacles = [...b.obstacles, to];
    b.raised = [...(b.raised ?? []), to];
  } else if (ab === 'blast') {
    const at = cell ?? bestBlastTrap(state, u);
    const trap = at ? trapsOf(b, u.side).find((g) => g.cell === at) : undefined;
    if (!at || !trap) throw new Error('Wybierz własną pułapkę, którą wysadzisz.');
    b.ground = (b.ground ?? []).filter((g) => g !== trap);
    log(state, 'ability', `${unitName(u)} odpala ładunek: wybuch!`);
    const area = [at, ...neighborKeys(at)];
    for (const x of Object.values(b.units)) if (x.alive && x.pos && cellsOf(x).some((c) => area.includes(c))) dealDamage(state, x, ABILITY.blastDamage * scaleOf(state), 'Wybuch');
  } else if (ab === 'sandPortal') {
    // Piaskowa Brama: an ally goes to a free cell within the Wezyr's radius (the player's cell, or the one farthest from the enemy).
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side !== u.side || t.id === u.id || !t.pos) throw new Error('Wybierz sojusznika.');
    const cells = portalCells(state, u, t);
    const foes = enemiesOf(b, u).flatMap(cellsOf);
    const gap = (k: HexKey) => Math.min(99, ...foes.map((f) => distance(parseKey(f), parseKey(k))));
    const to = cell ?? cells.slice().sort((x, y) => gap(y) - gap(x) || (x < y ? -1 : 1))[0];
    if (!to || !cells.includes(to)) throw new Error(`Wybierz wolne pole w promieniu ${ABILITY.gateRadius} od Wezyra.`);
    const fromCell = t.pos;
    const before = neighboursOf(b, t);
    placeUnit(state, t, to);
    (b.teleports ??= []).push({ unitId: t.id, from: fromCell, to, kind: 'scroll' });
    log(state, 'ability', `${unitName(t)} przechodzi przez Piaskową Bramę.`);
    stepOnFields(state, t);
    steppedUp(state, t, before);
  } else if (ab === 'riddle') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side === u.side || !t.pos || t.status.veiled || unitDistance(u, t) > ABILITY.riddleRange) throw new Error(`Wybierz wroga w zasięgu ${ABILITY.riddleRange} pól.`);
    // A mirage takes the riddle as a unit would (it never attacks anyway): nothing tells the Sfinks it was one.
    t.status.riddled = true;
    log(state, 'ability', `${unitName(t)} głowi się nad zagadką i nie zaatakuje w swojej następnej aktywacji.`);
  } else if (ab === 'napWatch') {
    // Czujna Drzemka: instead of her move Bastia lies down (armour, cannot be pushed, a blow at the first enemy that steps up).
    if (b.activation!.moved) throw new Error('Bastia już się ruszyła.');
    u.status.dugIn = ABILITY.dugInActivations;
    delete u.status.napStruck;
    b.activation!.moved = true;
    log(state, 'ability', `${unitName(u)} kładzie się i czuwa.`);
  } else if (ab === 'mirageMake') {
    // Lustro Wydm: a mirage of an ally on a free cell near the Dancer; a coin decides whether the ally itself goes there and leaves the mirage behind.
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side !== u.side || t.status.mirage || UNITS[t.defId].kind !== 'support' || !t.pos) throw new Error('Wybierz sojusznika (nie bohatera).');
    const cells = mirageMakeCells(state, u, t);
    const to = cell ?? cells.slice().sort((x, y) => distance(parseKey(x), parseKey(t.pos!)) - distance(parseKey(y), parseKey(t.pos!)) || (x < y ? -1 : 1))[0];
    if (!to || !cells.includes(to)) throw new Error(`Wybierz wolne pole w promieniu ${ABILITY.mirageReach} od Tancerki.`);
    const m = makeMirage(state, t, to);
    if (!m) throw new Error('Miraż się tu nie zmieści.');
    const rng = new Rng(state.rng);
    if (!isLarge(state, t) && rng.int(2) === 1) swapPlaces(m, t);
    state.rng = rng.state;
    log(state, 'ability', `${unitName(u)} tańczy: obok pojawia się drugi ${unitName(t)} (jeden z nich to miraż).`);
  } else if (ab === 'rocLift') {
    const t = targetId ? b.units[targetId] : undefined;
    if (b.activation!.moved) throw new Error('Rok już się ruszył.');
    if (!t || !t.alive || t.side !== u.side || isLarge(state, t) || !unitsAdjacent(t, u)) throw new Error('Wybierz małego sojusznika obok Roka.');
    b.activation!.lift = t.id;
    log(state, 'ability', `${unitName(u)} bierze ${unitName(t)} na skrzydło.`);
  } else if (ab === 'spreadSpores') {
    // Rozsiew: mycelium on the cell the player picks (or the best one) and its neighbours.
    const at = cell ?? bestSporeCell(state, u);
    if (!at || !sporeCells(state, u).includes(at)) throw new Error(`Wybierz pole w zasięgu ${ABILITY.sporeRange} od Matki Grzybni.`);
    const n = claimCells(state, u.side, sporeArea(state, u, at));
    log(state, 'ability', `${unitName(u)} rozsiewa zarodniki: grzybnia porasta ${n} ${n === 1 ? 'pole' : 'pola'}.`);
  } else if (ab === 'greatChorus') {
    // Wielki Chór: every enemy within the radius loses its next activation.
    const deaf = enemiesOf(b, u).filter((e) => e.pos && unitDistance(e, u) <= ABILITY.chorusRadius);
    log(state, 'ability', `${unitName(u)} śpiewa Wielki Chór.`);
    for (const e of deaf) {
      e.status.stunned = true;
      log(state, 'ability', `${unitName(e)} traci następną aktywację (${UNITS[u.defId].abilityName}).`);
    }
  } else if (ab === 'waterWall' || ab === 'wingBeat') {
    // Ściana Wody, Uderzenie Skrzydeł: every adjacent enemy is pushed 1 away (no collision); the Król's wall also shields the allies next to him to the end of the round.
    log(state, 'ability', `${unitName(u)}: ${UNITS[u.defId].abilityName}.`);
    for (const e of enemiesOf(b, u).filter((x) => x.pos && unitsAdjacent(x, u))) if (e.alive) pushWithCollision(state, e, u, 1, 0, UNITS[u.defId].abilityName);
    if (ab === 'waterWall') {
      const near = livingUnits(b, u.side).filter((x) => x.id !== u.id && x.pos && unitsAdjacent(x, u));
      for (const x of near) x.status.oathRound = b.round;
      if (near.length) log(state, 'ability', `Sąsiedni sojusznicy (${near.length}) mają pancerz ${ABILITY.oathArmor * scaleOf(state)} do końca rundy.`);
    }
  } else if (ab === 'sirenSong' || ab === 'deepCoil') {
    // Pieśń Syreny: an enemy in range is pulled towards the Syrena. Oplot Głębin: an enemy close by is pulled 1 and held in place.
    const range = ab === 'sirenSong' ? ABILITY.songRange : ABILITY.deepCoilRange;
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side === u.side || !t.pos || t.status.veiled || unitDistance(u, t) > range) throw new Error(`Wybierz wroga w zasięgu ${range} pól.`);
    tidePull(state, t, u, ab === 'sirenSong' ? ABILITY.songPull : 1, UNITS[u.defId].abilityName);
    if (ab === 'deepCoil' && t.alive) {
      if (resistsStatus(state, t, true)) log(state, 'ability', `${unitName(t)} jest odporny na unieruchomienie.`);
      else {
        t.status.rootedNext = true;
        log(state, 'ability', `${unitName(t)} zostaje oplątany i nie ruszy się w swojej następnej aktywacji (${UNITS[u.defId].abilityName}).`);
      }
    }
  } else if (ab === 'molt') {
    // Wylinka: the Sefiran sheds every bad state with its skin and regains Życie.
    const shed = shedStatuses(u);
    const healed = Math.min(ABILITY.moltHeal * hpScaleOf(state), u.maxHp - u.hp);
    u.hp += healed;
    if (healed > 0) (b.heals ??= []).push({ unitId: u.id, amount: healed });
    log(state, 'ability', `${unitName(u)} zrzuca skórę: ${shed ? `znika ${shed} ${shed === 1 ? 'zły stan' : 'złych stanów'}` : 'żadnych złych stanów'}, +${healed} Ż.`);
  } else if (ab === 'shellUp') {
    // Skorupa: the turtle hides; it takes no damage until its next activation and ends this one (below).
    u.status.shelled = true;
    log(state, 'ability', `${unitName(u)} chowa się w skorupie do swojej następnej aktywacji.`);
  } else if (ab === 'pearlShield') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side !== u.side || !t.pos || t.status.mirage) throw new Error('Wybierz sojusznika.');
    t.status.pearl = (t.status.pearl ?? 0) + ABILITY.pearlShield * scaleOf(state);
    log(state, 'ability', `${unitName(t)} dostaje perłową tarczę: pochłonie ${t.status.pearl} obrażeń z ciosów.`);
  } else if (ab === 'ebbTide') {
    // Odpływ: two units in the Wiedźma's range (of any side) trade their cells; the second one is named by its cell.
    const first = targetId ? b.units[targetId] : undefined;
    const pool = ebbTargets(state, u);
    if (!first || !pool.some((x) => x.id === first.id)) throw new Error(`Wybierz jednopolową jednostkę w zasięgu ${ABILITY.ebbRange} pól.`);
    const second = cell ? pool.find((x) => x.id !== first.id && x.pos === cell) : ebbPartner(state, u, first);
    if (!second) throw new Error(`Wskaż drugą jednopolową jednostkę w zasięgu ${ABILITY.ebbRange} pól.`);
    swapCells(first, second);
    log(state, 'ability', `${unitName(u)} wzywa odpływ: ${unitName(first)} i ${unitName(second)} zamieniają się miejscami.`);
    stepOnFields(state, first);
    stepOnFields(state, second);
  } else if (ab === 'deepWhirl') {
    // Wir Głębin: every enemy within the radius is pulled towards the Lewiatan, the nearest first.
    const caught = enemiesOf(b, u).filter((e) => e.pos && unitDistance(e, u) <= ABILITY.deepWhirlRadius).sort((x, y) => unitDistance(x, u) - unitDistance(y, u) || (x.id < y.id ? -1 : 1));
    log(state, 'ability', `${unitName(u)} wzbudza Wir Głębin.`);
    for (const e of caught) tidePull(state, e, u, ABILITY.deepWhirlPull, UNITS[u.defId].abilityName);
  } else if (ab === 'web') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side === u.side || unitDistance(u, t) > ABILITY.webRange) throw new Error(`Wybierz wroga w zasięgu ${ABILITY.webRange} pól.`);
    if (resistsStatus(state, t, true)) log(state, 'ability', `${unitName(t)} jest odporny na sidła.`);
    else {
      t.status.rootedNext = true;
      log(state, 'ability', `${unitName(t)} zostaje unieruchomiony do swojej następnej aktywacji.`);
    }
  }
  u.abilityUsed = true;
  log(state, 'ability', `${unitName(u)} używa zdolności: ${UNITS[u.defId].abilityName}.`);
  // Skorupa ends the turtle's activation; a unit that fell on a trap of the enemy by the Wiedźma's swap loses the rest of its turn.
  if ((ab === 'shellUp' || !u.alive) && b.activation?.unitId === u.id) endActivation(state);
}

// ---------------------------------------------------------------- items

export function canUseBattleItem(state: GameState, faction: TeamId): boolean {
  const b = state.battle;
  if (!b || b.stage !== 'fight' || !b.activation) return false;
  const u = b.units[b.activation.unitId];
  return u.side === faction && !b.activation.acted;
}

export function freeCellNear(state: GameState, side: Side, u?: BattleUnit): HexKey | null {
  const b = state.battle!;
  if (b.duel) {
    const spot = duelSpot(b, side);
    return unitAt(b, spot) ? null : spot;
  }
  return deployCells(b, side).find((k) => !unitAt(b, k) && (!u || fitsAt(state, u, k))) ?? null;
}

/** The free arena cell closest to `from` (ties: arena order), for a unit that stands up where something else stands. */
export function nearestFreeCell(state: GameState, u: BattleUnit, from: HexKey): HexKey | null {
  const b = state.battle!;
  const o = parseKey(from);
  let best: HexKey | null = null;
  let bestD = Infinity;
  for (const k of layoutCells(b)) {
    if (b.obstacles.includes(k) || unitAt(b, k) || !fitsAt(state, u, k)) continue;
    const d = distance(o, parseKey(k));
    if (d < bestD) (best = k), (bestD = d);
  }
  return best;
}

/** What a player chose when using a treasure in battle (the battleItem action without its type). */
export interface ItemArgs {
  itemId: string;
  targetId?: string;
  targetIds?: string[];
  to?: HexKey;
  hornMode?: 'swap' | 'extra';
  reserveId?: string;
}

/** A treasure being used: the game, the battle, the user's side, the choices and the treasure's name (for the log). */
interface ItemUse {
  state: GameState;
  b: BattleState;
  faction: TeamId;
  args: ItemArgs;
  name: string;
}

/** A unit of the user's side (living or fallen). */
function ownUnit(use: ItemUse, id?: string): BattleUnit {
  const t = id ? use.b.units[id] : undefined;
  if (!t || t.side !== use.faction) throw new Error('Wybierz własną jednostkę.');
  return t;
}

/** A living enemy unit. */
function enemyUnit(use: ItemUse, id?: string): BattleUnit {
  const t = id ? use.b.units[id] : undefined;
  if (!t || !t.alive || t.side === use.faction) throw new Error('Wybierz żyjącego wroga.');
  return t;
}

function living(t: BattleUnit): BattleUnit {
  if (!t.alive) throw new Error('Ta jednostka nie żyje.');
  return t;
}

/** A living unit of the user's side: the target of most treasures. */
const ownLiving = (use: ItemUse, id?: string) => living(ownUnit(use, id));

/** What each treasure does in battle; each checks its own targets and throws when they do not fit. */
const ITEM_HANDLERS: Record<ItemKind, (use: ItemUse) => void> = {
  resurrection: (use) => {
    const { b, faction, args } = use;
    const t = ownUnit(use, args.targetId);
    if (t.alive) throw new Error('Wybierz poległą jednostkę.');
    // The Kingdom of the Dead: a unit that has already risen in this battle (the Wieczna Warta, a call, its bones) is not raised again by the treasure.
    if (t.status.risen) throw new Error('Ta jednostka już raz wstała w tej bitwie (Wieczna Warta).');
    // A fallen hero rises by an elixir only once per game (the arena has no heroes of the map, so no limit there).
    const hero = use.state.heroes[t.defId];
    if (hero?.revived) throw new Error('Ten bohater już raz wrócił dzięki Eliksirowi Odrodzenia.');
    // Digital ruleset: the fallen unit lies where it fell, so it stands up there (or on the nearest free cell).
    const fallen = isDigital(use.state.rules) && t.corpse ? t.corpse : null;
    const cell =
      args.to && !unitAt(b, args.to) && !b.obstacles.includes(args.to) && fitsAt(use.state, t, args.to)
        ? args.to
        : fallen
          ? nearestFreeCell(use.state, t, fallen)
          : freeCellNear(use.state, faction, t);
    if (!cell) throw new Error('Brak wolnego pola.');
    if (hero) {
      hero.revived = true;
      // Replaced by a reserve hero in the meantime: goes back to the player (who then leads both).
      if (hero.formerPlayerId) {
        hero.playerId = hero.formerPlayerId;
        delete hero.formerPlayerId;
      }
    }
    t.alive = true;
    t.hp = t.maxHp;
    placeUnit(use.state, t, cell, cell === fallen ? t.corpseTail : undefined);
    delete t.corpse;
    delete t.corpseTail;
  },
  heal: (use) => {
    const t = ownLiving(use, use.args.targetId);
    t.hp = Math.min(t.maxHp, t.hp + ITEM_EFFECT.heal * hpScaleOf(use.state));
  },
  seed: ({ state, b, faction }) => {
    for (const t of livingUnits(b, faction)) t.hp = Math.min(t.maxHp, t.hp + ITEM_EFFECT.seedHeal * hpScaleOf(state));
  },
  damage_scroll: (use) => dealDamage(use.state, enemyUnit(use, use.args.targetId), ITEM_EFFECT.scrollDamage * scaleOf(use.state), use.name),
  lightning: (use) => {
    const { args } = use;
    const ids = [...new Set(args.targetIds ?? (args.targetId ? [args.targetId] : []))].slice(0, ITEM_EFFECT.lightningTargets);
    if (!ids.length) throw new Error('Wybierz do dwóch wrogów.');
    // All the targets are checked before the first bolt: the first one may kill the second (a death effect), and that is no error.
    const targets = ids.map((id) => enemyUnit(use, id));
    for (const t of targets) if (t.alive) dealDamage(use.state, t, ITEM_EFFECT.lightningDamage * scaleOf(use.state), use.name);
  },
  sword: (use) => void (ownLiving(use, use.args.targetId).status.battleAttackBonus += ITEM_EFFECT.swordAttack * scaleOf(use.state)),
  shield: (use) => void (ownLiving(use, use.args.targetId).status.shieldArmed = true),
  vitality: (use) => {
    const t = ownLiving(use, use.args.targetId);
    t.maxHp += ITEM_EFFECT.vitalityHp * hpScaleOf(use.state);
    t.hp += ITEM_EFFECT.vitalityHp * hpScaleOf(use.state);
  },
  boots: (use) => void (ownLiving(use, use.args.targetId).status.battleSpeedBonus += ITEM_EFFECT.bootsSpeed),
  stone: (use) => void (ownLiving(use, use.args.targetId).status.damageReduction += ITEM_EFFECT.stoneReduction * scaleOf(use.state)),
  courage_horn: (use) => {
    const { args } = use;
    const ids = args.targetIds ?? (args.targetId ? [args.targetId] : []);
    const first = ownLiving(use, ids[0]);
    first.status.nextAttackBonus += ITEM_EFFECT.courageAttack * scaleOf(use.state);
    if (ids[1]) {
      const second = ownLiving(use, ids[1]);
      if (!unitsAdjacent(first, second)) throw new Error('Drugi sojusznik musi sąsiadować z pierwszym.');
      second.status.nextAttackBonus += ITEM_EFFECT.courageAttack * scaleOf(use.state);
    }
  },
  teleport: (use) => {
    const { b, args } = use;
    const t = ownLiving(use, args.targetId);
    const to = args.to;
    if (!to || !inLayout(b, to) || unitAt(b, to) || b.obstacles.includes(to)) throw new Error('Wybierz wolne pole.');
    if (!alliesOf(b, t).some((a) => cellsOf(a).some((c) => adjacent(c, to)))) throw new Error('Pole musi sąsiadować z sojusznikiem.');
    const from = t.pos!;
    if (!placeUnit(use.state, t, to)) throw new Error('Jednostka nie zmieści się na tym polu.');
    (b.teleports ??= []).push({ unitId: t.id, from, to, kind: 'scroll' });
  },
  hourglass: (use) => {
    const t = ownLiving(use, use.args.targetId);
    use.b.extra.unshift({ unitId: t.id, moveOnly: true });
  },
  horn: (use) => {
    const { state, b, faction, args } = use;
    const t = ownUnit(use, args.targetId);
    if (UNITS[t.defId].kind !== 'support') throw new Error('Róg działa tylko na pomocnika.');
    if (args.hornMode === 'extra') {
      living(t);
      b.extra.unshift({ unitId: t.id, moveOnly: false });
      return;
    }
    const reserve = args.reserveId;
    if (!reserve || !state.factions[faction].supportsAlive.includes(reserve) || b.units[reserve]) throw new Error('Wybierz żywego pomocnika z rezerwy.');
    const nu = makeBattleUnit(reserve, faction, Boolean(t.digital), t.scale ?? 1, t.hpScale ?? t.scale ?? 1, Boolean(t.arena), t.bonusShare);
    const spot = t.alive ? t.pos : freeCellNear(use.state, faction, nu);
    // The swapped unit leaves first, so a large newcomer may lie on the cells it frees.
    const was = { alive: t.alive, pos: t.pos, tail: t.tail };
    if (t.alive) {
      // The swapped unit goes back to the pool unharmed.
      t.alive = false;
      removeFromBoard(use.state, t, false);
      t.swappedOut = true;
    }
    if (!spot || !placeUnit(use.state, nu, spot)) {
      if (was.alive) Object.assign(t, was, { swappedOut: false });
      throw new Error('Brak wolnego pola.');
    }
    b.units[reserve] = nu;
    const idx = b.order.indexOf(t.id);
    if (idx >= 0) b.order[idx] = reserve;
  },
  map: () => {
    throw new Error('Magiczną Mapę używa się na mapie przygody.');
  },
};

/** Free cells where the Zwój Teleportacji may put `t`: next to one of its allies, and big enough for it (the bots pick from these). */
export function scrollCells(state: GameState, t: BattleUnit): HexKey[] {
  const b = state.battle!;
  const out = new Set<HexKey>();
  for (const a of alliesOf(b, t)) {
    for (const c of cellsOf(a)) {
      for (const k of neighborKeys(c)) {
        if (inLayout(b, k) && !unitAt(b, k) && !b.obstacles.includes(k) && fitsAt(state, t, k)) out.add(k);
      }
    }
  }
  return [...out];
}

export function battleItem(state: GameState, args: ItemArgs) {
  const b = state.battle!;
  const actor = b.units[b.activation!.unitId];
  const faction = actor.side as TeamId;
  const item = state.items[args.itemId];
  if (!item || item.owner !== faction || !state.factions[faction].inventory.includes(item.id)) throw new Error('Nie masz tego skarbu.');
  if (!canUseBattleItem(state, faction)) throw new Error('Skarby używa się przed akcją własnej jednostki.');
  if (!ITEMS[item.kind].usableIn.includes('battle')) throw new Error('Tego skarbu nie używa się w bitwie.');
  const name = itemDef(item.kind, isDigital(state.rules)).name;
  // A scroll aimed at a cell where a veiled enemy lies (its owner's side sees it, the caster does not; bots plan without hidden units): the enemy is uncovered, nobody jumps, the scroll stays in the bag.
  if (item.kind === 'teleport' && args.to) {
    const lurker = Object.values(b.units).find((x) => x.alive && x.side !== actor.side && x.status.veiled && (x.pos === args.to || x.tail === args.to));
    if (lurker) {
      unveil(state, lurker);
      return;
    }
  }
  ITEM_HANDLERS[item.kind]({ state, b, faction, args, name });
  consumeItem(state, item.id);
  log(state, 'item', `${unitName(actor)} używa skarbu: ${name}.`);
  checkBattleEnd(state);
}

export function consumeItem(state: GameState, itemId: string) {
  const item = state.items[itemId];
  if (!item.owner) return;
  const inv = state.factions[item.owner].inventory;
  inv.splice(inv.indexOf(itemId), 1);
  item.owner = null;
}
