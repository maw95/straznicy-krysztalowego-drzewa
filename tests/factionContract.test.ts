// The contract of a faction pack (src/engine/factions): a new faction is accepted only when it is complete. Runs over the whole registry, so adding a faction adds its checks.

import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UNITS } from '../src/engine/data';
import { BUILDING_NAMES, BUILDING_PARENT } from '../src/engine/kingdom';
import { ECONOMY } from '../src/engine/economy';
import { artId } from '../src/ui/common';
import { FACTION_PACKS, PACK_IDS } from '../src/engine/factions';

describe.each(PACK_IDS)('faction pack %s', (id) => {
  const pack = FACTION_PACKS[id];

  it('has three heroes, three starting supports, four units for the tiers 2-5, four alternatives and a legend', () => {
    expect(pack.id).toBe(id);
    expect(pack.heroes).toHaveLength(3);
    expect(pack.supports).toHaveLength(3);
    expect(pack.tierUnits).toHaveLength(4);
    expect(pack.altUnits).toHaveLength(4);
    expect(pack.name.length).toBeGreaterThan(2);
  });

  it('only names units that exist, of this faction, of the right kind, each once', () => {
    const all = [...pack.heroes, ...pack.supports, ...pack.tierUnits, ...pack.altUnits, pack.legend];
    expect(new Set(all).size).toBe(all.length);
    for (const u of all) {
      expect(UNITS[u], u).toBeDefined();
      expect(UNITS[u].side, u).toBe(id);
    }
    for (const h of pack.heroes) expect(UNITS[h].kind).toBe('hero');
    for (const s of [...pack.supports, ...pack.tierUnits, ...pack.altUnits, pack.legend]) expect(UNITS[s].kind, s).toBe('support');
  });

  it('has a card picture and a portrait for every unit', () => {
    for (const u of [...pack.heroes, ...pack.supports, ...pack.tierUnits, ...pack.altUnits, pack.legend]) {
      expect(existsSync(`public/assets/cards/art/${artId(u)}.jpg`), `no card art of ${u}`).toBe(true);
      expect(existsSync(`public/assets/cards/portraits/${artId(u)}.jpg`), `no portrait of ${u}`).toBe(true);
    }
  });

  it('has its own buildings: the mechanic first, each with a name, a price and a parent', () => {
    expect(pack.buildings).toHaveLength(3);
    expect(pack.buildings[0]).toBe(pack.mechanic.building);
    for (const b of pack.buildings) {
      expect(BUILDING_NAMES[b as keyof typeof BUILDING_NAMES], b).toBeDefined();
      expect(Object.keys(ECONOMY.cost), b).toContain(b);
      expect(BUILDING_PARENT[b as keyof typeof BUILDING_PARENT], b).toBeDefined();
    }
  });

  it('names its Primal Spark, its mechanic and its settlements', () => {
    expect(pack.sparkName.length).toBeGreaterThan(5);
    expect(pack.mechanic.name.length).toBeGreaterThan(3);
    expect(pack.settlementNames.length).toBeGreaterThanOrEqual(10);
    expect(new Set(pack.settlementNames).size).toBe(pack.settlementNames.length);
  });
});

describe('the registry', () => {
  it('has distinct names and no building shared between factions', () => {
    const names = PACK_IDS.map((i) => FACTION_PACKS[i].name);
    expect(new Set(names).size).toBe(names.length);
    const buildings = PACK_IDS.flatMap((i) => FACTION_PACKS[i].buildings);
    expect(new Set(buildings).size).toBe(buildings.length);
  });
});
