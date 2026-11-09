import { describe, expect, it } from 'vitest';
import { applyAction, createGame, activeHero, moveAllowance } from '../src/engine/game';
import { makeBattleUnit } from '../src/engine/battle';
import { ALL_SKILLS, applyHeroSkills, applySupportSkill, awardXp, chooseSkill, GROWTH, levelOf, MAX_LEVEL, type SkillId } from '../src/engine/growth';
import { playOut, setup } from './helpers/engine';

const grown = (over: Parameters<typeof setup>[0] = {}) => createGame(setup(over, { ruleset: 'digital', heroGrowth: true }));

describe('hero growth (digital ruleset, rule heroGrowth)', () => {
  it('is off by default: no experience, no levels', () => {
    const s = createGame(setup({}, { ruleset: 'digital' }));
    const h = activeHero(s)!;
    awardXp(s, h, 50);
    expect(h.xp).toBeUndefined();
    expect(levelOf(h)).toBe(1);
  });

  it('a hero that reaches the threshold gets three skills to choose from, and must choose before moving', () => {
    const s = grown();
    const h = activeHero(s)!;
    awardXp(s, h, GROWTH.thresholds[0]);
    expect(levelOf(h)).toBe(2);
    expect(h.offer).toHaveLength(GROWTH.offer);
    expect(new Set(h.offer).size).toBe(GROWTH.offer);
    const to = Object.keys(s.tiles).find((k) => s.tiles[k].revealed && k !== h.pos)!;
    expect(() => applyAction(s, { type: 'moveHero', to })).toThrow(/umiejętność/);
    expect(() => applyAction(s, { type: 'endTurn' })).toThrow(/umiejętność/);
    expect(() => applyAction(s, { type: 'chooseSkill', skill: ALL_SKILLS.find((x) => !h.offer!.includes(x))! })).toThrow(/oferc/);
    const after = applyAction(s, { type: 'chooseSkill', skill: h.offer![0] });
    expect(activeHero(after)!.skills).toEqual([h.offer![0]]);
    expect(activeHero(after)!.offer).toBeUndefined();
  });

  it('the offer is the same for the same game (it comes from the seed), and a skill is never offered twice', () => {
    const a = grown({ seed: 9 });
    const b = grown({ seed: 9 });
    awardXp(a, activeHero(a)!, 3);
    awardXp(b, activeHero(b)!, 3);
    expect(activeHero(a)!.offer).toEqual(activeHero(b)!.offer);
    const h = activeHero(a)!;
    chooseSkill(a, h.id, h.offer![0]);
    awardXp(a, h, 5);
    expect(h.offer).not.toContain(h.skills![0]);
  });

  it('stops at the top level', () => {
    const s = grown();
    const h = activeHero(s)!;
    for (let i = 0; i < MAX_LEVEL + 2; i++) {
      awardXp(s, h, 100);
      if (h.offer) chooseSkill(s, h.id, h.offer[0]);
    }
    expect(levelOf(h)).toBe(MAX_LEVEL);
    expect(h.offer).toBeUndefined();
  });

  it('skills change the hero in battle: Moc +1 A, Hart +2 Ż, Lekkość +1 S; Opiekun gives its supports +1 Ż', () => {
    const hero = { id: 'goldDragon', faction: 'dawn' as const, playerId: 'p1', pos: '0,0', alive: true, crystals: [], skills: ['might', 'vigor', 'swift', 'leader'] as SkillId[] };
    const plain = makeBattleUnit('goldDragon', 'dawn', true);
    const unit = makeBattleUnit('goldDragon', 'dawn', true);
    applyHeroSkills(hero, unit);
    expect(unit.status.battleAttackBonus).toBe(1);
    expect(unit.status.battleSpeedBonus).toBe(1);
    expect([unit.hp, unit.maxHp]).toEqual([plain.hp + 2, plain.maxHp + 2]);
    const support = makeBattleUnit('nymph', 'dawn', true);
    applySupportSkill(hero, support);
    expect(support.hp).toBe(makeBattleUnit('nymph', 'dawn', true).hp + 1);
    applySupportSkill({ ...hero, skills: [] }, support);
    expect(support.hp).toBe(makeBattleUnit('nymph', 'dawn', true).hp + 1);
  });

  it('a won battle with a guardian gives the most experience, a lost one a little', () => {
    expect(GROWTH.xp.guardian).toBeGreaterThan(GROWTH.xp.hero);
    expect(GROWTH.xp.hero).toBeGreaterThan(GROWTH.xp.lost);
  });

  it('bots play with growth to the end and earn levels', () => {
    const s = playOut(grown({ seed: 4, mapSize: 'medium' }));
    expect(s.phase).toBe('over');
    const levels = Object.values(s.heroes).map((h) => levelOf(h));
    expect(Math.max(...levels)).toBeGreaterThanOrEqual(2);
  });

  it('the Horde earn experience from rounds too', () => {
    const s = playOut(grown({ seed: 4, mapSize: 'medium' }));
    const horde = Object.values(s.heroes).filter((h) => h.faction === 'horde');
    expect(horde.some((h) => (h.xp ?? 0) > 0)).toBe(true);
  });
});

describe('Leśny Tropiciel', () => {
  it('adds its move point at once in the hero\'s own turn, and the turn start counts it too', () => {
    const s = grown();
    const h = activeHero(s)!;
    const before = s.movePoints;
    h.offer = ['pathfinder', 'might', 'vigor'];
    chooseSkill(s, h.id, 'pathfinder');
    expect(s.movePoints).toBe(before + 1);
    expect(moveAllowance(s)).toBe(s.rules.heroMovePoints + 1);
  });
});
