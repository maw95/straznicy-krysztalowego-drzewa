// Click check of a rivalry table with the Free Companies: the setup screen offers the faction, a seat takes it, the developer panel builds everything, the buildings of the
// Companies (Warsztat Sideł, Paserka, Szlaki Przemytnicze) stand in the settlement window; then a fight with neutrals shows the trap button of the deployment, the traps laid on
// the arena (visible to their owner) and the marks of a Companies unit; last, a game of bots is watched until a battle with a Companies bot on the arena, where the human must
// see none of its traps -> .tmp/kompanie*.png.
// Usage: npx tsx scripts/browser/kompanie.ts [widok]   (desktop by default, `telefon` for the phone layout)
import { openGame, type View } from './game';
const view = (process.argv[2] ?? 'desktop') as View;

/** Walks the wizard to the players page of a rivalry on the level that has the settlements (Imperium) and picks the Companies for the seat `seat`. */
async function startTable(dev: boolean, seat: number, humans: number[]) {
  const g = await openGame(dev ? 'dev=1' : '', { view, scale: 1 });
  const p = g.page;
  await p.waitForTimeout(800);
  await p.locator('[data-new-game]').click();
  await p.locator('[data-wizard-page="mode"]').waitFor();
  await p.locator('[data-mode="pvp"]').click();
  await p.locator('[data-wizard-page="where"] .opt-card').first().click();
  await p.locator('[data-wizard-page="tier"] .opt-card', { hasText: 'Imperium' }).click();
  // The pages after the level differ by level (map, goal, players): go on until the table of seats.
  for (let i = 0; i < 6 && !(await p.locator('.well select[aria-label="Kto gra"]').count()); i++) {
    await p.locator('[data-shape="rectangle"]').click().catch(() => {});
    await p.getByRole('button', { name: 'Dalej →' }).click({ timeout: 3000 }).catch(() => {});
    await p.waitForTimeout(400);
  }
  const sel = p.locator('select[aria-label="Frakcja"]');
  await sel.first().waitFor({ timeout: 5000 });
  console.log('faction options', await sel.first().locator('option').allInnerTexts());
  await sel.nth(seat).selectOption('free');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `.tmp/kompanie-setup-${view}.png` });
  for (const i of [0, 1]) await p.locator('select[aria-label="Kto gra"]').nth(i).selectOption(humans.includes(i) ? 'human' : 'bot').catch(() => {});
  await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
  return g;
}

// Part 1: the settlement window.
const g1 = await startTable(true, 0, [0]);
const p1 = g1.page;
try {
  await p1.locator('[data-dev-panel]').waitFor({ timeout: 20000 });
  await p1.locator('[data-dev-scene="settlement"]').click();
  await p1.locator('[data-enter-settlement]').click();
  for (const id of ['trapWorkshop', 'fence', 'smugglerTrails']) console.log(id, 'in the town:', await p1.locator(`[data-building="${id}"]`).getAttribute('aria-label'));
  await p1.locator('[data-building="trapWorkshop"]').click();
  await p1.waitForTimeout(400);
  console.log('workshop text found:', (await p1.locator('body').innerText()).includes('Sidła'));
  await p1.screenshot({ path: `.tmp/kompanie-warsztat-${view}.png` });
  console.log('errors (settlement)', g1.errors.join('|') || 'none');
} catch (e) { console.log('FAIL (settlement)', String(e).slice(0, 600)); await p1.screenshot({ path: `.tmp/kompanie-fail-${view}.png` }); }
await g1.close();

// Part 2: a fight with neutrals with the human Companies: the trap button, laying traps, the traps on the arena.
const g2 = await startTable(true, 0, [0]);
const p2 = g2.page;
try {
  await p2.locator('[data-dev-panel]').waitFor({ timeout: 20000 });
  await p2.getByRole('button', { name: /wybuduj wszystko/i }).first().click().catch(() => console.log('no build-everything button'));
  await p2.locator('[data-dev-fight="0"]').click();
  await p2.locator('[data-enter]').waitFor({ timeout: 10000 });
  const cards = p2.locator('.overlay .btn:has(img), .overlay button.btn').filter({ hasNot: p2.locator('[data-enter]') });
  for (let i = 0; i < 2; i++) await cards.nth(i).click().catch(() => {});
  await p2.locator('[data-enter]').click();
  await p2.locator('[data-trap-mode]').waitFor({ timeout: 10000 });
  console.log('trap button:', (await p2.locator('[data-trap-mode]').innerText()).replace(/\s+/g, ' '));
  await p2.locator('[data-trap-mode]').click();
  const zone = p2.locator('polygon[data-cell]').filter({ has: p2.locator('xpath=self::*[starts-with(@fill, "rgba(200,100,40")]') });
  const n = await zone.count();
  console.log('cells of the trap zone lit:', n);
  for (let i = 0; i < 2 && n > 4; i++) await zone.nth(i * 3).click({ force: true });
  await p2.screenshot({ path: `.tmp/kompanie-sidla-ustawianie-${view}.png` });
  console.log('trap button after:', (await p2.locator('[data-trap-mode]').innerText()).replace(/\s+/g, ' '), '| traps drawn while laying:', await p2.locator('[data-trap]').count());
  await p2.getByRole('button', { name: /Gotowe/ }).click();
  await p2.waitForTimeout(1500);
  console.log('own traps on the arena in the fight:', await p2.locator('[data-trap]').count());
  await p2.screenshot({ path: `.tmp/kompanie-bitwa-${view}.png` });
  console.log('errors (deploy)', g2.errors.join('|') || 'none');
} catch (e) { console.log('FAIL (deploy)', String(e).slice(0, 800)); await p2.screenshot({ path: `.tmp/kompanie-fail2-${view}.png` }); }
await g2.close();

// Part 3: bots play until a battle with a Companies unit is on the screen; the (human-less) screen shows none of the traps.
const g3 = await startTable(false, 1, []);
const p3 = g3.page;
try {
  let found = false;
  for (let i = 0; i < 60 && !found; i++) {
    await p3.waitForTimeout(2000);
    found = (await p3.locator('.arena-frame').count()) > 0 && (await p3.getByText(/Ruda Atamanka|Borsuk Saper|Kruk Wieszczek|Wydra Zwiadowczyni|Kuna Złodziejka|Wiewiórka Łuczniczka/).count()) > 0;
  }
  console.log('battle with the Companies seen:', found, '| traps drawn on the screen of an onlooker:', await p3.locator('[data-trap]').count());
  await p3.screenshot({ path: `.tmp/kompanie-boty-${view}.png` });
  console.log('errors (bots)', g3.errors.join('|') || 'none');
} catch (e) { console.log('FAIL (bots)', String(e).slice(0, 600)); await p3.screenshot({ path: `.tmp/kompanie-fail3-${view}.png` }); }
await g3.close();
