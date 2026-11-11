// Digital ruleset: the weak units and bosses of the neutral encounters (docs/ZASADY_CYFROWE.md, "Neutralni").
import { describe, expect, it } from 'vitest';
import { arenaCell, attackTargets, battleAttack, battleMove, battleTeleport, dealDamage, fromBehind, makeBattleUnit, predictDamage, teleportCells, endActivation } from '../src/engine/battle';
import { createGame } from '../src/engine/game';
import { neighborKeys } from '../src/engine/hex';
import type { Side } from '../src/engine/data';
import type { GameState } from '../src/engine/types';
import { activation, battleFixture, setup } from './helpers/engine';

interface Spec { id: string; defId: string; side: Side; cell: string; hp?: number }

/** A digital battle with the listed units (ids may repeat a definition); the first one acts. */
function fight(units: Spec[]): GameState {
  const s = battleFixture(createGame(setup({}, { ruleset: 'digital' })), [{ id: 'goldDragon', side: 'dawn', col: 0, half: 0 }]);
  const b = s.battle!;
  b.units = {};
  for (const { id, defId, side, cell, hp } of units) {
    const u = makeBattleUnit(defId, side);
    u.id = id;
    u.pos = cell;
    if (hp) u.hp = hp;
    b.units[id] = u;
  }
  b.order = units.map((x) => x.id);
  b.activation = activation(units[0].id);
  b.attacker = units[0].side;
  b.defender = units[0].side === 'neutral' ? 'dawn' : 'neutral';
  return s;
}

const here = arenaCell(6, 10);
const near = (cell: string, i = 0) => neighborKeys(cell)[i];
const hero = (cell: string): Spec => ({ id: 'goldDragon', defId: 'goldDragon', side: 'dawn', cell });

describe('neutral encounters: abilities', () => {
  it('Rozprysk: a dying Kruszyniec hurts every neighbour, friend or foe', () => {
    const s = fight([
      hero(near(here, 0)),
      { id: 'k', defId: 'shardling', side: 'neutral', cell: here },
      { id: 'p', defId: 'pincer', side: 'neutral', cell: near(here, 3) },
      { id: 'far', defId: 'pincer', side: 'neutral', cell: arenaCell(2, 2) },
    ]);
    const before = { d: s.battle!.units.goldDragon.hp, p: s.battle!.units.p.hp, far: s.battle!.units.far.hp };
    dealDamage(s, s.battle!.units.k, 99, 'test');
    expect(s.battle!.units.goldDragon.hp).toBe(before.d - 1);
    expect(s.battle!.units.p.hp).toBe(before.p - 1);
    expect(s.battle!.units.far.hp).toBe(before.far);
  });

  it('Chwyt: a wounded target cannot move in its next activation', () => {
    const s = fight([{ id: 'c', defId: 'pincer', side: 'neutral', cell: here }, hero(near(here, 0))]);
    battleAttack(s, 'goldDragon', false);
    expect(s.battle!.units.goldDragon.status.rootedNext).toBe(true);
  });

  it('Nurkowanie: +1 only after flying at least 3 hexes', () => {
    const s = fight([{ id: 'e', defId: 'skyEagle', side: 'neutral', cell: here }, hero(arenaCell(10, 10))]);
    const e = s.battle!.units.e;
    const d = s.battle!.units.goldDragon;
    const plain = predictDamage(s, e, d, { useAbility: false, movedDistance: 2 }).base;
    expect(predictDamage(s, e, d, { useAbility: false, movedDistance: 3 }).base).toBe(plain + 1);
  });

  it('Zajście od tyłu: +1 from behind the target, not from its front', () => {
    const s = fight([{ id: 'h', defId: 'harpy', side: 'neutral', cell: near(here, 0) }, hero(here)]);
    const h = s.battle!.units.h;
    const d = s.battle!.units.goldDragon;
    d.facing = { q: 1, r: 0 }; // looks towards the harpy
    expect(fromBehind(s, h, d)).toBe(false);
    const front = predictDamage(s, h, d, { useAbility: false, movedDistance: 0 }).base;
    d.facing = { q: -1, r: 0 }; // looks away
    expect(fromBehind(s, h, d)).toBe(true);
    expect(predictDamage(s, h, d, { useAbility: false, movedDistance: 0 }).base).toBe(front + 1);
  });

  it('Bagienny Pełzacz regains Życie when its activation begins', () => {
    const s = fight([hero(arenaCell(2, 2)), { id: 'b', defId: 'bogCrawler', side: 'neutral', cell: here, hp: 5 }]);
    endActivation(s);
    expect(s.battle!.units.b.hp).toBe(6);
  });

  it('Kamienny Golem: Kamienna Skóra −2 (min 1) until half its Życie is gone, then Trzęsienie hurts everyone around', () => {
    const s = fight([{ id: 'g', defId: 'stoneGolem', side: 'neutral', cell: here }, hero(near(here, 0))]);
    const g = s.battle!.units.g;
    const d = s.battle!.units.goldDragon;
    const wolf = makeBattleUnit('werewolfLord', 'dawn');
    wolf.id = 'w';
    wolf.pos = near(here, 3);
    s.battle!.units.w = wolf;
    expect(predictDamage(s, d, g, { useAbility: false, movedDistance: 0 }).damage).toBe(3);
    g.hp = Math.floor(g.maxHp / 2);
    expect(predictDamage(s, d, g, { useAbility: false, movedDistance: 0 }).damage).toBe(5);
    const hp = [d.hp, wolf.hp];
    battleAttack(s, 'goldDragon', false);
    expect(d.hp).toBeLessThan(hp[0] - 1);
    expect(wolf.hp).toBe(hp[1] - 1);
  });

  it('Kraken: the head cannot be attacked while a tentacle lives', () => {
    const s = fight([hero(near(here, 0)), { id: 'k', defId: 'kraken', side: 'neutral', cell: here }, { id: 't', defId: 'tentacle', side: 'neutral', cell: near(here, 5) }]);
    const targets = (x: GameState) => attackTargets(x, x.battle!.units.goldDragon).map((u) => u.id);
    expect(targets(s)).not.toContain('k');
    s.battle!.units.t.alive = false;
    expect(targets(s)).toContain('k');
  });

  it('Podkop: the Podkopnik comes up up to 4 hexes away and its turn ends', () => {
    const s = fight([{ id: 'p', defId: 'burrower', side: 'neutral', cell: here }, hero(arenaCell(12, 10))]);
    const cells = teleportCells(s, s.battle!.units.p);
    expect(cells.length).toBeGreaterThan(0);
    battleTeleport(s, cells[0]);
    expect(s.battle!.units.p.pos).toBe(cells[0]);
    expect(s.battle!.activation?.unitId).not.toBe('p');
  });

  it('Król Burzy: teleport leaves a charged field that hurts whoever steps on it, Wyładowanie shocks close attackers', () => {
    const s = fight([{ id: 'k', defId: 'stormKing', side: 'neutral', cell: here }, hero(arenaCell(12, 10)), { id: 'w', defId: 'werewolfLord', side: 'dawn', cell: arenaCell(2, 2) }]);
    const to = teleportCells(s, s.battle!.units.k)[0];
    battleTeleport(s, to);
    expect(s.battle!.fields).toEqual([{ cell: here, until: s.battle!.round + 1 }]);
    const w = s.battle!.units.w;
    w.pos = near(here, 0);
    s.battle!.activation = activation('w');
    const hp = w.hp;
    battleMove(s, here);
    expect(w.hp).toBe(hp - 1);
    // Wyładowanie
    const king = s.battle!.units.k;
    const d = s.battle!.units.goldDragon;
    king.pos = near(d.pos!, 0);
    s.battle!.activation = activation('goldDragon');
    const dhp = d.hp;
    battleAttack(s, 'k', false);
    expect(d.hp).toBe(dhp - 1);
  });
});
