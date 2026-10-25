/* neV.BOOSTER — Programmes : les 25 cartes d'entraînement à domicile */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, PR = NEV.Programmes;
  const ctx = await NEV.boot('programmes'); if (!ctx) return;
  const user = ctx.user, p = ctx.p;
  const hasEq = (ex) => (ex.equip || []).every((k) => !!(p.setup.equip && p.setup.equip[k]));
  const mine = Math.max(1, Math.min(5, p.level || 1));
  let cur = +((location.hash || '').replace('#n', '')) || mine;
  cur = Math.max(1, Math.min(5, cur));

  $('howto').innerHTML = '<h3 style="margin:0 0 6px">Comment utiliser les cartes</h3><ul>' +
    '<li>Choisis <b>une seule carte par séance</b>, adaptée à ton niveau. Ne fais pas les 25 dans la même semaine.</li>' +
    '<li>Arrête une série quand la technique se dégrade et garde 1 à 3 répétitions « en réserve ».</li>' +
    '<li>Repos : 45 à 90 s pour les exercices faciles, 90 à 150 s pour les exigeants.</li>' +
    '<li>Supports stables, sac bien fermé et charge légère au départ. Pas de tractions improvisées sur une table ou une porte.</li>' +
    '<li>Prévois des jours de récupération. Douleur vive ou vertige : arrête.</li></ul>' +
    '<p class="muted" style="margin:10px 0 0;font-size:.85rem">La caméra compte tes répétitions pendant la séance ; les nombres de séries viennent de la carte, les répétitions s\'adaptent à ton niveau.</p>';

  function tabs() {
    $('lv').innerHTML = PR.LEVELS.map((l) => '<button type="button" role="tab" class="fchip' + (cur === l.id ? ' on' : '') + '" aria-selected="' + (cur === l.id) + '" data-l="' + l.id + '">' + esc(l.name) + (l.id === mine ? '<small>★ ton niveau</small>' : '') + '</button>').join('');
    $('lvh').textContent = PR.LEVELS[cur - 1].hint;
  }
  function cardHtml(c) {
    const steps = NEV.Combos.steps(c, p, user);
    const miss = []; steps.forEach((s) => (s.ex.equip || []).filter((k) => !(p.setup.equip && p.setup.equip[k])).forEach((k) => { const m = NEV.EQUIP[k]; if (miss.indexOf(m) < 0) miss.push(m); }));
    return '<article class="cb"><div class="meta"><span class="chip red">Carte ' + c.n + '</span><span class="chip">≈ ' + NEV.Combos.minutes(c, p, user) + ' min</span><span class="chip">' + steps.length + ' exercices</span></div>' +
      '<h4>' + esc(c.title) + '</h4><p class="bl">' + esc(c.blurb) + '</p>' +
      '<ol>' + steps.map((s) => '<li><a href="bibliotheque.html#' + esc(s.ex.id) + '" data-go style="color:inherit">' + esc(s.ex.name) + '</a> <span>— ' + s.plan.sets + ' × ' + esc(NEV.Ex.amountText(s.plan.unit, s.plan.perSet)) + '</span></li>').join('') + '</ol>' +
      (miss.length ? '<p class="muted" style="margin:0;font-size:.78rem">⚠️ Il te faut : ' + esc(miss.join(', ')) + ' <a href="niveau.html?step=2" data-go style="color:var(--gold)">(régler mon matériel)</a></p>' : '') +
      '<div class="go"><a class="btn ok sm" href="exercice.html?src=combo&id=' + encodeURIComponent(c.id) + '" data-go' + (miss.length ? ' aria-disabled="true" style="opacity:.45;pointer-events:none"' : '') + '>Lancer cette carte</a></div></article>';
  }
  function render() {
    tabs();
    $('list').innerHTML = PR.list.filter((c) => c.lvlId === cur && NEV.Combos.valid(c)).map(cardHtml).join('');
  }
  $('lv').addEventListener('click', (e) => { const b = e.target.closest('[data-l]'); if (b) { cur = +b.dataset.l; history.replaceState(null, '', '#n' + cur); render(); } });
  render();
})();
