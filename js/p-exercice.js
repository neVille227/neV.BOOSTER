/* neV.BOOSTER — page d'exercice
   Avant → (caméra : placement, 3-2-1) → séries comptées → repos → … → grand OK vert → bilan.
   Sources : ?src=daily (carte du jour) | ?src=spe (carte Spécialisation) | ?src=combo&id=… (enchaînement)
   Options de test : ?sim=1 (l'avatar fait l'exercice à la place de la caméra), &speed=3, &auto=1 (départ auto). */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, sleep = NEV.util.sleep;
  const qs = new URLSearchParams(location.search);
  const SRC = qs.get('src') === 'spe' ? 'spe' : qs.get('src') === 'combo' ? 'combo' : 'daily';
  const SIM = qs.get('sim') === '1', SPEED = Math.max(1, Number(qs.get('speed')) || 1);
  const ctx = await NEV.boot(SRC === 'daily' ? 'gacha' : 'specialisation'); if (!ctx) return;
  const user = ctx.user, p = ctx.p, V = NEV.VisionCore;
  NEV.player.ensureDay(p); NEV.player.save(p);
  const cautious = false;

  /* ---------- 1. Ce qu'on va faire ---------- */
  let steps = [], title = '', combo = null, card = null, isRest = false, slot = null;
  if (SRC === 'combo') {
    combo = NEV.Combos.get(qs.get('id'));
    if (!combo || !NEV.Combos.valid(combo)) { NEV.go('specialisation.html', 0); return; }
    steps = NEV.Combos.steps(combo, p, user); title = combo.name;
  } else {
    slot = SRC === 'spe' ? p.spe : p.daily;
    card = slot.card;
    if (!card) { NEV.go(SRC === 'spe' ? 'gacha.html?mode=spe' : 'gacha.html', 0); return; }
    if (card.special === 'repos') { isRest = true; steps = [{ ex: NEV.Ex.byId('repos-actif'), plan: card.plan, rest: true }]; title = 'Jour de repos'; }
    else { const ex = NEV.Ex.byId(card.id); if (!ex) { NEV.go('accueil.html', 0); return; } steps = [{ ex, plan: card.plan }]; title = card.name; }
  }
  const S = { step: 0, set: 0, mode: 'cam', phase: '', counter: null, armed: false, arming: false, finishing: false, seen: 0, presentSince: 0, tok: 0,
    verifiedAll: true, totalReps: 0, setsDone: 0, sideUntil: 0, sideShown: false, timerOn: false, timerT0: 0, quit: false, sim: SIM };
  const totalSets = steps.reduce((a, s) => a + s.plan.sets, 0);
  const cur = () => steps[S.step];
  let demoCtl = null, miniCtl = null, nextCtl = null, heroCtl = null;

  const planText = (pl) => pl.sets + ' série' + (pl.sets > 1 ? 's' : '') + ' de ' + NEV.Ex.amountText(pl.unit, pl.perSet) + (pl.doubled ? ' (doublé)' : '') + (pl.rest ? ' · repos ' + pl.rest + ' s' : '');
  const setPhase = (id) => { ['phBrief', 'phRun', 'phRest', 'phOk', 'phDone'].forEach((x) => { $(x).hidden = x !== id; }); S.phase = id; };
  const mountDemo = (el, ex, ctlName) => {
    const old = { demo: demoCtl, mini: miniCtl, next: nextCtl }[ctlName]; if (old) old.destroy();
    const c = NEV.Figure.mount(el, ex, {});
    if (ctlName === 'demo') demoCtl = c; else if (ctlName === 'mini') miniCtl = c; else nextCtl = c;
  };
  const needsSolid = steps.some((s) => (s.ex.equip || []).some((k) => k === 'bar' || k === 'table') || s.ex.special === 'tractions');

  /* ---------- 2. Écran « avant de commencer » ---------- */
  function renderBrief() {
    const st = steps[0], ex = st.ex;
    const z = SRC === 'spe' && p.spe.zone && p.spe.zone !== 'all' && NEV.Zones.get(p.spe.zone);
    $('xSrc').textContent = SRC === 'combo' ? 'Enchaînement' : (SRC === 'spe' ? 'Spécialisation' + (z ? ' · ' + z.name : '') : (card && card.special ? 'Carte spéciale' : 'Exercice du jour'));
    $('xTitle').textContent = title;
    document.title = 'neV.BOOSTER — ' + title;
    mountDemo($('bDemo'), ex, 'demo');
    const chips = [];
    if (SRC === 'combo') {
      chips.push('<span class="chip red">' + steps.length + ' exercices</span>', '<span class="chip">≈ ' + NEV.Combos.minutes(combo, p, user) + ' min</span>');
      $('bExec').textContent = combo.blurb || 'Un enchaînement d\'exercices, dans l\'ordre.';
      $('bSteps').innerHTML = steps.map((s) => '<li><b>' + esc(s.ex.name) + '</b> — ' + esc(s.plan.sets + ' × ' + NEV.Ex.amountText(s.plan.unit, s.plan.perSet)) + '</li>').join('');
    } else {
      if (card && card.special) chips.push('<span class="chip gold">✦ Carte spéciale</span>');
      else if (ex.tierName) chips.push('<span class="chip red">' + esc(ex.tierName) + '</span>');
      if (NEV.cfg && NEV.cfg.reviews && NEV.cfg.reviews[ex.id] === 'ok') chips.push('<span class="chip ok" title="Cet exercice a été relu par un coach ou un kinésithérapeute">🩺 Relu par un pro</span>');
      chips.push('<span class="chip">' + esc(planText(st.plan)) + '</span>');
      const m = NEV.Ex.musclesText(ex); if (m) chips.push('<span class="chip">' + esc(m) + '</span>');
      chips.push('<span class="chip">' + esc(NEV.Ex.equipText(ex)) + '</span>');
      $('bExec').textContent = ex.exec || '';
      $('bSteps').innerHTML = (ex.steps || []).map((s) => '<li>' + esc(s) + '</li>').join('');
    }
    $('bChips').innerHTML = chips.join('');
    const warns = []; steps.forEach((s) => { if (s.ex.warn && warns.indexOf(s.ex.warn) < 0) warns.push(s.ex.warn); });
    const w = $('bWarn'); w.hidden = !warns.length; w.classList.toggle('strong', needsSolid);
    w.innerHTML = warns.map((x) => '⚠️ ' + esc(x)).join('<br>');
    $('bSolidWrap').hidden = !needsSolid;
    if (isRest) {
      $('bCam').innerHTML = 'Aucune caméra nécessaire : on respire, c\'est tout.';
      $('bStartCam').textContent = 'Commencer mon repos'; $('bStartManual').hidden = true;
    } else {
      $('bCam').innerHTML = '📷 <b>Placement de la caméra :</b> ' + esc((ex.cam && ex.cam.place) || 'Pose ton téléphone à 2 m, de façon à te voir en entier.') + (cautious ? '' : '');
    }
    syncStartButtons();
    setPhase('phBrief');
  }
  const syncStartButtons = () => { const ok = !needsSolid || $('bSolid').checked; $('bStartCam').disabled = !ok; $('bStartManual').disabled = !ok; };
  $('bSolid').addEventListener('change', syncStartButtons);

  if ((SRC === 'daily' || SRC === 'spe') && slot.status === 'done') { showAlready(); return; }
  if (p.daily.double && p.daily.status !== 'done' && SRC === 'daily') $('xAlert').innerHTML = '<div class="banner"><span style="font-size:1.4rem">⚠️</span><div>Journée ratée : les séries sont <b>doublées</b> aujourd\'hui. Courage !</div></div>';
  renderBrief();

  /* ---------- 3. Démarrage ---------- */
  $('bStartCam').onclick = () => (isRest ? startRest() : startSession(SIM ? 'sim' : 'cam'));
  $('bStartManual').onclick = () => startSession('manual');
  let autoTimer = 0;
  if (qs.get('auto') === '1' && !needsSolid && !isRest) { // arrivée depuis le gacha : la caméra démarre toute seule après 3 s
    let n = 3; $('bAuto').hidden = false; $('bAutoTxt').textContent = 'La caméra démarre dans ' + n + ' s…';
    autoTimer = setInterval(() => { n--; if (n <= 0) { clearInterval(autoTimer); $('bAuto').hidden = true; $('bStartCam').click(); } else $('bAutoTxt').textContent = 'La caméra démarre dans ' + n + ' s…'; }, 1000);
    $('bAutoStop').onclick = () => { clearInterval(autoTimer); $('bAuto').hidden = true; };
  }

  async function startSession(mode) {
    clearInterval(autoTimer); $('bAuto').hidden = true;
    S.mode = mode; $('xProg').hidden = false;
    NEV.Fx.init();
    if (NEV.Sfx && NEV.Sfx.pop) NEV.Sfx.pop(); // débloque l'audio (geste utilisateur)
    NEV.track && NEV.track('start', { src: SRC, id: SRC === 'combo' ? combo.id : (card && card.id), mode });
    beginSet(true);
    if (mode === 'cam') {
      const ok = await NEV.Vision.start({
        video: $('rVideo'), canvas: $('rCanvas'),
        onStatus: (m) => { $('rStatus').textContent = m; },
        onError: camError,
        onPose: onPose
      });
      if (ok) $('rStatus').textContent = 'Place-toi en entier dans le cadre : le départ est automatique.';
    } else if (mode === 'sim') {
      NEV.Vision.startSim(cur().ex, { video: $('rVideo'), canvas: $('rCanvas'), onPose }, SPEED);
      $('rStatus').textContent = 'Simulation : l\'avatar fait l\'exercice.';
    }
  }

  function camError(code) {
    const msg = {
      insecure: 'La caméra ne marche que sur une page sécurisée (https).',
      denied: 'Tu as refusé la caméra. Tu peux l\'autoriser dans les réglages du navigateur.',
      nocam: 'Aucune caméra n\'a été trouvée sur cet appareil.',
      noload: 'Le détecteur de pose n\'a pas pu se charger (connexion ?).'
    }[code] || 'La caméra n\'est pas disponible.';
    NEV.ui.toast(msg + ' On continue sans caméra (XP ÷ 2).', 5200);
    S.mode = 'manual'; S.tok++; S.armed = false; S.arming = false;
    beginSet(S.set === 0 && S.setsDone === 0);
  }

  /* ---------- 4. Une série ---------- */
  function beginSet(first) {
    const st = cur(), ex = st.ex, pl = st.plan;
    S.tok++; S.counter = V.counter(ex, pl); S.armed = false; S.arming = false; S.finishing = false; S.seen = 0; S.presentSince = 0; S.sideShown = false; S.sideUntil = 0; S.timerOn = false;
    setPhase('phRun');
    const cam = S.mode !== 'manual';
    $('rName').textContent = ex.name;
    $('rPlan').textContent = NEV.Ex.amountText(pl.unit, pl.perSet) + (S.counter.sides === 2 ? ' × 2 côtés' : '') + ' · série ' + (S.set + 1) + '/' + pl.sets;
    $('rSet').textContent = (steps.length > 1 ? 'Exo ' + (S.step + 1) + '/' + steps.length + ' · ' : '') + 'Série ' + (S.set + 1) + '/' + pl.sets;
    $('rCamBox').classList.remove('good');
    $('rNoCam').hidden = cam;
    $('rDemo').hidden = !cam;
    mountDemo(cam ? $('rDemo') : $('rNoDemo'), ex, 'mini');
    $('rTip').textContent = (ex.cam && ex.cam.place) || '';
    $('rCountWrap').classList.remove('pulse');
    setCount(0);
    $('rHint').textContent = '';
    $('rGo').hidden = true;
    const timed = S.counter.timed;
    $('rPlus').hidden = !(S.counter.kind === 'manual' && !timed) && !(S.mode === 'manual' && !timed);
    $('rTimer').hidden = !(S.mode === 'manual' && timed);
    $('rTimer').textContent = 'Pause';
    $('rOk').textContent = cam ? 'Je suis prêt' : 'OK — série terminée';
    $('rOk').disabled = false;
    $('rQuit').textContent = 'Quitter la séance';
    const ring = $('rRingWrap'); ring.hidden = !timed; if (timed) setRing($('rRing'), 0);
    progress();
    if (S.mode === 'manual') { $('rStatus').textContent = 'Mode sans caméra : tu comptes toi-même.'; arm(); }
    else if (!first) arm(); // séries suivantes : on enchaîne directement
  }

  function progress() {
    const before = steps.slice(0, S.step).reduce((a, s) => a + s.plan.sets, 0) + S.set;
    $('xProgTxt').textContent = (steps.length > 1 ? 'Exercice ' + (S.step + 1) + '/' + steps.length + ' · ' : '') + 'série ' + (S.set + 1) + '/' + cur().plan.sets;
    $('xProgBar').style.width = Math.round((before / totalSets) * 100) + '%';
  }

  function setCount(n) {
    const c = S.counter, tgt = c ? c.target : 0, timed = c && c.timed;
    $('rCount').textContent = Math.floor(n);
    $('rOf').textContent = '/ ' + tgt + (timed ? ' s' : '');
    if (timed) { $('rRingN').textContent = Math.floor(n); $('rRingT').textContent = 'sur ' + tgt + ' s'; setRing($('rRing'), Math.min(1, n / (tgt || 1))); }
  }
  const setRing = (el, f) => { el.style.strokeDashoffset = String(327 * (1 - f)); };
  function pulse() { const w = $('rCountWrap'); w.classList.remove('pulse'); void w.offsetWidth; w.classList.add('pulse'); }

  /* 3-2-1-GO puis le compteur démarre */
  async function arm() {
    if (S.arming || S.armed) return;
    S.arming = true; const tok = ++S.tok;
    $('rStatus').textContent = '';
    const go = $('rGo');
    for (const n of ['3', '2', '1']) {
      if (tok !== S.tok) return;
      go.hidden = false; go.textContent = n; go.style.animation = 'none'; void go.offsetWidth; go.style.animation = ''; NEV.Sfx.beep(false);
      await sleep(1000);
    }
    if (tok !== S.tok) return;
    go.textContent = 'GO'; go.style.animation = 'none'; void go.offsetWidth; go.style.animation = ''; NEV.Sfx.beep(true);
    await sleep(650);
    if (tok !== S.tok) return;
    go.hidden = true;
    S.counter.reset(); S.armed = true; S.arming = false;
    $('rOk').textContent = 'OK — série terminée';
    if (S.mode === 'manual' && S.counter.timed) startManualTimer();
  }

  /* chrono manuel (exercices tenus ou en mouvement, sans caméra) */
  let manualTick = 0;
  function startManualTimer() {
    S.timerOn = true; let last = performance.now();
    clearInterval(manualTick);
    manualTick = setInterval(() => {
      const now = performance.now(), dt = (now - last) / 1000; last = now;
      if (!S.timerOn || S.finishing || S.phase !== 'phRun') return;
      S.counter.setCount(S.counter.secs + dt);
      const c = S.counter.secs;
      setCount(c);
      if (S.counter.sides === 2 && !S.sideShown && c >= cur().plan.perSet) { S.sideShown = true; $('rHint').textContent = 'Change de côté !'; NEV.Sfx.beep(true); }
      if (c >= S.counter.target) finishSet(true);
    }, 200);
  }
  $('rTimer').onclick = () => { S.timerOn = !S.timerOn; $('rTimer').textContent = S.timerOn ? 'Pause' : 'Reprendre'; };

  $('rPlus').onclick = () => {
    if (!S.armed || S.finishing) return;
    S.counter.add(1); const n = S.counter.reps; setCount(n); pulse(); NEV.Sfx.pop();
    if (S.counter.sides === 2 && !S.sideShown && n >= cur().plan.perSet) { S.sideShown = true; $('rHint').textContent = 'Change de côté !'; }
    if (n >= S.counter.target) finishSet(true);
  };
  $('rOk').onclick = () => finishSet(false);

  /* Appelé à chaque image de la caméra */
  function onPose(lm, t) {
    if (S.phase !== 'phRun' || !S.counter || S.finishing) return false;
    const here = !!(lm && V.present(lm));
    if (!S.armed) {
      if (!S.arming) {
        if (here) { if (!S.presentSince) S.presentSince = t; if (t - S.presentSince > 900) { $('rStatus').textContent = 'Je te vois : ne bouge pas.'; arm(); } }
        else { S.presentSince = 0; }
      }
      $('rCamBox').classList.toggle('good', here);
      return here;
    }
    const out = S.counter.update(lm, t);
    if (out.valid) S.seen++;
    setCount(out.count);
    if (out.rep) { pulse(); NEV.Sfx.pop(); }
    const c = S.counter;
    if (c.sides === 2 && !S.sideShown && out.count >= cur().plan.perSet && out.count < c.target) { S.sideShown = true; S.sideUntil = t + 4500; NEV.Sfx.beep(true); }
    $('rHint').textContent = t < S.sideUntil ? 'Change de côté !' : (out.hint || '');
    $('rCamBox').classList.toggle('good', !!(out.valid && (out.inPos || !c.timed)));
    if (out.count >= out.target) finishSet(true);
    return out.valid;
  }

  /* Fin d'une série : auto (objectif atteint) ou bouton OK */
  function finishSet(auto) {
    if (S.phase !== 'phRun' || S.finishing) return;
    if (!S.armed) { if (S.mode !== 'manual') { arm(); return; } }
    S.finishing = true; S.tok++; clearInterval(manualTick);
    const c = S.counter, got = c.timed ? c.secs : c.reps, target = c.target, reached = got >= target - 0.01;
    let reps, verified;
    if (S.mode === 'manual') { reps = target; verified = false; }
    else if (S.mode === 'sim') { reps = reached ? target : Math.round(got); verified = false; }
    else { reps = reached ? target : Math.round(got); verified = (reached || auto) && (c.kind !== 'manual' || S.seen >= 20); if (!reached) verified = false; }
    S.totalReps += reps; S.setsDone++; S.verifiedAll = S.verifiedAll && verified;
    setCount(reached ? target : got);
    $('rCamBox').classList.add('good');
    const f = $('rOkFlash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
    NEV.Sfx.ok(); NEV.Fx.flash('#3ddc84', 500);
    setTimeout(afterSet, 1050);
  }

  function afterSet() {
    const st = cur();
    if (S.set + 1 < st.plan.sets) {
      S.set++;
      const nxt = NEV.Ex.amountText(st.plan.unit, st.plan.perSet);
      restScreen({ sec: st.plan.rest, kick: 'Repos', title: 'Respire, secoue les bras', next: 'Série suivante : ' + (S.set + 1) + '/' + st.plan.sets + ' — ' + nxt, then: () => beginSet(false) });
    } else if (S.step + 1 < steps.length) {
      S.step++; S.set = 0;
      const ns = cur();
      restScreen({ sec: 25, kick: 'Exercice suivant (' + (S.step + 1) + '/' + steps.length + ')', title: ns.ex.name, next: planText(ns.plan) + '. ' + ((ns.ex.cam && ns.ex.cam.place) || ''), demo: ns.ex, then: () => beginSet(true), btn: 'C\'est parti' });
    } else {
      NEV.Vision.stop();
      showOk();
    }
  }

  /* ---------- 5. Repos ---------- */
  let restTick = 0;
  function restScreen(o) {
    setPhase('phRest'); progress();
    $('tKick').textContent = o.kick; $('tTitle').textContent = o.title; $('tNext').textContent = o.next || '';
    $('tSkip').textContent = o.btn || 'C\'est reparti'; $('tSkip').hidden = false;
    const d = $('tDemo'); d.hidden = !o.demo; if (o.demo) mountDemo(d, o.demo, 'next');
    const t0 = performance.now(), total = o.sec * 1000; let lastN = -1;
    clearInterval(restTick);
    const end = () => { clearInterval(restTick); NEV.Sfx.beep(true); o.then(); };
    const tick = () => {
      const left = Math.max(0, total - (performance.now() - t0)), n = Math.ceil(left / 1000);
      $('tN').textContent = n; setRing($('tRing'), 1 - left / total);
      if (n !== lastN) { lastN = n; if (n > 0 && n <= 3) NEV.Sfx.beep(false); }
      if (left <= 0) end();
    };
    tick(); restTick = setInterval(tick, 200);
    $('tSkip').onclick = end;
  }

  /* Carte spéciale « Repos » : respiration guidée, pas d'exercice */
  function startRest() {
    S.mode = 'manual'; $('xProg').hidden = true;
    const total = card.plan.perSet * 1000, t0 = performance.now(); let phase = '';
    setPhase('phRest');
    $('tKick').textContent = 'Carte spéciale · Repos'; $('tSkip').hidden = true; $('tNext').textContent = 'Inspire 4 secondes par le nez, expire 6 secondes par la bouche. Relâche les épaules.';
    const d = $('tDemo'); d.hidden = false; mountDemo(d, steps[0].ex, 'next');
    clearInterval(restTick);
    restTick = setInterval(() => {
      const el = performance.now() - t0, left = Math.max(0, total - el), cyc = el % 10000, ph = cyc < 4000 ? 'Inspire…' : 'Expire…';
      if (ph !== phase) { phase = ph; $('tTitle').textContent = ph; }
      $('tN').textContent = Math.ceil(left / 1000); setRing($('tRing'), 1 - left / total);
      if (left <= 0) { clearInterval(restTick); showOk(); }
    }, 200);
  }

  /* ---------- 6. Le grand OK vert ---------- */
  function showOk() {
    setPhase('phOk'); $('xProg').hidden = true;
    NEV.Sfx.win();
    $('oTitle').textContent = isRest ? 'Repos terminé' : 'Séance terminée !';
    const bits = steps.map((s) => s.plan.sets + ' × ' + NEV.Ex.amountText(s.plan.unit, s.plan.perSet) + ' ' + s.ex.name.toLowerCase());
    let t = isRest ? 'Ton corps construit pendant qu\'il se repose. Bien joué.' : bits.slice(0, 4).join(' · ') + (bits.length > 4 ? ' …' : '');
    if (!isRest && !S.verifiedAll) t += ' — Séance non vérifiée par la caméra : l\'XP est divisée par 2.';
    $('oTxt').textContent = t;
    setTimeout(() => $('oBtn').focus(), 300);
  }
  $('oBtn').onclick = finalize;

  /* ---------- 7. Enregistrement + bilan ---------- */
  async function finalize() {
    if (S.quit) return; S.quit = true; $('oBtn').disabled = true;
    const hb = NEV.heroFromXp(p.progress.xp).stage.n;
    const streakBefore = p.progress.streak;
    let res;
    if (SRC === 'combo') res = NEV.player.completeCombo(p, combo, { reps: S.totalReps, sets: S.setsDone, verified: S.verifiedAll });
    else res = NEV.player.complete(p, { reps: S.totalReps, sets: S.setsDone, verified: S.verifiedAll, src: SRC, rest: isRest });
    const fx = NEV.Rewards.run(p, user);
    NEV.player.save(p);
    NEV.track && NEV.track('done', { src: SRC, id: SRC === 'combo' ? combo.id : (card && card.id), reps: S.totalReps, sets: S.setsDone, verified: S.verifiedAll, xp: res.xpGain });
    const ha = NEV.heroFromXp(p.progress.xp);
    showDone({ res, fx, hb, ha, streakBefore });
  }

  function showDone(o) {
    setPhase('phDone');
    $('dKick').textContent = isRest ? 'Repos validé' : 'Séance validée';
    $('dTitle').textContent = o.ha.stage.n > o.hb ? 'Tu as évolué : ' + o.ha.stage.name + ' !' : (isRest ? 'Récupération réussie' : 'Bien joué, ' + user.pseudo + ' !');
    $('dStats').innerHTML = [
      ['+' + o.res.xpGain, 'XP gagnés', 'gold'],
      [isRest ? '—' : S.totalReps, isRest ? 'Repos' : (steps.some((s) => s.plan.unit.indexOf('sec') === 0) ? 'rép. / secondes' : 'répétitions'), ''],
      [p.progress.streak, 'Série (jours)', '']
    ].map((s) => '<div class="' + s[2] + '"><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div>').join('');
    $('dHeroLine').textContent = o.ha.next ? p.progress.xp + ' / ' + o.ha.next.xp + ' XP avant « ' + o.ha.next.name + ' »' : p.progress.xp + ' XP · palier maximum';
    $('dBar').style.width = Math.round(o.ha.pct * 100) + '%';
    heroCtl = NEV.Hero.mount($('dHero'), { stage: o.hb, aura: p.aura });
    if (o.ha.stage.n > o.hb) setTimeout(() => { heroCtl.powerUp(); heroCtl.growTo(o.ha.stage.n); NEV.Sfx.boom(4); NEV.Fx.flash('#ff8a3d', 900); }, 900);
    else setTimeout(() => heroCtl.powerUp(), 500);
    const acts = ['<a class="btn ok" href="accueil.html" data-go>Retour à l\'accueil</a>'];
    if (SRC === 'daily') acts.push('<a class="btn ghost" href="specialisation.html" data-go>Un bonus en Spécialisation</a>');
    else acts.push('<a class="btn ghost" href="specialisation.html" data-go>Spécialisation</a>');
    acts.push('<a class="btn ghost" href="recompenses.html" data-go>Mes récompenses</a>');
    $('dActions').innerHTML = acts.join('');
    NEV.Sfx.win(); NEV.Fx.burst(innerWidth / 2, innerHeight / 3, { n: 40, power: .8, colors: ['#3ddc84', '#ffd45e', '#ff8a3d'] });
    const me = document.getElementById('meStreak'); if (me) me.textContent = p.progress.streak;
    if (o.fx && (o.fx.badges.length || o.fx.refs.length)) setTimeout(() => NEV.Rewards.popups({ daily: null, refs: o.fx.refs, badges: o.fx.badges }), 2600);
  }

  function showAlready() {
    $('xSrc').textContent = SRC === 'spe' ? 'Spécialisation' : 'Exercice du jour'; $('xTitle').textContent = 'Déjà validé';
    setPhase('phDone'); $('dKick').textContent = 'Séance validée'; $('dTitle').textContent = 'C\'est fait pour cette carte';
    const r = slot.result || {};
    $('dStats').innerHTML = [['+' + (r.xpGain || 0), 'XP gagnés', 'gold'], [r.reps != null ? r.reps : '—', 'répétitions', ''], [p.progress.streak, 'Série (jours)', '']].map((s) => '<div class="' + s[2] + '"><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div>').join('');
    const h = NEV.heroFromXp(p.progress.xp); $('dHeroLine').textContent = p.progress.xp + ' XP · ' + h.stage.name; $('dBar').style.width = Math.round(h.pct * 100) + '%';
    NEV.Hero.mount($('dHero'), { stage: h.stage.n, aura: p.aura });
    $('dActions').innerHTML = '<a class="btn ok" href="accueil.html" data-go>Retour à l\'accueil</a><a class="btn ghost" href="specialisation.html" data-go>Spécialisation</a>';
  }

  /* ---------- 8. Quitter ---------- */
  let quitArmed = 0;
  $('rQuit').onclick = () => {
    if (!quitArmed) { $('rQuit').textContent = 'Sûr ? Rien ne sera enregistré'; quitArmed = setTimeout(() => { quitArmed = 0; $('rQuit').textContent = 'Quitter la séance'; }, 3500); return; }
    NEV.Vision.stop(); NEV.go(SRC === 'daily' ? 'accueil.html' : 'specialisation.html');
  };
  window.addEventListener('pagehide', () => { try { NEV.Vision.stop(); } catch (e) { /* ignoré */ } });
  window.__nevX = { S, steps, finishSet, onPose }; // crochet de test
})();
