// Click check of the story campaign: the menu card, the list of scenarios, the intro, and the first scenario's game with its opening story note.
// Screenshots -> .tmp/kampania-<view>-<step>.png. Usage: npx tsx scripts/browser/kampania.ts
import { openGame, type View } from './game';

for (const view of ['desktop', 'malypoziomo'] as View[]) {
  const game = await openGame('', { view, scale: view === 'desktop' ? 0.6 : 1 });
  const p = game.page;
  try {
    await p.waitForTimeout(800);
    await p.locator('[data-new-game]').click();
    await p.locator('[data-campaign-open]').click();
    await p.locator('[data-campaign]').waitFor();
    console.log(view, 'scenarios:', await p.locator('[data-scenario]').count(), 'open:', await p.locator('[data-scenario][data-state="open"]').count());
    await p.screenshot({ path: `.tmp/kampania-${view}-lista.png` });
    await p.locator('[data-scenario="pierwsza-dolina"]').click();
    await p.locator('[data-scenario-intro]').waitFor();
    await p.screenshot({ path: `.tmp/kampania-${view}-wstep.png` });
    await p.locator('[data-scenario-start]').click();
    await p.waitForTimeout(1500);
    const note = p.locator('[data-story]');
    console.log(view, 'story note on start:', await note.count(), (await note.count()) ? (await note.first().innerText()).slice(0, 60) : '');
    await p.screenshot({ path: `.tmp/kampania-${view}-start.png` });
    console.log(view, 'errors', game.errors);
  } catch (e) {
    console.log(view, 'FAIL', String(e).slice(0, 200));
    await p.screenshot({ path: `.tmp/kampania-${view}-stan.png` });
  } finally {
    await game.close();
  }
}
