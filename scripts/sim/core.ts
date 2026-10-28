// Shared simulation code: variants, bot-only games with diagnostics, aggregated stats.
import './override';

import { FACTION_HEROES, type FactionId, type MapSize } from '../../src/engine/data';
import { applyActionInPlace, activeHero, createGame, currentActor, legalHeroMoves } from '../../src/engine/game';
import { chooseAction } from '../../src/engine/ai';
import { Rng } from '../../src/engine/rng';
import { levelSettings, type Action, type GameState, type SeatSetup, type SetupOptions } from '../../src/engine/types';

/** Player configurations: coop with 1–2 good players, PvP 1 on 1 or 2 on 2. */
export type Table = 'coop1' | 'coop2' | 'pvp1' | 'pvp2';
/** The full game or one simplification switched on. */
export type Option = 'full' | 'noabilities' | 'notreasures' | 'dice' | 'replacement' | 'board' | 'kids' | 'hard';

export interface Variant {
  size: MapSize;
  table: Table;
  option: Option;
}

export const SIZES: MapSize[] = ['short', 'medium', 'long', 'veryLong'];
export const TABLES: Table[] = ['coop1', 'coop2', 'pvp1', 'pvp2'];
export const OPTIONS: Option[] = ['full', 'noabilities', 'notreasures', 'dice', 'replacement', 'board', 'kids'];

export const variantName = (v: Variant) => `${v.size}·${v.table}·${v.option}`;

/** Heroes are drawn at random per game, so no hero choice biases the results. */
export function setupFor(v: Variant, seed: number): SetupOptions {
  return setupWith(v.size, v.table, [v.option], seed);
}

/**
 * A bot-only setup with any mix of options: a level ('kids' or 'hard', else the normal one), then the
 * single switches on top of it.
 */
export function setupWith(size: MapSize, table: Table, options: Option[], seed: number): SetupOptions {
  const rng = new Rng(seed * 7919 + 13);
  const pick = (f: FactionId, n: number) => rng.shuffle(FACTION_HEROES[f]).slice(0, n);
  const seat = (name: string, faction: FactionId, heroId: string): SeatSetup => ({ name, faction, controller: 'bot', heroId });
  let seats: SeatSetup[];
  if (table === 'coop1' || table === 'coop2') {
    seats = pick('dawn', table === 'coop1' ? 1 : 2).map((h, i) => seat(`Bot ${i + 1}`, 'dawn', h));
  } else {
    const n = table === 'pvp1' ? 1 : 2;
    const dawn = pick('dawn', n);
    const horde = pick('horde', n);
    seats = [];
    for (let i = 0; i < n; i++) seats.push(seat(`Świt ${i + 1}`, 'dawn', dawn[i]), seat(`Horda ${i + 1}`, 'horde', horde[i]));
  }
  const mode = table.startsWith('coop') ? 'coop' : 'pvp';
  const level = options.includes('kids') ? 'kids' : options.includes('hard') ? 'hard' : 'normal';
  const base = levelSettings(level, mode);
  const rules = { ...base.rules };
  if (options.includes('noabilities')) rules.abilities = false;
  if (options.includes('notreasures')) rules.treasures = false;
  if (options.includes('dice')) rules.useDice = true;
  if (options.includes('replacement')) rules.heroReplacement = true;
  return { mode, mapSize: size, battleMode: options.includes('board') ? 'board' : base.battleMode, seed, seats, rules };
}

export interface UnitTally {
  battles: number;
  wins: number;
  deaths: number;
  damage: number;
}

export interface Diagnostics {
  /** Bot chose an action the engine rejected. */
  illegal: number;
  illegalSamples: string[];
  /** Game not finished within the action budget. */
  stuck: number;
  /** Battles stopped by the safety round limit. */
  battleRoundLimit: number;
  /** Bot turns ended with unused move points while some move was legal (heroes not on the Tree). */
  idleTurns: number;
  turns: number;
  /** Bot activations ended without moving or attacking while an attack or a move was possible. */
  idleActivations: number;
  activations: number;
}

export interface Summary {
  variant: string;
  games: number;
  dawnWins: number;
  reasons: Record<string, number>;
  avgRounds: number;
  battlesPerGame: number;
  /** Battles against guardians, and those the guardian won (the rate is wipes / fights). */
  neutralFights: number;
  neutralWipes: number;
  diag: Diagnostics;
  /** Per unit, in battles between heroes / against guardians. */
  units: Record<string, UnitTally>;
  guardianUnits: Record<string, UnitTally>;
  /** Games won by the hero's faction when the hero took part. */
  heroGames: Record<string, { games: number; wins: number }>;
}

const newDiag = (): Diagnostics => ({ illegal: 0, illegalSamples: [], stuck: 0, battleRoundLimit: 0, idleTurns: 0, turns: 0, idleActivations: 0, activations: 0 });

export function runVariant(v: Variant, games: number, firstSeed = 1): Summary {
  const sum: Summary = { variant: variantName(v), games, dawnWins: 0, reasons: {}, avgRounds: 0, battlesPerGame: 0, neutralFights: 0, neutralWipes: 0, diag: newDiag(), units: {}, guardianUnits: {}, heroGames: {} };
  for (let g = 0; g < games; g++) {
    const setup = setupFor(v, firstSeed + g);
    // Actions change the state in place; the ones played are kept to rebuild it after a refused one.
    let s = createGame(setup);
    const played: Action[] = [];
    let lastReport = 0;
    for (let i = 0; i < 30000 && s.phase !== 'over'; i++) {
      const a = chooseAction(s);
      if (!a) break;
      inspect(s, a, sum.diag);
      const logged = s.log.length;
      try {
        applyActionInPlace(s, a);
        played.push(a);
      } catch (e) {
        sum.diag.illegal++;
        if (sum.diag.illegalSamples.length < 5) sum.diag.illegalSamples.push(`${(e as Error).message} ← ${JSON.stringify(a)}`);
        s = replay(setup, played);
        // Unstick: end the turn or activation instead.
        const fallback: Action = s.phase === 'battle' ? { type: 'endActivation' } : { type: 'endTurn' };
        applyActionInPlace(s, fallback);
        played.push(fallback);
      }
      if (s.log.some((l, idx) => idx >= logged && l.text.startsWith('Bitwa trwa zbyt długo'))) sum.diag.battleRoundLimit++;
      const r = s.lastBattle;
      if (r && r.id !== lastReport) {
        lastReport = r.id;
        const book = r.kind === 'neutral' ? sum.guardianUnits : sum.units;
        for (const u of r.units) {
          const t = (book[u.defId] ??= { battles: 0, wins: 0, deaths: 0, damage: 0 });
          t.battles++;
          if (r.winner === u.side) t.wins++;
          if (!u.alive) t.deaths++;
          t.damage += u.damage;
        }
        if (r.kind === 'neutral') {
          sum.neutralFights++;
          if (r.winner !== r.attacker) sum.neutralWipes++;
        }
      }
    }
    if (s.phase !== 'over') sum.diag.stuck++;
    const winner = s.winner ?? 'none';
    if (winner === 'dawn') sum.dawnWins++;
    const reason = s.endReason ?? 'niedokończona';
    sum.reasons[reason] = (sum.reasons[reason] ?? 0) + 1;
    sum.avgRounds += s.round / games;
    sum.battlesPerGame += s.stats.battles / games;
    for (const seat of setup.seats) {
      const t = (sum.heroGames[seat.heroId] ??= { games: 0, wins: 0 });
      t.games++;
      if (winner === seat.faction) t.wins++;
    }
  }
  return sum;
}

/** The state after `actions`, played from the start. */
export function replay(setup: SetupOptions, actions: Action[]): GameState {
  const s = createGame(setup);
  for (const a of actions) applyActionInPlace(s, a);
  return s;
}

/** Looks for bots wasting turns or activations. */
function inspect(s: GameState, a: ReturnType<typeof chooseAction>, d: Diagnostics) {
  if (!a) return;
  const who = currentActor(s);
  if (who.kind === 'human' || who.kind === 'none') return;
  if (s.phase === 'adventure' && a.type === 'endTurn') {
    d.turns++;
    const hero = activeHero(s);
    const fresh = s.movePoints === s.rules.heroMovePoints && !s.turnBattleDone;
    if (hero && fresh && !s.tiles[hero.pos].tree && legalHeroMoves(s).length) d.idleTurns++;
  }
  if (s.phase === 'battle' && s.battle?.stage === 'fight' && a.type === 'endActivation') {
    const act = s.battle.activation!;
    d.activations++;
    if (!act.acted && !act.hop) d.idleActivations++;
  }
}

export function merge(a: Summary, b: Summary): Summary {
  const out: Summary = JSON.parse(JSON.stringify(a));
  const n = a.games + b.games;
  out.games = n;
  out.dawnWins += b.dawnWins;
  for (const [k, v] of Object.entries(b.reasons)) out.reasons[k] = (out.reasons[k] ?? 0) + v;
  out.avgRounds = (a.avgRounds * a.games + b.avgRounds * b.games) / n;
  out.battlesPerGame = (a.battlesPerGame * a.games + b.battlesPerGame * b.games) / n;
  out.neutralFights += b.neutralFights;
  out.neutralWipes += b.neutralWipes;
  for (const k of Object.keys(out.diag) as Array<keyof Diagnostics>) {
    if (k === 'illegalSamples') out.diag.illegalSamples = [...a.diag.illegalSamples, ...b.diag.illegalSamples].slice(0, 5);
    else (out.diag[k] as number) += b.diag[k] as number;
  }
  for (const book of ['units', 'guardianUnits'] as const) {
    for (const [id, t] of Object.entries(b[book])) {
      const o = (out[book][id] ??= { battles: 0, wins: 0, deaths: 0, damage: 0 });
      o.battles += t.battles;
      o.wins += t.wins;
      o.deaths += t.deaths;
      o.damage += t.damage;
    }
  }
  for (const [id, t] of Object.entries(b.heroGames)) {
    const o = (out.heroGames[id] ??= { games: 0, wins: 0 });
    o.games += t.games;
    o.wins += t.wins;
  }
  return out;
}
