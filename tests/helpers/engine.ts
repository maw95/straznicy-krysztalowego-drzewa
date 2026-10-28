// Shared set-ups for the engine tests: a game setup, a battle placed by hand, bots playing on.

import { chooseAction } from '../../src/engine/ai';
import { arenaCell, makeBattleUnit } from '../../src/engine/battle';
import type { Side } from '../../src/engine/data';
import { applyActionInPlace } from '../../src/engine/game';
import { DEFAULT_RULES, type Activation, type BattleState, type GameState, type RulesConfig, type SetupOptions } from '../../src/engine/types';

/** A short coop game for one Przymierze bot (the Golden Dragon), seed 7, default rules with `rules` on top. */
export const setup = (over: Partial<SetupOptions> = {}, rules: Partial<RulesConfig> = {}): SetupOptions => ({
  mode: 'coop',
  mapSize: 'short',
  battleMode: 'arena',
  seed: 7,
  seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }],
  ...over,
  rules: { ...DEFAULT_RULES, ...over.rules, ...rules },
});

/** Two Przymierze and two Horde seats, all bots, for PvP set-ups. */
export const pvpSeats = (...heroes: string[]): SetupOptions['seats'] =>
  heroes.map((heroId, i) => ({ name: String.fromCharCode(65 + i), faction: i % 2 ? 'horde' : 'dawn', controller: 'bot', heroId }));

/** A fresh activation of `unitId`: nothing done yet. */
export const activation = (unitId: string): Activation => ({ unitId, moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0 });

export interface FixtureUnit {
  id: string;
  side: Side;
  /** Arena cell as (column, half-row). */
  col: number;
  half: number;
  /** Życie, when not full. */
  hp?: number;
}

/**
 * Puts `state` in a battle on the arena with the listed units, the first one to act, and no
 * obstacles. `battle` overrides the rest (by default Przymierze attacks the Horde).
 */
export function battleFixture(state: GameState, units: FixtureUnit[], battle: Partial<BattleState> = {}): GameState {
  const all: BattleState['units'] = {};
  for (const { id, side, col, half, hp } of units) {
    const u = makeBattleUnit(id, side);
    u.pos = arenaCell(col, half);
    if (hp) u.hp = hp;
    all[id] = u;
  }
  const first = units[0].id;
  const mapHex = Object.keys(state.tiles)[0];
  state.phase = 'battle';
  state.battle = {
    kind: 'heroes', duel: false, mapHex, arena: 'dawn', attacker: 'dawn', defender: 'horde', attackerHero: first, attackerFrom: mapHex, defenderHero: null, neutralId: null,
    stage: 'fight', needsDeploy: [], needsSelection: [], obstacles: [], units: all, round: 1, order: units.map((u) => u.id), index: 0,
    activation: activation(first), extra: [], winner: null, damageBy: {},
    ...battle,
  };
  return state;
}

/**
 * Bots play on from (a copy of) `start` until `stop` holds, the game is over or `max` actions are
 * played, and the state reached is returned.
 */
export function playUntil(start: GameState, stop: (s: GameState) => boolean = () => false, max = 20000): GameState {
  const s = structuredClone(start);
  for (let i = 0; i < max && s.phase !== 'over' && !stop(s); i++) applyActionInPlace(s, chooseAction(s)!);
  return s;
}

/** Bots play the game to its end (or `max` actions). */
export const playOut = (start: GameState, max = 20000) => playUntil(start, undefined, max);
