// Games with three and four sides. A side is a faction, so until the next factions exist the third and fourth side are placeholders that read the
// data of Przymierze and Horda (teams.ts): the games below test that the engine, the map, the goals and the bots do not assume two sides.
import { describe, expect, it } from 'vitest';
import { applyAction, createGame } from '../src/engine/game';
import { ALL_TEAM_IDS, raceOf, teamsOf } from '../src/engine/teams';
import { DEFAULT_RULES, type RulesConfig, type SetupOptions } from '../src/engine/types';
import { playOut } from './helpers/engine';

const HEROES = ['goldDragon', 'blackDragon', 'unicornKing', 'werewolfLord'];

/** n bots, one per side, on a rectangle map. */
const game = (n: number, rules: Partial<RulesConfig>, over: Partial<SetupOptions> = {}): SetupOptions => ({
  mode: 'pvp',
  mapSize: 'long',
  battleMode: 'arena',
  seed: 3,
  mapShape: 'rectangle',
  seats: ALL_TEAM_IDS.slice(0, n).map((t, i) => ({ name: t, faction: t, controller: 'bot' as const, heroId: HEROES[i] })),
  rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, ...rules },
  ...over,
});

describe('sides are the factions seated at the table', () => {
  it('players of one faction are one side, another faction is another side', () => {
    const two = { ...game(2, { objective: 'control' }), seats: [...game(2, { objective: 'control' }).seats, { name: 'x', faction: 'dawn' as const, controller: 'bot' as const, heroId: 'ancientBear' }] };
    expect(teamsOf(createGame(two))).toEqual(['dawn', 'horde']);
    expect(teamsOf(createGame(game(3, { objective: 'control' })))).toEqual(['dawn', 'horde', 'third']);
    expect(teamsOf(createGame(game(4, { objective: 'control' })))).toEqual(['dawn', 'horde', 'third', 'fourth']);
  });

  it('coop and the arena always have the two first sides', () => {
    expect(teamsOf({ setup: { mode: 'coop', seats: [] } })).toEqual(['dawn', 'horde']);
    expect(teamsOf({ setup: { mode: 'arena', seats: [] } })).toEqual(['dawn', 'horde']);
  });

  it('the placeholders read the data of the first two factions', () => {
    expect([raceOf(null, 'dawn'), raceOf(null, 'horde'), raceOf(null, 'third'), raceOf(null, 'fourth')]).toEqual(['dawn', 'horde', 'dawn', 'horde']);
  });
});

describe('three and four sides', () => {
  it('give every side a base, a hero, supports and its own entry in the state', () => {
    for (const n of [3, 4]) {
      const s = createGame(game(n, { objective: 'control' }));
      const teams = teamsOf(s);
      expect(teams).toHaveLength(n);
      expect(Object.keys(s.factions)).toEqual([...teams]);
      expect(new Set(teams.map((t) => s.homes![t])).size).toBe(n);
      for (const t of teams) {
        expect(Object.values(s.heroes).filter((h) => h.faction === t)).toHaveLength(1);
        expect(s.factions[t].supportsAlive.length).toBeGreaterThan(0);
        expect(Object.values(s.tiles).some((x) => x.home === t && x.side === t)).toBe(true);
      }
      expect(s.control!.points).toHaveLength(n + 1);
    }
  });

  const goals = ['control', 'boss', 'artifact', 'survival', 'conquest', 'relic'] as const;
  for (const objective of goals) {
    it(`goal ${objective}: three bots play to the end`, () => {
      const end = playOut(createGame(game(3, { objective })));
      expect(end.phase).toBe('over');
      expect(end.winner === null || teamsOf(end).includes(end.winner as never)).toBe(true);
    });
  }
  for (const objective of ['control', 'boss', 'survival'] as const) {
    it(`goal ${objective}: four bots play to the end`, () => {
      const end = playOut(createGame(game(4, { objective })));
      expect(end.phase).toBe('over');
      expect(end.winner === null || teamsOf(end).includes(end.winner as never)).toBe(true);
    });
  }

  it('the last side with a living hero wins', () => {
    const s = createGame(game(3, { objective: 'control' }));
    for (const h of Object.values(s.heroes)) if (h.faction !== 'third') h.alive = false;
    // any end of a turn re-reads the victory conditions
    const over = applyAction(s, { type: 'endTurn' });
    expect(over.phase).toBe('over');
    expect(over.winner).toBe('third');
  });
});

describe('the crystals goal', () => {
  it('belongs to Przymierza against Horda: more sides do not start', () => {
    const crystals = { objective: 'crystals' as const };
    expect(() => createGame({ ...game(2, crystals), mapShape: undefined, mapSize: 'short', rules: { ...DEFAULT_RULES, ...crystals } })).not.toThrow();
    expect(() => createGame(game(3, crystals))).toThrow(/Przymierzu i Hordzie/);
  });
  it('is the fallback of a goal the level cannot play, so three sides cannot start there either', () => {
    expect(() => createGame(game(3, { objective: 'conquest', economy: false }))).toThrow(/Przymierzu i Hordzie/);
  });
});

describe('what three and four sides need', () => {
  it('a rectangle map of the digital ruleset, big enough, and no coop', () => {
    expect(() => createGame(game(3, { objective: 'control' }, { mapShape: 'ring' }))).toThrow(/prostokątnej/);
    expect(() => createGame(game(3, { objective: 'control' }, { mapShape: undefined }))).toThrow();
    expect(() => createGame(game(4, { objective: 'control' }, { mapSize: 'medium' }))).toThrow(/za mała/);
    expect(() => createGame(game(3, { objective: 'control' }, { mapSize: 'short' }))).toThrow(/za mała/);
    expect(() => createGame(game(3, { objective: 'control' }, { mode: 'coop' }))).toThrow(/Kooperacja/);
  });
});
