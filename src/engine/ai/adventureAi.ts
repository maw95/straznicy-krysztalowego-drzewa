// Adventure-map AI: the coop evil automaton (spec section 7) and simple bots
// for player seats. Both only use information visible on the map.

import { FACTION_SUPPORTS, UNITS, type FactionId } from '../data';
import { distance, parseKey, type HexKey } from '../hex';
import { mapNeighbors, shortestPaths, tileCost, treeKey } from '../map';
import { activeHero, currentActor, heroesAt, legalHeroMoves, reviveSpots, ritualFormed, ritualSpot } from '../game';
import type { Action, GameState, HeroState } from '../types';

function knownCost(state: GameState, k: HexKey): number | null {
  const t = state.tiles[k];
  // Hidden hexes are assumed passable at cost 1 (spec 7: the AI knows only revealed tiles).
  return t.revealed ? tileCost(t) : 1;
}

/** One hero per hex: a hex held by an ally is closed to walk on (except the faction's own base). */
function heldByAlly(state: GameState, hero: HeroState, k: HexKey): boolean {
  return state.tiles[k].home !== hero.faction && heroesAt(state, k).some((h) => h.faction === hero.faction && h.id !== hero.id);
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

/**
 * Strength ratio of `a` against `b` (above 1: a is stronger). When several heroes share b's
 * hex, the one the engine sends to fight (the first there) is the one that counts.
 */
function ratio(state: GameState, a: HeroState, b: HeroState): number {
  const defender = heroesAt(state, b.pos).find((h) => h.faction === b.faction) ?? b;
  return teamStrength(state, a.faction, a.id) / Math.max(1, teamStrength(state, defender.faction, defender.id));
}

/**
 * Extra path cost near enemies the hero would rather not meet: a hex next to a clearly
 * stronger enemy, or two steps from it (it could walk up and attack next turn).
 */
function dangerCost(state: GameState, hero: HeroState, k: HexKey): number {
  let extra = 0;
  for (const e of Object.values(state.heroes)) {
    if (!e.alive || e.faction === hero.faction || ratio(state, hero, e) >= 0.85) continue;
    const d = distance(parseKey(e.pos), parseKey(k));
    if (d <= 1) extra = Math.max(extra, 4);
    else if (d === 2) extra = Math.max(extra, 2);
  }
  return extra;
}

// ------------------------------------------------------------------ evil

export function evilAction(state: GameState): Action {
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
    if (heldByAlly(state, hero, k)) return null;
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

export function goodAction(state: GameState): Action {
  const hero = activeHero(state)!;
  const item = mapItemAction(state);
  if (item) return item;
  if (state.movePoints <= 0 || state.turnBattleDone) return { type: 'endTurn' };

  const enemies = Object.values(state.heroes).filter((h) => h.faction !== hero.faction && h.alive);
  // Waiting out the clock hands the Horde the win: late in the game any fight beats none.
  const desperate = isDesperate(state);
  const strongEnough = (enemyId: string) => desperate || ratio(state, hero, state.heroes[enemyId]) >= 0.9;
  const goals = new Set<HexKey>();
  if (hero.crystals.length) goals.add(treeKey());
  // The Horde is at the Tree: its ritual must be broken whatever the odds.
  const evilAtTree = enemies.filter((e) => e.pos === treeKey());
  if (evilAtTree.length && (state.ritual > 0 || ritualFormed(state))) goals.add(treeKey());
  if (!goals.size) {
    for (const c of Object.values(state.crystals)) {
      if (c.at.startsWith('hero:') || c.at === 'tree') continue;
      const tile = state.tiles[c.at];
      if (!tile.revealed) continue;
      if (c.guardian && !canFightGuardian(state)) continue;
      goals.add(c.at);
    }
    for (const k of treasureSpots(state)) goals.add(k);
    // Beating every Horde hero also wins the game: hunt the ones we clearly outmatch.
    for (const e of enemies) if (ratio(state, hero, e) >= huntRatio(state)) goals.add(e.pos);
  }
  const blocked = (k: HexKey) => {
    if (heldByAlly(state, hero, k)) return true;
    const foes = heroesAt(state, k).filter((h) => h.faction !== hero.faction);
    if (foes.length && !goals.has(k)) return !foes.every((e) => strongEnough(e.id));
    const t = state.tiles[k];
    return Boolean(t.crystalId && state.crystals[t.crystalId].guardian && !goals.has(k));
  };
  const paths = shortestPaths(state.tiles, hero.pos, (k) => {
    if (blocked(k)) return null;
    const c = knownCost(state, k);
    return c === null ? null : c + (goals.has(k) || desperate ? 0 : dangerCost(state, hero, k));
  });
  let best: { cost: number; path: HexKey[] } | null = null;
  for (const g of goals) {
    const p = paths.get(g);
    if (p && (!best || p.cost < best.cost)) best = p;
  }
  if (!best) {
    // Explore: the cheapest revealed hex that borders hidden ones.
    for (const [k, p] of paths) {
      if (k === hero.pos || !state.tiles[k].revealed) continue;
      const hiddenAround = mapNeighbors(state.tiles, k).filter((n) => !state.tiles[n].revealed).length;
      if (!hiddenAround) continue;
      const score = p.cost - hiddenAround * 0.3;
      if (!best || score < best.cost) best = { cost: score, path: p.path };
    }
  }
  if (!best) {
    // Nothing to explore: escort toward the Tree.
    best = paths.get(treeKey()) ?? null;
  }
  if (!best || best.path.length < 2) return { type: 'endTurn' };
  // Do not walk into an enemy we cannot beat.
  const next = best.path[1];
  const foe = enemies.find((e) => e.pos === next);
  if (foe && !strongEnough(foe.id) && !goals.has(next)) return { type: 'endTurn' };
  return stepToward(state, best.path);
}

/**
 * A Horde player's bot (PvP). Unlike the coop automaton it picks its fights: it attacks
 * heroes it can beat, hunts crystal carriers, and otherwise goes for the ritual at the Tree.
 */
export function hordeBotAction(state: GameState): Action {
  const hero = activeHero(state)!;
  const tree = treeKey();
  const foes = Object.values(state.heroes).filter((h) => h.faction !== hero.faction && h.alive);
  const own = Object.values(state.heroes).filter((h) => h.faction === hero.faction && h.alive);
  const item = mapItemAction(state);
  if (item) return item;
  if (state.movePoints <= 0 || state.turnBattleDone) return { type: 'endTurn' };
  // Hold the Tree while the ritual is under way, unless a weak enemy is right there.
  const beatable = (e: HeroState) => ratio(state, hero, e) >= huntRatio(state);
  const adjacent = foes.filter((e) => distance(parseKey(e.pos), parseKey(hero.pos)) === 1);
  const prey = adjacent.find((e) => beatable(e) || e.crystals.length);
  if (prey && legalHeroMoves(state).some((m) => m.to === prey.pos)) return { type: 'moveHero', to: prey.pos };
  if (inRitualPlace(state, hero) && (state.ritual > 0 || own.every((h) => inRitualPlace(state, h)))) return { type: 'endTurn' };

  const goals = new Set<HexKey>();
  for (const e of foes) if (e.crystals.length || beatable(e)) goals.add(e.pos);
  for (const k of treasureSpots(state)) goals.add(k);
  const spot = ritualSpot(state, hero) ?? tree;
  goals.add(spot);
  const paths = shortestPaths(state.tiles, hero.pos, (k) => {
    const t = state.tiles[k];
    if (t.crystalId && state.crystals[t.crystalId].guardian) return null;
    if (heldByAlly(state, hero, k)) return null;
    const c = knownCost(state, k);
    return c === null ? null : c + (goals.has(k) ? 0 : dangerCost(state, hero, k));
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

/** Guardians are tough: go with two supports, or with one once half the rounds are gone. */
function canFightGuardian(state: GameState): boolean {
  const supports = state.factions.dawn.supportsAlive.length;
  if (state.setup.battleMode === 'board' || isDesperate(state)) return true;
  return supports >= 2 || (supports >= 1 && state.round >= state.roundLimit / 2);
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
  if (hero.faction === 'dawn') return goodAction(state);
  // The coop automaton follows the rulebook; a Horde player's bot chooses its fights.
  return currentActor(state).kind === 'automaton' ? evilAction(state) : hordeBotAction(state);
}
