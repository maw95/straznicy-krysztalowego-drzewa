import { describe, expect, it } from 'vitest';
import { makeBattleUnit, unitAttackBase, unitSpeed } from '../src/engine/battle';
import { battleStats, DIGITAL_STATS, UNITS } from '../src/engine/data';

describe('digital ruleset: own stats for the Przymierze heroes', () => {
  it('each hero has one trait: Dragon attack, Bear life, Unicorn speed', () => {
    const heroes = ['goldDragon', 'ancientBear', 'unicornKing'].map((id) => ({ id, ...battleStats(id, true) }));
    const best = (k: 'hp' | 'attack' | 'speed') => heroes.reduce((m, h) => (h[k] > m[k] ? h : m)).id;
    expect(best('attack')).toBe('goldDragon');
    expect(best('hp')).toBe('ancientBear');
    expect(best('speed')).toBe('unicornKing');
    // Nobody else matches the Bear's life or the Unicorn's speed, whoever it is.
    for (const k of ['hp', 'speed'] as const) expect(heroes.filter((h) => h[k] === Math.max(...heroes.map((x) => x[k]))).length).toBe(1);
  });

  it('a battle unit carries the stats of the ruleset it was made under; the board game keeps its own', () => {
    for (const id of Object.keys(DIGITAL_STATS)) {
      const d = makeBattleUnit(id, 'dawn', true);
      const c = makeBattleUnit(id, 'dawn');
      const want = battleStats(id, true);
      expect([d.maxHp, unitAttackBase(d), unitSpeed(d)]).toEqual([want.hp, want.attack, want.speed]);
      expect([c.maxHp, unitAttackBase(c), unitSpeed(c)]).toEqual([UNITS[id].hp, UNITS[id].attack, UNITS[id].speed]);
      expect(c.digital).toBeUndefined();
    }
  });
});
