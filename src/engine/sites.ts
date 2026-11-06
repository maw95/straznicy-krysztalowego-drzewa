// Hero gear (artifacts in three slots) and sites on the adventure map (shrines, mercenary camps, chests); both belong to hero growth
// (rule `heroGrowth`, growth.ts) and are off without it. A site is used once, by the first hero that steps on it.

import { FACTION_NAMES, NON_RESURRECTION_ITEMS, UNITS, type FactionId } from './data';
import { awardXp, growthOn } from './growth';
import { grantTreasure } from './game';
import { log } from './log';
import { Rng } from './rng';
import { tileCost } from './map';
import type { BattleUnit, GameState, HeroState, Tile } from './types';

export type Slot = 'weapon' | 'armor' | 'boots';
export type SiteKind = 'shrine' | 'camp' | 'chest';

/** An artifact: it sits in a slot of a hero and gives a bonus in battle (or on the map). Tier 2 beats tier 1 of the same slot. */
export interface ArtifactDef {
  id: string;
  slot: Slot;
  tier: 1 | 2;
  attack?: number;
  hp?: number;
  speed?: number;
  move?: number;
  text: string;
  names: Record<FactionId, string>;
}

export const ARTIFACTS: ArtifactDef[] = [
  { id: 'blade1', slot: 'weapon', tier: 1, attack: 1, text: '+1 A bohatera w bitwie.', names: { dawn: 'Miecz Brzasku', horde: 'Ząbkowany Tasak' } },
  { id: 'blade2', slot: 'weapon', tier: 2, attack: 2, text: '+2 A bohatera w bitwie.', names: { dawn: 'Ostrze Zorzy', horde: 'Rzeźnik Dusz' } },
  { id: 'mail1', slot: 'armor', tier: 1, hp: 2, text: '+2 Ż bohatera w bitwie.', names: { dawn: 'Kolczuga Gaju', horde: 'Skóry Stworów' } },
  { id: 'mail2', slot: 'armor', tier: 2, hp: 4, text: '+4 Ż bohatera w bitwie.', names: { dawn: 'Zbroja Strażnika', horde: 'Płyty z Żelaznych Klanów' } },
  { id: 'boots1', slot: 'boots', tier: 1, speed: 1, text: '+1 S bohatera w bitwie.', names: { dawn: 'Buty Wędrowca', horde: 'Buty Łowcy' } },
  { id: 'boots2', slot: 'boots', tier: 2, speed: 1, move: 1, text: '+1 S w bitwie i +1 punkt ruchu na mapie.', names: { dawn: 'Skrzydlate Sandały', horde: 'Kopyta Cienia' } },
];
export const ARTIFACT_BY_ID: Record<string, ArtifactDef> = Object.fromEntries(ARTIFACTS.map((a) => [a.id, a]));

export const SITE = {
  /** How many sites a map has, by map size, when hero growth is on. */
  count: { short: 2, medium: 3, long: 5, veryLong: 7 } as Record<string, number>,
  /** Experience from a shrine. */
  shrineXp: 2,
  names: { shrine: 'Kapliczka', camp: 'Obóz najemników', chest: 'Skrzynia' } as Record<SiteKind, string>,
  texts: {
    shrine: 'Pierwszy bohater, który tu stanie, dostaje 2 PD.',
    camp: 'Pierwszy bohater, który tu stanie, przywraca jednego poległego pomocnika swojej frakcji (albo dostaje 1 PD, gdy nikt nie poległ).',
    chest: 'Pierwszy bohater, który tu stanie, dostaje artefakt (albo skarb, gdy nie ma co założyć).',
  } as Record<SiteKind, string>,
};

export const gearOf = (hero: Pick<HeroState, 'gear'>): ArtifactDef[] => Object.values(hero.gear ?? {}).map((id) => ARTIFACT_BY_ID[id]);

/** Puts the sites on free passable hexes (not the bases, the Tree, a treasure or a lair), drawn from the game's seed. */
export function placeSites(state: GameState): void {
  if (!growthOn(state) || state.setup.mode === 'arena') return;
  const rng = new Rng((state.setup.seed ^ 0x7f4a7c15) | 0);
  const blocked = new Set<string>();
  for (const t of Object.values(state.tiles)) if (t.home || t.tree || t.crystalId || t.treasureId || tileCost(t) === null) blocked.add(t.key);
  const free = rng.shuffle(Object.values(state.tiles).filter((t) => !blocked.has(t.key)));
  const kinds: SiteKind[] = ['chest', 'shrine', 'camp'];
  const n = Math.min(SITE.count[state.setup.mapSize] ?? 2, free.length);
  for (let i = 0; i < n; i++) free[i].site = { kind: kinds[i % kinds.length], used: false };
}

/** What a hero finds on arriving at a hex with an unused site. */
export function visitSite(state: GameState, hero: HeroState, tile: Tile): void {
  const site = tile.site;
  if (!site || site.used) return;
  site.used = true;
  const name = UNITS[hero.id].name;
  if (site.kind === 'shrine') {
    log(state, 'info', `${name} modli się w kapliczce.`);
    awardXp(state, hero, SITE.shrineXp);
  } else if (site.kind === 'camp') {
    const f = state.factions[hero.faction];
    const fallen = f.supportsDead[0];
    if (fallen) {
      f.supportsDead.splice(0, 1);
      f.supportsAlive.push(fallen);
      log(state, 'info', `${name} wynajmuje najemników: wraca ${UNITS[fallen].name}.`);
    } else {
      log(state, 'info', `${name} zagląda do obozu najemników, ale nikt nie poległ.`);
      awardXp(state, hero, 1);
    }
  } else {
    const rng = new Rng((state.setup.seed ^ 0x2545f491 ^ (state.round * 131 + hero.id.length)) | 0);
    giveArtifact(state, hero, rng.pick(ARTIFACTS));
  }
}

/** The hero takes the artifact if it beats what sits in its slot; otherwise the faction gets a treasure card instead. */
export function giveArtifact(state: GameState, hero: HeroState, art: ArtifactDef): void {
  const name = UNITS[hero.id].name;
  const current = hero.gear?.[art.slot] ? ARTIFACT_BY_ID[hero.gear[art.slot]!] : null;
  if (!current || current.tier < art.tier) {
    hero.gear = { ...hero.gear, [art.slot]: art.id };
    log(state, 'item', `${name} zakłada artefakt: ${art.names[hero.faction]} (${art.text})`, hero.faction);
    return;
  }
  const used = new Set(Object.values(state.items).map((i) => i.kind));
  const rng = new Rng((state.setup.seed ^ 0x1b873593 ^ Object.keys(state.items).length) | 0);
  const kinds = NON_RESURRECTION_ITEMS.filter((k) => !used.has(k));
  if (kinds.length) {
    grantTreasure(state, rng.pick(kinds), hero.faction, hero.id);
    log(state, 'item', `${FACTION_NAMES[hero.faction]}: ${art.names[hero.faction]} nie jest lepszy od tego, co ${name} ma, więc zamiast niego jest skarb.`, hero.faction);
  }
}

/** Gear bonuses in battle (added to the skills' ones). */
export function applyGear(hero: HeroState | undefined, unit: BattleUnit): void {
  if (!hero) return;
  for (const a of gearOf(hero)) {
    unit.status.battleAttackBonus += a.attack ?? 0;
    unit.status.battleSpeedBonus += a.speed ?? 0;
    unit.hp += a.hp ?? 0;
    unit.maxHp += a.hp ?? 0;
  }
}

export const gearMoveBonus = (hero: HeroState | undefined) => (hero ? gearOf(hero).reduce((s, a) => s + (a.move ?? 0), 0) : 0);
