/* ==========================================================
   neV.BOOSTER — server/features.js
   Les fonctions « confiance et sécurité » du serveur :
   • consentement (CGU) et suivi des preuves  • mot de passe oublié, vérification d'e-mail
   • modération du chat et signalements      • anti-triche (validation côté serveur)
   • amis, classements, défi de la semaine   • compte (export des données, suppression)
   • relecture des exercices par un coach
   server.js lui passe ses utilitaires (ctx) ; ce fichier ne lit jamais la base directement.
   ========================================================== */
'use strict';
const crypto = require('crypto');
const policy = require('../js/policy.js');
const mailer = require('./mail');

module.exports = function features(ctx) {
  const { S, send, fail, readBody, limit, clean, now, rid, scrypt, safeEq, today, addDays, startSession, setCookie, cookies, counters, logEvent, isSecure } = ctx;
  const env = process.env;
  const CFG = {
    chatNewMinutes: env.NEV_CHAT_NEW_MINUTES == null ? 10 : Number(env.NEV_CHAT_NEW_MINUTES) || 0,   // un compte tout neuf ne peut pas écrire dans le salon
    slowHours: env.NEV_CHAT_SLOW_HOURS == null ? 24 : Number(env.NEV_CHAT_SLOW_HOURS) || 0,           // …puis 1 message / 45 s pendant ces heures
    reportsToHide: 3, baseUrl: String(env.NEV_BASE_URL || '').replace(/\/+$/, '')
  };
  const HOUR = 3600000, DAY = 86400000;
  const emailOk = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e) && e.length <= 254;
  const tok = () => crypto.randomBytes(32).toString('base64url');

  /* ---------------- courriels : modèles et envoi ---------------- */
  const T = {
    fr: {
      verify: (n, l) => ['Confirme ton adresse e-mail — neV.BOOSTER', 'Bonjour ' + n + ',\n\nConfirme ton adresse e-mail en ouvrant ce lien (valable 48 h) :\n' + l + '\n\nSi tu n\'as pas créé de compte neV.BOOSTER, ignore ce message.\n'],
      reset: (n, l) => ['Nouveau mot de passe — neV.BOOSTER', 'Bonjour ' + n + ',\n\nTu as demandé à changer ton mot de passe. Ouvre ce lien (valable 1 heure) :\n' + l + '\n\nSi ce n\'est pas toi, ignore ce message : ton mot de passe reste inchangé.\n']
    },
    en: {
      verify: (n, l) => ['Confirm your e-mail address — neV.BOOSTER', 'Hello ' + n + ',\n\nConfirm your e-mail address by opening this link (valid for 48 hours):\n' + l + '\n\nIf you did not create a neV.BOOSTER account, ignore this message.\n'],
      reset: (n, l) => ['New password — neV.BOOSTER', 'Hello ' + n + ',\n\nYou asked to change your password. Open this link (valid for 1 hour):\n' + l + '\n\nIf this was not you, ignore this message: your password stays unchanged.\n']
    }
  };
  const LANGS = ['fr', 'en', 'es', 'pt', 'ar', 'zh', 'hi'];
  const okLang = (l) => (LANGS.indexOf(l) >= 0 ? l : 'fr');
  /* les e-mails existent en français et en anglais : toute autre langue reçoit l'anglais */
  const lang = (u) => (u && u.lang && u.lang !== 'fr' ? 'en' : 'fr');
  function linkBase(req) {
    if (CFG.baseUrl) return { base: CFG.baseUrl, safe: true };
    const h = String(req.headers.host || 'localhost').replace(/[^A-Za-z0-9.:\-\[\]]/g, '');
    return { base: (isSecure(req) ? 'https://' : 'http://') + h, safe: false };
  }
  // Met le courriel dans la boîte d'envoi, puis l'envoie si le SMTP est réglé ET que l'adresse du site est connue (anti « Host spoofing »).
  async function queueMail(req, kind, uid, to, build) {
    const lb = linkBase(req), [subject, body] = build(lb.base);
    const link = (body.match(/https?:\/\/\S+/) || [''])[0];
    const id = S.addMail({ uid, kind, to, subject, body, link, status: 'queued' });
    if (mailer.configured() && lb.safe) {
      try { await mailer.send({ to, subject, text: body }); S.setMail(id, 'sent', null); }
      catch (e) { S.setMail(id, 'error', e.message); counters.errors5xx += 0; console.error('[courriel]', e.message); }
    } else if (mailer.configured() && !lb.safe) S.setMail(id, 'queued', 'NEV_BASE_URL manquant : envoi bloqué par sécurité (copie le lien depuis l\'admin).');
    return id;
  }

  /* ---------------- inscription : contrôles et suites ---------------- */
  // Appelée par signup() avant la création. Retourne {error, field} ou {extra}.
  function checkSignup(b) {
    if (!b.terms) return { error: 'Coche la case pour accepter les conditions d\'utilisation et la politique de confidentialité.', field: 'terms' };
    return { extra: { lang: okLang(b.lang) } };
  }
  async function afterSignup(req, user) {
    S.addConsent(user.id, 'terms', policy.TERMS_VERSION, 'conditions et confidentialité acceptées à l\'inscription');
    const v = tok(); S.addToken(v, user.id, 'verify', now() + 2 * DAY, null);
    await queueMail(req, 'verify', user.id, user.email, (base) => T[lang(user)].verify(user.pseudo, base + '/verifier-email.html?t=' + v));
  }

  /* ---------------- pub : ce que le navigateur a le droit de voir ---------------- */
  const pubUser = (u) => ({
    id: u.id, email: u.email, pseudo: u.pseudo, created: u.created, code: u.code, refCount: u.refCount || 0,
    verified: !!u.verified, lang: okLang(u.lang), publicBoard: !!u.publicBoard, mailOn: mailer.configured()
  });

  /* ====================================================================
     ANTI-TRICHE : le navigateur calcule la progression, le serveur la plafonne
     ==================================================================== */
  const num = (v, lo, hi, d) => { v = Number(v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  const DAYRE = /^\d{4}-\d{2}-\d{2}$/;
  function guardPlayer(prev, p, uid) {
    const CAP = policy.CAPS, day = today(), flags = [];
    const pv = prev || {}, pp = pv.progress || {};
    const flag = (kind, detail, sev) => flags.push([kind, detail, sev || 1]);
    const ps = pv._srv && pv._srv.day === day ? pv._srv : { day, xp: 0, sess: 0, fl: 0 };
    const srv = { day, xp: ps.xp || 0, sess: ps.sess || 0, fl: ps.fl || 0 };
    const prevXp = Math.floor(num(pp.xp, 0, 1e7, 0)), prevTotal = Math.floor(num(pp.total, 0, 1e7, 0));
    const prevFT = Math.floor(num(pv.flamesTotal, 0, 1e7, 0)), prevFl = Math.floor(num(pv.flames, 0, 1e6, 0));
    const daysSince = pv.updated ? Math.max(0, Math.floor((now() - pv.updated) / DAY)) : 0;

    // 1. historique : les nouvelles séances sont plafonnées (XP, nombre, dates, valeurs)
    const sig = (h) => [h.date, h.id, h.reps, h.sets, h.xpGain, h.src].join('|');
    const known = new Set((Array.isArray(pv.history) ? pv.history : []).map((h) => h && sig(h)));
    const oldest = addDays(day, -8), newest = addDays(day, CAP.FUTURE_DAYS);
    let roomXp = Math.max(0, CAP.XP_DAY - srv.xp), roomSess = Math.max(0, CAP.SESSIONS_DAY - srv.sess), accXp = 0, accSess = 0, dropped = 0;
    const hist = [];
    (Array.isArray(p.history) ? p.history : []).forEach((h) => {
      if (!h || typeof h !== 'object' || !DAYRE.test(String(h.date))) { dropped++; return; }
      h.reps = Math.floor(num(h.reps, 0, 500, 0)); h.sets = Math.floor(num(h.sets, 0, 20, 0)); h.xpGain = Math.floor(num(h.xpGain, 0, 200, 0)); h.tier = Math.floor(num(h.tier, 0, 5, 0));
      if (known.has(sig(h))) { hist.push(h); return; }          // déjà connue : conservée telle quelle
      if (h.date < oldest || h.date > newest) { dropped++; return; } // date impossible (trop ancienne ou dans le futur)
      if (accSess + 1 > roomSess || accXp + h.xpGain > roomXp) { dropped++; return; }
      accSess++; accXp += h.xpGain; hist.push(h);
    });
    p.history = hist;
    if (dropped) flag('historique', dropped + ' séance(s) refusée(s) (date, volume ou plafond du jour)', dropped > 6 ? 3 : 1);

    // 2. totaux de progression
    p.progress = p.progress || {};
    let dxp = p.progress.xp - prevXp;
    if (dxp > 0) { const room = Math.max(0, CAP.XP_DAY - srv.xp); if (dxp > room) { flag('xp', '+' + dxp + ' XP demandés, ' + room + ' autorisés aujourd\'hui', dxp > 3 * CAP.XP_DAY ? 3 : 2); dxp = room; p.progress.xp = prevXp + room; } srv.xp += dxp; }
    let dt = p.progress.total - prevTotal;
    if (dt > 0) { const room = Math.max(0, CAP.SESSIONS_DAY - srv.sess); if (dt > room) { flag('séances', '+' + dt + ' séances demandées, ' + room + ' autorisées aujourd\'hui', 2); dt = room; p.progress.total = prevTotal + room; } srv.sess += dt; }
    const maxStreak = (pp.streak || 0) + Math.max(CAP.STREAK_STEP, daysSince + 1);
    if (p.progress.streak > maxStreak) { flag('série', 'série ' + p.progress.streak + ' impossible (max ' + maxStreak + ')', 2); p.progress.streak = maxStreak; }
    p.progress.best = Math.min(p.progress.best, Math.max(pp.best || 0, p.progress.streak));
    if (p.progress.lastDone && (!DAYRE.test(String(p.progress.lastDone)) || p.progress.lastDone > newest)) { flag('date', 'dernier entraînement dans le futur', 3); p.progress.lastDone = pp.lastDone || null; }

    // 3. flammes
    const dft = p.flamesTotal - prevFT;
    if (dft > 0) {
      const room = Math.max(0, CAP.FLAMES_DAY - srv.fl), take = Math.min(dft, room);
      if (dft > room) { flag('flammes', '+' + dft + ' flammes demandées, ' + room + ' autorisées aujourd\'hui', dft > 3 * CAP.FLAMES_DAY ? 3 : 2); p.flamesTotal = prevFT + take; }
      if (p.flames - prevFl > take) p.flames = prevFl + take;
      srv.fl += take;
    } else if (p.flames > prevFl && dft <= 0) { flag('flammes', 'flammes ajoutées sans gain enregistré', 2); p.flames = prevFl; }
    if (p.flames > p.flamesTotal) p.flames = p.flamesTotal;

    p._srv = srv;
    if (flags.length) flags.forEach((f) => S.addFlag(uid, f[0], f[1], f[2]));
    return flags.length;
  }
  /* Cadeaux de l'admin (voir S.giftPlayer) : un navigateur en retard ne les efface pas, un tricheur n'en invente pas. */
  function mergeGifts(prev, p) {
    const pg = Array.isArray(prev && prev.gifts) ? prev.gifts : [], inc = new Map((Array.isArray(p.gifts) ? p.gifts : []).filter((g) => g && g.id).map((g) => [String(g.id), g]));
    const out = []; let fl = 0, dr = 0;
    pg.forEach((g) => { const c = inc.get(String(g.id)); if (c) out.push(Object.assign({}, g, { seen: !!c.seen || !!g.seen })); else { out.push(Object.assign({}, g, { seen: false })); fl += g.flames || 0; dr += g.draws || 0; } });
    p.gifts = out.slice(-30);
    // les tirages bonus ne peuvent que baisser côté navigateur (on les utilise) : jamais monter
    p.bonusDraws = Math.min(500, Math.max(0, Math.min(Math.floor(num(p.bonusDraws, 0, 500, 0)), Math.floor(num(prev && prev.bonusDraws, 0, 500, 0))) + dr));
    if (fl) { p.flames = Math.floor(num(p.flames, 0, 1e6, 0)) + fl; p.flamesTotal = Math.floor(num(p.flamesTotal, 0, 1e7, 0)) + fl; }
  }
  const flagged = (uid) => S.flagScore(uid, now() - 14 * DAY) >= 10;

  /* ====================================================================
     CHAT : règles d'accès + filtre
     ==================================================================== */
  function chatGate(user, room) {
    if (user.mutedUntil > now()) return 'Tu es en sourdine jusqu\'au ' + new Date(user.mutedUntil).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) + '.';
    if (room === 'global') {
      const age = now() - (user.createdMs || 0);
      if (user.createdMs && age < CFG.chatNewMinutes * 60000) return 'Compte tout neuf : le salon s\'ouvre pour toi dans ' + Math.max(1, Math.ceil((CFG.chatNewMinutes * 60000 - age) / 60000)) + ' min.';
      if (mailer.configured() && !user.verified) return 'Confirme ton adresse e-mail (lien reçu par courriel) pour écrire dans le salon.';
    }
    return null;
  }
  function chatPost(user, room, text) {
    const g = chatGate(user, room); if (g) return { error: g, code: 403 };
    const mod = policy.moderate(text); if (!mod.ok) return { error: mod.error, code: 400, reason: mod.reason };
    if (room === 'global' && CFG.slowHours && user.createdMs && now() - user.createdMs < CFG.slowHours * HOUR && S.chatCountSince(user.id, now() - 45000) > 0) return { error: 'Compte récent : un message toutes les 45 secondes.', code: 429 };
    const last = S.chatList(room === 'global' ? 'global' : 'coach:' + user.id, 30, true).filter((m) => m.uid === user.id).pop();
    if (last && last.text === mod.text && now() - last.t < 120000) return { error: 'Tu viens déjà d\'envoyer ce message.', code: 400 };
    return { ok: true, text: mod.text };
  }

  /* ====================================================================
     CLASSEMENTS, AMIS, DÉFI
     ==================================================================== */
  function period(kind, day) {
    if (kind === 'month') return { kind, from: policy.monthStart(day), label: 'Ce mois-ci' };
    if (kind === 'season') { const s = policy.seasonOf(day); return { kind, from: s.start, label: 'Saison ' + s.n + ' · ' + s.name, season: s }; }
    return { kind: 'week', from: policy.weekStart(day), label: 'Cette semaine' };
  }
  function challengeState(user) {
    const day = today(), ch = policy.challengeFor(day), se = policy.seasonOf(day);
    const st = S.workoutStats(user.id, ch.start, ch.end);
    const ver = S.verifiedCount ? S.verifiedCount(user.id, ch.start, ch.end) : 0;
    const val = ch.metric === 'sessions' ? st.sessions : ch.metric === 'days' ? st.days : ch.metric === 'reps' ? st.reps : ch.metric === 'xp' ? st.xp : ver;
    const ss = S.workoutStats(user.id, se.start, se.end);
    return {
      challenge: Object.assign({}, ch, { value: Math.min(val, ch.goal), done: val >= ch.goal, claimed: !!S.claimed(user.id, ch.week) }),
      season: Object.assign({}, se, { sessions: ss.sessions, xp: ss.xp, goal: policy.SEASON_REWARD.sessions, reward: policy.SEASON_REWARD.flames, done: se.n > 0 && ss.sessions >= policy.SEASON_REWARD.sessions, claimed: !!S.claimed(user.id, se.id) }),
      raw: { val, ver }
    };
  }

  /* ====================================================================
     ROUTES PUBLIQUES (sans session)
     ==================================================================== */
  async function publicRoute(route, m, req, res, ip) {
    if (route === 'forgot' && m === 'POST') {
      const w = limit('fg:' + ip, 8, HOUR); if (w) { counters.blocked++; return fail(res, 429, 'Trop de demandes. Réessaie plus tard.'); }
      const b = await readBody(req, 1024), email = clean(b.email, 254).toLowerCase();
      if (!emailOk(email)) return fail(res, 400, 'Entre une adresse e-mail valide.', 'email');
      const w2 = limit('fe:' + email, 3, HOUR);
      const u = S.userByEmail(email);
      if (u && !u.banned && !w2) {
        const t = tok(); S.addToken(t, u.id, 'reset', now() + HOUR, null);
        await queueMail(req, 'reset', u.id, u.email, (base) => T[lang(u)].reset(u.pseudo, base + '/mot-de-passe.html?t=' + t));
        logEvent('login', 'mot-de-passe', u.id, u.pseudo, { reset: true });
      }
      return send(res, 200, { ok: true, mail: mailer.configured() }); // même réponse que le compte existe ou non
    }
    if (route === 'token/check' && m === 'POST') {
      const w = limit('tk:' + ip, 40, HOUR); if (w) return fail(res, 429, 'Trop d\'essais.');
      const b = await readBody(req, 512), kind = ['reset', 'verify'].includes(b.kind) ? b.kind : '';
      const r = kind && /^[A-Za-z0-9_-]{20,80}$/.test(String(b.token || '')) ? S.peekToken(b.token, kind) : null;
      if (!r || r.used) return send(res, 200, { ok: false });
      return send(res, 200, { ok: true });
    }
    if (route === 'reset' && m === 'POST') {
      const w = limit('rs:' + ip, 20, HOUR); if (w) return fail(res, 429, 'Trop d\'essais.');
      const b = await readBody(req, 1024), pw = String(b.password || '');
      if (pw.length < 8 || pw.length > 200) return fail(res, 400, 'Le mot de passe doit faire au moins 8 caractères.', 'password');
      if (!/^[A-Za-z0-9_-]{20,80}$/.test(String(b.token || ''))) return fail(res, 400, 'Lien invalide ou expiré.');
      const r = S.useToken(b.token, 'reset'); if (!r) return fail(res, 400, 'Lien invalide ou expiré. Refais une demande.');
      const salt = crypto.randomBytes(16).toString('hex');
      S.setPassword(r.uid, salt, await scrypt(pw, salt)); S.setUser(r.uid, { email_verified: 1 });
      S.audit('mot-de-passe', r.uid, 'réinitialisé par lien');
      return send(res, 200, { ok: true });
    }
    if (route === 'verify' && m === 'POST') {
      const w = limit('vf:' + ip, 30, HOUR); if (w) return fail(res, 429, 'Trop d\'essais.');
      const b = await readBody(req, 512);
      const r = /^[A-Za-z0-9_-]{20,80}$/.test(String(b.token || '')) ? S.useToken(b.token, 'verify') : null;
      if (!r) return fail(res, 400, 'Lien invalide ou déjà utilisé.');
      S.setUser(r.uid, { email_verified: 1 }); return send(res, 200, { ok: true });
    }
    return false;
  }

  /* ====================================================================
     ROUTES JOUEUR (session)
     ==================================================================== */
  async function userRoute(route, m, req, res, ip, url, user) {
    if (route === 'account' && m === 'GET') return send(res, 200, { user: pubUser(user), consents: S.consents(user.id), friends: S.mutualFriends(user.id).length, claims: S.claimCount(user.id), termsVersion: policy.TERMS_VERSION });
    if (route === 'account/export' && m === 'GET') {
      const f = S.userFile(user.id); const dl = JSON.stringify({ app: 'neV.BOOSTER', exported: new Date().toISOString(), note: 'Toutes les données que neV.BOOSTER conserve à ton sujet (le mot de passe n\'est jamais lisible).', data: f, player: S.getPlayer(user.id) }, null, 1);
      const b = Buffer.from(dl, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': b.length, 'Content-Disposition': 'attachment; filename="neVBOOSTER-mes-donnees.json"', 'Cache-Control': 'no-store' }); return res.end(b);
    }
    if (route === 'account/delete' && m === 'POST') {
      const w = limit('ad:' + user.id, 5, HOUR); if (w) return fail(res, 429, 'Trop d\'essais.');
      const b = await readBody(req, 512), cred = S.credentials(user.id), h = await scrypt(String(b.password || '').slice(0, 200), cred.salt);
      if (!safeEq(h, cred.hash)) return fail(res, 401, 'Mot de passe incorrect.', 'password');
      S.audit('compte-supprimé', user.id, 'par le joueur'); S.deleteUser(user.id); setCookie(res, req, 'nev_s', '', 0); return send(res, 200, { ok: true });
    }
    if (route === 'account/lang' && m === 'POST') { const b = await readBody(req, 128); S.setUser(user.id, { lang: okLang(b.lang) }); return send(res, 200, { ok: true }); }
    if (route === 'account/board' && m === 'POST') {
      const b = await readBody(req, 128);
      S.setUser(user.id, { public_board: b.public ? 1 : 0 }); return send(res, 200, { ok: true });
    }
    if (route === 'verify/resend' && m === 'POST') {
      const w = limit('vr:' + user.id, 3, HOUR); if (w) return fail(res, 429, 'Trop de demandes. Réessaie plus tard.');
      if (user.verified) return send(res, 200, { ok: true, already: true });
      const v = tok(); S.addToken(v, user.id, 'verify', now() + 2 * DAY, null);
      await queueMail(req, 'verify', user.id, user.email, (base) => T[lang(user)].verify(user.pseudo, base + '/verifier-email.html?t=' + v));
      return send(res, 200, { ok: true, mail: mailer.configured() });
    }
    if (route === 'chat/report' && m === 'POST') {
      const w = limit('rp:' + user.id, 10, HOUR); if (w) return fail(res, 429, 'Trop de signalements.');
      const b = await readBody(req, 512), msg = S.chatMsg(String(b.id || ''));
      if (!msg || msg.room !== 'global' || msg.role !== 'player' || msg.uid === user.id) return fail(res, 400, 'Ce message ne peut pas être signalé.');
      S.addReport({ msgId: msg.id, room: msg.room, author: msg.uid, text: msg.text, reporter: user.id, reason: clean(b.reason, 60) });
      if (S.reportCount(msg.id) >= CFG.reportsToHide) { S.hideChat(msg.id, true); logEvent('error', 'chat', msg.uid, msg.name, { msg: 'message masqué après signalements' }); }
      return send(res, 200, { ok: true });
    }

    if (route === 'friends' && m === 'GET') {
      const mine = S.friendIds(user.id), mutual = new Set(S.mutualFriends(user.id));
      return send(res, 200, { code: user.code, friends: mine.filter((id) => mutual.has(id)).map((id) => { const f = S.userById(id); return f ? { id: f.id, pseudo: f.pseudo } : null; }).filter(Boolean), waiting: mine.filter((id) => !mutual.has(id)).map((id) => { const f = S.userById(id); return f ? { id: f.id, code: f.code } : null; }).filter(Boolean) });
    }
    if (route === 'friends' && m === 'POST') {
      const w = limit('fr:' + user.id, 20, HOUR); if (w) return fail(res, 429, 'Trop d\'essais. Réessaie plus tard.');
      const b = await readBody(req, 256), code = clean(b.code, 12).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const f = code ? S.userByCode(code) : null;
      if (!f || f.banned) return fail(res, 404, 'Aucun joueur avec ce code.', 'code');
      if (f.id === user.id) return fail(res, 400, 'C\'est ton propre code !', 'code');
      if (S.friendCount(user.id) >= 30) return fail(res, 400, 'Tu as déjà 30 amis : c\'est la limite.', 'code');
      S.addFriend(user.id, f.id);
      const mutual = S.mutualFriends(user.id).indexOf(f.id) >= 0;
      return send(res, 200, { ok: true, mutual, pseudo: mutual ? f.pseudo : null });
    }
    if (route === 'friends/remove' && m === 'POST') { const b = await readBody(req, 256); S.delFriend(user.id, String(b.id || '')); S.delFriend(String(b.id || ''), user.id); return send(res, 200, { ok: true }); }

    if (route === 'board' && m === 'GET') {
      const q = url.searchParams, per = period(q.get('period'), today()), scope = q.get('scope') === 'public' ? 'public' : 'friends';
      let ids;
      if (scope === 'public') {
        ids = S.publicIds().filter((id) => id === user.id || !flagged(id));
      } else ids = [user.id].concat(S.mutualFriends(user.id).filter((id) => !flagged(id)));
      const rows = S.board(ids, per.from).filter((r) => r.xp > 0 || r.id === user.id || scope === 'friends').map((r, i) => ({ rank: i + 1, pseudo: r.pseudo, xp: r.xp, sessions: r.sessions, streak: r.streak, level: r.level, me: r.id === user.id }));
      return send(res, 200, { scope, period: per, rows: rows.slice(0, 50), publicOptIn: !!user.publicBoard, locked: null });
    }
    if (route === 'challenge' && m === 'GET') { const s = challengeState(user); return send(res, 200, { challenge: s.challenge, season: s.season }); }
    if (route === 'challenge/claim' && m === 'POST') {
      const b = await readBody(req, 128), s = challengeState(user), w = limit('cc:' + user.id, 10, HOUR); if (w) return fail(res, 429, 'Trop d\'essais.');
      const season = b.kind === 'season', o = season ? s.season : s.challenge;
      if (season && o.n === 0) return fail(res, 400, 'La saison n\'a pas commencé.');
      if (!o.done) return fail(res, 400, 'Objectif pas encore atteint.');
      if (o.claimed) return fail(res, 400, 'Récompense déjà récupérée.');
      const key = season ? o.id : o.week;
      if (!S.claim(user.id, key, season ? 'season:' + o.id : o.id)) return fail(res, 400, 'Récompense déjà récupérée.');
      return send(res, 200, { ok: true, flames: o.reward, state: challengeState(user) });
    }
    return false;
  }

  /* ====================================================================
     ROUTES ADMIN
     ==================================================================== */
  async function adminRoute(route, m, req, res, ip, url) {
    if (route === 'moderation' && m === 'GET') {
      const rep = S.reports('open').map((r) => { const au = S.userById(r.author); return Object.assign({}, r, { authorName: au ? au.pseudo : '?', count: S.reportCount(r.msgId), hidden: !!(S.chatMsg(r.msgId) || {}).hidden, muted: !!(au && au.mutedUntil > now()) }); });
      const by = {}; rep.forEach((r) => { if (!by[r.msgId]) by[r.msgId] = Object.assign({}, r, { reporters: 0, reasons: [] }); by[r.msgId].reporters++; if (r.reason) by[r.msgId].reasons.push(r.reason); });
      return send(res, 200, { reports: Object.values(by), open: S.openReports() });
    }
    if (route === 'moderation/act' && m === 'POST') {
      const b = await readBody(req, 256), msg = S.chatMsg(String(b.msgId || '')), act = String(b.action || '');
      if (!msg) return fail(res, 404, 'Message introuvable (déjà supprimé ?).');
      if (act === 'hide') S.hideChat(msg.id, true);
      else if (act === 'show') S.hideChat(msg.id, false);
      else if (act === 'delete') S.delChat(msg.id);
      else if (act === 'mute' && msg.uid) { const h = Math.max(1, Math.min(24 * 90, Math.floor(Number(b.hours) || 24))); S.setUser(msg.uid, { muted_until: now() + h * HOUR }); S.audit('mute', msg.uid, h + ' h'); }
      else if (act !== 'dismiss') return fail(res, 400, 'Action inconnue.');
      S.resolveReports(msg.id, act === 'dismiss' || act === 'show' ? 'dismissed' : 'done'); S.audit('modération', msg.id, act); return send(res, 200, { ok: true });
    }
    if (route === 'users/mute' && m === 'POST') {
      const b = await readBody(req, 128), u = S.userById(String(b.uid || '')); if (!u) return fail(res, 404, 'Joueur introuvable.');
      const h = Math.max(0, Math.min(24 * 365, Math.floor(Number(b.hours) || 0))); S.setUser(u.id, { muted_until: h ? now() + h * HOUR : 0 }); S.audit(h ? 'mute' : 'unmute', u.id, h + ' h'); return send(res, 200, { ok: true });
    }
    if (route === 'mails' && m === 'GET') return send(res, 200, { mails: S.mails(80), smtp: mailer.configured(), baseUrl: CFG.baseUrl || null });
    if (route === 'mails/send' && m === 'POST') {
      const b = await readBody(req, 128), row = S.mail(b.id); if (!row) return fail(res, 404, 'Message introuvable.');
      if (!mailer.configured()) return fail(res, 400, 'SMTP non configuré (variables NEV_SMTP_*).');
      if (!CFG.baseUrl) return fail(res, 400, 'Définis NEV_BASE_URL (adresse publique du site) avant d\'envoyer des liens par e-mail.');
      try { await mailer.send({ to: row.to_addr, subject: row.subject, text: row.body }); S.setMail(row.id, 'sent', null); return send(res, 200, { ok: true }); } catch (e) { S.setMail(row.id, 'error', e.message); return fail(res, 502, 'Envoi impossible : ' + e.message); }
    }
    if (route === 'cheat' && m === 'GET') {
      const fl = S.flags(100), by = {}; fl.forEach((f) => { by[f.uid] = (by[f.uid] || 0) + f.severity; });
      return send(res, 200, { flags: fl, total: S.flagCount(), excluded: Object.keys(by).filter(flagged).map((id) => { const u = S.userById(id); return u ? { id, pseudo: u.pseudo } : null; }).filter(Boolean), caps: policy.CAPS });
    }
    if (route === 'reviews' && m === 'GET') return send(res, 200, { reviews: S.reviews() });
    if (route === 'reviews' && m === 'POST') {
      const b = await readBody(req, 1024), id = clean(b.id, 60);
      if (!/^[a-z0-9-]{2,60}$/.test(id) || !['ok', 'adjust', 'no'].includes(b.status)) return fail(res, 400, 'Relecture invalide.');
      S.setReview(id, b.status, clean(b.note, 300), clean(b.reviewer, 40)); S.audit('relecture', id, b.status); return send(res, 200, { ok: true });
    }
    let mm = route.match(/^reviews\/([a-z0-9-]{2,60})$/); if (mm && m === 'DELETE') { S.delReview(mm[1]); return send(res, 200, { ok: true }); }
    return false;
  }

  function maintenance() {
    S.purgeTokens(); S.purgeMails(90 * DAY);
  }

  return { CFG, policy, checkSignup, afterSignup, pubUser, guardPlayer, mergeGifts, chatGate, chatPost, publicRoute, userRoute, adminRoute, maintenance, challengeState, mailer, reviewsMap: () => { const o = {}; S.reviews().forEach((r) => { o[r.id] = r.status; }); return o; } };
};
