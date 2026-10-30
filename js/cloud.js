/* ==========================================================
   neV.BOOSTER — cloud.js
   Le « branchement » du site. Deux modes, détectés tout seuls :
   - serveur : le site est servi par server/server.js (/api/health répond).
               Comptes, progression, chat, combos et badges sont alors
               partagés entre tous les joueurs, mots de passe hachés
               côté serveur (scrypt), session en cookie HttpOnly.
   - local   : site ouvert depuis un dossier ou un hébergement statique.
               Tout est enregistré dans ce navigateur (mode démo) : les
               joueurs d'un même appareil se voient, rien ne sort.
   Les pages utilisent NEV.ready(fn) puis NEV.cloud.* sans se soucier du mode.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const doc = g.document, store = NEV.store, util = NEV.util, rng = NEV.rng;
  const me = doc.currentScript;
  const ROOT = (function () { try { return new URL('..', me.src).href; } catch (e) { return ''; } })();
  const C = (NEV.cloud = { mode: 'local', info: null, root: ROOT });
  const pageName = (g.location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';

  /* ---------- appel d'API ---------- */
  async function api(path, method, body) {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const to = ctl ? setTimeout(function () { ctl.abort(); }, 9000) : 0;
    try {
      const r = await fetch(ROOT + 'api/' + path, {
        method: method || 'GET', credentials: 'same-origin', cache: 'no-store', signal: ctl ? ctl.signal : undefined,
        headers: Object.assign({ 'X-NEV': '1' }, body ? { 'Content-Type': 'application/json' } : {}),
        body: body ? JSON.stringify(body) : undefined
      });
      let data = null; try { data = await r.json(); } catch (e) { /* corps vide */ }
      return { ok: r.ok, status: r.status, data: data || {} };
    } catch (e) {
      return { ok: false, status: 0, data: { error: 'Le serveur ne répond pas. Vérifie ta connexion.' } };
    } finally { clearTimeout(to); }
  }
  C.api = api;

  /* ---------- détection du mode ---------- */
  C.ready = (async function () {
    if (g.location.protocol === 'file:') return 'local';
    try {
      const r = await Promise.race([api('health'), new Promise(function (res) { setTimeout(function () { res({ ok: false }); }, 2500); })]);
      if (r.ok && r.data && r.data.app === 'neV.BOOSTER') { C.mode = 'server'; C.info = r.data; }
    } catch (e) { /* mode local */ }
    return C.mode;
  })();
  NEV.ready = function (fn) { return C.ready.then(fn); };

  /* ---------- suivi (pages vues, erreurs) ---------- */
  NEV.track = function (type, data) {
    try {
      const u = NEV.auth && NEV.auth.current ? NEV.auth.current() : null;
      if (C.mode === 'server') { api('event', 'POST', { type: type, page: pageName, data: data || {} }); return; }
      const ev = store.get('nev.events', []);
      ev.push({ t: Date.now(), type: type, page: pageName, uid: u ? u.id : null, name: u ? u.pseudo : null, data: data || {} });
      store.set('nev.events', ev.slice(-600));
    } catch (e) { /* le suivi ne doit jamais casser le site */ }
  };
  let errCount = 0;
  g.addEventListener('error', function (e) { if (errCount++ < 5) NEV.track('error', { msg: String(e.message || '').slice(0, 160), src: String(e.filename || '').split('/').pop(), line: e.lineno }); });
  g.addEventListener('unhandledrejection', function (e) { if (errCount++ < 5) NEV.track('error', { msg: String((e.reason && e.reason.message) || e.reason || '').slice(0, 160) }); });
  C.ready.then(function () { NEV.track('view', {}); });

  /* ====================================================================
     MODE SERVEUR : comptes et joueur
     ==================================================================== */
  const USERS = 'nev.users', SESSION = 'nev.session';
  function cacheServerUser(u, player) {
    const users = store.get(USERS, {});
    users[u.email] = Object.assign({ salt: '', hash: '', srv: true }, u);
    store.set(USERS, users);
    store.set(SESSION, { uid: u.id, email: u.email, at: Date.now(), srv: true });
    if (player) store.set(NEV.player.key(u.id), player);
  }
  C.serverSignup = async function (f) {
    const r = await api('signup', 'POST', { pseudo: f.pseudo, email: f.email, password: f.password, consent: !!f.consent, terms: !!f.terms, ref: f.ref || '', sex: f.sex, lang: (NEV.i18n && NEV.i18n.lang()) || 'fr' });
    if (!r.ok) return { ok: false, field: r.data.field, error: r.data.error || 'Inscription impossible pour le moment.' };
    cacheServerUser(r.data.user, r.data.player);
    return { ok: true, user: NEV.auth.current() };
  };
  C.serverLogin = async function (email, pw) {
    const r = await api('login', 'POST', { email: email, password: pw });
    if (!r.ok) return { ok: false, field: r.data.field || 'password', error: r.data.error || 'Connexion impossible.' };
    cacheServerUser(r.data.user, r.data.player);
    return { ok: true, user: NEV.auth.current() };
  };
  C.serverLogout = function () { api('logout', 'POST', {}); };

  // Au chargement d'une page : on vérifie la session et on récupère la progression du serveur.
  C.sync = async function () {
    if (C.mode !== 'server') return NEV.auth.current();
    const s = store.get(SESSION, null);
    if (!s) return null;
    const r = await api('me');
    if (r.status === 401) { store.del(SESSION); return null; }
    if (r.ok && r.data.user) {
      const local = store.get(NEV.player.key(r.data.user.id), null);
      const srv = r.data.player;
      cacheServerUser(r.data.user, (!local || !srv || (srv.updated || 0) >= (local.updated || 0)) ? srv : local);
      if (local && srv && (local.updated || 0) > (srv.updated || 0)) C.pushPlayer(local, true);
    }
    return NEV.auth.current();
  };

  let pushT = 0, lastP = null;
  C.pushPlayer = function (p, now) {
    lastP = p;
    clearTimeout(pushT);
    const go = function () { if (lastP) api('player', 'PUT', { player: lastP }); lastP = null; };
    if (now) go(); else pushT = setTimeout(go, 1200);
  };
  g.addEventListener('pagehide', function () { if (lastP && C.mode === 'server') { try { fetch(ROOT + 'api/player', { method: 'PUT', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-NEV': '1' }, body: JSON.stringify({ player: lastP }) }); } catch (e) { /* ignoré */ } } });

  /* ====================================================================
     CONFIG PUBLIQUE : combos du coach, badges personnalisés, annonce
     ==================================================================== */
  C.config = async function () {
    if (C.mode === 'server') {
      const r = await api('config');
      return r.ok ? r.data : { combos: [], badges: [], announce: null };
    }
    return { combos: store.get('nev.combos', []).filter(function (c) { return c.published; }), badges: store.get('nev.badgedefs', []), announce: store.get('nev.announce', null) };
  };

  /* ====================================================================
     CHAT
     ==================================================================== */
  const cleanText = function (t) { return String(t || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280); };
  let lastSend = 0;
  C.chat = {
    // room : 'global' (tous les joueurs) ou 'coach' (ta conversation privée avec l'admin)
    async list(room) {
      if (C.mode === 'server') { const r = await api('chat?room=' + encodeURIComponent(room)); C.chat.gate = r.ok ? r.data.gate || null : null; return r.ok ? r.data.messages || [] : []; }
      C.chat.gate = null;
      const u = NEV.auth.current(); if (!u) return [];
      const key = room === 'coach' ? 'coach:' + u.id : 'global';
      return store.get('nev.chat', []).filter(function (m) { return m.room === key; }).slice(-120);
    },
    async send(room, text) {
      text = cleanText(text);
      if (!text) return { ok: false, error: 'Écris un message.' };
      if (Date.now() - lastSend < 1200) return { ok: false, error: 'Doucement : un message à la fois.' };
      if (NEV.Policy) { const mod = NEV.Policy.moderate(text); if (!mod.ok) return { ok: false, error: mod.error }; text = mod.text; }
      lastSend = Date.now();
      if (C.mode === 'server') { const r = await api('chat', 'POST', { room: room, text: text }); return r.ok ? { ok: true } : { ok: false, error: r.data.error || 'Message non envoyé.' }; }
      const u = NEV.auth.current(); if (!u) return { ok: false, error: 'Connecte-toi.' };
      const all = store.get('nev.chat', []);
      all.push({ id: rng.id(), room: room === 'coach' ? 'coach:' + u.id : 'global', uid: u.id, name: u.pseudo, text: text, t: Date.now(), role: 'player' });
      store.set('nev.chat', all.slice(-400));
      return { ok: true };
    },
    // signaler un message du salon (serveur : 3 signalements différents le masquent et préviennent l'admin)
    async report(id, reason) {
      if (C.mode !== 'server') return { ok: true, local: true };
      const r = await api('chat/report', 'POST', { id: id, reason: reason || '' });
      return r.ok ? { ok: true } : { ok: false, error: r.data.error || 'Signalement impossible.' };
    }
  };

  /* ====================================================================
     ADMIN
     ==================================================================== */
  const A = (C.admin = {});
  const LA = 'nev.admin', LAS = 'nev.adminok';

  async function hashAdmin(pw, salt) {
    const enc = new TextEncoder();
    const key = await g.crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
    const bits = await g.crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
    return Array.prototype.map.call(new Uint8Array(bits), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  A.state = async function () { // { hasPassword, authed }
    if (C.mode === 'server') { const r = await api('admin/state'); return r.ok ? r.data : { hasPassword: true, authed: false }; }
    let ok = false; try { ok = g.sessionStorage.getItem(LAS) === '1'; } catch (e) { /* ignoré */ }
    return { hasPassword: !!store.get(LA, null), authed: ok };
  };
  A.login = async function (pw) {
    if (C.mode === 'server') { const r = await api('admin/login', 'POST', { password: pw }); return r.ok ? { ok: true } : { ok: false, error: r.data.error || 'Mot de passe refusé.' }; }
    const rec = store.get(LA, null);
    if (!rec) {
      if (String(pw).length < 10) return { ok: false, error: 'Choisis un mot de passe admin d\'au moins 10 caractères.' };
      const salt = rng.id() + rng.id();
      store.set(LA, { salt: salt, hash: await hashAdmin(pw, salt) });
    } else if ((await hashAdmin(pw, rec.salt)) !== rec.hash) {
      return { ok: false, error: 'Mot de passe refusé.' };
    }
    try { g.sessionStorage.setItem(LAS, '1'); } catch (e) { /* ignoré */ }
    return { ok: true };
  };
  A.logout = async function () {
    if (C.mode === 'server') await api('admin/logout', 'POST', {});
    try { g.sessionStorage.removeItem(LAS); } catch (e) { /* ignoré */ }
  };

  function localUsers() {
    const users = store.get(USERS, {});
    return Object.keys(users).map(function (k) {
      const u = users[k], p = NEV.player.load(u.id) || {};
      const prog = p.progress || {};
      return {
        id: u.id, email: u.email, pseudo: u.pseudo, created: u.created, banned: !!u.banned, code: u.code, refCount: u.refCount || 0, admin: !!u.isAdmin, bonusDraws: p.bonusDraws || 0,
        level: p.level, maxPushups: p.maxPushups, streak: prog.streak || 0, best: prog.best || 0, total: prog.total || 0, xp: prog.xp || 0,
        lastDone: prog.lastDone || null, flames: p.flames || 0, loginStreak: (p.login || {}).streak || 0, badges: Object.keys(p.badges || {}),
        lastSeen: (p.login || {}).last || null, history: (p.history || []).slice(0, 60), loginDays: (p.login || {}).days || []
      };
    });
  }

  function statsFrom(users, events, today) {
    const days = []; for (let i = 6; i >= 0; i--) days.push(util.addDays(today, -i));
    const sess = days.map(function () { return 0; }), act = days.map(function () { return new Set(); });
    const rar = [0, 0, 0, 0, 0], ex = {}; let verified = 0, total = 0, doubled = 0, nonQ = 0;
    users.forEach(function (u) {
      (u.history || []).forEach(function (h) {
        const i = days.indexOf(h.date);
        if (i >= 0) { sess[i]++; act[i].add(u.id); }
        if (h.tier >= 1 && h.tier <= 5) rar[h.tier - 1]++;
        ex[h.id] = (ex[h.id] || 0) + 1; total++; if (h.verified) verified++; if (h.doubled) doubled++; else nonQ++;
      });
      (u.loginDays || []).forEach(function (d) { const i = days.indexOf(d); if (i >= 0) act[i].add(u.id); });
    });
    const lv = [0, 0, 0, 0, 0]; users.forEach(function (u) { if (u.level >= 1 && u.level <= 5) lv[u.level - 1]++; });
    const day = 86400000, now = Date.now();
    return {
      players: users.length, newToday: users.filter(function (u) { return u.created === today; }).length,
      active: act.map(function (s) { return s.size; }), sessions: sess, days: days,
      avgStreak: users.length ? Math.round(10 * users.reduce(function (a, u) { return a + u.streak; }, 0) / users.length) / 10 : 0,
      bestStreak: users.reduce(function (a, u) { return Math.max(a, u.best); }, 0),
      levels: lv, rarity: rar, topExercises: Object.keys(ex).map(function (k) { return { id: k, n: ex[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 8),
      verifiedPct: total ? Math.round(100 * verified / total) : 0, sessionsTotal: total, doubled: doubled,
      flames: users.reduce(function (a, u) { return a + u.flames; }, 0), referrals: users.reduce(function (a, u) { return a + u.refCount; }, 0),
      errors24h: events.filter(function (e) { return e.type === 'error' && now - e.t < day; }).length,
      views24h: events.filter(function (e) { return e.type === 'view' && now - e.t < day; }).length,
      server: { mode: 'local', note: 'Mode démo : données de ce navigateur uniquement.' }
    };
  }

  A.users = async function () {
    if (C.mode === 'server') { const r = await api('admin/users'); return r.ok ? r.data.users : []; }
    return localUsers();
  };
  A.stats = async function () {
    if (C.mode === 'server') { const r = await api('admin/stats'); return r.ok ? r.data : null; }
    return statsFrom(localUsers(), store.get('nev.events', []), util.todayStr());
  };
  A.events = async function (type) {
    if (C.mode === 'server') { const r = await api('admin/events' + (type ? '?type=' + encodeURIComponent(type) : '')); return r.ok ? r.data.events : []; }
    const ev = store.get('nev.events', []).slice().reverse();
    return (type ? ev.filter(function (e) { return e.type === type; }) : ev).slice(0, 150);
  };
  A.ban = async function (uid, flag) {
    if (C.mode === 'server') { const r = await api('admin/ban', 'POST', { uid: uid, banned: !!flag }); return r.ok; }
    const users = store.get(USERS, {}); Object.keys(users).forEach(function (k) { if (users[k].id === uid) users[k].banned = !!flag; });
    store.set(USERS, users); return true;
  };

  // combos du coach
  A.combos = {
    async list() { if (C.mode === 'server') { const r = await api('admin/combos'); return r.ok ? r.data.combos : []; } return store.get('nev.combos', []); },
    async save(c) {
      if (C.mode === 'server') { const r = await api('admin/combos', 'POST', c); return r.ok ? r.data.combo : null; }
      const all = store.get('nev.combos', []);
      c = Object.assign({}, c); if (!c.id) c.id = 'c' + rng.id(); c.updated = Date.now();
      const i = all.findIndex(function (x) { return x.id === c.id; });
      if (i >= 0) all[i] = c; else all.unshift(c);
      store.set('nev.combos', all); return c;
    },
    async remove(id) {
      if (C.mode === 'server') { const r = await api('admin/combos/' + encodeURIComponent(id), 'DELETE'); return r.ok; }
      store.set('nev.combos', store.get('nev.combos', []).filter(function (x) { return x.id !== id; })); return true;
    }
  };
  // badges personnalisés
  A.badges = {
    async list() { if (C.mode === 'server') { const r = await api('admin/badges'); return r.ok ? r.data.badges : []; } return store.get('nev.badgedefs', []); },
    async save(b) {
      if (C.mode === 'server') { const r = await api('admin/badges', 'POST', b); return r.ok ? r.data.badge : null; }
      const all = store.get('nev.badgedefs', []);
      b = Object.assign({}, b); if (!b.id) b.id = 'b' + rng.id();
      const i = all.findIndex(function (x) { return x.id === b.id; });
      if (i >= 0) all[i] = b; else all.push(b);
      store.set('nev.badgedefs', all); return b;
    },
    async remove(id) {
      if (C.mode === 'server') { const r = await api('admin/badges/' + encodeURIComponent(id), 'DELETE'); return r.ok; }
      store.set('nev.badgedefs', store.get('nev.badgedefs', []).filter(function (x) { return x.id !== id; })); return true;
    },
    async grant(uid, badgeId) {
      if (C.mode === 'server') { const r = await api('admin/grant', 'POST', { uid: uid, badge: badgeId }); return r.ok; }
      const p = NEV.player.load(uid); p.badges[badgeId] = util.todayStr(); NEV.player.save(p, uid); return true;
    }
  };
  /* Cadeau : flammes et/ou tirages de gacha bonus. Serveur : fiche du joueur mise à jour + notification à sa prochaine visite. */
  A.gift = async function (uid, flames, draws, note) {
    flames = Math.max(0, Math.floor(Number(flames) || 0)); draws = Math.max(0, Math.floor(Number(draws) || 0));
    if (!flames && !draws) return { ok: false, error: 'Indique des flammes ou des tirages.' };
    if (flames > 10000 || draws > 50) return { ok: false, error: 'Maximum : 10 000 flammes et 50 tirages à la fois.' };
    if (C.mode === 'server') { const r = await api('admin/gift', 'POST', { uid: uid, flames: flames, draws: draws, note: note || '' }); return r.ok ? { ok: true } : { ok: false, error: r.data.error || 'Refusé.' }; }
    const p = NEV.player.load(uid);
    p.flames = (p.flames || 0) + flames; p.flamesTotal = (p.flamesTotal || 0) + flames; p.bonusDraws = Math.min(500, (p.bonusDraws || 0) + draws);
    p.gifts = (p.gifts || []).slice(-29); p.gifts.push({ id: rng.id(), flames: flames, draws: draws, note: String(note || '').slice(0, 80), t: Date.now(), seen: false });
    NEV.player.save(p, uid); return { ok: true };
  };
  // Nommer ou retirer un admin (serveur : le joueur peut ouvrir l'espace admin une fois connecté à son compte).
  A.role = async function (uid, admin) {
    if (C.mode === 'server') { const r = await api('admin/role', 'POST', { uid: uid, admin: !!admin }); return r.ok ? { ok: true } : { ok: false, error: r.data.error || 'Refusé.' }; }
    const users = store.get(USERS, {}); Object.keys(users).forEach(function (k) { if (users[k].id === uid) users[k].isAdmin = !!admin; });
    store.set(USERS, users); return { ok: true };
  };
  A.announce = async function (text) {
    text = cleanText(text);
    if (C.mode === 'server') { const r = await api('admin/announce', 'POST', { text: text }); return r.ok; }
    store.set('nev.announce', text ? { text: text, t: Date.now() } : null); return true;
  };
  // chat côté admin
  A.chat = {
    async threads() {
      if (C.mode === 'server') { const r = await api('admin/chat/threads'); return r.ok ? r.data.threads : []; }
      const by = {};
      store.get('nev.chat', []).forEach(function (m) { if (m.room.indexOf('coach:') === 0) { const uid = m.room.slice(6); by[uid] = { uid: uid, name: m.role === 'player' ? m.name : (by[uid] || {}).name, last: m.text, t: m.t, fromPlayer: m.role === 'player' }; } });
      const users = store.get(USERS, {}); Object.keys(users).forEach(function (k) { if (by[users[k].id]) by[users[k].id].name = users[k].pseudo; });
      return Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.t - a.t; });
    },
    async open(room) { // room : 'global' ou 'coach:<uid>'
      if (C.mode === 'server') { const r = await api('admin/chat?room=' + encodeURIComponent(room)); return r.ok ? r.data.messages : []; }
      return store.get('nev.chat', []).filter(function (m) { return m.room === room; }).slice(-150);
    },
    async send(room, text) {
      text = cleanText(text); if (!text) return false;
      if (C.mode === 'server') { const r = await api('admin/chat', 'POST', { room: room, text: text }); return r.ok; }
      const all = store.get('nev.chat', []); all.push({ id: rng.id(), room: room, uid: 'admin', name: 'Coach neV', text: text, t: Date.now(), role: 'admin' }); store.set('nev.chat', all.slice(-400)); return true;
    },
    async remove(room, id) {
      if (C.mode === 'server') { const r = await api('admin/chat/' + encodeURIComponent(id) + '?room=' + encodeURIComponent(room), 'DELETE'); return r.ok; }
      store.set('nev.chat', store.get('nev.chat', []).filter(function (m) { return m.id !== id; })); return true;
    }
  };
  /* ====================================================================
     BASE DE DONNÉES (onglet « Base de données » de l'admin)
     • Mode serveur : vraie base SQLite partagée (nev.db), via /api/admin/db/*.
     • Mode démo : la « base » est celle de ce navigateur (tables reconstruites à partir
       du stockage local). Lecture et export seulement ; pas de console SQL.
     ==================================================================== */
  const DB_DESCR = {
    users: 'Comptes : e-mail, pseudo, âge, code de parrainage, parrain, suspension.',
    players: 'Progression de chaque joueur (niveau, XP, séries, flammes) + sauvegarde complète en JSON.',
    workouts: 'Journal de toutes les séances (une ligne par carte jouée).',
    logins: 'Jours de connexion de chaque joueur.',
    badge_grants: 'Badges obtenus par les joueurs.',
    badge_defs: 'Badges créés dans l\'admin.',
    combos: 'Combos d\'exercices composés par le coach.',
    chat_messages: 'Messages du salon public et des conversations privées avec le coach.',
    events: 'Journal de suivi : pages vues, erreurs, connexions, inscriptions.',
    meta: 'Réglages du site (annonce).'
  };
  const DB_COLS = {
    users: ['id', 'email', 'pseudo', 'code', 'ref_by', 'banned', 'created'],
    players: ['uid', 'level', 'max_pushups', 'xp', 'streak', 'best_streak', 'sessions_total', 'flames', 'flames_total', 'login_streak', 'last_done', 'last_seen', 'data'],
    workouts: ['uid', 'day', 'exercise_id', 'name', 'rarity', 'tier', 'reps', 'sets', 'verified', 'doubled', 'xp_gain', 'source'],
    logins: ['uid', 'day'],
    badge_grants: ['uid', 'badge_id', 'day'],
    badge_defs: ['id', 'name', 'descr', 'shape', 'icon', 'label', 'c1', 'c2', 'rule_type', 'rule_value'],
    combos: ['id', 'name', 'blurb', 'lvl', 'published', 'items'],
    chat_messages: ['id', 'room', 'uid', 'name', 'text', 't', 'role'],
    events: ['t', 'type', 'page', 'uid', 'name', 'data'],
    meta: ['key', 'value']
  };
  function localTables() {
    const T = {}; Object.keys(DB_COLS).forEach(function (k) { T[k] = []; });
    const users = store.get(USERS, {}), byId = {};
    Object.keys(users).forEach(function (k) { const u = users[k]; byId[u.id] = u; });
    Object.keys(users).forEach(function (k) {
      const u = users[k], p = NEV.player.load(u.id) || {}, pr = p.progress || {}, lg = p.login || {};
      T.users.push({ id: u.id, email: u.email, pseudo: u.pseudo, code: u.code || '', ref_by: u.refBy || null, banned: u.banned ? 1 : 0, created: u.created });
      T.players.push({ uid: u.id, level: p.level == null ? null : p.level, max_pushups: p.maxPushups == null ? null : p.maxPushups, xp: pr.xp || 0, streak: pr.streak || 0, best_streak: pr.best || 0, sessions_total: pr.total || 0, flames: p.flames || 0, flames_total: p.flamesTotal || 0, login_streak: lg.streak || 0, last_done: pr.lastDone || null, last_seen: lg.last || null, data: JSON.stringify(p) });
      (p.history || []).forEach(function (h) { T.workouts.push({ uid: u.id, day: h.date, exercise_id: h.id, name: h.name, rarity: h.rarity, tier: h.tier, reps: h.reps, sets: h.sets, verified: h.verified ? 1 : 0, doubled: h.doubled ? 1 : 0, xp_gain: h.xpGain, source: h.src }); });
      (lg.days || []).forEach(function (d) { T.logins.push({ uid: u.id, day: d }); });
      Object.keys(p.badges || {}).forEach(function (b) { T.badge_grants.push({ uid: u.id, badge_id: b, day: p.badges[b] }); });
    });
    store.get('nev.badgedefs', []).forEach(function (b) { T.badge_defs.push({ id: b.id, name: b.name, descr: b.desc, shape: b.shape, icon: b.icon, label: b.text, c1: b.c1, c2: b.c2, rule_type: b.rule && b.rule.t, rule_value: b.rule && b.rule.v }); });
    store.get('nev.combos', []).forEach(function (c) { T.combos.push({ id: c.id, name: c.name, blurb: c.blurb, lvl: c.lvl, published: c.published ? 1 : 0, items: JSON.stringify(c.items) }); });
    store.get('nev.chat', []).forEach(function (m) { T.chat_messages.push({ id: m.id, room: m.room, uid: m.uid, name: m.name, text: m.text, t: m.t, role: m.role }); });
    store.get('nev.events', []).forEach(function (e) { T.events.push({ t: e.t, type: e.type, page: e.page, uid: e.uid || null, name: e.name || null, data: JSON.stringify(e.data || {}) }); });
    const an = store.get('nev.announce', null); if (an) T.meta.push({ key: 'announce', value: JSON.stringify(an) });
    Object.keys(T).forEach(function (k) { T[k].forEach(function (r, i) { r._rowid = i + 1; }); });
    return T;
  }
  const clip = function (v) { return typeof v === 'string' && v.length > 240 ? v.slice(0, 240) + '…' : v; };
  const csvCell = function (v) { if (v === null || v === undefined) return ''; let s = String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const DB = (A.db = { download: {} });

  DB.info = async function () {
    if (C.mode === 'server') { const r = await api('admin/db/info'); if (!r.ok) throw new Error(r.data.error || 'Base indisponible'); r.data.mode = 'server'; return r.data; }
    const T = localTables(), bytes = (function () { let n = 0; try { for (let i = 0; i < g.localStorage.length; i++) { const k = g.localStorage.key(i); if (k.indexOf('nev.') === 0) n += k.length + (g.localStorage.getItem(k) || '').length; } } catch (e) { /* ignoré */ } return n * 2; })();
    return {
      mode: 'local', info: { engine: 'Stockage local du navigateur (mode démo)', sizeBytes: bytes, journal: '—', tables: Object.keys(T).length, backups: [] },
      tables: Object.keys(T).map(function (k) { return { name: k, kind: 'table', rows: T[k].length, descr: DB_DESCR[k] || '', columns: DB_COLS[k].map(function (c) { return { name: c, type: '', pk: false, notnull: false }; }) }; })
    };
  };
  DB.rows = async function (table, o) {
    o = o || {};
    if (C.mode === 'server') {
      const r = await api('admin/db/rows?table=' + encodeURIComponent(table) + '&q=' + encodeURIComponent(o.q || '') + '&page=' + (o.page || 1) + (o.sort ? '&sort=' + encodeURIComponent(o.sort) + '&dir=' + (o.dir === 'asc' ? 'asc' : 'desc') : ''));
      if (!r.ok) throw new Error(r.data.error || 'Table indisponible'); return r.data;
    }
    const T = localTables(); if (!T[table]) throw new Error('Table inconnue.');
    let rows = T[table].slice(), q = String(o.q || '').toLowerCase();
    if (q) rows = rows.filter(function (r) { return DB_COLS[table].some(function (c) { return String(r[c] == null ? '' : r[c]).toLowerCase().indexOf(q) >= 0; }); });
    if (o.sort && DB_COLS[table].indexOf(o.sort) >= 0) { const d = o.dir === 'asc' ? 1 : -1; rows.sort(function (a, b) { return a[o.sort] > b[o.sort] ? d : a[o.sort] < b[o.sort] ? -d : 0; }); } else rows.reverse();
    const size = 40, page = Math.max(1, o.page || 1), total = rows.length;
    return { table: table, columns: DB_COLS[table].map(function (c) { return { name: c }; }), rows: rows.slice((page - 1) * size, page * size).map(function (r) { const x = { _rowid: r._rowid }; DB_COLS[table].forEach(function (c) { x[c] = clip(r[c]); }); return x; }), total: total, page: page, pages: Math.max(1, Math.ceil(total / size)), editableDelete: false };
  };
  DB.row = async function (table, rowid) {
    if (C.mode === 'server') { const r = await api('admin/db/row?table=' + encodeURIComponent(table) + '&rowid=' + encodeURIComponent(rowid)); return r.ok ? r.data.row : null; }
    const T = localTables(); const row = (T[table] || []).find(function (x) { return x._rowid === rowid; }); if (!row) return null; const o = Object.assign({}, row); delete o._rowid; return o;
  };
  DB.userFile = async function (uid) {
    if (C.mode === 'server') { const r = await api('admin/db/user?uid=' + encodeURIComponent(uid)); return r.ok ? r.data : null; }
    const T = localTables(), u = T.users.find(function (x) { return x.id === uid; }); if (!u) return null;
    const pl = T.players.find(function (x) { return x.uid === uid; }); let data = {}; try { data = JSON.parse((pl || {}).data || '{}'); } catch (e) { /* ignoré */ }
    const wk = T.workouts.filter(function (x) { return x.uid === uid; }).sort(function (a, b) { return a.day < b.day ? 1 : -1; });
    return {
      user: { id: u.id, email: u.email, pseudo: u.pseudo, code: u.code, created: u.created, banned: !!u.banned, refBy: u.ref_by, lastLogin: null },
      stats: pl ? { level: pl.level, maxPushups: pl.max_pushups, xp: pl.xp, streak: pl.streak, best: pl.best_streak, total: pl.sessions_total, flames: pl.flames, flamesTotal: pl.flames_total, loginStreak: pl.login_streak, lastDone: pl.last_done, lastSeen: pl.last_seen } : null,
      referrals: T.users.filter(function (x) { return x.ref_by === uid; }).map(function (x) { return { id: x.id, pseudo: x.pseudo, day: x.created }; }),
      referredBy: u.ref_by ? (T.users.find(function (x) { return x.id === u.ref_by; }) || {}).pseudo || null : null,
      badges: T.badge_grants.filter(function (x) { return x.uid === uid; }).map(function (x) { return { id: x.badge_id, day: x.day, source: 'earned' }; }),
      workouts: wk.slice(0, 100).map(function (x) { return { day: x.day, name: x.name, rarity: x.rarity, reps: x.reps, sets: x.sets, verified: x.verified, doubled: x.doubled, xp: x.xp_gain, source: x.source }; }),
      workoutCount: wk.length, loginDays: T.logins.filter(function (x) { return x.uid === uid; }).map(function (x) { return x.day; }).sort().reverse().slice(0, 60),
      messages: T.chat_messages.filter(function (x) { return x.uid === uid; }).slice(-20).reverse().map(function (x) { return { room: x.room, text: x.text, t: x.t }; }),
      setup: data.setup || null
    };
  };
  DB.query = async function (sql) {
    if (C.mode !== 'server') return { error: 'La console SQL n\'existe qu\'en mode serveur (vraie base SQLite).' };
    const r = await api('admin/db/query', 'POST', { sql: sql }); return r.ok ? r.data : { error: r.data.error || 'Requête refusée.' };
  };
  DB.deleteRow = async function (table, rowid) { if (C.mode !== 'server') return false; const r = await api('admin/db/delete-row', 'POST', { table: table, rowid: rowid }); return r.ok; };
  DB.deleteUser = async function (uid) {
    if (C.mode === 'server') { const r = await api('admin/db/delete-user', 'POST', { uid: uid, confirm: true }); return r.ok; }
    const users = store.get(USERS, {}); let found = false;
    Object.keys(users).forEach(function (k) { if (users[k].id === uid) { delete users[k]; found = true; } });
    if (!found) return false; store.set(USERS, users); try { g.localStorage.removeItem(NEV.player.key(uid)); } catch (e) { /* ignoré */ }
    store.set('nev.chat', store.get('nev.chat', []).filter(function (m) { return m.uid !== uid && m.room !== 'coach:' + uid; })); return true;
  };
  DB.check = async function () { if (C.mode === 'server') { const r = await api('admin/db/check', 'POST', {}); return r.ok ? r.data : null; } return { integrity: 'ok', foreignKeys: 0 }; };
  DB.backupNow = async function () { if (C.mode !== 'server') return null; const r = await api('admin/db/backup-now', 'POST', {}); return r.ok ? r.data.info : null; };
  // liens de téléchargement (serveur) ou fichiers générés dans le navigateur (démo)
  DB.exportUrl = function (table, format) { return ROOT + 'api/admin/db/export?table=' + encodeURIComponent(table) + '&format=' + (format === 'csv' ? 'csv' : 'json'); };
  DB.backupUrl = function () { return ROOT + 'api/admin/db/backup'; };
  DB.localExport = function (table, format) { // démo : fabrique le fichier dans le navigateur
    const T = localTables(), names = table === 'all' ? Object.keys(T) : [table]; if (table !== 'all' && !T[table]) return null;
    let body, type, name;
    if (format === 'csv' && table !== 'all') {
      const cols = DB_COLS[table]; body = '﻿' + [cols.map(csvCell).join(',')].concat(T[table].map(function (r) { return cols.map(function (c) { return csvCell(r[c]); }).join(','); })).join('\r\n'); type = 'text/csv'; name = 'nev-' + table + '.csv';
    } else {
      const out = { app: 'neV.BOOSTER (démo)', exported: new Date().toISOString(), tables: {} };
      names.forEach(function (k) { out.tables[k] = T[k].map(function (r) { const o = Object.assign({}, r); delete o._rowid; ['data', 'items', 'value'].forEach(function (c) { if (typeof o[c] === 'string') { try { o[c] = JSON.parse(o[c]); } catch (e) { /* texte */ } } }); return o; }); });
      body = JSON.stringify(table === 'all' ? out : out.tables[table], null, 1); type = 'application/json'; name = table === 'all' ? 'nev-base-demo.json' : 'nev-' + table + '.json';
    }
    try { const a = doc.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: type })); a.download = name; doc.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500); return true; } catch (e) { return false; }
  };
})(window);
