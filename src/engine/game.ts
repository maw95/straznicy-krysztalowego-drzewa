// Game flow: setup, adventure turns, battle triggers and aftermath, victory.
// `applyAction` is the single entry point: it clones the state, applies one
// action and returns the new state, so every game is a replayable action log.
// `applyActionInPlace` does the same on the state it is given (simulations, replays).

import { byTeam, raceOf, sideName, teamsOf } from './teams';
import {
  FACTION_HEROES,
  FACTION_NAMES,
  FACTION_SUPPORTS,
  ABILITY,
  ITEM_EFFECT,
  ITEMS,
  itemDef,
  MAP_VARIANTS,
  SHAPE_ROUND_FACTOR,
  NON_RESURRECTION_ITEMS,
  ARENA_DECK,
  ARENA_OFFER,
  ARENA_PICKS,
  ARENA_RULES,
  ARTIFACT,
  FAMILY,
  STAT_SCALE,
  HP_SCALE,
  MAP_REROLL_BLOCKED,
  RESURRECTION_CARDS,
  TERRAIN_NAMES,
  UNITS,
  supportTier,
  type TeamId,
  type ItemKind,
  type MapSize,
  type Side,
} from './data';
import {
  battleAbility,
  battleAttack,
  battleMirageSwap,
  battleTideSwap,
  battleHop,
  battleTeleport,
  battleItem,
  battleMove,
  battleCatapult,
  makeSiege,
  siegeObstacles,
  checkBattleEnd,
  deployUnits,
  pickMirages,
  consumeItem,
  endActivation,
  makeBattleUnit,
  scaleOf,
  hpScaleOf,
  startBattleFight,
  arenaObstacles,
} from './battle';
import { distance, parseKey, type HexKey } from './hex';
import { placeEncounters } from './encounters';
import { generateMap, homeOf, mapNeighbors, revealAround, seeHex, tileCost, treeOf } from './map';
import { knowsHex } from './hidden';
import { log, logFor, logPublic } from './log';
import { unmaskId } from './hidden';
import { applyHeroSkills, applyHeroType, applyMilestones, applySupportSkill, awardXp, chooseSkill, chooseTreasure, deployDepthOf, GROWTH, huntOf, moveBonus, scholarXp, scoutRadiusOf } from './growth';
import { objectiveOf, OBJECTIVES } from './objectives';
import { fireStory } from './story';
import { ARENA_POOL, bestLevel, buildingLevel, collectIncome, isAutomaton, enterPlace, forgeLevel, garrisonAt, initKingdom, kingdomAction, supportSlots } from './kingdom';
import { ECONOMY } from './economy';
import { commanderFalls } from './realm';
import { ARENA_SPELL_PICKS, ARENA_SPELL_POOL, battleSpell, mapSpell, regenMana, SPELL_VALUE, START_SPELLS, type SpellId } from './magic';
import { HERO_TYPES, specialtyOf } from './heroTypes';
import { EMPIRE, FACTION_MECHANICS, hasSpark, loseShards, mechanicLevel, summedLevel } from './empire';
import { applyGear, ARTIFACT_BY_ID, arenaGearOffer, gearOf, applySupportGear, ARTIFACT_ODDS, ARTIFACTS, captureGear, drawArtifact, equipArtifact, gearMoveBonus, gearReveal, giveArtifact, COMPUTER_ARTIFACT_ODDS, heroTileCost, passArtifact, passShards, placeSites, SHARDS_ID, unequipArtifact, visitSite } from './sites';
import { Rng } from './rng';
import { digitalRules } from './tuning';
import { advantagedFaction, computerFaction, isDigital, type Action, type BattleReport, type BattleState, type GameState, type HeroState, type ItemInstance, type Player, type SetupOptions } from './types';

export const other = (f: TeamId): TeamId => (f === 'dawn' ? 'horde' : 'dawn');

/** Re-reads the phase after calls that may end the game (keeps TS narrowing honest). */
export const isOver = (state: GameState): boolean => state.phase === 'over';

// ------------------------------------------------------------------ setup

/** Crystals on the map (and needed at the Tree): 2 for one Przymierze hero, 3 for two or three (there are three guardian lairs). */
/** Units of this faction fight without the digital balancing bonus: always in the 6 on 6 arena, and on Easy where the tuning takes it from the bot's faction (`noFactionBonus`). */
export const withoutBonus = (state: GameState, faction: TeamId): boolean | 3 | 6 => (state.setup.mode === 'arena' ? (state.rules.arenaSize === 6 ? 6 : 3) : Boolean(state.rules.noFactionBonus?.includes(raceOf(state, faction))));
/** The share of the digital balancing bonus the units of this faction keep (`factionBonusShare`; 1 = all of it). */
export const bonusShare = (state: GameState, faction: TeamId): number => {
  const s = state.rules.factionBonusShare;
  return s && s.factions.includes(raceOf(state, faction)) ? s.share : 1;
};

export function crystalsFor(setup: SetupOptions): number {
  return setup.seats.filter((s) => s.faction === 'dawn').length >= 2 ? 3 : 2;
}

/** The smallest map (by size) with room for three and for four teams. */
const MAP_SIZE_FOR_TEAMS: Record<number, MapSize> = { 3: 'medium', 4: 'long' };
const SIZE_ORDER: MapSize[] = ['short', 'medium', 'long', 'veryLong', 'huge', 'giant'];

/** What a game may have for sides: the crystals goal is the story of Przymierze against Horda only; three or four teams need a rectangle map that is big enough. */
function checkSides(setup: SetupOptions, rules: SetupOptions['rules']) {
  // The new factions play rivalries and the digital arena: coop and the board edition have a fixed pair of factions (backlog 51a).
  if ((setup.mode === 'coop' || (setup.mode === 'arena' && !isDigital(rules))) && setup.seats.some((s) => s.race !== undefined && s.race !== raceOf(null, s.faction))) throw new Error('Nowe frakcje grają tylko w rywalizacji i na arenie wersji cyfrowej.');
  if (setup.mode === 'arena') return;
  const n = teamsOf({ setup }).length;
  if (n < 2) throw new Error('Przy stole muszą być co najmniej dwie różne frakcje.');
  if (setup.mode === 'coop' && setup.seats.some((s) => s.faction !== 'dawn')) throw new Error('Kooperacja ma dwie strony: drużynę graczy i komputer.');
  // The story of the crystals is about Przymierze and Horda: exactly those two sides.
  if (objectiveOf({ rules }) === 'crystals' && (n > 2 || (raceOf({ setup }, 'dawn') !== 'dawn' || (n > 1 && raceOf({ setup }, 'horde') !== 'horde')))) throw new Error('Ta historia jest o Przymierzu i Hordzie: cel „Kryształy do Drzewa” wymaga tej pary.');
  if (n > 2) {
    if (!isDigital(rules) || setup.mapShape !== 'rectangle') throw new Error('Trzy i cztery strony grają na prostokątnej mapie wersji cyfrowej.');
    if (SIZE_ORDER.indexOf(setup.mapSize) < SIZE_ORDER.indexOf(MAP_SIZE_FOR_TEAMS[n])) throw new Error('Ta mapa jest za mała dla tylu stron.');
  }
}

export function createGame(setup: SetupOptions): GameState {
  const tuned = digitalRules(setup);
  // Hero growth (the Expedition level and higher) plays with the larger numbers; an explicit `statScale` (tests, simulations) wins.
  const rules = isDigital(tuned) && tuned.heroGrowth && setup.mode !== 'arena' && tuned.statScale === undefined ? { ...tuned, statScale: STAT_SCALE, hpScale: HP_SCALE } : tuned;
  const rng = new Rng(setup.seed);
  const variant = MAP_VARIANTS[setup.mapSize];
  checkSides(setup, rules);

  // Treasure pool: all Eliksiry Odrodzenia are set aside, then exactly the required
  // number goes back together with random other treasures (spec section 4).
  // The simple option ("only Eliksiry Odrodzenia") puts a few elixirs on the map and nothing else.
  const others = rng.shuffle(NON_RESURRECTION_ITEMS).slice(0, variant.otherTreasures);
  const pool: ItemKind[] = rules.treasures
    ? rng.shuffle([...Array(variant.resurrections).fill('resurrection'), ...others])
    : Array(variant.onlyResurrections).fill('resurrection');
  const crystals = crystalsFor(setup);
  const teams = teamsOf({ setup });
  const map = generateMap(setup.mapSize, rng, pool.length, crystals, isDigital(rules) ? setup.mapShape : undefined, setup.customMapId, { teams, race: (t) => raceOf({ setup }, t), ...(isDigital(rules) ? { rerollBlocked: MAP_REROLL_BLOCKED } : {}) });
  const digital = isDigital(rules);

  const state: GameState = {
    version: 1,
    setup,
    rules,
    rng: 0,
    round: 1,
    roundLimit: Math.round(variant.roundLimit * (isDigital(rules) ? SHAPE_ROUND_FACTOR[setup.mapShape ?? 'triangle'] : 1)) + (rules.roundLimitBonus ?? 0),
    crystalsNeeded: Math.max(1, crystals + (rules.crystalsNeededDelta ?? 0)),
    phase: 'adventure',
    players: [],
    heroes: {},
    factions: byTeam(teams, (t) => ({ id: t, supportsAlive: [...FACTION_SUPPORTS[raceOf({ setup }, t)]], supportsDead: [], inventory: [], delivered: 0, unusedHeroes: [...FACTION_HEROES[raceOf({ setup }, t)]] })),
    tiles: map.tiles,
    rows: map.rows,
    // Only a map of another shape stores them (the triangle's corners are the default), so a triangle game's state is as before.
    ...(digital && setup.mapShape && setup.mapShape !== 'triangle' ? { tree: map.tree, homes: map.homes } : {}),
    crystals: {},
    items: {},
    turnOrder: [],
    turnIndex: 0,
    movePoints: rules.heroMovePoints,
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
      heroDeaths: byTeam(teams, () => 0),
      supportDeaths: byTeam(teams, () => 0),
      treasuresCollected: byTeam(teams, () => 0),
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
  // The computer's advantage of the higher levels: more random treasures from the start (COMPUTER_HANDICAP).
  const extra = (f: TeamId, start: { resurrections: number; others: number; random?: number } | undefined) =>
    rules.computerTreasures && advantagedFaction(state, f) ? { resurrections: 0, others: 0, ...start, random: (start?.random ?? 0) + rules.computerTreasures } : start;
  dealStartTreasures(state, rng, 'dawn', extra('dawn', rules.dawnStartTreasures ?? variant.startTreasures), dealt, pool);
  dealStartTreasures(state, rng, 'horde', extra('horde', rules.hordeStartTreasures), dealt, pool);
  // The third and fourth team start as the second one does (nothing, unless the computer's advantage adds some).
  for (const t of teams.slice(2)) dealStartTreasures(state, rng, t, extra(t, rules.hordeStartTreasures), dealt, pool);
  map.crystals.forEach((c, i) => {
    const id = `c${i + 1}`;
    state.crystals[id] = { id, guardian: c.guardian, at: c.hex };
    state.tiles[c.hex].crystalId = id;
  });
  // Only the crystals goal carries crystals to the Tree: in every other goal the guardians stay (a fight, a treasure, experience) but keep nothing.
  if (objectiveOf(state) !== 'crystals') for (const c of Object.values(state.crystals)) c.decoy = true;
  OBJECTIVES[objectiveOf(state)].init(state);

  setup.seats.forEach((seat, i) => {
    const player: Player = { id: `p${i + 1}`, name: seat.name, faction: seat.faction, controller: seat.controller, ...(seat.child && setup.mode !== 'arena' && isDigital(rules) ? { child: true } : {}), ...(setup.seatLevels && seat.controller === 'bot' ? { botLevel: seat.botLevel ?? 'normal' } : {}) };
    state.players.push(player);
    addHero(state, seat.heroId, seat.faction, player.id);
  });
  if (setup.mode === 'coop') {
    // As many evil heroes as good heroes at the start (spec section 1), at least rules.minEvilHeroes.
    const goodCount = setup.seats.filter((s) => s.faction === 'dawn').length;
    // Optionally one more, to make the coop game harder (there are 3 Horde heroes at most).
    const evilCount = rules.noHorde && objectiveOf(state) === 'boss' ? 0 : Math.min(FACTION_HEROES[raceOf(state, 'horde')].length, Math.max(goodCount, rules.minEvilHeroes ?? 1) + (rules.extraEvilHero ? 1 : 0));
    const evil = rng.shuffle(FACTION_HEROES[raceOf(state, 'horde')]).slice(0, evilCount);
    for (const id of evil) addHero(state, id, 'horde', null);
  }

  for (const f of teams) revealAround(state, homeOf(state, f), 1, f);
  // The Tree is known from the start; where the goal has removed it, the middle hex lies hidden like the rest (unless the goal itself shows it).
  if (state.tiles[treeOf(state)].tree) seeHex(state, treeOf(state));
  state.rng = rng.state;
  placeSites(state);
  placeEncounters(state);
  if (state.rules.kingdom && state.rules.heroGrowth && setup.mode !== 'arena' && setup.battleMode === 'arena') initKingdom(state);
  state.turnOrder = computeTurnOrder(state);
  state.turnIndex = 0;
  // The computer's start advantage of the highest difficulty (COMPUTER_HANDICAP): artifacts of rarity 1-2 for its main hero.
  if (rules.computerArtifacts && rules.heroGrowth && setup.mode !== 'arena') {
    for (const f of teams) {
      const main = state.turnOrder.map((id) => state.heroes[id]).find((h) => h?.faction === f && !h.secondary);
      if (main && advantagedFaction(state, f)) for (let i = 0; i < rules.computerArtifacts; i++) giveArtifact(state, main, drawArtifact(state, main, COMPUTER_ARTIFACT_ODDS, 0x51ed270b + i * 7919), 'przewaga komputera');
    }
  }
  if (setup.mode === 'arena') {
    // The 6 on 6 arena: both sides choose from the fixed pool instead of the three starting supports.
    if (rules.arenaSize === 6) for (const f of ['dawn', 'horde'] as TeamId[]) state.factions[f].supportsAlive = [...ARENA_POOL[raceOf(state, f)]];
    startArena(state);
    return state;
  }
  log(state, 'round', `Runda 1 z ${state.roundLimit}. Przymierze potrzebuje ${state.crystalsNeeded} kryształów.`);
  // A story note for the very start (round 1) opens with the game.
  fireStory(state);
  return state;
}

/**
 * Treasures a faction holds from the start (MapVariant.startTreasures, rules.hordeStartTreasures):
 * Eliksiry Odrodzenia, kinds other than those already `dealt` (it grows), and `random` cards of
 * what is left in the box, which may be an Eliksir too. `onMap` is the map's treasure pool.
 */
function dealStartTreasures(state: GameState, rng: Rng, faction: TeamId, start: { resurrections: number; others: number; random?: number } | undefined, dealt: Set<ItemKind>, onMap: ItemKind[]) {
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
  const coin: TeamId = rng.int(2) === 0 ? 'dawn' : 'horde';
  const first: TeamId = ARENA_RULES.firstPicker === 'random' ? coin : ARENA_RULES.firstPicker;
  const second = other(first);
  // The painted arena of one of the two factions.
  const arena = raceOf(state, rng.int(2) === 0 ? 'dawn' : 'horde');
  state.rng = rng.state;
  const heroOf = (f: TeamId) => Object.values(state.heroes).find((h) => h.faction === f);
  const [dawn, horde] = [heroOf('dawn'), heroOf('horde')];
  if (!dawn || !horde || raceOf(state, 'dawn') === raceOf(state, 'horde')) throw new Error('Na arenie walczą bohaterowie dwóch różnych frakcji.');
  const hero = (f: TeamId) => (f === 'dawn' ? dawn : horde);
  const extra = (['dawn', 'horde'] as TeamId[]).flatMap((f) => Array<TeamId>(ARENA_RULES.extraPicks[raceOf(state, f)] + (computerFaction(state, f) ? state.rules.computerDraft?.picks ?? 0 : 0)).fill(f));
  // ARENA_PICKS each, snaking: A, B, B, A, A, B, …
  const picks = Array.from({ length: ARENA_PICKS }, (_, i) => (i % 2 ? [second, first] : [first, second])).flat();
  state.draft = { deck: [...ARENA_DECK], order: [...picks, ...extra], offer: [] };
  log(state, 'battle', `Arena: ${UNITS[hero('dawn').id].name} kontra ${UNITS[hero('horde').id].name}. Pierwsza wybiera ${FACTION_NAMES[raceOf(state, first)]}.`);
  startBattle(state, { kind: 'heroes', attackerHero: hero(first).id, defenderHero: hero(second).id, mapHex: hero(first).pos, from: hero(first).pos });
  const b = state.battle!;
  b.arena = arena;
  b.obstacles = arenaObstacles(arena, b.layout);
  // Six units a side do not fit the one start column of the board: both sides get a second one.
  if (state.rules.arenaSize === 6) {
    b.deployDepth = { dawn: Math.max(1, b.deployDepth?.dawn ?? 0), horde: Math.max(1, b.deployDepth?.horde ?? 0) };
    // "Bardzo trudny": the computer's hero holds more mana (its extra spells come with its choice of spells).
    const hc = state.rules.arenaHandicap;
    for (const f of ['dawn', 'horde'] as TeamId[]) {
      if (hc && computerFaction(state, f)) hero(f).manaBonus = hc.mana;
      // Expedition: the relics of the person's hero.
      else if (state.rules.arenaBoost && !computerFaction(state, f)) hero(f).manaBonus = (hero(f).manaBonus ?? 0) + state.rules.arenaBoost.mana;
    }
    state.draft!.gear = { order: [first, second], offer: arenaGearOffer(state, first) };
    b.stage = 'gear';
  }
}

/** 6 on 6 arena: the side whose turn it is takes one of the three offered artifacts for its hero. */
function pickGear(state: GameState, faction: TeamId, artifactId: string) {
  const g = state.draft?.gear;
  const b = state.battle;
  if (!g || !b || b.stage !== 'gear' || g.order[0] !== faction) throw new Error('Teraz nie wybiera ta frakcja.');
  if (!g.offer.includes(artifactId)) throw new Error('Tego artefaktu nie ma wśród pokazanych.');
  const hero = state.heroes[battleHeroOf(b, faction)!];
  giveArtifact(state, hero, ARTIFACT_BY_ID[artifactId], 'arena');
  // "Bardzo trudny": the computer's hero also puts on the best of fresh offers (of other slots).
  const hc = state.rules.arenaHandicap;
  const extraGear = computerFaction(state, faction) ? hc?.gear ?? 0 : state.rules.arenaBoost?.gear ?? 0;
  if (extraGear) {
    for (let i = 0; i < extraGear; i++) {
      const worn = new Set(gearOf(hero).map((a) => a.slot));
      const extra = arenaGearOffer(state, `${faction}${i}`).map((id) => ARTIFACT_BY_ID[id]).filter((a) => !worn.has(a.slot)).sort((x, y) => y.rarity - x.rarity)[0];
      if (extra) giveArtifact(state, hero, extra, 'arena');
    }
  }
  applyGear(hero, b.units[hero.id]);
  g.order.shift();
  if (g.order.length) g.offer = arenaGearOffer(state, g.order[0]);
  else {
    delete state.draft!.gear;
    const firstSide = b.attacker as TeamId;
    state.draft!.spells = { order: [firstSide, other(firstSide)] };
    b.stage = 'spells';
  }
}

/** 6 on 6 arena: the side whose turn it is chooses the spells of its hero (the computer's hero at "Bardzo trudny" gets more of them on top). */
function pickSpells(state: GameState, faction: TeamId, spells: SpellId[]) {
  const sp = state.draft?.spells;
  const b = state.battle;
  if (!sp || !b || b.stage !== 'spells' || sp.order[0] !== faction) throw new Error('Teraz nie wybiera ta frakcja.');
  const unique = [...new Set(spells)];
  if (unique.length !== ARENA_SPELL_PICKS || unique.some((id) => !ARENA_SPELL_POOL.includes(id))) throw new Error(`Wybierz ${ARENA_SPELL_PICKS} różne czary z listy.`);
  const hc = state.rules.arenaHandicap;
  const extraSpells = computerFaction(state, faction) ? hc?.spells ?? 0 : state.rules.arenaBoost?.spells ?? 0;
  const extra = extraSpells ? ARENA_SPELL_POOL.filter((id) => !unique.includes(id)).sort((x, y) => SPELL_VALUE[y] - SPELL_VALUE[x]).slice(0, extraSpells) : [];
  state.heroes[battleHeroOf(b, faction)!].spells = [...unique, ...extra];
  sp.order.shift();
  if (!sp.order.length) {
    delete state.draft!.spells;
    b.stage = 'select';
  }
}

/** The next three cards for the picker: the deck is shuffled and the first three different kinds are shown. */
function dealOffer(state: GameState) {
  const d = state.draft!;
  const rng = new Rng(state.rng);
  d.offer = [...new Set(rng.shuffle(d.deck))].slice(0, ARENA_OFFER + ARENA_RULES.extraOffer[raceOf(state, d.order[0])] + (computerFaction(state, d.order[0]) ? state.rules.computerDraft?.offer ?? 0 : 0));
  state.rng = rng.state;
}

/** After both sides chose their supports: the draft in the arena, the deployment otherwise. */
function afterSelection(state: GameState) {
  if (state.draft?.order.length) {
    state.battle!.stage = 'draft';
    dealOffer(state);
  } else startBattleFight(state);
}

function draftPick(state: GameState, faction: TeamId, kind: ItemKind) {
  const d = state.draft;
  const b = state.battle;
  if (!d || !b || b.stage !== 'draft' || d.order[0] !== faction) throw new Error('Teraz nie wybiera ta frakcja.');
  if (!d.offer.includes(kind)) throw new Error('Tego skarbu nie ma wśród pokazanych.');
  d.deck.splice(d.deck.indexOf(kind), 1);
  giveItem(state, newItem(state, kind), faction, battleHeroOf(b, faction));
  log(state, 'item', `${FACTION_NAMES[raceOf(state, faction)]} wybiera skarb.`);
  log(state, 'item', `Wybrany skarb: ${itemDef(kind, isDigital(state.rules)).name}.`, faction);
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
export function newItem(state: GameState, kind: ItemKind): ItemInstance {
  const id = `it${Object.keys(state.items).length + 1}`;
  return (state.items[id] = { id, kind, owner: null, foundBy: null });
}

/** A treasure goes to a faction's shared inventory; `foundBy` is the hero who got it. */
export function giveItem(state: GameState, item: ItemInstance, faction: TeamId, foundBy: string | null) {
  item.owner = faction;
  item.foundBy = foundBy;
  state.factions[faction].inventory.push(item.id);
}

/** Whether the hero is played by a child (family mode). */
export const isChildHero = (state: GameState, hero: HeroState): boolean => Boolean(hero.playerId && state.players.find((p) => p.id === hero.playerId)?.child);

/** A new treasure card of `kind` goes to the faction's shared inventory. */
export function grantTreasure(state: GameState, kind: ItemKind, faction: TeamId, foundBy: string | null) {
  giveItem(state, newItem(state, kind), faction, foundBy);
}

function addHero(state: GameState, heroId: string, faction: TeamId, playerId: string | null) {
  // Level 5: every main hero knows one spell from the start, so magic is in the game from the first battle.
  state.heroes[heroId] = { id: heroId, faction, playerId, pos: homeOf(state, faction), alive: true, crystals: [], ...(state.rules.realm ? { spells: [...START_SPELLS], kind: HERO_TYPES[heroId] } : {}) };
  const unused = state.factions[faction].unusedHeroes;
  if (unused.includes(heroId)) unused.splice(unused.indexOf(heroId), 1);
  // Digital tuning (the easier levels): the Przymierza's heroes start with experience (a level up offers its skills as usual).
  if (faction === 'dawn' && state.rules.dawnStartXp && state.setup.mode !== 'arena') awardXp(state, state.heroes[heroId], state.rules.dawnStartXp);
}

/** Where the coop automaton's heroes come in the turn order: after every player's seat. */
const AUTOMATON_SEAT = 100;

export function computeTurnOrder(state: GameState): string[] {
  const heroes = Object.values(state.heroes);
  const seatOrder = (h: HeroState) => (h.playerId ? state.players.findIndex((p) => p.id === h.playerId) : AUTOMATON_SEAT);
  const sides = teamsOf(state).map((t) => heroes.filter((h) => h.faction === t && h.alive).sort((a, b) => seatOrder(a) - seatOrder(b)));
  if (state.setup.mode === 'coop') return sides.flat().map((h) => h.id);
  // Turns alternate between the teams: the first hero of each, then the second of each, and so on.
  const out: string[] = [];
  for (let i = 0; i < Math.max(...sides.map((s) => s.length)); i++) for (const side of sides) if (side[i]) out.push(side[i].id);
  return out;
}

// ------------------------------------------------------------------ queries

export function activeHero(state: GameState): HeroState | null {
  if (state.phase === 'over') return null;
  const id = state.turnOrder[state.turnIndex];
  return id ? state.heroes[id] : null;
}

/** A faction's living heroes (a reserve still to come in included), in the order of state.heroes. */
export function livingHeroes(state: GameState, faction: TeamId): HeroState[] {
  return Object.values(state.heroes).filter((h) => h.faction === faction && h.alive);
}

/** The living heroes of every team but `team`. */
export function livingEnemies(state: GameState, team: TeamId): HeroState[] {
  return Object.values(state.heroes).filter((h) => h.faction !== team && h.alive);
}

export function heroesAt(state: GameState, k: HexKey): HeroState[] {
  return Object.values(state.heroes).filter((h) => h.alive && !h.entering && h.pos === k);
}

/** The enemy hero who fights for hex `k` when it is attacked: of several (only in a base), the one with the most Życie. */
export function defenderAt(state: GameState, k: HexKey, attacker: TeamId): HeroState | undefined {
  return heroesAt(state, k)
    .filter((h) => h.faction !== attacker)
    .sort((a, b) => UNITS[b.id].hp - UNITS[a.id].hp)[0];
}

/**
 * The ritual stands when one living Horde hero is on the Tree and every other living Horde hero
 * is on a hex next to it (one hero per hex, so they gather around the Tree).
 */
export function ritualFormed(state: GameState): boolean {
  // The easy level plays without the ritual, and so does every goal but the crystals.
  if (state.rules.ritual === false || objectiveOf(state) !== 'crystals') return false;
  const tree = treeOf(state);
  const evil = livingHeroes(state, 'horde');
  if (!evil.length || evil.some((h) => h.entering) || !evil.some((h) => h.pos === tree)) return false;
  const around = new Set(mapNeighbors(state.tiles, tree));
  return evil.every((h) => h.pos === tree || around.has(h.pos));
}

/** Where a Horde hero should stand for the ritual: the Tree if no other Horde hero holds it, else a free hex next to it. */
export function ritualSpot(state: GameState, hero: HeroState): HexKey | null {
  const tree = treeOf(state);
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

/**
 * Whether a Horde hero may challenge the guardian of this crystal. In the crystals goal the Horde leave guardians alone (the guardians keep
 * the crystals the Horde only wait for at the Tree); in every other goal a guardian is just a fight (a treasure, experience), open to both
 * sides, and in the Boss goal both sides race for the last blow. The Horde's bots still do not go looking for guardians (adventureAi).
 */
export function hordeMayFightGuardian(state: GameState, crystalId: string): boolean {
  return objectiveOf(state) !== 'crystals' || Boolean(state.boss && crystalId === 'boss');
}

/** One hero per hex: only a faction's own base may hold several of its heroes. */
export function canStand(state: GameState, k: HexKey, faction: TeamId, heroId?: string): boolean {
  const t = state.tiles[k];
  if (tileCost(t) === null || (t.crystalId && state.crystals[t.crystalId].guardian)) return false;
  const others = heroesAt(state, k).filter((h) => h.id !== heroId);
  if (others.some((h) => h.faction !== faction)) return false;
  // An enemy garrison holds its settlement: nobody of the other side just appears there.
  if (garrisonAt(state, k, faction)) return false;
  return !others.length || t.home === faction;
}

/** Free hexes (see canStand) nearest to `from`. */
export function nearestFreeHexes(state: GameState, from: HexKey, faction: TeamId): HexKey[] {
  const origin = parseKey(from);
  const free = Object.values(state.tiles)
    .filter((t) => canStand(state, t.key, faction))
    .map((t) => ({ k: t.key, d: distance(origin, parseKey(t.key)) }));
  const best = Math.min(...free.map((f) => f.d));
  return free.filter((f) => f.d === best).map((f) => f.k);
}

export type MoveKind = 'move' | 'attackHero' | 'attackGuardian' | 'attackGarrison' | 'enter';

export interface HeroMove {
  to: HexKey;
  cost: number;
  kind: MoveKind;
}

/** Adjacent hexes the active hero may enter now. */
export function legalHeroMoves(state: GameState): HeroMove[] {
  const hero = activeHero(state);
  if (!hero || state.phase !== 'adventure' || !hero.alive) return [];
  // A reserve that took over a turn already spent on a battle waits for its own next turn.
  if (hero.entering) return state.turnBattleDone ? [] : hero.entering.map((to) => ({ to, cost: 0, kind: 'enter' as const }));
  const out: HeroMove[] = [];
  for (const n of mapNeighbors(state.tiles, hero.pos)) {
    const tile = state.tiles[n];
    const cost = heroTileCost(hero, tile);
    if (cost === null || !knowsHex(state, n, hero.faction)) continue;
    const there = heroesAt(state, n);
    const enemies = there.filter((h) => h.faction !== hero.faction);
    // One hero per hex: a hex held by an ally is closed (except the faction's own base).
    if (!enemies.length && there.length && tile.home !== hero.faction) continue;
    const crystal = tile.crystalId ? state.crystals[tile.crystalId] : null;
    if (enemies.length) {
      // Attacking is entering the hex: it costs what the terrain costs, and the hero may go on after the battle.
      if (cost <= state.movePoints) out.push({ to: n, cost, kind: 'attackHero' });
      continue;
    }
    if (crystal?.guardian) {
      if (hero.faction === 'horde' && !hordeMayFightGuardian(state, crystal.id)) continue;
      if (cost <= state.movePoints) out.push({ to: n, cost, kind: 'attackGuardian' });
      continue;
    }
    if (cost <= state.movePoints) out.push({ to: n, cost, kind: garrisonAt(state, n, hero.faction) ? 'attackGarrison' : 'move' });
  }
  return out;
}

export type Actor =
  | { kind: 'human'; playerId: string; faction: TeamId }
  | { kind: 'bot'; playerId: string; faction: TeamId }
  | { kind: 'automaton'; side: Side }
  | { kind: 'none' };

function actorForFaction(state: GameState, faction: TeamId, heroId: string | null): Actor {
  const hero = heroId ? state.heroes[heroId] : null;
  const player = hero?.playerId ? state.players.find((p) => p.id === hero.playerId) : undefined;
  if (!player) return { kind: 'automaton', side: faction };
  return player.controller === 'human' ? { kind: 'human', playerId: player.id, faction } : { kind: 'bot', playerId: player.id, faction };
}

/**
 * Who commands the garrison of a settlement when no hero defends it: a player of the owning faction (a human before a bot), the one whose hero
 * was active last (walking back through the turn order), otherwise the first of that faction. No player (the coop Horde): nobody, the automaton plays.
 */
export function garrisonCommander(state: GameState, faction: TeamId): Player | null {
  const mine = state.players.filter((p) => p.faction === faction);
  if (!mine.length) return null;
  const n = state.turnOrder.length;
  for (const pool of [mine.filter((p) => p.controller === 'human'), mine.filter((p) => p.controller !== 'human')]) {
    if (!pool.length) continue;
    for (let i = 1; i <= n; i++) {
      const h = state.heroes[state.turnOrder[(((state.turnIndex - i) % n) + n) % n]];
      const p = h?.alive && h.playerId ? pool.find((x) => x.id === h.playerId) : undefined;
      if (p) return p;
    }
    return pool[0];
  }
  return null;
}

/** The actor for one side of a battle: its hero's player; a garrison without a hero is led by the settlement owner's commander. */
function battleActor(state: GameState, b: BattleState, side: Side): Actor {
  const heroId = battleHeroOf(b, side);
  if (!heroId && b.garrison && side === b.defender && side !== 'neutral') {
    const p = garrisonCommander(state, side);
    if (p) return p.controller === 'human' ? { kind: 'human', playerId: p.id, faction: side } : { kind: 'bot', playerId: p.id, faction: side };
  }
  return actorForFaction(state, side as TeamId, heroId);
}

export function battleHeroOf(b: BattleState, side: Side): string | null {
  if (side === b.attacker) return b.attackerHero;
  if (side === b.defender) return b.defenderHero;
  return null;
}

/**
 * Mirages: an action of another side than a mirage's owner names the units by the ids it was shown (`redactHidden`); the engine works with its own ids.
 * The acting side is the side of the active unit.
 */
function unmaskAction(b: BattleState, action: Action): Action {
  const actor = b.units[b.activation!.unitId]?.side;
  if (!actor) return action;
  const m = (id: string | undefined) => (id === undefined ? undefined : unmaskId(b, actor, id));
  switch (action.type) {
    case 'battleAttack':
      return { ...action, targetId: m(action.targetId)!, ...(action.secondTargetId ? { secondTargetId: m(action.secondTargetId) } : {}) };
    case 'battleTideSwap':
      return { ...action, targetId: m(action.targetId)! };
    case 'battleAbility':
    case 'battleSpell':
      return action.targetId ? { ...action, targetId: m(action.targetId)! } : action;
    case 'battleItem':
      return { ...action, ...(action.targetId ? { targetId: m(action.targetId) } : {}), ...(action.targetIds ? { targetIds: action.targetIds.map((x) => m(x)!) } : {}) };
    default:
      return action;
  }
}

/** Who must act next. */
export function currentActor(state: GameState): Actor {
  if (state.phase === 'over') return { kind: 'none' };
  if (state.phase === 'battle' && state.battle) {
    const b = state.battle;
    if (b.stage === 'select') {
      const f = b.needsSelection[0];
      return battleActor(state, b, f);
    }
    if (b.stage === 'deploy') {
      const f = b.needsDeploy[0];
      return battleActor(state, b, f);
    }
    if (b.stage === 'gear' && state.draft?.gear) return battleActor(state, b, state.draft.gear.order[0]);
    if (b.stage === 'spells' && state.draft?.spells) return battleActor(state, b, state.draft.spells.order[0]);
    if (b.stage === 'draft' && state.draft) {
      const f = state.draft.order[0];
      return battleActor(state, b, f);
    }
    if (b.stage === 'fight' && b.activation) {
      const u = b.units[b.activation.unitId];
      if (u.side === 'neutral') return { kind: 'automaton', side: 'neutral' };
      return battleActor(state, b, u.side);
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
  if (hero.offer) throw new Error('Najpierw wybierz umiejętność.');
  if (hero.treasurePick) throw new Error('Najpierw wybierz skarb.');
  const move = legalHeroMoves(state).find((m) => m.to === to);
  if (!move) throw new Error('Nie można wejść na to pole.');
  const name = UNITS[hero.id].name;
  if (move.kind === 'enter') {
    enterBoard(state, hero, to);
    return;
  }
  // Every step onto another hex costs its terrain, a step into a battle too.
  state.movePoints -= move.cost;
  if (move.kind === 'attackHero') {
    const defender = defenderAt(state, to, hero.faction)!;
    logFor(state, 'battle', `${name} atakuje: ${UNITS[defender.id].name}.`, [hero.faction, defender.faction]);
    const from = hero.pos;
    hero.pos = to;
    revealAround(state, to, 1, hero.faction);
    startBattle(state, { kind: 'heroes', attackerHero: hero.id, defenderHero: defender.id, mapHex: to, from });
    return;
  }
  if (move.kind === 'attackGarrison') {
    const s = garrisonAt(state, to, hero.faction)!;
    logFor(state, 'battle', `${name} szturmuje osadę ${s.name}: broni jej garnizon (${s.garrison!.map((id) => UNITS[id].name).join(', ')}).`, [hero.faction, s.owner!]);
    const from = hero.pos;
    hero.pos = to;
    revealAround(state, to, 1, hero.faction);
    startBattle(state, { kind: 'heroes', attackerHero: hero.id, mapHex: to, from });
    return;
  }
  if (move.kind === 'attackGuardian') {
    const crystal = state.crystals[state.tiles[to].crystalId!];
    log(state, 'battle', crystal.encounter ? `${name} wyzywa strażników: ${crystal.encounter.map((id) => UNITS[id].name).join(', ')}.` : `${name} wyzywa strażnika kryształu: ${UNITS[crystal.guardian!].name}.`);
    const from = hero.pos;
    hero.pos = to;
    revealAround(state, to, 1, hero.faction);
    startBattle(state, { kind: 'neutral', attackerHero: hero.id, neutralId: crystal.guardian!, encounter: crystal.encounter, mapHex: to, from });
    return;
  }
  hero.pos = to;
  const revealed = revealAround(state, to, Math.max(1, scoutRadiusOf(hero), gearReveal(hero)), hero.faction);
  log(state, 'move', `${name} wchodzi na pole: ${TERRAIN_NAMES[state.tiles[to].terrain]}${revealed.length ? ` (odkryto ${revealed.length})` : ''}.`);
  arriveAt(state, hero);
}

/** Szlaki Przemytnicze: how many more times this round a hero of the faction may walk through the hex of a guardian without a fight (0 without the trails). */
export function trailsLeft(state: GameState, faction: TeamId): number {
  if (!state.rules.empire || raceOf(state, faction) !== 'free' || bestLevel(state, faction, 'smugglerTrails') < 1) return 0;
  const fs = state.factions[faction];
  return Math.max(0, FACTION_MECHANICS.trailsPerRound - (fs.trailRound === state.round ? fs.trailUses ?? 0 : 0));
}

/** The hexes next to the active hero where a guardian's hex may be walked through (Szlaki Przemytnicze): the hexes it could otherwise only fight on. */
export function sneakMoves(state: GameState): HeroMove[] {
  const hero = activeHero(state);
  if (!hero || !trailsLeft(state, hero.faction)) return [];
  return legalHeroMoves(state).filter((m) => m.kind === 'attackGuardian');
}

/** Szlaki Przemytnicze: the hero walks through the hex of a guardian or neutrals (it stays there, the fight is not fought), once a round. */
function sneakHero(state: GameState, to: HexKey) {
  const hero = activeHero(state)!;
  if (hero.offer) throw new Error('Najpierw wybierz umiejętność.');
  if (hero.treasurePick) throw new Error('Najpierw wybierz skarb.');
  const move = sneakMoves(state).find((m) => m.to === to);
  if (!move) throw new Error('Szlaki Przemytnicze nie prowadzą na to pole.');
  const fs = state.factions[hero.faction];
  fs.trailUses = (fs.trailRound === state.round ? fs.trailUses ?? 0 : 0) + 1;
  fs.trailRound = state.round;
  state.movePoints -= move.cost;
  hero.pos = to;
  const revealed = revealAround(state, to, Math.max(1, scoutRadiusOf(hero), gearReveal(hero)), hero.faction);
  log(state, 'move', `${UNITS[hero.id].name} przemyka się obok strażników szlakiem przemytników${revealed.length ? ` (odkryto ${revealed.length})` : ''}.`);
  arriveAt(state, hero);
}

/** Brama Wydm (the Desert Empire): whether the faction's gate is ready (built, and enough rounds since the last step through it). */
export function gateReady(state: GameState, faction: TeamId): boolean {
  if (!state.rules.empire || raceOf(state, faction) !== 'sands' || bestLevel(state, faction, 'sandGate') < 1) return false;
  const last = state.factions[faction].gateRound;
  return last === undefined || state.round - last >= FACTION_MECHANICS.gateEvery;
}

/** The hexes the active hero may step to through the Brama Wydm: it stands in a settlement of its faction with the gate; revealed, free hexes within reach. */
export function gateMoves(state: GameState): HexKey[] {
  const hero = activeHero(state);
  const k = state.kingdom;
  if (!hero || !hero.alive || !hero.pos || hero.entering || state.phase !== 'adventure' || !k || hero.offer || hero.treasurePick || !gateReady(state, hero.faction)) return [];
  const here = Object.values(k.settlements).find((x) => x.at === hero.pos);
  if (!here || here.owner !== hero.faction || buildingLevel(here, 'sandGate') < 1) return [];
  const from = parseKey(hero.pos);
  return Object.values(state.tiles)
    .filter((t) => knowsHex(state, t.key, hero.faction) && t.key !== hero.pos && !t.place && distance(from, parseKey(t.key)) <= FACTION_MECHANICS.gateReach && canStand(state, t.key, hero.faction, hero.id) && !heroesAt(state, t.key).length)
    .map((t) => t.key)
    .sort();
}

/** Brama Wydm: the hero steps through the gate to a revealed free hex within reach (no movement points spent; the gate rests a few rounds). */
function gateHero(state: GameState, to: HexKey) {
  const hero = activeHero(state)!;
  if (!gateMoves(state).includes(to)) throw new Error('Brama Wydm nie prowadzi na to pole.');
  state.factions[hero.faction].gateRound = state.round;
  hero.pos = to;
  const revealed = revealAround(state, to, Math.max(1, scoutRadiusOf(hero), gearReveal(hero)), hero.faction);
  log(state, 'move', `${UNITS[hero.id].name} przechodzi przez Bramę Wydm${revealed.length ? ` (odkryto ${revealed.length})` : ''}.`);
  arriveAt(state, hero);
}

/**
 * A copy of the game in which the active hero has just started the fight on hex `to` (a hero or a guardian there), for judging
 * how it would go without playing it; null when there is nothing to fight at `to`. Costs and the log of the real move are left out.
 */
export function fightAt(state: GameState, to: HexKey): GameState | null {
  const s = structuredClone(state);
  const hero = activeHero(s);
  const tile = s.tiles[to];
  if (!hero || !tile || s.phase !== 'adventure') return null;
  const defender = defenderAt(s, to, hero.faction);
  const crystal = tile.crystalId ? s.crystals[tile.crystalId] : undefined;
  const from = hero.pos;
  if (defender) {
    hero.pos = to;
    startBattle(s, { kind: 'heroes', attackerHero: hero.id, defenderHero: defender.id, mapHex: to, from });
  } else if (crystal?.guardian) {
    hero.pos = to;
    startBattle(s, { kind: 'neutral', attackerHero: hero.id, neutralId: crystal.guardian, encounter: crystal.encounter, mapHex: to, from });
  } else if (garrisonAt(s, to, hero.faction)) {
    hero.pos = to;
    startBattle(s, { kind: 'heroes', attackerHero: hero.id, mapHex: to, from });
  } else return null;
  return s;
}

/** A reserve hero steps onto the board at the chosen hex (no movement points spent). */
function enterBoard(state: GameState, hero: HeroState, to: HexKey) {
  delete hero.entering;
  hero.pos = to;
  const revealed = revealAround(state, to, 1, hero.faction);
  log(state, 'move', `${UNITS[hero.id].name} wkracza na pole: ${TERRAIN_NAMES[state.tiles[to].terrain]}${revealed.length ? ` (odkryto ${revealed.length})` : ''}.`);
  arriveAt(state, hero);
}

/** A Przymierze hero picks up every free crystal lying on its hex. */
function pickUpCrystals(state: GameState, hero: HeroState, only?: string) {
  const tile = state.tiles[hero.pos];
  for (const c of Object.values(state.crystals)) {
    if (c.at === hero.pos && !c.guardian && (!only || c.id === only)) {
      c.at = `hero:${hero.id}`;
      hero.crystals.push(c.id);
      if (tile.crystalId === c.id) tile.crystalId = null;
      if (c.id === 'artifact') {
        state.artifact!.handovers += 1;
        state.movePoints = Math.max(0, state.movePoints - ARTIFACT.carrierSlow);
      }
      log(state, 'crystal', c.id === 'artifact' ? `${UNITS[hero.id].name} podnosi Artefakt.` : `${UNITS[hero.id].name} podnosi kryształ.`);
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
    awardXp(state, hero, GROWTH.xp.treasure, 'znaleziony skarb');
    log(state, 'item', `${UNITS[hero.id].name} znajduje skarb.`);
    log(state, 'item', `Skarb (${UNITS[hero.id].name}): ${itemDef(item.kind, isDigital(state.rules)).name}.`, hero.faction);
  }
  if (state.rules.heroGrowth) visitSite(state, hero, tile);
  enterPlace(state, hero);
  // Level 6, the Przymierze: the Krąg Gaju of an own settlement fills the mana of a hero that walks onto its field.
  if (state.rules.empire && Object.values(state.kingdom?.settlements ?? {}).some((s) => s.at === hero.pos && s.owner === hero.faction && (s.buildings.grove ?? 0) >= 1)) delete hero.mana;
  if (hero.faction === 'dawn') {
    pickUpCrystals(state, hero);
    // The artifact is never given to the Tree (it is carried to a base, see objectives.ts).
    const ordinary = hero.crystals.filter((id) => id !== 'artifact');
    if (tile.tree && ordinary.length) {
      const blocked = heroesAt(state, hero.pos).some((h) => h.faction === 'horde');
      if (!blocked) {
        for (const id of ordinary) state.crystals[id].at = 'tree';
        state.factions.dawn.delivered += ordinary.length;
        logPublic(state, 'crystal', `${UNITS[hero.id].name} oddaje ${ordinary.length} kryształ(y) Drzewu (${state.factions.dawn.delivered}/${state.crystalsNeeded}).`);
        hero.crystals = hero.crystals.filter((id) => id === 'artifact');
      }
    }
  } else if (state.artifact) {
    pickUpCrystals(state, hero, 'artifact');
  }
  checkVictory(state);
}

function endTurn(state: GameState) {
  if (state.phase !== 'adventure') throw new Error('Najpierw zakończ bitwę.');
  if (activeHero(state)?.offer) throw new Error('Najpierw wybierz umiejętność.');
  if (activeHero(state)?.treasurePick) throw new Error('Najpierw wybierz skarb.');
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
  state.movePoints = moveAllowance(state);
  state.turnBattleDone = false;
  scoutAround(state, activeHero(state) ?? undefined);
}

/** A hero with the skill Zwiadowca uncovers the hexes around itself at the start of its turn (and when it picks the skill). */
export function scoutAround(state: GameState, hero: HeroState | undefined) {
  const radius = Math.max(scoutRadiusOf(hero), gearReveal(hero));
  if (!hero || !hero.alive || !hero.pos || radius < 2) return;
  const revealed = revealAround(state, hero.pos, radius, hero.faction);
  if (revealed.length) log(state, 'move', `${UNITS[hero.id].name} wypatruje okolicę (odkryto ${revealed.length}).`, hero.faction);
}

/** Move points the active hero gets at the start of its turn: the rules' base plus skills, family help and gear, minus the artifact's weight. */
export function moveAllowance(state: GameState): number {
  return moveBreakdown(state).reduce((sum, p) => sum + p.points, 0);
}

/** Wieża Zamieci (the Court of Everfrost): the move points an enemy hero loses standing near a settlement of the Court that has the tower (1 at most, the radius grows with the tower's level). */
function blizzardSlow(state: GameState, hero: HeroState): number {
  if (!hero.pos) return 0;
  const here = parseKey(hero.pos);
  const slowed = Object.values(state.kingdom?.settlements ?? {}).some((s) => {
    const level = s.buildings.blizzardTower ?? 0;
    return s.owner !== null && s.owner !== hero.faction && level >= 1 && raceOf(state, s.owner) === 'frost' && distance(here, parseKey(s.at)) <= FACTION_MECHANICS.blizzardRadius[Math.min(level, 2) - 1];
  });
  return slowed ? FACTION_MECHANICS.blizzardMove : 0;
}

/** What the move points of the active hero's turn are made of (for the screen: a player who counts them must be able to see where each went). */
export function moveBreakdown(state: GameState): Array<{ label: string; points: number }> {
  const hero = activeHero(state) ?? undefined;
  const parts = [{ label: 'podstawa', points: state.rules.heroMovePoints }];
  const add = (label: string, points: number) => points && parts.push({ label, points });
  add('Leśny Tropiciel (umiejętność)', moveBonus(hero));
  add('pomoc dla dziecka', hero && isChildHero(state, hero) ? FAMILY.extraMove : 0);
  add('artefakty (buty)', gearMoveBonus(hero));
  add('Wilcze Legowisko', hero && state.rules.empire && raceOf(state, hero.faction) === 'horde' && Object.values(state.kingdom?.settlements ?? {}).some((s) => s.owner === hero.faction && (s.buildings.wolfDen ?? 0) >= 1) ? 1 : 0);
  add('Wieża Zamieci (wróg)', hero && state.rules.empire ? -blizzardSlow(state, hero) : 0);
  add('niesiony Artefakt', hero?.crystals.includes('artifact') ? -ARTIFACT.carrierSlow : 0);
  return parts;
}

function endRound(state: GameState) {
  if (state.rules.heroGrowth) for (const h of Object.values(state.heroes)) if (h.faction === 'horde') awardXp(state, h, GROWTH.hordeRoundXp);
  collectIncome(state);
  regenMana(state);
  const objective = OBJECTIVES[objectiveOf(state)];
  if (objective.onRoundEnd(state)) return;
  if (state.round >= state.roundLimit) {
    objective.onRoundLimit(state);
    return;
  }
  state.round += 1;
  state.turnOrder = computeTurnOrder(state);
  state.turnIndex = 0;
  log(state, 'round', `Runda ${state.round} z ${state.roundLimit}.`);
  if (!state.turnOrder.length) {
    if (teamsOf(state).length > 2) finishDraw(state, 'Nikt nie może już grać.');
    else finish(state, 'horde', 'Nikt nie może już grać.');
  }
}

export function finish(state: GameState, winner: Side, reason: string) {
  state.phase = 'over';
  state.winner = winner;
  state.endReason = reason;
  state.battle = null;
  log(state, 'victory', `Koniec gry: wygrywa ${sideName(state, winner)}. ${reason}`);
}

/** A drawn game (a tie at the round limit): no winner. Only the crystals goal still gives a tie to the Horde. */
export function finishDraw(state: GameState, reason: string) {
  state.phase = 'over';
  state.winner = null;
  state.endReason = reason;
  state.battle = null;
  log(state, 'victory', `Koniec gry: remis. ${reason}`);
}

function checkVictory(state: GameState) {
  if (state.phase === 'over') return;
  OBJECTIVES[objectiveOf(state)].checkVictory(state);
  if ((state.phase as GameState['phase']) === 'over') return; // the objective may have finished the game
  // More than two teams: the last team with a living hero wins (a team without one is out; an Eliksir Odrodzenia needs a living hero to drink it).
  const teams = teamsOf(state);
  if (teams.length > 2) {
    const standing = teams.filter((t) => Object.values(state.heroes).some((h) => h.faction === t && h.alive));
    if (standing.length === 1) finish(state, standing[0], 'Wszyscy pozostali bohaterowie polegli.');
    else if (!standing.length) finishDraw(state, 'Wszyscy bohaterowie polegli.');
    return;
  }
  // Przymierze wins only with its goal. When all its heroes are dead it can no longer
  // carry crystals or hold points, so the Horde wins (an Eliksir Odrodzenia needs a living hero to drink it).
  const dawn = Object.values(state.heroes).filter((h) => h.faction === 'dawn');
  if (dawn.length && dawn.every((h) => !h.alive)) finish(state, 'horde', 'Wszyscy bohaterowie Przymierza polegli.');
}

function useMapItem(state: GameState, itemId: string, targets: HexKey[] | undefined, unitId: string | undefined) {
  const hero = activeHero(state);
  if (!hero || !hero.alive || state.phase !== 'adventure') throw new Error('Skarbów na mapie używa się w swojej turze.');
  const item = state.items[itemId];
  if (!item || item.owner !== hero.faction) throw new Error('Nie masz tego skarbu.');
  if (item.kind === 'map') {
    const keys = [...new Set(targets ?? [])].filter((k) => state.tiles[k] && !knowsHex(state, k, hero.faction)).slice(0, ITEM_EFFECT.mapReveal);
    if (!keys.length) throw new Error(`Wybierz do ${ITEM_EFFECT.mapReveal} zakrytych pól.`);
    for (const k of keys) seeHex(state, k, hero.faction);
    log(state, 'item', `${UNITS[hero.id].name} używa Magicznej Mapy: odkryto ${keys.length} pola.`);
  } else if (item.kind === 'resurrection') {
    const f = state.factions[hero.faction];
    const deadHero = unitId ? state.heroes[unitId] : undefined;
    if (deadHero && deadHero.faction === hero.faction && !deadHero.alive) {
      if (deadHero.revived) throw new Error('Ten bohater już raz wrócił dzięki Eliksirowi Odrodzenia.');
      // The revived hero stands on a free hex next to the one who drinks the elixir (one hero per hex).
      const spots = reviveSpots(state, hero);
      const to = targets?.[0] ?? spots[0];
      if (!to || !spots.includes(to)) throw new Error(spots.length ? 'Wskrzeszony bohater staje na wolnym polu obok.' : 'Obok nie ma wolnego pola dla wskrzeszonego bohatera.');
      deadHero.alive = true;
      deadHero.revived = true;
      // A hero whose player has been given a reserve hero in the meantime goes back to that player (who then leads both).
      if (deadHero.formerPlayerId) {
        deadHero.playerId = deadHero.formerPlayerId;
        delete deadHero.formerPlayerId;
      }
      deadHero.pos = to;
      revealAround(state, to, 1, hero.faction);
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
  /** Neutral encounter: every unit of the group (the first is `neutralId`). */
  encounter?: string[];
  mapHex: HexKey;
  from: HexKey;
}

function startBattle(state: GameState, s: BattleStart) {
  const attacker = state.heroes[s.attackerHero];
  const defenderHero = s.defenderHero ? state.heroes[s.defenderHero] : null;
  // Level 4: a fight on a settlement held by the defender is a fight for the settlement: its garrison joins in and its defences stand.
  const place = state.tiles[s.mapHex].place;
  const town = state.rules.economy && s.kind === 'heroes' && place?.kind === 'settlement' ? state.kingdom?.settlements[place.id] : undefined;
  const held = town && town.owner && town.owner !== attacker.faction && (!defenderHero || defenderHero.faction === town.owner) ? town : undefined;
  if (!defenderHero && !s.neutralId && !held?.garrison?.length) throw new Error('Nie ma z kim walczyć.');
  const siege = held && isDigital(state.rules) && state.setup.battleMode !== 'board' ? makeSiege(buildingLevel(held, 'walls')) : undefined;
  const b: BattleState = {
    kind: s.kind,
    mapHex: s.mapHex,
    arena: raceOf(state, state.tiles[s.mapHex].side),
    attacker: attacker.faction,
    defender: defenderHero ? defenderHero.faction : held ? held.owner! : 'neutral',
    attackerHero: attacker.id,
    attackerFrom: s.from,
    defenderHero: defenderHero?.id ?? null,
    neutralId: s.neutralId ?? null,
    duel: state.setup.battleMode === 'board',
    stage: 'select',
    needsDeploy: [],
    needsSelection: [],
    ...(isDigital(state.rules) ? { layout: 'wide' as const } : {}),
    obstacles: state.setup.battleMode === 'board' ? [] : siege ? siegeObstacles(siege) : arenaObstacles(raceOf(state, state.tiles[s.mapHex].side), isDigital(state.rules) ? 'wide' : undefined),
    ...(held ? { garrison: held.id } : {}),
    ...(siege ? { siege } : {}),
    units: {},
    round: 0,
    order: [],
    index: 0,
    activation: null,
    extra: [],
    winner: null,
    damageBy: {},
  };
  const digital = isDigital(state.rules) && !b.duel;
  const scale = scaleOf(state);
  const hpScale = hpScaleOf(state);
  b.units[attacker.id] = makeBattleUnit(attacker.id, attacker.faction, digital, scale, hpScale, withoutBonus(state, attacker.faction), bonusShare(state, attacker.faction));
  if (defenderHero) b.units[defenderHero.id] = makeBattleUnit(defenderHero.id, defenderHero.faction, digital, scale, hpScale, withoutBonus(state, defenderHero.faction), bonusShare(state, defenderHero.faction));
  for (const h of [attacker, defenderHero]) if (h && state.rules.heroGrowth) {
    applyHeroSkills(h, b.units[h.id]);
    applyHeroType(h, b.units[h.id]);
    applyMilestones(h, b.units[h.id]);
    applyGear(h, b.units[h.id]);
    if (deployDepthOf(h)) (b.deployDepth ??= {})[h.faction] = deployDepthOf(h);
  }
  // Level 6: the building of the Pierwotna Iskra strengthens every unit of its faction.
  for (const h of [attacker, defenderHero]) if (h && hasSpark(state, h.faction)) sparkBonus(state, b.units[h.id]);
  for (const h of [attacker, defenderHero]) if (h) dawnTreeBonus(state, b.units[h.id]);
  for (const h of [attacker, defenderHero]) if (h && isChildHero(state, h)) {
    b.units[h.id].hp += FAMILY.extraHp * hpScale;
    b.units[h.id].maxHp += FAMILY.extraHp * hpScale;
  }
  if (s.neutralId) {
    const g = makeBattleUnit(s.neutralId, 'neutral', false, scale, hpScale);
    // One hero alone against a guardian: the guardian fights with its duel card (less Życie, another ability).
    const card = UNITS[s.neutralId].duel;
    if (b.duel && card) {
      g.hp = g.maxHp = card.hp * scale;
      g.ability = card.ability;
      if (state.rules.abilities && card.ability === 'stoneSkin') g.status.damageReduction += ABILITY.stoneSkinIgnore * scale;
    }
    // The Boss keeps its wounds from fight to fight.
    if (state.boss && s.mapHex === state.boss.at) {
      g.hp = state.boss.hp;
      g.maxHp = state.boss.maxHp;
    }
    b.units[s.neutralId] = g;
    // The rest of an encounter: units of the same kind get a number so that their ids differ (the first keeps the definition id).
    const seen: Record<string, number> = { [s.neutralId]: 1 };
    for (const defId of (s.encounter ?? []).slice(1)) {
      const n = (seen[defId] = (seen[defId] ?? 0) + 1);
      const extra = makeBattleUnit(defId, 'neutral', false, scale, hpScale);
      extra.id = n === 1 ? defId : `${defId}${n}`;
      b.units[extra.id] = extra;
    }
  }
  state.phase = 'battle';
  state.battle = b;
  state.turnBattleDone = true;
  state.stats.battles += 1;
  if (s.kind === 'neutral') state.stats.neutralBattles += 1;
  for (const f of [attacker.faction, defenderHero?.faction].filter(Boolean) as TeamId[]) {
    if (b.duel) break;
    const pool = state.factions[f].supportsAlive;
    if (pool.length <= supportSlots(state, f)) addSupports(state, f, [...pool]);
    else b.needsSelection.push(f);
  }
  // The garrison stands with the defender (in a duel on the board only when there is no hero to fight).
  if (held?.garrison?.length && (!b.duel || !defenderHero)) {
    addSupports(state, held.owner!, b.duel ? held.garrison.slice(0, 1) : [...held.garrison]);
    // More units than a start column holds: the defenders of a settlement get one column more.
    if (!b.duel) (b.deployDepth ??= {})[held.owner!] = Math.max(1, b.deployDepth?.[held.owner!] ?? 0);
  }
  if (!b.needsSelection.length) startBattleFight(state);
}

/** Level 6, rank III of the Przymierza's tree: every unit of the Przymierza starts a battle with more Życie. */
function dawnTreeBonus(state: GameState, unit: BattleState['units'][string]) {
  if (!state.rules.empire || unit.side === 'neutral' || raceOf(state, unit.side) !== 'dawn' || mechanicLevel(state, unit.side) < 4) return;
  unit.hp += FACTION_MECHANICS.dawnStartHp * hpScaleOf(state);
  unit.maxHp += FACTION_MECHANICS.dawnStartHp * hpScaleOf(state);
}

export function sparkBonus(state: GameState, unit: BattleState['units'][string]) {
  if (unit.side !== 'neutral' && raceOf(state, unit.side) === 'dawn') {
    unit.hp += EMPIRE.sparkHp * hpScaleOf(state);
    unit.maxHp += EMPIRE.sparkHp * hpScaleOf(state);
  } else if (unit.side !== 'neutral' && raceOf(state, unit.side) === 'herds') unit.status.battleSpeedBonus += EMPIRE.sparkSpeed;
  else if (unit.side !== 'neutral' && raceOf(state, unit.side) === 'undead') unit.status.immune = true;
  else if (unit.side !== 'neutral' && raceOf(state, unit.side) === 'clans') unit.status.damageReduction += FACTION_MECHANICS.shieldArmor * scaleOf(state);
  // The Court's Iskra works on the enemy (they start the battle with frost: `beginFight`), not on its own units.
  else if (unit.side !== 'neutral' && raceOf(state, unit.side) === 'frost') return;
  // The Companies' Iskra works on the field (two more hidden traps: `trapSlots`), not on its own units.
  else if (unit.side !== 'neutral' && raceOf(state, unit.side) === 'free') return;
  // The Empire's Iskra moves its units after both sides have deployed (`deployUnits`), it gives them nothing.
  else if (unit.side !== 'neutral' && raceOf(state, unit.side) === 'sands') return;
  // The Swarm's Iskra covers the field with its mycelium (`sparkMycelium` when the fight begins), it gives its units nothing.
  else if (unit.side !== 'neutral' && raceOf(state, unit.side) === 'swarm') return;
  // The Tides' Iskra (Perłowa Świątynia): every unit starts the battle with a pearl shield, no Atak.
  else if (unit.side !== 'neutral' && raceOf(state, unit.side) === 'tides') unit.status.pearl = (unit.status.pearl ?? 0) + FACTION_MECHANICS.sparkPearl * scaleOf(state);
  else unit.status.battleAttackBonus += EMPIRE.sparkAttack * scaleOf(state);
}

/** Runiczna Kuźnia (the Iron Clans): the runes forged on the support, in every battle it fights: +1 A, +1 Ż, armour 1. */
export function runeBonus(state: GameState, faction: TeamId, unit: BattleState['units'][string]) {
  for (const rune of state.factions[faction].runes?.[unit.defId] ?? []) {
    if (rune === 'attack') unit.status.battleAttackBonus += scaleOf(state);
    else if (rune === 'life') {
      unit.hp += hpScaleOf(state);
      unit.maxHp += hpScaleOf(state);
    } else unit.status.damageReduction += scaleOf(state);
  }
}

function addSupports(state: GameState, faction: TeamId, ids: string[]) {
  const b = state.battle!;
  const digital = isDigital(state.rules) && !b.duel;
  for (const defId of ids) {
    const id = defId;
    b.units[id] = makeBattleUnit(defId, faction, digital, scaleOf(state), hpScaleOf(state), withoutBonus(state, faction), bonusShare(state, faction));
    // The leader of the side (the attacking or the defending hero of this faction) strengthens its supports.
    if (state.rules.heroGrowth) {
      const leader = state.heroes[b.attacker === faction ? b.attackerHero : b.defenderHero ?? ''];
      applySupportSkill(leader, b.units[id]);
      applySupportGear(leader, b.units[id]);
    }
    if (hasSpark(state, faction)) sparkBonus(state, b.units[id]);
    runeBonus(state, faction, b.units[id]);
    dawnTreeBonus(state, b.units[id]);
    // Level 4: the faction's forge arms its supports.
    const forge = forgeLevel(state, faction);
    if (forge >= 1) b.units[id].status.battleAttackBonus += ECONOMY.forgeAttack * scaleOf(state);
    if (forge >= 2) {
      b.units[id].hp += ECONOMY.forgeHp * hpScaleOf(state);
      b.units[id].maxHp += ECONOMY.forgeHp * hpScaleOf(state);
    }
  }
}

function selectSupports(state: GameState, faction: TeamId, ids: string[]) {
  const b = state.battle;
  if (!b || b.stage !== 'select' || b.needsSelection[0] !== faction) throw new Error('Teraz nie wybiera ta frakcja.');
  const pool = state.factions[faction].supportsAlive;
  const unique = [...new Set(ids)];
  if (unique.length !== Math.min(supportSlots(state, faction), pool.length) || unique.some((id) => !pool.includes(id))) throw new Error(`Wybierz pomocników do bitwy (${Math.min(supportSlots(state, faction), pool.length)}).`);
  addSupports(state, faction, unique);
  b.needsSelection.shift();
  if (!b.needsSelection.length) afterSelection(state);
}

/** Applies battle results to the adventure state once one side is gone. */
function finalizeBattle(state: GameState) {
  if (state.setup.mode === 'arena') return finishArena(state);
  const b = state.battle!;
  applyCasualties(state, b);
  if (b.kind === 'neutral' && b.winner === b.attacker) bellToll(state, b.attacker);
  const resultText = b.winner === 'draw' ? 'remis — obie strony poległy' : `wygrywa ${sideName(state, b.winner!)}`;
  log(state, 'battle', `Bitwa zakończona: ${resultText}.`);
  if (b.kind === 'neutral') resolveGuardianFight(state, b);
  awardBattleXp(state, b);
  // Level 6, the Horde: the Szabrownia pays after a fight against a hero or a guardian that the faction won.
  if (state.rules.empire && b.winner && b.winner !== 'neutral' && b.winner !== 'draw' && !isAutomaton(state, b.winner)) {
    const loot = FACTION_MECHANICS.plunderGold * summedLevel(state, b.winner, 'plunder');
    if (loot > 0) {
      state.kingdom!.gold[b.winner] += loot;
      log(state, 'info', `Szabrownia: ${FACTION_NAMES[raceOf(state, b.winner)]} zgarnia ${loot} zł łupu.`);
    }
  }
  // Level 6: a fallen hero's shards go to the hero that beat it, or fall onto the map.
  if (state.rules.empire) for (const id of [b.attackerHero, b.defenderHero]) {
    const h = id ? state.heroes[id] : null;
    if (!h || h.alive || !h.shards) continue;
    const rival = state.heroes[(id === b.attackerHero ? b.defenderHero : b.attackerHero) ?? ''] ?? null;
    loseShards(state, h, rival, b.mapHex);
  }
  // Level 5: a commander that fell keeps its level but loses what it carried (the winner has taken its share above).
  for (const id of [b.attackerHero, b.defenderHero]) {
    const h = id ? state.heroes[id] : null;
    if (h?.secondary && !h.alive && h.fallen === undefined) commanderFalls(state, h);
  }
  state.lastBattle = battleReport(state, b);
  state.battle = null;
  state.phase = 'adventure';
  placeAttackerAfterBattle(state, b);
  checkVictory(state);
  if (isOver(state)) return;
  const active = activeHero(state);
  if (!active || !active.alive) advanceTurn(state);
}

/** Experience for the heroes that lived through a battle: more for a win (most for a guardian). */
function awardBattleXp(state: GameState, b: BattleState) {
  if (!state.rules.heroGrowth) return;
  for (const id of [b.attackerHero, b.defenderHero]) {
    const hero = id ? state.heroes[id] : null;
    if (!hero?.alive) continue;
    const won = b.winner === hero.faction;
    const scholar = won ? scholarXp(hero) : 0;
    const reason = won ? (b.kind === 'neutral' ? 'pokonany strażnik' : b.defenderHero ? 'wygrana walka z bohaterem' : 'zdobyta osada z garnizonem') : 'przegrana walka, którą bohater przeżył';
    awardXp(state, hero, (won ? (b.kind === 'neutral' ? GROWTH.xp.guardian : GROWTH.xp.hero) : GROWTH.xp.lost) + scholar, scholar ? `${reason}, w tym ${scholar} od Uczonego` : reason);
    // Level 5: a looter's speciality pays gold for every won battle.
    const loot = won ? specialtyOf(hero)?.gold ?? 0 : 0;
    if (loot && state.kingdom) {
      state.kingdom.gold[hero.faction] += loot;
      log(state, 'info', `${UNITS[hero.id].name} zdobywa ${loot} zł łupu (${specialtyOf(hero)!.name}).`, hero.faction, { type: 'loot', heroId: hero.id, gold: loot });
    }
    // Spoils: the winner of a fight between heroes takes the beaten hero's artifacts (those that improve its own gear); when there is nothing
    // to take it still finds a common one (the Horde meet guardians rarely, so this evens it out).
    if (won && b.kind === 'heroes' && b.defenderHero) {
      const loser = state.heroes[(id === b.attackerHero ? b.defenderHero : b.attackerHero) ?? ''];
      const common = ARTIFACTS.filter((a) => a.rarity === 1);
      if (!loser || !captureGear(state, hero, loser)) giveArtifact(state, hero, common[(state.round + hero.id.length) % common.length], 'łup z pokonanego bohatera');
    }
  }
}

/** Dzwonnica Zaduszna (the Kingdom of the Dead): after a win over the neutrals one fallen support of tier 1-2 returns to the team without the hospital, once a round. */
function bellToll(state: GameState, side: Side) {
  if (side === 'neutral' || !state.rules.empire) return;
  const f = side as TeamId;
  if (!Object.values(state.kingdom?.settlements ?? {}).some((s) => s.owner === f && buildingLevel(s, 'bellTower') >= 1)) return;
  const fs = state.factions[f];
  if (fs.bellRound === state.round) return;
  const back = fs.supportsDead.find((id) => supportTier(id) <= 2);
  if (!back) return;
  fs.bellRound = state.round;
  fs.supportsDead = fs.supportsDead.filter((id) => id !== back);
  fs.supportsAlive.push(back);
  log(state, 'info', `${sideName(state, f)}: dzwon zaduszny przywołuje z powrotem ${UNITS[back].name}.`);
}

/** Fallen supports join the faction's dead for good; fallen heroes die on the map. */
function applyCasualties(state: GameState, b: BattleState) {
  for (const u of Object.values(b.units)) {
    if (u.side === 'neutral' || u.alive || u.swappedOut) continue;
    const f = u.side as TeamId;
    if (UNITS[u.defId].kind === 'support') {
      const fs = state.factions[f];
      const garrison = b.garrison ? state.kingdom?.settlements[b.garrison]?.garrison : undefined;
      if (garrison?.includes(u.defId) && f === b.defender) {
        garrison.splice(garrison.indexOf(u.defId), 1);
        fs.supportsDead.push(u.defId);
        state.stats.supportDeaths[f] += 1;
      } else if (fs.supportsAlive.includes(u.defId)) {
        fs.supportsAlive.splice(fs.supportsAlive.indexOf(u.defId), 1);
        fs.supportsDead.push(u.defId);
        state.stats.supportDeaths[f] += 1;
        if (b.kind === 'neutral') state.stats.neutralSupportLosses += 1;
      }
    } else {
      killHero(state, u.defId, b.mapHex);
    }
  }
}

/** A beaten guardian frees its crystal and leaves a treasure; a guardian that won is counted. */
function resolveGuardianFight(state: GameState, b: BattleState) {
  if (state.boss && b.mapHex === state.boss.at) {
    const boss = state.boss;
    const unit = b.units[b.neutralId!];
    boss.hits[b.attacker as TeamId] += boss.hp - Math.max(0, unit.hp);
    boss.hp = Math.max(0, unit.hp);
    if (b.winner === b.attacker && !unit.alive) {
      boss.slain = b.attacker as TeamId;
      logPublic(state, 'crystal', `${sideName(state, b.attacker)} zadaje Bossowi ostatni cios.`);
    } else {
      state.stats.neutralWipes += 1;
      logPublic(state, 'info', `Boss ma jeszcze ${boss.hp}/${boss.maxHp} Ż.`);
    }
    return;
  }
  if (b.winner !== b.attacker) {
    state.stats.neutralWipes += 1;
    return;
  }
  const crystal = Object.values(state.crystals).find((c) => c.at === b.mapHex && c.guardian === b.neutralId);
  if (!crystal) return;
  crystal.guardian = null;
  if (crystal.decoy) {
    // Survival: the guardian guarded nothing worth carrying.
    delete state.crystals[crystal.id];
    if (state.tiles[crystal.at]?.crystalId === crystal.id) state.tiles[crystal.at].crystalId = null;
    log(state, 'info', crystal.encounter ? 'Strażnicy pokonani.' : 'Strażnik pokonany.');
  } else log(state, 'crystal', `Strażnik pokonany. Kryształ jest wolny.`);
  guardianHoard(state, b.attackerHero);
  // With hero growth a beaten guardian also leaves an artifact (mostly a common one); an encounter leaves one of the rarity of its tier.
  const tierOdds = [[100, 0, 0], [0, 100, 0], [0, 0, 100]] as const;
  const odds = crystal.encounter ? tierOdds[crystal.tier ?? 0] : ARTIFACT_ODDS.guardian;
  if (state.rules.heroGrowth) giveArtifact(state, state.heroes[b.attackerHero], drawArtifact(state, state.heroes[b.attackerHero], odds, 0x68bc21eb), crystal.encounter ? 'łup po pokonanych strażnikach' : 'łup po pokonanym strażniku');
}

/**
 * The attacker, if alive, stays on the battle hex and picks up what lies there. Several enemy
 * heroes may share a hex but a battle is fought against one of them: if any still stands there,
 * the winner steps back instead of sharing the hex.
 */
function placeAttackerAfterBattle(state: GameState, b: BattleState) {
  const attacker = state.heroes[b.attackerHero];
  if (!attacker.alive) return;
  if (heroesAt(state, b.mapHex).some((h) => h.faction !== attacker.faction)) {
    attacker.pos = b.attackerFrom;
    log(state, 'move', `${UNITS[attacker.id].name} wraca na poprzednie pole — na polu bitwy stoją jeszcze wrogowie.`);
  }
  arriveAt(state, attacker);
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
  const hero = state.heroes[heroId];
  // Łowca skarbów: the hero is shown several treasures and keeps some of them, instead of a draw.
  const hunt = state.rules.heroGrowth ? huntOf(hero) : null;
  if (hunt && left.length > 1) {
    const kinds = rng.shuffle(left).slice(0, hunt.pool);
    state.rng = rng.state;
    log(state, 'item', 'Strażnik zostawia swój skarb: bohater wybiera.');
    if (kinds.length <= hunt.take) for (const k of kinds) chooseTreasureNow(state, hero, k);
    else hero.treasurePick = { kinds, take: hunt.take };
    return;
  }
  const kind = rng.pick(left);
  state.rng = rng.state;
  giveItem(state, newItem(state, kind), hero.faction, hero.id);
  state.stats.treasuresCollected[hero.faction] += 1;
  log(state, 'item', `Strażnik zostawia swój skarb.`);
  log(state, 'item', `Skarb strażnika (${UNITS[hero.id].name}): ${itemDef(kind, isDigital(state.rules)).name}.`, hero.faction);
}

function chooseTreasureNow(state: GameState, hero: HeroState, kind: ItemKind) {
  hero.treasurePick = { kinds: [kind], take: 1 };
  chooseTreasure(state, hero.id, kind);
}

export function killHero(state: GameState, heroId: string, at: HexKey) {
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
  if ((state.rules.heroReplacement || (state.rules.dawnHeroReplacement && hero.faction === 'dawn')) && !hero.secondary && (hero.playerId || automaton) && f.unusedHeroes.length) {
    const next = f.unusedHeroes[0];
    addHero(state, next, hero.faction, hero.playerId);
    // The reserve comes in near where the fallen hero died: on the nearest free hex,
    // or the player picks one of several equally near on the reserve's first turn.
    const spots = nearestFreeHexes(state, at, hero.faction);
    if (spots.length === 1) enterBoard(state, state.heroes[next], spots[0]);
    else if (spots.length) state.heroes[next].entering = spots;
    if (hero.playerId) hero.formerPlayerId = hero.playerId;
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
  spawnHordeHero(state, fallenId);
}

/** A Horde hero appears in the Horde base: an unused one while there is any, then a fallen one (not `fallenId`, if possible). False when there is nobody to bring. */
export function spawnHordeHero(state: GameState, fallenId: string | null = null): boolean {
  const f = state.factions.horde;
  let id = f.unusedHeroes[0];
  if (id) addHero(state, id, 'horde', null);
  else {
    const dead = FACTION_HEROES[raceOf(state, 'horde')].filter((h) => state.heroes[h] && !state.heroes[h].alive);
    id = dead.find((h) => h !== fallenId) ?? dead[0] ?? fallenId!;
    if (!id) return false;
    Object.assign(state.heroes[id], { alive: true, crystals: [], pos: homeOf(state, 'horde') });
    delete state.heroes[id].entering;
  }
  const hero = state.heroes[id];
  // A Przymierze hero standing in the Horde base keeps it: the newcomer takes the nearest free hex.
  if (!canStand(state, hero.pos, 'horde', id)) hero.pos = nearestFreeHexes(state, hero.pos, 'horde')[0] ?? hero.pos;
  log(state, 'info', `W bazie Hordy pojawia się nowy bohater: ${UNITS[id].name}.`);
  return true;
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
  // A chest opened: the choice (artifact or gold) comes first.
  if (state.kingdom?.chest && action.type !== 'chestTake' && state.phase === 'adventure') throw new Error('Najpierw wybierz zawartość skrzyni.');
  switch (action.type) {
    case 'kingdomBuild':
    case 'kingdomRecruit':
    case 'kingdomHeal':
    case 'kingdomRefuge':
    case 'kingdomForgeRune':
    case 'kingdomBuyArtifact':
    case 'kingdomSellArtifact':
    case 'kingdomTrade':
    case 'kingdomSwap':
    case 'kingdomDwelling':
    case 'kingdomLearn':
    case 'kingdomHire':
    case 'kingdomRansom':
    case 'kingdomGarrison':
    case 'hutDeliver':
    case 'chestTake':
      kingdomAction(state, action);
      // A building may be what the game is played for (the Pierwotna Iskra in the Relic goal).
      if (action.type === 'kingdomBuild') checkVictory(state);
      break;
    case 'moveHero':
      moveHero(state, action.to);
      break;
    case 'sneakHero':
      sneakHero(state, action.to);
      break;
    case 'gateHero':
      gateHero(state, action.to);
      break;
    case 'endTurn':
      endTurn(state);
      break;
    case 'chooseSkill':
      if (state.phase !== 'adventure' || !activeHero(state)?.offer) throw new Error('Teraz nie wybiera się umiejętności.');
      chooseSkill(state, activeHero(state)!.id, action.skill);
      break;
    case 'chooseTreasure':
      if (state.phase !== 'adventure' || !activeHero(state)?.treasurePick) throw new Error('Teraz nie wybiera się skarbu.');
      chooseTreasure(state, activeHero(state)!.id, action.kind);
      break;
    case 'equipArtifact':
    case 'unequipArtifact':
    case 'passArtifact': {
      const hero = activeHero(state);
      if (state.phase !== 'adventure' || !hero?.alive || !state.rules.heroGrowth) throw new Error('Teraz nie można zmieniać wyposażenia.');
      if (action.type === 'equipArtifact') equipArtifact(state, hero, action.artifactId);
      else if (action.type === 'unequipArtifact') unequipArtifact(state, hero, action.slot);
      else if (action.artifactId === SHARDS_ID) passShards(state, hero, action.toHeroId);
      else passArtifact(state, hero, action.artifactId, action.toHeroId);
      break;
    }
    case 'useMapItem':
      useMapItem(state, action.itemId, action.targets, action.unitId);
      break;
    case 'mapSpell': {
      const hero = activeHero(state);
      if (state.phase !== 'adventure' || !hero?.alive || hero.entering) throw new Error('Czarów na mapie używa się w swojej turze.');
      mapSpell(state, hero, action.spell);
      arriveAt(state, hero);
      break;
    }
    case 'selectSupports':
      selectSupports(state, action.faction, action.supportIds);
      break;
    case 'deployUnits':
      if (!state.battle) throw new Error('Nie trwa żadna bitwa.');
      deployUnits(state, action.faction, action.positions, action.traps);
      break;
    case 'pickMirages':
      if (!state.battle) throw new Error('Nie trwa żadna bitwa.');
      pickMirages(state, action.faction, action.unitIds);
      break;
    case 'pickSpells':
      pickSpells(state, action.faction, action.spells);
      break;
    case 'pickGear':
      pickGear(state, action.faction, action.artifactId);
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
  fireStory(state);
  state.actionCount += 1;
  return state;
}

function applyBattleAction(state: GameState, raw: Action) {
  const b = state.battle;
  if (!b || b.stage !== 'fight' || !b.activation) throw new Error('Nie trwa żadna bitwa.');
  const action = b.mirageAlias ? unmaskAction(b, raw) : raw;
  switch (action.type) {
    case 'battleMirageSwap':
      battleMirageSwap(state, action.mirageId);
      break;
    case 'battleTideSwap':
      battleTideSwap(state, action.targetId);
      break;
    case 'battleMove':
      battleMove(state, action.to);
      break;
    case 'battleAttack':
      battleAttack(state, action.targetId, Boolean(action.useAbility), action.secondTargetId);
      break;
    case 'battleAbility':
      battleAbility(state, action.targetId, action.cell, action.from);
      break;
    case 'battleHop':
      battleHop(state, action.to);
      break;
    case 'battleTeleport':
      battleTeleport(state, action.to);
      break;
    case 'battleItem':
      battleItem(state, action);
      break;
    case 'battleCatapult':
      battleCatapult(state, action.cell);
      break;
    case 'battleSpell':
      battleSpell(state, action.spell, action.targetId);
      break;
    case 'endActivation':
      endActivation(state);
      break;
    default:
      throw new Error('Nieznana akcja.');
  }
}
