// Click check of a rivalry table with the Kingdom of the Dead: the setup screen offers the faction, a seat takes it, bots play a few seconds -> .tmp/umarli*.png.
// Usage: npx tsx scripts/browser/umarli.ts [widok]   (desktop by default, `telefon` for the phone layout)
import { openGame, type View } from './game';
const view = (process.argv[2] ?? 'desktop') as View;
const g = await openGame('', { view, scale: 1 });
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
  for (let i = 0; i < 4 && !(await p.locator('[data-wizard-page="players"]').count()); i++) await nextIfAny();
  await p.locator('[data-wizard-next]').click();
  const sel = p.locator('[data-seat-factions]');
  await sel.first().waitFor({ timeout: 5000 });
  console.log('faction options', await sel.first().locator('[data-faction]').evaluateAll((b) => b.map((x) => x.getAttribute('aria-label')?.replace('Frakcja: ', '') ?? '')));
  await sel.nth(1).locator('[data-faction="undead"]').click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: `.tmp/umarli-setup-${view}.png` });
  for (const i of [0, 1]) await p.locator('select[aria-label="Kto gra"]').nth(i).selectOption('bot');
  await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
  // Wait (up to 2 minutes) for a battle in which a unit of the Kingdom fights, and look at it.
  let found = false;
  for (let i = 0; i < 60 && !found; i++) {
    await p.waitForTimeout(2000);
    found = (await p.locator('.arena-frame').count()) > 0 && (await p.getByText(/Szkielet Halabardnik|Błędny Ognik|Zjawa Pokutnika|Król Kurhanu|Latarniczka Mgieł|Bezgłowy Jeździec/).count()) > 0;
  }
  console.log('battle with the Kingdom seen:', found);
  await p.screenshot({ path: `.tmp/umarli-game-${view}.png` });
  console.log('errors', g.errors.join('|') || 'none');
} catch (e) { console.log('FAIL', String(e).slice(0, 500)); await p.screenshot({ path: `.tmp/umarli-fail-${view}.png` }); }
await g.close();
