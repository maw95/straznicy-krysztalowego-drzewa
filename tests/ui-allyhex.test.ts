// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { activeHero, createGame } from '../src/engine/game';
import { mapNeighbors } from '../src/engine/map';
import { heroTileCost } from '../src/engine/sites';
import { reachablePaths } from '../src/ui/AdventureView';
import { DEFAULT_RULES } from '../src/engine/types';

describe('the world map: a hex held by an ally', () => {
  it('shows no move-cost hint on it and is no way through', () => {
    const s = createGame({
      mode: 'coop', mapSize: 'short', battleMode: 'arena', seed: 7, rules: { ...DEFAULT_RULES },
      seats: [{ name: 'A', faction: 'dawn', controller: 'human', heroId: 'goldDragon' }, { name: 'B', faction: 'dawn', controller: 'human', heroId: 'silverDragon' }],
    });
    const hero = activeHero(s)!;
    const other = Object.values(s.heroes).find((h) => h.id !== hero.id && h.faction === hero.faction)!;
    for (const t of Object.values(s.tiles)) t.revealed = true;
    s.movePoints = 6;
    const free = mapNeighbors(s.tiles, hero.pos).find((n) => heroTileCost(hero, s.tiles[n]) !== null && !s.tiles[n].crystalId && s.tiles[n].home !== hero.faction)!;
    const before = reachablePaths(s);
    expect(before.has(free)).toBe(true);
    other.pos = free;
    const after = reachablePaths(s);
    expect(after.has(free)).toBe(false);
    for (const r of after.values()) expect(r.path).not.toContain(free);
  });
});
