/* neV.BOOSTER — Salon des coachs : le coach de l'utilisateur (Baki / Yuki) */
(async function () {
  'use strict';
  const ctx = await NEV.boot('coachs'); if (!ctx) return;
  const f = ctx.p.sex === 'f';
  document.getElementById('coach').innerHTML = '<img src="' + (f ? 'femme/img/yuki-coach.webp' : 'img/baki.webp') + '" alt="' + (f ? 'Yuki' : 'Baki') + '" width="150" height="200">' +
    '<div class="info"><div class="eyebrow">Coach · tous niveaux</div><h2 style="margin:6px 0">' + (f ? 'Yuki' : 'Baki') + '</h2><p class="muted" style="margin:0 0 14px">' +
    (f ? 'Exigeante et bienveillante : elle te guide séance après séance et te donne un conseil à chaque visite.' : 'Discipline, régularité, progression : il te guide séance après séance.') +
    '</p><a class="btn" href="chat.html#coach" data-go>Écrire au coach</a></div>';
})();
