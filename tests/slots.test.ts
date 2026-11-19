// Seats name a race (SeatSetup.race): the sides of a table are slots filled by the factions in the order they sit, and a side reads the data of its seat's race.
import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/game';
import { FACTION_HEROES, type FactionId } from '../src/engine/data';
import { assignSlots, raceOf, seatTable, teamsOf } from '../src/engine/teams';
import { DEFAULT_RULES, type SetupOptions } from '../src/engine/types';
import { playOut } from './helpers/engine';

/** A table of bots, one seat per race, seated as `assignSlots` says. */
const table = (races: FactionId[], objective: SetupOptions['rules']['objective'], over: Partial<SetupOptions> = {}): SetupOptions => {
  const slots = assignSlots(races);
  return {
    mode: 'pvp',
    mapSize: 'long',
    battleMode: 'arena',
    seed: 5,
    mapShape: 'rectangle',
    seats: races.map((race, i) => ({ name: `${race}${i}`, faction: slots[i], race, controller: 'bot' as const, heroId: FACTION_HEROES[race][i % 3] })),
    rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, objective },
    ...over,
  };
};

describe('assignSlots', () => {
  it('the first two factions take dawn and horde, whatever they are; the next ones third and fourth', () => {
    expect(assignSlots(['horde', 'dawn'])).toEqual(['dawn', 'horde']);
    expect(assignSlots(['dawn', 'horde', 'dawn', 'horde'])).toEqual(['dawn', 'horde', 'dawn', 'horde']);
    expect(assignSlots(['horde', 'horde', 'dawn'])).toEqual(['dawn', 'dawn', 'horde']);
    expect(assignSlots([])).toEqual([]);
  });
});

describe('seatTable', () => {
  const seat = (race: FactionId) => ({ name: race, faction: 'dawn' as const, race, controller: 'bot' as const, heroId: 'x' });
  it('seats the races in their slots and keeps the race only when the table is not the old one', () => {
    expect(seatTable([seat('horde'), seat('dawn')]).map((s) => [s.faction, s.race])).toEqual([['dawn', 'horde'], ['horde', 'dawn']]);
    const old = seatTable([seat('dawn'), seat('horde'), seat('dawn')]);
    expect(old.map((s) => s.faction)).toEqual(['dawn', 'horde', 'dawn']);
    expect(old.every((s) => s.race === undefined)).toBe(true);
  });
  it('leaves seats without a race alone', () => {
    const s = { name: 'a', faction: 'horde' as const, controller: 'bot' as const, heroId: 'x' };
    expect(seatTable([s])).toEqual([s]);
  });
});

describe('a table with races', () => {
  it('the sides are the slots the seats use, and a side reads the race of its seat', () => {
    const s = createGame(table(['horde', 'dawn'], 'control'));
    expect(teamsOf(s)).toEqual(['dawn', 'horde']);
    expect([raceOf(s, 'dawn'), raceOf(s, 'horde')]).toEqual(['horde', 'dawn']);
    expect(Object.values(s.heroes).find((h) => h.faction === 'dawn')?.id).toBe(FACTION_HEROES.horde[0]);
    expect(s.factions.dawn.unusedHeroes.concat(Object.keys(s.heroes))).toContain('blackDragon');
  });

  it('two seats of one race are one side, and one race alone is no game', () => {
    const s = createGame(table(['dawn', 'horde', 'dawn'], 'control'));
    expect(teamsOf(s)).toEqual(['dawn', 'horde']);
    expect(() => createGame(table(['dawn', 'dawn'], 'control'))).toThrow(/dwie różne frakcje/);
  });

  it('a game without races reads like before', () => {
    const old = table(['dawn', 'horde'], 'control');
    for (const seat of old.seats) delete seat.race;
    const s = createGame(old);
    expect([raceOf(s, 'dawn'), raceOf(s, 'horde'), raceOf(s, 'third'), raceOf(s, 'fourth')]).toEqual(['dawn', 'horde', 'dawn', 'horde']);
  });

  it('coop and the arena refuse a race that is not the side\'s own', () => {
    const coop = { ...table(['dawn', 'horde'], 'survival'), mode: 'coop' as const };
    coop.seats = [{ ...coop.seats[0], race: 'horde' }];
    expect(() => createGame(coop)).toThrow(/tylko w rywalizacji/);
  });

  for (const objective of ['control', 'conquest', 'relic', 'boss', 'artifact'] as const) {
    it(`swapped races (horde on the first slot) play out: ${objective}`, () => {
      for (const seed of [1, 2]) {
        const end = playOut(createGame(table(['horde', 'dawn'], objective, { seed })));
        expect(end.phase).toBe('over');
      }
    });
  }

  it('the crystals goal needs Przymierze on the first side and Horda on the second', () => {
    const crystals = table(['horde', 'dawn'], 'crystals', { mapShape: undefined, mapSize: 'short' });
    expect(() => createGame(crystals)).toThrow(/Przymierzu i Hordzie/);
    expect(() => createGame(table(['dawn', 'horde'], 'crystals', { mapShape: undefined, mapSize: 'short' }))).not.toThrow();
  });
});
