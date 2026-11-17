// The phone check (backlog 47): walks the screens of the game on narrow screens held sideways (and the menu upright) and lists what overlaps the edge,
// scrolls the page sideways, is too small to touch (under 44 px) or works only on hover. Screenshots of the screens that fail go to .tmp/telefon-<screen>-<view>.png,
// the list to .tmp/telefon-raport.txt. Usage: npx tsx scripts/browser/telefon.ts [screen,screen] (default: all)

import { writeFileSync } from 'node:fs';
import type { Page } from 'playwright';
import { openGame, type View } from './game';

interface Screen {
  id: string;
  query: string;
  /** Gets from the page's first state to the screen. */
  go?: (p: Page) => Promise<void>;
  /** Views to check (default: the three landscape phones). */
  views?: View[];
}

const LANDSCAPE: View[] = ['malypoziomo', 'poziomo', 'duzypoziomo'];
const MAP = 'steps=0&seed=3&size=medium&realm=1&players=1&dev=1';
const closeDev = async (p: Page) => { await p.locator('[data-dev-panel] button:has-text("Zamknij")').click().catch(() => undefined); };

/** The 6 on 6 arena up to the hero's activation (artifact, spells, supports, deployment, the supports' activations). */
const toArenaFight = async (p: Page) => {
  await p.locator('[data-gear-offer]').first().click();
  await p.getByRole('button', { name: /Biorę ten artefakt|I take this artifact/ }).click();
  await p.locator('[data-spell-offer]').nth(0).click();
  await p.locator('[data-spell-offer]').nth(1).click();
  await p.getByRole('button', { name: /Biorę te czary|I take these spells/ }).click();
  const go = p.getByRole('button', { name: /Do bitwy\!|To battle\!/ });
  await go.waitFor();
  const cards = go.locator('xpath=preceding-sibling::div[1]/button');
  for (let i = 0; i < 5; i++) await cards.nth(i).click();
  await go.click();
  const ready = p.getByRole('button', { name: /Gotowe|Ready/ });
  const end = p.getByRole('button', { name: /^(Koniec|End)$/ });
  for (let i = 0; i < 60 && !(await p.locator('[data-spell-btn]').count()); i++) {
    const take = p.getByRole('button', { name: /Biorę ten skarb|I take this treasure/ });
    if (await take.count()) { await p.locator('[aria-pressed]').first().click().catch(() => undefined); await take.click().catch(() => undefined); }
    else if (await ready.count()) await ready.first().click().catch(() => undefined);
    else if ((await end.count()) && (await end.first().isEnabled())) await end.first().click().catch(() => undefined);
    await p.waitForTimeout(700);
  }
};
const ARENA = 'steps=0&mode=arena&size=6&seed=5';

const SCREENS: Screen[] = [
  { id: 'menu', query: '', views: [...LANDSCAPE, 'telefon'] },
  { id: 'kreator-edycja', query: '', go: async (p) => { await p.getByText(/^(Nowa gra|New game)$/).first().click(); } },
  { id: 'mapa', query: MAP, go: closeDev },
  { id: 'osada', query: MAP, go: async (p) => { await closeDev(p); await p.locator('[data-enter-settlement]').click(); await p.locator('[data-settlement]').waitFor(); } },
  { id: 'osada-drzewko', query: MAP, go: async (p) => { await closeDev(p); await p.locator('[data-enter-settlement]').click(); await p.locator('[data-building="council"]').click(); await p.locator('[data-building-tree]').waitFor(); } },
  { id: 'zasady', query: MAP, go: async (p) => { await closeDev(p); await p.keyboard.press('r'); await p.waitForTimeout(400); } },
  { id: 'bitwa-ustawianie', query: `${MAP.replace('&dev=1', '')}&encounter=0`, go: async (p) => { await p.waitForTimeout(1200); } },
  { id: 'bohater-plecak', query: MAP, go: async (p) => { await closeDev(p); await p.locator('[data-hero-sheet-open]').click(); await p.waitForTimeout(400); } },
  { id: 'opcje', query: MAP, go: async (p) => { await closeDev(p); await p.keyboard.press('o'); await p.waitForTimeout(400); } },
  { id: 'zglos-blad', query: MAP, go: async (p) => { await closeDev(p); await p.keyboard.press('b'); await p.waitForTimeout(400); } },
  { id: 'skrzynia', query: 'steps=0&seed=3&size=medium&realm=1&players=1', go: async (p) => { await p.locator('[data-treasure-btn]').first().click(); await p.waitForTimeout(400); } },
  { id: 'arena-walka', query: ARENA, go: toArenaFight },
  { id: 'arena-ksiega', query: ARENA, go: async (p) => { await toArenaFight(p); await p.locator('[data-spell-btn]').click(); await p.locator('[data-spell-list]').waitFor(); } },
  { id: 'arena-artefakt', query: 'steps=0&mode=arena&size=6&seed=5', go: async (p) => { await p.locator('[data-gear-offer]').first().waitFor(); } },
  { id: 'arena-pomocnicy', query: 'steps=0&mode=arena&size=6&seed=5', go: async (p) => { await p.locator('[data-gear-offer]').first().click(); await p.getByRole('button', { name: /Biorę ten artefakt|I take this artifact/ }).click(); await p.locator('[data-spell-offer]').first().waitFor(); await p.locator('[data-spell-offer]').nth(0).click(); await p.locator('[data-spell-offer]').nth(1).click(); await p.getByRole('button', { name: /Biorę te czary|I take these spells/ }).click(); await p.getByRole('button', { name: /Do bitwy\!|To battle\!/ }).waitFor(); } },
  { id: 'arena-czary', query: 'steps=0&mode=arena&size=6&seed=5', go: async (p) => { await p.locator('[data-gear-offer]').first().click(); await p.getByRole('button', { name: /Biorę ten artefakt|I take this artifact/ }).click(); await p.locator('[data-spell-offer]').first().waitFor(); } },
];

/** What is wrong with the page as it is now: plain JavaScript run in the page (a function of this file would get helpers from the bundler that the page does not have). */
const INSPECT = `(() => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const label = (el) => {
    const t = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.className || el.tagName).toString().trim().replace(/\\s+/g, ' ').slice(0, 28);
    const key = el.dataset ? Object.keys(el.dataset)[0] : '';
    return el.tagName.toLowerCase() + (key ? '[' + key + ']' : '') + ' "' + t + '"';
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0' && cs.pointerEvents !== 'none';
  };
  /* Inside something that scrolls on this axis, an element beyond the edge is only a scrolled one. */
  const scrolled = (el, axis) => {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const o = axis === 'x' ? cs.overflowX : cs.overflowY;
      if ((o === 'auto' || o === 'scroll') && (axis === 'x' ? n.scrollWidth > n.clientWidth : n.scrollHeight > n.clientHeight)) return true;
      if (cs.position === 'fixed') return false;
    }
    /* The page itself scrolls down: a button below the fold is reachable (sideways it must not scroll). */
    return axis === 'y' && document.documentElement.scrollHeight > vh + 1 && getComputedStyle(el).position !== 'fixed';
  };
  const off = [];
  const small = [];
  for (const el of document.querySelectorAll('button, a[href], [role="button"], input, select, textarea')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 && !scrolled(el, 'x')) off.push(label(el) + ' right ' + Math.round(r.right - vw) + 'px beyond');
    else if (r.left < -1 && !scrolled(el, 'x')) off.push(label(el) + ' left ' + Math.round(-r.left) + 'px beyond');
    else if (r.bottom > vh + 1 && !scrolled(el, 'y')) off.push(label(el) + ' bottom ' + Math.round(r.bottom - vh) + 'px beyond');
    else if (r.top < -1 && !scrolled(el, 'y')) off.push(label(el) + ' top ' + Math.round(-r.top) + 'px beyond');
    if (r.width < 44 || r.height < 44) small.push(label(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  /* Hover-only: information kept in title attributes of things that are not buttons (a phone has no hover). */
  const hover = document.querySelectorAll('[title]:not(button):not(a):not(img)').length;
  /* Texts that are still Polish (checked with TEST_LANG=en: what the English dictionary lacks). */
  const polish = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.data.replace(/\\s+/g, ' ').trim();
    if (t.length > 2 && /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(t) && !polish.includes(t)) polish.push(t);
  }
  return { hscroll: document.documentElement.scrollWidth - vw, off, small, hover, polish };
})()`;

const wanted = process.argv[2]?.split(',');
/** TEST_LANG=en runs every screen in English and lists the texts that stayed Polish. */
const TEST_LANG = process.env.TEST_LANG;
const lines: string[] = [];
let failed = 0;
for (const screen of SCREENS.filter((s) => !wanted || wanted.includes(s.id))) {
  for (const view of screen.views ?? LANDSCAPE) {
    const game = await openGame(TEST_LANG ? `${screen.query}${screen.query ? '&' : ''}lang=${TEST_LANG}` : screen.query, { view, scale: 1 });
    try {
      const p = game.page;
      await p.waitForTimeout(700);
      await screen.go?.(p);
      await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
      await p.waitForTimeout(400);
      const r = (await p.evaluate(INSPECT)) as { hscroll: number; off: string[]; small: string[]; hover: number; polish: string[] };
      const bad = r.hscroll > 0 || r.off.length > 0;
      if (bad || process.env.SHOT) { if (bad) failed++; await p.screenshot({ path: `.tmp/telefon-${screen.id}-${view}.png` }); }
      lines.push(`${bad ? 'USTERKA' : 'ok     '} ${screen.id.padEnd(18)} ${view.padEnd(12)} hscroll ${r.hscroll}  poza ekranem ${r.off.length}  za małe ${r.small.length}  tylko-hover ${r.hover}`);
      for (const o of r.off.slice(0, 6)) lines.push(`    poza ekranem: ${o}`);
      for (const o of r.small.slice(0, 4)) lines.push(`    za mały cel: ${o}`);
      if (TEST_LANG === 'en') for (const o of r.polish) lines.push(`    POLSKI: ${o}`);
      if (game.errors.length) lines.push(`    błędy: ${game.errors.slice(0, 2).join(' | ').slice(0, 200)}`);
    } catch (e) {
      failed++;
      lines.push(`PADŁO   ${screen.id.padEnd(18)} ${view.padEnd(12)} ${String(e).slice(0, 160).replace(/\n/g, ' ')}`);
      await game.page.screenshot({ path: `.tmp/telefon-${screen.id}-${view}-stan.png` }).catch(() => undefined);
    } finally {
      await game.close();
    }
  }
}
writeFileSync('.tmp/telefon-raport.txt', lines.join('\n') + '\n');
console.log(lines.join('\n'));
console.log(`\n${failed} ekranów z usterkami (przewijanie poziome lub element poza ekranem); raport: .tmp/telefon-raport.txt`);
process.exit(failed ? 1 : 0);
