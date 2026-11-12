import { describe, expect, it } from 'vitest';
import { customSettings, defaultCustom, parseCustom } from '../src/engine/presets';

describe('custom table switches', () => {
  it('start from the level preset', () => {
    expect(defaultCustom('normal', 'coop')).toEqual({ growth: false, battleMode: 'arena', rules: { abilities: true, treasures: true, heroReplacement: false, useDice: false, extraEvilHero: false, initiativeTie: 'defender' } });
    expect(defaultCustom('kids', 'coop')).toMatchObject({ battleMode: 'board', rules: { abilities: false, heroReplacement: true } });
  });

  it('take the allowed switches and nothing else', () => {
    const ok = parseCustom({ growth: true, battleMode: 'board', rules: { useDice: true, initiativeTie: 'rotating', abilities: false } }, 'normal', 'coop');
    expect(ok).toEqual({ growth: true, battleMode: 'board', rules: { abilities: false, treasures: true, heroReplacement: false, useDice: true, extraEvilHero: false, initiativeTie: 'rotating' } });
    expect(typeof parseCustom({ rules: { battleRoundLimit: 1 } }, 'normal', 'coop')).toBe('string');
    expect(typeof parseCustom({ rules: { heroMovePoints: 99 } }, 'normal', 'coop')).toBe('string');
    expect(typeof parseCustom({ rules: { useDice: 'yes' } }, 'normal', 'coop')).toBe('string');
    expect(typeof parseCustom({ rules: { initiativeTie: 'chaos' } }, 'normal', 'coop')).toBe('string');
    expect(typeof parseCustom({ battleMode: 'duel' }, 'normal', 'coop')).toBe('string');
    expect(typeof parseCustom({ growth: 1 }, 'normal', 'coop')).toBe('string');
    expect(typeof parseCustom({ rules: [] }, 'normal', 'coop')).toBe('string');
  });

  it('keep the extra Horde hero for coop only', () => {
    expect((parseCustom({ rules: { extraEvilHero: true } }, 'normal', 'coop') as { rules: { extraEvilHero: boolean } }).rules.extraEvilHero).toBe(true);
    expect((parseCustom({ rules: { extraEvilHero: true } }, 'normal', 'pvp') as { rules: { extraEvilHero: boolean } }).rules.extraEvilHero).toBe(false);
  });

  it('build the rules the setup screen builds', () => {
    const c = parseCustom({ rules: { useDice: true, extraEvilHero: true } }, 'hard', 'coop');
    if (typeof c === 'string') throw new Error(c);
    const s = customSettings('hard', 'coop', c);
    expect(s.battleMode).toBe('arena');
    expect(s.rules).toMatchObject({ useDice: true, extraEvilHero: true, minEvilHeroes: 2, hordeRespawn: false });
  });
});
