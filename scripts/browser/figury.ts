// Pictures of the 3D figures for the rulebook, rendered by the game's own three.js scene (FigurePreview) in a
// headless browser, on a transparent background:
//   docs/wersja_planszowa/instrukcja_szablon/assets/figurki/<unit>.png  — one figure, cropped to it (the HTML rulebook);
//   docs/wersja_planszowa/instrukcja_szablon/assets/figurki/<faction>.png — the faction's heroes, larger, above its helpers (the .docx).
// Run after `make modele`. Usage: npx tsx scripts/browser/figury.ts   (or: make figurki)

import { writeFileSync } from 'node:fs';
import { openGame } from './game';

const OUT = 'docs/wersja_planszowa/instrukcja_szablon/assets/figurki';
/** Rendered square size; the crop keeps the figure only. */
const SIZE = 900;
/** A three-quarter view: the figure turned a little to the viewer's left. */
const TURN = -0.5;
const FACTIONS = {
  przymierze: ['goldDragon', 'unicornKing', 'ancientBear', 'elfDruid', 'nymph', 'pegasus'],
  horda: ['blackDragon', 'werewolfLord', 'ironFistOgre', 'goblinShaman', 'caveSpider', 'shadowBat'],
  straznicy: ['cyclops', 'griffin', 'hydra'],
};

const game = await openGame('', { scale: 1 });
try {
  // tsx keeps function names with a __name() helper that the page does not have.
  await game.page.addScriptTag({ content: 'window.__name = (f) => f;' });
  const pictures = await game.page.evaluate(
    async ({ factions, size, turn }) => {
      // The module as the page's Vite server serves it (a path in the page, not in this script).
      const preview = '/src/ui/FigurePreview.tsx';
      const { figureStill } = (await import(/* @vite-ignore */ preview)) as typeof import('../../src/ui/FigurePreview');
      const image = (src: string) => new Promise<HTMLImageElement>((ok) => Object.assign(new Image(), { src, onload(this: HTMLImageElement) { ok(this); } }));
      /** The figure alone: the picture cropped to its opaque pixels, with a small margin. */
      const crop = (img: HTMLImageElement) => {
        const c = Object.assign(document.createElement('canvas'), { width: img.width, height: img.height });
        const g = c.getContext('2d')!;
        g.drawImage(img, 0, 0);
        const a = g.getImageData(0, 0, c.width, c.height).data;
        let [x0, y0, x1, y1] = [c.width, c.height, 0, 0];
        for (let y = 0; y < c.height; y++)
          for (let x = 0; x < c.width; x++)
            if (a[(y * c.width + x) * 4 + 3] > 8) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
        const m = 6;
        [x0, y0, x1, y1] = [Math.max(0, x0 - m), Math.max(0, y0 - m), Math.min(c.width - 1, x1 + m), Math.min(c.height - 1, y1 + m)];
        const out = Object.assign(document.createElement('canvas'), { width: x1 - x0 + 1, height: y1 - y0 + 1 });
        out.getContext('2d')!.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
        return out;
      };
      const files: Record<string, string> = {};
      for (const [faction, units] of Object.entries(factions)) {
        const cut: HTMLCanvasElement[] = [];
        for (const id of units) {
          const c = crop(await image(await figureStill(id, turn, size)));
          files[id] = c.toDataURL('image/png');
          cut.push(c);
        }
        // The set: figures in rows of three standing on a common line; the first row (the heroes) larger.
        const rows = Math.ceil(cut.length / 3);
        const cellW = 520, gap = 20;
        const rowH = rows > 1 ? [500, 360] : [480];
        const set = Object.assign(document.createElement('canvas'), { width: 3 * cellW + 2 * gap, height: rowH.reduce((a, b) => a + b, 0) + (rows - 1) * gap });
        const g = set.getContext('2d')!;
        cut.forEach((c, i) => {
          const row = Math.floor(i / 3);
          const k = Math.min(cellW / c.width, rowH[row] / c.height);
          const [w, h] = [c.width * k, c.height * k];
          const [cx, cy] = [(i % 3) * (cellW + gap), rowH.slice(0, row).reduce((a, b) => a + b + gap, 0)];
          g.drawImage(c, cx + (cellW - w) / 2, cy + rowH[row] - h, w, h);
        });
        files[faction] = set.toDataURL('image/png');
      }
      return files;
    },
    { factions: FACTIONS, size: SIZE, turn: TURN },
  );
  for (const [name, url] of Object.entries(pictures)) {
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`${OUT}/${name}.png`);
  }
  if (game.errors.length) console.log('Błędy na stronie:\n' + game.errors.join('\n'));
} finally {
  await game.close();
}
