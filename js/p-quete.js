/* neV.BOOSTER — Quête du jour : objectifs, combo suggéré, calendrier, chiffres, prochains badges */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, U = NEV.util;
  const ctx = await NEV.boot('quete'); if (!ctx) return;
  const user = ctx.user, p = ctx.p;
  NEV.player.ensureDay(p); NEV.player.save(p);
  const today = U.todayStr();
  $('date').textContent = U.frDate(today);

  const seed = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); };
  const sd = seed(user.id + today);

  /* ---------- objectifs du jour ---------- */
  const POOL = [['Étirements', '5 minutes, en douceur.'], ['Protéines à chaque repas', 'Œuf, poisson, haricots, arachide…'], ['Dormir avant 22 h', 'Prépare ta soirée dès maintenant.'], ['Marcher 10 minutes', 'Dehors si possible.'], ['Posture', 'Dos droit, épaules relâchées : 5 rappels dans la journée.'], ['Respirer 2 minutes', 'Lentement, par le nez.']];
  const qk = 'nev.q.' + user.id + '.' + today;
  const qs = NEV.store.get(qk, {});
  const ws = NEV.store.get('nev.water.' + today, { n: 0, goal: 8 });
  const spe = p.spe && p.spe.status === 'done';
  const comboToday = p.history.some((h) => h.date === today && h.src === 'combo');
  const pm = POOL[sd % POOL.length];
  const Q = [
    { id: 'card', t: 'Valider la carte du jour', s: p.daily.status === 'done' ? 'Bravo !' : 'Un seul tirage par jour.', auto: p.daily.status === 'done', link: p.daily.status === 'none' ? ['gacha.html', 'Tirer'] : p.daily.status === 'done' ? null : ['exercice.html', 'Lancer'] },
    { id: 'water', t: 'Boire ' + ws.goal + ' verres d\'eau', s: ws.n + ' / ' + ws.goal + ' verres', auto: ws.n >= ws.goal, link: ['conseils.html#eau', 'Compteur'] },
    { id: 'warm', t: 'T\'échauffer 3 minutes', s: 'Épaules, poignets, hanches.', auto: false },
    { id: 'extra', t: pm[0], s: pm[1], auto: false },
    { id: 'bonus', t: 'Bonus : un tirage Spécialisation ou un combo', s: 'Facultatif, rien n\'est imposé.', auto: spe || comboToday, bonus: true, link: spe || comboToday ? null : ['specialisation.html', 'Choisir'] }
  ];
  const isDone = (q) => q.auto || !!qs[q.id];
  const core = Q.filter((q) => !q.bonus);

  function quests() {
    const n = core.filter(isDone).length, all = n === core.length, claimed = p.questDone === today;
    $('quests').innerHTML = '<h3>Objectifs du jour <span class="muted" style="font-weight:600">· ' + n + '/' + core.length + '</span></h3><div class="meter" style="margin-bottom:12px"><i style="width:' + Math.round(n / core.length * 100) + '%"></i></div><ul class="ql">' +
      Q.map((q) => '<li class="' + (isDone(q) ? 'done' : '') + '"><button type="button" class="ck" data-q="' + q.id + '"' + (q.auto ? ' disabled' : '') + ' aria-pressed="' + isDone(q) + '" aria-label="' + esc(q.t) + '">' + (isDone(q) ? '✓' : '') + '</button><div class="t"><b>' + esc(q.t) + '</b><span>' + esc(q.s) + '</span></div>' + (q.bonus ? '<span class="tag">Bonus</span>' : '') + (q.link && !isDone(q) ? '<a class="btn ghost sm" href="' + q.link[0] + '" data-go>' + q.link[1] + '</a>' : '') + '</li>').join('') + '</ul>' +
      '<div class="qrw">' + (claimed ? '<span class="chip gold">✅ +2 flammes reçues aujourd\'hui</span>' : all ? '<button type="button" class="btn" id="claim">Récupérer +2 flammes</button>' : '<span class="muted" style="font-size:.84rem">Termine les 4 premiers objectifs pour gagner 2 flammes.</span>') + '</div>';
  }
  $('quests').addEventListener('click', (e) => {
    const b = e.target.closest('.ck[data-q]');
    if (b && !b.disabled) { qs[b.dataset.q] = !qs[b.dataset.q]; NEV.store.set(qk, qs); quests(); return; }
    if (e.target.id === 'claim' && p.questDone !== today && core.every(isDone)) {
      p.questDone = today; p.flames += 2; p.flamesTotal += 2; NEV.player.save(p);
      const m = document.getElementById('meFlames'); if (m) m.textContent = p.flames;
      quests();
    }
  });
  quests();

  /* ---------- combo suggéré ---------- */
  const lv = Math.max(1, Math.min(5, p.level || 1));
  const pr = NEV.Programmes.list.filter((c) => c.lvlId === lv);
  const sg = pr[sd % pr.length];
  const stp = NEV.Combos.steps(sg, p, user);
  $('sugg').innerHTML = '<div class="eyebrow">Suggestion du jour</div><h3 style="margin-top:4px">' + esc(sg.title) + '</h3><p class="muted" style="margin:0 0 8px">Carte ' + sg.n + ' · niveau ' + esc(sg.lvl) + ' · ≈ ' + NEV.Combos.minutes(sg, p, user) + ' min</p><ol style="margin:0 0 12px;padding-left:1.2em;font-size:.9rem;color:#ecd2d6">' +
    stp.map((s) => '<li>' + esc(s.ex.name) + ' <span class="muted">— ' + s.plan.sets + ' × ' + esc(NEV.Ex.amountText(s.plan.unit, s.plan.perSet)) + '</span></li>').join('') + '</ol>' +
    '<a class="btn ok sm" href="exercice.html?src=combo&id=' + encodeURIComponent(sg.id) + '" data-go>Lancer cette carte</a> <a class="btn ghost sm" href="programmes.html#n' + lv + '" data-go>Tous les programmes</a>';

  /* ---------- calendrier des 28 derniers jours ---------- */
  const trained = {}, other = {};
  p.history.forEach((h) => { if (h.rest) other[h.date] = 1; else trained[h.date] = 1; });
  (p.login.days || []).forEach((d) => { other[d] = 1; });
  const start = U.addDays(today, -27), dow = (U.parseDay(start).getUTCDay ? U.parseDay(start).getUTCDay() : new Date(U.parseDay(start)).getUTCDay());
  const pad = (dow + 6) % 7;
  let c = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => '<b>' + d + '</b>').join('') + '<i style="visibility:hidden"></i>'.repeat(pad);
  for (let i = 0; i < 28; i++) {
    const d = U.addDays(start, i), n = +d.slice(8);
    c += '<i class="' + (trained[d] ? 'd1' : other[d] ? 'd2' : 'd0') + (d === today ? ' today' : '') + '" title="' + esc(d) + '">' + n + '</i>';
  }
  $('cal').innerHTML = c;

  /* ---------- chiffres ---------- */
  const inDays = (n) => p.history.filter((h) => !h.rest && U.daysBetween(h.date, today) < n && U.daysBetween(h.date, today) >= 0);
  const reps = p.history.filter((h) => !h.rest).reduce((a, h) => a + (h.reps || 0), 0);
  $('kpi').innerHTML = [[p.progress.streak, 'Série (jours)'], [p.progress.best, 'Record'], [new Set(inDays(7).map((h) => h.date)).size, 'Jours cette semaine'], [new Set(inDays(30).map((h) => h.date)).size, 'Jours ce mois'], [p.progress.total, 'Séances au total'], [reps, 'Répétitions (160 dernières)']]
    .map((k) => '<div><b>' + esc(k[0]) + '</b><span>' + esc(k[1]) + '</span></div>').join('');

  /* ---------- prochains badges ---------- */
  const R = NEV.Rewards;
  const next = R.defs().filter((d) => !p.badges[d.id] && R.RULES[d.rule.t] && d.rule.t !== 'manual').map((d) => ({ d, v: R.RULES[d.rule.t].get(p), need: Number(d.rule.v) }))
    .map((x) => Object.assign(x, { r: Math.min(1, x.v / (x.need || 1)) })).sort((a, b) => b.r - a.r).slice(0, 6);
  $('goals').innerHTML = next.map((x) => '<div class="goal">' + R.badgeSVG(x.d, 54) + '<div class="gi"><b>' + esc(x.d.name) + '</b><small>' + esc(x.d.desc) + '</small><div class="meter"><i style="width:' + Math.round(x.r * 100) + '%"></i></div><small style="margin:4px 0 0">' + Math.min(x.v, x.need) + ' / ' + x.need + '</small></div></div>').join('') || '<p class="muted">Tu as débloqué tous les badges disponibles. Bravo !</p>';

  /* ---------- combos du coach ---------- */
  const coach = ((NEV.cfg && NEV.cfg.combos) || []).filter((x) => NEV.Combos.valid(x));
  if (coach.length) {
    $('coach').innerHTML = '<h2 class="sec-t">Les combos du coach</h2><p class="sec-s">Créés par l\'équipe, mis à jour régulièrement.</p><div class="cbs">' + coach.map((cb) => '<article class="cb"><div class="meta"><span class="chip gold">Coach</span><span class="chip">≈ ' + NEV.Combos.minutes(cb, p, user) + ' min</span></div><h4>' + esc(cb.name) + '</h4><p class="bl">' + esc(cb.blurb || '') + '</p><div class="go"><a class="btn ok sm" href="exercice.html?src=combo&id=' + encodeURIComponent(cb.id) + '" data-go>Lancer</a></div></article>').join('') + '</div>';
  }
})();
