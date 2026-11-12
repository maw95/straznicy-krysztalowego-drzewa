// Digital ruleset: the wide arena (pointy-topped hexes in rows, 13 × 9).
import { describe, expect, it } from 'vitest';
import { WIDE_OBSTACLES, arenaObstacles, battleMove, deployCells, layoutCells, makeBattleUnit, reachableCells, tailOptions, wideCell, wideCellOf, type ArenaId } from '../src/engine/battle';
import { applyActionInPlace, createGame } from '../src/engine/game';
import { chooseAction } from '../src/engine/ai';
import { distance, neighborKeys, parseKey, type HexKey } from '../src/engine/hex';
import { arenaSetup, type GameState, type SeatSetup } from '../src/engine/types';
import { battleFixture, setup } from './helpers/engine';

const wide = (units: Parameters<typeof battleFixture>[1], battle: Parameters<typeof battleFixture>[2] = {}): GameState => {
  const s = createGame(setup({}, { ruleset: 'digital' }));
  // The fixture lays units out by (col, half); put them on wide cells instead.
  battleFixture(s, units, { layout: 'wide', ...battle });
  for (const u of Object.values(s.battle!.units)) {
    const f = units.find((x) => x.id === u.id)!;
    u.pos = wideCell(f.col, f.half);
  }
  return s;
};

describe('wide arena', () => {
  it('has 13 columns × 9 rows, odd rows shifted half a cell right', () => {
    const b = { layout: 'wide' as const };
    expect(layoutCells(b)).toHaveLength(117);
    expect(wideCellOf(wideCell(5, 3))).toEqual({ col: 5, row: 3 });
    // A cell in an even row touches its row neighbours and two cells in each of the rows above and below.
    const c = parseKey(wideCell(5, 4));
    expect(neighborKeys(wideCell(5, 4)).filter((k) => layoutCells(b).includes(k))).toHaveLength(6);
    expect(neighborKeys(wideCell(5, 4))).toContain(wideCell(6, 4));
    expect(distance(c, parseKey(wideCell(6, 4)))).toBe(1);
  });

  it.each(['dawn', 'horde'] as ArenaId[])('%s arena: obstacles leave both start columns and the columns by them free, and every free cell reachable', (arena) => {
    const obstacles = new Set(arenaObstacles(arena, 'wide'));
    const b = { layout: 'wide' as const, obstacles: [...obstacles], attacker: 'dawn' as const };
    for (const k of obstacles) expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).toContain(wideCellOf(k).col);
    for (const col of [0, 1, 11, 12]) for (let row = 0; row < 9; row++) expect(obstacles.has(wideCell(col, row))).toBe(false);
    expect(deployCells(b as never, 'dawn')).toHaveLength(9);
    const free = layoutCells(b).filter((k) => !obstacles.has(k));
    const seen = new Set<HexKey>([free[0]]);
    const queue = [free[0]];
    for (let i = 0; i < queue.length; i++) for (const n of neighborKeys(queue[i])) if (!seen.has(n) && free.includes(n)) (seen.add(n), queue.push(n));
    expect(seen.size).toBe(free.length);
  });

  it('a large unit lies in one row: the tail on the side it already lies on, the other side is the turn', () => {
    const s = wide([{ id: 'goldDragon', side: 'dawn', col: 5, half: 4 }, { id: 'werewolfLord', side: 'horde', col: 10, half: 4 }]);
    const d = s.battle!.units.goldDragon;
    d.tail = wideCell(4, 4);
    const b = s.battle!;
    // Moving right trails the tail on the left; the second option turns the dragon around.
    expect(tailOptions(b, d, wideCell(8, 2))).toEqual([wideCell(7, 2), wideCell(9, 2)]);
    battleMove(s, wideCell(8, 2));
    expect([d.pos, d.tail]).toEqual([wideCell(8, 2), wideCell(7, 2)]);
    // Moving left turns it.
    const t = wide([{ id: 'goldDragon', side: 'dawn', col: 5, half: 4 }, { id: 'werewolfLord', side: 'horde', col: 10, half: 4 }]);
    t.battle!.units.goldDragon.tail = wideCell(4, 4);
    battleMove(t, wideCell(2, 4));
    expect(t.battle!.units.goldDragon.tail).toBe(wideCell(3, 4));
  });

  it('needs room in the row for the tail', () => {
    const s = wide([{ id: 'goldDragon', side: 'dawn', col: 5, half: 4 }, { id: 'werewolfLord', side: 'horde', col: 10, half: 4 }]);
    const d = s.battle!.units.goldDragon;
    d.tail = wideCell(4, 4);
    // Both neighbours of (8,2) are walls: the dragon cannot land there.
    s.battle!.obstacles = [wideCell(7, 2), wideCell(9, 2)];
    expect(reachableCells(s, d).has(wideCell(8, 2))).toBe(false);
    expect(reachableCells(s, d).has(wideCell(8, 3))).toBe(true);
  });

  it('a walker of two cells does not squeeze through a gap of one cell in a wall', () => {
    const s = wide([{ id: 'unicornKing', side: 'dawn', col: 8, half: 4 }, { id: 'werewolfLord', side: 'horde', col: 12, half: 8 }]);
    const u = s.battle!.units.unicornKing;
    u.tail = wideCell(7, 4);
    // Row 2 is a wall with one gap, (8,2), the only way north; the neighbours of the gap in its row are walls, so the tail has no room there.
    s.battle!.obstacles = Array.from({ length: 13 }, (_, c) => c).filter((c) => c !== 8).map((c) => wideCell(c, 2));
    expect([...reachableCells(s, u).keys()].some((k) => wideCellOf(k).row < 2)).toBe(false);
  });

  void makeBattleUnit;
});

const seats = (hero: string, horde = 'werewolfLord'): SeatSetup[] => [
  { name: 'A', faction: 'dawn', controller: 'bot', heroId: hero },
  { name: 'B', faction: 'horde', controller: 'bot', heroId: horde },
];

describe('wide arena obstacles', () => {
  it.each(['dawn', 'horde'] as ArenaId[])('%s: the two cells of an obstacle are neighbours, no cell is used twice, no picture repeats', (arena) => {
    const used = new Set<HexKey>();
    const arts = new Set<string>();
    for (const g of WIDE_OBSTACLES[arena]) {
      const cells = g.cells.map(([c, r]) => wideCell(c, r));
      if (cells.length === 2) expect(distance(parseKey(cells[0]), parseKey(cells[1]))).toBe(1);
      for (const k of cells) (expect(used.has(k)).toBe(false), used.add(k));
      expect(arts.has(g.art)).toBe(false);
      arts.add(g.art);
    }
  });

  it('some two-cell obstacles lie on a slant (across two rows)', () => {
    for (const arena of ['dawn', 'horde'] as ArenaId[]) {
      const slanted = WIDE_OBSTACLES[arena].filter((g) => g.cells.length === 2 && g.cells[0][1] !== g.cells[1][1]);
      expect(slanted.length).toBeGreaterThan(0);
    }
  });
});

describe('bots with several large units', () => {
  it('play whole battles when both sides field a large hero, without sharing cells', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const o = arenaSetup(seats('ancientBear', 'blackDragon'), seed);
      // The Black Dragon is made large too, so the battle has two large units besides the supports.
      const s = createGame({ ...o, rules: { ...o.rules, ruleset: 'digital' } });
      let steps = 0;
      while (s.phase !== 'over' && steps++ < 6000) {
        applyActionInPlace(s, chooseAction(s)!);
        const seen = new Set<HexKey>();
        for (const u of Object.values(s.battle?.units ?? {})) {
          if (!u.alive) continue;
          for (const c of [u.pos, u.tail]) if (c) (expect(seen.has(c)).toBe(false), seen.add(c));
        }
      }
      expect(s.phase).toBe('over');
    }
  });
});

describe('bots on the wide arena', () => {
  it.each(['goldDragon', 'unicornKing', 'ancientBear', 'braveDuck'])('play whole digital battles with %s without sharing cells', (hero) => {
    for (let seed = 1; seed <= 6; seed++) {
      const o = arenaSetup(seats(hero), seed);
      const s = createGame({ ...o, rules: { ...o.rules, ruleset: 'digital' } });
      let steps = 0;
      while (s.phase !== 'over' && steps++ < 6000) {
        applyActionInPlace(s, chooseAction(s)!);
        const seen = new Set<HexKey>();
        for (const u of Object.values(s.battle?.units ?? {})) {
          if (!u.alive) continue;
          for (const c of [u.pos, u.tail]) if (c) (expect(seen.has(c)).toBe(false), seen.add(c));
        }
      }
      expect(s.phase).toBe('over');
    }
  });
});
