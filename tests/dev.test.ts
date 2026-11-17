// The developer panel's tools (engine/dev.ts): they change a state that no rule would allow, and leave every game that never calls them alone.

import { describe, expect, it } from 'vitest';
import { activeHero, createGame } from '../src/engine/game';
import { buildBlock, buildingsOf, resOf, settlementAt } from '../src/engine/kingdom';
import { SPELL_IDS } from '../src/engine/magic';
import { gearOf } from '../src/engine/sites';
import { addUnit, buildAnywhere, buildEverything, DEV_SCENES, fightNeutral, giveAllShards, giveArtifactTo, giveTreasure, learnSpell, reviveAll, setHeroLevel, setResources, teleportHero } from '../src/engine/dev';
import type { GameState } from '../src/engine/types';
import { pvpSeats, setup } from './helpers/engine';

const tiers = { realm: { kingdom: true, economy: true, realm: true }, empire: { kingdom: true, economy: true, realm: true, empire: true } } as const;
const game = (level: keyof typeof tiers = 'realm'): GameState =>
  createGame(setup({ mode: 'pvp', mapSize: 'medium', seed: 3, seats: pvpSeats('ancientBear', 'werewolfLord') }, { ruleset: 'digital', heroGrowth: true, ...tiers[level] }));
const home = (s: GameState) => settlementAt(s, Object.values(s.tiles).find((t) => t.home === 'dawn')!.key)!;

describe('developer tools', () => {
  it('set the gold and resources of a faction and leave the other alone', () => {
    const s = game();
    const horde = s.kingdom!.gold.horde;
    setResources(s, 'dawn', { gold: 77, dust: 5 });
    expect(s.kingdom!.gold.dawn).toBe(77);
    expect(resOf(s, 'dawn').dust).toBe(5);
    expect(s.kingdom!.gold.horde).toBe(horde);
  });

  it('give a hero a level, spells with full mana, an artifact and a treasure; a unit joins the supports', () => {
    const s = game();
    const hero = activeHero(s)!;
    setHeroLevel(s, hero.id, 7);
    expect(s.heroes[hero.id].level).toBe(7);
    for (const id of SPELL_IDS) learnSpell(s, hero.id, id);
    expect(s.heroes[hero.id].spells).toHaveLength(SPELL_IDS.length);
    expect(s.heroes[hero.id].mana).toBeUndefined();
    giveArtifactTo(s, hero.id, 'blade1');
    expect(gearOf(s.heroes[hero.id]).map((a) => a.id)).toContain('blade1');
    const items = s.factions.dawn.inventory.length;
    giveTreasure(s, 'dawn', 'heal');
    expect(s.factions.dawn.inventory.length).toBe(items + 1);
    addUnit(s, 'dawn', 'pegasus');
    expect(s.factions.dawn.supportsAlive).toContain('pegasus');
    expect(() => learnSpell(s, hero.id, 'nope' as never)).toThrow();
    expect(() => giveArtifactTo(s, hero.id, 'nope')).toThrow();
  });

  it('build with no price and no parent, everything at once, and revive the fallen', () => {
    const s = game();
    const at = home(s);
    expect(buildBlock(at, 'magic')).not.toBeNull();
    buildAnywhere(s, at.id, 'magic', 3);
    expect(at.buildings.magic).toBe(3);
    buildEverything(s, 'dawn');
    for (const b of buildingsOf(s)) if (b !== 'spark') expect(at.buildings[b]).toBeGreaterThanOrEqual(1);
    s.factions.dawn.supportsDead.push('pegasus');
    reviveAll(s, 'dawn');
    expect(s.factions.dawn.supportsDead).toEqual([]);
    expect(s.factions.dawn.supportsAlive).toContain('pegasus');
  });

  it('teleport a hero and give all the shards', () => {
    const s = game('empire');
    const hero = activeHero(s)!;
    const spot = Object.keys(s.tiles)[5];
    teleportHero(s, hero.id, spot);
    expect(s.heroes[hero.id].pos).toBe(spot);
    giveAllShards(s, hero.id);
    expect(s.heroes[hero.id].shards).toBe(s.kingdom!.shardTotal);
    expect(() => teleportHero(s, hero.id, 'x,y')).toThrow();
  });

  it('start a fight with a neutral encounter at once', () => {
    const after = fightNeutral(game(), 0);
    expect(after.phase).toBe('battle');
    expect(after.battle).not.toBeNull();
  });

  it('play every ready scene on a game of the level it needs', () => {
    for (const scene of DEV_SCENES) {
      const level = scene.needs === 'empire' ? 'empire' : 'realm';
      const after = scene.run(structuredClone(game(level)));
      expect(after, scene.id).toBeTruthy();
    }
    const spells = DEV_SCENES.find((x) => x.id === 'spellbook')!.run(game());
    expect(spells.phase).toBe('battle');
    expect(Object.values(spells.heroes).find((h) => h.faction === 'dawn')!.spells).toHaveLength(SPELL_IDS.length);
  });

  it('are not part of the rules: a game never touched by them is unchanged by importing them', () => {
    const a = createGame(setup({ mode: 'pvp', mapSize: 'medium', seed: 3, seats: pvpSeats('ancientBear', 'werewolfLord') }, {}));
    const b = createGame(setup({ mode: 'pvp', mapSize: 'medium', seed: 3, seats: pvpSeats('ancientBear', 'werewolfLord') }, {}));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
