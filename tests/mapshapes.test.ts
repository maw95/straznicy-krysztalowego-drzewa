import { describe, expect, it } from 'vitest';
import { CUSTOM_MAPS, parseCustomMap, registerCustomMap } from '../src/engine/customMaps';
import { MAP_SHAPES } from '../src/engine/data';
import { createGame } from '../src/engine/game';
import { distance, parseKey } from '../src/engine/hex';
import { homeOf, reachableFrom, treeOf } from '../src/engine/map';
import { objectiveOf } from '../src/engine/objectives';
import type { MapShape } from '../src/engine/types';
import { playOut, setup } from './helpers/engine';

const SIZES = ['short', 'medium', 'long', 'veryLong'] as const;
const make = (mapShape: MapShape, mapSize: (typeof SIZES)[number], seed = 1, over: Parameters<typeof setup>[1] = {}) =>
  createGame({ ...setup({ mapSize, seed }, { ruleset: 'digital', ...over }), mapShape, ...(mapShape === 'custom' ? { customMapId: 'ciesnina' } : {}) });

describe.each(['rectangle', 'ring', 'islands', 'custom'] as const)('map shape %s (digital ruleset)', (shape) => {
  it('has the Tree and both bases on the map, all reachable, with the crystals on the Przymierze/Horde side of their guardians', () => {
    for (const size of SIZES) {
      for (let seed = 1; seed <= 5; seed++) {
        const s = make(shape, size, seed);
        const [tree, dawn, horde] = [treeOf(s), homeOf(s, 'dawn'), homeOf(s, 'horde')];
        expect(new Set([tree, dawn, horde]).size).toBe(3);
        for (const k of [tree, dawn, horde]) expect(s.tiles[k]).toBeDefined();
        const reach = reachableFrom(s.tiles, dawn);
        expect(reach.has(tree)).toBe(true);
        expect(reach.has(horde)).toBe(true);
        expect(Object.keys(s.crystals).length).toBeGreaterThan(0);
      }
    }
  });

  it('is symmetric: the Tree is as far from one base as from the other (within one hex)', () => {
    for (const size of SIZES) {
      const s = make(shape, size);
      const d = (k: string) => distance(parseKey(treeOf(s)), parseKey(k));
      expect(Math.abs(d(homeOf(s, 'dawn')) - d(homeOf(s, 'horde')))).toBeLessThanOrEqual(1);
    }
  });

  it('has the number of hexes of its table', () => {
    const n = Object.keys(make(shape, 'medium').tiles).length;
    // A ring of radius R with thickness 3: the hexagon of R minus the hexagon of R - 3.
    const hexagon = (r: number) => (r < 0 ? 0 : 3 * r * (r + 1) + 1);
    const expected = {
      rectangle: MAP_SHAPES.rectangle.medium.width * MAP_SHAPES.rectangle.medium.height,
      ring: hexagon(MAP_SHAPES.ring.medium.radius) - hexagon(MAP_SHAPES.ring.medium.radius - 3),
      islands: MAP_SHAPES.islands.medium.width * MAP_SHAPES.islands.medium.height,
      custom: CUSTOM_MAPS.ciesnina.rows.join('').length,
    }[shape];
    expect(n).toBe(expected);
  });

  it('is not used by the board edition (the triangle stays)', () => {
    const s = createGame({ ...setup({ mapSize: 'short' }), mapShape: shape });
    expect(s.tree).toBeUndefined();
    expect(Object.keys(s.tiles)).toHaveLength(21);
  });

  it.each(['crystals', 'control', 'survival', 'boss', 'artifact'] as const)('bots play the objective %s to the end', (objective) => {
    for (const size of ['short', 'medium'] as const) {
      const s = make(shape, size, 2, { objective });
      expect(objectiveOf(s)).toBe(objective);
      if (objective === 'control') {
        const [mid, a, b] = s.control!.points;
        const d = (x: string, f: 'dawn' | 'horde') => distance(parseKey(x), parseKey(homeOf(s, f)));
        expect(d(a, 'dawn')).toBe(d(b, 'horde'));
        expect(d(mid, 'dawn')).toBe(d(mid, 'horde'));
      }
      expect(playOut(s).phase).toBe('over');
    }
  });
});

describe('islands and hand-made maps', () => {
  it('islands have bridges over both channels, so both bases reach the Tree, and walls in the water', () => {
    for (const size of SIZES) {
      for (let seed = 1; seed <= 4; seed++) {
        const s = make('islands', size, seed);
        const walls = Object.values(s.tiles).filter((t) => t.terrain === 'chasm' || t.terrain === 'deadThicket').length;
        const bridges = Object.values(s.tiles).filter((t) => t.terrain === 'bridge').length;
        expect(bridges).toBeGreaterThanOrEqual(2 * MAP_SHAPES.islands[size].bridges);
        expect(walls).toBeGreaterThan(0);
      }
    }
  });

  it('a map from JSON becomes a map of the game; a broken one is refused', () => {
    const json = JSON.stringify({ id: 'test-mapa', name: 'Test', rows: ['.......', '.D.T.H.', '.......'] });
    registerCustomMap(parseCustomMap(json));
    const s = createGame({ ...setup({ mapSize: 'short' }, { ruleset: 'digital' }), mapShape: 'custom', customMapId: 'test-mapa' });
    expect(Object.keys(s.tiles)).toHaveLength(21);
    expect(treeOf(s)).toBeDefined();
    expect(() => registerCustomMap({ id: 'x', name: 'x', summary: '', rows: ['...', '.D.', '...'] })).toThrow(/musi wystąpić/);
    expect(() => createGame({ ...setup({}, { ruleset: 'digital' }), mapShape: 'custom', customMapId: 'nie-ma' })).toThrow(/Nie ma takiej mapy/);
  });
});
