// The mode chosen in the menu carries over to the table online: Nowa gra -> mode -> "Przez internet" -> the online menu's "Nowa gra" opens the wizard at its
// first real page (no mode page again), and a table is created. Also: without a preset mode (Wczytaj grę -> internet -> Nowa gra) the wizard asks for the mode.
// Run against a scratch server (see wlasny-online.ts): npx tsx scripts/browser/menu-online.ts <file with one registration answer>
import { readFileSync } from 'node:fs';
import { openGame } from './game';

const URL = process.env.SERVER_URL ?? 'http://localhost:8090';
const [ta] = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { token: string });
const A = await openGame('', { serverUrl: URL, token: ta.token, scale: 1 });
const p = A.page;
const page = async () => (await p.locator('[data-wizard-page]').first().getAttribute('data-wizard-page')) ?? '-';
try {
  await p.waitForTimeout(2500);
  // 1. The online menu opened directly (no mode chosen before): its "Nowa gra" starts the wizard with the mode page.
  await p.getByRole('button', { name: 'Nowa gra', exact: true }).click();
  await p.waitForTimeout(500);
  console.log('no mode chosen before -> first wizard page:', await page());
  await p.locator('.opt-card-title', { hasText: /^Rywalizacja$/ }).click();
  console.log('after the mode:', await page());
  await p.getByRole('button', { name: '← Wstecz' }).click();
  await p.getByRole('button', { name: '← Wstecz' }).click();
  // 2. Back to the local menu: the mode chosen there carries over to the table online.
  await p.getByRole('button', { name: '← Wstecz' }).click().catch(() => undefined);
  await p.waitForTimeout(500);
  await p.locator('[data-new-game]').click();
  await p.locator('[data-mode="pvp"]').click();
  await p.locator('[data-wizard-page="where"] .opt-card').nth(1).click();
  await p.waitForTimeout(1500);
  await p.getByRole('button', { name: 'Nowa gra', exact: true }).click();
  await p.waitForTimeout(500);
  console.log('mode chosen before -> first wizard page:', await page());
  await p.screenshot({ path: '.tmp/menu-online-1.png' });
  await p.locator('.opt-card-title', { hasText: /^Przygoda$/ }).click();
  await p.locator('[data-wizard-next]').click(); // map (size)
  console.log('last button:', await p.locator('[data-wizard-next]').innerText());
  await p.locator('[data-wizard-next]').click(); // players: creates the table
  await p.waitForTimeout(1500);
  const text = await p.locator('body').innerText();
  console.log('table created (room code visible):', text.includes('Kod pokoju'), '· rivalry shown:', /Rywalizacja/.test(text));
  await p.screenshot({ path: '.tmp/menu-online-2.png' });
  console.log('errors', A.errors);
} catch (e) {
  console.log('FAIL', String(e).slice(0, 400));
  await p.screenshot({ path: '.tmp/menu-online-stan.png' });
} finally {
  await A.close();
}
