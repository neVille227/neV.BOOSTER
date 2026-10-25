/* ==========================================================
   neV.BOOSTER — ex-data.js
   Les fiches d'exercices : les 28 de base (ta liste), ceux de tes
   documents, et des ajouts faisables à la maison.
   tier : 1 Commun · 2 Rare · 3 Épique · 4 Légendaire · 5 Mythique
   unit : rep (répétitions) · sec (secondes) · side (rép. par côté) · secside (secondes par côté)
   cam  : comment la caméra compte (voir vision.js)
          sig = signal suivi, amp = amplitude minimale, mode = rep | alt | hold | move | presence | manual
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});

  const CATS = [
    { n: 1, id: 'pecs', name: 'Pectoraux, épaules et triceps', short: 'Pectoraux', color: '#ff5a5f' },
    { n: 2, id: 'dos', name: 'Dos et arrière des épaules', short: 'Dos', color: '#ff8a3d' },
    { n: 3, id: 'jambes', name: 'Cuisses et fessiers', short: 'Jambes', color: '#f0b24a' },
    { n: 4, id: 'abdos', name: 'Abdominaux et gainage', short: 'Abdos', color: '#e0455f' },
    { n: 5, id: 'bras', name: 'Biceps, triceps et avant-bras', short: 'Bras', color: '#c8456e' },
    { n: 6, id: 'cardio', name: 'Cardio et corps entier', short: 'Cardio', color: '#ff7a59' },
    { n: 7, id: 'mobilite', name: 'Mobilité et récupération', short: 'Mobilité', color: '#b57a8c' }
  ];

  const EQUIP = { chair: 'une chaise stable', wall: 'un mur libre', step: 'une marche basse', bag: 'un sac à dos fermé', bottle: 'des bouteilles d\'eau', towel: 'une serviette', bar: 'une barre de traction fixe', table: 'une table très solide' };
  const MUSCLES_FR = { chest: 'Pectoraux', abs: 'Abdominaux', core: 'Tronc', back: 'Dos', lowback: 'Bas du dos', glutes: 'Fessiers', shoulders: 'Épaules', triceps: 'Triceps', biceps: 'Biceps', forearms: 'Avant-bras', quads: 'Quadriceps', hamstrings: 'Ischio-jambiers', calves: 'Mollets', neck: 'Cou', traps: 'Trapèzes', lats: 'Grand dorsal', obliques: 'Obliques', hands: 'Doigts et mains' };

  const CAM_PLACE = {
    side: 'Pose ton téléphone au sol, à environ 2 m, et place-toi de profil.',
    front: 'Pose ton téléphone à hauteur de taille, à environ 2 m, et place-toi de face.',
    any: 'Pose ton téléphone à 2 m, de façon à te voir en entier.'
  };

  const L = [];
  // X(id, nom, catégorie, tier, matériel, unité, répétitions par niveau 1→5, détails)
  function X(id, name, cat, tier, equip, unit, base, o) {
    const c = CATS[cat - 1];
    L.push(Object.assign({ id, name, cat, group: c.id, tier, equip, unit, base, gacha: cat !== 7, src: 'extra' }, o));
  }
  const S = (view, sig, amp, mode, extra) => Object.assign({ view, sig, amp, mode }, extra || {});

  /* ============ 1. PECTORAUX, ÉPAULES ET TRICEPS ============ */
  X('pompes-classiques', 'Pompes classiques', 1, 3, [], 'rep', [4, 6, 10, 14, 18], {
    src: 'base', fromMax: 0.5, fromMin: 3, fromCap: 60, works: 'Pectoraux, triceps, épaules', dose: '3 séries de 5 à 12 · repos 60 à 120 s',
    exec: 'Mains au sol un peu plus larges que les épaules, corps aligné. Plie les coudes pour descendre, puis pousse pour remonter.',
    steps: ['Mains légèrement plus larges que les épaules, corps aligné de la tête aux talons.', 'Plie les coudes pour rapprocher la poitrine du sol, sans cambrer le dos.', 'Repousse le sol jusqu\'à avoir les bras tendus.'],
    mistakes: ['Creuser le dos ou laisser le bassin tomber.', 'Écarter les coudes à angle droit ou descendre trop vite.'],
    easy: 'Pompes inclinées ou sur les genoux.', hard: 'Pompes déclinées ou à prise rapprochée.', cam: S('side', 'elbow', 40, 'rep')
  });
  X('pompes-inclinees', 'Pompes inclinées', 1, 2, ['chair'], 'rep', [6, 8, 12, 15, 20], {
    src: 'base', fromMax: 0.8, fromMin: 5, fromCap: 60, works: 'Pectoraux, triceps, épaules', dose: '3 séries de 8 à 15 · repos 60 s',
    exec: 'Pose les mains sur un support solide et stable. Descends la poitrine vers le support, puis repousse ton corps.',
    steps: ['Mains sur le bord d\'une chaise immobile (dossier contre un mur si besoin), corps en ligne.', 'Fléchis les coudes pour amener la poitrine vers le support.', 'Repousse jusqu\'à tendre les bras.'],
    mistakes: ['Utiliser une chaise qui bouge.', 'Laisser tomber le bassin.'],
    easy: 'Choisir un support plus haut (mur).', hard: 'Pompes classiques au sol.', cam: S('side', 'elbow', 35, 'rep')
  });
  X('pompes-pike', 'Pompes pike', 1, 3, [], 'rep', [3, 5, 6, 8, 10], {
    src: 'base', fromMax: 0.4, fromMin: 3, fromCap: 30, works: 'Épaules, triceps', dose: '2 à 3 séries de 4 à 8 · repos 90 s',
    exec: 'Place les mains au sol, remonte les hanches pour former un V inversé, puis plie les coudes pour abaisser doucement la tête entre les mains.',
    steps: ['Mains au sol, hanches hautes : ton corps forme un V inversé.', 'Fléchis les coudes pour descendre la tête entre les mains.', 'Pousse pour revenir en V, en gardant les hanches hautes.'],
    mistakes: ['Forcer l\'amplitude jusqu\'à une gêne dans les épaules.', 'Laisser les coudes partir sans contrôle.'],
    easy: 'Réduire l\'amplitude, mains sur une chaise.', hard: 'Pieds surélevés (pompes déclinées en V).', cam: S('side', 'elbow', 35, 'rep')
  });
  X('pompes-genoux', 'Pompes sur les genoux', 1, 1, [], 'rep', [4, 6, 8, 10, 12], {
    src: 'base', fromMax: 1, fromMin: 4, fromCap: 40, works: 'Pectoraux, triceps, épaules', dose: '2 à 3 séries de 6 à 12 · repos 60 s',
    exec: 'Garde les genoux au sol et le corps aligné des genoux à la tête. Descends en contrôlant le mouvement, puis remonte.',
    steps: ['Genoux au sol, mains sous les épaules, corps aligné des genoux à la tête.', 'Descends la poitrine en contrôlant, coudes à 45° du corps.', 'Remonte en poussant sur les mains.'],
    mistakes: ['Cambrer le dos.', 'Faire des mouvements trop courts.'],
    easy: 'Pompes contre un mur.', hard: 'Pompes classiques.', cam: S('side', 'elbow', 35, 'rep')
  });
  X('pompes-rapprochees', 'Pompes prise rapprochée', 1, 3, [], 'rep', [3, 5, 8, 10, 12], {
    src: 'base', fromMax: 0.4, fromMin: 3, fromCap: 40, works: 'Triceps, pectoraux', dose: '2 à 3 séries de 5 à 10 · repos 90 s',
    exec: 'Rapproche les mains sous la poitrine sans obligatoirement coller les doigts. Plie les coudes près du corps, puis pousse.',
    steps: ['Mains rapprochées sous la poitrine, sans forcer les poignets.', 'Coudes près du corps pendant la descente.', 'Repousse le sol jusqu\'à tendre les bras.'],
    mistakes: ['Une position des mains douloureuse pour les poignets.', 'Écarter fortement les coudes.'],
    easy: 'Faire le mouvement sur les genoux.', hard: 'Pompes diamant.', cam: S('side', 'elbow', 35, 'rep')
  });
  X('pompes-mur', 'Pompes contre le mur', 1, 1, ['wall'], 'rep', [8, 12, 15, 20, 25], {
    works: 'Pectoraux, triceps, épaules', dose: '2 séries de 8 à 15 · repos 45 s',
    exec: 'Debout face au mur, mains à hauteur d\'épaules : fléchis les coudes pour approcher le visage du mur, puis repousse.',
    steps: ['Face au mur, à une grande longueur de bras, mains à hauteur d\'épaules.', 'Plie les coudes pour amener la poitrine vers le mur, corps droit.', 'Repousse jusqu\'à tendre les bras.'],
    mistakes: ['Se tenir trop près du mur.', 'Cambrer le bas du dos.'],
    easy: 'Rapproche les pieds du mur.', hard: 'Passe aux pompes inclinées.', cam: S('side', 'elbow', 30, 'rep')
  });
  X('pompes-declinees', 'Pompes déclinées', 1, 4, ['chair'], 'rep', [3, 4, 6, 8, 10], {
    fromMax: 0.4, fromMin: 3, fromCap: 40, works: 'Épaules, pectoraux, triceps', dose: '3 séries de 6 à 10 · repos 90 s',
    exec: 'Pieds posés sur une chaise stable, mains au sol : descends la poitrine puis repousse, le corps bien aligné.',
    steps: ['Pieds sur une chaise stable (adossée au mur), mains au sol sous les épaules.', 'Descends en gardant le corps en ligne.', 'Repousse jusqu\'à tendre les bras.'],
    mistakes: ['Chaise instable.', 'Cambrer le dos ou laisser le bassin tomber.'],
    easy: 'Pompes classiques.', hard: 'Pieds plus hauts, descente de 3 secondes.', cam: S('side', 'elbow', 35, 'rep')
  });
  X('pompes-diamant', 'Pompes diamant', 1, 4, [], 'rep', [2, 3, 5, 7, 9], {
    fromMax: 0.3, fromMin: 3, fromCap: 30, works: 'Triceps, pectoraux, avant-bras', dose: '2 à 3 séries de 4 à 8 · repos 90 s',
    exec: 'Mains très proches sous la poitrine, pouces et index formant un losange. Descends puis pousse.',
    steps: ['Forme un losange avec les mains, sous le sternum.', 'Descends lentement, coudes le long du corps.', 'Repousse le sol en gardant le bassin aligné.'],
    mistakes: ['Poignets douloureux : élargis légèrement les mains.', 'Coudes qui s\'écartent.'],
    easy: 'Prise rapprochée simple ou sur les genoux.', hard: 'Pompes archer.', cam: S('side', 'elbow', 35, 'rep')
  });
  X('pompes-archer', 'Pompes archer', 1, 5, [], 'side', [2, 3, 4, 5, 6], {
    fromMax: 0.2, fromMin: 2, fromCap: 20, works: 'Pectoraux, triceps, épaules, tronc', dose: '3 séries de 3 à 6 par côté · repos 120 s',
    exec: 'Mains très écartées : fléchis un bras en gardant l\'autre tendu sur le côté, puis alterne.',
    steps: ['Mains très larges, corps aligné.', 'Déplace le poids vers un bras qui fléchit, l\'autre reste tendu.', 'Remonte puis change de côté.'],
    mistakes: ['Trop d\'amplitude trop tôt.', 'Tourner les hanches.'],
    easy: 'Pompes classiques larges.', hard: 'Pompes à un bras assistées.', cam: S('side', 'elbow', 35, 'rep')
  });
  X('pompes-claquees', 'Pompes claquées', 1, 5, [], 'rep', [2, 3, 4, 6, 8], {
    fromMax: 0.2, fromMin: 2, fromCap: 20, works: 'Pectoraux, triceps, épaules, explosivité', dose: '3 séries de 3 à 6 · repos 120 s',
    exec: 'Descends puis pousse assez fort pour décoller les mains du sol, tape dans les mains et réceptionne en douceur.',
    steps: ['Position de pompe, descends en contrôle.', 'Pousse de façon explosive pour décoller les mains.', 'Tape des mains, réceptionne bras légèrement fléchis.'],
    mistakes: ['Réception bras tendus (poignets).', 'Pratiquer sur un sol glissant.'],
    easy: 'Pompes avec poussée rapide sans décoller.', hard: 'Claque dans le dos.', cam: S('side', 'elbow', 35, 'rep'),
    warn: 'Exercice explosif : à réserver aux personnes à l\'aise avec les pompes.'
  });
  X('dips-chaise', 'Dips sur chaise', 1, 3, ['chair'], 'rep', [5, 6, 8, 10, 12], {
    src: 'base', works: 'Triceps, épaules, pectoraux', dose: '2 séries de 6 à 10 au maximum au départ',
    exec: 'Mains sur le bord d\'une chaise solide derrière toi, fléchis doucement les coudes puis remonte.',
    steps: ['Mains sur le bord de la chaise (dossier contre un mur), jambes fléchies ou tendues.', 'Fléchis les coudes à environ 90°, dos près de la chaise.', 'Repousse jusqu\'à tendre les bras.'],
    mistakes: ['Chaise instable.', 'Descendre trop bas ou ressentir une douleur à l\'épaule.'],
    easy: 'Genoux pliés, pieds près du corps.', hard: 'Jambes tendues.', cam: S('side', 'elbow', 35, 'rep'),
    warn: 'Les dips sur chaise sollicitent fortement les épaules : arrête-toi en cas de gêne.'
  });
  X('extension-triceps-sol', 'Extensions triceps au sol', 1, 2, ['bottle'], 'rep', [10, 12, 14, 16, 18], {
    works: 'Triceps', dose: '2 à 3 séries de 10 à 15 · repos 60 s',
    exec: 'Allongé sur le dos, bouteilles légères au-dessus de toi : fléchis les coudes pour les rapprocher de la tête, puis redresse les bras.',
    steps: ['Allonge-toi sur le dos, une bouteille dans chaque main, bras tendus vers le plafond.', 'Fléchis seulement les coudes pour descendre les bouteilles près de la tête.', 'Redresse les bras sans bouger les coudes.'],
    mistakes: ['Charges trop lourdes.', 'Mouvements brusques.'],
    easy: 'Bouteilles vides ou plus légères.', hard: 'Bouteilles plus remplies, descente lente.', cam: S('side', 'elbow', 45, 'rep')
  });

  /* ============ 2. DOS ET ARRIÈRE DES ÉPAULES ============ */
  X('superman', 'Superman', 2, 1, [], 'rep', [8, 10, 12, 14, 16], {
    src: 'base', works: 'Bas du dos, muscles du dos, fessiers', dose: '2 à 3 séries de 8 à 12 · repos 45 à 60 s',
    exec: 'Allonge-toi sur le ventre, tends les bras et lève légèrement les bras et les jambes. Maintiens brièvement sans forcer le dos, puis relâche.',
    steps: ['Allonge-toi sur le ventre, bras tendus devant toi.', 'Lève légèrement bras et jambes en regardant le sol.', 'Marque une courte pause, puis redescends lentement.'],
    mistakes: ['Soulever trop haut.', 'Ressentir une douleur lombaire : arrête.'],
    easy: 'Lever seulement les bras ou seulement les jambes.', hard: 'Pause de 3 secondes en haut.', cam: S('side', 'limbs', 0.12, 'rep')
  });
  X('bird-dog', 'Bird-dog', 2, 2, [], 'side', [6, 8, 10, 12, 14], {
    src: 'base', works: 'Dos, abdominaux, stabilité', dose: '2 à 3 séries de 8 à 12 par côté',
    exec: 'À quatre pattes, tends un bras et la jambe opposée. Garde le dos stable, reviens au centre et change de côté.',
    steps: ['À quatre pattes, mains sous les épaules, genoux sous les hanches.', 'Tends un bras et la jambe opposée, bassin immobile.', 'Reviens au centre et change de côté.'],
    mistakes: ['Tourner le bassin.', 'Creuser le dos.'],
    easy: 'Ne tendre qu\'un membre à la fois.', hard: 'Pause de 3 secondes, coude-genou sous le ventre.', cam: S('side', 'limbs', 0.12, 'rep')
  });
  X('anges-inverses', 'Anges inversés au sol', 2, 2, [], 'rep', [8, 10, 12, 15, 18], {
    src: 'base', works: 'Arrière des épaules, haut du dos', dose: '2 à 3 séries de 8 à 12',
    exec: 'Allonge-toi sur le ventre et déplace lentement les bras sur les côtés puis vers le haut, en gardant les épaules basses.',
    steps: ['Sur le ventre, bras le long du corps, paumes vers le sol.', 'Décolle légèrement les bras et fais-les glisser sur les côtés vers le haut.', 'Reviens lentement, épaules loin des oreilles.'],
    mistakes: ['Hausser les épaules.', 'Accélérer le mouvement.'],
    easy: 'Réduire l\'amplitude.', hard: 'Pause de 2 secondes au-dessus de la tête.', cam: S('side', 'limbs', 0.12, 'rep')
  });
  X('rowing-sac', 'Rowing avec sac à dos', 2, 3, ['bag'], 'rep', [10, 12, 14, 16, 20], {
    src: 'base', works: 'Dos, biceps, arrière des épaules', dose: '3 séries de 8 à 15 · repos 60 s',
    exec: 'Tiens un sac léger et bien fermé, penche légèrement le buste avec le dos droit, tire le sac vers le ventre, puis redescends lentement.',
    steps: ['Debout, genoux légèrement fléchis, buste penché, dos droit, sac tenu par la poignée.', 'Tire le sac vers le ventre en serrant les omoplates.', 'Redescends lentement, bras tendus.'],
    mistakes: ['Sac mal fermé.', 'Dos arrondi ou charge trop lourde.'],
    easy: 'Alléger le sac.', hard: 'Rowing à un bras.', cam: S('side', 'elbow', 45, 'rep'),
    warn: 'Évite les rowings sous une table et les tractions improvisées : le mobilier peut céder.'
  });
  X('swimmer', 'Nage au sol', 2, 2, [], 'rep', [16, 20, 24, 30, 36], {
    works: 'Bas du dos, dos, fessiers, épaules', dose: '2 à 3 séries de 16 à 30 battements',
    exec: 'Sur le ventre, bras tendus : lève un bras et la jambe opposée, puis alterne en rythme, comme si tu nageais.',
    steps: ['Allonge-toi sur le ventre, bras et jambes tendus.', 'Lève un bras et la jambe opposée de quelques centimètres.', 'Alterne en gardant la nuque dans le prolongement du dos.'],
    mistakes: ['Lever la tête.', 'Aller trop vite et perdre le contrôle.'],
    easy: 'Alterne lentement, amplitude réduite.', hard: 'Ajoute une pause en haut.', cam: S('side', 'limbs', 0.1, 'rep')
  });
  X('rowing-sac-unilateral', 'Rowing à un bras avec sac', 2, 4, ['bag'], 'side', [8, 10, 12, 14, 16], {
    works: 'Dos, biceps, tronc', dose: '3 séries de 8 à 12 par côté',
    exec: 'Une main en appui sur la cuisse, tire le sac vers la hanche avec l\'autre bras, puis redescends.',
    steps: ['Fente légère, une main posée sur la cuisse, dos plat.', 'Tire le sac vers la hanche, coude près du corps.', 'Redescends lentement puis change de côté.'],
    mistakes: ['Tourner le buste.', 'Charge trop lourde.'],
    easy: 'Rowing à deux mains.', hard: 'Pause de 2 secondes en haut.', cam: S('side', 'elbow', 45, 'rep')
  });
  X('ytw', 'Y-T-W', 2, 2, [], 'rep', [6, 8, 10, 12, 15], {
    works: 'Arrière des épaules, haut du dos', dose: '2 à 3 séries de 8 à 10 (un cycle Y-T-W = 1)',
    exec: 'Sur le ventre, dessine avec les bras un Y, puis un T, puis un W, en serrant les omoplates.',
    steps: ['Sur le ventre, front au sol, bras en Y vers l\'avant.', 'Lève les bras, serre les omoplates, puis passe en T (bras sur les côtés).', 'Termine en W (coudes fléchis), redescends et recommence.'],
    mistakes: ['Hausser les épaules vers les oreilles.', 'Cambrer le bas du dos.'],
    easy: 'Fais chaque lettre séparément.', hard: 'Maintiens 2 secondes sur chaque lettre.', cam: S('side', 'limbs', 0.1, 'rep')
  });

  X('tirage-serviette', 'Tirage isométrique avec serviette', 2, 1, ['towel'], 'sec', [10, 15, 20, 25, 30], {
    works: 'Dos, biceps', dose: '3 séries de 10 à 20 secondes',
    exec: 'Tiens une serviette avec les deux mains et exerce une traction opposée sans à-coups. Maintiens quelques secondes puis relâche.',
    steps: ['Tiens la serviette tendue entre les deux mains, bras levés.', 'Tire dans des sens opposés, comme pour la déchirer, sans à-coups.', 'Maintiens, puis relâche doucement.'],
    mistakes: ['Tirer brutalement.', 'Retenir sa respiration.'],
    easy: 'Réduire l\'intensité de la traction.', hard: 'Tirer en descendant les bras.', cam: S('front', 'presence', 0, 'presence')
  });

  /* ============ 3. CUISSES ET FESSIERS ============ */
  X('squats', 'Squats', 3, 2, [], 'rep', [10, 15, 20, 25, 30], {
    src: 'base', works: 'Quadriceps, fessiers', dose: '3 séries de 8 à 15 · repos 60 s',
    exec: 'Pieds à peu près à la largeur des épaules. Recule les hanches, plie les genoux, puis redresse-toi en poussant sur les pieds.',
    steps: ['Pieds écartés à la largeur des épaules, pointes légèrement ouvertes.', 'Recule les hanches et plie les genoux en gardant le dos droit.', 'Pousse sur les pieds pour te redresser.'],
    mistakes: ['Perdre l\'équilibre ou arrondir le dos.', 'Forcer une amplitude inconfortable.'],
    easy: 'Squat vers une chaise stable.', hard: 'Descente lente de 3 secondes.', cam: S('side', 'knee', 40, 'rep')
  });
  X('fentes-arriere', 'Fentes arrière', 3, 3, [], 'side', [6, 8, 10, 12, 14], {
    src: 'base', works: 'Cuisses, fessiers, équilibre', dose: '2 à 3 séries de 6 à 10 par jambe',
    exec: 'Recule un pied, fléchis les deux genoux sans heurter le sol, puis reviens debout. Alterne les jambes.',
    steps: ['Debout, pose un pied loin derrière toi, sur la pointe.', 'Fléchis les deux genoux sans toucher le sol avec le genou arrière.', 'Reviens debout en poussant sur le pied avant, puis alterne.'],
    mistakes: ['Perdre l\'équilibre.', 'Laisser le genou avant s\'effondrer vers l\'intérieur.'],
    easy: 'Se tenir légèrement à un support stable.', hard: 'Fente avec pause de 2 secondes en bas.', cam: S('side', 'kneeMin', 35, 'rep')
  });
  X('chaise-mur', 'Chaise contre le mur', 3, 2, ['wall'], 'sec', [20, 30, 40, 50, 60], {
    src: 'base', works: 'Quadriceps, fessiers', dose: '2 à 3 séries de 15 à 40 secondes',
    exec: 'Plaque le dos au mur, avance légèrement les pieds et fléchis les genoux. Tiens la position tant qu\'elle reste confortable.',
    steps: ['Dos et fessiers plaqués au mur, pieds à 50 cm du mur.', 'Descends jusqu\'à ce que les cuisses soient presque à l\'horizontale.', 'Tiens en respirant normalement, puis remonte.'],
    mistakes: ['Descendre trop bas.', 'Continuer malgré une douleur.'],
    easy: 'Réduire la flexion des genoux.', hard: 'Poser un sac sur les cuisses.', cam: S('side', 'knee', 0, 'hold', { lo: 70, hi: 130 })
  });
  X('pont-fessier', 'Pont fessier', 3, 1, [], 'rep', [10, 12, 15, 18, 20], {
    src: 'base', works: 'Fessiers, arrière des cuisses', dose: '3 séries de 10 à 15 · repos 45 s',
    exec: 'Allonge-toi sur le dos, genoux pliés et pieds au sol. Lève le bassin, serre doucement les fessiers, puis redescends.',
    steps: ['Sur le dos, genoux pliés, pieds à plat près des fesses.', 'Lève le bassin jusqu\'à aligner épaules, hanches et genoux.', 'Serre les fessiers une seconde, puis redescends lentement.'],
    mistakes: ['Cambrer exagérément le dos.', 'Pousser sur les orteils plutôt que les talons.'],
    easy: 'Réduire la hauteur du bassin.', hard: 'Pont à une jambe.', cam: S('side', 'hip', 25, 'rep')
  });
  X('mollets', 'Extensions des mollets', 3, 1, [], 'rep', [12, 15, 20, 25, 30], {
    src: 'base', works: 'Mollets', dose: '3 séries de 12 à 20 · repos 45 s',
    exec: 'Debout, monte sur la pointe des pieds, marque une courte pause, puis redescends lentement.',
    steps: ['Debout, pieds parallèles, mains sur les hanches ou contre un mur.', 'Monte sur la pointe des pieds le plus haut possible.', 'Pause d\'une seconde, puis redescends avec contrôle.'],
    mistakes: ['Rebondir.', 'Perdre l\'équilibre.'],
    easy: 'Se tenir à un mur.', hard: 'Sur une seule jambe.', cam: S('side', 'shy', 0.045, 'rep')
  });
  X('montees-marche', 'Montées sur marche basse', 3, 2, ['step'], 'side', [6, 8, 10, 12, 15], {
    src: 'base', works: 'Cuisses, fessiers', dose: '2 à 3 séries de 8 à 12 par jambe',
    exec: 'Monte sur une marche basse et stable, redresse-toi, puis redescends avec contrôle. Change de jambe.',
    steps: ['Pose un pied entier sur une marche stable.', 'Pousse sur ce pied pour te hisser et te redresser.', 'Redescends en contrôle, puis change de jambe.'],
    mistakes: ['Support instable.', 'Sauter en descendant.'],
    easy: 'Choisir une marche plus basse.', hard: 'Ajouter le sac à dos sur le dos.', cam: S('side', 'kneeMin', 25, 'rep')
  });
  X('squat-sumo', 'Squat sumo', 3, 2, [], 'rep', [10, 12, 15, 18, 22], {
    works: 'Cuisses (intérieur), fessiers', dose: '3 séries de 10 à 15 · repos 60 s',
    exec: 'Pieds très écartés, pointes ouvertes : descends en gardant le dos droit et les genoux dans l\'axe des pieds.',
    steps: ['Pieds deux fois plus larges que les épaules, pointes à 45°.', 'Descends droit, genoux orientés comme les pieds.', 'Remonte en serrant les fessiers.'],
    mistakes: ['Genoux qui rentrent vers l\'intérieur.', 'Buste trop penché.'],
    easy: 'Squat classique.', hard: 'Pause de 2 secondes en bas.', cam: S('front', 'knee', 35, 'rep')
  });
  X('fentes-laterales', 'Fentes latérales', 3, 3, [], 'side', [6, 8, 10, 12, 14], {
    works: 'Cuisses, fessiers, adducteurs', dose: '2 à 3 séries de 6 à 10 par côté',
    exec: 'Fais un grand pas sur le côté, fléchis la jambe qui avance en gardant l\'autre tendue, puis reviens.',
    steps: ['Debout, pieds joints.', 'Grand pas latéral, fléchis la jambe qui avance, l\'autre reste tendue.', 'Pousse pour revenir au centre, puis change de côté.'],
    mistakes: ['Genou qui part vers l\'intérieur.', 'Pointes tournées vers l\'intérieur.'],
    easy: 'Réduire l\'amplitude.', hard: 'Tenir 2 secondes en bas.', cam: S('front', 'kneeMin', 30, 'rep')
  });
  X('fentes-marchees', 'Fentes avant', 3, 3, [], 'rep', [10, 12, 16, 20, 24], {
    works: 'Cuisses, fessiers', dose: '2 à 3 séries de 10 à 20 pas',
    exec: 'Fais un pas en avant, fléchis les deux genoux sans heurter le sol, puis pousse pour revenir ou enchaîner.',
    steps: ['Debout, fais un grand pas en avant.', 'Fléchis les deux genoux, buste droit.', 'Pousse sur le pied avant pour revenir, puis alterne.'],
    mistakes: ['Pas trop court.', 'Genou avant qui dépasse largement les orteils.'],
    easy: 'Fentes sur place avec appui.', hard: 'Fentes marchées avec sac.', cam: S('side', 'kneeMin', 35, 'rep')
  });
  X('squat-saute', 'Squat sauté', 3, 4, [], 'rep', [6, 8, 10, 12, 15], {
    works: 'Cuisses, fessiers, mollets, explosivité', dose: '3 séries de 6 à 12 · repos 90 s',
    exec: 'Descends en squat puis pousse fort pour sauter, réceptionne doucement sur les pointes puis les talons.',
    steps: ['Pieds largeur d\'épaules.', 'Descends en squat, bras en arrière.', 'Saute, bras vers le haut, et réceptionne genoux fléchis.'],
    mistakes: ['Réception raide, genoux verrouillés.', 'Enchaîner trop vite.'],
    easy: 'Squat avec montée sur pointes.', hard: 'Squat sauté avec pause en bas.', cam: S('side', 'knee', 40, 'rep'),
    warn: 'Ne saute pas si tu as mal aux genoux ou si tes voisins du dessous dorment.'
  });
  X('squat-bulgare', 'Squat bulgare', 3, 4, ['chair'], 'side', [5, 6, 8, 10, 12], {
    works: 'Cuisses, fessiers, équilibre', dose: '2 à 3 séries de 5 à 10 par jambe',
    exec: 'Pied arrière posé sur une chaise, descends sur la jambe avant puis remonte.',
    steps: ['Pose le dessus d\'un pied sur une chaise derrière toi.', 'Fléchis la jambe avant, buste droit.', 'Remonte en poussant sur le talon avant.'],
    mistakes: ['Pied avant trop près de la chaise.', 'Chaise instable.'],
    easy: 'Fentes arrière avec appui.', hard: 'Ajouter le sac à dos.', cam: S('side', 'kneeMin', 35, 'rep')
  });
  X('pont-une-jambe', 'Pont à une jambe', 3, 3, [], 'side', [6, 8, 10, 12, 14], {
    works: 'Fessiers, arrière des cuisses', dose: '2 à 3 séries de 6 à 10 par jambe, amplitude confortable',
    exec: 'Pont fessier avec une jambe tendue vers le plafond : monte le bassin avec l\'autre.',
    steps: ['Sur le dos, un pied au sol, l\'autre jambe tendue.', 'Lève le bassin en poussant sur le talon.', 'Redescends en contrôle, puis change de jambe.'],
    mistakes: ['Bassin qui tourne.', 'Cambrer le dos.'],
    easy: 'Pont à deux jambes.', hard: 'Pause de 3 secondes en haut.', cam: S('side', 'hip', 25, 'rep')
  });
  X('pistol-assiste', 'Squat une jambe assisté', 3, 5, ['chair'], 'side', [2, 3, 4, 6, 8], {
    works: 'Cuisses, fessiers, équilibre, tronc', dose: '3 séries de 2 à 6 par jambe',
    exec: 'Sur une jambe, l\'autre tendue devant, descends le plus bas possible avec un appui léger sur la chaise.',
    steps: ['Debout sur une jambe près d\'une chaise stable, l\'autre jambe devant.', 'Descends lentement, bras devant ou main sur la chaise.', 'Remonte en poussant sur le pied.'],
    mistakes: ['Talon qui décolle.', 'Descendre plus bas que ton contrôle.'],
    easy: 'Squat bulgare.', hard: 'Squat une jambe sans appui.', cam: S('side', 'knee', 40, 'rep')
  });

  /* ============ 4. ABDOMINAUX ET GAINAGE ============ */
  X('planche', 'Planche classique', 4, 3, [], 'sec', [15, 20, 30, 40, 60], {
    src: 'base', works: 'Abdominaux, tronc', dose: '2 à 3 séries de 15 à 40 secondes',
    exec: 'Prends appui sur les avant-bras et les pieds. Garde le corps aligné et respire normalement.',
    steps: ['Avant-bras au sol, coudes sous les épaules, pieds joints.', 'Serre le ventre et les fessiers pour aligner tête, bassin et talons.', 'Tiens la position en respirant normalement.'],
    mistakes: ['Laisser tomber le bassin.', 'Bloquer la respiration.'],
    easy: 'Planche sur les genoux.', hard: 'Planche avec une jambe levée.', cam: S('side', 'tilt', 0, 'hold', { lo: 55, hi: 100 })
  });
  X('planche-genoux', 'Planche sur les genoux', 4, 1, [], 'sec', [15, 20, 25, 30, 40], {
    src: 'base', works: 'Abdominaux, stabilité', dose: '2 à 3 séries de 15 à 30 secondes',
    exec: 'Même position que la planche classique, mais avec les genoux au sol.',
    steps: ['Avant-bras au sol, genoux derrière les hanches.', 'Aligne épaules, bassin et genoux.', 'Tiens en respirant.'],
    mistakes: ['Creuser le dos.', 'Retenir sa respiration.'],
    easy: 'Réduire la durée.', hard: 'Planche classique.', cam: S('side', 'tilt', 0, 'hold', { lo: 30, hi: 100 })
  });
  X('dead-bug', 'Dead bug', 4, 2, [], 'side', [6, 8, 10, 12, 14], {
    src: 'base', works: 'Abdominaux profonds, coordination', dose: '2 à 3 séries de 8 à 12 par côté',
    exec: 'Allonge-toi sur le dos, bras vers le plafond et genoux levés. Tends lentement un bras et la jambe opposée, puis alterne.',
    steps: ['Sur le dos, bras tendus au plafond, genoux à 90° au-dessus des hanches.', 'Descends lentement un bras et la jambe opposée sans cambrer.', 'Reviens au centre et alterne.'],
    mistakes: ['Perdre le contrôle du bassin.', 'Cambrer le bas du dos.'],
    easy: 'Bouger seulement les jambes ou seulement les bras.', hard: 'Tiens une bouteille dans chaque main.', cam: S('side', 'limbs', 0.12, 'rep')
  });
  X('crunch-inverse', 'Crunch inversé', 4, 2, [], 'rep', [8, 10, 12, 15, 18], {
    src: 'base', works: 'Abdominaux', dose: '2 à 3 séries de 8 à 15',
    exec: 'Allonge-toi sur le dos, genoux pliés. Ramène doucement les genoux vers la poitrine en décollant légèrement le bassin, puis reviens sans élan.',
    steps: ['Sur le dos, mains le long du corps, genoux pliés à 90°.', 'Ramène les genoux vers la poitrine en décollant le bassin.', 'Redescends sans élan.'],
    mistakes: ['Balancer les jambes pour créer de l\'élan.', 'Tirer avec les bras.'],
    easy: 'Réduire l\'amplitude.', hard: 'Jambes tendues, sans poser les pieds.', cam: S('side', 'hip', 28, 'rep')
  });
  X('crunch', 'Crunch classique', 4, 1, [], 'rep', [8, 10, 12, 15, 18], {
    works: 'Abdominaux', dose: '2 à 3 séries de 10 à 15',
    exec: 'Sur le dos, genoux pliés, mains près des tempes : décolle les épaules du sol en contractant le ventre.',
    steps: ['Sur le dos, genoux pliés, pieds à plat.', 'Décolle les épaules du sol en contractant le ventre, regard au plafond.', 'Redescends lentement sans reposer complètement la tête.'],
    mistakes: ['Tirer sur la nuque.', 'Monter trop haut et utiliser l\'élan.'],
    easy: 'Bras croisés sur la poitrine.', hard: 'Pause de 2 secondes en haut.', cam: S('side', 'hip', 20, 'rep')
  });
  X('crunch-velo', 'Crunch vélo', 4, 2, [], 'side', [8, 10, 12, 15, 20], {
    src: 'base', works: 'Abdominaux, obliques', dose: '2 à 3 séries de 8 à 12 par côté',
    exec: 'Sur le dos, rapproche alternativement un coude du genou opposé, en tournant doucement le buste.',
    steps: ['Sur le dos, mains légères derrière la tête.', 'Rapproche un coude du genou opposé en tournant le buste.', 'Alterne lentement, comme un pédalage.'],
    mistakes: ['Tirer sur la nuque.', 'Aller trop vite.'],
    easy: 'Faire le mouvement lentement.', hard: 'Jambe tendue plus basse.', cam: S('side', 'kneelift', 0.3, 'alt')
  });
  X('mountain-climbers', 'Mountain climbers', 4, 3, [], 'rep', [16, 20, 24, 30, 40], {
    src: 'base', works: 'Abdominaux, épaules, cardio', dose: '2 à 3 séries de 15 à 30 secondes',
    exec: 'En position de pompe, ramène alternativement les genoux vers la poitrine. Commence lentement avant d\'accélérer si tu es à l\'aise.',
    steps: ['En position de pompe, mains sous les épaules, corps aligné.', 'Ramène un genou vers la poitrine.', 'Alterne en gardant le bassin stable.'],
    mistakes: ['Rebondir excessivement.', 'Perdre l\'alignement.'],
    easy: 'Avance les pieds un par un, lentement.', hard: 'Accélère le rythme.', cam: S('side', 'kneelift', 0.25, 'alt')
  });
  X('planche-laterale', 'Planche latérale', 4, 3, [], 'secside', [10, 15, 20, 30, 40], {
    works: 'Obliques, tronc, épaules', dose: '2 à 3 séries de 15 à 30 secondes par côté',
    exec: 'Sur le côté, appui sur un avant-bras et les pieds (ou le genou), hanches levées, corps aligné.',
    steps: ['Allonge-toi sur le côté, coude sous l\'épaule.', 'Lève les hanches pour aligner tête, bassin et pieds.', 'Tiens en respirant, puis change de côté.'],
    mistakes: ['Hanches qui tombent.', 'Épaule enfoncée vers l\'oreille.'],
    easy: 'Sur les genoux.', hard: 'Lève la jambe du dessus.', cam: S('side', 'tilt', 0, 'hold', { lo: 25, hi: 100 })
  });
  X('russian-twist', 'Russian twist', 4, 3, [], 'rep', [12, 16, 20, 24, 30], {
    works: 'Obliques, abdominaux', dose: '2 à 3 séries de 12 à 24 (un côté = 1)',
    exec: 'Assis, buste légèrement incliné en arrière, pieds levés ou au sol : tourne le buste d\'un côté puis de l\'autre.',
    steps: ['Assis, genoux pliés, dos droit, buste incliné en arrière.', 'Mains jointes (ou bouteille), tourne le buste vers un côté.', 'Reviens au centre et tourne de l\'autre côté.'],
    mistakes: ['Dos arrondi.', 'Tourner seulement les bras.'],
    easy: 'Pieds au sol.', hard: 'Pieds levés avec une bouteille.', cam: S('front', 'twist', 0.45, 'rep')
  });
  X('releves-jambes', 'Relevés de jambes', 4, 3, [], 'rep', [6, 8, 10, 12, 15], {
    works: 'Bas des abdominaux', dose: '2 à 3 séries de 8 à 12',
    exec: 'Sur le dos, jambes tendues : monte-les à la verticale puis redescends lentement sans cambrer.',
    steps: ['Sur le dos, mains sous les fessiers, jambes tendues.', 'Lève les jambes jusqu\'à la verticale.', 'Redescends lentement sans toucher le sol.'],
    mistakes: ['Cambrer le bas du dos.', 'Balancer les jambes.'],
    easy: 'Genoux pliés.', hard: 'Redescends en 4 secondes.', cam: S('side', 'hip', 40, 'rep')
  });
  X('v-ups', 'V-ups', 4, 4, [], 'rep', [6, 8, 10, 12, 15], {
    works: 'Abdominaux, flexibilité des hanches', dose: '2 à 3 séries de 6 à 12',
    exec: 'Allongé, monte simultanément le buste et les jambes tendues pour former un V, puis redescends.',
    steps: ['Allongé, bras au-dessus de la tête, jambes tendues.', 'Monte buste et jambes en même temps pour toucher tes pieds.', 'Redescends en contrôle.'],
    mistakes: ['Utiliser l\'élan.', 'Dos arrondi excessif.'],
    easy: 'Crunch inversé.', hard: 'Pause de 2 secondes en V.', cam: S('side', 'hip', 50, 'rep')
  });
  X('hollow-body', 'Gainage dos au sol (hollow)', 4, 4, [], 'sec', [10, 15, 20, 30, 40], {
    works: 'Abdominaux, tronc', dose: '3 séries de 10 à 30 secondes',
    exec: 'Allongé sur le dos, lombaires collées au sol, épaules et jambes décollées, corps en forme de banane.',
    steps: ['Sur le dos, bras tendus derrière la tête, jambes tendues.', 'Plaque les lombaires au sol, décolle épaules et jambes.', 'Tiens en respirant.'],
    mistakes: ['Cambrer le bas du dos.', 'Retenir sa respiration.'],
    easy: 'Genoux pliés.', hard: 'Bras et jambes plus bas.', cam: S('side', 'tilt', 0, 'hold', { lo: 40, hi: 100 })
  });

  /* ============ 5. BICEPS, TRICEPS ET AVANT-BRAS ============ */
  X('curl-sac', 'Flexions des biceps avec sac', 5, 2, ['bag'], 'rep', [10, 12, 14, 16, 18], {
    src: 'base', works: 'Biceps, avant-bras', dose: '2 à 3 séries de 8 à 15',
    exec: 'Tiens le sac par une poignée solide, garde les coudes près du corps et plie les bras pour le remonter. Redescends lentement.',
    steps: ['Debout, sac tenu par la poignée, coudes collés au corps.', 'Plie le coude pour remonter le sac vers l\'épaule.', 'Redescends lentement, bras presque tendus.'],
    mistakes: ['Charge instable.', 'Balancer le buste.'],
    easy: 'Alléger le sac.', hard: 'Descente de 3 secondes.', cam: S('side', 'elbow', 55, 'rep')
  });
  X('poignets-flexion', 'Flexions des poignets', 5, 1, ['bottle', 'chair'], 'rep', [12, 15, 18, 20, 25], {
    src: 'base', works: 'Avant-bras (fléchisseurs)', dose: '2 à 3 séries de 12 à 20',
    exec: 'Assieds-toi, pose l\'avant-bras sur la cuisse et bouge doucement le poignet vers le haut puis vers le bas.',
    steps: ['Assis, avant-bras posé sur la cuisse, poignet dans le vide, paume vers le haut.', 'Remonte la main avec la bouteille sans bouger l\'avant-bras.', 'Redescends lentement.'],
    mistakes: ['Charge trop lourde.', 'Douleur au poignet.'],
    easy: 'Bouteille plus légère ou sans charge.', hard: 'Pause en haut de 2 secondes.', cam: S('side', 'manual', 0, 'manual')
  });
  X('poignets-extension', 'Extensions des poignets', 5, 1, ['bottle', 'chair'], 'rep', [12, 15, 18, 20, 25], {
    works: 'Avant-bras (extenseurs)', dose: '2 à 3 séries de 10 à 15',
    exec: 'Avant-bras posé sur la cuisse, paume vers le bas. Relève doucement le dos de la main puis redescends.',
    steps: ['Assis, avant-bras sur la cuisse, paume vers le bas.', 'Relève le dos de la main sans bouger le bras.', 'Redescends lentement.'],
    mistakes: ['Mouvement brusque.', 'Charge excessive.'],
    easy: 'Sans charge.', hard: 'Bouteille plus remplie.', cam: S('side', 'manual', 0, 'manual')
  });
  X('serviette-serrage', 'Serrage de serviette', 5, 1, ['towel'], 'sec', [10, 15, 20, 25, 30], {
    src: 'base', works: 'Poigne, muscles des mains et avant-bras', dose: '2 à 3 séries de 10 à 15 secondes',
    exec: 'Tiens une serviette et serre-la fermement quelques secondes sans provoquer de douleur, puis relâche.',
    steps: ['Enroule la serviette dans les mains.', 'Serre fermement et tords sans douleur.', 'Tiens quelques secondes, puis relâche.'],
    mistakes: ['Serrer jusqu\'à la crampe.', 'Retenir sa respiration.'],
    easy: 'Diminuer la pression.', hard: 'Serviette mouillée.', cam: S('front', 'presence', 0, 'presence')
  });
  X('triceps-extension-sac', 'Extension triceps derrière la tête', 5, 2, ['bag'], 'rep', [10, 12, 14, 16, 18], {
    works: 'Triceps, épaules', dose: '2 à 3 séries de 10 à 15',
    exec: 'Sac tenu à deux mains derrière la tête : étends les bras vers le haut en gardant les coudes serrés.',
    steps: ['Debout, sac tenu à deux mains, bras tendus au-dessus de la tête.', 'Plie les coudes pour descendre le sac derrière la tête.', 'Étends les bras sans écarter les coudes.'],
    mistakes: ['Coudes qui s\'écartent.', 'Cambrer le dos.'],
    easy: 'Alléger le sac.', hard: 'Un bras à la fois.', cam: S('side', 'elbow', 55, 'rep')
  });
  X('kickback-bouteille', 'Kickback triceps', 5, 2, ['bottle'], 'side', [8, 10, 12, 14, 16], {
    works: 'Triceps', dose: '2 à 3 séries de 10 à 15 par bras',
    exec: 'Penché en avant, coude collé au corps : étends le bras vers l\'arrière, puis reviens.',
    steps: ['Penché, dos plat, coude fléchi à 90° et collé au flanc.', 'Étends l\'avant-bras vers l\'arrière.', 'Reviens lentement.'],
    mistakes: ['Coude qui descend.', 'Balancer le buste.'],
    easy: 'Sans bouteille.', hard: 'Pause de 2 secondes bras tendu.', cam: S('side', 'elbow', 45, 'rep')
  });
  X('curl-marteau', 'Curl improvisé (marteau)', 5, 2, ['bottle'], 'rep', [10, 12, 14, 16, 18], {
    works: 'Biceps, avant-bras', dose: '2 à 3 séries de 10 à 15',
    exec: 'Une bouteille dans chaque main, paumes face à face : monte une bouteille à l\'épaule puis l\'autre, en alternance.',
    steps: ['Debout, une bouteille dans chaque main, paumes face à face.', 'Monte un poing vers l\'épaule, coude près du corps.', 'Redescends et alterne.'],
    mistakes: ['Balancer le corps.', 'Charges trop lourdes.'],
    easy: 'Bouteilles plus légères.', hard: 'Descente de 3 secondes.', cam: S('side', 'elbow', 55, 'rep')
  });
  X('curl-concentre', 'Curl concentré assis', 5, 2, ['chair', 'bottle'], 'side', [8, 10, 12, 14, 16], {
    works: 'Biceps', dose: '2 à 3 séries de 10 à 12 par bras',
    exec: 'Assis, coude calé contre l\'intérieur de la cuisse : monte la bouteille en contractant le biceps.',
    steps: ['Assis, jambes écartées, coude contre l\'intérieur de la cuisse.', 'Monte la bouteille vers l\'épaule.', 'Redescends lentement, bras presque tendu.'],
    mistakes: ['Épaule qui monte.', 'Mouvement trop rapide.'],
    easy: 'Sans charge.', hard: 'Pause de 2 secondes en haut.', cam: S('side', 'elbow', 55, 'rep')
  });
  X('farmer-carry', 'Marche du fermier', 5, 3, ['bag'], 'sec', [20, 30, 40, 50, 60], {
    works: 'Poigne, avant-bras, épaules, tronc', dose: '2 à 3 séries de 20 à 40 secondes',
    exec: 'Tiens des charges légères et équilibrées, bras le long du corps, et marche lentement avec le dos neutre.',
    steps: ['Tiens le sac (ou des charges équilibrées), bras le long du corps.', 'Marche lentement en gardant le dos droit et les épaules basses.', 'Pose les charges avec contrôle.'],
    mistakes: ['Charges mal fermées.', 'Posture penchée.'],
    easy: 'Charges plus légères.', hard: 'Un seul côté chargé.', cam: S('side', 'move', 0, 'move')
  });

  /* ============ 6. CARDIO ET CORPS ENTIER ============ */
  X('jumping-jacks', 'Jumping jacks', 6, 1, [], 'rep', [20, 30, 40, 50, 60], {
    src: 'base', works: 'Jambes, épaules, endurance', dose: '2 à 3 séries de 20 à 40 secondes',
    exec: 'Saute en écartant les pieds et en levant les bras, puis reviens à la position de départ. Variante sans saut possible.',
    steps: ['Debout, pieds joints, bras le long du corps.', 'Saute en écartant les pieds et lève les bras au-dessus de la tête.', 'Reviens à la position de départ.'],
    mistakes: ['Atterrir bruyamment.', 'Perdre le contrôle.'],
    easy: 'Alterner les pas sans sauter.', hard: 'Accélérer le rythme.', cam: S('front', 'wristup', 0.7, 'rep')
  });
  X('montees-genoux', 'Montées de genoux', 6, 1, [], 'rep', [20, 30, 40, 50, 60], {
    src: 'base', works: 'Jambes, hanches, cardio', dose: '2 à 3 séries de 20 à 40 secondes',
    exec: 'Marche ou cours sur place en levant alternativement les genoux. Commence sans saut.',
    steps: ['Debout, buste droit.', 'Monte un genou à hauteur de hanche, puis l\'autre.', 'Garde un rythme régulier, bras qui accompagnent.'],
    mistakes: ['Accélérer au point de perdre la technique.', 'Se pencher en arrière.'],
    easy: 'Marcher sur place.', hard: 'Genoux plus hauts, plus vite.', cam: S('side', 'kneelift', 0.25, 'alt')
  });
  X('burpees-adaptes', 'Burpees adaptés', 6, 3, [], 'rep', [4, 6, 8, 10, 12], {
    src: 'base', works: 'Corps entier, endurance', dose: '2 à 3 séries de 5 à 10',
    exec: 'Plie les genoux, pose les mains au sol, recule les pieds un par un en position de planche, puis reviens debout. Le saut est facultatif.',
    steps: ['Debout, plie les genoux et pose les mains au sol.', 'Recule les pieds un par un en position de planche.', 'Reviens accroupi puis redresse-toi.'],
    mistakes: ['Forcer la vitesse.', 'Perdre le contrôle du dos.'],
    easy: 'Sans saut et avec pas arrière alternés.', hard: 'Burpees complets.', cam: S('side', 'tilt', 40, 'rep')
  });
  X('squat-pointes', 'Squat + montée sur pointes', 6, 2, [], 'rep', [8, 10, 12, 15, 18], {
    src: 'base', works: 'Cuisses, fessiers, mollets', dose: '2 à 3 séries de 10 à 15',
    exec: 'Réalise un squat contrôlé. En te redressant, monte sur la pointe des pieds, puis repose les talons.',
    steps: ['Squat contrôlé, dos droit.', 'En te redressant, monte sur la pointe des pieds, bras au ciel.', 'Repose les talons et recommence.'],
    mistakes: ['Perdre l\'équilibre.', 'Rebondir.'],
    easy: 'Se tenir à un mur.', hard: 'Squat sauté.', cam: S('side', 'knee', 40, 'rep')
  });
  X('skaters', 'Sauts de patineur', 6, 3, [], 'side', [8, 10, 12, 16, 20], {
    works: 'Cuisses, fessiers, équilibre, cardio', dose: '2 à 3 séries de 10 à 20 sauts',
    exec: 'Saute latéralement d\'une jambe sur l\'autre en croisant la jambe arrière, comme un patineur.',
    steps: ['Debout sur une jambe, genou fléchi.', 'Saute sur le côté et réceptionne sur l\'autre jambe.', 'Balance les bras et alterne.'],
    mistakes: ['Réception raide.', 'Perdre l\'équilibre.'],
    easy: 'Pas latéraux sans saut.', hard: 'Sauts plus longs.', cam: S('front', 'hipx', 0.5, 'rep')
  });
  X('shadow-boxing', 'Boxe dans le vide', 6, 1, [], 'sec', [30, 40, 45, 60, 75], {
    works: 'Épaules, bras, tronc, cardio', dose: '2 à 3 rounds de 30 à 60 secondes',
    exec: 'Garde haute, jambes légèrement fléchies : enchaîne directs et crochets en rotation, en restant mobile.',
    steps: ['Garde haute, un pied devant, genoux souples.', 'Lance des directs en tournant les hanches.', 'Reviens en garde après chaque coup.'],
    mistakes: ['Bras tendus à fond (articulations).', 'Oublier la garde.'],
    easy: 'Rythme lent.', hard: 'Rythme rapide avec déplacements.', cam: S('side', 'move', 0, 'move')
  });
  X('talons-fesses', 'Talons-fesses', 6, 1, [], 'rep', [20, 30, 40, 50, 60], {
    works: 'Arrière des cuisses, mollets, cardio', dose: '2 à 3 séries de 20 à 40 secondes',
    exec: 'Cours sur place en ramenant les talons vers les fessiers.',
    steps: ['Debout, buste droit.', 'Ramène un talon vers la fesse, puis l\'autre.', 'Garde un rythme régulier.'],
    mistakes: ['Se pencher en avant.', 'Taper sur le sol.'],
    easy: 'Marche sur place.', hard: 'Accélère.', cam: S('side', 'kneelift', 0.25, 'alt')
  });
  X('tap-epaule', 'Planche avec toucher d\'épaule', 6, 3, [], 'side', [6, 8, 10, 12, 16], {
    works: 'Tronc, épaules, stabilité', dose: '2 à 3 séries de 6 à 12 par côté',
    exec: 'En position de pompe, touche une épaule avec la main opposée sans tourner le bassin.',
    steps: ['Position de pompe, pieds un peu écartés.', 'Touche l\'épaule avec la main opposée.', 'Repose la main et alterne, bassin stable.'],
    mistakes: ['Balancer les hanches.', 'Pieds trop serrés.'],
    easy: 'Sur les genoux.', hard: 'Pieds joints.', cam: S('side', 'limbs', 0.1, 'rep')
  });
  X('bear-crawl', 'Marche de l\'ours', 6, 4, [], 'sec', [15, 20, 30, 40, 50], {
    works: 'Épaules, tronc, cuisses, fessiers', dose: '3 séries de 15 à 40 secondes',
    exec: 'À quatre pattes, genoux décollés du sol : avance (ou balance) bras et jambe opposés, sans lever le bassin.',
    steps: ['À quatre pattes, genoux à quelques centimètres du sol.', 'Avance un bras et la jambe opposée, dos plat.', 'Alterne avec contrôle.'],
    mistakes: ['Bassin trop haut.', 'Dos creusé.'],
    easy: 'Bird-dog.', hard: 'Avance plus vite.', cam: S('side', 'move', 0, 'move')
  });
  X('burpees-complets', 'Burpees complets', 6, 5, [], 'rep', [4, 6, 8, 10, 15], {
    works: 'Corps entier, endurance, explosivité', dose: '3 séries de 6 à 12',
    exec: 'Accroupi, jambes en arrière en planche, pompe, retour accroupi puis saut vertical.',
    steps: ['Accroupi, mains au sol, jambes en planche.', 'Fais une pompe complète.', 'Reviens accroupi et saute vers le haut.'],
    mistakes: ['Dos creusé en planche.', 'Réception raide.'],
    easy: 'Burpees adaptés.', hard: 'Ajoute un saut groupé.', cam: S('side', 'tilt', 40, 'rep')
  });

  /* ============ 7. MOBILITÉ ET RÉCUPÉRATION ============ */
  X('rotations-epaules', 'Rotations des épaules', 7, 1, [], 'rep', [10, 10, 10, 10, 10], {
    src: 'base', works: 'Épaules', dose: '2 séries de 10 dans chaque sens',
    exec: 'Fais des cercles lents avec les épaules vers l\'avant puis vers l\'arrière.',
    steps: ['Debout, bras relâchés.', 'Dessine de grands cercles lents avec les épaules vers l\'avant.', 'Inverse le sens vers l\'arrière.'],
    mistakes: ['Aller trop vite.', 'Forcer l\'amplitude.'], easy: 'Petits cercles.', hard: 'Cercles de bras complets.', cam: S('front', 'presence', 0, 'presence')
  });
  X('chat-vache', 'Chat-vache', 7, 1, [], 'rep', [8, 8, 10, 10, 10], {
    src: 'base', works: 'Colonne, dos, abdominaux', dose: '2 séries de 8 à 10',
    exec: 'À quatre pattes, arrondis puis creuse très légèrement le dos en suivant ta respiration.',
    steps: ['À quatre pattes, mains sous les épaules.', 'Expire en arrondissant le dos, menton vers la poitrine.', 'Inspire en creusant très légèrement, regard vers l\'avant.'],
    mistakes: ['Creuser trop fort.', 'Aller trop vite.'], easy: 'Petite amplitude.', hard: 'Pause de 2 secondes à chaque position.', cam: S('side', 'presence', 0, 'presence')
  });
  X('mobilite-chevilles', 'Mobilité des chevilles', 7, 1, [], 'side', [10, 10, 10, 10, 10], {
    src: 'base', works: 'Chevilles', dose: '2 séries de 10 cercles par côté',
    exec: 'Fais des cercles lents avec chaque cheville.',
    steps: ['Debout, tiens-toi à un support, lève un pied.', 'Dessine de grands cercles avec la cheville.', 'Change de sens, puis de pied.'],
    mistakes: ['Cercles trop petits.', 'Aller trop vite.'], easy: 'Assis.', hard: 'Sur une jambe sans appui.', cam: S('side', 'presence', 0, 'presence')
  });
  X('etirement-mollets', 'Étirement des mollets', 7, 1, ['wall'], 'secside', [20, 25, 30, 30, 30], {
    src: 'base', works: 'Mollets', dose: '20 à 30 secondes par jambe',
    exec: 'Place les mains contre un mur, recule une jambe et garde son talon au sol.',
    steps: ['Mains contre le mur, une jambe en avant.', 'Recule l\'autre jambe, talon bien au sol.', 'Fléchis la jambe avant jusqu\'à sentir l\'étirement du mollet.'],
    mistakes: ['Talon qui décolle.', 'Rebondir.'], easy: 'Réduire l\'écart.', hard: 'Genou arrière légèrement fléchi.', cam: S('side', 'presence', 0, 'presence')
  });
  X('etirement-cuisses', 'Étirement doux des cuisses', 7, 1, ['wall'], 'secside', [20, 25, 30, 30, 30], {
    src: 'base', works: 'Quadriceps', dose: '20 à 30 secondes par côté',
    exec: 'Tiens-toi à un support stable, plie un genou et rapproche doucement le talon de la fesse.',
    steps: ['Tiens-toi au mur.', 'Plie un genou, attrape le pied avec la main.', 'Rapproche doucement le talon de la fesse, genoux joints.'],
    mistakes: ['Cambrer le dos.', 'Tirer trop fort.'], easy: 'Avec une serviette autour du pied.', hard: 'Pousse la hanche vers l\'avant.', cam: S('side', 'presence', 0, 'presence')
  });
  X('etirement-pectoraux', 'Étirement des pectoraux', 7, 1, ['wall'], 'sec', [20, 25, 30, 30, 30], {
    works: 'Pectoraux, épaules', dose: '20 à 30 secondes par côté',
    exec: 'Avant-bras contre un mur, coude à hauteur d\'épaule : avance doucement le buste.',
    steps: ['Avant-bras contre le mur, coude à 90°.', 'Avance doucement le buste.', 'Tiens en respirant, puis change de côté.'],
    mistakes: ['Forcer l\'épaule.', 'Cambrer le dos.'], easy: 'Coude plus bas.', hard: 'Coude plus haut.', cam: S('side', 'presence', 0, 'presence')
  });
  X('posture-enfant', 'Posture de l\'enfant', 7, 1, [], 'sec', [30, 40, 50, 60, 60], {
    works: 'Dos, hanches, épaules', dose: '30 à 60 secondes',
    exec: 'À genoux, assis sur les talons, buste penché en avant, bras tendus devant toi, front vers le sol.',
    steps: ['À genoux, orteils joints, genoux écartés.', 'Assieds-toi sur les talons, penche le buste en avant.', 'Étends les bras devant toi et respire lentement.'],
    mistakes: ['Forcer sur les genoux.', 'Retenir sa respiration.'], easy: 'Coussin sous les fesses.', hard: 'Bras plus loin.', cam: S('side', 'presence', 0, 'presence')
  });
  X('respiration-lente', 'Respiration profonde', 7, 1, [], 'sec', [60, 60, 90, 90, 120], {
    works: 'Détente, récupération', dose: '1 à 2 minutes',
    exec: 'Assieds-toi confortablement et respire lentement par le nez, sans forcer, en expirant doucement par la bouche.',
    steps: ['Assieds-toi, dos droit, mains sur les cuisses.', 'Inspire lentement par le nez pendant 4 secondes.', 'Expire doucement par la bouche pendant 6 secondes.'],
    mistakes: ['Forcer la respiration.', 'Se crisper.'], easy: 'Allongé.', hard: 'Inspire 5 s, expire 7 s.', cam: S('side', 'presence', 0, 'presence')
  });

  NEV.CATS = CATS;
  NEV.EQUIP = EQUIP;
  NEV.MUSCLES_FR = MUSCLES_FR;
  NEV.CAM_PLACE = CAM_PLACE;
  NEV.EX_DATA = L;
  NEV.DataKit = { X, S, CATS };
})(window);
