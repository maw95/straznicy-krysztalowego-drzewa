import { describe, expect, it } from 'vitest';
import { makeBattleUnit, predictDamage } from '../src/engine/battle';
import { activeHero, applyAction, createGame, legalHeroMoves } from '../src/engine/game';
import { itemDef } from '../src/engine/data';
import { tileCost } from '../src/engine/map';
import { applyGear, applySupportGear, ARTIFACT_BY_ID, ARTIFACTS, captureGear, passTargets, gearMoveBonus, gearReveal, giveArtifact, heroTileCost, SITE, SLOTS, visitSite } from '../src/engine/sites';
import { playOut, setup } from './helpers/engine';

const grown = (over: Parameters<typeof setup>[0] = {}, growth = true) => createGame(setup(over, { ruleset: 'digital', ...(growth ? { heroGrowth: true } : {}) }));
const sitesOf = (s: ReturnType<typeof grown>) => Object.values(s.tiles).filter((t) => t.site);

describe('sites on the map and hero gear (hero growth)', () => {
  it('has none without hero growth; with it a few per map, never on a base, the Tree, a treasure or a lair', () => {
    expect(sitesOf(grown({}, false))).toHaveLength(0);
    for (const size of ['short', 'medium', 'long', 'veryLong'] as const) {
      const sites = sitesOf(grown({ mapSize: size }));
      expect(sites).toHaveLength(SITE.count[size]);
      for (const t of sites) expect(t.home || t.tree || t.crystalId || t.treasureId).toBeFalsy();
    }
  });

  it('is used once: a chest gives an artifact, a shrine experience, a camp brings a fallen support back', () => {
    const s = grown();
    const hero = activeHero(s)!;
    const tile = (kind: 'chest' | 'shrine' | 'camp') => ({ ...Object.values(s.tiles)[0], site: { kind, used: false } });
    const chest = tile('chest');
    visitSite(s, hero, chest);
    expect(chest.site.used).toBe(true);
    expect(Object.keys(hero.gear ?? {})).toHaveLength(1);
    const shrine = tile('shrine');
    visitSite(s, hero, shrine);
    expect(hero.xp).toBe(SITE.shrineXp);
    const f = s.factions[hero.faction];
    f.supportsDead.push(f.supportsAlive.pop()!);
    const dead = f.supportsDead[0];
    visitSite(s, hero, tile('camp'));
    expect(f.supportsAlive).toContain(dead);
    const again = tile('shrine');
    again.site.used = true;
    visitSite(s, hero, again);
    expect(hero.xp).toBe(SITE.shrineXp);
  });

  it('a rarer artifact replaces a more common one in the slot; the rest goes into the backpack, and into a treasure once that is full', () => {
    const s = grown();
    const hero = activeHero(s)!;
    giveArtifact(s, hero, ARTIFACT_BY_ID.blade1, 'test');
    giveArtifact(s, hero, ARTIFACT_BY_ID.blade2, 'test');
    expect(hero.gear?.weapon).toBe('blade2');
    const treasures = s.factions[hero.faction].inventory.length;
    // The one it replaced and every one that is no better go into the backpack, which has no limit.
    expect(hero.pack).toEqual(['blade1']);
    for (let i = 0; i < 6; i++) giveArtifact(s, hero, ARTIFACT_BY_ID.blade1, 'test');
    expect(hero.pack).toHaveLength(7);
    expect(hero.gear?.weapon).toBe('blade2');
    expect(s.factions[hero.faction].inventory.length).toBe(treasures);
  });

  it('gear gives its bonuses in battle and on the map', () => {
    const s = grown();
    const hero = activeHero(s)!;
    hero.gear = { weapon: 'blade2', armor: 'mail2', boots: 'boots2' };
    const unit = makeBattleUnit(hero.id, hero.faction, true);
    const hp = unit.hp;
    applyGear(hero, unit);
    expect(unit.status.battleAttackBonus).toBe(2);
    expect(unit.status.battleSpeedBonus).toBe(1);
    expect(unit.hp).toBe(hp + 4);
    expect(unit.gear).toEqual({ thorns: 1, vsWounded: 1 });
    expect(gearMoveBonus(hero)).toBe(1);
  });

  it('has five slots with a common, a rare and a legendary artifact each, under one name for every faction', () => {
    expect(SLOTS).toEqual(['helmet', 'weapon', 'armor', 'shield', 'boots']);
    for (const slot of SLOTS) expect(ARTIFACTS.filter((a) => a.slot === slot).map((a) => a.rarity).sort()).toEqual([1, 2, 3]);
    expect(new Set(ARTIFACTS.map((a) => a.name)).size).toBe(ARTIFACTS.length);
  });

  it('shields weaken every blow on the hero (never below 1) and the legendary one halves the first blow', () => {
    const s = grown();
    const hero = activeHero(s)!;
    const scale = s.rules.statScale ?? 1;
    const foe = makeBattleUnit('werewolfLord', 'horde', true, scale);
    const blow = (gear: NonNullable<typeof hero.gear>, extra = 0) => {
      hero.gear = gear;
      const unit = makeBattleUnit(hero.id, hero.faction, true, scale);
      applyGear(hero, unit);
      foe.status.battleAttackBonus = extra;
      s.battle = { units: { [unit.id]: unit, [foe.id]: foe } } as unknown as typeof s.battle;
      return predictDamage(s, foe, unit, { useAbility: false, movedDistance: 0 }).damage;
    };
    const plain = blow({});
    expect(blow({ shield: 'buckler' })).toBe(plain - 1);
    expect(blow({ shield: 'watchShield' })).toBe(plain - 2);
    expect(blow({ shield: 'treeAegis' })).toBe(Math.max(1, Math.ceil(plain / 2) - 3));
    expect(blow({ shield: 'watchShield' }, 1 - plain)).toBe(1);
    s.battle = null;
  });

  it('other effects: stronger supports, a wider view, thorns, a bonus against the wounded, flat terrain cost', () => {
    const s = grown();
    const hero = activeHero(s)!;
    hero.gear = { helmet: 'helm1', weapon: 'hunterBlade', armor: 'thornMail', boots: 'trapperBoots' };
    const k = s.rules.statScale ?? 1;
    const support = makeBattleUnit('nymph', 'dawn', true, k);
    const hp = support.hp;
    applySupportGear(hero, support);
    expect(support.hp).toBe(hp + k);
    const unit = makeBattleUnit(hero.id, hero.faction, true, k);
    applyGear(hero, unit);
    expect(unit.gear).toEqual({ thorns: k, vsWounded: k });
    expect(gearReveal(hero)).toBe(0);
    hero.gear = { helmet: 'scoutCrown' };
    expect(gearReveal(hero)).toBe(2);
    const rough = Object.values(s.tiles).find((t) => (tileCost(t) ?? 0) > 1)!;
    expect(heroTileCost(hero, rough)).toBe(tileCost(rough));
    hero.gear = { boots: 'trapperBoots' };
    expect(heroTileCost(hero, rough)).toBe(1);
    for (const m of legalHeroMoves(s)) expect(m.cost).toBeLessThanOrEqual(1);
  });

  it('the winner of a fight between heroes takes the artifacts: the better ones are put on, the rest go into the backpack', () => {
    const s = grown();
    const winner = activeHero(s)!;
    const loser = Object.values(s.heroes).find((h) => h.id !== winner.id)!;
    winner.gear = { weapon: 'blade2', boots: 'boots1' };
    loser.gear = { weapon: 'blade1', boots: 'boots2', shield: 'buckler' };
    loser.pack = ['helm1'];
    expect(captureGear(s, winner, loser)).toBe(4);
    expect(winner.gear).toEqual({ weapon: 'blade2', boots: 'boots2', shield: 'buckler', helmet: 'helm1' });
    expect(winner.pack).toEqual(['blade1', 'boots1']);
    expect(loser.gear).toEqual({});
    expect(loser.pack).toEqual([]);
    // The backpack has no limit: everything changes hands.
    winner.pack = ['mail1', 'mail1', 'mail1', 'mail1'];
    loser.gear = { armor: 'thornMail', weapon: 'blade1' };
    expect(captureGear(s, winner, loser)).toBe(2);
    expect(winner.gear?.armor).toBe('thornMail');
    expect(winner.pack).toHaveLength(5);
    expect(loser.gear).toEqual({});
  });

  it('the active hero swaps gear with its backpack and hands artifacts to an ally on a neighbouring hex', () => {
    let s = grown({ seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }, { name: 'B', faction: 'dawn', controller: 'bot', heroId: 'unicornKing' }] });
    const id = activeHero(s)!.id;
    const allyId = Object.values(s.heroes).find((h) => h.id !== id && h.faction === s.heroes[id].faction)!.id;
    s.heroes[id].gear = { weapon: 'blade2' };
    s.heroes[id].pack = ['blade1', 'helm1'];
    s = applyAction(s, { type: 'equipArtifact', artifactId: 'blade1' });
    expect(s.heroes[id].gear).toEqual({ weapon: 'blade1' });
    expect(s.heroes[id].pack).toEqual(['helm1', 'blade2']);
    s = applyAction(s, { type: 'unequipArtifact', slot: 'weapon' });
    expect(s.heroes[id].gear).toEqual({});
    expect(s.heroes[id].pack).toEqual(['helm1', 'blade2', 'blade1']);
    expect(() => applyAction(s, { type: 'equipArtifact', artifactId: 'treeAegis' })).toThrow();
    // Both start on the base (the same hex): the ally puts on what fills an empty slot and packs the rest.
    expect(passTargets(s, s.heroes[id]).map((h) => h.id)).toContain(allyId);
    s.heroes[allyId].gear = { weapon: 'hunterBlade' };
    s = applyAction(s, { type: 'passArtifact', artifactId: 'helm1', toHeroId: allyId });
    s = applyAction(s, { type: 'passArtifact', artifactId: 'blade2', toHeroId: allyId });
    expect(s.heroes[allyId].gear).toEqual({ weapon: 'hunterBlade', helmet: 'helm1' });
    expect(s.heroes[allyId].pack).toEqual(['blade2']);
    expect(s.heroes[id].pack).toEqual(['blade1']);
    // Far apart: no passing.
    s.heroes[allyId].pos = Object.keys(s.tiles).find((k) => passTargets({ ...s, heroes: { ...s.heroes, [allyId]: { ...s.heroes[allyId], pos: k } } }, s.heroes[id]).length === 0)!;
    expect(() => applyAction(s, { type: 'passArtifact', artifactId: 'blade1', toHeroId: allyId })).toThrow();
  });

  it('the digital ruleset renames the four treasure cards that sound like gear; the board edition keeps the printed names', () => {
    expect(['sword', 'boots', 'shield', 'stone'].map((k) => itemDef(k as 'sword', true).name)).toEqual(['Eliksir Mocy', 'Eliksir Chyżości', 'Zwój Tarczy', 'Runa Ochrony']);
    expect(itemDef('sword', false).name).toBe('Miecz Bohatera');
    expect(itemDef('heal', true).name).toBe(itemDef('heal', false).name);
  });

  it('bots play with sites to the end', () => {
    expect(playOut(grown({ seed: 5, mapSize: 'medium' })).phase).toBe('over');
  });
});
