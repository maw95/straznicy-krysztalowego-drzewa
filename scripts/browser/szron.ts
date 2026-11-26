// Click check of a rivalry table with the Court of Everfrost: the setup screen offers the faction, a seat takes it, the developer panel builds everything, the buildings of the
// Court (Pałac Szronu, Kryształowa Grota, Wieża Zamieci) open in the settlement window with their texts; then a second game of bots is watched until a battle with a unit of the
// Court shows on the arena (frost on units, the status badge) -> .tmp/szron*.png.
// Usage: npx tsx scripts/browser/szron.ts [widok]   (desktop by default, `telefon` for the phone layout)
import { openGame, type View } from './game';
const view = (process.argv[2] ?? 'desktop') as View;

/** Walks the wizard to the players page of a rivalry on the level that has the settlements (Imperium) and picks the Court for the seat `court`. */
async function startTable(dev: boolean, court: number, humans: number[]) {
  const g = await openGame(dev ? 'dev=1&allFactions=1' : 'allFactions=1', { view, scale: 1 });
  const p = g.page;
  const card = (t: string) => p.locator('.opt-card', { hasText: t }).first();
  await card('Nowa gra').click();
  await card('Rywalizacja').click();
  await card('Ten komputer').click();
  await p.locator('[data-wizard-page="tier"]').waitFor();
  const nextIfAny = async () => { await p.waitForTimeout(500); const n = p.locator('[data-wizard-next]'); if (await n.count()) await n.click().catch(() => {}); await p.waitForTimeout(300); };
  await card('Imperium').click(); await nextIfAny();
  await card('Punkty kontrolne').click();
  await p.locator('[data-wizard-page="map"]').waitFor();
  await p.locator('[data-shape="rectangle"]').click(); await p.waitForTimeout(500);
  for (let i = 0; i < 4 && !(await p.locator('[data-wizard-page="players"]').count()); i++) await nextIfAny();
  await p.locator('[data-wizard-next]').click();
  const sel = p.locator('[data-seat-factions]');
  await sel.first().waitFor({ timeout: 5000 });
  console.log('faction options', await sel.first().locator('[data-faction]').evaluateAll((b) => b.map((x) => x.getAttribute('aria-label')?.replace('Frakcja: ', '') ?? '')));
  await sel.nth(court).locator('[data-faction="frost"]').click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: `.tmp/szron-setup-${view}.png` });
  for (const i of [0, 1]) await p.locator('select[aria-label="Kto gra"]').nth(i).selectOption(humans.includes(i) ? 'human' : 'bot').catch(() => {});
  await p.getByRole('button', { name: 'Rozpocznij grę' }).click();
  return g;
}

// Part 1: the settlement window.
const g1 = await startTable(true, 0, [0]);
const p1 = g1.page;
try {
  await p1.locator('[data-dev-panel]').waitFor({ timeout: 20000 });
  await p1.locator('[data-dev-scene="settlement"]').click();
  await p1.locator('[data-enter-settlement]').click();
  // The three buildings stand in the town view (Escape would leave the settlement, so only the Pałac Szronu is opened and read).
  for (const id of ['frostPalace', 'crystalGrotto', 'blizzardTower']) console.log(id, 'in the town:', await p1.locator(`[data-building="${id}"]`).getAttribute('aria-label'));
  await p1.locator('[data-building="frostPalace"]').click();
  await p1.waitForTimeout(400);
  console.log('palace text found:', (await p1.locator('body').innerText()).includes('Szron'));
  await p1.screenshot({ path: `.tmp/szron-palac-${view}.png` });
  console.log('errors (settlement)', g1.errors.join('|') || 'none');
} catch (e) { console.log('FAIL (settlement)', String(e).slice(0, 600)); await p1.screenshot({ path: `.tmp/szron-fail-${view}.png` }); }
await g1.close();

// Part 2: bots play until a battle with a unit of the Court is on the screen.
const g2 = await startTable(false, 1, []);
const p2 = g2.page;
try {
  let found = false;
  for (let i = 0; i < 60 && !found; i++) {
    await p2.waitForTimeout(2000);
    found = (await p2.locator('.arena-frame').count()) > 0 && (await p2.getByText(/Marzanna|Jarl Szronu|Ryś Śnieżny|Chochlik Szronu|Gronostaj Dworski|Szronowy Paź/).count()) > 0;
  }
  console.log('battle with the Court seen:', found);
  await p2.screenshot({ path: `.tmp/szron-bitwa-${view}.png` });
  console.log('errors (battle)', g2.errors.join('|') || 'none');
} catch (e) { console.log('FAIL (battle)', String(e).slice(0, 600)); await p2.screenshot({ path: `.tmp/szron-fail2-${view}.png` }); }
await g2.close();
