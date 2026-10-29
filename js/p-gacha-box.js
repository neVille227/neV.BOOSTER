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
  function sceneCards(box) {
    return box.cards.map((c) => {
      if (c.type === 'combo') {
        return { kind: 'combo', title: c.name, tag: c.steps.length + ' exos', tier: c.tier, accent: '#b9a0ff', level: tierName(c.tier),
          steps: c.steps.map((s) => ({ big: s.plan.perSet, unit: (SHORT[s.plan.unit] || 'rép.') + ' × ' + s.plan.sets, name: s.name })) };
      }
      const ex = NEV.Ex.byId(c.id), r = G.RARITIES[Math.max(0, Math.min(4, (c.tier || 1) - 1))];
      return { kind: 'single', title: c.name, tag: c.rarityName || r.name, tier: c.tier, accent: r.color, amount: c.plan.perSet, unit: UNIT[c.plan.unit] || 'répétitions',
        sub: plural(c.plan.sets, 'série'), muscles: ex ? NEV.Ex.musclesText(ex) : '', level: tierName(c.tier) };
    });
  }
  function renderList(box) {
    $('bxCards').innerHTML = box.cards.map((c, i) => {
      if (c.type === 'combo') {
        return '<li class="combo"><i>' + (i + 1) + '</i><b>★ Combo · ' + esc(c.name) + '</b><small>' + c.steps.length + ' exercices à la suite · ' + esc(tierName(c.tier)) + '</small><ul>' +
          c.steps.map((s) => '<li style="all:unset;display:list-item">' + esc(s.name) + ' — ' + esc(setsText(s.plan)) + '</li>').join('') + '</ul></li>';
      }
      const ex = NEV.Ex.byId(c.id);
      return '<li><i>' + (i + 1) + '</i><b>' + esc(c.name) + '</b><small>' + esc(tierName(c.tier)) + ' · ' + esc(setsText(c.plan)) + (ex && NEV.Ex.musclesText(ex) ? ' · ' + esc(NEV.Ex.musclesText(ex)) : '') + '</small></li>';
    }).join('');
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
  const unlock = () => { if (unlocked) return; unlocked = true; A.unlock(); if (prefs.music) A.music(true); if (hint.dataset.k !== 'help') hint.hidden = true; };
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

  /* ---------- version 2D (sans WebGL) ---------- */
  function fallbackInit() {
    $('bxLoad').classList.add('off'); const f = $('bxFallback'); f.hidden = false;
    const n = G.boxCfg().cards || 4;
    f.innerHTML = Array.from({ length: n }, () => '<div class="bxf-card"><div class="bxf-back">nV</div><div class="bxf-front"></div></div>').join('');
    fb = Array.from(f.children);
    status.textContent = 'Ton appareil n\'affiche pas la 3D : voici la version simple.';
    setStep(1);
  }
  function fallbackFill(cards) {
    cards.forEach((d, i) => {
      const el = fb[i]; if (!el) return; el.classList.toggle('combo', d.kind === 'combo');
      const front = el.querySelector('.bxf-front');
      front.innerHTML = '<small>' + esc(d.kind === 'combo' ? '★ Combo' : d.tag) + '</small><b>' + esc(d.title) + '</b>' +
        (d.kind === 'combo' ? '<span>' + d.steps.map((s) => esc(s.big + ' ' + s.unit + ' ' + s.name)).join('<br>') + '</span>' : '<em>' + esc(d.amount) + '</em><span>' + esc(d.unit) + ' · ' + esc(d.sub) + '</span>') + '<span>' + esc(d.level || '') + '</span>';
    });
  }
  async function fallbackPlay(quick) {
    setStep(2); status.textContent = 'Ouverture de la boîte…'; if (!quick) await sleep(500);
    setStep(3); status.textContent = 'Tirage des cartes…'; if (!quick) await sleep(600);
    setStep(4);
    for (let i = 0; i < fb.length; i++) { fb[i].classList.add('up'); A.sfx('flip', { i }); A.sfx('reveal', { tier: box.cards[i].tier, combo: box.cards[i].type === 'combo', i }); if (!quick) await sleep(650); }
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
    const quick = prefs.skip;
    try {
      if (first) {
        try { box = G.ensureBox(p, user); } catch (e) { busy = false; NEV.ui.toast('Le tirage a échoué. Réessaie.'); buttons('fresh'); return; } // le tirage est fait ICI, avant toute animation
      }
      const cards = sceneCards(box);
      if (scene) { if (first) scene.setCards(cards); } else fallbackFill(cards);
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
  $('bxSkip').onclick = () => { if (scene) scene.skip(); else { fb.forEach((e) => e.classList.add('up')); } A.sfx('ui'); };
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

  /* ---------- démarrage de la scène ---------- */
  let T = null;
  try {
    if (!NEV.Fig3D.webgl() || qs.get('flat') === '1') throw new Error('webgl');
    T = await NEV.Fig3D.load();
    try { await Promise.race([Promise.all(['800 30px Montserrat', '900 30px Montserrat', 'italic 900 30px Montserrat', '600 30px Montserrat'].map((f) => document.fonts.load(f))), sleep(1500)]); } catch (e) { /* ignoré */ }
    scene = NEV.BoxScene.create(T, $('bxMount'), { reduced: NEV.util.reduced() });
    scene.on('step', setStep);
    scene.on('status', (t) => { status.textContent = t; });
    scene.on('sfx', (e) => A.sfx(e.name, e));
    scene.on('revealed', (e) => { if (e.card && e.card.kind === 'combo') say('combo'); });
    scene.on('tap', () => A.sfx('card'));
    $('bxLoad').classList.add('off');
    window.__box = { scene, p };
  } catch (e) { scene = null; fallbackInit(); }

  if (box) { // déjà tiré aujourd'hui : on montre directement l'état final
    const cards = sceneCards(box); renderList(box);
    if (scene) { scene.setCards(cards); scene.showFinal(); } else { fallbackFill(cards); fb.forEach((el) => el.classList.add('up')); }
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
