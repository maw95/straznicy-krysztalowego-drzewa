// Click check of a rivalry table with the Desert Empire: the setup screen offers the faction, the developer panel builds everything, the buildings of the Empire
// (Pałac Mirażu, Szlak Karawan, Brama Wydm) stand in the settlement window; a fight with neutrals shows the mirages to their owner (the "Miraż" badge) at the
// deployment and in the fight; a game of bots watched by nobody shows no mirage badge; two people at one screen get the veil and "Podejrzyj miraże" -> .tmp/piaski*.png.
// Usage: SKD_BROWSER_PORT=5183 npx tsx scripts/browser/piaski.ts [widok] [części]   (desktop by default; a worktree uses its own port)
import { openGame, type View } from './game';
const view = (process.argv[2] ?? 'desktop') as View;
const want = (n: string) => !process.argv[3] || process.argv[3].includes(n);
const mirageBadges = (p: import('playwright').Page) => p.locator('span[title^="Miraż: atrapa"]').count();

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
  console.log('faction options', await sel.first().locator('option').allInnerTexts());
  await sel.nth(seat).selectOption('sands');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `.tmp/piaski-setup-${view}.png` });
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
    for (const id of ['mirageHall', 'caravanRoad', 'sandGate']) console.log(id, 'in the town:', await p.locator(`[data-building="${id}"]`).getAttribute('aria-label'));
    await p.locator('[data-building="mirageHall"]').click();
    await p.waitForTimeout(400);
    console.log('palace text found:', (await p.locator('body').innerText()).includes('miraż'));
    await p.screenshot({ path: `.tmp/piaski-osada-${view}.png` });
    console.log('errors (settlement)', g.errors.join('|') || 'none');
  } catch (e) { console.log('FAIL (settlement)', String(e).slice(0, 600)); await p.screenshot({ path: `.tmp/piaski-fail1-${view}.png` }); }
  await g.close();
}

if (want('2')) {
  const g = await startTable(true, 0, [0]);
  const p = g.page;
  try {
    await p.locator('[data-dev-panel]').waitFor({ timeout: 20000 });
    await p.getByRole('button', { name: /wybuduj wszystko/i }).first().click().catch(() => console.log('no build-everything button'));
    await p.locator('[data-dev-fight="0"]').click();
    await p.getByRole('button', { name: /Gotowe/ }).waitFor({ timeout: 10000 });
    await p.waitForTimeout(800);
    console.log('deploy: mirage badges seen by the owner:', await mirageBadges(p), '| hint:', (await p.locator('.screen').innerText()).match(/Kliknij jednostkę[^\n]*|Iskra[^\n]*/)?.[0]);
    await p.screenshot({ path: `.tmp/piaski-ustawianie-${view}.png` });
    await p.getByRole('button', { name: /Gotowe/ }).click();
    await p.waitForTimeout(1500);
    // the Spark (built by "wybuduj wszystko"): one more deploy step
    if (await p.getByText(/Iskra: przestaw/).count()) {
      console.log('spark rearrange step shown');
      await p.screenshot({ path: `.tmp/piaski-iskra-${view}.png` });
      await p.getByRole('button', { name: /Gotowe/ }).click();
      await p.waitForTimeout(1500);
    }
    console.log('fight: mirage badges seen by the owner:', await mirageBadges(p), '| swap button:', await p.locator('[data-mirage-swap]').count());
    await p.screenshot({ path: `.tmp/piaski-bitwa-${view}.png` });
    console.log('errors (fight)', g.errors.join('|') || 'none');
  } catch (e) { console.log('FAIL (fight)', String(e).slice(0, 800)); await p.screenshot({ path: `.tmp/piaski-fail2-${view}.png` }); }
  await g.close();
}

if (want('3')) {
  const g = await startTable(false, 1, []);
  const p = g.page;
  try {
    let found = false;
    let badges = 0;
    for (let i = 0; i < 60 && !found; i++) {
      await p.waitForTimeout(2000);
      found = (await p.locator('.arena-frame').count()) > 0 && (await p.getByText(/Dżin Wezyr|Sfinks Strażnik|Królowa Skorpionów|Szakalogłowy Strażnik|Mangusta Faraona|Łucznik Wydm/).count()) > 0;
      if (found) badges = await mirageBadges(p);
    }
    console.log('battle with the Empire seen:', found, '| mirage badges on the screen of an onlooker:', badges);
    await p.screenshot({ path: `.tmp/piaski-boty-${view}.png` });
    console.log('errors (bots)', g.errors.join('|') || 'none');
  } catch (e) { console.log('FAIL (bots)', String(e).slice(0, 600)); await p.screenshot({ path: `.tmp/piaski-fail3-${view}.png` }); }
  await g.close();
}

if (want('4')) {
  const g = await startTable(true, 0, [0, 1]);
  const p = g.page;
  try {
    await p.locator('[data-dev-panel]').waitFor({ timeout: 20000 });
    await p.getByRole('button', { name: /wybuduj wszystko/i }).first().click().catch(() => {});
    await p.locator('[data-dev-fight="0"]').click();
    await p.getByText('mirażów i zakopanej Królowej').waitFor({ timeout: 10000 });
    console.log('veil shown');
    await p.screenshot({ path: `.tmp/piaski-zaslona-${view}.png` });
    await p.getByRole('button', { name: /pokaż turę/ }).click();
    await p.getByRole('button', { name: /Gotowe/ }).click({ timeout: 10000 });
    await p.waitForTimeout(1500);
    if (await p.getByText(/mirażów i zakopanej Królowej/).count()) await p.getByRole('button', { name: /pokaż turę/ }).click();
    if (await p.getByText(/Iskra: przestaw/).count()) await p.getByRole('button', { name: /Gotowe/ }).click();
    await p.waitForTimeout(1500);
    console.log('own mirage badges before peeking:', await mirageBadges(p), '| peek button:', await p.locator('[data-peek-mirages]').count());
    await p.locator('[data-peek-mirages]').click({ timeout: 3000 }).catch(() => console.log('no peek button now (not the Empire\'s turn)'));
    await p.waitForTimeout(500);
    console.log('own mirage badges after peeking:', await mirageBadges(p));
    await p.screenshot({ path: `.tmp/piaski-podejrzyj-${view}.png` });
    console.log('errors (veil)', g.errors.join('|') || 'none');
  } catch (e) { console.log('FAIL (veil)', String(e).slice(0, 800)); await p.screenshot({ path: `.tmp/piaski-fail4-${view}.png` }); }
  await g.close();
}
process.exit(0);
