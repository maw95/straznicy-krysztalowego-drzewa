// Level 6 "Imperium" (digital, rule `empire`, built on level 5): the Relic. Odłamki Pierwotnej Iskry (shards) lie on the map; a hero that steps on
// one carries it (it cannot be worn; it is counted apart from the backpack). A hero that beats another hero takes its shards; shards of a hero
// beaten by anybody else fall back onto the map. A faction whose living heroes hold every shard can raise the building of the Pierwotna Iskra in
// one of its settlements (the hero whose turn it is has to stand there): the shards are its price, it gives the faction a great bonus, and in the
// goal 'relic' it wins the game. Every number is provisional. Design: docs/MECHANIKI_I_POZIOMY.md ("Poziom 6").

import { raceOf } from './teams';
import { byPack } from './factions';
import { FACTION_NAMES, UNITS, type FactionId, type TeamId } from './data';
import { distance, parseKey, type HexKey } from './hex';
import { log } from './log';
import { tileCost } from './map';
import { Rng } from './rng';
import type { GameState, HeroState } from './types';

export const EMPIRE = {
  /** Shards on the map, by map size. */
  shards: { short: 2, medium: 3, long: 4, veryLong: 5, huge: 6, giant: 6 } as Record<string, number>,
  /** The building's bonus: the Sanktuarium gives every unit of the Przymierza Życie, the Czarna Kuźnia every unit of the Horde Atak (board game's scale). */
  sparkHp: 2,
  sparkAttack: 1,
};

/** The factions' own mechanics (Blask Świtu and Żądza Krwi work in a level 6 battle once the faction has the building that gives them: Kapliczka Świtu, Jama Krwi) and the numbers of their buildings. */
export const FACTION_MECHANICS = {
  /** Blask Świtu: Życie the most wounded unit of the Przymierza regains at the start of a battle round. */
  dawnHeal: 1,
  /** Level IV of the Kapliczka Świtu: Życie every unit of the Przymierza starts a battle with on top. */
  dawnStartHp: 1,
  /** Żądza Krwi: Atak every unit of the Horde gains when an enemy falls; Życie regained with it at level IV of the Jama Krwi. */
  hordeAttack: 1,
  hordeHeal: 1,
  /** Szabrownia: gold per building after a won fight against a hero or a guardian. */
  plunderGold: 2,
  /** Szkółka Drzewa: wood per round for each level (summed over the settlements). */
  nurseryWood: 1,
};
export const MECHANIC_NAMES: Record<FactionId, string> = byPack((p) => p.mechanic.name);
export const MECHANIC_TEXTS: Record<FactionId, string> = {
  dawn: `Na początku każdej rundy bitwy najciężej ranna jednostka Przymierza odzyskuje ${FACTION_MECHANICS.dawnHeal} Ż.`,
  horde: `Gdy w bitwie ginie wróg Hordy, wszystkie jej jednostki dostają +${FACTION_MECHANICS.hordeAttack} A do końca bitwy (raz na bitwę).`,
};

/** The best level of the faction's mechanic building (Kapliczka Świtu, Jama Krwi) among the settlements it holds: 0 means it has no Blask Świtu or Żądza Krwi at all. */
export const mechanicLevel = (state: GameState, f: TeamId): number => {
  const key = raceOf(state, f) === 'dawn' ? 'shrine' : 'bloodPit';
  return Math.max(0, ...Object.values(state.kingdom?.settlements ?? {}).filter((s) => s.owner === f).map((s) => s.buildings[key] ?? 0));
};
/** The summed level of a faction's building over its settlements (Szkółka Drzewa, Szabrownia). */
export const summedLevel = (state: GameState, f: TeamId, key: 'nursery' | 'plunder'): number =>
  Object.values(state.kingdom?.settlements ?? {}).filter((s) => s.owner === f).reduce((n, s) => n + (s.buildings[key] ?? 0), 0);

export const SPARK_NAMES: Record<FactionId, string> = byPack((p) => p.sparkName);
export const SPARK_TEXTS: Record<FactionId, string> = {
  dawn: `Wszystkie jednostki Przymierza (bohaterowie i pomocnicy) mają +${EMPIRE.sparkHp} Ż w każdej bitwie.`,
  horde: `Wszystkie jednostki Hordy (bohaterowie i pomocnicy) mają +${EMPIRE.sparkAttack} A w każdej bitwie.`,
};

/** How many shards the game has in all (on the map, carried, or already built into the Iskra). */
export const shardTotal = (state: GameState): number => state.kingdom?.shardTotal ?? 0;
/** Shards the living heroes of a faction carry. */
export const shardsOf = (state: GameState, f: TeamId): number => Object.values(state.heroes).filter((h) => h.faction === f && h.alive).reduce((n, h) => n + (h.shards ?? 0), 0);
/** The faction whose settlement holds the building of the Pierwotna Iskra, if it stands. */
export const sparkOwner = (state: GameState): TeamId | null => {
  const s = Object.values(state.kingdom?.settlements ?? {}).find((x) => (x.buildings.spark ?? 0) > 0);
  return s?.owner ?? null;
};
export const hasSpark = (state: GameState, f: TeamId): boolean => Boolean(state.rules.empire) && sparkOwner(state) === f;

/** Whether this hero may raise the Iskra (standing in a settlement of its faction is checked by the build action): it alone carries every shard of the game. */
export const mayBuildSpark = (state: GameState, hero: HeroState): boolean => Boolean(state.rules.empire) && hero.alive && shardTotal(state) > 0 && !sparkOwner(state) && (hero.shards ?? 0) === shardTotal(state);

/** The hero a faction's shards are gathered at: the one carrying most, then the one nearest to an own settlement, then by id (all bots agree on it). */
export function shardCollector(state: GameState, f: TeamId): HeroState | null {
  const own = Object.values(state.kingdom?.settlements ?? {}).filter((s) => s.owner === f).map((s) => parseKey(s.at));
  const away = (h: HeroState) => Math.min(99, ...own.map((p) => distance(p, parseKey(h.pos))));
  const carriers = Object.values(state.heroes).filter((h) => h.faction === f && h.alive && h.pos && (h.shards ?? 0) > 0);
  return carriers.sort((a, b) => (b.shards ?? 0) - (a.shards ?? 0) || away(a) - away(b) || (a.id < b.id ? -1 : 1))[0] ?? null;
}

/** Shards go onto the map when the game is made: spread out, away from the bases, on hexes nothing else stands on; every side sees where they lie. */
export function placeShards(state: GameState): void {
  const k = state.kingdom;
  if (!k || !state.rules.empire) return;
  const rng = new Rng((state.setup.seed ^ 0x6d2b79f5) | 0);
  const want = EMPIRE.shards[state.setup.mapSize] ?? 3;
  const homes = Object.values(state.tiles).filter((t) => t.home).map((t) => parseKey(t.key));
  const far = (key: HexKey, n: number) => homes.every((h) => distance(h, parseKey(key)) > n);
  k.shards = {};
  for (const [clear, gap] of [[2, 2], [1, 1], [1, 0], [0, 0]] as const) {
    const free = rng.shuffle(Object.values(state.tiles).filter((t) => !t.home && !t.tree && !t.crystalId && !t.site && !t.place && !t.treasureId && t.terrain !== 'bridge' && tileCost(t) !== null && far(t.key, clear)));
    for (const t of free) {
      if (Object.keys(k.shards).length >= want) break;
      if (Object.keys(k.shards).some((c) => distance(parseKey(c), parseKey(t.key)) <= gap)) continue;
      k.shards[t.key] = 1;
      state.tiles[t.key].place = { kind: 'shard', id: t.key };
      state.tiles[t.key].revealed = true;
    }
  }
  k.shardTotal = Object.keys(k.shards).length;
}

/** A hero that ends up on a shard's hex takes it. */
export function pickUpShard(state: GameState, hero: HeroState): void {
  const k = state.kingdom;
  const n = k?.shards?.[hero.pos];
  if (!k?.shards || !n) return;
  delete k.shards[hero.pos];
  if (state.tiles[hero.pos].place?.kind === 'shard') delete state.tiles[hero.pos].place;
  hero.shards = (hero.shards ?? 0) + n;
  const f = hero.faction;
  log(state, 'crystal', `${UNITS[hero.id].name} podnosi Odłamek Pierwotnej Iskry (${FACTION_NAMES[raceOf(state, f)]}: ${shardsOf(state, f)}/${shardTotal(state)}).`, undefined, { type: 'fx', kind: 'odlamek', hex: hero.pos });
  if (mayBuildSpark(state, hero)) log(state, 'crystal', `${UNITS[hero.id].name} niesie wszystkie Odłamki: w osadzie ${FACTION_NAMES[raceOf(state, f)]} może wznieść ${SPARK_NAMES[raceOf(state, f)]}.`);
}

/** A fallen hero's shards: the hero that beat it takes them, otherwise they fall onto the map near where it fell. */
export function loseShards(state: GameState, loser: HeroState, winner: HeroState | null, at: HexKey): void {
  const n = loser.shards ?? 0;
  if (!n) return;
  loser.shards = 0;
  if (winner?.alive) {
    winner.shards = (winner.shards ?? 0) + n;
    log(state, 'crystal', `${UNITS[winner.id].name} zabiera pokonanemu Odłamki Pierwotnej Iskry (${n}).`);
    if (mayBuildSpark(state, winner)) log(state, 'crystal', `${UNITS[winner.id].name} niesie wszystkie Odłamki: w osadzie ${FACTION_NAMES[raceOf(state, winner.faction)]} może wznieść ${SPARK_NAMES[raceOf(state, winner.faction)]}.`);
    return;
  }
  const k = state.kingdom!;
  k.shards ??= {};
  const origin = parseKey(at);
  const spots = Object.values(state.tiles)
    .filter((t) => !t.home && !t.place && tileCost(t) !== null)
    .sort((a, b) => distance(origin, parseKey(a.key)) - distance(origin, parseKey(b.key)) || (a.key < b.key ? -1 : 1));
  const spot = spots[0];
  if (!spot) return;
  k.shards[spot.key] = (k.shards[spot.key] ?? 0) + n;
  spot.place = { kind: 'shard', id: spot.key };
  spot.revealed = true;
  log(state, 'crystal', `Odłamki Pierwotnej Iskry (${n}) upadają na pole bitwy.`);
}

/** The price of the Iskra is paid: every shard the faction's heroes carry is used up. */
export function spendShards(state: GameState, f: TeamId): void {
  for (const h of Object.values(state.heroes)) if (h.faction === f) h.shards = 0;
}
