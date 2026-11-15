// Level 5 "Królestwo": the second hero. A commander is hired in a tavern, moves and fights as a hero of its player, and can be bought back when it falls.

import { describe, expect, it } from 'vitest';
import { activeHero, applyAction, createGame, computeTurnOrder } from '../src/engine/game';
import { buildingsOf, settlementAt } from '../src/engine/kingdom';
import { COMMANDERS, commanderOf, freeCommanders, mayRansom, ransomPrice, REALM } from '../src/engine/realm';
import { ARTIFACTS } from '../src/engine/sites';
import { tileCost } from '../src/engine/map';
import { chooseAction } from '../src/engine/ai';
import type { GameState } from '../src/engine/types';
import { playOut, pvpSeats, setup } from './helpers/engine';

const rules = { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true } as const;
const game = (): GameState => {
  const s = createGame(setup({ mode: 'pvp', mapSize: 'medium', seed: 3, seats: pvpSeats('goldDragon', 'werewolfLord') }, rules));
  s.kingdom!.gold.dawn = 40;
  home(s).buildings.tavern = 1;
  return s;
};
const home = (s: GameState) => settlementAt(s, Object.values(s.tiles).find((t) => t.home === 'dawn')!.key)!;
/** Ends the active hero's turn; a skill or a treasure waiting for a choice is picked the way a bot would. */
const pass = (s: GameState): GameState => {
  const h = activeHero(s)!;
  return applyAction(s, h.offer || h.treasurePick || s.kingdom?.chest ? chooseAction(s)! : { type: 'endTurn' });
};
const endRound = (s: GameState): GameState => {
  const round = s.round;
  while (s.phase !== 'over' && s.round === round) s = pass(s);
  return s;
};

describe('level 5: the tavern and the commander', () => {
  it('has a tavern only in level 5', () => {
    expect(buildingsOf(game())).toContain('tavern');
    const l4 = createGame(setup({ mapSize: 'medium', seed: 3 }, { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true }));
    expect(buildingsOf(l4)).not.toContain('tavern');
    expect(() => applyAction(l4, { type: 'kingdomHire', settlementId: home(l4).id, unitId: COMMANDERS.dawn.warrior })).toThrow(/Królestwo/);
  });

  it('hires one commander per player for gold: a second hero with a name, on the map, moving from the next round', () => {
    let s = game();
    expect(freeCommanders(s, 'dawn')).toHaveLength(3);
    s = applyAction(s, { type: 'kingdomHire', settlementId: home(s).id, unitId: COMMANDERS.dawn.archer });
    const c = commanderOf(s, 'p1')!;
    expect(c.id).toBe('dawnHuntress');
    expect(c.secondary).toBe(true);
    expect(c.name).toBeTruthy();
    expect(c.pos).toBe(home(s).at);
    expect(s.kingdom!.gold.dawn).toBe(40 - REALM.hireGold);
    expect(freeCommanders(s, 'dawn')).not.toContain('dawnHuntress');
    expect(() => applyAction(s, { type: 'kingdomHire', settlementId: home(s).id, unitId: COMMANDERS.dawn.sage })).toThrow(/jednego/);
    expect(s.turnOrder).not.toContain(c.id);
    s = endRound(s);
    expect(s.turnOrder).toContain('dawnHuntress');
    expect(computeTurnOrder(s).filter((id) => s.heroes[id].playerId === 'p1')).toHaveLength(2);
    // Its turn comes and it is its player's to move.
    while (activeHero(s)!.id !== 'dawnHuntress') s = pass(s);
    expect(activeHero(s)!.playerId).toBe('p1');
  });

  it('needs a tavern and the gold', () => {
    const s = game();
    home(s).buildings.tavern = 0;
    expect(() => applyAction(s, { type: 'kingdomHire', settlementId: home(s).id, unitId: COMMANDERS.dawn.warrior })).toThrow(/karczmy/);
    home(s).buildings.tavern = 1;
    s.kingdom!.gold.dawn = 1;
    expect(() => applyAction(s, { type: 'kingdomHire', settlementId: home(s).id, unitId: COMMANDERS.dawn.warrior })).toThrow(/Za mało złota/);
  });
});

describe('level 5: a fallen commander', () => {
  /** A commander that has just fallen in a battle with the Horde's hero (the engine's own aftermath: the battle is set up and its units killed by hand). */
  const fallen = (): GameState => {
    let s = game();
    s = applyAction(s, { type: 'kingdomHire', settlementId: home(s).id, unitId: COMMANDERS.dawn.warrior });
    s = endRound(s);
    while (activeHero(s)!.id !== 'dawnKnight') s = pass(s);
    const c = s.heroes.dawnKnight;
    c.gear = { [ARTIFACTS[0].slot]: ARTIFACTS[0].id };
    const foe = s.heroes.werewolfLord;
    const spot = Object.keys(s.tiles).find((k) => !s.tiles[k].home && !s.tiles[k].crystalId && !s.tiles[k].place && tileCost(s.tiles[k]) !== null)!;
    foe.pos = spot;
    s.tiles[spot].revealed = true;
    const from = Object.keys(s.tiles).find((k) => {
      const [q1, r1] = k.split(',').map(Number);
      const [q2, r2] = spot.split(',').map(Number);
      return k !== spot && Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(q1 + r1 - q2 - r2)) === 1 && !s.tiles[k].crystalId && !s.tiles[k].home;
    })!;
    c.pos = from;
    s.tiles[from].revealed = true;
    s.movePoints = 9;
    s = applyAction(s, { type: 'moveHero', to: spot });
    expect(s.phase).toBe('battle');
    for (const u of Object.values(s.battle!.units)) if (u.side === 'dawn') u.hp = 1;
    for (let i = 0; i < 3000 && s.phase === 'battle'; i++) {
      const b = s.battle!;
      if (b.stage === 'fight') for (const u of Object.values(b.units)) if (u.side === 'dawn' && u.alive) u.hp = 1;
      s = applyAction(s, (awaitBot(s)));
    }
    return s;
  };

  it('keeps its level, loses its artifacts to the winner and can be bought back a round later', () => {
    let s = fallen();
    const c = s.heroes.dawnKnight;
    expect(c.alive).toBe(false);
    expect(c.fallen).toBeLessThanOrEqual(s.round);
    expect(c.gear).toEqual({});
    // The winner took the artifact.
    const foe = s.heroes.werewolfLord;
    expect([...Object.values(foe.gear ?? {}), ...(foe.pack ?? [])]).toContain(ARTIFACTS[0].id);
    expect(s.phase).not.toBe('over');
    s = endRound(s);
    expect(mayRansom(s, s.heroes.dawnKnight)).toBe(true);
    while (activeHero(s)!.faction !== 'dawn') s = pass(s);
    const gold = s.kingdom!.gold.dawn;
    s = applyAction(s, { type: 'kingdomRansom', settlementId: home(s).id, heroId: 'dawnKnight' });
    expect(s.heroes.dawnKnight.alive).toBe(true);
    expect(s.kingdom!.gold.dawn).toBe(gold - ransomPrice(c));
    expect(s.heroes.dawnKnight.pos).toBe(home(s).at);
  });

  it('cannot be bought back once the main hero is dead', () => {
    const s = endRound(fallen());
    s.heroes.goldDragon.alive = false;
    expect(mayRansom(s, s.heroes.dawnKnight)).toBe(false);
  });
});

describe('level 5: bots', () => {
  it('build a tavern, hire a commander and play whole games to the end', () => {
    let hired = 0;
    for (const seed of [2, 5, 8]) {
      const s = playOut(createGame(setup({ mode: 'pvp', mapSize: 'long', seed, seats: pvpSeats('goldDragon', 'werewolfLord') }, rules)));
      expect(s.phase).toBe('over');
      hired += Object.values(s.heroes).filter((h) => h.secondary).length;
    }
    expect(hired).toBeGreaterThan(0);
  });
});

function awaitBot(s: GameState) {
  return chooseAction(s)!;
}
