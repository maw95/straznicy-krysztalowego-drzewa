// The menu's pages: first page (Nowa gra / Wczytaj grę + the board link), the modes, where to play; the board edition's modes. -> .tmp/menu-<view>-*.png
// Usage: npx tsx scripts/browser/menu-nowe.ts
import { openGame, type View } from './game';

for (const view of ['desktop', 'telefon'] as View[]) {
  const game = await openGame('', { view, scale: view === 'desktop' ? 0.6 : 1 });
  const p = game.page;
  try {
    await p.waitForTimeout(800);
    await p.screenshot({ path: `.tmp/menu-${view}-1.png` });
    await p.locator('[data-new-game]').click();
    await p.locator('[data-wizard-page="mode"]').waitFor();
    console.log(view, 'modes:', await p.locator('[data-wizard-page="mode"] .opt-card-title').allInnerTexts());
    await p.screenshot({ path: `.tmp/menu-${view}-2.png` });
    await p.locator('[data-mode="coop"]').click();
    await p.locator('[data-wizard-page="where"] .opt-card').first().click();
    await p.locator('[data-wizard-page="tier"]').waitFor();
    console.log(view, 'lit on the level page:', await p.locator('[data-wizard-page="tier"] .opt-card[aria-pressed="true"]').count());
    await p.screenshot({ path: `.tmp/menu-${view}-tier.png` });
    await p.locator('[data-wizard-page="tier"] .opt-card', { hasText: 'Wyprawa' }).click();
    await p.locator('[data-wizard-page="objective"]').waitFor();
    console.log(view, 'lit on the goal page:', await p.locator('[data-wizard-page="objective"] .opt-card[aria-pressed="true"]').count());
    await p.screenshot({ path: `.tmp/menu-${view}-cel.png` });
    await p.locator('[data-wizard-page="objective"] .opt-card', { hasText: 'Punkty kontrolne' }).click();
    await p.locator('[data-wizard-page="map"]').waitFor();
    await p.locator('[data-shape="ring"]').click({ button: 'right' });
    await p.waitForTimeout(400);
    await p.screenshot({ path: `.tmp/menu-${view}-mapa.png` });
    for (let i = 0; i < 4; i++) await p.getByRole('button', { name: '← Wstecz' }).click();
    await p.locator('[data-mode="arena"]').click();
    await p.locator('[data-wizard-page="where"]').waitFor();
    await p.screenshot({ path: `.tmp/menu-${view}-3.png` });
    await p.getByRole('button', { name: '← Wstecz' }).click();
    await p.getByRole('button', { name: '← Wstecz' }).click();
    await p.locator('[data-board-open]').click();
    await p.locator('[data-wizard-page="mode"]').waitFor();
    console.log(view, 'board modes:', await p.locator('[data-wizard-page="mode"] .opt-card-title').allInnerTexts());
    console.log(view, 'errors', game.errors);
  } catch (e) {
    console.log(view, 'FAIL', String(e).slice(0, 300));
    await p.screenshot({ path: `.tmp/menu-${view}-stan.png` });
  } finally {
    await game.close();
  }
}
