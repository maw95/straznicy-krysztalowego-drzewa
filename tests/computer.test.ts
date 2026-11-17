// The computer's advantages by level (COMPUTER_HANDICAP): Normal gives it exactly the people's conditions, Very hard sits on top of Hard.

import { describe, expect, it } from 'vitest';
import { activeHero, createGame } from '../src/engine/game';
import { collectIncome, goldOf, incomeOf } from '../src/engine/kingdom';
import { levelOf } from '../src/engine/scoring';
import { COMPUTER_HANDICAP, computerFaction, levelSettings, type Level } from '../src/engine/types';
import { pvpSeats, setup } from './helpers/engine';


/** A table for `level` in `mode`: the level's preset rules on a digital set-up. */
const table = (level: Level, mode: 'coop' | 'pvp', over: Record<string, unknown> = {}) => {
  const { battleMode, rules } = levelSettings(level, mode);
  const seats = mode === 'pvp' ? pvpSeats('goldDragon', 'blackDragon') : undefined;
  return setup({ mode, battleMode, ...(seats ? { seats } : {}), mapSize: 'medium', seed: 3 }, { ...rules, ruleset: 'digital', ...over });
};
const treasuresOf = (s: ReturnType<typeof createGame>, f: 'dawn' | 'horde') => s.factions[f].inventory.length;

describe('computer advantages by level', () => {
  it('Normal and the levels below it give the computer no advantage at all', () => {
    for (const level of ['zero', 'kids', 'normal', 'hard'] as Level[]) {
      expect(COMPUTER_HANDICAP[level]).toEqual({ gold: 1, treasures: 0, resources: { wood: 0, ore: 0, dust: 0 }, artifacts: 0 });
      const { rules } = levelSettings(level, 'coop');
      expect([rules.computerGold, rules.computerTreasures, rules.computerResources, rules.computerArtifacts]).toEqual([undefined, undefined, undefined, undefined]);
    }
  });

  it('only Very hard sets the advantages, from the one list', () => {
    const { rules } = levelSettings('veryHard', 'coop');
    const h = COMPUTER_HANDICAP.veryHard;
    expect([rules.veryHard, rules.computerGold, rules.computerTreasures, rules.computerResources, rules.computerArtifacts]).toEqual([true, h.gold, h.treasures, h.resources, h.artifacts]);
    expect(rules).not.toHaveProperty('computerHp');
  });

  it('the level is read back from the rules (coop and PvP), Hard and Very hard apart', () => {
    for (const mode of ['coop', 'pvp'] as const) {
      for (const level of ['normal', 'hard', 'veryHard'] as Level[]) expect(levelOf(table(level, mode))).toBe(level);
    }
  });

  it('knows which factions the computer plays', () => {
    const coop = createGame(table('normal', 'coop'));
    expect([computerFaction(coop, 'dawn'), computerFaction(coop, 'horde')]).toEqual([false, true]);
    const pvp = { setup: { mode: 'pvp' as const, seats: [{ name: 'A', faction: 'dawn' as const, controller: 'human' as const, heroId: 'goldDragon' }, { name: 'B', faction: 'horde' as const, controller: 'bot' as const, heroId: 'blackDragon' }] } };
    expect([computerFaction(pvp, 'dawn'), computerFaction(pvp, 'horde')]).toEqual([false, true]);
  });

  it('Very hard starts the computer with more treasures than Hard, the people with the same', () => {
    const hard = createGame(table('hard', 'coop'));
    const very = createGame(table('veryHard', 'coop'));
    expect(treasuresOf(very, 'horde')).toBe(treasuresOf(hard, 'horde') + COMPUTER_HANDICAP.veryHard.treasures);
    expect(treasuresOf(very, 'dawn')).toBe(treasuresOf(hard, 'dawn'));
  });

  it('Very hard gives the computer start resources and an artifact for its main hero, the people nothing', () => {
    const over = { heroGrowth: true, kingdom: true, economy: true };
    const hard = createGame(table('hard', 'pvp', over));
    const very = createGame(table('veryHard', 'pvp', over));
    // pvpSeats are bots on both sides: both are "the computer".
    for (const f of ['dawn', 'horde'] as const) {
      for (const r of ['wood', 'ore', 'dust'] as const) expect(very.kingdom!.res![f][r]).toBe(hard.kingdom!.res![f][r] + COMPUTER_HANDICAP.veryHard.resources[r]);
    }
    const gear = (s: ReturnType<typeof createGame>, id: string) => Object.keys(s.heroes[id].gear ?? {}).length + (s.heroes[id].pack?.length ?? 0);
    expect(gear(hard, 'goldDragon')).toBe(0);
    expect(gear(very, 'goldDragon')).toBe(COMPUTER_HANDICAP.veryHard.artifacts);
    expect(very.heroes.goldDragon.gear && Object.values(very.heroes.goldDragon.gear).every((id) => id)).toBe(true);
    // A human side gets neither.
    const humans = pvpSeats('goldDragon', 'blackDragon').map((x) => (x.faction === 'dawn' ? { ...x, controller: 'human' as const } : x));
    const mixed = createGame({ ...table('veryHard', 'pvp', over), seats: humans });
    expect(mixed.kingdom!.res!.dawn).toEqual(hard.kingdom!.res!.dawn);
    expect(gear(mixed, 'goldDragon')).toBe(0);
    expect(gear(mixed, 'blackDragon')).toBe(COMPUTER_HANDICAP.veryHard.artifacts);
    expect(activeHero(very)).toBeTruthy();
  });

  it("Very hard multiplies a bot faction's income at a PvP table, and Normal does not", () => {
    for (const [level, mult] of [['normal', 1], ['veryHard', COMPUTER_HANDICAP.veryHard.gold]] as const) {
      const s = createGame(table(level, 'pvp', { heroGrowth: true, kingdom: true }));
      const before = { dawn: goldOf(s, 'dawn'), horde: goldOf(s, 'horde') };
      const income = { dawn: incomeOf(s, 'dawn'), horde: incomeOf(s, 'horde') };
      collectIncome(s);
      expect(goldOf(s, 'horde') - before.horde).toBe(Math.round(income.horde * mult));
      expect(goldOf(s, 'dawn') - before.dawn).toBe(Math.round(income.dawn * mult));
    }
  });
});

describe('the arena computer', () => {
  it('Very hard keeps the unit stats of Hard (the arena advantage is a bot without mistakes, not more Życie)', async () => {
    const { arenaSetup } = await import('../src/engine/types');
    const seats = [
      { name: 'A', faction: 'dawn' as const, controller: 'human' as const, heroId: 'goldDragon' },
      { name: 'B', faction: 'horde' as const, controller: 'bot' as const, heroId: 'blackDragon' },
    ];
    const s = createGame(arenaSetup(seats, 5, 'veryHard'));
    expect(s.setup.rules).toMatchObject({ veryHard: true });
    expect(s.setup.rules).not.toHaveProperty('computerHp');
    expect(levelOf(s.setup)).toBe('veryHard');
  });
});

describe('points by level of the game', () => {
  it('a win counts more at each higher level of the game', async () => {
    const { tierPointsFactor } = await import('../src/engine/scoring');
    const f = [{}, { kingdom: true }, { kingdom: true, economy: true }, { kingdom: true, economy: true, realm: true }, { kingdom: true, economy: true, realm: true, empire: true }].map(tierPointsFactor);
    expect(f).toEqual([...f].sort((a, b) => a - b));
    expect(new Set(f).size).toBe(5);
  });
});
