// Click check of level 5: build a tavern, hire a commander, end the round and see the commander take its own turn.
// Screenshot of the tavern panel -> .tmp/karczma.png. Usage: npx tsx scripts/browser/karczma.ts
import { openGame } from './game';

const game = await openGame('steps=0&seed=3&size=medium&realm=1&gold=40&res=9&players=1&built=market', { scale: 1 });
try {
  const p = game.page;
  await p.locator('[data-enter-settlement]').click();
  // Buildings are built from the Rada Osady (the tree); the built tavern then stands in the landscape and opens a modal.
  await p.locator('[data-building="council"]').click();
  await p.locator('[data-tree-node="tavern"]').click();
  await p.locator('[data-tree-detail] [data-build="tavern"]').click();
  await p.locator('[data-tree-back]').click();
  await p.locator('[data-building="tavern"]').click();
  await p.locator('[data-hire]').first().waitFor();
  console.log('commanders on offer:', await p.locator('[data-hire]').count());
  await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
  await p.locator('[data-settlement]').screenshot({ path: '.tmp/karczma.png' });
  await p.locator('[data-hire]').first().click();
  console.log('after hiring:', (await p.locator('[data-panel="tavern"]').innerText()).replace(/\n/g, ' / ').slice(0, 160));
  await p.locator('.settlement-modal [data-enter]').click();
  await p.waitForTimeout(400);
  await p.locator('.settlement-bar [data-enter]').click();
  // End turns until a hero with a personal name (a commander) is the active one.
  let label = '';
  for (let i = 0; i < 12; i++) {
    label = await p.locator('[data-hero-name]').first().innerText().catch(() => '');
    if (label.includes(',')) break;
    await p.keyboard.press('e');
    await p.waitForTimeout(400);
    // "You still have move points": confirm.
    const yes = p.getByRole('button', { name: 'Zakończ turę' }).last();
    if (await yes.count()) await yes.click({ force: true }).catch(() => undefined);
    await p.waitForTimeout(2500);
  }
  console.log('active hero:', label);
  if (game.errors.length) console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
