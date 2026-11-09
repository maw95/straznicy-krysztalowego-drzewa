// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { applyAction, createGame } from '../src/engine/game';
import type { GameState } from '../src/engine/types';
import type { OnlineSession } from '../src/online/api';
import { resetAnimLock } from '../src/ui/animLock';
import { usePresentation } from '../src/ui/usePresentation';
import { setup } from './helpers/engine';

describe('online presentation queue', () => {
  afterEach(() => {
    resetAnimLock();
    vi.useRealTimers();
  });

  it('shows the states that arrive together one after another, in order, not only the last', () => {
    vi.useFakeTimers();
    const states: GameState[] = [createGame(setup())];
    for (let i = 0; i < 3; i++) states.push(applyAction(states[i], chooseAction(states[i])!));
    let push: (g: GameState) => void = () => {};
    const session = { onGameState: (l: (g: GameState) => void) => ((push = l), () => {}) } as unknown as OnlineSession;
    const shown: GameState[] = [];
    renderHook(() => usePresentation(session, states[0], (g) => g && shown.push(g)));
    expect(shown).toEqual([states[0]]);
    act(() => {
      for (const s of states.slice(1)) push(s);
    });
    // The first of the three is shown at once; the others wait for the animations before them.
    expect(shown).toEqual([states[0], states[1]]);
    act(() => void vi.advanceTimersByTime(5000));
    expect(shown).toEqual(states);
  });

  it('a state from another game is shown at once, dropping the waiting ones', () => {
    vi.useFakeTimers();
    const a = createGame(setup());
    const a1 = applyAction(a, chooseAction(a)!);
    const a2 = applyAction(a1, chooseAction(a1)!);
    const other = createGame(setup({ seed: 99 }));
    let push: (g: GameState) => void = () => {};
    const session = { onGameState: (l: (g: GameState) => void) => ((push = l), () => {}) } as unknown as OnlineSession;
    const shown: GameState[] = [];
    renderHook(() => usePresentation(session, a, (g) => g && shown.push(g)));
    act(() => {
      push(a1);
      push(a2);
      push(other);
    });
    act(() => void vi.advanceTimersByTime(5000));
    expect(shown[shown.length - 1]).toBe(other);
    expect(shown).not.toContain(a2);
  });
});
