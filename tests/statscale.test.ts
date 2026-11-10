import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/game';
import { makeBattleUnit, scaleOf } from '../src/engine/battle';
import { battleStats, STAT_SCALE, UNITS } from '../src/engine/data';
import { playOut, pvpSeats, setup } from './helpers/engine';

describe('stat scale (digital Expedition: Życie and Atak times 3)', () => {
  it('is on with hero growth and off without it', () => {
    expect(scaleOf(createGame(setup({}, { ruleset: 'digital', heroGrowth: true })))).toBe(STAT_SCALE);
    expect(scaleOf(createGame(setup({}, { ruleset: 'digital' })))).toBe(1);
    expect(scaleOf(createGame(setup({})))).toBe(1);
  });

  it('multiplies Życie and Atak but not speed', () => {
    const one = battleStats('goldDragon', true);
    const big = battleStats('goldDragon', true, 3);
    expect(big).toEqual({ hp: one.hp * 3, attack: one.attack * 3, speed: one.speed });
    const u = makeBattleUnit('nymph', 'dawn', true, 3);
    expect(u.hp).toBe(UNITS.nymph.hp * 3);
    expect(u.scale).toBe(3);
    expect(makeBattleUnit('nymph', 'dawn', true).scale).toBeUndefined();
  });

  // Every number is multiplied the same way, so a whole game must play out exactly as with the small numbers: same winner, same length, same fights.
  it.each(['crystals', 'control', 'survival', 'boss', 'artifact'] as const)('changes nothing about how games end (goal %s: ×3 equals ×1 over many bot games)', (objective) => {
    for (let seed = 1; seed <= 12; seed++) {
      const pvp = seed % 3 === 0 && objective !== 'survival';
      const mk = (statScale: number) => setup(pvp ? { mode: 'pvp', seats: pvpSeats('goldDragon', 'blackDragon') } : {}, { ruleset: 'digital', heroGrowth: true, objective, statScale });
      const a = playOut(createGame({ ...mk(1), seed }));
      const b = playOut(createGame({ ...mk(3), seed }));
      expect({ seed, phase: b.phase, winner: b.winner, round: b.round, stats: b.stats }).toEqual({ seed, phase: a.phase, winner: a.winner, round: a.round, stats: a.stats });
    }
  });
});
