/* neV.BOOSTER — Classement, défi de la semaine, saison, amis */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, P = NEV.Policy;
  const ctx = await NEV.boot('classement'); if (!ctx) return;
  const p = ctx.p, user = ctx.user, server = NEV.cloud.mode === 'server';
  let scope = 'friends', per = 'week';

  /* ---- défis : calcul local (mode démo) ; en mode serveur c'est le serveur qui décide ---- */
  function localStats(from, to) {
    const h = (p.history || []).filter((x) => x.date >= from && x.date <= to);
    const days = {}; h.forEach((x) => { days[x.date] = 1; });
    return { sessions: h.length, days: Object.keys(days).length, reps: h.reduce((a, x) => a + (x.reps || 0) * (x.sets || 0), 0), xp: h.reduce((a, x) => a + (x.xpGain || 0), 0), verified: h.filter((x) => x.verified).length };
  }
  function localState() {
    const day = NEV.util.todayStr(), ch = P.challengeFor(day), se = P.seasonOf(day), cl = p.claims || {};
    const st = localStats(ch.start, ch.end), ss = localStats(se.start, se.end);
    const val = st[ch.metric];
    return {
      challenge: Object.assign({}, ch, { value: Math.min(val, ch.goal), done: val >= ch.goal, claimed: !!cl[ch.week] }),
      season: Object.assign({}, se, { sessions: ss.sessions, xp: ss.xp, goal: P.SEASON_REWARD.sessions, reward: P.SEASON_REWARD.flames, done: se.n > 0 && ss.sessions >= P.SEASON_REWARD.sessions, claimed: !!cl[se.id] })
    };
  }
  async function state() {
    if (server) { const r = await NEV.cloud.api('challenge'); if (r.ok) return r.data; }
    return localState();
  }
  const fdate = (s) => s.slice(8) + '/' + s.slice(5, 7);

  async function drawChal() {
    const s = await state(), c = s.challenge, se = s.season;
    const unit = { sessions: 'séances', days: 'jours', reps: 'répétitions', xp: 'XP', verified: 'séances caméra' }[c.metric] || '';
    const btn = (o, kind) => o.claimed ? '<span class="chip ok">Récompense récupérée ✓</span>' : o.done ? '<button type="button" class="btn" data-claim="' + kind + '">Récupérer +' + (o.reward) + ' flammes</button>' : '';
    $('chal').innerHTML =
      '<article class="panel glow cl-card"><div class="eyebrow">Défi de la semaine · du ' + fdate(c.start) + ' au ' + fdate(c.end) + '</div><h3>' + esc(c.title) + '</h3>' +
      '<div class="cl-bar" role="progressbar" aria-label="Progression du défi" aria-valuemin="0" aria-valuemax="' + c.goal + '" aria-valuenow="' + c.value + '"><i style="width:' + Math.round(100 * c.value / c.goal) + '%"></i></div>' +
      '<div class="cl-meta"><span>' + c.value + ' / ' + c.goal + ' ' + unit + '</span><span>🔥 +' + c.reward + '</span></div>' + btn(c, 'week') + '</article>' +
      '<article class="panel cl-card"><div class="eyebrow">Saison ' + (se.n || '—') + ' · ' + esc(se.name) + '</div><h3>' + (se.n ? se.left + ' jours restants' : 'La saison 1 commence le ' + fdate(P.seasonOf('2026-10-19').start)) + '</h3>' +
      (se.n ? '<p>Fais ' + se.goal + ' séances pendant la saison (six semaines) pour gagner ' + se.reward + ' flammes.</p><div class="cl-bar" role="progressbar" aria-label="Progression de la saison" aria-valuemin="0" aria-valuemax="' + se.goal + '" aria-valuenow="' + Math.min(se.sessions, se.goal) + '"><i style="width:' + Math.min(100, Math.round(100 * se.sessions / se.goal)) + '%"></i></div><div class="cl-meta"><span>' + Math.min(se.sessions, se.goal) + ' / ' + se.goal + ' séances</span><span>' + se.xp + ' XP gagnés</span></div>' + btn(se, 'season') : '<p>Chaque saison dure six semaines : un nouveau classement, une nouvelle récompense.</p>') + '</article>';
  }
  $('chal').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-claim]'); if (!b) return; b.disabled = true;
    const kind = b.dataset.claim, s = await state(), o = kind === 'season' ? s.season : s.challenge;
    if (server) {
      const r = await NEV.cloud.api('challenge/claim', 'POST', { kind: kind });
      if (!r.ok) { b.disabled = false; b.textContent = (r.data && r.data.error) || 'Échec'; return; }
    } else { p.claims = p.claims || {}; p.claims[kind === 'season' ? o.id : o.week] = 1; }
    p.flames += o.reward; p.flamesTotal += o.reward; NEV.player.save(p);
    const m = document.getElementById('meFlames'); if (m) m.textContent = p.flames;
    drawChal();
  });

  /* ---- classement et amis (serveur) ---- */
  function seg() {
    return '<div class="cl-seg" role="group" aria-label="Type de classement"><button type="button" data-scope="friends" class="' + (scope === 'friends' ? 'on' : '') + '">Entre amis</button><button type="button" data-scope="public" class="' + (scope === 'public' ? 'on' : '') + '">Public</button><span class="gap"></span>' +
      [['week', 'Semaine'], ['month', 'Mois'], ['season', 'Saison']].map((x) => '<button type="button" data-per="' + x[0] + '" class="' + (per === x[0] ? 'on' : '') + '">' + x[1] + '</button>').join('') + '</div>';
  }
  async function drawBoard() {
    if (!server) {
      const st = localStats(P.weekStart(NEV.util.todayStr()), '9999-12-31');
      $('boardNote').textContent = 'Mode démo : le classement entre joueurs a besoin du serveur.';
      $('board').innerHTML = '<div class="cl-row me"><b class="rk">1</b><div><div class="nm">' + esc(user.pseudo) + ' (toi)</div><small>' + st.sessions + ' séance(s) cette semaine</small></div><div class="xp">' + st.xp + ' XP</div></div><p class="cl-empty">Connecte le site au serveur pour comparer tes séances avec tes amis.</p>';
      return;
    }
    const r = await NEV.cloud.api('board?scope=' + scope + '&period=' + per);
    const d = r.ok ? r.data : { rows: [], period: { label: '' } };
    $('boardNote').textContent = (d.period && d.period.label ? d.period.label + ' · ' : '') + (scope === 'friends' ? 'toi et tes amis réciproques.' : 'les joueurs qui ont choisi d\'apparaître au classement public.');
    const rows = (d.rows || []).map((x) => '<div class="cl-row' + (x.me ? ' me' : '') + '"><b class="rk">' + x.rank + '</b><div><div class="nm">' + esc(x.pseudo) + (x.me ? ' (toi)' : '') + '</div><small>' + x.sessions + ' séance' + (x.sessions > 1 ? 's' : '') + ' · série ' + x.streak + '</small></div><div class="xp">' + x.xp + ' XP</div></div>').join('');
    const optin = scope === 'public' ? '<label class="cl-opt"><input type="checkbox" id="optin"' + (d.publicOptIn ? ' checked' : '') + '><span>Apparaître dans le classement public avec mon pseudo (décoché par défaut, tu peux changer quand tu veux).</span></label>' : '';
    $('board').innerHTML = seg() + (rows || '<p class="cl-empty">Personne à afficher pour le moment.</p>') + optin;
  }
  $('board').addEventListener('click', (e) => { const b = e.target.closest('[data-scope],[data-per]'); if (!b) return; if (b.dataset.scope) scope = b.dataset.scope; if (b.dataset.per) per = b.dataset.per; drawBoard(); });
  $('board').addEventListener('change', async (e) => { if (e.target.id !== 'optin') return; const r = await NEV.cloud.api('account/board', 'POST', { public: e.target.checked }); if (!r.ok) e.target.checked = false; drawBoard(); });

  async function drawFriends() {
    if (!server) { $('friends').innerHTML = '<p class="cl-empty">Les amis demandent le serveur (mode démo : non disponible).</p>'; return; }
    const r = await NEV.cloud.api('friends'), d = r.ok ? r.data : { code: user.code, friends: [], waiting: [] };
    $('friends').innerHTML = '<p style="margin:0 0 18px">Ton code : <b class="gold">' + esc(d.code) + '</b> — donne-le à tes amis.</p><form class="cl-add" id="addf" autocomplete="off"><input id="fc" maxlength="12" placeholder="Code de ton ami (ex. NEV12AB)" aria-label="Code de ton ami"><button class="btn" type="submit">Ajouter</button></form><div class="err" id="fe" role="alert"></div>' +
      (d.friends.length ? '<div class="eyebrow">Amis</div><div class="cl-fr">' + d.friends.map((f) => '<span>' + esc(f.pseudo) + '<button type="button" data-rm="' + esc(f.id) + '" aria-label="Retirer ' + esc(f.pseudo) + '">✕</button></span>').join('') + '</div>' : '<p class="muted">Pas encore d\'ami dans ton classement.</p>') +
      (d.waiting.length ? '<div class="eyebrow" style="margin-top:22px">En attente de leur côté</div><div class="cl-fr">' + d.waiting.map((f) => '<span>' + esc(f.code) + '<button type="button" data-rm="' + esc(f.id) + '" aria-label="Annuler">✕</button></span>').join('') + '</div><p class="muted" style="margin-top:12px">Dis à ces amis d\'ajouter ton code pour qu\'ils apparaissent.</p>' : '');
  }
  $('friends').addEventListener('submit', async (e) => {
    e.preventDefault(); const code = $('fc').value.trim(); if (!code) return;
    const r = await NEV.cloud.api('friends', 'POST', { code: code });
    if (!r.ok) { $('fe').textContent = (r.data && r.data.error) || 'Impossible.'; return; }
    await drawFriends(); drawBoard();
  });
  $('friends').addEventListener('click', async (e) => { const b = e.target.closest('[data-rm]'); if (!b) return; await NEV.cloud.api('friends/remove', 'POST', { id: b.dataset.rm }); await drawFriends(); drawBoard(); });

  await drawChal(); drawBoard(); drawFriends();
})();
