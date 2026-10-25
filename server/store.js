/* ==========================================================
   neV.BOOSTER — server/store.js
   La BASE DE DONNÉES du site (SQLite, intégrée à Node : aucune installation).

   Deux fichiers dans le dossier de données :
   • nev.db  — toutes les informations du site : comptes, progression, séances, badges,
               chat, combos, journal de suivi, journal d'audit admin. C'est cette base
               que l'onglet « Base de données » de l'admin affiche, exporte et sauvegarde.
   • auth.db — les SECRETS : mots de passe hachés, sessions, mot de passe admin.
               Fichier séparé : il n'est jamais lisible depuis l'admin (ni console SQL,
               ni export, ni sauvegarde téléchargeable).

   Nécessite Node 22.13 ou plus récent (module intégré node:sqlite).
   ========================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync, backup: sqliteBackup } = require('node:sqlite');

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const now = () => Date.now();
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const b01 = (v) => (v ? 1 : 0);
const nn = (v) => (v === undefined || v === null ? null : v);
const int = (v, d) => { v = Math.floor(Number(v)); return Number.isFinite(v) ? v : d === undefined ? null : d; };

const DESCR = {
  users: 'Comptes : e-mail, pseudo, code de parrainage, parrain, suspension.',
  players: 'Progression de chaque joueur (niveau, XP, séries, flammes) + sauvegarde complète en JSON.',
  workouts: 'Journal permanent de toutes les séances (une ligne par carte jouée).',
  logins: 'Jours de connexion de chaque joueur.',
  badge_grants: 'Badges obtenus (règles) ou offerts par l\'admin.',
  badge_defs: 'Badges créés dans l\'admin.',
  combos: 'Combos d\'exercices composés par le coach.',
  chat_messages: 'Messages du salon public et des conversations privées avec le coach.',
  events: 'Journal de suivi : pages vues, erreurs, connexions, inscriptions.',
  meta: 'Réglages du site (annonce).',
  admin_audit: 'Journal des actions de l\'admin (connexions, exports, suppressions…).',
  consents: 'Preuves de consentement : CGU, confidentialité, accord parental (date, version).',
  outbox: 'Courriels à envoyer ou envoyés (mot de passe oublié, vérification, accord parental).',
  chat_reports: 'Signalements de messages du chat par les joueurs.',
  cheat_flags: 'Anti-triche : séances ou totaux jugés impossibles et corrigés par le serveur.',
  friends: 'Amis suivis pour le classement entre amis.',
  challenge_claims: 'Défis hebdomadaires réclamés (un par joueur et par semaine).',
  exercise_reviews: 'Relecture des exercices par un coach ou un kinésithérapeute.',
  referrals: 'Vue : qui a parrainé qui.',
  v_joueurs: 'Vue : un joueur par ligne avec ses chiffres clés (idéal pour un export).'
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  pseudo TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  ref_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  banned INTEGER NOT NULL DEFAULT 0,
  created TEXT NOT NULL,
  last_login INTEGER
);
CREATE TABLE IF NOT EXISTS players(
  uid TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER, max_pushups INTEGER,
  xp INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, best_streak INTEGER NOT NULL DEFAULT 0,
  sessions_total INTEGER NOT NULL DEFAULT 0, flames INTEGER NOT NULL DEFAULT 0, flames_total INTEGER NOT NULL DEFAULT 0,
  login_streak INTEGER NOT NULL DEFAULT 0, last_done TEXT, last_seen TEXT,
  updated INTEGER NOT NULL, data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS workouts(
  key TEXT PRIMARY KEY,
  uid TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL, exercise_id TEXT, name TEXT, rarity TEXT, tier INTEGER,
  reps INTEGER, sets INTEGER, verified INTEGER, doubled INTEGER, xp_gain INTEGER, source TEXT, special TEXT, rest INTEGER
);
CREATE INDEX IF NOT EXISTS ix_workouts_uid ON workouts(uid, day);
CREATE INDEX IF NOT EXISTS ix_workouts_day ON workouts(day);
CREATE TABLE IF NOT EXISTS logins(
  id INTEGER PRIMARY KEY,
  uid TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  UNIQUE(uid, day)
);
CREATE INDEX IF NOT EXISTS ix_logins_day ON logins(day);
CREATE TABLE IF NOT EXISTS badge_grants(
  id INTEGER PRIMARY KEY,
  uid TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL, day TEXT, source TEXT NOT NULL DEFAULT 'earned',
  UNIQUE(uid, badge_id)
);
CREATE TABLE IF NOT EXISTS badge_defs(
  id TEXT PRIMARY KEY, name TEXT NOT NULL, descr TEXT, shape TEXT, icon TEXT, label TEXT,
  c1 TEXT, c2 TEXT, rule_type TEXT NOT NULL, rule_value REAL NOT NULL DEFAULT 0, created INTEGER
);
CREATE TABLE IF NOT EXISTS combos(
  id TEXT PRIMARY KEY, name TEXT NOT NULL, blurb TEXT, lvl TEXT, published INTEGER NOT NULL DEFAULT 0,
  items TEXT NOT NULL, updated INTEGER
);
CREATE TABLE IF NOT EXISTS chat_messages(
  id TEXT PRIMARY KEY, room TEXT NOT NULL, uid TEXT, name TEXT, text TEXT NOT NULL, t INTEGER NOT NULL, role TEXT
);
CREATE INDEX IF NOT EXISTS ix_chat_room ON chat_messages(room, t);
CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, type TEXT NOT NULL, page TEXT, uid TEXT, name TEXT, data TEXT
);
CREATE INDEX IF NOT EXISTS ix_events_t ON events(t);
CREATE INDEX IF NOT EXISTS ix_events_type ON events(type, t);
CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS admin_audit(
  id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, action TEXT NOT NULL, target TEXT, detail TEXT
);
CREATE VIEW IF NOT EXISTS referrals AS
  SELECT r.id AS referrer_id, r.pseudo AS referrer, u.id AS referee_id, u.pseudo AS referee, u.created AS day
  FROM users u JOIN users r ON r.id = u.ref_by;
CREATE VIEW IF NOT EXISTS v_joueurs AS
  SELECT u.id, u.pseudo, u.email, u.created, u.banned, u.code,
         (SELECT COUNT(*) FROM users f WHERE f.ref_by = u.id) AS amis_parraines,
         p.level AS niveau, p.max_pushups AS max_pompes, p.xp, p.streak AS serie, p.best_streak AS record_serie,
         p.sessions_total AS seances, p.flames AS flammes, p.login_streak AS serie_connexion, p.last_done AS derniere_seance, p.last_seen AS vu_le,
         (SELECT COUNT(*) FROM badge_grants b WHERE b.uid = u.id) AS badges
  FROM users u LEFT JOIN players p ON p.uid = u.id;
`;

const SCHEMA2 = `
CREATE TABLE IF NOT EXISTS consents(
  id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, version TEXT, t INTEGER NOT NULL, detail TEXT
);
CREATE INDEX IF NOT EXISTS ix_consents_uid ON consents(uid);
CREATE TABLE IF NOT EXISTS outbox(
  id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, uid TEXT, kind TEXT NOT NULL, to_addr TEXT NOT NULL,
  subject TEXT NOT NULL, body TEXT NOT NULL, link TEXT, status TEXT NOT NULL DEFAULT 'queued', error TEXT
);
CREATE TABLE IF NOT EXISTS chat_reports(
  id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, msg_id TEXT NOT NULL, room TEXT, author TEXT, text TEXT,
  reporter TEXT NOT NULL, reason TEXT, status TEXT NOT NULL DEFAULT 'open', UNIQUE(msg_id, reporter)
);
CREATE TABLE IF NOT EXISTS cheat_flags(
  id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, uid TEXT NOT NULL, kind TEXT NOT NULL, detail TEXT, severity INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS ix_flags_uid ON cheat_flags(uid, t);
CREATE TABLE IF NOT EXISTS friends(
  uid TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, friend_uid TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  t INTEGER NOT NULL, PRIMARY KEY(uid, friend_uid)
);
CREATE TABLE IF NOT EXISTS challenge_claims(
  uid TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, week TEXT NOT NULL, challenge TEXT NOT NULL, t INTEGER NOT NULL,
  PRIMARY KEY(uid, week)
);
CREATE TABLE IF NOT EXISTS exercise_reviews(
  exercise_id TEXT PRIMARY KEY, status TEXT NOT NULL, note TEXT, reviewer TEXT, t INTEGER NOT NULL
);
`;

const AUTH_SCHEMA = `
CREATE TABLE IF NOT EXISTS credentials(uid TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, uid TEXT NOT NULL, kind TEXT NOT NULL, exp INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS ix_sessions_uid ON sessions(uid);
CREATE TABLE IF NOT EXISTS admin(id INTEGER PRIMARY KEY CHECK(id = 1), salt TEXT NOT NULL, hash TEXT NOT NULL, from_env TEXT);
CREATE TABLE IF NOT EXISTS tokens(token_hash TEXT PRIMARY KEY, uid TEXT NOT NULL, kind TEXT NOT NULL, exp INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0, data TEXT);
CREATE INDEX IF NOT EXISTS ix_tokens_uid ON tokens(uid, kind);
`;

function open(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const DATA_FILE = path.join(dir, 'nev.db'), AUTH_FILE = path.join(dir, 'auth.db'), BK_DIR = path.join(dir, 'backups');
  const db = new DatabaseSync(DATA_FILE), auth = new DatabaseSync(AUTH_FILE);
  [db, auth].forEach((d) => { d.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=4000;'); });
  // Le site n'utilise plus l'âge : on retire l'ancienne colonne des bases existantes (les vues sont recréées juste après).
  try {
    if (db.prepare("SELECT 1 AS x FROM sqlite_master WHERE type='table' AND name='users'").get() && db.prepare('PRAGMA table_info(users)').all().some((c) => c.name === 'age')) {
      db.exec('DROP VIEW IF EXISTS v_joueurs; DROP VIEW IF EXISTS referrals; ALTER TABLE users DROP COLUMN age;');
    }
  } catch (e) { console.error('[base] retrait de la colonne age impossible :', e.message); }
  db.exec(SCHEMA); auth.exec(AUTH_SCHEMA);
  // colonnes ajoutées après la première version : ajoutées sans toucher aux données existantes
  const addCol = (table, col, ddl) => { if (!db.prepare('PRAGMA table_info(' + table + ')').all().some((c) => c.name === col)) db.exec('ALTER TABLE ' + table + ' ADD COLUMN ' + col + ' ' + ddl); };
  addCol('users', 'email_verified', 'INTEGER NOT NULL DEFAULT 0');
  addCol('users', 'terms_at', 'INTEGER');
  addCol('users', 'terms_ver', 'TEXT');
  addCol('users', 'muted_until', 'INTEGER NOT NULL DEFAULT 0');
  addCol('users', 'lang', "TEXT NOT NULL DEFAULT 'fr'");
  addCol('users', 'created_ms', 'INTEGER NOT NULL DEFAULT 0');
  addCol('users', 'public_board', 'INTEGER NOT NULL DEFAULT 0');
  addCol('users', 'is_admin', 'INTEGER NOT NULL DEFAULT 0');
  addCol('chat_messages', 'hidden', 'INTEGER NOT NULL DEFAULT 0');
  db.exec(SCHEMA2);
  [DATA_FILE, AUTH_FILE].forEach((f) => { try { fs.chmodSync(f, 0o600); } catch (e) { /* ignoré */ } });

  const cache = new Map();
  const P = (d, sql) => { const k = (d === db ? 'd:' : 'a:') + sql; let s = cache.get(k); if (!s) { s = d.prepare(sql); cache.set(k, s); } return s; };
  const D = (sql, ...a) => P(db, sql).all(...a);
  const D1 = (sql, ...a) => P(db, sql).get(...a);
  const DR = (sql, ...a) => P(db, sql).run(...a);
  const A1 = (sql, ...a) => P(auth, sql).get(...a);
  const AR = (sql, ...a) => P(auth, sql).run(...a);
  let depth = 0; // transactions imbriquées : seule la plus externe ouvre/ferme
  function tx(fn) {
    if (depth) return fn();
    db.exec('BEGIN IMMEDIATE'); depth = 1;
    try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { try { db.exec('ROLLBACK'); } catch (e2) { /* ignoré */ } throw e; } finally { depth = 0; }
  }

  const S = { DESCR, files: { data: DATA_FILE, auth: AUTH_FILE, backups: BK_DIR } };

  /* ---------------- comptes ---------------- */
  const userOut = (r) => (r ? { id: r.id, email: r.email, pseudo: r.pseudo, created: r.created, createdMs: r.created_ms || 0, code: r.code, banned: !!r.banned, refBy: r.ref_by || null, refCount: r.refCount || 0,
    verified: !!r.email_verified, termsAt: r.terms_at || null, termsVer: r.terms_ver || null, mutedUntil: r.muted_until || 0, lang: r.lang || 'fr', publicBoard: !!r.public_board, isAdmin: !!r.is_admin } : null);
  const USEL = 'SELECT u.*, (SELECT COUNT(*) FROM users f WHERE f.ref_by = u.id) AS refCount FROM users u';
  S.userById = (id) => userOut(D1(USEL + ' WHERE u.id = ?', String(id)));
  S.userByEmail = (e) => userOut(D1(USEL + ' WHERE u.email = ?', String(e)));
  S.userByCode = (c) => userOut(D1(USEL + ' WHERE u.code = ?', String(c)));
  S.codeTaken = (c) => !!D1('SELECT 1 AS x FROM users WHERE code = ?', c);
  S.createUser = (u, salt, hash) => tx(() => {
    DR('INSERT INTO users(id,email,pseudo,code,ref_by,banned,created,last_login,created_ms,terms_at,terms_ver,lang) VALUES(?,?,?,?,?,0,?,?,?,?,?,?)', u.id, u.email, u.pseudo, u.code, nn(u.refBy), u.created, now(), now(), nn(u.termsAt), nn(u.termsVer), u.lang || 'fr');
    AR('INSERT OR REPLACE INTO credentials(uid,salt,hash) VALUES(?,?,?)', u.id, salt, hash);
  });
  S.credentials = (uid) => A1('SELECT salt, hash FROM credentials WHERE uid = ?', String(uid)) || null;
  S.touchLogin = (uid) => DR('UPDATE users SET last_login = ? WHERE id = ?', now(), uid);
  S.setBanned = (uid, flag) => { DR('UPDATE users SET banned = ? WHERE id = ?', b01(flag), uid); if (flag) AR("DELETE FROM sessions WHERE uid = ? AND kind = 'player'", uid); };
  S.countUsers = () => D1('SELECT COUNT(*) AS n FROM users').n;

  /* ---------------- sessions (dans auth.db : elles survivent à un redémarrage) ---------------- */
  S.addSession = (tok, uid, kind, exp) => AR('INSERT OR REPLACE INTO sessions(token_hash,uid,kind,exp) VALUES(?,?,?,?)', sha(tok), uid, kind, exp);
  S.getSession = (tok, kind) => { const s = A1('SELECT uid, exp FROM sessions WHERE token_hash = ? AND kind = ?', sha(tok), kind); return s && s.exp > now() ? s : null; };
  S.delSession = (tok) => AR('DELETE FROM sessions WHERE token_hash = ?', sha(tok));
  S.purgeSessions = () => AR('DELETE FROM sessions WHERE exp < ?', now());
  S.countSessions = () => A1("SELECT COUNT(*) AS n FROM sessions WHERE kind = 'player' AND exp > ?", now()).n;

  /* ---------------- administrateur ---------------- */
  S.getAdmin = () => A1('SELECT salt, hash, from_env AS fromEnv FROM admin WHERE id = 1') || null;
  S.setAdmin = (salt, hash, fromEnv) => AR('INSERT OR REPLACE INTO admin(id,salt,hash,from_env) VALUES(1,?,?,?)', salt, hash, nn(fromEnv));

  /* ---------------- joueur (progression) ---------------- */
  S.getPlayer = (uid) => { const r = D1('SELECT data FROM players WHERE uid = ?', String(uid)); if (!r) return null; try { return JSON.parse(r.data); } catch (e) { return null; } };
  /* Cadeau admin : écrit directement dans la fiche du joueur (flammes, tirages bonus) + notification. */
  S.giftPlayer = (uid, g) => {
    const p = S.getPlayer(uid) || {};
    const fl = Math.max(0, Math.floor(g.flames || 0)), dr = Math.max(0, Math.floor(g.draws || 0));
    p.flames = (p.flames || 0) + fl; p.flamesTotal = (p.flamesTotal || 0) + fl; p.bonusDraws = Math.min(500, (p.bonusDraws || 0) + dr);
    p.gifts = (Array.isArray(p.gifts) ? p.gifts : []).slice(-29); p.gifts.push({ id: g.id, flames: fl, draws: dr, note: g.note || '', t: now(), seen: false });
    p.updated = now(); S.savePlayer(uid, p); return p;
  };
  S.adminGrants = (uid) => { const o = {}; D("SELECT badge_id, day FROM badge_grants WHERE uid = ? AND source = 'admin'", uid).forEach((r) => { o[r.badge_id] = r.day; }); return o; };
  const hkey = (uid, h, n) => crypto.createHash('sha1').update([uid, h.date, h.id, h.reps, h.sets, h.xpGain, h.src, n].join('|')).digest('hex').slice(0, 24);
  function syncDerived(uid, p) {
    // séances : journal permanent (INSERT OR IGNORE → aucun doublon, l'historique complet reste même si le joueur n'en garde que 160)
    const seen = {};
    (Array.isArray(p.history) ? p.history.slice().reverse() : []).forEach((h) => {
      if (!h || !DAY_RE.test(String(h.date))) return;
      const sig = [h.date, h.id, h.reps, h.sets, h.xpGain, h.src].join('|'); seen[sig] = (seen[sig] || 0) + 1;
      DR('INSERT OR IGNORE INTO workouts(key,uid,day,exercise_id,name,rarity,tier,reps,sets,verified,doubled,xp_gain,source,special,rest) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        hkey(uid, h, seen[sig]), uid, h.date, String(h.id || '').slice(0, 60), String(h.name || '').slice(0, 80), String(h.rarity || '').slice(0, 20), int(h.tier, 0), int(h.reps, 0), int(h.sets, 0), b01(h.verified), b01(h.doubled), int(h.xpGain, 0), String(h.src || '').slice(0, 20), h.special ? String(h.special).slice(0, 20) : null, b01(h.rest));
    });
    const days = p.login && Array.isArray(p.login.days) ? p.login.days : [];
    days.forEach((d) => { if (DAY_RE.test(String(d))) DR('INSERT OR IGNORE INTO logins(uid,day) VALUES(?,?)', uid, d); });
    Object.keys(p.badges || {}).forEach((b) => { DR("INSERT OR IGNORE INTO badge_grants(uid,badge_id,day,source) VALUES(?,?,?,'earned')", uid, String(b).slice(0, 40), DAY_RE.test(String(p.badges[b])) ? p.badges[b] : null); });
  }
  S.savePlayer = (uid, p) => tx(() => {
    const pr = p.progress || {}, lg = p.login || {};
    DR(`INSERT INTO players(uid,level,max_pushups,xp,streak,best_streak,sessions_total,flames,flames_total,login_streak,last_done,last_seen,updated,data)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(uid) DO UPDATE SET level=excluded.level,max_pushups=excluded.max_pushups,xp=excluded.xp,streak=excluded.streak,best_streak=excluded.best_streak,
          sessions_total=excluded.sessions_total,flames=excluded.flames,flames_total=excluded.flames_total,login_streak=excluded.login_streak,
          last_done=excluded.last_done,last_seen=excluded.last_seen,updated=excluded.updated,data=excluded.data`,
      uid, nn(p.level), nn(p.maxPushups), int(pr.xp, 0), int(pr.streak, 0), int(pr.best, 0), int(pr.total, 0), int(p.flames, 0), int(p.flamesTotal, 0), int(lg.streak, 0),
      DAY_RE.test(String(pr.lastDone)) ? pr.lastDone : null, DAY_RE.test(String(lg.last)) ? lg.last : null, int(p.updated, now()), JSON.stringify(p));
    syncDerived(uid, p);
  });
  S.grantBadge = (uid, badge, day) => tx(() => {
    DR("INSERT INTO badge_grants(uid,badge_id,day,source) VALUES(?,?,?,'admin') ON CONFLICT(uid,badge_id) DO UPDATE SET source='admin', day=excluded.day", uid, badge, day);
    const p = S.getPlayer(uid) || {}; p.badges = p.badges || {}; p.badges[badge] = day; p.updated = now();
    DR(`INSERT INTO players(uid,updated,data) VALUES(?,?,?) ON CONFLICT(uid) DO UPDATE SET updated=excluded.updated, data=excluded.data`, uid, p.updated, JSON.stringify(p));
  });

  /* ---------------- chat ---------------- */
  S.addChat = (m) => { DR('INSERT INTO chat_messages(id,room,uid,name,text,t,role) VALUES(?,?,?,?,?,?,?)', m.id, m.room, m.uid, m.name, m.text, m.t, m.role); DR("DELETE FROM chat_messages WHERE id IN (SELECT id FROM chat_messages WHERE room = 'global' ORDER BY t DESC LIMIT -1 OFFSET 2500)"); };
  S.chatList = (room, limit, withHidden) => D('SELECT id, room, uid, name, text, t, role, hidden FROM (SELECT * FROM chat_messages WHERE room = ?' + (withHidden ? '' : ' AND hidden = 0') + ' ORDER BY t DESC LIMIT ?) ORDER BY t ASC', room, limit || 120);
  S.chatMsg = (id) => D1('SELECT id, room, uid, name, text, t, role, hidden FROM chat_messages WHERE id = ?', String(id)) || null;
  S.chatCountSince = (uid, since) => D1("SELECT COUNT(*) AS n FROM chat_messages WHERE uid = ? AND t > ? AND role = 'player'", uid, since).n;
  S.hideChat = (id, flag) => DR('UPDATE chat_messages SET hidden = ? WHERE id = ?', b01(flag), String(id)).changes > 0;
  S.chatThreads = () => D(`SELECT c.room, c.name, c.text AS last, c.t, c.role FROM chat_messages c
      JOIN (SELECT room, MAX(t) AS mt FROM chat_messages WHERE room LIKE 'coach:%' GROUP BY room) m ON m.room = c.room AND m.mt = c.t
      ORDER BY c.t DESC`).map((r) => { const uid = r.room.slice(6), u = S.userById(uid); return { uid, name: u ? u.pseudo : r.name, last: r.last, t: r.t, fromPlayer: r.role === 'player' }; });
  S.delChat = (id) => DR('DELETE FROM chat_messages WHERE id = ?', id);

  /* ---------------- combos et badges ---------------- */
  const comboOut = (r) => ({ id: r.id, name: r.name, blurb: r.blurb, lvl: r.lvl, items: JSON.parse(r.items), published: !!r.published, updated: r.updated });
  S.combos = (onlyPublished) => D('SELECT * FROM combos' + (onlyPublished ? ' WHERE published = 1' : '') + ' ORDER BY updated DESC LIMIT 200').map(comboOut);
  S.saveCombo = (c) => { DR('INSERT INTO combos(id,name,blurb,lvl,published,items,updated) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,blurb=excluded.blurb,lvl=excluded.lvl,published=excluded.published,items=excluded.items,updated=excluded.updated', c.id, c.name, c.blurb, c.lvl, b01(c.published), JSON.stringify(c.items), c.updated); return c; };
  S.delCombo = (id) => DR('DELETE FROM combos WHERE id = ?', id);
  const badgeOut = (r) => ({ id: r.id, name: r.name, desc: r.descr, shape: r.shape, icon: r.icon, text: r.label, c1: r.c1, c2: r.c2, rule: { t: r.rule_type, v: r.rule_value } });
  S.badges = () => D('SELECT * FROM badge_defs ORDER BY created ASC, rowid ASC LIMIT 120').map(badgeOut);
  S.saveBadge = (b) => { DR('INSERT INTO badge_defs(id,name,descr,shape,icon,label,c1,c2,rule_type,rule_value,created) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,descr=excluded.descr,shape=excluded.shape,icon=excluded.icon,label=excluded.label,c1=excluded.c1,c2=excluded.c2,rule_type=excluded.rule_type,rule_value=excluded.rule_value', b.id, b.name, b.desc, b.shape, b.icon, b.text, b.c1, b.c2, b.rule.t, b.rule.v, now()); return b; };
  S.delBadge = (id) => DR('DELETE FROM badge_defs WHERE id = ?', id);

  /* ---------------- réglages ---------------- */
  S.meta = (k) => { const r = D1('SELECT value FROM meta WHERE key = ?', k); if (!r) return null; try { return JSON.parse(r.value); } catch (e) { return null; } };
  S.setMeta = (k, v) => { if (v == null) DR('DELETE FROM meta WHERE key = ?', k); else DR('INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)', k, JSON.stringify(v)); };

  /* ---------------- événements et audit ---------------- */
  let evN = 0;
  S.addEvent = (e) => { DR('INSERT INTO events(t,type,page,uid,name,data) VALUES(?,?,?,?,?,?)', e.t, e.type, e.page, nn(e.uid), nn(e.name), JSON.stringify(e.data || {})); if (++evN % 200 === 0) DR('DELETE FROM events WHERE id <= (SELECT MAX(id) FROM events) - 20000'); };
  S.events = (type, limit) => D('SELECT t, type, page, uid, name, data FROM events' + (type ? ' WHERE type = ?' : '') + ' ORDER BY id DESC LIMIT ?', ...(type ? [type, limit || 150] : [limit || 150])).map((r) => { let d = {}; try { d = JSON.parse(r.data); } catch (e) { /* ignoré */ } return { t: r.t, type: r.type, page: r.page, uid: r.uid, name: r.name, data: d }; });
  S.countEvents = (type, since) => D1('SELECT COUNT(*) AS n FROM events WHERE type = ? AND t > ?', type, since).n;
  S.audit = (action, target, detail) => DR('INSERT INTO admin_audit(t,action,target,detail) VALUES(?,?,?,?)', now(), String(action).slice(0, 40), target == null ? null : String(target).slice(0, 80), detail == null ? null : String(detail).slice(0, 300));

  /* ---------------- vues admin : joueurs et statistiques ---------------- */
  S.userRows = () => D(`SELECT u.id, u.email, u.pseudo, u.created, u.banned, u.code, u.last_login AS lastLogin,
        (SELECT COUNT(*) FROM users f WHERE f.ref_by = u.id) AS refCount,
        p.level, p.max_pushups AS maxPushups, p.streak, p.best_streak AS best, p.sessions_total AS total, p.xp, p.flames, p.login_streak AS loginStreak,
        p.last_done AS lastDone, p.last_seen AS lastSeen, u.email_verified AS verified, u.muted_until AS mutedUntil, u.lang, u.is_admin AS isAdm
      FROM users u LEFT JOIN players p ON p.uid = u.id ORDER BY u.created DESC, u.rowid DESC`).map((r) => ({
    id: r.id, email: r.email, pseudo: r.pseudo, created: r.created, banned: !!r.banned, code: r.code, refCount: r.refCount,
    level: r.level, maxPushups: r.maxPushups, streak: r.streak || 0, best: r.best || 0, total: r.total || 0, xp: r.xp || 0, flames: r.flames || 0,
    loginStreak: r.loginStreak || 0, lastDone: r.lastDone, lastSeen: r.lastSeen, verified: !!r.verified, muted: (r.mutedUntil || 0) > now(), lang: r.lang, admin: !!r.isAdm,
    badges: D('SELECT badge_id FROM badge_grants WHERE uid = ?', r.id).map((b) => b.badge_id)
  }));
  S.stats = (today, addDays) => {
    const days = []; for (let i = 6; i >= 0; i--) days.push(addDays(today, -i));
    const sess = days.map((d) => D1('SELECT COUNT(*) AS n FROM workouts WHERE day = ?', d).n);
    const active = days.map((d) => D1('SELECT COUNT(*) AS n FROM (SELECT uid FROM workouts WHERE day = ? UNION SELECT uid FROM logins WHERE day = ?)', d, d).n);
    const lv = [0, 0, 0, 0, 0]; D('SELECT level, COUNT(*) AS n FROM players WHERE level BETWEEN 1 AND 5 GROUP BY level').forEach((r) => { lv[r.level - 1] = r.n; });
    const rar = [0, 0, 0, 0, 0]; D('SELECT tier, COUNT(*) AS n FROM workouts WHERE tier BETWEEN 1 AND 5 GROUP BY tier').forEach((r) => { rar[r.tier - 1] = r.n; });
    const tw = D1('SELECT COUNT(*) AS n, COALESCE(SUM(verified),0) AS v, COALESCE(SUM(doubled),0) AS d FROM workouts');
    const pl = D1('SELECT COALESCE(AVG(streak),0) AS a, COALESCE(MAX(best_streak),0) AS b, COALESCE(SUM(flames),0) AS f FROM players');
    const day = 86400000, n = now();
    return {
      players: S.countUsers(), newToday: D1('SELECT COUNT(*) AS n FROM users WHERE created = ?', today).n, active, sessions: sess, days,
      avgStreak: Math.round(10 * pl.a) / 10, bestStreak: pl.b, levels: lv, rarity: rar,
      topExercises: D("SELECT exercise_id AS id, COUNT(*) AS n FROM workouts WHERE exercise_id <> '' GROUP BY exercise_id ORDER BY n DESC LIMIT 8"),
      verifiedPct: tw.n ? Math.round(100 * tw.v / tw.n) : 0, sessionsTotal: tw.n, doubled: tw.d, flames: pl.f,
      referrals: D1('SELECT COUNT(*) AS n FROM users WHERE ref_by IS NOT NULL').n,
      errors24h: S.countEvents('error', n - day), views24h: S.countEvents('view', n - day)
    };
  };

  /* ---------------- base de données : outils admin ---------------- */
  const objects = () => D("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY type DESC, name");
  const colsOf = (name) => D('PRAGMA table_info("' + name.replace(/"/g, '') + '")').map((c) => ({ name: c.name, type: c.type, pk: !!c.pk, notnull: !!c.notnull }));
  const isObject = (name) => objects().some((o) => o.name === name);
  S.tables = () => objects().map((o) => ({ name: o.name, kind: o.type, rows: D1('SELECT COUNT(*) AS n FROM "' + o.name + '"').n, columns: colsOf(o.name), descr: DESCR[o.name] || '' }));
  S.info = () => {
    const sz = (f) => { try { return fs.statSync(f).size; } catch (e) { return 0; } };
    let backups = []; try { backups = fs.readdirSync(BK_DIR).filter((f) => /^nev-.*\.db$/.test(f)).sort().reverse().map((f) => ({ name: f, size: sz(path.join(BK_DIR, f)) })); } catch (e) { /* aucun */ }
    return { engine: 'SQLite ' + D1('SELECT sqlite_version() AS v').v, sizeBytes: sz(DATA_FILE) + sz(DATA_FILE + '-wal'), journal: D1('PRAGMA journal_mode').journal_mode, tables: objects().filter((o) => o.type === 'table').length, backups: backups.slice(0, 10), authSeparate: true };
  };
  S.check = () => ({ integrity: D('PRAGMA integrity_check').map((r) => r.integrity_check).join(', '), foreignKeys: D('PRAGMA foreign_key_check').length });
  const clip = (v) => (typeof v === 'string' && v.length > 240 ? v.slice(0, 240) + '…' : v);
  S.rows = (table, o) => {
    if (!isObject(table)) return null;
    const cols = colsOf(table), names = cols.map((c) => c.name), page = Math.max(1, int(o.page, 1)), size = 40;
    const isTable = objects().find((x) => x.name === table).type === 'table';
    const q = String(o.q || '').slice(0, 80), args = []; let where = '';
    if (q) { const like = '%' + q.replace(/[\\%_]/g, (m) => '\\' + m) + '%'; where = ' WHERE ' + names.map((n) => { args.push(like); return 'CAST("' + n + '" AS TEXT) LIKE ? ESCAPE \'\\\''; }).join(' OR '); }
    const sort = names.includes(o.sort) ? ' ORDER BY "' + o.sort + '" ' + (o.dir === 'asc' ? 'ASC' : 'DESC') : (isTable ? ' ORDER BY rowid DESC' : '');
    const total = D1('SELECT COUNT(*) AS n FROM "' + table + '"' + where, ...args).n;
    const rows = D('SELECT ' + (isTable ? 'rowid AS _rowid, ' : '') + '* FROM "' + table + '"' + where + sort + ' LIMIT ' + size + ' OFFSET ' + (page - 1) * size, ...args);
    return { table, columns: cols, rows: rows.map((r) => { const x = {}; Object.keys(r).forEach((k) => { x[k] = clip(r[k]); }); return x; }), total, page, pages: Math.max(1, Math.ceil(total / size)), editableDelete: isTable };
  };
  S.row = (table, rowid) => { if (!isObject(table)) return null; return D1('SELECT * FROM "' + table + '" WHERE rowid = ?', int(rowid, -1)) || null; };
  S.deleteRow = (table, rowid) => { // suppression ciblée d'une ligne (chat, événements, séances…) — jamais pour users/players (utiliser « supprimer le joueur »)
    if (!['chat_messages', 'events', 'workouts', 'logins', 'badge_grants', 'combos', 'badge_defs', 'admin_audit', 'outbox', 'chat_reports', 'cheat_flags'].includes(table)) return false;
    return DR('DELETE FROM "' + table + '" WHERE rowid = ?', int(rowid, -1)).changes > 0;
  };
  const parseCols = { players: ['data'], events: ['data'], combos: ['items'], meta: ['value'] };
  const csvCell = (v) => { if (v === null || v === undefined) return ''; let s = String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  S.exportTable = (table, format) => {
    if (!isObject(table)) return null;
    const rows = D('SELECT * FROM "' + table + '"'), cols = colsOf(table).map((c) => c.name);
    if (format === 'csv') return { type: 'text/csv; charset=utf-8', ext: 'csv', body: '﻿' + [cols.map(csvCell).join(',')].concat(rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))).join('\r\n') };
    const pc = parseCols[table] || [];
    return { type: 'application/json; charset=utf-8', ext: 'json', body: JSON.stringify(rows.map((r) => { const x = Object.assign({}, r); pc.forEach((c) => { try { x[c] = JSON.parse(x[c]); } catch (e) { /* texte */ } }); return x; }), null, 1) };
  };
  S.exportAll = () => {
    const out = { app: 'neV.BOOSTER', exported: new Date().toISOString(), note: 'Les mots de passe et sessions ne sont jamais exportés (fichier auth.db séparé).', tables: {} };
    objects().filter((o) => o.type === 'table').forEach((o) => { out.tables[o.name] = JSON.parse(S.exportTable(o.name, 'json').body); });
    return JSON.stringify(out, null, 1);
  };
  S.backupTo = async (file) => { await sqliteBackup(db, file); try { fs.chmodSync(file, 0o600); } catch (e) { /* ignoré */ } return file; };
  S.autoBackup = async () => { // une sauvegarde par jour, on garde les 7 dernières
    fs.mkdirSync(BK_DIR, { recursive: true, mode: 0o700 });
    const f = path.join(BK_DIR, 'nev-' + new Date().toISOString().slice(0, 10) + '.db');
    if (!fs.existsSync(f)) await S.backupTo(f);
    fs.readdirSync(BK_DIR).filter((x) => /^nev-.*\.db$/.test(x)).sort().reverse().slice(7).forEach((x) => { try { fs.unlinkSync(path.join(BK_DIR, x)); } catch (e) { /* ignoré */ } });
  };
  // console SQL : lecture seule, connexion séparée, uniquement nev.db (auth.db est inaccessible)
  let ro = null;
  S.query = (sql) => {
    sql = String(sql || '').trim().replace(/;+\s*$/, '');
    if (!sql) throw new Error('Écris une requête SELECT.');
    if (sql.length > 800) throw new Error('Requête trop longue (800 caractères max).');
    if (sql.indexOf(';') >= 0) throw new Error('Une seule requête à la fois.');
    if (!/^(select|with)\b/i.test(sql)) throw new Error('Seules les requêtes de lecture (SELECT) sont autorisées.');
    const bad = sql.match(/\b(recursive|pragma|attach|detach|load_extension|randomblob|zeroblob|vacuum|insert|update|delete|drop|create|alter)\b/i);
    if (bad) throw new Error('Mot interdit dans la console : ' + bad[0].toUpperCase() + ' (lecture seule).');
    if (!ro) ro = new DatabaseSync(DATA_FILE, { readOnly: true });
    const t0 = Date.now();
    let rows; try { rows = ro.prepare('SELECT * FROM (' + sql + ') LIMIT 501').all(); } catch (e) { let msg = String(e.message), mt;
      if ((mt = msg.match(/no such table: (.+)/))) msg = 'Table inconnue : ' + mt[1] + ' (voir la liste des tables à droite).';
      else if ((mt = msg.match(/no such column: (.+)/))) msg = 'Colonne inconnue : ' + mt[1] + '.';
      else if (/syntax error/.test(msg)) msg = 'Erreur de syntaxe SQL (' + msg.slice(0, 120) + ').';
      else msg = msg.slice(0, 200);
      throw new Error(msg);
    }
    const cols = rows.length ? Object.keys(rows[0]) : [];
    return { columns: cols, rows: rows.slice(0, 500).map((r) => { const x = {}; cols.forEach((c) => { x[c] = clip(r[c] instanceof Uint8Array ? '[binaire]' : r[c]); }); return x; }), truncated: rows.length > 500, ms: Date.now() - t0 };
  };
  S.userFile = (uid) => {
    const u = D1('SELECT * FROM users WHERE id = ?', String(uid)); if (!u) return null;
    const pl = D1('SELECT * FROM players WHERE uid = ?', u.id); let data = null; if (pl) { try { data = JSON.parse(pl.data); } catch (e) { /* ignoré */ } }
    return {
      user: { id: u.id, email: u.email, pseudo: u.pseudo, code: u.code, created: u.created, banned: !!u.banned, refBy: u.ref_by, lastLogin: u.last_login, emailVerified: !!u.email_verified, termsAccepted: u.terms_at, termsVersion: u.terms_ver, lang: u.lang },
      consents: D('SELECT kind, version, t, detail FROM consents WHERE uid = ? ORDER BY t DESC', u.id),
      friends: D('SELECT friend_uid AS id FROM friends WHERE uid = ?', u.id).map((f) => f.id),
      cheatFlags: D('SELECT t, kind, detail FROM cheat_flags WHERE uid = ? ORDER BY t DESC LIMIT 20', u.id),
      stats: pl ? { level: pl.level, maxPushups: pl.max_pushups, xp: pl.xp, streak: pl.streak, best: pl.best_streak, total: pl.sessions_total, flames: pl.flames, flamesTotal: pl.flames_total, loginStreak: pl.login_streak, lastDone: pl.last_done, lastSeen: pl.last_seen, updated: pl.updated } : null,
      referrals: D('SELECT referee_id AS id, referee AS pseudo, day FROM referrals WHERE referrer_id = ?', u.id),
      referredBy: u.ref_by ? (D1('SELECT pseudo FROM users WHERE id = ?', u.ref_by) || {}).pseudo || null : null,
      badges: D('SELECT badge_id AS id, day, source FROM badge_grants WHERE uid = ? ORDER BY day DESC', u.id),
      workouts: D('SELECT day, name, rarity, reps, sets, verified, doubled, xp_gain AS xp, source FROM workouts WHERE uid = ? ORDER BY day DESC, rowid DESC LIMIT 100', u.id),
      workoutCount: D1('SELECT COUNT(*) AS n FROM workouts WHERE uid = ?', u.id).n,
      loginDays: D('SELECT day FROM logins WHERE uid = ? ORDER BY day DESC LIMIT 60', u.id).map((r) => r.day),
      messages: D('SELECT room, text, t FROM chat_messages WHERE uid = ? ORDER BY t DESC LIMIT 20', u.id),
      setup: data && data.setup ? data.setup : null
    };
  };
  S.deleteUser = (uid) => {
    uid = String(uid); if (!D1('SELECT 1 AS x FROM users WHERE id = ?', uid)) return false;
    tx(() => { DR('DELETE FROM chat_messages WHERE uid = ? OR room = ?', uid, 'coach:' + uid); DR('DELETE FROM events WHERE uid = ?', uid); DR('DELETE FROM users WHERE id = ?', uid); });
    DR('DELETE FROM cheat_flags WHERE uid = ?', uid); DR('DELETE FROM outbox WHERE uid = ?', uid); DR('DELETE FROM chat_reports WHERE reporter = ?', uid);
    AR('DELETE FROM credentials WHERE uid = ?', uid); AR('DELETE FROM sessions WHERE uid = ?', uid); AR('DELETE FROM tokens WHERE uid = ?', uid);
    return true;
  };


  /* ---------------- profil : champs modifiables (liste blanche) ---------------- */
  const USER_FIELDS = { email_verified: 'int', terms_at: 'int', terms_ver: 'str', muted_until: 'int', lang: 'str', public_board: 'int', is_admin: 'int' };
  S.setUser = (uid, f) => {
    const keys = Object.keys(f).filter((k) => USER_FIELDS[k]); if (!keys.length) return false;
    DR('UPDATE users SET ' + keys.map((k) => k + ' = ?').join(', ') + ' WHERE id = ?', ...keys.map((k) => (USER_FIELDS[k] === 'int' ? int(f[k], 0) : nn(f[k]))), uid);
    return true;
  };
  S.setPassword = (uid, salt, hash) => { AR('INSERT OR REPLACE INTO credentials(uid,salt,hash) VALUES(?,?,?)', uid, salt, hash); AR("DELETE FROM sessions WHERE uid = ? AND kind = 'player'", uid); };
  S.setEmail = (uid, email) => DR('UPDATE users SET email = ?, email_verified = 0 WHERE id = ?', email, uid);

  /* ---------------- consentements ---------------- */
  S.addConsent = (uid, kind, version, detail) => DR('INSERT INTO consents(uid,kind,version,t,detail) VALUES(?,?,?,?,?)', uid, String(kind).slice(0, 20), nn(version), now(), nn(detail == null ? null : String(detail).slice(0, 200)));
  S.consents = (uid) => D('SELECT kind, version, t, detail FROM consents WHERE uid = ? ORDER BY t DESC', uid);

  /* ---------------- jetons à usage unique (auth.db) : e-mail, mot de passe, accord parental ---------------- */
  S.addToken = (tok, uid, kind, exp, data) => { AR('DELETE FROM tokens WHERE uid = ? AND kind = ? AND used = 0', uid, kind); AR('INSERT INTO tokens(token_hash,uid,kind,exp,used,data) VALUES(?,?,?,?,0,?)', sha(tok), uid, kind, exp, data == null ? null : JSON.stringify(data)); };
  S.peekToken = (tok, kind) => { const r = A1('SELECT uid, exp, used, data FROM tokens WHERE token_hash = ? AND kind = ?', sha(tok), kind); if (!r || r.exp < now()) return null; let d = null; try { d = r.data ? JSON.parse(r.data) : null; } catch (e) { /* ignoré */ } return { uid: r.uid, used: !!r.used, data: d }; };
  S.useToken = (tok, kind) => { const r = S.peekToken(tok, kind); if (!r || r.used) return null; AR('UPDATE tokens SET used = 1 WHERE token_hash = ?', sha(tok)); return r; };
  S.purgeTokens = () => AR('DELETE FROM tokens WHERE exp < ?', now());

  /* ---------------- courriels (boîte d'envoi) ---------------- */
  S.addMail = (m) => D1('INSERT INTO outbox(t,uid,kind,to_addr,subject,body,link,status) VALUES(?,?,?,?,?,?,?,?) RETURNING id', now(), nn(m.uid), m.kind, m.to, String(m.subject).slice(0, 200), String(m.body).slice(0, 4000), nn(m.link), m.status || 'queued').id;
  S.setMail = (id, status, error) => DR('UPDATE outbox SET status = ?, error = ? WHERE id = ?', status, nn(error == null ? null : String(error).slice(0, 200)), id);
  S.mails = (limit) => D('SELECT id, t, uid, kind, to_addr AS "to", subject, link, status, error FROM outbox ORDER BY id DESC LIMIT ?', limit || 60);
  S.mail = (id) => D1('SELECT * FROM outbox WHERE id = ?', int(id, -1)) || null;
  S.purgeMails = (maxAgeMs) => DR('DELETE FROM outbox WHERE t < ?', now() - maxAgeMs);

  /* ---------------- modération du chat ---------------- */
  S.addReport = (r) => { try { DR('INSERT INTO chat_reports(t,msg_id,room,author,text,reporter,reason,status) VALUES(?,?,?,?,?,?,?,?)', now(), r.msgId, r.room, r.author, String(r.text).slice(0, 300), r.reporter, nn(r.reason), 'open'); return true; } catch (e) { return false; } };
  S.reportCount = (msgId) => D1("SELECT COUNT(*) AS n FROM chat_reports WHERE msg_id = ?", msgId).n;
  S.reports = (status) => D('SELECT id, t, msg_id AS msgId, room, author, text, reporter, reason, status FROM chat_reports' + (status ? ' WHERE status = ?' : '') + ' ORDER BY id DESC LIMIT 100', ...(status ? [status] : []));
  S.setReport = (id, status) => DR('UPDATE chat_reports SET status = ? WHERE id = ?', status, int(id, -1)).changes > 0;
  S.resolveReports = (msgId, status) => DR("UPDATE chat_reports SET status = ? WHERE msg_id = ? AND status = 'open'", status, String(msgId));
  S.openReports = () => D1("SELECT COUNT(*) AS n FROM chat_reports WHERE status = 'open'").n;

  /* ---------------- anti-triche ---------------- */
  S.addFlag = (uid, kind, detail, severity) => DR('INSERT INTO cheat_flags(t,uid,kind,detail,severity) VALUES(?,?,?,?,?)', now(), uid, String(kind).slice(0, 30), String(detail == null ? '' : detail).slice(0, 240), int(severity, 1));
  S.flags = (limit) => D('SELECT f.id, f.t, f.uid, u.pseudo, f.kind, f.detail, f.severity FROM cheat_flags f LEFT JOIN users u ON u.id = f.uid ORDER BY f.id DESC LIMIT ?', limit || 80);
  S.flagScore = (uid, since) => D1('SELECT COALESCE(SUM(severity),0) AS n FROM cheat_flags WHERE uid = ? AND t > ?', uid, since).n;
  S.flagCount = () => D1('SELECT COUNT(*) AS n FROM cheat_flags').n;

  /* ---------------- amis, classements, défis ---------------- */
  S.addFriend = (uid, fuid) => { if (uid === fuid) return false; DR('INSERT OR IGNORE INTO friends(uid,friend_uid,t) VALUES(?,?,?)', uid, fuid, now()); return true; };
  S.delFriend = (uid, fuid) => DR('DELETE FROM friends WHERE uid = ? AND friend_uid = ?', uid, fuid).changes > 0;
  S.friendIds = (uid) => D('SELECT friend_uid AS id FROM friends WHERE uid = ? ORDER BY t', uid).map((r) => r.id);
  S.mutualFriends = (uid) => D('SELECT f.friend_uid AS id FROM friends f JOIN friends g ON g.uid = f.friend_uid AND g.friend_uid = f.uid WHERE f.uid = ? ORDER BY f.t', uid).map((r) => r.id);
  S.friendCount = (uid) => D1('SELECT COUNT(*) AS n FROM friends WHERE uid = ?', uid).n;
  // classement : XP et séances gagnés depuis un jour donné, parmi une liste de joueurs (ou tous les joueurs publics)
  S.board = (uids, sinceDay) => {
    if (!uids.length) return [];
    const ph = uids.map(() => '?').join(',');
    return D('SELECT u.id, u.pseudo, COALESCE(SUM(w.xp_gain),0) AS xp, COUNT(w.key) AS sessions, COALESCE(MAX(p.streak),0) AS streak, COALESCE(MAX(p.level),1) AS level FROM users u LEFT JOIN workouts w ON w.uid = u.id AND w.day >= ? LEFT JOIN players p ON p.uid = u.id WHERE u.id IN (' + ph + ') GROUP BY u.id ORDER BY xp DESC, sessions DESC, u.pseudo ASC LIMIT 50', sinceDay, ...uids);
  };
  S.publicIds = () => D('SELECT id FROM users WHERE banned = 0 AND public_board = 1').map((r) => r.id);
  S.workoutStats = (uid, fromDay, toDay) => D1('SELECT COUNT(*) AS sessions, COALESCE(SUM(reps*sets),0) AS reps, COUNT(DISTINCT day) AS days, COALESCE(SUM(xp_gain),0) AS xp FROM workouts WHERE uid = ? AND day >= ? AND day <= ?', uid, fromDay, toDay);
  S.verifiedCount = (uid, fromDay, toDay) => D1('SELECT COALESCE(SUM(verified),0) AS n FROM workouts WHERE uid = ? AND day >= ? AND day <= ?', uid, fromDay, toDay).n;
  S.claimed = (uid, week) => D1('SELECT challenge, t FROM challenge_claims WHERE uid = ? AND week = ?', uid, week) || null;
  S.claim = (uid, week, challenge) => { try { DR('INSERT INTO challenge_claims(uid,week,challenge,t) VALUES(?,?,?,?)', uid, week, challenge, now()); return true; } catch (e) { return false; } };
  S.claimCount = (uid) => D1('SELECT COUNT(*) AS n FROM challenge_claims WHERE uid = ?', uid).n;

  /* ---------------- relecture des exercices ---------------- */
  S.reviews = () => D('SELECT exercise_id AS id, status, note, reviewer, t FROM exercise_reviews');
  S.setReview = (id, status, note, reviewer) => DR('INSERT INTO exercise_reviews(exercise_id,status,note,reviewer,t) VALUES(?,?,?,?,?) ON CONFLICT(exercise_id) DO UPDATE SET status=excluded.status,note=excluded.note,reviewer=excluded.reviewer,t=excluded.t', String(id).slice(0, 60), status, nn(note), nn(reviewer), now());
  S.delReview = (id) => DR('DELETE FROM exercise_reviews WHERE exercise_id = ?', String(id));

  /* ---------------- migration depuis l'ancien db.json ---------------- */
  S.migrateJson = (file) => {
    if (S.countUsers() > 0 || !fs.existsSync(file)) return false;
    let old; try { old = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return false; }
    tx(() => {
      Object.values(old.users || {}).forEach((u) => {
        DR('INSERT OR IGNORE INTO users(id,email,pseudo,code,ref_by,banned,created,last_login) VALUES(?,?,?,?,NULL,?,?,NULL)', u.id, u.email, u.pseudo, u.code, b01(u.banned), u.created || new Date().toISOString().slice(0, 10));
        if (u.salt && u.hash) AR('INSERT OR REPLACE INTO credentials(uid,salt,hash) VALUES(?,?,?)', u.id, u.salt, u.hash);
      });
      Object.values(old.users || {}).forEach((u) => { if (u.refBy) DR('UPDATE users SET ref_by = ? WHERE id = ? AND EXISTS(SELECT 1 FROM users WHERE id = ?)', u.refBy, u.id, u.refBy); });
      Object.keys(old.players || {}).forEach((uid) => { if (D1('SELECT 1 AS x FROM users WHERE id = ?', uid)) { const p = old.players[uid]; p.updated = p.updated || now(); S.savePlayer(uid, p); } });
      Object.keys(old.grants || {}).forEach((uid) => Object.keys(old.grants[uid]).forEach((b) => { if (D1('SELECT 1 AS x FROM users WHERE id = ?', uid)) DR("INSERT INTO badge_grants(uid,badge_id,day,source) VALUES(?,?,?,'admin') ON CONFLICT(uid,badge_id) DO UPDATE SET source='admin'", uid, b, old.grants[uid][b]); }));
      (old.chat || []).forEach((m) => DR('INSERT OR IGNORE INTO chat_messages(id,room,uid,name,text,t,role) VALUES(?,?,?,?,?,?,?)', m.id, m.room, nn(m.uid), nn(m.name), m.text, int(m.t, now()), nn(m.role)));
      (old.events || []).forEach((e) => DR('INSERT INTO events(t,type,page,uid,name,data) VALUES(?,?,?,?,?,?)', int(e.t, now()), e.type, nn(e.page), nn(e.uid), nn(e.name), JSON.stringify(e.data || {})));
      (old.combos || []).forEach((c) => S.saveCombo(Object.assign({ updated: now() }, c)));
      (old.badges || []).forEach((b) => S.saveBadge(b));
      if (old.announce) S.setMeta('announce', old.announce);
    });
    if (old.admin && old.admin.salt && old.admin.hash) S.setAdmin(old.admin.salt, old.admin.hash, old.admin.fromEnv);
    try { fs.renameSync(file, file + '.migre-' + new Date().toISOString().slice(0, 10)); } catch (e) { /* ignoré */ }
    return true;
  };

  S.close = () => { try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); db.close(); auth.close(); if (ro) ro.close(); } catch (e) { /* ignoré */ } };
  return S;
}

module.exports = { open };
