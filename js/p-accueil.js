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
    t += '<h2 class="big" style="font-size:clamp(1.7rem,4vw,2.4rem);margin:8px 0">Une carte t\'attend.</h2><p class="muted">Un seul tirage par jour, totalement aléatoire. Le doigt choisit, la carte décide de ton entraînement.</p>' +
      '<p style="margin:20px 0 0"><a class="btn" href="gacha.html" data-go>Tirer ma carte</a> <a class="btn ghost" href="gacha-box.html" data-go>📦 Ouvrir la Gacha Box</a></p>';
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

  $('tiles').innerHTML =
    '<a class="tile" href="gacha-box.html" data-go>' + I.cube + '<b>Gacha Box</b><span>La boîte 3D : 4 cartes, une séance</span></a>' +
    '<a class="tile" href="quete.html" data-go>' + I.quest + '<b>Quête du jour</b><span>Tes objectifs et ton combo coach</span></a>' +
    '<a class="tile" href="bibliotheque.html" data-go>' + I.book + '<b>Bibliothèque</b><span>Tous les exercices, animés</span></a>' +
    '<a class="tile" href="chat.html" data-go>' + I.chat + '<b>Chat</b><span>Parle au coach et aux joueurs</span></a>' +
    '<a class="tile" href="niveau.html?step=2" data-go><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg><b>Réglages</b><span>Niveau, matériel, séries</span></a>';
})();
