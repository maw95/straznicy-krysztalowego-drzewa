// The right button on the gold and on each resource in the bottom bar shows the income of that one thing; hints are capitalised. Usage: npx tsx scripts/browser/dochod-surowcow.ts
import { openGame } from './game';

const game = await openGame('steps=0&seed=3&size=medium&realm=1&players=1&gold=20&res=5&reveal=1', { scale: 1 });
try {
  const p = game.page;
  await p.waitForTimeout(1200);
  const targets = [['gold', '[data-gold-box] > span'], ['wood', '[data-res="wood"]'], ['ore', '[data-res="ore"]'], ['dust', '[data-res="dust"]']] as const;
  for (const [name, sel] of targets) {
    const el = p.locator(sel).first();
    const b = await el.boundingBox();
    if (!b) { console.log(name, 'not found'); continue; }
    console.log(name, 'title:', await el.getAttribute('title'));
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await p.mouse.down({ button: 'right' });
    await p.waitForTimeout(250);
    const bubble = p.locator('[data-resource-details], .plate.parch:has-text("dochód")').last();
    console.log(name, 'bubble:', (await bubble.innerText({ timeout: 2000 }).catch(() => '(none)')).replace(/\n/g, ' | '));
    await p.screenshot({ path: `.tmp/dochod-${name}.png`, clip: { x: Math.max(0, b.x - 100), y: Math.max(0, b.y - 220), width: 560, height: 280 } });
    await p.mouse.up({ button: 'right' });
  }
  console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
