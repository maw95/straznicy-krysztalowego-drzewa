import { describe, expect, it } from 'vitest';
import { FACTION_HEROES, type FactionId } from '../src/engine/data';
import { PACK_IDS } from '../src/engine/factions';
import { resolveRandomSeats, type SeatDraft } from '../src/ui/setupShared';

const seat = (race: FactionId, heroId: string, extra: Partial<SeatDraft> = {}): SeatDraft => ({ name: 'G', faction: 'dawn', race, controller: 'bot', heroId, ...extra });
const o = { offered: PACK_IDS, heroesOf: (r: FactionId) => FACTION_HEROES[r], twoFactions: true };

describe('resolveRandomSeats (random faction and hero on the setup screen)', () => {
  it('leaves a table without any die untouched (and strips the draft flags)', () => {
    const out = resolveRandomSeats([seat('dawn', FACTION_HEROES.dawn[0]), seat('horde', FACTION_HEROES.horde[0])], o);
    expect(out.map((s) => s.heroId)).toEqual([FACTION_HEROES.dawn[0], FACTION_HEROES.horde[0]]);
    expect(out.every((s) => !('randomRace' in s) && !('randomHero' in s))).toBe(true);
  });

  it('always draws a legal table: heroes differ, at most three seats of a faction, two factions at least', () => {
    for (let n = 0; n < 200; n++) {
      const seats = [seat('dawn', FACTION_HEROES.dawn[0], { randomRace: true, randomHero: true }), seat('dawn', FACTION_HEROES.dawn[1], { randomRace: true, randomHero: true }),
        seat('dawn', FACTION_HEROES.dawn[2], { randomRace: true, randomHero: true }), seat('horde', FACTION_HEROES.horde[0], { randomHero: true }), seat('horde', FACTION_HEROES.horde[1])];
      const out = resolveRandomSeats(seats, o);
      expect(new Set(out.map((s) => s.heroId)).size).toBe(out.length);
      for (const s of out) expect(FACTION_HEROES[s.race as FactionId]).toContain(s.heroId);
      expect(new Set(out.map((s) => s.race)).size).toBeGreaterThanOrEqual(2);
      for (const r of new Set(out.map((s) => s.race))) expect(out.filter((s) => s.race === r).length).toBeLessThanOrEqual(3);
      expect(out[4].heroId).toBe(FACTION_HEROES.horde[1]);          // a fixed seat keeps its hero
      expect(out[3].race).toBe('horde');                              // a random hero stays in the faction
    }
  });

  it('draws every faction but the one that would leave a rivalry with a single faction, over many tables', () => {
    const seen = new Set<string>();
    const heroes = new Set<string>();
    for (let n = 0; n < 600; n++) {
      const [a] = resolveRandomSeats([seat('dawn', FACTION_HEROES.dawn[0], { randomRace: true, randomHero: true }), seat('horde', FACTION_HEROES.horde[0])], o);
      seen.add(String(a.race));
      heroes.add(a.heroId);
    }
    expect(seen.size).toBe(PACK_IDS.length - 1); // the other seat is a fixed Horda: a second Horda would make one faction
    expect(seen.has('horde')).toBe(false);
    expect(heroes.size).toBeGreaterThanOrEqual((PACK_IDS.length - 1) * 3 - 3);
  });
});
