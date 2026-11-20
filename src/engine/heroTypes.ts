// Level 5 "Królestwo" (rule `realm`): what kind of hero a hero is. Its type (warrior, hunter, sage) makes it grow by itself with every level,
// whatever skills it picks, and its speciality is one small bonus of its own. A hero carries its type only in a level 5 game (`HeroState.kind`),
// so every other level plays as before. No imports from the rest of the engine: growth.ts, magic.ts and game.ts read these.

export type HeroType = 'warrior' | 'hunter' | 'sage';
export const HERO_TYPE_NAMES: Record<HeroType, string> = { warrior: 'wojownik', hunter: 'łowca', sage: 'mędrzec' };

/** The type of every hero: the named heroes by their nature, the commanders by their archetype (an archer is a hunter). */
export const HERO_TYPES: Record<string, HeroType> = {
  goldDragon: 'sage', unicornKing: 'hunter', ancientBear: 'warrior', braveDuck: 'hunter', moonWolf: 'hunter', duskManticore: 'warrior',
  blackDragon: 'sage', werewolfLord: 'hunter', ironFistOgre: 'warrior',
  dawnKnight: 'warrior', dawnHuntress: 'hunter', dawnSage: 'sage',
  hordeWarlord: 'warrior', hordeCrossbow: 'hunter', hordeShadow: 'sage',
  greatAurochs: 'warrior', satyrHornlord: 'sage', windAntelope: 'hunter', thunderRam: 'warrior',
  aurochsScout: 'warrior', eagleHunter: 'hunter', planetnik: 'sage',
  barrowKing: 'warrior', lanternWraith: 'sage', headlessKnight: 'hunter', bellKeeper: 'sage',
  ironThane: 'warrior', runeMatron: 'sage', passWarden: 'hunter', oldMiner: 'warrior', clanWarrior: 'warrior', mountainCrossbow: 'hunter', forgePriest: 'sage',
  marzanna: 'sage', frostJarl: 'warrior', snowLynx: 'hunter', oldHailer: 'sage', iceKnight: 'warrior', ermineHuntress: 'hunter', frostWitch: 'sage',
  foxCaptain: 'hunter', badgerSapper: 'warrior', ravenSeer: 'sage', otterSmuggler: 'hunter', martenSlasher: 'warrior', wildcatBajka: 'hunter', hareHerbalist: 'sage',
  tritonKing: 'warrior', sirenSinger: 'sage', seaSerpent: 'hunter', walrusCaptain: 'warrior', tritonGuard: 'warrior', harpooneer: 'hunter', sefiran: 'sage',
  mantisQueen: 'hunter', elderMycelium: 'sage', goliathBeetle: 'warrior', beeQueen: 'hunter', beetleGuard: 'warrior', fireflyArcher: 'hunter', mushroomSeer: 'sage',
  djinnVizier: 'sage', sphinxWarden: 'warrior', scorpionQueen: 'hunter', camelPrince: 'hunter', bastia: 'warrior', caravanArcher: 'hunter', desertAstrologer: 'sage',
  wardCaptain: 'warrior', spectralArcher: 'hunter', penitentMonk: 'sage',
};

/** What a type gives by itself as the hero grows (board game's scale): a warrior Życie every level, a hunter Atak every second level, a sage mana every level. */
export const TYPE_GROWTH = { warriorHp: 1, hunterAttackEvery: 2, sageMana: 1 };
export const TYPE_TEXTS: Record<HeroType, string> = {
  warrior: `Z każdym poziomem +${TYPE_GROWTH.warriorHp} Ż.`,
  hunter: `Co ${TYPE_GROWTH.hunterAttackEvery} poziomy +1 A.`,
  sage: `Z każdym poziomem +${TYPE_GROWTH.sageMana} many więcej; czaruje mocniej (+1 do siły czarów).`,
};

type Typed = { id: string; kind?: HeroType; level?: number };
const gained = (h: Typed) => Math.max(0, (h.level ?? 1) - 1);
/** Życie and Atak the hero's type has added so far (0 outside level 5). */
export const typeHp = (h: Typed): number => (h.kind === 'warrior' ? gained(h) * TYPE_GROWTH.warriorHp : 0);
export const typeAttack = (h: Typed): number => (h.kind === 'hunter' ? Math.floor(gained(h) / TYPE_GROWTH.hunterAttackEvery) : 0);
export const typeMana = (h: Typed): number => (h.kind === 'sage' ? gained(h) * TYPE_GROWTH.sageMana : 0);

/** One bonus of its own for every hero. Each field is read where the rule lives (see the comments there). */
export interface Specialty {
  name: string;
  text: string;
  /** Spells hit and heal this much harder. */
  spellPower?: number;
  /** Move points on the map. */
  move?: number;
  /** Życie of the supports that fight under the hero. */
  supportHp?: number;
  /** Atak of the shooters that fight under the hero. */
  marksman?: number;
  /** Atak of the airborne (movement 'fly') units that fight under the hero, and of the hero when it flies. */
  airborne?: number;
  /** Experience on top for every won battle. */
  xp?: number;
  /** Gold for the faction for every won battle. */
  gold?: number;
  /** Mana back on top at the end of every round. */
  regen?: number;
}

export const SPECIALTIES: Record<string, Specialty> = {
  goldDragon: { name: 'Słoneczna Aura', text: 'Czary Smoka zadają i leczą o 1 więcej.', spellPower: 1 },
  unicornKing: { name: 'Jeździec Wiatru', text: '+1 punkt ruchu na mapie.', move: 1 },
  ancientBear: { name: 'Ojciec Gaju', text: 'Pomocnicy Niedźwiedzia mają +1 Ż w bitwie.', supportHp: 1 },
  braveDuck: { name: 'Zadziora', text: '+1 PD za każdą wygraną walkę.', xp: 1 },
  blackDragon: { name: 'Pożoga', text: 'Czary Smoka zadają i leczą o 1 więcej.', spellPower: 1 },
  werewolfLord: { name: 'Tropiciel Krwi', text: '+1 PD za każdą wygraną walkę.', xp: 1 },
  ironFistOgre: { name: 'Łupieżca', text: '+1 zł dla frakcji za każdą wygraną bitwę.', gold: 1 },
  dawnKnight: { name: 'Chorąży', text: 'Pomocnicy Rycerza mają +1 Ż w bitwie.', supportHp: 1 },
  dawnHuntress: { name: 'Mistrzyni Łuku', text: 'Strzelcy Łowczyni (i ona sama) mają +1 A w bitwie.', marksman: 1 },
  dawnSage: { name: 'Źródło Mocy', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
  moonWolf: { name: 'Tropicielka', text: '+1 PD za każdą wygraną walkę.', xp: 1 },
  duskManticore: { name: 'Pan Zmierzchu', text: 'Pomocnicy Mantykory mają +1 Ż w bitwie.', supportHp: 1 },
  hordeWarlord: { name: 'Zbieracz Łupów', text: '+1 zł dla frakcji za każdą wygraną bitwę.', gold: 1 },
  hordeCrossbow: { name: 'Mistrz Kuszy', text: 'Strzelcy Kapitana (i on sam) mają +1 A w bitwie.', marksman: 1 },
  greatAurochs: { name: 'Przewodnik Stada', text: 'Pomocnicy Wielkiego Tura mają +1 Ż w bitwie.', supportHp: 1 },
  satyrHornlord: { name: 'Dzika Pieśń', text: 'Czary Satyra zadają i leczą o 1 więcej.', spellPower: 1 },
  windAntelope: { name: 'Wędrowiec Stepu', text: '+1 punkt ruchu na mapie.', move: 1 },
  thunderRam: { name: 'Grzmot Stada', text: '+1 PD za każdą wygraną walkę.', xp: 1 },
  aurochsScout: { name: 'Zagończyk', text: 'Pomocnicy Zagończyka mają +1 Ż w bitwie.', supportHp: 1 },
  eagleHunter: { name: 'Szpon z Góry', text: 'Jednostki powietrzne Orła (i on sam) mają +1 A w bitwie.', airborne: 1 },
  barrowKing: { name: 'Pan Warty', text: 'Pomocnicy Króla mają +1 Ż w bitwie.', supportHp: 1 },
  lanternWraith: { name: 'Wieczny Płomyk', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
  headlessKnight: { name: 'Nocny Gościniec', text: '+1 punkt ruchu na mapie.', move: 1 },
  bellKeeper: { name: 'Głos Dzwonu', text: 'Czary Dzwonnika zadają i leczą o 1 więcej.', spellPower: 1 },
  ironThane: { name: 'Tarcza Rodu', text: 'Pomocnicy Tana mają +1 Ż w bitwie.', supportHp: 1 },
  runeMatron: { name: 'Wiedza Przodków', text: 'Czary Matki Run zadają i leczą o 1 więcej.', spellPower: 1 },
  passWarden: { name: 'Oko Celownika', text: 'Strzelcy Strażniczki (i ona sama) mają +1 A w bitwie.', marksman: 1 },
  oldMiner: { name: 'Znawca Sztolni', text: '+1 punkt ruchu na mapie.', move: 1 },
  marzanna: { name: 'Oddech Zimy', text: 'Czary Marzanny zadają i leczą o 1 więcej.', spellPower: 1 },
  frostJarl: { name: 'Dwór Olbrzymów', text: 'Pomocnicy Jarla mają +1 Ż w bitwie.', supportHp: 1 },
  snowLynx: { name: 'Biegnąca z Wiatrem', text: '+1 punkt ruchu na mapie.', move: 1 },
  oldHailer: { name: 'Gradowa Chmura', text: 'Czary Starego Gradowego zadają i leczą o 1 więcej.', spellPower: 1 },
  iceKnight: { name: 'Lodowa Tarcza', text: 'Pomocnicy Rycerza mają +1 Ż w bitwie.', supportHp: 1 },
  ermineHuntress: { name: 'Oko Tropicielki', text: 'Strzelcy Łowczyni (i ona sama) mają +1 A w bitwie.', marksman: 1 },
  frostWitch: { name: 'Zimowa Magia', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
  foxCaptain: { name: 'Złota Łapa', text: '+1 zł dla frakcji za każdą wygraną bitwę.', gold: 1 },
  badgerSapper: { name: 'Stary Wiarus', text: 'Pomocnicy Sapera mają +1 Ż w bitwie.', supportHp: 1 },
  ravenSeer: { name: 'Wróżba', text: '+1 PD za każdą wygraną walkę.', xp: 1 },
  otterSmuggler: { name: 'Znawca Przepraw', text: '+1 punkt ruchu na mapie.', move: 1 },
  martenSlasher: { name: 'Stary Zawadiaka', text: 'Pomocnicy Rębajły mają +1 Ż w bitwie.', supportHp: 1 },
  wildcatBajka: { name: 'Szalony Pomysł', text: '+1 punkt ruchu na mapie.', move: 1 },
  hareHerbalist: { name: 'Ziołowy Zapas', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
  tritonKing: { name: 'Pan Rafy', text: 'Pomocnicy Króla mają +1 Ż w bitwie.', supportHp: 1 },
  sirenSinger: { name: 'Głos Głębin', text: 'Czary Syreny zadają i leczą o 1 więcej.', spellPower: 1 },
  seaSerpent: { name: 'Prąd Morski', text: '+1 punkt ruchu na mapie.', move: 1 },
  walrusCaptain: { name: 'Stary Wilk Morski', text: '+1 PD za każdą wygraną walkę.', xp: 1 },
  tritonGuard: { name: 'Mur z Muszli', text: 'Pomocnicy Strażnika mają +1 Ż w bitwie.', supportHp: 1 },
  harpooneer: { name: 'Oko Łowczyni', text: 'Strzelcy Harpunniczki (i ona sama) mają +1 A w bitwie.', marksman: 1 },
  sefiran: { name: 'Ciepłe Kamienie', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
  mantisQueen: { name: 'Łowczyni Głębin', text: '+1 PD za każdą wygraną walkę.', xp: 1 },
  elderMycelium: { name: 'Pulsująca Grzybnia', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
  goliathBeetle: { name: 'Matka Roju', text: 'Pomocnicy Goliata mają +1 Ż w bitwie.', supportHp: 1 },
  beeQueen: { name: 'Miodowy Szlak', text: '+1 punkt ruchu na mapie.', move: 1 },
  beetleGuard: { name: 'Twardy Pancerz', text: 'Pomocnicy Żuka mają +1 Ż w bitwie.', supportHp: 1 },
  fireflyArcher: { name: 'Świetlne Oko', text: 'Strzelcy Łuczniczki (i ona sama) mają +1 A w bitwie.', marksman: 1 },
  mushroomSeer: { name: 'Grzybowa Wizja', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
  djinnVizier: { name: 'Lampa Mocy', text: 'Czary Wezyra zadają i leczą o 1 więcej.', spellPower: 1 },
  sphinxWarden: { name: 'Mądrość Wieków', text: '+1 PD za każdą wygraną walkę.', xp: 1 },
  scorpionQueen: { name: 'Szlaki Wydm', text: '+1 punkt ruchu na mapie.', move: 1 },
  camelPrince: { name: 'Karawana Złota', text: '+1 zł dla frakcji za każdą wygraną bitwę.', gold: 1 },
  bastia: { name: 'Leniwa Siła', text: 'Pomocnicy Bastii mają +1 Ż w bitwie.', supportHp: 1 },
  caravanArcher: { name: 'Oko Pustyni', text: 'Strzelcy Łuczniczki (i ona sama) mają +1 A w bitwie.', marksman: 1 },
  desertAstrologer: { name: 'Gwiezdna Mapa', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
  clanWarrior: { name: 'Stary Wojownik', text: 'Pomocnicy Wojownika mają +1 Ż w bitwie.', supportHp: 1 },
  mountainCrossbow: { name: 'Celne Oko Gór', text: 'Strzelcy Kusznika (i on sam) mają +1 A w bitwie.', marksman: 1 },
  forgePriest: { name: 'Ogień Kuźni', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
  wardCaptain: { name: 'Stary Wartownik', text: 'Pomocnicy Kapitana mają +1 Ż w bitwie.', supportHp: 1 },
  spectralArcher: { name: 'Upiorny Strzał', text: 'Strzelcy Łuczniczki (i ona sama) mają +1 A w bitwie.', marksman: 1 },
  penitentMonk: { name: 'Cicha Modlitwa', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
  planetnik: { name: 'Pieśń Przyszłości', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
  hordeShadow: { name: 'Studnia Cieni', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
};

/** The hero's speciality; it works only in a level 5 game (the hero has a type there). */
export const specialtyOf = (h: Pick<Typed, 'id' | 'kind'> | undefined): Specialty | undefined => (h?.kind ? SPECIALTIES[h.id] : undefined);
