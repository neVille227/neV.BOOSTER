/* neV.BOOSTER — appli installable, hors ligne, rappels (facultatifs)
   Rappels : le navigateur ne laisse pas un site réveiller ton téléphone sans service
   d'envoi (push) ; ici le rappel s'affiche quand tu ouvres l'appli après l'heure choisie
   si tu n'as pas encore fait ta séance du jour. C'est dit tel quel dans les réglages. */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {}), doc = g.document;
  const KEY = 'nev.reminder';
  const head = doc.head;
  if (!doc.querySelector('link[rel=manifest]')) { const l = doc.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.webmanifest'; head.appendChild(l); }
  if (!doc.querySelector('link[rel=apple-touch-icon]')) { const l = doc.createElement('link'); l.rel = 'apple-touch-icon'; l.href = 'img/apple-touch-icon.png'; head.appendChild(l); }

  let reg = null, deferred = null;
  const sw = ('serviceWorker' in g.navigator) && (g.location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(g.location.hostname));
  if (sw) g.navigator.serviceWorker.register('sw.js').then((r) => { reg = r; remind(); }).catch(() => {});
  g.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; banner(); });
  g.addEventListener('appinstalled', () => { deferred = null; const b = doc.getElementById('nevInstall'); if (b) b.remove(); try { g.localStorage.setItem('nev.installed', '1'); } catch (e) { /* ignoré */ } });

  /* Bandeau « Installer l'application » : Android / ordinateur (bouton direct) et iPhone (mode d'emploi). Une fois refusé, il ne revient pas avant 14 jours. */
  const DISMISS = 'nev.installNo';
  const ios = /iphone|ipad|ipod/i.test(g.navigator.userAgent) || (g.navigator.platform === 'MacIntel' && g.navigator.maxTouchPoints > 1);
  function banner() {
    if (doc.getElementById('nevInstall') || NEV.pwa && NEV.pwa.standalone()) return;
    if (!/(accueil|connexion|tuto)\.html$/.test(g.location.pathname)) return;
    try { const d = +g.localStorage.getItem(DISMISS) || 0; if (Date.now() - d < 14 * 864e5 || g.localStorage.getItem('nev.installed')) return; } catch (e) { /* ignoré */ }
    if (!deferred && !ios) return;
    const el = doc.createElement('div'); el.id = 'nevInstall'; el.className = 'nevinst'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Installer l\'application');
    el.innerHTML = '<img src="img/icon-192.png" alt="" width="44" height="44"><div class="t"><b>Installe l\'appli neV.BOOSTER</b><span>' +
      (deferred ? 'Plein écran, icône sur ton écran d\'accueil, pages vues hors ligne.' : 'Touche Partager puis « Sur l\'écran d\'accueil ».') + '</span></div>' +
      (deferred ? '<button type="button" class="btn sm" id="nevInstallGo">Installer</button>' : '') + '<button type="button" class="x" aria-label="Plus tard">✕</button>';
    doc.body.appendChild(el);
    const go = el.querySelector('#nevInstallGo'); if (go) go.onclick = async () => { const ok = await NEV.pwa.install(); if (ok) el.remove(); };
    el.querySelector('.x').onclick = () => { try { g.localStorage.setItem(DISMISS, String(Date.now())); } catch (e) { /* ignoré */ } el.remove(); };
  }
  if (ios) setTimeout(banner, 3000);

  const get = () => { try { return JSON.parse(g.localStorage.getItem(KEY)) || { on: false, hour: 18 }; } catch (e) { return { on: false, hour: 18 }; } };
  const set = (v) => { try { g.localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* ignoré */ } };
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  function remind() {
    const c = get(); if (!c.on || !reg || !g.Notification || g.Notification.permission !== 'granted') return;
    const now = new Date(); if (now.getHours() < c.hour || c.last === today()) return;
    let done = false; try { const p = NEV.player && NEV.player.load(); done = !!(p && (p.history || []).some((x) => x.date === today())); } catch (e) { /* ignoré */ }
    if (done) return;
    c.last = today(); set(c);
    reg.showNotification('neV.BOOSTER', { body: 'Ta séance du jour t\'attend : quelques minutes suffisent. 🔥', icon: 'img/icon-192.png', badge: 'img/icon-192.png', tag: 'nev-daily' });
  }

  NEV.pwa = {
    supported: sw,
    standalone: () => (g.matchMedia && g.matchMedia('(display-mode: standalone)').matches) || g.navigator.standalone === true,
    canInstall: () => !!deferred,
    install: async () => { if (!deferred) return false; deferred.prompt(); const r = await deferred.userChoice; deferred = null; return r.outcome === 'accepted'; },
    notifSupported: () => !!g.Notification && sw,
    reminder: get,
    setReminder: async (on, hour) => {
      const c = get(); c.hour = Math.min(23, Math.max(5, Number(hour) || 18));
      if (on) { const p = g.Notification.permission === 'granted' ? 'granted' : await g.Notification.requestPermission(); c.on = p === 'granted'; } else c.on = false;
      set(c); return c;
    }
  };
})(window);
