// Battle engine: the painted arena (13 columns, 85 cells), initiative, movement, attacks,
// abilities and items. Functions change the GameState passed in.

import { ABILITY, FACTION_NAMES, ITEM_EFFECT, ITEMS, UNITS, type AbilityId, type FactionId, type ItemKind, type Side } from './data';
import { distance, directionBetween, add, key, line, neighborKeys, parseKey, type HexKey } from './hex';
import { log } from './log';
import { Rng } from './rng';
import type { BattleState, BattleUnit, GameState, UnitStatus } from './types';

/**
 * The arena drawn by the designer (docs/grafika/areny/arena_walki_*.png): 13 columns of
 * flat-topped hexes. A cell is (col, half-row): `half` counts half-hex steps down the board,
 * so one column holds every second value and neighbouring columns are offset by one.
 * Columns hold 5–7 hexes; the start columns 0 and 12 hold 5 (85 cells in all).
 */
export const ARENA_COLUMNS = 13;
/** First and last half-row of each column. */
export const COLUMN_SPAN: ReadonlyArray<readonly [number, number]> = [
  [4, 12], [3, 13], [2, 14], [3, 15], [2, 14], [3, 15], [2, 14], [3, 15], [2, 14], [3, 15], [2, 14], [3, 13], [4, 12],
];
/** Half-row of the middle of a start column. */
export const MIDDLE_HALF = 8;

export type ArenaId = 'dawn' | 'horde';

/** Obstacles painted on each arena, as [col, half]: 7 pieces, two of them 2 cells wide. Start columns stay free. */
export const ARENA_OBSTACLES: Record<ArenaId, Array<[number, number]>> = {
  dawn: [[3, 3], [9, 3], [3, 7], [6, 8], [9, 9], [10, 10], [3, 13], [4, 14], [9, 13]],
  horde: [[3, 3], [9, 3], [3, 7], [2, 8], [6, 8], [9, 9], [10, 10], [3, 13], [9, 13]],
};

export const arenaCell = (col: number, half: number): HexKey => key({ q: col, r: (half - col) / 2 });

/** Column and half-row of an arena cell. */
export function cellOf(k: HexKey): { col: number; half: number } {
  const h = parseKey(k);
  return { col: h.q, half: 2 * h.r + h.q };
}

const ARENA_CELLS: readonly HexKey[] = Object.freeze(
  COLUMN_SPAN.flatMap(([from, to], col) => {
    const out: HexKey[] = [];
    for (let half = from; half <= to; half += 2) out.push(arenaCell(col, half));
    return out;
  }),
);

/** Every cell of the arena, column by column (shared: never change the list). */
export function arenaCells(): readonly HexKey[] {
  return ARENA_CELLS;
}

/** Cells of one column, from the middle outwards. */
export function columnCells(col: number): HexKey[] {
  const [from, to] = COLUMN_SPAN[col];
  const halves: number[] = [];
  for (let half = from; half <= to; half += 2) halves.push(half);
  return halves.sort((a, b) => Math.abs(a - MIDDLE_HALF) - Math.abs(b - MIDDLE_HALF) || a - b).map((half) => arenaCell(col, half));
}

export function arenaObstacles(arena: ArenaId): HexKey[] {
  return ARENA_OBSTACLES[arena].map(([c, h]) => arenaCell(c, h));
}

const ARENA_SET = new Set(ARENA_CELLS);
export const inArena = (k: HexKey) => ARENA_SET.has(k);

const OBSTACLE_SETS = new WeakMap<HexKey[], Set<HexKey>>();

/** The battle's obstacles as a set, built once per obstacle list. */
function obstacleSet(b: BattleState): Set<HexKey> {
  let set = OBSTACLE_SETS.get(b.obstacles);
  if (!set) OBSTACLE_SETS.set(b.obstacles, (set = new Set(b.obstacles)));
  return set;
}

/** Living units by cell, for searches that look up many cells (the first listed, as unitAt finds it). */
function occupancy(b: BattleState): Map<HexKey, BattleUnit> {
  const out = new Map<HexKey, BattleUnit>();
  for (const u of Object.values(b.units)) if (u.alive && u.pos && !out.has(u.pos)) out.set(u.pos, u);
  return out;
}

const SIGHT_LINES = new Map<string, readonly HexKey[]>();

/** The cells strictly between two cells on a straight line. */
function cellsBetween(from: HexKey, to: HexKey): readonly HexKey[] {
  const k = `${from}|${to}`;
  let cells = SIGHT_LINES.get(k);
  if (!cells) SIGHT_LINES.set(k, (cells = line(parseKey(from), parseKey(to)).map(key).slice(1, -1)));
  return cells;
}

export function newStatus(): UnitStatus {
  return { slowNext: 0, rootedNext: false, cursedNext: 0, nextAttackBonus: 0, battleAttackBonus: 0, battleSpeedBonus: 0, damageReduction: 0, shieldArmed: false };
}

export function makeBattleUnit(defId: string, side: Side): BattleUnit {
  const def = UNITS[defId];
  return { id: defId, defId, side, hp: def.hp, maxHp: def.hp, pos: null, alive: true, abilityUsed: false, swappedOut: false, status: newStatus() };
}

const unitName = (u: BattleUnit) => UNITS[u.defId].name;

// ---------------------------------------------------------------- queries

export function abilityActive(state: GameState, _u?: BattleUnit): boolean {
  return state.rules.abilities;
}

export function abilityOf(u: BattleUnit): AbilityId {
  return UNITS[u.defId].ability;
}

export function livingUnits(b: BattleState, side?: Side): BattleUnit[] {
  return Object.values(b.units).filter((u) => u.alive && u.pos !== null && (side === undefined || u.side === side));
}

export function unitAt(b: BattleState, k: HexKey): BattleUnit | undefined {
  return Object.values(b.units).find((u) => u.alive && u.pos === k);
}

export function enemiesOf(b: BattleState, u: BattleUnit): BattleUnit[] {
  return livingUnits(b).filter((o) => o.side !== u.side);
}

export function alliesOf(b: BattleState, u: BattleUnit): BattleUnit[] {
  return livingUnits(b).filter((o) => o.side === u.side && o.id !== u.id);
}

export function activeUnit(b: BattleState): BattleUnit | null {
  return b.activation ? b.units[b.activation.unitId] : null;
}

export function unitSpeed(u: BattleUnit): number {
  return UNITS[u.defId].speed + u.status.battleSpeedBonus;
}

export function unitAttackBase(u: BattleUnit): number {
  return UNITS[u.defId].attack + u.status.battleAttackBonus;
}

export function moveRange(u: BattleUnit): number {
  if (u.status.rootedNext) return 0;
  return Math.max(0, unitSpeed(u) - u.status.slowNext);
}

/**
 * Breadth-first search over the cells a walker can pass: not through obstacles nor any other unit
 * (allies included, since 2026-10-22: the user's decision).
 */
function walkSearch(state: GameState, u: BattleUnit): { dist: Map<HexKey, number>; parent: Map<HexKey, HexKey> } {
  const b = state.battle!;
  const range = moveRange(u);
  const obstacles = obstacleSet(b);
  const units = occupancy(b);
  const dist = new Map<HexKey, number>([[u.pos!, 0]]);
  const parent = new Map<HexKey, HexKey>();
  const queue = [u.pos!];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    const d = dist.get(cur)!;
    if (d >= range) continue;
    for (const n of neighborKeys(cur)) {
      if (!inArena(n) || obstacles.has(n) || dist.has(n)) continue;
      if (units.has(n)) continue;
      dist.set(n, d + 1);
      parent.set(n, cur);
      queue.push(n);
    }
  }
  return { dist, parent };
}

/** Cells the unit can end its move on, with the number of steps used. */
export function reachableCells(state: GameState, u: BattleUnit): Map<HexKey, number> {
  const b = state.battle!;
  const out = new Map<HexKey, number>();
  if (!u.pos || b.duel) return out;
  const range = moveRange(u);
  const obstacles = obstacleSet(b);
  const units = occupancy(b);
  const occupant = (k: HexKey) => units.get(k);
  if (UNITS[u.defId].movement === 'fly') {
    for (const k of ARENA_CELLS) {
      if (k === u.pos || obstacles.has(k) || occupant(k)) continue;
      const d = distance(parseKey(u.pos), parseKey(k));
      if (d <= range) out.set(k, d);
    }
    return out;
  }
  for (const [k, d] of walkSearch(state, u).dist) if (d > 0 && !occupant(k)) out.set(k, d);
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
  if (state.battle!.duel || UNITS[u.defId].movement === 'fly') return [u.pos, to];
  const { parent } = walkSearch(state, u);
  if (!parent.has(to)) return [u.pos, to];
  const path = [to];
  while (path[0] !== u.pos) path.unshift(parent.get(path[0])!);
  return path;
}

/** Only obstacles block a shot: units standing in the way do not. */
export function hasLineOfSight(state: GameState, from: HexKey, to: HexKey): boolean {
  const obstacles = obstacleSet(state.battle!);
  return !cellsBetween(from, to).some((k) => obstacles.has(k));
}

const adjacent = (a: HexKey, b: HexKey) => distance(parseKey(a), parseKey(b)) === 1;

/** Legal attack targets from the unit's current position. */
export function attackTargets(state: GameState, u: BattleUnit, from: HexKey | null = u.pos): BattleUnit[] {
  const b = state.battle!;
  if (!from) return [];
  const enemies = enemiesOf(b, u);
  const near = enemies.filter((e) => adjacent(from, e.pos!));
  if (UNITS[u.defId].attackType === 'melee') return near;
  if (near.length) return near;
  return enemies.filter((e) => hasLineOfSight(state, from, e.pos!));
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
  return other && other.side !== u.side ? other : null;
}

/** Expected damage of a plain attack, before the defender's reactions. */
export function attackDamage(state: GameState, att: BattleUnit, target: BattleUnit, useAbility: boolean, movedDistance: number): number {
  let dmg = unitAttackBase(att) + att.status.nextAttackBonus - att.status.cursedNext;
  if (abilityActive(state, att)) {
    const ab = abilityOf(att);
    if (ab === 'lightCharge' && movedDistance >= ABILITY.lightChargeMinMove) dmg += ABILITY.lightChargeBonus;
    if (ab === 'bloodCall' && target.hp < target.maxHp) dmg += ABILITY.bloodCallBonus;
    if (useAbility && !att.abilityUsed && ab === 'nightAmbush') dmg += ABILITY.nightAmbushBonus;
  }
  return Math.max(0, dmg);
}

/** Abilities that are switched on for a single attack. */
export const ATTACK_ABILITIES: AbilityId[] = ['entanglingRoots', 'fireBreath', 'curse', 'nightAmbush'];
/** Guardian abilities work on every attack, with no once-per-battle limit. */
export const UNLIMITED_ABILITIES: AbilityId[] = ['boulder', 'nestLeap', 'manyHeads'];

/** Whether the attacker may hit a second adjacent enemy with this attack (Paszcze Otchłani). */
export function canHitTwo(state: GameState, u: BattleUnit): boolean {
  return abilityOf(u) === 'manyHeads' && abilityActive(state, u);
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
  if (!inArena(k) || b.obstacles.includes(k) || unitAt(b, k)) return null;
  return k;
}
/** Abilities used as a free action during the unit's activation. */
export const FREE_ABILITIES: AbilityId[] = ['sunburst', 'giftOfLife', 'web'];

// ---------------------------------------------------------------- lifecycle

/** After support selection: default placement, then each faction may rearrange (attacker first). */
export function startBattleFight(state: GameState) {
  const b = state.battle!;
  deploy(b);
  b.needsDeploy = b.duel ? [] : ([b.attacker, b.defender].filter((s) => s !== 'neutral') as FactionId[]);
  if (b.needsDeploy.length) {
    b.stage = 'deploy';
    return;
  }
  beginFight(state);
}

function beginFight(state: GameState) {
  const b = state.battle!;
  b.stage = 'fight';
  log(state, 'battle', 'Bitwa się rozpoczyna.');
  beginRound(state, 1);
}

/** Cells a side may deploy on: its edge column, minus obstacles. */
export function deployCells(b: BattleState, side: Side): HexKey[] {
  return columnCells(side === b.attacker ? 0 : ARENA_COLUMNS - 1).filter((k) => !b.obstacles.includes(k));
}

/** Duel spots: the two leaders on neighbouring cells in the middle. */
const duelSpot = (b: BattleState, side: Side) => (side === b.attacker ? arenaCell(5, 9) : arenaCell(6, 10));

export function deployUnits(state: GameState, faction: FactionId, positions: Record<string, HexKey>) {
  const b = state.battle!;
  if (b.stage !== 'deploy' || b.needsDeploy[0] !== faction) throw new Error('Teraz nie ustawia ta frakcja.');
  const own = Object.values(b.units).filter((u) => u.side === faction);
  const allowed = new Set(deployCells(b, faction));
  const used = new Set<HexKey>();
  for (const u of own) {
    const k = positions[u.id] ?? u.pos;
    if (!k || !allowed.has(k)) throw new Error('Jednostki można ustawić tylko w swojej skrajnej kolumnie.');
    if (used.has(k)) throw new Error('Dwie jednostki nie mogą stać na jednym polu.');
    used.add(k);
  }
  for (const u of own) u.pos = positions[u.id] ?? u.pos;
  b.needsDeploy.shift();
  log(state, 'battle', `${FACTION_NAMES[faction]} ustawia swoje jednostki.`);
  if (!b.needsDeploy.length) beginFight(state);
}

function deploy(b: BattleState) {
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
    units.forEach((u, i) => (u.pos = cells[i]));
  }
}

function sidePriority(state: GameState, b: BattleState, side: Side): number {
  const attackerFirst = state.rules.initiativeTie === 'defender' ? false : b.round % 2 === 1;
  return (side === b.attacker) === attackerFirst ? 0 : 1;
}

function beginRound(state: GameState, round: number) {
  const b = state.battle!;
  if (round > state.rules.battleRoundLimit) {
    const hp = (side: Side) => livingUnits(b, side).reduce((a, x) => a + x.hp, 0);
    const loser = hp(b.attacker) >= hp(b.defender) ? b.defender : b.attacker;
    log(state, 'battle', 'Bitwa trwa zbyt długo — strona z mniejszą sumą Ż przegrywa.');
    for (const x of livingUnits(b, loser)) {
      x.alive = false;
      x.pos = null;
    }
    checkBattleEnd(state);
    return;
  }
  b.round = round;
  const ids = Object.keys(b.units);
  b.order = livingUnits(b)
    .sort((x, y) => unitSpeed(y) - unitSpeed(x) || sidePriority(state, b, x.side) - sidePriority(state, b, y.side) || ids.indexOf(x.id) - ids.indexOf(y.id))
    .map((u) => u.id);
  b.index = 0;
  log(state, 'battle', `Runda bitwy ${round}.`);
  beginActivation(state, b.order[0], false);
}

function beginActivation(state: GameState, unitId: string, moveOnly: boolean) {
  const b = state.battle!;
  b.activation = { unitId, moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly, hop: 0 };
}

/** Moves to the next activation, the next round, or nothing if the battle ended. */
export function endActivation(state: GameState) {
  const b = state.battle!;
  const act = b.activation;
  if (act) {
    const u = b.units[act.unitId];
    // Effects that applied to "the next activation" are now spent.
    u.status.slowNext = 0;
    u.status.rootedNext = false;
  }
  if (checkBattleEnd(state)) return;
  if (b.extra.length) {
    const next = b.extra.shift()!;
    if (b.units[next.unitId].alive) {
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
  const a = livingUnits(b, b.attacker).length;
  const d = livingUnits(b, b.defender).length;
  if (a > 0 && d > 0) return false;
  b.stage = 'over';
  b.activation = null;
  b.winner = a > 0 ? b.attacker : d > 0 ? b.defender : 'draw';
  return true;
}

// ---------------------------------------------------------------- damage

function rollDie(state: GameState): number {
  if (!state.rules.useDice) return 0;
  const rng = new Rng(state.rng);
  const v = rng.int(3) - 1;
  state.rng = rng.state;
  return v;
}

export function dealDamage(state: GameState, target: BattleUnit, amount: number, source: string) {
  const dmg = Math.max(0, amount);
  target.hp -= dmg;
  log(state, 'damage', `${source} → ${unitName(target)}: ${dmg} obrażeń (Ż ${Math.max(0, target.hp)}/${target.maxHp}).`);
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    target.pos = null;
    log(state, 'death', `${unitName(target)} poległ(a).`);
  }
}

/** Opiekun Gaju: whether `bear` can still take the blow aimed at `x` (itself, or an ally next to it). */
export function bearCanGuard(state: GameState, bear: BattleUnit, x: BattleUnit): boolean {
  if (abilityOf(bear) !== 'guardian' || bear.abilityUsed || !abilityActive(state, bear)) return false;
  return bear.id === x.id || (!!bear.pos && !!x.pos && adjacent(bear.pos, x.pos));
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
  if (bear && dmg >= target.hp && dmg - ABILITY.guardianIgnore - Math.min(dmg, bear.status.damageReduction) < bear.hp) {
    bearGuard = 'ally';
    victim = bear;
    dmg = Math.max(0, dmg - ABILITY.guardianIgnore);
  }
  if (victim.status.shieldArmed) return { base, victim, damage: 0, bearGuard, hardHead: null, shield: true, lethal: false };
  // Opiekun Gaju guards the bear itself too: a lethal blow loses part of its strength.
  if (victim === target && bearCanGuard(state, victim, victim) && dmg >= victim.hp) {
    bearGuard = 'self';
    dmg = Math.max(0, dmg - ABILITY.guardianIgnore);
  }
  let hardHead: number | null = null;
  if (abilityOf(victim) === 'hardHead' && !victim.abilityUsed && abilityActive(state, victim) && dmg >= HARD_HEAD_MIN_DAMAGE) {
    hardHead = Math.min(ABILITY.hardHeadIgnore, dmg);
    dmg -= hardHead;
  }
  dmg = Math.max(0, dmg - victim.status.damageReduction);
  return { base, victim, damage: dmg, bearGuard, hardHead, shield: false, lethal: dmg >= victim.hp };
}

/** Twardogłowy fires only on a blow of at least this much damage. */
const HARD_HEAD_MIN_DAMAGE = 2;

function resolveAttack(state: GameState, att: BattleUnit, target: BattleUnit, useAbility: boolean, movedDistance: number) {
  const b = state.battle!;
  const die = rollDie(state);
  const p = predictDamage(state, att, target, { useAbility, movedDistance, die });
  // The roll is logged so a blow that the die cut to 0 does not look like a bug.
  if (state.rules.useDice) log(state, 'damage', `Rzut kością: ${die > 0 ? '+1' : die < 0 ? '−1' : '0'} (${p.base} ${die < 0 ? '−' : '+'} ${Math.abs(die)} = ${Math.max(0, p.base + die)}).`);
  const victim = p.victim;
  if (p.bearGuard === 'ally') {
    victim.abilityUsed = true;
    log(state, 'ability', `${unitName(victim)} przejmuje atak i ignoruje ${ABILITY.guardianIgnore} obrażenia (Opiekun Gaju).`);
  }
  if (p.shield) {
    victim.status.shieldArmed = false;
    log(state, 'item', `Tarcza Strażnika chroni: ${unitName(victim)}.`);
    recordRoll(state, att, victim, p.base, die, 0);
    return;
  }
  if (p.bearGuard === 'self') {
    victim.abilityUsed = true;
    log(state, 'ability', `${unitName(victim)} ignoruje ${ABILITY.guardianIgnore} obrażenia (Opiekun Gaju).`);
  }
  if (p.hardHead !== null) {
    victim.abilityUsed = true;
    log(state, 'ability', `${unitName(victim)} ignoruje ${p.hardHead} obrażeń (Twardogłowy).`);
  }
  b.damageBy[att.id] = (b.damageBy[att.id] ?? 0) + Math.min(p.damage, Math.max(0, victim.hp));
  recordRoll(state, att, victim, p.base, die, p.damage);
  dealDamage(state, victim, p.damage, unitName(att));
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

export function battleMove(state: GameState, to: HexKey) {
  const b = state.battle!;
  const act = b.activation!;
  const u = b.units[act.unitId];
  if (act.moved || act.attacked) throw new Error('Ta jednostka już się ruszyła.');
  const cells = reachableCells(state, u);
  const steps = cells.get(to);
  if (steps === undefined) throw new Error('Pole poza zasięgiem ruchu.');
  u.pos = to;
  act.moved = true;
  act.acted = true;
  act.movedDistance = steps;
  if (act.moveOnly) endActivation(state);
}

export function battleAttack(state: GameState, targetId: string, useAbility: boolean, secondTargetId?: string) {
  const b = state.battle!;
  const act = b.activation!;
  const u = b.units[act.unitId];
  if (act.attacked) throw new Error('Ta jednostka już atakowała.');
  if (act.moveOnly) throw new Error('Ta aktywacja pozwala tylko na ruch.');
  const target = b.units[targetId];
  const legal = attackTargets(state, u);
  if (!target || !legal.some((t) => t.id === targetId)) throw new Error('Nieprawidłowy cel ataku.');
  const ab = abilityOf(u);
  const canUse = useAbility && !u.abilityUsed && abilityActive(state, u) && ATTACK_ABILITIES.includes(ab);
  if (useAbility && !canUse) throw new Error('Zdolność jest niedostępna.');

  const targets: BattleUnit[] = [target];
  if (canUse && ab === 'fireBreath') {
    const second = breathSecondTarget(state, u, target);
    if (second) targets.push(second);
  }
  if (secondTargetId && !(canUse && ab === 'fireBreath')) {
    const second = b.units[secondTargetId];
    if (!canHitTwo(state, u)) throw new Error('Ta jednostka atakuje jeden cel.');
    if (!second || second.id === target.id || !adjacent(u.pos!, target.pos!) || !adjacent(u.pos!, second.pos!) || !legal.some((t) => t.id === second.id)) {
      throw new Error('Drugi cel musi sąsiadować z atakującym.');
    }
    targets.push(second);
    log(state, 'ability', `${unitName(u)}: ${UNITS[u.defId].abilityName}.`);
  }
  if (canUse) {
    u.abilityUsed = true;
    log(state, 'ability', `${unitName(u)} używa zdolności: ${UNITS[u.defId].abilityName}.`);
  }
  log(state, 'battle', `${unitName(u)} atakuje: ${targets.map(unitName).join(', ')}.`);
  for (const t of targets) {
    if (!t.alive) continue;
    resolveAttack(state, u, t, canUse, act.movedDistance);
    if (canUse && t.alive) {
      if (ab === 'entanglingRoots') {
        t.status.slowNext += ABILITY.rootsSlow;
        log(state, 'ability', `${unitName(t)}: −${ABILITY.rootsSlow} S w następnej aktywacji.`);
      }
      if (ab === 'curse') {
        t.status.cursedNext += ABILITY.curseMinus;
        log(state, 'ability', `${unitName(t)}: −${ABILITY.curseMinus} A przy następnym ataku.`);
      }
    }
    // No pushing in a duel: nobody moves there, so the two leaders would never meet again.
    if (ab === 'boulder' && t.alive && !b.duel && abilityActive(state, u)) {
      const to = pushCell(state, u.pos!, t.pos!);
      if (to) {
        t.pos = to;
        log(state, 'ability', `${unitName(t)} zostaje odepchnięty o 1 pole (${UNITS[u.defId].abilityName}).`);
      }
    }
  }
  u.status.nextAttackBonus = 0;
  u.status.cursedNext = 0;
  act.attacked = true;
  act.acted = true;
  if (checkBattleEnd(state)) return;
  const hopAbility = ab === 'airDash' || ab === 'nestLeap';
  if (hopAbility && !b.duel && (!u.abilityUsed || ab === 'nestLeap') && abilityActive(state, u) && u.alive) {
    act.hop = ab === 'airDash' ? ABILITY.airDashRange : ABILITY.nestLeapRange;
    return;
  }
  endActivation(state);
}

export function hopCells(state: GameState, u: BattleUnit, range: number): HexKey[] {
  const b = state.battle!;
  const obstacles = obstacleSet(b);
  const units = occupancy(b);
  return ARENA_CELLS.filter((k) => !obstacles.has(k) && !units.has(k) && u.pos && distance(parseKey(u.pos), parseKey(k)) <= range && k !== u.pos);
}

export function battleHop(state: GameState, to: HexKey) {
  const b = state.battle!;
  const act = b.activation!;
  const u = b.units[act.unitId];
  if (!act.hop) throw new Error('Odskok jest niedostępny.');
  if (!hopCells(state, u, act.hop).includes(to)) throw new Error('Pole poza zasięgiem odskoku.');
  u.pos = to;
  if (!UNLIMITED_ABILITIES.includes(abilityOf(u))) u.abilityUsed = true;
  act.hop = 0;
  log(state, 'ability', `${unitName(u)} odskakuje (${UNITS[u.defId].abilityName}).`);
  endActivation(state);
}

export function battleAbility(state: GameState, targetId?: string) {
  const b = state.battle!;
  const u = b.units[b.activation!.unitId];
  const ab = abilityOf(u);
  if (u.abilityUsed || !abilityActive(state, u) || !FREE_ABILITIES.includes(ab)) throw new Error('Zdolność jest niedostępna.');
  if (ab === 'sunburst') {
    for (const ally of livingUnits(b, u.side)) ally.status.nextAttackBonus += ally.id === u.id ? ABILITY.sunburstSelfBonus : ABILITY.sunburstBonus;
  } else if (ab === 'giftOfLife') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side !== u.side) throw new Error('Wybierz żyjącego sojusznika.');
    t.hp = Math.min(t.maxHp, t.hp + ABILITY.giftOfLifeHeal);
  } else if (ab === 'web') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side === u.side || distance(parseKey(u.pos!), parseKey(t.pos!)) > ABILITY.webRange) throw new Error(`Wybierz wroga w zasięgu ${ABILITY.webRange} pól.`);
    t.status.rootedNext = true;
    log(state, 'ability', `${unitName(t)} zostaje unieruchomiony do swojej następnej aktywacji.`);
  }
  u.abilityUsed = true;
  log(state, 'ability', `${unitName(u)} używa zdolności: ${UNITS[u.defId].abilityName}.`);
}

// ---------------------------------------------------------------- items

export function canUseBattleItem(state: GameState, faction: FactionId): boolean {
  const b = state.battle;
  if (!b || b.stage !== 'fight' || !b.activation) return false;
  const u = b.units[b.activation.unitId];
  return u.side === faction && !b.activation.acted;
}

function freeCellNear(b: BattleState, side: Side): HexKey | null {
  if (b.duel) {
    const spot = duelSpot(b, side);
    return unitAt(b, spot) ? null : spot;
  }
  return deployCells(b, side).find((k) => !unitAt(b, k)) ?? null;
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
  faction: FactionId;
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
    const cell = args.to && !unitAt(b, args.to) && !b.obstacles.includes(args.to) ? args.to : freeCellNear(b, faction);
    if (!cell) throw new Error('Brak wolnego pola.');
    t.alive = true;
    t.hp = t.maxHp;
    t.pos = cell;
  },
  heal: (use) => {
    const t = ownLiving(use, use.args.targetId);
    t.hp = Math.min(t.maxHp, t.hp + ITEM_EFFECT.heal);
  },
  seed: ({ b, faction }) => {
    for (const t of livingUnits(b, faction)) t.hp = Math.min(t.maxHp, t.hp + ITEM_EFFECT.seedHeal);
  },
  damage_scroll: (use) => dealDamage(use.state, enemyUnit(use, use.args.targetId), ITEM_EFFECT.scrollDamage, use.name),
  lightning: (use) => {
    const { args } = use;
    const ids = [...new Set(args.targetIds ?? (args.targetId ? [args.targetId] : []))].slice(0, ITEM_EFFECT.lightningTargets);
    if (!ids.length) throw new Error('Wybierz do dwóch wrogów.');
    for (const id of ids) dealDamage(use.state, enemyUnit(use, id), ITEM_EFFECT.lightningDamage, use.name);
  },
  sword: (use) => void (ownLiving(use, use.args.targetId).status.battleAttackBonus += ITEM_EFFECT.swordAttack),
  shield: (use) => void (ownLiving(use, use.args.targetId).status.shieldArmed = true),
  vitality: (use) => {
    const t = ownLiving(use, use.args.targetId);
    t.maxHp += ITEM_EFFECT.vitalityHp;
    t.hp += ITEM_EFFECT.vitalityHp;
  },
  boots: (use) => void (ownLiving(use, use.args.targetId).status.battleSpeedBonus += ITEM_EFFECT.bootsSpeed),
  stone: (use) => void (ownLiving(use, use.args.targetId).status.damageReduction += ITEM_EFFECT.stoneReduction),
  courage_horn: (use) => {
    const { args } = use;
    const ids = args.targetIds ?? (args.targetId ? [args.targetId] : []);
    const first = ownLiving(use, ids[0]);
    first.status.nextAttackBonus += ITEM_EFFECT.courageAttack;
    if (ids[1]) {
      const second = ownLiving(use, ids[1]);
      if (!adjacent(first.pos!, second.pos!)) throw new Error('Drugi sojusznik musi sąsiadować z pierwszym.');
      second.status.nextAttackBonus += ITEM_EFFECT.courageAttack;
    }
  },
  teleport: (use) => {
    const { b, args } = use;
    const t = ownLiving(use, args.targetId);
    const to = args.to;
    if (!to || !inArena(to) || unitAt(b, to) || b.obstacles.includes(to)) throw new Error('Wybierz wolne pole.');
    if (!alliesOf(b, t).some((a) => adjacent(a.pos!, to))) throw new Error('Pole musi sąsiadować z sojusznikiem.');
    t.pos = to;
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
    const nu = makeBattleUnit(reserve, faction);
    nu.pos = t.alive ? t.pos : freeCellNear(b, faction);
    if (!nu.pos) throw new Error('Brak wolnego pola.');
    if (t.alive) {
      // The swapped unit goes back to the pool unharmed.
      t.alive = false;
      t.pos = null;
      t.swappedOut = true;
    }
    b.units[reserve] = nu;
    const idx = b.order.indexOf(t.id);
    if (idx >= 0) b.order[idx] = reserve;
  },
  map: () => {
    throw new Error('Magiczną Mapę używa się na mapie przygody.');
  },
};

export function battleItem(state: GameState, args: ItemArgs) {
  const b = state.battle!;
  const actor = b.units[b.activation!.unitId];
  const faction = actor.side as FactionId;
  const item = state.items[args.itemId];
  if (!item || item.owner !== faction || !state.factions[faction].inventory.includes(item.id)) throw new Error('Nie masz tego skarbu.');
  if (!canUseBattleItem(state, faction)) throw new Error('Skarby używa się przed akcją własnej jednostki.');
  if (!ITEMS[item.kind].usableIn.includes('battle')) throw new Error('Tego skarbu nie używa się w bitwie.');
  const name = ITEMS[item.kind].name;
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
