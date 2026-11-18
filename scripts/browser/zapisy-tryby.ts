// Saves of the campaign and the Expedition: a scenario can be saved by hand and loaded again (with a label in the list), an Expedition run in progress shows up
// in "Wczytaj grę" ("Wznów"), and an Expedition battle offers no manual save. Usage: npx tsx scripts/browser/zapisy-tryby.ts
import { clearDialogs, openGame } from './game';

const game = await openGame('', { view: 'desktop', scale: 0.6 });
const p = game.page;
const toLoadList = async () => {
  await p.getByText('Wczytaj grę', { exact: true }).first().click();
  await p.locator('[data-wizard-page="where"] .opt-card').first().click();
  await p.locator('[data-wizard-page="load"]').waitFor();
};
try {
  await p.waitForTimeout(800);
  // Campaign: first scenario, save by hand from the options.
  await p.locator('[data-campaign-open]').click();
  await p.locator('[data-scenario]').first().click();
  await p.locator('[data-scenario-start]').click();
  await p.waitForTimeout(1500);
  await clearDialogs(p);
  await p.getByRole('button', { name: 'Opcje' }).first().click();
  console.log('campaign: save button', await p.locator('[data-save-game]').count());
  await p.locator('[data-save-game]').click();
  await p.keyboard.press('Escape');
  await p.reload();
  await p.waitForTimeout(800);
  await toLoadList();
  const text = await p.locator('[data-wizard-page="load"]').innerText();
  console.log('campaign: list ->', text.replace(/\n+/g, ' | ').slice(0, 300));
  await p.getByRole('button', { name: 'Wczytaj', exact: true }).last().click();
  await p.waitForTimeout(1500);
  console.log('campaign: loaded, in game:', (await p.getByRole('button', { name: 'Opcje' }).count()) > 0);

  // Expedition: a run in progress is listed, and its battle has no manual save.
  await p.evaluate(() => { localStorage.removeItem('skd-autosave'); });
  await p.reload();
  await p.waitForTimeout(800);
  await p.locator('[data-expedition-open]').click();
  await p.locator('[data-expedition-new]').click();
  await p.locator('[data-expedition-run]').waitFor();
  await p.reload();
  await p.waitForTimeout(800);
  await toLoadList();
  console.log('expedition: entry', await p.locator('[data-load-expedition]').count());
  await p.locator('[data-load-expedition] button').click();
  await p.locator('[data-expedition-run]').waitFor();
  console.log('expedition: resumed on the run page');
  await p.locator('[data-expedition-fight]').click();
  await p.waitForTimeout(1500);
  await clearDialogs(p);
  // The battle opens with the artifact and the two spells of the hero.
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
  await p.screenshot({ path: '.tmp/zapisy-tryby-stan.png' });
  await p.getByRole('button', { name: 'Opcje' }).first().click();
  console.log('expedition: save button', await p.locator('[data-save-game]').count());
  console.log('errors', game.errors);
} catch (e) {
  console.log('FAIL', String(e).slice(0, 400));
  await p.screenshot({ path: '.tmp/zapisy-tryby-stan.png' });
} finally {
  await game.close();
}
