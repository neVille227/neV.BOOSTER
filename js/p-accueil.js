(async function () {
  var $ = function (id) { return document.getElementById(id); };
  var esc = NEV.util.esc, I = NEV.ui.icons;
  var ctx = await NEV.boot('accueil'); if (!ctx) return;
  var user = ctx.user, p = ctx.p;
  NEV.player.ensureDay(p); NEV.player.save(p);

  var d = p.daily, lvl = NEV.levelFromMax(p.maxPushups);
  $('date').textContent = NEV.util.frDate(d.date);
  $('hello').innerHTML = 'Salut ' + esc(user.pseudo) + ', prêt à <em>booster</em> ?';

  $('pFl').textContent = 'Flammes · ' + (p.flames || 0);
  $('pXp').textContent = 'XP · ' + p.progress.xp;
  var al = $('alert');
  if (d.double && d.status !== 'done') {
    al.innerHTML = '<b>Enchaînement ×' + 2 + '</b>Tu as raté ' + (d.missed > 1 ? d.missed + ' jours' : 'une journée') + '. Respire, hydrate-toi, et fais-le proprement : la séance d\'aujourd\'hui est doublée.';
  } else if (d.status === 'done') {
    al.className = 'chain ok c-chain'; al.innerHTML = '<b>Séance validée</b>Bravo ! Reviens demain pour une nouvelle carte.';
  } else {
    al.innerHTML = '<b>Série en cours</b>' + (p.progress.streak ? p.progress.streak + ' jour' + (p.progress.streak > 1 ? 's' : '') + ' d\'affilée. Continue !' : 'Lance ta première séance pour démarrer une série.');
  }
  var an = NEV.cfg && NEV.cfg.announce; if (an && an.text) $('coachT').textContent = an.text;

  // carte du jour
  var t = '<div class="eyebrow">Ta carte du jour</div>';
  if (d.status === 'none') {
    t += '<h2 style="margin:8px 0">Une carte t\'attend.</h2><p class="muted">Un seul tirage par jour, totalement aléatoire.</p>' +
      '<div class="acts"><a class="b1" href="gacha.html" data-go>Tirage simple</a><a class="b2" href="gacha.html?mode=multi" data-go>Tirage multiple · 4 cartes</a></div>';
  } else {
    var r = NEV.Gacha.rarity(d.card.rarity);
    var pl = d.card.plan;
    var amount = NEV.Ex.amountText(pl.unit, pl.perSet);
    t += '<div class="miniCard" style="--c:' + r.color + ';--c2:' + r.color2 + ';--g:' + r.glow + '66"><div class="tier">' + r.code + '</div><div><b>' + esc(d.card.name) + '</b><span>' + r.name + ' · ' + pl.sets + ' séries de ' + amount + (pl.doubled ? ' (×2)' : '') + '</span></div></div>';
    if (d.status === 'done') {
      t += '<p class="muted">Validée' + (d.result && !d.result.verified ? ' sans caméra' : ' par la caméra') + ' · +' + (d.result ? d.result.xpGain : 0) + ' XP</p><p style="margin:14px 0 0"><a class="btn ghost" href="quete.html" data-go>Voir la quête du jour</a></p>';
    } else {
      t += '<p style="margin:14px 0 0"><a class="btn ok" href="exercice.html" data-go>Lancer l\'exercice</a></p>';
    }
  }
  $('today').innerHTML = t;

  // quêtes du jour (mêmes données que la page Quête)
  (function () {
    var today = NEV.util.todayStr(), qk = 'nev.q.' + user.id + '.' + today, qs = NEV.store.get(qk, {});
    var ws = NEV.store.get('nev.water.' + today, { n: 0, goal: 8 });
    var POOL = [['Étirements', '5 minutes, en douceur.'], ['Protéines à chaque repas', 'Œuf, poisson, haricots…'], ['Dormir avant 22 h', 'Prépare ta soirée.'], ['Marcher 10 minutes', 'Dehors si possible.'], ['Posture', 'Dos droit, épaules relâchées.'], ['Respirer 2 minutes', 'Lentement, par le nez.']];
    var seed = 2166136261, k = user.id + today; for (var i = 0; i < k.length; i++) { seed ^= k.charCodeAt(i); seed = Math.imul(seed, 16777619); } var pm = POOL[Math.abs(seed) % POOL.length];
    var Q = [
      { id: 'card', t: 'Valider la carte du jour', s: p.daily.status === 'done' ? 'Bravo !' : 'Un seul tirage par jour.', auto: p.daily.status === 'done' },
      { id: 'water', t: 'Boire ' + ws.goal + ' verres d\'eau', s: ws.n + ' / ' + ws.goal + ' verres', auto: ws.n >= ws.goal },
      { id: 'warm', t: 'T\'échauffer 3 minutes', s: 'Épaules, poignets, hanches.', auto: false },
      { id: 'extra', t: pm[0], s: pm[1], auto: false }
    ];
    var done = function (q) { return q.auto || !!qs[q.id]; };
    function draw() {
      var n = Q.filter(done).length;
      $('qd').innerHTML = '<div class="hd"><h2 id="qdT">Quêtes du jour</h2><span class="muted" style="font-weight:800">' + n + '/' + Q.length + '</span></div>' +
        '<div class="bar"><i style="width:' + Math.round(n / Q.length * 100) + '%"></i></div><ul class="qd">' +
        Q.map(function (q) { return '<li class="' + (done(q) ? 'done' : '') + '"><button type="button" class="ck" data-q="' + q.id + '"' + (q.auto ? ' disabled' : '') + ' aria-pressed="' + done(q) + '" aria-label="' + esc(q.t) + '">' + (done(q) ? '✓' : '') + '</button><b>' + esc(q.t) + '</b></li>'; }).join('') + '</ul><p style="margin:14px 0 0"><a class="more" href="quete.html" data-go style="color:var(--red);font-weight:800;font-size:.85rem;text-decoration:none">Tout voir</a></p>';
    }
    $('qd').addEventListener('click', function (e) { var b = e.target.closest('.ck[data-q]'); if (b && !b.disabled) { qs[b.dataset.q] = !qs[b.dataset.q]; NEV.store.set(qk, qs); draw(); } });
    draw();
  })();

  // héros
  var h = NEV.heroFromXp(p.progress.xp);
  $('heroName').textContent = h.stage.name + ' · niveau ' + h.stage.n;
  $('heroBar').style.width = Math.round(h.pct * 100) + '%';
  $('heroXp').textContent = h.next ? p.progress.xp + ' / ' + h.next.xp + ' XP avant « ' + h.next.name + ' »' : p.progress.xp + ' XP · palier maximum';
  if (NEV.Hero) NEV.Hero.mount($('hero'), { stage: h.stage.n, aura: p.aura });

  // messages récents (serveur seulement)
  (async function () {
    var box = $('rec'); if (!box) return;
    var list = [];
    if (NEV.cloud && NEV.cloud.mode === 'server') {
      try { var r = await fetch('api/social/conversations', { credentials: 'same-origin', cache: 'no-store', headers: { 'X-NEV': '1' } }); if (r.ok) list = (await r.json()).conversations || []; } catch (e) { /* hors ligne */ }
    }
    box.innerHTML = '<div class="hd"><h2>Messages récents</h2></div>' + (list.length ? '<ul class="rl">' + list.slice(0, 3).map(function (c) { return '<li><a href="social.html#/messages/' + encodeURIComponent(c.handle) + '" data-go><span class="ini">' + esc(c.handle.slice(0, 1).toUpperCase()) + '</span><div class="t"><b>@' + esc(c.handle) + '</b><span>' + esc(c.text) + '</span></div></a></li>'; }).join('') + '</ul>' : '<p class="muted" style="margin:0">Aucun message pour le moment.</p>') +
      '<p style="margin:14px 0 0"><a href="social.html" data-go style="color:var(--red);font-weight:800;font-size:.85rem;text-decoration:none">Ouvrir la communauté</a></p>';
  })();

})();
