// Hero growth (digital ruleset, rule `heroGrowth`): heroes earn experience from battles and treasures, reach levels, and at every level pick
// one of three offered skills. Skills are small, permanent bonuses; each faction has its own names for the same effects. Off by default (the
// level presets of the family mode switch it on), so games without it are untouched.

import { FACTION_NAMES, ITEMS, NON_RESURRECTION_ITEMS, UNITS, type FactionId } from './data';
import { activeHero, grantTreasure } from './game';
import { log } from './log';
import { Rng } from './rng';
import type { BattleUnit, GameState, HeroState } from './types';

export const GROWTH = {
  /** Experience needed for level 2, 3, 4, 5 (cumulative). */
  thresholds: [3, 7, 12, 18],
  /** Experience for a won battle with a guardian / with another hero, for a lost battle (the hero survived) and for a treasure found. */
  xp: { guardian: 3, hero: 2, lost: 1, treasure: 1 },
  /** The Horde meet guardians rarely, so every living Horde hero also gains this much experience at the end of each round. */
  hordeRoundXp: 1,
  /** Offered skills at a level up. */
  offer: 3,
};
export const MAX_LEVEL = GROWTH.thresholds.length + 1;

export type SkillId = 'might' | 'vigor' | 'swift' | 'leader' | 'pathfinder' | 'fortune';

/** What a skill does, in the words of the rules; the names per faction are in SKILL_NAMES. */
export const SKILL_EFFECT: Record<SkillId, { text: string }> = {
  might: { text: '+1 A bohatera w bitwie.' },
  vigor: { text: '+2 Ż bohatera w bitwie.' },
  swift: { text: '+1 S bohatera w bitwie.' },
  leader: { text: 'Pomocnicy bohatera mają +1 Ż w bitwie.' },
  pathfinder: { text: '+1 punkt ruchu na mapie.' },
  fortune: { text: 'Od razu: losowy skarb dla frakcji.' },
};

export const SKILL_NAMES: Record<FactionId, Record<SkillId, string>> = {
  dawn: { might: 'Moc Świtu', vigor: 'Hart Gaju', swift: 'Lekkość Wiatru', leader: 'Opieka nad Drużyną', pathfinder: 'Leśny Tropiciel', fortune: 'Dar Strażników' },
  horde: { might: 'Furia Hordy', vigor: 'Pancerz z Kości', swift: 'Pęd Ciemności', leader: 'Okrzyk Wodza', pathfinder: 'Nocny Zwiadowca', fortune: 'Łupieżca' },
};

export const ALL_SKILLS = Object.keys(SKILL_EFFECT) as SkillId[];
/** The order bots prefer: strength first, then Życie, speed, the squad, the roads. */
export const BOT_SKILL_ORDER: SkillId[] = ['might', 'vigor', 'leader', 'swift', 'pathfinder', 'fortune'];

export const growthOn = (state: Pick<GameState, 'rules'>) => Boolean(state.rules.heroGrowth);
export const levelOf = (h: Pick<HeroState, 'level'>) => h.level ?? 1;
export const hasSkill = (h: Pick<HeroState, 'skills'>, s: SkillId) => Boolean(h.skills?.includes(s));

/** Experience still needed for the next level, or null at the top. */
export const xpToNext = (h: HeroState): number | null => (levelOf(h) >= MAX_LEVEL ? null : GROWTH.thresholds[levelOf(h) - 1]);

/** The three skills offered at a level up: the ones the hero has not got, drawn from the game's seed (not from the game's own generator, so it never shifts the rest). */
function drawOffer(state: GameState, hero: HeroState): SkillId[] {
  const free = ALL_SKILLS.filter((s) => !hasSkill(hero, s));
  let h = (state.setup.seed ^ 0x9e3779b1) | 0;
  for (const ch of `${hero.id}:${levelOf(hero)}`) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return new Rng(h).shuffle(free).slice(0, GROWTH.offer);
}

/** Gives experience; a hero that reaches a level gets three skills to choose from (one choice at a time). */
export function awardXp(state: GameState, hero: HeroState, amount: number, reason?: string): void {
  if (!growthOn(state) || !hero.alive || amount <= 0) return;
  hero.xp = (hero.xp ?? 0) + amount;
  // The reason is what the player is told (a line in the log and a note on the screen); no reason, no line (the Horde's per-round experience).
  if (reason) log(state, 'info', `${UNITS[hero.id].name}: +${amount} PD (${reason}).`, hero.faction, { type: 'xp', heroId: hero.id, amount, reason });
  maybeLevelUp(state, hero);
}

function maybeLevelUp(state: GameState, hero: HeroState): void {
  if (hero.offer?.length) return;
  const need = xpToNext(hero);
  if (need === null || (hero.xp ?? 0) < need) return;
  hero.level = levelOf(hero) + 1;
  hero.offer = drawOffer(state, hero);
  log(state, 'info', `${UNITS[hero.id].name} awansuje na poziom ${hero.level}: do wyboru ${hero.offer.length} umiejętności.`, hero.faction);
}

/** The hero picks one of the offered skills. */
export function chooseSkill(state: GameState, heroId: string, skill: SkillId): void {
  const hero = state.heroes[heroId];
  if (!hero?.offer?.includes(skill)) throw new Error('Tej umiejętności nie ma w ofercie.');
  hero.skills = [...(hero.skills ?? []), skill];
  hero.offer = undefined;
  log(state, 'info', `${UNITS[hero.id].name} wybiera umiejętność: ${SKILL_NAMES[hero.faction][skill]}.`, hero.faction);
  if (skill === 'fortune') grantFortune(state, hero);
  // The extra move point counts at once when it is the hero's own turn, not only from the next one.
  if (skill === 'pathfinder' && activeHero(state)?.id === hero.id) state.movePoints += 1;
  maybeLevelUp(state, hero);
}

/** A random treasure not yet in the game goes to the hero's faction. */
function grantFortune(state: GameState, hero: HeroState): void {
  const used = new Set(Object.values(state.items).map((i) => i.kind));
  const left = NON_RESURRECTION_ITEMS.filter((k) => !used.has(k));
  if (!left.length) return;
  const rng = new Rng((state.setup.seed ^ 0x51ed270b ^ Object.keys(state.items).length) | 0);
  const kind = rng.pick(left);
  grantTreasure(state, kind, hero.faction, hero.id);
  log(state, 'item', `${FACTION_NAMES[hero.faction]} dostaje skarb: ${ITEMS[kind].name}.`, hero.faction);
}

/** Skill bonuses applied to the hero's unit when a battle starts. */
export function applyHeroSkills(hero: HeroState | undefined, unit: BattleUnit): void {
  if (!hero?.skills?.length) return;
  const k = unit.scale ?? 1;
  if (hasSkill(hero, 'might')) unit.status.battleAttackBonus += k;
  if (hasSkill(hero, 'swift')) unit.status.battleSpeedBonus += 1;
  if (hasSkill(hero, 'vigor')) {
    unit.hp += 2 * k;
    unit.maxHp += 2 * k;
  }
}

/** Pomocnicy of a hero with the skill Dowódca. */
export function applySupportSkill(hero: HeroState | undefined, unit: BattleUnit): void {
  if (hero && hasSkill(hero, 'leader')) {
    unit.hp += unit.scale ?? 1;
    unit.maxHp += unit.scale ?? 1;
  }
}

/** Extra move points on the map. */
export const moveBonus = (hero: HeroState | undefined) => (hero && hasSkill(hero, 'pathfinder') ? 1 : 0);
