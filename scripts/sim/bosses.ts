// Boss goal split by the boss drawn (digital ruleset, hero growth): % of games the Przymierza win against each boss.
// Usage: node --import tsx scripts/sim/bosses.ts [games per boss=30] [sizes=long] [tables=coop1,pvp1]
// Seeds are walked until every boss has `games` games (the draw is by seed), so a run takes a few minutes at 30.
import './override';
process.env.SIM_DIGITAL = '1';
process.env.SIM_OBJECTIVE = 'boss';
process.env.SIM_GROWTH = '1';
import { chooseAction } from '../../src/engine/ai';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import type { MapSize } from '../../src/engine/data';
import { setupWith, type Table } from './core';

const per = Number(process.argv[2] ?? 30);
const sizes = (process.argv[3] ?? 'long').split(',') as MapSize[];
const tables = (process.argv[4] ?? 'coop1,pvp1').split(',') as Table[];
const BOSSES = ['hydra', 'cyclops', 'stoneGolem', 'stormKing', 'kraken'];

for (const size of sizes) {
  for (const table of tables) {
    const tally: Record<string, { n: number; dawn: number; rounds: number }> = Object.fromEntries(BOSSES.map((b) => [b, { n: 0, dawn: 0, rounds: 0 }]));
    for (let seed = 1; seed < 5000 && BOSSES.some((b) => tally[b].n < per); seed++) {
      const s = createGame(setupWith(size, table, ['full'], seed));
      const boss = s.boss!.guardian;
      if (tally[boss].n >= per) continue;
      for (let i = 0; i < 30000 && s.phase !== 'over'; i++) {
        const a = chooseAction(s);
        if (!a) break;
        try {
          applyActionInPlace(s, a);
        } catch {
          applyActionInPlace(s, s.phase === 'battle' ? { type: 'endActivation' } : { type: 'endTurn' });
        }
      }
      const t = tally[boss];
      t.n++;
      t.rounds += s.round;
      if (s.winner === 'dawn') t.dawn++;
    }
    console.log(`${size}·${table}: ` + BOSSES.map((b) => `${b} ${tally[b].n ? Math.round((100 * tally[b].dawn) / tally[b].n) : '-'}% (${tally[b].n}, rund ${(tally[b].rounds / Math.max(1, tally[b].n)).toFixed(1)})`).join(' · '));
  }
}
