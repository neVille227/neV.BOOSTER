/* ==========================================================
   neV.BOOSTER — figure.js
   Petit moteur d'illustration animée : un athlète dessiné en SVG,
   dont les membres sont calculés par cinématique inverse.
   - vue de côté (view:'side') ou de face (view:'front')
   - une pose = position du bassin + angle du buste + cibles des mains et des pieds
   - une animation = quelques poses clés, jouées en aller-retour
   - les muscles travaillés s'allument en rouge braise
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});

  const W = 400, H = 286, VBY = -26, FLOOR = 226, ANK = 219;
  const L = { thigh: 52, shin: 50, foot: 18, torso: 72, neck: 22, head: 14, ua: 36, fa: 34 };
  const C = { skin: '#eab9a3', skin2: '#b97d68', shorts: '#8e1b3c', shorts2: '#5a0f22', hair: '#1b0c10', shoe: '#f6eeee', shoe2: '#c63a52', glow: '#ff5a3d' };
  const rad = (d) => (d * Math.PI) / 180;
  const f1 = (n) => Math.round(n * 10) / 10;

  /* ---------- géométrie ---------- */
  function ik2(a, t, l1, l2, s) {
    const dx = t[0] - a[0], dy = t[1] - a[1];
    let d = Math.hypot(dx, dy) || 0.0001;
    const ux = dx / d, uy = dy / d;
    const maxd = l1 + l2 - 0.02, mind = Math.abs(l1 - l2) + 0.5;
    const reach = Math.min(maxd, Math.max(mind, d));
    const aa = (l1 * l1 - l2 * l2 + reach * reach) / (2 * reach);
    const h = Math.sqrt(Math.max(0, l1 * l1 - aa * aa));
    const nx = uy * s, ny = -ux * s;
    return { mid: [a[0] + ux * aa + nx * h, a[1] + uy * aa + ny * h], end: [a[0] + ux * reach, a[1] + uy * reach], over: d - maxd };
  }
  function fk2(a, a1, a2, l1, l2) {
    const m = [a[0] + Math.cos(rad(a1)) * l1, a[1] + Math.sin(rad(a1)) * l1];
    return { mid: m, end: [m[0] + Math.cos(rad(a2)) * l2, m[1] + Math.sin(rad(a2)) * l2], over: 0 };
  }
  function limb(root, spec, l1, l2, bend) {
    if (spec.a) return fk2(root, spec.a[0], spec.a[1], l1, l2);
    const t = spec.r ? [root[0] + spec.r[0], root[1] + spec.r[1]] : spec.t;
    return ik2(root, t, l1, l2, bend);
  }
  const rot = (v, deg) => { const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
  const norm = (v) => { const d = Math.hypot(v[0], v[1]) || 1; return [v[0] / d, v[1] / d]; };
  const add = (a, b, k) => [a[0] + b[0] * (k == null ? 1 : k), a[1] + b[1] * (k == null ? 1 : k)];

  /* ---------- interpolation de poses ---------- */
  function lerp(a, b, k) {
    if (typeof a === 'number') return a + (b - a) * k;
    if (Array.isArray(a)) return a.map((v, i) => lerp(v, b[i], k));
    if (a && typeof a === 'object') {
      const ma = a.a ? 'a' : a.r ? 'r' : a.t ? 't' : null, mb = b.a ? 'a' : b.r ? 'r' : b.t ? 't' : null;
      if (ma !== null || mb !== null) {
        if (ma === mb) { const o = {}; o[ma] = lerp(a[ma], b[mb], k); return o; }
        return k < 0.5 ? a : b;
      }
      const o = {};
      Object.keys(a).forEach((key) => { o[key] = b[key] === undefined ? a[key] : lerp(a[key], b[key], k); });
      return o;
    }
    return k < 0.5 ? a : b;
  }
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

  /* ---------- résolution d'une pose en articulations ---------- */
  function resolveSide(p) {
    const hip = p.hip, tdir = [Math.cos(rad(p.torso)), Math.sin(rad(p.torso))];
    const neck = add(hip, tdir, L.torso);
    const hd = p.head == null ? p.torso : p.head;
    const hdir = [Math.cos(rad(hd)), Math.sin(rad(hd))];
    const head = add(neck, hdir, L.neck);
    const kb = p.kb || [1, 1], eb = p.eb || [-1, -1];
    const legs = [0, 1].map((i) => {
      const r = limb(hip, p.leg[i], L.thigh, L.shin, kb[i]);
      return r;
    });
    const sh = add(hip, tdir, L.torso - 3 + (p.shrug || 0));
    const arms = [0, 1].map((i) => limb(sh, p.arm[i], L.ua, L.fa, eb[i]));
    const fa = p.foot || [0, 0];
    if (p.wr) arms.forEach((a, i) => {
      const ang = Math.atan2(a.end[1] - a.mid[1], a.end[0] - a.mid[0]) + rad(p.wr[i] || 0);
      a.tip = [a.end[0] + Math.cos(ang) * 12, a.end[1] + Math.sin(ang) * 12];
    });
    return { hip, neck, head, tdir, hdir, sh, legs, arms, fa, kb, eb, face: p.face || 1 };
  }

  function resolveFront(p) {
    const hip = p.hip, tdir = [Math.cos(rad(p.torso)), Math.sin(rad(p.torso))];
    const neck = add(hip, tdir, L.torso);
    const hdF = p.head == null ? p.torso : p.head;
    const head = add(neck, [Math.cos(rad(hdF)), Math.sin(rad(hdF))], L.neck);
    const perp = [-tdir[1], tdir[0]]; // vers la droite de l'écran quand le buste est debout
    const hipPts = [add(hip, perp, -9), add(hip, perp, 9)];
    const shPts = [add(neck, perp, -17), add(neck, perp, 17)];
    shPts[0] = add(shPts[0], tdir, -4 + (p.shrug || 0)); shPts[1] = add(shPts[1], tdir, -4 + (p.shrug || 0));
    const kb = p.kb || [-1, 1], eb = p.eb || [-1, 1];
    const legs = [0, 1].map((i) => limb(hipPts[i], p.leg[i], L.thigh, L.shin, kb[i]));
    const arms = [0, 1].map((i) => limb(shPts[i], p.arm[i], L.ua, L.fa, eb[i]));
    return { hip, neck, head, tdir, perp, hipPts, shPts, legs, arms, fa: p.foot || [0, 0], kb, eb };
  }

  /* ---------- dessin ---------- */
  const seg = (a, b, w, col) => '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  const circ = (c, r, col) => '<circle cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + r + '" fill="' + col + '"/>';
  const poly = (pts, col) => '<polygon points="' + pts.map((q) => f1(q[0]) + ',' + f1(q[1])).join(' ') + '" fill="' + col + '"/>';

  function smoothClosed(pts) {
    const n = pts.length; let d = '';
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (i === 0) d += 'M' + f1(p1[0]) + ' ' + f1(p1[1]);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += 'C' + f1(c1[0]) + ' ' + f1(c1[1]) + ' ' + f1(c2[0]) + ' ' + f1(c2[1]) + ' ' + f1(p2[0]) + ' ' + f1(p2[1]);
    }
    return d + 'Z';
  }

  function shoe(ank, ang, col, col2) {
    const d = [Math.cos(rad(ang)), Math.sin(rad(ang))], n = [-d[1], d[0]];
    const heel = add(ank, d, -5), toe = add(ank, d, L.foot);
    const p = [add(add(heel, n, -6), d, 0), add(add(toe, n, -6), d, 0), add(add(toe, n, 3), d, 0), add(add(heel, n, 3), d, 0)];
    // semelle sous le pied (côté +n = bas quand le pied est à plat)
    const sole = [add(heel, n, 3), add(toe, n, 3), add(toe, n, 6), add(heel, n, 6)];
    return poly(p, col) + poly(sole, col2);
  }

  /* Anneaux de muscles : renvoie {x,y,rx,ry,rot} par nom pour la vue de côté */
  function muscleSpots(j) {
    const m = {};
    const tdeg = Math.atan2(j.tdir[1], j.tdir[0]) * 180 / Math.PI;
    const front = rot(j.tdir, 90 * j.face), back = [-front[0], -front[1]];
    const onT = (t, off) => add(add(j.hip, j.tdir, L.torso * t), front, off);
    m.chest = { c: onT(0.8, 9), rx: 17, ry: 10, rot: tdeg + 90 };
    m.abs = { c: onT(0.4, 8), rx: 14, ry: 8, rot: tdeg + 90 };
    m.core = m.abs;
    m.back = { c: onT(0.72, -9), rx: 17, ry: 8, rot: tdeg + 90 };
    m.lowback = { c: onT(0.25, -8), rx: 13, ry: 7, rot: tdeg + 90 };
    m.glutes = { c: add(j.hip, back, 8), rx: 11, ry: 10, rot: 0 };
    m.shoulders = { c: j.sh, rx: 10, ry: 10, rot: 0 };
    const A = j.arms[0], armB = rot(norm([A.mid[0] - j.sh[0], A.mid[1] - j.sh[1]]), 90);
    const ebk = j.eb[0] < 0 ? 1 : -1; // côté « arrière » du bras = côté du coude fléchi
    const midU = [(j.sh[0] + A.mid[0]) / 2, (j.sh[1] + A.mid[1]) / 2];
    const uaDir = norm([A.mid[0] - j.sh[0], A.mid[1] - j.sh[1]]);
    const bk = [uaDir[1] * j.eb[0], -uaDir[0] * j.eb[0]];
    m.triceps = { c: add(midU, bk, 4), rx: 13, ry: 6, rot: Math.atan2(uaDir[1], uaDir[0]) * 180 / Math.PI };
    m.biceps = { c: add(midU, bk, -4), rx: 13, ry: 6, rot: Math.atan2(uaDir[1], uaDir[0]) * 180 / Math.PI };
    const midF = [(A.mid[0] + A.end[0]) / 2, (A.mid[1] + A.end[1]) / 2];
    m.forearms = { c: midF, rx: 13, ry: 6, rot: Math.atan2(A.end[1] - A.mid[1], A.end[0] - A.mid[0]) * 180 / Math.PI };
    const Lg = j.legs[0];
    const thDir = norm([Lg.mid[0] - j.hip[0], Lg.mid[1] - j.hip[1]]);
    const kf = [thDir[1] * j.kb[0], -thDir[0] * j.kb[0]];
    const midT = [(j.hip[0] + Lg.mid[0]) / 2, (j.hip[1] + Lg.mid[1]) / 2];
    const thAng = Math.atan2(thDir[1], thDir[0]) * 180 / Math.PI;
    m.quads = { c: add(midT, kf, 5), rx: 22, ry: 9, rot: thAng };
    m.hamstrings = { c: add(midT, kf, -5), rx: 22, ry: 9, rot: thAng };
    const shDir = norm([Lg.end[0] - Lg.mid[0], Lg.end[1] - Lg.mid[1]]);
    const shAng = Math.atan2(shDir[1], shDir[0]) * 180 / Math.PI;
    const kfS = [shDir[1] * j.kb[0], -shDir[0] * j.kb[0]];
    const mc = [Lg.mid[0] + shDir[0] * 15, Lg.mid[1] + shDir[1] * 15];
    m.calves = { c: add(mc, kfS, -5), rx: 17, ry: 7, rot: shAng };
    m.neck = { c: add(j.neck, j.hdir || j.tdir, 8), rx: 8, ry: 11, rot: tdeg + 90 };
    m.traps = { c: [(j.neck[0] + j.sh[0]) / 2 + back[0] * 4, (j.neck[1] + j.sh[1]) / 2 + back[1] * 4], rx: 12, ry: 6, rot: tdeg + 90 };
    m.lats = { c: onT(0.55, -9), rx: 17, ry: 10, rot: tdeg + 90 };
    m.obliques = { c: onT(0.3, 2), rx: 13, ry: 9, rot: tdeg + 90 };
    m.hands = [A, j.arms[1]].map((q) => ({ c: q.tip || q.end, rx: 8, ry: 8, rot: 0 }));
    return m;
  }

  function muscleSpotsFront(j) {
    const m = {}, td = j.tdir;
    const at = (t, dx) => add(add(j.hip, td, L.torso * t), j.perp, dx);
    m.chest = { c: at(0.8, 0), rx: 20, ry: 10, rot: 0 };
    m.abs = { c: at(0.4, 0), rx: 11, ry: 14, rot: 0 };
    m.core = m.abs; m.back = m.chest; m.lowback = m.abs;
    m.shoulders = { c: j.shPts[1], rx: 11, ry: 11, rot: 0 };
    const A = j.arms[1], mu = [(j.shPts[1][0] + A.mid[0]) / 2, (j.shPts[1][1] + A.mid[1]) / 2];
    m.biceps = { c: mu, rx: 6, ry: 13, rot: 0 }; m.triceps = m.biceps;
    m.forearms = { c: [(A.mid[0] + A.end[0]) / 2, (A.mid[1] + A.end[1]) / 2], rx: 6, ry: 12, rot: 0 };
    const Lg = j.legs[1], mt = [(j.hipPts[1][0] + Lg.mid[0]) / 2, (j.hipPts[1][1] + Lg.mid[1]) / 2];
    m.quads = { c: mt, rx: 9, ry: 22, rot: 0 }; m.hamstrings = m.quads; m.glutes = { c: at(0.02, 0), rx: 16, ry: 9, rot: 0 };
    m.calves = { c: [(Lg.mid[0] + Lg.end[0]) / 2, (Lg.mid[1] + Lg.end[1]) / 2], rx: 7, ry: 15, rot: 0 };
    m.neck = { c: j.neck, rx: 9, ry: 8, rot: 0 };
    m.traps = [at(0.97, -15), at(0.97, 15)].map((c) => ({ c: c, rx: 9, ry: 5, rot: 0 }));
    m.lats = [at(0.62, -19), at(0.62, 19)].map((c) => ({ c: c, rx: 6, ry: 16, rot: 0 }));
    m.obliques = [at(0.3, -16), at(0.3, 16)].map((c) => ({ c: c, rx: 6, ry: 15, rot: 0 }));
    m.hands = [j.arms[0], j.arms[1]].map((q) => ({ c: q.tip || q.end, rx: 8, ry: 8, rot: 0 }));
    return m;
  }

  function spotsSvg(spots, names, phase) {
    if (!names || !names.length) return '';
    const a = 0.45 + 0.35 * Math.sin(phase * 6.283);
    const one = (s) => '<ellipse cx="' + f1(s.c[0]) + '" cy="' + f1(s.c[1]) + '" rx="' + s.rx + '" ry="' + s.ry + '" transform="rotate(' + f1(s.rot) + ' ' + f1(s.c[0]) + ' ' + f1(s.c[1]) + ')" fill="url(#nvGlow)" opacity="' + f1(a) + '" style="mix-blend-mode:screen"/>';
    return names.map((n) => {
      const s = spots[n]; if (!s) return '';
      return Array.isArray(s) ? s.map(one).join('') : one(s);
    }).join('');
  }

  function propsSvg(props, j, front) {
    if (!props) return '';
    return props.map((pr) => {
      const x = pr.x || 0;
      switch (pr.k) {
        case 'mat': return '<rect x="' + (pr.x1 || 60) + '" y="' + (FLOOR) + '" width="' + ((pr.x2 || 340) - (pr.x1 || 60)) + '" height="6" rx="3" fill="#5a1426"/><rect x="' + (pr.x1 || 60) + '" y="' + FLOOR + '" width="' + ((pr.x2 || 340) - (pr.x1 || 60)) + '" height="2" rx="1" fill="#8e1b3c"/>';
        case 'chair': { const w = pr.w || 50, h = pr.h || 52; return '<g fill="#7a3a2a"><rect x="' + (x - w / 2) + '" y="' + (FLOOR - h) + '" width="' + w + '" height="7" rx="3" fill="#a5513b"/><rect x="' + (x - w / 2 + 3) + '" y="' + (FLOOR - h + 7) + '" width="5" height="' + (h - 7) + '"/><rect x="' + (x + w / 2 - 8) + '" y="' + (FLOOR - h + 7) + '" width="5" height="' + (h - 7) + '"/>' + (pr.back === false ? '' : '<rect x="' + (pr.back === 'left' ? x - w / 2 : x + w / 2 - 7) + '" y="' + (FLOOR - h - 52) + '" width="7" height="52" rx="3" fill="#a5513b"/>') + '</g>'; }
        case 'wall': { const left = pr.side ? pr.side === 'left' : x < 180; return '<rect x="' + x + '" y="' + VBY + '" width="30" height="' + (FLOOR + 6 - VBY) + '" fill="#34151e"/><rect x="' + (left ? x + 27 : x) + '" y="' + VBY + '" width="3" height="' + (FLOOR + 6 - VBY) + '" fill="#7a3446"/>'; }
        case 'step': return '<rect x="' + (x - (pr.w || 70) / 2) + '" y="' + (FLOOR - (pr.h || 24)) + '" width="' + (pr.w || 70) + '" height="' + (pr.h || 24) + '" rx="4" fill="#6a2a38"/><rect x="' + (x - (pr.w || 70) / 2) + '" y="' + (FLOOR - (pr.h || 24)) + '" width="' + (pr.w || 70) + '" height="5" rx="2" fill="#a5513b"/>';
        case 'bag': { const hd = j.arms[pr.hand || 0], he = hd.tip || hd.end; const c = pr.at === 'chest' ? add(j.neck, j.tdir, -14) : pr.at === 'back' ? add(j.hip, j.tdir, 40) : pr.at === 'hang' ? add(he, [0, 1], 16) : he; return '<rect x="' + f1(c[0] - 11) + '" y="' + f1(c[1] - 14 + (pr.dy || 0)) + '" width="22" height="28" rx="8" fill="#e0455f"/><rect x="' + f1(c[0] - 7) + '" y="' + f1(c[1] - 8 + (pr.dy || 0)) + '" width="14" height="9" rx="3" fill="#8e1b3c"/>'; }
        case 'bar': { const y = pr.y == null ? 18 : pr.y, x1 = pr.x1 == null ? 70 : pr.x1, x2 = pr.x2 == null ? 330 : pr.x2; return '<rect x="' + (x1 - 8) + '" y="' + VBY + '" width="8" height="' + (y - VBY + 8) + '" fill="#34151e"/><rect x="' + x2 + '" y="' + VBY + '" width="8" height="' + (y - VBY + 8) + '" fill="#34151e"/><rect x="' + (x1 - 8) + '" y="' + (y - 3) + '" width="' + (x2 - x1 + 16) + '" height="7" rx="3.5" fill="#c9b8bd"/><rect x="' + (x1 - 8) + '" y="' + (y - 3) + '" width="' + (x2 - x1 + 16) + '" height="2.5" rx="1.2" fill="#fff" opacity=".55"/>'; }
        case 'table': { const w = pr.w || 150, h = pr.h || 86; return '<g><rect x="' + (x - w / 2) + '" y="' + (FLOOR - h) + '" width="' + w + '" height="8" rx="3" fill="#a5513b"/><rect x="' + (x - w / 2 + 6) + '" y="' + (FLOOR - h + 8) + '" width="6" height="' + (h - 8) + '" fill="#7a3a2a"/><rect x="' + (x + w / 2 - 12) + '" y="' + (FLOOR - h + 8) + '" width="6" height="' + (h - 8) + '" fill="#7a3a2a"/></g>'; }
        case 'bottle': { const hd = j.arms[pr.hand || 0], c = hd.tip || hd.end; if (pr.follow) { const m0 = hd.mid || hd.end; pr = Object.assign({}, pr, { rot: Math.atan2(c[1] - m0[1], c[0] - m0[0]) * 180 / Math.PI }); } return '<g transform="rotate(' + (pr.rot || 0) + ' ' + f1(c[0]) + ' ' + f1(c[1]) + ')"><rect x="' + f1(c[0] - 4) + '" y="' + f1(c[1] - 13) + '" width="9" height="24" rx="4" fill="#6cc3ff" opacity=".9"/><rect x="' + f1(c[0] - 2) + '" y="' + f1(c[1] - 17) + '" width="5" height="5" rx="2" fill="#bde4ff"/></g>'; }
        case 'towel': { const a = j.arms[0].end, b = j.arms[1].end; return '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="#ffd45e" stroke-width="5" stroke-linecap="round"/>'; }
        default: return '';
      }
    }).join('');
  }

  function drawSide(p, muscles, props, phase) {
    const j = resolveSide(p);
    const front = rot(j.tdir, 90 * j.face);
    // torse
    const sp = (t, o) => add(add(j.hip, j.tdir, L.torso * t), front, o);
    const pts = [sp(0, 11), sp(0.34, 10), sp(0.78, 16), sp(1, 9), sp(1, -9), sp(0.78, -13), sp(0.34, -10), sp(0, -11)];
    const torso = '<path d="' + smoothClosed(pts) + '" fill="' + C.skin + '"/>';
    const shortsPts = [sp(0.02, 13), sp(0.2, 12), sp(0.2, -12), sp(0.02, -13), add(j.hip, front, 0)];
    const shorts = '<path d="' + smoothClosed([sp(-0.14, 12), sp(0.22, 12), sp(0.22, -12), sp(-0.14, -12)]) + '" fill="' + C.shorts + '"/>';
    const neckSvg = seg(j.neck, add(j.neck, j.hdir, 10), 11, C.skin);
    const fd = rot(j.hdir, 90 * j.face);
    const hc = j.head;
    const headSvg = circ(hc, 14.5, C.hair) + circ(add(hc, fd, 3.2), 12.2, C.skin) + circ(add(add(hc, fd, 8.5), j.hdir, 1), 1.7, C.hair) +
      poly([add(add(hc, fd, 12), j.hdir, 0), add(add(hc, fd, 16), j.hdir, -3), add(add(hc, fd, 11), j.hdir, -4)], C.skin);
    const legSvg = (i, col, shoeCol, w1, w2) => {
      const lg = j.legs[i], ank = lg.end;
      return seg(j.hip, lg.mid, w1, col) + seg(lg.mid, ank, w2, col) + circ(lg.mid, w2 / 2 + 1, col) + shoe(ank, j.fa[i], shoeCol, C.shoe2);
    };
    const armSvg = (i, col) => {
      const a = j.arms[i];
      return seg(j.sh, a.mid, 13, col) + seg(a.mid, a.end, 11, col) + circ(a.mid, 6, col) + (a.tip ? seg(a.end, a.tip, 9, col) + circ(a.tip, 4.8, col) : circ(a.end, 5.6, col));
    };
    const spots = muscleSpots(j);
    const thighCover = (i) => { const lg = j.legs[i]; const e = [j.hip[0] + (lg.mid[0] - j.hip[0]) * 0.46, j.hip[1] + (lg.mid[1] - j.hip[1]) * 0.46]; return seg(j.hip, e, i ? 18 : 21, i ? C.shorts2 : C.shorts); };
    let out = armSvg(1, C.skin2) + legSvg(1, C.skin2, '#d8caca', 18, 13) + thighCover(1) + torso + shorts + legSvg(0, C.skin, C.shoe, 19, 14) + thighCover(0) + neckSvg + headSvg + armSvg(0, C.skin);
    out += spotsSvg(spots, muscles, phase);
    return { svg: propsSvg(props, j, false) ? propsSvg(props.filter((q) => q.k === 'mat' || q.k === 'chair' || q.k === 'wall' || q.k === 'step' || q.k === 'table' || q.k === 'bar'), j) + out + propsSvg(props.filter((q) => !(q.k === 'mat' || q.k === 'chair' || q.k === 'wall' || q.k === 'step' || q.k === 'table' || q.k === 'bar')), j) : out, j };
  }

  function drawFront(p, muscles, props, phase) {
    const j = resolveFront(p);
    const sp = (t, dx) => add(add(j.hip, j.tdir, L.torso * t), j.perp, dx);
    const torsoPts = [sp(0, 12), sp(0.4, 11), sp(0.82, 21), sp(1, 17), sp(1, -17), sp(0.82, -21), sp(0.4, -11), sp(0, -12)];
    const torso = '<path d="' + smoothClosed(torsoPts) + '" fill="' + C.skin + '"/>';
    const shorts = '<path d="' + smoothClosed([sp(-0.05, 15), sp(0.22, 13), sp(0.22, -13), sp(-0.05, -15), sp(-0.12, 0)]) + '" fill="' + C.shorts + '"/>';
    const hc = j.head;
    const headSvg = seg(j.neck, hc, 12, C.skin) + circ(hc, 14, C.skin) + '<path d="M' + f1(hc[0] - 14.5) + ' ' + f1(hc[1] - 2) + ' A14.5 14.5 0 0 1 ' + f1(hc[0] + 14.5) + ' ' + f1(hc[1] - 2) + ' Q' + f1(hc[0]) + ' ' + f1(hc[1] - 12) + ' ' + f1(hc[0] - 14.5) + ' ' + f1(hc[1] - 2) + 'Z" fill="' + C.hair + '"/>' + circ([hc[0] - 4.8, hc[1] + 1], 1.5, C.hair) + circ([hc[0] + 4.8, hc[1] + 1], 1.5, C.hair);
    const legSvg = (i) => { const lg = j.legs[i], hp = j.hipPts[i]; return seg(hp, lg.mid, 18, C.skin) + seg(lg.mid, lg.end, 13, C.skin) + circ(lg.mid, 7, C.skin) + '<ellipse cx="' + f1(lg.end[0]) + '" cy="' + f1(lg.end[1] + 5) + '" rx="10" ry="5.5" fill="' + C.shoe + '"/>'; };
    const armSvg = (i) => { const a = j.arms[i], s = j.shPts[i]; return seg(s, a.mid, 13, C.skin) + seg(a.mid, a.end, 11, C.skin) + circ(a.mid, 6, C.skin) + circ(a.end, 5.6, C.skin) + circ(s, 8.5, C.skin); };
    const cover = (i) => { const lg = j.legs[i], hp = j.hipPts[i]; return seg(hp, [hp[0] + (lg.mid[0] - hp[0]) * 0.5, hp[1] + (lg.mid[1] - hp[1]) * 0.5], 20, C.shorts); };
    const out = legSvg(0) + legSvg(1) + torso + shorts + cover(0) + cover(1) + headSvg + armSvg(0) + armSvg(1) + spotsSvg(muscleSpotsFront(j), muscles, phase);
    return { svg: propsSvg(props, j, true) + out, j };
  }

  /* ---------- API publique ---------- */
  const DEFS = '<defs><radialGradient id="nvGlow"><stop offset="0" stop-color="#ff5a3d" stop-opacity="1"/><stop offset=".6" stop-color="#ff3b57" stop-opacity=".55"/><stop offset="1" stop-color="#ff3b57" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="nvFloor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e0455f" stop-opacity="0"/><stop offset=".5" stop-color="#e0455f" stop-opacity=".9"/><stop offset="1" stop-color="#e0455f" stop-opacity="0"/></linearGradient></defs>';

  function frameSvg(ex, pose, phase) {
    const a = ex.anim;
    const res = (a.view === 'front' ? drawFront : drawSide)(pose, ex.muscles, a.props, phase || 0);
    // ombre douce sous le personnage
    const j = res.j, xs = [j.hip[0], j.head[0], j.neck[0]];
    j.legs.forEach((l) => xs.push(l.end[0])); j.arms.forEach((q) => xs.push(q.end[0]));
    const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    const low = Math.max(j.hip[1], j.legs[0].end[1], j.legs[1].end[1]);
    const op = Math.max(0.12, 0.42 - Math.max(0, (FLOOR - low) - 20) / 240);
    const shadow = '<ellipse cx="' + f1((x0 + x1) / 2) + '" cy="' + (FLOOR + 3) + '" rx="' + f1(Math.max(26, (x1 - x0) / 2 + 12)) + '" ry="5" fill="#000" opacity="' + f1(op) + '"/>';
    return { svg: shadow + res.svg, j: res.j };
  }

  /* Pose à un instant t (secondes) — fonction pure, utilisée aussi par les tests. */
  function poseAt(ex, t) {
    const a = ex.anim, fr = a.frames, n = fr.length;
    if (n === 1) return fr[0].p;
    const durs = fr.map((f, i) => (i < n - 1 || a.loop === 'cycle' ? f.d : 0));
    const order = [];
    if (a.loop === 'cycle') { for (let i = 0; i < n; i++) order.push([i, (i + 1) % n, fr[i].d || 600]); }
    else { for (let i = 0; i < n - 1; i++) order.push([i, i + 1, fr[i].d || 600]); for (let i = n - 1; i > 0; i--) order.push([i, i - 1, fr[i].d || 600]); }
    const hold = a.hold || 0;
    const total = order.reduce((s, o) => s + o[2] + hold, 0);
    let ms = ((t * 1000) % total + total) % total;
    for (const o of order) {
      if (ms < o[2]) return lerp(fr[o[0]].p, fr[o[1]].p, ease(ms / o[2]));
      ms -= o[2];
      if (ms < hold) return fr[o[1]].p;
      ms -= hold;
    }
    return fr[0].p;
  }
  function period(ex) {
    const a = ex.anim, fr = a.frames, n = fr.length;
    if (n === 1) return 1;
    const hold = a.hold || 0;
    if (a.loop === 'cycle') return fr.reduce((s, f) => s + (f.d || 600) + hold, 0) / 1000;
    let s = 0; for (let i = 0; i < n - 1; i++) s += (fr[i].d || 600) + hold; for (let i = n - 1; i > 0; i--) s += (fr[i].d || 600) + hold;
    return s / 1000;
  }

  function stageSvg(inner, opts) {
    const bg = (opts && opts.bg === false) ? '' : '<rect y="' + VBY + '" width="' + W + '" height="' + H + '" fill="none"/>';
    const floor = (opts && opts.floor === false) ? '' : '<rect x="0" y="' + (FLOOR + 5) + '" width="' + W + '" height="2" fill="url(#nvFloor)"/>';
    return '<svg viewBox="0 ' + VBY + ' ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + ((opts && opts.label) || 'Illustration de l\'exercice') + '" style="display:block;width:100%;height:100%">' + DEFS + bg + floor + inner + '</svg>';
  }

  /* Monte une figure animée dans un élément ; renvoie un contrôleur. */
  function mount(el, ex, opts) {
    opts = opts || {};
    el.innerHTML = stageSvg('<g id="nvF"></g>', { label: opts.label || ex.name });
    const gEl = el.querySelector('#nvF'); gEl.removeAttribute('id');
    let raf = 0, t0 = 0, playing = false, alive = true, speed = opts.speed || 1;
    const per = period(ex);
    function draw(t) { const ps = poseAt(ex, t); gEl.innerHTML = frameSvg(ex, ps, (t / per) % 1).svg; }
    function tick(ts) {
      if (!alive || !playing) return;
      if (!t0) t0 = ts;
      draw(((ts - t0) / 1000) * speed + (opts.offset || 0));
      raf = g.requestAnimationFrame(tick);
    }
    draw(opts.startAt == null ? 0 : opts.startAt);
    const ctl = {
      play() { if (playing || !alive || (NEV.util && NEV.util.reduced())) return; playing = true; t0 = 0; raf = g.requestAnimationFrame(tick); },
      pause() { playing = false; g.cancelAnimationFrame(raf); },
      still(t) { ctl.pause(); draw(t == null ? 0 : t); },
      setSpeed(s) { speed = s; },
      destroy() { alive = false; ctl.pause(); el.innerHTML = ''; },
      period: per
    };
    if (opts.autoplay !== false) {
      // ne joue que lorsque la figure est visible à l'écran
      if ('IntersectionObserver' in g) {
        const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? ctl.play() : ctl.pause())), { threshold: 0.1 });
        io.observe(el); const d = ctl.destroy; ctl.destroy = function () { io.disconnect(); d(); };
      } else ctl.play();
    }
    return ctl;
  }

  /* Contrôle qualité : renvoie les jambes/bras trop tendus pour atteindre leur cible. */
  function audit(ex) {
    const issues = [];
    ex.anim.frames.forEach((f, i) => {
      const j = (ex.anim.view === 'front' ? resolveFront : resolveSide)(f.p);
      j.legs.forEach((l, k) => { if (l.over > 3) issues.push('image ' + i + ' jambe ' + k + ' trop courte de ' + f1(l.over)); });
      j.arms.forEach((a, k) => { if (a.over > 3) issues.push('image ' + i + ' bras ' + k + ' trop court de ' + f1(a.over)); });
    });
    return issues;
  }

  NEV.Figure = { mount, poseAt, period, frameSvg, stageSvg, audit, L, W, H, FLOOR, ANK, resolveSide, resolveFront, lerp };
})(window);
