// The digital edition's complexity levels as sets of switches (docs/ROZBUDOWA_CYFROWA.md, the ladder of levels): level 1 "Przygoda" is the
// adventure of the board game's goal on the triangle map with fixed heroes; level 2 "Wyprawa" adds the goals, the map shapes and hero growth.
// "Własne" leaves every switch to the player. The presets only choose switches that already exist, so no rule lives here.

import type { MapShape, ObjectiveId } from './types';

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
