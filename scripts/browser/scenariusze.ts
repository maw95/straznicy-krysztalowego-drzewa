// Ready scenarios (backlog 98): Nowa gra → Potyczka → Gotowy scenariusz → the list (a size filter, the table, the picked one on the right)
// → the seats → the game starts on the scenario's map with its goal. -> .tmp/scenariusze-*.png
// Usage: npx tsx scripts/browser/scenariusze.ts [desktop|telefon]
import { openGame } from './game';

const view = (process.argv[2] ?? 'desktop') as 'desktop' | 'telefon';
const game = await openGame('', { view, scale: view === 'desktop' ? 0.7 : 1 });
const p = game.page;
try {
  await p.waitForTimeout(800);
  await p.locator('[data-new-game]').click();
  await p.locator('[data-mode="pvp"]').click();
  await p.locator('[data-wizard-page="where"] .opt-card').first().click();
  await p.locator('[data-wizard-page="tier"] .opt-card', { hasText: 'Gotowy scenariusz' }).click();
  await p.locator('[data-wizard-page="scenario"]').waitFor();
  console.log('rows:', await p.locator('[data-scenario]').count());
  await p.locator('[data-scenario="wyspy-mgiel"]').click();
  console.log('card:', (await p.locator('.scenario-card').innerText()).slice(0, 160).replace(/\n/g, ' | '));
  await p.screenshot({ path: `.tmp/scenariusze-${view}.png`, fullPage: view === 'telefon' });
  await p.getByRole('button', { name: 'Dalej →' }).click();
  await p.locator('select[aria-label="Kto gra"]').first().waitFor();
  await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
  await p.waitForTimeout(1500);
  const save = await p.evaluate(() => JSON.parse(localStorage.getItem('skd-autosave') ?? 'null'));
  console.log('game:', save?.setup?.mapShape, save?.setup?.customMapId, save?.setup?.mapSize, save?.setup?.rules?.objective, 'kingdom', save?.setup?.rules?.kingdom, 'seatLevels', save?.setup?.seatLevels);
  console.log('errors', game.errors);
} catch (e) {
  console.log('FAIL', String(e).slice(0, 300));
  await p.screenshot({ path: `.tmp/scenariusze-${view}-fail.png` });
} finally {
  await game.close();
}
