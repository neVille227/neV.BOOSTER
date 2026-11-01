/* neV.BOOSTER admin — installation en application (Android / ordinateur : bouton ; iPhone : mode d'emploi). */
(function (g) {
  'use strict';
  var doc = g.document, deferred = null;
  var standalone = (g.matchMedia && g.matchMedia('(display-mode: standalone)').matches) || g.navigator.standalone === true;
  if ('serviceWorker' in g.navigator && (g.location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(g.location.hostname))) {
    g.navigator.serviceWorker.register('../sw.js').catch(function () { /* ignoré */ });
  }
  var ios = /iphone|ipad|ipod/i.test(g.navigator.userAgent) || (g.navigator.platform === 'MacIntel' && g.navigator.maxTouchPoints > 1);
  function ui() {
    var box = doc.getElementById('inst'), go = doc.getElementById('instgo'), help = doc.getElementById('insthelp');
    if (!box || standalone) return;
    if (deferred) { box.hidden = false; help.textContent = 'Plein écran et icône « Admin » sur ton écran d\'accueil. Le mot de passe reste demandé à chaque ouverture.'; }
    else if (ios) { box.hidden = false; go.hidden = true; help.textContent = 'iPhone : touche Partager puis « Sur l\'écran d\'accueil ».'; }
    else return;
    go.onclick = function () { if (!deferred) return; deferred.prompt(); deferred.userChoice.then(function () { deferred = null; box.hidden = true; }); };
  }
  g.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; ui(); });
  g.addEventListener('appinstalled', function () { deferred = null; var b = doc.getElementById('inst'); if (b) b.hidden = true; });
  doc.addEventListener('DOMContentLoaded', ui);
})(window);
