/* neV.BOOSTER — parcours féminin · logique partagée (JS pur, sans dépendance) */
(function () {
  'use strict';

  /* ---------- Données ---------- */
  var CATS = [
    { id: 'bas', name: 'Bas du corps', goal: 'Renforcer les jambes et les muscles fessiers.', d: 'M8 3v6l-2 12M16 3v6l2 12M8 9h8', exos: [
      { n: 'Squat goblet', dose: '3 × 12', how: 'Pieds à largeur d\'épaules, poids devant la poitrine. Descends en gardant le dos droit et les talons au sol.', easy: 'Squat avec une chaise derrière toi', hard: 'Pause de 2 s en bas' },
      { n: 'Fentes arrière', dose: '3 × 10 / jambe', how: 'Recule une jambe, descends le genou arrière vers le sol, puis pousse sur le talon avant pour remonter.', easy: 'Main appuyée contre un mur', hard: 'Ajoute deux bouteilles d\'eau' },
      { n: 'Pont fessier', dose: '3 × 15', how: 'Allongée, genoux pliés. Monte le bassin en serrant les fessiers, sans cambrer le bas du dos.', easy: 'Monte moins haut', hard: 'Pont sur une jambe' }
    ] },
    { id: 'abdos', name: 'Abdominaux', goal: 'Renforcer la sangle abdominale, avec contrôle et sans à-coups.', d: 'M7 4h10v16H7zM7 9h10M7 14h10M12 4v16', exos: [
      { n: 'Planche sur les avant-bras', dose: '3 × 30 s', how: 'Coudes sous les épaules, corps aligné, ventre rentré. Respire calmement, sans bloquer.', easy: 'Planche sur les genoux', hard: 'Tiens 45 s' },
      { n: 'Dead bug', dose: '3 × 10', how: 'Dos au sol, bras vers le plafond. Étends bras et jambe opposés en gardant le bas du dos plaqué.', easy: 'Bouge seulement les jambes', hard: 'Mouvement plus lent' },
      { n: 'Relevé de bassin', dose: '3 × 12', how: 'Jambes pliées en l\'air, enroule lentement le bassin vers le plafond puis redescends sous contrôle.', easy: 'Pieds au sol, amplitude réduite', hard: 'Jambes tendues' }
    ] },
    { id: 'haut', name: 'Haut du corps', goal: 'Développer la force des bras, des épaules et du dos.', d: 'M4 8l4-3h8l4 3M8 5v14M16 5v14M8 12h8', exos: [
      { n: 'Pompes inclinées', dose: '3 × 8', how: 'Mains sur une table ou un banc stable, corps gainé. Descends la poitrine vers le support.', easy: 'Mains contre un mur', hard: 'Support plus bas' },
      { n: 'Rowing avec élastique', dose: '3 × 12', how: 'Élastique fixé devant toi. Tire les coudes vers l\'arrière en rapprochant les omoplates.', easy: 'Élastique plus léger', hard: 'Pause d\'1 s à la fin du tirage' },
      { n: 'Dips sur chaise', dose: '3 × 8', how: 'Mains sur le bord d\'une chaise stable. Fléchis les coudes vers l\'arrière, épaules loin des oreilles.', easy: 'Pieds plus près de la chaise', hard: 'Une jambe tendue' }
    ] },
    { id: 'cardio', name: 'Cardio', goal: 'Améliorer l\'endurance, à une intensité que tu peux tenir.', d: 'M3 12h4l2-6 4 12 2-6h6', exos: [
      { n: 'Marche rapide par intervalles', dose: '20 min', how: 'Alterne 2 min de marche rapide et 1 min de marche normale. Tu dois pouvoir parler.', easy: 'Marche à allure normale', hard: 'Ajoute 5 min' },
      { n: 'Jumping jacks', dose: '4 × 30 s', how: 'Écarte bras et jambes en rythme, atterris en douceur sur la plante des pieds.', easy: 'Version sans saut : un pas sur le côté', hard: 'Rythme plus rapide' },
      { n: 'Montées de genoux', dose: '4 × 30 s', how: 'Monte les genoux vers la hauteur des hanches, bras en rythme, buste droit.', easy: 'Au pas, sans courir', hard: 'Rythme plus rapide' }
    ] },
    { id: 'mobilite', name: 'Mobilité', goal: 'Améliorer la souplesse et l\'aisance des mouvements.', d: 'M5 19c4-2 6-6 7-14 1 8 3 12 7 14', exos: [
      { n: 'Chat-vache', dose: '2 × 10', how: 'À quatre pattes, alterne dos rond et dos creux au rythme de la respiration.', easy: 'Amplitude réduite', hard: 'Pause de 3 s dans chaque position' },
      { n: 'Fente basse avec rotation', dose: '2 × 8 / côté', how: 'En fente basse, ouvre le buste du côté de la jambe avant, regard vers la main levée.', easy: 'Main au sol pour t\'équilibrer', hard: 'Tiens 3 s dans la rotation' },
      { n: 'Étirement des ischio-jambiers', dose: '2 × 30 s', how: 'Assise, une jambe tendue. Penche-toi doucement, sans forcer ni rebondir.', easy: 'Genou légèrement plié', hard: 'Tiens 45 s' }
    ] },
    { id: 'full', name: 'Corps complet', goal: 'Développer une condition physique générale.', d: 'M12 3a2 2 0 100 4 2 2 0 000-4zM12 7v7M7 10h10M9 21l3-7 3 7', exos: [
      { n: 'Circuit corps complet', dose: '3 tours', how: 'Enchaîne squat, pompes inclinées, planche et fentes (8 à 10 répétitions chacun), puis récupère 2 min.', easy: '2 tours', hard: '4 tours' },
      { n: 'Burpee sans saut', dose: '3 × 8', how: 'Descends au sol, recule les jambes, reviens debout sans sauter, en gardant le dos neutre.', easy: 'Sans la phase de planche', hard: 'Avec un petit saut' },
      { n: 'Gainage dynamique', dose: '3 × 10', how: 'Passe de la planche sur avant-bras à la planche sur les mains, une main après l\'autre.', easy: 'Sur les genoux', hard: 'Mouvement plus lent' }
    ] }
  ];
  var POOL = [];
  CATS.forEach(function (c) { c.exos.forEach(function (e) { POOL.push({ n: e.n, dose: e.dose, how: e.how, cat: c.id, catName: c.name }); }); });

  /* ---------- Stockage local ---------- */
  var KEY = 'nvbf.v1';
  function fresh() { return { xp: 0, sessions: [], counts: {}, combos: 0, squats: null, notes: [] }; }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || '{}'); var f = fresh(); for (var k in f) { if (s[k] === undefined) s[k] = f[k]; } return s; }
    catch (e) { return fresh(); }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function dayKey(d) { d = d || new Date(); var m = d.getMonth() + 1, j = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (j < 10 ? '0' : '') + j; }
  function streak(s) {
    var days = {}; s.sessions.forEach(function (x) { days[x.d] = 1; });
    var d = new Date(); if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
    var n = 0; while (days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function weekStart() { var d = new Date(); d.setHours(0, 0, 0, 0); var w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return dayKey(d); }
  function thisWeek(s) { var w = weekStart(); return s.sessions.filter(function (x) { return x.d >= w; }); }
  function level(xp) { return { n: Math.floor(xp / 300) + 1, into: xp % 300, size: 300 }; }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function svgIcon(d, size, color) {
    var ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size); s.setAttribute('height', size);
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', color || 'currentColor'); s.setAttribute('stroke-width', '1.6');
    s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); s.appendChild(p); return s;
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------- Header / footer communs ---------- */
  var NAV = [['index.html', 'Accueil', 'home'], ['guide.html', 'Guide', 'guide'], ['programmes.html', 'Programmes', 'programmes'], ['gacha.html', 'Gacha Box', 'gacha'], ['progression.html', 'Progression', 'progression'], ['niveau.html', 'Mon niveau', 'niveau'], ['communaute.html', 'Communauté', 'communaute']];
  function chrome() {
    var page = document.body.getAttribute('data-page'), h = $('site-header'), f = $('site-footer');
    if (h) {
      h.className = 'site-header';
      var inner = el('div', 'in');
      var brand = el('a', 'brand'); brand.href = 'index.html';
      var lg = el('div', 'logo', 'nVB'); brand.appendChild(lg);
      var bt = el('div', null, 'neV.BOOSTER '); bt.appendChild(el('span', null, '· Femme')); brand.appendChild(bt);
      var nav = el('nav', 'main'); nav.setAttribute('aria-label', 'Navigation principale');
      NAV.forEach(function (n) { var a = el('a', null, n[1]); a.href = n[0]; if (n[2] === page) a.setAttribute('aria-current', 'page'); nav.appendChild(a); });
      inner.appendChild(brand); inner.appendChild(nav); h.appendChild(inner);
    }
    if (f) {
      f.className = 'site';
      var i2 = el('div', 'in');
      i2.appendChild(el('p', null, 'Les exercices renforcent des muscles ; ils ne ciblent pas la graisse d\'une zone précise. En cas de douleur ou de problème de santé, demande l\'avis d\'un professionnel avant de t\'entraîner.'));
      var b = el('b', null, 'neV.BOOSTER · Booste ton quotidien'); i2.appendChild(b); f.appendChild(i2);
    }
  }


  /* ---------- Yuki : message d'accueil à chaque connexion ---------- */
  var YUKI_LINE = 'Quel est ton type de mec ??!';
  function yukiHello() {
    var seen = false;
    try { seen = sessionStorage.getItem('nvbf.yuki') === '1'; } catch (e) {}
    if (seen || document.body.getAttribute('data-page') === 'profil') return;
    try { sessionStorage.setItem('nvbf.yuki', '1'); } catch (e) {}
    var box = el('div', 'yuki-hello'); box.setAttribute('role', 'status');
    var img = el('img'); img.src = 'img/yuki-avatar.webp'; img.alt = 'Yuki'; img.width = 56; img.height = 56; box.appendChild(img);
    var t = el('div', 'yuki-t'); t.appendChild(el('b', null, 'Yuki')); t.appendChild(el('p', null, YUKI_LINE)); box.appendChild(t);
    var x = el('button', 'yuki-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Fermer le message de Yuki');
    x.addEventListener('click', function () { box.remove(); }); box.appendChild(x);
    document.body.appendChild(box);
    setTimeout(function () { box.classList.add('out'); setTimeout(function () { box.remove(); }, 600); }, 9000);
  }

  /* ---------- Accueil ---------- */
  function cardNode(c, flip) {
    var d = el('div', 'gcard ' + c.cls + (flip ? ' flip' : ''));
    var top = el('div', 'top'); var r = el('span', null, c.k); r.style.color = c.col; top.appendChild(r);
    top.appendChild(el('span', 'zone', c.zone)); d.appendChild(top);
    var mid = el('div'); mid.appendChild(el('h3', null, c.title));
    if (c.items.length > 1) {
      var ol = el('ol'); c.items.forEach(function (e) { ol.appendChild(el('li', null, e.n + ' — ' + e.dose)); }); mid.appendChild(ol);
    } else { mid.appendChild(el('div', 'dose', c.items[0].dose)); }
    d.appendChild(mid); d.appendChild(el('span', 'xp', '+' + c.xp + ' XP')); return d;
  }
  function initHome(s) {
    var daily = $('daily');
    if (daily) {
      var idx = Math.floor(Date.now() / 86400000) % POOL.length, e = POOL[idx];
      daily.appendChild(cardNode({ cls: 'rare', k: 'CARTE DU JOUR', col: '#F0B24A', zone: e.catName, title: e.n, items: [e], xp: 35 }, false));
    }
    var st = $('home-stats');
    if (st) {
      var lv = level(s.xp);
      if (s.sessions.length) { st.textContent = 'Niveau ' + lv.n + ' · ' + streak(s) + ' jour(s) de flammes · ' + s.sessions.length + ' séance(s)'; }
      else { st.textContent = 'Tire ta première carte pour démarrer ta progression.'; }
    }
  }

  /* ---------- Programmes ---------- */
  function initProgrammes(s) {
    var tabs = $('tabs'), panel = $('panel'); if (!tabs || !panel) return;
    var current = 0, hash = location.hash.replace('#', '');
    CATS.forEach(function (c, i) { if (c.id === hash) current = i; });
    function exoRecs(c) {
      if (s.squats === null || c.id !== 'bas') return null;
      var r = Math.max(5, Math.min(25, Math.round(s.squats * 0.6)));
      return 'Ton repère : squats autour de ' + r + ' répétitions par série.';
    }
    function render() {
      tabs.textContent = '';
      CATS.forEach(function (c, i) {
        var b = el('button', 'tab'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', i === current ? 'true' : 'false');
        var ic = el('span', 'ic'); ic.appendChild(svgIcon(c.d, 24, i === current ? '#E0455F' : '#FF8FA3')); b.appendChild(ic);
        b.appendChild(el('span', null, c.name));
        b.addEventListener('click', function () { current = i; render(); });
        tabs.appendChild(b);
      });
      var c = CATS[current]; panel.textContent = '';
      panel.appendChild(el('div', 'eyebrow', 'Objectif'));
      var h = el('h2', null, c.name); h.style.marginTop = '8px'; panel.appendChild(h);
      panel.appendChild(el('p', 'lead', c.goal));
      var rec = exoRecs(c); if (rec) panel.appendChild(el('div', 'note', rec));
      var list = el('div'); list.style.marginTop = '26px';
      c.exos.forEach(function (e) {
        var x = el('div', 'exo'), hd = el('div', 'head');
        hd.appendChild(el('b', null, e.n)); hd.appendChild(el('span', null, e.dose)); x.appendChild(hd);
        x.appendChild(el('p', null, e.how));
        var v = el('div', 'vars'), a = el('span'), z = el('span');
        a.appendChild(el('b', null, 'Plus facile : ')); a.appendChild(document.createTextNode(e.easy));
        z.appendChild(el('b', null, 'Plus avancé : ')); z.appendChild(document.createTextNode(e.hard));
        v.appendChild(a); v.appendChild(z); x.appendChild(v); list.appendChild(x);
      });
      panel.appendChild(list);
    }
    render();
  }

  /* ---------- Gacha Box + séance ---------- */
  function initGacha(s) {
    var grid = $('cards'); if (!grid) return;
    var cards = [], flipped = [], timer = null, box = $('box');
    function mkCard(items, k, xp, cls, col, zone, title) { return { items: items, k: k, xp: xp, cls: cls, col: col, zone: zone, title: title }; }
    function draw() {
      var p = shuffle(POOL.slice()), out = [];
      for (var i = 0; i < 3; i++) {
        var rare = Math.random() < 0.25, e = p[i];
        out.push(mkCard([e], rare ? 'RARE' : 'COMMUNE', rare ? 35 : 20, rare ? 'rare' : '', rare ? '#F0B24A' : '#FF8FA3', e.catName, e.n));
      }
      var items = shuffle(CATS.slice()).slice(0, 3).map(function (c) { var e = c.exos[Math.floor(Math.random() * c.exos.length)]; return { n: e.n, dose: e.dose, how: e.how, cat: c.id, catName: c.name }; });
      out.push(mkCard(items, 'COMBO', 80, 'combo', '#E0455F', 'Corps complet', 'Carte Combo'));
      cards = shuffle(out); flipped = [false, false, false, false]; render();
      if (box) box.classList.add('open');
    }
    function render() {
      grid.textContent = '';
      cards.forEach(function (c, i) {
        var cell = el('div');
        if (flipped[i]) { cell.appendChild(cardNode(c, true)); }
        else {
          var b = el('button', 'gcard back'); b.type = 'button'; b.setAttribute('aria-label', 'Retourner la carte ' + (i + 1));
          b.style.width = '100%'; b.appendChild(el('div', 'mark', 'nVB')); b.appendChild(el('span', 'small', 'Face cachée — retourne-la'));
          b.addEventListener('click', function () { flipped[i] = true; render(); });
          cell.appendChild(b);
        }
        grid.appendChild(cell);
      });
      var n = flipped.filter(Boolean).length, all = n === 4;
      $('btn-next').disabled = all; $('btn-all').disabled = all; $('btn-start').disabled = !all;
      var total = 0; cards.forEach(function (c, i) { if (flipped[i]) total += c.xp; });
      $('xp-total').textContent = n ? ('XP en jeu : ' + total) : 'Ouvre la boîte puis retourne tes cartes.';
    }
    $('btn-next').addEventListener('click', function () { for (var i = 0; i < 4; i++) { if (!flipped[i]) { flipped[i] = true; break; } } render(); });
    $('btn-all').addEventListener('click', function () { flipped = [true, true, true, true]; render(); });
    $('btn-reshuffle').addEventListener('click', draw);

    var ov = $('seance'), body = $('seance-body');
    function stop() { if (timer) { clearInterval(timer); timer = null; } ov.classList.remove('on'); }
    $('btn-quit').addEventListener('click', stop);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('on')) stop(); });
    function ringView(label, sub, secs, onDone, skipText) {
      body.textContent = '';
      body.appendChild(el('div', 'eyebrow', label));
      var wrap = el('div'); body.appendChild(wrap);
      var ring = el('div', 'ring'); ring.innerHTML = '<svg viewBox="0 0 200 200" width="200" height="200" aria-hidden="true"><circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="10"/><circle class="fg" cx="100" cy="100" r="88" fill="none" stroke="#E0455F" stroke-width="10" stroke-linecap="round" stroke-dashoffset="0"/></svg><div class="t" id="tick" aria-live="off"></div>';
      body.appendChild(ring); return { ring: ring, secs: secs, onDone: onDone, sub: sub, skipText: skipText };
    }
    function countdown(v, onDone) {
      var left = v.secs, fg = v.ring.querySelector('.fg'), t = v.ring.querySelector('.t');
      t.textContent = left; fg.style.strokeDashoffset = 0;
      if (timer) clearInterval(timer);
      requestAnimationFrame(function () { fg.style.strokeDashoffset = 553; fg.style.transitionDuration = v.secs + 's'; });
      timer = setInterval(function () { left--; t.textContent = left > 0 ? left : ''; if (left <= 0) { clearInterval(timer); timer = null; onDone(); } }, 1000);
    }
    function startSession() {
      var steps = []; cards.forEach(function (c) { c.items.forEach(function (e) { steps.push(e); }); });
      var skipAnim = $('skip').checked; ov.classList.add('on'); $('btn-quit').focus();
      function runStep(i) {
        if (i >= steps.length) return finish();
        var e = steps[i];
        var v = ringView('Exercice ' + (i + 1) + ' sur ' + steps.length, '', 7, null);
        var h = el('h2', null, e.n); h.style.marginTop = '4px';
        body.insertBefore(h, body.children[1]);
        body.insertBefore(el('p', 'lead', e.dose + ' — ' + e.how), body.children[2]); body.children[2].style.margin = '12px auto 0';
        var sk = el('button', 'btn ghost', 'Exercice suivant'); sk.type = 'button';
        sk.addEventListener('click', function () { if (timer) { clearInterval(timer); timer = null; } runStep(i + 1); });
        body.appendChild(sk);
        countdown(v, function () { runStep(i + 1); });
      }
      if (skipAnim) { runStep(0); return; }
      var v = ringView('Prépare-toi', '', 3, null); var h = el('h2', null, 'La séance commence'); h.style.marginTop = '4px'; body.insertBefore(h, body.children[1]);
      countdown(v, function () { runStep(0); });
    }
    function finish() {
      var xp = 0, cats = {}, combo = false;
      cards.forEach(function (c) { xp += c.xp; if (c.k === 'COMBO') combo = true; c.items.forEach(function (e) { cats[e.cat] = (cats[e.cat] || 0) + 1; }); });
      var st = load(); st.xp += xp; st.sessions.push({ d: dayKey(), xp: xp, cats: Object.keys(cats), combo: combo });
      for (var k in cats) { st.counts[k] = (st.counts[k] || 0) + cats[k]; }
      if (combo) st.combos += 1; save(st);
      body.textContent = '';
      body.appendChild(el('div', 'eyebrow', 'Séance terminée'));
      var h = el('h2', null, 'Bravo, +' + xp + ' XP'); h.style.margin = '10px 0'; body.appendChild(h);
      body.appendChild(el('p', 'lead', 'Chaque effort compte. Hydrate-toi, étire-toi doucement et reviens demain pour une nouvelle carte.')).style.margin = '10px auto 0';
      var row = el('div', 'btn-row'); row.style.justifyContent = 'center';
      var a = el('a', 'btn', 'Voir ma progression'); a.href = 'progression.html'; row.appendChild(a);
      var b = el('button', 'btn ghost', 'Fermer'); b.type = 'button'; b.addEventListener('click', function () { stop(); draw(); }); row.appendChild(b);
      body.appendChild(row);
    }
    $('btn-start').addEventListener('click', startSession);
    $('btn-open').addEventListener('click', draw);
    render();
  }

  /* ---------- Progression ---------- */
  var BADGES = [
    { t: '1', n: 'Première séance', d: 'Termine une séance complète', ok: function (s) { return s.sessions.length >= 1; } },
    { t: '3', n: '3 jours de flammes', d: 'Trois jours d\'affilée', ok: function (s) { return streak(s) >= 3; } },
    { t: '7', n: '7 jours de flammes', d: 'Une semaine d\'affilée', ok: function (s) { return streak(s) >= 7; } },
    { t: 'CB', n: 'Première carte Combo', d: 'Termine une carte Combo', ok: function (s) { return s.combos >= 1; } },
    { t: 'BC', n: 'Force du bas du corps', d: '5 exercices bas du corps réalisés', ok: function (s) { return (s.counts.bas || 0) >= 5; } },
    { t: 'MO', n: 'Souplesse', d: '3 exercices de mobilité réalisés', ok: function (s) { return (s.counts.mobilite || 0) >= 3; } }
  ];
  function initProgression(s) {
    var bar = $('xp-bar'); if (!bar) return;
    var lv = level(s.xp);
    $('lv').textContent = 'Niveau ' + lv.n; $('xp-txt').textContent = lv.into + ' / ' + lv.size + ' XP';
    setTimeout(function () { bar.style.width = Math.round(lv.into / lv.size * 100) + '%'; }, 80);
    $('streak').textContent = streak(s) + ' jour' + (streak(s) > 1 ? 's' : '');
    $('sessions').textContent = s.sessions.length;
    $('total-xp').textContent = s.xp;
    var wk = thisWeek(s), mob = wk.filter(function (x) { return x.cats.indexOf('mobilite') > -1; }).length, cb = wk.filter(function (x) { return x.combo; }).length;
    var defis = [['3 séances cette semaine', wk.length, 3, 'var(--rose)'], ['Une carte Combo terminée', cb, 1, 'var(--lilac)'], ['Une séance avec de la mobilité', mob, 1, 'var(--gold)']];
    var dl = $('defis'); dl.textContent = '';
    defis.forEach(function (d) {
      var v = Math.min(d[1], d[2]), w = el('div', 'defi'), r = el('div', 'row'); r.appendChild(el('span', null, d[0])); r.appendChild(el('span', 'muted small', v + ' / ' + d[2])); w.appendChild(r);
      var b = el('div', 'bar thin'); b.style.marginTop = '8px'; var i = el('i'); i.style.background = d[3]; i.style.width = Math.round(v / d[2] * 100) + '%'; b.appendChild(i); w.appendChild(b); dl.appendChild(w);
    });
    var bl = $('badges'); bl.textContent = '';
    BADGES.forEach(function (b) {
      var on = b.ok(s), w = el('div', 'badge' + (on ? ' on' : '')); w.appendChild(el('div', 'dot', b.t));
      var t = el('div'); t.appendChild(el('b', null, b.n)); t.appendChild(el('span', 'muted small', on ? 'Obtenu' : b.d)); w.appendChild(t); bl.appendChild(w);
    });
    var lbl = $('lvl-label'); if (lbl) lbl.textContent = s.squats === null ? 'Non renseigné (facultatif)' : levelLabel(s.squats);
    var rs = $('reset'); if (rs) rs.addEventListener('click', function () { if (confirm('Effacer toute ta progression sur cet appareil ?')) { save(fresh()); location.reload(); } });
  }

  /* ---------- Niveau ---------- */
  function levelLabel(n) { return n < 8 ? 'Découverte' : n < 20 ? 'Intermédiaire' : 'Confirmée'; }
  function initNiveau(s) {
    var form = $('lvl-form'); if (!form) return;
    function show(n) {
      var r = Math.max(5, Math.min(25, Math.round(n * 0.6))), out = $('lvl-out'); out.textContent = ''; out.className = 'result';
      out.appendChild(el('div', 'eyebrow', 'Ton repère de départ'));
      var h = el('h3', null, levelLabel(n)); h.style.margin = '8px 0 12px'; out.appendChild(h);
      var ul = el('ul', 'tick');
      [['Squat goblet', '3 × ' + r], ['Pont fessier', '3 × ' + Math.min(25, r + 3)], ['Fentes arrière', '3 × ' + Math.max(6, Math.round(r * 0.8)) + ' / jambe']].forEach(function (x) { var li = el('li'); var b = el('b', null, x[0] + ' : '); li.appendChild(b); li.appendChild(document.createTextNode(x[1])); ul.appendChild(li); });
      out.appendChild(ul);
      out.appendChild(el('p', 'small muted', 'Ces valeurs sont volontairement modérées : tu progresseras séance après séance.')).style.margin = '14px 0 0';
      var a = el('a', 'btn', 'Voir les programmes'); a.href = 'programmes.html#bas'; a.style.marginTop = '18px'; out.appendChild(a);
    }
    if (s.squats !== null) { $('squats').value = s.squats; show(s.squats); }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var n = parseInt($('squats').value, 10);
      if (isNaN(n) || n < 0 || n > 200) { $('lvl-out').className = 'note'; $('lvl-out').textContent = 'Entre un nombre de squats entre 0 et 200.'; return; }
      var st = load(); st.squats = n; save(st); show(n);
    });
    var cl = $('lvl-clear'); if (cl) cl.addEventListener('click', function () { var st = load(); st.squats = null; save(st); $('squats').value = ''; $('lvl-out').textContent = ''; $('lvl-out').className = ''; });
  }

  /* ---------- Communauté (partage + journal local) ---------- */
  function initCommunaute(s) {
    var sh = $('share'); if (!sh) return;
    function msg() { var st = load(); return 'Niveau ' + level(st.xp).n + ' sur neV.BOOSTER · ' + streak(st) + ' jour(s) de flammes · ' + st.sessions.length + ' séance(s). Chaque effort compte !'; }
    $('share-txt').textContent = msg();
    sh.addEventListener('click', function () {
      var t = msg();
      function done() { $('share-ok').textContent = 'Message copié.'; }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(done, function () { $('share-ok').textContent = 'Copie impossible : sélectionne le texte ci-dessus.'; }); }
      else { $('share-ok').textContent = 'Copie impossible : sélectionne le texte ci-dessus.'; }
    });
    var list = $('notes');
    function renderNotes() {
      var st = load(); list.textContent = '';
      if (!st.notes.length) { list.appendChild(el('p', 'muted', 'Ton journal est vide pour le moment.')); return; }
      st.notes.slice().reverse().forEach(function (n, ri) {
        var idx = st.notes.length - 1 - ri, c = el('div', 'card'); c.style.marginTop = '12px'; c.style.padding = '20px';
        c.appendChild(el('div', 'muted small', n.d)); c.appendChild(el('p', null, n.t)).style.margin = '6px 0 10px';
        var b = el('button', 'btn ghost', 'Supprimer'); b.type = 'button'; b.style.padding = '8px 16px'; b.addEventListener('click', function () { var s2 = load(); s2.notes.splice(idx, 1); save(s2); renderNotes(); });
        c.appendChild(b); list.appendChild(c);
      });
    }
    $('note-form').addEventListener('submit', function (e) {
      e.preventDefault(); var t = $('note-in').value.trim(); if (!t) return;
      var st = load(); st.notes.push({ d: new Date().toLocaleDateString('fr-FR'), t: t.slice(0, 500) }); save(st); $('note-in').value = ''; renderNotes();
    });
    renderNotes();
  }

  /* ---------- Démarrage ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    chrome(); yukiHello(); var s = load(), p = document.body.getAttribute('data-page');
    if (p === 'home') initHome(s);
    else if (p === 'programmes') initProgrammes(s);
    else if (p === 'gacha') initGacha(s);
    else if (p === 'progression') initProgression(s);
    else if (p === 'niveau') initNiveau(s);
    else if (p === 'communaute') initCommunaute(s);
  });
})();
