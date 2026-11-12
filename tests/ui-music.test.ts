// The music theme follows what is on screen; the ritual music plays only while the ritual still stands.
import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/game';
import { treeOf } from '../src/engine/map';
import { musicTheme } from '../src/ui/gameDialogs';
import { pvpSeats, setup } from './helpers/engine';

describe('musicTheme', () => {
  it('plays the ritual only while the Horde hero still stands on the Tree (report 805567)', () => {
    const s = createGame(setup({ mode: 'pvp', seats: pvpSeats('goldDragon', 'werewolfLord') }));
    const evil = Object.values(s.heroes).find((h) => h.faction === 'horde')!;
    evil.pos = treeOf(s);
    s.ritual = 1;
    expect(musicTheme(s)).toBe('ritual');
    // The hero is beaten and leaves the Tree in the middle of the round: the counter still says 1, the music must not.
    evil.alive = false;
    expect(s.ritual).toBe(1);
    expect(musicTheme(s)).toBe('adventure');
  });

  it('is the adventure music without a ritual', () => {
    const s = createGame(setup({ mode: 'pvp', seats: pvpSeats('goldDragon', 'werewolfLord') }));
    expect(musicTheme(s)).toBe('adventure');
  });
});
