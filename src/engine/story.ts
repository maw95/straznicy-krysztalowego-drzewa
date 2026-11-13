// Story notes on hand-made maps: a window with text that opens when a trigger fires. A map lists its notes (customMaps.ts), the engine
// fires each at most once after an action and records it in the log (event "story") and in `state.storyFired`, so replays and online
// games see the same notes. The triggers of one note all have to hold:
//   round     the game has reached that round (1 = the first)
//   faction   it is that faction's turn (adventure), or, with `enter`, that faction's hero stands there
//   enter     a hero stands on the hex at [row, column] of the map's rows
//   defeated  the last battle ended with a unit of this kind (unit id, e.g. "hydra", "cyclops") fallen

import { CUSTOM_MAPS } from './customMaps';
import { key } from './hex';
import { activeHero } from './game';
import { log } from './log';
import type { FactionId } from './data';
import type { GameState } from './types';

export interface StoryWhen {
  round?: number;
  faction?: FactionId;
  enter?: [number, number];
  defeated?: string;
}

export interface StoryNote {
  id: string;
  title?: string;
  text: string;
  when: StoryWhen;
}

const hexAt = ([row, col]: [number, number]) => key({ q: col - Math.floor(row / 2), r: row });

function due(state: GameState, when: StoryWhen): boolean {
  if (when.round === undefined && !when.faction && !when.enter && !when.defeated) return false;
  if (when.round !== undefined && state.round < when.round) return false;
  const heroes = Object.values(state.heroes).filter((h) => h.alive);
  if (when.enter) {
    const k = hexAt(when.enter);
    if (!heroes.some((h) => h.pos === k && (!when.faction || h.faction === when.faction))) return false;
  } else if (when.faction) {
    const active = state.phase === 'adventure' ? activeHero(state) : null;
    if (!active || active.faction !== when.faction) return false;
  }
  if (when.defeated && !state.lastBattle?.units.some((u) => u.defId === when.defeated && !u.alive)) return false;
  return true;
}

/** Fires the notes whose triggers hold now and that have not been shown yet (called after every action). */
export function fireStory(state: GameState): void {
  const notes = CUSTOM_MAPS[state.setup.customMapId ?? '']?.story;
  if (!notes?.length || state.setup.mapShape !== 'custom') return;
  const fired = state.storyFired ?? [];
  for (const n of notes) {
    if (fired.includes(n.id) || !due(state, n.when)) continue;
    state.storyFired = [...(state.storyFired ?? []), n.id];
    log(state, 'info', n.title ? `${n.title}: ${n.text}` : n.text, undefined, { type: 'story', id: n.id, ...(n.title ? { title: n.title } : {}), text: n.text });
  }
}
