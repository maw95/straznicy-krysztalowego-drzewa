import { createContext, useContext } from 'react';
import { itemDef, scaleText, type ItemDef, type ItemKind } from '../engine/data';
import { asset } from './common';

/** Set by the app while a game with scaled Życie and Atak is on (`rules.statScale`); 1 elsewhere. */
export const StatScaleContext = createContext(1);

/** Set by the app while a game under the digital ruleset is on: treasure cards named after gear show their digital names and pictures. */
export const DigitalContext = createContext(false);

/** Treasure pictures the digital ruleset has of its own (public/assets/cards/treasures/cyfrowe). */
const DIGITAL_ART: ItemKind[] = ['sword', 'boots', 'shield'];
export const itemArt = (kind: ItemKind, digital: boolean) => asset(digital && DIGITAL_ART.includes(kind) ? `cards/treasures/cyfrowe/${kind}.jpg` : `cards/treasures/${kind}.jpg`);

/** A treasure card (name, text) and its picture as the game on screen shows them. */
export function useItem(kind: ItemKind): { def: ItemDef; art: string } {
  const digital = useContext(DigitalContext);
  return { def: itemDef(kind, digital), art: itemArt(kind, digital) };
}

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
