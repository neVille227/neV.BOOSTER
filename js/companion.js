/* neV.BOOSTER — companion.js : bulle de chat toujours visible (point vert = actif)
   et le coach (Yuki pour les femmes, Baki pour les hommes) qui se balade au bas de l'écran. */
(function (g) {
  'use strict';
  const NEV = g.NEV, doc = g.document, esc = NEV.util.esc;
  const me = doc.getElementById('nevCompanion');
  const page = (me && me.dataset.page) || '';
  const fem = NEV.sex === 'f';
  const user = NEV.auth.current(); if (!user) return;
  const ico = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/></svg>';

  /* ---------- bulle de chat ---------- */
  if (page !== 'chat') {
    const fab = doc.createElement('button'); fab.type = 'button'; fab.className = 'chatFab'; fab.setAttribute('aria-haspopup', 'dialog'); fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-label', 'Ouvrir le chat (en ligne)');
    fab.innerHTML = ico + '<i class="on" aria-hidden="true"></i>';
    const panel = doc.createElement('section'); panel.className = 'chatPanel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Chat rapide');
    panel.innerHTML = '<header><div class="cpWho"><span class="cpAv"></span><div><b>Chat neV</b><small><i class="on"></i> En ligne</small></div></div><button type="button" class="cpX" aria-label="Fermer le chat">✕</button></header>' +
      '<div class="cpTabs" role="tablist"><button type="button" role="tab" class="on" data-room="global">Communauté</button><button type="button" role="tab" data-room="coach">Mon coach</button></div>' +
      '<div class="cpMsgs" role="log" aria-live="polite" tabindex="0"></div><form class="cpForm" autocomplete="off"><input maxlength="280" placeholder="Écris ton message…" aria-label="Message"><button type="submit" class="btn sm">Envoyer</button></form><p class="cpErr" role="alert"></p><a class="cpFull" href="chat.html" data-go>Ouvrir le chat en grand</a>';
    doc.body.appendChild(fab); doc.body.appendChild(panel);
    const msgs = panel.querySelector('.cpMsgs'), inp = panel.querySelector('input'), err = panel.querySelector('.cpErr');
    let room = 'global', timer = 0, sig = '';
    const fmt = (t) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    async function load(force) {
      let list = []; try { list = await NEV.cloud.chat.list(room); } catch (e) { /* hors ligne */ }
      const s = room + '|' + list.length + '|' + (list.length ? list[list.length - 1].id || list[list.length - 1].t : '');
      if (!force && s === sig) return; sig = s;
      msgs.innerHTML = list.length ? list.slice(-40).map((m) => { const mine = m.uid === user.id, adm = m.role === 'admin'; return '<div class="m' + (mine ? ' me' : '') + (adm ? ' adm' : '') + '"><span class="who">' + esc(adm ? 'Coach' : mine ? 'Toi' : m.name) + ' · ' + fmt(m.t) + '</span><span class="tx">' + esc(m.text) + '</span></div>'; }).join('') : '<p class="empty">' + (room === 'coach' ? 'Écris ton premier message au coach.' : 'Lance la conversation !') + '</p>';
      msgs.scrollTop = msgs.scrollHeight;
      const gate = NEV.cloud.chat.gate; inp.disabled = !!gate; err.textContent = gate || '';
    }
    const open = (v) => {
      panel.hidden = !v; fab.setAttribute('aria-expanded', String(v)); fab.classList.toggle('open', v);
      clearInterval(timer);
      if (v) { load(true); timer = setInterval(() => { if (!doc.hidden) load(false); }, 5000); setTimeout(() => inp.focus({ preventScroll: true }), 60); }
    };
    fab.addEventListener('click', () => open(panel.hidden));
    panel.querySelector('.cpX').addEventListener('click', () => { open(false); fab.focus(); });
    doc.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { open(false); fab.focus(); } });
    panel.querySelector('.cpTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-room]'); if (!b) return; room = b.dataset.room; panel.querySelectorAll('.cpTabs button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); sig = ''; load(true); });
    panel.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault(); err.textContent = '';
      const r = await NEV.cloud.chat.send(room, inp.value);
      if (!r.ok) { err.textContent = r.error || 'Message non envoyé.'; return; }
      inp.value = ''; load(true);
    });
  }

  /* ---------- le coach se balade : Yuki (version femme) ou Baki (version homme) ---------- */
  if (!NEV.util.reduced()) {
    const C = fem
      ? { name: 'Yuki', cls: 'yuki', img: 'femme/img/yuki-coach.webp', w: 405, h: 720, hello: 'Coucou ! Je suis Yuki, ta coach. Touche-moi pour un conseil.',
          tips: ['Respire par le nez, souffle par la bouche.', 'Un verre d\'eau maintenant ? Ton corps te dira merci.', 'Dos droit, épaules relâchées : bien joué.', 'Petit pas après petit pas : la régularité gagne toujours.', 'N\'oublie pas ton échauffement, 3 minutes suffisent.', 'Ta carte du jour t\'attend. On y va ?', 'Fière de toi : continue comme ça !'] }
      : { name: 'Baki', cls: 'yuki baki', img: 'img/baki.webp', w: 736, h: 1308, hello: 'Je suis Baki, ton coach. La discipline crée la liberté. Touche-moi pour un conseil.',
          tips: ['La régularité bat la motivation. Fais ta séance du jour.', 'Contrôle chaque répétition : la qualité avant la quantité.', 'Bois de l\'eau, dors bien : c\'est là que les muscles grandissent.', 'Échauffe-toi 3 minutes, tes articulations te remercieront.', 'Ta carte du jour t\'attend. Pas d\'excuses.', 'Un jour raté ? Reviens demain, plus fort.', 'Bien joué. Continue.'] };
    const w = doc.createElement('div'); w.className = C.cls; w.setAttribute('role', 'complementary'); w.setAttribute('aria-label', C.name + ', ton coach');
    w.innerHTML = '<div class="yTip" hidden></div><button type="button" class="yBtn" aria-label="' + C.name + ', ton coach : toucher pour un conseil"><img src="' + C.img + '" alt="" width="' + C.w + '" height="' + C.h + '" decoding="async"></button>';
    doc.body.appendChild(w);
    const tip = w.querySelector('.yTip'), btn = w.querySelector('.yBtn'); let ti = 0, tt = 0;
    const say = (t) => { tip.textContent = t; tip.hidden = false; clearTimeout(tt); tt = setTimeout(() => { tip.hidden = true; }, 5200); };
    btn.addEventListener('click', () => { say(C.tips[ti++ % C.tips.length]); w.classList.add('wave'); setTimeout(() => w.classList.remove('wave'), 900); });
    setTimeout(() => say(C.hello), 2500);
  }
})(window);
