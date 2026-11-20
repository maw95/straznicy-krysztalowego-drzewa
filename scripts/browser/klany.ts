// Click check of a rivalry table with the Iron Clans: the setup screen offers the faction, a seat takes it, the developer panel builds everything, the Runiczna Kuźnia
// in the settlement window forges a rune by a click, then bots play a few seconds -> .tmp/klany*.png.
// Usage: npx tsx scripts/browser/klany.ts [widok]   (desktop by default, `telefon` for the phone layout)
import { openGame, type View } from './game';
const view = (process.argv[2] ?? 'desktop') as View;
const g = await openGame('dev=1', { view, scale: 1 });
const p = g.page;
const card = (t: string) => p.locator('.opt-card', { hasText: t }).first();
try {
  await card('Nowa gra').click();
  await card('Rywalizacja').click();
  await card('Ten komputer').click();
  await p.locator('[data-wizard-page="tier"]').waitFor();
  const nextIfAny = async () => { await p.waitForTimeout(500); const n = p.locator('[data-wizard-next]'); if (await n.count()) await n.click().catch(() => {}); await p.waitForTimeout(300); };
  await card('Imperium').click(); await nextIfAny();
  await card('Punkty kontrolne').click();
  await p.locator('[data-wizard-page="map"]').waitFor();
  await p.locator('[data-shape="rectangle"]').click(); await p.waitForTimeout(500);
  for (let i = 0; i < 4 && !(await p.locator('[data-wizard-page="players"]').count()); i++) await nextIfAny();
  await p.locator('[data-wizard-next]').click();
  const sel = p.locator('select[aria-label="Frakcja"]');
  await sel.first().waitFor({ timeout: 5000 });
  console.log('faction options', await sel.first().locator('option').allInnerTexts());
  await sel.nth(0).selectOption('clans');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `.tmp/klany-setup-${view}.png` });
  await p.locator('select[aria-label="Kto gra"]').nth(1).selectOption('bot');
  await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
  // The human Clans stand at home: the panel builds everything, the settlement window opens, the Runiczna Kuźnia forges a rune.
  await p.locator('[data-dev-panel]').waitFor({ timeout: 20000 });
  await p.locator('[data-dev-scene="settlement"]').click();
  await p.locator('[data-enter-settlement]').click();
  await p.locator('[data-building="runeForge"]').click();
  await p.locator('[data-panel="runeForge"]').waitFor();
  console.log('rune units', await p.locator('[data-rune-unit]').count());
  await p.screenshot({ path: `.tmp/klany-kuznia-${view}.png` });
  await p.locator('[data-rune-forge="brassSpider:attack"]').click();
  await p.waitForTimeout(400);
  console.log('after click:', await p.locator('[data-rune-unit="brassSpider"]').innerText(), '| done note:', await p.locator('[data-rune-done]').count());
  await p.screenshot({ path: `.tmp/klany-kuznia2-${view}.png` });
  console.log('second rune the same round enabled?', await p.locator('[data-rune-forge="shieldDwarf:life"]').isEnabled());
  await p.keyboard.press('Escape');
  console.log('errors', g.errors.join('|') || 'none');
} catch (e) { console.log('FAIL', String(e).slice(0, 600)); await p.screenshot({ path: `.tmp/klany-fail-${view}.png` }); }
await g.close();
