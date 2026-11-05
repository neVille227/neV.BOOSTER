NEV.ready(function (mode) {
  var $ = function (id) { return document.getElementById(id); };
  /* Parcours féminin : première connexion → animation féminine directe (sans l'intro homme) ; ensuite → le même site, thème clair. */
  function dest(p) {
    if (NEV.setSex && p && p.sex) NEV.setSex(p.sex);
    if (p && p.sex === 'f') {
      var first = true;
      try { first = localStorage.getItem('nvbf.intro') !== '1'; localStorage.setItem('nvbf.intro', '1'); } catch (e) {}
      return first && !(p.maxPushups) ? 'femme/intro.html' : (p.maxPushups ? 'accueil.html' : 'niveau.html');
    }
    return p && p.maxPushups ? 'accueil.html' : 'niveau.html';
  }
  NEV.cloud.sync().then(function (user) {
    if (user) { var p = NEV.player.load(); NEV.go(dest(p), 0); }
  });
  $('storeNote').textContent = mode === 'server'
    ? 'Connexion sécurisée : ton mot de passe n\'est jamais conservé en clair.'
    : (NEV.store.persistent ? 'Mode démo : ton compte est enregistré sur cet appareil.' : 'Attention : ce navigateur bloque le stockage, ton compte ne sera pas conservé.');
  var qs = new URLSearchParams(location.search), refQ = (qs.get('ref') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  if (refQ && $('suRef')) { $('suRef').value = refQ; }

  function tab(which) {
    var su = which === 'signup';
    $('formSignup').hidden = !su; $('formLogin').hidden = su;
    $('tabSignup').classList.toggle('on', su); $('tabLogin').classList.toggle('on', !su);
    $('tabSignup').setAttribute('aria-selected', su); $('tabLogin').setAttribute('aria-selected', !su);
  }
  /* logo : mi-sombre mi-clair tant que rien n'est choisi, sombre pour un compte masculin, clair pour un compte féminin */
  var logoEl = $('mark'), LOGO = { m: 'img/logo-nvb-m.webp', f: 'img/logo-nvb-f.webp' };
  function setLogo(sex) {
    if (!logoEl) return; var src = LOGO[sex] || 'img/logo-nvb.webp';
    if (logoEl.getAttribute('src') === src) return;
    logoEl.classList.add('swap');
    setTimeout(function () { logoEl.setAttribute('src', src); logoEl.classList.remove('swap'); }, 230);
  }
  function pickSex(v) { var r = v === 'f' ? $('suSexF') : $('suSexM'); if (r) r.checked = true; if (NEV.previewSex) NEV.previewSex(v); setLogo(v); }
  Array.prototype.forEach.call(document.querySelectorAll('input[name=sex]'), function (r) { r.addEventListener('change', function () { pickSex(r.value); }); });
  var sexQ = qs.get('sex'); if (sexQ === 'm' || sexQ === 'f') pickSex(sexQ);
  $('tabSignup').onclick = function () { tab('signup'); };
  $('tabLogin').onclick = function () { tab('login'); };

  var FIELDS = { email: 'suEmail', ref: 'suRef', sex: 'suSexM', terms: 'suTerms' };
  function mark(map, field) {
    Object.keys(map).forEach(function (k) { var el = $(map[k]); var f = el.closest('.field'); if (f) f.classList.toggle('bad', k === field); });
  }
  function done(u) {
    var p = NEV.player.load(u.id);
    NEV.go(dest(p));
  }

  $('formSignup').addEventListener('submit', function (e) {
    e.preventDefault();
    $('errSignup').textContent = '';
    $('btnSignup').disabled = true;
    NEV.auth.signup({
      quick: true, email: $('suEmail').value, terms: $('suTerms').checked, ref: $('suRef').value, sex: (document.querySelector('input[name=sex]:checked') || {}).value || ''
    }).then(function (r) {
      $('btnSignup').disabled = false;
      if (!r.ok) { $('errSignup').textContent = r.error; mark(FIELDS, r.field); var el = $(FIELDS[r.field] || 'suEmail'); if (el) el.focus(); return; }
      mark(FIELDS, null);
      done(r.user);
    });
  });
  var LF = { email: 'liEmail', password: 'liPw', code: 'liCode' };
  var server = mode === 'server', usePw = false, codeSent = false;
  function loginUi() {
    $('pwBox').hidden = !usePw; $('codeBox').hidden = usePw || !codeSent;
    $('usePw').textContent = usePw ? 'Recevoir un code par email' : 'J\'ai un mot de passe';
    $('btnLogin').textContent = usePw ? 'Me connecter' : (codeSent ? 'Valider le code' : (server ? 'Recevoir mon code' : 'Me connecter'));
  }
  $('usePw').addEventListener('click', function (e) { e.preventDefault(); usePw = !usePw; $('errLogin').textContent = ''; loginUi(); });
  loginUi();
  function fail(r) { $('btnLogin').disabled = false; $('errLogin').textContent = r.error; mark(LF, r.field); }
  $('formLogin').addEventListener('submit', function (e) {
    e.preventDefault();
    $('errLogin').textContent = '';
    $('btnLogin').disabled = true;
    var email = $('liEmail').value;
    if (usePw || !server) {
      NEV.auth.login(email, usePw ? $('liPw').value : '').then(function (r) {
        if (!r.ok) return fail(r);
        $('btnLogin').disabled = false; mark(LF, null); done(r.user);
      });
    } else if (!codeSent) {
      NEV.auth.code(email).then(function (r) {
        if (!r.ok) return fail(r);
        $('btnLogin').disabled = false; mark(LF, null); codeSent = true; loginUi();
        $('codeHint').textContent = 'Si un compte existe avec cet email, un code à 6 chiffres vient d\'être envoyé (valable 10 min).';
        $('liCode').focus();
      });
    } else {
      NEV.auth.verify(email, $('liCode').value).then(function (r) {
        if (!r.ok) return fail(r);
        $('btnLogin').disabled = false; mark(LF, null); done(r.user);
      });
    }
  });
  $('liEmail').addEventListener('input', function () { if (codeSent) { codeSent = false; $('liCode').value = ''; loginUi(); } });
});
