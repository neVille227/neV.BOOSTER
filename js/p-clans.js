/* neV.BOOSTER — Clans : classement des clans, créer, rejoindre, quitter (XP du clan = somme de l'XP des membres). */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc;
  const ctx = await NEV.boot('clans'); if (!ctx) return;
  const box = $('clans');
  async function api(path, data) {
    try {
      const r = await fetch('api/social/' + path, { method: data ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', headers: Object.assign({ 'X-NEV': '1' }, data ? { 'Content-Type': 'application/json' } : {}), body: data ? JSON.stringify(data) : undefined });
      let j = {}; try { j = await r.json(); } catch (e) { /* vide */ }
      return { ok: r.ok, j: j };
    } catch (e) { return { ok: false, j: { error: 'Connexion impossible. Réessaie.' } }; }
  }
  if (NEV.cloud.mode !== 'server') { box.innerHTML = '<p class="cl-empty">Les clans demandent le serveur (mode démo : non disponible).</p>'; return; }
  async function draw(msg) {
    const r = await api('clans'); if (!r.ok) { box.innerHTML = '<p class="cl-empty">' + esc(r.j.error || 'Clans indisponibles.') + '</p>'; return; }
    const L = r.j.clans || [], mine = r.j.mine, max = r.j.max || 30, top = Math.max(1, L.reduce((a, c) => Math.max(a, c.xp), 0));
    const row = (c) => '<div class="cn-row' + (c.mine ? ' mine' : '') + '"><b class="rk">' + c.rank + '</b><div><b>' + esc(c.name) + (c.mine ? ' (ton clan)' : '') + '</b><small>' + (c.descr ? esc(c.descr) + ' · ' : '') + c.members + ' / ' + max + ' membres · ' + c.xp + ' XP</small><div class="sp-bar"><i style="width:' + Math.round(100 * c.xp / top) + '%"></i></div></div>' +
      (c.mine ? '<button type="button" class="btn ghost" data-leave="1">Quitter</button>' : mine ? '' : c.full ? '<small>Complet</small>' : '<button type="button" class="btn" data-join="' + esc(c.id) + '">Rejoindre</button>') + '</div>';
    box.innerHTML = '<div class="cl-wrap">' + (msg ? '<p class="cl-empty" role="status">' + esc(msg) + '</p>' : '') +
      (L.length ? L.map(row).join('') : '<p class="cl-empty">Aucun clan pour le moment. Crée le premier !</p>') +
      (mine ? '' : '<div class="eyebrow" style="margin-top:14px">Créer un clan</div><form class="cn-form" id="cf" autocomplete="off"><input id="cnm" maxlength="24" placeholder="Nom du clan (3 à 24 caractères)" aria-label="Nom du clan"><input id="cds" maxlength="80" placeholder="Description (facultatif)" aria-label="Description"><p class="err" id="cerr" style="color:#ff8d9d;margin:0"></p><button class="btn" type="submit">Créer mon clan</button></form>') + '</div>';
  }
  box.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.join) { b.disabled = true; const r = await api('clans/join', { id: b.dataset.join }); draw(r.ok ? 'Bienvenue dans le clan !' : (r.j.error || 'Impossible de rejoindre.')); }
    if (b.dataset.leave) { if (!confirm('Quitter ton clan ?')) return; await api('clans/leave', {}); draw('Tu as quitté ton clan.'); }
  });
  box.addEventListener('submit', async (e) => {
    e.preventDefault(); const r = await api('clans/create', { name: $('cnm').value, descr: $('cds').value });
    if (!r.ok) { $('cerr').textContent = r.j.error || 'Création impossible.'; return; }
    draw('Clan créé.');
  });
  draw();
})();
