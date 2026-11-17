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

  /* ---------- la fiche anatomie : on touche le nom du muscle ---------- */
  const zones = {}; Z.list().forEach((z) => { zones[z.id] = z; });
  const fem = NEV.sex === 'f';
  $('ficheImg').src = fem ? 'img/anatomie-femme.webp' : 'img/anatomie-homme.webp';
  /* nom affiché → zone ; x, y = centre de la pastille dans l'image 1440 x 960 */
  const SPOTS = [
    ['Pectoraux', 'poitrine', 101, 299], ['Biceps', 'bras', 101, 369], ['Abdominaux', 'abdos', 101, 441], ['Quadriceps', 'cuisses', 101, 589], ['Mollets', 'mollets', 101, 739],
    ['Tête / cou', 'cou', 504, 201], ['Épaules', 'epaules', 504, 271], ['Obliques', 'obliques', 504, 405], ['Avant-bras', 'avantbras', 504, 509],
    ['Trapèzes', 'dos', 642, 259], ['Dos (haut)', 'dorsaux', 642, 349], ['Lombaires', 'lombaires', 642, 469], ['Fessiers', 'fessiers', 642, 559],
    ['Tête / cou', 'cou', 1046, 201], ['Épaules', 'epaules', 1046, 271], ['Triceps', 'bras', 1046, 369], ['Avant-bras', 'avantbras', 1046, 509], ['Ischio-jambiers', 'cuisses', 1046, 619], ['Mollets', 'mollets', 1046, 739]
  ];
  SPOTS.forEach((p) => {
    const z = zones[p[1]]; if (!z) return; // zone absente de cette version (ex. biceps chez la femme) : pas de lien
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fspot';
    b.style.left = (p[2] / 14.4) + '%'; b.style.top = (p[3] / 9.6) + '%';
    b.setAttribute('aria-label', p[0] + ' : voir les exercices'); b.addEventListener('click', () => go(p[1]));
    $('fiche').appendChild(b);
  });
  let leaving = false;
  function go(zid) {
    if (leaving || !zones[zid]) return; leaving = true;
    setTimeout(() => NEV.go('bibliotheque.html?zone=' + encodeURIComponent(zid)), reduced ? 0 : 200);
  }

  $('visSkip').addEventListener('click', () => { if (running && !skip) { skip = true; } else showBody(); });
  $('vision').addEventListener('click', (e) => { if (e.target.closest('#visSkip')) return; skip = true; });
  $('visAgain').addEventListener('click', play);
  play();
})();
