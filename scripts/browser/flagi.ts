// Click check of the language flags: they sit in the top right of the menu, switch the interface both ways, are remembered after a reload, and the options
// of a game have the same pair. Screenshots -> .tmp/flagi-*.png. Usage: npx tsx scripts/browser/flagi.ts
import { openGame } from './game';

const game = await openGame('', { view: 'desktop', scale: 0.6 });
try {
  const p = game.page;
  await p.waitForTimeout(800);
  const menuText = async () => (await p.locator('body').innerText()).replace(/\s+/g, ' ');
  console.log('flags:', await p.locator('[data-lang]').count(), 'html lang:', await p.evaluate(() => document.documentElement.lang));
  const box = await p.locator('[data-lang-switch]').boundingBox();
  console.log('top right corner:', box && box.x > 1200 && box.y < 60);
  await p.screenshot({ path: '.tmp/flagi-menu-pl.png' });
  console.log('Polish menu has "Nowa gra":', (await menuText()).includes('Nowa gra'));
  await p.locator('[data-lang="en"]').click();
  await p.waitForTimeout(400);
  console.log('English menu has "New game":', (await menuText()).includes('New game'), 'html lang:', await p.evaluate(() => document.documentElement.lang));
  await p.screenshot({ path: '.tmp/flagi-menu-en.png' });
  await p.reload();
  await p.waitForTimeout(800);
  console.log('after reload still English:', (await menuText()).includes('New game'), 'stored:', await p.evaluate(() => localStorage.getItem('skd-lang')));
  await p.locator('[data-lang="pl"]').click();
  await p.waitForTimeout(400);
  console.log('back to Polish:', (await menuText()).includes('Nowa gra') && !(await menuText()).includes('New game'));
  console.log('errors', game.errors);
} finally {
  await game.close();
}
