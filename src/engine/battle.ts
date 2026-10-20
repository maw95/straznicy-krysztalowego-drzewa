// Battle engine: arena 9×11, initiative, movement, attacks, abilities and items.
// Functions mutate the (already cloned) GameState passed in.

import { ITEMS, UNITS, type AbilityId, type FactionId, type Side } from './data';
import { distance, directionBetween, add, key, line, neighbors, offsetToHex, parseKey, hexToOffset, type HexKey } from './hex';
import { Rng } from './rng';
import type { Activation, BattleState, BattleUnit, GameState, UnitStatus } from './types';

export const ARENA_ROWS = 9;
export const ARENA_COLS = 11;

export interface ObstacleDef {
  cells: Array<[number, number]>;
  sprite: string;
}

/** Fixed obstacle layout ("stałe przeszkody na polu bitwy"); start columns stay free. */
export const ARENA_OBSTACLES: ObstacleDef[] = [
  { cells: [[1, 2]], sprite: 'grove' },
  { cells: [[1, 3]], sprite: 'grove2' },
  { cells: [[0, 5]], sprite: 'deadoak' },
  { cells: [[1, 8]], sprite: 'tree1' },
  { cells: [[3, 4]], sprite: 'tree2' },
  { cells: [[5, 4]], sprite: 'rock' },
  { cells: [[6, 5], [6, 6]], sprite: 'log' },
  { cells: [[7, 1]], sprite: 'tree3' },
  { cells: [[7, 7], [7, 8]], sprite: 'pond' },
  { cells: [[8, 9]], sprite: 'deadtree' },
];

export const arenaCell = (row: number, col: number): HexKey => key(offsetToHex(row, col));

export function arenaCells(): HexKey[] {
  const out: HexKey[] = [];
  for (let row = 0; row < ARENA_ROWS; row++) for (let col = 0; col < ARENA_COLS; col++) out.push(arenaCell(row, col));
  return out;
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

export function abilityActive(state: GameState, u: BattleUnit): boolean {
  if (u.side === 'neutral') return state.setup.difficulty === 'advanced' || state.rules.neutralAbilitiesAlways;
  return state.setup.difficulty === 'advanced';
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
  const dist = new Map<HexKey, number>([[u.pos, 0]]);
  const queue = [u.pos];
  while (queue.length) {
    const cur = queue.shift()!;
    const d = dist.get(cur)!;
    if (d >= range) continue;
    for (const nh of neighbors(parseKey(cur))) {
      const n = key(nh);
      if (!inArena(n) || obstacles.has(n) || dist.has(n)) continue;
      const occ = occupant(n);
      if (occ && (occ.side !== u.side || !state.rules.passThroughAllies)) continue;
      dist.set(n, d + 1);
      queue.push(n);
      if (!occ) out.set(n, d + 1);
    }
  }
  return out;
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

/** Second target for Ognisty Oddech: the unit standing right behind the first one, in line from the dragon. */
export function breathSecondTarget(state: GameState, u: BattleUnit, first: BattleUnit): BattleUnit | null {
  const b = state.battle!;
  if (!u.pos || !first.pos) return null;
  const dir = directionBetween(parseKey(u.pos), parseKey(first.pos));
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
    if (ab === 'lightCharge' && movedDistance >= 3) dmg += 1;
    if (useAbility && !att.abilityUsed) {
      if (ab === 'bloodCall' && target.hp < target.maxHp) dmg += 2;
      if (ab === 'nightAmbush') dmg += 2;
    }
  }
  return Math.max(0, dmg);
}

/** Abilities that are switched on for a single attack. */
export const ATTACK_ABILITIES: AbilityId[] = ['entanglingRoots', 'fireBreath', 'bloodCall', 'curse', 'nightAmbush', 'boulder', 'manyHeads'];
/** Abilities used as a free action during the unit's activation. */
export const FREE_ABILITIES: AbilityId[] = ['sunburst', 'giftOfLife', 'web'];

// ---------------------------------------------------------------- lifecycle

export function startBattleFight(state: GameState) {
  const b = state.battle!;
  b.stage = 'fight';
  deploy(b);
  blog(state, 'Bitwa się rozpoczyna.');
  beginRound(state, 1);
}

function deploy(b: BattleState) {
  if (b.duel) {
    // Duel: the two leaders face each other on neighbouring cells.
    for (const u of Object.values(b.units)) u.pos = arenaCell(4, u.side === b.attacker ? 4 : 5);
    return;
  }
  const rowsFor = [4, 2, 6, 3, 5, 1, 7];
  for (const side of [b.attacker, b.defender]) {
    const col = side === b.attacker ? 0 : ARENA_COLS - 1;
    const units = Object.values(b.units).filter((u) => u.side === side);
    // Hero (or guardian) in the middle, supports above and below.
    units.sort((x, y) => (UNITS[x.defId].kind === 'support' ? 1 : 0) - (UNITS[y.defId].kind === 'support' ? 1 : 0));
    units.forEach((u, i) => (u.pos = arenaCell(rowsFor[i], col)));
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
  let dmg = attackDamage(state, att, target, useAbility, movedDistance) + rollDie(state);
  dmg = Math.max(0, dmg);
  // Opiekun Gaju: the bear takes a lethal blow aimed at an adjacent ally, if it survives it.
  const bear = livingUnits(b, target.side).find(
    (x) => x.id !== target.id && abilityOf(x) === 'guardian' && !x.abilityUsed && abilityActive(state, x) && adjacent(x.pos!, target.pos!),
  );
  let victim = target;
  if (bear && dmg >= target.hp && dmg - Math.min(dmg, bear.status.damageReduction) < bear.hp) {
    bear.abilityUsed = true;
    victim = bear;
    blog(state, `${unitName(bear)} przejmuje atak (Opiekun Gaju).`, 'ability');
  }
  if (victim.status.shieldArmed) {
    victim.status.shieldArmed = false;
    blog(state, `Tarcza Strażnika chroni: ${unitName(victim)}.`, 'item');
    return;
  }
  if (abilityOf(victim) === 'hardHead' && !victim.abilityUsed && abilityActive(state, victim) && dmg >= 2) {
    victim.abilityUsed = true;
    const ignored = Math.min(4, dmg);
    dmg -= ignored;
    blog(state, `${unitName(victim)} ignoruje ${ignored} obrażeń (Twardogłowy).`, 'ability');
  }
  dmg = Math.max(0, dmg - victim.status.damageReduction);
  b.damageBy[att.id] = (b.damageBy[att.id] ?? 0) + Math.min(dmg, Math.max(0, victim.hp));
  dealDamage(state, victim, dmg, unitName(att));
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
  if (canUse && ab === 'bloodCall' && target.hp >= target.maxHp) throw new Error('Zew Krwi działa tylko na rannego wroga.');

  const targets: BattleUnit[] = [target];
  if (canUse && ab === 'fireBreath') {
    const second = breathSecondTarget(state, u, target);
    if (second) targets.push(second);
  }
  if (canUse && (ab === 'boulder' || ab === 'manyHeads')) {
    const second = secondTargetId ? b.units[secondTargetId] : undefined;
    if (second) {
      if (second.id === target.id || !attackTargets(state, u).some((t) => t.id === second.id)) throw new Error('Nieprawidłowy drugi cel.');
      targets.push(second);
    }
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
        t.status.slowNext += 2;
        blog(state, `${unitName(t)}: −2 S w następnej aktywacji.`, 'ability');
      }
      if (ab === 'curse') {
        t.status.cursedNext += 1;
        blog(state, `${unitName(t)}: −1 A przy następnym ataku.`, 'ability');
      }
    }
  }
  u.status.nextAttackBonus = 0;
  u.status.cursedNext = 0;
  act.attacked = true;
  act.acted = true;
  if (checkBattleEnd(state)) return;
  const hopAbility = ab === 'airDash' || ab === 'nestLeap';
  if (hopAbility && !b.duel && !u.abilityUsed && abilityActive(state, u) && u.alive) {
    act.hop = ab === 'airDash' ? 3 : 4;
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
  u.abilityUsed = true;
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
    for (const ally of livingUnits(b, u.side)) ally.status.nextAttackBonus += 1;
  } else if (ab === 'giftOfLife') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side !== u.side) throw new Error('Wybierz żyjącego sojusznika.');
    t.hp = Math.min(t.maxHp, t.hp + 3);
  } else if (ab === 'web') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side === u.side || distance(parseKey(u.pos!), parseKey(t.pos!)) > 4) throw new Error('Wybierz wroga w zasięgu 4 pól.');
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
    const spot = arenaCell(4, side === b.attacker ? 4 : 5);
    return unitAt(b, spot) ? null : spot;
  }
  const col = side === b.attacker ? 0 : ARENA_COLS - 1;
  const obstacles = new Set(b.obstacles);
  for (const row of [4, 3, 5, 2, 6, 1, 7, 0, 8]) {
    const k = arenaCell(row, col);
    if (!obstacles.has(k) && !unitAt(b, k)) return k;
  }
  return null;
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

export function offsetOf(k: HexKey) {
  return hexToOffset(parseKey(k));
}
