/* neV.BOOSTER — service worker : rend le site utilisable sans réseau.
   - pages et fichiers du site : réseau d'abord, copie locale si hors ligne ;
   - /api/ n'est JAMAIS mis en cache (données personnelles, toujours fraîches) ;
   - gros fichiers (vendor/, media/) : non mis en cache d'office. */
'use strict';
const V = 'nev-v25';
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
/* Notifications push (messages privés) : le serveur envoie un signal SANS contenu ; on demande ici l'aperçu,
   qui respecte les réglages de confidentialité du joueur. */
self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    let d = { title: 'neV.BOOSTER', body: 'Tu as un nouveau message.', url: 'social.html#/messages', count: 1 };
    try { const r = await fetch('api/social/notify-preview', { credentials: 'same-origin', cache: 'no-store', headers: { 'X-NEV': '1' } }); if (r.ok) d = await r.json(); } catch (x) { /* hors ligne : message générique */ }
    if (d.count === 0) { try { if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge(); } catch (x) { /* ignoré */ } return; }
    try { if (self.navigator.setAppBadge) await self.navigator.setAppBadge(d.count); } catch (x) { /* ignoré */ }
    await self.registration.showNotification(d.title, { body: d.body, tag: d.tag || 'dm', renotify: true, icon: 'img/icon-192.png', badge: 'img/icon-192.png', data: { url: d.url || 'social.html' } });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || 'quete.html';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    const c = cs.find((w) => 'focus' in w);
    if (c) { c.focus(); if ('navigate' in c) return c.navigate(url).catch(() => self.clients.openWindow(url)); return undefined; }
    return self.clients.openWindow(url);
  }));
});
