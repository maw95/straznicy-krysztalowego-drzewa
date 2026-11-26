// Backlog 92: half of the groups that guard the map are supports of a free faction (a finished one nobody at the table plays).

import { describe, expect, it } from 'vitest';
import { ENCOUNTER_GUARDS, UNITS, supportTier, type FactionId } from '../src/engine/data';
import { encounterUnits, factionShare, factionUnits, freeFactions, groupPower, guardTarget, type EncounterTier } from '../src/engine/encounters';
import { FACTION_PACKS, PLAYABLE_IDS } from '../src/engine/factions';
import { createGame } from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import { DEFAULT_RULES, type GameState } from '../src/engine/types';
import { fightGuards } from './helpers/guards';

const game = (seed: number, races: FactionId[]): GameState =>
  createGame({
    mode: 'pvp',
    mapSize: 'veryLong',
    mapShape: 'rectangle',
    battleMode: 'arena',
    seed,
    seats: races.map((race, i) => ({ name: `G${i}`, faction: (['dawn', 'horde', 'third', 'fourth'] as const)[i], race, controller: 'bot' as const, heroId: FACTION_PACKS[race].heroes[0] })),
    rules: { ...DEFAULT_RULES, ruleset: 'digital', objective: 'control', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true },
  });
const supportsOf = (f: FactionId): string[] => [...FACTION_PACKS[f].supports, ...FACTION_PACKS[f].tierUnits, ...FACTION_PACKS[f].altUnits, FACTION_PACKS[f].legend];
const factionOf = (id: string): FactionId | undefined => PLAYABLE_IDS.find((f) => supportsOf(f).includes(id));

describe('groups of a free faction on the map', () => {
  it('the free factions are the finished ones nobody plays', () => {
    expect(freeFactions(game(1, ['dawn', 'dawn']))).toEqual(['horde', 'herds', 'clans', 'tides']);
    expect(freeFactions(game(1, ['dawn', 'horde', 'herds', 'clans']))).toEqual(['tides']);
  });

  it('half of the groups are of a free faction, each of one faction only, the others neutral', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = game(seed, ['dawn', 'horde']);
      const groups = Object.values(s.crystals).filter((c) => c.encounter);
      const of = groups.map((c) => {
        const factions = new Set(c.encounter!.map(factionOf));
        expect(factions.size).toBe(1);
        const f = [...factions][0];
        if (!f) expect(c.encounter!.every((id) => UNITS[id].side === 'neutral')).toBe(true);
        else expect(['herds', 'clans', 'tides']).toContain(f);
        expect(c.guardian).toBe(c.encounter![0]);
        return f;
      });
      // The encounters of the map and the defenders of the neutral settlements are halved apart (an odd count by a draw).
      for (const prefix of ['enc', 'def']) {
        const ids = groups.map((c, i) => (c.id.startsWith(prefix) ? of[i] : null)).filter((f) => f !== null);
        const taken = ids.filter(Boolean).length;
        expect(Math.abs(taken - ids.length / 2)).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it('halves an even number exactly and an odd one by a draw', () => {
    const rng = new Rng(5);
    for (const n of [0, 1, 2, 5, 8, 11]) expect([Math.floor(n / 2), Math.ceil(n / 2)]).toContain(factionShare(n, rng).filter(Boolean).length);
  });

  it('the legend leads only the strongest groups, and a group is about as strong as the neutral one it replaces', () => {
    const rng = new Rng(11);
    for (const f of PLAYABLE_IDS) {
      for (const tier of [0, 1, 2] as EncounterTier[]) {
        for (let i = 0; i < 40; i++) {
          const target = guardTarget(f, tier, groupPower(encounterUnits(tier, 'stone', rng)));
          const units = factionUnits(f, tier, target, rng);
          expect(units.every((id) => factionOf(id) === f)).toBe(true);
          expect(units.slice(1).some((id) => supportTier(id) === 6)).toBe(false);
          if (tier < 2) expect(units.some((id) => supportTier(id) === 6)).toBe(false);
          expect(Math.abs(groupPower(units) / target - 1)).toBeLessThan(ENCOUNTER_GUARDS.tolerance + 0.12);
        }
      }
    }
  });

  it('every support of every finished faction fights as a guard to the end of a battle', () => {
    for (const [fi, f] of PLAYABLE_IDS.entries()) {
      const units = supportsOf(f);
      for (let i = 0; i < units.length; i += 3) {
        const group = units.slice(i, i + 3);
        for (const hero of [PLAYABLE_IDS[(fi + 1) % 5], PLAYABLE_IDS[(fi + 3) % 5]]) {
          expect(() => fightGuards(100 + i, hero, 2, group), `${group.join('+')} against ${hero}`).not.toThrow();
        }
      }
    }
  });
});
