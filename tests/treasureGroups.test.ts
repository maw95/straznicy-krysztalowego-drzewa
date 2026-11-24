import { describe, expect, it } from 'vitest';
import { groupTreasures } from '../src/ui/TreasureButton';

describe('chest: treasures of one kind in one icon, usable ones first', () => {
  const list = [{ kind: 'heal', id: 'a' }, { kind: 'sword', id: 'b' }, { kind: 'heal', id: 'c' }, { kind: 'seed', id: 'd' }, { kind: 'heal', id: 'e' }];

  it('groups by kind and counts', () => {
    const g = groupTreasures(list, () => true);
    expect(g.map((x) => [x.kind, x.items.length])).toEqual([['heal', 3], ['sword', 1], ['seed', 1]]);
  });

  it('puts the usable kinds before the greyed ones, keeping the order inside each part', () => {
    const g = groupTreasures(list, (k) => k === 'seed' || k === 'sword');
    expect(g.map((x) => x.kind)).toEqual(['sword', 'seed', 'heal']);
    expect(g.map((x) => x.usable)).toEqual([true, true, false]);
  });
});
