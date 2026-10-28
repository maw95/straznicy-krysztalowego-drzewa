// Battle engine: arena 9×11, initiative, movement, attacks, abilities and items.
// Functions mutate the (already cloned) GameState passed in.

import { ABILITY, ITEMS, UNITS, type AbilityId, type FactionId, type Side } from './data';
import { distance, directionBetween, add, key, line, neighbors, parseKey, type HexKey } from './hex';
import { Rng } from './rng';
import type { Activation, BattleState, BattleUnit, GameState, UnitStatus } from './types';

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

export function arenaCells(): HexKey[] {
  const out: HexKey[] = [];
  COLUMN_SPAN.forEach(([from, to], col) => {
    for (let half = from; half <= to; half += 2) out.push(arenaCell(col, half));
  });
  return out;
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

const ARENA_SET = new Set(arenaCells());
export const inArena = (k: HexKey) => ARENA_SET.has(k);

export function newStatus(): UnitStatus {
  return { slowNext: 0, rootedNext: false, cursedNext: 0, nextAttackBonus: 0, battleAttackBonus: 0, battleSpeedBonus: 0, damageReduction: 0, shieldArmed: false };
}

export function makeBattleUnit(defId: string, side: Side): BattleUnit {
  const def = UNITS[defId];
  return { id: defId, defId, side, hp: def.hp, maxHp: def.hp, pos: null, alive: true, abilityUsed: false, swappedOut: false, status: newStatus() };
}

// ---------------------------------------------------------------- logging

export function blog(state: GameState, text: string, kind: 'battle' | 'damage' | 'death' | 'ability' | 'item' = 'battle') {
  state.log.push({ round: state.round, kind, text });
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

/** Breadth-first search over the cells a walker can pass: not through obstacles or enemies (nor allies, unless the rules allow it). */
function walkSearch(state: GameState, u: BattleUnit): { dist: Map<HexKey, number>; parent: Map<HexKey, HexKey> } {
  const b = state.battle!;
  const range = moveRange(u);
  const obstacles = new Set(b.obstacles);
  const dist = new Map<HexKey, number>([[u.pos!, 0]]);
  const parent = new Map<HexKey, HexKey>();
  const queue = [u.pos!];
  while (queue.length) {
    const cur = queue.shift()!;
    const d = dist.get(cur)!;
    if (d >= range) continue;
    for (const nh of neighbors(parseKey(cur))) {
      const n = key(nh);
      if (!inArena(n) || obstacles.has(n) || dist.has(n)) continue;
      const occ = unitAt(b, n);
      if (occ && (occ.side !== u.side || !state.rules.passThroughAllies)) continue;
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
  const obstacles = new Set(b.obstacles);
  const occupant = (k: HexKey) => unitAt(b, k);
  if (UNITS[u.defId].movement === 'fly') {
    for (const k of arenaCells()) {
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

export function hasLineOfSight(state: GameState, from: HexKey, to: HexKey): boolean {
  const b = state.battle!;
  const obstacles = new Set(b.obstacles);
  const path = line(parseKey(from), parseKey(to)).map(key);
  for (const k of path.slice(1, -1)) {
    if (obstacles.has(k)) return false;
    if (state.rules.unitsBlockSight && unitAt(b, k)) return false;
  }
  return true;
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
  blog(state, 'Bitwa się rozpoczyna.');
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
  blog(state, `${faction === 'dawn' ? 'Przymierze Świtu' : 'Mroczna Horda'} ustawia swoje jednostki.`);
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
    blog(state, 'Bitwa trwa zbyt długo — strona z mniejszą sumą Ż przegrywa.');
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
  blog(state, `Runda bitwy ${round}.`);
  beginActivation(state, b.order[0], false);
}

function beginActivation(state: GameState, unitId: string, moveOnly: boolean) {
  const b = state.battle!;
  b.activation = { unitId, moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly, hop: 0, armedAbility: false };
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
  blog(state, `${source} → ${unitName(target)}: ${dmg} obrażeń (Ż ${Math.max(0, target.hp)}/${target.maxHp}).`, 'damage');
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    target.pos = null;
    blog(state, `${unitName(target)} poległ(a).`, 'death');
  }
}

function resolveAttack(state: GameState, att: BattleUnit, target: BattleUnit, useAbility: boolean, movedDistance: number) {
  const b = state.battle!;
  const base = attackDamage(state, att, target, useAbility, movedDistance);
  const die = rollDie(state);
  // The roll is logged so a blow that the die cut to 0 does not look like a bug.
  if (state.rules.useDice) blog(state, `Rzut kością: ${die > 0 ? '+1' : die < 0 ? '−1' : '0'} (${base} ${die < 0 ? '−' : '+'} ${Math.abs(die)} = ${Math.max(0, base + die)}).`, 'damage');
  let dmg = Math.max(0, base + die);
  // Opiekun Gaju: the bear takes a lethal blow aimed at an adjacent ally, if it survives it.
  const bear = livingUnits(b, target.side).find(
    (x) => x.id !== target.id && abilityOf(x) === 'guardian' && !x.abilityUsed && abilityActive(state, x) && adjacent(x.pos!, target.pos!),
  );
  let victim = target;
  if (bear && dmg >= target.hp && dmg - ABILITY.guardianIgnore - Math.min(dmg, bear.status.damageReduction) < bear.hp) {
    bear.abilityUsed = true;
    victim = bear;
    dmg = Math.max(0, dmg - ABILITY.guardianIgnore);
    blog(state, `${unitName(bear)} przejmuje atak i ignoruje ${ABILITY.guardianIgnore} obrażenia (Opiekun Gaju).`, 'ability');
  }
  if (victim.status.shieldArmed) {
    victim.status.shieldArmed = false;
    blog(state, `Tarcza Strażnika chroni: ${unitName(victim)}.`, 'item');
    recordRoll(state, att, victim, base, die, 0);
    return;
  }
  // Opiekun Gaju guards the bear itself too: a lethal blow loses part of its strength.
  if (victim === target && abilityOf(victim) === 'guardian' && !victim.abilityUsed && abilityActive(state, victim) && dmg >= victim.hp) {
    victim.abilityUsed = true;
    dmg = Math.max(0, dmg - ABILITY.guardianIgnore);
    blog(state, `${unitName(victim)} ignoruje ${ABILITY.guardianIgnore} obrażenia (Opiekun Gaju).`, 'ability');
  }
  if (abilityOf(victim) === 'hardHead' && !victim.abilityUsed && abilityActive(state, victim) && dmg >= 2) {
    victim.abilityUsed = true;
    const ignored = Math.min(ABILITY.hardHeadIgnore, dmg);
    dmg -= ignored;
    blog(state, `${unitName(victim)} ignoruje ${ignored} obrażeń (Twardogłowy).`, 'ability');
  }
  dmg = Math.max(0, dmg - victim.status.damageReduction);
  b.damageBy[att.id] = (b.damageBy[att.id] ?? 0) + Math.min(dmg, Math.max(0, victim.hp));
  recordRoll(state, att, victim, base, die, dmg);
  dealDamage(state, victim, dmg, unitName(att));
}

function recordRoll(state: GameState, att: BattleUnit, victim: BattleUnit, attack: number, die: number, damage: number) {
  const b = state.battle!;
  const rolls = b.rolls ?? [];
  const seq = (rolls[rolls.length - 1]?.seq ?? 0) + 1;
  b.rolls = [...rolls, { seq, attackerId: att.id, targetId: victim.id, attack, die: state.rules.useDice ? die : null, damage }].slice(-4);
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
  if (!target || !attackTargets(state, u).some((t) => t.id === targetId)) throw new Error('Nieprawidłowy cel ataku.');
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
    if (!second || second.id === target.id || !adjacent(u.pos!, target.pos!) || !adjacent(u.pos!, second.pos!) || !attackTargets(state, u).some((t) => t.id === second.id)) {
      throw new Error('Drugi cel musi sąsiadować z atakującym.');
    }
    targets.push(second);
    blog(state, `${unitName(u)}: ${UNITS[u.defId].abilityName}.`, 'ability');
  }
  if (canUse) {
    u.abilityUsed = true;
    blog(state, `${unitName(u)} używa zdolności: ${UNITS[u.defId].abilityName}.`, 'ability');
  }
  blog(state, `${unitName(u)} atakuje: ${targets.map(unitName).join(', ')}.`);
  for (const t of targets) {
    if (!t.alive) continue;
    resolveAttack(state, u, t, canUse, act.movedDistance);
    if (canUse && t.alive) {
      if (ab === 'entanglingRoots') {
        t.status.slowNext += ABILITY.rootsSlow;
        blog(state, `${unitName(t)}: −${ABILITY.rootsSlow} S w następnej aktywacji.`, 'ability');
      }
      if (ab === 'curse') {
        t.status.cursedNext += ABILITY.curseMinus;
        blog(state, `${unitName(t)}: −${ABILITY.curseMinus} A przy następnym ataku.`, 'ability');
      }
    }
    // No pushing in a duel: nobody moves there, so the two leaders would never meet again.
    if (ab === 'boulder' && t.alive && !b.duel && abilityActive(state, u)) {
      const to = pushCell(state, u.pos!, t.pos!);
      if (to) {
        t.pos = to;
        blog(state, `${unitName(t)} zostaje odepchnięty o 1 pole (${UNITS[u.defId].abilityName}).`, 'ability');
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
  const obstacles = new Set(b.obstacles);
  return arenaCells().filter((k) => !obstacles.has(k) && !unitAt(b, k) && u.pos && distance(parseKey(u.pos), parseKey(k)) <= range && k !== u.pos);
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
  blog(state, `${unitName(u)} odskakuje (${UNITS[u.defId].abilityName}).`, 'ability');
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
    blog(state, `${unitName(t)} zostaje unieruchomiony do swojej następnej aktywacji.`, 'ability');
  }
  u.abilityUsed = true;
  blog(state, `${unitName(u)} używa zdolności: ${UNITS[u.defId].abilityName}.`, 'ability');
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

export function battleItem(
  state: GameState,
  args: { itemId: string; targetId?: string; targetIds?: string[]; to?: HexKey; hornMode?: 'swap' | 'extra'; reserveId?: string },
) {
  const b = state.battle!;
  const act: Activation = b.activation!;
  const actor = b.units[act.unitId];
  const faction = actor.side as FactionId;
  const item = state.items[args.itemId];
  if (!item || item.owner !== faction || !state.factions[faction].inventory.includes(item.id)) throw new Error('Nie masz tego skarbu.');
  if (!canUseBattleItem(state, faction)) throw new Error('Skarby używa się przed akcją własnej jednostki.');
  if (!ITEMS[item.kind].usableIn.includes('battle')) throw new Error('Tego skarbu nie używa się w bitwie.');
  const own = (id?: string) => {
    const t = id ? b.units[id] : undefined;
    if (!t || t.side !== faction) throw new Error('Wybierz własną jednostkę.');
    return t;
  };
  const enemy = (id?: string) => {
    const t = id ? b.units[id] : undefined;
    if (!t || !t.alive || t.side === faction) throw new Error('Wybierz żyjącego wroga.');
    return t;
  };
  const living = (t: BattleUnit) => {
    if (!t.alive) throw new Error('Ta jednostka nie żyje.');
    return t;
  };
  const name = ITEMS[item.kind].name;
  switch (item.kind) {
    case 'resurrection': {
      const t = own(args.targetId);
      if (t.alive) throw new Error('Wybierz poległą jednostkę.');
      const cell = args.to && !unitAt(b, args.to) && !b.obstacles.includes(args.to) ? args.to : freeCellNear(b, faction);
      if (!cell) throw new Error('Brak wolnego pola.');
      t.alive = true;
      t.hp = t.maxHp;
      t.pos = cell;
      break;
    }
    case 'heal': {
      const t = living(own(args.targetId));
      t.hp = Math.min(t.maxHp, t.hp + 6);
      break;
    }
    case 'seed':
      for (const t of livingUnits(b, faction)) t.hp = Math.min(t.maxHp, t.hp + 2);
      break;
    case 'damage_scroll':
      dealDamage(state, enemy(args.targetId), 3, name);
      break;
    case 'lightning': {
      const ids = [...new Set(args.targetIds ?? (args.targetId ? [args.targetId] : []))].slice(0, 2);
      if (!ids.length) throw new Error('Wybierz do dwóch wrogów.');
      for (const id of ids) {
        const t = enemy(id);
        dealDamage(state, t, 2, name);
      }
      break;
    }
    case 'sword':
      living(own(args.targetId)).status.battleAttackBonus += 2;
      break;
    case 'shield':
      living(own(args.targetId)).status.shieldArmed = true;
      break;
    case 'vitality': {
      const t = living(own(args.targetId));
      t.maxHp += 4;
      t.hp += 4;
      break;
    }
    case 'boots':
      living(own(args.targetId)).status.battleSpeedBonus += 3;
      break;
    case 'stone':
      living(own(args.targetId)).status.damageReduction += 1;
      break;
    case 'courage_horn': {
      const ids = args.targetIds ?? (args.targetId ? [args.targetId] : []);
      const first = living(own(ids[0]));
      first.status.nextAttackBonus += 2;
      if (ids[1]) {
        const second = living(own(ids[1]));
        if (!adjacent(first.pos!, second.pos!)) throw new Error('Drugi sojusznik musi sąsiadować z pierwszym.');
        second.status.nextAttackBonus += 2;
      }
      break;
    }
    case 'teleport': {
      const t = living(own(args.targetId));
      const to = args.to;
      if (!to || !inArena(to) || unitAt(b, to) || b.obstacles.includes(to)) throw new Error('Wybierz wolne pole.');
      const nextToAlly = alliesOf(b, t).some((a) => adjacent(a.pos!, to));
      if (!nextToAlly) throw new Error('Pole musi sąsiadować z sojusznikiem.');
      t.pos = to;
      break;
    }
    case 'hourglass': {
      const t = living(own(args.targetId));
      b.extra.unshift({ unitId: t.id, moveOnly: true });
      break;
    }
    case 'horn': {
      const t = own(args.targetId);
      if (UNITS[t.defId].kind !== 'support') throw new Error('Róg działa tylko na pomocnika.');
      if (args.hornMode === 'extra') {
        living(t);
        b.extra.unshift({ unitId: t.id, moveOnly: false });
      } else {
        const reserve = args.reserveId;
        const f = state.factions[faction];
        if (!reserve || !f.supportsAlive.includes(reserve) || b.units[reserve]) throw new Error('Wybierz żywego pomocnika z rezerwy.');
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
      }
      break;
    }
    case 'map':
      throw new Error('Magiczną Mapę używa się na mapie przygody.');
  }
  consumeItem(state, item.id);
  blog(state, `${unitName(actor)} używa skarbu: ${name}.`, 'item');
  checkBattleEnd(state);
}

export function consumeItem(state: GameState, itemId: string) {
  const item = state.items[itemId];
  if (!item.owner) return;
  const inv = state.factions[item.owner].inventory;
  inv.splice(inv.indexOf(itemId), 1);
  item.owner = null;
}
