import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/game';
import { boostOf, dailySeed, expeditionSetup, newRun, opponentOf, relicOffer, runOf, runScore, stageOf, STAGES, unlockedHeroes } from '../src/engine/expedition';

describe('expedition', () => {
  it('grows the computer stage by stage and ends with the Black Dragon', () => {
    const stages = Array.from({ length: STAGES }, (_, i) => stageOf(i));
    for (let i = 1; i < STAGES; i++) {
      expect(stages[i].handicap.mana).toBeGreaterThanOrEqual(stages[i - 1].handicap.mana);
      expect(stages[i].handicap.gear).toBeGreaterThanOrEqual(stages[i - 1].handicap.gear);
    }
    expect(stages[STAGES - 1].boss).toBe(true);
    expect(opponentOf(newRun(5, 'goldDragon'), STAGES - 1)).toBe('blackDragon');
    expect(opponentOf(newRun(5, 'goldDragon'), 0)).not.toBe('blackDragon');
  });

  it('is deterministic: the same seed gives the same opponents, offers and daily seed', () => {
    const a = newRun(42, 'goldDragon');
    const b = newRun(42, 'goldDragon');
    expect(relicOffer(a, 1).map((r) => r.id)).toEqual(relicOffer(b, 1).map((r) => r.id));
    expect(relicOffer(a, 1)).toHaveLength(3);
    expect(dailySeed('2026-11-18')).toBe(dailySeed('2026-11-18'));
    expect(dailySeed('2026-11-18')).not.toBe(dailySeed('2026-11-19'));
  });

  it('builds a 6 on 6 arena game that carries the run, and reads the run back', () => {
    const run = { ...newRun(9, 'unicornKing', '2026-11-18'), cleared: 3, relics: ['manaCrystal', 'masterChest'] };
    const setup = expeditionSetup(run);
    expect(setup.mode).toBe('arena');
    expect(setup.rules.arenaSize).toBe(6);
    expect(setup.rules.arenaBoost).toEqual({ mana: 1, spells: 0, gear: 1 });
    expect(runOf(setup)).toEqual(run);
    expect(boostOf(run.relics)).toEqual({ mana: 1, spells: 0, gear: 1 });
  });

  it('gives the relics to the hero of the person only', () => {
    const run = { ...newRun(3, 'goldDragon'), relics: ['manaSpring'] };
    const state = createGame(expeditionSetup(run));
    const mine = Object.values(state.heroes).find((h) => h.faction === 'dawn');
    const theirs = Object.values(state.heroes).find((h) => h.faction === 'horde');
    expect(mine?.manaBonus ?? 0).toBeGreaterThanOrEqual(2);
    expect(theirs?.manaBonus ?? 0).toBe(stageOf(0).handicap.mana);
  });

  it('scores the run and unlocks heroes', () => {
    expect(runScore(3)).toBe(300);
    expect(runScore(STAGES)).toBe(STAGES * 100 + 200);
    expect(unlockedHeroes(0, 0)).toEqual(['goldDragon', 'unicornKing']);
    expect(unlockedHeroes(4, 0)).toContain('ancientBear');
    expect(unlockedHeroes(2, 1)).toContain('braveDuck');
  });
});
