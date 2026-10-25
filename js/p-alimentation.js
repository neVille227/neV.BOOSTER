/* neV.BOOSTER — page Alimentation (publique) */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, F = NEV.FOODS, byId = {};
  F.forEach((f) => { byId[f.id] = f; });
  const ctx = await NEV.bootPublic('alimentation');
  const user = ctx.user;
  const co = (ico, cls, html) => '<div class="callout ' + cls + '"><span class="ci">' + ico + '</span><p>' + html + '</p></div>';
  const acc = (q, a) => '<details class="acc"><summary>' + q + '</summary><div class="in">' + a + '</div></details>';
  const rnd = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const pick = (a) => a[rnd(a.length)];
  const r1 = (x) => Math.round(x * 10) / 10;
  const per = (f, g) => ({ kcal: f.kcal * g / 100, p: f.p * g / 100, g: f.g * g / 100, l: f.l * g / 100 });
  const add = (a, b) => ({ kcal: a.kcal + b.kcal, p: a.p + b.p, g: a.g + b.g, l: a.l + b.l });
  const ZERO = { kcal: 0, p: 0, g: 0, l: 0 };

  $('tip').innerHTML = '<div class="tip-ico" aria-hidden="true">🍽️</div><div><b>Le principe</b><p>Des protéines à chaque repas, des féculents pour l\'énergie, des légumes et des fruits pour les vitamines, de l\'eau, et du sommeil pour que tout cela serve à tes muscles.</p></div>';

  const S = [];
  const sec = (id, ico, title, html) => S.push({ id, ico, title, html });

  sec('faim', '🍗', 'Pourquoi j\'ai tout le temps faim et sommeil ?',
    '<p>Si tu t\'entraînes régulièrement, il arrive un moment où tu as <b>faim à tout instant</b> et <b>envie de dormir</b>. C\'est très courant, et ce n\'est pas de la paresse : ce sont tes muscles qui réclament de quoi se réparer et se développer.</p>' +
    '<div class="cards"><div class="cardx"><span class="tag">1 · Énergie</span><h4>Tu dépenses plus</h4><p>Chaque séance brûle de l\'énergie, et un corps qui construit du muscle en consomme davantage, même au repos.</p></div><div class="cardx"><span class="tag">2 · Réparation</span><h4>Les fibres se réparent</h4><p>Après l\'effort, les fibres musculaires ont de petites lésions. Pour les réparer et les renforcer, le corps a besoin de protéines et de calories.</p></div><div class="cardx"><span class="tag">3 · Hormones</span><h4>Faim et sommeil</h4><p>Les hormones de la faim montent quand tu dépenses de l\'énergie, et l\'hormone de croissance est surtout libérée pendant le sommeil profond : le corps te pousse à dormir.</p></div></div>' +
    '<h3>Comment bien y répondre</h3><ul><li><b>Mange à heures régulières</b> : 3 repas + 1 à 2 collations.</li><li><b>Mets des protéines à chaque repas</b> (œuf, poisson, haricots, arachide, viande, lait…).</li><li><b>Ajoute des féculents</b> (riz, igname, manioc, maïs, plantain) pour l\'énergie.</li><li><b>Dors assez</b> : 8 à 10 h si tu as moins de 18 ans, 7 à 9 h ensuite.</li><li><b>Bois de l\'eau</b> tout au long de la journée.</li><li><b>Ne te prive pas</b> et ne saute pas de repas : tes progrès en dépendent.</li></ul>' +
    co('✅', 'ok', 'Avoir plus faim et plus sommeil qu\'avant, avec une énergie correcte le reste du temps, est un signe que ton corps s\'adapte.') +
    co('⚠️', 'warn', '<b>Parle à un adulte ou consulte un médecin</b> si tu perds du poids sans le vouloir, si tu es épuisé en permanence, si tu as des vertiges ou des malaises, des douleurs inhabituelles ou un essoufflement anormal.'));

  sec('nutriments', '🧬', 'Les nutriments en bref',
    '<div class="cards">' +
    '<div class="cardx"><span class="tag">Protéines</span><h4>Les briques du muscle</h4><p>Œufs, poissons, viandes, haricots, soja, arachide, lait. Vise une source à chaque repas.</p></div>' +
    '<div class="cardx"><span class="tag">Glucides</span><h4>Le carburant</h4><p>Riz, igname, manioc, maïs, plantain, patate douce, pain. Ils donnent l\'énergie pour s\'entraîner.</p></div>' +
    '<div class="cardx"><span class="tag">Lipides</span><h4>Les bons gras</h4><p>Arachide, avocat, poisson gras, huile en quantité modérée. Utiles pour les hormones et les vitamines.</p></div>' +
    '<div class="cardx"><span class="tag">Fibres</span><h4>Le transit et la satiété</h4><p>Légumes, fruits, légumineuses, céréales complètes.</p></div>' +
    '<div class="cardx"><span class="tag">Vitamines et minéraux</span><h4>Les petits chefs d\'orchestre</h4><p>Fer (viande, poisson, feuilles, haricots), calcium (lait, petits poissons, feuilles), magnésium (arachide, mil), zinc (viande, graines), vitamine D (soleil, poisson gras).</p></div>' +
    '<div class="cardx"><span class="tag">Eau</span><h4>Le transport</h4><p>Sans eau, rien ne circule bien. Repères dans la page Conseils.</p></div></div>');

  sec('aliments', '🔎', 'Les aliments de chez nous',
    '<p>' + F.length + ' aliments avec leurs valeurs pour une portion habituelle. Ce sont des <b>ordres de grandeur</b> : la cuisson et la recette changent les chiffres.</p>' +
    '<div class="fgrid"><input type="search" id="fq" placeholder="Rechercher (ex. haricot)" aria-label="Rechercher un aliment"><select id="fc" aria-label="Catégorie"><option value="">Toutes catégories</option>' + Object.keys(NEV.FOOD_CATS).map((k) => '<option value="' + k + '">' + NEV.FOOD_CATS[k] + '</option>').join('') + '</select><select id="fs" aria-label="Trier"><option value="p">Plus de protéines par portion</option><option value="pk">Plus de protéines pour 100 kcal</option><option value="kcal">Plus d\'énergie par portion</option><option value="n">Ordre alphabétique</option></select></div>' +
    '<div class="fgrid"><label class="check"><input type="checkbox" id="fl"><span>Aliments locaux</span></label><label class="check"><input type="checkbox" id="fb"><span>Petit budget</span></label><label class="check"><input type="checkbox" id="fv"><span>Végétarien</span></label></div>' +
    '<div class="tablewrap ftab"><table class="tbl" id="ftab"></table></div><p class="muted" id="fcount" style="font-size:.82rem"></p>');

  sec('besoins', '🧮', 'Calculateur de besoins',
    '<p>Une estimation de ton énergie et de tes protéines. Ce n\'est <b>pas un avis médical</b>.</p>' +
    '<div class="tool"><div class="fgrid"><div><label for="ca">Âge</label><input type="number" id="ca" min="10" max="90" value="16"></div><div><label for="cs">Sexe</label><select id="cs"><option value="m">Garçon / homme</option><option value="f">Fille / femme</option></select></div><div><label for="cw">Poids (kg)</label><input type="number" id="cw" min="25" max="200" value="60"></div><div><label for="ch">Taille (cm)</label><input type="number" id="ch" min="100" max="220" value="170"></div><div><label for="cv">Activité</label><select id="cv"><option value="1.375">Légère (1–3 séances/sem.)</option><option value="1.55" selected>Modérée (3–5 séances/sem.)</option><option value="1.725">Élevée (presque tous les jours + métier physique)</option><option value="1.2">Très calme</option></select></div><div><label for="co">Objectif</label><select id="co"><option value="0">Rester en forme</option><option value="1">Prendre du muscle doucement</option><option value="-1">Perdre un peu de gras doucement</option></select></div></div><div id="cres"></div></div>');

  sec('assiette', '🍛', 'Constructeur d\'assiette',
    '<p>Compose ton repas : un féculent, une protéine, un légume et, si tu veux, un peu de gras.</p>' +
    '<div class="tool"><div class="fgrid"><div><label for="pf">Féculent</label><select id="pf"></select></div><div><label for="pp">Protéine</label><select id="pp"></select></div><div><label for="pv">Légume</label><select id="pv"></select></div><div><label for="pg">Gras</label><select id="pg"></select></div><div><label for="pm">Quantité (× portion)</label><select id="pm"><option value="0.5">× 0,5</option><option value="1" selected>× 1</option><option value="1.5">× 1,5</option><option value="2">× 2</option></select></div></div><div class="pl"><div id="pres"></div><div class="donut" id="pdon"></div></div></div>');

  sec('menu', '🎲', 'Menu du jour au hasard',
    '<p>Pas d\'idée ? Laisse le hasard te proposer une journée complète (3 repas + 2 collations).</p>' +
    '<div class="fgrid"><label class="check"><input type="checkbox" id="mb"><span>Petit budget</span></label><label class="check"><input type="checkbox" id="ml" checked><span>Aliments locaux</span></label><label class="check"><input type="checkbox" id="mv"><span>Végétarien</span></label><label class="check"><input type="checkbox" id="mf"><span>Sans poisson</span></label><label class="check"><input type="checkbox" id="mn"><span>Sans arachide</span></label></div>' +
    '<div class="cta"><button type="button" class="btn" id="mgo">Un autre menu 🎲</button></div><div id="mres"></div>');

  sec('exemples', '📅', 'Trois journées types',
    '<div class="tablewrap"><table class="tbl"><thead><tr><th>Repas</th><th>Budget serré (local)</th><th>Standard</th><th>Végétarien</th></tr></thead><tbody>' +
    '<tr><td><b>Petit-déjeuner</b></td><td>Bouillie de maïs + arachides grillées + 1 banane</td><td>Pain + 2 œufs + 1 orange</td><td>Avoine + lait ou soja + banane + pâte d\'arachide</td></tr>' +
    '<tr><td><b>Déjeuner</b></td><td>Atassi (riz-haricots) + sauce tomate + feuilles + poisson fumé</td><td>Riz + poulet + légumes + sauce</td><td>Riz + niébé + feuilles + avocat</td></tr>' +
    '<tr><td><b>Collation</b></td><td>Gari + arachide + eau</td><td>Yaourt + mangue</td><td>Pain + wagashi ou tofu + fruit</td></tr>' +
    '<tr><td><b>Dîner</b></td><td>Pâte de maïs + sauce gombo + tilapia</td><td>Igname + poisson grillé + salade</td><td>Pâte de maïs + sauce d\'egusi + haricots</td></tr>' +
    '<tr><td><b>Avant dormir</b></td><td>Un verre d\'eau, éventuellement un fruit</td><td>Un yaourt nature</td><td>Un verre de lait ou de soja</td></tr></tbody></table></div>');

  sec('timing', '⏱️', 'Avant, pendant et après la séance',
    '<ul><li><b>2 h avant :</b> un vrai repas avec féculent + protéine.</li><li><b>30 à 60 min avant :</b> une petite collation facile à digérer (banane, pain, quelques arachides).</li><li><b>Pendant :</b> de l\'eau en petites gorgées.</li><li><b>Dans les 2 h après :</b> un repas avec protéines + féculents + légumes (ou une collation si le repas est loin).</li><li><b>Le soir :</b> ne te couche pas le ventre vide si tu as faim ; choisis léger mais nourrissant.</li></ul>' +
    '<div class="cards"><div class="cardx"><span class="tag">Collations pas chères</span><h4>Efficaces</h4><p>Arachides, banane, œuf dur, pain + pâte d\'arachide, yaourt nature, sardine + pain, patate douce.</p></div><div class="cardx"><span class="tag">Budget</span><h4>Astuces</h4><p>Achète de saison, privilégie haricots, œufs, poisson fumé, arachide, maïs. Cuisine en grande quantité et garde pour le lendemain en lieu frais.</p></div><div class="cardx"><span class="tag">Hygiène</span><h4>Conserver sans risque</h4><p>Lave-toi les mains, cuis bien viande et poisson, ne garde pas les restes plus d\'une journée sans froid.</p></div></div>');

  sec('complements', '💊', 'Et les compléments ?',
    '<p>Pas obligatoires. La nourriture d\'abord. Une poudre de protéines peut dépanner si tu ne manges pas assez de protéines, mais ce n\'est jamais indispensable.</p>' +
    co('🚫', 'warn', 'Méfie-toi des « boosters », « brûleurs de graisse » et produits sans étiquette claire : ils peuvent être dangereux. Les produits dopants et hormones sont interdits pour progresser. <b>Moins de 18 ans : pas de complément sans avis médical.</b>'));

  sec('mythes', '🧪', 'Mythes',
    acc('« Il faut manger énormément de viande »', 'Non. Haricots, œufs, poisson, arachide, lait et soja font très bien l\'affaire, associés à des féculents.') +
    acc('« Les féculents font grossir »', 'Pas par eux-mêmes. Ils donnent l\'énergie ; c\'est la quantité totale sur la durée qui compte.') +
    acc('« Manger après 20 h fait grossir »', 'Ce qui compte, c\'est le total sur la journée, pas l\'heure précise.') +
    acc('« Les sodas sont une bonne énergie »', 'Surtout du sucre. Préfère un fruit et de l\'eau.') +
    acc('« Sauter un repas aide à maigrir »', 'Cela fatigue et fait grignoter plus tard. Pas bon quand on s\'entraîne.') +
    acc('« Les protéines abîment les reins »', 'Chez une personne en bonne santé et dans les quantités habituelles, non. En cas de maladie des reins, demande l\'avis d\'un médecin.') +
    acc('« Il faut manger tout de suite après la séance »', 'Un repas dans les 2 heures suffit largement.') +
    acc('« Un régime très strict fait fondre plus vite »', 'Il fait surtout perdre du muscle, de l\'énergie et du moral. Pas de régime extrême.'));

  sec('faq', '❓', 'Questions fréquentes',
    acc('Combien de repas par jour ?', '3 repas et 1 ou 2 collations est un bon rythme pour répondre à la faim sans te surcharger.') +
    acc('Je n\'ai pas faim le matin, que faire ?', 'Commence par peu : un fruit, une boisson de lait ou de soja, quelques arachides. L\'appétit revient avec l\'habitude.') +
    acc('Je suis toujours fatigué malgré le sommeil.', 'Vérifie que tu manges assez (surtout féculents et protéines), que tu bois, et parle-en à un médecin si cela dure : fer, paludisme, anémie…') +
    acc('Puis-je manger de la friture ?', 'De temps en temps oui ; au quotidien, privilégie les cuissons à l\'eau, à la braise ou à la poêle avec peu d\'huile.') +
    acc('Je suis végétarien, est-ce possible ?', 'Oui : mélange légumineuses (niébé, soja, haricots) et céréales, ajoute œufs, laitiers, graines et noix.') +
    acc('Et si j\'ai une allergie ?', 'Évite l\'aliment concerné et demande l\'avis d\'un médecin ; les filtres du menu au hasard t\'aident à exclure arachide ou poisson.') +
    acc('Combien de protéines ?', 'Pour une personne qui s\'entraîne, environ 1,2 à 1,6 g par kilo de poids chez les moins de 18 ans et 1,4 à 2 g/kg chez les adultes. Utilise le calculateur.') +
    acc('Les fruits ont trop de sucre ?', 'Non : ils apportent aussi fibres et vitamines. Garde les jus et boissons sucrées pour l\'occasion.') +
    acc('Comment prendre du poids sainement ?', 'Ajoute des collations riches (arachide, banane, yaourt, œufs) et un peu plus de féculents, sans te forcer à l\'excès.') +
    acc('Comment perdre du gras sans perdre mes muscles ?', 'Reste régulier, garde les protéines, évite les régimes stricts. Pour les moins de 18 ans, ne cherche pas à maigrir sans avis médical.'));

  $('toc').innerHTML = S.map((s) => '<a href="#' + s.id + '">' + s.ico + ' ' + esc(s.title.length > 26 ? s.title.slice(0, 24) + '…' : s.title) + '</a>').join('');
  $('art').innerHTML = S.map((s) => '<section id="' + s.id + '"><h2><span class="ico">' + s.ico + '</span>' + esc(s.title) + '</h2>' + s.html + '</section>').join('') +
    '<div class="cta"><a class="btn" href="conseils.html" data-go>Voir les conseils</a><a class="btn ghost" href="tuto.html" data-go>Le tuto du site</a></div>';
  const links = Array.from($('toc').querySelectorAll('a'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-20% 0px -70% 0px' });
    S.forEach((s) => { const el = $(s.id); if (el) io.observe(el); });
  }

  /* ----- tableau d'aliments ----- */
  function table() {
    const q = $('fq').value.trim().toLowerCase(), c = $('fc').value;
    let L = F.filter((f) => (!q || f.name.toLowerCase().indexOf(q) >= 0) && (!c || f.cat === c) && (!$('fl').checked || f.local) && (!$('fb').checked || f.prix <= 1) && (!$('fv').checked || f.tags.indexOf('vegetarien') >= 0));
    const s = $('fs').value, pv = (f) => per(f, f.portion.g);
    L = L.slice().sort((a, b) => s === 'n' ? a.name.localeCompare(b.name, 'fr') : s === 'kcal' ? pv(b).kcal - pv(a).kcal : s === 'pk' ? (b.p / (b.kcal || 1)) - (a.p / (a.kcal || 1)) : pv(b).p - pv(a).p);
    $('ftab').innerHTML = '<thead><tr><th>Aliment</th><th>Portion</th><th>kcal</th><th>Prot.</th><th>Gluc.</th><th>Lip.</th></tr></thead><tbody>' + L.map((f) => { const v = pv(f); return '<tr><td class="n">' + esc(f.name) + (f.local ? ' <small>· local</small>' : '') + '</td><td><small>' + esc(f.portion.label) + ' (' + f.portion.g + ' g)</small></td><td>' + Math.round(v.kcal) + '</td><td>' + r1(v.p) + ' g</td><td>' + r1(v.g) + ' g</td><td>' + r1(v.l) + ' g</td></tr>'; }).join('') + '</tbody>';
    $('fcount').textContent = L.length + ' aliment' + (L.length > 1 ? 's' : '') + ' · valeurs par portion.';
  }
  ['fq', 'fc', 'fs', 'fl', 'fb', 'fv'].forEach((id) => $(id).addEventListener('input', table)); table();

  /* ----- calculateur ----- */
  function calc() {
    const age = +$('ca').value, w = +$('cw').value, h = +$('ch').value, act = +$('cv').value, goal = +$('co').value, m = $('cs').value === 'm';
    const bad = !(age >= 10 && age <= 90 && w >= 25 && w <= 200 && h >= 100 && h <= 220);
    if (bad) { $('cres').innerHTML = '<p class="muted">Entre des valeurs réalistes (âge 10–90, poids 25–200 kg, taille 100–220 cm).</p>'; return; }
    const minor = age < 18;
    const pLo = minor ? 1.2 : 1.4, pHi = minor ? 1.6 : 2.0;
    let html = '<div class="res"><div><b>' + Math.round(w * pLo) + '–' + Math.round(w * pHi) + ' g</b><span>Protéines par jour</span></div><div><b>' + Math.round(w * 30) + '–' + Math.round(w * 40) + ' ml</b><span>Eau de base (plus s\'il fait chaud)</span></div>';
    if (minor) {
      html += '</div>' + co('ℹ️', 'gold', 'À ton âge, le corps grandit encore : on ne chiffre ni régime ni calories. Mange à ta faim, avec protéines, féculents, légumes et fruits à chaque repas, dors assez, et parle à un adulte ou à un professionnel si tu veux changer de poids.');
    } else {
      const bmr = 10 * w + 6.25 * h - 5 * age + (m ? 5 : -161), tdee = bmr * act, target = tdee * (1 + goal * 0.1);
      html += '<div><b>' + Math.round(bmr) + ' kcal</b><span>Métabolisme de base</span></div><div><b>' + Math.round(tdee) + ' kcal</b><span>Besoin avec activité</span></div><div><b>' + Math.round(target / 50) * 50 + ' kcal</b><span>Repère pour ton objectif</span></div></div>' +
        co('ℹ️', 'gold', 'Estimation (formule de Mifflin-St Jeor). Change doucement (± 10 %), observe pendant 2 à 3 semaines, ajuste. Pas de régime extrême. En cas de maladie, de grossesse ou de doute, demande l\'avis d\'un médecin.');
    }
    $('cres').innerHTML = html;
  }
  ['ca', 'cs', 'cw', 'ch', 'cv', 'co'].forEach((id) => $(id).addEventListener('input', calc)); calc();

  /* ----- assiette ----- */
  const opt = (cat, extra) => F.filter((f) => f.cat === cat && (!extra || extra(f))).map((f) => '<option value="' + f.id + '">' + esc(f.name) + '</option>').join('');
  $('pf').innerHTML = opt('feculents'); $('pp').innerHTML = opt('proteines'); $('pv').innerHTML = '<option value="">(aucun)</option>' + opt('legumes'); $('pg').innerHTML = '<option value="">(aucun)</option>' + opt('gras');
  $('pf').value = 'riz-local'; $('pp').value = 'niebe'; $('pv').value = 'gboman';
  function donut(t) {
    const k = [t.p * 4, t.g * 4, t.l * 9], tot = k[0] + k[1] + k[2] || 1, col = ['#e0455f', '#f0b24a', '#6aa8ff'];
    let a0 = -Math.PI / 2, s = '<svg viewBox="0 0 120 120" role="img" aria-label="Répartition protéines, glucides, lipides">';
    k.forEach((v, i) => { const a1 = a0 + (v / tot) * Math.PI * 2, x0 = 60 + 48 * Math.cos(a0), y0 = 60 + 48 * Math.sin(a0), x1 = 60 + 48 * Math.cos(a1 - 0.0001), y1 = 60 + 48 * Math.sin(a1 - 0.0001); if (v > 0) s += '<path d="M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A48 48 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + '" fill="none" stroke="' + col[i] + '" stroke-width="16"/>'; a0 = a1; });
    return s + '<text x="60" y="58" text-anchor="middle" fill="#fff" font-size="17" font-weight="900">' + Math.round(t.kcal) + '</text><text x="60" y="74" text-anchor="middle" fill="#c2a3aa" font-size="9">kcal</text></svg>' +
      '<div class="dn-l"><span><i style="background:#e0455f"></i>Prot.</span><span><i style="background:#f0b24a"></i>Gluc.</span><span><i style="background:#6aa8ff"></i>Lip.</span></div>';
  }
  function plate() {
    const m = +$('pm').value; let t = ZERO; const names = [];
    [['pf', 1], ['pp', 1], ['pv', 1], ['pg', 1]].forEach((x) => { const f = byId[$(x[0]).value]; if (f) { t = add(t, per(f, f.portion.g * m)); names.push(f.name + ' (' + Math.round(f.portion.g * m) + ' g)'); } });
    $('pres').innerHTML = '<ul>' + names.map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul><div class="res"><div><b>' + Math.round(t.kcal) + '</b><span>kcal</span></div><div><b>' + r1(t.p) + ' g</b><span>Protéines</span></div><div><b>' + r1(t.g) + ' g</b><span>Glucides</span></div><div><b>' + r1(t.l) + ' g</b><span>Lipides</span></div></div>';
    $('pdon').innerHTML = donut(t);
  }
  ['pf', 'pp', 'pv', 'pg', 'pm'].forEach((id) => $(id).addEventListener('change', plate)); plate();

  /* ----- menu au hasard ----- */
  function menu() {
    const ok = (f) => (!$('mb').checked || f.prix <= 1) && (!$('ml').checked || f.local) && (!$('mv').checked || f.tags.indexOf('vegetarien') >= 0) && (!$('mf').checked || f.tags.indexOf('poisson') < 0) && (!$('mn').checked || f.tags.indexOf('arachide') < 0);
    const pool = (cat, ids) => F.filter((f) => f.cat === cat && ok(f) && (!ids || ids.indexOf(f.id) >= 0));
    const grab = (arr, fb) => (arr.length ? pick(arr) : (fb || null));
    const mains = F.filter((f) => f.cat === 'proteines' && ok(f) && ['arachide', 'cajou', 'sesame', 'egusi', 'pate-arachide'].indexOf(f.id) < 0);
    const morn = F.filter((f) => ok(f) && ['oeuf', 'lait', 'yaourt', 'lait-soja', 'pate-arachide', 'arachide', 'niebe', 'wagashi', 'tofu'].indexOf(f.id) >= 0);
    const snk = F.filter((f) => ok(f) && ['arachide', 'cajou', 'yaourt', 'oeuf', 'patate-douce', 'plantain', 'wagashi', 'lait-soja', 'lait'].indexOf(f.id) >= 0);
    const fr = pool('fruits'), fe = pool('feculents'), lg = pool('legumes');
    const meals = [
      ['Petit-déjeuner', [grab(F.filter((f) => f.cat === 'feculents' && ok(f) && ['bouillie-mais', 'pain', 'avoine', 'akassa', 'gari', 'plantain', 'patate-douce', 'mais'].indexOf(f.id) >= 0), grab(fe)), grab(morn), grab(fr)]],
      ['Déjeuner', [grab(fe), grab(mains), grab(lg)]],
      ['Collation', [grab(snk), grab(fr)]],
      ['Dîner', [grab(fe), grab(mains), grab(lg)]],
      ['Collation du soir', [grab(snk)]]
    ];
    let T = ZERO;
    $('mres').innerHTML = '<div class="meals">' + meals.map((m) => {
      const items = m[1].filter(Boolean); let t = ZERO;
      items.forEach((f) => { t = add(t, per(f, f.portion.g)); });
      T = add(T, t);
      return '<div class="meal"><h4>' + m[0] + '</h4>' + (items.length ? '<ul>' + items.map((f) => '<li>' + esc(f.name) + ' <small class="muted">— ' + esc(f.portion.label) + '</small></li>').join('') + '</ul><p class="muted" style="margin:8px 0 0;font-size:.78rem">≈ ' + Math.round(t.kcal) + ' kcal · ' + Math.round(t.p) + ' g de protéines</p>' : '<p class="muted">Aucun aliment ne correspond à tes filtres.</p>') + '</div>';
    }).join('') + '</div><p class="muted" style="margin-top:10px">Total estimé : <b>' + Math.round(T.kcal) + ' kcal</b> · <b>' + Math.round(T.p) + ' g</b> de protéines. C\'est un exemple : adapte les quantités à ta faim.</p>';
  }
  $('mgo').addEventListener('click', menu); ['mb', 'ml', 'mv', 'mf', 'mn'].forEach((id) => $(id).addEventListener('change', menu)); menu();
})();
