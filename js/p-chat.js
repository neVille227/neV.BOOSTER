/* neV.BOOSTER — Chat joueurs / coach */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc;
  const ctx = await NEV.boot('chat'); if (!ctx) return;
  const user = ctx.user;
  let room = (location.hash === '#coach') ? 'coach' : 'global', timer = 0, lastSig = '';
  const NOTE = { global: 'Salon public : tous les joueurs connectés peuvent lire ces messages.', coach: 'Conversation privée entre toi et le coach. Il répond dès que possible.' };

  function tabs() {
    document.querySelectorAll('[data-room]').forEach((b) => { const on = b.dataset.room === room; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $('note').textContent = NOTE[room] + (NEV.cloud.mode === 'server' ? '' : ' (Mode démo : les messages restent sur cet appareil.)');
  }
  const fmt = (t) => { const d = new Date(t); return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); };
  async function load(force) {
    const list = await NEV.cloud.chat.list(room);
    const sig = room + '|' + list.length + '|' + (list.length ? list[list.length - 1].id || list[list.length - 1].t : '');
    if (!force && sig === lastSig) return;
    lastSig = sig;
    const box = $('msgs'), atEnd = box.scrollHeight - box.scrollTop - box.clientHeight < 80 || force;
    box.innerHTML = list.length ? list.map((m) => {
      const me = m.uid === user.id, adm = m.role === 'admin';
      const rep = (!me && !adm && room === 'global' && NEV.cloud.mode === 'server') ? '<button type="button" class="rep" data-rep="' + esc(m.id) + '" aria-label="Signaler ce message">Signaler</button>' : '';
      return '<div class="m' + (me ? ' me' : '') + (adm ? ' adm' : '') + '"><span class="who">' + esc(adm ? '🛡️ Coach' : me ? 'Toi' : m.name) + ' · ' + fmt(m.t) + '</span><span class="tx">' + esc(m.text) + '</span>' + rep + '</div>';
    }).join('') : '<p class="empty">' + (room === 'coach' ? 'Écris ton premier message au coach.' : 'Personne n\'a encore écrit. Lance la conversation !') + '</p>';
    if (atEnd) box.scrollTop = box.scrollHeight;
    const gate = NEV.cloud.chat.gate;
    $('t').disabled = !!gate; $('f').querySelector('button').disabled = !!gate; $('t').placeholder = gate ? 'Écriture indisponible pour le moment' : 'Écris ton message…';
    if (gate) $('err').textContent = gate; else if ($('err').textContent && $('err').dataset.gate) $('err').textContent = '';
    $('err').dataset.gate = gate ? '1' : '';
  }
  $('msgs').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-rep]'); if (!b) return;
    if (!window.confirm('Signaler ce message au coach ? Il sera examiné.')) return;
    b.disabled = true; const r = await NEV.cloud.chat.report(b.dataset.rep, 'signalé par un joueur');
    b.textContent = r.ok ? 'Signalé ✓' : 'Échec'; if (!r.ok) $('err').textContent = r.error;
  });
  function poll() { clearInterval(timer); timer = setInterval(() => { if (!document.hidden) load(false); }, 5000); }

  document.querySelector('[role=tablist]').addEventListener('click', (e) => { const b = e.target.closest('[data-room]'); if (b) { room = b.dataset.room; history.replaceState(null, '', room === 'coach' ? '#coach' : '#'); tabs(); lastSig = ''; load(true); } });
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const t = $('t').value; $('err').textContent = '';
    const r = await NEV.cloud.chat.send(room, t);
    if (!r.ok) { $('err').textContent = r.error || 'Message non envoyé.'; return; }
    $('t').value = ''; load(true);
  });
  window.addEventListener('storage', () => load(false));
  tabs(); await load(true); poll();
})();
