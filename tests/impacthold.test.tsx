// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { arenaCell } from '../src/engine/battle';
import { chooseAction } from '../src/engine/ai';
import { applyActionInPlace, createGame } from '../src/engine/game';
import { arenaSetup, type GameState } from '../src/engine/types';
import { emitImpact } from '../src/ui/impact';
import { spriteAttackBetween, useImpactHold } from '../src/ui/useImpactHold';

/** The first pair of states (before, after) in a digital bot game where a unit with sprites attacked. */
function firstAttack(seed: number): { before: GameState; after: GameState; unit: string } | null {
  const o = arenaSetup(
    [
      { name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' },
      { name: 'B', faction: 'horde', controller: 'bot', heroId: 'werewolfLord' },
    ],
    seed,
  );
  const s: GameState = createGame({ ...o, rules: { ...o.rules, ruleset: 'digital' } });
  for (let i = 0; i < 3000 && s.phase !== 'over'; i++) {
    const before = structuredClone(s);
    applyActionInPlace(s, chooseAction(s)!);
    const a = spriteAttackBetween(before, s);
    if (!a) continue;
    return { before, after: structuredClone(s), unit: a.unitId };
  }
  return null;
}

describe('useImpactHold', () => {
  it('holds the state before the blow at once (no render of the new state is committed) until the impact is announced', () => {
    const found = firstAttack(1);
    expect(found).not.toBeNull();
    const { before, after, unit } = found!;
    const { result, rerender } = renderHook(({ s }) => useImpactHold(s), { initialProps: { s: before } });
    expect(result.current.holding).toBe(false);
    rerender({ s: after });
    expect(result.current.holding).toBe(true);
    expect(result.current.attack?.unitId).toBe(unit);
    // The units' life is still the old one.
    for (const u of Object.values(before.battle!.units)) expect(result.current.view.battle!.units[u.id].alive).toBe(u.alive);
    act(() => emitImpact(unit));
    expect(result.current.holding).toBe(false);
    expect(result.current.view).toBe(after);
  });

  it('shows an attacker that moved and struck in one go already at the place it struck from', () => {
    const found = firstAttack(1)!;
    const { before, unit } = found;
    // The same blow, but the attacker also came from elsewhere (a click on a far enemy moves and strikes at once).
    const after = structuredClone(found.after);
    const from = before.battle!.units[unit].pos!;
    const to = arenaCell(from === arenaCell(0, 0) ? 5 : 0, 0);
    expect(to).not.toBe(from);
    after.battle!.units[unit].pos = to;
    const { result, rerender } = renderHook(({ s }) => useImpactHold(s), { initialProps: { s: before } });
    rerender({ s: after });
    expect(result.current.holding).toBe(true);
    expect(result.current.view.battle!.units[unit].pos).toBe(to);
  });
});
