// Makes the pictures of the intro slides 05-13 from the real game (so they always show the current designs): screenshots of the map, the arena
// and the menu pages, 1600x900, JPEG, into public/assets/intro/. Run: npx tsx scripts/browser/intro-slajdy.ts (own Vite server on :5180).
import { openGame } from './game';

const OUT = 'public/assets/intro';
const shot = async (query: string, name: string, steps?: (p: import('playwright').Page) => Promise<void>) => {
  const g = await openGame(query, { scale: 1 });
  await g.page.waitForTimeout(1800);
  if (steps) await steps(g.page);
  await g.page.waitForTimeout(500);
  await g.page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 82 });
  if (g.errors.length) console.log(name, g.errors.slice(0, 2));
  await g.close();
};
const click = async (p: import('playwright').Page, t: string) => {
  await p.locator('.opt-card-title', { hasText: new RegExp(`^${t}$`) }).first().click();
  await p.waitForTimeout(350);
};
const toWizard = async (p: import('playwright').Page, ...labels: string[]) => {
  await click(p, 'Nowa gra');
  await click(p, 'Ten komputer');
  for (const l of labels) await click(p, l);
};

await shot('steps=40&seed=4&growth=1&size=medium', '05-cel');
await shot('steps=26&seed=5&growth=1&size=long', '06-wedrowka');
await shot('steps=400&until=battle&seed=3', '07-bitwa');
await shot('', '08-tryby', (p) => toWizard(p, 'Cyfrowa', 'Przygoda'));
await shot('', '09-wersje', (p) => toWizard(p));
await shot('', '10-poziomy', (p) => toWizard(p, 'Cyfrowa'));
await shot('', '11-cele', (p) => toWizard(p, 'Cyfrowa', 'Wyprawa', 'Kooperacja'));
await shot('mode=arena&steps=60&until=battle&ruleset=digital', '13-arena');
console.log('done');
