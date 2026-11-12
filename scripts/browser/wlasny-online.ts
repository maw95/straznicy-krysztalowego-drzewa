// Two browser accounts play a "Własne ustawienia" game online: the owner switches rules in the room, the second player sees them (locked),
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
await pa.getByRole('button', { name: 'Nowy pokój' }).first().click();
await pa.waitForTimeout(1500);
const code = (await pa.locator('body').innerText()).match(/[A-ZĄĆĘŁŃÓŚŹŻ]+-\d{4}/)![0];
console.log('code', code);
await pa.getByRole('button', { name: 'Własne ustawienia' }).click();
for (const name of ['2', 'Włączony', 'Na planszy głównej (pojedynek 1 na 1)', 'Bez zdolności', 'Rzut kością', 'Dodatkowy bohater Hordy', 'Na zmianę']) {
  await pa.getByRole('button', { name, exact: true }).first().click();
  await pa.waitForTimeout(250);
}
const pressed = async (p: typeof pa) => (await p.locator('button[aria-pressed="true"]').allInnerTexts()).join(' | ');
console.log('A pressed:', await pressed(pa));
// B joins by code
await pb.waitForTimeout(2500);
await pb.getByLabel('Kod pokoju').fill(code);
await pb.getByRole('button', { name: 'Dołącz', exact: true }).click();
await pb.waitForTimeout(2000);
console.log('B pressed:', await pressed(pb));
console.log('B can click rules (should be disabled):', await pb.getByRole('button', { name: 'Rzut kością', exact: true }).isDisabled());
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
