// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/ui/App';

beforeAll(() => {
  (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
});
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('skd-tutorial', JSON.stringify({ enabled: false, seen: [] }));
});

/** Accepts confirmation dialogs and dismisses summaries so the scripted player keeps going. */
async function clearDialogs(c: HTMLElement) {
  for (let i = 0; i < 3; i++) {
    const btn = [...c.querySelectorAll('.overlay button.prim')].find((b) => /Zakończ turę|Do walki|Dalej|Do ekwipunku/.test(b.textContent ?? '')) as HTMLButtonElement | undefined;
    if (!btn) return;
    await act(async () => fireEvent.click(btn));
  }
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const buttons = (c: HTMLElement) => [...c.querySelectorAll('button')] as HTMLButtonElement[];
const byText = (c: HTMLElement, t: string) => buttons(c).find((b) => b.textContent?.trim() === t || b.textContent?.includes(t));

describe('human battle turns through the UI', () => {
  it.each(Array.from({ length: 36 }, (_, i) => [i + 1, ['goldDragon', 'unicornKing', 'ancientBear'][i % 3], i % 2 ? 'advanced' : 'basic']))('UI stays playable (seed %i, %s, %s)', async (seed, hero, difficulty) => {
    window.history.replaceState(null, '', `/?steps=0&seed=${seed}&players=1&hero=${hero}&difficulty=${difficulty}`);
    vi.useFakeTimers();
    const { container } = render(<StrictMode><App /></StrictMode>);
    const log: string[] = [];
    let activations = 0;
    const seenRounds = new Set<string>();
    for (let step = 0; step < 1500 && activations < 25; step++) {
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      await clearDialogs(container);
      const text = container.textContent ?? '';
      if (text.includes('Wygrywa')) break;
      const pick = byText(container, 'Do bitwy!');
      if (pick) {
        const cards = [...container.querySelectorAll('.overlay button.btn')].filter((b) => b !== pick).slice(0, 2);
        for (const card of cards) await act(async () => fireEvent.click(card));
        await act(async () => fireEvent.click(pick));
        continue;
      }
      const end = byText(container, 'Koniec');
      if (end && text.includes('Ruch, potem atak')) {
        activations++;
        const polys = [...container.querySelectorAll('polygon')];
        const moves = polys.filter((p) => p.getAttribute('fill') === 'rgba(6,12,2,0.32)').length;
        const targets = polys.filter((p) => p.getAttribute('stroke') === '#E0503C').length;
        const round = text.match(/runda (\d+)/)?.[1];
        log.push(`battle round ${round}: moves ${moves}, targets ${targets}`);
        if (moves + targets === 0) log.push('  (unit boxed in — no options)');
        // Play like a person: attack if possible, otherwise move, then attack or finish.
        const targetUnit = [...container.querySelectorAll('button.hexbtn')].find((b) => (b as HTMLElement).innerHTML.includes('rgba(224,80,60,0.7)'));
        if (targetUnit) {
          await act(async () => fireEvent.click(targetUnit));
          continue;
        }
        const movePoly = polys.filter((p) => p.getAttribute('fill') === 'rgba(6,12,2,0.32)').pop();
        if (movePoly) await act(async () => fireEvent.click(movePoly));
        const after = [...container.querySelectorAll('button.hexbtn')].find((b) => (b as HTMLElement).innerHTML.includes('rgba(224,80,60,0.7)'));
        const end2 = byText(container, 'Koniec');
        if (after) await act(async () => fireEvent.click(after));
        else if (end2) await act(async () => fireEvent.click(end2));
        continue;
      }
      if (end) {
        await act(async () => fireEvent.click(end));
        continue;
      }
      const endTurn = byText(container, 'Zakończ turę');
      if (endTurn && !endTurn.disabled) {
        const reach = [...container.querySelectorAll('button.hexbtn')].filter((b) => b.querySelector('.plate'));
        const round = text.match(/Runda (\d+) z/)?.[1] ?? '?';
        const g = (window as any).__game;
        if (!seenRounds.has(round)) {
          seenRounds.add(round);
          const { legalHeroMoves } = await import('../src/engine/game');
          const legal = legalHeroMoves(g).length;
          log.push(`map round ${round}: ui ${reach.length}, engine ${legal}, mp ${g.movePoints}, battleDone ${g.turnBattleDone}`);
          expect(reach.length > 0, log.join('\n')).toBe(legal > 0);
        }
        // Prefer fights so battles happen.
        const fight = reach.find((b) => b.textContent?.includes('⚔'));
        await act(async () => {
          fireEvent.click(fight ?? reach[0] ?? endTurn);
          vi.advanceTimersByTime(1500);
        });
        const again = byText(container, 'Zakończ turę');
        if (again && !again.disabled && !fight) await act(async () => fireEvent.click(again));
      }
    }
    const g = (window as any).__game;
    const actions = (window as any).__history.current;
    const { createGame, applyAction } = await import('../src/engine/game');
    let replay = createGame(g.setup);
    for (const a of actions) replay = applyAction(replay, a);
    expect(replay.actionCount).toBe(g.actionCount);
    expect(replay.log.length).toBe(g.log.length);
  });
});
