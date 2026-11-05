import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/game';
import { DIGITAL_TUNING, digitalRules } from '../src/engine/tuning';
import { pvpSeats, setup } from './helpers/engine';

const twoHeroes = [
  { name: 'A', faction: 'dawn' as const, controller: 'bot' as const, heroId: 'goldDragon' },
  { name: 'B', faction: 'dawn' as const, controller: 'bot' as const, heroId: 'ancientBear' },
];

describe('digital tuning levers', () => {
  it('never touch the board game: the classic rules are the very same object', () => {
    const s = setup({ mapSize: 'veryLong', seats: twoHeroes });
    expect(digitalRules(s)).toBe(s.rules);
    expect(createGame(s).rules).toBe(s.rules);
  });

  it('apply to the ready-made levels of the digital ruleset, on the game only (the setup keeps the preset)', () => {
    const s = setup({ mapSize: 'veryLong', seats: twoHeroes }, { ruleset: 'digital', objective: 'control' });
    const rules = createGame(s).rules;
    expect(rules.hordeStartTreasures?.random).toBe(3);
    expect(s.rules.hordeStartTreasures).toBeUndefined();
  });

  it('leave a custom level alone', () => {
    const s = setup({ mapSize: 'veryLong', seats: twoHeroes }, { ruleset: 'digital', objective: 'control', heroReplacement: true });
    expect(digitalRules(s)).toBe(s.rules);
  });

  it('are keyed to real levels, modes and maps', () => {
    for (const t of DIGITAL_TUNING) {
      expect(['crystals', 'control']).toContain(t.objective);
      expect(['kids', 'normal', 'hard']).toContain(t.level);
      for (const m of t.maps ?? []) expect(['short', 'medium', 'long', 'veryLong']).toContain(m);
    }
    // PvP has no Hard level.
    expect(DIGITAL_TUNING.some((t) => t.mode === 'pvp' && t.level === 'hard')).toBe(false);
    expect(pvpSeats('goldDragon', 'blackDragon')).toHaveLength(2);
  });
});
