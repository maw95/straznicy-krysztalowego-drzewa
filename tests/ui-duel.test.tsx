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
  localStorage.setItem('skd-intro', 'seen');
  // These tests play locally: "Graj bez konta" starts at the setup screen (the online menu needs a server).
  localStorage.setItem('skd-play-offline', '1');
  sessionStorage.setItem('skd-title-done', 'done');
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

const byText = (c: HTMLElement, t: string) => ([...c.querySelectorAll('button')] as HTMLButtonElement[]).find((b) => b.textContent?.includes(t));

describe('board-variant duels through the UI', () => {
  it.each([1, 2, 3, 4, 5, 6])('a human can fight duels to the end (seed %i)', async (seed) => {
    window.history.replaceState(null, '', `/?steps=0&seed=${seed}&players=1&battle=board&hero=ancientBear`);
    vi.useFakeTimers();
    const { container } = render(<StrictMode><App /></StrictMode>);
    let attacks = 0;
    for (let step = 0; step < 1500; step++) {
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      await clearDialogs(container);
      if (container.textContent?.includes('Wygrywa')) break;
      const attack = byText(container, 'Atakuj');
      if (attack && !attack.disabled) {
        await act(async () => fireEvent.click(attack));
        attacks++;
        continue;
      }
      const pass = byText(container, 'Pas');
      if (pass) {
        await act(async () => fireEvent.click(pass));
        continue;
      }
      const endTurn = byText(container, 'Zakończ turę');
      if (endTurn && !endTurn.disabled) {
        const reach = [...container.querySelectorAll('button.hexbtn')].filter((b) => b.querySelector('.plate'));
        const fight = reach.find((b) => b.textContent?.includes('⚔'));
        await act(async () => {
          fireEvent.click((fight ?? reach[0] ?? endTurn).querySelector('span.hex-clip') ?? fight ?? reach[0] ?? endTurn);
          vi.advanceTimersByTime(1500);
        });
        const again = byText(container, 'Zakończ turę');
        if (again && !again.disabled && !fight) await act(async () => fireEvent.click(again));
      }
    }
    const g = (window as any).__game;
    expect(g.setup.battleMode).toBe('board');
    if (attacks) expect(g.stats.battles).toBeGreaterThan(0);
  });
});
