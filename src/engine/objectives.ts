// What a game is played for. Each objective is a module with the same hooks, so the adventure code asks the objective instead of
// knowing the rules of one goal: set it up, check for a win, close a round, close the game at the round limit, and describe the
// progress for the screen. 'crystals' is the board game's goal (carry the crystals to the Tree, the Horde's ritual); the
// others belong to the digital ruleset. Result of a game under 'crystals' must never change (tests/golden.test.ts).

import { FACTION_PACKS, terrainOf } from './factions';
import { byTeam, raceOf, teamsOf } from './teams';
import { BOSS, CONTROL, ENCOUNTERS, FACTION_NAMES, NEUTRAL_BOSSES, SURVIVAL, TERRAIN_COST, TERRAIN_VARIANTS, TILE_POOLS, UNITS, type TeamId, type Terrain } from './data';
import { hpScaleOf } from './battle';
import { finish, finishDraw, heroesAt, ritualFormed, spawnHordeHero } from './game';
import { distance, key, parseKey, triToHex, type HexKey } from './hex';
import { log } from './log';
import { homeOf, mapNeighbors, revealAround, tileCost, treeOf } from './map';
import { Rng } from './rng';
import { isDigital, type GameState, type ObjectiveId } from './types';
import { shardsOf, shardTotal, SPARK_NAMES, sparkOwner } from './empire';

/** One line of the progress panel: what, how far, and whose it is (for the colour). */
export interface ProgressLine {
  label: string;
  value: string;
  tone?: TeamId | 'warn';
  /** The row belongs to a side without naming it: the screen puts the crest of the side (`tone`) before the label. */
  crest?: boolean;
}

export interface Objective {
  id: ObjectiveId;
  /** Name for the setup screen and the rules. */
  name: string;
  /** One sentence for the setup screen tooltip. */
  summary: string;
  /** Called once when the game is created (the map and the crystals are in place). */
  init(state: GameState): void;
  /** Called after every step that could end the game: the objective may finish it. */
  checkVictory(state: GameState): void;
  /** Called when every hero has had its turn of the round. True when the game ended. */
  onRoundEnd(state: GameState): boolean;
  /** Called at the end of the last round instead of starting a new one. */
  onRoundLimit(state: GameState): void;
  /** The state of the goal, for the screen. */
  progress(state: GameState): ProgressLine[];
}

/** The objective of a game: 'control' and 'survival' only in the digital ruleset, otherwise the crystals goal. */
export const objectiveOf = (state: Pick<GameState, 'rules'>): ObjectiveId => {
  const o = state.rules.objective;
  // Conquest is played for settlements: it needs level 4 (settlements, garrisons, walls).
  // The Relic is the goal of level 6 (shards and the building of the Pierwotna Iskra).
  if (o === 'relic') return isDigital(state.rules) && state.rules.kingdom && state.rules.empire ? o : 'crystals';
  if (o === 'conquest') return isDigital(state.rules) && state.rules.kingdom && state.rules.economy ? o : 'crystals';
  return (o === 'control' || o === 'survival' || o === 'boss' || o === 'artifact') && isDigital(state.rules) ? o : 'crystals';
};

const crystals: Objective = {
  id: 'crystals',
  name: 'Kryształy do Drzewa',
  summary: 'Cel planszówki: Przymierze zanosi wszystkie kryształy do Kryształowego Drzewa, a Horda przerywa je rytuałem przy Drzewie.',
  init() {},
  checkVictory(state) {
    if (state.factions.dawn.delivered >= state.crystalsNeeded) finish(state, 'dawn', 'Wszystkie kryształy wróciły do Drzewa.');
  },
  onRoundEnd(state) {
    if (ritualFormed(state)) {
      state.ritual += 1;
      log(state, 'round', `Rytuał przy Drzewie trwa (${state.ritual}/${state.rules.ritualRounds}).`);
      if (state.ritual >= state.rules.ritualRounds) {
        finish(state, 'horde', 'Mroczna Horda ukończyła rytuał przy Drzewie.');
        return true;
      }
    } else if (state.ritual) {
      state.ritual = 0;
      log(state, 'round', 'Rytuał został przerwany.');
    }
    return false;
  },
  onRoundLimit(state) {
    finish(state, 'horde', 'Upłynął limit rund.');
  },
  progress(state) {
    const lines: ProgressLine[] = [{ label: 'Kryształy przy Drzewie', value: `${state.factions.dawn.delivered} / ${state.crystalsNeeded}`, tone: 'dawn' }];
    if (state.ritual > 0) lines.push({ label: 'Rytuał przy Drzewie', value: `${state.ritual}/${state.rules.ritualRounds}`, tone: 'horde' });
    return lines;
  },
};

/** The team with the strictly best score, or null when the top is shared (a draw for the round limit). Works for any number of teams. */
export function bestTeam(scores: Partial<Record<TeamId, number>>, teams: readonly TeamId[] = Object.keys(scores) as TeamId[]): TeamId | null {
  const top = Math.max(...teams.map((t) => scores[t] ?? 0));
  const leaders = teams.filter((t) => (scores[t] ?? 0) === top);
  return leaders.length === 1 ? leaders[0] : null;
}

/** The third and the fourth team get a number, so two teams of one race can be told apart. */
const TEAM_MARK: Partial<Record<TeamId, string>> = { third: ' (3)', fourth: ' (4)' };
const teamShort = (state: GameState, t: TeamId) => `${FACTION_PACKS[raceOf(state, t)].short}${TEAM_MARK[t] ?? ''}`;
const teamOf = (state: GameState, t: TeamId) => `${FACTION_PACKS[raceOf(state, t)].genitive}${TEAM_MARK[t] ?? ''}`;
const scoreLine = (state: GameState, n: Record<TeamId, number>, sep: string) => teamsOf(state).map((t) => `${teamShort(state, t)} ${n[t]}`).join(sep);

// ------------------------------------------------------------------ control points

/** The side whose hero stands on `k` (one hero per hex, so a point is held by whoever is on it), or null. */
export function controlHolder(state: GameState, k: HexKey): TeamId | null {
  const sides = new Set(heroesAt(state, k).map((h) => h.faction));
  return sides.size === 1 ? [...sides][0] : null;
}

/** The worth of a control point: the middle one (the first) counts more, so a lone hero's fight for the middle decides a duel. */
export const controlWeight = (state: GameState, k: HexKey): number => (state.control?.points[0] === k ? CONTROL.centreWeight : 1);

/** The worth of the control points each side holds now. */
export function controlCounts(state: GameState): Record<TeamId, number> {
  const out = byTeam(teamsOf(state), () => 0);
  for (const k of state.control?.points ?? []) {
    const h = controlHolder(state, k);
    if (h) out[h] += controlWeight(state, k);
  }
  return out;
}

/** Rounds in a row `side` must lead to win. */
export const controlRoundsToWin = (state: GameState, side: TeamId): number => CONTROL.roundsToWin[state.setup.mapSize] + (side === 'dawn' ? state.rules.controlDawnExtra ?? CONTROL.dawnExtraRounds : 0);

/**
 * Three points on unclaimed hexes: one in the middle (on the axis of the triangle) and a pair mirrored over it, so neither side is
 * nearer. A hex that is not passable (a mountain, a lake) is cleared into meadow or scorched ground when the pattern needs it, but
 * the ones that already are passable are preferred. The choice comes from the game's seed (its own generator: the map is untouched).
 */
function placeControlPoints(state: GameState): HexKey[] {
  if (teamsOf(state).length > 2) return placeControlPointsMulti(state);
  if (state.tree && state.setup.mapShape && state.setup.mapShape !== 'triangle') return placeControlPointsGeneric(state);
  const rows = state.rows;
  const rng = new Rng((state.setup.seed ^ 0x2c1b3c6d) | 0);
  const reserved = new Set<HexKey>([treeOf(state)]);
  for (const f of ['dawn', 'horde'] as const) {
    const home = homeOf(state, f);
    reserved.add(home);
    for (const n of mapNeighbors(state.tiles, home)) reserved.add(n);
  }
  const claimed = new Set<HexKey>(reserved);
  for (const t of Object.values(state.tiles)) if (t.crystalId) reserved.add(t.key);
  for (const t of Object.values(state.tiles)) if (t.treasureId) claimed.add(t.key);
  for (const k of reserved) claimed.add(k);
  /** The hex at (row, col) and how many of the points it would need cleared (0 or 1), or null when it is claimed. */
  let strict = true;
  const at = (row: number, col: number): { k: HexKey; clear: number } | null => {
    if (row < 0 || row >= rows || col < 0 || col > row) return null;
    const k = key(triToHex(row, col));
    return (strict ? claimed : reserved).has(k) ? null : { k, clear: tileCost(state.tiles[k]) === null ? 1 : 0 };
  };
  // Not too deep (near the bases) if the map is big enough, else one row deeper, else a treasure's hex may share a point.
  let chosen: HexKey[] | null = null;
  for (const [deepest, noTreasure] of [[rows - 3, true], [rows - 2, true], [rows - 2, false]] as const) {
    strict = noTreasure;
    const centres = [];
    for (let r = 2; r <= deepest; r += 2) {
      const c = at(r, r / 2);
      if (c) centres.push(c);
    }
    // Centres already passable first, then the others; for each, the cheapest pair that fits.
    const order = [...rng.shuffle(centres.filter((c) => c.clear === 0)), ...rng.shuffle(centres.filter((c) => c.clear === 1))];
    for (const centre of order) {
      const pairs = [];
      for (let r = 2; r <= deepest; r++) {
        for (let c = 1; c * 2 < r; c++) {
          const a = at(r, c);
          const b = at(r, r - c);
          if (a && b && distance(parseKey(a.k), parseKey(centre.k)) >= 2 && distance(parseKey(b.k), parseKey(centre.k)) >= 2) pairs.push({ a, b, clear: a.clear + b.clear });
        }
      }
      if (!pairs.length) continue;
      const best = Math.min(...pairs.map((p) => p.clear));
      const pair = rng.pick(pairs.filter((p) => p.clear === best));
      chosen = [centre.k, pair.a.k, pair.b.k];
      break;
    }
    if (chosen) break;
  }
  if (!chosen) {
    // A cramped map (some short ones): a mirrored pair, and the middle point on any free hex between them.
    strict = false;
    const spare = [];
    for (let r = 1; r <= rows - 2; r++) for (let c = 0; c <= r; c++) if (at(r, c)) spare.push(at(r, c)!);
    const pairs = [];
    for (let r = 2; r <= rows - 2; r++) for (let c = 1; c * 2 < r; c++) {
      const a = at(r, c);
      const b = at(r, r - c);
      if (a && b) pairs.push({ a, b, clear: a.clear + b.clear });
    }
    const best = Math.min(...pairs.map((p) => p.clear));
    for (const pair of rng.shuffle(pairs.filter((p) => p.clear === best))) {
      const far = spare.filter((m) => distance(parseKey(m.k), parseKey(pair.a.k)) >= 2 && distance(parseKey(m.k), parseKey(pair.b.k)) >= 2);
      const mid = rng.shuffle(far).sort((x, y) => x.clear - y.clear)[0];
      if (mid) {
        chosen = [mid.k, pair.a.k, pair.b.k];
        break;
      }
    }
  }
  if (!chosen) {
    // Last resort (one short map in hundreds): any three free hexes.
    const any = [];
    for (let r = 1; r <= rows - 2; r++) for (let c = 0; c <= r; c++) if (at(r, c)) any.push(at(r, c)!.k);
    if (any.length < CONTROL.points) throw new Error('Nie udało się rozmieścić punktów kontrolnych.');
    chosen = rng.shuffle(any).slice(0, CONTROL.points);
  }
  for (const k of chosen) {
    const t = state.tiles[k];
    if (tileCost(t) === null) {
      t.terrain = terrainOf(raceOf(state, t.side)).land;
      t.variant = 1;
    }
  }
  return chosen;
}

/**
 * Control points on a rectangle or a ring: the middle point is a hex equally far from both bases (the one nearest the Tree that is not the Tree,
 * a base or next to a base), the other two are a pair that swap their distances to the bases (so neither side is nearer), the closest pair to the
 * middle point that is at least 2 hexes from it. Hexes that are not passable are cleared like in the triangle.
 */
function placeControlPointsGeneric(state: GameState): HexKey[] {
  const rng = new Rng((state.setup.seed ^ 0x2c1b3c6d) | 0);
  const tree = treeOf(state);
  const [dh, hh] = [parseKey(homeOf(state, 'dawn')), parseKey(homeOf(state, 'horde'))];
  const free = new Set(Object.keys(state.tiles));
  free.delete(tree);
  for (const f of ['dawn', 'horde'] as const) {
    free.delete(homeOf(state, f));
    for (const n of mapNeighbors(state.tiles, homeOf(state, f))) free.delete(n);
  }
  const dd = (k: HexKey): [number, number] => [distance(parseKey(k), dh), distance(parseKey(k), hh)];
  const treePos = parseKey(tree);
  const byTree = (a: HexKey, b: HexKey) => distance(parseKey(a), treePos) - distance(parseKey(b), treePos);
  const passableFirst = (a: HexKey, b: HexKey) => Number(tileCost(state.tiles[a]) === null) - Number(tileCost(state.tiles[b]) === null);
  const middles = rng.shuffle([...free].filter((k) => dd(k)[0] === dd(k)[1])).sort((a, b) => byTree(a, b) || passableFirst(a, b));
  for (const mid of middles) {
    const pairs: Array<[HexKey, HexKey]> = [];
    for (const a of free) {
      const [x, y] = dd(a);
      if (x >= y || distance(parseKey(a), parseKey(mid)) < 2) continue;
      for (const b of free) {
        const [u, v] = dd(b);
        if (u === y && v === x && distance(parseKey(b), parseKey(mid)) >= 2) pairs.push([a, b]);
      }
    }
    if (!pairs.length) continue;
    const cost = ([a, b]: [HexKey, HexKey]) => distance(parseKey(a), parseKey(mid)) * 4 + Number(tileCost(state.tiles[a]) === null) + Number(tileCost(state.tiles[b]) === null);
    const best = Math.min(...pairs.map(cost));
    const [a, b] = rng.pick(pairs.filter((p) => cost(p) === best));
    for (const k of [mid, a, b]) {
      const t = state.tiles[k];
      if (tileCost(t) === null) {
        t.terrain = terrainOf(raceOf(state, t.side)).land;
        t.variant = 1;
      }
    }
    return [mid, a, b];
  }
  throw new Error('Nie udało się rozmieścić punktów kontrolnych.');
}

/**
 * Control points for three or four teams: the middle one is the hex whose distances to all the bases differ least (the one nearest the Tree that
 * is not the Tree, a base or next to a base); then one point for each team, on the way from its base to the middle, nearer to its own base than to
 * any other, so every team has about the same road to its own point and to the middle.
 */
function placeControlPointsMulti(state: GameState): HexKey[] {
  const rng = new Rng((state.setup.seed ^ 0x2c1b3c6d) | 0);
  const teams = teamsOf(state);
  const tree = treeOf(state);
  const treePos = parseKey(tree);
  const homes = teams.map((t) => parseKey(homeOf(state, t)));
  const free = new Set(Object.keys(state.tiles));
  free.delete(tree);
  for (const t of teams) {
    free.delete(homeOf(state, t));
    for (const n of mapNeighbors(state.tiles, homeOf(state, t))) free.delete(n);
  }
  const ds = (k: HexKey) => homes.map((h) => distance(parseKey(k), h));
  const spread = (k: HexKey) => Math.max(...ds(k)) - Math.min(...ds(k));
  const closed = (k: HexKey) => Number(tileCost(state.tiles[k]) === null);
  const [mid] = rng.shuffle([...free]).sort((a, b) => spread(a) - spread(b) || distance(parseKey(a), treePos) - distance(parseKey(b), treePos) || closed(a) - closed(b));
  const chosen: HexKey[] = [mid];
  teams.forEach((_, i) => {
    const want = Math.round(distance(homes[i], parseKey(mid)) / 2);
    const cost = (k: HexKey) => {
      const d = ds(k);
      const own = d[i];
      const nearest = d.every((x, j) => j === i || x > own);
      return Math.abs(own - want) * 4 + closed(k) + (nearest ? 0 : 20);
    };
    const options = [...free].filter((k) => chosen.every((c) => distance(parseKey(k), parseKey(c)) >= 2));
    const best = Math.min(...options.map(cost));
    if (!options.length) throw new Error('Mapa jest za mała dla tylu stron.');
    chosen.push(rng.pick(options.filter((k) => cost(k) === best)));
  });
  for (const k of chosen) {
    const t = state.tiles[k];
    if (tileCost(t) === null) {
      t.terrain = terrainOf(raceOf(state, t.side)).land;
      t.variant = 1;
    }
  }
  return chosen;
}

const control: Objective = {
  id: 'control',
  name: 'Punkty kontrolne',
  summary: 'Na mapie leżą trzy punkty kontrolne: środkowy wart 2, boczne po 1. Kto utrzyma więcej (bohater stoi na punkcie na koniec rundy) przez kilka rund z rzędu, wygrywa.',
  init(state) {
    const points = placeControlPoints(state);
    for (const k of points) revealAround(state, k);
    state.control = { points, lead: null, streak: 0, led: byTeam(teamsOf(state), () => 0) };
  },
  checkVictory() {},
  onRoundEnd(state) {
    const c = state.control!;
    const n = controlCounts(state);
    const leader: TeamId | null = bestTeam(n);
    c.streak = leader && leader === c.lead ? c.streak + 1 : leader ? 1 : 0;
    c.lead = leader;
    if (leader) c.led[leader] += 1;
    if (!leader) {
      log(state, 'round', `Punkty kontrolne: ${scoreLine(state, n, ', ')}: nikt nie ma przewagi.`);
      return false;
    }
    const need = controlRoundsToWin(state, leader);
    log(state, 'round', `Punkty kontrolne: ${scoreLine(state, n, ', ')}: przewagę ma ${FACTION_NAMES[raceOf(state, leader)]} (${c.streak}/${need} rund).`);
    if (c.streak >= need) {
      finish(state, leader, `${FACTION_NAMES[raceOf(state, leader)]} utrzymało punkty kontrolne przez ${need} rundy z rzędu.`);
      return true;
    }
    return false;
  },
  onRoundLimit(state) {
    // The side that led for more rounds wins; level (or no leader at all) is a draw.
    const best = bestTeam(state.control!.led);
    if (best) finish(state, best, `Upłynął limit rund: ${teamShort(state, best)} ${FACTION_PACKS[raceOf(state, best)].lead} przewagę w punktach kontrolnych.`);
    else finishDraw(state, 'Upłynął limit rund: żadna strona nie miała przewagi w punktach kontrolnych.');
  },
  progress(state) {
    const n = controlCounts(state);
    const c = state.control!;
    const lines: ProgressLine[] = [{ label: 'Punkty kontrolne', value: scoreLine(state, n, ' · ') }];
    if (c.lead) lines.push({ label: `Przewaga: ${FACTION_NAMES[raceOf(state, c.lead)]}`, value: `${c.streak}/${controlRoundsToWin(state, c.lead)} rund`, tone: c.lead });
    return lines;
  },
};

// ------------------------------------------------------------------ survival

/** The living heroes of each team. */
const survivors = (state: GameState) => byTeam(teamsOf(state), (t) => Object.values(state.heroes).filter((h) => h.faction === t && h.alive).length);

/** Survival with more than two teams, at the end: the team with most heroes standing wins, a tie at the top is a draw. Always true (the game is over). */
function survivalVerdict(state: GameState): true {
  const standing = survivors(state);
  const best = bestTeam(standing);
  if (best) finish(state, best, `Upłynął limit rund: ${teamShort(state, best)} ma najwięcej bohaterów na nogach (${standing[best]}).`);
  else finishDraw(state, 'Upłynął limit rund: najwięcej bohaterów na nogach ma kilka stron.');
  return true;
}

const survival: Objective = {
  id: 'survival',
  name: 'Przetrwanie',
  summary: 'Fale Hordy: co dwie rundy w bazie Hordy pojawia się kolejny bohater. Przymierze wygrywa, gdy przetrwa wyznaczoną liczbę rund, Horda, gdy polegną wszyscy jego bohaterowie.',
  init(state) {
    state.survival = { rounds: SURVIVAL.rounds[state.setup.mapSize], waves: 0 };
    // The Tree's hex becomes an ordinary one (the Przymierze still gather there: treeOf stays the middle of the map).
    const rng = new Rng((state.setup.seed ^ 0x2f6e2b1) | 0);
    const tile = state.tiles[treeOf(state)];
    const options = [...TILE_POOLS.dawn, ...TILE_POOLS.horde].filter((t: Terrain) => t !== 'bridge' && TERRAIN_COST[t] !== null);
    tile.terrain = rng.pick(options);
    tile.variant = 1 + rng.int(TERRAIN_VARIANTS[tile.terrain]);
    tile.tree = false;
  },
  checkVictory() {},
  onRoundEnd(state) {
    const s = state.survival!;
    // Three or four teams: no Horde waves, everybody is a player; whoever has most heroes standing when the rounds are over wins.
    if (teamsOf(state).length > 2) return state.round >= s.rounds ? survivalVerdict(state) : false;
    const dawnAlive = Object.values(state.heroes).filter((h) => h.faction === 'dawn' && h.alive).length;
    if (state.round >= s.rounds) {
      finish(state, 'dawn', `Przymierze przetrwało ${s.rounds} rund.`);
      return true;
    }
    if (state.round % SURVIVAL.waveEvery === 0) {
      const hordeAlive = Object.values(state.heroes).filter((h) => h.faction === 'horde' && h.alive).length;
      if (hordeAlive < dawnAlive + SURVIVAL.extra && spawnHordeHero(state)) {
        s.waves += 1;
        log(state, 'round', `Fala Hordy (${s.waves}): do bazy Hordy przybywa kolejny bohater.`);
      }
    }
    return false;
  },
  onRoundLimit(state) {
    if (teamsOf(state).length > 2) survivalVerdict(state);
    else finish(state, 'dawn', 'Przymierze przetrwało.');
  },
  progress(state) {
    const s = state.survival!;
    if (teamsOf(state).length > 2) {
      const standing = survivors(state);
      return [
        { label: 'Przetrwane rundy', value: `${Math.min(state.round - 1, s.rounds)} / ${s.rounds}` },
        ...teamsOf(state).map((t) => ({ label: `Bohaterowie: ${teamShort(state, t)}`, value: `${standing[t]}`, tone: t })),
      ];
    }
    return [
      { label: 'Przetrwane rundy', value: `${Math.min(state.round - 1, s.rounds)} / ${s.rounds}`, tone: 'dawn' },
      { label: 'Fale Hordy', value: `${s.waves}`, tone: 'horde' },
    ];
  },
};

// ------------------------------------------------------------------ boss

/** The lair art of the neutral bosses (no pictures of their own yet): the lair of the guardian of their motif. */
const BOSS_LAIR: Record<string, Terrain> = { stoneGolem: 'lairCyclops', stormKing: 'lairGriffin', kraken: 'lairHydra' };

const boss: Objective = {
  id: 'boss',
  name: 'Boss',
  summary: 'W środku mapy jest legowisko Bossa. Obie strony mogą go wyzywać, a rany zostają między walkami. Kto zada ostatni cios, wygrywa.',
  init(state) {
    const rng = new Rng((state.setup.seed ^ 0x5bd1e995) | 0);
    // The middle control point's place is the lair (it is cleared into passable ground, like the control points are).
    const at = placeControlPoints(state)[0];
    // With hero growth the Boss may also be one of the three neutral bosses (stoneGolem, stormKing, kraken); without it the draw is as before.
    const guardian = rng.pick(state.rules.heroGrowth ? ['hydra', 'cyclops', ...NEUTRAL_BOSSES] : ['hydra', 'cyclops']);
    const dawnHeroes = state.setup.seats.filter((s) => s.faction === 'dawn').length;
    const hp = Math.round(BOSS.hp[state.setup.mapSize] * hpScaleOf(state) * (dawnHeroes >= 2 ? BOSS.twoHeroesFactor : 1) * (BOSS.hpFactor[guardian] ?? 1) * (state.rules.noHorde ? BOSS.noHordeFactor : 1));
    state.tiles[at].terrain = guardian === 'hydra' ? 'lairHydra' : guardian === 'cyclops' ? 'lairCyclops' : (BOSS_LAIR[guardian] ?? 'lairCyclops');
    state.tiles[at].crystalId = 'boss';
    // The Kraken fights with its tentacles; they are fresh in every fight (only the head's wounds stay).
    state.crystals.boss = { id: 'boss', guardian, at, ...(guardian === 'kraken' ? { encounter: ['kraken', ...Array.from({ length: ENCOUNTERS.krakenTentacles }, () => 'tentacle')] } : {}) };
    state.boss = { at, guardian, hp, maxHp: hp, slain: null, hits: byTeam(teamsOf(state), () => 0) };
    revealAround(state, at);
  },
  checkVictory(state) {
    const b = state.boss!;
    if (b.slain) finish(state, b.slain, `Boss pokonany: ostatni cios zadała strona „${FACTION_NAMES[raceOf(state, b.slain)]}”.`);
  },
  onRoundEnd() {
    return false;
  },
  onRoundLimit(state) {
    // PvP: nobody beat the Boss, a draw; in coop the players lose (the Horde is the computer).
    if (state.setup.mode !== 'coop') finishDraw(state, 'Upłynął limit rund: nikt nie pokonał Bossa.');
    else finish(state, 'horde', state.rules.noHorde ? 'Upłynął limit rund: Boss nie został pokonany.' : 'Upłynął limit rund: nikt nie pokonał Bossa.');
  },
  progress(state) {
    const b = state.boss!;
    return [
      { label: 'Boss', value: `${b.hp} / ${b.maxHp} Ż` },
      teamsOf(state).length > 2 ? { label: 'Zadane rany', value: teamsOf(state).map((t) => `${teamShort(state, t)} ${b.hits[t]}`).join(' · ') } : state.rules.noHorde ? { label: 'Zadane rany', value: `${b.hits.dawn}` } : { label: 'Zadane rany (Świt / Horda)', value: `${b.hits.dawn} / ${b.hits.horde}` },
    ];
  },
};

// ------------------------------------------------------------------ artifact

/** The hero carrying the artifact, or null while it lies on a hex. */
export const artifactCarrier = (state: GameState) => Object.values(state.heroes).find((h) => h.alive && h.crystals.includes('artifact')) ?? null;

const artifact: Objective = {
  id: 'artifact',
  name: 'Artefakt',
  summary: 'W środku mapy leży Artefakt. Kto zaniesie go do swojej bazy, wygrywa. Bohater, który go niesie, może zginąć, a wtedy Artefakt upada na pole i podnosi go następny.',
  init(state) {
    const at = placeControlPoints(state)[0];
    state.crystals.artifact = { id: 'artifact', guardian: null, at };
    state.tiles[at].crystalId = 'artifact';
    state.artifact = { start: at, handovers: 0 };
    revealAround(state, at);
  },
  checkVictory(state) {
    const h = artifactCarrier(state);
    if (h && state.tiles[h.pos].home === h.faction) finish(state, h.faction, `${FACTION_NAMES[raceOf(state, h.faction)]} zaniosło Artefakt do swojej bazy.`);
  },
  onRoundEnd() {
    return false;
  },
  onRoundLimit(state) {
    // PvP: nobody carried the Artifact home, a draw; in coop the players lose.
    if (state.setup.mode !== 'coop') finishDraw(state, 'Upłynął limit rund: nikt nie zaniósł Artefaktu do bazy.');
    else finish(state, 'horde', 'Upłynął limit rund: nikt nie zaniósł Artefaktu do bazy.');
  },
  progress(state) {
    const h = artifactCarrier(state);
    return [
      { label: 'Artefakt', value: h ? `niesie ${UNITS[h.id].name}` : 'leży na mapie', tone: h?.faction },
      { label: 'Zmiany właściciela', value: `${state.artifact!.handovers}` },
    ];
  },
};

// ------------------------------------------------------------------ conquest (level 4)

/** The settlements `side` has to hold to win: every one on the enemy's land (its capital and the ones to conquer there). */
export function conquestTargets(state: GameState, side: TeamId): string[] {
  // The land of every other team is the enemy's.
  return Object.values(state.kingdom?.settlements ?? {}).filter((s) => s.land !== side).map((s) => s.id);
}

/** How many of its targets `side` holds now. */
export const conquestHeld = (state: GameState, side: TeamId): number => conquestTargets(state, side).filter((id) => state.kingdom!.settlements[id].owner === side).length;

const conquest: Objective = {
  id: 'conquest',
  name: 'Podbój',
  summary: 'Wygrywa ten, kto na koniec rundy trzyma wszystkie osady na ziemi wroga: jego stolicę i osady do zdobycia na jego połowie mapy. Garnizony i mury bronią ich, gdy bohater odejdzie.',
  init() {},
  checkVictory() {},
  onRoundEnd(state) {
    if (!state.kingdom) return false;
    for (const side of teamsOf(state)) {
      const need = conquestTargets(state, side).length;
      if (need > 0 && conquestHeld(state, side) === need) {
        finish(state, side, `${FACTION_NAMES[raceOf(state, side)]} trzyma wszystkie osady na ziemi wroga.`);
        return true;
      }
    }
    return false;
  },
  onRoundLimit(state) {
    // Time is up: a side that holds most of the enemy's land (more than half of its settlements) has won the war, unless the enemy did the same;
    // otherwise (neither or both) it is a draw.
    const most = (f: TeamId) => conquestHeld(state, f) * 2 > conquestTargets(state, f).length;
    const teams = teamsOf(state);
    const winners = teams.filter(most);
    if (winners.length === 1) {
      const w = winners[0];
      const enemy = teams.filter((t) => t !== w).map((t) => teamOf(state, t)).join(' i ');
      finish(state, w, `Upłynął limit rund: ${teamShort(state, w)} trzyma większość osad na ziemi ${enemy} (${conquestHeld(state, w)} z ${conquestTargets(state, w).length}).`);
    } else finishDraw(state, 'Upłynął limit rund: nikt nie zdobył przewagi w ziemi wroga.');
  },
  progress(state) {
    if (!state.kingdom) return [];
    return teamsOf(state).map((side) => ({ label: 'Przejęte osady wroga', value: `${conquestHeld(state, side)} / ${conquestTargets(state, side).length}`, tone: side, crest: true }));
  },
};

// ------------------------------------------------------------------ relic (level 6)

const relic: Objective = {
  id: 'relic',
  name: 'Relikt',
  summary: 'Na mapie leżą Odłamki Pierwotnej Iskry. Kto zbierze wszystkie i wzniesie w swojej osadzie budynek Pierwotnej Iskry, wygrywa. Pokonany bohater oddaje swoje Odłamki zwycięzcy.',
  init() {},
  checkVictory(state) {
    const owner = sparkOwner(state);
    if (owner) finish(state, owner, `${FACTION_NAMES[raceOf(state, owner)]} wzniosło budynek: ${SPARK_NAMES[raceOf(state, owner)]}.`);
  },
  onRoundEnd() {
    return false;
  },
  onRoundLimit(state) {
    // More shards in hand wins; level is a draw.
    const teams = teamsOf(state);
    const shards = byTeam(teams, (t) => shardsOf(state, t));
    const best = bestTeam(shards);
    if (best) finish(state, best, `Upłynął limit rund: ${teamShort(state, best)} ma więcej Odłamków (${shards[best]} do ${teams.filter((t) => t !== best).map((t) => shards[t]).join(' i ')}).`);
    else finishDraw(state, 'Upłynął limit rund: Odłamków po równo.');
  },
  progress(state) {
    const total = shardTotal(state);
    const lying = Object.values(state.kingdom?.shards ?? {}).reduce((a, n) => a + n, 0);
    return [
      ...teamsOf(state).map((t) => ({ label: `Odłamki: ${teamShort(state, t)}`, value: `${shardsOf(state, t)} / ${total}`, tone: t })),
      { label: 'Odłamki na mapie', value: `${lying}` },
    ];
  },
};

export const OBJECTIVES: Record<ObjectiveId, Objective> = { crystals, control, survival, boss, artifact, conquest, relic };
