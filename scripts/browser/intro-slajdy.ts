// Makes the pictures of the intro slides 05-13 from the real game (so they always show the current designs): screenshots of the map, the arena
// and the menu pages, 1600x900, JPEG, into public/assets/intro/. Run: npx tsx scripts/browser/intro-slajdy.ts (own Vite server on :5180).
// Slide 12 (the online room) needs a game server: for English it was shot against a scratch server (see wlasny-online.ts), logged in, New game > Co-op > Adventure > Create the table > Take a seat.
// With the argument `en` the same slides are shot with ?lang=en and saved as <id>_en.jpg (the intro shows them to English players).
import { openGame } from './game';

const OUT = 'public/assets/intro';
const EN = process.argv[2] === 'en';
const T: Record<string, string> = EN ? { 'Nowa gra': 'New game', Kooperacja: 'Co-op', 'Ten komputer': 'This computer', Przygoda: 'Adventure', Wyprawa: 'Run' } : {};
const shot = async (query: string, name: string, steps?: (p: import('playwright').Page) => Promise<void>) => {
  const g = await openGame(EN ? `${query}${query ? '&' : ''}lang=en` : query, { scale: 1 });
  await g.page.waitForTimeout(EN ? (query.includes('until=battle') ? 9000 : 4000) : 1800);
  if (steps) await steps(g.page);
  if (EN) await englishLeftovers(g.page);
  await g.page.waitForTimeout(500);
  await g.page.screenshot({ path: `${OUT}/${name}${EN ? '_en' : ''}.jpg`, type: 'jpeg', quality: 82 });
  if (g.errors.length) console.log(name, g.errors.slice(0, 2));
  await g.close();
};
/** A few Polish bits the dictionary does not cover yet (the "z" in "Step 1 z 3" and "Round 2 z 12", win/loss counters, "brak", "(Ty)"): fixed in the page just before the shot. */
const FIXES: [RegExp, string][] = [[/^((?:Step|Round) \d+) z (\d+)/, '$1 of $2'], [/wersja cyfrowa/, 'digital version'], [/ wygr\.$/, ' won'], [/ przegr\.$/, ' lost'], [/^brak$/, 'none'], [/\(Ty\)/, '(You)']];
const englishLeftovers = (p: import('playwright').Page) =>
  p.evaluate((fixes) => {
    // Only elements with no element children (their text is one run, even if React made several text nodes of it).
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      if (el.children.length) continue;
      let t = el.textContent ?? '';
      const before = t;
      for (const [src, to] of fixes) t = t.replace(new RegExp(src[0], src[1]), to);
      if (t !== before) el.textContent = t;
    }
  }, FIXES.map(([r, to]) => [[r.source, r.flags], to] as [[string, string], string]));
const click = async (p: import('playwright').Page, t: string) => {
  const card = p.locator('.opt-card-title', { hasText: new RegExp(`^${T[t] ?? t}$`) }).first();
  for (let i = 0; i < 3; i++) if (await card.click({ timeout: 6000 }).then(() => true, () => false)) break;
  await p.waitForTimeout(350);
};
const toWizard = async (p: import('playwright').Page, mode: string, ...labels: string[]) => {
  await click(p, 'Nowa gra');
  await click(p, mode);
  await click(p, 'Ten komputer');
  for (const l of labels) await click(p, l);
};

await shot('steps=12&seed=4&growth=1&size=medium', '05-cel');
await shot('steps=18&seed=5&growth=1&size=long', '06-wedrowka');
await shot('steps=400&until=battle&seed=3', '07-bitwa');
// The new-game wizard now starts with the mode page, then "where", then the level (tier) page, then the goal page.
await shot('', '08-tryby', (p) => click(p, 'Nowa gra'));
await shot('', '09-wersje'); // the first menu page: "Wersja planszowa" is the link at the bottom
await shot('', '10-poziomy', (p) => toWizard(p, 'Kooperacja'));
await shot('', '11-cele', (p) => toWizard(p, 'Kooperacja', 'Wyprawa'));
await shot('mode=arena&steps=60&until=battle&ruleset=digital', '13-arena');
console.log('done');
