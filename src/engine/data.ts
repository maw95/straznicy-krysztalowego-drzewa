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
  | 'manyHeads'; // Paszcze Otchłani (Hydra)

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
  /** Share of Życie a guardian keeps in a duel on the board. */
  guardianDuelHpShare: 0.55,
};

const u = (d: UnitDef): UnitDef => d;

export const UNITS: Record<string, UnitDef> = Object.fromEntries(
  [
    u({ id: 'goldDragon', name: 'Złoty Smok', side: 'dawn', kind: 'hero', hp: 9, attack: 5, speed: 4, movement: 'fly', attackType: 'melee', ability: 'sunburst', abilityName: 'Słoneczny Blask', abilityText: `Raz na bitwę: twoje jednostki +${ABILITY.sunburstBonus} A do następnego ataku, sam Smok +${ABILITY.sunburstSelfBonus} A.` }),
    u({ id: 'unicornKing', name: 'Król Jednorożców', side: 'dawn', kind: 'hero', hp: 8, attack: 5, speed: 8, movement: 'walk', attackType: 'melee', ability: 'lightCharge', abilityName: 'Szarża Światła', abilityText: `+${ABILITY.lightChargeBonus} A do ataku wykonanego po ruchu o co najmniej ${ABILITY.lightChargeMinMove} pola.` }),
    u({ id: 'ancientBear', name: 'Prastary Niedźwiedź', side: 'dawn', kind: 'hero', hp: 11, attack: 4, speed: 4, movement: 'walk', attackType: 'melee', ability: 'guardian', abilityName: 'Opiekun Gaju', abilityText: `Raz na bitwę: przyjmuje cios, który zabiłby jego lub sąsiada, i ignoruje ${ABILITY.guardianIgnore} obrażenia.` }),
    u({ id: 'elfDruid', name: 'Elf Druid', side: 'dawn', kind: 'support', hp: 4, attack: 1, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'entanglingRoots', abilityName: 'Splątane Korzenie', abilityText: `Raz na bitwę: trafiony wróg ma −${ABILITY.rootsSlow} S w swojej następnej aktywacji.` }),
    u({ id: 'nymph', name: 'Nimfa', side: 'dawn', kind: 'support', hp: 5, attack: 2, speed: 4, movement: 'walk', attackType: 'melee', ability: 'giftOfLife', abilityName: 'Dar Życia', abilityText: `Raz na bitwę: +${ABILITY.giftOfLifeHeal} Ż sojusznikowi, do maksimum.` }),
    u({ id: 'pegasus', name: 'Pegaz', side: 'dawn', kind: 'support', hp: 4, attack: 2, speed: 4, movement: 'fly', attackType: 'melee', ability: 'airDash', abilityName: 'Powietrzny Zryw', abilityText: `Raz na bitwę: po ataku odskok do ${ABILITY.airDashRange} pól.` }),
    u({ id: 'blackDragon', name: 'Czarny Smok', side: 'horde', kind: 'hero', hp: 7, attack: 5, speed: 5, movement: 'fly', attackType: 'melee', ability: 'fireBreath', abilityName: 'Ognisty Oddech', abilityText: 'Raz na bitwę: pełny atak w dwóch wrogów stojących w jednej linii.' }),
    u({ id: 'werewolfLord', name: 'Władca Wilkołaków', side: 'horde', kind: 'hero', hp: 8, attack: 5, speed: 7, movement: 'walk', attackType: 'melee', ability: 'bloodCall', abilityName: 'Zew Krwi', abilityText: `+${ABILITY.bloodCallBonus} A do każdego ataku na już rannego wroga.` }),
    u({ id: 'ironFistOgre', name: 'Ogr Żelazna Pięść', side: 'horde', kind: 'hero', hp: 10, attack: 4, speed: 5, movement: 'walk', attackType: 'melee', ability: 'hardHead', abilityName: 'Twardogłowy', abilityText: `Raz na bitwę ignoruje do ${ABILITY.hardHeadIgnore} obrażeń z jednego trafienia.` }),
    u({ id: 'goblinShaman', name: 'Goblin Szaman', side: 'horde', kind: 'support', hp: 5, attack: 1, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'curse', abilityName: 'Złowroga Klątwa', abilityText: `Raz na bitwę: trafiony cel ma −${ABILITY.curseMinus} A przy następnym ataku.` }),
    u({ id: 'caveSpider', name: 'Pająk Jaskiniowy', side: 'horde', kind: 'support', hp: 6, attack: 2, speed: 3, movement: 'walk', attackType: 'melee', ability: 'web', abilityName: 'Pajęcze Sidła', abilityText: `Raz na bitwę: wróg do ${ABILITY.webRange} pól nie rusza się w następnej aktywacji.` }),
    u({ id: 'shadowBat', name: 'Nietoperz Cienia', side: 'horde', kind: 'support', hp: 5, attack: 2, speed: 3, movement: 'fly', attackType: 'melee', ability: 'nightAmbush', abilityName: 'Nocna Zasadzka', abilityText: `Raz na bitwę: atak zadaje +${ABILITY.nightAmbushBonus} obrażenia.` }),
    u({ id: 'cyclops', name: 'Cyklop Błyskotek', side: 'neutral', kind: 'neutral', hp: 23, attack: 2, speed: 2, movement: 'walk', attackType: 'ranged', ability: 'boulder', abilityName: 'Miażdżący Głaz', abilityText: 'Po każdym ataku odpycha trafionego przeciwnika o 1 pole, jeśli to możliwe.' }),
    u({ id: 'griffin', name: 'Gryf Złodziej Skarbów', side: 'neutral', kind: 'neutral', hp: 18, attack: 3, speed: 6, movement: 'fly', attackType: 'melee', ability: 'nestLeap', abilityName: 'Łupieżczy Nalot', abilityText: `Po każdym ataku może odlecieć o maks. ${ABILITY.nestLeapRange} pola.` }),
    u({ id: 'hydra', name: 'Hydra z Zatopionych Ruin', side: 'neutral', kind: 'neutral', hp: 21, attack: 2, speed: 3, movement: 'walk', attackType: 'melee', ability: 'manyHeads', abilityName: 'Paszcze Otchłani', abilityText: 'Każdym atakiem może trafić dwóch sąsiadujących przeciwników.' }),
  ].map((d) => [d.id, d]),
);

export const FACTION_HEROES: Record<FactionId, string[]> = {
  dawn: ['goldDragon', 'unicornKing', 'ancientBear'],
  horde: ['blackDragon', 'werewolfLord', 'ironFistOgre'],
};

export const FACTION_SUPPORTS: Record<FactionId, string[]> = {
  dawn: ['elfDruid', 'nymph', 'pegasus'],
  horde: ['goblinShaman', 'caveSpider', 'shadowBat'],
};

export const GUARDIANS = ['cyclops', 'griffin', 'hydra'];

/** Supports a hero takes into a battle on the arena (all of them when fewer are alive). */
export const SUPPORTS_PER_BATTLE = 2;

/** A guardian fought in a duel on the board (one hero alone) keeps only part of its Życie, rounded up. */
export const guardianDuelHp = (id: string) => Math.ceil(UNITS[id].hp * ABILITY.guardianDuelHpShare);

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

export const ITEMS: Record<ItemKind, ItemDef> = {
  resurrection: { kind: 'resurrection', name: 'Eliksir Odrodzenia', text: 'Wskrzesza 1 poległą jednostkę. Także poza bitwą.', usableIn: ['map', 'battle'] },
  heal: { kind: 'heal', name: 'Wielki Eliksir Uzdrowienia', text: 'Usuwa z wybranej jednostki do 6 punktów obrażeń.', usableIn: ['battle'] },
  seed: { kind: 'seed', name: 'Nasiono Drzewa', text: '+2 Ż każdej żyjącej własnej jednostce na arenie.', usableIn: ['battle'] },
  damage_scroll: { kind: 'damage_scroll', name: 'Zwój Magicznej Strzały', text: '3 obrażenia wybranemu celowi.', usableIn: ['battle'] },
  sword: { kind: 'sword', name: 'Miecz Bohatera', text: '+2 A jednej jednostce do końca bitwy.', usableIn: ['battle'] },
  shield: { kind: 'shield', name: 'Tarcza Strażnika', text: 'Neguje wszystkie obrażenia z jednego ataku (reakcja).', usableIn: ['battle'] },
  vitality: { kind: 'vitality', name: 'Eliksir Żywotności', text: '+4 maks. Ż jednej jednostce do końca bitwy.', usableIn: ['battle'] },
  boots: { kind: 'boots', name: 'Buty Wiatru', text: '+3 S jednej jednostce do końca bitwy.', usableIn: ['battle'] },
  horn: { kind: 'horn', name: 'Róg Strażników', text: 'Wymień pomocnika na żywego z rezerwy ALBO daj żywemu pomocnikowi dodatkową aktywację.', usableIn: ['battle'] },
  map: { kind: 'map', name: 'Magiczna Mapa', text: 'Odkryj 3 wybrane zakryte pola.', usableIn: ['map'] },
  lightning: { kind: 'lightning', name: 'Błyskawica w Butelce', text: 'Do dwóch różnych przeciwników otrzymuje po 2 obrażenia.', usableIn: ['battle'] },
  hourglass: { kind: 'hourglass', name: 'Klepsydra Czasu', text: 'Wybrana jednostka wykonuje dodatkowy ruch bez ataku.', usableIn: ['battle'] },
  courage_horn: { kind: 'courage_horn', name: 'Róg Odwagi', text: '+2 A do następnego ataku jednostki i jednego sąsiedniego sojusznika.', usableIn: ['battle'] },
  teleport: { kind: 'teleport', name: 'Zwój Teleportacji', text: 'Teleport na wolne pole sąsiadujące z sojusznikiem.', usableIn: ['battle'] },
  stone: { kind: 'stone', name: 'Kamień Ochrony', text: '−1 otrzymanych obrażeń z każdego ataku do końca bitwy.', usableIn: ['battle'] },
};

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
};

/** Number of art variants per terrain (public/assets/tiles/<terrain>_<n>.jpg). */
export const TERRAIN_VARIANTS: Record<Terrain, number> = {
  meadow: 4, forest: 4, river: 4, bridge: 4, hill: 4, mountain: 4, chasm: 4,
  scorched: 4, swamp: 4, barren: 4, darkCave: 4, ruins: 4, deadThicket: 4, thorns: 4,
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

export type MapSize = 'short' | 'medium' | 'long' | 'veryLong';

export const MAP_VARIANTS: Record<MapSize, MapVariant> = {
  short: { rows: 6, resurrections: 1, otherTreasures: 1, onlyResurrections: 1, roundLimit: 8 },
  medium: { rows: 8, resurrections: 1, otherTreasures: 3, onlyResurrections: 2, roundLimit: 12 },
  long: { rows: 11, resurrections: 2, otherTreasures: 4, onlyResurrections: 3, roundLimit: 18, startTreasures: { resurrections: 0, others: 1 } },
  veryLong: { rows: 14, resurrections: 3, otherTreasures: 5, onlyResurrections: 4, roundLimit: 24, startTreasures: { resurrections: 1, others: 1 } },
};

export const MAP_SIZE_NAMES: Record<MapSize, string> = { short: 'Krótka', medium: 'Średnia', long: 'Długa', veryLong: 'Bardzo długa' };
