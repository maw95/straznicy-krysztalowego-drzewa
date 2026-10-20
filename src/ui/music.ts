// Background music: one track per game situation, crossfaded.
// Browsers block audio until the first user gesture, so playback starts on the
// first click/tap anywhere. Volume and mute are remembered in localStorage.

import { asset } from './common';

export type Theme = 'menu' | 'adventure' | 'battle' | 'guardian' | 'ritual' | 'dawnVictory' | 'hordeVictory' | 'none';

interface Track {
  intro?: string;
  loop: string;
  /** Play once instead of looping. */
  once?: boolean;
}

const TRACKS: Record<Exclude<Theme, 'none'>, Track> = {
  menu: { loop: 'music/menu.mp3' },
  adventure: { loop: 'music/adventure.mp3' },
  battle: { loop: 'music/battle.mp3' },
  guardian: { loop: 'music/guardian.mp3' },
  ritual: { loop: 'music/ritual.mp3' },
  dawnVictory: { loop: 'music/dawn-victory.mp3', once: true },
  hordeVictory: { loop: 'music/horde-victory.mp3', once: true },
};

const FADE_MS = 1200;
const STORE_KEY = 'skd-music';

function load(): { volume: number; muted: boolean } {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY) ?? '');
    if (typeof v.volume === 'number' && typeof v.muted === 'boolean') return v;
  } catch {
    // no saved settings
  }
  return { volume: 0.5, muted: false };
}

class MusicPlayer {
  private settings = load();
  private theme: Theme = 'none';
  private current: HTMLAudioElement | null = null;
  private unlocked = false;
  private listeners = new Set<() => void>();

  get volume() {
    return this.settings.volume;
  }
  get muted() {
    return this.settings.muted;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  private save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.settings));
    } catch {
      // storage unavailable: settings last for this session only
    }
    this.listeners.forEach((fn) => fn());
  }

  private target() {
    return this.settings.muted ? 0 : this.settings.volume;
  }

  setVolume(v: number) {
    this.settings.volume = Math.max(0, Math.min(1, v));
    if (this.current) this.current.volume = this.target();
    this.save();
  }

  toggleMute() {
    this.settings.muted = !this.settings.muted;
    if (this.current) this.current.volume = this.target();
    this.save();
  }

  /** Called once from a user gesture. */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    const t = this.theme;
    this.theme = 'none';
    this.play(t);
  }

  play(theme: Theme) {
    if (theme === this.theme) return;
    this.theme = theme;
    if (!this.unlocked || typeof Audio === 'undefined') return;
    const old = this.current;
    this.current = null;
    if (old) this.fade(old, 0, () => old.pause());
    if (theme === 'none') return;
    const track = TRACKS[theme];
    const start = (file: string, loop: boolean, onEnd?: () => void) => {
      const a = new Audio(asset(file));
      a.loop = loop;
      a.volume = 0;
      if (onEnd) a.addEventListener('ended', onEnd, { once: true });
      this.current = a;
      Promise.resolve(a.play()).catch(() => {
        // autoplay refused; next gesture will retry via unlock()
        this.unlocked = false;
        this.theme = 'none';
      });
      return a;
    };
    const loop = () => {
      if (this.theme !== theme) return;
      const a = start(track.loop, !track.once);
      a.volume = this.target();
    };
    if (track.intro) this.fade(start(track.intro, false, loop), this.target());
    else this.fade(start(track.loop, !track.once), this.target());
  }

  private fade(a: HTMLAudioElement, to: number, done?: () => void) {
    const from = a.volume;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / FADE_MS);
      a.volume = from + (to - from) * k;
      if (k < 1) requestAnimationFrame(step);
      else done?.();
    };
    requestAnimationFrame(step);
  }
}

export const music = new MusicPlayer();
