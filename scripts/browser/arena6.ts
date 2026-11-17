// Click check of the 6 on 6 arena: the artifact choice, the five supports out of eight, the deployment and a few spells in the battle.
// Screenshots -> .tmp/arena6-*.png. Usage: npx tsx scripts/browser/arena6.ts
import { openGame, type View } from './game';

for (const view of ['desktop', 'poziomo'] as View[]) {
  const game = await openGame('steps=0&mode=arena&size=6&seed=5', { view, scale: view === 'desktop' ? 0.6 : 1 });
  const p = game.page;
  try {
    // 1) the artifact: three offers, one is chosen
    const offers = p.locator('[data-gear-offer]');
    await offers.first().waitFor({ timeout: 15000 });
    console.log(view, 'gear offers:', await offers.count());
    await p.screenshot({ path: `.tmp/arena6-${view}-artefakt.png` });
    for (let guard = 0; guard < 2 && (await p.locator('[data-gear-offer]').count()); guard++) {
      await offers.first().click();
      await p.getByRole('button', { name: 'Biorę ten artefakt' }).click();
      await p.waitForTimeout(500);
    }
    // 2) supports: pick five of eight
    const go = p.getByRole('button', { name: 'Do bitwy!' });
    await go.waitFor({ timeout: 15000 });
    const cards = go.locator('xpath=preceding-sibling::div[1]/button');
    console.log(view, 'pool size:', await cards.count());
    for (let i = 0; i < 5; i++) await cards.nth(i).click();
    await p.screenshot({ path: `.tmp/arena6-${view}-pomocnicy.png` });
    console.log(view, 'go enabled:', await go.isEnabled());
    await go.click();
    // 3) treasure draft (3 on 3 rules keep it): pick the first offers until the deployment or the fight
    const end = p.getByRole('button', { name: 'Koniec', exact: true });
    for (let i = 0; i < 60; i++) {
      const take = p.getByRole('button', { name: 'Biorę ten skarb' });
      const ready = p.getByRole('button', { name: /Gotowe/ });
      if (await p.locator('[data-spell-btn]').count()) break;
      if (await take.count()) { await p.locator('[aria-pressed]').first().click().catch(() => undefined); await take.click().catch(() => undefined); }
      else if (await ready.count()) await ready.first().click().catch(() => undefined);
      else if ((await end.count()) && (await end.first().isEnabled())) await end.first().click().catch(() => undefined);
      await p.waitForTimeout(700);
    }
    console.log(view, 'spell button:', await p.locator('[data-spell-btn]').count());
    await p.screenshot({ path: `.tmp/arena6-${view}-bitwa.png` });
    if (await p.locator('[data-spell-btn]').count()) {
      await p.locator('[data-spell-btn]').click();
      await p.locator('[data-spell-list]').waitFor();
      console.log(view, 'spells in book:', await p.locator('[data-spell]').count());
      await p.screenshot({ path: `.tmp/arena6-${view}-ksiega.png` });
    }
    console.log(view, 'hscroll', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'errors', game.errors);
  } catch (e) {
    console.log(view, 'FAIL', String(e).slice(0, 300));
    await p.screenshot({ path: `.tmp/arena6-${view}-stan.png` });
  } finally { await game.close(); }
}
