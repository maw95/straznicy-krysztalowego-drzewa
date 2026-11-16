// The computer's advantages by level (COMPUTER_HANDICAP): Normal gives it exactly the people's conditions, Very hard sits on top of Hard.

import { describe, expect, it } from 'vitest';
import { applyComputerHp, makeBattleUnit } from '../src/engine/battle';
import { createGame } from '../src/engine/game';
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
      expect(COMPUTER_HANDICAP[level]).toEqual({ gold: 1, hp: 0, treasures: 0 });
      const { rules } = levelSettings(level, 'coop');
      expect([rules.computerGold, rules.computerHp, rules.computerTreasures]).toEqual([undefined, undefined, undefined]);
    }
  });

  it('only Very hard sets the advantages, from the one list', () => {
    const { rules } = levelSettings('veryHard', 'coop');
    expect([rules.veryHard, rules.computerGold, rules.computerHp, rules.computerTreasures]).toEqual([true, COMPUTER_HANDICAP.veryHard.gold, COMPUTER_HANDICAP.veryHard.hp, COMPUTER_HANDICAP.veryHard.treasures]);
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

  it("Very hard gives the computer's units more Życie, and nobody else's", () => {
    const s = createGame(table('veryHard', 'coop'));
    const horde = makeBattleUnit('werewolfLord', 'horde');
    const dawn = makeBattleUnit('goldDragon', 'dawn');
    const neutral = makeBattleUnit('goblinShaman', 'neutral');
    const base = [horde.maxHp, dawn.maxHp, neutral.maxHp];
    for (const u of [horde, dawn, neutral]) applyComputerHp(s, u);
    expect(horde.maxHp).toBe(Math.round(base[0] * (1 + COMPUTER_HANDICAP.veryHard.hp)));
    expect(horde.hp).toBe(horde.maxHp);
    expect([dawn.maxHp, neutral.maxHp]).toEqual([base[1], base[2]]);
    // On Normal the same call changes nothing.
    const n = createGame(table('normal', 'coop'));
    const w = makeBattleUnit('werewolfLord', 'horde');
    applyComputerHp(n, w);
    expect(w.maxHp).toBe(base[0]);
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
  it('Very hard gives the bot side more Życie, Hard and Normal do not', async () => {
    const { arenaSetup } = await import('../src/engine/types');
    const seats = [
      { name: 'A', faction: 'dawn' as const, controller: 'human' as const, heroId: 'goldDragon' },
      { name: 'B', faction: 'horde' as const, controller: 'bot' as const, heroId: 'blackDragon' },
    ];
    const hpOf = (level: Level) => {
      const s = createGame(arenaSetup(seats, 5, level));
      const u = makeBattleUnit('werewolfLord', 'horde');
      applyComputerHp(s, u);
      return u.maxHp;
    };
    const base = makeBattleUnit('werewolfLord', 'horde').maxHp;
    expect([hpOf('normal'), hpOf('hard')]).toEqual([base, base]);
    expect(hpOf('veryHard')).toBe(Math.round(base * (1 + COMPUTER_HANDICAP.veryHard.hp)));
  });
});
