/* neV.BOOSTER — espace admin : tableau de bord, suivi, joueurs, combos, badges, annonces, chat */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, C = NEV.cloud, A = C.admin, R = NEV.Rewards, U = NEV.util;
  await C.ready;
  let tab = 'dash', timer = 0;

  /* [id, titre, rang minimum] : 1 modérateur · 2 administrateur · 3 propriétaire. Simple confort d'affichage : le serveur refuse de toute façon. */
  const ALL_TABS = [['dash', '📊 Tableau de bord', 1], ['stats', '📈 Statistiques', 1], ['suivi', '🛰️ Suivi du site', 2], ['joueurs', '👥 Joueurs', 1], ['catalogue', '🎰 Catalogue et Gacha', 2], ['combos', '🧩 Combos', 2], ['badges', '🏅 Badges', 2], ['annonce', '📣 Annonce', 2], ['chat', '💬 Chat', 1], ['modo', '🛡️ Modération', 1], ['triche', '🚨 Anti-triche', 1], ['courriels', '✉️ Courriels', 2], ['relecture', '🩺 Relecture', 2], ['securite', '🔐 Sécurité', 2], ['equipe', '🧑‍💼 Équipe et rôles', 3], ['systeme', '⚙️ Système', 2], ['base', '🗄️ Base de données', 2]];
  let ROLE = 'owner', TABS = ALL_TABS;
  const RANK = { moderator: 1, admin: 2, owner: 3 };
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
  /* Le mot de passe est redemandé À CHAQUE entrée : on ferme toute session ouverte avant d'afficher la porte, et à la sortie de la page. */
  let named = false;
  function noSave() { const gp = $('gp'); gp.value = ''; gp.readOnly = true; setTimeout(() => { gp.readOnly = false; }, 60); } // champ non pré-remplissable par un gestionnaire de mots de passe
  async function gate() {
    await A.logout();
    const st = await A.state();
    $('app').hidden = true; $('gate').hidden = false;
    $('gtxt').textContent = st.hasPassword ? 'Entre ton mot de passe. Il est demandé à chaque ouverture et ne peut pas être enregistré.' : 'Première visite : choisis ton mot de passe admin (10 caractères minimum). Garde-le précieusement.';
    noSave(); $('gp').focus();
  }
  $('gnamed').addEventListener('click', () => { named = !named; $('gemw').hidden = !named; $('gnamed').textContent = named ? 'Je suis le propriétaire (mot de passe admin)' : 'Je suis un admin nommé (avec mon compte joueur)'; (named ? $('gem') : $('gp')).focus(); });
  $('gf').addEventListener('submit', async (e) => {
    e.preventDefault(); $('gerr').textContent = '';
    const r = await A.login($('gp').value, named ? $('gem').value : ''); $('gp').value = '';
    if (!r.ok) { $('gerr').textContent = r.error; return; }
    $('gem').value = ''; $('gate').hidden = true; start();
  });
  g_pagehide();
  function g_pagehide() { window.addEventListener('pagehide', () => { try { A.logout(); } catch (e) { /* ignoré */ } }); }
  $('out').addEventListener('click', async () => { await A.logout(); clearInterval(timer); $('app').hidden = true; gate(); });
  async function start() {
    try { const st = await A.state(); ROLE = st.role || 'owner'; } catch (e) { ROLE = 'owner'; }
    TABS = ALL_TABS.filter((t) => t[2] <= (RANK[ROLE] || 3)); document.body.setAttribute('data-role', ROLE);
    $('gate').hidden = true; $('app').hidden = false;
    $('mode').textContent = C.mode === 'server' ? '● Serveur · ' + ({ owner: 'Propriétaire', admin: 'Administrateur', moderator: 'Modérateur' }[ROLE] || '') : '● Mode démo (ce navigateur)';
    buildNav();
    show((location.hash || '').slice(1).split(':')[0] || 'dash');
  }
  const IC = {
    dash: 'M4 20V10M10 20V4M16 20v-7M22 20H2', stats: 'M3 17l5-6 4 3 8-9M3 21h18', suivi: 'M3 12h4l3-8 4 16 3-8h4', joueurs: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c0-3.6 3-5.5 6.5-5.5s6.5 1.9 6.5 5.5M17 4.5a3.3 3.3 0 010 6M21.5 20c0-2.6-1.6-4.3-3.8-5',
    catalogue: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9', combos: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM17 13v7M13.5 16.5h7', badges: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.3 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z',
    annonce: 'M4 10v4h3l7 4V6L7 10zM17 9a4 4 0 010 6', chat: 'M4 5h16v11H10l-5 4v-4H4z', modo: 'M12 3l8 3v6c0 4.5-3.2 7.5-8 9-4.8-1.5-8-4.5-8-9V6z', triche: 'M12 4l9 16H3zM12 10v4M12 17h.01',
    courriels: 'M3 6h18v12H3zM3 7l9 7 9-7', relecture: 'M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z', securite: 'M6 11V8a6 6 0 1112 0v3M5 11h14v9H5z', equipe: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6', systeme: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L6 8.5 4 8l-1 3 2 1v2l-2 1 1 3 2-.5L7.5 19l-.5 2 3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3-2-1z', base: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6', menu: 'M4 7h16M4 12h16M4 17h16'
  };
  const ico = (id) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (IC[id] || IC.dash) + '"/></svg>';
  const MAIN_IDS = ['dash', 'stats', 'suivi', 'joueurs', 'catalogue', 'combos', 'badges', 'annonce', 'chat'];
  function buildNav() {
    const lab = (t) => t[1].replace(/^\S+\s+/, ''), btn = (t) => '<button type="button" data-t="' + t[0] + '">' + ico(t[0]) + '<span>' + esc(lab(t)) + '</span></button>';
    const m = TABS.filter((t) => MAIN_IDS.indexOf(t[0]) >= 0), o = TABS.filter((t) => MAIN_IDS.indexOf(t[0]) < 0);
    $('nav').innerHTML = m.map(btn).join('') + (o.length ? '<div class="navsep">Administration</div>' + o.map(btn).join('') : '');
    const MT = [['dash', 'Tableau'], ['stats', 'Stats'], ['joueurs', 'Joueurs'], ['annonce', 'Annonce']].filter((x) => TABS.some((t) => t[0] === x[0]));
    $('mtabs').innerHTML = MT.map((x) => '<button type="button" data-t="' + x[0] + '">' + ico(x[0]) + '<span>' + x[1] + '</span></button>').join('') + '<button type="button" id="mmenu">' + ico('menu') + '<span>Menu</span></button>';
    $('tuser').textContent = ({ owner: 'Propriétaire', admin: 'Administrateur', moderator: 'Modérateur' }[ROLE] || 'Admin');
  }
  const setMenu = (o) => { $('side').classList.toggle('open', o); $('scrim').classList.toggle('open', o); };
  $('burger').addEventListener('click', () => setMenu(true)); $('sclose').addEventListener('click', () => setMenu(false)); $('scrim').addEventListener('click', () => setMenu(false));
  $('mtabs').addEventListener('click', (e) => { if (e.target.closest('#mmenu')) { setMenu(true); return; } const b = e.target.closest('[data-t]'); if (b) show(b.dataset.t); });
  $('nav').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { setMenu(false); show(b.dataset.t); } });
  $('tsearch').addEventListener('submit', (e) => { e.preventDefault(); const v = $('tq').value.trim(); if (!v) return; try { sessionStorage.setItem('nvb.adm.q', v); } catch (e2) { /* ignoré */ } show('joueurs'); });
  async function show(t) {
    if (!TABS.some((x) => x[0] === t)) t = 'dash';
    tab = t; history.replaceState(null, '', '#' + t); clearInterval(timer); $('main').onclick = null;
    document.querySelectorAll('#nav button,#mtabs button[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
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
  /* --- graphiques du tableau de bord (SVG, sans dépendance) --- */
  const fmtN = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const pctD = (a, b) => (b > 0 ? Math.round((a - b) / b * 100) : null);
  function spark(vals, color) {
    if (!vals || vals.length < 2) return '<svg class="sp" viewBox="0 0 100 34" aria-hidden="true"><path d="M0 28 L100 28" stroke="' + color + '" stroke-opacity=".35" fill="none" stroke-width="2"/></svg>';
    const mx = Math.max(1, ...vals), mn = Math.min(...vals), r = Math.max(1, mx - mn), pts = vals.map((v, i) => [i / (vals.length - 1) * 100, 30 - (v - mn) / r * 24]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    return '<svg class="sp" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + ' L100 34 L0 34 Z" fill="' + color + '" fill-opacity=".14"/><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  }
  function kcard(icon, color, value, label, delta, vals) {
    const dl = delta == null ? '<em class="dl z">—</em>' : '<em class="dl ' + (delta > 0 ? 'up' : delta < 0 ? 'dn' : 'z') + '">' + (delta > 0 ? '↑ +' : delta < 0 ? '↓ ' : '→ ') + delta + '%</em>';
    return '<div class="kc" style="--kc:' + color + '"><div class="kt"><i class="ki">' + ico(icon) + '</i>' + dl + '</div><b>' + esc(String(value)) + '</b><span>' + esc(label) + '</span>' + spark(vals, color) + '</div>';
  }
  function vbars(vals, labels, color) {
    const W = 380, H = 190, L = 28, B = 24, mx = Math.max(1, ...vals), top = Math.max(4, Math.ceil(mx / 4) * 4 || 4), ch = H - B - 10, bw = (W - L) / vals.length;
    let g = '';
    for (let i = 0; i <= 4; i++) { const y = 10 + ch - ch * i / 4; g += '<line x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="currentColor" stroke-opacity=".1"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".6">' + Math.round(top * i / 4) + '</text>'; }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Graphique en barres" class="vb">' + g + vals.map((v, i) => {
      const h = Math.round(v / top * ch), x = L + i * bw + bw * .2, w = bw * .6, y = 10 + ch - h;
      return '<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + w.toFixed(1) + '" height="' + h + '" rx="5" fill="' + color + '"/>' + (v ? '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (y - 5) + '" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">' + v + '</text>' : '') + '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity=".65">' + esc(labels[i]) + '</text>';
    }).join('') + '</svg>';
  }
  function donut(parts, total) {
    const R = 52, C = 2 * Math.PI * R; let off = 0;
    const arcs = parts.map((p) => { const len = total ? p.n / total * C : 0, a = '<circle r="' + R + '" cx="70" cy="70" fill="none" stroke="' + p.c + '" stroke-width="20" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 70 70)"/>'; off += len; return a; }).join('');
    return '<div class="dn"><svg viewBox="0 0 140 140" role="img" aria-label="Répartition des niveaux"><circle r="' + R + '" cx="70" cy="70" fill="none" stroke="currentColor" stroke-opacity=".1" stroke-width="20"/>' + arcs + '<text x="70" y="68" text-anchor="middle" font-size="24" font-weight="900" fill="currentColor">' + total + '</text><text x="70" y="86" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity=".65">Joueurs</text></svg><ul>' +
      parts.map((p) => '<li><i style="background:' + p.c + '"></i><span>' + esc(p.l) + '</span><b>' + p.n + '</b><small>(' + (total ? (p.n / total * 100).toFixed(1).replace('.', ',') : '0') + ' %)</small></li>').join('') + '</ul></div>';
  }
  function areaChart(days, vals) {
    const W = 640, H = 220, L = 38, B = 26, T = 14, mx = Math.max(1, ...vals), top = Math.max(4, Math.ceil(mx / 4) * 4), cw = W - L - 10, ch = H - B - T;
    const X = (i) => L + (vals.length > 1 ? i / (vals.length - 1) : 0) * cw, Y = (v) => T + ch - v / top * ch, P = vals.map((v, i) => [X(i), Y(v)]);
    let d = 'M' + P[0][0] + ' ' + P[0][1];
    for (let i = 1; i < P.length; i++) { const c = (P[i][0] - P[i - 1][0]) / 2; d += ' C' + (P[i - 1][0] + c).toFixed(1) + ' ' + P[i - 1][1].toFixed(1) + ' ' + (P[i][0] - c).toFixed(1) + ' ' + P[i][1].toFixed(1) + ' ' + P[i][0].toFixed(1) + ' ' + P[i][1].toFixed(1); }
    let g = ''; for (let i = 0; i <= 4; i++) { const y = T + ch - ch * i / 4; g += '<line x1="' + L + '" x2="' + (W - 10) + '" y1="' + y + '" y2="' + y + '" stroke="currentColor" stroke-opacity=".1"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".6">' + Math.round(top * i / 4) + '</text>'; }
    const step = Math.max(1, Math.ceil(vals.length / 7)); let xl = ''; days.forEach((dd, i) => { if (i % step === 0 || i === days.length - 1) xl += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity=".65">' + fd(dd) + '</text>'; });
    return '<div class="ac" id="ac"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Joueurs actifs par jour"><defs><linearGradient id="agr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--red)" stop-opacity=".45"/><stop offset="1" stop-color="var(--red)" stop-opacity="0"/></linearGradient></defs>' + g + xl +
      '<path d="' + d + ' L' + P[P.length - 1][0] + ' ' + (T + ch) + ' L' + P[0][0] + ' ' + (T + ch) + ' Z" fill="url(#agr)"/><path d="' + d + '" fill="none" stroke="var(--red)" stroke-width="3" stroke-linecap="round"/><g id="acd">' + (vals.length <= 31 ? P.map((p) => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="#fff" stroke="var(--red)" stroke-width="2"/>').join('') : '') + '</g><line id="acl" y1="' + T + '" y2="' + (T + ch) + '" stroke="var(--red)" stroke-dasharray="3 4" opacity="0"/><circle id="acp" r="6" fill="#fff" stroke="var(--red)" stroke-width="3" opacity="0"/></svg><div class="tip" id="tip" hidden></div></div>';
  }
  function bindArea(days, vals) {
    const el = $('ac'); if (!el) return; const svg = el.querySelector('svg'), W = 640, H = 220, L = 38, T = 14, B = 26, cw = W - L - 10, ch = H - B - T, top = Math.max(4, Math.ceil(Math.max(1, ...vals) / 4) * 4);
    const move = (ev) => {
      const r = svg.getBoundingClientRect(), x = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) / r.width * W, i = Math.max(0, Math.min(vals.length - 1, Math.round((x - L) / cw * (vals.length - 1)))), px = L + (vals.length > 1 ? i / (vals.length - 1) : 0) * cw, py = T + ch - vals[i] / top * ch;
      const l = $('acl'), p = $('acp'); l.setAttribute('x1', px); l.setAttribute('x2', px); l.setAttribute('opacity', 1); p.setAttribute('cx', px); p.setAttribute('cy', py); p.setAttribute('opacity', 1);
      const t = $('tip'); t.hidden = false; t.innerHTML = '<b>' + new Date(days[i] + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' }) + '</b>' + vals[i] + ' joueur' + (vals[i] > 1 ? 's' : '') + ' actif' + (vals[i] > 1 ? 's' : '');
      t.style.left = Math.min(Math.max(px / W * 100, 14), 86) + '%'; t.style.top = Math.max(py / H * 100 - 6, 2) + '%';
    };
    svg.addEventListener('mousemove', move); svg.addEventListener('touchmove', move, { passive: true }); svg.addEventListener('touchstart', move, { passive: true });
    svg.addEventListener('mouseleave', () => { $('tip').hidden = true; $('acl').setAttribute('opacity', 0); $('acp').setAttribute('opacity', 0); });
  }
  function freqPanel() {
    return '<section class="cp"><div class="ch"><h3><i class="ki sm">' + ico('stats') + '</i>Statistiques de fréquentation</h3><div class="rg" id="rg">' + [['7', '7j'], ['30', '30j'], ['90', '90j'], ['365', '1an']].map((x, i) => '<button type="button" data-n="' + x[0] + '" class="' + (i ? '' : 'on') + '">' + x[1] + '</button>').join('') + '</div></div><p class="muted small" style="margin:0 0 6px">Joueurs actifs par jour (connexions ou séances).</p><div id="fq"></div></section>';
  }
  async function loadFreq(n) {
    const r = await A.raw('stats/series?n=' + n, 'GET'), box = $('fq'); if (!box) return;
    if (!r.ok) { box.innerHTML = '<p class="muted">Données indisponibles (' + esc((r.data && r.data.error) || 'serveur requis') + ').</p>'; return; }
    box.innerHTML = areaChart(r.data.days, r.data.active); bindArea(r.data.days, r.data.active);
  }
  function bindFreq() { $('rg').onclick = (e) => { const b = e.target.closest('[data-n]'); if (!b) return; Array.prototype.forEach.call($('rg').children, (x) => x.classList.toggle('on', x === b)); loadFreq(b.dataset.n); }; loadFreq(7); }
  const LV = (levels) => { const l = levels || [0, 0, 0, 0, 0]; return [{ l: 'Débutant', n: (l[0] || 0) + (l[1] || 0), c: '#b983ff' }, { l: 'Intermédiaire', n: (l[2] || 0) + (l[3] || 0), c: '#e0455f' }, { l: 'Expert', n: l[4] || 0, c: '#ff8a3d' }]; };
  const SER = async () => { const r = await A.raw('stats/series?n=30', 'GET'); return r.ok ? r.data : null; };
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  VIEWS.dash = async function () {
    const [s, ser] = await Promise.all([A.stats(), SER()]); if (!s) throw new Error('Statistiques indisponibles');
    const now = new Date(), upd = now.toLocaleDateString('fr-FR') + ' • ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    let cards;
    if (ser) {
      const n = ser.days.length, l7 = (a) => sum(a.slice(n - 7)), p7 = (a) => sum(a.slice(n - 14, n - 7)), cum = []; let c = ser.playersBefore; ser.signups.forEach((v) => { c += v; cum.push(c); });
      const vr = ser.sessions.map((v, i) => (v ? Math.round(ser.verified[i] / v * 100) : 0)), vNow = l7(ser.sessions) ? Math.round(l7(ser.verified) / l7(ser.sessions) * 100) : 0, vPrev = p7(ser.sessions) ? Math.round(p7(ser.verified) / p7(ser.sessions) * 100) : null;
      cards = [kcard('joueurs', '#e0455f', fmtN(s.players), 'Joueurs', pctD(s.players, s.players - l7(ser.signups)), cum.slice(-14)),
        kcard('annonce', '#b983ff', s.newToday, 'Nouveaux aujourd\'hui', pctD(ser.signups[n - 1], ser.signups[n - 2]), ser.signups.slice(-14)),
        kcard('stats', '#4aa3ff', fmtN(s.sessionsTotal), 'Séances enregistrées', pctD(l7(ser.sessions), p7(ser.sessions)), ser.sessions.slice(-14)),
        kcard('securite', '#3ddc84', s.verifiedPct + ' %', 'Validées par caméra', vPrev == null ? null : vNow - vPrev, vr.slice(-14)),
        kcard('suivi', '#ff8a3d', s.avgStreak, 'Série moyenne', null, null), kcard('badges', '#f0b84a', s.bestStreak, 'Meilleure série', null, null)];
    } else cards = [kcard('joueurs', '#e0455f', s.players, 'Joueurs', null), kcard('annonce', '#b983ff', s.newToday, 'Nouveaux aujourd\'hui', null), kcard('stats', '#4aa3ff', s.sessionsTotal, 'Séances enregistrées', null), kcard('securite', '#3ddc84', s.verifiedPct + ' %', 'Validées par caméra', null), kcard('suivi', '#ff8a3d', s.avgStreak, 'Série moyenne', null), kcard('badges', '#f0b84a', s.bestStreak, 'Meilleure série', null)];
    const lv = LV(s.levels), tot = lv.reduce((a, x) => a + x.n, 0);
    $('main').innerHTML = '<div class="dh"><div><h1>Tableau de bord</h1><p class="lead">Vue d\'ensemble de la communauté neV.BOOSTER.</p></div><div class="ds"><span class="op">● Système opérationnel</span><small>Dernière mise à jour : ' + upd + '</small></div></div>' +
      '<div class="kg">' + cards.join('') + '</div>' +
      '<div class="cg"><section class="cp"><div class="ch"><h3><i class="ki sm">' + ico('joueurs') + '</i>Joueurs actifs (7 jours)</h3></div>' + vbars(s.active, s.days.map(fd), '#e0455f') + '</section>' +
      '<section class="cp"><div class="ch"><h3><i class="ki sm" style="--kc:#ff8a3d">' + ico('stats') + '</i>Séances validées (7 jours)</h3></div>' + vbars(s.sessions, s.days.map(fd), '#ff8a3d') + '</section>' +
      '<section class="cp"><div class="ch"><h3><i class="ki sm">' + ico('badges') + '</i>Niveaux des joueurs</h3></div>' + donut(lv, tot) + '</section></div>' +
      '<div class="cg2"><section class="cp" id="tk"></section><section class="cp ann"><h3>Annonce rapide</h3><p class="muted">Écris un message visible par tous les joueurs en haut du site.</p><textarea id="qa" maxlength="200" placeholder="Bienvenue sur neV.BOOSTER !" aria-label="Annonce rapide"></textarea><button type="button" class="btn" id="qaGo">Publier une annonce</button></section></div>' +
      '<div style="margin-top:16px">' + freqPanel() + '</div>';
    bindFreq(); drawTasks(); $('qaGo').onclick = async () => { const t = $('qa').value.trim(); if (!t) { toast('Écris un message.', true); return; } const r = await A.announce(t); toast(r && r.ok === false ? 'Publication impossible.' : 'Annonce publiée.', r && r.ok === false); };
  };
  VIEWS.stats = async function () {
    const [s, ser] = await Promise.all([A.stats(), SER()]); if (!s) throw new Error('Statistiques indisponibles');
    const lv = LV(s.levels), tot = lv.reduce((a, x) => a + x.n, 0);
    $('main').innerHTML = '<div class="dh"><div><h1>Statistiques</h1><p class="lead">Fréquentation et activité de la communauté.</p></div></div>' + freqPanel() +
      '<div class="cg" style="margin-top:16px"><section class="cp"><div class="ch"><h3>Joueurs actifs (7 jours)</h3></div>' + vbars(s.active, s.days.map(fd), '#e0455f') + '</section><section class="cp"><div class="ch"><h3>Séances validées (7 jours)</h3></div>' + vbars(s.sessions, s.days.map(fd), '#ff8a3d') + '</section><section class="cp"><div class="ch"><h3>Niveaux des joueurs</h3></div>' + donut(lv, tot) + '</section></div>' +
      '<h2>Exercices les plus tirés</h2><div class="chart">' + hbars(s.topExercises.map((x) => [exName(x.id), x.n])) + '</div>';
    bindFreq();
  };
  /* tâches récentes (vraie liste, journalisée) */
  const ST = { todo: ['En attente', 'wt'], doing: ['En cours', 'dg'], done: ['Terminée', 'dn2'] }, NEXT = { todo: 'doing', doing: 'done', done: 'todo' };
  let showAll = false;
  async function drawTasks() {
    const box = $('tk'); if (!box) return; const r = await A.raw('tasks', 'GET');
    if (!r.ok) { box.innerHTML = '<h3>Tâches récentes</h3><p class="muted">Disponible avec le serveur (rôle administrateur).</p>'; return; }
    const L = r.data.tasks || [], V = showAll ? L : L.slice(0, 4);
    box.innerHTML = '<div class="ch"><h3><i class="ki sm">' + ico('dash') + '</i>Tâches récentes</h3>' + (L.length > 4 ? '<button type="button" class="linkb" id="tkAll">' + (showAll ? 'Réduire' : 'Voir toutes') + ' →</button>' : '') + '</div>' +
      (V.length ? '<ul class="tl">' + V.map((t) => '<li><i class="dot ' + ST[t.status][1] + '"></i><div class="tt"><b>' + esc(t.title) + '</b><small>' + esc(t.detail) + '</small></div><button type="button" class="chipb ' + ST[t.status][1] + '" data-ts="' + t.id + '" data-n="' + NEXT[t.status] + '" title="Changer le statut">' + ST[t.status][0] + '</button><time>' + esc(fd(t.due)) + '</time><button type="button" class="x" data-td="' + t.id + '" aria-label="Supprimer la tâche">✕</button></li>').join('') + '</ul>' : '<p class="muted">Aucune tâche. Ajoute-en une ci-dessous.</p>') +
      '<form class="tadd" id="tf"><input type="text" id="tt" maxlength="90" placeholder="Nouvelle tâche…" aria-label="Titre de la tâche"><input type="text" id="td" maxlength="160" placeholder="Détail (facultatif)" aria-label="Détail"><button class="btn sm" type="submit">Ajouter</button></form>';
    $('tkAll') && ($('tkAll').onclick = () => { showAll = !showAll; drawTasks(); });
    box.onclick = async (e) => { const a = e.target.closest('[data-ts]'), d = e.target.closest('[data-td]'); if (a) { await A.raw('tasks/status', 'POST', { id: +a.dataset.ts, status: a.dataset.n }); drawTasks(); } else if (d && await ask('Supprimer cette tâche ?')) { await A.raw('tasks/delete', 'POST', { id: +d.dataset.td }); drawTasks(); } };
    $('tf').onsubmit = async (e) => { e.preventDefault(); const t = $('tt').value.trim(); if (!t) return; const x = await A.raw('tasks', 'POST', { title: t, detail: $('td').value.trim() }); if (!x.ok) { toast((x.data && x.data.error) || 'Impossible.', true); return; } drawTasks(); };
  }

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
    try { const pre = sessionStorage.getItem('nvb.adm.q'); if (pre) { sessionStorage.removeItem('nvb.adm.q'); q = pre; $('jq').value = pre; table(); } } catch (e) { /* ignoré */ }
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
      const d = await srv('moderation'); let dm = { reports: [] }; try { dm = await srv('social/reports'); } catch (e0) { /* ancien serveur */ }
      const rows = d.reports.map((r) => '<tr><td><b>' + esc(r.authorName) + '</b><br><small class="muted">' + dt(r.t) + '</small></td><td style="max-width:360px;overflow-wrap:anywhere">' + esc(r.text) + '</td><td>' + r.reporters + ' signalement' + (r.reporters > 1 ? 's' : '') + (r.hidden ? '<br><span class="chip bad">masqué</span>' : '') + (r.muted ? '<br><span class="chip">en sourdine</span>' : '') + '</td><td><div class="row" style="margin:0;gap:6px"><button type="button" class="btn sm ghost" data-a="' + (r.hidden ? 'show' : 'hide') + '" data-m="' + esc(r.msgId) + '">' + (r.hidden ? 'Réafficher' : 'Masquer') + '</button><button type="button" class="btn sm danger" data-a="delete" data-m="' + esc(r.msgId) + '">Supprimer</button><button type="button" class="btn sm ghost" data-a="mute" data-h="24" data-m="' + esc(r.msgId) + '">Sourdine 24 h</button><button type="button" class="btn sm ghost" data-a="mute" data-h="168" data-m="' + esc(r.msgId) + '">7 jours</button><button type="button" class="btn sm ghost" data-a="dismiss" data-m="' + esc(r.msgId) + '">Ignorer</button></div></td></tr>').join('');
      $('main').innerHTML = '<h1>Modération du chat</h1><p class="lead">Les messages signalés par les joueurs. À 3 signalements différents, un message est masqué automatiquement en attendant ta décision. Le filtre bloque déjà liens, e-mails, numéros, insultes et contacts externes.</p>' +
        (d.reports.length ? '<div class="tw"><table class="t"><thead><tr><th>Auteur</th><th>Message</th><th>État</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="panel f"><b>✅ Aucun signalement en attente.</b></div>') +
        '<h2 style="margin-top:28px">Messages privés et profils signalés</h2>' + (dm.reports.length ? '<div class="tw"><table class="t"><thead><tr><th>Date</th><th>Signalé</th><th>Par</th><th>Message / motif</th><th>Action</th></tr></thead><tbody>' + dm.reports.map((r) => '<tr><td>' + dt(r.t) + '</td><td><b>@' + esc(r.targetHandle || '?') + '</b></td><td>@' + esc(r.reporterHandle || '?') + '</td><td style="max-width:360px;overflow-wrap:anywhere">' + (r.text ? esc(r.text) + '<br>' : '') + '<small class="muted">' + esc(r.reason) + '</small></td><td><button class="btn s" data-a="dmclose" data-m="' + r.id + '">Classer</button></td></tr>').join('') + '</tbody></table></div>' : '<div class="panel f"><b>✅ Aucun signalement de messagerie.</b></div>');
    }
    $('main').onclick = async (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'dmclose') { try { await srv('social/reports/close', { id: Number(b.dataset.m) }); toast('Classé ✓'); draw(); } catch (er) { toast(er.message, 1); } return; }
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

  /* =====================================================================
     ADMINISTRATION PROFESSIONNELLE : système, sécurité, catalogue, équipe
     (l'interface masque ce que ton rôle ne permet pas, mais c'est le SERVEUR qui refuse : voir server.js)
     ===================================================================== */
  const dtl = (t) => new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const upt = (s) => { const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return (d ? d + ' j ' : '') + h + ' h ' + m + ' min'; };
  const okb = (v, yes, no) => '<span class="' + (v ? 'ok-t' : 'bad-t') + '">' + (v ? '● ' + yes : '○ ' + no) + '</span>';
  const csvCell = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const saveFile = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: type || 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };

  /* ---------- système ---------- */
  VIEWS.systeme = async function () {
    if (C.mode !== 'server') { $('main').innerHTML = '<h1>Système</h1>' + needServer(); return; }
    async function draw() {
      const [s, st] = await Promise.all([srv('system'), srv('settings')]);
      const c = s.counters || {}, mt = st.maintenance || {};
      $('main').innerHTML = '<h1>Système</h1><p class="lead">État du serveur, de la base de données et des sauvegardes.</p>' +
        (mt.on ? '<div class="warnbar">🚧 <b>Mode maintenance actif</b> : les nouvelles inscriptions sont suspendues. ' + esc(mt.msg || '') + '</div>' : '') +
        kpi([[upt(s.uptimeS), 'En ligne depuis'], [s.memMB + ' Mo', 'Mémoire'], [bytesFmt(s.db.sizeBytes), 'Base de données'], [s.disk ? s.disk.freeMB + ' Mo' : '—', 'Disque libre'], [c.requests || 0, 'Requêtes'], [c.errors5xx || 0, 'Erreurs serveur']]) +
        '<div class="panel f"><h3 style="margin:0 0 8px">Contrôles de santé</h3><div class="tw"><table class="t wrapc"><tbody>' +
        '<tr><td>Stockage durable (disque Render)</td><td>' + okb(s.persistent, 'Configuré', 'Non : les données peuvent disparaître') + '</td></tr>' +
        '<tr><td>Envoi d\'e-mails (SMTP)</td><td>' + okb(s.smtp, 'Configuré', 'Non : pas de code par e-mail') + '</td></tr>' +
        '<tr><td>Adresse publique (NEV_BASE_URL)</td><td>' + okb(!!s.baseUrl, esc(s.baseUrl), 'Non renseignée') + '</td></tr>' +
        '<tr><td>Notifications push</td><td>' + okb(s.push, 'Clés générées', 'Pas encore') + '</td></tr>' +
        '<tr><td>Sauvegardes</td><td>' + okb(s.db.backups.length > 0, s.db.backups.length + ' copie(s)', 'Aucune') + '</td></tr>' +
        '<tr><td>Moteur</td><td>' + esc(s.db.engine) + ' · ' + esc(s.db.journal) + ' · ' + s.db.tables + ' tables</td></tr>' +
        '<tr><td>Serveur</td><td>Node ' + esc(s.node) + ' · ' + esc(s.platform) + '</td></tr></tbody></table></div></div>' +
        '<div class="panel f" style="margin-top:14px"><h3 style="margin:0 0 8px">Mode maintenance</h3><p class="muted" style="margin-top:0">Suspend les nouvelles inscriptions et affiche un bandeau aux joueurs connectés. Les joueurs déjà inscrits continuent de s\'entraîner.</p>' +
        '<label class="lb" for="mtm">Message affiché</label><input id="mtm" style="width:100%" maxlength="200" value="' + esc(mt.msg || '') + '" placeholder="Ex. Mise à jour en cours, retour à 18 h."><div class="row"><label style="display:flex;gap:8px;align-items:center;font-weight:700"><input type="checkbox" id="mto"' + (mt.on ? ' checked' : '') + '> Maintenance activée</label><button type="button" class="btn" id="mts">Enregistrer</button></div></div>' +
        '<h2>Sauvegardes</h2><div class="row"><button type="button" class="btn" id="bk">Sauvegarder maintenant</button><a class="btn ghost" href="../api/admin/db/backup">Télécharger la base complète</a></div>' +
        (s.db.backups.length ? '<div class="tw"><table class="t"><thead><tr><th>Fichier</th><th>Taille</th></tr></thead><tbody>' + s.db.backups.map((b) => '<tr><td>' + esc(b.name) + '</td><td>' + bytesFmt(b.size) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">Aucune copie automatique pour l\'instant (une par jour, 7 conservées).</p>') +
        '<h2>Dernières erreurs</h2>' + (s.errors.length ? '<div class="tw"><table class="t"><thead><tr><th>Heure</th><th>Page</th><th>Détail</th></tr></thead><tbody>' + s.errors.map((e) => '<tr><td>' + esc(dtl(e.t)) + '</td><td>' + esc(e.page || '—') + '</td><td>' + esc(JSON.stringify(e.data || {}).slice(0, 160)) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">Aucune erreur récente. 👌</p>');
      $('mts').onclick = async () => { try { await srv('settings', { maintenance: { on: $('mto').checked, msg: $('mtm').value } }); toast($('mto').checked ? 'Maintenance activée 🚧' : 'Maintenance coupée'); draw(); } catch (e) { toast(e.message, 1); } };
      $('bk').onclick = async () => { try { await srv('db/backup-now', {}); toast('Sauvegarde créée ✅'); draw(); } catch (e) { toast(e.message, 1); } };
    }
    await draw();
  };

  /* ---------- sécurité : journal d'audit, connexions, sessions ---------- */
  VIEWS.securite = async function () {
    if (C.mode !== 'server') { $('main').innerHTML = '<h1>Sécurité</h1>' + needServer(); return; }
    let q = '', kind = '';
    const KIND = { '': 'Toutes les actions', conn: 'Connexions', refus: 'Refus et alertes', admin: 'Rôles et réglages' };
    const isK = (a) => kind === 'conn' ? /^(login|login-refuse|logout|session)/.test(a) : kind === 'refus' ? /(refuse|refus)/.test(a) : kind === 'admin' ? /^(nomme|retire|maintenance|gacha|catalogue|announce|sessions)/.test(a) : true;
    async function draw() {
      const [a, ss] = await Promise.all([srv('audit?q=' + encodeURIComponent(q) + '&limit=400'), srv('sessions')]);
      const rows = a.rows.filter((r) => isK(r.action)), bad = a.rows.filter((r) => /refuse|refus/.test(r.action)).length;
      $('main').innerHTML = '<h1>Sécurité</h1><p class="lead">Qui a fait quoi, et qui est connecté à l\'administration. Les sessions admin expirent après ' + ss.minutes + ' minutes.</p>' +
        kpi([[ss.sessions.length, 'Sessions admin ouvertes'], [bad, 'Refus (400 dernières lignes)'], [a.rows.length, 'Actions journalisées']]) +
        '<h2>Sessions admin ouvertes</h2><div class="tw"><table class="t"><thead><tr><th>Qui</th><th>Rôle</th><th>Ouverte</th><th>Expire</th><th></th></tr></thead><tbody>' +
        ss.sessions.map((x) => '<tr><td><b>' + esc(x.who) + '</b>' + (x.current ? ' <span class="pill">cette session</span>' : '') + '</td><td>' + esc({ owner: 'Propriétaire', admin: 'Administrateur', moderator: 'Modérateur' }[x.role] || x.role) + '</td><td>' + esc(dtl(x.opened)) + '</td><td>' + esc(dtl(x.exp)) + '</td><td>' + (x.current ? '' : '<button type="button" class="btn ghost sm" data-rv="' + esc(x.id) + '">Déconnecter</button>') + '</td></tr>').join('') + '</tbody></table></div>' +
        (ROLE === 'owner' ? '<div class="row"><button type="button" class="btn ghost" id="rva">Déconnecter toutes les autres sessions</button></div>' : '') +
        '<h2>Journal d\'audit</h2><div class="row"><input type="search" id="aq" placeholder="Rechercher (auteur, action, cible…)" value="' + esc(q) + '"><select id="ak" aria-label="Type">' + Object.keys(KIND).map((k) => '<option value="' + k + '"' + (k === kind ? ' selected' : '') + '>' + KIND[k] + '</option>').join('') + '</select><button type="button" class="btn ghost" id="ax">Exporter en CSV</button></div>' +
        '<div class="tw"><table class="t"><thead><tr><th>Date</th><th>Auteur</th><th>Action</th><th>Cible</th><th>Détail</th></tr></thead><tbody>' + (rows.length ? rows.map((r) => '<tr class="' + (/refus/.test(r.action) ? 'ban' : '') + '"><td>' + esc(dtl(r.t)) + '</td><td>' + esc(r.actor || '—') + '</td><td><b>' + esc(r.action) + '</b></td><td>' + esc(r.target || '') + '</td><td>' + esc(r.detail || '') + '</td></tr>').join('') : '<tr><td colspan="5" class="muted">Aucune ligne.</td></tr>') + '</tbody></table></div>';
      $('aq').onchange = () => { q = $('aq').value; draw(); };
      $('ak').onchange = () => { kind = $('ak').value; draw(); };
      $('ax').onclick = () => saveFile('nev-journal-audit-' + new Date().toISOString().slice(0, 10) + '.csv', 'Date;Auteur;Action;Cible;Detail\n' + rows.map((r) => [dtl(r.t), r.actor, r.action, r.target, r.detail].map(csvCell).join(';')).join('\n'));
      $('main').onclick = async (e) => { const b = e.target.closest('[data-rv]'); if (b && await ask('Déconnecter cette session admin ?')) { try { await srv('sessions/revoke', { id: b.dataset.rv }); toast('Session fermée'); draw(); } catch (er) { toast(er.message, 1); } } };
      if ($('rva')) $('rva').onclick = async () => { if (await ask('Fermer toutes les autres sessions admin ?')) { try { await srv('sessions/revoke-all', {}); toast('Sessions fermées'); draw(); } catch (er) { toast(er.message, 1); } } };
    }
    await draw();
  };

  /* ---------- catalogue : statut des exercices et probabilités du Gacha ---------- */
  VIEWS.catalogue = async function () {
    if (C.mode !== 'server') { $('main').innerHTML = '<h1>Catalogue et Gacha</h1>' + needServer(); return; }
    const st = await srv('settings'), all = NEV.Ex.list(), RN = ['Commun', 'Rare', 'Épique', 'Légendaire', 'Mythique'];
    let q = '', f = '', ex = Object.assign({}, st.exStatus), w = st.gachaWeights.slice();
    function drawList() {
      const list = all.filter((e) => (!q || (e.name + ' ' + e.id).toLowerCase().indexOf(q) >= 0) && (!f || (ex[e.id] || 'published') === f));
      const n = { published: 0, draft: 0, disabled: 0 }; all.forEach((e) => { n[ex[e.id] || 'published']++; });
      $('ck').innerHTML = kpi([[all.length, 'Exercices'], [n.published, 'Publiés'], [n.draft, 'Brouillons'], [n.disabled, 'Désactivés']]);
      $('cl').innerHTML = list.slice(0, 300).map((e) => { const v = ex[e.id] || 'published'; return '<tr><td><b>' + esc(e.name) + '</b><br><small class="muted">' + esc(e.group || '') + ' · ' + esc(e.tierName || '') + (e.for ? ' · version ' + (e.for === 'f' ? 'femme' : 'homme') : ' · mixte') + '</small></td><td><select data-ex="' + esc(e.id) + '" aria-label="Statut de ' + esc(e.name) + '">' + [['published', 'Publié'], ['draft', 'Brouillon'], ['disabled', 'Désactivé']].map((o) => '<option value="' + o[0] + '"' + (o[0] === v ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></td></tr>'; }).join('') || '<tr><td colspan="2" class="muted">Aucun exercice.</td></tr>';
    }
    const tot = () => w.reduce((a, b) => a + b, 0) || 1;
    $('main').innerHTML = '<h1>Catalogue et Gacha</h1><p class="lead">Contrôle ce qui peut sortir au tirage et la rareté des cartes. Un exercice en brouillon ou désactivé ne sort plus ; les joueurs gardent leur historique.</p>' +
      '<div class="panel f"><h3 style="margin:0 0 6px">Probabilités du Gacha</h3><p class="muted" style="margin-top:0">Multiplicateur appliqué à chaque rareté (100 % = réglage normal, 0 % = ne sort plus). Le niveau du joueur et la pitié restent pris en compte.</p>' +
      '<div class="g2" id="gw">' + RN.map((n, i) => '<div><label class="lb" for="gw' + i + '">' + n + ' : <b id="gv' + i + '">' + Math.round(w[i] * 100) + ' %</b></label><input type="range" id="gw' + i + '" min="0" max="300" step="10" value="' + Math.round(w[i] * 100) + '" data-i="' + i + '"></div>').join('') + '</div>' +
      '<div class="row"><button type="button" class="btn" id="gs">Enregistrer les probabilités</button><button type="button" class="btn ghost" id="gr">Revenir au réglage normal</button></div></div>' +
      '<h2>Exercices</h2><div id="ck"></div><div class="row"><input type="search" id="cq" placeholder="Chercher un exercice…"><select id="cf" aria-label="Filtrer"><option value="">Tous</option><option value="published">Publiés</option><option value="draft">Brouillons</option><option value="disabled">Désactivés</option></select></div>' +
      '<div class="tw"><table class="t"><thead><tr><th>Exercice</th><th>Statut</th></tr></thead><tbody id="cl"></tbody></table></div>';
    drawList();
    $('cq').oninput = () => { q = $('cq').value.trim().toLowerCase(); drawList(); };
    $('cf').onchange = () => { f = $('cf').value; drawList(); };
    $('gw').oninput = (e) => { const i = e.target.dataset.i; if (i == null) return; w[i] = Number(e.target.value) / 100; $('gv' + i).textContent = e.target.value + ' %'; };
    $('gs').onclick = async () => { try { const r = await srv('settings', { gachaWeights: w }); w = r.gachaWeights.slice(); toast('Probabilités enregistrées 🎰'); } catch (e) { toast(e.message, 1); } };
    $('gr').onclick = async () => { try { await srv('settings', { gachaWeights: [1, 1, 1, 1, 1] }); toast('Réglage normal rétabli'); show('catalogue'); } catch (e) { toast(e.message, 1); } };
    $('cl').onchange = async (e) => { const s = e.target.closest('select[data-ex]'); if (!s) return; const body = {}; body[s.dataset.ex] = s.value; try { const r = await srv('settings', { exStatus: body }); ex = Object.assign({}, r.exStatus); toast('Statut enregistré ✓'); drawList(); } catch (er) { toast(er.message, 1); } };
  };

  /* ---------- équipe : rôles (propriétaire seulement) ---------- */
  VIEWS.equipe = async function () {
    if (C.mode !== 'server') { $('main').innerHTML = '<h1>Équipe</h1>' + needServer(); return; }
    async function draw() {
      const [t, users] = await Promise.all([srv('team'), A.users()]);
      const RL = { admin: 'Administrateur', moderator: 'Modérateur' };
      $('main').innerHTML = '<h1>Équipe et rôles</h1><p class="lead">Seul le propriétaire (mot de passe admin) attribue les rôles. Chaque membre entre avec <b>son</b> mot de passe de compte ; le serveur relit son rôle à chaque action.</p>' +
        '<div class="g2"><div class="panel f"><h3 style="margin:0 0 6px">Ce que chaque rôle peut faire</h3><div class="tw"><table class="t wrapc"><thead><tr><th>Rôle</th><th>Accès</th></tr></thead><tbody>' +
        '<tr><td><b>Propriétaire</b></td><td>Tout, y compris rôles, console SQL, suppressions et déconnexion globale.</td></tr>' +
        '<tr><td><b>Administrateur</b></td><td>Gestion quotidienne : joueurs, catalogue, Gacha, annonces, e-mails, base (lecture et export), sécurité.</td></tr>' +
        '<tr><td><b>Modérateur</b></td><td>Chat, signalements, messages privés signalés, sanctions, anti-triche. Pas d\'e-mails de joueurs, pas de réglages.</td></tr></tbody></table></div></div>' +
        '<div class="panel f"><h3 style="margin:0 0 6px">Nommer quelqu\'un</h3><label class="lb" for="eu">Joueur</label><select id="eu"><option value="">Choisir un joueur…</option>' + users.filter((u) => !u.admin && !u.banned).map((u) => '<option value="' + esc(u.id) + '">' + esc(u.pseudo) + '</option>').join('') + '</select>' +
        '<label class="lb" for="er">Rôle</label><select id="er"><option value="moderator">Modérateur</option><option value="admin">Administrateur</option></select><div class="row"><button type="button" class="btn" id="eg">Attribuer</button></div></div></div>' +
        '<h2>Membres de l\'équipe</h2><div class="tw"><table class="t"><thead><tr><th>Pseudo</th><th>Rôle</th><th></th></tr></thead><tbody>' + (t.team.length ? t.team.map((m) => '<tr><td><b>' + esc(m.pseudo) + '</b><br><small class="muted">' + esc(m.email) + '</small></td><td><select data-m="' + esc(m.id) + '" aria-label="Rôle de ' + esc(m.pseudo) + '">' + Object.keys(RL).map((k) => '<option value="' + k + '"' + (k === m.role ? ' selected' : '') + '>' + RL[k] + '</option>').join('') + '</select></td><td><button type="button" class="btn ghost sm" data-x="' + esc(m.id) + '">Retirer le rôle</button></td></tr>').join('') : '<tr><td colspan="3" class="muted">Aucun membre pour l\'instant : tu es seul(e) propriétaire.</td></tr>') + '</tbody></table></div>';
      const setRole = async (uid, role, msg) => { try { await srv('role', { uid: uid, role: role }); toast(msg); draw(); } catch (e) { toast(e.message, 1); } };
      $('eg').onclick = () => { if (!$('eu').value) { toast('Choisis un joueur.', 1); return; } setRole($('eu').value, $('er').value, 'Rôle attribué ✓'); };
      $('main').onchange = (e) => { const s = e.target.closest('select[data-m]'); if (s) setRole(s.dataset.m, s.value, 'Rôle modifié ✓'); };
      $('main').onclick = async (e) => { const b = e.target.closest('[data-x]'); if (b && await ask('Retirer son rôle à ce membre ? Sa session admin sera fermée.')) setRole(b.dataset.x, '', 'Rôle retiré'); };
    }
    await draw();
  };

  gate();
})();
