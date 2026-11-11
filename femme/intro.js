/* Introduction féminine : carte à gratter neV.BOOSTER, 4 scènes d'histoire, puis Yuki. Se lance seule, « Passer » mène à l'accueil. */
(function () {
  'use strict';
  var IM = { i1: 'img/intro-i1.webp', i3: 'img/intro-i3.webp', i6: 'img/intro-i6.webp', i9: 'img/intro-i9.webp', i10: 'img/intro-i10.webp', i12: 'img/intro-i12.webp', i14: 'img/intro-i14.webp', i15: 'img/intro-i15.webp', i16: 'img/intro-i16.webp', i17: 'img/intro-i17.webp' };
  var SL = [[['i1', '3/4', '62% 50%'], ['i6', '3/4', '32% 50%']], [['i3', '3/4', '69% 50%'], ['i9', '3/4', '50% 50%']], [['i10', '1/1', '50% 50%', 'Squats'], ['i12', '1.6', '48% 50%', 'Mobilité'], ['i14', '4/3', '50% 50%', 'Cardio'], ['i15', '1/1', '50% 30%', 'À son rythme'], ['i16', '1.6', '79% 50%', 'Étirements']], [['i17', '4/5', '50% 50%']]];
  var D = [6.4, 9, 8, 11, 7, 0];
  var scr = (window.NEVSCRATCH && document.getElementById('scr')) ? NEVSCRATCH.mount(document.getElementById('scr'), { light: true }) : null;
  var sc = Array.prototype.slice.call(document.querySelectorAll('.scene')), bar = document.getElementById('bar'), T = [];
  var reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function mk(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  SL.forEach(function (c, i) {
    c.forEach(function (s) {
      var d = mk('div', 'sl'), bd = mk('img', 'bd'), fr = mk('div', 'fr'), im = mk('img', 'im');
      bd.src = IM[s[0]]; bd.alt = ''; im.src = IM[s[0]]; im.alt = ''; im.style.objectPosition = s[2]; fr.style.aspectRatio = s[1];
      fr.appendChild(im); d.appendChild(bd); d.appendChild(fr);
      if (s[3]) { var cp = mk('span', 'cap'); cp.textContent = s[3]; d.appendChild(cp); }
      sc[i + 1].querySelector('.sls').appendChild(d);
    });
  });
  function show(i) {
    sc.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    bar.style.width = ((i + 1) / sc.length * 100) + '%';
    var ss = sc[i].querySelectorAll('.sl');
    if (i === 0 && scr) { scr.play(); } else if (scr) { scr.stop(); }
    Array.prototype.forEach.call(ss, function (s, k) {
      T.push(setTimeout(function () { Array.prototype.forEach.call(ss, function (x) { x.classList.remove('on'); }); s.classList.add('on'); }, k * D[i] * 1000 / ss.length));
    });
    if (i === sc.length - 1) { try { sessionStorage.setItem('nvbf.yuki', '1'); } catch (e) { /* ignoré */ } }  // Yuki vient de parler : pas de doublon sur l'accueil
  }
  function run() {
    T.forEach(clearTimeout); T = [];
    var at = 0;
    D.forEach(function (d, i) { T.push(setTimeout(function () { show(i); }, (reduced ? i * 2500 : at * 1000))); at += d; });
  }
  document.getElementById('again').addEventListener('click', run);
  run();
})();
