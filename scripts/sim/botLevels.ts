// Difficulty of the bots (backlog 94): a Hard bot stands in for the person and plays one bot of each level, half of the games on each side so the
// sides' differences cancel out. Prints the stand-in's wins (draws count a half) against the bands: Easy 65-85, Normal 45-65, Hard 30-45, Very hard 15-30.
// Usage: npx tsx scripts/sim/botLevels.ts [games per cell = 60] [goals = control,boss,artifact] [maps = short,medium] [growth = 1]
// Each cell (goal × map × level) runs in its own process (SIM_WORKERS caps how many at once). A cell alone: BOT_CELL=goal:map:level:growth:games.

import { execFile } from 'node:child_process';
import { cpus } from 'node:os';
import { chooseAction } from '../../src/engine/ai';
import { createGame, applyActionInPlace } from '../../src/engine/game';
import { FACTION_HEROES, type MapSize } from '../../src/engine/data';
import { Rng } from '../../src/engine/rng';
import { levelSettings, type BotLevel, type ObjectiveId, type SetupOptions } from '../../src/engine/types';

const LEVELS: BotLevel[] = ['kids', 'normal', 'hard', 'veryHard'];
const BANDS: Record<BotLevel, [number, number]> = { kids: [65, 85], normal: [45, 65], hard: [30, 45], veryHard: [15, 30] };
const NAMES: Record<BotLevel, string> = { kids: 'Łatwy', normal: 'Normalny', hard: 'Trudny', veryHard: 'B. trudny' };

export function levelSetup(objective: ObjectiveId, mapSize: MapSize, level: BotLevel, growth: boolean, seed: number): { setup: SetupOptions; proxy: 'dawn' | 'horde' } {
  const rng = new Rng(seed * 7919 + 17);
  const proxy = seed % 2 ? 'dawn' : 'horde';
  const base = levelSettings('normal', 'pvp');
  const seat = (f: 'dawn' | 'horde') => ({ name: f, faction: f, controller: 'bot' as const, heroId: rng.pick(FACTION_HEROES[f]), botLevel: f === proxy ? ('hard' as const) : level });
  const rules = { ...base.rules, ruleset: 'digital' as const, ...(objective !== 'crystals' ? { objective } : {}), ...(growth ? { heroGrowth: true } : {}) };
  return { setup: { mode: 'pvp', mapSize, battleMode: base.battleMode, seed, seats: [seat('dawn'), seat('horde')], rules, seatLevels: true }, proxy };
}

function playCell(objective: ObjectiveId, mapSize: MapSize, level: BotLevel, growth: boolean, games: number): { wins: number; draws: number; games: number; dawn: number } {
  let wins = 0;
  let draws = 0;
  let dawn = 0;
  for (let g = 1; g <= games; g++) {
    const { setup, proxy } = levelSetup(objective, mapSize, level, growth, g);
    const s = createGame(setup);
    for (let i = 0; i < 30000 && s.phase !== 'over'; i++) {
      const a = chooseAction(s);
      if (!a) break;
      try {
        applyActionInPlace(s, a);
      } catch {
        applyActionInPlace(s, s.phase === 'battle' ? { type: 'endActivation' } : { type: 'endTurn' });
      }
    }
    if (s.winner === 'dawn') dawn++;
    if (s.winner === proxy) wins++;
    else if (!s.winner) draws++;
  }
  return { wins, draws, games, dawn };
}

if (process.env.BOT_CELL) {
  const [objective, map, level, growth, games] = process.env.BOT_CELL.split(':');
  console.log(JSON.stringify(playCell(objective as ObjectiveId, map as MapSize, level as BotLevel, growth === '1', Number(games))));
} else if (import.meta.url === `file://${process.argv[1]}`) {
  const games = Number(process.argv[2] ?? 60);
  const goals = (process.argv[3] ?? 'control,boss,artifact').split(',') as ObjectiveId[];
  const maps = (process.argv[4] ?? 'short,medium').split(',') as MapSize[];
  const growth = (process.argv[5] ?? '1') === '1';
  const cells = goals.flatMap((o) => maps.flatMap((m) => LEVELS.map((l) => ({ o, m, l }))));
  const results = new Map<string, { wins: number; draws: number; games: number; dawn: number }>();
  let next = 0;
  const run = (c: (typeof cells)[number]) =>
    new Promise<void>((done, fail) =>
      execFile('node', ['--import', 'tsx', 'scripts/sim/botLevels.ts'], { env: { ...process.env, BOT_CELL: `${c.o}:${c.m}:${c.l}:${growth ? 1 : 0}:${games}` }, maxBuffer: 1 << 20 }, (err, out) => {
        if (err) return fail(err);
        results.set(`${c.o}:${c.m}:${c.l}`, JSON.parse(out.trim().split('\n').pop()!));
        done();
      }),
    );
  const workers = Number(process.env.SIM_WORKERS) || Math.max(1, Math.round(cpus().length * 0.8));
  await Promise.all(Array.from({ length: workers }, async () => { while (next < cells.length) await run(cells[next++]); }));
  console.log(`Wygrane bota Trudnego (zastępca gracza) z botem poziomu X, ${games} gier na komórkę, ${growth ? 'z rozwojem' : 'bez rozwoju'} (remis = pół):`);
  console.log(['cel', 'mapa', ...LEVELS.map((l) => `${NAMES[l]} ${BANDS[l][0]}-${BANDS[l][1]}`), 'role: Przymierze (Trudny–Trudny)'].map((x, i) => x.padEnd(i < 2 ? 10 : 18)).join(''));
  const total = new Map<BotLevel, { w: number; g: number }>();
  for (const o of goals)
    for (const m of maps) {
      const row = LEVELS.map((l) => {
        const r = results.get(`${o}:${m}:${l}`)!;
        const t = total.get(l) ?? { w: 0, g: 0 };
        total.set(l, { w: t.w + r.wins + r.draws / 2, g: t.g + r.games });
        const pct = Math.round((100 * (r.wins + r.draws / 2)) / r.games);
        const ok = pct >= BANDS[l][0] && pct <= BANDS[l][1] ? ' ' : '!';
        return `${pct}%${ok}`.padEnd(18);
      });
      const mirror = results.get(`${o}:${m}:hard`)!;
      console.log([o.padEnd(10), m.padEnd(10), ...row, `${Math.round((100 * mirror.dawn) / mirror.games)}%`].join(''));
    }
  console.log(['razem'.padEnd(20), ...LEVELS.map((l) => `${Math.round((100 * total.get(l)!.w) / total.get(l)!.g)}%`.padEnd(18))].join(''));
}
