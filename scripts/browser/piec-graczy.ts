// Five seats at the table must not crash the setup screen; five different fixed factions block the start (max 4 sides). Usage: npx tsx scripts/browser/piec-graczy.ts
import { openGame } from './game';

const game = await openGame('', { scale: 0.5 });
const p = game.page;
try {
  await p.waitForTimeout(800);
  await p.locator('[data-new-game]').click();
  await p.locator('[data-mode="pvp"]').click();
  await p.locator('[data-wizard-page="where"] .opt-card').first().click();
  await p.locator('[data-wizard-page="tier"] .opt-card', { hasText: 'Wyprawa' }).click();
  for (let i = 0; i < 8 && !(await p.locator('[data-wizard-page="players"]').count()); i++) {
    if (await p.locator('[data-wizard-page="objective"]').count()) await p.locator('[data-wizard-page="objective"] .opt-card').nth(1).click();
    else await p.getByRole('button', { name: 'Dalej →' }).click({ timeout: 3000 }).catch(() => undefined);
    await p.waitForTimeout(400);
  }
  await p.getByRole('button', { name: 'Dalej →' }).click();
  await p.locator('.seat-row').first().waitFor();
  for (let i = 0; i < 3; i++) await p.locator('[data-add-seat]').click();
  console.log('factions offered:', await p.locator('[data-seat-factions="0"] [data-faction]').evaluateAll((b) => b.map((x) => x.getAttribute('data-faction')).join(',')));
  console.log('seats:', await p.locator('.seat-row').count(), 'start enabled:', await p.getByRole('button', { name: 'Rozpocznij grę' }).isEnabled());
  const f = ['dawn', 'horde', 'herds', 'tides', 'clans'];
  for (let i = 0; i < 5; i++) {
    if (i === 4) await p.locator('[data-add-seat]').click();
    await p.locator(`[data-seat-factions="${i}"] [data-faction="${f[i]}"]`).click();
  }
  console.log('5 factions: seats', await p.locator('.seat-row').count(), 'warning:', await p.locator('[data-too-many]').count(), 'start enabled:', await p.getByRole('button', { name: 'Rozpocznij grę' }).isEnabled());
  await p.locator('[data-seat-factions="4"] [data-faction="random"]').click();
  console.log('5th random: warning:', await p.locator('[data-too-many]').count(), 'start enabled:', await p.getByRole('button', { name: 'Rozpocznij grę' }).isEnabled());
  await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
  await p.waitForTimeout(2500);
  console.log('game started:', await p.locator('.screen.play, [data-gold-box]').count() > 0);
  console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
