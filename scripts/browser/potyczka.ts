// The skirmish path of the digital game: Nowa gra → Potyczka → Przygoda → map → the table (no shared difficulty: a level at each bot, and two role
// columns for the crystals goal) → the game starts with the levels at the bots (backlog 94). -> .tmp/potyczka-*.png
// Usage: npx tsx scripts/browser/potyczka.ts [desktop|telefon]
import { openGame } from './game';

const view = (process.argv[2] ?? 'desktop') as 'desktop' | 'telefon';
const game = await openGame('', { view, scale: 0.6 });
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
  // No players page: the difficulty is chosen at the bots.
  await p.locator('.well select[aria-label="Kto gra"]').first().waitFor();
  console.log('players page shown:', await p.locator('[data-wizard-page="players"]').count());
  console.log('role columns:', await p.locator('[data-role-col] .role-col-head').allInnerTexts(), 'faction pickers:', await p.locator('[data-seat-factions]').count());
  console.log('bot levels:', await p.locator('select[aria-label="Poziom bota"]').evaluateAll((els) => els.map((e) => (e as HTMLSelectElement).value)));
  await p.locator('select[aria-label="Poziom bota"]').first().selectOption('kids');
  await p.locator('[data-add-seat="horde"]').click();
  await p.locator('select[aria-label="Poziom bota"]').nth(1).selectOption('veryHard');
  await p.locator('[data-add-seat="dawn"]').click();
  console.log('columns:', await p.locator('[data-role-col]').evaluateAll((cols) => cols.map((c) => `${c.getAttribute('data-role-col')}: ${c.querySelectorAll('.seat-row').length}`)));
  await p.screenshot({ path: `.tmp/potyczka-${view}-stol.png` });
  await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
  await p.waitForTimeout(1500);
  const save = await p.evaluate(() => JSON.parse(localStorage.getItem('skd-autosave') ?? 'null'));
  console.log('seatLevels:', save?.setup?.seatLevels, 'seats:', save?.setup?.seats?.map((s: { faction: string; controller: string; botLevel?: string }) => `${s.faction}/${s.controller}/${s.botLevel ?? '-'}`));
  console.log('menu still shown:', await p.locator('[data-new-game], select[aria-label="Kto gra"]').count());
  console.log('errors', game.errors);
} catch (e) {
  console.log('FAIL', String(e).slice(0, 400));
  await p.screenshot({ path: `.tmp/potyczka-${view}-fail.png` });
} finally {
  await game.close();
}
