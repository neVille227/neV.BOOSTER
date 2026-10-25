/* ==========================================================
   neV.BOOSTER — ex-more.js
   41 exercices en plus (cou, épaules, doigts, dorsaux, obliques,
   lombaires, mollets…) pour que chaque zone du corps en compte
   plusieurs. Chargé après ex-data.js et ex-anim.js, avant exercises.js.
   `zoneOnly` : l'exercice ne sort au gacha quotidien « tout le corps »
   que si le joueur a choisi cette zone (Spécialisation).
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const { X, S } = NEV.DataKit;
  const { A, P, F, STAND, FRONT, plank, kneel, supine, PRONE, MAT, R, AK, FL, HY, dirv, onFloor } = NEV.AnimKit;
  const D = NEV.EX_DATA;
  const mark = (id, extra) => { const e = D.find((x) => x.id === id); if (e) Object.assign(e, extra); };

  /* ====================== COU ====================== */
  X('cou-flexion-iso', 'Cou : poussée du front (isométrique)', 7, 1, [], 'sec', [10, 15, 20, 25, 30], {
    works: 'Muscles avant du cou', dose: '2 à 3 tenues de 10 à 20 s', warn: 'Pousse très doucement : jamais de mouvement brusque, jamais de douleur dans le cou.',
    exec: 'Pose la paume sur le front. Pousse la tête vers la main, la main résiste : rien ne bouge. Tiens, respire, relâche.',
    steps: ['Debout ou assis, dos droit, regard à l\'horizontale.', 'Pose la main à plat sur le front.', 'Pousse doucement la tête contre la main, 70 % de ta force au plus, sans bouger.', 'Tiens en respirant, puis relâche lentement.'],
    mistakes: ['Pousser fort ou par à-coups.', 'Retenir sa respiration.', 'Cambrer le dos ou avancer le menton.'], easy: 'Pousse à 30 % de ta force.', hard: 'Tiens plus longtemps (30 s).', cam: S('side', 'presence', 0, 'presence'), gacha: true, zoneOnly: true
  });
  X('cou-extension-iso', 'Cou : poussée de la nuque (isométrique)', 7, 1, [], 'sec', [10, 15, 20, 25, 30], {
    works: 'Muscles arrière du cou, trapèzes', dose: '2 à 3 tenues de 10 à 20 s', warn: 'Intensité douce et progressive. Arrête-toi au moindre pincement.',
    exec: 'Mains croisées derrière la tête. Pousse la tête vers l\'arrière contre les mains qui résistent, sans bouger.',
    steps: ['Mains croisées derrière la tête, coudes ouverts.', 'Pousse doucement la tête en arrière, les mains résistent.', 'Garde le menton légèrement rentré, nuque longue.', 'Relâche progressivement.'],
    mistakes: ['Tirer sur la nuque avec les mains.', 'Cambrer la tête en arrière sans résistance.'], easy: 'Une seule main en soutien.', hard: 'Tenue de 30 s.', cam: S('side', 'presence', 0, 'presence'), gacha: true, zoneOnly: true
  });
  X('cou-lateral-iso', 'Cou : poussée sur le côté (isométrique)', 7, 1, [], 'secside', [8, 12, 15, 20, 25], {
    works: 'Muscles latéraux du cou', dose: '2 tenues de 10 à 15 s par côté', warn: 'Reste doux. Ne tourne pas la tête : tu pousses, c\'est tout.',
    exec: 'Pose la main sur le côté de la tête, oreille vers l\'épaule. Pousse la tête contre la main qui résiste.',
    steps: ['Debout face à un miroir ou à un mur, épaules basses.', 'Main à plat sur le côté de la tête.', 'Pousse la tête vers la main, la main résiste : pas de mouvement.', 'Change de côté.'],
    mistakes: ['Lever l\'épaule vers l\'oreille.', 'Pousser trop fort.'], easy: 'Pression légère.', hard: 'Tenue plus longue.', cam: S('front', 'presence', 0, 'presence'), gacha: true, zoneOnly: true
  });
  X('menton-rentre', 'Menton rentré (posture)', 7, 1, [], 'rep', [8, 10, 12, 12, 15], {
    works: 'Muscles profonds du cou, posture', dose: '2 séries de 8 à 12',
    exec: 'Debout, rentre le menton comme pour faire un double menton en gardant le regard droit, tiens 3 secondes, relâche.',
    steps: ['Debout, dos contre un mur si possible.', 'Rentre doucement le menton, la nuque s\'allonge.', 'Tiens 3 secondes.', 'Relâche et recommence.'],
    mistakes: ['Baisser la tête au lieu de la reculer.', 'Forcer.'], easy: 'Contre un mur.', hard: 'Tiens 5 secondes.', cam: S('side', 'manual', 0, 'manual'), gacha: true, zoneOnly: true
  });
  X('haussements-epaules', 'Haussements d\'épaules (trapèzes)', 2, 2, ['bottle'], 'rep', [10, 12, 15, 18, 22], {
    works: 'Trapèzes, cou', dose: '3 séries de 12 à 15',
    exec: 'Debout, une bouteille d\'eau pleine dans chaque main. Monte les épaules vers les oreilles, tiens une seconde, redescends.',
    steps: ['Debout, bras le long du corps, charge dans les mains.', 'Monte les épaules vers les oreilles, sans plier les coudes.', 'Tiens une seconde en haut.', 'Redescends lentement.'],
    mistakes: ['Faire tourner les épaules.', 'Charge trop lourde.'], easy: 'Sans charge.', hard: 'Tiens 3 secondes.', cam: S('front', 'manual', 0, 'manual'), gacha: true, zoneOnly: true
  });
  X('etirement-cou', 'Étirement doux du cou', 7, 1, [], 'secside', [20, 25, 30, 30, 30], {
    works: 'Muscles latéraux du cou, trapèzes', dose: '20 à 30 secondes par côté', gacha: false,
    exec: 'Penche l\'oreille vers l\'épaule, laisse le poids de la main accentuer très légèrement l\'étirement.',
    steps: ['Assis ou debout, épaules relâchées.', 'Penche doucement la tête sur le côté.', 'Pose la main sur la tête, sans tirer.', 'Respire lentement, puis change de côté.'],
    mistakes: ['Tirer sur la tête.', 'Monter l\'épaule.'], easy: 'Sans la main.', hard: 'Regard vers le bas.', cam: S('front', 'presence', 0, 'presence')
  });

  /* ====================== ÉPAULES ====================== */
  X('elevations-laterales', 'Élévations latérales', 1, 2, ['bottle'], 'rep', [8, 10, 12, 15, 18], {
    works: 'Épaules (deltoïdes)', dose: '3 séries de 10 à 15',
    exec: 'Debout, une bouteille d\'eau dans chaque main. Monte les bras sur les côtés jusqu\'à la hauteur des épaules, puis redescends lentement.',
    steps: ['Debout, bras le long du corps, coudes à peine pliés.', 'Monte les bras sur les côtés jusqu\'à l\'horizontale.', 'Marque un temps, sans lancer les bras.', 'Redescends en 2 secondes.'],
    mistakes: ['Balancer le buste.', 'Monter au-dessus des épaules.'], easy: 'Sans bouteille.', hard: 'Bouteilles plus lourdes ou descente en 4 s.', cam: S('front', 'wristup', 0.5, 'rep'), gacha: true
  });
  X('elevations-frontales', 'Élévations frontales', 1, 2, ['bottle'], 'rep', [8, 10, 12, 15, 18], {
    works: 'Épaules (avant), haut des pectoraux', dose: '3 séries de 10 à 12',
    exec: 'Debout, une bouteille dans chaque main. Monte les bras devant toi jusqu\'à hauteur des yeux, puis redescends lentement.',
    steps: ['Debout, dos droit, bouteilles devant les cuisses.', 'Monte les bras tendus devant toi jusqu\'à l\'horizontale.', 'Redescends en contrôlant.'],
    mistakes: ['Se pencher en arrière.', 'Monter trop vite.'], easy: 'Un bras à la fois, sans bouteille.', hard: 'Tempo lent 3-1-3.', cam: S('side', 'wristup', 0.4, 'rep'), gacha: true
  });
  X('developpe-bouteilles', 'Développé au-dessus de la tête', 1, 3, ['bottle'], 'rep', [6, 8, 10, 12, 15], {
    works: 'Épaules, triceps', dose: '3 séries de 8 à 12',
    exec: 'Debout, bouteilles à hauteur d\'épaules. Pousse-les au-dessus de la tête, bras tendus, puis redescends à hauteur d\'épaules.',
    steps: ['Bouteilles à hauteur d\'épaules, coudes sous les poignets.', 'Pousse au-dessus de la tête en expirant.', 'Redescends lentement.'],
    mistakes: ['Cambrer le bas du dos.', 'Pousser vers l\'avant.'], easy: 'Sans charge, en position assise.', hard: 'Bouteilles pleines + 1 seconde de tenue.', cam: S('front', 'wristup', 0.6, 'rep'), gacha: true
  });
  X('rowing-vertical-bouteilles', 'Tirage vertical (menton)', 1, 3, ['bottle'], 'rep', [8, 10, 12, 14, 16], {
    works: 'Épaules, trapèzes, biceps', dose: '3 séries de 10 à 12', warn: 'Monte les coudes sans dépasser la hauteur des épaules.',
    exec: 'Debout, bouteilles devant les cuisses. Tire-les vers le haut du torse en menant avec les coudes, puis redescends.',
    steps: ['Bouteilles devant les cuisses, mains proches.', 'Monte en menant avec les coudes, jusqu\'au bas du torse.', 'Redescends en contrôlant.'],
    mistakes: ['Monter les coudes trop haut.', 'Se balancer.'], easy: 'Mains plus écartées, sans charge.', hard: 'Tempo lent.', cam: S('front', 'wristup', 0.35, 'rep'), gacha: true
  });
  X('cercles-bras', 'Cercles de bras', 1, 1, [], 'rep', [10, 12, 15, 18, 20], {
    works: 'Épaules (mobilité et endurance)', dose: '2 séries de 10 à 15 cercles par sens',
    exec: 'Bras tendus sur les côtés, fais de petits cercles de plus en plus grands, puis dans l\'autre sens.',
    steps: ['Bras tendus à l\'horizontale, épaules basses.', 'Petits cercles vers l\'avant.', 'Agrandis progressivement, puis inverse le sens.'],
    mistakes: ['Hausser les épaules.', 'Aller trop vite.'], easy: 'Petits cercles.', hard: 'Avec des bouteilles légères.', cam: S('front', 'manual', 0, 'manual'), gacha: true
  });

  /* ====================== TRICEPS ====================== */
  X('dips-sol', 'Dips au sol', 1, 2, [], 'rep', [6, 8, 10, 12, 15], {
    works: 'Triceps, épaules', dose: '3 séries de 8 à 12',
    exec: 'Assis au sol, mains derrière toi, genoux pliés. Soulève le bassin, plie les coudes pour descendre, puis repousse.',
    steps: ['Assis, mains à plat derrière toi, doigts vers les pieds.', 'Soulève les fesses du sol.', 'Plie les coudes vers l\'arrière, sans descendre trop bas.', 'Repousse le sol jusqu\'à tendre les bras.'],
    mistakes: ['Écarter les coudes.', 'Descendre trop bas, épaules en avant.'], easy: 'Pieds plus près des fesses.', hard: 'Jambes tendues.', cam: S('side', 'elbow', 35, 'rep'), gacha: true
  });

  /* ====================== BICEPS ====================== */
  X('tractions-supination', 'Tractions prise serrée (menton)', 5, 4, ['bar'], 'rep', [1, 2, 4, 6, 8], {
    works: 'Biceps, dos', dose: 'Séries courtes : moitié de ton maximum', gacha: false, special: 'tractions',
    warn: 'Utilise une vraie barre fixée solidement. Jamais une porte, une table bancale ou une branche douteuse.',
    exec: 'Mains à la largeur des épaules, paumes vers toi, suspends-toi bras tendus puis monte le menton au-dessus de la barre.',
    steps: ['Prise paumes vers toi, largeur d\'épaules.', 'Suspension active : épaules loin des oreilles.', 'Tire les coudes vers les hanches, menton au-dessus de la barre.', 'Redescends en 2 à 3 secondes.'],
    mistakes: ['Se balancer avec les jambes.', 'Demi-amplitude.'], easy: 'Descentes lentes seulement.', hard: 'Pause de 2 s en haut.', cam: S('front', 'shy', 0.25, 'rep'), fromMax: 0.5, fromMin: 1, fromCap: 40
  });
  /* ====================== AVANT-BRAS ====================== */
  X('curl-inverse', 'Curl inversé (prise dessus)', 5, 2, ['bottle'], 'rep', [8, 10, 12, 15, 18], {
    works: 'Avant-bras, biceps', dose: '3 séries de 10 à 12',
    exec: 'Bouteilles en prise dessus (paumes vers le sol). Plie les coudes pour monter les poings, puis redescends lentement.',
    steps: ['Prise dessus, bras le long du corps.', 'Monte en gardant les poignets droits.', 'Redescends en 2 secondes.'],
    mistakes: ['Casser les poignets.', 'Balancer le buste.'], easy: 'Bouteilles à moitié vides.', hard: 'Descente en 4 s.', cam: S('side', 'elbow', 45, 'rep'), gacha: true
  });
  X('farmer-hold', 'Tenue du fermier (prise statique)', 5, 2, ['bag'], 'sec', [20, 25, 30, 40, 50], {
    works: 'Avant-bras, doigts, trapèzes', dose: '2 à 3 tenues de 20 à 40 s',
    exec: 'Debout, un sac chargé tenu par la poignée dans une main. Tiens, épaules basses, dos droit.',
    steps: ['Saisis la poignée du sac, bras tendu.', 'Redresse-toi, épaule basse, regard droit.', 'Tiens le temps prévu en respirant.', 'Change de main.'],
    mistakes: ['Pencher le buste du côté du sac.', 'Lâcher d\'un coup.'], easy: 'Sac plus léger.', hard: 'Deux sacs.', cam: S('side', 'presence', 0, 'presence'), gacha: true
  });

  /* ====================== DOIGTS ET MAINS ====================== */
  X('ouverture-fermeture-mains', 'Ouvrir et fermer les mains', 5, 1, [], 'rep', [15, 20, 25, 30, 40], {
    works: 'Doigts, avant-bras', dose: '2 séries de 20 à 30', warn: 'Mouvements fluides, sans douleur dans les doigts.',
    exec: 'Bras devant toi, ferme les poings très fort, puis ouvre grand les mains en écartant les doigts au maximum.',
    steps: ['Coudes pliés, mains devant toi.', 'Ferme les poings à fond 1 seconde.', 'Ouvre en écartant tous les doigts.', 'Recommence à rythme régulier.'],
    mistakes: ['Aller trop vite.', 'Serrer les épaules.'], easy: 'Mouvement lent.', hard: 'Ajoute 2 s de contraction.', cam: S('side', 'manual', 0, 'manual'), gacha: true, zoneOnly: true
  });
  X('pincement-serviette', 'Pincement de serviette', 5, 2, ['towel'], 'sec', [10, 15, 20, 25, 30], {
    works: 'Doigts, pouce, avant-bras', dose: '3 tenues de 15 à 30 s',
    exec: 'Pince le bout d\'une serviette roulée entre le pouce et les doigts, sans la lâcher.',
    steps: ['Roule la serviette et saisis un bout entre le pouce et les doigts.', 'Serre fort, bras plié.', 'Tiens le temps prévu.', 'Change de main.'],
    mistakes: ['Serrer avec tout le bras.', 'Retenir sa respiration.'], easy: 'Serviette fine.', hard: 'Serviette mouillée.', cam: S('side', 'presence', 0, 'presence'), gacha: true, zoneOnly: true
  });
  X('pompes-doigts', 'Pompes sur le bout des doigts', 1, 5, [], 'rep', [2, 3, 5, 8, 12], {
    works: 'Doigts, poignets, pectoraux, triceps', dose: '2 séries de 3 à 8', warn: 'Exercice avancé : commence sur les genoux et sur les phalanges, jamais en forçant sur les articulations.',
    exec: 'Position de pompe, mains posées sur le bout des doigts. Plie les coudes, puis repousse.',
    steps: ['Mains en appui sur les doigts écartés, corps gainé.', 'Descends en contrôlant.', 'Repousse jusqu\'à tendre les bras.'],
    mistakes: ['Forcer sur des doigts non préparés.', 'Creuser le dos.'], easy: 'Sur les genoux.', hard: 'Pompes diamant sur doigts.', cam: S('side', 'elbow', 40, 'rep'), gacha: true, zoneOnly: true
  });

  /* ====================== POITRINE ====================== */
  X('pompes-larges', 'Pompes mains écartées', 1, 3, [], 'rep', [3, 5, 8, 12, 16], {
    works: 'Pectoraux, épaules', dose: '3 séries de 6 à 12',
    exec: 'Mains nettement plus larges que les épaules. Descends la poitrine vers le sol, puis repousse.',
    steps: ['Mains larges, corps gainé.', 'Descends en gardant les coudes à 45 à 60° du corps.', 'Repousse jusqu\'à tendre les bras.'],
    mistakes: ['Écarter trop les mains (épaules en danger).', 'Creuser le dos.'], easy: 'Sur les genoux.', hard: 'Pieds surélevés.', cam: S('side', 'elbow', 40, 'rep'), gacha: true
  });
  X('presse-paumes', 'Presse de paumes', 1, 1, [], 'sec', [10, 15, 20, 25, 30], {
    works: 'Pectoraux (intérieur), épaules', dose: '3 tenues de 10 à 20 s',
    exec: 'Paumes jointes devant la poitrine, coudes écartés. Presse fort les mains l\'une contre l\'autre.',
    steps: ['Mains jointes au niveau du sternum.', 'Presse les paumes, coudes à hauteur des mains.', 'Tiens en respirant.'],
    mistakes: ['Hausser les épaules.', 'Retenir sa respiration.'], easy: 'Pression légère.', hard: 'Tiens 30 s.', cam: S('front', 'presence', 0, 'presence'), gacha: true
  });

  /* ====================== DOS ET DORSAUX ====================== */
  X('retraction-omoplates', 'Rapprochement des omoplates', 2, 1, [], 'rep', [10, 12, 15, 15, 20], {
    works: 'Milieu du dos, rhomboïdes, arrière des épaules', dose: '3 séries de 12 à 15',
    exec: 'Bras devant toi, ramène les coudes vers l\'arrière en serrant les omoplates comme pour tenir un crayon entre elles.',
    steps: ['Debout, bras tendus devant toi.', 'Plie les coudes et ramène-les derrière le buste.', 'Serre les omoplates 1 seconde.', 'Reviens lentement.'],
    mistakes: ['Hausser les épaules.', 'Cambrer le dos.'], easy: 'Contre un mur.', hard: 'Tiens 3 secondes.', cam: S('side', 'elbow', 55, 'rep'), gacha: true
  });
  X('tractions', 'Tractions', 2, 4, ['bar'], 'rep', [1, 2, 4, 6, 8], {
    works: 'Grand dorsal, biceps, avant-bras', dose: 'Séries courtes : la moitié de ton maximum de pompes', gacha: false, special: 'tractions',
    warn: 'Utilise une vraie barre fixée solidement. Jamais une porte, une table bancale ou une branche douteuse.',
    exec: 'Suspendu à la barre, bras tendus. Tire les coudes vers les hanches jusqu\'à passer le menton au-dessus de la barre, puis redescends lentement.',
    steps: ['Mains un peu plus larges que les épaules, suspension active.', 'Tire les coudes vers le bas, poitrine vers la barre.', 'Menton au-dessus de la barre.', 'Redescends en 2 à 3 secondes, bras presque tendus.'],
    mistakes: ['Se balancer ou donner des coups de jambes.', 'Faire des demi-amplitudes.'], easy: 'Tractions inversées ou descentes lentes.', hard: 'Pause de 2 s en haut.', cam: S('front', 'shy', 0.25, 'rep'), fromMax: 0.5, fromMin: 1, fromCap: 40
  });
  X('tractions-inversees', 'Tractions inversées sous une table', 2, 4, ['table'], 'rep', [3, 5, 8, 10, 12], {
    works: 'Grand dorsal, haut du dos, biceps', dose: 'Séries courtes : la moitié de ton maximum de pompes', gacha: false, special: 'tractions',
    warn: 'La table doit être très lourde, stable et ne pas glisser (plaque-la contre un mur). Sinon, ne fais pas cet exercice.',
    exec: 'Allongé sous une table solide, saisis le bord, corps gainé. Tire la poitrine vers le bord, puis redescends lentement.',
    steps: ['Allonge-toi sous le bord de la table, mains en prise sur le bord.', 'Corps en ligne droite, talons au sol.', 'Tire la poitrine vers le bord.', 'Redescends lentement.'],
    mistakes: ['Hanches qui tombent.', 'Table qui bouge.'], easy: 'Genoux pliés.', hard: 'Pieds surélevés.', cam: S('side', 'elbow', 40, 'rep'), fromMax: 0.5, fromMin: 1, fromCap: 40
  });
  X('pullover-sac', 'Pull-over avec sac', 2, 3, ['bag'], 'rep', [6, 8, 10, 12, 15], {
    works: 'Grand dorsal, pectoraux, triceps', dose: '3 séries de 8 à 12',
    exec: 'Allongé sur le dos, un sac léger tenu à deux mains. Bras presque tendus : amène le sac derrière la tête, puis reviens au-dessus de la poitrine.',
    steps: ['Allongé, genoux pliés, sac au-dessus de la poitrine.', 'Descends le sac derrière la tête en gardant les bras quasi tendus.', 'Reviens en tirant avec les dorsaux.'],
    mistakes: ['Plier les coudes.', 'Cambrer le bas du dos.'], easy: 'Sac vide.', hard: 'Sac plus lourd, tempo lent.', cam: S('side', 'manual', 0, 'manual'), gacha: true
  });

  /* ====================== OBLIQUES ====================== */
  X('flexion-laterale-bouteille', 'Flexion latérale avec bouteille', 4, 2, ['bottle'], 'side', [8, 10, 12, 15, 18], {
    works: 'Obliques (côtes), flancs', dose: '3 séries de 10 à 15 par côté',
    exec: 'Debout, une bouteille dans une main. Penche le buste sur le côté de la bouteille, puis reviens en contractant le côté opposé.',
    steps: ['Pieds écartés, bouteille dans la main droite.', 'Penche-toi sur le côté sans tourner.', 'Remonte en serrant le flanc opposé.', 'Change de côté.'],
    mistakes: ['Pencher en avant.', 'Aller vite.'], easy: 'Sans charge.', hard: 'Bouteille plus lourde.', cam: S('front', 'hipx', 0, 'manual'), gacha: true
  });
  X('planche-laterale-genou', 'Planche latérale sur le genou', 4, 1, [], 'secside', [10, 15, 20, 25, 30], {
    works: 'Obliques, tronc, fessiers', dose: '2 à 3 tenues de 15 à 30 s par côté',
    exec: 'Sur le côté, genoux pliés, appui sur l\'avant-bras. Soulève le bassin pour aligner genoux, hanches et épaules.',
    steps: ['Allongé sur le côté, coude sous l\'épaule, genoux pliés.', 'Soulève le bassin.', 'Tiens en respirant.', 'Change de côté.'],
    mistakes: ['Bassin qui tombe.', 'Coude trop loin de l\'épaule.'], easy: 'Bassin plus bas.', hard: 'Planche latérale complète.', cam: S('side', 'presence', 0, 'presence'), gacha: true
  });
  X('planche-laterale-hanche', 'Planche latérale avec montées de hanche', 4, 4, [], 'side', [6, 8, 10, 12, 15], {
    works: 'Obliques, tronc, épaules', dose: '2 à 3 séries de 8 à 12 par côté',
    exec: 'En planche latérale, descends la hanche vers le sol puis remonte-la bien haut.',
    steps: ['Planche latérale sur l\'avant-bras.', 'Descends la hanche près du sol.', 'Remonte la hanche jusqu\'à l\'alignement.', 'Change de côté.'],
    mistakes: ['Pivoter le buste.', 'Aller trop vite.'], easy: 'Sur le genou.', hard: 'Bras libre tendu.', cam: S('side', 'manual', 0, 'manual'), gacha: true
  });
  X('toucher-pied-oppose', 'Flexion latérale vers la cheville', 4, 2, [], 'side', [8, 10, 12, 15, 18], {
    works: 'Obliques, tronc, ischio-jambiers', dose: '3 séries de 10 à 12 par côté',
    exec: 'Debout jambes écartées, penche-toi sur le côté en glissant la main le long de la jambe vers la cheville, l\'autre bras monte vers le plafond.',
    steps: ['Jambes écartées, genoux souples, bras en croix.', 'Penche le buste sur le côté et fais glisser la main vers la cheville.', 'L\'autre bras monte vers le plafond.', 'Reviens en contractant le flanc, puis change de côté.'],
    mistakes: ['Pencher vers l\'avant au lieu du côté.', 'Aller trop vite ou forcer en bas.'], easy: 'Main au genou.', hard: 'Ajoute une montée de talon.', cam: S('front', 'manual', 0, 'manual'), gacha: true
  });
  X('bucheron-bouteille', 'Bûcheron avec bouteille', 4, 3, ['bottle'], 'side', [8, 10, 12, 15, 18], {
    works: 'Obliques, épaules, fessiers', dose: '3 séries de 10 à 12 par côté',
    exec: 'Tiens une bouteille à deux mains en haut sur le côté. Descends en diagonale vers la hanche opposée en tournant le tronc.',
    steps: ['Bouteille en haut, au-dessus de l\'épaule.', 'Descends en diagonale en pivotant sur les pieds.', 'Remonte en contrôlant.', 'Change de côté.'],
    mistakes: ['Tourner le dos au lieu du tronc.', 'Bloquer les genoux.'], easy: 'Sans charge.', hard: 'Bouteille pleine, plus bas.', cam: S('front', 'twist', 0.4, 'rep'), gacha: true
  });

  /* ====================== LOMBAIRES ====================== */
  X('bonjour-sac', 'Good morning avec sac', 2, 2, ['bag'], 'rep', [8, 10, 12, 15, 18], {
    works: 'Bas du dos, fessiers, ischio-jambiers', dose: '3 séries de 10 à 12', warn: 'Dos toujours droit, jamais arrondi. Charge légère.',
    exec: 'Debout, sac contre la poitrine. Pousse les fesses vers l\'arrière en penchant le buste, dos plat, puis reviens.',
    steps: ['Pieds largeur de bassin, genoux souples, sac contre la poitrine.', 'Recule les fesses en penchant le buste, dos plat.', 'Descends jusqu\'à sentir l\'arrière des cuisses.', 'Reviens en poussant les hanches vers l\'avant.'],
    mistakes: ['Arrondir le dos.', 'Plier trop les genoux (c\'est un squat).'], easy: 'Sans sac.', hard: 'Sac plus lourd, tempo lent.', cam: S('side', 'hip', 28, 'rep'), gacha: true
  });
  X('genou-poitrine', 'Genou vers la poitrine (étirement)', 7, 1, [], 'secside', [20, 25, 30, 30, 30], {
    works: 'Bas du dos, fessiers', dose: '20 à 30 secondes par côté', gacha: false,
    exec: 'Allongé sur le dos, ramène un genou vers la poitrine avec les mains, l\'autre jambe reste allongée.',
    steps: ['Allongé, tête posée.', 'Ramène un genou vers la poitrine.', 'Respire lentement, relâche le bas du dos.', 'Change de jambe.'],
    mistakes: ['Soulever la tête.', 'Tirer fort.'], easy: 'Les deux pieds au sol.', hard: 'Ramène les deux genoux.', cam: S('side', 'presence', 0, 'presence')
  });

  /* ====================== FESSIERS ====================== */
  X('donkey-kick', 'Donkey kick', 3, 2, [], 'side', [8, 10, 12, 15, 18], {
    works: 'Fessiers', dose: '3 séries de 10 à 15 par jambe',
    exec: 'À quatre pattes, pousse un talon vers le plafond, genou à 90°, en serrant la fesse.',
    steps: ['À quatre pattes, dos plat.', 'Pousse le talon vers le plafond sans cambrer.', 'Serre la fesse 1 seconde.', 'Reviens sans poser le genou.'],
    mistakes: ['Cambrer le bas du dos.', 'Tourner le bassin.'], easy: 'Sans lever haut.', hard: 'Pause de 3 s en haut.', cam: S('side', 'manual', 0, 'manual'), gacha: true
  });
  X('hip-thrust-chaise', 'Hip thrust sur chaise', 3, 3, ['chair'], 'rep', [8, 10, 12, 15, 18], {
    works: 'Fessiers, ischio-jambiers', dose: '3 séries de 10 à 15', warn: 'Chaise calée contre un mur, jamais sur un sol qui glisse.',
    exec: 'Haut du dos contre le bord d\'une chaise stable, pieds au sol. Pousse les hanches vers le plafond, serre les fessiers, redescends.',
    steps: ['Omoplates sur le bord de l\'assise, pieds à plat.', 'Pousse les hanches vers le haut.', 'Serre les fessiers en haut, corps à l\'horizontale.', 'Redescends sans toucher le sol.'],
    mistakes: ['Cambrer le bas du dos.', 'Chaise qui glisse.'], easy: 'Pont fessier au sol.', hard: 'Une jambe.', cam: S('side', 'hip', 28, 'rep'), gacha: true
  });
  X('extension-hanche-debout', 'Extension de hanche debout', 3, 1, ['wall'], 'side', [8, 10, 12, 15, 18], {
    works: 'Fessiers, ischio-jambiers', dose: '2 à 3 séries de 10 à 15 par jambe',
    exec: 'Debout, main contre un mur. Envoie une jambe tendue vers l\'arrière en serrant la fesse, sans cambrer.',
    steps: ['Main contre le mur, buste droit.', 'Envoie la jambe tendue vers l\'arrière.', 'Serre la fesse, ne cambre pas.', 'Reviens lentement.'],
    mistakes: ['Cambrer.', 'Balancer la jambe.'], easy: 'Genou plié.', hard: 'Pause de 2 s.', cam: S('side', 'manual', 0, 'manual'), gacha: true
  });

  /* ====================== CUISSES ====================== */
  X('curl-ischios-serviette', 'Curl des ischios avec serviette', 3, 3, ['towel'], 'rep', [4, 6, 8, 10, 12], {
    works: 'Ischio-jambiers, fessiers', dose: '3 séries de 6 à 10', warn: 'Sur un sol lisse (carrelage, parquet). Va doucement.',
    exec: 'Allongé sur le dos, talons sur une serviette, bassin soulevé. Glisse les talons vers les fesses puis repousse-les.',
    steps: ['Allongé, talons sur la serviette, bassin soulevé.', 'Glisse les talons vers les fesses.', 'Repousse lentement, bassin haut.'],
    mistakes: ['Laisser le bassin tomber.', 'Aller trop vite.'], easy: 'Pont fessier classique.', hard: 'Une jambe.', cam: S('side', 'knee', 35, 'rep'), gacha: true
  });
  X('squat-lent', 'Squat tempo lent', 3, 3, [], 'rep', [5, 6, 8, 10, 12], {
    works: 'Quadriceps, fessiers', dose: '3 séries de 6 à 10',
    exec: 'Descends en 3 secondes, marque 1 seconde en bas, remonte en 3 secondes. La lenteur rend l\'exercice plus dur.',
    steps: ['Pieds largeur d\'épaules, buste droit.', 'Descends en comptant 3 secondes.', 'Pause 1 seconde en bas.', 'Remonte en 3 secondes.'],
    mistakes: ['Se précipiter.', 'Genoux qui rentrent.'], easy: 'Descente 2 s.', hard: 'Tempo 4-2-4.', cam: S('side', 'knee', 40, 'rep'), gacha: true
  });

  /* ====================== MOLLETS ====================== */
  X('mollets-une-jambe', 'Mollets à une jambe', 3, 3, ['wall'], 'side', [8, 10, 12, 15, 18], {
    works: 'Mollets', dose: '3 séries de 8 à 15 par jambe',
    exec: 'Main contre un mur, une jambe fléchie. Monte sur la pointe du pied d\'appui, tiens une seconde, redescends lentement.',
    steps: ['Main sur le mur pour l\'équilibre.', 'Une jambe pliée derrière toi.', 'Monte haut sur la pointe.', 'Redescends en 2 secondes.'],
    mistakes: ['Rebondir.', 'Ne pas aller au bout du mouvement.'], easy: 'Deux jambes.', hard: 'Tempo 3-1-3.', cam: S('side', 'shy', 0.04, 'rep'), gacha: true
  });
  X('mollets-marche', 'Mollets sur marche', 3, 3, ['step'], 'rep', [8, 10, 12, 15, 20], {
    works: 'Mollets', dose: '3 séries de 10 à 15', warn: 'Marche stable, pas de glissade. Tiens-toi à un mur.',
    exec: 'Pointes de pieds sur le bord d\'une marche, talons dans le vide. Descends les talons, puis monte aussi haut que possible.',
    steps: ['Avant-pied sur la marche, talons dans le vide, main sur un appui.', 'Descends les talons sous le niveau de la marche.', 'Monte haut sur la pointe.', 'Tiens une seconde en haut.'],
    mistakes: ['Plier les genoux.', 'Rebondir en bas.'], easy: 'Au sol.', hard: 'Une jambe.', cam: S('side', 'shy', 0.05, 'rep'), gacha: true
  });
  X('saut-corde', 'Saut à la corde (imaginaire)', 6, 2, [], 'rep', [30, 40, 50, 70, 90], {
    works: 'Mollets, cardio, coordination', dose: '3 séries de 30 à 60 sauts', warn: 'Sol amortissant, chaussures. Atterris sur l\'avant des pieds.',
    exec: 'Fais comme si tu tenais une corde : petits sauts légers sur l\'avant des pieds, poignets qui tournent.',
    steps: ['Poignets à hauteur des hanches, coudes près du corps.', 'Petits sauts légers, talons loin du sol.', 'Rythme régulier.'],
    mistakes: ['Sauter trop haut.', 'Atterrir sur les talons.'], easy: 'Un pied après l\'autre.', hard: 'Sauts doubles.', cam: S('side', 'shy', 0.05, 'rep'), gacha: true
  });

  /* ====================== CARTE SPÉCIALE : REPOS ====================== */
  X('repos-actif', 'Repos actif', 7, 1, [], 'sec', [60, 60, 90, 90, 120], {
    works: 'Récupération', dose: '1 à 2 minutes de respiration lente', gacha: false, special: 'repos',
    exec: 'Journée de repos : respire lentement, relâche tout le corps. Pas d\'exercice aujourd\'hui, ton corps construit pendant qu\'il se repose.',
    steps: ['Assieds-toi ou allonge-toi confortablement.', 'Inspire 4 secondes par le nez.', 'Expire 6 secondes par la bouche.', 'Relâche les épaules, la mâchoire, les mains.'],
    mistakes: ['Se forcer à faire quand même une séance.', 'Rester crispé.'], easy: 'Allongé.', hard: 'Ajoute un étirement doux.', cam: S('side', 'presence', 0, 'presence')
  });

  /* ====================================================================
     ANIMATIONS
     ==================================================================== */
  const bottles = [{ k: 'bottle', hand: 0 }, { k: 'bottle', hand: 1 }];

  // --- cou ---
  const neckS = (head, a0, a1) => STAND({ head, arm: [a0, a1 || { a: [90, 92] }], eb: [1, 1] });
  A['cou-flexion-iso'] = { view: 'side', loop: 'pingpong', hold: 600, muscles: ['neck'], frames: [F(neckS(-90, { t: [213, 22] }), 1500), F(neckS(-86, { t: [213, 22] }), 1500)] };
  A['cou-extension-iso'] = { view: 'side', loop: 'pingpong', hold: 600, muscles: ['neck', 'traps'], frames: [F(neckS(-90, { t: [188, 20] }, { t: [189, 24] }), 1500), F(neckS(-97, { t: [188, 20] }, { t: [189, 24] }), 1500)] };
  A['cou-lateral-iso'] = { view: 'front', loop: 'pingpong', hold: 600, muscles: ['neck'], frames: [F(FRONT({ head: -90, arm: [{ t: [185, 26] }, { r: [6, 68] }] }), 1500), F(FRONT({ head: -95, arm: [{ t: [185, 26] }, { r: [6, 68] }] }), 1500)] };
  A['menton-rentre'] = { view: 'side', loop: 'pingpong', hold: 700, muscles: ['neck'], frames: [F(STAND({ head: -79, arm: [{ a: [90, 92] }, { a: [92, 94] }] }), 1200), F(STAND({ head: -97, arm: [{ a: [90, 92] }, { a: [92, 94] }] }), 1200)] };
  A['haussements-epaules'] = { view: 'front', loop: 'pingpong', hold: 350, props: bottles, muscles: ['traps', 'neck'], frames: [F(FRONT({ shrug: 0, arm: [{ r: [-9, 66] }, { r: [9, 66] }] }), 700), F(FRONT({ shrug: 11, arm: [{ r: [-9, 66] }, { r: [9, 66] }] }), 700)] };
  A['etirement-cou'] = { view: 'front', loop: 'pingpong', hold: 1400, muscles: ['neck', 'traps'], frames: [F(FRONT({ head: -90, arm: [{ r: [-6, 68] }, { t: [200, 8] }], eb: [-1, 1] }), 1800), F(FRONT({ head: -79, arm: [{ r: [-6, 68] }, { t: [207, 9] }], eb: [-1, 1] }), 1800)] };

  // --- épaules ---
  A['elevations-laterales'] = { view: 'front', loop: 'pingpong', hold: 250, props: bottles, muscles: ['shoulders'], frames: [F(FRONT({ arm: [{ r: [-9, 66] }, { r: [9, 66] }] }), 1100), F(FRONT({ arm: [{ r: [-66, -4] }, { r: [66, -4] }] }), 1100)] };
  A['elevations-frontales'] = { view: 'side', loop: 'pingpong', hold: 250, props: bottles, muscles: ['shoulders', 'chest'], frames: [F(STAND({ arm: [{ a: [88, 88] }, { a: [90, 90] }] }), 1100), F(STAND({ arm: [{ a: [-8, -8] }, { a: [-6, -6] }] }), 1100)] };
  A['developpe-bouteilles'] = { view: 'front', loop: 'pingpong', hold: 250, props: bottles, muscles: ['shoulders', 'triceps'], frames: [F(FRONT({ arm: [{ t: [172, 44] }, { t: [228, 44] }] }), 1000), F(FRONT({ arm: [{ t: [185, -16] }, { t: [215, -16] }] }), 1000)] };
  A['rowing-vertical-bouteilles'] = { view: 'side', loop: 'pingpong', hold: 250, props: bottles, muscles: ['shoulders', 'traps', 'biceps'], frames: [F(STAND({ arm: [{ a: [88, 88] }, { a: [90, 90] }] }), 1000), F(STAND({ arm: [{ a: [-20, 110] }, { a: [-18, 112] }], eb: [-1, -1] }), 1000)] };
  A['cercles-bras'] = { view: 'front', loop: 'cycle', hold: 0, muscles: ['shoulders'], frames: [F(FRONT({ arm: [{ r: [-68, 0] }, { r: [68, 0] }] }), 450), F(FRONT({ arm: [{ r: [-60, -30] }, { r: [60, -30] }] }), 450), F(FRONT({ arm: [{ r: [-44, -52] }, { r: [44, -52] }] }), 450), F(FRONT({ arm: [{ r: [-60, 30] }, { r: [60, 30] }] }), 450)] };

  // --- triceps ---
  {
    const mk = (hy, hx) => P({ hip: [200, hy], torso: -135, head: -125, arm: [{ t: [hx, 222] }, { t: [hx + 5, 222] }], leg: [{ t: [240, AK] }, { t: [246, AK] }], eb: [-1, -1] });
    A['dips-sol'] = { view: 'side', loop: 'pingpong', hold: 250, props: [MAT], muscles: ['triceps', 'shoulders'], frames: [F(mk(203, 143), 900), F(mk(214, 143), 900)] };
  }

  // --- biceps ---
  {
    const hang = P({ hip: [208.4, 139], torso: -92, head: -88, arm: [{ t: [208, 2] }, { t: [212, 2] }], leg: [{ t: [186, 200] }, { t: [191, 203] }], eb: [1, 1], kb: [1, 1] });
    const top = P({ hip: [207.4, 79], torso: -92, head: -100, arm: [{ t: [208, 2] }, { t: [212, 2] }], leg: [{ t: [185, 140] }, { t: [190, 143] }], eb: [1, 1], kb: [1, 1] });
    const bar = [{ k: 'bar', y: 2, x1: 130, x2: 290 }];
    A['tractions'] = { view: 'side', loop: 'pingpong', hold: 400, props: bar, muscles: ['lats', 'biceps', 'forearms'], frames: [F(hang, 1300), F(top, 1300)] };
    A['tractions-supination'] = { view: 'side', loop: 'pingpong', hold: 400, props: bar, muscles: ['biceps', 'lats', 'forearms'], frames: [F(hang, 1300), F(top, 1300)] };
  }
  // --- avant-bras ---
  {
    const mk = (a2) => STAND({ arm: [{ a: [92, a2] }, { a: [94, a2 + 2] }], wr: [-25, -25] });
    A['curl-inverse'] = { view: 'side', loop: 'pingpong', hold: 250, props: bottles, muscles: ['forearms', 'biceps'], frames: [F(mk(90), 1000), F(mk(-75), 1000)] };
  }
  A['farmer-hold'] = { view: 'side', loop: 'pingpong', hold: 800, props: [{ k: 'bag', at: 'hang', hand: 0 }], muscles: ['forearms', 'hands', 'traps'], frames: [F(STAND({ arm: [{ a: [90, 90] }, { a: [92, 92] }] }), 1400), F(STAND({ hip: [200, 119], arm: [{ a: [90, 90] }, { a: [92, 92] }] }), 1400)] };

  // --- doigts et mains ---
  {
    const mk = (w) => STAND({ arm: [{ a: [82, -6] }, { a: [84, -4] }], wr: [w, w], eb: [-1, -1] });
    A['ouverture-fermeture-mains'] = { view: 'side', loop: 'pingpong', hold: 250, muscles: ['hands', 'forearms'], frames: [F(mk(0), 700), F(mk(80), 700)] };
    A['pincement-serviette'] = { view: 'side', loop: 'pingpong', hold: 800, props: [{ k: 'towel' }], muscles: ['hands', 'forearms'], frames: [F(mk(20), 1400), F(mk(36), 1400)] };
  }
  {
    const PT = plank(60, -18.8), HXd = NEV.AnimKit.shOf(PT)[0];
    const push = (ang) => { const p = onFloor(plank(60, ang), HXd); p.wr = [-55, -55]; return p; };
    A['pompes-doigts'] = { view: 'side', loop: 'pingpong', hold: 200, props: [MAT], muscles: ['hands', 'forearms', 'chest', 'triceps'], frames: [F(push(-18.8), 1100), F(push(-6.5), 1100)] };
    A['pompes-larges'] = { view: 'side', loop: 'pingpong', hold: 200, props: [MAT], muscles: ['chest', 'shoulders', 'triceps'], frames: [F(onFloor(plank(60, -18.8), HXd), 950), F(onFloor(plank(60, -4.5), HXd), 950)] };
  }

  // --- poitrine ---
  A['presse-paumes'] = { view: 'front', loop: 'pingpong', hold: 700, muscles: ['chest', 'shoulders'], frames: [F(FRONT({ arm: [{ t: [191, 62] }, { t: [209, 62] }] }), 1100), F(FRONT({ arm: [{ t: [196, 63] }, { t: [204, 63] }] }), 1100)] };

  // --- dos / dorsaux ---
  {
    const mk = (a1, a2) => STAND({ arm: [{ a: [a1, a2] }, { a: [a1 + 2, a2 + 2] }], eb: [-1, -1] });
    A['retraction-omoplates'] = { view: 'side', loop: 'pingpong', hold: 300, muscles: ['back', 'shoulders', 'traps'], frames: [F(mk(-2, -2), 900), F(mk(165, 20), 900)] };
  }
  {
    const ax = 91, mk = (th) => { const t = th * Math.PI / 180, hip = [ax + 101.5 * Math.cos(t), AK - 101.5 * Math.sin(t)]; return P({ hip, torso: -th, head: -th - 8, arm: [{ t: [259, 125] }, { t: [262, 125] }], leg: [{ t: [ax, AK] }, { t: [ax + 5, AK] }], eb: [1, 1] }); };
    A['tractions-inversees'] = { view: 'side', loop: 'pingpong', hold: 350, props: [{ k: 'table', x: 334, w: 150, h: 105 }, MAT], muscles: ['lats', 'back', 'biceps'], frames: [F(mk(9.4), 1200), F(mk(27.6), 1200)] };
  }
  {
    const mk = (a) => P({ hip: [232, 214], torso: 180, head: 180, arm: [{ a: [a, a] }, { a: [a + 2, a + 2] }], leg: [{ t: [282, AK] }, { t: [288, AK] }] });
    A['pullover-sac'] = { view: 'side', loop: 'pingpong', hold: 250, props: [MAT, { k: 'bag', hand: 0 }], muscles: ['lats', 'chest', 'triceps'], frames: [F(mk(-90), 1200), F(mk(-135), 1200), F(mk(188), 1200)] };
  }

  // --- obliques ---
  A['flexion-laterale-bouteille'] = { view: 'front', loop: 'pingpong', hold: 250, props: [{ k: 'bottle', hand: 1 }], muscles: ['obliques', 'abs'], frames: [F(FRONT({ arm: [{ r: [-4, 66] }, { r: [14, 62] }], leg: [{ t: [185, AK] }, { t: [215, AK] }] }), 1000), F(FRONT({ torso: -108, head: -108, arm: [{ r: [-6, 66] }, { r: [14, 62] }], leg: [{ t: [185, AK] }, { t: [215, AK] }] }), 1000)] };
  {
    const mk = (a) => { const p = kneel(110, a); p.arm = [{ a: [90, 0] }, { a: [-90, -90] }]; p.head = a - 6; return p; };
    A['planche-laterale-genou'] = { view: 'side', loop: 'pingpong', hold: 900, props: [MAT], muscles: ['obliques', 'core'], frames: [F(mk(-17), 1400), F(mk(-14), 1400)] };
    const mk3 = (a) => { const p = plank(60, a); p.arm = [{ a: [90, 0] }, { a: [-90, -90] }]; p.head = a - 6; return p; };
    A['planche-laterale-hanche'] = { view: 'side', loop: 'pingpong', hold: 250, props: [MAT], muscles: ['obliques', 'core', 'shoulders'], frames: [F(mk3(-12), 900), F(mk3(-2), 900)] };
  }
  A['toucher-pied-oppose'] = { view: 'front', loop: 'pingpong', hold: 200, muscles: ['obliques', 'hamstrings'], frames: [F(FRONT({ hip: [200, 121], arm: [{ r: [-66, 0] }, { r: [66, 0] }], leg: [{ t: [160, AK] }, { t: [240, AK] }] }), 1000), F(FRONT({ hip: [212, 158], torso: -125, head: -118, arm: [{ t: [152, 176] }, { r: [40, -55] }], leg: [{ t: [152, AK] }, { t: [250, AK] }] }), 1000)] };
  A['bucheron-bouteille'] = { view: 'front', loop: 'pingpong', hold: 200, props: [{ k: 'bottle', hand: 0 }], muscles: ['obliques', 'shoulders', 'glutes'], frames: [F(FRONT({ hip: [200, 120], arm: [{ t: [224, 6] }, { t: [230, 12] }], leg: [{ t: [180, AK] }, { t: [220, AK] }] }), 1000), F(FRONT({ hip: [200, 140], torso: -105, head: -100, arm: [{ t: [176, 128] }, { t: [181, 134] }], leg: [{ t: [168, AK] }, { t: [232, AK] }] }), 1000)] };

  // --- lombaires ---
  {
    const arms = [{ r: [16, 14] }, { r: [18, 18] }];
    A['bonjour-sac'] = { view: 'side', loop: 'pingpong', hold: 250, props: [{ k: 'bag', at: 'chest' }], muscles: ['lowback', 'glutes', 'hamstrings'], frames: [F(P({ hip: [200, 118], torso: -90, head: -90, arm: arms, leg: [{ t: [200, AK] }, { t: [206, AK] }] }), 1100), F(P({ hip: [176, 122], torso: -38, head: -46, arm: arms, leg: [{ t: [204, AK] }, { t: [210, AK] }], kb: [1, 1] }), 1100)] };
  }
  {
    const base = (leg0) => P({ hip: [232, 214], torso: 180, head: 180, arm: [{ a: [-60, 20] }, { a: [-60, 20] }], leg: [leg0, { a: [0, 0] }], foot: [-20, -20] });
    A['genou-poitrine'] = { view: 'side', loop: 'pingpong', hold: 1200, props: [MAT], muscles: ['lowback', 'glutes'], frames: [F(base({ t: [282, AK] }), 1500), F(Object.assign(base({ a: [-120, 40] }), { arm: [{ t: [222, 186] }, { t: [226, 190] }] }), 1500)] };
  }

  // --- fessiers ---
  {
    const base = () => P({ hip: [170, 167], torso: -12.6, head: -2, arm: [{ r: [8, 68] }, { r: [10, 68] }], leg: [{ a: [90, 180] }, { a: [92, 181] }], foot: [180, 180] });
    const kick = base(); kick.leg[1] = { a: [190, -88] };
    A['donkey-kick'] = { view: 'side', loop: 'pingpong', hold: 400, props: [MAT], muscles: ['glutes', 'hamstrings'], frames: [F(base(), 900), F(kick, 900)] };
  }
  {
    const mk = (phi) => { const t = phi - 180; const sh = [120, 170]; const hip = [sh[0] + 69 * Math.cos(phi * Math.PI / 180), sh[1] + 69 * Math.sin(phi * Math.PI / 180)]; return P({ hip, torso: t, head: t - 12, arm: [{ a: [phi - 20, phi - 20] }, { a: [phi - 16, phi - 16] }], leg: [{ t: [236, AK] }, { t: [242, AK] }] }); };
    A['hip-thrust-chaise'] = { view: 'side', loop: 'pingpong', hold: 450, props: [{ k: 'chair', x: 98, h: 52, back: 'left' }], muscles: ['glutes', 'hamstrings'], frames: [F(mk(34), 1000), F(mk(6), 1000)] };
  }
  A['extension-hanche-debout'] = { view: 'side', loop: 'pingpong', hold: 350, props: [{ k: 'wall', x: 252 }], muscles: ['glutes', 'hamstrings'], frames: [F(STAND({ arm: [{ t: [250, 98] }, { t: [250, 102] }], leg: [{ t: [200, AK] }, { t: [198, AK - 6] }] }), 900), F(STAND({ torso: -86, arm: [{ t: [250, 98] }, { t: [250, 102] }], leg: [{ t: [200, AK] }, { t: [150, 198] }] }), 900)] };

  // --- cuisses ---
  {
    const mk = (hx) => { const p = supine(40); p.arm = [{ a: [0, 0] }, { a: [2, 2] }]; p.leg = [{ t: [hx, AK] }, { t: [hx + 5, AK] }]; return p; };
    A['curl-ischios-serviette'] = { view: 'side', loop: 'pingpong', hold: 350, props: [MAT], muscles: ['hamstrings', 'glutes'], frames: [F(mk(298), 1300), F(mk(244), 1300)] };
  }
  A['squat-lent'] = Object.assign({}, A['squats'], { hold: 900, frames: A['squats'].frames.map((f) => F(f.p, 2800)) });

  // --- mollets ---
  A['mollets-une-jambe'] = { view: 'side', loop: 'pingpong', hold: 350, props: [{ k: 'wall', x: 238 }], muscles: ['calves'], frames: [F(STAND({ arm: [{ t: [238, 70] }, { t: [238, 74] }], leg: [{ t: [200, AK] }, { t: [172, 192] }] }), 800), F(STAND({ hip: [200, 102], arm: [{ t: [238, 62] }, { t: [238, 66] }], leg: [{ t: [200, AK - 16] }, { t: [172, 178] }], foot: [50, 0] }), 800)] };
  A['mollets-marche'] = { view: 'side', loop: 'pingpong', hold: 350, props: [{ k: 'step', x: 204, w: 46, h: 24 }, { k: 'wall', x: 236 }], muscles: ['calves'], frames: [F(STAND({ hip: [200, 101], arm: [{ t: [236, 62] }, { t: [236, 66] }], leg: [{ t: [200, 203] }, { t: [206, 203] }], foot: [-12, -12] }), 900), F(STAND({ hip: [200, 80], arm: [{ t: [236, 56] }, { t: [236, 60] }], leg: [{ t: [200, 181] }, { t: [206, 181] }], foot: [50, 50] }), 900)] };
  A['saut-corde'] = { view: 'side', loop: 'cycle', hold: 0, muscles: ['calves', 'quads'], frames: [F(STAND({ arm: [{ a: [60, 20] }, { a: [62, 22] }] }), 230), F(STAND({ hip: [200, 98], arm: [{ a: [60, 20] }, { a: [62, 22] }], leg: [{ t: [200, AK - 20] }, { t: [206, AK - 20] }], foot: [45, 45] }), 260)] };

  // --- repos actif : comme la respiration lente ---
  A['repos-actif'] = Object.assign({}, A['respiration-lente']);

  // cartes spéciales : chaque exercice marqué `special` ne sort que via Repos ou Tractions
  mark('repos-actif', { gacha: false });
})(window);
