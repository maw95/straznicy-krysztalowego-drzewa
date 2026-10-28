// The A4 rulebook (docs/wersja_planszowa/instrukcja_szablon/index.html) as a print-ready PDF, plus a check that no
// page overflows its frame. Usage: npx tsx scripts/browser/instrukcja.ts [--pdf plik.pdf] [--zrzut 3,4,5]
//   --zrzut saves the listed pages side by side to .tmp/instrukcja.png (small) instead of printing.

import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const pages = flag('zrzut');
const pdf = flag('pdf') ?? 'docs/wersja_planszowa/do_druku/01_instrukcja_A4.pdf';
const url = `file://${resolve('docs/wersja_planszowa/instrukcja_szablon/index.html')}${pages ? `?show=${pages}` : ''}`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 }, deviceScaleFactor: pages ? Number(flag('skala') ?? 0.6) : 1 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const title = await page.title();
  console.log(title.startsWith('OK') ? 'Wszystkie strony mieszczą się w ramkach.' : `Przepełnione: ${title}`);
  if (pages) {
    await page.screenshot({ path: '.tmp/instrukcja.png', fullPage: true });
    console.log('.tmp/instrukcja.png');
  } else {
    mkdirSync(dirname(pdf), { recursive: true });
    await page.pdf({ path: pdf, format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
    console.log(pdf);
  }
} finally {
  await browser.close();
}
