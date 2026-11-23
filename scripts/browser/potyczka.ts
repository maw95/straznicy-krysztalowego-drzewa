// The skirmish path of the digital game: Nowa gra → Potyczka → one player → the table has the player and the Horde's bot → the game starts. -> .tmp/potyczka-*.png
// Usage: npx tsx scripts/browser/potyczka.ts
import { openGame } from './game';

const game = await openGame('', { view: 'desktop', scale: 0.6 });
const p = game.page;
try {
  await p.waitForTimeout(800);
  await p.locator('[data-new-game]').click();
  await p.locator('[data-wizard-page="mode"]').waitFor();
  console.log('modes:', await p.locator('[data-wizard-page="mode"] .opt-card-title').allInnerTexts());
  await p.locator('[data-mode="pvp"]').click();
  await p.locator('[data-wizard-page="where"] .opt-card').first().click();
  await p.locator('[data-wizard-page="tier"] .opt-card', { hasText: 'Przygoda' }).click();
  await p.locator('[data-wizard-page="map"]').waitFor();
  await p.getByRole('button', { name: 'Dalej →' }).click();
  await p.locator('[data-wizard-page="players"]').waitFor();
  console.log('count chips:', await p.locator('.count-chip').allInnerTexts(), 'lit:', await p.locator('.count-chip[aria-pressed="true"]').allInnerTexts());
  await p.screenshot({ path: '.tmp/potyczka-1.png' });
  await p.getByRole('button', { name: 'Dalej →' }).click();
  await p.locator('.well select[aria-label="Kto gra"]').first().waitFor();
  console.log('who plays:', await p.locator('select[aria-label="Kto gra"]').evaluateAll((els) => els.map((e) => (e as HTMLSelectElement).value)), 'factions:', await p.locator('[data-seat-factions]').evaluateAll((els) => els.map((e) => (e as HTMLSelectElement).value)));
  console.log('child box:', await p.getByLabel('Dziecko').count());
  await p.screenshot({ path: '.tmp/potyczka-2.png' });
  await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
  await p.waitForTimeout(1500);
  console.log('in game:', await p.locator('.adventure, [data-adventure], canvas').count(), 'menu still shown:', await p.locator('[data-new-game], select[aria-label="Kto gra"]').count());
  console.log('errors', game.errors);
} catch (e) {
  console.log('FAIL', String(e).slice(0, 400));
  await p.screenshot({ path: '.tmp/potyczka-fail.png' });
} finally {
  await game.close();
}
