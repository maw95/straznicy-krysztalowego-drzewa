// Up to six players: three Przymierze and three Horde heroes in rivalry, three heroes in coop; bots play such games to the end.

import { describe, expect, it } from 'vitest';
import { crystalsFor, createGame } from '../src/engine/game';
import { FACTION_HEROES } from '../src/engine/data';
import { playOut, setup } from './helpers/engine';
import type { SetupOptions } from '../src/engine/types';

const seat = (faction: 'dawn' | 'horde', heroId: string, i: number) => ({ name: `G${i}`, faction, controller: 'bot' as const, heroId });
const three = [...FACTION_HEROES.dawn.map((h, i) => seat('dawn', h, i)), ...FACTION_HEROES.horde.map((h, i) => seat('horde', h, i + 3))];
const interleaved = [0, 3, 1, 4, 2, 5].map((i) => three[i]);

describe('up to six players', () => {
  it('crystals: 2 for one Przymierze hero, 3 for two or three', () => {
    const n = (k: number) => crystalsFor(setup({ seats: three.slice(0, k) }));
    expect([n(1), n(2), n(3)]).toEqual([2, 3, 3]);
  });

  it('a rivalry of three against three plays to the end on every board size', () => {
    for (const mapSize of ['short', 'medium', 'long'] as SetupOptions['mapSize'][]) {
      for (const seed of [1, 2]) {
        const s = playOut(createGame(setup({ mode: 'pvp', mapSize, seed, seats: interleaved })), 30000);
        expect(s.phase).toBe('over');
      }
    }
  });

  it('a coop of three Przymierze heroes plays to the end', () => {
    for (const seed of [1, 2, 3]) {
      const s = playOut(createGame(setup({ mode: 'coop', seed, seats: three.slice(0, 3) })), 30000);
      expect(s.phase).toBe('over');
    }
  });
});
