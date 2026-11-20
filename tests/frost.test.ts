// Dwór Wiecznego Szronu (docs/frakcje/frost.md): frost that builds up and freezes (the levels of the Pałac Szronu), the abilities of the faction, the Kryształowa Grota,
// the Wieża Zamieci, the Spark, then whole games of the Court against the other factions.
import { describe, expect, it } from 'vitest';
import { applyAction, createGame, moveBreakdown } from '../src/engine/game';
import { ABILITY, FACTION_HEROES, UNITS } from '../src/engine/data';
import { arenaCell, attackDamage, frostThreshold, iceWallCells, predictDamage, reachableCells, refreshAuras, scaleOf, sparkFrost, unitSpeed } from '../src/engine/battle';
import { assignSlots, teamsOf } from '../src/engine/teams';
import { canBeMoved } from '../src/engine/primitives';
import { botPurchase, resourceIncomeOf } from '../src/engine/kingdom';
import { FACTION_MECHANICS } from '../src/engine/empire';
import { parseKey, distance } from '../src/engine/hex';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../src/engine/types';
import { activation, battleFixture, playOut } from './helpers/engine';

type U = [id: string, side: 'dawn' | 'horde', col: number, half: number, hp?: number];

/** A table of bots, one seat per race, on a rectangle map. */
function table(races: Array<'dawn' | 'horde' | 'herds' | 'undead' | 'clans' | 'frost'>, objective: SetupOptions['rules']['objective'], over: Partial<SetupOptions> = {}): SetupOptions {
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

/** A rivalry game of the Court (the first side, slot `dawn`) against Horda with the level 6 rules. */
const empire = (): GameState => createGame(table(['frost', 'horde'], 'conquest', { seed: 4 }));
const home = (s: GameState) => Object.values(s.kingdom!.settlements).find((x) => x.owner === 'dawn')!;
const at = (s: GameState, id: string) => s.battle!.units[id];

/** A battle of the Court (side `dawn`) against the Horde's bears with the Pałac Szronu at `palace`, no dice; the units of the list come first, then a harmless filler of the Court (so that the next activation is never the target's). */
function fight(units: U[], palace = 1, over: Partial<NonNullable<GameState['battle']>> = {}): GameState {
  const s = empire();
  s.rules.useDice = false;
  home(s).buildings.frostPalace = palace;
  return battleFixture(s, [...units, ['courtPage', 'dawn', 12, 8]].map(([id, side, col, half, hp]) => ({ id: id as string, side: side as 'dawn' | 'horde', col: col as number, half: half as number, hp: hp as number | undefined })), over);
}
const BEAR: U = ['ancientBear', 'horde', 6, 8, 99];
/** The unit attacks (the next one to act is the filler); returns the new state. */
const strike = (s: GameState, att: string, target: string, useAbility = false): GameState => {
  const c = structuredClone(s);
  c.battle!.order = [att, 'courtPage'];
  c.battle!.index = 0;
  c.battle!.activation = activation(att);
  return applyAction(c, { type: 'battleAttack', targetId: target, useAbility });
};
/** The unit uses its free ability. */
const cast = (s: GameState, who: string, targetId?: string): GameState => {
  const c = structuredClone(s);
  c.battle!.order = [who, 'courtPage'];
  c.battle!.index = 0;
  c.battle!.activation = activation(who);
  return applyAction(c, { type: 'battleAbility', ...(targetId ? { targetId } : {}) });
};
const frostOf = (s: GameState, id: string) => at(s, id).status.frost ?? 0;
const dmg = (s: GameState, att: string, victim: string, ua = false) => predictDamage(s, at(s, att), at(s, victim), { useAbility: ua, movedDistance: 0 }).damage;

describe('Szron and the Pałac Szronu', () => {
  it('without the Pałac Szronu an ordinary blow puts no frost', () => {
    const s = strike(fight([['ermine', 'dawn', 5, 9], BEAR], 0), 'ermine', 'ancientBear');
    expect(frostOf(s, 'ancientBear')).toBe(0);
    expect(at(s, 'ancientBear').hp).toBeLessThan(99);
  });

  it('level I: every blow puts 1 frost, the third freezes the target (it loses its next activation and the frost goes)', () => {
    let s = fight([['ermine', 'dawn', 5, 9], BEAR], 1);
    expect(frostThreshold(s, 'dawn')).toBe(3);
    s = strike(s, 'ermine', 'ancientBear');
    expect(frostOf(s, 'ancientBear')).toBe(1);
    s = strike(s, 'ermine', 'ancientBear');
    expect(frostOf(s, 'ancientBear')).toBe(2);
    expect(at(s, 'ancientBear').status.stunned).toBeUndefined();
    s = strike(s, 'ermine', 'ancientBear');
    expect(frostOf(s, 'ancientBear')).toBe(0);
    expect(at(s, 'ancientBear').status.stunned).toBe(true);
    expect(at(s, 'ancientBear').status.brittle).toBeUndefined();
  });

  it('level II: the target freezes at 2 frosts', () => {
    let s = fight([['ermine', 'dawn', 5, 9], BEAR], 2);
    expect(frostThreshold(s, 'dawn')).toBe(2);
    s = strike(strike(s, 'ermine', 'ancientBear'), 'ermine', 'ancientBear');
    expect(at(s, 'ancientBear').status.stunned).toBe(true);
  });

  it('a frozen unit loses its activation: the lost turn is spent and the freeze is over', () => {
    const s = fight([['ermine', 'dawn', 5, 9], BEAR], 2);
    s.battle!.units.ancientBear.status.stunned = true;
    s.battle!.order = ['courtPage', 'ancientBear'];
    s.battle!.index = 0;
    s.battle!.activation = activation('courtPage');
    const done = applyAction(s, { type: 'endActivation' });
    // the next activation was the bear's: it was skipped at once
    expect(at(done, 'ancientBear').status.stunned).toBeUndefined();
    expect(done.log.some((l) => l.text.includes('traci aktywację'))).toBe(true);
  });

  it('level III: a frozen unit takes one more damage from the next blow (and only from that one)', () => {
    let s = fight([['ermine', 'dawn', 5, 9], BEAR], 3);
    s.battle!.units.ancientBear.status.frost = 1;
    const plain = dmg(s, 'ermine', 'ancientBear');
    s = strike(s, 'ermine', 'ancientBear');
    expect(at(s, 'ancientBear').status.brittle).toBe(true);
    expect(dmg(s, 'ermine', 'ancientBear')).toBe(plain + scaleOf(s));
    const hp = at(s, 'ancientBear').hp;
    s = strike(s, 'ermine', 'ancientBear');
    expect(hp - at(s, 'ancientBear').hp).toBe(plain + scaleOf(s));
    expect(at(s, 'ancientBear').status.brittle).toBeUndefined();
  });

  it('level IV: every frost takes 1 S from the unit', () => {
    let s = fight([['ermine', 'dawn', 5, 9], BEAR], 4);
    const speed = unitSpeed(at(s, 'ancientBear'));
    s = strike(s, 'ermine', 'ancientBear');
    expect(unitSpeed(at(s, 'ancientBear'))).toBe(speed - 1);
    const low = strike(fight([['ermine', 'dawn', 5, 9], BEAR], 3), 'ermine', 'ancientBear');
    expect(unitSpeed(at(low, 'ancientBear'))).toBe(speed);
  });

  it('the Iskra of the Court: the enemies start the battle with 1 frost, the Court\'s own units with none', () => {
    const s = fight([['ermine', 'dawn', 5, 9], BEAR], 1);
    home(s).buildings.spark = 1;
    sparkFrost(s);
    expect(frostOf(s, 'ancientBear')).toBe(FACTION_MECHANICS.sparkFrost);
    expect(frostOf(s, 'ermine')).toBe(0);
    const none = fight([['ermine', 'dawn', 5, 9], BEAR], 1);
    sparkFrost(none);
    expect(frostOf(none, 'ancientBear')).toBe(0);
  });
});

describe('abilities of the heroes', () => {
  it('Lodowy Cios (Jarl): the target freezes at once, once per battle', () => {
    let s = fight([['frostJarl', 'dawn', 5, 9], BEAR], 0);
    s = strike(s, 'frostJarl', 'ancientBear', true);
    expect(at(s, 'ancientBear').status.stunned).toBe(true);
    expect(at(s, 'frostJarl').abilityUsed).toBe(true);
    expect(() => strike(s, 'frostJarl', 'ancientBear', true)).toThrow();
  });

  it('Lodowa Ściana (Marzanna): three cells in a line, an obstacle for two rounds, once per battle', () => {
    let s = fight([['marzanna', 'dawn', 3, 9], ['ancientBear', 'horde', 8, 8]], 0);
    const cells = iceWallCells(s, at(s, 'marzanna'))!;
    expect(cells).toHaveLength(3);
    const [a, b, c] = cells.map(parseKey).sort((x, y) => x.q - y.q || x.r - y.r);
    // one axis: the two steps between the cells are the same
    expect({ q: b.q - a.q, r: b.r - a.r }).toEqual({ q: c.q - b.q, r: c.r - b.r });
    expect(cells.every((k) => distance(parseKey(k), parseKey(at(s, 'marzanna').pos!)) <= ABILITY.iceWallReach + 1)).toBe(true);
    s = cast(s, 'marzanna');
    for (const k of cells) expect(s.battle!.obstacles).toContain(k);
    expect(s.battle!.raised).toEqual(expect.arrayContaining(cells));
    expect(s.battle!.ice!.every((i) => i.until === s.battle!.round + ABILITY.iceWallRounds - 1)).toBe(true);
    expect(at(s, 'marzanna').abilityUsed).toBe(true);
    expect(() => cast(s, 'marzanna')).toThrow();
  });

  it('Lodowa Ściana melts after its two rounds (the cells are free again, the unit can step on them)', () => {
    let s = fight([['marzanna', 'dawn', 3, 9], ['ancientBear', 'horde', 8, 8]], 0);
    s = cast(s, 'marzanna');
    const cells = s.battle!.ice!.map((i) => i.cell);
    // end every activation of the rounds until round 3 begins
    for (let i = 0; i < 40 && s.battle && s.battle.round < 3; i++) s = applyAction(s, { type: 'endActivation' });
    expect(s.battle!.round).toBe(3);
    for (const k of cells) expect(s.battle!.obstacles).not.toContain(k);
    expect(s.battle!.raised ?? []).toHaveLength(0);
    expect(s.battle!.ice).toHaveLength(0);
  });

  it('Ślad Zamieci (Ryś): an enemy that steps on a cell the lynx has run through this round is slowed in its next activation', () => {
    let s = fight([['snowLynx', 'dawn', 3, 9], ['ancientBear', 'horde', 6, 8]], 0);
    const to = arenaCell(5, 9);
    s = applyAction(s, { type: 'battleMove', to });
    expect(s.battle!.trail!.length).toBeGreaterThan(0);
    expect(s.battle!.trail!.every((t) => t.side === 'dawn')).toBe(true);
    // the bear acts next and walks onto the trail
    const c = structuredClone(s);
    c.battle!.order = ['ancientBear', 'courtPage'];
    c.battle!.index = 0;
    c.battle!.activation = activation('ancientBear');
    const onTrail = [...reachableCells(c, at(c, 'ancientBear')).keys()].find((k) => c.battle!.trail!.some((t) => t.cell === k))!;
    expect(onTrail).toBeDefined();
    const out = applyAction(c, { type: 'battleMove', to: onTrail });
    expect(at(out, 'ancientBear').status.slowLater ?? 0).toBe(ABILITY.trailSlow);
    // the trail does not slow its own side, and is gone with the round
    const own = structuredClone(s);
    own.battle!.order = ['courtPage', 'ancientBear'];
    own.battle!.units.courtPage.pos = arenaCell(7, 7);
    own.battle!.activation = activation('courtPage');
    expect(at(applyAction(own, { type: 'battleMove', to: arenaCell(6, 6) }), 'courtPage').status.slowLater ?? 0).toBe(0);
  });

  it('Grad Głazów (Stary Gradowy): the shot hits the target and its neighbours, each gets frost; no ally is hit', () => {
    let s = fight([['oldHailer', 'dawn', 2, 8], ['ancientBear', 'horde', 6, 8, 99], ['willOWisp', 'horde', 7, 9, 99], ['elfDruid', 'dawn', 6, 10]], 0);
    s = strike(s, 'oldHailer', 'ancientBear');
    expect(frostOf(s, 'ancientBear')).toBe(1);
    expect(frostOf(s, 'willOWisp')).toBe(1);
    expect(at(s, 'willOWisp').hp).toBeLessThan(99);
    expect(at(s, 'elfDruid').hp).toBe(UNITS.elfDruid.hp);
  });
});

describe('abilities of the units', () => {
  it('Lodowa Igła (Chochlik): the target has −S in its next activation, once per battle', () => {
    let s = fight([['frostImp', 'dawn', 4, 8], BEAR], 0);
    s = strike(s, 'frostImp', 'ancientBear', true);
    expect(at(s, 'ancientBear').status.slowNext).toBe(ABILITY.needleSlow);
    expect(() => strike(s, 'frostImp', 'ancientBear', true)).toThrow();
  });

  it('Zza Zaspy (Gronostaj): + A from behind (the same rule as the Harpy\'s)', () => {
    const s = fight([['ermine', 'dawn', 7, 8], ['ancientBear', 'horde', 6, 8]], 0);
    s.battle!.units.ancientBear.facing = { q: -1, r: 0 };
    const behind = attackDamage(s, at(s, 'ermine'), at(s, 'ancientBear'), false, 0);
    s.battle!.units.ancientBear.facing = { q: 1, r: 0 };
    expect(behind).toBeGreaterThanOrEqual(attackDamage(s, at(s, 'ermine'), at(s, 'ancientBear'), false, 0));
  });

  it('Kryształowa Strzała (Paź, Łowczyni): + damage only against a target that has frost', () => {
    const s = fight([['courtPage', 'dawn', 3, 8], ['ermineHuntress', 'dawn', 3, 10], BEAR], 0);
    const plain = dmg(s, 'courtPage', 'ancientBear');
    s.battle!.units.ancientBear.status.frost = 1;
    expect(dmg(s, 'courtPage', 'ancientBear')).toBe(plain + ABILITY.crystalBonus * scaleOf(s));
    expect(dmg(s, 'ermineHuntress', 'ancientBear')).toBeGreaterThan(0);
  });

  it('Klątwa Chłodu (Wiedźma Zamieci): the target has −A in its next attack', () => {
    const s = strike(fight([['blizzardWitch', 'dawn', 4, 8], BEAR], 0), 'blizzardWitch', 'ancientBear', true);
    expect(at(s, 'ancientBear').status.cursedNext).toBe(ABILITY.curseMinus * scaleOf(s));
  });

  it('Gęste Futro (Jak): arrows weaker, blows in melee not, and a blow that lands takes at least 1', () => {
    const s = fight([['glacierYak', 'dawn', 5, 9], ['elfDruid', 'horde', 5, 7], ['ancientBear', 'horde', 6, 10], ['willOWisp', 'horde', 4, 10]], 0);
    const druid = attackDamage(s, at(s, 'elfDruid'), at(s, 'glacierYak'), false, 0);
    expect(UNITS.elfDruid.attackType).toBe('ranged');
    expect(dmg(s, 'elfDruid', 'glacierYak')).toBe(Math.max(1, druid - ABILITY.furArmor * scaleOf(s)));
    const melee = attackDamage(s, at(s, 'ancientBear'), at(s, 'glacierYak'), false, 0);
    expect(dmg(s, 'ancientBear', 'glacierYak')).toBe(melee);
    expect(dmg(s, 'willOWisp', 'glacierYak')).toBeGreaterThanOrEqual(1);
  });

  it('Mroźna Zbroja (Rycerz Lodowej Zbroi): whoever hits it in melee gets frost; a shot does not', () => {
    let s = fight([['iceSentinel', 'dawn', 5, 9], ['ancientBear', 'horde', 6, 10, 99], ['elfDruid', 'horde', 2, 8]], 0);
    s = strike(s, 'ancientBear', 'iceSentinel');
    expect(frostOf(s, 'ancientBear')).toBe(1);
    const far = strike(fight([['iceSentinel', 'dawn', 5, 9], ['elfDruid', 'horde', 2, 8]], 0), 'elfDruid', 'iceSentinel');
    expect(frostOf(far, 'elfDruid')).toBe(0);
  });

  it('Szklany Dzwoneczek (Rusałka): freezes an enemy that has frost, nobody else', () => {
    const s = fight([['frostSprite', 'dawn', 4, 8], BEAR], 0);
    expect(() => cast(s, 'frostSprite', 'ancientBear')).toThrow(/szron/);
    s.battle!.units.ancientBear.status.frost = 1;
    const out = cast(s, 'frostSprite', 'ancientBear');
    expect(at(out, 'ancientBear').status.stunned).toBe(true);
    expect(frostOf(out, 'ancientBear')).toBe(0);
    expect(() => cast(out, 'frostSprite', 'ancientBear')).toThrow();
  });

  it('Zmrażający Uścisk (Młody Olbrzym): the target cannot move in its next activation and gets frost', () => {
    const s = strike(fight([['youngGiant', 'dawn', 5, 9], BEAR], 0), 'youngGiant', 'ancientBear', true);
    expect(at(s, 'ancientBear').status.rootedNext).toBe(true);
    expect(frostOf(s, 'ancientBear')).toBe(ABILITY.frostPut);
  });

  it('Uścisk Mrozu (Dziad Mróz): an enemy within 2 cells gets 2 frosts (freezes at the threshold), once per battle; he walks', () => {
    const s = fight([['dziadMroz', 'dawn', 5, 9], ['ancientBear', 'horde', 6, 8], ['willOWisp', 'horde', 11, 9]], 0);
    expect(UNITS.dziadMroz.movement).toBe('walk');
    const out = cast(s, 'dziadMroz', 'ancientBear');
    expect(frostOf(out, 'ancientBear')).toBe(ABILITY.beardFrost);
    expect(at(out, 'dziadMroz').abilityUsed).toBe(true);
    expect(() => cast(s, 'dziadMroz', 'willOWisp')).toThrow(/zasięgu/);
    // at the threshold the enemy freezes
    const edge = structuredClone(s);
    edge.battle!.units.ancientBear.status.frost = frostThreshold(edge, 'dawn') - 1;
    const frozen = cast(edge, 'dziadMroz', 'ancientBear');
    expect(at(frozen, 'ancientBear').status.stunned).toBe(true);
    expect(frostOf(frozen, 'ancientBear')).toBe(0);
  });

  it('Zimne Światło (Duch Zorzy): enemies within 2 cells have −1 S, the ones farther away and its own side not', () => {
    const s = fight([['auroraSpirit', 'dawn', 5, 9], ['ancientBear', 'horde', 6, 8], ['willOWisp', 'horde', 11, 9], ['ermine', 'dawn', 6, 10]], 0);
    const base = unitSpeed(at(s, 'ancientBear'));
    refreshAuras(s);
    expect(unitSpeed(at(s, 'ancientBear'))).toBe(base - ABILITY.chillSlow);
    expect(at(s, 'willOWisp').status.auraChill).toBeUndefined();
    expect(at(s, 'ermine').status.auraChill).toBeUndefined();
    s.battle!.units.ancientBear.pos = arenaCell(10, 8);
    refreshAuras(s);
    expect(at(s, 'ancientBear').status.auraChill).toBeUndefined();
  });

  it('Długa Noc (Mamut): every enemy gets frost and the mammoth cannot be pushed; the third frost freezes', () => {
    const s = fight([['frostMammoth', 'dawn', 5, 9], ['ancientBear', 'horde', 8, 8], ['willOWisp', 'horde', 9, 9]], 1);
    expect(canBeMoved(s, at(s, 'frostMammoth'))).toBe(false);
    s.battle!.units.willOWisp.status.frost = 2;
    const out = cast(s, 'frostMammoth');
    expect(frostOf(out, 'ancientBear')).toBe(1);
    expect(frostOf(out, 'willOWisp')).toBe(0);
    expect(at(out, 'willOWisp').status.stunned).toBe(true);
    expect(frostOf(out, 'frostMammoth')).toBe(0);
  });
});

describe('the settlement of the Court', () => {
  it('Kryształowa Grota gives ore every round from each settlement that has it, and Pył every third round from the second level', () => {
    const s = empire();
    const h = home(s);
    const base = resourceIncomeOf(s, 'dawn');
    h.buildings.crystalGrotto = 1;
    expect(resourceIncomeOf(s, 'dawn').ore).toBe(base.ore + FACTION_MECHANICS.mineOre);
    h.buildings.crystalGrotto = 2;
    s.round = 3;
    expect(resourceIncomeOf(s, 'dawn').dust).toBe(base.dust + FACTION_MECHANICS.mineDust);
    s.round = 4;
    expect(resourceIncomeOf(s, 'dawn').dust).toBe(base.dust);
  });

  it('the parents in the tree: the Pałac Szronu on the mage tower, the Grota on the treasury, the Wieża Zamieci on the walls', async () => {
    const { BUILDING_PARENT } = await import('../src/engine/kingdom');
    expect(BUILDING_PARENT.frostPalace).toBe('magic');
    expect(BUILDING_PARENT.crystalGrotto).toBe('treasury');
    expect(BUILDING_PARENT.blizzardTower).toBe('walls');
  });

  it('Wieża Zamieci: an enemy hero within the radius loses a move point; farther away, or of the Court itself, it does not', () => {
    const s = empire();
    const h = home(s);
    const foe = Object.values(s.heroes).find((x) => x.faction === 'horde')!;
    s.turnOrder = [foe.id];
    s.turnIndex = 0;
    const move = () => moveBreakdown(s).reduce((n, p) => n + p.points, 0);
    foe.pos = h.at;
    const free = move();
    h.buildings.blizzardTower = 1;
    expect(move()).toBe(free - FACTION_MECHANICS.blizzardMove);
    expect(moveBreakdown(s).some((p) => p.label.includes('Wieża Zamieci'))).toBe(true);
    // radius 2 at the first level, 3 at the second
    const far = parseKey(h.at);
    foe.pos = `${far.q + 3},${far.r}`;
    expect(move()).toBe(free);
    h.buildings.blizzardTower = 2;
    expect(move()).toBe(free - FACTION_MECHANICS.blizzardMove);
    // the Court's own hero is never slowed by its own tower
    const own = Object.values(s.heroes).find((x) => x.faction === 'dawn')!;
    s.turnOrder = [own.id];
    own.pos = h.at;
    expect(moveBreakdown(s).some((p) => p.label.includes('Wieża Zamieci'))).toBe(false);
  });

  it('the bot of the Court builds up to the Pałac Szronu (through the mage tower), the Grota and the Wieża Zamieci when it has the means', () => {
    let s = empire();
    Object.assign(home(s).buildings, { barracks: 1, hospital: 1, treasury: 1, forge: 1, walls: 1, tavern: 1 });
    for (let i = 0; i < 30; i++) {
      s.kingdom!.gold.dawn = 60;
      s.kingdom!.res!.dawn = { wood: 10, ore: 10, dust: 10 };
      const a = botPurchase(s, 'dawn', home(s));
      if (!a) {
        s.round += 1;
        continue;
      }
      try {
        s = applyAction(s, a);
      } catch {
        s.round += 1;
      }
    }
    const b = home(s).buildings;
    expect(b.magic).toBeGreaterThanOrEqual(1);
    expect(b.frostPalace).toBeGreaterThanOrEqual(1);
    expect(b.crystalGrotto).toBeGreaterThanOrEqual(1);
  });
});

describe('games with the Court of Everfrost', () => {
  it('the Court is a pack: heroes, supports and units of its own, the commanders and the fourth hero', () => {
    const s = createGame(table(['frost', 'dawn'], 'control'));
    expect(teamsOf(s)).toEqual(['dawn', 'horde']);
    expect(Object.values(s.heroes).find((h) => h.faction === 'dawn')?.id).toBe('marzanna');
    expect(s.factions.dawn.supportsAlive).toEqual(['frostImp', 'ermine', 'courtPage']);
  });

  it('no wolves and no dogs in the Court (a decision of the author)', () => {
    const names = Object.values(UNITS).filter((u) => u.side === 'frost').map((u) => `${u.id} ${u.name}`.toLowerCase());
    for (const n of names) expect(n).not.toMatch(/wilk|wilcz|pies|psi|ogar|wolf|dog|hound/);
    expect(UNITS.snowLynx.name).toBe('Ryś Śnieżny');
    expect(UNITS.frostMammoth.name).toBe('Mamut Wiecznej Zimy');
  });

  for (const [a, b] of [['frost', 'dawn'], ['frost', 'horde'], ['herds', 'frost'], ['frost', 'undead'], ['clans', 'frost']] as const) {
    for (const objective of ['control', 'conquest', 'relic'] as const) {
      it(`${a} against ${b}, goal ${objective}: bots play to the end on several seeds`, () => {
        for (const seed of [1, 2]) {
          const end = playOut(createGame(table([a, b], objective, { seed })));
          expect(end.phase).toBe('over');
        }
      });
    }
  }

  it('five factions are too many for one table, four play a conquest to the end', () => {
    const end = playOut(createGame(table(['dawn', 'frost', 'herds', 'undead'], 'conquest', { seed: 3 })));
    expect(end.phase).toBe('over');
    expect(() => assignSlots(['dawn', 'horde', 'herds', 'undead', 'frost'])).toThrow(/najwyżej/);
  });

  it('coop and the arena refuse the Court with a clear error', () => {
    const coop = { ...table(['frost', 'horde'], 'survival'), mode: 'coop' as const };
    coop.seats = [{ ...coop.seats[0], faction: 'dawn' }];
    expect(() => createGame(coop)).toThrow(/tylko w rywalizacji/);
  });
});
