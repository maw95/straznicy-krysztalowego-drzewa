// Looks of the mechanics' effects (BACKLOG 81) on a real arena: every effect is put on the board with its animation frozen on one frame -> .tmp/efekty-wyglad-<seed>.png.
// Usage: npx tsx scripts/browser/efekty-mechanik-wyglad.ts [races=herds,tides] [seed=3] [frame=0.3]
import { openGame } from './game';
const races = process.argv[2] ?? 'herds,tides';
const seed = process.argv[3] ?? '3';
const frame = Number(process.argv[4] ?? 0.3);
const g = await openGame(`steps=600&until=battle&mode=pvp&races=${races}&seed=${seed}&size=medium&objective=artifact`, { scale: 1 });
try {
  const p = g.page;
  await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /^Jestem G/ }).first().click().catch(() => undefined);
  await p.waitForTimeout(800);
  const kinds = ['herds_push', 'herds_collision', 'herds_charge', 'herds_roar', 'tides_wave', 'tides_pearl', 'tides_shell', 'tides_waterwall', 'tides_whirl', 'clans_rune', 'tides_rope'];
  await p.evaluate(({ kinds, frame }) => {
    const polys = [...document.querySelectorAll('polygon[data-cell]')] as SVGPolygonElement[];
    const host = (document.querySelector('.arena-frame svg') as SVGElement).parentElement!;
    kinds.forEach((k, i) => {
      const poly = polys[40 + i * 7];
      const r = poly.getBoundingClientRect(), hr = host.getBoundingClientRect();
      const el = document.createElement('span');
      el.className = `fx-sheet fx-battle ${k}`;
      el.setAttribute('data-test-fx', k);
      el.style.cssText = `left:${r.x - hr.x + r.width / 2}px;top:${r.y - hr.y + r.height / 2}px;animation:none;background-position:${frame * 100}% 0;`;
      if (k === 'tides_rope') { el.style.width = '300px'; el.style.transform = 'rotate(-0.4rad)'; }
      host.appendChild(el);
    });
  }, { kinds, frame });
  await p.waitForTimeout(600);
  await p.locator('.arena-frame').screenshot({ path: `.tmp/efekty-wyglad-${seed}.png` });
  console.log('placed', await p.locator('[data-test-fx]').count(), g.errors.slice(0, 2));
} finally {
  await g.close();
}
