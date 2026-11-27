// The wizard's blocks (src/engine/blocks.ts) must follow from the stored measurement (docs/balans_blokady.jsonl) and the author's threshold: every block is justified
// by the data, and the data asks for no block that is missing.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BLOCK_MARGIN, BLOCK_THRESHOLD, OPTION_BLOCKS, blockReason, optionAllowed, optionBlock, playersPerSide } from '../src/engine/blocks';
import type { SetupOptions } from '../src/engine/types';

interface Row { objective: string; map: string; shape: string; players: number; dawn: number }
const rows: Row[] = readFileSync('docs/balans_blokady.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const band = (o: string) => (o === 'crystals' || o === 'survival' ? [45, 55] : [45, 65]);
const off = (r: Row) => {
  const [lo, hi] = band(r.objective);
  return r.dawn > hi ? r.dawn - hi : r.dawn < lo ? lo - r.dawn : 0;
};

/** The combinations (goal, size, shape, players a side) whose most measured layers lie beyond the threshold, the uncertainty taken off. */
function measuredBlocks(): Set<string> {
  const cells = new Map<string, Row[]>();
  for (const r of rows) {
    const k = [r.objective, r.map, r.shape, r.players].join('|');
    cells.set(k, [...(cells.get(k) ?? []), r]);
  }
  return new Set([...cells].filter(([, rs]) => rs.filter((r) => off(r) - BLOCK_MARGIN > BLOCK_THRESHOLD).length * 2 > rs.length).map(([k]) => k));
}

describe('wizard blocks', () => {
  it('are exactly what the measurement asks for', () => {
    const listed = new Set(OPTION_BLOCKS.flatMap((b) => (b.players ? [b.players] : [1, 2]).map((p) => [b.objective, b.size, b.shape, p].join('|'))));
    expect([...listed].sort()).toEqual([...measuredBlocks()].sort());
  });

  it('give the measured win rate in the note', () => {
    for (const b of OPTION_BLOCKS) {
      const rs = rows.filter((r) => r.objective === b.objective && r.map === b.size && r.shape === b.shape && (!b.players || r.players === b.players));
      expect(Math.abs(rs.reduce((n, r) => n + r.dawn, 0) / rs.length - b.dawn), JSON.stringify(b)).toBeLessThan(1);
      expect(blockReason(b)[1]).toContain(`${b.dawn}%`);
    }
  });

  it('read the players a side from the seats', () => {
    const seat = (faction: 'dawn' | 'horde') => ({ name: 'x', faction, controller: 'bot' as const, heroId: 'goldDragon' });
    expect(playersPerSide({ mode: 'pvp', seats: [seat('dawn'), seat('horde')] })).toBe(1);
    expect(playersPerSide({ mode: 'pvp', seats: [seat('dawn'), seat('dawn'), seat('horde'), seat('horde')] })).toBe(2);
    expect(playersPerSide({ mode: 'pvp', seats: [seat('dawn'), seat('dawn'), seat('horde')] })).toBe(1);
    expect(playersPerSide({ mode: 'coop', seats: [seat('dawn'), seat('dawn')] })).toBe(2);
  });

  it('hold only the tables they name', () => {
    expect(optionBlock({ objective: 'conquest', size: 'short', shape: 'ring', perSide: 1 })).not.toBeNull();
    expect(optionBlock({ objective: 'conquest', size: 'short', shape: 'ring', perSide: 2 })).toBeNull();
    expect(optionBlock({ objective: 'conquest', size: 'short', shape: 'ring' })).toBeNull();
    expect(optionBlock({ objective: 'conquest', size: 'short', shape: 'ring' }, true)).not.toBeNull();
    expect(optionBlock({ objective: 'relic', size: 'giant', shape: 'islands', perSide: 3 })).not.toBeNull();
    expect(optionBlock({ objective: 'survival', size: 'short', shape: 'triangle' })).not.toBeNull();
    const seat = (faction: 'dawn' | 'horde') => ({ name: 'x', faction, controller: 'bot' as const, heroId: 'goldDragon' });
    const setup = (shape: SetupOptions['mapShape'], ruleset: 'digital' | 'board' = 'digital'): SetupOptions => ({ mode: 'pvp', mapSize: 'short', battleMode: 'arena', seed: 1, seats: [seat('dawn'), seat('horde')], rules: { ruleset, objective: 'survival' } as SetupOptions['rules'], ...(shape ? { mapShape: shape } : {}) });
    expect(optionAllowed(setup(undefined))).toBe(false);
    expect(optionAllowed(setup('rectangle'))).toBe(true);
    expect(optionAllowed(setup(undefined, 'board'))).toBe(true);
  });
});
