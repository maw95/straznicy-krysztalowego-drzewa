// Hero balance on the adventure map (digital rules, hero growth on): every hero (3 + the fourth one of each playable faction) against every hero of the other factions,
// 1 on 1, two Normal bots, each hero half of the games in either slot. Faction strength is part of the result, so compare heroes WITHIN a faction.
// Usage: npx tsx scripts/sim/bohaterowie-mapa.ts [games per pair = 40] [goal = control] [map = medium] [tier = zero|economy|realm|empire]
// PAIRS=n runs only the first n pairs (timing). Prints each hero's average score, its faction's average and the deviation, with hp/attack/speed.

import { execFile } from 'node:child_process';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { EXTRA_HEROES, FACTION_HEROES, UNITS, type FactionId, type MapSize } from '../../src/engine/data';
import { PLAYABLE_IDS } from '../../src/engine/factions';
import { chooseAction } from '../../src/engine/ai';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { seatTable } from '../../src/engine/teams';
import { levelSettings, type ObjectiveId } from '../../src/engine/types';

interface H { faction: FactionId; id: string }
const heroesOf = (f: FactionId): string[] => [...FACTION_HEROES[f], EXTRA_HEROES[f]];

/** Score of hero `a` against hero `b` (a draw counts half). */
function play(a: H, b: H, games: number, goal: ObjectiveId, map: MapSize, tier: string) {
  let score = 0;
  let stuck = 0;
  let rounds = 0;
  for (let g = 0; g < games; g++) {
    const pair: [H, H] = g % 2 ? [b, a] : [a, b];
    const seats = seatTable(pair.map((h, i) => ({ name: `P${i}`, faction: h.faction as never, race: h.faction, controller: 'bot' as const, heroId: h.id, botLevel: 'normal' as const })));
    const base = levelSettings('normal', 'pvp');
    const rules = {
      ...base.rules,
      ruleset: 'digital' as const,
      heroGrowth: true,
      ...(goal !== 'crystals' ? { objective: goal } : {}),
      ...(tier === 'economy' || tier === 'realm' || tier === 'empire' ? { kingdom: true, economy: true } : {}),
      ...(tier === 'realm' || tier === 'empire' ? { realm: true } : {}),
      ...(tier === 'empire' ? { empire: true } : {}),
    };
    const s = createGame({ mode: 'pvp', mapSize: map, battleMode: base.battleMode, seed: 1 + g * 7919, seats, rules, seatLevels: true });
    for (let i = 0; i < 30000 && s.phase !== 'over'; i++) {
      const action = chooseAction(s);
      if (!action) break;
      try {
        applyActionInPlace(s, action);
      } catch {
        applyActionInPlace(s, s.phase === 'battle' ? { type: 'endActivation' } : { type: 'endTurn' });
      }
    }
    if (s.phase !== 'over') stuck++;
    rounds += s.round;
    const slot = seats[g % 2].faction;
    if (s.winner === slot) score++;
    else if (!s.winner) score += 0.5;
  }
  return { a: a.id, b: b.id, rate: score / games, stuck, rounds: rounds / games };
}

const self = fileURLToPath(import.meta.url);

if (process.argv[2] === '--job') {
  const [, , , af, aid, bf, bid, games, goal, map, tier] = process.argv;
  process.stdout.write(JSON.stringify(play({ faction: af as FactionId, id: aid }, { faction: bf as FactionId, id: bid }, Number(games), goal as ObjectiveId, map as MapSize, tier)));
} else {
  const games = Number(process.argv[2] ?? 40);
  const goal = (process.argv[3] ?? 'control') as ObjectiveId;
  const map = (process.argv[4] ?? 'medium') as MapSize;
  const tier = process.argv[5] ?? 'zero';
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
      execFile('node', ['--import', 'tsx', self, '--job', a.faction, a.id, b.faction, b.id, String(games), goal, map, tier], { maxBuffer: 1 << 20 }, (err, out) => {
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
    return { rate: rs.reduce((m, x) => m + x, 0) / Math.max(1, rs.length) };
  };
  const pct = (x: number) => `${(100 * x).toFixed(0)}%`;
  const rounds = results.reduce((m, r) => m + r.rounds, 0) / Math.max(1, results.length);
  console.log(`Bohaterowie na mapie · cel ${goal} · mapa ${map} · poziom ${tier} · ${games} partii na parę · ${total} par · ok. ±${(100 * 0.5 / Math.sqrt(games * 16)).toFixed(1)} pkt na bohatera · średnio ${rounds.toFixed(1)} rund · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
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
