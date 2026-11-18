// Games with three and four teams: they start, bots play them to the end, every goal but the crystals one works, and the crystals goal
// stays the story of Przymierze against Horda.
import { describe, expect, it } from 'vitest';
import { applyAction, createGame } from '../src/engine/game';
import { ALL_TEAM_IDS, raceOf, teamsOf } from '../src/engine/teams';
import { DEFAULT_RULES, type RulesConfig, type SetupOptions } from '../src/engine/types';
import { playOut, playUntil } from './helpers/engine';

const HEROES = ['goldDragon', 'blackDragon', 'unicornKing', 'werewolfLord'];

/** n bots, one per team, on a rectangle map; third plays Przymierze and fourth Horda unless `races` says otherwise. */
const game = (n: number, rules: Partial<RulesConfig>, over: Partial<SetupOptions> = {}): SetupOptions => ({
  mode: 'pvp',
  mapSize: 'long',
  battleMode: 'arena',
  seed: 3,
  mapShape: 'rectangle',
  teams: n,
  seats: ALL_TEAM_IDS.slice(0, n).map((t, i) => ({ name: t, faction: t, controller: 'bot' as const, heroId: HEROES[i] })),
  rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, ...rules },
  ...over,
});

describe('three and four teams', () => {
  it('give every team a base, a hero, supports and its own entry in the state', () => {
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

  it('use the race a team picked (third plays Przymierze, fourth Horda, unless told otherwise)', () => {
    const s = createGame(game(4, { objective: 'control' }, { races: { dawn: 'horde', horde: 'dawn' } }));
    expect([raceOf(s, 'dawn'), raceOf(s, 'horde'), raceOf(s, 'third'), raceOf(s, 'fourth')]).toEqual(['horde', 'dawn', 'dawn', 'horde']);
    expect(s.factions.dawn.supportsAlive).toEqual(s.factions.fourth.supportsAlive);
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

  it('the last team with a living hero wins', () => {
    const s = createGame(game(3, { objective: 'control' }));
    for (const h of Object.values(s.heroes)) if (h.faction !== 'third') h.alive = false;
    // any end of a turn re-reads the victory conditions
    const over = applyAction(s, { type: 'endTurn' });
    expect(over.phase).toBe('over');
    expect(over.winner).toBe('third');
  });
});

describe('the crystals goal', () => {
  it('belongs to Przymierze against Horda: other pairs and more teams do not start', () => {
    const crystals = { objective: 'crystals' as const };
    expect(() => createGame({ ...game(2, crystals), mapShape: undefined, mapSize: 'short', rules: { ...DEFAULT_RULES, ...crystals } })).not.toThrow();
    expect(() => createGame({ ...game(2, crystals), mapShape: undefined, mapSize: 'short', races: { horde: 'dawn' }, rules: { ...DEFAULT_RULES, ...crystals } })).toThrow(/Przymierzu i Hordzie/);
    expect(() => createGame(game(3, crystals))).toThrow(/Przymierzu i Hordzie/);
  });
  it('is the fallback of a goal the level cannot play, so three teams cannot start there either', () => {
    expect(() => createGame(game(3, { objective: 'conquest', economy: false }))).toThrow(/Przymierzu i Hordzie/);
  });
});

describe('what three and four teams need', () => {
  it('a rectangle map of the digital ruleset, big enough, and no coop', () => {
    expect(() => createGame(game(3, { objective: 'control' }, { mapShape: 'ring' }))).toThrow(/prostokątnej/);
    expect(() => createGame(game(3, { objective: 'control' }, { mapShape: undefined }))).toThrow();
    expect(() => createGame(game(4, { objective: 'control' }, { mapSize: 'medium' }))).toThrow(/za mała/);
    expect(() => createGame(game(3, { objective: 'control' }, { mapSize: 'short' }))).toThrow(/za mała/);
    expect(() => createGame(game(3, { objective: 'control' }, { mode: 'coop' }))).toThrow(/Kooperacja/);
  });
});

describe('a coop game against any race of the computer', () => {
  it('the players face the computer playing Przymierze, and bots finish the game', () => {
    for (const objective of ['control', 'artifact'] as const) {
      const setup = game(2, { objective }, { mode: 'coop', mapSize: 'medium', teams: undefined, races: { horde: 'dawn' }, seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }] });
      const s = createGame(setup);
      const evil = Object.values(s.heroes).filter((h) => h.faction === 'horde');
      expect(evil.length).toBeGreaterThan(0);
      // the computer's heroes and supports are Przymierze's
      for (const h of evil) expect(['goldDragon', 'unicornKing', 'ancientBear']).toContain(h.id);
      // the player's own hero stays the player's
      expect(s.heroes.goldDragon.faction).toBe('dawn');
      expect(s.factions.horde.unusedHeroes).not.toContain('goldDragon');
      expect(playOut(s).phase).toBe('over');
    }
  });
});

describe('two sides of one race', () => {
  it('fight with units of their own: a support both sides bring gets an id of its own', () => {
    const setup = game(2, { objective: 'control' }, {
      mapSize: 'medium',
      races: { horde: 'dawn' },
      seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }, { name: 'B', faction: 'horde', controller: 'bot', heroId: 'unicornKing' }],
    });
    const s = playUntil(createGame(setup), (x) => x.phase === 'battle' && x.battle?.kind === 'heroes' && x.battle.stage === 'fight');
    const units = Object.values(s.battle!.units);
    for (const side of ['dawn', 'horde'] as const) expect(units.filter((u) => u.side === side)).toHaveLength(3);
    expect(new Set(units.map((u) => u.id)).size).toBe(6);
    // a copy of a unit keeps the definition it comes from
    for (const u of units) expect(u.id === u.defId || u.id === `${u.defId}~${u.side}`).toBe(true);
    expect(playOut(s).phase).toBe('over');
  });
});
