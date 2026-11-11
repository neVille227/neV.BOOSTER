/* neV.BOOSTER — scratch-logo.js : le logo « neV.BOOSTER » recouvert d'une carte à gratter argentée.
   Une pièce gratte la carte en zigzag, le logo apparaît avec sa lueur, puis la phrase « Booste ton quotidien. ».
   Un seul canvas, aucune image, aucune dépendance. Thème sombre (homme) ou clair (femme) : { light: true }.
   Usage : var s = NEVSCRATCH.mount(canvas, { light: false }); s.play(); … s.stop(); */
(function (g) {
  'use strict';
  var N = (g.NEVSCRATCH = g.NEVSCRATCH || {});
  var CARD = { x: 260, y: 300, w: 1400, h: 420, r: 30 };
  var T0 = 0.45, T1 = 3.5, ROWS = 7, CX0 = 280, CX1 = 1640, Y0 = 318, DY = 64;   // chronologie (secondes) et trajet de la pièce
  var BX = 160, BY = 200, BW = 1600, BH = 620;                                   // zone mise en cache (repère logique 1920×1080)
  var END = 6.4;                                                                 // durée totale (le site enchaîne à ~6,2 s)

  function rnd(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
  function outC(t) { t = Math.min(1, Math.max(0, t)); return 1 - Math.pow(1 - t, 3); }
  function rr(c, X, Y, w, h, r) { c.beginPath(); c.moveTo(X + r, Y); c.arcTo(X + w, Y, X + w, Y + h, r); c.arcTo(X + w, Y + h, X, Y + h, r); c.arcTo(X, Y + h, X, Y, r); c.arcTo(X, Y, X + w, Y, r); c.closePath(); }

  /* trajet de la pièce : 7 passages horizontaux alternés, avec une légère ondulation */
  var pts = [], seg = [0], LEN;
  (function () {
    for (var r = 0; r < ROWS; r++) {
      var dir = r % 2 ? -1 : 1, y = Y0 + r * DY;
      for (var k = 0; k <= 40; k++) { var u = k / 40, xx = dir > 0 ? CX0 + u * (CX1 - CX0) : CX1 - u * (CX1 - CX0); pts.push([xx, y + 13 * Math.sin(xx / 85 + r)]); }
    }
    for (var i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    LEN = seg[seg.length - 1];
  })();
  function prog(t) { var u = Math.min(1, Math.max(0, (t - T0) / (T1 - T0))); return u * u * 0.18 + u * 0.82; }
  function at(p) {
    var d = p * LEN, i = 1;
    while (i < seg.length - 1 && seg[i] < d) i++;
    var a = pts[i - 1], b = pts[i], f = (d - seg[i - 1]) / Math.max(1e-6, seg[i] - seg[i - 1]);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, i];
  }

  N.mount = function (cv, opt) {
    opt = opt || {};
    var light = !!opt.light, x = cv.getContext('2d');
    var C = light
      ? { a: '#2b0f18', b: '#c32d50', tag: '#6b3a45', glow: 'rgba(195,45,80,', dust: '#c32d50', flash: '255,255,255', shadow: 'rgba(90,30,45,.35)' }
      : { a: '#f5eeee', b: '#ff3d5f', tag: '#ead9dc', glow: 'rgba(255,45,85,', dust: '#ff7a90', flash: '255,170,190', shadow: 'rgba(0,0,0,.6)' };
    var LG = document.createElement('canvas'), FO = document.createElement('canvas'), SC = document.createElement('canvas');
    var cw = 0, ch = 0, dpr = 1, s = 1, q = 1, ready = false, raf = 0, t0 = 0, running = false;

    function size() {
      dpr = Math.min(2, g.devicePixelRatio || 1);
      var w = cv.clientWidth || 360, h = cv.clientHeight || 640;
      if (w === cw && h === ch && ready) return;
      cw = w; ch = h; cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      s = Math.min(cw * 0.94 / 1500, ch * 0.9 / 700, 1.2);
      q = Math.min(1, s * dpr);
      [LG, FO, SC].forEach(function (e) { e.width = Math.ceil(BW * q); e.height = Math.ceil(BH * q); });
      build();
    }
    function build() {
      var l = LG.getContext('2d'); l.setTransform(q, 0, 0, q, -BX * q, -BY * q); l.clearRect(BX, BY, BW, BH);
      var fs = 196; l.textBaseline = 'alphabetic';
      l.font = '800 ' + fs + 'px Montserrat'; var w1 = l.measureText('neV.').width;
      l.font = '900 ' + fs + 'px Montserrat'; var w2 = l.measureText('BOOSTER').width;
      fs = Math.floor(fs * 1240 / (w1 + w2));
      l.font = '800 ' + fs + 'px Montserrat'; w1 = l.measureText('neV.').width;
      l.font = '900 ' + fs + 'px Montserrat'; w2 = l.measureText('BOOSTER').width;
      var x0 = (1920 - (w1 + w2)) / 2, base = 520;
      l.textAlign = 'left'; l.font = '800 ' + fs + 'px Montserrat'; l.fillStyle = C.a; l.fillText('neV.', x0, base);
      l.font = '900 ' + fs + 'px Montserrat'; l.fillStyle = C.b; l.fillText('BOOSTER', x0 + w1, base);
      l.textAlign = 'center'; l.font = '600 38px Montserrat'; if ('letterSpacing' in l) l.letterSpacing = '15px';
      l.fillStyle = C.tag; l.fillText('Booste ton quotidien.', 960 + 8, 640);
      /* feuille d'argent */
      var f = FO.getContext('2d'); f.setTransform(q, 0, 0, q, -BX * q, -BY * q); f.clearRect(BX, BY, BW, BH);
      f.save(); rr(f, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); f.clip();
      var fg = f.createLinearGradient(CARD.x, CARD.y, CARD.x + CARD.w, CARD.y + CARD.h);
      fg.addColorStop(0, '#dcdfe5'); fg.addColorStop(0.25, '#a3a8b0'); fg.addColorStop(0.5, '#eef0f3'); fg.addColorStop(0.75, '#9aa0a8'); fg.addColorStop(1, '#d3d6dc');
      f.fillStyle = fg; f.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);
      var r = rnd(9), i;
      for (i = 0; i < 260; i++) { var yy = CARD.y + r() * CARD.h; f.strokeStyle = 'rgba(' + (r() > 0.5 ? '255,255,255' : '60,64,72') + ',' + (0.05 + r() * 0.07) + ')'; f.lineWidth = 1; f.beginPath(); f.moveTo(CARD.x, yy); f.lineTo(CARD.x + CARD.w, yy + r() * 10 - 5); f.stroke(); }
      for (i = 0; i < 6000; i++) { f.fillStyle = 'rgba(' + (r() > 0.5 ? '255,255,255' : '40,44,52') + ',' + (r() * 0.12) + ')'; f.fillRect(CARD.x + r() * CARD.w, CARD.y + r() * CARD.h, 1.6, 1.6); }
      f.textAlign = 'center'; f.font = '800 34px Montserrat'; if ('letterSpacing' in f) f.letterSpacing = '12px';
      var hy = Y0 + DY * 3 + 10;
      f.fillStyle = 'rgba(255,255,255,.55)'; f.fillText('GRATTE POUR RÉVÉLER', 966, hy + 1.5);
      f.fillStyle = 'rgba(55,60,70,.62)'; f.fillText('GRATTE POUR RÉVÉLER', 966, hy);
      f.restore();
      f.save(); rr(f, CARD.x + 2, CARD.y + 2, CARD.w - 4, CARD.h - 4, CARD.r - 2); f.strokeStyle = 'rgba(255,255,255,.65)'; f.lineWidth = 3; f.stroke(); f.restore();
      ready = true;
    }
    function star(X, Y, sz, a) {
      x.save(); x.translate(X, Y); x.globalAlpha = a; x.fillStyle = light ? '#c32d50' : '#fff'; x.beginPath();
      for (var i = 0; i < 8; i++) { var R = i % 2 ? sz * 0.18 : sz; x.lineTo(Math.cos(i * Math.PI / 4) * R, Math.sin(i * Math.PI / 4) * R); }
      x.closePath(); x.fill(); x.restore();
    }
    function coin(X, Y, a, k) {
      x.save(); x.translate(X, Y); x.scale(k, k); x.rotate(-0.35); x.globalAlpha = a; x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 26; x.shadowOffsetY = 14;
      var gr = x.createRadialGradient(-12, -14, 4, 0, 0, 46); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#c4c8cf'); gr.addColorStop(1, '#757a83');
      x.fillStyle = gr; x.beginPath(); x.arc(0, 0, 46, 0, 7); x.fill(); x.shadowColor = 'transparent';
      x.strokeStyle = 'rgba(60,64,72,.55)'; x.lineWidth = 2;
      for (var i = 0; i < 48; i++) { var an = i / 48 * 6.2832; x.beginPath(); x.moveTo(Math.cos(an) * 39, Math.sin(an) * 39); x.lineTo(Math.cos(an) * 45, Math.sin(an) * 45); x.stroke(); }
      x.beginPath(); x.arc(0, 0, 33, 0, 7); x.strokeStyle = 'rgba(255,255,255,.7)'; x.stroke();
      x.font = '900 26px Montserrat'; x.textAlign = 'center'; if ('letterSpacing' in x) x.letterSpacing = '0px'; x.fillStyle = 'rgba(55,60,70,.85)'; x.fillText('nV', 0, 9);
      x.restore();
    }

    function render(t) {
      size(); if (!ready) return;
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, cv.width, cv.height);
      /* poussière lumineuse (repère écran) */
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      var r = rnd(77), i;
      for (i = 0; i < 46; i++) {
        var px = r() * cw, py = r() * ch, sp = 8 + r() * 18, ph = r() * 6, yy = ((py - t * sp) % ch + ch) % ch;
        x.globalAlpha = 0.10 + 0.12 * Math.sin(t * 1.3 + ph); x.fillStyle = C.dust; x.beginPath(); x.arc(px + Math.sin(t + ph) * 10, yy, 1 + r() * 1.2, 0, 7); x.fill();
      }
      x.globalAlpha = 1;
      /* repère logique */
      x.setTransform(dpr * s, 0, 0, dpr * s, dpr * (cw / 2 - 960 * s), dpr * (ch / 2 - 510 * s));
      var cardIn = outC(t / 0.7), glow = ease((t - 3.45) / 0.7) * (0.85 + 0.15 * Math.sin(t * 3));
      if (!light) {   // voile sombre doux derrière le logo : il reste lisible devant le fond animé
        x.save(); x.translate(960, 500); x.scale(1, 0.34);
        var gb = x.createRadialGradient(0, 0, 0, 0, 0, 820); gb.addColorStop(0, 'rgba(6,1,3,' + (0.72 * cardIn) + ')'); gb.addColorStop(1, 'rgba(6,1,3,0)');
        x.fillStyle = gb; x.beginPath(); x.arc(0, 0, 820, 0, 7); x.fill(); x.restore();
      }
      x.save(); x.shadowColor = C.glow + (0.6 * glow) + ')'; x.shadowBlur = 60; x.drawImage(LG, BX, BY, BW, BH); x.restore();
      /* feuille : on efface le trajet déjà gratté */
      var p = prog(t), S = SC.getContext('2d');
      S.setTransform(1, 0, 0, 1, 0, 0); S.globalCompositeOperation = 'source-over'; S.clearRect(0, 0, SC.width, SC.height); S.drawImage(FO, 0, 0);
      S.setTransform(q, 0, 0, q, -BX * q, -BY * q); S.globalCompositeOperation = 'destination-out'; S.lineCap = 'round'; S.lineJoin = 'round'; S.lineWidth = 92; S.strokeStyle = '#000';
      if (p > 0) { var e = at(p); S.beginPath(); S.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < e[2]; i++) S.lineTo(pts[i][0], pts[i][1]); S.lineTo(e[0], e[1]); S.stroke(); }
      S.globalCompositeOperation = 'source-over';
      var fa = cardIn * (t > T1 ? Math.max(0, 1 - (t - T1 - 0.1) / 0.7) : 1), sc = 0.94 + 0.06 * cardIn;
      x.save(); x.translate(960, 510); x.scale(sc, sc); x.translate(-960, -510); x.globalAlpha = fa; x.shadowColor = C.shadow; x.shadowBlur = 50; x.shadowOffsetY = 20; x.drawImage(SC, BX, BY, BW, BH); x.restore(); x.globalAlpha = 1;
      /* éclats de feuille */
      if (t > T0 && t < T1 + 0.7) {
        var step = 0.018;
        for (var te = Math.max(T0, t - 0.6); te < Math.min(t, T1); te += step) {
          var k = Math.round(te / step), rr2 = rnd(k * 7919 + 3), a = at(prog(te)), age = t - te, vx = (rr2() - 0.75) * 340, vy = -rr2() * 320 - 60;
          var X = a[0] + vx * age, Y = a[1] + vy * age + 450 * age * age, al = Math.max(0, 1 - age / 0.6);
          if (rr2() > 0.45) { x.globalAlpha = al * 0.9; x.fillStyle = rr2() > 0.5 ? '#e7eaef' : '#a9aeb7'; x.fillRect(X, Y, 2 + rr2() * 4, 2 + rr2() * 3); }
        }
        x.globalAlpha = 1;
      }
      /* pièce */
      if (t > T0 - 0.15 && t < T1 + 0.6) {
        var cp = at(prog(Math.min(t, T1))), ca = ease((t - (T0 - 0.15)) / 0.25) * (t > T1 ? Math.max(0, 1 - (t - T1) / 0.5) : 1), off = t > T1 ? (t - T1) * 420 : 0;
        coin(cp[0] + 58 + off * 0.5, cp[1] - 44 - off, ca, Math.max(1, 0.45 / s));
      }
      /* éclat de révélation + étoiles */
      var fl = Math.max(0, 1 - Math.abs(t - 3.62) / 0.45);
      if (fl > 0) { var gg = x.createRadialGradient(960, 520, 40, 960, 520, 900); gg.addColorStop(0, 'rgba(' + C.flash + ',' + (0.34 * fl) + ')'); gg.addColorStop(1, 'rgba(' + C.flash + ',0)'); x.fillStyle = gg; x.fillRect(0, 0, 1920, 1080); }
      var sr = rnd(31);
      for (i = 0; i < 14; i++) { var sx = 380 + sr() * 1160, sy = 360 + sr() * 300, st = 3.55 + sr() * 1.2, sz = 10 + sr() * 16; if (t > st && t < st + 0.8) star(sx, sy, sz, Math.sin((t - st) * Math.PI / 0.8) * 0.9); }
    }

    function frame(now) {
      if (!running) return;
      var t = (now - t0) / 1000;
      render(Math.min(t, END));
      if (t < END) raf = g.requestAnimationFrame(frame); else running = false;
    }
    function boot(fn) {
      var f = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('900 100px Montserrat'), document.fonts.load('800 100px Montserrat'), document.fonts.load('600 38px Montserrat')]) : Promise.resolve();
      f.then(fn, fn);
    }
    var reduced = !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var api = {
      play: function () {
        api.stop(); cw = 0;
        boot(function () {
          size();
          if (reduced) { render(5); return; }
          running = true; t0 = g.performance.now(); raf = g.requestAnimationFrame(frame);
        });
      },
      stop: function () { running = false; if (raf) g.cancelAnimationFrame(raf); raf = 0; },
      draw: function (t) { boot(function () { cw = 0; size(); render(t); }); }
    };
    g.addEventListener('resize', function () { if (!running && ready) { cw = 0; size(); render(END); } });
    return api;
  };
})(window);
