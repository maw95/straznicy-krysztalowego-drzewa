// A fight of a bot hero against a chosen group of map guards (backlog 92): used by the tests and by scripts/sim/straznicy.ts.

import { chooseAction } from '../../src/engine/ai';
import type { FactionId } from '../../src/engine/data';
import { addUnit, fightNeutral, setHeroLevel } from '../../src/engine/dev';
import { PLAYABLE_IDS, FACTION_PACKS } from '../../src/engine/factions';
import { activeHero, applyActionInPlace, createGame } from '../../src/engine/game';
import { DEFAULT_RULES, type GameState } from '../../src/engine/types';

/**
 * The hero's team for a tier of guards, weak enough that the fight can be lost (so the groups can be told apart): its level, how many of the
 * starting supports it keeps and the recruits (by tier) it brings.
 */
const TEAM: Array<{ level: number; starting: number; recruits: number[] }> = [
  { level: 1, starting: 0, recruits: [] },
  { level: 1, starting: 1, recruits: [] },
  { level: 2, starting: 1, recruits: [3] },
];

export function fightGuards(seed: number, faction: FactionId, tier: 0 | 1 | 2, units: string[]): { won: boolean; supportsLost: number; state: GameState } {
  const pack = FACTION_PACKS[faction];
  const foe = PLAYABLE_IDS.find((f) => f !== faction)!;
  const heroId = pack.heroes[seed % pack.heroes.length];
  const make = (mapSeed: number) => createGame({
    mode: 'pvp',
    mapSize: 'long',
    battleMode: 'arena',
    seed: mapSeed,
    seats: [
      { name: 'A', faction: 'dawn', race: faction, controller: 'bot', heroId },
      { name: 'B', faction: 'horde', race: foe, controller: 'bot', heroId: FACTION_PACKS[foe].heroes[0] },
    ],
    rules: { ...DEFAULT_RULES, ruleset: 'digital', objective: 'control', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true },
  });
  /** The game with the hero walking into the guards; null on a rare map that has no hex for that (the next seed of a far range is played). */
  const begin = (mapSeed: number) => {
    const game = make(mapSeed);
    const hero = activeHero(game)!;
    setHeroLevel(game, hero.id, TEAM[tier].level);
    game.factions[hero.faction].supportsAlive = game.factions[hero.faction].supportsAlive.slice(0, TEAM[tier].starting);
    for (const t of TEAM[tier].recruits) addUnit(game, hero.faction, (seed + t) % 2 ? pack.tierUnits[t - 2] : pack.altUnits[t - 2]);
    const crystal = Object.values(game.crystals).find((c) => c.encounter);
    if (!crystal) return null;
    Object.assign(crystal, { guardian: units[0], encounter: units, tier });
    for (const c of Object.values(game.crystals)) if (c.encounter && c !== crystal) c.tier = undefined;
    try {
      return { s: fightNeutral(game, tier), hero, crystalId: crystal.id };
    } catch {
      return null;
    }
  };
  let fight = begin(seed);
  for (let n = 1; !fight && n < 20; n++) fight = begin(seed + 10000 * n);
  if (!fight) throw new Error(`No fight could be set up (seed ${seed}).`);
  const { hero, crystalId } = fight;
  const s = fight.s;
  const dead = s.factions[hero.faction].supportsDead.length;
  for (let i = 0; i < 900 && s.phase === 'battle'; i++) applyActionInPlace(s, chooseAction(s)!);
  if (s.phase === 'battle') throw new Error(`The fight did not end (seed ${seed}, ${units.join(',')}).`);
  return { won: crystalId in s.crystals ? s.crystals[crystalId].guardian === null : true, supportsLost: s.factions[hero.faction].supportsDead.length - dead, state: s };
}
