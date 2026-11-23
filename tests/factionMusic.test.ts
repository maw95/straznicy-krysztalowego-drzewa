import { describe, expect, it } from 'vitest';
import { FACTION_HEROES } from '../src/engine/data';
import { activeHero, createGame } from '../src/engine/game';
import { assignSlots, raceOf } from '../src/engine/teams';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../src/engine/types';
import { musicTheme } from '../src/ui/gameDialogs';
import { factionTheme, FACTION_MUSIC } from '../src/ui/music';

const game = (): GameState => {
  const races = ['herds', 'horde'] as const;
  const slots = assignSlots([...races]);
  const setup: SetupOptions = {
    mode: 'pvp', mapSize: 'long', battleMode: 'arena', seed: 5, mapShape: 'rectangle',
    seats: races.map((race, i) => ({ name: race, faction: slots[i], race, controller: 'bot' as const, heroId: FACTION_HEROES[race][0] })),
    rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, objective: 'control' },
  };
  return createGame(setup);
};

describe('faction music: the theme of a faction plays in its town and while the hero stands on its land', () => {
  it('only factions that have tracks get a theme', () => {
    expect(factionTheme('herds')).toBe('faction:herds');
    expect(factionTheme('horde')).toBeNull();
    expect(FACTION_MUSIC.herds?.length).toBeGreaterThanOrEqual(2);
  });

  it('on the map: the land the active hero stands on decides', () => {
    const g = game();
    const tileOf = (race: 'herds' | 'horde') => Object.values(g.tiles).find((t) => raceOf(g, t.side) === race)!;
    const hero = activeHero(g)!;
    hero.pos = tileOf('herds').key;
    expect(musicTheme(g)).toBe('faction:herds');
    hero.pos = tileOf('horde').key;
    expect(musicTheme(g)).toBe('adventure'); // the Horda has no music yet
  });

  it('in a town: the faction of the settlement plays, whatever stands under the hero', () => {
    const g = game();
    expect(musicTheme(g, 'herds')).toBe('faction:herds');
    expect(musicTheme(g, 'horde')).toBe('adventure'); // the Horda has no music of its own yet
  });

  it('battles and the ritual keep their own music', () => {
    const g = game();
    g.phase = 'battle';
    g.battle = { stage: 'fight', kind: 'neutral' } as GameState['battle'];
    expect(musicTheme(g, 'herds')).toBe('guardian');
  });
});
