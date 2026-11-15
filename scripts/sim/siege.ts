// Level 4 sieges for bots: a hero with its team storms a settlement held by a garrison (and optionally its hero), by the level of the walls.
// Prints the attacker's win rate, battle rounds and the Życie the attacker's side lost. Usage: node --import tsx scripts/sim/siege.ts [battles=60]
import { chooseAction } from '../../src/engine/ai';
import { applyAction, applyActionInPlace, createGame } from '../../src/engine/game';
import { settlementAt } from '../../src/engine/kingdom';
import { mapNeighbors } from '../../src/engine/map';
import { DEFAULT_RULES, type GameState } from '../../src/engine/types';

const n = Number(process.argv[2] ?? 60);
const rules = { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true } as const;
const HEROES = { dawn: ['goldDragon', 'unicornKing', 'ancientBear'], horde: ['werewolfLord', 'blackDragon', 'ironFistOgre'] };

function battle(seed: number, garrison: number, walls: number, withHero: boolean): { won: boolean; rounds: number; lost: number } {
  const s: GameState = createGame({ mode: 'pvp', mapSize: 'medium', battleMode: 'arena', seed, rules, seats: [
    { name: 'A', faction: 'dawn', controller: 'bot', heroId: HEROES.dawn[seed % 3] },
    { name: 'B', faction: 'horde', controller: 'bot', heroId: HEROES.horde[seed % 3] },
  ] });
  const home = settlementAt(s, Object.values(s.tiles).find((t) => t.home === 'dawn')!.key)!;
  const fs = s.factions.dawn;
  home.garrison = fs.supportsAlive.splice(0, garrison);
  home.buildings.walls = walls;
  const dawn = Object.values(s.heroes).find((h) => h.faction === 'dawn')!;
  const horde = Object.values(s.heroes).find((h) => h.faction === 'horde')!;
  if (!withHero) dawn.pos = Object.values(s.tiles).find((t) => t.home === 'horde')!.key;
  const next = mapNeighbors(s.tiles, home.at).find((k) => !s.tiles[k].crystalId)!;
  horde.pos = next;
  s.tiles[home.at].revealed = s.tiles[next].revealed = true;
  s.turnIndex = s.turnOrder.indexOf(horde.id);
  s.movePoints = 9;
  let g = applyAction(s, { type: 'moveHero', to: home.at });
  let rounds = 0, lost = 0;
  for (let i = 0; i < 5000 && g.phase === 'battle'; i++) {
    rounds = g.battle!.round;
    lost = Object.values(g.battle!.units).filter((u) => u.side === 'horde').reduce((a, u) => a + (u.maxHp - Math.max(0, u.hp)), 0);
    applyActionInPlace(g, chooseAction(g)!);
  }
  return { won: g.lastBattle?.winner === 'horde', rounds, lost };
}

console.log('obrona'.padEnd(34) + 'atak wygrywa%'.padStart(14) + 'rundy'.padStart(8) + 'stracone Ż'.padStart(12));
for (const withHero of [false, true]) for (const garrison of withHero ? [0, 2] : [1, 2, 3]) for (const walls of [0, 1, 2]) {
  let won = 0, rounds = 0, lost = 0;
  for (let seed = 1; seed <= n; seed++) { const r = battle(seed, garrison, walls, withHero); won += r.won ? 1 : 0; rounds += r.rounds; lost += r.lost; }
  console.log(`${withHero ? 'bohater + ' : ''}garnizon ${garrison}, umocnienia ${walls}`.padEnd(34) + ((won / n) * 100).toFixed(0).padStart(14) + (rounds / n).toFixed(1).padStart(8) + (lost / n).toFixed(1).padStart(12));
}
