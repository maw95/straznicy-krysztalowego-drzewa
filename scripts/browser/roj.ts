// Click check of a rivalry table with the Forest Swarm: the setup screen offers the faction, the developer panel builds everything, the buildings of the Swarm
// (Serce Grzybni, Ogród Grzybów, Podziemne Korytarze) stand in the settlement window; a fight with neutrals shows the mycelium on the arena, the Matka Grzybni's
// Rozsiew (ability button, then a lit cell) and the Cykada's Wielki Chór (one click); a game of bots shows the mycelium too -> .tmp/roj*.png.
// Usage: SKD_BROWSER_PORT=5185 npx tsx scripts/browser/roj.ts [widok] [części]   (desktop by default; a worktree uses its own port)
import { openGame, type View } from './game';
const view = (process.argv[2] ?? 'desktop') as View;
const want = (n: string) => !process.argv[3] || process.argv[3].includes(n);
const mycelium = (p: import('playwright').Page) => p.locator('[data-mycelium]').count();

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
  const sel = p.locator('select[aria-label="Frakcja"]');
  await sel.first().waitFor({ timeout: 5000 });
  console.log('Swarm offered:', (await sel.first().locator('option').allInnerTexts()).includes('Rój Puszczy'));
  await sel.nth(seat).selectOption('swarm');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `.tmp/roj-setup-${view}.png` });
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
    for (const id of ['myceliumHeart', 'mushroomGarden', 'tunnels']) console.log(id, 'in the town:', await p.locator(`[data-building="${id}"]`).getAttribute('aria-label'));
    await p.locator('[data-building="myceliumHeart"]').click();
    await p.waitForTimeout(400);
    console.log('heart text found:', (await p.locator('body').innerText()).includes('grzybni'));
    await p.screenshot({ path: `.tmp/roj-osada-${view}.png` });
    console.log('errors (settlement)', g.errors.join('|') || 'none');
  } catch (e) { console.log('FAIL (settlement)', String(e).slice(0, 600)); await p.screenshot({ path: `.tmp/roj-fail1-${view}.png` }); }
  await g.close();
}

if (want('2')) {
  const g = await startTable(true, 0, [0]);
  const p = g.page;
  try {
    await p.locator('[data-dev-panel]').waitFor({ timeout: 20000 });
    await p.getByRole('button', { name: /wybuduj wszystko/i }).first().click().catch(() => console.log('no build-everything button'));
    for (const name of ['Matka Grzybni', 'Cesarska Cykada']) {
      const unit = p.locator('select[aria-label="Jednostka"]');
      const value = await unit.locator('option', { hasText: name }).first().getAttribute('value');
      if (value) {
        await unit.selectOption(value);
        await p.locator('[data-dev="unit"]').click();
      } else console.log('no unit in the dev list:', name);
    }
    await p.locator('[data-dev-fight="0"]').click();
    // a choice of supports may come first (the team is bigger than the places)
    await p.waitForTimeout(1500);
    if (await p.getByRole('button', { name: /Do bitwy/ }).count()) {
      // the Matka and the Cykada, then whoever fills the places left
      for (const name of ['Matka Grzybni', 'Cesarska Cykada', 'Mrówka Wojowniczka', 'Purchawka', 'Świetlik']) {
        if (await p.getByRole('button', { name: /Do bitwy/ }).isEnabled()) break;
        await p.locator('.overlay button.btn', { hasText: name }).first().dispatchEvent('click');
        await p.waitForTimeout(200);
      }
      await p.getByRole('button', { name: /Do bitwy/ }).click();
    }
    await p.getByRole('button', { name: /Gotowe/ }).waitFor({ timeout: 10000 });
    await p.getByRole('button', { name: /Gotowe/ }).click();
    await p.waitForTimeout(1500);
    console.log('fight: mycelium cells on the arena (deploy cells + Spark):', await mycelium(p));
    await p.screenshot({ path: `.tmp/roj-bitwa-${view}.png` });
    const used = new Set<string>();
    for (let i = 0; i < 40 && used.size < 2 && (await p.locator('.arena-frame').count()); i++) {
      const name = (await p.locator('.act-info').first().innerText().catch(() => '')).split('\n')[0];
      const ability = p.locator('.act-btn', { hasText: /Rozsiew|Wielki Chór/ });
      if (name.includes('Matka Grzybni') && (await ability.count())) {
        const before = await mycelium(p);
        await ability.first().click();
        await p.waitForTimeout(300);
        const lit = p.locator('polygon[data-cell][fill^="rgba(200,100,40"]');
        console.log('Rozsiew: lit cells', await lit.count());
        await p.screenshot({ path: `.tmp/roj-rozsiew-${view}.png` });
        await lit.last().dispatchEvent('click');
        await p.waitForTimeout(600);
        console.log('Rozsiew: mycelium', before, '->', await mycelium(p));
        used.add('spores');
        continue;
      }
      if (name.includes('Cesarska Cykada') && (await ability.count())) {
        await ability.first().click();
        await p.waitForTimeout(600);
        const body = await p.locator('body').innerText();
        console.log('Wielki Chór clicked; ability button left:', await ability.count(), '| error:', body.match(/[^\n]*niedostępna[^\n]*/)?.[0] ?? 'none');
        await p.screenshot({ path: `.tmp/roj-chor-${view}.png` });
        used.add('chorus');
        continue;
      }
      await p.keyboard.press('Space');
      await p.waitForTimeout(700);
    }
    console.log('abilities used:', [...used].join(', ') || 'none');
    await p.screenshot({ path: `.tmp/roj-po-${view}.png` });
    console.log('errors (fight)', g.errors.join('|') || 'none');
  } catch (e) { console.log('FAIL (fight)', String(e).slice(0, 800)); await p.screenshot({ path: `.tmp/roj-fail2-${view}.png` }); }
  await g.close();
}

if (want('3')) {
  const g = await startTable(false, 1, []);
  const p = g.page;
  try {
    let found = false;
    let cells = 0;
    for (let i = 0; i < 60 && !(found && cells); i++) {
      await p.waitForTimeout(2000);
      found = (await p.locator('.arena-frame').count()) > 0 && (await p.getByText(/Królowa Modliszek|Śniący Muchomor|Chrząszcz Goliat|Purchawka|Mrówka Wojowniczka|Świetlik/).count()) > 0;
      if (found) cells = await mycelium(p);
    }
    console.log('battle with the Swarm seen:', found, '| mycelium cells shown:', cells);
    await p.screenshot({ path: `.tmp/roj-boty-${view}.png` });
    console.log('errors (bots)', g.errors.join('|') || 'none');
  } catch (e) { console.log('FAIL (bots)', String(e).slice(0, 600)); await p.screenshot({ path: `.tmp/roj-fail3-${view}.png` }); }
  await g.close();
}
process.exit(0);
