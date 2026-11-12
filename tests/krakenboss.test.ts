import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { applyActionInPlace, createGame } from '../src/engine/game';
import { setupWith } from '../scripts/sim/core';

// The Kraken's lair is a neutral encounter; the bots' walk to the Boss once refused to enter it, so the game idled to the round limit.
describe('Kraken as the Boss', () => {
  it('is fought: the bots walk into its lair and wound it', () => {
    Object.assign(process.env, { SIM_DIGITAL: '1', SIM_OBJECTIVE: 'boss', SIM_GROWTH: '1' });
    let fought = 0;
    let seen = 0;
    for (let seed = 1; seed < 60 && seen < 4; seed++) {
      const s = createGame(setupWith('short', 'coop1', ['full'], seed));
      if (s.boss!.guardian !== 'kraken') continue;
      seen++;
      for (let i = 0; i < 30000 && s.phase !== 'over'; i++) {
        const a = chooseAction(s);
        if (!a) break;
        applyActionInPlace(s, a);
      }
      if (s.boss!.hits.dawn + s.boss!.hits.horde > 0 || s.boss!.slain) fought++;
    }
    expect(seen).toBeGreaterThan(0);
    expect(fought).toBe(seen);
  });
});
