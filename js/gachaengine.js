/* ==========================================================
   neV.BOOSTER — gachaengine.js
   Le moteur du tirage. Un seul endroit décide du hasard :
   - raretés pondérées selon le niveau du joueur,
   - garantie « Épique » si trop de jours sans carte forte,
   - aucune répétition des 3 derniers exercices,
   - une seule carte SPÉCIALE : « Repos » (40 % après 7 jours d'entraînement, une fois par semaine) ; les tractions sont des cartes mythiques (hommes),
   - hasard du navigateur (crypto.getRandomValues), pas Math.random().
   Deux systèmes de tirage utilisent ce moteur :
   - le gacha du jour       : draw(p, user)
   - le gacha Spécialisation : draw(p, user, { mode: 'spe', zone })
   Les deux tirages acceptent une CATÉGORIE (opts.cat : pecs, dos, jambes, abdos, epaules, bras, cardio) : toutes les
   cartes tirées appartiennent alors à cette catégorie, sans exception (voir CATEGORIES et categoryInfo).
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
  const PITY_SOFT = 4, PITY_HARD = 7, CARDS_ON_TABLE = 5;
  const SEEN_MAX = 600;   // mémoire des cartes déjà tirées (pour ne pas les répéter)

  /* Temps de repos entre deux séries, selon l'exercice (normes d'entraînement) :
       cardio et tenues légères  : 20 à 45 s (garder le cœur haut)
       isolation et gainage      : 45 à 75 s
       renforcement classique    : 60 à 120 s (1 à 2 min)
       exercices les plus durs   : 150 à 300 s (3 à 5 min) pour récupérer vraiment. */
  const HARD_MODS = ['pause', 'controle', 'explosif', 'sac'];
  function restFor(ex, p) {
    const pref = p && p.setup && p.setup.rest;
    if (pref && pref !== 'auto' && Number(pref) >= 10) return Math.min(600, Math.round(Number(pref)));   // choix de l'utilisateur
    const t = ex.tier || 1, gp = ex.group;
    let sec;
    if (gp === 'cardio') sec = 25 + 5 * t;                                   // 30 à 45 s (50 pour un mythique)
    else if (gp === 'mobilite') sec = 20;
    else if (gp === 'abdos' || gp === 'bras') sec = t <= 2 ? 45 : t === 3 ? 60 : t === 4 ? 90 : 120;
    else sec = t === 1 ? 60 : t === 2 ? 75 : t === 3 ? 90 : t === 4 ? 150 : 240;   // pecs, dos, jambes
    if (HARD_MODS.indexOf(ex.variant) >= 0) sec += 15;
    if (ex.variant === 'facile' || ex.variant === 'endurance' || ex.variant === 'rapide') sec -= 10;
    if (gp === 'pecs' || gp === 'dos' || gp === 'jambes') sec = Math.max(sec, 60);   // le renforcement ne descend jamais sous 1 min
    if (p && p.weightKg >= 100 && gp !== 'cardio') sec += 15;                 // les articulations et le souffle demandent un peu plus
    return Math.max(20, Math.min(300, sec));
  }

  /* Carte spéciale Repos : il faut s'être entraîné `minDays` jours sur les `window` derniers jours
     pour passer de 0 % à 40 % de chance, et au plus une fois tous les `cooldown` jours. Réglable depuis l'admin (NEV.cfg.special). */
  const SPECIAL_RULE = { minDays: 7, window: 7, high: 0.4, low: 0, reposShare: 1, restSec: 90, cooldown: 7 };
  const rule = () => Object.assign({}, SPECIAL_RULE, (NEV.cfg && NEV.cfg.special) || {});
  const ZONE_BIAS = 0.5; // part des tirages du jour qui visent tes zones prioritaires

  function weights(level, cautious, pity) {
    const w = (WEIGHTS[level] || WEIGHTS[1]).slice();
    const gm = NEV.cfg && NEV.cfg.gachaWeights;   // multiplicateurs réglés par l'admin (0 à 3 par rareté)
    if (gm && gm.length === 5) for (let i = 0; i < 5; i++) w[i] *= gm[i];
    if (NEV.sex === 'f') w[4] = 0;   // parcours féminin : pas de cartes mythiques
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

  /* Catégories proposées dans la page Gacha. « Épaules » regroupe les exercices qui travaillent surtout les deltoïdes
     (ils vivent dans les familles pecs / dos / bras de la bibliothèque). */
  const SHOULDER_HOME = ['pecs', 'dos', 'bras'];
  const CATEGORIES = [
    { id: 'pecs', name: 'Pectoraux', match: (ex) => ex.group === 'pecs' },
    { id: 'abdos', name: 'Abdominaux', match: (ex) => ex.group === 'abdos' },
    { id: 'jambes', name: 'Jambes', match: (ex) => ex.group === 'jambes' },
    { id: 'epaules', name: 'Épaules', match: (ex) => SHOULDER_HOME.indexOf(ex.group) >= 0 && (ex.muscles || []).indexOf('shoulders') >= 0 },
    { id: 'cardio', name: 'Cardio', match: (ex) => ex.group === 'cardio' },
    { id: 'dos', name: 'Dos', match: (ex) => ex.group === 'dos' },
    { id: 'bras', name: 'Bras', match: (ex) => ex.group === 'bras' }
  ];
  const catById = (id) => CATEGORIES.find((c) => c.id === id) || null;

  /* Un exercice peut-il sortir ? opts.zone : tirage de Spécialisation (mobilité autorisée). */
  function eligible(ex, setup, opts) {
    opts = opts || {};
    if (!NEV.Ex.sexOk(ex, NEV.sex || 'm')) return false; // chaque parcours (homme / femme) a ses propres exercices
    if (NEV.cfg && NEV.cfg.exStatus && NEV.cfg.exStatus[ex.id]) return false; // masqué par l'admin (brouillon ou désactivé)
    if (ex.special) return false; // Repos et Tractions ne sortent que par les cartes spéciales
    const gachaOk = ex.gacha !== false || (opts.zone && ex.group === 'mobilite') || (NEV.sex === 'f' && ex.group === 'mobilite');
    if (!gachaOk || !ex.cam) return false;
    if (ex.zoneOnly && !opts.zone && !((setup.zones || []).some((z) => NEV.Zones && NEV.Zones.get(z) && NEV.Zones.get(z).ex.indexOf(ex.id) >= 0))) return false;
    if (!NEV.Ex.weightOk(ex, setup.weightKg)) return false; // poids élevé : pas de sauts ni d'exercices à fort impact
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
    return { unit, perSet: per, sets, rest: restFor(ex, p), restAuto: !(p.setup && p.setup.rest && p.setup.rest !== 'auto'), total: per * sets * mult, doubled: !!double };
  }

  /* ---------- aucune répétition ----------
     On retient les cartes tirées (done ou non). Un exercice ne ressort pas tant que 80 % du choix possible n'est pas passé :
     avec 1000 exercices, tu ne retombes quasiment jamais deux fois sur le même. */
  function recentIds(p, extra) {
    const out = [], seen = {};
    const add = (id) => { if (id && !seen[id] && String(id).indexOf('combo:') !== 0) { seen[id] = 1; out.push(id); } };
    (extra || []).forEach(add);
    (p.history || []).slice(0, 60).forEach((h) => add(h.id));
    (p.seen || []).forEach(add);
    return out;
  }
  function remember(p, ids) {
    const fresh = ids.filter(Boolean);
    p.seen = fresh.concat((p.seen || []).filter((x) => fresh.indexOf(x) < 0)).slice(0, SEEN_MAX);
  }
  /* Choisit au hasard parmi les exercices pas vus récemment ; si tout a été vu, prend l'un des plus anciens. */
  function pickFresh(list, recent, poolSize) {
    const k = Math.max(3, Math.floor(poolSize * 0.8)), avoid = {};
    recent.slice(0, k).forEach((id) => { avoid[id] = 1; });
    const fresh = list.filter((e) => !avoid[e.id]);
    if (fresh.length) return rng.pick(fresh);
    let best = [], bestPos = -1;
    list.forEach((e) => { const pos = recent.indexOf(e.id); if (pos > bestPos) { bestPos = pos; best = [e]; } else if (pos === bestPos) best.push(e); });
    return rng.pick(best.length ? best : list);
  }

  /* Exercices que ce joueur peut tirer dans une catégorie (selon son matériel et les réglages de l'admin). */
  function categoryPool(p, catId) {
    const c = catById(catId);
    return NEV.EXERCISES.filter((e) => eligible(e, p.setup, {}) && (!c || c.match(e)));
  }
  /* Pour l'interface : combien d'exercices, et de quelles raretés, dans chaque catégorie. */
  function categoryInfo(p) {
    return CATEGORIES.map((c) => {
      const list = categoryPool(p, c.id), tiers = [0, 0, 0, 0, 0];
      list.forEach((e) => { tiers[e.tier - 1]++; });
      return { id: c.id, name: c.name, count: list.length, tiers };
    });
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
    const recentRest = (p.history || []).some((h) => h.rest && util.daysBetween(h.date, today) >= 0 && util.daysBetween(h.date, today) < R.cooldown);
    const reposOk = !double && !!last && util.daysBetween(last, today) <= 1 && !recentRest && !lastCardRest && !(opts.mode === 'spe' && dailyDone);
    const tractionsOk = false;   // les tractions sont désormais des cartes mythiques normales
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
    const cat = opts.cat && catById(opts.cat) ? catById(opts.cat) : null;   // catégorie choisie : elle est TOUJOURS respectée
    const exclude = opts.exclude || [];
    const base = { drawnAt: Date.now(), table: CARDS_ON_TABLE, pick: rng.int(CARDS_ON_TABLE), mode, zone: zoneId, cat: cat ? cat.id : null };

    /* 1) carte spéciale ? (jamais avec une catégorie : Repos et Tractions ne sont pas des exercices de catégorie) */
    const sp = opts.noSpecial || cat ? null : rollSpecial(p, { mode });
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
    const recent = recentIds(p, exclude);
    const W = weights(lvl, cautious, p.pity || 0);
    const zoneOpts = { zone: !!zoneId || mode === 'spe' };
    let zonePool = null;
    if (zoneId) zonePool = NEV.Zones.get(zoneId).ex;
    else if (!cat && mode === 'daily' && (p.setup.zones || []).length && rng.float() < ZONE_BIAS) {
      zonePool = [];
      p.setup.zones.forEach((z) => { const zz = NEV.Zones.get(z); if (zz) zonePool = zonePool.concat(zz.ex); });
    }
    let base0 = NEV.EXERCISES.filter((e) => eligible(e, p.setup, zoneOpts) && (!zonePool || zonePool.indexOf(e.id) >= 0) && (!cat || cat.match(e)));
    if (exclude.length) { const rest = base0.filter((e) => exclude.indexOf(e.id) < 0); if (rest.length) base0 = rest; }
    /* exercices pas encore vus récemment : on tire d'abord la rareté parmi celles qui ont encore du neuf */
    const avoidN = Math.max(3, Math.floor(base0.length * 0.8)), avoid = {};
    recent.slice(0, avoidN).forEach((id) => { avoid[id] = 1; });
    let useFresh = base0.some((e) => !avoid[e.id]);
    const pool = (t) => {
      let list = base0.filter((e) => e.tier === t && (!useFresh || !avoid[e.id]));
      const grp = zonePool || cat ? null : FOCUS_GROUPS[p.setup.focus];
      if (grp) { const f = list.filter((e) => grp.indexOf(e.group) >= 0); if (f.length) list = f; }
      return list;
    };
    // raretés réellement disponibles : on ne tire que parmi elles
    const have = [1, 2, 3, 4, 5].map((t) => (pool(t).length ? 1 : 0));
    let wr = W.raw.map((w, i) => (have[i] ? w : 0));
    if (!wr.some((w) => w > 0)) wr = have.map((h) => h); // pitié forcée : aucun poids → tout ce qui existe
    if (!wr.some((w) => w > 0) && cat) throw new Error('Aucun exercice disponible dans la catégorie « ' + cat.name + ' »');
    if (!wr.some((w) => w > 0) && zonePool) { // zone trop restreinte pour ton matériel : on ouvre à tout le corps
      const all = NEV.EXERCISES.filter((e) => eligible(e, p.setup, { zone: true }));
      return finish(pickFresh(all, recent, all.length));
    }
    const tier = rng.weighted(wr) + 1;
    const list = pool(tier);
    return finish(pickFresh(list, recent, base0.length));

    function finish(ex) {
      const r = RARITIES[ex.tier - 1];
      return Object.assign(base, {
        id: ex.id, name: ex.name, group: ex.group, tier: ex.tier, rarity: r.id, rarityName: r.name,
        plan: plan(ex, p, double, cautious),
        audit: { pity: p.pity || 0, level: lvl, pct: W.pct.map((v) => Math.round(v * 10) / 10), cautious, zone: zoneId, cat: cat ? cat.id : null, special: false }
      });
    }
  }

  /* ---------- Gacha Box : 4 cartes tirées d'un coup ----------
     Chaque carte = un exercice (même moteur que le gacha du jour) ou, parfois, un COMBO (enchaînement existant).
     Un combo occupe une seule carte. Réglable (NEV.cfg.box) : cards, sets (séries par exercice), comboChance. */
  const BOX = { cards: 4, sets: 1, comboChance: 0.5 };
  const boxCfg = () => Object.assign({}, BOX, (NEV.cfg && NEV.cfg.box) || {});

  /* Combos que ce joueur peut faire : 2 à 4 exercices, tout le matériel disponible. */
  function comboPool(p) {
    const eq = (p.setup && p.setup.equip) || {};
    return (NEV.Combos ? NEV.Combos.all() : []).filter((c) => NEV.Combos.valid(c) && !c.free && c.items.length >= 2 && c.items.length <= 4 &&
      c.items.every((it) => { const ex = NEV.Ex.byId(it[0]); return ex && !ex.special && NEV.Ex.sexOk(ex, NEV.sex || 'm') && NEV.Ex.weightOk(ex, p.weightKg) && (ex.equip || []).every((k) => !!eq[k]); }));
  }

  function boxPlan(pl, sets) {
    const mult = (pl.unit === 'side' || pl.unit === 'secside') ? 2 : 1;
    return { unit: pl.unit, perSet: pl.perSet, sets, rest: pl.rest, total: pl.perSet * sets * mult, doubled: false };
  }

  /* Tire les cartes de la boîte. Ne sauvegarde rien : c'est ensureBox qui le fait.
     opts.cat : une catégorie → toutes les cartes en font partie, toutes différentes (un combo n'entre que si chacun de ses
     exercices est de cette catégorie). opts.n : nombre de cartes voulu (4 par défaut). */
  function drawBox(p, user, opts) {
    opts = opts || {};
    const B = boxCfg(), cat = opts.cat && catById(opts.cat) ? catById(opts.cat) : null;
    let n = Math.max(2, Math.min(6, (opts.n || B.cards) | 0));
    if (cat) n = Math.min(n, categoryPool(p, cat.id).length);   // jamais deux fois le même exercice
    if (n < 1) throw new Error('Aucun exercice disponible dans la catégorie « ' + cat.name + ' »');
    const dbl = !!(p.daily && p.daily.double && p.daily.status !== 'done');
    const sets = Math.max(1, Math.min(4, B.sets | 0)) * (dbl ? 2 : 1);
    const pool = comboPool(p).filter((c) => !cat || c.items.every((it) => { const ex = NEV.Ex.byId(it[0]); return ex && cat.match(ex); }));
    const fake = Object.assign({}, p, { history: (p.history || []).slice() });
    /* un combo n'entre dans la boîte que s'il est entièrement NEUF pour ce joueur (aucun de ses exercices vu récemment) */
    const seenRecent = recentIds(p, []).slice(0, Math.max(6, Math.floor(NEV.EXERCISES.length * 0.1)));
    const freshPool = pool.filter((c) => !c.items.some((it) => seenRecent.indexOf(it[0]) >= 0));
    const comboAt = freshPool.length && n > 1 && rng.float() < B.comboChance ? rng.int(n) : -1;
    const cards = [], used = [];
    for (let i = 0; i < n; i++) {
      if (i === comboAt) {
        const c = rng.pick(freshPool);
        const steps = c.items.map((it) => { const ex = NEV.Ex.byId(it[0]); const pl = plan(ex, p, false, false); return { id: ex.id, name: ex.name, tier: ex.tier, group: ex.group, plan: boxPlan(pl, sets) }; });
        const tier = Math.max(1, Math.min(5, Math.round(steps.reduce((a, s) => a + s.tier, 0) / steps.length)));
        cards.push({ type: 'combo', id: c.id, name: c.name, lvl: c.lvl || '', tier, rarity: 'combo', steps });
        steps.forEach((s) => { fake.history.unshift({ id: s.id }); used.push(s.id); });
        continue;
      }
      const c = draw(fake, user, { mode: 'daily', noSpecial: true, cat: cat && cat.id, exclude: used });
      cards.push({ type: 'single', id: c.id, name: c.name, group: c.group, tier: c.tier, rarity: c.rarity, rarityName: c.rarityName, plan: boxPlan(c.plan, sets) });
      fake.history.unshift({ id: c.id }); used.push(c.id);
    }
    return { date: util.todayStr(), cards, cat: cat ? cat.id : null, status: 'drawn', drawnAt: Date.now(), result: null, picked: null };
  }

  /* Renvoie la boîte du jour ; la tire et l'enregistre si ce n'est pas déjà fait (impossible de re-tirer en rechargeant). */
  function ensureBox(p, user, opts) {
    NEV.player.ensureDay(p);
    if (!p.box.cards) {
      const b = drawBox(p, user, opts);
      p.box = b;
      remember(p, [].concat.apply([], b.cards.map((c) => (c.type === 'combo' ? c.steps.map((st) => st.id) : [c.id]))));
      p.pity = b.cards.some((c) => c.type === 'single' && c.tier >= 3) ? 0 : (p.pity || 0) + 1;
      NEV.player.save(p);
    }
    return p.box;
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
      if (!c.special) remember(p, [c.id]);
      if (!c.special) p.pity = c.tier >= 3 ? 0 : (p.pity || 0) + 1;
      NEV.player.save(p);
    }
    return slot.card;
  }

  function rarityOf(id) { return SPECIALS[id] || RARITIES.find((r) => r.id === id) || RARITIES[0]; }

  NEV.Gacha = {
    amount: (pl) => NEV.Ex.amountText(pl.unit, pl.perSet),
    RARITIES, SPECIALS, SPECIAL_RULE, WEIGHTS, weights, restFor, recentIds, remember, pickFresh, draw, ensureCard, plan, eligible, specialInfo, trainingDays,
    CATEGORIES, catById, categoryPool, categoryInfo,
    CARDS_ON_TABLE, PITY_HARD, rarity: rarityOf, BOX, drawBox, ensureBox, comboPool, boxCfg
  };
})(window);
