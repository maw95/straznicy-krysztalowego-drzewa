import { createContext, useContext } from 'react';
import { scaleText } from '../engine/data';

/** Set by the app while a game with scaled Życie and Atak is on (`rules.statScale`); 1 elsewhere. */
export const StatScaleContext = createContext(1);

/** Level of each hero of the game on screen (hero growth), so a hero's card shows the milestones it has reached; empty elsewhere. */
export const HeroLevelsContext = createContext<Record<string, number>>({});

/** A rule text of the board game's numbers, as the game being played reads it. */
export function useScaledText(text: string): string {
  return scaleText(text, useContext(StatScaleContext));
}

/** The same, as an element (for rule texts inside a component that is not itself a hook user). */
export function RuleText({ text }: { text: string }) {
  return <>{useScaledText(text)}</>;
}
