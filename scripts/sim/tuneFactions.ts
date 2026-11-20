// Automatic faction balancer (gate G2 for any number of factions): greedy coordinate descent over small DIGITAL stat bonuses per faction
// (Życie and Atak of heroes and of supports, src/engine/factionBonus.ts) so that every pair follows the counter table ("Kto z kim",
// docs/FRAKCJE_PROPOZYCJE.md, approved 20.11): countering faction 60-70%, countered 30-40%, no relation 45-55%, and the average of every faction 45-55%.
// Only the factions in the registry take part. It prints a summary instead of every step (to keep a reading session cheap), saves its state after
// every accepted change to .tmp/sim/tuneFactions.json (start again to continue) and with --apply writes src/engine/factionBonus.ts.
// Usage: node --import tsx scripts/sim/tuneFactions.ts [games per pair and goal = 200] [goals = control,conquest,relic] [--apply] [--report]
//   --report only measures the current numbers and prints the summary; SIM_TIMEOUT_MIN (default 150) stops a long search politely.
// The board edition never reads these numbers (they live in the digital rules only).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { PACK_IDS } from '../../src/engine/factions';
import { FACTION_DIGITAL_BONUS, type FactionBonus } from '../../src/engine/factionBonus';

type Race = (typeof PACK_IDS)[number];
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
const GAMES = Number(args[0] ?? 200);
const GOALS = (args[1] ?? 'control,conquest,relic').split(',');
const deadline = Date.now() + Number(process.env.SIM_TIMEOUT_MIN ?? 150) * 60_000;
const STATE = '.tmp/sim/tuneFactions.json';

/** The counter table: what a faction counters (it should win 60-70% against them). The reverse direction follows. */
const COUNTERS: Record<string, string[]> = {
  dawn: ['horde', 'herds', 'free'],
  horde: ['undead', 'frost', 'sands'],
  herds: ['frost', 'sands', 'free'],
  undead: ['dawn', 'clans'],
  clans: ['horde', 'herds'],
  free: ['clans', 'tides'],
  frost: ['clans', 'tides', 'swarm'],
  sands: ['dawn', 'frost', 'swarm'],
  swarm: ['dawn', 'undead', 'free'],
  tides: ['horde', 'herds'],
};
const counters = (a: string, b: string) => COUNTERS[a]?.includes(b) || false;
/** The band of the share of `a` against `b`. */
const band = (a: string, b: string): [number, number] => (counters(a, b) && !counters(b, a) ? [60, 70] : counters(b, a) && !counters(a, b) ? [30, 40] : [45, 55]);
const dist = (x: number, [lo, hi]: [number, number]) => (x < lo ? lo - x : x > hi ? x - hi : 0);

const races = PACK_IDS as readonly Race[];
const pairsOf = (f: Race): Array<[Race, Race]> => races.filter((o) => o !== f).map((o) => [f, o] as [Race, Race]);
const allPairs: Array<[Race, Race]> = races.flatMap((a, i) => races.slice(i + 1).map((b) => [a, b] as [Race, Race]));

type Bonus = Record<string, FactionBonus>;
const zero = (): FactionBonus => ({ hero: { hp: 0, attack: 0 }, support: { hp: 0, attack: 0 } });
let bonus: Bonus = {};
for (const r of races) bonus[r] = structuredClone(FACTION_DIGITAL_BONUS[r] ?? zero());
if (existsSync(STATE) && !flags.has('--report')) bonus = { ...bonus, ...(JSON.parse(readFileSync(STATE, 'utf8')) as { bonus: Bonus }).bonus };

/** Measures pairs (share of the first faction, mean over the goals) with the given bonuses; the simulator reads them from SIM_OVERRIDE. */
function measure(pairs: Array<[Race, Race]>, b: Bonus): Map<string, number> {
  const out = execFileSync('node', ['--import', 'tsx', 'scripts/sim/nowe-frakcje.ts', String(GAMES), GOALS.join(','), pairs.map((p) => p.join(':')).join(',')], {
    env: { ...process.env, SIM_OVERRIDE: JSON.stringify({ digitalBonus: b }), SIM_TIMEOUT_S: '170' },
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  });
  const res = new Map<string, number>();
  for (const line of out.split('\n')) {
    const m = line.match(/^(\w+) vs (\w+): (.*)$/);
    if (!m) continue;
    const shares = [...m[3].matchAll(/\w+ (\d+)% ±/g)].map((x) => Number(x[1]));
    res.set(`${m[1]}:${m[2]}`, shares.reduce((s, x) => s + x, 0) / Math.max(1, shares.length));
  }
  return res;
}

/** The penalty of one faction: how far its pairs are from their bands (squared) plus how far its average share is from 45-55. */
function cost(f: Race, share: Map<string, number>): number {
  let c = 0;
  const mine: number[] = [];
  for (const [a, b] of pairsOf(f)) {
    const x = share.get(`${a}:${b}`) ?? 100 - (share.get(`${b}:${a}`) ?? 50);
    const y = a === f ? x : 100 - x;
    mine.push(y);
    c += dist(y, band(f, b === f ? a : b)) ** 2;
  }
  const mean = mine.reduce((s, x) => s + x, 0) / Math.max(1, mine.length);
  return c + 3 * dist(mean, [45, 55]) ** 2;
}

const pairShare = (m: Map<string, number>, a: string, b: string) => m.get(`${a}:${b}`) ?? 100 - (m.get(`${b}:${a}`) ?? 50);
function summary(m: Map<string, number>) {
  const lines: string[] = [];
  let bad = 0;
  for (const [a, b] of allPairs) {
    const x = pairShare(m, a, b);
    const bd = band(a, b);
    if (dist(x, bd) > 0) (bad++, lines.push(`  ${a} vs ${b}: ${x.toFixed(0)}% (wanted ${bd[0]}-${bd[1]})`));
  }
  const avg = races.map((r) => {
    const v = races.filter((o) => o !== r).map((o) => (m.has(`${r}:${o}`) ? m.get(`${r}:${o}`)! : 100 - (m.get(`${o}:${r}`) ?? 50)));
    return `${r} ${(v.reduce((s, x) => s + x, 0) / v.length).toFixed(0)}%`;
  });
  console.log(`pairs outside their band: ${bad}/${allPairs.length}${bad ? '\n' + lines.join('\n') : ''}\naverages: ${avg.join(', ')}`);
}

const save = (m: Map<string, number>) => writeFileSync(STATE, JSON.stringify({ bonus, shares: Object.fromEntries(m) }, null, 1));
function apply() {
  const body = races.map((r) => `  ${r}: ${JSON.stringify(bonus[r]).replace(/"(\w+)":/g, '$1: ').replace(/,/g, ', ').replace(/:\s*{/g, ': { ').replace(/}/g, ' }').replace(/\{\s+\{/g, '{ {')},`).join('\n');
  writeFileSync(
    'src/engine/factionBonus.ts',
    `// Generated by scripts/sim/tuneFactions.ts --apply (do not edit by hand; run the balancer again instead).
// The digital ruleset only: Życie and Atak every hero and every support of a faction has on top of its card (the board edition never reads this).
import type { FactionId } from './data';

export interface FactionBonus {
  hero: { hp: number; attack: number };
  support: { hp: number; attack: number };
}

export const FACTION_DIGITAL_BONUS: Partial<Record<FactionId, FactionBonus>> = {
${body}
};
`,
  );
  console.log('wrote src/engine/factionBonus.ts');
}

let current = measure(allPairs, bonus);
console.log(`start (${GAMES} games x ${GOALS.length} goals per pair)`);
summary(current);
if (flags.has('--report')) process.exit(0);

const STEPS: Array<[keyof FactionBonus, 'hp' | 'attack', number, number]> = [
  ['hero', 'hp', -2, 3],
  ['hero', 'attack', -1, 2],
  ['support', 'hp', -2, 3],
  ['support', 'attack', -1, 2],
];
for (let sweep = 1; sweep <= 6 && Date.now() < deadline; sweep++) {
  let accepted = 0;
  for (const f of races) {
    if (Date.now() > deadline) break;
    const base = cost(f, current);
    let best: { cost: number; b: Bonus; m: Map<string, number> } | null = null;
    for (const [kind, stat, lo, hi] of STEPS) {
      for (const d of [-1, 1]) {
        const v = bonus[f][kind][stat] + d;
        if (v < lo || v > hi) continue;
        const cand: Bonus = structuredClone(bonus);
        cand[f][kind][stat] = v;
        const m = measure(pairsOf(f), cand);
        const merged = new Map([...current, ...m]);
        const c = cost(f, merged);
        if (c < (best?.cost ?? base) - 8) best = { cost: c, b: cand, m: merged };
      }
    }
    if (best) {
      bonus = best.b;
      current = best.m;
      accepted++;
      save(current);
      console.log(`sweep ${sweep}: ${f} cost ${base.toFixed(0)} -> ${best.cost.toFixed(0)} (${JSON.stringify(bonus[f])})`);
    }
  }
  if (!accepted) break;
}
// A fresh full measurement with the final numbers (the pairs of other factions moved too).
current = measure(allPairs, bonus);
save(current);
console.log('final');
summary(current);
if (flags.has('--apply')) apply();
