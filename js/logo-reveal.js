/* Ouverture neV.BOOSTER : révélation cinématique du logo. Usage : var r = NEVREVEAL.mount(element, { light: false, logo: 'img/logo-nvb.webp' }); r.play(); r.stop(); */
(function (g) {
  'use strict';
  g.NEVREVEAL = {
    mount: function (el, opt) {
      opt = opt || {};
      el.classList.add('rv'); el.classList.toggle('light', !!opt.light);
      el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'neV.BOOSTER — Booste ton quotidien');
      var letters = function (s, cls) { var i = 0; return s.split('').map(function (c) { return '<span style="--i:' + (i++) + '">' + c + '</span>'; }).join(''); };
      var w1 = 'neV.'.split('').map(function (c, i) { return '<span style="--i:' + i + '">' + c + '</span>'; }).join('');
      var w2 = 'BOOSTER'.split('').map(function (c, i) { return '<span style="--i:' + (i + 4) + '">' + c + '</span>'; }).join('');
      el.innerHTML = '<div class="rv-stage" aria-hidden="true"><i class="rv-line"></i><i class="rv-ring"></i><i class="rv-ring r2"></i>' +
        '<img class="rv-logo" src="' + (opt.logo || (opt.light ? 'img/logo-nvb-f.webp' : 'img/logo-nvb.webp')) + '" alt="" width="512" height="512" decoding="async"></div>' +
        '<div class="rv-word" aria-hidden="true">' + w1 + '<b>' + w2 + '</b></div><p class="rv-tag" aria-hidden="true">Booste ton quotidien</p><i class="rv-bar" aria-hidden="true"></i>';
      return {
        play: function () { el.classList.remove('play'); void el.offsetWidth; el.classList.add('play'); },
        stop: function () { el.classList.remove('play'); }
      };
    }
  };
})(window);
