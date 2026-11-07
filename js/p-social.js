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
  function tabs(t) { Array.prototype.forEach.call($('socTabs').querySelectorAll('a'), (a) => { a.classList.toggle('on', a.dataset.t === t); if (a.dataset.t === t) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); }
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
    stream.addEventListener('unread', (e) => { unread = JSON.parse(e.data).n; setBadge(); if (cur.view === 'messages' && !cur.handle) viewMessages(); });
    stream.addEventListener('friend', (e) => { const d = JSON.parse(e.data); if (d.state === 'incoming') { requests++; setBadge(); toast('@' + d.handle + ' veut rejoindre tes contacts.'); } if (cur.view === 'home') viewHome(); });
    stream.addEventListener('read', (e) => { const d = JSON.parse(e.data); if (cur.view === 'chat' && cur.handle.toLowerCase() === d.handle.toLowerCase()) Array.prototype.forEach.call(document.querySelectorAll('.m.me .tick'), (t) => { t.textContent = '✓✓'; t.classList.add('r'); }); });
    stream.addEventListener('sent', (e) => { const m = JSON.parse(e.data); if (cur.view === 'chat' && cur.handle.toLowerCase() === m.handle.toLowerCase() && !document.querySelector('[data-id="' + m.id + '"]')) addMsg(m); });
    stream.addEventListener('message', (e) => {
      const m = JSON.parse(e.data), here = cur.view === 'chat' && cur.handle.toLowerCase() === m.handle.toLowerCase();
      if (here) { addMsg(m); if (!document.hidden) api('read', 'POST', { handle: m.handle }); return; }
      if (document.hidden && Notification && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((reg) => api('notify-preview').then((r) => { if (r.ok) reg.showNotification(r.j.title, { body: r.j.body, tag: 'dm', renotify: true, icon: 'img/icon-192.png', data: { url: r.j.url } }); })).catch(() => {});
      } else toast('@' + m.handle + ' : ' + (m.text ? m.text.slice(0, 60) : '📷 Image'));
      if (cur.view === 'messages' && !cur.handle) viewMessages();
    });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && cur.view === 'chat') api('read', 'POST', { handle: cur.handle }); });

  /* ---------- vues ---------- */
  function row(p, extra) {
    return '<a class="row" href="#/u/' + encodeURIComponent(p.handle) + '">' + av(p.avatar, p.handle, p.sex) + '<div class="t"><b>@' + esc(p.handle) + '</b><span>' + esc(p.locked ? 'Profil réservé' : (p.bio || (p.sex === 'f' ? 'Parcours féminin' : p.sex === 'm' ? 'Parcours masculin' : ''))) + '</span></div>' + (extra || '') + '</a>';
  }
  async function viewHome() {
    cur = { view: 'home', handle: '' }; tabs('home');
    if (guest) {
      body.innerHTML = '<h2>Bienvenue</h2><p class="muted">Cherche un joueur par son @pseudo et découvre les profils publics. Pour envoyer et recevoir des messages, il faut un compte gratuit.</p>' +
        '<div class="acts" style="margin:14px 0"><a class="b" href="#/search">Rechercher un @pseudo</a><a class="b g" href="' + SIGN + '" data-go>Créer un compte</a></div>';
      return;
    }
    const [f, c] = await Promise.all([api('friends'), api('conversations')]);
    requests = (f.j.incoming || []).length; unread = c.j.unread || 0; setBadge(); renderNotif();
    let h = '<h2>Salut @' + esc(me.handle) + '</h2><p class="muted">Ton espace pour discuter avec les autres joueurs, même hors séance.</p>';
    if ((f.j.incoming || []).length) h += '<h3>Demandes de contact</h3><ul class="rows">' + f.j.incoming.map((p) => '<li class="row">' + av(p.avatar, p.handle) + '<div class="t"><b>@' + esc(p.handle) + '</b><span>veut t\'ajouter</span></div><div class="acts"><button type="button" class="b" data-fa="accept" data-h="' + esc(p.handle) + '">Accepter</button><button type="button" class="b g" data-fa="decline" data-h="' + esc(p.handle) + '">Refuser</button></div></li>').join('') + '</ul>';
    const convs = (c.j.conversations || []).slice(0, 3);
    h += '<h3>Messages récents</h3>' + (convs.length ? '<ul class="rows">' + convs.map(convRow).join('') + '</ul>' : '<div class="empty"><b>Aucune conversation</b>Cherche un joueur pour commencer.<div class="acts" style="justify-content:center;margin-top:12px"><a class="b" href="#/search">Rechercher</a></div></div>');
    if ((f.j.friends || []).length) h += '<h3>Mes contacts (' + f.j.friends.length + ')</h3><ul class="rows">' + f.j.friends.map((p) => '<li>' + row(p, '<span class="b g">Écrire</span>').replace('href="#/u/' + encodeURIComponent(p.handle) + '"', 'href="#/messages/' + encodeURIComponent(p.handle) + '"') + '</li>').join('') + '</ul>';
    if ((f.j.outgoing || []).length) h += '<h3>Demandes envoyées</h3><ul class="rows">' + f.j.outgoing.map((p) => '<li>' + row(p, '<span class="muted">en attente</span>') + '</li>').join('') + '</ul>';
    body.innerHTML = h;
  }
  function convRow(c) {
    return '<li><a class="row" href="#/messages/' + encodeURIComponent(c.handle) + '">' + av(c.avatar, c.handle) + '<div class="t"><b>@' + esc(c.handle) + '</b><span class="' + (c.unread ? 'unread' : '') + '">' + (c.fromMe ? 'Toi : ' : '') + esc(c.text) + '</span></div><div style="text-align:right;display:grid;gap:4px;justify-items:end"><time>' + ago(c.t) + '</time>' + (c.unread ? '<span class="dot">' + c.unread + '</span>' : '') + '</div></a></li>';
  }
  let st = 0;
  function viewSearch() {
    cur = { view: 'search', handle: '' }; tabs('search');
    body.innerHTML = '<h2>Rechercher un joueur</h2><div class="sbar"><span>@</span><input id="q" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="pseudo, par exemple neville" maxlength="20" aria-label="Pseudo à rechercher"></div><div id="res" style="margin-top:14px"><p class="muted">Tape au moins 2 caractères du @pseudo.</p></div>';
    const q = $('q'); q.focus();
    q.addEventListener('input', () => { clearTimeout(st); st = setTimeout(async () => {
      const v = q.value.replace(/^@+/, '').trim(); if (v.length < 2) { $('res').innerHTML = '<p class="muted">Tape au moins 2 caractères du @pseudo.</p>'; return; }
      const r = await api('search?q=' + encodeURIComponent(v));
      if (!r.ok) { $('res').innerHTML = '<p class="err">' + esc(r.j.error || 'Recherche impossible.') + '</p>'; return; }
      const L = r.j.results || [];
      $('res').innerHTML = L.length ? '<ul class="rows">' + L.map((p) => '<li>' + row(p, p.relation === 'friends' ? '<span class="tag ok">Contact</span>' : p.relation === 'self' ? '<span class="tag">Toi</span>' : '') + '</li>').join('') + '</ul>' : '<div class="empty"><b>Aucun résultat</b>Vérifie l\'orthographe du @pseudo.</div>';
    }, 250); });
  }
  async function viewProfile(handle) {
    cur = { view: 'profile-of', handle: handle }; tabs('search');
    body.innerHTML = '<p class="muted">Chargement…</p>';
    const r = await api('profile?h=' + encodeURIComponent(handle));
    if (!r.ok) { body.innerHTML = '<button class="back" type="button" data-back>← Retour</button><div class="empty"><b>Profil introuvable</b>Ce @pseudo n\'existe pas ou n\'est plus visible.</div>'; return; }
    const p = r.j.profile; let h = '<button class="back" type="button" data-back>← Retour</button><div class="pf">' + av(p.avatar, p.handle, p.sex, 'xl') + '<div><h2>@' + esc(p.handle) + '</h2></div>';
    if (p.locked) h += '<div class="lockbox">' + (p.vis === 'friends' ? 'Ce profil est réservé à ses contacts.' : 'Ce profil est privé.') + '</div>';
    else {
      const hero = p.xp != null && NEV.heroFromXp ? NEV.heroFromXp(p.xp, p.sex) : null, i = p.info || {};
      if (p.bio) h += '<p>' + esc(p.bio) + '</p>';
      h += '<div class="chips"><span class="chip">' + (p.sex === 'f' ? 'Parcours féminin' : 'Parcours masculin') + '</span>' + (hero ? '<span class="chip">' + esc(hero.stage.name) + '</span>' : '') + (p.streak ? '<span class="chip">🔥 série de ' + p.streak + ' j</span>' : '') + (i.city ? '<span class="chip">' + esc(i.city) + '</span>' : '') + (i.fav ? '<span class="chip">Aime : ' + esc(i.fav) + '</span>' : '') + (p.since ? '<span class="chip">Membre depuis ' + new Date(p.since).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) + '</span>' : '') + '</div>' + (i.goal ? '<p class="muted">Objectif : ' + esc(i.goal) + '</p>' : '');
    }
    h += '<div class="acts" id="pa">';
    if (guest) h += '<a class="b" href="' + SIGN + '" data-go>Créer un compte pour écrire</a>';
    else if (p.relation === 'self') h += '<a class="b" href="#/profile">Modifier mon profil</a>';
    else {
      if (p.blockedByMe) h += '<button class="b g" data-bl="0" type="button">Débloquer</button>';
      else {
        if (p.canMessage) h += '<a class="b" href="#/messages/' + encodeURIComponent(p.handle) + '">Message</a>';
        h += p.relation === 'friends' ? '<button class="b g" data-fa="remove" type="button">Retirer des contacts</button>' : p.relation === 'requested' ? '<button class="b g" data-fa="cancel" type="button">Demande envoyée · annuler</button>' : p.relation === 'incoming' ? '<button class="b" data-fa="accept" type="button">Accepter la demande</button>' : '<button class="b g" data-fa="request" type="button">Ajouter</button>';
        if (!p.canMessage) h += '<span class="muted" style="align-self:center">Messages non acceptés pour le moment</span>';
        h += '<button class="b d" data-bl="1" type="button">Bloquer</button><button class="b d" data-rp="1" type="button">Signaler</button>';
      }
    }
    body.innerHTML = h + '</div></div>';
    body.querySelector('#pa').dataset.h = p.handle;
  }
  async function viewMessages() {
    cur = { view: 'messages', handle: '' }; tabs('messages');
    if (guest) { body.innerHTML = needAccount('Envoyer et recevoir des messages privés demande un compte.'); return; }
    const r = await api('conversations'); convCache = r.j.conversations || []; unread = r.j.unread || 0; setBadge();
    body.innerHTML = '<h2>Messages</h2>' + (convCache.length ? '<ul class="rows">' + convCache.map(convRow).join('') + '</ul>' : '<div class="empty"><b>Aucune conversation</b>Trouve un joueur pour lui écrire.<div class="acts" style="justify-content:center;margin-top:12px"><a class="b" href="#/search">Rechercher un @pseudo</a></div></div>');
  }
  let lastDay = '';
  function msgHtml(m) {
    const d = dayLabel(m.t), sep = d !== lastDay ? '<div class="day">' + esc(d) + '</div>' : ''; lastDay = d;
    return sep + '<div class="m' + (m.mine ? ' me' : '') + '" data-id="' + m.id + '">' + (m.img ? '<img src="' + String(m.img).replace(/"/g, '') + '" alt="Image envoyée">' : '') + (m.text ? esc(m.text) : '') + '<small>' + hm(m.t) + (m.mine ? '<span class="tick' + (m.read ? ' r' : '') + '" title="' + (m.read ? 'Lu' : 'Envoyé') + '">' + (m.read ? '✓✓' : '✓') + '</span>' : '') + '</small></div>';
  }
  function addMsg(m) { const box = $('msgs'); if (!box) return; box.insertAdjacentHTML('beforeend', msgHtml(m)); box.scrollTop = box.scrollHeight; }
  async function viewChat(handle) {
    if (guest) return viewMessages();
    cur = { view: 'chat', handle: handle }; tabs('messages');
    const r = await api('messages?h=' + encodeURIComponent(handle) + '&mark=1');
    if (!r.ok) { body.innerHTML = '<button class="back" type="button" data-back>← Retour</button><div class="empty"><b>Conversation introuvable</b></div>'; return; }
    const w = r.j.with; cur.handle = w.handle; lastDay = '';
    body.innerHTML = '<div class="chat"><div class="chat-h"><button class="back" type="button" data-back aria-label="Retour" style="margin:0">←</button><a href="#/u/' + encodeURIComponent(w.handle) + '">' + av(w.avatar, w.handle, w.sex) + '</a><div class="t"><b>@' + esc(w.handle) + '</b><small>Messagerie privée</small></div><div class="acts"><button class="b d" data-bl="1" type="button" data-h="' + esc(w.handle) + '">Bloquer</button><button class="b d" data-rp="1" type="button" data-h="' + esc(w.handle) + '">Signaler</button></div></div>' +
      '<div class="msgs" id="msgs" role="log" aria-label="Messages">' + (r.j.messages.length ? r.j.messages.map(msgHtml).join('') : '<div class="empty">Dis bonjour à @' + esc(w.handle) + ' 👋</div>') + '</div>' +
      (r.j.blocked ? '<div class="note">Tu as bloqué ce joueur. <button class="b g" data-bl="0" data-h="' + esc(w.handle) + '" type="button">Débloquer</button></div>' : r.j.canSend ?
        '<form class="comp" id="comp"><textarea id="txt" rows="1" maxlength="1000" placeholder="Écris un message…" aria-label="Message"></textarea>' + (imagesOn ? '<label class="b g" style="cursor:pointer">📷<input type="file" id="imgIn" accept="image/jpeg,image/png,image/webp" hidden></label>' : '') + '<button class="send" id="sendBtn" type="submit" aria-label="Envoyer"><svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-3-7z"/></svg></button></form><p class="err" id="cerr"></p>' :
        '<div class="note">Ce joueur n\'accepte pas de messages de ta part pour le moment.</div>') + '</div>';
    const box = $('msgs'); box.scrollTop = box.scrollHeight;
    unread = Math.max(0, unread); api('unread').then((x) => { if (x.ok) { unread = x.j.messages; requests = x.j.requests; setBadge(); } });
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
    });
    t.focus();
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
      '<div><label>Photo ou avatar</label><div class="avs" id="avs"></div><span class="hint">Choisis un avatar ou envoie une photo (elle est réduite automatiquement).</span></div>' +
      '<label>@pseudo (unique)<input type="text" id="fh" maxlength="20" autocomplete="off" autocapitalize="off" value="' + esc(me.handle) + '"><span class="hint">3 à 20 caractères : lettres, chiffres ou _. C\'est avec lui qu\'on te retrouve.</span></label>' +
      '<label>Biographie<textarea id="fb" rows="3" maxlength="160" placeholder="Quelques mots sur toi">' + esc(me.bio) + '</textarea><span class="hint" id="bc"></span></label>' +
      '<label>Parcours<select id="fs">' + sel(me.sex, [['m', 'Masculin'], ['f', 'Féminin']]) + '</select></label>' +
      '<div class="row2"><label>Ville ou pays<input type="text" id="fc" maxlength="40" value="' + esc(i.city || '') + '"></label><label>Exercice préféré<input type="text" id="ff" maxlength="40" value="' + esc(i.fav || '') + '"></label></div>' +
      '<label>Objectif<input type="text" id="fg" maxlength="80" value="' + esc(i.goal || '') + '" placeholder="Ex. : 50 pompes d\'affilée"></label>' +
      '<h3>Confidentialité</h3>' +
      '<label>Qui peut voir mon profil<select id="fv">' + sel(me.vis, [['public', 'Tout le monde'], ['friends', 'Mes contacts seulement'], ['private', 'Personne (profil privé, introuvable)']]) + '</select></label>' +
      '<label>Qui peut m\'écrire<select id="fd">' + sel(me.dm, [['all', 'Tout le monde'], ['friends', 'Mes contacts seulement'], ['none', 'Personne']]) + '</select></label>' +
      '<div class="sw"><span>Aperçu du message dans les notifications<small>Sinon : « Nouveau message » seulement.</small></span><input type="checkbox" id="fp"' + (me.preview ? ' checked' : '') + '></div>' +
      '<div class="sw"><span>Accusés de lecture<small>Les autres voient quand tu as lu leur message.</small></span><input type="checkbox" id="fr"' + (me.receipts ? ' checked' : '') + '></div>' +
      '<p class="err" id="ferr"></p><div class="acts"><button type="submit" class="b" id="fsave">Enregistrer</button><a class="b g" href="#/u/' + encodeURIComponent(me.handle) + '">Voir mon profil</a></div></form>' +
      '<h3>Joueurs bloqués</h3>' + ((r.j.blocked || []).length ? '<ul class="rows">' + r.j.blocked.map((p) => '<li class="row">' + av(p.avatar, p.handle) + '<div class="t"><b>@' + esc(p.handle) + '</b></div><button type="button" class="b g" data-bl="0" data-h="' + esc(p.handle) + '">Débloquer</button></li>').join('') + '</ul>' : '<p class="muted">Personne n\'est bloqué.</p>');
    const drawAv = () => { $('avs').innerHTML = ['evo', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].map((a) => '<button type="button" data-a="' + a + '" class="' + (avatar === a ? 'on' : '') + '" aria-label="Avatar ' + a + '">' + av(a, me.handle, $('fs').value) + '</button>').join('') + (/^data:/.test(avatar) ? '<button type="button" class="on" data-a="' + 'photo' + '" aria-label="Ta photo">' + av(avatar, me.handle) + '</button>' : '') + '<label class="b g" style="cursor:pointer">Envoyer une photo<input type="file" id="fph" accept="image/jpeg,image/png,image/webp" hidden></label>'; };
    drawAv();
    $('fs').addEventListener('change', drawAv);
    $('avs').addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b && b.dataset.a !== 'photo') { avatar = b.dataset.a; drawAv(); } });
    $('avs').addEventListener('change', async (e) => { if (e.target.id !== 'fph' || !e.target.files[0]) return; const d = await shrink(e.target.files[0], 200, 0.8); if (d && d.length <= 59000) { avatar = d; drawAv(); } else $('ferr').textContent = 'Photo trop lourde ou illisible.'; });
    const bc = () => { $('bc').textContent = $('fb').value.length + ' / 160'; }; bc(); $('fb').addEventListener('input', bc);
    $('pf').addEventListener('submit', async (e) => {
      e.preventDefault(); $('fsave').disabled = true; $('ferr').textContent = '';
      const x = await api('me', 'PUT', { handle: $('fh').value, bio: $('fb').value, avatar: avatar, sex: $('fs').value, info: { city: $('fc').value, fav: $('ff').value, goal: $('fg').value }, vis: $('fv').value, dm: $('fd').value, preview: $('fp').checked, receipts: $('fr').checked });
      $('fsave').disabled = false;
      if (!x.ok) { $('ferr').textContent = x.j.error || 'Enregistrement impossible.'; return; }
      if (NEV.setSex && $('fs').value !== NEV.sex) { try { const p = NEV.player.load(); p.sex = $('fs').value; NEV.player.save(p); NEV.setSex($('fs').value); } catch (e2) { /* ignoré */ } }
      toast('Profil enregistré.'); viewMyProfile();
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
      cur.view === 'home' ? viewHome() : viewProfile(cur.handle); return;
    }
    if (t.dataset.bl != null && t.dataset.bl !== '') {
      const on = t.dataset.bl === '1'; if (on && !confirm('Bloquer @' + h + ' ? Plus de messages, et il sera retiré de tes contacts.')) return;
      const r = await api('block', 'POST', { handle: h, on: on }); if (!r.ok) return toast(r.j.error || 'Action impossible.');
      toast(on ? '@' + h + ' est bloqué.' : '@' + h + ' est débloqué.');
      cur.view === 'chat' ? viewChat(cur.handle) : cur.view === 'profile' ? viewMyProfile() : viewProfile(h); return;
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
    if (p[0] === 'messages') return p[1] ? viewChat(p[1]) : viewMessages();
    if (p[0] === 'profile') return viewMyProfile();
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
