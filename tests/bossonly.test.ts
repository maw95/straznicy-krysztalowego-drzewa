// Digital ruleset, goal 'boss' with `noHorde`: every player is on the Przymierze side, the Boss is the only enemy (backlog 10.7).
import { describe, expect, it } from 'vitest';
import type { SeatSetup } from '../src/engine/types';
import { createGame } from '../src/engine/game';
import { playOut, setup } from './helpers/engine';

const bossOnly = (seed: number, players = 1, mapSize: 'short' | 'medium' = 'short') =>
  createGame(
    setup(
      { seed, mapSize, seats: ([{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }, { name: 'B', faction: 'dawn', controller: 'bot', heroId: 'elfDruid' }] as SeatSetup[]).slice(0, players) },
      { ruleset: 'digital', objective: 'boss', heroGrowth: true, noHorde: true },
    ),
  );

describe('boss without the Horde', () => {
  it('has no Horde heroes', () => {
    const s = bossOnly(1, 2);
    expect(Object.values(s.heroes).filter((h) => h.faction === 'horde')).toHaveLength(0);
  });
  it('bots play every game to the end without errors', () => {
    [1, 2, 3, 4, 5, 6].forEach((seed) => {
      const end = playOut(bossOnly(seed, 1 + (seed % 2), seed > 3 ? 'medium' : 'short'));
      expect(end.phase).toBe('over');
    });
  });
});
