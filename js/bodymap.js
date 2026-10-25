/* ==========================================================
   neV.BOOSTER — bodymap.js
   La carte du corps (face + dos) : on touche une zone pour la choisir.
   NEV.BodyMap.mount(el, { onPick(zoneId), selected })  → { select(zoneId) }
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});

  function fig(cx, back) {
    const R = (x, y, w, h, rx, z) => '<rect class="' + (z ? 'bz' : 'body') + '"' + (z ? ' data-z="' + z + '"' : '') + ' x="' + (cx + x) + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '"/>';
    const C = (x, y, r, z) => '<circle class="' + (z ? 'bz' : 'body') + '"' + (z ? ' data-z="' + z + '"' : '') + ' cx="' + (cx + x) + '" cy="' + y + '" r="' + r + '"/>';
    let s = C(0, 28, 19) + R(-8, 46, 16, 14, 6, 'cou');
    s += C(-37, 76, 13, 'epaules') + C(37, 76, 13, 'epaules');
    if (!back) {
      s += R(-31, 68, 29, 34, 11, 'poitrine') + R(2, 68, 29, 34, 11, 'poitrine');
      s += R(-15, 106, 30, 52, 9, 'abdos');
      s += R(-31, 108, 13, 50, 6, 'obliques') + R(18, 108, 13, 50, 6, 'obliques');
    } else {
      s += R(-22, 68, 44, 38, 10, 'dos');
      s += R(-37, 94, 14, 42, 6, 'dorsaux') + R(23, 94, 14, 42, 6, 'dorsaux');
      s += R(-14, 112, 28, 36, 8, 'lombaires');
    }
    s += R(-55, 90, 14, 44, 7, 'bras') + R(41, 90, 14, 44, 7, 'bras');
    s += R(-59, 138, 12, 44, 6, 'avantbras') + R(47, 138, 12, 44, 6, 'avantbras');
    s += C(-53, 194, 8, 'doigts') + C(53, 194, 8, 'doigts');
    s += R(-29, 160, 58, 20, 10);
    if (back) s += C(-14, 168, 16, 'fessiers') + C(14, 168, 16, 'fessiers');
    s += R(-29, 184, 26, 64, 11, 'cuisses') + R(3, 184, 26, 64, 11, 'cuisses');
    s += R(-26, 252, 19, 66, 9, 'mollets') + R(7, 252, 19, 66, 9, 'mollets');
    s += '<ellipse class="body" cx="' + (cx - 17) + '" cy="326" rx="12" ry="5"/><ellipse class="body" cx="' + (cx + 17) + '" cy="326" rx="12" ry="5"/>';
    return s + '<text class="cap" x="' + cx + '" y="348">' + (back ? 'Dos' : 'Face') + '</text>';
  }

  function mount(el, o) {
    o = o || {};
    el.innerHTML = '<svg viewBox="0 0 400 356" aria-hidden="true" focusable="false"><defs><linearGradient id="bzOn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a3d"/><stop offset="1" stop-color="#e0455f"/></linearGradient></defs>' + fig(100, false) + fig(300, true) + '</svg>';
    const sync = (id) => el.querySelectorAll('.bz').forEach((n) => n.classList.toggle('on', n.dataset.z === id));
    el.addEventListener('click', (e) => { const n = e.target.closest('.bz'); if (n && o.onPick) o.onPick(n.dataset.z); });
    sync(o.selected);
    return { select: sync };
  }
  NEV.BodyMap = { mount };
})(window);
