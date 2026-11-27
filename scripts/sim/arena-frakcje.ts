// Arena balance between the playable factions (digital rules): every pair of different factions, bots on both sides, heroes in turn,
// each faction half of the time in either slot.
// Usage: npx tsx scripts/sim/arena-frakcje.ts [games per pair = 200] [size = 3] [level = normal]
// ARENA_EXTRA='{"offer":{"herds":1},"bonus":{"tides":{"hero":{"hp":2,"attack":1},"support":{"hp":2,"attack":1}}}}' tries other ARENA_RULES.extraOffer / extraPicks / bonus.
// Prints each faction's win rate against each other one and its average.

import { execFile } from 'node:child_process';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { ARENA_RULES, FACTION_HEROES, type FactionId } from '../../src/engine/data';
import { PLAYABLE_IDS } from '../../src/engine/factions';
import { chooseAction } from '../../src/engine/ai';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { seatTable } from '../../src/engine/teams';
import { arenaSetup, type Level } from '../../src/engine/types';

const extra = process.env.ARENA_EXTRA ? JSON.parse(process.env.ARENA_EXTRA) : {};
Object.assign(ARENA_RULES.extraOffer, extra.offer ?? {});
Object.assign(ARENA_RULES.extraPicks, extra.picks ?? {});

/** Wins of faction `a` against faction `b` (a draw counts half). */
function play(a: FactionId, b: FactionId, games: number, size: 3 | 6, level: Level) {
  Object.assign(ARENA_RULES.bonus[size], extra.bonus ?? {});
  let wins = 0;
  let stuck = 0;
  for (let g = 0; g < games; g++) {
    const races: [FactionId, FactionId] = g % 2 ? [b, a] : [a, b];
    const half = Math.floor(g / 2);
    const heroes = [FACTION_HEROES[a][half % FACTION_HEROES[a].length], FACTION_HEROES[b][Math.floor(half / FACTION_HEROES[a].length) % FACTION_HEROES[b].length]];
    if (g % 2) heroes.reverse();
    const seats = seatTable(races.map((race, i) => ({ name: `P${i}`, faction: race as never, race, controller: 'bot' as const, heroId: heroes[i] })));
    const setup = arenaSetup(seats, 1 + g * 7919, level, size);
    const s = createGame({ ...setup, rules: { ...setup.rules, ruleset: 'digital' } });
    for (let i = 0; i < 6000 && s.phase !== 'over'; i++) {
      const action = chooseAction(s);
      if (!action) break;
      applyActionInPlace(s, action);
    }
    if (s.phase !== 'over') stuck++;
    const slot = seats[g % 2].faction;
    if (s.winner === slot) wins++;
    else if (!s.winner) wins += 0.5;
  }
  return { a, b, rate: wins / games, stuck };
}

const self = fileURLToPath(import.meta.url);

if (process.argv[2] === '--job') {
  const [, , , a, b, games, size, level] = process.argv;
  process.stdout.write(JSON.stringify(play(a as FactionId, b as FactionId, Number(games), size === '6' ? 6 : 3, level as Level)));
} else {
  const games = Number(process.argv[2] ?? 200);
  const size = process.argv[3] === '6' ? 6 : 3;
  const level = process.argv[4] ?? 'normal';
  const ids = [...PLAYABLE_IDS] as FactionId[];
  const queue = ids.flatMap((a, i) => ids.slice(i + 1).map((b) => [a, b]));
  const results: Array<ReturnType<typeof play>> = [];
  const run = ([a, b]: FactionId[]) =>
    new Promise<void>((done, fail) =>
      execFile('node', ['--import', 'tsx', self, '--job', a, b, String(games), String(size), level], (err, out) => {
        if (err) return fail(err);
        results.push(JSON.parse(out));
        done();
      }),
    );
  const t0 = Date.now();
  await Promise.all(Array.from({ length: Math.max(1, cpus().length - 1) }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) await run(job);
  }));
  const rate = (a: FactionId, b: FactionId) => {
    const r = results.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))!;
    return r.a === a ? r.rate : 1 - r.rate;
  };
  const pct = (x: number) => `${(100 * x).toFixed(0)}%`;
  console.log(`Arena ${size} na ${size} · ${level} · ${games} partii na parę · dodatki ${JSON.stringify(extra)} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  console.log(['wiersz vs', ...ids, 'średnio'].join('\t'));
  for (const a of ids) {
    const others = ids.filter((b) => b !== a);
    console.log([a, ...ids.map((b) => (a === b ? '—' : pct(rate(a, b)))), pct(others.reduce((m, b) => m + rate(a, b), 0) / others.length)].join('\t'));
  }
  const stuck = results.reduce((m, r) => m + r.stuck, 0);
  if (stuck) console.log(`Niedokończone partie: ${stuck}`);
}
