// Map sizes a goal is not offered on (BLOCKED_SIZES): Kryształy greys out XXL and 3XL, Przetrwanie the small map, each with a note under it. -> .tmp/rozmiary-*.png
// Usage: npx tsx scripts/browser/rozmiary.ts
import { openGame } from './game';

const game = await openGame('', { view: 'desktop', scale: 0.7 });
const p = game.page;
const state = async () => p.locator('[data-size]').evaluateAll((els) => els.map((e) => `${e.getAttribute('data-size')}${(e as HTMLButtonElement).disabled ? ' (zablokowany)' : ''}${e.getAttribute('aria-pressed') === 'true' ? ' *' : ''}`).join(', '));
try {
  await p.waitForTimeout(800);
  await p.locator('[data-new-game]').click();
  await p.locator('[data-mode="pvp"]').click();
  await p.locator('[data-wizard-page="where"] .opt-card').first().click();
  await p.locator('[data-wizard-page="tier"] .opt-card', { hasText: 'Wyprawa' }).click();
  await p.locator('[data-wizard-page="objective"] .opt-card', { hasText: 'Kryształy do Drzewa' }).click();
  console.log('Kryształy:', await state(), '| notes:', await p.getByText('Rozmiar niedostępny dla tego celu').count());
  await p.screenshot({ path: '.tmp/rozmiary-krysztaly.png' });
  await p.getByRole('button', { name: '← Wstecz' }).click();
  await p.locator('[data-size]').first().waitFor({ state: 'detached' }).catch(() => undefined);
  await p.locator('[data-wizard-page="objective"] .opt-card', { hasText: 'Przetrwanie' }).click();
  console.log('Przetrwanie:', await state());
  await p.screenshot({ path: '.tmp/rozmiary-przetrwanie.png' });
  console.log('errors', game.errors);
} finally {
  await game.close();
}
