// Level 6 "Imperium": the factions' own mechanics (Blask Świtu, Żądza Krwi), their trees, and the legendary recruits.

import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { dealDamage, makeBattleUnit } from '../src/engine/battle';
import { FACTION_MECHANICS } from '../src/engine/empire';
import { activeHero, applyAction, createGame } from '../src/engine/game';
import { LEGEND, recruitsOf, settlementAt } from '../src/engine/kingdom';
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
