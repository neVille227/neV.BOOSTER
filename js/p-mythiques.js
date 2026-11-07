/* neV.BOOSTER — Cartes mythiques (page publique) : 7 mouvements d'élite en 3D */
(async function () {
  'use strict';
  await NEV.bootPublic('mythiques');
  const esc = NEV.util.esc;
  const MOVES = [
    { id: 'c1', name: 'Pompes à un bras', en: 'One-Arm Push-Up', tags: ['Pectoraux', 'Épaules', 'Triceps', 'Tronc'] },
    { id: 'c2', name: 'Pompes en équilibre sur les mains', en: 'Handstand Push-Ups', tags: ['Épaules', 'Triceps', 'Trapèzes', 'Tronc'] },
    { id: 'c3', name: 'Pompes pseudo-planche avancées', en: 'Advanced Pseudo Planche Push-Ups', tags: ['Épaules', 'Pectoraux', 'Triceps', 'Abdominaux'] },
    { id: 'c4', name: 'Tractions à un bras', en: 'One-Arm Pull-Up', tags: ['Dorsaux', 'Biceps', 'Avant-bras', 'Tronc'] },
    { id: 'c5', name: 'Dragon Flag', en: 'Dragon Flag', tags: ['Abdominaux', 'Tronc', 'Dorsaux', 'Quadriceps'] },
    { id: 'c6', name: 'Muscle-up strict', en: 'Strict Muscle-Up', tags: ['Dorsaux', 'Biceps', 'Pectoraux', 'Triceps'] },
    { id: 'c7', name: 'Planche complète', en: 'Full Planche', tags: ['Épaules', 'Pectoraux', 'Abdominaux', 'Tronc'] }
  ];
  const OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const grid = document.getElementById('grid');
  grid.innerHTML = MOVES.map(function (m) {
    return '<article class="mc"><div class="mc-in">' +
      '<header class="mc-top"><div class="mc-sr">MR</div><div class="mc-st" role="img" aria-label="5 étoiles sur 5">★★★★★</div></header>' +
      '<div class="mc-frame"><canvas data-m="' + m.id + '" role="img" aria-label="Avatar 3D qui réalise : ' + esc(m.name) + '"></canvas><span class="mc-em" aria-hidden="true"></span>' +
      '<span class="mc-rep">RÉP. 1/12</span><span class="mc-ok" aria-hidden="true">' + OK + '</span>' +
      '<div class="mc-hud" aria-hidden="true"><span>ACTIVATION</span><span class="mc-gauge"><b></b></span><span class="mc-pct">0%</span></div></div>' +
      '<h2 class="mc-name">' + esc(m.name) + '</h2><p class="mc-en">' + esc(m.en) + '</p>' +
      '<ul class="mc-tags">' + m.tags.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
      '<footer class="mc-ft"><b>MYTHIQUE</b><b>NEV.BOOSTER</b></footer></div></article>';
  }).join('');
  grid.querySelectorAll('canvas[data-m]').forEach((cv) => NEV.Mythic.mount(cv, cv.dataset.m));
})();
