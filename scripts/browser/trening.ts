// Click check of the training: the menu card, the list, the intro (with the right-click rule), the coach's first step, a click the step holds, and the click it asks for.
// Screenshots -> .tmp/trening-<view>-<step>.png. Usage: npx tsx scripts/browser/trening.ts
import { openGame, type View } from './game';

for (const view of (process.env.VIEWS ?? 'desktop,malypoziomo').split(',') as View[]) {
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
    const coachId = () => p.locator('[data-coach]').getAttribute('data-coach');
    const shot = async (name: string) => { await p.waitForTimeout(900); await p.screenshot({ path: `.tmp/trening-${view}-${name}.png` }); };
    // On to the battle: follow the ring (or end the turn), closing the found-treasure window, until the coach is past the walking steps.
    for (let i = 0; i < 60; i++) {
      const id = await coachId();
      if (id !== 'ruch' && id !== 'strazy') break;
      const found = p.getByRole('button', { name: /Do ekwipunku/ });
      if (await found.count()) { await found.first().click(); await p.waitForTimeout(400); continue; }
      const fight = p.getByRole('button', { name: /Do walki!/ });
      if (await fight.count()) { await fight.click(); await p.waitForTimeout(800); continue; }
      if (await p.locator('[data-hint="hex"]').count()) {
        const hex = await p.locator('[data-hint="hex"]').first().evaluate((el) => (el.parentElement as HTMLElement).getAttribute('data-hex'));
        await p.locator(`[data-hex="${hex}"]`).click({ force: true });
      } else {
        await p.getByRole('button', { name: /Zakończ turę/ }).first().click({ force: true });
        await p.waitForTimeout(300);
        // "Masz jeszcze punkty ruchu. Zakończyć turę?": confirm.
        if (await p.getByText(/Masz jeszcze/).count()) await p.getByRole('button', { name: /Zakończ turę/ }).last().click();
      }
      await p.waitForTimeout(600);
    }
    console.log(view, 'coach now:', await coachId());
    await shot('pomocnicy');
    if ((await coachId()) === 'pomocnicy') {
      const cards = p.locator('button.btn', { has: p.locator('text=/Elf Druid|Nimfa|Pegaz|Pomocnik/') }).filter({ hasNot: p.locator('text=Do bitwy') });
      await cards.nth(0).click({ force: true });
      await cards.nth(1).click({ force: true });
      await p.getByRole('button', { name: /Do bitwy!/ }).click();
      await p.waitForTimeout(600);
      console.log(view, 'coach now:', await coachId());
      await shot('ustawienie');
      await p.getByRole('button', { name: /Gotowe — do bitwy/ }).click();
      await p.waitForTimeout(1500);
      console.log(view, 'coach now:', await coachId());
      await shot('walka');
      for (const next of ['zdolnosci', 'skarby']) {
        await p.locator('[data-coach-next]').click();
        console.log(view, 'coach now:', await coachId());
        await shot(next);
      }
    }
    console.log(view, 'errors', game.errors);
  } catch (e) {
    console.log(view, 'FAIL', String(e).slice(0, 300));
    await p.screenshot({ path: `.tmp/trening-${view}-stan.png` });
  } finally {
    await game.close();
  }
}
