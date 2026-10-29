/* ==========================================================
   neV.BOOSTER — gacha-box3d.js
   La scène 3D de la Gacha Box (three.js) : une table sombre, une boîte noire et violette aux arêtes
   lumineuses, une main qui ouvre le couvercle, plonge sans regarder, tire quatre cartes et les dépose
   face cachée, puis les cartes se retournent une à une.

   Le tirage est décidé AVANT, par le moteur existant (gachaengine.js) : cette scène ne fait que l'animer.
   API : NEV.BoxScene.create(THREE, élément, options) → contrôleur
     c.setCards([{ kind, title, tag, tier, accent, amount, unit, muscles, level, steps }])
     c.appear() · c.open() · c.pullAll() · c.revealAll() · c.showFinal() · c.skip()
     c.on('sfx', (nom, info) => …)   ← pour brancher les sons
   Tout le mouvement passe par un seul moteur de « tweens » (temps virtuel) : on peut tout passer d'un coup.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = {
    lin: (k) => k,
    io: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    out: (k) => 1 - Math.pow(1 - k, 3),
    in: (k) => k * k * k,
    sine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
    back: (k) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }
  };
  const hex = (n) => '#' + ('000000' + (n >>> 0).toString(16)).slice(-6);

  /* ---------- dessin des textures (canvas) ---------- */
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function spaced(c, text, x, y, sp, align) {
    const chars = Array.from(text);
    let w = 0; chars.forEach((ch) => { w += c.measureText(ch).width + sp; }); w -= sp;
    let cx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    chars.forEach((ch) => { c.fillText(ch, cx, y); cx += c.measureText(ch).width + sp; });
    return w;
  }
  function wrap(c, text, maxW) {
    const words = String(text).split(/\s+/), lines = []; let cur = '';
    words.forEach((w) => { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines;
  }
  const FONT = (w, s) => w + ' ' + s + 'px Montserrat, system-ui, sans-serif';
  const VI = '#b9a0ff', MUTED = '#9d93ba';

  function fitTitle(c, text, maxW, maxLines, size, minSize, weight) {
    let s = size, lines;
    do { c.font = FONT(weight, s); lines = wrap(c, text, maxW); s -= 3; } while ((lines.length > maxLines || lines.some((l) => c.measureText(l).width > maxW)) && s > minSize);
    return { lines, size: s + 3 };
  }

  function drawFront(cv, d) {
    const W = 640, H = 928, c = cv.getContext('2d'), sc = cv.width / W;
    c.setTransform(sc, 0, 0, sc, 0, 0);
    const combo = d.kind === 'combo', acc = d.accent || '#b9a0ff';
    c.clearRect(0, 0, W, H);
    rr(c, 0, 0, W, H, 40); c.save(); c.clip();
    let gr = c.createLinearGradient(0, 0, W * 0.4, H); gr.addColorStop(0, '#22174a'); gr.addColorStop(0.5, '#0e0a21'); gr.addColorStop(1, '#1a1232');
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    const rg = c.createRadialGradient(W * 0.85, 60, 10, W * 0.85, 60, 460); rg.addColorStop(0, combo ? 'rgba(255,255,255,.22)' : acc + '44'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = rg; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(185,160,255,.07)'; c.lineWidth = 2;
    for (let i = -H; i < W + H; i += 26) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + H, H); c.stroke(); }
    c.restore();
    // cadre
    gr = c.createLinearGradient(0, 0, W, H);
    if (combo) { gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, '#b9a0ff'); gr.addColorStop(0.65, '#6d3df0'); gr.addColorStop(1, '#ffffff'); } else { gr.addColorStop(0, acc); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, acc); }
    c.strokeStyle = gr; c.lineWidth = combo ? 14 : 9; rr(c, 7, 7, W - 14, H - 14, 36); c.stroke();
    c.strokeStyle = 'rgba(185,160,255,.28)'; c.lineWidth = 2; rr(c, 26, 26, W - 52, H - 52, 24); c.stroke();
    // en-tête
    c.textBaseline = 'alphabetic';
    c.fillStyle = combo ? '#ffffff' : VI; c.font = FONT(800, 25); spaced(c, combo ? '★ COMBO' : 'EXERCICE', 52, 84, 7, 'left');
    c.fillStyle = combo ? VI : acc; c.font = FONT(800, 25); spaced(c, (d.tag || '').toUpperCase(), W - 52, 84, 6, 'right');
    // titre
    const t = fitTitle(c, d.title, W - 104, combo ? 2 : 3, combo ? 56 : 62, 34, 800);
    c.fillStyle = '#f7f4ff'; c.font = FONT(800, t.size);
    t.lines.forEach((l, i) => c.fillText(l, 52, 150 + i * (t.size * 1.12)));
    const afterTitle = 150 + (t.lines.length - 1) * (t.size * 1.12);
    if (combo) {
      const n = d.steps.length, top = Math.max(afterTitle + 36, 270), avail = 770 - top, row = Math.min(150, avail / n);
      d.steps.forEach((s, i) => {
        const y = top + i * row;
        c.strokeStyle = 'rgba(185,160,255,.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(52, y); c.lineTo(W - 52, y); c.stroke();
        c.fillStyle = VI; c.font = FONT(900, Math.min(84, row * 0.62)); const num = String(s.big);
        c.fillText(num, 52, y + row * 0.68);
        const nw = c.measureText(num).width;
        c.fillStyle = MUTED; c.font = FONT(800, 24); spaced(c, String(s.unit).toUpperCase(), 52 + nw + 12, y + row * 0.68 - 4, 2, 'left');
        c.fillStyle = '#f7f4ff'; c.font = FONT(600, 30);
        const lines = wrap(c, s.name, 250).slice(0, 2);
        lines.forEach((l, k) => c.fillText(l, 372, y + row * 0.46 + k * 34 - (lines.length - 1) * 12 + 8));
      });
    } else {
      c.fillStyle = '#ffffff'; c.font = FONT(900, 250);
      const bw = c.measureText(String(d.amount)).width;
      c.shadowColor = acc; c.shadowBlur = 36; c.fillText(String(d.amount), 52, 640); c.shadowBlur = 0;
      c.fillStyle = MUTED; c.font = FONT(800, 28); spaced(c, String(d.unit).toUpperCase(), 58, 690, 7, 'left');
      if (d.sub) { c.fillStyle = '#f7f4ff'; c.font = FONT(800, 36); c.fillText(d.sub, 52, 744); }
      void bw;
    }
    // pied : muscles + difficulté
    c.fillStyle = MUTED; c.font = FONT(600, 27);
    if (d.muscles) c.fillText(d.muscles, 52, 806, W - 104);
    c.fillStyle = VI; c.font = FONT(800, 22); spaced(c, 'DIFFICULTÉ', 52, 862, 5, 'left');
    for (let i = 0; i < 5; i++) { c.fillStyle = i < (d.tier || 1) ? (combo ? '#ffffff' : acc) : 'rgba(185,160,255,.2)'; c.shadowColor = acc; c.shadowBlur = i < (d.tier || 1) ? 12 : 0; rr(c, 262 + i * 44, 840, 34, 10, 4); c.fill(); c.shadowBlur = 0; }
    c.fillStyle = '#f7f4ff'; c.font = FONT(800, 22); spaced(c, (d.level || '').toUpperCase(), W - 52, 862, 4, 'right');
  }

  function drawBack(cv) {
    const W = 640, H = 928, c = cv.getContext('2d'), sc = cv.width / W;
    c.setTransform(sc, 0, 0, sc, 0, 0);
    rr(c, 0, 0, W, H, 40); c.save(); c.clip();
    const gr = c.createLinearGradient(0, 0, W * 0.5, H); gr.addColorStop(0, '#271a55'); gr.addColorStop(1, '#0a0618');
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    const rg = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 380); rg.addColorStop(0, 'rgba(139,92,246,.55)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = rg; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(185,160,255,.09)'; c.lineWidth = 2;
    for (let i = -H; i < W + H; i += 22) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + H, H); c.stroke(); }
    c.restore();
    c.strokeStyle = 'rgba(185,160,255,.75)'; c.lineWidth = 8; rr(c, 7, 7, W - 14, H - 14, 36); c.stroke();
    c.strokeStyle = 'rgba(185,160,255,.35)'; c.lineWidth = 3; rr(c, 44, 44, W - 88, H - 88, 22); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#8b5cf6'; c.shadowBlur = 40; c.fillStyle = '#f7f4ff';
    c.font = FONT(900, 230).replace('900', 'italic 900'); c.fillText('nV', W / 2, H / 2 - 16);
    c.shadowBlur = 0; c.fillStyle = VI; c.font = FONT(800, 26); c.textAlign = 'left';
    spaced(c, 'BOOSTER', W / 2 - 78, H / 2 + 128, 9, 'left');
    c.textAlign = 'left';
  }

  function drawPlate(cv) {
    const W = cv.width, H = cv.height, c = cv.getContext('2d');
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(6,4,14,.82)'; rr(c, 6, 6, W - 12, H - 12, 22); c.fill();
    c.strokeStyle = '#b9a0ff'; c.lineWidth = 5; c.shadowColor = '#8b5cf6'; c.shadowBlur = 22; rr(c, 10, 10, W - 20, H - 20, 20); c.stroke();
    c.shadowBlur = 0; c.fillStyle = '#f7f4ff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#8b5cf6'; c.shadowBlur = 26; c.font = 'italic 900 ' + Math.round(H * 0.44) + 'px Montserrat, sans-serif'; c.fillText('neV', W / 2, H * 0.40);
    c.shadowBlur = 0; c.fillStyle = '#b9a0ff'; c.font = '800 ' + Math.round(H * 0.15) + 'px Montserrat, sans-serif';
    spaced(c, 'BOOSTER', W / 2, H * 0.78, H * 0.05, 'center');
  }

  function glowTex(THREE, size, inner, outer) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d');
    const gr = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    c.fillStyle = gr; c.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t;
  }

  /* ---------- particules (points doux, mélange additif) ---------- */
  function Particles(THREE, scene, cap) {
    const pos = new Float32Array(cap * 3), col = new Float32Array(cap * 3), siz = new Float32Array(cap), alp = new Float32Array(cap);
    const vel = new Float32Array(cap * 3), life = new Float32Array(cap), max = new Float32Array(cap), grav = new Float32Array(cap), base = new Float32Array(cap);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alp, 1).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 500 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float aSize;attribute float aAlpha;attribute vec3 aColor;varying float vA;varying vec3 vC;uniform float uScale;void main(){vA=aAlpha;vC=aColor;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=max(1.,aSize*uScale/-mv.z);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'varying float vA;varying vec3 vC;void main(){float d=length(gl_PointCoord-.5)*2.;float a=clamp(1.-d,0.,1.);a=a*a;gl_FragColor=vec4(vC*a*vA,a*vA);}'
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    let n = 0;
    const tmp = new THREE.Color();
    const api = {
      mat, count: () => n,
      emit(x, y, z, k, o) {
        o = o || {};
        const colors = o.colors || [0xa77bff];
        for (let i = 0; i < k && n < cap; i++) {
          const j = n++, a = Math.random() * Math.PI * 2, e = (o.up != null ? o.up : 0.4) + (Math.random() - 0.5) * (o.spread != null ? o.spread : 1.6);
          const sp = (o.speed || 1.4) * (0.35 + Math.random() * 0.9);
          pos[j * 3] = x + (Math.random() - 0.5) * (o.w || 0); pos[j * 3 + 1] = y + (Math.random() - 0.5) * (o.h || 0); pos[j * 3 + 2] = z + (Math.random() - 0.5) * (o.d || 0);
          vel[j * 3] = Math.cos(a) * Math.cos(e) * sp * (o.flat ? 1 : 0.6); vel[j * 3 + 1] = Math.sin(e) * sp; vel[j * 3 + 2] = Math.sin(a) * Math.cos(e) * sp * (o.flat ? 1 : 0.6);
          life[j] = 0; max[j] = (o.life || 1.4) * (0.6 + Math.random() * 0.8); grav[j] = o.grav != null ? o.grav : -0.6; base[j] = (o.size || 0.1) * (0.6 + Math.random() * 0.9);
          tmp.setHex(Math.random() < (o.white || 0.2) ? 0xffffff : colors[(Math.random() * colors.length) | 0]);
          col[j * 3] = tmp.r; col[j * 3 + 1] = tmp.g; col[j * 3 + 2] = tmp.b;
        }
      },
      update(dt) {
        for (let i = n - 1; i >= 0; i--) {
          life[i] += dt;
          if (life[i] > max[i]) { // on remplace par la dernière
            n--;
            if (i !== n) {
              for (let k = 0; k < 3; k++) { pos[i * 3 + k] = pos[n * 3 + k]; vel[i * 3 + k] = vel[n * 3 + k]; col[i * 3 + k] = col[n * 3 + k]; }
              life[i] = life[n]; max[i] = max[n]; grav[i] = grav[n]; base[i] = base[n]; siz[i] = siz[n]; alp[i] = alp[n];
            }
            continue;
          }
          vel[i * 3 + 1] += grav[i] * dt; const dr = Math.pow(0.35, dt);
          vel[i * 3] *= dr; vel[i * 3 + 2] *= dr;
          pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
          const t = life[i] / max[i];
          alp[i] = (1 - t) * (t < 0.12 ? t / 0.12 : 1); siz[i] = base[i] * (0.7 + 0.5 * (1 - t));
        }
        geo.setDrawRange(0, n);
        geo.attributes.position.needsUpdate = geo.attributes.aColor.needsUpdate = geo.attributes.aSize.needsUpdate = geo.attributes.aAlpha.needsUpdate = true;
      }
    };
    return api;
  }

  /* ==========================================================
     La scène
     ========================================================== */
  function create(THREE, mount, opts) {
    opts = opts || {};
    const reduced = !!opts.reduced;
    const listeners = {};
    const emit = (n, a) => { (listeners[n] || []).forEach((f) => { try { f(a); } catch (e) { /* ignoré */ } }); };

    /* ----- rendu ----- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    let dpr = Math.min(g.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x05030a, 1);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const cv = renderer.domElement; cv.className = 'bx-canvas'; cv.setAttribute('aria-hidden', 'true');
    mount.appendChild(cv);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(new THREE.Color(0x07040f).convertSRGBToLinear(), 20, 46);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 80);

    /* ----- dimensions (1 unité ≈ 10 cm) ----- */
    const BW = 4.6, BH = 1.9, BD = 3.0, BZ = -1.2;        // boîte : largeur, hauteur, profondeur, z du centre
    const CW = 2.0, CH = 2.9;                             // carte
    const RIM = BH;

    /* three r128 lit les couleurs en « linéaire » : on convertit nos couleurs sRGB pour que le rendu garde la teinte voulue */
    const C = (h) => new THREE.Color(h).convertSRGBToLinear();
    /* ----- matériaux ----- */
    const M = {
      black: new THREE.MeshStandardMaterial({ color: C(0x0a0713), roughness: 0.42, metalness: 0.55 }),
      inner: new THREE.MeshStandardMaterial({ color: C(0x120a26), roughness: 0.8, metalness: 0.2, side: THREE.DoubleSide }),
      edge: new THREE.MeshStandardMaterial({ color: C(0x6d4cd6), emissive: C(0xa98bff), emissiveIntensity: 1.5, roughness: 0.3, metalness: 0.7 }),
      steel: new THREE.MeshStandardMaterial({ color: C(0x4a4468), roughness: 0.28, metalness: 0.9 }),
      skin: new THREE.MeshStandardMaterial({ color: C(0x8a5236), roughness: 0.62, metalness: 0, emissive: C(0x1c0a04), emissiveIntensity: 0.3 }),
      nail: new THREE.MeshStandardMaterial({ color: C(0xd9a58e), roughness: 0.35, metalness: 0 }),
      lid: new THREE.MeshStandardMaterial({ color: C(0x0b0716), roughness: 0.7, metalness: 0.15 }),
      sleeve: new THREE.MeshStandardMaterial({ color: C(0x0c0916), roughness: 0.5, metalness: 0.5 })
    };
    const fadeMats = [M.black, M.inner, M.edge, M.steel, M.lid];

    /* ----- lumières ----- */
    scene.add(new THREE.HemisphereLight(C(0x7d5bd8), C(0x0a0614), 0.7));
    const key = new THREE.SpotLight(C(0xece6ff), 2.1, 44, 0.62, 0.7, 1.2);
    key.position.set(3.5, 11, 8); key.target.position.set(0, 0, 0.5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0005; key.shadow.camera.near = 4; key.shadow.camera.far = 30;
    scene.add(key, key.target);
    const rimL = new THREE.PointLight(C(0x8b5cf6), 1.3, 24); rimL.position.set(-8, 5, -5); scene.add(rimL);
    const rimR = new THREE.PointLight(C(0xa98bff), 0.8, 22); rimR.position.set(8, 5, -4); scene.add(rimR);
    const inLight = new THREE.PointLight(C(0xb893ff), 0, 9, 1.6); inLight.position.set(0, 0.9, BZ); scene.add(inLight);
    const frontFill = new THREE.PointLight(C(0xffffff), 0.35, 30); frontFill.position.set(0, 7, 12); scene.add(frontFill);

    /* ----- décor : mur et table ----- */
    (function backdrop() {
      const w = document.createElement('canvas'); w.width = 512; w.height = 256; const c = w.getContext('2d');
      let gr = c.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#0b0716'); gr.addColorStop(1, '#06040b'); c.fillStyle = gr; c.fillRect(0, 0, 512, 256);
      const rg = c.createRadialGradient(256, 190, 4, 256, 190, 240); rg.addColorStop(0, 'rgba(139,92,246,.36)'); rg.addColorStop(0.5, 'rgba(90,50,190,.10)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(0, 0, 512, 256);
      c.fillStyle = 'rgba(255,255,255,.028)'; for (let x = 0; x < 512; x += 22) c.fillRect(x, 0, 1, 256);
      const t = new THREE.CanvasTexture(w); t.encoding = THREE.sRGBEncoding;
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(70, 30), new THREE.MeshBasicMaterial({ map: t, fog: false })); wall.position.set(0, 9, -14); scene.add(wall);
      const tc = document.createElement('canvas'); tc.width = tc.height = 512; const d = tc.getContext('2d');
      d.fillStyle = '#0f0a1f'; d.fillRect(0, 0, 512, 512);
      d.strokeStyle = 'rgba(139,92,246,.16)'; d.lineWidth = 2; for (let i = 0; i <= 512; i += 64) { d.beginPath(); d.moveTo(i, 0); d.lineTo(i, 512); d.stroke(); d.beginPath(); d.moveTo(0, i); d.lineTo(512, i); d.stroke(); }
      d.strokeStyle = 'rgba(185,160,255,.05)'; d.lineWidth = 1; for (let i = 0; i <= 512; i += 16) { d.beginPath(); d.moveTo(i, 0); d.lineTo(i, 512); d.stroke(); }
      const tt = new THREE.CanvasTexture(tc); tt.encoding = THREE.sRGBEncoding; tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(14, 10); tt.anisotropy = 4;
      const table = new THREE.Mesh(new THREE.PlaneGeometry(70, 50), new THREE.MeshPhysicalMaterial({ map: tt, color: C(0xffffff), roughness: 0.6, metalness: 0.35, clearcoat: 0.2, clearcoatRoughness: 0.6 }));
      table.rotation.x = -Math.PI / 2; table.position.set(0, 0, 8); table.receiveShadow = true; scene.add(table);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(40, 0.08, 0.1), M.edge); edge.position.set(0, 0.02, -15); scene.add(edge); // ligne lumineuse au fond de la table
    })();
    const poolTex = glowTex(THREE, 256, 'rgba(160,120,255,.9)', 'rgba(160,120,255,0)');
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(10, 6.4), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.02, BZ + 0.6); scene.add(pool);
    const ringTex = (function () { const r = document.createElement('canvas'); r.width = r.height = 256; const c = r.getContext('2d'); c.strokeStyle = '#d8c8ff'; c.lineWidth = 6; c.shadowColor = '#8b5cf6'; c.shadowBlur = 18; c.beginPath(); c.arc(128, 128, 112, 0, 6.283); c.stroke(); const t = new THREE.CanvasTexture(r); t.encoding = THREE.sRGBEncoding; return t; })();
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.03, BZ); scene.add(ring);

    /* ----- la boîte ----- */
    const box = new THREE.Group(); box.position.set(0, 0, BZ); scene.add(box);
    (function buildBox() {
      const wall = 0.2, add = (m, x, y, z, w, h, d, mat) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || M.black); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; m.add(o); return o; };
      add(box, 0, wall / 2, 0, BW, wall, BD, M.inner);                                   // fond
      add(box, 0, BH / 2, BD / 2 - wall / 2, BW, BH, wall);                              // façade
      add(box, 0, BH / 2, -BD / 2 + wall / 2, BW, BH, wall);                             // arrière
      add(box, -BW / 2 + wall / 2, BH / 2, 0, wall, BH, BD);                             // côtés
      add(box, BW / 2 - wall / 2, BH / 2, 0, wall, BH, BD);
      // intérieur lumineux
      const ig = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.5, BD - 0.5), new THREE.MeshBasicMaterial({ map: glowTex(THREE, 128, 'rgba(240,230,255,1)', 'rgba(120,70,230,.2)'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      ig.rotation.x = -Math.PI / 2; ig.position.set(0, 0.35, 0); box.add(ig); box.userData.glow = ig;
      // pile de cartes au fond
      const pile = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 2.5), M.inner); pile.position.set(0, 0.65, 0); box.add(pile);
      // arêtes lumineuses
      const t = 0.075, e = (x, y, z, w, h, d) => add(box, x, y, z, w, h, d, M.edge).castShadow = false;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((s) => e(s[0] * BW / 2, BH / 2, s[1] * BD / 2, t, BH + t, t));  // montants
      e(0, 0.02, BD / 2, BW + t, t, t); e(0, 0.02, -BD / 2, BW + t, t, t); e(-BW / 2, 0.02, 0, t, t, BD + t); e(BW / 2, 0.02, 0, t, t, BD + t);
      e(0, BH, BD / 2, BW + t, t, t); e(0, BH, -BD / 2, BW + t, t, t); e(-BW / 2, BH, 0, t, t, BD + t); e(BW / 2, BH, 0, t, t, BD + t);
      // plaque + rivets + LED
      const pc = document.createElement('canvas'); pc.width = 512; pc.height = 256; drawPlate(pc);
      const pt = new THREE.CanvasTexture(pc); pt.encoding = THREE.sRGBEncoding; pt.anisotropy = 4;
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: pt, transparent: true })); plate.position.set(0, BH * 0.52, BD / 2 + 0.005); box.add(plate);
      const rv = new THREE.SphereGeometry(0.075, 10, 8);
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach((s) => { const r = new THREE.Mesh(rv, M.steel); r.position.set(s[0] * (BW / 2 - 0.26), BH / 2 + s[1] * (BH / 2 - 0.26), BD / 2 + 0.02); box.add(r); });
      const led = new THREE.Mesh(new THREE.BoxGeometry(BW - 1.2, 0.05, 0.03), M.edge); led.position.set(0, 0.34, BD / 2 + 0.02); box.add(led); box.userData.led = led;
      // pieds
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((s) => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.4), M.steel); f.position.set(s[0] * (BW / 2 - 0.3), 0.04, s[1] * (BD / 2 - 0.3)); box.add(f); });
    })();
    // couvercle : charnière en haut à l'arrière
    const lidPivot = new THREE.Group(); lidPivot.position.set(0, BH, BZ - BD / 2); scene.add(lidPivot);
    (function buildLid() {
      const lw = BW + 0.12, ld = BD + 0.1;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.22, ld), M.lid); slab.position.set(0, 0.11, ld / 2); slab.castShadow = true; lidPivot.add(slab);
      const t = 0.075, e = (x, y, z, w, h, d) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.edge); o.position.set(x, y, z); lidPivot.add(o); };
      e(0, 0.22, ld, lw, t, t); e(0, 0.22, 0, lw, t, t); e(-lw / 2, 0.22, ld / 2, t, t, ld); e(lw / 2, 0.22, ld / 2, t, t, ld);
      // emblème
      const ec = document.createElement('canvas'); ec.width = 512; ec.height = 512; const c = ec.getContext('2d');
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#8b5cf6'; c.shadowBlur = 30; c.fillStyle = '#e9ddff'; c.font = 'italic 900 220px Montserrat, sans-serif'; c.fillText('nV', 256, 256);
      c.shadowBlur = 0; c.strokeStyle = '#b9a0ff'; c.lineWidth = 8; c.beginPath(); c.arc(256, 256, 200, 0, 6.283); c.stroke();
      const et = new THREE.CanvasTexture(ec); et.encoding = THREE.sRGBEncoding;
      const em = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), new THREE.MeshBasicMaterial({ map: et, transparent: true, opacity: 0.92 })); em.rotation.x = -Math.PI / 2; em.position.set(0, 0.225, ld / 2); lidPivot.add(em);
      const latch = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.18), M.edge); latch.position.set(0, 0.2, ld - 0.22); lidPivot.add(latch);
    })();
    // faisceau de lumière
    const beamTex = (function () { const r = document.createElement('canvas'); r.width = 64; r.height = 256; const c = r.getContext('2d'); const gr = c.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, 'rgba(230,215,255,.95)'); gr.addColorStop(0.5, 'rgba(150,105,255,.35)'); gr.addColorStop(1, 'rgba(120,80,230,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 256); const gx = c.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = gx; c.fillRect(0, 0, 64, 256); const t = new THREE.CanvasTexture(r); t.encoding = THREE.sRGBEncoding; return t; })();
    const beams = [0].map((i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 6.5), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })); m.position.set(0, RIM + 2.6, BZ - BD / 2 + 0.5); scene.add(m); return m; });

    /* ----- particules ----- */
    const parts = Particles(THREE, scene, 900);
    let ambient = false, ambientAcc = 0;

    /* ----- la main ----- */
    const hand = (function buildHand() {
      const root = new THREE.Group(); scene.add(root);
      const rig = new THREE.Group(); rig.scale.setScalar(1.34); root.add(rig);
      const sk = M.skin;
      const seg = (r0, r1, len, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, 14, 1), mat || sk); m.position.y = -len / 2; m.castShadow = true; return m; };
      const ball = (r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), sk); m.castShadow = true; return m; };
      // paume (face = +z)
      const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 16), sk); palm.scale.set(0.5, 0.56, 0.21); palm.castShadow = true; rig.add(palm);
      const heel = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), sk); heel.scale.set(0.4, 0.3, 0.2); heel.position.set(-0.04, 0.42, 0.02); rig.add(heel);
      const fingers = [];
      const spec = [{ x: -0.3, L: [0.42, 0.3, 0.26], r: 0.1 }, { x: -0.1, L: [0.46, 0.33, 0.28], r: 0.105 }, { x: 0.1, L: [0.43, 0.31, 0.26], r: 0.1 }, { x: 0.29, L: [0.34, 0.24, 0.22], r: 0.085 }];
      spec.forEach((s, i) => {
        const g0 = new THREE.Group(); g0.position.set(s.x, -0.5, 0.0); rig.add(g0);
        g0.add(seg(s.r, s.r * 0.94, s.L[0]));
        const g1 = new THREE.Group(); g1.position.y = -s.L[0]; g0.add(g1); g1.add(ball(s.r * 0.94)); g1.add(seg(s.r * 0.94, s.r * 0.88, s.L[1]));
        const g2 = new THREE.Group(); g2.position.y = -s.L[1]; g1.add(g2); g2.add(ball(s.r * 0.88)); g2.add(seg(s.r * 0.88, s.r * 0.8, s.L[2]));
        const tip = ball(s.r * 0.8); tip.position.y = -s.L[2]; g2.add(tip);
        const nail = new THREE.Mesh(new THREE.SphereGeometry(s.r * 0.62, 10, 8), M.nail); nail.scale.set(1, 0.9, 0.35); nail.position.set(0, -s.L[2] + 0.02, -s.r * 0.52); g2.add(nail);
        fingers.push({ g0, g1, g2, w: [1, 1.05, 1.1, 1.1][i], tilt: (i - 1.5) * 0.02 });
        const kn = ball(s.r * 1.02); kn.position.set(s.x, -0.46, -0.02); rig.add(kn);
      });
      // pouce (côté −x, du côté de la paume)
      const th = new THREE.Group(); th.position.set(-0.46, -0.08, 0.05); th.rotation.set(0, 0, 0.62); rig.add(th);
      th.add(seg(0.13, 0.115, 0.4)); const t1 = new THREE.Group(); t1.position.y = -0.4; th.add(t1); t1.add(ball(0.115)); t1.add(seg(0.115, 0.1, 0.32));
      const t2 = new THREE.Group(); t2.position.y = -0.32; t1.add(t2); t2.add(ball(0.1)); t2.add(seg(0.1, 0.09, 0.26)); const tt = ball(0.09); tt.position.y = -0.26; t2.add(tt);
      // poignet, avant-bras, manche
      const wrist = seg(0.3, 0.29, 0.5); wrist.position.y = 0.95; rig.add(wrist);
      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 1.4, 18, 1), sk); fore.position.y = 1.6; fore.castShadow = true; rig.add(fore);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.56, 7, 20, 1, true), M.sleeve); sleeve.position.y = 5.0; sleeve.castShadow = true; rig.add(sleeve);
      const sleeveIn = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.54, 7, 20, 1, true), new THREE.MeshStandardMaterial({ color: C(0x07050d), side: THREE.BackSide })); sleeveIn.position.y = 5.0; rig.add(sleeveIn);
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.055, 10, 28), M.edge); cuff.rotation.x = Math.PI / 2; cuff.position.y = 1.5; rig.add(cuff);
      const cuff2 = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 8, 28), M.steel); cuff2.rotation.x = Math.PI / 2; cuff2.position.y = 1.62; rig.add(cuff2);
      // support de la carte tenue (au bout des doigts, entre pouce et doigts)
      const hold = new THREE.Group(); hold.position.set(0, -1.45, 0.16); rig.add(hold);
      // ----- poses -----
      const OPEN = [[0.12, 0.2, 0.12], [0.1, 0.18, 0.1], [0.14, 0.22, 0.12], [0.2, 0.26, 0.14]];
      const FIST = [[1.38, 1.65, 1.1], [1.42, 1.7, 1.1], [1.4, 1.65, 1.05], [1.36, 1.6, 1.0]];
      const api = {
        root, rig, hold,
        grip(k) { // 0 = ouverte, 1 = poing
          fingers.forEach((f, i) => { const a = OPEN[i], b = FIST[i], kk = clamp(k * f.w, 0, 1); f.g0.rotation.set(-lerp(a[0], b[0], kk), 0, f.tilt); f.g1.rotation.x = -lerp(a[1], b[1], kk); f.g2.rotation.x = -lerp(a[2], b[2], kk); });
          th.rotation.set(-0.25 * k, 0, 0.62 - 0.35 * k); t1.rotation.x = -0.15 - 0.5 * k; t2.rotation.x = -0.1 - 0.4 * k;
        }
      };
      api.grip(0.1);
      return api;
    })();
    const hs = { x: 7, y: 9, z: 1, rx: -0.25, ry: 0, rz: -0.42, grip: 0.1 }; // état de la main (animé par les tweens)
    function applyHand() { hand.root.position.set(hs.x, hs.y, hs.z); hand.root.rotation.set(hs.rx, hs.ry, hs.rz, 'YXZ'); hand.grip(hs.grip); }
    const HOME = { x: 6.6, y: 8.6, z: 0.4, rx: -0.25, ry: 0, rz: -0.42, grip: 0.1 };
    Object.assign(hs, HOME); applyHand();

    /* ----- cartes ----- */
    const cardTex = {}; let backTex = null;
    const cards = [];
    let slotPos = [];
    function makeBack() {
      if (backTex) return backTex;
      const c = document.createElement('canvas'); c.width = 640; c.height = 928; drawBack(c);
      backTex = new THREE.CanvasTexture(c); backTex.encoding = THREE.sRGBEncoding; backTex.anisotropy = renderer.capabilities.getMaxAnisotropy(); return backTex;
    }
    function buildCard(i, d) {
      const front = document.createElement('canvas'); const sc = Math.min(2, Math.max(1, dpr)); front.width = 640 * sc; front.height = 928 * sc; drawFront(front, d);
      const ft = new THREE.CanvasTexture(front); ft.encoding = THREE.sRGBEncoding; ft.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const outer = new THREE.Group(), flip = new THREE.Group(); outer.add(flip);
      const gf = new THREE.PlaneGeometry(CW, CH);
      const fm = new THREE.Mesh(gf, new THREE.MeshStandardMaterial({ map: ft, emissiveMap: ft, emissive: C(0xffffff), emissiveIntensity: 0.42, roughness: 0.42, metalness: 0.1, transparent: true, alphaTest: 0.02 })); fm.position.z = 0.012; fm.castShadow = true;
      const bm = new THREE.Mesh(gf, new THREE.MeshStandardMaterial({ map: makeBack(), emissiveMap: makeBack(), emissive: C(0xffffff), emissiveIntensity: 0.4, roughness: 0.45, metalness: 0.1, transparent: true, alphaTest: 0.02 })); bm.position.z = -0.012; bm.rotation.x = Math.PI; bm.castShadow = true;
      flip.add(fm, bm);
      const shineC = document.createElement('canvas'); shineC.width = 128; shineC.height = 16; const sx = shineC.getContext('2d'); const sg = sx.createLinearGradient(0, 0, 128, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,.9)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); sx.fillStyle = sg; sx.fillRect(0, 0, 128, 16);
      const shine = new THREE.Mesh(new THREE.PlaneGeometry(CW * 0.5, CH * 1.3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shineC), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); shine.position.z = 0.02; shine.rotation.z = 0.5; flip.add(shine);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(CW * 2.2, CH * 1.7), new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color(d.accent || '#b9a0ff'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      glow.rotation.x = -Math.PI / 2; glow.position.y = 0.025; scene.add(glow);
      outer.visible = false; scene.add(outer);
      return { i, d, outer, flip, front: fm, shine, glow, ft, state: 'hidden', accent: new THREE.Color(d.accent || '#b9a0ff'), accentHex: new THREE.Color(d.accent || '#b9a0ff').getHex() };
    }
    function disposeCards() { cards.forEach((c) => { scene.remove(c.outer); scene.remove(c.glow); c.ft.dispose(); }); cards.length = 0; }
    function placeFlat(c, faceUp) { // carte posée à plat sur son emplacement
      const p = slotPos[c.i]; c.outer.parent !== scene && scene.attach(c.outer);
      c.outer.rotation.set(-Math.PI / 2, 0, c.jit, 'YXZ'); c.outer.position.set(p.x, 0.03, p.z); c.outer.scale.setScalar(1);
      c.flip.rotation.set(faceUp ? 0 : Math.PI, 0, 0); c.glow.position.set(p.x, 0.025, p.z);
    }

    /* ----- moteur de tweens (temps virtuel) ----- */
    let clock = 0, skipAll = false;
    const tweens = [];
    function tween(dur, fn, e) {
      return new Promise((res) => {
        if (skipAll || dur <= 0) { fn(1); res(); return; }
        tweens.push({ t0: clock, dur: dur / 1000, fn, e: e || E.io, res });
      });
    }
    const wait = (ms) => tween(ms, () => {}, E.lin);
    function to(obj, props, dur, e) { const from = {}; Object.keys(props).forEach((k) => { from[k] = obj[k]; }); return tween(dur, (k) => { Object.keys(props).forEach((p) => { obj[p] = lerp(from[p], props[p], k); }); }, e); }
    function stepTweens() {
      for (let i = tweens.length - 1; i >= 0; i--) {
        const t = tweens[i], k = clamp((clock - t.t0) / t.dur, 0, 1);
        t.fn(t.e(k));
        if (k >= 1) { tweens.splice(i, 1); t.res(); }
      }
    }
    function flush() { skipAll = true; for (let guard = 0; guard < 6 && tweens.length; guard++) { const list = tweens.splice(0); list.forEach((t) => { t.fn(1); t.res(); }); } }
    const sleepReal = (ms) => new Promise((r) => setTimeout(r, ms));
    let skipping = 0;
    function skip() { skipping++; flush(); setTimeout(() => { if (--skipping <= 0) { skipping = 0; skipAll = false; } }, 250); }

    /* ----- animations réutilisables ----- */
    const base = { box: 1, lidOpen: 0, glow: 0 };
    function setLid(a) { lidPivot.rotation.x = -a * 1.92; }          // 0 fermé → ~110° ouvert
    function setGlow(k) { base.glow = k; box.userData.glow.material.opacity = 0.9 * k; inLight.intensity = 2.0 * k; beams.forEach((b) => { b.material.opacity = 0.42 * k; }); pool.material.opacity = 0.32 + 0.5 * k; }
    function setBoxOpacity(k) { fadeMats.forEach((m) => { m.transparent = k < 1; m.opacity = k; }); }
    const lidEdge = new THREE.Vector3();
    function lidFrontEdge(a) { // position du bord avant du couvercle selon l'angle
      const ang = -a * 1.92, ld = BD + 0.1;
      lidEdge.set(0, BH + 0.11 + Math.cos(ang) * 0.11 - Math.sin(ang) * ld, BZ - BD / 2 + Math.sin(ang) * 0.11 + Math.cos(ang) * ld);
      return lidEdge;
    }
    const sfx = (n, i) => emit('sfx', Object.assign({ name: n }, i || {}));
    const jitter = () => (Math.random() - 0.5);

    async function appear() {
      emit('step', 1); emit('status', 'La boîte apparaît…');
      setBoxOpacity(0); setLid(0); setGlow(0); box.scale.setScalar(0.9); lidPivot.visible = box.visible = true;
      ring.material.opacity = 0.9; sfx('appear');
      parts.emit(0, 0.4, BZ, 46, { speed: 2.6, spread: 1.4, up: 0.4, life: 1.6, size: 0.14, white: 0.3, w: BW, d: BD, grav: -0.2, flat: true });
      const a = tween(1500, (k) => { setBoxOpacity(k); const s = lerp(0.9, 1, E.out(k)); box.scale.setScalar(s); lidPivot.scale.setScalar(s); lidPivot.position.set(0, BH * s, BZ - (BD / 2) * s); box.position.y = 0; }, E.out);
      const b = tween(1700, (k) => { ring.scale.setScalar(lerp(0.4, 1.7, E.out(k))); ring.material.opacity = 0.85 * (1 - k); }, E.lin);
      const c = tween(1500, (k) => { pool.material.opacity = lerp(0, 0.32, k); }, E.out);
      await Promise.all([a, b, c]); setBoxOpacity(1); lidPivot.scale.setScalar(1); box.scale.setScalar(1); lidPivot.position.set(0, BH, BZ - BD / 2);
      ambient = true; emit('status', 'La boîte est prête.'); emit('step', 2);
    }

    async function open() {
      emit('step', 2); emit('status', 'Ouverture de la boîte…'); sfx('hand');
      const e = lidFrontEdge(0);
      // la main arrive au-dessus du bord avant
      await to(hs, { x: e.x + 0.5, y: e.y + 3.0, z: e.z + 0.5, rx: -0.15, rz: -0.18, grip: 0.1 }, 850, E.out);
      await to(hs, { y: e.y + 1.92, z: e.z + 0.3, rx: 0.12, grip: 0.62 }, 380, E.io);
      sfx('lidgrab'); await wait(120);
      // elle soulève le couvercle : le couvercle suit la main
      const t0 = clock;
      const lift = tween(1150, (k) => {
        setLid(k); const p = lidFrontEdge(k);
        hs.x = lerp(e.x + 0.5, 0.5, 0.6 * k); hs.y = p.y + 1.92 + (1 - k) * 0 + k * 0.5; hs.z = p.z + 0.3 + k * 0.25; hs.rx = lerp(0.12, 0.7, k); hs.rz = -0.18 + 0.1 * k;
        hs.grip = lerp(0.62, 0.35, k);
      }, E.io);
      await wait(300); sfx('lidopen');
      emit('shake', 0.5);
      const glowT = tween(900, (k) => setGlow(E.out(k)), E.out);
      await wait(100);
      parts.emit(0, RIM + 0.2, BZ, 90, { speed: 3.8, up: 1.35, spread: 0.7, life: 1.7, size: 0.13, white: 0.35, w: BW - 1, d: BD - 1, grav: -0.9 }); sfx('burst');
      await Promise.all([lift, glowT]);
      // la main lâche et se replace au-dessus de l'ouverture
      await to(hs, { x: 1.9, y: 4.9, z: BZ + 0.6, rx: -0.1, rz: -0.3, grip: 0.12 }, 520, E.io);
      emit('step', 3);
    }

    async function pullOne(i, fast) {
      const c = cards[i], f = fast ? 0.78 : 1, p = slotPos[i];
      emit('status', 'Tirage de la carte ' + (i + 1) + ' sur ' + cards.length + '…');
      const cx = (Math.random() - 0.5) * 1.2, cz = BZ + (Math.random() - 0.5) * 0.7;
      // 1. au-dessus de la boîte, puis plongée sans regarder
      await to(hs, { x: cx, y: 4.7, z: cz + 0.3, rx: -0.05, rz: -0.2, grip: 0.1 }, 380 * f, E.io);
      sfx('dip');
      await to(hs, { y: 2.5, z: cz, rx: 0.02, rz: -0.12 }, 430 * f, E.in);
      // 2. elle fouille à l'aveugle
      sfx('rummage');
      const r = 0.34; const ph = Math.random() * 6;
      await tween(620 * f, (k) => { const a = ph + k * 7.5; hs.x = cx + Math.cos(a) * r * (1 - k * 0.3); hs.z = cz + Math.sin(a) * r * 0.8; hs.rz = -0.12 + Math.sin(a * 1.3) * 0.12; hs.grip = 0.15 + 0.3 * Math.abs(Math.sin(a * 1.1)); inLight.intensity = 2.0 + Math.sin(k * 40) * 0.4; }, E.lin);
      inLight.intensity = 2.0;
      // 3. saisit une carte (elle apparaît entre les doigts)
      await to(hs, { grip: 0.82 }, 170 * f, E.out); sfx('grab');
      c.outer.visible = true; c.glow.material.opacity = 0; hand.hold.add(c.outer); c.outer.position.set(0, -CH / 2 + 0.05, 0); c.outer.rotation.set(0, 0, 0); c.outer.scale.setScalar(0.9); c.flip.rotation.set(Math.PI, 0, 0); c.state = 'held';
      parts.emit(hs.x, 2.2, hs.z, 18, { speed: 1.6, up: 1.2, spread: 0.9, life: 0.9, size: 0.09, white: 0.5, w: 0.8, d: 0.6, grav: -0.3 });
      // 4. elle remonte en la sortant de la boîte
      await to(hs, { y: 4.7, rx: -0.12, rz: -0.28 }, 480 * f, E.out); sfx('pull');
      parts.emit(hs.x, RIM + 0.4, hs.z, 22, { speed: 2.0, up: 1.4, spread: 0.8, life: 1.1, size: 0.1, white: 0.4, w: 1.2, d: 0.8, grav: -0.6 });
      // 5. vers la table, puis elle lance la carte
      await to(hs, { x: p.x - 0.5, y: 3.6, z: p.z - 1.0, rx: -0.55, rz: 0.06, grip: 0.7 }, 430 * f, E.io); sfx('whoosh');
      const wp = new THREE.Vector3(), wq = new THREE.Quaternion();
      c.outer.getWorldPosition(wp); scene.attach(c.outer); c.outer.scale.setScalar(1);
      const sp = wp.clone(), spin = (Math.random() < 0.5 ? -1 : 1) * Math.PI * 2;
      c.jit = jitter() * 0.1;
      const flight = tween(560 * f, (k) => {
        const e1 = E.out(k);
        c.outer.position.set(lerp(sp.x, p.x, e1), lerp(sp.y, 0.03, E.in(k)) + Math.sin(Math.PI * k) * 1.5, lerp(sp.z, p.z, e1));
        c.outer.rotation.set(lerp(0, -Math.PI / 2, E.io(k)), spin * E.out(k), lerp(0, c.jit, k), 'YXZ');
        c.flip.rotation.set(Math.PI, 0, 0);
      }, E.lin);
      await to(hs, { grip: 0.18, x: p.x + 0.6, y: 4.2, z: p.z - 1.6, rx: -0.3 }, 330 * f, E.out);
      await flight;
      placeFlat(c, false); c.state = 'down'; sfx('land');
      parts.emit(p.x, 0.12, p.z, 14, { speed: 1.2, up: 0.2, spread: 0.4, life: 0.7, size: 0.08, white: 0.3, w: CW, d: CH, grav: -0.1, flat: true });
      await tween(300, (k) => { c.glow.material.opacity = 0.35 * Math.sin(Math.PI * k); }, E.lin);
    }

    async function pullAll() {
      emit('step', 3);
      for (let i = 0; i < cards.length; i++) await pullOne(i, i > 0);
      // la main se retire
      to(hs, { x: HOME.x, y: HOME.y, z: HOME.z, rx: HOME.rx, rz: HOME.rz, grip: 0.1 }, 900, E.in);
      await to(base, { glow: 0.45 }, 900, E.io); setGlow(base.glow);
    }

    async function reveal(i) {
      const c = cards[i], p = slotPos[i], d = c.d, combo = d.kind === 'combo';
      emit('status', 'Révélation de la carte ' + (i + 1) + ' sur ' + cards.length); sfx('flip', { tier: d.tier, combo, i });
      const lift = combo ? 1.9 : 1.5;
      c.glow.material.color.copy(c.accent);
      const a = tween(900, (k) => {
        const h = Math.sin(Math.PI * Math.min(1, k * 1.05));
        c.outer.position.set(p.x, 0.03 + h * lift, p.z + h * 0.5);
        c.outer.rotation.set(-Math.PI / 2 + h * 0.38, 0, c.jit, 'YXZ');
        c.flip.rotation.x = lerp(Math.PI, 0, E.io(k));
        c.outer.scale.setScalar(1 + 0.1 * h);
      }, E.lin);
      await wait(380);
      c.shine.material.opacity = 0.9; tween(700, (k) => { c.shine.position.x = lerp(-CW * 0.8, CW * 0.8, k); c.shine.material.opacity = 0.9 * Math.sin(Math.PI * k); }, E.io);
      const col = combo ? [0xffffff, 0xb9a0ff, 0x8b5cf6] : [c.accentHex, 0xffffff, 0xa77bff];
      parts.emit(p.x, 1.2, p.z, combo ? 80 : 38, { speed: combo ? 3.4 : 2.4, up: 0.7, spread: 1.6, life: combo ? 1.6 : 1.2, size: combo ? 0.15 : 0.12, white: combo ? 0.5 : 0.25, w: CW, d: CH * 0.6, grav: -0.5, colors: col });
      sfx('reveal', { tier: d.tier, combo, i });
      emit('shake', combo ? 0.7 : 0.25);
      tween(1100, (k) => { c.glow.material.opacity = (combo ? 0.95 : 0.6) * (k < 0.25 ? k / 0.25 : 1) * (0.55 + 0.45 * (1 - k)) + 0.18; }, E.out);
      await a; placeFlat(c, true); c.state = 'up';
      emit('revealed', { i, card: d });
    }
    async function revealAll() {
      emit('step', 4);
      for (let i = 0; i < cards.length; i++) { await reveal(i); await wait(240); }
      emit('status', 'Les ' + cards.length + ' cartes sont révélées. Prêt à lancer la séance.'); emit('step', 5);
    }

    function showFinal() { // état final instantané : boîte ouverte, cartes face visible
      flush(); setBoxOpacity(1); box.visible = lidPivot.visible = true; setLid(1); setGlow(0.45); ring.material.opacity = 0; ambient = true;
      Object.assign(hs, HOME);
      cards.forEach((c, i) => { c.jit = ((i * 37) % 7 - 3) * 0.02; c.outer.visible = true; placeFlat(c, true); c.state = 'up'; c.glow.material.color.copy(c.accent); c.glow.material.opacity = (c.d.kind === 'combo' ? 0.85 : 0.5); });
      skipAll = false; emit('step', 5);
    }
    function showBoxOnly() { flush(); skipAll = false; setBoxOpacity(1); box.visible = lidPivot.visible = true; setLid(0); setGlow(0); ambient = true; Object.assign(hs, HOME); cards.forEach((c) => { c.outer.visible = false; c.glow.material.opacity = 0; }); }
    function hideBox() { flush(); skipAll = false; box.visible = lidPivot.visible = false; setBoxOpacity(0); setGlow(0); pool.material.opacity = 0; ring.material.opacity = 0; ambient = false; Object.assign(hs, HOME); }

    /* ----- inspection d'une carte (toucher / cliquer) ----- */
    let inspected = -1;
    async function inspect(i) {
      const c = cards[i]; if (!c || c.state !== 'up') return;
      if (inspected === i) { inspected = -1; const p = slotPos[i], f = { y: c.outer.position.y, z: c.outer.position.z, x: c.outer.position.x, rx: c.outer.rotation.x, s: c.outer.scale.x }; sfx('card'); await tween(420, (k) => { c.outer.position.set(lerp(f.x, p.x, k), lerp(f.y, 0.03, k), lerp(f.z, p.z, k)); c.outer.rotation.x = lerp(f.rx, -Math.PI / 2, k); c.outer.scale.setScalar(lerp(f.s, 1, k)); }, E.io); placeFlat(c, true); return; }
      if (inspected >= 0) { const o = inspected; inspected = -1; const oc = cards[o]; if (oc) placeFlat(oc, true); }
      inspected = i; sfx('card');
      const from = { x: c.outer.position.x, y: c.outer.position.y, z: c.outer.position.z, rx: c.outer.rotation.x, s: c.outer.scale.x };
      const to3 = { x: 0, y: 3.5, z: tall() ? 6.6 : 5.4, rx: -0.55, s: tall() ? 1.9 : 1.75 };
      await tween(480, (k) => { c.outer.position.set(lerp(from.x, to3.x, k), lerp(from.y, to3.y, k), lerp(from.z, to3.z, k)); c.outer.rotation.x = lerp(from.rx, to3.rx, k); c.outer.scale.setScalar(lerp(from.s, to3.s, k)); }, E.out);
    }

    /* ----- caméra, mise en page, boucle ----- */
    let W = 1, H = 1, aspect = 1, yaw = 0, pitch = 0, tyaw = 0, tpitch = 0, drag = null, idleT = 0, shake = 0;
    const tall = () => aspect < 0.95;
    const camTarget = new THREE.Vector3(), camBase = new THREE.Vector3();
    function layout() {
      if (!tall()) {
        slotPos = [-1.5, -0.5, 0.5, 1.5].map((k) => ({ x: k * (CW + 0.55), z: 3.7 }));
        const d = 17.4 * Math.max(1, 1.78 / Math.max(aspect, 0.95));
        camTarget.set(0, 1.9, 1.0); camBase.set(0, 0.5 * d + 1.9, 0.86 * d + 1.0);
      } else {
        const gx = CW / 2 + 0.14, z0 = 3.2, z1 = z0 + CH + 0.22;
        slotPos = [[-gx, z0], [gx, z0], [-gx, z1], [gx, z1]].map((p) => ({ x: p[0], z: p[1] }));
        const d = 12.4 * Math.min(1.9, (0.62 / Math.max(aspect, 0.3)) + 0.5);
        camTarget.set(0, 1.3, 2.9); camBase.set(0, 0.66 * d + 1.3, 0.75 * d + 2.9);
      }
      cards.forEach((c) => { if (c.state === 'up' || c.state === 'down') placeFlat(c, c.state === 'up'); });
    }
    function resize() {
      const r = mount.getBoundingClientRect(); W = Math.max(2, Math.round(r.width)); H = Math.max(2, Math.round(r.height)); aspect = W / H;
      renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); cv.style.width = '100%'; cv.style.height = '100%';
      camera.aspect = aspect; camera.fov = tall() ? 38 : 33; camera.updateProjectionMatrix();
      parts.mat.uniforms.uScale.value = (H * dpr) / (2 * Math.tan((camera.fov * Math.PI) / 360));
      layout();
    }
    if (g.ResizeObserver) new g.ResizeObserver(resize).observe(mount); else g.addEventListener('resize', resize);

    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw: tyaw, pitch: tpitch, moved: 0, id: e.pointerId, t: performance.now() }; try { cv.setPointerCapture(e.pointerId); } catch (er) { /* ignoré */ } });
    cv.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect();
      if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy)); tyaw = clamp(drag.yaw - dx / r.width * 1.6, -0.5, 0.5); tpitch = clamp(drag.pitch + dy / r.height * 0.8, -0.18, 0.22); idleT = 0; }
      else if (e.pointerType === 'mouse') { tyaw = ((e.clientX - r.left) / r.width - 0.5) * 0.22; tpitch = ((e.clientY - r.top) / r.height - 0.5) * -0.08; }
    });
    const up = (e) => {
      if (!drag) return; const d = drag; drag = null; try { cv.releasePointerCapture(d.id); } catch (er) { /* ignoré */ }
      if (d.moved < 8 && performance.now() - d.t < 500) { const i = pick(e); if (i >= 0) { emit('tap', i); inspect(i); } }
      if (e.pointerType !== 'mouse') { tyaw = 0; tpitch = 0; }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    const ray = new THREE.Raycaster(), nd = new THREE.Vector2();
    function pick(e) {
      const r = cv.getBoundingClientRect(); nd.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(nd, camera);
      const meshes = cards.filter((c) => c.state === 'up').map((c) => c.front), hit = ray.intersectObjects(meshes, false)[0];
      return hit ? cards.findIndex((c) => c.front === hit.object) : -1;
    }

    const MAXDT = Number(new URLSearchParams(g.location.search).get('boxdt')) || 0.05; // (tests : accélère l'animation sur un ordinateur lent)
    let last = performance.now(), running = true, frames = 0, slow = 0, fpsT = 0;
    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      const rawDt = (now - last) / 1000; last = now;
      const dt = Math.min(rawDt, MAXDT);
      if (document.hidden) return;
      clock += dt; stepTweens();
      // main
      applyHand();
      // lumières et décor vivants
      const tt = clock;
      if (base.glow > 0.05) { inLight.intensity = 2.0 * base.glow * (1 + Math.sin(tt * 3.1) * 0.06); beams.forEach((b, i) => { b.material.opacity = (0.38 + Math.sin(tt * 2 + i) * 0.05) * base.glow; b.rotation.y = Math.atan2(camera.position.x - b.position.x, camera.position.z - b.position.z); }); }
      box.userData.led.material.emissiveIntensity = 1.1 + Math.sin(tt * 2.2) * 0.45;
      ring.visible = ring.material.opacity > 0.01;
      if (ambient && !reduced) { ambientAcc += dt * 14; while (ambientAcc > 1 && parts.count() < 170) { ambientAcc--; parts.emit(0, 0.2, BZ, 1, { speed: 0.32, up: 1.3, spread: 0.3, life: 3.4, size: 0.075, white: 0.25, w: BW + 1.5, d: BD + 1.5, grav: 0.02 }); } ambientAcc = Math.min(ambientAcc, 2); }
      parts.update(dt);
      // caméra : légère respiration + inclinaison à la main
      yaw += (tyaw - yaw) * (1 - Math.pow(0.02, dt)); pitch += (tpitch - pitch) * (1 - Math.pow(0.02, dt));
      shake = Math.max(0, shake - dt * 1.8);
      const bx = camBase.x - camTarget.x, by = camBase.y - camTarget.y, bz = camBase.z - camTarget.z, rr0 = Math.hypot(bx, bz);
      const ang = Math.atan2(bx, bz) + yaw + Math.sin(tt * 0.4) * 0.012, ph = Math.atan2(by, rr0) + pitch + Math.sin(tt * 0.33) * 0.006, R = Math.hypot(rr0, by);
      camera.position.set(camTarget.x + Math.sin(ang) * Math.cos(ph) * R + (Math.random() - 0.5) * shake * 0.08, camTarget.y + Math.sin(ph) * R + (Math.random() - 0.5) * shake * 0.08, camTarget.z + Math.cos(ang) * Math.cos(ph) * R);
      camera.lookAt(camTarget);
      renderer.render(scene, camera);
      // qualité adaptative
      frames++; fpsT += rawDt; if (fpsT > 1.5) { const fps = frames / fpsT; frames = 0; fpsT = 0; if (fps < 22 && dpr > 1) { dpr = Math.max(1, dpr - 0.35); resize(); } }
    }
    emit; // (évite un avertissement de variable inutilisée)
    resize(); requestAnimationFrame(frame);

    /* ----- API ----- */
    return {
      THREE, renderer, scene, camera, hs, parts,
      on(n, f) { (listeners[n] = listeners[n] || []).push(f); },
      setCards(list) {
        inspected = -1; disposeCards();
        list.forEach((d, i) => { const c = buildCard(i, d); c.jit = ((i * 37) % 7 - 3) * 0.02; cards.push(c); });
        layout();
      },
      appear, open, pullAll, revealAll, showFinal, showBoxOnly, hideBox, inspect, skip,
      shake(v) { shake = Math.max(shake, v || 0.5); },
      get busy() { return tweens.length > 0; },
      get tall() { return tall(); },
      resetForReplay() { flush(); skipAll = false; Object.assign(hs, HOME); setLid(0); setGlow(0); cards.forEach((c) => { if (c.outer.parent !== scene) scene.attach(c.outer); c.outer.visible = false; c.state = 'hidden'; c.glow.material.opacity = 0; c.shine.material.opacity = 0; }); inspected = -1; },
      destroy() { running = false; disposeCards(); renderer.dispose(); if (cv.parentNode) cv.parentNode.removeChild(cv); }
    };
  }

  NEV.BoxScene = { create };
})(window);
