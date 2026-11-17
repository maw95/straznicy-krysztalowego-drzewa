import { describe, expect, it } from 'vitest';
import { raceOf, TEAM_IDS, rivalOf } from '../src/engine/teams';
import { generateMap, MAX_START_ZONES, splitZones } from '../src/engine/map';
import { distance, key, parseKey, type HexKey } from '../src/engine/hex';
import { Rng } from '../src/engine/rng';
import { FACTION_HEROES } from '../src/engine/data';

describe('teams and races', () => {
  it('two teams, each plays the race of the same id', () => {
    expect(TEAM_IDS).toEqual(['dawn', 'horde']);
    const state = { setup: {} };
    for (const t of TEAM_IDS) expect(raceOf(state, t)).toBe(t);
    expect(rivalOf('dawn')).toBe('horde');
    expect(rivalOf('horde')).toBe('dawn');
  });

  it('raceOf reads the race assigned to a team in the setup', () => {
    expect(raceOf({ setup: { races: { horde: 'dawn' } } }, 'horde')).toBe('dawn');
    expect(raceOf({ setup: { races: { horde: 'dawn' } } }, 'dawn')).toBe('dawn');
    for (const t of TEAM_IDS) expect(FACTION_HEROES[raceOf({ setup: {} }, t)].length).toBeGreaterThan(0);
  });
});

const grid = (w: number, h: number) => {
  const cells: Array<{ row: number; col: number; hex: { q: number; r: number } }> = [];
  for (let row = 0; row < h; row++) for (let col = 0; col < w; col++) cells.push({ row, col, hex: { q: col - Math.floor(row / 2), r: row } });
  return cells;
};

describe('splitZones', () => {
  it('with two starts equals the old nearest-home rule with the parity tie-break', () => {
    const cells = grid(11, 9);
    const starts = [key(cells[0].hex), key(cells[cells.length - 1].hex)];
    const old = cells.map(({ row, col, hex }) => {
      const a = distance(hex, parseKey(starts[0]));
      const b = distance(hex, parseKey(starts[1]));
      return a < b ? 0 : a > b ? 1 : (row + col) % 2 === 0 ? 0 : 1;
    });
    expect(splitZones(cells, starts)).toEqual(old);
  });

  it('generated maps of the non-triangle shapes keep the old two-zone sides', () => {
    for (const shape of ['rectangle', 'ring'] as const) {
      const m = generateMap('short', new Rng(7), 6, 2, shape);
      const [d, h] = [parseKey(m.homes.dawn), parseKey(m.homes.horde)];
      for (const t of Object.values(m.tiles)) {
        const hex = parseKey(t.key);
        const a = distance(hex, d);
        const b = distance(hex, h);
        expect(t.side).toBe(a < b ? 'dawn' : a > b ? 'horde' : (t.row + t.col) % 2 === 0 ? 'dawn' : 'horde');
      }
    }
  });

  for (const n of [3, 4]) {
    it(`${n} zones: disjoint, cover the map, each holds its start`, () => {
      const cells = grid(13, 11);
      const picks = [cells[0], cells[12], cells[cells.length - 1], cells[cells.length - 13]].slice(0, n);
      const starts: HexKey[] = picks.map((c) => key(c.hex));
      const zones = splitZones(cells, starts);
      expect(zones).toHaveLength(cells.length);
      starts.forEach((k, i) => expect(zones[cells.findIndex((c) => key(c.hex) === k)]).toBe(i));
      for (let i = 0; i < n; i++) expect(zones.filter((z) => z === i).length).toBeGreaterThan(cells.length / (n * 3));
      expect(zones.every((z) => z >= 0 && z < n)).toBe(true);
    });
  }

  it('refuses more zones than MAX_START_ZONES', () => {
    const cells = grid(4, 4);
    expect(() => splitZones(cells, Array(MAX_START_ZONES + 1).fill(key(cells[0].hex)))).toThrow();
  });
});

describe('bestTeam (round-limit winner)', () => {
  it('two teams: higher score wins, a tie is null', async () => {
    const { bestTeam } = await import('../src/engine/objectives');
    expect(bestTeam({ dawn: 2, horde: 1 })).toBe('dawn');
    expect(bestTeam({ dawn: 1, horde: 3 })).toBe('horde');
    expect(bestTeam({ dawn: 2, horde: 2 })).toBeNull();
    expect(bestTeam({ dawn: 0, horde: 0 })).toBeNull();
  });
  it('a single team in the list wins alone', async () => {
    const { bestTeam } = await import('../src/engine/objectives');
    expect(bestTeam({ dawn: 0, horde: 9 }, ['dawn'])).toBe('dawn');
  });
});
