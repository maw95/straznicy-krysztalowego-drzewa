// Runs every variant (map size × table × option) in parallel and prints a table.
// Usage: npx tsx scripts/sim/matrix.ts [games=300] [label] [filter]
//   filter: a regular expression on the variant name, e.g. "coop1", "short·pvp1" or "coop.·full".
// By default only the three difficulty levels (kids, normal = full, hard): 40 variants, about
// 2–3 minutes at 300 games. SIM_ALL=1 adds the test options (noabilities, dice, …).
// Results are also written to .tmp/sim/<label>.json for comparing iterations.

import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { OPTIONS, SIZES, TABLES, merge, variantName, type Summary, type Variant } from './core';

const games = Number(process.argv[2] ?? 300);
const label = process.argv[3] ?? 'last';
const filter = process.argv[4] ?? '';
const CHUNK = 100;

const variants: Variant[] = [];
const options = process.env.SIM_ALL ? OPTIONS : OPTIONS.filter((o) => o === 'full' || o === 'kids');
for (const size of SIZES) for (const table of TABLES) for (const option of options) variants.push({ size, table, option });
// Harder coop option: one Horde hero more (coop only).
for (const size of SIZES) for (const table of ['coop1', 'coop2'] as const) variants.push({ size, table, option: 'hard' });
const chosen = variants.filter((v) => new RegExp(filter).test(variantName(v)));

const jobs: Array<{ v: Variant; n: number; seed: number }> = [];
for (const v of chosen) for (let s = 0; s < games; s += CHUNK) jobs.push({ v, n: Math.min(CHUNK, games - s), seed: s + 1 });

function run(job: (typeof jobs)[number]): Promise<Summary> {
  return new Promise((resolve, reject) => {
    execFile('node', ['--import', 'tsx', 'scripts/sim/worker.ts', JSON.stringify(job.v), String(job.n), String(job.seed)], { maxBuffer: 64 << 20 }, (err, out) =>
      err ? reject(err) : resolve(JSON.parse(out)),
    );
  });
}

async function main() {
  const results = new Map<string, Summary>();
  let next = 0;
  const workers = Array.from({ length: Math.max(1, cpus().length - 1) }, async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      const r = await run(job);
      const name = variantName(job.v);
      results.set(name, results.has(name) ? merge(results.get(name)!, r) : r);
    }
  });
  await Promise.all(workers);
  const ordered = chosen.map((v) => results.get(variantName(v))!);
  mkdirSync('.tmp/sim', { recursive: true });
  writeFileSync(`.tmp/sim/${label}.json`, JSON.stringify(ordered, null, 1));

  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  console.log(`\n${games} gier na wariant · ${label}`);
  console.log('wariant'.padEnd(30), 'Świt'.padStart(7), 'rund'.padStart(6), 'bitew'.padStart(6), ' powody zakończenia');
  for (const s of ordered) {
    const top = Object.entries(s.reasons).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${short(k)} ${Math.round((n / s.games) * 100)}`).join(', ');
    const flag = s.dawnWins / s.games < 0.45 || s.dawnWins / s.games > 0.55 ? ' *' : '';
    console.log(s.variant.padEnd(30), pct(s.dawnWins / s.games).padStart(7), s.avgRounds.toFixed(1).padStart(6), s.battlesPerGame.toFixed(1).padStart(6), ` ${top}${flag}`);
  }
  const all = ordered.reduce((a, b) => merge(a, b));
  const d = all.diag;
  console.log(`\nDiagnostyka botów: nielegalne akcje ${d.illegal}, zawieszone gry ${d.stuck}, bitwy przerwane limitem ${d.battleRoundLimit}, bezczynne tury ${d.idleTurns}/${d.turns}, bezczynne aktywacje ${d.idleActivations}/${d.activations}`);
  for (const x of d.illegalSamples) console.log(`  ${x}`);
  console.log('\nJednostki w bitwach bohaterów (bitwy · % wygranych strony · % śmierci · śr. obrażenia):');
  for (const [id, t] of Object.entries(all.units).sort()) console.log(`  ${id.padEnd(14)} ${String(t.battles).padStart(6)} ${pct(t.wins / t.battles).padStart(7)} ${pct(t.deaths / t.battles).padStart(7)} ${(t.damage / t.battles).toFixed(2).padStart(6)}`);
  console.log('\nWalki ze strażnikami:');
  for (const [id, t] of Object.entries(all.guardianUnits).sort()) console.log(`  ${id.padEnd(14)} ${String(t.battles).padStart(6)} ${pct(t.wins / t.battles).padStart(7)} ${pct(t.deaths / t.battles).padStart(7)} ${(t.damage / t.battles).toFixed(2).padStart(6)}`);
  console.log('\nBohaterowie — % wygranych partii ich frakcji:');
  for (const [id, t] of Object.entries(all.heroGames).sort()) console.log(`  ${id.padEnd(14)} ${String(t.games).padStart(6)} ${pct(t.wins / t.games).padStart(7)}`);
}

function short(reason: string): string {
  if (reason.includes('kryształy')) return 'kryształy';
  if (reason.includes('Przymierza polegli')) return 'wybici Świt';
  if (reason.includes('Hordy polegli')) return 'wybita Horda';
  if (reason.includes('obu frakcji')) return 'oboje polegli';
  if (reason.includes('rytuał')) return 'rytuał';
  if (reason.includes('limit rund')) return 'limit';
  return reason.slice(0, 20);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
