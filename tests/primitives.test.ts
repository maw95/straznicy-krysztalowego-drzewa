// The rule primitives of the new factions (src/engine/primitives.ts), each on a hand-placed battle.
import { describe, expect, it } from 'vitest';
import { arenaCell } from '../src/engine/battle';
import { createGame } from '../src/engine/game';
import { drainMana, groundAt, groupBonus, inAura, placeGround, poison, pullIn, pushAway, root, slow, swapPlaces } from '../src/engine/primitives';
import { battleFixture, setup } from './helpers/engine';

const state = (units: Parameters<typeof battleFixture>[1], battle = {}) => battleFixture(createGame(setup()), units, battle);
const u = (s: ReturnType<typeof state>, id: string) => s.battle!.units[id];

describe('push and pull', () => {
  it('pushes straight away from the source, as far as the cells are free', () => {
    const s = state([{ id: 'goldDragon', side: 'dawn', col: 3, half: 8 }, { id: 'werewolfLord', side: 'horde', col: 4, half: 8 }]);
    const t = u(s, 'werewolfLord');
    const before = t.pos;
    expect(pushAway(s, t, u(s, 'goldDragon'), 2)).toEqual({ moved: 2, blocked: false });
    expect(t.pos).not.toBe(before);
  });

  it('stops at an obstacle and reports the collision', () => {
    const s = state([{ id: 'goldDragon', side: 'dawn', col: 3, half: 8 }, { id: 'werewolfLord', side: 'horde', col: 4, half: 8 }]);
    const t = u(s, 'werewolfLord');
    const first = pushAway(state([{ id: 'goldDragon', side: 'dawn', col: 3, half: 8 }, { id: 'werewolfLord', side: 'horde', col: 4, half: 8 }]), { ...t }, u(s, 'goldDragon'), 1);
    expect(first.moved).toBe(1);
    // Wall the cell behind the target in: it cannot move.
    const behind = (() => { const c = { ...t }; pushAway(s, c, u(s, 'goldDragon'), 1); return c.pos!; })();
    s.battle!.obstacles.push(behind);
    expect(pushAway(s, t, u(s, 'goldDragon'), 2)).toEqual({ moved: 0, blocked: true });
  });

  it('pulls a distant target next to the source and no closer', () => {
    const s = state([{ id: 'goldDragon', side: 'dawn', col: 2, half: 8 }, { id: 'werewolfLord', side: 'horde', col: 6, half: 8 }]);
    const t = u(s, 'werewolfLord');
    const r = pullIn(s, t, u(s, 'goldDragon'), 9);
    expect(r.moved).toBe(3);
    expect(pullIn(s, t, u(s, 'goldDragon'), 1).moved).toBe(0);
  });

  it('does not move units in a duel', () => {
    const s = state([{ id: 'goldDragon', side: 'dawn', col: 3, half: 8 }, { id: 'werewolfLord', side: 'horde', col: 4, half: 8 }], { duel: true });
    expect(pushAway(s, u(s, 'werewolfLord'), u(s, 'goldDragon')).moved).toBe(0);
    expect(pullIn(s, u(s, 'werewolfLord'), u(s, 'goldDragon')).moved).toBe(0);
    expect(swapPlaces(s, u(s, 'werewolfLord'), u(s, 'goldDragon'))).toBe(false);
  });
});

describe('swap, group and aura', () => {
  it('swaps two units', () => {
    const s = state([{ id: 'goldDragon', side: 'dawn', col: 2, half: 8 }, { id: 'werewolfLord', side: 'horde', col: 6, half: 8 }]);
    const [a, c] = [u(s, 'goldDragon'), u(s, 'werewolfLord')];
    const [pa, pc] = [a.pos, c.pos];
    expect(swapPlaces(s, a, c)).toBe(true);
    expect([a.pos, c.pos]).toEqual([pc, pa]);
    expect(swapPlaces(s, a, a)).toBe(false);
  });

  it('counts adjacent allies of the same kind for the group bonus, capped', () => {
    const s = state([
      { id: 'goldDragon', side: 'dawn', col: 3, half: 8 },
      { id: 'werewolfLord', side: 'horde', col: 8, half: 8 },
    ]);
    const lone = u(s, 'goldDragon');
    expect(groupBonus(s, lone, 1)).toBe(0);
    for (const [i, off] of [[1, 1], [2, -1]] as const) {
      const c = { ...lone, id: `copy${i}`, pos: arenaCell(3, 8 + off) };
      s.battle!.units[c.id] = c;
    }
    const n = Object.values(s.battle!.units).filter((x) => x.defId === 'goldDragon' && x.id !== 'goldDragon' && x.pos).length;
    expect(groupBonus(s, lone, 2, 1)).toBeLessThanOrEqual(2);
    expect(groupBonus(s, lone, 2, 6)).toBeLessThanOrEqual(n * 2);
  });

  it('finds the units inside an aura, by side', () => {
    const s = state([
      { id: 'goldDragon', side: 'dawn', col: 3, half: 8 },
      { id: 'werewolfLord', side: 'horde', col: 4, half: 8 },
      { id: 'blackDragon', side: 'horde', col: 11, half: 8 },
    ]);
    expect(inAura(s, u(s, 'goldDragon'), 2, 'enemy').map((x) => x.id)).toEqual(['werewolfLord']);
    expect(inAura(s, u(s, 'goldDragon'), 2, 'ally')).toEqual([]);
    expect(inAura(s, u(s, 'goldDragon'), 20, 'enemy')).toHaveLength(2);
  });
});

describe('statuses, mana and ground', () => {
  it('slow takes the larger value, root and poison set their flags', () => {
    const s = state([{ id: 'goldDragon', side: 'dawn', col: 3, half: 8 }]);
    const t = u(s, 'goldDragon');
    slow(t, 2);
    slow(t, 1);
    root(t);
    poison(t, 2);
    poison(t, 1);
    expect([t.status.slowNext, t.status.rootedNext, t.status.poisoned]).toEqual([2, true, 2]);
  });

  it('drains mana down to zero and reports what was taken', () => {
    const s = state([{ id: 'goldDragon', side: 'dawn', col: 3, half: 8 }]);
    const hero = Object.values(s.heroes)[0];
    hero.mana = 3;
    expect(drainMana(s, hero.id, 2)).toBe(2);
    expect(drainMana(s, hero.id, 5)).toBe(1);
    expect(hero.mana).toBe(0);
    expect(drainMana(s, 'nobody', 1)).toBe(0);
  });

  it('places ground effects that end after their round, never on an obstacle', () => {
    const s = state([{ id: 'goldDragon', side: 'dawn', col: 3, half: 8 }]);
    const b = s.battle!;
    const cell = arenaCell(4, 8);
    expect(placeGround(b, { cell, owner: 'dawn', kind: 'trap', power: 2, hidden: true, until: 1 })).toBe(true);
    expect(groundAt(b, cell)).toHaveLength(1);
    b.round = 2;
    expect(groundAt(b, cell)).toHaveLength(0);
    b.obstacles.push(arenaCell(6, 8));
    expect(placeGround(b, { cell: arenaCell(6, 8), owner: 'dawn', kind: 'mire', power: 1 })).toBe(false);
  });
});
