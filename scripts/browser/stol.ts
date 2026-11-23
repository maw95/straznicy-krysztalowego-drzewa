// Seats of the table: the die first and selected by default, the sapphire tint of a drawn faction, the window under the right button on a crest (62-pack, 23.11). -> .tmp/stol-*.png
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
  await p.screenshot({ path: '.tmp/stol-1.png' });
  console.log('random selected:', await p.locator('[data-seat-factions="0"] [data-faction="random"][aria-pressed="true"]').count(), 'first button is the die:', await p.locator('[data-seat-factions="0"] button').first().getAttribute('data-faction'));
  const crest = p.locator('[data-seat-factions="0"] [data-faction="herds"]');
  const b = await crest.boundingBox();
  if (b) { await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down({ button: 'right' }); await p.waitForTimeout(300); await p.screenshot({ path: '.tmp/stol-2.png' }); await p.mouse.up({ button: 'right' }); }
  if (game.errors.length) console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
