/* ==========================================================
   neV.BOOSTER — hero.js
   Le jeune homme qui évolue : 6 paliers, du maigrichon à la légende.
   Le corps est calculé (pas des images) : chaque morphologie est une
   interpolation continue, donc la transformation est animée en douceur.
   - NEV.Hero.mount(el, {stage, aura})  → {setStage, growTo, powerUp, setAura, destroy}
   - powerUp() : aura qui s'emballe, ondes de choc, éclairs, débris.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const doc = g.document;

  // paliers 1 → 6
  const T = {
    sw: [23, 27, 32, 37, 42, 47],      // demi-largeur d'épaules
    ch: [18, 21, 25, 29, 33, 36],      // poitrine
    wa: [14, 15, 16, 16.5, 17, 17],    // taille
    ar: [5, 6.2, 7.8, 9.4, 11, 12.6],  // rayon du bras
    th: [8.5, 10, 11.5, 13, 14.5, 16]  // rayon de la cuisse
  };
  const at = (arr, k) => {
    k = Math.min(6, Math.max(1, k));
    const i = Math.min(4, Math.floor(k - 1)), f = k - 1 - i;
    return arr[i] + (arr[i + 1] - arr[i]) * f;
  };
  let uid = 0;

  function aura(id) { return NEV.Rewards ? NEV.Rewards.aura(id) : { c: ['#e0455f', '#7a0f26'] }; }

  /* Dessin complet du héros pour un palier k (nombre à virgule accepté). */
  function svg(k, auraId, opt) {
    opt = opt || {};
    const id = 'hr' + (++uid);
    const sw = at(T.sw, k), ch = at(T.ch, k), wa = at(T.wa, k), ar = at(T.ar, k), th = at(T.th, k);
    const m = Math.min(1, Math.max(0, (k - 1) / 5));                 // 0 → 1 : musculature
    const slouch = Math.max(0, 2.2 - k) * 4;                        // dos voûté au début
    const A = aura(auraId).c;
    const X = (dx) => (150 + dx).toFixed(1);
    const sy = 120 + slouch * 0.5;                                  // hauteur des épaules
    const hy = 84 + slouch;                                         // hauteur de la tête
    const elbow = sw + 3 + k * 1.2, hand = sw + 5 + k * 1.7;
    const legx = wa * 0.55 + 1;
    const auraOp = (0.18 + 0.13 * k) * (opt.auraBoost || 1);

    let s = '<svg class="hero-svg" viewBox="0 0 300 380" role="img" aria-label="Le héros, palier ' + Math.round(k) + '">';
    s += '<defs>' +
      '<linearGradient id="' + id + 'sk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d2b4"/><stop offset=".6" stop-color="#e9b48f"/><stop offset="1" stop-color="#c98d68"/></linearGradient>' +
      '<linearGradient id="' + id + 'sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3213f"/><stop offset="1" stop-color="#5a0b1d"/></linearGradient>' +
      '<radialGradient id="' + id + 'au" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="' + A[0] + '" stop-opacity=".0"/><stop offset=".55" stop-color="' + A[0] + '" stop-opacity=".55"/><stop offset="1" stop-color="' + A[1] + '" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + 'fl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + A[1] + '" stop-opacity=".9"/><stop offset=".55" stop-color="' + A[0] + '" stop-opacity=".75"/><stop offset="1" stop-color="' + A[0] + '" stop-opacity="0"/></linearGradient>' +
      '<filter id="' + id + 'bl"><feGaussianBlur stdDeviation="3"/></filter></defs>';

    // sol et ombre
    s += '<ellipse cx="150" cy="354" rx="' + (62 + k * 5) + '" ry="9" fill="#000" opacity=".45"/>';

    // aura (derrière le corps)
    s += '<g class="hero-aura" style="opacity:' + auraOp.toFixed(2) + '">' +
      '<ellipse cx="150" cy="215" rx="108" ry="170" fill="url(#' + id + 'au)"/>';
    for (let i = 0; i < 7; i++) {
      const x = 150 + (i - 3) * 24, h = 120 + (3 - Math.abs(i - 3)) * 36 + (i % 2) * 14;
      s += '<path class="hero-flame f' + (i % 3) + '" style="animation-delay:' + (i * 0.13).toFixed(2) + 's" d="M' + x + ' 350 C' + (x - 26) + ' ' + (350 - h * 0.4) + ' ' + (x - 6) + ' ' + (350 - h * 0.7) + ' ' + x + ' ' + (350 - h) + ' C' + (x + 6) + ' ' + (350 - h * 0.7) + ' ' + (x + 26) + ' ' + (350 - h * 0.4) + ' ' + x + ' 350Z" fill="url(#' + id + 'fl)"/>';
    }
    s += '</g>';

    s += '<g class="hero-body">';
    // jambes
    const kneeY = 290, ankY = 344, hipY = 228;
    [-1, 1].forEach(function (d) {
      s += '<path d="M' + X(d * legx) + ' ' + hipY + ' L' + X(d * (legx + 2)) + ' ' + kneeY + '" stroke="url(#' + id + 'sk)" stroke-width="' + (th * 2).toFixed(1) + '" stroke-linecap="round" fill="none"/>';
      s += '<path d="M' + X(d * (legx + 2)) + ' ' + kneeY + ' L' + X(d * (legx + 1)) + ' ' + ankY + '" stroke="url(#' + id + 'sk)" stroke-width="' + (th * 1.55).toFixed(1) + '" stroke-linecap="round" fill="none"/>';
      s += '<ellipse cx="' + X(d * (legx + 3)) + '" cy="351" rx="15" ry="6.5" fill="#fff1f2"/><ellipse cx="' + X(d * (legx + 3)) + '" cy="354" rx="15" ry="3" fill="#7a0f26"/>';
    });
    // torse
    const sx = sw, sy2 = sy;
    s += '<path d="M' + X(-10) + ' 104 L' + X(10) + ' 104 Q' + X(sx * 0.9) + ' ' + (sy2 - 8) + ' ' + X(sx) + ' ' + sy2 +
      ' Q' + X(ch + 4) + ' 140 ' + X(ch) + ' 162 Q' + X(wa + 1) + ' 186 ' + X(wa) + ' 208 L' + X(wa + 4) + ' 230 L' + X(-wa - 4) + ' 230 L' + X(-wa) + ' 208 Q' + X(-wa - 1) + ' 186 ' + X(-ch) + ' 162 Q' + X(-ch - 4) + ' 140 ' + X(-sx) + ' ' + sy2 +
      ' Q' + X(-sx * 0.9) + ' ' + (sy2 - 8) + ' ' + X(-10) + ' 104Z" fill="url(#' + id + 'sk)"/>';
    // pectoraux, abdominaux
    s += '<g fill="none" stroke="#7a3a2a" stroke-linecap="round">' +
      '<path d="M' + X(-1) + ' 130 Q' + X(-ch * 0.55) + ' 124 ' + X(-ch * 0.92) + ' 144 Q' + X(-ch * 0.5) + ' 160 ' + X(-1) + ' 154" stroke-width="1.6" opacity="' + (0.08 + 0.4 * m).toFixed(2) + '"/>' +
      '<path d="M' + X(1) + ' 130 Q' + X(ch * 0.55) + ' 124 ' + X(ch * 0.92) + ' 144 Q' + X(ch * 0.5) + ' 160 ' + X(1) + ' 154" stroke-width="1.6" opacity="' + (0.08 + 0.4 * m).toFixed(2) + '"/>';
    const ab = Math.max(0, (k - 2.2) / 3.8);
    if (ab > 0) {
      s += '<path d="M150 158 L150 226" stroke-width="1.4" opacity="' + (0.5 * ab).toFixed(2) + '"/>';
      [172, 187, 202, 216].forEach(function (y, i) { s += '<path d="M' + X(-wa * 0.62) + ' ' + y + ' Q150 ' + (y + 3) + ' ' + X(wa * 0.62) + ' ' + y + '" stroke-width="1.3" opacity="' + (0.5 * ab).toFixed(2) + '"/>'; });
    } else {
      s += '<path d="M' + X(-ch * 0.6) + ' 150 l' + (ch * 0.3).toFixed(1) + ' 3M' + X(-ch * 0.62) + ' 158 l' + (ch * 0.3).toFixed(1) + ' 3M' + X(ch * 0.6) + ' 150 l' + (-ch * 0.3).toFixed(1) + ' 3M' + X(ch * 0.62) + ' 158 l' + (-ch * 0.3).toFixed(1) + ' 3" stroke-width="1" opacity=".35"/>'; // côtes visibles
    }
    s += '</g>';
    // short
    s += '<path d="M' + X(-wa - 5) + ' 214 L' + X(wa + 5) + ' 214 L' + X(legx + th + 4) + ' 274 L' + X(4) + ' 274 L150 254 L' + X(-4) + ' 274 L' + X(-legx - th - 4) + ' 274Z" fill="url(#' + id + 'sh)"/>' +
      '<path d="M' + X(-wa - 5) + ' 214 L' + X(wa + 5) + ' 214" stroke="#ff8a3d" stroke-width="3"/>';
    // bras
    [-1, 1].forEach(function (d) {
      const sx0 = d * (sw - 3), ex = d * elbow, hx = d * hand;
      s += '<path d="M' + X(sx0) + ' ' + (sy + 4) + ' L' + X(ex) + ' 180" stroke="url(#' + id + 'sk)" stroke-width="' + (ar * 2).toFixed(1) + '" stroke-linecap="round" fill="none"/>';
      s += '<path d="M' + X(ex) + ' 180 L' + X(hx) + ' 236" stroke="url(#' + id + 'sk)" stroke-width="' + (ar * 1.7).toFixed(1) + '" stroke-linecap="round" fill="none"/>';
      s += '<circle cx="' + X(sx0) + '" cy="' + (sy + 6) + '" r="' + (ar * 1.3).toFixed(1) + '" fill="url(#' + id + 'sk)"/>';
      s += '<circle cx="' + X(hx) + '" cy="240" r="' + (ar * 0.95).toFixed(1) + '" fill="#e9b48f"/>';
      if (m > 0.25) s += '<path d="M' + X(sx0 + d * ar * 0.2) + ' ' + (sy + 14) + ' Q' + X(sx0 + d * ar * 1.1) + ' 150 ' + X(ex - d * ar * 0.2) + ' 168" stroke="#7a3a2a" stroke-width="1.3" opacity="' + (0.35 * m).toFixed(2) + '" fill="none" stroke-linecap="round"/>';
    });
    // cou et tête
    s += '<rect x="' + X(-8.5) + '" y="' + (hy + 12) + '" width="17" height="' + Math.max(8, sy - hy - 8) + '" rx="6" fill="#d9a07a"/>';
    s += '<g class="hero-head" transform="rotate(' + (slouch * 0.18).toFixed(1) + ' 150 ' + (hy + 10) + ')">' +
      '<ellipse cx="132.5" cy="' + (hy + 2) + '" rx="3.6" ry="5.2" fill="#dba27d"/><ellipse cx="167.5" cy="' + (hy + 2) + '" rx="3.6" ry="5.2" fill="#dba27d"/>' +
      '<path d="M133 ' + (hy - 4) + ' Q133 ' + (hy + 24) + ' 150 ' + (hy + 25) + ' Q167 ' + (hy + 24) + ' 167 ' + (hy - 4) + ' Q167 ' + (hy - 22) + ' 150 ' + (hy - 22) + ' Q133 ' + (hy - 22) + ' 133 ' + (hy - 4) + 'Z" fill="url(#' + id + 'sk)"/>' +
      // cheveux
      '<path d="M132 ' + (hy - 3) + ' Q130 ' + (hy - 28) + ' 150 ' + (hy - 28) + ' Q170 ' + (hy - 28) + ' 168 ' + (hy - 3) + ' Q164 ' + (hy - 14) + ' 150 ' + (hy - 15) + ' Q136 ' + (hy - 14) + ' 132 ' + (hy - 3) + 'Z" fill="#241210"/>';
    if (k >= 4.4) s += '<path d="M138 ' + (hy - 24) + ' L142 ' + (hy - 38) + ' L148 ' + (hy - 27) + ' L152 ' + (hy - 40) + ' L157 ' + (hy - 27) + ' L163 ' + (hy - 36) + ' L163 ' + (hy - 22) + 'Z" fill="#241210"/>';
    const fierce = Math.min(1, Math.max(0, (k - 2) / 3));
    s += '<ellipse cx="143" cy="' + (hy + 1) + '" rx="2.2" ry="' + (2.6 - fierce * 0.9).toFixed(1) + '" fill="#1a0a0a"/><ellipse cx="157" cy="' + (hy + 1) + '" rx="2.2" ry="' + (2.6 - fierce * 0.9).toFixed(1) + '" fill="#1a0a0a"/>' +
      '<path d="M138 ' + (hy - 6 + fierce * 1.2).toFixed(1) + ' L147 ' + (hy - 5 - fierce * 1.2).toFixed(1) + 'M162 ' + (hy - 6 + fierce * 1.2).toFixed(1) + ' L153 ' + (hy - 5 - fierce * 1.2).toFixed(1) + '" stroke="#241210" stroke-width="2.2" stroke-linecap="round"/>' +
      (k < 2.5 ? '<path d="M145 ' + (hy + 14) + ' Q150 ' + (hy + 12) + ' 155 ' + (hy + 14) + '" stroke="#7a3a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
        : '<path d="M143 ' + (hy + 13) + ' Q150 ' + (hy + 17 + fierce * 2) + ' 157 ' + (hy + 13) + '" stroke="#7a3a2a" stroke-width="1.9" fill="none" stroke-linecap="round"/>') +
      '</g></g>';

    // effets de montée en puissance (cachés hors animation)
    s += '<g class="hero-fx" aria-hidden="true">' +
      '<circle class="ring r1" cx="150" cy="215" r="60" fill="none" stroke="' + A[0] + '" stroke-width="5"/>' +
      '<circle class="ring r2" cx="150" cy="215" r="60" fill="none" stroke="#fff" stroke-width="3"/>' +
      '<circle class="ring r3" cx="150" cy="215" r="60" fill="none" stroke="' + A[1] + '" stroke-width="8"/>';
    const bolts = [[40, 90, 62, 130, 48, 138, 74, 188], [262, 70, 238, 118, 252, 126, 226, 176], [60, 250, 84, 280, 72, 286, 98, 330], [240, 240, 216, 272, 228, 278, 204, 326]];
    bolts.forEach(function (b, i) { s += '<polyline class="bolt b' + (i % 2) + '" points="' + b.join(' ') + '" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 5px ' + A[0] + ')"/>'; });
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 27 + (i % 2) * 8, sz = 4 + (i % 3) * 2;
      s += '<polygon class="deb" style="--dx:' + ((i % 2 ? 1 : -1) * (6 + i * 2)) + 'px;animation-delay:' + (i * 0.07).toFixed(2) + 's" points="' + x + ',350 ' + (x + sz) + ',' + (350 - sz) + ' ' + (x + sz * 2) + ',350" fill="#5a2a30"/>';
    }
    s += '</g></svg>';
    return s;
  }

  /* Monte le héros dans un élément. */
  function mount(el, o) {
    o = o || {};
    let k = Math.max(1, Math.min(6, o.stage || 1)), auraId = o.aura || 'none', raf = 0, busy = false;
    el.classList.add('hero-wrap');
    const draw = function (kk, boost) { el.innerHTML = svg(kk == null ? k : kk, auraId, { auraBoost: boost }); };
    draw();
    const api = {
      get stage() { return k; },
      setStage(n) { k = n; draw(); },
      setAura(id) { auraId = id; draw(); },
      /* Transformation animée d'un palier à l'autre. */
      growTo(n, ms) {
        return new Promise(function (resolve) {
          const from = k, to = n, t0 = performance.now(), dur = ms || 2200;
          cancelAnimationFrame(raf);
          const step = function (t) {
            const f = Math.min(1, (t - t0) / dur), e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
            draw(from + (to - from) * e, 1 + 1.2 * Math.sin(f * Math.PI));
            if (f < 1) raf = requestAnimationFrame(step); else { k = to; draw(); resolve(); }
          };
          if (NEV.util.reduced()) { k = to; draw(); resolve(); return; }
          raf = requestAnimationFrame(step);
        });
      },
      /* Montée en puissance : aura qui s'emballe, ondes, éclairs, débris. */
      powerUp() {
        if (busy) return Promise.resolve();
        busy = true;
        const s = el.querySelector('.hero-svg');
        if (s) s.classList.add('pu');
        return new Promise(function (resolve) {
          setTimeout(function () { const s2 = el.querySelector('.hero-svg'); if (s2) s2.classList.remove('pu'); busy = false; resolve(); }, NEV.util.reduced() ? 50 : 2900);
        });
      },
      destroy() { cancelAnimationFrame(raf); el.innerHTML = ''; }
    };
    return api;
  }

  NEV.Hero = { mount, svg };
})(window);
