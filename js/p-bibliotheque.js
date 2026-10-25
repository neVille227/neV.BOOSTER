/* neV.BOOSTER — Bibliothèque : toutes les cartes d'exercices (publique) */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc;
  const ctx = await NEV.bootPublic('bibliotheque');
  const p = ctx.p, user = ctx.user;
  const ALL = NEV.Ex.list();
  const PAGE = 24;
  let order = ALL.slice(), cat = '', tier = 0, q = '', nomat = false, shown = PAGE, view = [];

  $('lead').textContent = ALL.length + ' exercices répartis en ' + NEV.CATS.length + ' catégories, du plus facile au plus extrême. Chaque carte a sa couleur de rareté : touche-la pour voir l\'animation, les étapes, les erreurs à éviter et les variantes.';

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const hasEq = (ex) => !p || (ex.equip || []).every((k) => !!(p.setup && p.setup.equip && p.setup.equip[k]));

  function chips() {
    const cn = (id) => ALL.filter((e) => !id || e.group === id).length;
    $('cats').innerHTML = '<button type="button" class="fchip' + (!cat ? ' on' : '') + '" data-c="">Tout<small>' + ALL.length + '</small></button>' +
      NEV.CATS.map((c) => '<button type="button" class="fchip' + (cat === c.id ? ' on' : '') + '" data-c="' + c.id + '">' + esc(c.short) + '<small>' + cn(c.id) + '</small></button>').join('');
    $('tiers').innerHTML = '<button type="button" class="fchip' + (!tier ? ' on' : '') + '" data-t="0">Toutes difficultés</button>' +
      [1, 2, 3, 4, 5].map((t) => '<button type="button" class="fchip' + (tier === t ? ' on' : '') + '" data-t="' + t + '">' + esc(NEV.Gacha.RARITIES[t - 1].name) + ' · ' + esc(NEV.Ex.TIER_NAMES[t]) + '</button>').join('');
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
    const g = $('grid');
    const slice = view.slice(0, shown);
    if (append) {
      const from = g.children.length;
      g.insertAdjacentHTML('beforeend', slice.slice(from).map((e, i) => card(e, i)).join(''));
    } else {
      g.innerHTML = slice.map(card).join('');
    }
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
    order = a; refresh();
  }

  $('cats').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) { cat = b.dataset.c; chips(); refresh(); } });
  $('tiers').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { tier = +b.dataset.t; chips(); refresh(); } });
  $('q').addEventListener('input', (e) => { q = e.target.value; refresh(); });
  $('nomat').addEventListener('change', (e) => { nomat = e.target.checked; refresh(); });
  $('shuf').addEventListener('click', shuffle);
  $('more').addEventListener('click', () => { shown += PAGE; render(true); });
  $('grid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]'); if (!b) return;
    const ex = NEV.Ex.byId(b.dataset.open);
    NEV.ExModal.open(ex.id, user && ex.special !== 'repos' ? { startLabel: 'Faire une série libre', onStart: () => NEV.go('exercice.html?src=combo&id=' + encodeURIComponent('ex:' + ex.id)) } : {});
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { if (es[0].isIntersecting && !$('more').hidden) { shown += PAGE; render(true); } }, { rootMargin: '400px' }).observe($('more'));
  }
  const want = (location.hash || '').slice(1);
  if (want && NEV.Ex.byId(want)) setTimeout(() => NEV.ExModal.open(want, {}), 300);
  chips(); shuffle();
})();
