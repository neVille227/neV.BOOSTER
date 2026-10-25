/* ==========================================================
   neV.BOOSTER — ex-anim.js
   Une animation par exercice (poses clés pour NEV.Figure).
   Vue de côté (side) : le personnage regarde vers la droite.
   Vue de face (front) : pour les mouvements latéraux.
   Angles en degrés écran : 0 = droite, 90 = bas, -90 = haut.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const AK = 219, FL = 226, HY = 220;
  const rad = (d) => (d * Math.PI) / 180;
  const dirv = (d) => [Math.cos(rad(d)), Math.sin(rad(d))];
  const MAT = { k: 'mat', x1: 20, x2: 380 };

  /* ---------- fabrication de poses ---------- */
  function P(o) {
    const p = Object.assign({ face: 1, foot: [0, 0], kb: [1, 1], eb: [-1, -1] }, o);
    if (p.head == null) p.head = p.torso;
    return p;
  }
  const F = (p, d) => ({ p, d: d || 700 });
  const shOf = (p) => { const t = dirv(p.torso); return [p.hip[0] + t[0] * 69, p.hip[1] + t[1] * 69]; };
  const R = (p, x, y) => { const s = shOf(p); return { r: [x - s[0], y - s[1]] }; };
  const withArms = (p, a0, a1) => { p.arm = [a0, a1 || a0]; return p; };
  const onFloor = (p, x, y) => withArms(p, R(p, x, y == null ? HY : y), R(p, x + 5, y == null ? HY : y));

  const STAND = (o) => P(Object.assign({ hip: [200, 118], torso: -90, arm: [{ a: [90, 90] }, { a: [92, 92] }], leg: [{ t: [200, AK] }, { t: [206, AK] }] }, o));
  const FRONT = (o) => P(Object.assign({ hip: [200, 118], torso: -90, arm: [{ r: [-6, 68] }, { r: [6, 68] }], leg: [{ t: [192, AK] }, { t: [208, AK] }], kb: [-1, 1], eb: [-1, 1] }, o));

  // gisant sur le ventre / sur le dos : le bassin est le point de référence
  const LEGLEN = 101.5;
  function plank(ax, ang, o) {
    const u = dirv(ang), ay = 207;
    return P(Object.assign({ hip: [ax + u[0] * LEGLEN, ay + u[1] * LEGLEN], torso: ang, head: ang + 10, leg: [{ t: [ax, ay] }, { t: [ax + 4, ay] }], foot: [65, 65] }, o));
  }
  function kneel(kx, ang, o) {
    const u = dirv(ang), K = [kx, 218];
    return P(Object.assign({ hip: [K[0] + u[0] * 52, K[1] + u[1] * 52], torso: ang, head: ang + 10, leg: [{ a: [ang + 180, 212] }, { a: [ang + 181, 214] }], foot: [170, 170] }, o));
  }
  // allongé sur le dos : on fixe la nuque, le bassin monte selon l'angle theta
  function supine(theta, o) {
    const N = [160, 214], t = rad(theta);
    return P(Object.assign({ hip: [N[0] + 72 * Math.cos(t), N[1] - 72 * Math.sin(t)], torso: 180 - theta, head: 180 }, o));
  }

  const A = {};

  /* ============ 1. PECTORAUX, ÉPAULES, TRICEPS ============ */
  const PT = plank(60, -18.8), HX = shOf(PT)[0];
  const push = (ang, o) => onFloor(plank(60, ang, o), HX);
  A['pompes-classiques'] = { view: 'side', loop: 'pingpong', hold: 200, props: [MAT], muscles: ['chest', 'triceps', 'shoulders', 'core'], frames: [F(push(-18.8), 950), F(push(-6.5), 950)] };
  A['pompes-rapprochees'] = { view: 'side', loop: 'pingpong', hold: 200, props: [MAT], muscles: ['triceps', 'chest', 'shoulders'], frames: [F(push(-18.8), 1000), F(push(-6), 1000)] };
  A['pompes-diamant'] = { view: 'side', loop: 'pingpong', hold: 250, props: [MAT], muscles: ['triceps', 'chest', 'forearms'], frames: [F(push(-18.8), 1100), F(push(-5.5), 1100)] };

  // inclinées : mains sur une chaise
  {
    const ax = 50, chairTop = FL - 52, hy = chairTop - 6;
    const top = plank(ax, -Math.asin((207 - (hy - 68)) / 170.5) * 180 / Math.PI), hx = shOf(top)[0];
    const fr = (a) => { const p = plank(ax, a); p.leg = [{ t: [ax, 207] }, { t: [ax + 4, 207] }]; return withArms(p, R(p, hx, hy), R(p, hx + 5, hy)); };
    const aTop = -Math.asin((207 - (hy - 68)) / 170.5) * 180 / Math.PI, aBot = -Math.asin((207 - (hy - 32)) / 170.5) * 180 / Math.PI;
    A['pompes-inclinees'] = { view: 'side', loop: 'pingpong', hold: 200, props: [MAT, { k: 'chair', x: hx + 6, h: 52 }], muscles: ['chest', 'triceps', 'shoulders'], frames: [F(fr(aTop), 950), F(fr(aBot), 950)] };
  }

  // mur
  {
    const ax = 84, wallX = 237, hx = wallX - 2;
    const lean = (beta) => { const ang = -(90 - beta), u = dirv(ang); return P({ hip: [ax + u[0] * LEGLEN, AK + u[1] * LEGLEN], torso: ang, head: ang + 8, leg: [{ t: [ax, AK] }, { t: [ax + 5, AK] }] }); };
    const top = lean(30), hy = shOf(top)[1] + 3;
    const fr = (b) => { const p = lean(b); return withArms(p, R(p, hx, hy), R(p, hx + 2, hy + 3)); };
    A['pompes-mur'] = { view: 'side', loop: 'pingpong', hold: 200, props: [{ k: 'wall', x: wallX }], muscles: ['chest', 'triceps', 'shoulders'], frames: [F(fr(30), 900), F(fr(48), 900)] };
  }

  // pike
  {
    const mk = (hip, torso, head) => P({ hip, torso, head, leg: [{ t: [140, 207] }, { t: [146, 207] }], foot: [65, 65], arm: [{ t: [250, HY] }, { t: [255, HY] }], eb: [-1, -1] });
    A['pompes-pike'] = { view: 'side', loop: 'pingpong', hold: 200, props: [MAT], muscles: ['shoulders', 'triceps', 'core'], frames: [F(mk([180, 115], 31.8, 70), 1000), F(mk([188, 122], 47, 88), 1000)] };
  }

  // sur les genoux
  {
    const KT = kneel(110, -33), hx = shOf(KT)[0];
    const fr = (a) => onFloor(kneel(110, a), hx);
    A['pompes-genoux'] = { view: 'side', loop: 'pingpong', hold: 200, props: [MAT], muscles: ['chest', 'triceps', 'shoulders'], frames: [F(fr(-33), 950), F(fr(-14.8), 950)] };
  }

  // déclinées : pieds sur une chaise haute
  {
    const ax = 50, ay = 155;
    const mk = (ang) => { const u = dirv(ang); return P({ hip: [ax + u[0] * LEGLEN, ay + u[1] * LEGLEN], torso: ang, head: ang + 14, leg: [{ t: [ax, ay] }, { t: [ax + 4, ay] }], foot: [25, 25] }); };
    const top = mk(-1.3), hx = shOf(top)[0];
    const fr = (a) => onFloor(mk(a), hx);
    A['pompes-declinees'] = { view: 'side', loop: 'pingpong', hold: 200, props: [MAT, { k: 'chair', x: ax - 2, h: 64, back: 'left' }], muscles: ['shoulders', 'chest', 'triceps'], frames: [F(fr(-1.3), 1000), F(fr(11.2), 1000)] };
  }

  // archer : un bras fléchit, l'autre reste tendu
  {
    const fr = (a) => { const p = plank(60, a); return withArms(p, R(p, HX, HY), R(p, HX + 22, HY)); };
    A['pompes-archer'] = { view: 'side', loop: 'pingpong', hold: 250, props: [MAT], muscles: ['chest', 'triceps', 'shoulders', 'core'], frames: [F(fr(-18.8), 1100), F(fr(-5.5), 1100)] };
  }

  // claquées : explosive
  {
    const air = plank(60, -25);
    withArms(air, { r: [12, 30] }, { r: [14, 32] });
    air.leg = [{ t: [60, 207] }, { t: [64, 207] }];
    A['pompes-claquees'] = { view: 'side', loop: 'pingpong', hold: 100, props: [MAT], muscles: ['chest', 'triceps', 'shoulders', 'core'], frames: [F(push(-6.5), 700), F(push(-18.8), 220), F(air, 260)] };
  }

  // dips sur chaise
  {
    const mk = (hip, handx) => P({ hip, torso: -90, head: -80, arm: [{ t: [handx, 168] }, { t: [handx + 3, 168] }], leg: [{ t: [230, AK] }, { t: [236, AK] }], eb: [-1, -1] });
    A['dips-chaise'] = { view: 'side', loop: 'pingpong', hold: 250, props: [{ k: 'chair', x: 100, h: 52, back: 'left' }], muscles: ['triceps', 'shoulders', 'chest'], frames: [F(mk([146, 169], 126), 900), F(mk([150, 203], 126), 900)] };
  }

  /* ============ 2. DOS ET ARRIÈRE DES ÉPAULES ============ */
  const PRONE = (o) => P(Object.assign({ hip: [230, 212], torso: 0, head: 0, arm: [{ a: [0, 0] }, { a: [2, 2] }], leg: [{ a: [180, 180] }, { a: [182, 182] }], foot: [170, 170] }, o));
  A['superman'] = { view: 'side', loop: 'pingpong', hold: 700, props: [MAT], muscles: ['lowback', 'back', 'glutes'], frames: [F(PRONE({}), 900), F(PRONE({ torso: -9, head: -16, arm: [{ a: [-16, -16] }, { a: [-14, -14] }], leg: [{ a: [195, 195] }, { a: [193, 193] }] }), 900)] };

  {
    const base = P({ hip: [170, 167], torso: -12.6, head: -2, arm: [{ r: [8, 68] }, { r: [10, 68] }], leg: [{ a: [90, 180] }, { a: [92, 181] }], foot: [180, 180] });
    const armA = (p, i) => { p.arm[i] = { r: [68, -4] }; return p; };
    const legA = (p, i) => { p.leg[i] = { a: [188, 185] }; return p; };
    const clone = () => JSON.parse(JSON.stringify(base));
    const fA = armA(legA(clone(), 1), 0), fB = armA(legA(clone(), 0), 1);
    A['bird-dog'] = { view: 'side', loop: 'cycle', hold: 400, props: [MAT], muscles: ['back', 'lowback', 'core', 'glutes'], frames: [F(clone(), 500), F(fA, 800), F(clone(), 500), F(fB, 800)] };
  }

  {
    const mk = (a) => PRONE({ torso: -4, head: -9, arm: [{ a: [a, a] }, { a: [a + 2, a + 2] }] });
    A['anges-inverses'] = { view: 'side', loop: 'pingpong', hold: 250, props: [MAT], muscles: ['back', 'shoulders', 'lowback'], frames: [F(mk(190), 900), F(mk(270), 900), F(mk(350), 900)] };
  }

  {
    const mk = (o) => P(Object.assign({ hip: [172, 125], torso: -40, head: -48, leg: [{ t: [200, AK] }, { t: [206, AK] }], arm: [{ a: [90, 90] }, { a: [92, 92] }] }, o));
    A['rowing-sac'] = { view: 'side', loop: 'pingpong', hold: 250, props: [{ k: 'bag', at: 'hang', hand: 0 }], muscles: ['back', 'biceps', 'lowback'], frames: [F(mk({}), 900), F(mk({ arm: [{ a: [150, 100] }, { a: [152, 102] }] }), 900)] };
    A['rowing-sac-unilateral'] = { view: 'side', loop: 'pingpong', hold: 250, props: [{ k: 'bag', at: 'hang', hand: 0 }], muscles: ['back', 'biceps', 'core'], frames: [F(mk({ arm: [{ a: [90, 90] }, { t: [203, 142] }] }), 900), F(mk({ arm: [{ a: [150, 100] }, { t: [203, 142] }] }), 900)] };
  }

  {
    const mk = (i, up) => PRONE({ torso: -3, head: -8, arm: [{ a: [i === 0 && up ? -22 : 0, i === 0 && up ? -22 : 0] }, { a: [i === 1 && up ? -22 : 2, i === 1 && up ? -22 : 2] }], leg: [{ a: [i === 1 && up ? 198 : 180, i === 1 && up ? 198 : 180] }, { a: [i === 0 && up ? 198 : 182, i === 0 && up ? 198 : 182] }] });
    A['swimmer'] = { view: 'side', loop: 'cycle', hold: 100, props: [MAT], muscles: ['lowback', 'back', 'glutes', 'shoulders'], frames: [F(mk(0, true), 500), F(mk(0, false), 250), F(mk(1, true), 500), F(mk(1, false), 250)] };
  }

  /* ============ 3. CUISSES ET FESSIERS ============ */
  A['squats'] = { view: 'side', loop: 'pingpong', hold: 200, muscles: ['quads', 'glutes', 'hamstrings'], frames: [F(STAND({ arm: [{ a: [60, 60] }, { a: [62, 62] }] }), 1000), F(STAND({ hip: [177, 178], torso: -58, head: -62, arm: [{ a: [0, 0] }, { a: [2, 2] }] }), 1000)] };

  A['fentes-arriere'] = {
    view: 'side', loop: 'pingpong', hold: 200, muscles: ['quads', 'glutes', 'hamstrings'],
    frames: [
      F(STAND({ hip: [213, 118], arm: [{ a: [80, 90] }, { a: [82, 92] }], leg: [{ t: [215, AK] }, { t: [209, AK] }] }), 900),
      F(STAND({ hip: [170, 168], torso: -87, arm: [{ a: [70, 85] }, { a: [72, 87] }], leg: [{ t: [215, AK] }, { t: [118, 205] }], foot: [0, 70] }), 900)
    ]
  };

  A['chaise-mur'] = {
    view: 'side', loop: 'pingpong', hold: 1500, props: [{ k: 'wall', x: 122 }], muscles: ['quads', 'glutes'],
    frames: [
      F(STAND({ hip: [164, 118], leg: [{ t: [176, AK] }, { t: [182, AK] }] }), 1200),
      F(STAND({ hip: [164, 177], arm: [{ a: [25, 35] }, { a: [27, 37] }], leg: [{ t: [222, AK] }, { t: [228, AK] }] }), 1200)
    ]
  };

  {
    const mk = (th) => { const t = supine(th); t.arm = [{ a: [0, 0] }, { a: [2, 2] }]; t.leg = [{ t: [282, AK] }, { t: [288, AK] }]; return t; };
    A['pont-fessier'] = { view: 'side', loop: 'pingpong', hold: 450, props: [MAT], muscles: ['glutes', 'hamstrings', 'core'], frames: [F(mk(0), 950), F(mk(40), 950)] };
    const mk1 = (th) => { const t = mk(th); t.leg = [{ t: [282, AK] }, { r: [66, -70] }]; t.foot = [0, -40]; return t; };
    A['pont-une-jambe'] = { view: 'side', loop: 'pingpong', hold: 450, props: [MAT], muscles: ['glutes', 'hamstrings', 'core'], frames: [F(mk1(0), 1000), F(mk1(40), 1000)] };
  }

  A['mollets'] = {
    view: 'side', loop: 'pingpong', hold: 350, muscles: ['calves'],
    frames: [
      F(STAND({ arm: [{ a: [75, 100] }, { a: [77, 102] }] }), 800),
      F(STAND({ hip: [200, 104], arm: [{ a: [75, 100] }, { a: [77, 102] }], leg: [{ t: [200, AK - 14] }, { t: [206, AK - 14] }], foot: [50, 50] }), 800)
    ]
  };

  A['montees-marche'] = {
    view: 'side', loop: 'pingpong', hold: 250, props: [{ k: 'step', x: 215, w: 76, h: 24 }], muscles: ['quads', 'glutes'],
    frames: [
      F(STAND({ hip: [160, 120], torso: -88, arm: [{ a: [100, 120] }, { a: [70, 60] }], leg: [{ t: [200, 195] }, { t: [140, AK] }] }), 800),
      F(STAND({ hip: [200, 95], torso: -90, arm: [{ a: [70, 60] }, { a: [100, 120] }], leg: [{ t: [200, 195] }, { t: [226, 150] }] }), 800)
    ]
  };

  // sumo (vue de face)
  A['squat-sumo'] = {
    view: 'front', loop: 'pingpong', hold: 250, muscles: ['quads', 'glutes', 'hamstrings'],
    frames: [
      F(FRONT({ hip: [200, 127], arm: [{ r: [14, 50] }, { r: [-14, 50] }], leg: [{ t: [150, AK] }, { t: [250, AK] }] }), 1000),
      F(FRONT({ hip: [200, 172], arm: [{ r: [14, 50] }, { r: [-14, 50] }], leg: [{ t: [150, AK] }, { t: [250, AK] }] }), 1000)
    ]
  };

  A['fentes-laterales'] = {
    view: 'front', loop: 'pingpong', hold: 250, muscles: ['quads', 'glutes', 'hamstrings'],
    frames: [
      F(FRONT({ hip: [170, 118], arm: [{ r: [8, 50] }, { r: [-8, 50] }], leg: [{ t: [160, AK] }, { t: [180, AK] }] }), 800),
      F(FRONT({ hip: [205, 128], arm: [{ r: [8, 50] }, { r: [-8, 50] }], leg: [{ t: [160, AK] }, { t: [232, AK - 16] }] }), 600),
      F(FRONT({ hip: [240, 152], arm: [{ r: [8, 50] }, { r: [-8, 50] }], leg: [{ t: [160, AK] }, { t: [262, AK] }] }), 900)
    ]
  };

  A['fentes-marchees'] = {
    view: 'side', loop: 'pingpong', hold: 150, muscles: ['quads', 'glutes', 'hamstrings'],
    frames: [
      F(STAND({ hip: [176, 118], arm: [{ a: [70, 85] }, { a: [72, 87] }], leg: [{ t: [176, AK] }, { t: [172, AK] }] }), 600),
      F(STAND({ hip: [190, 124], arm: [{ a: [60, 80] }, { a: [62, 82] }], leg: [{ t: [225, AK - 26] }, { t: [172, AK] }] }), 600),
      F(STAND({ hip: [205, 169], torso: -88, arm: [{ a: [60, 85] }, { a: [62, 87] }], leg: [{ t: [252, AK] }, { t: [170, 205] }], foot: [0, 70] }), 800)
    ]
  };

  {
    const bottom = STAND({ hip: [177, 178], torso: -58, head: -62, arm: [{ a: [120, 120] }, { a: [122, 122] }] });
    const take = STAND({ hip: [200, 119], arm: [{ a: [70, 70] }, { a: [72, 72] }], leg: [{ t: [200, AK - 6] }, { t: [206, AK - 6] }], foot: [30, 30] });
    const air = STAND({ hip: [200, 96], arm: [{ a: [-60, -60] }, { a: [-58, -58] }], leg: [{ t: [200, AK - 28] }, { t: [206, AK - 28] }], foot: [60, 60] });
    A['squat-saute'] = { view: 'side', loop: 'pingpong', hold: 60, muscles: ['quads', 'glutes', 'calves'], frames: [F(bottom, 650), F(take, 160), F(air, 260)] };
  }

  {
    const rear = [112, 165];
    const mk = (hip, torso) => STAND({ hip, torso, arm: [{ a: [30, 40] }, { a: [32, 42] }], leg: [{ t: [205, AK] }, { t: rear }], foot: [0, 180] });
    A['squat-bulgare'] = { view: 'side', loop: 'pingpong', hold: 200, props: [{ k: 'chair', x: 100, h: 52, back: 'left' }], muscles: ['quads', 'glutes', 'hamstrings'], frames: [F(mk([180, 121], -86), 1000), F(mk([170, 168], -76), 1000)] };
  }

  A['pistol-assiste'] = {
    view: 'side', loop: 'pingpong', hold: 250, muscles: ['quads', 'glutes', 'core'],
    frames: [
      F(STAND({ hip: [200, 118], torso: -88, arm: [{ a: [20, 20] }, { a: [22, 22] }], leg: [{ t: [200, AK] }, { r: [98, -22] }] }), 1100),
      F(STAND({ hip: [168, 178], torso: -55, head: -62, arm: [{ a: [0, 0] }, { a: [2, 2] }], leg: [{ t: [200, AK] }, { r: [98, -6] }] }), 1100)
    ]
  };

  /* ============ 4. ABDOS ET GAINAGE ============ */
  {
    const mk = (a) => { const p = plank(60, a); p.arm = [{ a: [90, 0] }, { a: [92, 2] }]; p.head = a + 6; return p; };
    A['planche'] = { view: 'side', loop: 'pingpong', hold: 900, props: [MAT], muscles: ['abs', 'core', 'shoulders'], frames: [F(mk(-7.8), 1500), F(mk(-9), 1500)] };
    const mk2 = (a) => { const p = kneel(110, a); p.arm = [{ a: [90, 0] }, { a: [92, 2] }]; p.head = a + 6; return p; };
    A['planche-genoux'] = { view: 'side', loop: 'pingpong', hold: 900, props: [MAT], muscles: ['abs', 'core'], frames: [F(mk2(-16.3), 1500), F(mk2(-17.5), 1500)] };
    const mk3 = (a, up) => { const p = plank(60, a); p.arm = [{ a: [90, 0] }, { a: [-90, -90] }]; p.head = a - 6; return p; };
    A['planche-laterale'] = { view: 'side', loop: 'pingpong', hold: 700, props: [MAT], muscles: ['core', 'abs', 'shoulders'], frames: [F(mk3(-11), 1200), F(mk3(-7), 1200)] };
  }

  {
    const base = () => P({ hip: [230, 214], torso: 180, head: 180, arm: [{ a: [-90, -90] }, { a: [-92, -92] }], leg: [{ a: [-90, 0] }, { a: [-92, 2] }], foot: [-30, -30] });
    const ext = (p, arm, leg) => { p.arm[arm] = { a: [-180, -180] }; p.leg[leg] = { a: [-8, -8] }; return p; };
    A['dead-bug'] = { view: 'side', loop: 'cycle', hold: 250, props: [MAT], muscles: ['abs', 'core', 'lowback'], frames: [F(base(), 450), F(ext(base(), 0, 1), 900), F(base(), 450), F(ext(base(), 1, 0), 900)] };
  }

  {
    const mk = (th, a1, a2) => { const p = supine(th); p.arm = [{ a: [0, 0] }, { a: [2, 2] }]; p.leg = [{ a: [a1, a2] }, { a: [a1 - 2, a2 - 1] }]; p.foot = [-20, -20]; return p; };
    A['crunch-inverse'] = { view: 'side', loop: 'pingpong', hold: 300, props: [MAT], muscles: ['abs', 'core'], frames: [F(mk(0, -60, 40), 900), F(mk(10, -108, -15), 900)] };
  }

  {
    const mk = (legA, legB, armA) => { const hip = [232, 214]; const t = 196; return P({ hip, torso: t, head: 200, arm: [{ a: armA }, { a: [-60, 155] }], leg: [{ a: legA }, { a: legB }], foot: [-20, -20] }); };
    A['crunch-velo'] = { view: 'side', loop: 'cycle', hold: 100, props: [MAT], muscles: ['abs', 'core'], frames: [F(mk([-112, -20], [-12, -12], [-40, 160]), 600), F(mk([-12, -12], [-112, -20], [-70, 150]), 600)] };
  }

  {
    const mk = (up) => {
      const p = plank(60, -18.8);
      const hip = p.hip; const driven = { t: [hip[0] + 30, hip[1] + 26] }, ext = { t: [60, 207] };
      p.leg = up === 0 ? [driven, { t: [64, 207] }] : [ext, { t: [hip[0] + 32, hip[1] + 28] }];
      p.foot = up === 0 ? [30, 65] : [65, 30];
      return onFloor(p, HX);
    };
    A['mountain-climbers'] = { view: 'side', loop: 'cycle', hold: 0, props: [MAT], muscles: ['abs', 'core', 'shoulders', 'quads'], frames: [F(mk(0), 380), F(mk(1), 380)] };
  }

  {
    const mk = (r) => P({ hip: [200, 212], torso: -118, head: -112, arm: [{ r }, { r: [r[0] + 3, r[1]] }], leg: [{ a: [-50, 25] }, { a: [-52, 27] }], foot: [10, 10] });
    A['russian-twist'] = { view: 'side', loop: 'pingpong', hold: 100, props: [MAT], muscles: ['abs', 'core'], frames: [F(mk([48, 16]), 650), F(mk([20, 36]), 650)] };
  }

  {
    const mk = (a) => { const p = supine(0); p.arm = [{ a: [0, 0] }, { a: [2, 2] }]; p.leg = [{ a: [a, a] }, { a: [a - 2, a - 2] }]; p.foot = [-30, -30]; return p; };
    A['releves-jambes'] = { view: 'side', loop: 'pingpong', hold: 250, props: [MAT], muscles: ['abs', 'core', 'quads'], frames: [F(mk(-8), 1000), F(mk(-88), 1000)] };
  }

  {
    const flat = P({ hip: [215, 212], torso: 180, head: 180, arm: [{ a: [180, 180] }, { a: [182, 182] }], leg: [{ a: [-8, -8] }, { a: [-10, -10] }], foot: [-30, -30] });
    const vee = P({ hip: [215, 212], torso: 240, head: 245, arm: [{ a: [340, 340] }, { a: [342, 342] }], leg: [{ a: [-60, -60] }, { a: [-62, -62] }], foot: [-30, -30] });
    A['v-ups'] = { view: 'side', loop: 'pingpong', hold: 150, props: [MAT], muscles: ['abs', 'core', 'quads'], frames: [F(flat, 900), F(vee, 900)] };
  }

  {
    const mk = (t) => P({ hip: [215, 213], torso: t, head: t + 5, arm: [{ a: [t, t] }, { a: [t + 2, t + 2] }], leg: [{ a: [-14, -14] }, { a: [-16, -16] }], foot: [-30, -30] });
    A['hollow-body'] = { view: 'side', loop: 'pingpong', hold: 800, props: [MAT], muscles: ['abs', 'core'], frames: [F(mk(190), 1400), F(mk(194), 1400)] };
  }

  /* ============ 5. BRAS ET AVANT-BRAS ============ */
  {
    const mk = (a2) => STAND({ arm: [{ a: [95, a2] }, { a: [97, a2 + 2] }] });
    A['curl-sac'] = { view: 'side', loop: 'pingpong', hold: 250, props: [{ k: 'bag', at: 'hang', hand: 0 }], muscles: ['biceps', 'forearms'], frames: [F(mk(90), 1000), F(mk(-75), 1000)] };
    const alt = (up) => STAND({ arm: [{ a: [95, up === 0 ? -75 : 90] }, { a: [97, up === 1 ? -73 : 92] }] });
    A['curl-marteau'] = { view: 'side', loop: 'cycle', hold: 150, props: [{ k: 'bottle', hand: 0 }, { k: 'bottle', hand: 1 }], muscles: ['biceps', 'forearms'], frames: [F(alt(-1), 400), F(alt(0), 900), F(alt(-1), 500), F(alt(1), 900)] };
  }

  {
    const seat = (o) => P(Object.assign({ hip: [176, 165], torso: -35, head: -42, leg: [{ a: [2, 90] }, { a: [4, 92] }] }, o));
    const wr = (w) => seat({ arm: [{ a: [75, -3] }, { a: [77, -1] }], wr: [w, w] });
    A['poignets-flexion'] = { view: 'side', loop: 'pingpong', hold: 150, props: [{ k: 'chair', x: 178, back: 'left' }, { k: 'bottle', hand: 0, follow: true }], muscles: ['forearms'], frames: [F(wr(35), 800), F(wr(-45), 800)] };
    A['poignets-extension'] = { view: 'side', loop: 'pingpong', hold: 150, props: [{ k: 'chair', x: 178, back: 'left' }, { k: 'bottle', hand: 0, follow: true }], muscles: ['forearms'], frames: [F(wr(45), 800), F(wr(-30), 800)] };
    const conc = (a2) => seat({ torso: -50, head: -45, arm: [{ a: [65, a2] }, { a: [80, 10] }] });
    A['curl-concentre'] = { view: 'side', loop: 'pingpong', hold: 250, props: [{ k: 'chair', x: 178, back: 'left' }, { k: 'bottle', hand: 0 }], muscles: ['biceps', 'forearms'], frames: [F(conc(90), 1000), F(conc(-30), 1000)] };
  }

  A['serviette-serrage'] = {
    view: 'front', loop: 'pingpong', hold: 400, props: [{ k: 'towel' }], muscles: ['forearms', 'biceps'],
    frames: [
      F(FRONT({ arm: [{ t: [178, 70] }, { t: [222, 70] }] }), 1000),
      F(FRONT({ arm: [{ t: [164, 72] }, { t: [236, 72] }] }), 1000)
    ]
  };

  {
    const mk = (a2) => STAND({ arm: [{ a: [-90, a2] }, { a: [-92, a2 - 2] }] });
    A['triceps-extension-sac'] = { view: 'side', loop: 'pingpong', hold: 250, props: [{ k: 'bag', hand: 0 }], muscles: ['triceps', 'shoulders'], frames: [F(mk(-90), 1100), F(mk(-190), 1100)] };
  }

  {
    const mk = (a2) => P({ hip: [172, 125], torso: -40, head: -48, leg: [{ t: [200, AK] }, { t: [206, AK] }], arm: [{ a: [188, a2] }, { t: [203, 142] }] });
    A['kickback-bouteille'] = { view: 'side', loop: 'pingpong', hold: 300, props: [{ k: 'bottle', hand: 0 }], muscles: ['triceps', 'shoulders'], frames: [F(mk(95), 900), F(mk(188), 900)] };
  }

  {
    const walk = (hip, l0, l1, f0, f1) => P({ hip, torso: -90, arm: [{ a: [90, 90] }, { a: [92, 92] }], leg: [{ t: l0 }, { t: l1 }], foot: [f0 || 0, f1 || 0] });
    A['farmer-carry'] = {
      view: 'side', loop: 'cycle', hold: 0, props: [{ k: 'bag', at: 'hang', hand: 0 }], muscles: ['forearms', 'shoulders', 'core', 'glutes'],
      frames: [
        F(walk([200, 124], [232, AK], [166, AK - 6], 0, 30), 320),
        F(walk([200, 117], [200, AK], [205, AK - 22], 0, 0), 280),
        F(walk([200, 124], [166, AK - 6], [232, AK], 30, 0), 320),
        F(walk([200, 117], [205, AK - 22], [200, AK], 0, 0), 280)
      ]
    };
  }

  /* ============ 6. CARDIO ET CORPS ENTIER ============ */
  A['jumping-jacks'] = {
    view: 'front', loop: 'pingpong', hold: 30, muscles: ['quads', 'shoulders', 'calves'],
    frames: [
      F(FRONT({ hip: [200, 118], arm: [{ r: [-6, 68] }, { r: [6, 68] }], leg: [{ t: [192, AK] }, { t: [208, AK] }] }), 330),
      F(FRONT({ hip: [200, 126], arm: [{ r: [-46, -52] }, { r: [46, -52] }], leg: [{ t: [150, AK] }, { t: [250, AK] }] }), 330)
    ]
  };

  {
    const mk = (up) => STAND({
      hip: [200, 116],
      arm: up === 0 ? [{ a: [125, 45] }, { a: [45, -45] }] : [{ a: [45, -45] }, { a: [125, 45] }],
      leg: up === 0 ? [{ t: [253, 170] }, { t: [200, AK] }] : [{ t: [200, AK] }, { t: [253, 170] }],
      foot: up === 0 ? [30, 0] : [0, 30]
    });
    A['montees-genoux'] = { view: 'side', loop: 'cycle', hold: 0, muscles: ['quads', 'abs', 'calves'], frames: [F(mk(0), 280), F(mk(1), 280)] };
  }

  {
    const stand = STAND({ arm: [{ r: [0, 68] }, { r: [2, 68] }] });
    const crouch = P({ hip: [175, 185], torso: -20, head: -10, leg: [{ t: [200, AK] }, { t: [206, AK] }], arm: [{ r: [0, 0] }, { r: [0, 0] }] });
    onFloor(crouch, HX + 20);
    const pl = plank(80, -18.8); onFloor(pl, HX + 20);
    A['burpees-adaptes'] = { view: 'side', loop: 'pingpong', hold: 250, props: [MAT], muscles: ['quads', 'chest', 'core', 'shoulders'], frames: [F(stand, 700), F(crouch, 600), F(pl, 600)] };

    const bot = plank(80, -6.5); onFloor(bot, HX + 20);
    const crouch2 = JSON.parse(JSON.stringify(crouch));
    const jump = STAND({ hip: [200, 88], arm: [{ r: [12, -66] }, { r: [14, -66] }], leg: [{ t: [200, AK - 32] }, { t: [206, AK - 32] }], foot: [60, 60] });
    A['burpees-complets'] = { view: 'side', loop: 'cycle', hold: 60, props: [MAT], muscles: ['quads', 'chest', 'triceps', 'core', 'shoulders'], frames: [F(stand, 450), F(crouch, 380), F(pl, 320), F(bot, 380), F(pl, 260), F(crouch2, 320), F(jump, 380)] };
  }

  A['squat-pointes'] = {
    view: 'side', loop: 'pingpong', hold: 150, muscles: ['quads', 'glutes', 'calves'],
    frames: [
      F(STAND({ hip: [177, 178], torso: -58, head: -62, arm: [{ a: [0, 0] }, { a: [2, 2] }] }), 900),
      F(STAND({ hip: [200, 104], arm: [{ a: [-90, -90] }, { a: [-88, -88] }], leg: [{ t: [200, AK - 14] }, { t: [206, AK - 14] }], foot: [50, 50] }), 900)
    ]
  };

  {
    const side = (dir) => {
      const hx = dir > 0 ? 225 : 175, st = dir > 0 ? 1 : 0;
      const legs = [null, null];
      legs[st] = { t: [dir > 0 ? 234 : 166, AK] };
      legs[1 - st] = { t: [dir > 0 ? 262 : 138, AK - 26] };
      return FRONT({ hip: [hx, 121], torso: -90 + dir * 6, arm: dir > 0 ? [{ r: [30, 50] }, { r: [45, 45] }] : [{ r: [-45, 45] }, { r: [-30, 50] }], leg: legs });
    };
    const air = FRONT({ hip: [200, 104], arm: [{ r: [-10, 55] }, { r: [10, 55] }], leg: [{ t: [188, AK - 20] }, { t: [212, AK - 20] }] });
    A['skaters'] = { view: 'front', loop: 'cycle', hold: 0, muscles: ['quads', 'glutes', 'core'], frames: [F(side(1), 380), F(air, 200), F(side(-1), 380), F(air, 200)] };
  }

  {
    const mk = (o) => P(Object.assign({ hip: [197, 123], torso: -86, head: -86, leg: [{ t: [225, AK] }, { t: [170, AK] }], arm: [{ a: [65, -75] }, { a: [65, -70] }], foot: [0, 0] }, o));
    A['shadow-boxing'] = { view: 'side', loop: 'cycle', hold: 0, muscles: ['shoulders', 'triceps', 'core'], frames: [F(mk({}), 300), F(mk({ arm: [{ a: [-3, -3] }, { a: [65, -70] }] }), 220), F(mk({}), 260), F(mk({ hip: [203, 123], torso: -80, head: -82, arm: [{ a: [65, -75] }, { a: [-3, -3] }] }), 220)] };
  }

  {
    const mk = (kick) => STAND({
      hip: [200, 117], arm: kick === 0 ? [{ a: [125, 45] }, { a: [45, -45] }] : [{ a: [45, -45] }, { a: [125, 45] }],
      leg: kick === 0 ? [{ a: [95, 235] }, { a: [90, 90] }] : [{ a: [90, 90] }, { a: [95, 235] }]
    });
    A['talons-fesses'] = { view: 'side', loop: 'cycle', hold: 0, muscles: ['hamstrings', 'calves', 'glutes'], frames: [F(mk(0), 260), F(mk(1), 260)] };
  }

  {
    const mk = (tap) => { const p = plank(60, -18.8); const sup = R(p, HX, HY); p.arm = tap === 0 ? [{ r: [10, 24] }, sup] : [sup, { r: [10, 24] }]; return p; };
    A['tap-epaule'] = { view: 'side', loop: 'cycle', hold: 150, props: [MAT], muscles: ['core', 'shoulders', 'abs'], frames: [F(mk(0), 550), F(mk(1), 550)] };
  }

  {
    const base = { hip: [172, 158], torso: -5.5, head: -5, leg: [{ t: [152, 204] }, { t: [157, 204] }], foot: [65, 65] };
    const mk = (fw) => { const p = P(Object.assign({}, base)); const sup = R(p, 248, HY); p.arm = fw === 0 ? [{ r: [44, 52] }, sup] : [sup, { r: [44, 52] }]; p.leg = fw === 0 ? [{ t: [152, 204] }, { t: [198, 204] }] : [{ t: [198, 204] }, { t: [157, 204] }]; return p; };
    A['bear-crawl'] = { view: 'side', loop: 'cycle', hold: 150, props: [MAT], muscles: ['shoulders', 'core', 'quads', 'glutes'], frames: [F(mk(0), 650), F(mk(1), 650)] };
  }

  /* ============ 7. MOBILITÉ ET RÉCUPÉRATION ============ */
  A['rotations-epaules'] = {
    view: 'front', loop: 'pingpong', hold: 0, muscles: ['shoulders'],
    frames: [
      F(FRONT({ arm: [{ r: [-68, 0] }, { r: [68, 0] }] }), 800),
      F(FRONT({ arm: [{ r: [-50, -46] }, { r: [50, -46] }] }), 800),
      F(FRONT({ arm: [{ r: [-22, -65] }, { r: [22, -65] }] }), 800)
    ]
  };

  {
    const mk = (torso, head) => { const p = P({ hip: [170, 167], torso, head, leg: [{ a: [90, 180] }, { a: [92, 181] }], foot: [180, 180] }); return onFloor(p, 248); };
    A['chat-vache'] = { view: 'side', loop: 'pingpong', hold: 400, props: [MAT], muscles: ['back', 'abs', 'lowback'], frames: [F(mk(-10, 62), 1600), F(mk(-13, -40), 1600)] };
  }

  {
    const mk = (f) => STAND({ arm: [{ a: [80, 80] }, { a: [82, 82] }], leg: [{ t: [200, AK] }, { t: [236, 176] }], foot: [0, f] });
    A['mobilite-chevilles'] = { view: 'side', loop: 'cycle', hold: 0, muscles: ['calves'], frames: [F(mk(0), 500), F(mk(42), 500), F(mk(0), 500), F(mk(-42), 500)] };
  }

  {
    const B = [55, AK];
    const mk = (ang) => { const u = dirv(ang); return P({ hip: [B[0] + u[0] * LEGLEN, B[1] + u[1] * LEGLEN], torso: ang, head: ang + 4, leg: [{ t: [195, AK] }, { t: B }], arm: [{ t: [238, 102] }, { t: [238, 106] }] }); };
    A['etirement-mollets'] = { view: 'side', loop: 'pingpong', hold: 1200, props: [{ k: 'wall', x: 240 }], muscles: ['calves', 'hamstrings'], frames: [F(mk(-44), 1800), F(mk(-47), 1800)] };
  }

  A['etirement-cuisses'] = {
    view: 'side', loop: 'pingpong', hold: 1500, props: [{ k: 'wall', x: 250 }], muscles: ['quads'],
    frames: [
      F(STAND({ arm: [{ r: [0, 68] }, { t: [248, 75] }], leg: [{ a: [90, 90] }, { a: [92, 92] }] }), 1300),
      F(STAND({ arm: [{ r: [-28, 62] }, { t: [248, 75] }], leg: [{ a: [100, 250] }, { a: [92, 92] }] }), 1300)
    ]
  };

  A['etirement-pectoraux'] = {
    view: 'side', loop: 'pingpong', hold: 1500, props: [{ k: 'wall', x: 240 }], muscles: ['chest', 'shoulders', 'biceps'],
    frames: [
      F(STAND({ hip: [200, 118], arm: [{ t: [238, 20] }, { t: [238, 24] }] }), 1700),
      F(STAND({ hip: [207, 118], torso: -80, head: -84, arm: [{ t: [238, 20] }, { t: [238, 24] }] }), 1700)
    ]
  };

  {
    const mk = (hy, torso) => P({ hip: [165, hy], torso, head: torso, arm: [{ a: [2, 0] }, { a: [4, 2] }], leg: [{ a: [17, 180] }, { a: [19, 180] }], foot: [180, 180] });
    A['posture-enfant'] = { view: 'side', loop: 'pingpong', hold: 1200, props: [MAT], muscles: ['lowback', 'back', 'shoulders'], frames: [F(mk(205, 8), 2200), F(mk(202, 5), 2200)] };
  }

  /* ============ AJOUTS (documents de l'utilisateur) ============ */
  {
    const mk = (t) => { const p = P({ hip: [232, 214], torso: t, head: t - 4, arm: [{ a: [-65, 155] }, { a: [-60, 150] }], leg: [{ t: [282, AK] }, { t: [288, AK] }] }); return p; };
    A['crunch'] = { view: 'side', loop: 'pingpong', hold: 250, props: [MAT], muscles: ['abs', 'core'], frames: [F(mk(180), 800), F(mk(205), 800)] };
  }
  {
    const mk = (a2) => P({ hip: [232, 214], torso: 180, head: 180, arm: [{ a: [-90, a2] }, { a: [-92, a2 - 2] }], leg: [{ t: [282, AK] }, { t: [288, AK] }] });
    A['extension-triceps-sol'] = { view: 'side', loop: 'pingpong', hold: 250, props: [MAT, { k: 'bottle', hand: 0 }, { k: 'bottle', hand: 1 }], muscles: ['triceps', 'shoulders'], frames: [F(mk(-90), 1000), F(mk(-168), 1000)] };
  }
  {
    const mk = (a, b) => PRONE({ torso: -4, head: -9, arm: [{ a: [a, b] }, { a: [a + 2, b + 2] }] });
    A['ytw'] = { view: 'side', loop: 'cycle', hold: 350, props: [MAT], muscles: ['back', 'shoulders', 'lowback'], frames: [F(mk(-25, -25), 800), F(mk(-72, -72), 800), F(mk(-115, -45), 800)] };
  }
  A['tirage-serviette'] = {
    view: 'front', loop: 'pingpong', hold: 500, props: [{ k: 'towel' }], muscles: ['back', 'biceps', 'shoulders'],
    frames: [
      F(FRONT({ arm: [{ t: [174, 10] }, { t: [226, 10] }] }), 1100),
      F(FRONT({ arm: [{ t: [150, 50] }, { t: [250, 50] }] }), 1100)
    ]
  };
  {
    const mk = (hy, torso) => P({ hip: [200, hy], torso, head: torso, arm: [{ a: [50, 15] }, { a: [52, 17] }], leg: [{ a: [8, 172] }, { a: [10, 170] }], foot: [175, 175] });
    A['respiration-lente'] = { view: 'side', loop: 'pingpong', hold: 800, props: [MAT], muscles: ['abs', 'core'], frames: [F(mk(213, -90), 2600), F(mk(212, -92), 2600)] };
  }

  NEV.EX_ANIM = A;
  NEV.AnimKit = { A, P, F, shOf, R, withArms, onFloor, STAND, FRONT, plank, kneel, supine, PRONE, MAT, dirv, rad, AK, FL, HY, LEGLEN };
})(window);
