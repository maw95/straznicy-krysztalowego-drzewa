// Game flow: setup, adventure turns, battle triggers and aftermath, victory.
// `applyAction` is the single entry point: it clones the state, applies one
// action and returns the new state, so every game is a replayable action log.
// `applyActionInPlace` does the same on the state it is given (simulations, replays).

import {
  FACTION_HEROES,
  FACTION_NAMES,
  FACTION_SUPPORTS,
  guardianDuelHp,
  ITEM_EFFECT,
  ITEMS,
  MAP_VARIANTS,
  NON_RESURRECTION_ITEMS,
  ARENA_DECK,
  ARENA_OFFER,
  ARENA_PICKS,
  ARENA_RULES,
  RESURRECTION_CARDS,
  SUPPORTS_PER_BATTLE,
  TERRAIN_NAMES,
  UNITS,
  type FactionId,
  type ItemKind,
  type Side,
} from './data';
import {
  battleAbility,
  battleAttack,
  battleHop,
  battleItem,
  battleMove,
  checkBattleEnd,
  deployUnits,
  consumeItem,
  endActivation,
  makeBattleUnit,
  startBattleFight,
  arenaObstacles,
} from './battle';
import { distance, parseKey, type HexKey } from './hex';
import { generateMap, homeKey, mapNeighbors, revealAround, tileCost, treeKey } from './map';
import { log } from './log';
import { Rng } from './rng';
import type { Action, BattleReport, BattleState, GameState, HeroState, ItemInstance, Player, SetupOptions } from './types';

export const other = (f: FactionId): FactionId => (f === 'dawn' ? 'horde' : 'dawn');

/** Re-reads the phase after calls that may end the game (keeps TS narrowing honest). */
export const isOver = (state: GameState): boolean => state.phase === 'over';

// ------------------------------------------------------------------ setup

/** Crystals on the map (and needed at the Tree): 2 for one Przymierze hero, 3 for two. */
export function crystalsFor(setup: SetupOptions): number {
  return setup.seats.filter((s) => s.faction === 'dawn').length >= 2 ? 3 : 2;
}

export function createGame(setup: SetupOptions): GameState {
  const rng = new Rng(setup.seed);
  const variant = MAP_VARIANTS[setup.mapSize];

  // Treasure pool: all Eliksiry Odrodzenia are set aside, then exactly the required
  // number goes back together with random other treasures (spec section 4).
  // The simple option ("only Eliksiry Odrodzenia") puts a few elixirs on the map and nothing else.
  const others = rng.shuffle(NON_RESURRECTION_ITEMS).slice(0, variant.otherTreasures);
  const pool: ItemKind[] = setup.rules.treasures
    ? rng.shuffle([...Array(variant.resurrections).fill('resurrection'), ...others])
    : Array(variant.onlyResurrections).fill('resurrection');
  const crystals = crystalsFor(setup);
  const map = generateMap(setup.mapSize, rng, pool.length, crystals);

  const state: GameState = {
    version: 1,
    setup,
    rules: setup.rules,
    rng: 0,
    round: 1,
    roundLimit: variant.roundLimit,
    crystalsNeeded: crystals,
    phase: 'adventure',
    players: [],
    heroes: {},
    factions: {
      dawn: { id: 'dawn', supportsAlive: [...FACTION_SUPPORTS.dawn], supportsDead: [], inventory: [], delivered: 0, unusedHeroes: [...FACTION_HEROES.dawn] },
      horde: { id: 'horde', supportsAlive: [...FACTION_SUPPORTS.horde], supportsDead: [], inventory: [], delivered: 0, unusedHeroes: [...FACTION_HEROES.horde] },
    },
    tiles: map.tiles,
    rows: map.rows,
    crystals: {},
    items: {},
    turnOrder: [],
    turnIndex: 0,
    movePoints: setup.rules.heroMovePoints,
    turnBattleDone: false,
    battle: null,
    ritual: 0,
    winner: null,
    endReason: null,
    log: [],
    actionCount: 0,
    lastBattle: null,
    stats: {
      battles: 0,
      heroDeaths: { dawn: 0, horde: 0 },
      supportDeaths: { dawn: 0, horde: 0 },
      treasuresCollected: { dawn: 0, horde: 0 },
      neutralBattles: 0,
      neutralWipes: 0,
      neutralSupportLosses: 0,
    },
  };

  pool.forEach((kind, i) => {
    state.tiles[map.treasureHexes[i]].treasureId = newItem(state, kind).id;
  });
  // Treasures in hand from the start: the Przymierze on larger maps, the Horde on some levels.
  const dealt = new Set<ItemKind>(others);
  dealStartTreasures(state, rng, 'dawn', variant.startTreasures, dealt, pool);
  dealStartTreasures(state, rng, 'horde', setup.rules.hordeStartTreasures, dealt, pool);
  map.crystals.forEach((c, i) => {
    const id = `c${i + 1}`;
    state.crystals[id] = { id, guardian: c.guardian, at: c.hex };
    state.tiles[c.hex].crystalId = id;
  });

  setup.seats.forEach((seat, i) => {
    const player: Player = { id: `p${i + 1}`, name: seat.name, faction: seat.faction, controller: seat.controller };
    state.players.push(player);
    addHero(state, seat.heroId, seat.faction, player.id);
  });
  if (setup.mode === 'coop') {
    // As many evil heroes as good heroes at the start (spec section 1), at least rules.minEvilHeroes.
    const goodCount = setup.seats.filter((s) => s.faction === 'dawn').length;
    // Optionally one more, to make the coop game harder (there are 3 Horde heroes at most).
    const evilCount = Math.min(FACTION_HEROES.horde.length, Math.max(goodCount, setup.rules.minEvilHeroes ?? 1) + (setup.rules.extraEvilHero ? 1 : 0));
    const evil = rng.shuffle(FACTION_HEROES.horde).slice(0, evilCount);
    for (const id of evil) addHero(state, id, 'horde', null);
  }

  for (const f of ['dawn', 'horde'] as FactionId[]) revealAround(state, homeKey(state.rows, f));
  state.tiles[treeKey()].revealed = true;
  state.rng = rng.state;
  state.turnOrder = computeTurnOrder(state);
  state.turnIndex = 0;
  if (setup.mode === 'arena') {
    startArena(state);
    return state;
  }
  log(state, 'round', `Runda 1 z ${state.roundLimit}. Przymierze potrzebuje ${state.crystalsNeeded} kryształów.`);
  return state;
}

/**
 * Treasures a faction holds from the start (MapVariant.startTreasures, rules.hordeStartTreasures):
 * Eliksiry Odrodzenia, kinds other than those already `dealt` (it grows), and `random` cards of
 * what is left in the box, which may be an Eliksir too. `onMap` is the map's treasure pool.
 */
function dealStartTreasures(state: GameState, rng: Rng, faction: FactionId, start: { resurrections: number; others: number; random?: number } | undefined, dealt: Set<ItemKind>, onMap: ItemKind[]) {
  if (!start || !state.rules.treasures) return;
  const kinds: ItemKind[] = Array(start.resurrections).fill('resurrection');
  const rest = () => rng.shuffle(NON_RESURRECTION_ITEMS.filter((k) => !dealt.has(k)));
  for (const k of rest().slice(0, start.others)) (kinds.push(k), dealt.add(k));
  for (let i = 0; i < (start.random ?? 0); i++) {
    // A random card of what is left in the box: Eliksiry Odrodzenia and one of each other treasure.
    const elixirs = RESURRECTION_CARDS - onMap.filter((k) => k === 'resurrection').length - Object.values(state.items).filter((it) => it.kind === 'resurrection' && it.owner).length;
    const deck = [...Array(Math.max(0, elixirs)).fill('resurrection'), ...rest()] as ItemKind[];
    const k = deck[rng.int(deck.length)];
    kinds.push(k);
    if (k !== 'resurrection') dealt.add(k);
  }
  for (const kind of kinds) giveItem(state, newItem(state, kind), faction, null);
}

// ------------------------------------------------------------------ arena

/**
 * Arena: the two heroes meet at once. A coin decides who picks first (the "attacker", who also
 * deploys first and starts the odd rounds on ties of initiative) and which painted arena is used.
 */
function startArena(state: GameState) {
  const rng = new Rng(state.rng);
  const coin: FactionId = rng.int(2) === 0 ? 'dawn' : 'horde';
  const first: FactionId = ARENA_RULES.firstPicker === 'random' ? coin : ARENA_RULES.firstPicker;
  const second = other(first);
  const arena = rng.int(2) === 0 ? 'dawn' : 'horde';
  state.rng = rng.state;
  const heroOf = (f: FactionId) => Object.values(state.heroes).find((h) => h.faction === f);
  const [dawn, horde] = [heroOf('dawn'), heroOf('horde')];
  if (!dawn || !horde) throw new Error('Na arenie walczy jeden bohater Przymierza i jeden Hordy.');
  const hero = (f: FactionId) => (f === 'dawn' ? dawn : horde);
  const extra = (['dawn', 'horde'] as FactionId[]).flatMap((f) => Array<FactionId>(ARENA_RULES.extraPicks[f]).fill(f));
  // ARENA_PICKS each, snaking: A, B, B, A, A, B, …
  const picks = Array.from({ length: ARENA_PICKS }, (_, i) => (i % 2 ? [second, first] : [first, second])).flat();
  state.draft = { deck: [...ARENA_DECK], order: [...picks, ...extra], offer: [] };
  log(state, 'battle', `Arena: ${UNITS[hero('dawn').id].name} kontra ${UNITS[hero('horde').id].name}. Pierwsza wybiera ${FACTION_NAMES[first]}.`);
  startBattle(state, { kind: 'heroes', attackerHero: hero(first).id, defenderHero: hero(second).id, mapHex: hero(first).pos, from: hero(first).pos });
  const b = state.battle!;
  b.arena = arena;
  b.obstacles = arenaObstacles(arena);
}

/** The next three cards for the picker: the deck is shuffled and the first three different kinds are shown. */
function dealOffer(state: GameState) {
  const d = state.draft!;
  const rng = new Rng(state.rng);
  d.offer = [...new Set(rng.shuffle(d.deck))].slice(0, ARENA_OFFER + ARENA_RULES.extraOffer[d.order[0]]);
  state.rng = rng.state;
}

/** After both sides chose their supports: the draft in the arena, the deployment otherwise. */
function afterSelection(state: GameState) {
  if (state.draft?.order.length) {
    state.battle!.stage = 'draft';
    dealOffer(state);
  } else startBattleFight(state);
}

function draftPick(state: GameState, faction: FactionId, kind: ItemKind) {
  const d = state.draft;
  const b = state.battle;
  if (!d || !b || b.stage !== 'draft' || d.order[0] !== faction) throw new Error('Teraz nie wybiera ta frakcja.');
  if (!d.offer.includes(kind)) throw new Error('Tego skarbu nie ma wśród pokazanych.');
  d.deck.splice(d.deck.indexOf(kind), 1);
  giveItem(state, newItem(state, kind), faction, battleHeroOf(b, faction));
  log(state, 'item', `${FACTION_NAMES[faction]} wybiera skarb.`);
  log(state, 'item', `Wybrany skarb: ${ITEMS[kind].name}.`, faction);
  d.order.shift();
  d.offer = [];
  if (d.order.length) dealOffer(state);
  else {
    state.draft = null;
    startBattleFight(state);
  }
}

/** The arena match ends with its battle. */
function finishArena(state: GameState) {
  const b = state.battle!;
  state.lastBattle = battleReport(state, b);
  if (b.winner === 'dawn' || b.winner === 'horde') finish(state, b.winner, 'Na arenie nie ostał się żaden przeciwnik.');
  else {
    state.phase = 'over';
    state.winner = null;
    state.endReason = 'Remis — obie strony poległy.';
    state.battle = null;
    log(state, 'victory', 'Koniec gry: remis.');
  }
}

/**
 * A new treasure card, owned by nobody yet. Ids follow creation order (it1, it2, …), and the order
 * of state.items is the order bots look at treasures in: keep both when changing this.
 */
function newItem(state: GameState, kind: ItemKind): ItemInstance {
  const id = `it${Object.keys(state.items).length + 1}`;
  return (state.items[id] = { id, kind, owner: null, foundBy: null });
}

/** A treasure goes to a faction's shared inventory; `foundBy` is the hero who got it. */
function giveItem(state: GameState, item: ItemInstance, faction: FactionId, foundBy: string | null) {
  item.owner = faction;
  item.foundBy = foundBy;
  state.factions[faction].inventory.push(item.id);
}

function addHero(state: GameState, heroId: string, faction: FactionId, playerId: string | null) {
  state.heroes[heroId] = { id: heroId, faction, playerId, pos: homeKey(state.rows, faction), alive: true, crystals: [] };
  const unused = state.factions[faction].unusedHeroes;
  if (unused.includes(heroId)) unused.splice(unused.indexOf(heroId), 1);
}

/** Where the coop automaton's heroes come in the turn order: after every player's seat. */
const AUTOMATON_SEAT = 100;

export function computeTurnOrder(state: GameState): string[] {
  const heroes = Object.values(state.heroes);
  const seatOrder = (h: HeroState) => (h.playerId ? state.players.findIndex((p) => p.id === h.playerId) : AUTOMATON_SEAT);
  const dawn = heroes.filter((h) => h.faction === 'dawn' && h.alive).sort((a, b) => seatOrder(a) - seatOrder(b));
  const horde = heroes.filter((h) => h.faction === 'horde' && h.alive).sort((a, b) => seatOrder(a) - seatOrder(b));
  if (state.setup.mode === 'coop') return [...dawn, ...horde].map((h) => h.id);
  const out: string[] = [];
  for (let i = 0; i < Math.max(dawn.length, horde.length); i++) {
    if (dawn[i]) out.push(dawn[i].id);
    if (horde[i]) out.push(horde[i].id);
  }
  return out;
}

// ------------------------------------------------------------------ queries

export function activeHero(state: GameState): HeroState | null {
  if (state.phase === 'over') return null;
  const id = state.turnOrder[state.turnIndex];
  return id ? state.heroes[id] : null;
}

/** A faction's living heroes (a reserve still to come in included), in the order of state.heroes. */
export function livingHeroes(state: GameState, faction: FactionId): HeroState[] {
  return Object.values(state.heroes).filter((h) => h.faction === faction && h.alive);
}

export function heroesAt(state: GameState, k: HexKey): HeroState[] {
  return Object.values(state.heroes).filter((h) => h.alive && !h.entering && h.pos === k);
}

/** The enemy hero who fights for hex `k` when it is attacked: of several (only in a base), the one with the most Życie. */
export function defenderAt(state: GameState, k: HexKey, attacker: FactionId): HeroState | undefined {
  return heroesAt(state, k)
    .filter((h) => h.faction !== attacker)
    .sort((a, b) => UNITS[b.id].hp - UNITS[a.id].hp)[0];
}

/**
 * The ritual stands when one living Horde hero is on the Tree and every other living Horde hero
 * is on a hex next to it (one hero per hex, so they gather around the Tree).
 */
export function ritualFormed(state: GameState): boolean {
  // The easy level plays without the ritual.
  if (state.rules.ritual === false) return false;
  const tree = treeKey();
  const evil = livingHeroes(state, 'horde');
  if (!evil.length || evil.some((h) => h.entering) || !evil.some((h) => h.pos === tree)) return false;
  const around = new Set(mapNeighbors(state.tiles, tree));
  return evil.every((h) => h.pos === tree || around.has(h.pos));
}

/** Where a Horde hero should stand for the ritual: the Tree if no other Horde hero holds it, else a free hex next to it. */
export function ritualSpot(state: GameState, hero: HeroState): HexKey | null {
  const tree = treeKey();
  const holder = heroesAt(state, tree).find((h) => h.faction === 'horde' && h.id !== hero.id);
  if (!holder) return tree;
  if (mapNeighbors(state.tiles, tree).includes(hero.pos)) return hero.pos;
  const free = mapNeighbors(state.tiles, tree).filter((k) => canStand(state, k, 'horde', hero.id));
  return free.sort((a, b) => distance(parseKey(a), parseKey(hero.pos)) - distance(parseKey(b), parseKey(hero.pos)))[0] ?? null;
}

/** Free hexes next to `hero` where a hero it revives may stand. */
export function reviveSpots(state: GameState, hero: HeroState): HexKey[] {
  return mapNeighbors(state.tiles, hero.pos).filter((k) => canStand(state, k, hero.faction));
}

/** One hero per hex: only a faction's own base may hold several of its heroes. */
export function canStand(state: GameState, k: HexKey, faction: FactionId, heroId?: string): boolean {
  const t = state.tiles[k];
  if (tileCost(t) === null || (t.crystalId && state.crystals[t.crystalId].guardian)) return false;
  const others = heroesAt(state, k).filter((h) => h.id !== heroId);
  if (others.some((h) => h.faction !== faction)) return false;
  return !others.length || t.home === faction;
}

/** Free hexes (see canStand) nearest to `from`. */
export function nearestFreeHexes(state: GameState, from: HexKey, faction: FactionId): HexKey[] {
  const origin = parseKey(from);
  const free = Object.values(state.tiles)
    .filter((t) => canStand(state, t.key, faction))
    .map((t) => ({ k: t.key, d: distance(origin, parseKey(t.key)) }));
  const best = Math.min(...free.map((f) => f.d));
  return free.filter((f) => f.d === best).map((f) => f.k);
}

export type MoveKind = 'move' | 'attackHero' | 'attackGuardian' | 'enter';

export interface HeroMove {
  to: HexKey;
  cost: number;
  kind: MoveKind;
}

/** Adjacent hexes the active hero may enter now. */
export function legalHeroMoves(state: GameState): HeroMove[] {
  const hero = activeHero(state);
  if (!hero || state.phase !== 'adventure' || state.turnBattleDone || !hero.alive) return [];
  if (hero.entering) return hero.entering.map((to) => ({ to, cost: 0, kind: 'enter' as const }));
  const out: HeroMove[] = [];
  for (const n of mapNeighbors(state.tiles, hero.pos)) {
    const tile = state.tiles[n];
    const cost = tileCost(tile);
    if (cost === null || !tile.revealed) continue;
    const there = heroesAt(state, n);
    const enemies = there.filter((h) => h.faction !== hero.faction);
    // One hero per hex: a hex held by an ally is closed (except the faction's own base).
    if (!enemies.length && there.length && tile.home !== hero.faction) continue;
    const crystal = tile.crystalId ? state.crystals[tile.crystalId] : null;
    if (enemies.length) {
      // Attacking needs at least 1 movement point and ends the hero's movement.
      if (state.movePoints >= 1) out.push({ to: n, cost: state.movePoints, kind: 'attackHero' });
      continue;
    }
    if (crystal?.guardian) {
      if (hero.faction === 'horde') continue;
      if (state.movePoints >= 1) out.push({ to: n, cost: state.movePoints, kind: 'attackGuardian' });
      continue;
    }
    if (cost <= state.movePoints) out.push({ to: n, cost, kind: 'move' });
  }
  return out;
}

export type Actor =
  | { kind: 'human'; playerId: string; faction: FactionId }
  | { kind: 'bot'; playerId: string; faction: FactionId }
  | { kind: 'automaton'; side: Side }
  | { kind: 'none' };

function actorForFaction(state: GameState, faction: FactionId, heroId: string | null): Actor {
  const hero = heroId ? state.heroes[heroId] : null;
  const player = hero?.playerId ? state.players.find((p) => p.id === hero.playerId) : undefined;
  if (!player) return { kind: 'automaton', side: faction };
  return player.controller === 'human' ? { kind: 'human', playerId: player.id, faction } : { kind: 'bot', playerId: player.id, faction };
}

export function battleHeroOf(b: BattleState, side: Side): string | null {
  if (side === b.attacker) return b.attackerHero;
  if (side === b.defender) return b.defenderHero;
  return null;
}

/** Who must act next. */
export function currentActor(state: GameState): Actor {
  if (state.phase === 'over') return { kind: 'none' };
  if (state.phase === 'battle' && state.battle) {
    const b = state.battle;
    if (b.stage === 'select') {
      const f = b.needsSelection[0];
      return actorForFaction(state, f, battleHeroOf(b, f));
    }
    if (b.stage === 'deploy') {
      const f = b.needsDeploy[0];
      return actorForFaction(state, f, battleHeroOf(b, f));
    }
    if (b.stage === 'draft' && state.draft) {
      const f = state.draft.order[0];
      return actorForFaction(state, f, battleHeroOf(b, f));
    }
    if (b.stage === 'fight' && b.activation) {
      const u = b.units[b.activation.unitId];
      if (u.side === 'neutral') return { kind: 'automaton', side: 'neutral' };
      return actorForFaction(state, u.side, battleHeroOf(b, u.side));
    }
    return { kind: 'none' };
  }
  const hero = activeHero(state);
  if (!hero) return { kind: 'none' };
  return actorForFaction(state, hero.faction, hero.id);
}

// ------------------------------------------------------------------ adventure actions

function moveHero(state: GameState, to: HexKey) {
  const hero = activeHero(state)!;
  const move = legalHeroMoves(state).find((m) => m.to === to);
  if (!move) throw new Error('Nie można wejść na to pole.');
  const name = UNITS[hero.id].name;
  if (move.kind === 'enter') {
    enterBoard(state, hero, to);
    return;
  }
  if (move.kind === 'attackHero') {
    const defender = defenderAt(state, to, hero.faction)!;
    log(state, 'battle', `${name} atakuje: ${UNITS[defender.id].name}.`);
    const from = hero.pos;
    hero.pos = to;
    revealAround(state, to);
    startBattle(state, { kind: 'heroes', attackerHero: hero.id, defenderHero: defender.id, mapHex: to, from });
    return;
  }
  if (move.kind === 'attackGuardian') {
    const crystal = state.crystals[state.tiles[to].crystalId!];
    log(state, 'battle', `${name} wyzywa strażnika kryształu: ${UNITS[crystal.guardian!].name}.`);
    const from = hero.pos;
    hero.pos = to;
    revealAround(state, to);
    startBattle(state, { kind: 'neutral', attackerHero: hero.id, neutralId: crystal.guardian!, mapHex: to, from });
    return;
  }
  state.movePoints -= move.cost;
  hero.pos = to;
  const revealed = revealAround(state, to);
  log(state, 'move', `${name} wchodzi na pole: ${TERRAIN_NAMES[state.tiles[to].terrain]}${revealed.length ? ` (odkryto ${revealed.length})` : ''}.`);
  arriveAt(state, hero);
}

/** A reserve hero steps onto the board at the chosen hex (no movement points spent). */
function enterBoard(state: GameState, hero: HeroState, to: HexKey) {
  delete hero.entering;
  hero.pos = to;
  const revealed = revealAround(state, to);
  log(state, 'move', `${UNITS[hero.id].name} wkracza na pole: ${TERRAIN_NAMES[state.tiles[to].terrain]}${revealed.length ? ` (odkryto ${revealed.length})` : ''}.`);
  arriveAt(state, hero);
}

/** A Przymierze hero picks up every free crystal lying on its hex. */
function pickUpCrystals(state: GameState, hero: HeroState) {
  const tile = state.tiles[hero.pos];
  for (const c of Object.values(state.crystals)) {
    if (c.at === hero.pos && !c.guardian) {
      c.at = `hero:${hero.id}`;
      hero.crystals.push(c.id);
      if (tile.crystalId === c.id) tile.crystalId = null;
      log(state, 'crystal', `${UNITS[hero.id].name} podnosi kryształ.`);
    }
  }
}

/** Pick-ups and delivery after a hero ends up on a hex. */
function arriveAt(state: GameState, hero: HeroState) {
  const tile = state.tiles[hero.pos];
  if (tile.treasureId) {
    const item = state.items[tile.treasureId];
    giveItem(state, item, hero.faction, hero.id);
    tile.treasureId = null;
    state.stats.treasuresCollected[hero.faction] += 1;
    log(state, 'item', `${UNITS[hero.id].name} znajduje skarb.`);
    log(state, 'item', `Skarb (${UNITS[hero.id].name}): ${ITEMS[item.kind].name}.`, hero.faction);
  }
  if (hero.faction === 'dawn') {
    pickUpCrystals(state, hero);
    if (tile.tree && hero.crystals.length) {
      const blocked = heroesAt(state, hero.pos).some((h) => h.faction === 'horde');
      if (!blocked) {
        for (const id of hero.crystals) state.crystals[id].at = 'tree';
        state.factions.dawn.delivered += hero.crystals.length;
        log(state, 'crystal', `${UNITS[hero.id].name} oddaje ${hero.crystals.length} kryształ(y) Drzewu (${state.factions.dawn.delivered}/${state.crystalsNeeded}).`);
        hero.crystals = [];
      }
    }
  }
  checkVictory(state);
}

function endTurn(state: GameState) {
  if (state.phase !== 'adventure') throw new Error('Najpierw zakończ bitwę.');
  // A reserve that could have come in but did not choose takes the first of its hexes.
  // (One that took over a turn already spent on a battle waits for its own next turn.)
  const hero = activeHero(state);
  if (hero?.entering && !state.turnBattleDone) enterBoard(state, hero, hero.entering[0]);
  advanceTurn(state);
}

function advanceTurn(state: GameState) {
  checkVictory(state);
  if (isOver(state)) return;
  for (;;) {
    state.turnIndex += 1;
    if (state.turnIndex >= state.turnOrder.length) {
      endRound(state);
      if (state.phase === 'over') return;
    }
    const hero = activeHero(state);
    if (hero && hero.alive) break;
    if (!state.turnOrder.some((id) => state.heroes[id].alive)) {
      checkVictory(state);
      if (state.phase === 'over') return;
    }
  }
  state.movePoints = state.rules.heroMovePoints;
  state.turnBattleDone = false;
}

function endRound(state: GameState) {
  if (ritualFormed(state)) {
    state.ritual += 1;
    log(state, 'round', `Rytuał przy Drzewie trwa (${state.ritual}/${state.rules.ritualRounds}).`);
    if (state.ritual >= state.rules.ritualRounds) {
      finish(state, 'horde', 'Mroczna Horda ukończyła rytuał przy Drzewie.');
      return;
    }
  } else if (state.ritual) {
    state.ritual = 0;
    log(state, 'round', 'Rytuał został przerwany.');
  }
  if (state.round >= state.roundLimit) {
    finish(state, 'horde', 'Upłynął limit rund.');
    return;
  }
  state.round += 1;
  state.turnOrder = computeTurnOrder(state);
  state.turnIndex = 0;
  log(state, 'round', `Runda ${state.round} z ${state.roundLimit}.`);
  if (!state.turnOrder.length) finish(state, 'horde', 'Nikt nie może już grać.');
}

function finish(state: GameState, winner: Side, reason: string) {
  state.phase = 'over';
  state.winner = winner;
  state.endReason = reason;
  state.battle = null;
  log(state, 'victory', `Koniec gry: wygrywa ${FACTION_NAMES[winner]}. ${reason}`);
}

function checkVictory(state: GameState) {
  if (state.phase === 'over') return;
  if (state.factions.dawn.delivered >= state.crystalsNeeded) {
    finish(state, 'dawn', 'Wszystkie kryształy wróciły do Drzewa.');
    return;
  }
  // Przymierze wins only with the crystals. When all its heroes are dead it can no longer
  // carry them, so the Horde wins (an Eliksir Odrodzenia needs a living hero to drink it).
  // Beating every Horde hero clears the way, but the crystals still have to reach the Tree.
  const dawn = Object.values(state.heroes).filter((h) => h.faction === 'dawn');
  if (dawn.length && dawn.every((h) => !h.alive)) finish(state, 'horde', 'Wszyscy bohaterowie Przymierza polegli.');
}

function useMapItem(state: GameState, itemId: string, targets: HexKey[] | undefined, unitId: string | undefined) {
  const hero = activeHero(state);
  if (!hero || !hero.alive || state.phase !== 'adventure') throw new Error('Skarbów na mapie używa się w swojej turze.');
  const item = state.items[itemId];
  if (!item || item.owner !== hero.faction) throw new Error('Nie masz tego skarbu.');
  if (item.kind === 'map') {
    const keys = [...new Set(targets ?? [])].filter((k) => state.tiles[k] && !state.tiles[k].revealed).slice(0, ITEM_EFFECT.mapReveal);
    if (!keys.length) throw new Error(`Wybierz do ${ITEM_EFFECT.mapReveal} zakrytych pól.`);
    for (const k of keys) state.tiles[k].revealed = true;
    log(state, 'item', `${UNITS[hero.id].name} używa Magicznej Mapy: odkryto ${keys.length} pola.`);
  } else if (item.kind === 'resurrection') {
    const f = state.factions[hero.faction];
    const deadHero = unitId ? state.heroes[unitId] : undefined;
    if (deadHero && deadHero.faction === hero.faction && !deadHero.alive) {
      // The revived hero stands on a free hex next to the one who drinks the elixir (one hero per hex).
      const spots = reviveSpots(state, hero);
      const to = targets?.[0] ?? spots[0];
      if (!to || !spots.includes(to)) throw new Error(spots.length ? 'Wskrzeszony bohater staje na wolnym polu obok.' : 'Obok nie ma wolnego pola dla wskrzeszonego bohatera.');
      deadHero.alive = true;
      deadHero.pos = to;
      revealAround(state, to);
      // The revived hero joins the turn order from the next round.
      log(state, 'item', `${UNITS[hero.id].name} używa Eliksiru Odrodzenia i wskrzesza: ${UNITS[deadHero.id].name}.`);
    } else if (unitId && f.supportsDead.includes(unitId)) {
      f.supportsDead.splice(f.supportsDead.indexOf(unitId), 1);
      f.supportsAlive.push(unitId);
      log(state, 'item', `${UNITS[hero.id].name} używa Eliksiru Odrodzenia i wskrzesza: ${UNITS[unitId].name}.`);
    } else throw new Error('Wybierz poległą jednostkę swojej frakcji.');
  } else throw new Error('Tego skarbu używa się w bitwie.');
  consumeItem(state, item.id);
}

// ------------------------------------------------------------------ battles

interface BattleStart {
  kind: 'heroes' | 'neutral';
  attackerHero: string;
  defenderHero?: string;
  neutralId?: string;
  mapHex: HexKey;
  from: HexKey;
}

function startBattle(state: GameState, s: BattleStart) {
  const attacker = state.heroes[s.attackerHero];
  const defenderHero = s.defenderHero ? state.heroes[s.defenderHero] : null;
  const b: BattleState = {
    kind: s.kind,
    mapHex: s.mapHex,
    arena: state.tiles[s.mapHex].side,
    attacker: attacker.faction,
    defender: defenderHero ? defenderHero.faction : 'neutral',
    attackerHero: attacker.id,
    attackerFrom: s.from,
    defenderHero: defenderHero?.id ?? null,
    neutralId: s.neutralId ?? null,
    duel: state.setup.battleMode === 'board',
    stage: 'select',
    needsDeploy: [],
    needsSelection: [],
    obstacles: state.setup.battleMode === 'board' ? [] : arenaObstacles(state.tiles[s.mapHex].side),
    units: {},
    round: 0,
    order: [],
    index: 0,
    activation: null,
    extra: [],
    winner: null,
    damageBy: {},
  };
  b.units[attacker.id] = makeBattleUnit(attacker.id, attacker.faction);
  if (defenderHero) b.units[defenderHero.id] = makeBattleUnit(defenderHero.id, defenderHero.faction);
  if (s.neutralId) {
    const g = makeBattleUnit(s.neutralId, 'neutral');
    // One hero alone against a guardian: the guardian fights with half its Życie.
    if (b.duel) g.hp = g.maxHp = guardianDuelHp(s.neutralId);
    b.units[s.neutralId] = g;
  }
  state.phase = 'battle';
  state.battle = b;
  state.turnBattleDone = true;
  state.movePoints = 0;
  state.stats.battles += 1;
  if (s.kind === 'neutral') state.stats.neutralBattles += 1;
  for (const f of [attacker.faction, defenderHero?.faction].filter(Boolean) as FactionId[]) {
    if (b.duel) break;
    const pool = state.factions[f].supportsAlive;
    if (pool.length <= SUPPORTS_PER_BATTLE) addSupports(state, f, [...pool]);
    else b.needsSelection.push(f);
  }
  if (!b.needsSelection.length) startBattleFight(state);
}

function addSupports(state: GameState, faction: FactionId, ids: string[]) {
  const b = state.battle!;
  for (const id of ids) b.units[id] = makeBattleUnit(id, faction);
}

function selectSupports(state: GameState, faction: FactionId, ids: string[]) {
  const b = state.battle;
  if (!b || b.stage !== 'select' || b.needsSelection[0] !== faction) throw new Error('Teraz nie wybiera ta frakcja.');
  const pool = state.factions[faction].supportsAlive;
  const unique = [...new Set(ids)];
  if (unique.length !== Math.min(SUPPORTS_PER_BATTLE, pool.length) || unique.some((id) => !pool.includes(id))) throw new Error('Wybierz dwóch żyjących pomocników.');
  addSupports(state, faction, unique);
  b.needsSelection.shift();
  if (!b.needsSelection.length) afterSelection(state);
}

/** Applies battle results to the adventure state once one side is gone. */
function finalizeBattle(state: GameState) {
  if (state.setup.mode === 'arena') return finishArena(state);
  const b = state.battle!;
  const winner = b.winner!;
  for (const u of Object.values(b.units)) {
    if (u.side === 'neutral' || u.alive || u.swappedOut) continue;
    const f = u.side as FactionId;
    if (UNITS[u.defId].kind === 'support') {
      const fs = state.factions[f];
      if (fs.supportsAlive.includes(u.defId)) {
        fs.supportsAlive.splice(fs.supportsAlive.indexOf(u.defId), 1);
        fs.supportsDead.push(u.defId);
        state.stats.supportDeaths[f] += 1;
        if (b.kind === 'neutral') state.stats.neutralSupportLosses += 1;
      }
    } else {
      killHero(state, u.defId, b.mapHex);
    }
  }
  const resultText = winner === 'draw' ? 'remis — obie strony poległy' : `wygrywa ${FACTION_NAMES[winner]}`;
  log(state, 'battle', `Bitwa zakończona: ${resultText}.`);
  if (b.kind === 'neutral') {
    if (winner === b.attacker) {
      const crystal = Object.values(state.crystals).find((c) => c.at === b.mapHex && c.guardian === b.neutralId);
      if (crystal) {
        crystal.guardian = null;
        log(state, 'crystal', `Strażnik pokonany. Kryształ jest wolny.`);
        guardianHoard(state, b.attackerHero);
      }
    } else {
      state.stats.neutralWipes += 1;
    }
  }
  state.lastBattle = battleReport(state, b);
  state.battle = null;
  state.phase = 'adventure';
  const attacker = state.heroes[b.attackerHero];
  // Several enemy heroes may share a hex but a battle is fought against one of them:
  // if any still stands there, the winner steps back instead of sharing the hex.
  if (attacker.alive && heroesAt(state, b.mapHex).some((h) => h.faction !== attacker.faction)) {
    attacker.pos = b.attackerFrom;
    log(state, 'move', `${UNITS[attacker.id].name} wraca na poprzednie pole — na polu bitwy stoją jeszcze wrogowie.`);
  }
  if (attacker.alive) arriveAt(state, attacker);
  checkVictory(state);
  if (isOver(state)) return;
  const active = activeHero(state);
  if (!active || !active.alive) advanceTurn(state);
}

function battleReport(state: GameState, b: BattleState): BattleReport {
  return {
    id: (state.lastBattle?.id ?? 0) + 1,
    kind: b.kind,
    duel: b.duel,
    attacker: b.attacker,
    defender: b.defender,
    winner: b.winner!,
    rounds: b.round,
    units: Object.values(b.units)
      .filter((u) => !u.swappedOut)
      .map((u) => ({ defId: u.defId, side: u.side, hp: Math.max(0, u.hp), maxHp: u.maxHp, alive: u.alive, damage: b.damageBy[u.id] ?? 0 })),
  };
}

/**
 * Guardians hoard treasure: a beaten guardian leaves one, drawn from the treasures not yet
 * in play (Eliksiry Odrodzenia stay out of this draw). Not in the "only Eliksiry Odrodzenia" option.
 */
function guardianHoard(state: GameState, heroId: string) {
  if (!state.rules.treasures) return;
  const used = new Set(Object.values(state.items).map((i) => i.kind));
  const left = NON_RESURRECTION_ITEMS.filter((k) => !used.has(k) && ITEMS[k].usableIn.includes('battle'));
  if (!left.length) return;
  const rng = new Rng(state.rng);
  const kind = rng.pick(left);
  state.rng = rng.state;
  const hero = state.heroes[heroId];
  giveItem(state, newItem(state, kind), hero.faction, hero.id);
  state.stats.treasuresCollected[hero.faction] += 1;
  log(state, 'item', `Strażnik zostawia swój skarb.`);
  log(state, 'item', `Skarb strażnika (${UNITS[hero.id].name}): ${ITEMS[kind].name}.`, hero.faction);
}

function killHero(state: GameState, heroId: string, at: HexKey) {
  const hero = state.heroes[heroId];
  if (!hero.alive) return;
  hero.alive = false;
  state.stats.heroDeaths[hero.faction] += 1;
  log(state, 'death', `${UNITS[heroId].name} poległ(a).`);
  for (const c of hero.crystals) {
    state.crystals[c].at = at;
    log(state, 'crystal', 'Kryształ upada na pole bitwy.');
  }
  hero.crystals = [];
  const f = state.factions[hero.faction];
  // The coop automaton keeps as many heroes as there are good players (spec 10), so in the
  // replacement variant it brings in a reserve hero just like the players do.
  const automaton = state.setup.mode === 'coop' && hero.faction === 'horde';
  if (state.rules.heroReplacement && (hero.playerId || automaton) && f.unusedHeroes.length) {
    const next = f.unusedHeroes[0];
    addHero(state, next, hero.faction, hero.playerId);
    // The reserve comes in near where the fallen hero died: on the nearest free hex,
    // or the player picks one of several equally near on the reserve's first turn.
    const spots = nearestFreeHexes(state, at, hero.faction);
    if (spots.length === 1) enterBoard(state, state.heroes[next], spots[0]);
    else if (spots.length) state.heroes[next].entering = spots;
    hero.playerId = null;
    state.turnOrder = state.turnOrder.map((id) => (id === heroId ? next : id));
    log(state, 'info', automaton ? `Automat zła wprowadza bohatera: ${UNITS[next].name}.` : `Gracz przejmuje bohatera: ${UNITS[next].name}.`);
  }
  if (automaton && state.rules.hordeRespawn) hordeReinforcement(state, heroId);
}

/**
 * Coop: once every automaton hero is dead, another Horde hero appears in the Horde base — an unused
 * one while there is any, then a fallen one comes back (not the one that has just died, if possible).
 * It joins the turn order from the next round.
 */
function hordeReinforcement(state: GameState, fallenId: string) {
  const horde = Object.values(state.heroes).filter((h) => h.faction === 'horde');
  if (horde.some((h) => h.alive)) return;
  const f = state.factions.horde;
  let id = f.unusedHeroes[0];
  if (id) addHero(state, id, 'horde', null);
  else {
    const dead = FACTION_HEROES.horde.filter((h) => state.heroes[h] && !state.heroes[h].alive);
    id = dead.find((h) => h !== fallenId) ?? fallenId;
    Object.assign(state.heroes[id], { alive: true, crystals: [], pos: homeKey(state.rows, 'horde') });
    delete state.heroes[id].entering;
  }
  const hero = state.heroes[id];
  // A Przymierze hero standing in the Horde base keeps it: the newcomer takes the nearest free hex.
  if (!canStand(state, hero.pos, 'horde', id)) hero.pos = nearestFreeHexes(state, hero.pos, 'horde')[0] ?? hero.pos;
  log(state, 'info', `W bazie Hordy pojawia się nowy bohater: ${UNITS[id].name}.`);
}

// ------------------------------------------------------------------ dispatcher

export function applyAction(prev: GameState, action: Action): GameState {
  if (prev.phase === 'over') throw new Error('Gra się zakończyła.');
  return applyActionInPlace(structuredClone(prev), action);
}

/**
 * Applies one action to `state` itself and returns it. Faster than applyAction (no copy), for
 * code that owns the state; when the action is refused the state may be left half changed.
 */
export function applyActionInPlace(state: GameState, action: Action): GameState {
  if (state.phase === 'over') throw new Error('Gra się zakończyła.');
  switch (action.type) {
    case 'moveHero':
      moveHero(state, action.to);
      break;
    case 'endTurn':
      endTurn(state);
      break;
    case 'useMapItem':
      useMapItem(state, action.itemId, action.targets, action.unitId);
      break;
    case 'selectSupports':
      selectSupports(state, action.faction, action.supportIds);
      break;
    case 'deployUnits':
      if (!state.battle) throw new Error('Nie trwa żadna bitwa.');
      deployUnits(state, action.faction, action.positions);
      break;
    case 'draftPick':
      draftPick(state, action.faction, action.kind);
      break;
    default:
      applyBattleAction(state, action);
  }
  if (state.phase === 'battle' && state.battle && checkBattleEnd(state)) finalizeBattle(state);
  // A free crystal never lies under a Przymierze hero: whoever stands there takes it at once.
  if (state.phase === 'adventure') for (const h of Object.values(state.heroes)) if (h.alive && h.faction === 'dawn') pickUpCrystals(state, h);
  state.actionCount += 1;
  return state;
}

function applyBattleAction(state: GameState, action: Action) {
  const b = state.battle;
  if (!b || b.stage !== 'fight' || !b.activation) throw new Error('Nie trwa żadna bitwa.');
  switch (action.type) {
    case 'battleMove':
      battleMove(state, action.to);
      break;
    case 'battleAttack':
      battleAttack(state, action.targetId, Boolean(action.useAbility), action.secondTargetId);
      break;
    case 'battleAbility':
      battleAbility(state, action.targetId);
      break;
    case 'battleHop':
      battleHop(state, action.to);
      break;
    case 'battleItem':
      battleItem(state, action);
      break;
    case 'endActivation':
      endActivation(state);
      break;
    default:
      throw new Error('Nieznana akcja.');
  }
}
