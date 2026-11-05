/* ==========================================================
   neV.BOOSTER — hero-img.js
   Avatars d'évolution RÉALISTES : l'image de l'homme (dark) ou de la femme (clair) remplace le personnage en blocs.
   Même interface que NEV.Hero.mount : {setStage, growTo, powerUp, setAura, destroy}.
   L'évolution (paliers 1 → 6) se voit par la carrure, la lumière, l'aura et la plateforme.
   Une image par palier ? Dépose-les dans img/evo/ et déclare-les dans EVO ci-dessous : elles remplacent l'image de base.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  if (!NEV.Hero) return;
  const doc = g.document;
  const BASE = { m: 'img/avatar-m.webp', f: 'img/avatar-f.webp' };
  /* Exemple : EVO.m = { 1: 'img/evo/m1.webp', 2: 'img/evo/m2.webp', … } — les paliers non listés gardent l'image de base. */
  const EVO = { m: {}, f: {} };
  const hexOf = (id) => { try { const a = NEV.Rewards && NEV.Rewards.aura(id); return a && a.c ? a.c : ['#ff3d8b', '#7a0f26']; } catch (e) { return ['#ff3d8b', '#7a0f26']; } };
  const clampK = (n) => Math.max(1, Math.min(6, Number(n) || 1));

  NEV.Hero.mount = function (el, o) {
    o = o || {};
    const sex = NEV.sex === 'f' ? 'f' : 'm';
    let k = clampK(o.stage), auraId = o.aura || 'none', raf = 0, busy = false, puT = 0;
    el.classList.add('hero-wrap');
    el.innerHTML = '<div class="hi hi-' + sex + '" role="img" aria-label="Ton avatar, palier ' + Math.round(k) + '">' +
      '<div class="hi-aura" aria-hidden="true"></div>' +
      '<div class="hi-fig"><img alt="" decoding="async" draggable="false"></div>' +
      '<div class="hi-plat" aria-hidden="true"><i></i><i></i></div>' +
      '<div class="hi-fx" aria-hidden="true"><b></b><b></b><b></b></div></div>';
    const root = el.firstChild, img = root.querySelector('img');
    const srcFor = (kk) => EVO[sex][Math.round(kk)] || BASE[sex];
    let curSrc = '';
    const apply = (kk, boost) => {
      const f = (kk - 1) / 5, c = hexOf(auraId);
      root.style.setProperty('--k', kk.toFixed(3));
      root.style.setProperty('--f', f.toFixed(3));
      root.style.setProperty('--boost', String(boost || 1));
      root.style.setProperty('--a1', c[0]); root.style.setProperty('--a2', c[1]);
      root.setAttribute('aria-label', 'Ton avatar, palier ' + Math.round(kk));
      const s = srcFor(kk); if (s !== curSrc) { curSrc = s; img.src = s; }
    };
    apply(k);
    return {
      get stage() { return k; },
      setStage(n) { k = clampK(n); apply(k); },
      setAura(id) { auraId = id; apply(k); },
      growTo(n, ms) {
        return new Promise(function (resolve) {
          const from = k, to = clampK(n), t0 = performance.now(), dur = ms || 2200;
          cancelAnimationFrame(raf);
          if (NEV.util && NEV.util.reduced && NEV.util.reduced()) { k = to; apply(k); resolve(); return; }
          root.classList.add('pu');
          const step = function (t) {
            const f = Math.min(1, (t - t0) / dur), e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
            apply(from + (to - from) * e, 1 + 1.4 * Math.sin(f * Math.PI));
            if (f < 1) raf = requestAnimationFrame(step); else { k = to; apply(k); root.classList.remove('pu'); resolve(); }
          };
          raf = requestAnimationFrame(step);
        });
      },
      powerUp() {
        if (busy) return Promise.resolve();
        busy = true; root.classList.add('pu');
        return new Promise(function (resolve) {
          puT = setTimeout(function () { root.classList.remove('pu'); busy = false; resolve(); }, (NEV.util && NEV.util.reduced && NEV.util.reduced()) ? 50 : 2600);
        });
      },
      destroy() { cancelAnimationFrame(raf); clearTimeout(puT); el.innerHTML = ''; }
    };
  };
})(window);
