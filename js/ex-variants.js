/* ==========================================================
   neV.BOOSTER — ex-variants.js
   Porte la bibliothèque à 1000 exercices. Chaque fiche de base reçoit des VARIANTES réelles, qui se font autrement :
   tempo lent, pause sous tension, demi-amplitude, descente contrôlée, version facilitée, série d'endurance,
   explosif, lesté (sac à dos ou bouteilles), tenue plus longue, version rapide (cardio).
   Une variante garde le mouvement, la caméra et l'animation de sa fiche de base (variantOf = id de base),
   mais change la durée, la rareté, le nombre de répétitions et la consigne.
   Chargé après ex-extra.js, avant exercises.js.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const D = NEV.EX_DATA, A = NEV.EX_ANIM || (NEV.AnimKit && NEV.AnimKit.A);
  if (!D || !A) return;
  const TARGET = 1000;

  const BODY = ['jambes', 'pecs', 'dos', 'abdos', 'bras'];
  const isSec = (e) => e.unit === 'sec' || e.unit === 'secside';
  const hasEq = (e, k) => (e.equip || []).indexOf(k) >= 0;

  /* d : écart de rareté · f : facteur de répétitions · k : durée de l'animation · hold : durée de la pause d'animation
     ok(e) : la variante a-t-elle un sens pour cette fiche ? */
  const MODS = [
    { s: 'lent', n: 'tempo lent 3-1-3', d: 0, f: 0.7, k: 1.8,
      how: 'Descends en 3 secondes, marque 1 seconde de pause en bas, remonte en 3 secondes. Tout est contrôlé, sans élan.',
      step: 'Compte 3 secondes à la descente, 1 seconde en bas, 3 secondes à la montée.', mist: 'Aller trop vite sur la dernière répétition.',
      easy: 'Passe à 2 secondes pour la descente et la montée.', hard: 'Allonge la descente à 4 secondes.', ok: (e) => !isSec(e) },
    { s: 'pause', n: 'pause sous tension', d: 1, f: 0.75, k: 1.2, hold: 2,
      how: 'Marque une pause de 2 secondes dans la position la plus difficile de chaque répétition, puis repars sans rebond.',
      step: 'Fige-toi 2 secondes dans la position la plus dure, muscles bien serrés.', mist: 'Relâcher les muscles pendant la pause.',
      easy: 'Pause d\'une seule seconde.', hard: 'Pause de 3 secondes.', ok: (e) => !isSec(e) },
    { s: 'demi', n: 'demi-amplitude pulsée', d: 0, f: 1.3, k: 0.6, amp: 0.6,
      how: 'Reste dans la moitié la plus difficile du mouvement et fais de petites pulsations sans jamais te reposer en haut.',
      step: 'Pulse dans la zone où l\'effort est le plus fort, sans aller au bout du mouvement.', mist: 'Faire des mouvements trop petits pour sentir le muscle.',
      easy: 'Augmente l\'amplitude.', hard: 'Ajoute 5 pulsations à chaque répétition.', ok: (e) => !isSec(e) && e.group !== 'cardio' },
    { s: 'controle', n: 'descente contrôlée 5 s', d: 1, f: 0.6, k: 2.4,
      how: 'Descends très lentement en 5 secondes, puis remonte normalement. C\'est la descente qui fait le travail.',
      step: 'Compte 5 secondes à la descente, puis remonte en 1 à 2 secondes.', mist: 'Laisser tomber le corps en fin de descente.',
      easy: 'Descends en 3 secondes.', hard: 'Descends en 6 secondes.', ok: (e) => !isSec(e) && e.group !== 'cardio' },
    { s: 'facile', n: 'version facilitée', d: -1, f: 1.2, k: 1.1,
      how: 'Version plus accessible : réduis l\'amplitude, garde un rythme tranquille et soigne la position.',
      step: 'Choisis l\'amplitude qui te permet de rester propre sur toutes les répétitions.', mist: 'Compenser en cambrant ou en bougeant les épaules.',
      easy: 'Réduis encore l\'amplitude.', hard: 'Reviens à l\'exercice complet.', ok: (e) => e.tier >= 2 },
    { s: 'endurance', n: 'série d\'endurance', d: 0, f: 1.6, k: 1,
      how: 'Même mouvement, mais beaucoup plus de répétitions à rythme régulier pour tenir longtemps.',
      step: 'Trouve un rythme régulier et garde-le jusqu\'à la fin de la série.', mist: 'Partir trop vite et s\'effondrer à mi-série.',
      easy: 'Enlève 5 répétitions.', hard: 'Ajoute une répétition par série à chaque séance.', ok: (e) => !isSec(e) && e.group !== 'mobilite' },
    { s: 'explosif', n: 'montée explosive', d: 1, f: 0.7, k: 0.7,
      how: 'Descends en 2 secondes sous contrôle, puis monte le plus vite possible sans quitter le sol.',
      step: 'Pousse fort à la montée, sans décoller les pieds ni les mains.', mist: 'Terminer le mouvement en rebond brusque sur les articulations.',
      easy: 'Monte à vitesse normale.', hard: 'Ajoute une pause de 1 seconde en bas avant de partir.', ok: (e) => !isSec(e) && BODY.indexOf(e.group) >= 0 },
    { s: 'sac', n: 'lesté d\'un sac à dos', d: 1, f: 0.85, k: 1, equip: 'bag',
      how: 'Mets du poids dans un sac à dos fermé (livres, bouteilles) et garde-le bien collé au corps pendant tout le mouvement.',
      step: 'Ajuste les bretelles pour que le sac ne bouge pas.', mist: 'Charger trop lourd et perdre la position.',
      easy: 'Allège le sac.', hard: 'Ajoute un peu de poids dans le sac.', ok: (e) => BODY.indexOf(e.group) >= 0 && !hasEq(e, 'bag') && !hasEq(e, 'bottle') && !hasEq(e, 'bar') && !/^tractions|^pistol/.test(e.id) },
    { s: 'bouteilles', n: 'avec deux bouteilles d\'eau', d: 1, f: 0.9, k: 1, equip: 'bottle',
      how: 'Tiens une bouteille d\'eau pleine dans chaque main, ou les deux contre la poitrine, pendant tout le mouvement.',
      step: 'Serre fort les bouteilles et garde-les stables.', mist: 'Laisser les bouteilles balancer.',
      easy: 'Utilise des bouteilles à moitié pleines.', hard: 'Utilise des bouteilles de 1,5 litre.', ok: (e) => ['jambes', 'abdos', 'epaules', 'bras', 'dos'].indexOf(e.group) >= 0 && !hasEq(e, 'bag') && !hasEq(e, 'bottle') && !hasEq(e, 'bar') && !/^tractions|^pistol/.test(e.id) },
    { s: 'tenue', n: 'tenue plus longue', d: 1, f: 1.5, k: 1, hold: 3,
      how: 'Même position, mais tiens beaucoup plus longtemps, en respirant calmement.',
      step: 'Respire régulièrement ; chaque seconde compte.', mist: 'Retenir sa respiration.',
      easy: 'Fais deux tenues plus courtes.', hard: 'Ajoute 10 secondes.', ok: (e) => isSec(e) && e.group !== 'mobilite' },
    { s: 'trois-quarts', n: 'trois-quarts d\'amplitude', d: 0, f: 1.1, k: 0.9, amp: 0.8,
      how: 'Fais seulement les trois quarts du mouvement et garde le muscle sous tension, sans te relâcher en haut ni en bas.',
      step: 'Arrête chaque répétition avant la position de repos pour garder la tension.', mist: 'Se reposer en haut ou en bas du mouvement.',
      easy: 'Reviens à l\'amplitude complète.', hard: 'Ajoute une pause d\'une seconde au point le plus dur.', ok: (e) => !isSec(e) && BODY.indexOf(e.group) >= 0 },
    { s: 'rapide', n: 'rythme rapide', d: 1, f: 1.4, k: 0.7,
      how: 'Même mouvement, mais à un rythme soutenu pour faire monter le cœur, sans sacrifier la position.',
      step: 'Garde la respiration régulière malgré le rythme.', mist: 'Accélérer au point de bâcler la position.',
      easy: 'Ralentis un peu le rythme.', hard: 'Tiens le rythme 10 secondes de plus.', ok: (e) => e.group === 'cardio' && !isSec(e) }
  ];

  const clampTier = (base, d) => {
    let t = Math.max(1, Math.min(5, base + d));
    if (base < 5 && t === 5) t = 4;       // les cartes mythiques restent celles des fiches de base
    return t;
  };
  const roundReps = (v, unit) => (unit === 'sec' || unit === 'secside' ? Math.max(5, Math.round(v / 5) * 5) : Math.max(2, Math.round(v)));

  function build(e, m) {
    const id = e.id + '-' + m.s;
    const o = Object.assign({}, e, {
      id, name: e.name + ' — ' + m.n, tier: clampTier(e.tier, m.d), variantOf: e.id, variant: m.s, src: 'variant',
      base: (e.base || []).map((v) => roundReps(v * m.f, e.unit)),
      exec: m.how + ' ' + (e.exec || ''),
      steps: (e.steps || []).concat([m.step]),
      mistakes: (e.mistakes || []).concat([m.mist]),
      easy: m.easy, hard: m.hard,
      equip: (e.equip || []).concat(m.equip ? [m.equip] : []),
      cam: Object.assign({}, e.cam)
    });
    if (e.fromMax) { o.fromMax = e.fromMax * m.f; if (e.fromMin) o.fromMin = roundReps(e.fromMin * m.f, e.unit); if (e.fromCap) o.fromCap = roundReps(e.fromCap * m.f, e.unit); }
    if (m.amp && o.cam && o.cam.amp) o.cam.amp = Math.max(8, Math.round(o.cam.amp * m.amp));
    if (m.equip && o.cam) o.cam.place = undefined;   // la phrase de placement est recalculée par exercises.js
    delete o.cam.place;
    o.dose = e.dose ? e.dose + ' · ' + m.n : m.n;
    /* animation : même mouvement, autre tempo */
    const s = A[e.id];
    if (s && s.frames) {
      A[id] = Object.assign({}, s, {
        frames: s.frames.map((f) => Object.assign({}, f, { d: Math.max(120, Math.round((f.d || 300) * m.k)) })),
        hold: m.hold ? Math.round((s.hold || 200) * m.hold) : s.hold
      });
    }
    return o;
  }

  /* Tour à tour, une variante par fiche de base, jusqu'à 1000 au total : toutes les familles restent équilibrées. */
  const bases = D.filter((e) => e.group !== 'mobilite' && !e.special && e.id !== 'repos-actif' && e.cam && A[e.id]);
  const taken = {}; D.forEach((e) => { taken[e.id] = 1; });
  const made = [];
  for (let round = 0; round < MODS.length && D.length + made.length < TARGET; round++) {
    const m = MODS[round];
    for (let i = 0; i < bases.length && D.length + made.length < TARGET; i++) {
      const e = bases[i];
      if (m.ok(e) && !taken[e.id + '-' + m.s]) { taken[e.id + '-' + m.s] = 1; made.push(build(e, m)); }
    }
  }
  /* Si les 11 familles ne suffisent pas, on complète avec les variantes « tempo » des fiches déjà créées (jamais deux fois la même). */
  made.forEach((o) => D.push(o));
  NEV.EX_VARIANTS = { count: made.length, mods: MODS.map((m) => m.s) };
})(window);
