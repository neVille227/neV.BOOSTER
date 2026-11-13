/* neV.BOOSTER — Visite guidée (mode visiteur) : tout est en mémoire, rien n'est enregistré, aucun suivi personnel. */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc;
  await NEV.cloud.ready;
  NEV.track = function () { /* visiteur : aucun suivi d'activité */ };
  const qs = new URLSearchParams(location.search);
  const SEX = qs.get('visiteur') === 'f' ? 'f' : 'm';
  const SIGN = 'connexion.html?sex=' + SEX;
  ['signup', 'login'].forEach((id) => { $(id).href = id === 'signup' ? SIGN : 'connexion.html'; });
  document.querySelector('.vh-cta').href = SIGN; $('gdLock').href = SIGN;
  $('vLogo').src = SEX === 'f' ? 'img/logo-nvb-f.webp' : 'img/logo-nvb-m.webp';
  $('heroImg').src = SEX === 'f' ? 'img/avatar-f.webp' : 'img/avatar-m.webp';
  Array.prototype.forEach.call(document.querySelectorAll('.pc-c'), (b) => b.setAttribute('aria-pressed', b.dataset.sex === SEX ? 'true' : 'false'));

  const ALL = NEV.Ex.list().filter((e) => NEV.Ex.sexOk(e, SEX));
  const STEPS = [['accueil', 'Accueil'], ['plateforme', 'Plateforme'], ['exercices', 'Exercices'], ['gacha', 'Gacha'], ['parcours', 'Parcours'], ['niveaux', 'Niveaux'], ['inscription', 'Inscription']];
  $('vNav').innerHTML = STEPS.map((s, i) => '<a href="#' + s[0] + '" data-s="' + s[0] + '"><b>' + (i + 1) + '</b><span>' + s[1] + '</span></a>').join('');

  /* ---- 1. chiffres clés ---- */
  $('kpis').innerHTML = [[ALL.length, 'exercices'], [NEV.CATS.length, 'catégories'], [5, 'raretés de cartes'], [2, 'parcours'], [7, 'langues']]
    .map((k) => '<li><b>' + k[0] + '</b><span>' + k[1] + '</span></li>').join('');

  /* ---- 2. fonctionnalités ---- */
  const IC = {
    gacha: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M12 8l1.6 3.2 3.4.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4L7 11.7l3.4-.5z"/>',
    book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    body: '<circle cx="12" cy="5" r="2.5"/><path d="M5 10l7 2 7-2M12 12v5l-3 5M12 17l3 5"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9h18M12 9v11M12 9c-3 0-4-4-1-4 2 0 1 4 1 4zM12 9c3 0 4-4 1-4-2 0-1 4-1 4z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>'
  };
  const FEATS = [
    ['gacha', 'Gacha quotidien', 'Une carte par jour avec ton exercice, sa rareté et sa série à faire.', 'Démo libre', 'gacha'],
    ['book', 'Bibliothèque animée', 'Tous les exercices en cartes, avec animation, muscles ciblés et difficulté.', 'Découverte libre', 'exercices'],
    ['cam', 'Caméra intelligente', 'La caméra compte tes répétitions pendant que tu t\'entraînes.', 'Avec un compte', ''],
    ['list', 'Programmes et quête', 'Des enchaînements prêts à faire et les objectifs du jour.', 'Avec un compte', ''],
    ['body', 'Spécialisation', 'Cible une zone du corps pour concentrer tes tirages.', 'Avec un compte', ''],
    ['trophy', 'Défis et classement', 'Pompes, squats, gainage : un score, un classement public et entre amis.', 'Avec un compte', ''],
    ['gift', 'Récompenses et évolution', 'Flammes, badges, parrainage et un avatar qui évolue avec ton XP.', 'Avec un compte', ''],
    ['chat', 'Coachs et communauté', 'Chat, amis par code et salon des coachs.', 'Avec un compte', '']
  ];
  $('feat').innerHTML = FEATS.map((f) => '<article class="fc' + (f[4] ? ' open' : '') + '"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[f[0]] + '</svg><h3>' + esc(f[1]) + '</h3><p>' + esc(f[2]) + '</p>' +
    (f[4] ? '<a class="tag ok" href="#' + f[4] + '">' + esc(f[3]) + ' →</a>' : '<span class="tag"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>' + esc(f[3]) + '</span>') + '</article>').join('');

  /* ---- 3. exercices : catégories et groupes musculaires, cartes à regarder ---- */
  $('exLead').textContent = ALL.length + ' exercices répartis en ' + NEV.CATS.length + ' catégories. Filtre par catégorie ou par muscle pour voir à quoi ressemblent les cartes.';
  let cat = '', mus = '', shown = 6, view = [];
  const MUS = Object.keys(NEV.MUSCLES_FR).map((m) => [m, ALL.filter((e) => (e.muscles || []).indexOf(m) >= 0).length]).filter((x) => x[1] > 0);
  function chips() {
    $('exCats').innerHTML = '<button type="button" class="fchip' + (!cat ? ' on' : '') + '" data-c="">Toutes<small>' + ALL.length + '</small></button>' +
      NEV.CATS.map((c) => '<button type="button" class="fchip' + (cat === c.id ? ' on' : '') + '" data-c="' + c.id + '">' + esc(c.short) + '<small>' + ALL.filter((e) => e.group === c.id).length + '</small></button>').join('');
    $('exMus').innerHTML = '<button type="button" class="fchip' + (!mus ? ' on' : '') + '" data-m="">Tous les muscles</button>' +
      MUS.map((m) => '<button type="button" class="fchip' + (mus === m[0] ? ' on' : '') + '" data-m="' + m[0] + '">' + esc(NEV.MUSCLES_FR[m[0]]) + '<small>' + m[1] + '</small></button>').join('');
  }
  function renderEx() {
    view = ALL.filter((e) => (!cat || e.group === cat) && (!mus || (e.muscles || []).indexOf(mus) >= 0));
    const g = $('exGrid');
    g.innerHTML = view.slice(0, shown).map((e, i) => '<div class="xcard vx" tabindex="0" role="button" aria-label="' + esc(e.name) + ' — exécution réservée aux comptes" style="animation-delay:' + Math.min(i, 11) * 35 + 'ms">' + NEV.Card.front(e, {}) + '</div>').join('');
    NEV.Card.mountArt(g);
    g.querySelectorAll('.xcard').forEach((el) => NEV.Card.tilt(el, 8));
    $('exCount').textContent = view.length + ' exercice' + (view.length > 1 ? 's' : '') + ' correspondent' + (view.length > shown ? ' · ' + shown + ' affichés' : '');
    $('exMore').hidden = view.length <= shown;
  }
  $('exCats').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) { cat = b.dataset.c; shown = 6; chips(); renderEx(); } });
  $('exMus').addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b) { mus = b.dataset.m; shown = 6; chips(); renderEx(); } });
  $('exMore').addEventListener('click', () => { shown += 6; renderEx(); });
  $('exGrid').addEventListener('click', (e) => { if (e.target.closest('.vx')) { const n = $('exNote'); n.classList.remove('pulse'); void n.offsetWidth; n.classList.add('pulse'); } });
  chips(); renderEx();

  /* ---- 4. démo du gacha (mémoire seulement) ---- */
  const LV = { easy: { n: 1, label: 'Facile', max: 4 }, mid: { n: 3, label: 'Moyen', max: 22 }, hard: { n: 5, label: 'Difficile', max: 60 } };
  let lvKey = 'easy', busy = false;
  const demoP = () => Object.assign(NEV.player.blank(), { sex: SEX, level: LV[lvKey].n, maxPushups: LV[lvKey].max, history: hist });
  const hist = [];
  const oddsHtml = (n) => {
    const w = NEV.Gacha.weights(n, false, 0).pct;
    return NEV.Gacha.RARITIES.map((r, i) => '<li style="--c:' + r.color + '"><span>' + esc(r.name) + '</span><i><u style="width:' + Math.max(w[i], 1.5).toFixed(1) + '%"></u></i><b>' + (w[i] < 1 ? w[i].toFixed(1) : Math.round(w[i] * 10) / 10) + ' %</b></li>').join('');
  };
  function gdUi() {
    $('gdLvl').innerHTML = Object.keys(LV).map((k) => '<button type="button" class="' + (k === lvKey ? 'on' : '') + '" data-k="' + k + '">' + LV[k].label + '</button>').join('');
    $('gdLvlName').textContent = '· niveau ' + LV[lvKey].label.toLowerCase();
    $('gdOdds').innerHTML = oddsHtml(LV[lvKey].n);
  }
  $('gdLvl').addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { lvKey = b.dataset.k; gdUi(); lvUi(); } });
  function drawCard() {
    if (busy) return; busy = true;
    const c = NEV.Gacha.draw(demoP(), null, { mode: 'daily', noSpecial: true }), ex = NEV.Ex.byId(c.id);
    hist.unshift({ id: c.id });
    const stage = $('gdStage'), card = $('gdCard');
    stage.classList.add('flip');
    setTimeout(() => {
      card.innerHTML = NEV.Card.front(ex, {}); card.hidden = false; $('gdBtn').hidden = true;
      NEV.Card.mountArt(card); NEV.Card.tilt(card, 10);
      card.className = 'gd-card in r-' + NEV.Card.rarityOf(ex).id;
      stage.classList.remove('flip'); $('gdAgain').hidden = false; busy = false;
      $('gdInfo').textContent = 'Tu as tiré « ' + ex.name + ' » (' + NEV.Card.rarityOf(ex).name + '). Avec un compte, tu pourrais lancer cet exercice, compter tes répétitions et gagner des flammes.';
    }, 650);
  }
  $('gdBtn').addEventListener('click', drawCard);
  $('gdAgain').addEventListener('click', () => { $('gdCard').hidden = true; $('gdCard').innerHTML = ''; $('gdBtn').hidden = false; $('gdAgain').hidden = true; drawCard(); });
  gdUi();

  /* ---- 5. parcours : recharge la page dans le thème choisi (rien n'est enregistré) ---- */
  Array.prototype.forEach.call(document.querySelectorAll('.pc-c'), (b) => b.addEventListener('click', () => {
    if (b.dataset.sex !== SEX) location.replace('visite.html?visiteur=' + b.dataset.sex + '#parcours');
  }));

  /* ---- 6. niveaux ---- */
  const TIERS = { easy: [1, 2], mid: [3], hard: [4, 5] };
  const LVTXT = {
    easy: ['Éveil · Initié', SEX === 'f' ? 'Jusqu\'à 40 squats d\'affilée' : 'Jusqu\'à 15 pompes d\'affilée', 'On pose les bases, en douceur : mouvements simples, séries courtes, récupération généreuse.'],
    mid: ['Combattant', SEX === 'f' ? '41 à 80 squats d\'affilée' : '16 à 30 pompes d\'affilée', 'Tu tiens le rythme : l\'intensité monte et les cartes rares deviennent plus fréquentes.'],
    hard: ['Guerrier · Légende', SEX === 'f' ? 'Plus de 80 squats d\'affilée' : 'Plus de 30 pompes d\'affilée', 'Du volume, de la technique, du caractère : exercices exigeants' + (SEX === 'f' ? ' et cartes plus rares.' : ' et cartes mythiques à portée de main.')]
  };
  function lvUi() {
    $('lvGrid').innerHTML = Object.keys(LV).map((k) => {
      const pool = ALL.filter((e) => TIERS[k].indexOf(e.tier) >= 0), pick = [];
      for (let i = 0; i < 3 && pool.length; i++) pick.push(pool[Math.floor((i + 0.5) * pool.length / 3)]);
      return '<article class="lc' + (k === lvKey ? ' on' : '') + '" data-k="' + k + '"><header><span class="lv-n">' + LV[k].label + '</span><h3>' + esc(LVTXT[k][0]) + '</h3><b>' + esc(LVTXT[k][1]) + '</b></header><p>' + esc(LVTXT[k][2]) + '</p>' +
        '<ul class="odds mini">' + oddsHtml(LV[k].n) + '</ul><div class="lc-cards">' + pick.map((e) => '<div class="xcard vx">' + NEV.Card.front(e, { noArt: true }) + '</div>').join('') + '</div></article>';
    }).join('');
  }
  lvUi();

  /* ---- navigation : étape active et progression ---- */
  const secs = Array.prototype.slice.call(document.querySelectorAll('.vs')), links = {};
  Array.prototype.forEach.call($('vNav').querySelectorAll('a'), (a) => { links[a.dataset.s] = a; });
  function spy() {
    const y = window.scrollY + window.innerHeight * 0.3; let cur = secs[0].id;
    secs.forEach((s) => { if (s.offsetTop <= y) cur = s.id; });
    Object.keys(links).forEach((k) => links[k].classList.toggle('on', k === cur));
    const h = document.documentElement.scrollHeight - window.innerHeight;
    $('vBar').style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + '%';
  }
  window.addEventListener('scroll', spy, { passive: true }); spy();
  if (location.hash) setTimeout(() => { const t = document.querySelector(location.hash); if (t) t.scrollIntoView(); }, 300);
})();
