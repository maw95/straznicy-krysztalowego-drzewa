// Battle tournament: isolated battles under equal conditions, to compare units.
// Usage: npx tsx scripts/sim/battles.ts [battles per pairing=300] [options=full]
//   options: full, noabilities, dice (comma separated)
//
// 1. Every Przymierze hero against every Horda hero, 3 on 3 on the arena, supports drawn
//    at random, attacker and arena at random.
// 2. The same pairs in a 1-on-1 duel (the "board" variant).
// 3. Every Przymierze hero with two random supports against each guardian.

import './override';
import { FACTION_HEROES, FACTION_SUPPORTS, GUARDIANS, UNITS, type FactionId } from '../../src/engine/data';
import { applyAction, createGame } from '../../src/engine/game';
import { chooseAction } from '../../src/engine/ai';
import { mapNeighbors } from '../../src/engine/map';
import { Rng } from '../../src/engine/rng';
import { DEFAULT_RULES, type GameState } from '../../src/engine/types';

const per = Number(process.argv[2] ?? 300);
const opts = (process.argv[3] ?? 'full').split(',');
const rules = { ...DEFAULT_RULES, abilities: !opts.includes('noabilities'), useDice: opts.includes('dice') };

interface Outcome {
  attackerWon: boolean;
  dawnWon: boolean;
  dawnSupportsLost: number;
  survivors: string[];
}

function battleDetail(seed: number, d: string, h: string): { winner: string; supports: Array<[string, string]> } {
  battle(seed, d, h, false, false);
  const r = lastReport!;
  return { winner: r.winner, supports: r.units.filter((u) => UNITS[u.defId].kind === 'support').map((u) => [u.defId, u.side]) };
}

let lastReport: GameState['lastBattle'] = null;

function battle(seed: number, dawnHero: string, opponent: string, duel: boolean, guardian: boolean): Outcome {
  const rng = new Rng(seed * 104729 + 7);
  const seats = guardian
    ? [{ name: 'A', faction: 'dawn' as FactionId, controller: 'bot' as const, heroId: dawnHero }]
    : [
        { name: 'A', faction: 'dawn' as FactionId, controller: 'bot' as const, heroId: dawnHero },
        { name: 'B', faction: 'horde' as FactionId, controller: 'bot' as const, heroId: opponent },
      ];
  let s: GameState = createGame({ mode: guardian ? 'coop' : 'pvp', mapSize: 'medium', battleMode: duel ? 'board' : 'arena', seed, seats, rules });
  for (const f of ['dawn', 'horde'] as FactionId[]) {
    s.factions[f].supportsAlive = rng.shuffle(FACTION_SUPPORTS[f]).slice(0, 2);
    s.factions[f].supportsDead = [];
  }
  s.rng = seed;
  const dawn = s.heroes[dawnHero];
  // A free hex next to the Przymierze hero; its half of the map picks the arena.
  const spot = mapNeighbors(s.tiles, dawn.pos).find((k) => s.tiles[k].terrain !== 'mountain' && s.tiles[k].terrain !== 'chasm' && !s.tiles[k].home)!;
  s.tiles[spot].revealed = true;
  s.tiles[spot].side = rng.next() < 0.5 ? 'dawn' : 'horde';
  s.tiles[spot].terrain = 'meadow';
  for (const h of Object.values(s.heroes)) if (h.faction === 'horde' && h.id !== opponent) h.alive = false;
  let attackerIsDawn = true;
  if (guardian) {
    const c = Object.values(s.crystals)[0];
    s.tiles[c.at].crystalId = null;
    c.at = spot;
    c.guardian = opponent;
    s.tiles[spot].crystalId = c.id;
  } else {
    const evil = s.heroes[opponent];
    attackerIsDawn = rng.next() < 0.5;
    if (attackerIsDawn) evil.pos = spot;
    else {
      evil.pos = spot;
      // The Horde hero attacks from the spot onto the Przymierze hero.
      s.turnIndex = s.turnOrder.indexOf(opponent);
    }
  }
  if (attackerIsDawn) s.turnIndex = s.turnOrder.indexOf(dawnHero);
  s.movePoints = 2;
  s.turnBattleDone = false;
  const attacker = attackerIsDawn ? dawn : s.heroes[opponent];
  const target = attackerIsDawn ? spot : dawn.pos;
  s = applyAction(s, { type: 'moveHero', to: target });
  void attacker;
  for (let i = 0; i < 5000 && s.phase === 'battle'; i++) s = applyAction(s, chooseAction(s)!);
  const r = s.lastBattle!;
  lastReport = r;
  return {
    attackerWon: r.winner === r.attacker,
    dawnWon: r.winner === 'dawn',
    dawnSupportsLost: r.units.filter((u) => u.side === 'dawn' && UNITS[u.defId].kind === 'support' && !u.alive).length,
    survivors: r.units.filter((u) => u.alive).map((u) => u.defId),
  };
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`.padStart(7);
let seed = 1;

// SIM_ONLY=guardians skips the hero tables.
const only = process.env.SIM_ONLY;
for (const duel of only === 'guardians' ? [] : [false, true]) {
  console.log(`\n${duel ? 'Pojedynki 1 na 1' : 'Bitwy 3 na 3'} (${opts.join(',')}) — % wygranych Przymierza; wiersze: Przymierze, kolumny: Horda`);
  console.log(''.padEnd(16) + FACTION_HEROES.horde.map((h) => h.padStart(14)).join(''));
  const supportWins: Record<string, [number, number]> = {};
  let attackerWins = 0;
  let total = 0;
  let dawnTotal = 0;
  for (const d of FACTION_HEROES.dawn) {
    const row: string[] = [];
    for (const h of FACTION_HEROES.horde) {
      let w = 0;
      for (let i = 0; i < per; i++) {
        const o = battle(seed++, d, h, duel, false);
        if (o.dawnWon) w++;
        if (o.attackerWon) attackerWins++;
        total++;
        for (const id of o.survivors) void id;
      }
      dawnTotal += w;
      row.push(pct(w / per).padStart(14));
    }
    console.log(d.padEnd(16) + row.join(''));
  }
  console.log(`Razem Przymierze: ${pct(dawnTotal / total)} · wygrane atakującego: ${pct(attackerWins / total)}`);
  void supportWins;
}

for (const duel of [false, true]) {
  console.log(`\n${duel ? 'Pojedynki ze strażnikami' : 'Walki ze strażnikami'} — % wygranych Przymierza / śr. strata pomocników`);
  console.log(''.padEnd(16) + GUARDIANS.map((g) => g.padStart(18)).join(''));
  for (const d of FACTION_HEROES.dawn) {
    const row: string[] = [];
    for (const g of GUARDIANS) {
      let w = 0;
      let lost = 0;
      for (let i = 0; i < per; i++) {
        const o = battle(seed++, d, g, duel, true);
        if (o.dawnWon) w++;
        lost += o.dawnSupportsLost;
      }
      row.push(`${pct(w / per)} / ${(lost / per).toFixed(2)}`.padStart(18));
    }
    console.log(d.padEnd(16) + row.join(''));
  }
}

if (only !== 'guardians') supportsTable();

function supportsTable() {
// Supports: each pair of supports for each faction, against random opponents (3 on 3).
console.log('\nPomocnicy — % wygranych swojej strony, gdy biorą udział (bitwy 3 na 3, losowi bohaterowie)');
const supportStats: Record<string, [number, number]> = {};
for (let i = 0; i < per * 6; i++) {
  const d = FACTION_HEROES.dawn[i % 3];
  const h = FACTION_HEROES.horde[Math.floor(i / 3) % 3];
  const o = battleDetail(seed++, d, h);
  for (const [id, side] of o.supports) {
    const t = (supportStats[id] ??= [0, 0]);
    t[0]++;
    if (o.winner === side) t[1]++;
  }
}
for (const [id, [n, w]] of Object.entries(supportStats).sort()) console.log(`  ${id.padEnd(14)} ${String(n).padStart(6)} ${pct(w / n)}`);
}
