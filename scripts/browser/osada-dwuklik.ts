// Click check (level 3+): a double click on the hex of an own settlement opens its window even when the hero stands elsewhere; one click does not.
// Also screenshots the side panel with the list of settlements -> .tmp/lista-osad.png. Usage: npx tsx scripts/browser/osada-dwuklik.ts [telefon|poziomo]
import { openGame, type View } from './game';

const view = (process.argv[2] ?? 'desktop') as View;
const game = await openGame('steps=0&seed=3&size=long&economy=1&gold=40&players=1', { scale: 1, view });
try {
  const p = game.page;
  // The settlement the hero is not standing in: click its row in the list to centre the map and select it (that is the hex we then double click).
  const rows = p.locator('[data-settlement-link]');
  console.log('settlements in the list:', await rows.count());
  const open = p.locator('[data-settlement]');
  await p.locator('[data-enter-settlement]').click();
  await open.waitFor();
  console.log('window via button:', await open.count());
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  if (await open.count()) await p.getByRole('button', { name: 'Wyjdź z osady' }).click();
  await p.waitForTimeout(300);
  console.log('window after closing:', await open.count());
  await p.screenshot({ path: '.tmp/lista-osad.png' });
  // The hex of the first settlement: its list row selects it; a double click on the board hex opens the window.
  const name = (await rows.first().innerText()).trim();
  await rows.first().evaluate((el) => (el as HTMLElement).click());
  await p.waitForTimeout(900);
  const sel = p.locator('[data-settlement-hex="start-dawn"]');
  console.log('selected hex found:', await sel.count(), 'row:', name);
  if (await sel.count()) {
    const dbl = () => sel.evaluate((el) => { (el as HTMLElement).click(); (el as HTMLElement).click(); });
    await dbl();
    await p.waitForTimeout(800);
    console.log('window after a double click:', await open.count());
    await p.getByRole('button', { name: 'Wyjdź z osady' }).click();
    await p.waitForTimeout(600);
    // One click opens nothing (it only selects; the hero would walk there after the double-click time).
    await sel.evaluate((el) => (el as HTMLElement).click());
    await p.waitForTimeout(900);
    console.log('window after ONE click:', await open.count());
  }
  if (game.errors.length) console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
