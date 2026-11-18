// Screenshots of the barracks page and the tree of buildings (level 6) -> .tmp/koszary.png, .tmp/drzewko.png. Usage: npx tsx scripts/browser/koszary.ts [view]
import { openGame, type View } from './game';

const view = (process.argv[2] ?? 'desktop') as View;
const game = await openGame('steps=0&seed=3&size=long&empire=1&gold=80&res=9&players=1', { view, scale: view === 'desktop' ? 0.7 : 1 });
try {
  const p = game.page;
  await p.locator('[data-enter-settlement]').click();
  await p.locator('[data-settlement]').waitFor();
  const settle = async () => { await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok)))))); await p.waitForTimeout(500); };
  await p.locator('[data-building="council"]').click();
  await p.locator('[data-building-tree]').waitFor();
  await p.locator('[data-tree-node="dwelling-dawnOwl"]').click().catch(() => undefined);
  await settle();
  await p.screenshot({ path: '.tmp/drzewko.png' });
  await p.locator('[data-tree-back]').click();
  await p.locator('[data-building="barracks"]').click();
  await p.locator('[data-panel="barracks"]').waitFor();
  await settle();
  await p.screenshot({ path: '.tmp/koszary.png' });
  for (const u of (process.argv[3] ?? '').split(',').filter(Boolean)) {
    await p.locator(`[data-unit="${u}"] .bk-card`).click();
    await p.waitForTimeout(900);
    await p.locator('.bk-detail').screenshot({ path: `.tmp/koszary-${u}.png` });
  }
  if (game.errors.length) console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
