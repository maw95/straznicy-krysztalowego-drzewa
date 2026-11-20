// Żelazny Klan (docs/frakcje/clans.md): armour and the Mur Tarcz, the abilities of the faction, the Runiczna Kuźnia (runes that stay with a unit for good),
// the Głęboka Sztolnia, then whole games of the Clans against the other factions.
import { describe, expect, it } from 'vitest';
import { applyAction, createGame, runeBonus, sparkBonus } from '../src/engine/game';
import { ABILITY, FACTION_HEROES, supportTier } from '../src/engine/data';
import { arenaCell, attackDamage, fortifyCells, goatLeapReady, inFormation, makeBattleUnit, predictDamage, reachableCells, scaleOf, hpScaleOf } from '../src/engine/battle';
import { assignSlots, teamsOf } from '../src/engine/teams';
import { canBeMoved, pushWithCollision } from '../src/engine/primitives';
import { botPurchase, botRune, resourceIncomeOf, runeBlock } from '../src/engine/kingdom';
import { FACTION_MECHANICS } from '../src/engine/empire';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../src/engine/types';
import { activation, battleFixture, playOut, setup } from './helpers/engine';

type U = [id: string, side: 'dawn' | 'horde', col: number, half: number, hp?: number];

/** A table of bots, one seat per race, on a rectangle map. */
function table(races: Array<'dawn' | 'horde' | 'herds' | 'undead' | 'clans'>, objective: SetupOptions['rules']['objective'], over: Partial<SetupOptions> = {}): SetupOptions {
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

/** A rivalry game of the Clans (the first side, slot `dawn`) against Horda with the level 6 rules. */
const empire = (): GameState => createGame(table(['clans', 'horde'], 'conquest', { seed: 4 }));
const home = (s: GameState) => Object.values(s.kingdom!.settlements).find((x) => x.owner === 'dawn')!;
const at = (s: GameState, id: string) => s.battle!.units[id];

/** A battle on the classic-rules game with the listed units (the first one acts), no dice: the abilities work, the large units and the Mur Tarcz need `fightClans`. */
function fight(units: U[], over: Partial<NonNullable<GameState['battle']>> = {}): GameState {
  const s = createGame(setup({}, { useDice: false }));
  return battleFixture(s, units.map(([id, side, col, half, hp]) => ({ id, side, col, half, hp })), over);
}
/** Same, in the game of the Clans (the abilities do not depend on the race, the Mur Tarcz and the runes do). */
const fightClans = (units: U[], hall = 0, over: Partial<NonNullable<GameState['battle']>> = {}): GameState => {
  const s = empire();
  s.rules.useDice = false;
  home(s).buildings.shieldHall = hall;
  return battleFixture(s, units.map(([id, side, col, half, hp]) => ({ id, side, col, half, hp })), over);
};
const raw = (s: GameState, att: string, victim: string, useAbility = false) => attackDamage(s, at(s, att), at(s, victim), useAbility, 0);
const dmg = (s: GameState, att: string, victim: string) => predictDamage(s, at(s, att), at(s, victim), { useAbility: false, movedDistance: 0 }).damage;

describe('armour: Pawęż, Kolczuga, Przysięga Tarczy, Runa Kamienia', () => {
  it('Pawęż and Kolczuga take a bit off every blow (but a blow that lands takes at least 1)', () => {
    const s = fight([['ancientBear', 'horde', 4, 8], ['shieldDwarf', 'dawn', 5, 9], ['armoredBear', 'dawn', 3, 7], ['brassSpider', 'dawn', 5, 7]], { attacker: 'horde', defender: 'dawn' });
    const plain = raw(s, 'ancientBear', 'brassSpider');
    expect(dmg(s, 'ancientBear', 'brassSpider')).toBe(plain);
    expect(dmg(s, 'ancientBear', 'shieldDwarf')).toBe(plain - ABILITY.bulwarkArmor * scaleOf(s));
    expect(dmg(s, 'ancientBear', 'armoredBear')).toBe(plain - ABILITY.bulwarkArmor * scaleOf(s));
    const weak = fight([['willOWisp', 'horde', 4, 8], ['shieldDwarf', 'dawn', 5, 9]], { attacker: 'horde', defender: 'dawn' });
    expect(dmg(weak, 'willOWisp', 'shieldDwarf')).toBeGreaterThanOrEqual(1);
  });

  it('Przysięga Tarczy (Tan): the neighbours have armour until the end of the round, once per battle', () => {
    let s = fight([['ironThane', 'dawn', 4, 8], ['brassSpider', 'dawn', 5, 9], ['elfDruid', 'dawn', 9, 3], ['ancientBear', 'horde', 11, 7]]);
    const before = dmg(s, 'ancientBear', 'brassSpider');
    s = applyAction(s, { type: 'battleAbility' });
    expect(at(s, 'ironThane').abilityUsed).toBe(true);
    expect(dmg(s, 'ancientBear', 'brassSpider')).toBe(before - ABILITY.oathArmor * scaleOf(s));
    expect(dmg(s, 'ancientBear', 'elfDruid')).toBe(before);
    expect(() => applyAction(s, { type: 'battleAbility' })).toThrow();
    s.battle!.round = 2;
    expect(dmg(s, 'ancientBear', 'brassSpider')).toBe(before);
  });

  it('Runa Kamienia (Matka Run): an ally gets armour for the battle and cannot be moved', () => {
    let s = fight([['runeMatron', 'dawn', 4, 8], ['brassSpider', 'dawn', 6, 8], ['ancientBear', 'horde', 8, 8]]);
    expect(canBeMoved(s, at(s, 'brassSpider'))).toBe(true);
    const before = dmg(s, 'ancientBear', 'brassSpider');
    s = applyAction(s, { type: 'battleAbility', targetId: 'brassSpider' });
    expect(canBeMoved(s, at(s, 'brassSpider'))).toBe(false);
    expect(dmg(s, 'ancientBear', 'brassSpider')).toBe(before - ABILITY.runeStoneArmor * scaleOf(s));
    expect(pushWithCollision(s, at(s, 'brassSpider'), at(s, 'ancientBear'), 1, 1, 'test').stoppedBy).toBe('immovable');
    expect(() => applyAction(s, { type: 'battleAbility', targetId: 'runeMatron' })).toThrow();
  });
});

describe('Mur Tarcz (Sala Tarcz)', () => {
  /** The crossbowman with `mates` allies next to it, the Horde bear to hit it. */
  const wall = (hall: number, mates: number) => {
    const spots: Array<[number, number]> = [[4, 8], [6, 10], [5, 7]];
    const side: U[] = [['brassSpider', 'dawn', 5, 9], ...['shieldDwarf', 'armoredBear'].slice(0, mates).map((id, i): U => [id, 'dawn', ...spots[i]])];
    return fightClans([...side, ['ancientBear', 'horde', 8, 12]], hall, { attacker: 'horde', defender: 'dawn' });
  };

  it('level I: two neighbours are needed, level II: one; without the hall there is no wall', () => {
    expect(inFormation(wall(0, 2), at(wall(0, 2), 'brassSpider'))).toBe(false);
    expect(inFormation(wall(1, 1), at(wall(1, 1), 'brassSpider'))).toBe(false);
    expect(inFormation(wall(1, 2), at(wall(1, 2), 'brassSpider'))).toBe(true);
    expect(inFormation(wall(2, 1), at(wall(2, 1), 'brassSpider'))).toBe(true);
    expect(inFormation(wall(2, 0), at(wall(2, 0), 'brassSpider'))).toBe(false);
  });

  it('in formation a blow is weaker by the wall\'s armour', () => {
    const s = wall(1, 2);
    const loose = wall(0, 2);
    expect(dmg(s, 'ancientBear', 'brassSpider')).toBe(dmg(loose, 'ancientBear', 'brassSpider') - FACTION_MECHANICS.shieldArmor * scaleOf(s));
  });

  it('level III: a unit in formation cannot be pushed; level IV: a melee attacker loses Życie', () => {
    expect(canBeMoved(wall(2, 2), at(wall(2, 2), 'brassSpider'))).toBe(true);
    expect(canBeMoved(wall(3, 2), at(wall(3, 2), 'brassSpider'))).toBe(false);
    const s = wall(4, 2);
    s.battle!.units.ancientBear.pos = arenaCell(6, 8);
    s.battle!.order = ['ancientBear', 'brassSpider', 'shieldDwarf', 'armoredBear'];
    s.battle!.activation = activation('ancientBear');
    const hp = at(s, 'ancientBear').hp;
    const after = applyAction(s, { type: 'battleAttack', targetId: 'brassSpider', useAbility: false });
    expect(at(after, 'ancientBear').hp).toBe(hp - FACTION_MECHANICS.shieldArmor * scaleOf(s));
    const l3 = wall(3, 2);
    l3.battle!.units.ancientBear.pos = arenaCell(6, 8);
    l3.battle!.activation = activation('ancientBear');
    expect(at(applyAction(l3, { type: 'battleAttack', targetId: 'brassSpider', useAbility: false }), 'ancientBear').hp).toBe(hp);
  });

  it('the Clans without a hall and the other factions have no wall at all', () => {
    const s = fight([['brassSpider', 'dawn', 5, 9], ['shieldDwarf', 'dawn', 4, 8], ['armoredBear', 'dawn', 6, 10]]);
    expect(inFormation(s, at(s, 'brassSpider'))).toBe(false);
  });

  it('the Spark of the Clans gives every unit armour 1 in a real battle', () => {
    const s = empire();
    const u = makeBattleUnit('brassSpider', 'dawn', true, scaleOf(s), hpScaleOf(s));
    expect(u.status.damageReduction).toBe(0);
    sparkBonus(s, u);
    expect(u.status.damageReduction).toBe(FACTION_MECHANICS.shieldArmor * scaleOf(s));
  });
});

describe('abilities of the units', () => {
  it('Salwa z Miejsca (Mosiężny Pająk): + A only when it has not moved', () => {
    const s = fight([['brassSpider', 'dawn', 4, 8], ['ancientBear', 'horde', 8, 8, 99]]);
    const still = attackDamage(s, at(s, 'brassSpider'), at(s, 'ancientBear'), false, 0);
    const moved = attackDamage(s, at(s, 'brassSpider'), at(s, 'ancientBear'), false, 2);
    expect(still - moved).toBe(ABILITY.standShotBonus * scaleOf(s));
  });

  it('Na Duże Cele (Pogromca): + A against large units only', () => {
    const s = fightClans([['giantSlayer', 'dawn', 4, 8], ['boneDragon', 'horde', 5, 9, 99], ['elfDruid', 'horde', 3, 7, 99]]);
    const small = attackDamage(s, at(s, 'giantSlayer'), at(s, 'elfDruid'), false, 0);
    expect(attackDamage(s, at(s, 'giantSlayer'), at(s, 'boneDragon'), false, 0)).toBe(small + ABILITY.giantBonus * scaleOf(s));
  });

  it('Hartowanie (Kowal): a neighbour has + A for the rest of the battle, once', () => {
    let s = fight([['battleSmith', 'dawn', 4, 8], ['shieldDwarf', 'dawn', 5, 9], ['brassSpider', 'dawn', 6, 12], ['ancientBear', 'horde', 11, 7]]);
    const a = at(s, 'shieldDwarf').status.battleAttackBonus;
    expect(() => applyAction(s, { type: 'battleAbility', targetId: 'brassSpider' })).toThrow();
    s = applyAction(s, { type: 'battleAbility', targetId: 'shieldDwarf' });
    expect(at(s, 'shieldDwarf').status.battleAttackBonus).toBe(a + ABILITY.temperBonus * scaleOf(s));
    expect(at(s, 'battleSmith').abilityUsed).toBe(true);
  });

  it('Kolce Mechanizmu (Wartownik): the melee attacker loses Życie and the poison does not work on it', () => {
    let s = fight([['ancientBear', 'horde', 5, 9], ['bronzeSentinel', 'dawn', 4, 8]], { attacker: 'horde', defender: 'dawn' });
    const hp = at(s, 'ancientBear').hp;
    s = applyAction(s, { type: 'battleAttack', targetId: 'bronzeSentinel', useAbility: false });
    expect(at(s, 'ancientBear').hp).toBe(hp - ABILITY.quillsDamage * scaleOf(s));
    let p = fight([['hordeCrossbow', 'horde', 5, 9], ['bronzeSentinel', 'dawn', 4, 8]], { attacker: 'horde', defender: 'dawn' });
    p = applyAction(p, { type: 'battleAttack', targetId: 'bronzeSentinel', useAbility: true });
    expect(at(p, 'bronzeSentinel').status.poisoned).toBeUndefined();
  });

  it('Skok po Turniach (Jeździec): one move over units, spent only when the move needs it', () => {
    // a ring of enemies round the rider: on foot it is shut in, with the leap it gets out
    const ring: U[] = [['ramGoat', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9], ['elfDruid', 'horde', 5, 7], ['hordeCrossbow', 'horde', 3, 7], ['nymph', 'horde', 3, 9], ['dryadArcher', 'horde', 4, 6], ['hedgehog', 'horde', 4, 10]];
    const boxed = fight(ring);
    expect(goatLeapReady(boxed, at(boxed, 'ramGoat'))).toBe(true);
    const out = [...reachableCells(boxed, at(boxed, 'ramGoat')).entries()].find(([, d]) => d >= 2)?.[0];
    expect(out).toBeDefined();
    const jumped = applyAction(boxed, { type: 'battleMove', to: out! });
    expect(at(jumped, 'ramGoat').status.leapUsed).toBe(true);
    expect(goatLeapReady(jumped, at(jumped, 'ramGoat'))).toBe(false);
    // once spent, the ring holds it in again
    const again = fight(ring);
    at(again, 'ramGoat').status.leapUsed = true;
    expect(reachableCells(again, at(again, 'ramGoat')).size).toBe(0);
    // in the open the move is on foot and the leap stays
    const open = fight([['ramGoat', 'dawn', 4, 8], ['ancientBear', 'horde', 11, 7]]);
    const stepped = applyAction(open, { type: 'battleMove', to: arenaCell(4, 6) });
    expect(at(stepped, 'ramGoat').status.leapUsed).toBeUndefined();
    expect(goatLeapReady(stepped, at(stepped, 'ramGoat'))).toBe(true);
  });

  it('Młot Przodków (Gwardia): the one hit loses its next activation', () => {
    let s = fight([['hammerGuard', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9, 99], ['elfDruid', 'horde', 8, 8]]);
    s.battle!.order = ['hammerGuard', 'elfDruid', 'ancientBear'];
    s = applyAction(s, { type: 'battleAttack', targetId: 'ancientBear', useAbility: true });
    expect(at(s, 'ancientBear').status.stunned).toBe(true);
    // the Druid's turn passes, and the bear's is skipped at once: the round ends and the Hammer Guard acts again
    s.battle!.order = ['hammerGuard', 'elfDruid', 'ancientBear'];
    s.battle!.index = 1;
    s.battle!.activation = activation('elfDruid');
    const next = applyAction(s, { type: 'endActivation' });
    expect(next.battle!.round).toBe(2);
    expect(next.log.some((l) => /Ancient|Prastary|ogłuszony/.test(l.text))).toBe(true);
    expect(at(next, 'ancientBear').status.stunned).toBeUndefined();
  });

  it('Ostrzał (Armata): the shot hits the target and the enemies next to it, and it is a shooter that cannot shoot after moving', () => {
    let s = fight([['dwarfCannon', 'dawn', 2, 6], ['ancientBear', 'horde', 5, 9, 99], ['elfDruid', 'horde', 5, 11, 99], ['hordeCrossbow', 'horde', 9, 3, 99]]);
    s = applyAction(s, { type: 'battleAttack', targetId: 'ancientBear', useAbility: false });
    expect(at(s, 'elfDruid').hp).toBeLessThan(99);
    expect(at(s, 'hordeCrossbow').hp).toBe(99);
  });

  it('Błędne Światło (Skarbnik): the enemy is moved away by 2 cells, once; a unit that cannot be moved stays', () => {
    let s = fight([['skarbnik', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9], ['forestBison', 'horde', 3, 7]]);
    const from = at(s, 'ancientBear').pos;
    s = applyAction(s, { type: 'battleAbility', targetId: 'ancientBear' });
    expect(at(s, 'ancientBear').pos).not.toBe(from);
    expect(at(s, 'skarbnik').abilityUsed).toBe(true);
    const held = fight([['skarbnik', 'dawn', 4, 8], ['forestBison', 'horde', 5, 9]]);
    const there = at(held, 'forestBison').pos;
    expect(at(applyAction(held, { type: 'battleAbility', targetId: 'forestBison' }), 'forestBison').pos).toBe(there);
  });

  it('Fortyfikacja (Kolos): two cells of wall next to each other, in the obstacles, once; the Kolos is armoured and cannot be moved', () => {
    let s = fight([['clanColossus', 'dawn', 4, 8], ['ancientBear', 'horde', 9, 9]]);
    const cells = fortifyCells(s, at(s, 'clanColossus'))!;
    expect(cells).toHaveLength(2);
    s = applyAction(s, { type: 'battleAbility' });
    expect(s.battle!.raised).toEqual(cells);
    for (const c of cells) expect(s.battle!.obstacles).toContain(c);
    expect(at(s, 'clanColossus').abilityUsed).toBe(true);
    expect(canBeMoved(s, at(s, 'clanColossus'))).toBe(false);
    expect(reachableCells(s, at(s, 'ancientBear')).has(cells[0])).toBe(false);
  });

  it('Bełt Przeszywający (Strażniczka): the bolt hits the target and the enemy behind it', () => {
    let s = fight([['passWarden', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9, 99], ['elfDruid', 'horde', 6, 10, 99]]);
    s = applyAction(s, { type: 'battleAttack', targetId: 'ancientBear', useAbility: false });
    expect(at(s, 'elfDruid').hp).toBeLessThan(99);
  });

  it('the units of the Clans are heroes and supports of their own, and tiers are 1, 2-5 (A and B) and 6', () => {
    expect(['shieldDwarf', 'bronzeMole', 'brassSpider'].map(supportTier)).toEqual([1, 1, 1]);
    expect(['armoredBear', 'bronzeSentinel', 'giantSlayer', 'hammerGuard'].map(supportTier)).toEqual([2, 3, 4, 5]);
    expect(['battleSmith', 'ramGoat', 'skarbnik', 'dwarfCannon'].map(supportTier)).toEqual([2, 3, 4, 5]);
    expect(supportTier('clanColossus')).toBe(6);
    for (const id of ['ironThane', 'runeMatron', 'passWarden', 'oldMiner', 'clanWarrior', 'mountainCrossbow', 'forgePriest', 'dwarfCannon', 'clanColossus']) expect(makeBattleUnit(id, 'dawn').alive).toBe(true);
  });
});

describe('Runiczna Kuźnia', () => {
  /** The Clans with a forge and a Runiczna Kuźnia of `level`, the hero standing at home with enough ore, in the round of their turn. */
  const forged = (level = 1) => {
    const s = empire();
    const h = home(s);
    h.buildings.forge = 1;
    h.buildings.runeForge = level;
    const hero = Object.values(s.heroes).find((x) => x.faction === 'dawn')!;
    s.turnOrder = [hero.id];
    s.turnIndex = 0;
    hero.pos = h.at;
    s.kingdom!.gold.dawn = 20;
    s.kingdom!.res!.dawn = { wood: 5, ore: 10, dust: 5 };
    return { s, h };
  };
  const forge = (s: GameState, settlementId: string, unitId: string, rune: 'attack' | 'life' | 'armour') => applyAction(s, { type: 'kingdomForgeRune', settlementId, unitId, rune });

  it('forges a rune on a support of the pool: the price is paid, the rune is in the faction\'s state', () => {
    const { s, h } = forged();
    const gold = s.kingdom!.gold.dawn;
    const ore = s.kingdom!.res!.dawn.ore;
    const next = forge(s, h.id, 'brassSpider', 'attack');
    expect(next.factions.dawn.runes).toEqual({ brassSpider: ['attack'] });
    expect(next.kingdom!.gold.dawn).toBe(gold - FACTION_MECHANICS.runePrice.gold);
    expect(next.kingdom!.res!.dawn.ore).toBe(ore - FACTION_MECHANICS.runePrice.ore);
  });

  it('once a round for the whole faction, one rune per unit at level I and two at level II', () => {
    const { s, h } = forged(1);
    const a = forge(s, h.id, 'brassSpider', 'attack');
    expect(() => forge(a, h.id, 'shieldDwarf', 'life')).toThrow(/jedną runę na rundę/);
    a.round += 1;
    expect(() => forge(a, h.id, 'brassSpider', 'life')).toThrow(/drugiego poziomu/);
    expect(forge(a, h.id, 'shieldDwarf', 'life').factions.dawn.runes).toEqual({ brassSpider: ['attack'], shieldDwarf: ['life'] });
    const { s: s2, h: h2 } = forged(2);
    const b = forge(s2, h2.id, 'brassSpider', 'attack');
    b.round += 1;
    const c = forge(b, h2.id, 'brassSpider', 'life');
    expect(c.factions.dawn.runes!.brassSpider).toEqual(['attack', 'life']);
    c.round += 1;
    expect(() => forge(c, h2.id, 'brassSpider', 'armour')).toThrow(/komplet/);
    // not the same rune twice
    const { s: s3, h: h3 } = forged(2);
    const d = forge(s3, h3.id, 'brassSpider', 'attack');
    d.round += 1;
    expect(() => forge(d, h3.id, 'brassSpider', 'attack')).toThrow(/taką runę/);
  });

  it('refuses without the forge, without the resources, and for a unit that is not in the pool', () => {
    const { s, h } = forged();
    expect(() => forge(s, h.id, 'lich', 'attack')).toThrow(/nie ma w drużynie/);
    const noOre = structuredClone(s);
    noOre.kingdom!.res!.dawn.ore = 0;
    expect(() => forge(noOre, h.id, 'brassSpider', 'attack')).toThrow(/Brakuje/);
    const none = structuredClone(s);
    none.kingdom!.settlements[h.id].buildings.runeForge = 0;
    expect(() => forge(none, h.id, 'brassSpider', 'attack')).toThrow(/nie ma Runicznej Kuźni/);
  });

  it('the runes make a battle: +1 A, +1 Ż, armour 1 on the support that carries them (and nothing on the others)', () => {
    const { s, h } = forged(2);
    let cur = forge(s, h.id, 'brassSpider', 'attack');
    cur.round += 1;
    cur = forge(cur, h.id, 'brassSpider', 'life');
    cur.round += 1;
    const armoured = structuredClone(cur);
    armoured.factions.dawn.runes = { brassSpider: ['armour'] };
    const make = (st: GameState, id: string) => {
      const u = makeBattleUnit(id, 'dawn', true, scaleOf(st), hpScaleOf(st));
      runeBonus(st, 'dawn', u);
      return u;
    };
    const base = makeBattleUnit('brassSpider', 'dawn', true, scaleOf(cur), hpScaleOf(cur));
    const runed = make(cur, 'brassSpider');
    expect(runed.status.battleAttackBonus).toBe(base.status.battleAttackBonus + scaleOf(cur));
    expect(runed.maxHp).toBe(base.maxHp + hpScaleOf(cur));
    expect(runed.hp).toBe(base.hp + hpScaleOf(cur));
    expect(make(armoured, 'brassSpider').status.damageReduction).toBe(scaleOf(cur));
    expect(make(cur, 'shieldDwarf').maxHp).toBe(makeBattleUnit('shieldDwarf', 'dawn', true, scaleOf(cur), hpScaleOf(cur)).maxHp);
  });

  it('a rune stays with its unit when it falls and comes back to the pool (and survives a save: plain JSON)', () => {
    const { s, h } = forged();
    const a = forge(s, h.id, 'brassSpider', 'attack');
    a.factions.dawn.supportsAlive = a.factions.dawn.supportsAlive.filter((id) => id !== 'brassSpider');
    a.factions.dawn.supportsDead.push('brassSpider');
    expect(a.factions.dawn.runes!.brassSpider).toEqual(['attack']);
    a.factions.dawn.supportsDead = a.factions.dawn.supportsDead.filter((id) => id !== 'brassSpider');
    a.factions.dawn.supportsAlive.push('brassSpider');
    const saved = JSON.parse(JSON.stringify(a)) as GameState;
    expect(saved.factions.dawn.runes).toEqual({ brassSpider: ['attack'] });
    expect(saved.factions.dawn.runeRound).toBe(a.round);
    // a fallen unit can take a rune too (it waits for its return)
    saved.factions.dawn.supportsAlive = saved.factions.dawn.supportsAlive.filter((id) => id !== 'shieldDwarf');
    saved.factions.dawn.supportsDead.push('shieldDwarf');
    saved.round += 1;
    expect(forge(saved, h.id, 'shieldDwarf', 'armour').factions.dawn.runes!.shieldDwarf).toEqual(['armour']);
  });

  it('the bot forges a rune (the strongest unit first) and the rune suits the unit: shooters strike, the others keep their skin', () => {
    const { s, h } = forged();
    const pick = botRune(s, 'dawn', h)!;
    expect(pick.unitId).toBeDefined();
    expect(UNITS_RANGED(pick.unitId) ? pick.rune === 'attack' : pick.rune === 'armour').toBe(true);
    expect(runeBlock(s, 'dawn', h, pick.unitId, pick.rune)).toBeNull();
  });
});
const UNITS_RANGED = (id: string) => ['brassSpider', 'skarbnik', 'dwarfCannon'].includes(id);

describe('Głęboka Sztolnia', () => {
  it('gives ore every round from each settlement that has it, and Pył every third round from the second level', () => {
    const s = empire();
    const h = home(s);
    const base = resourceIncomeOf(s, 'dawn');
    h.buildings.deepMine = 1;
    expect(resourceIncomeOf(s, 'dawn').ore).toBe(base.ore + FACTION_MECHANICS.mineOre);
    h.buildings.deepMine = 2;
    s.round = 3;
    expect(resourceIncomeOf(s, 'dawn').dust).toBe(base.dust + FACTION_MECHANICS.mineDust);
    s.round = 4;
    expect(resourceIncomeOf(s, 'dawn').dust).toBe(base.dust);
  });

  it('the parents in the tree: the Sala Tarcz on the walls, the Runiczna Kuźnia on the forge, the Sztolnia on the treasury', async () => {
    const { BUILDING_PARENT } = await import('../src/engine/kingdom');
    expect(BUILDING_PARENT.shieldHall).toBe('walls');
    expect(BUILDING_PARENT.runeForge).toBe('forge');
    expect(BUILDING_PARENT.deepMine).toBe('treasury');
  });
});

describe('games with the Iron Clans', () => {
  it('the Clans are a pack: heroes, supports and units of their own, with the commanders and the fourth hero', () => {
    const s = createGame(table(['clans', 'dawn'], 'control'));
    expect(teamsOf(s)).toEqual(['dawn', 'horde']);
    expect(Object.values(s.heroes).find((h) => h.faction === 'dawn')?.id).toBe('ironThane');
    expect(s.factions.dawn.supportsAlive).toEqual(['shieldDwarf', 'bronzeMole', 'brassSpider']);
  });

  for (const [a, b] of [['clans', 'dawn'], ['clans', 'horde'], ['herds', 'clans'], ['clans', 'undead']] as const) {
    for (const objective of ['control', 'conquest', 'relic'] as const) {
      it(`${a} against ${b}, goal ${objective}: bots play to the end on several seeds`, () => {
        for (const seed of [1, 2]) {
          const end = playOut(createGame(table([a, b], objective, { seed })));
          expect(end.phase).toBe('over');
        }
      });
    }
  }

  it('four sides (the Clans among the others) play a conquest to the end', () => {
    const end = playOut(createGame(table(['dawn', 'clans', 'herds', 'undead'], 'conquest', { seed: 3 })));
    expect(end.phase).toBe('over');
  });

  it('the bot of the Clans forges a rune as soon as a Runiczna Kuźnia stands and it can pay', () => {
    const { s, h } = (() => {
      const g = empire();
      const home0 = home(g);
      home0.buildings.forge = 1;
      home0.buildings.runeForge = 1;
      g.kingdom!.gold.dawn = 20;
      g.kingdom!.res!.dawn = { wood: 5, ore: 10, dust: 5 };
      return { s: g, h: home0 };
    })();
    const action = botPurchase(s, 'dawn', h);
    expect(action?.type).toBe('kingdomForgeRune');
    // no resources: no rune
    s.kingdom!.res!.dawn.ore = 0;
    expect(botPurchase(s, 'dawn', h)?.type).not.toBe('kingdomForgeRune');
  });

  it('coop and the arena refuse the Clans with a clear error', () => {
    const coop = { ...table(['clans', 'horde'], 'survival'), mode: 'coop' as const };
    coop.seats = [{ ...coop.seats[0], faction: 'dawn' }];
    expect(() => createGame(coop)).toThrow(/tylko w rywalizacji/);
  });
});
