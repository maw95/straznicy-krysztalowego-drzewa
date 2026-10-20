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

function startSolo(seed: number) {
  window.history.replaceState(null, '', `/?steps=0&seed=${seed}&players=1`);
  vi.useFakeTimers();
  return render(<StrictMode><App /></StrictMode>);
}

const endTurnButton = (c: HTMLElement) => [...c.querySelectorAll('button')].find((b) => b.textContent?.includes('Zakończ turę')) as HTMLButtonElement | undefined;
/** Hex buttons showing a movement cost plate = hexes the hero can walk to. */
const reachableHexes = (c: HTMLElement) => [...c.querySelectorAll('button.hexbtn')].filter((b) => b.querySelector('.plate'));

describe('solo coop through the UI', () => {
  it.each([1, 2, 3, 4, 5, 6])('the human can move in later rounds (seed %i)', async (seed) => {
    const { container } = startSolo(seed);
    const log: string[] = [];
    const seen = new Set<string>();
    for (let step = 0; step < 400; step++) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await clearDialogs(container);
      if (container.textContent?.includes('Wygrywa')) break;
      const endBtn = endTurnButton(container);
      if (!endBtn || endBtn.disabled) continue;
      const round = container.textContent?.match(/Runda (\d+) z/)?.[1] ?? '?';
      const reach = reachableHexes(container);
      if (!seen.has(round)) {
        // Fresh human turn: full movement points, so some hex must be reachable.
        seen.add(round);
        log.push(`round ${round}: reachable ${reach.length}`);
        expect(reach.length, log.join('\n')).toBeGreaterThan(0);
        if (seen.size >= 4) break;
        await act(async () => {
          fireEvent.click(reach[0]);
          vi.advanceTimersByTime(2000);
        });
        continue;
      }
      await act(async () => fireEvent.click(endBtn));
    }
    expect(log.length).toBeGreaterThan(1);
  });
});
