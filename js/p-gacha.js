/* neV.BOOSTER — page gacha : doigt, rotation x8, explosion, compte à rebours */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, sleep = NEV.util.sleep, reduced = NEV.util.reduced();
  const ctx = await NEV.boot('gacha'); if (!ctx) return;
  const user = ctx.user, p = ctx.p;
  NEV.player.ensureDay(p); NEV.player.save(p);
  /* Deux systèmes, une seule page : gacha.html (du jour) et gacha.html?mode=spe&zone=cou (Spécialisation). */
  const qs = new URLSearchParams(location.search);
  const MODE = qs.get('mode') === 'spe' ? 'spe' : 'daily';
  let ZONE = qs.get('zone') || 'all';
  if (MODE === 'spe') { if (p.spe.card && p.spe.zone) ZONE = p.spe.zone; if (ZONE !== 'all' && !NEV.Zones.get(ZONE)) ZONE = 'all'; }
  const slotOf = () => (MODE === 'spe' ? p.spe : p.daily);
  const zoneObj = ZONE !== 'all' ? NEV.Zones.get(ZONE) : null;
  const cautious = false;
  const stage = $('gstage'), table = $('gtable'), msg = $('gmsg');
  let busy = false, countTimer = 0;

  /* ----- son ----- */
  const sndBtn = $('snd');
  const syncSnd = () => { sndBtn.textContent = 'Son : ' + (NEV.Sfx.muted ? 'non' : 'oui'); sndBtn.setAttribute('aria-pressed', String(!NEV.Sfx.muted)); };
  sndBtn.onclick = () => { NEV.Sfx.toggle(); syncSnd(); };
  syncSnd();

  /* ----- bandeau de situation ----- */
  const d = p.daily;
  if (MODE === 'spe') {
    document.title = 'neV.BOOSTER — Gacha Spécialisation';
    document.querySelector('.eyebrow').textContent = 'Gacha Spécialisation · ' + (zoneObj ? zoneObj.name : 'Corps entier');
    $('gTitle').innerHTML = zoneObj ? 'Ta carte <em>' + esc(zoneObj.name.toLowerCase()) + '</em>' : 'Ta carte <em>corps entier</em>';
    $('gLead').textContent = 'Cinq cartes, une seule pour toi, tirée dans la zone que tu as choisie.';
  }
  if (d.double && d.status !== 'done') {
    $('gAlert').innerHTML = '<div class="banner"><span style="font-size:1.5rem">⚠️</span><div>Journée ratée : l\'enchaînement d\'aujourd\'hui est <b>doublé (×2)</b>. Le tirage reste unique.</div></div>';
  }
  /* chances de carte spéciale (Repos / Tractions) */
  (function special() {
    const si = NEV.Gacha.specialInfo(p, { mode: MODE });
    const box = $('spTxt'); if (!box) return;
    box.innerHTML = 'Deux cartes <b>spéciales</b> très rares peuvent sortir : <b>Repos</b>' + (si.tractionsOk ? ' et <b>Tractions</b>' : ' (et <b>Tractions</b> si tu coches une barre ou une table solide dans tes réglages)') + '. ' +
      (si.unlocked ? 'Tu t\'es entraîné <b>' + si.days + ' jours sur les ' + si.window + ' derniers</b> : chance de carte spéciale <b>' + si.pct + ' %</b>.'
                   : 'Il faut au moins <b>' + si.need + ' jours d\'entraînement sur les ' + si.window + ' derniers</b> pour passer de 5 % à 40 %. Pour l\'instant : ' + si.days + ' jour' + (si.days > 1 ? 's' : '') + ', donc <b>' + si.pct + ' %</b>.');
  })();

  /* ----- probabilités ----- */
  (function odds() {
    const l = NEV.levelFromMax(p.maxPushups);
    const w = NEV.Gacha.weights(l.n, cautious, p.pity || 0).pct;
    $('prob').innerHTML = NEV.Gacha.RARITIES.map((r, i) => '<div style="--c:' + r.color + '"><b>' + (w[i] >= 10 ? Math.round(w[i]) : Math.round(w[i] * 10) / 10) + ' %</b>' + r.name + '</div>').join('');
    const left = Math.max(0, NEV.Gacha.PITY_HARD - (p.pity || 0));
    $('oddsTxt').textContent = 'Niveau ' + l.n + ' « ' + l.name + ' ». ' + (left === 0 ? 'Ton prochain tirage est garanti Épique ou mieux.' : 'Tirages sans Épique d\'affilée : ' + (p.pity || 0) + '. Garantie Épique+ dans ' + left + ' tirage' + (left > 1 ? 's' : '') + ' au plus tard.') + (cautious ? ' Les cartes Légendaire et Mythique sont retirées pour les moins de 18 ans.' : '');
  })();

  /* ----- plateau de 5 cartes ----- */
  const N = NEV.Gacha.CARDS_ON_TABLE;
  table.innerHTML = Array.from({ length: N }, (_, i) => '<div class="gslot deal" style="--i:' + i + '">' + NEV.Card.back() + '</div>').join('');
  const slots = Array.from(table.children);

  /* ----- le doigt musclé ----- */
  const FINGER = '<svg viewBox="0 0 160 520" aria-hidden="true"><defs>' +
    '<linearGradient id="fk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d49a82"/><stop offset=".45" stop-color="#f3cdb8"/><stop offset="1" stop-color="#c08670"/></linearGradient>' +
    '<linearGradient id="fk2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cf957d"/><stop offset=".5" stop-color="#f0c6b0"/><stop offset="1" stop-color="#bb806a"/></linearGradient></defs>' +
    // avant-bras musclé
    '<path d="M4 -10H156C158 70 146 130 134 190C128 230 124 268 120 300H40C36 268 32 230 26 190C14 130 2 70 4 -10Z" fill="url(#fk)"/>' +
    '<path d="M118 -10C130 80 120 190 112 300H124C130 230 136 190 146 120C152 70 154 30 150 -10Z" fill="#8a4a3b" opacity=".28"/>' +
    '<path d="M22 -10C14 80 24 170 36 250" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="10" stroke-linecap="round"/>' +
    '<g fill="none" stroke="#a76a58" stroke-opacity=".6" stroke-width="3.2" stroke-linecap="round"><path d="M54 30C64 84 48 128 62 188C68 220 64 250 72 286"/><path d="M62 188C78 178 90 184 102 172"/><path d="M104 40C98 100 112 150 102 214"/><path d="M82 96C90 118 86 140 94 162"/></g>' +
    '<path d="M52 150C70 140 96 146 112 168" fill="none" stroke="#7a3d2f" stroke-opacity=".25" stroke-width="2.4"/>' +
    // bracelet bordeaux
    '<path d="M35 264H125L123 298H37Z" fill="#8e1b3c"/><path d="M35.6 272H124.4M36.6 290H123.4" stroke="#fff1f2" stroke-width="2.6"/>' +
    // dos de la main
    '<path d="M38 296H122C142 304 150 336 148 366C146 396 138 414 120 420H46C26 414 16 394 14 364C12 334 22 304 38 296Z" fill="url(#fk2)"/>' +
    '<g fill="none" stroke="#a76a58" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"><path d="M70 304C76 330 72 350 78 380"/><path d="M104 306C108 330 102 346 108 372"/></g>' +
    // pouce replié
    '<path d="M28 328C6 350 8 398 40 420C54 426 64 414 58 402C46 384 42 356 46 326Z" fill="url(#fk2)"/><path d="M40 360C42 378 48 392 56 402" fill="none" stroke="#a76a58" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"/>' +
    // doigts repliés
    '<g fill="url(#fk)" stroke="#b27663" stroke-opacity=".6" stroke-width="2"><rect x="102" y="392" width="24" height="58" rx="12"/><rect x="123" y="388" width="22" height="48" rx="11"/></g>' +
    '<g fill="#fff" opacity=".22"><ellipse cx="114" cy="400" rx="6" ry="4"/><ellipse cx="134" cy="396" rx="5" ry="3.6"/></g>' +
    // index tendu
    '<path d="M56 396V486C56 505 65 514 79 514C93 514 102 505 102 486V396Z" fill="url(#fk)" stroke="#b27663" stroke-opacity=".55" stroke-width="2"/>' +
    '<path d="M84 400V490" stroke="#fff" stroke-opacity=".16" stroke-width="7" stroke-linecap="round"/>' +
    '<g stroke="#a76a58" stroke-opacity=".65" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M63 440H95"/><path d="M64 466H94"/></g>' +
    '<path d="M66 486C66 478 92 478 92 486V499C92 509 66 509 66 499Z" fill="#f7dcd2" stroke="#d9a998" stroke-width="1.6"/>' +
    '</svg>';
  const finger = document.createElement('div');
  finger.className = 'gfinger'; finger.innerHTML = FINGER; finger.style.transformOrigin = '50% 100%';
  stage.appendChild(finger);
  let Fw = 110, Fh = 357, curT = '';
  function sizeFinger() {
    Fw = stage.clientWidth < 560 ? 72 : 112; Fh = Fw * 520 / 160;
    finger.style.width = Fw + 'px'; finger.style.height = Fh + 'px';
    if (!curT) { curT = 'translate(' + (stage.clientWidth / 2 - Fw / 2) + 'px,' + (-Fh - 60) + 'px)'; finger.style.transform = curT; }
  }
  sizeFinger();
  const rel = (el) => { const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top, w: r.width, h: r.height, l: r.left - s.left }; };
  function move(x, y, dur, ease, rot) {
    const to = 'translate(' + (x - Fw / 2).toFixed(1) + 'px,' + (y - Fh).toFixed(1) + 'px) rotate(' + (rot || 0) + 'deg)';
    const a = finger.animate([{ transform: curT || to }, { transform: to }], { duration: dur, easing: ease || 'ease-in-out', fill: 'forwards' });
    curT = to;
    return a.finished.then(function () { finger.style.transform = to; a.cancel(); });
  }

  /* ----- étapes du tirage ----- */
  function hot(i) { slots.forEach((s, k) => s.classList.toggle('hot', k === i)); }
  async function fingerSweep(pick) {
    msg.textContent = 'Le doigt choisit…';
    sizeFinger();
    const hoverY = (i) => rel(slots[i].querySelector('.tcard')).y - 18;
    await move(rel(slots[2]).x, hoverY(2), 800, 'cubic-bezier(.2,.8,.3,1)');
    const seq = []; let prev = 2;
    const hops = 9 + NEV.rng.int(3);
    for (let i = 0; i < hops; i++) { let k; do { k = NEV.rng.int(N); } while (k === prev); seq.push(k); prev = k; }
    if (seq[seq.length - 1] === pick) seq.push((pick + 2 + NEV.rng.int(2)) % N);
    seq.push(pick);
    for (let i = 0; i < seq.length; i++) {
      const k = seq[i], dur = 130 + Math.pow(i / (seq.length - 1), 2) * 520;
      const r = rel(slots[k]);
      hot(-1);
      await move(r.x, hoverY(k), dur, 'cubic-bezier(.5,0,.3,1)', (r.x - stage.clientWidth / 2) / stage.clientWidth * 8);
      hot(k); NEV.Sfx.tick(0.8 + i * 0.07);
      if (i < seq.length - 1) await sleep(Math.max(0, 80 + i * 22));
    }
    msg.textContent = 'Cette carte…';
    NEV.Sfx.thud(); await sleep(520); NEV.Sfx.thud(); await sleep(620);
    // le coup de doigt
    const r = rel(slots[pick].querySelector('.tcard'));
    await move(r.x, r.y + 30, 130, 'cubic-bezier(.6,0,1,.6)');
    NEV.Sfx.thud(); NEV.Fx.shake(stage, 380, 7);
    const sr = slots[pick].getBoundingClientRect();
    ring(sr.left + sr.width / 2, sr.top + 40, 120, '#ffd45e', 600);
    NEV.Fx.burst(sr.left + sr.width / 2, sr.top + 40, { n: 26, power: .6, colors: ['#ffd45e', '#ff8a3d'] });
    await sleep(160);
    await move(r.x, -Fh - 60, 650, 'cubic-bezier(.5,0,.9,.5)');
  }

  function ring(cx, cy, size, color, ms) {
    const s = document.createElement('div'); s.className = 'shock';
    s.style.cssText = 'left:' + (cx - size / 2) + 'px;top:' + (cy - size / 2) + 'px;width:' + size + 'px;height:' + size + 'px;border-color:' + color + ';box-shadow:0 0 30px ' + color;
    document.body.appendChild(s);
    if (!s.animate) { s.remove(); return; }
    s.animate([{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(4.5)', opacity: 0 }], { duration: ms || 800, easing: 'cubic-bezier(.1,.7,.3,1)' }).onfinish = () => s.remove();
  }

  async function spin(card, r) {
    const pick = card.pick, slot = slots[pick], cardEl = slot.querySelector('.tcard');
    slots.forEach((s, i) => { if (i !== pick) s.classList.add('out'); });
    hot(-1);
    await sleep(520);
    const br = cardEl.getBoundingClientRect();
    const sp = document.createElement('div'); sp.className = 'spin';
    sp.style.cssText = 'left:' + br.left + 'px;top:' + br.top + 'px;width:' + br.width + 'px;height:' + br.height + 'px';
    sp.innerHTML = '<div class="glowring"></div><div class="flip"><div class="face">' + NEV.Card.back() + '</div></div>';
    document.body.appendChild(sp); slot.classList.add('gone');
    const flip = sp.querySelector('.flip'), glow = sp.querySelector('.glowring');
    // vers le centre de l'écran, en grand
    const sr = stage.getBoundingClientRect();
    const cx = sr.left + sr.width / 2, cy = Math.max(sr.top + sr.height * 0.46, 220);
    const scale = Math.min(1.7, Math.min(sr.width * 0.5, 300) / br.width);
    const tx = cx - (br.left + br.width / 2), ty = cy - (br.top + br.height / 2);
    msg.textContent = '';
    await sp.animate([{ transform: 'none' }, { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')' }], { duration: 650, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' }).finished;
    // la rotation folle : 8 tours (8 × 360°), de plus en plus vite
    stage.classList.add('crazy');
    NEV.Sfx.rise(2.9);
    const T = 2900;
    flip.animate([
      { transform: 'rotateY(0deg) rotateZ(0deg) scale(1)', offset: 0, easing: 'cubic-bezier(.5,0,.9,.7)' },
      { transform: 'rotateY(720deg) rotateZ(-5deg) scale(1.08)', offset: .45, easing: 'cubic-bezier(.4,0,1,.8)' },
      { transform: 'rotateY(1980deg) rotateZ(6deg) scale(1.18)', offset: .8 },
      { transform: 'rotateY(2880deg) rotateZ(-3deg) scale(1.3)', offset: 1 }
    ], { duration: T, fill: 'forwards' });
    sp.animate([{ filter: 'hue-rotate(0deg) brightness(1)' }, { filter: 'hue-rotate(540deg) brightness(1.3)', offset: .7 }, { filter: 'hue-rotate(1100deg) brightness(2.1)' }], { duration: T, fill: 'forwards' });
    glow.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.5)' }], { duration: T, fill: 'forwards', easing: 'ease-in' });
    const t0 = performance.now();
    const iv = setInterval(function () {
      const k = (performance.now() - t0) / T;
      NEV.Fx.stream(cx, cy + 40, { n: 2 + Math.round(k * 6), w: 50 + k * 80, colors: [r.color, '#ff6a3d'] });
      if (k > .4 && Math.random() < .5) NEV.Fx.shake(stage, 200, 2 + k * 10);
    }, 70);
    await sleep(T);
    clearInterval(iv);
    return { sp: sp, cx: cx, cy: cy, br: br, scale: scale };
  }

  function shatter(o, r, tier) {
    const w = o.br.width * o.scale * 1.3, h = o.br.height * o.scale * 1.3, x0 = o.cx - w / 2, y0 = o.cy - h / 2;
    const C = 4, R = 6, pts = [];
    for (let j = 0; j <= R; j++) { pts[j] = []; for (let i = 0; i <= C; i++) pts[j][i] = [i / C * 100 + (i && i < C ? (Math.random() - .5) * 14 : 0), j / R * 100 + (j && j < R ? (Math.random() - .5) * 10 : 0)]; }
    const tris = [];
    for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) { const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i], d = pts[j + 1][i + 1]; tris.push([a, b, c], [b, d, c]); }
    tris.forEach(function (t) {
      const s = document.createElement('div'); s.className = 'shard';
      s.style.cssText = 'left:' + x0 + 'px;top:' + y0 + 'px;width:' + w + 'px;height:' + h + 'px;clip-path:polygon(' + t.map(function (q) { return q[0].toFixed(1) + '% ' + q[1].toFixed(1) + '%'; }).join(',') + ');background:linear-gradient(' + Math.round(Math.random() * 360) + 'deg,#f6d58a,#8e1b3c 45%,' + r.color + ');';
      document.body.appendChild(s);
      const cxp = (t[0][0] + t[1][0] + t[2][0]) / 3 - 50, cyp = (t[0][1] + t[1][1] + t[2][1]) / 3 - 50;
      const dist = 160 + Math.random() * (260 + tier * 60), ang = Math.atan2(cyp, cxp) + (Math.random() - .5) * .8;
      if (!s.animate) { s.remove(); return; }
      s.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + Math.cos(ang) * dist + 'px,' + (Math.sin(ang) * dist + 120 + Math.random() * 160) + 'px) rotate(' + (Math.random() - .5) * 900 + 'deg) scale(.3)', opacity: 0 }], { duration: 900 + Math.random() * 700, easing: 'cubic-bezier(.1,.6,.4,1)' }).onfinish = function () { s.remove(); };
    });
  }

  async function explode(o, card, r) {
    stage.classList.remove('crazy');
    o.sp.remove();
    NEV.Sfx.boom(card.tier);
    NEV.Fx.flash(card.tier >= 5 ? '#fff' : r.glow, 800);
    NEV.Fx.shake(stage, 700, 16);
    shatter(o, r, card.tier);
    const cols = [r.color, r.glow, '#ffd45e', '#ff8a3d', '#fff'];
    NEV.Fx.burst(o.cx, o.cy, { n: 70 + card.tier * 40, power: 1 + card.tier * .15, colors: cols });
    ring(o.cx, o.cy, 160, r.color, 900); setTimeout(() => ring(o.cx, o.cy, 160, '#fff', 900), 130);
    if (card.tier >= 4) setTimeout(() => NEV.Fx.burst(o.cx, o.cy, { n: 120, power: 1.4, colors: cols }), 250);
    await sleep(900);
  }

  /* ----- révélation ----- */
  const BANNER = ['Commun', 'Rare', 'Épique !', 'Légendaire !!', 'Mythique !!!'];
  const GO = 'exercice.html?src=' + MODE + (MODE === 'spe' ? '&zone=' + encodeURIComponent(ZONE) : '');
  function showReveal(card, animate) {
    $('board').hidden = true; finger.remove();
    const ex = NEV.Ex.byId(card.id), r = NEV.Gacha.rarity(card.rarity), pl = card.plan, dn = slotOf().status === 'done';
    const rest = card.special === 'repos', tract = card.special === 'tractions';
    const rv = $('reveal'); rv.hidden = false; rv.style.setProperty('--g', r.glow); rv.style.setProperty('--c', r.color); rv.style.setProperty('--c2', r.color2);
    $('gTitle').innerHTML = dn ? (rest ? 'Repos <em>validé</em>' : 'Séance <em>validée</em>') : rest ? 'Jour de <em>repos</em>' : (MODE === 'spe' ? 'Ta carte de <em>spécialisation</em>' : 'Ta carte du <em>jour</em>');
    $('gLead').textContent = dn ? 'Bravo, reviens demain pour une nouvelle carte.' : rest ? 'Une carte spéciale très rare : ton corps construit pendant qu\'il se repose.' : 'Une seule carte par tirage. Voici ton défi.';
    const total = pl.unit === 'sec' || pl.unit === 'secside' ? '' : ' · ' + pl.total + ' au total';
    const cam = p.setup.camera && ex.cam && !rest;
    const banner = card.special ? 'Carte spéciale !!!' : BANNER[card.tier - 1];
    let plan, meta, chips;
    if (rest) {
      plan = 'Repos actif · ' + Math.round(pl.perSet / 60 * 10) / 10 + ' min de respiration lente';
      meta = 'Ta série est protégée. Aujourd\'hui, pas de séance : bois, mange bien, dors tôt. Ce jour ne compte pas comme un jour d\'entraînement.';
      chips = '<span class="chip ok">Série protégée</span><span class="chip red">+20 XP</span>';
    } else {
      plan = pl.sets + ' séries × ' + NEV.Ex.amountText(pl.unit, pl.perSet) + (pl.doubled ? ' <span class="chip red">×2 journée ratée</span>' : '');
      meta = 'Repos ' + pl.rest + ' s entre les séries' + total + '. ' + esc(NEV.Ex.equipText(ex)) + '.' + (tract ? ' La moitié de ton maximum de pompes.' : '');
      chips = '<span class="chip red">' + esc(NEV.Ex.musclesText(ex)) + '</span><span class="chip ' + (cam ? 'ok' : '') + '">' + (cam ? 'Validation par caméra' : 'Validation manuelle') + '</span>';
    }
    rv.innerHTML = '<div class="rays" aria-hidden="true"></div><div class="rc">' + NEV.Card.ofCard(card) + '</div>' +
      '<div class="rinfo"><span class="rbanner">' + banner + '</span><h2>' + esc(ex.name) + '</h2>' +
      '<div class="rplan">' + plan + '</div>' +
      '<p class="rmeta">' + meta + '</p><div class="chips">' + chips + '</div>' +
      (dn ? '<a class="btn ghost" href="quete.html" data-go>Voir la quête du jour</a>'
          : '<div id="rAct"><a class="btn ok" href="' + GO + '" data-go id="goNow">' + (rest ? 'Faire mon repos' : 'Lancer l\'exercice') + '</a></div>' + (rest ? '' : '<div class="count" id="count" hidden></div>')) + '</div>';
    NEV.Card.mountArt(rv); NEV.Card.tilt(rv.querySelector('.rc'));
    if ((p.bonusDraws || 0) > 0) {
      const bb = document.createElement('button'); bb.type = 'button'; bb.className = 'btn ghost'; bb.id = 'bonusBtn'; bb.style.marginTop = '10px';
      bb.textContent = '🎁 Utiliser un tirage bonus (' + p.bonusDraws + ')';
      bb.onclick = function () {
        if (busy) return; p.bonusDraws--;
        if (MODE === 'daily' && p.daily.status === 'done') { p.spe = { date: p.spe.date, zone: null, card: null, status: 'none', result: null }; NEV.player.save(p); location.href = 'gacha.html?mode=spe'; return; }
        const sl = slotOf(); sl.card = null; sl.status = 'none'; sl.result = null; NEV.player.save(p); location.reload();
      };
      rv.querySelector('.rinfo').appendChild(bb);
    }
    if (animate) { NEV.Sfx.win(); if (!dn && !rest) setTimeout(startCount, 1800); }
  }

  function startCount() {
    const box = $('count'); if (!box) return;
    box.hidden = false;
    box.innerHTML = '<div class="ring"><svg viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="28"/><circle class="fg" id="cFg" cx="32" cy="32" r="28"/></svg><b id="cNum">3</b></div><div><b>L\'exercice commence dans quelques secondes</b><small>Place ton téléphone et prépare-toi.</small></div><button type="button" class="btn ghost sm" id="cCancel">Pas maintenant</button>';
    let left = 3; const fg = $('cFg'), num = $('cNum'); NEV.Sfx.beep(false);
    const t0 = performance.now();
    function frame() { const k = Math.min(1, (performance.now() - t0) / 3000); fg.style.strokeDashoffset = String(176 * k); if (k < 1 && countTimer) requestAnimationFrame(frame); }
    countTimer = setInterval(function () {
      left--; if (left > 0) { num.textContent = left; NEV.Sfx.beep(false); return; }
      clearInterval(countTimer); countTimer = 0; num.textContent = 'GO'; NEV.Sfx.beep(true); NEV.go(GO, 400);
    }, 1000);
    requestAnimationFrame(frame);
    $('cCancel').onclick = function () { clearInterval(countTimer); countTimer = 0; box.innerHTML = '<small class="muted">C\'est noté. Ta carte t\'attend : reviens quand tu es prêt.</small>'; };
  }

  async function startDraw() {
    if (busy) return; busy = true;
    NEV.Sfx.unlock();
    $('gactions').hidden = true;
    const card = NEV.Gacha.ensureCard(p, user, { mode: MODE, zone: ZONE }); // tirage + enregistrement AVANT l'animation : impossible de re-tirer en rechargeant
    NEV.track('draw', { id: card.id, tier: card.tier, mode: MODE, special: card.special || null });
    const r = NEV.Gacha.rarity(card.rarity);
    if (reduced) { showReveal(card, true); return; }
    await fingerSweep(card.pick);
    const o = await spin(card, r);
    await explode(o, card, r);
    showReveal(card, true);
  }

  if (slotOf().card) {
    showReveal(slotOf().card, false);
  } else {
    $('btnDraw').addEventListener('click', startDraw);
    stage.addEventListener('pointerdown', () => NEV.Sfx.unlock(), { once: true });
  }
  window.addEventListener('resize', sizeFinger);
  window.addEventListener('pagehide', function () { clearInterval(countTimer); });
  NEV.__gacha = { startDraw: startDraw }; // point d'entrée pour les tests
})();
