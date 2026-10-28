// Cards for print: every unit card (also the three guardian duel cards) and every treasure card rendered by the
// game itself, large, on a transparent background -> .tmp/druk/karty/<id>.png (scripts/assets/druk.py lays them out).
// Usage: npx tsx scripts/browser/karty.ts   (or: make druk)

import { mkdirSync } from 'node:fs';
import { ITEMS, UNITS } from '../../src/engine/data';
import { openGame } from './game';

const OUT = '.tmp/druk/karty';
/** CSS width of a rendered card: unit cards print at 80 mm, treasure cards at 63 mm, both at about 350 dpi. */
const WIDTH = { unit: 1100, treasure: 880 };

mkdirSync(OUT, { recursive: true });
const cards = [
  ...Object.keys(UNITS).map((id) => ({ id, query: id, width: WIDTH.unit })),
  ...Object.keys(UNITS).filter((id) => UNITS[id].duel).map((id) => ({ id: `${id}_pojedynek`, query: `${id}:duel`, width: WIDTH.unit })),
  ...Object.keys(ITEMS).map((id) => ({ id, query: id, width: WIDTH.treasure })),
];
const game = await openGame('cards=goldDragon&w=200', { scale: 1 });
try {
  for (const c of cards) {
    await game.page.goto(`http://localhost:5180/?cards=${c.query}&w=${c.width}`);
    const card = game.page.locator('.card-sheen').first();
    await card.waitFor();
    await game.page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
    await game.page.evaluate(() => document.fonts.ready);
    await game.page.waitForTimeout(300);
    // The card's own drop shadow is a CSS filter: switched off, so the picture ends at the card's edge.
    await card.evaluate((el) => ((el as HTMLElement).style.filter = 'none'));
    await card.screenshot({ path: `${OUT}/${c.id}.png`, omitBackground: true });
    console.log(c.id);
  }
  if (game.errors.length) console.log('Błędy na stronie:\n' + game.errors.join('\n'));
} finally {
  await game.close();
}
