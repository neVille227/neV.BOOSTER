/* neV.BOOSTER — Mon compte : informations, export des données, suppression */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc;
  const ctx = await NEV.boot('compte', { needLevel: false }); if (!ctx) return;
  const user = ctx.user, server = NEV.cloud.mode === 'server';
  let acc = null;
  if (server) { const r = await NEV.cloud.api('account'); if (r.ok) acc = r.data; }
  const u = (acc && acc.user) || user;
  const rows = [['Pseudo', esc(u.pseudo)], ['E-mail', esc(u.email) + (server ? (u.verified ? ' <span class="chip gold">confirmé</span>' : ' <span class="chip bad">à confirmer</span>') : '')], ['Code de parrainage', esc(u.code)], ['Inscrit le', esc(u.created)], ['Stockage', server ? 'Serveur sécurisé' : 'Cet appareil (mode démo)']];
  $('box').innerHTML =
    '<section><h2>Mes informations</h2><div class="kpi" style="grid-template-columns:1fr">' + rows.map((r) => '<div style="text-align:left;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap"><span>' + r[0] + '</span><b style="font-size:1rem;color:#fff">' + r[1] + '</b></div>').join('') + '</div>' +
    (server && !u.verified ? '<p class="muted">Ton adresse n\'est pas encore confirmée. <button type="button" class="btn ghost sm" id="bVerif">Renvoyer le lien</button> <span id="mVerif" class="muted"></span></p>' : '') + '</section>' +
    (server ? '<section><h2>Classement</h2><p>Par défaut, tu n\'apparais que dans le classement entre amis (quand vous avez chacun ajouté le code de l\'autre). Tu peux aussi apparaître dans le classement public, avec ton seul pseudo.</p><label class="check"><input type="checkbox" id="cBoard"' + (u.publicBoard ? ' checked' : '') + '><span>Apparaître dans le classement public</span></label></section>' : '') +
    '<section><h2>Appli et rappel</h2><p>Installe neV.BOOSTER sur l\'écran d\'accueil : il s\'ouvre en plein écran et les pages déjà vues restent consultables sans réseau.</p><button type="button" class="btn ghost" id="bInst" hidden>Installer l\'appli</button><p class="muted" id="mInst"></p>' +
    '<div id="rem" hidden><label class="check"><input type="checkbox" id="cRem"><span>Me rappeler ma séance du jour</span></label><div class="field" style="max-width:220px;margin-top:12px"><label for="rHour">À partir de</label><select id="rHour">' + [6,8,10,12,14,16,17,18,19,20,21].map((h) => '<option value="' + h + '">' + h + ' h</option>').join('') + '</select></div><p class="muted">Honnêtement : le rappel s\'affiche quand tu ouvres l\'appli après cette heure et que ta séance n\'est pas faite. Un navigateur ne peut pas réveiller ton téléphone tout seul sans service d\'envoi dédié.</p></div></section>' +
    '<section><h2>Télécharger mes données</h2><p>Un fichier contenant tout ce que neV.BOOSTER conserve à ton sujet : compte, séances, badges, messages.</p><button type="button" class="btn ghost" id="bExp">Télécharger mes données</button></section>' +
    '<section><h2>Supprimer mon compte</h2><p>Cette action est <b>définitive</b> : ta progression, tes badges et tes messages sont effacés.</p>' +
    (server ? '<div class="field" style="max-width:340px"><label for="dpw">Mot de passe</label><input id="dpw" type="password" autocomplete="current-password"></div>' : '') +
    '<div class="err" id="eDel" role="alert"></div><button type="button" class="btn" id="bDel" style="background:linear-gradient(135deg,#7a0f26,#c0283f)">Supprimer mon compte</button></section>' +
    '<p class="muted">Voir aussi : <a href="confidentialite.html">Confidentialité</a> · <a href="conditions.html">Conditions d\'utilisation</a> · <a href="mentions-legales.html">Mentions légales</a>.</p>';
  const v = $('bVerif'); if (v) v.addEventListener('click', async () => { v.disabled = true; const r = await NEV.cloud.api('verify/resend', 'POST', {}); $('mVerif').textContent = r.ok ? (r.data.mail ? 'Lien envoyé.' : 'Demande enregistrée (envoi d\'e-mails non activé).') : (r.data.error || 'Impossible.'); });
  const cb = $('cBoard'); if (cb) cb.addEventListener('change', async () => { const r = await NEV.cloud.api('account/board', 'POST', { public: cb.checked }); if (!r.ok) { cb.checked = !cb.checked; } });
  (function pwa() {
    const P = NEV.pwa; if (!P) return;
    const bi = $('bInst'), mi = $('mInst');
    if (P.standalone()) mi.textContent = 'L\'appli est déjà installée sur cet appareil.';
    else if (P.canInstall()) bi.hidden = false;
    else mi.textContent = 'Pour l\'installer : menu du navigateur → « Ajouter à l\'écran d\'accueil » (sur iPhone : Partager → Sur l\'écran d\'accueil).';
    bi.addEventListener('click', async () => { if (await P.install()) { bi.hidden = true; mi.textContent = 'Installée ✓'; } });
    if (P.notifSupported()) {
      $('rem').hidden = false; const c = P.reminder(), cr = $('cRem'), rh = $('rHour');
      cr.checked = !!c.on && Notification.permission === 'granted'; rh.value = String(c.hour);
      const apply = async () => { const r = await P.setReminder(cr.checked, rh.value); cr.checked = r.on; };
      cr.addEventListener('change', apply); rh.addEventListener('change', () => { if (cr.checked) apply(); });
    }
  })();
  function save(name, text) { const b = new Blob([text], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  $('bExp').addEventListener('click', () => {
    if (server) { location.href = NEV.cloud.root + 'api/account/export'; return; }
    save('neVBOOSTER-mes-donnees.json', JSON.stringify({ app: 'neV.BOOSTER', exported: new Date().toISOString(), user: { pseudo: user.pseudo, email: user.email, code: user.code, created: user.created }, player: NEV.player.load() }, null, 1));
  });
  $('bDel').addEventListener('click', async () => {
    $('eDel').textContent = '';
    if (!window.confirm('Supprimer définitivement ton compte et toutes tes données ?')) return;
    if (server) {
      const r = await NEV.cloud.api('account/delete', 'POST', { password: $('dpw').value });
      if (!r.ok) { $('eDel').textContent = r.data.error || 'Suppression impossible.'; return; }
      NEV.store.del('nev.session'); NEV.go('connexion.html'); return;
    }
    const users = NEV.auth._users(); delete users[user.email]; NEV.store.set('nev.users', users); NEV.store.del(NEV.player.key(user.id)); NEV.store.del('nev.session'); NEV.go('connexion.html');
  });
})();
