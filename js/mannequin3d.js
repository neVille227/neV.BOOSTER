/* ==========================================================
   neV.BOOSTER — mannequin3d.js
   Cartes « collector » de la version homme : un mannequin 3D fait l'exercice dans la carte.
   - Le mannequin est calculé à partir des MÊMES poses que les illustrations (NEV.Figure) :
     les ~130 exercices du site sont donc tous animés, sans modèle 3D à charger.
   - Compteur de répétitions, jauge d'activation, validation verte, muscles qui passent du rouge au vert.
   - UN SEUL moteur WebGL est partagé par toutes les cartes (limite des navigateurs) ;
     chaque carte reçoit l'image dans un canvas 2D, et seules les cartes visibles sont animées.
   - Sans WebGL : la carte garde l'illustration 2D. Rien ne casse.
   API : NEV.Mannequin.mount(el, ex, opts) → { destroy }   ·   NEV.Mannequin.supported()
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const doc = g.document;
  const PI = Math.PI, S = 0.0083;           // 1 unité du dessin 2D = 0,83 cm : un adulte ≈ 1,75 m
  let T = null, R = null, scene = null, cam = null, rig = null, mats = null, matMesh = null, loading = null, failed = false;
  const entries = new Set();
  let raf = 0, last = 0, io = null;
  const reduced = () => !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- chargement de three.js (r128, vendor/three) ---------- */
  function webgl() {
    if (NEV.lite) return false;   // mode allégé
    try { const c = doc.createElement('canvas'); return !!(g.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }
  function load() {
    if (g.THREE) return Promise.resolve(g.THREE);
    if (NEV.Fig3D && NEV.Fig3D.load) return NEV.Fig3D.load();
    if (!loading) loading = new Promise(function (ok, ko) {
      const s = doc.createElement('script'); s.src = 'vendor/three/three.min.js'; s.async = true;
      s.onload = function () { g.THREE ? ok(g.THREE) : ko(new Error('three')); };
      s.onerror = function () { loading = null; ko(new Error('three')); };
      doc.head.appendChild(s);
    });
    return loading;
  }
  const supported = () => !failed && webgl() && !!(NEV.Figure && NEV.Figure.poseAt);

  /* ---------- profils corporels : mêmes poses, proportions et tenue différentes (maquettes homme / femme) ---------- */
  const PROFILES = {
    m: { sw: 1, delt: [0.1, 0.085, 0.085], ua: [0.062, 0.046], fa: [0.048, 0.03], pec: [0.1, 0.06, 0.1], pecx: 0.095, rib: [0.17, 0.115, 0.17], abs: [0.2, 0.108, 0.135], back: [0.22, 0.09, 0.19], traps: [0.085, 0.07, 0.2], pel: [0.15, 0.115, 0.16], band: [0.026, 0.108, 0.15], head: [0.118, 0.086, 0.082], jaw: [0.068, 0.05, 0.058], neck: [0.058, 0.05], thigh: [0.098, 0.066], calf: [0.064, 0.038], short: [0.118, 0.1], hand: 1, bra: false, hair: false, skin: 0xc3c7d6, mat: 'rgba(255,92,178,.4)', fill: 0xff5cb2, rimc: [0.22, 0.4, 0.9], zl: 0.09 },
    f: { sw: 0.865, delt: [0.092, 0.08, 0.082], ua: [0.047, 0.036], fa: [0.04, 0.025], pec: [0.098, 0.052, 0.098], pecx: 0.082, rib: [0.155, 0.1, 0.15], abs: [0.19, 0.095, 0.115], back: [0.2, 0.08, 0.16], traps: [0.075, 0.055, 0.16], pel: [0.16, 0.12, 0.172], band: [0.026, 0.115, 0.165], head: [0.108, 0.08, 0.074], jaw: [0.062, 0.042, 0.052], neck: [0.054, 0.045], thigh: [0.098, 0.064], calf: [0.058, 0.031], short: [0.113, 0.094], hand: 0.88, bra: true, hair: true, skin: 0xcdcbdb, mat: 'rgba(176,130,255,.45)', fill: 0xa070ff, rimc: [0.5, 0.35, 1.0], zl: 0.095 }
  };
  let PF = PROFILES.m;

  /* ---------- matériaux : peau grise nacrée à reflet bleu (homme) / violet (femme) ---------- */
  const GROUPS = ['chest', 'delts', 'uarm', 'forearms', 'abs', 'back', 'glutes', 'quads', 'calves', 'neck', 'hands'];
  const MUSCLE_GROUP = { chest: ['chest'], shoulders: ['delts'], triceps: ['uarm'], biceps: ['uarm'], forearms: ['forearms'], hands: ['hands'], abs: ['abs'], core: ['abs'], obliques: ['abs'], back: ['back'], lowback: ['back'], lats: ['back'], traps: ['back', 'neck'], glutes: ['glutes'], quads: ['quads'], hamstrings: ['quads'], calves: ['calves'], neck: ['neck'] };
  function col(hex) { return new T.Color(hex).convertSRGBToLinear(); }
  function av3() { try { return (NEV.Avatar && NEV.Avatar.three()) || {}; } catch (e) { return {}; } }
  function skin() {
    const m = new T.MeshPhysicalMaterial({ color: col(av3().skin != null ? av3().skin : PF.skin), roughness: 0.42, metalness: 0.02, clearcoat: 0.45, clearcoatRoughness: 0.34, emissive: new T.Color(0x000000) });
    m.onBeforeCompile = function (sh) {
      sh.fragmentShader = sh.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
        'float nvRim = pow(1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition))), 2.6); outgoingLight += vec3(' + PF.rimc.join(',') + ') * nvRim * .6;\n gl_FragColor = vec4( outgoingLight, diffuseColor.a );');
    };
    return m;
  }
  function makeMats() {
    const M = { skin: skin(), sh: new T.MeshStandardMaterial({ color: col(av3().outfit != null ? av3().outfit : 0x16141d), roughness: 0.8 }), wb: new T.MeshStandardMaterial({ color: col(0x34303f), roughness: 0.55, metalness: 0.1 }), br: new T.MeshStandardMaterial({ color: col(av3().outfit != null ? av3().outfit : 0x17161e), roughness: 0.7 }), hr: new T.MeshStandardMaterial({ color: col(av3().hair != null ? av3().hair : 0x1b1922), roughness: 0.42, metalness: 0.25 }), g: {} };
    GROUPS.forEach(function (k) { M.g[k] = k === 'glutes' ? new T.MeshStandardMaterial({ color: col(0x16141d), roughness: 0.8, emissive: new T.Color(0) }) : skin(); });
    return M;
  }

  /* ---------- pièces : capsules effilées et ellipsoïdes ---------- */
  function capGeo(r1, r2, L, bl, bp) {
    const pts = [], K = 7, N = 14, pw = Math.log(0.5) / Math.log(bp || 0.5);
    for (let k = 0; k <= K; k++) { const ph = -PI / 2 + (k / K) * (PI / 2); pts.push(new T.Vector2(Math.max(1e-4, r1 * Math.cos(ph)), r1 * Math.sin(ph))); }
    for (let i = 1; i < N; i++) { const t = i / N, r = (r1 + (r2 - r1) * t) * (1 + (bl || 0) * Math.sin(PI * Math.pow(t, pw))); pts.push(new T.Vector2(r, t * L)); }
    for (let k = 0; k <= K; k++) { const ph = (k / K) * (PI / 2); pts.push(new T.Vector2(Math.max(1e-4, r2 * Math.cos(ph)), L + r2 * Math.sin(ph))); }
    return new T.LatheGeometry(pts, 22);
  }
  let UNIT = null;
  const V = (x, y, z) => new T.Vector3(x, y, z);

  /* Liste fixe des pièces (ordre constant) : chaque pièce a un matériau, une forme et un groupe musculaire. */
  const LEN = { thigh: 52 * S, shin: 50 * S, ua: 36 * S, fa: 34 * S, neck: 22 * S };
  const PARTS = [
    // [nom, forme, matériau, [r1,r2,bulge] pour capsule]
    ['pelvis', 'e', 'glutes'], ['band', 'e', 'wb'], ['abs', 'e', 'abs'], ['pecL', 'e', 'chest'], ['pecR', 'e', 'chest'], ['back', 'e', 'back'], ['traps', 'e', 'back'], ['rib', 'e', 'skin'],
    ['neck', 'c', 'neck', null, LEN.neck], ['head', 'e', 'skin'], ['jaw', 'e', 'skin'],
    ['braL', 'e', 'br'], ['braR', 'e', 'br'], ['braBand', 'e', 'br'], ['hairCap', 'e', 'hr'], ['pony0', 'e', 'hr'], ['pony1', 'c', 'hr', [0.04, 0.033, 0.1], 0.1], ['pony2', 'c', 'hr', [0.033, 0.026, 0.1], 0.1], ['pony3', 'c', 'hr', [0.026, 0.019, 0.1], 0.1]
  ];
  const SIDE = [
    ['delt', 'e', 'delts'], ['uarm', 'c', 'uarm', null, LEN.ua], ['elbow', 'e', 'skin'], ['farm', 'c', 'forearms', null, LEN.fa], ['hand', 'e', 'hands'],
    ['shortsT', 'c', 'sh', null, LEN.thigh * 0.55], ['thigh', 'c', 'quads', null, LEN.thigh], ['knee', 'e', 'skin'], ['shin', 'c', 'calves', null, LEN.shin], ['ankle', 'e', 'skin'], ['foot', 'e', 'skin']
  ];
  function matOf(k) { return k === 'skin' || k === 'sh' || k === 'wb' || k === 'br' || k === 'hr' ? mats[k] : mats.g[k]; }

  function capFor(n) {
    return { neck: [PF.neck[0], PF.neck[1], 0.05], uarm: [PF.ua[0], PF.ua[1], 0.2], farm: [PF.fa[0], PF.fa[1], 0.22], shortsT: [PF.short[0], PF.short[1], 0], thigh: [PF.thigh[0], PF.thigh[1], 0.15], shin: [PF.calf[0], PF.calf[1], 0.27] }[n];
  }
  function buildRig() {
    UNIT = new T.SphereGeometry(1, 20, 14);
    const root = new T.Group(), list = [];
    function add(name, kind, mk, cap, L, side) {
      let geo, mesh;
      if (kind === 'c') { cap = cap || capFor(name); geo = capGeo(cap[0], cap[1], L, cap[2], 0.45); mesh = new T.Mesh(geo, matOf(mk)); mesh.userData.L0 = L; }
      else mesh = new T.Mesh(UNIT, matOf(mk));
      mesh.userData.kind = kind; mesh.userData.name = name; mesh.userData.side = side; mesh.userData.grp = mk;
      root.add(mesh); list.push(mesh);
    }
    PARTS.forEach(function (p) { add(p[0], p[1], p[2], p[3], p[4], -1); });
    [0, 1].forEach(function (s) { SIDE.forEach(function (p) { add(p[0], p[1], p[2], p[3], p[4], s); }); });
    const by = {}; list.forEach(function (m) { by[m.userData.name + (m.userData.side >= 0 ? m.userData.side : '')] = m; });
    return { root: root, list: list, by: by };
  }

  function placeE(mesh, c, u, v, r) {
    const un = u.clone().normalize(), w = new T.Vector3().crossVectors(un, v).normalize(), vn = new T.Vector3().crossVectors(w, un).normalize();
    const m = new T.Matrix4().makeBasis(un, vn, w);
    mesh.position.copy(c); mesh.quaternion.setFromRotationMatrix(m); mesh.scale.set(r[0], r[1], r[2]); mesh.visible = true;
  }
  function placeC(mesh, a, b) {
    const d = new T.Vector3().subVectors(b, a), L = d.length();
    if (L < 1e-5) { mesh.visible = false; return; }
    mesh.visible = true; mesh.position.copy(a);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.multiplyScalar(1 / L));
    mesh.scale.set(1, L / mesh.userData.L0, 1);
  }

  /* ---------- pose 2D (NEV.Figure) → articulations 3D ---------- */
  function joints(ex, t) {
    const F = NEV.Figure, pose = F.poseAt(ex, t), front = ex.anim.view === 'front';
    const j = (front ? F.resolveFront : F.resolveSide)(pose);
    const P = (p, z) => V((p[0] - 200) * S, (F.FLOOR - p[1]) * S, z || 0);
    const o = { front: front, face: j.face || 1 };
    o.hip = P(j.hip); o.neck = P(j.neck); o.head = P(j.head);
    const tdir = V(j.tdir[0], -j.tdir[1], 0).normalize(); o.u = tdir;
    if (front) { o.lat = V(j.perp[0], -j.perp[1], 0).normalize(); o.dep = V(0, 0, 1); o.hipP = [P(j.hipPts[0]), P(j.hipPts[1])]; o.shP = [P(j.shPts[0]), P(j.shPts[1])]; if (PF.sw !== 1) { const mid = o.shP[0].clone().add(o.shP[1]).multiplyScalar(0.5); o.shP = o.shP.map((q) => mid.clone().add(q.clone().sub(mid).multiplyScalar(PF.sw))); } }
    else {
      o.lat = V(0, 0, 1);
      const fr = [-j.tdir[1] * j.face, j.tdir[0] * j.face];        // devant du buste (2D) : rotation de 90° × face
      o.dep = V(fr[0], -fr[1], 0).normalize();
      const zs = [0.2 * PF.sw, -0.2 * PF.sw], zh = [PF.zl, -PF.zl];
      o.hipP = [P(j.hip, zh[0]), P(j.hip, zh[1])]; o.shP = [P(j.sh, zs[0]), P(j.sh, zs[1])];
    }
    const zl = front ? [0, 0] : [PF.zl, -PF.zl], za = front ? [0, 0] : [0.2 * PF.sw, -0.2 * PF.sw];
    o.legs = [0, 1].map((i) => ({ knee: P(j.legs[i].mid, zl[i]), ank: P(j.legs[i].end, zl[i]) }));
    o.arms = [0, 1].map((i) => ({ el: P(j.arms[i].mid, za[i]), wr: P(j.arms[i].end, za[i]), tip: j.arms[i].tip ? P(j.arms[i].tip, za[i]) : null }));
    o.hdir = V(j.head[0] - j.neck[0], -(j.head[1] - j.neck[1]), 0).normalize();
    return o;
  }

  function pose3d(ex, t, act) {
    const o = joints(ex, t), B = rig.by, K = PF.sw;
    const hip = o.hip, u = o.u, lat = o.lat, dep = o.dep, up = V(0, 1, 0);
    const at = (a, k) => a.clone().addScaledVector(u, k * 72 * S);
    // bassin, ceinture, abdomen, cage thoracique
    placeE(B.pelvis, at(hip, 0.04), u, dep, PF.pel);
    placeE(B.band, at(hip, 0.12), u, dep, PF.band);
    placeE(B.abs, at(hip, 0.36), u, dep, PF.abs);
    placeE(B.rib, at(hip, 0.62), u, dep, PF.rib);
    const sgn = [-1, 1];
    [B.pecL, B.pecR].forEach(function (m, i) {
      const c = at(hip, 0.78).addScaledVector(lat, sgn[i] * PF.pecx).addScaledVector(dep, 0.07);
      placeE(m, c, u, dep, PF.pec);
      const br = i ? B.braR : B.braL; br.visible = PF.bra; if (PF.bra) placeE(br, c.clone().addScaledVector(dep, 0.012), u, dep, [PF.pec[0] * 0.84, PF.pec[1] * 0.9, PF.pec[2] * 0.88]);
    });
    placeE(B.back, at(hip, 0.6).addScaledVector(dep, -0.05), u, dep, PF.back);
    placeE(B.traps, at(hip, 0.97).addScaledVector(dep, -0.02), u, dep, PF.traps);
    B.braBand.visible = PF.bra; if (PF.bra) placeE(B.braBand, at(hip, 0.7), u, dep, [0.03, PF.rib[1] + 0.006, PF.rib[2] + 0.008]);
    // cou, tête
    placeC(B.neck, o.neck.clone().addScaledVector(u, -0.08), o.head.clone().addScaledVector(o.hdir, -0.03));
    const hc = o.head.clone().addScaledVector(o.hdir, 0.055);
    placeE(B.head, hc, o.hdir, dep, PF.head);
    placeE(B.jaw, o.head.clone().addScaledVector(o.hdir, -0.002).addScaledVector(dep, 0.025), o.hdir, dep, PF.jaw);
    ['hairCap', 'pony0', 'pony1', 'pony2', 'pony3'].forEach(function (n) { B[n].visible = PF.hair; });
    if (PF.hair) {
      placeE(B.hairCap, hc.clone().addScaledVector(dep, -0.018).addScaledVector(o.hdir, 0.012), o.hdir, dep, [PF.head[0] + 0.003, PF.head[1] - 0.002, PF.head[2] + 0.004]);
      const back = dep.clone().multiplyScalar(-1);
      const q = [hc.clone().addScaledVector(back, 0.1).addScaledVector(o.hdir, -0.01), 0, 0, 0];
      q[1] = q[0].clone().addScaledVector(back, 0.06).addScaledVector(o.hdir, -0.07); q[2] = q[1].clone().addScaledVector(back, 0.03).addScaledVector(o.hdir, -0.1); q[3] = q[2].clone().addScaledVector(back, 0.0).addScaledVector(o.hdir, -0.1);
      placeE(B.pony0, q[0], o.hdir, dep, [0.04, 0.04, 0.04]);
      for (let i = 0; i < 3; i++) placeC(B['pony' + (i + 1)], q[i], q[i + 1]);
    }
    // bras et jambes
    [0, 1].forEach(function (s) {
      const sh = o.shP[s], a = o.arms[s], hp = o.hipP[s], l = o.legs[s];
      placeE(B['delt' + s], sh.clone().addScaledVector(u, -0.02), a.el.clone().sub(sh), dep, PF.delt);
      placeC(B['uarm' + s], sh.clone().lerp(a.el, 0.12), a.el);
      placeE(B['elbow' + s], a.el, a.el.clone().sub(sh), dep, [PF.ua[1], PF.ua[1], PF.ua[1]]);
      placeC(B['farm' + s], a.el, a.wr);
      const hd = (a.tip || a.wr.clone().addScaledVector(a.wr.clone().sub(a.el).normalize(), 0.09));
      placeE(B['hand' + s], a.wr.clone().lerp(hd, 0.55), hd.clone().sub(a.wr).add(V(1e-4, 0, 0)), dep, [0.075 * PF.hand, 0.03 * PF.hand, 0.05 * PF.hand]);
      placeC(B['thigh' + s], hp, l.knee);
      placeC(B['shortsT' + s], hp, hp.clone().lerp(l.knee, 0.55));
      placeE(B['knee' + s], l.knee, l.knee.clone().sub(hp), dep, [PF.calf[0] - 0.006, PF.calf[0] - 0.006, PF.calf[0] - 0.008]);
      placeC(B['shin' + s], l.knee, l.ank);
      placeE(B['ankle' + s], l.ank, up, dep, [0.036, 0.036, 0.036]);
      const fd = V(o.face, 0, 0).normalize();
      placeE(B['foot' + s], l.ank.clone().addScaledVector(fd, 0.07).add(V(0, -0.03, 0)), fd, up, [0.12, 0.045, 0.05]);
    });
    // muscles qui s'allument : rouge (faible) → vert (activé)
    const lit = {};
    (ex.muscles || []).forEach(function (m) { (MUSCLE_GROUP[m] || []).forEach(function (k) { lit[k] = 1; }); });
    GROUPS.forEach(function (k) {
      const m = mats.g[k]; if (!m.emissive) return;
      if (lit[k]) { const c = new T.Color(0xff2d2d).lerp(new T.Color(0x2dff7a), Math.min(1, act * 1.15)); m.emissive.copy(c).convertSRGBToLinear(); m.emissiveIntensity = 0.12 + 0.5 * act; }
      else { m.emissive.setRGB(0, 0, 0); m.emissiveIntensity = 0; }
    });
  }

  /* ---------- tapis ---------- */
  function matTexture(w, h) {
    const px = 380, c = doc.createElement('canvas'); c.width = Math.round(w * px); c.height = Math.round(h * px);
    const x = c.getContext('2d'), W = c.width, H = c.height;
    x.fillStyle = '#0d0c13'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 4000; i++) { x.fillStyle = 'rgba(255,255,255,' + Math.random() * 0.035 + ')'; x.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4); }
    x.strokeStyle = PF.mat; x.lineWidth = 3; x.strokeRect(px * 0.05, px * 0.05, W - px * 0.1, H - px * 0.1);
    x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 1.5; x.strokeRect(px * 0.085, px * 0.085, W - px * 0.17, H - px * 0.17);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function makeMat() {
    const w = 3, h = 1.5, mesh = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: matTexture(w, h) }));
    mesh.rotation.x = -PI / 2; mesh.position.y = 0.002; return mesh;
  }

  /* ---------- scène partagée ---------- */
  function initGL() {
    if (R) return true;
    try {
      const cv = doc.createElement('canvas');
      R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    } catch (e) { failed = true; return false; }
    R.setClearColor(0x000000, 0); R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
    scene = new T.Scene(); cam = new T.PerspectiveCamera(27, 0.8, 0.3, 40);
    mats = makeMats(); rig = buildRig(); scene.add(rig.root);
    matMesh = makeMat(); scene.add(matMesh);
    scene.add(new T.HemisphereLight(0x9aa3c8, 0x14121a, 0.7));
    const key = new T.DirectionalLight(0xfff3ee, 1.5); key.position.set(2.2, 3.4, 3); scene.add(key);
    const rim = new T.DirectionalLight(0x6f8cff, 1.1); rim.position.set(-3, 2.2, -2.4); scene.add(rim);
    const fill = new T.DirectionalLight(PF.fill, 0.45); fill.position.set(-2.4, 0.8, 2.4); scene.add(fill);
    return true;
  }

  /* ---------- données par exercice : cadrage, effort ---------- */
  const cache = {};
  function info(ex) {
    if (cache[ex.id]) return cache[ex.id];
    const F = NEV.Figure, P = Math.max(0.6, F.period(ex)), N = 24;
    let mnx = 9, mxx = -9, mny = 9, mxy = -9, sig0 = null; const sigs = [];
    for (let i = 0; i < N; i++) {
      const o = joints(ex, (i / N) * P);
      const pts = [o.head.clone().addScaledVector(o.hdir, 0.16), o.hip, o.arms[0].wr, o.arms[1].wr, o.legs[0].ank, o.legs[1].ank, o.legs[0].knee, o.legs[1].knee, o.arms[0].el];
      pts.forEach(function (p) { mnx = Math.min(mnx, p.x); mxx = Math.max(mxx, p.x); mny = Math.min(mny, p.y); mxy = Math.max(mxy, p.y); });
      const sg = [o.arms[0].wr.x, o.arms[0].wr.y, o.legs[0].ank.x, o.legs[0].ank.y, o.hip.x, o.hip.y, o.head.x, o.head.y, o.legs[0].knee.y, o.arms[0].el.y];
      if (!sig0) sig0 = sg; sigs.push(Math.hypot.apply(null, sg.map((v, k) => v - sig0[k])));
    }
    const mx = Math.max.apply(null, sigs) || 1, hold = ex.anim.frames.length === 1 || mx < 0.02;
    return (cache[ex.id] = { P: P, hold: hold, front: ex.anim.view === 'front', box: { x0: mnx - 0.12, x1: mxx + 0.12, y0: Math.min(0, mny) - 0.03, y1: mxy + 0.1 }, eff: sigs.map((v) => v / mx), N: N });
  }
  const effAt = (inf, t) => { const k = (((t / inf.P) % 1) + 1) % 1 * inf.N, i = Math.floor(k), f = k - i; return inf.eff[i % inf.N] * (1 - f) + inf.eff[(i + 1) % inf.N] * f; };

  /* ---------- une carte ---------- */
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function mount(el, ex, opts) {
    opts = opts || {};
    const E = { el: el, ex: ex, t0: performance.now(), vis: false, w: 0, h: 0, lastRep: -1, ctl: null };
    el.classList.add('m3');
    el.innerHTML = '<div class="m3-fb"></div><canvas class="m3-cv" role="img" aria-label="' + (NEV.util ? NEV.util.esc(ex.name) : ex.name) + ' : avatar 3D"></canvas>' +
      '<span class="m3-rep">RÉP. 1/' + (opts.reps || 12) + '</span><span class="m3-ok" aria-hidden="true">' + ICON + '</span>' +
      '<div class="m3-hud" aria-hidden="true"><span>ACTIVATION</span><span class="gauge"><b></b></span><span class="pct">0%</span></div>';
    E.cv = el.querySelector('.m3-cv'); E.ctx = E.cv.getContext('2d'); E.rep = el.querySelector('.m3-rep'); E.ok = el.querySelector('.m3-ok');
    E.bar = el.querySelector('.gauge b'); E.pct = el.querySelector('.pct'); E.N = opts.reps || 12;
    let fb = null;
    if (NEV.Figure) { try { fb = NEV.Figure.mount(el.querySelector('.m3-fb'), ex, {}); } catch (e) { /* ignoré */ } }   // 2D en attendant la 3D
    E.fb = fb;
    const ctl = { destroy() { entries.delete(E); if (io) io.unobserve(el); try { fb && fb.destroy && fb.destroy(); } catch (e) { /* ignoré */ } el.innerHTML = ''; el.classList.remove('m3'); } };
    if (!supported()) return ctl;
    load().then(function () {
      if (!el.isConnected && !el.parentNode) return;
      T = g.THREE; PF = PROFILES[NEV.sex === 'f' ? 'f' : 'm']; if (!initGL()) return;
      E.inf = info(ex); entries.add(E);
      if (!io && g.IntersectionObserver) io = new g.IntersectionObserver(function (list) { list.forEach(function (it) { const e = it.target.__m3; if (e) e.vis = it.isIntersecting; }); }, { rootMargin: '120px' });
      el.__m3 = E; if (io) io.observe(el); else E.vis = true;
      kick();
    }).catch(function () { failed = true; });
    return ctl;
  }

  function renderEntry(E, now) {
    const cv = E.cv, r = cv.getBoundingClientRect(); if (r.width < 8) return;
    const dpr = Math.min(g.devicePixelRatio || 1, 1.6), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    if (R.domElement.width !== w || R.domElement.height !== h) R.setSize(w, h, false);
    const t = reduced() ? E.inf.P * 0.5 : (now - E.t0) / 1000, inf = E.inf, ex = E.ex;
    cam.aspect = w / h; cam.fov = 27; cam.updateProjectionMatrix();
    const eff = inf.hold ? 0.85 + 0.15 * Math.sin(t * 2) : effAt(inf, t);
    pose3d(ex, t, eff);
    // cadrage : l'animation entière tient dans la fenêtre
    const b = inf.box, cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, bw = b.x1 - b.x0 + (inf.front ? 0.3 : 0.5), bh = b.y1 - b.y0;
    const tf = Math.tan((cam.fov * PI) / 360), dist = Math.max((bh * 0.54) / tf, (bw * 0.54) / (tf * cam.aspect)) * 1.12;
    const az = ((inf.front ? 16 : 34) + (reduced() ? 0 : Math.sin(t * 0.45) * 13)) * PI / 180;
    cam.position.set(cx + Math.sin(az) * dist, cy + 0.14 + dist * 0.05, Math.cos(az) * dist); cam.lookAt(cx, cy - 0.02, 0);
    matMesh.scale.set(Math.max(1, (bw + 0.7) / 3), Math.max(1, (bh * 0.6 + 0.5) / 1.5), 1); matMesh.position.x = cx;
    R.render(scene, cam);
    E.ctx.clearRect(0, 0, w, h); E.ctx.drawImage(R.domElement, 0, 0, w, h);
    if (E.fb && !E.shown) { E.shown = true; E.el.classList.add('m3-on'); }
    // HUD
    const cyc = inf.hold ? t : t / inf.P, n = inf.hold ? Math.floor(t) : Math.floor(cyc) % E.N + 1;
    if (n !== E.lastRep) {
      E.lastRep = n;
      E.rep.textContent = inf.hold ? 'TENUE 0:' + String(Math.floor(t) % 60).padStart(2, '0') : 'RÉP. ' + n + '/' + E.N;
      E.ok.classList.remove('pulse'); void E.ok.offsetWidth; E.ok.classList.add('pulse');
    }
    const pc = Math.round(Math.min(1, eff) * 100);
    if (pc !== E.lastPc) { E.lastPc = pc; E.pct.textContent = pc + '%'; E.bar.style.transform = 'scaleX(' + (pc / 100).toFixed(3) + ')'; E.bar.style.background = 'hsl(' + Math.round(pc * 1.3) + ',96%,54%)'; }
  }

  function loop(now) {
    raf = 0;
    if (doc.hidden || !entries.size) return;
    if (now - last >= 33) {
      last = now;
      let budget = 6;
      entries.forEach(function (E) {
        if (!E.el.isConnected) { entries.delete(E); return; }
        if (E.vis && budget > 0) { budget--; renderEntry(E, now); }
      });
    }
    if (!reduced()) raf = g.requestAnimationFrame(loop);
    else { raf = 0; }
  }
  function kick() {
    if (raf) return;
    if (reduced()) { entries.forEach(function (E) { renderEntry(E, performance.now()); }); g.setTimeout(function () { entries.forEach(function (E) { renderEntry(E, performance.now()); }); }, 400); return; }
    raf = g.requestAnimationFrame(loop);
  }
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) kick(); });

  NEV.Mannequin = { mount: mount, supported: supported };
})(window);
