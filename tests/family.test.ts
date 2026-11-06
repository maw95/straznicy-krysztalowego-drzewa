import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { FAMILY } from '../src/engine/data';
import { activeHero, applyAction, createGame, isChildHero } from '../src/engine/game';
import type { SeatSetup } from '../src/engine/types';
import { describeAction } from '../src/ui/hint';
import { playOut, setup } from './helpers/engine';

const seats = (child: boolean): SeatSetup[] => [
  { name: 'Rodzic', faction: 'dawn', controller: 'human', heroId: 'goldDragon' },
  { name: 'Dziecko', faction: 'dawn', controller: 'human', heroId: 'unicornKing', child: child || undefined },
];
const family = (over: Parameters<typeof setup>[1] = {}, childFlag = true, mode: 'coop' | 'pvp' = 'coop') => createGame(setup({ mode, seats: seats(childFlag) }, { ruleset: 'digital', ...over }));

describe('family mode (digital ruleset, coop)', () => {
  it('marks the child\'s player and hero; the parent is not marked', () => {
    const s = family();
    expect(s.players.map((p) => Boolean(p.child))).toEqual([false, true]);
    expect(isChildHero(s, s.heroes.goldDragon)).toBe(false);
    expect(isChildHero(s, s.heroes.unicornKing)).toBe(true);
  });

  it('is ignored in the board edition and outside coop', () => {
    expect(family({ ruleset: 'classic' }).players.some((p) => p.child)).toBe(false);
    expect(createGame(setup({ mode: 'pvp', seats: [{ ...seats(true)[0] }, { name: 'H', faction: 'horde', controller: 'human', heroId: 'blackDragon', child: true }] }, { ruleset: 'digital' })).players.some((p) => p.child)).toBe(false);
  });

  it('the child\'s hero gets an extra move point at the start of its turn, the parent\'s does not', () => {
    let s = family();
    const order = s.turnOrder.filter((id) => s.heroes[id].playerId);
    s = applyAction(s, { type: 'endTurn' });
    const second = activeHero(s)!;
    expect(order).toContain(second.id);
    expect(s.movePoints).toBe(s.rules.heroMovePoints + (isChildHero(s, second) ? FAMILY.extraMove : 0));
    const plain = family({}, false);
    const p2 = applyAction(plain, { type: 'endTurn' });
    expect(p2.movePoints).toBe(p2.rules.heroMovePoints);
  });

  it('bots play a family game to the end (the child on autoplay)', () => {
    expect(playOut(family()).phase).toBe('over');
  });
});

describe('hint', () => {
  it('describes the bot\'s next action in words', () => {
    const s = family();
    const text = describeAction(s, chooseAction(s));
    expect(text.length).toBeGreaterThan(5);
    expect(describeAction(s, null)).toMatch(/nie ma co/);
    expect(describeAction(s, { type: 'endTurn' })).toMatch(/Zakończ turę/);
  });
});
