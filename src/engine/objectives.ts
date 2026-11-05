// What a game is played for. Each objective is a module with the same hooks, so the adventure code asks the objective instead of
// knowing the rules of one goal: set it up, check for a win, close a round, close the game at the round limit, and describe the
// progress for the screen. 'crystals' is the board game's goal (carry the crystals to the Tree, the Horde's ritual); the
// others belong to the digital ruleset. Result of a game under 'crystals' must never change (tests/golden.test.ts).

import { CONTROL, FACTION_NAMES, type FactionId } from './data';
import { finish, heroesAt, ritualFormed } from './game';
import { distance, key, parseKey, triToHex, type HexKey } from './hex';
import { log } from './log';
import { homeKey, mapNeighbors, revealAround, tileCost, treeKey } from './map';
import { Rng } from './rng';
import { isDigital, type GameState, type ObjectiveId } from './types';

/** One line of the progress panel: what, how far, and whose it is (for the colour). */
export interface ProgressLine {
  label: string;
  value: string;
  tone?: FactionId | 'warn';
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

/** The objective of a game: 'control' only in the digital ruleset, otherwise the crystals goal. */
export const objectiveOf = (state: Pick<GameState, 'rules'>): ObjectiveId => (state.rules.objective === 'control' && isDigital(state.rules) ? 'control' : 'crystals');

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

// ------------------------------------------------------------------ control points

/** The side whose hero stands on `k` (one hero per hex, so a point is held by whoever is on it), or null. */
export function controlHolder(state: GameState, k: HexKey): FactionId | null {
  const sides = new Set(heroesAt(state, k).map((h) => h.faction));
  return sides.size === 1 ? [...sides][0] : null;
}

/** The worth of a control point: the middle one (the first) counts more, so a lone hero's fight for the middle decides a duel. */
export const controlWeight = (state: GameState, k: HexKey): number => (state.control?.points[0] === k ? CONTROL.centreWeight : 1);

/** The worth of the control points each side holds now. */
export function controlCounts(state: GameState): Record<FactionId, number> {
  const out = { dawn: 0, horde: 0 };
  for (const k of state.control?.points ?? []) {
    const h = controlHolder(state, k);
    if (h) out[h] += controlWeight(state, k);
  }
  return out;
}

/** Rounds in a row `side` must lead to win. */
export const controlRoundsToWin = (state: GameState, side: FactionId): number => CONTROL.roundsToWin[state.setup.mapSize] + (side === 'dawn' ? state.rules.controlDawnExtra ?? CONTROL.dawnExtraRounds : 0);

/**
 * Three points on unclaimed hexes: one in the middle (on the axis of the triangle) and a pair mirrored over it, so neither side is
 * nearer. A hex that is not passable (a mountain, a lake) is cleared into meadow or scorched ground when the pattern needs it, but
 * the ones that already are passable are preferred. The choice comes from the game's seed (its own generator: the map is untouched).
 */
function placeControlPoints(state: GameState): HexKey[] {
  const rows = state.rows;
  const rng = new Rng((state.setup.seed ^ 0x2c1b3c6d) | 0);
  const reserved = new Set<HexKey>([treeKey()]);
  for (const f of ['dawn', 'horde'] as const) {
    const home = homeKey(rows, f);
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
      t.terrain = t.side === 'dawn' ? 'meadow' : 'scorched';
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
    state.control = { points, lead: null, streak: 0, led: { dawn: 0, horde: 0 } };
  },
  checkVictory() {},
  onRoundEnd(state) {
    const c = state.control!;
    const n = controlCounts(state);
    const leader: FactionId | null = n.dawn > n.horde ? 'dawn' : n.horde > n.dawn ? 'horde' : null;
    c.streak = leader && leader === c.lead ? c.streak + 1 : leader ? 1 : 0;
    c.lead = leader;
    if (leader) c.led[leader] += 1;
    if (!leader) {
      log(state, 'round', `Punkty kontrolne: Przymierze ${n.dawn}, Horda ${n.horde}: nikt nie ma przewagi.`);
      return false;
    }
    const need = controlRoundsToWin(state, leader);
    log(state, 'round', `Punkty kontrolne: Przymierze ${n.dawn}, Horda ${n.horde}: przewagę ma ${FACTION_NAMES[leader]} (${c.streak}/${need} rund).`);
    if (c.streak >= need) {
      finish(state, leader, `${FACTION_NAMES[leader]} utrzymało punkty kontrolne przez ${need} rundy z rzędu.`);
      return true;
    }
    return false;
  },
  onRoundLimit(state) {
    // The side that led for more rounds wins; level (or no leader at all) goes to the Horde, as the limit does in the crystals game.
    const { dawn, horde } = state.control!.led;
    if (dawn > horde) finish(state, 'dawn', 'Upłynął limit rund: Przymierze dłużej miało przewagę w punktach kontrolnych.');
    else finish(state, 'horde', horde > dawn ? 'Upłynął limit rund: Horda dłużej miała przewagę w punktach kontrolnych.' : 'Upłynął limit rund.');
  },
  progress(state) {
    const n = controlCounts(state);
    const c = state.control!;
    const lines: ProgressLine[] = [{ label: 'Punkty kontrolne', value: `Przymierze ${n.dawn} · Horda ${n.horde}` }];
    if (c.lead) lines.push({ label: `Przewaga: ${FACTION_NAMES[c.lead]}`, value: `${c.streak}/${controlRoundsToWin(state, c.lead)} rund`, tone: c.lead });
    return lines;
  },
};

export const OBJECTIVES: Record<ObjectiveId, Objective> = { crystals, control };
