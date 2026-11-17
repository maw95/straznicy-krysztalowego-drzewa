// Level 6 "Imperium": the factions' own mechanics (Blask Świtu, Żądza Krwi), their trees, and the legendary recruits.

import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { dealDamage, makeBattleUnit } from '../src/engine/battle';
import { FACTION_MECHANICS } from '../src/engine/empire';
import { activeHero, applyAction, createGame } from '../src/engine/game';
import { ALT_UNITS, DWELLING_COST, dwellingOf, LEGEND, recruitsOf, settlementAt } from '../src/engine/kingdom';
import { UNITS } from '../src/engine/data';
import { mapNeighbors, tileCost } from '../src/engine/map';
import type { GameState } from '../src/engine/types';
import { playOut, pvpSeats, setup } from './helpers/engine';

const rules = { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true } as const;
const l5 = { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true } as const;
const game = (r: object = rules): GameState => {
  const s = createGame(setup({ mode: 'pvp', mapSize: 'medium', seed: 3, seats: pvpSeats('ancientBear', 'werewolfLord') }, r));
  s.kingdom!.gold.dawn = s.kingdom!.gold.horde = 80;
  s.kingdom!.res!.dawn = { wood: 9, ore: 9, dust: 20 };
  s.kingdom!.res!.horde = { wood: 9, ore: 9, dust: 20 };
  return s;
};
const home = (s: GameState) => settlementAt(s, Object.values(s.tiles).find((t) => t.home === 'dawn')!.key)!;

/** The Przymierza's hero attacks the Horde's; the battle stands at its first activation. */
function battle(s: GameState): GameState {
  const hero = activeHero(s)!;
  const foe = s.heroes.werewolfLord;
  const spot = Object.keys(s.tiles).find((k) => !s.tiles[k].home && !s.tiles[k].crystalId && !s.tiles[k].place && tileCost(s.tiles[k]) !== null && mapNeighbors(s.tiles, k).some((n) => tileCost(s.tiles[n]) !== null && !s.tiles[n].crystalId && !s.tiles[n].home && !s.tiles[n].place))!;
  const from = mapNeighbors(s.tiles, spot).find((n) => tileCost(s.tiles[n]) !== null && !s.tiles[n].crystalId && !s.tiles[n].home && !s.tiles[n].place)!;
  foe.pos = spot;
  s.heroes[hero.id].pos = from;
  s.tiles[spot].revealed = s.tiles[from].revealed = true;
  s.movePoints = 9;
  s = applyAction(s, { type: 'moveHero', to: spot });
  for (let i = 0; i < 12 && s.battle!.stage !== 'fight'; i++) s = applyAction(s, chooseAction(s)!);
  return s;
}
const endBattleRound = (s: GameState): GameState => {
  const round = s.battle!.round;
  while (s.phase === 'battle' && s.battle!.round === round) s = applyAction(s, { type: 'endActivation' });
  return s;
};

describe('level 6: Blask Świtu', () => {
  it('heals the most wounded unit of the Przymierza at the start of a battle round; the tree makes it stronger', () => {
    const hpScale = (s: GameState) => s.rules.hpScale ?? s.rules.statScale ?? 1;
    let s = battle(game());
    const bear = s.battle!.units.ancientBear;
    bear.hp -= 4 * hpScale(s);
    const hp = bear.hp;
    s = endBattleRound(s);
    expect(s.battle!.units.ancientBear.hp).toBe(hp + FACTION_MECHANICS.dawnHeal * hpScale(s));
    // Rank II: stronger and for two units.
    const g = game();
    g.kingdom!.tree = { dawn: 2, horde: 0 };
    let t = battle(g);
    const [a, b] = Object.values(t.battle!.units).filter((u) => u.side === 'dawn');
    a.hp -= 4 * hpScale(t);
    b.hp -= 3 * hpScale(t);
    const before = [a.hp, b.hp];
    t = endBattleRound(t);
    expect(t.battle!.units[a.id].hp).toBe(before[0] + 2 * hpScale(t));
    expect(t.battle!.units[b.id].hp).toBe(before[1] + 2 * hpScale(t));
  });

  it('does nothing below level 6', () => {
    let s = battle(game(l5));
    const bear = s.battle!.units.ancientBear;
    bear.hp -= 10;
    const hp = bear.hp;
    s = endBattleRound(s);
    expect(s.battle!.units.ancientBear.hp).toBe(hp);
  });
});

describe('level 6: Żądza Krwi', () => {
  it('arms every unit of the Horde when an enemy falls: once, and up to three times with the tree', () => {
    const fall = (rank: number) => {
      const g = game();
      g.kingdom!.tree = { dawn: 0, horde: rank };
      const s = battle(g);
      const b = s.battle!;
      const wolf = b.units.werewolfLord;
      const base = wolf.status.battleAttackBonus;
      const dawn = Object.values(b.units).filter((u) => u.side === 'dawn');
      for (const u of dawn) dealDamage(s, u, 999, 'test');
      return (wolf.status.battleAttackBonus - base) / (s.rules.statScale ?? 1);
    };
    expect(fall(0)).toBe(FACTION_MECHANICS.hordeAttack);
    expect(fall(1)).toBe(2 * FACTION_MECHANICS.hordeAttack);
    expect(fall(2)).toBe(3 * FACTION_MECHANICS.hordeAttack);
  });
});

describe('level 6: the faction tree', () => {
  it('is bought rank by rank for gold and Gwiezdny Pył, in level 6 only', () => {
    let s = game();
    for (let rank = 0; rank < 3; rank++) {
      const before = { gold: s.kingdom!.gold.dawn, dust: s.kingdom!.res!.dawn.dust };
      s = applyAction(s, { type: 'kingdomTree', settlementId: home(s).id });
      expect(s.kingdom!.tree!.dawn).toBe(rank + 1);
      expect(s.kingdom!.gold.dawn).toBe(before.gold - FACTION_MECHANICS.treeCost[rank].gold);
      expect(s.kingdom!.res!.dawn.dust).toBe(before.dust - FACTION_MECHANICS.treeCost[rank].dust);
    }
    expect(() => applyAction(s, { type: 'kingdomTree', settlementId: home(s).id })).toThrow(/w pełni/);
    const low = game(l5);
    expect(() => applyAction(low, { type: 'kingdomTree', settlementId: home(low).id })).toThrow(/Imperium/);
  });
});

describe('level 6: the legendary recruit', () => {
  it('is on offer in level 6 only, in upgraded barracks, for gold and Gwiezdny Pył', () => {
    let s = game();
    expect(recruitsOf(s, 'dawn').map((r) => r.id)).toContain('dawnPhoenix');
    expect(recruitsOf(game(l5), 'dawn').map((r) => r.id)).not.toContain('dawnPhoenix');
    home(s).buildings.barracks = 1;
    expect(() => applyAction(s, { type: 'kingdomRecruit', settlementId: home(s).id, unitId: 'dawnPhoenix' })).toThrow(/rozbudowanych/);
    home(s).buildings.barracks = 2;
    s.kingdom!.res!.dawn.dust = 0;
    expect(() => applyAction(s, { type: 'kingdomRecruit', settlementId: home(s).id, unitId: 'dawnPhoenix' })).toThrow(/Pył/);
    s.kingdom!.res!.dawn.dust = 5;
    s = applyAction(s, { type: 'kingdomRecruit', settlementId: home(s).id, unitId: 'dawnPhoenix' });
    expect(s.factions.dawn.supportsAlive).toContain('dawnPhoenix');
    expect(s.kingdom!.gold.dawn).toBe(80 - LEGEND.gold);
    expect(s.kingdom!.res!.dawn.dust).toBe(5 - LEGEND.dust);
  });

  it('the Phoenix rises once from its ashes with half its Życie', () => {
    const s = battle(game());
    const b = s.battle!;
    const phoenix = makeBattleUnit('dawnPhoenix', 'dawn', true, s.rules.statScale ?? 1, s.rules.hpScale ?? 1);
    phoenix.pos = Object.values(b.units).find((u) => u.side === 'dawn')!.pos;
    b.units.dawnPhoenix = phoenix;
    dealDamage(s, phoenix, 9999, 'test');
    expect(phoenix.alive).toBe(true);
    expect(phoenix.hp).toBe(Math.ceil(phoenix.maxHp / 2));
    dealDamage(s, phoenix, 9999, 'test');
    expect(phoenix.alive).toBe(false);
  });

  it('bots play level 6 games to the end', () => {
    for (const seed of [2, 5]) {
      const s = playOut(createGame(setup({ mode: 'pvp', mapSize: 'long', seed, seats: pvpSeats('goldDragon', 'werewolfLord') }, rules)));
      expect(s.phase).toBe('over');
    }
  });
});

describe('level 6: alternative units and their dwellings', () => {
  it('every tier 2-5 has two units in level 6 and one below it', () => {
    const s = game();
    for (const f of ['dawn', 'horde'] as const) for (const tier of [2, 3, 4, 5]) expect(recruitsOf(s, f).filter((r) => r.tier === tier)).toHaveLength(2);
    for (const tier of [2, 3, 4, 5]) expect(recruitsOf(game(l5), 'dawn').filter((r) => r.tier === tier)).toHaveLength(1);
    for (const id of [...ALT_UNITS.dawn, ...ALT_UNITS.horde]) expect(UNITS[id].kind).toBe('support');
  });

  it('a unit of tiers 2-5 needs its dwelling; building one shuts the other unit of the tier out', () => {
    let s = game();
    home(s).buildings.barracks = 1;
    expect(() => applyAction(s, { type: 'kingdomRecruit', settlementId: home(s).id, unitId: 'hedgehog' })).toThrow(/siedlisko/);
    s = applyAction(s, { type: 'kingdomDwelling', settlementId: home(s).id, unitId: 'silverFox' });
    expect(dwellingOf(s, 'dawn', 2)).toBe('silverFox');
    expect(s.kingdom!.gold.dawn).toBe(80 - DWELLING_COST[0].gold);
    expect(() => applyAction(s, { type: 'kingdomRecruit', settlementId: home(s).id, unitId: 'hedgehog' })).toThrow(/inne siedlisko/);
    s = applyAction(s, { type: 'kingdomRecruit', settlementId: home(s).id, unitId: 'silverFox' });
    expect(s.factions.dawn.supportsAlive).toContain('silverFox');
    // A dwelling is a building with no limit of a round, but the second unit of a tier is refused for good.
    expect(() => applyAction(s, { type: 'kingdomDwelling', settlementId: home(s).id, unitId: 'hedgehog' })).toThrow(/drugie jest wykluczone/);
    const round = s.round;
    while (s.round === round) s = applyAction(s, { type: 'endTurn' });
    while (s.heroes[s.turnOrder[s.turnIndex]].faction !== 'dawn') s = applyAction(s, { type: 'endTurn' });
    expect(() => applyAction(s, { type: 'kingdomDwelling', settlementId: home(s).id, unitId: 'hedgehog' })).toThrow(/wykluczone/);
    // Tier 1 needs no dwelling, and level 5 needs none at all.
    const low = game(l5);
    home(low).buildings.barracks = 1;
    expect(applyAction(low, { type: 'kingdomRecruit', settlementId: home(low).id, unitId: 'hedgehog' }).factions.dawn.supportsAlive).toContain('hedgehog');
    expect(() => applyAction(low, { type: 'kingdomDwelling', settlementId: home(low).id, unitId: 'silverFox' })).toThrow(/Imperium/);
  });

  it('bots build dwellings and recruit from them', () => {
    let alt = 0, any = 0;
    for (const seed of [1, 2, 3, 4]) {
      const s = playOut(createGame(setup({ mode: 'pvp', mapSize: 'veryLong', seed, seats: pvpSeats('goldDragon', 'werewolfLord') }, rules)));
      expect(s.phase).toBe('over');
      for (const f of ['dawn', 'horde'] as const) {
        any += (s.kingdom!.dwellings?.[f] ?? []).length;
        alt += [...s.factions[f].supportsAlive, ...s.factions[f].supportsDead].filter((id) => ALT_UNITS[f].includes(id)).length;
      }
    }
    expect(any).toBeGreaterThan(0);
    expect(alt).toBeGreaterThan(0);
  });
});
