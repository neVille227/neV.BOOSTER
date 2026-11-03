(async function () {
  var $ = function (id) { return document.getElementById(id); };
  var esc = NEV.util.esc, I = NEV.ui.icons;
  var ctx = await NEV.boot('accueil'); if (!ctx) return;
  var user = ctx.user, p = ctx.p;
  NEV.player.ensureDay(p); NEV.player.save(p);

  var d = p.daily, lvl = NEV.levelFromMax(p.maxPushups);
  $('date').textContent = NEV.util.frDate(d.date);
  $('hello').innerHTML = 'Salut ' + esc(user.pseudo) + ', prêt à <em>booster</em> ?';

  if (d.double && d.status !== 'done') {
    $('alert').innerHTML = '<div class="banner"><span style="font-size:1.5rem">⚠️</span><div>Tu as raté ' + (d.missed > 1 ? d.missed + ' jours' : 'une journée') + ' : l\'enchaînement d\'aujourd\'hui est <b>doublé (×2)</b>. Respire, hydrate-toi, et fais-le proprement.</div></div>';
  } else if (d.status === 'done') {
    $('alert').innerHTML = '<div class="banner ok"><span style="font-size:1.5rem">✅</span><div>Séance du jour validée. Reviens demain pour une nouvelle carte !</div></div>';
  }

  // carte du jour
  var t = '<div class="eyebrow">Ta carte du jour</div>';
  if (d.status === 'none') {
    t += '<h2 class="big" style="font-size:clamp(1.7rem,4vw,2.4rem);margin:8px 0">Une carte t\'attend.</h2><p class="muted">Un seul tirage par jour, totalement aléatoire. Choisis ton tirage :</p>' +
      '<div class="pickrow"><a class="pk" href="gacha.html?go=1" data-go><div class="pkh">' + I.gacha + '<b>Tirer une carte</b></div><span>1 carte parmi 5, une séance claire.</span><span class="chip red">Tirage du jour</span></a>' +
      '<a class="pk" href="gacha-box.html" data-go><div class="pkh">' + I.cube + '<b>Gacha Box</b></div><span>La boîte 3D : 4 cartes, un combo.</span><span class="chip gold">4 cartes</span></a></div>';
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
      $('qd').innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><h2 id="qdT" style="font-size:1.2rem">Quêtes du jour <span class="muted" style="font-weight:600">· ' + n + '/' + Q.length + '</span></h2><a class="btn ghost sm" href="quete.html" data-go>Tout voir</a></div>' +
        '<div class="bar" style="margin-top:12px"><i style="width:' + Math.round(n / Q.length * 100) + '%"></i></div><ul class="qd">' +
        Q.map(function (q) { return '<li class="' + (done(q) ? 'done' : '') + '"><button type="button" class="ck" data-q="' + q.id + '"' + (q.auto ? ' disabled' : '') + ' aria-pressed="' + done(q) + '" aria-label="' + esc(q.t) + '">' + (done(q) ? '✓' : '') + '</button><div class="t"><b>' + esc(q.t) + '</b><span>' + esc(q.s) + '</span></div></li>'; }).join('') + '</ul>';
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

  // stats
  $('stats').innerHTML = [
    [p.progress.streak, 'Série (jours)'], [p.progress.best, 'Record'], [p.progress.total, 'Séances'], [lvl.name, 'Niveau ' + lvl.n]
  ].map(function (s) { return '<div class="stat"><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div>'; }).join('');

})();
