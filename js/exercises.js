/* ==========================================================
   neV.BOOSTER — exercises.js
   Réunit les fiches (ex-data.js) et les animations (ex-anim.js)
   dans NEV.EXERCISES, que lisent le gacha, la bibliothèque,
   l'exercice par caméra et l'espace admin.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const data = NEV.EX_DATA || [], anim = NEV.EX_ANIM || {};
  const TIER_NAMES = ['', 'Facile', 'Moyen', 'Costaud', 'Difficile', 'Extrême'];

  const list = data.map((e) => {
    const a = anim[e.id];
    return Object.assign({}, e, {
      anim: a || null,
      muscles: a ? a.muscles : [],
      cam: Object.assign({ place: NEV.CAM_PLACE[(e.cam || {}).view || 'any'] }, e.cam || {}),
      cam_ok: !!e.cam,
      tierName: TIER_NAMES[e.tier] || ''
    });
  });
  list.forEach((e) => { if (!e.anim) console.warn('[neV] animation manquante :', e.id); });

  const byId = {};
  list.forEach((e) => { byId[e.id] = e; });

  NEV.EXERCISES = list;
  NEV.Ex = {
    byId: (id) => byId[id] || null,
    list: () => list,
    inCat: (catId) => list.filter((e) => e.group === catId),
    TIER_NAMES,
    /* Texte « 3 séries de 12 rép. » pour un plan de séance */
    amountText(unit, per) {
      if (unit === 'sec') return per + ' s';
      if (unit === 'secside') return per + ' s par côté';
      if (unit === 'side') return per + ' par côté';
      return per + ' rép.';
    },
    equipText(e) { return (e.equip || []).length ? (e.equip || []).map((k) => NEV.EQUIP[k]).join(' + ') : 'Aucun matériel'; },
    musclesText(e) { return (e.muscles || []).map((m) => NEV.MUSCLES_FR[m]).filter(Boolean).join(', '); }
  };
})(window);
