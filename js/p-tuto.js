/* neV.BOOSTER — page Tuto (publique) */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc;
  await NEV.bootPublic('tuto');
  const co = (ico, cls, html) => '<div class="callout ' + cls + '"><span class="ci">' + ico + '</span><p>' + html + '</p></div>';
  const acc = (q, a) => '<details class="acc"><summary>' + q + '</summary><div class="in">' + a + '</div></details>';

  /* ---------- illustrations (SVG en ligne) ---------- */
  const W = '#7a0f26', R = '#e0455f', G = '#f0b24a', C = '#fff3ee';
  const svg = (b) => '<svg viewBox="0 0 420 220" role="img" aria-hidden="true">' + b + '</svg>';
  const card = (x, y, r, fill, t) => '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ')"><rect x="-34" y="-50" width="68" height="100" rx="9" fill="' + fill + '" stroke="' + G + '" stroke-width="2"/><text x="0" y="6" text-anchor="middle" fill="#fff" font-size="26" font-weight="900" font-family="Montserrat,sans-serif">' + t + '</text></g>';
  const ILL = [
    svg('<rect x="110" y="30" width="200" height="160" rx="16" fill="#1c0b11" stroke="' + R + '" stroke-width="2"/><rect x="130" y="58" width="160" height="26" rx="8" fill="#ffffff14"/><text x="140" y="76" fill="#c2a3aa" font-size="12" font-family="Montserrat,sans-serif">email</text><rect x="130" y="96" width="70" height="26" rx="8" fill="#ffffff14"/><text x="140" y="114" fill="#c2a3aa" font-size="12" font-family="Montserrat,sans-serif">âge</text><rect x="130" y="140" width="160" height="30" rx="15" fill="' + R + '"/><text x="210" y="160" text-anchor="middle" fill="#fff" font-size="13" font-weight="800" font-family="Montserrat,sans-serif">Créer mon compte</text>'),
    svg('<g fill="none" stroke="' + R + '" stroke-width="3"><circle cx="210" cy="60" r="16" fill="' + W + '"/><path d="M210 76v50M210 90l-52 24M210 90l60 18M210 126l-30 36M210 126l36 34"/></g><text x="210" y="198" text-anchor="middle" fill="' + G + '" font-size="15" font-weight="900" font-family="Montserrat,sans-serif">Ton maximum de pompes ? 1 à 200</text>'),
    svg(card(110, 112, -10, W, '?') + card(165, 108, -4, W, '?') + card(220, 106, 3, '#b3203f', '?') + card(275, 108, 8, W, '?') + card(325, 112, 14, W, '?') + '<path d="M214 196l-10-26h20z" fill="' + G + '"/><text x="210" y="214" text-anchor="middle" fill="#c2a3aa" font-size="11" font-family="Montserrat,sans-serif">5 cartes · 1 seule par jour</text>'),
    svg('<rect x="90" y="24" width="240" height="150" rx="14" fill="#1c0b11" stroke="' + R + '" stroke-width="2"/><g fill="none" stroke="#3ddc84" stroke-width="4"><circle cx="210" cy="70" r="10"/><path d="M210 80v34M210 90l-24 16M210 90l24 16M210 114l-16 28M210 114l16 28"/></g><rect x="100" y="34" width="46" height="22" rx="8" fill="#3ddc84"/><text x="123" y="50" text-anchor="middle" fill="#04230f" font-size="13" font-weight="900" font-family="Montserrat,sans-serif">OK</text><text x="210" y="198" text-anchor="middle" fill="#c2a3aa" font-size="12" font-family="Montserrat,sans-serif">La caméra voit ta position : tout vert = OK</text>'),
    svg('<path d="M210 34c10 30 44 44 44 84 0 30-20 52-44 52s-44-22-44-52c0-20 12-32 20-46 6 16 14 22 22 20-4-18-2-38 2-58z" fill="' + R + '" stroke="' + G + '" stroke-width="3"/><text x="210" y="130" text-anchor="middle" fill="#fff" font-size="30" font-weight="900" font-family="Montserrat,sans-serif">+1</text><text x="210" y="204" text-anchor="middle" fill="#c2a3aa" font-size="12" font-family="Montserrat,sans-serif">Flammes · badges · héros qui grandit</text>'),
    svg('<g fill="none" stroke="' + R + '" stroke-width="3"><circle cx="210" cy="40" r="13" fill="' + W + '"/><path d="M210 53v54M210 66l-34 20M210 66l34 20M210 107l-22 52M210 107l22 52"/></g><g fill="' + G + '"><circle cx="176" cy="86" r="6"/><circle cx="244" cy="86" r="6"/><circle cx="188" cy="159" r="6"/><circle cx="232" cy="159" r="6"/><circle cx="210" cy="40" r="6"/></g><text x="210" y="204" text-anchor="middle" fill="#c2a3aa" font-size="12" font-family="Montserrat,sans-serif">Tout le corps, rien d\'imposé</text>')
  ];
  const STEPS = [
    ['1 · Crée ton compte', 'Entre ton pseudo, ton e-mail et un mot de passe. Toutes les cartes peuvent sortir pour tout le monde, selon ton niveau. Ton avatar et ton héros te suivent partout.'],
    ['2 · Dis ton maximum de pompes', 'Fais de ton mieux, honnêtement : c\'est ton point de départ. Il détermine ton niveau (Éveil, Initié, Combattant, Guerrier, Légende) et le nombre de répétitions de chaque exercice. Tu peux aussi indiquer le matériel que tu as (chaise, mur, sac, marche, barre…).'],
    ['3 · Tire ta carte du jour', 'Chaque jour, 5 cartes sont posées. Un doigt musclé en choisit une, elle tourne 8 fois sur elle-même, explose et se révèle : c\'est ton exercice. Une seule carte par jour, la même pour toute la journée.'],
    ['4 · Fais l\'exercice devant la caméra', 'Trois secondes après la carte, la séance démarre. La caméra suit ton corps, compte tes répétitions et confirme la bonne position : quand tout est vert, tu vois « OK ». Pas de caméra ? Tu peux continuer sans, mais tu gagnes moitié moins de points.'],
    ['5 · Gagne flammes, badges, XP', 'Chaque jour de connexion donne une flamme, chaque exercice terminé de l\'XP, et ton héros grandit. Des badges récompensent ta régularité. Tu peux inviter des amis avec ton code de parrainage.'],
    ['6 · Va plus loin avec la Spécialisation', 'Besoin de travailler une zone en particulier (épaules, avant-bras, doigts, jambes…) ? La page Spécialisation tire une carte selon la zone, propose des combos et laisse toute liberté de choisir.']
  ];

  const S = [];
  const sec = (id, ico, title, html) => S.push({ id, ico, title, html });

  sec('video', '🎬', 'La vidéo en 85 secondes',
    '<video class="vid" controls preload="none" playsinline poster="img/banner-small.jpg" aria-label="Présentation de neV.BOOSTER (85 secondes, avec musique)"><source src="media/neVBOOSTER-video.mp4" type="video/mp4">Ton navigateur ne lit pas cette vidéo.</video><p class="muted" style="font-size:.84rem">Intro, tirage de la carte, séance filmée, quête, spécialisation, bibliothèque, programmes et récompenses. Avec le son !</p>');

  sec('histoire', '🎞️', 'Son histoire animée (avec voix)',
    '<p>Un jeune homme maigre, un miroir, un refus… puis 90 jours de séances. Une animation 3D où les personnages bougent : <b>touche, glisse, incline ton téléphone</b>. Voix off en français, pause et « Passer ».</p><p><a class="btn" href="histoire-anime.html" data-go>Voir l\'histoire animée</a> <a class="btn ghost" href="histoire.html" data-go>Version simple</a></p><video class="vid" id="hvid" controls preload="none" playsinline poster="img/banner-small.jpg" aria-label="L\'histoire de neV.BOOSTER en vidéo, avec voix et musique (1 min 45)"></video><p class="muted" style="font-size:.84rem">La vidéo (1 min 45) s\'adapte à ton écran : <a href="media/histoire-neVBOOSTER-paysage.mp4" download>paysage 16:9</a> · <a href="media/histoire-neVBOOSTER-portrait.mp4" download>portrait 9:16</a>.</p>');

  sec('visite', '🧭', 'Visite en 6 étapes',
    '<p><a class="btn" href="accueil.html?tour=1" data-go id="tourBtn">🔥 Revoir la visite guidée avec Nev</a></p><div class="stp" id="stp"><div class="ill" id="stI"></div><div class="txt" id="stT" aria-live="polite"></div><div class="nav"><button type="button" class="btn ghost" id="stP">← Précédent</button><div class="dots" id="stD"></div><button type="button" class="btn" id="stN">Suivant →</button></div></div>');

  sec('je-veux', '🎯', 'Je veux…',
    '<div class="want">' +
    '<a href="gacha.html" data-go><b>Tirer ma carte du jour</b><span>Le gacha : une carte, un exercice.</span></a>' +
    '<a href="specialisation.html" data-go><b>Travailler une zone du corps</b><span>Cou, épaules, abdos, jambes, doigts…</span></a>' +
    '<a href="bibliotheque.html" data-go><b>Voir tous les exercices</b><span>La bibliothèque, par catégories et difficulté.</span></a>' +
    '<a href="programmes.html" data-go><b>Suivre un programme</b><span>25 programmes prêts à lancer.</span></a>' +
    '<a href="conseils.html" data-go><b>Mieux dormir, mieux récupérer</b><span>Sommeil, eau, lait, échauffement.</span></a>' +
    '<a href="alimentation.html" data-go><b>Savoir quoi manger</b><span>Pourquoi tu as faim, menus et calculateur.</span></a>' +
    '<a href="recompenses.html" data-go><b>Voir mes flammes et badges</b><span>Et inviter des amis.</span></a>' +
    '<a href="chat.html" data-go><b>Parler avec la communauté</b><span>Le chat des utilisateurs et de l\'équipe.</span></a></div>');

  sec('regles', '📜', 'Les règles du jeu',
    '<div class="kpi"><div><b>1</b><span>carte par jour</span></div><div><b>3 s</b><span>avant le début de la séance</span></div><div><b>×2</b><span>séries après un jour manqué</span></div><div><b>7</b><span>tirages max. sans carte rare (pitié)</span></div></div>' +
    '<ul><li><b>Une carte par jour</b> : tu ne peux pas retirer. Reviens demain.</li><li><b>Jour manqué</b> : le lendemain, le nombre de séries est <b>doublé</b>. C\'est la règle du jeu, pas une punition : le corps ne se rattrape pas, mais la discipline oui.</li><li><b>Raretés</b> : Commun (N), Rare (R), Épique (SR), Légendaire (UR), Mythique (MR). Plus ton niveau est élevé, plus les cartes fortes sortent. Les moins de 18 ans ne tirent ni Légendaire ni Mythique.</li><li><b>Pitié</b> : si tu enchaînes les cartes communes, une carte au moins Rare finit par sortir (douce à partir de 4 tirages, certaine au 7ᵉ).</li><li><b>Hasard</b> : le tirage utilise un générateur aléatoire sécurisé du navigateur, sans triche possible.</li><li><b>Cartes spéciales</b> : <b>Repos</b> (une vraie journée de récupération guidée) et <b>Tractions</b> (si tu as une barre ou une table solide). Elles sont très rares : environ 5 % si tu t\'es peu entraîné, jusqu\'à 40 % si tu as fait au moins 4 jours d\'entraînement sur les 7 derniers. Avec 10 pompes max, une carte Tractions te donne 5 tractions.</li></ul>' +
    '<h3>Niveaux selon ton maximum de pompes</h3><div class="tablewrap"><table class="tbl"><thead><tr><th>Niveau</th><th>Nom</th><th>Maximum de pompes</th></tr></thead><tbody>' +
    (NEV.LEVELS || []).map((l) => '<tr><td>' + l.n + '</td><td><b>' + esc(l.name) + '</b></td><td>' + esc(l.range) + '</td></tr>').join('') + '</tbody></table></div>');

  sec('recompenses', '🔥', 'Flammes, XP et héros',
    '<div class="cards"><div class="cardx"><span class="tag">Flammes</span><h4>Connexion quotidienne</h4><p>+1 flamme par jour de connexion, +4 bonus tous les 7 jours d\'affilée, +10 bonus tous les 30 jours.</p></div>' +
    '<div class="cardx"><span class="tag">Parrainage</span><h4>Invite tes amis</h4><p>Partage ton code : tu gagnes 50 flammes par ami inscrit, et lui 20 flammes de bienvenue.</p></div>' +
    '<div class="cardx"><span class="tag">XP</span><h4>Chaque séance compte</h4><p>Plus la carte est rare, plus l\'XP est élevée. Après un jour manqué, la séance doublée rapporte ×1,5. Sans caméra, l\'XP est divisée par deux.</p></div></div>' +
    '<h3>Les 6 paliers de ton héros</h3><div class="tablewrap"><table class="tbl"><thead><tr><th>Palier</th><th>Nom</th><th>XP requise</th></tr></thead><tbody>' +
    (NEV.HERO_STAGES || []).map((h) => '<tr><td>' + h.n + '</td><td><b>' + esc(h.name) + '</b></td><td>' + h.xp + '</td></tr>').join('') + '</tbody></table></div>' +
    '<p>Les flammes se dépensent dans la boutique d\'auras de la page Récompenses. Les badges (séries, nombre de séances, raretés, parrainages…) se débloquent tout seuls, et l\'équipe en crée régulièrement de nouveaux.</p>');

  sec('camera', '📷', 'Bien utiliser la caméra',
    '<ul><li>Place le téléphone ou l\'ordinateur <b>à 1,5–2,5 m</b>, appuyé et stable, avec <b>tout ton corps</b> dans l\'image.</li><li>Choisis une <b>pièce bien éclairée</b>, lumière devant toi plutôt que dans ton dos.</li><li>Porte des vêtements qui <b>ne cachent pas</b> tes articulations (pas de grand boubou ample).</li><li>Mets-toi de <b>profil</b> pour les pompes, de <b>face</b> pour les squats et gainages latéraux : l\'écran te l\'indique.</li><li>Attends que les repères soient <b>verts</b> avant de commencer à compter.</li></ul>' +
    co('🔒', 'gold', 'Ton image <b>ne quitte pas ton appareil</b> : l\'analyse se fait dans ton navigateur, rien n\'est envoyé ni enregistré. La caméra exige une connexion sécurisée (https) ou « localhost ».') +
    co('ℹ️', 'warn', 'Pas de caméra, mal éclairé ou trop de lag ? Tu peux faire la séance en mode manuel : le décompte est fait par toi, mais tu gagnes moins de points.'));

  sec('premiere', '✅', 'Ma première séance',
    '<div class="chk">' +
    ['J\'ai de l\'eau à côté de moi.', 'J\'ai dégagé un espace d\'environ 2 m × 2 m.', 'Je me suis échauffé 3 minutes (rotation des épaules, poignets, hanches).', 'Mon téléphone est stable et je suis entièrement visible.', 'J\'ai mangé quelque chose de léger il y a au moins une heure.', 'Je sais que je peux m\'arrêter si j\'ai mal.'].map((t, i) => '<label><input type="checkbox" data-c="' + i + '"> ' + esc(t) + '</label>').join('') + '</div>' +
    co('⚠️', 'warn', 'Arrête-toi en cas de <b>douleur vive</b>, d\'étourdissement, de nausée ou d\'essoufflement anormal. Prévois toujours une zone libre autour de toi, et demande à un adulte si tu as un doute sur ta santé.'));

  const GL = [
    ['Gacha', 'Tirage au sort d\'une carte.'], ['Carte', 'Un exercice avec sa rareté et son nombre de séries.'], ['Rareté', 'Niveau de la carte : Commun, Rare, Épique, Légendaire, Mythique.'], ['Pitié', 'Garantie qu\'une carte au moins Rare finit par sortir.'],
    ['Série', 'Un ensemble de répétitions suivi d\'un repos.'], ['Répétition', 'Un mouvement complet de l\'exercice.'], ['Combo', 'Une suite d\'exercices enchaînés, prête à lancer.'], ['Flamme', 'Monnaie gagnée par ta régularité.'],
    ['Badge', 'Récompense qui s\'affiche quand tu atteins un objectif.'], ['XP', 'Points d\'expérience qui font grandir ton héros.'], ['Aura', 'Effet visuel autour de ton héros, acheté avec des flammes.'], ['Parrainage', 'Invitation d\'un ami avec ton code.'],
    ['Streak', 'Nombre de jours d\'affilée où tu t\'es entraîné.'], ['Gainage', 'Tenir une position sans bouger pour renforcer le tronc.'], ['Isométrique', 'Effort où le muscle travaille sans bouger (planche).'], ['Repos actif', 'Journée légère : marche, étirements, respiration.'], ['Échauffement', 'Préparation du corps avant l\'effort.']
  ];
  sec('glossaire', '📖', 'Mini-glossaire', '<div class="gl">' + GL.map((g) => '<div><b>' + esc(g[0]) + '</b>' + esc(g[1]) + '</div>').join('') + '</div>');

  sec('faq', '❓', 'Questions fréquentes',
    acc('Est-ce gratuit ?', 'Oui, tout le site est gratuit : pas de paiement, pas d\'achat.') +
    acc('Pourquoi une seule carte par jour ?', 'Pour la régularité : faire un peu tous les jours vaut mieux qu\'énormément un jour et plus rien ensuite.') +
    acc('J\'ai oublié de m\'entraîner hier. Que se passe-t-il ?', 'Aujourd\'hui, le nombre de séries est doublé. Tu peux le faire en plusieurs fois dans la journée, avec des repos.') +
    acc('Je suis malade ou blessé.', 'Repose-toi. Ton état passe avant tout. Reprends doucement et parle-en à un adulte ou un professionnel si cela dure.') +
    acc('Puis-je choisir moi-même mon exercice ?', 'Pour la carte du jour, non : c\'est le jeu. Dans la Spécialisation, la Bibliothèque et les Programmes, tu choisis librement.') +
    acc('Ma caméra ne marche pas.', 'Vérifie que le navigateur a la permission d\'utiliser la caméra et que la page est en https ou localhost. Sinon, passe en mode manuel.') +
    acc('La caméra compte mal mes répétitions.', 'Recule un peu, améliore la lumière, mets tout ton corps dans l\'image et fais des mouvements complets et contrôlés.') +
    acc('Quelqu\'un voit-il ma vidéo ?', 'Non. L\'image est analysée sur ton appareil et n\'est ni envoyée ni enregistrée.') +
    acc('Je n\'ai pas de barre pour les tractions.', 'La carte Tractions ne sort que si tu as indiqué une barre ou une table solide dans tes réglages.') +
    acc('Comment gagner plus de flammes ?', 'Connecte-toi chaque jour, atteins les paliers de 7 et 30 jours d\'affilée, et parraine des amis.') +
    acc('Puis-je changer mon maximum de pompes ?', 'Oui. Quand tu progresses, refais le test et mets-le à jour : tes cartes s\'adaptent à ton nouveau niveau.') +
    acc('À quelle heure change le jour ?', 'À minuit, selon l\'heure de ton appareil.') +
    acc('Où trouver des conseils sur le sommeil et la nourriture ?', 'Dans les pages <a href="conseils.html" data-go>Conseils</a> et <a href="alimentation.html" data-go>Alimentation</a>.'));

  $('toc').innerHTML = S.map((s) => '<a href="#' + s.id + '">' + s.ico + ' ' + esc(s.title) + '</a>').join('');
  $('art').innerHTML = S.map((s) => '<section id="' + s.id + '"><h2><span class="ico">' + s.ico + '</span>' + esc(s.title) + '</h2>' + s.html + '</section>').join('') +
    '<div class="cta"><a class="btn" href="gacha.html" data-go>Tirer ma carte</a><a class="btn ghost" href="conseils.html" data-go>Voir les conseils</a></div>';
  const hv = $('hvid');   /* la vidéo de l'histoire s'adapte à l'écran : portrait sur téléphone debout, paysage sinon */
  if (hv) hv.src = (window.matchMedia && window.matchMedia('(orientation: portrait)').matches) ? 'media/histoire-neVBOOSTER-portrait.mp4' : 'media/histoire-neVBOOSTER-paysage.mp4';
  const links = Array.from($('toc').querySelectorAll('a'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-20% 0px -70% 0px' });
    S.forEach((s) => { const el = $(s.id); if (el) io.observe(el); });
  }

  /* ---------- stepper ---------- */
  let k = 0;
  const dots = $('stD');
  dots.innerHTML = STEPS.map((_, i) => '<button type="button" data-i="' + i + '" aria-label="Étape ' + (i + 1) + '"></button>').join('');
  function show(n) {
    k = Math.max(0, Math.min(STEPS.length - 1, n));
    $('stI').innerHTML = ILL[k];
    $('stT').innerHTML = '<h3>' + esc(STEPS[k][0]) + '</h3><p>' + esc(STEPS[k][1]) + '</p>';
    Array.from(dots.children).forEach((d, i) => d.classList.toggle('on', i === k));
    $('stP').disabled = k === 0; $('stN').disabled = k === STEPS.length - 1;
  }
  $('stP').addEventListener('click', () => show(k - 1));
  $('stN').addEventListener('click', () => show(k + 1));
  dots.addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (b) show(+b.dataset.i); });
  show(0);

  /* ---------- checklist mémorisée (confort par appareil) ---------- */
  const KEY = 'nev.tuto.chk';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }
  document.querySelectorAll('.chk input[data-c]').forEach((i) => {
    i.checked = !!saved[i.dataset.c];
    i.addEventListener('change', () => { saved[i.dataset.c] = i.checked ? 1 : 0; try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* ignoré */ } });
  });
})();
