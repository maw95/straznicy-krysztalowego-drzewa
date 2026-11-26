// Wolna Kompania (docs/frakcje/free.md): the pack, the hidden traps of the Warsztat Sideł (laying them, the way they go off, what the enemy may see of them and what a bot may know),
// the abilities of the faction (the mark, the veil, the leap, the charge...), the Paserka and the Szlaki Przemytnicze, the Spark, then whole games of the Companies.
import { describe, expect, it } from 'vitest';
import { applyAction, createGame, legalHeroMoves, sneakMoves, trailsLeft } from '../src/engine/game';
import { ABILITY, FACTION_HEROES, UNITS } from '../src/engine/data';
import {
  arenaCell,
  attackDamage,
  attackTargets,
  autoTrapCells,
  enemiesOf,
  layTrap,
  leapOnlyCells,
  slowedRange,
  movePath,
  predictDamage,
  reachableCells,
  scaleOf,
  trapSlots,
  trapZone,
  trapsOf,
} from '../src/engine/battle';
import { assignSlots, teamsOf } from '../src/engine/teams';
import { canBeMoved } from '../src/engine/primitives';
import { redactHidden } from '../src/engine/hidden';
import { hideOwnTraps, trapSecrecyOn, trapVeilFor } from '../src/ui/trapVeil';
import { bestLevel, collectIncome, KINGDOM } from '../src/engine/kingdom';
import { chooseAction } from '../src/engine/ai';
import { ARTIFACTS } from '../src/engine/sites';
import { FACTION_MECHANICS } from '../src/engine/empire';
import { distance, parseKey } from '../src/engine/hex';
import { COMMANDERS } from '../src/engine/realm';
import { FACTION_PACKS } from '../src/engine/factions';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../src/engine/types';
import { activation, battleFixture, playOut } from './helpers/engine';

type U = [id: string, side: 'dawn' | 'horde', col: number, half: number, hp?: number];

/** A table of bots, one seat per race, on a rectangle map. */
function table(races: Array<'dawn' | 'horde' | 'herds' | 'undead' | 'clans' | 'frost' | 'free'>, objective: SetupOptions['rules']['objective'], over: Partial<SetupOptions> = {}): SetupOptions {
  const slots = assignSlots(races);
  return {
    mode: 'pvp',
    mapSize: 'long',
    battleMode: 'arena',
    seed: 5,
    mapShape: 'rectangle',
    seats: races.map((race, i) => ({ name: `${race}${i}`, faction: slots[i], race, controller: 'bot' as const, heroId: FACTION_HEROES[race][i % 3] })),
    rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, objective },
    ...over,
  };
}

/** A rivalry game of the Companies (the first side, slot `dawn`) against Horda with the level 6 rules. */
const empire = (): GameState => createGame(table(['free', 'horde'], 'conquest', { seed: 4 }));
const home = (s: GameState) => Object.values(s.kingdom!.settlements).find((x) => x.owner === 'dawn')!;
const at = (s: GameState, id: string) => s.battle!.units[id];

/** A battle of the Companies (side `dawn`) against the Horde with the Warsztat Sideł at `workshop`, no dice; the units of the list come first, then a harmless filler of the Companies. */
function fight(units: U[], workshop = 1, over: Partial<NonNullable<GameState['battle']>> = {}): GameState {
  const s = empire();
  s.rules.useDice = false;
  // the units of the fixture are the board game's size: the numbers of the rules are too
  s.rules.statScale = 1;
  s.rules.hpScale = 1;
  home(s).buildings.trapWorkshop = workshop;
  return battleFixture(s, [...units, ['squirrelArcher', 'dawn', 1, 13]].map(([id, side, col, half, hp]) => ({ id: id as string, side: side as 'dawn' | 'horde', col: col as number, half: half as number, hp: hp as number | undefined })), over);
}
const BEAR: U = ['ancientBear', 'horde', 7, 9, 99];
/** A small walker of the Horde (the bear is a large unit): the one the traps are tried on. */
const RAT: U = ['ratman', 'horde', 7, 9, 99];
/** Makes `who` the active unit (the filler is next). */
const turn = (s: GameState, who: string): GameState => {
  const c = structuredClone(s);
  c.battle!.order = [who, 'squirrelArcher'];
  c.battle!.index = 0;
  c.battle!.activation = activation(who);
  return c;
};
const strike = (s: GameState, att: string, target: string, useAbility = false): GameState => applyAction(turn(s, att), { type: 'battleAttack', targetId: target, useAbility });
const cast = (s: GameState, who: string, extra: { targetId?: string; cell?: string; from?: string } = {}): GameState => applyAction(turn(s, who), { type: 'battleAbility', ...extra });
const dmg = (s: GameState, att: string, victim: string, ua = false) => predictDamage(s, at(s, att), at(s, victim), { useAbility: ua, movedDistance: 0 }).damage;

describe('the pack', () => {
  it('has the three heroes, the three tavern commanders, the fourth hero, twelve units and the legend of the card', () => {
    const p = FACTION_PACKS.free;
    expect(p.heroes).toEqual(['foxCaptain', 'badgerSapper', 'ravenSeer']);
    expect([...p.supports, ...p.tierUnits, ...p.altUnits, p.legend]).toHaveLength(12);
    expect(Object.values(COMMANDERS.free).map((id) => UNITS[id].name)).toEqual(['Kuna Rębajło', 'Żbiczka Bajdurka', 'Zajęczyca Zielarka']);
    expect(UNITS.otterSmuggler.name).toBe('Wydra Przemytniczka');
    expect(UNITS.towerMonitor.size).toBe(2);
    expect(UNITS.toadGunner.size).toBe(2);
    // one toad only (the Poisoner is a polecat)
    expect(Object.values(UNITS).filter((u) => u.side === 'free' && /ropuch/i.test(u.name)).map((u) => u.id)).toEqual(['toadGunner']);
  });

  it('a game of the Companies starts with Ruda Atamanka and her three supports', () => {
    const s = createGame(table(['free', 'dawn'], 'control'));
    expect(teamsOf(s)).toEqual(['dawn', 'horde']);
    expect(Object.values(s.heroes).find((h) => h.faction === 'dawn')?.id).toBe('foxCaptain');
    expect(s.factions.dawn.supportsAlive).toEqual(['otterScout', 'magpieThief', 'squirrelArcher']);
  });
});

describe('Sidła: laying the traps', () => {
  it('the Warsztat Sideł gives 1, 2, 2 and 3 traps by its level; without it none, and the Iskra adds two', () => {
    const slots = (level: number) => trapSlots(fight([BEAR], level), 'dawn');
    expect([0, 1, 2, 3, 4].map(slots)).toEqual([0, 1, 2, 2, 3]);
    const s = fight([BEAR], 1);
    home(s).buildings.spark = 1;
    // the faction that owns the Iskra: two more, even without the workshop
    const owned = fight([BEAR], 0);
    home(owned).buildings.spark = 1;
    expect(trapSlots(owned, 'dawn')).toBe(FACTION_MECHANICS.sparkTraps);
    expect(trapSlots(s, 'dawn')).toBe(1 + FACTION_MECHANICS.sparkTraps);
    // another faction never lays any
    expect(trapSlots(s, 'horde')).toBe(0);
  });

  /** A battle in its deploy stage: the Companies (slot dawn) deploy first. */
  const deploying = (workshop: number): GameState => {
    const s = fight([['foxCaptain', 'dawn', 0, 8], ['magpieThief', 'dawn', 0, 6], BEAR], workshop);
    at(s, 'squirrelArcher').pos = arenaCell(0, 10);
    s.battle!.stage = 'deploy';
    s.battle!.needsDeploy = ['dawn', 'horde'];
    s.battle!.activation = null;
    return s;
  };
  const place = (s: GameState, traps?: string[]) => applyAction(s, { type: 'deployUnits', faction: 'dawn', positions: {}, ...(traps ? { traps } : {}) });

  it('the traps lie in the half of the one who lays them, outside the start columns, the middle column and the obstacles', () => {
    const s = deploying(4);
    const zone = trapZone(s.battle!, 'dawn');
    expect(zone.length).toBeGreaterThan(10);
    for (const k of zone) expect(unitCell(s, k) || s.battle!.obstacles.includes(k)).toBe(false);
    expect(zone.some((k) => k === arenaCell(0, 8) || k === arenaCell(6, 8))).toBe(false);
    const other = trapZone(s.battle!, 'horde');
    expect(zone.filter((k) => other.includes(k))).toHaveLength(0);
  });

  it('chosen cells are laid, the rest is laid for the faction, and the state keeps all of them hidden', () => {
    const s = deploying(4);
    const [a] = trapZone(s.battle!, 'dawn');
    const done = place(s, [a]);
    const mine = trapsOf(done.battle!, 'dawn');
    expect(mine).toHaveLength(3);
    expect(mine.some((g) => g.cell === a)).toBe(true);
    expect(mine.every((g) => g.hidden && g.power === ABILITY.trapDamage * scaleOf(done))).toBe(true);
    expect(trapZone(done.battle!, 'dawn')).toEqual(expect.arrayContaining(mine.map((g) => g.cell)));
  });

  it('a bot lays them without being told (deterministically, not on top of each other)', () => {
    const one = trapsOf(place(deploying(4)).battle!, 'dawn').map((g) => g.cell);
    const two = trapsOf(place(deploying(4)).battle!, 'dawn').map((g) => g.cell);
    expect(one).toEqual(two);
    expect(new Set(one).size).toBe(3);
  });

  it('refuses traps in the enemy half, too many, twice on a cell, on a unit, or from a faction without them', () => {
    const s = deploying(1);
    const mine = trapZone(s.battle!, 'dawn');
    const theirs = trapZone(s.battle!, 'horde');
    expect(() => place(s, [theirs[0]])).toThrow(/swojej połowy/);
    expect(() => place(s, [mine[0], mine[1]])).toThrow(/najwyżej 1/);
    expect(() => place(deploying(2), [mine[0], mine[0]])).toThrow(/jednym polu/);
    const blocked = deploying(2);
    at(blocked, 'ancientBear').pos = mine[0];
    expect(() => place(blocked, [mine[0]])).toThrow(/swojej połowy/);
    expect(() => place(deploying(0), [mine[0]])).toThrow(/nie kładzie/);
  });
});

describe('Sidła: going off', () => {
  /** The bear and a trap on the second cell of its way of two cells; returns the state, the cell of the trap and the end of the way. */
  function trapped(workshop = 1, trapOwner: 'dawn' | 'horde' = 'dawn') {
    const s = fight([['foxCaptain', 'dawn', 0, 8], RAT], workshop);
    const bear = at(s, 'ratman');
    const far = [...reachableCells(turn(s, 'ratman'), bear)].find(([, d]) => d === 2)!;
    const path = movePath(s, bear, far[0]);
    expect(path).toHaveLength(3);
    layTrap(s, trapOwner, path[1]);
    return { s, mid: path[1], end: path[2] };
  }

  it('an enemy that walks over it takes the damage and stops there (it ends its move on the trap)', () => {
    const { s, mid, end } = trapped();
    const done = applyAction(turn(s, 'ratman'), { type: 'battleMove', to: end });
    expect(at(done, 'ratman').pos).toBe(mid);
    expect(at(done, 'ratman').hp).toBe(99 - ABILITY.trapDamage * scaleOf(done));
    expect(trapsOf(done.battle!, 'dawn')).toHaveLength(0);
    expect(done.log.some((l) => l.text.includes('wpada w sidła'))).toBe(true);
  });

  it('a unit of the owner walks over its own trap and nothing happens', () => {
    const s = fight([['foxCaptain', 'dawn', 0, 8], RAT], 1);
    const fox = at(s, 'foxCaptain');
    const target = [...reachableCells(turn(s, 'foxCaptain'), fox)][0][0];
    layTrap(s, 'dawn', target);
    const done = applyAction(turn(s, 'foxCaptain'), { type: 'battleMove', to: target });
    expect(at(done, 'foxCaptain').hp).toBe(at(s, 'foxCaptain').hp);
    expect(trapsOf(done.battle!, 'dawn')).toHaveLength(1);
  });

  it('a flyer passes over a trap on its way and meets only the one it lands on', () => {
    const s = fight([['foxCaptain', 'dawn', 0, 8], ['frostSprite', 'horde', 7, 9, 99]], 1);
    const fairy = at(s, 'frostSprite');
    const cells = [...reachableCells(turn(s, 'frostSprite'), fairy)];
    const [to] = cells.find(([, d]) => d === 2)!;
    const between = cells.find(([k, d]) => d === 1 && k !== to && true)![0];
    layTrap(s, 'dawn', between);
    const done = applyAction(turn(s, 'frostSprite'), { type: 'battleMove', to });
    expect(at(done, 'frostSprite').hp).toBe(99);
    expect(trapsOf(done.battle!, 'dawn')).toHaveLength(1);
    layTrap(s, 'dawn', to);
    const hit = applyAction(turn(s, 'frostSprite'), { type: 'battleMove', to });
    expect(at(hit, 'frostSprite').hp).toBe(99 - ABILITY.trapDamage * scaleOf(hit));
  });

  it('the third level of the workshop holds the unit: it cannot move in its next activation', () => {
    const { s, end } = trapped(3);
    const done = applyAction(turn(s, 'ratman'), { type: 'battleMove', to: end });
    expect(at(done, 'ratman').status.rootLater).toBe(true);
    // its next activation begins rooted
    const next = structuredClone(done);
    next.battle!.order = ['squirrelArcher', 'ratman'];
    next.battle!.index = 0;
    next.battle!.activation = activation('squirrelArcher');
    const after = applyAction(next, { type: 'endActivation' });
    expect(at(after, 'ratman').status.rootedNext).toBe(true);
    expect(at(after, 'ratman').status.rootLater).toBeUndefined();
  });

  it('the level I and II traps only hurt', () => {
    const { s, end } = trapped(2);
    expect(at(applyAction(turn(s, 'ratman'), { type: 'battleMove', to: end }), 'ratman').status.rootLater).toBeUndefined();
  });

  it('a trap of the unit\'s own side never goes off (also not the enemy\'s of the other side: the Horde\'s trap does not hurt the Horde)', () => {
    const { s, end } = trapped(1, 'horde');
    const done = applyAction(turn(s, 'ratman'), { type: 'battleMove', to: end });
    expect(at(done, 'ratman').pos).toBe(end);
    expect(at(done, 'ratman').hp).toBe(99);
  });
});

describe('Sidła: what may be seen', () => {
  it('at a shared screen the Snares are veiled: the deployment is covered, own traps are hidden until peeked at, never online', () => {
    const s = fight([['foxCaptain', 'dawn', 0, 8], BEAR], 1);
    const b = s.battle!;
    layTrap(s, 'dawn', trapZone(b, 'dawn')[0]);
    const two = [{ faction: 'dawn' as const }, { faction: 'horde' as const }];
    expect(trapSecrecyOn(s, two, false)).toBe(true);
    expect(trapSecrecyOn(s, two, true)).toBe(false);
    expect(trapSecrecyOn(s, [two[0]], false)).toBe(false);
    expect(trapSecrecyOn(s, [{ faction: 'horde' as const }, { faction: 'horde' as const }], false)).toBe(false);
    b.stage = 'deploy';
    b.needsDeploy = ['dawn', 'horde'];
    expect(trapVeilFor(s, 'dawn')).toBe(true);
    expect(trapVeilFor(s, 'horde')).toBe(false);
    b.needsDeploy = ['horde', 'dawn'];
    expect(trapVeilFor(s, 'dawn')).toBe(false);
    b.stage = 'fight';
    expect(trapVeilFor(s, 'dawn')).toBe(false);
    // the owner sees the trap through redactHidden, but not through the veil; the veil does not change its argument
    const own = redactHidden(s, ['dawn']);
    expect(own.battle!.ground).toHaveLength(1);
    expect(hideOwnTraps(own, 'dawn').battle!.ground).toHaveLength(0);
    expect(own.battle!.ground).toHaveLength(1);
    expect(hideOwnTraps(own, 'horde')).toBe(own);
  });

  it('redactHidden leaves the enemy\'s hidden traps out and keeps the own ones; the argument is not changed', () => {
    const s = fight([['foxCaptain', 'dawn', 0, 8], BEAR], 1);
    const [a, b] = trapZone(s.battle!, 'dawn');
    layTrap(s, 'dawn', a);
    layTrap(s, 'dawn', b);
    const forHorde = redactHidden(s, ['horde']);
    expect(forHorde.battle!.ground).toHaveLength(0);
    expect(redactHidden(s, null).battle!.ground).toHaveLength(0);
    expect(redactHidden(s, ['dawn']).battle!.ground).toHaveLength(2);
    expect(s.battle!.ground).toHaveLength(2);
    // nothing to hide in the battle: the very same battle comes back (the map has its own fog of war)
    const plain = fight([BEAR], 1);
    expect(redactHidden(plain, ['horde']).battle).toBe(plain.battle);
    expect(JSON.stringify(forHorde.battle)).not.toContain('"kind":"trap"');
  });

  it('what the server would send to the enemy has nothing of the traps, whoever acts (a whole bot game, every state)', () => {
    let s = createGame(table(['free', 'horde'], 'conquest', { seed: 3 }));
    let checked = 0;
    for (let i = 0; i < 6000 && s.phase !== 'over'; i++) {
      s = applyAction(s, chooseAction(s)!);
      if (s.battle?.ground?.length) {
        const seen = redactHidden(s, ['horde']);
        expect(seen.battle!.ground?.length ?? 0).toBe(0);
        for (const g of s.battle!.ground!) expect(JSON.stringify(seen)).not.toContain(`"cell":"${g.cell}"`);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('Oko Kruka uncovers the enemy trap for the Companies only', () => {
    const s = fight([['ravenSeer', 'dawn', 3, 9], ['ancientBear', 'horde', 7, 9, 99]], 1);
    layTrap(s, 'horde', arenaCell(4, 8));
    const done = cast(s, 'ravenSeer', { targetId: 'ancientBear' });
    expect(redactHidden(done, ['dawn']).battle!.ground).toHaveLength(1);
    expect(redactHidden(done, ['horde']).battle!.ground).toHaveLength(1);
    // the Horde sees its own one only: and a trap the raven did not reach stays hidden
    const far = fight([['ravenSeer', 'dawn', 1, 9], ['ancientBear', 'horde', 6, 8, 99]], 1);
    layTrap(far, 'horde', arenaCell(8, 8));
    expect(redactHidden(cast(far, 'ravenSeer', { targetId: 'ancientBear' }), ['dawn']).battle!.ground).toHaveLength(0);
  });

  it('the bot does not know the traps of its enemy: its choices are the same with and without them', () => {
    for (const seed of [1, 2, 3]) {
      let s = createGame(table(['free', 'horde'], 'conquest', { seed }));
      let compared = 0;
      for (let i = 0; i < 4000 && s.phase !== 'over' && compared < 60; i++) {
        const b = s.battle;
        if (b?.ground?.length && b.stage === 'fight') {
          const without = structuredClone(s);
          without.battle!.ground = [];
          // the actor is the side that does NOT own the traps: it must act the same when they are not there
          const actor = b.units[b.activation!.unitId];
          if (b.ground.some((g) => g.owner !== actor.side)) {
            expect(chooseAction(s)).toEqual(chooseAction(without));
            compared++;
          }
        }
        s = applyAction(s, chooseAction(s)!);
      }
      expect(compared).toBeGreaterThan(0);
    }
  });

  it('autoTrapCells reads only the positions of units, never the traps of another side', () => {
    const s = fight([['foxCaptain', 'dawn', 0, 8], ['squirrelArcher', 'dawn', 0, 6], BEAR], 4);
    const before = autoTrapCells(s, 'dawn', 3);
    layTrap(s, 'horde', trapZone(s.battle!, 'horde')[0]);
    expect(autoTrapCells(s, 'dawn', 3)).toEqual(before);
    for (const k of before) expect(trapZone(s.battle!, 'dawn')).toContain(k);
  });
});

describe('Oznaczenie, Ukryty, rany, łup', () => {
  it('Oko Kruka marks an enemy to the end of the round: every attack of the Companies on it hits harder, the squirrel harder still, and the mark lapses', () => {
    let s = fight([['ravenSeer', 'dawn', 3, 9], ['squirrelArcher', 'dawn', 2, 6], ['weaselKnife', 'dawn', 6, 8], BEAR], 1);
    const plain = dmg(s, 'weaselKnife', 'ancientBear');
    const arrow = dmg(s, 'squirrelArcher', 'ancientBear');
    s = cast(s, 'ravenSeer', { targetId: 'ancientBear' });
    expect(dmg(s, 'weaselKnife', 'ancientBear')).toBe(plain + ABILITY.markBonus * scaleOf(s));
    expect(dmg(s, 'squirrelArcher', 'ancientBear')).toBe(arrow + (ABILITY.markBonus + ABILITY.branchBonus) * scaleOf(s));
    // the Horde gets nothing from the mark
    expect(at(s, 'ancientBear').status.marked).toEqual({ by: 'dawn', round: 1 });
    s.battle!.round = 2;
    expect(dmg(s, 'weaselKnife', 'ancientBear')).toBe(plain);
  });

  it('Ukryty: the Jenot cannot be chosen as a target nor seen by the enemy, its first attack is harder and uncovers it', () => {
    const s = fight([['raccoonDogSpy', 'dawn', 6, 8], ['ancientBear', 'horde', 7, 9, 99]], 1);
    const spy = at(s, 'raccoonDogSpy');
    spy.status.veiled = true;
    const bear = turn(s, 'ancientBear');
    expect(attackTargets(bear, at(bear, 'ancientBear'))).toHaveLength(0);
    expect(enemiesOf(bear.battle!, at(bear, 'ancientBear')).map((u) => u.id)).not.toContain('raccoonDogSpy');
    const plain = attackDamage(s, { ...spy, status: { ...spy.status, veiled: undefined } }, at(s, 'ancientBear'), false, 0);
    expect(attackDamage(s, spy, at(s, 'ancientBear'), false, 0)).toBe(plain + ABILITY.veilBonus * scaleOf(s));
    const done = strike(s, 'raccoonDogSpy', 'ancientBear');
    expect(at(done, 'raccoonDogSpy').status.veiled).toBeUndefined();
    expect(done.log.some((l) => l.text.includes('wychodzi z ukrycia'))).toBe(true);
    // the screen of the enemy does not have it on the board
    const seen = redactHidden(s, ['horde']);
    expect(seen.battle!.units.raccoonDogSpy.pos).toBeNull();
    expect(redactHidden(s, ['dawn']).battle!.units.raccoonDogSpy.pos).not.toBeNull();
  });

  it('the Jenot starts every battle veiled, and steps out when it is all the side has left', () => {
    const s = fight([['raccoonDogSpy', 'dawn', 0, 8], ['ratman', 'horde', 12, 8]], 1);
    at(s, 'squirrelArcher').pos = arenaCell(0, 10);
    s.battle!.stage = 'deploy';
    s.battle!.needsDeploy = ['dawn', 'horde'];
    s.battle!.activation = null;
    const begun = applyAction(applyAction(s, { type: 'deployUnits', faction: 'dawn', positions: {} }), { type: 'deployUnits', faction: 'horde', positions: {} });
    expect(begun.battle!.stage).toBe('fight');
    expect(at(begun, 'raccoonDogSpy').status.veiled).toBe(true);
    expect(at(begun, 'squirrelArcher').status.veiled).toBeUndefined();
    const onlySpy = fight([['raccoonDogSpy', 'dawn', 6, 8], BEAR], 1);
    delete onlySpy.battle!.units.squirrelArcher;
    at(onlySpy, 'raccoonDogSpy').status.veiled = true;
    const done = applyAction(turn(onlySpy, 'ancientBear'), { type: 'endActivation' });
    expect(at(done, 'raccoonDogSpy').status.veiled).toBeUndefined();
  });

  it('a unit that walks into the cell of a veiled enemy uncovers it and does not move', () => {
    const s = fight([['raccoonDogSpy', 'dawn', 6, 8], BEAR], 1);
    at(s, 'raccoonDogSpy').status.veiled = true;
    const done = applyAction(turn(s, 'ancientBear'), { type: 'battleMove', to: at(s, 'raccoonDogSpy').pos! });
    expect(at(done, 'raccoonDogSpy').status.veiled).toBeUndefined();
    expect(at(done, 'ancientBear').pos).toBe(at(s, 'ancientBear').pos);
  });

  it('Furia Ran: +1 A for every few missing Życie, at most +3', () => {
    const s = fight([['wolverine', 'dawn', 6, 8], BEAR], 1);
    const full = attackDamage(s, at(s, 'wolverine'), at(s, 'ancientBear'), false, 0);
    at(s, 'wolverine').hp = at(s, 'wolverine').maxHp - ABILITY.furyStep;
    expect(attackDamage(s, at(s, 'wolverine'), at(s, 'ancientBear'), false, 0)).toBe(full + scaleOf(s));
    at(s, 'wolverine').hp = 1;
    expect(attackDamage(s, at(s, 'wolverine'), at(s, 'ancientBear'), false, 0)).toBe(full + ABILITY.furyMax * scaleOf(s));
  });

  it('Kieszonkowiec: the first blow at a hero gives the faction gold, once; a blow at a support gives nothing', () => {
    let s = fight([['magpieThief', 'dawn', 6, 8], BEAR], 1);
    const gold = s.kingdom!.gold.dawn;
    s = strike(s, 'magpieThief', 'ancientBear');
    expect(s.kingdom!.gold.dawn).toBe(gold + ABILITY.pickpocketGold);
    expect(at(s, 'magpieThief').abilityUsed).toBe(true);
    s = strike(s, 'magpieThief', 'ancientBear');
    expect(s.kingdom!.gold.dawn).toBe(gold + ABILITY.pickpocketGold);
    const sup = fight([['magpieThief', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]], 1);
    expect(strike(sup, 'magpieThief', 'ratman').kingdom!.gold.dawn).toBe(sup.kingdom!.gold.dawn);
  });

  it('Riposta: a melee attacker that survives takes a counterblow; a shooter does not', () => {
    const s = fight([['catFencer', 'dawn', 6, 8], BEAR], 1);
    s.battle!.units.ancientBear.hp = 99;
    const done = strike({ ...s, battle: { ...s.battle!, order: ['ancientBear', 'catFencer'] } } as GameState, 'ancientBear', 'catFencer');
    expect(at(done, 'ancientBear').hp).toBe(99 - ABILITY.riposteDamage * scaleOf(s));
    const shot = fight([['catFencer', 'dawn', 6, 8], ['hordeCrossbow', 'horde', 10, 8, 99]], 1);
    expect(at(strike(shot, 'hordeCrossbow', 'catFencer'), 'hordeCrossbow').hp).toBe(99);
  });
});

describe('free actions and the leap', () => {
  it('Ładunek: the own trap goes off, hurting its cell and the neighbours (allies too); the trap is spent', () => {
    let s = fight([['marmotPetard', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9, 99], ['magpieThief', 'dawn', 5, 7]], 1);
    const cell = arenaCell(5, 9);
    layTrap(s, 'dawn', cell);
    layTrap(s, 'dawn', arenaCell(2, 6));
    const thief = at(s, 'magpieThief').hp;
    s = cast(s, 'marmotPetard', { cell });
    expect(trapsOf(s.battle!, 'dawn').map((g) => g.cell)).toEqual([arenaCell(2, 6)]);
    expect(at(s, 'ancientBear').hp).toBe(99 - ABILITY.blastDamage * scaleOf(s));
    expect(at(s, 'magpieThief').hp).toBe(thief - ABILITY.blastDamage * scaleOf(s));
    expect(() => cast(fight([['marmotPetard', 'dawn', 4, 8], BEAR], 1), 'marmotPetard', { cell })).toThrow(/własną pułapkę/);
  });

  it('Tama: puts an obstacle next to the beaver, once', () => {
    const s = fight([['beaverEngineer', 'dawn', 5, 7], BEAR], 1);
    const before = s.battle!.obstacles.length;
    const done = cast(s, 'beaverEngineer');
    expect(done.battle!.obstacles.length).toBe(before + 1);
    expect(done.battle!.raised).toHaveLength(1);
    const cell = done.battle!.obstacles[done.battle!.obstacles.length - 1];
    expect(unitCell(done, cell)).toBe(false);
    expect(() => cast(s, 'beaverEngineer', { cell: arenaCell(9, 9) })).toThrow(/obok bobra/);
  });

  it('Fortel: lays one more trap, or moves one of her own (not onto a cell outside her half)', () => {
    let s = fight([['foxCaptain', 'dawn', 2, 8], BEAR], 1);
    const [a, b] = trapZone(s.battle!, 'dawn').filter((k) => !at(s, 'foxCaptain').pos?.includes(k));
    s = cast(s, 'foxCaptain', { cell: a });
    expect(trapsOf(s.battle!, 'dawn').map((g) => g.cell)).toEqual([a]);
    const again = fight([['foxCaptain', 'dawn', 2, 8], BEAR], 1);
    layTrap(again, 'dawn', a);
    const moved = cast(again, 'foxCaptain', { from: a, cell: b });
    expect(trapsOf(moved.battle!, 'dawn').map((g) => g.cell)).toEqual([b]);
    expect(() => cast(fight([['foxCaptain', 'dawn', 2, 8], BEAR], 1), 'foxCaptain', { cell: trapZone(s.battle!, 'horde')[0] })).toThrow(/swojej połowy/);
    expect(() => cast(fight([['foxCaptain', 'dawn', 2, 8], BEAR], 1), 'foxCaptain', { from: a, cell: b })).toThrow(/nie masz pułapki/i);
  });

  it('Okop: armour and no pushing until the end of the next activation, then it wears off', () => {
    let s = fight([['badgerSapper', 'dawn', 6, 8], BEAR], 1);
    const plain = dmg(s, 'ancientBear', 'badgerSapper');
    s = cast(s, 'badgerSapper');
    expect(at(s, 'badgerSapper').status.dugIn).toBe(ABILITY.dugInActivations);
    expect(dmg(s, 'ancientBear', 'badgerSapper')).toBe(Math.max(1, plain - ABILITY.dugInArmor * scaleOf(s)));
    expect(canBeMoved(s, at(s, 'badgerSapper'))).toBe(false);
    // the end of this activation and of the next one
    let t = applyAction(s, { type: 'endActivation' });
    expect(at(t, 'badgerSapper').status.dugIn).toBe(1);
    t = structuredClone(t);
    t.battle!.order = ['badgerSapper', 'squirrelArcher'];
    t.battle!.index = 0;
    t.battle!.activation = activation('badgerSapper');
    t = applyAction(t, { type: 'endActivation' });
    expect(at(t, 'badgerSapper').status.dugIn).toBeUndefined();
    expect(canBeMoved(t, at(t, 'badgerSapper'))).toBe(true);
  });

  it('Smrodliwa Mikstura: the target and its neighbours are poisoned (not the others)', () => {
    const s = fight([['polecatPoisoner', 'dawn', 3, 9], ['ancientBear', 'horde', 7, 9, 99], ['ratman', 'horde', 8, 10, 99], ['hordeCrossbow', 'horde', 11, 9, 99]], 1);
    const done = strike(s, 'polecatPoisoner', 'ancientBear', true);
    expect(at(done, 'ancientBear').status.poisoned).toBe(ABILITY.poisonTicks);
    expect(at(done, 'ratman').status.poisoned).toBe(ABILITY.poisonTicks);
    expect(at(done, 'hordeCrossbow').status.poisoned).toBeUndefined();
  });

  it('Szalony Skok: once per battle Żbiczka leaps over units and obstacles to a cell the walk does not reach, and her blow after it is harder', () => {
    const s = fight([['wildcatBajka', 'dawn', 4, 8], ['ancientBear', 'horde', 6, 8, 99]], 1);
    // slower by nature (not by a slow: that cuts the leap too), so that the walk is shorter than the leap
    at(s, 'wildcatBajka').status.battleSpeedBonus = -2;
    const cat = at(s, 'wildcatBajka');
    const ready = turn(s, 'wildcatBajka');
    const only = [...leapOnlyCells(ready, at(ready, 'wildcatBajka'))];
    expect(only.length).toBeGreaterThan(0);
    // the cell behind the bear: next to it, so that the blow after the leap is possible
    const to = only.find((k) => distance(parseKey(k), parseKey(at(s, 'ancientBear').pos!)) === 1)!;
    expect(to).toBeDefined();
    expect(reachableCells(ready, cat).has(to)).toBe(true);
    const done = applyAction(ready, { type: 'battleMove', to });
    expect(at(done, 'wildcatBajka').pos).toBe(to);
    expect(at(done, 'wildcatBajka').status.leapUsed).toBe(true);
    expect(done.battle!.activation?.leaped).toBe(true);
    const harder = attackDamage(done, at(done, 'wildcatBajka'), at(done, 'ancientBear'), false, 0);
    const plain = structuredClone(done);
    delete plain.battle!.activation!.leaped;
    expect(harder).toBe(attackDamage(plain, at(plain, 'wildcatBajka'), at(plain, 'ancientBear'), false, 0) + ABILITY.wildLeapBonus * scaleOf(done));
    // spent: no more leap cells
    expect(leapOnlyCells(done, at(done, 'wildcatBajka')).size).toBe(0);
  });

  it('a slow (or cold) shortens the leap and the hop by the speed lost, a root cancels them (backlog 58a)', () => {
    const s = fight([['wildcatBajka', 'dawn', 8, 8], ['ancientBear', 'horde', 12, 8, 99]], 1);
    const cat = at(s, 'wildcatBajka');
    expect(slowedRange(cat, 3)).toBe(3);
    cat.status.slowNext = 2;
    expect(slowedRange(cat, 3)).toBe(1);
    cat.status.auraChill = 1;
    expect(slowedRange(cat, 3)).toBe(0);
    cat.status.slowNext = 0;
    cat.status.auraChill = 0;
    cat.status.rootedNext = true;
    expect(slowedRange(cat, 3)).toBe(0);
  });

  it('Szarża Światła counts the cells really walked, not the straight line (backlog 58b)', () => {
    const s = fight([['unicornKing', 'dawn', 6, 8], ['ancientBear', 'horde', 8, 8, 99]], 1);
    const king = at(s, 'unicornKing');
    const ready = turn(s, 'unicornKing');
    // a ring of rocks with one gap: to reach the far side the unit has to go round, so the way is longer than the straight line
    const ring = [...reachableCells(ready, at(ready, 'unicornKing'))].filter(([k]) => distance(parseKey(king.pos!), parseKey(k)) === 2).map(([k]) => k);
    ready.battle!.obstacles = [...ready.battle!.obstacles, ...ring.slice(1)];
    const reach = reachableCells(ready, at(ready, 'unicornKing'));
    const around = [...reach].find(([k, d]) => d >= ABILITY.lightChargeMinMove && distance(parseKey(king.pos!), parseKey(k)) < ABILITY.lightChargeMinMove);
    expect(around).toBeDefined();
    const done = applyAction(ready, { type: 'battleMove', to: around![0] });
    expect(done.battle!.activation!.movedDistance).toBe(around![1]);
    expect(attackDamage(done, at(done, 'unicornKing'), at(done, 'ancientBear'), false, done.battle!.activation!.movedDistance)).toBeGreaterThan(
      attackDamage(done, at(done, 'unicornKing'), at(done, 'ancientBear'), false, 0),
    );
  });

  it('Szalony Skok does not set off the traps it flies over', () => {
    const s = fight([['wildcatBajka', 'dawn', 8, 8], ['ancientBear', 'horde', 12, 8, 99]], 1);
    at(s, 'wildcatBajka').status.battleSpeedBonus = -2;
    const ready = turn(s, 'wildcatBajka');
    const only = [...leapOnlyCells(ready, at(ready, 'wildcatBajka'))];
    expect(only.length).toBeGreaterThan(0);
    const to = only[0];
    // a trap on every other cell round her: the walk would meet one, the leap meets none
    for (const k of reachableCells(ready, at(ready, 'wildcatBajka')).keys()) if (k !== to) layTrap(ready, 'horde', k);
    const done = applyAction(ready, { type: 'battleMove', to });
    expect(at(done, 'wildcatBajka').pos).toBe(to);
    expect(at(done, 'wildcatBajka').hp).toBe(at(ready, 'wildcatBajka').hp);
    expect(done.battle!.ground!.length).toBe(ready.battle!.ground!.length);
  });

  it('Ruchoma Twierdza: the turret shoots the nearest enemy in its sight once a round, at the end of the Waran\'s activation', () => {
    let s = fight([['towerMonitor', 'dawn', 5, 9], ['ancientBear', 'horde', 8, 8, 99]], 1);
    s = applyAction(turn(s, 'towerMonitor'), { type: 'endActivation' });
    expect(at(s, 'ancientBear').hp).toBe(99 - ABILITY.towerDamage * scaleOf(s));
    expect(at(s, 'towerMonitor').status.towerRound).toBe(1);
    // the same round: no second shot
    const t = applyAction(turn(s, 'towerMonitor'), { type: 'endActivation' });
    expect(at(t, 'ancientBear').hp).toBe(at(s, 'ancientBear').hp);
    // the next round: again
    const u = structuredClone(t);
    u.battle!.round = 2;
    expect(at(applyAction(turn(u, 'towerMonitor'), { type: 'endActivation' }), 'ancientBear').hp).toBe(at(s, 'ancientBear').hp - ABILITY.towerDamage * scaleOf(s));
  });
});

const unitCell = (s: GameState, cell: string) => Object.values(s.battle!.units).some((u) => u.pos === cell || u.tail === cell);

describe('Paserka and Szlaki Przemytnicze', () => {
  it('the Paserka buys backpack artifacts at the full market price; the second level brings a treasure every third round', () => {
    const s = empire();
    const hero = s.heroes[s.turnOrder[s.turnIndex]];
    const art = ARTIFACTS.find((a) => a.rarity === 2)!;
    const sell = () => applyAction(s, { type: 'kingdomSellArtifact', settlementId: home(s).id, artifactId: art.id });
    hero.pack = [art.id];
    expect(() => sell()).toThrow(/Paserka/);
    home(s).buildings.fence = 1;
    expect(bestLevel(s, home(s).owner!, 'fence')).toBe(1);
    const gold = s.kingdom!.gold[hero.faction];
    const done = sell();
    expect(done.kingdom!.gold[hero.faction]).toBe(gold + KINGDOM.artifactPrice[art.rarity - 1]);
    expect(done.heroes[hero.id].pack ?? []).toHaveLength(0);
    expect(() => applyAction(done, { type: 'kingdomSellArtifact', settlementId: home(s).id, artifactId: art.id })).toThrow(/plecaku/);
    home(s).buildings.fence = 2;
    const items = s.factions.dawn.inventory.length;
    s.round = 2;
    collectIncome(s);
    expect(s.factions.dawn.inventory).toHaveLength(items);
    s.round = FACTION_MECHANICS.fenceTreasureEvery;
    collectIncome(s);
    expect(s.factions.dawn.inventory).toHaveLength(items + 1);
    collectIncome(s);
    expect(s.factions.dawn.inventory).toHaveLength(items + 1);
  });

  it('a chest gives +1 gold on top with the Paserka', () => {
    const s = empire();
    const hero = Object.values(s.heroes).find((h) => h.faction === 'dawn')!;
    home(s).buildings.fence = 1;
    s.kingdom!.chest = { heroId: hero.id } as never;
    const gold = s.kingdom!.gold.dawn;
    const done = applyAction(s, { type: 'chestTake', what: 'gold' });
    expect(done.kingdom!.gold.dawn).toBeGreaterThanOrEqual(gold + FACTION_MECHANICS.fenceChestGold);
    expect(done.log.some((l) => l.text.includes('Paserka'))).toBe(true);
  });

  /** A hero of the Companies next to a guardian's hex, with the trails built. */
  function beside(): { s: GameState; to: string } {
    const s = empire();
    s.rules.heroGrowth = true;
    const hero = Object.values(s.heroes).find((h) => h.faction === 'dawn')!;
    s.turnOrder = [hero.id];
    s.turnIndex = 0;
    s.movePoints = 6;
    // put the first crystal guardian next to the hero
    const crystal = Object.values(s.crystals).find((c) => c.guardian)!;
    const neighbours = legalHeroMoves(s).filter((m) => m.kind === 'move').map((m) => m.to);
    const to = neighbours[0];
    s.tiles[to].crystalId = crystal.id;
    s.tiles[to].treasureId = null;
    crystal.at = to;
    return { s, to };
  }

  it('without the trails nothing sneaks; with them a hero walks through a guardian\'s hex once a round and no battle starts', () => {
    const { s, to } = beside();
    expect(trailsLeft(s, 'dawn')).toBe(0);
    expect(sneakMoves(s)).toHaveLength(0);
    expect(() => applyAction(s, { type: 'sneakHero', to })).toThrow(/Szlaki/);
    home(s).buildings.smugglerTrails = 1;
    expect(trailsLeft(s, 'dawn')).toBe(FACTION_MECHANICS.trailsPerRound);
    expect(sneakMoves(s).map((m) => m.to)).toContain(to);
    const done = applyAction(s, { type: 'sneakHero', to });
    expect(done.phase).toBe('adventure');
    expect(done.battle).toBeNull();
    const hero = Object.values(done.heroes).find((h) => h.faction === 'dawn')!;
    expect(hero.pos).toBe(to);
    expect(trailsLeft(done, 'dawn')).toBe(0);
  });

  it('only a faction of the Companies has the trails', () => {
    const s = createGame(table(['dawn', 'horde'], 'conquest', { seed: 4 }));
    expect(trailsLeft(s, 'dawn')).toBe(0);
  });
});

describe('the Spark and the building of the Companies', () => {
  it('the Skrytka gives no bonus to the units of the Companies (it lays traps)', () => {
    const s = empire();
    home(s).buildings.spark = 1;
    expect(trapSlots(s, 'dawn')).toBe(FACTION_MECHANICS.sparkTraps);
    // a battle begun in this game: no bonus on the units, but two traps are to be laid
    const b = fight([['squirrelArcher', 'dawn', 3, 9], BEAR], 0);
    expect(b.battle!.units.squirrelArcher.status.battleAttackBonus).toBe(0);
    home(b).buildings.spark = 1;
    expect(trapSlots(b, 'dawn')).toBe(FACTION_MECHANICS.sparkTraps);
  });
});

describe('games with the Free Companies', () => {
  for (const [a, b] of [['free', 'dawn'], ['free', 'horde'], ['herds', 'free'], ['free', 'undead'], ['clans', 'free'], ['free', 'frost']] as const) {
    for (const objective of ['control', 'conquest', 'relic'] as const) {
      it(`${a} against ${b}, goal ${objective}: bots play to the end on several seeds`, () => {
        for (const seed of [1, 2]) {
          const end = playOut(createGame(table([a, b], objective, { seed })));
          expect(end.phase).toBe('over');
        }
      });
    }
  }

  it('the traps do go off in the games of the bots (they are laid, hidden and spent)', () => {
    let wentOff = 0;
    for (const seed of [1, 2, 3, 4]) {
      const end = playOut(createGame(table(['free', 'horde'], 'conquest', { seed })));
      wentOff += end.log.filter((l) => l.text.includes('wpada w sidła')).length;
    }
    expect(wentOff).toBeGreaterThan(0);
  });

  it('four sides with the Companies play a conquest to the end', () => {
    const end = playOut(createGame(table(['dawn', 'free', 'herds', 'undead'], 'conquest', { seed: 3 })));
    expect(end.phase).toBe('over');
  });

  it('coop refuses the Companies with a clear error', () => {
    const coop = { ...table(['free', 'horde'], 'survival'), mode: 'coop' as const };
    coop.seats = [{ ...coop.seats[0], faction: 'dawn' }];
    expect(() => createGame(coop)).toThrow(/tylko w rywalizacji/);
  });
});
