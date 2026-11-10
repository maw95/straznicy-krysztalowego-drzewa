import { describe, expect, it } from 'vitest';
import { applyAction, applyActionInPlace, createGame, activeHero, moveAllowance } from '../src/engine/game';
import { abilityNum, bearCanGuard, cellOf, deployCells, makeBattleUnit } from '../src/engine/battle';

import { ALL_SKILLS, applyHeroSkills, applyMilestones, milestoneText, milestoneTier, applySupportSkill, awardXp, chooseSkill, GROWTH, levelOf, MAX_LEVEL, MAX_RANK, moveBonus, scoutRadiusOf, skillRank, SKILL_RANKS, type SkillId } from '../src/engine/growth';
import { UNITS } from '../src/engine/data';
import { battleFixture, playOut, setup } from './helpers/engine';

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

  it('the offer is the same for the same game (it comes from the seed), and a skill already taken comes back only as a raise', () => {
    const a = grown({ seed: 9 });
    const b = grown({ seed: 9 });
    awardXp(a, activeHero(a)!, 3);
    awardXp(b, activeHero(b)!, 3);
    expect(activeHero(a)!.offer).toEqual(activeHero(b)!.offer);
    const h = activeHero(a)!;
    chooseSkill(a, h.id, h.offer![0]);
    awardXp(a, h, 5);
    // A hero with a skill below rank III always gets at least one raise among the offers, and no skill twice in one offer.
    expect(h.offer).toContain(h.skills![0]);
    expect(new Set(h.offer).size).toBe(h.offer!.length);
  });

  it('skills have ranks I-III: a repeated pick raises the rank, the effect grows, a rank III skill is not offered again', () => {
    const hero = { id: 'goldDragon', faction: 'dawn' as const, playerId: 'p1', pos: '0,0', alive: true, crystals: [], skills: ['might'] as SkillId[] };
    const bonus = (skills: SkillId[]) => {
      const unit = makeBattleUnit('goldDragon', 'dawn', true);
      applyHeroSkills({ ...hero, skills }, unit);
      return unit.status.battleAttackBonus;
    };
    expect([bonus(['might']), bonus(['might', 'might']), bonus(['might', 'might', 'might'])]).toEqual([1, 2, 3]);
    expect(skillRank({ skills: ['might', 'might', 'vigor'] }, 'might')).toBe(2);
    expect(moveBonus({ ...hero, skills: ['pathfinder', 'pathfinder'] })).toBe(2);
    const s = grown();
    const h = activeHero(s)!;
    h.skills = Array(MAX_RANK).fill('might');
    awardXp(s, h, 100);
    expect(h.offer).not.toContain('might');
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

describe('Strzelec, Taktyk, Zwiadowca', () => {
  const take = (s: ReturnType<typeof grown>, skill: SkillId, times = 1) => {
    const h = activeHero(s)!;
    for (let i = 0; i < times; i++) {
      h.offer = [skill, 'might', 'vigor'];
      chooseSkill(s, h.id, skill);
    }
    return h;
  };

  it('Strzelec: a ranged unit gets +A by rank, a melee one nothing', () => {
    const s = grown();
    const h = take(s, 'marksman', 2);
    const archer = makeBattleUnit('elfDruid', 'dawn', true, 3);
    const guard = makeBattleUnit('nymph', 'dawn', true, 3);
    applySupportSkill(h, archer);
    applySupportSkill(h, guard);
    expect(archer.status.battleAttackBonus).toBe(SKILL_RANKS.marksman[1] * 3);
    expect(guard.status.battleAttackBonus).toBe(0);
  });

  it('Taktyk: the side of a Taktyk deploys in extra columns, the other side only in its edge column', () => {
    const s = battleFixture(grown(), [{ id: 'braveDuck', side: 'dawn', col: 0, half: 8 }, { id: 'blackDragon', side: 'horde', col: 12, half: 8 }], { stage: 'deploy', deployDepth: { dawn: 2 } });
    const b = s.battle!;
    const cols = (side: 'dawn' | 'horde') => new Set(deployCells(b, side).map((k) => cellOf(k).col));
    expect([...cols('dawn')].sort((x, y) => x - y)).toEqual([0, 1, 2]);
    expect([...cols('horde')]).toEqual([12]);
  });

  it('Zwiadowca: reveals the radius at the start of the turn and when chosen', () => {
    const s = grown({ mapSize: 'medium' });
    const h = activeHero(s)!;
    const hidden = () => Object.values(s.tiles).filter((t) => !t.revealed).length;
    const before = hidden();
    take(s, 'scout');
    const afterOne = hidden();
    expect(afterOne).toBeLessThan(before);
    take(s, 'scout');
    expect(hidden()).toBeLessThanOrEqual(afterOne);
    expect(scoutRadiusOf(h)).toBe(SKILL_RANKS.scout[1]);
  });
});

describe('Łowca skarbów, Uczony', () => {
  it('a pending treasure choice blocks moving and ending the turn; choosing gives the treasure to the faction', () => {
    const s = grown();
    const h = activeHero(s)!;
    h.treasurePick = { kinds: ['sword', 'shield', 'stone'], take: 2 };
    expect(() => applyAction(s, { type: 'endTurn' })).toThrow(/skarb/);
    expect(() => applyActionInPlace(s, { type: 'chooseTreasure', kind: 'heal' })).toThrow();
    const before = s.factions[h.faction].inventory.length;
    applyActionInPlace(s, { type: 'chooseTreasure', kind: 'shield' });
    expect(h.treasurePick).toEqual({ kinds: ['sword', 'stone'], take: 1 });
    applyActionInPlace(s, { type: 'chooseTreasure', kind: 'sword' });
    expect(h.treasurePick).toBeUndefined();
    expect(s.factions[h.faction].inventory.length).toBe(before + 2);
  });

  it('bots with both skills play whole games: every choice is made, Uczony adds experience, treasures come from the offers', () => {
    let picks = 0;
    let scholar = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const s = grown({ seed, mapSize: 'medium' });
      for (const h of Object.values(s.heroes)) h.skills = ['treasureHunter', 'treasureHunter', 'scholar', 'scholar'];
      const end = playOut(s);
      expect(end.phase).toBe('over');
      expect(Object.values(end.heroes).every((h) => !h.treasurePick)).toBe(true);
      picks += end.log.filter((l) => l.text.includes('bohater wybiera')).length;
      scholar += end.log.filter((l) => l.text.includes('od Uczonego')).length;
    }
    expect(picks).toBeGreaterThan(0);
    expect(scholar).toBeGreaterThan(0);
  });
});

describe('hero milestones (levels 3, 6, 9)', () => {
  it('the tier is the number of milestones reached', () => {
    expect([1, 2, 3, 5, 6, 8, 9, 10].map(milestoneTier)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('each hero\'s own ability grows with the tier (small scale times the battle scale)', () => {
    const at = (id: string, level: number) => {
      const u = makeBattleUnit(id, UNITS[id].side as 'dawn' | 'horde', true, 3);
      applyMilestones({ level, skills: [] } as never, u);
      return u;
    };
    expect([1, 3, 6, 9].map((l) => abilityNum(at('goldDragon', l), 'sunburstSelfBonus'))).toEqual([3, 3, 4, 5]);
    expect([1, 3, 6, 9].map((l) => abilityNum(at('unicornKing', l), 'lightChargeBonus'))).toEqual([2, 3, 4, 5]);
    expect([1, 3, 6, 9].map((l) => abilityNum(at('ancientBear', l), 'guardianIgnore'))).toEqual([3, 5, 5, 7]);
    expect([1, 3, 6, 9].map((l) => abilityNum(at('werewolfLord', l), 'bloodCallBonus'))).toEqual([1, 2, 3, 4]);
    expect([1, 3, 6, 9].map((l) => abilityNum(at('ironFistOgre', l), 'hardHeadIgnore'))).toEqual([2, 3, 4, 5]);
    expect([1, 3, 6, 9].map((l) => abilityNum(at('braveDuck', l), 'duckKillHeal'))).toEqual([0, 1, 2, 3]);
    expect([1, 3, 6, 9].map((l) => abilityNum(at('blackDragon', l), 'breathBonus'))).toEqual([0, 1, 2, 2]);
    expect(at('blackDragon', 8).abilityExtra).toBeUndefined();
    expect(at('blackDragon', 9).abilityExtra).toBe(true);
    expect(at('goldDragon', 2).tier).toBeUndefined();
  });

  it('the bear guards any ally from milestone 2 on, and before only a neighbour', () => {
    const s = battleFixture(grown(), [{ id: 'ancientBear', side: 'dawn', col: 2, half: 8 }, { id: 'elfDruid', side: 'dawn', col: 2, half: 12 }, { id: 'blackDragon', side: 'horde', col: 9, half: 8 }]);
    const bear = s.battle!.units.ancientBear;
    const far = s.battle!.units.elfDruid;
    expect(bearCanGuard(s, bear, far)).toBe(false);
    bear.tier = 2;
    expect(bearCanGuard(s, bear, far)).toBe(true);
  });

  it('the Black Dragon at milestone 3 breathes twice in a battle, and with +A each time', () => {
    let s = battleFixture(grown(), [{ id: 'blackDragon', side: 'horde', col: 5, half: 8 }, { id: 'goldDragon', side: 'dawn', col: 6, half: 8 }, { id: 'unicornKing', side: 'dawn', col: 6, half: 10 }], { attacker: 'horde', defender: 'dawn', attackerHero: 'blackDragon' });
    const dragon = s.battle!.units.blackDragon;
    applyMilestones({ level: 9, skills: [] } as never, dragon);
    for (const u of Object.values(s.battle!.units)) if (u.side === 'dawn') u.hp = u.maxHp = 500;
    s = applyAction(s, { type: 'battleAttack', targetId: 'goldDragon', useAbility: true });
    expect(s.battle!.units.blackDragon.abilityUsed).toBe(false);
    expect(s.battle!.units.blackDragon.abilityExtra).toBe(false);
    s.battle!.activation = { ...s.battle!.activation!, unitId: 'blackDragon', attacked: false, acted: false };
    s = applyAction(s, { type: 'battleAttack', targetId: 'goldDragon', useAbility: true });
    expect(s.battle!.units.blackDragon.abilityUsed).toBe(true);
  });

  it('a level-up at a milestone says what it gives', () => {
    expect(milestoneText('braveDuck', 1, 3)).toContain('3 Ż');
    expect(milestoneText('braveDuck', 1, 3)).not.toContain('+1 S');
    expect(milestoneText('braveDuck', 3, 3)).toContain('+1 S');
    const s = grown();
    const h = activeHero(s)!;
    h.level = 2;
    h.xp = 0;
    awardXp(s, h, GROWTH.thresholds[1]);
    expect(levelOf(h)).toBe(3);
    expect(s.log.some((l) => l.text.includes('kamień milowy (poziom 3)'))).toBe(true);
  });

  it('bots play whole games with every hero at level 9', () => {
    for (const seed of [1, 2, 3, 4]) {
      const s = grown({ seed, mapSize: 'medium' });
      for (const h of Object.values(s.heroes)) {
        h.level = 9;
        h.xp = GROWTH.thresholds[7];
      }
      expect(playOut(s).phase).toBe('over');
    }
  });
});
