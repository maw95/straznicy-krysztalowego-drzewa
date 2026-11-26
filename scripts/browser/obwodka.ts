// The active unit in battle has a thin outline round its whole silhouette (backlog 100). -> .tmp/obwodka-*.png
// Usage: npx tsx scripts/browser/obwodka.ts
import { openGame } from './game';

const game = await openGame('steps=400&until=battle&mode=pvp&seed=3', { view: 'desktop', scale: 1 });
const p = game.page;
try {
  await p.waitForTimeout(5000);
  // Deploying: the picked unit has the outline; then the fight, where the unit whose turn it is has it.
  const start = p.getByRole('button', { name: /Rozpocznij bitwę|Gotowe|Do boju/ }).first();
  await p.locator('.arena-frame').screenshot({ path: '.tmp/obwodka-rozstawienie.png' });
  if (await start.count()) await start.click().catch(() => undefined);
  await p.waitForTimeout(2500);
  await p.locator('.arena-frame').screenshot({ path: '.tmp/obwodka-walka.png' });
  const box = await p.locator('[data-unit]').first().boundingBox();
  console.log('units:', await p.locator('[data-unit]').count(), 'first unit box:', box && Math.round(box.x), box && Math.round(box.y));
  console.log('errors', game.errors);
} finally {
  await game.close();
}
