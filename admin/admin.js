/* neV.BOOSTER — espace admin : tableau de bord, suivi, joueurs, combos, badges, annonces, chat */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, C = NEV.cloud, A = C.admin, R = NEV.Rewards, U = NEV.util;
  await C.ready;
  let tab = 'dash', timer = 0;

  const TABS = [['dash', '📊 Tableau de bord'], ['suivi', '🛰️ Suivi du site'], ['base', '🗄️ Base de données'], ['joueurs', '👥 Joueurs'], ['combos', '🧩 Combos'], ['badges', '🏅 Badges'], ['annonce', '📣 Annonce'], ['chat', '💬 Chat'], ['modo', '🛡️ Modération'], ['triche', '🚨 Anti-triche'], ['courriels', '✉️ Courriels'], ['relecture', '🩺 Relecture']];
  const ask = (msg) => new Promise((res) => {
    const m = document.createElement('div'); m.className = 'askm'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="panel glow askb"><p style="margin:0 0 14px;font-weight:700">' + esc(msg) + '</p><div class="row" style="margin:0"><button type="button" class="btn" data-y>Oui, confirmer</button><button type="button" class="btn ghost" data-n>Annuler</button></div></div>';
    document.body.appendChild(m);
    const done = (v) => { m.remove(); res(v); };
    m.addEventListener('click', (e) => { if (e.target.closest('[data-y]')) done(true); else if (e.target === m || e.target.closest('[data-n]')) done(false); });
    m.querySelector('[data-n]').focus();
  });
  const toast = (t, bad) => { const el = $('toast'); el.textContent = t; el.className = 'toast on ' + (bad ? 'bad-t' : 'ok-t'); clearTimeout(toast.t); toast.t = setTimeout(() => { el.className = 'toast'; }, 2600); };
  const dt = (t) => new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fd = (s) => (s ? s.slice(8) + '/' + s.slice(5, 7) : '—');
  const exName = (id) => { if (String(id).indexOf('combo:') === 0) return 'Combo ' + String(id).slice(6); const e = NEV.Ex.byId(id); return e ? e.name : id; };

  /* ---------- accès ---------- */
  async function gate() {
    const st = await A.state();
    if (st.authed) return start();
    $('app').hidden = true; $('gate').hidden = false;
    $('gtxt').textContent = st.hasPassword ? 'Entre le mot de passe admin.' : 'Première visite : choisis ton mot de passe admin (10 caractères minimum). Garde-le précieusement.';
    $('gp').autocomplete = st.hasPassword ? 'current-password' : 'new-password';
    $('gp').focus();
  }
  $('gf').addEventListener('submit', async (e) => {
    e.preventDefault(); $('gerr').textContent = '';
    const r = await A.login($('gp').value); $('gp').value = '';
    if (!r.ok) { $('gerr').textContent = r.error; return; }
    $('gate').hidden = true; start();
  });
  $('out').addEventListener('click', async () => { await A.logout(); clearInterval(timer); $('app').hidden = true; gate(); });
  function start() {
    $('gate').hidden = true; $('app').hidden = false;
    $('mode').textContent = C.mode === 'server' ? '● Mode serveur' : '● Mode démo (ce navigateur)';
    $('nav').innerHTML = TABS.map((t) => '<button type="button" data-t="' + t[0] + '">' + t[1] + '</button>').join('');
    show((location.hash || '').slice(1).split(':')[0] || 'dash');
  }
  $('nav').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) show(b.dataset.t); });
  async function show(t) {
    if (!TABS.some((x) => x[0] === t)) t = 'dash';
    tab = t; history.replaceState(null, '', '#' + t); clearInterval(timer); $('main').onclick = null;
    document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    $('main').innerHTML = '<p class="muted">Chargement…</p>';
    try { await VIEWS[t](); } catch (e) { $('main').innerHTML = '<div class="warnbar">Impossible de charger cette section : ' + esc(e.message || e) + '</div>'; }
  }

  /* ---------- graphiques ---------- */
  function bars(vals, labels, color) {
    const W = 360, H = 150, mx = Math.max(1, ...vals), bw = W / vals.length;
    return '<svg viewBox="0 0 ' + W + ' ' + (H + 24) + '" role="img" aria-label="Graphique en barres">' + vals.map((v, i) => {
      const h = Math.round((v / mx) * (H - 20));
      return '<rect x="' + (i * bw + 8) + '" y="' + (H - h) + '" width="' + (bw - 16) + '" height="' + h + '" rx="5" fill="' + (color || '#e0455f') + '"/><text x="' + (i * bw + bw / 2) + '" y="' + (H - h - 5) + '" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">' + v + '</text><text x="' + (i * bw + bw / 2) + '" y="' + (H + 16) + '" text-anchor="middle" fill="#c2a3aa" font-size="10">' + esc(labels[i]) + '</text>';
    }).join('') + '</svg>';
  }
  const hbars = (rows) => { const mx = Math.max(1, ...rows.map((r) => r[1])); return rows.length ? rows.map((r) => '<div class="hbar"><span class="n" title="' + esc(r[0]) + '">' + esc(r[0]) + '</span><span class="b"><i style="width:' + Math.round(r[1] / mx * 100) + '%"></i></span><b>' + r[1] + '</b></div>').join('') : '<p class="muted">Pas encore de données.</p>'; };
  const kpi = (rows) => '<div class="kpi">' + rows.map((r) => '<div><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></div>').join('') + '</div>';

  const VIEWS = {};
  /* ---------- tableau de bord ---------- */
  VIEWS.dash = async function () {
    const s = await A.stats(); if (!s) throw new Error('Statistiques indisponibles');
    const L = ['Éveil', 'Initié', 'Combattant', 'Guerrier', 'Légende'], Rr = ['Commun', 'Rare', 'Épique', 'Légendaire', 'Mythique'];
    $('main').innerHTML = '<h1>Tableau de bord</h1><p class="lead">Vue d\'ensemble de la communauté neV.BOOSTER.</p>' +
      kpi([[s.players, 'Joueurs'], [s.newToday, 'Nouveaux aujourd\'hui'], [s.sessionsTotal, 'Séances enregistrées'], [s.verifiedPct + ' %', 'Validées par caméra'], [s.avgStreak, 'Série moyenne'], [s.bestStreak, 'Meilleure série'], [s.flames, 'Flammes en circulation'], [s.referrals, 'Parrainages'], [s.doubled, 'Séances doublées'], [s.views24h, 'Pages vues (24 h)'], [s.errors24h, 'Erreurs (24 h)']]) +
      '<div class="g2"><div class="chart"><h3>Joueurs actifs (7 jours)</h3>' + bars(s.active, s.days.map(fd)) + '</div><div class="chart"><h3>Séances validées (7 jours)</h3>' + bars(s.sessions, s.days.map(fd), '#ff8a3d') + '</div>' +
      '<div class="chart"><h3>Niveaux des joueurs</h3>' + bars(s.levels, L, '#c8456e') + '</div><div class="chart"><h3>Raretés tirées</h3>' + bars(s.rarity, Rr, '#f0b24a') + '</div></div>' +
      '<h2>Exercices les plus tirés</h2><div class="chart">' + hbars(s.topExercises.map((x) => [exName(x.id), x.n])) + '</div>';
  };

  /* ---------- suivi du site ---------- */
  VIEWS.suivi = async function () {
    let type = '';
    async function draw() {
      const [s, ev] = await Promise.all([A.stats(), A.events(type)]);
      const sv = s.server || {}, pages = {};
      (await A.events('view')).forEach((e) => { pages[e.page] = (pages[e.page] || 0) + 1; });
      const t0 = performance.now(); let ping = null; try { const r = await C.api('health'); ping = r.ok ? Math.round(performance.now() - t0) : null; } catch (e) { /* ignoré */ }
      const alerts = [];
      if (s.errors24h > 0) alerts.push(s.errors24h + ' erreur(s) JavaScript dans les dernières 24 h : regarde le journal ci-dessous.');
      if (sv.badLogins > 20 || sv.adminBadLogins > 3) alerts.push('Beaucoup de connexions refusées (' + (sv.badLogins || 0) + ' joueurs, ' + (sv.adminBadLogins || 0) + ' admin) : possible tentative de piratage.');
      if (sv.blocked > 50) alerts.push(sv.blocked + ' requêtes ont été bloquées par la limitation de débit.');
      $('main').innerHTML = '<h1>Suivi du site</h1><p class="lead">État du serveur, activité et journal d\'événements.' + (C.mode !== 'server' ? ' <b>Mode démo :</b> seules les données de ce navigateur sont visibles.' : '') + '</p>' +
        (alerts.length ? alerts.map((a) => '<div class="warnbar">⚠️ ' + esc(a) + '</div>').join('') : '<div class="warnbar" style="background:#3ddc8412;border-color:#3ddc8455">✅ Aucune alerte.</div>') +
        kpi([[ping == null ? 'Hors ligne' : ping + ' ms', 'Réponse du serveur'], [sv.mode || '—', 'Mode'], [sv.uptimeS != null ? Math.floor(sv.uptimeS / 3600) + ' h ' + Math.floor(sv.uptimeS % 3600 / 60) + ' min' : '—', 'En ligne depuis'], [sv.memMB != null ? sv.memMB + ' Mo' : '—', 'Mémoire'], [sv.requests != null ? sv.requests : '—', 'Requêtes servies'], [sv.blocked != null ? sv.blocked : '—', 'Requêtes bloquées'], [sv.badLogins != null ? sv.badLogins : '—', 'Connexions refusées'], [sv.sessions != null ? sv.sessions : '—', 'Sessions ouvertes'], [sv.node || '—', 'Version de Node']]) +
        '<div class="g2"><div class="chart"><h3>Pages vues (journal récent)</h3>' + hbars(Object.keys(pages).map((k) => [k, pages[k]]).sort((a, b) => b[1] - a[1]).slice(0, 10)) + '</div><div class="chart"><h3>Joueurs actifs (7 jours)</h3>' + bars(s.active, s.days.map(fd)) + '</div></div>' +
        '<h2>Journal</h2><div class="row"><select id="evt" aria-label="Type d\'événement"><option value="">Tous les types</option>' + ['view', 'error', 'login', 'signup', 'gacha', 'session', 'camera'].map((x) => '<option' + (x === type ? ' selected' : '') + '>' + x + '</option>').join('') + '</select><button type="button" class="btn ghost sm" id="rf">Rafraîchir</button><span class="muted" style="font-size:.78rem">Mise à jour automatique toutes les 15 s</span></div>' +
        '<div class="tw"><table class="t"><thead><tr><th>Heure</th><th>Type</th><th>Page</th><th>Joueur</th><th>Détail</th></tr></thead><tbody>' + (ev.length ? ev.slice(0, 100).map((e) => '<tr><td>' + dt(e.t) + '</td><td>' + (e.type === 'error' ? '<span class="bad-t">error</span>' : esc(e.type)) + '</td><td>' + esc(e.page || '') + '</td><td>' + esc(e.name || '—') + '</td><td class="wrap">' + esc(JSON.stringify(e.data || {})) + '</td></tr>').join('') : '<tr><td colspan="5" class="muted">Aucun événement.</td></tr>') + '</tbody></table></div>';
      $('evt').onchange = (e) => { type = e.target.value; draw(); }; $('rf').onclick = draw;
    }
    await draw(); timer = setInterval(() => { if (tab === 'suivi' && !document.hidden) draw(); }, 15000);
  };

  /* ---------- base de données ---------- */
  let jumpUser = null;
  const bytesFmt = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' Mo' : n >= 1024 ? Math.round(n / 1024) + ' Ko' : n + ' o');
  const TIMECOL = new Set(['t', 'updated', 'last_login', 'lastLogin']);
  function cell(col, v) {
    if (v === null || v === undefined) return '<span class="muted">—</span>';
    if (TIMECOL.has(col) && typeof v === 'number' && v > 1e12) return '<span title="' + v + '">' + esc(dt(v)) + '</span>';
    if (typeof v === 'string' && /^[\[{]/.test(v) && v.length > 60) return '<code class="js">' + esc(v) + '</code>';
    return esc(String(v));
  }
  function grid(cols, rows, o) {
    o = o || {};
    return '<div class="tw"><table class="t"><thead><tr>' + cols.map((c) => '<th>' + (o.sortable ? '<button type="button" class="sorth" data-s="' + esc(c) + '">' + esc(c) + (o.sort === c ? (o.dir === 'asc' ? ' ▲' : ' ▼') : '') + '</button>' : esc(c)) + '</th>').join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.map((r) => '<tr' + (o.clickable && r._rowid != null ? ' class="clk" data-r="' + r._rowid + '" tabindex="0"' : '') + '>' + cols.map((c) => '<td class="' + (typeof r[c] === 'string' && r[c].length > 60 ? 'wrap' : '') + '">' + cell(c, r[c]) + '</td>').join('') + '</tr>').join('') : '<tr><td colspan="' + cols.length + '" class="muted">Aucune ligne.</td></tr>') + '</tbody></table></div>';
  }
  function modal(html) {
    const m = document.createElement('div'); m.className = 'askm'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="panel glow askb wide">' + html + '</div>'; document.body.appendChild(m);
    const close = () => m.remove();
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) close(); });
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    return { el: m, close };
  }
  const SAVE_OK = new Set(['chat_messages', 'events', 'workouts', 'logins', 'badge_grants', 'combos', 'badge_defs', 'admin_audit']);
  const saveBlob = (obj, name) => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 400); return true; } catch (e) { return false; } };

  VIEWS.base = async function () {
    const D = A.db, srv = C.mode === 'server';
    let info = await D.info(), sub = jumpUser ? 'fiche' : ((location.hash.split(':')[1]) || 'tables');
    if (['tables', 'fiche', 'sql', 'export'].indexOf(sub) < 0) sub = 'tables';
    let tbl = 'users', st = { q: '', page: 1, sort: '', dir: 'desc' }, curFiche = jumpUser; jumpUser = null;
    const tot = info.tables.filter((t) => t.kind === 'table').reduce((a, t) => a + t.rows, 0);
    $('main').innerHTML = '<h1>Base de données</h1><p class="lead">Toutes les informations du site et de ses joueurs, au même endroit.</p>' +
      (srv ? '<div class="warnbar" style="background:#3ddc8412;border-color:#3ddc8455">🗄️ <b>Base SQLite partagée</b> : chaque inscription, séance, badge et message de tous les joueurs y est enregistré. Les mots de passe sont dans un fichier séparé que cette page ne peut jamais lire.</div>' :
        '<div class="warnbar">🧪 <b>Mode démo</b> : la base visible ici est celle de <b>ce navigateur</b> uniquement. Pour la vraie base partagée entre tous les joueurs, lance <code>node server/server.js</code> (voir README).</div>') +
      kpi([[info.info.engine.replace('Stockage local du navigateur (mode démo)', 'Navigateur'), 'Moteur'], [bytesFmt(info.info.sizeBytes), 'Taille'], [info.info.tables, 'Tables'], [tot, 'Lignes au total'], [srv ? info.info.backups.length + ' / 7' : '—', 'Sauvegardes auto']]) +
      '<div class="subnav" id="sn">' + [['tables', '📋 Tables'], ['fiche', '🧑 Fiche joueur'], ['sql', '⌨️ Console SQL'], ['export', '💾 Export & sauvegardes']].map((x) => '<button type="button" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div><div id="bv"></div>';
    const bv = $('bv');
    function mark() { document.querySelectorAll('#sn button').forEach((b) => b.classList.toggle('on', b.dataset.v === sub)); history.replaceState(null, '', '#base:' + sub); }
    $('sn').onclick = (e) => { const b = e.target.closest('[data-v]'); if (b) { sub = b.dataset.v; draw(); } };

    /* --- tables --- */
    async function drawTables() {
      bv.innerHTML = '<div class="dbsplit"><div class="dbtl" id="tl">' + info.tables.map((t) => '<button type="button" data-t="' + esc(t.name) + '" class="' + (t.name === tbl ? 'on' : '') + '"><b>' + esc(t.name) + (t.kind === 'view' ? ' <span class="chip">vue</span>' : '') + '</b><span class="cnt">' + t.rows + '</span><small>' + esc(t.descr) + '</small></button>').join('') + '</div><div class="dbmain" id="tm"></div></div>';
      $('tl').onclick = (e) => { const b = e.target.closest('[data-t]'); if (b) { tbl = b.dataset.t; st = { q: '', page: 1, sort: '', dir: 'desc' }; drawTables(); } };
      await drawRows();
    }
    async function drawRows() {
      const tm = $('tm'); tm.innerHTML = '<p class="muted">Chargement…</p>';
      let d; try { d = await D.rows(tbl, st); } catch (e) { tm.innerHTML = '<div class="warnbar">' + esc(e.message) + '</div>'; return; }
      const cols = d.columns.map((c) => c.name), meta = info.tables.find((t) => t.name === tbl) || {};
      const exp = srv ? '<a class="btn ghost sm" href="' + esc(D.exportUrl(tbl, 'csv')) + '" download>⬇ CSV</a><a class="btn ghost sm" href="' + esc(D.exportUrl(tbl, 'json')) + '" download>⬇ JSON</a>' : '<button type="button" class="btn ghost sm" data-x="csv">⬇ CSV</button><button type="button" class="btn ghost sm" data-x="json">⬇ JSON</button>';
      tm.innerHTML = '<div class="row" style="margin-top:0"><b style="font-size:1.05rem">' + esc(tbl) + '</b><span class="muted" style="font-size:.8rem;flex:1;min-width:140px">' + esc(meta.descr || '') + '</span></div><div class="row"><input type="search" id="tq" placeholder="Chercher dans toutes les colonnes" value="' + esc(st.q) + '" aria-label="Rechercher dans la table" style="flex:1;min-width:160px">' + exp + '</div><p class="muted" style="font-size:.8rem;margin:0 0 6px">' + d.total + ' ligne(s)' + (d.rows.length && d.rows[0]._rowid != null ? ' · clique une ligne pour la voir en entier' : '') + '</p>' +
        grid(cols, d.rows, { sortable: true, sort: st.sort, dir: st.dir, clickable: true }) +
        '<div class="row"><button type="button" class="btn ghost sm" id="pp"' + (d.page <= 1 ? ' disabled' : '') + '>‹ Précédent</button><span class="muted">Page ' + d.page + ' / ' + d.pages + '</span><button type="button" class="btn ghost sm" id="pn"' + (d.page >= d.pages ? ' disabled' : '') + '>Suivant ›</button></div>';
      let tmr = 0; $('tq').oninput = (e) => { clearTimeout(tmr); tmr = setTimeout(() => { st.q = e.target.value; st.page = 1; drawRows().then(() => { const i = $('tq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); }, 300); };
      $('pp').onclick = () => { st.page = Math.max(1, d.page - 1); drawRows(); }; $('pn').onclick = () => { st.page = d.page + 1; drawRows(); };
      tm.querySelectorAll('[data-x]').forEach((b) => { b.onclick = () => toast(D.localExport(tbl, b.dataset.x) ? 'Fichier généré ✅' : 'Téléchargement bloqué par ce navigateur', 0); });
      tm.querySelector('thead').onclick = (e) => { const b = e.target.closest('[data-s]'); if (!b) return; st.dir = st.sort === b.dataset.s && st.dir === 'desc' ? 'asc' : 'desc'; st.sort = b.dataset.s; st.page = 1; drawRows(); };
      const open = async (tr) => {
        const rid = +tr.dataset.r, row = await D.row(tbl, rid); if (!row) return toast('Ligne introuvable', 1);
        const canDel = srv && SAVE_OK.has(tbl);
        const md = modal('<h3 style="margin:0 0 8px">' + esc(tbl) + ' · ligne ' + rid + '</h3><dl class="dl">' + Object.keys(row).map((k) => { let v = row[k]; if (typeof v === 'string' && /^[\[{]/.test(v)) { try { v = JSON.stringify(JSON.parse(v), null, 1); } catch (e) { /* texte */ } } const tt = TIMECOL.has(k) && typeof v === 'number' && v > 1e12 ? dt(v) + ' (' + v + ')' : v; return '<dt>' + esc(k) + '</dt><dd>' + (tt === null ? '<span class="muted">—</span>' : '<pre>' + esc(String(tt)) + '</pre>') + '</dd>'; }).join('') + '</dl><div class="row"><button type="button" class="btn ghost" data-close>Fermer</button>' + (canDel ? '<button type="button" class="btn danger" id="rd">Supprimer cette ligne</button>' : '') + (tbl === 'users' ? '<button type="button" class="btn" id="rf2">Ouvrir la fiche du joueur</button>' : '') + '</div>');
        const rd = md.el.querySelector('#rd'); if (rd) rd.onclick = async () => { md.close(); if (!(await ask('Supprimer définitivement cette ligne ?'))) return; if (await D.deleteRow(tbl, rid)) { toast('Ligne supprimée'); info = await D.info(); drawTables(); } else toast('Suppression refusée', 1); };
        const rf = md.el.querySelector('#rf2'); if (rf) rf.onclick = () => { md.close(); curFiche = row.id; sub = 'fiche'; draw(); };
      };
      tm.querySelector('tbody').onclick = (e) => { const tr = e.target.closest('tr[data-r]'); if (tr) open(tr); };
      tm.querySelector('tbody').onkeydown = (e) => { if (e.key === 'Enter') { const tr = e.target.closest('tr[data-r]'); if (tr) open(tr); } };
    }

    /* --- fiche joueur --- */
    async function drawFiche() {
      const users = (await A.users()).sort((a, b) => a.pseudo.localeCompare(b.pseudo));
      bv.innerHTML = '<div class="row"><select id="fu" aria-label="Choisir un joueur" style="min-width:240px"><option value="">Choisis un joueur…</option>' + users.map((u) => '<option value="' + esc(u.id) + '"' + (u.id === curFiche ? ' selected' : '') + '>' + esc(u.pseudo) + ' — ' + esc(u.email) + '</option>').join('') + '</select><span class="muted" style="font-size:.82rem">' + users.length + ' compte(s)</span></div><div id="fv"></div>';
      $('fu').onchange = (e) => { curFiche = e.target.value; showFiche(); }; showFiche();
      async function showFiche() {
        const fv = $('fv'); if (!curFiche) { fv.innerHTML = '<p class="muted">La fiche rassemble tout ce que la base sait d\'un joueur : compte, chiffres, matériel, badges, séances, connexions, messages.</p>'; return; }
        const f = await D.userFile(curFiche); if (!f) { fv.innerHTML = '<div class="warnbar">Joueur introuvable.</div>'; return; }
        const u = f.user, s = f.stats || {}, kv = (rows) => '<dl class="dl">' + rows.map((r) => '<dt>' + esc(r[0]) + '</dt><dd>' + (r[1] == null || r[1] === '' ? '<span class="muted">—</span>' : esc(String(r[1]))) + '</dd>').join('') + '</dl>';
        fv.innerHTML = '<div class="g2"><div class="panel f"><h3 style="margin:0 0 6px">Compte ' + (u.banned ? '<span class="chip bad">suspendu</span>' : '<span class="chip gold">actif</span>') + '</h3>' + kv([['Pseudo', u.pseudo], ['E-mail', u.email], ['Code de parrainage', u.code], ['Inscrit le', u.created], ['Dernière connexion', u.lastLogin ? dt(u.lastLogin) : null], ['Parrainé par', f.referredBy], ['Identifiant', u.id]]) + '</div>' +
          '<div class="panel f"><h3 style="margin:0 0 6px">Progression</h3>' + (f.stats ? kv([['Niveau', s.level], ['Maximum de pompes', s.maxPushups], ['XP', s.xp], ['Série / record', s.streak + ' / ' + s.best + ' jours'], ['Séances', s.total + ' (journal : ' + f.workoutCount + ')'], ['Flammes', s.flames + ' (total gagné : ' + s.flamesTotal + ')'], ['Série de connexion', s.loginStreak + ' jours'], ['Dernière séance', s.lastDone], ['Vu le', s.lastSeen]]) : '<p class="muted">Aucune progression enregistrée pour l\'instant.</p>') + '</div></div>' +
          '<div class="g2"><div class="panel f"><h3 style="margin:0 0 6px">Matériel et réglages</h3>' + (f.setup ? kv(Object.keys(f.setup).slice(0, 14).map((k) => [k, typeof f.setup[k] === 'object' ? JSON.stringify(f.setup[k]) : f.setup[k]])) : '<p class="muted">Pas encore configuré.</p>') + '</div>' +
          '<div class="panel f"><h3 style="margin:0 0 6px">Badges (' + f.badges.length + ') et amis parrainés (' + f.referrals.length + ')</h3><div class="chips">' + (f.badges.map((b) => '<span class="chip' + (b.source === 'admin' ? ' gold' : '') + '" title="' + esc((b.day || '') + (b.source === 'admin' ? ' · offert' : '')) + '">' + esc(b.id) + '</span>').join('') || '<span class="muted">Aucun badge.</span>') + '</div><div class="chips" style="margin-top:8px">' + (f.referrals.map((r) => '<span class="chip">' + esc(r.pseudo) + '</span>').join('') || '<span class="muted">Aucun ami parrainé.</span>') + '</div></div></div>' +
          '<h3>Séances (' + f.workoutCount + ')</h3>' + grid(['day', 'name', 'rarity', 'reps', 'sets', 'verified', 'doubled', 'xp', 'source'], f.workouts) +
          '<h3>Jours de connexion</h3><div class="chips">' + (f.loginDays.map((d) => '<span class="chip">' + esc(d.slice(5)) + '</span>').join('') || '<span class="muted">Aucun.</span>') + '</div>' +
          '<h3>Derniers messages</h3>' + (f.messages.length ? f.messages.map((m) => '<div class="itm"><span class="muted" style="font-size:.72rem">' + esc(m.room === 'global' ? 'public' : 'coach') + ' · ' + esc(dt(m.t)) + '</span><b style="font-weight:600">' + esc(m.text) + '</b></div>').join('') : '<p class="muted">Aucun message.</p>') +
          '<div class="row" style="margin-top:18px"><button type="button" class="btn ghost" id="fx">⬇ Exporter cette fiche (JSON)</button><button type="button" class="btn danger" id="fd">Supprimer ce joueur et toutes ses données</button></div><p class="muted" style="font-size:.78rem">La suppression efface le compte, la progression, les séances, les badges, les connexions et les messages du joueur. Elle est définitive.</p>';
        $('fx').onclick = () => toast(saveBlob(f, 'fiche-' + u.pseudo.replace(/[^\w-]/g, '_') + '.json') ? 'Fiche exportée ✅' : 'Téléchargement bloqué par ce navigateur', 0);
        $('fd').onclick = async () => { if (!(await ask('Supprimer définitivement ' + u.pseudo + ' et toutes ses données ?'))) return; if (await D.deleteUser(u.id)) { toast('Joueur supprimé'); curFiche = null; info = await D.info(); drawFiche(); } else toast('Suppression refusée', 1); };
      }
    }

    /* --- console SQL --- */
    function drawSql() {
      const EX = [['Joueurs les plus actifs', 'SELECT pseudo, serie, record_serie, seances, xp FROM v_joueurs ORDER BY xp DESC LIMIT 20'], ['Séances par jour', 'SELECT day, COUNT(*) AS seances, SUM(verified) AS validees FROM workouts GROUP BY day ORDER BY day DESC LIMIT 14'], ['Exercices les plus tirés', 'SELECT name, COUNT(*) AS n FROM workouts GROUP BY name ORDER BY n DESC LIMIT 10'], ['Inscriptions par jour', 'SELECT created, COUNT(*) AS n FROM users GROUP BY created ORDER BY created DESC LIMIT 14'], ['Âges des joueurs', 'SELECT age, COUNT(*) AS n FROM users GROUP BY age ORDER BY age'], ['Inactifs depuis 7 jours', "SELECT pseudo, email, vu_le FROM v_joueurs WHERE vu_le IS NULL OR vu_le < date('now','-7 day') ORDER BY vu_le"]];
      bv.innerHTML = (srv ? '' : '<div class="warnbar">La console SQL n\'est disponible qu\'avec le serveur (vraie base SQLite). En mode démo, utilise l\'onglet Tables.</div>') +
        '<div class="split"><div><label class="lb" for="sq">Requête (lecture seule : SELECT)</label><textarea id="sq" class="sqlbox" spellcheck="false" placeholder="SELECT * FROM users LIMIT 10"' + (srv ? '' : ' disabled') + '>' + esc(EX[0][1]) + '</textarea><div class="row"><button type="button" class="btn" id="sr"' + (srv ? '' : ' disabled') + '>Exécuter (Ctrl+Entrée)</button><span class="muted" id="ss"></span></div><div class="chips">' + EX.map((x, i) => '<button type="button" class="chip btnchip" data-e="' + i + '">' + esc(x[0]) + '</button>').join('') + '</div></div>' +
        '<div class="panel f schema"><h3 style="margin:0 0 6px">Tables et colonnes</h3>' + info.tables.map((t) => '<details><summary><b>' + esc(t.name) + '</b> <span class="muted">' + t.rows + '</span></summary><small>' + esc(t.columns.map((c) => c.name).join(', ')) + '</small></details>').join('') + '</div></div><div id="sres"></div>';
      const run = async () => {
        const r = $('sres'); r.innerHTML = '<p class="muted">Exécution…</p>'; const d = await D.query($('sq').value);
        if (d.error) { r.innerHTML = '<div class="warnbar">' + esc(d.error) + '</div>'; $('ss').textContent = ''; return; }
        $('ss').textContent = d.rows.length + ' ligne(s) en ' + d.ms + ' ms' + (d.truncated ? ' (limité à 500)' : '');
        r.innerHTML = d.columns.length ? grid(d.columns, d.rows) : '<p class="muted">Aucun résultat.</p>';
      };
      $('sr').onclick = run; $('sq').onkeydown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); } };
      bv.querySelectorAll('[data-e]').forEach((b) => { b.onclick = () => { $('sq').value = EX[+b.dataset.e][1]; if (srv) run(); }; });
    }

    /* --- export & sauvegardes --- */
    async function drawExport() {
      const tbls = info.tables;
      bv.innerHTML = '<div class="g2"><div class="panel f"><h3 style="margin:0 0 6px">Tout exporter</h3><p class="muted" style="margin-top:0">Un seul fichier JSON avec toutes les tables (comptes, progression, séances, badges, chat, journal). Les mots de passe n\'y sont jamais.</p>' + (srv ? '<a class="btn" href="' + esc(D.exportUrl('all', 'json')) + '" download>⬇ Exporter toute la base (JSON)</a>' : '<button type="button" class="btn" id="xa">⬇ Exporter la base du navigateur (JSON)</button>') + '</div>' +
        '<div class="panel f"><h3 style="margin:0 0 6px">Sauvegarde</h3>' + (srv ? '<p class="muted" style="margin-top:0">Une copie complète de la base (fichier SQLite <code>.db</code>) est créée automatiquement chaque jour ; les 7 dernières sont gardées dans <code>server/data/backups/</code>.</p><div class="row" style="margin-top:0"><a class="btn" href="' + esc(D.backupUrl()) + '" download>⬇ Télécharger une sauvegarde (.db)</a><button type="button" class="btn ghost" id="bn">Créer une sauvegarde maintenant</button></div><div id="bl">' + (info.info.backups.length ? info.info.backups.map((b) => '<div class="itm"><b>' + esc(b.name) + '</b><span class="muted">' + bytesFmt(b.size) + '</span></div>').join('') : '<p class="muted">Aucune sauvegarde automatique pour l\'instant.</p>') + '</div>' : '<p class="muted" style="margin-top:0">Les sauvegardes automatiques existent en mode serveur. En démo, exporte la base en JSON.</p>') + '</div></div>' +
        '<h3>Exporter une table</h3><div class="tw"><table class="t"><thead><tr><th>Table</th><th>Lignes</th><th>Contenu</th><th></th></tr></thead><tbody>' + tbls.map((t) => '<tr><td><b>' + esc(t.name) + '</b></td><td>' + t.rows + '</td><td class="wrap">' + esc(t.descr) + '</td><td>' + (srv ? '<a class="btn ghost sm" href="' + esc(D.exportUrl(t.name, 'csv')) + '" download>CSV</a> <a class="btn ghost sm" href="' + esc(D.exportUrl(t.name, 'json')) + '" download>JSON</a>' : '<button type="button" class="btn ghost sm" data-x="csv" data-n="' + esc(t.name) + '">CSV</button> <button type="button" class="btn ghost sm" data-x="json" data-n="' + esc(t.name) + '">JSON</button>') + '</td></tr>').join('') + '</tbody></table></div>' +
        '<div class="g2" style="margin-top:14px"><div class="panel f"><h3 style="margin:0 0 6px">Santé de la base</h3><button type="button" class="btn ghost" id="ck">Vérifier l\'intégrité</button> <span id="cr" class="muted"></span></div><div class="panel f"><h3 style="margin:0 0 6px">Bon à savoir</h3><ul class="muted" style="margin:0;padding-left:18px;font-size:.84rem;line-height:1.5"><li>Fichiers : <code>nev.db</code> (données) et <code>auth.db</code> (mots de passe, sessions) dans <code>server/data/</code>.</li><li>Restaurer : arrête le serveur, remplace <code>nev.db</code> par une sauvegarde, relance.</li><li>Ces fichiers contiennent des données personnelles (e-mails, âges) : protège-les et ne les envoie à personne.</li></ul></div></div>';
      if (!srv) { const xa = $('xa'); if (xa) xa.onclick = () => toast(D.localExport('all', 'json') ? 'Fichier généré ✅' : 'Téléchargement bloqué par ce navigateur', 0); bv.querySelectorAll('[data-n]').forEach((b) => { b.onclick = () => toast(D.localExport(b.dataset.n, b.dataset.x) ? 'Fichier généré ✅' : 'Téléchargement bloqué par ce navigateur', 0); }); }
      const bn = $('bn'); if (bn) bn.onclick = async () => { const i = await D.backupNow(); if (i) { info.info = i; toast('Sauvegarde créée ✅'); drawExport(); } else toast('Sauvegarde refusée', 1); };
      $('ck').onclick = async () => { $('cr').textContent = 'Vérification…'; const r = await D.check(); $('cr').innerHTML = r ? (r.integrity === 'ok' && !r.foreignKeys ? '<span class="ok-t">✅ Base saine (intégrité ok, liens entre tables ok)</span>' : '<span class="bad-t">⚠️ ' + esc(r.integrity) + ' / ' + r.foreignKeys + ' lien(s) cassé(s)</span>') : '<span class="bad-t">Indisponible</span>'; };
    }
    async function draw() { mark(); bv.innerHTML = '<p class="muted">Chargement…</p>'; try { if (sub === 'tables') await drawTables(); else if (sub === 'fiche') await drawFiche(); else if (sub === 'sql') drawSql(); else await drawExport(); } catch (e) { bv.innerHTML = '<div class="warnbar">' + esc(e.message || e) + '</div>'; } }
    await draw();
  };

  /* ---------- joueurs ---------- */
  VIEWS.joueurs = async function () {
    let users = await A.users(), q = '';
    const defs = R.defs();
    function table() {
      const k = q.toLowerCase();
      const L = users.filter((u) => !k || (u.pseudo + ' ' + u.email + ' ' + u.code).toLowerCase().indexOf(k) >= 0).sort((a, b) => (b.xp || 0) - (a.xp || 0));
      $('tb').innerHTML = L.map((u) => '<tr class="' + (u.banned ? 'ban' : '') + '"><td><b>' + esc(u.pseudo) + '</b>' + (u.admin ? ' <span class="pill" title="Joueur nommé admin">admin</span>' : '') + '<br><small class="muted">' + esc(u.code) + '</small></td><td>' + esc(u.email) + '</td><td>' + (u.level || '—') + '</td><td>' + u.streak + ' / ' + u.best + '</td><td>' + u.total + '</td><td>' + u.xp + '</td><td>' + u.flames + '</td><td>' + u.badges.length + '</td><td>' + u.refCount + '</td><td>' + esc(u.lastSeen ? fd(u.lastSeen) : '—') + '</td><td><select data-g="' + esc(u.id) + '" aria-label="Offrir un badge à ' + esc(u.pseudo) + '"><option value="">Offrir un badge…</option>' + defs.filter((d) => u.badges.indexOf(d.id) < 0).map((d) => '<option value="' + esc(d.id) + '">' + esc(d.name) + '</option>').join('') + '</select> <button type="button" class="btn sm" data-gf="' + esc(u.id) + '">🎁 Cadeau / rôle</button> <button type="button" class="btn ghost sm" data-f="' + esc(u.id) + '">Fiche</button> <button type="button" class="btn ' + (u.banned ? 'ok' : 'ghost') + ' sm" data-b="' + esc(u.id) + '">' + (u.banned ? 'Réactiver' : 'Suspendre') + '</button></td></tr>').join('') || '<tr><td colspan="12" class="muted">Aucun joueur.</td></tr>';
      $('cnt').textContent = L.length + ' / ' + users.length + ' joueurs';
    }
    $('main').innerHTML = '<h1>Joueurs</h1><p class="lead">Progression, parrainages, badges offerts et suspension de comptes.</p><div class="row"><input type="search" id="jq" placeholder="Pseudo, email ou code" aria-label="Rechercher"><span class="muted" id="cnt"></span></div><div class="tw"><table class="t"><thead><tr><th>Joueur</th><th>Email</th><th>Niv.</th><th>Série / record</th><th>Séances</th><th>XP</th><th>Flammes</th><th>Badges</th><th>Amis</th><th>Vu le</th><th>Actions</th></tr></thead><tbody id="tb"></tbody></table></div>';
    $('jq').oninput = (e) => { q = e.target.value; table(); };
    $('tb').onchange = async (e) => { const s = e.target.closest('[data-g]'); if (s && s.value) { await A.badges.grant(s.dataset.g, s.value); toast('Badge offert 🏅'); users = await A.users(); table(); } };
    $('tb').onclick = async (e) => {
      const gb = e.target.closest('[data-gf]');
      if (gb) {
        const u = users.find((x) => x.id === gb.dataset.gf); if (!u) return;
        const md = modal('<h3 style="margin:0 0 4px">🎁 ' + esc(u.pseudo) + '</h3><p class="muted" style="margin:0 0 10px">Flammes : <b>' + u.flames + '</b> · Tirages bonus en réserve : <b>' + (u.bonusDraws || 0) + '</b></p>' +
          '<div class="row"><div><label class="lb" for="gfl">Flammes à donner</label><input type="number" id="gfl" min="0" max="10000" value="0" style="width:130px"></div><div><label class="lb" for="gdr">Tirages de gacha bonus</label><input type="number" id="gdr" min="0" max="50" value="0" style="width:130px"></div></div>' +
          '<label class="lb" for="gnt">Message au joueur (facultatif)</label><input type="text" id="gnt" maxlength="80" placeholder="Bravo pour ta régularité !" style="width:100%">' +
          '<div class="row" style="margin-top:12px"><button type="button" class="btn" id="gok">Offrir</button><button type="button" class="btn ghost" data-close>Fermer</button></div><p class="muted" id="gms" role="status" style="margin:8px 0 0"></p>' +
          '<hr style="border:0;border-top:1px solid #ffffff1f;margin:14px 0"><h3 style="margin:0 0 4px">Rôle</h3><p class="muted" style="margin:0 0 8px">' + (u.admin ? 'Ce joueur est <b>admin</b> : il accède à cet espace depuis son compte.' : 'Un joueur nommé admin accède à tout cet espace depuis son compte (joueurs, chat, base de données). À réserver à une personne de confiance.') + '</p>' +
          '<button type="button" class="btn ' + (u.admin ? 'danger' : 'ghost') + '" id="grl">' + (u.admin ? 'Retirer le rôle admin' : 'Nommer admin') + '</button>');
        const msg = (t, bad) => { const el = md.el.querySelector('#gms'); el.textContent = t; el.style.color = bad ? '#ff8a9b' : '#7be3a4'; };
        md.el.querySelector('#gok').onclick = async () => {
          const f = +md.el.querySelector('#gfl').value || 0, d = +md.el.querySelector('#gdr').value || 0;
          if (!(await ask('Offrir ' + f + ' flamme(s) et ' + d + ' tirage(s) à ' + u.pseudo + ' ?'))) return;
          const r = await A.gift(u.id, f, d, md.el.querySelector('#gnt').value); if (!r.ok) return msg(r.error, 1);
          toast('Cadeau envoyé 🎁'); md.close(); users = await A.users(); table();
        };
        md.el.querySelector('#grl').onclick = async () => {
          if (!(await ask((u.admin ? 'Retirer le rôle admin à ' : 'Nommer admin ') + u.pseudo + ' ?'))) return;
          const r = await A.role(u.id, !u.admin); if (!r.ok) return msg(r.error, 1);
          toast(u.admin ? 'Rôle admin retiré' : u.pseudo + ' est maintenant admin 🛡️'); md.close(); users = await A.users(); table();
        };
        return;
      }
      const fb = e.target.closest('[data-f]'); if (fb) { jumpUser = fb.dataset.f; show('base'); return; } const b = e.target.closest('[data-b]'); if (!b) return; const u = users.find((x) => x.id === b.dataset.b); if (!u) return; if (!u.banned && !(await ask('Suspendre ' + u.pseudo + ' ?'))) return; await A.ban(u.id, !u.banned); toast(u.banned ? 'Compte réactivé' : 'Compte suspendu'); users = await A.users(); table(); };
    table();
  };

  /* ---------- combos ---------- */
  VIEWS.combos = async function () {
    let list = await A.combos.list(), cur = { name: '', blurb: '', lvl: 'Moyen', published: true, items: [] };
    const LV = ['Débutant', 'Facile', 'Moyen', 'Costaud', 'Difficile', 'Extrême'];
    function form() {
      $('ed').innerHTML = '<h3 style="margin:0 0 6px">' + (cur.id ? 'Modifier le combo' : 'Nouveau combo') + '</h3><label class="lb" for="cn">Nom</label><input type="text" id="cn" maxlength="60" value="' + esc(cur.name) + '" style="width:100%"><label class="lb" for="cb">Description</label><input type="text" id="cb" maxlength="200" value="' + esc(cur.blurb) + '" style="width:100%"><div class="row"><div><label class="lb" for="cl">Niveau</label><select id="cl">' + LV.map((l) => '<option' + (l === cur.lvl ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div><label class="check" style="margin-top:24px"><input type="checkbox" id="cp"' + (cur.published ? ' checked' : '') + '><span>Publié sur le site</span></label></div>' +
        '<h3 style="margin:14px 0 4px">Exercices (' + cur.items.length + '/12)</h3><div id="its">' + (cur.items.map((it, i) => '<div class="itm"><b>' + esc(exName(it[0])) + '</b><label class="muted" style="font-size:.74rem">séries <input type="number" min="1" max="6" value="' + it[1] + '" data-s="' + i + '"></label><button type="button" class="btn ghost sm" data-u="' + i + '" aria-label="Monter">↑</button><button type="button" class="btn ghost sm" data-d="' + i + '" aria-label="Descendre">↓</button><button type="button" class="btn ghost sm" data-x="' + i + '" aria-label="Retirer">✕</button></div>').join('') || '<p class="muted">Ajoute des exercices depuis la liste.</p>') + '</div>' +
        '<div class="row"><button type="button" class="btn" id="cs">Enregistrer</button><button type="button" class="btn ghost" id="cr">Nouveau</button></div>';
    }
    function pick(qv) {
      const k = (qv || '').toLowerCase();
      $('pk').innerHTML = NEV.Ex.list().filter((e) => !k || e.name.toLowerCase().indexOf(k) >= 0 || e.group.indexOf(k) >= 0).map((e) => '<button type="button" data-a="' + esc(e.id) + '"><span>' + esc(e.name) + '</span><small>' + esc((NEV.CATS.find((c) => c.id === e.group) || {}).short || '') + ' · ' + esc(NEV.Ex.TIER_NAMES[e.tier]) + '</small></button>').join('');
    }
    function listing() {
      $('lst').innerHTML = list.length ? list.map((c) => '<div class="itm"><b>' + esc(c.name) + ' <span class="chip ' + (c.published ? 'gold' : '') + '">' + (c.published ? 'Publié' : 'Brouillon') + '</span></b><span class="muted" style="font-size:.78rem">' + c.items.length + ' ex.</span><button type="button" class="btn ghost sm" data-e="' + esc(c.id) + '">Modifier</button><button type="button" class="btn ghost sm" data-del="' + esc(c.id) + '">Supprimer</button></div>').join('') : '<p class="muted">Aucun combo du coach pour l\'instant.</p>';
    }
    $('main').innerHTML = '<h1>Combos du coach</h1><p class="lead">Compose des enchaînements d\'exercices : les joueurs les retrouvent dans la Quête et dans la Spécialisation.</p><div class="split"><div class="panel f" id="ed"></div><div class="panel f"><h3 style="margin:0 0 6px">Bibliothèque d\'exercices</h3><input type="search" id="pq" placeholder="Chercher un exercice" style="width:100%"><div class="pick" id="pk"></div></div></div><h2>Combos existants</h2><div id="lst"></div>';
    form(); pick(''); listing();
    $('pq').oninput = (e) => pick(e.target.value);
    const sync = () => { cur.name = $('cn').value; cur.blurb = $('cb').value; cur.lvl = $('cl').value; cur.published = $('cp').checked; };
    $('pk').onclick = (e) => { const b = e.target.closest('[data-a]'); if (!b) return; sync(); if (cur.items.length >= 12) return toast('12 exercices maximum', 1); cur.items.push([b.dataset.a, 3]); form(); };
    $('ed').onclick = async (e) => {
      const t = e.target.closest('button'); if (!t) return; sync();
      const g = (a) => (t.dataset[a] != null ? +t.dataset[a] : null), I = cur.items;
      if (g('x') != null) { I.splice(g('x'), 1); form(); } else if (g('u') != null && g('u') > 0) { const i = g('u'); [I[i - 1], I[i]] = [I[i], I[i - 1]]; form(); } else if (g('d') != null && g('d') < I.length - 1) { const i = g('d'); [I[i + 1], I[i]] = [I[i], I[i + 1]]; form(); }
      else if (t.id === 'cr') { cur = { name: '', blurb: '', lvl: 'Moyen', published: true, items: [] }; form(); }
      else if (t.id === 'cs') {
        if (!cur.name.trim() || !I.length) return toast('Donne un nom et ajoute au moins un exercice', 1);
        const r = await A.combos.save(cur); if (!r) return toast('Enregistrement refusé', 1);
        cur = r; list = await A.combos.list(); listing(); form(); toast('Combo enregistré ✅');
      }
    };
    $('ed').oninput = (e) => { const s = e.target.closest('[data-s]'); if (s) cur.items[+s.dataset.s][1] = Math.max(1, Math.min(6, Math.round(+s.value) || 1)); };
    $('lst').onclick = async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.e) { cur = JSON.parse(JSON.stringify(list.find((c) => c.id === b.dataset.e))); form(); scrollTo({ top: 0, behavior: 'smooth' }); }
      if (b.dataset.del && (await ask('Supprimer ce combo ?'))) { await A.combos.remove(b.dataset.del); list = await A.combos.list(); listing(); toast('Combo supprimé'); }
    };
  };

  /* ---------- badges ---------- */
  VIEWS.badges = async function () {
    let list = await A.badges.list(), users = await A.users();
    const SH = ['circle', 'shield', 'hex', 'star', 'flame', 'diamond'], IC = ['', ...Object.keys(R.ICONS)];
    const cur = { name: 'Mon badge', desc: 'Décris comment l\'obtenir.', shape: 'shield', icon: 'star', text: '', c1: '#ffd45e', c2: '#a8690f', rule: { t: 'total', v: 5 } };
    $('main').innerHTML = '<h1>Badges</h1><p class="lead">Crée tes propres badges. Ils s\'ajoutent au mur des joueurs et se débloquent automatiquement selon la règle choisie (ou à la main).</p><div class="split"><div class="panel f"><label class="lb" for="bn">Nom</label><input type="text" id="bn" maxlength="30" value="' + esc(cur.name) + '" style="width:100%"><label class="lb" for="bd">Description</label><input type="text" id="bd" maxlength="120" value="' + esc(cur.desc) + '" style="width:100%"><div class="row"><div><label class="lb" for="bs">Forme</label><select id="bs">' + SH.map((x) => '<option' + (x === cur.shape ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div><div><label class="lb" for="bi">Icône</label><select id="bi">' + IC.map((x) => '<option value="' + x + '"' + (x === cur.icon ? ' selected' : '') + '>' + (x || '(aucune)') + '</option>').join('') + '</select></div><div><label class="lb" for="bt">Texte (3 max)</label><input type="text" id="bt" maxlength="3" style="width:80px"></div></div><div class="row"><div><label class="lb" for="b1">Couleur 1</label><input type="color" id="b1" value="' + cur.c1 + '"></div><div><label class="lb" for="b2">Couleur 2</label><input type="color" id="b2" value="' + cur.c2 + '"></div></div><div class="row"><div><label class="lb" for="br">Règle</label><select id="br">' + Object.keys(R.RULES).map((k) => '<option value="' + k + '"' + (k === cur.rule.t ? ' selected' : '') + '>' + esc(R.RULES[k].label) + '</option>').join('') + '</select></div><div><label class="lb" for="bv">Valeur</label><input type="number" id="bv" min="0" value="5" style="width:100px"></div></div><div class="row"><button type="button" class="btn" id="bsave">Créer le badge</button></div></div><div class="panel f"><h3 style="margin:0 0 10px">Aperçu</h3><div class="badgep" id="bp"></div></div></div><h2>Badges personnalisés</h2><div class="tw"><table class="t"><thead><tr><th>Badge</th><th>Règle</th><th>Offrir à</th><th></th></tr></thead><tbody id="bl"></tbody></table></div><p class="muted" style="font-size:.82rem">Les ' + R.DEFAULT_BADGES.length + ' badges de base (séries, séances, parrainages, raretés…) existent déjà et ne se suppriment pas.</p>';
    const read = () => ({ name: $('bn').value.trim(), desc: $('bd').value.trim(), shape: $('bs').value, icon: $('bi').value, text: $('bt').value.trim().slice(0, 3), c1: $('b1').value, c2: $('b2').value, rule: { t: $('br').value, v: Math.max(0, Number($('bv').value) || 0) } });
    const prev = () => { const b = read(); $('bp').innerHTML = R.badgeSVG(b, 110) + '<div><b>' + esc(b.name || '…') + '</b><br><span class="muted">' + esc(b.desc) + '</span><br><span class="chip" style="margin-top:6px">' + esc(R.RULES[b.rule.t].label) + (b.rule.t === 'manual' ? '' : ' ≥ ' + b.rule.v) + '</span></div>'; };
    const rows = () => { $('bl').innerHTML = list.length ? list.map((b) => '<tr><td><span style="display:inline-flex;gap:8px;align-items:center">' + R.badgeSVG(b, 34) + esc(b.name) + '</span></td><td>' + esc(R.RULES[b.rule.t] ? R.RULES[b.rule.t].label : b.rule.t) + ' ≥ ' + b.rule.v + '</td><td><select data-g="' + esc(b.id) + '" aria-label="Offrir ' + esc(b.name) + '"><option value="">Joueur…</option>' + users.map((u) => '<option value="' + esc(u.id) + '">' + esc(u.pseudo) + '</option>').join('') + '</select></td><td><button type="button" class="btn ghost sm" data-del="' + esc(b.id) + '">Supprimer</button></td></tr>').join('') : '<tr><td colspan="4" class="muted">Aucun badge personnalisé.</td></tr>'; };
    document.querySelectorAll('#main input,#main select').forEach((el) => el.addEventListener('input', prev));
    $('bsave').onclick = async () => { const b = read(); if (!b.name) return toast('Donne un nom au badge', 1); const r = await A.badges.save(b); if (!r) return toast('Enregistrement refusé', 1); list = await A.badges.list(); rows(); toast('Badge créé 🏅'); };
    $('bl').onclick = async (e) => { const b = e.target.closest('[data-del]'); if (b && (await ask('Supprimer ce badge ?'))) { await A.badges.remove(b.dataset.del); list = await A.badges.list(); rows(); toast('Badge supprimé'); } };
    $('bl').onchange = async (e) => { const s = e.target.closest('[data-g]'); if (s && s.value) { await A.badges.grant(s.value, s.dataset.g); toast('Badge offert 🏅'); s.value = ''; } };
    prev(); rows();
  };

  /* ---------- annonce ---------- */
  VIEWS.annonce = async function () {
    const cfg = await C.config(); const a = cfg.announce;
    $('main').innerHTML = '<h1>Annonce</h1><p class="lead">Un bandeau visible en haut du site pour tous les joueurs connectés.</p><div class="panel f"><label class="lb" for="at">Message (280 caractères max)</label><textarea id="at" maxlength="280">' + esc(a ? a.text : '') + '</textarea><div class="row"><button type="button" class="btn" id="ap">Publier</button><button type="button" class="btn ghost" id="ac">Retirer l\'annonce</button></div><p class="muted" style="font-size:.82rem">' + (a ? 'Annonce publiée le ' + dt(a.t) + '.' : 'Aucune annonce en cours.') + '</p></div>';
    $('ap').onclick = async () => { await A.announce($('at').value); toast('Annonce publiée 📣'); show('annonce'); };
    $('ac').onclick = async () => { await A.announce(''); toast('Annonce retirée'); show('annonce'); };
  };

  /* ---------- chat ---------- */
  VIEWS.chat = async function () {
    let room = 'global', threads = [];
    async function draw(keepInput) {
      threads = await A.chat.threads(); const msgs = await A.chat.open(room);
      const txt = keepInput && $('ct') ? $('ct').value : '';
      $('main').innerHTML = '<h1>Chat</h1><p class="lead">Réponds aux joueurs en privé ou modère le salon public.</p><div class="thr"><div class="thl"><button type="button" data-r="global" class="' + (room === 'global' ? 'on' : '') + '"><b>🌍 Salon public</b><small>Tous les joueurs</small></button>' + threads.map((t) => '<button type="button" data-r="coach:' + esc(t.uid) + '" class="' + (room === 'coach:' + t.uid ? 'on' : '') + '"><b>' + (t.fromPlayer ? '<span class="nw">● </span>' : '') + esc(t.name || 'Joueur') + '</b><small>' + esc(t.last) + '</small></button>').join('') + '</div><div class="cv"><div class="ms" id="ms">' + (msgs.length ? msgs.map((m) => '<div class="mm' + (m.role === 'admin' ? ' a' : '') + '"><small>' + esc(m.name) + ' · ' + dt(m.t) + '<button type="button" data-d="' + esc(m.id) + '" aria-label="Supprimer ce message">supprimer</button></small>' + esc(m.text) + '</div>').join('') : '<p class="muted">Aucun message.</p>') + '</div><form class="row" id="cf" autocomplete="off"><input type="text" id="ct" maxlength="280" placeholder="Répondre en tant que Coach neV…" style="flex:1;min-width:0"><button class="btn" type="submit">Envoyer</button></form></div></div>';
      $('ct').value = txt; const ms = $('ms'); ms.scrollTop = ms.scrollHeight;
      $('cf').onsubmit = async (e) => { e.preventDefault(); const v = $('ct').value.trim(); if (!v) return; if (!(await A.chat.send(room, v))) return toast('Message refusé', 1); $('ct').value = ''; draw(); };
    }
    $('main').onclick = async (e) => { const r = e.target.closest('[data-r]'); if (r) { room = r.dataset.r; draw(); return; } const d = e.target.closest('[data-d]'); if (d && (await ask('Supprimer ce message ?'))) { await A.chat.remove(room, d.dataset.d); draw(); } };
    await draw(); timer = setInterval(() => { if (tab === 'chat' && !document.hidden && document.activeElement !== $('ct')) draw(true); }, 8000);
  };

  /* ---------- sections « confiance et sécurité » (serveur requis) ---------- */
  const needServer = () => '<div class="warnbar">Cette section a besoin du serveur Node.js (mode démo : non disponible). Lance <code>node server/server.js</code>, voir le README.</div>';
  const srv = async (path, body) => { const r = await C.api('admin/' + path, body === undefined ? 'GET' : 'POST', body); if (!r.ok) throw new Error((r.data && r.data.error) || 'Erreur'); return r.data; };

  VIEWS.modo = async function () {
    if (C.mode !== 'server') { $('main').innerHTML = '<h1>Modération</h1>' + needServer(); return; }
    async function draw() {
      const d = await srv('moderation');
      const rows = d.reports.map((r) => '<tr><td><b>' + esc(r.authorName) + '</b><br><small class="muted">' + dt(r.t) + '</small></td><td style="max-width:360px;overflow-wrap:anywhere">' + esc(r.text) + '</td><td>' + r.reporters + ' signalement' + (r.reporters > 1 ? 's' : '') + (r.hidden ? '<br><span class="chip bad">masqué</span>' : '') + (r.muted ? '<br><span class="chip">en sourdine</span>' : '') + '</td><td><div class="row" style="margin:0;gap:6px"><button type="button" class="btn sm ghost" data-a="' + (r.hidden ? 'show' : 'hide') + '" data-m="' + esc(r.msgId) + '">' + (r.hidden ? 'Réafficher' : 'Masquer') + '</button><button type="button" class="btn sm danger" data-a="delete" data-m="' + esc(r.msgId) + '">Supprimer</button><button type="button" class="btn sm ghost" data-a="mute" data-h="24" data-m="' + esc(r.msgId) + '">Sourdine 24 h</button><button type="button" class="btn sm ghost" data-a="mute" data-h="168" data-m="' + esc(r.msgId) + '">7 jours</button><button type="button" class="btn sm ghost" data-a="dismiss" data-m="' + esc(r.msgId) + '">Ignorer</button></div></td></tr>').join('');
      $('main').innerHTML = '<h1>Modération du chat</h1><p class="lead">Les messages signalés par les joueurs. À 3 signalements différents, un message est masqué automatiquement en attendant ta décision. Le filtre bloque déjà liens, e-mails, numéros, insultes et contacts externes.</p>' +
        (d.reports.length ? '<div class="tw"><table class="t"><thead><tr><th>Auteur</th><th>Message</th><th>État</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="panel f"><b>✅ Aucun signalement en attente.</b></div>');
    }
    $('main').onclick = async (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'delete' && !(await ask('Supprimer définitivement ce message ?'))) return;
      try { await srv('moderation/act', { msgId: b.dataset.m, action: b.dataset.a, hours: Number(b.dataset.h) || 0 }); toast('Fait ✓'); draw(); } catch (er) { toast(er.message, 1); }
    };
    await draw();
  };

  VIEWS.triche = async function () {
    if (C.mode !== 'server') { $('main').innerHTML = '<h1>Anti-triche</h1>' + needServer(); return; }
    const d = await srv('cheat'), cap = d.caps;
    $('main').innerHTML = '<h1>Anti-triche</h1><p class="lead">Le navigateur calcule la progression ; le serveur la vérifie à chaque sauvegarde et corrige ce qui est impossible. Chaque correction est notée ici.</p>' +
      kpi([['Plafond XP / jour', cap.XP_DAY], ['Séances / jour', cap.SESSIONS_DAY], ['Flammes / jour', cap.FLAMES_DAY], ['Corrections notées', d.total]]) +
      '<h3>Joueurs retirés des classements (score ≥ 10 sur 14 jours)</h3>' + (d.excluded.length ? '<p>' + d.excluded.map((u) => '<span class="chip bad">' + esc(u.pseudo) + '</span>').join(' ') + '</p>' : '<p class="muted">Aucun.</p>') +
      '<h3>Dernières corrections</h3>' + (d.flags.length ? '<div class="tw"><table class="t"><thead><tr><th>Quand</th><th>Joueur</th><th>Type</th><th>Détail</th><th>Gravité</th></tr></thead><tbody>' + d.flags.map((f) => '<tr><td>' + dt(f.t) + '</td><td>' + esc(f.pseudo || f.uid) + '</td><td>' + esc(f.kind) + '</td><td>' + esc(f.detail) + '</td><td>' + f.severity + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">Rien à signaler pour le moment.</p>');
  };

  VIEWS.courriels = async function () {
    if (C.mode !== 'server') { $('main').innerHTML = '<h1>Courriels</h1>' + needServer(); return; }
    async function draw() {
      const d = await srv('mails');
      $('main').innerHTML = '<h1>Courriels</h1><p class="lead">Vérifications d\'adresse et mots de passe oubliés. ' + (d.smtp ? '<b>Envoi SMTP actif.</b>' + (d.baseUrl ? '' : ' ⚠️ Définis <code>NEV_BASE_URL</code> pour que les liens soient envoyés.') : '<b>Envoi SMTP non réglé</b> : les messages restent ici avec leur lien, à transmettre toi-même au joueur (variables <code>NEV_SMTP_*</code> dans le README).') + '</p>' +
        (d.mails.length ? '<div class="tw"><table class="t"><thead><tr><th>Date</th><th>Type</th><th>Pour</th><th>État</th><th>Lien</th></tr></thead><tbody>' + d.mails.map((m) => '<tr><td>' + dt(m.t) + '</td><td>' + esc(m.kind === 'reset' ? 'Mot de passe' : 'Vérification') + '</td><td>' + esc(m.to) + '</td><td><span class="chip ' + (m.status === 'sent' ? 'gold' : m.status === 'error' ? 'bad' : '') + '">' + esc(m.status === 'sent' ? 'envoyé' : m.status === 'error' ? 'erreur' : 'en attente') + '</span>' + (m.error ? '<br><small class="muted">' + esc(m.error) + '</small>' : '') + '</td><td style="max-width:300px;overflow-wrap:anywhere">' + (m.link ? '<small>' + esc(m.link) + '</small>' : '') + (m.status !== 'sent' && d.smtp ? '<br><button type="button" class="btn sm ghost" data-s="' + m.id + '">Envoyer</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>' : '<div class="panel f">Aucun courriel pour le moment.</div>');
    }
    $('main').onclick = async (e) => { const b = e.target.closest('[data-s]'); if (!b) return; try { await srv('mails/send', { id: Number(b.dataset.s) }); toast('Envoyé ✓'); } catch (er) { toast(er.message, 1); } draw(); };
    await draw();
  };

  VIEWS.relecture = async function () {
    if (C.mode !== 'server') { $('main').innerHTML = '<h1>Relecture des exercices</h1>' + needServer(); return; }
    const d = await srv('reviews'), rv = {}; d.reviews.forEach((r) => { rv[r.id] = r; });
    const all = NEV.Ex.list(); let f = '', q = '';
    const ST = { ok: '✅ Validé', adjust: '⚠️ À ajuster', no: '⛔ À retirer' };
    function draw() {
      const n = { ok: 0, adjust: 0, no: 0 }; all.forEach((e) => { if (rv[e.id]) n[rv[e.id].status]++; });
      const list = all.filter((e) => (!q || (e.name + ' ' + e.id).toLowerCase().indexOf(q) >= 0) && (!f || (f === 'none' ? !rv[e.id] : rv[e.id] && rv[e.id].status === f)));
      $('rvl').innerHTML = list.map((e) => { const r = rv[e.id] || {}; return '<tr><td><b>' + esc(e.name) + '</b><br><small class="muted">' + esc(e.group || '') + ' · ' + esc(e.tierName || '') + (e.warn ? ' · ⚠️ ' + esc(e.warn) : '') + '</small></td><td><select data-id="' + esc(e.id) + '" aria-label="Statut de ' + esc(e.name) + '"><option value="">— pas relu</option>' + Object.keys(ST).map((k) => '<option value="' + k + '"' + (r.status === k ? ' selected' : '') + '>' + ST[k] + '</option>').join('') + '</select></td><td><input data-n="' + esc(e.id) + '" maxlength="300" value="' + esc(r.note || '') + '" placeholder="Remarque (facultatif)" aria-label="Remarque pour ' + esc(e.name) + '"></td></tr>'; }).join('') || '<tr><td colspan="3" class="muted">Aucun exercice.</td></tr>';
      $('rvk').innerHTML = kpi([['Exercices', all.length], ['Validés', n.ok], ['À ajuster', n.adjust], ['À retirer', n.no], ['Pas relus', all.length - n.ok - n.adjust - n.no]]);
    }
    $('main').innerHTML = '<h1>Relecture des exercices</h1><p class="lead">Fais valider chaque exercice par un coach ou un kinésithérapeute (surtout les tractions et les cartes difficiles). Les exercices validés affichent « Relu par un pro » aux joueurs.</p><div id="rvk"></div><div class="row"><input type="search" id="rq" placeholder="Chercher un exercice" aria-label="Chercher"><select id="rf" aria-label="Filtrer"><option value="">Tous</option><option value="none">Pas relus</option><option value="ok">Validés</option><option value="adjust">À ajuster</option><option value="no">À retirer</option></select><input id="rn" maxlength="40" placeholder="Nom du relecteur" aria-label="Nom du relecteur" value="' + esc(NEV.store.get('nev.reviewer', '')) + '"></div><div class="tw"><table class="t"><thead><tr><th>Exercice</th><th>Avis</th><th>Remarque</th></tr></thead><tbody id="rvl"></tbody></table></div>';
    draw();
    $('rq').oninput = () => { q = $('rq').value.trim().toLowerCase(); draw(); };
    $('rf').onchange = () => { f = $('rf').value; draw(); };
    $('rn').onchange = () => NEV.store.set('nev.reviewer', $('rn').value);
    async function save(id, status, note) {
      try {
        if (!status) { await C.api('admin/reviews/' + encodeURIComponent(id), 'DELETE'); delete rv[id]; } else { await srv('reviews', { id: id, status: status, note: note, reviewer: $('rn').value }); rv[id] = { id: id, status: status, note: note }; }
        toast('Enregistré ✓');
      } catch (er) { toast(er.message, 1); }
    }
    $('main').onchange = (e) => { const s = e.target.closest('select[data-id]'); if (s) { const id = s.dataset.id, note = ($('rvl').querySelector('input[data-n="' + id + '"]') || {}).value || ''; save(id, s.value, note).then(draw); } const i = e.target.closest('input[data-n]'); if (i && rv[i.dataset.n]) save(i.dataset.n, rv[i.dataset.n].status, i.value); };
  };

  gate();
})();
