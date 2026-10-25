/* ==========================================================
   neV.BOOSTER — vision.js
   Compte tes répétitions avec la caméra (MediaPipe Pose, modèle « lite »,
   chargé depuis vendor/mediapipe : tout reste dans ton navigateur, la vidéo
   n'est jamais envoyée nulle part).

   Deux couches :
   1. NEV.VisionCore  : logique pure (angles, signaux, compteur à hystérésis).
                        Testée sans caméra sur les 72 exercices.
   2. NEV.Vision      : caméra, MediaPipe, dessin du squelette, simulateur.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const me = g.document && g.document.currentScript;
  const ROOT = (function () { try { return new URL('..', me.src).href; } catch (e) { return ''; } })();

  const DEG = 180 / Math.PI, MINV = 0.4;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: Math.min(a.v, b.v) });
  function angle(a, b, c) { // angle en b, en degrés
    const x1 = a.x - b.x, y1 = a.y - b.y, x2 = c.x - b.x, y2 = c.y - b.y;
    const d = (x1 * x2 + y1 * y2) / ((Math.hypot(x1, y1) * Math.hypot(x2, y2)) || 1e-6);
    return Math.acos(Math.max(-1, Math.min(1, d))) * DEG;
  }
  const NOSE = 0, LSH = 11, RSH = 12, LEL = 13, REL = 14, LWR = 15, RWR = 16, LHP = 23, RHP = 24, LKN = 25, RKN = 26, LAN = 27, RAN = 28;
  const ok = (lm, ids) => ids.every((i) => lm[i] && lm[i].v >= MINV);
  const KEY = [LSH, RSH, LEL, REL, LWR, RWR, LHP, RHP, LKN, RKN, LAN, RAN];

  /* ---------- signaux : une valeur qui oscille quand tu fais l'exercice ---------- */
  function side(st, lm, L, R) {
    const vs = (ch) => ch.reduce((s, i) => s + (lm[i] ? lm[i].v : 0), 0) / ch.length;
    const a = vs(L), b = vs(R);
    let s = st.side || (a >= b ? 'L' : 'R');
    if (s === 'L' && b > a + 0.15) s = 'R'; else if (s === 'R' && a > b + 0.15) s = 'L';
    st.side = s;
    const ch = s === 'L' ? L : R;
    return ok(lm, ch) ? ch : null;
  }
  function torsoLen(lm) {
    if (!ok(lm, [LSH, RSH, LHP, RHP])) {
      const a = ok(lm, [LSH, LHP]) ? dist(lm[LSH], lm[LHP]) : ok(lm, [RSH, RHP]) ? dist(lm[RSH], lm[RHP]) : 0;
      return a;
    }
    return dist(mid(lm[LSH], lm[RSH]), mid(lm[LHP], lm[RHP]));
  }
  const hipMid = (lm) => (ok(lm, [LHP, RHP]) ? mid(lm[LHP], lm[RHP]) : ok(lm, [LHP]) ? lm[LHP] : ok(lm, [RHP]) ? lm[RHP] : null);
  const shMid = (lm) => (ok(lm, [LSH, RSH]) ? mid(lm[LSH], lm[RSH]) : ok(lm, [LSH]) ? lm[LSH] : ok(lm, [RSH]) ? lm[RSH] : null);

  const SIG = {
    elbow(lm, st) { const c = side(st, lm, [LSH, LEL, LWR], [RSH, REL, RWR]); return c ? angle(lm[c[0]], lm[c[1]], lm[c[2]]) : null; },
    knee(lm, st, spec) {
      if (spec.view === 'front') {
        const v = [];
        if (ok(lm, [LHP, LKN, LAN])) v.push(angle(lm[LHP], lm[LKN], lm[LAN]));
        if (ok(lm, [RHP, RKN, RAN])) v.push(angle(lm[RHP], lm[RKN], lm[RAN]));
        return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
      }
      const c = side(st, lm, [LHP, LKN, LAN], [RHP, RKN, RAN]); return c ? angle(lm[c[0]], lm[c[1]], lm[c[2]]) : null;
    },
    kneeMin(lm) {
      const v = [];
      if (ok(lm, [LHP, LKN, LAN])) v.push(angle(lm[LHP], lm[LKN], lm[LAN]));
      if (ok(lm, [RHP, RKN, RAN])) v.push(angle(lm[RHP], lm[RKN], lm[RAN]));
      return v.length ? Math.min.apply(null, v) : null;
    },
    hip(lm, st) { const c = side(st, lm, [LSH, LHP, LKN], [RSH, RHP, RKN]); return c ? angle(lm[c[0]], lm[c[1]], lm[c[2]]) : null; },
    tilt(lm) { // 0° = debout, 90° = à l'horizontale
      const s = shMid(lm), h = hipMid(lm); if (!s || !h) return null;
      return Math.atan2(Math.abs(s.x - h.x), h.y - s.y) * DEG;
    },
    shy(lm) { const s = shMid(lm), t = torsoLen(lm); return s && t ? -s.y / t : null; },
    limbs(lm) {
      const h = hipMid(lm), t = torsoLen(lm); if (!h || !t) return null;
      const v = [LWR, RWR, LAN, RAN].filter((i) => lm[i] && lm[i].v >= MINV).map((i) => (h.y - lm[i].y) / t);
      return v.length >= 2 ? v.reduce((a, b) => a + b, 0) / v.length : null;
    },
    kneelift(lm, st) {
      if (!ok(lm, [LKN, RKN])) return null;
      const t = torsoLen(lm) || 1, dy = (lm[LKN].y - lm[RKN].y) / t, dx = (lm[LKN].x - lm[RKN].x) / t;
      st.ey = (st.ey || 0) * 0.9 + Math.abs(dy) * 0.1; st.ex = (st.ex || 0) * 0.9 + Math.abs(dx) * 0.1;
      return st.ey >= st.ex ? dy : dx;
    },
    wristup(lm) {
      const t = torsoLen(lm), s = shMid(lm); if (!t || !s) return null;
      const v = [LWR, RWR].filter((i) => lm[i] && lm[i].v >= MINV).map((i) => (s.y - lm[i].y) / t);
      return v.length === 2 ? (v[0] + v[1]) / 2 : null;
    },
    twist(lm) {
      const t = torsoLen(lm), h = hipMid(lm); if (!t || !h || !ok(lm, [LWR, RWR])) return null;
      return ((lm[LWR].x + lm[RWR].x) / 2 - h.x) / t;
    },
    hipx(lm) { const h = hipMid(lm), t = torsoLen(lm); return h && t ? h.x / t : null; }
  };

  function present(lm) { return KEY.filter((i) => lm[i] && lm[i].v >= 0.5).length >= 6; }
  function energy(lm, prev, t) { // déplacement moyen des articulations, en longueurs de buste par image
    if (!prev || !t) return 0;
    let s = 0, n = 0;
    KEY.forEach((i) => { if (lm[i] && prev[i] && lm[i].v >= MINV && prev[i].v >= MINV) { s += dist(lm[i], prev[i]); n++; } });
    return n ? s / n / t : 0;
  }

  /* ---------- compteur à hystérésis (régulier, sans réglage manuel) ---------- */
  function counter(ex, plan) {
    const spec = ex.cam || {}, unit = ex.unit || 'rep';
    const sides = unit === 'side' || unit === 'secside' ? 2 : 1;
    const kind = spec.mode || 'rep';
    const timed = kind === 'hold' || kind === 'move' || kind === 'presence';
    const target = plan.perSet * sides;
    const A = spec.amp || 0;
    const sig = SIG[spec.sig];
    const st = {};
    let hist = [], filt = [], state = null, trans = 0, reps = 0, secs = 0, lastT = 0, lastTrans = 0, prevLm = null, invalidSince = 0, lastValue = null, inPos = false, moving = false, lastMove = 0;
    let rangeHint = false;

    function reset() { hist = []; filt = []; state = null; trans = 0; reps = 0; secs = 0; lastT = 0; lastTrans = 0; prevLm = null; invalidSince = 0; inPos = false; rangeHint = false; Object.keys(st).forEach((k) => delete st[k]); }

    function update(lm, t) {
      const out = { rep: false, valid: false, value: null, count: kind === 'manual' ? reps : timed ? secs : reps, inPos: false, hint: '', target: target, timed: timed };
      const dt = lastT ? Math.min(0.25, (t - lastT) / 1000) : 0; lastT = t;
      if (!lm) { if (!invalidSince) invalidSince = t; out.hint = t - invalidSince > 1500 ? 'Je ne te vois pas : place-toi dans le cadre.' : ''; return out; }
      const here = present(lm);
      if (kind === 'presence' || kind === 'move') {
        if (!here) { if (!invalidSince) invalidSince = t; out.hint = t - invalidSince > 1500 ? 'Je ne te vois pas : recule un peu pour être entièrement dans le cadre.' : ''; prevLm = lm; return out; }
        invalidSince = 0; out.valid = true;
        if (kind === 'presence') { secs += dt; inPos = true; } else {
          const e = energy(lm, prevLm, torsoLen(lm) || 1) / (dt || 0.033) * 0.033 * 30; // approx. « par seconde »
          if (e > 0.18) lastMove = t; moving = t - lastMove < 1500; inPos = moving;
          if (moving) secs += dt; else out.hint = 'Bouge : le chrono est en pause.';
        }
        prevLm = lm; out.count = secs; out.inPos = inPos; return out;
      }
      if (kind === 'manual') { out.valid = here; out.count = reps; return out; }
      const raw = sig ? sig(lm, st, spec) : null;
      if (raw == null || !isFinite(raw)) {
        if (!invalidSince) invalidSince = t;
        out.hint = t - invalidSince > 1500 ? 'Je ne vois pas tout ton corps : ' + (spec.view === 'side' ? 'mets-toi de profil, en entier.' : 'recule pour que tout ton corps soit visible.') : '';
        return out;
      }
      invalidSince = 0; out.valid = true;
      // filtre : médiane de 3 puis lissage
      filt.push(raw); if (filt.length > 3) filt.shift();
      const med = filt.length < 3 ? raw : filt.slice().sort((a, b) => a - b)[1];
      const v = lastValue == null ? med : lastValue * 0.45 + med * 0.55; lastValue = v; out.value = v;

      if (kind === 'hold') {
        inPos = v >= spec.lo && v <= spec.hi; out.inPos = inPos;
        if (inPos) secs += dt; else out.hint = 'Prends la position pour relancer le chrono.';
        out.count = secs; return out;
      }

      // enveloppe glissante (6 s) : amplitude réelle du mouvement
      hist.push([t, v]); while (hist.length && t - hist[0][0] > 6000) hist.shift();
      let hi = -Infinity, lo = Infinity; for (const h of hist) { if (h[1] > hi) hi = h[1]; if (h[1] < lo) lo = h[1]; }
      const range = hi - lo, need = kind === 'alt' ? A * 2 : A;
      if (range < need) { state = null; trans = 0; out.count = reps; rangeHint = range > need * 0.45 && hist.length > 12; out.hint = rangeHint ? 'Va plus loin : l\'amplitude doit être complète.' : ''; return out; }
      const m = (hi + lo) / 2, h = Math.max(need * 0.22, range * 0.2);
      let ns = state;
      if (v >= m + h) ns = 'U'; else if (v <= m - h) ns = 'L';
      if (ns !== state) {
        if (state === null) { state = ns; trans = 0; }
        else if (t - lastTrans > 140) {
          state = ns; lastTrans = t; trans++;
          if (kind === 'alt') { reps++; out.rep = true; } else if (trans % 2 === 0) { reps++; out.rep = true; }
        }
      }
      out.count = reps; out.state = state;
      return out;
    }
    return { update, reset, target, sides, timed, kind, spec, get reps() { return reps; }, get secs() { return secs; }, add(n) { reps += n || 1; }, setCount(n) { reps = n; secs = n; } };
  }

  /* ---------- landmarks synthétiques depuis l'animation (tests et mode simulation) ---------- */
  const SIM_W = 400, SIM_H = 286, SIM_AR = SIM_W / SIM_H;
  function simLandmarks(ex, t) {
    const F = NEV.Figure, a = ex.anim, pose = F.poseAt(ex, t);
    const j = (a.view === 'front' ? F.resolveFront : F.resolveSide)(pose);
    const lm = []; for (let i = 0; i < 33; i++) lm.push({ x: 0.5, y: 0.5, v: 0 });
    const set = (i, p, v) => { lm[i] = { x: p[0] / SIM_W, y: p[1] / SIM_H, v: v == null ? 1 : v }; };
    set(NOSE, j.head);
    if (a.view === 'front') {
      set(LSH, j.shPts[0]); set(RSH, j.shPts[1]); set(LHP, j.hipPts[0]); set(RHP, j.hipPts[1]);
    } else {
      const sh = j.sh; set(LSH, sh); set(RSH, sh, 0.7); set(LHP, j.hip); set(RHP, j.hip, 0.7);
    }
    set(LEL, j.arms[0].mid); set(LWR, j.arms[0].end); set(REL, j.arms[1].mid, a.view === 'side' ? 0.75 : 1); set(RWR, j.arms[1].end, a.view === 'side' ? 0.75 : 1);
    set(LKN, j.legs[0].mid); set(LAN, j.legs[0].end); set(RKN, j.legs[1].mid, a.view === 'side' ? 0.75 : 1); set(RAN, j.legs[1].end, a.view === 'side' ? 0.75 : 1);
    return lm;
  }

  NEV.VisionCore = { angle, counter, SIG, simLandmarks, SIM_AR, KEY, present };

  /* ====================================================================
     Caméra + MediaPipe
     ==================================================================== */
  const CONN = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32]];
  let pose = null, stream = null, running = false, busy = false, raf = 0, simTimer = 0;

  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (g.Pose) return res();
      const s = g.document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('noload')); };
      g.document.head.appendChild(s);
    });
  }

  function draw(canvas, lm, good) {
    const c = canvas.getContext('2d'); c.clearRect(0, 0, canvas.width, canvas.height);
    if (!lm) return;
    const W = canvas.width, H = canvas.height;
    c.lineWidth = Math.max(3, W / 160); c.lineCap = 'round';
    c.strokeStyle = good ? '#3ddc84' : '#ff6a7f'; c.fillStyle = good ? '#b8ffd6' : '#fff';
    CONN.forEach(function (p) { const a = lm[p[0]], b = lm[p[1]]; if (a && b && a.visibility > 0.4 && b.visibility > 0.4) { c.beginPath(); c.moveTo(a.x * W, a.y * H); c.lineTo(b.x * W, b.y * H); c.stroke(); } });
    KEY.concat([0]).forEach(function (i) { const a = lm[i]; if (a && a.visibility > 0.4) { c.beginPath(); c.arc(a.x * W, a.y * H, Math.max(4, W / 120), 0, 6.3); c.fill(); } });
  }

  /* Démarre la caméra. h = { video, canvas, onPose(lm17, ts), onStatus(msg), onError(code) } */
  async function start(h) {
    stop();
    if (!g.isSecureContext && g.location.hostname !== 'localhost') { h.onError('insecure'); return false; }
    if (!(g.navigator.mediaDevices && g.navigator.mediaDevices.getUserMedia)) { h.onError('nocam'); return false; }
    try {
      h.onStatus('Autorisation de la caméra…');
      stream = await g.navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    } catch (e) { h.onError(e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'denied' : 'nocam'); return false; }
    h.video.srcObject = stream; h.video.muted = true; h.video.playsInline = true;
    try { await h.video.play(); } catch (e) { /* lecture auto bloquée : l'utilisateur a déjà cliqué */ }
    try {
      h.onStatus('Chargement du détecteur de pose (3 Mo)…');
      await loadScript(ROOT + 'vendor/mediapipe/pose.js');
      pose = new g.Pose({ locateFile: function (f) { return ROOT + 'vendor/mediapipe/' + f; } });
      pose.setOptions({ modelComplexity: 0, smoothLandmarks: true, enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      pose.onResults(function (r) {
        const lm = r.poseLandmarks || null;
        h.canvas.width = h.video.videoWidth || 640; h.canvas.height = h.video.videoHeight || 480;
        const ar = h.canvas.width / h.canvas.height;
        const out = lm ? lm.map(function (p) { return { x: p.x * ar, y: p.y, v: p.visibility == null ? 1 : p.visibility }; }) : null;
        const good = h.onPose(out, performance.now());
        draw(h.canvas, lm, good);
      });
      await pose.initialize();
    } catch (e) { stop(); h.onError('noload'); return false; }
    running = true;
    (async function loop() {
      if (!running) return;
      if (h.video.readyState >= 2 && !busy) { busy = true; try { await pose.send({ image: h.video }); } catch (e) { /* image perdue */ } busy = false; }
      raf = g.requestAnimationFrame(loop);
    })();
    return true;
  }

  /* Simulation : l'avatar fait l'exercice (tests, démonstration). Jamais « vérifié ». */
  function startSim(ex, h, speed) {
    stop(); running = true; const t0 = performance.now();
    simTimer = setInterval(function () {
      const t = ((performance.now() - t0) / 1000) * (speed || 1);
      const lm = simLandmarks(ex, t);
      const good = h.onPose(lm, performance.now());
      if (h.canvas) {
        const c = h.canvas.getContext('2d'); h.canvas.width = 640; h.canvas.height = 458; c.clearRect(0, 0, 640, 458);
        c.strokeStyle = good ? '#3ddc84' : '#ff6a7f'; c.lineWidth = 4; c.lineCap = 'round';
        CONN.forEach(function (p) { const a = lm[p[0]], b = lm[p[1]]; if (a.v > 0.4 && b.v > 0.4) { c.beginPath(); c.moveTo(a.x * 640, a.y * 458); c.lineTo(b.x * 640, b.y * 458); c.stroke(); } });
      }
    }, 33);
  }

  function stop() {
    running = false; g.cancelAnimationFrame(raf); clearInterval(simTimer);
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (pose) { try { pose.close(); } catch (e) { /* ignoré */ } pose = null; }
  }

  NEV.Vision = { start, startSim, stop, ROOT };
})(typeof window !== 'undefined' ? window : globalThis);
