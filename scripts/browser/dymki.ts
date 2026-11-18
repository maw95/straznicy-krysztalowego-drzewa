// The hover bubbles that replace the browser's tooltips: hover over an element with a hint, a disabled button and the gold box; the native `title` must be gone
// and the bubble must show the text (also in English). Usage: npx tsx scripts/browser/dymki.ts [pl|en] [gold]; with gold 1 the build button is shut and explains why.
import { openGame } from './game';

const lang = process.argv[2] ?? 'pl';
const game = await openGame(`steps=0&seed=3&size=long&kingdom=1&economy=1&gold=${process.argv[3] ?? 40}&players=1&lang=${lang}`, { scale: 1 });
try {
  const p = game.page;
  await p.waitForTimeout(800);
  const probe = async (label: string, sel: string) => {
    const el = p.locator(sel).first();
    if (!(await el.count())) return console.log(label, 'NOT FOUND', sel);
    const box = (await el.boundingBox())!;
    await p.mouse.move(box.x + box.width / 2 - 3, box.y + box.height / 2);
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.waitForTimeout(900);
    const bubble = await p.locator('[data-title-bubble]').allInnerTexts();
    const native = await el.getAttribute('title');
    console.log(label, '| bubble:', JSON.stringify(bubble[0] ?? null), '| native title left:', native);
    await p.mouse.move(2, 2);
    await p.waitForTimeout(150);
    console.log(label, 'bubble gone after leaving:', (await p.locator('[data-title-bubble]').count()) === 0);
  };
  await probe('top bar', '.btn-bar');
  await probe('gold', '[data-gold-box]');
  await p.locator('[data-enter-settlement]').click();
  await p.locator('[data-settlement]').waitFor();
  await p.locator('[data-building="council"]').click();
  await p.locator('[data-tree-node="treasury"]').click().catch(() => undefined);
  await p.waitForTimeout(300);
  await probe('disabled build button (gold 1: "Za mało")', '[data-build]');
  if (game.errors.length) console.log(game.errors.join('\n'));
} finally { await game.close(); }
