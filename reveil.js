/* ============================================================
   neV.BOOSTER — « Le réveil »
   Animation en SVG + JavaScript pur (aucune dépendance).
   - Le temps est piloté par une seule fonction : draw(t).
     Résultat : lecture fluide sur le site, ET rendu vidéo image par image.
   - Utilisation sur le site :
       <div data-reveil data-autoplay="true" data-loop="true"></div>
       <link rel="stylesheet" href="reveil.css">
       <script src="reveil.js"></script>
   ============================================================ */
(function (global) {
  'use strict';

  const W = 1280, H = 720, DURATION = 70.2, FADE = 0.5;
  const FONT = "'Montserrat','Poppins','Segoe UI',system-ui,sans-serif";
  const C = { bg: '#0f0507', violet: '#ed3a5e', v2: '#fa8ba4', lav: '#fdb5c6', white: '#fff3f6', hair: '#1a0c0f' };

  /* ---------- Chronologie des 6 scènes ---------- */
  const SCENES = [
    { name: 'LE RÉVEIL',            a: 0,    b: 6 },
    { name: 'LA VEILLE',            a: 6,    b: 15.5 },
    { name: 'LE MIROIR',            a: 15.5, b: 23.5 },
    { name: 'LA BOÎTE DE CARTES',   a: 23.5, b: 32 },
    { name: "L'ENTRAÎNEMENT",       a: 32,   b: 45.3 },
    { name: 'LA PROGRESSION',       a: 45.3, b: 52.5 },
    { name: 'LE RÉSULTAT',          a: 52.5, b: 56.5 },
    { name: 'LA RÉFÉRENCE',         a: 56.5, b: 66.5 },
    { name: 'LE FINAL',             a: 66.5, b: 70.2 }
  ];
  /* Décalages : les scènes d'origine gardent leur propre chronologie interne (t - décalage) */
  const SH = t => t < 6 ? t : (t < 47 ? t + 9.5 : t + 20.2);

  /* Les 4 cartes tirées (modifiable facilement) */
  const EX = [
    { name: 'SQUATS',  reps: 7, start: 23.2, end: 26.4, rar: 'RARE' },
    { name: 'POMPES',  reps: 5, start: 26.6, end: 29.4, rar: 'ÉPIQUE' },
    { name: 'ABDOS',   reps: 7, start: 29.6, end: 32.4, rar: 'COMMUN' },
    { name: 'ÉPAULES', reps: 6, start: 32.6, end: 35.4, rar: 'RARE' }
  ];
  const RAR = {
    'COMMUN': { c: '#d68fa0', g: 0 },
    'RARE':   { c: '#fa8ba4', g: 1 },
    'ÉPIQUE': { c: '#fff3f6', g: 2 }
  };

  const CAP0 = [
    { a: 0.4,  b: 3.0,  s: 'Le réveil sonne. Une nouvelle journée commence.' },
    { a: 3.2,  b: 5.9,  s: 'Un jeune homme très mince se lève…' },
    { a: 6.6,  b: 10.3, s: 'Il se regarde dans le miroir et constate son corps.' },
    { a: 10.8, b: 13.8, s: 'Ça suffit. Aujourd’hui, il change.' },
    { a: 14.8, b: 19.4, s: 'Chaque matin, la boîte tire ses cartes au hasard.' },
    { a: 19.6, b: 22.4, s: 'Le gacha décide de l’entraînement du jour.' },
    { a: 23.3, b: 35.3, s: 'Chaque carte, un exercice : squats, pompes, abdos, épaules…' },
    { a: 36.2, b: 42.6, s: 'Jour après jour, la régularité fait le travail.' },
    { a: 43.3, b: 46.0, s: '90 jours plus tard, la transformation est visible.' }
  ];
  const CAPTIONS = CAP0.map(c => ({ a: SH(c.a), b: SH(c.b), s: c.s })).concat([
    { a: 6.5,  b: 9.6,  s: 'La veille, il croise des filles… mais personne ne le remarque.' },
    { a: 9.9,  b: 12.9, s: 'Sans muscles, il n’est pas validé. Les regards passent à côté de lui.' },
    { a: 13.1, b: 15.3, s: 'Ce soir-là, il se promet de changer.' },
    { a: 57.0, b: 60.0, s: 'Les regards se tournent enfin vers lui.' },
    { a: 60.3, b: 63.5, s: 'Beau, confiant… tout le monde veut savoir comment il a fait.' },
    { a: 63.8, b: 66.3, s: 'Il est devenu la référence.' }
  ]);

  /* ---------- Caméra adaptative ----------
     Sur un écran large, on voit toute la scène. Sur un écran plus haut que large (téléphone en portrait,
     tablette), la « caméra » zoome sur ce qui compte et suit l'action : [instant, centre x, largeur visible]. */
  const CAM = [
    [[0, 560, 900], [6, 560, 900]],
    [[6, 330, 760], [9.4, 500, 900], [11, 660, 1000], [15.5, 660, 1000]],
    [[15.5, 620, 900], [23.5, 620, 900]],
    [[23.5, 640, 1100], [32, 640, 1100]],
    [[32, 640, 1000], [45.3, 640, 1000]],
    [[45.3, 700, 1000], [52.5, 700, 1000]],
    [[52.5, 650, 900], [56.5, 650, 900]],
    [[56.5, 640, 800], [60, 640, 1180], [66.5, 640, 1180]],
    [[66.5, 640, 900], [70.2, 640, 900]]
  ];
  function camOf(i, t) {
    const k = CAM[i]; if (t <= k[0][0]) return [k[0][1], k[0][2]];
    for (let j = 1; j < k.length; j++) if (t <= k[j][0]) { const u = seg(t, k[j - 1][0], k[j][0]), e = u * u * (3 - 2 * u); return [k[j - 1][1] + (k[j][1] - k[j - 1][1]) * e, k[j - 1][2] + (k[j][2] - k[j - 1][2]) * e]; }
    const l = k[k.length - 1]; return [l[1], l[2]];
  }
  function camera(t) {
    let i = SCENES.findIndex(sc => t < sc.b); if (i < 0) i = SCENES.length - 1;
    let c = camOf(i, t);
    if (i > 0) { const m = seg(t, SCENES[i].a - .15, SCENES[i].a + FADE + .35), p = camOf(i - 1, t), e = m * m * (3 - 2 * m); c = [p[0] + (c[0] - p[0]) * e, p[1] + (c[1] - p[1]) * e]; }
    return c;
  }
  /* Fenêtre visible (viewBox) pour un écran de proportion asp = largeur / hauteur */
  function windowFor(t, asp) {
    const full = [0, 0, W, H];
    if (!asp || asp >= W / H - 0.01) return full;
    const c = camera(t); let w = c[1], h = H;
    const fullH = H * asp;                       // largeur visible quand toute la hauteur de la scène est affichée
    if (fullH >= w) w = fullH; else h = w / asp; // écran trop étroit : on garde la largeur utile, la scène flotte dans le noir
    let x = c[0] - w / 2; x = w <= W ? Math.max(0, Math.min(W - w, x)) : (W - w) / 2;
    const y = h > H ? H / 2 - h * (asp < 1.1 ? 0.46 : 0.5) : 0;
    return [x, y, w, h];
  }

  /* ---------- Petits outils ---------- */
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const eo = t => 1 - Math.pow(1 - t, 3);
  const f = n => Math.round(n * 10) / 10;
  const hex2 = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, k) => { const A = hex2(a), B = hex2(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',') + ')'; };
  const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const lerp2 = (A, B, k) => [lerp(A[0], B[0], k), lerp(A[1], B[1], k)];

  function txt(x, y, s, o) {
    o = o || {};
    return '<text x="' + f(x) + '" y="' + f(y) + '" text-anchor="' + (o.anchor || 'start') + '" font-family="' + (o.family || FONT) +
      '" font-size="' + (o.size || 24) + '" font-weight="' + (o.weight || 700) + '" fill="' + (o.fill || C.white) +
      '" letter-spacing="' + (o.ls || 0) + '" opacity="' + (o.op == null ? 1 : f(o.op)) + '"' + (o.italic ? ' font-style="italic"' : '') + (o.extra || '') + '>' + s + '</text>';
  }
  function star(cx, cy, r, fill, op) {
    const k = r * 0.26;
    const p = [[cx, cy - r], [cx + k, cy - k], [cx + r, cy], [cx + k, cy + k], [cx, cy + r], [cx - k, cy + k], [cx - r, cy], [cx - k, cy - k]];
    return '<polygon points="' + p.map(a => f(a[0]) + ',' + f(a[1])).join(' ') + '" fill="' + fill + '" opacity="' + (op == null ? 1 : f(op)) + '"/>';
  }

  /* ---------- Cinématique inverse à 2 segments (bras / jambes) ---------- */
  function ik(a, b, l1, l2, score) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 0.001;
    const dd = clamp(d, Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
    const ux = dx / d, uy = dy / d;
    const end = [a[0] + ux * dd, a[1] + uy * dd];
    const ang = Math.atan2(uy, ux);
    const A = Math.acos(clamp((l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd), -1, 1));
    const c1 = [a[0] + l1 * Math.cos(ang + A), a[1] + l1 * Math.sin(ang + A)];
    const c2 = [a[0] + l1 * Math.cos(ang - A), a[1] + l1 * Math.sin(ang - A)];
    return { j: score(c1) >= score(c2) ? c1 : c2, e: end };
  }

  /* ============================================================
     PERSONNAGE
     m = 0 (très mince)  →  1 (très musclé) : toutes les épaisseurs,
     les épaules, les bras, les cuisses et les muscles dessinés en dépendent.
     ============================================================ */
  const PAL = { fill: '#a86a44', outline: '#47261a', ow: 2.6 };
  const PAL_MONO = { fill: '#fff3f6', outline: '#ed3a5e', ow: 3.2 };

  function sil(caps, dots, paths, pal) {
    let o = '', s = '';
    caps.forEach(c => {
      const a = 'x1="' + f(c.a[0]) + '" y1="' + f(c.a[1]) + '" x2="' + f(c.b[0]) + '" y2="' + f(c.b[1]) + '"';
      o += '<line ' + a + ' stroke-width="' + f(c.w + pal.ow * 2) + '"/>';
      s += '<line ' + a + ' stroke-width="' + f(c.w) + '"/>';
    });
    dots.forEach(d => {
      o += '<circle cx="' + f(d.c[0]) + '" cy="' + f(d.c[1]) + '" r="' + f(d.r + pal.ow) + '" stroke="none"/>';
      s += '<circle cx="' + f(d.c[0]) + '" cy="' + f(d.c[1]) + '" r="' + f(d.r) + '" stroke="none"/>';
    });
    paths.forEach(p => {
      o += '<path d="' + p + '" stroke-width="' + (pal.ow * 2) + '"/>';
      s += '<path d="' + p + '" stroke="none"/>';
    });
    return '<g fill="' + pal.outline + '" stroke="' + pal.outline + '" stroke-linecap="round" stroke-linejoin="round">' + o + '</g>' +
           '<g fill="' + pal.fill + '" stroke="' + pal.fill + '" stroke-linecap="round" stroke-linejoin="round">' + s + '</g>';
  }
  function dumbbell(h) {
    return '<g><rect x="' + f(h[0] - 13) + '" y="' + f(h[1] - 4) + '" width="26" height="8" rx="3" fill="#5e1a29"/>' +
      '<rect x="' + f(h[0] - 19) + '" y="' + f(h[1] - 10) + '" width="9" height="20" rx="3" fill="#fa8ba4" stroke="#951d34" stroke-width="1.5"/>' +
      '<rect x="' + f(h[0] + 10) + '" y="' + f(h[1] - 10) + '" width="9" height="20" rx="3" fill="#fa8ba4" stroke="#951d34" stroke-width="1.5"/></g>';
  }

  const dimF = m => ({
    sw: 30 + 22 * m, ww: 17 + 8 * m, hw: 20 + 4 * m,
    thigh: 21 + 12 * m, shin: 16 + 9 * m, calf: 2 + 7 * m,
    uarm: 12 + 9 * m, farm: 10 + 6 * m, neck: 12 + 7 * m, delt: 10 + 13 * m, bic: 3 + 8 * m
  });

  function faceFront(hc, o) {
    const nd = (o.nod || 0) * 5, op = o.open == null ? 1 : o.open, mood = o.mood || 0, brow = o.brow || 0;
    const cx = hc[0], cy = hc[1] + nd;
    let s = '<path d="M' + f(cx - 21.5) + ',' + f(hc[1] - 3) + ' A21.5,21.5 0 0 1 ' + f(cx + 21.5) + ',' + f(hc[1] - 3) +
      ' Q' + f(cx + 12) + ',' + f(hc[1] - 15) + ' ' + f(cx) + ',' + f(hc[1] - 11) + ' Q' + f(cx - 12) + ',' + f(hc[1] - 15) + ' ' + f(cx - 21.5) + ',' + f(hc[1] - 3) + ' Z" fill="' + C.hair + '"/>';
    [-1, 1].forEach(e => {
      const ex = cx + e * 8.5, ey = cy + 2;
      if (op < 0.25) s += '<path d="M' + f(ex - 4) + ',' + f(ey) + ' Q' + f(ex) + ',' + f(ey + 3) + ' ' + f(ex + 4) + ',' + f(ey) + '" stroke="#1a0f12" stroke-width="2" fill="none" stroke-linecap="round"/>';
      else s += '<ellipse cx="' + f(ex) + '" cy="' + f(ey) + '" rx="2.8" ry="' + f(3.4 * op) + '" fill="#1a0f12"/>';
      const by = cy - 7, ix = cx + e * 3.5, ox = cx + e * 13;
      s += '<line x1="' + f(ix) + '" y1="' + f(by + brow * 3.2) + '" x2="' + f(ox) + '" y2="' + f(by - brow * 3.2) + '" stroke="' + C.hair + '" stroke-width="2.4" stroke-linecap="round"/>';
    });
    if (o.yawn) s += '<ellipse cx="' + f(cx) + '" cy="' + f(cy + 13) + '" rx="5" ry="' + f(2 + 5 * o.yawn) + '" fill="#3a1520"/>';
    else s += '<path d="M' + f(cx - 6) + ',' + f(cy + 12) + ' Q' + f(cx) + ',' + f(cy + 12 + mood * 6) + ' ' + f(cx + 6) + ',' + f(cy + 12) + '" stroke="#3a1a14" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    if (o.charm) {
      s += '<path d="M' + f(cx - 19) + ',' + f(hc[1] - 8) + ' Q' + f(cx - 8) + ',' + f(hc[1] - 36) + ' ' + f(cx + 20) + ',' + f(hc[1] - 17) + ' Q' + f(cx + 4) + ',' + f(hc[1] - 20) + ' ' + f(cx - 19) + ',' + f(hc[1] - 8) + ' Z" fill="' + C.hair + '"/>';
      [-1, 1].forEach(e => {
        s += '<circle cx="' + f(cx + e * 8.5 + 1) + '" cy="' + f(cy + .8) + '" r="1.1" fill="#fff"/>';
        s += '<ellipse cx="' + f(cx + e * 14.5) + '" cy="' + f(cy + 9) + '" rx="4.2" ry="2.4" fill="#f472b6" opacity=".35"/>';
      });
      s += '<path d="M' + f(cx - 8) + ',' + f(cy + 10.5) + ' Q' + f(cx) + ',' + f(cy + 21) + ' ' + f(cx + 8) + ',' + f(cy + 10.5) + ' Z" fill="#fff" stroke="#3a1a14" stroke-width="1.8" stroke-linejoin="round"/>';
    }
    return s;
  }

  /* Personnage de face. Retourne { svg, head } (coordonnées locales, sol = y 0). */
  function frontFigure(o) {
    const m = o.m || 0, d = dimF(m), pal = o.mono ? PAL_MONO : PAL;
    const crouch = o.crouch || 0, dy = crouch * 45 + (o.bob || 0);
    const hipY = -160 + crouch * 45, shY = -246 + dy;
    const ankX = 34 + crouch * 10, L = lerp(75, 62, crouch);
    const caps = [], dots = [], paths = [], legs = [];

    [-1, 1].forEach(s => {
      const hip = [s * d.hw * 0.8, hipY], ank = [s * ankX, -10];
      const r = ik(hip, ank, L, L, k => s * k[0]);
      caps.push({ a: hip, b: r.j, w: d.thigh }, { a: r.j, b: r.e, w: d.shin });
      dots.push({ c: lerp2(r.j, r.e, 0.32), r: d.shin / 2 + d.calf });
      legs.push({ s: s, hip: hip, k: r.j, a: r.e });
    });
    const midY = (shY + hipY) / 2;
    paths.push('M' + f(-d.sw) + ',' + f(shY + 8) + ' Q0,' + f(shY - 10) + ' ' + f(d.sw) + ',' + f(shY + 8) +
      ' Q' + f(d.ww + 8) + ',' + f(midY) + ' ' + f(d.hw + 4) + ',' + f(hipY + 6) + ' L' + f(-d.hw - 4) + ',' + f(hipY + 6) +
      ' Q' + f(-d.ww - 8) + ',' + f(midY) + ' ' + f(-d.sw) + ',' + f(shY + 8) + ' Z');
    caps.push({ a: [0, shY - 4], b: [0, shY - 24], w: d.neck });
    const hc = [0, shY - 38 + (o.nod || 0) * 2];
    dots.push({ c: hc, r: 21 });
    let svg = sil(caps, dots, paths, pal);

    /* détails du torse : côtes (mince) → pectoraux / abdos (musclé) */
    if (!o.mono) {
      const ribs = clamp(1 - m * 3) * 0.55, pec = clamp(m * 1.5 - 0.15), abs = clamp(m * 1.6 - 0.3);
      const ln = '#5e3320';
      if (ribs > 0.02) {
        for (let i = 0; i < 4; i++) {
          const y = shY + 28 + i * 9;
          svg += '<path d="M' + f(-d.sw * 0.55) + ',' + f(y) + ' Q' + f(-d.sw * 0.3) + ',' + f(y + 5) + ' ' + f(-4) + ',' + f(y + 1) + '" stroke="' + ln + '" stroke-width="1.6" fill="none" opacity="' + f(ribs) + '"/>';
          svg += '<path d="M' + f(d.sw * 0.55) + ',' + f(y) + ' Q' + f(d.sw * 0.3) + ',' + f(y + 5) + ' ' + f(4) + ',' + f(y + 1) + '" stroke="' + ln + '" stroke-width="1.6" fill="none" opacity="' + f(ribs) + '"/>';
        }
        svg += '<path d="M' + f(-d.sw * 0.7) + ',' + f(shY + 12) + ' Q' + f(-d.sw * 0.3) + ',' + f(shY + 6) + ' ' + f(-4) + ',' + f(shY + 10) + ' M' + f(d.sw * 0.7) + ',' + f(shY + 12) + ' Q' + f(d.sw * 0.3) + ',' + f(shY + 6) + ' ' + f(4) + ',' + f(shY + 10) + '" stroke="' + ln + '" stroke-width="1.6" fill="none" opacity="' + f(ribs) + '"/>';
      }
      if (pec > 0.02) {
        svg += '<path d="M' + f(-d.sw * 0.85) + ',' + f(shY + 24) + ' Q' + f(-d.sw * 0.4) + ',' + f(shY + 46) + ' ' + f(-2) + ',' + f(shY + 32) + ' M' + f(d.sw * 0.85) + ',' + f(shY + 24) + ' Q' + f(d.sw * 0.4) + ',' + f(shY + 46) + ' ' + f(2) + ',' + f(shY + 32) +
          '" stroke="' + ln + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="' + f(pec) + '"/>';
        svg += '<path d="M0,' + f(shY + 18) + ' L0,' + f(shY + 34) + '" stroke="' + ln + '" stroke-width="2" opacity="' + f(pec) + '"/>';
      }
      if (abs > 0.02) {
        svg += '<path d="M0,' + f(shY + 40) + ' L0,' + f(hipY - 8) + '" stroke="' + ln + '" stroke-width="2" opacity="' + f(abs) + '"/>';
        for (let i = 0; i < 3; i++) {
          const y = shY + 54 + i * 17;
          svg += '<path d="M' + f(-d.ww * 0.6) + ',' + f(y) + ' Q0,' + f(y + 4) + ' ' + f(d.ww * 0.6) + ',' + f(y) + '" stroke="' + ln + '" stroke-width="2" fill="none" opacity="' + f(abs) + '"/>';
        }
      }
      /* short violet */
      legs.forEach(l => {
        svg += '<line x1="' + f(l.hip[0]) + '" y1="' + f(l.hip[1]) + '" x2="' + f(lerp(l.hip[0], l.k[0], .55)) + '" y2="' + f(lerp(l.hip[1], l.k[1], .55)) +
          '" stroke="#d9284b" stroke-width="' + f(d.thigh + 8) + '" stroke-linecap="round"/>';
      });
      svg += '<line x1="' + f(-d.hw - 3) + '" y1="' + f(hipY - 6) + '" x2="' + f(d.hw + 3) + '" y2="' + f(hipY - 6) + '" stroke="#fdb5c6" stroke-width="9" stroke-linecap="round"/>';
      /* chaussures */
      legs.forEach(l => {
        svg += '<ellipse cx="' + f(l.a[0] + l.s * 6) + '" cy="' + f(l.a[1] + 4) + '" rx="14" ry="7" fill="#fff3f6" stroke="#ed3a5e" stroke-width="2"/>';
      });
      svg += faceFront(hc, o);
    }

    /* bras (dessinés par-dessus le torse) */
    const acaps = [], adots = [], hands = [];
    [-1, 1].forEach(s => {
      const sh = [s * d.sw * 0.9, shY + 10];
      let tgt = [sh[0] + s * 10, sh[1] + 104];
      if (o.raise != null) { const a = o.raise * Math.PI / 180; tgt = [sh[0] + s * 104 * Math.sin(a), sh[1] + 104 * Math.cos(a)]; }
      if (o.flex) tgt = lerp2(tgt, [s * (d.sw + 64), sh[1] - 52], o.flex);
      if (o.hands) { const h = o.hands(s, sh, d); if (h) tgt = h; }
      const r = ik(sh, tgt, 55, 55, k => s * k[0]);
      acaps.push({ a: sh, b: r.j, w: d.uarm }, { a: r.j, b: r.e, w: d.farm });
      adots.push({ c: sh, r: d.delt }, { c: lerp2(sh, r.j, .5), r: d.uarm / 2 + d.bic }, { c: r.e, r: d.farm / 2 + 3.5 });
      hands.push(r.e);
    });
    svg += sil(acaps, adots, [], pal);
    if (o.weights) hands.forEach(h => { svg += dumbbell(h); });
    return { svg: svg, head: hc };
  }

  /* ---------- Personnage de profil ---------- */
  const dimS = m => ({
    torso: 26 + 16 * m, thigh: 20 + 11 * m, shin: 15 + 8 * m, calf: 2 + 7 * m,
    neck: 12 + 6 * m, uarm: 11 + 9 * m, farm: 9 + 5 * m, delt: 9 + 11 * m, bic: 3 + 8 * m
  });

  function sideFigure(P, m, o) {
    o = o || {};
    const d = dimS(m), pal = o.mono ? PAL_MONO : PAL;
    const caps = [{ a: P.S, b: P.P, w: d.torso }, { a: P.P, b: P.K, w: d.thigh }, { a: P.K, b: P.A, w: d.shin }, { a: P.S, b: P.head, w: d.neck }];
    const dots = [{ c: P.head, r: 21 }, { c: lerp2(P.K, P.A, .3), r: d.shin / 2 + d.calf }, { c: lerp2(P.S, P.P, .16), r: d.torso / 2 + m * 4 }];
    let svg = sil(caps, dots, [], pal);
    if (!o.mono) {
      svg += '<line x1="' + f(P.P[0]) + '" y1="' + f(P.P[1]) + '" x2="' + f(lerp(P.P[0], P.K[0], .55)) + '" y2="' + f(lerp(P.P[1], P.K[1], .55)) + '" stroke="#d9284b" stroke-width="' + f(d.thigh + 5) + '" stroke-linecap="round"/>';
      svg += '<line x1="' + f(P.P[0]) + '" y1="' + f(P.P[1]) + '" x2="' + f(lerp(P.P[0], P.S[0], .09)) + '" y2="' + f(lerp(P.P[1], P.S[1], .09)) + '" stroke="#d9284b" stroke-width="' + f(d.torso + 3) + '" stroke-linecap="round"/>';
      svg += '<ellipse cx="' + f(P.A[0] + (o.toe ? 3 : 8)) + '" cy="' + f(P.A[1] + 3) + '" rx="' + (o.toe ? 11 : 14) + '" ry="6.5" fill="#fff3f6" stroke="#ed3a5e" stroke-width="2"/>';
      /* tête : cheveux derrière, visage devant */
      const fx = P.face[0], fy = P.face[1], u = P.u, h = P.head;
      svg += '<circle cx="' + f(h[0]) + '" cy="' + f(h[1]) + '" r="21.6" fill="' + C.hair + '"/>';
      svg += '<circle cx="' + f(h[0] + fx * 3.2) + '" cy="' + f(h[1] + fy * 3.2) + '" r="19.6" fill="' + pal.fill + '"/>';
      const ex = h[0] + fx * 10 + u[0] * 2, ey = h[1] + fy * 10 + u[1] * 2;
      const op = o.open == null ? 1 : o.open;
      if (op < 0.25) svg += '<path d="M' + f(ex - 4) + ',' + f(ey) + ' Q' + f(ex) + ',' + f(ey + 3.2) + ' ' + f(ex + 4) + ',' + f(ey) + '" stroke="#1a0f12" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
      else svg += '<ellipse cx="' + f(ex) + '" cy="' + f(ey) + '" rx="2.8" ry="' + f(3.2 * op) + '" fill="#1a0f12"/>';
      const mx = h[0] + fx * 11 - u[0] * 8, my = h[1] + fy * 11 - u[1] * 8;
      if (o.yawn) svg += '<ellipse cx="' + f(mx) + '" cy="' + f(my) + '" rx="' + f(3 + 2 * o.yawn) + '" ry="' + f(2 + 4 * o.yawn) + '" fill="#3a1520"/>';
      else svg += '<line x1="' + f(mx - fx * 3) + '" y1="' + f(my - fy * 3) + '" x2="' + f(mx + fx * 3) + '" y2="' + f(my + fy * 3) + '" stroke="#3a1a14" stroke-width="2" stroke-linecap="round"/>';
    }
    const acaps = [{ a: P.S, b: P.E, w: d.uarm }, { a: P.E, b: P.Hd, w: d.farm }];
    const adots = [{ c: P.S, r: d.delt }, { c: lerp2(P.S, P.E, .5), r: d.uarm / 2 + d.bic }, { c: P.Hd, r: d.farm / 2 + 3.5 }];
    svg += sil(acaps, adots, [], pal);
    return svg;
  }

  function pushupPts(p) {
    const A = [-135, -10], hand = [70, -10], Lb = 215;
    const sy = lerp(-104, -44, p);
    const sx = A[0] + Math.sqrt(Lb * Lb - (sy - A[1]) * (sy - A[1]));
    const S = [sx, sy], P = lerp2(A, S, .52), K = lerp2(A, S, .26);
    const r = ik(S, hand, 50, 50, k => -k[0]);
    const u = [(S[0] - A[0]) / Lb, (S[1] - A[1]) / Lb];
    return { S: S, P: P, K: K, A: A, E: r.j, Hd: r.e, head: [S[0] + u[0] * 28, S[1] + u[1] * 28 - 4], u: u, face: [.92, .38] };
  }

  function armTarget(mode, S, P, head, face) {
    if (mode === 'head') return { t: [head[0] - face[0] * 10, head[1] - face[1] * 10], sc: k => -k[1] };
    if (mode === 'up') return { t: [S[0] + 75, S[1] - 65], sc: k => k[0] };
    return { t: lerp2(S, P, .8), sc: k => -k[1] };          /* rest */
  }
  /* phi : 0 = allongé, π/2 = assis. arms = [modeA, modeB, mélange] */
  function crunchPts(phi, arms) {
    const P = [0, -15], Lt = 105;
    const u = [-Math.cos(phi), -Math.sin(phi)];
    const S = [P[0] + u[0] * Lt, P[1] + u[1] * Lt];
    const kr = ik(P, [88, -8], 62, 62, k => -k[1]);
    const head = [S[0] + u[0] * 28, S[1] + u[1] * 28];
    const face = [Math.sin(phi), -Math.cos(phi)];
    arms = arms || ['rest', 'rest', 0];
    const A1 = armTarget(arms[0], S, P, head, face), B1 = armTarget(arms[1], S, P, head, face);
    const k = arms[2] || 0;
    const r = ik(S, lerp2(A1.t, B1.t, k), 50, 50, k > .5 ? B1.sc : A1.sc);
    return { S: S, P: P, K: kr.j, A: kr.e, E: r.j, Hd: r.e, head: head, u: u, face: face };
  }

  const G = (x, y, s, inner, flip) => '<g transform="translate(' + f(x) + ',' + f(y) + ') scale(' + f(flip ? -s : s) + ',' + f(s) + ')">' + inner + '</g>';

  /* ============================================================
     SCÈNE 1 — LE RÉVEIL
     ============================================================ */
  function scene1(t) {
    const dawn = seg(t, 0, 5.5);
    let s = '<rect width="1280" height="720" fill="' + mix('#120508', '#601223', dawn) + '"/>';
    /* fenêtre */
    s += '<defs><linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + mix('#2e0a14', '#e85677', dawn) + '"/><stop offset="1" stop-color="' + mix('#3d101b', '#ffb38a', dawn) + '"/></linearGradient>' +
      '<clipPath id="win1"><rect x="830" y="110" width="290" height="300" rx="8"/></clipPath></defs>';
    s += '<rect x="830" y="110" width="290" height="300" rx="8" fill="url(#sky1)"/><g clip-path="url(#win1)">';
    for (let i = 0; i < 16; i++) s += '<circle cx="' + f(840 + rnd(i) * 270) + '" cy="' + f(120 + rnd(i + 40) * 160) + '" r="' + f(1 + rnd(i + 9) * 1.4) + '" fill="#fff" opacity="' + f(clamp(1 - dawn * 1.5) * (.5 + .5 * Math.sin(t * 3 + i))) + '"/>';
    const sunY = lerp(450, 318, ease(dawn));
    s += '<circle cx="975" cy="' + f(sunY) + '" r="120" fill="#ffb38a" opacity="' + f(.28 * dawn) + '"/><circle cx="975" cy="' + f(sunY) + '" r="46" fill="#ffe2bd"/>';
    s += '<path d="M830,410 V345 h30 v-32 h26 v50 h30 v-72 h28 v62 h40 v-42 h24 v52 h34 v-26 h28 v62 z" fill="#280a11"/></g>';
    s += '<rect x="830" y="110" width="290" height="300" rx="8" fill="none" stroke="#fdb5c6" stroke-width="7"/><path d="M975,110 V410 M830,260 H1120" stroke="#fdb5c6" stroke-width="4"/>';
    /* rayon de lumière */
    s += '<polygon points="830,410 1120,410 840,640 330,640" fill="#ffd9a8" opacity="' + f(dawn * .13) + '"/>';
    /* sol + lit */
    s += '<rect x="0" y="600" width="1280" height="120" fill="#16070a"/>';
    s += '<rect x="100" y="410" width="52" height="195" rx="10" fill="#8a1d35"/><rect x="110" y="548" width="720" height="54" rx="10" fill="#661426"/><rect x="128" y="596" width="22" height="30" fill="#4d0e1c"/><rect x="790" y="596" width="22" height="30" fill="#4d0e1c"/>';
    s += '<rect x="150" y="498" width="660" height="56" rx="14" fill="#ffd2dc"/><ellipse cx="292" cy="488" rx="78" ry="24" fill="#fff3f6"/>';
    /* personnage allongé puis assis */
    const phi = ease(seg(t, 3.2, 4.3)) * Math.PI / 2 * .98;
    const arms = ['rest', 'up', ease(seg(t, 4.3, 5.0))];
    const pts = crunchPts(phi, arms);
    s += G(470, 508, 1.2, sideFigure(pts, 0, { open: ease(seg(t, 2.8, 3.3)), yawn: Math.sin(Math.PI * seg(t, 4.3, 5.3)) }));
    /* couverture */
    s += '<path d="M436,540 C436,470 470,456 500,446 Q534,418 566,442 Q602,458 646,472 L812,488 L812,545 L436,545 Z" fill="#d9284b" stroke="#951d34" stroke-width="3"/>' +
         '<path d="M470,500 Q560,470 650,500 M470,520 Q580,490 700,520" fill="none" stroke="#f65c7d" stroke-width="3" opacity=".7"/>';
    /* Zzz */
    if (t < 3.2) for (let i = 0; i < 3; i++) {
      const ph = (t * 0.55 + i * .34) % 1;
      s += txt(330 + ph * 46 + i * 12, 430 - ph * 120, 'Z', { size: 20 + ph * 20, fill: '#fdb5c6', op: Math.sin(Math.PI * ph) * .85 * (1 - seg(t, 2.7, 3.2)), italic: true });
    }
    /* table de nuit + réveil */
    const ring = t > 0.8 && t < 3.0;
    const sh = ring ? Math.sin(t * 70) * 2.6 : 0;
    s += '<rect x="860" y="528" width="124" height="74" rx="8" fill="#661426"/><rect x="852" y="520" width="140" height="14" rx="6" fill="#8a1d35"/>';
    if (ring) for (let k = 0; k < 3; k++) {
      const ph = (t * 2.2 + k / 3) % 1;
      s += '<circle cx="922" cy="492" r="' + f(36 + ph * 58) + '" fill="none" stroke="#fdb5c6" stroke-width="3" opacity="' + f((1 - ph) * .7) + '"/>';
    }
    s += '<g transform="translate(' + f(sh) + ',0)"><circle cx="896" cy="462" r="13" fill="#fa8ba4"/><circle cx="948" cy="462" r="13" fill="#fa8ba4"/>' +
      '<rect x="874" y="466" width="96" height="54" rx="12" fill="#331017" stroke="#fdb5c6" stroke-width="3"/>' +
      txt(922, 504, t < 0.8 ? '05:59' : '06:00', { anchor: 'middle', size: 30, weight: 700, fill: ring ? '#ffffff' : '#fdb5c6', family: "'DejaVu Sans Mono',monospace" }) + '</g>';
    return s;
  }

  /* ============================================================
     SCÈNE 2 — LE MIROIR
     ============================================================ */
  function scene2(t) {
    let s = '<rect width="1280" height="720" fill="#16070a"/>';
    s += '<g opacity=".5">'; for (let i = 0; i < 9; i++) s += '<rect x="' + (i * 160) + '" y="0" width="80" height="650" fill="#2a0b12"/>'; s += '</g>';
    s += '<rect x="0" y="650" width="1280" height="70" fill="#20080e"/>';
    const mx = 424, my = 74, mw = 432, mh = 580;
    const reveal = eo(seg(t, 6.1, 6.9));
    s += '<defs><linearGradient id="mir2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#531523"/><stop offset="1" stop-color="#240a10"/></linearGradient>' +
      '<clipPath id="mc2"><rect x="' + mx + '" y="' + my + '" width="' + mw + '" height="' + mh + '" rx="20"/></clipPath></defs>';
    s += '<g opacity="' + f(reveal) + '"><rect x="' + (mx - 12) + '" y="' + (my - 12) + '" width="' + (mw + 24) + '" height="' + (mh + 24) + '" rx="30" fill="none" stroke="#fdb5c6" stroke-width="9" filter="url(#glow)"/>';
    s += '<rect x="' + mx + '" y="' + my + '" width="' + mw + '" height="' + mh + '" rx="20" fill="url(#mir2)"/><g clip-path="url(#mc2)">';
    s += '<ellipse cx="640" cy="634" rx="170" ry="14" fill="#ed3a5e" opacity=".3"/>';

    const kW = ease(seg(t, 8.2, 9.2)) * (1 - ease(seg(t, 10.0, 10.8))), kC = ease(seg(t, 11.2, 11.9)), kF = ease(seg(t, 12.6, 13.2));
    const mood = lerp(-.55, .7, ease(seg(t, 10.6, 11.6))), brow = lerp(-.85, .75, ease(seg(t, 10.6, 11.6)));
    const nod = ease(seg(t, 8.2, 8.8)) * (1 - ease(seg(t, 9.8, 10.4)));
    const fig = frontFigure({
      m: 0, bob: Math.sin(t * 2.2) * 1.2, mood: mood, brow: brow, nod: nod,
      hands: (sg, sh, d) => {
        let tg = [sh[0] + sg * 10, sh[1] + 104];
        tg = lerp2(tg, [sg * (d.ww + 9), -196], kW);
        tg = lerp2(tg, [sg * 12, -222], kC);
        tg = lerp2(tg, [sg * (d.sw + 64), sh[1] - 52], kF);
        return tg;
      }
    });
    s += G(640, 630, 1.7, fig.svg);
    /* balayage de scan */
    const sc = seg(t, 8, 10.6);
    if (sc > 0 && sc < 1) {
      const y = lerp(my, my + mh, sc);
      s += '<rect x="' + mx + '" y="' + f(y - 80) + '" width="' + mw + '" height="80" fill="url(#scanG)" opacity=".5"/><rect x="' + mx + '" y="' + f(y - 2) + '" width="' + mw + '" height="4" fill="#ffd5dc"/>';
    }
    /* reflet qui passe */
    const sw = seg(t, 6.6, 8.0);
    if (sw > 0 && sw < 1) { const x = lerp(mx - 220, mx + mw + 60, eo(sw)); s += '<polygon points="' + f(x) + ',' + my + ' ' + f(x + 70) + ',' + my + ' ' + f(x - 70) + ',' + (my + mh) + ' ' + f(x - 140) + ',' + (my + mh) + '" fill="#fff" opacity=".13"/>'; }
    s += '</g></g>';

    /* analyse : étiquettes à droite */
    const labels = [[214, 'ÉPAULES', 'étroites'], [300, 'BRAS', 'fins'], [372, 'TAILLE', 'très mince'], [480, 'JAMBES', 'peu de masse']];
    labels.forEach((l, i) => {
      const k = eo(seg(t, 8.4 + i * .5, 8.9 + i * .5)) * (1 - seg(t, 12.2, 12.8));
      if (k <= 0) return;
      s += '<g opacity="' + f(k) + '"><circle cx="' + (712 + (i === 3 ? -10 : 0)) + '" cy="' + l[0] + '" r="5" fill="#fdb5c6"/><path d="M' + (712 + (i === 3 ? -10 : 0)) + ',' + l[0] + ' L884,' + l[0] + '" stroke="#fa8ba4" stroke-width="1.6" stroke-dasharray="4 5"/>' +
        txt(896, l[0] - 6, l[1], { size: 14, ls: 4, fill: '#fa8ba4' }) + txt(896, l[0] + 20, l[2], { size: 22, weight: 700 }) + '</g>';
    });
    /* analyse : barres à gauche */
    const stats = [['MASSE MUSCULAIRE', 12], ['FORCE', 15], ['ÉNERGIE', 40]];
    const pk = eo(seg(t, 8.2, 8.8)) * (1 - seg(t, 12.2, 12.8));
    if (pk > 0) {
      s += '<g opacity="' + f(pk) + '">' + txt(60, 150, 'ANALYSE DU MATIN', { size: 15, ls: 5, fill: '#fa8ba4' }) + '<rect x="60" y="162" width="64" height="3" fill="#ed3a5e"/>';
      stats.forEach((st, i) => {
        const y = 210 + i * 66, fill = ease(seg(t, 8.6 + i * .4, 10.2 + i * .4));
        s += txt(60, y, st[0], { size: 14, ls: 3, weight: 600, fill: '#fdb5c6' }) + txt(360, y, Math.round(st[1] * fill) + '%', { size: 18, anchor: 'end', weight: 800 }) +
          '<rect x="60" y="' + (y + 12) + '" width="300" height="9" rx="4.5" fill="#40131d"/><rect x="60" y="' + (y + 12) + '" width="' + f(300 * st[1] / 100 * fill) + '" height="9" rx="4.5" fill="url(#gV)"/>';
      });
      s += '</g>';
    }
    /* texte puis bulle de pensée */
    const k1 = eo(seg(t, 6.6, 7.3)) * (1 - seg(t, 10.2, 10.6));
    if (k1 > 0) s += '<g opacity="' + f(k1) + '">' + txt(60, 460, 'Ce matin,', { size: 38, weight: 800 }) + txt(60, 508, 'il regarde la', { size: 38, weight: 800 }) + txt(60, 556, 'vérité en face.', { size: 38, weight: 800, fill: '#fa8ba4' }) + '</g>';
    const k2 = eo(seg(t, 10.7, 11.4)) * (1 - seg(t, 13.4, 13.9));
    if (k2 > 0) s += '<g opacity="' + f(k2) + '"><rect x="60" y="436" width="300" height="86" rx="30" fill="#381019" stroke="#fa8ba4" stroke-width="3"/><circle cx="380" cy="540" r="9" fill="#381019" stroke="#fa8ba4" stroke-width="3"/><circle cx="398" cy="556" r="5" fill="#381019" stroke="#fa8ba4" stroke-width="3"/>' +
      txt(210, 488, 'Je dois changer ça.', { anchor: 'middle', size: 25, weight: 700 }) + '</g>';
    return s;
  }

  /* ============================================================
     SCÈNE 3 — LA BOÎTE DE CARTES (gacha)
     ============================================================ */
  function icon(i) {
    if (i === 0) return G(0, 56, .44, frontFigure({ m: .5, mono: true, crouch: .9, hands: (sg, sh) => [sg * 12, sh[1] + 28] }).svg);
    if (i === 1) return G(-6, 54, .6, sideFigure(pushupPts(.75), .5, { mono: true }));
    if (i === 2) return G(-4, 56, .64, sideFigure(crunchPts(.95, ['head', 'head', 0]), .5, { mono: true }));
    return G(0, 56, .44, frontFigure({ m: .5, mono: true, raise: 84, weights: true }).svg);
  }
  function cardBack() {
    return '<rect x="-95" y="-135" width="190" height="270" rx="16" fill="#360c15" stroke="#d64b6a" stroke-width="3"/><rect x="-83" y="-123" width="166" height="246" rx="10" fill="none" stroke="#772a3c" stroke-width="1.5"/>' +
      star(0, -8, 46, 'url(#gV)') + star(0, -8, 16, '#fff3f6') + txt(0, 84, 'nVB', { anchor: 'middle', size: 22, weight: 800, fill: '#fa8ba4', ls: 4, op: .8 }) +
      star(-66, -100, 7, '#fa8ba4', .7) + star(66, 100, 7, '#fa8ba4', .7);
  }
  function cardFront(ex, i, t) {
    const r = RAR[ex.rar];
    let s = '<rect x="-95" y="-135" width="190" height="270" rx="16" fill="url(#cardG)" stroke="' + r.c + '" stroke-width="4"' + (r.g ? ' filter="url(#glow)"' : '') + '/>';
    s += '<rect x="-83" y="-123" width="166" height="246" rx="10" fill="none" stroke="' + r.c + '" stroke-width="1" opacity=".35"/>';
    s += txt(0, -100, ex.rar, { anchor: 'middle', size: 15, ls: 5, weight: 800, fill: r.c });
    s += '<ellipse cx="0" cy="48" rx="64" ry="8" fill="#ed3a5e" opacity=".35"/>' + icon(i);
    s += txt(0, 92, ex.name, { anchor: 'middle', size: ex.name.length > 6 ? 27 : 31, weight: 800 });
    s += txt(0, 120, '3 × ' + ex.reps + ' reps', { anchor: 'middle', size: 18, weight: 600, fill: '#fdb5c6' });
    if (r.g === 2) {
      const x = ((t * 0.7 + i * .3) % 1.6) * 330 - 190;
      s += '<clipPath id="cs' + i + '"><rect x="-95" y="-135" width="190" height="270" rx="16"/></clipPath><g clip-path="url(#cs' + i + ')"><polygon points="' + f(x) + ',-135 ' + f(x + 36) + ',-135 ' + f(x - 44) + ',135 ' + f(x - 80) + ',135" fill="#fff" opacity=".22"/></g>';
    }
    return s;
  }
  function scene3(t) {
    let s = '<rect width="1280" height="720" fill="#0f0507"/><defs><radialGradient id="g3" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#951d34" stop-opacity=".75"/><stop offset="1" stop-color="#0f0507" stop-opacity="0"/></radialGradient></defs>';
    s += '<rect width="1280" height="720" fill="url(#g3)"/>';
    for (let i = 0; i < 30; i++) s += star(rnd(i) * 1280, rnd(i + 70) * 560, 2 + rnd(i + 5) * 3, '#fdb5c6', (.25 + .5 * Math.abs(Math.sin(t * 1.6 + i))) * .7);
    const open = ease(seg(t, 14.6, 15.4));
    /* titre */
    const tk = eo(seg(t, 15.2, 15.9));
    s += '<g opacity="' + f(tk) + '">' + txt(640, 92, 'TIRAGE DU JOUR', { anchor: 'middle', size: 38, weight: 800, ls: 10 }) + txt(640, 128, '4 cartes · 1 chance · 0 excuse', { anchor: 'middle', size: 18, ls: 6, weight: 600, fill: '#fa8ba4' }) + '</g>';
    /* faisceau */
    s += '<polygon points="560,486 720,486 940,20 340,20" fill="url(#beam)" opacity="' + f(open * (.5 + .12 * Math.sin(t * 5))) + '"/>';
    /* boîte */
    const shake = (t > 14.0 && t < 14.6) ? Math.sin(t * 60) * 3 : 0;
    const lidA = -open * 112, lidOp = 1 - seg(t, 15.2, 15.9);
    s += '<g transform="translate(' + f(shake) + ',0)">';
    s += '<rect x="510" y="482" width="260" height="140" rx="12" fill="url(#boxG)" stroke="#fa8ba4" stroke-width="3"/>' +
      '<rect x="510" y="516" width="260" height="10" fill="#951d34" opacity=".7"/>' + star(640, 572, 26, '#ffd5dc') + star(640, 572, 10, '#ed3a5e');
    if (open > 0.3) s += '<ellipse cx="640" cy="484" rx="126" ry="9" fill="#ffd5dc" opacity="' + f(.85 * open) + '"/>';
    s += '<g opacity="' + f(lidOp) + '" transform="rotate(' + f(lidA) + ' 504 486)"><rect x="500" y="452" width="280" height="36" rx="10" fill="#d9284b" stroke="#fdb5c6" stroke-width="3"/><rect x="500" y="468" width="280" height="6" fill="#951d34" opacity=".6"/></g></g>';
    /* étincelles à l'ouverture */
    if (open > 0) for (let i = 0; i < 14; i++) {
      const ph = (t * .8 + rnd(i)) % 1;
      s += star(640 + (rnd(i + 3) - .5) * 240 * (.3 + ph), 480 - ph * (180 + rnd(i + 8) * 160), 4 + rnd(i + 11) * 6, '#ffd5dc', (1 - ph) * open);
    }
    /* cartes */
    EX.forEach((ex, i) => {
      const tl = 15.3 + i * .3, pr = seg(t, tl, tl + .95);
      if (pr <= 0) return;
      const e = eo(pr), fx = 640 + (i - 1.5) * 225, fy = 300;
      let x = lerp(640, fx, e), y = lerp(500, fy, e) - Math.sin(Math.PI * pr) * 130;
      if (pr >= 1) y += Math.sin(t * 1.8 + i * 1.3) * 3.5;
      const rot = lerp((i % 2 ? 1 : -1) * (25 + i * 8), 0, e), sc0 = lerp(.3, 1, e);
      const t0 = 17.0 + i * .55, fl = seg(t, t0, t0 + .5), ang = fl * Math.PI;
      const sx = Math.max(Math.abs(Math.cos(ang)), .02), lift = Math.sin(Math.PI * fl);
      y -= lift * 14;
      const sc = sc0 * (1 + lift * .08);
      s += '<g transform="translate(' + f(x) + ',' + f(y) + ') rotate(' + f(rot) + ') scale(' + f(sc * sx) + ',' + f(sc) + ')">' + (ang > Math.PI / 2 ? cardFront(ex, i, t) : cardBack()) + '</g>';
      const fk = seg(t, t0 + .25, t0 + .95);
      if (fk > 0 && fk < 1) {
        const r = RAR[ex.rar];
        s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(lerp(60, 250, eo(fk))) + '" fill="none" stroke="' + r.c + '" stroke-width="' + f(6 * (1 - fk)) + '" opacity="' + f(1 - fk) + '"/>';
        if (r.g) for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .3; s += star(x + Math.cos(a) * lerp(60, 190, eo(fk)), y + Math.sin(a) * lerp(60, 190, eo(fk)), 9 * (1 - fk) + 2, '#fff', 1 - fk); }
      }
    });
    /* bandeau des autres cartes de la boîte */
    const tk2 = eo(seg(t, 19.4, 20.2));
    if (tk2 > 0) {
      const items = 'TRICEPS  •  JAMBES  •  MOLLETS  •  DOS  •  GAINAGE  •  FENTES  •  BICEPS  •  PECTORAUX  •  ';
      s += '<g opacity="' + f(tk2 * .85) + '">' + txt(640, 641, 'ET BIEN D’AUTRES CARTES DANS LA BOÎTE…', { anchor: 'middle', size: 13, ls: 5, fill: '#fa8ba4' }) + '</g>';
      s += '<clipPath id="tk3"><rect x="140" y="648" width="1000" height="20"/></clipPath><g clip-path="url(#tk3)" opacity="' + f(tk2 * .6) + '">' + txt(140 - ((t - 19.4) * 60) % 640, 663, items + items + items, { size: 15, weight: 700, ls: 3, fill: '#fdb5c6', extra: ' xml:space="preserve"' }) + '</g>';
    }
    return s;
  }

  /* ============================================================
     SCÈNE 4 — L'ENTRAÎNEMENT
     ============================================================ */
  function repPhase(ex, t) {
    const u = clamp((t - ex.start) / (ex.end - ex.start)) * ex.reps;
    return 0.5 - 0.5 * Math.cos(2 * Math.PI * u);
  }
  function exerciseFigure(i, t, m) {
    const ex = EX[i], p = repPhase(ex, t);
    if (i === 0) { const fg = frontFigure({ m: m, crouch: p * .95, hands: (sg, sh) => [sg * 12, sh[1] + 28] }); return { svg: G(640, 652, 1.5, fg.svg), head: [640 + fg.head[0] * 1.5, 652 + fg.head[1] * 1.5] }; }
    if (i === 1) { const P = pushupPts(p); return { svg: G(685, 652, 1.5, sideFigure(P, m, { toe: true })), head: [685 + P.head[0] * 1.5, 652 + P.head[1] * 1.5] }; }
    if (i === 2) { const P = crunchPts(p * 1.0, ['head', 'head', 0]); return { svg: G(655, 652, 1.55, sideFigure(P, m)), head: [655 + P.head[0] * 1.55, 652 + P.head[1] * 1.55] }; }
    const fg = frontFigure({ m: m, raise: lerp(8, 88, p), weights: true }); return { svg: G(640, 652, 1.5, fg.svg), head: [640 + fg.head[0] * 1.5, 652 + fg.head[1] * 1.5] };
  }
  function scene4(t) {
    let s = '<rect width="1280" height="720" fill="#1a050a"/>';
    s += '<defs><linearGradient id="fl4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d0d18"/><stop offset="1" stop-color="#20060c"/></linearGradient></defs>';
    s += '<rect x="0" y="140" width="1280" height="6" fill="#ed3a5e" filter="url(#glow)" opacity=".8"/>';
    s += txt(640, 330, 'neV.BOOSTER', { anchor: 'middle', size: 150, weight: 900, fill: '#ed3a5e', op: .06, ls: 6 });
    s += '<rect x="0" y="652" width="1280" height="68" fill="url(#fl4)"/>';
    for (let i = -6; i <= 6; i++) s += '<line x1="' + (640 + i * 40) + '" y1="652" x2="' + (640 + i * 260) + '" y2="720" stroke="#951d34" stroke-width="2" opacity=".45"/>';
    s += '<rect x="320" y="650" width="640" height="10" rx="5" fill="#b6213e" opacity=".9"/>';

    /* figure */
    let active = -1, figs = '', headPos = null;
    if (t < EX[0].start - .35) {
      const fg = frontFigure({ m: .05, bob: Math.sin(t * 2.4) * 1.2, mood: .3 });
      figs += '<g opacity="' + f(eo(seg(t, 22.6, 23.0))) + '">' + G(640, 652, 1.5, fg.svg) + '</g>';
    }
    EX.forEach((ex, i) => {
      const a = seg(t, ex.start - .35, ex.start) * (1 - seg(t, ex.end + .05, ex.end + .3));
      if (a <= 0) return;
      const r = exerciseFigure(i, t, .06 + i * .015);
      figs += '<g opacity="' + f(a) + '">' + r.svg + '</g>';
      if (t >= ex.start && t <= ex.end) { active = i; headPos = r.head; }
    });
    s += figs;
    /* gouttes de sueur */
    if (headPos) for (let k = 0; k < 3; k++) {
      const ph = (t * 1.3 + k / 3) % 1;
      s += '<path d="M' + f(headPos[0] + [-34, 30, 42][k]) + ',' + f(headPos[1] - 14 + ph * 60) + ' q-4,7 0,10 q4,-3 0,-10 z" fill="#ffe0ea" opacity="' + f((1 - ph) * .8) + '"/>';
    }
    /* pastilles des 4 cartes */
    EX.forEach((ex, i) => {
      const x = 336 + i * 164, done = t > ex.end + .1, act = active === i;
      s += '<g' + (act ? ' filter="url(#glow)"' : '') + '><rect x="' + x + '" y="34" width="150" height="58" rx="14" fill="' + (act ? '#ed3a5e' : done ? '#951d34' : '#300d15') + '" stroke="' + (act || done ? '#fdb5c6' : '#6b2a38') + '" stroke-width="2.5"/></g>';
      s += txt(x + 75, 60, ex.name, { anchor: 'middle', size: 18, weight: 800, fill: act || done ? '#fff' : '#c98293' });
      s += txt(x + 75, 80, done ? '✓ TERMINÉ' : '3 × ' + ex.reps, { anchor: 'middle', size: 12, ls: 2, weight: 700, fill: act ? '#ffd5dc' : done ? '#fdb5c6' : '#a85f70' });
    });
    /* compteur de répétitions (à droite) */
    EX.forEach((ex, i) => {
      const a = seg(t, ex.start - .2, ex.start + .1) * (1 - seg(t, ex.end, ex.end + .25));
      if (a <= 0) return;
      const k = clamp(Math.round(clamp((t - ex.start) / (ex.end - ex.start)) * ex.reps), 0, ex.reps);
      s += '<g opacity="' + f(a) + '">' + txt(1075, 285, ex.name, { anchor: 'middle', size: 20, ls: 6, fill: '#fa8ba4' }) +
        txt(1075, 395, k + '/' + ex.reps, { anchor: 'middle', size: 110, weight: 900 }) + txt(1075, 436, 'SÉRIE 1 / 3', { anchor: 'middle', size: 16, ls: 5, fill: '#fdb5c6', weight: 700 }) + '</g>';
    });
    /* XP (à gauche) */
    const done = EX.filter(e => t > e.end).length;
    const xpf = done + (active >= 0 ? clamp((t - EX[active].start) / (EX[active].end - EX[active].start)) : 0);
    s += '<g opacity="' + f(eo(seg(t, 23.0, 23.6)) * (1 - seg(t, 35.5, 35.9))) + '">' + txt(205, 285, 'XP DU JOUR', { anchor: 'middle', size: 18, ls: 6, fill: '#fa8ba4' }) +
      txt(205, 385, '+' + Math.round(xpf * 10), { anchor: 'middle', size: 90, weight: 900 }) +
      '<rect x="105" y="410" width="200" height="10" rx="5" fill="#40131d"/><rect x="105" y="410" width="' + f(200 * xpf / 4) + '" height="10" rx="5" fill="url(#gV)"/></g>';
    /* +10 XP flottants */
    EX.forEach((ex, i) => {
      const k = seg(t, ex.end, ex.end + 1.0);
      if (k > 0 && k < 1) s += txt(640 + (i % 2 ? 120 : -120), 360 - k * 80, '+10 XP', { anchor: 'middle', size: 34, weight: 900, fill: '#ffd5dc', op: 1 - k });
    });
    /* intro / fin */
    const ik0 = eo(seg(t, 22.7, 23.0)) * (1 - seg(t, 23.0, 23.35));
    if (ik0 > 0) s += txt(640, 250, 'SÉANCE DU JOUR', { anchor: 'middle', size: 54, weight: 900, ls: 10, op: ik0 });
    const fin = eo(seg(t, 35.45, 35.8));
    if (fin > 0) s += '<g opacity="' + f(fin) + '"><rect x="400" y="300" width="480" height="110" rx="26" fill="#300d15" stroke="#fa8ba4" stroke-width="3"/>' + txt(640, 360, 'SÉANCE TERMINÉE', { anchor: 'middle', size: 36, weight: 900, ls: 4 }) + txt(640, 392, '+40 XP · régularité +1', { anchor: 'middle', size: 18, ls: 3, fill: '#fdb5c6' }) + '</g>';
    return s;
  }

  /* ============================================================
     SCÈNE 5 — LA PROGRESSION
     ============================================================ */
  const P_START = 36, P_END = 42;
  const dayAt = t => Math.round(lerp(1, 90, ease(seg(t, P_START, P_END))));
  const MILE = [[7, 'SEMAINE 1'], [30, 'MOIS 1'], [90, 'MOIS 3']].map(m => {
    let tt = P_START; while (dayAt(tt) < m[0] && tt < P_END) tt += 0.01; return { t: tt, s: m[1] };
  });
  function scene5(t) {
    const prog = ease(seg(t, P_START, P_END));
    const m = lerp(.05, .92, prog), day = dayAt(t);
    const ang = (t - 35.8) * 3.2;
    let s = '<rect width="1280" height="720" fill="' + mix('#16070a', '#50101d', (Math.sin(ang) + 1) / 2 * .8) + '"/>';
    /* soleil / lune */
    [[0, '#ffd9a8', 34], [Math.PI, '#ffe0ea', 28]].forEach(b => {
      const a = ang + b[0], x = 400 + 430 * Math.cos(a), y = 700 - 520 * Math.sin(a);
      if (y < 640) s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + (b[2] * 2.2) + '" fill="' + b[1] + '" opacity=".1"/><circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + b[2] + '" fill="' + b[1] + '"/>';
    });
    s += '<rect x="0" y="655" width="1280" height="65" fill="#22070d"/><ellipse cx="400" cy="656" rx="230" ry="12" fill="#ed3a5e" opacity=".35"/>';
    /* personnage */
    const pu = (t - 35.9) / 1.1, p = .5 - .5 * Math.cos(2 * Math.PI * pu);
    const kF = ease(seg(t, 39.4, 40.2)) * (1 + .06 * Math.sin(t * 6) * seg(t, 40.4, 43));
    const fig = frontFigure({
      m: m, weights: kF < .5, bob: Math.sin(t * 2.4) * 1.2, mood: lerp(.2, .9, prog),
      hands: (sg, sh, d) => {
        const a = lerp(8, 86, p) * Math.PI / 180;
        return lerp2([sh[0] + sg * 104 * Math.sin(a), sh[1] + 104 * Math.cos(a)], [sg * (d.sw + 64), sh[1] - 52], clamp(kF));
      }
    });
    s += G(400, 655, 1.55, fig.svg);
    /* jours */
    s += txt(1000, 108, 'JOUR', { anchor: 'middle', size: 20, ls: 10, fill: '#fa8ba4' }) + txt(1000, 210, String(day), { anchor: 'middle', size: 120, weight: 900 }) + txt(1000, 244, 'SUR 90', { anchor: 'middle', size: 14, ls: 6, fill: '#c98293' });
    /* barres */
    [['FORCE', 15, 88], ['MASSE MUSCULAIRE', 12, 90], ['ENDURANCE', 30, 85]].forEach((b, i) => {
      const y = 280 + i * 46, v = lerp(b[1], b[2], prog);
      s += txt(850, y, b[0], { size: 13, ls: 3, weight: 600, fill: '#fdb5c6' }) + txt(1150, y, Math.round(v) + '%', { anchor: 'end', size: 16, weight: 800 }) +
        '<rect x="850" y="' + (y + 9) + '" width="300" height="8" rx="4" fill="#40131d"/><rect x="850" y="' + (y + 9) + '" width="' + f(3 * v) + '" height="8" rx="4" fill="url(#gV)"/>';
    });
    /* instantanés J1 → J90 */
    [[36.4, 0, 'J1'], [37.5, .22, 'J7'], [38.6, .5, 'J30'], [39.7, .72, 'J60'], [40.8, .92, 'J90']].forEach((sn, i) => {
      const k = eo(seg(t, sn[0], sn[0] + .5));
      if (k <= 0) return;
      const x = 790 + i * 92, fg = frontFigure({ m: sn[1], bob: 0 });
      s += '<g opacity="' + f(k) + '">' + G(x, 572 + (1 - k) * 18, .46, fg.svg) + txt(x, 598, sn[2], { anchor: 'middle', size: 14, weight: 800, ls: 2, fill: i === 4 ? '#fff' : '#fa8ba4' }) + '</g>';
    });
    /* régularité */
    s += txt(775, 626, 'RÉGULARITÉ', { size: 13, ls: 4, fill: '#fa8ba4', weight: 700 });
    for (let i = 0; i < 30; i++) s += '<rect x="' + (775 + i * 15) + '" y="636" width="11" height="11" rx="3" fill="' + (i < Math.round(day / 3) ? '#fa8ba4' : '#40131d') + '"/>';
    /* étapes */
    MILE.forEach(ms => {
      const k = seg(t, ms.t, ms.t + 1.3); if (k <= 0 || k >= 1) return;
      const a = Math.min(1, k * 6) * (1 - seg(k, .7, 1));
      s += '<g opacity="' + f(a) + '" transform="translate(400,' + f(112 - k * 14) + ')"><rect x="-120" y="-30" width="240" height="52" rx="26" fill="#ed3a5e" stroke="#ffd5dc" stroke-width="2.5" filter="url(#glow)"/>' + txt(0, 5, ms.s + ' ✓', { anchor: 'middle', size: 24, weight: 900, ls: 4 }) + '</g>';
    });
    return s;
  }

  /* ============================================================
     SCÈNE 6 — LE RÉSULTAT + LOGO
     ============================================================ */
  function scene6(t, part) {
    let s = '<rect width="1280" height="720" fill="#0f0507"/><defs><radialGradient id="g6" cx=".5" cy=".45" r=".65"><stop offset="0" stop-color="#951d34" stop-opacity=".7"/><stop offset="1" stop-color="#0f0507" stop-opacity="0"/></radialGradient></defs><rect width="1280" height="720" fill="url(#g6)"/>';
    for (let i = 0; i < 28; i++) s += star(rnd(i + 3) * 1280, rnd(i + 90) * 640, 2 + rnd(i + 5) * 3, '#fdb5c6', (.2 + .5 * Math.abs(Math.sin(t * 1.4 + i))) * .7);
    const fade = 1 - eo(seg(t, 46.2, 47.0));
    if (part !== 'logo' && fade > 0) {
      const tit = eo(seg(t, 43.2, 43.9));
      s += '<g opacity="' + f(fade) + '">' + txt(640, 100, '90 JOURS PLUS TARD', { anchor: 'middle', size: 40, weight: 900, ls: 8, op: tit });
      const kA = eo(seg(t, 43.6, 44.4)), kB = eo(seg(t, 44.0, 44.9));
      const a = frontFigure({ m: 0, bob: Math.sin(t * 2.2) * 1.2, mood: -.1 });
      s += '<g opacity="' + f(kA * .8) + '">' + G(360, 655, 1.35, a.svg) + txt(360, 190, 'AVANT', { anchor: 'middle', size: 26, weight: 800, ls: 8, fill: '#c98293' }) + '</g>';
      const b = frontFigure({ m: .95, charm: true, flex: ease(seg(t, 44.4, 45.2)), bob: Math.sin(t * 2.2) * 1.2, mood: 1 });
      s += '<g opacity="' + f(kB) + '"><ellipse cx="900" cy="630" rx="170" ry="26" fill="#ed3a5e" opacity=".4"/>' + G(900, 655, 1.35, b.svg) + txt(900, 190, 'APRÈS', { anchor: 'middle', size: 26, weight: 800, ls: 8, fill: '#ffd5dc' }) + '</g>';
      s += '<g opacity="' + f(kB) + '"><path d="M575,420 L665,420 M640,396 L668,420 L640,444" stroke="#fa8ba4" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' + txt(630, 380, 'RÉGULARITÉ', { anchor: 'middle', size: 14, ls: 4, fill: '#fa8ba4' }) + '</g>';
      if (kB > 0.5) for (let i = 0; i < 6; i++) { const ph = (t * .9 + i / 6) % 1; s += star(900 + (rnd(i) - .5) * 300, 420 - ph * 260, 5 + rnd(i + 4) * 7, '#ffd5dc', (1 - ph) * .9); }
      s += '</g>';
    }
    /* logo final */
    const L = eo(seg(t, 46.6, 47.8));
    if (part !== 'ba' && L > 0) {
      const y0 = (1 - L) * 24;
      s += '<g opacity="' + f(L) + '" transform="translate(0,' + f(y0) + ')">';
      s += '<g filter="url(#glow)"><ellipse cx="640" cy="318" rx="176" ry="48" transform="rotate(-12 640 318)" fill="none" stroke="url(#gV)" stroke-width="8" opacity=".95"/></g>';
      s += txt(500, 372, 'n', { anchor: 'middle', size: 190, weight: 900, italic: true, fill: 'url(#gLogoL)' });
      s += txt(790, 372, 'B', { anchor: 'middle', size: 190, weight: 900, italic: true, fill: 'url(#gLogoR)' });
      s += '<polygon points="560,212 618,212 650,306 682,212 740,212 672,392 628,392" fill="url(#gLogoV)" stroke="#18060a" stroke-width="4" stroke-linejoin="round" filter="url(#glow)"/>';
      s += star(618, 176, 26 + 3 * Math.sin(t * 4), '#ffd5dc') + star(738, 152, 11, '#ffd5dc', .9);
      s += '<text x="640" y="500" text-anchor="middle" font-family="' + FONT + '" font-size="82" font-weight="800"><tspan fill="#fff">neV.</tspan><tspan fill="url(#gLogoL)"> BOOSTER</tspan></text>';
      s += '<rect x="130" y="540" width="215" height="2" fill="#ed3a5e"/><rect x="935" y="540" width="215" height="2" fill="#ed3a5e"/>' + txt(640, 548, 'BOOSTE TON QUOTIDIEN', { anchor: 'middle', size: 24, ls: 12, weight: 500, fill: '#ffe3e9' });
      s += '</g>';
      const sl = eo(seg(t, 48.0, 48.8));
      s += txt(640, 612, 'Plus qu’un site, une impulsion.', { anchor: 'middle', size: 32, weight: 500, italic: true, fill: '#fa8ba4', op: sl });
      const cta = eo(seg(t, 48.6, 49.3));
      s += '<g opacity="' + f(cta) + '"><rect x="440" y="640" width="400" height="48" rx="24" fill="#ed3a5e" stroke="#ffd5dc" stroke-width="2"/>' + txt(640, 672, 'TIRE TA PREMIÈRE CARTE', { anchor: 'middle', size: 18, weight: 800, ls: 5 }) + '</g>';
    }
    return s;
  }

    /* ============================================================
     HISTOIRE — le regard des filles (avant / après)
     ============================================================ */
  const heart = (x, y, s, fill, op) => '<path d="M' + f(x) + ',' + f(y + s * .9) + ' C' + f(x - s * 1.6) + ',' + f(y - s * .2) + ' ' + f(x - s * .7) + ',' + f(y - s * 1.3) + ' ' + f(x) + ',' + f(y - s * .35) +
    ' C' + f(x + s * .7) + ',' + f(y - s * 1.3) + ' ' + f(x + s * 1.6) + ',' + f(y - s * .2) + ' ' + f(x) + ',' + f(y + s * .9) + ' Z" fill="' + fill + '" opacity="' + (op == null ? 1 : f(op)) + '"/>';

  function xmark(cx, cy, r, k) {
    if (k <= 0) return '';
    return '<g opacity="' + f(clamp(k * 3)) + '" transform="translate(' + f(cx) + ',' + f(cy) + ') scale(' + f(.6 + .4 * eo(k)) + ')"><circle r="' + r + '" fill="#f43f5e" stroke="#fff" stroke-width="2.5"/>' +
      '<path d="M' + f(-r * .4) + ',' + f(-r * .4) + ' L' + f(r * .4) + ',' + f(r * .4) + ' M' + f(r * .4) + ',' + f(-r * .4) + ' L' + f(-r * .4) + ',' + f(r * .4) + '" stroke="#fff" stroke-width="' + f(r * .22) + '" stroke-linecap="round"/></g>';
  }

  /* bulle : (x, y) = pointe de la queue, k = 0..1 (apparition) */
  function bubble(x, y, text, k) {
    if (k <= 0) return '';
    const w = text.length * 10.6 + 36, h = 44;
    return '<g opacity="' + f(clamp(k * 3)) + '" transform="translate(' + f(x) + ',' + f(y) + ') scale(' + f(.7 + .3 * eo(k)) + ')">' +
      '<rect x="' + f(-w / 2) + '" y="' + (-h - 14) + '" width="' + f(w) + '" height="' + h + '" rx="22" fill="#fff3f6" stroke="#fa8ba4" stroke-width="2.5"/>' +
      '<polygon points="-9,-15 9,-15 0,0" fill="#fff3f6" stroke="#fa8ba4" stroke-width="2.5" stroke-linejoin="round"/><rect x="-11" y="-17" width="22" height="5" fill="#fff3f6"/>' +
      txt(0, -h / 2 - 8, text, { anchor: 'middle', size: 19, weight: 700, fill: '#661426' }) + '</g>';
  }

  /* Personnage féminin de face (style identique, vêtements colorés). Sol = y 0. */
  function girlFigure(o) {
    const pal = { fill: o.skin || '#e8b48a', outline: o.out || '#5a3322', ow: 2.4 };
    const stp = o.step || 0, bob = o.bob || 0;
    const hipY = -150 + bob, shY = -238 + bob, hc = [0, -268 + bob];
    const hairC = o.hair || '#2b1b17', topC = o.top || '#f472b6', botC = o.bottom || '#7a2a3c';
    const long = o.long !== false;
    const caps = [], dots = [], legs = [];
    [-1, 1].forEach(s => {
      const sw = s === 1 ? stp : -stp;
      const a = [s * 10, hipY], b = [s * 14 + sw * 14, -8 - Math.max(0, sw) * 10];
      caps.push({ a: a, b: b, w: 14 });
      legs.push({ s: s, a: a, b: b });
    });
    caps.push({ a: [0, shY - 2], b: [0, shY - 20], w: 10 });
    dots.push({ c: hc, r: 19 });
    const hl = hc[1] + (long ? 56 : 24);
    let svg = '<path d="M-23,' + f(hc[1] - 4) + ' Q-28,' + f(hl - 8) + ' -16,' + f(hl) + ' L16,' + f(hl) + ' Q28,' + f(hl - 8) + ' 23,' + f(hc[1] - 4) + ' Z" fill="' + hairC + '"/>';
    svg += sil(caps, dots, [], pal);
    /* bas */
    if (o.skirt) svg += '<path d="M-19,' + f(hipY - 12) + ' L19,' + f(hipY - 12) + ' L33,' + f(hipY + 48) + ' L-33,' + f(hipY + 48) + ' Z" fill="' + botC + '" stroke="#00000033" stroke-width="1.5" stroke-linejoin="round"/>';
    else legs.forEach(l => { const e = lerp2(l.a, l.b, .9); svg += '<line x1="' + f(l.a[0]) + '" y1="' + f(l.a[1]) + '" x2="' + f(e[0]) + '" y2="' + f(e[1]) + '" stroke="' + botC + '" stroke-width="17" stroke-linecap="round"/>'; });
    legs.forEach(l => { svg += '<ellipse cx="' + f(l.b[0] + l.s * 4) + '" cy="' + f(l.b[1] + 4) + '" rx="11" ry="5.5" fill="#fff3f6" stroke="#ed3a5e" stroke-width="2"/>'; });
    /* haut */
    svg += '<path d="M-27,' + f(shY + 6) + ' Q0,' + f(shY - 8) + ' 27,' + f(shY + 6) + ' L21,' + f(hipY - 6) + ' L-21,' + f(hipY - 6) + ' Z" fill="' + topC + '" stroke="#00000033" stroke-width="1.5" stroke-linejoin="round"/>';
    /* bras */
    const acaps = [], adots = [];
    [-1, 1].forEach(s => {
      const sh = [s * 26, shY + 8];
      let tgt = [s * 36, sh[1] + 88];
      if (o.wave != null && s === 1) tgt = [sh[0] + 34, sh[1] - 60 + Math.sin(o.wave) * 8];
      const r = ik(sh, tgt, 46, 46, k => s * k[0]);
      acaps.push({ a: sh, b: r.j, w: 11 }, { a: r.j, b: r.e, w: 9 });
      adots.push({ c: r.e, r: 6 });
      const sl = lerp2(sh, r.j, .55);
      svg += '<g>' + sil(acaps.slice(-2), adots.slice(-1), [], pal) + '<line x1="' + f(sh[0]) + '" y1="' + f(sh[1]) + '" x2="' + f(sl[0]) + '" y2="' + f(sl[1]) + '" stroke="' + topC + '" stroke-width="14" stroke-linecap="round"/></g>';
    });
    /* visage */
    const gz = o.gaze || 0, mood = o.mood == null ? 0 : o.mood, up = o.up || 0;
    [-1, 1].forEach(e => {
      const ex = hc[0] + e * 7.5, ey = hc[1] + 2;
      if (o.heartEyes) svg += heart(ex, ey, 3.6, '#f43f5e');
      else {
        svg += '<ellipse cx="' + f(ex + gz * 2.6) + '" cy="' + f(ey - up * 2.2) + '" rx="2.5" ry="3.2" fill="#1a0f12"/><circle cx="' + f(ex + gz * 2.6 + .9) + '" cy="' + f(ey - up * 2.2 - 1) + '" r=".9" fill="#fff"/>';
        svg += '<line x1="' + f(ex + e * 2.5) + '" y1="' + f(ey - 2.5) + '" x2="' + f(ex + e * 6) + '" y2="' + f(ey - 4.6) + '" stroke="#1a0f12" stroke-width="1.5" stroke-linecap="round"/>';
      }
      svg += '<line x1="' + f(ex - 4) + '" y1="' + f(ey - 9 + (mood < 0 ? e * 1.2 : 0)) + '" x2="' + f(ex + 4) + '" y2="' + f(ey - 9 - (mood < 0 ? e * 1.2 : 0)) + '" stroke="' + hairC + '" stroke-width="1.8" stroke-linecap="round"/>';
      if (o.blush) svg += '<ellipse cx="' + f(hc[0] + e * 13) + '" cy="' + f(hc[1] + 9) + '" rx="4" ry="2.3" fill="#f43f5e" opacity=".3"/>';
    });
    const my = hc[1] + 12;
    if (mood > 0) svg += '<path d="M-5,' + f(my) + ' Q0,' + f(my + 3 + mood * 5) + ' 5,' + f(my) + '" stroke="#b4234a" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    else if (mood < 0) svg += '<path d="M-4,' + f(my + 2) + ' Q0,' + f(my) + ' 4,' + f(my + 2) + '" stroke="#b4234a" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    else svg += '<line x1="-4" y1="' + f(my + 1) + '" x2="4" y2="' + f(my + 1) + '" stroke="#b4234a" stroke-width="2.2" stroke-linecap="round"/>';
    /* frange */
    svg += '<path d="M-21,' + f(hc[1] - 2) + ' A21,21 0 0 1 21,' + f(hc[1] - 2) + ' Q12,' + f(hc[1] - 14) + ' 0,' + f(hc[1] - 10) + ' Q-12,' + f(hc[1] - 14) + ' -21,' + f(hc[1] - 2) + ' Z" fill="' + hairC + '"/>';
    return { svg: svg, head: hc };
  }

  const GIRL_STYLES = [
    { skin: '#f0c6a0', hair: '#2b1b17', top: '#f472b6', bottom: '#7a2a3c', skirt: true,  long: true },
    { skin: '#a8683e', hair: '#140c0a', top: '#38bdf8', bottom: '#4b1b28', skirt: false, long: true },
    { skin: '#e8b48a', hair: '#8a4b1f', top: '#34d399', bottom: '#951d34', skirt: true,  long: false },
    { skin: '#6b4129', hair: '#0f0908', top: '#fbbf24', bottom: '#812e44', skirt: false, long: false },
    { skin: '#f0c6a0', hair: '#d9a441', top: '#fb7185', bottom: '#4b1b28', skirt: true,  long: true },
    { skin: '#8d5a3b', hair: '#1a0f0c', top: '#fa8ba4', bottom: '#7a2a3c', skirt: false, long: true }
  ];

  /* ============================================================
     SCÈNE « LA VEILLE » — il n'est pas validé par les filles
     ============================================================ */
  function sceneVeille(t) {
    const u = t - 6;
    let s = '<defs><linearGradient id="skyW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#45121e"/><stop offset="1" stop-color="#a03f51"/></linearGradient></defs><rect width="1280" height="720" fill="url(#skyW)"/>';
    for (let i = 0; i < 9; i++) {
      const bx = i * 150 - 20, bh = 160 + rnd(i + 11) * 170;
      s += '<rect x="' + bx + '" y="' + f(655 - bh) + '" width="132" height="' + f(bh) + '" fill="#330c15" opacity=".9"/>';
      for (let w = 0; w < 12; w++) {
        const wx = bx + 14 + (w % 3) * 38, wy = 655 - bh + 16 + Math.floor(w / 3) * 34;
        if (wy < 625 && rnd(i * 13 + w) > .45) s += '<rect x="' + wx + '" y="' + f(wy) + '" width="18" height="22" rx="3" fill="#ffd9a8" opacity=".5"/>';
      }
    }
    s += '<rect x="0" y="655" width="1280" height="65" fill="#22070d"/><rect x="0" y="655" width="1280" height="2" fill="#ed3a5e" opacity=".5"/>';
    s += '<rect x="556" y="350" width="8" height="305" fill="#5e1a29"/><circle cx="560" cy="345" r="70" fill="#ffd9a8" opacity=".08"/><circle cx="560" cy="345" r="13" fill="#ffe8c4"/>';

    /* filles qui passent derrière lui, sans le voir */
    [0, 1].forEach(i => {
      const p = seg(u, 6.6 + i * .45, 9.6 + i * .45);
      if (p <= 0 || p >= 1) return;
      const x = lerp(-140, 780, p), g = girlFigure(Object.assign({}, GIRL_STYLES[3 + i], { step: Math.sin(t * 8 + i), bob: Math.abs(Math.sin(t * 8 + i)) * 2, gaze: i ? -1 : 1, mood: 1, blush: true, wave: i ? null : undefined }));
      s += G(x, 640, .85, g.svg);
    });

    /* lui */
    const wv = (u > 6.2 && u < 8.4) ? Math.sin((u - 6.2) * 9) : null;
    const kIn = eo(seg(u, 0, .8));
    const guy = frontFigure({
      m: .04, nod: .6, mood: -.8, brow: -1, bob: Math.sin(t * 1.8) * 1,
      hands: (sg, sh) => (sg === 1 && wv != null) ? [sh[0] + 46, sh[1] - 74 + wv * 8] : null
    });
    s += '<g opacity="' + f(kIn) + '">' + G(250, 655, 1.15, guy.svg) + '</g>';
    if (u > 8.4) s += bubble(250, 285, '…', eo(seg(u, 8.4, 8.9)));

    /* groupe de 3 filles : regardent, puis détournent les yeux */
    const AX = [700, 830, 960];
    AX.forEach((px, i) => {
      const ein = ease(seg(u, .4 + i * .25, 3.2 + i * .25)), eout = ease(seg(u, 6.6 + i * .2, 8.8 + i * .2));
      const x = u < 6.6 + i * .2 ? lerp(1450 + i * 90, px, ein) : lerp(px, 1500, eout);
      const moving = (ein > 0 && ein < 1) || (eout > 0 && eout < 1);
      const looking = u > 3.2 && u < 4.5, away = u >= 4.5;
      const g = girlFigure(Object.assign({}, GIRL_STYLES[i], {
        step: moving ? Math.sin(t * 9 + i) : 0, bob: moving ? Math.abs(Math.sin(t * 9 + i)) * 2 : Math.sin(t * 1.6 + i) * .8,
        gaze: looking ? -1 : (away ? 1 : 0), up: away && i === 0 ? 1 : 0, mood: away ? -1 : 0
      }));
      if (x > -80 && x < 1360) s += G(x, 655, 1.05, g.svg);
      if (u > 4.6 + i * .25 && u < 6.6 + i * .2 + .4) s += xmark(x, 330, 17, eo(seg(u, 4.6 + i * .25, 4.95 + i * .25)) * (1 - seg(u, 6.6 + i * .2, 7 + i * .2)));
    });
    s += bubble(700, 292, '…', seg(u, 3.4, 3.8) * (1 - seg(u, 4.4, 4.8)));
    s += bubble(830, 292, 'Bof…', seg(u, 4.9, 5.3) * (1 - seg(u, 6.2, 6.6)));
    s += bubble(960, 292, 'Pas mon style.', seg(u, 5.3, 5.7) * (1 - seg(u, 6.4, 6.8)));

    /* compteur de validation */
    const kv = eo(seg(u, 2.5, 3.2));
    if (kv > 0) {
      const v = lerp(14, 3, seg(u, 3.2, 9));
      s += '<g opacity="' + f(kv) + '">' + txt(850, 130, 'VALIDATION', { size: 14, ls: 4, weight: 700, fill: '#fdb5c6' }) + txt(1150, 130, Math.round(v) + '%', { anchor: 'end', size: 18, weight: 800, fill: '#fb7185' }) +
        '<rect x="850" y="139" width="300" height="9" rx="4.5" fill="#40131d"/><rect x="850" y="139" width="' + f(3 * v) + '" height="9" rx="4.5" fill="#f43f5e"/></g>';
    }
    return s;
  }

  /* ============================================================
     SCÈNE « LA RÉFÉRENCE » — il devient populaire
     ============================================================ */
  const POP_X = [150, 290, 430, 850, 990, 1130], POP_FROM = [-120, -200, -280, 1400, 1480, 1560];
  function scenePopulaire(t) {
    const u = t - 56.5;
    let s = '<defs><linearGradient id="skyP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f101d"/><stop offset="1" stop-color="#d98cc8"/></linearGradient></defs><rect width="1280" height="720" fill="url(#skyP)"/>';
    s += '<circle cx="640" cy="440" r="210" fill="#ffd9a8" opacity=".14"/><circle cx="640" cy="440" r="130" fill="#ffd9a8" opacity=".22"/>';
    s += '<polygon points="640,0 430,655 850,655" fill="#fff" opacity="' + f(.05 + .02 * Math.sin(t * 2)) + '"/>';
    s += '<rect x="0" y="655" width="1280" height="65" fill="#22070d"/><ellipse cx="640" cy="660" rx="230" ry="16" fill="#ed3a5e" opacity=".5"/>';
    for (let i = 0; i < 16; i++) s += star(rnd(i + 40) * 1280, 90 + rnd(i + 70) * 320, 2 + rnd(i + 8) * 4, '#fff7ed', (.25 + .5 * Math.abs(Math.sin(t * 1.6 + i))) * .8);

    /* les filles arrivent, le regardent, craquent */
    POP_X.forEach((px, i) => {
      const e = ease(seg(u, .9 + i * .3, 2.9 + i * .3)), x = lerp(POP_FROM[i], px, e), moving = e > 0 && e < 1;
      const fall = u > 3.6 + i * .35;
      const g = girlFigure(Object.assign({}, GIRL_STYLES[i], {
        step: moving ? Math.sin(t * 9 + i) : 0, bob: moving ? Math.abs(Math.sin(t * 9 + i)) * 2 : Math.sin(t * 2 + i) * 1.2,
        gaze: px < 640 ? 1 : -1, mood: 1, heartEyes: fall && i % 2 === 0, blush: fall,
        wave: (i === 5 && u > 6) ? t * 8 : null
      }));
      s += G(x, 655, 1.05, g.svg);
      if (fall && !moving) for (let h = 0; h < 3; h++) {
        const ph = (t * .55 + i * .37 + h / 3) % 1;
        s += heart(x + (h - 1) * 16 + Math.sin(t * 3 + h + i) * 6, 350 - ph * 150, 6 + h * 2, h % 2 ? '#f9a8d4' : '#f43f5e', 1 - ph);
      }
    });

    /* lui : beau, musclé, souriant */
    const kIn = eo(seg(u, 0, .9));
    const fl = u > 3.5 ? clamp(.5 + .5 * Math.sin((u - 3.5) * 2.4)) : 0;
    const guy = frontFigure({ m: .95, charm: true, mood: 1, flex: fl, bob: Math.sin(t * 2.2) * 1.2 });
    s += '<g opacity="' + f(kIn) + '">' + G(640, 655, 1.4, guy.svg) + '</g>';
    if (kIn > .5) for (let i = 0; i < 8; i++) { const ph = (t * .7 + i / 8) % 1; s += star(640 + (rnd(i + 2) - .5) * 300, 520 - ph * 330, 4 + rnd(i + 6) * 7, '#fff7ed', (1 - ph) * .9); }

    /* bulles */
    s += bubble(290, 345, 'Tu t’entraînes comment ?', seg(u, 4.4, 4.8) * (1 - seg(u, 6.2, 6.6)));
    s += bubble(850, 345, 'Tu es une inspiration !', seg(u, 5.4, 5.8) * (1 - seg(u, 7.2, 7.6)));
    s += bubble(150, 345, 'Wow…', seg(u, 6.4, 6.8) * (1 - seg(u, 8.0, 8.4)));
    s += bubble(990, 345, 'Ton programme ?', seg(u, 7.2, 7.6) * (1 - seg(u, 9.0, 9.4)));

    /* compteur de validation : 3 % → 100 % */
    const kv = eo(seg(u, .6, 1.2));
    if (kv > 0) {
      const v = lerp(3, 100, ease(seg(u, 1.2, 5.6)));
      s += '<g opacity="' + f(kv) + '">' + txt(850, 130, 'VALIDATION', { size: 14, ls: 4, weight: 700, fill: '#fdb5c6' }) + txt(1150, 130, Math.round(v) + '%', { anchor: 'end', size: 18, weight: 800, fill: v > 60 ? '#fff' : '#fb7185' }) +
        '<rect x="850" y="139" width="300" height="9" rx="4.5" fill="#40131d"/><rect x="850" y="139" width="' + f(3 * v) + '" height="9" rx="4.5" fill="url(#gV)"/>' +
        (u > 5.6 ? txt(1150, 176, 'VALIDÉ ✓', { anchor: 'end', size: 16, weight: 900, ls: 3, fill: '#ffd5dc', op: eo(seg(u, 5.6, 6)) }) : '') + '</g>';
    }

    /* badge final */
    const kb = eo(seg(u, 7.2, 8.0));
    if (kb > 0) s += '<g opacity="' + f(kb) + '" transform="translate(640,' + f(158 - (1 - kb) * 20) + ') scale(' + f(.85 + .15 * kb) + ')"><rect x="-170" y="-34" width="340" height="62" rx="31" fill="#ed3a5e" stroke="#ffd5dc" stroke-width="3" filter="url(#glow)"/>' +
      txt(0, 8, 'LA RÉFÉRENCE', { anchor: 'middle', size: 29, weight: 900, ls: 5 }) + star(-198, -3, 14 + 2 * Math.sin(t * 5), '#ffd5dc') + star(198, -3, 14 + 2 * Math.cos(t * 5), '#ffd5dc') + '</g>';
    return s;
  }

const SCENE_FN = [
    scene1, sceneVeille,
    t => scene2(t - 9.5), t => scene3(t - 9.5), t => scene4(t - 9.5), t => scene5(t - 9.5),
    t => scene6(t - 9.5, 'ba'),
    scenePopulaire,
    t => scene6(t - 20.2, 'logo')
  ];

  /* ---------- Habillage commun : chapitre, marque, sous-titres ---------- */
  function hud(t, tall) {
    let idx = SCENES.findIndex(sc => t < sc.b); if (idx < 0) idx = SCENES.length - 1;
    const sc = SCENES[idx], a = eo(seg(t, sc.a, sc.a + .6));
    let s = '';
    const logoPhase = t > 66.6;
    if (!logoPhase) s += '<g opacity="' + f(a) + '"><rect x="48" y="40" width="26" height="3" fill="#fa8ba4"/>' + txt(48, 66, '0' + (idx + 1) + ' — ' + sc.name, { size: 15, ls: 5, weight: 700, fill: '#fdb5c6' }) + '</g>';
    s += txt(1232, 66, 'neV.BOOSTER', { anchor: 'end', size: 17, weight: 800, ls: 2, fill: '#fdb5c6', op: .75 });
    if (!tall) CAPTIONS.forEach(c => {
      const k = seg(t, c.a, c.a + .45) * (1 - seg(t, c.b - .4, c.b));
      if (k > 0) s += '<g opacity="' + f(k) + '"><rect x="0" y="672" width="1280" height="48" fill="#0c0305" opacity=".55"/>' + txt(640, 704, c.s, { anchor: 'middle', size: 23, weight: 600, fill: '#ffeaef' }) + '</g>';
    });
    if (!tall) s += '<rect x="0" y="716" width="' + f(W * t / DURATION) + '" height="4" fill="url(#gV)"/>';
    return s;
  }

  const DEFS = '<defs>' +
    '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '<linearGradient id="gV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fdb5c6"/><stop offset="1" stop-color="#ed3a5e"/></linearGradient>' +
    '<linearGradient id="gLogoL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdb5c6"/><stop offset="1" stop-color="#ed3a5e"/></linearGradient>' +
    '<linearGradient id="gLogoR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fa8ba4"/><stop offset="1" stop-color="#b6213e"/></linearGradient>' +
    '<linearGradient id="gLogoV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffc6d3"/></linearGradient>' +
    '<linearGradient id="scanG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdb5c6" stop-opacity="0"/><stop offset="1" stop-color="#fdb5c6" stop-opacity=".9"/></linearGradient>' +
    '<linearGradient id="cardG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#691b2d"/><stop offset="1" stop-color="#2c0a12"/></linearGradient>' +
    '<linearGradient id="boxG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6213e"/><stop offset="1" stop-color="#661426"/></linearGradient>' +
    '<linearGradient id="beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd5dc" stop-opacity=".85"/><stop offset="1" stop-color="#fa8ba4" stop-opacity="0"/></linearGradient>' +
    '</defs>';

  /* ============================================================
     MONTAGE DANS LA PAGE
     ============================================================ */
  function fmt(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + (s < 10 ? '0' : '') + s; }

  function mount(root, opts) {
    opts = opts || {};
    root.classList.add('reveil');
    if (opts.fit === 'screen') root.classList.add('rv-screen');
    const controls = opts.controls !== false;
    root.innerHTML =
      '<div class="rv-stage"><svg class="rv-svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Animation : un jeune homme ignoré par les filles se réveille, tire des cartes d’exercices, se transforme grâce à la régularité et devient la référence.">' +
      DEFS + '<g class="rv-scenes">' + SCENES.map(() => '<g></g>').join('') + '</g><g class="rv-hud"></g></svg>' +
      '<div class="rv-hcap" aria-live="off"><p></p></div><div class="rv-hbar"><i></i></div></div>' +
      (controls ? '<div class="rv-ui"><button class="rv-btn" type="button" aria-label="Lecture / pause">▶</button><input class="rv-range" type="range" min="0" max="' + DURATION + '" step="0.01" value="0" aria-label="Position"><span class="rv-time">0:00</span>' +
        '<div class="rv-chap">' + SCENES.map((sc, i) => '<button type="button" data-i="' + i + '" title="' + sc.name + '">' + (i + 1) + '</button>').join('') + '</div></div>' : '');

    const groups = Array.prototype.slice.call(root.querySelectorAll('.rv-scenes > g'));
    const hudG = root.querySelector('.rv-hud');
    const btn = root.querySelector('.rv-btn'), range = root.querySelector('.rv-range'), tlab = root.querySelector('.rv-time');
    let t = 0, playing = false, last = 0, raf = 0, ended = false;
    const loop = opts.loop !== false;
    const svg = root.querySelector('.rv-svg'), hcap = root.querySelector('.rv-hcap p'), hbar = root.querySelector('.rv-hbar i');
    const screenMode = opts.fit === 'screen';
    let asp = W / H, tall = false;
    function measure() {
      if (!screenMode) { asp = W / H; tall = false; } else { const r = root.getBoundingClientRect(); asp = r.width > 0 && r.height > 0 ? r.width / r.height : W / H; tall = asp < 1.1; }
      root.classList.toggle('tall', tall);
    }
    measure();
    if (screenMode) { if ('ResizeObserver' in global) new ResizeObserver(() => { measure(); draw(t); }).observe(root); else global.addEventListener('resize', () => { measure(); draw(t); }); }

    function draw(tt) {
      t = clamp(tt, 0, DURATION);
      SCENES.forEach((sc, i) => {
        const g = groups[i];
        const aIn = i === 0 ? 1 : eo(seg(t, sc.a, sc.a + FADE));
        const aOut = i === SCENES.length - 1 ? 1 : 1 - seg(t, sc.b, sc.b + FADE);
        const al = Math.min(aIn, aOut);
        if (al > 0.002 && t >= sc.a - 0.0001 && t <= sc.b + FADE) { g.innerHTML = SCENE_FN[i](t); g.setAttribute('opacity', f(al)); g.style.display = ''; g._on = true; }
        else if (g._on !== false) { g.innerHTML = ''; g.style.display = 'none'; g._on = false; }
      });
      hudG.innerHTML = hud(t, tall);
      if (screenMode) {
        const wv = windowFor(t, asp); svg.setAttribute('viewBox', f(wv[0]) + ' ' + f(wv[1]) + ' ' + f(wv[2]) + ' ' + f(wv[3]));
        if (tall) { let best = null, bk = 0; CAPTIONS.forEach(c => { const k = seg(t, c.a, c.a + .45) * (1 - seg(t, c.b - .4, c.b)); if (k > bk) { bk = k; best = c; } }); if (best) { if (hcap.textContent !== best.s) hcap.textContent = best.s; } hcap.style.opacity = f(bk); hbar.style.width = (100 * t / DURATION).toFixed(2) + '%'; }
      }
      if (range) { range.value = t; tlab.textContent = fmt(t) + ' / ' + fmt(DURATION); }
    }
    function ui() { if (btn) btn.textContent = playing ? '❚❚' : '▶'; root.classList.toggle('paused', !playing); }
    function tick(ts) {
      if (!playing) return;
      const dt = Math.min(0.1, (ts - last) / 1000); last = ts; t += dt;
      if (t >= DURATION) { if (loop) t = 0; else { t = DURATION; playing = false; ui(); if (!ended) { ended = true; if (typeof opts.onend === 'function') opts.onend(); } } }
      draw(t); raf = requestAnimationFrame(tick);
    }
    const api = {
      duration: DURATION, scenes: SCENES,
      setTime: draw,
      play() { if (t >= DURATION) t = 0; ended = false; playing = true; last = performance.now(); ui(); raf = requestAnimationFrame(tick); },
      pause() { playing = false; cancelAnimationFrame(raf); ui(); },
      toggle() { playing ? api.pause() : api.play(); },
      seek(x) { draw(x); }
    };
    if (btn) btn.addEventListener('click', api.toggle);
    if (range) range.addEventListener('input', () => { api.pause(); draw(parseFloat(range.value)); });
    root.querySelectorAll('.rv-chap button').forEach(b => b.addEventListener('click', () => { api.pause(); draw(SCENES[+b.dataset.i].a + .6); }));
    draw(0); ui();

    const reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (opts.autoplay && !reduce) {
      if ('IntersectionObserver' in global) {
        new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { if (!playing) api.play(); } else if (playing) api.pause(); }), { threshold: .35 }).observe(root);
      } else api.play();
    }
    root._reveil = api;
    return api;
  }

  global.NevReveil = { mount: mount, DURATION: DURATION, SCENES: SCENES };

  function auto() {
    document.querySelectorAll('[data-reveil]').forEach(el => {
      const api = mount(el, { autoplay: el.dataset.autoplay === 'true', loop: el.dataset.loop !== 'false', controls: el.dataset.controls !== 'false' });
      if (!global.nevReveilApi) global.nevReveilApi = api;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
