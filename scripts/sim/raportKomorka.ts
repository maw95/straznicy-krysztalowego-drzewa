// One cell of the balance report (raport.ts): prints {wins, games} of Przymierza for a layer (set by env flags), map size, table and difficulty.
// Usage: node --import tsx scripts/sim/raportKomorka.ts <games> <size> <table> <option: full|kids|hard|veryhard>
import './override';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { chooseAction } from '../../src/engine/ai';
import type { MapSize } from '../../src/engine/data';
import { setupWith, type Option, type Table } from './core';

const [games, size, table, option] = process.argv.slice(2);
let wins = 0;
for (let g = 1; g <= Number(games); g++) {
  const setup = setupWith(size as MapSize, table as Table, option === 'full' ? [] : [option as Option], g);
  const e = process.env;
  setup.rules = { ...setup.rules, ...(e.SIM_KINGDOM ? { kingdom: true } : {}), ...(e.SIM_ECONOMY ? { economy: true, kingdom: true } : {}), ...(e.SIM_REALM || e.SIM_EMPIRE ? { economy: true, kingdom: true, realm: true } : {}), ...(e.SIM_EMPIRE ? { empire: true } : {}) };
  const s = createGame(setup);
  for (let i = 0; i < 30000 && s.phase !== 'over'; i++) {
    const a = chooseAction(s);
    if (!a) break;
    applyActionInPlace(s, a);
  }
  if (s.winner === 'dawn') wins++;
}
process.stdout.write(JSON.stringify({ wins, games: Number(games) }));
