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

  var FIELDS = { email: 'suEmail', ref: 'suRef', sex: 'suSexM', terms: 'suTerms', parent: 'suParent' };
  $('suMinor').addEventListener('change', function () { $('suParentRow').hidden = !$('suMinor').checked; if (!$('suMinor').checked) $('suParent').checked = false; });
  function mark(map, field) {
    Object.keys(map).forEach(function (k) { var el = $(map[k]); var f = el.closest('.field'); if (f) f.classList.toggle('bad', k === field); });
  }
  function done(u) {
    try { if (u && u.email) localStorage.setItem('nev.lastEmail', String(u.email).toLowerCase()); } catch (er) { /* ignoré */ }
    var p = NEV.player.load(u.id);
    NEV.go(dest(p));
  }

  $('formSignup').addEventListener('submit', function (e) {
    e.preventDefault();
    $('errSignup').textContent = '';
    $('btnSignup').disabled = true;
    NEV.auth.signup({
      quick: true, email: $('suEmail').value, terms: $('suTerms').checked, minor: $('suMinor').checked, parent: $('suParent').checked, ref: $('suRef').value, sex: (document.querySelector('input[name=sex]:checked') || {}).value || ''
    }).then(function (r) {
      $('btnSignup').disabled = false;
      if (!r.ok) { $('errSignup').textContent = r.error; mark(FIELDS, r.field); var el = $(FIELDS[r.field] || 'suEmail'); if (el) el.focus(); return; }
      mark(FIELDS, null);
      done(r.user);
    });
  });
  var LF = { email: 'liEmail', password: 'liPw', code: 'liCode' };
  var server = mode === 'server', usePw = false, codeSent = false;
  var linkMode = false;
  function loginUi() {
    $('pwBox').hidden = !usePw; $('codeBox').hidden = usePw || !codeSent;
    $('usePw').textContent = usePw ? 'Revenir à la connexion par e-mail' : 'J\'ai un mot de passe';
    $('useLink').hidden = usePw;
    $('liCode').maxLength = linkMode ? 8 : 8; $('liCode').placeholder = linkMode ? '8 chiffres' : '6 chiffres';
    document.querySelector('label[for=liCode]').textContent = linkMode ? 'Code de ton autre appareil' : 'Code reçu par e-mail';
    $('btnLogin').textContent = usePw ? 'Me connecter' : (codeSent ? 'Valider le code' : 'Me connecter');
  }
  $('useLink').addEventListener('click', function (e) { e.preventDefault(); linkMode = true; codeSent = true; usePw = false; $('errLogin').textContent = ''; $('codeHint').textContent = 'Sur ton autre appareil déjà connecté : Mon compte, puis « Connecter un autre appareil ». Tape ici le code de 8 chiffres (valable 5 minutes).'; loginUi(); $('liCode').focus(); });
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
      /* 1) appareil déjà reconnu : l'e-mail suffit  2) sinon, un code par e-mail (ou celui d'un autre appareil) */
      NEV.auth.device(email).then(function (d) {
        if (d.ok) { try { localStorage.setItem('nev.lastEmail', String(email).trim().toLowerCase()); } catch (er) { /* ignoré */ } $('btnLogin').disabled = false; mark(LF, null); return done(d.user); }
        NEV.auth.code(email).then(function (r) {
          if (!r.ok) { $('btnLogin').disabled = false; $('errLogin').textContent = r.error + ' Tu peux aussi utiliser le code d\'un autre appareil déjà connecté.'; mark(LF, r.field); return; }
          $('btnLogin').disabled = false; mark(LF, null); codeSent = true; linkMode = false; loginUi();
          $('codeHint').textContent = 'Nouvel appareil : si un compte existe avec cet e-mail, un code à 6 chiffres vient d\'être envoyé (valable 10 min).';
          $('liCode').focus();
        });
      });
    } else {
      (linkMode ? NEV.auth.link(email, $('liCode').value) : NEV.auth.verify(email, $('liCode').value)).then(function (r) {
        if (!r.ok) return fail(r);
        $('btnLogin').disabled = false; mark(LF, null); done(r.user);
      });
    }
  });
  try { var le = localStorage.getItem('nev.lastEmail'); if (le && !$('liEmail').value) $('liEmail').value = le; } catch (er) { /* ignoré */ }
  $('liEmail').addEventListener('input', function () { if (codeSent && !linkMode) { codeSent = false; $('liCode').value = ''; loginUi(); } });
});
