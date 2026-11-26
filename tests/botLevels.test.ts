// Backlog 94: the difficulty of the digital game lives at the bots (a level per bot seat), not in the rules of the game.

import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { actingBotLevel, BOT_SLIPS, slips } from '../src/engine/ai/slips';
import { applyActionInPlace, createGame } from '../src/engine/game';
import { levelOf } from '../src/engine/scoring';
import { digitalRules } from '../src/engine/tuning';
import { advantagedFaction, levelSettings, type BotLevel, type ObjectiveId, type SeatSetup, type SetupOptions } from '../src/engine/types';

const seat = (faction: 'dawn' | 'horde', heroId: string, controller: 'human' | 'bot', botLevel?: BotLevel): SeatSetup => ({ name: heroId, faction, controller, heroId, ...(botLevel ? { botLevel } : {}) });

const table = (seats: SeatSetup[], objective: ObjectiveId = 'control', mapSize: SetupOptions['mapSize'] = 'medium'): SetupOptions => {
  const base = levelSettings('normal', 'pvp');
  return { mode: 'pvp', mapSize, battleMode: base.battleMode, seed: 11, seats, seatLevels: true, rules: { ...base.rules, ruleset: 'digital', heroGrowth: true, ...(objective !== 'crystals' ? { objective } : {}) } };
};

describe('levels at the bots', () => {
  it('give each bot player its level (Normalny when the seat names none), and none to the people', () => {
    const s = createGame(table([seat('dawn', 'goldDragon', 'human'), seat('horde', 'werewolfLord', 'bot', 'kids'), seat('horde', 'gorgon', 'bot')]));
    expect(s.players.map((p) => p.botLevel)).toEqual([undefined, 'kids', 'normal']);
  });

  it('read the level of the bot that acts now; people, the old games and Hard bots never slip', () => {
    const s = createGame(table([seat('dawn', 'goldDragon', 'bot', 'hard'), seat('horde', 'werewolfLord', 'bot', 'kids')]));
    expect(actingBotLevel(s)).toBe('hard');
    expect(slips(s, 'stray')).toBe(false);
    const old = createGame({ ...table([seat('dawn', 'goldDragon', 'bot'), seat('horde', 'werewolfLord', 'bot')]), seatLevels: undefined });
    expect(actingBotLevel(old)).toBeNull();
    expect(BOT_SLIPS.hard).toBe(0);
    expect(BOT_SLIPS.kids).toBeGreaterThan(BOT_SLIPS.normal);
  });

  it('play the same game from the same seed (the slips are drawn from the state, not at random)', () => {
    const play = () => {
      const s = createGame(table([seat('dawn', 'goldDragon', 'bot', 'kids'), seat('horde', 'werewolfLord', 'bot', 'normal')]));
      for (let i = 0; i < 4000 && s.phase !== 'over'; i++) {
        const a = chooseAction(s);
        if (!a) break;
        applyActionInPlace(s, a);
      }
      return `${s.winner} ${s.round} ${s.actionCount}`;
    };
    expect(play()).toBe(play());
  });

  it('give the computer advantages of Very hard to the sides of a Very hard bot only', () => {
    const setup = table([seat('dawn', 'goldDragon', 'bot', 'normal'), seat('horde', 'werewolfLord', 'bot', 'veryHard')]);
    const rules = digitalRules(setup);
    expect(rules.computerGold).toBeGreaterThan(1);
    expect(advantagedFaction({ setup }, 'horde')).toBe(true);
    expect(advantagedFaction({ setup }, 'dawn')).toBe(false);
    // A person at the side of the Very hard bot: the side is not the computer's.
    const mixed = table([seat('dawn', 'goldDragon', 'bot', 'normal'), seat('horde', 'werewolfLord', 'bot', 'veryHard'), seat('horde', 'gorgon', 'human')]);
    expect(advantagedFaction({ setup: mixed }, 'horde')).toBe(false);
  });

  it('take no levers in the goals the sides play alike, and no advantages at a table of people only', () => {
    const people = table([seat('dawn', 'goldDragon', 'human'), seat('horde', 'werewolfLord', 'human')], 'control', 'veryLong');
    expect(digitalRules(people)).toBe(people.rules);
    const bots = table([seat('dawn', 'goldDragon', 'human'), seat('horde', 'werewolfLord', 'bot', 'kids')], 'artifact', 'veryLong');
    expect(digitalRules(bots)).toBe(bots.rules);
  });

  it('count a game at the highest level of the bots against the people', () => {
    expect(levelOf(table([seat('dawn', 'goldDragon', 'human'), seat('horde', 'werewolfLord', 'bot', 'kids'), seat('horde', 'gorgon', 'bot', 'hard')]))).toBe('hard');
    // A bot at the person's side does not count while there are bots against them.
    expect(levelOf(table([seat('dawn', 'goldDragon', 'human'), seat('dawn', 'moonWolf', 'bot', 'veryHard'), seat('horde', 'werewolfLord', 'bot', 'kids')]))).toBe('kids');
    expect(levelOf(table([seat('dawn', 'goldDragon', 'human'), seat('horde', 'werewolfLord', 'human')]))).toBe('normal');
  });
});
