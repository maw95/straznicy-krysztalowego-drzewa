// Close-up of the move cost markers on the map hexes (62b). Usage: npx tsx scripts/browser/znacznik-kosztu.ts [telefon]
import { openGame } from './game';

const view = (process.argv[2] === 'telefon' ? 'telefon' : 'desktop') as 'telefon' | 'desktop';
{
  const game = await openGame('steps=0&seed=3&size=medium&players=1', { scale: 1, view });
  try {
    const p = game.page;
    await p.waitForTimeout(1500);
    const m = p.locator('.plate.parch').filter({ hasText: /^[0-9]+$/ }).first();
    console.log('markers:', await p.locator('.plate.parch').filter({ hasText: /^[0-9]+$/ }).count());
    const b = await m.boundingBox();
    console.log('box', b);
    if (b) await p.screenshot({ path: `.tmp/znacznik-${view}.png`, clip: { x: Math.max(0, b.x - 60), y: Math.max(0, b.y - 60), width: 160, height: 140 } });
    if (game.errors.length) console.log(game.errors.join('\n'));
  } finally {
    await game.close();
  }
}
