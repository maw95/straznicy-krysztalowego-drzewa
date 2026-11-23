// Click check of a rivalry table with the Brotherhood of the Tide: the setup screen offers the faction, the developer panel builds everything, the buildings of the
// Tides (Świątynia Pływów, Perłowe Ławice, Latarnia Morska) stand in the settlement window; a fight with neutrals shows the Przypływ button (it lights the allies in
// reach, a click on one swaps them), the Wiedźma's Odpływ (two steps: a unit, then the lit cell of the other one) and the Lewiatan's Wir Głębin (one click); a game
// of bots with the Tides runs to a battle -> .tmp/przyplyw*.png.
// Usage: SKD_BROWSER_PORT=5186 npx tsx scripts/browser/przyplyw.ts [widok] [części]   (desktop by default; a worktree uses its own port)
import { openGame, type View } from './game';
const view = (process.argv[2] ?? 'desktop') as View;
const want = (n: string) => !process.argv[3] || process.argv[3].includes(n);
const lit = (p: import('playwright').Page) => p.locator('polygon[data-cell][fill^="rgba(200,100,40"]');
const posOf = async (p: import('playwright').Page) => p.evaluate(() => [...document.querySelectorAll('[data-unit]')].map((e) => `${e.getAttribute('data-unit')}@${Math.round(e.getBoundingClientRect().x)},${Math.round(e.getBoundingClientRect().y)}`).join(' '));

async function startTable(dev: boolean, seat: number, humans: number[]) {
  const g = await openGame(dev ? 'dev=1' : '', { view, scale: 1 });
  const p = g.page;
  await p.waitForTimeout(800);
  await p.locator('[data-new-game]').click();
  await p.locator('[data-wizard-page="mode"]').waitFor();
  await p.locator('[data-mode="pvp"]').click();
  await p.locator('[data-wizard-page="where"] .opt-card').first().click();
  await p.locator('[data-wizard-page="tier"] .opt-card', { hasText: 'Imperium' }).click();
  for (let i = 0; i < 6 && !(await p.locator('.well select[aria-label="Kto gra"]').count()); i++) {
    if (await p.locator('[data-wizard-page="objective"]').count()) await p.locator('[data-wizard-page="objective"] .opt-card', { hasText: 'Podbój' }).click().catch(() => {});
    if (await p.locator('[data-wizard-page="players"]').count()) await p.locator('.count-chip', { hasText: /^2$/ }).click().catch(() => {});
    await p.locator('[data-shape="rectangle"]').click().catch(() => {});
    await p.getByRole('button', { name: 'Dalej →' }).click({ timeout: 3000 }).catch(() => {});
    await p.waitForTimeout(400);
  }
  const sel = p.locator('[data-seat-factions]');
  await sel.first().waitFor({ timeout: 5000 });
  console.log('Tides offered:', (await sel.first().locator('[data-faction]').evaluateAll((b) => b.map((x) => x.getAttribute('aria-label')?.replace('Frakcja: ', '') ?? ''))).includes('Bractwo Przypływu'));
  await sel.nth(seat).locator('[data-faction="tides"]').click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: `.tmp/przyplyw-setup-${view}.png` });
  for (const i of [0, 1]) await p.locator('select[aria-label="Kto gra"]').nth(i).selectOption(humans.includes(i) ? 'human' : 'bot').catch(() => {});
  await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
  return g;
}

if (want('1')) {
  const g = await startTable(true, 0, [0]);
  const p = g.page;
  try {
    await p.locator('[data-dev-panel]').waitFor({ timeout: 20000 });
    await p.locator('[data-dev-scene="settlement"]').click();
    await p.locator('[data-enter-settlement]').click();
    for (const id of ['tideTemple', 'pearlBanks', 'lighthouse']) console.log(id, 'in the town:', await p.locator(`[data-building="${id}"]`).getAttribute('aria-label'));
    await p.locator('[data-building="tideTemple"]').click();
    await p.waitForTimeout(400);
    console.log('temple text found:', (await p.locator('body').innerText()).includes('zamienia się miejscami'));
    await p.screenshot({ path: `.tmp/przyplyw-osada-${view}.png` });
    console.log('errors (settlement)', g.errors.join('|') || 'none');
  } catch (e) { console.log('FAIL (settlement)', String(e).slice(0, 600)); await p.screenshot({ path: `.tmp/przyplyw-fail1-${view}.png` }); }
  await g.close();
}

if (want('2')) {
  const g = await startTable(true, 0, [0]);
  const p = g.page;
  try {
    await p.locator('[data-dev-panel]').waitFor({ timeout: 20000 });
    await p.getByRole('button', { name: /wybuduj wszystko/i }).first().click().catch(() => console.log('no build-everything button'));
    for (const name of ['Morska Wiedźma', 'Lewiatan']) {
      const unit = p.locator('select[aria-label="Jednostka"]');
      const value = await unit.locator('option', { hasText: name }).first().getAttribute('value');
      if (value) {
        await unit.selectOption(value);
        await p.locator('[data-dev="unit"]').click();
      } else console.log('no unit in the dev list:', name);
    }
    await p.locator('[data-dev-fight="0"]').click();
    await p.waitForTimeout(1500);
    if (await p.getByRole('button', { name: /Do bitwy/ }).count()) {
      for (const name of ['Morska Wiedźma', 'Lewiatan', 'Żółw Skorupiak', 'Trytoński Harpunnik', 'Żabi Skoczek']) {
        if (await p.getByRole('button', { name: /Do bitwy/ }).isEnabled()) break;
        await p.locator('.overlay button.btn', { hasText: name }).first().dispatchEvent('click');
        await p.waitForTimeout(200);
      }
      await p.getByRole('button', { name: /Do bitwy/ }).click();
    }
    await p.getByRole('button', { name: /Gotowe/ }).waitFor({ timeout: 10000 });
    await p.getByRole('button', { name: /Gotowe/ }).click();
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `.tmp/przyplyw-bitwa-${view}.png` });
    const used = new Set<string>();
    for (let i = 0; i < 40 && used.size < 3 && (await p.locator('.arena-frame').count()); i++) {
      const name = (await p.locator('.act-info').first().innerText().catch(() => '')).split('\n')[0];
      const tide = p.locator('[data-tide-swap]');
      if (!used.has('tide') && (await tide.count())) {
        await tide.click();
        await p.waitForTimeout(300);
        const n = await lit(p).count();
        console.log('Przypływ:', name, '| lit allies', n);
        await p.screenshot({ path: `.tmp/przyplyw-zamiana-${view}.png` });
        const before = await posOf(p);
        await lit(p).first().dispatchEvent('click');
        await p.waitForTimeout(900);
        console.log('Przypływ: units moved', before !== (await posOf(p)), '| button left', await tide.count(), '| same unit still acts', (await p.locator('.act-info').first().innerText().catch(() => '')).split('\n')[0] === name);
        used.add('tide');
        continue;
      }
      const ability = p.locator('.act-btn', { hasText: /Odpływ|Wir Głębin/ });
      if (name.includes('Morska Wiedźma') && (await ability.count())) {
        await ability.first().click();
        await p.waitForTimeout(300);
        const first = p.locator('.token.cur-spell');
        console.log('Odpływ: units to pick', await first.count());
        await first.first().dispatchEvent('click');
        await p.waitForTimeout(300);
        console.log('Odpływ: lit cells of the second unit', await lit(p).count(), '| auto button', await p.locator('[data-auto-cell]').count());
        await p.screenshot({ path: `.tmp/przyplyw-odplyw-${view}.png` });
        const before = await posOf(p);
        await lit(p).last().dispatchEvent('click');
        await p.waitForTimeout(900);
        console.log('Odpływ: units moved', before !== (await posOf(p)), '| ability button left', await ability.count());
        used.add('ebb');
        continue;
      }
      if (name.includes('Lewiatan') && (await ability.count())) {
        await ability.first().click();
        await p.waitForTimeout(600);
        const body = await p.locator('body').innerText();
        console.log('Wir Głębin clicked; ability button left:', await ability.count(), '| error:', body.match(/[^\n]*niedostępn[^\n]*/)?.[0] ?? 'none');
        await p.screenshot({ path: `.tmp/przyplyw-wir-${view}.png` });
        used.add('whirl');
        continue;
      }
      await p.keyboard.press('Space');
      await p.waitForTimeout(700);
    }
    console.log('used:', [...used].join(', ') || 'none');
    await p.screenshot({ path: `.tmp/przyplyw-po-${view}.png` });
    console.log('errors (fight)', g.errors.join('|') || 'none');
  } catch (e) { console.log('FAIL (fight)', String(e).slice(0, 800)); await p.screenshot({ path: `.tmp/przyplyw-fail2-${view}.png` }); }
  await g.close();
}

if (want('3')) {
  const g = await startTable(false, 1, []);
  const p = g.page;
  try {
    let found = false;
    for (let i = 0; i < 60 && !found; i++) {
      await p.waitForTimeout(2000);
      found = (await p.locator('.arena-frame').count()) > 0 && (await p.getByText(/Król Trytonów|Syrena Pieśniarka|Wąż Morski|Żółw Skorupiak|Trytoński Harpunnik|Żabi Skoczek/).count()) > 0;
    }
    console.log('battle with the Tides seen:', found);
    await p.screenshot({ path: `.tmp/przyplyw-boty-${view}.png` });
    console.log('errors (bots)', g.errors.join('|') || 'none');
  } catch (e) { console.log('FAIL (bots)', String(e).slice(0, 600)); await p.screenshot({ path: `.tmp/przyplyw-fail3-${view}.png` }); }
  await g.close();
}
process.exit(0);
