// The slate panels in the colour of the faction at the screen (62a): a hot-seat game, the colour after the first hand-over. Usage: npx tsx scripts/browser/slate-frakcji.ts
import { openGame } from './game';

for (const id of ['pvp']) {
  const game = await openGame(`steps=0&seed=3&size=medium&players=1&mode=pvp&reveal=1`, { scale: 0.5 });
  try {
    const p = game.page;
    await p.waitForTimeout(1500);
    console.log(id, await p.evaluate(() => document.documentElement.style.getPropertyValue('--slate-img')));
    await p.getByRole('button', { name: /Jestem Ala/ }).click();
    await p.getByRole('button', { name: /Zakończ turę/ }).first().click();
    await p.getByRole('button', { name: 'Zakończ turę', exact: true }).last().click();
    await p.waitForTimeout(1500);
    console.log('after the turn:', await p.evaluate(() => document.documentElement.style.getPropertyValue('--slate-img')));
    await p.screenshot({ path: `.tmp/slate-${id}.png` });
  } finally {
    await game.close();
  }
}
