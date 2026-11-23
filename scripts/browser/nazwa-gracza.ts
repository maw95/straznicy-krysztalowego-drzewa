// The player's name under the crest of the hero panel and "Tura: <name>" in the bottom bar, with the widest 16-letter name. Usage: npx tsx scripts/browser/nazwa-gracza.ts [telefon|poziomo]
import { openGame } from './game';

const view = (process.argv[2] ?? 'desktop') as 'desktop' | 'telefon' | 'poziomo';
const game = await openGame('steps=0&seed=3&size=medium&players=1&mode=pvp', { scale: 2, view });
try {
  const p = game.page;
  await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /Jestem Ala/ }).click().catch(() => undefined);
  await p.waitForTimeout(600);
  await p.evaluate(() => {
    for (const sel of ['[data-hero-owner]', '[data-turn-label] span:first-child']) {
      const e = document.querySelector(sel);
      if (e) e.textContent = (sel.startsWith('[data-turn') ? 'Tura: ' : '') + 'Komputer Szalony 1';
    }
  });
  const o = await p.locator('[data-hero-owner]').boundingBox();
  console.log('owner label box', o, 'turn label:', await p.locator('[data-turn-label]').innerText().catch(() => '-'));
  await p.screenshot({ path: `.tmp/nazwa-${view}.png` });
  console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
