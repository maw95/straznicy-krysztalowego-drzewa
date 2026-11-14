// Level 3 "Królestwo": gold, settlements, mines, the market, the hospital, recruitment, the chest choice, and bots that play it to the end.

import { describe, expect, it } from 'vitest';
import { activeHero, applyAction, createGame } from '../src/engine/game';
import { goldOf, incomeOf, KINGDOM, marketStock, settlementAt, settlementsOf, teamSlots } from '../src/engine/kingdom';
import type { GameState, SetupOptions } from '../src/engine/types';
import { playOut, pvpSeats, setup } from './helpers/engine';

const rules = { ruleset: 'digital', heroGrowth: true, kingdom: true } as const;
const kingdom = (over: Partial<SetupOptions> = {}): GameState => createGame(setup({ mapSize: 'medium', seed: 3, ...over }, rules));
/** The active hero put on a hex (as if it had walked there), then the arrival rules run through a real move of a neighbour... simply by moving next to it first. */
const stand = (s: GameState, hex: string) => {
  const hero = activeHero(s)!;
  s.heroes[hero.id].pos = hex;
  s.movePoints = 3;
  return s.heroes[hero.id];
};
const ownStart = (s: GameState) => settlementAt(s, Object.values(s.tiles).find((t) => t.home === 'dawn')!.key)!;

describe('level 3: the map and the start', () => {
  it('has a settlement on each base, neutral ones to conquer with defenders on both sides, gold mines and 2 gold each', () => {
    const s = kingdom({ mapSize: 'long' });
    const all = Object.values(s.kingdom!.settlements);
    expect(all.filter((x) => x.id.startsWith('start-')).map((x) => x.owner).sort()).toEqual(['dawn', 'horde']);
    const neutral = all.filter((x) => x.owner === null);
    expect(neutral).toHaveLength(KINGDOM.settlements.long);
    expect(neutral.filter((x) => x.land === 'dawn')).toHaveLength(KINGDOM.settlements.long / 2);
    for (const n of neutral) expect(s.tiles[n.at].crystalId).not.toBeNull();
    expect(new Set(all.map((x) => x.name)).size).toBe(all.length);
    expect(Object.keys(s.kingdom!.mines)).toHaveLength(KINGDOM.mines.long);
    expect(s.kingdom!.gold).toEqual({ dawn: KINGDOM.startGold, horde: KINGDOM.startGold });
    expect(s.factions.dawn.supportsAlive).toHaveLength(3);
    expect(teamSlots(s, 'dawn')).toBe(2);
  });

  it('does not exist in the other levels', () => {
    expect(createGame(setup({ mapSize: 'medium' }, { ruleset: 'digital', heroGrowth: true })).kingdom).toBeUndefined();
  });
});

describe('level 3: income, mines and capture', () => {
  it('a mine passes to the hero who steps on it, and income comes at the end of the round', () => {
    let s = kingdom();
    const mine = Object.keys(s.kingdom!.mines)[0];
    // Walk next to the mine through a real move: put the hero on a neighbour first.
    const hero = activeHero(s)!;
    const [q, r] = mine.split(',').map(Number);
    const next = [`${q + 1},${r}`, `${q - 1},${r}`, `${q},${r + 1}`, `${q},${r - 1}`].find((k) => s.tiles[k] && !s.tiles[k].crystalId)!;
    s.heroes[hero.id].pos = next;
    s.movePoints = 3;
    s.tiles[mine].revealed = true;
    s = applyAction(s, { type: 'moveHero', to: mine });
    expect(s.kingdom!.mines[mine].owner).toBe('dawn');
    expect(incomeOf(s, 'dawn')).toBe(KINGDOM.incomeSettlement + KINGDOM.incomeMine);
    const before = goldOf(s, 'dawn');
    const round = s.round;
    while (s.round === round) s = applyAction(s, { type: 'endTurn' });
    expect(goldOf(s, 'dawn')).toBe(before + KINGDOM.incomeSettlement + KINGDOM.incomeMine);
  });
});

describe('level 3: services of a settlement', () => {
  it('builds, recruits, buys at the market and heals for the right prices, only for the faction that owns the settlement', () => {
    let s = kingdom();
    const home = ownStart(s);
    stand(s, home.at);
    s.kingdom!.gold.dawn = 40;
    // The three tier-1 supports are there from the start; recruiting is for the units still to come, so one is taken away to have something to hire.
    s.factions.dawn.supportsAlive = ['elfDruid'];
    const act = (a: Parameters<typeof applyAction>[1]) => (s = applyAction(s, a));
    // Nothing without the buildings.
    expect(() => act({ type: 'kingdomRecruit', settlementId: home.id, unitId: 'nymph' })).toThrow(/koszary/);
    act({ type: 'kingdomBuild', settlementId: home.id, building: 'barracks' });
    expect(goldOf(s, 'dawn')).toBe(40 - KINGDOM.cost.barracks[0]);
    const missing = ['elfDruid', 'nymph', 'pegasus'].find((id) => !s.factions.dawn.supportsAlive.includes(id))!;
    act({ type: 'kingdomRecruit', settlementId: home.id, unitId: missing });
    expect(s.factions.dawn.supportsAlive).toContain(missing);
    expect(() => act({ type: 'kingdomRecruit', settlementId: home.id, unitId: missing })).toThrow(/już w twojej/);
    // The market: three offers, a bought one disappears from the offer.
    act({ type: 'kingdomBuild', settlementId: home.id, building: 'market' });
    const stock = marketStock(s, settlementAt(s, home.at)!);
    expect(stock).toHaveLength(3);
    const gold = goldOf(s, 'dawn');
    act({ type: 'kingdomBuyArtifact', settlementId: home.id, artifactId: stock[0] });
    expect(goldOf(s, 'dawn')).toBeLessThan(gold);
    expect(marketStock(s, settlementAt(s, home.at)!)).toEqual(stock.slice(1));
    expect(() => act({ type: 'kingdomBuyArtifact', settlementId: home.id, artifactId: stock[0] })).toThrow(/ofercie/);
    act({ type: 'kingdomBuild', settlementId: home.id, building: 'market' });
    expect(marketStock(s, settlementAt(s, home.at)!).length).toBeGreaterThanOrEqual(4);
    // The hospital: a fallen support comes back for half its price (at least 1), a third once upgraded.
    s.factions.dawn.supportsAlive = s.factions.dawn.supportsAlive.filter((id) => id !== missing);
    s.factions.dawn.supportsDead = [missing];
    expect(() => act({ type: 'kingdomHeal', settlementId: home.id, unitId: missing })).toThrow(/szpitala/);
    act({ type: 'kingdomBuild', settlementId: home.id, building: 'hospital' });
    const g2 = goldOf(s, 'dawn');
    act({ type: 'kingdomHeal', settlementId: home.id, unitId: missing });
    expect(g2 - goldOf(s, 'dawn')).toBe(1);
    expect(s.factions.dawn.supportsAlive).toContain(missing);
    // Poor: refused.
    s.kingdom!.gold.dawn = 0;
    expect(() => act({ type: 'kingdomBuild', settlementId: home.id, building: 'treasury' })).toThrow(/Za mało złota/);
    // Away from the settlement: shopping needs no walk (author, 14.11).
    const other = Object.values(s.tiles).find((t) => !t.place && !t.crystalId && t.key !== home.at && t.terrain !== 'bridge')!;
    s.kingdom!.gold.dawn = 40;
    stand(s, other.key);
    const before = goldOf(s, 'dawn');
    act({ type: 'kingdomBuild', settlementId: home.id, building: 'treasury' });
    expect(goldOf(s, 'dawn')).toBeLessThan(before);
    // A settlement of another faction's hand is still refused.
    const foreign = Object.values(s.kingdom!.settlements).find((x) => x.owner !== 'dawn')!;
    expect(() => act({ type: 'kingdomBuild', settlementId: foreign.id, building: 'market' })).toThrow(/nie należy/);
  });

  it('a captured foreign settlement gives income, but its barracks do not recruit for the captor', () => {
    let s = kingdom();
    const foreign = Object.values(s.kingdom!.settlements).find((x) => x.owner === null && x.land === 'horde')!;
    s.tiles[foreign.at].crystalId = null;
    delete s.crystals[Object.keys(s.crystals).find((id) => s.crystals[id].at === foreign.at)!];
    stand(s, foreign.at);
    // Arrive through the engine: a step from a neighbour.
    const hero = activeHero(s)!;
    const [q, r] = foreign.at.split(',').map(Number);
    const next = [`${q + 1},${r}`, `${q - 1},${r}`, `${q},${r + 1}`, `${q},${r - 1}`].find((k) => s.tiles[k] && !s.tiles[k].crystalId && !s.tiles[k].place)!;
    s.heroes[hero.id].pos = next;
    s.tiles[foreign.at].revealed = true;
    s = applyAction(s, { type: 'moveHero', to: foreign.at });
    expect(settlementsOf(s, 'dawn').map((x) => x.id)).toContain(foreign.id);
    expect(incomeOf(s, 'dawn')).toBe(KINGDOM.incomeSettlement + KINGDOM.incomeSettlement);
    s.kingdom!.settlements[foreign.id].buildings.barracks = 1;
    s.kingdom!.gold.dawn = 20;
    expect(() => (s = applyAction(s, { type: 'kingdomRecruit', settlementId: foreign.id, unitId: 'nymph' }))).toThrow(/rekrutować/);
  });
});

describe('level 3: the chest and the team', () => {
  it('a chest asks for a choice first: nothing else works meanwhile; gold or an artifact', () => {
    let s = kingdom();
    s.kingdom!.chest = { heroId: activeHero(s)!.id };
    expect(() => applyAction(s, { type: 'endTurn' })).toThrow(/skrzyni/);
    const gold = goldOf(s, 'dawn');
    s = applyAction(s, { type: 'chestTake', what: 'gold' });
    expect(goldOf(s, 'dawn')).toBe(gold + KINGDOM.chestGold);
    expect(s.kingdom!.chest).toBeNull();
    s.kingdom!.chest = { heroId: activeHero(s)!.id };
    s = applyAction(s, { type: 'chestTake', what: 'artifact' });
    expect(s.log.some((l) => l.event?.type === 'artifact')).toBe(true);
  });

  it('the team grows with the hero level and upgraded barracks, up to five', () => {
    const s = kingdom();
    const hero = activeHero(s)!;
    s.heroes[hero.id].level = 3;
    expect(teamSlots(s, 'dawn')).toBe(3);
    s.heroes[hero.id].level = 6;
    expect(teamSlots(s, 'dawn')).toBe(4);
    ownStart(s).buildings.barracks = 2;
    expect(teamSlots(s, 'dawn')).toBe(5);
  });
});

describe('level 3: bots', () => {
  it('play whole games on several maps, in coop and in rivalry, and spend gold', () => {
    let spent = 0;
    for (const [mode, size, seed] of [['coop', 'short', 1], ['coop', 'medium', 2], ['pvp', 'medium', 3], ['pvp', 'long', 4]] as const) {
      const base = setup({ mode, mapSize: size, seed, ...(mode === 'pvp' ? { seats: pvpSeats('goldDragon', 'blackDragon') } : {}) }, rules);
      const end = playOut(createGame(base), 30000);
      expect(end.phase).toBe('over');
      spent += end.log.filter((l) => /rekrutuje|Targ|Koszary|artefakt|Szpital|Skarbiec|dochód/.test(l.text)).length;
    }
    expect(spent).toBeGreaterThan(0);
  }, 120_000);
});
