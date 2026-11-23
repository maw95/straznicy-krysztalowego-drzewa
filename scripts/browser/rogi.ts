// Corner sapphires in the colour of the faction at the screen (hot-seat Przymierze, then Horda). Usage: npx tsx scripts/browser/rogi.ts
import { openGame } from './game';

const game = await openGame('steps=0&seed=3&size=medium&players=1&mode=pvp', { scale: 2 });
try {
  const p = game.page;
  await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /Jestem Ala/ }).click();
  await p.waitForTimeout(500);
  const clip = { x: 0, y: 0, width: 260, height: 160 };
  await p.screenshot({ path: '.tmp/rog-dawn.png', clip });
  await p.getByRole('button', { name: /Zakończ turę/ }).first().click();
  await p.getByRole('button', { name: 'Zakończ turę', exact: true }).last().click();
  await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /Jestem/ }).click().catch(() => undefined);
  await p.waitForTimeout(1200);
  console.log(await p.evaluate(() => document.documentElement.dataset.faction));
  await p.screenshot({ path: '.tmp/rog-horde.png', clip });
} finally {
  await game.close();
}
