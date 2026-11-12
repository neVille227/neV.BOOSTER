/* ==========================================================
   neV.BOOSTER — sfx.js : sons synthétisés (aucun fichier audio).
   Le son ne démarre qu'après un geste de l'utilisateur ; coupable.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  let ac = null, master = null, noise = null;
  const S = (NEV.Sfx = { muted: !!NEV.store.get('nev.mute', false) });

  function ctx() {
    if (S.muted) return null;
    try {
      if (!ac) {
        const AC = g.AudioContext || g.webkitAudioContext; if (!AC) return null;
        ac = new AC(); master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
        const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        noise = buf;
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    } catch (e) { return null; }
  }
  S.unlock = ctx;
  S.toggle = function () { S.muted = !S.muted; NEV.store.set('nev.mute', S.muted); if (!S.muted) ctx(); return S.muted; };

  function env(gn, t, a, d, peak) { gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(peak, t + a); gn.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function osc(type, f0, f1, t, dur, peak, dest) {
    const c = ac, o = c.createOscillator(), gn = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(gn, t, Math.min(0.02, dur / 4), dur, peak); o.connect(gn); gn.connect(dest || master); o.start(t); o.stop(t + dur + 0.05);
  }
  function nz(t, dur, f0, f1, peak, q) {
    const c = ac, s = c.createBufferSource(), fl = c.createBiquadFilter(), gn = c.createGain();
    s.buffer = noise; fl.type = 'bandpass'; fl.Q.value = q || 1.2; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(gn, t, dur * 0.35, dur * 0.65, peak); s.connect(fl); fl.connect(gn); gn.connect(master); s.start(t); s.stop(t + dur + 0.1);
  }
  S.tick = function (p) { if (!ctx()) return; const t = ac.currentTime; osc('square', 520 * (p || 1), 380 * (p || 1), t, 0.05, 0.08); };
  S.thud = function () { if (!ctx()) return; const t = ac.currentTime; osc('sine', 150, 40, t, 0.35, 0.7); nz(t, 0.18, 900, 200, 0.25, 0.8); };
  S.rise = function (dur) { if (!ctx()) return; const t = ac.currentTime; osc('sawtooth', 90, 900, t, dur, 0.12); osc('square', 45, 450, t, dur, 0.07); nz(t, dur, 300, 6000, 0.25, 0.6); };
  S.boom = function (tier) {
    if (!ctx()) return; const t = ac.currentTime;
    osc('sine', 120, 30, t, 0.9, 0.9); nz(t, 0.9, 3000, 120, 0.55, 0.5); osc('triangle', 60, 25, t, 1.2, 0.5);
    if (tier >= 3) { [523, 659, 784, 1047].forEach(function (f, i) { osc('triangle', f, f, t + 0.12 + i * 0.07, 0.9, 0.12); }); }
    if (tier >= 4) { [1568, 2093].forEach(function (f, i) { osc('sine', f, f * 1.01, t + 0.4 + i * 0.1, 1.2, 0.08); }); }
  };
  S.beep = function (last) { if (!ctx()) return; const t = ac.currentTime; osc('sine', last ? 1046 : 660, last ? 1046 : 660, t, last ? 0.35 : 0.15, 0.2); };
  S.ok = function () { if (!ctx()) return; const t = ac.currentTime; [660, 880, 1320].forEach(function (f, i) { osc('triangle', f, f, t + i * 0.09, 0.4, 0.22); }); };
  S.win = function () { if (!ctx()) return; const t = ac.currentTime; [523, 659, 784, 1047, 1319].forEach(function (f, i) { osc('triangle', f, f, t + i * 0.1, 0.7, 0.2); osc('sine', f / 2, f / 2, t + i * 0.1, 0.7, 0.12); }); };
  /* Sons de la page Gacha : grondement de la boîte, ouverture, sortie d'une carte, retournement, accord selon la rareté (N, R, SR, UR, MR). */
  S.rumble = function () { if (!ctx()) return; const t = ac.currentTime; osc('sawtooth', 60, 40, t, 0.7, 0.12); nz(t, 0.6, 200, 90, 0.12, 0.8); };
  S.open = function () { if (!ctx()) return; const t = ac.currentTime; nz(t, 0.9, 400, 5000, 0.2, 0.6); osc('sine', 110, 330, t, 1, 0.25); osc('triangle', 660, 1320, t + 0.1, 0.9, 0.08); };
  S.out = function () { if (!ctx()) return; const t = ac.currentTime; nz(t, 0.45, 700, 3500, 0.14, 0.8); };
  S.flip = function () { if (!ctx()) return; const t = ac.currentTime; nz(t, 0.18, 1500, 5000, 0.16, 0.8); osc('square', 900, 900, t + 0.12, 0.06, 0.04); };
  S.rare = function (code) {
    if (!ctx()) return; const t = ac.currentTime;
    const n = { N: 0, R: 2, SR: 3, UR: 4, MR: 5 }[code] || 0, base = { N: 392, R: 440, SR: 494, UR: 523, MR: 330 }[code] || 392;
    for (let i = 0; i < n; i++) osc('triangle', base * Math.pow(1.2599, i), 0, t + i * 0.09, 0.7, 0.11);
    if (code === 'MR') { osc('sine', 55, 30, t, 1.4, 0.4); nz(t, 0.5, 200, 2500, 0.2, 0.6); }
    if (code === 'UR') osc('sine', 80, 45, t, 0.9, 0.3);
  };
  S.pop = function () { if (!ctx()) return; const t = ac.currentTime; osc('sine', 300, 800, t, 0.12, 0.2); };
})(window);
