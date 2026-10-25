/* ==========================================================
   neV.BOOSTER — card.js
   Les cartes : dos, face (selon la rareté), inclinaison holographique.
   Utilisées par le gacha, la quête, les programmes et la bibliothèque.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const esc = NEV.util.esc;
  const stars = (n) => '★'.repeat(n) + '<s>' + '★'.repeat(5 - n) + '</s>';

  const rarityOf = (ex) => NEV.Gacha.RARITIES[Math.max(0, Math.min(4, (ex.tier || 1) - 1))];
  const starsOf = (r) => r.special ? '<b class="sp">✦ ✦ ✦</b>' : stars(r.stars);
  
  /* Face d'une carte. o : { plan, tier, tagsMax, noArt } */
  function front(ex, o) {
    o = o || {};
    const r = o.special ? NEV.Gacha.SPECIALS[o.special] : (o.tier ? NEV.Gacha.RARITIES[o.tier - 1] : rarityOf(ex));
    const tags = (ex.muscles || []).slice(0, o.tagsMax || 3).map((m) => '<span>' + esc(NEV.MUSCLES_FR[m] || m) + '</span>').join('');
    let plan = '';
    if (o.plan) plan = '<div class="tc-plan"><b>' + o.plan.sets + '</b> séries × <b>' + NEV.Ex.amountText(o.plan.unit, o.plan.perSet) + '</b>' + (o.plan.doubled ? ' <em>×2</em>' : '') + '</div>';
    return '<div class="tcard r-' + r.id + (r.tier >= 3 || r.special ? ' foil' : '') + (r.special ? ' special' : '') + '" style="--c:' + r.color + ';--c2:' + r.color2 + ';--g:' + r.glow + '" data-ex="' + esc(ex.id) + '">' +
      '<div class="tc-in"><div class="tc-top"><span class="tc-code">' + r.code + '</span><span class="tc-stars" aria-label="' + r.name + '">' + stars(r.stars) + '</span></div>' +
      (o.noArt ? '' : '<div class="tc-art"><div class="tc-fig" data-fig="' + esc(ex.id) + '"></div></div>') +
      '<div class="tc-name">' + esc(ex.name) + '</div>' +
      '<div class="tc-tags">' + tags + '</div>' + plan +
      '<div class="tc-foot"><span>' + esc(r.special ? 'Spéciale · ' + r.name : r.name) + '</span><span>neV.BOOSTER</span></div>' +
      '<i class="tc-glare" aria-hidden="true"></i></div></div>';
  }

  function back() {
    return '<div class="tcard back"><div class="tc-in"><svg viewBox="0 0 100 140" aria-hidden="true">' +
      '<defs><linearGradient id="cbG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d58a"/><stop offset="1" stop-color="#c07a1c"/></linearGradient></defs>' +
      '<g fill="none" stroke="#e0455f" stroke-opacity=".22" stroke-width=".8">' + (function () { let d = ''; for (let i = -14; i < 16; i++) d += '<path d="M' + (i * 10) + ' 0L' + (i * 10 + 140) + ' 140"/>'; return d; })() + '</g>' +
      '<circle cx="50" cy="70" r="30" fill="#2a0a14" stroke="url(#cbG)" stroke-width="2.2"/><circle cx="50" cy="70" r="24" fill="none" stroke="#e0455f" stroke-width="1" stroke-dasharray="2 3"/>' +
      '<path d="M32 86V56l12 22 6-12 6 12 12-22v30" fill="none" stroke="url(#cbG)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="50" y="122" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="900" font-size="8" letter-spacing="2" fill="#f6d58a">neV.BOOSTER</text></svg><i class="tc-sheen"></i></div></div>';
  }

  /* Monte les figures animées d'une zone. */
  function mountArt(root, opts) {
    const out = [];
    root.querySelectorAll('.tc-fig[data-fig]').forEach(function (el) {
      if (el.dataset.mounted) return;
      const ex = NEV.Ex.byId(el.dataset.fig);
      if (ex && NEV.Figure) { el.dataset.mounted = '1'; out.push(NEV.Figure.mount(el, ex, Object.assign({ label: ex.name }, opts || {}))); }
    });
    return out;
  }

  /* Reflet holographique qui suit le doigt / la souris. */
  function tilt(el, max) {
    max = max || 12;
    if (NEV.util.reduced()) return function () {};
    const c = el.querySelector('.tcard') || el;
    function mv(e) {
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      c.style.setProperty('--rx', ((0.5 - y) * max * 2).toFixed(1) + 'deg');
      c.style.setProperty('--ry', ((x - 0.5) * max * 2).toFixed(1) + 'deg');
      c.style.setProperty('--mx', (x * 100).toFixed(0) + '%'); c.style.setProperty('--my', (y * 100).toFixed(0) + '%');
      c.classList.add('tilting');
    }
    function lv() { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); c.classList.remove('tilting'); }
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv);
    return function () { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv); };
  }

  /* Raccourci : la face d'une carte enregistrée (carte du jour, carte de Spécialisation, historique). */
  function ofCard(card, o) { const ex = NEV.Ex.byId(card.id); return ex ? front(ex, Object.assign({ plan: card.plan, tier: card.tier, special: card.special || null }, o || {})) : ''; }

  NEV.Card = { front, back, mountArt, tilt, rarityOf, ofCard };
})(window);
