// A Potyczka online with a bot at the level the owner picks (backlog 94): the table summary has no shared difficulty, the bot seat has its level, the
// game starts. Scratch server first (see wlasny-online.ts), then: npx tsx scripts/browser/stol-online-boty.ts <file with the registration answer>
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
  await pick('Przygoda');
  await p.locator('[data-wizard-next]').click();
  await p.waitForTimeout(300);
  console.log('players page:', await p.locator('[data-wizard-page="players"]').innerText());
  await p.locator('[data-wizard-next]').click();
  await p.waitForTimeout(2000);
  console.log('summary:', await p.locator('[data-table-summary]').innerText());
  await p.getByLabel('Kto gra').nth(1).selectOption('bot');
  await p.waitForTimeout(500);
  await p.getByLabel('Poziom bota').selectOption('kids');
  await p.waitForTimeout(500);
  console.log('bot level after the server echo:', await p.getByLabel('Poziom bota').inputValue());
  await p.getByRole('button', { name: 'Zajmij miejsce' }).first().click();
  await p.waitForTimeout(800);
  await p.screenshot({ path: '.tmp/stol-online-boty.png' });
  await p.getByRole('button', { name: /Zacznij|Start|Rozpocznij/ }).first().click();
  await p.waitForTimeout(5000);
  console.log('in game, text sample:', (await p.locator('body').innerText()).slice(0, 160).replace(/\n/g, ' | '));
  if (game.errors.length) console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
