/* ==========================================================
   neV.BOOSTER — ui.js : en-tête, barre du bas, messages
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const doc = g.document;
  const esc = NEV.util.esc;

  const I = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
    quest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.4 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>',
    gacha: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="11" height="16" rx="2" transform="rotate(-8 10 11)"/><rect x="9" y="5" width="11" height="16" rx="2" transform="rotate(8 14 13)"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/><path d="M9 8h6"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/></svg>',
    spark: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l2.2 6.8L21 10l-6.8 2.2L12 19l-2.2-6.8L3 10l6.8-2.2z"/></svg>',
    flame: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s5 4.4 5 9.5A5 5 0 0112 17a5 5 0 01-5-5.5c0-1.6.7-2.9 1.6-3.9C9 10 10 11 11 11c0-3-.4-6 1-9zM12 22a6 6 0 01-6-6c0 0 1.3 1.8 3 2 .2 2 1.4 2.6 3 2.6s2.8-.6 3-2.6c1.7-.2 3-2 3-2a6 6 0 01-6 6z"/></svg>'
  };
  const svgi = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';
  I.more = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>';
  I.gift = svgi('M4 11h16v9H4zM3 8h18v3H3zM12 8v12M12 8c-2-4-6-3-5 0M12 8c2-4 6-3 5 0');
  I.leaf = svgi('M5 19c0-9 5-14 15-14 0 9-5 14-13 14M5 19c3-5 6-7 10-9');
  I.list = svgi('M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01');
  I.body = svgi('M12 4a2 2 0 100 .01M7 9l5 1.5L17 9M12 10.5V15M12 15l-3 6M12 15l3 6');
  I.apple = svgi('M12 7c-2-2-6-1-6 4 0 4 2 9 4 9 1 0 1.5-.6 2-.6s1 .6 2 .6c2 0 4-5 4-9 0-5-4-6-6-4zM12 7c0-2 1-3 3-4');
  I.cube = svgi('M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9');
  I.help = svgi('M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2-2.5 3.5M12 17h.01M12 3a9 9 0 100 18 9 9 0 000-18z');
  I.settings = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>';
  I.me = svgi('M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6');
  I.out = svgi('M9 4H5v16h4M16 8l4 4-4 4M20 12H9');
  // [id, page, nom, icône, barre du haut (ordi), barre du bas (téléphone)]
  const LINKS = [
    ['accueil', 'accueil.html', 'Accueil', I.home, 1, 1],
    ['quete', 'quete.html', 'Quête', I.quest, 1, 1],
    ['gacha', 'gacha.html', 'Gacha', I.gacha, 1, 1],
    ['gacha-box', 'gacha-box.html', 'Gacha Box', I.cube, 1, 0],
    ['specialisation', 'specialisation.html', 'Spécialisation', I.body, 1, 1],
    ['bibliotheque', 'bibliotheque.html', 'Exercices', I.book, 1, 0],
    ['programmes', 'programmes.html', 'Programmes', I.list, 1, 0],
    ['conseils', 'conseils.html', 'Conseils', I.leaf, 0, 0],
    ['alimentation', 'alimentation.html', 'Alimentation', I.apple, 0, 0],
    ['chat', 'chat.html', 'Chat', I.chat, 0, 0],
    ['classement', 'classement.html', 'Classement', I.gift, 0, 0],
    ['recompenses', 'recompenses.html', 'Récompenses', I.gift, 0, 0],
    ['tuto', 'tuto.html', 'Tuto', I.help, 0, 0],
    ['compte', 'compte.html', 'Mon compte', I.me, 0, 0]
  ];

  const lk = (l, inner, active) => '<a href="' + l[1] + '" data-go' + (l[0] === active ? ' class="on" aria-current="page"' : '') + '>' + inner + '</a>';

  const DESC = {
    accueil: 'Ton tableau de bord', quete: 'Objectifs du jour et combo du coach', gacha: 'Ton tirage quotidien', 'gacha-box': 'La boîte mystère en 3D : 4 cartes', specialisation: 'Cible une zone du corps',
    bibliotheque: 'Tous les exercices, animés', programmes: 'Des enchaînements prêts à faire', conseils: 'Sécurité, sommeil, récupération',
    alimentation: 'Manger pour progresser', chat: 'Parle au coach et aux joueurs', recompenses: 'Flammes, badges, parrainage', classement: 'Défi de la semaine, saison, amis', tuto: 'Le guide pas à pas', compte: 'Tes données, export, suppression'
  };
  I.menu = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 8h16M4 16h16"/></svg>';
  I.close = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  /* En-tête aéré (logo, flammes, bouton Menu) + grand menu : une carte par page. Plus de barre de liens serrée. */
  function chrome(active, pp, pub) {
    const user = NEV.auth.current();
    const p = pp || (user && !pub ? NEV.player.load() : null);
    const streak = p ? p.progress.streak : 0;
    const tile = (l) => '<a class="mt' + (l[0] === active ? ' on' : '') + '" href="' + l[1] + '" data-go' + (l[0] === active ? ' aria-current="page"' : '') + '>' + l[3] + '<b>' + l[2] + '</b><small>' + (DESC[l[0]] || '') + '</small></a>';
    const tiles = LINKS.map(tile).join('') +
      (user ? '<a class="mt" href="niveau.html?step=2" data-go>' + I.settings + '<b>Réglages</b><small>Niveau, matériel, séries</small></a><button type="button" class="mt sheetOut">' + I.out + '<b>Quitter</b><small>Se déconnecter</small></button>' : '');
    const hdr = doc.createElement('header');
    hdr.className = 'hdr';
    hdr.innerHTML = '<div class="wrap"><a class="logo" href="' + (user ? 'accueil.html' : 'connexion.html') + '" data-go>neV<span>.</span>BOOSTER</a>' +
      '<div class="me">' + (user && !pub
        ? '<a class="flame" href="recompenses.html" data-go title="Jours d\'entraînement d\'affilée">' + I.flame + '<b id="meStreak">' + streak + '</b></a><a class="spark" href="recompenses.html" data-go title="Tes flammes de connexion">' + I.spark + '<b id="meFlames">' + (p ? p.flames : 0) + '</b></a>'
        : (user ? '' : '<a class="btn sm" href="connexion.html" data-go>Se connecter</a>')) +
      '<button type="button" class="menuBtn" aria-haspopup="dialog" aria-expanded="false" aria-controls="navMenu" aria-label="Menu">' + I.menu + '<span>Menu</span></button></div></div>';
    const menu = doc.createElement('div'); menu.className = 'navmenu'; menu.id = 'navMenu'; menu.hidden = true; menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-modal', 'true'); menu.setAttribute('aria-label', 'Menu du site');
    menu.innerHTML = '<div class="navbox"><div class="navtop"><div><div class="eyebrow">Menu</div><h2>Où veux-tu aller ?</h2></div><button type="button" class="navclose" aria-label="Fermer le menu">' + I.close + '</button></div><div class="mts">' + tiles + '</div></div>';
    const help = doc.createElement('a'); help.className = 'helpfab'; help.href = 'tuto.html'; help.setAttribute('data-go', ''); help.setAttribute('aria-label', 'Aide : le tuto du site'); help.title = 'Je suis perdu ? Le tuto'; help.textContent = '?';
    doc.body.insertBefore(hdr, doc.body.firstChild);
    doc.body.appendChild(menu);
    if (active !== 'tuto') doc.body.appendChild(help);
    if (!doc.querySelector('.sitefoot')) {
      const foot = doc.createElement('footer'); foot.className = 'sitefoot';
      foot.innerHTML = '<div class="wrap"><span>neV.BOOSTER · Booste ton quotidien</span><nav aria-label="Informations légales"><a href="conditions.html" data-go>Conditions</a><a href="confidentialite.html" data-go>Confidentialité</a><a href="mentions-legales.html" data-go>Mentions légales</a><a href="histoire.html" data-go>Son histoire en 3D</a>' + (user ? '<a href="compte.html" data-go>Mon compte</a>' : '') + '</nav></div>';
      doc.body.appendChild(foot);
    }
    const logout = function () { NEV.auth.logout(); NEV.go('connexion.html'); };
    const so = menu.querySelector('.sheetOut'); if (so) so.addEventListener('click', logout);
    const btn = hdr.querySelector('.menuBtn');
    const setMenu = function (open) {
      menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); doc.documentElement.classList.toggle('menu-open', open);
      if (open) { const f = menu.querySelector('.mt.on') || menu.querySelector('.mt'); if (f) f.focus({ preventScroll: true }); } else btn.focus({ preventScroll: true });
    };
    btn.addEventListener('click', function (e) { e.stopPropagation(); setMenu(menu.hidden); });
    menu.querySelector('.navclose').addEventListener('click', function () { setMenu(false); });
    menu.addEventListener('click', function (e) { if (e.target === menu) setMenu(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
    const a = NEV.cfg && NEV.cfg.announce;
    if (a && a.text) {
      let seen = null; try { seen = g.sessionStorage.getItem('nev.ann'); } catch (e) { /* ignoré */ }
      if (String(seen) !== String(a.t)) {
        const bar = doc.createElement('div'); bar.className = 'announce'; bar.setAttribute('role', 'status');
        bar.innerHTML = '<b>Annonce du coach</b><span></span><button type="button" aria-label="Fermer">×</button>';
        bar.querySelector('span').textContent = a.text;
        bar.querySelector('button').addEventListener('click', function () { bar.remove(); try { g.sessionStorage.setItem('nev.ann', String(a.t)); } catch (e) { /* ignoré */ } });
        hdr.after(bar);
      }
    }
  }

  /* Pages ouvertes à tous (tuto, conseils…) : pas de redirection vers la connexion. */
  async function bootPublic(active) {
    await NEV.cloud.ready;
    const user = await NEV.cloud.sync();
    let cfg = { combos: [], badges: [], announce: null };
    if (user) { try { cfg = (await NEV.cloud.config()) || cfg; } catch (e) { /* hors ligne */ } }
    NEV.cfg = cfg;
    if (NEV.Rewards) NEV.Rewards.setCustom(cfg.badges);
    const p = user ? NEV.player.load() : null;
    chrome(active, p, !user);
    return { user: user, p: p, cfg: cfg };
  }

  /* Démarrage commun des pages : mode serveur/local, session, niveau, flammes du jour, en-tête. */
  async function boot(active, opts) {
    opts = opts || {};
    await NEV.cloud.ready;
    const user = await NEV.cloud.sync();
    if (!user) { NEV.go('connexion.html', 0); return null; }
    let cfg = { combos: [], badges: [], announce: null };
    try { cfg = (await NEV.cloud.config()) || cfg; } catch (e) { /* hors ligne */ }
    NEV.cfg = cfg;
    if (NEV.Rewards) NEV.Rewards.setCustom(cfg.badges);
    const p = NEV.player.load();
    if (opts.needLevel !== false && !p.maxPushups) { NEV.go('niveau.html', 0); return null; }
    let fx = null;
    if (NEV.Rewards && opts.needLevel !== false) fx = NEV.Rewards.run(p, user);
    if (opts.chrome !== false) chrome(active, p);
    if (fx && (fx.daily || fx.refs.length || fx.badges.length || (fx.gifts && fx.gifts.length)) && !opts.quiet) setTimeout(function () { NEV.Rewards.popups(fx); }, 700);
    return { user: user, p: p, cfg: cfg };
  }

  let toastEl, toastT;
  function toast(msg, ms) {
    if (!toastEl) { toastEl = doc.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); doc.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 2600);
  }

  /* Accessibilité : repères de page, ordre des titres, zones défilantes au clavier.
     Corrections appliquées à tout le site, y compris au contenu affiché ensuite par les pages. */
  function a11y() {
    const pg = doc.querySelector('.page');
    if (pg && !doc.querySelector('main,[role=main]')) pg.setAttribute('role', 'main');
    const hf = doc.querySelector('.helpfab'); if (hf && !hf.closest('nav,aside,[role]')) { const w = doc.createElement('nav'); w.setAttribute('aria-label', 'Aide'); hf.parentNode.insertBefore(w, hf); w.appendChild(hf); }
    let prev = 0;
    doc.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]').forEach(function (h) {
      let lv = h.getAttribute('aria-level') ? Number(h.getAttribute('aria-level')) : (h.tagName.charAt(0) === 'H' ? Number(h.tagName.charAt(1)) : 2);
      if (prev && lv > prev + 1) { lv = prev + 1; h.setAttribute('role', 'heading'); h.setAttribute('aria-level', String(lv)); }
      prev = lv;
    });
    doc.querySelectorAll('.tablewrap,.ftab').forEach(function (t, i) { if (t.scrollWidth > t.clientWidth && !t.hasAttribute('tabindex')) { t.setAttribute('tabindex', '0'); if (!t.hasAttribute('role')) t.setAttribute('role', 'region'); if (!t.hasAttribute('aria-label')) t.setAttribute('aria-label', 'Tableau ' + (i + 1) + ', défile horizontalement'); } });
  }
  let a11yT = null;
  const a11yLater = function () { clearTimeout(a11yT); a11yT = setTimeout(a11y, 250); };
  doc.addEventListener('DOMContentLoaded', a11yLater); g.addEventListener('load', a11yLater);
  if (g.MutationObserver) new g.MutationObserver(a11yLater).observe(doc.documentElement, { childList: true, subtree: true });

  NEV.ui = { chrome, toast, icons: I, a11y };
  NEV.boot = boot;
  NEV.bootPublic = bootPublic;
})(window);
