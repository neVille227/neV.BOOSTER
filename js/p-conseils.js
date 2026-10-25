/* neV.BOOSTER — page Conseils (publique) */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc;
  const ctx = await NEV.bootPublic('conseils');
  const user = ctx.user;
  const today = NEV.util.todayStr();
  const co = (ico, cls, html) => '<div class="callout ' + cls + '"><span class="ci">' + ico + '</span><p>' + html + '</p></div>';
  const acc = (q, a) => '<details class="acc"><summary>' + q + '</summary><div class="in">' + a + '</div></details>';
  const login = user ? 'exercice.html?src=combo&id=' : 'connexion.html#';

  /* ---------- conseil du jour (déterministe) ---------- */
  const TIPS = [
    'Dors suffisamment : c\'est la nuit que ton corps répare les fibres musculaires.',
    'Bois un verre d\'eau avant ta séance, un autre après.',
    'Mieux vaut 15 minutes chaque jour qu\'une heure une fois par semaine.',
    'Garde toujours 1 à 3 répétitions « en réserve » : l\'échec total n\'est pas nécessaire.',
    'Expire quand tu forces, inspire quand tu relâches. Ne bloque pas ta respiration.',
    'Une courbature légère est normale. Une douleur vive, non : arrête.',
    'Mange des protéines à chaque repas : œufs, poisson, haricots, arachide, lait…',
    'Ton échauffement dure 5 minutes. Ne le saute pas.',
    'Compare-toi à toi-même d\'il y a un mois, pas aux autres.',
    'La technique d\'abord, le nombre de répétitions ensuite.',
    'Un jour de repos fait partie du programme, ce n\'est pas un jour perdu.',
    'Pose ton téléphone loin des yeux 30 minutes avant de dormir.',
    'Une chambre fraîche et sombre aide à mieux dormir.',
    'Quand il fait très chaud, entraîne-toi tôt le matin ou en fin de journée.',
    'Note tes séances : voir ses progrès motive énormément.',
    'Les muscles grandissent lentement : sois patient, quelques mois suffisent pour voir un vrai changement.',
    'Un sac à dos fermé et une serviette sont déjà du matériel de musculation.',
    'Ne cherche pas à « rattraper » un jour raté en te blessant : reprends calmement.',
    'Mange un vrai repas dans les 2 heures après un gros effort.',
    'Étire-toi doucement après la séance, sans forcer la douleur.',
    'Regarde-toi dans un miroir ou avec la caméra pour corriger ta posture.',
    'Mange des fruits et des légumes tous les jours : vitamines, fibres, énergie.',
    'La faim et la fatigue augmentent quand tu t\'entraînes : réponds-y avec de vrais repas et du sommeil.',
    'Fais des pauses de 30 à 60 secondes entre les séries faciles, plus longues pour les séries dures.',
    'Une séance moyenne faite vaut mieux qu\'une séance parfaite remise à demain.',
    'Bois par petites gorgées tout au long de la journée plutôt que tout d\'un coup.',
    'Garde le dos plat et les abdos serrés dans les exercices au sol.',
    'Si un exercice te fait mal à l\'articulation, choisis une variante plus facile.',
    'Les flammes et les badges du site sont là pour t\'aider à revenir chaque jour.',
    'Un petit-déjeuner avec des protéines tient plus longtemps qu\'un petit-déjeuner sucré.',
    'Respire calmement avant la première série : concentre-toi sur le mouvement.',
    'Dormir tard le week-end ne rattrape pas toute la fatigue : garde des horaires réguliers.'
  ];
  const day = Math.floor(NEV.util.parseDay(today) / 86400000);
  $('tip').innerHTML = '<div class="tip-ico" aria-hidden="true">💡</div><div><b>Conseil du jour</b><p>' + esc(TIPS[day % TIPS.length]) + '</p></div>';

  /* ---------- contenu ---------- */
  const S = [];
  const sec = (id, ico, title, html) => S.push({ id, ico, title, html });

  sec('sommeil', '😴', 'Sommeil',
    '<p>Ton muscle ne grandit pas pendant la séance : il grandit <b>pendant que tu récupères</b>, surtout la nuit. Pendant le sommeil profond, ton corps libère l\'hormone de croissance et répare les petites déchirures causées par l\'effort. Dormir mal, c\'est freiner tes progrès, même si tu t\'entraînes bien.</p>' +
    '<div class="kpi"><div><b>8–10 h</b><span>Ados de 14 à 17 ans</span></div><div><b>7–9 h</b><span>Adultes</span></div><div><b>90 min</b><span>Un cycle de sommeil</span></div></div>' +
    '<h3>La routine du soir</h3><ul><li>Même heure de coucher et de réveil, autant que possible, week-end compris.</li><li>Pas d\'écran lumineux dans les 30 minutes avant de dormir.</li><li>Dîner léger mais complet, ni trop tard ni trop gras.</li><li>Chambre aussi fraîche et sombre que possible ; un ventilateur aide quand il fait chaud.</li><li>Évite les boissons énergisantes et le café en fin de journée.</li></ul>' +
    '<div class="tool"><h3>Calculateur d\'heure de coucher</h3><div class="row"><label for="wake">Je dois me lever à</label><input type="time" id="wake" value="06:30"></div><div class="bed" id="bed"></div><p class="muted" style="margin:10px 0 0;font-size:.82rem">On compte des cycles de 90 minutes + environ 15 minutes pour s\'endormir. Se réveiller en fin de cycle aide à se sentir plus reposé.</p></div>' +
    co('💤', 'ok', 'Une sieste de 20 minutes en début d\'après-midi peut aider à récupérer, sans gâcher la nuit.'));

  sec('eau', '💧', 'Hydratation',
    '<p>Le corps est fait d\'environ 60 % d\'eau. Quand tu transpires, tu en perds, et la fatigue, les crampes et les maux de tête arrivent plus vite. Au Bénin et dans les pays chauds, c\'est encore plus important.</p>' +
    '<ul><li><b>Repère général :</b> environ 1,5 à 2,5 litres par jour, plus s\'il fait chaud ou si tu transpires beaucoup.</li><li><b>Avant la séance :</b> un verre d\'eau, 30 minutes avant.</li><li><b>Pendant :</b> quelques gorgées entre les séries.</li><li><b>Après :</b> bois jusqu\'à ce que tes urines redeviennent jaune très clair.</li></ul>' +
    '<div class="tool"><h3>Mon compteur d\'eau</h3><div class="row"><label for="goal">Objectif (verres de 250 ml)</label><input type="number" id="goal" min="4" max="14" value="8" style="width:90px"><b id="wTxt"></b></div><div class="glasses" id="glasses"></div><div class="meter"><i id="wBar" style="width:0"></i></div><p class="muted" id="wMsg" style="margin:8px 0 0;font-size:.85rem"></p></div>' +
    co('⚠️', 'warn', 'Boire énormément d\'un coup n\'est pas utile. Bois régulièrement, par petites quantités.'));

  sec('lait', '🥛', 'Lait et alternatives',
    '<p>Le lait, le yaourt et le fromage apportent du <b>calcium</b> (os), des <b>protéines</b> et de l\'énergie. C\'est pratique, mais ce n\'est pas magique : le lait ne « fabrique » pas du muscle à lui seul. C\'est l\'ensemble de ton alimentation, de tes séances et de ton sommeil qui compte.</p>' +
    '<div class="cards"><div class="cardx"><span class="tag">Si tu en bois</span><h4>1 à 2 portions par jour</h4><p>Un verre de lait, un yaourt nature, un morceau de fromage. Préfère le nature, peu sucré.</p></div><div class="cardx"><span class="tag">Lactose</span><h4>Ça ne passe pas ?</h4><p>Ballonnements ou diarrhées : essaie le yaourt (mieux toléré) ou une boisson de soja enrichie en calcium.</p></div><div class="cardx"><span class="tag">Autres sources</span><h4>Calcium sans lait</h4><p>Petits poissons mangés avec les arêtes, feuilles vertes (moringa, gboman), sésame, arachide, tofu, haricots.</p></div></div>' +
    co('ℹ️', 'gold', 'Le lait en poudre sucré ou aromatisé contient beaucoup de sucre. Lis l\'étiquette et reste raisonnable.'));

  sec('recup', '🛌', 'Récupération',
    '<p>S\'entraîner tous les jours est possible sur ce site, parce que les séances alternent les zones du corps et que les cartes « Repos » existent. Mais ton corps a besoin de jours plus doux.</p>' +
    '<ul><li><b>Courbatures :</b> une gêne diffuse qui disparaît en 2 à 3 jours est normale. Bouger doucement aide.</li><li><b>Douleur vive, articulation qui tire, gonflement :</b> ce n\'est pas normal, arrête et repose-toi.</li><li><b>Récupération active :</b> marche, étirements, respiration lente.</li><li><b>Douche :</b> tiède, pas glacée juste après un gros effort si tu es très chaud.</li><li><b>Jour off :</b> prends-en un quand tu es épuisé, malade ou très mal dormi.</li></ul>' +
    co('✦', 'ok', 'Sur neV.BOOSTER, la carte spéciale <b>Repos</b> est un vrai jour de récupération validé : elle garde ta série intacte.'));

  sec('echauffement', '🔥', 'Échauffement et retour au calme',
    '<p>Cinq minutes d\'échauffement réduisent le risque de blessure et rendent la séance plus efficace. Coche au fur et à mesure :</p>' +
    '<div class="chk" id="warm"></div>' +
    '<div class="cta"><a class="btn sm" href="' + login + 'mobilite-1" data-go>Combo « Réveil du matin »</a><a class="btn ghost sm" href="' + login + 'mobilite-3" data-go>Combo « Après la séance »</a></div>' +
    '<p class="muted">Pour le retour au calme : 2 minutes de respiration lente puis quelques étirements doux (mollets, cuisses, poitrine, cou), 20 à 30 secondes chacun, sans douleur.</p>');

  sec('progression', '📈', 'Progression',
    '<ol><li><b>Réserve :</b> arrête chaque série avec 1 à 3 répétitions « en réserve ».</li><li><b>Un petit pas :</b> ajoute 1 répétition, ou 1 série, ou ralentis un peu la descente, environ chaque semaine.</li><li><b>Semaine plus légère :</b> toutes les 4 à 6 semaines, réduis un peu pour laisser le corps absorber l\'effort.</li><li><b>Carnet :</b> l\'historique du site garde tes séances ; regarde-le de temps en temps.</li><li><b>Patience :</b> on sent les premiers changements en quelques semaines, on les voit en quelques mois.</li></ol>' +
    co('🎯', 'gold', 'Refais le test « maximum de pompes » (Réglages) toutes les 4 à 6 semaines : le site adapte alors tes séances à ton nouveau niveau.'));

  sec('mental', '🧠', 'Mental et régularité',
    '<p>Ce qui change un corps, c\'est la <b>régularité</b>, pas la motivation du jour. Les jours où tu n\'as pas envie, fais seulement la première série : en général, tu continues.</p>' +
    '<ul><li>Choisis une heure fixe (après l\'école, avant le dîner…).</li><li>Prépare tes affaires la veille.</li><li>Célèbre les petites victoires : une série tenue, un badge, une flamme.</li><li>Parle de ton projet à un ami et parraine-le : c\'est plus facile à deux.</li></ul>' +
    co('⚠️', 'warn', 'Si tu rates un jour, la séance du lendemain est doublée sur le site. Ne te blesse jamais pour rattraper : fais les séries à ton rythme, avec des pauses, et arrête si la technique se dégrade.'));

  sec('posture', '🧍', 'Posture et technique',
    '<ul><li><b>Qualité avant quantité :</b> une répétition propre vaut mieux que trois bâclées.</li><li><b>Dos :</b> neutre, jamais arrondi sous charge.</li><li><b>Respiration :</b> expire à l\'effort, inspire au retour.</li><li><b>Caméra :</b> téléphone stable à environ 2 mètres, bonne lumière devant toi, vêtements ajustés, corps entier dans le cadre.</li><li><b>Miroir :</b> parfait pour vérifier l\'alignement.</li></ul>');

  sec('materiel', '🎒', 'Matériel à la maison',
    '<div class="cards"><div class="cardx"><span class="tag">Chaise</span><h4>Stable et calée</h4><p>Dossier contre un mur, jamais sur un sol qui glisse.</p></div><div class="cardx"><span class="tag">Sac à dos</span><h4>Fermé et chargé de livres</h4><p>Commence léger. Il sert pour les rowings, curls et squats.</p></div><div class="cardx"><span class="tag">Bouteilles</span><h4>Pleines d\'eau ou de sable</h4><p>Bien fermées, pour les élévations et les curls.</p></div><div class="cardx"><span class="tag">Serviette</span><h4>Pour glisser ou résister</h4><p>Tirages, pincements, curls des ischios.</p></div></div>' +
    co('🚫', 'warn', '<b>Jamais de tractions improvisées</b> sur une porte, une table qui bouge ou une branche douteuse. Une barre doit être fixée solidement, une table doit être très lourde et calée contre un mur.'));

  sec('securite', '🩺', 'Sécurité et médecin',
    '<p><b>Arrête immédiatement</b> si tu ressens : une douleur vive, un vertige, un malaise, une douleur dans la poitrine, un essoufflement anormal, une vision qui se trouble.</p>' +
    '<ul><li>Si tu as un problème de santé (cœur, asthme, diabète, articulations…) ou un doute : demande l\'avis d\'un médecin avant de commencer.</li><li>Moins de 18 ans : avance progressivement, pas de charges lourdes, et parle à un adulte de confiance. Le site retire les cartes les plus dures pour toi.</li><li>Chaleur : évite l\'effort aux heures les plus chaudes, bois, repose-toi à l\'ombre.</li><li>Ne t\'entraîne pas malade avec de la fièvre.</li></ul>' +
    co('ℹ️', 'gold', 'Ces conseils sont généraux. Ils ne remplacent jamais l\'avis d\'un médecin ou d\'un professionnel de santé.'));

  sec('mythes', '🧪', 'Mythes à oublier',
    acc('« Il faut avoir mal pour progresser »', 'Faux. Une fatigue musculaire est normale, une douleur vive est un signal d\'alerte.') +
    acc('« Faire beaucoup d\'abdos fait perdre le ventre »', 'Faux. On ne choisit pas où l\'on perd du gras. Les abdos renforcent le muscle ; le ventre dépend surtout de l\'alimentation et du mode de vie.') +
    acc('« Les compléments sont obligatoires »', 'Faux. Une alimentation variée suffit pour commencer. Les « boosters » douteux peuvent être dangereux.') +
    acc('« Le lait fait grossir » ou « le lait fait muscler »', 'Ni l\'un ni l\'autre à lui seul : tout dépend de la quantité, du sucre ajouté et du reste de ton alimentation.') +
    acc('« Il faut s\'entraîner tous les jours à fond »', 'Faux. Les progrès se font avec des efforts dosés et de la récupération.') +
    acc('« Les femmes vont devenir énormes »', 'Faux. Le travail à la maison renforce, tonifie et protège le corps ; devenir très volumineux demande des années d\'entraînement spécifique.') +
    acc('« Transpirer plus = brûler plus de gras »', 'Faux. La sueur régule ta température, elle n\'est pas un indicateur de perte de gras.') +
    acc('« Étirements avant = zéro blessure »', 'Pas tout à fait. Un échauffement progressif est plus utile ; les étirements longs sont mieux placés après.') +
    acc('« Plus je m\'entraîne jeune, moins je grandis »', 'Faux pour des exercices au poids du corps bien faits. Ce qui compte : technique, sommeil, alimentation et progressivité.'));

  sec('checklist', '✅', 'Checklist du jour',
    '<p>Un petit rituel pour mettre toutes les chances de ton côté. Elle se remet à zéro chaque jour.</p><div class="chk" id="chk"></div><div class="meter"><i id="cBar" style="width:0"></i></div><p class="muted" id="cMsg" style="margin:8px 0 0"></p>');

  sec('faq', '❓', 'Questions fréquentes',
    acc('Combien de temps pour voir des résultats ?', 'En général, on se sent plus fort après 2 à 4 semaines et on voit un changement après 2 à 3 mois, si on est régulier.') +
    acc('Je suis très fatigué après les premières séances, c\'est normal ?', 'Oui, c\'est courant. Dors assez, mange régulièrement et ne force pas. Si la fatigue dure plus de deux semaines, parle-en à un médecin.') +
    acc('J\'ai toujours faim, que faire ?', 'Ton corps réclame de quoi se réparer. Mange à heures régulières, avec des protéines et des féculents. Va voir la page Alimentation.') +
    acc('Puis-je m\'entraîner le ventre plein ?', 'Mieux vaut attendre 1 h 30 à 2 h après un gros repas. Une petite collation 30 à 60 minutes avant est possible.') +
    acc('À quelle heure s\'entraîner ?', 'À l\'heure où tu seras le plus régulier. En climat chaud, évite le milieu de journée.') +
    acc('Combien de séries par séance ?', 'Le site te propose 2 à 4 séries selon ton réglage. Commence par 2 ou 3, c\'est suffisant.') +
    acc('Que faire si je rate plusieurs jours ?', 'Reprends doucement. Le site double la prochaine séance : adapte, fais les séries avec de bonnes pauses et arrête si la technique baisse.') +
    acc('Les pompes seules suffisent-elles ?', 'Elles sont excellentes pour le haut du corps, mais pense au dos, aux jambes et au tronc : les cartes du gacha et la Spécialisation couvrent tout le corps.') +
    acc('Puis-je m\'entraîner en cas de courbatures ?', 'Oui, avec des exercices plus légers ou sur une autre zone, tant que ce n\'est pas douloureux.') +
    acc('Puis-je m\'entraîner si je suis malade ?', 'Si tu as de la fièvre ou des symptômes forts, repose-toi. Reprends doucement quand tu vas mieux.') +
    acc('Est-ce dangereux pour un adolescent ?', 'Les exercices au poids du corps bien exécutés sont sûrs. Évite les charges lourdes et parle à un adulte en cas de doute.') +
    acc('Comment rester motivé ?', 'Fixe un petit objectif, suis ta série, gagne des flammes et des badges, et entraîne-toi avec un ami (parrainage).'));

  /* ---------- rendu ---------- */
  $('toc').innerHTML = S.map((s) => '<a href="#' + s.id + '">' + s.ico + ' ' + esc(s.title) + '</a>').join('');
  $('art').innerHTML = S.map((s) => '<section id="' + s.id + '"><h2><span class="ico">' + s.ico + '</span>' + esc(s.title) + '</h2>' + s.html + '</section>').join('') +
    '<div class="cta"><a class="btn" href="alimentation.html" data-go>Voir l\'alimentation</a><a class="btn ghost" href="tuto.html" data-go>Le tuto du site</a>' + (user ? '<a class="btn ok" href="gacha.html" data-go>Mon gacha du jour</a>' : '<a class="btn ok" href="connexion.html" data-go>Créer mon compte</a>') + '</div>';

  const links = Array.from($('toc').querySelectorAll('a'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-20% 0px -70% 0px' });
    S.forEach((s) => { const el = $(s.id); if (el) io.observe(el); });
  }

  /* calculateur de coucher */
  const fmt = (m) => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  function bed() {
    const v = $('wake').value || '06:30', w = (+v.slice(0, 2)) * 60 + (+v.slice(3, 5));
    $('bed').innerHTML = [6, 5, 4].map((c, i) => '<div' + (i < 2 ? ' class="best"' : '') + '><b>' + fmt(w - c * 90 - 15) + '</b><span>' + c + ' cycles · ' + (c * 1.5) + ' h</span></div>').join('');
  }
  $('wake').addEventListener('input', bed); bed();

  /* compteur d'eau */
  const wk = 'nev.water.' + today;
  const ws = NEV.store.get(wk, { n: 0, goal: 8 });
  function water() {
    ws.goal = Math.max(4, Math.min(14, ws.goal || 8)); ws.n = Math.max(0, Math.min(ws.goal, ws.n));
    $('goal').value = ws.goal;
    $('glasses').innerHTML = Array.from({ length: ws.goal }, (_, i) => '<button type="button" class="glass' + (i < ws.n ? ' on' : '') + '" data-i="' + i + '" aria-label="Verre ' + (i + 1) + '" aria-pressed="' + (i < ws.n) + '"></button>').join('');
    $('wTxt').textContent = ws.n + ' / ' + ws.goal + ' verres · ' + (ws.n * 0.25).toFixed(2).replace('.', ',') + ' L';
    $('wBar').style.width = Math.round(ws.n / ws.goal * 100) + '%';
    $('wMsg').textContent = ws.n >= ws.goal ? 'Objectif atteint, bravo ! Continue de boire à ta soif.' : ws.n === 0 ? 'Touche un verre à chaque fois que tu bois.' : 'Encore ' + (ws.goal - ws.n) + ' verre' + (ws.goal - ws.n > 1 ? 's' : '') + '.';
    NEV.store.set(wk, ws);
  }
  $('glasses').addEventListener('click', (e) => { const b = e.target.closest('.glass'); if (!b) return; const i = +b.dataset.i; ws.n = ws.n === i + 1 ? i : i + 1; water(); });
  $('goal').addEventListener('change', () => { ws.goal = +$('goal').value || 8; water(); });
  water();

  /* listes cochables */
  function checks(id, items, key, barId, msgId) {
    const k = 'nev.' + key + '.' + today, st = NEV.store.get(k, {});
    const root = $(id);
    root.innerHTML = items.map((t, i) => '<label><input type="checkbox" data-i="' + i + '"' + (st[i] ? ' checked' : '') + '><span>' + esc(t) + '</span></label>').join('');
    const upd = () => {
      const n = Object.keys(st).filter((x) => st[x]).length;
      if (barId) { $(barId).style.width = Math.round(n / items.length * 100) + '%'; $(msgId).textContent = n === items.length ? 'Journée parfaite, bravo ! 🔥' : n + ' / ' + items.length + ' fait' + (n > 1 ? 's' : '') + '.'; }
    };
    root.addEventListener('change', (e) => { const c = e.target; st[c.dataset.i] = c.checked; NEV.store.set(k, st); upd(); });
    upd();
  }
  checks('warm', ['Marche rapide ou jumping jacks doux (1 min)', 'Cercles d\'épaules et de bras (30 s)', 'Rotations des poignets et des chevilles (30 s)', 'Chat-vache ou rotations du buste (1 min)', '5 squats lents et 5 pompes faciles pour finir'], 'warm');
  checks('chk', ['J\'ai assez dormi cette nuit', 'J\'ai bu au moins mon objectif d\'eau', 'J\'ai mangé des protéines à chaque repas', 'Je me suis échauffé', 'J\'ai fait ma séance', 'Je me suis étiré doucement', 'Je me couche à une heure raisonnable'], 'chk', 'cBar', 'cMsg');
})();
