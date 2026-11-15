// Utility of every level 3 recruit (tiers 1-5) of both factions: the same hero fights an enemy hero with two random tier 1 supports,
// with exactly one recruit (or none) at its side, digital arena battles, hero grown to level 3. Base for the recruit prices (RECRUIT_COSTS).
// Usage: node --import tsx scripts/sim/recruitValue.ts [battles per recruit and hero=120]
// Columns: share of wins and the Życie kept, per tier; the "none" row is the baseline (hero alone).

import './override';
import { FACTION_HEROES, FACTION_SUPPORTS, UNITS, type FactionId } from '../../src/engine/data';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { chooseAction } from '../../src/engine/ai';
import { RECRUITS } from '../../src/engine/kingdom';
import { mapNeighbors } from '../../src/engine/map';
import { Rng } from '../../src/engine/rng';
import { DEFAULT_RULES, type GameState } from '../../src/engine/types';

const per = Number(process.argv[2] ?? 120);

function battle(seed: number, faction: FactionId, heroId: string, recruit: string | null, enemyRecruit?: string): { won: boolean; kept: number } {
  const enemy: FactionId = faction === 'dawn' ? 'horde' : 'dawn';
  const rng = new Rng(seed * 104729 + 11);
  const opponent = rng.pick(FACTION_HEROES[enemy]);
  const s: GameState = createGame({
    mode: 'pvp', mapSize: 'medium', battleMode: 'arena', seed,
    seats: [{ name: 'A', faction, controller: 'bot', heroId }, { name: 'B', faction: enemy, controller: 'bot', heroId: opponent }],
    rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, abilities: true },
  });
  s.factions[faction].supportsAlive = recruit ? [recruit] : [];
  s.factions[faction].supportsDead = [];
  s.factions[enemy].supportsAlive = enemyRecruit ? [enemyRecruit] : rng.shuffle(FACTION_SUPPORTS[enemy]).slice(0, 2);
  s.factions[enemy].supportsDead = [];
  s.rng = seed;
  const me = s.heroes[heroId];
  Object.assign(me, { level: 3, skills: ['might', 'vigor'] });
  Object.assign(s.heroes[opponent], { level: 3, skills: ['might', 'vigor'] });
  const spot = mapNeighbors(s.tiles, me.pos).find((k) => !s.tiles[k].home)!;
  s.tiles[spot].revealed = true;
  s.tiles[spot].side = rng.next() < 0.5 ? faction : enemy;
  s.tiles[spot].terrain = 'meadow';
  for (const h of Object.values(s.heroes)) if (h.faction === enemy && h.id !== opponent) h.alive = false;
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
  const mine = Object.values(b.units).filter((u) => u.side === faction);
  const max = mine.reduce((a, u) => a + u.maxHp, 0);
  return { won: b.winner === faction, kept: max ? mine.reduce((a, u) => a + (u.alive ? Math.max(0, u.hp) : 0), 0) / max : 0 };
}

// Round robin: every Przymierze recruit against every Horda recruit, random heroes; per faction the win rates are compared with the faction's mean,
// because the factions' heroes are not equal. Price = tier-1 price times the relative strength (see RECRUIT_COSTS).
const dawn = RECRUITS.dawn, horde = RECRUITS.horde;
const wins: Record<string, number> = {};
let seed = 1;
for (const a of dawn) for (const b of horde) {
  let w = 0;
  for (let i = 0; i < per; i++) {
    const hero = FACTION_HEROES.dawn[i % FACTION_HEROES.dawn.length];
    if (battle(seed++, 'dawn', hero, a.id, b.id).won) w++;
  }
  wins[a.id] = (wins[a.id] ?? 0) + w;
  wins[b.id] = (wins[b.id] ?? 0) + (per - w);
}
for (const [name, list] of [['dawn', dawn], ['horde', horde]] as const) {
  console.log(`\n${name}: % wygranych przeciw rosterowi drugiej frakcji (po ${horde.length * per} bitew); cena dziś`);
  for (const r of list) console.log(`${UNITS[r.id].name.padEnd(24)} T${r.tier} ${((wins[r.id] / (list === dawn ? horde.length : dawn.length) / per) * 100).toFixed(0).padStart(4)}%  ${r.cost} zł`);
}
