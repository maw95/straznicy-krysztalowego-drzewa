import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/game';
import { objectiveOf, OBJECTIVES } from '../src/engine/objectives';
import { playOut, setup } from './helpers/engine';

describe('objectives', () => {
  it('a game without an objective plays the crystals goal, as before', () => {
    const s = createGame(setup());
    expect(s.rules.objective).toBeUndefined();
    expect(objectiveOf(s)).toBe('crystals');
    expect(s.control).toBeUndefined();
  });

  it('the crystals objective reports the crystals at the Tree and the ritual while it runs', () => {
    const s = createGame(setup());
    expect(OBJECTIVES.crystals.progress(s)).toEqual([{ label: 'Kryształy przy Drzewie', value: `0 / ${s.crystalsNeeded}`, tone: 'dawn' }]);
    s.ritual = 2;
    expect(OBJECTIVES.crystals.progress(s).map((l) => l.label)).toContain('Rytuał przy Drzewie');
  });

  it('the crystals objective finishes the game when all crystals are delivered', () => {
    const s = createGame(setup());
    s.factions.dawn.delivered = s.crystalsNeeded;
    OBJECTIVES.crystals.checkVictory(s);
    expect(s.phase).toBe('over');
    expect(s.winner).toBe('dawn');
  });

  it('bots still play a crystals game to the end', () => {
    expect(playOut(createGame(setup({ seed: 3 }))).phase).toBe('over');
  });
});
