/* neV.BOOSTER — foods.js
   Aliments (pour 100 g, ordres de grandeur issus des tables usuelles CIQUAL / USDA / FAO Afrique de l'Ouest).
   [id, nom, catégorie, kcal, protéines g, glucides g, lipides g, libellé de portion, grammes de la portion, prix 1–3, local, tags]
   prix : 1 = très abordable, 3 = plus cher (indicatif en Afrique de l'Ouest).  Valeurs arrondies : ce sont des estimations. */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const R = [
    // protéines
    ['oeuf', 'Œuf (cuit)', 'proteines', 150, 12.5, 1, 10.5, '1 œuf', 55, 1, 1, ['oeuf', 'vegetarien']],
    ['poulet', 'Poulet (poitrine, cuit)', 'proteines', 165, 31, 0, 3.6, '1 morceau', 120, 2, 1, ['viande']],
    ['poulet-cuisse', 'Poulet (cuisse, cuit)', 'proteines', 210, 26, 0, 11, '1 cuisse', 100, 1, 1, ['viande']],
    ['boeuf', 'Bœuf maigre (cuit)', 'proteines', 200, 27, 0, 10, '1 portion', 100, 3, 1, ['viande']],
    ['mouton', 'Mouton / chèvre (cuit)', 'proteines', 215, 26, 0, 12, '1 portion', 100, 3, 1, ['viande']],
    ['poisson-tilapia', 'Tilapia (cuit)', 'proteines', 128, 26, 0, 2.7, '1 poisson moyen', 150, 1, 1, ['poisson']],
    ['poisson-fume', 'Poisson fumé', 'proteines', 190, 40, 0, 3.5, '1 morceau', 60, 1, 1, ['poisson']],
    ['sardine', 'Sardine (boîte, à l\'huile égouttée)', 'proteines', 208, 25, 0, 11, '1 petite boîte', 90, 1, 1, ['poisson']],
    ['thon', 'Thon (boîte, au naturel)', 'proteines', 116, 26, 0, 1, '1 petite boîte', 100, 2, 0, ['poisson']],
    ['crevettes', 'Crevettes (cuites)', 'proteines', 99, 24, 0.2, 0.3, '1 poignée', 80, 3, 1, ['poisson']],
    ['niebe', 'Haricots niébé (cuits)', 'proteines', 116, 8, 21, 0.5, '1 louche', 150, 1, 1, ['vegetarien', 'legumineuse']],
    ['haricots-rouges', 'Haricots rouges (cuits)', 'proteines', 127, 8.7, 22, 0.5, '1 louche', 150, 1, 0, ['vegetarien', 'legumineuse']],
    ['lentilles', 'Lentilles (cuites)', 'proteines', 116, 9, 20, 0.4, '1 louche', 150, 2, 0, ['vegetarien', 'legumineuse']],
    ['pois-chiches', 'Pois chiches (cuits)', 'proteines', 164, 8.9, 27, 2.6, '1 louche', 150, 2, 0, ['vegetarien', 'legumineuse']],
    ['soja', 'Soja (graines cuites)', 'proteines', 173, 17, 10, 9, '1 louche', 150, 2, 1, ['vegetarien', 'legumineuse']],
    ['tofu', 'Tofu / fromage de soja', 'proteines', 120, 13, 2, 7, '1 tranche', 100, 2, 1, ['vegetarien']],
    ['wagashi', 'Wagashi (fromage peul)', 'proteines', 270, 20, 3, 20, '1 morceau', 60, 2, 1, ['laitier', 'vegetarien']],
    ['pate-arachide', 'Pâte d\'arachide', 'proteines', 590, 25, 20, 50, '1 cuillère', 15, 1, 1, ['vegetarien', 'arachide']],
    ['arachide', 'Arachides grillées', 'proteines', 580, 26, 16, 49, '1 poignée', 30, 1, 1, ['vegetarien', 'arachide']],
    ['cajou', 'Noix de cajou', 'proteines', 553, 18, 30, 44, '1 poignée', 30, 2, 1, ['vegetarien']],
    ['sesame', 'Graines de sésame', 'proteines', 573, 18, 23, 50, '1 cuillère', 10, 2, 1, ['vegetarien']],
    ['egusi', 'Graines de courge (egusi)', 'proteines', 560, 30, 11, 49, '1 poignée', 30, 2, 1, ['vegetarien']],
    // féculents
    ['riz', 'Riz blanc (cuit)', 'feculents', 130, 2.7, 28, 0.3, '1 assiette', 200, 1, 0, ['vegetarien']],
    ['riz-local', 'Riz local (cuit)', 'feculents', 130, 2.7, 28, 0.3, '1 assiette', 200, 1, 1, ['vegetarien']],
    ['atassi', 'Atassi (riz-haricots cuits)', 'feculents', 140, 5.5, 24, 2.2, '1 assiette', 250, 1, 1, ['vegetarien', 'legumineuse']],
    ['igname', 'Igname (bouillie)', 'feculents', 118, 1.5, 28, 0.2, '1 morceau', 200, 1, 1, ['vegetarien']],
    ['igname-pilee', 'Igname pilée', 'feculents', 118, 1.5, 28, 0.2, '1 boule', 250, 1, 1, ['vegetarien']],
    ['manioc', 'Manioc (bouilli)', 'feculents', 160, 1.4, 38, 0.3, '1 morceau', 150, 1, 1, ['vegetarien']],
    ['gari', 'Gari (semoule de manioc)', 'feculents', 360, 1.5, 88, 0.6, '1 verre', 60, 1, 1, ['vegetarien']],
    ['akassa', 'Pâte de maïs (ami, akassa)', 'feculents', 100, 2.2, 22, 0.8, '1 boule', 250, 1, 1, ['vegetarien']],
    ['mais', 'Maïs (épi ou grains cuits)', 'feculents', 96, 3.4, 21, 1.5, '1 épi', 150, 1, 1, ['vegetarien']],
    ['mil', 'Mil (cuit)', 'feculents', 119, 3.5, 23, 1, '1 assiette', 200, 1, 1, ['vegetarien']],
    ['sorgho', 'Sorgho (cuit)', 'feculents', 125, 4, 25, 1.3, '1 assiette', 200, 1, 1, ['vegetarien']],
    ['fonio', 'Fonio (cuit)', 'feculents', 115, 2.5, 25, 0.8, '1 assiette', 200, 2, 1, ['vegetarien']],
    ['patate-douce', 'Patate douce (cuite)', 'feculents', 90, 2, 21, 0.1, '1 patate', 150, 1, 1, ['vegetarien']],
    ['plantain', 'Banane plantain (bouillie)', 'feculents', 122, 1.3, 32, 0.4, '1 plantain', 150, 1, 1, ['vegetarien']],
    ['plantain-frit', 'Plantain frit (alloco)', 'feculents', 240, 1.5, 38, 10, '1 portion', 100, 1, 1, ['vegetarien']],
    ['pain', 'Pain', 'feculents', 265, 9, 49, 3.2, '1/4 de baguette', 60, 1, 0, ['vegetarien', 'gluten']],
    ['avoine', 'Flocons d\'avoine (cuits)', 'feculents', 70, 2.5, 12, 1.5, '1 bol', 250, 2, 0, ['vegetarien', 'gluten']],
    ['pates', 'Pâtes (cuites)', 'feculents', 158, 5.8, 31, 0.9, '1 assiette', 200, 1, 0, ['vegetarien', 'gluten']],
    ['bouillie-mais', 'Bouillie de maïs (au sucre)', 'feculents', 60, 1, 13, 0.3, '1 bol', 300, 1, 1, ['vegetarien']],
    // légumes
    ['gboman', 'Feuilles (gboman, épinards africains)', 'legumes', 30, 3, 4, 0.5, '1 louche', 100, 1, 1, ['vegetarien']],
    ['ademe', 'Feuilles de corète (adémè)', 'legumes', 35, 4, 5, 0.5, '1 louche', 100, 1, 1, ['vegetarien']],
    ['moringa', 'Feuilles de moringa', 'legumes', 64, 9.4, 8, 1.4, '1 poignée', 40, 1, 1, ['vegetarien']],
    ['gombo', 'Gombo', 'legumes', 33, 1.9, 7, 0.2, '1 portion', 100, 1, 1, ['vegetarien']],
    ['tomate', 'Tomate', 'legumes', 18, 0.9, 3.9, 0.2, '1 tomate', 100, 1, 1, ['vegetarien']],
    ['oignon', 'Oignon', 'legumes', 40, 1.1, 9, 0.1, '1 oignon', 80, 1, 1, ['vegetarien']],
    ['aubergine', 'Aubergine / « légume local »', 'legumes', 25, 1, 6, 0.2, '1 portion', 100, 1, 1, ['vegetarien']],
    ['carotte', 'Carotte', 'legumes', 41, 0.9, 10, 0.2, '1 carotte', 80, 1, 0, ['vegetarien']],
    ['chou', 'Chou', 'legumes', 25, 1.3, 6, 0.1, '1 portion', 100, 1, 1, ['vegetarien']],
    ['concombre', 'Concombre', 'legumes', 15, 0.7, 3.6, 0.1, '1/2 concombre', 100, 1, 1, ['vegetarien']],
    // fruits
    ['banane', 'Banane', 'fruits', 89, 1.1, 23, 0.3, '1 banane', 100, 1, 1, ['vegetarien']],
    ['mangue', 'Mangue', 'fruits', 60, 0.8, 15, 0.4, '1 mangue', 200, 1, 1, ['vegetarien']],
    ['ananas', 'Ananas', 'fruits', 50, 0.5, 13, 0.1, '1 tranche', 150, 1, 1, ['vegetarien']],
    ['papaye', 'Papaye', 'fruits', 43, 0.5, 11, 0.3, '1 tranche', 150, 1, 1, ['vegetarien']],
    ['orange', 'Orange', 'fruits', 47, 0.9, 12, 0.1, '1 orange', 130, 1, 1, ['vegetarien']],
    ['avocat', 'Avocat', 'fruits', 160, 2, 9, 15, '1/2 avocat', 100, 2, 1, ['vegetarien']],
    ['pasteque', 'Pastèque', 'fruits', 30, 0.6, 8, 0.2, '1 tranche', 200, 1, 1, ['vegetarien']],
    ['goyave', 'Goyave', 'fruits', 68, 2.6, 14, 1, '1 goyave', 100, 1, 1, ['vegetarien']],
    // laitiers
    ['lait', 'Lait de vache', 'laitiers', 61, 3.3, 4.8, 3.3, '1 verre', 250, 2, 0, ['laitier', 'vegetarien']],
    ['yaourt', 'Yaourt nature', 'laitiers', 60, 3.8, 4.7, 3, '1 pot', 125, 2, 0, ['laitier', 'vegetarien']],
    ['lait-soja', 'Boisson de soja', 'laitiers', 40, 3.3, 2, 1.8, '1 verre', 250, 2, 1, ['vegetarien']],
    ['fromage', 'Fromage', 'laitiers', 330, 22, 1, 26, '1 morceau', 30, 3, 0, ['laitier', 'vegetarien']],
    // gras
    ['huile-palme', 'Huile de palme rouge', 'gras', 884, 0, 0, 100, '1 cuillère', 10, 1, 1, ['vegetarien']],
    ['huile-arachide', 'Huile d\'arachide', 'gras', 884, 0, 0, 100, '1 cuillère', 10, 1, 1, ['vegetarien', 'arachide']],
    ['beurre-karite', 'Beurre de karité (cuisine)', 'gras', 880, 0, 0, 99, '1 cuillère', 10, 2, 1, ['vegetarien']],
    // autres
    ['miel', 'Miel', 'autres', 304, 0.3, 82, 0, '1 cuillère', 20, 2, 1, ['vegetarien']],
    ['sucre', 'Sucre', 'autres', 400, 0, 100, 0, '1 cuillère', 5, 1, 0, ['vegetarien']],
    ['soda', 'Boisson sucrée (soda)', 'autres', 42, 0, 10.6, 0, '1 verre', 250, 1, 0, ['vegetarien']],
    ['biscuit', 'Biscuit sucré', 'autres', 480, 6, 70, 20, '2 biscuits', 30, 1, 0, ['vegetarien', 'gluten']],
    ['beignet', 'Beignet frit (« doco », « koki » non compris)', 'autres', 330, 6, 40, 16, '1 beignet', 60, 1, 1, ['vegetarien', 'gluten']]
  ];
  NEV.FOOD_CATS = { proteines: 'Protéines', feculents: 'Féculents', legumes: 'Légumes', fruits: 'Fruits', laitiers: 'Laitiers', gras: 'Matières grasses', autres: 'Autres' };
  NEV.FOODS = R.map((r) => ({ id: r[0], name: r[1], cat: r[2], kcal: r[3], p: r[4], g: r[5], l: r[6], portion: { label: r[7], g: r[8] }, prix: r[9], local: !!r[10], tags: r[11] }));
})(window);
