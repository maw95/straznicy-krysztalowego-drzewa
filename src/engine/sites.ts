// Hero gear (artifacts in five slots, three rarities, a backpack for the ones not worn) and sites on the adventure map (shrines, mercenary camps, chests); both belong to hero growth
// (rule `heroGrowth`, growth.ts) and are off without it. A site is used once, by the first hero that steps on it.

import { FACTION_NAMES, NON_RESURRECTION_ITEMS, STAT_SCALE, UNITS } from './data';
import { distance, parseKey } from './hex';
import { awardXp, growthOn } from './growth';
import { activeHero, grantTreasure, scoutAround } from './game';
import { log } from './log';
import { Rng } from './rng';
import { tileCost } from './map';
import type { BattleUnit, GameState, HeroState, Tile } from './types';

export type Slot = 'helmet' | 'weapon' | 'armor' | 'shield' | 'boots';
/** The five places of a hero's gear, in the order of the hero's sheet: the helmet on top, weapon - armour - shield in the middle, the boots below. */
export const SLOTS: Slot[] = ['helmet', 'weapon', 'armor', 'shield', 'boots'];
export type SiteKind = 'shrine' | 'camp' | 'chest';
/** 1 common (zwykły), 2 rare (rzadki), 3 legendary (legendarny). */
export type Rarity = 1 | 2 | 3;
export const RARITY_NAMES: Record<Rarity, string> = { 1: 'zwykły', 2: 'rzadki', 3: 'legendarny' };

/**
 * An artifact: it sits in a slot of a hero and works the same for every hero (one name and one picture, whatever the faction). A higher rarity
 * beats a lower one of the same slot. Życie and Atak numbers are the board game's (the battle scale multiplies them); `defense` is in
 * points of the digital Expedition (scale 3), see `defenseOf`.
 */
export interface ArtifactDef {
  id: string;
  slot: Slot;
  rarity: Rarity;
  name: string;
  text: string;
  /** Bonuses of the hero in a battle. */
  attack?: number;
  hp?: number;
  speed?: number;
  /** Extra move points on the map. */
  move?: number;
  /** Życie added to each of the hero's supports. */
  supportHp?: number;
  /** Radius of the hexes revealed around the hero (like the skill Zwiadowca). */
  reveal?: number;
  /** Życie an enemy loses when it hits the hero in melee. */
  thorns?: number;
  /** Extra Atak against a wounded enemy. */
  vsWounded?: number;
  /** Every blow on the hero is this much weaker (never below 1). */
  defense?: number;
  /** The first blow on the hero in a battle does half its damage. */
  firstHit?: true;
  /** Every hex of the map costs the hero 1 move point. */
  trapper?: true;
}

export const ARTIFACTS: ArtifactDef[] = [
  { id: 'helm1', slot: 'helmet', rarity: 1, name: 'Hełm Dowódcy', supportHp: 1, text: 'Pomocnicy bohatera mają +1 Ż w bitwie.' },
  { id: 'scoutCrown', slot: 'helmet', rarity: 2, name: 'Korona Zwiadowcy', hp: 1, reveal: 2, text: '+1 Ż bohatera w bitwie. Na początku tury odkrywa pola w promieniu 2 od bohatera.' },
  { id: 'giantHelm', slot: 'helmet', rarity: 3, name: 'Hełm Olbrzyma', hp: 6, speed: -1, text: '+6 Ż bohatera w bitwie, ale −1 S.' },
  { id: 'blade1', slot: 'weapon', rarity: 1, name: 'Stalowy Miecz', attack: 1, text: '+1 A bohatera w bitwie.' },
  { id: 'hunterBlade', slot: 'weapon', rarity: 2, name: 'Ostrze Łowcy', attack: 1, vsWounded: 1, text: '+1 A bohatera w bitwie, a przeciw rannym wrogom jeszcze +1 A.' },
  { id: 'blade2', slot: 'weapon', rarity: 3, name: 'Ostrze Zorzy', attack: 2, vsWounded: 1, text: '+2 A bohatera w bitwie, a przeciw rannym wrogom jeszcze +1 A.' },
  { id: 'mail1', slot: 'armor', rarity: 1, name: 'Kolczuga', hp: 2, text: '+2 Ż bohatera w bitwie.' },
  { id: 'thornMail', slot: 'armor', rarity: 2, name: 'Kolczuga Cierni', hp: 2, thorns: 1, text: '+2 Ż bohatera w bitwie. Wróg, który trafi bohatera w zwarciu, sam traci 1 Ż.' },
  { id: 'mail2', slot: 'armor', rarity: 3, name: 'Zbroja Strażnika', hp: 4, thorns: 1, text: '+4 Ż bohatera w bitwie. Wróg, który trafi bohatera w zwarciu, sam traci 1 Ż.' },
  { id: 'buckler', slot: 'shield', rarity: 1, name: 'Puklerz', defense: 1, text: 'Obrona 1: każdy cios zadany bohaterowi jest o 1 słabszy (ale zabiera co najmniej 1).' },
  { id: 'watchShield', slot: 'shield', rarity: 2, name: 'Tarcza Czujności', defense: 2, text: 'Obrona 2: każdy cios zadany bohaterowi jest o 2 słabszy (ale zabiera co najmniej 1).' },
  { id: 'treeAegis', slot: 'shield', rarity: 3, name: 'Egida Drzewa', defense: 3, firstHit: true, text: 'Obrona 3: każdy cios zadany bohaterowi jest o 3 słabszy (ale zabiera co najmniej 1). Pierwszy cios w bitwie zabiera mu tylko połowę.' },
  { id: 'boots1', slot: 'boots', rarity: 1, name: 'Buty Wędrowca', speed: 1, text: '+1 S bohatera w bitwie.' },
  { id: 'trapperBoots', slot: 'boots', rarity: 2, name: 'Trzewiki Trapera', trapper: true, text: 'Na mapie każde pole kosztuje bohatera 1 punkt ruchu: trudny teren go nie spowalnia.' },
  { id: 'boots2', slot: 'boots', rarity: 3, name: 'Skrzydlate Sandały', speed: 1, move: 1, text: '+1 S w bitwie i +1 punkt ruchu na mapie.' },
];
export const ARTIFACT_BY_ID: Record<string, ArtifactDef> = Object.fromEntries(ARTIFACTS.map((a) => [a.id, a]));

/** How often each rarity turns up (common, rare, legendary), by where the artifact comes from. Provisional: tune with the simulations. */
export const ARTIFACT_ODDS = {
  chest: [60, 30, 10],
  guardian: [70, 25, 5],
} as const;

/** `defense` of an artifact in this battle's numbers: it is written for the digital Expedition (scale 3). */
export const defenseOf = (points: number, scale: number) => Math.max(1, Math.round((points * scale) / STAT_SCALE));

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

export const gearOf = (hero: Pick<HeroState, 'gear'>): ArtifactDef[] => Object.values(hero.gear ?? {}).map((id) => ARTIFACT_BY_ID[id]).filter(Boolean);

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
    awardXp(state, hero, SITE.shrineXp, 'kapliczka');
  } else if (site.kind === 'camp') {
    const f = state.factions[hero.faction];
    const fallen = f.supportsDead[0];
    if (fallen) {
      f.supportsDead.splice(0, 1);
      f.supportsAlive.push(fallen);
      log(state, 'info', `${name} wynajmuje najemników: wraca ${UNITS[fallen].name}.`);
    } else {
      log(state, 'info', `${name} zagląda do obozu najemników, ale nikt nie poległ.`);
      awardXp(state, hero, 1, 'obóz najemników');
    }
  } else {
    giveArtifact(state, hero, drawArtifact(state, hero, ARTIFACT_ODDS.chest, 0x2545f491), 'skrzynia');
  }
}

/** An artifact drawn from the game's seed (not from the game's own generator, so it never shifts the rest): first the rarity by `odds`, then one of that rarity. */
export function drawArtifact(state: GameState, hero: HeroState, odds: readonly number[], salt: number): ArtifactDef {
  const rng = new Rng((state.setup.seed ^ salt ^ (state.round * 131 + hero.id.length * 17 + Object.keys(hero.gear ?? {}).length)) | 0);
  let roll = rng.int(odds.reduce((a, b) => a + b, 0));
  let rarity = 1;
  for (let i = 0; i < odds.length; i++) {
    if (roll < odds[i]) {
      rarity = i + 1;
      break;
    }
    roll -= odds[i];
  }
  return rng.pick(ARTIFACTS.filter((a) => a.rarity === rarity));
}

/** Whether `art` is worth putting on: the slot is empty or holds something of a lower rarity. */
export function improves(hero: Pick<HeroState, 'gear'>, art: ArtifactDef): boolean {
  const current = hero.gear?.[art.slot] ? ARTIFACT_BY_ID[hero.gear[art.slot]!] : null;
  return !current || current.rarity < art.rarity;
}

/** How many artifacts a hero can carry in the backpack besides the five it wears. */
export const PACK_SIZE = 4;
export const packOf = (hero: Pick<HeroState, 'pack'>): ArtifactDef[] => (hero.pack ?? []).map((id) => ARTIFACT_BY_ID[id]).filter(Boolean);
const packRoom = (hero: Pick<HeroState, 'pack'>) => (hero.pack?.length ?? 0) < PACK_SIZE;

/** Puts the artifact on; what sat in the slot goes into the backpack (or is left behind when the backpack is full). */
function wear(state: GameState, hero: HeroState, art: ArtifactDef): void {
  const old = hero.gear?.[art.slot];
  hero.gear = { ...hero.gear, [art.slot]: art.id };
  if (!old) return;
  if (packRoom(hero)) hero.pack = [...(hero.pack ?? []), old];
  else log(state, 'item', `${UNITS[hero.id].name} zostawia artefakt ${ARTIFACT_BY_ID[old].name}: plecak jest pełny.`, hero.faction);
}

/** A found artifact goes onto the hero (`worn`) or into its backpack; the screen shows it either way. */
function take(state: GameState, hero: HeroState, art: ArtifactDef, source: string, worn: boolean): void {
  if (worn) wear(state, hero, art);
  else hero.pack = [...(hero.pack ?? []), art.id];
  log(state, 'item', `${UNITS[hero.id].name} ${worn ? 'zakłada artefakt' : 'chowa do plecaka artefakt'}: ${art.name} (${art.text}) — źródło: ${source}.`, hero.faction, { type: 'artifact', heroId: hero.id, artifactId: art.id, source, kept: true, ...(worn ? {} : { packed: true }) });
  // What works on the map counts at once on the hero's own turn.
  if (worn && activeHero(state)?.id === hero.id) {
    if (art.reveal) scoutAround(state, hero);
    if (art.move) state.movePoints += art.move;
  }
}

/**
 * The hero puts the artifact on if it beats what sits in its slot (a rarer one); otherwise it goes into the backpack, and when the backpack
 * is full the faction gets a treasure card instead.
 */
export function giveArtifact(state: GameState, hero: HeroState, art: ArtifactDef, source: string): void {
  const name = UNITS[hero.id].name;
  if (improves(hero, art)) return take(state, hero, art, source, true);
  if (packRoom(hero)) return take(state, hero, art, source, false);
  const used = new Set(Object.values(state.items).map((i) => i.kind));
  const rng = new Rng((state.setup.seed ^ 0x1b873593 ^ Object.keys(state.items).length) | 0);
  const kinds = NON_RESURRECTION_ITEMS.filter((k) => !used.has(k));
  if (kinds.length) {
    grantTreasure(state, rng.pick(kinds), hero.faction, hero.id);
    log(state, 'item', `${FACTION_NAMES[hero.faction]}: ${name} nie ma już miejsca na ${art.name} (${source}), więc zamiast niego jest skarb.`, hero.faction, { type: 'artifact', heroId: hero.id, artifactId: art.id, source, kept: false });
  }
}

/**
 * The winner of a fight between heroes takes the beaten hero's artifacts, worn and carried: those that improve its gear are put on, the
 * rest go into the backpack while there is room; what does not fit stays with the loser. Returns how many changed hands.
 */
export function captureGear(state: GameState, winner: HeroState, loser: HeroState): number {
  let taken = 0;
  const source = `zdobycz: ${UNITS[loser.id].name}`;
  for (const slot of SLOTS) {
    const art = loser.gear?.[slot] ? ARTIFACT_BY_ID[loser.gear[slot]!] : null;
    if (!art || !(improves(winner, art) || packRoom(winner))) continue;
    const rest = { ...loser.gear };
    delete rest[slot];
    loser.gear = rest;
    take(state, winner, art, source, improves(winner, art));
    taken++;
  }
  for (const art of packOf(loser)) {
    if (!(improves(winner, art) || packRoom(winner))) continue;
    loser.pack = removeOne(loser.pack ?? [], art.id);
    take(state, winner, art, source, improves(winner, art));
    taken++;
  }
  return taken;
}

const removeOne = (ids: string[], id: string) => {
  const i = ids.indexOf(id);
  return i < 0 ? ids : [...ids.slice(0, i), ...ids.slice(i + 1)];
};

/** The active hero puts on an artifact from its backpack; what it wore in that slot goes into the backpack. */
export function equipArtifact(state: GameState, hero: HeroState, artifactId: string): void {
  const art = ARTIFACT_BY_ID[artifactId];
  if (!art || !hero.pack?.includes(artifactId)) throw new Error('Tego artefaktu nie ma w plecaku.');
  hero.pack = removeOne(hero.pack, artifactId);
  wear(state, hero, art);
  log(state, 'item', `${UNITS[hero.id].name} zakłada z plecaka: ${art.name}.`, hero.faction);
  if (art.reveal && activeHero(state)?.id === hero.id) scoutAround(state, hero);
}

/** The active hero takes an artifact off into its backpack. */
export function unequipArtifact(state: GameState, hero: HeroState, slot: Slot): void {
  const id = hero.gear?.[slot];
  if (!id) throw new Error('To miejsce jest puste.');
  if (!packRoom(hero)) throw new Error('Plecak jest pełny.');
  const rest = { ...hero.gear };
  delete rest[slot];
  hero.gear = rest;
  hero.pack = [...(hero.pack ?? []), id];
  log(state, 'item', `${UNITS[hero.id].name} chowa do plecaka: ${ARTIFACT_BY_ID[id].name}.`, hero.faction);
}

/** Allies the hero can hand an artifact to: living heroes of its faction on the same or a neighbouring hex. */
export function passTargets(state: GameState, hero: HeroState): HeroState[] {
  if (!hero.pos) return [];
  return Object.values(state.heroes).filter((h) => h.id !== hero.id && h.alive && h.faction === hero.faction && h.pos && !h.entering && distance(parseKey(h.pos), parseKey(hero.pos)) <= 1);
}

/** Whether `to` can take the artifact: an empty slot (it is put on at once) or room in the backpack. */
export const canReceive = (to: Pick<HeroState, 'gear' | 'pack'>, art: ArtifactDef) => !to.gear?.[art.slot] || packRoom(to);

/** The active hero hands an artifact (worn or from the backpack) to an ally next to it: put on at once when the ally's slot is empty, otherwise into the ally's backpack. */
export function passArtifact(state: GameState, hero: HeroState, artifactId: string, toHeroId: string): void {
  const art = ARTIFACT_BY_ID[artifactId];
  const to = passTargets(state, hero).find((h) => h.id === toHeroId);
  if (!to) throw new Error('Artefakt można przekazać tylko sojusznikowi na sąsiednim polu.');
  const worn = art && hero.gear?.[art.slot] === artifactId;
  if (!art || !(worn || hero.pack?.includes(artifactId))) throw new Error('Bohater nie ma tego artefaktu.');
  if (!canReceive(to, art)) throw new Error('Sojusznik nie ma miejsca na ten artefakt.');
  if (hero.pack?.includes(artifactId)) hero.pack = removeOne(hero.pack, artifactId);
  else {
    const rest = { ...hero.gear };
    delete rest[art.slot];
    hero.gear = rest;
  }
  if (!to.gear?.[art.slot]) to.gear = { ...to.gear, [art.slot]: art.id };
  else to.pack = [...(to.pack ?? []), art.id];
  log(state, 'item', `${UNITS[hero.id].name} przekazuje artefakt ${art.name}: ${UNITS[to.id].name}.`, hero.faction);
}

/** Gear bonuses in battle (added to the skills' ones). */
export function applyGear(hero: HeroState | undefined, unit: BattleUnit): void {
  if (!hero) return;
  const k = unit.scale ?? 1;
  const worn = gearOf(hero);
  for (const a of worn) {
    unit.status.battleAttackBonus += (a.attack ?? 0) * k;
    unit.status.battleSpeedBonus += a.speed ?? 0;
    unit.hp += (a.hp ?? 0) * k;
    unit.maxHp += (a.hp ?? 0) * k;
  }
  // A hero is never slowed to a standstill by its helmet.
  unit.status.battleSpeedBonus = Math.max(unit.status.battleSpeedBonus, 1 - UNITS[unit.defId].speed);
  const sum = (f: (a: ArtifactDef) => number | undefined) => worn.reduce((s, a) => s + (f(a) ?? 0), 0);
  const defense = sum((a) => a.defense);
  const gear = {
    ...(defense ? { defense: defenseOf(defense, k) } : {}),
    ...(sum((a) => a.thorns) ? { thorns: sum((a) => a.thorns) * k } : {}),
    ...(sum((a) => a.vsWounded) ? { vsWounded: sum((a) => a.vsWounded) * k } : {}),
    ...(worn.some((a) => a.firstHit) ? { firstHit: true as const } : {}),
  };
  if (Object.keys(gear).length) unit.gear = gear;
}

/** A hero's helmet may strengthen its supports. */
export function applySupportGear(hero: HeroState | undefined, unit: BattleUnit): void {
  if (!hero) return;
  const hp = gearOf(hero).reduce((s, a) => s + (a.supportHp ?? 0), 0) * (unit.scale ?? 1);
  unit.hp += hp;
  unit.maxHp += hp;
}

/** Radius of the hexes the hero's gear reveals (0 = none). */
export const gearReveal = (hero: HeroState | undefined) => (hero ? gearOf(hero).reduce((s, a) => Math.max(s, a.reveal ?? 0), 0) : 0);

/** What a step onto `tile` costs this hero: the terrain's cost, or 1 everywhere in Trzewiki Trapera (null = impassable). */
export function heroTileCost(hero: Pick<HeroState, 'gear'> | undefined, tile: Tile): number | null {
  const c = tileCost(tile);
  return c !== null && c > 1 && hero && gearOf(hero).some((a) => a.trapper) ? 1 : c;
}

export const gearMoveBonus = (hero: HeroState | undefined) => (hero ? gearOf(hero).reduce((s, a) => s + (a.move ?? 0), 0) : 0);
