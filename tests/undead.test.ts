// Królestwo Umarłych (docs/frakcje/undead.md): raising the fallen in the field, immunity to statuses, armour piercing, the auras and every ability of the faction,
// the Kurhan Wiecznej Warty and its two sister buildings, then whole games of the Kingdom against Przymierze and Horda.
import { describe, expect, it } from 'vitest';
import { applyAction, createGame } from '../src/engine/game';
import { ABILITY, FACTION_HEROES, supportTier } from '../src/engine/data';
import { arenaCell, attackDamage, attackTargets, dealDamage, hpScaleOf, makeBattleUnit, predictDamage, resistsStatus, scaleOf } from '../src/engine/battle';
import { assignSlots, teamsOf } from '../src/engine/teams';
import { fallenSupports, raiseUnit } from '../src/engine/primitives';
import { healPrice } from '../src/engine/kingdom';
import { manaOf } from '../src/engine/magic';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../src/engine/types';
import { activation, battleFixture, playOut, setup } from './helpers/engine';

type U = [id: string, side: 'dawn' | 'horde', col: number, half: number, hp?: number];

/** A battle on the old arena with the listed units (the first one acts); no dice, so the numbers are exact. */
function fight(units: U[], over: Partial<NonNullable<GameState['battle']>> = {}, rules: Partial<SetupOptions['rules']> = {}): GameState {
  const s = createGame(setup({}, { useDice: false, ...rules }));
  return battleFixture(s, units.map(([id, side, col, half, hp]) => ({ id, side, col, half, hp })), over);
}
const at = (s: GameState, id: string) => s.battle!.units[id];
/** Lays a unit down as a fallen one (it keeps no cell). */
const fall = (s: GameState, id: string) => {
  const u = at(s, id);
  u.hp = 0;
  u.alive = false;
  u.pos = null;
};

/** A table of bots, one seat per race, on a rectangle map. */
function table(races: Array<'dawn' | 'horde' | 'herds' | 'undead'>, objective: SetupOptions['rules']['objective'], over: Partial<SetupOptions> = {}): SetupOptions {
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

/** A rivalry table of the Kingdom (the first side, slot `dawn`) against Horda with the level 6 rules. */
const empire = (): GameState => createGame(table(['undead', 'horde'], 'conquest', { seed: 4 }));
const home = (s: GameState) => Object.values(s.kingdom!.settlements).find((x) => x.owner === 'dawn')!;

describe('raising in the field', () => {
  it('fallenSupports lists the fallen supports, the strongest tier first, never heroes', () => {
    const s = fight([['barrowKing', 'dawn', 4, 8], ['skeletonSpear', 'dawn', 3, 7], ['lich', 'dawn', 2, 6], ['viy', 'dawn', 1, 7], ['elfDruid', 'horde', 11, 7]]);
    for (const id of ['barrowKing', 'skeletonSpear', 'lich']) fall(s, id);
    expect(fallenSupports(s, 'dawn').map((u) => u.id)).toEqual(['lich', 'skeletonSpear']);
    expect(fallenSupports(s, 'dawn', 3).map((u) => u.id)).toEqual(['skeletonSpear']);
    expect(fallenSupports(s, 'horde')).toEqual([]);
  });

  it('raiseUnit stands the unit up with the given Życie (at least 1, at most its maximum), clears its statuses and marks it as risen', () => {
    const s = fight([['barrowKing', 'dawn', 4, 8], ['skeletonSpear', 'dawn', 3, 7], ['elfDruid', 'horde', 11, 7]]);
    const bones = at(s, 'skeletonSpear');
    bones.status.slowNext = 2;
    bones.status.poisoned = 2;
    fall(s, 'skeletonSpear');
    expect(raiseUnit(s, bones, at(s, 'barrowKing').pos, 99, 'test')).toBe(true);
    expect(bones.alive).toBe(true);
    expect(bones.hp).toBe(bones.maxHp);
    expect(bones.pos).not.toBeNull();
    expect(bones.status.slowNext).toBe(0);
    expect(bones.status.poisoned).toBeUndefined();
    expect(bones.status.risen).toBe(true);
    expect(raiseUnit(s, bones, null, 1, 'test')).toBe(false);
    fall(s, 'skeletonSpear');
    raiseUnit(s, bones, null, 0, 'test');
    expect(bones.hp).toBe(1);
  });

  it('Wezwanie z Kurhanu (Król): the strongest fallen support stands up next to him with half its Życie, once per battle', () => {
    let s = fight([['barrowKing', 'dawn', 4, 8], ['skeletonSpear', 'dawn', 3, 7], ['lich', 'dawn', 2, 6], ['elfDruid', 'horde', 11, 7]]);
    fall(s, 'skeletonSpear');
    fall(s, 'lich');
    s = applyAction(s, { type: 'battleAbility' });
    expect(at(s, 'lich').alive).toBe(true);
    expect(at(s, 'lich').hp).toBe(Math.ceil(at(s, 'lich').maxHp / 2));
    expect(at(s, 'skeletonSpear').alive).toBe(false);
    expect(at(s, 'barrowKing').abilityUsed).toBe(true);
    expect(() => applyAction(s, { type: 'battleAbility' })).toThrow();
    const none = fight([['barrowKing', 'dawn', 4, 8], ['elfDruid', 'horde', 11, 7]]);
    expect(() => applyAction(none, { type: 'battleAbility' })).toThrow(/poległego pomocnika/);
  });

  it('Ponowny Oddech (Strzyga) raises only supports of tier 3 or lower', () => {
    let s = fight([['strzyga', 'dawn', 4, 8], ['lich', 'dawn', 2, 6], ['hauntedArmor', 'dawn', 3, 7], ['elfDruid', 'horde', 11, 7]]);
    fall(s, 'lich');
    fall(s, 'hauntedArmor');
    s = applyAction(s, { type: 'battleAbility' });
    expect(at(s, 'hauntedArmor').alive).toBe(true);
    expect(at(s, 'lich').alive).toBe(false);
    const only = fight([['strzyga', 'dawn', 4, 8], ['lich', 'dawn', 2, 6], ['elfDruid', 'horde', 11, 7]]);
    fall(only, 'lich');
    expect(() => applyAction(only, { type: 'battleAbility' })).toThrow();
  });

  it('Kości Wracają: the skeleton that falls puts itself together at the end of the round with 1 Ż, once per battle', () => {
    const s = fight([['skeletonSpear', 'dawn', 4, 8], ['barrowKing', 'dawn', 3, 7], ['elfDruid', 'horde', 11, 7]]);
    // the skeleton is the last to act in the round: the next round raises it
    s.battle!.order = ['elfDruid', 'skeletonSpear'];
    s.battle!.index = 1;
    dealDamage(s, at(s, 'skeletonSpear'), 99, 'test');
    expect(at(s, 'skeletonSpear').alive).toBe(false);
    expect(at(s, 'skeletonSpear').status.reassemble).toBe(true);
    s.battle!.stage = 'fight';
    s.battle!.activation = activation('elfDruid');
    s.battle!.order = ['skeletonSpear', 'elfDruid'];
    s.battle!.index = 1;
    const next = applyAction(s, { type: 'endActivation' });
    expect(at(next, 'skeletonSpear').alive).toBe(true);
    expect(at(next, 'skeletonSpear').hp).toBe(Math.min(at(next, 'skeletonSpear').maxHp, ABILITY.bonesHp * hpScaleOf(next)));
    expect(at(next, 'skeletonSpear').abilityUsed).toBe(true);
    // the second time it stays down
    dealDamage(next, at(next, 'skeletonSpear'), 99, 'test');
    expect(at(next, 'skeletonSpear').status.reassemble).toBeUndefined();
  });
});

describe('Kurhan Wiecznej Warty', () => {
  /** A battle of the Kingdom with `level` of the Kurhan: the cheapest of two fallen supports lies down, and a round passes. */
  const ward = (level: number, rounds = 1) => {
    const s = empire();
    home(s).buildings.barrow = level;
    const f = battleFixture(s, [{ id: 'barrowKing', side: 'dawn', col: 4, half: 8 }, { id: 'skeletonSpear', side: 'dawn', col: 3, half: 7 }, { id: 'lich', side: 'dawn', col: 2, half: 6 }, { id: 'ancientBear', side: 'horde', col: 11, half: 7 }]);
    f.rules.useDice = false;
    for (const id of ['skeletonSpear', 'lich']) {
      const u = at(f, id);
      u.hp = 0;
      u.alive = false;
      u.corpse = u.pos!;
      u.pos = null;
      u.abilityUsed = true;
    }
    let cur = f;
    for (let i = 0; i < rounds; i++) {
      cur.battle!.activation = activation('ancientBear');
      cur.battle!.order = ['barrowKing', 'ancientBear'];
      cur.battle!.index = 1;
      cur = applyAction(cur, { type: 'endActivation' });
    }
    return cur;
  };

  it('without the building nothing rises; with it the cheapest fallen support stands up on its corpse', () => {
    const none = ward(0);
    expect(at(none, 'skeletonSpear').alive).toBe(false);
    const s = ward(1);
    expect(at(s, 'skeletonSpear').alive).toBe(true);
    expect(at(s, 'lich').alive).toBe(false);
    expect(at(s, 'skeletonSpear').pos).toBe(arenaCell(3, 7));
  });

  it('the level says with how much Życie: I just 1, II and III half, IV all', () => {
    const hp = (level: number) => at(ward(level), 'skeletonSpear').hp;
    const one = ward(1);
    const max = at(one, 'skeletonSpear').maxHp;
    expect(hp(1)).toBe(Math.min(max, ABILITY.bonesHp * hpScaleOf(one)));
    expect(hp(2)).toBe(Math.ceil(max / 2));
    expect(hp(3)).toBe(Math.ceil(max / 2));
    expect(hp(4)).toBe(max);
  });

  it('once per battle on levels I-II, twice on III-IV (one fallen support a round)', () => {
    const alive = (s: GameState) => ['skeletonSpear', 'lich'].filter((id) => at(s, id).alive).length;
    expect(alive(ward(1, 3))).toBe(1);
    expect(alive(ward(2, 3))).toBe(1);
    expect(alive(ward(3, 3))).toBe(2);
    expect(alive(ward(4, 3))).toBe(2);
  });

  it('heroes never rise', () => {
    const s = empire();
    home(s).buildings.barrow = 4;
    const f = battleFixture(s, [{ id: 'barrowKing', side: 'dawn', col: 4, half: 8 }, { id: 'lanternWraith', side: 'dawn', col: 3, half: 7 }, { id: 'ancientBear', side: 'horde', col: 11, half: 7 }]);
    const w = at(f, 'lanternWraith');
    w.alive = false;
    w.hp = 0;
    w.pos = null;
    f.battle!.activation = activation('ancientBear');
    f.battle!.order = ['barrowKing', 'ancientBear'];
    f.battle!.index = 1;
    expect(at(applyAction(f, { type: 'endActivation' }), 'lanternWraith').alive).toBe(false);
  });

  it('a Resurrection treasure does not raise a unit that has already risen in the battle', () => {
    const s = ward(1);
    const bones = at(s, 'skeletonSpear');
    expect(bones.status.risen).toBe(true);
    bones.alive = false;
    bones.pos = null;
    s.items.res1 = { id: 'res1', kind: 'resurrection', owner: 'dawn', foundBy: null };
    s.factions.dawn.inventory = ['res1'];
    s.battle!.activation = activation('barrowKing');
    expect(() => applyAction(s, { type: 'battleItem', itemId: 'res1', targetId: 'skeletonSpear' })).toThrow(/już raz wstała/);
  });
});

describe('Ossuarium, Dzwonnica Zaduszna and the tree of buildings', () => {
  it('the Kurhan stands on the hospital, the Ossuarium on the treasury, the Dzwonnica on the barracks', async () => {
    const { BUILDING_PARENT } = await import('../src/engine/kingdom');
    expect(BUILDING_PARENT.barrow).toBe('hospital');
    expect(BUILDING_PARENT.ossuary).toBe('treasury');
    expect(BUILDING_PARENT.bellTower).toBe('barracks');
  });

  it('Ossuarium takes a gold piece off the hospital, and its second level makes tiers 1-2 free', () => {
    const s = empire();
    const h = home(s);
    h.buildings.hospital = 1;
    const price = (id: string) => healPrice(s, 'dawn', h, id);
    const plain = ['skeletonSpear', 'skeletonArcher', 'hauntedArmor', 'lich'].map(price);
    h.buildings.ossuary = 1;
    expect(['skeletonSpear', 'skeletonArcher', 'hauntedArmor', 'lich'].map(price)).toEqual(plain.map((p) => Math.max(1, p - 1)));
    h.buildings.ossuary = 2;
    expect([price('skeletonSpear'), price('skeletonArcher')]).toEqual([0, 0]);
    expect(price('hauntedArmor')).toBe(Math.max(1, plain[2] - 1));
  });

  it('the tiers of the Kingdom: 1 the starting three, 2-5 the recruits and their alternatives, 6 the dragon', () => {
    expect(['skeletonSpear', 'willOWisp', 'penitentShade'].map(supportTier)).toEqual([1, 1, 1]);
    expect(['skeletonArcher', 'hauntedArmor', 'viy', 'lich'].map(supportTier)).toEqual([2, 3, 4, 5]);
    expect(['scarecrow', 'vampire', 'strzyga', 'kostucha'].map(supportTier)).toEqual([2, 3, 4, 5]);
    expect(supportTier('boneDragon')).toBe(6);
  });
});

describe('immunity to poison, curses, slows and roots', () => {
  it('the Spark makes every unit of the Kingdom immune (in a battle with the Spark built)', async () => {
    const s = empire();
    home(s).buildings.spark = 1;
    // a battle through the real start: the supports of the Kingdom get the immunity from the Spark
    const hero = Object.values(s.heroes).find((h) => h.faction === 'dawn')!;
    expect(hero.id).toBe('barrowKing');
    const { hasSpark } = await import('../src/engine/empire');
    expect(hasSpark(s, 'dawn')).toBe(true);
    const f = battleFixture(s, [{ id: 'skeletonSpear', side: 'dawn', col: 4, half: 8 }, { id: 'nymph', side: 'horde', col: 5, half: 9 }]);
    expect(resistsStatus(f, at(f, 'skeletonSpear'), false)).toBe(false);
    at(f, 'skeletonSpear').status.immune = true;
    expect(resistsStatus(f, at(f, 'skeletonSpear'), false)).toBe(true);
  });

  it('a unit with the immunity shrugs off the poison, the curse, the root and the slow spell', () => {
    // the hordeCrossbow poisons, the hordeShadow curses, the elfDruid roots
    for (const [att, ab, status] of [['hordeCrossbow', 'poisoned', undefined], ['hordeShadow', 'cursedNext', 0], ['elfDruid', 'slowNext', 0]] as const) {
      const run = (immune: boolean) => {
        let s = fight([[att, 'horde', 4, 8], ['skeletonArcher', 'dawn', 5, 9]], { attacker: 'horde', defender: 'dawn' });
        if (immune) at(s, 'skeletonArcher').status.immune = true;
        s = applyAction(s, { type: 'battleAttack', targetId: 'skeletonArcher', useAbility: true });
        return (at(s, 'skeletonArcher').status as unknown as Record<string, unknown>)[ab];
      };
      expect(run(false), `${att} works on the others`).not.toEqual(status);
      expect(run(true), `${att} does not work on the immune`).toEqual(status);
    }
  });

  it('Pusta w Środku (Nawiedzona Zbroja): armour, immunity of its own, and a blow that lands still takes at least 1', () => {
    const s = fight([['ancientBear', 'horde', 4, 8], ['hauntedArmor', 'dawn', 5, 9]]);
    expect(resistsStatus(s, at(s, 'hauntedArmor'), false)).toBe(true);
    const raw = attackDamage(s, at(s, 'ancientBear'), at(s, 'hauntedArmor'), false, 0);
    expect(predictDamage(s, at(s, 'ancientBear'), at(s, 'hauntedArmor'), { useAbility: false, movedDistance: 0 }).damage).toBe(raw - ABILITY.hollowArmor);
    const weak = fight([['willOWisp', 'horde', 4, 8], ['hauntedArmor', 'dawn', 5, 9]]);
    expect(predictDamage(weak, at(weak, 'willOWisp'), at(weak, 'hauntedArmor'), { useAbility: false, movedDistance: 0 }).damage).toBeGreaterThanOrEqual(1);
  });
});

describe('abilities of the units', () => {
  it('Grot Przez Zbroję (Szkielet Łucznik) ignores every armour; the others do not', () => {
    const s = fight([['skeletonArcher', 'dawn', 4, 8], ['forestBison', 'horde', 5, 9], ['hauntedArmor', 'horde', 6, 10]]);
    const arrow = (id: string) => predictDamage(s, at(s, 'skeletonArcher'), at(s, id), { useAbility: false, movedDistance: 0 }).damage;
    expect(arrow('forestBison')).toBe(attackDamage(s, at(s, 'skeletonArcher'), at(s, 'forestBison'), false, 0));
    expect(arrow('hauntedArmor')).toBe(attackDamage(s, at(s, 'skeletonArcher'), at(s, 'hauntedArmor'), false, 0));
    const other = fight([['elfDruid', 'dawn', 4, 8], ['forestBison', 'horde', 5, 9]]);
    expect(predictDamage(other, at(other, 'elfDruid'), at(other, 'forestBison'), { useAbility: false, movedDistance: 0 }).damage).toBeLessThanOrEqual(attackDamage(other, at(other, 'elfDruid'), at(other, 'forestBison'), false, 0));
  });

  it('Bezcielesna (Zjawa Pokutnika): the first ranged blow does nothing, the next one lands; melee blows always land', () => {
    let s = fight([['hordeCrossbow', 'horde', 4, 8], ['penitentShade', 'dawn', 5, 9]], { attacker: 'horde', defender: 'dawn' });
    s = applyAction(s, { type: 'battleAttack', targetId: 'penitentShade' });
    expect(at(s, 'penitentShade').hp).toBe(at(s, 'penitentShade').maxHp);
    expect(at(s, 'penitentShade').abilityUsed).toBe(true);
    expect(predictDamage(s, at(s, 'hordeCrossbow'), at(s, 'penitentShade'), { useAbility: false, movedDistance: 0 }).damage).toBeGreaterThan(0);
    const melee = fight([['ancientBear', 'horde', 4, 8], ['penitentShade', 'dawn', 5, 9]], { attacker: 'horde', defender: 'dawn' });
    expect(predictDamage(melee, at(melee, 'ancientBear'), at(melee, 'penitentShade'), { useAbility: false, movedDistance: 0 }).damage).toBeGreaterThan(0);
  });

  it('Postrach (Strach Polny): a neighbouring enemy has -A, the aura does not stack and is gone with the scarecrow', () => {
    const s = fight([['ancientBear', 'horde', 4, 8], ['scarecrow', 'dawn', 5, 9], ['scarecrow', 'dawn', 3, 7]].slice(0, 2) as U[]);
    const plain = fight([['ancientBear', 'horde', 4, 8], ['nymph', 'dawn', 5, 9]]);
    expect(attackDamage(s, at(s, 'ancientBear'), at(s, 'scarecrow'), false, 0)).toBe(attackDamage(plain, at(plain, 'ancientBear'), at(plain, 'nymph'), false, 0) - ABILITY.dreadMinus);
    at(s, 'scarecrow').alive = false;
    expect(attackDamage(s, at(s, 'ancientBear'), at(s, 'ancientBear'), false, 0)).toBe(attackDamage(plain, at(plain, 'ancientBear'), at(plain, 'nymph'), false, 0));
  });

  it('Lament (Wampir): enemies within 2 have -A in their next attack, the immune do not; once per battle', () => {
    let s = fight([['vampire', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9], ['elfDruid', 'horde', 6, 10], ['nymph', 'horde', 12, 8]]);
    at(s, 'elfDruid').status.immune = true;
    s = applyAction(s, { type: 'battleAbility' });
    expect(at(s, 'ancientBear').status.cursedNext).toBe(ABILITY.wailMinus);
    expect(at(s, 'elfDruid').status.cursedNext).toBe(0);
    expect(at(s, 'nymph').status.cursedNext).toBe(0);
    expect(() => applyAction(s, { type: 'battleAbility' })).toThrow();
  });

  it('Dzwon Zaduszny (Dzwonnik): the neighbouring enemies are slowed', () => {
    let s = fight([['bellKeeper', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9], ['nymph', 'horde', 8, 8]]);
    s = applyAction(s, { type: 'battleAbility' });
    expect(at(s, 'ancientBear').status.slowNext).toBe(ABILITY.tollSlow);
    expect(at(s, 'nymph').status.slowNext).toBe(0);
  });

  it('Podnieście Mi Powieki (Wij): the enemy in range cannot move in its next activation; the immune and the far ones are not held', () => {
    let s = fight([['viy', 'dawn', 4, 8], ['ancientBear', 'horde', 6, 8], ['nymph', 'horde', 12, 8]]);
    expect(() => applyAction(s, { type: 'battleAbility', targetId: 'nymph' })).toThrow();
    s = applyAction(s, { type: 'battleAbility', targetId: 'ancientBear' });
    expect(at(s, 'ancientBear').status.rootedNext).toBe(true);
    const held = fight([['viy', 'dawn', 4, 8], ['ancientBear', 'horde', 6, 8]]);
    at(held, 'ancientBear').status.immune = true;
    expect(at(applyAction(held, { type: 'battleAbility', targetId: 'ancientBear' }), 'ancientBear').status.rootedNext).toBe(false);
  });

  it('Żniwo Many (Lisz): every hit takes mana from the enemy hero and mends the Lisz', () => {
    const s = fight([['lich', 'dawn', 4, 8, 3], ['ancientBear', 'horde', 5, 9, 99]]);
    const foe = Object.values(s.heroes).find((h) => h.faction === 'horde')!;
    s.battle!.defenderHero = foe.id;
    const mana = manaOf(foe);
    const next = applyAction(s, { type: 'battleAttack', targetId: 'ancientBear' });
    expect(manaOf(next.heroes[foe.id])).toBe(Math.max(0, mana - ABILITY.reapMana));
    expect(at(next, 'lich').hp).toBe(3 + ABILITY.reapHeal * hpScaleOf(next));
  });

  it('Zgaszone Światło (Latarniczka): the target has -A, the enemy hero loses mana, once per battle', () => {
    const s = fight([['lanternWraith', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9, 99]]);
    const foe = Object.values(s.heroes).find((h) => h.faction === 'horde')!;
    s.battle!.defenderHero = foe.id;
    const mana = manaOf(foe);
    const next = applyAction(s, { type: 'battleAttack', targetId: 'ancientBear', useAbility: true });
    expect(at(next, 'ancientBear').status.cursedNext).toBe(ABILITY.curseMinus * scaleOf(next));
    expect(manaOf(next.heroes[foe.id])).toBe(Math.max(0, mana - ABILITY.dimLightMana));
    expect(at(next, 'lanternWraith').abilityUsed).toBe(true);
  });

  it('Widmowa Szarża (Bezgłowy Jeździec): a bonus once per battle (and more from behind)', () => {
    const s = fight([['headlessKnight', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9, 99]]);
    const plain = attackDamage(s, at(s, 'headlessKnight'), at(s, 'ancientBear'), false, 0);
    const charge = attackDamage(s, at(s, 'headlessKnight'), at(s, 'ancientBear'), true, 0);
    expect(charge - plain).toBeGreaterThanOrEqual(ABILITY.spectralBonus);
    at(s, 'ancientBear').facing = { q: -1, r: 0 };
    s.battle!.units.headlessKnight.pos = arenaCell(6, 10);
    const behind = attackDamage(s, at(s, 'headlessKnight'), at(s, 'ancientBear'), true, 0);
    expect(behind).toBeGreaterThanOrEqual(charge);
  });

  it('Oddech Grobu (Kościany Smok): the breath hits the target and the unit behind it and slows both; Kośba (Kostucha) hits two neighbours', () => {
    let s = fight([['boneDragon', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9, 99], ['elfDruid', 'horde', 6, 10, 99]]);
    s = applyAction(s, { type: 'battleAttack', targetId: 'ancientBear', useAbility: true });
    expect(at(s, 'ancientBear').status.slowNext).toBe(ABILITY.graveBreathSlow);
    expect(at(s, 'elfDruid').status.slowNext).toBe(ABILITY.graveBreathSlow);
    expect(at(s, 'elfDruid').hp).toBeLessThan(99);
    let k = fight([['kostucha', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9, 99], ['elfDruid', 'horde', 5, 7, 99]]);
    expect(attackTargets(k, at(k, 'kostucha')).length).toBe(2);
    k = applyAction(k, { type: 'battleAttack', targetId: 'ancientBear', secondTargetId: 'elfDruid' });
    expect(at(k, 'elfDruid').hp).toBeLessThan(99);
    expect(at(k, 'ancientBear').hp).toBeLessThan(99);
  });

  it('the new units are plain supports and heroes with an ability of their own', () => {
    for (const id of ['barrowKing', 'lanternWraith', 'headlessKnight', 'bellKeeper', 'wardCaptain', 'spectralArcher', 'penitentMonk', 'skeletonSpear', 'boneDragon']) {
      expect(makeBattleUnit(id, 'dawn').alive).toBe(true);
    }
  });
});

describe('games with the Kingdom of the Dead', () => {
  it('the Kingdom is a pack: heroes, supports and units of their own', () => {
    const s = createGame(table(['undead', 'dawn'], 'control'));
    expect(teamsOf(s)).toEqual(['dawn', 'horde']);
    expect(Object.values(s.heroes).find((h) => h.faction === 'dawn')?.id).toBe('barrowKing');
    expect(s.factions.dawn.supportsAlive).toEqual(['skeletonSpear', 'willOWisp', 'penitentShade']);
  });

  for (const [a, b] of [['undead', 'dawn'], ['undead', 'horde'], ['herds', 'undead']] as const) {
    for (const objective of ['control', 'conquest', 'relic'] as const) {
      it(`${a} against ${b}, goal ${objective}: bots play to the end on several seeds`, () => {
        for (const seed of [1, 2]) {
          const end = playOut(createGame(table([a, b], objective, { seed })));
          expect(end.phase).toBe('over');
        }
      });
    }
  }

  it('four sides (all the factions) play a conquest to the end', () => {
    const end = playOut(createGame(table(['dawn', 'horde', 'herds', 'undead'], 'conquest', { seed: 3 })));
    expect(end.phase).toBe('over');
    expect(teamsOf(end)).toEqual(['dawn', 'horde', 'third', 'fourth']);
  });

  it('coop and the arena refuse the Kingdom with a clear error', () => {
    const coop = { ...table(['undead', 'horde'], 'survival'), mode: 'coop' as const };
    coop.seats = [{ ...coop.seats[0], faction: 'dawn' }];
    expect(() => createGame(coop)).toThrow(/tylko w rywalizacji/);
  });
});
