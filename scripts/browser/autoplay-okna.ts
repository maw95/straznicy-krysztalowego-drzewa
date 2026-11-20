// Autoplay closes the report windows by itself: a game with a human seat, Autoplay ticked in Opcje, no clicks afterwards; the log tells which windows came up (and how long they stayed)
// and the game must go on until the end (or the time limit) without a manual click.
// Usage: npx tsx scripts/browser/autoplay-okna.ts [seconds=120]
import { openGame } from './game';
const limit = Number(process.argv[2] ?? 120) * 1000;
const g = await openGame('steps=1&mode=coop&seed=3&human=1', { scale: 0.3 });
const p = g.page;
await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Opcje' }).first().click();
await p.getByLabel(/Autoplay/).check();
await p.getByRole('button', { name: 'Zamknij' }).click();
const start = Date.now();
let seen = '';
let since = 0;
const longest: Record<string, number> = {};
while (Date.now() - start < limit) {
  const title = (await p.locator('.overlay').first().innerText().catch(() => '')).slice(0, 40).replace(/\s+/g, ' ');
  if (title !== seen) {
    if (seen) longest[seen] = Math.max(longest[seen] ?? 0, Date.now() - since);
    if (title) console.log(`${((Date.now() - start) / 1000).toFixed(0)}s window: ${title}`);
    seen = title;
    since = Date.now();
  }
  if (await p.locator('text=/Wygra|Koniec gry/').count()) break;
  await p.waitForTimeout(250);
}
console.log('longest stay (ms):', longest);
console.log('errors:', g.errors.slice(0, 3));
await g.close();
