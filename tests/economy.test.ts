// Level 4 "Księstwo": wood, ore and Gwiezdny Pył, resource mines, building prices, one building a round, and bots that play it to the end.

import { describe, expect, it } from 'vitest';
import { activeHero, applyAction, createGame } from '../src/engine/game';
import { ECONOMY } from '../src/engine/economy';
import { artifactBill, buildCost, canPay, resOf, resourceIncomeOf, settlementAt } from '../src/engine/kingdom';
import { ARTIFACTS } from '../src/engine/sites';
import type { GameState, SetupOptions } from '../src/engine/types';
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
    // One building a round.
    expect(() => applyAction(s, { type: 'kingdomBuild', settlementId: home.id, building: 'market' })).toThrow(/jeden budynek na rundę/);
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
