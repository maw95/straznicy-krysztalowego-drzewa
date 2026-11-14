// Tuner for level 3 "Królestwo": per level, map size and table finds the start-treasure step that puts the Przymierza win rate nearest the middle of the band.
// Usage: node --import tsx scripts/sim/tuneKingdom.ts <normal|hard> [games per probe=60] [sizes=short,medium,long]
// Prints DIGITAL_TUNING entries (paste them into the Kingdom block of src/engine/tuning.ts). Probes a binary search over LADDER (weakest Przymierza first).

import './override';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { chooseAction } from '../../src/engine/ai';
import { DIGITAL_TUNING, type DigitalTune } from '../../src/engine/tuning';
import type { MapSize } from '../../src/engine/data';
import type { RulesConfig } from '../../src/engine/types';
import { setupWith, type Option, type Table } from './core';

process.env.SIM_DIGITAL = '1';
process.env.SIM_GROWTH = '1';
const level = (process.argv[2] ?? 'normal') as 'normal' | 'hard';
const games = Number(process.argv[3] ?? 60);
const sizes = (process.argv[4] ?? 'short,medium,long').split(',') as MapSize[];
const TARGET = level === 'hard' ? 38 : 55;
const tr = (n: number) => ({ resurrections: 0, others: 0, random: n });
const LADDER: Array<Partial<RulesConfig>> = [
  { hordeStartTreasures: tr(4), dawnStartTreasures: tr(0) },
  { hordeStartTreasures: tr(3), dawnStartTreasures: tr(0) },
  { hordeStartTreasures: tr(2), dawnStartTreasures: tr(0) },
  { hordeStartTreasures: tr(1), dawnStartTreasures: tr(0) },
  { hordeStartTreasures: tr(0), dawnStartTreasures: tr(0) },
  { hordeStartTreasures: tr(0), dawnStartTreasures: tr(1) },
  { hordeStartTreasures: tr(0), dawnStartTreasures: tr(2) },
  { hordeStartTreasures: tr(0), dawnStartTreasures: tr(3) },
  { hordeStartTreasures: tr(0), dawnStartTreasures: tr(4) },
  { hordeStartTreasures: tr(0), dawnStartTreasures: tr(6) },
];
const option: Option[] = level === 'hard' ? ['hard'] : [];
const TABLES: Array<[Table, 'coop' | 'pvp', number]> = [['coop1', 'coop', 1], ['coop2', 'coop', 2], ['pvp1', 'pvp', 1], ['pvp2', 'pvp', 2]];

function winRate(size: MapSize, table: Table, step: number, base: number): number {
  const entry: DigitalTune = { kingdom: true, level, mode: table.startsWith('coop') ? 'coop' : 'pvp', players: Number(table.slice(-1)), maps: [size], rules: LADDER[step] };
  DIGITAL_TUNING.push(entry);
  let wins = 0;
  for (let g = 1; g <= games; g++) {
    const setup = setupWith(size, table, option, base + g);
    setup.rules = { ...setup.rules, kingdom: true };
    const s = createGame(setup);
    for (let i = 0; i < 30000 && s.phase !== 'over'; i++) {
      const a = chooseAction(s);
      if (!a) break;
      applyActionInPlace(s, a);
    }
    if (s.winner === 'dawn') wins++;
  }
  DIGITAL_TUNING.pop();
  return (wins / games) * 100;
}

for (const size of sizes) {
  for (const [table, mode, players] of TABLES) {
    const seen = new Map<number, number>();
    const probe = (k: number) => { if (!seen.has(k)) seen.set(k, winRate(size, table, k, 1000)); return seen.get(k)!; };
    let lo = 0, hi = LADDER.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (probe(mid) < TARGET) lo = mid + 1; else hi = mid; }
    // lo is the first step at or above the target; the step below may be nearer.
    let best = lo;
    if (lo > 0 && Math.abs(probe(lo - 1) - TARGET) < Math.abs(probe(lo) - TARGET)) best = lo - 1;
    const got = probe(best);
    console.log(`// ${level} ${size} ${table}: ${got.toFixed(0)}% (${[...seen].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}:${v.toFixed(0)}`).join(' ')})`);
    console.log(`  { kingdom: true, level: '${level}', mode: '${mode}', players: ${players}, maps: ['${size}'], rules: ${JSON.stringify(LADDER[best]).replace(/"(\w+)":/g, '$1: ').replace(/,/g, ', ')} },`);
  }
}
