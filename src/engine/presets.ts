// The digital edition's complexity levels as sets of switches (docs/ROZBUDOWA_CYFROWA.md, the ladder of levels): level 1 "Przygoda" is the
// adventure of the board game's goal on the triangle map with fixed heroes; level 2 "Wyprawa" adds the goals, the map shapes and hero growth.
// "Własne" leaves every switch to the player. The presets only choose switches that already exist, so no rule lives here.

import { levelSettings, type BattleMode, type InitiativeTieMode, type Level, type MapShape, type Mode, type ObjectiveId, type RulesConfig, type SetupOptions } from './types';

export type Tier = 'adventure' | 'expedition' | 'custom';

export interface Switches {
  objective: ObjectiveId;
  shape: MapShape;
  customMapId?: string;
  growth: boolean;
}

export const TIERS: Record<Tier, { name: string; summary: string }> = {
  adventure: { name: 'Poziom 1: Przygoda', summary: 'Zasady z planszówki w wersji cyfrowej: kryształy do Drzewa, mapa-trójkąt, bohaterowie bez rozwoju. Najprostszy start, także dla dzieci.' },
  expedition: { name: 'Poziom 2: Wyprawa', summary: 'Do wyboru cel (punkty kontrolne, przetrwanie, boss, artefakt) i kształt mapy; bohaterowie zdobywają doświadczenie, artefakty i umiejętności.' },
  custom: { name: 'Własne ustawienia', summary: 'Każdy przełącznik osobno: rozwój bohatera, rodzaj bitew, ułatwienia, utrudnienia i remis inicjatywy, a do tego cel i kształt mapy.' },
};

/** The switches a tier sets, given what the player picked on the screen (the picks count where the tier leaves the choice open). */
export function resolveTier(tier: Tier, picks: Switches): Switches {
  if (tier === 'adventure') return { objective: 'crystals', shape: 'triangle', growth: false };
  if (tier === 'expedition') return { ...picks, growth: true };
  return picks;
}

/** The set-up with the digital edition's rules switched on when asked (the arena battles; the board duels of the easy level are the same), and its objective, map and hero growth. */
export function withRuleset(setup: SetupOptions, digital: boolean, objective: ObjectiveId = 'crystals', shape: MapShape = 'triangle', customMapId?: string, growth = false): SetupOptions {
  if (!digital) return setup;
  return { ...setup, ...(shape !== 'triangle' && setup.mode !== 'arena' ? { mapShape: shape, ...(shape === 'custom' ? { customMapId } : {}) } : {}), rules: { ...setup.rules, ruleset: 'digital', ...(growth && setup.mode !== 'arena' ? { heroGrowth: true } : {}), ...(objective !== 'crystals' && (objective !== 'survival' || setup.mode === 'coop') && setup.mode !== 'arena' ? { objective } : {}) } };
}

// ------------------------------------------------------------------ "Własne ustawienia" at a table

/** The loose rule switches of the custom tier: the ones the setup screen shows as "Ułatwienia", "Utrudnienia" and "Remis inicjatywy". */
export type CustomRules = Pick<RulesConfig, 'abilities' | 'treasures' | 'heroReplacement' | 'useDice' | 'extraEvilHero' | 'initiativeTie'>;

/** Everything the custom tier lets a player change besides the goal and the map (those are `Switches`). */
export interface CustomTable {
  growth: boolean;
  battleMode: BattleMode;
  rules: CustomRules;
}

export const CUSTOM_BOOLEAN_RULES = ['abilities', 'treasures', 'heroReplacement', 'useDice', 'extraEvilHero'] as const;
export const INITIATIVE_TIES: InitiativeTieMode[] = ['defender', 'rotating'];
const BATTLE_MODES: BattleMode[] = ['arena', 'board'];

/** The custom tier's starting point: what the level preset sets (the screens begin from it and the player switches from there). */
export function defaultCustom(level: Level, mode: Mode): CustomTable {
  const { battleMode, rules } = levelSettings(level, mode);
  return {
    growth: false,
    battleMode,
    rules: { abilities: rules.abilities, treasures: rules.treasures, heroReplacement: rules.heroReplacement, useDice: rules.useDice, extraEvilHero: rules.extraEvilHero, initiativeTie: rules.initiativeTie },
  };
}

/**
 * A custom table as a client sends it, checked field by field (a server must not take arbitrary rule fields): the allowed switches only, each
 * with a value from its list; a missing field keeps the level's value. A Polish reason when something is wrong.
 */
export function parseCustom(input: { growth?: unknown; battleMode?: unknown; rules?: unknown }, level: Level, mode: Mode): CustomTable | string {
  const out = defaultCustom(level, mode);
  if (input.growth !== undefined) {
    if (typeof input.growth !== 'boolean') return 'Nieprawidłowe ustawienie rozwoju bohatera.';
    out.growth = input.growth;
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
      } else if (key === 'initiativeTie') {
        if (!INITIATIVE_TIES.includes(value as InitiativeTieMode)) return 'Nieznana zasada remisu inicjatywy.';
        out.rules.initiativeTie = value as InitiativeTieMode;
      } else return `Nieznana zasada „${key}”.`;
    }
  }
  // "Dodatkowy bohater Hordy" exists in coop only.
  if (mode !== 'coop') out.rules.extraEvilHero = false;
  return out;
}

/** The battle mode and the rules of a custom table: the level's preset with the player's switches on top (what the setup screen does). */
export function customSettings(level: Level, mode: Mode, custom: CustomTable): { battleMode: BattleMode; rules: RulesConfig } {
  const base = levelSettings(level, mode);
  return { battleMode: custom.battleMode, rules: { ...base.rules, ...custom.rules, extraEvilHero: mode === 'coop' && custom.rules.extraEvilHero } };
}
