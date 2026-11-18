// Screenshot of a settlement with the Great Treasury built -> .tmp/skarbiec-<land>.png. Usage: npx tsx scripts/browser/wielki-skarbiec.ts [dawn|horde]
import { openGame } from './game';

const land = process.argv[2] ?? 'dawn';
const game = await openGame(`steps=0&seed=3&size=long&kingdom=1&gold=200&res=20&players=1${land === 'horde' ? '&side=horde' : ''}`, { scale: 1 });
try {
  const p = game.page;
  await p.locator('[data-enter-settlement]').click();
  await p.locator('[data-settlement]').waitFor();
  await p.locator('[data-building="council"]').click();
  for (let i = 0; i < 2; i++) {
    await p.locator('[data-tree-node="treasury"]').click();
    const btn = p.locator('[data-tree-detail] [data-build="treasury"]');
    if (await btn.count()) await btn.first().click();
  }
  await p.locator('[data-tree-back]').click();
  await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
  await p.waitForTimeout(300);
  console.log('treasury level', await p.locator('[data-building="treasury"]').getAttribute('data-level'), await p.locator('[data-building="treasury"] img').getAttribute('src'));
  await p.locator('[data-settlement]').screenshot({ path: `.tmp/skarbiec-${land}.png` });
  if (game.errors.length) console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
