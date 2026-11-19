// Balance matrix of the four new factions (gate G2): every new faction against dawn and horde, plus the six pairs between themselves.
// SIM_OVERRIDE (see override.ts) is inherited by the shards: try a number before editing the data.
// Usage: npx tsx scripts/sim/nowe-frakcje.ts [games per cell = 200] [goals = control,conquest] [pairs = all | herds:dawn,clans:frost ...] [size = long] [shape = rectangle]
// Games are sharded over child processes (CPU count - 1); seats alternate by seed. Each cell prints: wins of A / B / draws, A's share and a 95% interval.
// A cell of 200 games takes well under a minute; a whole matrix (14 pairs x 2 goals) a few minutes. Env SIM_TIMEOUT_S (default 170) stops a shard politely.
import { fork } from 'node:child_process';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import './override';
import { createGame, applyActionInPlace } from '../../src/engine/game';
import { chooseAction } from '../../src/engine/ai';
import { FACTION_HEROES } from '../../src/engine/data';
import { assignSlots, raceOf } from '../../src/engine/teams';
import { DEFAULT_RULES, type SetupOptions } from '../../src/engine/types';

type Race = 'dawn' | 'horde' | 'herds' | 'undead' | 'clans' | 'frost';
const NEW: Race[] = ['herds', 'undead', 'clans', 'frost'];
const allPairs = (): string[] => [...NEW.flatMap((n) => [`${n}:dawn`, `${n}:horde`]), ...NEW.flatMap((a, i) => NEW.slice(i + 1).map((b) => `${a}:${b}`))];

const mk = (races: Race[], objective: any, seed: number, size: any, shape: any): SetupOptions => {
  const slots = assignSlots(races as any);
  return { mode: 'pvp', mapSize: size, battleMode: 'arena', seed, mapShape: shape, seats: races.map((race, i) => ({ name: race + i, faction: slots[i], race: race as any, controller: 'bot' as const, heroId: (FACTION_HEROES as any)[race][seed % 3] })), rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, objective } };
};

if (process.argv[2] === '--shard') {
  // child: --shard A B objective from to size shape
  const [, , , a, b, objective, from, to, size, shape] = process.argv;
  const deadline = Date.now() + Number(process.env.SIM_TIMEOUT_S ?? 170) * 1000;
  let wa = 0, wb = 0, draws = 0, done = 0;
  for (let seed = Number(from); seed <= Number(to) && Date.now() < deadline; seed++) {
    const order = (seed % 2 ? [a, b] : [b, a]) as Race[];
    const s = createGame(mk(order, objective, seed, size, shape));
    for (let i = 0; i < 20000 && s.phase !== 'over'; i++) applyActionInPlace(s, chooseAction(s)!);
    done++;
    if (s.winner === null || (s.winner as any) === 'draw') draws++; else if (raceOf(s, s.winner as any) === a) wa++; else wb++;
  }
  process.send!({ wa, wb, draws, done });
  process.exit(0);
}

const N = Number(process.argv[2] ?? 200);
const goals = (process.argv[3] ?? 'control,conquest').split(',');
const pairsArg = process.argv[4] ?? 'all';
const pairs = pairsArg === 'all' ? allPairs() : pairsArg.split(',');
const size = process.argv[5] ?? 'long';
const shape = process.argv[6] ?? 'rectangle';
const workers = Math.max(1, Math.min(cpus().length - 1, 12));
const run = (a: string, b: string, objective: string) => new Promise<{ wa: number; wb: number; draws: number; done: number }>((resolve) => {
  const tot = { wa: 0, wb: 0, draws: 0, done: 0 };
  let left = workers;
  const per = Math.ceil(N / workers);
  for (let w = 0; w < workers; w++) {
    const from = w * per + 1, to = Math.min(N, (w + 1) * per);
    const ch = fork(fileURLToPath(import.meta.url), ['--shard', a, b, objective, String(from), String(to), size, shape], { execArgv: ['--import', 'tsx'] });
    ch.on('message', (m: any) => { tot.wa += m.wa; tot.wb += m.wb; tot.draws += m.draws; tot.done += m.done; });
    ch.on('exit', () => { if (--left === 0) resolve(tot); });
  }
});

console.log(`# ${N} games per cell, size ${size}/${shape}, workers ${workers}; share of the first faction (95% interval)`);
for (const pair of pairs) {
  const [a, b] = pair.split(':');
  const cells: string[] = [];
  for (const goal of goals) {
    const t0 = Date.now();
    const r = await run(a, b, goal);
    const n = r.wa + r.wb;
    const p = n ? r.wa / n : 0;
    const ci = n ? 1.96 * Math.sqrt((p * (1 - p)) / n) : 0;
    cells.push(`${goal} ${(100 * p).toFixed(0)}% ±${(100 * ci).toFixed(0)} (${r.wa}-${r.wb}${r.draws ? `, ${r.draws} dr` : ''}, n=${r.done}, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  console.log(`${a} vs ${b}: ${cells.join(' | ')}`);
}
