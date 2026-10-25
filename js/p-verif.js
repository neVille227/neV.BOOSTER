/* neV.BOOSTER — confirmation de l'adresse e-mail (lien reçu par courriel) */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var token = new URLSearchParams(location.search).get('t') || '';
  NEV.ready(async function (mode) {
    $('go').hidden = false;
    if (mode !== 'server' || !token) { $('ttl').textContent = 'Lien invalide'; $('sub').textContent = 'Ce lien de confirmation est incomplet.'; return; }
    var r = await NEV.cloud.api('verify', 'POST', { token: token });
    if (r.ok) { $('ttl').textContent = 'Adresse confirmée ✓'; $('sub').textContent = 'Merci ! Ton compte est maintenant vérifié.'; }
    else { $('ttl').textContent = 'Lien invalide'; $('sub').textContent = r.data.error || 'Ce lien a déjà été utilisé ou a expiré.'; }
  });
})();
