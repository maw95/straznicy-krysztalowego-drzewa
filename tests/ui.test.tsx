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
  const ready = [...c.querySelectorAll('button')].find((b) => b.textContent?.includes('Gotowe — do bitwy')) as HTMLButtonElement | undefined;
  if (ready) await act(async () => fireEvent.click(ready));
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

describe('setup screen simplifications', () => {
  it('starts the full game by default and applies clicked simplifications', async () => {
    window.history.replaceState(null, '', '/');
    const { container } = render(<StrictMode><App /></StrictMode>);
    const btn = (t: string) => [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === t) as HTMLButtonElement;
    for (const t of ['Bez zdolności', 'Bez skarbów', 'Bez rzutu kością', 'Rezerwowy bohater po śmierci']) expect(btn(t).getAttribute('aria-pressed')).toBe('false');
    await act(async () => fireEvent.click(btn('Bez skarbów')));
    await act(async () => fireEvent.click(btn('Bez rzutu kością')));
    expect(btn('Bez skarbów').getAttribute('aria-pressed')).toBe('true');
    await act(async () => fireEvent.click(btn('Rozpocznij grę')));
    const game = (window as any).__game;
    expect(game.rules).toMatchObject({ abilities: true, treasures: false, useDice: false, heroReplacement: false });
    expect(Object.keys(game.items)).toHaveLength(0);
  });

  it('offers one more Horde hero in coop only', async () => {
    window.history.replaceState(null, '', '/');
    const { container } = render(<StrictMode><App /></StrictMode>);
    const btn = (t: string) => [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === t) as HTMLButtonElement | undefined;
    await act(async () => fireEvent.click(btn('Dodatkowy bohater Hordy')!));
    expect(btn('Dodatkowy bohater Hordy')!.getAttribute('aria-pressed')).toBe('true');
    await act(async () => fireEvent.click(btn('Rozpocznij grę')!));
    const game = (window as any).__game;
    expect(Object.values(game.heroes).filter((h: any) => h.faction === 'horde')).toHaveLength(2);
  });
});

describe('bug reports', () => {
  it('stores a described report with the game and sends it to the dev server', async () => {
    const posted: any[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      posted.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ file: 'bug-reports/test.json' }), { status: 200 });
    }));
    const { container } = startSolo(3);
    await act(async () => vi.advanceTimersByTime(100));
    const btn = (t: string) => [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === t) as HTMLButtonElement;
    await act(async () => fireEvent.click(btn('Zgłoś błąd')));
    const area = container.ownerDocument.querySelector('textarea[aria-label="Opis błędu"]') as HTMLTextAreaElement;
    expect(area).toBeTruthy();
    expect(btn('Zapisz zgłoszenie').disabled).toBe(true);
    await act(async () => fireEvent.change(area, { target: { value: 'Smok nie może wejść na most' } }));
    await act(async () => fireEvent.click(btn('Zapisz zgłoszenie')));
    expect(container.ownerDocument.body.textContent).toContain('Zapisano w projekcie: bug-reports/test.json');
    expect(posted).toHaveLength(1);
    expect(posted[0].reports[0]).toMatchObject({ text: 'Smok nie może wejść na most', actionIndex: posted[0].actions.length, round: 1, screen: 'adventure' });
    const auto = JSON.parse(localStorage.getItem('skd-autosave')!);
    expect(auto.reports).toHaveLength(1);
    vi.unstubAllGlobals();
  });
});
