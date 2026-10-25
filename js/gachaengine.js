/* ==========================================================
   neV.BOOSTER — gachaengine.js
   Le moteur du tirage. Un seul endroit décide du hasard :
   - raretés pondérées selon le niveau du joueur,
   - garantie « Épique » si trop de jours sans carte forte,
   - aucune répétition des 3 derniers exercices,
   - cartes SPÉCIALES « Repos » et « Tractions » (très rares),
   - hasard du navigateur (crypto.getRandomValues), pas Math.random().
   Deux systèmes de tirage utilisent ce moteur :
   - le gacha du jour       : draw(p, user)
   - le gacha Spécialisation : draw(p, user, { mode: 'spe', zone })
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const rng = NEV.rng, util = NEV.util;

  const RARITIES = [
    { id: 'commun', tier: 1, name: 'Commun', code: 'N', color: '#c9ccd2', color2: '#6b707a', glow: '#b4b8c0', stars: 1 },
    { id: 'rare', tier: 2, name: 'Rare', code: 'R', color: '#b98cff', color2: '#5b21b6', glow: '#9b5cff', stars: 2 },
    { id: 'epique', tier: 3, name: 'Épique', code: 'SR', color: '#ff5ccb', color2: '#a3157a', glow: '#ff2db4', stars: 3 },
    { id: 'legendaire', tier: 4, name: 'Légendaire', code: 'UR', color: '#ffd84a', color2: '#b8860b', glow: '#ffc400', stars: 4 },
    { id: 'mythique', tier: 5, name: 'Mythique', code: 'MR', color: '#ff4040', color2: '#8a0a16', glow: '#ff1f2d', stars: 5 }
  ];

  /* Cartes spéciales : une couleur à part, jamais celle d'une rareté normale. */
  const SPECIALS = {
    repos: { id: 'repos', special: true, tier: 1, name: 'Repos', code: 'SP', color: '#ffffff', color2: '#ff2400', glow: '#ff2400', stars: 0, label: 'Carte spéciale · Repos' },
    tractions: { id: 'tractions', special: true, tier: 4, name: 'Tractions', code: 'SP', color: '#ffffff', color2: '#ff2400', glow: '#ff2400', stars: 0, label: 'Carte spéciale · Tractions' }
  };

  // Poids (en %) par niveau du joueur : plus on est fort, plus les cartes fortes sortent.
  const WEIGHTS = {
    1: [64, 27, 7.5, 1.4, 0.1],
    2: [52, 31, 12.5, 4, 0.5],
    3: [40, 32, 19, 7.5, 1.5],
    4: [28, 31, 25, 12.5, 3.5],
    5: [18, 28, 29, 18, 7]
  };
  const PITY_SOFT = 4, PITY_HARD = 7, CARDS_ON_TABLE = 5, REST_SEC = { 1: 45, 2: 40, 3: 35, 4: 30, 5: 30 };

  /* Cartes spéciales : il faut s'être entraîné au moins `minDays` jours sur les `window`
     derniers jours pour passer de 5 % à 40 % de chance. Réglable depuis l'admin (NEV.cfg.special). */
  const SPECIAL_RULE = { minDays: 4, window: 7, high: 0.4, low: 0.05, reposShare: 0.55, restSec: 90 };
  const rule = () => Object.assign({}, SPECIAL_RULE, (NEV.cfg && NEV.cfg.special) || {});
  const ZONE_BIAS = 0.5; // part des tirages du jour qui visent tes zones prioritaires

  function weights(level, cautious, pity) {
    const w = (WEIGHTS[level] || WEIGHTS[1]).slice();
    if (cautious) { w[3] = 0; w[4] = 0; }
    if (pity >= PITY_SOFT) {
      const boost = 1 + 0.6 * (pity - PITY_SOFT + 1);
      for (let i = 2; i < 5; i++) w[i] *= boost;
    }
    if (pity >= PITY_HARD) { w[0] = 0; w[1] = 0; }
    const t = w.reduce((a, b) => a + b, 0);
    return { raw: w, pct: w.map((x) => (x / t) * 100) };
  }

  const FOCUS_GROUPS = {
    equilibre: null,
    haut: ['pecs', 'dos', 'bras'],
    jambes: ['jambes'],
    gainage: ['abdos']
  };

  /* Un exercice peut-il sortir ? opts.zone : tirage de Spécialisation (mobilité autorisée). */
  function eligible(ex, setup, opts) {
    opts = opts || {};
    if (ex.special) return false; // Repos et Tractions ne sortent que par les cartes spéciales
    const gachaOk = ex.gacha !== false || (opts.zone && ex.group === 'mobilite');
    if (!gachaOk || !ex.cam) return false;
    if (ex.zoneOnly && !opts.zone && !((setup.zones || []).some((z) => NEV.Zones && NEV.Zones.get(z) && NEV.Zones.get(z).ex.indexOf(ex.id) >= 0))) return false;
    const eq = setup.equip || {};
    return (ex.equip || []).every((k) => !!eq[k]);
  }

  function plan(ex, p, double, cautious) {
    const L = p.level || 1;
    const x = p.maxPushups || 10;
    let per = ex.base ? ex.base[L - 1] : 10;
    if (ex.fromMax) per = util.clamp(Math.round(x * ex.fromMax), ex.fromMin || 3, ex.fromCap || 80);
    let sets = util.clamp(p.setup.sets || 3, 2, 4);
    if (double) sets = cautious ? sets + Math.ceil(sets / 2) : sets * 2;
    const unit = ex.unit || 'rep';
    const mult = (unit === 'side' || unit === 'secside') ? 2 : 1;
    return { unit, perSet: per, sets, rest: REST_SEC[L] || 40, total: per * sets * mult, doubled: !!double };
  }

  /* ---------- cartes spéciales ---------- */
  function trainingDays(p, today) {
    today = today || util.todayStr();
    const w = rule().window, seen = {};
    (p.history || []).forEach((h) => {
      if (h.rest) return;
      const d = util.daysBetween(h.date, today);
      if (d >= 0 && d < w) seen[h.date] = 1;
    });
    return Object.keys(seen).length;
  }

  const hasBar = (p) => !!(p.setup.equip && (p.setup.equip.bar || p.setup.equip.table));

  /* Situation actuelle du joueur face aux cartes spéciales (affichée dans l'interface). */
  function specialInfo(p, opts) {
    opts = opts || {};
    const R = rule(), today = util.todayStr();
    const days = trainingDays(p, today);
    const chance = days >= R.minDays ? R.high : R.low;
    const last = p.progress.lastDone;
    const double = !!(p.daily && p.daily.double && p.daily.status !== 'done');
    const dailyDone = !!(p.daily && p.daily.status === 'done');
    const prev = (p.history || [])[0];
    const lastCardRest = (p.daily && p.daily.card && p.daily.card.special === 'repos') || (opts.mode === 'spe' && p.spe && p.spe.card && p.spe.card.special === 'repos');
    // Repos : seulement si tu t'es entraîné hier ou aujourd'hui, jamais un jour doublé, jamais deux fois d'affilée.
    const reposOk = !double && !!last && util.daysBetween(last, today) <= 1 && !(prev && prev.rest && util.daysBetween(prev.date, today) <= 1) && !lastCardRest && !(opts.mode === 'spe' && dailyDone);
    const tractionsOk = hasBar(p);
    return { days, need: R.minDays, window: R.window, chance, pct: Math.round(chance * 100), unlocked: days >= R.minDays, reposOk, tractionsOk, double };
  }

  function pickTractions(p) {
    const eq = p.setup.equip || {};
    const ids = [];
    if (eq.bar) ids.push('tractions', 'tractions-supination');
    if (eq.table) ids.push('tractions-inversees');
    const hist = (p.history || []).slice(0, 2).map((h) => h.id);
    const fresh = ids.filter((i) => hist.indexOf(i) < 0);
    return NEV.Ex.byId(rng.pick(fresh.length ? fresh : ids));
  }

  /* Lance le dé des cartes spéciales. Renvoie null (pas de carte spéciale) ou le type. */
  function rollSpecial(p, opts) {
    const info = specialInfo(p, opts);
    if (rng.float() >= info.chance) return null;
    const R = rule();
    const kinds = [];
    if (info.reposOk) kinds.push(['repos', R.reposShare]);
    if (info.tractionsOk) kinds.push(['tractions', 1 - R.reposShare]);
    if (!kinds.length) return null;
    return kinds[rng.weighted(kinds.map((k) => k[1]))][0];
  }

  /* Tire la carte. Ne sauvegarde rien : c'est ensureCard qui le fait. */
  function draw(p, user, opts) {
    opts = opts || {};
    const mode = opts.mode === 'spe' ? 'spe' : 'daily';
    const zoneId = mode === 'spe' && opts.zone && opts.zone !== 'all' ? opts.zone : null;
    const cautious = false; // plus de restriction d'âge : toutes les raretés peuvent sortir
    const lvl = p.level || 1;
    const double = !!(p.daily && p.daily.double);
    const base = { drawnAt: Date.now(), table: CARDS_ON_TABLE, pick: rng.int(CARDS_ON_TABLE), mode, zone: zoneId };

    /* 1) carte spéciale ? */
    const sp = rollSpecial(p, { mode });
    if (sp) {
      const S = SPECIALS[sp];
      if (sp === 'repos') {
        const ex = NEV.Ex.byId('repos-actif'), sec = rule().restSec;
        return Object.assign(base, {
          id: ex.id, name: 'Repos', group: ex.group, tier: S.tier, rarity: 'repos', rarityName: 'Spéciale', special: 'repos',
          plan: { unit: 'sec', perSet: sec, sets: 1, rest: 0, total: sec, doubled: false },
          audit: { special: true, days: trainingDays(p), chance: specialInfo(p, { mode }).chance }
        });
      }
      const ex = pickTractions(p), pl = plan(ex, p, double, cautious);
      if (double) { // les tractions sont dures : une journée ratée ajoute 2 séries au lieu de doubler
        pl.sets = Math.min(pl.sets, util.clamp(p.setup.sets || 3, 2, 4) + 2); pl.total = pl.perSet * pl.sets;
      }
      return Object.assign(base, {
        id: ex.id, name: ex.name, group: ex.group, tier: S.tier, rarity: 'tractions', rarityName: 'Spéciale', special: 'tractions',
        plan: pl, audit: { special: true, days: trainingDays(p), chance: specialInfo(p, { mode }).chance }
      });
    }

    /* 2) tirage normal */
    const hist = (p.history || []).slice(0, 3).map((h) => h.id);
    const W = weights(lvl, cautious, p.pity || 0);
    const zoneOpts = { zone: !!zoneId || mode === 'spe' };
    let zonePool = null;
    if (zoneId) zonePool = NEV.Zones.get(zoneId).ex;
    else if (mode === 'daily' && (p.setup.zones || []).length && rng.float() < ZONE_BIAS) {
      zonePool = [];
      p.setup.zones.forEach((z) => { const zz = NEV.Zones.get(z); if (zz) zonePool = zonePool.concat(zz.ex); });
    }
    const base0 = NEV.EXERCISES.filter((e) => eligible(e, p.setup, zoneOpts) && (!zonePool || zonePool.indexOf(e.id) >= 0));
    const pool = (t) => {
      let list = base0.filter((e) => e.tier === t);
      const grp = zonePool ? null : FOCUS_GROUPS[p.setup.focus];
      if (grp) { const f = list.filter((e) => grp.indexOf(e.group) >= 0); if (f.length) list = f; }
      const fresh = list.filter((e) => hist.indexOf(e.id) < 0);
      return fresh.length ? fresh : list;
    };
    // raretés réellement disponibles : on ne tire que parmi elles
    const have = [1, 2, 3, 4, 5].map((t) => (pool(t).length ? 1 : 0));
    let wr = W.raw.map((w, i) => (have[i] ? w : 0));
    if (!wr.some((w) => w > 0)) wr = have.map((h) => h); // pitié forcée : aucun poids → tout ce qui existe
    if (!wr.some((w) => w > 0) && zonePool) { // zone trop restreinte pour ton matériel : on ouvre à tout le corps
      const all = NEV.EXERCISES.filter((e) => eligible(e, p.setup, { zone: true }));
      const ex0 = rng.pick(all);
      return finish(ex0);
    }
    const tier = rng.weighted(wr) + 1;
    const list = pool(tier);
    return finish(rng.pick(list));

    function finish(ex) {
      const r = RARITIES[ex.tier - 1];
      return Object.assign(base, {
        id: ex.id, name: ex.name, group: ex.group, tier: ex.tier, rarity: r.id, rarityName: r.name,
        plan: plan(ex, p, double, cautious),
        audit: { pity: p.pity || 0, level: lvl, pct: W.pct.map((v) => Math.round(v * 10) / 10), cautious, zone: zoneId, special: false }
      });
    }
  }

  /* Renvoie la carte du jour (ou de Spécialisation) ; la tire et l'enregistre si ce n'est pas déjà fait. */
  function ensureCard(p, user, opts) {
    opts = opts || {};
    NEV.player.ensureDay(p);
    const spe = opts.mode === 'spe';
    const slot = spe ? p.spe : p.daily;
    if (!slot.card) {
      const c = draw(p, user, opts);
      slot.card = c;
      slot.status = 'drawn';
      if (spe) slot.zone = opts.zone || 'all';
      if (!c.special) p.pity = c.tier >= 3 ? 0 : (p.pity || 0) + 1;
      NEV.player.save(p);
    }
    return slot.card;
  }

  function rarityOf(id) { return SPECIALS[id] || RARITIES.find((r) => r.id === id) || RARITIES[0]; }

  NEV.Gacha = {
    amount: (pl) => NEV.Ex.amountText(pl.unit, pl.perSet),
    RARITIES, SPECIALS, SPECIAL_RULE, WEIGHTS, weights, draw, ensureCard, plan, eligible, specialInfo, trainingDays,
    CARDS_ON_TABLE, PITY_HARD, rarity: rarityOf
  };
})(window);
