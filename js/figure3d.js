/* ==========================================================
   neV.BOOSTER — figure3d.js
   Base 3D commune (three.js r128, hébergé dans vendor/three) :
   chargement à la demande, détection WebGL, scène + éclairage, et le constructeur
   de personnage « person() » (corps assemblé de formes simples, muscles réglables).
   Utilisé par la page « histoire » et par le héros 3D de l'accueil / récompenses.
   Si WebGL est absent, rien ne casse : les pages gardent leur version 2D.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const doc = g.document;
  let loading = null;

  function webgl() {
    try { const c = doc.createElement('canvas'); return !!(g.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }
  function load() {
    if (g.THREE) return Promise.resolve(g.THREE);
    if (!webgl()) return Promise.reject(new Error('webgl'));
    if (!loading) loading = new Promise(function (ok, ko) {
      const s = doc.createElement('script'); s.src = 'vendor/three/three.min.js'; s.async = true;
      s.onload = function () { g.THREE ? ok(g.THREE) : ko(new Error('three')); };
      s.onerror = function () { loading = null; ko(new Error('three')); };
      doc.head.appendChild(s);
    });
    return loading;
  }

  /* Scène : rendu, caméra, lumières, sol. opts : {fov, floor, bg, pixelRatio} */
  function stage(canvas, opts) {
    opts = opts || {};
    const T = g.THREE, E = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
    const R = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: !!opts.alpha });
    R.setPixelRatio(Math.min(g.devicePixelRatio || 1, opts.pixelRatio || 2));
    if (opts.alpha) R.setClearColor(0x000000, 0);
    const S = new T.Scene(), cam = new T.PerspectiveCamera(opts.fov || 40, 9 / 16, 0.1, 80);
    function fit() { const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    let ro = null; if (g.ResizeObserver) { ro = new g.ResizeObserver(fit); ro.observe(canvas); } else g.addEventListener('resize', fit);
    fit();
    S.add(new T.AmbientLight(0xffc0d0, 0.7));
    const dl = new T.DirectionalLight(0xffffff, 1.1); dl.position.set(3, 6, 5); S.add(dl);
    const rim = new T.PointLight(0xff3d6e, 1.6, 14); rim.position.set(-3, 3, -2); S.add(rim);
    const M = (c, e) => new T.MeshStandardMaterial({ color: c, roughness: 0.55, emissive: e || 0 });
    let floor = null;
    if (opts.floor !== false) { floor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshStandardMaterial({ color: 0x22101a, metalness: 0.5, roughness: 0.35 })); floor.rotation.x = -Math.PI / 2; S.add(floor); }

    /* Personnage : torse, tête, bras (épaule + coude), jambes (hanche + genou). setM(0..1) = masse musculaire. */
    function person(skin, sh, dress) {
      const grp = new T.Group(), Sk = M(skin), P = { g: grp, sh: [], el: [], hp: [], kn: [], db: [] };
      const b = P.b = new T.Group(); b.position.y = 1; grp.add(b);
      const cy = (a, c, h, m, p, y) => { const o = new T.Mesh(new T.CylinderGeometry(a, c, h, 14), m); o.position.y = y; p.add(o); return o; };
      const sp = (r, m, p, x, y, z) => { const o = new T.Mesh(new T.SphereGeometry(r, 16, 12), m); o.position.set(x, y, z); p.add(o); return o; };
      P.tm = M(skin); P.torso = cy(0.3, 0.22, 0.8, P.tm, b, 0.45); cy(0.08, 0.09, 0.15, Sk, b, 0.92);
      P.head = sp(0.2, Sk, b, 0, 1.12, 0); [1, -1].forEach((s) => sp(0.03, M(0x111111), P.head, 0.07 * s, 0.03, 0.18));
      sp(0.17, M(0x1a0f0a), P.head, 0, 0.07, -0.05);
      cy(0.25, 0.27, 0.3, M(sh), b, -0.02);
      if (dress) { const d = cy(0.14, 0.4, 0.6, M(dress), b, 0.0); d.position.y = -0.1; P.torso.material = M(dress); }
      [1, -1].forEach((s, i) => {
        const a = new T.Group(); a.position.set(0.38 * s, 0.78, 0); b.add(a); P.sh[i] = a; sp(0.11, Sk, a, 0, 0, 0); cy(0.08, 0.07, 0.42, Sk, a, -0.21);
        const e = new T.Group(); e.position.y = -0.42; a.add(e); P.el[i] = e; sp(0.075, Sk, e, 0, 0, 0); cy(0.07, 0.05, 0.38, Sk, e, -0.19); sp(0.065, Sk, e, 0, -0.4, 0);
        const d = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.3, 8), M(0xff3d6e, 0x661030)); d.rotation.z = Math.PI / 2; d.position.set(0, -0.42, 0); d.visible = false; e.add(d); P.db[i] = d;
        const h = new T.Group(); h.position.set(0.13 * s, -0.02, 0); b.add(h); P.hp[i] = h; cy(0.1, 0.08, 0.5, Sk, h, -0.25);
        const k = new T.Group(); k.position.y = -0.5; h.add(k); P.kn[i] = k; cy(0.075, 0.06, 0.48, Sk, k, -0.24);
        const f = new T.Mesh(new T.BoxGeometry(0.13, 0.07, 0.26), M(0xffffff, 0x553344)); f.position.set(0, -0.5, 0.05); k.add(f);
      });
      P.rose = sp(0.07, M(0xff2040, 0x550010), P.el[1], 0, -0.5, 0.05); P.rose.visible = false;
      P.setM = (m) => { P.torso.scale.set(1 + 0.55 * m, 1, 1 + 0.35 * m); P.sh.forEach((a, i) => { a.position.x = 0.38 * (1 + 0.45 * m) * (i ? -1 : 1); a.scale.set(1 + 0.9 * m, 1, 1 + 0.9 * m); }); P.hp.forEach((h) => h.scale.set(1 + 0.6 * m, 1, 1 + 0.6 * m)); };
      P.shirt = (c) => { P.torso.material = c ? M(c) : P.tm; };
      P.reset = () => { grp.position.set(0, 0, 0); grp.rotation.set(0, 0, 0); b.position.y = 1; b.rotation.set(0, 0, 0); P.head.rotation.set(0, 0, 0);[].concat(P.sh, P.el, P.hp, P.kn).forEach((o) => o.rotation.set(0, 0, 0)); };
      S.add(grp); return P;
    }
    function dispose() {
      if (ro) ro.disconnect(); else g.removeEventListener('resize', fit);
      R.setAnimationLoop && R.setAnimationLoop(null);
      S.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); } });
      R.dispose();
    }
    return { THREE: T, R: R, S: S, cam: cam, M: M, E: E, person: person, fit: fit, floor: floor, rim: rim, key: dl, dispose: dispose };
  }

  NEV.Fig3D = { webgl: webgl, load: load, stage: stage, SKIN: 0xa0603a, SHIRT: 0x8a1538 };
})(window);
