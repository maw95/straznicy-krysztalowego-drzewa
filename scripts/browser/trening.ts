// Click check of the training: the menu card, the list, the intro (with the right-click rule), the coach's first step, a click the step holds, and the click it asks for.
// Screenshots -> .tmp/trening-<view>-<step>.png. Usage: npx tsx scripts/browser/trening.ts
import { openGame, type View } from './game';

for (const view of ['desktop', 'malypoziomo'] as View[]) {
  const game = await openGame('', { view, scale: view === 'desktop' ? 0.6 : 1 });
  const p = game.page;
  try {
    await p.waitForTimeout(800);
    // The welcome window of the first launch (the harness marks it seen): bring it back and look at it.
    await p.evaluate(() => localStorage.removeItem('skd-welcome'));
    await p.reload();
    await p.locator('[data-welcome]').waitFor();
    console.log(view, 'welcome has the rule:', (await p.locator('[data-welcome]').innerText()).includes('prawym przyciskiem'));
    await p.screenshot({ path: `.tmp/trening-${view}-powitanie.png` });
    await p.locator('[data-welcome-skip]').click();
    console.log(view, 'welcome stays shut after a reload:', await p.evaluate(() => localStorage.getItem('skd-welcome')));
    await p.locator('[data-new-game]').click();
    await p.locator('[data-training-open]').click();
    await p.locator('[data-training]').waitFor();
    console.log(view, 'cards:', await p.locator('[data-training-card]').count());
    await p.screenshot({ path: `.tmp/trening-${view}-lista.png` });
    await p.locator('[data-training-card="przygoda"]').click();
    const intro = await p.locator('[data-training-intro]').innerText();
    console.log(view, 'intro has the rule:', intro.includes('prawym przyciskiem'));
    await p.screenshot({ path: `.tmp/trening-${view}-wstep.png` });
    await p.locator('[data-training-start]').click();
    await p.locator('[data-coach]').waitFor();
    console.log(view, 'coach:', await p.locator('[data-coach]').getAttribute('data-coach'), '| ring:', await p.locator('[data-hint="hex"]').count());
    await p.screenshot({ path: `.tmp/trening-${view}-krok1.png` });
    // A click on a hex that is not the ring: held (the hero does not move), the coach stays on the step.
    const ring = await p.locator('[data-hint="hex"]').first().evaluate((el) => (el.parentElement as HTMLElement).getAttribute('data-hex'));
    console.log(view, 'ring hex:', ring);
    await p.locator(`[data-hex="${ring}"]`).click({ force: true });
    await p.waitForTimeout(900);
    console.log(view, 'after the click, coach:', await p.locator('[data-coach]').getAttribute('data-coach'));
    await p.screenshot({ path: `.tmp/trening-${view}-krok2.png` });
    console.log(view, 'errors', game.errors);
  } catch (e) {
    console.log(view, 'FAIL', String(e).slice(0, 300));
    await p.screenshot({ path: `.tmp/trening-${view}-stan.png` });
  } finally {
    await game.close();
  }
}
