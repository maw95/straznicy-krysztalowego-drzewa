// Level 6 "Imperium" (digital, rule `empire`, built on level 5): the Relic. Odłamki Pierwotnej Iskry (shards) lie on the map; a hero that steps on
// one carries it (it cannot be worn; it is counted apart from the backpack). A hero that beats another hero takes its shards; shards of a hero
// beaten by anybody else fall back onto the map. A faction whose living heroes hold every shard can raise the building of the Pierwotna Iskra in
// one of its settlements (the hero whose turn it is has to stand there): the shards are its price, it gives the faction a great bonus, and in the
// goal 'relic' it wins the game. Every number is provisional. Design: docs/MECHANIKI_I_POZIOMY.md ("Poziom 6").

import { FACTION_NAMES, UNITS, type FactionId } from './data';
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

/** The factions' own mechanics (they work in every level 6 battle) and their trees: three ranks bought with gold and Gwiezdny Pył. */
export const FACTION_MECHANICS = {
  /** Blask Świtu: Życie the most wounded unit of the Przymierza regains at the start of a battle round. */
  dawnHeal: 1,
  /** Rank III of the Przymierza's tree: Życie every unit of the Przymierza starts a battle with on top. */
  dawnStartHp: 1,
  /** Żądza Krwi: Atak every unit of the Horde gains when an enemy falls; Życie regained with it at rank III. */
  hordeAttack: 1,
  hordeHeal: 1,
  /** Price of each rank of a tree. */
  treeCost: [{ gold: 4, dust: 2 }, { gold: 6, dust: 3 }, { gold: 8, dust: 5 }],
};
export const MECHANIC_NAMES: Record<FactionId, string> = { dawn: 'Blask Świtu', horde: 'Żądza Krwi' };
export const MECHANIC_TEXTS: Record<FactionId, string> = {
  dawn: `Na początku każdej rundy bitwy najciężej ranna jednostka Przymierza odzyskuje ${FACTION_MECHANICS.dawnHeal} Ż.`,
  horde: `Gdy w bitwie ginie wróg Hordy, wszystkie jej jednostki dostają +${FACTION_MECHANICS.hordeAttack} A do końca bitwy (raz na bitwę).`,
};
/** What each rank of a tree adds. */
export const TREE_TEXTS: Record<FactionId, [string, string, string]> = {
  dawn: [`Blask Świtu leczy o ${FACTION_MECHANICS.dawnHeal + 1} Ż.`, 'Blask Świtu leczy dwie najciężej ranne jednostki.', `Każda jednostka Przymierza zaczyna bitwę z +${FACTION_MECHANICS.dawnStartHp} Ż.`],
  horde: ['Żądza Krwi działa dwa razy w bitwie.', 'Żądza Krwi działa trzy razy w bitwie.', `Przy Żądzy Krwi jednostki Hordy odzyskują też ${FACTION_MECHANICS.hordeHeal} Ż.`],
};
export const TREE_NAMES: Record<FactionId, [string, string, string]> = {
  dawn: ['Ciepły Świt', 'Dwa Promienie', 'Złoty Poranek'],
  horde: ['Zapach Krwi', 'Szał Bitewny', 'Uczta Zwycięzców'],
};

export const SPARK_NAMES: Record<FactionId, string> = { dawn: 'Sanktuarium Pierwotnej Iskry', horde: 'Czarna Kuźnia Pierwotnej Iskry' };
export const SPARK_TEXTS: Record<FactionId, string> = {
  dawn: `Wszystkie jednostki Przymierza (bohaterowie i pomocnicy) mają +${EMPIRE.sparkHp} Ż w każdej bitwie.`,
  horde: `Wszystkie jednostki Hordy (bohaterowie i pomocnicy) mają +${EMPIRE.sparkAttack} A w każdej bitwie.`,
};

/** How many shards the game has in all (on the map, carried, or already built into the Iskra). */
export const shardTotal = (state: GameState): number => state.kingdom?.shardTotal ?? 0;
/** Shards the living heroes of a faction carry. */
export const shardsOf = (state: GameState, f: FactionId): number => Object.values(state.heroes).filter((h) => h.faction === f && h.alive).reduce((n, h) => n + (h.shards ?? 0), 0);
/** The faction whose settlement holds the building of the Pierwotna Iskra, if it stands. */
export const sparkOwner = (state: GameState): FactionId | null => {
  const s = Object.values(state.kingdom?.settlements ?? {}).find((x) => (x.buildings.spark ?? 0) > 0);
  return s?.owner ?? null;
};
export const hasSpark = (state: GameState, f: FactionId): boolean => Boolean(state.rules.empire) && sparkOwner(state) === f;

/** Whether the faction may raise the Iskra now: every shard of the game is in the hands of its living heroes. */
export const mayBuildSpark = (state: GameState, f: FactionId): boolean => Boolean(state.rules.empire) && shardTotal(state) > 0 && !sparkOwner(state) && shardsOf(state, f) === shardTotal(state);

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
  log(state, 'crystal', `${UNITS[hero.id].name} podnosi Odłamek Pierwotnej Iskry (${FACTION_NAMES[f]}: ${shardsOf(state, f)}/${shardTotal(state)}).`, undefined, { type: 'fx', kind: 'odlamek', hex: hero.pos });
  if (mayBuildSpark(state, f)) log(state, 'crystal', `${FACTION_NAMES[f]} ma wszystkie Odłamki: w swojej osadzie może wznieść ${SPARK_NAMES[f]}.`);
}

/** A fallen hero's shards: the hero that beat it takes them, otherwise they fall onto the map near where it fell. */
export function loseShards(state: GameState, loser: HeroState, winner: HeroState | null, at: HexKey): void {
  const n = loser.shards ?? 0;
  if (!n) return;
  loser.shards = 0;
  if (winner?.alive) {
    winner.shards = (winner.shards ?? 0) + n;
    log(state, 'crystal', `${UNITS[winner.id].name} zabiera pokonanemu Odłamki Pierwotnej Iskry (${n}).`);
    if (mayBuildSpark(state, winner.faction)) log(state, 'crystal', `${FACTION_NAMES[winner.faction]} ma wszystkie Odłamki: w swojej osadzie może wznieść ${SPARK_NAMES[winner.faction]}.`);
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
export function spendShards(state: GameState, f: FactionId): void {
  for (const h of Object.values(state.heroes)) if (h.faction === f) h.shards = 0;
}
