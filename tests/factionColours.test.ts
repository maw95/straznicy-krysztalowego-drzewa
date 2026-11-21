// The ribbons and the rings follow the faction that sits at a seat, not the seat (the author's report of 21.11: a Covenant player in the second seat got red).
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PACK_IDS } from '../src/engine/factions';
import { FACTION_RIBBON, FACTION_RING, teamFaction } from '../src/ui/common';

describe('faction colours', () => {
  it('every faction has its own ribbon file and ring colour', () => {
    const ribbons = PACK_IDS.map((f) => FACTION_RIBBON[f]);
    expect(new Set(ribbons).size).toBe(PACK_IDS.length);
    expect(new Set(PACK_IDS.map((f) => FACTION_RING[f])).size).toBe(PACK_IDS.length);
    for (const r of ribbons) expect(existsSync(`public/assets/ui/wstazka_${r}.webp`)).toBe(true);
  });

  it('a team ribbon is the one of the faction at the seat', () => {
    const state = { setup: { seats: [{ faction: 'dawn', race: 'horde' }, { faction: 'horde', race: 'dawn' }] } };
    expect(teamFaction(state, 'dawn')).toBe('horde');
    expect(teamFaction(state, 'horde')).toBe('dawn');
    expect(teamFaction(state, 'neutral')).toBe('neutral');
    expect(teamFaction(state, 'draw')).toBe('neutral');
  });
});
