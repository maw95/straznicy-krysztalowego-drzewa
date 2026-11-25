// Automatic tuner for the digital levels: for one objective and one growth setting it finds, cell by cell (map size × table × level),
// the smallest change of the levers (start treasures of the two sides, a reserve hero, start experience, the goal's own lever) that brings the Przymierza's
// win rate into the band of its level. Results (DigitalTune entries for the triangle map) go to .tmp/sim/auto-<objective>-g<growth>.json;
// scripts/sim/tuneMerge.ts turns all of them into src/engine/tuningAuto.ts.
// SIM_TABLES=pvp1,pvp2 tunes only those tables (the digital game has no coop any more).
// Usage: [SIM_SHAPE=rectangle|ring|islands|custom SIM_MAP=ciesnina|dolina] node --import tsx scripts/sim/tuneLevels.ts <objective> <growth 0|1> [games=120] [rounds=8]
// SIM_SIZES=huge,giant tunes the XL and XXL maps (into auto-<tag>-xl.json). Without SIM_SHAPE the triangle map. The entries of the old hand-made tuning stay in force while measuring; the generated ones of an earlier run do not (noAuto).
// Search: (1) a coarse ladder of rungs, treasures first; (2) a fine lever (bossHpFactor for the Boss, survivalRoundsBonus for Survival, dawnStartXp with hero growth)
// searched by bisection on the best rung; (3) validation of every chosen entry on other seeds (SIM_SEED_OFFSET, VAL_GAMES = 240), with up to two repair rounds on fresh seeds.
// Log lines: `size·table·level start% -> end% (ok|edge|OUT)` and, for the chosen entries, ` val=NN%@240 pass|fail|repaired`; unchanged cells print `start% unchanged (ok|edge|OUT)`.
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
const ONLY = process.env.SIM_ONLY; // e.g. kids: tune that level alone (into a file of its own, the other levels' entries stay)
const tag = `${shape}${map ? `-${map}` : ''}-${objective}-g${growthArg}${process.env.SIM_SIZES ? '-xl' : ''}${ONLY ? `-only-${ONLY}` : ''}`;
const LEVEL: Record<string, string> = { kids: 'kids', full: 'normal', hard: 'hard' };

type Patch = Record<string, unknown>;
const treasures = (n: number) => ({ resurrections: 0, others: 0, random: n });
const H0 = { hordeStartTreasures: treasures(0) };
const dawn = (n: number): Patch => ({ ...H0, dawnStartTreasures: treasures(n) });
/**
 * Raising the Przymierza's chances, gentlest first: treasures (they saturate near 10 cards), then a reserve hero (the Przymierza's alone), the
 * Horde without its digital balancing bonus (both Easy only), start
 * experience (only with hero growth), and last a move point and more rounds. The Horde's coop-only rungs (extraEvilHero, minEvilHeroes, hordeRespawn)
 * are gone: in a Skirmish they do nothing. The goal's own fine lever (FINE below) is searched on top of the best rung.
 */
const EASY = { dawnHeroReplacement: true, noFactionBonus: ['horde'] };
const UP: Patch[] = [
  H0,
  ...[1, 2, 3, 4, 5, 6, 8, 10].map(dawn),
  { ...dawn(10), dawnHeroReplacement: true },
  { ...dawn(10), ...EASY },
  ...(growth ? [3, 7, 12].map((xp) => ({ ...dawn(10), ...EASY, dawnStartXp: xp })) : []),
  { ...dawn(13), ...EASY, ...(growth ? { dawnStartXp: 12 } : {}), heroMovePoints: 4 },
  { ...dawn(13), ...EASY, ...(growth ? { dawnStartXp: 12 } : {}), heroMovePoints: 4, roundLimitBonus: 6 },
  // The last resort of the Crystals (the author, 25.11): one crystal fewer to bring to the Tree.
  ...(objective === 'crystals' ? [{ ...dawn(13), ...EASY, ...(growth ? { dawnStartXp: 12 } : {}), heroMovePoints: 4, roundLimitBonus: 6, crystalsNeededDelta: -1 }] : []),
];
/** Lowering them. */
const DOWN: Array<(coop: boolean) => Patch> = [
  ...[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map((n) => () => ({ hordeStartTreasures: treasures(n) })),
  (coop) => ({ hordeStartTreasures: treasures(15), ...(coop ? { extraEvilHero: true, minEvilHeroes: 2 } : {}) }),
  (coop) => ({ hordeStartTreasures: treasures(20), dawnStartTreasures: treasures(0), ...(coop ? { extraEvilHero: true, minEvilHeroes: 3 } : {}) }),
];

/** The goal's fine lever: values from the weakest for the Przymierza to the strongest (so the win rate rises with the index); `neutral` is the index of "no lever". */
interface Fine { key: string; values: number[]; neutral: number }
const range = (from: number, to: number, step: number) => Array.from({ length: Math.round(Math.abs(to - from) / step) + 1 }, (_, i) => Math.round((from + Math.sign(to - from) * i * step) * 100) / 100);
const FINE: Fine | null =
  objective === 'boss' ? { key: 'bossHpFactor', values: range(1.4, 0.4, 0.05), neutral: range(1.4, 0.4, 0.05).indexOf(1) }
  : objective === 'survival' ? { key: 'survivalRoundsBonus', values: range(6, -18, 1), neutral: 6 }
  : growth ? { key: 'dawnStartXp', values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18], neutral: 0 }
  : null;
const finePatch = (fine: number | null): Patch => (FINE && fine !== null && fine !== FINE.neutral ? { [FINE.key]: FINE.values[fine] } : {});
const VAL_GAMES = Number(process.env.VAL_GAMES ?? 240);
const VAL_OFFSET = 1000;

interface Config { step: number; fine: number | null }
interface Cell {
  size: string;
  table: string;
  option: string;
  name: string;
  /** Index in UP (positive) or DOWN (negative, -1 = first) of the rung being tried, 0 = nothing tried. */
  step: number;
  /** Index into FINE.values being tried (null = the lever is not used). */
  fine: number | null;
  rate: number;
  best: (Config & { rate: number }) | null;
  tried: Set<string>;
  /** Fine search: rates measured per fine index on the rung being refined. */
  points: Map<number, number>;
  done: boolean;
}

const names = (c: Pick<Cell, 'size' | 'table' | 'option'>) => `${c.size}·${c.table}·${c.option}`;
/** How far a rate is outside the band, with a margin of 3 points inside it (a cell is finished only when well within the band; the measurement is noisy). */
const MARGIN = 3;
const dist = (c: Cell, r: number) => {
  const [lo, hi] = BAND[c.option];
  return r < lo + MARGIN ? lo + MARGIN - r : r > hi - MARGIN ? r - (hi - MARGIN) : 0;
};
const inBand = (c: Cell, r: number) => r >= BAND[c.option][0] && r <= BAND[c.option][1];
const centre = (c: Cell) => (BAND[c.option][0] + BAND[c.option][1]) / 2;
const status = (c: Cell, r: number) => (!inBand(c, r) ? 'OUT' : dist(c, r) ? 'edge' : 'ok');

function entryOf(c: Cell, cfg: Config) {
  const patch = { ...(cfg.step > 0 ? UP[cfg.step - 1] : cfg.step < 0 ? DOWN[-cfg.step - 1](c.table.startsWith('coop')) : {}), ...finePatch(cfg.fine) };
  // The reserve hero, the Horde without its balancing bonus and one crystal fewer are the Easy level's alone (the author, 25.11): on Normal
  // and Hard the rung keeps only its treasures, experience, moves and rounds.
  if (LEVEL[c.option] !== 'kids') for (const k of ['dawnHeroReplacement', 'noFactionBonus', 'crystalsNeededDelta']) delete (patch as Patch)[k];
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
const key = (cfg: Config) => `${cfg.step}/${cfg.fine}`;

/** Measures the cells with their current entries; `cfgOf` says which configuration each one plays (default: its own); `offset` shifts the seeds, `n` the number of games. */
function measure(cells: Cell[], label: string, cfgOf: (c: Cell) => Config = (c) => c, offset = 0, n = games): Map<string, number> {
  const filter = `^(${cells.map((c) => c.name).join('|')})$`;
  const tuning = cells.map((c) => ({ c, cfg: cfgOf(c) })).filter(({ cfg }) => cfg.step !== 0 || cfg.fine !== null).map(({ c, cfg }) => entryOf(c, cfg));
  execFileSync('node', ['--import', 'tsx', 'scripts/sim/matrix.ts', String(n), label, filter], {
    env: { ...process.env, SIM_DIGITAL: '1', SIM_OBJECTIVE: objective, SIM_SEED_OFFSET: String(offset), ...(growth ? { SIM_GROWTH: '1' } : {}), SIM_OVERRIDE: JSON.stringify({ noAuto: true, tuning: [...ALREADY, ...tuning] }) },
    stdio: ['ignore', 'ignore', 'inherit'],
    maxBuffer: 1 << 28,
  });
  const out = JSON.parse(readFileSync(`.tmp/sim/${label}.json`, 'utf8')) as Array<{ variant: string; games: number; dawnWins: number }>;
  return new Map(out.map((s) => [s.variant, (100 * s.dawnWins) / s.games]));
}

/** Entries kept from earlier rounds for cells already finished (they must stay in force while the rest are measured). */
const ALREADY: unknown[] = [];

const all: Cell[] = [];
for (const size of SIZES) {
  for (const table of (process.env.SIM_TABLES ?? 'coop1,coop2,pvp1,pvp2').split(',')) {
    for (const option of ['kids', 'full', 'hard'].filter((o) => !ONLY || o === ONLY)) {
      const c = { size, table, option };
      all.push({ ...c, name: names(c), step: 0, fine: null, rate: 0, best: null, tried: new Set(), points: new Map(), done: false });
    }
  }
}
const consider = (c: Cell, r: number) => {
  const was = c.best;
  if (!was || dist(c, r) < dist(c, was.rate) || (dist(c, r) === dist(c, was.rate) && Math.abs(r - centre(c)) < Math.abs(was.rate - centre(c)))) c.best = { step: c.step, fine: c.fine, rate: r };
};

let base = measure(all, `tune-${tag}-0`);
for (const c of all) c.rate = base.get(c.name) ?? 0;
const startOf = (c: Cell) => base.get(c.name) ?? 0;
for (const c of all) if (dist(c, c.rate) === 0) c.done = true;
console.log(`${tag}: ${all.filter((c) => !c.done).length}/${all.length} cells out of band at the start`);

// --- Phase 1: the coarse ladder.
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
    if (c.tried.has(key({ step: next, fine: null })) || next === cur) {
      // Nothing new to try: keep the best seen and stop the ladder.
      c.done = true;
      continue;
    }
    c.tried.add(key({ step: next, fine: null }));
    c.step = next;
  }
  const run = open.filter((c) => !c.done);
  if (!run.length) break;
  const res = measure(run, `tune-${tag}-${round}`);
  for (const c of run) {
    const r = res.get(c.name) ?? 0;
    consider(c, r);
    c.rate = r;
    if (dist(c, r) === 0) c.done = true;
  }
  console.log(`round ${round}: ${run.length} measured, ${all.filter((c) => !c.done).length} open`);
}

// --- Phase 2: the goal's fine lever, bisected on the best rung, for the cells still outside the margin.
const fineOpen = (c: Cell) => dist(c, c.best?.rate ?? startOf(c)) > 0;
if (FINE) {
  const refine = all.filter(fineOpen);
  for (const c of refine) {
    const b = c.best ?? { step: 0, fine: null, rate: startOf(c) };
    c.step = b.step;
    c.fine = FINE.neutral;
    c.points = new Map([[FINE.neutral, b.rate]]);
    c.rate = b.rate;
    c.done = false;
  }
  for (let round = 1; round <= 8; round++) {
    const open = refine.filter((c) => !c.done);
    for (const c of open) {
      const centreRate = centre(c);
      const pts = [...c.points.entries()].sort((a, b) => a[0] - b[0]);
      const below = [...pts].reverse().find(([, r]) => r < centreRate);
      const lowAbove = pts.find(([i, r]) => r >= centreRate && (!below || i > below[0]));
      let next: number;
      if (below && lowAbove) {
        if (lowAbove[0] - below[0] <= 1) { c.done = true; continue; }
        const t = (centreRate - below[1]) / Math.max(1e-6, lowAbove[1] - below[1]);
        next = Math.min(lowAbove[0] - 1, Math.max(below[0] + 1, Math.round(below[0] + t * (lowAbove[0] - below[0]))));
      } else {
        const last = pts[pts.length - 1], first = pts[0];
        const stride = Math.max(1, Math.min(5, Math.round(Math.abs(centreRate - c.rate) / 3)));
        next = c.rate < centreRate ? last[0] + stride : first[0] - stride;
        next = Math.max(0, Math.min(FINE.values.length - 1, next));
      }
      if (c.points.has(next)) { c.done = true; continue; }
      c.fine = next;
    }
    const run = open.filter((c) => !c.done);
    if (!run.length) break;
    const res = measure(run, `tune-${tag}-fine${round}`);
    for (const c of run) {
      const r = res.get(c.name) ?? 0;
      c.points.set(c.fine!, r);
      consider(c, r);
      c.rate = r;
      if (dist(c, r) === 0) c.done = true;
    }
    console.log(`fine round ${round}: ${run.length} measured, ${refine.filter((c) => !c.done).length} open`);
  }
}

// --- Phase 3: validation of the chosen entries on other seeds; a failing one is moved one step towards the band and measured on fresh seeds (twice at most).
const startDist = (c: Cell) => dist(c, startOf(c));
const chosenOf = (c: Cell): (Config & { rate: number }) | null =>
  c.best && (c.best.step !== 0 || c.best.fine !== null) && dist(c, c.best.rate) < startDist(c) ? c.best : null;
const verdict = new Map<string, string>();
/** The rate shown as "end": the tuning measurement of an entry that passed at once, else the last fresh-seed measurement. */
const endRate = new Map<string, number>();
const finalCfg = new Map<string, Config & { rate: number }>();
{
  const checking = all.filter((c) => chosenOf(c));
  for (const c of checking) finalCfg.set(c.name, chosenOf(c)!);
  let pending = checking;
  for (let pass = 1; pass <= 3 && pending.length; pass++) {
    const res = measure(pending, `tune-${tag}-val${pass}`, (c) => finalCfg.get(c.name)!, VAL_OFFSET * pass, VAL_GAMES);
    const failed: Cell[] = [];
    for (const c of pending) {
      const r = res.get(c.name) ?? 0;
      const cfg = finalCfg.get(c.name)!;
      const tag2 = `val=${Math.round(r)}%@${VAL_GAMES}`;
      endRate.set(c.name, pass === 1 && inBand(c, r) ? cfg.rate : r);
      if (inBand(c, r)) verdict.set(c.name, `${tag2} ${pass === 1 ? 'pass' : 'repaired'}`);
      else {
        verdict.set(c.name, `${tag2} fail`);
        failed.push(c);
        // Repair: one move along the fine lever (or a ladder neighbour) towards the centre of the band, judged on the next pass's fresh seeds.
        const up = r < centre(c);
        if (pass < 3) {
          if (FINE && cfg.fine !== null) finalCfg.set(c.name, { step: cfg.step, fine: Math.max(0, Math.min(FINE.values.length - 1, cfg.fine + (up ? 1 : -1) * Math.max(1, Math.round(Math.abs(centre(c) - r) / 3)))), rate: r });
          else finalCfg.set(c.name, { step: Math.max(-DOWN.length, Math.min(UP.length, cfg.step + (up ? 1 : -1))), fine: cfg.fine, rate: r });
        } else finalCfg.set(c.name, { ...cfg, rate: r });
      }
    }
    console.log(`validation ${pass}: ${pending.length} measured, ${failed.length} failed`);
    pending = failed;
  }
}

const entries: unknown[] = [];
const report: string[] = [];
for (const c of all) {
  const startRate = startOf(c);
  const f = finalCfg.get(c.name);
  const val = verdict.get(c.name);
  // An entry that failed validation is kept only when its last (fresh-seed) rate is still nearer the band than the start.
  if (f && val && (!val.endsWith('fail') || dist(c, f.rate) < startDist(c))) {
    entries.push(entryOf(c, f));
    const shown = endRate.get(c.name) ?? f.rate;
    report.push(`${c.name} ${Math.round(startRate)}% -> ${Math.round(shown)}% (${status(c, shown)}) ${val}`);
  } else if (f && val) report.push(`${c.name} ${Math.round(startRate)}% unchanged (${status(c, startRate)}) ${val} dropped`);
  else report.push(`${c.name} ${Math.round(startRate)}% unchanged (${status(c, startRate)})`);
}
writeFileSync(`.tmp/sim/auto-${tag}.json`, JSON.stringify({ objective, growth, games, entries, report }, null, 1));
console.log(report.join('\n'));
