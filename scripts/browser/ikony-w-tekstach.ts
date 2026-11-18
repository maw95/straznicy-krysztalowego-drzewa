// Finds texts on screen that still write gold, resources or stats as words ("3 zł", "2 drewna", "+1 A") instead of icons.
// Scans the manual, the Rules tabs and a settlement window; with `walka` the journal and the battle screen instead.
// Usage: npx tsx scripts/browser/ikony-w-tekstach.ts [pl|en] [walka]
import { openGame } from './game';

const lang = process.argv[2] ?? 'pl';
const WORDS = String.raw`(?:^|[^\p{L}\d])[+−-]?\d+ ?[×x]? ?(?:zł|złot[ao]|drewn\p{L}*|rud(?:a|y|ę|ą)?|[Pp]ył\p{L}*|gold|wood|ore|Dust|Star Dust)(?![\p{L}\d])|[+−-]?\d+ (?:Ż|A|S|HP|ATK|SPD)(?![\p{L}\d])|(?:Życie|Atak|Szybkość|Life|Attack|Speed) \d`;

const battleOnly = process.argv[3] === 'walka';
const game = await openGame(battleOnly ? `steps=400&until=battle&mode=pvp&seed=3&kingdom=1&economy=1&realm=1&lang=${lang}` : `steps=0&seed=3&size=long&kingdom=1&gold=40&players=1&lang=${lang}`, { scale: 1 });
const found: string[] = [];
async function scan(label: string, selector: string) {
  const hits = await game.page.evaluate(({ selector, WORDS }) => {
    const re = new RegExp(WORDS, 'u');
    const root = document.querySelector(selector) ?? document.body;
    const out: string[] = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const el = (n as Text).parentElement;
      // The text of a node plus its neighbours in the same parent, so "3 " + "zł" split by markup is not missed.
      const t = (n as Text).data.replace(/\s+/g, ' ').trim();
      if (t && re.test(t) && !el?.closest('script,style')) out.push(t.slice(0, 110));
    }
    return out;
  }, { selector, WORDS });
  for (const h of hits) found.push(`[${label}] ${h}`);
}
try {
  const p = game.page;
  await p.waitForTimeout(1000);
  if (battleOnly) {
    await scan('battle', 'body');
    await p.locator('[data-open-log]').first().click().catch(() => p.keyboard.press('d'));
    await p.waitForTimeout(400);
    console.log('log lines:', await p.locator('.log-line').count());
    await scan('journal', 'body');
    console.log(found.length ? found.join('\n') : 'nothing left');
    process.exitCode = 0;
    await game.close();
    process.exit(0);
  }
  await p.getByRole('button', { name: /^(Zasady|Rules)$/ }).first().click();
  await p.waitForTimeout(400);
  await p.getByRole('button', { name: /^(Manual|Instrukcja)$/ }).first().click();
  await p.waitForTimeout(500);
  await scan('manual', '[data-manual]');
  for (const tab of [/^(Podstawowe zasady|Basic rules)$/, /^(Lokacje na mapie|Places on the map)$/, /^(Jednostki|Units)$/, /^(Artefakty|Artifacts)$/]) {
    const b = p.getByRole('button', { name: tab }).first();
    if (await b.count()) { await b.click(); await p.waitForTimeout(300); await scan(String(tab), 'body'); }
  }
  // The map, the settlement window (tree, details, every tab) and the log.
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  await scan('map', 'body');
  await p.locator('[data-enter-settlement]').click();
  await p.locator('[data-settlement]').waitFor();
  await scan('settlement', '[data-settlement]');
  await p.locator('[data-building="council"]').click();
  await p.waitForTimeout(300);
  await scan('council', '[data-settlement]');
  for (const n of await p.locator('[data-tree-node]').all()) {
    await n.click();
    await p.waitForTimeout(120);
    await scan('tree-node', '[data-settlement]');
  }
  for (const tab of await p.locator('[data-settlement] [role="tab"], [data-settlement] [data-tab]').all()) {
    await tab.click().catch(() => {});
    await p.waitForTimeout(150);
    await scan('tab', '[data-settlement]');
  }
  console.log(found.length ? found.join('\n') : 'nothing left');
  console.log(`${found.length} texts; page errors: ${game.errors.length}`);
} finally {
  await game.close();
}
