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

const SCREENS: Screen[] = [
  { id: 'menu', query: '', views: [...LANDSCAPE, 'telefon'] },
  { id: 'kreator-edycja', query: '', go: async (p) => { await p.getByText('Nowa gra', { exact: true }).first().click(); } },
  { id: 'mapa', query: MAP, go: closeDev },
  { id: 'osada', query: MAP, go: async (p) => { await closeDev(p); await p.locator('[data-enter-settlement]').click(); await p.locator('[data-settlement]').waitFor(); } },
  { id: 'osada-drzewko', query: MAP, go: async (p) => { await closeDev(p); await p.locator('[data-enter-settlement]').click(); await p.locator('[data-building="council"]').click(); await p.locator('[data-building-tree]').waitFor(); } },
  { id: 'zasady', query: MAP, go: async (p) => { await closeDev(p); await p.keyboard.press('r'); await p.waitForTimeout(400); } },
  { id: 'bitwa-ustawianie', query: `${MAP.replace('&dev=1', '')}&encounter=0`, go: async (p) => { await p.waitForTimeout(1200); } },
  { id: 'arena-artefakt', query: 'steps=0&mode=arena&size=6&seed=5', go: async (p) => { await p.locator('[data-gear-offer]').first().waitFor(); } },
  { id: 'arena-pomocnicy', query: 'steps=0&mode=arena&size=6&seed=5', go: async (p) => { await p.locator('[data-gear-offer]').first().click(); await p.getByRole('button', { name: 'Biorę ten artefakt' }).click(); await p.getByRole('button', { name: 'Biorę ten artefakt' }).click().catch(() => undefined); await p.getByRole('button', { name: 'Do bitwy!' }).waitFor(); } },
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
  return { hscroll: document.documentElement.scrollWidth - vw, off, small, hover };
})()`;

const wanted = process.argv[2]?.split(',');
const lines: string[] = [];
let failed = 0;
for (const screen of SCREENS.filter((s) => !wanted || wanted.includes(s.id))) {
  for (const view of screen.views ?? LANDSCAPE) {
    const game = await openGame(screen.query, { view, scale: 1 });
    try {
      const p = game.page;
      await p.waitForTimeout(700);
      await screen.go?.(p);
      await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
      await p.waitForTimeout(400);
      const r = (await p.evaluate(INSPECT)) as { hscroll: number; off: string[]; small: string[]; hover: number };
      const bad = r.hscroll > 0 || r.off.length > 0;
      if (bad) { failed++; await p.screenshot({ path: `.tmp/telefon-${screen.id}-${view}.png` }); }
      lines.push(`${bad ? 'USTERKA' : 'ok     '} ${screen.id.padEnd(18)} ${view.padEnd(12)} hscroll ${r.hscroll}  poza ekranem ${r.off.length}  za małe ${r.small.length}  tylko-hover ${r.hover}`);
      for (const o of r.off.slice(0, 6)) lines.push(`    poza ekranem: ${o}`);
      for (const o of r.small.slice(0, 4)) lines.push(`    za mały cel: ${o}`);
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
