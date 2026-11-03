/* neV.BOOSTER — theme.js : applique le thème (sombre = version homme, clair = version femme)
   avant l'affichage, d'après le dernier profil connu sur cet appareil. */
(function (g) {
  'use strict';
  var N = (g.NEV = g.NEV || {});
  function apply(sex) {
    N.sex = sex === 'f' ? 'f' : 'm';
    var d = g.document.documentElement;
    d.setAttribute('data-sex', N.sex);
    if (N.sex === 'f') d.setAttribute('data-theme', 'light'); else d.removeAttribute('data-theme');
    var m = g.document.querySelector('meta[name=theme-color]');
    if (m) m.setAttribute('content', N.sex === 'f' ? '#fbf6f7' : '#0a0507');
    var mf = g.document.querySelector('link[rel=manifest]');
    if (mf) mf.setAttribute('href', N.sex === 'f' ? 'manifest-femme.webmanifest' : 'manifest.webmanifest');
  }
  N.setSex = function (sex) { try { g.localStorage.setItem('nev.sex', sex === 'f' ? 'f' : 'm'); } catch (e) { /* ignoré */ } apply(sex); };
  var s = 'm'; try { s = g.localStorage.getItem('nev.sex') || 'm'; } catch (e) { /* ignoré */ }
  apply(s);
  if (g.document.readyState === 'loading') g.document.addEventListener('DOMContentLoaded', function () { apply(s); });
})(window);
