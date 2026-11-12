// Hero against the Kraken and its tentacles (digital ruleset, hero growth), to judge how hard that legendary fight is.
// Usage: node --import tsx scripts/sim/kraken.ts [fights per hero=200]
// Columns: hero alone / hero with two supports; share of wins and the Życie the hero's side keeps (share of its maximum) in a win.
// SIM_OVERRIDE works as in the other simulations (e.g. {"units":{"kraken":{"hp":50}}}).

import './override';
import { FACTION_HEROES, FACTION_SUPPORTS, UNITS } from '../../src/engine/data';
import { chooseAction } from '../../src/engine/ai';
import { applyActionInPlace, createGame, fightAt } from '../../src/engine/game';
import { neighborKeys } from '../../src/engine/hex';
import { Rng } from '../../src/engine/rng';
import { levelOfFight } from '../../src/engine/difficulty';
import { DEFAULT_RULES, type GameState } from '../../src/engine/types';

const per = Number(process.argv[2] ?? 200);
const unit = process.env.SIM_UNIT ?? 'kraken';
const tentacles = Number(process.env.SIM_TENTACLES ?? 2);

function fight(seed: number, heroId: string, supports: number): { won: boolean; kept: number; level: string; actions: number } | null {
  const rng = new Rng(seed * 7919 + 3);
  const s: GameState = createGame({
    mode: 'coop', mapSize: 'long', battleMode: 'arena', seed,
    seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId }],
    rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, abilities: true },
  });
  s.factions.dawn.supportsAlive = process.env.SIM_SUPPORTS && supports ? process.env.SIM_SUPPORTS.split(',') : rng.shuffle(FACTION_SUPPORTS.dawn).slice(0, supports);
  s.factions.dawn.supportsDead = [];
  const enc = Object.values(s.crystals).find((c) => c.encounter);
  if (!enc) return null;
  enc.encounter = [unit, ...Array.from({ length: tentacles }, () => 'tentacle'), ...(process.env.SIM_WEAK === '0' ? [] : ['pincer', 'bogCrawler'])];
  enc.guardian = unit;
  enc.tier = 2;
  const hero = s.heroes[heroId];
  // SIM_GROWN=1: a hero as the author met the Kraken (partia 236189): level 3, Moc and Wigor (skills that help every hero alike), a buckler and a hunter's blade.
  if (process.env.SIM_GROWN) Object.assign(hero, { level: 3, skills: ['might', 'vigor'], gear: { shield: 'buckler', weapon: 'hunterBlade' } });
  hero.pos = neighborKeys(enc.at).find((k) => s.tiles[k] && !s.tiles[k].crystalId && !s.tiles[k].home) ?? neighborKeys(enc.at)[0];
  s.turnOrder = [hero.id];
  s.turnIndex = 0;
  s.movePoints = 3;
  const f = fightAt(s, enc.at)!;
  let actions = 0;
  let b = f.battle!;
  for (; actions < 800 && f.phase === 'battle'; actions++) {
    if (f.battle) b = f.battle;
    if (f.battle?.winner) break;
    const act = chooseAction(f)!;
    if (process.env.SIM_TRACE && f.battle && f.battle.round >= 5 && f.battle.round <= 7) console.log('R' + f.battle.round, JSON.stringify(act), Object.values(f.battle.units).filter((u) => u.alive).map((u) => `${u.id}@${u.pos}`).join(' '));
    applyActionInPlace(f, act);
  }
  if (f.battle) b = f.battle;
  const mine = Object.values(b.units).filter((u) => u.side === 'dawn');
  const max = mine.reduce((a, u) => a + u.maxHp, 0);
  const left = mine.reduce((a, u) => a + (u.alive ? Math.max(0, u.hp) : 0), 0);
  if (process.env.SIM_LOG) console.log(f.log.slice(-Number(process.env.SIM_LOG)).map((l: any) => l.text ?? JSON.stringify(l)).join('\n'));
  if (process.env.SIM_DEBUG) console.log(b.winner, actions, b.round, Object.values(b.units).map((u) => `${u.defId}:${u.hp}/${u.maxHp}${u.alive ? '' : 'x'}`).join(' '));
  return { won: b.winner === 'dawn', kept: max ? left / max : 0, level: levelOfFight(b), actions };
}

console.log(`${unit} + ${tentacles} macek (życie ${UNITS[unit].hp}, atak ${UNITS[unit].attack}), ${per} walk na bohatera`);
for (const supports of process.env.SIM_ONLY_HERO || process.env.SIM_NO_SOLO ? [2] : [0, 2]) {
  console.log(`\nBohater ${supports ? 'z dwoma pomocnikami' : 'sam'}: % wygranych · śr. zachowane Życie w wygranej · poziom trudności (łatwa/wyrównana/groźna/niemożliwa)`);
  let seed = 1;
  for (const hero of FACTION_HEROES.dawn.filter((h) => !process.env.SIM_ONLY_HERO || h === process.env.SIM_ONLY_HERO)) {
    let w = 0, kept = 0;
    const lv: Record<string, number> = { easy: 0, even: 0, dangerous: 0, impossible: 0 };
    for (let i = 0; i < per; i++) {
      const o = fight(seed++, hero, supports);
      if (!o) { i--; continue; }
      if (o.won) { w++; kept += o.kept; }
      lv[o.level]++;
    }
    console.log(`  ${hero.padEnd(14)} ${((w / per) * 100).toFixed(0).padStart(4)}% · ${(w ? (kept / w) * 100 : 0).toFixed(0).padStart(3)}% · ${lv.easy}/${lv.even}/${lv.dangerous}/${lv.impossible}`);
  }
}
