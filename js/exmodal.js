/* ==========================================================
   neV.BOOSTER — exmodal.js
   La fiche détaillée d'un exercice (figure animée, étapes, erreurs, variantes).
   Utilisée par la Spécialisation, la bibliothèque et les programmes.
   NEV.ExModal.open(idExercice, { plan, onStart })
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const doc = g.document, esc = NEV.util.esc;
  let root = null, ctl = null, lastFocus = null;

  function build() {
    root = doc.createElement('div');
    root.className = 'modal xm'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Fiche de l\'exercice');
    root.innerHTML = '<div class="box xm-box"><button type="button" class="xm-x" aria-label="Fermer">×</button><div class="xm-in"></div></div>';
    doc.body.appendChild(root);
    root.addEventListener('click', (e) => { if (e.target === root || e.target.closest('.xm-x') || e.target.closest('[data-xm-close]')) close(); });
    doc.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('open')) close(); });
  }

  function chips(ex) {
    const out = [];
    const r = NEV.Gacha.RARITIES[Math.max(0, Math.min(4, (ex.tier || 1) - 1))];
    out.push('<span class="chip red">' + esc(r.name) + ' · ' + esc(ex.tierName || '') + '</span>');
    const m = NEV.Ex.musclesText(ex); if (m) out.push('<span class="chip">' + esc(m) + '</span>');
    out.push('<span class="chip">' + esc(NEV.Ex.equipText(ex)) + '</span>');
    NEV.Zones && NEV.Zones.zonesOf(ex.id).slice(0, 3).forEach((z) => out.push('<span class="chip gold">' + esc(NEV.Zones.get(z).name) + '</span>'));
    return out.join('');
  }

  function open(id, o) {
    o = o || {};
    const ex = NEV.Ex.byId(id); if (!ex) return;
    if (!root) build();
    if (ctl) { ctl.destroy(); ctl = null; }
    lastFocus = doc.activeElement;
    const list = (a) => (a && a.length ? '<ul>' + a.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '');
    const base = ex.base ? ex.base.map((n, i) => 'Niv. ' + (i + 1) + ' : ' + NEV.Ex.amountText(ex.unit, n)).join(' · ') : '';
    root.querySelector('.xm-in').innerHTML =
      '<div class="xm-grid"><div class="xm-fig"><div class="xm-demo" id="xmDemo"></div>' +
      '<p class="muted xm-note">' + esc((ex.cam && ex.cam.place) || '') + '</p></div>' +
      '<div class="xm-txt"><div class="eyebrow">' + esc((NEV.CATS.find((c) => c.id === ex.group) || {}).name || 'Exercice') + '</div>' +
      '<h2>' + esc(ex.name) + '</h2><div class="xm-chips">' + chips(ex) + '</div>' +
      (ex.warn ? '<div class="xr-warn' + (ex.special === 'tractions' ? ' strong' : '') + '">⚠️ ' + esc(ex.warn) + '</div>' : '') +
      (ex.exec ? '<p class="xm-exec">' + esc(ex.exec) + '</p>' : '') +
      (ex.steps && ex.steps.length ? '<h3>Comment faire</h3><ol>' + ex.steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>' : '') +
      (ex.mistakes && ex.mistakes.length ? '<h3>Erreurs à éviter</h3>' + list(ex.mistakes) : '') +
      '<div class="xm-vars">' + (ex.easy ? '<div><b>Plus facile</b><span>' + esc(ex.easy) + '</span></div>' : '') + (ex.hard ? '<div><b>Plus difficile</b><span>' + esc(ex.hard) + '</span></div>' : '') + '</div>' +
      (ex.dose ? '<p class="muted" style="margin:10px 0 0"><b>Dose conseillée :</b> ' + esc(ex.dose) + '</p>' : '') +
      (base ? '<p class="muted" style="margin:4px 0 12px;font-size:.8rem">' + esc(base) + '</p>' : '') +
      '<div class="xr-actions">' + (o.onStart ? '<button type="button" class="btn ok" id="xmStart">' + esc(o.startLabel || 'Choisir cet exercice') + '</button>' : '') + '<button type="button" class="btn ghost" data-xm-close>Fermer</button></div>' +
      '</div></div>';
    ctl = NEV.Figure.mount(root.querySelector('#xmDemo'), ex, {});
    const st = root.querySelector('#xmStart'); if (st) st.onclick = () => { close(); o.onStart(ex); };
    root.classList.add('open'); doc.body.style.overflow = 'hidden';
    const x = root.querySelector('.xm-x'); if (x) x.focus();
  }

  function close() {
    if (!root) return;
    root.classList.remove('open'); doc.body.style.overflow = '';
    if (ctl) { ctl.destroy(); ctl = null; }
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* ignoré */ } }
  }

  NEV.ExModal = { open, close };
})(window);
