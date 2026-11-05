import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/game';
import { playOut, pvpSeats, setup } from './helpers/engine';

describe('digital ruleset on the adventure map (battles on the arena)', () => {
  it('coop and PvP games with bots play to the end', () => {
    for (let seed = 1; seed <= 4; seed++) {
      for (const battleMode of ['arena', 'board'] as const) {
        const coop = playOut(createGame(setup({ seed, battleMode }, { ruleset: 'digital' })));
        expect(coop.phase, `coop ${seed} ${battleMode}`).toBe('over');
        const pvp = playOut(createGame(setup({ seed, mode: 'pvp', battleMode, seats: pvpSeats('goldDragon', 'blackDragon') }, { ruleset: 'digital' })));
        expect(pvp.phase, `pvp ${seed} ${battleMode}`).toBe('over');
      }
    }
  });
});
