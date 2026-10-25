/* neV.BOOSTER — Récompenses : flammes, parrainage, auras, badges */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc, R = NEV.Rewards, I = NEV.ui.icons;
  const ctx = await NEV.boot('recompenses'); if (!ctx) return;
  const user = ctx.user, p = ctx.p;
  let heroCtl = null;
  const refresh = () => { const m = $('meFlames') || document.getElementById('meFlames'); if (m) m.textContent = p.flames; };

  function top() {
    const h = NEV.heroFromXp(p.progress.xp), l = p.login;
    $('fl').innerHTML = '<div class="bigf">' + I.flame + '<div><b>' + p.flames + '</b><span>flammes disponibles · ' + p.flamesTotal + ' gagnées au total</span></div></div>' +
      '<div class="kpi"><div><b>' + l.streak + '</b><span>Connexion d\'affilée</span></div><div><b>' + l.best + '</b><span>Record</span></div><div><b>' + p.progress.streak + '</b><span>Séances d\'affilée</span></div></div>' +
      '<ul style="margin:8px 0 0;padding-left:1.2em;color:#e8cdd2;font-size:.9rem"><li>+1 flamme chaque jour de connexion</li><li>+4 bonus tous les 7 jours d\'affilée</li><li>+10 bonus tous les 30 jours</li><li>+2 en terminant les objectifs de la <a href="quete.html" data-go style="color:var(--gold)">quête du jour</a></li></ul>';
    $('hr').innerHTML = '<div class="heroS" id="heroS"></div><p style="text-align:center;margin:8px 0 0"><b>' + esc(h.stage.name) + '</b> · ' + p.progress.xp + ' XP</p>';
    if (heroCtl && heroCtl.destroy) heroCtl.destroy();
    if (NEV.Hero) heroCtl = NEV.Hero.mount($('heroS'), { stage: h.stage.n, aura: p.aura });
  }

  function referral() {
    const url = new URL('connexion.html?ref=' + encodeURIComponent(user.code), location.href).href;
    const msg = 'Rejoins-moi sur neV.BOOSTER, le gacha fitness : une carte d\'exercice par jour ! Utilise mon code ' + user.code + ' pour gagner 20 flammes : ' + url;
    $('ref').innerHTML = '<div class="eyebrow">Ton code</div><div class="rcode"><code id="rc">' + esc(user.code) + '</code><button type="button" class="btn" id="cpC">Copier le code</button></div>' +
      '<input class="rlink" id="rl" readonly value="' + esc(url) + '" aria-label="Lien de parrainage"><div class="cta"><button type="button" class="btn ghost" id="cpL">Copier le lien</button><a class="btn ok" id="wa" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">Partager sur WhatsApp</a><button type="button" class="btn ghost" id="sh" hidden>Partager…</button></div>' +
      '<div class="kpi"><div><b>' + (user.refCount || 0) + '</b><span>Amis inscrits avec ton code</span></div><div><b>' + ((user.refCount || 0) * R.REF_BONUS) + '</b><span>Flammes gagnées grâce à eux</span></div></div>' +
      '<p class="muted rfeed" id="rf">Les badges Recruteur, Capitaine et Chef de meute récompensent tes parrainages. Le code est personnel : ne le partage qu\'avec des gens que tu connais.</p>';
    const say = (t) => { $('rf').textContent = t; };
    const copy = async (t, ok) => { try { await navigator.clipboard.writeText(t); say(ok); } catch (e) { const i = $('rl'); i.focus(); i.select(); say('Copie manuelle : sélectionne le texte et copie-le.'); } };
    $('cpC').onclick = () => copy(user.code, 'Code copié ✅');
    $('cpL').onclick = () => copy(url, 'Lien copié ✅');
    $('rl').onfocus = (e) => e.target.select();
    if (navigator.share) { $('sh').hidden = false; $('sh').onclick = () => navigator.share({ title: 'neV.BOOSTER', text: msg, url }).catch(() => {}); }
  }

  function auras() {
    $('auras').innerHTML = R.AURAS.map((a) => {
      const own = p.auras.indexOf(a.id) >= 0, on = p.aura === a.id;
      return '<div class="au' + (on ? ' on' : '') + '"><i style="background:radial-gradient(circle,' + a.c[1] + ',' + a.c[0] + ');box-shadow:0 0 22px ' + a.c[0] + (a.id === 'none' ? '00' : '99') + '"></i><b>' + esc(a.name) + '</b><small>' + (a.cost ? a.cost + ' flammes' : 'Gratuite') + '</small>' +
        (on ? '<span class="chip gold">Équipée</span>' : own ? '<button type="button" class="btn ghost sm" data-eq="' + a.id + '">Équiper</button>' : '<button type="button" class="btn sm" data-buy="' + a.id + '"' + (p.flames < a.cost ? ' disabled' : '') + '>Acheter</button>') + '</div>';
    }).join('');
  }
  $('auras').addEventListener('click', (e) => {
    const b = e.target.closest('[data-buy],[data-eq]'); if (!b) return;
    const id = b.dataset.buy || b.dataset.eq;
    const r = R.buyAura(p, id);
    if (!r.ok) { const f = $('rf'); if (f) f.textContent = r.error; return; }
    NEV.player.save(p); top(); auras(); refresh();
    if (heroCtl && heroCtl.setAura) heroCtl.setAura(p.aura);
  });

  function wall() {
    const defs = R.defs(), got = defs.filter((d) => p.badges[d.id]).length;
    $('bcount').textContent = '· ' + got + ' / ' + defs.length;
    const sorted = defs.slice().sort((a, b) => (p.badges[b.id] ? 1 : 0) - (p.badges[a.id] ? 1 : 0));
    $('bwall').innerHTML = sorted.map((d) => {
      const ok = !!p.badges[d.id], rule = R.RULES[d.rule && d.rule.t], v = rule && d.rule.t !== 'manual' ? rule.get(p) : 0, need = Number(d.rule.v) || 1;
      return '<div class="bd' + (ok ? '' : ' lock') + (d.custom ? ' cu' : '') + '" title="' + esc(d.desc) + '">' + R.badgeSVG(d, 70) + '<b>' + esc(d.name) + '</b><small>' + esc(d.desc) + '</small>' +
        (ok ? '<small>Obtenu le ' + esc(NEV.util.frDate(p.badges[d.id])) + '</small>' : d.rule.t !== 'manual' ? '<div class="meter"><i style="width:' + Math.round(Math.min(1, v / need) * 100) + '%"></i></div>' : '<small>Offert par l\'équipe</small>') + '</div>';
    }).join('');
  }
  top(); referral(); auras(); wall();
})();
