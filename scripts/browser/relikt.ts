// Look check of level 6: shards on the map, the shard counter of the hero, the panel of the Pierwotna Iskra in the settlement window.
// Screenshots -> .tmp/relikt-mapa.png and .tmp/relikt-osada.png. Usage: npx tsx scripts/browser/relikt.ts
import { openGame } from './game';

const game = await openGame('steps=0&seed=3&size=medium&empire=1&objective=relic&players=1&gold=20&res=5', { scale: 1 });
try {
  const p = game.page;
  await p.waitForTimeout(1200);
  console.log('shards on the map:', await p.locator('[data-place="shard"]').count(), '|', (await p.locator('[data-shards]').innerText()).replace(/\n/g, ' '));
  const body = await p.locator('body').innerText();
  console.log(body.split('\n').filter((l) => /Odłamki/.test(l)).slice(0, 4).join(' | '));
  await p.screenshot({ path: '.tmp/relikt-mapa.png' });
  await p.locator('[data-enter-settlement]').click();
  await p.locator('[data-building="spark"]').click();
  console.log('spark panel:', (await p.locator('[data-panel="spark"]').innerText()).replace(/\n/g, ' / '), '| button disabled:', await p.locator('[data-build="spark"]').isDisabled());
  await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
  await p.locator('[data-settlement]').screenshot({ path: '.tmp/relikt-osada.png' });
  if (game.errors.length) console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
