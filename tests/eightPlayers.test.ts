// Eight players play on every level of the digital game (no limit of six on the Realm and Empire levels any more; the author, 21.11), and the fourth heroes are in the pool then.
import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/game';
import { EXTRA_HEROES, FACTION_HEROES, heroPool, MAX_PVP_PLAYERS } from '../src/engine/data';
import { PACK_IDS } from '../src/engine/factions';
import { assignSlots } from '../src/engine/teams';
import { DEFAULT_RULES, type SetupOptions } from '../src/engine/types';
import { playOut } from './helpers/engine';

const table = (n: number, over: Partial<SetupOptions['rules']>): SetupOptions => {
  // At most four factions sit at a table: eight players are four factions twice.
  const races = Array.from({ length: n }, (_, i) => PACK_IDS[i % 4]);
  const slots = assignSlots(races);
  return {
    mode: 'pvp',
    mapSize: 'long',
    battleMode: 'arena',
    seed: 7,
    mapShape: 'rectangle',
    seats: races.map((race, i) => ({ name: `${race}${i}`, faction: slots[i], race, controller: 'bot' as const, heroId: heroPool(race, n)[i % 4] })),
    rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, objective: 'conquest', ...over },
  };
};

describe('eight players', () => {
  it('the pool of heroes has the fourth hero from seven players on', () => {
    for (const f of PACK_IDS) {
      expect(heroPool(f, 6)).toEqual(FACTION_HEROES[f]);
      expect(heroPool(f, 7)).toEqual([...FACTION_HEROES[f], EXTRA_HEROES[f]]);
    }
  });

  it.each([
    ['Adventure', {}],
    ['Realm', { realm: true }],
    ['Empire', { realm: true, empire: true }],
  ])('eight bots play a conquest to the end on the %s level', (_name, rules) => {
    const end = playOut(createGame(table(MAX_PVP_PLAYERS, rules)));
    expect(end.phase).toBe('over');
  });
});
