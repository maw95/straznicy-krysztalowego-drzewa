// Adventure-map AI: the coop evil automaton (spec section 7) and simple bots
// for player seats. Both only use information visible on the map.

import { FACTION_SUPPORTS, ITEM_EFFECT, SUPPORTS_PER_BATTLE, UNITS, type FactionId } from '../data';
import { distance, parseKey, type Hex, type HexKey } from '../hex';
import { mapNeighbors, shortestPaths, tileCost, treeKey, type PathResult } from '../map';
import { activeHero, currentActor, defenderAt, heroesAt, legalHeroMoves, livingHeroes, other, reviveSpots, ritualFormed, ritualSpot } from '../game';
import type { Action, Crystal, GameState, HeroState } from '../types';

/** The adventure bots' judgement in numbers (tuned with simulations; changing one changes the games). */
const AI_TUNING = {
  /** Strength ratio needed to attack an enemy hero, in arena battles and in duels on the board (see huntRatio). */
  huntRatioArena: 1.1,
  huntRatioDuel: 1.6,
  /** An enemy this much stronger (ratio below it) is one to keep away from. */
  avoidRatio: 0.85,
  /** Extra path cost next to such an enemy, and two steps from it. */
  dangerNext: 4,
  dangerTwoSteps: 2,
  /** Shooters count this much more in a team's attack (they hit from afar). */
  rangedAttack: 1.3,
  /** Choosing the best supports: Atak weighs this much against Życie, and a shooter gets a bonus. */
  supportAttackWeight: 1.5,
  supportRangedBonus: 2,
  /** Share of the round limit after which the Przymierze stops waiting (isDesperate). */
  desperateAfter: 0.75,
  /** Przymierze: treasures within this many hexes are worth a detour (1 when desperate), at this extra cost. */
  treasureDetour: 4,
  treasureDetourCost: 1.5,
  /** Exploring: weight of the hidden hexes where a lair may be, cost of a frontier hex an ally is nearer to, and a treasure's score. */
  lairWeight: 0.6,
  crowdCost: 3,
  treasureFrontier: 0.5,
  /** Horde bot: it races a carrier to the Tree when its way there is at most this many times the carrier's distance. */
  raceToTree: 1.5,
  /** Horde bot: the Tree counts this much further away than it is (it prefers hunting). */
  treeExtra: 2,
};

function knownCost(state: GameState, k: HexKey): number | null {
  const t = state.tiles[k];
  // Hidden hexes are assumed passable at cost 1 (spec 7: the AI knows only revealed tiles).
  return t.revealed ? tileCost(t) : 1;
}

/**
 * What a bot works out again and again while it makes one decision. The state does not change
 * while it decides, so the answers are kept for that decision (and thrown away after it).
 */
class Memo {
  private strengths = new Map<string, number>();
  private held = new Map<string, Set<HexKey>>();
  private dangers = new Map<string, Hex[]>();
  private walks = new Map<string, Map<HexKey, PathResult>>();

  constructor(readonly state: GameState) {}

  teamStrength(f: FactionId, heroId: string): number {
    const k = `${f}:${heroId}`;
    let v = this.strengths.get(k);
    if (v === undefined) this.strengths.set(k, (v = teamStrength(this.state, f, heroId)));
    return v;
  }

  /**
   * Strength ratio of `a` against `b` (above 1: a is stronger). When several heroes share b's
   * hex, the one the engine sends to fight (the one with the most Życie) is the one that counts.
   */
  ratio(a: HeroState, b: HeroState): number {
    const defender = defenderAt(this.state, b.pos, a.faction) ?? b;
    return this.teamStrength(a.faction, a.id) / Math.max(1, this.teamStrength(defender.faction, defender.id));
  }

  /** One hero per hex: a hex held by an ally is closed to walk on (except the faction's own base). */
  heldByAlly(hero: HeroState, k: HexKey): boolean {
    let held = this.held.get(hero.id);
    if (!held) {
      held = new Set();
      for (const h of Object.values(this.state.heroes)) {
        if (h.alive && !h.entering && h.faction === hero.faction && h.id !== hero.id && this.state.tiles[h.pos].home !== hero.faction) held.add(h.pos);
      }
      this.held.set(hero.id, held);
    }
    return held.has(k);
  }

  /**
   * Extra path cost near enemies the hero would rather not meet: a hex next to a clearly
   * stronger enemy, or two steps from it (it could walk up and attack next turn).
   */
  dangerCost(hero: HeroState, k: HexKey): number {
    let near = this.dangers.get(hero.id);
    if (!near) {
      near = Object.values(this.state.heroes)
        .filter((e) => e.alive && e.faction !== hero.faction && this.ratio(hero, e) < AI_TUNING.avoidRatio)
        .map((e) => parseKey(e.pos));
      this.dangers.set(hero.id, near);
    }
    let extra = 0;
    const at = parseKey(k);
    for (const e of near) {
      const d = distance(e, at);
      if (d <= 1) extra = Math.max(extra, AI_TUNING.dangerNext);
      else if (d === 2) extra = Math.max(extra, AI_TUNING.dangerTwoSteps);
    }
    return extra;
  }

  /**
   * Cheapest walks of `hero` from `from` (its own hex unless given) with walkCost(opts), worked out
   * once per decision for each start and kind of walk (`kind` names the options).
   */
  paths(hero: HeroState, kind: string, opts: WalkOptions, from: HexKey = hero.pos): Map<HexKey, PathResult> {
    const k = `${from}|${kind}`;
    let p = this.walks.get(k);
    if (!p) this.walks.set(k, (p = shortestPaths(this.state.tiles, from, walkCost(this, hero, opts))));
    return p;
  }
}

interface WalkOptions {
  /** Hexes the hero means to reach: a guardian or an enemy standing there is the point, and they cost no danger. */
  goals?: Set<HexKey>;
  /** Crystal hexes still guarded are closed (unless they are goals). Off for a plain distance. */
  avoidGuardians?: boolean;
  /** Hexes of enemy heroes the hero would rather not fight are closed (unless they are goals). */
  avoid?: (k: HexKey) => boolean;
  /** Hexes near stronger enemies cost extra (Memo.dangerCost), goals excepted. */
  danger?: boolean;
}

/**
 * What a step onto each hex costs `hero` in a bot's path search: hexes held by allies are closed,
 * hidden ones count as passable (knownCost), the rest as `opts` says.
 */
function walkCost(memo: Memo, hero: HeroState, opts: WalkOptions): (k: HexKey) => number | null {
  const state = memo.state;
  return (k) => {
    if (memo.heldByAlly(hero, k)) return null;
    const goal = opts.goals?.has(k) ?? false;
    if (!goal && opts.avoid?.(k)) return null;
    const t = state.tiles[k];
    if (opts.avoidGuardians && !goal && t.crystalId && state.crystals[t.crystalId].guardian) return null;
    const c = knownCost(state, k);
    return c === null || goal || !opts.danger ? c : c + memo.dangerCost(hero, k);
  };
}

/** Horde: on the Tree, or next to it while another Horde hero holds the Tree. */
function inRitualPlace(state: GameState, hero: HeroState): boolean {
  return ritualSpot(state, hero) === hero.pos;
}

function stepToward(state: GameState, path: HexKey[]): Action {
  const next = path[1];
  const move = next ? legalHeroMoves(state).find((m) => m.to === next) : undefined;
  return move ? { type: 'moveHero', to: next } : { type: 'endTurn' };
}

/**
 * Rough battle strength of a hero with its two best supports (Lanchester's square law:
 * total Życie × total Atak; shooters count a little more, as they hit from afar).
 */
export function teamStrength(state: GameState, f: FactionId, heroId: string): number {
  // In a duel on the board the heroes fight alone.
  const supports = state.setup.battleMode === 'board' ? [] : state.factions[f].supportsAlive.slice().sort((a, b) => unitValue(b) - unitValue(a)).slice(0, SUPPORTS_PER_BATTLE);
  const team = [heroId, ...supports];
  const hp = team.reduce((a, id) => a + UNITS[id].hp, 0);
  const atk = team.reduce((a, id) => a + UNITS[id].attack * (UNITS[id].attackType === 'ranged' ? AI_TUNING.rangedAttack : 1), 0);
  return hp * atk;
}

const unitValue = (id: string) => UNITS[id].hp + UNITS[id].attack * AI_TUNING.supportAttackWeight + (UNITS[id].attackType === 'ranged' ? AI_TUNING.supportRangedBonus : 0);

/**
 * Player bots go after an enemy hero only with a clear edge: the defender acts first on
 * Speed ties, and in a duel on the board that first blow often decides.
 */
const huntRatio = (state: GameState) => (state.setup.battleMode === 'board' ? AI_TUNING.huntRatioDuel : AI_TUNING.huntRatioArena);

// ------------------------------------------------------------------ evil

function evilAction(state: GameState, memo: Memo): Action {
  const hero = activeHero(state)!;
  // Treasures are shared by the faction, the automaton's included: it revives its fallen.
  const item = mapItemAction(state);
  if (item) return item;
  // Evil heroes standing on the Tree (or by it for the ritual) stay there instead of chasing.
  if (inRitualPlace(state, hero)) return { type: 'endTurn' };
  const goodHeroes = livingHeroes(state, 'dawn');
  // 1. Attack an adjacent good hero.
  const adjacent = goodHeroes.find((g) => distance(parseKey(g.pos), parseKey(hero.pos)) === 1);
  if (adjacent) {
    const move = legalHeroMoves(state).find((m) => m.to === adjacent.pos);
    if (move) return { type: 'moveHero', to: adjacent.pos };
  }
  // 2–4. Head for the closer of: nearest good hero, the Tree. Ties go to the hero.
  const goodSpots = new Set(goodHeroes.map((g) => g.pos));
  const paths = memo.paths(hero, 'evil', { avoidGuardians: true });
  let target: { cost: number; path: HexKey[] } | null = null;
  for (const spot of goodSpots) {
    const p = paths.get(spot);
    if (p && (!target || p.cost < target.cost)) target = p;
  }
  const spot = ritualSpot(state, hero);
  const toTree = spot ? paths.get(spot) : undefined;
  if (toTree && (!target || toTree.cost < target.cost)) target = toTree;
  if (!target) return { type: 'endTurn' };
  return stepToward(state, target.path);
}

// ------------------------------------------------------------------ items

/** Map treasures a player's bot uses at once: bring back the dead, then scout. */
function mapItemAction(state: GameState): Action | null {
  const hero = activeHero(state)!;
  const f = state.factions[hero.faction];
  for (const id of f.inventory) {
    const item = state.items[id];
    if (item.kind === 'resurrection') {
      const dead = Object.values(state.heroes).find((h) => h.faction === hero.faction && !h.alive);
      const spots = reviveSpots(state, hero);
      if (dead && spots.length) return { type: 'useMapItem', itemId: id, unitId: dead.id, targets: [spots[0]] };
      const deadSupport = FACTION_SUPPORTS[hero.faction].find((s) => f.supportsDead.includes(s));
      if (deadSupport && f.supportsAlive.length < SUPPORTS_PER_BATTLE) return { type: 'useMapItem', itemId: id, unitId: deadSupport };
    }
    if (item.kind === 'map') {
      const hidden = Object.values(state.tiles)
        .filter((t) => !t.revealed)
        .sort((a, b) => distance(parseKey(a.key), parseKey(hero.pos)) - distance(parseKey(b.key), parseKey(hero.pos)))
        .slice(0, ITEM_EFFECT.mapReveal)
        .map((t) => t.key);
      if (hidden.length) return { type: 'useMapItem', itemId: id, targets: hidden };
    }
  }
  return null;
}

/** Revealed treasures the hero could pick up, for bots that go out of their way for them. */
function treasureSpots(state: GameState): HexKey[] {
  return Object.values(state.tiles)
    .filter((t) => t.revealed && t.treasureId)
    .map((t) => t.key);
}

// ------------------------------------------------------------------ good

/** What the Przymierze bot knows while it decides one move: built once, read by every step below. */
class GoodContext {
  readonly treeK = treeKey();
  readonly allies: HeroState[];
  /** Enemy heroes on the board (a reserve still to come in is not). */
  readonly enemies: HeroState[];
  /** The last quarter of the rounds: fights are taken at any odds, detours are cut short. */
  readonly desperate: boolean;
  readonly mp: number;
  readonly roundsLeft: number;
  /** A Horde hero on the Tree; the ritual under way; a Horde hero camping on the Tree without one. */
  readonly ritualHolder: HeroState | undefined;
  readonly ritualOn: boolean;
  readonly camped: boolean;
  private known_?: Crystal[];
  private treasures_?: HexKey[];

  constructor(
    readonly state: GameState,
    readonly memo: Memo,
    readonly hero: HeroState,
  ) {
    this.allies = livingHeroes(state, 'dawn').filter((h) => h.id !== hero.id);
    this.enemies = livingHeroes(state, other(hero.faction)).filter((h) => !h.entering);
    this.desperate = isDesperate(state);
    this.mp = state.rules.heroMovePoints;
    this.roundsLeft = state.roundLimit - state.round + 1;
    this.ritualHolder = this.enemies.find((e) => e.pos === this.treeK);
    this.ritualOn = !!this.ritualHolder && (state.ritual > 0 || ritualFormed(state));
    // A Horde hero camping on the Tree (no ritual yet) wins most fights there: carriers wait
    // nearby and let it come out, unless time is running out. The coop automaton never comes out,
    // so there waiting only wastes rounds.
    this.camped = !!this.ritualHolder && !this.ritualOn && !this.desperate && state.setup.mode !== 'coop';
  }

  nearTree(k: HexKey): number {
    return distance(parseKey(k), parseKey(this.treeK));
  }

  dist(h: HeroState, k: HexKey): number {
    return distance(parseKey(h.pos), parseKey(k));
  }

  /** The defender strikes first, so walking into an enemy needs a real edge (or no time left). */
  strongEnough(e: HeroState): boolean {
    return this.desperate || this.memo.ratio(this.hero, e) >= huntRatio(this.state);
  }

  enemyAt(k: HexKey): HeroState | undefined {
    return this.enemies.find((e) => e.pos === k);
  }

  /** Paths: fights are avoided unless the hex is a goal; hexes next to stronger enemies cost extra. */
  pathsFor(goals: Set<HexKey>): Map<HexKey, PathResult> {
    const avoid = (k: HexKey) => {
      const foe = this.enemyAt(k);
      return !!foe && !this.strongEnough(foe);
    };
    return this.memo.paths(this.hero, `goals ${[...goals].sort().join(' ')}`, { goals, avoid, avoidGuardians: true, danger: !this.desperate });
  }

  /** A step towards the cheapest of `goals` (each costing `extra` more), or null when there is no good one. */
  go(goals: Set<HexKey>, extra: (k: HexKey) => number = () => 0): Action | null {
    const paths = this.pathsFor(goals);
    let best: { cost: number; path: HexKey[] } | null = null;
    for (const g of goals) {
      const p = paths.get(g);
      if (p && p.path.length > 1 && (!best || p.cost + extra(g) < best.cost)) best = { cost: p.cost + extra(g), path: p.path };
    }
    if (!best) return null;
    const next = best.path[1];
    const foe = this.enemyAt(next);
    if (foe && !this.strongEnough(foe) && !goals.has(next)) return null;
    const move = legalHeroMoves(this.state).find((m) => m.to === next);
    if (move) return { type: 'moveHero', to: next };
    // The next hex costs more than the points left this turn: wait and go on next turn, rather
    // than wander off and come back (which never gets anywhere).
    if ((knownCost(this.state, next) ?? 0) > this.state.movePoints) return { type: 'endTurn' };
    return null;
  }

  goToTree(): Action | null {
    return this.go(new Set([this.treeK]));
  }

  /** How far the Tree is from a hex, by the hero's knowledge of the map (anyone's distance, for comparing). */
  treeCostFrom(from: HexKey): number {
    return this.memo.paths(this.hero, 'plain', {}, from).get(this.treeK)?.cost ?? Infinity;
  }

  /** Turns a hero needs to reach the Tree. */
  treeEta(h: HeroState): number {
    return Math.ceil(this.treeCostFrom(h.pos) / this.mp);
  }

  /** Known crystals to collect: revealed, not carried nor delivered, guarded only when the guardian can be taken on. */
  get known(): Crystal[] {
    const canGuardian = canFightGuardian(this.state);
    return (this.known_ ??= Object.values(this.state.crystals).filter((c) => !c.at.startsWith('hero:') && c.at !== 'tree' && this.state.tiles[c.at]?.revealed && (!c.guardian || canGuardian)));
  }

  /** Treasures (they strengthen the team in battle) a short detour away. */
  get treasures(): HexKey[] {
    return (this.treasures_ ??= treasureSpots(this.state).filter((k) => this.dist(this.hero, k) <= (this.desperate ? 1 : AI_TUNING.treasureDetour)));
  }
}

/** 0. One hero per hex: a hero without crystals clears the Tree and the hexes around it while an ally carries one, so the carrier can get in. */
function clearTreeForCarrier(c: GoodContext): Action | null {
  const { hero, treeK } = c;
  if (hero.crystals.length || !(hero.pos === treeK || (c.allies.some((h) => h.crystals.length) && c.nearTree(hero.pos) <= 1))) return null;
  const off = legalHeroMoves(c.state).filter((m) => m.kind === 'move').sort((x, y) => c.nearTree(y.to) - c.nearTree(x.to))[0];
  return off && c.nearTree(off.to) > c.nearTree(hero.pos) ? { type: 'moveHero', to: off.to } : null;
}

/**
 * 1. The Horde's ritual must be broken whatever the odds. A carrier leaves it to an ally without
 *    crystals when that one gets there in time (losing the fight drops the crystals).
 */
function breakRitual(c: GoodContext): Action | null {
  if (!c.ritualOn) return null;
  const ritualLeft = c.state.rules.ritualRounds - c.state.ritual;
  const breaker = c.allies.find((a) => !a.crystals.length && c.treeEta(a) < ritualLeft);
  return !c.hero.crystals.length || !breaker || c.desperate ? c.goToTree() : null;
}

/** 2. A beatable enemy right next to us that stands in the way (or would catch a carrier): strike first. */
function strikeAdjacent(c: GoodContext): Action | null {
  const { hero, state } = c;
  const foe = c.enemies.find((e) => c.dist(hero, e.pos) === 1 && c.memo.ratio(hero, e) >= huntRatio(state));
  return foe && legalHeroMoves(state).some((m) => m.to === foe.pos) ? { type: 'moveHero', to: foe.pos } : null;
}

/** 3. Deliver when the carried crystals finish the job, when time runs out, or when the Tree is within this turn's reach. */
function deliver(c: GoodContext): Action | null {
  const { hero, state } = c;
  if (!hero.crystals.length) return null;
  const inHand = hero.crystals.length + c.allies.reduce((a, h) => a + h.crystals.length, 0);
  const missing = state.crystalsNeeded - state.factions.dawn.delivered;
  const toTree = c.pathsFor(new Set([c.treeK])).get(c.treeK);
  const eta = toTree ? Math.ceil(toTree.cost / c.mp) : 99;
  // Bank what we carry when the Tree is within this turn's reach: a carrier is hunted, and
  // a crystal at the Tree can't be lost any more.
  const bank = toTree !== undefined && toTree.cost < state.movePoints;
  // A Horde hero on the Tree must be beaten first.
  return !c.camped && (inHand >= missing || c.roundsLeft <= eta + 1 || bank) ? c.goToTree() : null;
}

/** 4. Collect: known crystals not carried, each hero taking the ones it is closest to, and treasures on the way. */
function collect(c: GoodContext): Action | null {
  const { hero, known, treasures } = c;
  if (!known.length) return null;
  const mine = known.filter((k) => !c.allies.some((a) => c.dist(a, k.at) < c.dist(hero, k.at)));
  const targets = new Set((mine.length ? mine : known).map((k) => k.at));
  for (const k of treasures) targets.add(k);
  return c.go(targets, (k) => (treasures.includes(k) && !known.some((x) => x.at === k) ? AI_TUNING.treasureDetourCost : 0));
}

/**
 * 5. Explore while crystals are still missing: frontier hexes, the ally exploring elsewhere, and the
 *    half of the map where unfound lairs can be (the Griffin lives on the Przymierze side, the
 *    Cyclops and the Hydra on the Horde side).
 */
function explore(c: GoodContext): Action | null {
  const { hero, state } = c;
  const foundLairs = Object.values(state.crystals).filter((x) => x.at === 'tree' || x.at.startsWith('hero:') || state.tiles[x.at]?.revealed).length;
  if (foundLairs >= state.crystalsNeeded && c.known.length) return null;
  const hiddenOn = (side: 'dawn' | 'horde') => Object.values(state.tiles).filter((t) => !t.revealed && t.side === side).length;
  const sideWeight = { dawn: hiddenOn('dawn') > 0 ? 1 : 0, horde: hiddenOn('horde') > 0 ? 2 : 0 };
  const frontier = new Set<HexKey>();
  const score = new Map<HexKey, number>();
  for (const t of Object.values(state.tiles)) {
    if (!t.revealed || tileCost(t) === null || t.key === hero.pos) continue;
    const hidden = mapNeighbors(state.tiles, t.key).filter((n) => !state.tiles[n].revealed);
    if (!hidden.length) continue;
    frontier.add(t.key);
    const lairChance = hidden.reduce((a, n) => a + sideWeight[state.tiles[n].side], 0);
    const crowd = c.allies.some((a) => c.dist(a, t.key) < c.dist(hero, t.key)) ? AI_TUNING.crowdCost : 0;
    score.set(t.key, -lairChance * AI_TUNING.lairWeight + crowd);
  }
  for (const k of c.treasures) if (!frontier.has(k)) (frontier.add(k), score.set(k, AI_TUNING.treasureFrontier));
  return c.go(frontier, (k) => score.get(k) ?? 0);
}

/** 6. Nothing to find: carry what we have to the Tree. */
function carryHome(c: GoodContext): Action | null {
  return c.hero.crystals.length && !c.camped ? c.goToTree() : null;
}

/** 7. Or wait near the Tree, two hexes short so a carrier can get in. */
function waitNearTree(c: GoodContext): Action | null {
  const near = Object.values(c.state.tiles).filter((t) => t.revealed && tileCost(t) !== null && c.nearTree(t.key) === 2).map((t) => t.key);
  return near.includes(c.hero.pos) ? null : c.go(new Set(near));
}

/** What the hero would do with no clock running: steps 2 to 7 in order, else end the turn. */
function decide(c: GoodContext): Action {
  return strikeAdjacent(c) ?? deliver(c) ?? collect(c) ?? explore(c) ?? carryHome(c) ?? waitNearTree(c) ?? { type: 'endTurn' };
}

/**
 * 1b. Watch the Tree, with the clock: count the move points left before the Horde could finish its
 *     ritual (walk to the Tree, then hold it for the ritual rounds). The Przymierze hero nearest the
 *     Tree may follow its `plan` (explore or collect on the way) only while it can still get back and
 *     strike in time; with no slack left it heads straight for the Tree.
 */
function guardTreeClock(c: GoodContext, plan: Action): Action {
  const { hero, state, mp } = c;
  const horde = c.enemies.filter((e) => e.alive);
  const guard = [hero, ...c.allies].sort((x, y) => c.treeCostFrom(x.pos) - c.treeCostFrom(y.pos))[0] === hero;
  if (!horde.length || !guard || state.rules.ritual === false) return plan;
  const formed = ritualFormed(state);
  const hordeEta = formed ? 0 : Math.max(...horde.map((e) => Math.ceil(Math.max(0, c.treeCostFrom(e.pos) - 1) / mp)));
  // The ritual completes at the end of the round the last Horde hero arrives in, plus the
  // ritual rounds after it; that round counts too (the Horde may move after us).
  const turnsLeft = Math.min(c.roundsLeft, hordeEta + state.rules.ritualRounds - 1 - (formed ? state.ritual : 0));
  const budget = state.movePoints + Math.max(0, turnsLeft - 1) * mp;
  // Reaching the Tree hex needs the path cost plus a turn's worth of slack (unknown terrain,
  // allies or guardians in the way).
  const fits = (from: HexKey, spent: number) => spent + c.treeCostFrom(from) + mp <= budget;
  if (plan.type !== 'moveHero' && plan.type !== 'endTurn') return plan;
  if (plan.type === 'moveHero') {
    const step = legalHeroMoves(state).find((m) => m.to === plan.to);
    if (step && (step.kind !== 'move' || fits(plan.to, step.cost))) return plan;
  } else if (fits(hero.pos, state.movePoints)) return plan;
  return c.goToTree() ?? plan;
}

function goodAction(state: GameState, memo: Memo): Action {
  const hero = activeHero(state)!;
  const item = mapItemAction(state);
  if (item) return item;
  if (state.movePoints <= 0 || state.turnBattleDone) return { type: 'endTurn' };
  const c = new GoodContext(state, memo, hero);
  return clearTreeForCarrier(c) ?? breakRitual(c) ?? guardTreeClock(c, decide(c));
}

/**
 * A Horde player's bot (PvP). Unlike the coop automaton it picks its fights: it attacks
 * heroes it can beat, hunts crystal carriers, and otherwise goes for the ritual at the Tree.
 */
function hordeBotAction(state: GameState, memo: Memo): Action {
  const hero = activeHero(state)!;
  const tree = treeKey();
  const foes = livingHeroes(state, other(hero.faction));
  const own = livingHeroes(state, hero.faction);
  const item = mapItemAction(state);
  if (item) return item;
  if (state.movePoints <= 0 || state.turnBattleDone) return { type: 'endTurn' };
  // Hold the Tree while the ritual is under way, unless a weak enemy is right there.
  const beatable = (e: HeroState) => memo.ratio(hero, e) >= huntRatio(state);
  const adjacent = foes.filter((e) => distance(parseKey(e.pos), parseKey(hero.pos)) === 1);
  const prey = adjacent.find((e) => beatable(e) || e.crystals.length);
  if (prey && legalHeroMoves(state).some((m) => m.to === prey.pos)) return { type: 'moveHero', to: prey.pos };
  if (inRitualPlace(state, hero) && (state.ritual > 0 || own.every((h) => inRitualPlace(state, h)))) return { type: 'endTurn' };
  // Crystals on the move: hold the Tree (a Horde hero there blocks the delivery), get there
  // first if we can, otherwise cut the carrier off.
  const carriers = foes.filter((e) => e.crystals.length);
  if (carriers.length) {
    if (hero.pos === tree) return { type: 'endTurn' };
    const treeHeld = heroesAt(state, tree).some((h) => h.faction === hero.faction);
    const toTree = memo.paths(hero, 'plain', {}).get(tree);
    const carrierGap = Math.min(...carriers.map((c) => distance(parseKey(c.pos), parseKey(tree))));
    const goal = !treeHeld && toTree && toTree.cost <= carrierGap * AI_TUNING.raceToTree ? tree : carriers.sort((x, y) => distance(parseKey(x.pos), parseKey(hero.pos)) - distance(parseKey(y.pos), parseKey(hero.pos)))[0].pos;
    const p = memo.paths(hero, 'evil', { avoidGuardians: true }).get(goal);
    if (p && p.path.length > 1) return stepToward(state, p.path);
  }

  const goals = new Set<HexKey>();
  for (const e of foes) if (e.crystals.length || beatable(e)) goals.add(e.pos);
  for (const k of treasureSpots(state)) goals.add(k);
  const spot = ritualSpot(state, hero) ?? tree;
  goals.add(spot);
  // (No goal is a guarded hex: no hero stands there, and treasures and the Tree are never put on one.)
  const paths = memo.paths(hero, 'hunt', { goals, avoidGuardians: true, danger: true });
  let best: { cost: number; path: HexKey[] } | null = null;
  for (const g of goals) {
    const p = paths.get(g);
    // Prefer hunting: the Tree counts as a little further away than it is.
    const cost = p ? p.cost + (g === spot ? AI_TUNING.treeExtra : 0) : Infinity;
    if (p && (!best || cost < best.cost)) best = { cost, path: p.path };
  }
  if (!best || best.path.length < 2) return { type: 'endTurn' };
  const next = best.path[1];
  const foe = foes.find((e) => e.pos === next);
  if (foe && !beatable(foe) && !foe.crystals.length) return { type: 'endTurn' };
  return stepToward(state, best.path);
}

/** The last quarter of the rounds: the Horde wins at the limit, so the Dawn stops waiting. */
const isDesperate = (state: GameState) => state.round > state.roundLimit * AI_TUNING.desperateAfter;

/** Guardians are tough but beatable with company: go with at least one support (alone only when time runs out). */
function canFightGuardian(state: GameState): boolean {
  if (state.setup.battleMode === 'board' || isDesperate(state)) return true;
  return state.factions.dawn.supportsAlive.length >= 1;
}

export function adventureAction(state: GameState): Action {
  const hero = activeHero(state)!;
  // A reserve hero coming in picks the hex nearest to the Tree, where both sides are headed.
  if (hero.entering) {
    if (state.turnBattleDone) return { type: 'endTurn' };
    const tree = parseKey(treeKey());
    const to = [...hero.entering].sort((a, b) => distance(parseKey(a), tree) - distance(parseKey(b), tree))[0];
    return { type: 'moveHero', to };
  }
  const memo = new Memo(state);
  if (hero.faction === 'dawn') return goodAction(state, memo);
  // The coop automaton follows the rulebook; a Horde player's bot chooses its fights.
  return currentActor(state).kind === 'automaton' ? evilAction(state, memo) : hordeBotAction(state, memo);
}
