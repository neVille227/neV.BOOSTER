/* neV.BOOSTER — Photo de profil personnalisée
   NEV.AvatarUpload :
     process(file)  → { ok, data } | { ok:false, error }   recadre au carré centré, 256×256, JPEG ≤ 58 000 caractères
     pick()         → ouvre le sélecteur de fichier puis process() ; { ok:false, cancelled:true } si annulé
     save(dataUrl)  → enregistre sur le profil social (PUT api/social/me, champ avatar seul)
     remove()       → remet l'avatar par défaut
     me()           → profil social de l'utilisateur ({ ok, profile } | { ok:false, status, error })
     isPhoto(a)     → true si l'avatar est une photo envoyée
   Aucune dépendance. Compatible CSP stricte (aucun script inline). */
(function () {
  'use strict';
  const NEV = window.NEV = window.NEV || {};
  const SIZE = 256, MAX_CHARS = 58000, MAX_BYTES = 12 * 1024 * 1024, TYPES = /^image\/(jpeg|png|webp|gif|bmp|heic|heif|avif)$/i;
  const MSG = {
    type: 'Ce fichier n\'est pas une image. Choisis une photo JPEG, PNG ou WebP.',
    big: 'Cette photo est trop lourde (12 Mo maximum).',
    read: 'Impossible de lire cette image. Essaie une autre photo.',
    heavy: 'Photo trop détaillée : choisis une image plus simple.',
    net: 'Connexion impossible. Réessaie.',
    guest: 'Un compte est nécessaire pour avoir une photo de profil.'
  };

  function load(file) {
    return new Promise((ok) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); ok(im); };
      im.onerror = () => { URL.revokeObjectURL(url); ok(null); };
      im.src = url;
    });
  }

  async function process(file) {
    if (!file) return { ok: false, error: MSG.read };
    if (!TYPES.test(file.type || '')) return { ok: false, error: MSG.type };
    if (file.size > MAX_BYTES) return { ok: false, error: MSG.big };
    const im = await load(file);
    if (!im || !im.width || !im.height) return { ok: false, error: MSG.read };
    const side = Math.min(im.width, im.height), sx = Math.round((im.width - side) / 2), sy = Math.round((im.height - side) / 2);
    const c = document.createElement('canvas'); c.width = c.height = SIZE;
    const g = c.getContext('2d'); if (!g) return { ok: false, error: MSG.read };
    g.fillStyle = '#1a0a10'; g.fillRect(0, 0, SIZE, SIZE);   // fond pour les PNG transparents
    g.imageSmoothingQuality = 'high';
    g.drawImage(im, sx, sy, side, side, 0, 0, SIZE, SIZE);
    for (let q = 0.82; q >= 0.34; q -= 0.06) {
      const d = c.toDataURL('image/jpeg', q);
      if (/^data:image\/jpeg;base64,/.test(d) && d.length <= MAX_CHARS) return { ok: true, data: d };
    }
    return { ok: false, error: MSG.heavy };
  }

  function pick() {
    return new Promise((done) => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.setAttribute('aria-hidden', 'true'); inp.tabIndex = -1;
      inp.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;width:1px;height:1px';
      let ended = false;
      const end = (r) => { if (ended) return; ended = true; setTimeout(() => inp.remove(), 0); done(r); };
      inp.addEventListener('change', async () => { const f = inp.files && inp.files[0]; if (!f) return end({ ok: false, cancelled: true }); end(await process(f)); });
      inp.addEventListener('cancel', () => end({ ok: false, cancelled: true }));
      document.body.appendChild(inp); inp.click();
    });
  }

  async function api(method, body) {
    try {
      const r = await fetch('api/social/me', { method: method, credentials: 'same-origin', cache: 'no-store', headers: Object.assign({ 'X-NEV': '1' }, body ? { 'Content-Type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
      let j = {}; try { j = await r.json(); } catch (e) { /* vide */ }
      return { ok: r.ok, status: r.status, j: j };
    } catch (e) { return { ok: false, status: 0, j: { error: MSG.net } }; }
  }
  async function me() {
    const r = await api('GET');
    if (r.ok && r.j.profile) return { ok: true, profile: r.j.profile };
    return { ok: false, status: r.status, error: r.status === 401 ? MSG.guest : (r.j.error || MSG.net) };
  }
  async function write(avatar) {
    const r = await api('PUT', { avatar: avatar });
    return r.ok ? { ok: true } : { ok: false, status: r.status, error: r.status === 401 ? MSG.guest : (r.j.error || MSG.net) };
  }
  const isPhoto = (a) => /^data:image\/(jpeg|png|webp);base64,/.test(String(a || ''));
  async function save(dataUrl) { if (!isPhoto(dataUrl) || dataUrl.length > 60000) return { ok: false, error: MSG.heavy }; return write(dataUrl); }
  const remove = () => write('evo');

  NEV.AvatarUpload = { process: process, pick: pick, save: save, remove: remove, me: me, isPhoto: isPhoto, MSG: MSG };
})();
