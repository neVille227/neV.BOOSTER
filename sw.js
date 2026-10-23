/* neV.BOOSTER — service worker : rend le site utilisable sans réseau.
   - pages et fichiers du site : réseau d'abord, copie locale si hors ligne ;
   - /api/ n'est JAMAIS mis en cache (données personnelles, toujours fraîches) ;
   - gros fichiers (vendor/, media/) : non mis en cache d'office. */
'use strict';
const V = 'nev-v2';
const CORE = ['offline.html', 'accueil.html', 'css/nev.css', 'fonts/fonts.css', 'js/core.js', 'js/ui.js', 'img/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.indexOf('/api/') >= 0 || u.pathname.indexOf('/admin/') >= 0) return;
  if (/\/(vendor|media)\//.test(u.pathname) || /\.(mp4|webm|mp3|wasm|tflite|task|data)$/.test(u.pathname)) return;
  e.respondWith(
    fetch(r).then((res) => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(V).then((c) => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r).then((hit) => hit || (r.mode === 'navigate' ? caches.match('offline.html') : Response.error())))
  );
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => (cs.length ? cs[0].focus() : self.clients.openWindow('quete.html'))));
});
