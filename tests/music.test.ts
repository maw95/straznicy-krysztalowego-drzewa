// @vitest-environment jsdom
// Playlist order and handovers of the music player, with a fake <audio>.
import { beforeEach, describe, expect, it, vi } from 'vitest';

class FakeAudio {
  static all: FakeAudio[] = [];
  volume = 1;
  loop = false;
  paused = true;
  currentTime = 0;
  duration = 100;
  private handlers: Record<string, Array<() => void>> = {};
  constructor(public src: string) {
    FakeAudio.all.push(this);
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  addEventListener(type: string, fn: () => void) {
    (this.handlers[type] ??= []).push(fn);
  }
  /** Jumps close to the end, as the browser's timeupdate would report. */
  nearEnd() {
    this.currentTime = this.duration - 2;
    this.handlers.timeupdate?.forEach((fn) => fn());
  }
}

const playing = () => FakeAudio.all.filter((a) => !a.paused).map((a) => a.src.replace(/^.*music\//, ''));
const latest = () => FakeAudio.all[FakeAudio.all.length - 1];

beforeEach(() => {
  FakeAudio.all = [];
  vi.stubGlobal('Audio', FakeAudio);
  // Fades finish at once: every frame is far in the future.
  let t = 0;
  vi.stubGlobal('requestAnimationFrame', (fn: (now: number) => void) => fn((t += 10_000)));
  vi.resetModules();
});

describe('music playlists', () => {
  it('menu: the menu waltz once, then the map waltz looping; the map keeps it and alternates with Maddie\'s Mirror', async () => {
    const { music } = await import('../src/ui/music');
    music.play('menu');
    music.unlock();
    expect(playing()).toEqual(['menu-sylvan-waltz.mp3']);
    latest().nearEnd();
    expect(playing()).toEqual(['map-sylvan-waltz.mp3']);
    expect(latest().loop).toBe(true);

    // Starting the game: the waltz carries on instead of restarting.
    const waltz = latest();
    music.play('adventure');
    expect(latest()).toBe(waltz);
    expect(waltz.loop).toBe(false);
    waltz.nearEnd();
    expect(playing()).toEqual(['map-maddies-mirror.mp3']);
    latest().nearEnd();
    expect(playing()).toEqual(['map-sylvan-waltz.mp3']);
  });

  it('battles and guardian fights alternate their two tracks, also from one fight to the next', async () => {
    const { music } = await import('../src/ui/music');
    music.unlock();
    music.play('battle');
    expect(playing()).toEqual(['battle-fantasy-choir-1.mp3']);
    latest().nearEnd();
    expect(playing()).toEqual(['battle-fantasy-choir-2.mp3']);
    music.play('adventure');
    music.play('battle');
    expect(playing().at(-1)).toBe('battle-fantasy-choir-1.mp3');

    music.play('guardian');
    expect(playing()).toEqual(['guardian-fantasy-choir-3.mp3']);
    music.play('adventure');
    music.play('guardian');
    expect(playing().at(-1)).toBe('guardian-determined-pursuit.mp3');
  });

  it('loops the ritual on its own and plays a victory once', async () => {
    const { music } = await import('../src/ui/music');
    music.unlock();
    music.play('ritual');
    expect(latest().src).toContain('ritual-defeat-loop.mp3');
    expect(latest().loop).toBe(true);
    music.play('dawnVictory');
    const win = latest();
    expect(win.src).toContain('dawn-victory-a-legend-will-rise.mp3');
    win.nearEnd();
    expect(latest()).toBe(win);
  });
});
