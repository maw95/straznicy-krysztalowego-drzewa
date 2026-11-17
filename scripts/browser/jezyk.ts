// Language check: walks the menu, every page of the new-game wizard, the rules window and some dialogs with ?lang=en and lists the texts that stayed Polish
// (a text node with a Polish letter). Usage: npx tsx scripts/browser/jezyk.ts [en|pl]. Complements TEST_LANG=en scripts/browser/telefon.ts.
import type { Page } from 'playwright';
import { openGame } from './game';

const lang = process.argv[2] ?? 'en';
const POL = `(() => { const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.data.replace(/\\s+/g, ' ').trim(); if (t.length > 2 && /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(t) && !out.includes(t)) out.push(t); } return out; })()`;
const seen = new Map<string, string>();
const scan = async (p: Page, where: string) => {
  for (const t of (await p.evaluate(POL)) as string[]) if (!seen.has(t)) seen.set(t, where);
};

const game = await openGame(`lang=${lang}`, { view: 'desktop', scale: 1 });
try {
  const p = game.page;
  await p.waitForTimeout(800);
  await scan(p, 'menu');
  // wizard pages
  await p.getByText(/^(Nowa gra|New game)$/).first().click();
  for (let i = 0; i < 9; i++) {
    await p.waitForTimeout(350);
    await scan(p, `kreator ${i}`);
    const page = p.locator('[data-wizard-page]').first();
    const next = p.getByRole('button', { name: /^(Dalej →|Next →)$/ });
    if (await next.count() && (await next.first().isEnabled())) { await next.first().click(); continue; }
    const choice = page.locator('button:not([aria-pressed="true"])').first();
    if (await choice.count()) await choice.click().catch(() => undefined);
    else break;
  }
  await p.keyboard.press('Escape');
  await game.page.goto(`http://localhost:5180/?steps=0&seed=3&size=medium&realm=1&players=1&lang=${lang}`);
  await p.waitForTimeout(1500);
  // rules window: every tab
  await p.getByRole('button', { name: /^(Zasady|Rules)$/ }).first().click();
  await p.waitForTimeout(600);
  const tabNames = [/Basic rules|Podstawowe zasady/, /Units|Jednostki/, /Treasures|Skarby/, /Artifacts|Artefakty/, /Map locations|Lokacje na mapie/, /Versions and levels|Wersje i poziomy/, /Manual|Instrukcja/];
  const n = tabNames.length;
  const tabs = { nth: (i: number) => p.getByRole('button', { name: tabNames[i] }).first() };
  for (let i = 0; i < n; i++) { await tabs.nth(i).click().catch(() => undefined); await p.waitForTimeout(300); await scan(p, `zasady ${i}`); }
  await scan(p, 'zasady');
  console.log('rules tabs:', n);
} catch (e) {
  console.log('FAIL', String(e).slice(0, 200));
} finally {
  await game.close();
}
for (const [t, w] of seen) console.log(`${w.padEnd(12)} ${t.slice(0, 160)}`);
console.log(`${seen.size} Polish texts left (${lang})`);
