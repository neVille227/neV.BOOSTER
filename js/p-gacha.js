/* neV.BOOSTER — page Gacha (une seule page pour tout le tirage)
   Parcours : boîte mystérieuse → tirage simple (1 carte) ou multiple (4 cartes) → catégorie → TIRER →
   la boîte s'avance en 3D, s'immobilise, le couvercle s'ouvre, la lumière jaillit, les cartes sortent → révélation → validation.
   Règle d'or : le tirage est fait par le moteur (NEV.Gacha.ensureCard / ensureBox) et ENREGISTRÉ avant la moindre animation ;
   l'animation ne fait que le montrer. Recharger la page ne permet donc jamais de retirer.
   Deux événements sont émis pour d'éventuels outils externes : « nvb:gacha-draw » et « nvb:gacha-validate ». */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, sleep = NEV.util.sleep, reduced = NEV.util.reduced();
  const G = NEV.Gacha;
  const qs = new URLSearchParams(location.search);

  /* ---------- contexte : visiteur (?visiteur=m|f), Spécialisation (?mode=spe&zone=…) ou joueur connecté ---------- */
  const GUEST = qs.get('visiteur') === 'f' ? 'f' : qs.get('visiteur') === 'm' ? 'm' : '';
  let ctx;
  if (GUEST) {
    ctx = await NEV.bootPublic('gacha');
    if (ctx.user) { location.replace('gacha.html'); return; }   // déjà connecté : le vrai tirage
    ctx.p = NEV.player.blank(); ctx.user = { id: 'visiteur', guest: true };
    ctx.p.sex = GUEST; ctx.p.maxPushups = GUEST === 'f' ? 8 : 15; ctx.p.level = 1;
    NEV.track = function () {};
  } else {
    ctx = await NEV.boot('gacha'); if (!ctx) return;
  }
  const user = ctx.user, p = ctx.p;
  NEV.player.ensureDay(p); if (!GUEST) NEV.player.save(p);
  const SPE = !GUEST && qs.get('mode') === 'spe';
  let ZONE = qs.get('zone') || 'all';
  if (SPE) { if (p.spe.card && p.spe.zone) ZONE = p.spe.zone; if (ZONE !== 'all' && !NEV.Zones.get(ZONE)) ZONE = 'all'; }
  const zoneObj = SPE && ZONE !== 'all' ? NEV.Zones.get(ZONE) : null;
  const SIGNUP = 'connexion.html?sex=' + GUEST;
  const CFG = Object.assign({ heroImage: '' }, window.NVB_GACHA || {});

  /* ---------- éléments ---------- */
  const gx = $('gx'), stage = $('gxStage'), cardsEl = $('gxCards'), rays = $('gxRays'), hint = $('gxHint'), banner = $('gxBanner'), hero = $('gxHero'), flashEl = $('gxFlash');
  const parts = [$('gxBack'), $('gxFront'), $('gxLid')];
  const VIEWS = { idle: 'vIdle', busy: 'vBusy', result: 'vResult', confirm: 'vConfirm', done: 'vDone' };
  const S = { mode: 'single', cat: 'all', cards: [], els: [], sel: new Set(), timers: [], anims: [], busy: false, skipped: false, L: null, fresh: false };

  /* ---------- textes et données d'affichage ---------- */
  const tierName = (t) => (NEV.Ex.TIER_NAMES && NEV.Ex.TIER_NAMES[t]) || '';
  const plural = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');
  const rarOf = (c) => (c.special ? G.SPECIALS[c.special] : G.RARITIES[Math.max(0, Math.min(4, (c.tier || 1) - 1))]);
  const tOf = (c) => (c.special ? 4 : (c.tier || 1));
  const codeOf = (c) => (c.special ? 'UR' : rarOf(c).code);
  const planText = (c) => {
    if (c.type === 'combo') return plural(c.steps.length, 'exercice') + ' à la suite';
    const pl = c.plan;
    if (c.special === 'repos') return 'Repos actif · ' + Math.round(pl.perSet / 6) / 10 + ' min';
    return plural(pl.sets, 'série') + ' × ' + NEV.Ex.amountText(pl.unit, pl.perSet);
  };
  const faceOf = (c) => (c.type === 'combo' ? NEV.Card.combo(c, { diff: tierName(c.tier) }) : NEV.Card.ofCard(c, { diff: c.special ? '' : tierName(c.tier) }));
  const hexRgb = (h) => { const v = parseInt(h.slice(1), 16); return (v >> 16 & 255) + ',' + (v >> 8 & 255) + ',' + (v & 255); };
  const say = (t) => { const l = $('gxLive'); l.textContent = ''; setTimeout(() => { l.textContent = t; }, 30); };
  const flat = (cards) => { const o = []; cards.forEach((c) => (c.type === 'combo' ? c.steps : [c]).forEach((s) => o.push(s))); return o; };
  function minutesOf(cards) {
    let s = 0;
    flat(cards).forEach((e) => { const pl = e.plan, per = pl.unit === 'sec' || pl.unit === 'secside' ? pl.perSet * (pl.unit === 'secside' ? 2 : 1) : pl.perSet * (pl.unit === 'side' ? 2 : 1) * 3.2; s += pl.sets * (per + pl.rest) + 20; });
    return Math.max(3, Math.round(s / 60));
  }
  const ICONS = {
    pecs: '<path d="M3 10c0-3 4-4 9-1 5-3 9-2 9 1 0 5-4 7-9 6-5 1-9-1-9-6z"/><path d="M12 9v11"/>',
    abdos: '<rect x="7" y="3.5" width="10" height="17" rx="3"/><path d="M12 3.5v17M7 9h10M7 14.5h10"/>',
    jambes: '<path d="M9 3h6l-1 9 2 9h-4l-1-7-1 7H6l2-9z"/>',
    epaules: '<path d="M3 19c0-6 4-9 9-9s9 3 9 9"/><circle cx="12" cy="5.5" r="2.8"/>',
    cardio: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    dos: '<path d="M12 3v18M6 7c3 2 9 2 12 0M7 12.5c3 2 7 2 10 0"/>',
    bras: '<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>',
    all: '<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>'
  };
  const icon = (id) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[id] || '') + '</svg>';
  const catName = (id) => (id === 'all' || !id ? 'Au hasard' : (G.catById(id) || {}).name || '');

  /* ---------- données du joueur : où est le tirage d'aujourd'hui ? ---------- */
  const singleSlot = () => (SPE ? p.spe : p.daily);
  const singleCard = () => singleSlot().card || null;
  const boxObj = () => (p.box && p.box.cards ? p.box : null);
  const drawnOf = (mode) => (mode === 'multi' ? boxObj() : singleCard());
  const statusOf = (mode) => (mode === 'multi' ? (p.box && p.box.status) : singleSlot().status);
  const blockedSingle = () => !SPE && !singleCard() && p.daily.status === 'done';   // journée déjà validée par le tirage multiple
  const cardsOf = (mode) => (mode === 'multi' ? boxObj().cards : [singleCard()]);
  const catOfDrawn = (mode) => { const d = drawnOf(mode); return (d && d.cat) || 'all'; };

  /* ---------- son ---------- */
  const sndBtn = $('gxSnd');
  const syncSnd = () => { sndBtn.textContent = 'Son : ' + (NEV.Sfx.muted ? 'non' : 'oui'); sndBtn.setAttribute('aria-pressed', String(!NEV.Sfx.muted)); };
  sndBtn.onclick = () => { NEV.Sfx.toggle(); syncSnd(); };
  syncSnd();
  stage.addEventListener('pointerdown', () => NEV.Sfx.unlock(), { once: true });

  /* ---------- bandeaux, chances, légende ---------- */
  if (GUEST) {
    $('gAlert').innerHTML = '<div class="banner guestBanner"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><div><b>Mode visiteur · ' + (GUEST === 'f' ? 'Femme' : 'Homme') + '.</b> Tu peux tirer des cartes pour découvrir le jeu. Pour lancer les exercices, gagner des flammes et suivre ta progression, il faut un compte (gratuit). <a href="' + SIGNUP + '" data-go>Créer mon compte</a></div></div>';
    const od = document.querySelector('details.odds'); if (od) od.remove();
  } else if (p.daily.double && p.daily.status !== 'done') {
    $('gAlert').innerHTML = '<div class="banner"><span style="font-size:1.5rem">⚠️</span><div>Journée ratée : les séries d\'aujourd\'hui sont <b>doublées (×2)</b>. Le tirage reste unique.</div></div>';
  }
  const lvl = NEV.levelFromMax(p.maxPushups);
  const W = G.weights(lvl.n, false, p.pity || 0).pct;
  const RAR = NEV.sex === 'f' ? G.RARITIES.slice(0, 4) : G.RARITIES;
  $('gxLegend').innerHTML = RAR.map((r, i) => '<span style="--c:' + r.color + '"><i></i><b>' + r.code + '</b> ' + r.name + ' <em>' + (W[i] >= 10 ? Math.round(W[i]) : Math.round(W[i] * 10) / 10) + ' %</em></span>').join('');
  if (!GUEST) {
    $('prob').innerHTML = RAR.map((r, i) => '<div style="--c:' + r.color + '"><b>' + (W[i] >= 10 ? Math.round(W[i]) : Math.round(W[i] * 10) / 10) + ' %</b>' + r.name + '</div>').join('');
    const left = Math.max(0, G.PITY_HARD - (p.pity || 0));
    $('oddsTxt').textContent = 'Niveau ' + lvl.n + ' « ' + lvl.name + ' ». ' + (left === 0 ? 'Ton prochain tirage est garanti Épique ou mieux.' : 'Tirages sans Épique d\'affilée : ' + (p.pity || 0) + '. Garantie Épique+ dans ' + left + ' tirage' + (left > 1 ? 's' : '') + ' au plus tard.') + ' La catégorie choisie est toujours respectée : seule la rareté est tirée au sort.';
    const si = G.specialInfo(p, { mode: SPE ? 'spe' : 'daily' });
    $('spTxt').innerHTML = 'Une seule carte <b>spéciale</b> existe : <b>Repos</b> (une vraie journée de récupération guidée). Elle ne sort qu\'au tirage simple « Au hasard », au plus une fois tous les <b>' + G.SPECIAL_RULE.cooldown + ' jours</b>. ' +
      (si.unlocked ? 'Tu t\'es entraîné <b>' + si.days + ' jours sur les ' + si.window + ' derniers</b> : chance de carte Repos <b>' + si.pct + ' %</b>.'
        : 'Il faut <b>' + si.need + ' jours d\'entraînement sur les ' + si.window + ' derniers</b> pour avoir <b>40 %</b> de chance. Pour l\'instant : ' + si.days + ' jour' + (si.days > 1 ? 's' : '') + '.');
    const B = G.boxCfg(), pool = G.comboPool(p).length;
    $('boxTxt').innerHTML = 'Le tirage multiple donne <b>' + B.cards + ' cartes</b>, toutes différentes. ' + (pool ? 'Chance qu\'une carte <b>Combo</b> (un enchaînement) se glisse dans ta boîte : <b>' + Math.round(B.comboChance * 100) + ' %</b>, en « Au hasard » ou si tous ses exercices sont de la catégorie.' : 'Aucun combo ne correspond à ton matériel pour l\'instant.');
  }

  /* ---------- catégories ---------- */
  const INFO = {}; G.categoryInfo(p).forEach((c) => { INFO[c.id] = c; });
  const chipsEl = $('gxChips');
  chipsEl.innerHTML = G.CATEGORIES.map((c) => '<button type="button" class="gx-chip" data-cat="' + c.id + '" aria-pressed="false">' + icon(c.id) + esc(c.name) + '</button>').join('') +
    '<button type="button" class="gx-chip" data-cat="all" aria-pressed="false">' + icon('all') + 'Au hasard</button>';
  const minCount = () => (S.mode === 'multi' ? 2 : 1);
  const catOk = (id) => id === 'all' || (INFO[id] && INFO[id].count >= minCount());
  chipsEl.addEventListener('click', (e) => { const b = e.target.closest('.gx-chip'); if (!b || b.disabled || drawnOf(S.mode)) return; S.cat = b.dataset.cat; renderIdle(); });
  $('gxSeg').addEventListener('click', (e) => { const b = e.target.closest('button[data-mode]'); if (!b || S.busy) return; S.mode = b.dataset.mode; renderIdle(); });

  /* ---------- phases ---------- */
  function setPhase(ph) {
    gx.dataset.phase = ph;
    Object.keys(VIEWS).forEach((k) => { $(VIEWS[k]).hidden = k !== ph; });
  }
  function renderIdle() {
    const drawn = drawnOf(S.mode), st = statusOf(S.mode), blocked = S.mode === 'single' && blockedSingle();
    if (drawn) S.cat = catOfDrawn(S.mode);
    else if (!catOk(S.cat)) S.cat = G.CATEGORIES.find((c) => catOk(c.id)) ? G.CATEGORIES.find((c) => catOk(c.id)).id : 'all';
    $('gxSeg').querySelectorAll('button').forEach((b) => {
      const m = b.dataset.mode, on = m === S.mode, got = !!drawnOf(m) || (m === 'single' && blockedSingle());
      b.setAttribute('aria-pressed', String(on));
      const old = b.querySelector('.gx-got'); if (old) old.remove();
      if (got) b.insertAdjacentHTML('beforeend', '<span class="gx-got">' + (m === 'single' && blockedSingle() ? 'Journée validée' : 'Déjà tiré') + '</span>');
    });
    chipsEl.querySelectorAll('.gx-chip').forEach((b) => {
      const id = b.dataset.cat, ok = catOk(id);
      b.setAttribute('aria-pressed', String(id === S.cat));
      b.disabled = !!drawn || !ok;
      b.title = !ok ? (INFO[id] && INFO[id].count ? 'Pas assez d\'exercices avec ton matériel pour un tirage multiple' : 'Aucun exercice disponible avec ton matériel') : '';
    });
    const draw = $('gxDraw'), bonus = $('gxBonus');
    draw.disabled = !!blocked; draw.textContent = drawn ? 'VOIR MON TIRAGE' : 'TIRER';
    const canBonus = !GUEST && (p.bonusDraws || 0) > 0 && ((drawn && st !== 'done') || (S.mode === 'single' && !SPE && st === 'done' && !!drawn));
    bonus.hidden = !canBonus; bonus.textContent = '🎁 Tirage bonus (' + (p.bonusDraws || 0) + ')';
    let note = '';
    if (blocked) note = 'Ta journée est déjà validée grâce au tirage multiple. Reviens demain pour un nouveau tirage simple.';
    else if (drawn) note = 'Tu as déjà ton tirage ' + (S.mode === 'multi' ? 'multiple' : 'simple') + ' du jour' + (catOfDrawn(S.mode) !== 'all' ? ' (<b>' + esc(catName(catOfDrawn(S.mode))) + '</b>)' : '') + '. Un seul tirage par jour et par type.';
    else if (S.cat === 'all') note = S.mode === 'single' ? 'Toutes les catégories sont possibles, et les cartes spéciales (Repos, Tractions) peuvent sortir.' : 'Quatre cartes de catégories variées, avec peut-être un combo.';
    else {
      const n = INFO[S.cat] ? INFO[S.cat].count : 0, want = S.mode === 'multi' ? G.boxCfg().cards : 1;
      note = '<b>' + esc(catName(S.cat)) + '</b> : ' + plural(n, 'exercice') + ' disponible' + (n > 1 ? 's' : '') + ' avec ton matériel.' + (S.mode === 'multi' && n < want ? ' Tu recevras ' + n + ' cartes.' : '');
    }
    $('gxNote').innerHTML = note;
    setPhase('idle'); idleStill();
  }

  /* ---------- la boîte et les cartes : géométrie ---------- */
  const RATIO = 7.4 / 5;   // hauteur / largeur d'une carte du site
  const later = (fn, ms) => { S.timers.push(setTimeout(fn, reduced ? ms * 0.5 : ms)); };
  function box(z, y, dur) { parts.forEach((q) => { q.style.transition = dur ? 'transform ' + dur + 'ms cubic-bezier(.3,.7,.2,1), opacity .6s ease' : 'none'; q.style.transform = 'perspective(900px) translate3d(0,' + y + 'px,' + z + 'px)'; }); }
  function boxFade(o, dur) { parts.forEach((q) => { q.style.transition = 'opacity ' + dur + 'ms ease, transform ' + dur + 'ms ease'; q.style.opacity = o; }); }
  function sizeBox() { const r = stage.getBoundingClientRect(); stage.style.setProperty('--bs', Math.max(220, Math.min(480, r.width * 0.86, r.height * 0.82)) + 'px'); }
  function openPt() { const sr = stage.getBoundingClientRect(), r = $('gxBack').getBoundingClientRect(); return { x: r.left + r.width / 2 - sr.left, y: r.top + r.height * 0.43 - sr.top }; }
  function layout() {
    const r = stage.getBoundingClientRect(), Wd = r.width, H = r.height, n = S.cards.length;
    if (n === 1) { const cw = Math.max(150, Math.min(270, Wd * 0.62, H * 0.8 / RATIO)); return { cw, ch: cw * RATIO, pos: [{ x: Wd / 2, y: H / 2 - 4, rot: 0 }] }; }
    if (Wd < 600) {
      const rows = Math.ceil(n / 2), cw = Math.max(92, Math.min(170, (Wd - 52) / 2.3, (H - 34) / (rows * RATIO + (rows - 1) * 0.14 + 0.1))), g = cw * 0.07, cx = Wd / 2, cy = H / 2 - 2;
      const pos = []; for (let i = 0; i < n; i++) { const row = Math.floor(i / 2), col = i % 2, rowsH = rows * cw * RATIO + (rows - 1) * g * 2; pos.push({ x: cx + (col ? 1 : -1) * (cw / 2 + g), y: cy - rowsH / 2 + cw * RATIO / 2 + row * (cw * RATIO + g * 2), rot: col ? 2 : -2 }); }
      return { cw, ch: cw * RATIO, pos };
    }
    const cw = Math.max(104, Math.min(210, (Wd - 40) / (n * 1.12 + 0.4), H * 0.74 / RATIO)), cx = Wd / 2, cy = H / 2 - 4, st = cw * 1.1;
    return { cw, ch: cw * RATIO, pos: S.cards.map((_, i) => { const k = i - (n - 1) / 2, edge = Math.abs(k) / Math.max(1, (n - 1) / 2); return { x: cx + k * st, y: cy + 16 * edge * (cw / 190), rot: n > 1 ? k * (18 / Math.max(1, n - 1)) * 1.1 : 0 }; }) };
  }
  const tf = (x, y, cw, ch, rot, sc) => 'translate(' + (x - cw / 2) + 'px,' + (y - ch / 2) + 'px) rotate(' + (rot || 0) + 'deg) scale(' + (sc == null ? 1 : sc) + ')';

  /* ---------- fabrication des cartes ---------- */
  function cardEl(c, i) {
    const r = rarOf(c), el = document.createElement('div');
    el.className = 'gxc' + (c.special ? ' sp' : '') + (c.type === 'combo' ? ' cb' : '');
    el.dataset.t = String(tOf(c)); el.tabIndex = 0; el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Carte ' + (i + 1) + ' (face cachée)');
    el.style.setProperty('--rc', r.color); el.style.setProperty('--rg', r.glow + 'aa');
    el.innerHTML = '<div class="gxc-aura"></div><div class="gxc-in"><div class="gxc-face gxc-back">' + NEV.Card.back() + '</div><div class="gxc-face gxc-front">' + faceOf(c) + '</div></div><div class="gxc-tick" aria-hidden="true">✓</div>';
    el.addEventListener('click', () => onCard(i));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCard(i); } });
    return el;
  }
  function build() {
    cardsEl.innerHTML = ''; S.els = []; S.L = layout();
    S.cards.forEach((c, i) => { const el = cardEl(c, i); el.style.width = S.L.cw + 'px'; el.style.height = S.L.ch + 'px'; cardsEl.appendChild(el); S.els.push(el); });
  }
  const place = (i) => { const q = S.L.pos[i], el = S.els[i]; el.style.transform = tf(q.x, q.y, S.L.cw, S.L.ch, q.rot, 1); el.style.opacity = 1; };
  const mountArt = (el) => { try { NEV.Card.mountArt(el); } catch (e) { /* la figure n'est qu'un décor */ } };

  /* ---------- effets de rareté ---------- */
  function ring(cx, cy, size, color, ms) {
    const s = document.createElement('div'); s.className = 'shock';
    s.style.cssText = 'left:' + (cx - size / 2) + 'px;top:' + (cy - size / 2) + 'px;width:' + size + 'px;height:' + size + 'px;border-color:' + color + ';box-shadow:0 0 30px ' + color;
    document.body.appendChild(s);
    if (!s.animate) { s.remove(); return; }
    s.animate([{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(4.5)', opacity: 0 }], { duration: ms || 800, easing: 'cubic-bezier(.1,.7,.3,1)' }).onfinish = () => s.remove();
  }
  function fx(i) {
    const c = S.cards[i], t = tOf(c), r = rarOf(c), el = S.els[i];
    NEV.Sfx.rare(codeOf(c));
    if (reduced) return;
    if (t >= 4) {
      flashEl.style.transition = 'none'; flashEl.style.opacity = t >= 5 ? 0.8 : 0.5; flashEl.style.background = t >= 5 ? '#ff4d66' : '#ffe3a0'; void flashEl.offsetWidth; flashEl.style.transition = 'opacity .9s ease'; flashEl.style.opacity = 0;
      gx.classList.remove('shake'); void gx.offsetWidth; gx.classList.add('shake');
      banner.textContent = c.special ? 'Carte spéciale !' : r.name + ' !'; banner.style.setProperty('--bc', r.color); banner.classList.remove('go'); void banner.offsetWidth; banner.classList.add('go');
    }
    if (t >= 2 && el) {
      const q = el.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2, cols = [r.color, r.glow, '#ffd45e', '#fff'];
      NEV.Fx.burst(x, y, { n: [0, 0, 22, 40, 80, 130][t], power: 0.6 + t * 0.14, colors: cols });
      if (t >= 4) { ring(x, y, 150, r.color, 900); setTimeout(() => ring(x, y, 150, '#fff', 900), 130); }
    }
  }
  function flipCard(i, quiet) {
    const el = S.els[i]; if (!el || el.classList.contains('flipped')) return;
    mountArt(el); el.classList.add('flipped');
    if (!quiet && !reduced && S.cards.length > 1) { try { el.querySelector('.gxc-in').animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(900deg)' }], { duration: 950, easing: 'cubic-bezier(.3,.7,.25,1)' }); } catch (e) { /* ignoré */ } }
    const c = S.cards[i]; el.setAttribute('aria-label', c.name + ', ' + planText(c) + ', ' + (c.special ? 'carte spéciale' : rarOf(c).name));
    if (!quiet) { NEV.Sfx.flip(); setTimeout(() => fx(i), 260); }
    updateResult();
  }

  /* ---------- le tirage (côté système, AVANT l'animation) ---------- */
  function drawNow() {
    const cat = S.cat === 'all' ? null : S.cat;
    if (SPE) return [G.ensureCard(p, user, { mode: 'spe', zone: ZONE })];
    if (S.mode === 'single') return [G.ensureCard(p, user, { mode: 'daily', cat })];
    return G.ensureBox(p, user, { cat }).cards;
  }
  const evDetail = (cards) => ({ mode: S.mode === 'single' ? 'simple' : 'multiple', category: S.cat, cards: cards.map((c) => Object.assign({}, c)) });

  /* ---------- la séquence d'animation ---------- */
  function start() {
    if (S.busy) return;
    S.busy = true; NEV.Sfx.unlock();
    try { gx.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); } catch (e) { /* ignoré */ }
    let list;
    try { list = drawNow(); } catch (e) { S.busy = false; NEV.ui.toast(e && /Aucun exercice/.test(e.message) ? 'Aucun exercice disponible dans cette catégorie avec ton matériel.' : 'Le tirage a échoué. Réessaie.'); renderIdle(); return; }
    S.cards = list; S.sel.clear(); S.fresh = true; S.skipped = false;
    NEV.track('draw', { mode: S.mode, cat: S.cat, ids: list.map((c) => c.id), tier: Math.max.apply(null, list.map(tOf)), special: (list[0] && list[0].special) || null });
    window.dispatchEvent(new CustomEvent('nvb:gacha-draw', { detail: evDetail(list) }));
    const best = list.reduce((m, c) => (tOf(c) > tOf(m) ? c : m), list[0]);
    gx.style.setProperty('--rayc', hexRgb(rarOf(best).color));      // la lumière de la boîte annonce la meilleure rareté
    hero.classList.remove('on');
    setPhase('busy'); $('gxBusy').textContent = 'La boîte s\'avance…'; hint.classList.remove('on');
    $('gxLid').classList.remove('open'); $('gxBack').classList.remove('lit');
    build(); boxFade(1, 0); box(0, 0, 0); void stage.offsetWidth;
    sizeBox();
    if (reduced) { settle(); return; }
    box(190, 30, 1050);                                                     // 1 · la boîte s'avance (zoom 3D)
    later(() => { parts.forEach((q) => q.classList.add('trem')); NEV.Sfx.rumble(); $('gxBusy').textContent = 'Elle s\'immobilise…'; }, 1200);   // 2 · pause, elle tremble
    later(() => {                                                           // 3 · le couvercle s'ouvre, la lumière jaillit
      parts.forEach((q) => q.classList.remove('trem')); $('gxLid').classList.add('open'); $('gxBack').classList.add('lit');
      const o = openPt(); rays.style.left = o.x + 'px'; rays.style.top = o.y + 'px'; rays.classList.add('on'); NEV.Sfx.open(); $('gxBusy').textContent = 'Ouverture de la boîte…';
    }, 1850);
    later(emerge, 2600);                                                    // 4 · les cartes sortent
  }
  function emerge() {
    const o = openPt(), L = S.L, n = S.cards.length, step = n === 1 ? 0 : 470, dur = n === 1 ? 1200 : 1150;
    $('gxBusy').textContent = n === 1 ? 'Ta carte sort de la boîte…' : 'Les cartes sortent une à une…';
    if (n === 1) mountArt(S.els[0]);
    S.cards.forEach((c, i) => {
      later(() => {
        const el = S.els[i], q = L.pos[i]; el.style.opacity = 1; el.style.zIndex = 10 + i; NEV.Sfx.out();
        const from = tf(o.x, o.y + L.ch * 0.05, L.cw, L.ch, 0, 0.3), up = tf(o.x, Math.max(L.ch * 0.5 + 8, o.y - L.ch * 0.75), L.cw, L.ch, n === 1 ? 0 : q.rot * 0.5, n === 1 ? 1.05 : 0.85), to = tf(q.x, q.y, L.cw, L.ch, q.rot, 1);
        el.style.transform = from;
        S.anims.push(el.animate([{ transform: from, opacity: 0 }, { transform: up, opacity: 1, offset: 0.45 }, { transform: to, opacity: 1 }], { duration: dur, easing: 'cubic-bezier(.25,.8,.3,1)', fill: 'forwards' }));
      }, i * step);
    });
    const total = (n - 1) * step + dur;
    later(() => { boxFade(0, 700); rays.classList.remove('on'); }, Math.max(600, total - 600));
    if (n === 1) later(crazy, total + 80); else later(settle, total + 80);
  }

  /* ---------- la carte seule : 8 tours, lumière, puis explosion en morceaux ---------- */
  function shatter(q, r, tier) {
    const cx = q.left + q.width / 2, cy = q.top + q.height / 2, w = q.width * 1.3, h = q.height * 1.3, x0 = cx - w / 2, y0 = cy - h / 2;
    const C = 4, R = 6, pts = [], tris = [];
    for (let j = 0; j <= R; j++) { pts[j] = []; for (let i = 0; i <= C; i++) pts[j][i] = [i / C * 100 + (i && i < C ? (Math.random() - 0.5) * 14 : 0), j / R * 100 + (j && j < R ? (Math.random() - 0.5) * 10 : 0)]; }
    for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) { const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i], d = pts[j + 1][i + 1]; tris.push([a, b, c], [b, d, c]); }
    tris.forEach((t) => {
      const sh = document.createElement('div'); sh.className = 'shard';
      sh.style.cssText = 'left:' + x0 + 'px;top:' + y0 + 'px;width:' + w + 'px;height:' + h + 'px;clip-path:polygon(' + t.map((p2) => p2[0].toFixed(1) + '% ' + p2[1].toFixed(1) + '%').join(',') + ');background:linear-gradient(' + Math.round(Math.random() * 360) + 'deg,#f6d58a,#8e1b3c 45%,' + r.color + ');';
      document.body.appendChild(sh);
      const px = (t[0][0] + t[1][0] + t[2][0]) / 3 - 50, py = (t[0][1] + t[1][1] + t[2][1]) / 3 - 50;
      const dist = 160 + Math.random() * (260 + tier * 60), ang = Math.atan2(py, px) + (Math.random() - 0.5) * 0.8;
      if (!sh.animate) { sh.remove(); return; }
      sh.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + Math.cos(ang) * dist + 'px,' + (Math.sin(ang) * dist + 120 + Math.random() * 160) + 'px) rotate(' + (Math.random() - 0.5) * 900 + 'deg) scale(.3)', opacity: 0 }], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => sh.remove();
    });
  }
  function crazy() {
    const c = S.cards[0], r = rarOf(c), t = tOf(c), el = S.els[0], inner = el.querySelector('.gxc-in');
    const q = el.getBoundingClientRect(), cx = q.left + q.width / 2, cy = q.top + q.height / 2, T = 2900;
    $('gxBusy').textContent = 'Ta carte tourne…';
    gx.classList.add('crazy'); NEV.Sfx.rise(2.9);
    S.anims.push(inner.animate([                                   // 8 tours (8 × 360°), de plus en plus vite
      { transform: 'rotateY(0deg) rotateZ(0deg) scale(1)', offset: 0, easing: 'cubic-bezier(.5,0,.9,.7)' },
      { transform: 'rotateY(720deg) rotateZ(-5deg) scale(1.08)', offset: 0.45, easing: 'cubic-bezier(.4,0,1,.8)' },
      { transform: 'rotateY(1980deg) rotateZ(6deg) scale(1.18)', offset: 0.8 },
      { transform: 'rotateY(2880deg) rotateZ(-3deg) scale(1.3)', offset: 1 }
    ], { duration: T, fill: 'forwards' }));
    S.anims.push(el.animate([{ filter: 'hue-rotate(0deg) brightness(1)' }, { filter: 'hue-rotate(540deg) brightness(1.3)', offset: 0.7 }, { filter: 'hue-rotate(1100deg) brightness(2.1)' }], { duration: T, fill: 'forwards' }));
    const t0 = performance.now();
    const iv = setInterval(() => {
      const k = (performance.now() - t0) / T;
      NEV.Fx.stream(cx, cy + 40, { n: 2 + Math.round(k * 6), w: 50 + k * 80, colors: [r.color, '#ff6a3d'] });
      if (k > 0.4 && Math.random() < 0.5) NEV.Fx.shake(stage, 200, 2 + k * 10);
    }, 70);
    S.timers.push(iv);
    later(() => {                                                   // l'explosion révèle la carte
      clearInterval(iv);
      gx.classList.remove('crazy'); el.style.visibility = 'hidden';
      NEV.Sfx.boom(t); NEV.Fx.flash(t >= 5 ? '#fff' : r.glow, 800); NEV.Fx.shake(stage, 700, 16);
      shatter(q, r, t);
      const cols = [r.color, r.glow, '#ffd45e', '#ff8a3d', '#fff'];
      NEV.Fx.burst(cx, cy, { n: 70 + t * 40, power: 1 + t * 0.15, colors: cols });
      ring(cx, cy, 160, r.color, 900); later(() => ring(cx, cy, 160, '#fff', 900), 130);
      if (t >= 4) later(() => NEV.Fx.burst(cx, cy, { n: 120, power: 1.4, colors: cols }), 250);
      later(settle, 900);
    }, T);
  }

  /* ---------- état final (sans animation en cours) ---------- */
  function clearAnim() { S.timers.forEach(clearTimeout); S.timers = []; S.anims.forEach((a) => { try { a.cancel(); } catch (e) { /* ignoré */ } }); S.anims = []; }
  function settle() {
    clearAnim(); gx.classList.remove('crazy'); S.els.forEach((e) => { e.style.visibility = ''; });
    S.L = layout();
    S.els.forEach((el, i) => { el.style.width = S.L.cw + 'px'; el.style.height = S.L.ch + 'px'; place(i); });
    $('gxLid').classList.add('open'); $('gxBack').classList.add('lit'); boxFade(0, 0); rays.classList.remove('on'); box(0, 0, 0);
    const single = S.cards.length === 1;
    if (single) {
      const el = S.els[0], inner = el.querySelector('.gxc-in'); mountArt(el);
      inner.style.transition = 'none'; el.classList.add('flipped'); void inner.offsetWidth; inner.style.transition = '';
      S.sel.add(0); el.classList.add('sel');
    } else if (!S.fresh) { S.els.forEach((el, i) => { mountArt(el); el.classList.add('flipped'); el.setAttribute('aria-label', S.cards[i].name); }); }
    else S.els.forEach(mountArt);
    S.els.forEach((el) => { try { NEV.Card.tilt(el.querySelector('.gxc-front')); } catch (e) { /* ignoré */ } });
    S.busy = false;
    const fresh = S.fresh && !S.skipped; S.fresh = false; S.skipped = false;
    if (single && fresh) { fx(0); if (!reduced) S.els[0].animate([{ filter: 'brightness(4) blur(8px)', opacity: 0.2 }, { filter: 'none', opacity: 1 }], { duration: 650, easing: 'ease-out' }); }
    afterSettle(single);
  }
  function afterSettle() {
    const st = statusOf(S.mode);
    if (st === 'done') { showDone(); return; }
    if (S.mode === 'multi' && p.box.picked && p.box.picked.length) { showConfirm(); return; }
    showResult();
  }
  function showResult() {
    const multi = S.cards.length > 1;
    setPhase('result');
    hint.textContent = multi ? 'Touche une carte pour la retourner, puis choisis tes défis' : ''; hint.classList.toggle('on', multi);
    stage.setAttribute('aria-label', multi ? 'Tes cartes' : 'Ta carte');
    updateResult();
  }
  function metaChips(c) {
    if (c.type === 'combo') return '<span class="chip red">Combo</span><span class="chip">≈ ' + minutesOf([c]) + ' min</span>';
    if (c.special === 'repos') return '<span class="chip ok">Série protégée</span><span class="chip red">+20 XP</span>';
    const ex = NEV.Ex.byId(c.id), cam = p.setup.camera && ex && ex.cam;
    return '<span class="chip red">' + esc(ex ? NEV.Ex.musclesText(ex) : '') + '</span><span class="chip ' + (cam ? 'ok' : '') + '">' + (cam ? 'Validation par caméra' : 'Validation manuelle') + '</span>' + (c.plan && c.plan.doubled ? '<span class="chip red">×2 journée ratée</span>' : '');
  }
  function updateResult() {
    if (gx.dataset.phase !== 'result') return;
    const n = S.cards.length, fl = S.els.filter((e) => e.classList.contains('flipped')).length, ns = S.sel.size, t = $('gxRes'), go = $('gxGo');
    if (n === 1) {
      const c = S.cards[0], r = rarOf(c);
      t.innerHTML = '<b>' + (c.special ? 'Carte spéciale' : r.name) + '</b> · ' + esc(c.name) + ' — ' + esc(planText(c));
      $('gxMeta').innerHTML = metaChips(c);
      go.textContent = GUEST ? 'CRÉER MON COMPTE' : c.special === 'repos' ? 'FAIRE MON REPOS' : 'RELEVER CE DÉFI'; go.disabled = false;
      say('Carte obtenue : ' + c.name + ', ' + planText(c));
    } else {
      t.innerHTML = fl < n ? fl + ' / ' + n + ' cartes retournées · touche une carte' : (ns ? '<b>' + ns + '</b> défi' + (ns > 1 ? 's' : '') + ' sélectionné' + (ns > 1 ? 's' : '') + ' · ≈ ' + minutesOf(sortedSel().map((i) => S.cards[i])) + ' min' : 'Touche les cartes pour choisir tes défis');
      $('gxMeta').innerHTML = '';
      go.textContent = GUEST ? 'CRÉER MON COMPTE' : 'VALIDER MON DÉFI'; go.disabled = !(fl === n && ns > 0);
      if (fl === n && ns === 0) hint.textContent = 'Touche les cartes pour choisir tes défis';
    }
    $('gxAll').hidden = !(n > 1 && fl < n);
  }
  const sortedSel = () => Array.from(S.sel).sort((a, b) => a - b);
  function onCard(i) {
    if (gx.dataset.phase !== 'result') return;
    const el = S.els[i];
    if (!el.classList.contains('flipped')) { flipCard(i); return; }
    if (S.cards.length > 1) { if (S.sel.has(i)) { S.sel.delete(i); el.classList.remove('sel'); } else { S.sel.add(i); el.classList.add('sel'); NEV.Sfx.pop(); } updateResult(); }
  }
  $('gxAll').onclick = () => { S.els.forEach((e, i) => setTimeout(() => flipCard(i), i * 420)); };
  $('gxSkip').onclick = () => { if (S.busy) { S.skipped = true; settle(); } };

  /* ---------- validation ---------- */
  const GO_URL = () => 'exercice.html?src=' + (SPE ? 'spe&zone=' + encodeURIComponent(ZONE) : 'daily');
  $('gxGo').onclick = () => {
    if (GUEST) { NEV.go(SIGNUP); return; }
    if (S.cards.length === 1) { NEV.Sfx.ok(); $('gxGo').disabled = true; NEV.go(GO_URL(), 500); return; }
    const picked = sortedSel(); if (!picked.length) return;
    p.box.picked = picked; NEV.player.save(p);
    window.dispatchEvent(new CustomEvent('nvb:gacha-validate', { detail: { mode: 'multiple', category: S.cat, cards: picked.map((i) => Object.assign({}, S.cards[i])) } }));
    NEV.Sfx.ok(); showConfirm();
  };
  function recapHtml(cards) { return cards.map((c) => '<li style="--c:' + rarOf(c).color + '"><i></i><span>' + esc(c.name) + '</span><em>' + esc(planText(c)) + ' · ' + (c.special ? 'Spéciale' : (c.type === 'combo' ? 'Combo' : rarOf(c).name)) + '</em></li>').join(''); }
  function showConfirm() {
    const picked = (p.box.picked && p.box.picked.length ? p.box.picked : sortedSel()).filter((i) => i >= 0 && i < S.cards.length).sort((a, b) => a - b);
    S.sel = new Set(picked);
    S.els.forEach((el, i) => { el.classList.add('flipped'); el.classList.toggle('sel', S.sel.has(i)); el.classList.toggle('dim', !S.sel.has(i)); });
    const cards = picked.map((i) => S.cards[i]);
    $('gxConfT').innerHTML = '<b>' + plural(cards.length, 'défi') + '</b> à relever · ≈ ' + minutesOf(cards) + ' min';
    $('gxConfL').innerHTML = recapHtml(cards);
    hint.classList.remove('on'); setPhase('confirm'); say('Sélection enregistrée : ' + plural(cards.length, 'défi'));
  }
  $('gxEdit').onclick = () => { p.box.picked = null; NEV.player.save(p); S.els.forEach((el) => el.classList.remove('dim')); showResult(); };
  $('gxStart').onclick = () => { $('gxStart').disabled = true; NEV.Sfx.ok(); NEV.go('exercice.html?src=box', 500); };
  function showDone() {
    const multi = S.mode === 'multi', slot = multi ? p.box : singleSlot(), r = slot.result || {};
    const played = multi ? NEV.player.boxPlayed(p.box) : S.cards;
    S.els.forEach((el, i) => { el.classList.add('flipped'); el.classList.remove('sel'); el.classList.toggle('dim', multi && played.indexOf(S.cards[i]) < 0); });
    $('gxDoneT').textContent = (S.cards[0] && S.cards[0].special === 'repos' && !multi ? 'Repos validé ✓' : 'Défi validé ✓') + (r.xpGain ? '  ·  +' + r.xpGain + ' XP' : '');
    $('gxDoneL').innerHTML = recapHtml(played);
    hint.classList.remove('on'); setPhase('done');
  }

  /* ---------- retour à l'écran initial ---------- */
  function again() {
    clearAnim(); S.busy = false; S.cards = []; S.els = []; S.sel.clear(); S.fresh = false;
    boxFade(0, 0); cardsEl.innerHTML = ''; hint.classList.remove('on'); banner.classList.remove('go');
    const lw = $('gxLid'), sv = lw.querySelector('svg'); sv.style.transition = 'none'; lw.classList.remove('open'); $('gxBack').classList.remove('lit'); void sv.offsetWidth; sv.style.transition = '';
    box(0, 0, 0); void stage.offsetWidth; gx.style.setProperty('--rayc', '255,236,200'); stage.setAttribute('aria-label', 'Boîte mystérieuse');
    renderIdle();
  }
  $('gxAgain').onclick = again; $('gxAgain2').onclick = again;
  function idleStill() { // écran « boîte mystérieuse » : l'image personnalisée si elle existe, sinon la boîte dessinée
    if (CFG.heroImage) { if (hero.getAttribute('src') !== CFG.heroImage) hero.src = CFG.heroImage; hero.classList.add('on'); boxFade(0, 0); }
    else { hero.classList.remove('on'); boxFade(1, 500); }
  }
  function showExisting() {
    const d = drawnOf(S.mode); if (!d) return;
    S.cards = cardsOf(S.mode); S.cat = catOfDrawn(S.mode); S.sel.clear(); S.fresh = false;
    gx.style.setProperty('--rayc', hexRgb(rarOf(S.cards.reduce((m, c) => (tOf(c) > tOf(m) ? c : m), S.cards[0])).color));
    hero.classList.remove('on'); boxFade(0, 0); sizeBox(); build(); settle();
  }
  $('gxDraw').onclick = () => { if (drawnOf(S.mode)) showExisting(); else start(); };
  $('gxBonus').onclick = () => {
    if (S.busy || !(p.bonusDraws > 0)) return;
    p.bonusDraws--;
    if (S.mode === 'single' && !SPE && p.daily.status === 'done') { p.spe = { date: p.spe.date, zone: null, card: null, status: 'none', result: null }; NEV.player.save(p); location.href = 'gacha.html?mode=spe'; return; }
    if (S.mode === 'multi') p.box = { date: NEV.util.todayStr(), cards: null, status: 'none', result: null, picked: null };
    else { const sl = singleSlot(); sl.card = null; sl.status = 'none'; sl.result = null; }
    NEV.player.save(p); S.cards = []; again();
  };

  /* ---------- démarrage ---------- */
  if (SPE) {
    document.title = 'neV.BOOSTER — Gacha Spécialisation';
    $('gEyebrow').textContent = 'Gacha Spécialisation · ' + (zoneObj ? zoneObj.name : 'Corps entier');
    $('gTitle').innerHTML = zoneObj ? 'Ta carte <em>' + esc(zoneObj.name.toLowerCase()) + '</em>' : 'Ta carte <em>corps entier</em>';
    $('gLead').textContent = 'Une carte tirée dans la zone que tu as choisie. Ouvre la boîte : le hasard décide de ton défi.';
    $('secType').hidden = true; $('secCat').hidden = true; $('gxBonus').hidden = true;
    S.mode = 'single'; S.cat = 'all';
  } else {
    const qm = qs.get('mode'), qc = qs.get('cat');
    S.mode = qm === 'multi' || qm === 'multiple' ? 'multi' : qm === 'single' || qm === 'simple' ? 'single' : (!singleCard() && boxObj() ? 'multi' : 'single');
    if (qc && (qc === 'all' || G.catById(qc))) S.cat = qc; else S.cat = (G.CATEGORIES.find((c) => INFO[c.id] && INFO[c.id].count > 0) || { id: 'all' }).id;
  }
  sizeBox();
  window.addEventListener('resize', () => {
    sizeBox();
    if (S.els.length && !S.busy) { S.L = layout(); S.els.forEach((el, i) => { el.style.width = S.L.cw + 'px'; el.style.height = S.L.ch + 'px'; place(i); }); }
  });
  window.addEventListener('pagehide', clearAnim);
  NEV.__gacha = { start, S, again };   // point d'entrée pour les tests

  if (drawnOf(S.mode) && (SPE || qs.get('new') !== '1')) { renderIdle(); showExisting(); }
  else if (S.mode === 'single' && blockedSingle() && boxObj() && !SPE) { S.mode = 'multi'; renderIdle(); showExisting(); }
  else renderIdle();
})();
