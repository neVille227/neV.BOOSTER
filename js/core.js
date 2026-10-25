/* ==========================================================
   neV.BOOSTER — core.js
   Stockage, aléatoire, transitions, comptes, niveau, série.
   Tout passe par l'objet global NEV (pas de modules : le site
   fonctionne aussi s'il est ouvert depuis un simple dossier).
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const doc = g.document;

  /* ---------- stockage (localStorage, avec repli mémoire) ---------- */
  const mem = {};
  let ls = null;
  try { ls = g.localStorage; ls.setItem('nev.t', '1'); ls.removeItem('nev.t'); } catch (e) { ls = null; }
  NEV.store = {
    get(k, d) {
      try { const v = ls ? ls.getItem(k) : mem[k]; return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) {
      try { const s = JSON.stringify(v); if (ls) ls.setItem(k, s); else mem[k] = s; } catch (e) { /* quota ou mode privé */ }
    },
    del(k) { try { if (ls) ls.removeItem(k); else delete mem[k]; } catch (e) { /* ignoré */ } },
    persistent: !!ls
  };

  /* ---------- aléatoire (crypto du navigateur) ---------- */
  const rng = (NEV.rng = {
    float() {
      const c = g.crypto || g.msCrypto;
      if (c && c.getRandomValues) {
        const a = new Uint32Array(2); c.getRandomValues(a);
        return ((a[0] >>> 5) * 67108864 + (a[1] >>> 6)) / 9007199254740992;
      }
      return Math.random();
    },
    int(n) { return Math.floor(rng.float() * n); },
    pick(arr) { return arr[rng.int(arr.length)]; },
    weighted(weights) {
      let total = 0; for (const w of weights) total += Math.max(0, w);
      let r = rng.float() * total;
      for (let i = 0; i < weights.length; i++) { r -= Math.max(0, weights[i]); if (r < 0) return i; }
      return weights.length - 1;
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = rng.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    },
    id() { let s = ''; for (let i = 0; i < 3; i++) s += Math.floor(rng.float() * 1679616).toString(36).padStart(4, '0'); return s; }
  });

  /* ---------- petits outils ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const util = (NEV.util = {
    clamp: (v, a, b) => Math.min(b, Math.max(a, v)),
    esc: (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    // Jour local au format AAAA-MM-JJ. NEV.__today permet de simuler une date (tests).
    todayStr(d) {
      if (!d && NEV.__today) return NEV.__today;
      d = d || new Date();
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    },
    parseDay(s) { const p = s.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); },
    daysBetween(a, b) { return Math.round((util.parseDay(b) - util.parseDay(a)) / 86400000); },
    addDays(s, n) { const d = new Date(util.parseDay(s) + n * 86400000); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); },
    reduced() { return !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches); },
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    fmtTime(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + pad(sec % 60); },
    frDate(s) {
      const d = new Date(util.parseDay(s));
      return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    }
  });

  /* ---------- transitions fondu flouté entre les pages ---------- */
  let leaving = false;
  NEV.go = function (url, delay) {
    if (leaving) return;
    leaving = true;
    doc.documentElement.classList.add('nev-leaving');
    setTimeout(function () { g.location.href = url; }, util.reduced() ? 0 : (delay == null ? 620 : delay));
  };
  doc.addEventListener('click', function (e) {
    const a = e.target.closest && e.target.closest('a[data-go]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    NEV.go(a.getAttribute('href'));
  });
  g.addEventListener('pageshow', function (e) {
    if (e.persisted) { leaving = false; doc.documentElement.classList.remove('nev-leaving'); }
  });

  /* ---------- SHA-256 (repli si crypto.subtle est absent) ---------- */
  function sha256hex(str) {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const bytes = unescape(encodeURIComponent(str)).split('').map((c) => c.charCodeAt(0));
    const l = bytes.length;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hi = Math.floor((l * 8) / 4294967296), lo = (l * 8) >>> 0;
    bytes.push(hi >>> 24 & 255, hi >>> 16 & 255, hi >>> 8 & 255, hi & 255, lo >>> 24 & 255, lo >>> 16 & 255, lo >>> 8 & 255, lo & 255);
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let i = 0; i < bytes.length; i += 64) {
      const w = new Array(64);
      for (let j = 0; j < 16; j++) w[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) | (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3];
      for (let j = 16; j < 64; j++) {
        const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, gg = h6, h = h7;
      for (let j = 0; j < 64; j++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & gg);
        const t1 = (h + S1 + ch + K[j] + w[j]) | 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + mj) | 0;
        h = gg; gg = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + gg) | 0; h7 = (h7 + h) | 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }
  NEV.sha256 = sha256hex;
  const hex = (u8) => Array.prototype.map.call(u8, (b) => b.toString(16).padStart(2, '0')).join('');

  async function hashPw(pw, salt) {
    const c = g.crypto;
    if (c && c.subtle && g.TextEncoder) {
      try {
        const enc = new TextEncoder();
        const key = await c.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
        const bits = await c.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
        return 'p1:' + hex(new Uint8Array(bits));
      } catch (e) { /* repli ci-dessous */ }
    }
    let h = sha256hex(salt + pw);
    for (let i = 0; i < 4000; i++) h = sha256hex(h + salt);
    return 's1:' + h;
  }

  /* ---------- comptes (enregistrés sur l'appareil) ---------- */
  const USERS = 'nev.users', SESSION = 'nev.session';
  const auth = (NEV.auth = {
    _users() { return NEV.store.get(USERS, {}); },
    validate(f) {
      const email = String(f.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { field: 'email', msg: 'Entre une adresse email valide.' };
      return null;
    },
    codeOf(id) { return 'NEV' + String(id).replace(/[^a-z0-9]/gi, '').slice(-5).toUpperCase(); },
    check(f) {
      const email = String(f.email || '').trim().toLowerCase();
      const pseudo = String(f.pseudo || '').trim();
      if (pseudo.length < 2 || pseudo.length > 20) return { ok: false, field: 'pseudo', error: 'Ton pseudo doit faire entre 2 et 20 caractères.' };
      const bad = auth.validate({ email });
      if (bad) return { ok: false, field: bad.field, error: bad.msg };
      if (String(f.password || '').length < 8) return { ok: false, field: 'password', error: 'Le mot de passe doit faire au moins 8 caractères.' };
      if (f.password !== f.password2) return { ok: false, field: 'password2', error: 'Les deux mots de passe ne sont pas identiques.' };
      if (!f.consent) return { ok: false, field: 'consent', error: 'Coche la case pour confirmer que tu as lu le conseil de sécurité.' };
      if (!f.terms) return { ok: false, field: 'terms', error: 'Coche la case pour accepter les conditions d\'utilisation et la politique de confidentialité.' };
      return { ok: true, email, pseudo };
    },
    async signup(f) {
      const c = auth.check(f);
      if (!c.ok) return c;
      if (NEV.cloud && NEV.cloud.mode === 'server') return NEV.cloud.serverSignup(Object.assign({}, f, { email: c.email, pseudo: c.pseudo }));
      const users = auth._users();
      if (users[c.email]) return { ok: false, field: 'email', error: 'Un compte existe déjà avec cet email. Connecte-toi.' };
      const salt = rng.id();
      const id = 'u' + rng.id();
      const user = { id, email: c.email, pseudo: c.pseudo, salt, hash: await hashPw(f.password, salt), created: util.todayStr(), code: auth.codeOf(id), refCount: 0 };
      const ref = String(f.ref || '').trim().toUpperCase();
      let refUser = null;
      if (ref) {
        refUser = Object.keys(users).map((k) => users[k]).find((u) => u.code === ref);
        if (!refUser) return { ok: false, field: 'ref', error: 'Ce code de parrainage n\'existe pas (tu peux laisser la case vide).' };
        user.refBy = refUser.id;
        refUser.refCount = (refUser.refCount || 0) + 1;
      }
      users[c.email] = user;
      NEV.store.set(USERS, users);
      NEV.store.set(SESSION, { uid: user.id, email: c.email, at: Date.now() });
      if (refUser) { const p = P.load(user.id); p.ref.by = ref; P.save(p, user.id); }
      if (NEV.track) NEV.track('signup', { ref: !!refUser });
      return { ok: true, user: auth.current() };
    },
    async login(email, password) {
      email = String(email || '').trim().toLowerCase();
      if (NEV.cloud && NEV.cloud.mode === 'server') return NEV.cloud.serverLogin(email, String(password || ''));
      const u = auth._users()[email];
      if (!u) return { ok: false, field: 'email', error: 'Aucun compte avec cet email.' };
      if (u.banned) return { ok: false, field: 'email', error: 'Ce compte est suspendu. Écris-nous pour en savoir plus.' };
      const h = await hashPw(String(password || ''), u.salt);
      if (h !== u.hash) return { ok: false, field: 'password', error: 'Mot de passe incorrect.' };
      NEV.store.set(SESSION, { uid: u.id, email, at: Date.now() });
      if (NEV.track) NEV.track('login', {});
      return { ok: true, user: auth.current() };
    },
    current() {
      const s = NEV.store.get(SESSION, null);
      if (!s) return null;
      const u = auth._users()[s.email];
      if (!u || u.id !== s.uid) return null;
      return { id: u.id, email: u.email, pseudo: u.pseudo, created: u.created, code: u.code || auth.codeOf(u.id), refCount: u.refCount || 0 };
    },
    logout() { NEV.store.del(SESSION); if (NEV.cloud && NEV.cloud.mode === 'server') NEV.cloud.serverLogout(); },
    require() {
      const u = auth.current();
      if (!u) { NEV.go('connexion.html', 0); return null; }
      return u;
    }
  });

  /* ---------- niveau selon le maximum de pompes ---------- */
  const LEVELS = [
    { n: 1, name: 'Éveil', range: '1 à 5 pompes', desc: 'On pose les bases, en douceur.' },
    { n: 2, name: 'Initié', range: '6 à 15 pompes', desc: 'Les mouvements deviennent réguliers.' },
    { n: 3, name: 'Combattant', range: '16 à 30 pompes', desc: 'Tu tiens le rythme, on monte l\'intensité.' },
    { n: 4, name: 'Guerrier', range: '31 à 50 pompes', desc: 'Du volume, de la technique, du caractère.' },
    { n: 5, name: 'Légende', range: '51 pompes et plus', desc: 'Le haut du tableau : charges maximales.' }
  ];
  NEV.LEVELS = LEVELS;
  NEV.levelFromMax = function (x) {
    x = Math.round(Number(x));
    const n = x <= 5 ? 1 : x <= 15 ? 2 : x <= 30 ? 3 : x <= 50 ? 4 : 5;
    return LEVELS[n - 1];
  };
  const HERO = [
    { n: 1, name: 'Maigrichon', xp: 0 }, { n: 2, name: 'Éveillé', xp: 100 }, { n: 3, name: 'Athlète', xp: 300 },
    { n: 4, name: 'Costaud', xp: 700 }, { n: 5, name: 'Colosse', xp: 1400 }, { n: 6, name: 'Légende', xp: 2600 }
  ];
  NEV.HERO_STAGES = HERO;
  NEV.heroFromXp = function (xp) {
    let s = HERO[0];
    for (const h of HERO) if (xp >= h.xp) s = h;
    const next = HERO[s.n] || null;
    return { stage: s, next, pct: next ? util.clamp((xp - s.xp) / (next.xp - s.xp), 0, 1) : 1 };
  };

  /* ---------- profil du joueur : réglages, série, jour raté ---------- */
  const defaults = () => ({
    v: 1,
    maxPushups: null, level: null,
    setup: { focus: 'equilibre', sets: 3, camera: true, zones: [], equip: { chair: true, wall: true, bag: false, step: false, bottle: false, towel: false, bar: false, table: false } },
    progress: { streak: 0, best: 0, lastDone: null, total: 0, xp: 0 },
    daily: null,
    spe: null,
    pity: 0,
    history: [],
    collection: {},
    flames: 0, flamesTotal: 0, bonusDraws: 0, gifts: [],
    login: { last: null, streak: 0, best: 0, days: [] },
    badges: {},
    ref: { count: 0, paid: 0, by: null, welcomed: false },
    aura: 'none', auras: ['none'],
    updated: 0
  });
  const P = (NEV.player = {
    key(uid) { return 'nev.p.' + uid; },
    load(uid) {
      uid = uid || (auth.current() || {}).id;
      if (!uid) return null;
      const p = NEV.store.get(P.key(uid), null);
      const d = defaults();
      if (!p) return d;
      p.setup = Object.assign(d.setup, p.setup || {});
      p.setup.equip = Object.assign(d.setup.equip, (p.setup || {}).equip || {});
      p.progress = Object.assign(d.progress, p.progress || {});
      p.history = p.history || [];
      p.collection = p.collection || {};
      p.login = Object.assign(d.login, p.login || {});
      p.ref = Object.assign(d.ref, p.ref || {});
      p.badges = p.badges || {};
      p.auras = p.auras || ['none'];
      return Object.assign(d, p, { setup: p.setup, progress: p.progress });
    },
    save(p, uid) {
      uid = uid || (auth.current() || {}).id;
      if (uid) {
        p.updated = Date.now();
        NEV.store.set(P.key(uid), p);
        if (NEV.cloud && NEV.cloud.mode === 'server') NEV.cloud.pushPlayer(p);
      }
      return p;
    },
    /* Nouveau jour : on regarde si un jour a été raté.
       Jour raté (écart de 2 jours ou plus depuis le dernier entraînement) :
       la série retombe à 0 et l'enchaînement d'aujourd'hui est doublé. */
    ensureDay(p, today) {
      today = today || util.todayStr();
      if (!p.spe || p.spe.date !== today) p.spe = { date: today, zone: null, card: null, status: 'none', result: null };
      if (p.daily && p.daily.date === today) return p;
      const last = p.progress.lastDone;
      const gap = last ? util.daysBetween(last, today) : 0;
      const missed = last && gap >= 2 ? gap - 1 : 0;
      if (missed >= 1) { p.progress.streakLost = p.progress.streak; p.progress.streak = 0; }
      p.daily = { date: today, status: 'none', missed, double: missed >= 1, card: null, result: null };
      return p;
    },
    /* Fait avancer la série d'aujourd'hui (une seule fois par jour). */
    _touch(p, today, rest) {
      const last = p.progress.lastDone;
      if (last === today) return false;
      const gap = last ? util.daysBetween(last, today) : 0;
      p.progress.streak = (last && gap === 1) ? p.progress.streak + 1 : 1;
      p.progress.best = Math.max(p.progress.best, p.progress.streak);
      if (!rest) p.progress.total += 1; else p.progress.restDays = (p.progress.restDays || 0) + 1;
      p.progress.lastDone = today;
      return true;
    },
    /* Enregistre la séance (du jour ou de Spécialisation) et fait avancer série, XP, collection.
       res : { reps, sets, verified, src: 'daily' | 'spe' | 'combo', rest: true pour une carte Repos }.
       Le Repos garde la série mais ne compte pas comme un jour d'entraînement. */
    complete(p, res, today) {
      today = today || util.todayStr();
      P.ensureDay(p, today);
      res = res || {};
      const src = res.src === 'spe' ? 'spe' : 'daily';
      const slot = src === 'spe' ? p.spe : p.daily;
      const d = p.daily;
      if (slot.status === 'done') return { already: true, xpGain: 0, p };
      const card = slot.card;
      const isRest = !!(res.rest || (card && card.special === 'repos'));
      const tier = card ? card.tier : 1;
      const verified = res.verified !== false;
      const dayDone = d.status === 'done';
      let xpGain = isRest ? 20 : Math.round((30 + 20 * tier) * (d.double && !dayDone ? 1.5 : 1) * (verified ? 1 : 0.5));
      if (src === 'spe' && dayDone && !isRest) xpGain = Math.round(xpGain * 0.6); // bonus : une 2e séance rapporte moins
      const touched = P._touch(p, today, isRest);
      p.progress.xp += xpGain;
      slot.status = 'done';
      slot.result = { reps: res.reps, sets: res.sets, verified: !!verified, at: Date.now(), xpGain, rest: isRest };
      if (!dayDone) { // la séance règle aussi la journée (la Spécialisation peut remplacer la carte du jour)
        d.status = 'done'; d.result = Object.assign({ via: src }, slot.result);
      }
      if (card) {
        if (!isRest) p.collection[card.id] = (p.collection[card.id] || 0) + 1;
        p.history.unshift({ date: today, id: card.id, name: card.name, rarity: card.rarity, tier, reps: res.reps, sets: res.sets, verified: !!verified, doubled: !!(d.double && !dayDone), xpGain, src, rest: isRest, special: card.special || null });
        p.history = p.history.slice(0, 160);
      } else if (res.combo) {
        p.history.unshift({ date: today, id: 'combo:' + res.combo.id, name: res.combo.name, rarity: 'combo', tier: 1, reps: res.reps, sets: res.sets, verified: !!verified, doubled: false, xpGain, src: 'combo', rest: false });
        p.history = p.history.slice(0, 160);
      }
      return { already: false, xpGain, p, touched };
    },
    /* Séance « combo » (enchaînement libre) : XP selon le volume, la série avance si ce n'est pas déjà fait. */
    completeCombo(p, combo, res, today) {
      today = today || util.todayStr();
      P.ensureDay(p, today);
      res = res || {};
      const d = p.daily;
      const dayDone = d.status === 'done';
      const verified = res.verified !== false;
      let xpGain = Math.round((20 + 12 * (combo.items || []).length) * (verified ? 1 : 0.5));
      if (dayDone) xpGain = Math.round(xpGain * 0.6);
      P._touch(p, today, false);
      p.progress.xp += xpGain;
      if (!dayDone) {
        // un combo remplace la carte du jour s'il n'y en a pas de commencée ; la journée est alors validée
        d.status = 'done'; d.result = { via: 'combo', reps: res.reps, sets: res.sets, verified: !!verified, at: Date.now(), xpGain };
      }
      p.history.unshift({ date: today, id: 'combo:' + combo.id, name: combo.name, rarity: 'combo', tier: 1, reps: res.reps, sets: res.sets, verified: !!verified, doubled: false, xpGain, src: 'combo', rest: false });
      p.history = p.history.slice(0, 160);
      return { already: false, xpGain, p };
    }
  });
})(window);
