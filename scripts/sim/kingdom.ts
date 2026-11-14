// Level 3 "Królestwo" for bots: Przymierze win rate and the economy (recruits, gold, settlements) per map size and table.
// Usage: node --import tsx scripts/sim/kingdom.ts [games per cell=30] [sizes=short,medium] [tables=coop1,coop2,pvp1,pvp2]
// SIM_LEVEL=kids|hard picks the level (default normal).

import './override';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { chooseAction } from '../../src/engine/ai';
import { RECRUITS, settlementsOf } from '../../src/engine/kingdom';
import type { MapSize } from '../../src/engine/data';
import { setupWith, type Option, type Table } from './core';

process.env.SIM_DIGITAL = '1';
process.env.SIM_GROWTH = '1';
const games = Number(process.argv[2] ?? 30);
const sizes = (process.argv[3] ?? 'short,medium').split(',') as MapSize[];
const tables = (process.argv[4] ?? 'coop1,coop2,pvp1,pvp2').split(',') as Table[];
const option: Option[] = process.env.SIM_LEVEL === 'kids' ? ['kids'] : process.env.SIM_LEVEL === 'hard' ? ['hard'] : [];

console.log(`Królestwo, ${games} gier na komórkę, poziom ${process.env.SIM_LEVEL ?? 'normal'}`);
console.log('mapa·tryb'.padEnd(18) + 'Świt%'.padStart(8) + 'rundy'.padStart(8) + 'wyższe'.padStart(8) + 'osady'.padStart(8) + 'złoto'.padStart(8) + 'poz.≥4'.padStart(8));
for (const size of sizes) {
  for (const table of tables) {
    let wins = 0, rounds = 0, recruits = 0, settlements = 0, gold = 0, high = 0, stuck = 0;
    for (let g = 1; g <= games; g++) {
      const setup = setupWith(size, table, option, g);
      setup.rules = { ...setup.rules, kingdom: !process.env.SIM_NOKINGDOM };
      if (process.env.SIM_ARENA) setup.battleMode = 'arena'; // Easy has board duels by preset, and the kingdom needs the arena
      const s = createGame(setup);
      for (let i = 0; i < 30000 && s.phase !== 'over'; i++) {
        const a = chooseAction(s);
        if (!a) break;
        applyActionInPlace(s, a);
      }
      if (s.phase !== 'over') stuck++;
      if (s.winner === 'dawn') wins++;
      rounds += s.round;
      const fs = s.factions.dawn;
      const team = [...fs.supportsAlive, ...fs.supportsDead];
      recruits += team.filter((id) => RECRUITS.dawn.find((r) => r.id === id)!.tier > 1).length;
      high += team.filter((id) => (RECRUITS.dawn.find((r) => r.id === id)?.tier ?? 1) >= 4).length;
      settlements += settlementsOf(s, 'dawn').length;
      gold += s.kingdom?.gold.dawn ?? 0;
    }
    const n = games;
    console.log(`${size}·${table}`.padEnd(18) + ((wins / n) * 100).toFixed(0).padStart(8) + (rounds / n).toFixed(1).padStart(8) + (recruits / n).toFixed(1).padStart(8) + (settlements / n).toFixed(1).padStart(8) + (gold / n).toFixed(1).padStart(8) + (high / n).toFixed(1).padStart(8) + (stuck ? `  (niedokończone: ${stuck})` : ''));
  }
}
