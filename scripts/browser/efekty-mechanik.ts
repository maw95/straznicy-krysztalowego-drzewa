// Light effects of the mechanics (BACKLOG 81): bots of two factions play with Autoplay and a MutationObserver counts the effects that show up on the arena
// (data-fx: herds_push, herds_collision, tides_wave, tides_rope, ...); the first sight of each is photographed -> .tmp/efekt-<kind>.png.
// Usage: npx tsx scripts/browser/efekty-mechanik.ts [races=herds,tides] [seconds=120] [seed=3]
import { openGame } from './game';
const races = process.argv[2] ?? 'herds,tides';
const limit = Number(process.argv[3] ?? 120) * 1000;
const seed = process.argv[4] ?? '3';
const g = await openGame(`steps=600&until=battle&mode=pvp&races=${races}&seed=${seed}&size=medium&objective=artifact${process.env.HERO ? `&hero=${process.env.HERO}` : ""}`, { scale: 1 });
const p = g.page;
await p.waitForTimeout(1500);
await p.getByRole('button', { name: /^Jestem G/ }).first().click().catch(() => undefined);
await p.getByRole('button', { name: 'Opcje' }).first().click();
await p.getByLabel(/Autoplay/).check();
await p.getByRole('button', { name: 'Zamknij' }).click();
await p.evaluate(() => {
  const w = window as unknown as { __fx: Record<string, number> };
  w.__fx = {};
  new MutationObserver((ms) => {
    for (const m of ms) for (const n of m.addedNodes) if (n instanceof HTMLElement) for (const e of [n, ...n.querySelectorAll('[data-fx]')]) { const k = (e as HTMLElement).getAttribute?.('data-fx'); if (k) { w.__fx[k] = (w.__fx[k] ?? 0) + 1; setTimeout(() => ((e as HTMLElement).style.animationPlayState = 'paused'), 280); } }
  }).observe(document.body, { childList: true, subtree: true });
});
const shot = new Set<string>();
const start = Date.now();
while (Date.now() - start < limit) {
  const kinds = await p.locator('[data-fx]').evaluateAll((els) => els.map((e) => e.getAttribute('data-fx') ?? ''));
  for (const k of kinds) if (!shot.has(k)) { shot.add(k); await p.waitForTimeout(450); console.log(k, await p.locator(`[data-fx="${k}"]`).first().evaluate((e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} pos=${c.backgroundPosition} img=${c.backgroundImage.slice(-30)}`; }).catch(() => 'gone')); await p.locator('.arena-frame').screenshot({ path: `.tmp/efekt-${k}.png` }).catch(() => undefined); console.log(`${((Date.now() - start) / 1000).toFixed(0)}s first ${k}`); }
  if (await p.locator('text=/Wygra|Koniec gry/').count()) break;
  await p.waitForTimeout(120);
}
await p.screenshot({ path: '.tmp/efekt-final.png' });
console.log('arena present:', await p.locator('.arena-frame').count());
console.log('effects seen:', await p.evaluate(() => (window as unknown as { __fx: object }).__fx));
console.log('errors:', g.errors.slice(0, 3));
await g.close();
