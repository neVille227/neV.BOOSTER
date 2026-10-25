/* ==========================================================
   neV.BOOSTER — fx.js : éclats, étincelles, ondes de choc (canvas).
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const doc = g.document;
  let cv = null, cx = null, parts = [], raf = 0, last = 0;

  function init() {
    if (cv) return;
    cv = doc.createElement('canvas'); cv.className = 'fx-canvas'; cv.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(cv); cx = cv.getContext('2d'); resize();
    g.addEventListener('resize', resize);
  }
  function resize() { if (!cv) return; const d = Math.min(2, g.devicePixelRatio || 1); cv.width = g.innerWidth * d; cv.height = g.innerHeight * d; cx.setTransform(d, 0, 0, d, 0, 0); }
  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    cx.clearRect(0, 0, g.innerWidth, g.innerHeight);
    parts = parts.filter(function (p) { return p.t < p.life; });
    parts.forEach(function (p) {
      p.t += dt; p.vy += p.gr * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const k = 1 - p.t / p.life; cx.globalAlpha = Math.max(0, k) * (p.a == null ? 1 : p.a);
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillStyle = p.c;
      if (p.kind === 'shard') { cx.beginPath(); cx.moveTo(-p.s, -p.s * .5); cx.lineTo(p.s, 0); cx.lineTo(-p.s * .2, p.s * .9); cx.closePath(); cx.fill(); }
      else if (p.kind === 'ember') { cx.shadowColor = p.c; cx.shadowBlur = 10; cx.beginPath(); cx.arc(0, 0, p.s * k + .6, 0, 6.3); cx.fill(); }
      else { cx.fillRect(-p.s, -p.s * .25, p.s * 2, p.s * .5); }
      cx.restore();
    });
    cx.globalAlpha = 1;
    if (parts.length) raf = g.requestAnimationFrame(loop); else { raf = 0; cx.clearRect(0, 0, g.innerWidth, g.innerHeight); }
  }
  function kick() { if (!raf) { last = g.performance.now(); raf = g.requestAnimationFrame(loop); } }
  const R = (a, b) => a + Math.random() * (b - a);

  function burst(x, y, o) {
    if (NEV.util.reduced()) return; init(); o = o || {};
    const cols = o.colors || ['#ff8a3d', '#e0455f', '#ffd45e'], n = o.n || 60, pw = o.power || 1;
    for (let i = 0; i < n; i++) {
      const a = R(0, Math.PI * 2), v = R(160, 760) * pw, kind = i % 3 === 0 ? 'shard' : i % 3 === 1 ? 'ember' : 'spark';
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120 * pw, gr: kind === 'ember' ? 120 : 900, life: R(.7, 1.7), t: 0, s: kind === 'shard' ? R(6, 17) : R(2, 6), c: cols[i % cols.length], rot: R(0, 6.3), vr: R(-12, 12), kind: kind });
    }
    kick();
  }
  function stream(x, y, o) { // petites braises qui montent
    if (NEV.util.reduced()) return; init(); o = o || {};
    for (let i = 0; i < (o.n || 3); i++) parts.push({ x: x + R(-(o.w || 40), o.w || 40), y: y, vx: R(-30, 30), vy: R(-160, -60), gr: -40, life: R(.6, 1.3), t: 0, s: R(1.5, 4), c: (o.colors || ['#ffb04a', '#ff6a3d'])[i % 2], rot: 0, vr: 0, kind: 'ember', a: .9 });
    kick();
  }
  function clear() { parts = []; }
  function shake(el, ms, px) {
    if (NEV.util.reduced() || !el.animate) return;
    const f = [], n = 12; px = px || 8;
    for (let i = 0; i < n; i++) f.push({ transform: 'translate(' + R(-px, px).toFixed(1) + 'px,' + R(-px, px).toFixed(1) + 'px) rotate(' + R(-.6, .6).toFixed(2) + 'deg)' });
    f.push({ transform: 'none' });
    el.animate(f, { duration: ms || 420, easing: 'linear' });
  }
  function flash(color, ms) {
    const d = doc.createElement('div'); d.className = 'fx-flash'; d.style.background = color || '#fff'; doc.body.appendChild(d);
    if (d.animate) d.animate([{ opacity: .95 }, { opacity: 0 }], { duration: ms || 700, easing: 'ease-out' }).onfinish = function () { d.remove(); }; else d.remove();
  }
  NEV.Fx = { init, burst, stream, shake, flash, clear };
})(window);
