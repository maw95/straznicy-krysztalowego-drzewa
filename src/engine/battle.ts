// Battle engine: the painted arena (13 columns, 85 cells), initiative, movement, attacks,
// abilities and items. Functions change the GameState passed in.

import { ABILITY, battleStats, DIGITAL_RANGED_BONUS, FACTION_NAMES, ITEM_EFFECT, ITEMS, UNITS, type AbilityId, type FactionId, type ItemKind, type Side } from './data';
import { distance, directionBetween, add, key, line, neighborKeys, parseKey, type HexKey } from './hex';
import { log } from './log';
import { Rng } from './rng';
import { isDigital, type BattleState, type BattleUnit, type GameState, type UnitStatus } from './types';

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

export function arenaObstacles(arena: ArenaId, layout?: 'wide'): HexKey[] {
  return layout === 'wide' ? wideObstacleGroups(arena).flatMap((g) => g.cells) : ARENA_OBSTACLES[arena].map(([c, h]) => arenaCell(c, h));
}

const ARENA_SET = new Set(ARENA_CELLS);
export const inArena = (k: HexKey) => ARENA_SET.has(k);

// ---------------------------------------------------------------- the digital arena ("wide")
// Pointy-topped hexes in horizontal rows, like Heroes III: 13 columns × 9 rows, odd rows shifted half a cell to the right
// (axial q = col − ⌊row / 2⌋). Units fit side by side in a row, so a large unit is simply two neighbours in one row.

export const WIDE_COLUMNS = 13;
export const WIDE_ROWS = 9;
export const WIDE_MIDDLE_ROW = 4;

export const wideCell = (col: number, row: number): HexKey => key({ q: col - (row - (row & 1)) / 2, r: row });

/** Column and row of a cell of the wide arena. */
export function wideCellOf(k: HexKey): { col: number; row: number } {
  const h = parseKey(k);
  return { col: h.q + (h.r - (h.r & 1)) / 2, row: h.r };
}

const WIDE_CELLS: readonly HexKey[] = Object.freeze(Array.from({ length: WIDE_ROWS }, (_, row) => Array.from({ length: WIDE_COLUMNS }, (_, col) => wideCell(col, row))).flat());
const WIDE_SET = new Set(WIDE_CELLS);

/** One obstacle of a wide arena: one or two neighbouring cells [col, row] (side by side in a row, or on a slant across two rows) and the name of its picture (public/assets/arena/cyfrowa). */
export interface ObstacleGroup {
  art: string;
  cells: Array<[number, number]>;
}

/**
 * Obstacles of the wide arenas. The start columns 0 and 12 and the columns next to them (where a large unit's head lies) stay
 * free, every free cell stays reachable (tests), and no picture repeats on one arena.
 */
export const WIDE_OBSTACLES: Record<ArenaId, ObstacleGroup[]> = {
  dawn: [
    { art: 'log', cells: [[3, 1], [4, 1]] },
    { art: 'wall', cells: [[8, 6], [8, 7]] },
    { art: 'ridge', cells: [[5, 4], [6, 4]] },
    { art: 'boulders', cells: [[9, 2]] },
    { art: 'ruin', cells: [[3, 6]] },
    { art: 'pine', cells: [[10, 5]] },
    { art: 'brambles', cells: [[7, 1]] },
    { art: 'statue', cells: [[6, 7]] },
  ],
  horde: [
    { art: 'bones', cells: [[3, 2], [4, 2]] },
    { art: 'barricade', cells: [[9, 5], [9, 6]] },
    { art: 'siegecart', cells: [[5, 5], [6, 5]] },
    { art: 'spires', cells: [[9, 3]] },
    { art: 'deadtree', cells: [[2, 6]] },
    { art: 'crystals', cells: [[6, 2]] },
    { art: 'totem', cells: [[10, 5]] },
  ],
};

/** The obstacle groups of a wide arena with their cells as keys (for drawing). */
export const wideObstacleGroups = (arena: ArenaId): Array<{ art: string; cells: HexKey[] }> =>
  WIDE_OBSTACLES[arena].map((g) => ({ art: g.art, cells: g.cells.map(([c, r]) => wideCell(c, r)) }));

/** Every cell of the arena of this battle (shared: never change the list). */
export const layoutCells = (b: Pick<BattleState, 'layout'>): readonly HexKey[] => (b.layout === 'wide' ? WIDE_CELLS : ARENA_CELLS);
export const inLayout = (b: Pick<BattleState, 'layout'>, k: HexKey): boolean => (b.layout === 'wide' ? WIDE_SET : ARENA_SET).has(k);

/** How far a cell lies from the middle row (the rows next to it first): the order units are deployed in. */
export function middleDistance(b: Pick<BattleState, 'layout'>, k: HexKey): number {
  return b.layout === 'wide' ? Math.abs(wideCellOf(k).row - WIDE_MIDDLE_ROW) : Math.abs(cellOf(k).half - MIDDLE_HALF);
}

/** Cells of one column of the wide arena, from the middle row outwards. */
function wideColumnCells(col: number): HexKey[] {
  return Array.from({ length: WIDE_ROWS }, (_, row) => row)
    .sort((a, b) => Math.abs(a - WIDE_MIDDLE_ROW) - Math.abs(b - WIDE_MIDDLE_ROW) || a - b)
    .map((row) => wideCell(col, row));
}

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
function placeUnit(state: GameState, u: BattleUnit, head: HexKey, tail?: HexKey): boolean {
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
function fitsAt(state: GameState, u: BattleUnit, head: HexKey): boolean {
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

export function newStatus(): UnitStatus {
  return { slowNext: 0, rootedNext: false, cursedNext: 0, nextAttackBonus: 0, battleAttackBonus: 0, battleSpeedBonus: 0, damageReduction: 0, shieldArmed: false };
}

export function makeBattleUnit(defId: string, side: Side, digital = false, scale = 1): BattleUnit {
  const { hp } = battleStats(defId, digital, scale);
  return { id: defId, defId, side, hp, maxHp: hp, ...(digital ? { digital: true as const } : {}), ...(scale !== 1 ? { scale } : {}), pos: null, alive: true, abilityUsed: false, swappedOut: false, status: newStatus() };
}

const unitName = (u: BattleUnit) => UNITS[u.defId].name;

// ---------------------------------------------------------------- queries

export function abilityActive(state: GameState): boolean {
  return state.rules.abilities;
}

export function abilityOf(u: BattleUnit): AbilityId {
  return u.ability ?? UNITS[u.defId].ability;
}

export function livingUnits(b: BattleState, side?: Side): BattleUnit[] {
  return Object.values(b.units).filter((u) => u.alive && u.pos !== null && (side === undefined || u.side === side));
}

export function unitAt(b: BattleState, k: HexKey): BattleUnit | undefined {
  return Object.values(b.units).find((u) => u.alive && (u.pos === k || u.tail === k));
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
  return battleStats(u.defId, u.digital, u.scale).speed + u.status.battleSpeedBonus;
}

export function unitAttackBase(u: BattleUnit): number {
  return battleStats(u.defId, u.digital, u.scale).attack + u.status.battleAttackBonus;
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
  const units = occupancy(b, u);
  const dist = new Map<HexKey, number>([[u.pos!, 0]]);
  const parent = new Map<HexKey, HexKey>();
  const queue = [u.pos!];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    const d = dist.get(cur)!;
    if (d >= range) continue;
    for (const n of neighborKeys(cur)) {
      if (!inLayout(b, n) || obstacles.has(n) || dist.has(n)) continue;
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
  const units = occupancy(b, u);
  const occupant = (k: HexKey) => units.get(k);
  // A large unit needs room for its tail as well: the head may only go where some tail cell is free.
  const large = isLarge(state, u);
  const roomy = (k: HexKey) => !large || tailOptions(b, u, k, units).length > 0;
  if (UNITS[u.defId].movement === 'fly') {
    for (const k of layoutCells(b)) {
      if (k === u.pos || obstacles.has(k) || occupant(k)) continue;
      const d = distance(parseKey(u.pos), parseKey(k));
      if (d <= range && roomy(k)) out.set(k, d);
    }
    return out;
  }
  for (const [k, d] of walkSearch(state, u).dist) if (d > 0 && !occupant(k) && roomy(k)) out.set(k, d);
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

/** Obstacles block a shot; units standing in the way do not, unless `rules.unitsBlockSight` is on. */
export function hasLineOfSight(state: GameState, from: HexKey, to: HexKey): boolean {
  const b = state.battle!;
  const obstacles = obstacleSet(b);
  const between = cellsBetween(from, to);
  if (between.some((k) => obstacles.has(k))) return false;
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

/** Legal attack targets from the unit's current position. */
export function attackTargets(state: GameState, u: BattleUnit, from: HexKey | null = u.pos): BattleUnit[] {
  const b = state.battle!;
  if (!from) return [];
  const enemies = enemiesOf(b, u);
  const mine = footprintAt(state, u, from);
  const near = enemies.filter((e) => cellsOf(e).some((c) => mine.some((m) => adjacent(m, c))));
  if (UNITS[u.defId].attackType === 'melee') return near;
  if (near.length) return near;
  return enemies.filter((e) => cellsOf(e).some((c) => hasLineOfSight(state, from, c)));
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
  return other && other.id !== first.id && other.side !== u.side ? other : null;
}

/** Expected damage of a plain attack, before the defender's reactions. */
export function attackDamage(state: GameState, att: BattleUnit, target: BattleUnit, useAbility: boolean, movedDistance: number): number {
  let dmg = unitAttackBase(att) + att.status.nextAttackBonus - att.status.cursedNext;
  if (isDigital(state.rules) && UNITS[att.defId].attackType === 'ranged') dmg += DIGITAL_RANGED_BONUS * scaleOf(state);
  if (abilityActive(state)) {
    const ab = abilityOf(att);
    if (ab === 'lightCharge' && movedDistance >= ABILITY.lightChargeMinMove) dmg += ABILITY.lightChargeBonus * scaleOf(state);
    if (ab === 'bloodCall' && target.hp < target.maxHp) dmg += ABILITY.bloodCallBonus * scaleOf(state);
    if (useAbility && ab === 'nightAmbush') dmg += ABILITY.nightAmbushBonus * scaleOf(state);
  }
  return Math.max(0, dmg);
}

/** Abilities that are switched on for a single attack. */
export const ATTACK_ABILITIES: AbilityId[] = ['entanglingRoots', 'fireBreath', 'curse', 'nightAmbush'];
/** Guardian abilities work on every attack, with no once-per-battle limit. */
export const UNLIMITED_ABILITIES: AbilityId[] = ['duckFury', 'boulder', 'nestLeap', 'manyHeads', 'stoneSkin', 'thiefClaw', 'regrowth'];

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
export const FREE_ABILITIES: AbilityId[] = ['sunburst', 'giftOfLife', 'web'];

// ---------------------------------------------------------------- lifecycle

/** After support selection: default placement, then each faction may rearrange (attacker first). */
export function startBattleFight(state: GameState) {
  const b = state.battle!;
  deploy(state);
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

export function deployUnits(state: GameState, faction: FactionId, positions: Record<string, HexKey>) {
  const b = state.battle!;
  if (b.stage !== 'deploy' || b.needsDeploy[0] !== faction) throw new Error('Teraz nie ustawia ta frakcja.');
  const own = Object.values(b.units).filter((u) => u.side === faction);
  const allowed = new Set(deployCells(b, faction));
  // Cells already taken by the other side count too (a large unit's head reaches into the next column).
  const used = new Set<HexKey>(Object.values(b.units).filter((u) => u.side !== faction).flatMap(cellsOf));
  const placed = new Map<string, { pos: HexKey; tail?: HexKey }>();
  // First every unit claims its own cell (a large one its tail); only then the large ones pick a head, so a head never takes a cell someone chose.
  const cellFor = new Map<string, HexKey>();
  for (const u of own) {
    const k = positions[u.id] ?? deployCellOf(u);
    if (!k || !allowed.has(k)) throw new Error('Jednostki można ustawić tylko w swoich kolumnach startowych.');
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
  b.needsDeploy.shift();
  log(state, 'battle', `${FACTION_NAMES[faction]} ustawia swoje jednostki.`);
  if (!b.needsDeploy.length) beginFight(state);
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
      if (isLarge(state, u)) {
        // Tail on the deploy cell, head one column towards the enemy (first free of the two).
        const head = deployHeads(b, side, cells[i]).find((c) => !taken.has(c));
        u.tail = cells[i];
        u.pos = head ?? cells[i];
        if (!head) delete u.tail;
        taken.add(u.pos);
        if (u.tail) taken.add(u.tail);
      } else {
        u.pos = cells[i];
        delete u.tail;
        taken.add(cells[i]);
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
    const hp = (side: Side) => livingUnits(b, side).reduce((a, x) => a + x.hp, 0);
    const loser = hp(b.attacker) >= hp(b.defender) ? b.defender : b.attacker;
    log(state, 'battle', 'Bitwa trwa zbyt długo — strona z mniejszą sumą Ż przegrywa.');
    for (const x of livingUnits(b, loser)) {
      x.alive = false;
      removeFromBoard(state, x, false);
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
  const u = b.units[unitId];
  if (abilityOf(u) === 'regrowth' && abilityActive(state) && u.hp < u.maxHp) {
    const healed = Math.min(ABILITY.regrowthHeal * scaleOf(state), u.maxHp - u.hp);
    u.hp += healed;
    log(state, 'ability', `${unitName(u)} odzyskuje ${healed} Ż (Odrastające Głowy).`);
  }
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
  return v * scaleOf(state);
}

export function dealDamage(state: GameState, target: BattleUnit, amount: number, source: string) {
  const dmg = Math.max(0, amount);
  target.hp -= dmg;
  log(state, 'damage', `${source} → ${unitName(target)}: ${dmg} obrażeń (Ż ${Math.max(0, target.hp)}/${target.maxHp}).`);
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    removeFromBoard(state, target, true);
    log(state, 'death', `${unitName(target)} poległ(a).`);
  }
}

/** Opiekun Gaju: whether `bear` can still take the blow aimed at `x` (itself, or an ally next to it). */
export function bearCanGuard(state: GameState, bear: BattleUnit, x: BattleUnit): boolean {
  if (abilityOf(bear) !== 'guardian' || bear.abilityUsed || !abilityActive(state)) return false;
  return bear.id === x.id || (!!bear.pos && !!x.pos && unitsAdjacent(bear, x));
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
  if (bear && dmg >= target.hp && dmg - ABILITY.guardianIgnore * scaleOf(state) - Math.min(dmg, bear.status.damageReduction) < bear.hp) {
    bearGuard = 'ally';
    victim = bear;
    dmg = Math.max(0, dmg - ABILITY.guardianIgnore * scaleOf(state));
  }
  if (victim.status.shieldArmed) return { base, victim, damage: 0, bearGuard, hardHead: null, shield: true, lethal: false };
  // Opiekun Gaju guards the bear itself too: a lethal blow loses part of its strength.
  if (victim === target && bearCanGuard(state, victim, victim) && dmg >= victim.hp) {
    bearGuard = 'self';
    dmg = Math.max(0, dmg - ABILITY.guardianIgnore * scaleOf(state));
  }
  let hardHead: number | null = null;
  if (abilityOf(victim) === 'hardHead' && !victim.abilityUsed && abilityActive(state) && dmg >= HARD_HEAD_MIN_DAMAGE * scaleOf(state)) {
    hardHead = Math.min(ABILITY.hardHeadIgnore * scaleOf(state), dmg);
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
  if (state.rules.useDice) log(state, 'damage', `Rzut kością: ${die > 0 ? `+${die}` : die < 0 ? `−${-die}` : '0'} (${p.base} ${die < 0 ? '−' : '+'} ${Math.abs(die)} = ${Math.max(0, p.base + die)}).`);
  const victim = p.victim;
  if (p.bearGuard === 'ally') {
    victim.abilityUsed = true;
    log(state, 'ability', `${unitName(victim)} przejmuje atak i ignoruje ${ABILITY.guardianIgnore * scaleOf(state)} obrażenia (Opiekun Gaju).`);
  }
  if (p.shield) {
    victim.status.shieldArmed = false;
    log(state, 'item', `Tarcza Strażnika chroni: ${unitName(victim)}.`);
    recordRoll(state, att, victim, p.base, die, 0);
    return;
  }
  if (p.bearGuard === 'self') {
    victim.abilityUsed = true;
    log(state, 'ability', `${unitName(victim)} ignoruje ${ABILITY.guardianIgnore * scaleOf(state)} obrażenia (Opiekun Gaju).`);
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

export function battleMove(state: GameState, to: HexKey, tail?: HexKey) {
  const b = state.battle!;
  const act = b.activation!;
  const u = b.units[act.unitId];
  if (act.moved || act.attacked) throw new Error('Ta jednostka już się ruszyła.');
  const cells = reachableCells(state, u);
  const steps = cells.get(to);
  if (steps === undefined) throw new Error('Pole poza zasięgiem ruchu.');
  if (tail && isLarge(state, u) && !tailOptions(b, u, to).includes(tail)) throw new Error('Ogon nie zmieści się na tym polu.');
  placeUnit(state, u, to, tail);
  act.moved = true;
  act.acted = true;
  act.movedDistance = steps;
  // Digital ruleset: moving without attacking ends the turn, so a shooter cannot move and shoot, and a melee unit keeps its turn
  // only when its move brought an enemy within reach (the attack that follows is the other half of the same click).
  if (act.moveOnly || !canAttackAfterMove(state, u) || (isDigital(state.rules) && attackTargets(state, u).length === 0)) endActivation(state);
}

/** Whether the unit may still attack after moving: always in the classic rules, not for shooters in the digital ruleset. */
export function canAttackAfterMove(state: GameState, u: BattleUnit): boolean {
  return !isDigital(state.rules) || UNITS[u.defId].attackType !== 'ranged';
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
  const canUse = useAbility && !u.abilityUsed && abilityActive(state) && ATTACK_ABILITIES.includes(ab);
  if (useAbility && !canUse) throw new Error('Zdolność jest niedostępna.');

  const targets: BattleUnit[] = [target];
  if (canUse && ab === 'fireBreath') {
    const second = breathSecondTarget(state, u, target);
    if (second) targets.push(second);
  }
  if (secondTargetId && !(canUse && ab === 'fireBreath')) {
    const second = b.units[secondTargetId];
    if (!canHitTwo(state, u)) throw new Error('Ta jednostka atakuje jeden cel.');
    if (!second || second.id === target.id || !unitsAdjacent(u, target) || !unitsAdjacent(u, second) || !legal.some((t) => t.id === second.id)) {
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
    const before = t.hp;
    resolveAttack(state, u, t, canUse, act.movedDistance);
    if (ab === 'thiefClaw' && abilityActive(state) && t.hp < before && u.hp < u.maxHp) {
      u.hp = Math.min(u.maxHp, u.hp + ABILITY.thiefClawHeal * scaleOf(state));
      log(state, 'ability', `${unitName(u)} odzyskuje ${ABILITY.thiefClawHeal * scaleOf(state)} Ż (Złodziejski Szpon).`);
    }
    if (canUse && t.alive) {
      if (ab === 'entanglingRoots') {
        t.status.slowNext += ABILITY.rootsSlow;
        log(state, 'ability', `${unitName(t)}: −${ABILITY.rootsSlow} S w następnej aktywacji.`);
      }
      if (ab === 'curse') {
        t.status.cursedNext += ABILITY.curseMinus * scaleOf(state);
        log(state, 'ability', `${unitName(t)}: −${ABILITY.curseMinus * scaleOf(state)} A przy następnym ataku.`);
      }
    }
    // No pushing in a duel: nobody moves there, so the two leaders would never meet again.
    // Large units (digital ruleset) are too heavy to push.
    if (ab === 'boulder' && t.alive && !t.tail && !b.duel && abilityActive(state)) {
      const from = cellsOf(u).reduce((a, c) => (distance(parseKey(c), parseKey(t.pos!)) < distance(parseKey(a), parseKey(t.pos!)) ? c : a));
      const to = pushCell(state, from, t.pos!);
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
  // Kacza Furia: a kill gives the duck another full activation right away.
  if (ab === 'duckFury' && abilityActive(state) && u.alive && targets.some((t) => !t.alive)) {
    b.extra.unshift({ unitId: u.id, moveOnly: false });
    log(state, 'ability', `${unitName(u)} wpada w szał i aktywuje się ponownie (${UNITS[u.defId].abilityName}).`);
  }
  const hopAbility = ab === 'airDash' || ab === 'nestLeap';
  if (hopAbility && !b.duel && (!u.abilityUsed || ab === 'nestLeap') && abilityActive(state) && u.alive) {
    act.hop = ab === 'airDash' ? ABILITY.airDashRange : ABILITY.nestLeapRange;
    return;
  }
  endActivation(state);
}

export function hopCells(state: GameState, u: BattleUnit, range: number): HexKey[] {
  const b = state.battle!;
  const obstacles = obstacleSet(b);
  const units = occupancy(b, u);
  return layoutCells(b).filter((k) => !obstacles.has(k) && !units.has(k) && u.pos && distance(parseKey(u.pos), parseKey(k)) <= range && k !== u.pos && fitsAt(state, u, k));
}

export function battleHop(state: GameState, to: HexKey) {
  const b = state.battle!;
  const act = b.activation!;
  const u = b.units[act.unitId];
  if (!act.hop) throw new Error('Odskok jest niedostępny.');
  if (!hopCells(state, u, act.hop).includes(to)) throw new Error('Pole poza zasięgiem odskoku.');
  placeUnit(state, u, to);
  if (!UNLIMITED_ABILITIES.includes(abilityOf(u))) u.abilityUsed = true;
  act.hop = 0;
  log(state, 'ability', `${unitName(u)} odskakuje (${UNITS[u.defId].abilityName}).`);
  endActivation(state);
}

export function battleAbility(state: GameState, targetId?: string) {
  const b = state.battle!;
  const u = b.units[b.activation!.unitId];
  const ab = abilityOf(u);
  if (u.abilityUsed || !abilityActive(state) || !FREE_ABILITIES.includes(ab)) throw new Error('Zdolność jest niedostępna.');
  if (ab === 'sunburst') {
    for (const ally of livingUnits(b, u.side)) ally.status.nextAttackBonus += ally.id === u.id ? ABILITY.sunburstSelfBonus * scaleOf(state) : ABILITY.sunburstBonus * scaleOf(state);
  } else if (ab === 'giftOfLife') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side !== u.side) throw new Error('Wybierz żyjącego sojusznika.');
    t.hp = Math.min(t.maxHp, t.hp + ABILITY.giftOfLifeHeal * scaleOf(state));
  } else if (ab === 'web') {
    const t = targetId ? b.units[targetId] : undefined;
    if (!t || !t.alive || t.side === u.side || unitDistance(u, t) > ABILITY.webRange) throw new Error(`Wybierz wroga w zasięgu ${ABILITY.webRange} pól.`);
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

function freeCellNear(state: GameState, side: Side, u?: BattleUnit): HexKey | null {
  const b = state.battle!;
  if (b.duel) {
    const spot = duelSpot(b, side);
    return unitAt(b, spot) ? null : spot;
  }
  return deployCells(b, side).find((k) => !unitAt(b, k) && (!u || fitsAt(state, u, k))) ?? null;
}

/** The free arena cell closest to `from` (ties: arena order), for a unit that stands up where something else stands. */
function nearestFreeCell(state: GameState, u: BattleUnit, from: HexKey): HexKey | null {
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
    // Digital ruleset: the fallen unit lies where it fell, so it stands up there (or on the nearest free cell).
    const fallen = isDigital(use.state.rules) && t.corpse ? t.corpse : null;
    const cell =
      args.to && !unitAt(b, args.to) && !b.obstacles.includes(args.to) && fitsAt(use.state, t, args.to)
        ? args.to
        : fallen
          ? nearestFreeCell(use.state, t, fallen)
          : freeCellNear(use.state, faction, t);
    if (!cell) throw new Error('Brak wolnego pola.');
    t.alive = true;
    t.hp = t.maxHp;
    placeUnit(use.state, t, cell, cell === fallen ? t.corpseTail : undefined);
    delete t.corpse;
    delete t.corpseTail;
  },
  heal: (use) => {
    const t = ownLiving(use, use.args.targetId);
    t.hp = Math.min(t.maxHp, t.hp + ITEM_EFFECT.heal * scaleOf(use.state));
  },
  seed: ({ state, b, faction }) => {
    for (const t of livingUnits(b, faction)) t.hp = Math.min(t.maxHp, t.hp + ITEM_EFFECT.seedHeal * scaleOf(state));
  },
  damage_scroll: (use) => dealDamage(use.state, enemyUnit(use, use.args.targetId), ITEM_EFFECT.scrollDamage * scaleOf(use.state), use.name),
  lightning: (use) => {
    const { args } = use;
    const ids = [...new Set(args.targetIds ?? (args.targetId ? [args.targetId] : []))].slice(0, ITEM_EFFECT.lightningTargets);
    if (!ids.length) throw new Error('Wybierz do dwóch wrogów.');
    for (const id of ids) dealDamage(use.state, enemyUnit(use, id), ITEM_EFFECT.lightningDamage * scaleOf(use.state), use.name);
  },
  sword: (use) => void (ownLiving(use, use.args.targetId).status.battleAttackBonus += ITEM_EFFECT.swordAttack * scaleOf(use.state)),
  shield: (use) => void (ownLiving(use, use.args.targetId).status.shieldArmed = true),
  vitality: (use) => {
    const t = ownLiving(use, use.args.targetId);
    t.maxHp += ITEM_EFFECT.vitalityHp * scaleOf(use.state);
    t.hp += ITEM_EFFECT.vitalityHp * scaleOf(use.state);
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
    if (!placeUnit(use.state, t, to)) throw new Error('Jednostka nie zmieści się na tym polu.');
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
    const nu = makeBattleUnit(reserve, faction, Boolean(t.digital), t.scale ?? 1);
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
