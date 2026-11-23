// Audit: finds gold and resources written as words ("2 zł", "3 drewna", "1 ruda", "Pył") in the visible text instead of their icons. Usage: npx tsx scripts/browser/audyt-surowcow.ts
import type { Page } from 'playwright';
import { openGame } from './game';

const RE = /\d\s?[×x]?\s?(zł|złot|drewn|rud[aęy]|ruda|pył|gwiezdn)/gi;
const found = new Map<string, string>();
async function scan(p: Page, label: string) {
  // The visible text nodes only (the icons of StatText are images).
  const hits: string[] = await p.evaluate((src) => {
    const re = new RegExp(src, 'gi');
    const out: string[] = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const el = n.parentElement;
      if (!el || el.closest('script,style') || !(el as HTMLElement).offsetParent) continue;
      const t = n.textContent ?? '';
      if (re.test(t)) out.push(t.trim().slice(0, 140));
      re.lastIndex = 0;
    }
    return out;
  }, RE.source);
  for (const h of hits) if (!found.has(h)) found.set(h, label);
}

const game = await openGame('steps=0&seed=3&size=medium&realm=1&gold=60&res=9&players=1&built=barracks,hospital,market&reveal=1', { scale: 1 });
try {
  const p = game.page;
  await p.waitForTimeout(1200);
  await scan(p, 'map');
  // every place and site on the map: the side panel and the bubble
  const places = p.locator('[data-place], [data-site]');
  const n = await places.count();
  for (let i = 0; i < n; i++) {
    const el = places.nth(i);
    const kind = (await el.getAttribute('data-place')) ?? (await el.getAttribute('data-site'));
    const b = await el.boundingBox();
    if (!b) continue;
    await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2).catch(() => undefined);
    await p.waitForTimeout(150);
    await scan(p, `map tile ${kind}`);
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await p.mouse.down({ button: 'right' });
    await p.waitForTimeout(200);
    await scan(p, `map bubble ${kind}`);
    await p.mouse.up({ button: 'right' });
  }
  // the gold box bubble
  const gold = p.locator('[data-gold-box]');
  if (await gold.count()) { const b = await gold.boundingBox(); if (b) { await p.mouse.move(b.x + 10, b.y + 10); await p.mouse.down({ button: 'right' }); await p.waitForTimeout(200); await scan(p, 'gold bubble'); await p.mouse.up({ button: 'right' }); } }
  // the settlement window and its panels
  await p.locator('[data-enter-settlement]').click().catch(() => undefined);
  await p.waitForTimeout(500);
  await scan(p, 'settlement');
  for (const b of await p.locator('[data-building]').all()) {
    await b.click().catch(() => undefined);
    await p.waitForTimeout(200);
    await scan(p, `settlement building ${await b.getAttribute('data-building')}`);
    await p.locator('[data-tree-back]').click({ timeout: 300 }).catch(() => undefined);
  }
  // the settlement is closed; the rules dialog with all its tabs, the log, the manual
  await p.keyboard.press('Escape').catch(() => undefined);
  await p.waitForTimeout(300);
  await p.keyboard.press('r');
  await p.waitForTimeout(500);
  await scan(p, 'rules');
  for (const t of await p.locator('[role="tab"], .rules-tab, [data-rules-tab]').all()) { await t.click().catch(() => undefined); await p.waitForTimeout(200); await scan(p, `rules tab ${(await t.innerText().catch(() => '')).slice(0, 20)}`); }
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  await p.keyboard.press('d');
  await p.waitForTimeout(400);
  await scan(p, 'log');
  await p.keyboard.press('Escape');
  console.log([...found].map(([t, l]) => `[${l}] ${t}`).join('\n') || 'nothing found');
  console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
