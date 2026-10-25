/* neV.BOOSTER — mot de passe oublié / nouveau mot de passe */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var token = new URLSearchParams(location.search).get('t') || '';
  function show(msg) { $('fAsk').hidden = true; $('fNew').hidden = true; $('done').hidden = false; $('done').textContent = msg; }
  NEV.ready(async function (mode) {
    if (mode !== 'server') { $('sub').textContent = 'Mode démo : ton compte est enregistré uniquement sur cet appareil, il n\'y a pas d\'e-mail. Crée un nouveau compte, ou connecte le site au serveur pour activer la récupération.'; $('fAsk').hidden = true; return; }
    if (token) {
      var c = await NEV.cloud.api('token/check', 'POST', { token: token, kind: 'reset' });
      if (c.ok && c.data.ok) { $('ttl').textContent = 'Nouveau mot de passe'; $('sub').textContent = 'Choisis un mot de passe d\'au moins 8 caractères.'; $('fAsk').hidden = true; $('fNew').hidden = false; }
      else { $('ttl').textContent = 'Lien expiré'; $('sub').textContent = 'Ce lien n\'est plus valable. Refais une demande ci-dessous.'; }
    }
    $('fAsk').addEventListener('submit', async function (e) {
      e.preventDefault(); $('eAsk').textContent = ''; $('bAsk').disabled = true;
      var r = await NEV.cloud.api('forgot', 'POST', { email: $('em').value });
      $('bAsk').disabled = false;
      if (!r.ok) { $('eAsk').textContent = r.data.error || 'Impossible pour le moment.'; return; }
      show(r.data.mail ? 'Si un compte existe avec cet e-mail, un lien vient d\'être envoyé. Pense à regarder tes spams.' : 'Demande enregistrée. L\'envoi d\'e-mails n\'est pas activé sur ce site : écris au coach, il te transmettra le lien.');
    });
    $('fNew').addEventListener('submit', async function (e) {
      e.preventDefault(); $('eNew').textContent = '';
      if ($('pw').value.length < 8) { $('eNew').textContent = 'Le mot de passe doit faire au moins 8 caractères.'; return; }
      if ($('pw').value !== $('pw2').value) { $('eNew').textContent = 'Les deux mots de passe ne sont pas identiques.'; return; }
      $('bNew').disabled = true;
      var r = await NEV.cloud.api('reset', 'POST', { token: token, password: $('pw').value });
      $('bNew').disabled = false;
      if (!r.ok) { $('eNew').textContent = r.data.error || 'Impossible pour le moment.'; return; }
      show('C\'est fait ! Tu peux te connecter avec ton nouveau mot de passe.'); setTimeout(function () { location.href = 'connexion.html'; }, 2200);
    });
  });
})();
