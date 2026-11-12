// Sound effects (public/assets/dzwieki, made with Scenario): a few short sounds the game plays on blows, shots, spells, steps,
// buttons, treasures, level-ups and the end of a game. Volume and mute are remembered in localStorage, apart from the music's.
// Nothing here may break the game: without audio (tests, a blocked autoplay) every call quietly does nothing.

import { asset } from './common';

export type Sfx = 'sword_hit' | 'arrow_shot' | 'magic_cast' | 'magic_attack' | 'footstep_walk' | 'ui_click' | 'treasure_found' | 'level_up' | 'victory' | 'defeat' | 'hero_step' | 'crystal_pickup' | 'tree_deliver';

/** Relative loudness of each sound (the files are normalised to about the same peak, but a click should be quiet and a fanfare roomy). */
const GAIN: Record<Sfx, number> = { sword_hit: 0.9, arrow_shot: 0.8, magic_cast: 0.8, magic_attack: 0.8, footstep_walk: 0.45, ui_click: 0.5, treasure_found: 0.8, level_up: 0.8, victory: 0.85, defeat: 0.85, hero_step: 0.6, crystal_pickup: 0.8, tree_deliver: 0.85 };

/** Units with their own attack and death sounds (dzwieki/jednostki/<id>_atak.mp3 and _smierc.mp3). */
export const UNIT_SOUNDS = new Set(['goldDragon', 'unicornKing', 'ancientBear', 'braveDuck', 'elfDruid', 'nymph', 'pegasus', 'shardling', 'burrower', 'skyEagle', 'harpy', 'pincer', 'bogCrawler', 'stoneGolem', 'stormKing', 'kraken', 'tentacle', 'blackDragon', 'werewolfLord', 'ironFistOgre', 'goblinShaman', 'caveSpider', 'shadowBat', 'cyclops', 'griffin', 'hydra']);
const UNIT_GAIN = 0.85;

const STORE_KEY = 'skd-sfx';

function load(): { volume: number; muted: boolean } {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY) ?? '');
    if (typeof v.volume === 'number' && typeof v.muted === 'boolean') return v;
  } catch {
    // first run or storage unavailable
  }
  return { volume: 0.7, muted: false };
}

class Effects {
  private settings = load();
  private listeners = new Set<() => void>();
  private cache = new Map<string, HTMLAudioElement>();
  /** The looped steps: on while any walker is moving. */
  private walkers = new Set<string>();
  private loop: HTMLAudioElement | null = null;

  get volume() {
    return this.settings.volume;
  }
  get muted() {
    return this.settings.muted;
  }
  subscribe(l: () => void) {
    this.listeners.add(l);
    return () => void this.listeners.delete(l);
  }
  private save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.settings));
    } catch {
      // storage unavailable: only for this visit
    }
    for (const l of [...this.listeners]) l();
  }
  setVolume(v: number) {
    this.settings.volume = Math.max(0, Math.min(1, v));
    if (this.loop) this.loop.volume = this.level('footstep_walk');
    this.save();
  }
  toggleMute() {
    this.settings.muted = !this.settings.muted;
    if (this.settings.muted) this.stopLoop();
    this.save();
  }
  private level(name: Sfx) {
    return this.settings.muted ? 0 : Math.max(0, Math.min(1, this.settings.volume * GAIN[name]));
  }
  private audio(name: string): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') return null;
    let a = this.cache.get(name);
    if (!a) {
      a = new Audio(asset(`dzwieki/${name}.mp3`));
      a.preload = 'auto';
      this.cache.set(name, a);
    }
    return a;
  }

  /** Plays a sound from its start (a second call while it still plays starts a fresh copy, so quick blows overlap instead of cutting each other). */
  play(name: Sfx) {
    if (this.settings.muted || this.settings.volume <= 0) return;
    try {
      const base = this.audio(name);
      if (!base) return;
      const a = base.paused || base.ended ? base : (base.cloneNode() as HTMLAudioElement);
      a.currentTime = 0;
      a.volume = this.level(name);
      void a.play().catch(() => undefined);
    } catch {
      // no audio available
    }
  }

  /** The attack or death sound of a unit; a unit without its own sounds gets `fallback` (when given). */
  unit(defId: string, kind: 'atak' | 'smierc', fallback?: Sfx) {
    if (!UNIT_SOUNDS.has(defId)) {
      if (fallback) this.play(fallback);
      return;
    }
    if (this.settings.muted || this.settings.volume <= 0) return;
    try {
      const base = this.audio(`jednostki/${defId}_${kind}`);
      if (!base) return;
      const a = base.paused || base.ended ? base : (base.cloneNode() as HTMLAudioElement);
      a.currentTime = 0;
      a.volume = Math.max(0, Math.min(1, this.settings.volume * UNIT_GAIN));
      void a.play().catch(() => undefined);
    } catch {
      // no audio available
    }
  }

  /** A walker starts or stops moving: the steps loop plays while at least one walks. */
  walking(id: string, on: boolean) {
    if (on) this.walkers.add(id);
    else this.walkers.delete(id);
    if (this.walkers.size && !this.settings.muted) this.startLoop();
    else if (!this.walkers.size) this.stopLoop();
  }
  private startLoop() {
    if (this.loop && !this.loop.paused) return;
    try {
      const a = this.loop ?? this.audio('footstep_walk');
      if (!a) return;
      a.loop = true;
      a.volume = this.level('footstep_walk');
      this.loop = a;
      void a.play().catch(() => undefined);
    } catch {
      // no audio available
    }
  }
  private stopLoop() {
    this.loop?.pause();
    if (this.loop) this.loop.currentTime = 0;
  }
}

export const sfx = new Effects();
