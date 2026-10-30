/* neV.BOOSTER — page « Gacha Box » : la boîte 3D, la main, quatre cartes, puis la séance.
   Règle d'or : le tirage est fait AVANT l'animation (NEV.Gacha.ensureBox) ; la scène ne fait que le montrer. */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, sleep = NEV.util.sleep;
  const ctx = await NEV.boot('gacha-box'); if (!ctx) return;
  const user = ctx.user, p = ctx.p;
  NEV.player.ensureDay(p); NEV.player.save(p);
  const A = NEV.BoxAudio, G = NEV.Gacha;
  const qs = new URLSearchParams(location.search);
  const prefs = {
    skip: !!NEV.store.get('nev.box.skip', false) || qs.get('skip') === '1',
    music: !!NEV.store.get('nev.box.music', false),
    voice: NEV.store.get('nev.box.voice', true) !== false
  };

  /* ---------- textes ---------- */
  const UNIT = { sec: 'secondes', secside: 'secondes par côté', side: 'répétitions par côté' };
  const SHORT = { sec: 's', secside: 's/côté', side: 'rép./côté' };
  const tierName = (t) => (NEV.Ex.TIER_NAMES && NEV.Ex.TIER_NAMES[t]) || '';
  const plural = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');
  const setsText = (pl) => plural(pl.sets, 'série') + ' de ' + NEV.Ex.amountText(pl.unit, pl.perSet);
  const flat = (box) => { const o = []; box.cards.forEach((c, i) => { (c.type === 'combo' ? c.steps : [c]).forEach((s) => o.push({ s, i })); }); return o; };
  function minutesOf(box) {
    let s = 0;
    flat(box).forEach((e) => { const pl = e.s.plan, per = pl.unit === 'sec' || pl.unit === 'secside' ? pl.perSet * (pl.unit === 'secside' ? 2 : 1) : pl.perSet * (pl.unit === 'side' ? 2 : 1) * 3.2; s += pl.sets * (per + pl.rest) + 20; });
    return Math.max(3, Math.round(s / 60));
  }
  const rarOf = (tier) => { const r = G.RARITIES[Math.max(0, Math.min(4, (tier || 1) - 1))]; return { id: r.id, tier: r.tier, code: r.code, name: r.name, color: r.color, color2: r.color2, glow: r.glow, stars: r.stars }; };
  /* la figure animée de l'exercice (SVG du site), découpée en images pour la poser sur la carte 3D */
  function artOf(ex) {
    try {
      const F = NEV.Figure; if (!F || !ex || !ex.anim) return null;
      const per = F.period(ex), K = Math.max(8, Math.min(20, Math.round(per * 9))), frames = [];
      for (let k = 0; k < K; k++) {
        const fr = F.frameSvg(ex, F.poseAt(ex, per * k / K), k / K);
        frames.push(F.stageSvg(fr.svg, { label: ex.name }).replace('style="display:block;width:100%;height:100%"', '').replace('<svg ', '<svg width="' + F.W + '" height="' + F.H + '" '));
      }
      return { frames, per, aspect: F.H / F.W };
    } catch (e) { return null; }
  }
  function sceneCards(box) {
    return box.cards.map((c) => {
      const tier = c.tier || 1, rar = rarOf(tier), diff = tierName(tier);
      if (c.type === 'combo') {
        return { kind: 'combo', title: c.name, rar, tier, diff, foil: true, planText: c.steps.length + ' exercices à la suite',
          steps: c.steps.map((s) => ({ big: s.plan.perSet, unit: SHORT[s.plan.unit] || 'rép.', sets: s.plan.sets, name: s.name })) };
      }
      const ex = NEV.Ex.byId(c.id), pl = c.plan;
      return { kind: 'single', title: c.name, rar, tier, diff, foil: tier >= 3, muscles: ex ? (ex.muscles || []).map((m) => NEV.MUSCLES_FR[m] || m) : [],
        sets: pl.sets, amount: NEV.Ex.amountText(pl.unit, pl.perSet), doubled: !!pl.doubled, art: artOf(ex), planText: plural(pl.sets, 'série') + ' × ' + NEV.Ex.amountText(pl.unit, pl.perSet) };
    });
  }
  /* la carte telle qu'elle est sur le reste du site (même code que le gacha du jour, la quête, la bibliothèque) */
  const siteCard = (c) => (c.type === 'combo' ? NEV.Card.combo(c, { diff: tierName(c.tier) }) : NEV.Card.ofCard(c, { diff: tierName(c.tier) }));
  function renderList(box) {
    $('bxCards').innerHTML = box.cards.map((c, i) => {
      const cap = c.type === 'combo'
        ? '<small>' + c.steps.length + ' exercices à la suite</small>'
        : '<small>' + esc(setsText(c.plan)) + '</small>';
      return '<li><div class="bxc">' + siteCard(c) + '</div><div class="bxc-cap"><b>' + (i + 1) + '. ' + esc(c.name) + '</b>' + cap + '</div></li>';
    }).join('');
    NEV.Card.mountArt($('bxCards'));
    $('bxCards').querySelectorAll('.bxc').forEach((el) => NEV.Card.tilt(el));
    $('bxListMeta').textContent = '· ' + flat(box).length + ' exercices · ≈ ' + minutesOf(box) + ' min';
    $('bxList').hidden = false;
  }

  /* ---------- bandeaux ---------- */
  if (p.daily.double && p.daily.status !== 'done') {
    $('bxAlert').innerHTML = '<div class="banner"><span style="font-size:1.5rem">⚠️</span><div>Journée ratée : les séries de la boîte sont <b>doublées (×2)</b> aujourd\'hui.</div></div>';
  }
  (function odds() {
    const B = G.boxCfg(), pool = G.comboPool(p).length;
    $('bxOdds').innerHTML = pool
      ? 'Chance qu\'une carte <b>Combo</b> se glisse dans ta boîte : <b>' + Math.round(B.comboChance * 100) + ' %</b> (' + pool + ' combos disponibles avec ton matériel).'
      : 'Aucun combo ne correspond à ton matériel pour l\'instant : ta boîte donnera 4 cartes Exercice. Ajoute du matériel dans tes réglages pour débloquer les combos.';
  })();

  /* ---------- son ---------- */
  const sndBtn = $('bxSnd');
  const syncSnd = () => { sndBtn.textContent = 'Son : ' + (NEV.Sfx.muted ? 'non' : 'oui'); sndBtn.setAttribute('aria-pressed', String(!NEV.Sfx.muted)); };
  sndBtn.onclick = () => { NEV.Sfx.toggle(); if (NEV.Sfx.muted) A.stopAll(); else { A.unlock(); if (prefs.music) A.music(true); } syncSnd(); };
  syncSnd();
  $('optSkip').checked = prefs.skip; $('optMusic').checked = prefs.music; $('optVoice').checked = prefs.voice;
  $('optSkip').onchange = (e) => { prefs.skip = e.target.checked; NEV.store.set('nev.box.skip', prefs.skip); };
  $('optVoice').onchange = (e) => { prefs.voice = e.target.checked; NEV.store.set('nev.box.voice', prefs.voice); if (prefs.voice) { A.unlock(); A.say('allez'); } };
  $('optMusic').onchange = (e) => { prefs.music = e.target.checked; NEV.store.set('nev.box.music', prefs.music); A.unlock(); A.music(prefs.music); };
  const hint = $('bxHint');
  const soundHint = () => { if (!A.armed && !NEV.Sfx.muted) { hint.textContent = 'Touche la scène ou un bouton pour activer le son.'; hint.hidden = false; } };
  let unlocked = false;
  const unlock = () => { if (unlocked) return; unlocked = true; A.unlock(); try { NEV.Sfx.unlock(); } catch (e) { /* ignoré */ } if (prefs.music) A.music(true); if (hint.dataset.k !== 'help') hint.hidden = true; };
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, unlock, { passive: true }));
  const say = (k) => A.say(k);

  /* ---------- étapes, état ---------- */
  const steps = Array.from($('bxSteps').children), status = $('bxStatus');
  const setStep = (n) => steps.forEach((li, i) => { li.classList.toggle('on', i + 1 === n); li.classList.toggle('done', i + 1 < n); });
  const show = (id, on) => { $(id).hidden = !on; };
  let scene = null, busy = false, box = p.box && p.box.cards ? p.box : null, fb = null;

  function buttons(state) {
    const done = box && box.status === 'done';
    show('bxOpen', state === 'fresh');
    show('bxSkip', state === 'anim');
    show('bxGo', state === 'ready' && !done);
    show('bxReplay', state === 'ready');
    show('bxAgain', (state === 'ready' || state === 'fresh') && (p.bonusDraws || 0) > 0 && !!box);
    $('bxAgain').textContent = '🎁 Nouveau tirage (' + (p.bonusDraws || 0) + ')';
    if (state === 'ready' && done && !$('bxDone')) {
      const r = box.result || {};
      $('bxAlert').innerHTML += '<div class="banner" id="bxDone"><span style="font-size:1.5rem">✅</span><div>Ta Gacha Box du jour est <b>validée</b>' + (r.xpGain ? ' (+' + r.xpGain + ' XP)' : '') + '. Reviens demain pour une nouvelle boîte. <a href="accueil.html" data-go><b>Retour à l\'accueil</b></a></div></div>';
    }
  }

  /* ---------- version 2D (sans WebGL) : les vraies cartes du site qui se retournent ---------- */
  const BANNER = ['Commun', 'Rare', 'Épique !', 'Légendaire !!', 'Mythique !!!'];
  function fallbackInit() {
    $('bxLoad').classList.add('off'); const f = $('bxFallback'); f.hidden = false;
    const n = G.boxCfg().cards || 4;
    f.innerHTML = Array.from({ length: n }, () => '<div class="bxf-card"><div class="bxf-in"><div class="bxf-face">' + NEV.Card.back() + '</div><div class="bxf-face bxf-front"></div></div></div>').join('');
    fb = Array.from(f.children);
    status.textContent = 'Ton appareil n\'affiche pas la 3D : voici la version simple.';
    setStep(1);
  }
  function fallbackFill(b) {
    b.cards.forEach((c, i) => { const el = fb[i]; if (!el) return; el.querySelector('.bxf-front').innerHTML = siteCard(c); el.style.setProperty('--g', rarOf(c.tier).glow); });
    NEV.Card.mountArt($('bxFallback'));
  }
  async function fallbackPlay(quick) {
    setStep(2); status.textContent = 'Ouverture de la boîte…'; if (!quick) await sleep(500);
    setStep(3); status.textContent = 'Tirage des cartes…'; if (!quick) await sleep(600);
    setStep(4);
    for (let i = 0; i < fb.length; i++) {
      const c = box.cards[i], r = G.RARITIES[Math.max(0, Math.min(4, (c.tier || 1) - 1))];
      if (!quick) { A.sfx('flip', { i }); try { NEV.Sfx.rise(0.5); } catch (e) { /* ignoré */ } await sleep(520); }
      fb[i].classList.add('up'); A.sfx('reveal', { tier: c.tier, combo: c.type === 'combo', i });
      if (!quick) { const q = fb[i].getBoundingClientRect(); try { NEV.Sfx.boom(c.tier); NEV.Fx.burst(q.left + q.width / 2, q.top + q.height / 2, { n: 40 + c.tier * 25, power: 0.8 + c.tier * 0.12, colors: [r.color, r.glow, '#ffd45e', '#ff8a3d', '#fff'] }); } catch (e) { /* ignoré */ } await sleep(650); }
    }
    setStep(5); status.textContent = 'Les ' + fb.length + ' cartes sont révélées.';
  }

  /* ---------- le déroulé ---------- */
  function finish(first) {
    busy = false; setStep(5);
    status.textContent = 'Tes ' + box.cards.length + ' cartes sont prêtes' + (box.status === 'done' ? '.' : ' : lance la séance !');
    hint.dataset.k = 'help'; hint.textContent = scene ? 'Glisse pour tourner la vue · touche une carte pour l\'agrandir.' : ''; hint.hidden = !scene;
    buttons('ready');
    if (first) { A.sfx('fanfare'); setTimeout(() => say('ready2'), 700); }
    setTimeout(() => $('bxGo').hidden || $('bxGo').focus({ preventScroll: true }), 300);
  }

  async function play(first) {
    if (busy) return; busy = true; unlock(); hint.hidden = true;
    buttons('anim'); say('open'); A.sfx('ui');
    try { $('bx').scrollIntoView({ block: 'start', behavior: prefs.skip ? 'auto' : 'smooth' }); } catch (e) { /* ignoré */ }
    const quick = prefs.skip;
    try {
      if (first) {
        try { box = G.ensureBox(p, user); } catch (e) { busy = false; NEV.ui.toast('Le tirage a échoué. Réessaie.'); buttons('fresh'); return; } // le tirage est fait ICI, avant toute animation
      }
      const cards = sceneCards(box);
      if (scene) { if (first) scene.setCards(cards); } else fallbackFill(box);
      renderList(box);
      if (scene) {
        if (!first) scene.resetForReplay();
        if (quick) { scene.showFinal(); } else {
          await scene.open(); say('draw');
          await scene.pullAll(); await scene.revealAll();
        }
      } else await fallbackPlay(quick);
    } catch (e) { if (scene) scene.showFinal(); }
    finish(true);
  }

  $('bxOpen').onclick = () => play(true);
  $('bxReplay').onclick = () => { buttons('anim'); play(false); };
  $('bxSkip').onclick = () => { view.classList.remove('crazy'); hideBanner(); if (scene) scene.skip(); else { fb.forEach((e) => e.classList.add('up')); } A.sfx('ui'); };
  $('bxGo').onclick = () => {
    if (!box) return; unlock(); $('bxGo').disabled = true; A.sfx('go'); say('go'); status.textContent = 'C\'est parti !';
    if (scene) scene.shake(0.9);
    NEV.go('exercice.html?src=box&auto=1', 1100);
  };
  $('bxAgain').onclick = () => {
    if (busy || !(p.bonusDraws > 0)) return;
    p.bonusDraws--; p.box = { date: NEV.util.todayStr(), cards: null, status: 'none', result: null }; NEV.player.save(p); location.reload();
  };
  window.addEventListener('pagehide', () => { try { A.stopAll(); if (scene) scene.destroy(); } catch (e) { /* ignoré */ } });

  /* ---------- effets (repris du gacha du site) ---------- */
  const view = $('bxView'), rv = $('bxReveal');
  let stageShaking = false;
  const where = (e) => { const r = view.getBoundingClientRect(); return { x: r.left + e.nx * r.width, y: r.top + e.ny * r.height }; };
  function ring(cx, cy, size, color, ms) {
    const s = document.createElement('div'); s.className = 'shock';
    s.style.cssText = 'left:' + (cx - size / 2) + 'px;top:' + (cy - size / 2) + 'px;width:' + size + 'px;height:' + size + 'px;border-color:' + color + ';box-shadow:0 0 30px ' + color;
    document.body.appendChild(s);
    if (!s.animate) { s.remove(); return; }
    s.animate([{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(4.5)', opacity: 0 }], { duration: ms || 800, easing: 'cubic-bezier(.1,.7,.3,1)' }).onfinish = () => s.remove();
  }
  function showBanner(e) {
    const r = e.rar;
    rv.style.setProperty('--c', r.color); rv.style.setProperty('--c2', r.color2); rv.style.setProperty('--g', r.glow);
    $('bxBanner').textContent = e.combo ? 'Combo !!!' : BANNER[Math.max(0, Math.min(4, e.tier - 1))];
    $('bxName').textContent = e.title; $('bxPlan').textContent = e.plan || '';
    rv.hidden = false; rv.classList.remove('on'); void rv.offsetWidth; rv.classList.add('on');
  }
  const hideBanner = () => { rv.classList.remove('on'); setTimeout(() => { if (!rv.classList.contains('on')) rv.hidden = true; }, 260); };
  function onFx(e) {
    const F = NEV.Fx; if (!F) return;
    if (e.type === 'spin') view.classList.add('crazy');
    else if (e.type === 'stream') {
      const q = where(e), rc = G.RARITIES[Math.max(0, Math.min(4, e.tier - 1))].color;
      F.stream(q.x, q.y + 40, { n: 2 + Math.round(e.k * 6), w: 50 + e.k * 80, colors: [rc, '#ff6a3d'] });
    } else if (e.type === 'boom') {
      view.classList.remove('crazy');
      const q = where(e), r = e.rar, cols = [r.color, r.glow, '#ffd45e', '#ff8a3d', '#fff'];
      F.flash(e.tier >= 5 ? '#fff' : r.glow, 800); F.shake(view, 700, 16);
      F.burst(q.x, q.y, { n: 70 + e.tier * 40, power: 1 + e.tier * 0.15, colors: cols });
      ring(q.x, q.y, 160, r.color, 900); setTimeout(() => ring(q.x, q.y, 160, '#fff', 900), 130);
      if (e.tier >= 4) setTimeout(() => F.burst(q.x, q.y, { n: 120, power: 1.4, colors: cols }), 250);
    } else if (e.type === 'banner') showBanner(e);
    else if (e.type === 'bannerOff') hideBanner();
  }

  /* ---------- démarrage de la scène ---------- */
  let T = null;
  try {
    if (!NEV.Fig3D.webgl() || qs.get('flat') === '1') throw new Error('webgl');
    T = await NEV.Fig3D.load();
    try { await Promise.race([Promise.all(['800 30px Montserrat', '900 30px Montserrat', 'italic 900 30px Montserrat', '600 30px Montserrat'].map((f) => document.fonts.load(f))), sleep(1500)]); } catch (e) { /* ignoré */ }
    scene = NEV.BoxScene.create(T, $('bxMount'), { reduced: NEV.util.reduced() });
    scene.on('step', setStep);
    scene.on('status', (t) => { status.textContent = t; });
    /* sons : ceux du gacha du site pour la montée / l'explosion, ceux de la boîte pour le reste */
    scene.on('sfx', (e) => {
      try {
        if (e.name === 'hot') NEV.Sfx.tick(0.85 + (e.i || 0) * 0.08);
        else if (e.name === 'spin') NEV.Sfx.rise(e.dur);
        else if (e.name === 'boom') NEV.Sfx.boom(e.tier);
        else A.sfx(e.name, e);
      } catch (er) { /* ignoré */ }
    });
    /* effets : les mêmes que le gacha du site (braises, éclats, flash, onde de choc, secousse) */
    scene.on('fx', onFx);
    scene.on('shake', () => { if (NEV.Fx && !stageShaking) { stageShaking = true; NEV.Fx.shake(view, 260, 5); setTimeout(() => { stageShaking = false; }, 300); } });
    scene.on('revealed', (e) => { if (e.card && e.card.kind === 'combo') say('combo'); });
    scene.on('tap', () => A.sfx('card'));
    $('bxLoad').classList.add('off');
    window.__box = { scene, p };
  } catch (e) { scene = null; fallbackInit(); }

  if (box) { // déjà tiré aujourd'hui : on montre directement l'état final
    const cards = sceneCards(box); renderList(box);
    if (scene) { scene.setCards(cards); scene.showFinal(); } else { fallbackFill(box); fb.forEach((el) => el.classList.add('up')); }
    status.textContent = box.status === 'done' ? 'Ta boîte du jour : séance validée.' : 'Ta boîte du jour est déjà tirée : voici tes cartes.';
    finish(false);
  } else {
    buttons('fresh'); setStep(1);
    if (scene) { scene.hideBox(); if (prefs.skip) { scene.showBoxOnly(); } else { $('bxOpen').disabled = true; await sleep(350); scene.appear().then(() => { $('bxOpen').disabled = false; setStep(1); }); } }
    status.textContent = 'La boîte apparaît…'; soundHint();
    if (prefs.skip && scene) status.textContent = 'La boîte est prête.';
    $('bxOpen').hidden = false; $('bxOpen').focus({ preventScroll: true });
  }
})();
