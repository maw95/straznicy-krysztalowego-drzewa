// The tree of the Rada Osady at the highest level -> .tmp/drzewko.png. Usage: npx tsx scripts/browser/drzewko.ts [query]
import { openGame } from './game';

const game = await openGame(process.argv[2] ?? 'steps=0&seed=3&size=long&kingdom=1&economy=1&realm=1&empire=1&gold=12&players=1', { scale: 1 });
try {
  const p = game.page;
  await p.locator('[data-enter-settlement]').click({ timeout: 10000 });
  await p.locator('[data-settlement]').waitFor();
  await p.locator('[data-building="council"]').click();
  await p.locator('[data-building-tree]').waitFor();
  await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
  await p.waitForTimeout(400);
  console.log(await p.locator('[data-tree-node]').evaluateAll((els) => els.map((e) => `${e.getAttribute('data-tree-node')}:${e.getAttribute('data-node-state')}`).join(' ')));
  await p.locator('[data-building-tree]').screenshot({ path: '.tmp/drzewko.png' });
} finally { await game.close(); }
