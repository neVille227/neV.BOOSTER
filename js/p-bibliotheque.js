/* neV.BOOSTER — Exercices : cartes exercice, cartes combo (avec avatars animés) et cartes mythiques, dans une seule page.
   Paramètres : ?zone=<id> (vient de la Spécialisation : n'affiche que cette zone), ?tab=ex|combo|myth. Publique. */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, Z = NEV.Zones, PR = NEV.Programmes;
  const ctx = await NEV.bootPublic('bibliotheque');
  const user = ctx.user, p = ctx.p, P = p || NEV.player.blank();
  const QS = new URLSearchParams(location.search);
  const zone = Z.get(QS.get('zone') || '');
  const hasEq = (ex) => (ex.equip || []).every((k) => !!(P.setup && P.setup.equip && P.setup.equip[k]));
  const missOf = (ex) => (ex.equip || []).filter((k) => !(P.setup && P.setup.equip && P.setup.equip[k])).map((k) => NEV.EQUIP[k]);
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const FEM = NEV.sex === 'f';
  const sexOk = (e) => NEV.Ex.sexOk(e, NEV.sex || 'm');

  const ALL = (zone ? Z.exercises(zone.id) : NEV.Ex.list()).filter(sexOk);
  const prio = () => (P.setup.zones || (P.setup.zones = []));

  /* ---------- en-tête (zone choisie dans Spécialisation) ---------- */
  if (zone) {
    $('eyebrow').textContent = 'Zone · ' + zone.name;
    $('title').innerHTML = esc(zone.name) + ', <em>les exercices</em>';
    $('lead').textContent = zone.desc;
    const zh = $('zhead'); zh.hidden = false;
    const renderZone = () => {
      const isP = prio().indexOf(zone.id) >= 0;
      zh.innerHTML = '<div><p class="muted" style="margin:0 0 10px"><b>Comment on la travaille :</b> ' + esc(zone.how) + '</p>' +
        '<div class="callout warn"><span class="ci">⚠️</span><p>' + esc(zone.care) + '</p></div></div>' +
        '<div class="zh-act"><a class="btn" href="' + (user ? 'gacha.html?mode=spe&zone=' + encodeURIComponent(zone.id) : 'connexion.html') + '" data-go>Gacha « ' + esc(zone.name) + ' »</a>' +
        (user ? '<button type="button" class="btn ghost" id="zFav" aria-pressed="' + isP + '">' + (isP ? '★ Zone favorite (retirer)' : '☆ Mettre en favori') + '</button>' : '') +
        '<a class="btn ghost" href="specialisation.html" data-go>Changer de zone</a></div>';
      const f = $('zFav');
      if (f) f.onclick = () => {
        const arr = prio(), i = arr.indexOf(zone.id);
        if (i >= 0) arr.splice(i, 1);
        else if (arr.length >= 3) { NEV.ui.toast('Tu as déjà 3 zones favorites : retires-en une d\'abord.'); return; }
        else arr.push(zone.id);
        NEV.player.save(p); renderZone();
        NEV.ui.toast(i >= 0 ? zone.name + ' n\'est plus favorite.' : zone.name + ' sortira plus souvent dans ton gacha du jour.');
      };
    };
    renderZone();
  } else {
    $('lead').textContent = ALL.length + ' exercices répartis en ' + (FEM ? NEV.CATS.filter((c) => ALL.some((e) => e.group === c.id)).length : NEV.CATS.length) + ' catégories, du plus doux au plus exigeant, plus les combos' + (FEM ? '.' : ' et les cartes mythiques.') + ' Touche une carte pour voir l\'animation, les étapes, les erreurs à éviter et les variantes.';
  }

  /* ---------- onglets ---------- */
  let tab = QS.get('tab') || (location.hash === '#combo' ? 'combo' : (location.hash === '#myth' ? 'myth' : 'ex'));
  const PANES = FEM ? { ex: 'pEx', combo: 'pCb' } : { ex: 'pEx', combo: 'pCb', myth: 'pMy' };
  if (FEM) { const mb = document.querySelector('#tabs [data-tab=myth]'); if (mb) mb.hidden = true; const mp = $('pMy'); if (mp) mp.hidden = true; }
  let mythDone = false, cbDone = false;
  function setTab(t, push) {
    if (!PANES[t]) t = 'ex'; tab = t;
    Object.keys(PANES).forEach((k) => { $(PANES[k]).hidden = k !== t; });
    $('tabs').querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    if (t === 'combo' && !cbDone) { cbDone = true; cbRefresh(); }
    if (t === 'myth' && !mythDone) { mythDone = true; mythic(); }
    try { const u = new URL(location.href); u.searchParams.set('tab', t); history.replaceState(null, '', u.pathname + u.search); } catch (e) { /* ignoré */ }
  }
  $('tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });

  /* =========== 1 · cartes exercice =========== */
  const PAGE = 24;
  let order = ALL.slice(), cat = '', tier = 0, q = '', nomat = false, shown = PAGE, view = [];
  $('nEx').textContent = ALL.length + ' exercices';

  const F_LAB = { pecs: 'Buste', dos: 'Posture' };
  function chips() {
    const cn = (id) => ALL.filter((e) => !id || e.group === id).length;
    const cats = NEV.CATS.filter((c) => cn(c.id));
    $('cats').innerHTML = cats.length > 1 ? '<button type="button" class="fchip' + (!cat ? ' on' : '') + '" data-c="">Tout<small>' + ALL.length + '</small></button>' +
      cats.map((c) => '<button type="button" class="fchip' + (cat === c.id ? ' on' : '') + '" data-c="' + c.id + '">' + esc(FEM && F_LAB[c.id] ? F_LAB[c.id] : c.short) + '<small>' + cn(c.id) + '</small></button>').join('') : '';
    $('tiers').innerHTML = '<button type="button" class="fchip' + (!tier ? ' on' : '') + '" data-t="0">Toutes difficultés</button>' +
      (FEM ? [1, 2, 3, 4] : [1, 2, 3, 4, 5]).map((t) => '<button type="button" class="fchip' + (tier === t ? ' on' : '') + '" data-t="' + t + '">' + esc(NEV.Gacha.RARITIES[t - 1].name) + ' · ' + esc(NEV.Ex.TIER_NAMES[t]) + '</button>').join('');
  }
  function filter() {
    const k = norm(q.trim());
    view = order.filter((e) => (!cat || e.group === cat) && (!tier || e.tier === tier) && (!nomat || !(e.equip || []).length) &&
      (!k || norm(e.name + ' ' + NEV.Ex.musclesText(e)).indexOf(k) >= 0));
  }
  function card(ex, i) {
    const miss = p && (ex.equip || []).length && !hasEq(ex);
    const badge = (ex.equip || []).length ? '<span class="miss' + (miss ? '' : ' ok') + '">' + (p ? (miss ? 'Matériel manquant' : 'Matériel OK') : esc(NEV.Ex.equipText(ex))) + '</span>' : '';
    return '<button type="button" class="xcard" style="animation-delay:' + Math.min(i, 11) * 35 + 'ms" data-open="' + esc(ex.id) + '" aria-label="Voir la fiche : ' + esc(ex.name) + '">' + NEV.Card.front(ex, {}) + badge + '</button>';
  }
  function render(append) {
    const g = $('grid'), slice = view.slice(0, shown);
    if (append) { const from = g.children.length; g.insertAdjacentHTML('beforeend', slice.slice(from).map((e, i) => card(e, i)).join('')); }
    else g.innerHTML = slice.map(card).join('');
    NEV.Card.mountArt(g);
    g.querySelectorAll('.xcard:not(.tg)').forEach((el) => { el.classList.add('tg'); NEV.Card.tilt(el, 8); });
    $('count').textContent = view.length ? view.length + ' exercice' + (view.length > 1 ? 's' : '') + (view.length > shown ? ' · ' + shown + ' affichés' : '') : 'Aucun exercice ne correspond à ta recherche.';
    $('more').hidden = view.length <= shown;
    $('more').textContent = 'Voir plus (' + (view.length - shown) + ')';
  }
  const refresh = () => { shown = PAGE; filter(); render(false); };
  function shuffle() {
    const a = ALL.slice();
    for (let i = a.length - 1; i > 0; i--) { const r = new Uint32Array(1); crypto.getRandomValues(r); const j = r[0] % (i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; }
    order = zone ? ALL.slice() : a; refresh();
  }
  $('cats').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) { cat = b.dataset.c; chips(); refresh(); } });
  $('tiers').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { tier = +b.dataset.t; chips(); refresh(); } });
  $('q').addEventListener('input', (e) => { q = e.target.value; refresh(); });
  $('nomat').addEventListener('change', (e) => { nomat = e.target.checked; refresh(); });
  $('shuf').addEventListener('click', shuffle);
  $('more').addEventListener('click', () => { shown += PAGE; render(true); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { if (es[0].isIntersecting && !$('more').hidden && tab === 'ex') { shown += PAGE; render(true); } }, { rootMargin: '400px' }).observe($('more'));
  }

  const openEx = (id) => {
    const ex = NEV.Ex.byId(id); if (!ex) return;
    NEV.ExModal.open(ex.id, user && ex.special !== 'repos' ? { startLabel: 'Faire une série libre', onStart: () => NEV.go('exercice.html?src=combo&id=' + encodeURIComponent('ex:' + ex.id)) } : {});
  };
  $('grid').addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) openEx(b.dataset.open); });

  /* =========== 2 · cartes combo, chaque étape est animée par un avatar =========== */
  const coach = () => ((NEV.cfg && NEV.cfg.combos) || []).filter((c) => NEV.Combos.valid(c) && c.items.every((it) => sexOk(NEV.Ex.byId(it[0])))).map((c) => Object.assign({ coach: true }, c));
  const inZone = (c) => !zone || c.items.some((it) => zone.ex.indexOf(it[0]) >= 0);
  const FAMS = [];
  if (zone) {
    FAMS.push({ id: 'zone', name: 'Combos « ' + zone.name + ' »', hint: 'Des enchaînements prêts à lancer pour cette zone. Les séries s\'adaptent à ton niveau.', list: () => zone.combos });
    FAMS.push({ id: 'prog', name: 'Programmes complets', hint: 'Les cartes d\'entraînement qui contiennent au moins un exercice de cette zone.', list: () => PR.list.filter(inZone), lv: true });
  } else {
    FAMS.push({ id: 'prog', name: 'Programmes', hint: FEM ? '25 cartes d\'entraînement à domicile pensées pour toi : fessiers, ventre, souplesse, buste et silhouette. 5 niveaux, une seule carte par séance.' : '25 cartes d\'entraînement à domicile, 5 niveaux, tout le corps. Choisis une seule carte par séance.', list: () => PR.list, lv: true });
    FAMS.push({ id: 'zone', name: 'Combos par zone', hint: 'Un enchaînement par groupe musculaire, prêt à lancer.', list: () => Z.allCombos() });
    if (coach().length) FAMS.push({ id: 'coach', name: 'Combos du coach', hint: 'Créés par l\'admin du site, mis à jour régulièrement.', list: coach });
  }
  let fam = FAMS[0].id, lvl = Math.max(1, Math.min(5, P.level || 1)), cbShown = 8;
  const CB_PAGE = 8;
  const famOf = (id) => FAMS.find((f) => f.id === id) || FAMS[0];
  const cbName = (c) => c.title || c.name;
  const totalCombos = FAMS.reduce((a, f) => a + f.list().filter((c) => NEV.Combos.valid(c)).length, 0);
  $('nCb').textContent = totalCombos + ' combos';
  $('cbLead').textContent = 'Chaque combo est une séance prête à lancer. Regarde l\'avatar de chaque étape : il te montre comment faire le mouvement. Touche une étape pour voir la fiche détaillée.';
  let figs = [];

  function cbChips() {
    const f = famOf(fam);
    $('cbf').innerHTML = FAMS.map((x) => '<button type="button" class="fchip' + (fam === x.id ? ' on' : '') + '" data-f="' + x.id + '">' + esc(x.name) + '</button>').join('') +
      (f.lv ? '<span class="fsep" aria-hidden="true"></span>' + PR.LEVELS.map((l) => '<button type="button" class="fchip' + (lvl === l.id ? ' on' : '') + '" data-l="' + l.id + '">' + esc(l.name) + (l.id === P.level ? '<small>★ ton niveau</small>' : '') + '</button>').join('') : '');
    $('cbh').textContent = f.lv ? f.hint + ' ' + PR.LEVELS[lvl - 1].hint : f.hint;
  }
  function comboHtml(c) {
    const steps = NEV.Combos.steps(c, P, user);
    const miss = []; steps.forEach((s) => missOf(s.ex).forEach((m) => { if (miss.indexOf(m) < 0) miss.push(m); }));
    const lock = miss.length ? ' aria-disabled="true" style="opacity:.45;pointer-events:none"' : '';
    return '<article class="cbc"><header><div class="meta">' + (c.n ? '<span class="chip red">Carte ' + c.n + '</span>' : (c.lvl ? '<span class="chip red">' + esc(c.lvl) + '</span>' : '')) +
      '<span class="chip">≈ ' + NEV.Combos.minutes(c, P, user) + ' min</span><span class="chip">' + steps.length + ' exercices</span>' + (c.coach ? '<span class="chip gold">Coach</span>' : '') + '</div>' +
      '<h3>' + esc(cbName(c)) + '</h3><p class="bl">' + esc(c.blurb || '') + '</p></header>' +
      '<ol class="cbsteps">' + steps.map((s, i) => '<li><button type="button" data-open="' + esc(s.ex.id) + '" aria-label="Fiche : ' + esc(s.ex.name) + '"><span class="cbfig" data-fig="' + esc(s.ex.id) + '"></span>' +
        '<i>' + (i + 1) + '</i><b>' + esc(s.ex.name) + '</b><em>' + s.plan.sets + ' × ' + esc(NEV.Ex.amountText(s.plan.unit, s.plan.perSet)) + '</em></button></li>').join('') + '</ol>' +
      (miss.length ? '<p class="muted cbmiss">⚠️ Il te faut : ' + esc(miss.join(', ')) + ' <a href="niveau.html?step=2" data-go>(régler mon matériel)</a></p>' : '') +
      '<footer>' + (user ? '<a class="btn ok sm" href="exercice.html?src=combo&id=' + encodeURIComponent(c.id) + '" data-go' + lock + '>Lancer ce combo</a>' : '<a class="btn sm" href="connexion.html" data-go>Se connecter pour lancer</a>') + '</footer></article>';
  }
  function cbRender() {
    figs.forEach((f) => { try { f && f.destroy && f.destroy(); } catch (e) { /* ignoré */ } }); figs = [];
    const f = famOf(fam);
    const list = f.list().filter((c) => NEV.Combos.valid(c) && (!f.lv || c.lvlId === lvl));
    const root = $('cbList');
    root.innerHTML = list.slice(0, cbShown).map(comboHtml).join('') || '<p class="muted">Aucun combo dans cette sélection.</p>';
    root.querySelectorAll('.cbfig[data-fig]').forEach((el) => {
      const ex = NEV.Ex.byId(el.dataset.fig); if (!ex || !NEV.Figure) return;
      try { figs.push(NEV.Figure.mount(el, ex, { label: ex.name })); } catch (e) { /* ignoré */ }
    });
    $('cbMore').hidden = list.length <= cbShown;
    $('cbMore').textContent = 'Voir plus (' + (list.length - cbShown) + ')';
  }
  function cbRefresh() { cbShown = CB_PAGE; cbChips(); cbRender(); }
  $('cbf').addEventListener('click', (e) => {
    const bf = e.target.closest('[data-f]'), bl = e.target.closest('[data-l]');
    if (bf) { fam = bf.dataset.f; cbRefresh(); } else if (bl) { lvl = +bl.dataset.l; cbRefresh(); }
  });
  $('cbMore').addEventListener('click', () => { cbShown += CB_PAGE; cbRender(); });
  $('cbList').addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) openEx(b.dataset.open); });

  /* =========== 3 · cartes mythiques =========== */
  const MOVES = [
    { id: 'c1', name: 'Pompes à un bras', en: 'One-Arm Push-Up', tags: ['Pectoraux', 'Épaules', 'Triceps', 'Tronc'] },
    { id: 'c2', name: 'Pompes en équilibre sur les mains', en: 'Handstand Push-Ups', tags: ['Épaules', 'Triceps', 'Trapèzes', 'Tronc'] },
    { id: 'c3', name: 'Pompes pseudo-planche avancées', en: 'Advanced Pseudo Planche Push-Ups', tags: ['Épaules', 'Pectoraux', 'Triceps', 'Abdominaux'] },
    { id: 'c4', name: 'Tractions à un bras', en: 'One-Arm Pull-Up', tags: ['Dorsaux', 'Biceps', 'Avant-bras', 'Tronc'] },
    { id: 'c5', name: 'Dragon Flag', en: 'Dragon Flag', tags: ['Abdominaux', 'Tronc', 'Dorsaux', 'Quadriceps'] },
    { id: 'c6', name: 'Muscle-up strict', en: 'Strict Muscle-Up', tags: ['Dorsaux', 'Biceps', 'Pectoraux', 'Triceps'] },
    { id: 'c7', name: 'Planche complète', en: 'Full Planche', tags: ['Épaules', 'Pectoraux', 'Abdominaux', 'Tronc'] }
  ];
  const OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function mythic() {
    const grid = $('mcGrid');
    grid.innerHTML = MOVES.map((m) => '<article class="mc"><div class="mc-in">' +
      '<header class="mc-top"><div class="mc-sr">MR</div><div class="mc-st" role="img" aria-label="5 étoiles sur 5">★★★★★</div></header>' +
      '<div class="mc-frame"><canvas data-m="' + m.id + '" role="img" aria-label="Avatar 3D qui réalise : ' + esc(m.name) + '"></canvas><span class="mc-em" aria-hidden="true"></span>' +
      '<span class="mc-rep">RÉP. 1/12</span><span class="mc-ok" aria-hidden="true">' + OK + '</span>' +
      '<div class="mc-hud" aria-hidden="true"><span>ACTIVATION</span><span class="mc-gauge"><b></b></span><span class="mc-pct">0%</span></div></div>' +
      '<h2 class="mc-name">' + esc(m.name) + '</h2><p class="mc-en">' + esc(m.en) + '</p>' +
      '<ul class="mc-tags">' + m.tags.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
      '<footer class="mc-ft"><b>MYTHIQUE</b><b>NEV.BOOSTER</b></footer></div></article>').join('');
    grid.querySelectorAll('canvas[data-m]').forEach((cv) => NEV.Mythic.mount(cv, cv.dataset.m));
  }

  const want = (location.hash || '').slice(1);
  chips(); shuffle();
  setTab(tab);
  if (want && NEV.Ex.byId(want)) setTimeout(() => openEx(want), 300);
})();
