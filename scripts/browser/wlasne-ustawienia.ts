// Checks "Własne ustawienia": a layer of "Poziomy i mechaniki" can be picked (it used to snap back to "Bez rozwoju"), and the step line does not mention the digital version.
import { openGame } from './game';

const g = await openGame('', { scale: 1 });
const p = g.page;
const card = async (t: string) => { await p.locator('.opt-card-title', { hasText: new RegExp(`^${t}$`) }).first().click({ timeout: 8000 }); await p.waitForTimeout(350); };
await card('Nowa gra');
await card('Kooperacja');
await card('Ten komputer');
await card('Własne ustawienia');
await p.waitForTimeout(500);
console.log('page:', (await p.locator('body').innerText()).slice(0, 400).replace(/\n/g, ' / '));
const pressed = async () => p.locator('button[aria-pressed="true"]').allTextContents();
console.log('start:', (await pressed()).join(' | '));
for (const name of ['Osady i złoto', '+ surowce i oblężenia', 'Bez osad']) {
  const btn = p.locator('button[aria-pressed]', { hasText: name }).first();
  await btn.click();
  await p.waitForTimeout(300);
  console.log(`after ${name}:`, await btn.getAttribute('aria-pressed'), '| pressed:', (await pressed()).join(' | '));
}
await p.locator('button[aria-pressed]', { hasText: 'Bez rozwoju' }).first().click();
await p.waitForTimeout(300);
console.log('after Bez rozwoju:', (await pressed()).join(' | '));
const step = await p.locator('text=/^Krok \\d+ z \\d+/').first().textContent();
console.log('step line:', step);
console.log('errors:', g.errors.filter((e) => !/ERR_NETWORK/.test(e)));
await g.close();
