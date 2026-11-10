// Hero growth (digital ruleset, rule `heroGrowth`): heroes earn experience from battles and treasures, reach levels, and at every level pick
// one of three offered skills. Skills are small, permanent bonuses; each faction has its own names for the same effects. Off by default (the
// level presets of the family mode switch it on), so games without it are untouched.

import { FACTION_NAMES, ITEMS, NON_RESURRECTION_ITEMS, UNITS, type FactionId } from './data';
import { activeHero, grantTreasure, scoutAround } from './game';
import { log } from './log';
import { Rng } from './rng';
import type { BattleUnit, GameState, HeroState } from './types';

export const GROWTH = {
  /** Experience needed for level 2 ... 10 (cumulative); the curve steepens after level 5, so level 10 stays rare. Provisional: tune with the simulations. */
  thresholds: [3, 7, 12, 18, 26, 38, 56, 84, 128],
  /** Experience for a won battle with a guardian / with another hero, for a lost battle (the hero survived) and for a treasure found. */
  xp: { guardian: 3, hero: 2, lost: 1, treasure: 1 },
  /** The Horde meet guardians rarely, so every living Horde hero also gains this much experience at the end of each round. */
  hordeRoundXp: 1,
  /** Offered skills at a level up. */
  offer: 3,
};
export const MAX_LEVEL = GROWTH.thresholds.length + 1;

export type SkillId = 'might' | 'vigor' | 'swift' | 'leader' | 'pathfinder' | 'fortune' | 'marksman' | 'tactician' | 'scout';

/** A skill has ranks I-III; taking a skill the hero already has raises its rank (the list `skills` holds it once per rank). */
export const MAX_RANK = 3;

/** What a skill gives at rank I, II, III (small-scale numbers; the battle scale multiplies them). Provisional: tune with the simulations. */
export const SKILL_RANKS = {
  might: [1, 2, 3], // A
  vigor: [2, 4, 6], // Ż
  swift: [1, 2, 2], // S
  leader: [1, 2, 3], // Ż of the supports
  pathfinder: [1, 2, 2], // move points on the map
  marksman: [1, 2, 3], // A of the hero's shooters (the hero too, when it shoots)
  tactician: [1, 2, 3], // extra columns the hero's units may be deployed in
  scout: [2, 3, 4], // radius of the hexes revealed at the start of the hero's turn (and on every step)
} as const;

/** What a skill does at each rank, in the words of the rules; the names per faction are in SKILL_NAMES. */
export const SKILL_EFFECT: Record<SkillId, { texts: [string, string, string] }> = {
  might: { texts: SKILL_RANKS.might.map((n) => `+${n} A bohatera w bitwie.`) as [string, string, string] },
  vigor: { texts: SKILL_RANKS.vigor.map((n) => `+${n} Ż bohatera w bitwie.`) as [string, string, string] },
  swift: { texts: SKILL_RANKS.swift.map((n) => `+${n} S bohatera w bitwie.`) as [string, string, string] },
  leader: { texts: SKILL_RANKS.leader.map((n) => `Pomocnicy bohatera mają +${n} Ż w bitwie.`) as [string, string, string] },
  pathfinder: { texts: SKILL_RANKS.pathfinder.map((n) => `+${n} punkt${n === 1 ? '' : 'y'} ruchu na mapie.`) as [string, string, string] },
  marksman: { texts: SKILL_RANKS.marksman.map((n) => `Strzelcy bohatera (też on sam, jeśli strzela) mają +${n} A w bitwie.`) as [string, string, string] },
  tactician: { texts: SKILL_RANKS.tactician.map((n) => `Rozstawienie przed bitwą: jednostki bohatera mogą stanąć o ${n} ${n === 1 ? 'kolumnę' : 'kolumny'} dalej.`) as [string, string, string] },
  scout: { texts: SKILL_RANKS.scout.map((n) => `Na początku tury odkrywa pola w promieniu ${n} od bohatera.`) as [string, string, string] },
  fortune: { texts: ['Od razu: losowy skarb dla frakcji.', 'Od razu: kolejny losowy skarb dla frakcji.', 'Od razu: jeszcze jeden losowy skarb dla frakcji.'] },
};
export const skillText = (skill: SkillId, rank: number) => SKILL_EFFECT[skill].texts[Math.min(Math.max(rank, 1), MAX_RANK) - 1];

export const SKILL_NAMES: Record<FactionId, Record<SkillId, string>> = {
  dawn: { might: 'Moc Świtu', vigor: 'Hart Gaju', swift: 'Lekkość Wiatru', leader: 'Opieka nad Drużyną', pathfinder: 'Leśny Tropiciel', fortune: 'Dar Strażników', marksman: 'Oko Łucznika', tactician: 'Sztuka Wojny', scout: 'Orle Oko' },
  horde: { might: 'Furia Hordy', vigor: 'Pancerz z Kości', swift: 'Pęd Ciemności', leader: 'Okrzyk Wodza', pathfinder: 'Nocny Zwiadowca', fortune: 'Łupieżca', marksman: 'Krzywy Łuk', tactician: 'Zasadzka', scout: 'Ślepia Wilka' },
};

export const ALL_SKILLS = Object.keys(SKILL_EFFECT) as SkillId[];
/** The order bots prefer: strength first, then Życie, speed, the squad, the roads. */
export const BOT_SKILL_ORDER: SkillId[] = ['might', 'vigor', 'leader', 'swift', 'marksman', 'pathfinder', 'tactician', 'scout', 'fortune'];

export const growthOn = (state: Pick<GameState, 'rules'>) => Boolean(state.rules.heroGrowth);
export const levelOf = (h: Pick<HeroState, 'level'>) => h.level ?? 1;
export const hasSkill = (h: Pick<HeroState, 'skills'>, s: SkillId) => Boolean(h.skills?.includes(s));
/** The rank (0 = not taken, 1-3) of a skill. */
export const skillRank = (h: Pick<HeroState, 'skills'>, s: SkillId) => (h.skills ?? []).filter((x) => x === s).length;
const rankValue = (table: readonly number[], h: Pick<HeroState, 'skills'>, s: SkillId) => (skillRank(h, s) > 0 ? table[Math.min(skillRank(h, s), MAX_RANK) - 1] : 0);

/** Experience still needed for the next level, or null at the top. */
export const xpToNext = (h: HeroState): number | null => (levelOf(h) >= MAX_LEVEL ? null : GROWTH.thresholds[levelOf(h) - 1]);

/**
 * The skills offered at a level up, drawn from the game's seed (not from the game's own generator, so it never shifts the rest): the ones the
 * hero has not got and the ones it has below rank III. When the hero has any skill it can still raise, at least one such raise is among the offers.
 */
export function drawOffer(state: GameState, hero: HeroState): SkillId[] {
  const raise = ALL_SKILLS.filter((s) => skillRank(hero, s) > 0 && skillRank(hero, s) < MAX_RANK);
  const fresh = ALL_SKILLS.filter((s) => skillRank(hero, s) === 0);
  let h = (state.setup.seed ^ 0x9e3779b1) | 0;
  for (const ch of `${hero.id}:${levelOf(hero)}`) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  const rng = new Rng(h);
  const raises = rng.shuffle(raise);
  const first = raises.slice(0, 1);
  const rest = rng.shuffle([...fresh, ...raises.slice(1)]);
  return [...first, ...rest].slice(0, GROWTH.offer);
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
  const rank = skillRank(hero, skill);
  log(state, 'info', `${UNITS[hero.id].name} wybiera umiejętność: ${SKILL_NAMES[hero.faction][skill]}${rank > 1 ? ` (stopień ${rank})` : ''}.`, hero.faction);
  if (skill === 'fortune') grantFortune(state, hero);
  if (skill === 'scout' && activeHero(state)?.id === hero.id) scoutAround(state, hero);
  // The extra move point counts at once when it is the hero's own turn, not only from the next one.
  if (skill === 'pathfinder' && activeHero(state)?.id === hero.id) state.movePoints += rankValue(SKILL_RANKS.pathfinder, hero, 'pathfinder') - (skillRank(hero, 'pathfinder') > 1 ? SKILL_RANKS.pathfinder[skillRank(hero, 'pathfinder') - 2] : 0);
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
  unit.status.battleAttackBonus += rankValue(SKILL_RANKS.might, hero, 'might') * k;
  unit.status.battleSpeedBonus += rankValue(SKILL_RANKS.swift, hero, 'swift');
  const hp = rankValue(SKILL_RANKS.vigor, hero, 'vigor') * k;
  unit.hp += hp;
  unit.maxHp += hp;
  addMarksman(hero, unit);
}

/** Szkoła strzelecka: a ranged unit of the hero gets the attack bonus. */
function addMarksman(hero: Pick<HeroState, 'skills'>, unit: BattleUnit): void {
  if (UNITS[unit.defId].attackType === 'ranged') unit.status.battleAttackBonus += rankValue(SKILL_RANKS.marksman, hero, 'marksman') * (unit.scale ?? 1);
}

/** Pomocnicy of a hero with the skill Dowódca. */
export function applySupportSkill(hero: HeroState | undefined, unit: BattleUnit): void {
  if (!hero) return;
  const hp = rankValue(SKILL_RANKS.leader, hero, 'leader') * (unit.scale ?? 1);
  unit.hp += hp;
  unit.maxHp += hp;
  addMarksman(hero, unit);
}

/** Extra columns a hero's units may be deployed in. */
export const deployDepthOf = (hero: HeroState | undefined) => (hero ? rankValue(SKILL_RANKS.tactician, hero, 'tactician') : 0);

/** Radius of the hexes a hero reveals (0 = no Zwiadowca; the step itself always reveals the neighbours). */
export const scoutRadiusOf = (hero: HeroState | undefined) => (hero ? rankValue(SKILL_RANKS.scout, hero, 'scout') : 0);

/** Extra move points on the map. */
export const moveBonus = (hero: HeroState | undefined) => (hero ? rankValue(SKILL_RANKS.pathfinder, hero, 'pathfinder') : 0);
