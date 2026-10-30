/* Tests de l'API : node server/test.js  (lance son propre serveur sur un port libre) */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const PORT = 18000 + Math.floor(Math.random() * 1000), BASE = 'http://127.0.0.1:' + PORT;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nevtest-'));
const startSrv = (d, port) => spawn(process.execPath, [path.join(__dirname, 'server.js')], { env: Object.assign({}, process.env, { PORT: port || PORT, HOST: '127.0.0.1', NEV_DATA: d || dir, NEV_ADMIN_PASSWORD: 'admin-test-12345', NEV_CHAT_NEW_MINUTES: '0', NEV_CHAT_SLOW_HOURS: '0' }), stdio: ['ignore', 'pipe', 'pipe'] });
let srv = startSrv();
const up = async (base) => { for (let i = 0; i < 60; i++) { try { const r = await fetch(base + '/api/health'); if (r.ok) return true; } catch (e) { /* attente */ } await new Promise((r) => setTimeout(r, 150)); } return false; };
const stop = (p) => new Promise((res) => { p.once('exit', res); p.kill('SIGTERM'); });
let ok = 0, ko = 0;
const t = (name, cond, extra) => { if (cond) { ok++; console.log('  ✓ ' + name); } else { ko++; console.log('  ✗ ' + name + (extra ? '  → ' + JSON.stringify(extra) : '')); } };
class Jar { constructor() { this.c = {}; } add(r) { (r.headers.getSetCookie ? r.headers.getSetCookie() : []).forEach((x) => { const [kv] = x.split(';'); const i = kv.indexOf('='); const k = kv.slice(0, i), v = kv.slice(i + 1); if (/Max-Age=0/.test(x)) delete this.c[k]; else this.c[k] = v; }); } get h() { return Object.keys(this.c).map((k) => k + '=' + this.c[k]).join('; '); } }
async function call(jar, method, p, body, hdr) {
  const r = await fetch(BASE + p, { method, headers: Object.assign({ 'X-NEV': '1', Cookie: jar ? jar.h : '' }, body ? { 'Content-Type': 'application/json' } : {}, hdr || {}), body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
  if (jar) jar.add(r); let j = null; try { j = await r.json(); } catch (e) { /* pas du JSON */ } return { s: r.status, j, r };
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  for (let i = 0; i < 40; i++) { try { const r = await fetch(BASE + '/api/health'); if (r.ok) break; } catch (e) { /* attente */ } await wait(150); }
  const A = new Jar(), B = new Jar(), ADM = new Jar();
  console.log('Santé et en-têtes');
  let r = await call(null, 'GET', '/api/health'); t('health', r.j && r.j.app === 'neV.BOOSTER');
  const idx = await fetch(BASE + '/index.html'); const csp = idx.headers.get('content-security-policy') || '';
  t('CSP sans unsafe-inline pour les scripts', /script-src 'self' 'wasm-unsafe-eval'/.test(csp) && !/script-src[^;]*unsafe-inline/.test(csp));
  const mr = await fetch(BASE + '/media/histoire-voix.mp3', { headers: { Range: 'bytes=0-99' } });
  t('lecture partielle (Range) des médias : 206 + 100 octets', mr.status === 206 && /^bytes 0-99\//.test(mr.headers.get('content-range') || '') && (await mr.arrayBuffer()).byteLength === 100);
  const mr2 = await fetch(BASE + '/media/histoire-voix.mp3', { headers: { Range: 'bytes=99999999-' } }); t('Range hors fichier : 416', mr2.status === 416);
  const hp = await fetch(BASE + '/histoire-anime.html'); t('page « histoire animée » servie', hp.status === 200 && /histoire-anime\.js/.test(await hp.text()));
  t('X-Content-Type-Options + X-Frame-Options', idx.headers.get('x-content-type-options') === 'nosniff' && idx.headers.get('x-frame-options') === 'DENY');
  t('Permissions-Policy caméra autorisée seulement ici', /camera=\(self\)/.test(idx.headers.get('permissions-policy') || ''));
  console.log('Fichiers protégés');
  for (const p of ['/server/server.js', '/server/data/db.json', '/package.json', '/_dev/seed.py', '/../server/server.js', '/%2e%2e/server/server.js', '/js/..%2fserver%2fserver.js', '/.env']) { const x = await fetch(BASE + p); t('refusé : ' + p, x.status === 404 || x.status === 400, x.status); }
  t('page publique servie', (await fetch(BASE + '/accueil.html')).status === 200);
  console.log('Inscription / connexion');
  const su = { pseudo: 'Alice', email: 'alice@test.fr', password: 'motdepasse1', consent: true, sex: 'm', terms: true };
  r = await call(A, 'POST', '/api/signup', su, { 'X-NEV': '' }); t('CSRF : sans en-tête X-NEV → refusé', r.s === 403);
  r = await call(A, 'POST', '/api/signup', su, { Origin: 'http://evil.example' }); t('CSRF : mauvaise origine → refusé', r.s === 403);
  r = await call(A, 'POST', '/api/signup', Object.assign({}, su, { terms: false })); t('CGU non acceptées → refusé', r.s === 400 && r.j.field === 'terms');
  r = await call(A, 'POST', '/api/signup', Object.assign({}, su, { password: 'court' })); t('mot de passe court refusé', r.s === 400);
  r = await call(A, 'POST', '/api/signup', su); t('inscription OK', r.s === 200 && r.j.user && r.j.user.code, r.j);
  const ck = (r.r.headers.getSetCookie() || []).join(' | '); t('cookie HttpOnly + SameSite=Strict', /nev_s=/.test(ck) && /HttpOnly/.test(ck) && /SameSite=Strict/.test(ck));
  t('le hash n\'est jamais renvoyé', !/hash|salt|motdepasse1/.test(JSON.stringify(r.j)));
  const codeA = r.j.user.code, idA = r.j.user.id;
  r = await call(new Jar(), 'POST', '/api/signup', su); t('email déjà pris → 409', r.s === 409);
  r = await call(new Jar(), 'POST', '/api/signup', { pseudo: 'Nosex', email: 'nosex@test.fr', password: 'motdepasse2', consent: true, terms: true }); t('sexe manquant → refus', r.s === 400 && r.j.field === 'sex');
  t('code personnel à 4 chiffres', /^\d{4}$/.test(codeA));
  r = await call(B, 'POST', '/api/signup', { pseudo: 'Bob', email: 'bob@test.fr', password: 'motdepasse2', consent: true, sex: 'm', terms: true, ref: codeA }); t('inscription avec parrain', r.s === 200 && r.j.player && r.j.player.ref.by === codeA, r.j);
  r = await call(A, 'GET', '/api/me'); t('me : refCount du parrain = 1', r.s === 200 && r.j.user.refCount === 1, r.j);
  r = await call(new Jar(), 'GET', '/api/me'); t('me sans cookie → 401', r.s === 401);
  const L = new Jar(); r = await call(L, 'POST', '/api/login', { email: 'alice@test.fr', password: 'faux' }); t('mauvais mot de passe → 401', r.s === 401);
  r = await call(L, 'POST', '/api/login', { email: 'inconnu@test.fr', password: 'faux' }); t('même message pour email inconnu', r.s === 401 && r.j.error === 'Email ou mot de passe incorrect.');
  r = await call(L, 'POST', '/api/login', { email: 'alice@test.fr', password: 'motdepasse1' }); t('connexion OK', r.s === 200);
  console.log('Progression');
  r = await call(A, 'PUT', '/api/player', { player: { maxPushups: 9999, flames: 3, progress: { xp: 50, streak: 2 }, badges: {}, ref: { count: 99, by: 'FAKE' }, '__proto__': { x: 1 } } }); t('sauvegarde acceptée', r.s === 200);
  r = await call(A, 'GET', '/api/me'); t('valeurs bornées (pompes ≤ 200)', r.j.player.maxPushups === 200, r.j.player);
  t('parrainage non falsifiable', r.j.player.ref.count === 1 && r.j.player.ref.by !== 'FAKE', r.j.player.ref);
  r = await fetch(BASE + '/api/player', { method: 'PUT', headers: { 'X-NEV': '1', 'Content-Type': 'application/json', Cookie: A.h }, body: JSON.stringify({ player: { pad: 'x'.repeat(300000) } }) }); t('corps trop gros → 413', r.status === 413);
  console.log('Chat');
  r = await call(A, 'POST', '/api/chat', { room: 'global', text: '<img src=x onerror=alert(1)> salut' }); t('message envoyé', r.s === 200);
  r = await call(B, 'GET', '/api/chat?room=global'); t('autre joueur le lit, balises retirées', r.j.messages.length === 1 && !/[<>]/.test(r.j.messages[0].text), r.j);
  r = await call(A, 'POST', '/api/chat', { room: 'coach', text: 'bonjour coach' }); t('message au coach', r.s === 200);
  r = await call(B, 'GET', '/api/chat?room=coach'); t('salon coach privé (Bob ne voit pas Alice)', r.j.messages.length === 0);
  let hit = 0; for (let i = 0; i < 14; i++) { const x = await call(A, 'POST', '/api/chat', { room: 'global', text: 'spam ' + i }); if (x.s === 429) hit++; } t('anti-spam du chat', hit > 0);
  console.log('Appli installable');
  r = await fetch(BASE + '/manifest.webmanifest'); { const mj = await r.json().catch(() => null); t('manifeste : nom, icônes 192/512, démarrage, mode appli', !!mj && mj.display === 'standalone' && mj.icons.some((i) => i.sizes === '512x512') && mj.icons.some((i) => i.sizes === '192x192') && !!mj.start_url && !!mj.name, mj); }
  r = await fetch(BASE + '/sw.js'); t('service worker servi', r.status === 200);
  r = await fetch(BASE + '/.well-known/assetlinks.json'); t('assetlinks.json servi (lien appli Android)', r.status === 200);
  r = await fetch(BASE + '/.well-known/autre'); t('autres fichiers cachés toujours refusés', r.status === 404);
  console.log('Admin');
  r = await call(A, 'GET', '/api/admin/users'); t('joueur ordinaire → admin refusé', r.s === 401);
  r = await call(ADM, 'POST', '/api/admin/login', { password: 'mauvais' }); t('mauvais mot de passe admin', r.s === 401);
  r = await call(ADM, 'POST', '/api/admin/login', { password: 'admin-test-12345' }); t('connexion admin', r.s === 200);
  r = await call(ADM, 'GET', '/api/admin/users'); t('liste des joueurs', r.s === 200 && r.j.users.length === 2 && !JSON.stringify(r.j).match(/"hash"|"salt"/));
  r = await call(ADM, 'GET', '/api/admin/stats'); t('statistiques', r.s === 200 && r.j.players === 2 && r.j.server.mode === 'server', r.j);
  r = await call(ADM, 'POST', '/api/admin/combos', { name: 'Combo test', blurb: 'x', lvl: 'Facile', published: true, items: [['squats', 3], ['Bad Id!', 2], ['pompes-mur', 99]] }); t('combo créé et nettoyé', r.s === 200 && r.j.combo.items.length === 2 && r.j.combo.items[1][1] === 6, r.j);
  r = await call(ADM, 'POST', '/api/admin/badges', { name: 'Badge test', desc: 'd', shape: 'hex', icon: 'flame', text: '7', c1: 'red', c2: '#112233', rule: { t: 'total', v: 5 } }); t('badge créé, couleur invalide corrigée', r.s === 200 && /^#[0-9a-f]{6}$/i.test(r.j.badge.c1), r.j);
  r = await call(A, 'GET', '/api/config'); t('config visible par un joueur', r.s === 200 && r.j.combos.length === 1 && r.j.badges.length === 1);
  const bid = (await call(ADM, 'GET', '/api/admin/badges')).j.badges[0].id;
  r = await call(ADM, 'POST', '/api/admin/grant', { uid: idA, badge: bid }); t('badge offert', r.s === 200);
  console.log('Cadeaux et rôle admin');
  r = await call(ADM, 'POST', '/api/admin/gift', { uid: idA, flames: 50, draws: 3, note: 'Bravo' }); t('cadeau : flammes + tirages bonus', r.s === 200, r.j);
  r = await call(ADM, 'POST', '/api/admin/gift', { uid: idA, flames: 99999, draws: 0 }); t('cadeau trop gros refusé', r.s === 400);
  r = await call(ADM, 'POST', '/api/admin/gift', { uid: idA, flames: 0, draws: 0 }); t('cadeau vide refusé', r.s === 400);
  r = await call(A, 'POST', '/api/admin/gift', { uid: idA, flames: 5, draws: 0 }); t('un joueur ne peut pas s\'offrir de cadeau', r.s === 401);
  r = await call(A, 'GET', '/api/me'); const g0 = r.j.player; t('le joueur reçoit flammes, tirages et notification', g0.flames >= 50 && g0.bonusDraws === 3 && g0.gifts.length === 1 && g0.gifts[0].seen === false, g0);
  { const stale = JSON.parse(JSON.stringify(g0)); stale.flames = 0; stale.flamesTotal = 0; stale.bonusDraws = 0; stale.gifts = [];
    await call(A, 'PUT', '/api/player', { player: stale }); r = await call(A, 'GET', '/api/me');
    t('un navigateur en retard ne fait pas perdre le cadeau', r.j.player.flames >= 50 && r.j.player.bonusDraws === 3 && r.j.player.gifts.length === 1, r.j.player); }
  { const cheat = JSON.parse(JSON.stringify(r.j.player)); cheat.bonusDraws = 400; cheat.gifts.push({ id: 'fake', flames: 9999, draws: 9, seen: false });
    await call(A, 'PUT', '/api/player', { player: cheat }); r = await call(A, 'GET', '/api/me');
    t('tirages bonus et cadeaux ne s\'inventent pas', r.j.player.bonusDraws <= 3 && r.j.player.gifts.length === 1 && r.j.player.flames < 9000, r.j.player); }
  { const use = JSON.parse(JSON.stringify(r.j.player)); use.bonusDraws = 2; use.gifts[0].seen = true;
    await call(A, 'PUT', '/api/player', { player: use }); r = await call(A, 'GET', '/api/me');
    t('utiliser un tirage bonus le décompte', r.j.player.bonusDraws === 2 && r.j.player.gifts[0].seen === true, r.j.player); }
  r = await call(B, 'GET', '/api/admin/users'); t('joueur ordinaire : pas encore admin', r.s === 401);
  r = await call(B, 'POST', '/api/admin/role', { uid: idA, admin: true }); t('un joueur ne peut pas se nommer admin', r.s === 401);
  { const idB = (await call(B, 'GET', '/api/me')).j.user.id;
    r = await call(ADM, 'POST', '/api/admin/role', { uid: idB, admin: true }); t('le propriétaire nomme un admin', r.s === 200, r.j);
    r = await call(B, 'GET', '/api/admin/users'); t('le joueur nommé accède à l\'admin', r.s === 200 && r.j.users.some((u) => u.id === idB && u.admin), r.j);
    r = await call(B, 'POST', '/api/admin/gift', { uid: idA, flames: 1, draws: 0 }); t('un admin-joueur peut offrir', r.s === 200);
    r = await call(B, 'POST', '/api/admin/role', { uid: idA, admin: true }); t('un admin-joueur ne nomme pas d\'autre admin', r.s === 403, r.j);
    r = await call(ADM, 'POST', '/api/admin/role', { uid: idB, admin: false }); t('retrait du rôle', r.s === 200);
    r = await call(B, 'GET', '/api/admin/users'); t('plus d\'accès après retrait', r.s === 401); }
  await call(A, 'PUT', '/api/player', { player: { badges: {}, progress: {} } }); r = await call(A, 'GET', '/api/me'); t('badge offert conservé après une sauvegarde client', !!r.j.player.badges[bid]);
  r = await call(ADM, 'POST', '/api/admin/announce', { text: 'Bienvenue !' }); r = await call(A, 'GET', '/api/config'); t('annonce', r.j.announce && r.j.announce.text === 'Bienvenue !');
  r = await call(ADM, 'GET', '/api/admin/chat/threads'); t('fil coach visible par l\'admin', r.j.threads.length === 1);
  r = await call(ADM, 'POST', '/api/admin/chat', { room: 'coach:' + idA, text: 'Salut Alice' }); r = await call(A, 'GET', '/api/chat?room=coach'); t('réponse du coach reçue', r.j.messages.some((m) => m.role === 'admin'));
  r = await call(ADM, 'POST', '/api/admin/ban', { uid: r.j && idA, banned: true }); r = await call(A, 'GET', '/api/me'); t('joueur banni : session coupée', r.s === 401);
  r = await call(new Jar(), 'POST', '/api/login', { email: 'alice@test.fr', password: 'motdepasse1' }); t('joueur banni : connexion refusée', r.s === 403);
  console.log('Limites de débit');
  let blocked = 0; const X = new Jar(); for (let i = 0; i < 12; i++) { const x = await call(X, 'POST', '/api/admin/login', { password: 'non' + i }); if (x.s === 429) blocked++; } t('verrouillage après essais admin répétés', blocked > 0);
  r = await call(ADM, 'GET', '/api/admin/users'); t('session admin existante toujours valide', r.s === 200);

  console.log('Base de données (SQLite)');
  const ADM2 = ADM; // session admin ouverte plus haut (la limite de 5 essais/15 min est déjà atteinte pour cette IP)
  for (const p of ['/api/admin/db/info', '/api/admin/db/rows?table=users', '/api/admin/db/export?table=all', '/api/admin/db/backup']) { r = await call(A, 'GET', p); t('accès base refusé à un joueur : ' + p.slice(11, 30), r.s === 401, r.s); r = await call(null, 'GET', p); t('accès base refusé sans session : ' + p.slice(11, 30), r.s === 401, r.s); }
  for (const p of ['/server/data/nev.db', '/nev.db', '/auth.db', '/server/data/auth.db', '/server/store.js']) { const x = await fetch(BASE + p); t('fichier base protégé : ' + p, x.status === 404, x.status); }
  r = await call(ADM2, 'GET', '/api/admin/db/info'); const names = r.j.tables.map((x) => x.name);
  t('db/info : tables du site présentes', ['users', 'players', 'workouts', 'logins', 'badge_grants', 'badge_defs', 'combos', 'chat_messages', 'events', 'meta', 'admin_audit', 'referrals', 'v_joueurs'].every((n) => names.includes(n)), names);
  t('db/info : les secrets ne sont PAS dans la base visible', !names.includes('credentials') && !names.includes('sessions') && !names.includes('admin'), names);
  t('db/info : moteur SQLite + 2 comptes', /^SQLite 3/.test(r.j.info.engine) && r.j.tables.find((x) => x.name === 'users').rows === 2, r.j.info);
  // la table users n'a aucune colonne de mot de passe
  t('users : aucune colonne de mot de passe', !r.j.tables.find((x) => x.name === 'users').columns.some((c) => /pass|hash|salt|pw/i.test(c.name)));
  // l'utilisateur Carol, avec séances (historique) et jours de connexion
  const Cj = new Jar(); r = await call(Cj, 'POST', '/api/signup', { pseudo: '=SUM(1+1)', email: 'carol@test.fr', password: 'motdepasse3', consent: true, sex: 'm', terms: true }); const idC = r.j.user.id;
  const dAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10), D1 = dAgo(2), D2 = dAgo(3); // dates relatives : le test ne vieillit pas
  const hist = [{ date: D1, id: 'squats', name: 'Squats', rarity: 'Rare', tier: 2, reps: 12, sets: 3, verified: true, doubled: false, xpGain: 40, src: 'gacha' }, { date: D2, id: 'pompes', name: 'Pompes', rarity: 'Commun', tier: 1, reps: 10, sets: 3, verified: false, doubled: true, xpGain: 20, src: 'gacha' }, { date: D2, id: 'pompes', name: 'Pompes', rarity: 'Commun', tier: 1, reps: 10, sets: 3, verified: false, doubled: true, xpGain: 20, src: 'gacha' }];
  const pl = { maxPushups: 25, level: 2, flames: 7, flamesTotal: 7, progress: { xp: 60, streak: 2, best: 4, total: 3, lastDone: D1 }, login: { streak: 2, last: D1, days: [D2, D1] }, history: hist, badges: { b_first: D2 } };
  r = await call(Cj, 'PUT', '/api/player', { player: pl }); t('Carol : sauvegarde avec historique', r.s === 200);
  await call(Cj, 'PUT', '/api/player', { player: pl }); await call(Cj, 'PUT', '/api/player', { player: pl });
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=workouts&q=pompes'); t('workouts : 2 pompes identiques gardées, jamais dupliquées après 3 sauvegardes', r.j.total === 2, r.j.total);
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=workouts'); t('workouts : total 3', r.j.total === 3 && r.j.columns.some((c) => c.name === 'xp_gain'), r.j.total);
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=logins'); t('logins : 2 jours', r.j.total === 2, r.j.total);
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=players&q=' + encodeURIComponent('25')); t('players : colonnes de progression + recherche', r.j.rows.some((x) => x.uid === idC && x.xp === 60 && x.flames === 7), r.j.rows);
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=v_joueurs'); const vc = r.j.rows.find((x) => x.id === idC); t('vue v_joueurs : séances, flammes, badges', vc && vc.seances === 3 && vc.flammes === 7 && vc.badges === 1, vc);
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=referrals'); t('vue referrals : Alice a parrainé Bob', r.j.total === 1 && r.j.rows[0].referee === 'Bob', r.j.rows);
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=users&page=1&sort=pseudo&dir=asc'); t('tri et pagination', r.j.total === 3 && r.j.rows[0].pseudo <= r.j.rows[1].pseudo && r.j.pages === 1, r.j.rows.map((x) => x.pseudo));
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=users&sort=' + encodeURIComponent('pseudo"; DROP TABLE users;--')); t('injection par le tri : ignorée', r.s === 200 && r.j.total === 3);
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=' + encodeURIComponent('users"; DROP TABLE users;--')); t('injection par le nom de table → 404', r.s === 404);
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=credentials'); t('table des mots de passe : introuvable', r.s === 404);
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=users&q=' + encodeURIComponent("' OR 1=1 --")); t('recherche avec injection : 0 résultat', r.s === 200 && r.j.total === 0, r.j.total);
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=users&q=%25'); t('recherche % traitée comme texte', r.j.total === 0, r.j.total);
  r = await call(ADM2, 'GET', '/api/admin/db/user?uid=' + idC); t('fiche joueur complète', r.s === 200 && r.j.workoutCount === 3 && r.j.loginDays.length === 2 && r.j.badges.length === 1 && r.j.user.email === 'carol@test.fr' && !/hash|salt/.test(JSON.stringify(r.j)), r.j.user);
  // exports
  let x = await fetch(BASE + '/api/admin/db/export?table=users&format=csv', { headers: { Cookie: ADM2.h } }); let txt = await x.text();
  t('export CSV : en-tête, attachement, 3 comptes', x.status === 200 && /attachment/.test(x.headers.get('content-disposition')) && txt.split('\r\n').length === 4 && /^\ufeff?id,email,pseudo/.test(txt), txt.slice(0, 80));
  t('export CSV : formule neutralisée (=SUM → \'=SUM)', txt.indexOf("'=SUM(1+1)") >= 0 && !/,=SUM/.test(txt), txt);
  x = await fetch(BASE + '/api/admin/db/export?table=all', { headers: { Cookie: ADM2.h } }); txt = await x.text(); const all = JSON.parse(txt);
  t('export JSON complet : toutes les tables, aucun secret', Object.keys(all.tables).length >= 9 && !/"hash"|"salt"|motdepasse|scrypt/.test(txt) && all.tables.players.some((p) => p.data && p.data.maxPushups === 25), Object.keys(all.tables));
  x = await fetch(BASE + '/api/admin/db/backup', { headers: { Cookie: ADM2.h } }); const bk = Buffer.from(await x.arrayBuffer());
  t('sauvegarde téléchargeable : vrai fichier SQLite', x.status === 200 && bk.slice(0, 15).toString() === 'SQLite format 3' && bk.length > 8000, bk.length);
  t('la sauvegarde ne contient aucun mot de passe', bk.indexOf(Buffer.from('scrypt')) < 0 && bk.indexOf(Buffer.from('motdepasse')) < 0);
  // console SQL
  const Q = (sql) => call(ADM2, 'POST', '/api/admin/db/query', { sql });
  r = await Q("SELECT pseudo, email FROM users ORDER BY email LIMIT 2"); t('console : SELECT autorisé', r.s === 200 && r.j.rows.length === 2 && r.j.columns.join() === 'pseudo,email', r.j);
  r = await Q("SELECT u.pseudo, COUNT(w.key) AS n FROM users u LEFT JOIN workouts w ON w.uid = u.id GROUP BY u.id ORDER BY n DESC"); t('console : jointure + agrégat', r.s === 200 && r.j.rows[0].n === 3, r.j);
  r = await Q("WITH x AS (SELECT 1 AS a) SELECT * FROM x"); t('console : WITH autorisé', r.s === 200 && r.j.rows[0].a === 1, r.j);
  for (const bad of ["DELETE FROM users", "UPDATE users SET pseudo = 1", "DROP TABLE users", "INSERT INTO meta VALUES('a','b')", "SELECT 1; DROP TABLE users", "PRAGMA table_info(users)", "ATTACH DATABASE 'x.db' AS x", "SELECT * FROM credentials", "SELECT * FROM auth.credentials", "SELECT * FROM sqlite_master WHERE name = 'sessions'", "WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM c) SELECT * FROM c", "SELECT load_extension('x')", "SELECT 1 /* ok */ ; "]) {
    r = await Q(bad); const refused = r.s === 400 || (r.s === 200 && /sqlite_master/.test(bad) && r.j.rows.length === 0) || (r.s === 200 && /^SELECT 1 \/\*/.test(bad));
    t('console : refusé / inoffensif → ' + bad.slice(0, 48), refused, r.j);
  }
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=users'); t('la table users est intacte après toutes ces tentatives', r.j.total === 3);
  // audit
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=admin_audit'); const acts = r.j.rows.map((x) => x.action);
  t('journal d\'audit : connexion, exports, sauvegarde, requêtes', ['login', 'export', 'backup-download', 'query'].every((a) => acts.includes(a)), acts);
  // suppression de ligne ciblée et de joueur
  r = await call(ADM2, 'GET', '/api/admin/db/rows?table=chat_messages'); const cm = r.j.rows[0];
  r = await call(ADM2, 'POST', '/api/admin/db/delete-row', { table: 'chat_messages', rowid: cm._rowid }); t('suppression d\'une ligne de chat', r.s === 200);
  r = await call(ADM2, 'POST', '/api/admin/db/delete-row', { table: 'users', rowid: 1 }); t('suppression directe d\'un compte par ligne : refusée', r.s === 400);
  await call(Cj, 'POST', '/api/chat', { room: 'global', text: 'message de Carol' });
  r = await call(ADM2, 'POST', '/api/admin/db/delete-user', { uid: idC }); t('suppression du joueur : sans confirmation refusée', r.s === 400);
  r = await call(ADM2, 'POST', '/api/admin/db/delete-user', { uid: idC, confirm: true }); t('suppression du joueur Carol', r.s === 200);
  for (const [tb, col] of [['users', 'id'], ['players', 'uid'], ['workouts', 'uid'], ['logins', 'uid'], ['badge_grants', 'uid'], ['chat_messages', 'uid']]) { r = await Q('SELECT COUNT(*) AS n FROM ' + tb + " WHERE " + col + " = '" + idC + "'"); t('suppression en cascade : ' + tb + ' vide pour Carol', r.j.rows[0].n === 0, r.j); }
  r = await call(new Jar(), 'POST', '/api/login', { email: 'carol@test.fr', password: 'motdepasse3' }); t('Carol supprimée : connexion impossible (identifiants effacés)', r.s === 401);
  r = await call(Cj, 'GET', '/api/me'); t('Carol supprimée : session coupée', r.s === 401);
  r = await call(ADM2, 'POST', '/api/admin/db/check', {}); t('contrôle d\'intégrité de la base', r.j.integrity === 'ok' && r.j.foreignKeys === 0, r.j);
  r = await call(ADM2, 'POST', '/api/admin/db/backup-now', {}); t('sauvegarde automatique du jour', r.s === 200 && r.j.info.backups.length >= 1, r.j);

  console.log('Persistance après redémarrage');
  const Aj = new Jar(); await call(Aj, 'POST', '/api/login', { email: 'bob@test.fr', password: 'motdepasse2' }); await call(Aj, 'PUT', '/api/player', { player: { maxPushups: 33, flames: 5, flamesTotal: 5, progress: { xp: 10 } } });
  await stop(srv); srv = startSrv(); t('serveur relancé', await up(BASE));
  r = await call(Aj, 'GET', '/api/me'); t('la session du joueur survit au redémarrage', r.s === 200 && r.j.player.maxPushups === 33, r.s);
  r = await call(ADM2, 'GET', '/api/admin/db/info'); t('la session admin survit au redémarrage', r.s === 200 && r.j.tables.find((x) => x.name === 'users').rows === 2, r.s);
  r = await call(new Jar(), 'POST', '/api/login', { email: 'alice@test.fr', password: 'motdepasse1' }); t('mot de passe d\'Alice toujours valide (compte banni → 403 attendu)', r.s === 403, r.s);
  r = await call(Aj, 'GET', '/api/chat?room=global'); t('chat conservé après redémarrage', r.j.messages.length >= 1);


  console.log('Confiance et sécurité (e-mails, modération, anti-triche, amis, défi)');
  const mk = async (pseudo, email) => { const J = new Jar(); const x = await call(J, 'POST', '/api/signup', { pseudo, email, password: 'motdepasse9', consent: true, sex: 'm', terms: true }); return { J, id: x.j && x.j.user && x.j.user.id, code: x.j && x.j.user && x.j.user.code, r: x }; };
  const U1 = await mk('Zoé', 'zoe@test.fr'), U2 = await mk('Yan', 'yan@test.fr'), U3 = await mk('Xia', 'xia@test.fr');
  t('inscription sans âge acceptée', U1.r.s === 200 && !('age' in U1.r.j.user), U1.r.j);
  r = await call(new Jar(), 'POST', '/api/signup', { pseudo: 'Sans', email: 'sans@test.fr', password: 'motdepasse9', consent: true, sex: 'm' }); t('conditions non cochées → refus', r.s === 400 && r.j.field === 'terms');
  // courriels : la vérification et le mot de passe oublié passent par la boîte d'envoi (SMTP non réglé)
  r = await call(ADM2, 'GET', '/api/admin/mails'); const vm = r.j.mails.find((m) => m.kind === 'verify' && m.to === 'zoe@test.fr'); t('courriel de vérification en boîte d\'envoi', r.s === 200 && vm && /verifier-email\.html\?t=/.test(vm.link) && r.j.smtp === false, r.j);
  const vt = vm.link.split('t=')[1];
  r = await call(new Jar(), 'POST', '/api/verify', { token: vt }); t('vérification d\'e-mail OK', r.s === 200);
  r = await call(new Jar(), 'POST', '/api/verify', { token: vt }); t('lien de vérification à usage unique', r.s === 400);
  r = await call(U1.J, 'GET', '/api/account'); t('compte : e-mail confirmé + consentement enregistré', r.j.user.verified === true && r.j.consents.some((c) => c.kind === 'terms'), r.j);
  r = await call(new Jar(), 'POST', '/api/forgot', { email: 'zoe@test.fr' }); const r2 = await call(new Jar(), 'POST', '/api/forgot', { email: 'inconnu@test.fr' }); t('mot de passe oublié : même réponse compte existant ou non', r.s === 200 && r2.s === 200 && JSON.stringify(r.j) === JSON.stringify(r2.j));
  const rm = (await call(ADM2, 'GET', '/api/admin/mails')).j.mails.find((m) => m.kind === 'reset'); t('lien de réinitialisation créé (et rien pour l\'inconnu)', rm && (await call(ADM2, 'GET', '/api/admin/mails')).j.mails.filter((m) => m.kind === 'reset').length === 1);
  const rt = rm.link.split('t=')[1];
  r = await call(new Jar(), 'POST', '/api/token/check', { token: rt, kind: 'reset' }); t('jeton valide', r.j.ok === true);
  r = await call(new Jar(), 'POST', '/api/reset', { token: rt, password: 'court' }); t('réinitialisation : mot de passe trop court refusé', r.s === 400);
  r = await call(new Jar(), 'POST', '/api/reset', { token: rt, password: 'nouveaumdp123' }); t('réinitialisation OK', r.s === 200);
  r = await call(U1.J, 'GET', '/api/me'); t('anciennes sessions coupées après changement de mot de passe', r.s === 401);
  r = await call(new Jar(), 'POST', '/api/reset', { token: rt, password: 'autremdp12345' }); t('jeton à usage unique', r.s === 400);
  r = await call(new Jar(), 'POST', '/api/login', { email: 'zoe@test.fr', password: 'motdepasse9' }); t('ancien mot de passe refusé', r.s === 401);
  U1.J = new Jar(); r = await call(U1.J, 'POST', '/api/login', { email: 'zoe@test.fr', password: 'nouveaumdp123' }); t('nouveau mot de passe accepté', r.s === 200);
  // modération
  for (const [txt, why] of [['écris-moi sur www.site.com', 'lien'], ['mon mail zoe@test.fr', 'e-mail'], ['appelle le 06 12 34 56 78', 'téléphone'], ['tu es un connard', 'insulte'], ['ajoute-moi sur insta', 'contact externe']]) {
    r = await call(U1.J, 'POST', '/api/chat', { room: 'global', text: txt }); t('chat refuse : ' + why, r.s === 400 && r.j.error, r.j);
  }
  r = await call(U1.J, 'POST', '/api/chat', { room: 'global', text: 'Belle séance de pompes aujourd\'hui !' }); t('chat accepte un message normal', r.s === 200, r.j);
  r = await call(U2.J, 'GET', '/api/chat?room=global'); const mid = r.j.messages.find((m) => m.uid === U1.id).id; t('message visible par un autre joueur', !!mid);
  r = await call(U1.J, 'POST', '/api/chat/report', { id: mid }); t('on ne signale pas son propre message', r.s === 400);
  await call(U2.J, 'POST', '/api/chat/report', { id: mid, reason: 'test' }); await call(U2.J, 'POST', '/api/chat/report', { id: mid, reason: 'doublon' });
  r = await call(U3.J, 'GET', '/api/chat?room=global'); t('un doublon de signalement ne compte pas (message encore visible)', r.j.messages.some((m) => m.id === mid));
  await call(U3.J, 'POST', '/api/chat/report', { id: mid }); const U4 = await mk('Wen', 'wen@test.fr'); await call(U4.J, 'POST', '/api/chat/report', { id: mid });
  r = await call(U3.J, 'GET', '/api/chat?room=global'); t('3 signalements différents → message masqué', !r.j.messages.some((m) => m.id === mid));
  r = await call(ADM2, 'GET', '/api/admin/moderation'); t('file de modération admin', r.j.reports.length === 1 && r.j.reports[0].reporters === 3 && r.j.reports[0].hidden === true, r.j);
  r = await call(ADM2, 'POST', '/api/admin/moderation/act', { msgId: mid, action: 'mute', hours: 24 }); t('sourdine 24 h', r.s === 200);
  r = await call(U1.J, 'POST', '/api/chat', { room: 'global', text: 'je suis muet ?' }); t('joueur en sourdine : écriture refusée', r.s === 403 && /sourdine/.test(r.j.error), r.j);
  r = await call(U1.J, 'POST', '/api/chat', { room: 'coach', text: 'bonjour coach' }); t('sourdine aussi pour le coach', r.s === 403);
  await call(ADM2, 'POST', '/api/admin/users/mute', { uid: U1.id, hours: 0 }); r = await call(U1.J, 'POST', '/api/chat', { room: 'coach', text: 'retour' }); t('sourdine levée', r.s === 200);
  // anti-triche
  const day = new Date().toISOString().slice(0, 10);
  r = await call(U2.J, 'PUT', '/api/player', { player: { maxPushups: 20, level: 2, flames: 99999, flamesTotal: 99999, progress: { xp: 500000, total: 900, streak: 300, best: 300, lastDone: '2999-01-01' }, history: [{ date: '2999-01-01', id: 'dips', reps: 99999, sets: 99, xpGain: 99999 }, { date: day, id: 'squats', name: 'Squats', rarity: 'N', tier: 1, reps: 10, sets: 3, xpGain: 50, src: 'daily' }] } });
  r = await call(U2.J, 'GET', '/api/me'); const pp = r.j.player;
  t('anti-triche : XP plafonné', pp.progress.xp <= 1000, pp.progress);
  t('anti-triche : séances et série plafonnées', pp.progress.total <= 12 && pp.progress.streak <= 2, pp.progress);
  t('anti-triche : flammes plafonnées', pp.flamesTotal <= 400 && pp.flames <= 400, [pp.flames, pp.flamesTotal]);
  t('anti-triche : date future refusée', !pp.progress.lastDone || pp.progress.lastDone <= day, pp.progress.lastDone);
  t('anti-triche : séance impossible retirée, séance normale gardée', pp.history.length === 1 && pp.history[0].id === 'squats', pp.history);
  r = await call(ADM2, 'GET', '/api/admin/cheat'); t('anti-triche : corrections notées pour l\'admin', r.j.total >= 4 && r.j.flags.some((f) => f.pseudo === 'Yan'), r.j.total);
  r = await call(U3.J, 'PUT', '/api/player', { player: { maxPushups: 15, level: 2, flames: 5, flamesTotal: 5, progress: { xp: 80, total: 2, streak: 1, best: 1, lastDone: day }, history: [{ date: day, id: 'squats', name: 'Squats', rarity: 'N', tier: 1, reps: 10, sets: 3, xpGain: 50, src: 'daily', verified: true }] } });
  r = await call(U3.J, 'GET', '/api/me'); t('anti-triche : une progression normale passe intacte', r.j.player.progress.xp === 80 && r.j.player.flames === 5 && r.j.player.history.length === 1, r.j.player.progress);
  // amis, classement, défi
  r = await call(U3.J, 'POST', '/api/friends', { code: U3.code }); t('on ne s\'ajoute pas soi-même', r.s === 400);
  r = await call(U3.J, 'POST', '/api/friends', { code: 'NEVZZZZZ' }); t('code ami inconnu → 404', r.s === 404);
  r = await call(U3.J, 'POST', '/api/friends', { code: U4.code }); t('ajout ami : en attente tant que ce n\'est pas réciproque', r.s === 200 && r.j.mutual === false && r.j.pseudo === null, r.j);
  r = await call(U3.J, 'GET', '/api/board?scope=friends&period=week'); t('classement amis : seulement moi tant que pas réciproque', r.j.rows.length === 1 && r.j.rows[0].me === true, r.j.rows);
  r = await call(U4.J, 'POST', '/api/friends', { code: U3.code }); t('réciprocité', r.j.mutual === true && r.j.pseudo === 'Xia', r.j);
  r = await call(U4.J, 'PUT', '/api/player', { player: { maxPushups: 10, level: 1, flames: 0, flamesTotal: 0, progress: { xp: 30, total: 1, streak: 1, best: 1, lastDone: day }, history: [{ date: day, id: 'planche', name: 'Planche', rarity: 'N', tier: 1, reps: 5, sets: 2, xpGain: 30, src: 'daily' }] } });
  r = await call(U3.J, 'GET', '/api/board?scope=friends&period=week'); t('classement amis : trié par XP, avec le pseudo des amis', r.j.rows.length === 2 && r.j.rows[0].pseudo === 'Xia' && r.j.rows[0].xp === 50 && r.j.rows[1].pseudo === 'Wen', r.j.rows);
  t('classement : aucun identifiant ni e-mail exposé', !/"id"|email|code/.test(JSON.stringify(r.j.rows)));
  r = await call(U3.J, 'GET', '/api/board?scope=public&period=season'); t('classement public vide tant que personne n\'a accepté', r.s === 200 && r.j.rows.length === 0 || (r.j.rows.length === 0), r.j);
  r = await call(U3.J, 'POST', '/api/account/board', { public: true }); r = await call(U3.J, 'GET', '/api/board?scope=public&period=month'); t('classement public : seulement ceux qui ont accepté', r.j.rows.length === 1 && r.j.rows[0].pseudo === 'Xia', r.j.rows);
  r = await call(U3.J, 'POST', '/api/account/lang', { lang: 'es' }); r = await call(U3.J, 'GET', '/api/account'); t('langue du compte : espagnol enregistré', r.j.user.lang === 'es');
  r = await call(U3.J, 'POST', '/api/account/lang', { lang: 'xx' }); r = await call(U3.J, 'GET', '/api/account'); t('langue inconnue : retour au français', r.j.user.lang === 'fr');
  r = await call(U4.J, 'POST', '/api/friends/remove', { id: (await call(U4.J, 'GET', '/api/friends')).j.friends[0].id }); r = await call(U3.J, 'GET', '/api/board?scope=friends&period=week'); t('retirer un ami coupe la réciprocité', r.j.rows.length === 1);
  r = await call(U3.J, 'GET', '/api/challenge'); t('défi de la semaine fourni', r.s === 200 && r.j.challenge.goal > 0 && r.j.season.n >= 0, r.j);
  r = await call(U3.J, 'POST', '/api/challenge/claim', { kind: 'week' }); t('récompense refusée si objectif non atteint', r.s === 400);
  r = await call(U3.J, 'GET', '/api/config'); t('config : avis des relecteurs fournis', r.j.reviews && typeof r.j.reviews === 'object');
  r = await call(ADM2, 'POST', '/api/admin/reviews', { id: 'squats', status: 'ok', note: 'RAS', reviewer: 'Coach Test' }); r = await call(U3.J, 'GET', '/api/config'); t('relecture « validé » visible côté joueur', r.j.reviews.squats === 'ok');
  r = await call(ADM2, 'POST', '/api/admin/reviews', { id: 'Pas Bon', status: 'ok' }); t('relecture : identifiant invalide refusé', r.s === 400);
  // export / suppression de compte
  r = await call(U4.J, 'GET', '/api/account/export'); t('export des données du joueur (JSON)', r.s === 200 && r.j && r.j.data && r.j.data.user.pseudo === 'Wen' && !/hash|salt/.test(JSON.stringify(r.j)), r.s);
  r = await call(U4.J, 'POST', '/api/account/delete', { password: 'faux' }); t('suppression : mauvais mot de passe refusé', r.s === 401);
  r = await call(U4.J, 'POST', '/api/account/delete', { password: 'motdepasse9' }); t('suppression du compte', r.s === 200);
  r = await call(new Jar(), 'POST', '/api/login', { email: 'wen@test.fr', password: 'motdepasse9' }); t('compte supprimé : connexion impossible', r.s === 401);
  r = await call(ADM2, 'POST', '/api/admin/db/query', { sql: "SELECT COUNT(*) AS n FROM users WHERE pseudo='Wen'" }); t('compte supprimé : plus aucune trace en base', r.j.rows[0].n === 0);
  r = await call(ADM2, 'POST', '/api/admin/db/query', { sql: 'SELECT COUNT(*) AS n FROM pragma_table_info(\'users\') WHERE name=\'age\'' }); t('la colonne « age » n\'existe plus', r.s === 400 || (r.j && r.j.rows && r.j.rows[0].n === 0));

  console.log('Migration depuis l\'ancien db.json');
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'nevmig-')), salt = '00112233445566778899aabbccddeeff';
  const hash = await new Promise((res) => require('crypto').scrypt('ancienmdp123', salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => res(k.toString('hex'))));
  fs.writeFileSync(path.join(dir2, 'db.json'), JSON.stringify({ users: { uOld1: { id: 'uOld1', email: 'old@test.fr', pseudo: 'Ancien', age: 22, salt, hash, created: '2026-10-01', code: 'NEVOLD', refCount: 0 } }, players: { uOld1: { maxPushups: 40, level: 3, flames: 9, progress: { xp: 300, streak: 5, best: 6, total: 12, lastDone: '2026-10-14' }, history: [{ date: '2026-10-14', id: 'dips', name: 'Dips', tier: 3, reps: 8, sets: 4, xpGain: 60, src: 'gacha' }], badges: { bx: '2026-10-10' } } }, chat: [{ id: 'm1', room: 'global', uid: 'uOld1', name: 'Ancien', text: 'salut', t: 1760000000000, role: 'player' }], events: [{ t: 1760000000000, type: 'view', page: 'accueil', data: {} }], combos: [{ id: 'cOld1', name: 'Vieux combo', blurb: '', lvl: 'Facile', items: [['squats', 3]], published: true, updated: 1 }], badges: [{ id: 'bOld1', name: 'Vieux badge', desc: '', shape: 'hex', icon: '', text: '', c1: '#112233', c2: '#445566', rule: { t: 'total', v: 5 } }], announce: { text: 'Ancienne annonce', t: 1 }, grants: { uOld1: { bOld1: '2026-10-12' } } }));
  const P2 = PORT + 2000, B2 = 'http://127.0.0.1:' + P2, srv2 = startSrv(dir2, P2); t('serveur démarré sur l\'ancienne base', await up(B2));
  const call2 = async (jar, method, p, body) => { const rr = await fetch(B2 + p, { method, headers: Object.assign({ 'X-NEV': '1', Cookie: jar ? jar.h : '' }, body ? { 'Content-Type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined }); if (jar) jar.add(rr); let j = null; try { j = await rr.json(); } catch (e) { /* ignoré */ } return { s: rr.status, j }; };
  const O = new Jar(); r = await call2(O, 'POST', '/api/login', { email: 'old@test.fr', password: 'ancienmdp123' }); t('ancien compte : même mot de passe, connexion OK', r.s === 200 && r.j.player.maxPushups === 40, r);
  r = await call2(O, 'GET', '/api/config'); t('anciens combos, badges et annonce importés', r.j.combos.length === 1 && r.j.badges.length === 1 && r.j.announce.text === 'Ancienne annonce', r.j);
  const OA = new Jar(); await call2(OA, 'POST', '/api/admin/login', { password: 'admin-test-12345' }); r = await call2(OA, 'GET', '/api/admin/stats');
  t('statistiques SQL : séance et joueur importés', r.j.players === 1 && r.j.sessionsTotal === 1 && r.j.topExercises[0].id === 'dips', r.j);
  t('ancien db.json mis de côté', fs.readdirSync(dir2).some((f) => /^db\.json\.migre-/.test(f)) && !fs.existsSync(path.join(dir2, 'db.json')));
  await stop(srv2); fs.rmSync(dir2, { recursive: true, force: true });

  await stop(srv); fs.rmSync(dir, { recursive: true, force: true });
  console.log('\n' + ok + ' réussis, ' + ko + ' échoués'); process.exit(ko ? 1 : 0);
})().catch((e) => { console.error(e); try { srv.kill(); } catch (x) { /* ignoré */ } process.exit(1); });
