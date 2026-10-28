/* ==========================================================
   neV.BOOSTER — histoire-anime-data.js
   ► C'est LE fichier à modifier pour changer l'histoire : textes, minutage, voix.
   - T : instant de début de chaque diapo en secondes (titre, 9 chapitres, conclusion) ; la dernière
     valeur est la durée totale. Ils sont calés sur la voix off (media/histoire-voix.mp3).
   - voiceAt / voiceDur : début et durée de la phrase dite dans chaque diapo (sert à faire apparaître
     les mots du récit en même temps que la voix).
   - Si tu changes un texte, change aussi la voix (_dev/voice.py) ou mets voice:null pour la couper.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const ic = (d) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  NEV.StoryData = {
    voice: 'media/histoire-voix.mp3',
    T: [0, 5.09, 15.8, 23.85, 34.95, 47.47, 58.76, 68.56, 80.02, 87.52, 96.67, 105.67],
    voiceAt: [0.7, 5.99, 16.7, 24.75, 35.85, 48.37, 59.66, 69.46, 80.92, 88.42, 97.57],
    voiceDur: [3.39, 8.707, 6.049, 9.102, 10.519, 9.288, 7.802, 9.462, 5.457, 7.152, 4.098],
    title: { eyebrow: 'Une histoire neV.BOOSTER', big: '90 jours pour changer', sub: 'Un jeune homme maigre, un miroir, un refus… et un déclic.' },
    chapters: [
      { h: 'Six heures du matin', tag: 'Maigre, fatigué, sans énergie.', story: 'Il se réveille à six heures du matin, maigre et fatigué. Les journées se ressemblent toutes, sans énergie et sans élan. Mais ça ne peut plus durer.' },
      { h: 'Le miroir', tag: 'Épaules étroites, bras fins.', story: 'Devant le miroir, son reflet lui dit tout : il est trop maigre, trop faible. Il n’aime pas ce qu’il voit.' },
      { h: 'Pas mon genre', tag: 'Refusé, invisible aux yeux des autres.', story: 'Un jour, il s’approche de trois filles. Elles ne le regardent même pas. « Pas mon genre », répond l’une d’elles. Refusé, il rentre sous la pluie, seul.' },
      { h: 'Alors, il change', tag: 'Chaque matin, quatre cartes au hasard.', story: 'Alors, il décide de changer. Il découvre neV.BOOSTER : chaque matin, quatre cartes d’exercices sont tirées au hasard. Le hasard choisit, il n’a plus qu’à bouger.' },
      { h: 'Une carte, un exercice', tag: 'Squats, pompes, abdos, épaules.', story: 'Une carte, un exercice : des squats, des pompes, des abdos, des épaules. Il gagne de l’expérience chaque jour, sans excuse.',
        icons: [['Squats', ic('<path d="M12 4v4M8 8h8M9 8l-2 6 3 3M15 8l2 6-3 3"/>')], ['Pompes', ic('<path d="M3 17h18M5 13l10-3 3 3M6 13l-1 4"/><circle cx="4" cy="11" r="1.5"/>')], ['Abdos', ic('<path d="M6 18l6-8 6 0M6 18h12"/><circle cx="8" cy="7" r="1.6"/>')], ['Épaules', ic('<path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12"/>')]] },
      { h: 'Jour après jour', tag: 'La force, les muscles et la confiance montent.', story: 'Jour après jour, pendant 90 jours, il s’entraîne. Lentement, la force, les muscles et la confiance montent.' },
      { h: 'Le nouveau reflet', tag: 'Épaules larges, bras puissants.', story: 'Devant le miroir, son corps a changé : des épaules larges, des pectoraux dessinés, des bras puissants. Mais surtout, il se tient droit, et il a le sourire.' },
      { h: '90 jours plus tard', tag: 'Les regards se retournent.', story: '90 jours plus tard, les regards se retournent. Ceux qui ne le voyaient pas le remarquent enfin.' },
      { h: 'Une référence', tag: 'D’autres veulent faire comme lui.', story: 'Il est devenu une référence, et d’autres veulent faire comme lui. Mais le plus beau changement, c’est celui qu’il ressent à l’intérieur.' }
    ],
    end: { big: 'Et toi ? Tire ta carte.', sub: 'Ton histoire commence aujourd’hui. Une carte, un exercice, un jour à la fois.', pills: ['Bouge', 'Progresse', 'Révèle-toi'], cta: 'Tire ta première carte', story: 'Et toi ? Tire ta première carte. Ton histoire commence aujourd’hui.' },
    note: 'Histoire illustrée : les résultats dépendent de chacun, de la régularité, de l’alimentation et du sommeil. Voix off : synthèse vocale Piper (voix « siwis », licence CC BY 4.0).'
  };
})(window);
