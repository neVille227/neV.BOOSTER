/* ==========================================================
   neV.BOOSTER — social.js : profils, recherche @pseudo, messagerie privée, notifications
   • Profils : @pseudo unique, photo/avatar, biographie, infos, confidentialité (public / amis / privé).
   • Recherche par @pseudo ; demandes d'amis (réutilise la table « friends » : deux sens = amis).
   • Messages privés : lu / non lu, blocage, signalement, image facultative (NEV_DM_IMAGES=1).
   • Temps réel : Server-Sent Events (/api/social/stream) — sans dépendance, compatible Render.
   • Hors application : Web Push sans contenu (clés VAPID générées et gardées en base) ; le service
     worker demande ensuite l'aperçu à /api/social/notify-preview, qui respecte la confidentialité.
   Visiteur : peut chercher et lire les profils publics ; pour écrire ou recevoir, il faut un compte.
   ========================================================== */
'use strict';
const crypto = require('node:crypto');

module.exports = function (ctx) {
  const { S, send, fail, readBody, limit, clean, now, counters, logEvent, baseUrl } = ctx;
  const HOUR = 3600000;
  const HANDLE = /^[A-Za-z0-9_]{3,20}$/;
  const IMAGES = () => process.env.NEV_DM_IMAGES === '1';
  const b64u = (b) => Buffer.from(b).toString('base64url');

  /* ---------------- clés VAPID (Web Push) ---------------- */
  let vapid = S.meta('vapid');
  if (!vapid || !vapid.jwk) {
    const kp = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const jwk = kp.privateKey.export({ format: 'jwk' });
    vapid = { jwk, pub: b64u(Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')])) };
    S.setMeta('vapid', vapid);
  }
  const vKey = crypto.createPrivateKey({ key: vapid.jwk, format: 'jwk' });
  const vapidHeader = (endpoint) => {
    const aud = new URL(endpoint).origin;
    const sub = process.env.NEV_PUSH_SUB || (baseUrl() || 'https://nevbooster.onrender.com');
    const h = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' })), p = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub }));
    const sig = crypto.sign('sha256', Buffer.from(h + '.' + p), { key: vKey, dsaEncoding: 'ieee-p1363' });
    return 'vapid t=' + h + '.' + p + '.' + b64u(sig) + ', k=' + vapid.pub;
  };
  const endpointOk = (e) => {
    try { const u = new URL(e); if (e.length > 600) return false; return u.protocol === 'https:' || (process.env.NEV_PUSH_ALLOW_HTTP === '1' && u.protocol === 'http:'); } catch (x) { return false; }
  };
  const pushTimers = new Map();
  function pushLater(uid) {
    if (pushTimers.has(uid)) return;
    pushTimers.set(uid, setTimeout(async () => {
      pushTimers.delete(uid);
      for (const ep of S.pushOf(uid)) {
        try {
          const r = await fetch(ep, { method: 'POST', headers: { Authorization: vapidHeader(ep), TTL: '86400', Urgency: 'high', 'Content-Length': '0' }, signal: AbortSignal.timeout(8000) });
          if (r.status === 404 || r.status === 410) S.delPush(ep);
        } catch (e) { /* service injoignable : on réessaiera au prochain message */ }
      }
    }, 3000));
    pushTimers.get(uid).unref && pushTimers.get(uid).unref();
  }

  /* ---------------- temps réel (SSE) ---------------- */
  const streams = new Map(); // uid -> Set(res)
  const online = (uid) => !!(streams.get(uid) && streams.get(uid).size);
  function emit(uid, event, data) {
    const set = streams.get(uid); if (!set) return;
    const chunk = 'event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n';
    set.forEach((r) => { try { r.write(chunk); } catch (e) { /* fermé */ } });
  }
  const beat = setInterval(() => { streams.forEach((set) => set.forEach((r) => { try { r.write(': ping\n\n'); } catch (e) { /* fermé */ } })); }, 20000);
  beat.unref && beat.unref();

  /* ---------------- aides ---------------- */
  const mutual = (a, b) => S.mutualFriends(a).indexOf(b) >= 0;
  function relation(me, other) {
    if (!me) return 'none'; if (me === other) return 'self';
    const mine = S.friendIds(me), theirs = S.friendIds(other);
    if (mine.indexOf(other) >= 0 && theirs.indexOf(me) >= 0) return 'friends';
    if (mine.indexOf(other) >= 0) return 'requested';
    if (theirs.indexOf(me) >= 0) return 'incoming';
    return 'none';
  }
  const AVATAR = /^(evo|p[1-8])$/;
  function avatarOk(a) {
    if (AVATAR.test(a)) return true;
    return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(a) && a.length <= 60000;
  }
  const stats = (uid) => { const pl = S.getPlayer(uid) || {}; const pr = pl.progress || {}; return { sex: pl.sex === 'f' ? 'f' : 'm', xp: pr.xp || 0, streak: pr.streak || 0, level: pl.level || null, sessions: pr.total || 0 }; };
  const clanName = (uid) => { const id = S.clanOf(uid), c = id ? S.clanById(id) : null; return c ? c.name : ''; };
  function card(me, p, u) {
    const rel = relation(me, p.uid);
    return { handle: p.handle, avatar: p.avatar, sex: stats(p.uid).sex, relation: rel, since: u ? u.created : null };
  }
  function view(me, p) {
    const u = S.userById(p.uid), rel = relation(me, p.uid), isMe = me === p.uid;
    const full = isMe || p.vis === 'public' || (p.vis === 'friends' && rel === 'friends');
    const base = { handle: p.handle, avatar: p.avatar, relation: rel, vis: p.vis, blockedByMe: me ? S.iBlocked(me, p.uid) : false, canMessage: !!me && !isMe && canDm(me, p) };
    if (!full) return Object.assign(base, { locked: true });
    const st = stats(p.uid);
    return Object.assign(base, { locked: false, bio: p.bio, info: p.info, sex: st.sex, xp: st.xp, streak: st.streak, level: st.level, since: u ? u.created : null, contacts: S.mutualFriends(p.uid).length, sessions: st.sessions, online: online(p.uid), clan: clanName(p.uid) });
  }
  function canDm(me, p) {
    if (!me || me === p.uid || S.isBlocked(me, p.uid)) return false;
    return p.dm === 'all' || (p.dm === 'friends' && mutual(me, p.uid));
  }
  const cleanInfo = (i) => {
    const o = {}; i = i && typeof i === 'object' ? i : {};
    ['city', 'goal', 'fav'].forEach((k) => { const v = clean(i[k], k === 'goal' ? 80 : 40); if (v) o[k] = v; });
    if (ZONES.indexOf(i.zone) >= 0) o.zone = i.zone;
    return o;
  };
  const ZONES = ['haut', 'jambes', 'abdos', 'cardio'];
  const OTHER = (uid) => { const p = S.profile(uid); return p ? { handle: p.handle, avatar: p.avatar } : { handle: '?', avatar: 'evo' }; };

  /* ---------------- routes ---------------- */
  return async function route(r, m, req, res, ip, url, user) {
    if (r.indexOf('social/') !== 0) return false;
    r = r.slice(7);
    const me = user ? user.id : null;
    if (me) S.ensureProfile(me, user.pseudo);
    const q = url.searchParams;
    const needUser = () => { if (!me) { fail(res, 401, 'Crée un compte ou connecte-toi pour utiliser la messagerie.'); return true; } return false; };

    /* --- public / visiteur --- */
    if (r === 'search' && m === 'GET') {
      const w = limit('ss:' + (me || ip), 90, 60000); if (w) return fail(res, 429, 'Trop de recherches. Patiente un instant.');
      const term = clean(q.get('q'), 30).replace(/^@+/, '').replace(/[^A-Za-z0-9_]/g, '');
      if (term.length < 2) return send(res, 200, { results: [] });
      const out = S.searchHandles(term, 20).filter((p) => !me || !S.isBlocked(me, p.uid)).map((p) => {
        const v = view(me, p); return { handle: v.handle, avatar: v.avatar, relation: v.relation, locked: v.locked, bio: v.locked ? '' : String(p.bio || '').slice(0, 80), sex: v.sex || null, canMessage: v.canMessage, xp: v.locked ? null : v.xp, zone: v.locked || !v.info ? '' : (v.info.zone || ''), online: online(p.uid) };
      });
      return send(res, 200, { results: out });
    }
    if (r === 'profile' && m === 'GET') {
      const h = clean(q.get('h'), 30).replace(/^@+/, '');
      const p = HANDLE.test(h) ? S.profileByHandle(h) : null; const u = p ? S.userById(p.uid) : null;
      if (!p || !u || u.banned || (me && S.isBlocked(me, p.uid) && me !== p.uid)) return fail(res, 404, 'Profil introuvable.');
      return send(res, 200, { profile: view(me, p) });
    }

    /* --- clans (liste publique ; créer / rejoindre / quitter avec un compte) --- */
    const clanOut = (c) => {
      const ids = S.clanMembers(c.id), xp = ids.reduce((a, id) => a + stats(id).xp, 0);
      return { id: c.id, name: c.name, descr: c.descr, members: ids.length, xp: xp, owner: me ? c.owner === me : false, mine: me ? ids.indexOf(me) >= 0 : false, full: ids.length >= 30 };
    };
    if (r === 'clans' && m === 'GET') {
      const list = S.clanList().map(clanOut).sort((a, b) => b.xp - a.xp).map((c, i) => Object.assign(c, { rank: i + 1 }));
      return send(res, 200, { clans: list, mine: me ? S.clanOf(me) : null, max: 30 });
    }
    if (needUser()) return;
    if (r === 'clans/create' && m === 'POST') {
      const w = limit('cc:' + me, 5, HOUR); if (w) return fail(res, 429, 'Trop de créations. Réessaie plus tard.');
      const b = await readBody(req, 1024), name = clean(b.name, 24).replace(/\s+/g, ' ').trim(), descr = clean(b.descr, 80);
      if (!/^[\p{L}\p{N} _'-]{3,24}$/u.test(name)) return fail(res, 400, 'Nom du clan : 3 à 24 caractères (lettres, chiffres, espaces, - _ \').');
      if (S.clanOf(me)) return fail(res, 400, 'Tu es déjà dans un clan. Quitte-le d\'abord.');
      if (S.clanCount() >= 500) return fail(res, 400, 'Limite de clans atteinte.');
      const id = crypto.randomBytes(6).toString('hex');
      try { S.clanCreate(id, name, descr, me); } catch (e) { return fail(res, 409, 'Ce nom de clan est déjà pris.'); }
      return send(res, 200, { ok: true, id: id });
    }
    if (r === 'clans/join' && m === 'POST') {
      const w = limit('cj:' + me, 20, HOUR); if (w) return fail(res, 429, 'Trop d\'essais. Réessaie plus tard.');
      const b = await readBody(req, 256), c = S.clanById(String(b.id || ''));
      if (!c) return fail(res, 404, 'Clan introuvable.');
      if (S.clanOf(me)) return fail(res, 400, 'Tu es déjà dans un clan. Quitte-le d\'abord.');
      if (S.clanMembers(c.id).length >= 30) return fail(res, 400, 'Ce clan est complet (30 membres).');
      S.clanJoin(me, c.id); return send(res, 200, { ok: true });
    }
    if (r === 'clans/leave' && m === 'POST') { S.clanLeave(me); return send(res, 200, { ok: true }); }
    if (r === 'suggest' && m === 'GET') {
      const mine = new Set(S.friendIds(me));
      const out = S.suggestHandles(12).filter((p) => p.uid !== me && !mine.has(p.uid) && !S.isBlocked(me, p.uid)).slice(0, 4).map((p) => ({ handle: p.handle, avatar: p.avatar, sex: stats(p.uid).sex, xp: stats(p.uid).xp, relation: relation(me, p.uid) }));
      return send(res, 200, { results: out });
    }

    /* --- mon profil et mes réglages --- */
    if (r === 'me' && m === 'GET') {
      const p = S.profile(me), st = stats(me);
      return send(res, 200, { profile: { handle: p.handle, bio: p.bio, avatar: p.avatar, info: p.info, vis: p.vis, dm: p.dm, preview: p.preview, receipts: p.receipts, sex: st.sex, xp: st.xp, streak: st.streak, sessions: st.sessions, contacts: S.mutualFriends(me).length, clan: clanName(me) }, unread: S.dmUnread(me), push: { key: vapid.pub, subscribed: S.pushOf(me).length > 0 }, images: IMAGES(), blocked: S.blockedList(me) });
    }
    if (r === 'me' && m === 'PUT') {
      const w = limit('sp:' + me, 40, HOUR); if (w) return fail(res, 429, 'Trop de modifications. Réessaie plus tard.');
      const b = await readBody(req, 90000, 61000), cur = S.profile(me), f = {};
      if (b.handle != null) {
        const h = String(b.handle).replace(/^@+/, '').trim();
        if (!HANDLE.test(h)) return fail(res, 400, 'Le @pseudo fait 3 à 20 caractères : lettres, chiffres ou _.', 'handle');
        if (h.toLowerCase() !== cur.handle.toLowerCase()) {
          if (S.handleTaken(h, me)) return fail(res, 409, 'Ce @pseudo est déjà pris.', 'handle');
          if (limit('sh:' + me, 5, 24 * HOUR)) return fail(res, 429, 'Tu as changé ton @pseudo trop souvent aujourd\'hui.', 'handle');
        }
        f.handle = h;
      }
      if (b.bio != null) f.bio = clean(b.bio, 160);
      if (b.avatar != null) { const a = String(b.avatar); if (!avatarOk(a)) return fail(res, 400, 'Photo non acceptée (JPEG, PNG ou WebP, petite taille).', 'avatar'); f.avatar = a; }
      if (b.info != null) f.info = cleanInfo(b.info);
      if (b.vis != null) { if (['public', 'friends', 'private'].indexOf(b.vis) < 0) return fail(res, 400, 'Réglage invalide.', 'vis'); f.vis = b.vis; }
      if (b.dm != null) { if (['all', 'friends', 'none'].indexOf(b.dm) < 0) return fail(res, 400, 'Réglage invalide.', 'dm'); f.dm = b.dm; }
      if (b.preview != null) f.preview = !!b.preview;
      if (b.receipts != null) f.receipts = !!b.receipts;
      if (b.sex != null) {
        if (b.sex !== 'm' && b.sex !== 'f') return fail(res, 400, 'Choisis masculin ou féminin.', 'sex');
        const pl = S.getPlayer(me) || {}; if (pl.sex !== b.sex) { pl.sex = b.sex; pl.updated = now(); S.savePlayer(me, pl); }
      }
      S.setProfile(me, f);
      return send(res, 200, { ok: true, handle: S.profile(me).handle });
    }

    /* --- amis et demandes --- */
    if (r === 'friends' && m === 'GET') {
      const list = (ids) => ids.map((id) => { const p = S.profile(id), u = S.userById(id); return p && u && !u.banned ? { handle: p.handle, avatar: p.avatar, sex: stats(id).sex, xp: stats(id).xp, online: online(id) } : null; }).filter(Boolean);
      const mine = S.friendIds(me), mu = new Set(S.mutualFriends(me));
      return send(res, 200, { friends: list(Array.from(mu)), incoming: list(S.incomingRequests(me)), outgoing: list(mine.filter((id) => !mu.has(id))) });
    }
    if (r === 'friend' && m === 'POST') {
      const w = limit('sf:' + me, 40, HOUR); if (w) return fail(res, 429, 'Trop de demandes. Réessaie plus tard.');
      const b = await readBody(req, 512), p = S.profileByHandle(String(b.handle || '').replace(/^@+/, '')), act = String(b.action || 'request');
      const u = p ? S.userById(p.uid) : null;
      if (!p || !u || u.banned || p.uid === me) return fail(res, 404, 'Profil introuvable.');
      if (act !== 'remove' && act !== 'cancel' && act !== 'decline' && S.isBlocked(me, p.uid)) return fail(res, 403, 'Action impossible avec ce joueur.');
      if (act === 'request') {
        if (S.friendCount(me) >= 60) return fail(res, 400, 'Limite de 60 contacts atteinte.');
        if (S.profile(p.uid).vis === 'private' && relation(me, p.uid) === 'none') return fail(res, 403, 'Ce profil n\'accepte pas de demandes.');
        S.addFriend(me, p.uid);
        const rel = relation(me, p.uid);
        emit(p.uid, 'friend', { handle: S.profile(me).handle, state: rel === 'friends' ? 'friends' : 'incoming' });
        if (rel !== 'friends' && !online(p.uid)) { /* pas de push pour une demande : seulement le badge au prochain chargement */ }
        return send(res, 200, { ok: true, relation: rel });
      }
      if (act === 'accept') { if (relation(me, p.uid) !== 'incoming') return fail(res, 400, 'Aucune demande à accepter.'); S.addFriend(me, p.uid); emit(p.uid, 'friend', { handle: S.profile(me).handle, state: 'friends' }); return send(res, 200, { ok: true, relation: 'friends' }); }
      if (act === 'decline') { S.delFriend(p.uid, me); return send(res, 200, { ok: true, relation: 'none' }); }
      if (act === 'cancel' || act === 'remove') { S.delFriend(me, p.uid); S.delFriend(p.uid, me); return send(res, 200, { ok: true, relation: 'none' }); }
      return fail(res, 400, 'Action inconnue.');
    }

    /* --- messagerie --- */
    if (r === 'conversations' && m === 'GET') {
      const convs = S.dmConvs(me).map((c) => {
        const o = OTHER(c.other), u = S.userById(c.other);
        return { handle: o.handle, avatar: o.avatar, sex: stats(c.other).sex, online: online(c.other), text: c.text || (c.img ? '📷 Image' : ''), fromMe: c.from === me, t: c.t, unread: c.unread, read: !!c.readAt, blocked: S.iBlocked(me, c.other), gone: !u || u.banned };
      }).filter((c) => !c.gone);
      return send(res, 200, { conversations: convs, unread: S.dmUnread(me) });
    }
    if (r === 'messages' && m === 'GET') {
      const p = S.profileByHandle(String(q.get('h') || '').replace(/^@+/, '')), u = p ? S.userById(p.uid) : null;
      if (!p || !u || u.banned) return fail(res, 404, 'Conversation introuvable.');
      const msgs = S.dmList(me, p.uid, Number(q.get('before')) || 0, 60);
      const mine = S.profile(me);
      if (q.get('mark') === '1' && !S.isBlocked(me, p.uid)) { const n = S.dmMarkRead(me, p.uid); if (n && mine.receipts) emit(p.uid, 'read', { handle: mine.handle }); if (n) emit(me, 'unread', { n: S.dmUnread(me) }); }
      return send(res, 200, { with: { handle: p.handle, avatar: p.avatar, sex: stats(p.uid).sex }, canSend: canDm(me, p), blocked: S.iBlocked(me, p.uid), receipts: p.receipts,
        messages: msgs.map((x) => ({ id: x.id, mine: x.from === me, text: x.text, img: x.img || null, t: x.t, read: x.from === me ? !!x.readAt && p.receipts : true })) });
    }
    if (r === 'send' && m === 'POST') {
      const w = limit('sm:' + me, 40, 60000); if (w) return fail(res, 429, 'Tu écris trop vite. Patiente quelques secondes.');
      if (user.mutedUntil && user.mutedUntil > now()) return fail(res, 403, 'Tu ne peux pas écrire pour le moment.');
      const b = await readBody(req, 220000, 201000), p = S.profileByHandle(String(b.to || '').replace(/^@+/, '')), u = p ? S.userById(p.uid) : null;
      if (!p || !u || u.banned || p.uid === me) return fail(res, 404, 'Destinataire introuvable.', 'to');
      if (S.iBlocked(me, p.uid)) return fail(res, 403, 'Tu as bloqué ce joueur : débloque-le pour lui écrire.', 'to');
      if (!canDm(me, p)) return fail(res, 403, p.dm === 'friends' ? 'Ce joueur n\'accepte les messages que de ses amis.' : 'Ce joueur n\'accepte pas de messages.', 'to');
      const text = clean(b.text, 1000); let img = null;
      if (b.img) {
        if (!IMAGES()) return fail(res, 403, 'L\'envoi d\'images n\'est pas activé.', 'img');
        const s = String(b.img); if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) || s.length > 200000) return fail(res, 400, 'Image refusée (JPEG, PNG ou WebP, 150 Ko max).', 'img');
        img = s;
      }
      if (!text && !img) return fail(res, 400, 'Écris un message.', 'text');
      const row = S.addDm(me, p.uid, text, img), mine = S.profile(me);
      const msg = { id: row.id, text, img, t: row.t };
      emit(p.uid, 'message', Object.assign({ handle: mine.handle, avatar: mine.avatar, mine: false, read: true }, msg));
      emit(p.uid, 'unread', { n: S.dmUnread(p.uid) });
      emit(me, 'sent', Object.assign({ handle: p.handle, mine: true, read: false }, msg));
      if (!online(p.uid)) pushLater(p.uid);
      logEvent('dm', 'social', me, user.pseudo, {});
      return send(res, 200, { ok: true, message: Object.assign({ mine: true, read: false }, msg) });
    }
    if (r === 'read' && m === 'POST') {
      const b = await readBody(req, 256), p = S.profileByHandle(String(b.handle || '').replace(/^@+/, ''));
      if (!p) return fail(res, 404, 'Conversation introuvable.');
      const n = S.dmMarkRead(me, p.uid); if (n && S.profile(me).receipts) emit(p.uid, 'read', { handle: S.profile(me).handle });
      emit(me, 'unread', { n: S.dmUnread(me) });
      return send(res, 200, { ok: true, unread: S.dmUnread(me) });
    }
    if (r === 'unread' && m === 'GET') return send(res, 200, { unread: S.dmUnread(me) + S.incomingRequests(me).length, messages: S.dmUnread(me), requests: S.incomingRequests(me).length });
    if (r === 'block' && m === 'POST') {
      const b = await readBody(req, 256), p = S.profileByHandle(String(b.handle || '').replace(/^@+/, ''));
      if (!p || p.uid === me) return fail(res, 404, 'Profil introuvable.');
      S.setBlock(me, p.uid, b.on !== false);
      if (b.on !== false) { S.delFriend(me, p.uid); S.delFriend(p.uid, me); }
      emit(me, 'unread', { n: S.dmUnread(me) });
      return send(res, 200, { ok: true, blocked: S.iBlocked(me, p.uid) });
    }
    if (r === 'report' && m === 'POST') {
      const w = limit('sr:' + me, 10, HOUR); if (w) return fail(res, 429, 'Trop de signalements. Merci, l\'équipe regarde.');
      const b = await readBody(req, 1024), p = S.profileByHandle(String(b.handle || '').replace(/^@+/, ''));
      if (!p || p.uid === me) return fail(res, 404, 'Profil introuvable.');
      const mid = Number(b.msg) || 0, mm = mid ? S.dmMessage(mid) : null;
      if (mm && mm.conv !== S.convKey(me, p.uid)) return fail(res, 400, 'Message inconnu.');
      S.addDmReport(me, p.uid, mm ? mm.id : null, clean(b.reason, 200) || 'Signalement');
      counters.reports = (counters.reports || 0) + 1;
      return send(res, 200, { ok: true });
    }

    /* --- notifications --- */
    if (r === 'push/subscribe' && m === 'POST') {
      const w = limit('pu:' + me, 20, HOUR); if (w) return fail(res, 429, 'Trop d\'essais.');
      const b = await readBody(req, 2048), ep = String(b.endpoint || '');
      if (!endpointOk(ep)) return fail(res, 400, 'Abonnement invalide.');
      if (S.pushOf(me).length >= 5) S.pushOf(me).slice(0, 1).forEach((e) => S.delPush(e));
      S.addPush(ep, me); return send(res, 200, { ok: true });
    }
    if (r === 'push/unsubscribe' && m === 'POST') { const b = await readBody(req, 2048); const ep = String(b.endpoint || ''); if (S.pushOf(me).indexOf(ep) >= 0) S.delPush(ep); return send(res, 200, { ok: true }); }
    if (r === 'notify-preview' && m === 'GET') {
      const groups = S.dmUnreadFrom(me), total = groups.reduce((a, g) => a + g.n, 0), pr = S.profile(me);
      if (!total) return send(res, 200, { title: 'neV.BOOSTER', body: 'Tu n\'as pas de nouveau message.', url: 'social.html', tag: 'dm', count: 0 });
      if (groups.length === 1) {
        const o = OTHER(groups[0].uid), last = S.dmMessage(groups[0].last);
        const body = pr.preview ? (last && last.text ? last.text.slice(0, 90) : '📷 Image') : (total > 1 ? total + ' nouveaux messages' : 'Nouveau message');
        return send(res, 200, { title: '@' + o.handle, body, url: 'social.html#/messages/' + o.handle, tag: 'dm', count: total });
      }
      return send(res, 200, { title: 'neV.BOOSTER', body: total + ' nouveaux messages de ' + groups.length + ' joueurs', url: 'social.html#/messages', tag: 'dm', count: total });
    }

    /* --- flux temps réel --- */
    if (r === 'stream' && m === 'GET') {
      let set = streams.get(me); if (!set) { set = new Set(); streams.set(me, set); }
      if (set.size >= 4) { const old = set.values().next().value; try { old.end(); } catch (e) { /* ignoré */ } set.delete(old); }
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write('retry: 4000\nevent: hello\ndata: ' + JSON.stringify({ unread: S.dmUnread(me), requests: S.incomingRequests(me).length }) + '\n\n');
      set.add(res);
      req.on('close', () => { set.delete(res); if (!set.size) streams.delete(me); });
      return true;
    }
    return fail(res, 404, 'Introuvable.');
  };
};
