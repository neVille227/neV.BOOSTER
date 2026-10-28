/* ==========================================================
   neV.BOOSTER — histoire-anime.js
   Lecteur de « 90 jours pour changer » : scène 3D plein cadre + chapitres + voix off.
   - Tout est piloté par UNE horloge t (secondes) : lecture normale, saut de chapitre, et rendu
     image par image pour la vidéo (?render=1 puis window.NEVSTORY.seek(t)).
   - S'adapte à tous les écrans : paysage (3D à gauche, texte à droite), portrait (3D en haut,
     texte en bas), téléphone en paysage (version compacte), ultra-large, tablette…
   - On peut bouger : souris/doigt qui glisse = la scène tourne ; la tête du personnage suit le
     curseur ; toucher le personnage = il réagit ; inclinaison du téléphone (gyroscope) = parallaxe.
   - Respecte « réduire les animations », se met en pause quand l'onglet est caché,
     et garde un repli lisible (sans 3D) si WebGL est absent.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {}), doc = g.document, DATA = NEV.StoryData, $ = (i) => doc.getElementById(i);
  const qs = new g.URLSearchParams(g.location.search), RENDER = qs.has('render'), FIX = qs.get('t');
  const reduce = !RENDER && g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = DATA.T, N = T.length - 1, END = T[N];
  const root = $('fk'), audio = $('voice'), startBtn = $('start'), ppBtn = $('pp'), ppi = $('ppi'), sndBtn = $('snd'), tiltBtn = $('tilt'), curtain = $('curtain'), hint = $('hint');
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), E = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  if (RENDER) root.classList.add('render');
  try { const s = NEV.auth && NEV.auth.current && NEV.auth.current(); if (s) { $('cta').setAttribute('href', 'gacha.html'); $('skip').setAttribute('href', 'accueil.html'); } } catch (e) { /* ignoré */ }

  /* ---------- construction des diapos à partir des données ---------- */
  const splitLetters = (el, text) => { el.setAttribute('aria-label', text); let n = 0; el.innerHTML = text.split(' ').map((w) => '<span style="display:inline-block;white-space:nowrap" aria-hidden="true">' + [...w].map((c) => '<span class="l" style="animation-delay:' + (0.25 + (n++) * 0.045).toFixed(3) + 's">' + c + '</span>').join('') + '</span>').join(' '); };
  /* mots du récit : apparaissent à la cadence de la voix (poids = longueur du mot + pause après la ponctuation) */
  function words(el, text, i) {
    const w = text.trim().split(/\s+/), lead = (DATA.voiceAt[i] || 1) - T[i], dur = DATA.voiceDur[i] || (T[i + 1] - T[i] - 3);
    const wt = w.map((x) => x.length + (/[.,:;!?…»]$/.test(x) ? 3.2 : 0.6)), tot = wt.reduce((a, b) => a + b, 0); let acc = 0;
    el.setAttribute('aria-label', w.join(' '));
    el.innerHTML = w.map((x, k) => { const d = lead + 0.05 + (acc / tot) * dur * 0.96; acc += wt[k]; return '<span aria-hidden="true" style="animation-delay:' + d.toFixed(2) + 's">' + x + ' </span>'; }).join('');
  }
  $('bigTitle').setAttribute('aria-label', DATA.title.big); splitLetters($('bigTitle'), DATA.title.big); $('subTitle').textContent = DATA.title.sub; root.querySelector('.eyebrow').textContent = DATA.title.eyebrow;
  const host = $('slides'), sr = $('sr');
  DATA.chapters.forEach((c, k) => {
    const i = k + 1, s = doc.createElement('section'); s.className = 'slide'; s.dataset.s = i; s.setAttribute('aria-label', 'Chapitre ' + i);
    s.innerHTML = '<div class="txt"><p class="kicker">CHAPITRE ' + i + ' / ' + DATA.chapters.length + '</p><div class="num">' + (i < 10 ? '0' : '') + i + '</div><h2 class="h"></h2><span class="rule"></span><p class="tag"></p><p class="story"></p></div>';
    s.querySelector('.h').textContent = c.h; s.querySelector('.tag').textContent = c.tag; words(s.querySelector('.story'), c.story, i);
    if (c.icons) { const ul = doc.createElement('ul'); ul.className = 'ico'; ul.innerHTML = c.icons.map((a, j) => '<li style="animation-delay:' + (((DATA.voiceAt[i] - T[i]) + 3.2 + j * 1.9)).toFixed(2) + 's">' + a[1] + a[0] + '</li>').join(''); s.querySelector('.txt').appendChild(ul); }
    host.appendChild(s);
    const h = doc.createElement('div'); h.innerHTML = '<h2></h2><p></p>'; h.firstChild.textContent = c.h; h.lastChild.textContent = c.story; sr.appendChild(h);
  });
  splitLetters($('bigEnd'), DATA.end.big); $('subEnd').textContent = DATA.end.sub; $('cta').textContent = DATA.end.cta; $('note').textContent = DATA.note;
  $('pillsEnd').innerHTML = DATA.end.pills.map((p, j) => '<em style="animation-delay:' + (1.5 + j * 0.2).toFixed(2) + 's">' + p + '</em>').join('');
  { const e = doc.createElement('p'); e.textContent = DATA.end.story + ' ' + DATA.note; sr.appendChild(e); }
  const slides = [].slice.call(root.querySelectorAll('.slide')).sort((a, b) => a.dataset.s - b.dataset.s);
  slides.forEach((s, i) => { s.style.setProperty('--dur', (T[i + 1] - T[i]) + 's'); });
  const fills = slides.map((s, i) => { const b = doc.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', i === 0 ? 'Titre' : i === N - 1 ? 'Conclusion' : 'Chapitre ' + i); b.innerHTML = '<b></b>'; b.addEventListener('click', () => seek(T[i] + 0.01)); $('bars').appendChild(b); return b.firstChild; });

  /* ---------- état ---------- */
  let lastFix = 0, t = 0, cur = -1, playing = false, last = 0, useVoice = false, anims = [], scene3d = null, ready3d = false, curScene = -1;
  const idxAt = (x) => { let i = 0; while (i < N - 1 && x >= T[i + 1]) i++; return i; };

  /* ---------- mise en page : paysage / portrait / écran court ---------- */
  let W = 1, H = 1, zone = { cx: 0.5, cy: 0.5, w: 1, h: 1 };
  function layout() {
    W = root.clientWidth || g.innerWidth; H = root.clientHeight || g.innerHeight;
    const wide = W / H >= 1.0, short = H < 500;
    root.classList.toggle('wide', wide); root.classList.toggle('tall', !wide); root.classList.toggle('short', short);
    const u = wide ? Math.max(5.2, Math.min(W / 100, H * 1.7778 / 100)) : Math.max(3.4, Math.min(W / 100, H * 0.5806 / 100));
    root.style.setProperty('--u', u.toFixed(3) + 'px');
    const title = cur === 0;
    zone = title ? { cx: W / 2, cy: H * 0.5, w: W, h: H } : wide ? { cx: W * 0.265, cy: H * 0.52, w: W * 0.5, h: H } : { cx: W / 2, cy: H * 0.235, w: W, h: H * 0.47 };
    if (ready3d) fit3d();
  }

  /* ---------- 3D ---------- */
  const mouse = { x: 0, y: 0 }, orb = { yaw: 0, pitch: 0, vy: 0, vp: 0, idle: 9, tx: 0, ty: 0 }, tilt = { x: 0, y: 0, on: false, b0: null };
  let X = null, cam = null, R = null, S = null, ctx3 = null, scenes = null, camV = { p: [0, 1.6, 6], t: [0, 1, 0] }, dpr = 1, frames = 0, ftime = 0, react = null;
  const hudCache = {}, hud = {
    set(k, v) {
      const j = typeof v === 'string' ? v : JSON.stringify(v); if (hudCache[k] === j) return; hudCache[k] = j;
      if (k === 'side') $('hSide').innerHTML = v || ''; else if (k === 'bot') $('hBot').innerHTML = v || '';
      else if (k === 'stamp') $('hStamp').style.opacity = v ? 1 : 0;
      else if (k === 'bub') { const b = $('hBub'); if (!v) { b.style.opacity = 0; } else { b.textContent = v.t; b.style.left = v.x + '%'; b.style.top = v.y + '%'; b.className = 'hud-bub' + (v.r ? ' r' : ''); b.style.opacity = 1; } }
    },
    clear() { ['side', 'bot'].forEach((k) => hud.set(k, '')); hud.set('stamp', 0); hud.set('bub', null); }
  };
  function fit3d() {
    if (!R) return;
    const w = Math.max(2, Math.round(W)), h = Math.max(2, Math.round(H));
    R.setPixelRatio(dpr); R.setSize(w, h, false); cam.aspect = w / h;
    /* cadrage : le sujet occupe la « zone 3D » ; on recule la caméra pour qu'il y tienne, et on décale l'image */
    const za = zone.w / zone.h, A0 = 0.82, mult = Math.max(1, A0 / za);
    cam.userData.K = (h / zone.h) * mult; cam.userData.ox = w / 2 - zone.cx; cam.userData.oy = h / 2 - zone.cy;
    cam.setViewOffset(w, h, cam.userData.ox, cam.userData.oy, w, h); cam.updateProjectionMatrix();
  }
  function applyCam(now) {
    const K = cam.userData.K || 1, p = camV.p, tg = camV.t;
    let dx = (p[0] - tg[0]) * K, dy = (p[1] - tg[1]) * K, dz = (p[2] - tg[2]) * K;
    const r = Math.hypot(dx, dy, dz) || 1; let th = Math.atan2(dx, dz), ph = Math.asin(clamp(dy / r, -1, 1));
    const sway = reduce || RENDER ? 0 : 1;
    th += orb.yaw + tilt.x * 0.3 * sway + Math.sin(now * 0.00035) * 0.02 * sway; ph = clamp(ph + orb.pitch + tilt.y * 0.12 * sway + Math.sin(now * 0.00027) * 0.01 * sway, -0.2, 1.2);
    cam.position.set(tg[0] + r * Math.sin(th) * Math.cos(ph), tg[1] + r * Math.sin(ph), tg[2] + r * Math.cos(th) * Math.cos(ph)); cam.lookAt(tg[0], tg[1], tg[2]);
  }
  function start3d() {
    const canvas = $('cv'); X = NEV.Fig3D.stage(canvas, { fov: 36, floor: false }); R = X.R; S = X.S; cam = X.cam; cam.userData = {};
    S.children.slice().forEach((o) => { if (o.isLight) S.remove(o); });                       // les lumières sont gérées par les scènes
    const THREE = g.THREE, rig = NEV.StoryRig.create(THREE);
    ctx3 = { THREE, S, R, cam, rig, hud, mouse, view(px, py, pz, tx, ty, tz) { camV = { p: [px, py, pz], t: [tx, ty, tz] }; } };
    scenes = NEV.StoryScenes.create(ctx3); ready3d = true; dpr = RENDER ? 1 : Math.min(g.devicePixelRatio || 1, 1.75); layout();
    root.classList.remove('nogl'); curScene = -1; paint(true);
  }
  function no3d() { root.classList.add('nogl'); $('fallN').textContent = ''; }

  /* ---------- peinture d'une image à l'instant t ---------- */
  function show(i) {
    if (i === cur) return;
    slides.forEach((s, k) => { if (k === i) { s.classList.add('on'); } else s.classList.remove('on'); });
    cur = i; anims = slides[i].getAnimations ? slides[i].getAnimations({ subtree: true }) : [];
    anims.forEach((a) => a.pause()); root.classList.toggle('s-title', i === 0); $('fallN').textContent = i > 0 && i < N ? (i < 10 ? '0' + i : i) : ''; layout();
  }
  function paint(force) {
    const i = idxAt(t); show(i); const lt = t - T[i];
    for (let k = 0; k < anims.length; k++) anims[k].currentTime = lt * 1000;
    fills.forEach((f, k) => { f.style.transform = 'scaleX(' + clamp((t - T[k]) / (T[k + 1] - T[k]), 0, 1).toFixed(4) + ')'; });
    /* rideau : il couvre l'écran pile à l'instant du changement de chapitre */
    let cx = -102; for (let k = 1; k < N; k++) { const d = t - T[k]; if (d > -0.3 && d < 0.5) { cx = d < 0 ? -102 + 102 * E((d + 0.3) / 0.3) : 102 * E(d / 0.5); break; } }
    curtain.style.transform = 'translate3d(' + cx.toFixed(2) + '%,0,0)';
    if (ready3d) render3d(i, lt, force);
  }
  function render3d(i, lt, force) {
    const sc = scenes.sc[i];
    if (curScene !== i) { if (curScene >= 0 && scenes.sc[curScene].ex) scenes.sc[curScene].ex(); curScene = i; scenes.clearFx(); sc.en(); }
    sc.up(Math.min(lt, T[i + 1] - T[i]), T[i + 1] - T[i]);
    if (!RENDER) interactions(scenes.hero);
    applyCam(g.performance.now()); R.render(S, cam);
  }
  /* réactions : le héros suit le curseur ; un toucher le fait sauter et parler */
  const WORDS = ['Hey !', 'Salut !', 'Tu me vois ?', 'Allez, bouge !', 'Un jour à la fois.', 'Tu viens ?'];
  function interactions(P) {
    const now = g.performance.now();
    if (react && P.g.visible) {
      const k = (now - react.t0) / 1400;
      if (k < 1) { const j = Math.abs(Math.sin(k * Math.PI * 3)) * 0.22 * (1 - k); P.hips.position.y += j; P.g.position.y += j * 0.4; P.face({ smile: 1, open: k < 0.6 ? 1 : 0, brow: 0.2 }); hud.set('bub', { t: react.w, x: zoneBubX(), y: 24, r: 0 }); } else react = null;
    }
  }
  const zoneBubX = () => (root.classList.contains('wide') ? 52 : 50);

  /* ---------- horloge, lecture, saut ---------- */
  function tick(now) {
    if (!ready3d && !RENDER) { /* pas de 3D : on garde l'horloge du texte */ }
    if (!playing && !ready3d) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (playing) {
      /* la voix mène l'horloge ; si elle est loin (saut en cours, réseau lent), on garde l'horloge et on la rattrape */
      if (useVoice && !audio.paused && !audio.seeking && audio.readyState > 2) { const d = audio.currentTime - t; if (Math.abs(d) < 0.9) t = audio.currentTime; else { t += dt; if (g.performance.now() - lastFix > 1500) { lastFix = g.performance.now(); try { audio.currentTime = t; } catch (e) { /* ignoré */ } } } } else t += dt;
      if (t >= END) { t = END - 0.001; setPlaying(false); }
    }
    ftime += dt; frames++;
    if (frames === 45) { if (ftime / frames > 0.05 && dpr > 0.8) { dpr = Math.max(0.75, dpr - 0.35); fit3d(); } frames = 0; ftime = 0; }
    inertia(dt); paint();
    if (!doc.hidden) g.requestAnimationFrame(tick);
  }
  function loop() { last = g.performance.now(); g.requestAnimationFrame(tick); }
  function setPlaying(v) {
    playing = v; root.classList.toggle('paused', !v);
    ppi.innerHTML = v ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>' : '<path d="M7 4v16l13-8z"/>'; ppBtn.setAttribute('aria-label', v ? 'Pause' : 'Lecture');
    if (useVoice) { if (v) { audio.currentTime = t; audio.play().catch(() => {}); } else audio.pause(); }
    if (v) last = g.performance.now();
  }
  function seek(x, keep) {
    t = clamp(x, 0, END - 0.01); if (useVoice) { try { audio.currentTime = t; } catch (e) { /* ignoré */ } }
    cur = -1; paint(true); if (!keep && !playing && !reduce) setPlaying(true);
  }
  function go(d) {
    const i = idxAt(t);
    if (d < 0 && t - T[i] > 2.5) return seek(reduce ? T[i] + (T[i + 1] - T[i]) * 0.6 : T[i] + 0.01, reduce);
    const n = clamp(i + d, 0, N - 1); seek(reduce ? T[n] + (T[n + 1] - T[n]) * 0.6 : T[n] + 0.01, reduce);
  }
  $('prev').addEventListener('click', () => go(-1)); $('next').addEventListener('click', () => go(1));
  ppBtn.addEventListener('click', () => { if (t >= END - 0.02) seek(0); else setPlaying(!playing); });
  function setVoice(v) { useVoice = v; sndBtn.setAttribute('aria-pressed', v); if (v) { audio.currentTime = t; if (playing) audio.play().catch(() => {}); } else audio.pause(); }
  if (DATA.voice) { audio.src = DATA.voice; sndBtn.addEventListener('click', () => setVoice(!useVoice)); } else sndBtn.hidden = true;
  startBtn.addEventListener('click', () => {
    startBtn.classList.add('hide'); if (DATA.voice) setVoice(true); seek(0, true); setPlaying(true); loop();
    root.focus({ preventScroll: true }); hint.classList.add('show'); g.setTimeout(() => hint.classList.remove('show'), 7000);
  });
  $('full').addEventListener('click', () => { try { if (doc.fullscreenElement) doc.exitFullscreen(); else (root.requestFullscreen || root.webkitRequestFullscreen).call(root); } catch (e) { /* ignoré */ } });
  if (!(root.requestFullscreen || root.webkitRequestFullscreen)) $('full').hidden = true;
  root.tabIndex = 0;
  root.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === ' ') { e.preventDefault(); ppBtn.click(); } else if (e.key === 'm' || e.key === 'M') sndBtn.click(); else if (e.key === 'f' || e.key === 'F') $('full').click(); });
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) { if (playing) setPlaying(false); } else if (ready3d || playing) loop(); });

  /* ---------- bouger : souris, doigt, gyroscope ---------- */
  const drag = { on: false, x: 0, y: 0, x0: 0, y0: 0, t0: 0, moved: 0 };
  const isUi = (e) => !!(e.target.closest && e.target.closest('button,a,.bars'));
  function norm(e) { const r = root.getBoundingClientRect(); mouse.x = clamp((e.clientX - r.left - zone.cx) / (zone.w / 2), -1, 1); mouse.y = clamp((e.clientY - r.top - zone.cy) / (zone.h / 2), -1, 1); }
  root.addEventListener('pointermove', (e) => {
    if (reduce) return; norm(e);
    if (drag.on) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy); orb.yaw = clamp(orb.yaw + dx * 0.0065, -1.5, 1.5); orb.pitch = clamp(orb.pitch + dy * 0.004, -0.3, 0.4); orb.vy = dx * 0.0065 * 60; orb.vp = dy * 0.004 * 60; orb.idle = 0; }
    else if (e.pointerType === 'mouse') { orb.tx = mouse.x * 0.2; orb.ty = -mouse.y * 0.05; }
  });
  root.addEventListener('pointerdown', (e) => {
    if (isUi(e) || reduce) return; drag.on = true; drag.x = drag.x0 = e.clientX; drag.y = drag.y0 = e.clientY; drag.t0 = g.performance.now(); drag.moved = 0; root.classList.add('drag'); norm(e);
    try { root.setPointerCapture(e.pointerId); } catch (er) { /* ignoré */ }
  });
  const up = (e) => {
    if (!drag.on) return; drag.on = false; root.classList.remove('drag'); orb.idle = 0;
    if (drag.moved < 8 && g.performance.now() - drag.t0 < 450 && ready3d) tapHero(e);
  };
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
  root.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !drag.on) { orb.tx = 0; orb.ty = 0; mouse.x = mouse.y = 0; } });
  function inertia(dt) {
    if (reduce) return;
    orb.idle += dt;
    if (!drag.on) {
      orb.yaw += orb.vy * dt; orb.pitch += orb.vp * dt; orb.vy *= Math.pow(0.04, dt); orb.vp *= Math.pow(0.04, dt);
      if (orb.idle > 1.2) { const k = 1 - Math.pow(0.35, dt); orb.yaw += (orb.tx - orb.yaw) * k; orb.pitch += (orb.ty - orb.pitch) * k; }
      else if (orb.idle > 0.4 && Math.abs(orb.vy) < 0.05) { orb.vy = orb.vp = 0; }
    }
    orb.yaw = clamp(orb.yaw, -1.5, 1.5);
  }
  const ray = { r: null, v: null };
  function tapHero(e) {
    const P = scenes.hero; if (!P.g.visible) return;
    const THREE = g.THREE, r = root.getBoundingClientRect(); ray.r = ray.r || new THREE.Raycaster(); ray.v = ray.v || new THREE.Vector2();
    ray.v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.r.setFromCamera(ray.v, cam);
    const hit = ray.r.intersectObject(P.g, true); if (hit.length) react = { t0: g.performance.now(), w: WORDS[Math.floor(Math.random() * WORDS.length)] };
  }
  function onTilt(e) {
    if (e.gamma == null) return; if (tilt.b0 == null) tilt.b0 = e.beta == null ? 60 : e.beta;
    tilt.x = clamp(e.gamma / 28, -1, 1); tilt.y = clamp(((e.beta == null ? 60 : e.beta) - tilt.b0) / 28, -1, 1); tilt.on = true;
  }
  const coarse = g.matchMedia && g.matchMedia('(pointer: coarse)').matches, DOE = g.DeviceOrientationEvent;
  if (coarse && DOE && !reduce && !RENDER) {
    tiltBtn.hidden = false;
    tiltBtn.addEventListener('click', () => {
      const on = tiltBtn.getAttribute('aria-pressed') !== 'true';
      const enable = () => { g.addEventListener('deviceorientation', onTilt); tiltBtn.setAttribute('aria-pressed', 'true'); };
      if (!on) { g.removeEventListener('deviceorientation', onTilt); tilt.x = tilt.y = 0; tilt.b0 = null; tiltBtn.setAttribute('aria-pressed', 'false'); return; }
      if (typeof DOE.requestPermission === 'function') DOE.requestPermission().then((s) => { if (s === 'granted') enable(); }).catch(() => {}); else enable();
    });
  }

  /* ---------- démarrage ---------- */
  if (g.ResizeObserver) new g.ResizeObserver(() => layout()).observe(root); else g.addEventListener('resize', layout);
  g.addEventListener('pagehide', () => { try { audio.pause(); if (X) X.dispose(); } catch (e) { /* ignoré */ } });
  const fonts = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
  const webgl = NEV.Fig3D && NEV.Fig3D.webgl();
  const ready = (webgl ? NEV.Fig3D.load().then(() => { start3d(); }).catch((e) => { if (g.console) g.console.error('histoire-anime:', e && e.stack || e); no3d(); }) : Promise.resolve().then(no3d)).then(() => fonts);
  layout(); paint(true);
  g.NEVSTORY = { duration: END, T, ready, seek(x) { t = clamp(x, 0, END - 0.001); paint(true); return true; }, get webgl() { return ready3d; }, get dbg() { return { scenes, cam, S, R }; } };
  ready.then(() => {
    if (FIX != null) { startBtn.classList.add('hide'); t = clamp(parseFloat(FIX) || 0, 0, END); cur = -1; paint(true); return; }
    if (RENDER) { startBtn.classList.add('hide'); cur = -1; paint(true); return; }
    paint(true); if (ready3d) loop();       // animation d'attente derrière le bouton « Lancer l'histoire »
  });
  if (reduce) { /* sans animation automatique : le bouton lance la lecture de la voix seulement si on appuie sur ▶ */ }
})(window);
