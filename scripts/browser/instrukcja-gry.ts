// The in-game manual (Rules and cards → Manual) in a language: chapters shown, search, a link jump, no Polish left over.
// Usage: npx tsx scripts/browser/instrukcja-gry.ts [en|pl]
import { openGame } from './game';

const lang = process.argv[2] ?? 'en';
const game = await openGame(`steps=0&seed=3&size=medium&realm=1&players=1&lang=${lang}`, { view: 'desktop', scale: 1 });
try {
  const p = game.page;
  await p.waitForTimeout(1200);
  await p.getByRole('button', { name: /^(Zasady|Rules)$/ }).first().click();
  await p.waitForTimeout(500);
  await p.getByRole('button', { name: /^(Manual|Instrukcja)$/ }).first().click();
  await p.waitForTimeout(500);
  const chapters = await p.locator('[data-manual] section[data-chapter] h2').allTextContents();
  console.log(`chapters: ${chapters.length}; first: ${chapters[0]}; last: ${chapters[chapters.length - 1]}`);
  const polish = await p.evaluate(() => {
    const out: string[] = [];
    const w = document.createTreeWalker(document.querySelector('[data-manual]')!, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { const t = (n as Text).data.replace(/\s+/g, ' ').trim(); if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(t)) out.push(t.slice(0, 80)); }
    return out;
  });
  console.log(`texts with Polish letters: ${polish.length}`, polish.slice(0, 8));
  await p.locator('[data-manual-search]').fill(lang === 'en' ? 'moat' : 'fosa');
  await p.waitForTimeout(300);
  console.log('search:', (await p.locator('[data-manual-results] h2').textContent()));
  await p.locator('[data-manual-results] a').first().click();
  await p.waitForTimeout(800);
  const link = p.locator('[data-manual] a.manual-link').first();
  console.log('first link:', await link.textContent());
  await link.click();
  await p.waitForTimeout(900);
  await p.locator('[data-manual]').screenshot({ path: `.tmp/instrukcja-gry-${lang}.png` });
  console.log(`.tmp/instrukcja-gry-${lang}.png`);
} finally {
  await game.close();
}
