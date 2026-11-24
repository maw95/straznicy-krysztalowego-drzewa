// The digital map generator (backlog 75): neutral settlements on every table, a sawmill and an ore mine near every start, fewer impassable hexes.
import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/game';
import { FACTION_HEROES, type MapSize } from '../src/engine/data';
import { distance, parseKey } from '../src/engine/hex';
import { tileCost } from '../src/engine/map';
import { assignSlots } from '../src/engine/teams';
import { DEFAULT_RULES } from '../src/engine/types';

const game = (races: string[], mapSize: MapSize, seed: number) => {
  const slots = assignSlots(races as never);
  return createGame({
    mode: 'pvp', mapSize, battleMode: 'arena', seed, mapShape: 'rectangle',
    seats: races.map((race, i) => ({ name: race + i, faction: slots[i], race: race as never, controller: 'bot' as const, heroId: (FACTION_HEROES as Record<string, string[]>)[race][0] })),
    rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, objective: 'control' },
  });
};

describe('map generator', () => {
  it('puts neutral settlements on every table and map, on every seed (an island in the terrain no longer forbids them all)', () => {
    for (const races of [['dawn', 'horde'], ['dawn', 'horde', 'herds'], ['dawn', 'horde', 'herds', 'clans']]) {
      for (const size of ['huge', 'giant'] as const) {
        for (let seed = 1; seed <= 10; seed++) {
          const s = game(races, size, seed);
          const neutral = Object.values(s.kingdom!.settlements).filter((x) => x.id.startsWith('set'));
          expect(neutral.length, `${races.length} sides ${size} seed ${seed}`).toBeGreaterThanOrEqual(races.length * 2);
        }
      }
    }
  });

  it('gives every side a sawmill and an ore mine near its starting settlement', () => {
    for (const races of [['dawn', 'horde'], ['dawn', 'horde', 'herds', 'clans']]) {
      for (const size of ['veryLong', 'huge', 'giant'] as const) {
        for (let seed = 1; seed <= 8; seed++) {
          const s = game(races, size, seed);
          for (const home of Object.values(s.tiles).filter((t) => t.home)) {
            for (const res of ['wood', 'ore']) {
              const near = Object.entries(s.kingdom!.mines).filter(([, m]) => m.res === res).map(([k]) => distance(parseKey(k), parseKey(home.key)));
              expect(Math.min(...near), `${home.home} ${res} ${size} seed ${seed}`).toBeLessThanOrEqual(10); // usually 2-4: on a walled-in start the nearest free hex of its own land may lie farther
            }
          }
        }
      }
    }
  });

  it('has fewer impassable hexes in the digital game than in the board game', () => {
    let digital = 0, board = 0, total = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const slots = assignSlots(['dawn', 'horde'] as never);
      const mk = (ruleset?: 'digital') => createGame({ mode: 'pvp', mapSize: 'medium', battleMode: 'arena', seed, seats: ['dawn', 'horde'].map((race, i) => ({ name: race, faction: slots[i], race: race as never, controller: 'bot' as const, heroId: (FACTION_HEROES as Record<string, string[]>)[race][0] })), rules: { ...DEFAULT_RULES, ...(ruleset ? { ruleset } : {}) } });
      const d = mk('digital'), b = mk();
      digital += Object.values(d.tiles).filter((t) => tileCost(t) === null).length;
      board += Object.values(b.tiles).filter((t) => tileCost(t) === null).length;
      total += Object.keys(d.tiles).length;
    }
    expect(digital).toBeLessThan(board);
    expect(digital / total).toBeLessThan(0.22);
  });
});
