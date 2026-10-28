// Arena balance: every Przymierze line-up (hero + 2 of 3 supports) against every Horde line-up,
// bots on both sides drafting treasures, random arena and first pick.
// Usage: npx tsx scripts/sim/arena.ts [games per match-up = 100] [bot level = normal] [label]
// SIM_OVERRIDE (see override.ts) tries changed units or abilities; results go to .tmp/sim/arena-<label>.json.
// Prints win rates per hero, per support pair and per full line-up.

import './override';
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { FACTION_HEROES, FACTION_SUPPORTS, UNITS, type FactionId } from '../../src/engine/data';
import { chooseAction } from '../../src/engine/ai';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { arenaSetup, type Level } from '../../src/engine/types';

interface LineUp {
  hero: string;
  supports: string[];
}
const pairs = (f: FactionId) => FACTION_SUPPORTS[f].map((left) => FACTION_SUPPORTS[f].filter((s) => s !== left));
const lineUps = (f: FactionId): LineUp[] => FACTION_HEROES[f].flatMap((hero) => pairs(f).map((supports) => ({ hero, supports })));
const name = (l: LineUp) => `${UNITS[l.hero].name} + ${l.supports.map((s) => UNITS[s].name).join(', ')}`;

/** Plays `games` matches of one Przymierze line-up against one Horde line-up; returns Przymierze wins and draws. */
function play(dawn: LineUp, horde: LineUp, games: number, level: Level, seed0: number) {
  let wins = 0;
  let draws = 0;
  let rounds = 0;
  for (let g = 0; g < games; g++) {
    const s = createGame(
      arenaSetup(
        [
          { name: 'P', faction: 'dawn', controller: 'bot', heroId: dawn.hero },
          { name: 'H', faction: 'horde', controller: 'bot', heroId: horde.hero },
        ],
        seed0 + g,
        level,
      ),
    );
    for (let i = 0; i < 4000 && s.phase !== 'over'; i++) {
      const b = s.battle;
      const a =
        b?.stage === 'select'
          ? { type: 'selectSupports' as const, faction: b.needsSelection[0], supportIds: (b.needsSelection[0] === 'dawn' ? dawn : horde).supports }
          : chooseAction(s);
      if (!a) break;
      applyActionInPlace(s, a);
    }
    if (s.winner === 'dawn') wins++;
    else if (!s.winner) draws++;
    rounds += s.lastBattle?.rounds ?? 0;
  }
  return { wins, draws, rounds };
}

const self = fileURLToPath(import.meta.url);

if (process.argv[2] === '--job') {
  // Worker: one Przymierze line-up against all Horde line-ups.
  const [, , , di, games, level] = process.argv;
  const dawn = lineUps('dawn')[Number(di)];
  const out = lineUps('horde').map((horde, hi) => ({ di: Number(di), hi, ...play(dawn, horde, Number(games), level as Level, 1 + hi * 100_000 + Number(di) * 1_000_000) }));
  process.stdout.write(JSON.stringify(out));
} else {
  const games = Number(process.argv[2] ?? 100);
  const level = (process.argv[3] ?? 'normal') as Level;
  const D = lineUps('dawn');
  const H = lineUps('horde');
  const results: Array<{ di: number; hi: number; wins: number; draws: number; rounds: number }> = [];
  let next = 0;
  const run = (di: number) =>
    new Promise<void>((done, fail) =>
      execFile('node', ['--import', 'tsx', self, '--job', String(di), String(games), level], { maxBuffer: 16 << 20 }, (err, out) => {
        if (err) return fail(err);
        results.push(...JSON.parse(out));
        done();
      }),
    );
  await Promise.all(Array.from({ length: Math.min(D.length, Math.max(1, cpus().length - 1)) }, async () => {
    while (next < D.length) await run(next++);
  }));
  const pct = (w: number, n: number) => `${((100 * w) / n).toFixed(1)}%`.padStart(6);
  const sum = (rows: typeof results) => rows.reduce((a, r) => ({ wins: a.wins + r.wins, draws: a.draws + r.draws, rounds: a.rounds + r.rounds }), { wins: 0, draws: 0, rounds: 0 });
  const all = sum(results);
  mkdirSync('.tmp/sim', { recursive: true });
  writeFileSync(`.tmp/sim/arena-${process.argv[4] ?? 'last'}.json`, JSON.stringify({ games, level, lineUps: { dawn: D, horde: H }, results }, null, 1));
  const n = results.length * games;
  console.log(`\nArena · ${games} partii na starcie · bot ${level} · razem ${n} partii`);
  console.log(`Przymierze wygrywa ${pct(all.wins, n)} · remisy ${pct(all.draws, n)} · śr. rund bitwy ${(all.rounds / n).toFixed(1)}`);
  const by = (label: string, keys: Array<[string, (r: (typeof results)[number]) => boolean]>, side: FactionId) => {
    console.log(`\n${label} (wygrane ${side === 'dawn' ? 'Przymierza' : 'Hordy'}):`);
    for (const [k, f] of keys) {
      const rows = results.filter(f);
      const s = sum(rows);
      const m = rows.length * games;
      const w = side === 'dawn' ? s.wins : m - s.wins - s.draws;
      console.log(`  ${k.padEnd(48)} ${pct(w, m)}`);
    }
  };
  by('Bohaterowie Przymierza', FACTION_HEROES.dawn.map((h) => [UNITS[h].name, (r) => D[r.di].hero === h]), 'dawn');
  by('Bohaterowie Hordy', FACTION_HEROES.horde.map((h) => [UNITS[h].name, (r) => H[r.hi].hero === h]), 'horde');
  by('Pary pomocników Przymierza', pairs('dawn').map((p) => [p.map((s) => UNITS[s].name).join(' + '), (r) => D[r.di].supports.join() === p.join()]), 'dawn');
  by('Pary pomocników Hordy', pairs('horde').map((p) => [p.map((s) => UNITS[s].name).join(' + '), (r) => H[r.hi].supports.join() === p.join()]), 'horde');
  const lineRate = (side: FactionId) =>
    (side === 'dawn' ? D : H)
      .map((l, i) => {
        const rows = results.filter((r) => (side === 'dawn' ? r.di : r.hi) === i);
        const s = sum(rows);
        const m = rows.length * games;
        return { l, rate: (side === 'dawn' ? s.wins : m - s.wins - s.draws) / m };
      })
      .sort((a, b) => b.rate - a.rate);
  for (const side of ['dawn', 'horde'] as FactionId[]) {
    console.log(`\nSkłady ${side === 'dawn' ? 'Przymierza' : 'Hordy'} od najsilniejszego:`);
    for (const { l, rate } of lineRate(side)) console.log(`  ${name(l).padEnd(60)} ${(rate * 100).toFixed(1)}%`);
  }
  // What players will actually pick: the strongest line-ups against each other.
  const top = (side: FactionId) => lineRate(side).slice(0, 3).map(({ l }) => (side === 'dawn' ? D : H).indexOf(l));
  console.log('\nNajsilniejsze składy przeciw sobie (wygrane Przymierza):');
  for (const di of top('dawn'))
    console.log(`  ${name(D[di]).padEnd(48)} ${top('horde').map((hi) => { const r = results.find((x) => x.di === di && x.hi === hi)!; return `${pct(r.wins, games)} vs ${UNITS[H[hi].hero].name.split(' ')[0]}/${H[hi].supports.map((x) => UNITS[x].name.split(' ')[0]).join('+')}`; }).join('  ')}`);
}
