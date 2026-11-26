// The role tuner (backlog 94): for every table of a goal with two roles (the crystals, survival) it finds the step on a ladder of levers at which
// two equal bots (Normal, the author's stand-in for a person) win about as often on either side, and writes src/engine/tuningRolesData.ts.
// Usage: npx tsx scripts/sim/tuneRoles.ts [games per probe = 160]
//   TUNE_GOALS=crystals,survival  TUNE_SIZES=short,medium,long,veryLong,huge,giant  TUNE_PLAYERS=1,2  TUNE_TIERS=zero,adventure,expedition,kingdom,economy,realm,empire
//   TUNE_SHAPES=triangle,rectangle,ring,islands (custom:<map id> for a ready map)  SIM_WORKERS=<processes>
// Entries of tables not in this run are kept. One probe alone: TUNE_PROBE=<cell json>:<step>:<games> prints the Przymierza wins.
// The target: 45-55 percent for the Przymierze (draws count a half); a table that cannot reach it keeps the nearest step (see the comments in the file).

import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { chooseAction } from '../../src/engine/ai';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { FACTION_HEROES, MAP_VARIANTS, type MapSize } from '../../src/engine/data';
import { Rng } from '../../src/engine/rng';
import { ROLE_TUNING, roleKey, type RoleLayer, type RoleTune } from '../../src/engine/tuningRoles';
import { levelSettings, type MapShape, type RulesConfig, type SetupOptions } from '../../src/engine/types';

interface Cell {
  objective: 'crystals' | 'survival';
  zero: boolean;
  map: MapSize;
  players: number;
  growth: boolean;
  layer: RoleLayer;
  shape: MapShape;
  customMapId?: string;
}

const STEPS = { crystals: [-5, 16], survival: [-8, 10] } as const;

/** The levers of a step: above 0 they help the Przymierze, below 0 the Horde. */
export function lever(c: Cell, step: number): Partial<RulesConfig> {
  const none = { resurrections: 0, others: 0 };
  if (c.objective === 'crystals') {
    if (step < 0) return { hordeStartTreasures: { ...none, random: Math.min(5, -step) } };
    if (step === 0) return {};
    const base = MAP_VARIANTS[c.map].startTreasures ?? none;
    // 1-5 treasures, 6-8 two more rounds each, 9-11 one crystal fewer (with 1, 3, 5 treasures), 12 four more rounds, 13 two crystals fewer,
    // 14 eight more rounds, 15 three crystals fewer, 16 twelve more rounds (the big maps, where the Przymierze has the longest way).
    if (step <= 8) return { dawnStartTreasures: { ...base, random: Math.min(5, step) }, ...(step >= 6 ? { roundLimitBonus: 2 * (step - 5) } : {}) };
    return {
      dawnStartTreasures: { ...base, random: Math.min(5, 2 * (step - 9) + 1) },
      crystalsNeededDelta: step >= 15 ? -3 : step >= 13 ? -2 : -1,
      ...(step >= 12 ? { roundLimitBonus: step >= 16 ? 12 : step >= 14 ? 8 : 4 } : {}),
    };
  }
  // Survival: the Przymierze holds out for the rounds; fewer rounds (1-6) and then its own treasures (7-10) help it, Horde treasures and
  // more rounds help the Horde (the map's round limit grows with them, or the game would end first).
  if (step > 0) return { survivalRoundsBonus: -Math.min(6, step), ...(step > 6 ? { dawnStartTreasures: { ...(MAP_VARIANTS[c.map].startTreasures ?? none), random: step - 6 } } : {}) };
  if (step === 0) return {};
  const more = step < -2 ? 2 * (-step - 2) : 0;
  return { hordeStartTreasures: { ...none, random: Math.min(4, -step) }, ...(more ? { survivalRoundsBonus: more, roundLimitBonus: more } : {}) };
}

function setupOf(c: Cell, step: number, seed: number): SetupOptions {
  const rng = new Rng(seed * 7919 + 29);
  const base = levelSettings(c.zero ? 'zero' : 'normal', 'pvp');
  const heroes = { dawn: rng.shuffle(FACTION_HEROES.dawn), horde: rng.shuffle(FACTION_HEROES.horde) };
  const seats = Array.from({ length: c.players }, (_, i) => (['dawn', 'horde'] as const).map((f) => ({ name: `${f}${i}`, faction: f, controller: 'bot' as const, heroId: heroes[f][i], botLevel: 'normal' as const }))).flat();
  const layers: RoleLayer[] = ['none', 'kingdom', 'economy', 'realm', 'empire'];
  const at = layers.indexOf(c.layer);
  const rules: RulesConfig = {
    ...base.rules,
    ruleset: 'digital',
    ...(c.objective !== 'crystals' ? { objective: c.objective } : {}),
    ...(c.growth ? { heroGrowth: true } : {}),
    ...(at >= 1 ? { kingdom: true } : {}),
    ...(at >= 2 ? { economy: true } : {}),
    ...(at >= 3 ? { realm: true } : {}),
    ...(at >= 4 ? { empire: true } : {}),
    ...lever(c, step),
  };
  return { mode: 'pvp', mapSize: c.map, battleMode: base.battleMode, seed, seats, rules, seatLevels: true, ...(c.shape !== 'triangle' ? { mapShape: c.shape, ...(c.customMapId ? { customMapId: c.customMapId } : {}) } : {}) };
}

/** The Przymierza share of wins (draws a half) at one step. */
function probe(c: Cell, step: number, games: number): number {
  // The table's own entry must not stack on the step being measured.
  ROLE_TUNING.length = 0;
  let score = 0;
  for (let g = 1; g <= games; g++) {
    const s = createGame(setupOf(c, step, g));
    for (let i = 0; i < 40000 && s.phase !== 'over'; i++) {
      const a = chooseAction(s);
      if (!a) break;
      try {
        applyActionInPlace(s, a);
      } catch {
        applyActionInPlace(s, s.phase === 'battle' ? { type: 'endActivation' } : { type: 'endTurn' });
      }
    }
    score += s.winner === 'dawn' ? 1 : s.winner ? 0 : 0.5;
  }
  return (100 * score) / games;
}

/** The search for one table: steps towards 50 percent until it is in 45-55 or the rate crosses 50, keeping the nearest. */
function search(c: Cell, games: number, start: number): { step: number; dawnWins: number; tried: Array<[number, number]> } {
  const [lo, hi] = STEPS[c.objective];
  const tried: Array<[number, number]> = [];
  let step = Math.max(lo, Math.min(hi, start));
  for (let n = 0; n < 10; n++) {
    const p = probe(c, step, games);
    tried.push([step, Math.round(p)]);
    if (Math.abs(p - 50) <= 5) break;
    const dir = p < 50 ? 1 : -1;
    const crossed = tried.some(([, q]) => (q - 50) * (p - 50) < 0);
    if (crossed) break;
    const next = step + dir * (Math.abs(p - 50) > 18 ? 2 : 1);
    if (next < lo || next > hi) break;
    step = next;
  }
  const best = tried.reduce((a, b) => (Math.abs(b[1] - 50) < Math.abs(a[1] - 50) ? b : a));
  return { step: best[0], dawnWins: best[1], tried };
}

function cells(): Cell[] {
  const list = (name: string, dflt: string) => (process.env[name] ?? dflt).split(',').filter(Boolean);
  const goals = list('TUNE_GOALS', 'crystals,survival') as Cell['objective'][];
  const sizes = list('TUNE_SIZES', 'short,medium,long,veryLong,huge,giant') as MapSize[];
  const players = list('TUNE_PLAYERS', '1,2').map(Number);
  const tiers = list('TUNE_TIERS', 'zero,adventure,expedition,kingdom,economy,realm,empire');
  const shapes = list('TUNE_SHAPES', 'triangle,rectangle,ring,islands');
  const out: Cell[] = [];
  for (const objective of goals)
    for (const tier of tiers)
      for (const map of sizes)
        for (const p of players) {
          // Level 0 and Przygoda play the crystals on the triangle, without growth; survival needs Wyprawa or more.
          if (tier === 'zero' || tier === 'adventure') {
            if (objective === 'crystals') out.push({ objective, zero: tier === 'zero', map, players: p, growth: false, layer: 'none', shape: 'triangle' });
            continue;
          }
          const layer = (tier === 'expedition' ? 'none' : tier) as RoleLayer;
          for (const sh of shapes) {
            const [shape, customMapId] = sh.split(':') as [MapShape, string | undefined];
            out.push({ objective, zero: false, map, players: p, growth: true, layer, shape, ...(customMapId ? { customMapId } : {}) });
          }
        }
  return out;
}

const DATA = 'src/engine/tuningRolesData.ts';

function write(entries: RoleTune[]) {
  const lines = entries
    .sort((a, b) => roleKey({ ...a, map: a.maps[0] }).localeCompare(roleKey({ ...b, map: b.maps[0] })))
    .map((e) => `  ${JSON.stringify(e)},`);
  writeFileSync(
    DATA,
    `// Generated by scripts/sim/tuneRoles.ts (do not edit by hand; run the tuner again). One entry per table of a goal with two roles: see tuningRoles.ts.\n` +
      `// step = the tuner's step on its ladder of levers (0 none, above 0 helps the Przymierze), dawnWins = the Przymierza wins measured there (Normal bots on both sides).\n` +
      `import type { RoleTune } from './tuningRoles';\n\nexport const ROLE_ENTRIES: RoleTune[] = [\n${lines.join('\n')}\n];\n`,
  );
}

if (process.env.TUNE_PROBE) {
  const [cell, step, games] = process.env.TUNE_PROBE.split(/:(?=[-\d]+:\d+$)|:(?=\d+$)/);
  console.log(probe(JSON.parse(cell), Number(step), Number(games)).toFixed(1));
} else if (process.env.TUNE_CELL) {
  const { cell, games, start } = JSON.parse(process.env.TUNE_CELL) as { cell: Cell; games: number; start: number };
  console.log(JSON.stringify(search(cell, games, start)));
} else if (import.meta.url === `file://${process.argv[1]}`) {
  const games = Number(process.argv[2] ?? 160);
  // TUNE_ONLY_BAD=1: only the tables whose entry is off the 45-55 band (a second pass after the ladders grew).
  const todo = cells().filter((c) => !process.env.TUNE_ONLY_BAD || Math.abs((ROLE_TUNING.find((t) => t.maps.some((m) => roleKey({ ...t, map: m }) === roleKey(c)))?.dawnWins ?? 0) - 50) > 5);
  const old = new Map(ROLE_TUNING.flatMap((t) => t.maps.map((m) => [roleKey({ ...t, map: m }), t] as const)));
  const done = new Map<string, RoleTune>(old);
  const workers = Number(process.env.SIM_WORKERS) || Math.max(1, Math.round(cpus().length * 0.8));
  const t0 = Date.now();
  let next = 0;
  let finished = 0;
  const run = (c: Cell) =>
    new Promise<void>((resolve) => {
      const key = roleKey(c);
      const start = old.get(key)?.step ?? 0;
      execFile('node', ['--import', 'tsx', 'scripts/sim/tuneRoles.ts'], { env: { ...process.env, TUNE_CELL: JSON.stringify({ cell: c, games, start }) }, maxBuffer: 1 << 20 }, (err, out) => {
        finished++;
        if (err) {
          console.log(`BŁĄD ${key}: ${String(err).slice(0, 200)}`);
          return resolve();
        }
        const r = JSON.parse(out.trim().split('\n').pop()!) as ReturnType<typeof search>;
        const { map, ...rest } = c;
        done.set(key, { ...rest, maps: [map], step: r.step, dawnWins: r.dawnWins, rules: lever(c, r.step) } as RoleTune);
        // Written after every table, so a stopped run keeps what it measured.
        write([...done.values()]);
        const mark = Math.abs(r.dawnWins - 50) <= 5 ? ' ' : '!';
        console.log(`${mark} ${key}  krok ${r.step}  Przymierze ${r.dawnWins}%  (próby: ${r.tried.map(([s, p]) => `${s}→${p}`).join(', ')})  [${finished}/${todo.length}, ${Math.round((Date.now() - t0) / 1000)} s]`);
        resolve();
      });
    });
  await Promise.all(Array.from({ length: workers }, async () => { while (next < todo.length) await run(todo[next++]); }));
  console.log(`=== done (${todo.length} stołów, ${Math.round((Date.now() - t0) / 1000)} s)`);
  void readFileSync;
}
