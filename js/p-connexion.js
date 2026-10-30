NEV.ready(function (mode) {
  var $ = function (id) { return document.getElementById(id); };
  NEV.cloud.sync().then(function (user) {
    if (user) { var p = NEV.player.load(); NEV.go(p.maxPushups ? 'accueil.html' : 'niveau.html', 0); }
  });
  $('storeNote').textContent = mode === 'server'
    ? 'Connexion sécurisée : ton mot de passe n\'est jamais conservé en clair.'
    : (NEV.store.persistent ? 'Mode démo : ton compte est enregistré sur cet appareil.' : 'Attention : ce navigateur bloque le stockage, ton compte ne sera pas conservé.');
  var qs = new URLSearchParams(location.search), refQ = (qs.get('ref') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  if (refQ) { $('suRef').value = refQ; }

  function tab(which) {
    var su = which === 'signup';
    $('formSignup').hidden = !su; $('formLogin').hidden = su;
    $('tabSignup').classList.toggle('on', su); $('tabLogin').classList.toggle('on', !su);
    $('tabSignup').setAttribute('aria-selected', su); $('tabLogin').setAttribute('aria-selected', !su);
  }
  $('tabSignup').onclick = function () { tab('signup'); };
  $('tabLogin').onclick = function () { tab('login'); };

  var FIELDS = { pseudo: 'suPseudo', email: 'suEmail', password: 'suPw', password2: 'suPw2', ref: 'suRef', sex: 'suSexM', consent: 'suConsent', terms: 'suTerms' };
  function mark(map, field) {
    Object.keys(map).forEach(function (k) { var el = $(map[k]); var f = el.closest('.field'); if (f) f.classList.toggle('bad', k === field); });
  }
  function done(u) {
    var p = NEV.player.load(u.id);
    NEV.go(p.maxPushups ? 'accueil.html' : 'niveau.html');
  }

  $('formSignup').addEventListener('submit', function (e) {
    e.preventDefault();
    $('errSignup').textContent = '';
    $('btnSignup').disabled = true;
    NEV.auth.signup({
      pseudo: $('suPseudo').value, email: $('suEmail').value,
      password: $('suPw').value, password2: $('suPw2').value, consent: $('suConsent').checked, terms: $('suTerms').checked, ref: $('suRef').value, sex: (document.querySelector('input[name=sex]:checked') || {}).value || ''
    }).then(function (r) {
      $('btnSignup').disabled = false;
      if (!r.ok) { $('errSignup').textContent = r.error; mark(FIELDS, r.field); var el = $(FIELDS[r.field]); if (el) el.focus(); return; }
      mark(FIELDS, null);
      done(r.user);
    });
  });
  var LF = { email: 'liEmail', password: 'liPw' };
  $('formLogin').addEventListener('submit', function (e) {
    e.preventDefault();
    $('errLogin').textContent = '';
    $('btnLogin').disabled = true;
    NEV.auth.login($('liEmail').value, $('liPw').value).then(function (r) {
      $('btnLogin').disabled = false;
      if (!r.ok) { $('errLogin').textContent = r.error; mark(LF, r.field); return; }
      mark(LF, null);
      done(r.user);
    });
  });
});
