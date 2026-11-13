// Level 3 recruits, tiers 2-5 (docs/JEDNOSTKI_POZIOMU_3.md): the abilities of the eight new supports.
import { describe, expect, it } from 'vitest';
import { arenaCell, battleAttack, battleHop, endActivation, makeBattleUnit, predictDamage, scaleOf } from '../src/engine/battle';
import { createGame } from '../src/engine/game';
import { neighborKeys, parseKey } from '../src/engine/hex';
import { RECRUITS } from '../src/engine/kingdom';
import type { Side } from '../src/engine/data';
import type { GameState } from '../src/engine/types';
import { activation, battleFixture, setup } from './helpers/engine';

interface Spec { id: string; defId: string; side: Side; cell: string; hp?: number }

/** A digital battle with the listed units; the first one acts. */
function fight(units: Spec[]): GameState {
  const s = battleFixture(createGame(setup({}, { ruleset: 'digital' })), [{ id: 'goldDragon', side: 'dawn', col: 0, half: 0 }]);
  const b = s.battle!;
  b.units = {};
  for (const { id, defId, side, cell, hp } of units) {
    const u = makeBattleUnit(defId, side, true);
    u.id = id;
    u.pos = cell;
    if (hp) u.hp = hp;
    b.units[id] = u;
  }
  b.order = units.map((x) => x.id);
  b.activation = activation(units[0].id);
  b.attacker = units[0].side;
  b.defender = units[0].side === 'dawn' ? 'horde' : 'dawn';
  return s;
}

const here = arenaCell(6, 10);
const near = (cell: string, i = 0) => neighborKeys(cell)[i];
const one = (s: GameState) => scaleOf(s);

describe('recruits', () => {
  it('every faction has seven recruits: three tier-1 and one each of tiers 2-5, priced rising', () => {
    for (const f of ['dawn', 'horde'] as const) {
      expect(RECRUITS[f]).toHaveLength(7);
      const costs = [1, 2, 3, 4, 5].map((t) => RECRUITS[f].find((r) => r.tier === t)!.cost);
      expect(costs).toEqual([...costs].sort((a, b) => a - b));
    }
  });

  it('Kolce: whoever hits the Jeżozwierz in melee takes damage', () => {
    const s = fight([
      { id: 'sp', defId: 'caveSpider', side: 'horde', cell: near(here) },
      { id: 'h', defId: 'hedgehog', side: 'dawn', cell: here },
    ]);
    const before = s.battle!.units.sp.hp;
    battleAttack(s, 'h', false);
    expect(s.battle!.units.sp.hp).toBe(before - one(s));
  });

  it('Strzał i Galop: after the shot the Centaur may fall back, once', () => {
    const s = fight([
      { id: 'c', defId: 'centaur', side: 'dawn', cell: here },
      { id: 'e', defId: 'caveSpider', side: 'horde', cell: near(here, 2) },
    ]);
    battleAttack(s, 'e', false);
    expect(s.battle!.activation!.hop).toBe(3);
    battleHop(s, near(near(here, 5), 5));
    expect(s.battle!.units.c.abilityUsed).toBe(true);
  });

  it('Czołowe Natarcie: the Odyniec hits harder at the front than at the back', () => {
    const s = fight([
      { id: 'b', defId: 'boar', side: 'dawn', cell: near(here) },
      { id: 'e', defId: 'caveSpider', side: 'horde', cell: here },
    ]);
    const e = s.battle!.units.e;
    const dir = (from: string, to: string) => ({ q: parseKey(to).q - parseKey(from).q, r: parseKey(to).r - parseKey(from).r });
    e.facing = dir(here, near(here));
    const front = predictDamage(s, s.battle!.units.b, e, { useAbility: false, movedDistance: 0 }).damage;
    e.facing = dir(near(here), here);
    const back = predictDamage(s, s.battle!.units.b, e, { useAbility: false, movedDistance: 0 }).damage;
    expect(front - back).toBe(2 * one(s));
  });

  it('Korzenie Drzewa: once, at the start of its activation the Opiekun heals wounded neighbours', () => {
    const s = fight([
      { id: 'x', defId: 'caveSpider', side: 'horde', cell: arenaCell(1, 4) },
      { id: 't', defId: 'treeGuardian', side: 'dawn', cell: here },
      { id: 'a', defId: 'hedgehog', side: 'dawn', cell: near(near(here, 0), 0), hp: 1 },
    ]);
    const a = s.battle!.units.a;
    a.pos = neighborKeys(here).find((k) => !s.battle!.units.t.tail || k !== s.battle!.units.t.tail)!;
    const before = a.hp;
    endActivation(s);
    expect(s.battle!.activation!.unitId).toBe('t');
    expect(a.hp).toBeGreaterThan(before);
    expect(s.battle!.units.t.abilityUsed).toBe(true);
  });

  it('Zatruty Pazur: the poisoned enemy loses life at the start of its next two activations', () => {
    const s = fight([
      { id: 'r', defId: 'ratman', side: 'horde', cell: near(here) },
      { id: 'e', defId: 'hedgehog', side: 'dawn', cell: here },
    ]);
    battleAttack(s, 'e', true);
    const e = s.battle!.units.e;
    // The poisoned unit acts next, so the first bite has already come: one more is left.
    expect(s.battle!.activation!.unitId).toBe('e');
    expect(e.status.poisoned).toBe(1);
    const hp = e.hp;
    endActivation(s);
    endActivation(s);
    expect(s.battle!.activation!.unitId).toBe('e');
    expect(e.hp).toBe(hp - one(s));
    expect(e.status.poisoned).toBe(0);
  });

  it('Obława: +1 A when another ally of the Ogar stands next to the target', () => {
    const alone = fight([
      { id: 'h', defId: 'hellhound', side: 'horde', cell: near(here) },
      { id: 'e', defId: 'hedgehog', side: 'dawn', cell: here },
    ]);
    const pack = fight([
      { id: 'h', defId: 'hellhound', side: 'horde', cell: near(here) },
      { id: 'e', defId: 'hedgehog', side: 'dawn', cell: here },
      { id: 'f', defId: 'caveSpider', side: 'horde', cell: near(here, 3) },
    ]);
    const d = (s: GameState) => predictDamage(s, s.battle!.units.h, s.battle!.units.e, { useAbility: false, movedDistance: 0 }).damage;
    expect(d(pack) - d(alone)).toBe(one(pack));
  });

  it('Pożoga: the target and its neighbours are hurt', () => {
    const s = fight([
      { id: 's', defId: 'salamander', side: 'horde', cell: arenaCell(2, 8) },
      { id: 'e', defId: 'hedgehog', side: 'dawn', cell: arenaCell(4, 8) },
      { id: 'n', defId: 'nymph', side: 'dawn', cell: near(arenaCell(4, 8)) },
    ]);
    const n = s.battle!.units.n.hp;
    battleAttack(s, 'e', true);
    expect(s.battle!.units.n.hp).toBe(n - one(s));
    expect(s.battle!.units.s.abilityUsed).toBe(true);
  });

  it('Bitewny Szał: armour takes 1 off every blow, a kill feeds the next blow', () => {
    const s = fight([
      { id: 'm', defId: 'minotaurChief', side: 'horde', cell: near(here) },
      { id: 'e', defId: 'hedgehog', side: 'dawn', cell: here, hp: 1 },
      { id: 'g', defId: 'goldDragon', side: 'dawn', cell: arenaCell(1, 1) },
    ]);
    const m = s.battle!.units.m;
    const dmg = predictDamage(s, s.battle!.units.g, m, { useAbility: false, movedDistance: 0 }).damage;
    expect(dmg).toBeGreaterThan(0);
    battleAttack(s, 'e', false);
    expect(m.status.nextAttackBonus).toBe(2 * one(s));
  });
});
