// Digital ruleset: large units (2 cells, head + tail).
import { describe, expect, it } from 'vitest';
import { arenaCell, wideCell, wideCellOf, battleAttack, battleItem, battleMove, cellsOf, dealDamage, reachableCells, tailOptions, unitAt, attackTargets } from '../src/engine/battle';
import { applyActionInPlace, createGame } from '../src/engine/game';
import { distance, parseKey } from '../src/engine/hex';
import { chooseAction } from '../src/engine/ai';
import { arenaSetup, type GameState, type SeatSetup } from '../src/engine/types';
import { battleFixture, playUntil, setup } from './helpers/engine';

const digital = (units: Parameters<typeof battleFixture>[1], battle: Parameters<typeof battleFixture>[2] = {}) =>
  battleFixture(createGame(setup({}, { ruleset: 'digital' })), units, battle);

/** Dragon with its head on (col, half) and tail on the left, (col-1, half-1). */
function dragonAt(s: GameState, col: number, half: number, tail = arenaCell(col - 1, half - 1)) {
  const d = s.battle!.units.goldDragon;
  d.pos = arenaCell(col, half);
  d.tail = tail;
  return d;
}

const dragon = { id: 'goldDragon', side: 'dawn' as const, col: 5, half: 9 };
const wolf = { id: 'werewolfLord', side: 'horde' as const, col: 9, half: 9 };

describe('large units', () => {
  it('lie on two cells only in the digital ruleset', () => {
    const s = digital([dragon, wolf]);
    expect(cellsOf(dragonAt(s, 5, 9))).toHaveLength(2);
    expect(unitAt(s.battle!, arenaCell(4, 8))?.id).toBe('goldDragon');
    expect(unitAt(s.battle!, arenaCell(5, 9))?.id).toBe('goldDragon');
  });

  it('moving right trails the tail on the left; moving left turns the unit around', () => {
    const s = digital([dragon, wolf]);
    dragonAt(s, 5, 9);
    battleMove(s, arenaCell(7, 9));
    const d = s.battle!.units.goldDragon;
    expect(d.pos).toBe(arenaCell(7, 9));
    expect(parseKey(d.tail!).q).toBe(6);

    const t = digital([dragon, wolf]);
    dragonAt(t, 5, 9);
    battleMove(t, arenaCell(3, 9));
    expect(parseKey(t.battle!.units.goldDragon.tail!).q).toBe(4);
  });

  it('the player may choose which tail cell it lies on', () => {
    const s = digital([dragon, wolf]);
    dragonAt(s, 5, 9);
    const to = arenaCell(7, 9);
    const options = tailOptions(s.battle!, s.battle!.units.goldDragon, to);
    expect(options.slice(0, 2).sort()).toEqual([arenaCell(6, 8), arenaCell(6, 10)].sort());
    battleMove(s, to, arenaCell(6, 10));
    expect(s.battle!.units.goldDragon.tail).toBe(arenaCell(6, 10));
    const t = digital([dragon, wolf]);
    dragonAt(t, 5, 9);
    expect(() => battleMove(t, to, arenaCell(2, 2))).toThrow();
  });

  it('cannot go where its tail does not fit', () => {
    // (7,9) is walled in: every one of its four tail neighbours is an obstacle.
    const walls = [arenaCell(6, 8), arenaCell(6, 10), arenaCell(8, 8), arenaCell(8, 10)];
    const s = digital([dragon, wolf], { obstacles: walls });
    dragonAt(s, 5, 9);
    expect(reachableCells(s, s.battle!.units.goldDragon).has(arenaCell(7, 9))).toBe(false);
    expect(reachableCells(s, s.battle!.units.goldDragon).has(arenaCell(7, 11))).toBe(true);
  });

  it('its own tail does not block it', () => {
    const s = digital([dragon, wolf]);
    const d = dragonAt(s, 5, 9);
    expect(reachableCells(s, d).has(d.tail!)).toBe(true);
  });

  it('attacks an enemy that touches only its tail', () => {
    const s = digital([dragon, { ...wolf, col: 3, half: 7 }]);
    dragonAt(s, 5, 9); // tail on (4,8); the wolf on (3,7) touches only the tail
    const d = s.battle!.units.goldDragon;
    expect(attackTargets(s, d).map((u) => u.id)).toEqual(['werewolfLord']);
    battleAttack(s, 'werewolfLord', false);
    expect(s.battle!.units.werewolfLord.hp).toBeLessThan(8);
  });

  it('is hit through its tail too, and lies there as a corpse that Resurrection stands up again', () => {
    const s = digital([dragon, wolf, { id: 'nymph', side: 'dawn', col: 1, half: 5 }]);
    const d = dragonAt(s, 5, 9);
    const [head, tail] = [d.pos!, d.tail!];
    dealDamage(s, d, 99, 'test');
    expect(cellsOf(d)).toEqual([]);
    expect([d.corpse, d.corpseTail]).toEqual([head, tail]);
    expect(unitAt(s.battle!, tail)).toBeUndefined();
    s.items.e1 = { id: 'e1', kind: 'resurrection', owner: 'dawn', foundBy: null };
    s.factions.dawn.inventory.push('e1');
    s.battle!.activation = { unitId: 'nymph', moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0 };
    battleItem(s, { itemId: 'e1', targetId: 'goldDragon' });
    expect([d.alive, d.pos, d.tail, d.corpse, d.corpseTail]).toEqual([true, head, tail, undefined, undefined]);
  });

  it('classic ruleset: still one cell', () => {
    const s = battleFixture(createGame(setup()), [dragon, wolf]);
    battleMove(s, arenaCell(7, 9));
    expect(s.battle!.units.goldDragon.tail).toBeUndefined();
  });
});

const arenaSeats = (): SeatSetup[] => [
  { name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' },
  { name: 'B', faction: 'horde', controller: 'bot', heroId: 'werewolfLord' },
];

describe('large units in a bot battle', () => {
  const digitalArena = (seed: number) => {
    const o = arenaSetup(arenaSeats(), seed);
    return createGame({ ...o, rules: { ...o.rules, ruleset: 'digital' } });
  };

  it('are deployed with the tail in the start column and the head one column towards the enemy', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const s = playUntil(digitalArena(seed), (x) => x.battle?.stage === 'deploy');
      const d = s.battle!.units.goldDragon;
      const left = s.battle!.attacker === 'dawn';
      expect(s.battle!.layout).toBe('wide');
      expect(wideCellOf(d.tail!).col).toBe(left ? 0 : 12);
      expect(wideCellOf(d.pos!).col).toBe(left ? 1 : 11);
      expect(wideCellOf(d.pos!).row).toBe(wideCellOf(d.tail!).row);
      expect(distance(parseKey(d.pos!), parseKey(d.tail!))).toBe(1);
    }
  });

  it('can be repositioned in the deploy stage by choosing the tail cell', () => {
    // Przymierze deploys first when it is the attacker; find such a seed.
    const seed = [1, 2, 3, 4, 5, 6, 7, 8].find((n) => digitalArena(n).battle!.attacker === 'dawn')!;
    const s = playUntil(digitalArena(seed), (x) => x.battle?.stage === 'deploy');
    const b = s.battle!;
    applyActionInPlace(s, { type: 'deployUnits', faction: 'dawn', positions: { goldDragon: wideCell(0, 1) } });
    expect(b.units.goldDragon.tail).toBe(wideCell(0, 1));
    expect(b.units.goldDragon.pos).toBe(wideCell(1, 1));
  });

  it('play whole battles without two units ever sharing a cell', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const s = digitalArena(seed);
      let steps = 0;
      while (s.phase !== 'over' && steps++ < 6000) {
        applyActionInPlace(s, chooseAction(s)!);
        const b = s.battle;
        if (!b) continue;
        const seen = new Set<string>();
        for (const u of Object.values(b.units)) {
          if (!u.alive) {
            expect(u.pos).toBeNull();
            continue;
          }
          const cells = cellsOf(u);
          if (u.tail) expect(distance(parseKey(u.pos!), parseKey(u.tail))).toBe(1);
          for (const c of cells) {
            expect(seen.has(c)).toBe(false);
            seen.add(c);
          }
        }
      }
      expect(s.phase).toBe('over');
    }
  });
});
