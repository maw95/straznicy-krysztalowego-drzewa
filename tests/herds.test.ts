// Dzikie Stado (docs/frakcje/herds.md): the push with a collision, the resistance to being moved, the leap, the taunt, the aura and every ability of the faction,
// then whole games of the Herds against Przymierze and Horda.
import { describe, expect, it } from 'vitest';
import { applyAction, createGame } from '../src/engine/game';
import { ABILITY, FACTION_HEROES } from '../src/engine/data';
import { arenaCell, attackDamage, attackTargets, canLeap, predictDamage, reachableCells, refreshAuras, unitSpeed } from '../src/engine/battle';
import { assignSlots, teamsOf } from '../src/engine/teams';
import { canBeMoved, pushWithCollision, pushedThisRound } from '../src/engine/primitives';
import { refugeTargets } from '../src/engine/kingdom';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../src/engine/types';
import { activation, battleFixture, playOut, setup } from './helpers/engine';

type U = [id: string, side: 'dawn' | 'horde', col: number, half: number, hp?: number];

/** A battle on the old arena with the listed units (the first one acts); no dice, so the numbers are exact. */
function fight(units: U[], over: Partial<NonNullable<GameState['battle']>> = {}, rules: Partial<SetupOptions['rules']> = {}): GameState {
  const s = createGame(setup({}, { useDice: false, ...rules }));
  return battleFixture(s, units.map(([id, side, col, half, hp]) => ({ id, side, col, half, hp })), over);
}
const at = (s: GameState, id: string) => s.battle!.units[id];

describe('pushWithCollision', () => {
  it('a free cell: the target moves and is marked as pushed in this round, no damage', () => {
    const s = fight([['youngAurochs', 'dawn', 4, 8], ['nymph', 'horde', 5, 9]]);
    const t = at(s, 'nymph');
    const out = pushWithCollision(s, t, at(s, 'youngAurochs'), 2, 3, 'test');
    expect(out).toMatchObject({ moved: 2, stoppedBy: null });
    expect(t.pos).toBe(arenaCell(7, 11));
    expect(t.hp).toBe(at(s, 'nymph').maxHp);
    expect(pushedThisRound(s, t)).toBe(true);
  });

  it('a boulder stops the push and the collision hurts', () => {
    const s = fight([['youngAurochs', 'dawn', 4, 8], ['nymph', 'horde', 5, 9]], { obstacles: [arenaCell(7, 11)] });
    const t = at(s, 'nymph');
    const out = pushWithCollision(s, t, at(s, 'youngAurochs'), 3, 2, 'test');
    expect(out).toMatchObject({ moved: 1, stoppedBy: 'obstacle' });
    expect(t.pos).toBe(arenaCell(6, 10));
    expect(t.hp).toBe(t.maxHp - 2);
  });

  it('a unit that is hit takes the collision too (also an ally of the pusher)', () => {
    const s = fight([['youngAurochs', 'dawn', 4, 8], ['nymph', 'horde', 5, 9], ['elfDruid', 'dawn', 6, 10]]);
    const out = pushWithCollision(s, at(s, 'nymph'), at(s, 'youngAurochs'), 1, 1, 'test');
    expect(out).toMatchObject({ moved: 0, stoppedBy: 'unit' });
    expect(at(s, 'nymph').hp).toBe(at(s, 'nymph').maxHp - 1);
    expect(at(s, 'elfDruid').hp).toBe(at(s, 'elfDruid').maxHp - 1);
  });

  it('the edge of the arena is a wall too, and a plain push (damage 0) does not hurt', () => {
    const s = fight([['youngAurochs', 'dawn', 11, 7], ['nymph', 'horde', 12, 8]]);
    const t = at(s, 'nymph');
    expect(pushWithCollision(s, t, at(s, 'youngAurochs'), 1, 0, 'test')).toMatchObject({ moved: 0, stoppedBy: 'edge' });
    expect(t.hp).toBe(t.maxHp);
    pushWithCollision(s, t, at(s, 'youngAurochs'), 1, 2, 'test');
    expect(t.hp).toBe(t.maxHp - 2);
  });

  it('the immovable (Żubr, Indrik), the large (with a tail) and everyone in a duel stay where they are', () => {
    const s = fight([['youngAurochs', 'dawn', 4, 8], ['forestBison', 'horde', 5, 9], ['indrik', 'horde', 3, 7]]);
    for (const id of ['forestBison', 'indrik']) {
      expect(canBeMoved(s, at(s, id))).toBe(false);
      expect(pushWithCollision(s, at(s, id), at(s, 'youngAurochs'), 1, 5, 'test')).toMatchObject({ moved: 0, stoppedBy: 'immovable' });
      expect(at(s, id).hp).toBe(at(s, id).maxHp);
    }
    const big = fight([['youngAurochs', 'dawn', 4, 8], ['nymph', 'horde', 5, 9]]);
    at(big, 'nymph').tail = arenaCell(6, 10);
    expect(canBeMoved(big, at(big, 'nymph'))).toBe(false);
    const duel = fight([['youngAurochs', 'dawn', 4, 8], ['nymph', 'horde', 5, 9]], { duel: true });
    expect(canBeMoved(duel, at(duel, 'nymph'))).toBe(false);
  });

  it('a push over a charged field wakes it', () => {
    const s = fight([['youngAurochs', 'dawn', 4, 8], ['nymph', 'horde', 5, 9]], { fields: [{ cell: arenaCell(6, 10), until: 3 }] });
    pushWithCollision(s, at(s, 'nymph'), at(s, 'youngAurochs'), 1, 0, 'test');
    expect(at(s, 'nymph').hp).toBe(at(s, 'nymph').maxHp - ABILITY.chargedFieldDamage);
  });
});

describe('abilities of the units', () => {
  it('Byczy Łeb (Młody Tur): every attack pushes the target 1 cell, and a boulder behind it hurts', () => {
    let s = fight([['youngAurochs', 'dawn', 4, 8], ['nymph', 'horde', 5, 9]]);
    s = applyAction(s, { type: 'battleAttack', targetId: 'nymph' });
    expect(at(s, 'nymph').pos).toBe(arenaCell(6, 10));
    let w = fight([['youngAurochs', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9]], { obstacles: [arenaCell(6, 10)] });
    const before = at(w, 'ancientBear').hp;
    w = applyAction(w, { type: 'battleAttack', targetId: 'ancientBear' });
    expect(at(w, 'ancientBear').pos).toBe(arenaCell(5, 9));
    // the blow itself (3 A after the G2 balance) plus the collision
    expect(before - at(w, 'ancientBear').hp).toBe(UNITSA('youngAurochs') + ABILITY.collisionDamage);
  });

  it('Taran (Nosorożec Bojowy): after a run of 3 the target is pushed 2 and the collision hurts for 2', () => {
    const s = fight([['warRhino', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9]]);
    s.battle!.activation = { ...activation('warRhino'), moved: true, movedDistance: 3 };
    const t = at(s, 'ancientBear');
    const next = applyAction(s, { type: 'battleAttack', targetId: 'ancientBear' });
    expect(at(next, 'ancientBear').pos).toBe(arenaCell(7, 11));
    expect(t.maxHp - at(next, 'ancientBear').hp).toBe(UNITSA('warRhino'));
    // a short run: no push
    const short = fight([['warRhino', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9]]);
    short.battle!.activation = { ...activation('warRhino'), moved: true, movedDistance: 2 };
    expect(at(applyAction(short, { type: 'battleAttack', targetId: 'ancientBear' }), 'ancientBear').pos).toBe(arenaCell(5, 9));
    // against a boulder the collision is 2 more
    const wall = fight([['warRhino', 'dawn', 4, 8], ['ancientBear', 'horde', 5, 9]], { obstacles: [arenaCell(6, 10)] });
    wall.battle!.activation = { ...activation('warRhino'), moved: true, movedDistance: 3 };
    const hit = applyAction(wall, { type: 'battleAttack', targetId: 'ancientBear' });
    expect(at(hit, 'ancientBear').maxHp - at(hit, 'ancientBear').hp).toBe(UNITSA('warRhino') + ABILITY.ramCollisionDamage);
  });

  it('Rogi Przodków (Wielki Tur): once per battle the blow pushes the target 2 cells', () => {
    const s = fight([['greatAurochs', 'dawn', 4, 8], ['nymph', 'horde', 5, 9, 99]]);
    const next = applyAction(s, { type: 'battleAttack', targetId: 'nymph', useAbility: true });
    expect(at(next, 'nymph').pos).toBe(arenaCell(7, 11));
    expect(at(next, 'greatAurochs').abilityUsed).toBe(true);
    const plain = applyAction(fight([['greatAurochs', 'dawn', 4, 8], ['nymph', 'horde', 5, 9, 99]]), { type: 'battleAttack', targetId: 'nymph' });
    expect(at(plain, 'nymph').pos).toBe(arenaCell(5, 9));
  });

  it('Rozpęd (Wół Piżmowy) and Lot na Strzelców (Łamignat) add Atak', () => {
    const s = fight([['muskOx', 'dawn', 4, 8], ['nymph', 'horde', 5, 9], ['steppeLamignat', 'dawn', 3, 7]]);
    const base = attackDamage(s, at(s, 'muskOx'), at(s, 'nymph'), false, 2);
    expect(attackDamage(s, at(s, 'muskOx'), at(s, 'nymph'), false, 3)).toBe(base + ABILITY.momentumBonus);
    const plain = attackDamage(s, at(s, 'steppeLamignat'), at(s, 'nymph'), false, 0);
    at(s, 'nymph').status.pushedRound = s.battle!.round;
    expect(attackDamage(s, at(s, 'steppeLamignat'), at(s, 'nymph'), false, 0)).toBe(plain + ABILITY.hippoBonus);
    s.battle!.round = 2;
    expect(attackDamage(s, at(s, 'steppeLamignat'), at(s, 'nymph'), false, 0)).toBe(plain);
  });

  it('Niewzruszony (Żubr): armour, and a blow that lands still takes at least 1', () => {
    const s = fight([['ancientBear', 'dawn', 4, 8], ['forestBison', 'horde', 5, 9]]);
    const raw = attackDamage(s, at(s, 'ancientBear'), at(s, 'forestBison'), false, 0);
    expect(predictDamage(s, at(s, 'ancientBear'), at(s, 'forestBison'), { useAbility: false, movedDistance: 0 }).damage).toBe(raw - ABILITY.unmovedArmor);
    const weak = fight([['elfDruid', 'dawn', 4, 8], ['forestBison', 'horde', 5, 9]]);
    expect(predictDamage(weak, at(weak, 'elfDruid'), at(weak, 'forestBison'), { useAbility: false, movedDistance: 0 }).damage).toBeGreaterThanOrEqual(1);
  });

  it('Przebicie (Arkar) hits the enemy behind the target, not an ally', () => {
    let s = fight([['arkar', 'dawn', 4, 8], ['nymph', 'horde', 5, 9], ['elfDruid', 'horde', 6, 10]]);
    s = applyAction(s, { type: 'battleAttack', targetId: 'nymph' });
    expect(at(s, 'elfDruid').hp).toBeLessThan(at(s, 'elfDruid').maxHp);
    let a = fight([['arkar', 'dawn', 4, 8], ['nymph', 'horde', 5, 9], ['elfDruid', 'dawn', 6, 10]]);
    a = applyAction(a, { type: 'battleAttack', targetId: 'nymph' });
    expect(at(a, 'elfDruid').hp).toBe(at(a, 'elfDruid').maxHp);
  });

  it('Strzał nad Przeszkodami (Orzeł Stepowy Łowca): neither terrain nor units block his arrows, other shooters stay blocked', () => {
    const spots: U[] = [['eagleHunter', 'dawn', 2, 6], ['nymph', 'horde', 8, 12]];
    const wall = { obstacles: [arenaCell(5, 9)] };
    const eagle = fight(spots, wall);
    expect(attackTargets(eagle, at(eagle, 'eagleHunter')).map((t) => t.id)).toEqual(['nymph']);
    const plain = fight([['steppeArcher', 'dawn', 2, 6], ['nymph', 'horde', 8, 12]], wall);
    at(plain, 'steppeArcher').defId = 'dryadArcher';
    expect(attackTargets(plain, at(plain, 'steppeArcher')).length).toBe(0);
    // units on the line count only in the experimental rule, and still do not stop the eagle
    const crowd = fight([...spots, ['goblinShaman', 'horde', 5, 9]], {}, { unitsBlockSight: true });
    expect(attackTargets(crowd, at(crowd, 'eagleHunter')).map((t) => t.id).sort()).toEqual(['goblinShaman', 'nymph']);
  });

  it('Skok po Turniach (Kulan) walks through obstacles and units, and never ends on them', () => {
    const s = fight([['kulan', 'dawn', 4, 8], ['nymph', 'horde', 5, 9]], { obstacles: [arenaCell(5, 7), arenaCell(5, 9 + 2)] });
    const goat = reachableCells(s, at(s, 'kulan'));
    const walker = fight([['youngAurochs', 'dawn', 4, 8], ['nymph', 'horde', 5, 9]], { obstacles: [arenaCell(5, 7), arenaCell(5, 11)] });
    expect(canLeap(s, at(s, 'kulan'))).toBe(true);
    expect(goat.size).toBeGreaterThan(reachableCells(walker, at(walker, 'youngAurochs')).size);
    expect(goat.has(arenaCell(5, 9))).toBe(false);
    expect(goat.has(arenaCell(5, 7))).toBe(false);
    expect(goat.has(arenaCell(6, 10))).toBe(true);
  });

  it('Bęben Wędrówki (Słoń): allies within 2 cells have +1 S, the aura does not stack and ends when the drum falls silent', () => {
    const s = fight([['drumElephant', 'dawn', 4, 8], ['kulan', 'dawn', 5, 9], ['nymph', 'dawn', 11, 7], ['elfDruid', 'horde', 6, 10]]);
    refreshAuras(s);
    expect(unitSpeed(at(s, 'kulan'))).toBe(UNIT_SPEED.kulan + ABILITY.drumHaste);
    expect(unitSpeed(at(s, 'nymph'))).toBe(UNIT_SPEED.nymph);
    expect(unitSpeed(at(s, 'elfDruid'))).toBe(UNIT_SPEED.elfDruid);
    at(s, 'drumElephant').alive = false;
    refreshAuras(s);
    expect(unitSpeed(at(s, 'kulan'))).toBe(UNIT_SPEED.kulan);
  });

  it('Skoczny Rytm and Róg Wędrówki give S in the next activation, once per battle', () => {
    let s = fight([['satyrPiper', 'dawn', 4, 8], ['kulan', 'dawn', 3, 7], ['nymph', 'dawn', 2, 6], ['elfDruid', 'horde', 11, 7]]);
    s = applyAction(s, { type: 'battleAbility', targetId: 'kulan' });
    expect(at(s, 'kulan').status.slowNext).toBe(-ABILITY.rhythmHaste);
    expect(at(s, 'nymph').status.slowNext).toBe(0);
    expect(() => applyAction(s, { type: 'battleAbility', targetId: 'kulan' })).toThrow();
    let h = fight([['satyrHornlord', 'dawn', 4, 8], ['kulan', 'dawn', 3, 7], ['elfDruid', 'horde', 11, 7]]);
    h = applyAction(h, { type: 'battleAbility' });
    expect(at(h, 'kulan').status.slowNext).toBe(-ABILITY.hornHaste);
    expect(at(h, 'satyrHornlord').status.slowNext).toBe(-ABILITY.hornHaste);
    expect(at(h, 'elfDruid').status.slowNext).toBe(0);
  });

  it('Rykowisko (Łoś): the challenged enemy may attack only the moose in its next activation', () => {
    let s = fight([['bullMoose', 'dawn', 4, 8], ['nymph', 'dawn', 6, 10], ['elfDruid', 'horde', 5, 9], ['ancientBear', 'horde', 12, 8]]);
    s = applyAction(s, { type: 'battleAbility', targetId: 'elfDruid' });
    expect(at(s, 'elfDruid').status.tauntedBy).toBe('bullMoose');
    expect(attackTargets(s, at(s, 'elfDruid')).map((u) => u.id)).toEqual(['bullMoose']);
    // out of range
    const far = fight([['bullMoose', 'dawn', 1, 7], ['ancientBear', 'horde', 12, 8]]);
    expect(() => applyAction(far, { type: 'battleAbility', targetId: 'ancientBear' })).toThrow();
    // the challenge is spent with the activation
    s.battle!.activation = activation('elfDruid');
    s = applyAction(s, { type: 'endActivation' });
    expect(at(s, 'elfDruid').status.tauntedBy).toBeUndefined();
  });

  it('Ziemia Drży (Indrik): small enemies within 2 are pushed 1 cell, and the immovable stay', () => {
    let s = fight([['indrik', 'dawn', 4, 8], ['nymph', 'horde', 5, 9], ['elfDruid', 'horde', 3, 7], ['forestBison', 'horde', 4, 10], ['ancientBear', 'horde', 12, 8]]);
    s = applyAction(s, { type: 'battleAbility' });
    expect(at(s, 'nymph').pos).toBe(arenaCell(6, 10));
    expect(at(s, 'forestBison').pos).toBe(arenaCell(4, 10));
    expect(at(s, 'ancientBear').pos).toBe(arenaCell(12, 8));
    expect(at(s, 'indrik').abilityUsed).toBe(true);
  });

  it('W Biegu (Pędziwiatr): after the attack the move is finished with the cells left', () => {
    let s = fight([['windAntelope', 'dawn', 4, 8], ['nymph', 'horde', 5, 9, 99]]);
    s.battle!.activation = { ...activation('windAntelope'), moved: true, movedDistance: 3 };
    s = applyAction(s, { type: 'battleAttack', targetId: 'nymph' });
    expect(s.battle!.activation?.hop).toBe(UNIT_SPEED.windAntelope - 3);
    s = applyAction(s, { type: 'battleHop', to: arenaCell(2, 8) });
    expect(at(s, 'windAntelope').pos).toBe(arenaCell(2, 8));
    // no cells left: the activation simply ends
    const none = fight([['windAntelope', 'dawn', 4, 8], ['nymph', 'horde', 5, 9, 99]]);
    none.battle!.activation = { ...activation('windAntelope'), moved: true, movedDistance: UNIT_SPEED.windAntelope };
    expect(applyAction(none, { type: 'battleAttack', targetId: 'nymph' }).battle!.activation?.hop ?? 0).toBe(0);
  });
});

/** The Szybkość of the units the tests above use (their cards). */
const UNIT_SPEED: Record<string, number> = { kulan: 5, nymph: 4, elfDruid: 4, windAntelope: 7 };
function UNITSA(id: string): number {
  return ({ youngAurochs: 3, warRhino: 5 } as Record<string, number>)[id];
}

describe('Kamień Tętentu, Wielkie Pastwiska, Ostoja Wędrówek', () => {
  /** A rivalry table of Herds (first side) against Horda with the level 6 rules, and a battle fixture in it. */
  const empire = (): GameState => createGame(table(['herds', 'horde'], 'conquest', { seed: 4 }));

  it('the mechanic works at its levels: a run of 3 pushes, level 2 hurts more, level 3 needs a run of 2, level 4 slows', () => {
    const base = (level: number, moved: number) => {
      const s = empire();
      const home = Object.values(s.kingdom!.settlements).find((x) => x.owner === 'dawn')!;
      home.buildings.hoofStone = level;
      const f = battleFixture(s, [{ id: 'kulan', side: 'dawn', col: 4, half: 8 }, { id: 'ancientBear', side: 'horde', col: 5, half: 9 }], { obstacles: [arenaCell(6, 10)] });
      f.rules.useDice = false;
      f.battle!.activation = { ...activation('kulan'), moved: true, movedDistance: moved };
      return applyAction(f, { type: 'battleAttack', targetId: 'ancientBear' });
    };
    const bear = (s: GameState) => at(s, 'ancientBear');
    const lost = (s: GameState) => bear(s).maxHp - bear(s).hp;
    const scale = base(0, 3).rules.statScale ?? 1;
    const blow = lost(base(0, 3));
    expect(lost(base(1, 2))).toBe(blow);
    expect(lost(base(1, 3))).toBe(blow + ABILITY.collisionDamage * scale);
    expect(lost(base(2, 3))).toBe(lost(base(1, 3)) + 1 * scale);
    expect(lost(base(3, 2))).toBe(lost(base(2, 3)));
    expect(bear(base(4, 3)).status.slowNext).toBe(1);
    expect(bear(base(3, 3)).status.slowNext).toBe(0);
  });

  it('Wielkie Pastwiska make the recruits cheaper', async () => {
    const { recruitsOf } = await import('../src/engine/kingdom');
    const s = empire();
    const home = Object.values(s.kingdom!.settlements).find((x) => x.owner === 'dawn')!;
    const price = (tier: number) => recruitsOf(s, 'dawn').find((r) => r.tier === tier)!.cost;
    const full = [1, 2, 3, 4, 5].map(price);
    home.buildings.pastures = 1;
    expect([1, 2, 3, 4, 5].map(price)).toEqual([full[0] - 1, full[1] - 1, full[2] - 1, full[3], full[4]]);
    home.buildings.pastures = 2;
    expect([1, 2, 3, 4, 5].map(price)).toEqual(full.map((c) => c - 1));
  });

  it('Ostoja Wędrówek: a hero jumps between own settlements with an Ostoja, once a round', () => {
    const s = empire();
    const hero = Object.values(s.heroes).find((h) => h.faction === 'dawn')!;
    const ours = Object.values(s.kingdom!.settlements).filter((x) => x.owner === 'dawn');
    // a second own settlement
    const spot = Object.values(s.tiles).find((t) => !t.home && !t.place && !t.crystalId && !t.treasureId && t.terrain === 'meadow')!;
    const other = { ...structuredClone(ours[0]), id: 'extra', at: spot.key, name: 'Wodopój', buildings: { ...ours[0].buildings } };
    s.kingdom!.settlements.extra = other;
    ours[0].buildings.refuge = 1;
    other.buildings.refuge = 1;
    s.turnOrder = [hero.id];
    s.turnIndex = 0;
    hero.pos = ours[0].at;
    expect(refugeTargets(s, hero).map((x) => x.id)).toEqual([other.id]);
    const next = applyAction(s, { type: 'kingdomRefuge', settlementId: other.id });
    expect(next.heroes[hero.id].pos).toBe(other.at);
    expect(() => applyAction(next, { type: 'kingdomRefuge', settlementId: ours[0].id })).toThrow(/raz na rundę|Ostoj/);
    // without an Ostoja where it stands there is no jump
    const none = structuredClone(s);
    none.kingdom!.settlements[ours[0].id].buildings.refuge = 0;
    expect(() => applyAction(none, { type: 'kingdomRefuge', settlementId: other.id })).toThrow();
  });
});

/** A table of bots, one seat per race, on a rectangle map. */
function table(races: Array<'dawn' | 'horde' | 'herds'>, objective: SetupOptions['rules']['objective'], over: Partial<SetupOptions> = {}): SetupOptions {
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

describe('games with the Herds', () => {
  it('the Herds are a pack: heroes, supports and units of their own', () => {
    const s = createGame(table(['herds', 'dawn'], 'control'));
    expect(teamsOf(s)).toEqual(['dawn', 'horde']);
    expect(Object.values(s.heroes).find((h) => h.faction === 'dawn')?.id).toBe('greatAurochs');
    expect(s.factions.dawn.supportsAlive).toEqual(['satyrPiper', 'youngAurochs', 'kulan']);
  });

  for (const [a, b] of [['herds', 'dawn'], ['herds', 'horde'], ['dawn', 'herds']] as const) {
    for (const objective of ['control', 'conquest', 'relic'] as const) {
      it(`${a} against ${b}, goal ${objective}: bots play to the end on several seeds`, () => {
        for (const seed of [1, 2, 3]) {
          const end = playOut(createGame(table([a, b], objective, { seed })));
          expect(end.phase).toBe('over');
        }
      });
    }
  }

  it('three sides (Przymierze, Horda and the Herds) play a control game and a conquest to the end', () => {
    for (const objective of ['control', 'conquest', 'relic'] as const) {
      const end = playOut(createGame(table(['dawn', 'horde', 'herds'], objective, { seed: 2 })));
      expect(end.phase).toBe('over');
      expect(teamsOf(end)).toEqual(['dawn', 'horde', 'third']);
    }
  });

  it('coop and the arena refuse the Herds with a clear error', () => {
    const coop = { ...table(['herds', 'horde'], 'survival'), mode: 'coop' as const };
    coop.seats = [{ ...coop.seats[0], faction: 'dawn' }];
    expect(() => createGame(coop)).toThrow(/tylko w rywalizacji/);
  });
});
