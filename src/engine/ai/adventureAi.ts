// Adventure-map AI: the coop evil automaton (spec section 7) and simple bots
// for player seats. Both only use information visible on the map.

import { FACTION_SUPPORTS, UNITS, type FactionId } from '../data';
import { distance, parseKey, type HexKey } from '../hex';
import { mapNeighbors, shortestPaths, tileCost, treeKey } from '../map';
import { activeHero, heroesAt, legalHeroMoves } from '../game';
import type { Action, GameState } from '../types';

function knownCost(state: GameState, k: HexKey): number | null {
  const t = state.tiles[k];
  // Hidden hexes are assumed passable at cost 1 (spec 7: the AI knows only revealed tiles).
  return t.revealed ? tileCost(t) : 1;
}

function stepToward(state: GameState, path: HexKey[]): Action {
  const next = path[1];
  const move = next ? legalHeroMoves(state).find((m) => m.to === next) : undefined;
  return move ? { type: 'moveHero', to: next } : { type: 'endTurn' };
}

function factionPower(state: GameState, f: FactionId, heroId: string): number {
  const h = UNITS[heroId];
  const supports = state.factions[f].supportsAlive
    .map((id) => UNITS[id].hp + UNITS[id].attack * 2)
    .sort((a, b) => b - a)
    .slice(0, 2);
  return h.hp + h.attack * 2 + supports.reduce((a, b) => a + b, 0);
}

// ------------------------------------------------------------------ evil

export function evilAction(state: GameState): Action {
  const hero = activeHero(state)!;
  const tree = treeKey();
  if (state.rules.ritualHold && hero.pos === tree) return { type: 'endTurn' };
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
    return knownCost(state, k);
  });
  let target: { cost: number; path: HexKey[] } | null = null;
  for (const spot of goodSpots) {
    const p = paths.get(spot);
    if (p && (!target || p.cost < target.cost)) target = p;
  }
  const toTree = paths.get(tree);
  if (toTree && (!target || toTree.cost < target.cost)) target = toTree;
  if (!target) return { type: 'endTurn' };
  return stepToward(state, target.path);
}

// ------------------------------------------------------------------ good

export function goodAction(state: GameState): Action {
  const hero = activeHero(state)!;
  const f = state.factions[hero.faction];

  // Map items first: bring back the dead, then scout.
  for (const id of f.inventory) {
    const item = state.items[id];
    if (item.kind === 'resurrection') {
      const dead = Object.values(state.heroes).find((h) => h.faction === hero.faction && !h.alive);
      if (dead) return { type: 'useMapItem', itemId: id, unitId: dead.id };
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
  if (state.movePoints <= 0 || state.turnBattleDone) return { type: 'endTurn' };

  const enemies = Object.values(state.heroes).filter((h) => h.faction !== hero.faction && h.alive);
  const strongEnough = (enemyId: string) =>
    factionPower(state, hero.faction, hero.id) >= factionPower(state, state.heroes[enemyId].faction, enemyId) * 0.9;
  const goals = new Set<HexKey>();
  if (hero.crystals.length) goals.add(treeKey());
  if (!goals.size) {
    for (const c of Object.values(state.crystals)) {
      if (c.at.startsWith('hero:') || c.at === 'tree') continue;
      const tile = state.tiles[c.at];
      if (!tile.revealed) continue;
      if (c.guardian && !canFightGuardian(state)) continue;
      goals.add(c.at);
    }
  }
  const blocked = (k: HexKey) => {
    const foes = heroesAt(state, k).filter((h) => h.faction !== hero.faction);
    if (foes.length && !goals.has(k)) return !foes.every((e) => strongEnough(e.id));
    const t = state.tiles[k];
    return Boolean(t.crystalId && state.crystals[t.crystalId].guardian && !goals.has(k));
  };
  const paths = shortestPaths(state.tiles, hero.pos, (k) => (blocked(k) ? null : knownCost(state, k)));
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

function canFightGuardian(state: GameState): boolean {
  return state.factions.dawn.supportsAlive.length >= 1;
}

export function adventureAction(state: GameState): Action {
  const hero = activeHero(state)!;
  if (hero.faction === 'horde') return evilAction(state);
  return goodAction(state);
}
