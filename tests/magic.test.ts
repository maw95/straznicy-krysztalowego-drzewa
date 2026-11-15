// Level 5 "Królestwo": magic. Mana, the mage tower, spells in a battle (the hero's unit, once per activation) and on the map.

import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { activeHero, applyAction, createGame } from '../src/engine/game';
import { buildingsOf, settlementAt, spellPrice } from '../src/engine/kingdom';
import { botSpell, castableInBattle, MAGIC, manaOf, maxMana, SPELLS, spellPower, towerSpells } from '../src/engine/magic';
import { mapNeighbors, tileCost } from '../src/engine/map';
import type { GameState } from '../src/engine/types';
import { playOut, pvpSeats, setup } from './helpers/engine';

const rules = { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true } as const;
const game = (): GameState => {
  const s = createGame(setup({ mode: 'pvp', mapSize: 'medium', seed: 3, seats: pvpSeats('goldDragon', 'werewolfLord') }, rules));
  s.kingdom!.gold.dawn = 60;
  s.kingdom!.res!.dawn = { wood: 9, ore: 9, dust: 9 };
  return s;
};
const home = (s: GameState) => settlementAt(s, Object.values(s.tiles).find((t) => t.home === 'dawn')!.key)!;

/** The Przymierza's hero, knowing `spells`, in a fight with the Horde's hero, at its own activation. */
function battle(spells: Array<keyof typeof SPELLS>): GameState {
  let s = game();
  const hero = activeHero(s)!;
  s.heroes[hero.id].spells = [...spells];
  const foe = s.heroes.werewolfLord;
  const spot = Object.keys(s.tiles).find((k) => !s.tiles[k].home && !s.tiles[k].crystalId && !s.tiles[k].place && tileCost(s.tiles[k]) !== null && mapNeighbors(s.tiles, k).some((n) => tileCost(s.tiles[n]) !== null && !s.tiles[n].crystalId && !s.tiles[n].home))!;
  const from = mapNeighbors(s.tiles, spot).find((n) => tileCost(s.tiles[n]) !== null && !s.tiles[n].crystalId && !s.tiles[n].home)!;
  foe.pos = spot;
  s.heroes[hero.id].pos = from;
  s.tiles[spot].revealed = s.tiles[from].revealed = true;
  s.movePoints = 9;
  s = applyAction(s, { type: 'moveHero', to: spot });
  for (let i = 0; i < 12 && s.battle!.stage !== 'fight'; i++) s = applyAction(s, chooseAction(s)!);
  for (let i = 0; i < 40 && s.battle!.activation!.unitId !== hero.id; i++) s = applyAction(s, { type: 'endActivation' });
  return s;
}

describe('level 5: mana and the mage tower', () => {
  it('teaches the spells of its circle for gold (and dust for circle II), to the hero whose turn it is', () => {
    let s = game();
    expect(buildingsOf(s)).toContain('magic');
    expect(() => applyAction(s, { type: 'kingdomLearn', settlementId: home(s).id, spell: 'bolt' })).toThrow(/wieża maga/);
    home(s).buildings.magic = 1;
    expect(towerSpells(1)).toEqual(['bolt', 'mend', 'slow', 'vision']);
    expect(towerSpells(2)).toHaveLength(8);
    expect(activeHero(s)!.spells).toEqual(['bolt']);
    expect(() => applyAction(s, { type: 'kingdomLearn', settlementId: home(s).id, spell: 'bolt' })).toThrow(/zna już/);
    s = applyAction(s, { type: 'kingdomLearn', settlementId: home(s).id, spell: 'mend' });
    expect(activeHero(s)!.spells).toEqual(['bolt', 'mend']);
    expect(s.kingdom!.gold.dawn).toBe(60 - spellPrice('mend').gold);
    expect(() => applyAction(s, { type: 'kingdomLearn', settlementId: home(s).id, spell: 'fireball' })).toThrow(/wieża maga/);
    home(s).buildings.magic = 2;
    s = applyAction(s, { type: 'kingdomLearn', settlementId: home(s).id, spell: 'fireball' });
    expect(s.kingdom!.res!.dawn.dust).toBe(9 - 1);
  });

  it('gives a hero mana by its level, more to a sage, and a sage casts stronger', () => {
    const s = game();
    const hero = activeHero(s)!;
    expect(maxMana(hero)).toBe(MAGIC.manaBase + MAGIC.manaPerLevel);
    expect(manaOf(hero)).toBe(maxMana(hero));
    const sage = { ...hero, id: 'dawnSage' };
    expect(maxMana(sage)).toBe(maxMana(hero) + MAGIC.sageMana);
    expect(spellPower(sage)).toBe(spellPower(hero) + 1);
  });

  it('is not there in level 4', () => {
    const l4 = createGame(setup({ mapSize: 'medium', seed: 3 }, { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true }));
    expect(buildingsOf(l4)).not.toContain('magic');
    activeHero(l4)!.spells = ['vision'];
    expect(() => applyAction(l4, { type: 'mapSpell', spell: 'vision' })).toThrow(/Królestwo/);
  });
});

describe('level 5: spells in a battle', () => {
  it('a bolt hurts an enemy anywhere, costs mana, and only one spell goes in an activation', () => {
    let s = battle(['bolt', 'slow']);
    const hero = s.heroes.goldDragon;
    expect(castableInBattle(s)).toEqual(['bolt', 'slow']);
    const foe = s.battle!.units.werewolfLord;
    const hp = foe.hp;
    const mana = manaOf(hero);
    s = applyAction(s, { type: 'battleSpell', spell: 'bolt', targetId: 'werewolfLord' });
    expect(s.battle!.units.werewolfLord.hp).toBe(hp - MAGIC.boltDamage * (s.rules.statScale ?? 1));
    expect(manaOf(s.heroes.goldDragon)).toBe(mana - SPELLS.bolt.mana);
    expect(castableInBattle(s)).toEqual([]);
    expect(() => applyAction(s, { type: 'battleSpell', spell: 'slow', targetId: 'werewolfLord' })).toThrow(/już czarował/);
    // The hero still moves and attacks after the spell.
    expect(s.battle!.activation!.unitId).toBe('goldDragon');
  });

  it('needs a proper target and enough mana', () => {
    const s = battle(['bolt', 'mend']);
    expect(() => applyAction(s, { type: 'battleSpell', spell: 'bolt', targetId: 'goldDragon' })).toThrow(/cel/);
    s.heroes.goldDragon.mana = 1;
    expect(() => applyAction(s, { type: 'battleSpell', spell: 'bolt', targetId: 'werewolfLord' })).toThrow(/many/);
  });

  it('healing, stone skin, slow and haste do what they say', () => {
    let s = battle(['mend', 'stoneskin', 'slow', 'haste']);
    s.heroes.goldDragon.mana = 20;
    const b = () => s.battle!;
    const ally = Object.values(b().units).find((u) => u.side === 'dawn' && u.id !== 'goldDragon')!;
    ally.hp -= 2;
    const scale = s.rules.statScale ?? 1;
    const before = ally.hp;
    s = applyAction(s, { type: 'battleSpell', spell: 'mend', targetId: ally.id });
    expect(b().units[ally.id].hp).toBe(Math.min(b().units[ally.id].maxHp, before + MAGIC.mendHeal * (s.rules.hpScale ?? scale)));
    // Each next spell in a fresh activation of the hero.
    const again = () => { b().activation!.spell = false; };
    again();
    s = applyAction(s, { type: 'battleSpell', spell: 'stoneskin', targetId: 'goldDragon' });
    expect(b().units.goldDragon.status.damageReduction).toBe(MAGIC.stoneskin * scale);
    again();
    s = applyAction(s, { type: 'battleSpell', spell: 'slow', targetId: 'werewolfLord' });
    expect(b().units.werewolfLord.status.slowNext).toBe(MAGIC.slowSpeed);
    again();
    s = applyAction(s, { type: 'battleSpell', spell: 'haste', targetId: ally.id });
    expect(b().extra[0]).toEqual({ unitId: ally.id, moveOnly: false });
    expect(() => { again(); applyAction(s, { type: 'battleSpell', spell: 'haste', targetId: 'goldDragon' }); }).toThrow(/cel/);
  });

  it('a fireball burns the target and everybody next to it', () => {
    let s = battle(['fireball']);
    const b = s.battle!;
    const foes = Object.values(b.units).filter((u) => u.side === 'horde');
    // Stand a second enemy next to the first.
    const [a, c] = foes;
    const free = mapNeighborsOfCell(a.pos!).find((k) => !Object.values(b.units).some((u) => u.pos === k || u.tail === k) && !b.obstacles.includes(k))!;
    c.pos = free;
    delete c.tail;
    const hp = [a.hp, c.hp];
    s = applyAction(s, { type: 'battleSpell', spell: 'fireball', targetId: a.id });
    const dmg = MAGIC.fireballDamage * (s.rules.statScale ?? 1);
    expect(s.battle!.units[a.id].hp).toBe(hp[0] - dmg);
    expect(s.battle!.units[c.id].hp).toBe(hp[1] - dmg);
  });

  it('a bot casts a bolt that kills', () => {
    const s = battle(['bolt']);
    s.battle!.units.werewolfLord.hp = 1;
    expect(botSpell(s)).toEqual({ spell: 'bolt', targetId: 'werewolfLord' });
    expect(chooseAction(s)).toEqual({ type: 'battleSpell', spell: 'bolt', targetId: 'werewolfLord' });
  });
});

describe('level 5: spells on the map and mana coming back', () => {
  it('Wizja uncovers the land around, Wrota takes the hero home and ends its move', () => {
    let s = game();
    const hero = activeHero(s)!;
    s.heroes[hero.id].spells = ['vision', 'portal'];
    s.heroes[hero.id].mana = 10;
    const hidden = Object.values(s.tiles).filter((t) => !t.revealed).length;
    s = applyAction(s, { type: 'mapSpell', spell: 'vision' });
    expect(Object.values(s.tiles).filter((t) => !t.revealed).length).toBeLessThan(hidden);
    // At home there is nowhere to go; from the field the portal leads home.
    expect(() => applyAction(s, { type: 'mapSpell', spell: 'portal' })).toThrow(/osady/);
    const away = mapNeighbors(s.tiles, home(s).at).find((k) => tileCost(s.tiles[k]) !== null && !s.tiles[k].crystalId)!;
    s.heroes[hero.id].pos = away;
    s = applyAction(s, { type: 'mapSpell', spell: 'portal' });
    expect(s.heroes[hero.id].pos).toBe(home(s).at);
    expect(s.movePoints).toBe(0);
    expect(manaOf(s.heroes[hero.id])).toBe(10 - SPELLS.vision.mana - SPELLS.portal.mana);
  });

  it('mana comes back at the end of a round, up to the hero\'s limit', () => {
    let s = game();
    const hero = activeHero(s)!;
    s.heroes[hero.id].mana = 0;
    const round = s.round;
    while (s.round === round) s = applyAction(s, { type: 'endTurn' });
    expect(manaOf(s.heroes[hero.id])).toBe(MAGIC.regen);
  });

  it('bots build the tower, learn spells and play whole games to the end', () => {
    let learnt = 0;
    for (const seed of [2, 5, 8]) {
      const s = playOut(createGame(setup({ mode: 'pvp', mapSize: 'long', seed, seats: pvpSeats('goldDragon', 'werewolfLord') }, rules)));
      expect(s.phase).toBe('over');
      learnt += Object.values(s.heroes).reduce((n, h) => n + (h.spells?.length ?? 0), 0);
    }
    expect(learnt).toBeGreaterThan(0);
  });
});

import { neighborKeys } from '../src/engine/hex';
function mapNeighborsOfCell(k: string): string[] {
  return [...neighborKeys(k)];
}
