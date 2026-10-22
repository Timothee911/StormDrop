// STORMDROP service worker: the game works offline once it has been opened one time.
const VERSION = 'stormdrop-v17';
const CORE = [
  './',
  './game.html',
  './icons/icon-192.png',
  './img/lobby-bg.webp',
  './img/lobby-bg-small.webp',
  './icons/icon-512-maskable.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './index.html',
  './js/audio.js',
  './js/cosmetics.js',
  './js/lobby.js',
  './js/lock.js',
  './js/main.js',
  './js/outline.js',
  './js/settings.js',
  './js/world.js',
  './lobby.css',
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
  // network first for pages (so updates arrive quickly), cache first for everything else
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); return r; }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
