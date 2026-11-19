// The digital edition's complexity levels as sets of switches (docs/ROZBUDOWA_CYFROWA.md, the ladder of levels): level 1 "Przygoda" is the
// adventure of the board game's goal on the triangle map with fixed heroes; level 2 "Wyprawa" adds the goals, the map shapes and hero growth.
// "Własne" leaves every switch to the player. The presets only choose switches that already exist, so no rule lives here.

import { levelSettings, type BattleMode, type InitiativeTieMode, type Level, type MapShape, type Mode, type ObjectiveId, type RulesConfig, type SetupOptions } from './types';

export type Tier = 'adventure' | 'expedition' | 'kingdom' | 'economy' | 'realm' | 'empire' | 'custom';

export interface Switches {
  objective: ObjectiveId;
  shape: MapShape;
  customMapId?: string;
  growth: boolean;
  /** Level 3: gold, settlements, recruitment (kingdom.ts). */
  kingdom?: boolean;
  /** Level 4: wood, ore, Gwiezdny Pył (economy.ts); implies `kingdom`. */
  economy?: boolean;
  /** Level 5: second hero, magic (realm.ts); implies `economy`. */
  realm?: boolean;
  /** Level 6: Relic, faction mechanics (empire.ts); implies `realm`. */
  empire?: boolean;
}

export const TIERS: Record<Tier, { name: string; summary: string }> = {
  adventure: { name: 'Poziom II: Przygoda', summary: 'Zasady z planszówki w wersji cyfrowej: kryształy do Drzewa, mapa-trójkąt, bohaterowie bez rozwoju. Najprostszy start, także dla dzieci.' },
  expedition: { name: 'Poziom III: Wyprawa', summary: 'Do wyboru cel (punkty kontrolne, przetrwanie, boss, artefakt) i kształt mapy; bohaterowie zdobywają doświadczenie, artefakty i umiejętności.' },
  kingdom: { name: 'Poziom IV: Osada', summary: 'Wyprawa plus osady, złoto i rekrutacja: dochód z osad i kopalni, budynki (koszary, targ, szpital, skarbiec), artefakty na targu i drużyna, która rośnie do pięciu pomocników.' },
  economy: { name: 'Poziom V: Księstwo', summary: 'Osada plus gospodarka: drewno, ruda i Gwiezdny Pył z kopalni i osad, budynki za surowce (jeden na rundę), legendarne artefakty za Pył.' },
  realm: { name: 'Poziom VI: Królestwo', summary: 'Księstwo plus bohaterowie i magia: drugi bohater-dowódca najęty w karczmie, czary w bitwie i na mapie, specjalności bohaterów.' },
  empire: { name: 'Poziom VII: Imperium', summary: 'Królestwo plus frakcje i Relikt: Odłamki Pierwotnej Iskry, budynek Pierwotnej Iskry, mechaniki i legendarna jednostka frakcji.' },
  custom: { name: 'Własne ustawienia', summary: 'Każdy przełącznik osobno: rozwój bohatera, rodzaj bitew, ułatwienia, utrudnienia i remis inicjatywy, a do tego cel i kształt mapy.' },
};

/** The switches a tier sets, given what the player picked on the screen (the picks count where the tier leaves the choice open). */
export function resolveTier(tier: Tier, picks: Switches): Switches {
  if (tier === 'adventure') return { objective: 'crystals', shape: 'triangle', growth: false };
  if (tier === 'expedition') return { ...picks, growth: true };
  if (tier === 'kingdom') return { ...picks, growth: true, kingdom: true };
  if (tier === 'economy') return { ...picks, growth: true, kingdom: true, economy: true };
  if (tier === 'realm') return { ...picks, growth: true, kingdom: true, economy: true, realm: true };
  if (tier === 'empire') return { ...picks, growth: true, kingdom: true, economy: true, realm: true, empire: true };
  return picks;
}

/** The set-up with the digital edition's rules switched on when asked (the arena battles; the board duels of the easy level are the same), and its objective, map and hero growth. */
export function withRuleset(setup: SetupOptions, digital: boolean, objective: ObjectiveId = 'crystals', shape: MapShape = 'triangle', customMapId?: string, growth = false, kingdom = false, economy = false, realm = false, empire = false): SetupOptions {
  if (!digital) return setup;
  return { ...setup, ...(shape !== 'triangle' && setup.mode !== 'arena' ? { mapShape: shape, ...(shape === 'custom' ? { customMapId } : {}) } : {}), rules: { ...setup.rules, ruleset: 'digital', ...(growth && setup.mode !== 'arena' ? { heroGrowth: true } : {}), ...(kingdom && growth && setup.mode !== 'arena' ? { kingdom: true, ...(economy ? { economy: true, ...(realm ? { realm: true, ...(empire ? { empire: true } : {}) } : {}) } : {}) } : {}), ...(objective !== 'crystals' && setup.mode !== 'arena' ? { objective } : {}) } };
}

// ------------------------------------------------------------------ "Własne ustawienia" at a table

/** The loose rule switches of the custom tier: the ones the setup screen shows as "Ułatwienia", "Utrudnienia" and "Remis inicjatywy". */
export type CustomRules = Pick<RulesConfig, 'abilities' | 'treasures' | 'heroReplacement' | 'useDice' | 'extraEvilHero' | 'initiativeTie' | 'heroMovePoints' | 'battleRoundLimit' | 'hordeRespawn'>;

/** The layers of the higher levels a custom game switches on (each includes the ones before it; they need hero growth): none = level 2's rules. */
export type CustomLayer = 'none' | 'kingdom' | 'economy' | 'realm' | 'empire';
export const CUSTOM_LAYERS: CustomLayer[] = ['none', 'kingdom', 'economy', 'realm', 'empire'];
export const CUSTOM_LAYER_NAMES: Record<CustomLayer, string> = { none: 'Bez osad', kingdom: 'Osady i złoto', economy: '+ surowce i oblężenia', realm: '+ drugi bohater i magia', empire: '+ Relikt i frakcje' };
/** The tier switches of a layer (what `resolveTier` returns for the levels). */
export const layerSwitches = (layer: CustomLayer): Pick<Switches, 'kingdom' | 'economy' | 'realm' | 'empire'> => {
  const i = CUSTOM_LAYERS.indexOf(layer);
  return { kingdom: i >= 1, economy: i >= 2, realm: i >= 3, empire: i >= 4 };
};
/** Allowed values of the numeric switches. */
export const HERO_MOVE_POINTS = [2, 3, 4, 5];
export const BATTLE_ROUND_LIMITS = [20, 30, 40, 60, 80];

/** Everything the custom tier lets a player change besides the goal and the map (those are `Switches`). */
export interface CustomTable {
  growth: boolean;
  /** Settlements, resources, magic and the Relic on top of hero growth (only with `growth`). */
  layer: CustomLayer;
  battleMode: BattleMode;
  rules: CustomRules;
}

export const CUSTOM_BOOLEAN_RULES = ['abilities', 'treasures', 'heroReplacement', 'useDice', 'extraEvilHero', 'hordeRespawn'] as const;
export const INITIATIVE_TIES: InitiativeTieMode[] = ['defender', 'rotating'];
const BATTLE_MODES: BattleMode[] = ['arena', 'board'];

/** The custom tier's starting point: what the level preset sets (the screens begin from it and the player switches from there). */
export function defaultCustom(level: Level, mode: Mode): CustomTable {
  const { battleMode, rules } = levelSettings(level, mode);
  return {
    growth: false,
    layer: 'none',
    battleMode,
    rules: { abilities: rules.abilities, treasures: rules.treasures, heroReplacement: rules.heroReplacement, useDice: rules.useDice, extraEvilHero: rules.extraEvilHero, initiativeTie: rules.initiativeTie, heroMovePoints: rules.heroMovePoints, battleRoundLimit: rules.battleRoundLimit, hordeRespawn: rules.hordeRespawn !== false },
  };
}

/**
 * A custom table as a client sends it, checked field by field (a server must not take arbitrary rule fields): the allowed switches only, each
 * with a value from its list; a missing field keeps the level's value. A Polish reason when something is wrong.
 */
export function parseCustom(input: { growth?: unknown; layer?: unknown; battleMode?: unknown; rules?: unknown }, level: Level, mode: Mode): CustomTable | string {
  const out = defaultCustom(level, mode);
  if (input.growth !== undefined) {
    if (typeof input.growth !== 'boolean') return 'Nieprawidłowe ustawienie rozwoju bohatera.';
    out.growth = input.growth;
  }
  if (input.layer !== undefined) {
    if (!CUSTOM_LAYERS.includes(input.layer as CustomLayer)) return 'Nieznana warstwa mechanik.';
    out.layer = input.layer as CustomLayer;
  }
  if (input.battleMode !== undefined) {
    if (!BATTLE_MODES.includes(input.battleMode as BattleMode)) return 'Nieznany rodzaj bitew.';
    out.battleMode = input.battleMode as BattleMode;
  }
  if (input.rules !== undefined) {
    const r = input.rules as Record<string, unknown> | null;
    if (!r || typeof r !== 'object' || Array.isArray(r)) return 'Nieprawidłowe ustawienia zasad.';
    for (const [key, value] of Object.entries(r)) {
      if ((CUSTOM_BOOLEAN_RULES as readonly string[]).includes(key)) {
        if (typeof value !== 'boolean') return `Nieprawidłowa wartość zasady „${key}”.`;
        (out.rules as unknown as Record<string, unknown>)[key] = value;
      } else if (key === 'heroMovePoints') {
        if (!HERO_MOVE_POINTS.includes(value as number)) return 'Nieprawidłowy ruch bohatera.';
        out.rules.heroMovePoints = value as number;
      } else if (key === 'battleRoundLimit') {
        if (!BATTLE_ROUND_LIMITS.includes(value as number)) return 'Nieprawidłowy limit rund bitwy.';
        out.rules.battleRoundLimit = value as number;
      } else if (key === 'initiativeTie') {
        if (!INITIATIVE_TIES.includes(value as InitiativeTieMode)) return 'Nieznana zasada remisu inicjatywy.';
        out.rules.initiativeTie = value as InitiativeTieMode;
      } else return `Nieznana zasada „${key}”.`;
    }
  }
  // "Dodatkowy bohater Hordy" exists in coop only; the layers need hero growth.
  if (mode !== 'coop') out.rules.extraEvilHero = false;
  if (!out.growth) out.layer = 'none';
  return out;
}

/** The battle mode and the rules of a custom table: the level's preset with the player's switches on top (what the setup screen does). */
export function customSettings(level: Level, mode: Mode, custom: CustomTable): { battleMode: BattleMode; rules: RulesConfig } {
  const base = levelSettings(level, mode);
  return { battleMode: custom.battleMode, rules: { ...base.rules, ...custom.rules, extraEvilHero: mode === 'coop' && custom.rules.extraEvilHero } };
}
