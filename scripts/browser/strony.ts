// Click check of the table of a digital rivalry with the control points goal: one faction per seat (a side is a faction), the game starts -> .tmp/sides*.png.
// Usage: npx tsx scripts/browser/strony.ts
import { openGame } from './game';
const g = await openGame('', { view: 'desktop', scale: 1 });
const p = g.page;
const card = (t: string) => p.locator('.opt-card', { hasText: t }).first();
try {
  await card('Nowa gra').click();
  await card('Rywalizacja').click();
  await card('Ten komputer').click();
  await p.locator('[data-wizard-page="tier"]').waitFor();
  const nextIfAny = async () => { await p.waitForTimeout(500); const n = p.locator('[data-wizard-next]'); if (await n.count()) await n.click().catch(() => {}); await p.waitForTimeout(300); };
  await card('Wyprawa').click(); await nextIfAny();
  await card('Punkty kontrolne').click();
  await p.locator('[data-wizard-page="map"]').waitFor();
  await p.locator('[data-shape="rectangle"]').click(); await p.waitForTimeout(500);
  console.log('map page buttons:', (await p.getByRole('button').allInnerTexts()).filter(Boolean).slice(0, 25).join(' | '));
  await p.screenshot({ path: '.tmp/sides-map.png' });
  for (let i = 0; i < 4 && !(await p.locator('[data-wizard-page="players"]').count()); i++) { console.log('page', await p.locator('[data-wizard-page]').first().getAttribute('data-wizard-page')); await nextIfAny(); }
  console.log('page players?', await p.locator('[data-wizard-page="players"]').count());
  await p.locator('[data-wizard-next]').click();
  await p.locator('[data-seat-factions]').first().waitFor({ timeout: 5000 });
  await p.screenshot({ path: '.tmp/sides1.png' });
  console.log('faction options', await p.locator('[data-seat-factions]').first().locator('[data-faction]').evaluateAll((b) => b.map((x) => x.getAttribute('aria-label')?.replace('Frakcja: ', '') ?? '')));
  await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
  await p.waitForTimeout(4000);
  await p.screenshot({ path: '.tmp/sides3.png' });
  console.log('errors', g.errors.join('|'));
} catch (e) { console.log('FAIL', String(e).slice(0, 400)); await p.screenshot({ path: '.tmp/sides-fail.png' }); }
await g.close();
