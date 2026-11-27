// Finds ARENA_RULES.bonus for one size of the digital arena: hill-climbs Życie and Atak of the heroes and supports of the factions beyond
// Przymierze and Horda until every faction wins about half of its games and no pair is far from even.
// Usage: npx tsx scripts/sim/tuneArena.ts <size 3|6> [games per pair = 150] [seconds = 170]
// Starts from .tmp/sim/arena-bonus-<size>.json when it is there (run it again to go on) and keeps the best table in that file.

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import type { FactionId } from '../../src/engine/data';
import { PLAYABLE_IDS } from '../../src/engine/factions';

type Bonus = Record<string, Record<'hero' | 'support', { hp: number; attack: number }>>;
const size = process.argv[2] === '6' ? '6' : '3';
const games = Number(process.argv[3] ?? 150);
const seconds = Number(process.argv[4] ?? 170);
const free = ['herds', 'clans', 'tides'];
const LIMITS = { hp: [-4, 8], attack: [-2, 3] } as const;
const sim = fileURLToPath(new URL('./arena-frakcje.ts', import.meta.url));
const file = `.tmp/sim/arena-bonus-${size}.json`;
mkdirSync('.tmp/sim', { recursive: true });

const ids = [...PLAYABLE_IDS] as FactionId[];
const pairs = ids.flatMap((a, i) => ids.slice(i + 1).map((b) => [a, b] as const));
const cache = new Map<string, Promise<number>>();
let running = 0;
const waiting: Array<() => void> = [];
const slot = async () => {
  if (running >= cpus().length - 1) await new Promise<void>((r) => waiting.push(r));
  else running++;
};
const done = () => {
  const next = waiting.shift();
  if (next) next();
  else running--;
};
function pairRate(a: FactionId, b: FactionId, bonus: Bonus): Promise<number> {
  const extra = JSON.stringify({ bonus: Object.fromEntries([a, b].filter((f) => bonus[f]).map((f) => [f, bonus[f]])) });
  const key = `${a}|${b}|${extra}`;
  let r = cache.get(key);
  if (!r)
    cache.set(key, (r = slot().then(() => new Promise<number>((ok, fail) =>
      execFile('node', ['--import', 'tsx', sim, '--job', a, b, String(games), size, 'normal'], { env: { ...process.env, ARENA_EXTRA: extra } }, (err, out) => {
        done();
        if (err) return fail(err);
        ok(JSON.parse(out).rate);
      })))));
  return r;
}

async function score(bonus: Bonus) {
  const rates = await Promise.all(pairs.map(([a, b]) => pairRate(a, b, bonus)));
  const avg = Object.fromEntries(ids.map((f) => [f, pairs.reduce((m, [a, b], i) => m + (a === f ? rates[i] : b === f ? 1 - rates[i] : 0), 0) / (ids.length - 1)]));
  let loss = 0;
  for (const f of free) loss += (100 * (avg[f] - 0.5)) ** 2;
  // Dawn against Horde cannot be moved, so only pairs with a tuned faction count: beyond 30-70 costs most.
  pairs.forEach(([a, b], i) => {
    if (!free.includes(a) && !free.includes(b)) return;
    const off = 100 * Math.abs(rates[i] - 0.5);
    loss += 0.15 * off ** 2 + 2 * Math.max(0, off - 18) ** 2;
  });
  // Small changes are preferred.
  for (const f of free) for (const k of ['hero', 'support'] as const) loss += 3 * (Math.abs(bonus[f][k].hp) + 3 * Math.abs(bonus[f][k].attack));
  return { loss, avg, rates };
}

const zero = (): Bonus => Object.fromEntries(free.map((f) => [f, { hero: { hp: 0, attack: 0 }, support: { hp: 0, attack: 0 } }]));
let best: Bonus = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).bonus : zero();
let bestScore = await score(best);
const end = Date.now() + seconds * 1000;
while (Date.now() < end) {
  const moves: Bonus[] = [];
  for (const f of free)
    for (const k of ['hero', 'support'] as const)
      for (const stat of ['hp', 'attack'] as const)
        for (const d of stat === 'hp' ? [-2, -1, 1, 2] : [-1, 1]) {
          const next: Bonus = structuredClone(best);
          next[f][k][stat] += d;
          if (next[f][k][stat] >= LIMITS[stat][0] && next[f][k][stat] <= LIMITS[stat][1]) moves.push(next);
        }
  const scored = await Promise.all(moves.map(async (m) => ({ m, s: await score(m) })));
  scored.sort((x, y) => x.s.loss - y.s.loss);
  if (scored[0].s.loss >= bestScore.loss - 0.5) {
    console.log('Brak lepszego sąsiada.');
    break;
  }
  best = scored[0].m;
  bestScore = scored[0].s;
  writeFileSync(file, JSON.stringify({ bonus: best, avg: bestScore.avg, loss: bestScore.loss }));
  console.log(bestScore.loss.toFixed(0), JSON.stringify(Object.fromEntries(Object.entries(bestScore.avg).map(([f, v]) => [f, Math.round(100 * v)]))), JSON.stringify(best));
}
writeFileSync(file, JSON.stringify({ bonus: best, avg: bestScore.avg, loss: bestScore.loss }));
