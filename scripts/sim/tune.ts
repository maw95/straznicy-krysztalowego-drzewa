// Balance tuning: tries unit and ability changes (SIM_OVERRIDE sets) on the arena and, with --matrix,
// on the whole game, and compares them with the baseline (.tmp/sim/arena-baseline.json, .tmp/sim/baseline.json).
// Usage: npx tsx scripts/sim/tune.ts candidates.json [--games 300] [--matrix] [--only name,name]
//   candidates.json: { "name": { "units": { "werewolfLord": { "speed": 7 } }, "ability": { ... } }, ... }

import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { FACTION_HEROES, FACTION_SUPPORTS, UNITS, type FactionId } from '../../src/engine/data';

const args = process.argv.slice(2);
const file = args[0];
const opt = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const games = Number(opt('--games') ?? 300);
const withMatrix = args.includes('--matrix');
const only = opt('--only')?.split(',');
const candidates = Object.entries(JSON.parse(readFileSync(file, 'utf8')) as Record<string, object>).filter(([n]) => !only || only.includes(n));

const run = (cmd: string[], override: object) =>
  new Promise<void>((done, fail) =>
    execFile('node', ['--import', 'tsx', ...cmd], { env: { ...process.env, SIM_OVERRIDE: JSON.stringify(override) }, maxBuffer: 64 << 20 }, (err) => (err ? fail(err) : done())),
  );

interface ArenaFile {
  games: number;
  lineUps: Record<FactionId, Array<{ hero: string; supports: string[] }>>;
  results: Array<{ di: number; hi: number; wins: number; draws: number }>;
}

/** Win rate of every hero and support pair for its own side, plus Przymierze overall. */
function arenaMetrics(label: string) {
  const a = JSON.parse(readFileSync(`.tmp/sim/arena-${label}.json`, 'utf8')) as ArenaFile;
  const rate = (side: FactionId, pick: (i: number) => boolean) => {
    const rows = a.results.filter((r) => pick(side === 'dawn' ? r.di : r.hi));
    const n = rows.length * a.games;
    const w = rows.reduce((s, r) => s + (side === 'dawn' ? r.wins : a.games - r.wins - r.draws), 0);
    return (100 * w) / n;
  };
  const out: Record<string, number> = {};
  for (const side of ['dawn', 'horde'] as FactionId[]) {
    for (const h of FACTION_HEROES[side]) out[UNITS[h].name] = rate(side, (i) => a.lineUps[side][i].hero === h);
    for (const left of FACTION_SUPPORTS[side]) out[`bez ${UNITS[left].name}`] = rate(side, (i) => !a.lineUps[side][i].supports.includes(left));
  }
  out.Przymierze = rate('dawn', () => true);
  return out;
}

function matrixDelta(label: string) {
  type S = { variant: string; dawnWins: number; games: number };
  const base = new Map((JSON.parse(readFileSync('.tmp/sim/baseline.json', 'utf8')) as S[]).map((s) => [s.variant, (100 * s.dawnWins) / s.games]));
  const now = JSON.parse(readFileSync(`.tmp/sim/${label}.json`, 'utf8')) as S[];
  const d = now.map((s) => ({ v: s.variant, d: (100 * s.dawnWins) / s.games - base.get(s.variant)! }));
  const worst = d.reduce((a, b) => (Math.abs(b.d) > Math.abs(a.d) ? b : a));
  const mean = (f: (v: string) => boolean) => {
    const xs = d.filter((x) => f(x.v)).map((x) => x.d);
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  };
  return { worst, coop: mean((v) => v.includes('coop')), pvp: mean((v) => v.includes('pvp')), over5: d.filter((x) => Math.abs(x.d) > 5).length };
}

const fmt = (x: number) => x.toFixed(1).padStart(5);
const base = arenaMetrics('baseline');
const keys = Object.keys(base);
console.log(`${'wariant'.padEnd(26)} ${keys.map((k) => k.slice(0, 11).padStart(11)).join(' ')}`);
console.log(`${'(wyjściowy)'.padEnd(26)} ${keys.map((k) => fmt(base[k]).padStart(11)).join(' ')}`);
for (const [name, override] of candidates) {
  const label = `tune-${name}`;
  await run(['scripts/sim/arena.ts', String(games), 'normal', label], override);
  const m = arenaMetrics(label);
  const heroes = [...FACTION_HEROES.dawn, ...FACTION_HEROES.horde].map((h) => m[UNITS[h].name]);
  const spread = Math.max(...heroes) - Math.min(...heroes);
  let line = `${name.padEnd(26)} ${keys.map((k) => fmt(m[k]).padStart(11)).join(' ')}  rozrzut bohaterów ${fmt(spread)}`;
  if (withMatrix) {
    await run(['scripts/sim/matrix.ts', '300', label], override);
    const md = matrixDelta(label);
    line += `  | gra: koop ${fmt(md.coop)} pvp ${fmt(md.pvp)} najgorzej ${md.worst.v} ${fmt(md.worst.d)} · poza ±5: ${md.over5}`;
  }
  console.log(line);
}
