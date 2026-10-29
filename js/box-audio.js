/* ==========================================================
   neV.BOOSTER — box-audio.js
   Les sons de la Gacha Box : bruitages synthétisés (aucun fichier) + une petite voix de motivation
   (media/box-voix.mp3 : voix synthétique Piper « siwis », licence CC BY 4.0, en français).
   Le son respecte le bouton « Son » du site (NEV.Sfx.muted) et ne démarre qu'après un geste de l'utilisateur.
   API : NEV.BoxAudio.unlock() · .sfx(nom, info) · .say(clé) · .music(true|false) · .stopAll()
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});

  /* Positions des phrases dans media/box-voix.mp3 : [début, durée] en secondes (outil : _dev/voice_box.py). */
  const VOICE = { "ready": [0.0, 0.755], "open": [1.005, 1.877], "draw": [3.132, 2.101], "combo": [5.483, 2.161], "ready2": [7.894, 2.187], "go": [10.331, 1.319], "position": [11.9, 1.148], "next": [13.298, 1.125], "allez": [14.673, 1.054], "moitie": [15.976, 1.758], "tiensbon": [17.984, 1.53], "last": [19.764, 2.08], "bien": [22.094, 0.681], "super": [23.025, 1.791], "finish": [25.066, 2.676] };
  const VOICE_URL = 'media/box-voix.mp3';

  let ac = null, master = null, noiseBuf = null, voiceBuf = null, voiceLoading = null, voiceNode = null, musicNodes = null, armed = false;
  const muted = () => !!(NEV.Sfx && NEV.Sfx.muted);
  const voiceOn = () => { try { return NEV.store.get('nev.box.voice', true) !== false; } catch (e) { return true; } };

  function ctx() {
    if (muted() || !armed) return null; // pas de son avant un geste de l'utilisateur
    try {
      if (!ac) {
        const AC = g.AudioContext || g.webkitAudioContext; if (!AC) return null;
        ac = new AC(); master = ac.createGain(); master.gain.value = 0.7;
        const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.18;
        master.connect(comp); comp.connect(ac.destination);
        const len = ac.sampleRate * 2, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        noiseBuf = b;
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    } catch (e) { return null; }
  }

  function env(gn, t, a, d, peak) { gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); gn.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function osc(type, f0, f1, t, dur, peak, dest, att) {
    const o = ac.createOscillator(), gn = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(gn, t, att != null ? att : Math.min(0.02, dur / 4), dur, peak); o.connect(gn); gn.connect(dest || master); o.start(t); o.stop(t + dur + (att || 0.02) + 0.08);
    return o;
  }
  function nz(t, dur, f0, f1, peak, q, type, att) {
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), gn = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; fl.type = type || 'bandpass'; fl.Q.value = q || 1.2; fl.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(gn, t, att != null ? att : dur * 0.4, dur * 0.6, peak); s.connect(fl); fl.connect(gn); gn.connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.1);
  }
  const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const PENTA = [0, 2, 4, 7, 9];
  function sparkle(t, n, base, spread, peak) { for (let i = 0; i < n; i++) { const m = base + PENTA[(Math.random() * 5) | 0] + 12 * ((Math.random() * 2) | 0); osc('sine', NOTE(m), NOTE(m), t + i * spread, 0.5, peak); } }

  const SFX = {
    appear() { const t = ac.currentTime; nz(t, 1.3, 200, 5000, 0.18, 0.7, 'bandpass', 0.9); osc('sine', 70, 38, t + 0.35, 0.9, 0.55); osc('triangle', 110, 55, t + 0.35, 0.9, 0.2); sparkle(t + 0.5, 7, 72, 0.09, 0.07); },
    hand() { const t = ac.currentTime; nz(t, 0.55, 500, 2200, 0.12, 0.8, 'bandpass', 0.25); },
    lidgrab() { const t = ac.currentTime; nz(t, 0.05, 4200, 2600, 0.22, 3, 'bandpass', 0.003); osc('square', 1600, 900, t, 0.05, 0.05); osc('sine', 120, 70, t, 0.14, 0.3); },
    lidopen() { // grincement métallique + coup sourd
      const t = ac.currentTime; const o = osc('sawtooth', 70, 150, t, 1.0, 0.07, null, 0.2); const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 8; f.frequency.value = 520; try { o.disconnect(); } catch (e) { /* ignoré */ }
      const gn = ac.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.1, t + 0.25); gn.gain.exponentialRampToValueAtTime(0.0001, t + 1.15); o.connect(f); f.connect(gn); gn.connect(master);
      osc('sine', 95, 38, t + 0.95, 0.5, 0.65); nz(t + 0.95, 0.12, 900, 200, 0.2, 0.7, 'lowpass', 0.005);
    },
    burst() { const t = ac.currentTime; [0, 7, 12, 16, 19].forEach((m, i) => osc('triangle', NOTE(55 + m), NOTE(55 + m), t + i * 0.035, 1.6, 0.12 - i * 0.012, null, 0.04)); nz(t, 0.9, 400, 6500, 0.16, 0.6, 'bandpass', 0.5); sparkle(t + 0.15, 10, 76, 0.07, 0.06); },
    dip() { const t = ac.currentTime; nz(t, 0.4, 2500, 500, 0.1, 0.8, 'bandpass', 0.12); },
    rummage() { const t = ac.currentTime; for (let i = 0; i < 9; i++) { const a = t + i * 0.065 + Math.random() * 0.03; nz(a, 0.045, 2600 + Math.random() * 3000, 1800, 0.12 + Math.random() * 0.08, 2, 'bandpass', 0.004); } },
    grab() { const t = ac.currentTime; nz(t, 0.05, 3800, 3000, 0.2, 2.5, 'bandpass', 0.003); osc('sine', 260, 170, t, 0.1, 0.28); sparkle(t + 0.02, 2, 84, 0.05, 0.05); },
    pull() { const t = ac.currentTime; nz(t, 0.45, 700, 4500, 0.13, 0.9, 'bandpass', 0.2); osc('sine', 330, 880, t, 0.4, 0.07); sparkle(t + 0.12, 3, 79, 0.06, 0.05); },
    whoosh() { const t = ac.currentTime; nz(t, 0.35, 900, 3600, 0.14, 0.9, 'bandpass', 0.14); },
    land() { const t = ac.currentTime; osc('sine', 190, 70, t, 0.2, 0.5); nz(t, 0.1, 4500, 1200, 0.2, 0.8, 'bandpass', 0.004); },
    flip(i) { const t = ac.currentTime; nz(t, 0.3, 1400, 5200, 0.17, 1.1, 'bandpass', 0.1); osc('sine', 520, 780, t, 0.12, 0.05); },
    reveal(i) {
      const t = ac.currentTime, tier = (i && i.tier) || 1, combo = !!(i && i.combo), idx = (i && i.i) || 0;
      const root = 60 + [0, 2, 4, 7][idx % 4];
      if (combo) { // combo : accord large + montée brillante
        [0, 4, 7, 12, 16].forEach((m, k) => osc('triangle', NOTE(root + m), NOTE(root + m), t + k * 0.055, 1.5, 0.14, null, 0.02));
        osc('sine', 90, 30, t, 0.9, 0.8); nz(t, 0.8, 600, 7000, 0.2, 0.6, 'bandpass', 0.35); sparkle(t + 0.15, 12, 79, 0.06, 0.07);
      } else {
        const n = Math.min(4, 1 + Math.ceil(tier / 2));
        for (let k = 0; k < n; k++) osc('triangle', NOTE(root + PENTA[k + 1]), NOTE(root + PENTA[k + 1]), t + k * 0.075, 0.9 + tier * 0.12, 0.13, null, 0.015);
        osc('sine', 130, 55, t, 0.4 + 0.08 * tier, 0.35 + 0.05 * tier);
        if (tier >= 4) sparkle(t + 0.2, 6, 81, 0.07, 0.05);
      }
    },
    card() { const t = ac.currentTime; osc('sine', 700, 1000, t, 0.07, 0.07); nz(t, 0.06, 3500, 2500, 0.08, 1.5, 'bandpass', 0.004); },
    ui() { const t = ac.currentTime; osc('sine', 600, 900, t, 0.08, 0.08); },
    go() { const t = ac.currentTime; [0, 4, 7, 12].forEach((m, k) => osc('square', NOTE(60 + m), NOTE(60 + m), t + k * 0.07, 0.35, 0.05, null, 0.01)); osc('sine', 100, 40, t, 0.5, 0.6); nz(t, 0.5, 500, 5000, 0.14, 0.7, 'bandpass', 0.2); },
    fanfare() { const t = ac.currentTime; [0, 4, 7, 12, 16, 19, 24].forEach((m, k) => { osc('triangle', NOTE(60 + m), NOTE(60 + m), t + k * 0.09, 0.9, 0.14, null, 0.02); osc('sine', NOTE(48 + m), NOTE(48 + m), t + k * 0.09, 0.9, 0.08, null, 0.02); }); osc('sine', 110, 35, t, 0.8, 0.7); sparkle(t + 0.5, 10, 84, 0.08, 0.05); }
  };

  /* musique d'ambiance : un nappage grave qui respire (très discret) */
  function musicStart() {
    if (!ctx() || musicNodes) return;
    const t = ac.currentTime, out = ac.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.06, t + 3); out.connect(master);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.7; lp.connect(out);
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 180; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t);
    const oscs = [lfo];
    [[45, 'sawtooth', 0], [45.2, 'sawtooth', 7], [57, 'triangle', 0], [64.1, 'sine', 0]].forEach((p) => { const o = ac.createOscillator(); o.type = p[1]; o.frequency.value = NOTE(p[0] + 0) ; o.detune.value = p[2] * 3; o.connect(lp); o.start(t); oscs.push(o); });
    musicNodes = { out, oscs };
  }
  function musicStop() {
    if (!musicNodes || !ac) return; const m = musicNodes; musicNodes = null; const t = ac.currentTime;
    m.out.gain.cancelScheduledValues(t); m.out.gain.setValueAtTime(Math.max(0.0002, m.out.gain.value), t); m.out.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    setTimeout(() => { m.oscs.forEach((o) => { try { o.stop(); } catch (e) { /* ignoré */ } }); }, 1400);
  }

  /* voix */
  function loadVoice() {
    if (voiceBuf || voiceLoading || !ac) return voiceLoading;
    voiceLoading = fetch(VOICE_URL).then((r) => { if (!r.ok) throw new Error('voix'); return r.arrayBuffer(); })
      .then((ab) => new Promise((res, rej) => { const p = ac.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }))
      .then((b) => { voiceBuf = b; }).catch(() => { voiceBuf = null; voiceLoading = null; });
    return voiceLoading;
  }
  function say(key) {
    if (!voiceOn() || !ctx()) return; const c = VOICE[key]; if (!c) return;
    const go = () => {
      if (!voiceBuf) return;
      if (voiceNode) { try { voiceNode.gn.gain.cancelScheduledValues(ac.currentTime); voiceNode.gn.gain.setTargetAtTime(0, ac.currentTime, 0.03); voiceNode.src.stop(ac.currentTime + 0.12); } catch (e) { /* ignoré */ } }
      const src = ac.createBufferSource(), gn = ac.createGain(); src.buffer = voiceBuf; gn.gain.value = 1.15; src.connect(gn); gn.connect(master);
      src.start(0, c[0], c[1] + 0.05); voiceNode = { src, gn }; src.onended = () => { if (voiceNode && voiceNode.src === src) voiceNode = null; };
    };
    if (voiceBuf) go(); else { const p = loadVoice(); if (p) p.then(go); }
  }

  const BoxAudio = {
    VOICE,
    unlock() { armed = true; const a = ctx(); if (a) loadVoice(); return !!a; },
    get armed() { return armed; },
    sfx(name, info) { if (!ctx()) return; const f = SFX[name]; if (f) { try { f(info); } catch (e) { /* ignoré */ } } },
    say,
    music(on) { if (on) musicStart(); else musicStop(); },
    stopAll() { musicStop(); if (voiceNode) { try { voiceNode.src.stop(); } catch (e) { /* ignoré */ } voiceNode = null; } },
    get ready() { return !!ac; }
  };
  NEV.BoxAudio = BoxAudio;
})(window);
