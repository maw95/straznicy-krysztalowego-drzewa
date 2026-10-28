// Golden games: bots play fixed seeds in every variant, and a hash of the final state and of the
// action list is compared with the snapshot. Any change in rules or bot behaviour shows up here, so
// refactors that must not change the game are checked by running this file unchanged. When a change
// is meant to alter the games, update the snapshot (npx vitest run tests/golden.test.ts -u) and say
// so in the commit message.

import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { FACTION_HEROES, type FactionId, type MapSize } from '../src/engine/data';
import { applyAction, applyActionInPlace, createGame } from '../src/engine/game';
import { arenaSetup, DEFAULT_RULES, levelSettings, type Action, type GameState, type Level, type RulesConfig, type SeatSetup, type SetupOptions } from '../src/engine/types';

type Table = 'coop1' | 'coop2' | 'pvp1' | 'pvp2';

/** Seats for a table; heroes rotate with the seed so every hero plays. */
function seats(table: Table, seed: number): SeatSetup[] {
  const hero = (f: FactionId, i: number) => FACTION_HEROES[f][(seed + i) % 3];
  const seat = (name: string, faction: FactionId, i: number): SeatSetup => ({ name, faction, controller: 'bot', heroId: hero(faction, i) });
  if (table === 'coop1') return [seat('A', 'dawn', 0)];
  if (table === 'coop2') return [seat('A', 'dawn', 0), seat('B', 'dawn', 1)];
  if (table === 'pvp1') return [seat('A', 'dawn', 0), seat('B', 'horde', 0)];
  return [seat('A', 'dawn', 0), seat('B', 'horde', 0), seat('C', 'dawn', 1), seat('D', 'horde', 1)];
}

function levelGame(table: Table, size: MapSize, level: Level, seed: number, rules: Partial<RulesConfig> = {}): SetupOptions {
  const mode = table.startsWith('coop') ? 'coop' : 'pvp';
  const l = levelSettings(level, mode);
  return { mode, mapSize: size, seed, seats: seats(table, seed), battleMode: l.battleMode, rules: { ...l.rules, ...rules } };
}

function arenaGame(level: Level, seed: number, rules: Partial<RulesConfig> = {}): SetupOptions {
  const s = arenaSetup(seats('pvp1', seed), seed, level);
  return { ...s, rules: { ...s.rules, ...rules } };
}

const CASES: Array<[string, (seed: number) => SetupOptions, number[]]> = [
  ['coop1 normal short', (s) => levelGame('coop1', 'short', 'normal', s), [1, 2, 3, 4, 5, 6]],
  ['coop2 normal medium', (s) => levelGame('coop2', 'medium', 'normal', s), [1, 2, 3, 4]],
  ['coop1 normal veryLong', (s) => levelGame('coop1', 'veryLong', 'normal', s), [1, 2]],
  ['coop1 hard short', (s) => levelGame('coop1', 'short', 'hard', s), [1, 2, 3, 4]],
  ['coop2 hard long', (s) => levelGame('coop2', 'long', 'hard', s), [1, 2]],
  ['coop1 easy short', (s) => levelGame('coop1', 'short', 'kids', s), [1, 2, 3]],
  ['coop2 easy medium', (s) => levelGame('coop2', 'medium', 'kids', s), [1]],
  ['coop1 dice short', (s) => levelGame('coop1', 'short', 'normal', s, { useDice: true }), [1, 2, 3]],
  ['coop1 no abilities short', (s) => levelGame('coop1', 'short', 'normal', s, { abilities: false }), [1, 2]],
  ['coop1 elixirs only short', (s) => levelGame('coop1', 'short', 'normal', s, { treasures: false }), [1, 2]],
  ['coop1 replacement medium', (s) => levelGame('coop1', 'medium', 'normal', s, { heroReplacement: true }), [1, 2]],
  ['pvp1 normal short', (s) => levelGame('pvp1', 'short', 'normal', s), [1, 2, 3, 4, 5]],
  ['pvp1 normal long', (s) => levelGame('pvp1', 'long', 'normal', s), [1, 2]],
  ['pvp1 dice medium', (s) => levelGame('pvp1', 'medium', 'normal', s, { useDice: true }), [1, 2]],
  ['pvp1 easy short', (s) => levelGame('pvp1', 'short', 'kids', s), [1, 2]],
  ['pvp1 board duels with dice short', (s) => ({ ...levelGame('pvp1', 'short', 'normal', s, { useDice: true }), battleMode: 'board' }), [1, 2]],
  ['pvp2 normal medium', (s) => levelGame('pvp2', 'medium', 'normal', s), [1, 2, 3]],
  ['pvp2 easy medium', (s) => levelGame('pvp2', 'medium', 'kids', s), [1, 2]],
  ['pvp2 normal veryLong', (s) => levelGame('pvp2', 'veryLong', 'normal', s), [1, 2]],
  ['arena easy', (s) => arenaGame('kids', s), [1, 2, 3]],
  ['arena normal', (s) => arenaGame('normal', s), [1, 2, 3]],
  ['arena hard', (s) => arenaGame('hard', s), [1, 2, 3]],
  ['arena dice', (s) => arenaGame('normal', s, { useDice: true }), [1, 2]],
];

/**
 * Plays one bot game; an action the engine rejects is recorded and replaced by ending the turn or
 * activation. `apply` is applyAction (a new state per action, as the screen plays) unless given.
 */
function play(setup: SetupOptions, apply: (s: GameState, a: Action) => GameState = applyAction): { state: GameState; actions: Array<Action | string> } {
  let s = createGame(setup);
  const actions: Array<Action | string> = [];
  for (let i = 0; i < 30000 && s.phase !== 'over'; i++) {
    const a = chooseAction(s);
    if (!a) break;
    actions.push(a);
    try {
      s = apply(s, a);
    } catch (e) {
      actions.push(`illegal: ${(e as Error).message}`);
      s = applyAction(s, s.phase === 'battle' ? { type: 'endActivation' } : { type: 'endTurn' });
    }
  }
  return { state: s, actions };
}

const hash = (x: unknown) => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);

describe('golden bot games', () => {
  it.each(CASES)('%s', (_name, make, seeds) => {
    const out = seeds.map((seed) => {
      const { state, actions } = play(make(seed));
      return `seed ${seed}: ${state.winner ?? 'none'} round ${state.round} actions ${state.actionCount} state ${hash(state)} actions ${hash(actions)}`;
    });
    expect(out).toMatchSnapshot();
  });

  it('plays the same games when actions change the state in place', () => {
    for (const [, make, seeds] of CASES.filter(([name]) => /coop1 normal short|pvp2 normal medium|arena normal|coop1 easy/.test(name))) {
      for (const seed of seeds) {
        const a = play(make(seed));
        const b = play(make(seed), applyActionInPlace);
        expect(hash(b.state)).toBe(hash(a.state));
        expect(hash(b.actions)).toBe(hash(a.actions));
      }
    }
  });

  it('starts from the default rules', () => {
    // Guards the snapshot's meaning: the cases above are built on these defaults.
    expect(DEFAULT_RULES).toMatchSnapshot();
  });
});
