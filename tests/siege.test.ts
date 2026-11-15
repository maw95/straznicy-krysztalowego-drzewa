// Level 4 "Księstwo": the defence of a settlement. A garrison left by the owner fights for it, the walls building adds a moat, then a wall
// with a gate and two towers, and the attacker brings a catapult.

import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { wideCell } from '../src/engine/battle';
import { SIEGE } from '../src/engine/economy';
import { activeHero, applyAction, applyActionInPlace, createGame, legalHeroMoves } from '../src/engine/game';
import { garrisonAt, hasUnit, settlementAt } from '../src/engine/kingdom';
import { mapNeighbors } from '../src/engine/map';
import type { GameState } from '../src/engine/types';
import { playOut, pvpSeats, setup } from './helpers/engine';

const rules = { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true } as const;
const game = (seed = 3): GameState => createGame(setup({ mode: 'pvp', mapSize: 'medium', seed, seats: pvpSeats('goldDragon', 'werewolfLord') }, rules));
const dawnHome = (s: GameState) => settlementAt(s, Object.values(s.tiles).find((t) => t.home === 'dawn')!.key)!;

/** The Horde hero stands next to the Przymierza's home settlement and it is its turn; the Przymierza's hero is far away. */
function atTheGates(s: GameState, garrison: string[], walls = 0): { s: GameState; home: string } {
  const home = dawnHome(s);
  const fs = s.factions.dawn;
  for (const id of garrison) fs.supportsAlive.splice(fs.supportsAlive.indexOf(id), 1);
  home.garrison = [...garrison];
  home.buildings.walls = walls;
  const dawn = Object.values(s.heroes).find((h) => h.faction === 'dawn')!;
  const horde = Object.values(s.heroes).find((h) => h.faction === 'horde')!;
  const far = Object.values(s.tiles).find((t) => t.home === 'horde')!.key;
  dawn.pos = far;
  const next = mapNeighbors(s.tiles, home.at).find((k) => !s.tiles[k].crystalId)!;
  horde.pos = next;
  s.tiles[home.at].revealed = true;
  s.tiles[next].revealed = true;
  s.turnIndex = s.turnOrder.indexOf(horde.id);
  s.movePoints = 9;
  return { s, home: home.at };
}

const fightOut = (s: GameState): GameState => {
  for (let i = 0; i < 4000 && s.phase === 'battle'; i++) applyActionInPlace(s, chooseAction(s)!);
  return s;
};

describe('level 4: the garrison', () => {
  it('a hero standing in its settlement leaves supports there and takes them back; a garrisoned unit still counts as owned', () => {
    let s = game();
    const home = dawnHome(s);
    const hero = activeHero(s)!;
    expect(hero.faction).toBe('dawn');
    const [a] = s.factions.dawn.supportsAlive;
    s = applyAction(s, { type: 'kingdomGarrison', settlementId: home.id, unitId: a, dir: 'in' });
    expect(dawnHome(s).garrison).toEqual([a]);
    expect(s.factions.dawn.supportsAlive).not.toContain(a);
    expect(hasUnit(s, 'dawn', a)).toBe(true);
    s = applyAction(s, { type: 'kingdomGarrison', settlementId: home.id, unitId: a, dir: 'out' });
    expect(dawnHome(s).garrison).toEqual([]);
    expect(s.factions.dawn.supportsAlive).toContain(a);
    // Away from the settlement the hero cannot change the garrison.
    s.heroes[hero.id].pos = mapNeighbors(s.tiles, home.at)[0];
    expect(() => applyAction(s, { type: 'kingdomGarrison', settlementId: home.id, unitId: a, dir: 'in' })).toThrow(/stojący w osadzie/);
  });

  it('holds at most three units, and level 3 has no garrison', () => {
    const s = game();
    const home = dawnHome(s);
    home.garrison = ['x', 'y', 'z'];
    expect(() => applyAction(s, { type: 'kingdomGarrison', settlementId: home.id, unitId: s.factions.dawn.supportsAlive[0], dir: 'in' })).toThrow(/mieści/);
    const l3 = createGame(setup({ mode: 'pvp', mapSize: 'medium', seed: 3, seats: pvpSeats('goldDragon', 'werewolfLord') }, { ruleset: 'digital', heroGrowth: true, kingdom: true }));
    expect(() => applyAction(l3, { type: 'kingdomGarrison', settlementId: dawnHome(l3).id, unitId: l3.factions.dawn.supportsAlive[0], dir: 'in' })).toThrow(/Księstwo/);
  });

  it('an empty enemy settlement is taken by walking in; a garrisoned one has to be stormed', () => {
    const empty = atTheGates(game(), []);
    expect(legalHeroMoves(empty.s).find((m) => m.to === empty.home)?.kind).toBe('move');
    const held = atTheGates(game(), ['elfDruid']);
    expect(garrisonAt(held.s, held.home, 'horde')).toBeTruthy();
    expect(legalHeroMoves(held.s).find((m) => m.to === held.home)?.kind).toBe('attackGarrison');
    const s = applyAction(held.s, { type: 'moveHero', to: held.home });
    expect(s.phase).toBe('battle');
    expect(s.battle!.defender).toBe('dawn');
    expect(s.battle!.defenderHero).toBeNull();
    expect(s.battle!.units.elfDruid.side).toBe('dawn');
    expect(s.battle!.siege).toBeUndefined();
  });

  it('a beaten garrison falls and the settlement changes hands; the fallen can be healed like any support', () => {
    const { s: start, home } = atTheGates(game(), ['elfDruid']);
    const s = fightOut(applyAction(start, { type: 'moveHero', to: home }));
    expect(s.phase).not.toBe('battle');
    expect(s.lastBattle!.winner).toBe('horde');
    expect(settlementAt(s, home)!.owner).toBe('horde');
    expect(settlementAt(s, home)!.garrison).toEqual([]);
    expect(s.factions.dawn.supportsDead).toContain('elfDruid');
  });

  it('a garrison that wins keeps the settlement and its survivors stay', () => {
    const { s: start, home } = atTheGates(game(), ['elfDruid', 'nymph', 'pegasus']);
    // A dying attacker: the garrison only has to finish it.
    const s0 = applyAction(start, { type: 'moveHero', to: home });
    const horde = Object.values(s0.battle!.units).filter((u) => u.side === 'horde');
    for (const u of horde) u.hp = 1;
    const s = fightOut(s0);
    expect(s.lastBattle?.winner ?? s.winner).toBe('dawn');
    expect(settlementAt(s, home)!.owner).toBe('dawn');
    expect(settlementAt(s, home)!.garrison!.length).toBeGreaterThan(0);
  });

  it('joins the hero who defends the settlement', () => {
    const { s: start, home } = atTheGates(game(), ['elfDruid']);
    const dawn = Object.values(start.heroes).find((h) => h.faction === 'dawn')!;
    dawn.pos = home;
    let s = applyAction(start, { type: 'moveHero', to: home });
    expect(s.battle!.defenderHero).toBe(dawn.id);
    for (let i = 0; i < 10 && s.battle!.stage !== 'fight'; i++) s = applyAction(s, chooseAction(s)!);
    const defenders = Object.values(s.battle!.units).filter((u) => u.side === 'dawn').map((u) => u.defId);
    expect(defenders).toContain('elfDruid');
    expect(defenders).toContain(dawn.id);
    expect(defenders.length).toBe(4);
  });
});

describe('level 4: moat, walls, towers and the catapult', () => {
  const siege = (walls: number) => {
    const { s: start, home } = atTheGates(game(), ['elfDruid', 'nymph'], walls);
    let s = applyAction(start, { type: 'moveHero', to: home });
    for (let i = 0; i < 10 && s.battle!.stage !== 'fight'; i++) s = applyAction(s, chooseAction(s)!);
    return s;
  };

  it('the moat alone stands at level 1, the wall with a gate and two towers at level 2', () => {
    const one = siege(1).battle!;
    expect(one.siege!.moat).toHaveLength(8);
    expect(one.siege!.walls).toHaveLength(0);
    expect(one.obstacles).toHaveLength(0);
    const two = siege(2).battle!;
    expect(two.siege!.walls).toHaveLength(8);
    expect(two.siege!.gate).toBe(wideCell(SIEGE.wallColumn, SIEGE.gateRow));
    expect(two.siege!.towers).toHaveLength(2);
    expect(two.obstacles).toHaveLength(9);
  });

  it('the towers shoot the attackers at the start of every round', () => {
    const s = siege(2);
    const b = s.battle!;
    const hurt = Object.values(b.units).filter((u) => u.side === 'horde').reduce((n, u) => n + (u.maxHp - u.hp), 0);
    expect(hurt).toBe(2 * SIEGE.towerDamage * (s.rules.statScale ?? 1));
  });

  it('the catapult shoots once a round, only for the attacker, and what it hits falls', () => {
    let s = siege(2);
    const b = () => s.battle!;
    // Bring an attacker to its activation.
    for (let i = 0; i < 40 && b().units[b().activation!.unitId].side !== 'horde'; i++) s = applyAction(s, { type: 'endActivation' });
    const gate = b().siege!.gate!;
    b().siege!.gateHp = 1;
    s = applyAction(s, { type: 'battleCatapult', cell: gate });
    expect(b().siege!.gate).toBeNull();
    expect(b().obstacles).not.toContain(gate);
    expect(() => applyAction(s, { type: 'battleCatapult', cell: b().siege!.towers[0] })).toThrow(/już w tej rundzie/);
    const round = b().round;
    for (let i = 0; i < 60 && (b().round === round || b().units[b().activation!.unitId].side !== 'horde'); i++) s = applyAction(s, { type: 'endActivation' });
    const tower = b().siege!.towers[0];
    s = applyAction(s, { type: 'battleCatapult', cell: tower });
    expect(b().siege!.towers).toHaveLength(1);
    expect(b().siege!.walls).not.toContain(tower);
  });

  it('a unit that walks into the moat is hurt and loses the rest of its turn', () => {
    let s = siege(1);
    const b = () => s.battle!;
    for (let i = 0; i < 40 && b().units[b().activation!.unitId].side !== 'horde'; i++) s = applyAction(s, { type: 'endActivation' });
    const u = b().units[b().activation!.unitId];
    // Stand the unit one step before the moat.
    const before = wideCell(SIEGE.moatColumn - 1, 0);
    const moat = wideCell(SIEGE.moatColumn, 0);
    u.pos = before;
    delete u.tail;
    const hp = u.hp;
    const id = u.id;
    s = applyAction(s, { type: 'battleMove', to: moat });
    expect(s.battle!.units[id].pos).toBe(moat);
    expect(s.battle!.units[id].hp).toBe(hp - SIEGE.moatDamage * (s.rules.statScale ?? 1));
    expect(s.battle!.activation!.unitId).not.toBe(id);
  });

  it('bots storm a walled settlement to the end, and whole games with garrisons finish', () => {
    const done = fightOut(siege(2));
    expect(done.phase).not.toBe('battle');
    for (const seed of [2, 5]) {
      const s = playOut(createGame(setup({ mode: 'pvp', mapSize: 'medium', seed, seats: pvpSeats('goldDragon', 'werewolfLord') }, rules)));
      expect(s.phase).toBe('over');
    }
  });
});
