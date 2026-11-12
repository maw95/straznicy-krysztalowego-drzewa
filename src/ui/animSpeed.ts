// The speed of everything the player watches (walks, blows, clips, effects), set in the options: normal, fast, very fast.
// Four places honour it: the sprite clock (`animClock`), the timers that follow animations (`scaledMs`, also inside `holdFor`),
// and every CSS animation and transition on the page (their playback rate is raised while a faster speed is chosen).

const KEY = 'skd-anim-speed';
export const ANIM_SPEEDS = [1, 1.6, 2.5] as const;
export const ANIM_SPEED_NAMES = ['normalnie', 'szybko', 'bardzo szybko'] as const;

function read(): number {
  try {
    const level = Number(localStorage.getItem(KEY));
    return Number.isInteger(level) && level >= 0 && level < ANIM_SPEEDS.length ? level : 0;
  } catch {
    return 0;
  }
}

let level = read();

/** 0 normal, 1 fast, 2 very fast. */
export function animSpeedLevel(): number {
  return level;
}

/** How many times faster than normal the animations run. */
export function animFactor(): number {
  return ANIM_SPEEDS[level];
}

/** A time that follows an animation, shortened to the chosen speed. */
export function scaledMs(ms: number): number {
  return ms / animFactor();
}

// The animation clock: ticks `animFactor()` times faster than the real one, so a clip, a glide or a flight shortens by itself.
let virtual = 0;
let last = typeof performance === 'undefined' ? 0 : performance.now();
export function animClock(real: number = performance.now()): number {
  virtual += Math.max(0, real - last) * animFactor();
  last = Math.max(last, real);
  return virtual;
}

let loop = 0;
/** CSS animations and transitions are sped up while a faster speed is chosen (checked each frame: some start with a delay). */
function followCss() {
  if (loop || typeof document === 'undefined' || typeof document.getAnimations !== 'function') return;
  const f = animFactor();
  if (f === 1) {
    document.getAnimations().forEach((a) => a.playbackRate !== 1 && (a.playbackRate = 1));
    return;
  }
  const step = () => {
    const rate = animFactor();
    for (const a of document.getAnimations()) if (a.playbackRate !== rate) (a.playbackRate = rate);
    loop = rate === 1 ? 0 : requestAnimationFrame(step);
  };
  loop = requestAnimationFrame(step);
}

export function setAnimSpeedLevel(next: number) {
  animClock(); // close the stretch run at the old speed
  level = Math.max(0, Math.min(ANIM_SPEEDS.length - 1, Math.round(next)));
  try {
    localStorage.setItem(KEY, String(level));
  } catch {
    /* private mode: the speed lasts until the page is closed */
  }
  followCss();
}

followCss();
