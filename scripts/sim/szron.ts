// Quick balance probe of the Court of Everfrost against Przymierze and Horda (gate G1 sanity check, gate G2 tunes it): npx tsx scripts/sim/szron.ts [games per cell]. Seats alternate; 2 goals x 2 rivals.
import { createGame } from '../../src/engine/game';
import { applyActionInPlace } from '../../src/engine/game';
import { chooseAction } from '../../src/engine/ai';
import { FACTION_HEROES } from '../../src/engine/data';
import { assignSlots, raceOf } from '../../src/engine/teams';
import { DEFAULT_RULES, type SetupOptions } from '../../src/engine/types';
const mk = (races: Array<'dawn' | 'horde' | 'frost'>, objective: any, seed: number, size: any, shape: any): SetupOptions => {
  const slots = assignSlots(races);
  return { mode: 'pvp', mapSize: size, battleMode: 'arena', seed, mapShape: shape, seats: races.map((race, i) => ({ name: race + i, faction: slots[i], race, controller: 'bot' as const, heroId: FACTION_HEROES[race][seed % 3] })), rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, objective } };
};
const N = Number(process.argv[2] ?? 30);
for (const obj of ['control', 'conquest']) for (const foe of ['dawn', 'horde'] as const) {
  let frost = 0, foes = 0, draws = 0, t0 = Date.now();
  for (let seed = 1; seed <= N; seed++) {
    const order = seed % 2 ? ['frost', foe] as const : [foe, 'frost'] as const;
    const s = createGame(mk([...order], obj, seed, 'long', 'rectangle'));
    for (let i = 0; i < 20000 && s.phase !== 'over'; i++) applyActionInPlace(s, chooseAction(s)!);
    if (s.winner === null || s.winner === 'draw' as any) draws++; else if (raceOf(s, s.winner as any) === 'frost') frost++; else foes++;
  }
  console.log(obj, 'frost vs', foe, 'frost', frost, foe, foes, 'draws', draws, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
