/* neV.BOOSTER — Mon avatar : personnalisation (peau, cheveux, yeux, tenue, accent) avec aperçu en direct */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const ctx = await NEV.boot('avatar', { needLevel: false }); if (!ctx) return;
  const A = NEV.Avatar;
  let cur = Object.assign({ skin: null, hair: null, eyes: null, outfit: null, accent: null }, A.get());
  let hero = null;

  const GROUPS = [
    ['skin', 'Teint de peau', A.SKINS, (o) => o[1], (o) => o[1]],
    ['hair', 'Cheveux', A.HAIRS, (o) => o[1], (o) => o[1]],
    ['eyes', 'Yeux', A.EYES, (o) => o[0], (o) => o[1][1]],
    ['outfit', 'Tenue', A.OUTFITS, (o) => o[1], (o) => o[1]],
    ['accent', 'Couleur d\'accent', A.ACCENTS, (o) => o[1], (o) => o[1]]
  ];

  function draw() {
    const el = $('avCtl');
    el.innerHTML = GROUPS.map(function (g) {
      return '<fieldset class="avx-g"><legend>' + g[1] + '</legend><div class="avx-sw" role="radiogroup" aria-label="' + g[1] + '">' +
        '<button type="button" class="sw def' + (cur[g[0]] == null ? ' on' : '') + '" data-k="' + g[0] + '" data-v="" role="radio" aria-checked="' + (cur[g[0]] == null) + '" title="D\'origine">Origine</button>' +
        g[2].map(function (o) {
          const v = g[3](o), on = cur[g[0]] === v;
          return '<button type="button" class="sw' + (on ? ' on' : '') + '" data-k="' + g[0] + '" data-v="' + v + '" role="radio" aria-checked="' + on + '" aria-label="' + o[0] + '" title="' + o[0] + '" style="--c:' + g[4](o) + '"></button>';
        }).join('') + '</div></fieldset>';
    }).join('') +
      '<div class="avx-act"><button type="button" class="btn" id="avSave">Enregistrer mon avatar</button><button type="button" class="btn ghost" id="avReset">Remettre l\'apparence d\'origine</button><span class="muted" id="avMsg" role="status"></span></div>';
  }

  function preview() {
    /* l'avatar illustré lit l'apparence enregistrée : on l'applique le temps de l'aperçu */
    A.preview = Object.assign({}, cur);
    const k = Number($('avM').value) || 3;
    if (hero) hero.destroy();
    hero = NEV.Hero.mount($('avStage'), { stage: k, aura: 'none' });
  }

  /* l'aperçu temporaire passe par get() sans écrire dans le profil */
  const realGet = A.get.bind(A);
  A.get = function () { return A.preview ? A.clean(A.preview) : realGet(); };

  draw(); preview();
  $('avCtl').addEventListener('click', function (e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.k) { cur[b.dataset.k] = b.dataset.v === '' ? null : b.dataset.v; draw(); preview(); return; }
    if (b.id === 'avSave') {
      A.set(cur);
      $('avMsg').textContent = 'Avatar enregistré ✓'; preview();
    }
    if (b.id === 'avReset') {
      cur = { skin: null, hair: null, eyes: null, outfit: null, accent: null };
      A.reset();
      draw(); preview(); $('avMsg').textContent = 'Apparence d\'origine rétablie.';
    }
  });
  $('avM').addEventListener('input', function () { if (hero) hero.setStage(Number(this.value)); });
})();
