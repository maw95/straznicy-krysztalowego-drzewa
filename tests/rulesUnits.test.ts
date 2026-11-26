import { describe, expect, it } from 'vitest';
import { SECRET_HEROES, UNITS } from '../src/engine/data';
import { PLAYABLE_IDS } from '../src/engine/factions';
import { ruleUnitSections } from '../src/ui/rulesUnits';

describe('Zasady i karty → Jednostki', () => {
  const sections = ruleUnitSections();

  it('divides the units by faction only, the neutral ones last', () => {
    expect(sections.map((s) => s.id)).toEqual([...PLAYABLE_IDS, 'neutral']);
  });

  it('shows every unit of the finished factions and every neutral one exactly once (secret heroes left out)', () => {
    const secret = new Set(Object.values(SECRET_HEROES).flat());
    for (const { id, units } of sections) {
      const expected = Object.values(UNITS).filter((u) => u.side === id && !secret.has(u.id)).map((u) => u.id);
      expect([...units].sort()).toEqual(expected.sort());
    }
  });

  it('puts the main heroes first (the fourth too), then the commanders, then the supports by tier', () => {
    const dawn = sections[0].units;
    expect(dawn.slice(0, 7)).toEqual(['goldDragon', 'unicornKing', 'ancientBear', 'moonWolf', 'dawnKnight', 'dawnHuntress', 'dawnSage']);
    expect(dawn.slice(7).map((u) => UNITS[u].kind)).toEqual(dawn.slice(7).map(() => 'support'));
  });
});
