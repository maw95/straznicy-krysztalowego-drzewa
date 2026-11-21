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
/** 1 when `a` counters `b`, -1 when `b` counters `a`, 0 for no relation. */
const relation = (a: string, b: string): -1 | 0 | 1 => (counters(a, b) && !counters(b, a) ? 1 : counters(b, a) && !counters(a, b) ? -1 : 0);
const dist = (x: number, [lo, hi]: [number, number]) => (x < lo ? lo - x : x > hi ? x - hi : 0);
// The relative target (the author, 20.11): average of a faction 45-55; a counter wins at least 10 points above its own average, the countered at least 10 below its own;
// no relation within the average +-7; no pair outside 25-75. A pair counts as met with a tolerance for the measurement error.
// Ladder step D (the author, 20.11): AVERAGE_ONLY=1 drops the counter relations; only the average of every faction (45-55) and the hard limits 25-75 count.
const AVERAGE_ONLY = process.env.AVERAGE_ONLY === '1';
const TOL = Number(process.env.SIM_TOL ?? 4);

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

const shareOf = (m: Map<string, number>, a: string, b: string) => m.get(`${a}:${b}`) ?? 100 - (m.get(`${b}:${a}`) ?? 50);
const avgOf = (m: Map<string, number>, r: Race) => {
  const v = races.filter((o) => o !== r).map((o) => shareOf(m, r, o));
  return v.reduce((s, x) => s + x, 0) / Math.max(1, v.length);
};
/** How far a pair is from the relative target: the sum of the gaps of its constraints (0 = met). Both sides are checked against their own averages. */
function pairGap(m: Map<string, number>, a: Race, b: Race): number {
  const x = shareOf(m, a, b);
  const aa = avgOf(m, a);
  const ab = avgOf(m, b);
  const rel = relation(a, b);
  let g = dist(x, [25, 75]);
  if (AVERAGE_ONLY) return g;
  if (rel === 1) g += Math.max(0, aa + 10 - x) + Math.max(0, 100 - x - (ab - 10));
  else if (rel === -1) g += Math.max(0, x - (aa - 10)) + Math.max(0, ab + 10 - (100 - x));
  else g += dist(x, [aa - 7, aa + 7]) + dist(100 - x, [ab - 7, ab + 7]);
  return g;
}
/** The penalty of one faction: its pairs (squared gaps) plus how far its average is from 45-55. */
function cost(f: Race, share: Map<string, number>): number {
  let c = 0;
  for (const [a, b] of pairsOf(f)) c += pairGap(share, a, b) ** 2;
  return c + (AVERAGE_ONLY ? 12 : 3) * dist(avgOf(share, f), [45, 55]) ** 2;
}

function summary(m: Map<string, number>) {
  const lines: string[] = [];
  let bad = 0;
  for (const [a, b] of allPairs) {
    const g = pairGap(m, a, b);
    if (g > TOL) (bad++, lines.push(`  ${a} vs ${b}: ${shareOf(m, a, b).toFixed(0)}% (${['counters', 'neutral', 'countered'][1 - relation(a, b)]}, gap ${g.toFixed(0)})`));
  }
  const avg = races.map((r) => `${r} ${avgOf(m, r).toFixed(0)}%`);
  console.log(`pairs outside the target (tolerance ${TOL}): ${bad}/${allPairs.length}${bad ? '\n' + lines.join('\n') : ''}\naverages: ${avg.join(', ')}`);
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
        // The hero Życie of the Covenant and the Horde must not fall below the card (tests/reports1110: dragons are not killed by one blow).
        if (v < lo || v > hi || (kind === 'hero' && stat === 'hp' && (f === 'dawn' || f === 'horde') && v < 0)) continue;
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
