/* neV.BOOSTER — visite guidée de la première visite : « Nev », une petite flamme animée, se déplace d'élément en élément.
   Démarre toute seule une fois (puis NEV.Tour.start() ou accueil.html?tour=1 pour la revoir).
   Accessible : clavier (→ ← Échap), lecteur d'écran (dialog + aria-live), mouvement réduit respecté. */
(function (g) {
  'use strict';
  const NEV = g.NEV = g.NEV || {}, doc = g.document, KEY = 'nev.tour.v1';
  const reduced = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = () => { try { return !!g.localStorage.getItem(KEY); } catch (e) { return false; } };
  const mark = () => { try { g.localStorage.setItem(KEY, '1'); } catch (e) { /* ignoré */ } };

  const DOTS = '<span class="tr-dots"><i style="background:#c9ccd2"></i><i style="background:#b98cff"></i><i style="background:#ff5ccb"></i><i style="background:#ffd84a"></i><i style="background:#ff4040"></i><i style="background:linear-gradient(90deg,#fff 50%,#ff2400 50%)"></i></span>';
  const STEPS = [
    { t: 'Salut, moi c\'est Nev !', x: 'Je suis ta petite flamme. Je te fais visiter neV.BOOSTER en une minute. Tu peux m\'arrêter quand tu veux.' },
    { sel: '#today', t: 'Ta carte du jour', x: 'Chaque jour, tu tires une carte : c\'est ton exercice. Tu tires, tu t\'entraînes, tu valides.' },
    { t: 'Les raretés', dots: true, x: 'Gris : commun. Violet : rare. Rose : épique. Or : légendaire. Rouge : mythique. Blanc et écarlate : cartes spéciales (Repos et Tractions).' },
    { sel: '#heroBox', t: 'Ton personnage', x: 'Il grandit avec ton XP. Plus tu t\'entraînes, plus il évolue.' },
    { sel: '#stats', t: 'Tes chiffres', x: 'Ta série de jours, tes séances, ton XP et tes flammes. Un jour manqué, et le lendemain les séries sont doublées.' },
    { sel: '#tiles', t: 'Les raccourcis', x: 'Quête, gacha, classement, récompenses, conseils… tout est à un clic.' },
    { sel: '.me .flame', t: 'Ta série', x: 'Chaque jour d\'entraînement allume cette flamme. Ne la laisse pas s\'éteindre !' },
    { sel: '.menuBtn', t: 'Le menu', x: 'Toutes les pages du site sont ici, y compris les réglages et le choix de la langue.' },
    { sel: '.helpfab', t: 'Besoin d\'aide ?', x: 'Ce bouton ouvre le tuto complet. Et sur la page Tuto, tu peux me rappeler pour revoir cette visite.' },
    { t: 'C\'est parti !', x: 'Tu sais tout. Lance ta première carte du jour. À très vite, champion·ne !' }
  ];

  const FLAME = '<svg viewBox="0 0 80 100" aria-hidden="true" focusable="false"><defs><linearGradient id="trg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd84a"/><stop offset=".5" stop-color="#ff8a3d"/><stop offset="1" stop-color="#e0455f"/></linearGradient></defs>' +
    '<g class="tr-body"><path class="tr-tail" d="M40 4C46 22 66 34 66 60a26 26 0 0 1-52 0c0-14 8-20 12-30 4 8 6 10 10 12C36 30 34 16 40 4Z" fill="url(#trg)"/>' +
    '<path d="M40 52c4 8 14 12 14 24a14 14 0 0 1-28 0c0-12 10-16 14-24Z" fill="#ffe9a8" opacity=".55"/>' +
    '<g class="tr-eyes"><ellipse cx="31" cy="66" rx="6" ry="7.5" fill="#fff"/><ellipse cx="49" cy="66" rx="6" ry="7.5" fill="#fff"/><circle class="tr-p" cx="31" cy="67" r="3.2" fill="#2a0a12"/><circle class="tr-p" cx="49" cy="67" r="3.2" fill="#2a0a12"/></g>' +
    '<path d="M33 79q7 6 14 0" fill="none" stroke="#2a0a12" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="22" cy="76" rx="4" ry="2.4" fill="#ff5c7a" opacity=".5"/><ellipse cx="58" cy="76" rx="4" ry="2.4" fill="#ff5c7a" opacity=".5"/></g></svg>';

  let root, mascot, bubble, spot, idx = 0, steps = [], active = false, lastFocus = null;

  function build() {
    root = doc.createElement('div'); root.className = 'tr-root'; root.id = 'nevTour';
    root.innerHTML = '<div class="tr-shade"></div><div class="tr-spot" aria-hidden="true"></div>' +
      '<div class="tr-nev" aria-hidden="true"><div class="tr-hop">' + FLAME + '</div></div>' +
      '<div class="tr-bub" role="dialog" aria-modal="false" aria-labelledby="trT" aria-describedby="trX"><div class="tr-n" id="trN"></div><h3 id="trT"></h3><p id="trX" aria-live="polite"></p>' +
      '<div class="tr-bar"><div class="tr-prog" aria-hidden="true"><i></i></div><button type="button" class="tr-skip">Passer la visite</button><span class="tr-sp"></span><button type="button" class="tr-back">Retour</button><button type="button" class="tr-next btn">Suivant</button></div></div>';
    doc.body.appendChild(root);
    mascot = root.querySelector('.tr-nev'); bubble = root.querySelector('.tr-bub'); spot = root.querySelector('.tr-spot');
    root.querySelector('.tr-next').onclick = next; root.querySelector('.tr-back').onclick = back; root.querySelector('.tr-skip').onclick = () => finish(false);
  }

  const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 && g.getComputedStyle(el).visibility !== 'hidden'; };

  function place() {
    if (!active) return;
    const s = steps[idx], el = s.sel ? doc.querySelector(s.sel) : null, vw = g.innerWidth, vh = g.innerHeight, small = vw < 640;
    let nx, ny, tr = null;
    if (el && visible(el)) {
      const r = el.getBoundingClientRect(); tr = r;
      spot.style.cssText = 'opacity:1;left:' + (r.left - 8) + 'px;top:' + (r.top - 8) + 'px;width:' + (r.width + 16) + 'px;height:' + (r.height + 16) + 'px';
    } else spot.style.cssText = 'opacity:0;left:50%;top:40%;width:0;height:0';
    const bw = Math.min(380, vw - 24), bh = bubble.offsetHeight || 190;
    bubble.style.width = bw + 'px';
    let bx, by;
    if (small) { bx = 12; by = vh - bh - 12; }
    else if (tr) {
      const below = tr.bottom + 20 + bh < vh, above = tr.top - 20 - bh > 0;
      by = below ? tr.bottom + 20 : above ? tr.top - bh - 20 : Math.max(12, vh - bh - 16);
      bx = Math.max(12, Math.min(vw - bw - 12, tr.left + tr.width / 2 - bw / 2));
      if (!below && !above) bx = tr.left > vw / 2 ? Math.max(12, tr.left - bw - 90) : Math.min(vw - bw - 12, tr.right + 90);
    } else { bx = (vw - bw) / 2; by = Math.max(90, (vh - bh) / 2 + 40); }
    bubble.style.left = bx + 'px'; bubble.style.top = by + 'px';
    // Nev se pose au bord de la bulle, du côté de la cible (ou au centre au-dessus de la bulle)
    const ms = small ? 64 : 84;
    if (tr && !small) { nx = Math.max(6, Math.min(vw - ms - 6, bx + (by > tr.bottom ? -ms * .4 : bw - ms * .6))); ny = by > tr.bottom ? by - ms * .55 : by + bh - ms * .45; }
    else if (small) { nx = vw - ms - 14; ny = by - ms * .8; if (tr && tr.top < ny + ms && tr.bottom > ny) nx = 10; }
    else { nx = vw / 2 - ms / 2; ny = by - ms * .85; }
    mascot.style.width = ms + 'px'; mascot.style.height = ms * 1.25 + 'px';
    mascot.style.transform = 'translate(' + Math.round(nx) + 'px,' + Math.round(Math.max(4, ny)) + 'px)';
    // les yeux suivent la cible
    const tx = tr ? tr.left + tr.width / 2 : vw / 2, ty = tr ? tr.top + tr.height / 2 : vh / 2, dx = Math.max(-1, Math.min(1, (tx - (nx + ms / 2)) / 300)), dy = Math.max(-1, Math.min(1, (ty - (ny + ms / 2)) / 300));
    mascot.querySelectorAll('.tr-p').forEach((p) => { p.style.transform = 'translate(' + (dx * 2.4).toFixed(1) + 'px,' + (dy * 2.4).toFixed(1) + 'px)'; });
  }

  function show(i, dir) {
    idx = i; const s = steps[i], el = s.sel ? doc.querySelector(s.sel) : null;
    root.querySelector('#trN').textContent = (i + 1) + ' / ' + steps.length;
    root.querySelector('#trT').textContent = s.t; root.querySelector('#trX').innerHTML = (s.dots ? DOTS : '') + s.x;
    root.querySelector('.tr-prog i').style.width = ((i + 1) / steps.length * 100) + '%';
    root.querySelector('.tr-back').hidden = i === 0;
    const nx = root.querySelector('.tr-next'); nx.textContent = i === steps.length - 1 ? 'Terminer' : i === 0 ? 'C\'est parti' : 'Suivant';
    root.querySelector('.tr-skip').hidden = i === steps.length - 1;
    if (el && visible(el)) { const r = el.getBoundingClientRect(); if (r.top < 70 || r.bottom > g.innerHeight - 40) el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); }
    mascot.classList.remove('hop'); void mascot.offsetWidth; if (!reduced) mascot.classList.add('hop');
    bubble.classList.remove('pop'); void bubble.offsetWidth; if (!reduced) bubble.classList.add('pop');
    place(); setTimeout(place, 380); setTimeout(place, 800);
    nx.focus({ preventScroll: true });
  }
  const usable = () => steps.map((s, i) => i).filter((i) => !steps[i].sel || visible(doc.querySelector(steps[i].sel)));
  function next() { if (idx >= steps.length - 1) return finish(true); let j = idx + 1; while (j < steps.length - 1 && steps[j].sel && !visible(doc.querySelector(steps[j].sel))) j++; show(j); }
  function back() { let j = idx - 1; while (j > 0 && steps[j].sel && !visible(doc.querySelector(steps[j].sel))) j--; show(Math.max(0, j)); }

  function key(e) {
    if (!active) return;
    if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    else if (e.key === 'Tab') { const f = Array.from(bubble.querySelectorAll('button')).filter((b) => !b.hidden); if (!f.length) return; const a = doc.activeElement, i = f.indexOf(a); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  }

  function finish(done) {
    if (!active) return; active = false; mark();
    g.removeEventListener('resize', place); g.removeEventListener('scroll', place, true); doc.removeEventListener('keydown', key, true);
    root.classList.add('out'); setTimeout(() => { root.remove(); if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignoré */ } }, reduced ? 0 : 380);
    if (done && NEV.Sfx && NEV.Sfx.win && !NEV.Sfx.muted) try { NEV.Sfx.win(); } catch (e) { /* ignoré */ }
    if (done && NEV.Fx && NEV.Fx.burst && !reduced) try { NEV.Fx.burst(g.innerWidth / 2, g.innerHeight / 2, { n: 50, power: .9 }); } catch (e) { /* ignoré */ }
  }

  function start(force) {
    if (active || (!force && seen())) return false;
    if (doc.querySelector('.fx-pop')) { setTimeout(() => start(force), 1500); return true; } // on attend la fin des fenêtres de récompense
    steps = STEPS; active = true; lastFocus = doc.activeElement; build();
    g.addEventListener('resize', place); g.addEventListener('scroll', place, true); doc.addEventListener('keydown', key, true);
    requestAnimationFrame(() => { root.classList.add('on'); show(0); });
    return true;
  }
  NEV.Tour = { start: start, seen: seen, reset: () => { try { g.localStorage.removeItem(KEY); } catch (e) { /* ignoré */ } } };

  // Démarrage automatique : accueil, première visite (ou ?tour=1)
  function auto() {
    if (!/accueil\.html$|\/$/.test(g.location.pathname)) return;
    const force = /[?&]tour=1\b/.test(g.location.search);
    if (force || !seen()) setTimeout(() => start(force), 1600);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
