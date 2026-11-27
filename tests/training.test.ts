// The training (src/engine/training.ts): complete data, valid maps, and for every training a game that the coach's steps can lead to the end: every action a sensible
// player (the bot, standing in for one) takes is let through by the step it is taken at, and the steps open in order until the game is over.

import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { CUSTOM_MAPS, readyMaps, validateCustomMap } from '../src/engine/customMaps';
import { applyAction, currentActor } from '../src/engine/game';
import { TRAININGS, createTrainingGame, trainingAllows, trainingIndex, trainingOf, trainingSetup } from '../src/engine/training';
import { UNITS } from '../src/engine/data';

describe.each(TRAININGS)('training $id', (t) => {
  it('is told: title, line, intro with the right-click rule, steps with a title and a text', () => {
    expect(t.title.length).toBeGreaterThan(3);
    for (const x of [t.tagline, ...t.intro, ...t.win, ...t.lose]) expect(x.trim().length, x).toBeGreaterThan(10);
    expect(t.intro.join(' ')).toContain('prawym przyciskiem');
    expect(t.learn.length).toBeGreaterThan(0);
    expect(t.steps.length).toBeGreaterThanOrEqual(3);
    for (const s of t.steps) expect(s.title.length + s.text.length, s.id).toBeGreaterThan(20);
    expect(new Set(t.steps.map((s) => s.id)).size).toBe(t.steps.length);
    expect(UNITS[t.hero]?.kind).toBe('hero');
  });

  it('has a valid map of its own, hidden from the lists of the wizard', () => {
    expect(() => validateCustomMap(t.map)).not.toThrow();
    expect(CUSTOM_MAPS[t.map.id]).toBe(t.map);
    expect(readyMaps().some((m) => m.id === t.map.id)).toBe(false);
  });

  it('makes the set-up of an ordinary game, marked with the training', () => {
    const setup = trainingSetup(t, 5);
    expect(setup.training).toEqual({ id: t.id });
    expect(trainingOf(setup)).toBe(t);
    expect(setup.customMapId).toBe(t.map.id);
    expect(setup.seats.filter((s) => s.controller === 'human')).toHaveLength(1);
  });

  it.each([1, 2, 3, 4, 5, 6])('is led to its end by the steps (seed %i)', (seed) => {
    let g = createTrainingGame(t, seed);
    let index = 0;
    let held = 0;
    const reached: number[] = [];
    for (let i = 0; i < 6000 && g.phase !== 'over'; i++) {
      const a = chooseAction(g);
      if (!a) break;
      index = trainingIndex(t, g, index);
      if (!reached.includes(index)) reached.push(index);
      let play = a;
      if (currentActor(g).kind === 'human' && !trainingAllows(t, g, index, a)) {
        // The bot reached for something the step does not ask for (a map item, say): the player is held, and does what the coach shows, else ends the turn.
        held++;
        const target = t.steps[index]?.target?.(g);
        play = target && 'hex' in target ? { type: 'moveHero', to: target.hex } : { type: 'endTurn' };
        expect(trainingAllows(t, g, index, play), `step ${t.steps[index]?.id} holds even what it asks for: ${JSON.stringify(play)}`).toBe(true);
      }
      g = applyAction(g, play);
    }
    expect(g.phase).toBe('over');
    expect(held).toBeLessThan(200);
    // The steps open in order and none is skipped by the engine's own flow (a lost game may end early).
    expect(reached).toEqual([...reached].sort((x, y) => x - y));
    if (g.winner === 'dawn') expect(trainingIndex(t, g, index)).toBe(t.steps.length);
  });
});
