// Screenshot of the settlement window (level 3) with a few buildings built -> .tmp/osada.png. Usage: npx tsx scripts/browser/osada.ts
import { openGame } from './game';

const game = await openGame('steps=0&seed=3&size=long&kingdom=1&gold=40&players=1', { scale: 1 });
try {
  const p = game.page;
  await p.locator('[data-enter-settlement]').click();
  await p.locator('[data-settlement]').waitFor();
  for (const b of ['barracks', 'barracks', 'market', 'hospital', 'treasury']) {
    await p.locator(`[data-building="${b}"]`).click();
    const btn = p.locator(`[data-build="${b}"]`);
    if (await btn.count()) await btn.first().click();
  }
  await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
  await p.waitForTimeout(300);
  await p.locator('[data-settlement]').screenshot({ path: '.tmp/osada.png' });
  if (game.errors.length) console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
