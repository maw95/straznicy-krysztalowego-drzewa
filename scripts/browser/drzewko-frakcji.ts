// The tree of buildings of a faction through the harness page -> .tmp/drzewko-<faction>.png. Usage: npx tsx scripts/browser/drzewko-frakcji.ts [dawn|horde]
import { chromium } from 'playwright';
import { createServer } from 'vite';

const f = process.argv[2] ?? 'horde';
const vite = await createServer({ server: { port: 5181, strictPort: true }, logLevel: 'error' });
await vite.listen();
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 880 }, deviceScaleFactor: Number(process.env.SCALE ?? 1) });
  page.on('pageerror', (e) => console.log('page error:', String(e).slice(0, 300)));
  await page.goto(`http://localhost:5181/scripts/browser/harness/drzewko.html?f=${f}`);
  await page.locator('[data-building-tree]').waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  console.log(await page.locator('[data-tree-node]').evaluateAll((els) => els.map((e) => e.getAttribute('data-tree-node')).join(' ')));
  await page.screenshot({ path: `.tmp/drzewko-${f}.png` });
} finally { await browser.close(); await vite.close(); }
