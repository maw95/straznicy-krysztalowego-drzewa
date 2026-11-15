// Level 5 "Królestwo": hero types (growth of its own with every level), specialities and the branches of four skills.

import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { activeHero, applyAction, createGame, moveAllowance } from '../src/engine/game';
import { BRANCH, drawOffer, scholarXp, SKILL_RANKS } from '../src/engine/growth';
import { HERO_TYPES, specialtyOf, TYPE_GROWTH, typeAttack, typeHp } from '../src/engine/heroTypes';
import { maxMana, MAGIC, spellPower } from '../src/engine/magic';
import { mapNeighbors, tileCost } from '../src/engine/map';
import type { GameState, HeroState } from '../src/engine/types';
import { pvpSeats, setup } from './helpers/engine';

const rules = { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true } as const;
const game = (dawn = 'ancientBear', horde = 'werewolfLord', r: object = rules): GameState => createGame(setup({ mode: 'pvp', mapSize: 'medium', seed: 3, seats: pvpSeats(dawn, horde) }, r));

/** The two heroes of the game in a battle (the Przymierza attack), deployed. */
function battle(s: GameState): GameState {
  const hero = activeHero(s)!;
  const foe = Object.values(s.heroes).find((h) => h.faction === 'horde')!;
  const spot = Object.keys(s.tiles).find((k) => !s.tiles[k].home && !s.tiles[k].crystalId && !s.tiles[k].place && tileCost(s.tiles[k]) !== null && mapNeighbors(s.tiles, k).some((n) => tileCost(s.tiles[n]) !== null && !s.tiles[n].crystalId && !s.tiles[n].home))!;
  const from = mapNeighbors(s.tiles, spot).find((n) => tileCost(s.tiles[n]) !== null && !s.tiles[n].crystalId && !s.tiles[n].home)!;
  foe.pos = spot;
  s.heroes[hero.id].pos = from;
  s.tiles[spot].revealed = s.tiles[from].revealed = true;
  s.movePoints = 9;
  s = applyAction(s, { type: 'moveHero', to: spot });
  for (let i = 0; i < 12 && s.battle!.stage !== 'fight'; i++) s = applyAction(s, chooseAction(s)!);
  return s;
}

describe('level 5: hero types', () => {
  it('every hero has a type in level 5 and none below it', () => {
    const s = game();
    expect(s.heroes.ancientBear.kind).toBe('warrior');
    expect(s.heroes.werewolfLord.kind).toBe('hunter');
    const l4 = game('ancientBear', 'werewolfLord', { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true });
    expect(l4.heroes.ancientBear.kind).toBeUndefined();
    for (const id of ['goldDragon', 'unicornKing', 'ancientBear', 'blackDragon', 'werewolfLord', 'ironFistOgre', 'dawnKnight', 'dawnHuntress', 'dawnSage', 'hordeWarlord', 'hordeCrossbow', 'hordeShadow']) expect(HERO_TYPES[id]).toBeTruthy();
  });

  it('a warrior gains Życie with every level, a hunter Atak every second one, a sage mana', () => {
    const at = (id: string, level: number): HeroState => ({ id, faction: 'dawn', playerId: 'p1', pos: '0,0', alive: true, crystals: [], level, kind: HERO_TYPES[id] });
    expect(typeHp(at('ancientBear', 5))).toBe(4 * TYPE_GROWTH.warriorHp);
    expect(typeAttack(at('ancientBear', 5))).toBe(0);
    expect(typeAttack(at('unicornKing', 5))).toBe(2);
    expect(maxMana(at('goldDragon', 5)) - maxMana(at('ancientBear', 5))).toBe(4 * TYPE_GROWTH.sageMana);
    // No type (the other levels): nothing.
    expect(typeHp({ ...at('ancientBear', 5), kind: undefined })).toBe(0);
  });

  it('the growth stands on the hero\'s unit in a battle', () => {
    const plain = battle(game()).battle!.units;
    const grown = game();
    grown.heroes.ancientBear.level = 4;
    grown.heroes.werewolfLord.level = 5;
    const units = battle(grown).battle!.units;
    const hpScale = grown.rules.hpScale ?? grown.rules.statScale ?? 1;
    expect(units.ancientBear.maxHp - plain.ancientBear.maxHp).toBe(3 * TYPE_GROWTH.warriorHp * hpScale);
    expect(units.werewolfLord.status.battleAttackBonus - plain.werewolfLord.status.battleAttackBonus).toBe(2 * (grown.rules.statScale ?? 1));
  });
});

describe('level 5: specialities', () => {
  it('each named hero and commander has one, working only in level 5', () => {
    const s = game('unicornKing', 'werewolfLord');
    expect(specialtyOf(s.heroes.unicornKing)?.move).toBe(1);
    expect(moveAllowance(s)).toBe(s.rules.heroMovePoints + 1);
    expect(scholarXp(s.heroes.werewolfLord)).toBe(1);
    const l4 = game('unicornKing', 'werewolfLord', { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true });
    expect(specialtyOf(l4.heroes.unicornKing)).toBeUndefined();
    expect(moveAllowance(l4)).toBe(l4.rules.heroMovePoints);
  });

  it('a dragon casts stronger, the Bear\'s supports are tougher', () => {
    const s = game('goldDragon', 'blackDragon');
    expect(spellPower(s.heroes.goldDragon)).toBe(2);
    const bear = battle(game('ancientBear', 'werewolfLord')).battle!.units;
    const other = battle(game('unicornKing', 'werewolfLord')).battle!.units;
    const support = Object.values(bear).find((u) => u.side === 'dawn' && u.id !== 'ancientBear')!;
    const hpScale = s.rules.hpScale ?? s.rules.statScale ?? 1;
    expect(support.maxHp - other[support.id].maxHp).toBe(1 * hpScale);
    void MAGIC;
  });
});

describe('level 5: skill branches', () => {
  it('next to the third rank of a branching skill its branch is offered, and taking it closes the skill', () => {
    let s = game();
    const hero = s.heroes.ancientBear;
    hero.skills = ['might', 'might'];
    // Find a level at which rank III of Moc is among the offer.
    let offer: string[] = [];
    for (let level = 2; level <= 9 && !offer.includes('might'); level++) {
      hero.level = level;
      offer = drawOffer(s, hero);
    }
    expect(offer).toContain('might');
    expect(offer).toContain('mightB');
    expect(offer.length).toBe(4);
    hero.offer = offer as HeroState['offer'];
    s = applyAction(s, { type: 'chooseSkill', skill: 'mightB' });
    expect(s.heroes.ancientBear.skills).toEqual(['might', 'might', 'mightB']);
    for (let level = 2; level <= 9; level++) {
      s.heroes.ancientBear.level = level;
      const again = drawOffer(s, s.heroes.ancientBear);
      expect(again).not.toContain('might');
      expect(again).not.toContain('mightB');
    }
  });

  it('is not offered below level 5', () => {
    const l4 = game('ancientBear', 'werewolfLord', { ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true });
    const hero = l4.heroes.ancientBear;
    hero.skills = ['might', 'might', 'vigor', 'vigor', 'leader', 'leader', 'swift', 'swift'];
    for (let level = 2; level <= 9; level++) {
      hero.level = level;
      expect(drawOffer(l4, hero).some((x) => x.endsWith('B'))).toBe(false);
    }
  });

  it('the branches of Moc and Dowódca arm the supports, Hart heals the hero every round', () => {
    const base = game();
    base.heroes.ancientBear.skills = ['might', 'might', 'leader', 'leader', 'vigor', 'vigor'];
    const a = battle(base).battle!.units;
    const branched = game();
    branched.heroes.ancientBear.skills = ['might', 'might', 'mightB', 'leader', 'leader', 'leaderB', 'vigor', 'vigor', 'vigorB'];
    const b = battle(branched).battle!.units;
    const k = branched.rules.statScale ?? 1;
    const support = Object.values(a).find((u) => u.side === 'dawn' && u.id !== 'ancientBear')!;
    expect(b[support.id].status.battleAttackBonus - support.status.battleAttackBonus).toBe((BRANCH.mightSupportAttack + BRANCH.leaderSupportAttack) * k);
    // The hero keeps the second rank of each skill.
    expect(b.ancientBear.status.battleAttackBonus).toBe(a.ancientBear.status.battleAttackBonus);
    expect(b.ancientBear.maxHp).toBe(a.ancientBear.maxHp);
    expect(b.ancientBear.gear?.regen).toBe(BRANCH.vigorRegen * (branched.rules.hpScale ?? k));
    void SKILL_RANKS;
  });
});
