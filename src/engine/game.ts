// Game flow: setup, adventure turns, battle triggers and aftermath, victory.
// `applyAction` is the single entry point: it clones the state, applies one
// action and returns the new state, so every game is a replayable action log.

import {
  FACTION_HEROES,
  FACTION_NAMES,
  FACTION_SUPPORTS,
  ITEMS,
  MAP_VARIANTS,
  NON_RESURRECTION_ITEMS,
  TERRAIN_COST,
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
import type { HexKey } from './hex';
import { generateMap, homeKey, mapNeighbors, revealAround, tileCost, treeKey } from './map';
import { Rng } from './rng';
import type { Action, BattleState, GameState, HeroState, LogKind, Player, SetupOptions } from './types';

export const other = (f: FactionId): FactionId => (f === 'dawn' ? 'horde' : 'dawn');

/** Re-reads the phase after calls that may end the game (keeps TS narrowing honest). */
export const isOver = (state: GameState): boolean => state.phase === 'over';

export function log(state: GameState, kind: LogKind, text: string, privateTo?: FactionId) {
  state.log.push({ round: state.round, kind, text, ...(privateTo ? { privateTo } : {}) });
}

// ------------------------------------------------------------------ setup

export function createGame(setup: SetupOptions): GameState {
  const rng = new Rng(setup.seed);
  const variant = MAP_VARIANTS[setup.mapSize];

  // Treasure pool: all Eliksiry Odrodzenia are set aside, then exactly the required
  // number goes back together with random other treasures (spec section 4).
  // Without treasures the map simply has no treasure tiles.
  const others = rng.shuffle(NON_RESURRECTION_ITEMS).slice(0, variant.otherTreasures);
  const pool: ItemKind[] = setup.rules.treasures ? rng.shuffle([...Array(variant.resurrections).fill('resurrection'), ...others]) : [];
  const map = generateMap(setup.mapSize, rng, pool.length);

  const state: GameState = {
    version: 1,
    setup,
    rules: setup.rules,
    rng: 0,
    round: 1,
    roundLimit: variant.roundLimit,
    crystalsNeeded: variant.crystals,
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
    const id = `it${i + 1}`;
    state.items[id] = { id, kind, owner: null, foundBy: null };
    state.tiles[map.treasureHexes[i]].treasureId = id;
  });
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
    // As many evil heroes as good heroes at the start (spec section 1).
    const goodCount = setup.seats.filter((s) => s.faction === 'dawn').length;
    // Optionally one more, to make the coop game harder (there are 3 Horde heroes at most).
    const evilCount = Math.min(FACTION_HEROES.horde.length, goodCount + (setup.rules.extraEvilHero ? 1 : 0));
    const evil = rng.shuffle(FACTION_HEROES.horde).slice(0, evilCount);
    for (const id of evil) addHero(state, id, 'horde', null);
  }

  for (const f of ['dawn', 'horde'] as FactionId[]) revealAround(state, homeKey(state.rows, f));
  state.tiles[treeKey()].revealed = true;
  state.rng = rng.state;
  state.turnOrder = computeTurnOrder(state);
  state.turnIndex = 0;
  log(state, 'round', `Runda 1 z ${state.roundLimit}. Przymierze potrzebuje ${state.crystalsNeeded} kryształów.`);
  return state;
}

function addHero(state: GameState, heroId: string, faction: FactionId, playerId: string | null) {
  state.heroes[heroId] = { id: heroId, faction, playerId, pos: homeKey(state.rows, faction), alive: true, crystals: [] };
  const unused = state.factions[faction].unusedHeroes;
  if (unused.includes(heroId)) unused.splice(unused.indexOf(heroId), 1);
}

export function computeTurnOrder(state: GameState): string[] {
  const heroes = Object.values(state.heroes);
  const seatOrder = (h: HeroState) => (h.playerId ? state.players.findIndex((p) => p.id === h.playerId) : 100);
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

export function heroesAt(state: GameState, k: HexKey): HeroState[] {
  return Object.values(state.heroes).filter((h) => h.alive && h.pos === k);
}

export type MoveKind = 'move' | 'attackHero' | 'attackGuardian';

export interface HeroMove {
  to: HexKey;
  cost: number;
  kind: MoveKind;
}

/** Adjacent hexes the active hero may enter now. */
export function legalHeroMoves(state: GameState): HeroMove[] {
  const hero = activeHero(state);
  if (!hero || state.phase !== 'adventure' || state.turnBattleDone || !hero.alive) return [];
  const out: HeroMove[] = [];
  for (const n of mapNeighbors(state.tiles, hero.pos)) {
    const tile = state.tiles[n];
    const cost = tileCost(tile);
    if (cost === null || !tile.revealed) continue;
    const enemies = heroesAt(state, n).filter((h) => h.faction !== hero.faction);
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
  if (move.kind === 'attackHero') {
    const defender = heroesAt(state, to).find((h) => h.faction !== hero.faction)!;
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

/** Pick-ups and delivery after a hero ends up on a hex. */
function arriveAt(state: GameState, hero: HeroState) {
  const tile = state.tiles[hero.pos];
  if (tile.treasureId) {
    const item = state.items[tile.treasureId];
    item.owner = hero.faction;
    item.foundBy = hero.id;
    state.factions[hero.faction].inventory.push(item.id);
    tile.treasureId = null;
    state.stats.treasuresCollected[hero.faction] += 1;
    log(state, 'item', `${UNITS[hero.id].name} znajduje skarb.`);
    log(state, 'item', `Skarb (${UNITS[hero.id].name}): ${ITEMS[item.kind].name}.`, hero.faction);
  }
  if (hero.faction === 'dawn') {
    for (const c of Object.values(state.crystals)) {
      if (c.at === hero.pos && !c.guardian) {
        c.at = `hero:${hero.id}`;
        hero.crystals.push(c.id);
        if (tile.crystalId === c.id) tile.crystalId = null;
        log(state, 'crystal', `${UNITS[hero.id].name} podnosi kryształ.`);
      }
    }
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
  const tree = treeKey();
  const evil = Object.values(state.heroes).filter((h) => h.faction === 'horde' && h.alive);
  if (evil.length && evil.every((h) => h.pos === tree)) {
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
  // A faction whose heroes are all dead loses. An Eliksir Odrodzenia needs a living hero
  // to drink it, so it cannot help any more.
  const allDead = (f: FactionId) => {
    const heroes = Object.values(state.heroes).filter((h) => h.faction === f);
    return heroes.length > 0 && heroes.every((h) => !h.alive);
  };
  const dawnOut = allDead('dawn');
  const hordeOut = allDead('horde');
  // Both lose their last heroes in the same battle: the side that won the battle wins
  // (its supports were still standing). A drawn battle counts for the Horde.
  if (dawnOut && hordeOut) {
    const w = state.lastBattle?.winner === 'dawn' ? 'dawn' : 'horde';
    finish(state, w, 'Ostatni bohaterowie obu frakcji polegli w jednej bitwie — wygrywa strona, która ją wygrała.');
  } else if (dawnOut) finish(state, 'horde', 'Wszyscy bohaterowie Przymierza polegli.');
  else if (hordeOut) finish(state, 'dawn', 'Wszyscy bohaterowie Mrocznej Hordy polegli.');
}

function useMapItem(state: GameState, itemId: string, targets: HexKey[] | undefined, unitId: string | undefined) {
  const hero = activeHero(state);
  if (!hero || !hero.alive || state.phase !== 'adventure') throw new Error('Skarbów na mapie używa się w swojej turze.');
  const item = state.items[itemId];
  if (!item || item.owner !== hero.faction) throw new Error('Nie masz tego skarbu.');
  if (item.kind === 'map') {
    const keys = [...new Set(targets ?? [])].filter((k) => state.tiles[k] && !state.tiles[k].revealed).slice(0, 3);
    if (!keys.length) throw new Error('Wybierz do 3 zakrytych pól.');
    for (const k of keys) state.tiles[k].revealed = true;
    log(state, 'item', `${UNITS[hero.id].name} używa Magicznej Mapy: odkryto ${keys.length} pola.`);
  } else if (item.kind === 'resurrection') {
    const f = state.factions[hero.faction];
    const deadHero = unitId ? state.heroes[unitId] : undefined;
    if (deadHero && deadHero.faction === hero.faction && !deadHero.alive) {
      deadHero.alive = true;
      deadHero.pos = hero.pos;
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
  if (s.neutralId) b.units[s.neutralId] = makeBattleUnit(s.neutralId, 'neutral');
  state.phase = 'battle';
  state.battle = b;
  state.turnBattleDone = true;
  state.movePoints = 0;
  state.stats.battles += 1;
  if (s.kind === 'neutral') state.stats.neutralBattles += 1;
  for (const f of [attacker.faction, defenderHero?.faction].filter(Boolean) as FactionId[]) {
    if (b.duel) break;
    const pool = state.factions[f].supportsAlive;
    if (pool.length <= 2) addSupports(state, f, [...pool]);
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
  if (unique.length !== Math.min(2, pool.length) || unique.some((id) => !pool.includes(id))) throw new Error('Wybierz dwóch żyjących pomocników.');
  addSupports(state, faction, unique);
  b.needsSelection.shift();
  if (!b.needsSelection.length) startBattleFight(state);
}

/** Applies battle results to the adventure state once one side is gone. */
function finalizeBattle(state: GameState) {
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
      }
    } else {
      state.stats.neutralWipes += 1;
    }
  }
  state.lastBattle = {
    id: (state.lastBattle?.id ?? 0) + 1,
    kind: b.kind,
    duel: b.duel,
    attacker: b.attacker,
    defender: b.defender,
    winner,
    rounds: b.round,
    units: Object.values(b.units)
      .filter((u) => !u.swappedOut)
      .map((u) => ({ defId: u.defId, side: u.side, hp: Math.max(0, u.hp), maxHp: u.maxHp, alive: u.alive, damage: b.damageBy[u.id] ?? 0 })),
  };
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
    hero.playerId = null;
    state.turnOrder = state.turnOrder.map((id) => (id === heroId ? next : id));
    log(state, 'info', automaton ? `Automat zła wprowadza bohatera: ${UNITS[next].name}.` : `Gracz przejmuje bohatera: ${UNITS[next].name}.`);
  }
}

// ------------------------------------------------------------------ dispatcher

export function applyAction(prev: GameState, action: Action): GameState {
  if (prev.phase === 'over') throw new Error('Gra się zakończyła.');
  const state: GameState = structuredClone(prev);
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
    default:
      applyBattleAction(state, action);
  }
  if (state.phase === 'battle' && state.battle && checkBattleEnd(state)) finalizeBattle(state);
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

export function terrainCostLabel(k: HexKey, state: GameState): string {
  const c = TERRAIN_COST[state.tiles[k].terrain];
  return c === null ? 'nieprzechodnie' : String(c);
}
