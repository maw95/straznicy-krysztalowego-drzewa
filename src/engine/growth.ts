// Hero growth (digital ruleset, rule `heroGrowth`): heroes earn experience from battles and treasures, reach levels, and at every level pick
// one of three offered skills. Skills are small, permanent bonuses; each faction has its own names for the same effects. Off by default (the
// level presets of the family mode switch it on), so games without it are untouched.

import { ABILITY_TIERS, FACTION_NAMES, ITEMS, MILESTONE_TIER, NON_RESURRECTION_ITEMS, UNITS, type FactionId, type ItemKind } from './data';
import { activeHero, grantTreasure, scoutAround } from './game';
import { scaleOf } from './battle';
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

/** Levels that strengthen a hero's own ability (`ABILITY_TIERS`); the tier is how many of them the hero has reached. */
export const MILESTONE_LEVELS = [3, 6, 9] as const;
export const milestoneTier = (level: number) => MILESTONE_LEVELS.filter((l) => level >= l).length;

/** What each milestone gives (for the log and the screen), by the numbers of `ABILITY_TIERS` times the battle scale `k`. */
export function milestoneText(heroId: string, tier: number, k: number): string | null {
  const n = (key: keyof typeof ABILITY_TIERS) => ABILITY_TIERS[key][tier] * k;
  switch (heroId) {
    case 'goldDragon': return `Słoneczny Blask: sojusznicy +${n('sunburstBonus')} A, Smok +${n('sunburstSelfBonus')} A.`;
    case 'unicornKing': return `Szarża Światła: +${n('lightChargeBonus')} A.`;
    case 'ancientBear': return `Opiekun Gaju ignoruje ${n('guardianIgnore')} obrażeń${tier >= 2 ? ' i chroni dowolnego sojusznika, nie tylko sąsiada' : ''}.`;
    case 'blackDragon': return `Ognisty Oddech: +${n('breathBonus')} A${tier >= 3 ? ', a użyć go można dwa razy w bitwie' : ''}.`;
    case 'werewolfLord': return `Zew Krwi: +${n('bloodCallBonus')} A na rannego wroga.`;
    case 'ironFistOgre': return `Twardogłowy ignoruje ${n('hardHeadIgnore')} obrażeń.`;
    case 'braveDuck': return `Kacza Furia: po zabiciu wroga Kaczka leczy się o ${n('duckKillHeal')} Ż${tier >= 3 ? ', a jej dodatkowa aktywacja daje +1 S' : ''}.`;
    default: return null;
  }
}

/** A hero card's ability text with the milestone reached (small-scale numbers, the screen scales them like the rest of the card). */
export function abilityTextAt(defId: string, text: string, tier: number): string {
  const note = tier > 0 ? milestoneText(defId, tier, 1) : null;
  return note ? `${text} Poziom ${MILESTONE_LEVELS[tier - 1]}: ${note}` : text;
}

/** The hero's milestone reached goes onto its unit when a battle starts. */
export function applyMilestones(hero: HeroState | undefined, unit: BattleUnit): void {
  const tier = hero ? milestoneTier(levelOf(hero)) : 0;
  if (!tier) return;
  unit.tier = tier;
  if (tier >= MILESTONE_TIER.breathTwice && UNITS[unit.defId].ability === 'fireBreath') unit.abilityExtra = true;
}

export type SkillId = 'might' | 'vigor' | 'swift' | 'leader' | 'pathfinder' | 'fortune' | 'marksman' | 'tactician' | 'scout' | 'treasureHunter' | 'scholar';

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
  huntPool: [2, 3, 3], // Łowca skarbów: treasures shown after a guardian fight ...
  huntTake: [1, 1, 2], // ... and how many of them the hero keeps
  scholar: [1, 2, 3], // extra XP for every won battle
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
  treasureHunter: { texts: [0, 1, 2].map((i) => `Po walce ze strażnikiem: ${SKILL_RANKS.huntTake[i] === 1 ? 'jeden skarb' : `${SKILL_RANKS.huntTake[i]} skarby`} do wyboru spośród ${SKILL_RANKS.huntPool[i]} (zamiast losu).`) as [string, string, string] },
  scholar: { texts: SKILL_RANKS.scholar.map((n) => `+${n} PD za każdą wygraną walkę.`) as [string, string, string] },
  fortune: { texts: ['Od razu: losowy skarb dla frakcji.', 'Od razu: kolejny losowy skarb dla frakcji.', 'Od razu: jeszcze jeden losowy skarb dla frakcji.'] },
};
export const skillText = (skill: SkillId, rank: number) => SKILL_EFFECT[skill].texts[Math.min(Math.max(rank, 1), MAX_RANK) - 1];

export const SKILL_NAMES: Record<FactionId, Record<SkillId, string>> = {
  dawn: { might: 'Moc Świtu', vigor: 'Hart Gaju', swift: 'Lekkość Wiatru', leader: 'Opieka nad Drużyną', pathfinder: 'Leśny Tropiciel', fortune: 'Dar Strażników', marksman: 'Oko Łucznika', tactician: 'Sztuka Wojny', scout: 'Orle Oko', treasureHunter: 'Skarbnik Gaju', scholar: 'Mądrość Drzewa' },
  horde: { might: 'Furia Hordy', vigor: 'Pancerz z Kości', swift: 'Pęd Ciemności', leader: 'Okrzyk Wodza', pathfinder: 'Nocny Zwiadowca', fortune: 'Łupieżca', marksman: 'Krzywy Łuk', tactician: 'Zasadzka', scout: 'Ślepia Wilka', treasureHunter: 'Nos Hieny', scholar: 'Pamięć Przodków' },
};

export const ALL_SKILLS = Object.keys(SKILL_EFFECT) as SkillId[];
/** The order bots prefer: strength first, then Życie, speed, the squad, the roads. */
export const BOT_SKILL_ORDER: SkillId[] = ['might', 'vigor', 'leader', 'swift', 'marksman', 'pathfinder', 'tactician', 'scout', 'treasureHunter', 'scholar', 'fortune'];

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
  const tier = (MILESTONE_LEVELS as readonly number[]).includes(hero.level) ? milestoneTier(hero.level) : 0;
  const note = tier ? milestoneText(hero.id, tier, scaleOf(state)) : null;
  if (note) log(state, 'info', `${UNITS[hero.id].name}: kamień milowy (poziom ${hero.level}). ${note}`, hero.faction);
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

/** Łowca skarbów: how many treasures are shown after a guardian fight and how many the hero keeps (null = no skill). */
export function huntOf(hero: HeroState | undefined): { pool: number; take: number } | null {
  const r = hero ? skillRank(hero, 'treasureHunter') : 0;
  return r > 0 ? { pool: SKILL_RANKS.huntPool[Math.min(r, MAX_RANK) - 1], take: SKILL_RANKS.huntTake[Math.min(r, MAX_RANK) - 1] } : null;
}

/** Uczony: extra experience for a won battle. */
export const scholarXp = (hero: HeroState | undefined) => (hero ? rankValue(SKILL_RANKS.scholar, hero, 'scholar') : 0);

/** The hero keeps one of the shown treasures (the rest of the pool is never made). */
export function chooseTreasure(state: GameState, heroId: string, kind: ItemKind): void {
  const hero = state.heroes[heroId];
  const pick = hero?.treasurePick;
  if (!pick?.kinds.includes(kind)) throw new Error('Tego skarbu nie ma wśród pokazanych.');
  grantTreasure(state, kind, hero.faction, hero.id);
  state.stats.treasuresCollected[hero.faction] += 1;
  log(state, 'item', `Skarb strażnika (${UNITS[hero.id].name}): ${ITEMS[kind].name}.`, hero.faction);
  pick.take -= 1;
  pick.kinds = pick.kinds.filter((k) => k !== kind);
  if (pick.take <= 0 || !pick.kinds.length) hero.treasurePick = undefined;
}

/** Extra columns a hero's units may be deployed in. */
export const deployDepthOf = (hero: HeroState | undefined) => (hero ? rankValue(SKILL_RANKS.tactician, hero, 'tactician') : 0);

/** Radius of the hexes a hero reveals (0 = no Zwiadowca; the step itself always reveals the neighbours). */
export const scoutRadiusOf = (hero: HeroState | undefined) => (hero ? rankValue(SKILL_RANKS.scout, hero, 'scout') : 0);

/** Extra move points on the map. */
export const moveBonus = (hero: HeroState | undefined) => (hero ? rankValue(SKILL_RANKS.pathfinder, hero, 'pathfinder') : 0);
