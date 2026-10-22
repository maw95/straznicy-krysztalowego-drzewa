// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/ui/App';
import { createGame } from '../src/engine/game';
import { DEFAULT_RULES } from '../src/engine/types';
import { recordGame } from '../src/ui/journal';

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
    // Single switches are tucked away under "Własny".
    expect(btn('Same Eliksiry Odrodzenia')).toBeUndefined();
    await act(async () => fireEvent.click(btn('Własny')));
    for (const t of ['Bez zdolności', 'Same Eliksiry Odrodzenia', 'Rezerwowy bohater po śmierci', 'Rzut kością', 'Dodatkowy bohater Hordy']) expect(btn(t).getAttribute('aria-pressed')).toBe('false');
    // Every option explains itself in a hover tooltip next to its button.
    const tip = (t: string) => btn(t).parentElement!.querySelector('[role="tooltip"]')?.textContent ?? '';
    for (const t of ['Kooperacja (wszyscy przeciw AI)', 'Rywalizacja (dobro kontra zło)', 'Krótka', 'Bardzo długa', 'Łatwy', 'Normalny', 'Trudny', 'Własny', 'Osobna arena (3 na 3)', 'Na planszy głównej (pojedynek 1 na 1)', 'Bez zdolności', 'Same Eliksiry Odrodzenia', 'Rezerwowy bohater po śmierci', 'Rzut kością', 'Dodatkowy bohater Hordy']) expect(tip(t).length).toBeGreaterThan(40);
    expect(tip('Krótka')).toContain('limit 8 rund');
    await act(async () => fireEvent.click(btn('Same Eliksiry Odrodzenia')));
    await act(async () => fireEvent.click(btn('Rzut kością')));
    expect(btn('Same Eliksiry Odrodzenia').getAttribute('aria-pressed')).toBe('true');
    await act(async () => fireEvent.click(btn('Rozpocznij grę')));
    const game = (window as any).__game;
    expect(game.rules).toMatchObject({ abilities: true, treasures: false, useDice: true, heroReplacement: false });
    expect(Object.values(game.items).map((i: any) => i.kind)).toEqual(['resurrection']);
  });

  it('sets up the levels: hard adds a Horde hero in coop, kids play duels without abilities', async () => {
    window.history.replaceState(null, '', '/');
    const { container } = render(<StrictMode><App /></StrictMode>);
    const btn = (t: string) => [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === t) as HTMLButtonElement | undefined;
    await act(async () => fireEvent.click(btn('Trudny')!));
    expect(btn('Trudny')!.getAttribute('aria-pressed')).toBe('true');
    await act(async () => fireEvent.click(btn('Rozpocznij grę')!));
    let game = (window as any).__game;
    expect(Object.values(game.heroes).filter((h: any) => h.faction === 'horde')).toHaveLength(3);
    expect(game.factions.horde.inventory).toHaveLength(2);
    cleanup();
    const second = render(<StrictMode><App /></StrictMode>).container;
    const btn2 = (t: string) => [...second.querySelectorAll('button')].find((b) => b.textContent?.trim() === t) as HTMLButtonElement | undefined;
    await act(async () => fireEvent.click(btn2('Rywalizacja (dobro kontra zło)')!));
    expect(btn2('Trudny')).toBeUndefined();
    await act(async () => fireEvent.click(btn2('Łatwy')!));
    await act(async () => fireEvent.click(btn2('Rozpocznij grę')!));
    game = (window as any).__game;
    expect(game.setup.battleMode).toBe('board');
    expect(game.rules).toMatchObject({ abilities: false, useDice: false, extraEvilHero: false, heroReplacement: true, ritual: false });
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

describe('tester journal', () => {
  it('keeps games in the browser and exports them with feedback from "DLA TESTERÓW"', async () => {
    // A finished coop game and one still running, as the game itself records them.
    const setup = (seed: number) => ({ mode: 'coop' as const, mapSize: 'short' as const, battleMode: 'arena' as const, seed, seats: [{ name: 'Ala', faction: 'dawn' as const, controller: 'human' as const, heroId: 'goldDragon' }], rules: { ...DEFAULT_RULES } });
    const won = { ...createGame(setup(1)), phase: 'over' as const, winner: 'dawn' as const, endReason: 'test' };
    window.history.replaceState(null, '', '/');
    recordGame({ setup: setup(1), actions: [], reports: [{ createdAt: 'x', actionIndex: 0, round: 1, screen: 'adventure', text: 'błąd', recentLog: [], viewport: '', userAgent: '' }] }, won);
    recordGame({ setup: setup(2), actions: [] }, createGame(setup(2)));
    const blobs: Blob[] = [];
    const createUrl = vi.fn((b: Blob) => (blobs.push(b), 'blob:x'));
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { container } = render(<App />);
    const doc = container.ownerDocument;
    const box = doc.querySelector('[aria-label="Twoje partie"]')!.textContent;
    expect(box).toContain('Rozegrane2');
    expect(box).toContain('1 wygr. · 0 przegr.');
    const btn = (t: string) => [...doc.querySelectorAll('button')].find((b) => b.textContent?.trim() === t) as HTMLButtonElement;
    await act(async () => fireEvent.click(btn('INFO DLA TESTERÓW')));
    expect(doc.body.textContent).toContain('Zgłoszone błędy: 1');
    await act(async () => fireEvent.change(doc.querySelector('input[aria-label="Twoje imię"]')!, { target: { value: 'Ola' } }));
    await act(async () => fireEvent.change(doc.querySelector('textarea[aria-label="Twoje uwagi"]')!, { target: { value: 'Fajne smoki' } }));
    await act(async () => fireEvent.click(btn('Pobierz plik dla twórcy')));
    expect(blobs).toHaveLength(1);
    const text = await new Promise<string>((done) => {
      const reader = new FileReader();
      reader.onload = () => done(String(reader.result));
      reader.readAsText(blobs[0]);
    });
    const data = JSON.parse(text);
    expect(data).toMatchObject({ kind: 'skd-tester-export', name: 'Ola', feedback: 'Fajne smoki', stats: { played: 2, finished: 1, reports: 1 } });
    expect(data.games).toHaveLength(2);
    expect(data.games[0].result).toMatchObject({ winner: 'dawn' });
    // The draft stays for the next visit.
    expect(JSON.parse(localStorage.getItem('skd-feedback-draft')!)).toEqual({ name: 'Ola', feedback: 'Fajne smoki' });
  });
});

describe('setup options', () => {
  it('offers the initiative tie rule only in the custom level, and a custom tie makes the level custom', async () => {
    window.history.replaceState(null, '', '/');
    const { container } = render(<App />);
    const doc = container.ownerDocument;
    const btn = (t: string) => [...doc.querySelectorAll('button')].find((b) => b.textContent?.trim() === t) as HTMLButtonElement | undefined;
    expect(btn('Na zmianę')).toBeUndefined();
    expect(doc.body.textContent).not.toContain('Remis inicjatywy');
    await act(async () => fireEvent.click(btn('Własny')!));
    expect(btn('Obrońca pierwszy')!.getAttribute('aria-pressed')).toBe('true');
    await act(async () => fireEvent.click(btn('Na zmianę')!));
    expect(btn('Na zmianę')!.getAttribute('aria-pressed')).toBe('true');
    // Going back to a level restores the default rule.
    await act(async () => fireEvent.click(btn('Normalny')!));
    await act(async () => fireEvent.click(btn('Własny')!));
    expect(btn('Obrońca pierwszy')!.getAttribute('aria-pressed')).toBe('true');
  });
});
