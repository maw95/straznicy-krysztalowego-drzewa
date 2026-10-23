// Reads the files testers send ("INFO DLA TESTERÓW" → "Pobierz plik dla twórcy") and prints their
// feedback, live-player win rates per variant and bug reports. Each bug report is also written to
// bug-reports/ as a replayable save, so scripts/report.ts can show the exact moment.
// Usage: npx tsx scripts/testers.ts [file.json ...]   (default: every file in tester-reports/)

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MAP_SIZE_NAMES } from '../src/engine/data';
import { LEVEL_NAMES, type TesterExport } from '../src/ui/journal';

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : existsSync('tester-reports')
    ? readdirSync('tester-reports').filter((f) => f.endsWith('.json')).sort().map((f) => join('tester-reports', f))
    : [];
if (!files.length) {
  console.log('Brak plików. Wrzuć pliki od testerów do folderu tester-reports/ albo podaj je w wywołaniu.');
  process.exit(0);
}

const variants = new Map<string, { games: number; dawn: number }>();
let reportCount = 0;
mkdirSync('bug-reports', { recursive: true });

for (const file of files) {
  const data = JSON.parse(readFileSync(file, 'utf8')) as TesterExport;
  if (data.kind !== 'skd-tester-export') {
    console.log(`\n${file}: to nie jest plik testera, pomijam.`);
    continue;
  }
  const s = data.stats;
  console.log(`\n=== ${data.name || '(bez imienia)'} · ${file} · wysłano ${data.exportedAt.slice(0, 16).replace('T', ' ')}`);
  // Files sent to the game server may come from older or hand-made exports: the statistics are optional.
  if (s?.coop && s.pvp) console.log(`partie: ${s.played} (ukończone ${s.finished}) · koop ${s.coop.won}/${s.coop.lost} · PvP Przymierze ${s.pvp.dawn}, Horda ${s.pvp.horde} · błędy: ${s.reports}`);
  if (data.feedback) console.log(`uwagi:\n  ${data.feedback.split('\n').join('\n  ')}`);
  for (const g of data.games ?? []) {
    const setup = g.save.setup;
    if (g.result) {
      const players = setup.seats.filter((x) => x.faction === 'dawn').length;
      const key = `${setup.mode === 'coop' ? `koop ${players} gr.` : `PvP ${players} na ${setup.seats.length - players}`} · ${MAP_SIZE_NAMES[setup.mapSize]} · ${LEVEL_NAMES[g.level]}`;
      const v = variants.get(key) ?? { games: 0, dawn: 0 };
      v.games++;
      if (g.result.winner === 'dawn') v.dawn++;
      variants.set(key, v);
    }
    for (const r of g.save.reports ?? []) {
      reportCount++;
      const name = `${r.createdAt.slice(0, 19).replace(/[:T]/g, '-')}-${(data.name || data.testerId).replace(/[^\p{L}\p{N}]+/gu, '_')}.json`;
      // The actions up to the report replay the moment it was written.
      writeFileSync(join('bug-reports', name), JSON.stringify({ setup, actions: g.save.actions.slice(0, r.actionIndex), reports: [r] }, null, 1));
      console.log(`  błąd (runda ${r.round}, ${r.screen}): ${r.text}  → bug-reports/${name}`);
    }
  }
}

console.log('\n=== Wygrane Przymierza w partiach testerów');
for (const [k, v] of [...variants].sort()) console.log(`${k.padEnd(44)} ${String(v.dawn).padStart(3)}/${String(v.games).padEnd(3)} (${Math.round((v.dawn / v.games) * 100)}%)`);
console.log(`\nZgłoszeń błędów: ${reportCount}. Szczegóły: npx tsx scripts/report.ts`);
