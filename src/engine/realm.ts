// Level 5 "Królestwo" (digital, rule `realm`, built on level 4): the second hero. A player hires one commander in the tavern of an own settlement:
// an archetype (warrior, archer, sage) with a drawn name, its own pawn, experience, skills and artifacts. It fights with the faction's supports
// like the main hero does (supports are shared by the faction since level 3). A fallen commander can be bought back; the main hero's death is final.
// Every number is provisional. Design: docs/MECHANIKI_I_POZIOMY.md ("Poziom 5").

import { raceOf } from './teams';
import { FACTION_NAMES, UNITS, type FactionId, type TeamId } from './data';
import { levelOf } from './growth';
import { log } from './log';
import { Rng } from './rng';
import type { GameState, HeroState } from './types';

export const REALM = {
  /** Gold a commander costs in the tavern. */
  hireGold: 8,
  /** Buying a fallen commander back: this much gold plus so much for each of its levels. */
  ransomBase: 3,
  ransomPerLevel: 2,
  /** Rounds a fallen commander is away before it can be bought back. */
  ransomRounds: 1,
};

export type Archetype = 'warrior' | 'archer' | 'sage';
export const ARCHETYPE_NAMES: Record<Archetype, string> = { warrior: 'wojownik', archer: 'łucznik', sage: 'mędrzec' };

/** The commanders of each faction, by archetype (unit definitions in data.ts). */
export const COMMANDERS: Record<FactionId, Record<Archetype, string>> = {
  dawn: { warrior: 'dawnKnight', archer: 'dawnHuntress', sage: 'dawnSage' },
  horde: { warrior: 'hordeWarlord', archer: 'hordeCrossbow', sage: 'hordeShadow' },
};

export const archetypeOf = (unitId: string): Archetype | null => {
  for (const f of ['dawn', 'horde'] as TeamId[]) for (const a of Object.keys(COMMANDERS[f]) as Archetype[]) if (COMMANDERS[f][a] === unitId) return a;
  return null;
};

/** Names by commander (each has its own list, so two commanders of a game never share one). */
const NAMES: Record<string, string[]> = {
  dawnKnight: ['Borzywoj', 'Świętosław', 'Radosz', 'Wszebor'],
  dawnHuntress: ['Jaśmina', 'Mirela', 'Dobrawa', 'Zorza'],
  dawnSage: ['Lubomir', 'Dziadek Wiąz', 'Bogumił', 'Siwosz'],
  hordeWarlord: ['Grumosz', 'Burczygniew', 'Ostrokieł', 'Gnatosz'],
  hordeCrossbow: ['Zgrzyt', 'Szpon', 'Krzywe Oko', 'Smyk'],
  hordeShadow: ['Mroczysław', 'Popielec', 'Szept', 'Kruk'],
};

/** The name a commander gets: drawn from the game's seed, so a replay names it the same. */
export function commanderName(state: GameState, unitId: string): string {
  const rng = new Rng((state.setup.seed ^ 0x51ed270b ^ (unitId.length * 7919 + unitId.charCodeAt(4) * 131)) | 0);
  return rng.pick(NAMES[unitId] ?? ['Bezimienny']);
}

/** What a hero is called on the screen: a commander by its own name and title, a main hero by its card. */
export const heroLabel = (hero: Pick<HeroState, 'id' | 'name'>): string => (hero.name ? `${hero.name}, ${UNITS[hero.id].name}` : UNITS[hero.id].name);

/** The player's commander (alive or fallen), if it has hired one. */
export const commanderOf = (state: GameState, playerId: string | null): HeroState | undefined =>
  playerId ? Object.values(state.heroes).find((h) => h.secondary && h.playerId === playerId) : undefined;

/** The commanders a player of this faction may still hire (each archetype serves one player of the faction). */
export const freeCommanders = (state: GameState, f: TeamId): string[] => Object.values(COMMANDERS[raceOf(state, f)]).filter((id) => !state.heroes[id]);

export const ransomPrice = (hero: HeroState): number => REALM.ransomBase + REALM.ransomPerLevel * levelOf(hero);

/** Whether a fallen commander can be bought back now: a round has passed and its player's main hero still lives. */
export function mayRansom(state: GameState, hero: HeroState): boolean {
  if (!hero.secondary || hero.alive || hero.fallen === undefined) return false;
  if (state.round - hero.fallen < REALM.ransomRounds) return false;
  return Object.values(state.heroes).some((h) => h.playerId === hero.playerId && !h.secondary && h.alive);
}

/** A commander falls: it keeps its level and skills, loses what it carried (the winner took what it could before this is called). */
export function commanderFalls(state: GameState, hero: HeroState): void {
  hero.fallen = state.round;
  if (Object.keys(hero.gear ?? {}).length || hero.pack?.length) log(state, 'info', `${heroLabel(hero)} traci swoje artefakty.`);
  hero.gear = {};
  hero.pack = [];
  log(state, 'info', `${FACTION_NAMES[raceOf(state, hero.faction)]}: ${heroLabel(hero)} może wrócić za wykupem w karczmie (${ransomPrice(hero)} zł, od następnej rundy).`, hero.faction);
}
