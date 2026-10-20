// Short view of a matrix result: Dawn win rate per variant as a grid, plus how many are in band.
// Usage: npx tsx scripts/sim/brief.ts <label> [low=0.45] [high=0.55]
import { readFileSync } from 'node:fs';
import type { Summary } from './core';
const [label, lo = '0.45', hi = '0.55'] = process.argv.slice(2);
const rows = JSON.parse(readFileSync(`.tmp/sim/${label}.json`, 'utf8')) as Summary[];
const grid: Record<string, Record<string, string>> = {};
let inBand = 0;
for (const r of rows) {
  const [size, table, option] = r.variant.split('·');
  const p = r.dawnWins / r.games;
  if (p >= Number(lo) && p <= Number(hi)) inBand++;
  (grid[`${size}·${table}`] ??= {})[option] = `${(p * 100).toFixed(0)}${p < Number(lo) ? '-' : p > Number(hi) ? '+' : ' '}`;
}
const opts = ['full', 'noabilities', 'notreasures', 'nodice', 'replacement', 'board', 'extraevil'];
console.log(''.padEnd(14) + opts.map((o) => o.slice(0, 8).padStart(9)).join(''));
for (const [k, v] of Object.entries(grid)) console.log(k.padEnd(14) + opts.map((o) => (v[o] ?? '').padStart(9)).join(''));
const ps = rows.map((r) => r.dawnWins / r.games);
console.log(`w przedziale ${lo}–${hi}: ${inBand}/${rows.length} · min ${(Math.min(...ps) * 100).toFixed(1)} · max ${(Math.max(...ps) * 100).toFixed(1)} · średnio ${((ps.reduce((a, b) => a + b, 0) / ps.length) * 100).toFixed(1)}`);
