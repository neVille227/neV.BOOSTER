(async function () {
  var $ = function (id) { return document.getElementById(id); };
  var ctx = await NEV.boot('', { needLevel: false, chrome: false, quiet: true }); if (!ctx) return;
  var user = ctx.user, p = ctx.p;
  var cautious = false;

  var val = p.maxPushups || 10;
  function level() { return NEV.levelFromMax(val); }
  function renderLevel() {
    var l = level();
    $('lvN').textContent = l.n; $('lvName').textContent = l.name; $('lvDesc').textContent = l.range + ' · ' + l.desc;
    $('maxIn').value = val; $('maxRange').value = val;
  }
  function setVal(v) { val = NEV.util.clamp(Math.round(Number(v) || 1), 1, 200); renderLevel(); }
  $('minus').onclick = function () { setVal(val - 1); };
  $('plus').onclick = function () { setVal(val + 1); };
  $('maxRange').oninput = function () { setVal(this.value); };
  $('maxIn').oninput = function () { var v = Number(this.value); if (this.value !== '' && v >= 1 && v <= 200) { val = Math.round(v); $('maxRange').value = val; var l = level(); $('lvN').textContent = l.n; $('lvName').textContent = l.name; $('lvDesc').textContent = l.range + ' · ' + l.desc; } };
  $('maxIn').onchange = function () { setVal(this.value); };

  function show(n) {
    $('s1').classList.toggle('on', n === 1); $('s2').classList.toggle('on', n === 2);
    $('d2').classList.toggle('on', n === 2);
    if (n === 2) renderProb();
  }
  $('to2').onclick = function () {
    var raw = Number($('maxIn').value);
    if (!Number.isInteger(raw) || raw < 1 || raw > 200) { $('err1').textContent = 'Entre un nombre entier de 1 à 200.'; $('maxIn').focus(); return; }
    $('err1').textContent = ''; val = raw; renderLevel(); show(2);
  };
  $('back1').onclick = function () { show(1); };

  function renderProb() {
    var l = level();
    $('probLvl').textContent = '· niveau ' + l.n + ' « ' + l.name + ' »';
    var w = NEV.Gacha.weights(l.n, cautious, 0).pct;
    $('prob').innerHTML = NEV.Gacha.RARITIES.map(function (r, i) {
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
    p.maxPushups = val; p.level = l.n;
    p.setup = { focus: focus, sets: sets, camera: cam, equip: equip, zones: (p.setup && p.setup.zones) || [] };
    // Si le réglage change après un tirage non commencé, on garde la carte déjà tirée du jour.
    NEV.player.save(p);
    NEV.go('accueil.html');
  };
  var hash = location.search.indexOf('step=2') >= 0; if (hash) show(2);
})();
