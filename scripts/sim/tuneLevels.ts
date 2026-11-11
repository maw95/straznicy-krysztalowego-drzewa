// Automatic tuner for the digital levels: for one objective and one growth setting it finds, cell by cell (map size × table × level),
// the smallest change of the levers (start treasures of the two sides, hero replacement, an extra Horde hero) that brings the Przymierza's
// win rate into the band of its level. Results (DigitalTune entries for the triangle map) go to .tmp/sim/auto-<objective>-g<growth>.json;
// scripts/sim/tuneMerge.ts turns all of them into src/engine/tuningAuto.ts.
// Usage: [SIM_SHAPE=rectangle|ring|islands|custom SIM_MAP=ciesnina|dolina] node --import tsx scripts/sim/tuneLevels.ts <objective> <growth 0|1> [games=120] [rounds=8]
// SIM_SIZES=huge,giant tunes the XL and XXL maps (into auto-<tag>-xl.json). Without SIM_SHAPE the triangle map. The entries of the old hand-made tuning stay in force while measuring; the generated ones of an earlier run do not (noAuto).
// Bands (the author, 9.11.2026): Easy 65-85, Normal 45-65, Hard 30-45 percent wins of the Przymierza. About 1 minute per objective and shape.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const [objective, growthArg, gamesArg, roundsArg] = process.argv.slice(2);
const growth = growthArg === '1';
const games = Number(gamesArg ?? 120);
const maxRounds = Number(roundsArg ?? 8);
const BAND: Record<string, [number, number]> = { kids: [65, 85], full: [45, 65], hard: [30, 45] };
const shape = process.env.SIM_SHAPE ?? 'triangle';
const map = process.env.SIM_MAP;
const SIZES = process.env.SIM_SIZES ? process.env.SIM_SIZES.split(',') : ['short', 'medium', 'long', 'veryLong'];
// Other sizes than the board game's go to a file of their own, so that the merge keeps both.
const tag = `${shape}${map ? `-${map}` : ''}-${objective}-g${growthArg}${process.env.SIM_SIZES ? '-xl' : ''}`;
const LEVEL: Record<string, string> = { kids: 'kids', full: 'normal', hard: 'hard' };

type Patch = Record<string, unknown>;
const treasures = (n: number) => ({ resurrections: 0, others: 0, random: n });
/** Raising the Przymierza's chances, gentlest first. */
const UP: Array<(hard: boolean) => Patch> = [
  () => ({ hordeStartTreasures: treasures(0) }),
  () => ({ hordeStartTreasures: treasures(0), dawnStartTreasures: treasures(1) }),
  () => ({ hordeStartTreasures: treasures(0), dawnStartTreasures: treasures(2) }),
  () => ({ hordeStartTreasures: treasures(0), dawnStartTreasures: treasures(3) }),
  () => ({ hordeStartTreasures: treasures(0), dawnStartTreasures: treasures(4) }),
  (h) => ({ hordeStartTreasures: treasures(0), dawnStartTreasures: treasures(5), ...(h ? { extraEvilHero: false } : {}) }),
  (h) => ({ hordeStartTreasures: treasures(0), dawnStartTreasures: treasures(6), ...(h ? { extraEvilHero: false } : {}) }),
  (h) => ({ hordeStartTreasures: treasures(0), dawnStartTreasures: treasures(8), ...(h ? { extraEvilHero: false, minEvilHeroes: 1 } : {}) }),
  (h) => ({ hordeStartTreasures: treasures(0), dawnStartTreasures: treasures(10), ...(h ? { extraEvilHero: false, minEvilHeroes: 1 } : {}) }),
  (h) => ({ hordeStartTreasures: treasures(0), dawnStartTreasures: treasures(13), ...(h ? { extraEvilHero: false, minEvilHeroes: 1 } : {}) }),
];
/** Lowering them. */
const DOWN: Array<(coop: boolean) => Patch> = [
  ...[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map((n) => () => ({ hordeStartTreasures: treasures(n) })),
  (coop) => ({ hordeStartTreasures: treasures(15), ...(coop ? { extraEvilHero: true, minEvilHeroes: 2 } : {}) }),
  (coop) => ({ hordeStartTreasures: treasures(20), dawnStartTreasures: treasures(0), ...(coop ? { extraEvilHero: true, minEvilHeroes: 3 } : {}) }),
];

interface Cell {
  size: string;
  table: string;
  option: string;
  name: string;
  /** Index in UP (positive) or DOWN (negative, -1 = first) of the entry being tried, 0 = nothing tried. */
  step: number;
  rate: number;
  best: { step: number; rate: number } | null;
  tried: Set<number>;
  done: boolean;
}

const names = (c: Pick<Cell, 'size' | 'table' | 'option'>) => `${c.size}·${c.table}·${c.option}`;
/** How far a rate is outside the band, with a margin of 3 points inside it (a cell is finished only when well within the band; the measurement is noisy). */
const MARGIN = 3;
const dist = (c: Cell, r: number) => {
  const [lo, hi] = BAND[c.option];
  return r < lo + MARGIN ? lo + MARGIN - r : r > hi - MARGIN ? r - (hi - MARGIN) : 0;
};
const centre = (c: Cell) => (BAND[c.option][0] + BAND[c.option][1]) / 2;

function entryOf(c: Cell, step: number) {
  const patch = step > 0 ? UP[step - 1](c.option === 'hard') : DOWN[-step - 1](c.table.startsWith('coop'));
  return {
    objective,
    level: LEVEL[c.option],
    mode: c.table.startsWith('coop') ? 'coop' : 'pvp',
    players: c.table.endsWith('1') ? 1 : 2,
    maps: [c.size],
    growth,
    shape,
    ...(map ? { customMapId: map } : {}),
    rules: patch,
  };
}

function measure(cells: Cell[], label: string): Map<string, number> {
  const filter = `^(${cells.map((c) => c.name).join('|')})$`;
  const tuning = cells.filter((c) => c.step !== 0).map((c) => entryOf(c, c.step));
  execFileSync('node', ['--import', 'tsx', 'scripts/sim/matrix.ts', String(games), label, filter], {
    env: { ...process.env, SIM_DIGITAL: '1', SIM_OBJECTIVE: objective, ...(growth ? { SIM_GROWTH: '1' } : {}), SIM_OVERRIDE: JSON.stringify({ noAuto: true, tuning: [...ALREADY, ...tuning] }) },
    stdio: ['ignore', 'ignore', 'inherit'],
    maxBuffer: 1 << 28,
  });
  const out = JSON.parse(readFileSync(`.tmp/sim/${label}.json`, 'utf8')) as Array<{ variant: string; games: number; dawnWins: number }>;
  return new Map(out.map((s) => [s.variant, (100 * s.dawnWins) / s.games]));
}

/** Entries kept from earlier rounds for cells already finished (they must stay in force while the rest are measured). */
const ALREADY: unknown[] = [];

const coop = (t: string) => t.startsWith('coop');
const all: Cell[] = [];
for (const size of SIZES) {
  for (const table of ['coop1', 'coop2', 'pvp1', 'pvp2']) {
    for (const option of coop(table) ? ['kids', 'full', 'hard'] : ['kids', 'full']) {
      if (objective === 'survival' && !coop(table)) continue;
      const c = { size, table, option };
      all.push({ ...c, name: names(c), step: 0, rate: 0, best: null, tried: new Set(), done: false });
    }
  }
}

let base = measure(all, `tune-${tag}-0`);
for (const c of all) c.rate = base.get(c.name) ?? 0;
const finished = new Map<string, { step: number; rate: number }>();
for (const c of all) if (dist(c, c.rate) === 0) (c.done = true), finished.set(c.name, { step: 0, rate: c.rate });
console.log(`${tag}: ${all.filter((c) => !c.done).length}/${all.length} cells out of band at the start`);

for (let round = 1; round <= maxRounds; round++) {
  const open = all.filter((c) => !c.done);
  if (!open.length) break;
  for (const c of open) {
    const gap = dist(c, c.rate);
    const up = c.rate < centre(c);
    const cur = c.step;
    // Move along the ladder of the needed direction; a bigger gap, a bigger stride.
    const stride = gap > 15 ? 3 : gap > 7 ? 2 : 1;
    let next: number;
    if (cur === 0) next = up ? Math.min(UP.length, stride) : -Math.min(DOWN.length, stride);
    else if (cur > 0) next = up ? Math.min(UP.length, cur + stride) : Math.max(0, cur - stride);
    else next = !up ? Math.max(-DOWN.length, cur - stride) : Math.min(0, cur + stride);
    if (c.tried.has(next) || next === cur) {
      // Nothing new to try: keep the best seen and stop.
      c.done = true;
      continue;
    }
    c.tried.add(next);
    c.step = next;
  }
  const run = open.filter((c) => !c.done);
  if (!run.length) break;
  const res = measure(run, `tune-${tag}-${round}`);
  for (const c of run) {
    const r = res.get(c.name) ?? 0;
    const was = c.best;
    if (!was || dist(c, r) < dist(c, was.rate) || (dist(c, r) === dist(c, was.rate) && Math.abs(r - centre(c)) < Math.abs(was.rate - centre(c)))) c.best = { step: c.step, rate: r };
    c.rate = r;
    if (dist(c, r) === 0) c.done = true;
  }
  console.log(`round ${round}: ${run.length} measured, ${all.filter((c) => !c.done).length} open`);
}

const entries: unknown[] = [];
const report: string[] = [];
for (const c of all) {
  const chosen = c.best && dist(c, c.best.rate) <= dist(c, finished.get(c.name)?.rate ?? c.rate + 1e9) ? c.best : null;
  const startRate = base.get(c.name) ?? 0;
  if (dist(c, startRate) === 0 && !chosen) continue;
  if (chosen && chosen.step !== 0 && dist(c, chosen.rate) < dist(c, startRate)) {
    entries.push(entryOf(c, chosen.step));
    report.push(`${c.name} ${Math.round(startRate)}% -> ${Math.round(chosen.rate)}%${chosen.rate < BAND[c.option][0] || chosen.rate > BAND[c.option][1] ? ' (OUT)' : dist(c, chosen.rate) ? ' (edge)' : ''}`);
  } else if (dist(c, startRate) > 0) report.push(`${c.name} ${Math.round(startRate)}% unchanged (OUT)`);
}
writeFileSync(`.tmp/sim/auto-${tag}.json`, JSON.stringify({ objective, growth, games, entries, report }, null, 1));
console.log(report.join('\n'));
