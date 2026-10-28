// Adventure-map AI: the coop evil automaton (spec section 7) and simple bots
// for player seats. Both only use information visible on the map.

import { FACTION_SUPPORTS, UNITS, type FactionId } from '../data';
import { distance, parseKey, type Hex, type HexKey } from '../hex';
import { mapNeighbors, shortestPaths, tileCost, treeKey, type PathResult } from '../map';
import { activeHero, currentActor, defenderAt, heroesAt, legalHeroMoves, reviveSpots, ritualFormed, ritualSpot } from '../game';
import type { Action, GameState, HeroState } from '../types';

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
  private paths = new Map<string, Map<HexKey, PathResult>>();

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
        .filter((e) => e.alive && e.faction !== hero.faction && this.ratio(hero, e) < 0.85)
        .map((e) => parseKey(e.pos));
      this.dangers.set(hero.id, near);
    }
    let extra = 0;
    const at = parseKey(k);
    for (const e of near) {
      const d = distance(e, at);
      if (d <= 1) extra = Math.max(extra, 4);
      else if (d === 2) extra = Math.max(extra, 2);
    }
    return extra;
  }

  /** shortestPaths, run once per decision for each start and kind of path (`kind` names the cost function). */
  shortestPaths(from: HexKey, kind: string, costOf: (k: HexKey) => number | null): Map<HexKey, PathResult> {
    const k = `${from}|${kind}`;
    let p = this.paths.get(k);
    if (!p) this.paths.set(k, (p = shortestPaths(this.state.tiles, from, costOf)));
    return p;
  }
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
  const supports = state.setup.battleMode === 'board' ? [] : state.factions[f].supportsAlive.slice().sort((a, b) => unitValue(b) - unitValue(a)).slice(0, 2);
  const team = [heroId, ...supports];
  const hp = team.reduce((a, id) => a + UNITS[id].hp, 0);
  const atk = team.reduce((a, id) => a + UNITS[id].attack * (UNITS[id].attackType === 'ranged' ? 1.3 : 1), 0);
  return hp * atk;
}

const unitValue = (id: string) => UNITS[id].hp + UNITS[id].attack * 1.5 + (UNITS[id].attackType === 'ranged' ? 2 : 0);

/**
 * Player bots go after an enemy hero only with a clear edge: the defender acts first on
 * Speed ties, and in a duel on the board that first blow often decides.
 */
const huntRatio = (state: GameState) => (state.setup.battleMode === 'board' ? 1.6 : 1.1);

// ------------------------------------------------------------------ evil

function evilAction(state: GameState, memo: Memo): Action {
  const hero = activeHero(state)!;
  // Treasures are shared by the faction, the automaton's included: it revives its fallen.
  const item = mapItemAction(state);
  if (item) return item;
  if (state.rules.ritualHold && inRitualPlace(state, hero)) return { type: 'endTurn' };
  const goodHeroes = Object.values(state.heroes).filter((h) => h.faction === 'dawn' && h.alive);
  // 1. Attack an adjacent good hero.
  const adjacent = goodHeroes.find((g) => distance(parseKey(g.pos), parseKey(hero.pos)) === 1);
  if (adjacent) {
    const move = legalHeroMoves(state).find((m) => m.to === adjacent.pos);
    if (move) return { type: 'moveHero', to: adjacent.pos };
  }
  // 2–4. Head for the closer of: nearest good hero, the Tree. Ties go to the hero.
  const goodSpots = new Set(goodHeroes.map((g) => g.pos));
  const paths = shortestPaths(state.tiles, hero.pos, (k) => {
    const t = state.tiles[k];
    if (t.crystalId && state.crystals[t.crystalId].guardian) return null;
    if (memo.heldByAlly(hero, k)) return null;
    return knownCost(state, k);
  });
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
      if (deadSupport && f.supportsAlive.length < 2) return { type: 'useMapItem', itemId: id, unitId: deadSupport };
    }
    if (item.kind === 'map') {
      const hidden = Object.values(state.tiles)
        .filter((t) => !t.revealed)
        .sort((a, b) => distance(parseKey(a.key), parseKey(hero.pos)) - distance(parseKey(b.key), parseKey(hero.pos)))
        .slice(0, 3)
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

function goodAction(state: GameState, memo: Memo): Action {
  const hero = activeHero(state)!;
  const item = mapItemAction(state);
  if (item) return item;
  if (state.movePoints <= 0 || state.turnBattleDone) return { type: 'endTurn' };
  const treeK = treeKey();
  const tree = parseKey(treeK);
  const nearTree = (k: HexKey) => distance(parseKey(k), tree);
  const allies = Object.values(state.heroes).filter((h) => h.faction === 'dawn' && h.alive && h.id !== hero.id);
  const mp = state.rules.heroMovePoints;
  // One hero per hex: a hero without crystals clears the Tree and the hexes around it while an
  // ally carries one, so the carrier can get in.
  if (!hero.crystals.length && (hero.pos === treeK || (allies.some((h) => h.crystals.length) && nearTree(hero.pos) <= 1))) {
    const off = legalHeroMoves(state).filter((m) => m.kind === 'move').sort((x, y) => nearTree(y.to) - nearTree(x.to))[0];
    if (off && nearTree(off.to) > nearTree(hero.pos)) return { type: 'moveHero', to: off.to };
  }

  const enemies = Object.values(state.heroes).filter((h) => h.faction !== hero.faction && h.alive && !h.entering);
  const desperate = isDesperate(state);
  // The defender strikes first, so walking into an enemy needs a real edge (or no time left).
  const strongEnough = (e: HeroState) => desperate || memo.ratio(hero, e) >= huntRatio(state);
  const enemyAt = (k: HexKey) => enemies.find((e) => e.pos === k);
  const roundsLeft = state.roundLimit - state.round + 1;
  // Paths: fights are avoided unless the hex is a goal; hexes next to stronger enemies cost extra.
  const pathsFor = (goals: Set<HexKey>) =>
    memo.shortestPaths(hero.pos, `goals ${[...goals].sort().join(' ')}`, (k) => {
      if (memo.heldByAlly(hero, k)) return null;
      const foe = enemyAt(k);
      if (foe && !goals.has(k) && !strongEnough(foe)) return null;
      const t = state.tiles[k];
      if (t.crystalId && state.crystals[t.crystalId].guardian && !goals.has(k)) return null;
      const c = knownCost(state, k);
      return c === null ? null : c + (goals.has(k) || desperate ? 0 : memo.dangerCost(hero, k));
    });
  const go = (goals: Set<HexKey>, extra: (k: HexKey) => number = () => 0): Action | null => {
    const paths = pathsFor(goals);
    let best: { cost: number; path: HexKey[] } | null = null;
    for (const g of goals) {
      const p = paths.get(g);
      if (p && p.path.length > 1 && (!best || p.cost + extra(g) < best.cost)) best = { cost: p.cost + extra(g), path: p.path };
    }
    if (!best) return null;
    const next = best.path[1];
    const foe = enemyAt(next);
    if (foe && !strongEnough(foe) && !goals.has(next)) return null;
    const move = legalHeroMoves(state).find((m) => m.to === next);
    if (move) return { type: 'moveHero', to: next };
    // The next hex costs more than the points left this turn: wait and go on next turn, rather
    // than wander off and come back (which never gets anywhere).
    if ((knownCost(state, next) ?? 0) > state.movePoints) return { type: 'endTurn' };
    return null;
  };

  const treeCostFrom = (from: HexKey) =>
    memo.shortestPaths(from, 'tree', (k) => (memo.heldByAlly(hero, k) && k !== hero.pos ? null : knownCost(state, k))).get(treeK)?.cost ?? Infinity;
  const treeEta = (h: HeroState) => Math.ceil(treeCostFrom(h.pos) / mp);

  // 1. The Horde's ritual must be broken whatever the odds. A carrier leaves it to an ally
  //    without crystals when that one gets there in time (losing the fight drops the crystals).
  const ritualHolder = enemies.find((e) => e.pos === treeK);
  const ritualOn = !!ritualHolder && (state.ritual > 0 || ritualFormed(state));
  if (ritualOn) {
    const ritualLeft = state.rules.ritualRounds - state.ritual;
    const breaker = allies.find((a) => !a.crystals.length && treeEta(a) < ritualLeft);
    if (!hero.crystals.length || !breaker || desperate) {
      const a = go(new Set([treeK]));
      if (a) return a;
    }
  }
  // A Horde hero camping on the Tree (no ritual yet) wins most fights there: carriers wait
  // nearby and let it come out, unless time is running out. The coop automaton never comes out,
  // so there waiting only wastes rounds.
  const camped = !!ritualHolder && !ritualOn && !desperate && state.setup.mode !== 'coop';
  const decide = (): Action => {
    // 2. A beatable enemy right next to us that stands in the way (or would catch a carrier) — strike first.
    const adjacentFoe = enemies.find((e) => distance(parseKey(e.pos), parseKey(hero.pos)) === 1 && memo.ratio(hero, e) >= huntRatio(state));
    if (adjacentFoe && legalHeroMoves(state).some((m) => m.to === adjacentFoe.pos)) return { type: 'moveHero', to: adjacentFoe.pos };

    // 3. Deliver when the carried crystals finish the job, or when time runs out.
    const carried = (h: HeroState) => h.crystals.length;
    const inHand = carried(hero) + allies.reduce((a, h) => a + carried(h), 0);
    const missing = state.crystalsNeeded - state.factions.dawn.delivered;
    if (carried(hero)) {
      const toTree = pathsFor(new Set([treeK])).get(treeK);
      const eta = toTree ? Math.ceil(toTree.cost / mp) : 99;
      // Bank what we carry when the Tree is within this turn's reach: a carrier is hunted, and
      // a crystal at the Tree can't be lost any more.
      const bank = toTree !== undefined && toTree.cost < state.movePoints;
      if (!camped && (inHand >= missing || roundsLeft <= eta + 1 || bank)) {
        // A Horde hero on the Tree must be beaten first.
        const a = go(new Set([treeK]));
        if (a) return a;
      }
    }

    // 4. Collect: known crystals not carried, each hero taking the ones it is closest to.
    const canGuardian = canFightGuardian(state);
    const known = Object.values(state.crystals).filter((c) => !c.at.startsWith('hero:') && c.at !== 'tree' && state.tiles[c.at]?.revealed && (!c.guardian || canGuardian));
    const dist = (h: HeroState, k: HexKey) => distance(parseKey(h.pos), parseKey(k));
    const mine = known.filter((c) => !allies.some((a) => dist(a, c.at) < dist(hero, c.at)));
    const targets = new Set((mine.length ? mine : known).map((c) => c.at));
    // Treasures (they strengthen the team in battle) when they are a short detour away.
    const treasures = treasureSpots(state).filter((k) => dist(hero, k) <= (desperate ? 1 : 4));
    for (const k of treasures) targets.add(k);
    if (known.length) {
      const a = go(targets, (k) => (treasures.includes(k) && !known.some((c) => c.at === k) ? 1.5 : 0));
      if (a) return a;
    }

    // 5. Explore while crystals are still missing: frontier hexes, the ally exploring elsewhere,
    //    and the half of the map where unfound lairs can be (the Griffin lives on the Przymierze
    //    side, the Cyclops and the Hydra on the Horde side).
    const foundLairs = Object.values(state.crystals).filter((c) => c.at === 'tree' || c.at.startsWith('hero:') || state.tiles[c.at]?.revealed).length;
    if (foundLairs < state.crystalsNeeded || !known.length) {
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
        const crowd = allies.some((a) => dist(a, t.key) < dist(hero, t.key)) ? 3 : 0;
        score.set(t.key, -lairChance * 0.6 + crowd);
      }
      for (const k of treasures) if (!frontier.has(k)) (frontier.add(k), score.set(k, 0.5));
      const a = go(frontier, (k) => score.get(k) ?? 0);
      if (a) return a;
    }

    // 6. Nothing to find: carry what we have home, or wait near the Tree (two hexes short, so a
    //    carrier can get in).
    if (carried(hero) && !camped) {
      const a = go(new Set([treeK]));
      if (a) return a;
    }
    const near = Object.values(state.tiles).filter((t) => t.revealed && tileCost(t) !== null && nearTree(t.key) === 2).map((t) => t.key);
    if (!near.includes(hero.pos)) {
      const a = go(new Set(near));
      if (a) return a;
    }
    return { type: 'endTurn' };
  };

  // 1b. Watch the Tree, with the clock: count the move points left before the Horde could finish
  //     its ritual (walk to the Tree, then hold it for the ritual rounds). The Przymierze hero
  //     nearest the Tree may explore or collect on the way only while it can still get back and
  //     strike in time; with no slack left it heads straight for the Tree.
  const horde = enemies.filter((e) => e.alive);
  const guard = [hero, ...allies].sort((x, y) => treeCostFrom(x.pos) - treeCostFrom(y.pos))[0] === hero;
  if (horde.length && guard && state.rules.ritual !== false) {
    const formed = ritualFormed(state);
    const hordeEta = formed ? 0 : Math.max(...horde.map((e) => Math.ceil(Math.max(0, treeCostFrom(e.pos) - 1) / mp)));
    // The ritual completes at the end of the round the last Horde hero arrives in, plus the
    // ritual rounds after it; that round counts too (the Horde may move after us).
    const turnsLeft = Math.min(roundsLeft, hordeEta + state.rules.ritualRounds - 1 - (formed ? state.ritual : 0));
    const budget = state.movePoints + Math.max(0, turnsLeft - 1) * mp;
    // Reaching the Tree hex needs the path cost plus a turn's worth of slack (unknown terrain,
    // allies or guardians in the way).
    const fits = (from: HexKey, spent: number) => spent + treeCostFrom(from) + mp <= budget;
    const plan = decide();
    if (plan.type !== 'moveHero' && plan.type !== 'endTurn') return plan;
    if (plan.type === 'moveHero') {
      const step = legalHeroMoves(state).find((m) => m.to === plan.to);
      if (step && (step.kind !== 'move' || fits(plan.to, step.cost))) return plan;
    } else if (fits(hero.pos, state.movePoints)) return plan;
    const a = go(new Set([treeK]));
    if (a) return a;
    return plan;
  }
  return decide();
}

/**
 * A Horde player's bot (PvP). Unlike the coop automaton it picks its fights: it attacks
 * heroes it can beat, hunts crystal carriers, and otherwise goes for the ritual at the Tree.
 */
function hordeBotAction(state: GameState, memo: Memo): Action {
  const hero = activeHero(state)!;
  const tree = treeKey();
  const foes = Object.values(state.heroes).filter((h) => h.faction !== hero.faction && h.alive);
  const own = Object.values(state.heroes).filter((h) => h.faction === hero.faction && h.alive);
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
    const toTree = shortestPaths(state.tiles, hero.pos, (k) => (memo.heldByAlly(hero, k) ? null : knownCost(state, k))).get(tree);
    const carrierGap = Math.min(...carriers.map((c) => distance(parseKey(c.pos), parseKey(tree))));
    const goal = !treeHeld && toTree && toTree.cost <= carrierGap * 1.5 ? tree : carriers.sort((x, y) => distance(parseKey(x.pos), parseKey(hero.pos)) - distance(parseKey(y.pos), parseKey(hero.pos)))[0].pos;
    const p = shortestPaths(state.tiles, hero.pos, (k) => {
      const t = state.tiles[k];
      if (t.crystalId && state.crystals[t.crystalId].guardian) return null;
      if (memo.heldByAlly(hero, k)) return null;
      return knownCost(state, k);
    }).get(goal);
    if (p && p.path.length > 1) return stepToward(state, p.path);
  }

  const goals = new Set<HexKey>();
  for (const e of foes) if (e.crystals.length || beatable(e)) goals.add(e.pos);
  for (const k of treasureSpots(state)) goals.add(k);
  const spot = ritualSpot(state, hero) ?? tree;
  goals.add(spot);
  const paths = shortestPaths(state.tiles, hero.pos, (k) => {
    const t = state.tiles[k];
    if (t.crystalId && state.crystals[t.crystalId].guardian) return null;
    if (memo.heldByAlly(hero, k)) return null;
    const c = knownCost(state, k);
    return c === null ? null : c + (goals.has(k) ? 0 : memo.dangerCost(hero, k));
  });
  let best: { cost: number; path: HexKey[] } | null = null;
  for (const g of goals) {
    const p = paths.get(g);
    // Prefer hunting: the Tree counts as a little further away than it is.
    const cost = p ? p.cost + (g === spot ? 2 : 0) : Infinity;
    if (p && (!best || cost < best.cost)) best = { cost, path: p.path };
  }
  if (!best || best.path.length < 2) return { type: 'endTurn' };
  const next = best.path[1];
  const foe = foes.find((e) => e.pos === next);
  if (foe && !beatable(foe) && !foe.crystals.length) return { type: 'endTurn' };
  return stepToward(state, best.path);
}

/** The last quarter of the rounds: the Horde wins at the limit, so the Dawn stops waiting. */
const isDesperate = (state: GameState) => state.round > state.roundLimit * 0.75;

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
