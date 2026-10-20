// Game content: units, guardians, treasures and terrain.
// All numbers come from docs/Straznicy_Krysztalowego_Drzewa_Specyfikacja_dla_AI.md
// (tables in sections 2–4). They are TEST values meant to be tuned, so the
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
  | 'bloodCall' // Zew Krwi
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

const u = (d: UnitDef): UnitDef => d;

export const UNITS: Record<string, UnitDef> = Object.fromEntries(
  [
    u({ id: 'goldDragon', name: 'Złoty Smok', side: 'dawn', kind: 'hero', hp: 9, attack: 5, speed: 3, movement: 'fly', attackType: 'melee', ability: 'sunburst', abilityName: 'Słoneczny Blask', abilityText: 'Raz na bitwę: każda żyjąca własna jednostka, w tym Smok, dostaje +1 A do następnego ataku.' }),
    u({ id: 'unicornKing', name: 'Król Jednorożców', side: 'dawn', kind: 'hero', hp: 7, attack: 4, speed: 7, movement: 'walk', attackType: 'melee', ability: 'lightCharge', abilityName: 'Szarża Światła', abilityText: '+1 A do ataku wykonanego po ruchu o co najmniej 3 heksy.' }),
    u({ id: 'ancientBear', name: 'Prastary Niedźwiedź', side: 'dawn', kind: 'hero', hp: 11, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'guardian', abilityName: 'Opiekun Gaju', abilityText: 'Raz na bitwę przejmuje atak wymierzony w sąsiedniego sojusznika.' }),
    u({ id: 'elfDruid', name: 'Elf Druid', side: 'dawn', kind: 'support', hp: 3, attack: 2, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'entanglingRoots', abilityName: 'Splątane Korzenie', abilityText: 'Raz na bitwę: trafiony wróg ma −2 S w swojej następnej aktywacji.' }),
    u({ id: 'nymph', name: 'Nimfa', side: 'dawn', kind: 'support', hp: 6, attack: 1, speed: 4, movement: 'walk', attackType: 'melee', ability: 'giftOfLife', abilityName: 'Dar Życia', abilityText: 'Raz na bitwę: +3 Ż sojusznikowi, do maksimum.' }),
    u({ id: 'pegasus', name: 'Pegaz', side: 'dawn', kind: 'support', hp: 3, attack: 2, speed: 5, movement: 'fly', attackType: 'melee', ability: 'airDash', abilityName: 'Powietrzny Zryw', abilityText: 'Raz na bitwę: po ataku odskok do 3 heksów.' }),
    u({ id: 'blackDragon', name: 'Czarny Smok', side: 'horde', kind: 'hero', hp: 8, attack: 6, speed: 3, movement: 'fly', attackType: 'melee', ability: 'fireBreath', abilityName: 'Ognisty Oddech', abilityText: 'Raz na bitwę: pełny atak w dwóch wrogów stojących w jednej linii.' }),
    u({ id: 'werewolfLord', name: 'Władca Wilkołaków', side: 'horde', kind: 'hero', hp: 7, attack: 5, speed: 6, movement: 'walk', attackType: 'melee', ability: 'bloodCall', abilityName: 'Zew Krwi', abilityText: 'Raz na bitwę: +2 A przeciw już rannemu celowi.' }),
    u({ id: 'ironFistOgre', name: 'Ogr Żelazna Pięść', side: 'horde', kind: 'hero', hp: 11, attack: 5, speed: 2, movement: 'walk', attackType: 'melee', ability: 'hardHead', abilityName: 'Twardogłowy', abilityText: 'Raz na bitwę ignoruje do 4 obrażeń z jednego trafienia.' }),
    u({ id: 'goblinShaman', name: 'Goblin Szaman', side: 'horde', kind: 'support', hp: 4, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'curse', abilityName: 'Złowroga Klątwa', abilityText: 'Raz na bitwę: trafiony cel ma −1 A przy następnym ataku.' }),
    u({ id: 'caveSpider', name: 'Pająk Jaskiniowy', side: 'horde', kind: 'support', hp: 5, attack: 2, speed: 4, movement: 'walk', attackType: 'melee', ability: 'web', abilityName: 'Pajęcze Sidła', abilityText: 'Raz na bitwę: wróg w zasięgu 4 heksów nie może się ruszyć w następnej aktywacji.' }),
    u({ id: 'shadowBat', name: 'Nietoperz Cienia', side: 'horde', kind: 'support', hp: 3, attack: 1, speed: 6, movement: 'fly', attackType: 'melee', ability: 'nightAmbush', abilityName: 'Nocna Zasadzka', abilityText: 'Raz na bitwę: atak zadaje +2 obrażenia.' }),
    u({ id: 'cyclops', name: 'Cyklop Błyskotek', side: 'neutral', kind: 'neutral', hp: 13, attack: 3, speed: 2, movement: 'walk', attackType: 'melee', ability: 'boulder', abilityName: 'Miażdżący Głaz', abilityText: 'Raz na bitwę trafia dwóch sąsiadujących przeciwników.' }),
    u({ id: 'griffin', name: 'Gryf Złodziej Skarbów', side: 'neutral', kind: 'neutral', hp: 11, attack: 3, speed: 6, movement: 'fly', attackType: 'melee', ability: 'nestLeap', abilityName: 'Łupieżczy Nalot', abilityText: 'Raz na bitwę: po ataku odlatuje o maks. 4 pola.' }),
    u({ id: 'hydra', name: 'Hydra z Zatopionych Ruin', side: 'neutral', kind: 'neutral', hp: 15, attack: 2, speed: 3, movement: 'walk', attackType: 'melee', ability: 'manyHeads', abilityName: 'Paszcze Otchłani', abilityText: 'Raz na bitwę atakuje dwóch sąsiadujących przeciwników.' }),
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
  heal: { kind: 'heal', name: 'Wielki Eliksir Uzdrowienia', text: '+6 Ż jednej żyjącej jednostce, do maksimum.', usableIn: ['battle'] },
  seed: { kind: 'seed', name: 'Nasiono Drzewa', text: '+2 Ż każdej żyjącej własnej jednostce na arenie.', usableIn: ['battle'] },
  damage_scroll: { kind: 'damage_scroll', name: 'Zwój Magicznej Strzały', text: '3 obrażenia wybranemu celowi.', usableIn: ['battle'] },
  sword: { kind: 'sword', name: 'Miecz Bohatera', text: '+2 A jednej jednostce do końca bitwy.', usableIn: ['battle'] },
  shield: { kind: 'shield', name: 'Tarcza Strażnika', text: 'Neguje wszystkie obrażenia z jednego ataku (reakcja).', usableIn: ['battle'] },
  vitality: { kind: 'vitality', name: 'Eliksir Żywotności', text: '+4 maks. Ż jednej jednostce do końca bitwy.', usableIn: ['battle'] },
  boots: { kind: 'boots', name: 'Buty Wiatru', text: '+3 S jednej jednostce do końca bitwy.', usableIn: ['battle'] },
  horn: { kind: 'horn', name: 'Róg Strażników', text: 'Wymień pomocnika na żywego z rezerwy ALBO daj żywemu pomocnikowi dodatkową aktywację.', usableIn: ['battle'] },
  map: { kind: 'map', name: 'Magiczna Mapa', text: 'Odkryj 3 wybrane zakryte heksy.', usableIn: ['map'] },
  lightning: { kind: 'lightning', name: 'Błyskawica w Butelce', text: 'Do dwóch różnych przeciwników otrzymuje po 2 obrażenia.', usableIn: ['battle'] },
  hourglass: { kind: 'hourglass', name: 'Klepsydra Czasu', text: 'Wybrana jednostka wykonuje dodatkowy ruch bez ataku.', usableIn: ['battle'] },
  courage_horn: { kind: 'courage_horn', name: 'Róg Odwagi', text: '+2 A do następnego ataku jednostki i jednego sąsiedniego sojusznika.', usableIn: ['battle'] },
  teleport: { kind: 'teleport', name: 'Zwój Teleportacji', text: 'Teleport na wolne pole sąsiadujące z sojusznikiem.', usableIn: ['battle'] },
  stone: { kind: 'stone', name: 'Kamień Ochrony', text: '−1 otrzymanych obrażeń z każdego ataku do końca bitwy.', usableIn: ['battle'] },
};

export const NON_RESURRECTION_ITEMS: ItemKind[] = (Object.keys(ITEMS) as ItemKind[]).filter((k) => k !== 'resurrection');

export type Terrain =
  | 'meadow'
  | 'bridge'
  | 'forest'
  | 'river'
  | 'hill'
  | 'swamp'
  | 'cave'
  | 'mountain'
  | 'tree'
  | 'baseDawn'
  | 'baseHorde';

export const TERRAIN_NAMES: Record<Terrain, string> = {
  meadow: 'Polana',
  bridge: 'Most',
  forest: 'Las',
  river: 'Rzeka',
  hill: 'Wzgórze',
  swamp: 'Mroczne Bagno',
  cave: 'Kryształowa Grota',
  mountain: 'Góry',
  tree: 'Kryształowe Drzewo',
  baseDawn: 'Obóz Przymierza',
  baseHorde: 'Obóz Hordy',
};

/** null = impassable. */
export const TERRAIN_COST: Record<Terrain, number | null> = {
  meadow: 1,
  bridge: 1,
  tree: 1,
  baseDawn: 1,
  baseHorde: 1,
  forest: 2,
  river: 2,
  hill: 2,
  swamp: 2,
  cave: 2,
  mountain: null,
};

export const EASY_TERRAINS: Terrain[] = ['meadow', 'meadow', 'meadow', 'bridge'];
/** 'cave' is reserved for crystal hexes so its icon never misleads players. */
export const HARD_TERRAINS: Terrain[] = ['forest', 'river', 'hill', 'swamp'];

export interface MapVariant {
  rows: number;
  crystals: number;
  resurrections: number;
  otherTreasures: number;
  roundLimit: number;
  /** Fixed mountain cells for map type A, as [row, col]. */
  mountains: Array<[number, number]>;
}

export type MapSize = 'short' | 'medium' | 'long';

export const MAP_VARIANTS: Record<MapSize, MapVariant> = {
  short: { rows: 6, crystals: 2, resurrections: 1, otherTreasures: 1, roundLimit: 12, mountains: [[3, 2], [4, 1]] },
  medium: { rows: 8, crystals: 3, resurrections: 2, otherTreasures: 2, roundLimit: 20, mountains: [[3, 1], [4, 3], [5, 2], [6, 4]] },
  long: { rows: 11, crystals: 3, resurrections: 2, otherTreasures: 4, roundLimit: 30, mountains: [[3, 2], [5, 1], [5, 4], [6, 3], [7, 5], [8, 2], [9, 6]] },
};

export const MAP_SIZE_NAMES: Record<MapSize, string> = { short: 'Krótka', medium: 'Średnia', long: 'Długa' };
