/* neV.BOOSTER — page Spécialisation
   La vision (tout le corps, rien d'imposé) puis les zones : exercices, combinaisons, gacha. */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, Z = NEV.Zones;
  const ctx = await NEV.boot('specialisation'); if (!ctx) return;
  const user = ctx.user, p = ctx.p;
  NEV.player.ensureDay(p); NEV.player.save(p);
  const hasEq = (ex) => (ex.equip || []).every((k) => !!(p.setup.equip && p.setup.equip[k]));
  const missEq = (ex) => (ex.equip || []).filter((k) => !(p.setup.equip && p.setup.equip[k])).map((k) => NEV.EQUIP[k]);

  /* ---------- la vision, tout en haut ---------- */
  const V = Z.VISION;
  $('vision').innerHTML = '<div class="eyebrow">À lire d\'abord</div><h2 id="visTitle">' + esc(V.title) + '</h2><p>' + esc(V.text) + '</p><ul>' + V.points.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>';

  /* ---------- sélection ---------- */
  let cur = (location.hash || '').slice(1);
  if (cur !== 'all' && !Z.get(cur)) cur = p.spe.zone && Z.get(p.spe.zone) ? p.spe.zone : 'all';
  const prio = () => p.setup.zones || (p.setup.zones = []);

  const map = NEV.BodyMap.mount($('bmap'), { selected: cur, onPick: (id) => pick(id) });
  function renderChips() {
    $('zchips').innerHTML = '<button type="button" class="zchip all' + (cur === 'all' ? ' on' : '') + '" data-z="all"><div><b>Corps entier</b><br><span>Tout le corps, comme le gacha du jour</span></div><span>' + Z.list().length + ' zones</span></button>' +
      Z.list().map((z) => '<button type="button" class="zchip' + (cur === z.id ? ' on' : '') + '" data-z="' + z.id + '" aria-pressed="' + (cur === z.id) + '"><b>' + esc(z.name) + (prio().indexOf(z.id) >= 0 ? '<i class="star" title="Zone prioritaire">★</i>' : '') + '</b><span>' + z.ex.length + ' exercices · ' + z.combos.length + ' combos</span></button>').join('');
  }
  $('zchips').addEventListener('click', (e) => { const b = e.target.closest('.zchip'); if (b) pick(b.dataset.z); });
  function pick(id) {
    cur = id; history.replaceState(null, '', '#' + id);
    map.select(id); renderChips(); renderPanel();
    if (NEV.util && !NEV.util.reduced()) $('zpanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- bloc « mon tirage Spécialisation du jour » ---------- */
  function todayBlock(zone) {
    const sp = p.spe, si = NEV.Gacha.specialInfo(p, { mode: 'spe' });
    let h = '<div class="ztoday"><h3>Ton gacha Spécialisation du jour</h3>';
    if (sp.card && sp.status === 'done') {
      h += '<p class="muted" style="margin:0 0 6px">✅ Carte validée : <b>' + esc(sp.card.name) + '</b> (+' + ((sp.result && sp.result.xpGain) || 0) + ' XP). Reviens demain pour un nouveau tirage.</p>';
    } else if (sp.card) {
      h += '<p style="margin:0 0 10px">Tu as tiré <b>' + esc(sp.card.name) + '</b>' + (sp.zone && sp.zone !== 'all' && Z.get(sp.zone) ? ' (' + esc(Z.get(sp.zone).name) + ')' : '') + '. Il te reste à la faire.</p><a class="btn ok sm" href="exercice.html?src=spe" data-go>Lancer l\'exercice</a>';
    } else {
      h += '<p class="muted" style="margin:0 0 10px">Un tirage bonus par jour, dans la zone de ton choix. Tu peux aussi garder uniquement le gacha du jour : rien n\'est obligatoire.</p>' +
        '<a class="btn sm" href="gacha.html?mode=spe&zone=' + encodeURIComponent(zone ? zone.id : 'all') + '" data-go>' + (zone ? 'Tirer ma carte « ' + esc(zone.name) + ' »' : 'Tirer ma carte corps entier') + '</a>';
    }
    h += '<p class="muted" style="margin:10px 0 0;font-size:.78rem">✦ Cartes spéciales <b>Repos</b>' + (si.tractionsOk ? ' et <b>Tractions</b>' : '') + ' : ' + (si.unlocked ? '<b>' + si.pct + ' %</b> de chance (tu t\'es entraîné ' + si.days + ' jours sur ' + si.window + ').' : si.days + '/' + si.need + ' jours d\'entraînement sur ' + si.window + ' pour passer de 5 % à 40 %.') + '</p></div>';
    return h;
  }

  /* ---------- exercices et combos ---------- */
  function exGrid(list) {
    return '<div class="xg">' + list.map((ex) => {
      const miss = missEq(ex);
      const badge = (ex.equip || []).length ? '<span class="miss' + (miss.length ? '' : ' ok') + '">' + (miss.length ? 'Il te faut : ' + esc(miss.join(', ')) : 'Matériel OK') + '</span>' : '';
      return '<button type="button" class="xcard" data-open="' + esc(ex.id) + '" aria-label="Voir la fiche : ' + esc(ex.name) + '">' + NEV.Card.front(ex, {}) + badge + '</button>';
    }).join('') + '</div>';
  }
  function comboCard(c) {
    const steps = NEV.Combos.steps(c, p, user);
    const miss = []; steps.forEach((s) => missEq(s.ex).forEach((m) => { if (miss.indexOf(m) < 0) miss.push(m); }));
    return '<article class="cb"><div class="meta">' + (c.lvl ? '<span class="chip red">' + esc(c.lvl) + '</span>' : '') + '<span class="chip">≈ ' + NEV.Combos.minutes(c, p, user) + ' min</span><span class="chip">' + steps.length + ' exercices</span>' + (c.coach ? '<span class="chip gold">Coach</span>' : '') + '</div>' +
      '<h4>' + esc(c.name) + '</h4><p class="bl">' + esc(c.blurb || '') + '</p>' +
      '<ol>' + steps.map((s) => '<li>' + esc(s.ex.name) + ' <span>— ' + s.plan.sets + ' × ' + esc(NEV.Ex.amountText(s.plan.unit, s.plan.perSet)) + '</span></li>').join('') + '</ol>' +
      (miss.length ? '<p class="muted" style="margin:0;font-size:.78rem">⚠️ Il te faut : ' + esc(miss.join(', ')) + ' <a href="niveau.html?step=2" data-go style="color:var(--gold)">(régler mon matériel)</a></p>' : '') +
      '<div class="go"><a class="btn ok sm" href="exercice.html?src=combo&id=' + encodeURIComponent(c.id) + '" data-go' + (miss.length ? ' aria-disabled="true" style="opacity:.45;pointer-events:none"' : '') + '>Lancer ce combo</a></div></article>';
  }

  function renderPanel() {
    const z = Z.get(cur), root = $('zpanel');
    if (!z) { // corps entier
      const coach = ((NEV.cfg && NEV.cfg.combos) || []).filter((c) => NEV.Combos.valid(c));
      root.innerHTML = '<div class="zhead"><div><div class="eyebrow">Corps entier</div><h2>Tout le corps, tout le temps</h2><p>Le gacha du jour tire déjà dans tout le corps. Ici, tu peux ajouter un tirage bonus sans zone, ou marquer jusqu\'à <b>3 zones prioritaires</b> (★) pour qu\'elles sortent plus souvent dans ton gacha du jour.</p>' +
        '<p class="muted">Tes zones prioritaires : ' + (prio().length ? prio().map((id) => '<span class="chip gold">' + esc(Z.get(id) ? Z.get(id).name : id) + '</span>').join(' ') : 'aucune pour l\'instant.') + '</p></div>' + todayBlock(null) + '</div>' +
        (coach.length ? '<h3 class="sec-t">Les combinaisons du coach</h3><p class="sec-s">Créées par l\'admin du site, mises à jour régulièrement.</p><div class="cbs">' + coach.map(comboCard).join('') + '</div>' : '') +
        '<h3 class="sec-t">Une combinaison par zone</h3><p class="sec-s">Un aperçu : ouvre une zone pour voir toutes ses combinaisons.</p><div class="cbs">' + Z.list().slice(0, 6).map((zz) => comboCard(zz.combos[0])).join('') + '</div>';
      NEV.Card.mountArt(root);
      return;
    }
    const isPrio = prio().indexOf(z.id) >= 0;
    root.innerHTML = '<div class="zhead"><div><div class="eyebrow">Zone</div><h2>' + esc(z.name) + '</h2><p>' + esc(z.desc) + '</p><p class="muted"><b>Comment on la travaille :</b> ' + esc(z.how) + '</p>' +
      '<div class="callout warn"><span class="ci">⚠️</span><p>' + esc(z.care) + '</p></div>' +
      '<div class="zbar"><a class="btn" href="gacha.html?mode=spe&zone=' + encodeURIComponent(z.id) + '" data-go id="zDraw">Gacha « ' + esc(z.name) + ' »</a>' +
      '<button type="button" class="btn ghost" id="zPrio" aria-pressed="' + isPrio + '">' + (isPrio ? '★ Zone prioritaire (retirer)' : '☆ En faire une zone prioritaire') + '</button></div></div>' + todayBlock(z) + '</div>' +
      '<h3 class="sec-t">Les exercices de la zone</h3><p class="sec-s">' + z.ex.length + ' exercices. Touche une carte pour voir la fiche et l\'animation.</p>' + exGrid(Z.exercises(z.id)) +
      '<h3 class="sec-t">Les combinaisons proposées</h3><p class="sec-s">Des enchaînements prêts à lancer, avec la caméra. Les séries s\'adaptent à ton niveau.</p><div class="cbs">' + z.combos.map(comboCard).join('') + '</div>';
    NEV.Card.mountArt(root);
    root.querySelectorAll('.xg .xcard').forEach((el) => NEV.Card.tilt(el, 8));
    $('zPrio').onclick = () => {
      const arr = prio(), i = arr.indexOf(z.id);
      if (i >= 0) arr.splice(i, 1);
      else if (arr.length >= 3) { NEV.ui.toast('Tu as déjà 3 zones prioritaires : retires-en une d\'abord.'); return; }
      else arr.push(z.id);
      NEV.player.save(p); renderChips(); renderPanel();
      NEV.ui.toast(i >= 0 ? z.name + ' n\'est plus prioritaire.' : z.name + ' sortira plus souvent dans ton gacha du jour.');
    };
  }
  $('zpanel').addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]'); if (!b) return;
    const ex = NEV.Ex.byId(b.dataset.open); if (!ex) return;
    NEV.ExModal.open(ex.id, { onStart: ex.special === 'repos' ? null : () => NEV.go('exercice.html?src=combo&id=' + encodeURIComponent('ex:' + ex.id)), startLabel: 'Faire une série libre' });
  });

  renderChips(); renderPanel();
  window.addEventListener('hashchange', () => { const h = (location.hash || '').slice(1); if (h && h !== cur && (h === 'all' || Z.get(h))) { cur = h; map.select(h); renderChips(); renderPanel(); } });
})();
