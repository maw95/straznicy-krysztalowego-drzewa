// Click check of the developer panel (?dev=1): the scenes "Księga czarów w bitwie" and "Okno osady z pełnym drzewkiem" -> .tmp/panel-*.png.
// Usage: npx tsx scripts/browser/panel-testowy.ts
import { openGame } from './game';

const game = await openGame('steps=0&seed=3&size=medium&realm=1&players=1&dev=1', { scale: 1 });
try {
  const p = game.page;
  await p.locator('[data-dev-panel]').waitFor({ timeout: 10000 });
  // 1) the full tree of a settlement, then the window with the Rada
  await p.locator('[data-dev-scene="settlement"]').click();
  console.log('note:', await p.locator('[data-dev-note]').innerText());
  await p.locator('[data-enter-settlement]').click();
  await p.locator('[data-building="council"]').click();
  await p.locator('[data-building-tree]').waitFor();
  console.log('tree nodes:', await p.locator('[data-tree-node]').count(), 'blocked:', await p.locator('[data-node-state="blocked"]').count());
  await p.screenshot({ path: '.tmp/panel-osada.png' });
  await p.keyboard.press('Escape');
  await p.locator('[data-enter]').click();
  // 2) the spell book in a battle
  await p.locator('[data-dev-scene="spellbook"]').click();
  // With a full team the supports are taken at once; otherwise they are chosen first.
  const go = p.getByRole('button', { name: 'Do bitwy!' });
  if (await go.count()) {
    const cards = go.locator('xpath=preceding-sibling::div[1]/button');
    await cards.nth(0).click();
    await cards.nth(1).click();
    await go.click();
  }
  const ready = p.getByRole('button', { name: /Gotowe/ });
  await ready.waitFor({ timeout: 10000 }).catch(() => undefined);
  if (await ready.count()) await ready.first().click();
  const end = p.getByRole('button', { name: 'Koniec', exact: true });
  for (let i = 0; i < 40 && !(await p.locator('[data-spell-btn]').count()); i++) {
    if (await ready.count()) await ready.first().click().catch(() => undefined);
    if ((await end.count()) && (await end.first().isEnabled())) await end.first().click().catch(() => undefined);
    await p.waitForTimeout(1000);
  }
  await p.locator('[data-spell-btn]').click();
  await p.locator('[data-spell-list]').waitFor();
  console.log('spells in the book:', await p.locator('[data-spell]').count());
  await p.waitForTimeout(1500);
  await p.screenshot({ path: '.tmp/panel-ksiega.png' });
  console.log('errors', game.errors);
} catch (e) {
  console.log('FAIL', String(e).slice(0, 300));
  await game.page.screenshot({ path: '.tmp/panel-stan.png' });
} finally { await game.close(); }
