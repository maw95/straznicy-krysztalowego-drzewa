// Story notes on a hand-made map: each fires once, when its triggers hold, and lands in the log as an event.

import { describe, expect, it } from 'vitest';
import { registerCustomMap, validateCustomMap, CUSTOM_MAPS } from '../src/engine/customMaps';
import { activeHero, applyAction, createGame } from '../src/engine/game';
import { key } from '../src/engine/hex';
import { setup } from './helpers/engine';
import type { GameState } from '../src/engine/types';

registerCustomMap({
  id: 'testowa-fabula',
  name: 'Testowa',
  summary: '',
  rows: ['.....', '.....', 'D.T.H', '.....', '.....'],
  story: [
    { id: 'start', title: 'Początek', text: 'Dawno temu…', when: { round: 1 } },
    { id: 'tura3', text: 'Trzecia runda.', when: { round: 3 } },
    { id: 'przy-drzewie', text: 'Stoisz przy Drzewie.', when: { enter: [2, 2] } },
  ],
});

const game = (): GameState => createGame({ ...setup({}, { ruleset: 'digital', heroGrowth: true }), mapShape: 'custom', customMapId: 'testowa-fabula' });
const stories = (s: GameState) => s.log.flatMap((l) => (l.event?.type === 'story' ? [l.event.id] : []));

describe('story notes', () => {
  it('a note for round 1 fires with the game, once', () => {
    const s = game();
    expect(stories(s)).toEqual(['start']);
    expect(s.storyFired).toEqual(['start']);
    let t = s;
    for (let i = 0; i < 3; i++) t = applyAction(t, { type: 'endTurn' });
    expect(stories(t).filter((x) => x === 'start')).toHaveLength(1);
  });

  it('fires on the round and when a hero stands on the hex', () => {
    let s = game();
    expect(stories(s)).not.toContain('tura3');
    const hero = activeHero(s)!;
    // Put the hero on the Tree hex: row 2, column 2.
    s.heroes[hero.id].pos = key({ q: 2 - 1, r: 2 });
    s = applyAction(s, { type: 'endTurn' });
    expect(stories(s)).toContain('przy-drzewie');
    for (let i = 0; i < 12 && !stories(s).includes('tura3'); i++) s = applyAction(s, { type: 'endTurn' });
    expect(stories(s)).toContain('tura3');
    expect(new Set(s.storyFired).size).toBe(s.storyFired!.length);
  });

  it('refuses a note without a trigger, with a repeated id or off the map', () => {
    const base = { id: 'x', name: 'x', summary: '', rows: ['D.T.H', '.....', '.....'] };
    expect(() => validateCustomMap({ ...base, story: [{ id: 'a', text: 'a', when: {} }] })).toThrow(/wyzwalacza/);
    expect(() => validateCustomMap({ ...base, story: [{ id: 'a', text: 'a', when: { round: 2 } }, { id: 'a', text: 'b', when: { round: 3 } }] })).toThrow(/powtórzony/);
    expect(() => validateCustomMap({ ...base, story: [{ id: 'a', text: 'a', when: { enter: [9, 9] } }] })).toThrow(/poza mapą/);
    expect(CUSTOM_MAPS['testowa-fabula'].story).toHaveLength(3);
  });
});
