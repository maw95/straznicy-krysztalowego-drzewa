// The seats of the local table (digital rivalry): two seats at first (a person and a computer), faction and hero as rows of icons, "+ Dodaj gracza", the cross that removes a seat,
// the die = a random faction or hero drawn when the game starts. -> .tmp/gracze-*.png. Usage: npx tsx scripts/browser/gracze.ts [tier text, default Przygoda]
import { openGame } from './game';

const tier = process.argv[2] ?? 'Przygoda';
const game = await openGame('', { view: (process.env.VIEW ?? 'desktop') as 'desktop', scale: 0.6 });
const p = game.page;
try {
  await p.waitForTimeout(800);
  await p.locator('[data-new-game]').click();
  await p.locator('[data-mode="pvp"]').click();
  await p.locator('[data-wizard-page="where"] .opt-card').first().click();
  console.log('tiers:', await p.locator('[data-wizard-page="tier"] .opt-card-title').allInnerTexts());
  await p.locator('[data-wizard-page="tier"] .opt-card', { hasText: tier }).click();
  for (let i = 0; i < 8 && !(await p.locator('[data-wizard-page="players"]').count()); i++) {
    // The goal page goes on by itself once a goal is picked (the first one offered: control); the other pages have "Dalej →".
    if (await p.locator('[data-wizard-page="objective"]').count()) await p.locator('[data-wizard-page="objective"] .opt-card').nth(Number(process.env.GOAL ?? 1)).click();
    else await p.getByRole('button', { name: 'Dalej →' }).click({ timeout: 3000 }).catch(() => undefined);
    await p.waitForTimeout(400);
  }
  console.log('players page: count chips', await p.locator('.count-chip').count(), 'title', await p.locator('.ribbon, [class*=ribbon]').first().innerText().catch(() => '?'));
  await p.getByRole('button', { name: 'Dalej →' }).click();
  await p.locator('.seat-row').first().waitFor();
  const seats = () => p.locator('.seat-row').count();
  const state = async () => JSON.stringify({ seats: await seats(), who: await p.locator('select[aria-label="Kto gra"]').evaluateAll((e) => e.map((x) => (x as HTMLSelectElement).value)), remove: await p.locator('[data-remove-seat]').count(), factions: await p.locator('[data-seat-factions="0"] [data-faction]').count() });
  console.log('start:', await state());
  await p.screenshot({ path: '.tmp/gracze-1.png' });
  await p.locator('[data-add-seat]').click();
  await p.locator('[data-add-seat]').click();
  console.log('after 2 adds:', await state());
  await p.locator('[data-remove-seat="2"]').click();
  console.log('after removing seat 2:', await state());
  // Seat 1: random faction; seat 0: random hero.
  if (await p.locator('[data-seat-factions="1"] [data-faction="random"]').count()) await p.locator('[data-seat-factions="1"] [data-faction="random"]').click();
  await p.locator('[data-seat-heroes="0"] [data-hero="random"]').click();
  await p.screenshot({ path: '.tmp/gracze-2.png' });
  console.log('random lit:', await p.locator('[data-hero="random"][aria-pressed="true"]').count(), await p.locator('[data-faction="random"][aria-pressed="true"]').count());
  await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
  await p.waitForTimeout(1500);
  console.log('left the setup:', (await p.locator('.seat-row').count()) === 0, 'errors', game.errors);
} catch (e) {
  console.log('FAIL', String(e).slice(0, 500));
  await p.screenshot({ path: '.tmp/gracze-fail.png' });
} finally {
  await game.close();
}
