// Service worker of the game (PWA): the game opens offline after one visit (against the computer; online play needs the network anyway).
// - the page and its scripts (index.html, hashed /assets/*.js|css): network first, the cached copy only when the network fails, so a new release
//   shows at once when online and an old one never sticks;
// - pictures, sounds, music, models: cache first (they never change under the same name within a release), filled as they are used.
// The cache name carries the game version (the page passes it in the registration URL): a new release starts a new cache and drops the old ones.
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `skd-${VERSION}`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((n) => n.startsWith('skd-') && n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim()),
  );
});

const isCode = (url) => url.pathname.endsWith('/') || /\.(html|js|css|webmanifest)$/.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // The game server (another origin: API and WebSocket) and the bug report endpoint are never cached.
  if (url.origin !== self.location.origin || url.pathname.endsWith('/__bug-report')) return;
  // Audio and video are fetched in ranges: a partial answer cannot be cached, so let the browser handle them.
  if (req.headers.has('range')) return;
  event.respondWith(isCode(url) || req.mode === 'navigate' ? networkFirst(req) : cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (error) {
    const hit = (await cache.match(req)) || (req.mode === 'navigate' ? await cache.match('./') : undefined);
    if (hit) return hit;
    throw error;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}
