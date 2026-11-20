// Level 6 "Imperium" (digital, rule `empire`, built on level 5): the Relic. Odłamki Pierwotnej Iskry (shards) lie on the map; a hero that steps on
// one carries it (it cannot be worn; it is counted apart from the backpack). A hero that beats another hero takes its shards; shards of a hero
// beaten by anybody else fall back onto the map. A faction whose living heroes hold every shard can raise the building of the Pierwotna Iskra in
// one of its settlements (the hero whose turn it is has to stand there): the shards are its price, it gives the faction a great bonus, and in the
// goal 'relic' it wins the game. Every number is provisional. Design: docs/MECHANIKI_I_POZIOMY.md ("Poziom 6").

import { raceOf } from './teams';
import { byPack, FACTION_PACKS } from './factions';
import { ABILITY, FACTION_NAMES, UNITS, type FactionId, type TeamId } from './data';
import { distance, parseKey, type HexKey } from './hex';
import { log } from './log';
import type { BuildingId } from './kingdom';
import { tileCost } from './map';
import { Rng } from './rng';
import type { GameState, HeroState } from './types';

export const EMPIRE = {
  /** Shards on the map, by map size. */
  shards: { short: 2, medium: 3, long: 4, veryLong: 5, huge: 6, giant: 6 } as Record<string, number>,
  /** The building's bonus: the Sanktuarium gives every unit of the Przymierza Życie, the Czarna Kuźnia every unit of the Horde Atak (board game's scale). */
  sparkHp: 2,
  sparkAttack: 1,
  /** Ołtarz Rogów, the Herds' building: every unit of the Herds has this much more Szybkość. */
  sparkSpeed: 1,
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
  /** Kamień Tętentu (Dzikie Stado): the run (cells before a melee attack) that makes a unit push its target, the shorter run of the third level, the collision damage the second level adds, S the fourth level takes from a collided target. */
  herdsRun: 3,
  herdsRunShort: 2,
  herdsCollision: 1,
  herdsSlow: 1,
  /** Wielkie Pastwiska: gold less for a recruit of tiers 1-3 (first level) and of every tier (second level). */
  pastureDiscount: 1,
  /** Kurhan Wiecznej Warty (Królestwo Umarłych): how many times per battle a fallen support rises at the end of a round, by level (I-IV), and the share of its Życie it comes back with (1 = just 1 Ż, 2 = half, 3 = full). */
  wardRises: [1, 1, 2, 2],
  wardShare: [0, 2, 2, 1],
  /** Ossuarium: gold less for a recruit's resurrection in the hospital (first level); the second level raises the units of tiers 1-2 free. */
  ossuaryDiscount: 1,
  ossuaryFreeTier: 2,
  /** Sala Tarcz (Żelazny Klan): damage taken less from every blow (small scale), how many neighbours a unit needs by level (I-IV), the level at which a unit in formation cannot be moved, and the one at which a melee attacker loses Życie. */
  shieldArmor: 1,
  shieldMates: [2, 1, 1, 1],
  shieldAnchorLevel: 3,
  shieldThornsLevel: 4,
  /** Runiczna Kuźnia: the price of a rune, runes a unit may carry by level (I, II), how many a faction forges in a round. */
  runePrice: { gold: 1, ore: 1 },
  runesPerUnit: [1, 2],
  runesPerRound: 1,
  /** Głęboka Sztolnia: ore a round per settlement with one (I), dust every few rounds per settlement with the second level (II). */
  mineOre: 1,
  mineDust: 1,
  mineDustEvery: 3,
  /** Pałac Szronu (Dwór Wiecznego Szronu): frost a unit needs to freeze, by level (I-IV), the level from which a frozen unit takes one more damage from the next blow, the one from which every frost also takes S. */
  frostThreshold: [3, 2, 2, 2],
  frostBrittleLevel: 3,
  frostSlowLevel: 4,
  /** Frost every enemy starts a battle with when the Court has the Iskra. */
  sparkFrost: 1,
  /** Wieża Zamieci: radius (I, II) in which enemy heroes lose move points on the map, and how many they lose. */
  blizzardRadius: [2, 3],
  blizzardMove: 1,
  /** Warsztat Sideł (Wolna Kompania): hidden traps laid before a battle, by level (I-IV); the level from which a trap that goes off also holds the unit (it cannot move until the end of its next activation); traps the Iskra adds. */
  trapCount: [1, 2, 2, 3],
  trapHoldLevel: 3,
  sparkTraps: 2,
  /** Paserka: gold a chest gives on top (I), and every how many rounds the second level brings a random treasure. */
  fenceChestGold: 1,
  fenceTreasureEvery: 3,
  /** Szlaki Przemytnicze: how many times a round a hero of the Companies may walk through the hex of a guardian or neutrals without a fight. */
  trailsPerRound: 1,
  /** Pałac Mirażu (Pustynne Cesarstwo): mirages put up at the start of a battle, by level (I-IV); the level from which a unit may swap places with its own mirage (once a battle); the level at which a broken mirage blinds its attacker, and by how much (small scale). */
  mirageCount: [1, 2, 2, 2],
  mirageSwapLevel: 3,
  mirageBlindLevel: 4,
  mirageBlind: 1,
  /** Iskra of the Sands: how many of its units the faction may move after both sides have deployed. */
  sparkRearrange: 2,
  /** Szlak Karawan: one gold a round for every this many mines the faction holds (I); the exchange at the market without loss is the second level. */
  caravanMines: 2,
  /** Brama Wydm: every how many rounds a hero standing in a settlement may step through the gate, and how far (hexes) it may go. */
  gateEvery: 3,
  gateReach: 8,
  /** Serce Grzybni (Rój Puszczy): + A of a unit of the Swarm on its mycelium (I); the level from which the cells it attacked from are claimed too (II), the level from
   * which an enemy that ends its move on the mycelium is poisoned (III), and the level from which a unit of the Swarm regains Życie on it at the start of its activation (IV, small scale). */
  myceliumAttack: 1,
  myceliumAttackLevel: 2,
  myceliumPoisonLevel: 3,
  myceliumHealLevel: 4,
  myceliumHeal: 1,
  /** Ogród Grzybów: wood and ore from every settlement with the garden, every `gardenEvery[level - 1]` rounds. */
  gardenEvery: [2, 1],
  /** Podziemne Korytarze: the radius (hexes) round a settlement with the tunnels in which the free mines go to the Swarm, by level. */
  tunnelRadius: [2, 3],
  /** Świątynia Pływów (Bractwo Przypływu): how far (hexes) the ally may stand for the swap before an activation; I: once a battle, II (`tideRoundLevel`): once a round;
   * III (`tideGuardLevel`): the one that took the place of a wounded ally has armour to the end of the round; IV (`tideHealLevel`): both regain `tideHeal` Życie (small scale). */
  tideRange: 2,
  tideRoundLevel: 2,
  tideGuardLevel: 3,
  tideHealLevel: 4,
  tideHeal: 1,
  /** Iskra of the Tides: the pearl shield every unit of the faction starts each battle with (damage of the blows it soaks up, small scale). */
  sparkPearl: 2,
  /** Perłowe Ławice: gold a round from every settlement with the banks (I), and Pył every `pearlDustEvery` rounds with the second level. */
  pearlGold: 1,
  pearlDust: 1,
  pearlDustEvery: 4,
  /** Latarnia Morska: the radius (hexes) round a settlement with the lighthouse that is revealed at the start of every round, by level. */
  lighthouseRadius: [3, 5],
};
export const MECHANIC_NAMES: Record<FactionId, string> = byPack((p) => p.mechanic.name);
export const MECHANIC_TEXTS: Record<FactionId, string> = {
  dawn: `Na początku każdej rundy bitwy najciężej ranna jednostka Przymierza odzyskuje ${FACTION_MECHANICS.dawnHeal} Ż.`,
  horde: `Gdy w bitwie ginie wróg Hordy, wszystkie jej jednostki dostają +${FACTION_MECHANICS.hordeAttack} A do końca bitwy (raz na bitwę).`,
  clans: `Jednostka Klanu, która stoi obok co najmniej ${FACTION_MECHANICS.shieldMates[0]} sojuszników, ma −${FACTION_MECHANICS.shieldArmor} obrażeń z każdego ciosu; kolejne poziomy Sali Tarcz osłabiają ten warunek, a w szyku nie da się jej odepchnąć i kto uderza ją wręcz, traci Ż.`,
  undead: `Na końcu każdej rundy bitwy poległy pomocnik Umarłych wstaje na arenie (jego najtańszy; bohaterowie nie wstają); liczba wstań i Ż, z którym wracają, rosną z poziomem Kurhanu.`,
  frost: `Każdy cios jednostki Dworu nakłada na cel 1 szron; przy ${FACTION_MECHANICS.frostThreshold[0]} szronach cel zamarza (traci następną aktywację, szron znika). Kolejne poziomy Pałacu Szronu skracają próg, a zamrożony kruszeje i traci Szybkość.`,
  free: `Przed bitwą Kompania kładzie na swojej połowie ukryte pułapki (${FACTION_MECHANICS.trapCount[0]} na pierwszym poziomie Warsztatu Sideł, więcej na kolejnych); wróg, który wejdzie na pułapkę, dostaje ${ABILITY.trapDamage} obrażeń i kończy ruch, a od trzeciego poziomu nie rusza się też do końca następnej aktywacji. Pułapek wroga nie widać, dopóki nie zadziałają.`,
  herds: `Jednostka Stada, która przed atakiem wręcz przebiegła co najmniej ${FACTION_MECHANICS.herdsRun} pola, odpycha cel o 1 pole; cel, który w coś uderzy, dostaje obrażenia.`,
  tides: `Raz na bitwę jednostka Bractwa przed swoją aktywacją zamienia się miejscami z sojusznikiem w zasięgu ${FACTION_MECHANICS.tideRange} pól (ranny cofa się, świeży wchodzi). Kolejne poziomy Świątyni Pływów: zamiana raz na rundę, pancerz do końca rundy dla tego, kto wszedł na miejsce rannego, i +${FACTION_MECHANICS.tideHeal} Ż dla obu po zamianie.`,
  swarm: `Pola rozstawienia Roju i pola, na których zginęła jakakolwiek jednostka, porasta grzybnia; jednostka Roju na grzybni ma +${FACTION_MECHANICS.myceliumAttack} A. Kolejne poziomy Serca Grzybni: grzybnia także na polach, z których Rój atakował, trucizna dla wroga, który skończy ruch na grzybni, i +${FACTION_MECHANICS.myceliumHeal} Ż dla jednostki Roju na grzybni na początku jej aktywacji.`,
  sands: `Na początku bitwy Cesarstwo stawia na swojej połowie ${FACTION_MECHANICS.mirageCount[0]} miraż: atrapę jednej ze swoich jednostek (nie bohatera), której wróg nie odróżni od prawdziwej. Atak w miraż przepada, a miraż znika; nie atakuje. Kolejne poziomy Pałacu Mirażu dają drugi miraż, zamianę miejsc jednostki z jej mirażem (raz na bitwę) i oślepianie tego, kto rozbił miraż.`,
};

/** The best level of the faction's mechanic building (Kapliczka Świtu, Jama Krwi) among the settlements it holds: 0 means it has no Blask Świtu or Żądza Krwi at all. */
export const mechanicLevel = (state: GameState, f: TeamId): number => {
  const key = FACTION_PACKS[raceOf(state, f)].mechanic.building as BuildingId;
  return Math.max(0, ...Object.values(state.kingdom?.settlements ?? {}).filter((s) => s.owner === f).map((s) => s.buildings[key] ?? 0));
};
/** The summed level of a faction's building over its settlements (Szkółka Drzewa, Szabrownia). */
export const summedLevel = (state: GameState, f: TeamId, key: 'nursery' | 'plunder'): number =>
  Object.values(state.kingdom?.settlements ?? {}).filter((s) => s.owner === f).reduce((n, s) => n + (s.buildings[key] ?? 0), 0);

export const SPARK_NAMES: Record<FactionId, string> = byPack((p) => p.sparkName);
export const SPARK_TEXTS: Record<FactionId, string> = {
  dawn: `Wszystkie jednostki Przymierza (bohaterowie i pomocnicy) mają +${EMPIRE.sparkHp} Ż w każdej bitwie.`,
  horde: `Wszystkie jednostki Hordy (bohaterowie i pomocnicy) mają +${EMPIRE.sparkAttack} A w każdej bitwie.`,
  herds: `Wszystkie jednostki Stada (bohaterowie i pomocnicy) mają +${EMPIRE.sparkSpeed} S w każdej bitwie.`,
  clans: `Wszystkie jednostki Klanu (bohaterowie i pomocnicy) mają pancerz ${FACTION_MECHANICS.shieldArmor}: −${FACTION_MECHANICS.shieldArmor} obrażeń z każdego ciosu.`,
  frost: `Wrogowie zaczynają każdą bitwę z ${FACTION_MECHANICS.sparkFrost} szronem.`,
  free: `Kompania zaczyna każdą bitwę z ${FACTION_MECHANICS.sparkTraps} dodatkowymi ukrytymi pułapkami.`,
  tides: `Każda jednostka Bractwa zaczyna bitwę z Perłową Tarczą, która pochłania ${FACTION_MECHANICS.sparkPearl} obrażenia z ciosów.`,
  swarm: 'Grzybnia pokrywa pola rozstawienia Roju i środkową kolumnę areny od początku każdej bitwy.',
  sands: `Po rozstawieniu obu stron Cesarstwo może przestawić do ${FACTION_MECHANICS.sparkRearrange} swoich jednostek w swojej strefie.`,
  undead: 'Wszystkie jednostki Umarłych (bohaterowie i pomocnicy) są odporne na truciznę, klątwy, spowolnienia i unieruchomienie.',
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

/** Shards go onto the map when the game is made: spread out, away from the bases, on hexes nothing else stands on; their hexes stay covered like any others until a hero discovers them. */
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
