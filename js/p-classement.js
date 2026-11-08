/* neV.BOOSTER — Classement (public par défaut + amis, XP ou scores des défis) et page Amis */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, P = NEV.Policy;
  const ctx = await NEV.boot($('friends') ? 'amis' : 'classement'); if (!ctx) return;
  const p = ctx.p, user = ctx.user, server = NEV.cloud.mode === 'server';
  let scope = 'public', per = 'week', kind = 'xp';
  const DEFIS = P.DEFIS || [];

  /* ---- classement et amis (serveur) ---- */
  function seg() {
    const chips = [['xp', 'XP']].concat(DEFIS.map((d) => [d.id, d.name]));
    const pers = kind === 'xp' ? [['week', 'Semaine'], ['month', 'Mois'], ['season', 'Saison']] : [['week', 'Semaine'], ['month', 'Mois'], ['all', 'Record']];
    if (!pers.some((x) => x[0] === per)) per = pers[0][0];
    return '<div class="cl-seg" role="group" aria-label="Type de classement"><button type="button" data-scope="public" class="' + (scope === 'public' ? 'on' : '') + '">Public</button><button type="button" data-scope="friends" class="' + (scope === 'friends' ? 'on' : '') + '">Entre amis</button><span class="gap"></span>' +
      pers.map((x) => '<button type="button" data-per="' + x[0] + '" class="' + (per === x[0] ? 'on' : '') + '">' + x[1] + '</button>').join('') + '</div>' +
      '<div class="cl-seg cl-kinds" role="group" aria-label="Quel classement">' + chips.map((x) => '<button type="button" data-kind="' + x[0] + '" class="' + (kind === x[0] ? 'on' : '') + '">' + esc(x[1]) + '</button>').join('') + '</div>';
  }
  /* bandeau de fin de semaine : compte à rebours jusqu'au prochain lundi (UTC, comme le classement) */
  let tmr = 0;
  function banner() {
    return '<div class="cl-ban"><div><b>Classement de la semaine</b><small>Les points repartent de zéro chaque lundi. Prends la tête avant la fin !</small></div><div class="cd" id="cd" aria-label="Temps restant"><div><b>–</b><span>JOURS</span></div><div><b>–</b><span>HEURES</span></div><div><b>–</b><span>MIN</span></div></div><a class="btn" href="defis.html" data-go>Relever le défi</a></div>';
  }
  function tick() {
    const el = $('cd'); if (!el) return;
    const end = Date.parse(P.addDays(P.weekStart(NEV.util.todayStr()), 7) + 'T00:00:00Z'), ms = Math.max(0, end - Date.now());
    const v = [Math.floor(ms / 864e5), Math.floor(ms % 864e5 / 36e5), Math.floor(ms % 36e5 / 6e4)];
    Array.prototype.forEach.call(el.querySelectorAll('b'), (b, i) => { b.textContent = v[i]; });
    clearTimeout(tmr); tmr = setTimeout(tick, 30000);
  }
  async function drawBoard() {
    if (!server) {
      const st = localStats(P.weekStart(NEV.util.todayStr()), '9999-12-31');
      $('boardNote').textContent = 'Mode démo : le classement entre joueurs a besoin du serveur.';
      $('board').innerHTML = '<div class="cl-row me"><b class="rk">1</b><div><div class="nm">' + esc(user.pseudo) + ' (toi)</div><small>' + st.sessions + ' séance(s) cette semaine</small></div><div class="xp">' + st.xp + ' XP</div></div><p class="cl-empty">Connecte le site au serveur pour comparer tes séances avec les autres joueurs.</p>';
      return;
    }
    const dd = DEFIS.find((x) => x.id === kind);
    const r = dd ? await NEV.cloud.api('defi/board?id=' + dd.id + '&scope=' + scope + '&period=' + per) : await NEV.cloud.api('board?scope=' + scope + '&period=' + per);
    const d = r.ok ? r.data : { rows: [], period: { label: '' } };
    $('boardNote').textContent = (d.period && d.period.label ? d.period.label + ' · ' : '') + (dd ? 'meilleurs scores validés par la caméra · ' : '') + (scope === 'friends' ? 'toi et tes amis réciproques.' : 'tous les joueurs qui n\'ont pas choisi de se retirer.');
    const fmt = (v) => (dd && dd.kind === 'hold' ? (v >= 60 ? Math.floor(v / 60) + ' min ' + (v % 60) + ' s' : v + ' s') : v + (dd ? ' rép.' : ' XP'));
    const rowOf = (x) => '<div class="cl-row' + (x.me ? ' me' : '') + '"><b class="rk">' + x.rank + '</b><div><div class="nm">' + esc(x.pseudo) + (x.me ? ' (toi)' : '') + '</div><small>' + (dd ? 'Défi ' + esc(dd.name.toLowerCase()) : x.sessions + ' séance' + (x.sessions > 1 ? 's' : '') + ' · série ' + x.streak) + '</small></div><div class="xp">' + fmt(dd ? x.score : x.xp) + '</div></div>';
    const R = d.rows || [], pod = R.length >= 3 && !dd ? R.slice(0, 3) : [];
    const podium = pod.length ? '<div class="podium" aria-label="Podium">' + [1, 0, 2].map((k) => { const x = pod[k]; return '<div class="pd r' + (k + 1) + (x.me ? ' me' : '') + '"><span class="rk">' + x.rank + '</span><span class="nm">' + esc(x.pseudo) + (x.me ? ' (toi)' : '') + '</span><span class="xp">' + fmt(x.xp) + '</span><small>série ' + x.streak + '</small></div>'; }).join('') + '</div>' : '';
    const rows = podium + R.slice(pod.length).map(rowOf).join('');
    const empty = dd ? '<p class="cl-empty">Aucun score pour l\'instant. <a href="defis.html" data-go><b>Lance le défi</b></a> et prends la première place !</p>' : '<p class="cl-empty">Personne à afficher pour le moment.</p>';
    const optin = scope === 'public' ? '<label class="cl-opt"><input type="checkbox" id="optin"' + (d.publicOptIn ? ' checked' : '') + '><span>Apparaître dans le classement public avec mon pseudo (activé par défaut, tu peux te retirer quand tu veux).</span></label>' : '';
    $('board').innerHTML = banner() + seg() + (rows || empty) + optin; tick();
  }
  if ($('board')) $('board').addEventListener('click', (e) => { const b = e.target.closest('[data-scope],[data-per],[data-kind]'); if (!b) return; if (b.dataset.scope) scope = b.dataset.scope; if (b.dataset.per) per = b.dataset.per; if (b.dataset.kind) kind = b.dataset.kind; drawBoard(); });
  if ($('board')) $('board').addEventListener('change', async (e) => { if (e.target.id !== 'optin') return; const r = await NEV.cloud.api('account/board', 'POST', { public: e.target.checked }); if (!r.ok) e.target.checked = false; drawBoard(); });

  async function drawFriends() {
    if (!server) { $('friends').innerHTML = '<p class="cl-empty">Les amis demandent le serveur (mode démo : non disponible).</p>'; return; }
    const r = await NEV.cloud.api('friends'), d = r.ok ? r.data : { code: user.code, friends: [], waiting: [] };
    $('friends').innerHTML = '<p style="margin:0 0 18px">Ton code : <b class="gold">' + esc(d.code) + '</b> — donne-le à tes amis.</p><form class="cl-add" id="addf" autocomplete="off"><input id="fc" maxlength="12" placeholder="Code de ton ami (ex. NEV12AB)" aria-label="Code de ton ami"><button class="btn" type="submit">Ajouter</button></form><div class="err" id="fe" role="alert"></div>' +
      (d.friends.length ? '<div class="eyebrow">Amis</div><div class="cl-fr">' + d.friends.map((f) => '<span>' + esc(f.pseudo) + '<button type="button" data-rm="' + esc(f.id) + '" aria-label="Retirer ' + esc(f.pseudo) + '">✕</button></span>').join('') + '</div>' : '<p class="muted">Pas encore d\'ami dans ton classement.</p>') +
      (d.waiting.length ? '<div class="eyebrow" style="margin-top:22px">En attente de leur côté</div><div class="cl-fr">' + d.waiting.map((f) => '<span>' + esc(f.code) + '<button type="button" data-rm="' + esc(f.id) + '" aria-label="Annuler">✕</button></span>').join('') + '</div><p class="muted" style="margin-top:12px">Dis à ces amis d\'ajouter ton code pour qu\'ils apparaissent.</p>' : '');
  }
  if ($('friends')) $('friends').addEventListener('submit', async (e) => {
    e.preventDefault(); const code = $('fc').value.trim(); if (!code) return;
    const r = await NEV.cloud.api('friends', 'POST', { code: code });
    if (!r.ok) { $('fe').textContent = (r.data && r.data.error) || 'Impossible.'; return; }
    await drawFriends(); if ($('board')) drawBoard();
  });
  if ($('friends')) $('friends').addEventListener('click', async (e) => { const b = e.target.closest('[data-rm]'); if (!b) return; await NEV.cloud.api('friends/remove', 'POST', { id: b.dataset.rm }); await drawFriends(); if ($('board')) drawBoard(); });

  if ($('board')) drawBoard();
  if ($('friends')) drawFriends();
})();
