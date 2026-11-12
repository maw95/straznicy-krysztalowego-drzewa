// Dawn supports compared: the same hero fights with exactly one support (each in turn), against a Horde hero with two random supports,
// 3-on-3-ish arena battles of the digital ruleset, without and with hero growth (level 3, two skills).
// Usage: node --import tsx scripts/sim/supports.ts [battles per support and hero=150]
// Columns: share of wins, the Życie the Przymierze side keeps (share of its maximum), supports lost.

import './override';
import { FACTION_HEROES, FACTION_SUPPORTS, UNITS } from '../../src/engine/data';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { chooseAction } from '../../src/engine/ai';
import { mapNeighbors } from '../../src/engine/map';
import { Rng } from '../../src/engine/rng';
import { DEFAULT_RULES, type GameState } from '../../src/engine/types';

const per = Number(process.argv[2] ?? 150);

function battle(seed: number, heroId: string, support: string, grown: boolean): { won: boolean; kept: number; lost: number } {
  const rng = new Rng(seed * 104729 + 11);
  const opponent = rng.pick(FACTION_HEROES.horde);
  const s: GameState = createGame({
    mode: 'pvp', mapSize: 'medium', battleMode: 'arena', seed,
    seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId }, { name: 'B', faction: 'horde', controller: 'bot', heroId: opponent }],
    rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: grown, abilities: true },
  });
  s.factions.dawn.supportsAlive = [support];
  s.factions.dawn.supportsDead = [];
  s.factions.horde.supportsAlive = rng.shuffle(FACTION_SUPPORTS.horde).slice(0, 2);
  s.factions.horde.supportsDead = [];
  s.rng = seed;
  const dawn = s.heroes[heroId];
  if (grown) Object.assign(dawn, { level: 3, skills: ['might', 'vigor'] });
  const spot = mapNeighbors(s.tiles, dawn.pos).find((k) => !s.tiles[k].home)!;
  s.tiles[spot].revealed = true;
  s.tiles[spot].side = rng.next() < 0.5 ? 'dawn' : 'horde';
  s.tiles[spot].terrain = 'meadow';
  for (const h of Object.values(s.heroes)) if (h.faction === 'horde' && h.id !== opponent) h.alive = false;
  s.heroes[opponent].pos = spot;
  s.turnIndex = s.turnOrder.indexOf(heroId);
  s.movePoints = 2;
  s.turnBattleDone = false;
  applyActionInPlace(s, { type: 'moveHero', to: spot });
  let b = s.battle!;
  for (let i = 0; i < 3000 && s.phase === 'battle'; i++) {
    if (s.battle) b = s.battle;
    if (s.battle?.winner) break;
    applyActionInPlace(s, chooseAction(s)!);
  }
  if (s.battle) b = s.battle;
  const mine = Object.values(b.units).filter((u) => u.side === 'dawn');
  const max = mine.reduce((a, u) => a + u.maxHp, 0);
  return {
    won: b.winner === 'dawn',
    kept: max ? mine.reduce((a, u) => a + (u.alive ? Math.max(0, u.hp) : 0), 0) / max : 0,
    lost: mine.filter((u) => UNITS[u.defId].kind === 'support' && !u.alive).length,
  };
}

for (const grown of [false, true]) {
  console.log(`\n${grown ? 'Z rozwojem (3. poziom, Moc + Wigor)' : 'Bez rozwoju'}: % wygranych · zachowane Życie · strata pomocnika; wiersze: pomocnik, kolumny: bohater`);
  console.log(''.padEnd(10) + FACTION_HEROES.dawn.map((h) => h.padStart(22)).join('') + 'Razem'.padStart(10));
  let seed = 1;
  for (const sup of FACTION_SUPPORTS.dawn.filter((x) => !process.env.SIM_SUPPORT || x === process.env.SIM_SUPPORT)) {
    let tw = 0, tn = 0;
    const cols = FACTION_HEROES.dawn.map((h) => {
      let w = 0, kept = 0, lost = 0;
      for (let i = 0; i < per; i++) {
        const o = battle(seed++, h, sup, grown);
        if (o.won) w++;
        kept += o.kept;
        lost += o.lost;
      }
      tw += w; tn += per;
      return `${((w / per) * 100).toFixed(0)}% · ${((kept / per) * 100).toFixed(0)}% · ${(lost / per).toFixed(2)}`.padStart(22);
    });
    console.log(sup.padEnd(10) + cols.join('') + `${((tw / tn) * 100).toFixed(1)}%`.padStart(10));
  }
}
