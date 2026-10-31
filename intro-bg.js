/* neV.BOOSTER — fond permanent : Baki + cartes 3D flottantes. NEVBG.mount({trace, dim}) · .showCards() · .finish() */
(function (g) {
  'use strict';
  var doc = g.document;
  var BACK = '<div class="tcard back"><div class="tc-in"><svg viewBox="0 0 100 140" aria-hidden="true"><defs><linearGradient id="cbG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d58a"/><stop offset="1" stop-color="#c07a1c"/></linearGradient></defs>' +
    '<g fill="none" stroke="#e0455f" stroke-opacity=".22" stroke-width=".8">' + (function () { var d = ''; for (var i = -14; i < 16; i++) d += '<path d="M' + (i * 10) + ' 0L' + (i * 10 + 140) + ' 140"/>'; return d; })() + '</g>' +
    '<circle cx="50" cy="70" r="30" fill="#2a0a14" stroke="url(#cbG)" stroke-width="2.2"/><circle cx="50" cy="70" r="24" fill="none" stroke="#e0455f" stroke-width="1" stroke-dasharray="2 3"/>' +
    '<path d="M32 86V56l12 22 6-12 6 12 12-22v30" fill="none" stroke="url(#cbG)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<text x="50" y="122" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="900" font-size="8" letter-spacing="2" fill="#f6d58a">neV.BOOSTER</text></svg><i class="tc-sheen"></i></div></div>';
  /* les couleurs de rareté du site */
  var R = [
    { id: 'commun', code: 'N', c: '#c9ccd2', c2: '#6b707a', g: '#b4b8c0', n: 'Commun', s: 1 },
    { id: 'rare', code: 'R', c: '#b98cff', c2: '#5b21b6', g: '#9b5cff', n: 'Rare', s: 2 },
    { id: 'epique', code: 'SR', c: '#ff5ccb', c2: '#a3157a', g: '#ff2db4', n: 'Épique', s: 3 },
    { id: 'legendaire', code: 'UR', c: '#ffd84a', c2: '#b8860b', g: '#ffc400', n: 'Légendaire', s: 4 },
    { id: 'mythique', code: 'MR', c: '#ff4040', c2: '#8a0a16', g: '#ff1f2d', n: 'Mythique', s: 5 }
  ];
  function face(r) {
    var st = ''; for (var i = 0; i < 5; i++) st += i < r.s ? '★' : '<s>★</s>';
    return '<div class="tcard r-' + r.id + (r.s >= 3 ? ' foil' : '') + '" style="--c:' + r.c + ';--c2:' + r.c2 + ';--g:' + r.g + '"><div class="tc-in"><div class="tc-top"><span class="tc-code">' + r.code + '</span><span class="tc-stars">' + st + '</span></div><div class="fn">' + r.code + '</div><div class="fl">' + r.n + '</div></div></div>';
  }
  /* x, y (%), z (px), largeur, rotation, rareté (-1 = dos) */
  var SPOTS = [
    [10, 22, 60, 96, -10, -1], [88, 20, 40, 104, 9, 3], [6, 62, -80, 84, 6, 1], [92, 64, 70, 100, -8, -1],
    [24, 86, 120, 90, 12, 4], [78, 88, -40, 88, -12, 0], [30, 8, -120, 74, -6, 2], [70, 8, -100, 76, 8, -1], [50, 94, -160, 70, 0, 1]
  ];
  /* écran large (intro) : Baki passe à droite, le texte à gauche ; les cartes restent dans les marges libres */
  var SPOTS_W = [[47, 13, -40, 84, -9, 3], [93, 20, 40, 92, 8, -1], [93, 72, 60, 88, -8, 4], [45, 88, -80, 78, 10, 1], [60, 94, -150, 64, -5, 0], [7, 9, -150, 60, -8, -1], [9, 93, -130, 64, 8, 2]];
  var SPOTS_S = [[13, 18, 40, 80, -10, -1], [86, 24, 50, 84, 9, 3], [12, 74, 60, 80, 8, 4], [87, 80, 30, 78, -9, -1], [50, 92, -80, 62, 0, 1]];

  function mount(o) {
    o = o || {};
    var el = doc.getElementById('nvbg');
    if (!el) { el = doc.createElement('div'); el.id = 'nvbg'; el.setAttribute('aria-hidden', 'true'); doc.body.insertBefore(el, doc.body.firstChild); }
    var small = g.innerWidth < 640, spots = o.split ? SPOTS_W : small ? SPOTS_S : SPOTS, h = '';
    spots.forEach(function (s, i) {
      var r = s[5] < 0 ? null : R[s[5]], rnd = function (a, b) { return (a + ((i * 37 + 11) % 100) / 100 * (b - a)).toFixed(1); };
      h += '<div class="fc" style="--x:' + s[0] + '%;--y:' + s[1] + '%;--z:' + s[2] + 'px;--w:' + (small ? s[3] : o.split ? s[3] * 1.1 : s[3] * 1.15) + 'px;--rz:' + s[4] + 'deg;--rx0:' + rnd(6, 16) + 'deg;--ry0:' + rnd(-30, -12) + 'deg;--ry1:' + rnd(14, 34) + 'deg;--fx:' + rnd(-14, 14) + 'px;--fy:' + rnd(-34, -12) + 'px;--t:' + rnd(7, 11) + 's;--d:-' + rnd(0, 6) + 's;--a:' + (i * 0.16).toFixed(2) + 's' + (r ? ';--c:' + r.c + ';--g:' + r.g : '') + '"><div class="fi">' + (r ? face(r) : BACK) + '</div></div>';
    });
    el.innerHTML = '<div class="bk"><img class="bk-full" src="img/baki.webp" alt="" decoding="async"><img class="bk-line" src="img/baki-line.webp" alt="" decoding="async"><i class="bk-scan"></i></div><div class="cards3d"><div class="world">' + h + '</div></div>';
    el.className = (o.trace ? 'trace' : 'done') + (o.dim ? ' dim' : '') + (o.cards ? ' cards-on' : '');
    var world = el.querySelector('.world');
    function par(x, y) { world.style.setProperty('--py', ((x - 0.5) * 14).toFixed(1) + 'deg'); world.style.setProperty('--px', ((0.5 - y) * 9).toFixed(1) + 'deg'); }
    g.addEventListener('pointermove', function (e) { par(e.clientX / g.innerWidth, e.clientY / g.innerHeight); }, { passive: true });
    g.addEventListener('deviceorientation', function (e) { if (e.gamma != null) par(0.5 + Math.max(-30, Math.min(30, e.gamma)) / 100, 0.5 + Math.max(-30, Math.min(30, (e.beta || 45) - 45)) / 120); }, { passive: true });
    return el;
  }
  g.NEVBG = {
    mount: mount,
    showCards: function () { var e = doc.getElementById('nvbg'); if (e) e.classList.add('cards-on'); },
    side: function (on) { var e = doc.getElementById('nvbg'); if (e) e.classList.toggle('split', !!on); },
    dim: function (on) { var e = doc.getElementById('nvbg'); if (e) e.classList.toggle('dim', !!on); },
    finish: function () { var e = doc.getElementById('nvbg'); if (e) { e.classList.add('done'); } }
  };
  if (doc.body && doc.body.getAttribute('data-nvbg') === 'static') mount({ cards: true, dim: true });
})(window);
