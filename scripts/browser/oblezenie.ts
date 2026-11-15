// Click check of a siege (level 4): the player storms a walled settlement, shoots the catapult at the gate twice (two rounds) and the gate falls.
// Screenshots -> .tmp/oblezenie.png (the start) and .tmp/oblezenie2.png (after the shots). Usage: npx tsx scripts/browser/oblezenie.ts
import { openGame } from './game';

const game = await openGame('steps=0&seed=3&size=medium&economy=1&mode=pvp&siege=2&garrison=2', { scale: 1 });
try {
  const p = game.page;
  // The supports for the battle first: the first two cards, then "Do bitwy!".
  const go = p.getByRole('button', { name: 'Do bitwy!' });
  await go.waitFor({ timeout: 15000 });
  const cards = go.locator('xpath=preceding-sibling::div[1]/button');
  await cards.nth(0).click();
  await cards.nth(1).click();
  await go.click();
  await p.locator('[data-siege="mur"]').first().waitFor({ timeout: 15000 });
  const count = async (art: string) => p.locator(`[data-siege="${art}"]`).count();
  console.log('walls', await count('mur'), 'gate', await count('brama'), 'towers', await count('wieza'), 'moat', await count('fosa'));
  // Deployment first, when the game asks for it.
  for (let i = 0; i < 6; i++) {
    const ready = p.getByRole('button', { name: /Gotowe|Zatwierdź|Rozpocznij/ });
    if (await ready.count()) { await ready.first().click(); await p.waitForTimeout(600); } else break;
  }
  await p.waitForTimeout(1500);
  await p.locator('.arena-frame').screenshot({ path: '.tmp/oblezenie.png' });
  for (let shot = 0; shot < 2; shot++) {
    // Wait for the player's activation of the next round (the catapult shoots once a round), ending the activations in between.
    const end = p.getByRole('button', { name: 'Koniec', exact: true });
    for (let i = 0; i < 60 && !(await p.locator('[data-catapult]').count()); i++) {
      if ((await end.count()) && (await end.first().isEnabled())) await end.first().click().catch(() => undefined);
      await p.waitForTimeout(1200);
    }
    const all = p.locator('[data-catapult]');
    const titles = await all.evaluateAll((els) => els.map((e) => e.textContent ?? ''));
    const gate = titles.findIndex((t) => t.includes('brama'));
    console.log('targets', titles.length, 'gate:', titles[gate]);
    if (gate < 0) {
      await p.screenshot({ path: '.tmp/oblezenie-stan.png' });
      console.log('buttons:', (await p.getByRole('button').allInnerTexts()).filter(Boolean).join(' | ').slice(0, 400));
      break;
    }
    await all.nth(gate).click({ force: true });
    await p.waitForTimeout(600);
    console.log('targets after the shot', await p.locator('[data-catapult]').count(), 'gate standing', await count('brama'));
  }
  await p.locator('.arena-frame').screenshot({ path: '.tmp/oblezenie2.png' });
  console.log('rubble', await count('gruz'));
  if (game.errors.length) console.log(game.errors.join('\n'));
} finally {
  await game.close();
}
