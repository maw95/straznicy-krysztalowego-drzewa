import { describe, expect, it } from 'vitest';
import { createGame, killHero, withoutBonus } from '../src/engine/game';
import { battleStats, SURVIVAL } from '../src/engine/data';
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
      expect(['crystals', 'control', 'survival', 'boss', 'artifact', 'conquest', 'relic']).toContain(t.objective);
      // The entries of a map shape apply to every level.
      if (t.shape || t.growth) expect(['triangle', 'rectangle', 'ring', 'islands', 'custom', undefined]).toContain(t.shape);
      else expect(['zero', 'kids', 'normal', 'hard']).toContain(t.level);
      for (const m of t.maps ?? []) expect(['short', 'medium', 'long', 'veryLong', 'huge', 'giant']).toContain(m);
    }
    // PvP has no Hard level, except at the economy tables of the digital edition (levels 4-6: kingdom).
    expect(DIGITAL_TUNING.some((t) => t.mode === 'pvp' && t.level === 'hard' && !t.kingdom)).toBe(false);
    expect(pvpSeats('goldDragon', 'blackDragon')).toHaveLength(2);
  });
});

describe('digital tuning levers of the finer ladder', () => {
  const digital = (rules: Record<string, unknown>, over = {}) => setup({ mapSize: 'short', ...over }, { ruleset: 'digital', ...rules });

  it('survivalRoundsBonus shortens or lengthens the Survival goal (default: SURVIVAL.rounds)', () => {
    const base = createGame(digital({ objective: 'survival' })).survival!.rounds;
    expect(base).toBe(SURVIVAL.rounds.short);
    expect(createGame(digital({ objective: 'survival', survivalRoundsBonus: -2 })).survival!.rounds).toBe(base - 2);
    expect(createGame(digital({ objective: 'survival', survivalRoundsBonus: 3 })).survival!.rounds).toBe(base + 3);
    expect(createGame(digital({ objective: 'survival', survivalRoundsBonus: -99 })).survival!.rounds).toBe(1);
  });

  it('bossHpFactor scales the Boss life in fine steps (default: unchanged)', () => {
    const hp = (rules: Record<string, unknown>) => createGame(digital({ objective: 'boss', ...rules })).boss!.maxHp;
    const base = hp({});
    expect(hp({ bossHpFactor: 1 })).toBe(base);
    expect(hp({ bossHpFactor: 0.5 })).toBe(Math.round(base * 0.5));
    expect(hp({ bossHpFactor: 0.95 })).toBeLessThan(base);
    expect(hp({ bossHpFactor: 1.2 })).toBeGreaterThan(base);
  });

  it('dawnStartXp gives the Przymierza heroes experience and levels, never the Horde, never without growth', () => {
    const grown = (xp?: number) => createGame(digital({ objective: 'crystals', heroGrowth: true, ...(xp ? { dawnStartXp: xp } : {}) }, { mode: 'pvp', seats: pvpSeats('goldDragon', 'blackDragon') }));
    const plain = grown();
    expect(plain.heroes.goldDragon.xp ?? 0).toBe(0);
    const s = grown(8);
    expect(s.heroes.goldDragon.xp).toBe(8);
    expect(s.heroes.goldDragon.level).toBe(2);
    expect(s.heroes.goldDragon.offer?.length).toBeGreaterThan(0);
    expect(s.heroes.blackDragon.xp ?? 0).toBe(0);
    const off = createGame(digital({ objective: 'crystals', dawnStartXp: 8 }, { mode: 'pvp', seats: pvpSeats('goldDragon', 'blackDragon') }));
    expect(off.heroes.goldDragon.xp ?? 0).toBe(0);
  });

  it('dawnHeroReplacement replaces a fallen Przymierza hero only (heroReplacement stays off)', () => {
    const fall = (rules: Record<string, unknown>) => {
      const s = createGame(digital(rules, { mode: 'pvp', seats: pvpSeats('goldDragon', 'blackDragon') }));
      return s;
    };
    expect(fall({}).rules.dawnHeroReplacement).toBeUndefined();
    const s = fall({ dawnHeroReplacement: true });
    expect(s.rules.heroReplacement).toBe(false);
    const dawnReserve = s.factions.dawn.unusedHeroes.length;
    expect(dawnReserve).toBeGreaterThan(0);
    const killDawn = structuredClone(s);
    const bot = structuredClone(s);
    killHero(killDawn, 'goldDragon', killDawn.heroes.goldDragon.pos);
    killHero(bot, 'blackDragon', bot.heroes.blackDragon.pos);
    expect(killDawn.factions.dawn.unusedHeroes.length).toBe(dawnReserve - 1);
    expect(bot.factions.horde.unusedHeroes.length).toBe(s.factions.horde.unusedHeroes.length);
  });

  it('noFactionBonus takes the balancing bonus from the listed factions only (default: every faction keeps it)', () => {
    const game = (rules: Record<string, unknown>) => createGame(digital({ objective: 'crystals', ...rules }, { mode: 'pvp', seats: pvpSeats('goldDragon', 'blackDragon') }));
    const plain = game({});
    expect(withoutBonus(plain, 'horde')).toBe(false);
    expect(withoutBonus(plain, 'dawn')).toBe(false);
    const easy = game({ noFactionBonus: ['horde'] });
    expect(withoutBonus(easy, 'horde')).toBe(true);
    expect(withoutBonus(easy, 'dawn')).toBe(false);
    // The flag a unit gets is the one battleStats reads: the Horde's hero loses its +1 Atak.
    expect(battleStats('blackDragon', true, 1, 1, true).attack).toBe(battleStats('blackDragon', true, 1, 1, false).attack - 1);
  });

  it('crystalsNeededDelta lowers the crystals needed at the Tree, never below 1 (default: all of them)', () => {
    const need = (rules: Record<string, unknown>) => createGame(digital({ objective: 'crystals', ...rules })).crystalsNeeded;
    const base = need({});
    expect(need({ crystalsNeededDelta: -1 })).toBe(base - 1);
    expect(need({ crystalsNeededDelta: -9 })).toBe(1);
    expect(Object.keys(createGame(digital({ objective: 'crystals', crystalsNeededDelta: -1 })).crystals).length).toBe(Object.keys(createGame(digital({ objective: 'crystals' })).crystals).length);
  });
});
