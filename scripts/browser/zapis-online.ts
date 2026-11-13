// One browser account plays online, saves the game in the options, leaves, loads the save from "Wczytaj grę" and continues it. Run against a scratch
// server on its own port and database (see wlasny-online.ts): npx tsx scripts/browser/zapis-online.ts <file with one registration answer per line>
import { readFileSync } from 'node:fs';
import { openGame } from './game';

const URL = process.env.SERVER_URL ?? 'http://localhost:8090';
const [ta] = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { token: string });
const A = await openGame('', { serverUrl: URL, token: ta.token, scale: 1 });
const p = A.page;
const pick = async (name: string) => { await p.locator('.opt-card-title', { hasText: new RegExp(`^${name}$`) }).click(); await p.waitForTimeout(250); };
await p.waitForTimeout(3000);
await p.getByRole('button', { name: 'Nowa gra', exact: true }).click();
for (const n of ['Cyfrowa', 'Przygoda', 'Kooperacja']) await pick(n);
await p.locator('[data-wizard-next]').click();
await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Zajmij miejsce' }).first().click();
await p.waitForTimeout(500);
await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
await p.waitForTimeout(3000);
// a few moves
await p.keyboard.press(' ');
await p.waitForTimeout(400);
await p.keyboard.press('Enter');
await p.waitForTimeout(1500);
const before = (await p.locator('body').innerText()).match(/Runda \d+ z \d+/)?.[0];
await p.screenshot({ path: '.tmp/zo1.png' });
await p.keyboard.press('o');
await p.waitForTimeout(400);
await p.locator('input[aria-label="Nazwa zapisu"]').fill('Test online');
await p.locator('[data-save-game]').click();
await p.waitForTimeout(800);
await p.locator('[data-leave]').click();
await p.waitForTimeout(400);
await p.locator('[data-leave-nosave]').click();
await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Wczytaj grę', exact: true }).click();
await p.waitForTimeout(1200);
console.log('list:', (await p.locator('[data-wizard-page="load-online"]').innerText()).replace(/\s+/g, ' '));
await p.screenshot({ path: '.tmp/saves-online.png' });
await p.getByRole('button', { name: 'Wczytaj', exact: true }).first().click();
await p.waitForTimeout(1200);
console.log('locked note:', await p.locator('[data-resumed]').count());
await p.getByRole('button', { name: 'Zajmij miejsce' }).first().click();
await p.waitForTimeout(500);
await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
await p.waitForTimeout(3000);
const after = (await p.locator('body').innerText()).match(/Runda \d+ z \d+/)?.[0];
console.log('round before/after:', before, '/', after, 'errors', A.errors);
await A.close();
