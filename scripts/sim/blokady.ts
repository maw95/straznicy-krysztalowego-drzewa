// The measurement behind the set-up blocks (backlog 103): for every combination the wizard offers (goal × map size × shape × Przymierza seats × layer)
// the Przymierza's wins in `GAMES` games with Normal bots on both sides (draws count a half), written one line per cell to docs/balans_blokady.jsonl.
// Crystals and Survival are measured at the step of their role table (tuningRolesData.ts, from tuneRoles.ts); the other goals as they are (the level tuning applies).
// New seeds (from 1001), so the numbers are not the ones the tuner picked its steps on. A cell already in the file is skipped (BLOK_REDO=1 measures it again).
// Usage: npx tsx scripts/sim/blokady.ts [games = 400]   BLOK_GOALS=crystals,control  BLOK_SIZES=short,medium  BLOK_LIMIT=<cells>  SIM_WORKERS=<processes>
//   One cell alone (what the parent runs): BLOK_CELL=<json {cell, step, games}>

import { execFile } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { cpus } from 'node:os';
import type { MapSize } from '../../src/engine/data';
import { ROLE_TUNING, roleKey, type RoleLayer } from '../../src/engine/tuningRoles';
import type { MapShape, ObjectiveId } from '../../src/engine/types';
import { probe, type Cell } from './tuneRoles';

export const OUT = 'docs/balans_blokady.jsonl';
export interface Measured { key: string; objective: ObjectiveId; zero: boolean; map: MapSize; players: number; growth: boolean; layer: RoleLayer; shape: MapShape; step: number; games: number; dawn: number }

const SEED_OFFSET = 1000;
/** The layers measured per goal (a sample of the five: the first, a middle and the last; conquest from the Księstwo up, the relic on the Imperium only). */
const layersOf = (o: ObjectiveId): RoleLayer[] => (o === 'relic' ? ['empire'] : o === 'conquest' ? ['economy', 'empire'] : ['none', 'economy', 'empire']);

function allCells(): Array<{ cell: Cell; step: number }> {
  const list = (name: string, dflt: string) => (process.env[name] ?? dflt).split(',').filter(Boolean);
  const goals = list('BLOK_GOALS', 'crystals,survival,control,boss,artifact,conquest,relic') as ObjectiveId[];
  const sizes = list('BLOK_SIZES', 'short,medium,long,veryLong,huge,giant') as MapSize[];
  const shapes = list('BLOK_SHAPES', 'triangle,rectangle,ring,islands') as MapShape[];
  const out: Array<{ cell: Cell; step: number }> = [];
  for (const objective of goals) {
    if (objective === 'crystals' || objective === 'survival') {
      // Exactly the tables the role tuner has entries for.
      for (const t of ROLE_TUNING) if (t.objective === objective) for (const map of t.maps) if (sizes.includes(map)) out.push({ cell: { objective, zero: Boolean(t.zero), map, players: t.players, growth: t.growth, layer: t.layer, shape: t.shape, ...(t.customMapId ? { customMapId: t.customMapId } : {}) }, step: t.step });
      continue;
    }
    for (const layer of layersOf(objective))
      for (const map of sizes) for (const shape of shapes) for (const players of [1, 2]) out.push({ cell: { objective, zero: false, map, players, growth: true, layer, shape }, step: 0 });
  }
  return out;
}

const keyOf = (c: Cell) => roleKey(c);

if (process.env.BLOK_CELL) {
  const { cell, step, games } = JSON.parse(process.env.BLOK_CELL) as { cell: Cell; step: number; games: number };
  console.log(probe(cell, step, games, SEED_OFFSET).toFixed(2));
} else if (import.meta.url === `file://${process.argv[1]}`) {
  const games = Number(process.argv[2] ?? 400);
  const done = new Set<string>(existsSync(OUT) && !process.env.BLOK_REDO ? readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => (JSON.parse(l) as Measured).key) : []);
  const todo = allCells().filter((x) => !done.has(keyOf(x.cell))).slice(0, Number(process.env.BLOK_LIMIT) || Infinity);
  // The biggest maps first, so the slow cells do not end the run alone.
  const order: MapSize[] = ['giant', 'huge', 'veryLong', 'long', 'medium', 'short'];
  todo.sort((a, b) => order.indexOf(a.cell.map) - order.indexOf(b.cell.map));
  const workers = Number(process.env.SIM_WORKERS) || Math.max(1, Math.round(cpus().length * 0.8));
  const t0 = Date.now();
  let next = 0;
  let finished = 0;
  const run = (x: { cell: Cell; step: number }) =>
    new Promise<void>((resolve) => {
      execFile('node', ['--import', 'tsx', 'scripts/sim/blokady.ts'], { env: { ...process.env, BLOK_CELL: JSON.stringify({ ...x, games }) }, maxBuffer: 1 << 20 }, (err, out) => {
        finished++;
        if (err) {
          console.log(`BŁĄD ${keyOf(x.cell)}: ${String(err).slice(0, 200)}`);
          return resolve();
        }
        const dawn = Number(out.trim().split('\n').pop());
        const { cell } = x;
        const row: Measured = { key: keyOf(cell), objective: cell.objective, zero: cell.zero, map: cell.map, players: cell.players, growth: cell.growth, layer: cell.layer, shape: cell.shape, step: x.step, games, dawn };
        appendFileSync(OUT, JSON.stringify(row) + '\n');
        console.log(`${keyOf(cell)} krok ${x.step}: Przymierze ${dawn}%  [${finished}/${todo.length}, ${Math.round((Date.now() - t0) / 1000)} s]`);
        resolve();
      });
    });
  await Promise.all(Array.from({ length: workers }, async () => { while (next < todo.length) await run(todo[next++]); }));
  console.log(`=== gotowe (${todo.length} komórek, ${Math.round((Date.now() - t0) / 1000)} s)`);
}
