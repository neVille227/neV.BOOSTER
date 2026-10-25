/* ==========================================================
   neV.BOOSTER — rewards.js
   Motivation : flammes de connexion, badges, parrainage, auras.
   - À chaque jour de connexion : +1 flamme (bonus aux paliers 7 et 30 jours).
   - Les badges se débloquent tout seuls selon des règles ; l'admin peut en
     créer d'autres (page admin) ou en offrir à la main.
   - Parrainage : un code par joueur ; le parrain gagne 50 flammes par filleul,
     le filleul 20 flammes de bienvenue.
   - Les flammes s'échangent contre des auras pour le héros.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const doc = g.document, util = NEV.util, esc = NEV.util.esc;

  const REF_BONUS = 50, WELCOME_BONUS = 20;

  /* ---------- pictogrammes (grille 24) ---------- */
  const ICONS = {
    flame: 'M12 2.5c.9 3.6 5.2 5.6 5.2 10.4a5.2 5.2 0 01-10.4 0c0-1.8.8-3.2 1.8-4.2.2 1.6.9 2.6 1.9 3C10 8.7 10.6 5.6 12 2.5z',
    bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
    star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.4 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
    heart: 'M12 20s-7-4.6-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.4-7 10-7 10z',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    crown: 'M3 18l1.5-10 5 5L12 5l2.5 8 5-5L21 18z',
    dumbbell: 'M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12',
    target: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8z',
    people: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 100-5M18 14c2 .4 3.5 2.4 3.5 5',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
    moon: 'M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z',
    drop: 'M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z',
    trophy: 'M8 4h8v5a4 4 0 01-8 0zM8 6H4v2a4 4 0 004 4M16 6h4v2a4 4 0 01-4 4M12 13v4M8 20h8M10 17h4',
    gift: 'M4 11h16v9H4zM3 8h18v3H3zM12 8v12M12 8c-2-4-6-3-5 0M12 8c2-4 6-3 5 0',
    shield: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z'
  };
  const FILLED = { flame: 1, bolt: 1, star: 1, heart: 1, crown: 1, moon: 1, drop: 1 };

  const SHAPES = {
    shield: 'M50 5L89 18V50C89 74 71 90 50 96 29 90 11 74 11 50V18Z',
    hex: 'M50 4L90 27V73L50 96 10 73V27Z',
    circle: 'M50 6a44 44 0 100 88 44 44 0 100-88z',
    star: (function () { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 22 : 46; d += (i ? 'L' : 'M') + (50 + r * Math.cos(a)).toFixed(1) + ' ' + (52 + r * Math.sin(a)).toFixed(1); } return d + 'Z'; })(),
    flame: 'M50 3C57 22 84 34 84 62 84 82 69 96 50 96 31 96 16 82 16 62 16 47 27 39 33 28 36 38 42 43 47 41 44 28 46 14 50 3Z',
    diamond: 'M50 4L92 50 50 96 8 50Z'
  };
  let uid = 0;
  /* Dessine un badge en SVG. def = {shape, icon, text, c1, c2} */
  function badgeSVG(def, size, locked) {
    const id = 'bg' + (++uid), shape = SHAPES[def.shape] || SHAPES.shield;
    const c1 = def.c1 || '#e0455f', c2 = def.c2 || '#7a0f26';
    const gray = locked ? ' style="filter:grayscale(1) brightness(.5)"' : '';
    let inner = '';
    if (def.text) inner = '<text x="50" y="' + (def.text.length > 2 ? 62 : 64) + '" text-anchor="middle" font-family="Montserrat,system-ui,sans-serif" font-weight="900" font-size="' + (def.text.length > 3 ? 20 : def.text.length > 2 ? 26 : def.text.length > 1 ? 34 : 40) + '" fill="#fff" stroke="#00000033" stroke-width="1">' + esc(def.text) + '</text>';
    else if (ICONS[def.icon]) {
      const f = FILLED[def.icon];
      inner = '<g transform="translate(26 28) scale(2)"><path d="' + ICONS[def.icon] + '" fill="' + (f ? '#fff' : 'none') + '" stroke="#fff" stroke-width="' + (f ? 1 : 1.9) + '" stroke-linecap="round" stroke-linejoin="round"/></g>';
    }
    return '<svg class="badge-svg" viewBox="0 0 100 100" width="' + (size || 72) + '" height="' + (size || 72) + '" role="img" aria-label="' + esc(def.name || 'Badge') + '"' + gray + '>' +
      '<defs><linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + esc(c1) + '"/><stop offset="1" stop-color="' + esc(c2) + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + shape + '" fill="url(#' + id + 'a)" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="' + shape + '" fill="url(#' + id + 'b)"/>' + inner + '</svg>';
  }

  /* ---------- badges de base ---------- */
  const B = (id, name, desc, shape, icon, text, c1, c2, t, v) => ({ id, name, desc, shape, icon, text, c1, c2, rule: { t, v }, base: true });
  const FIRE = ['#ffb04a', '#c2410c'], RUBY = ['#ff4a63', '#7a0f26'], GOLD = ['#ffd45e', '#a8690f'], STEEL = ['#c9d2e0', '#566077'], VIOLET = ['#c06bff', '#5b1a8c'], GREEN = ['#3ddc84', '#0f6a3a'];
  const DEFAULT_BADGES = [
    B('t1', 'Premier pas', 'Première séance terminée.', 'circle', 'check', '', RUBY[0], RUBY[1], 'total', 1),
    B('s3', 'Étincelle', '3 jours d\'entraînement d\'affilée.', 'flame', 'flame', '', FIRE[0], FIRE[1], 'streak', 3),
    B('s7', 'Semaine de feu', '7 jours d\'entraînement d\'affilée.', 'flame', '', '7', FIRE[0], FIRE[1], 'streak', 7),
    B('s14', 'Deux semaines', '14 jours d\'affilée.', 'shield', '', '14', RUBY[0], RUBY[1], 'streak', 14),
    B('s30', 'Mois de fer', '30 jours d\'affilée.', 'shield', '', '30', STEEL[0], STEEL[1], 'streak', 30),
    B('s60', 'Inarrêtable', '60 jours d\'affilée.', 'hex', '', '60', GOLD[0], GOLD[1], 'streak', 60),
    B('s100', 'Centurion', '100 jours d\'affilée.', 'star', 'crown', '', GOLD[0], GOLD[1], 'streak', 100),
    B('t10', 'Régulier', '10 séances validées.', 'hex', '', '10', RUBY[0], RUBY[1], 'total', 10),
    B('t25', 'Habitué', '25 séances validées.', 'hex', '', '25', FIRE[0], FIRE[1], 'total', 25),
    B('t50', 'Vétéran', '50 séances validées.', 'hex', '', '50', STEEL[0], STEEL[1], 'total', 50),
    B('t100', '100 séances', '100 séances validées.', 'star', 'trophy', '', GOLD[0], GOLD[1], 'total', 100),
    B('l3', 'Fidèle', '3 jours de connexion d\'affilée.', 'circle', 'bolt', '', '#ffd45e', '#c2410c', 'loginstreak', 3),
    B('l7', 'Assidu', '7 jours de connexion d\'affilée.', 'circle', 'flame', '', FIRE[0], FIRE[1], 'loginstreak', 7),
    B('l30', 'Pilier', '30 jours de connexion d\'affilée.', 'diamond', 'flame', '', RUBY[0], RUBY[1], 'loginstreak', 30),
    B('w1', 'Bienvenue', 'Tu as rejoint neV.BOOSTER grâce à un parrain.', 'circle', 'gift', '', '#ff8aa0', '#8e1230', 'welcomed', 1),
    B('r1', 'Recruteur', 'Un ami s\'est inscrit avec ton code.', 'circle', 'people', '', GREEN[0], GREEN[1], 'referrals', 1),
    B('r3', 'Capitaine', '3 amis parrainés.', 'shield', 'people', '', GREEN[0], GREEN[1], 'referrals', 3),
    B('r10', 'Chef de meute', '10 amis parrainés.', 'star', 'people', '', GOLD[0], GOLD[1], 'referrals', 10),
    B('e3', 'Chasseur d\'Épique', 'Tu as tiré une carte Épique.', 'diamond', 'star', '', RUBY[0], RUBY[1], 'tier', 3),
    B('e4', 'Légendaire', 'Tu as tiré une carte Légendaire.', 'diamond', 'star', '', GOLD[0], GOLD[1], 'tier', 4),
    B('e5', 'Mythique !', 'Tu as tiré une carte Mythique : très rare.', 'diamond', 'star', '', VIOLET[0], VIOLET[1], 'tier', 5),
    B('c15', 'Collectionneur', '15 exercices différents tirés.', 'hex', 'target', '', STEEL[0], STEEL[1], 'collection', 15),
    B('c30', 'Encyclopédie', '30 exercices différents tirés.', 'hex', 'target', '', GOLD[0], GOLD[1], 'collection', 30),
    B('ph', 'Phénix', 'Journée ratée… puis enchaînement doublé réussi.', 'flame', 'bolt', '', '#ff6a4d', '#7a0f26', 'doubled', 1),
    B('cam', 'Œil de lynx', '10 séances validées par la caméra.', 'circle', 'eye', '', GREEN[0], GREEN[1], 'verified', 10),
    B('p50', 'Pompes 50', 'Maximum de 50 pompes ou plus.', 'shield', 'dumbbell', '', RUBY[0], RUBY[1], 'pushups', 50),
    B('x1000', '1000 XP', 'Tu as gagné 1000 XP.', 'hex', 'bolt', '', GOLD[0], GOLD[1], 'xp', 1000)
  ];

  const RULES = {
    streak: { label: 'Série d\'entraînement (jours)', get: (p) => Math.max(p.progress.streak, p.progress.best) },
    total: { label: 'Séances validées', get: (p) => p.progress.total },
    xp: { label: 'XP gagnés', get: (p) => p.progress.xp },
    loginstreak: { label: 'Série de connexion (jours)', get: (p) => Math.max(p.login.streak, p.login.best) },
    referrals: { label: 'Amis parrainés', get: (p) => p.ref.count },
    tier: { label: 'Rareté tirée (1 à 5)', get: (p) => p.history.reduce((a, h) => Math.max(a, h.tier || 0), 0) },
    collection: { label: 'Exercices différents tirés', get: (p) => Object.keys(p.collection).length },
    doubled: { label: 'Enchaînements doublés réussis', get: (p) => p.history.filter((h) => h.doubled).length },
    verified: { label: 'Séances validées par caméra', get: (p) => p.history.filter((h) => h.verified).length },
    pushups: { label: 'Maximum de pompes', get: (p) => p.maxPushups || 0 },
    flames: { label: 'Flammes gagnées au total', get: (p) => p.flamesTotal },
    welcomed: { label: 'Inscrit avec un code de parrain', get: (p) => (p.ref.by ? 1 : 0) },
    manual: { label: 'Offert à la main par l\'admin', get: () => 0 }
  };

  let custom = [];
  const defs = () => DEFAULT_BADGES.concat(custom.map((b) => Object.assign({}, b, { custom: true })));
  const earned = (p, d) => !!(RULES[d.rule && d.rule.t] && d.rule.t !== 'manual' && RULES[d.rule.t].get(p) >= Number(d.rule.v));

  /* ---------- auras du héros (contre des flammes) ---------- */
  const AURAS = [
    { id: 'none', name: 'Aucune', cost: 0, c: ['#e0455f', '#7a0f26'] },
    { id: 'braise', name: 'Braise', cost: 10, c: ['#ff8a3d', '#e0455f'] },
    { id: 'rubis', name: 'Rubis', cost: 25, c: ['#ff4a63', '#a3153a'] },
    { id: 'or', name: 'Or', cost: 50, c: ['#ffd45e', '#f0b24a'] },
    { id: 'foudre', name: 'Foudre', cost: 80, c: ['#8ec5ff', '#ffffff'] },
    { id: 'mythe', name: 'Mythe', cost: 150, c: ['#c06bff', '#ffd1ff'] }
  ];

  /* ---------- flammes de connexion ---------- */
  function daily(p, today) {
    today = today || util.todayStr();
    const l = p.login;
    if (l.last === today) return null;
    const gap = l.last ? util.daysBetween(l.last, today) : 0;
    l.streak = l.last && gap === 1 ? l.streak + 1 : 1;
    l.best = Math.max(l.best, l.streak);
    l.days.push(today); l.days = l.days.slice(-90);
    let gain = 1, milestone = null;
    if (l.streak % 30 === 0) { gain += 10; milestone = l.streak + ' jours de connexion'; } else if (l.streak % 7 === 0) { gain += 4; milestone = l.streak + ' jours de connexion'; }
    l.last = today;
    p.flames += gain; p.flamesTotal += gain;
    return { gain, streak: l.streak, milestone, lost: l.streak === 1 && gap > 1 };
  }

  /* ---------- parrainage (récompenses dues) ---------- */
  function syncRef(p, user) {
    const out = [];
    if (p.ref.by && !p.ref.welcomed) { p.ref.welcomed = true; p.flames += WELCOME_BONUS; p.flamesTotal += WELCOME_BONUS; out.push({ gain: WELCOME_BONUS, why: 'Bienvenue : tu as utilisé un code de parrain.' }); }
    const c = (user && user.refCount) || 0;
    if (c > p.ref.paid) {
      const n = c - p.ref.paid, gain = n * REF_BONUS;
      p.ref.paid = c; p.flames += gain; p.flamesTotal += gain;
      out.push({ gain, why: n + (n > 1 ? ' amis ont rejoint' : ' ami a rejoint') + ' neV.BOOSTER avec ton code !' });
    }
    p.ref.count = c;
    return out;
  }

  /* Attribue les badges mérités. Renvoie les nouveaux. */
  function check(p, today) {
    today = today || util.todayStr();
    const fresh = [];
    defs().forEach((d) => { if (!p.badges[d.id] && earned(p, d)) { p.badges[d.id] = today; fresh.push(d); } });
    return fresh;
  }

  function run(p, user) {
    const fx = { daily: daily(p), refs: syncRef(p, user), badges: [], gifts: [] };
    fx.badges = check(p);
    // cadeaux de l'admin (flammes / tirages bonus) : déjà ajoutés par le serveur, on les annonce une fois
    (p.gifts || []).forEach(function (g) { if (!g.seen) { g.seen = true; fx.gifts.push(g); } });
    if (fx.daily || fx.refs.length || fx.badges.length || fx.gifts.length) NEV.player.save(p);
    return fx;
  }

  /* ---------- fenêtre de fête ---------- */
  function popup(o) { // {title, sub, flames, badge, big}
    return new Promise(function (resolve) {
      const el = doc.createElement('div');
      el.className = 'fx-pop'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-live', 'polite');
      let em = '';
      for (let i = 0; i < 14; i++) em += '<i style="--x:' + (Math.random() * 100).toFixed(0) + '%;--d:' + (Math.random() * 1.6).toFixed(2) + 's;--s:' + (0.6 + Math.random() * 0.9).toFixed(2) + '"></i>';
      el.innerHTML = '<div class="embers" aria-hidden="true">' + em + '</div><div class="card">' +
        (o.badge ? '<div class="bd">' + badgeSVG(o.badge, 120) + '</div>' : '<div class="fl">' + NEV.ui.icons.flame.replace('width="14" height="14"', 'width="64" height="64"') + '</div>') +
        '<div class="eyebrow">' + esc(o.kicker || '') + '</div><h3>' + esc(o.title) + '</h3><p>' + esc(o.sub || '') + '</p>' +
        (o.flames ? '<div class="gain">+' + o.flames + ' flamme' + (o.flames > 1 ? 's' : '') + '</div>' : '') +
        '<button class="btn" type="button">Continuer</button></div>';
      doc.body.appendChild(el);
      requestAnimationFrame(function () { el.classList.add('on'); });
      const close = function () { el.classList.remove('on'); setTimeout(function () { el.remove(); resolve(); }, 350); };
      el.querySelector('button').addEventListener('click', close);
      el.addEventListener('click', function (e) { if (e.target === el) close(); });
      setTimeout(function () { const b = el.querySelector('button'); if (b) b.focus(); }, 400);
    });
  }
  async function popups(fx) {
    if (fx.daily) {
      await popup({ kicker: 'Flamme du jour', title: fx.daily.streak > 1 ? fx.daily.streak + ' jours de connexion !' : 'Bienvenue !', sub: fx.daily.milestone ? 'Palier atteint : ' + fx.daily.milestone + '. Bonus de flammes !' : (fx.daily.lost ? 'Une nouvelle série démarre aujourd\'hui.' : 'Reviens demain pour allonger ta série de connexion.'), flames: fx.daily.gain });
    }
    for (const r of fx.refs) await popup({ kicker: 'Parrainage', title: 'Récompense reçue', sub: r.why, flames: r.gain });
    for (const g of (fx.gifts || [])) {
      const parts = []; if (g.flames) parts.push(g.flames + ' flamme' + (g.flames > 1 ? 's' : '')); if (g.draws) parts.push(g.draws + ' tirage' + (g.draws > 1 ? 's' : '') + ' de gacha bonus');
      await popup({ kicker: 'Cadeau du coach', title: 'Tu as reçu un cadeau !', sub: (g.note ? g.note + ' — ' : '') + parts.join(' et ') + '.', flames: g.flames || 0 });
    }
    for (const b of fx.badges) await popup({ kicker: 'Nouveau badge', title: b.name, sub: b.desc, badge: b });
  }

  function setCustom(list) { custom = Array.isArray(list) ? list : []; }
  function buyAura(p, id) {
    const a = AURAS.find((x) => x.id === id);
    if (!a) return { ok: false, error: 'Aura inconnue.' };
    if (p.auras.indexOf(id) >= 0) { p.aura = id; return { ok: true }; }
    if (p.flames < a.cost) return { ok: false, error: 'Il te manque ' + (a.cost - p.flames) + ' flammes.' };
    p.flames -= a.cost; p.auras.push(id); p.aura = id;
    return { ok: true };
  }

  NEV.Rewards = { ICONS, SHAPES, RULES, AURAS, DEFAULT_BADGES, REF_BONUS, WELCOME_BONUS, defs, setCustom, badgeSVG, earned, daily, syncRef, check, run, popup, popups, buyAura,
    aura: (id) => AURAS.find((a) => a.id === id) || AURAS[0] };
})(window);
