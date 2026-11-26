// Deploying: with a unit picked, a click on another own unit swaps the two (backlog 101). -> .tmp/zamiana-*.png
// Usage: npx tsx scripts/browser/zamiana.ts [desktop|poziomo]
import { openGame } from './game';

const view = (process.argv[2] ?? 'desktop') as 'desktop' | 'telefon' | 'poziomo';
const game = await openGame('steps=400&until=deploy&mode=pvp&seed=3', { view, scale: 1 });
const p = game.page;
const where = async () => Object.fromEntries(await p.locator('button.token[data-unit]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [e.getAttribute("data-unit"), `${Math.round(r.x)},${Math.round(r.y)} hp=${(e as HTMLElement).innerText.trim()} active=${document.activeElement === e}`]; })));
try {
  await p.waitForTimeout(5000);
  await p.locator('.arena-frame').screenshot({ path: `.tmp/zamiana-${view}-przed.png` });
  const before = await where();
  console.log('before', before);
  // The first two units of the deploying side are the leftmost ones (Przymierze deploys first on the left).
  // Two one-hex units of the side deploying first (Przymierze, seed 3: the nymph and the druid).
  const ids = (process.env.PAIR ?? 'nymph,elfDruid').split(',');
  await p.locator(`button.token[data-unit="${ids[0]}"]`).click({ force: true });
  await p.waitForTimeout(300);
  console.log('hint after the first click:', await p.getByText(/Wskaż złote pole|Kliknij jednostkę/).allInnerTexts());
  await p.locator(`button.token[data-unit="${ids[1]}"]`).click({ force: true });
  // The tokens glide to their new cells.
  await p.waitForTimeout(2500);
  console.log('hint after the second click:', await p.getByText(/Wskaż złote pole|Kliknij jednostkę/).allInnerTexts());
  const after = await where();
  console.log('after ', after);
  const at = (m: Record<string, string>, id: string) => m[id].split(' ')[0];
  console.log('swapped:', at(after, ids[0]) === at(before, ids[1]) && at(after, ids[1]) === at(before, ids[0]));
  await p.locator('.arena-frame').screenshot({ path: `.tmp/zamiana-${view}.png` });
  console.log('errors', game.errors);
} finally {
  await game.close();
}
