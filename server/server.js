/* ==========================================================
   neV.BOOSTER — server/server.js
   Serveur Node.js SANS dépendance (Node 22.13+ pour la base SQLite intégrée). Il fait deux choses :
   1) servir le site (dossier parent) avec des en-têtes de sécurité stricts ;
   2) fournir l'API /api/* : comptes, progression, chat, combos, badges, admin, suivi ;
   3) stocker TOUT dans une vraie base de données SQLite (voir store.js) : nev.db + auth.db.
   Lancer :  NEV_ADMIN_PASSWORD="un-mot-de-passe-long" node server/server.js
   Variables : PORT (8080), HOST (0.0.0.0), NEV_ADMIN_PASSWORD, NEV_SECURE=1 (derrière https),
               NEV_TRUST_PROXY=1 (lit X-Forwarded-For), NEV_DATA (dossier des données).
   ========================================================== */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const store = require('./store');
const mailer = require('./mail');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(process.env.NEV_DATA || path.join(__dirname, 'data'));
const PORT = Number(process.env.PORT || 8080), HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_HOST = (() => { try { return new URL(process.env.NEV_BASE_URL || '').host; } catch (e) { return null; } })(); // adresse publique (ex. site Netlify qui relaie /api vers ce serveur)
const DEFAULT_BASE = 'https://nevbooster.onrender.com', PUBLIC_BASE = (process.env.NEV_BASE_URL || '').replace(/\/+$/, '');
const SECURE = process.env.NEV_SECURE === '1', TRUST_PROXY = process.env.NEV_TRUST_PROXY === '1';
const SESSION_MS = 30 * 86400000, ADMIN_MS = 2 * 3600000;
const STARTED = Date.now();
fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });

/* ---------------- utilitaires ---------------- */
const now = () => Date.now();
const rid = (n) => crypto.randomBytes(n || 9).toString('base64url');
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (s, n) => new Date(Date.parse(s + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const clean = (t, max) => String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const scrypt = (pw, salt) => new Promise((res, rej) => crypto.scrypt(String(pw), salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k.toString('hex')))));
const noProto = (o, depth) => { // retire les clés dangereuses, limite la profondeur
  depth = depth || 0;
  if (depth > 8) return null;
  if (Array.isArray(o)) return o.slice(0, 400).map((x) => noProto(x, depth + 1));
  if (o && typeof o === 'object') { const r = {}; Object.keys(o).slice(0, 200).forEach((k) => { if (k === '__proto__' || k === 'constructor' || k === 'prototype') return; r[k.slice(0, 60)] = noProto(o[k], depth + 1); }); return r; }
  if (typeof o === 'string') return o.slice(0, 600);
  return o;
};

/* ---------------- base de données SQLite (store.js) ---------------- */
const S = store.open(DATA_DIR);
let F; // fonctions « confiance et sécurité » (features.js), initialisées plus bas
if (S.migrateJson(path.join(DATA_DIR, 'db.json'))) console.log('  Ancienne base db.json importée dans SQLite (copie conservée en db.json.migre-…).');
let shuttingDown = false;
const finish = () => { if (shuttingDown) return; shuttingDown = true; S.close(); };
process.on('SIGINT', () => { finish(); process.exit(0); });
process.on('SIGTERM', () => { finish(); process.exit(0); });
process.on('uncaughtException', (e) => { console.error('[erreur]', e && e.message); });
process.on('unhandledRejection', (e) => { console.error('[erreur promesse]', e && e.message); });

/* ---------------- mot de passe admin ---------------- */
async function initAdmin() {
  const env = process.env.NEV_ADMIN_PASSWORD;
  if (env) {
    if (env.length < 10) { console.error('NEV_ADMIN_PASSWORD doit faire au moins 10 caractères.'); process.exit(1); }
    const salt = crypto.randomBytes(16).toString('hex');
    const cur = S.getAdmin();
    if (!cur || cur.fromEnv !== sha(env)) S.setAdmin(salt, await scrypt(env, salt), sha(env));
  } else if (!S.getAdmin()) {
    const pw = crypto.randomBytes(12).toString('base64url'), salt = crypto.randomBytes(16).toString('hex');
    S.setAdmin(salt, await scrypt(pw, salt), null);
    console.log('\n  Mot de passe admin généré (affiché UNE SEULE FOIS, note-le) :  ' + pw + '\n  Pour le choisir toi-même : NEV_ADMIN_PASSWORD="..." node server/server.js\n');
  }
}

/* ---------------- suivi et compteurs ---------------- */
const counters = { requests: 0, api: 0, blocked: 0, errors5xx: 0, badLogins: 0, adminBadLogins: 0 };
const EVENT_TYPES = new Set(['view', 'error', 'login', 'signup', 'gacha', 'session', 'camera']);
function logEvent(type, page, uid, name, data) {
  S.addEvent({ t: now(), type, page: clean(page, 30), uid: uid || null, name: name || null, data: data || {} });
}

/* ---------------- limitation de débit ---------------- */
const buckets = new Map();
function limit(key, max, windowMs) {
  const t = now(); let b = buckets.get(key);
  if (!b || t > b.reset) { b = { n: 0, reset: t + windowMs }; buckets.set(key, b); }
  b.n++;
  return b.n <= max ? 0 : Math.ceil((b.reset - t) / 1000);
}
setInterval(() => { const t = now(); buckets.forEach((b, k) => { if (t > b.reset) buckets.delete(k); }); S.purgeSessions(); }, 60000).unref();

/* ---------------- en-têtes de sécurité ---------------- */
const CSP = ["default-src 'self'", "script-src 'self' 'wasm-unsafe-eval'", "style-src 'self' 'unsafe-inline'", "font-src 'self'", "img-src 'self' data: blob:", "media-src 'self' blob:", "connect-src 'self'", "worker-src 'self' blob:", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"].join('; ');
function secHeaders(res, secure) {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

/* ---------------- requête / réponse ---------------- */
function ipOf(req) {
  if (TRUST_PROXY) { const x = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(); if (x) return x.slice(0, 64); }
  return String(req.socket.remoteAddress || '?').slice(0, 64);
}
const isSecure = (req) => SECURE || (TRUST_PROXY && req.headers['x-forwarded-proto'] === 'https');
function cookies(req) { const o = {}; String(req.headers.cookie || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }); return o; }
function setCookie(res, req, name, val, maxAgeS) {
  const c = name + '=' + val + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + maxAgeS + (isSecure(req) ? '; Secure' : '');
  const prev = res.getHeader('Set-Cookie') || []; res.setHeader('Set-Cookie', [].concat(prev, c));
}
function send(res, code, obj, extra) { const b = JSON.stringify(obj); res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(b) }, extra || {})); res.end(b); }
const fail = (res, code, error, field) => send(res, code, field ? { error, field } : { error });
function readBody(req, max) {
  return new Promise((resolve, reject) => {
    const len = Number(req.headers['content-length'] || 0);
    if (len > max) { reject(Object.assign(new Error('big'), { code: 413 })); return; }
    let size = 0; const parts = [];
    req.on('data', (c) => { size += c.length; if (size > max) { reject(Object.assign(new Error('big'), { code: 413 })); req.destroy(); return; } parts.push(c); });
    req.on('end', () => { if (!size) return resolve({}); try { const j = JSON.parse(Buffer.concat(parts).toString('utf8')); resolve(j && typeof j === 'object' ? noProto(j) : {}); } catch (e) { reject(Object.assign(new Error('json'), { code: 400 })); } });
    req.on('error', reject);
  });
}

/* ---------------- sessions (stockées dans auth.db : elles survivent à un redémarrage) ---------------- */
function startSession(res, req, uid) { const tok = crypto.randomBytes(32).toString('base64url'); S.addSession(tok, uid, 'player', now() + SESSION_MS); setCookie(res, req, 'nev_s', tok, SESSION_MS / 1000); }
function sessionUser(req) {
  const tok = cookies(req).nev_s; if (!tok) return null;
  const s = S.getSession(tok, 'player'); if (!s) return null;
  const u = S.userById(s.uid); return u && !u.banned ? u : null;
}
const isOwner = (req) => { const t = cookies(req).nev_a; return !!(t && S.getSession(t, 'admin')); };   // connecté avec le mot de passe admin
const isAdmin = (req) => { if (isOwner(req)) return true; const u = sessionUser(req); return !!(u && u.isAdmin); }; // ou joueur nommé admin
F = require('./features')({ S, send, fail, readBody, limit, clean, now, rid, scrypt, safeEq, today, addDays, startSession, setCookie, cookies, counters, logEvent, isSecure });
const pub = (u) => F.pubUser(u);

/* ---------------- joueur : nettoyage ---------------- */
const num = (v, lo, hi, d) => { v = Number(v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
function cleanPlayer(p, uid) {
  p = noProto(p) || {};
  const u = S.userById(uid);
  p.maxPushups = p.maxPushups == null ? null : num(p.maxPushups, 0, 200, null);
  p.level = p.level == null ? null : num(p.level, 1, 5, null);
  p.flames = Math.floor(num(p.flames, 0, 1e6, 0)); p.flamesTotal = Math.floor(num(p.flamesTotal, 0, 1e7, 0));
  p.pity = Math.floor(num(p.pity, 0, 50, 0));
  p.progress = p.progress || {};
  ['streak', 'best', 'total', 'xp'].forEach((k) => { p.progress[k] = Math.floor(num(p.progress[k], 0, 1e7, 0)); });
  p.badges = p.badges && typeof p.badges === 'object' && !Array.isArray(p.badges) ? p.badges : {};
  // badges offerts par l'admin : conservés quoi que fasse le client
  const gr = S.adminGrants(uid); Object.keys(gr).forEach((b) => { p.badges[b] = gr[b]; });
  // parrainage : le serveur décide du nombre d'amis et du parrain
  p.ref = p.ref && typeof p.ref === 'object' ? p.ref : {};
  p.ref.count = u ? u.refCount || 0 : 0;
  const parent = u && u.refBy ? S.userById(u.refBy) : null; p.ref.by = parent ? parent.code : null;
  p.ref.paid = Math.min(Math.floor(num(p.ref.paid, 0, 1e5, 0)), p.ref.count);
  p.history = Array.isArray(p.history) ? p.history.slice(0, 160) : [];
  p.updated = now();
  if (JSON.stringify(p).length > 180000) return null;
  return p;
}

/* ---------------- routes publiques ---------------- */
const emailOk = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e) && e.length <= 254;
const codeOf = () => String(crypto.randomInt(0, 10000)).padStart(4, '0'); // code personnel : 4 chiffres (les anciens codes NEVxxxxx restent valables)

async function signup(req, res, ip) {
  const b = await readBody(req, 8192);
  const email = clean(b.email, 254).toLowerCase(), pseudo = clean(b.pseudo, 20), pw = String(b.password || '');
  if (pseudo.length < 2) return fail(res, 400, 'Ton pseudo doit faire entre 2 et 20 caractères.', 'pseudo');
  if (!emailOk(email)) return fail(res, 400, 'Entre une adresse email valide.', 'email');
  if (pw.length < 8 || pw.length > 200) return fail(res, 400, 'Le mot de passe doit faire au moins 8 caractères.', 'password');
  if (!b.consent) return fail(res, 400, 'Coche la case pour confirmer que tu as lu le conseil de sécurité.', 'consent');
  const chk = F.checkSignup(b); if (chk.error) return fail(res, 400, chk.error, chk.field);
  if (b.sex !== 'm' && b.sex !== 'f') return fail(res, 400, 'Choisis ton sexe : masculin ou féminin.', 'sex');
  if (S.userByEmail(email)) return fail(res, 409, 'Un compte existe déjà avec cet email. Connecte-toi.', 'email');
  const ref = clean(b.ref, 12).toUpperCase().replace(/[^A-Z0-9]/g, '');
  let refUser = null;
  if (ref) { refUser = S.userByCode(ref); if (!refUser) return fail(res, 400, 'Ce code de parrainage n\'existe pas (tu peux laisser la case vide).', 'ref'); }
  const id = 'u' + rid(8), salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(pw, salt);
  const user = { id, email, pseudo, created: today(), code: codeOf(id), refCount: 0, banned: false, refBy: refUser ? refUser.id : null, termsAt: now(), termsVer: F.policy.TERMS_VERSION, lang: chk.extra.lang };
  for (let n = 0; S.codeTaken(user.code); n++) user.code = n < 300 ? codeOf() : 'NEV' + rid(4).toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 5); // 4 chiffres tant qu'il en reste
  if (S.userByEmail(email)) return fail(res, 409, 'Un compte existe déjà avec cet email. Connecte-toi.', 'email'); // course entre deux inscriptions
  S.createUser(user, salt, hash);
  let player = null;
  player = { sex: b.sex }; if (refUser) player.ref = { by: ref, count: 0, paid: 0, welcomed: false };
  S.savePlayer(id, Object.assign({ updated: now() }, player));
  logEvent('signup', 'connexion', id, pseudo, { ref: !!refUser });
  await F.afterSignup(req, user).catch((e) => console.error('[inscription]', e && e.message));
  startSession(res, req, id);
  send(res, 200, { user: pub(user), player: player ? Object.assign({ updated: 0 }, player) : null });
}

async function login(req, res, ip) {
  const b = await readBody(req, 4096);
  const email = clean(b.email, 254).toLowerCase(), pw = String(b.password || '').slice(0, 200);
  const wait = limit('lg:' + email, 8, 15 * 60000);
  if (wait) { counters.blocked++; return fail(res, 429, 'Trop d\'essais pour ce compte. Réessaie dans ' + Math.ceil(wait / 60) + ' min.', 'password'); }
  const u = S.userByEmail(email), cred = u ? S.credentials(u.id) : null;
  const h = await scrypt(pw, cred ? cred.salt : '00'.repeat(16)); // même durée que le compte existe ou non
  if (!u || !cred || !safeEq(h, cred.hash)) { counters.badLogins++; return fail(res, 401, 'Email ou mot de passe incorrect.', 'password'); }
  if (u.banned) return fail(res, 403, 'Ce compte est suspendu. Écris-nous pour en savoir plus.', 'email');
  S.touchLogin(u.id); startSession(res, req, u.id); logEvent('login', 'connexion', u.id, u.pseudo, {});
  send(res, 200, { user: pub(u), player: S.getPlayer(u.id) });
}

function chatList(room, user) {
  const key = room === 'coach' ? 'coach:' + user.id : 'global';
  return S.chatList(key, 120).map((m) => ({ id: m.id, uid: m.uid, name: m.name, text: m.text, t: m.t, role: m.role }));
}

async function api(req, res, url, ip) {
  counters.api++;
  const route = url.pathname.slice(5).replace(/\/+$/, ''), m = req.method;
  const wait = limit('api:' + ip, 400, 60000);
  if (wait) { counters.blocked++; return fail(res, 429, 'Trop de requêtes. Patiente un instant.'); }
  if (route === 'health' && m === 'GET') return send(res, 200, { app: 'neV.BOOSTER', ok: true, mode: 'server', time: now(), mail: mailer.configured(), termsVersion: F.policy.TERMS_VERSION });
  if (m !== 'GET' && m !== 'HEAD') {
    if (req.headers['x-nev'] !== '1') return fail(res, 403, 'Requête refusée.');
    const o = req.headers.origin; if (o) { try { if (new URL(o).host !== req.headers.host && new URL(o).host !== PUBLIC_HOST) return fail(res, 403, 'Origine refusée.'); } catch (e) { return fail(res, 403, 'Origine refusée.'); } }
    const ct = String(req.headers['content-type'] || ''); if (Number(req.headers['content-length'] || 0) > 0 && ct.indexOf('application/json') !== 0) return fail(res, 415, 'Format non accepté.');
  }
  if (route.indexOf('admin/') === 0 || route === 'admin') return adminApi(req, res, route.slice(6), ip);

  { const r = await F.publicRoute(route, m, req, res, ip); if (r !== false) return r; }
  if (route === 'signup' && m === 'POST') { const w = limit('su:' + ip, 8, 3600000); if (w) { counters.blocked++; return fail(res, 429, 'Trop d\'inscriptions depuis cette connexion. Réessaie plus tard.'); } return signup(req, res, ip); }
  if (route === 'login' && m === 'POST') { const w = limit('li:' + ip, 20, 10 * 60000); if (w) { counters.blocked++; return fail(res, 429, 'Trop d\'essais. Réessaie dans quelques minutes.', 'password'); } return login(req, res, ip); }
  if (route === 'logout' && m === 'POST') { const t = cookies(req).nev_s; if (t) S.delSession(t); setCookie(res, req, 'nev_s', '', 0); return send(res, 200, { ok: true }); }
  if (route === 'config' && m === 'GET') {
    if (!sessionUser(req)) return fail(res, 401, 'Connecte-toi.');
    return send(res, 200, { combos: S.combos(true), badges: S.badges(), announce: S.meta('announce'), reviews: F.reviewsMap(), challenge: F.challengeState(sessionUser(req)).challenge });
  }
  if (route === 'event' && m === 'POST') {
    const w = limit('ev:' + ip, 60, 60000); if (w) return send(res, 200, { ok: true });
    const b = await readBody(req, 2048); const u = sessionUser(req);
    if (EVENT_TYPES.has(b.type)) {
      const d = {}; const src = b.data && typeof b.data === 'object' ? b.data : {};
      Object.keys(src).slice(0, 6).forEach((k) => { const v = src[k]; if (typeof v === 'number' || typeof v === 'boolean') d[clean(k, 20)] = v; else if (typeof v === 'string') d[clean(k, 20)] = clean(v, 160); });
      logEvent(b.type, b.page, u && u.id, u && u.pseudo, d);
    }
    return send(res, 200, { ok: true });
  }
  const user = sessionUser(req);
  if (!user) return fail(res, 401, 'Connecte-toi.');
  if (route === 'me' && m === 'GET') return send(res, 200, { user: pub(user), player: S.getPlayer(user.id) });
  if (route === 'player' && m === 'PUT') {
    const w = limit('pl:' + user.id, 60, 60000); if (w) return fail(res, 429, 'Trop de sauvegardes.');
    const b = await readBody(req, 200000); const p = cleanPlayer(b.player, user.id);
    if (!p) return fail(res, 400, 'Données invalides.');
    const prevP = S.getPlayer(user.id);
    F.guardPlayer(prevP, p, user.id); // anti-triche : le serveur plafonne XP, séances, série, flammes, dates
    F.mergeGifts(prevP, p);           // cadeaux admin : jamais perdus, jamais inventés
    S.savePlayer(user.id, p); return send(res, 200, { ok: true, updated: p.updated });
  }
  { const r = await F.userRoute(route, m, req, res, ip, url, user); if (r !== false) return r; }
  if (route === 'chat' && m === 'GET') { const room = new URL(req.url, 'http://x').searchParams.get('room') === 'coach' ? 'coach' : 'global'; return send(res, 200, { messages: chatList(room, user), gate: F.chatGate(user, room) }); }
  if (route === 'chat' && m === 'POST') {
    const w = limit('ch:' + user.id, 12, 30000); if (w) return fail(res, 429, 'Doucement : un message à la fois.');
    const b = await readBody(req, 2048), room = b.room === 'coach' ? 'coach' : 'global', c = F.chatPost(user, room, clean(b.text, 280));
    if (!c.ok) return fail(res, c.code, c.error);
    S.addChat({ id: rid(6), room: room === 'coach' ? 'coach:' + user.id : 'global', uid: user.id, name: user.pseudo, text: c.text, t: now(), role: 'player' });
    return send(res, 200, { ok: true });
  }
  return fail(res, 404, 'Introuvable.');
}

/* ---------------- admin ---------------- */
const SHAPES = new Set(['circle', 'shield', 'hex', 'star', 'flame', 'diamond']);
const RULE_T = new Set(['streak', 'total', 'xp', 'loginstreak', 'referrals', 'tier', 'collection', 'doubled', 'verified', 'pushups', 'flames', 'welcomed', 'manual']);
const hex = (c) => (/^#[0-9a-fA-F]{6}$/.test(String(c)) ? String(c) : '#e0455f');
function stats() {
  const n = now(), mem = process.memoryUsage();
  return Object.assign(S.stats(today(), addDays), {
    server: { mode: 'server', db: 'SQLite', uptimeS: Math.round((n - STARTED) / 1000), memMB: Math.round(mem.rss / 1048576), requests: counters.requests, api: counters.api, blocked: counters.blocked, errors5xx: counters.errors5xx, badLogins: counters.badLogins, adminBadLogins: counters.adminBadLogins, node: process.version, sessions: S.countSessions() }
  });
}
function download(res, body, type, filename) {
  const b = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': b.length, 'Content-Disposition': 'attachment; filename="' + filename.replace(/[^A-Za-z0-9._-]/g, '_') + '"', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(b);
}
const stamp = () => new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
async function adminDb(req, res, route, url, ip, m) {
  const q = url.searchParams;
  if (route === 'db/info' && m === 'GET') return send(res, 200, { info: S.info(), tables: S.tables(), descr: S.DESCR });
  if (route === 'db/rows' && m === 'GET') {
    const r = S.rows(String(q.get('table') || ''), { q: q.get('q'), page: q.get('page'), sort: q.get('sort'), dir: q.get('dir') });
    return r ? send(res, 200, r) : fail(res, 404, 'Table inconnue.');
  }
  if (route === 'db/row' && m === 'GET') { const r = S.row(String(q.get('table') || ''), q.get('rowid')); return r ? send(res, 200, { row: r }) : fail(res, 404, 'Ligne introuvable.'); }
  if (route === 'db/delete-row' && m === 'POST') {
    const b = await readBody(req, 512), ok = S.deleteRow(String(b.table || ''), b.rowid);
    if (!ok) return fail(res, 400, 'Suppression impossible pour cette table (utilise « Supprimer le joueur » pour un compte).');
    S.audit('delete-row', b.table + '#' + b.rowid, null); return send(res, 200, { ok: true });
  }
  if (route === 'db/export' && m === 'GET') {
    const t = String(q.get('table') || ''), fmt = q.get('format') === 'csv' ? 'csv' : 'json';
    if (t === 'all') { S.audit('export', 'toutes les tables', 'json'); return download(res, S.exportAll(), 'application/json; charset=utf-8', 'nev-base-' + stamp() + '.json'); }
    const x = S.exportTable(t, fmt); if (!x) return fail(res, 404, 'Table inconnue.');
    S.audit('export', t, fmt); return download(res, x.body, x.type, 'nev-' + t + '-' + stamp() + '.' + x.ext);
  }
  if (route === 'db/backup' && m === 'GET') {
    const tmp = path.join(S.files.backups, 'dl-' + rid(6) + '.tmp'); fs.mkdirSync(S.files.backups, { recursive: true, mode: 0o700 });
    try { await S.backupTo(tmp); const body = fs.readFileSync(tmp); S.audit('backup-download', 'nev.db', body.length + ' octets'); return download(res, body, 'application/octet-stream', 'nev-sauvegarde-' + stamp() + '.db'); }
    finally { fs.rm(tmp, { force: true }, () => {}); }
  }
  if (route === 'db/backup-now' && m === 'POST') { await S.autoBackup(); S.audit('backup-now', 'serveur', null); return send(res, 200, { info: S.info() }); }
  if (route === 'db/check' && m === 'POST') { S.audit('check', 'nev.db', null); return send(res, 200, S.check()); }
  if (route === 'db/query' && m === 'POST') {
    const w = limit('qy:' + ip, 30, 60000); if (w) return fail(res, 429, 'Trop de requêtes SQL. Patiente un instant.');
    const b = await readBody(req, 2048);
    try { const r = S.query(b.sql); S.audit('query', null, String(b.sql).slice(0, 200)); return send(res, 200, r); } catch (e) { return fail(res, 400, e.message); }
  }
  if (route === 'db/user' && m === 'GET') { const r = S.userFile(String(q.get('uid') || '')); return r ? send(res, 200, r) : fail(res, 404, 'Joueur introuvable.'); }
  if (route === 'db/delete-user' && m === 'POST') {
    const b = await readBody(req, 512), u = S.userById(String(b.uid || ''));
    if (!u) return fail(res, 404, 'Joueur introuvable.');
    if (!b.confirm) return fail(res, 400, 'Confirmation requise.');
    S.deleteUser(u.id); S.audit('delete-user', u.id, u.pseudo); return send(res, 200, { ok: true });
  }
  return fail(res, 404, 'Introuvable.');
}
async function adminApi(req, res, route, ip) {
  const m = req.method, url = new URL(req.url, 'http://x');
  if (route === 'state' && m === 'GET') return send(res, 200, { hasPassword: true, authed: isAdmin(req) });
  if (route === 'login' && m === 'POST') {
    const w = limit('al:' + ip, 5, 15 * 60000); if (w) { counters.blocked++; return fail(res, 429, 'Trop d\'essais. Réessaie dans ' + Math.ceil(w / 60) + ' min.'); }
    const b = await readBody(req, 1024), adm = S.getAdmin(), h = await scrypt(String(b.password || '').slice(0, 200), adm.salt);
    if (!safeEq(h, adm.hash)) { counters.adminBadLogins++; logEvent('error', 'admin', null, null, { msg: 'admin login refusé', ip: sha(ip).slice(0, 8) }); S.audit('login-refuse', 'admin', sha(ip).slice(0, 8)); return fail(res, 401, 'Mot de passe refusé.'); }
    const tok = crypto.randomBytes(32).toString('base64url'); S.addSession(tok, 'admin', 'admin', now() + ADMIN_MS); setCookie(res, req, 'nev_a', tok, ADMIN_MS / 1000);
    S.audit('login', 'admin', sha(ip).slice(0, 8));
    return send(res, 200, { ok: true });
  }
  if (!isAdmin(req)) return fail(res, 401, 'Accès réservé.');
  if (route === 'logout' && m === 'POST') { const t = cookies(req).nev_a; if (t) S.delSession(t); setCookie(res, req, 'nev_a', '', 0); return send(res, 200, { ok: true }); }
  const wa = limit('ad:' + ip, 240, 60000); if (wa) return fail(res, 429, 'Trop de requêtes admin. Patiente un instant.');
  if (route.indexOf('db/') === 0) return adminDb(req, res, route, url, ip, m);
  if (route === 'users' && m === 'GET') return send(res, 200, { users: S.userRows() });
  if (route === 'stats' && m === 'GET') return send(res, 200, stats());
  if (route === 'events' && m === 'GET') return send(res, 200, { events: S.events(url.searchParams.get('type') || '', 150) });
  if (route === 'ban' && m === 'POST') { const b = await readBody(req, 512), u = S.userById(String(b.uid)); if (!u) return fail(res, 404, 'Joueur introuvable.'); S.setBanned(u.id, !!b.banned); S.audit(b.banned ? 'ban' : 'unban', u.id, u.pseudo); return send(res, 200, { ok: true }); }
  if (route === 'grant' && m === 'POST') {
    const b = await readBody(req, 512), u = S.userById(String(b.uid)), id = clean(b.badge, 40);
    if (!u || !id) return fail(res, 404, 'Introuvable.');
    S.grantBadge(u.id, id, today()); S.audit('grant', u.id, id); return send(res, 200, { ok: true });
  }
  if (route === 'gift' && m === 'POST') {
    const b = await readBody(req, 512), u = S.userById(String(b.uid || '')); if (!u) return fail(res, 404, 'Joueur introuvable.');
    const fl = Math.floor(Number(b.flames) || 0), dr = Math.floor(Number(b.draws) || 0);
    if (fl < 0 || dr < 0 || fl > 10000 || dr > 50 || fl + dr === 0) return fail(res, 400, 'Cadeau invalide : 1 à 10 000 flammes et/ou 1 à 50 tirages.');
    S.giftPlayer(u.id, { id: rid(5), flames: fl, draws: dr, note: clean(b.note, 80) }); S.audit('cadeau', u.id, '+' + fl + ' flammes, +' + dr + ' tirage(s)'); return send(res, 200, { ok: true });
  }
  if (route === 'role' && m === 'POST') {
    if (!isOwner(req)) return fail(res, 403, 'Seul le propriétaire (connecté avec le mot de passe admin) peut nommer ou retirer un admin.');
    const b = await readBody(req, 256), u = S.userById(String(b.uid || '')); if (!u) return fail(res, 404, 'Joueur introuvable.');
    S.setUser(u.id, { is_admin: b.admin ? 1 : 0 }); S.audit(b.admin ? 'nomme-admin' : 'retire-admin', u.id, u.pseudo); return send(res, 200, { ok: true });
  }
  if (route === 'announce' && m === 'POST') { const b = await readBody(req, 1024), t = clean(b.text, 280); S.setMeta('announce', t ? { text: t, t: now() } : null); S.audit('announce', null, t.slice(0, 80)); return send(res, 200, { ok: true }); }
  if (route === 'combos' && m === 'GET') return send(res, 200, { combos: S.combos(false) });
  if (route === 'combos' && m === 'POST') {
    const b = await readBody(req, 8192), name = clean(b.name, 60);
    const items = Array.isArray(b.items) ? b.items.slice(0, 12).map((x) => [clean(x && x[0], 50), Math.max(1, Math.min(6, Math.round(Number(x && x[1])) || 3))]).filter((x) => /^[a-z0-9-]+$/.test(x[0])) : [];
    if (!name || !items.length) return fail(res, 400, 'Un combo a besoin d\'un nom et d\'au moins un exercice.');
    const id = /^c[A-Za-z0-9_-]{3,20}$/.test(String(b.id || '')) ? b.id : 'c' + rid(6);
    const c = { id, name, blurb: clean(b.blurb, 200), lvl: clean(b.lvl, 20), items, published: !!b.published, updated: now() };
    S.saveCombo(c); return send(res, 200, { combo: c });
  }
  let mm = route.match(/^combos\/([A-Za-z0-9_-]{1,30})$/); if (mm && m === 'DELETE') { S.delCombo(mm[1]); return send(res, 200, { ok: true }); }
  if (route === 'badges' && m === 'GET') return send(res, 200, { badges: S.badges() });
  if (route === 'badges' && m === 'POST') {
    const b = await readBody(req, 4096), name = clean(b.name, 30), rule = b.rule || {};
    if (!name || !RULE_T.has(rule.t)) return fail(res, 400, 'Un badge a besoin d\'un nom et d\'une règle.');
    const id = /^b[A-Za-z0-9_-]{3,20}$/.test(String(b.id || '')) ? b.id : 'b' + rid(6);
    const bd = { id, name, desc: clean(b.desc, 120), shape: SHAPES.has(b.shape) ? b.shape : 'circle', icon: /^[a-z]{0,16}$/.test(String(b.icon || '')) ? String(b.icon || '') : '', text: clean(b.text, 4), c1: hex(b.c1), c2: hex(b.c2), rule: { t: rule.t, v: Math.max(0, Math.min(1e7, Number(rule.v) || 0)) } };
    S.saveBadge(bd); return send(res, 200, { badge: bd });
  }
  mm = route.match(/^badges\/([A-Za-z0-9_-]{1,30})$/); if (mm && m === 'DELETE') { S.delBadge(mm[1]); return send(res, 200, { ok: true }); }
  if (route === 'chat/threads' && m === 'GET') return send(res, 200, { threads: S.chatThreads() });
  { const r = await F.adminRoute(route, m, req, res, ip, url); if (r !== false) return r; }
  if (route === 'chat' && m === 'GET') { const room = String(url.searchParams.get('room') || 'global'); return send(res, 200, { messages: S.chatList(room, 150, true) }); }
  if (route === 'chat' && m === 'POST') { const b = await readBody(req, 2048), text = clean(b.text, 280), room = String(b.room || ''); if (!text || !(room === 'global' || /^coach:u[A-Za-z0-9_-]+$/.test(room))) return fail(res, 400, 'Message invalide.'); S.addChat({ id: rid(6), room, uid: 'admin', name: 'Coach neV', text, t: now(), role: 'admin' }); return send(res, 200, { ok: true }); }
  mm = route.match(/^chat\/([A-Za-z0-9_-]{1,20})$/); if (mm && m === 'DELETE') { S.delChat(mm[1]); return send(res, 200, { ok: true }); }
  return fail(res, 404, 'Introuvable.');
}

/* ---------------- fichiers statiques ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.wasm': 'application/wasm', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.txt': 'text/plain; charset=utf-8', '.tflite': 'application/octet-stream', '.data': 'application/octet-stream', '.binarypb': 'application/octet-stream', '.task': 'application/octet-stream', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };
const HIDDEN = /^(server|_dev|_original|node_modules|package(-lock)?\.json)$/i;
function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
  let rel; try { rel = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel.indexOf('\0') >= 0) { res.writeHead(400); return res.end(); }
  if (rel.endsWith('/')) rel += 'index.html';
  const parts = rel.split('/').filter(Boolean);
  const wk = parts.length === 2 && parts[0] === '.well-known' && parts[1] === 'assetlinks.json'; // seul fichier caché autorisé : lien appli Android (Play Store)
  if (!wk && parts.some((p) => p === '..' || p.charAt(0) === '.' || HIDDEN.test(p))) { res.writeHead(404); return res.end('Introuvable'); }
  let file = path.join(ROOT, ...parts);
  if (file.indexOf(ROOT + path.sep) !== 0 && file !== ROOT) { res.writeHead(404); return res.end('Introuvable'); }
  fs.stat(file, (e, st) => {
    if (!e && st.isDirectory()) { file = path.join(file, 'index.html'); return fs.stat(file, (e2, st2) => (e2 ? notFound(res) : stream(req, res, file, st2))); }
    if (e || !st.isFile()) return notFound(res);
    stream(req, res, file, st);
  });
}
function notFound(res) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Page introuvable'); }
function stream(req, res, file, st) {
  const ext = path.extname(file).toLowerCase(), type = MIME[ext];
  if (!type) return notFound(res); // extension non autorisée
  const long = /\/(vendor|img|fonts)\//.test(file.split(path.sep).join('/'));
  const h = { 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': long ? 'public, max-age=604800' : 'no-cache', 'Last-Modified': st.mtime.toUTCString() };
  const ims = req.headers['if-modified-since']; if (ims && new Date(ims) >= new Date(Math.floor(st.mtimeMs / 1000) * 1000)) { res.writeHead(304); return res.end(); }
  // Aperçu des liens (WhatsApp, Facebook…) : les pages d'entrée portent l'adresse par défaut, remplacée par NEV_BASE_URL si elle est définie.
  if (ext === '.html' && PUBLIC_BASE && PUBLIC_BASE !== DEFAULT_BASE && /(^|[\\/])(index|connexion)\.html$/.test(file)) {
    return fs.readFile(file, 'utf8', (e, txt) => {
      if (e) return notFound(res);
      const body = Buffer.from(txt.split(DEFAULT_BASE).join(PUBLIC_BASE), 'utf8'); h['Content-Length'] = body.length; delete h['Last-Modified']; res.writeHead(200, h); res.end(req.method === 'HEAD' ? undefined : body);
    });
  }
  h['Accept-Ranges'] = 'bytes';
  /* Lecture partielle (Range) : indispensable pour avancer/reculer dans une vidéo ou une voix off, et pour Safari / iPhone. */
  const rg = req.headers.range, rm = rg && /^bytes=(\d*)-(\d*)$/.exec(rg);
  if (rm && (rm[1] !== '' || rm[2] !== '')) {
    let start, end;
    if (rm[1] === '') { start = Math.max(0, st.size - parseInt(rm[2], 10)); end = st.size - 1; } else { start = parseInt(rm[1], 10); end = rm[2] === '' ? st.size - 1 : Math.min(parseInt(rm[2], 10), st.size - 1); }
    if (!(start <= end) || start >= st.size) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); return res.end(); }
    h['Content-Length'] = end - start + 1; h['Content-Range'] = 'bytes ' + start + '-' + end + '/' + st.size; res.writeHead(206, h);
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
  }
  res.writeHead(200, h);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
}

/* ---------------- serveur ---------------- */
const server = http.createServer(async (req, res) => {
  counters.requests++;
  const ip = ipOf(req), sec = isSecure(req);
  secHeaders(res, sec);
  try {
    if (String(req.url).length > 2000) { res.writeHead(414); return res.end(); }
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api' || url.pathname.indexOf('/api/') === 0) return await api(req, res, url, ip);
    const w = limit('st:' + ip, 600, 60000); if (w) { counters.blocked++; res.writeHead(429, { 'Retry-After': w }); return res.end('Trop de requêtes'); }
    return serveStatic(req, res, url);
  } catch (e) {
    if (e && (e.code === 413 || e.code === 400)) return fail(res, e.code, e.code === 413 ? 'Données trop volumineuses.' : 'Requête invalide.');
    counters.errors5xx++; console.error('[500]', req.method, req.url && req.url.slice(0, 80), e && e.message);
    if (!res.headersSent) fail(res, 500, 'Erreur du serveur.'); else res.end();
  }
});
server.headersTimeout = 15000; server.requestTimeout = 30000; server.keepAliveTimeout = 5000; server.maxHeadersCount = 60;
initAdmin().then(() => server.listen(PORT, HOST, () => {
  console.log('neV.BOOSTER : http://localhost:' + PORT + '  (base SQLite : ' + S.files.data + ')');
  const bk = () => S.autoBackup().catch((e) => console.error('[sauvegarde]', e && e.message));
  bk(); setInterval(bk, 6 * 3600000).unref(); // une sauvegarde par jour, 7 conservées
  F.maintenance(); setInterval(F.maintenance, 3600000).unref();
  if (mailer.configured() && !F.CFG.baseUrl) console.log('  ⚠ SMTP réglé mais NEV_BASE_URL absent : aucun e-mail avec lien ne sera envoyé (définis NEV_BASE_URL=https://ton-site).');
  console.log('  E-mails : ' + (mailer.configured() ? 'envoi SMTP actif' : 'SMTP non réglé → les messages restent dans la boîte d\'envoi de l\'admin'));
}));
