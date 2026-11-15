// Level 5 "Królestwo" (rule `realm`): what kind of hero a hero is. Its type (warrior, hunter, sage) makes it grow by itself with every level,
// whatever skills it picks, and its speciality is one small bonus of its own. A hero carries its type only in a level 5 game (`HeroState.kind`),
// so every other level plays as before. No imports from the rest of the engine: growth.ts, magic.ts and game.ts read these.

export type HeroType = 'warrior' | 'hunter' | 'sage';
export const HERO_TYPE_NAMES: Record<HeroType, string> = { warrior: 'wojownik', hunter: 'łowca', sage: 'mędrzec' };

/** The type of every hero: the named heroes by their nature, the commanders by their archetype (an archer is a hunter). */
export const HERO_TYPES: Record<string, HeroType> = {
  goldDragon: 'sage', unicornKing: 'hunter', ancientBear: 'warrior', braveDuck: 'hunter',
  blackDragon: 'sage', werewolfLord: 'hunter', ironFistOgre: 'warrior',
  dawnKnight: 'warrior', dawnHuntress: 'hunter', dawnSage: 'sage',
  hordeWarlord: 'warrior', hordeCrossbow: 'hunter', hordeShadow: 'sage',
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
  hordeWarlord: { name: 'Zbieracz Łupów', text: '+1 zł dla frakcji za każdą wygraną bitwę.', gold: 1 },
  hordeCrossbow: { name: 'Mistrz Kuszy', text: 'Strzelcy Kapitana (i on sam) mają +1 A w bitwie.', marksman: 1 },
  hordeShadow: { name: 'Studnia Cieni', text: 'Na koniec rundy odzyskuje o 1 many więcej.', regen: 1 },
};

/** The hero's speciality; it works only in a level 5 game (the hero has a type there). */
export const specialtyOf = (h: Pick<Typed, 'id' | 'kind'> | undefined): Specialty | undefined => (h?.kind ? SPECIALTIES[h.id] : undefined);
