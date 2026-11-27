// Hero balance in the 3 on 3 arena (digital rules): every hero (3 + the fourth one of each playable faction) against every hero of the other factions,
// bots on both sides at one level, each hero half of the time in either slot. Faction bonuses of the arena stay on, so compare heroes WITHIN a faction.
// Usage: npx tsx scripts/sim/bohaterowie.ts [games per pair = 60] [level = normal] [size = 3]
// Prints each hero's average win rate against the other factions' heroes, its faction's average and the deviation, with the hero's hp/attack.

import { execFile } from 'node:child_process';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { EXTRA_HEROES, FACTION_HEROES, UNITS, type FactionId } from '../../src/engine/data';
import { PLAYABLE_IDS } from '../../src/engine/factions';
import { chooseAction } from '../../src/engine/ai';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { seatTable } from '../../src/engine/teams';
import { arenaSetup, type Level } from '../../src/engine/types';

interface H { faction: FactionId; id: string }
const heroesOf = (f: FactionId): string[] => [...FACTION_HEROES[f], EXTRA_HEROES[f]];

/** Score of hero `a` against hero `b` (a draw counts half). */
function play(a: H, b: H, games: number, size: 3 | 6, level: Level) {
  let score = 0;
  let stuck = 0;
  for (let g = 0; g < games; g++) {
    const pair: [H, H] = g % 2 ? [b, a] : [a, b];
    const seats = seatTable(pair.map((h, i) => ({ name: `P${i}`, faction: h.faction as never, race: h.faction, controller: 'bot' as const, heroId: h.id })));
    const setup = arenaSetup(seats, 1 + g * 7919, level, size);
    const s = createGame({ ...setup, rules: { ...setup.rules, ruleset: 'digital' } });
    for (let i = 0; i < 6000 && s.phase !== 'over'; i++) {
      const action = chooseAction(s);
      if (!action) break;
      applyActionInPlace(s, action);
    }
    if (s.phase !== 'over') stuck++;
    const slot = seats[g % 2].faction;
    if (s.winner === slot) score++;
    else if (!s.winner) score += 0.5;
  }
  return { a: a.id, b: b.id, rate: score / games, stuck };
}

const self = fileURLToPath(import.meta.url);

if (process.argv[2] === '--job') {
  const [, , , af, aid, bf, bid, games, size, level] = process.argv;
  process.stdout.write(JSON.stringify(play({ faction: af as FactionId, id: aid }, { faction: bf as FactionId, id: bid }, Number(games), size === '6' ? 6 : 3, level as Level)));
} else {
  const games = Number(process.argv[2] ?? 60);
  const level = process.argv[3] ?? 'normal';
  const size = process.argv[4] === '6' ? 6 : 3;
  const ids = [...PLAYABLE_IDS] as FactionId[];
  const all: H[] = ids.flatMap((f) => heroesOf(f).map((id) => ({ faction: f, id })));
  const queue: Array<[H, H]> = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (all[i].faction !== all[j].faction) queue.push([all[i], all[j]]);
  const only = process.env.PAIRS ? Number(process.env.PAIRS) : 0;
  if (only) queue.length = Math.min(queue.length, only);
  const total = queue.length;
  const results: Array<ReturnType<typeof play>> = [];
  const run = ([a, b]: [H, H]) =>
    new Promise<void>((done, fail) =>
      execFile('node', ['--import', 'tsx', self, '--job', a.faction, a.id, b.faction, b.id, String(games), String(size), level], (err, out) => {
        if (err) return fail(err);
        results.push(JSON.parse(out));
        done();
      }),
    );
  const t0 = Date.now();
  await Promise.all(Array.from({ length: Math.max(1, cpus().length - 1) }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) await run(job);
  }));
  const avg = (h: H) => {
    const rs = results.filter((r) => r.a === h.id || r.b === h.id).map((r) => (r.a === h.id ? r.rate : 1 - r.rate));
    return { rate: rs.reduce((m, x) => m + x, 0) / Math.max(1, rs.length), n: rs.length };
  };
  const pct = (x: number) => `${(100 * x).toFixed(0)}%`;
  console.log(`Bohaterowie · arena ${size} na ${size} · ${level} · ${games} partii na parę · ${total} par · ±${(100 * 0.5 / Math.sqrt(games * ids.length * 4 - games * 4)).toFixed(0)} pkt na bohatera · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  console.log(['frakcja', 'bohater', 'Ż', 'A', 'S', 'wygrane', 'odch. od frakcji'].join('\t'));
  for (const f of ids) {
    const rows = all.filter((h) => h.faction === f).map((h) => ({ h, ...avg(h) }));
    const mean = rows.reduce((m, r) => m + r.rate, 0) / rows.length;
    for (const r of rows) {
      const u = UNITS[r.h.id];
      console.log([f, `${r.h.id} (${u.name})`, u.hp, u.attack, u.speed, pct(r.rate), `${r.rate - mean >= 0 ? '+' : ''}${(100 * (r.rate - mean)).toFixed(0)}`].join('\t'));
    }
    console.log(`${f}\tśrednia frakcji\t\t\t\t${pct(mean)}\t`);
  }
  const stuck = results.reduce((m, r) => m + r.stuck, 0);
  if (stuck) console.log(`Niedokończone partie: ${stuck}`);
}
