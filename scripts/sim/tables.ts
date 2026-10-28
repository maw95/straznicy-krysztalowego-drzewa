// Readable tables from a matrix run (.tmp/sim/<label>.json, written by matrix.ts):
// Przymierze's win rate per mode, map and level, and how Przymierze lost.
// Usage: npx tsx scripts/sim/tables.ts [label = tabele]   (make sim-tabele runs the simulations first)

import { readFileSync } from 'node:fs';
import type { Summary } from './core';

const label = process.argv[2] ?? 'tabele';
const rows = JSON.parse(readFileSync(`.tmp/sim/${label}.json`, 'utf8')) as Summary[];
const by = new Map(rows.map((s) => [s.variant, s]));

const MAPS: Array<[string, string]> = [['short', 'Krótka'], ['medium', 'Średnia'], ['long', 'Długa'], ['veryLong', 'Bardzo długa']];
const LEVELS: Array<[string, string]> = [['kids', 'Łatwy'], ['full', 'Normalny'], ['hard', 'Trudny']];
const TABLES: Array<[string, string]> = [['coop1', 'Kooperacja — 1 gracz'], ['coop2', 'Kooperacja — 2 graczy'], ['pvp1', 'Rywalizacja — 1 na 1'], ['pvp2', 'Rywalizacja — 2 na 2']];
/** How a game ended, by the engine's end reason. */
const ENDS: Array<[string, (reason: string) => boolean]> = [
  ['wybici', (r) => r.includes('Przymierza polegli')],
  ['rytuał', (r) => r.includes('rytuał')],
  ['limit rund', (r) => r.includes('limit rund')],
];

const pct = (x: number) => `${(100 * x).toFixed(0)}%`;

/** A box-drawn table; the first `left` columns are left-aligned, the rest right-aligned. */
function table(head: string[], body: string[][], left = 1) {
  const w = head.map((h, i) => Math.max(h.length, ...body.map((r) => r[i].length)));
  const line = (l: string, m: string, r: string) => l + w.map((x) => '─'.repeat(x + 2)).join(m) + r;
  const row = (cells: string[]) => '│' + cells.map((c, i) => ` ${i < left ? c.padEnd(w[i]) : c.padStart(w[i])} `).join('│') + '│';
  console.log([line('┌', '┬', '┐'), row(head), line('├', '┼', '┤'), ...body.map(row), line('└', '┴', '┘')].join('\n'));
}

const games = rows[0]?.games ?? 0;
console.log(`\nWygrane Przymierza Świtu — ${games} partii botów na wariant (${label})`);
console.log('W rywalizacji Horda wygrywa resztę partii; trudność dla Hordy to odwrotność tych liczb.\n');
for (const [t, title] of TABLES) {
  const levels = LEVELS.filter(([lv]) => by.has(`short·${t}·${lv}`));
  console.log(title);
  table(['Mapa', ...levels.map(([, n]) => n)], MAPS.map(([m, name]) => [name, ...levels.map(([lv]) => { const s = by.get(`${m}·${t}·${lv}`)!; return pct(s.dawnWins / s.games); })]));
  console.log('');
}

console.log('Jak kończą się partie — wygrane Przymierza i trzy sposoby, w jakie przegrywa (razem 100%)');
console.log('wybici = polegli wszyscy bohaterowie Przymierza · rytuał = Horda odprawiła rytuał · limit rund = zabrakło czasu\n');
for (const [t, title] of TABLES) {
  const levels = LEVELS.filter(([lv]) => by.has(`short·${t}·${lv}`));
  console.log(title);
  const body = levels.flatMap(([lv, level]) =>
    MAPS.map(([m, name]) => {
      const s = by.get(`${m}·${t}·${lv}`)!;
      const share = (match: (r: string) => boolean) => pct(Object.entries(s.reasons).filter(([r]) => match(r)).reduce((a, [, n]) => a + n, 0) / s.games);
      return [level, name, pct(s.dawnWins / s.games), ...ENDS.map(([, match]) => share(match)), s.avgRounds.toFixed(1)];
    }),
  );
  table(['Poziom', 'Mapa', 'Wygrane', 'Wybici', 'Rytuał', 'Limit rund', 'Śr. rund'], body.map((r, i) => (i % MAPS.length ? ['', ...r.slice(1)] : r)), 2);
  console.log('');
}
