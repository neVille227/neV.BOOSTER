/* ==========================================================
   neV.BOOSTER — evolution.js : le journal d'évolution du joueur
   · p.evo (enregistré avec le profil) : date de départ, paliers atteints, poids relevés, dates des photos.
   · Les PHOTOS restent uniquement sur l'appareil (IndexedDB). Elles ne sont jamais envoyées au serveur,
     jamais publiées, et le joueur peut les effacer à tout moment.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  const DAY = 86400000, GOAL_DAYS = 90, MAX_W = 120;

  const todayStr = () => (NEV.util && NEV.util.todayStr ? NEV.util.todayStr() : new Date().toISOString().slice(0, 10));
  const dayNum = (s) => Math.floor(Date.parse(s + 'T12:00:00Z') / DAY);
  const daysBetween = (a, b) => dayNum(b) - dayNum(a);

  /* ---------- journal dans le profil ---------- */
  function ensure(p) {
    if (!p.evo || typeof p.evo !== 'object') p.evo = {};
    const e = p.evo;
    if (!e.start) e.start = (p.login && p.login.days && p.login.days[0]) || todayStr();
    if (!e.stages || typeof e.stages !== 'object') e.stages = {};
    if (!Array.isArray(e.weights)) e.weights = [];
    if (!Array.isArray(e.photos)) e.photos = [];
    if (typeof e.asked !== 'boolean') e.asked = false;
    return e;
  }

  /* Note les paliers d'avatar atteints (avec la date du jour la première fois) et le poids du jour. */
  function sync(p) {
    const e = ensure(p); let changed = false;
    const st = NEV.heroFromXp ? NEV.heroFromXp((p.progress && p.progress.xp) || 0) : null;
    if (st) for (let n = 1; n <= st.stage.n; n++) if (!e.stages[n]) { e.stages[n] = n === 1 ? e.start : todayStr(); changed = true; }
    if (p.weightKg && p.weightKg > 0) {
      const last = e.weights[e.weights.length - 1];
      if (!last || last.kg !== p.weightKg) { logWeight(p, p.weightKg, true); changed = true; }
    }
    return changed;
  }
  function logWeight(p, kg, quiet) {
    const e = ensure(p); kg = Math.round(Number(kg) * 10) / 10;
    if (!(kg >= 30 && kg <= 250)) return;
    const d = todayStr(), last = e.weights[e.weights.length - 1];
    if (last && last.d === d) last.kg = kg; else e.weights.push({ d, kg });
    if (e.weights.length > MAX_W) e.weights = e.weights.slice(-MAX_W);
    if (!quiet) NEV.player.save(p);
  }

  /* Jour N depuis le départ, et jours restants avant les 90 jours. */
  function progress(p) {
    const e = ensure(p), n = Math.max(1, daysBetween(e.start, todayStr()) + 1);
    return { day: n, goal: GOAL_DAYS, left: Math.max(0, GOAL_DAYS - n), done: n >= GOAL_DAYS, pct: Math.min(1, n / GOAL_DAYS) };
  }

  /* ---------- photos : IndexedDB, jamais le serveur ---------- */
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!g.indexedDB) return rej(new Error('Stockage indisponible'));
      const r = g.indexedDB.open('nev-evolution', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('photos', { keyPath: 'k' }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  const tx = (mode, fn) => db().then((d) => new Promise((res, rej) => { const t = d.transaction('photos', mode), s = t.objectStore('photos'), q = fn(s); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }));
  const uidOf = () => ((NEV.auth && NEV.auth.current()) || {}).id || 'x';

  /* Réduit l'image (1080 px au plus, JPEG) : légère, et sans les données d'appareil de la photo d'origine. */
  function shrink(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1080 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? res(b) : rej(new Error('Image illisible'))), 'image/jpeg', 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Image illisible')); };
      img.src = url;
    });
  }
  async function addPhoto(p, file, kind) {
    if (!file || !/^image\//.test(file.type)) throw new Error('Choisis une image.');
    const blob = await shrink(file), e = ensure(p), d = todayStr(), k = uidOf() + ':' + d + ':' + (kind || 'now');
    await tx('readwrite', (s) => s.put({ k, uid: uidOf(), d, kind: kind || 'now', blob }));
    e.photos = e.photos.filter((x) => !(x.d === d && x.kind === (kind || 'now'))).concat([{ d, kind: kind || 'now' }]).sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-60);
    e.asked = true; NEV.player.save(p);
    return d;
  }
  async function getPhoto(d, kind) {
    const r = await tx('readonly', (s) => s.get(uidOf() + ':' + d + ':' + kind));
    return r && r.blob ? r.blob : null;
  }
  async function removePhoto(p, d, kind) {
    await tx('readwrite', (s) => s.delete(uidOf() + ':' + d + ':' + kind));
    const e = ensure(p); e.photos = e.photos.filter((x) => !(x.d === d && x.kind === kind)); NEV.player.save(p);
  }
  async function removeAll(p) {
    const e = ensure(p);
    for (const x of e.photos.slice()) { try { await tx('readwrite', (s) => s.delete(uidOf() + ':' + x.d + ':' + x.kind)); } catch (er) { /* ignoré */ } }
    e.photos = []; NEV.player.save(p);
  }
  const hasStart = (p) => ensure(p).photos.some((x) => x.kind === 'start');
  /* La photo des 90 jours est proposée quand le jour 90 est atteint et qu'il n'y en a pas encore. */
  const dueNow = (p) => { const pr = progress(p); return hasStart(p) && pr.done && !ensure(p).photos.some((x) => x.kind === 'now' && daysBetween(ensure(p).start, x.d) >= GOAL_DAYS - 1); };

  NEV.Evo = { ensure, sync, logWeight, progress, addPhoto, getPhoto, removePhoto, removeAll, hasStart, dueNow, daysBetween, GOAL_DAYS };
})(window);
