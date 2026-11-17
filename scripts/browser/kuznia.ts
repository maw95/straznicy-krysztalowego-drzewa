// Click check of level 4 in the settlement window: the forge is built and upgraded over two rounds, a resource is bought and sold -> .tmp/kuznia.png.
// Usage: npx tsx scripts/browser/kuznia.ts
import { openGame } from './game';

const game = await openGame('steps=0&seed=3&size=long&economy=1&gold=60&res=3&players=1&built=barracks', { scale: 1 });
try {
  const p = game.page;
  const num = async (sel: string) => Number((await p.locator(sel).first().innerText()).replace(/\D+/g, ''));
  await p.locator('[data-enter-settlement]').click();
  await p.locator('[data-settlement]').waitFor();
  await p.locator('[data-building="forge"]').click();
  await p.locator('[data-build="forge"]').click();
  console.log('forge level', await p.locator('[data-building="forge"]').getAttribute('data-level'));
  await p.locator('[data-building="market"]').click();
  const gold = await num('[data-gold]');
  await p.locator('[data-trade-buy="ore"]').click();
  console.log('gold after buying ore', gold, '->', await num('[data-gold]'), 'sell disabled without market:', await p.locator('[data-trade-sell="ore"]').isDisabled());
  // The garrison: leave one support in the settlement, then take it back.
  await p.locator('[data-building="walls"]').click();
  await p.locator('[data-garrison-in]').first().click();
  console.log('garrison after leaving one:', await p.locator('[data-garrison-out]').count());
  await p.locator('[data-garrison-out]').first().click();
  console.log('garrison after taking it back:', await p.locator('[data-garrison-out]').count());
  await p.locator('[data-garrison-in]').first().click();
  await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
  await p.waitForTimeout(300);
  await p.locator('[data-settlement]').screenshot({ path: '.tmp/kuznia.png' });
  if (game.errors.length) console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
