// Click check of the training: the menu card, the list, the intro (with the right-click rule), the coach's first step, a click the step holds, and the click it asks for.
// Screenshots -> .tmp/trening-<view>-<step>.png. Usage: npx tsx scripts/browser/trening.ts
import { openGame, type View } from './game';

/** Which training to play through: TRAINING=spacer (default przygoda). */
const T = process.env.TRAINING ?? 'przygoda';

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
    await p.locator(`[data-training-card="${T}"]`).click();
    const intro = await p.locator('[data-training-intro]').innerText();
    console.log(view, 'intro has the rule:', intro.includes('prawym przyciskiem'));
    await p.screenshot({ path: `.tmp/trening-${view}-wstep.png` });
    await p.locator('[data-training-start]').click();
    await p.locator('[data-coach]').waitFor();
    console.log(view, 'coach:', await p.locator('[data-coach]').getAttribute('data-coach'), '| ring:', await p.locator('[data-hint="hex"]').count());
    await p.screenshot({ path: `.tmp/trening-${view}-krok1.png` });
    const coachId = () => p.locator('[data-coach]').getAttribute('data-coach');
    const shot = async (name: string) => { await p.waitForTimeout(900); await p.screenshot({ path: `.tmp/trening-${view}-${name}.png` }); };
    // Follow the coach on the map: "Dalej" on explaining steps, the windows that ask for a click (a found treasure, an artifact, a skill, the fight), the ring, else the end of the turn;
    // a screenshot at every new step. Stops at the battle steps (played below) or at the end of the game.
    const seen = new Set<string>();
    for (let i = 0; i < 90; i++) {
      const id = (await p.locator('[data-coach]').count()) ? await coachId() : 'koniec';
      if (id === 'koniec') { console.log(view, 'game over:', await p.locator('[data-training-over]').getAttribute('data-training-over').catch(() => '?')); await shot('koniec'); }
      if (!id || ['pomocnicy', 'pojedynek', 'koniec'].includes(id)) break;
      if (!seen.has(id)) { seen.add(id); console.log(view, 'step:', id); await shot(`krok-${id}`); }
      const click = async (name: RegExp) => { const b = p.getByRole('button', { name }); if (await b.count()) { await b.last().click(); await p.waitForTimeout(500); return true; } return false; };
      if (await p.locator('[data-coach-next]').count()) { await p.locator('[data-coach-next]').click(); continue; }
      if ((await click(/Do ekwipunku/)) || (await click(/Do walki!/)) || (await click(/^Rozumiem$/))) continue;
      if (await p.locator('.skill-card').count()) { await p.locator('.skill-card').first().click(); await p.waitForTimeout(500); continue; }
      if (await p.locator('[data-hint="hex"]').count()) {
        const hex = await p.locator('[data-hint="hex"]').first().evaluate((el) => (el.parentElement as HTMLElement).getAttribute('data-hex'));
        // A plain DOM click: the hex may lie under the round track at the map's corner (a person scrolls the map; the check does not need to).
        await p.locator(`[data-hex="${hex}"]`).evaluate((el) => (el as HTMLElement).click());
      } else {
        await p.getByRole('button', { name: /Zakończ turę/ }).first().click({ force: true });
        await p.waitForTimeout(300);
        if (await p.getByText(/Masz jeszcze/).count()) await p.getByRole('button', { name: /Zakończ turę/ }).last().click();
      }
      await p.waitForTimeout(600);
    }
    if (await p.locator('[data-coach]').count()) console.log(view, 'coach now:', await coachId());
    await shot('pomocnicy');
    if (T === 'spacer' && (await coachId()) === 'pojedynek') {
      await shot('pojedynek');
      for (let i = 0; i < 40 && (await p.getByRole('button', { name: /Atakuj/ }).count()); i++) {
        const atk = p.getByRole('button', { name: /Atakuj/ });
        if (await atk.isEnabled()) await atk.click();
        await p.waitForTimeout(900);
      }
      console.log(view, 'after the duel, coach:', await coachId());
      await shot('po-pojedynku');
    }
    if (T === 'przygoda' && (await coachId()) === 'pomocnicy') {
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
