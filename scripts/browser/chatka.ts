// Click check of level 4 on the map: the hero walks into a hut by a click and does its quest; then into a mill, a store and a well.
// Screenshot of the hut panel -> .tmp/chatka.png. Usage: npx tsx scripts/browser/chatka.ts
import { openGame } from './game';

for (const near of ['hut', 'mill', 'store', 'well']) {
  const game = await openGame(`steps=0&seed=4&size=long&economy=1&gold=40&res=9&players=1&near=${near}`, { scale: 1 });
  try {
    const p = game.page;
    const gold = async () => Number((await p.locator('[data-gold-bar]').first().innerText()).replace(/\D+/g, ''));
    const place = p.locator(`[data-place="${near === 'hut' ? 'hut' : 'object'}"]`);
    const log = async () => (await p.locator('[data-log-line]').allInnerTexts()).slice(-3).join(' | ');
    let entered = false;
    for (let i = 0; i < (await place.count()) && !entered; i++) {
      const box = await place.nth(i).boundingBox();
      if (!box) continue;
      const before = await p.content();
      await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await p.waitForTimeout(700);
      // A second click confirms the move where the game asks for it.
      if ((await p.content()) === before) continue;
      await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await p.waitForTimeout(900);
      entered = true;
    }
    if (near === 'hut') {
      await p.locator('[data-hut]').waitFor({ timeout: 5000 });
      console.log('hut panel:', (await p.locator('[data-hut]').innerText()).replace(/\n/g, ' / '));
      await p.locator('[data-hut]').screenshot({ path: '.tmp/chatka.png' });
      await p.locator('[data-hut-deliver]').click();
      await p.waitForTimeout(500);
      console.log('hut panel after the quest:', await p.locator('[data-hut]').count());
    }
    console.log(near, 'entered:', entered, 'titles:', (await place.evaluateAll((els) => els.map((e) => e.getAttribute('title')))).join(' ; '));
    void gold; void log;
    if (game.errors.length) console.log(game.errors.join('\n'));
  } finally {
    await game.close();
  }
}
