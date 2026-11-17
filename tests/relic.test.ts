// Level 6 "Imperium": the Relic. Shards on the map, carried by heroes, taken from a beaten hero, and the building of the Pierwotna Iskra.

import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { EMPIRE, hasSpark, mayBuildSpark, shardsOf, shardTotal } from '../src/engine/empire';
import { activeHero, applyAction, createGame } from '../src/engine/game';
import { buildingsOf, settlementAt } from '../src/engine/kingdom';
import { mapNeighbors, tileCost } from '../src/engine/map';
import { objectiveOf, OBJECTIVES } from '../src/engine/objectives';
import type { GameState } from '../src/engine/types';
import { playOut, pvpSeats, setup } from './helpers/engine';

const base = { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true } as const;
const rules = { ...base, objective: 'relic' } as const;
const game = (r: object = rules, seed = 3): GameState => createGame(setup({ mode: 'pvp', mapSize: 'medium', seed, seats: pvpSeats('ancientBear', 'werewolfLord') }, r));
const home = (s: GameState) => settlementAt(s, Object.values(s.tiles).find((t) => t.home === 'dawn')!.key)!;
const walkOnto = (s: GameState, hex: string): GameState => {
  const hero = activeHero(s)!;
  const from = mapNeighbors(s.tiles, hex).find((k) => tileCost(s.tiles[k]) !== null && !s.tiles[k].crystalId && !s.tiles[k].place && !s.tiles[k].home)!;
  s.heroes[hero.id].pos = from;
  s.tiles[from].revealed = true;
  s.movePoints = 9;
  return applyAction(s, { type: 'moveHero', to: hex });
};

describe('level 6: shards', () => {
  it('lie on the map by map size, seen by everybody, and only in level 6', () => {
    const s = game();
    expect(objectiveOf(s)).toBe('relic');
    expect(shardTotal(s)).toBe(EMPIRE.shards.medium);
    for (const hex of Object.keys(s.kingdom!.shards!)) {
      expect(s.tiles[hex].place?.kind).toBe('shard');
      expect(s.tiles[hex].revealed).toBe(true);
    }
    const l5 = game({ ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, objective: 'relic' });
    expect(l5.kingdom!.shards).toBeUndefined();
    expect(objectiveOf(l5)).toBe('crystals');
    expect(buildingsOf(l5)).not.toContain('spark');
    expect(buildingsOf(s)).toContain('spark');
  });

  it('a hero that steps on a shard carries it', () => {
    let s = game();
    const hex = Object.keys(s.kingdom!.shards!)[0];
    s = walkOnto(s, hex);
    expect(s.heroes.ancientBear.shards).toBe(1);
    expect(s.kingdom!.shards![hex]).toBeUndefined();
    expect(s.tiles[hex].place).toBeUndefined();
    expect(shardsOf(s, 'dawn')).toBe(1);
    expect(OBJECTIVES.relic.progress(s)[0].value).toBe(`1 / ${shardTotal(s)}`);
  });

  it('the hero that beats a carrier takes its shards', () => {
    let s = game();
    s.heroes.ancientBear.shards = 2;
    // The Horde's hero attacks the weakened carrier.
    const bear = s.heroes.ancientBear;
    const wolf = s.heroes.werewolfLord;
    const spot = Object.keys(s.tiles).find((k) => !s.tiles[k].home && !s.tiles[k].crystalId && !s.tiles[k].place && tileCost(s.tiles[k]) !== null && mapNeighbors(s.tiles, k).some((n) => tileCost(s.tiles[n]) !== null && !s.tiles[n].crystalId && !s.tiles[n].home && !s.tiles[n].place))!;
    const from = mapNeighbors(s.tiles, spot).find((n) => tileCost(s.tiles[n]) !== null && !s.tiles[n].crystalId && !s.tiles[n].home && !s.tiles[n].place)!;
    bear.pos = spot;
    wolf.pos = from;
    s.tiles[spot].revealed = s.tiles[from].revealed = true;
    s.turnIndex = s.turnOrder.indexOf('werewolfLord');
    s.movePoints = 9;
    s = applyAction(s, { type: 'moveHero', to: spot });
    for (let i = 0; i < 3000 && s.phase === 'battle'; i++) {
      if (s.battle!.stage === 'fight') for (const u of Object.values(s.battle!.units)) if (u.side === 'dawn' && u.alive) u.hp = 1;
      s = applyAction(s, chooseAction(s)!);
    }
    expect(s.heroes.ancientBear.alive).toBe(false);
    expect(s.heroes.ancientBear.shards).toBe(0);
    expect(s.heroes.werewolfLord.shards).toBe(2);
  });
});

describe('level 6: the building of the Pierwotna Iskra', () => {
  const allShards = (s: GameState) => {
    for (const hex of Object.keys(s.kingdom!.shards!)) delete s.tiles[hex].place;
    s.kingdom!.shards = {};
    s.heroes.ancientBear.shards = shardTotal(s);
    return s;
  };

  it('costs every shard, is raised by a hero standing in its own settlement, and wins the Relic goal', () => {
    let s = game();
    expect(mayBuildSpark(s, s.heroes.ancientBear)).toBe(false);
    expect(() => applyAction(s, { type: 'kingdomBuild', settlementId: home(s).id, building: 'spark' })).toThrow(/wszystkich Odłamków/);
    s = allShards(s);
    expect(mayBuildSpark(s, s.heroes.ancientBear)).toBe(true);
    const away = structuredClone(s);
    away.heroes.ancientBear.pos = mapNeighbors(away.tiles, home(away).at)[0];
    expect(() => applyAction(away, { type: 'kingdomBuild', settlementId: home(away).id, building: 'spark' })).toThrow(/stojący w osadzie/);
    s = applyAction(s, { type: 'kingdomBuild', settlementId: home(s).id, building: 'spark' });
    expect(s.phase).toBe('over');
    expect(s.winner).toBe('dawn');
  });

  it('shards split between two heroes do not build; handed over to one hero they do', () => {
    let s = allShards(createGame(setup({ mode: 'pvp', mapSize: 'medium', seed: 3, seats: pvpSeats('ancientBear', 'werewolfLord', 'goldDragon', 'blackDragon') }, rules)));
    const bear = s.heroes.ancientBear;
    const ally = s.heroes.goldDragon;
    ally.pos = bear.pos;
    bear.shards = shardTotal(s) - 1;
    ally.shards = 1;
    expect(shardsOf(s, 'dawn')).toBe(shardTotal(s));
    expect(mayBuildSpark(s, bear)).toBe(false);
    expect(() => applyAction(s, { type: 'kingdomBuild', settlementId: home(s).id, building: 'spark' })).toThrow(/przy jednym bohaterze/);
    expect(activeHero(s)!.id).toBe('ancientBear');
    s = applyAction(s, { type: 'passArtifact', artifactId: 'shards', toHeroId: ally.id });
    expect(s.heroes[ally.id].shards).toBe(shardTotal(s));
    expect(s.heroes.ancientBear.shards).toBe(0);
    expect(() => applyAction(s, { type: 'passArtifact', artifactId: 'shards', toHeroId: ally.id })).toThrow(/nie niesie/);
  });

  it('in another goal it does not end the game but strengthens the faction\'s units', () => {
    let s = allShards(game({ ...base }));
    expect(objectiveOf(s)).toBe('crystals');
    s = applyAction(s, { type: 'kingdomBuild', settlementId: home(s).id, building: 'spark' });
    expect(s.phase).not.toBe('over');
    expect(hasSpark(s, 'dawn')).toBe(true);
    expect(s.heroes.ancientBear.shards).toBe(0);
    // A fight: the Bear and its supports have more Życie than in a game without the Iskra.
    const fight = (g: GameState) => {
      const guardian = Object.values(g.crystals).find((c) => c.guardian && g.tiles[c.at])!;
      const from = mapNeighbors(g.tiles, guardian.at).find((k) => tileCost(g.tiles[k]) !== null && !g.tiles[k].crystalId && !g.tiles[k].home)!;
      g.heroes.ancientBear.pos = from;
      g.tiles[guardian.at].revealed = g.tiles[from].revealed = true;
      g.movePoints = 9;
      g.turnIndex = g.turnOrder.indexOf('ancientBear');
      let b = applyAction(g, { type: 'moveHero', to: guardian.at });
      if (b.battle!.stage === 'select') b = applyAction(b, { type: 'selectSupports', faction: 'dawn', supportIds: b.factions.dawn.supportsAlive.slice(0, 2) });
      return b.battle!.units;
    };
    const plain = fight(game({ ...base }));
    const strong = fight(s);
    const hpScale = s.rules.hpScale ?? s.rules.statScale ?? 1;
    expect(strong.ancientBear.maxHp - plain.ancientBear.maxHp).toBe(EMPIRE.sparkHp * hpScale);
    const support = Object.values(plain).find((u) => u.side === 'dawn' && u.id !== 'ancientBear')!;
    expect(strong[support.id].maxHp - support.maxHp).toBe(EMPIRE.sparkHp * hpScale);
  });

  it('at the round limit the side with more shards wins the Relic goal', () => {
    let s = game();
    s.heroes.ancientBear.shards = 2;
    s.heroes.werewolfLord.shards = 1;
    s.round = s.roundLimit;
    const round = s.round;
    while (s.phase !== 'over' && s.round === round) s = applyAction(s, { type: 'endTurn' });
    expect(s.winner).toBe('dawn');
  });

  it('bots play the Relic goal to the end and somebody raises the Iskra in some game', () => {
    let built = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const s = playOut(game(rules, seed));
      expect(s.phase).toBe('over');
      if (/wzniosło/.test(s.endReason ?? '')) built++;
    }
    expect(built).toBeGreaterThan(0);
  });
});
