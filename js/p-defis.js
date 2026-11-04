/* neV.BOOSTER — Défis : exercice au choix, caméra, score enregistré (+ défi de la semaine et saison) */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, P = NEV.Policy, V = NEV.VisionCore;
  const ctx = await NEV.boot('defis'); if (!ctx) return;
  const p = ctx.p, user = ctx.user, server = NEV.cloud.mode === 'server';
  const qs = new URLSearchParams(location.search), SIM = qs.get('sim') === '1', SPEED = Math.max(1, Number(qs.get('speed')) || 1);
  const female = p.sex === 'f';
  const exOf = (d) => NEV.Ex.byId(female && d.exF ? d.exF : d.ex);
  const unitOf = (d, n) => (d.kind === 'hold' ? 'seconde' + (n > 1 ? 's' : '') : 'répétition' + (n > 1 ? 's' : ''));
  const fmt = (d, v) => (d.kind === 'hold' ? (v >= 60 ? Math.floor(v / 60) + ' min ' + (v % 60) + ' s' : v + ' s') : v + ' rép.');

  /* ---- défis : calcul local (mode démo) ; en mode serveur c'est le serveur qui décide ---- */
  function localStats(from, to) {
    const h = (p.history || []).filter((x) => x.date >= from && x.date <= to);
    const days = {}; h.forEach((x) => { days[x.date] = 1; });
    return { sessions: h.length, days: Object.keys(days).length, reps: h.reduce((a, x) => a + (x.reps || 0) * (x.sets || 0), 0), xp: h.reduce((a, x) => a + (x.xpGain || 0), 0), verified: h.filter((x) => x.verified).length };
  }
  function localState() {
    const day = NEV.util.todayStr(), ch = P.challengeFor(day), se = P.seasonOf(day), cl = p.claims || {};
    const st = localStats(ch.start, ch.end), ss = localStats(se.start, se.end);
    const val = st[ch.metric];
    return {
      challenge: Object.assign({}, ch, { value: Math.min(val, ch.goal), done: val >= ch.goal, claimed: !!cl[ch.week] }),
      season: Object.assign({}, se, { sessions: ss.sessions, xp: ss.xp, goal: P.SEASON_REWARD.sessions, reward: P.SEASON_REWARD.flames, done: se.n > 0 && ss.sessions >= P.SEASON_REWARD.sessions, claimed: !!cl[se.id] })
    };
  }
  async function state() {
    if (server) { const r = await NEV.cloud.api('challenge'); if (r.ok) return r.data; }
    return localState();
  }
  const fdate = (s) => s.slice(8) + '/' + s.slice(5, 7);

  async function drawChal() {
    const s = await state(), c = s.challenge, se = s.season;
    const unit = { sessions: 'séances', days: 'jours', reps: 'répétitions', xp: 'XP', verified: 'séances caméra' }[c.metric] || '';
    const btn = (o, kind) => o.claimed ? '<span class="chip ok">Récompense récupérée ✓</span>' : o.done ? '<button type="button" class="btn" data-claim="' + kind + '">Récupérer +' + (o.reward) + ' flammes</button>' : '';
    $('chal').innerHTML =
      '<article class="panel glow cl-card"><div class="eyebrow">Défi de la semaine · du ' + fdate(c.start) + ' au ' + fdate(c.end) + '</div><h3>' + esc(c.title) + '</h3>' +
      '<div class="cl-bar" role="progressbar" aria-label="Progression du défi" aria-valuemin="0" aria-valuemax="' + c.goal + '" aria-valuenow="' + c.value + '"><i style="width:' + Math.round(100 * c.value / c.goal) + '%"></i></div>' +
      '<div class="cl-meta"><span>' + c.value + ' / ' + c.goal + ' ' + unit + '</span><span>🔥 +' + c.reward + '</span></div>' + btn(c, 'week') + '</article>' +
      '<article class="panel cl-card"><div class="eyebrow">Saison ' + (se.n || '—') + ' · ' + esc(se.name) + '</div><h3>' + (se.n ? se.left + ' jours restants' : 'La saison 1 commence le ' + fdate(P.seasonOf('2026-10-19').start)) + '</h3>' +
      (se.n ? '<p>Fais ' + se.goal + ' séances pendant la saison (six semaines) pour gagner ' + se.reward + ' flammes.</p><div class="cl-bar" role="progressbar" aria-label="Progression de la saison" aria-valuemin="0" aria-valuemax="' + se.goal + '" aria-valuenow="' + Math.min(se.sessions, se.goal) + '"><i style="width:' + Math.min(100, Math.round(100 * se.sessions / se.goal)) + '%"></i></div><div class="cl-meta"><span>' + Math.min(se.sessions, se.goal) + ' / ' + se.goal + ' séances</span><span>' + se.xp + ' XP gagnés</span></div>' + btn(se, 'season') : '<p>Chaque saison dure six semaines : un nouveau classement, une nouvelle récompense.</p>') + '</article>';
  }
  $('chal').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-claim]'); if (!b) return; b.disabled = true;
    const kind = b.dataset.claim, s = await state(), o = kind === 'season' ? s.season : s.challenge;
    if (server) {
      const r = await NEV.cloud.api('challenge/claim', 'POST', { kind: kind });
      if (!r.ok) { b.disabled = false; b.textContent = (r.data && r.data.error) || 'Échec'; return; }
    } else { p.claims = p.claims || {}; p.claims[kind === 'season' ? o.id : o.week] = 1; }
    p.flames += o.reward; p.flamesTotal += o.reward; NEV.player.save(p);
    const m = document.getElementById('meFlames'); if (m) m.textContent = p.flames;
    drawChal();
  });


  /* ---------- 1. La liste des défis ---------- */
  const SECS = ['dfList', 'dfBrief', 'dfRun', 'dfDone'];
  const show = (id) => { SECS.forEach((s) => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); };
  let mine = {}, arts = [];
  async function loadMine() {
    mine = {};
    if (server) { const r = await NEV.cloud.api('defi/mine'); if (r.ok) (r.data.mine || []).forEach((m) => { mine[m.defi] = { best: m.best, bestV: m.bestV }; }); }
    else Object.keys(p.defis || {}).forEach((k) => { mine[k] = p.defis[k]; });
  }
  async function drawList() {
    await loadMine();
    arts.forEach((c) => { try { c.destroy(); } catch (e) { /* ignoré */ } }); arts = [];
    $('dfGrid').innerHTML = P.DEFIS.map((d) => {
      const m = mine[d.id] || {}, ex = exOf(d);
      return '<article class="df-card"><div class="df-art" data-art="' + d.id + '" aria-hidden="true"></div><h3>' + esc(d.name) + '</h3>' +
        '<p>' + (d.kind === 'hold' ? 'Tiens la position le plus longtemps possible.' : 'Un maximum de répétitions en ' + d.win + ' secondes.') + (female && d.exF ? ' Version : ' + esc(ex.name.toLowerCase()) + '.' : '') + '</p>' +
        '<div class="df-best"><span>Ton record</span><span>' + (m.bestV ? '📷 ' + fmt(d, m.bestV) : m.best ? fmt(d, m.best) + ' <small>(non classé)</small>' : '—') + '</span></div>' +
        '<button type="button" class="btn" data-play="' + d.id + '">Relever le défi</button></article>';
    }).join('');
    P.DEFIS.forEach((d) => { const el = document.querySelector('[data-art="' + d.id + '"]'); if (el && NEV.Figure) { try { arts.push(NEV.Figure.mount(el, exOf(d), {})); } catch (e) { /* ignoré */ } } });
  }
  $('dfGrid').addEventListener('click', (e) => { const b = e.target.closest('[data-play]'); if (b) openBrief(P.defiById(b.dataset.play)); });

  /* ---------- 2. Avant de commencer ---------- */
  let D = null, demo = null;
  function openBrief(d) {
    D = d; const ex = exOf(d);
    arts.forEach((c) => { try { c.destroy(); } catch (e) { /* ignoré */ } }); arts = [];
    $('bKick').textContent = 'Défi · ' + (d.kind === 'hold' ? 'durée' : 'répétitions');
    $('bTitle').textContent = d.name;
    $('bChips').innerHTML = '<span class="chip red">' + esc(NEV.Ex.musclesText(ex)) + '</span><span class="chip">' + esc(NEV.Ex.equipText(ex)) + '</span><span class="chip ok">📷 Caméra = classement</span>';
    $('bRule').textContent = d.kind === 'hold'
      ? 'Prends la position et tiens le plus longtemps possible. Le chrono s\'arrête quand tu quittes la position plus de 6 secondes, ou quand tu appuies sur « Terminer ». Ton score est la durée tenue.'
      : 'Après un compte à rebours de 3 secondes, fais un maximum de répétitions propres en ' + d.win + ' secondes. La caméra compte pour toi : seules les répétitions complètes comptent. Ton score est le nombre de répétitions.';
    $('bCam').innerHTML = '📷 <b>Placement de la caméra :</b> ' + esc((ex.cam && ex.cam.place) || 'Pose ton téléphone à 2 m, de façon à te voir en entier.');
    if (demo) { try { demo.destroy(); } catch (e) { /* ignoré */ } }
    demo = NEV.Figure.mount($('bDemo'), ex, {});
    show('dfBrief');
  }
  $('bBack').onclick = () => { if (demo) { try { demo.destroy(); } catch (e) { /* ignoré */ } demo = null; } show('dfList'); drawList(); };
  $('bStartCam').onclick = () => start(SIM ? 'sim' : 'cam');
  $('bStartManual').onclick = () => start('manual');

  /* ---------- 3. Le défi ---------- */
  const S = { state: 'idle', mode: 'cam', ctr: null, t0: 0, tick: 0, presentSince: 0, lostAt: 0, manual: 0, ended: false };
  const setCount = (n) => { $('rCount').textContent = Math.floor(n); };
  const setRing = (k) => { $('rRing').style.strokeDashoffset = String(327 * (1 - Math.max(0, Math.min(1, k)))); };
  const go = (txt) => { const g = $('rGo'); g.hidden = !txt; g.textContent = txt || ''; g.style.animation = 'none'; void g.offsetWidth; g.style.animation = ''; };
  function camError(code) {
    const msg = { insecure: 'La caméra ne marche que sur une page sécurisée (https).', denied: 'Tu as refusé la caméra. Autorise-la dans les réglages du navigateur.', nocam: 'Aucune caméra trouvée sur cet appareil.', noload: 'Le détecteur de pose n\'a pas pu se charger.' }[code] || 'La caméra n\'est pas disponible.';
    NEV.ui.toast(msg + ' On continue sans caméra : le score ne sera pas classé.', 5200);
    S.mode = 'manual'; NEV.Vision.stop(); setupRun(); beginCount();
  }
  function setupRun() {
    const ex = exOf(D), cam = S.mode !== 'manual';
    $('rName').textContent = D.name; $('rTitle').textContent = D.name;
    $('rNoCam').hidden = cam; $('rMirror').hidden = !cam;
    if (!cam) { if (demo) { try { demo.destroy(); } catch (e) { /* ignoré */ } } demo = NEV.Figure.mount($('rNoDemo'), ex, {}); }
    $('rTip').textContent = (ex.cam && ex.cam.place) || '';
    $('rPlus').hidden = true; $('rStop').hidden = true; $('rHint').textContent = '';
    $('rOf').textContent = D.kind === 'hold' ? 's' : 'rép.';
    $('rRingT').textContent = D.kind === 'hold' ? 'tenu' : 'restantes'; $('rRingN').textContent = D.kind === 'hold' ? '0' : String(D.win);
    setCount(0); setRing(0);
    S.ctr = V.counter(ex, { perSet: 99999, sets: 1 }); S.manual = 0; S.lostAt = 0; S.presentSince = 0; S.ended = false;
  }
  async function start(mode) {
    S.mode = mode; S.state = 'wait';
    if (NEV.Sfx && NEV.Sfx.pop) NEV.Sfx.pop();
    NEV.Fx.init && NEV.Fx.init();
    NEV.track && NEV.track('defi-start', { id: D.id, mode: mode });
    if (demo) { try { demo.destroy(); } catch (e) { /* ignoré */ } demo = null; }
    show('dfRun'); setupRun();
    if (mode === 'manual') { beginCount(); return; }
    $('rStatus').textContent = 'Place-toi en entier dans le cadre : le compte à rebours part tout seul.';
    if (mode === 'sim') { NEV.Vision.startSim(exOf(D), { video: $('rVideo'), canvas: $('rCanvas'), onPose }, SPEED); return; }
    const ok = await NEV.Vision.start({ video: $('rVideo'), canvas: $('rCanvas'), onStatus: (m) => { $('rStatus').textContent = m; }, onError: camError, onPose });
    if (ok) $('rStatus').textContent = 'Place-toi en entier dans le cadre : le compte à rebours part tout seul.';
  }
  function beginCount() {
    if (S.state === 'count' || S.state === 'go') return;
    S.state = 'count'; $('rStatus').textContent = '';
    let n = 3; go(String(n)); NEV.Sfx && NEV.Sfx.beep && NEV.Sfx.beep(false);
    const iv = setInterval(() => {
      if (S.state !== 'count') { clearInterval(iv); return; }
      n--; if (n > 0) { go(String(n)); NEV.Sfx.beep && NEV.Sfx.beep(false); return; }
      clearInterval(iv); go('GO'); NEV.Sfx.beep && NEV.Sfx.beep(true); setTimeout(() => go(''), 700); begin();
    }, 1000);
  }
  function begin() {
    S.state = 'go'; S.ctr.reset(); S.t0 = performance.now(); S.lostAt = 0;
    $('rStop').hidden = false; $('rPlus').hidden = !(S.mode === 'manual' && D.kind === 'reps');
    S.tick = setInterval(frame, 200); frame();
  }
  function score() { return D.kind === 'hold' ? Math.floor(S.mode === 'manual' ? (performance.now() - S.t0) / 1000 : S.ctr.secs) : (S.mode === 'manual' ? S.manual : S.ctr.reps); }
  function frame() {
    if (S.state !== 'go') return;
    const el = (performance.now() - S.t0) / 1000;
    if (D.kind === 'reps') {
      const left = Math.max(0, D.win - el); $('rRingN').textContent = Math.ceil(left); setRing(el / D.win);
      if (S.mode === 'manual') setCount(S.manual);
      if (left <= 0) finish();
    } else {
      const sc = score(); $('rRingN').textContent = sc; setCount(sc); setRing((sc % 60) / 60);
      if (sc >= D.cap) finish();
    }
  }
  let lastReps = 0;
  function onPose(lm, t) {
    if (S.ended) return false;
    const here = !!(lm && V.present(lm));
    if (S.state === 'wait') {
      if (here) { if (!S.presentSince) S.presentSince = t; if (t - S.presentSince > 900) { $('rStatus').textContent = 'Je te vois : ne bouge pas.'; beginCount(); } }
      else S.presentSince = 0;
      $('rCamBox').classList.toggle('good', here); return here;
    }
    if (S.state !== 'go') return here;
    const out = S.ctr.update(lm, t);
    if (D.kind === 'reps') { setCount(out.count); if (out.rep) { const w = $('rCountWrap'); w.classList.remove('pulse'); void w.offsetWidth; w.classList.add('pulse'); NEV.Sfx.pop && NEV.Sfx.pop(); } }
    $('rHint').textContent = out.hint || '';
    $('rCamBox').classList.toggle('good', !!(out.valid && (out.inPos || D.kind === 'reps')));
    if (D.kind === 'hold') {
      if (out.inPos) S.lostAt = 0; else if (out.count > 0 && !S.lostAt) S.lostAt = t;
      if (S.lostAt && t - S.lostAt > 6000) finish();
    }
    return out.valid;
  }
  $('rPlus').onclick = () => { if (S.state === 'go') { S.manual++; setCount(S.manual); NEV.Sfx.pop && NEV.Sfx.pop(); } };
  $('rStop').onclick = () => finish();
  $('rQuit').onclick = () => { S.ended = true; S.state = 'idle'; clearInterval(S.tick); NEV.Vision.stop(); show('dfList'); drawList(); };
  window.addEventListener('pagehide', () => { try { NEV.Vision.stop(); } catch (e) { /* ignoré */ } });

  /* ---------- 4. Résultat et enregistrement ---------- */
  async function finish() {
    if (S.ended) return; S.ended = true; S.state = 'idle'; clearInterval(S.tick); NEV.Vision.stop(); go('');
    const sc = Math.min(Math.max(0, score()), D.cap), verified = S.mode === 'cam' && sc >= 1;
    NEV.Sfx.ok && NEV.Sfx.ok();
    const prev = mine[D.id] || {}, before = verified ? (prev.bestV || 0) : (prev.best || 0);
    $('dTitle').textContent = D.name; $('dScore').textContent = sc; $('dUnit').textContent = unitOf(D, sc);
    let msg = '', rec = sc > before && sc >= 1;
    if (sc < 1) msg = 'Aucun score cette fois : place-toi bien dans le cadre et réessaie.';
    else if (server) {
      const r = await NEV.cloud.api('defi/score', 'POST', { id: D.id, score: sc, verified: verified });
      if (r.ok) {
        msg = verified ? 'Score validé par la caméra. Tu es n°' + r.data.rank + ' sur ' + r.data.total + ' au classement public.' : 'Score enregistré sur ton profil. Sans caméra, il n\'entre pas au classement.';
        (r.data.mine || []).forEach((m) => { mine[m.defi] = { best: m.best, bestV: m.bestV }; });
      } else msg = (r.data && r.data.error) || 'Le score n\'a pas pu être enregistré. Réessaie plus tard.';
    } else {
      p.defis = p.defis || {}; const m = p.defis[D.id] || { best: 0, bestV: 0 };
      m.best = Math.max(m.best, sc); if (verified) m.bestV = Math.max(m.bestV, sc); p.defis[D.id] = m; NEV.player.save(p); mine[D.id] = m;
      msg = 'Mode démo : score enregistré sur cet appareil.';
    }
    $('dMsg').innerHTML = (rec ? '<span class="df-rec">Nouveau record !</span><br>' : '') + esc(msg);
    $('dKick').textContent = verified ? 'Défi validé 📷' : 'Défi terminé';
    $('dRank').hidden = !verified;
    show('dfDone');
    if (rec) { NEV.Fx.init && NEV.Fx.init(); NEV.Fx.burst && NEV.Fx.burst(innerWidth / 2, innerHeight / 3, { n: 80, power: 1, colors: ['#ffd45e', '#e0455f', '#fff'] }); }
  }
  $('dAgain').onclick = () => openBrief(D);
  $('dList').onclick = () => { show('dfList'); drawList(); };

  await drawChal();
  await drawList();
  const pre = qs.get('defi'); if (pre && P.defiById(pre)) openBrief(P.defiById(pre));
})();
