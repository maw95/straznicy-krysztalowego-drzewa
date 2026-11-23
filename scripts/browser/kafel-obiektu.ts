// Tile names on the map (62c): object tiles are named after the object; right button shows the bubble. Usage: npx tsx scripts/browser/kafel-obiektu.ts
import { openGame } from './game';

{
  const game = await openGame('steps=0&seed=3&size=medium&players=1&reveal=1&realm=1', { scale: Number(process.env.SC ?? 1) });
  try {
    const p = game.page;
    await p.waitForTimeout(1500);
    const labels = await p.locator('button[aria-label]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')!).filter((l) => /Kopalnia|Tartak|Kapliczka|Obóz|Skrzynia|Chatka|Młyn|Studnia|składnica|Odłamek|Pyłu/.test(l)));
    console.log('object tiles:', labels.length, [...new Set(labels)].join(' | '));
    const tile = p.locator('button[aria-label]').filter({ hasText: '' }).locator('xpath=self::*[contains(@aria-label,"Kopalnia") or contains(@aria-label,"Tartak") or contains(@aria-label,"Młyn") or contains(@aria-label,"Studnia")]').first();
    const b = await tile.boundingBox();
    const all = p.locator('[data-type-badge]');
    console.log('badges:', await all.count(), 'used:', await p.locator('.type-badge.used').count(), 'owner banners:', await p.locator('[data-owner-banner]').count());
    if (b) {
      await p.screenshot({ path: '.tmp/kafel-znacznik.png', clip: { x: Math.max(0, b.x - 200), y: Math.max(0, b.y - 160), width: 420, height: 380 } });
      await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await p.mouse.down({ button: 'right' });
      await p.waitForTimeout(300);
      await p.screenshot({ path: '.tmp/kafel-obiektu.png', clip: { x: Math.max(0, b.x - 200), y: Math.max(0, b.y - 160), width: 420, height: 380 } });
      await p.mouse.up({ button: 'right' });
    }
    if (game.errors.length) console.log(game.errors.join('\n'));
  } finally {
    await game.close();
  }
}
