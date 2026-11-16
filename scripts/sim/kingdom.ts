// Level 3 "Osada" for bots: Przymierze win rate and the economy (recruits, gold, settlements) per map size and table.
// Usage: node --import tsx scripts/sim/kingdom.ts [games per cell=30] [sizes=short,medium] [tables=coop1,coop2,pvp1,pvp2]
// SIM_LEVEL=kids|hard|veryhard picks the level (default normal). SIM_ECONOMY=1 plays level 4 (resources); the last columns are then the average end stock of wood/ore/dust and buildings.

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
const option: Option[] = process.env.SIM_LEVEL === 'kids' ? ['kids'] : process.env.SIM_LEVEL === 'veryhard' ? ['veryhard'] : process.env.SIM_LEVEL === 'hard' ? ['hard'] : [];

console.log(`Osada, ${games} gier na komórkę, poziom ${process.env.SIM_LEVEL ?? 'normal'}`);
console.log('mapa·tryb'.padEnd(18) + 'Świt%'.padStart(8) + 'rundy'.padStart(8) + 'wyższe'.padStart(8) + 'osady'.padStart(8) + 'złoto'.padStart(8) + 'poz.≥4'.padStart(8) + (process.env.SIM_ECONOMY ? 'dr/rd/GP'.padStart(14) + 'budynki'.padStart(9) + 'chatki'.padStart(8) : ''));
for (const size of sizes) {
  for (const table of tables) {
    let spells = 0, casts = 0, wood = 0, ore = 0, dust = 0, built = 0, huts = 0, wins = 0, rounds = 0, recruits = 0, settlements = 0, gold = 0, high = 0, stuck = 0;
    for (let g = 1; g <= games; g++) {
      const setup = setupWith(size, table, option, g);
      setup.rules = { ...setup.rules, kingdom: !process.env.SIM_NOKINGDOM, ...(process.env.SIM_ECONOMY ? { economy: true } : {}), ...(process.env.SIM_REALM || process.env.SIM_EMPIRE ? { economy: true, realm: true } : {}), ...(process.env.SIM_EMPIRE ? { empire: true } : {}), ...(process.env.SIM_OBJECTIVE === 'relic' ? { objective: 'relic' as const } : {}), ...(process.env.SIM_OBJECTIVE === 'conquest' ? { objective: 'conquest' as const } : {}) };
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
      huts += Object.values(s.kingdom?.huts ?? {}).filter((h) => h.done).length;
      spells += Object.values(s.heroes).filter((h) => h.faction === 'dawn').reduce((a, h) => a + (h.spells?.length ?? 0), 0);
      casts += s.log.filter((l) => l.text.includes('rzuca czar')).length;
      const rs = s.kingdom?.res?.dawn;
      if (rs) { wood += rs.wood; ore += rs.ore; dust += rs.dust; }
      built += settlementsOf(s, 'dawn').reduce((a, x) => a + Object.values(x.buildings).reduce((p, q) => p + q, 0), 0);
    }
    const n = games;
    console.log(`${size}·${table}`.padEnd(18) + ((wins / n) * 100).toFixed(0).padStart(8) + (rounds / n).toFixed(1).padStart(8) + (recruits / n).toFixed(1).padStart(8) + (settlements / n).toFixed(1).padStart(8) + (gold / n).toFixed(1).padStart(8) + (high / n).toFixed(1).padStart(8) + (process.env.SIM_ECONOMY ? `${(wood / n).toFixed(1)}/${(ore / n).toFixed(1)}/${(dust / n).toFixed(1)}`.padStart(14) + (built / n).toFixed(1).padStart(9) + (huts / n).toFixed(1).padStart(8) : '') + (process.env.SIM_REALM ? `  czary ${(spells / n).toFixed(1)}, rzucone ${(casts / n).toFixed(1)}` : '') + (stuck ? `  (niedokończone: ${stuck})` : ''));
  }
}
