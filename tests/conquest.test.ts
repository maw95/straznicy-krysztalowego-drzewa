// Level 4 goal "Podbój": the side that holds every settlement on the enemy's land at the end of a round wins.

import { describe, expect, it } from 'vitest';
import { applyAction, createGame } from '../src/engine/game';
import { conquestHeld, conquestTargets, objectiveOf, OBJECTIVES } from '../src/engine/objectives';
import type { GameState } from '../src/engine/types';
import { playOut, pvpSeats, setup } from './helpers/engine';

const rules = { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, objective: 'conquest' } as const;
const game = (over = {}): GameState => createGame(setup({ mode: 'pvp', mapSize: 'medium', seed: 3, seats: pvpSeats('goldDragon', 'werewolfLord'), ...over }, rules));
const endRound = (s: GameState): GameState => {
  const round = s.round;
  while (s.phase !== 'over' && s.round === round) s = applyAction(s, { type: 'endTurn' });
  return s;
};

describe('goal: conquest', () => {
  it('needs level 4: without the economy rule the game is played for the crystals', () => {
    expect(objectiveOf(game())).toBe('conquest');
    const l3 = createGame(setup({ mode: 'pvp', mapSize: 'medium', seed: 3, seats: pvpSeats('goldDragon', 'werewolfLord') }, { ruleset: 'digital', heroGrowth: true, kingdom: true, objective: 'conquest' }));
    expect(objectiveOf(l3)).toBe('crystals');
  });

  it('counts the enemy capital and the settlements on its land as targets', () => {
    const s = game();
    const targets = conquestTargets(s, 'dawn').map((id) => s.kingdom!.settlements[id]);
    expect(targets.every((t) => t.land === 'horde')).toBe(true);
    expect(targets.some((t) => t.id === 'start-horde')).toBe(true);
    expect(targets.length).toBe(conquestTargets(s, 'horde').length);
    expect(conquestHeld(s, 'dawn')).toBe(0);
    expect(OBJECTIVES.conquest.progress(s)).toHaveLength(2);
  });

  it('is won at the end of the round in which a side holds all of them, not earlier', () => {
    let s = game();
    const targets = conquestTargets(s, 'dawn');
    for (const id of targets.slice(1)) s.kingdom!.settlements[id].owner = 'dawn';
    s = endRound(s);
    expect(s.phase).not.toBe('over');
    s.kingdom!.settlements[targets[0]].owner = 'dawn';
    expect(s.phase).not.toBe('over');
    s = endRound(s);
    expect(s.phase).toBe('over');
    expect(s.winner).toBe('dawn');
  });

  it('at the round limit goes to the side holding most of the enemy land, else a draw', () => {
    const limit = (owned: number): GameState => {
      let s = game();
      const targets = conquestTargets(s, 'dawn');
      for (const id of targets.slice(0, owned)) s.kingdom!.settlements[id].owner = 'dawn';
      s.round = s.roundLimit;
      s = endRound(s);
      expect(s.phase).toBe('over');
      return s;
    };
    const n = conquestTargets(game(), 'dawn').length;
    expect(limit(Math.floor(n / 2) + 1 > n - 1 ? n - 1 : Math.floor(n / 2) + 1).winner).toBe(n >= 3 ? 'dawn' : null);
    expect(limit(0).winner).toBe(null);
  });

  it('bots play it to the end in coop and against each other', () => {
    for (const s of [game({ seed: 5 }), createGame(setup({ mapSize: 'medium', seed: 4 }, rules))]) expect(playOut(s).phase).toBe('over');
  });
});
