// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/ui/App';
import { createGame } from '../src/engine/game';
import { DEFAULT_RULES } from '../src/engine/types';
import { journalBreakdown, journalStats, recordGame } from '../src/ui/journal';
import { difficultyRating, pointsFor } from '../src/engine/scoring';
import { levelSettings } from '../src/engine/types';

beforeAll(() => {
  (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
  // jsdom has no PointerEvent: a MouseEvent (it carries the button) with the pointer type is enough here.
  (globalThis as any).PointerEvent ??= class extends MouseEvent {
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? 'mouse';
    }
  };
});
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('skd-tutorial', JSON.stringify({ enabled: false, seen: [] }));
  localStorage.setItem('skd-intro', 'seen');
  // These tests play locally: "Graj bez konta" starts at the setup screen (the online menu needs a server).
  localStorage.setItem('skd-play-offline', '1');
  // No "Nowa wersja — co nowego" window in the way (it has its own test).
  localStorage.setItem('skd-last-version', '999.0.0');
  sessionStorage.setItem('skd-title-done', 'done');
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
    // The unfinished game is not part of the record.
    expect(box).toContain('Rozegrane1');
    expect(box).toContain('1 wygr. · 0 przegr.');
    expect(box).toContain('Procent wygranych100%');
    expect(box).toContain('Punkty9');
    const btn = (t: string) => [...doc.querySelectorAll('button')].find((b) => b.textContent?.trim() === t) as HTMLButtonElement;
    await act(async () => fireEvent.click(btn('INFO DLA TESTERÓW')));
    expect(doc.body.textContent).toContain('Zgłoszone błędy: 1');
    await act(async () => fireEvent.change(doc.querySelector('input[aria-label="Twoje imię"]')!, { target: { value: 'Ola' } }));
    await act(async () => fireEvent.change(doc.querySelector('textarea[aria-label="Twoje uwagi"]')!, { target: { value: 'Fajne smoki' } }));
    await act(async () => fireEvent.click(btn('Pobierz plik')));
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

describe('win rate and points', () => {
  const seat = (faction: 'dawn' | 'horde', controller: 'human' | 'bot', heroId: string) => ({ name: heroId, faction, controller, heroId });
  const coop = (seed: number, mapSize: 'short' | 'long' | 'veryLong', level: 'kids' | 'normal' | 'hard') => ({ mode: 'coop' as const, mapSize, seed, seats: [seat('dawn', 'human', 'goldDragon')], ...levelSettings(level, 'coop') });
  const finish = (setup: ReturnType<typeof coop>, winner: 'dawn' | 'horde') => recordGame({ setup, actions: [] }, { ...createGame(setup), phase: 'over', winner, endReason: 'test' });

  it('scores a win by map length × measured difficulty, 30 at most', () => {
    expect(['kids', 'normal', 'hard'].map((l) => pointsFor(coop(1, 'veryLong', l as never), l as never, 'dawn'))).toEqual([13, 17, 30]);
    expect(pointsFor(coop(1, 'short', 'kids'), 'kids', 'dawn')).toBe(3);
    // PvP: the Horde's difficulty is 11 minus Przymierze's.
    const pvp = { ...coop(1, 'short', 'normal'), mode: 'pvp' as const, seats: [seat('dawn', 'human', 'goldDragon'), seat('horde', 'bot', 'blackDragon')] };
    expect([difficultyRating(pvp, 'normal', 'dawn'), difficultyRating(pvp, 'normal', 'horde')]).toEqual([5, 6]);
    // Custom: the full game plus what each option changes on its own (no abilities +2, the die ±0).
    const custom = { ...coop(1, 'short', 'normal') };
    custom.rules = { ...custom.rules, abilities: false, useDice: true };
    expect(difficultyRating(custom, 'custom', 'dawn')).toBe(7);
  });

  it('counts only games the humans played against the machine', () => {
    window.history.replaceState(null, '', '/');
    finish(coop(1, 'short', 'normal'), 'dawn');
    finish(coop(2, 'short', 'normal'), 'horde');
    finish(coop(3, 'veryLong', 'hard'), 'dawn');
    // Humans on both sides: played, but nobody's win.
    const pvp = { mode: 'pvp' as const, mapSize: 'short' as const, battleMode: 'arena' as const, seed: 4, seats: [seat('dawn', 'human', 'goldDragon'), seat('horde', 'human', 'blackDragon')], rules: { ...DEFAULT_RULES } };
    recordGame({ setup: pvp, actions: [] }, { ...createGame(pvp), phase: 'over', winner: 'horde', endReason: 'test' });
    // A human Horde against a bot Przymierze.
    const vsBot = { ...pvp, seed: 5, seats: [seat('dawn', 'bot', 'goldDragon'), seat('horde', 'human', 'blackDragon')] };
    recordGame({ setup: vsBot, actions: [] }, { ...createGame(vsBot), phase: 'over', winner: 'horde', endReason: 'test' });
    const s = journalStats();
    // Coop short normal 9 + coop very long hard 30 + Horde short normal 10 (difficulty 6).
    expect(s).toMatchObject({ finished: 5, won: 3, lost: 1, winRate: 75, points: 9 + 30 + 10 });
    expect(journalBreakdown().map((r) => [r.mode, r.mapSize, r.level, r.played, r.won, r.lost, r.winRate])).toEqual([
      ['coop', 'short', 'normal', 2, 1, 1, 50],
      ['coop', 'veryLong', 'hard', 1, 1, 0, 100],
      ['pvp', 'short', 'normal', 2, 1, 0, 100],
    ]);
  });

  it('opens the detailed table from the menu', async () => {
    window.history.replaceState(null, '', '/');
    finish(coop(1, 'short', 'normal'), 'dawn');
    finish(coop(2, 'short', 'kids'), 'horde');
    recordGame({ setup: coop(3, 'long', 'hard'), actions: [] }, createGame(coop(3, 'long', 'hard')));
    const { container } = render(<App />);
    const doc = container.ownerDocument;
    const more = [...doc.querySelectorAll('button')].find((b) => b.textContent === 'Dokładne dane')!;
    await act(async () => fireEvent.click(more));
    const rows = [...doc.querySelectorAll('table[aria-label="Dokładne dane"] tr')].map((tr) => [...tr.children].map((c) => c.textContent));
    expect(rows).toEqual([
      ['Tryb', 'Mapa', 'Poziom', 'Rozegrane', 'Wygrane', 'Przegrane', '% zwycięstw', 'Punkty'],
      ['Kooperacja', 'Krótka', 'Łatwy', '1', '0', '1', '0%', '0'],
      ['', 'Krótka', 'Normalny', '1', '1', '0', '100%', '9'],
      ['Razem', '2', '1', '1', '50%', '9'],
    ]);
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

describe('intro', () => {
  it('plays on the first launch only, slide by slide', async () => {
    localStorage.removeItem('skd-intro');
    window.history.replaceState(null, '', '/');
    const { container, unmount } = render(<App />);
    const doc = container.ownerDocument;
    const intro = () => doc.querySelector('[aria-label="Wprowadzenie"]');
    const title = () => intro()?.querySelector('h2')?.textContent;
    const next = () => [...intro()!.querySelectorAll('button')].find((b) => b.textContent === 'Dalej')!;
    expect(title()).toBe('Kryształowe Drzewo');
    await act(async () => fireEvent.click(next()));
    expect(title()).toBe('Noc Utraconego Blasku');
    for (let i = 0; i < 20 && intro(); i++) await act(async () => fireEvent.click(next()));
    expect(intro()).toBeNull();
    unmount();
    render(<App />);
    expect(intro()).toBeNull();
    // The menu button plays it again.
    const again = [...doc.querySelectorAll('button')].find((b) => b.textContent === 'Wprowadzenie')!;
    await act(async () => fireEvent.click(again));
    expect(title()).toBe('Kryształowe Drzewo');
  });
});

describe('details under the right mouse button', () => {
  const details = (doc: Document) => doc.querySelector('[aria-label="Szczegóły"]');

  it('shows a hex while the button is held, and keeps it after a short click until the next one', async () => {
    const { container } = startSolo(5);
    const doc = container.ownerDocument;
    const hex = container.querySelector('button.hexbtn span.hex-clip:last-child') as HTMLElement;

    await act(async () => fireEvent.pointerDown(hex, { button: 2, pointerType: 'mouse' }));
    expect(details(doc)?.textContent).toMatch(/Koszt ruchu|Nieodkryte pole|Nieprzechodnie/);
    await act(async () => {
      vi.advanceTimersByTime(500);
      fireEvent.pointerUp(window, { button: 2, pointerType: 'mouse' });
    });
    expect(details(doc)).toBeNull();

    await act(async () => fireEvent.pointerDown(hex, { button: 2, pointerType: 'mouse' }));
    await act(async () => fireEvent.pointerUp(window, { button: 2, pointerType: 'mouse' }));
    expect(details(doc)).not.toBeNull();
    await act(async () => fireEvent.pointerDown(doc.body, { button: 0, pointerType: 'mouse' }));
    expect(details(doc)).toBeNull();
  });

  it('shows the unit card for a portrait, and keeps the browser menu away from it', async () => {
    const { container } = startSolo(5);
    const doc = container.ownerDocument;
    const portrait = container.querySelector('.side-adv .medal-ring') as HTMLElement;
    await act(async () => fireEvent.pointerDown(portrait, { button: 2, pointerType: 'mouse' }));
    expect(details(doc)?.textContent).toContain('Złoty Smok');
    expect(fireEvent.contextMenu(portrait)).toBe(false);
  });
});

describe('Enter in dialogs', () => {
  it('presses the dialog\'s confirm button, or closes it', async () => {
    const { container } = startSolo(5);
    const doc = container.ownerDocument;
    await act(async () => fireEvent.keyDown(window, { key: 'r' }));
    expect(doc.querySelector('.overlay')).not.toBeNull();
    (doc.activeElement as HTMLElement | null)?.blur();
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Enter' });
      vi.advanceTimersByTime(400);
    });
    expect(doc.querySelector('.overlay:not(.leaving)')).toBeNull();
  });
});

describe('start screen', () => {
  it('without an account asks to log in or play without one, and remembers "Graj bez konta"', async () => {
    localStorage.removeItem('skd-play-offline');
    window.history.replaceState(null, '', '/');
    const { container } = render(<App />);
    const doc = container.ownerDocument;
    const button = (text: string) => [...doc.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as HTMLButtonElement | undefined;
    expect(doc.body.textContent).toContain('Witaj, Strażniku!');
    expect(button('Zaloguj')).toBeTruthy();
    expect(doc.body.textContent).toContain('Bez gry online i bez rankingu');

    await act(async () => fireEvent.click(button('Graj bez konta')!));
    expect(button('Rozpocznij grę')).toBeTruthy();
    expect(button('Zaloguj się, żeby grać ze znajomymi')).toBeTruthy();
    expect(localStorage.getItem('skd-play-offline')).toBe('1');

    await act(async () => fireEvent.click(button('Zaloguj się, żeby grać ze znajomymi')!));
    expect(doc.body.textContent).toContain('Witaj, Strażniku!');
    expect(localStorage.getItem('skd-play-offline')).toBeNull();
  });
});

describe('what is new after a release', () => {
  const text = [
    '# Historia', '', '## W przygotowaniu', '', '- Jeszcze nie wydane.', '',
    '## 2.0.1 — 2026-10-24', '', '- Zgłoszenia idą do twórcy (`abc1234`).', '- Narzędzia: make zgloszenia (`def5678`).', '',
    '## 2.0.0 — 2026-10-23', '', '- Gra online (`aaa1111`, `bbb2222`).', '- Dokumentacja: opis serwera.', '',
    '## 1.4.0 — 2026-10-22', '', '- Arena.', '',
    '## 1.3.0 — 2026-10-21', '', '- Stare.',
  ].join('\n');

  it('lists the releases since the one the player last saw, without the developers\' entries', async () => {
    const { newsSince } = await import('../src/ui/ChangelogDialog');
    expect(newsSince(text, '1.3.0', '2.0.1')).toEqual([
      { version: '2.0.1', date: '2026-10-24', changes: ['Zgłoszenia idą do twórcy.'] },
      { version: '2.0.0', date: '2026-10-23', changes: ['Gra online.'] },
      { version: '1.4.0', date: '2026-10-22', changes: ['Arena.'] },
    ]);
    expect(newsSince(text, '2.0.0', '2.0.1').map((r) => r.version)).toEqual(['2.0.1']);
    expect(newsSince(text, null, '2.0.1').map((r) => r.version)).toEqual(['2.0.1']);
    expect(newsSince(text, '2.0.1', '2.0.1')).toEqual([]);
  });

  it('shows the window once to a returning player, and never to a new one', async () => {
    const { pendingNews } = await import('../src/ui/WhatsNew');
    localStorage.removeItem('skd-last-version');
    localStorage.removeItem('skd-intro');
    expect(pendingNews()).toBeNull();

    // A returning player: saw the intro, last saw version 1.3.0.
    localStorage.setItem('skd-intro', 'seen');
    localStorage.setItem('skd-last-version', '1.3.0');
    window.history.replaceState(null, '', '/');
    const { container } = render(<App />);
    const doc = container.ownerDocument;
    expect(doc.body.textContent).toContain('Nowa wersja — co nowego');
    const close = [...doc.querySelectorAll('button')].find((b) => b.textContent === 'Do gry!')!;
    await act(async () => fireEvent.click(close));
    expect(localStorage.getItem('skd-last-version')).toBe(__APP_VERSION__);
    expect(pendingNews()).toBeNull();
  });
});

describe('changelog', () => {
  it('reads versions, dates and changes from CHANGELOG.md, without commit hashes', async () => {
    const { parseChangelog } = await import('../src/ui/ChangelogDialog');
    const r = parseChangelog('# Historia\n\nWstęp.\n\n## W przygotowaniu\n\n- Nowe okienko (`abc1234`).\n\n## 1.1.0 — 2026-10-22\n\n- Balans: **szybkości** (`51f6d15`).\n- Interfejs.\n\n## 1.0.0 — 2026-10-21\n');
    expect(r).toEqual([
      { version: null, date: null, changes: ['Nowe okienko.'] },
      { version: '1.1.0', date: '2026-10-22', changes: ['Balans: szybkości.', 'Interfejs.'] },
    ]);
  });

  it('opens from the version number in the menu', async () => {
    window.history.replaceState(null, '', '/');
    const { container } = render(<App />);
    const doc = container.ownerDocument;
    const version = [...doc.querySelectorAll('button')].find((b) => b.textContent?.startsWith('Wersja '))!;
    await act(async () => fireEvent.click(version));
    const v110 = doc.querySelector('[aria-label="Wersja 1.1.0"]')!;
    expect(v110.textContent).toContain('22 października 2026');
    expect(v110.textContent).not.toMatch(/51f6d15/);
    expect(doc.querySelector('[aria-label="Wersja 1.0.0"]')).not.toBeNull();
  });
});

describe('full screen', () => {
  function mockFullscreen() {
    const root = document.documentElement as any;
    const calls: string[] = [];
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    let element: Element | null = null;
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => element });
    root.requestFullscreen = vi.fn(async () => {
      calls.push('enter');
      element = root;
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    (document as any).exitFullscreen = vi.fn(async () => {
      calls.push('exit');
      element = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    return {
      calls,
      restore: () => {
        delete root.requestFullscreen;
        delete (document as any).exitFullscreen;
        delete (document as any).fullscreenEnabled;
        delete (document as any).fullscreenElement;
      },
    };
  }

  it('goes full screen on the first click, and the corner button toggles it', async () => {
    const fs = mockFullscreen();
    window.history.replaceState(null, '', '/');
    const { container } = render(<App />);
    const doc = container.ownerDocument;
    await act(async () => fireEvent.pointerUp(doc.body));
    await act(async () => fireEvent.pointerUp(doc.body));
    expect(fs.calls).toEqual(['enter']);
    const btn = () => doc.querySelector('.fullscreen-btn') as HTMLButtonElement;
    expect(btn().getAttribute('aria-label')).toBe('Zamknij pełny ekran');
    await act(async () => fireEvent.click(btn()));
    expect(fs.calls).toEqual(['enter', 'exit']);
    expect(btn().getAttribute('aria-label')).toBe('Pełny ekran');
    fs.restore();
  });

  it('stays in the window when the player switched it off, and the switch itself does not trigger it', async () => {
    const fs = mockFullscreen();
    window.history.replaceState(null, '', '/');
    const { container } = render(<App />);
    const doc = container.ownerDocument;
    const box = [...doc.querySelectorAll('label')].find((l) => l.textContent?.includes('Pełny ekran przy uruchomieniu'))!.querySelector('input')!;
    await act(async () => {
      fireEvent.pointerUp(box);
      fireEvent.click(box);
    });
    expect(fs.calls).toEqual([]);
    expect(localStorage.getItem('skd-fullscreen-auto')).toBe('off');
    cleanup();
    render(<App />);
    await act(async () => fireEvent.pointerUp(document.body));
    expect(fs.calls).toEqual([]);
    fs.restore();
  });
});

describe('title screen', () => {
  it('opens each visit, START goes full screen and on to the intro the first time', async () => {
    sessionStorage.removeItem('skd-title-done');
    localStorage.removeItem('skd-intro');
    const root = document.documentElement as any;
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    root.requestFullscreen = vi.fn(async () => {});
    // START also starts the music; jsdom cannot play audio.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    window.history.replaceState(null, '', '/');
    const { container, unmount } = render(<App />);
    const doc = container.ownerDocument;
    const title = () => doc.querySelector('.title-screen');
    expect(title()).not.toBeNull();
    // The intro waits behind the title.
    expect(doc.querySelector('[aria-label="Wprowadzenie"]')).toBeNull();
    await act(async () => fireEvent.click([...title()!.querySelectorAll('button')].find((b) => b.textContent === 'Start')!));
    expect(root.requestFullscreen).toHaveBeenCalled();
    expect(title()).toBeNull();
    expect(doc.querySelector('[aria-label="Wprowadzenie"]')).not.toBeNull();
    // A reload in the same tab skips it.
    unmount();
    render(<App />);
    expect(doc.querySelector('.title-screen')).toBeNull();
    delete root.requestFullscreen;
    delete (document as any).fullscreenEnabled;
  });
});

describe('event log', () => {
  it('closes cleanly when scrollIntoView returns a Promise (newer Chromium)', async () => {
    const scroll = vi.fn(() => Promise.resolve());
    (Element.prototype as any).scrollIntoView = scroll;
    const errors: unknown[] = [];
    const onError = (e: ErrorEvent) => errors.push(e.error);
    window.addEventListener('error', onError);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = startSolo(1);
    const btn = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Dziennik')!;
    await act(async () => fireEvent.click(btn));
    expect(scroll).toHaveBeenCalled();
    let thrown: unknown = null;
    try {
      await act(async () => fireEvent.keyDown(window, { key: 'Escape' }));
      await act(async () => vi.advanceTimersByTime(400));
    } catch (e) {
      thrown = e;
    }
    window.removeEventListener('error', onError);
    spy.mockRestore();
    delete (Element.prototype as any).scrollIntoView;
    expect(thrown).toBeNull();
    expect(errors).toEqual([]);
    expect(container.ownerDocument.body.textContent).not.toContain('Dziennik zdarzeń');
  });
});

describe('arena through the UI', () => {
  async function startArena(bothHuman: boolean) {
    window.history.replaceState(null, '', '/');
    vi.useFakeTimers();
    const { container } = render(<App />);
    const doc = container.ownerDocument;
    const btn = (t: string) => [...doc.querySelectorAll('button')].find((b) => b.textContent?.trim() === t) as HTMLButtonElement | undefined;
    await act(async () => fireEvent.click(btn('Arena (jedna bitwa)')!));
    if (bothHuman) {
      const who = doc.querySelectorAll('select[aria-label="Kto gra"]')[1] as HTMLSelectElement;
      await act(async () => fireEvent.change(who, { target: { value: 'human' } }));
    }
    await act(async () => fireEvent.click(btn('Rozpocznij grę')!));
    return { doc, btn };
  }
  const overlayWith = (doc: Document, text: string) => [...doc.querySelectorAll('.overlay')].find((o) => o.textContent?.includes(text));

  /** Answers the support and draft dialogs; records whether each draft dialog opened covered. */
  async function playPrep(doc: Document, btn: (t: string) => HTMLButtonElement | undefined) {
    const covers: boolean[] = [];
    for (let i = 0; i < 80; i++) {
      await act(async () => vi.advanceTimersByTime(800));
      const g = (window as any).__game;
      if (!g.battle || g.battle.stage === 'deploy' || g.battle.stage === 'fight') break;
      const sel = overlayWith(doc, 'Wybierz dwóch pomocników');
      if (sel) {
        for (const c of [...sel.querySelectorAll('button')].filter((b) => b.textContent !== 'Do bitwy!').slice(0, 2)) await act(async () => fireEvent.click(c));
        await act(async () => fireEvent.click(btn('Do bitwy!')!));
        continue;
      }
      const cover = overlayWith(doc, 'Pokaż skarby');
      if (cover) {
        covers.push(true);
        await act(async () => fireEvent.click(btn('Pokaż skarby')!));
      }
      const draft = overlayWith(doc, 'Wybierz skarb');
      if (draft) {
        if (!cover) covers.push(false);
        await act(async () => fireEvent.click(draft.querySelector('button[aria-pressed]')!));
        await act(async () => fireEvent.click(btn('Biorę ten skarb')!));
      }
    }
    return covers;
  }

  it('against the computer: two supports, two drafted treasures each, then the battle', async () => {
    const { doc, btn } = await startArena(false);
    expect(doc.querySelector('.arena-prep')).not.toBeNull();
    const covers = await playPrep(doc, btn);
    const g = (window as any).__game;
    expect(g.setup.mode).toBe('arena');
    expect(g.factions.dawn.inventory).toHaveLength(2);
    expect(g.factions.horde.inventory).toHaveLength(2);
    expect(['deploy', 'fight']).toContain(g.battle.stage);
    // Only the human's two picks needed the dialog, and nothing was covered.
    expect(covers).toEqual([false, false]);
  });

  it('two players at one screen: the cards are covered whenever the other side picks', async () => {
    const { doc, btn } = await startArena(true);
    const covers = await playPrep(doc, btn);
    // A, B, B, A: covered for A, for B, not again for B's second pick, covered for A.
    expect(covers).toEqual([true, true, false, true]);
  });
});
