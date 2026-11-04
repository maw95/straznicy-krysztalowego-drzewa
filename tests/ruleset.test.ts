import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/game';
import { DEFAULT_RULES, isDigital } from '../src/engine/types';
import { setup } from './helpers/engine';

describe('ruleset', () => {
  it('is classic unless the digital ruleset is switched on', () => {
    expect(isDigital(DEFAULT_RULES)).toBe(false);
    expect(isDigital({ ruleset: 'classic' })).toBe(false);
    expect(isDigital({ ruleset: 'digital' })).toBe(true);
  });

  it('is carried into the game state', () => {
    expect(isDigital(createGame(setup()).rules)).toBe(false);
    expect(isDigital(createGame(setup({}, { ruleset: 'digital' })).rules)).toBe(true);
  });

  it('does not change the generated game while no digital rule exists yet', () => {
    const classic = createGame(setup());
    const digital = createGame(setup({}, { ruleset: 'digital' }));
    expect({ ...digital, rules: classic.rules, setup: classic.setup }).toEqual(classic);
  });
});
