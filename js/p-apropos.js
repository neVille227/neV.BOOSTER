/* neV.BOOSTER — À propos : tout sur l'utilisateur et sur le site */
(async function () {
  'use strict';
  const esc = NEV.util.esc;
  const ctx = await NEV.boot('apropos'); if (!ctx) return;
  const u = ctx.user, p = ctx.p, lv = NEV.levelFromMax(p.maxPushups), h = NEV.heroFromXp(p.progress.xp);
  const row = (k, v) => '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>';
  document.getElementById('me').innerHTML = row('Pseudo', u.pseudo) + row('E-mail', u.email || '—') + row('Version', p.sex === 'f' ? 'Femme (thème clair, coach Yuki)' : 'Homme (thème sombre, coach Baki)') + row('Mon code ami', u.code || NEV.auth.codeOf(u.id)) + row('Membre depuis', u.created ? NEV.util.frDate(u.created) : '—') + row('Mode', NEV.cloud.mode === 'server' ? 'Compte en ligne' : 'Démo sur cet appareil');
  document.getElementById('prog').innerHTML = row('Niveau', lv.n + ' · ' + lv.name) + row('Palier', h.stage.n + ' · ' + h.stage.name) + row('XP', String(p.progress.xp)) + row('Série', p.progress.streak + ' jour(s)') + row('Record', p.progress.best + ' jour(s)') + row('Séances', String(p.progress.total)) + row('Flammes', String(p.flames));
  document.getElementById('site').innerHTML = row('Nom', 'neV.BOOSTER') + row('Slogan', 'Booste ton quotidien') + row('Langues', '7 langues (menu de langue)') + row('Appli', NEV.pwa && NEV.pwa.standalone() ? 'Installée' : 'Installable depuis ton navigateur') + row('Hors ligne', 'Pages déjà visitées disponibles');
})();
