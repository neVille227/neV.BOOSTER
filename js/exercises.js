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

  /* Qui voit quoi : la partie femme est un parcours à part (abdos, gainage, squats, fessiers, souplesse, buste et posture,
     repos actif). Aucune pompe ni exercice de bras ou de prise de masse ; les tractions sont des cartes mythiques réservées aux hommes. */
  const F_CARDIO = ['jumping-jacks', 'montees-genoux', 'talons-fesses', 'marche-genoux-hauts', 'pas-chasses', 'squat-pointes', 'saut-corde', 'skaters'];
  const F_DOS = ['superman', 'bird-dog', 'anges-inverses', 'retraction-omoplates', 'swimmer', 'pullover-sac'];
  const F_PECS = ['presse-paumes', 'developpe-bouteilles'];
  const F_BAN = ['v-ups', 'pistol-assiste'];
  function sexOk(e, sex) {
    if (sex !== 'f') return e.for !== 'f';
    if (e.for === 'm') return false;
    if (e.for === 'f') return e.group !== 'bras';
    const gp = e.group;
    if (gp === 'jambes' || gp === 'abdos') return e.tier <= 4 && F_BAN.indexOf(e.id) < 0;
    if (gp === 'mobilite') return !/^cou-|^menton|etirement-cou|rotations-epaules/.test(e.id);
    if (gp === 'cardio') return F_CARDIO.indexOf(e.id) >= 0;
    if (gp === 'pecs') return F_PECS.indexOf(e.id) >= 0;
    if (gp === 'dos') return F_DOS.indexOf(e.id) >= 0;
    return false;
  }

  /* Poids du joueur : à partir de 100 kg, le tirage évite les sauts et les exercices à fort impact ou qui demandent de soulever tout le poids du corps
     (tractions, pistol). Même niveau de cartes, mais des exercices qui ménagent les articulations. */
  const HEAVY_KG = 100;
  const HEAVY_BAN = /(^|-)(saut|saute|sauts|sautes)(-|$)|jumping|burpees|skaters|montees-genoux|talons-fesses|mountain|bear-crawl|pistol|claquees|v-ups|^tractions|saut-corde/;
  function weightOk(e, kg) { return !(Number(kg) >= HEAVY_KG) || !HEAVY_BAN.test(e.id); }

  NEV.EXERCISES = list;
  NEV.Ex = {
    byId: (id) => byId[id] || null,
    sexOk, weightOk, HEAVY_KG,
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
