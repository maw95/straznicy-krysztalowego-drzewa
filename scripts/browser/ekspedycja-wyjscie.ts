// Leaving an Expedition battle: an ordinary run keeps the battle ("Wróć do bitwy" goes on from where it stood), the run of the day ends.
// Usage: npx tsx scripts/browser/ekspedycja-wyjscie.ts
import { clearDialogs, openGame } from './game';

for (const daily of [false, true]) {
  const game = await openGame('', { view: 'desktop', scale: 0.6 });
  const p = game.page;
  try {
    await p.waitForTimeout(800);
    await p.locator('[data-new-game]').click();
    await p.locator('[data-expedition-open]').click();
    await p.locator(daily ? '[data-expedition-daily]' : '[data-expedition-new]').click();
    await p.locator('[data-expedition-run]').waitFor();
    await p.locator('[data-expedition-fight]').click();
    await p.waitForTimeout(1500);
    await clearDialogs(p);
    await p.locator('[data-gear-offer]').first().click();
    await p.getByRole('button', { name: /Biorę ten artefakt/ }).click();
    await p.locator('[data-spell-offer]').nth(0).click();
    await p.locator('[data-spell-offer]').nth(1).click();
    await p.getByRole('button', { name: 'Biorę te czary' }).click();
    await p.waitForTimeout(500);
    for (let i = 0; i < 5; i++) await p.locator('.btn:has(.unit-card), .btn:has([class*="card"])').nth(i).click({ timeout: 2000 }).catch(() => undefined);
    await p.getByRole('button', { name: 'Do bitwy!' }).click({ timeout: 3000 }).catch(() => undefined);
    for (let i = 0; i < 2; i++) {
      await p.locator('button[aria-pressed][aria-label]').first().click({ timeout: 4000 });
      await p.getByRole('button', { name: 'Biorę ten skarb' }).click({ timeout: 4000 });
      await p.waitForTimeout(500);
    }
    await p.waitForTimeout(800);
    await p.getByRole('button', { name: 'Opcje' }).first().click();
    await p.locator('[data-leave]').click();
    console.log(daily ? 'daily' : 'run', 'leave note:', (await p.locator('[data-leave-nosave]').locator('xpath=ancestor::div[2]').innerText()).replace(/\n+/g, ' | ').slice(0, 160));
    await p.locator('[data-leave-nosave]').click();
    await p.waitForTimeout(500);
    await p.locator('[data-new-game]').click();
    await p.locator('[data-expedition-open]').click();
    await p.waitForTimeout(500);
    const onRunPage = (await p.locator('[data-expedition-run]').count()) > 0;
    console.log(daily ? 'daily' : 'run', 'run page after leaving:', onRunPage, '· button:', onRunPage ? await p.locator('[data-expedition-fight]').innerText() : '-', '· profile:', await p.evaluate(() => localStorage.getItem('skd-expedition-profile')));
    if (onRunPage) {
      await p.locator('[data-expedition-fight]').click();
      await p.waitForTimeout(1500);
      console.log('run: back in the battle (no picks again):', (await p.locator('[data-gear-offer]').count()) === 0 && (await p.getByRole('button', { name: 'Opcje' }).count()) > 0);
    }
    console.log('errors', game.errors);
  } catch (e) {
    console.log(daily ? 'daily' : 'run', 'FAIL', String(e).slice(0, 300));
    await p.screenshot({ path: '.tmp/ekspedycja-wyjscie-stan.png' });
  } finally {
    await game.close();
  }
}
