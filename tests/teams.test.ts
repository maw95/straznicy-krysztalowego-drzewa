import { describe, expect, it } from 'vitest';
import { ALL_TEAM_IDS, raceOf, TEAM_IDS, rivalOf } from '../src/engine/teams';
import { generateMap, MAX_START_ZONES, splitZones } from '../src/engine/map';
import { distance, key, parseKey, type HexKey } from '../src/engine/hex';
import { Rng } from '../src/engine/rng';
import { FACTION_HEROES } from '../src/engine/data';

describe('sides and factions', () => {
  it('the first two sides are the first two factions', () => {
    expect(TEAM_IDS).toEqual(['dawn', 'horde']);
    const state = { setup: {} };
    for (const t of TEAM_IDS) expect(raceOf(state, t)).toBe(t);
    expect(rivalOf('dawn')).toBe('horde');
    expect(rivalOf('horde')).toBe('dawn');
  });

  it('every side has the data of a faction (the placeholders of the next factions read the first two)', () => {
    for (const t of ALL_TEAM_IDS) expect(FACTION_HEROES[raceOf(null, t)].length).toBeGreaterThan(0);
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

  it('generated maps of every shape and size split into zones of equal size (at most one hex apart), each holding its base', () => {
    for (const shape of ['rectangle', 'ring', 'islands'] as const) {
      for (const size of ['short', 'medium', 'long'] as const) {
        const m = generateMap(size, new Rng(7), 6, 2, shape);
        const count = { dawn: 0, horde: 0 } as Record<string, number>;
        for (const t of Object.values(m.tiles)) count[t.side]++;
        expect(Math.abs(count.dawn - count.horde), `${shape} ${size}`).toBeLessThanOrEqual(1);
        expect(m.tiles[m.homes.dawn].side).toBe('dawn');
        expect(m.tiles[m.homes.horde].side).toBe('horde');
      }
    }
  });

  for (const n of [3, 4]) {
    it(`rectangle maps for ${n} sides: zones of equal size and bases as far apart as possible, at every size`, () => {
      const teams = (['dawn', 'horde', 'third', 'fourth'] as const).slice(0, n);
      for (const size of ['short', 'medium', 'long', 'veryLong'] as const) {
        if (n === 4 && size === 'short') continue; // too small for four bases (it never generated)
        const m = generateMap(size, new Rng(3), 10, 3, 'rectangle', undefined, { teams });
        const count: Record<string, number> = {};
        for (const t of Object.values(m.tiles)) count[t.side] = (count[t.side] ?? 0) + 1;
        const sizes = teams.map((t) => count[t]);
        expect(Math.max(...sizes) - Math.min(...sizes), `${size}: ${sizes}`).toBeLessThanOrEqual(1);
        for (const t of teams) expect(m.tiles[m.homes[t]].side).toBe(t);
        const far = Math.min(...teams.flatMap((a, i) => teams.slice(i + 1).map((b) => distance(parseKey(m.homes[a]), parseKey(m.homes[b])))));
        // No other choice of edge hexes spreads the bases further apart: the old layout (left, right, top, bottom) was never better.
        const cells = Object.values(m.tiles).map((t) => parseKey(t.key)).filter((h) => distance(h, parseKey(m.tree)) > 2);
        const best = (k: number, from: number, chosen: typeof cells): number => (k === 0 ? Math.min(...chosen.flatMap((a, i) => chosen.slice(i + 1).map((b) => distance(a, b)))) : Math.max(...cells.slice(from).map((c, i) => best(k - 1, from + i + 1, [...chosen, c]))));
        if (n === 3 && size === 'short') expect(far).toBe(best(3, 0, []));
        expect(far).toBeGreaterThanOrEqual(Math.floor(m.rows / 2));
      }
    });
  }

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
