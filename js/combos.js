/* ==========================================================
   neV.BOOSTER — combos.js
   Registre unique des enchaînements (combos) :
   - ceux de la Spécialisation (zones.js),
   - ceux du coach (créés dans l'espace admin, NEV.cfg.combos),
   - les programmes de l'utilisateur (programmes.js, s'il est chargé).
   Format : { id, name, lvl, blurb, items: [[idExercice, séries], …] }
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const extra = [];

  function coach() { return ((NEV.cfg && NEV.cfg.combos) || []).filter((c) => c && c.id && Array.isArray(c.items)); }

  const Combos = {
    /* Ajoute des enchaînements (ex. les programmes). */
    register(list) { (list || []).forEach((c) => { if (c && c.id && !extra.some((x) => x.id === c.id)) extra.push(c); }); },
    all() {
      const z = NEV.Zones ? NEV.Zones.allCombos() : [];
      return coach().map((c) => Object.assign({ coach: true }, c)).concat(z, extra);
    },
    get(id) {
      if (typeof id === 'string' && id.indexOf('ex:') === 0) { // série libre d'un seul exercice (depuis la bibliothèque)
        const ex = NEV.Ex.byId(id.slice(3)); if (!ex) return null;
        return { id, name: ex.name, lvl: ex.tierName, blurb: 'Une série libre : ' + ex.name + '.', items: [[ex.id, 3]], free: true };
      }
      return Combos.all().find((c) => c.id === id) || null;
    },
    /* Un combo valide = tous ses exercices existent. */
    valid(c) { return !!c && c.items.length > 0 && c.items.every((it) => NEV.Ex.byId(it[0])); },
    /* Le plan complet d'un combo pour ce joueur : une étape par exercice. */
    steps(c, p, user) {
      const cautious = false;
      return c.items.map((it) => {
        const ex = NEV.Ex.byId(it[0]); if (!ex) return null;
        const pl = NEV.Gacha.plan(ex, p, false, cautious);
        const sets = Math.max(1, Math.min(6, Math.round(it[1]) || 3));
        const mult = (pl.unit === 'side' || pl.unit === 'secside') ? 2 : 1;
        return { ex, plan: Object.assign(pl, { sets, total: pl.perSet * sets * mult }) };
      }).filter(Boolean);
    },
    /* Minutes approximatives. */
    minutes(c, p, user) {
      let s = 0;
      Combos.steps(c, p, user).forEach((st) => {
        const per = (st.plan.unit === 'sec' || st.plan.unit === 'secside') ? st.plan.perSet * (st.plan.unit === 'secside' ? 2 : 1) : st.plan.perSet * (st.plan.unit === 'side' ? 2 : 1) * 3.2;
        s += st.plan.sets * (per + st.plan.rest) + 20;
      });
      return Math.max(3, Math.round(s / 60));
    }
  };
  NEV.Combos = Combos;
})(window);
