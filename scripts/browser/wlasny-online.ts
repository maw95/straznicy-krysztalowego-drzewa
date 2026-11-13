// Two browser accounts play a "Własne ustawienia" game online: the owner builds the table in the wizard, the second player sees its summary,
// both take a seat and the game starts for both. Run it against a scratch server on its own port and database, never the author's:
//   cd ../straznicy-krysztalowego-drzewa-backend && PORT=8090 DATABASE_PATH=/tmp/e2e.db ALLOWED_ORIGINS=http://localhost:5180 npx tsx src/main.ts
//   (register two accounts once: POST /auth/register {"nick","password"}; the server limits registrations) and put the two JSON answers, one per line, in a file.
//   npx tsx scripts/browser/wlasny-online.ts <file with the two registration answers>
import { readFileSync } from 'node:fs';
import { openGame } from './game';

const URL = process.env.SERVER_URL ?? 'http://localhost:8090';
const [ta, tb] = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { token: string });
const A = await openGame('', { serverUrl: URL, token: ta.token, scale: 1 });
const B = await openGame('', { serverUrl: URL, token: tb.token, scale: 1 });
const pa = A.page, pb = B.page;
await pa.waitForTimeout(3000);
// A builds the table in the new-game wizard: version, level, mode, goal and map pages (Dalej), players and difficulty, then the custom switches.
const pick = async (p: typeof pa, name: string) => {
  await p.locator('.opt-card-title', { hasText: new RegExp(`^${name}$`) }).click();
  await p.waitForTimeout(250);
};
const nextPage = async (p: typeof pa) => {
  await p.locator('[data-wizard-next]').click();
  await p.waitForTimeout(250);
};
await pa.getByRole('button', { name: 'Nowa gra', exact: true }).click();
await pa.waitForTimeout(500);
for (const name of ['Cyfrowa', 'Własne ustawienia', 'Kooperacja']) await pick(pa, name);
await nextPage(pa); // goal
await nextPage(pa); // map
await pa.getByRole('button', { name: '2', exact: true }).click();
await nextPage(pa); // players -> custom switches
for (const name of ['Włączony', 'Na planszy głównej (pojedynek 1 na 1)', 'Bez zdolności', 'Rzut kością', 'Dodatkowy bohater Hordy', 'Na zmianę']) {
  await pa.getByRole('button', { name, exact: true }).first().click();
  await pa.waitForTimeout(250);
}
await nextPage(pa); // create the table
await pa.waitForTimeout(2000);
const code = (await pa.locator('body').innerText()).match(/[A-ZĄĆĘŁŃÓŚŹŻ]+-\d{4}/)![0];
console.log('code', code);
console.log('summary:', await pa.locator('[data-table-summary]').innerText());
await pa.screenshot({ path: '.tmp/lobby.png' });
// B joins by code
await pb.waitForTimeout(2500);
await pb.getByRole('button', { name: 'Dołącz do gry', exact: true }).click();
await pb.getByLabel('Kod pokoju').fill(code);
await pb.getByRole('button', { name: 'Dołącz', exact: true }).click();
await pb.waitForTimeout(2000);
console.log('B summary:', await pb.locator('[data-table-summary]').innerText());
console.log('B has no "Zmień ustawienia":', (await pb.getByRole('button', { name: 'Zmień ustawienia' }).count()) === 0);
await pa.getByRole('button', { name: 'Zajmij miejsce' }).first().click();
await pa.waitForTimeout(500);
await pb.getByRole('button', { name: 'Zajmij miejsce' }).first().click();
await pa.waitForTimeout(800);
await pa.getByRole('button', { name: 'Rozpocznij grę' }).click();
await pa.waitForTimeout(4000);
for (const [label, p] of [['A', pa], ['B', pb]] as const) {
  const t = await p.locator('body').innerText();
  console.log(label, 'in game:', /Runda|Tura|Zakończ turę/.test(t), '|', t.replace(/\s+/g, ' ').slice(0, 160));
  await p.screenshot({ path: `.tmp/e2e_game_${label}.png` });
}
console.log('errors', A.errors, B.errors);
await A.close(); await B.close();
