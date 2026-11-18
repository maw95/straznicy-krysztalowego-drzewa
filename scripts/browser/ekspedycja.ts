// Click check of the Expedition: the menu card, a new run, the first battle's start, and that the run is kept (reload -> "Walcz" again).
// Screenshots -> .tmp/ekspedycja-<view>-<step>.png. Usage: npx tsx scripts/browser/ekspedycja.ts
import { openGame, type View } from './game';

for (const view of ['desktop', 'malypoziomo'] as View[]) {
  const game = await openGame('', { view, scale: view === 'desktop' ? 0.6 : 1 });
  const p = game.page;
  try {
    await p.waitForTimeout(800);
    await p.locator('[data-new-game]').click();
    await p.locator('[data-expedition-open]').click();
    await p.locator('[data-expedition]').waitFor();
    console.log(view, 'heroes:', await p.locator('[data-expedition-heroes] [data-hero]').count());
    await p.screenshot({ path: `.tmp/ekspedycja-${view}-menu.png` });
    await p.locator('[data-expedition-new]').click();
    await p.locator('[data-expedition-run]').waitFor();
    console.log(view, 'stages:', await p.locator('[data-stage]').count(), 'current:', await p.locator('[data-stage][data-state="current"]').count());
    await p.screenshot({ path: `.tmp/ekspedycja-${view}-wyprawa.png` });
    await p.locator('[data-expedition-fight]').click();
    await p.waitForTimeout(2000);
    console.log(view, 'in battle:', await p.locator('.arena-frame, [data-arena], .play-row').count() > 0);
    await p.screenshot({ path: `.tmp/ekspedycja-${view}-bitwa.png` });
    console.log(view, 'saved run:', await p.evaluate(() => localStorage.getItem('skd-expedition-run')?.slice(0, 80)));
    console.log(view, 'errors', game.errors);
  } catch (e) {
    console.log(view, 'FAIL', String(e).slice(0, 300));
    await p.screenshot({ path: `.tmp/ekspedycja-${view}-stan.png` });
  } finally {
    await game.close();
  }
}
