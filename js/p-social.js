/* neV.BOOSTER — Social : accueil, recherche @pseudo, profils, messagerie privée, notifications. */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc;
  await NEV.cloud.ready;
  const user = await NEV.cloud.sync();
  const ctx = user ? await NEV.boot('social', { needLevel: false, quiet: true }) : await NEV.bootPublic('social');
  if (user && !ctx) return;
  const guest = !user, body = $('socBody');
  if (NEV.cloud.mode !== 'server') {
    $('socTabs').hidden = true; $('socNotif').hidden = true;
    body.innerHTML = '<div class="empty"><b>Le social est disponible en ligne</b>Cette version locale n\'a pas de serveur de messagerie.</div>'; return;
  }
  const SIGN = 'connexion.html?sex=' + (NEV.sex === 'f' ? 'f' : 'm');
  let me = null, unread = 0, requests = 0, stream = null, cur = { view: '', handle: '' }, convCache = null, imagesOn = false, pushKey = '', pushOn = false;

  /* ---------- utilitaires ---------- */
  async function api(path, method, data) {
    try {
      const r = await fetch('api/social/' + path, { method: method || 'GET', credentials: 'same-origin', cache: 'no-store', headers: Object.assign({ 'X-NEV': '1' }, data ? { 'Content-Type': 'application/json' } : {}), body: data ? JSON.stringify(data) : undefined });
      let j = {}; try { j = await r.json(); } catch (e) { /* vide */ }
      return { ok: r.ok, s: r.status, j: j };
    } catch (e) { return { ok: false, s: 0, j: { error: 'Connexion impossible. Réessaie.' } }; }
  }
  const toast = (m) => NEV.ui.toast(m);
  const AV_SEX = (s) => 'img/avatar-' + (s === 'f' ? 'f' : 'm') + '.webp';
  function av(a, handle, sex, size) {
    a = a || 'evo'; const cls = 'av' + (size ? ' ' + size : '');
    if (a === 'evo') return '<span class="' + cls + ' evo p7"><img src="' + AV_SEX(sex) + '" alt="" loading="lazy"></span>';
    if (/^p[1-8]$/.test(a)) return '<span class="' + cls + ' ' + a + '" aria-hidden="true">' + esc(String(handle || '?').charAt(0).toUpperCase()) + '</span>';
    if (/^data:image\/(jpeg|png|webp);base64,/.test(a)) return '<span class="' + cls + '"><img src="' + a.replace(/"/g, '') + '" alt=""></span>';
    return '<span class="' + cls + ' p7">?</span>';
  }
  function ago(t) {
    const s = (Date.now() - t) / 1000;
    if (s < 60) return 'à l\'instant'; if (s < 3600) return Math.floor(s / 60) + ' min'; if (s < 86400) return Math.floor(s / 3600) + ' h';
    if (s < 604800) return Math.floor(s / 86400) + ' j'; return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
  const hm = (t) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dayLabel = (t) => { const d = new Date(t), n = new Date(); const k = (x) => x.toDateString(); const y = new Date(n - 864e5); return k(d) === k(n) ? 'Aujourd\'hui' : k(d) === k(y) ? 'Hier' : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); };
  function setBadge() {
    const n = unread + requests, b = $('socBadge'); b.hidden = !n; b.textContent = n > 99 ? '99+' : n;
    if (NEV.ui.setSocialBadge) NEV.ui.setSocialBadge(n);
    document.title = (n ? '(' + n + ') ' : '') + 'neV.BOOSTER — Social';
  }
  const TITLES = { home: 'neV.BOOSTER <em>Social</em>', search: 'Recherche', messages: 'Messages', profile: 'Profil' };
  function tabs(t) {
    Array.prototype.forEach.call($('socTabs').querySelectorAll('a'), (a) => { a.classList.toggle('on', a.dataset.t === t); if (a.dataset.t === t) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const so = $('soc'), nn0 = $('socNotif'); if (nn0 && nn0.parentNode !== so) so.insertBefore(nn0, $('socBody'));
    so.dataset.v = t; so.classList.remove('chatopen'); document.body.classList.remove('pg-chat'); $('socT').innerHTML = TITLES[t] || TITLES.home;
    const mi = $('socMe'); if (me) mi.textContent = (me.handle || '?').slice(0, 1).toUpperCase();
  }
  document.body.classList.add('pg-social');
  $('socBurger').addEventListener('click', () => { const b = document.querySelector('.hdr .menuBtn'); if (b) b.click(); });
  const needAccount = (what) => '<div class="empty"><b>Un compte est nécessaire</b>' + esc(what) + '<div class="acts" style="justify-content:center;margin-top:14px"><a class="b" href="' + SIGN + '" data-go>Créer un compte</a><a class="b g" href="connexion.html" data-go>Se connecter</a></div></div>';

  /* ---------- notifications ---------- */
  const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const b64 = (s) => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); const o = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) o[i] = r.charCodeAt(i); return o; };
  async function pushState() {
    if (!pushSupported()) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    try { const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription(); if (sub && Notification.permission === 'granted') return 'on'; } catch (e) { /* ignoré */ }
    return 'off';
  }
  async function enablePush() {
    if (!pushSupported()) return toast('Ton navigateur ne gère pas les notifications. Sur iPhone, ajoute d\'abord le site à l\'écran d\'accueil.');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast('Notifications refusées dans le navigateur.'); return renderNotif(); }
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(pushKey) });
      const r = await api('push/subscribe', 'POST', { endpoint: sub.endpoint });
      toast(r.ok ? 'Notifications activées.' : (r.j.error || 'Activation impossible.'));
    } catch (e) { toast('Activation impossible sur cet appareil.'); }
    renderNotif();
  }
  async function disablePush() {
    try { const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription(); if (sub) { await api('push/unsubscribe', 'POST', { endpoint: sub.endpoint }); await sub.unsubscribe(); } } catch (e) { /* ignoré */ }
    toast('Notifications désactivées sur cet appareil.'); renderNotif();
  }
  const BELL = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 1112 0v5l2 2H4zM10 21a2 2 0 004 0"/></svg>';
  async function renderNotif() {
    const el = $('socNotif');
    if (guest) { el.innerHTML = BELL + '<b>Notifications et messages non lus<small>Crée un compte pour recevoir tes messages.</small></b><span class="tag">Avec un compte</span>'; $('socPill').textContent = 'Visiteur'; return; }
    const st = await pushState(), pill = $('socPill');
    pill.textContent = st === 'on' ? 'Notifications activées' : st === 'denied' ? 'Notifications bloquées' : st === 'unsupported' ? 'Social' : 'Notifications activables';
    const label = st === 'on' ? '<span class="tag ok">Activées</span><button type="button" class="b g" id="pushOff">Désactiver</button>'
      : st === 'denied' ? '<span class="tag">Bloquées dans le navigateur</span>' : st === 'unsupported' ? '<span class="tag">Non disponibles ici</span>'
      : '<button type="button" class="b" id="pushOn">Activer</button>';
    el.innerHTML = BELL + '<b>Notifications et messages non lus<small>' + (unread ? unread + ' message' + (unread > 1 ? 's' : '') + ' non lu' + (unread > 1 ? 's' : '') + '. ' : '') + 'Alertes même quand le site est fermé (selon ton navigateur).</small></b>' + label;
    if ($('pushOn')) $('pushOn').addEventListener('click', enablePush);
    if ($('pushOff')) $('pushOff').addEventListener('click', disablePush);
  }

  /* ---------- temps réel ---------- */
  function connect() {
    if (guest || stream || !window.EventSource) return;
    stream = new EventSource('api/social/stream');
    stream.addEventListener('hello', (e) => { const d = JSON.parse(e.data); unread = d.unread; requests = d.requests; setBadge(); });
    stream.addEventListener('unread', (e) => { unread = JSON.parse(e.data).n; setBadge(); if ($('m3')) refreshConvs(); });
    stream.addEventListener('friend', (e) => { const d = JSON.parse(e.data); if (d.state === 'incoming') { requests++; setBadge(); toast('@' + d.handle + ' veut rejoindre tes contacts.'); } if (cur.view === 'home') viewHome(); if ($('m3')) loadFriends().then(drawList); });
    stream.addEventListener('read', (e) => { const d = JSON.parse(e.data); if (cur.view === 'chat' && cur.handle.toLowerCase() === d.handle.toLowerCase()) Array.prototype.forEach.call(document.querySelectorAll('.m.me .tick'), (t) => { t.textContent = '✓✓'; t.classList.add('r'); }); });
    stream.addEventListener('sent', (e) => { const m = JSON.parse(e.data); if (cur.view === 'chat' && cur.handle.toLowerCase() === m.handle.toLowerCase() && !document.querySelector('[data-id="' + m.id + '"]')) addMsg(m); });
    stream.addEventListener('message', (e) => {
      const m = JSON.parse(e.data), here = cur.view === 'chat' && cur.handle.toLowerCase() === m.handle.toLowerCase();
      if (here) { addMsg(m); if (!document.hidden) api('read', 'POST', { handle: m.handle }); return; }
      if (document.hidden && Notification && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((reg) => api('notify-preview').then((r) => { if (r.ok) reg.showNotification(r.j.title, { body: r.j.body, tag: 'dm', renotify: true, icon: 'img/icon-192.png', data: { url: r.j.url } }); })).catch(() => {});
      } else toast('@' + m.handle + ' : ' + (m.text ? m.text.slice(0, 60) : '📷 Image'));
      if ($('m3')) refreshConvs();
    });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && cur.view === 'chat') api('read', 'POST', { handle: cur.handle }); });

  /* ---------- vues ---------- */
  /* ---------- aides d'affichage : niveau, XP, badges ---------- */
  const ZONE = { haut: 'Haut du corps', jambes: 'Jambes', abdos: 'Abdos', cardio: 'Cardio' };
  const stageOf = (xp, sex) => NEV.heroFromXp(xp || 0, sex);
  const lvlTxt = (xp, sex) => { const h = stageOf(xp, sex); return 'Niveau ' + h.stage.n + ' · ' + h.stage.name; };
  function xpbar(xp, sex) {
    const h = stageOf(xp, sex);
    return '<div class="sp-xp"><div class="sp-xp-t"><b>XP</b><span>' + (xp || 0) + (h.next ? ' / ' + h.next.xp : '') + '</span></div><div class="sp-bar"><i style="width:' + Math.round(h.pct * 100) + '%"></i></div></div>';
  }
  const BADGES = [
    ['Première séance', (p) => p.sessions >= 1], ['Série de 3 jours', (p) => p.streak >= 3], ['Série de 7 jours', (p) => p.streak >= 7],
    ['Niveau 3', (p) => p.xp >= 300], ['Niveau 5', (p) => p.xp >= 1400], ['Légende', (p) => p.xp >= 2600],
    ['Sociable', (p) => p.contacts >= 3], ['Membre de clan', (p) => !!p.clan]
  ];
  const MEDAL = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="5"/><path d="M8.5 13.5L7 21l5-3 5 3-1.5-7.5"/></svg>';
  const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 118 0v3"/></svg>';
  function badges(p, max) {
    const all = BADGES.map((b) => ({ n: b[0], on: !!b[1](p) })), list = max ? all.slice(0, max) : all;
    return '<ul class="sp-badges">' + list.map((b) => '<li class="' + (b.on ? 'on' : 'off') + '" title="' + esc(b.n) + (b.on ? '' : ' (à débloquer)') + '">' + (b.on ? MEDAL : LOCK) + '<span>' + esc(b.n) + '</span></li>').join('') + '</ul>';
  }
  const tile = (v, l) => '<div class="sp-tile"><b>' + esc(String(v)) + '</b><span>' + esc(l) + '</span></div>';
  const avo = (a, h, sex, on, size) => '<span class="avw">' + av(a, h, sex, size) + '<i class="od' + (on ? ' on' : '') + '" aria-hidden="true"></i></span>';
  const wide = () => window.matchMedia('(min-width:900px)').matches;
  const enc = encodeURIComponent;
  const MYTH = ['Pompes à un bras', 'Pompes en équilibre', 'Pseudo-planche', 'Tractions à un bras'];

  function row(p, extra) {
    return '<a class="row" href="#/u/' + enc(p.handle) + '">' + av(p.avatar, p.handle, p.sex) + '<div class="t"><b>@' + esc(p.handle) + '</b><span>' + esc(p.locked ? 'Profil réservé' : (p.bio || (p.sex === 'f' ? 'Parcours féminin' : p.sex === 'm' ? 'Parcours masculin' : ''))) + '</span></div>' + (extra || '') + '</a>';
  }
  const reqRow = (p) => '<li class="row">' + av(p.avatar, p.handle, p.sex) + '<div class="t"><b>@' + esc(p.handle) + '</b><span>veut t\'ajouter</span></div><div class="acts"><button type="button" class="b" data-fa="accept" data-h="' + esc(p.handle) + '">Accepter</button><button type="button" class="b g" data-fa="decline" data-h="' + esc(p.handle) + '">Refuser</button></div></li>';

  /* ---------- accueil ---------- */
  async function viewHome() {
    cur = { view: 'home', handle: '' }; tabs('home');
    if (guest) {
      body.innerHTML = '<div class="pn"><h2>Bienvenue</h2><p class="muted">Cherche un joueur par son @pseudo et découvre les profils publics. Pour envoyer et recevoir des messages, il faut un compte gratuit.</p>' +
        '<div class="acts" style="margin-top:14px"><a class="b" href="#/search">Rechercher un @pseudo</a><a class="b g" href="' + SIGN + '" data-go>Créer un compte</a></div></div>';
      return;
    }
    const [f, c] = await Promise.all([api('friends'), api('conversations')]);
    requests = (f.j.incoming || []).length; unread = c.j.unread || 0; setBadge(); renderNotif();
    const convs = (c.j.conversations || []).slice(0, 3), fl = f.j.friends || [], inc = f.j.incoming || [], out = f.j.outgoing || [];
    const lv = stageOf(me.xp, me.sex);
    let h = '<div class="hm"><form class="qs span2" id="qf" role="search"><label class="sbar"><input id="qh" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="20" placeholder="Trouver un joueur par @pseudo" aria-label="Trouver un joueur par @pseudo"></label><button class="b" type="submit">OK</button></form>' +
      '<div class="span2" id="notifMove"></div>';
    h += '<section class="pn"><div class="hd"><h3>Messages récents</h3><a href="#/messages">Tout voir</a></div>' + (convs.length ? '<ul class="rows">' + convs.map(convRow).join('') + '</ul>' : '<p class="muted" style="margin:0">Aucune conversation. <a href="#/search"><b>Cherche un joueur</b></a> pour écrire.</p>') + '</section>';
    h += '<section class="pn"><div class="hd"><h3>Mes contacts (' + fl.length + ')</h3></div>' + (fl.length ? '<div class="cts">' + fl.slice(0, 6).map((p) => '<a class="ct" href="#/messages/' + enc(p.handle) + '">' + avo(p.avatar, p.handle, p.sex, p.online, 'lg') + '<b>@' + esc(p.handle) + '</b><small>Niv. ' + stageOf(p.xp, p.sex).stage.n + '</small></a>').join('') + '</div>' : '<p class="muted" style="margin:0">Aucun contact pour le moment.</p>') + '</section>';
    if (inc.length) h += '<section class="pn"><div class="hd"><h3>Demandes d\'amis (' + inc.length + ')</h3></div><div class="rows">' + inc.map((p) => '<div class="rq">' + av(p.avatar, p.handle, p.sex, 'sm') + '<b>@' + esc(p.handle) + '</b><button type="button" class="b" data-fa="accept" data-h="' + esc(p.handle) + '">Accepter</button><button type="button" class="b out" style="padding:8px 14px" data-fa="decline" data-h="' + esc(p.handle) + '">Refuser</button></div>').join('') + '</div></section>';
    if (out.length) h += '<section class="pn"><div class="hd"><h3>Demandes envoyées</h3></div><ul class="rows">' + out.map((p) => '<li>' + row(p, '<span class="muted">en attente</span>') + '</li>').join('') + '</ul></section>';
    h += '<div class="span2 me-card">' + avo(me.avatar, me.handle, me.sex, true, 'lg') + '<div class="t"><b>@' + esc(me.handle) + '</b><small>Niveau ' + lv.stage.n + ' · ' + esc(lv.stage.name) + ' · ' + me.xp + ' XP</small><div class="sp-bar"><i style="width:' + Math.round(lv.pct * 100) + '%"></i></div></div><a class="b" href="#/profile">Profil</a></div>';
    h += '<div class="acts span2"><a class="b g" href="classement.html" data-go>Classement</a><a class="b g" href="clans.html" data-go>Clans</a><a class="b g" href="defis.html" data-go>Défis</a><a class="b g" href="chat.html" data-go>Chat</a><a class="b g" href="amis.html" data-go>Amis par code</a></div></div>';
    body.innerHTML = h;
    const nm = $('notifMove'), nn = $('socNotif'); if (nm && nn) { nm.appendChild(nn); }
    $('qf').addEventListener('submit', (e) => { e.preventDefault(); const v = $('qh').value.replace(/^@+/, '').trim(); try { sessionStorage.setItem('nev.social.q', v); } catch (e2) { /* ignoré */ } location.hash = '#/search'; });
  }
  function convRow(c) {
    return '<li><a class="row' + (cur.handle && cur.handle.toLowerCase() === c.handle.toLowerCase() ? ' act' : '') + '" href="#/messages/' + enc(c.handle) + '">' + avo(c.avatar, c.handle, c.sex, c.online) + '<div class="t"><b>@' + esc(c.handle) + '</b><span class="' + (c.unread ? 'unread' : '') + '">' + (c.fromMe ? 'Toi : ' : '') + esc(c.text) + '</span></div><div style="text-align:right;display:grid;gap:4px;justify-items:end"><time>' + ago(c.t) + '</time>' + (c.unread ? '<span class="dot">' + c.unread + '</span>' : '') + '</div></a></li>';
  }

  /* ---------- recherche ---------- */
  let st = 0;
  const RK = 'nev.social.recent';
  const recent = () => { try { const a = JSON.parse(localStorage.getItem(RK) || '[]'); return Array.isArray(a) ? a.filter((x) => typeof x === 'string').slice(0, 6) : []; } catch (e) { return []; } };
  const setRecent = (a) => { try { localStorage.setItem(RK, JSON.stringify(a.slice(0, 6))); } catch (e) { /* stockage indisponible */ } };
  function viewSearch() {
    cur = { view: 'search', handle: '' }; tabs('search');
    const f = { lvl: 0, zone: '' }; let res = null, term = '';
    const stages = NEV.HERO_STAGES.map((h) => [h.n, (NEV.sex === 'f' && h.nameF) ? h.nameF : h.name]);
    const pill = (k, v, l, on) => '<button type="button" class="pl' + (on ? ' on' : '') + '" data-' + k + '="' + v + '">' + esc(l) + '</button>';
    body.innerHTML = '<div class="se" id="se"><div class="se-main"><div class="se-top">' +
      '<form class="qs" id="sf" role="search"><label class="sbar"><span>@</span><input id="q" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="pseudo, par exemple neville" maxlength="20" aria-label="Pseudo à rechercher"></label><button class="b" type="submit"><span class="full">Rechercher</span><span class="ok">OK</span></button></form>' +
      '<div class="flt"><span>Niveau</span><div class="pls" id="fl">' + pill('lvl', 0, 'Tous', true) + stages.map((s) => pill('lvl', s[0], s[1], false)).join('') + '</div></div>' +
      '<div class="flt"><span>Zone</span><div class="pls" id="fz">' + pill('zone', '', 'Toutes', true) + Object.keys(ZONE).map((k) => pill('zone', k, ZONE[k], false)).join('') + '</div></div></div>' +
      '<h3 id="rh" style="margin-top:0"></h3><div id="res"><p class="muted">Tape au moins 2 caractères du @pseudo.</p></div></div>' +
      '<aside class="se-side"><section class="pn"><h3>Recherches récentes</h3><div id="rec"></div></section>' + (guest ? '' : '<section class="pn sg"><h3>Joueurs suggérés</h3><div id="sug"></div></section>') + '</aside></div>';
    const q = $('q'); q.focus();
    try { const pre = sessionStorage.getItem('nev.social.q'); if (pre) { sessionStorage.removeItem('nev.social.q'); q.value = pre; setTimeout(() => run(true), 0); } } catch (e) { /* ignoré */ }
    const drawRec = () => { const a = recent(); $('rec').innerHTML = a.length ? '<ul class="rows rs-list">' + a.map((x) => '<li class="row"><button type="button" class="lnk" data-rs="' + esc(x) + '">@' + esc(x) + '</button><button type="button" class="add" style="color:var(--muted)" data-rr="' + esc(x) + '">Retirer</button></li>').join('') + '</ul><div class="rs-chips">' + a.map((x) => '<button type="button" data-rs="' + esc(x) + '">@' + esc(x) + '</button>').join('') + '</div>' : '<p class="muted" style="margin:0">Aucune recherche pour le moment.</p>'; };
    drawRec();
    const card = (p) => {
      const lv = p.xp != null ? lvlTxt(p.xp, p.sex) : 'Profil réservé';
      const act = p.relation === 'friends' ? '<span class="tag ok">Contact</span>' : p.relation === 'self' ? '<span class="tag">Toi</span>' : p.relation === 'requested' ? '<span class="tag">Demande envoyée</span>' : guest ? '' : '<button type="button" class="b sm" data-fa="request" data-h="' + esc(p.handle) + '">Ajouter</button>';
      return '<li class="sp-card">' + avo(p.avatar, p.handle, p.sex, p.online, 'lg') + '<b>@' + esc(p.handle) + '</b><span class="lv">' + esc(lv) + '</span><span class="lv-m">' + esc(lv + (p.zone ? ' · ' + ZONE[p.zone] : '')) + '</span><span class="zn">' + (p.zone ? esc(ZONE[p.zone] || '') : '&nbsp;') + '</span><div class="acts">' + act + '<a class="b g sm" href="#/u/' + enc(p.handle) + '">Profil</a></div></li>';
    };
    const draw = () => {
      if (res === null) return;
      const L = res.filter((p) => (!f.lvl || (p.xp != null && stageOf(p.xp, p.sex).stage.n === f.lvl)) && (!f.zone || p.zone === f.zone));
      $('rh').textContent = L.length + ' résultat' + (L.length > 1 ? 's' : '') + ' pour « ' + term + ' »';
      $('res').innerHTML = L.length ? '<ul class="sp-grid">' + L.map(card).join('') + '</ul>' : '<div class="empty"><b>Aucun résultat</b>Vérifie l\'orthographe du @pseudo ou élargis les filtres.</div>';
    };
    const run = async (save) => {
      const v = q.value.replace(/^@+/, '').trim();
      if (v.length < 2) { res = null; $('rh').textContent = ''; $('res').innerHTML = '<p class="muted">Tape au moins 2 caractères du @pseudo.</p>'; return; }
      const r = await api('search?q=' + enc(v));
      if (!r.ok) { $('res').innerHTML = '<p class="err">' + esc(r.j.error || 'Recherche impossible.') + '</p>'; return; }
      res = r.j.results || []; term = v;
      if (save && res.length) { setRecent([v].concat(recent().filter((x) => x.toLowerCase() !== v.toLowerCase()))); drawRec(); }
      draw();
    };
    q.addEventListener('input', () => { clearTimeout(st); st = setTimeout(() => run(false), 250); });
    $('sf').addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(st); run(true); });
    $('se').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.lvl != null) { f.lvl = +b.dataset.lvl; Array.prototype.forEach.call($('fl').children, (x) => x.classList.toggle('on', x === b)); draw(); }
      else if (b.dataset.zone != null) { f.zone = b.dataset.zone; Array.prototype.forEach.call($('fz').children, (x) => x.classList.toggle('on', x === b)); draw(); }
      else if (b.dataset.rs) { q.value = b.dataset.rs; run(false); }
      else if (b.dataset.rr) { setRecent(recent().filter((x) => x !== b.dataset.rr)); drawRec(); }
    });
    if (!guest) api('suggest').then((r) => {
      const el = $('sug'); if (!el) return; const L = (r.ok && r.j.results) || [];
      el.innerHTML = L.length ? '<ul class="rows">' + L.map((p) => '<li class="row"><a class="lnk" href="#/u/' + enc(p.handle) + '">' + av(p.avatar, p.handle, p.sex, 'sm') + '<span style="display:grid;gap:1px"><b style="font-size:.88rem">@' + esc(p.handle) + '</b><small style="color:var(--muted);font-weight:600;font-size:.74rem">' + esc(lvlTxt(p.xp, p.sex)) + '</small></span></a>' + (p.relation === 'none' || p.relation === 'incoming' ? '<button type="button" class="add" data-fa="request" data-h="' + esc(p.handle) + '">Ajouter</button>' : '<span class="tag">En attente</span>') + '</li>').join('') + '</ul>' : '<p class="muted" style="margin:0">Pas de suggestion pour le moment.</p>';
    });
  }

  /* ---------- profil (le tien et celui des autres) ---------- */
  async function viewProfile(handle) {
    cur = { view: 'profile-of', handle: handle }; tabs('search');
    body.innerHTML = '<p class="muted">Chargement…</p>';
    const r = await api('profile?h=' + enc(handle));
    if (!r.ok) { body.innerHTML = '<button class="back" type="button" data-back>← Retour</button><div class="empty"><b>Profil introuvable</b>Ce @pseudo n\'existe pas ou n\'est plus visible.</div>'; return; }
    const p = r.j.profile, self = p.relation === 'self';
    if (self) { cur.view = 'me'; tabs('profile'); }
    let h = self ? '' : '<button class="back" type="button" data-back>← Retour</button>';
    const i = p.info || {};
    const hasPhoto = self && NEV.AvatarUpload && NEV.AvatarUpload.isPhoto(p.avatar);
    h += '<section class="sp-hero">' + (self && !guest ? '<span class="avedit" id="avedit">' + avo(p.avatar, p.handle, p.sex, p.online, 'xl') + '<button type="button" class="avcam" data-avcam="1" aria-label="' + (hasPhoto ? 'Changer ma photo de profil' : 'Ajouter une photo de profil') + '" title="' + (hasPhoto ? 'Changer la photo' : 'Ajouter une photo') + '"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/></svg></button></span>' : avo(p.avatar, p.handle, p.sex, p.online, 'xl')) + '<div class="sp-hero-t"><h2>@' + esc(p.handle) + '</h2>';
    if (p.locked) h += '<div class="lockbox">' + (p.vis === 'friends' ? 'Ce profil est réservé à ses contacts.' : 'Ce profil est privé.') + '</div>';
    else {
      h += '<div class="sp-lvl">' + esc(lvlTxt(p.xp, p.sex)) + '</div>' + xpbar(p.xp, p.sex);
      if (p.bio) h += '<p class="bio">' + esc(p.bio) + '</p>';
      h += '<div class="chips"><span class="chip">' + (p.sex === 'f' ? 'Parcours féminin' : 'Parcours masculin') + '</span>' + (p.clan ? '<a class="chip" href="clans.html" data-go>Clan ' + esc(p.clan) + '</a>' : '') + (i.zone ? '<span class="chip">' + esc(ZONE[i.zone] || '') + '</span>' : '') + (i.city ? '<span class="chip">' + esc(i.city) + '</span>' : '') + (i.fav ? '<span class="chip">Aime : ' + esc(i.fav) + '</span>' : '') + (i.goal ? '<span class="chip">Objectif : ' + esc(i.goal) + '</span>' : '') + '</div>';
    }
    h += '<div class="acts" id="pa" data-h="' + esc(p.handle) + '">';
    if (guest) h += '<a class="b" href="' + SIGN + '" data-go>Créer un compte pour écrire</a>';
    else if (self) h += '<a class="b" href="#/profile/edit">Modifier le profil</a><button type="button" class="b g" data-avcam="1">' + (hasPhoto ? 'Changer la photo' : 'Ajouter une photo') + '</button>' + (hasPhoto ? '<button type="button" class="b g" data-avdel="1">Supprimer ma photo</button>' : '') + '<button type="button" class="b g" data-share="1">Partager</button>';
    else if (p.blockedByMe) h += '<button class="b g" data-bl="0" type="button">Débloquer</button>';
    else {
      if (p.canMessage) h += '<a class="b" href="#/messages/' + enc(p.handle) + '">Message</a>';
      h += p.relation === 'friends' ? '<button class="b g" data-fa="remove" type="button">Retirer des contacts</button>' : p.relation === 'requested' ? '<button class="b g" data-fa="cancel" type="button">Demande envoyée · annuler</button>' : p.relation === 'incoming' ? '<button class="b" data-fa="accept" type="button">Accepter la demande</button>' : '<button class="b g" data-fa="request" type="button">Ajouter</button>';
      if (!p.canMessage) h += '<span class="muted" style="align-self:center">Messages non acceptés pour le moment</span>';
      h += '<button class="b d" data-bl="1" type="button">Bloquer</button><button class="b d" data-rp="1" type="button">Signaler</button>';
    }
    h += '</div></div></section>';
    if (!p.locked) {
      h += '<div class="sp-tiles">' + tile(p.streak || 0, 'Flammes') + tile(p.xp || 0, 'XP cumulés') + tile(stageOf(p.xp, p.sex).stage.n, 'Niveau') + tile(p.contacts || 0, 'Contacts') + '</div>';
      h += '<div class="sp-cols"><div><h3>Badges</h3>' + badges(p) + '</div><div><h3>Repères</h3><ul class="sp-act"><li><b>' + (p.streak || 0) + '</b> jour' + (p.streak > 1 ? 's' : '') + ' de série en cours</li><li><b>' + (p.sessions || 0) + '</b> séance' + (p.sessions > 1 ? 's' : '') + ' validée' + (p.sessions > 1 ? 's' : '') + '</li><li>Palier actuel : <b>' + esc(stageOf(p.xp, p.sex).stage.name) + '</b></li>' + (p.since ? '<li>Membre depuis ' + esc(new Date(p.since).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })) + '</li>' : '') + '</ul></div></div>';
      if (self) h += '<h3>Cartes mythiques</h3><div class="sp-myth">' + MYTH.map((n) => '<div class="sp-mc"><span>MR</span><b>' + esc(n) + '</b></div>').join('') + '<a class="b g" href="bibliotheque.html?tab=myth" data-go>Voir la collection</a></div><div id="myc"></div>';
    }
    body.innerHTML = h;
    if (self && !p.locked) api('friends').then((x) => {
      const L = (x.ok && x.j.friends) || []; const el = $('myc'); if (!el) return;
      el.innerHTML = '<h3>Contacts (' + L.length + ')</h3>' + (L.length ? '<ul class="rows">' + L.map((c) => '<li><a class="row" href="#/messages/' + enc(c.handle) + '">' + avo(c.avatar, c.handle, c.sex, c.online) + '<div class="t"><b>@' + esc(c.handle) + '</b><span>' + esc(lvlTxt(c.xp, c.sex)) + '</span></div><span class="b g sm">Écrire</span></a></li>').join('') + '</ul>' : '<p class="muted">Aucun contact pour le moment. <a href="#/search"><b>Trouve des joueurs</b></a>.</p>');
    });
  }

  /* ---------- messages : liste, conversation, fiche du contact ---------- */
  let mtab = 'recent', mq = '', fr = { friends: [], incoming: [], outgoing: [] };
  async function loadFriends() { const r = await api('friends'); if (r.ok) { fr = r.j; requests = (fr.incoming || []).length; setBadge(); } }
  async function refreshConvs() { const r = await api('conversations'); if (r.ok) { convCache = r.j.conversations || []; unread = r.j.unread || 0; setBadge(); } drawList(); }
  function drawList() {
    const el = $('clist'); if (!el) return;
    const q = mq.replace(/^@+/, '').toLowerCase(), has = (h) => !q || h.toLowerCase().indexOf(q) >= 0;
    Array.prototype.forEach.call($('cp').children, (b) => b.classList.toggle('on', b.dataset.mt === mtab));
    $('cp').querySelector('[data-mt="requests"]').innerHTML = 'Demandes' + ((fr.incoming || []).length ? ' <i class="dot">' + fr.incoming.length + '</i>' : '');
    let h = '';
    if (mtab === 'recent') { const L = (convCache || []).filter((c) => has(c.handle)); h = L.length ? '<ul class="rows">' + L.map(convRow).join('') + '</ul>' : '<div class="empty"><b>Aucune conversation</b><a class="b" href="#/search">Rechercher un @pseudo</a></div>'; }
    else if (mtab === 'contacts') { const L = (fr.friends || []).filter((c) => has(c.handle)); h = L.length ? '<ul class="rows">' + L.map((c) => '<li><a class="row" href="#/messages/' + enc(c.handle) + '">' + avo(c.avatar, c.handle, c.sex, c.online) + '<div class="t"><b>@' + esc(c.handle) + '</b><span>' + esc(lvlTxt(c.xp, c.sex)) + '</span></div></a></li>').join('') + '</ul>' : '<div class="empty"><b>Aucun contact</b>Ajoute des joueurs depuis la recherche.</div>'; }
    else { h = ((fr.incoming || []).length ? '<ul class="rows">' + fr.incoming.map(reqRow).join('') + '</ul>' : '<div class="empty"><b>Aucune demande</b></div>') + ((fr.outgoing || []).length ? '<h3>Envoyées</h3><ul class="rows">' + fr.outgoing.map((p) => '<li class="row">' + av(p.avatar, p.handle, p.sex) + '<div class="t"><b>@' + esc(p.handle) + '</b><span>en attente</span></div></li>').join('') + '</ul>' : ''); }
    el.innerHTML = h;
    $('cav').innerHTML = (fr.friends || []).length ? (fr.friends || []).slice(0, 8).map((c) => '<a href="#/messages/' + enc(c.handle) + '" title="@' + esc(c.handle) + '" aria-label="Écrire à @' + esc(c.handle) + '">' + avo(c.avatar, c.handle, c.sex, c.online) + '</a>').join('') : '<span class="muted">Aucun contact</span>';
    $('cn').textContent = (fr.friends || []).length;
  }
  async function viewMessages(handle) {
    if (guest) { cur = { view: 'messages', handle: '' }; tabs('messages'); body.innerHTML = needAccount('Envoyer et recevoir des messages privés demande un compte.'); return; }
    cur = { view: handle ? 'chat' : 'messages', handle: handle || '' }; tabs('messages');
    if (!$('m3')) {
      body.innerHTML = '<div class="m3" id="m3"><aside class="m3-l"><form class="sbar sm" id="cs"><span>@</span><input id="cq" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Rechercher un @pseudo" aria-label="Filtrer les conversations"></form>' +
        '<div class="pls" id="cp"><button type="button" class="pl" data-mt="recent">Récents</button><button type="button" class="pl" data-mt="contacts">Contacts</button><button type="button" class="pl" data-mt="requests">Demandes</button></div>' +
        '<div id="clist"></div><h3>Mes contacts (<span id="cn">0</span>)</h3><div class="avrow" id="cav"></div></aside><section class="m3-c" id="cpane"></section><aside class="m3-r" id="rpane"></aside></div>';
      $('cq').addEventListener('input', (e) => { mq = e.target.value; drawList(); });
      $('cs').addEventListener('submit', (e) => e.preventDefault());
      $('cp').addEventListener('click', (e) => { const b = e.target.closest('[data-mt]'); if (b) { mtab = b.dataset.mt; drawList(); } });
      await loadFriends(); await refreshConvs();
    } else await refreshConvs();
    if (!handle && wide() && convCache.length) { location.replace('#/messages/' + enc(convCache[0].handle)); return; }
    $('m3').dataset.open = handle ? '1' : ''; $('soc').classList.toggle('chatopen', !!handle); document.body.classList.toggle('pg-chat', !!handle);
    if (handle) return loadChat(handle);
    $('cpane').innerHTML = '<div class="empty"><b>Choisis une conversation</b>Ou <a href="#/search"><b>cherche un joueur</b></a> pour écrire.</div>'; $('rpane').innerHTML = '';
  }
  let lastDay = '';
  function msgHtml(m) {
    const d = dayLabel(m.t), sep = d !== lastDay ? '<div class="day">' + esc(d) + '</div>' : ''; lastDay = d;
    return sep + '<div class="m' + (m.mine ? ' me' : '') + '" data-id="' + m.id + '">' + (m.img ? '<img src="' + String(m.img).replace(/"/g, '') + '" alt="Image envoyée">' : '') + (m.text ? esc(m.text) : '') + '<small>' + hm(m.t) + (m.mine ? '<span class="tick' + (m.read ? ' r' : '') + '" title="' + (m.read ? 'Lu' : 'Envoyé') + '">' + (m.read ? '✓✓' : '✓') + '</span>' : '') + '</small></div>';
  }
  function addMsg(m) { const box = $('msgs'); if (!box) return; box.insertAdjacentHTML('beforeend', msgHtml(m)); box.scrollTop = box.scrollHeight; }
  function panel(p, w) {
    if (!p) return '<div class="empty">Fiche indisponible.</div>';
    if (p.locked) return '<div class="rp-h">' + av(p.avatar, p.handle, p.sex, 'lg') + '<b>@' + esc(p.handle) + '</b><span class="muted">Profil réservé</span></div>';
    return '<div class="rp-h">' + avo(p.avatar, p.handle, p.sex, p.online, 'lg') + '<b>@' + esc(p.handle) + '</b><span class="sp-lvl">' + esc(lvlTxt(p.xp, p.sex)) + '</span></div>' + xpbar(p.xp, p.sex) +
      '<div class="sp-tiles s3">' + tile(p.streak || 0, 'Flammes') + tile(p.sessions || 0, 'Séances') + tile(p.contacts || 0, 'Contacts') + '</div><h3>Badges</h3>' + badges(p, 3).replace('sp-badges', 'sp-badges mini') +
      '<a class="b" href="#/u/' + enc(p.handle) + '" style="justify-content:center;width:100%;margin-top:18px;padding:14px">Voir le profil</a><div class="rp-act"><button type="button" data-bl="1" data-h="' + esc(p.handle) + '">Bloquer ce joueur</button></div>';
  }
  async function loadChat(handle) {
    const [r, pr] = await Promise.all([api('messages?h=' + enc(handle) + '&mark=1'), api('profile?h=' + enc(handle))]);
    const pane = $('cpane'); if (!pane) return;
    if (!r.ok) { pane.innerHTML = '<div class="empty"><b>Conversation introuvable</b><a class="b g" href="#/messages">Retour</a></div>'; $('rpane').innerHTML = ''; return; }
    const w = r.j.with; cur.handle = w.handle; lastDay = '';
    const pp = pr.ok ? pr.j.profile : null;
    $('rpane').innerHTML = panel(pp, w);
    pane.innerHTML = '<div class="chat"><div class="chat-h"><a class="back mob" href="#/messages" aria-label="Retour aux conversations" style="margin:0;text-decoration:none;font-size:1.4rem;padding:0 6px">‹</a><a href="#/u/' + enc(w.handle) + '">' + avo(w.avatar, w.handle, w.sex, pp && pp.online) + '</a><div class="t"><b>@' + esc(w.handle) + '</b><small class="' + (pp && pp.online ? '' : 'off') + '">' + (pp && pp.online ? 'En ligne' : 'Hors ligne') + '</small></div><div class="acts"><a class="b out" href="defis.html" data-go>Défier</a></div></div>' +
      '<div class="msgs" id="msgs" role="log" aria-label="Messages">' + (r.j.messages.length ? r.j.messages.map(msgHtml).join('') : '<div class="empty">Dis bonjour à @' + esc(w.handle) + ' 👋</div>') + '</div>' +
      (r.j.blocked ? '<div class="note">Tu as bloqué ce joueur. <button class="b g" data-bl="0" data-h="' + esc(w.handle) + '" type="button">Débloquer</button></div>' : r.j.canSend ?
        '<form class="comp" id="comp"><textarea id="txt" rows="1" maxlength="1000" placeholder="' + (wide() ? 'Écris un message à @' + esc(w.handle) : 'Écris un message') + '…" aria-label="Message"></textarea>' + (imagesOn ? '<label class="b g" style="cursor:pointer">📷<input type="file" id="imgIn" accept="image/jpeg,image/png,image/webp" hidden></label>' : '') + '<button class="b send" id="sendBtn" type="submit">Envoyer</button></form><p class="err" id="cerr"></p>' :
        '<div class="note">Ce joueur n\'accepte pas de messages de ta part pour le moment.</div>') + '</div>';
    const box = $('msgs'); box.scrollTop = box.scrollHeight;
    api('unread').then((x) => { if (x.ok) { unread = x.j.messages; requests = x.j.requests; setBadge(); } }); refreshConvs();
    const f = $('comp'); if (!f) return;
    const t = $('txt'); let img = null;
    t.addEventListener('input', () => { t.style.height = 'auto'; t.style.height = Math.min(120, t.scrollHeight) + 'px'; });
    t.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); f.requestSubmit(); } });
    if ($('imgIn')) $('imgIn').addEventListener('change', async (e) => { const file = e.target.files[0]; if (!file) return; img = await shrink(file, 900, 0.78); $('cerr').textContent = img ? '📷 Image prête à envoyer.' : 'Image non lisible.'; });
    f.addEventListener('submit', async (e) => {
      e.preventDefault(); const text = t.value.trim(); if (!text && !img) return;
      $('sendBtn').disabled = true; const x = await api('send', 'POST', { to: w.handle, text: text, img: img });
      $('sendBtn').disabled = false;
      if (!x.ok) { $('cerr').textContent = x.j.error || 'Envoi impossible.'; return; }
      $('cerr').textContent = ''; t.value = ''; t.style.height = 'auto'; img = null; t.focus();
      const empty = box.querySelector('.empty'); if (empty) empty.remove();
      if (!document.querySelector('[data-id="' + x.j.message.id + '"]')) addMsg(x.j.message);
      refreshConvs();
    });
    if (wide()) t.focus();
  }
  function shrink(file, max, q) {
    return new Promise((ok) => {
      const r = new FileReader(); r.onerror = () => ok(null);
      r.onload = () => { const im = new Image(); im.onerror = () => ok(null); im.onload = () => {
        const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', q));
      }; im.src = r.result; };
      r.readAsDataURL(file);
    });
  }
  async function viewMyProfile() {
    cur = { view: 'profile', handle: '' }; tabs('profile');
    if (guest) { body.innerHTML = needAccount('Créer ton profil, choisir ton @pseudo et régler ta confidentialité demande un compte.'); return; }
    const r = await api('me'); if (!r.ok) { body.innerHTML = '<p class="err">' + esc(r.j.error || 'Profil indisponible.') + '</p>'; return; }
    me = r.j.profile; unread = r.j.unread; imagesOn = r.j.images; pushKey = r.j.push.key; setBadge();
    const i = me.info || {}; let avatar = me.avatar;
    const sel = (v, o) => o.map((x) => '<option value="' + x[0] + '"' + (x[0] === v ? ' selected' : '') + '>' + x[1] + '</option>').join('');
    body.innerHTML = '<h2>Mon profil</h2><form class="fm" id="pf" novalidate>' +
      '<div><label>Photo ou avatar</label><div class="avs" id="avs"></div><span class="hint">Choisis un avatar ou envoie ta photo : elle est recadrée en carré et réduite automatiquement.</span></div>' +
      '<label>@pseudo (unique)<input type="text" id="fh" maxlength="20" autocomplete="off" autocapitalize="off" value="' + esc(me.handle) + '"><span class="hint">3 à 20 caractères : lettres, chiffres ou _. C\'est avec lui qu\'on te retrouve.</span></label>' +
      '<label>Biographie<textarea id="fb" rows="3" maxlength="160" placeholder="Quelques mots sur toi">' + esc(me.bio) + '</textarea><span class="hint" id="bc"></span></label>' +
      '<label>Parcours<select id="fs">' + sel(me.sex, [['m', 'Masculin'], ['f', 'Féminin']]) + '</select></label>' +
      '<div class="row2"><label>Ville ou pays<input type="text" id="fc" maxlength="40" value="' + esc(i.city || '') + '"></label><label>Exercice préféré<input type="text" id="ff" maxlength="40" value="' + esc(i.fav || '') + '"></label></div>' +
      '<label>Zone d\'entraînement<select id="fzn">' + sel(i.zone || '', [['', 'Non précisée'], ['haut', 'Haut du corps'], ['jambes', 'Jambes'], ['abdos', 'Abdos'], ['cardio', 'Cardio']]) + '</select></label>' +
      '<label>Objectif<input type="text" id="fg" maxlength="80" value="' + esc(i.goal || '') + '" placeholder="Ex. : 50 pompes d\'affilée"></label>' +
      '<h3>Confidentialité</h3>' +
      '<label>Qui peut voir mon profil<select id="fv">' + sel(me.vis, [['public', 'Tout le monde'], ['friends', 'Mes contacts seulement'], ['private', 'Personne (profil privé, introuvable)']]) + '</select></label>' +
      '<label>Qui peut m\'écrire<select id="fd">' + sel(me.dm, [['all', 'Tout le monde'], ['friends', 'Mes contacts seulement'], ['none', 'Personne']]) + '</select></label>' +
      '<div class="sw"><span>Aperçu du message dans les notifications<small>Sinon : « Nouveau message » seulement.</small></span><input type="checkbox" id="fp"' + (me.preview ? ' checked' : '') + '></div>' +
      '<div class="sw"><span>Accusés de lecture<small>Les autres voient quand tu as lu leur message.</small></span><input type="checkbox" id="fr"' + (me.receipts ? ' checked' : '') + '></div>' +
      '<p class="err" id="ferr"></p><div class="acts"><button type="submit" class="b" id="fsave">Enregistrer</button><a class="b g" href="#/profile">Voir mon profil</a></div></form>' +
      '<h3>Joueurs bloqués</h3>' + ((r.j.blocked || []).length ? '<ul class="rows">' + r.j.blocked.map((p) => '<li class="row">' + av(p.avatar, p.handle) + '<div class="t"><b>@' + esc(p.handle) + '</b></div><button type="button" class="b g" data-bl="0" data-h="' + esc(p.handle) + '">Débloquer</button></li>').join('') + '</ul>' : '<p class="muted">Personne n\'est bloqué.</p>');
    const drawAv = () => { $('avs').innerHTML = ['evo', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].map((a) => '<button type="button" data-a="' + a + '" class="' + (avatar === a ? 'on' : '') + '" aria-label="Avatar ' + a + '">' + av(a, me.handle, $('fs').value) + '</button>').join('') + (/^data:/.test(avatar) ? '<button type="button" class="on" data-a="' + 'photo' + '" aria-label="Ta photo">' + av(avatar, me.handle) + '</button>' : '') + '<label class="b g" style="cursor:pointer">Envoyer une photo<input type="file" id="fph" accept="image/jpeg,image/png,image/webp" hidden></label>'; };
    drawAv();
    $('fs').addEventListener('change', drawAv);
    $('avs').addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b && b.dataset.a !== 'photo') { avatar = b.dataset.a; drawAv(); } });
    $('avs').addEventListener('change', async (e) => { if (e.target.id !== 'fph' || !e.target.files[0]) return; const rs = await NEV.AvatarUpload.process(e.target.files[0]); if (rs.ok) { avatar = rs.data; $('ferr').textContent = ''; drawAv(); } else $('ferr').textContent = rs.error; });
    const bc = () => { $('bc').textContent = $('fb').value.length + ' / 160'; }; bc(); $('fb').addEventListener('input', bc);
    $('pf').addEventListener('submit', async (e) => {
      e.preventDefault(); $('fsave').disabled = true; $('ferr').textContent = '';
      const x = await api('me', 'PUT', { handle: $('fh').value, bio: $('fb').value, avatar: avatar, sex: $('fs').value, info: { city: $('fc').value, fav: $('ff').value, goal: $('fg').value, zone: $('fzn').value }, vis: $('fv').value, dm: $('fd').value, preview: $('fp').checked, receipts: $('fr').checked });
      $('fsave').disabled = false;
      if (!x.ok) { $('ferr').textContent = x.j.error || 'Enregistrement impossible.'; return; }
      if (NEV.setSex && $('fs').value !== NEV.sex) { try { const p = NEV.player.load(); p.sex = $('fs').value; NEV.player.save(p); NEV.setSex($('fs').value); } catch (e2) { /* ignoré */ } }
      toast('Profil enregistré.'); location.hash = '#/profile';
    });
  }

  /* ---------- actions (délégation) ---------- */
  body.addEventListener('click', async (e) => {
    const t = e.target.closest('button,a'); if (!t) return;
    if (t.hasAttribute('data-back')) { e.preventDefault(); history.length > 1 ? history.back() : (location.hash = '#/'); return; }
    const hh = t.closest('[data-h]'), h = t.dataset.h || (hh && hh.dataset.h) || cur.handle;
    if (t.dataset.fa) {
      t.disabled = true; const r = await api('friend', 'POST', { handle: h, action: t.dataset.fa });
      if (!r.ok) { toast(r.j.error || 'Action impossible.'); t.disabled = false; return; }
      toast(r.j.relation === 'friends' ? 'Vous êtes maintenant en contact.' : r.j.relation === 'requested' ? 'Demande envoyée.' : 'C\'est fait.');
      if (cur.view === 'home') viewHome(); else if ($('m3')) { await loadFriends(); drawList(); } else if (cur.view === 'search') { toast('Demande envoyée.'); } else viewProfile(cur.handle); return;
    }
    if (t.dataset.bl != null && t.dataset.bl !== '') {
      const on = t.dataset.bl === '1'; if (on && !confirm('Bloquer @' + h + ' ? Plus de messages, et il sera retiré de tes contacts.')) return;
      const r = await api('block', 'POST', { handle: h, on: on }); if (!r.ok) return toast(r.j.error || 'Action impossible.');
      toast(on ? '@' + h + ' est bloqué.' : '@' + h + ' est débloqué.');
      cur.view === 'chat' ? loadChat(cur.handle) : cur.view === 'profile' ? viewMyProfile() : viewProfile(h); return;
    }
    if (t.dataset.avcam || t.dataset.avdel) {
      const AU = NEV.AvatarUpload; if (!AU) return; t.disabled = true;
      let res;
      if (t.dataset.avdel) { if (!confirm('Supprimer ta photo de profil ?')) { t.disabled = false; return; } res = await AU.remove(); }
      else { const pk = await AU.pick(); if (pk.cancelled) { t.disabled = false; return; } if (!pk.ok) { t.disabled = false; toast(pk.error); return; } res = await AU.save(pk.data); }
      t.disabled = false;
      if (!res.ok) { toast(res.error || 'Enregistrement impossible.'); return; }
      toast(t.dataset.avdel ? 'Photo supprimée.' : 'Photo de profil mise à jour.'); viewProfile(cur.handle || (me && me.handle)); return;
    }
    if (t.dataset.share) {
      const url = location.origin + location.pathname.replace(/[^/]*$/, '') + 'social.html#/u/' + encodeURIComponent(cur.handle);
      try { if (navigator.share) { await navigator.share({ title: 'neV.BOOSTER', url: url }); return; } await navigator.clipboard.writeText(url); toast('Lien du profil copié.'); } catch (e2) { /* annulé */ }
      return;
    }
    if (t.dataset.rp) {
      const reason = prompt('Pourquoi signales-tu @' + h + ' ? (harcèlement, spam, contenu choquant…)'); if (!reason) return;
      const r = await api('report', 'POST', { handle: h, reason: reason }); toast(r.ok ? 'Merci, le signalement est transmis à l\'équipe.' : (r.j.error || 'Signalement impossible.'));
    }
  });

  /* ---------- routage ---------- */
  function route() {
    const p = (location.hash || '#/').replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    $('socBody').scrollTop = 0;
    if (p[0] === 'search') return viewSearch();
    if (p[0] === 'u' && p[1]) return viewProfile(p[1].replace(/^@/, ''));
    if (p[0] === 'messages') return viewMessages(p[1]);
    if (p[0] === 'profile') return p[1] === 'edit' || guest || !me ? viewMyProfile() : viewProfile(me.handle);
    return viewHome();
  }
  window.addEventListener('hashchange', route);
  if (!guest) {
    const r = await api('me');
    if (r.ok) { me = r.j.profile; unread = r.j.unread; imagesOn = r.j.images; pushKey = r.j.push.key; }
    const u = await api('unread'); if (u.ok) { unread = u.j.messages; requests = u.j.requests; }
    setBadge(); connect();
  }
  await renderNotif(); route();
})();
