// PWA: the service worker (public/sw.js) and the "install" offer. The worker is registered only in a built game (the dev server would serve stale files),
// with the game's version in its address so that a new release starts a new cache. Chrome and Edge offer installing through `beforeinstallprompt`; iPhones
// have no such event (Safari: Share -> "Add to Home Screen"), so the hint tells that instead.

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function registerPwa(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js?v=${encodeURIComponent(__APP_VERSION__)}`).catch(() => undefined);
  });
}

export const isStandalone = (): boolean => (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches) || (navigator as { standalone?: boolean }).standalone === true;
export const isIos = (): boolean => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const canInstall = (): boolean => deferred !== null;

export async function promptInstall(): Promise<void> {
  if (!deferred) return;
  const e = deferred;
  deferred = null;
  await e.prompt();
  await e.userChoice;
  listeners.forEach((l) => l());
}

export function onInstallChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
