// Level 4 "Księstwo": wood, ore and Gwiezdny Pył, resource mines, building prices, and bots that play it to the end.

import { describe, expect, it } from 'vitest';
import { activeHero, applyAction, createGame } from '../src/engine/game';
import { ECONOMY, OBJECTS } from '../src/engine/economy';
import { artifactBill, buildBlock, autopilotAction, botPurchase, hasParent, buildCost, buildingsOf, canPay, forgeLevel, incomeOf, resOf, resourceIncomeOf, settlementAt, tradeBuyPrice } from '../src/engine/kingdom';
import { pointsFor } from '../src/engine/scoring';
import { ARTIFACTS } from '../src/engine/sites';
import { mapNeighbors } from '../src/engine/map';
import type { GameState, SetupOptions } from '../src/engine/types';

const neighbours = (s: GameState, hex: string) => mapNeighbors(s.tiles, hex);
import { playOut, setup } from './helpers/engine';

const rules = { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true } as const;
const economy = (over: Partial<SetupOptions> = {}): GameState => createGame(setup({ mapSize: 'medium', seed: 3, ...over }, rules));
const ownStart = (s: GameState) => settlementAt(s, Object.values(s.tiles).find((t) => t.home === 'dawn')!.key)!;
const stand = (s: GameState, hex: string) => {
  const hero = activeHero(s)!;
  s.heroes[hero.id].pos = hex;
  s.movePoints = 3;
};

describe('level 4: the map and the start', () => {
  it('has mines of every resource by map size and the starting stock', () => {
    const s = economy({ mapSize: 'long' });
    const mines = Object.values(s.kingdom!.mines);
    for (const r of ['wood', 'ore', 'dust'] as const) expect(mines.filter((m) => m.res === r)).toHaveLength(ECONOMY.mines[r].long);
    expect(mines.filter((m) => !m.res).length).toBeGreaterThan(0);
    expect(resOf(s, 'dawn')).toEqual(ECONOMY.start);
    expect(resOf(s, 'horde')).toEqual(ECONOMY.start);
  });

  it('is absent from level 3: no resources, gold-only prices', () => {
    const s = createGame(setup({ mapSize: 'medium', seed: 3 }, { ruleset: 'digital', heroGrowth: true, kingdom: true }));
    expect(s.kingdom!.res).toBeUndefined();
    expect(buildCost(s, ownStart(s), 'barracks')).toEqual({ gold: 3 });
  });
});

describe('level 4: income and prices', () => {
  it('pays resources at the end of the round: the mine of its kind (the settlement gives gold only)', () => {
    let s = economy();
    expect(resourceIncomeOf(s, 'dawn')).toEqual({ wood: 0, ore: 0, dust: 0 });
    const mine = Object.entries(s.kingdom!.mines).find(([, m]) => m.res === 'ore')![0];
    s.kingdom!.mines[mine].owner = 'dawn';
    expect(resourceIncomeOf(s, 'dawn')).toEqual({ wood: 0, ore: 1, dust: 0 });
    const round = s.round;
    while (s.round === round) s = applyAction(s, { type: 'endTurn' });
    expect(resOf(s, 'dawn')).toEqual({ wood: ECONOMY.start.wood, ore: 1, dust: 0 });
  });

  it('the treasury has two levels: +1 gold a round, upgraded +2 (the author, 18.11)', () => {
    let s = economy();
    const home = ownStart(s);
    stand(s, home.at);
    s.kingdom!.gold.dawn = 40;
    s.kingdom!.res!.dawn = { wood: 5, ore: 5, dust: 1 };
    const base = incomeOf(s, 'dawn');
    s = applyAction(s, { type: 'kingdomBuild', settlementId: home.id, building: 'treasury' });
    expect(incomeOf(s, 'dawn')).toBe(base + 1);
    s = applyAction(s, { type: 'kingdomBuild', settlementId: home.id, building: 'treasury' });
    expect(s.kingdom!.settlements[home.id].buildings.treasury).toBe(2);
    expect(incomeOf(s, 'dawn')).toBe(base + 2);
    expect(() => applyAction(s, { type: 'kingdomBuild', settlementId: home.id, building: 'treasury' })).toThrow();
  });

  it('charges resources for buildings, dust for the second level and for a legendary artifact', () => {
    let s = economy();
    const home = ownStart(s);
    stand(s, home.at);
    s.kingdom!.gold.dawn = 40;
    expect(() => applyAction(s, { type: 'kingdomBuild', settlementId: home.id, building: 'treasury' })).toThrow(/ruda/);
    s.kingdom!.res!.dawn = { wood: 5, ore: 5, dust: 0 };
    s = applyAction(s, { type: 'kingdomBuild', settlementId: home.id, building: 'barracks' });
    expect(s.kingdom!.gold.dawn).toBe(40 - 3);
    expect(resOf(s, 'dawn').wood).toBe(3);
    // No limit of one building a round (17.11): the price is the only limit.
    s = applyAction(s, { type: 'kingdomBuild', settlementId: home.id, building: 'market' });
    expect(s.kingdom!.res!.dawn.wood).toBe(1);
    const round = s.round;
    while (s.round === round) s = applyAction(s, { type: 'endTurn' });
    stand(s, home.id === home.id ? home.at : home.at);
    s.kingdom!.res!.dawn = { wood: 5, ore: 5, dust: 0 };
    expect(() => applyAction(s, { type: 'kingdomBuild', settlementId: home.id, building: 'barracks' })).toThrow(/Pył/);
    s.kingdom!.res!.dawn.dust = 1;
    s = applyAction(s, { type: 'kingdomBuild', settlementId: home.id, building: 'barracks' });
    expect(resOf(s, 'dawn').dust).toBe(0);
    const legendary = ARTIFACTS.find((a) => a.rarity === 3 && !a.set)!;
    expect(artifactBill(s, activeHero(s)!, legendary).dust).toBe(ECONOMY.legendaryDust);
    expect(canPay(s, 'dawn', { gold: 1, dust: 1 })).toBe(false);
  });
});

describe('level 4: bots', () => {
  it('play whole games to the end, on the shortest and a medium map, and end with resources spent on buildings', () => {
    for (const size of ['short', 'medium'] as const) {
      const s = playOut(createGame(setup({ mapSize: size, seed: 5 }, rules)));
      expect(s.phase).toBe('over');
    }
  });
});

describe('level 4: huts with a quest', () => {
  it('puts huts on the map, takes what they ask for and pays more, once', () => {
    let s = economy({ mapSize: 'long' });
    const huts = s.kingdom!.huts!;
    expect(Object.keys(huts)).toHaveLength(ECONOMY.huts.long);
    const hex = Object.keys(huts)[0];
    // A plain quest of known content: 4 gold for 2 wood.
    huts[hex] = { want: { gold: 4 }, reward: { wood: 2 }, done: false };
    stand(s, hex);
    s.kingdom!.gold.dawn = 3;
    expect(() => applyAction(s, { type: 'hutDeliver' })).toThrow(/Za mało złota/);
    s.kingdom!.gold.dawn = 10;
    const wood = resOf(s, 'dawn').wood;
    s = applyAction(s, { type: 'hutDeliver' });
    expect(s.kingdom!.gold.dawn).toBe(6);
    expect(resOf(s, 'dawn').wood).toBe(wood + 2);
    expect(() => applyAction(s, { type: 'hutDeliver' })).toThrow(/już/);
  });

  it('wants an artifact from the backpack and gives experience', () => {
    let s = economy();
    const hex = Object.keys(s.kingdom!.huts!)[0];
    s.kingdom!.huts![hex] = { want: { artifact: true }, reward: { xp: 3 }, done: false };
    stand(s, hex);
    expect(() => applyAction(s, { type: 'hutDeliver' })).toThrow(/plecak/);
    const hero = activeHero(s)!;
    s.heroes[hero.id].pack = [ARTIFACTS.find((a) => !a.set)!.id];
    const xp = s.heroes[hero.id].xp ?? 0;
    s = applyAction(s, { type: 'hutDeliver' });
    expect(s.heroes[hero.id].pack).toHaveLength(0);
    expect((s.heroes[hero.id].xp ?? 0) + (s.heroes[hero.id].level ?? 1) * 100).toBeGreaterThan(xp);
  });
});

describe('level 4: the forge and the exchange', () => {
  it('keeps the building tree: each building waits for its one parent (docs/BUDYNKI.md 0a), upgrades are never blocked', () => {
    const s = economy();
    const home = ownStart(s);
    home.buildings.barracks = 0;
    home.buildings.market = 0;
    for (const [b, parent] of [['hospital', 'Koszary'], ['forge', 'Koszary'], ['walls', 'Koszary'], ['magic', 'Szpital'], ['tavern', 'Targ']] as const) expect(buildBlock(home, b)).toBe(`Najpierw: ${parent}.`);
    for (const b of ['barracks', 'market', 'treasury', 'spark'] as const) expect(buildBlock(home, b)).toBeNull();
    home.buildings.barracks = 1;
    expect(buildBlock(home, 'hospital')).toBeNull();
    expect(buildBlock(home, 'magic')).toBe('Najpierw: Szpital.');
    home.buildings.hospital = 1;
    expect(buildBlock(home, 'magic')).toBeNull();
    home.buildings.forge = 1;
    home.buildings.barracks = 0;
    expect(buildBlock(home, 'forge')).toBeNull();
  });

  it('builds a forge for ore; the faction\'s supports then fight with more Atak, and with more Życie after the upgrade', () => {
    let s = economy();
    const home = ownStart(s);
    expect(buildingsOf(s)).toContain('forge');
    s.kingdom!.gold.dawn = 40;
    s.kingdom!.res!.dawn = { wood: 0, ore: 6, dust: 2 };
    // The forge needs the barracks first (docs/BUDYNKI.md 0a).
    expect(() => applyAction(s, { type: 'kingdomBuild', settlementId: home.id, building: 'forge' })).toThrow('Najpierw: Koszary');
    home.buildings.barracks = 1;
    s = applyAction(s, { type: 'kingdomBuild', settlementId: home.id, building: 'forge' });
    expect(forgeLevel(s, 'dawn')).toBe(1);
    expect(resOf(s, 'dawn').ore).toBe(3);
    const support = s.factions.dawn.supportsAlive[0];
    const scale = s.rules.statScale ?? 1;
    const hpScale = s.rules.hpScale ?? scale;
    const unitOf = (g: GameState) => {
      const c = structuredClone(g);
      const guardian = Object.values(c.crystals).find((x) => x.guardian && c.tiles[x.at])!;
      const from = Object.values(c.tiles).find((t) => t.key !== guardian.at && !t.crystalId && !t.home && neighbours(c, guardian.at).includes(t.key))!;
      const hero = activeHero(c)!;
      c.heroes[hero.id].pos = from.key;
      c.tiles[guardian.at].revealed = true;
      c.movePoints = 9;
      let after = applyAction(c, { type: 'moveHero', to: guardian.at });
      if (after.battle!.stage === 'select') after = applyAction(after, { type: 'selectSupports', faction: 'dawn', supportIds: after.factions.dawn.supportsAlive.slice(0, 2) });
      return after.battle!.units[support];
    };
    const plain = unitOf(economy());
    const armed = unitOf(s);
    expect(armed.status.battleAttackBonus - plain.status.battleAttackBonus).toBe(ECONOMY.forgeAttack * scale);
    expect(armed.maxHp).toBe(plain.maxHp);
    const round = s.round;
    while (s.round === round) s = applyAction(s, { type: 'endTurn' });
    s = applyAction(s, { type: 'kingdomBuild', settlementId: home.id, building: 'forge' });
    expect(forgeLevel(s, 'dawn')).toBe(2);
    expect(unitOf(s).maxHp - plain.maxHp).toBe(ECONOMY.forgeHp * hpScale);
    expect(buildCost(s, ownStart(s), 'forge')).toBeNull();
  });

  it('has no forge in level 3', () => {
    const s = createGame(setup({ mapSize: 'medium', seed: 3 }, { ruleset: 'digital', heroGrowth: true, kingdom: true }));
    expect(buildingsOf(s)).not.toContain('forge');
    expect(buildCost(s, ownStart(s), 'forge')).toBeNull();
    expect(() => applyAction(s, { type: 'kingdomTrade', settlementId: ownStart(s).id, res: 'wood', dir: 'buy' })).toThrow(/Księstwo/);
  });

  it('sells a resource for gold anywhere at home (cheaper with a market) and buys surplus back only on a market', () => {
    let s = economy();
    const home = ownStart(s);
    s.kingdom!.gold.dawn = 20;
    expect(tradeBuyPrice(home, 'ore')).toBe(ECONOMY.tradeBuy.ore[0]);
    s = applyAction(s, { type: 'kingdomTrade', settlementId: home.id, res: 'ore', dir: 'buy' });
    expect(s.kingdom!.gold.dawn).toBe(20 - ECONOMY.tradeBuy.ore[0]);
    expect(resOf(s, 'dawn').ore).toBe(1);
    expect(() => applyAction(s, { type: 'kingdomTrade', settlementId: home.id, res: 'ore', dir: 'sell' })).toThrow(/targu/);
    ownStart(s).buildings.market = 1;
    expect(tradeBuyPrice(ownStart(s), 'ore')).toBe(ECONOMY.tradeBuy.ore[1]);
    s = applyAction(s, { type: 'kingdomTrade', settlementId: home.id, res: 'ore', dir: 'sell' });
    expect(resOf(s, 'dawn').ore).toBe(0);
    expect(() => applyAction(s, { type: 'kingdomTrade', settlementId: home.id, res: 'ore', dir: 'sell' })).toThrow(/Brakuje/);
    s.kingdom!.gold.dawn = 0;
    expect(() => applyAction(s, { type: 'kingdomTrade', settlementId: home.id, res: 'dust', dir: 'buy' })).toThrow(/Za mało złota/);
  });

  it('swaps one resource for another on a market: sale and purchase in one action, at the market prices', () => {
    let s = economy();
    const home = ownStart(s);
    s.kingdom!.gold.dawn = 10;
    s.kingdom!.res!.dawn.wood = 2;
    expect(() => applyAction(s, { type: 'kingdomSwap', settlementId: home.id, from: 'wood', to: 'ore' })).toThrow(/targu/);
    home.buildings.market = 1;
    expect(() => applyAction(s, { type: 'kingdomSwap', settlementId: home.id, from: 'wood', to: 'wood' })).toThrow(/różne/);
    const price = tradeBuyPrice(ownStart(s), 'ore') - ECONOMY.tradeSell.wood;
    s = applyAction(s, { type: 'kingdomSwap', settlementId: home.id, from: 'wood', to: 'ore' });
    expect([resOf(s, 'dawn').wood, resOf(s, 'dawn').ore, s.kingdom!.gold.dawn]).toEqual([1, 1, 10 - price]);
    s.kingdom!.gold.dawn = 0;
    expect(() => applyAction(s, { type: 'kingdomSwap', settlementId: home.id, from: 'wood', to: 'dust' })).toThrow(/Za mało złota/);
    s.kingdom!.res!.dawn.ore = 0;
    expect(() => applyAction(s, { type: 'kingdomSwap', settlementId: home.id, from: 'ore', to: 'wood' })).toThrow(/Brakuje/);
  });

  it('a bot short of one resource for the building it wants buys it instead of sitting on gold', () => {
    const s = economy();
    const home = ownStart(s);
    s.kingdom!.gold.dawn = 30;
    s.kingdom!.res!.dawn = { wood: 0, ore: 0, dust: 0 };
    expect(botPurchase(s, 'dawn', home)).toEqual({ type: 'kingdomTrade', settlementId: home.id, res: 'wood', dir: 'buy' });
    s.kingdom!.gold.dawn = 4;
    expect(botPurchase(s, 'dawn', home)).toBeNull();
  });

  it('scores a little more than level 3', () => {
    const l3 = setup({ mapSize: 'veryLong' }, { ruleset: 'digital', heroGrowth: true, kingdom: true });
    const l4 = setup({ mapSize: 'veryLong' }, rules);
    expect(pointsFor(l4, 'normal', 'dawn')).toBeGreaterThan(pointsFor(l3, 'normal', 'dawn'));
  });
});

describe('level 4: mills, stores and wells', () => {
  const walkIn = (s: GameState, hex: string): GameState => {
    const from = neighbours(s, hex).find((k) => !s.tiles[k].crystalId && !s.tiles[k].place && !s.tiles[k].home)!;
    stand(s, from);
    s.tiles[hex].revealed = true;
    s.movePoints = 9;
    return applyAction(s, { type: 'moveHero', to: hex });
  };
  const find = (s: GameState, kind: string) => Object.entries(s.kingdom!.objects!).find(([, o]) => o.kind === kind)![0];

  it('puts objects on the map by map size, of every kind on a long map', () => {
    const s = economy({ mapSize: 'long' });
    const objects = Object.values(s.kingdom!.objects!);
    expect(objects).toHaveLength(OBJECTS.count.long);
    expect(new Set(objects.map((o) => o.kind))).toEqual(new Set(['mill', 'store', 'well']));
    const l3 = createGame(setup({ mapSize: 'long', seed: 3 }, { ruleset: 'digital', heroGrowth: true, kingdom: true }));
    expect(l3.kingdom!.objects).toBeUndefined();
  });

  it('a mill pays gold and then grinds for a few rounds', () => {
    let s = economy({ mapSize: 'long' });
    const mill = find(s, 'mill');
    const gold = s.kingdom!.gold.dawn;
    s = walkIn(s, mill);
    expect(s.kingdom!.gold.dawn).toBe(gold + OBJECTS.millGold);
    // Stepping out and in again in the same round gives nothing.
    s = walkIn(s, mill);
    expect(s.kingdom!.gold.dawn).toBe(gold + OBJECTS.millGold);
    s.round += OBJECTS.millRounds;
    s = walkIn(s, mill);
    expect(s.kingdom!.gold.dawn).toBe(gold + 2 * OBJECTS.millGold);
  });

  it('a store gives its resource once and a well gives movement once a round', () => {
    let s = economy({ mapSize: 'long' });
    const store = find(s, 'store');
    const o = s.kingdom!.objects![store];
    const before = resOf(s, 'dawn')[o.res!];
    s = walkIn(s, store);
    expect(resOf(s, 'dawn')[o.res!]).toBe(before + o.amount!);
    s = walkIn(s, store);
    expect(resOf(s, 'dawn')[o.res!]).toBe(before + o.amount!);
    const well = find(s, 'well');
    s = walkIn(s, well);
    const left = s.movePoints;
    s = walkIn(s, well);
    // The first visit added the well's points on top of what the step cost; the second one only costs.
    expect(left).toBeGreaterThan(s.movePoints);
    expect(s.kingdom!.objects![well].used).toBe(s.round);
  });
});

describe('family mode: the autopilot of the layers', () => {
  const family = (adult: boolean): GameState => {
    const s = createGame(setup({ mapSize: 'medium', seed: 3, seats: [
      { name: 'Dziecko', faction: 'dawn', controller: 'human', heroId: 'goldDragon', child: true },
      { name: 'Rodzic', faction: 'dawn', controller: adult ? 'human' : 'bot', heroId: 'unicornKing' },
    ] }, rules));
    s.kingdom!.gold.dawn = 30;
    s.kingdom!.res!.dawn = { wood: 9, ore: 9, dust: 9 };
    return s;
  };

  it('runs the whole economy for a child who plays without an adult', () => {
    const s = family(false);
    const hero = activeHero(s)!;
    expect(hasParent(s, hero)).toBe(false);
    expect(autopilotAction(s, hero)?.type).toMatch(/^kingdom/);
  });

  it('leaves the shared gold and resources to the adult of the same faction, and still opens the child\'s chest', () => {
    const s = family(true);
    const hero = activeHero(s)!;
    expect(hasParent(s, hero)).toBe(true);
    expect(autopilotAction(s, hero)).toBeNull();
    s.kingdom!.chest = { heroId: hero.id };
    expect(autopilotAction(s, hero)).toEqual({ type: 'chestTake', what: 'artifact' });
    // The adult's own hero is never on autopilot.
    expect(autopilotAction(s, s.heroes.unicornKing)).toBeNull();
  });
});
