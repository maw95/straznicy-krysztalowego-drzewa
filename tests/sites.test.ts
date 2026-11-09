import { describe, expect, it } from 'vitest';
import { makeBattleUnit } from '../src/engine/battle';
import { activeHero, createGame } from '../src/engine/game';
import { applyGear, ARTIFACT_BY_ID, gearMoveBonus, giveArtifact, SITE, visitSite } from '../src/engine/sites';
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

  it('a better artifact replaces a worse one in the slot; an equal or worse one turns into a treasure', () => {
    const s = grown();
    const hero = activeHero(s)!;
    giveArtifact(s, hero, ARTIFACT_BY_ID.blade1, 'test');
    giveArtifact(s, hero, ARTIFACT_BY_ID.blade2, 'test');
    expect(hero.gear?.weapon).toBe('blade2');
    const treasures = s.factions[hero.faction].inventory.length;
    giveArtifact(s, hero, ARTIFACT_BY_ID.blade1, 'test');
    expect(hero.gear?.weapon).toBe('blade2');
    expect(s.factions[hero.faction].inventory.length).toBe(treasures + 1);
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
    expect(gearMoveBonus(hero)).toBe(1);
  });

  it('bots play with sites to the end', () => {
    expect(playOut(grown({ seed: 5, mapSize: 'medium' })).phase).toBe('over');
  });
});
