// Rivalry for 8 players: four heroes a side, played out by bots on two map sizes (the fourth heroes are the Brave Duck and the Warlord).
import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { BASE_PVP_PLAYERS, EXTRA_HEROES, FACTION_HEROES, heroPool, MAX_PVP_PLAYERS } from '../src/engine/data';
import { applyAction, createGame } from '../src/engine/game';
import { withRuleset } from '../src/engine/presets';
import { levelSettings, type SeatSetup } from '../src/engine/types';

const seats: SeatSetup[] = Array.from({ length: 8 }, (_, i) => {
  const faction = i % 2 ? 'horde' : 'dawn';
  return { name: `G${i}`, faction, controller: 'bot', heroId: heroPool(faction, 8)[Math.floor(i / 2)] };
});

describe('8 players', () => {
  it('offers a fourth hero a side only above six players', () => {
    expect(MAX_PVP_PLAYERS).toBe(8);
    expect(heroPool('dawn', BASE_PVP_PLAYERS)).toEqual(FACTION_HEROES.dawn);
    expect(heroPool('horde', 7)).toEqual([...FACTION_HEROES.horde, EXTRA_HEROES.horde]);
  });

  it.each(['short', 'medium'] as const)('plays a %s map to the end', (mapSize) => {
    const { battleMode, rules } = levelSettings('normal', 'pvp');
    let s = createGame(withRuleset({ mode: 'pvp', mapSize, battleMode, seed: 5, seats, rules }, true));
    expect(Object.keys(s.heroes)).toHaveLength(8);
    for (let n = 0; n < 20000 && s.phase !== 'over'; n++) {
      const a = chooseAction(s);
      if (!a) break;
      s = applyAction(s, a);
    }
    expect(s.phase).toBe('over');
  });
});
