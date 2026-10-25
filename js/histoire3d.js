/* ==========================================================
   neV.BOOSTER — histoire3d.js
   L'histoire en 3D (8 scènes), adaptée de l'animation de référence « neV. BOOSTER – 3D » :
   même personnage et mêmes scènes, mais hébergée sur le site (aucun fichier externe),
   avec pause / scène suivante / précédente, « Passer », respect de « réduire les animations »,
   pause quand l'onglet est caché, et repli lisible si la 3D est impossible.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = g.NEV, doc = g.document, $ = (i) => doc.getElementById(i);
  const reduce = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fail = () => { $('nogl').hidden = false; $('hud').style.display = 'none'; $('cv').style.display = 'none'; [ 'bPrev', 'bPlay', 'bNext' ].forEach((id) => { $(id).disabled = true; }); $('btn').style.display = 'block'; $('btn').style.bottom = '4cqh'; doc.querySelector('.hi-txt').open = true; };
  if (!NEV.Fig3D || !NEV.Fig3D.webgl()) { fail(); return; }
  try { const s = NEV.auth && NEV.auth.current && NEV.auth.current(); if (s) $('btn').setAttribute('href', 'gacha.html'); } catch (e) { /* ignoré */ }

  NEV.Fig3D.load().then(start).catch((e) => { if (g.console) g.console.error("histoire3d:", e && e.stack || e); fail(); });

  function start() {
    const THREE = g.THREE, st = $('stage');
    const L = (a, b, t) => a + (b - a) * t;
    const X = NEV.Fig3D.stage($('cv'), { fov: 40, floor: true });
    const S = X.S, cam = X.cam, R = X.R, E = X.E, M = X.M, person = X.person, fl = X.floor;
    X.rim.position.set(-3, 3, -2);

    /* décor : ville au fond */
    const wc = doc.createElement('canvas'); wc.width = 64; wc.height = 128;
    { const x = wc.getContext('2d'); x.fillStyle = '#120610'; x.fillRect(0, 0, 64, 128); for (let i = 0; i < 60; i++) { x.fillStyle = Math.random() > 0.4 ? '#f3c98b' : '#3a1a28'; x.fillRect(4 + (i % 5) * 12, 4 + Math.floor(i / 5) * 10, 6, 6); } }
    const wt = new THREE.CanvasTexture(wc), city = new THREE.Group(); S.add(city);
    for (let i = 0; i < 34; i++) { const h = 2 + Math.random() * 8, m = new THREE.Mesh(new THREE.BoxGeometry(1.6 + Math.random(), h, 1.6), new THREE.MeshStandardMaterial({ color: 0x2a1020, map: wt, emissiveMap: wt, emissive: 0x886644 })); m.position.set(-16 + (i / 34) * 32, h / 2, -9 - Math.random() * 5); city.add(m); }
    const sun = new THREE.Mesh(new THREE.SphereGeometry(2, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); sun.position.set(2, 6, -16); city.add(sun);

    /* personnages */
    const SK = NEV.Fig3D.SKIN, hero = person(SK, NEV.Fig3D.SHIRT);
    const girls = [[0xc58a60, 0xff7fb0], [0x6b3f25, 0x58b4f0], [0xc58a60, 0xf5d442]].map((c) => person(c[0], c[1], c[1]));
    const old = person(SK, NEV.Fig3D.SHIRT);
    const hv = (P, v) => { P.g.visible = v; };

    /* accessoires */
    const room = new THREE.Group(); S.add(room);
    const bx = (w, h, d, c, x, y, z, e) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, e)); m.position.set(x, y, z); return m; };
    room.add(bx(1.4, 0.5, 2.8, 0x8a1538, 0, 0.25, 0), bx(1.4, 0.15, 0.6, 0xffffff, 0, 0.58, -1.1), bx(12, 6, 0.1, 0x3a1228, 0, 3, -2.6), bx(1.9, 1.9, 0.12, 0xff9ab0, 2, 2.4, -2.52, 0x663040), bx(1.6, 1.6, 0.1, 0xffb070, 2, 2.4, -2.45, 0xff8a4a), bx(0.06, 1.6, 0.12, 0x3a1228, 2, 2.4, -2.4), bx(1.6, 0.06, 0.12, 0x3a1228, 2, 2.4, -2.4));
    function frame(w, h, y, z) { const gp = new THREE.Group(), t = 0.08, c = M(0xff8aa8, 0xff3d6e);[[w, t, 0, h / 2], [w, t, 0, -h / 2], [t, h, w / 2, 0], [t, h, -w / 2, 0]].forEach((a) => { const m = new THREE.Mesh(new THREE.BoxGeometry(a[0], a[1], 0.08), c); m.position.set(a[2], a[3], 0); gp.add(m); }); const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0x4a1230, transparent: true, opacity: 0.55 })); p.position.z = -0.02; gp.add(p); gp.position.set(0, y, z); S.add(gp); return gp; }
    const mirror = frame(1.9, 2.7, 1.35, -0.9);
    const cloud = new THREE.Group();[[0, 0, 0.7], [0.6, 0.1, 0.55], [-0.6, -0.05, 0.55]].forEach((a) => { const m = new THREE.Mesh(new THREE.SphereGeometry(a[2], 12, 10), M(0x35323f)); m.position.set(a[0], a[1], 0); cloud.add(m); }); S.add(cloud);
    const rg = new THREE.BufferGeometry(), rp = new Float32Array(150); for (let i = 0; i < 50; i++) { rp[i * 3] = (Math.random() - 0.5) * 1.4; rp[i * 3 + 1] = Math.random() * 2; rp[i * 3 + 2] = (Math.random() - 0.5) * 0.6; }
    rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); const rain = new THREE.Points(rg, new THREE.PointsMaterial({ color: 0x99aacc, size: 0.05 })); S.add(rain);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.35, 5), M(0xffc233, 0x886600)); S.add(crown);
    function ctex(l, r, c) { const k = doc.createElement('canvas'); k.width = 200; k.height = 290; const x = k.getContext('2d'); x.fillStyle = '#2a0a1a'; x.fillRect(0, 0, 200, 290); x.strokeStyle = c; x.lineWidth = 8; x.strokeRect(6, 6, 188, 278); x.fillStyle = c; x.font = 'bold 22px sans-serif'; x.textAlign = 'center'; if (l) { x.fillText(r, 100, 44); x.fillStyle = '#fff'; x.font = 'bold 30px sans-serif'; x.fillText(l, 100, 200); x.font = '24px sans-serif'; x.fillText('3 × 5 reps', 100, 240); x.beginPath(); x.arc(100, 120, 34, 0, 7); x.fill(); } else { x.font = 'bold 120px sans-serif'; x.fillText('✦', 100, 170); } return new THREE.CanvasTexture(k); }
    const cards = new THREE.Group(); S.add(cards);
    [['SQUATS', 'RARE', '#ff6a8a'], ['POMPES', 'ÉPIQUE', '#ffc233'], ['ABDOS', 'COMMUN', '#dddddd'], ['ÉPAULES', 'RARE', '#ff6a8a']].forEach((d, i) => { const bk = new THREE.MeshBasicMaterial({ map: ctex(0, 0, '#ff3d6e') }), fr = new THREE.MeshBasicMaterial({ map: ctex(d[0], d[1], d[2]) }), sd = M(0x331020), m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.15, 0.03), [sd, sd, sd, sd, fr, bk]); m.position.x = (i - 1.5) * 0.95; cards.add(m); });
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 0.5, 24), M(0x8a1538, 0xff3d6e)); S.add(ped);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 5, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xff8aa8, transparent: true, opacity: 0.15, side: THREE.DoubleSide })); cone.position.set(0, 2.5, 0); cone.rotation.x = Math.PI; S.add(cone);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.03, 8, 40), M(0xff3d6e, 0xff3d6e)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; S.add(ring);

    /* textes et caméra */
    const $$ = (i, h) => { $(i).innerHTML = h; };
    const cap = (t, r) => { const c = $('cap'); if (c.dataset.t !== t) { c.dataset.t = t; c.textContent = t; c.className = r ? 'r' : ''; } };
    const lab = (a) => a.map((x) => '<small>' + x[0] + '</small>' + x[1]).join('');
    const bub = (t, x, y) => { const b = $('bub'); b.textContent = t; b.style.left = x + '%'; b.style.top = y + '%'; b.style.opacity = t ? 1 : 0; };
    const view = (x, y, z, tx, ty, tz) => { cam.position.set(x, y, z); cam.lookAt(tx, ty, tz); };
    const bg = (c) => { S.background = new THREE.Color(c); S.fog = new THREE.Fog(c, 12, 30); };
    const tabs = (i) => ['SQUATS', 'POMPES', 'ABDOS', 'ÉPAULES'].map((n, j) => '<span class="pill" style="opacity:' + (j <= i ? 1 : 0.35) + '">' + n + (j < i ? ' ✓' : '') + '</span>').join('');
    const flameTxt = (d) => '🔥 ' + d + ' jours de suite';
    function show(o) { room.visible = !!o.room; city.visible = !!o.city; fl.visible = !o.cards; hv(hero, !!o.hero); girls.forEach((x) => hv(x, !!o.girls)); hv(old, !!o.old); mirror.visible = !!o.mirror; cards.visible = ped.visible = cone.visible = !!o.cards; cloud.visible = rain.visible = !!o.cloud; crown.visible = false; ring.visible = !!o.hero && !o.room; ring.position.set(hero.g.position.x, 0.02, 0); }

    const sn = [
      { d: 5.5, en() { bg(0x2a0a1a); show({ room: 1, hero: 1 }); $$('side', ''); $$('bot', '<span class="pill" style="font-size:7cqw">⏰ 06:00</span>'); cap('Il se réveille…'); },
        up(t) { hero.reset(); hero.setM(0); const e = E((t - 1.2) / 1.3), a = L(-Math.PI / 2, -0.05, e); hero.g.position.set(0, -0.2, 0.1); hero.b.rotation.x = a; hero.hp.forEach((h) => { h.rotation.x = -Math.PI / 2 - a; }); const s = E((t - 2.6) / 1); hero.sh.forEach((x, i) => { x.rotation.z = (i ? -1 : 1) * L(0.1, 2.7, s); }); hero.head.rotation.x = -0.2 * s; view(L(3.4, 2.4, t / 5.5), L(1.6, 1.9, t / 5.5), L(4.4, 3.6, t / 5.5), 0, 1, 0); } },
      { d: 6.5, en() { bg(0x1a0612); show({ city: 1, hero: 1, mirror: 1 }); $$('bot', ''); cap('Son reflet lui dit tout'); $$('side', lab([['Épaules', 'étroites'], ['Bras', 'fins'], ['Taille', 'très mince'], ['Jambes', 'peu de masse']])); },
        up(t) { hero.reset(); hero.setM(0); hero.g.position.set(0, 0, 0); hero.sh.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * 0.55; }); hero.el.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * -1.5; }); hero.head.rotation.z = t < 3.2 ? 0.15 : 0; if (t > 3.2) { cap('Trop maigre.', 1); hero.sh.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * 0.9; a.rotation.x = -0.5; }); hero.el.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * -2.2; }); } hero.b.position.y = 1 + Math.sin(t * 3) * 0.01; view(L(1.2, -0.6, t / 6.5), 1.4, L(6.5, 4.5, t / 6.5), 0, 1.1, 0); } },
      { d: 9, en() { bg(0x1a0612); show({ city: 1, hero: 1, girls: 1 }); hero.rose.visible = true; $$('side', ''); cap('Un jour, il ose aller vers elles'); },
        up(t) { hero.reset(); hero.setM(0); hero.g.position.set(L(-4, -2, E(t / 2)), 0, 0); hero.g.rotation.y = Math.PI / 2; const w = t < 2 ? Math.sin(t * 9) * 0.5 : 0; hero.hp[0].rotation.x = w; hero.hp[1].rotation.x = -w;
          girls.forEach((p, i) => { p.reset(); p.setM(0); p.g.position.set(0.9 + i * 0.9, 0, 0); p.g.rotation.y = -Math.PI / 2 + E((t - 4) / 0.7) * Math.PI; p.sh[0].rotation.z = 0.25; p.sh[1].rotation.z = -0.25; });
          hero.sh[0].rotation.z = t > 2 && t < 4 ? 2.4 + Math.sin(t * 9) * 0.3 : 0.3; hero.sh[1].rotation.z = -0.3;
          bub(t > 2.2 && t < 3.4 ? 'Salut…' : t > 4.2 && t < 5.8 ? 'Pas mon genre.' : '', t > 4 ? 62 : 35, 45);
          $('stamp').style.opacity = t > 5.2 && t < 8.5 ? 1 : 0;
          if (t > 3.5) cap('Mais les filles ne le voient pas'); if (t > 5.2) cap('Refusé.', 1); if (t > 6.6) cap('Invisible.');
          const sl = E((t - 5.5) / 1); hero.b.rotation.x = 0.25 * sl; hero.head.rotation.x = 0.5 * sl; hero.sh.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * 0.1; a.rotation.x = 0.1; });
          const c = t > 5.5; cloud.position.set(hero.g.position.x, 2.9, 0); cloud.visible = c; rain.visible = c; rain.position.set(hero.g.position.x, 0, 0); const q = rg.attributes.position; for (let i = 0; i < 50; i++) { q.array[i * 3 + 1] = (q.array[i * 3 + 1] - 0.04 + 2.5) % 2.5; } q.needsUpdate = true;
          view(0, 1.7, L(8, 6.4, t / 9), 0, 1.1, 0); }, ex() { hero.rose.visible = false; $('stamp').style.opacity = 0; bub(''); } },
      { d: 6.5, en() { bg(0x0b0309); show({ cards: 1 }); $$('side', ''); $$('bot', ''); cap('Alors, il décide de changer'); },
        up(t) { ped.position.set(0, 0.25, 0); cone.rotation.x = Math.PI; const rise = E(t / 1.2); cards.position.set(0, L(0.4, 1.7, rise), 0); cards.children.forEach((c, i) => { c.position.y = Math.sin(t * 2 + i) * 0.08; c.rotation.y = Math.PI - E((t - 2.2 - i * 0.45) / 0.7) * Math.PI + (t < 2.2 ? Math.sin(t * 3) * 0.15 : 0); }); ring.visible = true; ring.position.set(0, 0.5, 0); ring.scale.setScalar(1 + Math.sin(t * 3) * 0.05); if (t > 1.5) cap('Chaque matin, 4 cartes au hasard'); if (t > 4.6) cap('Le gacha décide'); view(0, L(1.8, 2, t / 6.5), L(6.5, 5, t / 6.5), 0, 1.5, 0); } },
      { d: 9, en() { bg(0x16060e); show({ hero: 1 }); $$('side', ''); cap('Une carte. Un exercice.'); },
        up(t) { hero.reset(); hero.setM(0.1); const ex = t < 3 ? 0 : t < 6 ? 1 : 2, xp = Math.floor(L(0, 34, t / 9)); $$('bot', '<div>' + tabs(ex) + '</div><div class="pill" style="font-size:6cqw">+' + xp + ' XP du jour</div>');
          if (ex === 0) { const s = (1 - Math.cos(t * Math.PI * 2 / 1.5)) / 2, a = 0.9 * s; hero.b.position.y = Math.cos(a); hero.hp.forEach((h) => { h.rotation.x = -a; }); hero.kn.forEach((k) => { k.rotation.x = 2 * a; }); hero.sh.forEach((x) => { x.rotation.x = -1.4 * s; }); hero.b.rotation.x = 0.25 * s; if (t > 2) cap('Squats, pompes, abdos, épaules…'); }
          else if (ex === 1) { cap('Squats, pompes, abdos, épaules…'); const s = (1 - Math.cos((t - 3) * Math.PI * 2 / 1.2)) / 2, th = 1 + 0.22 * s; hero.g.rotation.x = th; hero.g.position.set(0, 0.05, -0.6); hero.sh.forEach((x) => { x.rotation.x = -th; }); hero.head.rotation.x = -0.5; }
          else { cap('Chaque jour, sans excuse'); const s = (1 - Math.cos((t - 6) * Math.PI * 2 / 1.4)) / 2; hero.db.forEach((d) => { d.visible = true; }); hero.sh.forEach((x, i) => { x.rotation.z = (i ? -1 : 1) * (0.1 + 1.35 * s); }); }
          if (ex < 2) hero.db.forEach((d) => { d.visible = false; });
          view(L(2.5, -2.2, t / 9), L(1.5, 1.2, t / 9), L(5, 4.2, t / 9), 0, 0.9, 0); }, ex() { hero.db.forEach((d) => { d.visible = false; }); } },
      { d: 8, en() { bg(0x16060e); show({ hero: 1 }); cap('Jour après jour…'); $$('side', ''); },
        up(t) { hero.reset(); const p = E(t / 6.8), d = Math.max(1, Math.round(L(1, 90, p))); hero.setM(L(0.04, 1, p)); hero.g.rotation.y = Math.sin(t * 0.5) * 0.4; hero.sh.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * (0.15 + 0.2 * p); });
          hero.g.position.y = 0; cap(d >= 88 ? 'Les muscles apparaissent' : 'Jour après jour…');
          $$('bot', '<div class="pill" style="font-size:7cqw">Jour ' + d + ' / 90</div><div>' + flameTxt(d) + '</div>');
          $$('side', lab([['Force', Math.round(L(24, 88, p)) + '%'], ['Muscles', Math.round(L(21, 92, p)) + '%'], ['Charme', Math.round(L(20, 96, p)) + '%']]));
          view(L(1, 3.6, p), L(1.4, 1.6, p), L(5.5, 5, p), 0, 1.1, 0); } },
      { d: 6.5, en() { bg(0x2a0a1a); show({ hero: 1, mirror: 1, city: 1 }); mirror.position.set(0, 1.5, -0.9); mirror.scale.set(1.25, 1.25, 1); cap('Tout son corps a changé'); },
        up(t) { hero.reset(); hero.setM(1); hero.g.rotation.y = Math.sin(t) * 0.35; const bi = E(t / 0.8); hero.sh.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * L(0.2, 1.35, bi); }); hero.el.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * L(0, 1.9, bi); }); hero.head.rotation.z = 0.05;
          if (t > 2.8) cap('Beau. Craquant. Sûr de lui.', 1);
          $$('side', lab([['Sourire', 'éclatant ✓'], ['Épaules', 'larges ✓'], ['Pecs', 'dessinés ✓'], ['Abdos', 'ciselés ✓'], ['Bras', 'puissants ✓'], ['Jambes', 'solides ✓']]).split('<small>').slice(0, 1 + Math.min(6, Math.floor(t * 1.8))).join('<small>'));
          view(L(-2, 2, t / 6.5), 1.7, L(5.2, 4.2, t / 6.5), 0, 1.5, 0); }, ex() { mirror.scale.set(1, 1, 1); mirror.position.set(0, 1.35, -0.9); } },
      { d: 8, en() { bg(0x7a2a45); show({ city: 1, hero: 1, girls: 1, old: 1 }); hero.shirt(0xd81e3c); $$('side', ''); $$('bot', ''); cap('90 jours plus tard'); },
        up(t) { hero.reset(); hero.setM(1); hero.shirt(0xd81e3c); hero.g.position.set(-0.6, 0, 0); hero.g.rotation.y = 0.5; hero.sh[0].rotation.z = 0.4; hero.sh[1].rotation.z = -0.4;
          girls.forEach((p, i) => { p.reset(); p.setM(0); const j = E((t - 2) / 0.6); p.g.position.set(1.1 + i * 0.9, Math.max(0, Math.sin(t * 6 + i)) * 0.12 * j, 0); p.g.rotation.y = Math.PI / 2 + 0.2; p.sh.forEach((a, k) => { a.rotation.z = (k ? -1 : 1) * (0.25 + j * 2.2); }); });
          old.reset(); old.setM(0); old.g.position.set(-3.2, 0, 0.4); old.g.rotation.y = Math.PI / 2 - 0.2; old.sh[0].rotation.z = 1.4 + Math.sin(t * 6) * 0.2; old.g.visible = t > 5;
          if (t > 2) cap('Les filles se retournent'); if (t > 3) cap('Il est devenu populaire'); if (t > 5) cap('Une référence.', 1);
          bub(t > 3 && t < 5 ? 'Il est qui lui ?!' : t > 5.4 ? 'Moi aussi !' : '', t > 5.4 ? 20 : 62, t > 5.4 ? 50 : 48);
          const n = Math.floor(L(0, 98214, E((t - 3) / 4))); $$('bot', t > 3 ? '<div class="pill">♥ J\'aime ' + n + '</div>' + (t > 4.5 ? '<div class="pill">Abonnés +' + Math.floor(n * 0.12) + '</div><div class="pill">Messages ' + Math.floor(n * 0.033) + '</div>' : '') : '');
          crown.visible = t > 5; crown.position.set(-0.6, 3.1, 0); crown.rotation.y = t * 2;
          view(0, 1.8, L(8, 6.5, t / 8), -0.3, 1.3, 0); }, ex() { hero.shirt(null); bub(''); hv(old, false); } },
      { d: 6, en() { bg(0x12040b); show({ cards: 1 }); cards.visible = false; $$('side', ''); $$('bot', ''); cap('Et toi ? Tire ta carte.', 1); $('btn').style.display = 'block'; },
        up(t) { ped.position.set(0, 0.25, 0); const c = cards.children[1]; cards.visible = true; cards.children.forEach((x, i) => { x.visible = i === 1; }); cards.position.set(0, 1.7 + Math.sin(t * 2) * 0.1, 0); c.position.x = 0; c.rotation.y = t * 1.2; view(0, 1.9, 5, 0, 1.6, 0); }, ex() { cards.children.forEach((x) => { x.visible = true; }); $('btn').style.display = 'none'; } }
    ];

    /* chronologie : le temps n'avance que si l'animation joue */
    let i = -1, el = 0, paused = reduce, last = performance.now(), alive = true;
    const total = sn.length, bPlay = $('bPlay'), count = $('bCount');
    function label() { bPlay.textContent = paused ? '▶' : '⏸'; bPlay.setAttribute('aria-label', paused ? 'Lecture' : 'Pause'); count.textContent = (i + 1) + ' / ' + total; }
    function go(n) {
      n = Math.max(0, Math.min(total - 1, n));
      if (i >= 0 && sn[i].ex) sn[i].ex();
      i = n; el = paused ? sn[i].d * 0.62 : 0; sn[i].en(); $('cap').dataset.t = ''; label();
    }
    bPlay.addEventListener('click', () => { paused = !paused; if (!paused && el >= sn[i].d - 0.3) el = 0; label(); });
    $('bPrev').addEventListener('click', () => go(i - 1));
    $('bNext').addEventListener('click', () => go(i + 1));
    doc.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(i + 1); else if (e.key === 'ArrowLeft') go(i - 1); else if (e.key === ' ' && e.target === doc.body) { e.preventDefault(); bPlay.click(); } });
    go(0);
    function tick() {
      if (!alive) return;
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!paused) el += dt;
      const s = sn[i];
      s.up(Math.min(el, s.d));
      $('fade').style.opacity = paused ? 0 : (el < 0.35 ? 1 - el / 0.35 : (el > s.d - 0.3 && i < total - 1 ? (el - (s.d - 0.3)) / 0.3 : 0));
      if (!paused && el > s.d && i < total - 1) go(i + 1);
      else if (!paused && el > s.d && i === total - 1) el = s.d; // dernière scène : on reste sur « Tire ta carte »
      R.render(S, cam);
    }
    R.setAnimationLoop(tick);
    doc.addEventListener('visibilitychange', () => { last = performance.now(); R.setAnimationLoop(doc.hidden ? null : tick); });
    g.addEventListener('pagehide', () => { alive = false; X.dispose(); });
  }
})(window);
