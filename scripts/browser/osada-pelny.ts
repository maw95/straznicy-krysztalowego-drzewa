// The settlement as a whole screen and the tree of buildings behind the Rada Osady -> .tmp/osada-pelny-<view>-<page>.png. Usage: npx tsx scripts/browser/osada-pelny.ts
import { openGame, type View } from './game';

for (const view of ['desktop', 'poziomo', 'telefon'] as View[]) {
  const game = await openGame('steps=0&seed=3&size=long&kingdom=1&economy=1&gold=40&players=1', { view, scale: view === 'desktop' ? 0.6 : 1 });
  try {
    const p = game.page;
    await p.locator('[data-enter-settlement]').click({ timeout: 10000 });
    await p.locator('[data-settlement]').waitFor();
    await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
    await p.waitForTimeout(300);
    await p.screenshot({ path: `.tmp/osada-pelny-${view}-krajobraz.png` });
    const scroll = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await p.locator('[data-building="council"]').click();
    await p.locator('[data-building-tree]').waitFor();
    await p.waitForTimeout(300);
    await p.locator('[data-tree-node="hospital"]').click();
    await p.screenshot({ path: `.tmp/osada-pelny-${view}-drzewko.png` });
    console.log(view, 'hscroll', scroll, 'nodes', await p.locator('[data-tree-node]').count(), 'lines', await p.locator('[data-tree-line]').count(), 'hospital state', await p.locator('[data-tree-node="hospital"]').getAttribute('data-node-state'), 'errors', game.errors);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    console.log(view, 'after Esc: town view', (await p.locator('[data-settlement]').getAttribute('data-view')) === 'town');
  } catch (e) { console.log(view, 'FAIL', String(e).slice(0, 250)); await game.page.screenshot({ path: `.tmp/osada-pelny-${view}-stan.png` }); }
  finally { await game.close(); }
}
