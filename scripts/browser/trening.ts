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
    await p.screenshot({ path: `.tmp/trening-${T}-${view}-powitanie.png` });
    await p.locator('[data-welcome-skip]').click();
    console.log(view, 'welcome stays shut after a reload:', await p.evaluate(() => localStorage.getItem('skd-welcome')));
    await p.locator('[data-new-game]').click();
    await p.locator('[data-training-open]').click();
    await p.locator('[data-training]').waitFor();
    console.log(view, 'cards:', await p.locator('[data-training-card]').count());
    await p.screenshot({ path: `.tmp/trening-${T}-${view}-lista.png` });
    await p.locator(`[data-training-card="${T}"]`).click();
    const intro = await p.locator('[data-training-intro]').innerText();
    console.log(view, 'intro has the rule:', intro.includes('prawym przyciskiem'));
    await p.screenshot({ path: `.tmp/trening-${T}-${view}-wstep.png` });
    await p.locator('[data-training-start]').click();
    await p.locator('[data-coach]').waitFor();
    console.log(view, 'coach:', await p.locator('[data-coach]').getAttribute('data-coach'), '| ring:', await p.locator('[data-hint="hex"]').count());
    await p.screenshot({ path: `.tmp/trening-${T}-${view}-krok1.png` });
    const coachId = () => p.locator('[data-coach]').getAttribute('data-coach');
    const shot = async (name: string) => { await p.waitForTimeout(900); await p.screenshot({ path: `.tmp/trening-${T}-${view}-${name}.png` }); };
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
      // The settlement steps: in through "Wejdź do osady", then the Settlement Council's tree (building, the exchange), a building of the landscape (barracks, tavern)
      // or the garrison of the bottom bar; out through the exit button (Esc does not close the settlement).
      const council = async (node: RegExp) => {
        await p.getByRole('button', { name: /^Rada Osady/ }).first().click();
        await p.waitForTimeout(600);
        await p.getByRole('button', { name: node }).first().click();
        await p.waitForTimeout(500);
      };
      const SETTLEMENT: Record<string, () => Promise<void>> = {
        koszary: async () => { await council(/^Koszary/); await shot(`osada-${id}`); await p.getByRole('button', { name: /Zbuduj/ }).first().click(); },
        rekrutacja: async () => { await p.getByRole('button', { name: /^Koszary/ }).first().click(); await p.waitForTimeout(700); await shot(`osada-${id}`); await p.locator('button:has-text("Rekrutuj"):not([disabled])').first().click(); },
        wymiana: async () => { await p.getByRole('button', { name: /^Targ/ }).first().click(); await p.waitForTimeout(700); await shot(`osada-${id}`); for (let k = 0; k < 2; k++) { await p.locator('[data-trade-buy="ore"]').click(); await p.waitForTimeout(400); } await p.locator('[data-modal-close]').click(); },
        skarbiec: async () => { await council(/^Skarbiec/); await shot(`osada-${id}`); await p.getByRole('button', { name: /Zbuduj/ }).first().click(); },
        targ: async () => { await council(/^Targ/); await shot(`osada-${id}`); await p.getByRole('button', { name: /Zbuduj/ }).first().click(); },
        karczma: async () => { await council(/^Karczma/); await shot(`osada-${id}`); await p.getByRole('button', { name: /Zbuduj/ }).first().click(); },
        garnizon: async () => { await shot(`osada-${id}`); await p.locator('[data-garrison-in]').first().click(); },
        dowodca: async () => { await p.getByRole('button', { name: /^Karczma/ }).first().click(); await p.waitForTimeout(700); await shot(`osada-${id}`); await p.locator('[data-hire]:not([disabled])').first().click(); },
        siedlisko: async () => { await p.getByRole('button', { name: /^Koszary/ }).first().click(); await p.waitForTimeout(700); await shot(`osada-${id}`); await p.locator('[data-dwelling]:not([disabled])').first().click(); },
        iskra: async () => { await council(/Sanktuarium/); await shot(`osada-${id}`); await p.getByRole('button', { name: /Wznieś/ }).first().click(); },
      };
      if (SETTLEMENT[id] && !(id === 'iskra' && (await p.locator('[data-hint="hex"]').count()))) {
        await p.locator('[data-enter-settlement]').click();
        await p.waitForTimeout(900);
        await SETTLEMENT[id]();
        await p.waitForTimeout(600);
        await shot(`osada-${id}-po`);
        if (await p.locator('[data-modal-close]').count()) { await p.locator('[data-modal-close]').first().click(); await p.waitForTimeout(400); }
        for (let k = 0; k < 4 && (await p.locator('.sb-exit').count()); k++) { await p.locator('.sb-exit').first().click(); await p.waitForTimeout(500); }
        continue;
      }
      // A battle of the later trainings: looked at, not played.
      if (T !== 'przygoda' && T !== 'spacer' && (await p.getByRole('button', { name: /Do bitwy!|Gotowe — do bitwy/ }).count())) {
        await shot('bitwa');
        if (T === 'krolestwo') {
          // The spell step: through the helpers and the placing, then wait for the hero's activation and look at the spell bar.
          if (await p.getByRole('button', { name: /Do bitwy!/ }).count()) {
            const cards = p.locator('button.btn', { has: p.locator('text=/Elf Druid|Nimfa|Pegaz/') }).filter({ hasNot: p.locator('text=Do bitwy') });
            await cards.nth(0).click({ force: true });
            await cards.nth(1).click({ force: true });
            await p.getByRole('button', { name: /Do bitwy!/ }).click();
          }
          await p.waitForTimeout(600);
          await p.getByRole('button', { name: /Gotowe — do bitwy/ }).click();
          for (let k = 0; k < 20 && (await coachId()) !== 'czar'; k++) await p.waitForTimeout(500);
          await p.waitForTimeout(4000);
          console.log(view, 'coach in the battle:', await coachId());
          await shot('czar');
        }
        break;
      }
      if ((await click(/Do ekwipunku/)) || (await click(/Do walki!/)) || (await click(/^Rozumiem$/)) || (await click(/^Artefakt$/))) continue;
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
    await p.screenshot({ path: `.tmp/trening-${T}-${view}-stan.png` });
  } finally {
    await game.close();
  }
}
