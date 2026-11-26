// STORMDROP service worker: the game works offline once it has been opened one time.
const VERSION = 'stormdrop-v92';
const CORE = [
  './',
  './game.html',
  './touch-hud.css',
  './icons/icon-192.png',
  './img/nature/bark.webp',
  './img/nature/bark2.webp',
  './img/nature/flowers.webp',
  './img/nature/leaf.webp',
  './img/nature/leafr.webp',
  './img/nature/leaves.webp',
  './img/nature/mush.webp',
  './img/nature/path.webp',
  './img/nature/pine.webp',
  './img/nature/rocks.webp',
  './img/lobby-bg.webp',
  './img/lobby-bg-small.webp',
  './icons/icon-512-maskable.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './index.html',
  './js/audio.js',
  './js/cosmetics.js',
  './js/squelette.js',
  './js/flora.js',
  './js/grass.js',
  './js/housemat.js',
  './js/fx.js',
  './js/play.js',
  './js/nature.js',
  './js/meubles.js',
  './js/lobby.js',
  './js/landscape.js',
  './js/lock.js',
  './js/main.js',
  './js/main.js?v=74',
  './js/outline.js',
  './js/settings.js',
  './js/weapons.js',
  './js/world.js',
  './lobby.css',
  './landscape.css',
  './manifest.webmanifest',
  './style.css',
  './vendor/addons/utils/BufferGeometryUtils.js',
  './vendor/three.module.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.host.includes('fonts.googleapis.com') || url.host.includes('fonts.gstatic.com');
  if (url.origin !== location.origin && !isFont) return;
  // network first with revalidation for pages and code (updates arrive immediately),
  // cache as offline fallback only.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); return r; }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(fetch(req, { cache: 'no-cache' }).then((r) => { if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return r; }).catch(async (err) => {
    const hit = await caches.match(req);
    if (hit) return hit;
    throw err;
  }));
});
