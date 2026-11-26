// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { FACTION_PACKS, PLAYABLE_IDS } from '../src/engine/factions';
import { openFactions } from '../src/ui/setupShared';

describe('playable factions', () => {
  it('are the five finished ones, in the order of the screens', () => {
    expect(PLAYABLE_IDS).toEqual(['dawn', 'horde', 'herds', 'clans', 'tides']);
  });

  it('the screens offer only those; the unfinished factions keep their data', () => {
    expect(openFactions()).toEqual(PLAYABLE_IDS);
    for (const id of ['undead', 'frost', 'free', 'sands', 'swarm'] as const) expect(FACTION_PACKS[id]).toBeDefined();
  });
});
