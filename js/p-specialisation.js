/* neV.BOOSTER — Spécialisation : l'animation « notre vision », puis le corps (face et dos).
   On touche une zone : on arrive sur la page Exercices, filtrée sur cette zone. */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const Z = NEV.Zones, V = Z.VISION;
  const ctx = await NEV.boot('specialisation'); if (!ctx) return;
  const reduced = NEV.util.reduced();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let skip = false, running = false, run = 0;

  /* écrit un texte caractère par caractère (effet machine à écrire) */
  async function type(el, text, ms, id) {
    el.textContent = '';
    for (let i = 0; i < text.length; i++) {
      if (skip || id !== run) { el.textContent = text; return; }
      el.textContent = text.slice(0, i + 1);
      const c = text[i];
      await wait(ms + (',;:'.indexOf(c) >= 0 ? 90 : '.!?'.indexOf(c) >= 0 ? 160 : 0));
    }
  }

  async function play() {
    const id = ++run; skip = false; running = true;
    const v = $('vision'), t = $('visTitle'), x = $('visText'), l = $('visList');
    v.hidden = false; $('body').hidden = true; v.classList.remove('done'); v.classList.add('typing');
    t.textContent = x.textContent = ''; l.innerHTML = '';
    if (reduced) skip = true;
    t.classList.add('caret');
    await type(t, V.title, 42, id); t.classList.remove('caret');
    if (id !== run) return;
    if (!skip) await wait(260);
    x.classList.add('caret'); await type(x, V.text, 13, id); x.classList.remove('caret');
    for (let i = 0; i < V.points.length; i++) {
      if (id !== run) return;
      const li = document.createElement('li'); l.appendChild(li);
      if (!skip) await wait(220);
      li.classList.add('caret'); await type(li, V.points[i], 15, id); li.classList.remove('caret');
    }
    if (id !== run) return;
    v.classList.remove('typing'); v.classList.add('done');
    if (!skip) await wait(1500);
    if (id !== run) return;
    running = false; showBody();
  }

  function showBody() {
    run++; running = false;
    $('vision').hidden = true; $('body').hidden = false;
    $('body').classList.remove('in'); void $('body').offsetWidth; $('body').classList.add('in');
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------- le corps : sans noms, on touche la zone ---------- */
  const map = NEV.BodyMap.mount($('bmap'), { selected: '', onPick: (zid) => go(zid) });
  const zones = {}; Z.list().forEach((z) => { zones[z.id] = z; });
  $('bmap').querySelectorAll('.bz').forEach((n) => {
    const z = zones[n.dataset.z]; if (!z) return;
    n.setAttribute('role', 'link'); n.setAttribute('tabindex', '0'); n.setAttribute('aria-label', z.name);
    n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(n.dataset.z); } });
  });
  let leaving = false;
  function go(zid) {
    if (leaving || !zones[zid]) return; leaving = true;
    map.select(zid);
    setTimeout(() => NEV.go('bibliotheque.html?zone=' + encodeURIComponent(zid)), reduced ? 0 : 260);
  }

  $('visSkip').addEventListener('click', () => { if (running && !skip) { skip = true; } else showBody(); });
  $('vision').addEventListener('click', (e) => { if (e.target.closest('#visSkip')) return; skip = true; });
  $('visAgain').addEventListener('click', play);
  play();
})();
