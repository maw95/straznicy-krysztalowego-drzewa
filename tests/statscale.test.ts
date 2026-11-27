import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/game';
import { makeBattleUnit, scaleOf } from '../src/engine/battle';
import { ABILITY, battleStats, STAT_SCALE } from '../src/engine/data';
import { ARTIFACTS } from '../src/engine/sites';
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
    expect(u.hp).toBe(battleStats('nymph', true, 1).hp * 3); // the digital faction bonus (factionBonus.ts) is part of the base
    expect(u.scale).toBe(3);
    expect(makeBattleUnit('nymph', 'dawn', true).scale).toBeUndefined();
  });

  // Every number is multiplied the same way, so a whole game must play out exactly as with the small numbers: same winner, same length, same fights.
  // The one exception by design is defence (shields, and the Stone Golem's rune skin: a blow takes at least 1, not 1 times the scale), so these games are
  // played without shields and without the rune skin.
  const shields = ARTIFACTS.filter((a) => a.slot === 'shield');
  const runeSkin = ABILITY.runeSkinIgnore;
  beforeAll(() => {
    shields.forEach((a) => ARTIFACTS.splice(ARTIFACTS.indexOf(a), 1));
    (ABILITY as { runeSkinIgnore: number }).runeSkinIgnore = 0;
  });
  afterAll(() => {
    ARTIFACTS.push(...shields);
    (ABILITY as { runeSkinIgnore: number }).runeSkinIgnore = runeSkin;
  });
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
