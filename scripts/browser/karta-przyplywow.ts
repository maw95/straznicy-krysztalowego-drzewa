// Renders cards of the Brotherhood of the Tide (hero + support) as the game draws them -> .tmp/karty-przyplywow.png. Usage: npx tsx scripts/browser/karta-stad.ts [unit unit ...]
import { openGame } from './game';

const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['greatAurochs', 'kulan', 'steppeLamignat'];
const game = await openGame('cards=goldDragon&w=200', { scale: 1 });
try {
  const shots: Buffer[] = [];
  for (const id of ids) {
    await game.page.goto(`http://localhost:5180/?cards=${id}&w=420`);
    const card = game.page.locator('.card-sheen').first();
    await card.waitFor();
    await game.page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
    await game.page.evaluate(() => document.fonts.ready);
    await game.page.waitForTimeout(300);
    shots.push(await card.screenshot({ omitBackground: true }));
  }
  const html = '<body style="margin:0;background:#2a2118;display:flex;gap:12px;padding:12px">' + shots.map((b) => `<img src="data:image/png;base64,${b.toString('base64')}" style="height:600px">`).join('') + '</body>';
  await game.page.setContent(html);
  await game.page.waitForTimeout(300);
  await game.page.screenshot({ path: '.tmp/karty-przyplywow.png', fullPage: true });
} finally {
  await game.close();
}
