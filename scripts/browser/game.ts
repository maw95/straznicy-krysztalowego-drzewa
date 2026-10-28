// Opens the game in a headless browser for checks and screenshots: starts its own Vite server
// (port 5180, never the developer's 5173), skips the intro, title, tutorial and "what's new",
// and plays offline unless a server URL is given. Used by zrzut.ts; import it in one-off checks.

import { chromium, type Browser, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';

export const PORT = 5180;

/** Window sizes: a desktop, an upright phone and a phone held sideways. */
export const VIEWS = {
  desktop: { width: 1600, height: 900, mobile: false },
  telefon: { width: 390, height: 844, mobile: true },
  poziomo: { width: 844, height: 390, mobile: true },
} as const;
export type View = keyof typeof VIEWS;

export interface Game {
  page: Page;
  /** Page errors and console errors collected so far. */
  errors: string[];
  close: () => Promise<void>;
}

/**
 * The game at `query` (e.g. `steps=400&until=battle&mode=pvp&seed=3`, see the test hook in App.tsx).
 * `scale` below 1 makes screenshots smaller (fewer pixels to look at): 0.5 on the desktop, 1 on phones by default.
 */
export async function openGame(query = '', opts: { view?: View; scale?: number; serverUrl?: string; token?: string } = {}): Promise<Game> {
  const view = VIEWS[opts.view ?? 'desktop'];
  let vite: ViteDevServer | null = null;
  if (!(await fetch(`http://localhost:${PORT}/`).then((r) => r.ok, () => false))) {
    if (opts.serverUrl) process.env.VITE_SERVER_URL = opts.serverUrl;
    vite = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' });
    await vite.listen();
  }
  const browser: Browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const context = await browser.newContext({
    viewport: { width: view.width, height: view.height },
    deviceScaleFactor: opts.scale ?? (view.mobile ? 1 : 0.5),
    isMobile: view.mobile,
    hasTouch: view.mobile,
  });
  await context.addInitScript(
    ({ token }) => {
      if (!localStorage.getItem('__init')) {
        localStorage.setItem('__init', '1');
        localStorage.setItem('skd-tutorial', JSON.stringify({ enabled: false, seen: [] }));
        localStorage.setItem('skd-intro', 'seen');
        localStorage.setItem('skd-last-version', '999.0.0');
        if (token) localStorage.setItem('skd-online-token', token);
        else localStorage.setItem('skd-play-offline', '1');
      }
      sessionStorage.setItem('skd-title-done', 'done');
    },
    { token: opts.token ?? null },
  );
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`http://localhost:${PORT}/${query ? `?${query}` : ''}`);
  return {
    page,
    errors,
    close: async () => {
      await browser.close();
      await vite?.close();
    },
  };
}

/** Clicks through the dialogs a bot game stops at ("Dalej", "Do walki", hand-over to the next player). */
export async function clearDialogs(page: Page) {
  for (const b of await page.locator('.overlay button.prim').all()) {
    if (/Dalej|Do walki|Gotowe|Jestem/.test((await b.textContent()) ?? '')) await b.click().catch(() => undefined);
  }
}
