// Background music: a playlist per game situation, with crossfades (docs/muzyka/README.txt).
//   menu      — Sylvan Waltz (menu version) once, then Sylvan Waltz (map version) looping
//   adventure — Sylvan Waltz (map) and Maddie's Mirror in turn
//   battle    — Fantasy Choir 1 and 2 in turn; guardian — Fantasy Choir 3 and Determined Pursuit
//   ritual    — Defeat (loop version); victories play once.
// Distinct tracks hand over with a crossfade a few seconds before the end; a lone track loops
// natively (its file is cut for that). Going from the menu to the map keeps the Sylvan Waltz
// playing instead of restarting it. Battles and guardian fights continue the rotation, so the
// next fight opens with the other track.
// Browsers block audio until the first user gesture, so playback starts on the first click/tap
// anywhere. Volume and mute are remembered in localStorage.

import { asset } from './common';

export type Theme = 'menu' | 'adventure' | 'battle' | 'guardian' | 'ritual' | 'dawnVictory' | 'hordeVictory' | 'none';

interface Playlist {
  /** Played once before the loop. */
  intro?: string;
  /** Played in turn; a single track loops on its own. */
  loop: string[];
  /** Play the list once and stop. */
  once?: boolean;
}

const M = (f: string) => `music/${f}.mp3`;
const PLAYLISTS: Record<Exclude<Theme, 'none'>, Playlist> = {
  menu: { intro: M('menu-sylvan-waltz'), loop: [M('map-sylvan-waltz')] },
  adventure: { loop: [M('map-sylvan-waltz'), M('map-maddies-mirror')] },
  battle: { loop: [M('battle-fantasy-choir-1'), M('battle-fantasy-choir-2')] },
  guardian: { loop: [M('guardian-fantasy-choir-3'), M('guardian-determined-pursuit')] },
  ritual: { loop: [M('ritual-defeat-loop')] },
  dawnVictory: { loop: [M('dawn-victory-a-legend-will-rise')], once: true },
  hordeVictory: { loop: [M('horde-victory-the-fallen')], once: true },
};

/** The file a theme starts with (for preloading it before it is needed). */
export function firstTrack(theme: Exclude<Theme, 'none'>): string {
  const list = PLAYLISTS[theme];
  return list.intro ?? list.loop[0];
}

/** Crossfade between two different tracks (README: 2–4 s). */
const CROSSFADE_MS = 3000;
/** Fade when the situation changes (map → battle and so on). */
const SWITCH_MS = 1200;
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

interface Voice {
  audio: HTMLAudioElement;
  file: string;
  /** Position in the playlist's loop; -1 = the intro. */
  pos: number;
  /** The next track has already been started. */
  handedOver: boolean;
  /** Current fade, cancelled when a new one starts. */
  fadeId: number;
}

class MusicPlayer {
  private settings = load();
  private theme: Theme = 'none';
  private current: Voice | null = null;
  private unlocked = false;
  private listeners = new Set<() => void>();
  /** Where each rotating playlist starts next time (battles alternate between fights). */
  private rotation: Partial<Record<Theme, number>> = {};
  private fades = 0;

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
    this.applyVolume();
    this.save();
  }

  toggleMute() {
    this.settings.muted = !this.settings.muted;
    this.applyVolume();
    this.save();
  }

  private applyVolume() {
    if (!this.current) return;
    this.current.fadeId = ++this.fades;
    this.current.audio.volume = this.target();
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
    const previous = this.theme;
    this.theme = theme;
    if (!this.unlocked || typeof Audio === 'undefined') return;
    if (theme === 'none') {
      this.stopCurrent(SWITCH_MS);
      return;
    }
    const list = PLAYLISTS[theme];
    // Menu → map: the Sylvan Waltz already playing simply carries on into the map playlist.
    const carry = this.current && previous !== 'none' && !list.intro ? list.loop.indexOf(this.current.file) : -1;
    if (this.current && carry >= 0) {
      this.current.pos = carry;
      this.current.audio.loop = this.loopsAlone(list);
      return;
    }
    this.stopCurrent(SWITCH_MS);
    if (list.intro) this.start(list.intro, -1, SWITCH_MS);
    else {
      const pos = (this.rotation[theme] ?? 0) % list.loop.length;
      this.start(list.loop[pos], pos, SWITCH_MS);
    }
  }

  private loopsAlone(list: Playlist) {
    return list.loop.length === 1 && !list.once;
  }

  private start(file: string, pos: number, fadeMs: number) {
    const list = PLAYLISTS[this.theme as Exclude<Theme, 'none'>];
    const audio = new Audio(asset(file));
    audio.volume = 0;
    audio.loop = pos >= 0 && this.loopsAlone(list);
    const voice: Voice = { audio, file, pos, handedOver: false, fadeId: 0 };
    this.current = voice;
    if (pos >= 0 && list.loop.length > 1) this.rotation[this.theme] = pos + 1;
    audio.addEventListener('timeupdate', () => this.watch(voice));
    // Safety net: a track that ends without a handover (e.g. metadata came late) moves on now.
    audio.addEventListener('ended', () => {
      if (this.current === voice && !voice.handedOver) this.next(voice, 0);
    });
    Promise.resolve(audio.play()).catch(() => {
      // Autoplay refused: the next gesture retries the current theme via unlock().
      if (this.current === voice) {
        this.current = null;
        this.unlocked = false;
      }
    });
    this.fade(voice, this.target(), fadeMs);
  }

  /** Starts the crossfade into the next track a few seconds before this one ends. */
  private watch(voice: Voice) {
    if (this.current !== voice || voice.handedOver || voice.audio.loop) return;
    const left = voice.audio.duration - voice.audio.currentTime;
    if (Number.isFinite(left) && left <= CROSSFADE_MS / 1000) this.next(voice, CROSSFADE_MS);
  }

  private next(voice: Voice, fadeMs: number) {
    if (this.theme === 'none') return;
    const list = PLAYLISTS[this.theme];
    voice.handedOver = true;
    if (list.once && voice.pos >= list.loop.length - 1) return;
    const pos = voice.pos < 0 ? 0 : (voice.pos + 1) % list.loop.length;
    this.fade(voice, 0, fadeMs, () => voice.audio.pause());
    this.start(list.loop[pos], pos, fadeMs);
  }

  private stopCurrent(fadeMs: number) {
    const old = this.current;
    this.current = null;
    if (old) {
      old.handedOver = true;
      this.fade(old, 0, fadeMs, () => old.audio.pause());
    }
  }

  private fade(voice: Voice, to: number, ms: number, done?: () => void) {
    const id = (voice.fadeId = ++this.fades);
    const a = voice.audio;
    const from = a.volume;
    const t0 = performance.now();
    if (ms <= 0) {
      a.volume = to;
      done?.();
      return;
    }
    const step = (now: number) => {
      if (voice.fadeId !== id) return;
      const k = Math.min(1, (now - t0) / ms);
      // Equal-power curves keep the loudness steady while two tracks overlap.
      const w = to > from ? Math.sin((k * Math.PI) / 2) : 1 - Math.cos((k * Math.PI) / 2);
      a.volume = Math.max(0, Math.min(1, from + (to - from) * w));
      if (k < 1) requestAnimationFrame(step);
      else done?.();
    };
    requestAnimationFrame(step);
  }
}

export const music = new MusicPlayer();
