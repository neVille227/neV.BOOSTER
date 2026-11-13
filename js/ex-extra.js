/* ==========================================================
   neV.BOOSTER — ex-extra.js
   Exercices en plus, rangés par version :
   for:'f' = proposés dans la version femme (fessiers, cuisses, taille, tonicité, faible impact)
   for:'m' = proposés dans la version homme (force, tempo lent, pauses sous tension)
   Les exercices sans `for` sont communs. Chargé après ex-more.js, avant exercises.js.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const { X, S } = NEV.DataKit;
  const { A, P, F, STAND, FRONT, supine, MAT, AK } = NEV.AnimKit;
  const D = NEV.EX_DATA;

  /* fiche rapide : E(id, nom, catégorie, rareté, matériel, unité, [reps par niveau], sexe, { fiche }) */
  const E = (id, name, cat, tier, equip, unit, base, sex, o) => {
    X(id, name, cat, tier, equip, unit, base, Object.assign({ cam: S('side', 'manual', 0, 'manual'), gacha: true, for: sex || undefined }, o));
  };
  /* variante d'animation : même mouvement que `src`, autre tempo / pause / accessoires */
  const V = (src, id, o) => {
    const s = A[src]; if (!s) return;
    o = o || {};
    A[id] = Object.assign({}, s, {
      frames: s.frames.map((f) => F(f.p, Math.round(f.d * (o.k || 1)))),
      hold: o.hold != null ? o.hold : s.hold,
      props: o.props || s.props,
      muscles: o.muscles || s.muscles,
      view: o.view || s.view
    });
  };

  /* =============== VERSION FEMME : fessiers, cuisses, taille, tonicité =============== */
  E('curtsy-lunge', 'Fente révérence', 3, 2, [], 'side', [8, 10, 12, 14, 16], 'f', {
    works: 'Fessiers, cuisses, hanches', dose: '3 séries de 8 à 12 par côté',
    exec: 'Debout, croise une jambe derrière l\'autre en pliant les genoux, comme une révérence, puis reviens debout.',
    steps: ['Debout, pieds largeur de hanches, mains jointes devant toi.', 'Croise une jambe derrière l\'autre en diagonale.', 'Plie les deux genoux, buste droit.', 'Pousse sur le pied avant pour revenir debout.'],
    mistakes: ['Pencher le buste vers l\'avant.', 'Laisser le genou rentrer vers l\'intérieur.'], easy: 'Descends moins bas.', hard: 'Ajoute un sac à dos sur le ventre.', view: 'front'
  });
  E('squat-sumo-pulse', 'Squat sumo pulsé', 3, 2, [], 'rep', [10, 12, 15, 18, 22], 'f', {
    works: 'Intérieur des cuisses, fessiers', dose: '3 séries de 12 à 20',
    exec: 'Pieds très écartés, pointes vers l\'extérieur. Descends et fais de petites pulsations en bas avant de remonter.',
    steps: ['Pieds deux fois plus larges que les épaules, pointes vers l\'extérieur.', 'Descends jusqu\'à ce que les cuisses soient parallèles au sol.', 'Fais 3 petits rebonds en bas.', 'Remonte en serrant les fessiers.'],
    mistakes: ['Genoux qui rentrent.', 'Dos qui s\'arrondit.'], easy: 'Descends moins bas.', hard: 'Pause de 3 s en bas.', view: 'front'
  });
  E('squat-sumo-pause', 'Squat sumo avec pause', 3, 3, [], 'rep', [6, 8, 10, 12, 15], 'f', {
    works: 'Cuisses, fessiers, adducteurs', dose: '3 séries de 8 à 12',
    exec: 'Squat sumo : tiens 3 secondes en bas, genoux ouverts, puis remonte en poussant dans les talons.',
    steps: ['Pieds largement écartés, pointes ouvertes.', 'Descends lentement, dos droit.', 'Tiens 3 secondes en bas.', 'Remonte en poussant dans le sol.'],
    mistakes: ['Rebondir en bas.', 'Talons qui décollent.'], easy: 'Pause de 1 s.', hard: 'Pause de 5 s.', view: 'front'
  });
  E('pont-fessier-pause', 'Pont fessier avec pause', 3, 1, [], 'rep', [8, 10, 12, 15, 18], 'f', {
    works: 'Fessiers, ischio-jambiers', dose: '3 séries de 10 à 15',
    exec: 'Allongée sur le dos, monte le bassin, serre les fessiers et tiens 3 secondes en haut.',
    steps: ['Dos au sol, genoux pliés, pieds à plat.', 'Monte le bassin en poussant dans les talons.', 'Serre les fessiers 3 secondes, corps en ligne.', 'Redescends lentement.'],
    mistakes: ['Cambrer le bas du dos.', 'Pousser sur la pointe des pieds.'], easy: 'Pause de 1 s.', hard: 'Une jambe.'
  });
  E('pont-fessier-marche', 'Pont fessier marché', 3, 3, [], 'side', [6, 8, 10, 12, 14], 'f', {
    works: 'Fessiers, tronc', dose: '3 séries de 6 à 10 par côté',
    exec: 'Bassin en haut, soulève un pied puis l\'autre sans laisser le bassin descendre.',
    steps: ['Monte en pont fessier.', 'Soulève un pied, genou vers la poitrine.', 'Repose, soulève l\'autre.', 'Garde le bassin haut et stable.'],
    mistakes: ['Bassin qui bascule.', 'Retenir sa respiration.'], easy: 'Pont fessier simple.', hard: 'Allonge la jambe levée.'
  });
  E('donkey-kick-pulse', 'Donkey kick pulsé', 3, 2, [], 'side', [10, 12, 15, 18, 22], 'f', {
    works: 'Fessiers', dose: '3 séries de 12 à 20 par jambe',
    exec: 'À quatre pattes, jambe en haut, fais de petites pulsations vers le plafond en serrant la fesse.',
    steps: ['À quatre pattes, dos plat.', 'Lève le talon vers le plafond, genou à 90°.', 'Pulse 10 à 15 fois, très petit mouvement.', 'Repose et change de jambe.'],
    mistakes: ['Cambrer le dos.', 'Tourner le bassin.'], easy: 'Moins de pulsations.', hard: 'Ajoute une pause en haut.'
  });
  E('kickback-genou-plie', 'Kickback debout, genou plié', 3, 1, [], 'side', [8, 10, 12, 15, 18], 'f', {
    works: 'Fessiers, ischio-jambiers', dose: '3 séries de 10 à 15 par jambe',
    exec: 'Debout, jambe pliée vers l\'arrière : pousse le talon vers le plafond en serrant la fesse.',
    steps: ['Debout, une main sur un mur pour l\'équilibre.', 'Plie un genou, talon vers la fesse.', 'Pousse le talon vers le plafond.', 'Reviens sans balancer.'],
    mistakes: ['Cambrer le bas du dos.', 'Balancer la jambe.'], easy: 'Petit mouvement.', hard: 'Pause de 2 s en haut.'
  });
  E('fente-laterale-lente', 'Fente latérale lente', 3, 2, [], 'side', [6, 8, 10, 12, 14], 'f', {
    works: 'Cuisses, fessiers, adducteurs', dose: '3 séries de 8 à 12 par côté',
    exec: 'Fais un grand pas sur le côté, plie ce genou en poussant les fesses en arrière, jambe opposée tendue, puis reviens.',
    steps: ['Debout, pieds joints.', 'Grand pas sur le côté.', 'Plie le genou du côté du pas, l\'autre jambe reste tendue.', 'Pousse pour revenir au centre.'],
    mistakes: ['Genou qui dépasse les orteils.', 'Buste qui s\'effondre.'], easy: 'Pas plus court.', hard: 'Tiens 2 s en bas.', view: 'front'
  });
  E('squat-chaise-doux', 'Squat jusqu\'à la chaise', 3, 1, ['chair'], 'rep', [8, 10, 12, 15, 18], 'f', {
    works: 'Cuisses, fessiers', dose: '3 séries de 10 à 15', warn: 'Chaise calée contre un mur.',
    exec: 'Assieds-toi lentement sur la chaise en poussant les fesses en arrière, effleure l\'assise, puis remonte.',
    steps: ['Dos à la chaise, pieds largeur d\'épaules.', 'Pousse les fesses en arrière et descends.', 'Effleure l\'assise sans te laisser tomber.', 'Remonte en poussant dans les talons.'],
    mistakes: ['Se laisser tomber.', 'Genoux qui rentrent.'], easy: 'Assieds-toi vraiment.', hard: 'Ne touche pas l\'assise.'
  });
  E('crunch-lent', 'Crunch lent', 4, 1, [], 'rep', [8, 10, 12, 15, 18], 'f', {
    works: 'Abdominaux', dose: '3 séries de 10 à 15',
    exec: 'Allongée, monte lentement les épaules en soufflant, tiens 2 secondes, redescends sans relâcher.',
    steps: ['Dos au sol, genoux pliés, mains près des tempes.', 'Souffle et monte les épaules.', 'Tiens 2 secondes en contractant le ventre.', 'Redescends lentement.'],
    mistakes: ['Tirer sur la nuque.', 'Monter avec l\'élan.'], easy: 'Bras tendus devant.', hard: 'Pause de 4 s.'
  });
  E('planche-genoux-lente', 'Planche sur les genoux', 4, 1, [], 'sec', [15, 20, 25, 30, 40], 'f', {
    works: 'Tronc, épaules', dose: '3 tenues de 20 à 40 s',
    exec: 'Sur les avant-bras et les genoux, corps aligné des genoux à la tête, ventre serré.',
    steps: ['Avant-bras au sol, coudes sous les épaules.', 'Genoux au sol, bassin aligné.', 'Serre le ventre et les fessiers.', 'Respire calmement.'],
    mistakes: ['Bassin qui tombe.', 'Fesses en l\'air.'], easy: 'Tiens 10 s.', hard: 'Passe sur les pieds.'
  });
  E('curl-bouteilles-lent', 'Curl lent aux bouteilles', 5, 1, ['bottle'], 'rep', [8, 10, 12, 15, 18], 'f', {
    works: 'Biceps, avant-bras', dose: '3 séries de 10 à 15',
    exec: 'Debout, une bouteille dans chaque main : plie les coudes en 2 secondes, redescends en 3 secondes.',
    steps: ['Debout, coudes collés au corps.', 'Plie les coudes lentement.', 'Serre en haut une seconde.', 'Redescends lentement.'],
    mistakes: ['Balancer le buste.', 'Coudes qui avancent.'], easy: 'Bouteilles à moitié vides.', hard: 'Redescends en 5 s.'
  });
  E('marche-genoux-hauts', 'Marche genoux hauts (sans impact)', 6, 1, [], 'rep', [20, 24, 30, 36, 44], 'f', {
    works: 'Cardio doux, cuisses, abdominaux', dose: '3 séries de 24 à 40 pas',
    exec: 'Marche sur place en montant les genoux à hauteur de hanche, sans sauter, bras en rythme.',
    steps: ['Debout, dos droit.', 'Monte un genou à hauteur de hanche.', 'Alterne en rythme, bras opposés.', 'Garde un pied au sol à chaque pas.'],
    mistakes: ['Se pencher en arrière.', 'Sauter.'], easy: 'Genoux moins hauts.', hard: 'Accélère le rythme.'
  });
  E('pas-chasses', 'Pas chassés latéraux', 6, 2, [], 'rep', [20, 24, 30, 36, 44], 'f', {
    works: 'Cardio, fessiers, abducteurs', dose: '3 séries de 24 à 40 pas',
    exec: 'Genoux légèrement fléchis, déplace-toi de côté en pas chassés, puis reviens.',
    steps: ['Position basse, genoux fléchis.', 'Pas de côté, le second pied rejoint le premier.', 'Fais 4 pas puis change de sens.', 'Garde le buste droit.'],
    mistakes: ['Croiser les pieds.', 'Se redresser trop.'], easy: 'Position moins basse.', hard: 'Ajoute un squat à chaque bout.', view: 'front'
  });
  E('etirement-fessiers-allongee', 'Étirement des fessiers allongée', 7, 1, [], 'secside', [20, 25, 30, 35, 40], 'f', {
    works: 'Fessiers, hanches', dose: '2 tenues de 20 à 40 s par côté', warn: 'Étire sans douleur.', gacha: false,
    exec: 'Allongée, croise une cheville sur le genou opposé et tire la jambe vers toi.',
    steps: ['Dos au sol, genoux pliés.', 'Cheville sur le genou opposé.', 'Tire la cuisse vers la poitrine.', 'Respire lentement.'],
    mistakes: ['Soulever la tête.', 'Forcer.'], easy: 'Garde la tête au sol.', hard: 'Tiens 40 s.'
  });

  /* =============== VERSION HOMME : force, tempo lent, pauses =============== */
  E('pompes-pause', 'Pompes avec pause en bas', 1, 3, [], 'rep', [4, 6, 8, 12, 16], 'm', {
    works: 'Pectoraux, triceps, épaules', dose: '3 séries de 6 à 10',
    exec: 'Descends, tiens 2 secondes poitrine à 2 cm du sol, puis repousse sans élan.',
    steps: ['Corps aligné, mains sous les épaules.', 'Descends en 2 secondes.', 'Tiens 2 secondes en bas.', 'Repousse explosif.'],
    mistakes: ['Bassin qui tombe.', 'Poser la poitrine au sol.'], easy: 'Pause de 1 s ou genoux.', hard: 'Pause de 4 s.', cam: S('side', 'elbow', 40, 'rep')
  });
  E('pompes-lentes', 'Pompes lentes (4 secondes)', 1, 4, [], 'rep', [3, 5, 7, 10, 14], 'm', {
    works: 'Pectoraux, triceps, tronc', dose: '3 séries de 5 à 8',
    exec: 'Descends en 4 secondes, remonte en 2 : le muscle reste sous tension tout le long.',
    steps: ['Corps aligné, ventre serré.', 'Descends en comptant jusqu\'à 4.', 'Remonte en comptant jusqu\'à 2.', 'Ne bloque pas les coudes en haut.'],
    mistakes: ['Accélérer en bas.', 'Cambrer.'], easy: 'Descends en 2 s.', hard: 'Descends en 6 s.', cam: S('side', 'elbow', 40, 'rep')
  });
  E('squat-sac-lourd', 'Squat avec sac lourd', 3, 3, ['bag'], 'rep', [8, 10, 12, 15, 18], 'm', {
    works: 'Cuisses, fessiers, dos', dose: '3 séries de 10 à 15',
    exec: 'Sac chargé tenu contre la poitrine : descends sous le parallèle, buste droit, puis pousse dans les talons.',
    steps: ['Sac contre la poitrine, coudes serrés.', 'Descends en gardant le dos droit.', 'Cuisses au moins parallèles au sol.', 'Remonte en poussant dans les talons.'],
    mistakes: ['Dos qui s\'arrondit.', 'Talons qui décollent.'], easy: 'Sac moins lourd.', hard: 'Pause de 3 s en bas.'
  });
  E('fente-bulgare-lente', 'Fente bulgare lente', 3, 4, ['chair'], 'side', [6, 8, 10, 12, 14], 'm', {
    works: 'Cuisses, fessiers, équilibre', dose: '3 séries de 6 à 10 par jambe', warn: 'Chaise calée contre un mur.',
    exec: 'Pied arrière sur une chaise : descends en 3 secondes, remonte en poussant sur la jambe avant.',
    steps: ['Pied arrière posé sur la chaise.', 'Descends en 3 secondes.', 'Genou avant au-dessus de la cheville.', 'Remonte sans élan.'],
    mistakes: ['Pied avant trop près.', 'Buste penché.'], easy: 'Sans chaise.', hard: 'Ajoute le sac chargé.'
  });
  E('dips-chaise-pause', 'Dips sur chaise avec pause', 1, 3, ['chair'], 'rep', [6, 8, 10, 12, 15], 'm', {
    works: 'Triceps, épaules', dose: '3 séries de 8 à 12', warn: 'Chaise calée contre un mur.',
    exec: 'Descends en pliant les coudes, tiens 2 secondes en bas, remonte en tendant les bras.',
    steps: ['Mains sur le bord de la chaise.', 'Descends en gardant le dos près de la chaise.', 'Pause de 2 s, coudes à 90°.', 'Remonte en poussant.'],
    mistakes: ['Épaules qui montent.', 'Descendre trop bas.'], easy: 'Pieds plus près.', hard: 'Jambes tendues.'
  });
  E('rowing-sac-pause', 'Rowing au sac avec pause', 2, 3, ['bag'], 'rep', [8, 10, 12, 14, 16], 'm', {
    works: 'Dos, biceps, épaules arrière', dose: '3 séries de 10 à 12',
    exec: 'Penché en avant, tire le sac vers le nombril, serre les omoplates 2 secondes, redescends lentement.',
    steps: ['Buste penché, dos plat.', 'Tire le sac vers le nombril.', 'Serre les omoplates 2 secondes.', 'Redescends en 3 secondes.'],
    mistakes: ['Dos rond.', 'Tirer avec l\'élan.'], easy: 'Sac moins lourd.', hard: 'Une main à la fois.'
  });
  E('planche-jambe-levee', 'Planche jambe levée', 4, 3, [], 'secside', [10, 12, 15, 20, 25], 'm', {
    works: 'Tronc, fessiers, épaules', dose: '3 tenues de 10 à 20 s par jambe',
    exec: 'En planche, lève une jambe tendue à hauteur des fesses sans bouger le bassin.',
    steps: ['Planche bien alignée.', 'Lève une jambe tendue.', 'Garde le bassin immobile.', 'Change de jambe.'],
    mistakes: ['Bassin qui tourne.', 'Dos creusé.'], easy: 'Planche simple.', hard: 'Tiens 30 s.'
  });
  E('crunch-velo-lent', 'Crunch vélo lent', 4, 3, [], 'side', [8, 10, 12, 15, 18], 'm', {
    works: 'Abdominaux, obliques', dose: '3 séries de 10 à 15 par côté',
    exec: 'Allongé, coude vers le genou opposé en pédalant lentement, épaules décollées tout le temps.',
    steps: ['Dos au sol, mains aux tempes.', 'Monte un genou, tourne le buste vers lui.', 'Change lentement de côté.', 'Garde la nuque relâchée.'],
    mistakes: ['Tirer sur la nuque.', 'Aller trop vite.'], easy: 'Rythme normal.', hard: 'Pause de 2 s à chaque côté.'
  });

  /* ---------- animations (variantes des mouvements de base) ---------- */
  V('squat-sumo', 'curtsy-lunge', { k: 1.2 });
  A['curtsy-lunge'] = {
    view: 'front', loop: 'pingpong', hold: 250, muscles: ['glutes', 'quads', 'hamstrings'],
    frames: [
      F(FRONT({ hip: [200, 118], arm: [{ r: [8, 46] }, { r: [-8, 46] }], leg: [{ t: [190, AK] }, { t: [210, AK] }] }), 900),
      F(FRONT({ hip: [198, 156], arm: [{ r: [8, 46] }, { r: [-8, 46] }], leg: [{ t: [182, AK] }, { t: [226, AK] }] }), 1000)
    ]
  };
  V('squat-sumo', 'squat-sumo-pulse', { k: 0.55, hold: 100 });
  V('squat-sumo', 'squat-sumo-pause', { k: 1.2, hold: 2800 });
  V('pont-fessier', 'pont-fessier-pause', { hold: 2800 });
  {
    const mk = (th, l1) => { const t = supine(th); t.arm = [{ a: [0, 0] }, { a: [2, 2] }]; t.leg = [{ t: [282, AK] }, l1 || { t: [288, AK] }]; return t; };
    A['pont-fessier-marche'] = { view: 'side', loop: 'pingpong', hold: 300, props: [MAT], muscles: ['glutes', 'hamstrings', 'core'], frames: [F(mk(40), 900), F(mk(40, { r: [40, -66] }), 1000)] };
  }
  V('donkey-kick', 'donkey-kick-pulse', { k: 0.4, hold: 80 });
  {
    const st = (o) => STAND(Object.assign({ arm: [{ t: [250, 98] }, { t: [250, 102] }] }, o));
    A['kickback-genou-plie'] = { view: 'side', loop: 'pingpong', hold: 400, props: [{ k: 'wall', x: 252 }], muscles: ['glutes', 'hamstrings'], frames: [F(st({ leg: [{ t: [200, AK] }, { a: [100, 190] }] }), 900), F(st({ torso: -86, leg: [{ t: [200, AK] }, { a: [160, 232] }] }), 900)] };
  }
  V('fentes-laterales', 'fente-laterale-lente', { k: 1.6, hold: 800 });
  V('squats', 'squat-chaise-doux', { k: 1.3, hold: 500, props: [{ k: 'chair', x: 118, h: 52, back: 'left' }] });
  V('crunch', 'crunch-lent', { k: 1.8, hold: 1800 });
  V('planche-genoux', 'planche-genoux-lente', {});
  V('curl-marteau', 'curl-bouteilles-lent', { k: 1.8, hold: 600 });
  V('montees-genoux', 'marche-genoux-hauts', { k: 1.6 });
  V('squat-sumo', 'pas-chasses', { k: 0.8 });
  V('pont-fessier', 'etirement-fessiers-allongee', { k: 1.4, hold: 3000 });
  V('pompes-classiques', 'pompes-pause', { k: 1.1, hold: 1800 });
  V('pompes-classiques', 'pompes-lentes', { k: 2.4, hold: 600 });
  V('squats', 'squat-sac-lourd', { k: 1.4, hold: 1200 });
  V('squat-bulgare', 'fente-bulgare-lente', { k: 1.8, hold: 900 });
  V('dips-chaise', 'dips-chaise-pause', { k: 1.2, hold: 1800 });
  V('rowing-sac', 'rowing-sac-pause', { k: 1.4, hold: 1800 });
  V('planche', 'planche-jambe-levee', {});
  V('crunch-velo', 'crunch-velo-lent', { k: 1.9 });

  /* ───────── Parcours féminin : buste et posture, souplesse (fiches ajoutées) ───────── */
  E('presse-paumes-lente', 'Presse de paumes lente', 1, 2, [], 'sec', [12, 16, 20, 25, 30], 'f', {
    works: 'Buste, poitrine, épaules (tonicité douce)', dose: '3 séries de 15 à 25 secondes',
    exec: 'Paumes jointes devant la poitrine, coudes écartés : presse les mains l\'une contre l\'autre en expirant, relâche très lentement.',
    steps: ['Debout ou assise, dos droit, paumes jointes à hauteur de poitrine.', 'Presse les paumes l\'une contre l\'autre, sans lever les épaules.', 'Tiens en respirant calmement, puis relâche lentement.'],
    mistakes: ['Hausser les épaules.', 'Retenir sa respiration.'], easy: 'Presse moins fort.', hard: 'Monte les mains au-dessus de la tête, puis descends.',
    cam: S('front', 'manual', 0, 'manual')
  });
  E('presse-paumes-pause', 'Presse de paumes avec pause', 1, 3, [], 'sec', [10, 14, 18, 22, 26], 'f', {
    works: 'Buste, poitrine, épaules', dose: '3 séries de 10 à 20 secondes',
    exec: 'Même geste que la presse de paumes, mais tu marques une pause de 3 secondes à chaque pression maximale.',
    steps: ['Paumes jointes devant la poitrine.', 'Presse fort pendant 3 secondes.', 'Relâche, respire, recommence.'],
    mistakes: ['Pousser avec le haut du dos.', 'Plier les poignets.'], easy: 'Pause de 1 seconde.', hard: 'Pause de 5 secondes.',
    cam: S('front', 'manual', 0, 'manual')
  });
  V('presse-paumes', 'presse-paumes-lente', { k: 1.8, hold: 900 });
  V('presse-paumes', 'presse-paumes-pause', { k: 1.2, hold: 2200 });

  E('souplesse-fente-basse', 'Fente basse (ouverture des hanches)', 7, 2, [], 'secside', [15, 20, 25, 30, 40], 'f', {
    works: 'Souplesse des hanches, fléchisseurs, cuisses', dose: '2 à 3 passages de 20 à 30 secondes par côté',
    exec: 'Un genou au sol, l\'autre pied devant : pousse doucement le bassin vers l\'avant, buste droit, jusqu\'à sentir l\'étirement devant la hanche.',
    steps: ['Un genou au sol (sur un coussin), l\'autre pied en avant.', 'Pousse le bassin vers l\'avant, dos droit.', 'Tiens en respirant lentement, puis change de côté.'],
    mistakes: ['Cambrer le bas du dos.', 'Rebondir.'], easy: 'Pied avant sur une marche.', hard: 'Lève le bras du côté du genou au sol.',
    cam: S('side', 'manual', 0, 'manual')
  });
  V('fentes-arriere', 'souplesse-fente-basse', { k: 2.2, hold: 3000 });
  E('souplesse-pont-doux', 'Pont doux (souplesse du dos)', 7, 2, [], 'sec', [15, 20, 25, 30, 40], 'f', {
    works: 'Souplesse de la colonne, fessiers, hanches', dose: '3 maintiens de 15 à 30 secondes',
    exec: 'Sur le dos, genoux pliés : monte le bassin lentement, vertèbre après vertèbre, tiens en haut en respirant, puis redescends en déroulant.',
    steps: ['Sur le dos, pieds à plat à la largeur du bassin.', 'Monte le bassin en déroulant le dos.', 'Tiens en haut, respire, puis redescends lentement.'],
    mistakes: ['Monter trop haut en cambrant les lombaires.', 'Pousser sur la nuque.'], easy: 'Monte moins haut.', hard: 'Lève un pied du sol.',
    cam: S('side', 'manual', 0, 'manual')
  });
  V('pont-fessier', 'souplesse-pont-doux', { k: 2.0, hold: 3200 });
  E('souplesse-chat-vache-lent', 'Chat-vache très lent', 7, 1, [], 'rep', [6, 8, 10, 12, 14], 'f', {
    works: 'Souplesse de la colonne, dos, ventre', dose: '2 séries de 8 à 12 mouvements lents',
    exec: 'À quatre pattes : creuse le dos en inspirant, arrondis-le en expirant, très lentement, en suivant ta respiration.',
    steps: ['À quatre pattes, mains sous les épaules.', 'Inspire : creuse le dos, regard vers l\'avant.', 'Expire : arrondis le dos, menton vers la poitrine.'],
    mistakes: ['Aller trop vite.', 'Forcer l\'amplitude.'], easy: 'Amplitude réduite.', hard: 'Marque 3 secondes à chaque extrémité.',
    cam: S('side', 'manual', 0, 'manual')
  });
  V('chat-vache', 'souplesse-chat-vache-lent', { k: 2.0, hold: 900 });
  /* les étirements existants sont tirables dans la version femme (souplesse) : voir gachaengine.eligible */
})(window);
