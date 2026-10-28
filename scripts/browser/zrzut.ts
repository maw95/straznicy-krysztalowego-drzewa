// A screenshot of the game, small by default (half the pixels each way on the desktop), optionally of one element only.
// Usage: npx tsx scripts/browser/zrzut.ts [query] [--widok desktop|telefon|poziomo] [--element CSS]
//        [--skala 1] [--czekaj ms] [--plik ścieżka]   (or: make zrzut Q='steps=400&until=battle&mode=pvp&seed=3')
// Prints the file path and any page errors.

import { clearDialogs, openGame, type View } from './game';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const view = (flag('widok') ?? 'desktop') as View;
const element = flag('element');
const scaleArg = flag('skala');
const scale = scaleArg ? Number(scaleArg) : undefined;
const wait = Number(flag('czekaj') ?? 4000);
const file = flag('plik') ?? `.tmp/zrzut-${view}.png`;
const query = args[0] ?? '';

const game = await openGame(query, { view, scale });
try {
  await game.page.waitForTimeout(wait);
  await clearDialogs(game.page);
  await game.page.waitForTimeout(800);
  if (element) await game.page.locator(element).first().screenshot({ path: file });
  else await game.page.screenshot({ path: file });
  console.log(file);
  if (game.errors.length) console.log('Błędy na stronie:\n' + game.errors.join('\n'));
} finally {
  await game.close();
}
