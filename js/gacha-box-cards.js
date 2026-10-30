/* ==========================================================
   neV.BOOSTER — gacha-box-cards.js
   Dessine, sur un canvas, les cartes de la Gacha Box EXACTEMENT comme les cartes du site (css/card.css) :
   cadre dégradé selon la rareté (Commun gris, Rare violet, Épique rose, Légendaire or, Mythique rouge),
   pastille N / R / SR / UR / MR, étoiles, zone d'illustration, nom, pastilles (difficulté + muscles),
   plan « 3 séries × 15 rép. », pied de carte. La carte COMBO reprend le cadre « spécial » (blanc / rouge).
   Le dos reprend le dos des cartes du site (or + bordeaux).
   Les mesures sont celles du CSS : 1 cqw = 0,948 % de la largeur de la carte.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});

  const FW = 640, FH = 947;                 // proportions 5 / 7,4 comme .tcard
  const Q = FW * 0.948 / 100;               // 1 cqw
  const FONT = (w, s) => w + ' ' + s + 'px Montserrat, system-ui, sans-serif';

  /* ---------- petits outils de dessin ---------- */
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function rgba(h, a) { const c = rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mix(a, b, t) { const x = rgb(a), y = rgb(b); return 'rgb(' + Math.round(x[0] * t + y[0] * (1 - t)) + ',' + Math.round(x[1] * t + y[1] * (1 - t)) + ',' + Math.round(x[2] * t + y[2] * (1 - t)) + ')'; }
  /* dégradé linéaire « CSS » : angle en degrés (0 = vers le haut, 90 = vers la droite) */
  function cssLin(c, x, y, w, h, deg, stops) {
    const a = deg * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), len = Math.abs(w * dx) + Math.abs(h * dy), cx = x + w / 2, cy = y + h / 2;
    const gr = c.createLinearGradient(cx - dx * len / 2, cy - dy * len / 2, cx + dx * len / 2, cy + dy * len / 2);
    stops.forEach((s) => gr.addColorStop(s[0], s[1])); return gr;
  }
  function conic(c, fromDeg, stops, fallback) {
    if (!c.createConicGradient) return fallback;
    const gr = c.createConicGradient((fromDeg - 90) * Math.PI / 180, FW / 2, FH / 2);
    stops.forEach((s) => gr.addColorStop(s[0], s[1])); return gr;
  }
  function spaced(c, text, x, y, sp, align) {
    const chars = Array.from(text); let w = 0;
    chars.forEach((ch) => { w += c.measureText(ch).width + sp; }); w -= sp;
    let cx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    chars.forEach((ch) => { c.fillText(ch, cx, y); cx += c.measureText(ch).width + sp; });
    return w;
  }
  function spacedW(c, text, sp) { let w = 0; Array.from(text).forEach((ch) => { w += c.measureText(ch).width + sp; }); return Math.max(0, w - sp); }
  function wrap(c, text, maxW) {
    const words = String(text).split(/\s+/), lines = []; let cur = '';
    words.forEach((w) => { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines;
  }
  function fit(c, text, maxW, maxLines, size, minSize, weight) {
    let s = size, lines;
    do { c.font = FONT(weight, s); lines = wrap(c, text, maxW); s -= 2; } while ((lines.length > maxLines || lines.some((l) => c.measureText(l).width > maxW)) && s > minSize);
    return { lines, size: s + 2 };
  }
  function star(c, cx, cy, R) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.42 : R; c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    c.closePath();
  }
  function pill(c, x, y, w, h, fill, stroke) {
    rr(c, x, y, w, h, h / 2); c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; rr(c, x + 1, y + 1, w - 2, h - 2, h / 2 - 1); c.stroke(); }
  }

  /* ---------- emblème neV.BOOSTER (celui du dos des cartes) : cercle + « N » doré ---------- */
  function emblem(c, cx, cy, r, withRing) {
    c.save(); c.translate(cx, cy); c.scale(r / 30, r / 30); c.translate(-50, -70);
    const gold = c.createLinearGradient(20, 40, 80, 100); gold.addColorStop(0, '#f6d58a'); gold.addColorStop(1, '#c07a1c');
    c.beginPath(); c.arc(50, 70, 30, 0, Math.PI * 2); c.fillStyle = '#2a0a14'; c.fill(); c.strokeStyle = gold; c.lineWidth = 2.2; c.stroke();
    if (withRing !== false) { c.setLineDash([2, 3]); c.strokeStyle = '#e0455f'; c.lineWidth = 1; c.beginPath(); c.arc(50, 70, 24, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
    const gn = c.createLinearGradient(32, 56, 68, 86); gn.addColorStop(0, '#f6d58a'); gn.addColorStop(1, '#c07a1c');
    c.strokeStyle = gn; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(new Path2D('M32 86V56l12 22 6-12 6 12 12-22v30'));
    c.restore();
  }

  /* ---------- la face ---------- */
  /* d : { kind:'single'|'combo', title, rar:{id,code,name,color,color2,glow,stars}, diff, muscles:[…], sets, amount, doubled, steps:[{big,unit,sets,name}] }
     Renvoie les rectangles utiles (zone d'illustration) pour poser la figure animée par-dessus. */
  function drawFront(cv, d) {
    const c = cv.getContext('2d'), sc = cv.width / FW;
    c.setTransform(sc, 0, 0, sc, 0, 0); c.clearRect(0, 0, FW, FH); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    const combo = d.kind === 'combo', r = d.rar;
    const out = { art: null };
    /* cadre extérieur */
    const R0 = 0.065 * FW;
    rr(c, 0, 0, FW, FH, R0);
    c.fillStyle = combo ? conic(c, 20, [[0, '#ffffff'], [0.25, '#ff2400'], [0.5, '#ffffff'], [0.75, '#ff2400'], [1, '#ffffff']], cssLin(c, 0, 0, FW, FH, 135, [[0, '#ffffff'], [0.5, '#ff2400'], [1, '#ffffff']]))
      : r.id === 'mythique' ? conic(c, 0, [[0, '#ff4040'], [0.25, '#8a0a16'], [0.5, '#ff1f2d'], [0.75, '#ffb3b3'], [1, '#ff4040']], cssLin(c, 0, 0, FW, FH, 150, [[0, r.color], [0.55, r.color2], [1, r.color]]))
      : cssLin(c, 0, 0, FW, FH, 150, [[0, r.color], [0.55, r.color2], [1, r.color]]);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,.65)'; c.lineWidth = 2; rr(c, 1, 1, FW - 2, FH - 2, R0); c.stroke();
    /* intérieur sombre */
    const P = 0.026 * FW, ix = P, iy = P, iw = FW - 2 * P, ih = FH - 2 * P, ir = 4.6 * Q;
    rr(c, ix, iy, iw, ih, ir);
    c.fillStyle = combo ? cssLin(c, ix, iy, iw, ih, 170, [[0, mix(r.color2, '#12070b', 0.55)], [0.72, '#0b0507'], [1, '#0b0507']]) : cssLin(c, ix, iy, iw, ih, 170, [[0, '#2f1019'], [0.7, '#12070b'], [1, '#12070b']]);
    c.fill();
    c.save(); rr(c, ix, iy, iw, ih, ir); c.clip();
    /* reflet d'angle (comme le ::before des cartes spéciales) */
    if (combo) { const rg = c.createRadialGradient(FW * 0.8, FH * 0.1, 0, FW * 0.8, FH * 0.1, FW * 0.6); rg.addColorStop(0, 'rgba(255,255,255,.28)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = rg; c.fillRect(0, 0, FW, FH); }

    const pad = 4 * Q, x0 = ix + pad, cw = iw - 2 * pad, y0 = iy + pad, gap = 2.4 * Q, ch = ih - 2 * pad;
    /* -- ligne du haut : pastille de code + étoiles */
    const topH = 58;
    c.font = FONT(900, combo ? 5.6 * Q : 7.4 * Q);
    const code = combo ? 'COMBO' : r.code, cwid = combo ? spacedW(c, code, 0.06 * 5.6 * Q) : spacedW(c, code, 0.04 * 7.4 * Q);
    const bw = cwid + 6.8 * Q, bh = combo ? topH - 14 : topH - 2, by = y0 + (topH - bh) / 2;
    rr(c, x0, by, bw, bh, 2.6 * Q); c.fillStyle = cssLin(c, x0, by, bw, bh, 135, [[0, combo ? '#ffffff' : r.color], [1, combo ? '#ff2400' : r.color2]]); c.fill();
    c.fillStyle = '#1a0508'; c.textBaseline = 'middle'; spaced(c, code, x0 + 3.4 * Q, by + bh / 2 + 2, combo ? 0.06 * 5.6 * Q : 0.04 * 7.4 * Q, 'left');
    const n = 5, step = 6.6 * Q * 1.04 + 2, sr = 6.6 * Q * 0.46;
    for (let i = 0; i < n; i++) {
      const sx = x0 + cw - (n - 1 - i) * step - sr, sy = y0 + topH / 2;
      star(c, sx, sy, sr);
      if (i < r.stars) { c.shadowColor = r.glow; c.shadowBlur = 3 * Q; c.fillStyle = r.color; } else { c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,255,.13)'; }
      c.fill(); c.shadowBlur = 0;
    }
    c.textBaseline = 'alphabetic';

    /* -- pied de carte (mesuré d'abord, pour savoir la place restante) */
    const footH = 31, footY = y0 + ch - footH;
    /* -- nom */
    const nm = fit(c, d.title, cw, 2, 8.6 * Q, 6 * Q, 900), nameLH = nm.size * 1.1, nameH = nm.lines.length * nameLH;
    /* -- pastilles */
    const tagsH = 46, tagFont = 5.1 * Q;
    const tags = [];
    if (d.diff) tags.push({ t: d.diff, hot: true });
    (d.muscles || []).slice(0, combo ? 0 : 2).forEach((m) => tags.push({ t: m }));
    if (combo) tags.push({ t: (d.steps ? d.steps.length : 0) + ' exercices' });
    c.font = FONT(700, tagFont);
    tags.forEach((tg) => { c.font = FONT(tg.hot ? 900 : 700, tagFont); tg.w = c.measureText(tg.t).width + 4.8 * Q + 4; });
    let tw = tags.reduce((a, t) => a + t.w, 0) + (tags.length - 1) * 1.6 * Q;
    while (tw > cw && tags.length > 1) { tags.pop(); tw = tags.reduce((a, t) => a + t.w, 0) + (tags.length - 1) * 1.6 * Q; }
    /* -- plan (carte simple) */
    const planH = combo ? 0 : 6 * Q * 1.22 + 2.8 * Q;

    if (!combo) {
      const artY = y0 + topH + gap, artBottom = footY - gap - planH - gap - tagsH - gap - nameH - gap;
      const ah = Math.max(120, artBottom - artY);
      out.art = { x: x0, y: artY, w: cw, h: ah, r: 3.4 * Q };
      c.save(); rr(c, x0, artY, cw, ah, 3.4 * Q); c.clip();
      c.translate(x0 + cw * 0.5, artY + ah * 1.05); c.scale(cw * 1.2, ah * 0.9);
      const rg = c.createRadialGradient(0, 0, 0, 0, 0, 1); rg.addColorStop(0, mix(r.color, '#22090f', 0.38)); rg.addColorStop(0.7, '#130609'); rg.addColorStop(1, '#130609');
      c.fillStyle = rg; c.fillRect(-2, -2, 4, 4); c.restore();
      c.strokeStyle = rgba(r.color, 0.35); c.lineWidth = 2; rr(c, x0 + 1, artY + 1, cw - 2, ah - 2, 3.4 * Q); c.stroke();
    }

    /* -- nom (centré) */
    let y = combo ? y0 + topH + gap : y0 + topH + gap + out.art.h + gap;
    c.font = FONT(900, nm.size); c.fillStyle = combo ? '#ffffff' : '#fff1f2'; c.textAlign = 'center';
    if (combo) { c.shadowColor = '#ff2400'; c.shadowBlur = 3 * Q; }
    nm.lines.forEach((l, i) => c.fillText(l, x0 + cw / 2, y + nm.size * 0.88 + i * nameLH)); c.shadowBlur = 0; c.textAlign = 'left';
    y += nameH + gap;
    /* -- pastilles */
    let tx = x0 + (cw - tw) / 2;
    tags.forEach((tg) => {
      if (tg.hot) { pill(c, tx, y, tg.w, tagsH, cssLin(c, tx, y, tg.w, tagsH, 135, [[0, r.color], [1, r.color2]])); c.fillStyle = '#1a0508'; c.font = FONT(900, tagFont); }
      else { pill(c, tx, y, tg.w, tagsH, 'rgba(255,255,255,.063)', 'rgba(255,255,255,.1)'); c.fillStyle = '#f6d0d6'; c.font = FONT(700, tagFont); }
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tg.t, tx + tg.w / 2, y + tagsH / 2 + 1); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      tx += tg.w + 1.6 * Q;
    });
    y += tagsH + gap;

    if (!combo) {
      /* -- plan : « 3 séries × 15 rép. » */
      rr(c, x0, y, cw, planH, 2.6 * Q); c.fillStyle = 'rgba(0,0,0,.25)'; c.fill();
      const runs = [{ t: String(d.sets), b: true }, { t: ' séries × ' }, { t: d.amount, b: true }];
      if (d.doubled) runs.push({ t: '  ×2', em: true });
      let fs = 6 * Q, total;
      const meas = () => runs.reduce((a, rn) => { c.font = FONT(rn.b || rn.em ? 800 : 500, fs); return a + c.measureText(rn.t).width; }, 0);
      total = meas(); while (total > cw - 3 * Q && fs > 3.5 * Q) { fs -= 1; total = meas(); }
      let px = x0 + (cw - total) / 2; c.textBaseline = 'middle';
      runs.forEach((rn) => { c.font = FONT(rn.b || rn.em ? 800 : 500, fs); c.fillStyle = rn.em ? '#ff8a3d' : rn.b ? r.color : '#ffe1e5'; c.fillText(rn.t, px, y + planH / 2 + 1); px += c.measureText(rn.t).width; });
      c.textBaseline = 'alphabetic';
    } else {
      /* -- liste des exercices du combo */
      const sh = footY - gap - y, rows = d.steps || [], rh = Math.min(150, sh / Math.max(1, rows.length));
      rows.forEach((s, i) => {
        const ry = y + i * rh + (sh - rh * rows.length) / 2;
        c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, ry); c.lineTo(x0 + cw, ry); c.stroke();
        const bs = Math.min(10 * Q, rh * 0.52); c.font = FONT(900, bs); c.fillStyle = r.color; c.shadowColor = rgba(r.color, 0.55); c.shadowBlur = 3 * Q;
        const num = String(s.big), nw = c.measureText(num).width, base = ry + rh * 0.62; c.fillText(num, x0, base); c.shadowBlur = 0;
        c.font = FONT(800, 4.2 * Q); c.fillStyle = '#ffb3bd'; const un = (s.unit + ' × ' + s.sets).toUpperCase(); spaced(c, un, x0 + Math.max(nw, 12 * Q) + 2.4 * Q, base - 2, 1.4, 'left');
        c.font = FONT(700, Math.min(5.8 * Q, rh * 0.3)); c.fillStyle = '#ffe1e5'; c.textAlign = 'right';
        const ln = wrap(c, s.name, cw * 0.46).slice(0, 2), lh = Math.min(5.8 * Q, rh * 0.3) * 1.15;
        ln.forEach((l, k) => c.fillText(l, x0 + cw, base - lh * 0.6 * (ln.length - 1) + k * lh)); c.textAlign = 'left';
      });
    }

    /* -- pied de carte */
    c.font = FONT(800, 4.2 * Q); c.fillStyle = mix(r.color, '#ffffff', 0.75);
    spaced(c, (combo ? 'Spéciale · Combo' : r.name).toUpperCase(), x0, footY + 24, 0.14 * 4.2 * Q, 'left');
    c.fillStyle = mix(r.color, '#ffffff', 0.75); c.globalAlpha = 0.55; spaced(c, 'NEV.BOOSTER', x0 + cw, footY + 24, 0.14 * 4.2 * Q, 'right'); c.globalAlpha = 1;
    c.restore();
    return out;
  }

  /* ---------- le dos (celui du site : or + bordeaux) ---------- */
  function drawBack(cv) {
    const c = cv.getContext('2d'), sc = cv.width / FW;
    c.setTransform(sc, 0, 0, sc, 0, 0); c.clearRect(0, 0, FW, FH);
    const R0 = 0.065 * FW; rr(c, 0, 0, FW, FH, R0); c.fillStyle = cssLin(c, 0, 0, FW, FH, 150, [[0, '#f6d58a'], [0.4, '#8e1b3c'], [1, '#f0b24a']]); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.65)'; c.lineWidth = 2; rr(c, 1, 1, FW - 2, FH - 2, R0); c.stroke();
    const P = 0.026 * FW, x = P, y = P, w = FW - 2 * P, h = FH - 2 * P;
    rr(c, x, y, w, h, 4.6 * Q); c.fillStyle = cssLin(c, x, y, w, h, 160, [[0, '#5a0f22'], [1, '#220710']]); c.fill();
    c.save(); rr(c, x, y, w, h, 4.6 * Q); c.clip();
    const s = Math.min(w / 100, h / 140); c.translate(x + (w - 100 * s) / 2, y + (h - 140 * s) / 2); c.scale(s, s);
    c.strokeStyle = 'rgba(224,69,95,.22)'; c.lineWidth = 0.8; c.beginPath(); for (let i = -14; i < 16; i++) { c.moveTo(i * 10, 0); c.lineTo(i * 10 + 140, 140); } c.stroke();
    emblem(c, 50, 70, 30, true);
    c.fillStyle = '#f6d58a'; c.font = FONT(900, 8); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; spaced(c, 'neV.BOOSTER', 50, 122, 2, 'center');
    c.restore();
  }

  /* ---------- plaque de la boîte + emblème du couvercle ---------- */
  function drawPlate(cv) {
    const W = cv.width, H = cv.height, c = cv.getContext('2d');
    c.clearRect(0, 0, W, H);
    rr(c, 6, 6, W - 12, H - 12, 22); c.fillStyle = 'rgba(26,6,12,.9)'; c.fill();
    const gold = cssLin(c, 0, 0, W, H, 150, [[0, '#f6d58a'], [0.45, '#8e1b3c'], [1, '#f0b24a']]);
    c.strokeStyle = gold; c.lineWidth = 7; c.shadowColor = '#e0455f'; c.shadowBlur = 20; rr(c, 10, 10, W - 20, H - 20, 20); c.stroke(); c.shadowBlur = 0;
    emblem(c, W / 2, H * 0.40, H * 0.27, true);
    c.fillStyle = '#f6d58a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'italic 900 ' + Math.round(H * 0.15) + 'px Montserrat, sans-serif';
    c.shadowColor = '#e0455f'; c.shadowBlur = 14; spaced(c, 'neV.BOOSTER', W / 2, H * 0.84, H * 0.012, 'center'); c.shadowBlur = 0;
  }
  function drawLidEmblem(cv) {
    const c = cv.getContext('2d'), S = cv.width; c.clearRect(0, 0, S, S);
    c.shadowColor = '#e0455f'; c.shadowBlur = 30; emblem(c, S / 2, S / 2, S * 0.4, true); c.shadowBlur = 0;
    c.strokeStyle = 'rgba(246,213,138,.55)'; c.lineWidth = 6; c.beginPath(); c.arc(S / 2, S / 2, S * 0.47, 0, Math.PI * 2); c.stroke();
  }

  NEV.BoxCards = { FW, FH, drawFront, drawBack, drawPlate, drawLidEmblem, rgba, mix };
})(window);
