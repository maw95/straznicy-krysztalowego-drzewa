// Look at the treasure chest and the spell book in a battle (58d): layout, right-click details, pager, closing. Usage: npx tsx scripts/browser/skrzynia-ksiega.ts [telefon]
import { openGame } from './game';

const phone = process.argv[2] === 'telefon' || process.argv[2] === 'poziomo';
const VIEW = (process.argv[2] === 'poziomo' ? 'poziomo' : 'telefon') as 'telefon' | 'poziomo';
{
  const game = await openGame('steps=0&seed=3&size=medium&realm=1&mode=pvp&siege=0&garrison=1', { scale: 1, view: phone ? VIEW : 'desktop' });
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
    for (let i = 0; i < 40 && !(await p.locator('[data-spell-btn]').count()); i++) {
      if (await ready.count()) await ready.first().click().catch(() => undefined);
      if ((await end.count()) && (await end.first().isEnabled())) await end.first().click().catch(() => undefined);
      await p.waitForTimeout(1200);
    }
    const tag = phone ? '-tel' : '';
    await p.locator('[data-spell-btn]').click();
    await p.locator('[data-spell-list]').waitFor();
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `.tmp/ksiega${tag}.png` });
    const slot = p.locator('[data-spell]').first();
    const box = await slot.boundingBox();
    if (box) { await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down({ button: 'right' }); await p.waitForTimeout(300); await p.screenshot({ path: `.tmp/ksiega-opis${tag}.png` }); await p.mouse.up({ button: 'right' }); }
    await p.locator('.close-seal').click();
    await p.waitForTimeout(1200);
    console.log('book closed:', (await p.locator('[data-spell-list]').count()) === 0);
    await p.locator('[data-treasure-btn]').click();
    await p.locator('[data-treasures]').waitFor();
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `.tmp/skrzynia${tag}.png` });
    console.log('anims:', await p.evaluate(() => document.getAnimations().map((a) => (a as CSSAnimation).animationName + '@' + Math.round(a.currentTime as number)).join(' ')));
    // Freeze the animations at 25 %, 50 % and 75 % to look at the frames.
    const clip = { x: 300, y: 60, width: 1000, height: 780 };
    for (const t of phone ? [] : [0.13, 0.3, 0.43, 0.6]) { await p.evaluate((x) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = x * 850; }), t); await p.screenshot({ path: `.tmp/skrzynia-anim${tag}-${t}.png`, clip }); }

    console.log('slots:', await p.locator('[data-item-slot]').count(), 'pager:', await p.locator('[data-pager]').count());
    await p.keyboard.press(process.env.KEY ?? 'Enter');
    await p.waitForTimeout(1200);
    console.log('chest closed by '+(process.env.KEY ?? 'Enter')+':', (await p.locator('[data-treasures]').count()) === 0);
    if (game.errors.length) console.log(game.errors.join('\n'));
  } finally {
    await game.close();
  }
}
