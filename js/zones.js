/* ==========================================================
   neV.BOOSTER — zones.js
   La page « Spécialisation » : une zone du corps = plusieurs
   exercices + des enchaînements (combos) tout prêts.
   La vision du site reste le corps entier : rien n'est imposé.
   Format d'un combo : items = [ [id de l'exercice, nombre de séries], … ]
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});

  const VISION = {
    title: 'Notre vision : tout le corps',
    text: 'neV.BOOSTER veut que tu construises un corps complet, équilibré et fort : haut, bas, tronc, mobilité et souffle. Mais rien n\'est imposé. Ici, tu choisis librement une zone à travailler en priorité, ou tu gardes le tirage « corps entier ». Tu peux changer d\'avis chaque jour.',
    points: [
      'Zone choisie ? Tu tires une carte au hasard parmi ses exercices, avec le même gacha animé que partout.',
      'Pas de zone ? Le gacha du jour tire dans tout le corps, comme d\'habitude.',
      'Tu peux aussi marquer jusqu\'à 3 zones « prioritaires » : elles sortent plus souvent dans ton gacha du jour.'
    ]
  };

  const Z = [];
  const zone = (id, name, o) => Z.push(Object.assign({ id, name, ex: [], combos: [] }, o));
  const C = (zid, n, name, lvl, blurb, items) => ({ id: zid + '-' + n, zone: zid, name, lvl, blurb, items });

  zone('cou', 'Cou', {
    icon: 'neck', thumb: 'cou-lateral-iso',
    desc: 'Un cou solide protège les cervicales, soulage les tensions de la journée et améliore ta posture.',
    how: 'On travaille surtout en isométrie : tu pousses contre ta main, sans que la tête bouge. C\'est la méthode la plus sûre pour cette zone fragile.',
    care: 'Jamais de rotations brusques ni de poussées fortes. À la moindre douleur ou fourmillement : tu arrêtes.',
    ex: ['cou-flexion-iso', 'cou-extension-iso', 'cou-lateral-iso', 'menton-rentre', 'haussements-epaules', 'etirement-cou'],
    combos: [
      C('cou', 1, 'Cou : les 4 directions', 'Tous niveaux', 'Devant, derrière, de chaque côté : le tour complet en 5 minutes.', [['cou-flexion-iso', 2], ['cou-extension-iso', 2], ['cou-lateral-iso', 2], ['etirement-cou', 1]]),
      C('cou', 2, 'Posture de bureau', 'Débutant', 'Pour celles et ceux qui passent la journée assis, tête en avant.', [['menton-rentre', 2], ['haussements-epaules', 2], ['retraction-omoplates', 2], ['etirement-cou', 1]]),
      C('cou', 3, 'Cou et trapèzes costauds', 'Intermédiaire', 'Plus de volume sur les trapèzes, avec des bouteilles pleines.', [['haussements-epaules', 3], ['cou-extension-iso', 3], ['cou-lateral-iso', 3], ['farmer-hold', 2]])
    ]
  });
  zone('epaules', 'Épaules', {
    icon: 'shoulder', thumb: 'elevations-laterales',
    desc: 'Des épaules larges donnent de la carrure et stabilisent tout le haut du corps.',
    how: 'Élévations avec des bouteilles, poussées au-dessus de la tête et pompes en V : tu travailles l\'avant, le côté et l\'arrière.',
    care: 'Monte les bras sans balancer le buste et reste sous la hauteur des épaules pour les élévations.',
    ex: ['elevations-laterales', 'elevations-frontales', 'developpe-bouteilles', 'rowing-vertical-bouteilles', 'pompes-pike', 'cercles-bras', 'rotations-epaules', 'ytw'],
    combos: [
      C('epaules', 1, 'Boulets de canon', 'Intermédiaire', 'Trois exercices avec bouteilles pour chauffer toute l\'épaule.', [['elevations-laterales', 3], ['elevations-frontales', 3], ['developpe-bouteilles', 3]]),
      C('epaules', 2, 'Épaules sans matériel', 'Tous niveaux', 'Rien à acheter : ton corps suffit.', [['pompes-pike', 3], ['cercles-bras', 2], ['rotations-epaules', 2], ['anges-inverses', 2]]),
      C('epaules', 3, 'Épaules en 3D', 'Costaud', 'Avant, côté, arrière : pour des épaules rondes.', [['developpe-bouteilles', 3], ['rowing-vertical-bouteilles', 3], ['elevations-laterales', 3], ['ytw', 2]])
    ]
  });
  zone('bras', 'Triceps et biceps', {
    icon: 'arm', thumb: 'curl-sac',
    desc: 'Les biceps tirent, les triceps poussent : ensemble ils font des bras forts et équilibrés.',
    how: 'Des curls avec un sac ou des bouteilles pour l\'avant, des dips et des pompes serrées pour l\'arrière du bras.',
    care: 'Garde les coudes près du corps et descends lentement : la descente travaille autant que la montée.',
    ex: ['curl-sac', 'curl-marteau', 'curl-concentre', 'curl-inverse', 'tractions-supination', 'extension-triceps-sol', 'triceps-extension-sac', 'kickback-bouteille', 'dips-chaise', 'dips-sol', 'pompes-diamant', 'pompes-rapprochees'],
    combos: [
      C('bras', 1, 'Biceps express', 'Débutant', 'Quatre variantes de curl pour gonfler l\'avant du bras.', [['curl-sac', 3], ['curl-marteau', 3], ['curl-concentre', 2], ['curl-inverse', 2]]),
      C('bras', 2, 'Triceps express', 'Intermédiaire', 'L\'arrière du bras prend feu en dix minutes.', [['dips-chaise', 3], ['pompes-diamant', 3], ['extension-triceps-sol', 2], ['kickback-bouteille', 2]]),
      C('bras', 3, 'Bras complets', 'Costaud', 'Pousser et tirer dans la même séance.', [['curl-sac', 3], ['dips-sol', 3], ['curl-marteau', 2], ['pompes-rapprochees', 3]])
    ]
  });
  zone('avantbras', 'Avant-bras', {
    icon: 'forearm', thumb: 'poignets-flexion',
    desc: 'Des avant-bras solides, c\'est une meilleure prise, des poignets protégés et des bras qui ont l\'air plus épais.',
    how: 'Flexions et extensions du poignet, serrage, et tenues en portant une charge.',
    care: 'Mouvements lents, charge légère. Si tes poignets ou tes coudes tirent, tu allèges.',
    ex: ['poignets-flexion', 'poignets-extension', 'serviette-serrage', 'curl-inverse', 'farmer-hold', 'farmer-carry'],
    combos: [
      C('avantbras', 1, 'Poignets d\'acier', 'Tous niveaux', 'Le trio de base : dedans, dehors, et serrage.', [['poignets-flexion', 3], ['poignets-extension', 3], ['serviette-serrage', 3]]),
      C('avantbras', 2, 'Prise de fer', 'Intermédiaire', 'Tenues et curls inversés pour une grosse poigne.', [['farmer-hold', 3], ['curl-inverse', 3], ['serviette-serrage', 2], ['poignets-extension', 2]]),
      C('avantbras', 3, 'La marche du fermier', 'Costaud', 'Marcher avec une charge : le meilleur exercice de prise.', [['farmer-carry', 3], ['poignets-flexion', 2], ['poignets-extension', 2]])
    ]
  });
  zone('doigts', 'Doigts et mains', {
    icon: 'hand', thumb: 'ouverture-fermeture-mains',
    desc: 'Des doigts forts et souples : utile pour la prise, l\'écriture, l\'escalade, et pour éviter les crampes de la main.',
    how: 'Ouvrir et fermer, pincer, serrer, puis (pour les avancés) pompes sur les doigts.',
    care: 'Commence très doucement : les doigts sont fragiles. Pas de pompes sur les doigts avant plusieurs semaines de pratique régulière.',
    ex: ['ouverture-fermeture-mains', 'pincement-serviette', 'serviette-serrage', 'poignets-extension', 'farmer-hold', 'pompes-doigts'],
    combos: [
      C('doigts', 1, 'Mains vives', 'Débutant', 'De la souplesse et un peu de force, sans risque.', [['ouverture-fermeture-mains', 3], ['pincement-serviette', 2], ['serviette-serrage', 2]]),
      C('doigts', 2, 'Esprit grimpeur', 'Intermédiaire', 'Pincer et tenir : comme accroché à une prise.', [['pincement-serviette', 3], ['farmer-hold', 3], ['poignets-extension', 2]]),
      C('doigts', 3, 'Doigts d\'acier (avancé)', 'Costaud', 'Pour ceux qui ont déjà des mains solides.', [['pompes-doigts', 3], ['pincement-serviette', 3], ['ouverture-fermeture-mains', 2]])
    ]
  });
  zone('poitrine', 'Poitrine', {
    icon: 'chest', thumb: 'pompes-classiques',
    desc: 'Des pectoraux puissants : pousser, porter, se relever du sol.',
    how: 'Toute la famille des pompes (inclinées, larges, déclinées, explosives) et la presse de paumes.',
    care: 'Corps gainé de la tête aux talons et coudes à 45° du corps : tes épaules te remercieront.',
    ex: ['pompes-classiques', 'pompes-larges', 'pompes-inclinees', 'pompes-declinees', 'pompes-genoux', 'pompes-mur', 'pompes-archer', 'pompes-claquees', 'presse-paumes', 'etirement-pectoraux'],
    combos: [
      C('poitrine', 1, 'Pectoraux débutants', 'Débutant', 'Des pompes faciles, puis un étirement pour finir.', [['pompes-genoux', 3], ['pompes-inclinees', 3], ['presse-paumes', 2], ['etirement-pectoraux', 1]]),
      C('poitrine', 2, 'Pyramide de pompes', 'Intermédiaire', 'On monte en difficulté, série après série.', [['pompes-inclinees', 2], ['pompes-classiques', 3], ['pompes-larges', 3], ['pompes-declinees', 2]]),
      C('poitrine', 3, 'Poitrine explosive', 'Costaud', 'De la vitesse et de la puissance.', [['pompes-claquees', 3], ['pompes-archer', 3], ['pompes-larges', 2], ['presse-paumes', 2]])
    ]
  });
  zone('abdos', 'Abdominaux', {
    icon: 'abs', thumb: 'crunch',
    desc: 'Les abdos stabilisent ton corps dans chaque mouvement. Ils sont plus puissants quand le bas du dos est protégé.',
    how: 'Un mélange de gainage (tenir) et de mouvements (crunchs, relevés) pour travailler toutes les parties du ventre.',
    care: 'Le bas du dos reste plaqué au sol et le cou reste long : on ne tire jamais sur la nuque.',
    ex: ['crunch', 'crunch-inverse', 'crunch-velo', 'releves-jambes', 'v-ups', 'dead-bug', 'hollow-body', 'planche', 'planche-genoux', 'mountain-climbers'],
    combos: [
      C('abdos', 1, 'Ventre plat express', 'Débutant', 'Les trois classiques en moins de dix minutes.', [['crunch', 3], ['crunch-inverse', 3], ['planche-genoux', 3]]),
      C('abdos', 2, 'Gainage anti-ballon', 'Intermédiaire', 'Du tronc solide comme un roc.', [['dead-bug', 3], ['hollow-body', 3], ['planche', 3], ['mountain-climbers', 3]]),
      C('abdos', 3, 'Tablette', 'Costaud', 'Pour viser le haut, le bas et les côtés.', [['crunch-velo', 3], ['releves-jambes', 3], ['v-ups', 3], ['planche', 2]])
    ]
  });
  zone('dos', 'Dos', {
    icon: 'back', thumb: 'superman',
    desc: 'Un dos solide redresse les épaules et protège la colonne. C\'est la zone qu\'on oublie le plus, alors qu\'elle fait la différence.',
    how: 'Exercices au sol et avec un sac pour renforcer le milieu du dos et l\'arrière des épaules.',
    care: 'Fais des mouvements lents, sans à-coups. Le but est de serrer les omoplates, pas de lancer les bras.',
    ex: ['superman', 'bird-dog', 'anges-inverses', 'rowing-sac', 'rowing-sac-unilateral', 'ytw', 'tirage-serviette', 'retraction-omoplates', 'swimmer'],
    combos: [
      C('dos', 1, 'Dos droit', 'Débutant', 'Redresse-toi : le trio posture.', [['superman', 3], ['bird-dog', 3], ['retraction-omoplates', 3]]),
      C('dos', 2, 'Ailes de dos', 'Intermédiaire', 'Pour l\'arrière des épaules et le haut du dos.', [['ytw', 3], ['anges-inverses', 3], ['swimmer', 3], ['tirage-serviette', 2]]),
      C('dos', 3, 'Rowing maison', 'Costaud', 'On tire avec un sac chargé, puis on gaine le dos.', [['rowing-sac', 3], ['rowing-sac-unilateral', 3], ['superman', 2], ['retraction-omoplates', 2]])
    ]
  });
  zone('dorsaux', 'Dorsaux', {
    icon: 'lats', thumb: 'tractions',
    desc: 'Les grands dorsaux donnent la largeur du dos (la fameuse forme en V). Ils sont la star des tractions.',
    how: 'Tirer vers soi : tractions et tractions inversées si tu as une barre ou une table solide, rowing et pull-over avec un sac sinon.',
    care: 'Ne te suspends qu\'à un support réellement solide. Jamais une porte, une table qui bouge ou une branche douteuse.',
    ex: ['tractions', 'tractions-inversees', 'pullover-sac', 'rowing-sac', 'rowing-sac-unilateral', 'tirage-serviette', 'anges-inverses'],
    combos: [
      C('dorsaux', 1, 'Vers les tractions', 'Intermédiaire', 'Prépare ton corps à la première vraie traction.', [['tirage-serviette', 3], ['rowing-sac', 3], ['tractions-inversees', 3]]),
      C('dorsaux', 2, 'Large comme une porte', 'Costaud', 'Pour dessiner le V : barre et sac.', [['tractions', 3], ['pullover-sac', 3], ['rowing-sac-unilateral', 3]]),
      C('dorsaux', 3, 'Dorsaux sans barre', 'Tous niveaux', 'Pas de barre ? Pas de problème.', [['pullover-sac', 3], ['rowing-sac', 3], ['anges-inverses', 3], ['tirage-serviette', 2]])
    ]
  });
  zone('obliques', 'Abdos latéraux (côtes)', {
    icon: 'obliques', thumb: 'planche-laterale',
    desc: 'Les obliques sont les muscles des flancs : ils font tourner et pencher le tronc, et affinent la taille.',
    how: 'Planches latérales, torsions et flexions sur le côté, avec ou sans bouteille.',
    care: 'Pivote depuis les côtes, pas depuis le cou. Ne force jamais sur le bas du dos.',
    ex: ['planche-laterale', 'planche-laterale-genou', 'planche-laterale-hanche', 'russian-twist', 'flexion-laterale-bouteille', 'toucher-pied-oppose', 'bucheron-bouteille', 'crunch-velo'],
    combos: [
      C('obliques', 1, 'Taille de guêpe', 'Débutant', 'Trois exercices doux pour réveiller les flancs.', [['planche-laterale-genou', 2], ['russian-twist', 3], ['flexion-laterale-bouteille', 3]]),
      C('obliques', 2, 'Flancs d\'acier', 'Intermédiaire', 'Tenir, tourner, couper du bois.', [['planche-laterale', 3], ['bucheron-bouteille', 3], ['crunch-velo', 3], ['toucher-pied-oppose', 3]]),
      C('obliques', 3, 'Côtes en feu', 'Costaud', 'Intense, mais très efficace.', [['planche-laterale-hanche', 3], ['russian-twist', 3], ['mountain-climbers', 2], ['flexion-laterale-bouteille', 2]])
    ]
  });
  zone('lombaires', 'Bas du dos (lombaires)', {
    icon: 'lowback', thumb: 'bird-dog',
    desc: 'Les lombaires portent une grande partie de ton poids. Les renforcer en douceur aide à éviter bien des douleurs.',
    how: 'Extensions au sol, chaîne arrière (fessiers, arrière des cuisses) et mobilité douce.',
    care: 'Dos toujours plat, jamais arrondi sous charge. Si une douleur aiguë apparaît, tu t\'arrêtes et tu consultes.',
    ex: ['superman', 'bird-dog', 'bonjour-sac', 'pont-fessier', 'chat-vache', 'genou-poitrine'],
    combos: [
      C('lombaires', 1, 'Dos solide', 'Débutant', 'Les gestes de base pour protéger le bas du dos.', [['superman', 3], ['bird-dog', 3], ['pont-fessier', 3]]),
      C('lombaires', 2, 'Bonjour le dos', 'Intermédiaire', 'Un peu de charge, beaucoup de contrôle, puis détente.', [['bonjour-sac', 3], ['bird-dog', 3], ['chat-vache', 2], ['genou-poitrine', 1]]),
      C('lombaires', 3, 'La chaîne arrière', 'Costaud', 'Dos, fessiers et arrière des cuisses ensemble.', [['bonjour-sac', 3], ['pont-fessier', 3], ['superman', 3], ['planche', 2]])
    ]
  });
  zone('fessiers', 'Fessiers', {
    icon: 'glutes', thumb: 'hip-thrust-chaise',
    desc: 'Les plus gros muscles du corps : ils propulsent tes pas, tes sauts et protègent tes genoux et ton dos.',
    how: 'Ponts, hip thrust sur chaise, donkey kicks et fentes : on cherche à bien serrer la fesse en haut du mouvement.',
    care: 'Ne cambre pas le bas du dos en montant : le mouvement vient des fessiers, pas des lombaires.',
    ex: ['pont-fessier', 'pont-une-jambe', 'donkey-kick', 'hip-thrust-chaise', 'extension-hanche-debout', 'fentes-arriere', 'squat-sumo', 'fentes-laterales'],
    combos: [
      C('fessiers', 1, 'Pont et kick', 'Débutant', 'Pour apprendre à sentir les fessiers.', [['pont-fessier', 3], ['donkey-kick', 3], ['extension-hanche-debout', 3]]),
      C('fessiers', 2, 'Fessiers durs', 'Intermédiaire', 'Hip thrust et fentes : le duo efficace.', [['hip-thrust-chaise', 3], ['fentes-arriere', 3], ['squat-sumo', 3], ['pont-une-jambe', 2]]),
      C('fessiers', 3, 'Feu aux fesses', 'Costaud', 'Pour celles et ceux qui en veulent plus.', [['fentes-laterales', 3], ['squat-bulgare', 3], ['donkey-kick', 3], ['pont-fessier', 2]])
    ]
  });
  zone('cuisses', 'Cuisses', {
    icon: 'thigh', thumb: 'squats',
    desc: 'Devant (quadriceps) et derrière (ischio-jambiers) : tes cuisses sont ton moteur au quotidien.',
    how: 'Squats, fentes, chaise contre le mur, et exercices lents ou à une jambe pour monter en difficulté.',
    care: 'Genoux dans l\'axe des pieds, talons au sol. Descends seulement tant que le dos reste droit.',
    ex: ['squats', 'squat-lent', 'squat-bulgare', 'chaise-mur', 'fentes-marchees', 'fentes-arriere', 'squat-sumo', 'pistol-assiste', 'squat-saute', 'montees-marche', 'curl-ischios-serviette', 'bonjour-sac', 'etirement-cuisses'],
    combos: [
      C('cuisses', 1, 'Cuisses : les bases', 'Débutant', 'Un squat, une chaise, une fente. Simple et complet.', [['squats', 3], ['chaise-mur', 3], ['fentes-arriere', 3]]),
      C('cuisses', 2, 'Lent et brûlant', 'Intermédiaire', 'La lenteur rend tout plus dur.', [['squat-lent', 3], ['squat-bulgare', 3], ['curl-ischios-serviette', 3]]),
      C('cuisses', 3, 'Quadris et ischios', 'Costaud', 'Devant et derrière, puis étirement.', [['squat-sumo', 3], ['fentes-marchees', 3], ['bonjour-sac', 3], ['curl-ischios-serviette', 3], ['etirement-cuisses', 1]])
    ]
  });
  zone('mollets', 'Mollets', {
    icon: 'calf', thumb: 'mollets-une-jambe',
    desc: 'Les mollets sont une vraie pompe pour le sang et un amortisseur à chaque pas. Ils sont aussi têtus : il faut du volume.',
    how: 'Montées sur la pointe des pieds, sur une jambe ou sur une marche, et sauts légers.',
    care: 'Monte lentement, marque une pause en haut, descends en 2 secondes. Pas de rebond.',
    ex: ['mollets', 'mollets-une-jambe', 'mollets-marche', 'saut-corde', 'squat-pointes', 'mobilite-chevilles', 'etirement-mollets'],
    combos: [
      C('mollets', 1, 'Mollets de footballeur', 'Intermédiaire', 'Deux jambes, une jambe, puis en sautant.', [['mollets', 3], ['mollets-une-jambe', 3], ['saut-corde', 3]]),
      C('mollets', 2, 'Marche d\'escalier', 'Intermédiaire', 'Avec une marche : plus d\'amplitude, plus d\'effet.', [['mollets-marche', 3], ['montees-marche', 3], ['squat-pointes', 3]]),
      C('mollets', 3, 'Mollets et chevilles', 'Tous niveaux', 'Du travail, puis de la souplesse.', [['mollets', 3], ['mobilite-chevilles', 2], ['etirement-mollets', 2]])
    ]
  });
  zone('cardio', 'Cardio et souffle', {
    icon: 'heart', thumb: 'jumping-jacks',
    desc: 'Pas un muscle, mais ce qui fait tenir tous les autres : ton cœur et ton souffle.',
    how: 'Des enchaînements dynamiques à faire à un rythme que tu peux tenir. Tu dois pouvoir dire une phrase courte.',
    care: 'Échauffe-toi avant, bois de l\'eau et arrête si tu as des vertiges ou une douleur dans la poitrine.',
    ex: ['jumping-jacks', 'montees-genoux', 'talons-fesses', 'burpees-adaptes', 'skaters', 'shadow-boxing', 'saut-corde', 'burpees-complets'],
    combos: [
      C('cardio', 1, 'Échauffement du cœur', 'Débutant', 'Pour monter doucement en température.', [['jumping-jacks', 3], ['montees-genoux', 3], ['talons-fesses', 3]]),
      C('cardio', 2, 'HIIT maison', 'Intermédiaire', 'Court, intense, efficace.', [['burpees-adaptes', 3], ['skaters', 3], ['mountain-climbers', 3], ['shadow-boxing', 3]]),
      C('cardio', 3, 'Souffle de feu', 'Costaud', 'Pour ceux qui aiment finir essoufflés.', [['saut-corde', 3], ['burpees-complets', 3], ['squat-saute', 3]])
    ]
  });
  zone('mobilite', 'Mobilité et étirements', {
    icon: 'stretch', thumb: 'chat-vache',
    desc: 'Des muscles qui bougent bien sont des muscles qui récupèrent mieux et se blessent moins.',
    how: 'Mouvements lents et étirements doux, à faire le matin, le soir ou après la séance.',
    care: 'Un étirement se tient sans douleur vive. Tu respires, tu relâches, tu ne forces pas.',
    ex: ['rotations-epaules', 'chat-vache', 'mobilite-chevilles', 'etirement-mollets', 'etirement-cuisses', 'etirement-pectoraux', 'etirement-cou', 'genou-poitrine', 'respiration-lente'],
    combos: [
      C('mobilite', 1, 'Réveil du matin', 'Tous niveaux', 'Pour réveiller le corps en 5 minutes.', [['rotations-epaules', 2], ['chat-vache', 2], ['mobilite-chevilles', 2], ['respiration-lente', 1]]),
      C('mobilite', 2, 'Étirements du soir', 'Tous niveaux', 'Pour se détendre avant de dormir.', [['etirement-cuisses', 2], ['etirement-mollets', 2], ['etirement-pectoraux', 2], ['etirement-cou', 2], ['genou-poitrine', 2]]),
      C('mobilite', 3, 'Après la séance', 'Tous niveaux', 'Le retour au calme, pour mieux récupérer.', [['etirement-pectoraux', 1], ['etirement-cuisses', 1], ['etirement-mollets', 1], ['genou-poitrine', 1], ['respiration-lente', 1]])
    ]
  });

  const byId = {};
  Z.forEach((z) => { byId[z.id] = z; });

  NEV.ZONES = Z;
  NEV.Zones = {
    VISION,
    list: () => Z,
    get: (id) => byId[id] || null,
    /* Exercices d'une zone (objets complets), dans l'ordre de la liste. */
    exercises(id) { const z = byId[id]; return z ? z.ex.map((e) => NEV.Ex.byId(e)).filter(Boolean) : []; },
    /* Les zones qui contiennent un exercice. */
    zonesOf(exId) { return Z.filter((z) => z.ex.indexOf(exId) >= 0).map((z) => z.id); },
    combo(id) { for (const z of Z) { const c = z.combos.find((x) => x.id === id); if (c) return c; } return null; },
    allCombos() { return Z.reduce((a, z) => a.concat(z.combos), []); }
  };
})(window);
