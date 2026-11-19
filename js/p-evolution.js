/* neV.BOOSTER — Mon évolution : jour N sur 90, paliers de l'avatar, activité, poids, photos (sur l'appareil seulement) */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, U = NEV.util, E = NEV.Evo;
  const ctx = await NEV.boot('evolution'); if (!ctx) return;
  const p = ctx.p;
  if (E.sync(p)) NEV.player.save(p);
  const evo = E.ensure(p), pr = E.progress(p), hs = NEV.heroFromXp(p.progress.xp || 0);
  const f = NEV.sex === 'f';

  /* ---------- en-tête et anneau des 90 jours ---------- */
  $('since').textContent = 'Depuis le ' + U.frDate(evo.start);
  $('lead').textContent = pr.done ? 'Les 90 jours sont passés : regarde le chemin parcouru, et continue.' : 'Plus que ' + pr.left + ' jour' + (pr.left > 1 ? 's' : '') + ' avant ton bilan des 90 jours.';
  const R = 52, C = 2 * Math.PI * R;
  $('ring').innerHTML = '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="' + R + '" class="rb"/><circle cx="60" cy="60" r="' + R + '" class="rf" stroke-dasharray="' + (C * pr.pct).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 60 60)"/></svg><b>' + Math.round(pr.pct * 100) + '<small>%</small></b>';
  $('ringDay').textContent = 'Jour ' + Math.min(pr.day, 999);
  $('ringTxt').textContent = pr.done ? 'Défi de 90 jours atteint' : 'sur ' + pr.goal + ' jours';
  $('stage').innerHTML = 'Palier : <b>' + esc(hs.stage.name) + '</b>' + (hs.next ? ' · prochain : ' + esc(hs.next.name) + ' (' + hs.next.xp + ' XP)' : ' · palier maximum');

  /* ---------- chiffres ---------- */
  const w = evo.weights, w0 = w[0], w1 = w[w.length - 1];
  const dw = w0 && w1 && w.length > 1 ? Math.round((w1.kg - w0.kg) * 10) / 10 : null;
  const days = new Set((p.history || []).map((h) => h.date)).size;
  $('kpi').innerHTML = [
    [p.progress.total || 0, 'Séances'], [p.progress.xp || 0, 'XP'], [p.progress.best || 0, 'Meilleure série'], [days, 'Jours actifs']
  ].concat(dw === null ? [] : [[(dw > 0 ? '+' : '') + String(dw).replace('.', ',') + ' kg', 'Depuis le départ']])
    .map((k) => '<div class="stat"><b>' + esc(String(k[0])) + '</b><span>' + esc(k[1]) + '</span></div>').join('');

  /* ---------- activité : 12 semaines ---------- */
  const mondayOf = (s) => { const d = new Date(s + 'T12:00:00Z'), k = (d.getUTCDay() + 6) % 7; return Math.floor(Date.parse(s + 'T12:00:00Z') / 86400000) - k; };
  const nowM = mondayOf(U.todayStr()), wk = [];
  for (let i = 11; i >= 0; i--) wk.push({ m: nowM - 7 * i, n: 0 });
  (p.history || []).forEach((h) => { const m = mondayOf(h.date), c = wk.find((x) => x.m === m); if (c) c.n++; });
  const mx = Math.max(3, ...wk.map((x) => x.n));
  $('weeks').innerHTML = wk.map((x) => '<i title="' + x.n + ' séance' + (x.n > 1 ? 's' : '') + '"><u style="height:' + Math.round((x.n / mx) * 100) + '%"></u><em>' + x.n + '</em></i>').join('');

  /* ---------- poids ---------- */
  if (w.length >= 2) {
    $('wBlock').hidden = false;
    const lo = Math.min(...w.map((x) => x.kg)) - 1, hi = Math.max(...w.map((x) => x.kg)) + 1, W = 320, H = 120;
    const t0 = E.daysBetween('2000-01-01', w[0].d), t1 = Math.max(t0 + 1, E.daysBetween('2000-01-01', w[w.length - 1].d));
    const pts = w.map((x) => [((E.daysBetween('2000-01-01', x.d) - t0) / (t1 - t0)) * (W - 24) + 12, H - 14 - ((x.kg - lo) / (hi - lo)) * (H - 28)]);
    $('wChart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + '"/>' + pts.map((q) => '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3.2"/>').join('') + '</svg><div class="wl"><span>' + U.frDate(w[0].d) + ' · ' + String(w[0].kg).replace('.', ',') + ' kg</span><span>' + U.frDate(w[w.length - 1].d) + ' · ' + String(w[w.length - 1].kg).replace('.', ',') + ' kg</span></div>';
  }

  /* ---------- parcours ---------- */
  const ev = [{ d: evo.start, t: 'Tu commences neV.BOOSTER', s: 'Jour 1' }];
  const first = (p.history || []).length ? p.history[p.history.length - 1] : null;
  if (first) ev.push({ d: first.date, t: 'Ta première séance', s: first.name || '' });
  Object.keys(evo.stages).forEach((n) => { if (+n > 1) { const h = NEV.HERO_STAGES[n - 1]; ev.push({ d: evo.stages[n], t: 'Palier atteint : ' + (f && h.nameF ? h.nameF : h.name), s: h.xp + ' XP' }); } });
  evo.photos.forEach((x) => ev.push({ d: x.d, t: x.kind === 'start' ? 'Photo de départ' : 'Photo de suivi', s: 'Sur ton téléphone seulement' }));
  if (w0) ev.push({ d: w0.d, t: 'Poids de départ', s: String(w0.kg).replace('.', ',') + ' kg' });
  if (pr.done) ev.push({ d: U.addDays ? U.addDays(evo.start, 89) : evo.start, t: 'Cap des 90 jours', s: 'Bravo, tu as tenu' });
  ev.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  $('tl').innerHTML = ev.map((x) => '<li><time>' + esc(U.frDate(x.d)) + '</time><b>' + esc(x.t) + '</b><span>' + esc(x.s) + '</span></li>').join('');

  /* ---------- photos : avant / aujourd'hui ---------- */
  const urls = [];
  function url(b) { const u = URL.createObjectURL(b); urls.push(u); return u; }
  async function drawPhotos() {
    urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
    const box = $('photos'), start = evo.photos.find((x) => x.kind === 'start'), nows = evo.photos.filter((x) => x.kind === 'now'), last = nows[nows.length - 1];
    const note = '<p class="muted ph-note">Ces photos restent <b>sur ton téléphone</b> : elles ne sont jamais envoyées au site ni partagées. Une tenue de sport normale suffit. Tu peux les effacer quand tu veux.</p>';
    let h = '';
    if (start && last) {
      const [a, b] = await Promise.all([E.getPhoto(start.d, 'start'), E.getPhoto(last.d, 'now')]);
      if (a && b) {
        h += '<div class="cmp" id="cmp"><img src="' + url(b) + '" alt="Aujourd\'hui"><div class="cmpTop" id="cmpTop"><img src="' + url(a) + '" alt="Au départ"></div><i class="cmpLine" id="cmpLine"></i><span class="cmpA">Départ · ' + esc(U.frDate(start.d)) + '</span><span class="cmpB">Aujourd\'hui · ' + esc(U.frDate(last.d)) + '</span></div><input type="range" class="cmpR" id="cmpR" min="0" max="100" value="50" aria-label="Comparer avant et après">';
      }
    } else if (start) {
      const a = await E.getPhoto(start.d, 'start');
      if (a) h += '<div class="one"><img src="' + url(a) + '" alt="Photo de départ"><span>Départ · ' + esc(U.frDate(start.d)) + '</span></div>' + (pr.done ? '<p><b>Les 90 jours sont passés.</b> Prends ta photo d\'aujourd\'hui pour voir la différence.</p>' : '<p>Dans <b>' + pr.left + ' jour' + (pr.left > 1 ? 's' : '') + '</b>, tu pourras comparer avec une nouvelle photo.</p>');
    } else {
      h += '<p><b>Ta photo de départ (facultatif).</b> Garde une image de toi aujourd\'hui : dans 90 jours, tu verras la différence côte à côte.</p>';
    }
    h += '<div class="ph-act">' +
      (!start ? '<button type="button" class="btn" data-k="start">Ajouter ma photo de départ</button>' : '<button type="button" class="btn' + (pr.done ? '' : ' out') + '" data-k="now">Ajouter ma photo d\'aujourd\'hui</button>') +
      (evo.photos.length ? '<button type="button" class="btn out" id="phDel">Effacer mes photos</button>' : '') + '</div>' + note +
      '<input type="file" id="phFile" accept="image/*" hidden>';
    box.innerHTML = h;
    const r = $('cmpR'); if (r) { const set = () => { $('cmpTop').style.width = r.value + '%'; $('cmpLine').style.left = r.value + '%'; }; r.addEventListener('input', set); set(); }
    let kind = 'now';
    box.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { kind = b.dataset.k; $('phFile').click(); }));
    $('phFile').addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { await E.addPhoto(p, file, kind); NEV.toast && NEV.toast('Photo enregistrée sur ton téléphone'); } catch (er) { alert(er.message || 'Photo impossible'); }
      drawPhotos();
    });
    const del = $('phDel'); if (del) del.addEventListener('click', async () => { if (confirm('Effacer toutes tes photos d\'évolution de ce téléphone ?')) { await E.removeAll(p); drawPhotos(); } });
  }
  drawPhotos();
})();
