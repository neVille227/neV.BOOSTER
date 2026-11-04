/* neV.BOOSTER — theme.js : applique le thème (sombre = version homme, clair = version femme)
   avant l'affichage, d'après le dernier profil connu sur cet appareil.
   Tant qu'aucun compte n'existe sur l'appareil, l'appli garde l'icône neutre (logo mi-sombre mi-clair). */
(function (g) {
  'use strict';
  var N = (g.NEV = g.NEV || {});
  var MAN = { n: 'manifest.webmanifest', m: 'manifest-homme.webmanifest', f: 'manifest-femme.webmanifest' };
  var SUF = { n: '-n', m: '', f: '-f' };
  function apply(sex, known) {
    N.sex = sex === 'f' ? 'f' : 'm';
    N.known = !!known;
    var key = known ? N.sex : 'n', d = g.document.documentElement;
    d.setAttribute('data-sex', N.sex);
    if (N.sex === 'f') d.setAttribute('data-theme', 'light'); else d.removeAttribute('data-theme');
    var m = g.document.querySelector('meta[name=theme-color]');
    if (m) m.setAttribute('content', N.sex === 'f' ? '#fbf6f7' : '#0a0507');
    var q = function (sel, attr, val) { var e = g.document.querySelector(sel); if (e) e.setAttribute(attr, val); };
    q('link[rel=manifest]', 'href', MAN[key]);
    q('link[rel=icon]', 'href', 'img/favicon' + SUF[key] + '-32.png');
    q('link[rel=apple-touch-icon]', 'href', 'img/apple-touch-icon' + SUF[key] + '.png');
  }
  /* compte connu sur l'appareil : le thème et l'icône suivent le sexe du compte */
  N.setSex = function (sex) { try { g.localStorage.setItem('nev.sex', sex === 'f' ? 'f' : 'm'); } catch (e) { /* ignoré */ } apply(sex, true); };
  /* simple aperçu du thème (choix du sexe à l'inscription) : rien n'est enregistré */
  N.previewSex = function (sex) { apply(sex, false); };
  var s = null; try { s = g.localStorage.getItem('nev.sex'); } catch (e) { /* ignoré */ }
  /* mode visiteur (?visiteur=m|f) : simple aperçu du thème choisi, appareil non marqué, icône neutre */
  var gq = /[?&]visiteur=([mf])/.exec(g.location.search), vis = gq ? gq[1] : null;
  N.guest = vis;
  var sx = s || vis || 'm', kn = !!s;
  apply(sx, kn);
  if (g.document.readyState === 'loading') g.document.addEventListener('DOMContentLoaded', function () { apply(sx, kn); });
})(window);
