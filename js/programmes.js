/* ==========================================================
   neV.BOOSTER — programmes.js
   Les 25 cartes d'entraînement à domicile (5 niveaux × 5 cartes),
   transformées en combos prêts à lancer : exercice.html?src=combo&id=prog-N
   items : [idExercice, séries]
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const LEVELS = [
    { id: 1, name: 'Débutant', hint: 'Tu apprends les mouvements ou reprends après une pause. 1 à 2 séries.' },
    { id: 2, name: 'Facile', hint: 'Tu maîtrises les bases sans douleur. 2 séries la plupart du temps.' },
    { id: 3, name: 'Intermédiaire', hint: 'Tu contrôles les mouvements et récupères bien. 2 à 3 séries.' },
    { id: 4, name: 'Difficile', hint: 'Pratique régulière et technique stable. 3 séries, parfois 4.' },
    { id: 5, name: 'Plus exigeant', hint: 'Niveau avancé : variantes plus dures et tempo lent. La difficulté vient du contrôle.' }
  ];
  const P = [
    ['Découverte du corps entier', 'Repos 60–90 s. Priorité à l\'apprentissage du mouvement.', [['pompes-mur', 2], ['squats', 2], ['bird-dog', 2], ['pont-fessier', 2], ['planche-genoux', 2]]],
    ['Haut du corps et jambes', 'Repos 60–90 s. Choisis une hauteur de support qui garde le corps aligné.', [['pompes-inclinees', 2], ['squats', 2], ['anges-inverses', 2], ['mollets', 2], ['dead-bug', 2]]],
    ['Premiers bras et avant-bras', 'Repos 60–90 s. Le poignet doit rester confortable.', [['pompes-mur', 2], ['curl-sac', 2], ['poignets-flexion', 2], ['squats', 2], ['bird-dog', 2]]],
    ['Stabilité et posture', 'Repos 60–90 s. Si le rowing n\'est pas sûr, remplace-le par des anges inversés.', [['pompes-inclinees', 2], ['fentes-arriere', 2], ['rowing-sac', 2], ['planche-genoux', 2], ['mollets', 2]]],
    ['Petit circuit général', 'Repos 60–90 s. Termine avec assez d\'énergie pour garder une bonne technique.', [['pompes-inclinees', 2], ['squats', 2], ['pont-fessier', 2], ['crunch-inverse', 2], ['montees-genoux', 2]]],
    ['Base équilibrée', 'Repos 60–90 s.', [['pompes-genoux', 2], ['squats', 2], ['rowing-sac', 2], ['pont-fessier', 2], ['dead-bug', 2]]],
    ['Pectoraux, jambes, dos', 'Repos 60–90 s. Prends la variante de pompe qui permet un mouvement propre.', [['pompes-inclinees', 2], ['fentes-arriere', 2], ['anges-inverses', 2], ['mollets', 2], ['planche', 2]]],
    ['Bras complets', 'Repos 60–90 s. Pas de dips sur chaise si les épaules sont inconfortables.', [['pompes-rapprochees', 2], ['curl-sac', 2], ['poignets-extension', 2], ['poignets-flexion', 2], ['squats', 2]]],
    ['Jambes et tronc', 'Repos 60–90 s.', [['squats', 2], ['fentes-arriere', 2], ['pont-fessier', 2], ['crunch-inverse', 2], ['bird-dog', 2]]],
    ['Cardio doux et muscles', 'Repos 60–90 s. Ralentis si tu ne gardes plus une bonne posture.', [['pompes-inclinees', 2], ['squat-pointes', 2], ['rowing-sac', 2], ['mountain-climbers', 2], ['montees-genoux', 2]]],
    ['Corps entier équilibré', 'Repos 75–120 s.', [['pompes-classiques', 3], ['squats', 3], ['rowing-sac', 3], ['pont-fessier', 3], ['planche', 3]]],
    ['Poussée et tirage', 'Repos 75–120 s. Amplitude maîtrisée pour les pompes pike.', [['pompes-rapprochees', 3], ['rowing-sac', 3], ['pompes-pike', 2], ['curl-sac', 2], ['bird-dog', 2]]],
    ['Jambes et fessiers', 'Repos 75–120 s. Descends lentement sans forcer les articulations.', [['squat-lent', 3], ['fentes-arriere', 3], ['pont-fessier', 3], ['mollets', 3], ['planche-laterale-genou', 2]]],
    ['Bras et avant-bras', 'Repos 60–120 s. Les objets tenus doivent être équilibrés et sûrs.', [['pompes-rapprochees', 3], ['curl-sac', 3], ['poignets-flexion', 2], ['poignets-extension', 2], ['farmer-carry', 3]]],
    ['Endurance musculaire', 'Repos 75–120 s. Rythme régulier, sans course.', [['pompes-classiques', 3], ['squats', 3], ['rowing-sac', 3], ['mountain-climbers', 3], ['crunch-inverse', 3]]],
    ['Force générale', 'Repos 90–150 s. Augmente la charge du sac seulement si la posture reste stable.', [['pompes-classiques', 3], ['squat-lent', 3], ['rowing-sac', 3], ['fentes-arriere', 3], ['planche', 3]]],
    ['Haut du corps complet', 'Repos 90–150 s. Les épaules ne doivent pas ressentir de douleur.', [['pompes-rapprochees', 3], ['pompes-pike', 3], ['rowing-sac', 3], ['curl-sac', 3], ['poignets-extension', 2]]],
    ['Jambes, fessiers, mollets', 'Repos 90–150 s. Reviens à deux jambes si tu perds l\'équilibre.', [['squat-lent', 3], ['fentes-arriere', 3], ['pont-une-jambe', 2], ['montees-marche', 3], ['mollets', 3]]],
    ['Tronc et condition physique', 'Repos 90–120 s. Choisis la planche latérale adaptée à ta stabilité.', [['pompes-classiques', 3], ['mountain-climbers', 3], ['dead-bug', 3], ['planche-laterale', 3], ['burpees-adaptes', 2]]],
    ['Bras et grip', 'Repos 90–120 s. Poignets dans une position confortable.', [['pompes-rapprochees', 3], ['curl-sac', 3], ['poignets-flexion', 3], ['poignets-extension', 3], ['farmer-carry', 3]]],
    ['Corps entier, tempo maîtrisé', 'Repos 90–150 s. Le tempo durcit l\'exercice sans mouvements brusques.', [['pompes-classiques', 3], ['squat-lent', 3], ['rowing-sac', 3], ['fentes-arriere', 3], ['planche', 3]]],
    ['Poussée, dos et épaules', 'Repos 90–150 s. Arrête la série avant que dos ou épaules perdent leur position.', [['pompes-rapprochees', 3], ['pompes-pike', 3], ['rowing-sac', 3], ['anges-inverses', 3], ['dead-bug', 3]]],
    ['Jambes et fessiers renforcés', 'Repos 90–150 s. Une variante difficile n\'est utile que si elle reste parfaitement contrôlée.', [['squat-lent', 3], ['fentes-arriere', 3], ['pont-une-jambe', 3], ['montees-marche', 3], ['mollets-marche', 3]]],
    ['Bras, avant-bras et tronc', 'Repos 90–150 s. Arrête si poignets ou coudes deviennent douloureux.', [['pompes-rapprochees', 3], ['curl-sac', 3], ['poignets-flexion', 3], ['poignets-extension', 3], ['farmer-carry', 3], ['planche-laterale', 2]]],
    ['Circuit général exigeant', 'Repos 90–150 s.', [['pompes-classiques', 3], ['squat-lent', 3], ['rowing-sac', 3], ['mountain-climbers', 3], ['crunch-inverse', 3], ['mollets', 3]]]
  ];
  const list = P.map((p, i) => {
    const L = LEVELS[Math.floor(i / 5)];
    return { id: 'prog-' + (i + 1), n: i + 1, prog: true, lvlId: L.id, lvl: L.name, name: 'Carte ' + (i + 1) + ' · ' + p[0], title: p[0], blurb: p[1], items: p[2] };
  });
  NEV.Programmes = { LEVELS, list, get: (id) => list.find((c) => c.id === id) || null };
  if (NEV.Combos) NEV.Combos.register(list);
})(window);
