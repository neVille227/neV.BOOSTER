(async function () {
  var $ = function (id) { return document.getElementById(id); };
  var ctx = await NEV.boot('', { needLevel: false, chrome: false, quiet: true }); if (!ctx) return;
  var user = ctx.user, p = ctx.p;
  var cautious = false;

  /* Version femme : on demande le maximum de SQUATS (NEV.squatsToPush les convertit en équivalent interne pour les niveaux). */
  var SQ = p.sex === 'f', MAXV = SQ ? 300 : 200, EQ = 0.36;
  var val = SQ ? (p.maxSquats || 25) : (p.maxPushups || 10);
  if (SQ) {
    document.querySelector('h1.q').innerHTML = 'Ton maximum de <em>squats</em> ?';
    document.querySelector('#s1 .sub').textContent = 'Le plus que tu puisses faire d\'affilée, proprement, sans t\'arrêter. Entre un nombre de 1 à 300.';
    $('maxIn').max = MAXV; $('maxRange').max = MAXV; $('maxIn').value = val; $('maxRange').value = val;
    $('maxIn').setAttribute('aria-label', 'Maximum de squats'); $('maxRange').setAttribute('aria-label', 'Curseur du maximum de squats');
  }
  function level() { return NEV.levelFromMax(SQ ? NEV.squatsToPush(val) : val); }
  function renderLevel() {
    var l = level();
    $('lvN').textContent = l.n; $('lvName').textContent = l.name; $('lvDesc').textContent = NEV.levelRange(l, p.sex) + ' · ' + l.desc;
    $('maxIn').value = val; $('maxRange').value = val;
  }
  function setVal(v) { val = NEV.util.clamp(Math.round(Number(v) || 1), 1, MAXV); renderLevel(); }
  $('minus').onclick = function () { setVal(val - 1); };
  $('plus').onclick = function () { setVal(val + 1); };
  $('maxRange').oninput = function () { setVal(this.value); };
  $('maxIn').oninput = function () { var v = Number(this.value); if (this.value !== '' && v >= 1 && v <= MAXV) { val = Math.round(v); $('maxRange').value = val; var l = level(); $('lvN').textContent = l.n; $('lvName').textContent = l.name; $('lvDesc').textContent = NEV.levelRange(l, p.sex) + ' · ' + l.desc; } };
  $('maxIn').onchange = function () { setVal(this.value); };

  /* Poids du joueur (kg) : sert à adapter les exercices (voir NEV.Ex.weightOk). */
  var WMIN = 30, WMAX = 250, kg = Number(p.weightKg) || 70, skipW = p.weightKg === 0;
  function renderW() {
    $('wOut').textContent = skipW ? '— kg' : kg + ' kg'; $('wRange').value = kg; $('wRange').disabled = skipW; $('wMinus').disabled = $('wPlus').disabled = skipW; $('wSkip').checked = skipW;
    var n = '';
    if (!skipW && kg >= NEV.Ex.HEAVY_KG) n = 'Parcours adapté : aucun saut ni exercice à fort impact, pour ménager tes genoux, ton dos et tes articulations.' + (kg >= 130 ? ' Par prudence, demande l\'avis d\'un médecin avant de commencer et progresse doucement.' : '');
    else if (!skipW) n = 'Parcours standard.';
    $('wNote').textContent = n;
  }
  function setW(v) { kg = NEV.util.clamp(Math.round(Number(v) || 70), WMIN, WMAX); renderW(); }
  $('wMinus').onclick = function () { setW(kg - 1); }; $('wPlus').onclick = function () { setW(kg + 1); };
  $('wRange').oninput = function () { setW(this.value); };
  $('wSkip').onchange = function () { skipW = this.checked; renderW(); };
  renderW();

  function show(n) {
    $('s1').classList.toggle('on', n === 1); $('s2').classList.toggle('on', n === 2);
    $('d2').classList.toggle('on', n === 2);
    if (n === 2) renderProb();
  }
  $('to2').onclick = function () {
    var raw = Number($('maxIn').value);
    if (!Number.isInteger(raw) || raw < 1 || raw > MAXV) { $('err1').textContent = 'Entre un nombre entier de 1 à ' + MAXV + '.'; $('maxIn').focus(); return; }
    $('err1').textContent = ''; val = raw; renderLevel(); show(2);
  };
  $('back1').onclick = function () { show(1); };

  function renderProb() {
    var l = level();
    $('probLvl').textContent = '· niveau ' + l.n + ' « ' + l.name + ' »';
    var w = NEV.Gacha.weights(l.n, cautious, 0).pct;
    $('prob').innerHTML = (SQ ? NEV.Gacha.RARITIES.slice(0, 4) : NEV.Gacha.RARITIES).map(function (r, i) {
      return '<div style="--c:' + r.color + '"><b>' + (w[i] >= 10 ? Math.round(w[i]) : (Math.round(w[i] * 10) / 10)) + ' %</b>' + r.name + '</div>';
    }).join('');
  }

  // valeurs déjà enregistrées (modification)
  renderLevel();
  document.querySelectorAll('[name=focus]').forEach(function (i) { i.checked = i.value === p.setup.focus; });
  document.querySelectorAll('[data-eq]').forEach(function (i) { i.checked = !!p.setup.equip[i.getAttribute('data-eq')]; });
  document.querySelectorAll('[name=sets]').forEach(function (i) { i.checked = Number(i.value) === p.setup.sets; });
  document.querySelectorAll('[name=cam]').forEach(function (i) { i.checked = (i.value === '1') === !!p.setup.camera; });

  $('save').onclick = function () {
    var l = level();
    var equip = {};
    document.querySelectorAll('[data-eq]').forEach(function (i) { equip[i.getAttribute('data-eq')] = i.checked; });
    var focus = document.querySelector('[name=focus]:checked').value;
    var sets = Number(document.querySelector('[name=sets]:checked').value);
    var cam = document.querySelector('[name=cam]:checked').value === '1';
    if (SQ) { p.maxSquats = val; p.maxPushups = NEV.squatsToPush(val); } else p.maxPushups = val;
    p.level = l.n;
    p.weightKg = skipW ? 0 : kg;   // 0 = non communiqué
    p.setup = { focus: focus, sets: sets, camera: cam, equip: equip, zones: (p.setup && p.setup.zones) || [], weightKg: p.weightKg };
    // Si le réglage change après un tirage non commencé, on garde la carte déjà tirée du jour.
    NEV.player.save(p);
    NEV.go('accueil.html');
  };
  var hash = location.search.indexOf('step=2') >= 0; if (hash) show(2);
})();
