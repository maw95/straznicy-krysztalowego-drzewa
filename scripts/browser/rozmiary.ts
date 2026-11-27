// The wizard's blocks (src/engine/blocks.ts, backlog 103), clicked through: Księstwo on the small ring map greys Artefakt (uneven for any table) and notes
// "od 2 graczy na stronę" on Podbój; Podbój with one player a side is held on the seats page until "Dodaj bota do każdej strony"; Przetrwanie on the small
// triangle is greyed. -> .tmp/blokady-*.png. Usage: npx tsx scripts/browser/rozmiary.ts [desktop|telefon]
import { openGame, type View } from './game';

const view = (process.argv[2] ?? 'desktop') as View;
const game = await openGame('', { view, scale: view === 'desktop' ? 0.7 : 1 });
const p = game.page;
const goals = async () => (await p.locator('[data-wizard-page="objective"] .opt-card').first().waitFor(), 
  p.locator('[data-wizard-page="objective"] .opt-card').evaluateAll((els) =>
    els.map((e) => `${e.querySelector('.opt-card-title')?.textContent}${(e as HTMLButtonElement).disabled ? ' (zablokowany)' : ''}${e.querySelector('[data-card-note]') ? ` [${e.querySelector('[data-card-note]')!.textContent}]` : ''}`).join(', '),
  ));
const toMap = async (shape: string) => {
  await p.locator('[data-new-game]').click();
  await p.locator('[data-mode="pvp"]').click();
  await p.locator('[data-wizard-page="where"] .opt-card').first().click();
  await p.locator('[data-wizard-page="tier"] .opt-card', { has: p.locator('.opt-card-title', { hasText: /^Księstwo$/ }) }).click();
  await p.locator(`[data-shape="${shape}"]`).click();
  await p.locator('[data-size="short"]').click();
  await p.locator('[data-wizard-next]').click();
};
try {
  await p.waitForTimeout(800);
  await toMap('ring');
  console.log('mała, pierścień:', await goals());
  await p.screenshot({ path: `.tmp/blokady-${view}-cele.png` });
  await p.locator('[data-wizard-page="objective"] .opt-card', { hasText: 'Podbój' }).click();
  await p.locator('[data-wizard-next]').click().catch(() => undefined);
  await p.locator('[data-table-block]').waitFor();
  console.log('seats:', await p.locator('[data-table-block]').getAttribute('data-table-block'), '|', (await p.locator('[data-table-block]').innerText()).replace(/\n/g, ' | '));
  console.log('start enabled:', await p.getByRole('button', { name: 'Rozpocznij grę' }).isEnabled());
  await p.locator('[data-table-block]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `.tmp/blokady-${view}-miejsca.png` });
  await p.locator('[data-fill-sides]').click();
  await p.waitForTimeout(400);
  console.log('after the bots: alert', await p.locator('[data-table-block]').count(), '| start enabled:', await p.getByRole('button', { name: 'Rozpocznij grę' }).isEnabled());
  await p.screenshot({ path: `.tmp/blokady-${view}-po.png` });
  await p.reload();
  await p.waitForTimeout(800);
  await toMap('triangle');
  console.log('mała, trójkąt:', await goals());
  console.log('errors', game.errors);
} finally {
  await game.close();
}
