// Click check of level 5 magic: in a battle the hero's spell strip shows, a bolt is picked and cast on an enemy from the side panel; then the mage
// tower in the settlement window. Screenshots -> .tmp/czary.png (battle) and .tmp/wieza.png (tower). Usage: npx tsx scripts/browser/czary.ts
import { openGame } from './game';

{
  const game = await openGame('steps=0&seed=3&size=medium&realm=1&mode=pvp&siege=0&garrison=1', { scale: 1 });
  try {
    const p = game.page;
    const go = p.getByRole('button', { name: 'Do bitwy!' });
    await go.waitFor({ timeout: 15000 });
    const cards = go.locator('xpath=preceding-sibling::div[1]/button');
    await cards.nth(0).click();
    await cards.nth(1).click();
    await go.click();
    const ready = p.getByRole('button', { name: /Gotowe/ });
    await ready.waitFor({ timeout: 10000 }).catch(() => undefined);
    if (await ready.count()) await ready.first().click();
    const end = p.getByRole('button', { name: 'Koniec', exact: true });
    for (let i = 0; i < 40 && !(await p.locator('[data-spells]').count()); i++) {
      if ((await end.count()) && (await end.first().isEnabled())) await end.first().click().catch(() => undefined);
      await p.waitForTimeout(1200);
    }
    if (!(await p.locator('[data-spells]').count())) { await p.screenshot({ path: '.tmp/czary-stan.png' }); console.log('no spell strip; buttons:', (await p.getByRole('button').allInnerTexts()).filter(Boolean).join(' | ').replace(/\n/g, ' ').slice(0, 300)); }
    const mana = async () => Number(await p.locator('[data-spells] [data-mana]').innerText());
    const before = await mana();
    await p.locator('[data-spell="bolt"]').click();
    await p.waitForTimeout(300);
    await p.locator('.arena-frame').screenshot({ path: '.tmp/czary.png' });
    const foe = p.getByRole('button', { name: /Goblin Szaman|Pająk Jaskiniowy|Nietoperz Cienia/ }).first();
    const foeText = await foe.innerText();
    await foe.click();
    await p.waitForTimeout(800);
    console.log('mana', before, '->', (await p.locator('[data-spells]').count()) ? await mana() : 'strip gone (one spell an activation)', '| target before:', foeText.replace(/\n/g, ' '), '| after:', (await foe.innerText().catch(() => 'fell')).replace(/\n/g, ' '));
    if (game.errors.length) console.log(game.errors.join('\n'));
  } finally {
    await game.close();
  }
}
{
  const game = await openGame('steps=0&seed=3&size=medium&realm=1&gold=60&res=9&players=1', { scale: 1 });
  try {
    const p = game.page;
    await p.locator('[data-enter-settlement]').click();
    await p.locator('[data-building="magic"]').click();
    await p.locator('[data-build="magic"]').click();
    await p.locator('[data-learn="vision"]').click();
    console.log('tower:', (await p.locator('[data-panel="magic"]').innerText()).replace(/\n/g, ' / ').slice(0, 220));
    await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
    await p.locator('[data-settlement]').screenshot({ path: '.tmp/wieza.png' });
    await p.locator('[data-enter]').click();
    await p.locator('[data-map-spell="vision"]').click();
    await p.waitForTimeout(500);
    console.log('map spells:', (await p.locator('[data-map-spells]').innerText()).replace(/\n/g, ' '));
    if (game.errors.length) console.log(game.errors.join('\n'));
  } finally {
    await game.close();
  }
}
