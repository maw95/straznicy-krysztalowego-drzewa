// Game content: units, guardians, treasures and terrain.
// Numbers started from docs/zrodla_zasad/Straznicy_Krysztalowego_Drzewa_Specyfikacja_dla_AI.md
// and were tuned with simulations (docs/NOTATKI_DLA_AGENTA_PLANSZOWKI.md, section 7).
// They are TEST values meant to be tuned, so the
// engine never hard-codes them — it always reads from these tables.

export type FactionId = 'dawn' | 'horde';
export type Side = FactionId | 'neutral';
export type UnitKind = 'hero' | 'support' | 'neutral';
export type MovementType = 'walk' | 'fly';
export type AttackType = 'melee' | 'ranged';

export type AbilityId =
  | 'sunburst' // Słoneczny Blask
  | 'lightCharge' // Szarża Światła (passive)
  | 'guardian' // Opiekun Gaju (reaction)
  | 'duckFury' // Kacza Furia (passive; easter egg hero)
  | 'entanglingRoots' // Splątane Korzenie
  | 'giftOfLife' // Dar Życia
  | 'airDash' // Powietrzny Zryw
  | 'fireBreath' // Ognisty Oddech
  | 'bloodCall' // Zew Krwi (passive)
  | 'hardHead' // Twardogłowy (reaction)
  | 'curse' // Złowroga Klątwa
  | 'web' // Pajęcze Sidła
  | 'nightAmbush' // Nocna Zasadzka
  | 'boulder' // Miażdżący Głaz (Cyklop)
  | 'nestLeap' // Łupieżczy Nalot (Gryf)
  | 'manyHeads' // Paszcze Otchłani (Hydra)
  // Guardians' duel cards (the light-blue back): abilities that count in a duel on the board.
  | 'stoneSkin' // Kamienna Skóra (Cyklop)
  | 'thiefClaw' // Złodziejski Szpon (Gryf)
  | 'regrowth' // Odrastające Głowy (Hydra)
  // Neutral encounters (digital ruleset): weak units and bosses of the three motifs (docs/ZASADY_CYFROWE.md, "Neutralni").
  | 'none' // no ability (Kraken's tentacles)
  | 'shardBurst' // Rozprysk (Kruszyniec)
  | 'burrow' // Podkop (Podkopnik)
  | 'dive' // Nurkowanie (Orzeł Skalny)
  | 'backstab' // Zajście od tyłu (Harpia)
  | 'grab' // Chwyt (Szczypiec)
  | 'bogRegrowth' // Bagienne Odrastanie (Bagienny Pełzacz)
  | 'runeGolem' // Kamienna Skóra, Runiczny Rdzeń and Trzęsienie (Kamienny Golem)
  | 'stormKing' // Teleport, Pole Naładowane and Wyładowanie (Król Burzy)
  | 'tentacles'; // Macki (Kraken)

export interface UnitDef {
  id: string;
  name: string;
  side: Side;
  kind: UnitKind;
  hp: number;
  attack: number;
  speed: number;
  movement: MovementType;
  attackType: AttackType;
  ability: AbilityId;
  abilityName: string;
  abilityText: string;
  /** Digital ruleset only: 2 = a large unit lying on two cells (head + tail). Default 1. */
  size?: 1 | 2;
  /** A guardian's second card, for the duel on the board: less Życie and an ability that works one on one. */
  duel?: DuelCard;
}

export interface DuelCard {
  hp: number;
  ability: AbilityId;
  abilityName: string;
  abilityText: string;
}

/**
 * Numbers used by abilities. TEST values like the stats: the engine and the card texts
 * read them from here.
 */
export const ABILITY = {
  sunburstBonus: 1,
  /** Słoneczny Blask: the dragon's own bonus. */
  sunburstSelfBonus: 3,
  lightChargeBonus: 2,
  lightChargeMinMove: 4,
  rootsSlow: 2,
  giftOfLifeHeal: 3,
  airDashRange: 3,
  /** Zew Krwi: bonus to every attack on an enemy that is already wounded. */
  bloodCallBonus: 1,
  hardHeadIgnore: 2,
  /** Opiekun Gaju: damage the bear ignores from the blow it takes over. */
  guardianIgnore: 3,
  curseMinus: 1,
  webRange: 4,
  nightAmbushBonus: 3,
  nestLeapRange: 4,
  /** Kamienna Skóra: damage the Cyclops ignores from every blow in a duel. */
  stoneSkinIgnore: 1,
  /** Złodziejski Szpon: Życie the Griffin takes back with every blow that wounds in a duel. */
  thiefClawHeal: 1,
  /** Odrastające Głowy: Życie the Hydra gets back at the start of each of its activations in a duel. */
  regrowthHeal: 2,
  /** Rozprysk: damage a dying Kruszyniec deals to every neighbouring unit (small scale: multiply by `scaleOf`). */
  shardBurstDamage: 1,
  /** Podkop: how far the Podkopnik may come up from where it dug in. */
  burrowRange: 4,
  /** Nurkowanie: the Eagle must have flown at least this far for the bonus. */
  diveMinMove: 3,
  diveBonus: 1,
  /** Zajście od tyłu: bonus for a blow from behind (small scale). */
  backstabBonus: 1,
  /** Bagienne Odrastanie: Życie regained at the start of each activation (hp scale). */
  bogRegrowthHeal: 1,
  /** Kamienny Golem: damage ignored from every blow while its rune core is covered (small scale), and what the Trzęsienie deals (small scale). */
  runeSkinIgnore: 2,
  quakeDamage: 1,
  /** Król Burzy: teleport range, how many rounds the charged field lasts (this one and the next), field and Wyładowanie damage (small scale). */
  stormTeleportRange: 6,
  chargedFieldRounds: 2,
  chargedFieldDamage: 1,
  dischargeDamage: 1,
};

/**
 * Hero milestones (digital Expedition, hero growth): the abilities' numbers at the start and after levels 3, 6 and 9 (small scale; the battle scale
 * multiplies them). Index 0 is the base value of `ABILITY`. Provisional: tune with the simulations.
 */
export const ABILITY_TIERS = {
  sunburstBonus: [ABILITY.sunburstBonus, 2, 2, 2],
  sunburstSelfBonus: [ABILITY.sunburstSelfBonus, 3, 4, 5],
  lightChargeBonus: [ABILITY.lightChargeBonus, 3, 4, 5],
  guardianIgnore: [ABILITY.guardianIgnore, 5, 5, 7],
  bloodCallBonus: [ABILITY.bloodCallBonus, 2, 3, 4],
  hardHeadIgnore: [ABILITY.hardHeadIgnore, 3, 4, 5],
  /** Ognisty Oddech: extra Atak against both targets. */
  breathBonus: [0, 1, 2, 2],
  /** Kacza Furia: Życie the duck takes back when its blow kills. */
  duckKillHeal: [0, 1, 2, 3],
} as const;
/** From this milestone on: the bear guards any ally (not only a neighbour), the Black Dragon may breathe twice, the duck's extra activation is faster. */
export const MILESTONE_TIER = { bearAnyAlly: 2, breathTwice: 3, duckHaste: 3 } as const;

const u = (d: UnitDef): UnitDef => d;

/**
 * Digital ruleset: a shooter that moves has used its turn (no move + shot), so shooters hit harder to make up for it.
 * Provisional: tune with `make sim-tabele` once the digital edition has its own balance tables.
 */
export const DIGITAL_RANGED_BONUS = 1;

/**
 * Digital ruleset: the numbers of a unit's battle stats that differ from the board game's (the rest stay as in UNITS).
 * Each Przymierze hero has one trait: the Gold Dragon hits hardest (7 A, brittle), the Ancient Bear has the most life (12 Ż, slow),
 * the Unicorn King is the fastest (10 S). The Black Dragon gets 6 A so that the Horde keeps up. Tuned with `make sim-arena` (SIM_DIGITAL=1):
 * every hero wins 48–52% of arena games, Przymierze 50.0% overall (150 games per line-up pair).
 */
export const DIGITAL_STATS: Record<string, Partial<Pick<UnitDef, 'hp' | 'attack' | 'speed'>>> = {
  goldDragon: { hp: 7, attack: 7, speed: 4 },
  ancientBear: { hp: 12, attack: 4, speed: 3 },
  unicornKing: { hp: 8, attack: 5, speed: 10 },
  blackDragon: { attack: 6 },
};

/**
 * Objective 'control' (digital ruleset): three control points on the map (one in the middle, worth `centreWeight`, one on each side, mirrored,
 * worth 1). A side holds a point while its hero stands on it at the end of the round; the side that holds more points (by worth) for
 * `roundsToWin` rounds in a row wins. At the round limit the side that led for more rounds wins (level goes to the Horde, as the limit does in the
 * crystals game). Tuned with simulations (docs/ZASADY_CYFROWE.md).
 */
export const CONTROL = {
  points: 3,
  centreWeight: 2,
  /** Extra rounds in a row the Przymierze needs: it moves first in a round, so it reaches the middle first (a side that holds the middle from its first turn would otherwise win too often). */
  dawnExtraRounds: 1,
  roundsToWin: { short: 3, medium: 3, long: 4, veryLong: 5, huge: 6, giant: 7 } as Record<MapSize, number>,
};

/**
 * Objective 'survival' (digital ruleset, coop): the Przymierze win when `rounds` rounds have passed with at least one hero alive;
 * the Horde win when every hero falls. Every `waveEvery` rounds the automaton's reserves arrive (a new hero in the Horde base)
 * while it fields fewer heroes than the Przymierze have alive plus `extra`. Tuned with simulations (docs/ZASADY_CYFROWE.md).
 */
export const SURVIVAL = {
  waveEvery: 2,
  extra: 1,
  rounds: { short: 6, medium: 9, long: 14, veryLong: 18, huge: 22, giant: 26 } as Record<MapSize, number>,
};

/**
 * Map shapes other than the triangle (digital ruleset). Rectangle: `width` × `height` hexes, the bases in the middle of the short sides,
 * the Tree in the middle. Ring: hexes at distance `radius - 2` to `radius` from the centre (the lake inside is no map), the Tree and the bases on
 * three corners of the ring, so the three are equally far from each other. Sizes roughly match the triangle's number of hexes.
 */
export const MAP_SHAPES = {
  rectangle: { short: { width: 7, height: 4 }, medium: { width: 9, height: 5 }, long: { width: 13, height: 6 }, veryLong: { width: 15, height: 8 }, huge: { width: 18, height: 10 }, giant: { width: 21, height: 12 } },
  ring: { short: { radius: 3 }, medium: { radius: 4 }, long: { radius: 5 }, veryLong: { radius: 7 }, huge: { radius: 8 }, giant: { radius: 10 } },
  /** Islands: three land masses (the Przymierza's, the Tree's, the Horda's) between two channels; `bridges` hexes of each channel are bridges. */
  islands: { short: { width: 9, height: 5, bridges: 1 }, medium: { width: 11, height: 6, bridges: 2 }, long: { width: 15, height: 7, bridges: 2 }, veryLong: { width: 19, height: 9, bridges: 3 }, huge: { width: 23, height: 11, bridges: 3 }, giant: { width: 27, height: 13, bridges: 4 } },
} as const;

/** The map's round limit is multiplied by this on a shape other than the triangle (the roads are longer, and the limit goes to the Horde). */
export const SHAPE_ROUND_FACTOR = { triangle: 1, rectangle: 1.25, ring: 1.5, islands: 1.7, custom: 2 } as const;

/**
 * Objective 'boss' (digital ruleset): a guardian (the Hydra or the Cyclops) with `hp` Życie sits in a lair in the middle of the map and is
 * challenged like any guardian, but by both sides; the wounds stay between fights, and whoever strikes the last blow wins the game.
 * At the round limit the Horde win (as in the other goals). Tuned with simulations (docs/ZASADY_CYFROWE.md).
 */
export const BOSS = {
  hp: { short: 54, medium: 54, long: 62, veryLong: 92, huge: 104, giant: 116 } as Record<MapSize, number>,
  /** Life is multiplied by this when two Przymierza heroes play (two heroes strike twice as often). */
  twoHeroesFactor: 1.25,
  /** Without the Horde (rules.noHorde) nobody else wounds the Boss or hunts the heroes, so its Życie is multiplied by this. Tuned with `SIM_NOHORDE=1`. */
  noHordeFactor: 1.2,
  /** The neutral bosses (hero growth) are tougher than the Hydra and the Cyclops: their Życie is the table's times this. Tuned with `SIM_OBJECTIVE=boss`. */
  hpFactor: { stoneGolem: 0.5, stormKing: 0.5, kraken: 0.5 } as Record<string, number>,
};

/**
 * Objective 'artifact' (digital ruleset): the artifact lies in the middle of the map; the hero that carries it to its own base wins. The carrier
 * has `carrierSlow` move points fewer (a heavy load), so the other side can catch up. A fallen carrier drops it where it fell. At the round limit
 * the Horde win. Tuned with simulations (docs/ZASADY_CYFROWE.md).
 */
export const ARTIFACT = {
  carrierSlow: 1,
};

/**
 * Family mode (digital ruleset, coop): the hero of a seat marked as a child is a little stronger, so a parent and a child can play on one team
 * without the child holding the team back: `extraHp` more Życie in battle and `extraMove` more move points on the map.
 */
export const FAMILY = { extraHp: 2, extraMove: 1 };

export const UNITS: Record<string, UnitDef> = Object.fromEntries(
  [
    u({ id: 'goldDragon', name: 'Złoty Smok', side: 'dawn', kind: 'hero', size: 2, hp: 9, attack: 5, speed: 4, movement: 'fly', attackType: 'melee', ability: 'sunburst', abilityName: 'Słoneczny Blask', abilityText: `Raz na bitwę: twoje jednostki +${ABILITY.sunburstBonus} A do następnego ataku, sam Smok +${ABILITY.sunburstSelfBonus} A.` }),
    u({ id: 'unicornKing', name: 'Król Jednorożców', side: 'dawn', kind: 'hero', size: 2, hp: 8, attack: 5, speed: 8, movement: 'walk', attackType: 'melee', ability: 'lightCharge', abilityName: 'Szarża Światła', abilityText: `+${ABILITY.lightChargeBonus} A do ataku wykonanego po ruchu o co najmniej ${ABILITY.lightChargeMinMove} pola.` }),
    u({ id: 'ancientBear', name: 'Prastary Niedźwiedź', side: 'dawn', kind: 'hero', size: 2, hp: 11, attack: 4, speed: 4, movement: 'walk', attackType: 'melee', ability: 'guardian', abilityName: 'Opiekun Gaju', abilityText: `Raz na bitwę: przyjmuje cios, który zabiłby jego lub sąsiada, i ignoruje ${ABILITY.guardianIgnore} obrażenia.` }),
    // Easter egg hero (not in FACTION_HEROES): fragile, fast and hits hard; every kill gives her another activation.
    u({ id: 'braveDuck', name: 'Dzielna Kaczka', side: 'dawn', kind: 'hero', hp: 3, attack: 6, speed: 10, movement: 'fly', attackType: 'melee', ability: 'duckFury', abilityName: 'Kacza Furia', abilityText: 'Gdy jej atak zabije wroga, Kaczka od razu aktywuje się jeszcze raz (ruch i atak). Bez limitu na bitwę.' }),
    u({ id: 'elfDruid', name: 'Elf Druid', side: 'dawn', kind: 'support', hp: 4, attack: 1, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'entanglingRoots', abilityName: 'Splątane Korzenie', abilityText: `Raz na bitwę: trafiony wróg ma −${ABILITY.rootsSlow} S w swojej następnej aktywacji.` }),
    u({ id: 'nymph', name: 'Nimfa', side: 'dawn', kind: 'support', hp: 5, attack: 2, speed: 4, movement: 'walk', attackType: 'melee', ability: 'giftOfLife', abilityName: 'Dar Życia', abilityText: `Raz na bitwę: +${ABILITY.giftOfLifeHeal} Ż sojusznikowi, do maksimum.` }),
    u({ id: 'pegasus', name: 'Pegaz', side: 'dawn', kind: 'support', size: 2, hp: 4, attack: 2, speed: 4, movement: 'fly', attackType: 'melee', ability: 'airDash', abilityName: 'Powietrzny Zryw', abilityText: `Raz na bitwę: po ataku odskok do ${ABILITY.airDashRange} pól.` }),
    // Neutral encounters (digital ruleset). Stats are in the small scale, like the guardians'; see docs/ZASADY_CYFROWE.md.
    u({ id: 'shardling', name: 'Kruszyniec', side: 'neutral', kind: 'neutral', hp: 8, attack: 2, speed: 2, movement: 'walk', attackType: 'ranged', ability: 'shardBurst', abilityName: 'Rozprysk', abilityText: `Po śmierci rozpryskuje się i rani o ${ABILITY.shardBurstDamage} wszystkie sąsiednie jednostki (także swoje).` }),
    u({ id: 'burrower', name: 'Podkopnik', side: 'neutral', kind: 'neutral', hp: 9, attack: 2, speed: 3, movement: 'walk', attackType: 'melee', ability: 'burrow', abilityName: 'Podkop', abilityText: `Zamiast ruchu znika pod ziemią i wyłania się na dowolnym wolnym polu w odległości do ${ABILITY.burrowRange}; w tej aktywacji nie atakuje.` }),
    u({ id: 'skyEagle', name: 'Orzeł Skalny', side: 'neutral', kind: 'neutral', hp: 7, attack: 2, speed: 6, movement: 'fly', attackType: 'melee', ability: 'dive', abilityName: 'Nurkowanie', abilityText: `Jeśli przed atakiem przeleciał co najmniej ${ABILITY.diveMinMove} pola, zadaje +${ABILITY.diveBonus} obrażeń.` }),
    u({ id: 'harpy', name: 'Harpia', side: 'neutral', kind: 'neutral', hp: 8, attack: 2, speed: 5, movement: 'fly', attackType: 'melee', ability: 'backstab', abilityName: 'Zajście od tyłu', abilityText: `+${ABILITY.backstabBonus} obrażeń, gdy atakuje z tyłu celu.` }),
    u({ id: 'pincer', name: 'Szczypiec', side: 'neutral', kind: 'neutral', hp: 12, attack: 2, speed: 2, movement: 'walk', attackType: 'melee', ability: 'grab', abilityName: 'Chwyt', abilityText: 'Trafiony wróg nie może się ruszyć do końca swojej następnej aktywacji.' }),
    u({ id: 'bogCrawler', name: 'Bagienny Pełzacz', side: 'neutral', kind: 'neutral', hp: 10, attack: 2, speed: 2, movement: 'walk', attackType: 'melee', ability: 'bogRegrowth', abilityName: 'Bagienne Odrastanie', abilityText: `Na początku swojej aktywacji odzyskuje ${ABILITY.bogRegrowthHeal} Ż.` }),
    u({ id: 'stoneGolem', name: 'Kamienny Golem', side: 'neutral', kind: 'neutral', size: 2, hp: 40, attack: 4, speed: 2, movement: 'walk', attackType: 'melee', ability: 'runeGolem', abilityName: 'Runiczny Rdzeń', abilityText: `Kamienna Skóra: każdy cios zadaje o ${ABILITY.runeSkinIgnore} mniej. Gdy straci połowę Życia, rdzeń się odsłania: skóra znika, a po każdym jego ataku Trzęsienie zadaje ${ABILITY.quakeDamage} obrażenie wszystkim wokół.` }),
    u({ id: 'stormKing', name: 'Król Burzy', side: 'neutral', kind: 'neutral', hp: 30, attack: 3, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'stormKing', abilityName: 'Burza', abilityText: `Zamiast ruchu teleportuje się do ${ABILITY.stormTeleportRange} pól. Pole, które opuścił, przez ${ABILITY.chargedFieldRounds} rundy rani o ${ABILITY.chargedFieldDamage} każdego, kto na nie wejdzie. Kto uderzy go z bliska, dostaje ${ABILITY.dischargeDamage}.` }),
    u({ id: 'kraken', name: 'Kraken', side: 'neutral', kind: 'neutral', size: 2, hp: 36, attack: 3, speed: 0, movement: 'walk', attackType: 'melee', ability: 'tentacles', abilityName: 'Macki', abilityText: 'Dopóki żyje choć jedna macka, głowa jest nietykalna.' }),
    u({ id: 'tentacle', name: 'Macka Krakena', side: 'neutral', kind: 'neutral', hp: 6, attack: 2, speed: 0, movement: 'walk', attackType: 'melee', ability: 'none', abilityName: 'Macka', abilityText: 'Bije sąsiadów, nie rusza się.' }),
    u({ id: 'blackDragon', name: 'Czarny Smok', side: 'horde', kind: 'hero', size: 2, hp: 7, attack: 5, speed: 5, movement: 'fly', attackType: 'melee', ability: 'fireBreath', abilityName: 'Ognisty Oddech', abilityText: 'Raz na bitwę: pełny atak w dwóch wrogów stojących w jednej linii.' }),
    u({ id: 'werewolfLord', name: 'Władca Wilkołaków', side: 'horde', kind: 'hero', hp: 8, attack: 5, speed: 7, movement: 'walk', attackType: 'melee', ability: 'bloodCall', abilityName: 'Zew Krwi', abilityText: `+${ABILITY.bloodCallBonus} A do każdego ataku na już rannego wroga.` }),
    u({ id: 'ironFistOgre', name: 'Ogr Żelazna Pięść', side: 'horde', kind: 'hero', size: 2, hp: 10, attack: 4, speed: 5, movement: 'walk', attackType: 'melee', ability: 'hardHead', abilityName: 'Twardogłowy', abilityText: `Raz na bitwę ignoruje do ${ABILITY.hardHeadIgnore} obrażeń z jednego trafienia.` }),
    u({ id: 'goblinShaman', name: 'Goblin Szaman', side: 'horde', kind: 'support', hp: 5, attack: 1, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'curse', abilityName: 'Złowroga Klątwa', abilityText: `Raz na bitwę: trafiony cel ma −${ABILITY.curseMinus} A przy następnym ataku.` }),
    u({ id: 'caveSpider', name: 'Pająk Jaskiniowy', side: 'horde', kind: 'support', hp: 6, attack: 2, speed: 3, movement: 'walk', attackType: 'melee', ability: 'web', abilityName: 'Pajęcze Sidła', abilityText: `Raz na bitwę: wróg do ${ABILITY.webRange} pól nie rusza się w następnej aktywacji.` }),
    u({ id: 'shadowBat', name: 'Nietoperz Cienia', side: 'horde', kind: 'support', hp: 5, attack: 2, speed: 3, movement: 'fly', attackType: 'melee', ability: 'nightAmbush', abilityName: 'Nocna Zasadzka', abilityText: `Raz na bitwę: atak zadaje +${ABILITY.nightAmbushBonus} obrażenia.` }),
    u({ id: 'cyclops', name: 'Cyklop Błyskotek', side: 'neutral', kind: 'neutral', size: 2, hp: 23, attack: 2, speed: 2, movement: 'walk', attackType: 'ranged', ability: 'boulder', abilityName: 'Miażdżący Głaz', abilityText: 'Po każdym ataku odpycha trafionego przeciwnika o 1 pole, jeśli to możliwe.', duel: { hp: 14, ability: 'stoneSkin', abilityName: 'Kamienna Skóra', abilityText: `Każdy cios w Cyklopa zadaje o ${ABILITY.stoneSkinIgnore} mniej obrażeń.` } }),
    u({ id: 'griffin', name: 'Gryf Złodziej Skarbów', side: 'neutral', kind: 'neutral', size: 2, hp: 18, attack: 3, speed: 6, movement: 'fly', attackType: 'melee', ability: 'nestLeap', abilityName: 'Łupieżczy Nalot', abilityText: `Po każdym ataku może odlecieć o maks. ${ABILITY.nestLeapRange} pola.`, duel: { hp: 10, ability: 'thiefClaw', abilityName: 'Złodziejski Szpon', abilityText: `Gdy zada obrażenia, odzyskuje ${ABILITY.thiefClawHeal} Ż.` } }),
    u({ id: 'hydra', name: 'Hydra z Zatopionych Ruin', side: 'neutral', kind: 'neutral', size: 2, hp: 21, attack: 2, speed: 3, movement: 'walk', attackType: 'melee', ability: 'manyHeads', abilityName: 'Paszcze Otchłani', abilityText: 'Każdym atakiem może trafić dwóch sąsiadujących przeciwników.', duel: { hp: 12, ability: 'regrowth', abilityName: 'Odrastające Głowy', abilityText: `Na początku każdej swojej aktywacji odzyskuje ${ABILITY.regrowthHeal} Ż.` } }),
  ].map((d) => [d.id, d]),
);

export const FACTION_HEROES: Record<FactionId, string[]> = {
  dawn: ['goldDragon', 'unicornKing', 'ancientBear'],
  horde: ['blackDragon', 'werewolfLord', 'ironFistOgre'],
};

/** Easter egg heroes: unlocked on the setup screen (click the Dawn crest five times), never drawn by the engine. */
export const SECRET_HEROES: Record<FactionId, string[]> = { dawn: ['braveDuck'], horde: [] };

export const FACTION_SUPPORTS: Record<FactionId, string[]> = {
  dawn: ['elfDruid', 'nymph', 'pegasus'],
  horde: ['goblinShaman', 'caveSpider', 'shadowBat'],
};

export const GUARDIANS = ['cyclops', 'griffin', 'hydra'];
/** Weak neutral units of the digital encounters, two per motif (stone, air, water). */
export const NEUTRAL_WEAK = ['shardling', 'burrower', 'skyEagle', 'harpy', 'pincer', 'bogCrawler'];
/** Neutral bosses of the digital encounters, one per motif. */
export const NEUTRAL_BOSSES = ['stoneGolem', 'stormKing', 'kraken'];

/**
 * Neutral encounters on the adventure map (digital Expedition, hero growth): groups of neutral units guard a hex; the deeper from the bases, the
 * stronger the group and the rarer the reward (docs/ZASADY_CYFROWE.md, "Neutralni"). Each motif has its guardian, two weak units and a boss.
 */
export const ENCOUNTER_MOTIFS = {
  stone: { weak: ['shardling', 'burrower'], guardian: 'cyclops', boss: 'stoneGolem' },
  air: { weak: ['skyEagle', 'harpy'], guardian: 'griffin', boss: 'stormKing' },
  water: { weak: ['pincer', 'bogCrawler'], guardian: 'hydra', boss: 'kraken' },
} as const;
export type EncounterMotif = keyof typeof ENCOUNTER_MOTIFS;
export const ENCOUNTERS = {
  /** How many encounters a map holds, by map size. Provisional: tune with the simulations. */
  count: { short: 2, medium: 3, long: 5, veryLong: 7, huge: 9, giant: 11 } as Record<MapSize, number>,
  /** An encounter stands farther than this from a base and from the Tree. */
  minDistance: 2,
  /** Neutral units that stand beside the Kraken (its tentacles). */
  krakenTentacles: 3,
};

/** Supports a hero takes into a battle on the arena (all of them when fewer are alive). */
export const SUPPORTS_PER_BATTLE = 2;

/** A guardian's Życie in a duel on the board (one hero alone): from its duel card. */
export const guardianDuelHp = (id: string) => UNITS[id].duel?.hp ?? UNITS[id].hp;

export const FACTION_NAMES: Record<Side, string> = {
  dawn: 'Przymierze Świtu',
  horde: 'Mroczna Horda',
  neutral: 'Neutralni strażnicy',
};

export type ItemKind =
  | 'resurrection'
  | 'heal'
  | 'seed'
  | 'damage_scroll'
  | 'sword'
  | 'shield'
  | 'vitality'
  | 'boots'
  | 'horn'
  | 'map'
  | 'lightning'
  | 'hourglass'
  | 'courage_horn'
  | 'teleport'
  | 'stone';

export interface ItemDef {
  kind: ItemKind;
  name: string;
  text: string;
  /** Where the item may be used. */
  usableIn: Array<'map' | 'battle'>;
}

/**
 * Numbers used by treasures. TEST values like the stats: the engine, the bots and the card texts
 * read them from here.
 */
export const ITEM_EFFECT = {
  /** Wielki Eliksir Uzdrowienia: Życie restored, up to the maximum. */
  heal: 6,
  /** Nasiono Drzewa: Życie for every living unit of the side. */
  seedHeal: 2,
  /** Zwój Magicznej Strzały: damage to one target. */
  scrollDamage: 3,
  /** Błyskawica w Butelce: damage to each of up to `lightningTargets` enemies. */
  lightningDamage: 2,
  lightningTargets: 2,
  /** Miecz Bohatera: Atak until the end of the battle. */
  swordAttack: 2,
  /** Eliksir Żywotności: maximum (and current) Życie until the end of the battle. */
  vitalityHp: 4,
  /** Buty Wiatru: Szybkość until the end of the battle. */
  bootsSpeed: 3,
  /** Kamień Ochrony: damage taken off every blow until the end of the battle. */
  stoneReduction: 1,
  /** Róg Odwagi: Atak for the next attack of a unit and one ally next to it. */
  courageAttack: 2,
  /** Magiczna Mapa: hidden hexes revealed. */
  mapReveal: 3,
};

const E = ITEM_EFFECT;

export const ITEMS: Record<ItemKind, ItemDef> = {
  resurrection: { kind: 'resurrection', name: 'Eliksir Odrodzenia', text: 'Wskrzesza 1 poległą jednostkę. Także poza bitwą.', usableIn: ['map', 'battle'] },
  heal: { kind: 'heal', name: 'Wielki Eliksir Uzdrowienia', text: `Usuwa z wybranej jednostki do ${E.heal} punktów obrażeń.`, usableIn: ['battle'] },
  seed: { kind: 'seed', name: 'Nasiono Drzewa', text: `+${E.seedHeal} Ż każdej żyjącej własnej jednostce na arenie.`, usableIn: ['battle'] },
  damage_scroll: { kind: 'damage_scroll', name: 'Zwój Magicznej Strzały', text: `${E.scrollDamage} obrażenia wybranemu celowi.`, usableIn: ['battle'] },
  sword: { kind: 'sword', name: 'Miecz Bohatera', text: `+${E.swordAttack} A jednej jednostce do końca bitwy.`, usableIn: ['battle'] },
  shield: { kind: 'shield', name: 'Tarcza Strażnika', text: 'Neguje wszystkie obrażenia z jednego ataku (reakcja).', usableIn: ['battle'] },
  vitality: { kind: 'vitality', name: 'Eliksir Żywotności', text: `+${E.vitalityHp} maks. Ż jednej jednostce do końca bitwy.`, usableIn: ['battle'] },
  boots: { kind: 'boots', name: 'Buty Wiatru', text: `+${E.bootsSpeed} S jednej jednostce do końca bitwy.`, usableIn: ['battle'] },
  horn: { kind: 'horn', name: 'Róg Strażników', text: 'Wymień pomocnika na żywego z rezerwy ALBO daj żywemu pomocnikowi dodatkową aktywację.', usableIn: ['battle'] },
  map: { kind: 'map', name: 'Magiczna Mapa', text: `Odkryj ${E.mapReveal} wybrane zakryte pola.`, usableIn: ['map'] },
  lightning: { kind: 'lightning', name: 'Błyskawica w Butelce', text: `Do ${E.lightningTargets === 2 ? 'dwóch' : E.lightningTargets} różnych przeciwników otrzymuje po ${E.lightningDamage} obrażenia.`, usableIn: ['battle'] },
  hourglass: { kind: 'hourglass', name: 'Klepsydra Czasu', text: 'Wybrana jednostka wykonuje dodatkowy ruch bez ataku.', usableIn: ['battle'] },
  courage_horn: { kind: 'courage_horn', name: 'Róg Odwagi', text: `+${E.courageAttack} A do następnego ataku jednostki i jednego sąsiedniego sojusznika.`, usableIn: ['battle'] },
  teleport: { kind: 'teleport', name: 'Zwój Teleportacji', text: 'Teleport na wolne pole sąsiadujące z sojusznikiem.', usableIn: ['battle'] },
  stone: { kind: 'stone', name: 'Kamień Ochrony', text: `−${E.stoneReduction} otrzymanych obrażeń z każdego ataku do końca bitwy.`, usableIn: ['battle'] },
};

/**
 * Digital ruleset: what is worn is an artifact, what is used up is an elixir, a scroll, a rune or a horn. The four treasure cards named after
 * gear carry other names (and pictures) there; what they do is unchanged, and the board edition keeps the printed names.
 */
export const DIGITAL_ITEM_NAMES: Partial<Record<ItemKind, string>> = { sword: 'Eliksir Mocy', boots: 'Eliksir Chyżości', shield: 'Zwój Tarczy', stone: 'Runa Ochrony' };

/** A treasure card as the ruleset in play names it. */
export function itemDef(kind: ItemKind, digital: boolean): ItemDef {
  const name = digital ? DIGITAL_ITEM_NAMES[kind] : undefined;
  return name ? { ...ITEMS[kind], name } : ITEMS[kind];
}

/** Ability texts that differ in the digital ruleset (the card says what the unit really does there). */
export const DIGITAL_ABILITY_TEXTS: Record<string, string> = {
  blackDragon: 'Raz na bitwę: pełny atak w dwie jednostki stojące w jednej linii, także w sojusznika za wrogiem.',
};
export const abilityTextFor = (defId: string, digital: boolean | undefined): string => (digital ? DIGITAL_ABILITY_TEXTS[defId] : undefined) ?? UNITS[defId].abilityText;

export const NON_RESURRECTION_ITEMS: ItemKind[] = (Object.keys(ITEMS) as ItemKind[]).filter((k) => k !== 'resurrection');

/** Arena: Eliksiry Odrodzenia in the shared draft deck (the user's choice: 2, not the box's 6). */
export const ARENA_RESURRECTIONS = 2;
/** Arena draft deck: every treasure that works in battle once (so no Magiczna Mapa), plus the Eliksiry. */
export const ARENA_DECK: ItemKind[] = [
  ...Array<ItemKind>(ARENA_RESURRECTIONS).fill('resurrection'),
  ...NON_RESURRECTION_ITEMS.filter((k) => ITEMS[k].usableIn.includes('battle')),
];
/** Arena: treasures each side drafts, and cards shown per pick. */
export const ARENA_PICKS = 2;
export const ARENA_OFFER = 3;
/**
 * Arena-only handicaps (they do not touch the adventure game): who picks first ('random' = a coin)
 * and extra treasures a side drafts after the A, B, B, A picks.
 */
export const ARENA_RULES: { firstPicker: 'random' | FactionId; extraPicks: Record<FactionId, number>; extraOffer: Record<FactionId, number> } = {
  firstPicker: 'random',
  extraPicks: { dawn: 0, horde: 0 },
  /**
   * More cards shown to that side at each pick (the choice gets better, the number of treasures stays).
   * The Horde sees 4: in the arena Przymierze otherwise wins about 55% (simulations, notes section 9).
   */
  extraOffer: { dawn: 0, horde: 1 },
};

// Map tiles. The left half of the triangle is built from Przymierze tiles (green back),
// the right half from Horda tiles (red back). Costs follow the designer's table.
export type Terrain =
  // Przymierze
  | 'meadow'
  | 'forest'
  | 'river'
  | 'bridge'
  | 'hill'
  | 'mountain'
  | 'chasm'
  // Horda
  | 'scorched'
  | 'swamp'
  | 'barren'
  | 'darkCave'
  | 'ruins'
  | 'deadThicket'
  | 'thorns'
  // The channels between the islands (digital ruleset)
  | 'water'
  // Special tiles
  | 'tree'
  | 'baseDawn'
  | 'baseHorde'
  | 'lairCyclops'
  | 'lairGriffin'
  | 'lairHydra'
  | 'treasureDawn'
  | 'treasureHorde';

export type TileSide = 'dawn' | 'horde';

export const TERRAIN_NAMES: Record<Terrain, string> = {
  meadow: 'Polana Przymierza',
  forest: 'Las Przymierza',
  river: 'Rzeka',
  bridge: 'Most',
  hill: 'Wzgórza',
  mountain: 'Góry',
  chasm: 'Przepaść',
  scorched: 'Spalona Ziemia',
  swamp: 'Mroczne Bagno',
  barren: 'Jałowa Równina',
  darkCave: 'Mroczna Jaskinia',
  ruins: 'Ponure Ruiny',
  deadThicket: 'Martwy Gąszcz',
  thorns: 'Trujące Ciernie',
  water: 'Woda',
  tree: 'Kryształowe Drzewo',
  baseDawn: 'Baza Przymierza Świtu',
  baseHorde: 'Baza Mrocznej Hordy',
  lairCyclops: 'Jaskinia Cyklopa',
  lairGriffin: 'Gryfie Gniazdo',
  lairHydra: 'Hydrzy Staw',
  treasureDawn: 'Skarbiec Przymierza',
  treasureHorde: 'Skarbiec Hordy',
};

/** null = impassable. */
export const TERRAIN_COST: Record<Terrain, number | null> = {
  meadow: 1,
  forest: 1,
  bridge: 1,
  scorched: 1,
  barren: 1,
  tree: 1,
  baseDawn: 1,
  baseHorde: 1,
  lairCyclops: 1,
  lairGriffin: 1,
  lairHydra: 1,
  treasureDawn: 1,
  treasureHorde: 1,
  river: 2,
  hill: 2,
  swamp: 2,
  darkCave: 2,
  ruins: 2,
  mountain: null,
  chasm: null,
  deadThicket: null,
  thorns: null,
  water: null,
};

/** Number of art variants per terrain (public/assets/tiles/<terrain>_<n>.jpg). */
export const TERRAIN_VARIANTS: Record<Terrain, number> = {
  meadow: 4, forest: 4, river: 4, bridge: 4, hill: 4, mountain: 4, chasm: 4,
  scorched: 4, swamp: 4, barren: 4, darkCave: 4, ruins: 4, deadThicket: 4, thorns: 4, water: 2,
  tree: 1, baseDawn: 1, baseHorde: 1, lairCyclops: 1, lairGriffin: 1, lairHydra: 1,
  treasureDawn: 4, treasureHorde: 4,
};

/**
 * Tile decks per half of the map: 5 ordinary terrain types and 2 obstacles each, every type
 * equally likely. The share of difficult ground is not fixed — it follows from the types
 * (2 difficult types on the Przymierze side, 3 on the Horda side).
 */
export const TILE_POOLS: Record<TileSide, Terrain[]> = {
  dawn: ['meadow', 'forest', 'river', 'bridge', 'hill', 'mountain', 'chasm'],
  horde: ['scorched', 'barren', 'swamp', 'darkCave', 'ruins', 'deadThicket', 'thorns'],
};

/** Guardian lairs and the half of the map each guardian lives on. */
export const GUARDIAN_LAIRS: Record<string, { terrain: Terrain; side: TileSide }> = {
  cyclops: { terrain: 'lairCyclops', side: 'horde' },
  griffin: { terrain: 'lairGriffin', side: 'dawn' },
  hydra: { terrain: 'lairHydra', side: 'horde' },
};

/** Eliksiry Odrodzenia in the box (one card of every other treasure). */
export const RESURRECTION_CARDS = 6;

export interface MapVariant {
  rows: number;
  resurrections: number;
  otherTreasures: number;
  /** Eliksiry Odrodzenia on the map in the "only Eliksiry Odrodzenia" option (no other treasures). */
  onlyResurrections: number;
  roundLimit: number;
  /** Treasures the Przymierze holds from the start (larger maps). */
  startTreasures?: { resurrections: number; others: number };
}

/** The board game's four sizes, then the digital edition's XL (`huge`) and XXL (`giant`). */
export type MapSize = 'short' | 'medium' | 'long' | 'veryLong' | 'huge' | 'giant';
/** The sizes the board edition has. */
export const BOARD_MAP_SIZES: MapSize[] = ['short', 'medium', 'long', 'veryLong'];

export const MAP_VARIANTS: Record<MapSize, MapVariant> = {
  short: { rows: 6, resurrections: 1, otherTreasures: 1, onlyResurrections: 1, roundLimit: 8 },
  medium: { rows: 8, resurrections: 1, otherTreasures: 3, onlyResurrections: 2, roundLimit: 12 },
  long: { rows: 11, resurrections: 2, otherTreasures: 4, onlyResurrections: 3, roundLimit: 18, startTreasures: { resurrections: 0, others: 1 } },
  veryLong: { rows: 14, resurrections: 3, otherTreasures: 5, onlyResurrections: 4, roundLimit: 24, startTreasures: { resurrections: 1, others: 1 } },
  huge: { rows: 17, resurrections: 4, otherTreasures: 6, onlyResurrections: 5, roundLimit: 30, startTreasures: { resurrections: 1, others: 2 } },
  giant: { rows: 20, resurrections: 5, otherTreasures: 8, onlyResurrections: 6, roundLimit: 36, startTreasures: { resurrections: 2, others: 2 } },
};

export const MAP_SIZE_NAMES: Record<MapSize, string> = { short: 'Krótka', medium: 'Średnia', long: 'Długa', veryLong: 'Bardzo długa', huge: 'XL (ogromna)', giant: 'XXL (gigantyczna)' };

/** Digital Expedition and higher: Życie and Atak (and every bonus to them) are this many times the board game's, so that small bonuses and defence have room. */
export const STAT_SCALE = 3;
/**
 * The same for Życie: its own scale, larger than Atak's, so that a hero needs two to four blows to bring another hero down (with the same
 * scale a hero with a strong blow took one: report 674974). Chosen on the hero matrix: with ×5 Życie and ×3 Atak no pair of heroes is finished
 * in one blow, 93% of the pairs in two to four (mean 2.8), the rest are the Ogre's blows on the Bear. See docs/ZASADY_CYFROWE.md.
 */
export const HP_SCALE = 5;

/**
 * A rule text of the board game's numbers, with the numbers of Życie and Atak multiplied by `scale` ("+2 A" becomes "+6 A", "ignoruje 3 obrażenia" "ignoruje 9 obrażeń");
 * distances, speed, move points and counts stay. Used wherever a card or a skill is shown in a game with `statScale`.
 */
export function scaleText(text: string, scale: number, hpScale = scale): string {
  if (scale === 1 && hpScale === 1) return text;
  // Życie (and the points a healing restores) go by the Życie scale, Atak and damage by the Atak scale.
  return text.replace(/(\d+)(?= (?:maks\. )?Ż(?![a-ząćęłńóśźż]))|(\d+)(?= punktów obrażeń)|(\d+)(?= A(?![a-ząćęłńóśźż]))|(\d+)(?= (?:mniej |otrzymanych )?(?:obrażeń|obrażenia|obrażenie))/g, (_m, hp?: string, heal?: string, atk?: string, dmg?: string) => String(Number((hp ?? heal ?? atk ?? dmg)!) * (hp !== undefined || heal !== undefined ? hpScale : scale)));
}

/** The hp, attack and speed of a unit in a battle: the board game's, or the digital ruleset's where they differ; Życie and Atak times `scale` (the digital Expedition plays with 3, see `scaleOf`). */
export function battleStats(defId: string, digital: boolean | undefined, scale = 1, hpScale = scale): Pick<UnitDef, 'hp' | 'attack' | 'speed'> {
  const { hp, attack, speed } = { ...UNITS[defId], ...(digital ? DIGITAL_STATS[defId] : undefined) };
  return { hp: hp * hpScale, attack: attack * scale, speed };
}
