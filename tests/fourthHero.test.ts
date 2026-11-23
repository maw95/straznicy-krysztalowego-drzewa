// The fourth hero of a faction (Silver She-Wolf, Dusk Manticore...) can be picked at any table of a digital rivalry, not only above six players.
import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { EXTRA_HEROES } from '../src/engine/data';
import { applyAction, createGame } from '../src/engine/game';
import { withRuleset } from '../src/engine/presets';
import { levelSettings } from '../src/engine/types';

describe('fourth hero at a small table', () => {
  it('a two-player rivalry with both fourth heroes is played to the end', () => {
    const { battleMode, rules } = levelSettings('normal', 'pvp');
    const seats = [
      { name: 'A', faction: 'dawn' as const, controller: 'bot' as const, heroId: EXTRA_HEROES.dawn },
      { name: 'B', faction: 'horde' as const, controller: 'bot' as const, heroId: EXTRA_HEROES.horde },
    ];
    let s = createGame(withRuleset({ mode: 'pvp', mapSize: 'short', battleMode, seed: 3, seats, rules }, true));
    expect(Object.keys(s.heroes).sort()).toEqual([EXTRA_HEROES.dawn, EXTRA_HEROES.horde].sort());
    for (let n = 0; n < 20000 && s.phase !== 'over'; n++) {
      const a = chooseAction(s);
      if (!a) break;
      s = applyAction(s, a);
    }
    expect(s.phase).toBe('over');
  });
});
