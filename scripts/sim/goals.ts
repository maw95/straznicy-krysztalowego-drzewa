// Balance table of the digital edition's goals: % of games the Przymierza win per goal × map shape, in coop and PvP (level Normal, all four map sizes).
// Usage: npx tsx scripts/sim/goals.ts [games per variant = 40]   (about 2-3 minutes at 40; targets: Normal 45-65 percent)
// Runs matrix.ts for every combination (SIM_OBJECTIVE, SIM_SHAPE, SIM_MAP) and reads .tmp/sim/goals-*.json.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const games = process.argv[2] ?? '40';
const OBJECTIVES = ['crystals', 'control', 'survival', 'boss', 'artifact'];
const SHAPES: Array<[string, string, string?]> = [['triangle', ''], ['rectangle', 'rectangle'], ['ring', 'ring'], ['islands', 'islands'], ['Cieśnina', 'custom', 'ciesnina'], ['Dolina', 'custom', 'dolina']];

const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}`.padStart(3) + '%' : '  - ');
console.log(`Wygrane Przymierza (poziom Normalny, ${games} gier na wariant): kooperacja / rywalizacja`);
console.log(['cel'.padEnd(10), ...SHAPES.map(([n]) => n.padEnd(12))].join(' '));
for (const objective of OBJECTIVES) {
  const cells: string[] = [];
  for (const [name, shape, map] of SHAPES) {
    const label = `goals-${objective}-${name}`;
    execFileSync('node', ['--import', 'tsx', 'scripts/sim/matrix.ts', games, label, '·full'], {
      env: { ...process.env, SIM_DIGITAL: '1', SIM_OBJECTIVE: objective, ...(shape ? { SIM_SHAPE: shape } : {}), ...(map ? { SIM_MAP: map } : {}) },
      stdio: 'ignore',
    });
    const rows = JSON.parse(readFileSync(`.tmp/sim/${label}.json`, 'utf8')) as Array<{ variant: string; dawnWins: number; games: number }>;
    const sum = (f: (v: string) => boolean) => rows.filter((r) => f(r.variant)).reduce((a, r) => ({ w: a.w + r.dawnWins, g: a.g + r.games }), { w: 0, g: 0 });
    const coop = sum((v) => v.includes('coop'));
    const pvp = sum((v) => v.includes('pvp'));
    // Survival is a coop goal: its PvP tables play the crystals goal, so they are not shown.
    cells.push(`${pct(coop.w, coop.g)}/${objective === 'survival' ? '  - ' : pct(pvp.w, pvp.g)}`.padEnd(12));
  }
  console.log([objective.padEnd(10), ...cells].join(' '));
}
