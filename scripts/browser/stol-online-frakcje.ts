// The online table offers all factions in a digital rivalry with a "sides" goal (Kontrola): the owner picks Stada and Klan for two of three seats and starts with bots.
// Scratch server first (see wlasny-online.ts), then: npx tsx scripts/browser/stol-online-frakcje.ts <file with the registration answer> -> .tmp/stol-online-frakcje.png
import { readFileSync } from 'node:fs';
import { openGame } from './game';

const URL = process.env.SERVER_URL ?? 'http://localhost:8090';
const { token } = JSON.parse(readFileSync(process.argv[2], 'utf8').trim().split('\n')[0]) as { token: string };
const game = await openGame('', { serverUrl: URL, token, scale: 1 });
const p = game.page;
try {
  await p.waitForTimeout(3000);
  await p.getByRole('button', { name: 'Nowa gra', exact: true }).click();
  await p.waitForTimeout(500);
  const pick = async (name: string) => { await p.locator('.opt-card-title', { hasText: new RegExp(`^${name}$`) }).click(); await p.waitForTimeout(300); };
  await pick('Potyczka');
  await pick('Wyprawa');
  for (let i = 0; i < 8 && !(await p.locator('.count-chip').count()); i++) {
    console.log('page', await p.locator('[data-wizard-page]').first().getAttribute('data-wizard-page'), await p.locator('.opt-card-title').allInnerTexts());
    if (await p.locator('[data-wizard-page="objective"]').count()) await pick('Punkty kontrolne');
    else {
      for (const name of ['Prostokąt', 'Średnia']) { const c = p.getByText(name, { exact: true }).first(); if (await c.count()) await c.click().catch(() => undefined); }
      await p.locator('[data-wizard-next]').click();
    }
    await p.waitForTimeout(300);
  }
  await p.getByRole('button', { name: '3', exact: true }).click();
  await p.locator('[data-wizard-next]').click();
  await p.waitForTimeout(2000);
  console.log('summary:', await p.locator('[data-table-summary]').innerText());
  const sel = p.getByLabel('Frakcja');
  console.log('faction options:', await sel.first().locator('option').allInnerTexts());
  await sel.nth(0).selectOption('herds');
  console.log('error after herds:', await p.locator('[role=alert], .error, .notice').allInnerTexts());
  await p.waitForTimeout(300);
  await sel.nth(1).selectOption('clans');
  await p.waitForTimeout(300);
  const who = p.getByLabel('Kto gra');
  await who.nth(1).selectOption('bot');
  await who.nth(2).selectOption('bot');
  await p.getByRole('button', { name: 'Zajmij miejsce' }).first().click();
  await p.waitForTimeout(800);
  await p.screenshot({ path: '.tmp/stol-online-frakcje.png' });
  await p.getByRole('button', { name: /Zacznij|Start|Rozpocznij/ }).first().click();
  await p.waitForTimeout(5000);
  console.log('in game, text sample:', (await p.locator('body').innerText()).slice(0, 200).replace(/\n/g, ' | '));
  if (game.errors.length) console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
