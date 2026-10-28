/* ==========================================================
   neV.BOOSTER — story-scenes.js
   Les 11 scènes 3D de « l'histoire animée » : titre, 9 chapitres, conclusion.
   Chaque scène = { en() entrée, up(t, D) image à l'instant t (secondes depuis le début de la scène,
   D = durée de la scène), ex() sortie }. up() ne dépend QUE de t : on peut sauter n'importe où
   (barre de chapitres) et rejouer image par image pour fabriquer la vidéo.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});

  NEV.StoryScenes = {
    create(ctx) {
      const THREE = ctx.THREE, S = ctx.S, rig = ctx.rig, hud = ctx.hud, doc = g.document;
      const L = (a, b, t) => a + (b - a) * t, C01 = (x) => Math.min(1, Math.max(0, x));
      const E = (x) => { x = C01(x); return x * x * (3 - 2 * x); };
      const EO = (x) => { x = C01(x); return 1 - (1 - x) * (1 - x); };
      const seg = (t, a, b) => C01((t - a) / (b - a));           // progression de a à b
      const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.65, metalness: 0 }, o || {}));
      const B = (w, h, d, c, x, y, z, o, p) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, o)); m.position.set(x, y, z); (p || S).add(m); return m; };
      const CY = (a, b, h, c, x, y, z, o, p, sg) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(a, b, h, sg || 16), M(c, o)); m.position.set(x, y, z); (p || S).add(m); return m; };
      const SP = (r, c, x, y, z, o, p) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), M(c, o)); m.position.set(x, y, z); (p || S).add(m); return m; };
      const GR = (p) => { const o = new THREE.Group(); (p || S).add(o); return o; };
      const SK = 0x7a4528;

      /* ---------- textures dessinées ---------- */
      function canv(w, h, fn) { const c = doc.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }
      const glowTex = canv(64, 64, (x) => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); });
      const heartTex = canv(64, 64, (x) => { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(32, 56); x.bezierCurveTo(4, 36, 6, 8, 24, 10); x.bezierCurveTo(30, 11, 32, 16, 32, 18); x.bezierCurveTo(32, 16, 34, 11, 40, 10); x.bezierCurveTo(58, 8, 60, 36, 32, 56); x.fill(); });
      const starTex = canv(64, 64, (x) => { x.fillStyle = '#fff'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 28; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } x.closePath(); x.fill(); });
      const dotTex = canv(32, 32, (x) => { x.fillStyle = '#fff'; x.beginPath(); x.arc(16, 16, 14, 0, 7); x.fill(); });
      const rayTex = canv(8, 128, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.0)'); gr.addColorStop(0.15, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
      function grad(stops) { return canv(4, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); stops.forEach((s) => gr.addColorStop(s[0], s[1])); x.fillStyle = gr; x.fillRect(0, 0, w, h); }); }

      /* ---------- ciel, sol, brouillard, lumières (communs à toutes les scènes) ---------- */
      const sky = new THREE.Mesh(new THREE.SphereGeometry(70, 24, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -10; S.add(sky);
      const skyTexs = {};
      const setSky = (k, stops) => { sky.material.map = skyTexs[k] || (skyTexs[k] = grad(stops)); sky.material.needsUpdate = true; };
      const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 48), M(0x2a1424, { roughness: 0.55, metalness: 0.15 })); floor.rotation.x = -Math.PI / 2; S.add(floor);
      const hemi = new THREE.HemisphereLight(0xffd0e0, 0x40202a, 0.9); S.add(hemi);
      const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 6, 5); S.add(key);
      const rim = new THREE.PointLight(0xff3d6e, 0.9, 18); rim.position.set(-3, 3, -2); S.add(rim);
      function setLight(o) {
        o = o || {};
        hemi.color.setHex(o.hs == null ? 0xffd0e0 : o.hs); hemi.groundColor.setHex(o.hg == null ? 0x40202a : o.hg); hemi.intensity = o.hi == null ? 0.9 : o.hi;
        key.color.setHex(o.kc == null ? 0xffffff : o.kc); key.intensity = o.ki == null ? 1.1 : o.ki; key.position.set.apply(key.position, o.kp || [3, 6, 5]);
        rim.color.setHex(o.rc == null ? 0xff3d6e : o.rc); rim.intensity = o.ri == null ? 0.9 : o.ri; rim.position.set.apply(rim.position, o.rp || [-3, 3, -2]);
      }
      const setFog = (c, a, b) => { S.fog = new THREE.Fog(c, a, b); };
      const setFloor = (c, o) => { floor.material.color.setHex(c); floor.material.roughness = o && o.r != null ? o.r : 0.55; floor.material.metalness = o && o.m != null ? o.m : 0.15; };

      /* ---------- personnages ---------- */
      const hero = rig.person({ skin: SK, hair: 'curly', top: 0x8a1538, seed: 5 });
      const reflect = rig.person({ skin: SK, hair: 'curly', top: 0x8a1538, seed: 5 }); reflect.g.scale.set(0.9, 0.9, 0.09);
      const thin = rig.person({ skin: SK, hair: 'curly', top: 0x8a1538, seed: 5 });
      const girls = [
        rig.person({ skin: 0xb97a56, female: true, hair: 'braids', top: 0xff7fb0, shorts: 0xf6f0f4, seed: 11 }),
        rig.person({ skin: 0x5a3420, female: true, hair: 'bun', top: 0x58b4f0, shorts: 0x2a3a6a, seed: 12 }),
        rig.person({ skin: 0xc58a60, female: true, hair: 'curly', hairColor: 0x3a2012, top: 0xf5d442, shorts: 0x2a2a2a, seed: 13 })
      ];
      const crowd = [
        rig.person({ skin: 0x6b3f25, hair: 'short', top: 0x2a8a5a, seed: 21, muscle: 0.3 }),
        rig.person({ skin: 0xa0603a, hair: 'curly', top: 0x4a5ad8, seed: 22, muscle: 0.2 }),
        rig.person({ skin: 0x8a5232, female: true, hair: 'braids', top: 0xff9a3d, shorts: 0x3a1a4a, seed: 23, muscle: 0.3 }),
        rig.person({ skin: 0xc58a60, female: true, hair: 'bun', top: 0x9a6bff, shorts: 0x222222, seed: 24, muscle: 0.25 })
      ];
      const everyone = [hero, reflect, thin].concat(girls, crowd);
      everyone.forEach((p) => S.add(p.g));
      const show = (list) => { everyone.forEach((p) => { p.g.visible = list.indexOf(p) >= 0; }); };
      const dress = (P, c, tank) => { P.shirt(c); P.sleeves(!tank); };
      const idle = (P, t, ph) => { P.reset(); P.breathe(t + (ph || 0)); };
      /* mélange deux poses (fonctions) : k=0 → a, k=1 → b */
      function snap(P) { const q = []; const add = (o) => q.push(o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.y, o.rotation.z); [P.g, P.b, P.hips, P.spine, P.head].concat(P.sh, P.el, P.wr, P.hp, P.kn, P.an).forEach(add); return q; }
      function put(P, q) { let i = 0; [P.g, P.b, P.hips, P.spine, P.head].concat(P.sh, P.el, P.wr, P.hp, P.kn, P.an).forEach((o) => { o.position.set(q[i], q[i + 1], q[i + 2]); o.rotation.set(q[i + 3], q[i + 4], q[i + 5]); i += 6; }); }
      function mix(P, fa, fb, k) { if (k <= 0) return fa(); if (k >= 1) return fb(); fa(); const a = snap(P); fb(); const b = snap(P); put(P, a.map((v, i) => v + (b[i] - v) * E(k))); }

      /* ---------- particules ---------- */
      function particles(n, o) {
        const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), seed = [];
        const R = rig.rnd(o.seed || 3); for (let i = 0; i < n; i++) { seed.push([R(), R(), R(), R()]); const c = new THREE.Color(o.colors ? o.colors[i % o.colors.length] : o.color || 0xffffff); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const pm = new THREE.PointsMaterial({ size: o.size || 0.1, map: o.map || dotTex, vertexColors: true, transparent: true, opacity: o.opacity == null ? 1 : o.opacity, depthWrite: false, blending: o.add === false ? THREE.NormalBlending : THREE.AdditiveBlending, alphaTest: o.add === false ? 0.3 : 0 });
        const pts = new THREE.Points(geo, pm); pts.frustumCulled = false; pts.visible = false; S.add(pts);
        return { pts, seed, pos, geo, n, o, update(t, f) { for (let i = 0; i < n; i++) { const s = seed[i], q = f(s, t, i); pos[i * 3] = q[0]; pos[i * 3 + 1] = q[1]; pos[i * 3 + 2] = q[2]; } geo.attributes.position.needsUpdate = true; } };
      }
      const embers = particles(90, { color: 0xff9a4a, size: 0.09, seed: 4 });
      const dust = particles(70, { color: 0xffe9c8, size: 0.05, opacity: 0.55, seed: 8 });
      const hearts = particles(26, { colors: [0xff3d6e, 0xff7fa0, 0xffffff, 0xff2a55], size: 0.4, map: heartTex, add: false, seed: 9 });
      const confetti = particles(110, { colors: [0xff3d6e, 0xffc233, 0xffffff, 0xa06bff, 0x58b4f0, 0xff7a2a], size: 0.14, map: starTex, add: false, seed: 12 });
      const sparkles = particles(60, { colors: [0xffd9a0, 0xffffff, 0xff9ab0], size: 0.16, map: starTex, seed: 14 });
      const drift = (x0, z0, w, d, h, sp) => (s, t) => [x0 + (s[0] - 0.5) * w + Math.sin(t * 0.6 + s[3] * 9) * 0.25, ((s[1] * h) + t * sp * (0.5 + s[2])) % h, z0 + (s[2] - 0.5) * d];
      /* pluie : segments */
      const rain = (() => { const n = 220, pos = new Float32Array(n * 6), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const R = rig.rnd(77), seeds = []; for (let i = 0; i < n; i++) seeds.push([R(), R(), R()]); const ln = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xaac4ee, transparent: true, opacity: 0.55 })); ln.frustumCulled = false; ln.visible = false; S.add(ln); return { ln, update(t, cx, cz, amt) { for (let i = 0; i < n; i++) { const s = seeds[i], x = cx + (s[0] - 0.5) * 12, z = cz + (s[2] - 0.5) * 8 - 1, y = 6 - ((s[1] * 6 + t * 7.5 * (0.8 + s[2] * 0.5)) % 6.2), l = 0.35 * amt; pos.set([x, y, z, x - l * 0.12, y + l, z], i * 6); } geo.attributes.position.needsUpdate = true; ln.material.opacity = 0.55 * amt; } }; })();
      const auras = []; const aura = (c, s, x, y, z, op) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: op == null ? 1 : op, fog: false })); m.scale.set(s, s, 1); m.position.set(x, y, z); S.add(m); auras.push(m); return m; };

      /* ---------- ville (anneau complet, silhouettes éclairées) ---------- */
      const city = GR();
      (function () {
        const wt = canv(64, 128, (x) => { x.fillStyle = '#150812'; x.fillRect(0, 0, 64, 128); const R = rig.rnd(31); for (let i = 0; i < 60; i++) { x.fillStyle = R() > 0.45 ? '#ffd9a0' : '#3a1a28'; x.fillRect(4 + (i % 5) * 12, 4 + Math.floor(i / 5) * 10, 6, 6); } });
        const bm = new THREE.MeshStandardMaterial({ color: 0x2a1020, map: wt, emissiveMap: wt, emissive: 0x997755, roughness: 0.9 }); const R = rig.rnd(5);
        for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2 + R() * 0.05, r = 17 + R() * 11, h = 3 + R() * 11, w = 1.8 + R() * 2.2; if (Math.sin(a) > 0.2) continue; /* pas d'immeuble derrière la caméra : en portrait elle recule et passerait au travers */ const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), bm); m.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r); m.rotation.y = -a; city.add(m); }
      })();
      const sun = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd9a0, fog: false })); S.add(sun);
      const moon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 20, 14), new THREE.MeshBasicMaterial({ color: 0xdfe6ff, fog: false })); S.add(moon);
      const sunGlow = aura(0xffb060, 14, 0, 0, 0, 0.8);

      /* ---------- chambre ---------- */
      const room = GR();
      const wallM = M(0x4a1830, { roughness: 0.95 }), wallM2 = M(0x3a1228, { roughness: 0.95 });
      const wall = (w, h, x, y, z, ry, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; room.add(p); return p; };
      wall(8, 4.6, 0, 2.3, -2.5, 0, wallM); wall(6, 4.6, -4, 2.3, 0.5, Math.PI / 2, wallM2); wall(6, 4.6, 4, 2.3, 0.5, -Math.PI / 2, wallM2);
      B(8, 0.16, 0.06, 0x24101a, 0, 0.08, -2.46, null, room);
      const rug = CY(1.5, 1.5, 0.03, 0x5a2038, 0.6, 0.02, -0.2, { roughness: 1 }, room, 32);
      const win = GR(room); win.position.set(-1.6, 2.3, -2.47);
      B(1.9, 2.1, 0.08, 0x2a0e1a, 0, 0, 0, null, win);
      const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.9), new THREE.MeshBasicMaterial({ map: grad([[0, '#ffe2a0'], [0.5, '#ff9a5a'], [1, '#c8456a']]), fog: false })); winGlass.position.z = 0.05; win.add(winGlass);
      B(0.06, 1.9, 0.1, 0x2a0e1a, 0, 0, 0.06, null, win); B(1.7, 0.06, 0.1, 0x2a0e1a, 0, 0.1, 0.06, null, win);
      const shafts = [0, 1, 2].map((i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6 + i * 0.1, 4.2), new THREE.MeshBasicMaterial({ map: rayTex, color: 0xffc27a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, side: THREE.DoubleSide, fog: false })); m.position.set(-1.5 + i * 0.6, 1.3, -1.6 + i * 0.3); m.rotation.set(0, 0, -0.45 + i * 0.05); room.add(m); return m; });
      /* lit */
      const bed = GR(room);
      B(3.1, 0.4, 1.5, 0x3a1a28, -1.1, 0.2, -1.4, null, bed); B(3.0, 0.22, 1.4, 0xf0d8dc, -1.1, 0.51, -1.4, { roughness: 0.95 }, bed);
      B(0.7, 0.16, 1.1, 0xffffff, -2.25, 0.7, -1.4, { roughness: 1 }, bed); B(0.1, 1.1, 1.6, 0x2a1220, -2.7, 0.55, -1.4, null, bed);
      const blanket = B(1.3, 0.24, 1.45, 0x5a2a6a, -0.02, 0.82, -1.4, { roughness: 1 }, bed);
      /* table de nuit + réveil */
      B(0.7, 0.7, 0.6, 0x2a1220, 0.9, 0.35, -2.1, null, room);
      const clock = GR(room); clock.position.set(0.9, 0.9, -2.1);
      B(0.4, 0.26, 0.2, 0x1a1a22, 0, 0, 0, { roughness: 0.4 }, clock);
      const clockFace = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2), new THREE.MeshBasicMaterial({ map: canv(128, 64, (x, w, h) => { x.fillStyle = '#240808'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff4a3a'; x.font = 'bold 42px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('06:00', w / 2, h / 2 + 2); }) })); clockFace.position.z = 0.101; clock.add(clockFace);
      const bell = [1, -1].map((s) => SP(0.07, 0xc8c8d0, s * 0.13, 0.17, 0, { metalness: 0.6, roughness: 0.3 }, clock));
      const ringWaves = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 28), new THREE.MeshBasicMaterial({ color: 0xff6a5a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); m.position.set(0.9, 1.0, -1.9); room.add(m); return m; });
      /* miroir sur pied */
      const mirrorG = GR(room); mirrorG.position.set(2.15, 0, -2.4);
      B(1.7, 2.7, 0.1, 0xff8aa8, 0, 1.55, 0, { emissive: 0x7a1030, roughness: 0.3, metalness: 0.4 }, mirrorG);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.5), new THREE.MeshBasicMaterial({ map: canv(64, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2c2a52'); gr.addColorStop(0.5, '#4a3a70'); gr.addColorStop(1, '#241f40'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.1)'; x.beginPath(); x.moveTo(8, 0); x.lineTo(28, 0); x.lineTo(8, h); x.lineTo(-12, h); x.fill(); }), fog: false })); glass.position.set(0, 1.55, 0.056); mirrorG.add(glass);
      mirrorG.add(Object.assign(new THREE.Object3D(), {}));
      /* petites déco */
      B(0.6, 0.8, 0.04, 0xffb070, 3.2, 2.4, -2.46, { emissive: 0x4a2010 }, room); B(0.5, 0.7, 0.04, 0xff9ab0, 3.2, 2.4, -2.43, { emissive: 0x4a1030 }, room);
      const lampSh = CY(0.18, 0.3, 0.3, 0xffd9a0, 3.3, 0.9, -1.9, { emissive: 0xffb060 }, room); CY(0.03, 0.03, 0.7, 0x2a1220, 3.3, 0.35, -1.9, null, room);

      /* ---------- rue ---------- */
      const street = GR();
      B(30, 0.12, 4.2, 0x3a3340, 0, 0.0, -2.8, { roughness: 0.4, metalness: 0.2 }, street);       // trottoir surélevé
      B(60, 0.02, 7, 0x262230, 0, 0.005, 3.4, { roughness: 0.35, metalness: 0.2 }, street);         // route
      for (let i = -6; i <= 6; i++) B(0.9, 0.02, 0.14, 0xf0e8d0, i * 2.6, 0.02, 3.4, null, street);
      const lamps = [-5.5, 1.2, 8].map((x) => { const l = GR(street); l.position.set(x, 0, -3.6); CY(0.06, 0.08, 3.6, 0x1e1822, 0, 1.8, 0, { metalness: 0.5 }, l); B(0.9, 0.06, 0.06, 0x1e1822, 0.4, 3.55, 0, null, l); const bulb = SP(0.14, 0xffe2a0, 0.82, 3.5, 0, { emissive: 0xffc070 }, l); const cone = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.5, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); cone.position.set(0.82, 1.75, 0); l.add(cone); const au = aura(0xffc070, 2.6, x + 0.82, 3.5, -3.6, 0.9); return { l, au, cone, bulb }; });
      const bldg = [[-8, 5.5, 3.2], [-3.5, 4.2, 2.8], [4, 6.2, 3.4], [9.5, 4.6, 3]].map((a, i) => B(a[2], a[1], 2, [0x3a1a2c, 0x30182a, 0x40202e, 0x2c1626][i], a[0], a[1] / 2, -6.2, { roughness: 0.9 }, street));
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.55 })); puddle.rotation.x = -Math.PI / 2; puddle.position.set(-3.2, 0.03, 1.4); puddle.visible = false; street.add(puddle);
      const cloud = GR(); [[0, 0, 0.7], [0.6, 0.1, 0.55], [-0.6, -0.05, 0.55], [0.2, 0.3, 0.5]].forEach((a) => SP(a[2], 0x3c3a48, a[0], a[1], 0, { roughness: 1 }, cloud)); cloud.visible = false;
      const lostRose = (() => { const r = GR(); CY(0.01, 0.01, 0.34, 0x2a7a3a, 0, 0, 0, null, r).rotation.z = Math.PI / 2; SP(0.05, 0xff2a4a, 0.18, 0, 0, { emissive: 0x550010 }, r); r.visible = false; return r; })();

      /* ---------- scène des cartes ---------- */
      const stage = GR();
      const ped = CY(1.1, 1.3, 0.5, 0x8a1538, 0, 0.25, 0, { emissive: 0xff3d6e, roughness: 0.3, metalness: 0.4 }, stage, 40);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.035, 8, 48), new THREE.MeshBasicMaterial({ color: 0xff7aa0 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.52; stage.add(ring);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.02, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffc27a, transparent: true, opacity: 0.6 })); ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.53; stage.add(ring2);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(2.6, 6.5, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xff8aa8, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 3.25; beam.rotation.x = Math.PI; stage.add(beam);
      function cardTex(name, rar, col, back, icon) {
        return canv(220, 320, (x, w, h) => {
          const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, back ? '#3a0a22' : '#2a0a1a'); gr.addColorStop(1, back ? '#12040b' : '#4a1230'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
          x.strokeStyle = col; x.lineWidth = 9; x.strokeRect(7, 7, w - 14, h - 14); x.textAlign = 'center';
          if (back) { x.fillStyle = col; x.globalAlpha = 0.9; x.beginPath(); x.moveTo(110, 120); x.bezierCurveTo(60, 160, 80, 230, 110, 240); x.bezierCurveTo(140, 230, 160, 160, 110, 120); x.fill(); x.globalAlpha = 1; x.font = '800 26px sans-serif'; x.fillText('neV', 110, 82); x.font = '800 20px sans-serif'; x.fillText('BOOSTER', 110, 290); return; }
          x.fillStyle = col; x.font = '800 20px sans-serif'; x.fillText(rar, 110, 44);
          x.save(); x.translate(110, 150); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineWidth = 9; x.lineCap = 'round'; x.lineJoin = 'round';
          if (icon === 0) { x.beginPath(); x.arc(0, -52, 14, 0, 7); x.fill(); x.beginPath(); x.moveTo(-6, -30); x.lineTo(-16, 8); x.lineTo(-34, 22); x.moveTo(6, -30); x.lineTo(16, 8); x.lineTo(34, 22); x.moveTo(-6, -30); x.lineTo(6, -30); x.moveTo(-30, -26); x.lineTo(30, -26); x.stroke(); }
          else if (icon === 1) { x.beginPath(); x.arc(-42, -26, 13, 0, 7); x.fill(); x.beginPath(); x.moveTo(-34, -16); x.lineTo(34, 8); x.moveTo(34, 8); x.lineTo(46, 24); x.moveTo(-14, -8); x.lineTo(-18, 24); x.stroke(); x.beginPath(); x.moveTo(-60, 28); x.lineTo(60, 28); x.stroke(); }
          else if (icon === 2) { x.beginPath(); x.arc(-10, -40, 13, 0, 7); x.fill(); x.beginPath(); x.moveTo(-8, -24); x.lineTo(10, 12); x.lineTo(40, 12); x.moveTo(10, 12); x.lineTo(-22, 26); x.stroke(); }
          else { x.beginPath(); x.moveTo(-50, -44); x.lineTo(50, -44); x.moveTo(-36, -52); x.lineTo(-36, -36); x.moveTo(36, -52); x.lineTo(36, -36); x.moveTo(-36, -44); x.lineTo(-26, -6); x.lineTo(-26, 24); x.moveTo(36, -44); x.lineTo(26, -6); x.lineTo(26, 24); x.stroke(); x.beginPath(); x.arc(0, -64, 12, 0, 7); x.fill(); }
          x.restore(); x.fillStyle = '#fff'; x.font = '800 32px sans-serif'; x.fillText(name, 110, 244); x.fillStyle = col; x.font = '700 20px sans-serif'; x.fillText('3 × 12', 110, 280);
        });
      }
      const CARDS = [['SQUATS', 'RARE', '#b07cff'], ['POMPES', 'ÉPIQUE', '#ff4fb8'], ['ABDOS', 'COMMUN', '#c8c8d2'], ['ÉPAULES', 'LÉGENDAIRE', '#ffcf40']];
      const cards = GR(stage);
      CARDS.forEach((d, i) => { const bk = new THREE.MeshBasicMaterial({ map: cardTex(0, 0, '#ff3d6e', 1) }), fr = new THREE.MeshBasicMaterial({ map: cardTex(d[0], d[1], d[2], 0, i) }), sd = M(0x331020); const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.15, 0.03), [sd, sd, sd, sd, fr, bk]); cards.add(m); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(d[2]), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 })); gl.scale.set(1.9, 2.4, 1); gl.position.z = -0.05; m.add(gl); m.userData.gl = gl; m.userData.col = d[2]; });
      const bigCard = (() => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.15, 0.06), [M(0xc89a30), M(0xc89a30), M(0xc89a30), M(0xc89a30), new THREE.MeshBasicMaterial({ map: cardTex('TA CARTE', 'MYTHIQUE', '#ff5a6a', 0, 3) }), new THREE.MeshBasicMaterial({ map: cardTex(0, 0, '#ffcf40', 1) })]); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff5a7a, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); gl.scale.set(4.4, 5.4, 1); gl.position.z = -0.1; m.add(gl); S.add(m); m.visible = false; return m; })();
      const rays = (() => { const gp = GR(); for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 7), new THREE.MeshBasicMaterial({ map: rayTex, color: i % 2 ? 0xffc27a : 0xff6a8a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0.5 })); m.position.y = 0; m.rotation.z = (i / 14) * Math.PI * 2; m.geometry.translate(0, 3.5, 0); gp.add(m); } gp.visible = false; return gp; })();
      /* ---------- parc d'entraînement ---------- */
      const park = GR();
      B(14, 0.03, 9, 0xc0603a, 0, 0.01, -1, { roughness: 0.9 }, park);       // piste
      for (let i = 0; i < 5; i++) B(14, 0.035, 0.07, 0xf0e0d0, 0, 0.02, -4.2 + i * 1.5 + 2.0, null, park);
      B(16, 0.04, 6, 0x4a8a4a, 0, 0.0, -7.5, { roughness: 1 }, park);
      const trees = [[-6, -6.5], [-3.4, -8], [3.8, -7.4], [6.6, -6.2], [9, -8.5], [-9, -8]].map((a, i) => { const t = GR(park); t.position.set(a[0], 0, a[1]); CY(0.14, 0.2, 1.6, 0x5a3a24, 0, 0.8, 0, null, t); SP(1.0 + (i % 3) * 0.2, [0x2f7a4a, 0x3a8a4a, 0x2a6a44][i % 3], 0, 2.2, 0, { roughness: 0.95 }, t).scale.set(1, 1.1, 1); return t; });
      for (let i = 0; i < 14; i++) B(0.06, 1.2, 0.06, 0x2a1a24, -7 + i, 0.6, -4.9, null, park);
      B(14, 0.06, 0.06, 0x2a1a24, 0, 1.15, -4.9, null, park);
      /* place / podium */
      const plaza = GR();
      CY(9, 9, 0.06, 0x4a3a50, 0, 0.03, 0, { roughness: 0.4, metalness: 0.3 }, plaza, 48);
      const podium = CY(1.3, 1.5, 0.45, 0xffc233, 0, 0.225, 0, { emissive: 0x6a4a10, roughness: 0.3, metalness: 0.5 }, plaza, 32);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.38, 5), M(0xffc233, { emissive: 0x886600, metalness: 0.6, roughness: 0.3 })); S.add(crown); crown.visible = false;

      const groups = { city, room, street, stage, park, plaza };
      const only = (names, extra) => { Object.keys(groups).forEach((k) => { groups[k].visible = names.indexOf(k) >= 0; }); sun.visible = sunGlow.visible = !!(extra && extra.sun); moon.visible = false; };
      const clearFx = () => { [embers, dust, hearts, confetti, sparkles].forEach((p) => { p.pts.visible = false; }); rain.ln.visible = false; cloud.visible = false; lostRose.visible = false; crown.visible = false; bigCard.visible = false; rays.visible = false; puddle.visible = false; cards.visible = false; shafts.forEach((s) => { s.material.opacity = 0; }); ringWaves.forEach((r) => { r.material.opacity = 0; }); auras.forEach((a) => { if (a !== sunGlow) a.visible = false; }); hud.clear(); };
      const mouseLook = (P, a) => { const m = ctx.mouse; P.look(m.x, m.y, a == null ? 1 : a); P.head.rotation.y += m.x * 0.35 * (a == null ? 1 : a); P.head.rotation.x += -m.y * 0.18 * (a == null ? 1 : a); };
      const lab = (a) => a.map((x) => '<small>' + x[0] + '</small>' + x[1]).join('');
      const pill = (t, cls) => '<span class="pill' + (cls ? ' ' + cls : '') + '">' + t + '</span>';

      /* =============================== SCÈNES =============================== */
      const sc = [];

      /* 0 — titre : l'aube sur la ville, cartes qui flottent */
      sc.push({
        en() { clearFx(); only(['city'], { sun: 1 }); show([]); setSky('dawn', [[0, '#1a0618'], [0.45, '#5a1a3c'], [0.72, '#d8455a'], [0.88, '#ff9a4a'], [1, '#ffd9a0']]); setLight({ hs: 0xff9ab0, hg: 0x301020, hi: 0.7, kc: 0xffb878, ki: 0.9, kp: [-3, 4, -8], rc: 0xff3d6e, ri: 0.6 }); setFog(0x5a1a3c, 14, 52); setFloor(0x1c0c18, { r: 0.95, m: 0 }); sun.position.set(-3, 3.3, -34); sunGlow.position.set(-3, 3.3, -33); sunGlow.visible = true; cards.parent !== S && S.add(cards); embers.pts.visible = true; sparkles.pts.visible = true; },
        up(t, D) { const p = t / D; ctx.view(L(1.5, -0.3, p), L(2.6, 2.2, p), L(15, 11, p), 0, L(3.4, 3.9, p), -10); sun.position.y = L(2.6, 4.4, p); sunGlow.position.y = sun.position.y; sunGlow.material.opacity = 0.7 + Math.sin(t * 2) * 0.05; embers.update(t, drift(0, -3, 24, 16, 14, 0.6)); sparkles.update(t, (s, tt) => [(s[0] - 0.5) * 18, 1 + s[1] * 9 + Math.sin(tt * 1.2 + s[3] * 8) * 0.3, -2 - s[2] * 10]); sparkles.pts.material.size = 0.2; cards.position.set(0, 0, 0); cards.children.forEach((c, i) => { const a = i * 1.57 + t * 0.55; c.position.set(Math.cos(a) * 3.2, 3.6 + Math.sin(a * 1.4 + i) * 0.7, -3 + Math.sin(a) * 2.6); c.rotation.set(0.1, -a + Math.PI / 2 + Math.PI, 0.1 * Math.sin(t + i)); c.userData.gl.material.opacity = 0.8; c.scale.setScalar(1.3); }); cards.visible = true; ring.visible = ring2.visible = false; ped.visible = beam.visible = false; }
        , ex() { cards.children.forEach((c) => c.scale.setScalar(1)); ring.visible = ring2.visible = ped.visible = beam.visible = true; }
      });

      /* 1 — réveil, 6 h du matin */
      sc.push({
        en() { clearFx(); only(['room'], { sun: 0 }); show([hero]); setSky('room', [[0, '#2a0a1a'], [1, '#3a1228']]); setLight({ hs: 0xff9ab0, hg: 0x301020, hi: 0.55, kc: 0xffc890, ki: 0.9, kp: [-3, 3, 4], rc: 0xff8a5a, ri: 0.6, rp: [-1.6, 2.3, -1] }); setFog(0x2a0a1a, 10, 36); setFloor(0x4a2a30, { r: 0.8, m: 0 }); hud.set('bot', pill('<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="13" r="7"/><path d="M12 9v4l3 2M5 5l3-2M19 5l-3-2"/></svg> 06:00', 'xl')); },
        up(t, D) {
          const P = hero; P.reset(); P.setM(0); dress(P, 0x8a1538);
          const sit = E(seg(t, 1.9, 3.2)), str = E(seg(t, 3.6, 4.8)) * (1 - E(seg(t, 5.8, 6.8)));
          P.g.position.set(-0.75, 0, -1.4); P.g.rotation.y = Math.PI / 2; P.hips.position.set(0, 0.86, 0); P.hips.rotation.x = -Math.PI / 2 + 0.0;
          P.spine.rotation.x = L(0.0, 1.38, sit) + 0.08 * Math.sin(t * 2) * (1 - sit); P.head.rotation.x = L(0, 0.25, sit) - 0.2 * str + 0.2 * E(seg(t, 6.8, 8)) ;
          P.sh.forEach((x, i) => { const s = i ? -1 : 1; x.rotation.z = s * (L(0.12, 0.3, sit) + 2.2 * str); x.rotation.x = L(0, -0.2, sit) * 0 - 1.1 * str * 0; P.el[i].rotation.x = -0.2 - 0.5 * str; });
          P.hp.forEach((h, i) => { h.rotation.x = 0; h.rotation.z = (i ? -1 : 1) * 0.06; }); P.kn.forEach((k) => { k.rotation.x = 0.05; });
          const eyes = t < 1.4 ? 0.08 : t < 2.4 ? 0.35 : t < 4.2 ? 0.5 : 0.7; P.face({ smile: -0.35, brow: -0.5, eye: eyes, open: str > 0.4 ? 1 : 0 });
          const ring = t > 0.5 && t < 2.6; clock.position.x = 0.9 + (ring ? Math.sin(t * 60) * 0.012 : 0); clock.rotation.z = ring ? Math.sin(t * 50) * 0.05 : 0; bell.forEach((b, i) => { b.position.y = 0.17 + (ring ? Math.abs(Math.sin(t * 40 + i * 3)) * 0.025 : 0); });
          ringWaves.forEach((r, i) => { const k = ring ? ((t * 1.6 + i * 0.5) % 1) : 0; r.scale.setScalar(0.6 + k * 1.6); r.material.opacity = ring ? (1 - k) * 0.7 : 0; r.lookAt(ctx.cam.position); });
          const sunUp = E(seg(t, 0, D)); shafts.forEach((s, i) => { s.material.opacity = (0.12 + 0.22 * sunUp) * (0.8 + 0.2 * Math.sin(t * 0.7 + i)); }); winGlass.material.color.setScalar(0.6 + 0.4 * sunUp);
          dust.pts.visible = true; dust.update(t, drift(-1.5, -0.5, 4, 3, 3.2, 0.1)); dust.pts.material.size = 0.04;
          const q = t / D; ctx.view(L(2.8, 1.5, q), L(1.55, 1.4, q), L(3.6, 2.6, q), -1.1, 1.0, -1.4);
        }, ex() { clock.position.x = 0.9; clock.rotation.z = 0; }
      });

      /* 2 — le miroir */
      const mirrorHero = (P, t, m, mood) => { P.g.position.set(1.85, 0, -0.95); P.g.rotation.y = Math.PI; };
      sc.push({
        en() { clearFx(); only(['room'], { sun: 0 }); show([hero, reflect]); setSky('room', [[0, '#2a0a1a'], [1, '#3a1228']]); setLight({ hs: 0xffa0b8, hg: 0x301020, hi: 0.65, kc: 0xffd0b0, ki: 0.95, kp: [-1, 4, 5], rc: 0xff5a7a, ri: 0.7, rp: [1.5, 3, -1] }); setFog(0x2a0a1a, 10, 36); setFloor(0x4a2a30, { r: 0.8, m: 0 }); shafts.forEach((s) => { s.material.opacity = 0.14; }); },
        up(t, D) {
          const P = hero, R = reflect; [P, R].forEach((Q) => { Q.reset(); Q.setM(0); dress(Q, 0x8a1538); });
          const look = E(seg(t, 1.5, 3)), touch = E(seg(t, 3.2, 4.2)) * (1 - E(seg(t, 6.2, 7.2))), slump = E(seg(t, 3.4, 5));
          [P, R].forEach((Q) => { Q.sh.forEach((x, i) => { const s = i ? -1 : 1; x.rotation.z = s * (0.1 + 0.5 * look); x.rotation.x = -0.15 * look; Q.el[i].rotation.z = s * 1.6 * touch; Q.el[i].rotation.x = -0.12; }); Q.spine.rotation.x = 0.1 * slump; Q.head.rotation.x = 0.28 * slump; Q.breathe(t); });
          P.g.position.set(1.45, 0, -0.85); P.g.rotation.y = Math.PI - 0.25; P.g.scale.setScalar(1);
          R.g.position.set(2.2, 0, -2.3); R.g.rotation.y = 0; R.g.scale.set(0.9, 0.9, 0.09);
          R.face({ smile: -0.7, brow: -0.9, eye: 0.85 }); R.look(0.3, -0.3, 1); R.head.rotation.y += 0; R.sh.forEach((x, i) => { x.rotation.z *= 1; });
          const lbl = lab([['Épaules', 'étroites'], ['Bras', 'fins'], ['Taille', 'très mince'], ['Jambes', 'peu de masse']]).split('<small>'); hud.set('side', lbl.slice(0, 1 + Math.min(4, Math.floor(Math.max(0, t - 2.4) * 1.1))).join('<small>'));
          hud.set('bub', t > 5 ? { t: 'Trop maigre…', x: 72, y: 26, r: 1 } : null);
          const q = t / D; ctx.view(L(4.4, 3.8, q), L(1.8, 1.65, q), L(3.4, 2.6, q), 1.95, 1.2, -1.5);
        }
      });

      /* 3 — un jour, il ose : refusé sous la pluie */
      sc.push({
        en() { clearFx(); only(['street', 'city'], { sun: 0 }); show([hero].concat(girls)); setSky('dusk', [[0, '#3a2a5a'], [0.5, '#c8506a'], [0.8, '#ff9a5a'], [1, '#ffd9a0']]); setLight({ hs: 0xffb0a0, hg: 0x302030, hi: 0.8, kc: 0xffd0a0, ki: 0.9, kp: [-4, 5, 5], rc: 0xff7a5a, ri: 0.5 }); setFog(0x7a3a4a, 14, 48); setFloor(0x262230, { r: 0.35 }); hero.hold('rose'); },
        up(t, D) {
          const P = hero; P.reset(); P.setM(0); dress(P, 0x8a1538); P.hold('rose');
          const approach = E(seg(t, 0.0, 3.0)), turned = seg(t, 3.0, 4.0), refused = seg(t, 5.2, 6.2), leave = E(seg(t, 6.8, 11.0)), rainA = E(seg(t, 5.3, 7.5));
          const x = L(-6.2, -1.9, approach) - leave * 6.0; P.g.position.set(x, 0, 1.3); P.g.rotation.y = leave > 0 ? -Math.PI / 2 + 0.2 : Math.PI / 2 - 0.1 + (1 - approach) * 0.0;
          const walking = approach < 1 || leave > 0 && leave < 1; if (walking) { P.walk(t, 6); } else { P.breathe(t); }
          if (!walking && refused < 0.01 && t > 3.2 && t < 5.1) { P.sh[0].rotation.z = 0.6; P.sh[0].rotation.x = -1.7; P.el[0].rotation.x = -0.4; P.sh[1].rotation.x = -0.9; P.el[1].rotation.x = -0.9; }   // il tend la rose
          P.hold(refused < 0.35 ? 'rose' : null); lostRose.visible = refused >= 0.35; if (lostRose.visible) { lostRose.position.set(-1.45, 0.05, 1.5); lostRose.rotation.y = 0.5; }
          if (refused > 0) { P.spine.rotation.x += 0.35 * E(refused); P.head.rotation.x += 0.5 * E(refused); P.sh.forEach((s, i) => { s.rotation.z = (i ? -1 : 1) * 0.08; s.rotation.x = 0.1; }); P.el.forEach((e) => { e.rotation.x = -0.1; }); }
          P.face({ smile: refused > 0 ? -0.9 : approach < 1 ? 0.5 : 0.35, brow: refused > 0 ? -1 : -0.2, eye: 1 });
          girls.forEach((Q, i) => { Q.reset(); Q.setM(0.1); const gx = [-0.2, 0.7, 1.55][i]; Q.g.position.set(gx, 0, 1.0 - i * 0.12); const face = turned; const base = Math.PI - 0.5 - i * 0.25; Q.g.rotation.y = L(base, base - 0.0 + (i === 1 ? -0.0 : 0), 0) + (i % 2 ? 0.3 : -0.2); const hello = t > 3.0 && t < 5.0; Q.breathe(t + i); if (hello) { Q.head.rotation.y = -0.5 + i * 0.1; } if (i === 1 && t > 4.4 && t < 6.4) { Q.sh[1].rotation.z = -0.5; Q.sh[1].rotation.x = -0.9; Q.el[1].rotation.x = -1.2; Q.g.rotation.y = Math.PI / 2 + 0.2; Q.head.rotation.y = 0.1; Q.face({ smile: -0.2, brow: 0.7, eye: 0.7 }); } else Q.face({ smile: 0.6, eye: 1 }); if (i === 0 && t > 5.2) Q.face({ smile: 0.8, eye: 0.3 }); });
          girls.forEach((Q, i) => { Q.g.rotation.y = (i === 1 && t > 4.4 && t < 6.4) ? Math.PI / 2 + 0.3 : (i === 0 ? Math.PI / 2 + 0.55 : Math.PI / 2 + 0.55 - (i - 1) * 0.1 + (t < 3 ? 0.5 : 0)); if (i === 2) Q.g.rotation.y = Math.PI / 2 + 1.1 + (t > 3.0 ? -0.5 : 0); });
          hud.set('bub', t > 2.9 && t < 4.3 ? { t: 'Salut…', x: 38, y: 40 } : t > 4.5 && t < 6.5 ? { t: 'Pas mon genre.', x: 68, y: 36 } : null); hud.set('stamp', t > 5.4 && t < 9.4 ? 1 : 0);
          cloud.visible = refused > 0.2; cloud.position.set(P.g.position.x, 3.3, 1.3); cloud.scale.setScalar(1 + 0.2 * rainA);
          rain.ln.visible = rainA > 0; rain.update(t, P.g.position.x, 1.3, rainA); puddle.visible = rainA > 0; puddle.position.set(P.g.position.x + 0.2, 0.03, 1.5);
          lamps.forEach((l) => { l.au.visible = true; l.au.material.opacity = 0.9 - 0.4 * rainA; }); hemi.intensity = L(0.8, 0.45, rainA); setSkyMix(rainA);
          const q = t / D; ctx.view(L(0.9, -1.2, E(q)), L(1.9, 1.7, q), L(9.4, 7.8, q), L(0.3, -1.8, E(q)), 1.1, 1.3);
        }, ex() { hemi.intensity = 0.9; lostRose.visible = false; hero.hold(null); rain.ln.visible = false; }
      });
      function setSkyMix(k) { /* ciel qui se couvre : on assombrit la sphère */ sky.material.color.setScalar(L(1, 0.38, k)); }

      /* 4 — la décision : 4 cartes au hasard */
      sc.push({
        en() { clearFx(); only(['stage'], { sun: 0 }); show([hero]); setSky('void', [[0, '#12040b'], [0.6, '#2a0a1a'], [1, '#4a1230']]); setLight({ hs: 0xff9ab0, hg: 0x200812, hi: 0.5, kc: 0xffffff, ki: 0.8, kp: [0, 8, 4], rc: 0xff3d6e, ri: 1.0, rp: [-3, 3, 1] }); setFog(0x12040b, 12, 40); setFloor(0x1a0a14, { r: 0.35, m: 0.5 }); sky.material.color.setScalar(1); sparkles.pts.visible = true; cards.parent !== stage && stage.add(cards); },
        up(t, D) {
          const rise = E(seg(t, 0.2, 1.8)); cards.position.set(0, L(0.6, 2.3, rise), 0); cards.visible = true;
          cards.children.forEach((c, i) => { const a = (i - 1.5) * 1.05; const sp = E(seg(t, 1.0, 2.2)); c.position.set(a * sp * 1.0, Math.sin(t * 2 + i) * 0.07, (1 - Math.cos(a * sp * 0.6)) * -0.0); const flip = E(seg(t, 3.0 + i * 0.9, 3.8 + i * 0.9)); c.rotation.y = Math.PI - flip * Math.PI + (t < 3 ? Math.sin(t * 3 + i) * 0.1 : 0); c.rotation.z = (1 - sp) * 0.2 * (i - 1.5) + Math.sin(t * 1.4 + i) * 0.03; c.userData.gl.material.opacity = flip * (1 - E(seg(t, 3.8 + i * 0.9, 5.6 + i * 0.9))) * 0.9 + 0.12 * flip; c.scale.setScalar(1 + 0.18 * Math.sin(flip * Math.PI)); });
          ring.scale.setScalar(1 + Math.sin(t * 3) * 0.05); ring2.scale.setScalar(1 + (t * 0.5 % 1) * 0.3); ring2.material.opacity = 0.6 * (1 - (t * 0.5 % 1)); beam.material.opacity = 0.1 + 0.08 * Math.sin(t * 2);
          sparkles.update(t, (s, tt) => [Math.cos(tt * 0.5 + s[0] * 6.3) * (0.8 + s[1] * 2.2), 0.6 + ((s[2] * 4 + tt * 0.5) % 4), Math.sin(tt * 0.5 + s[0] * 6.3) * (0.8 + s[1] * 2.2) - 0.3]); sparkles.pts.material.size = 0.16;
          const P = hero; P.reset(); P.setM(0.04); dress(P, 0x8a1538); P.g.position.set(-2.0, 0, 0.9); P.g.rotation.y = 0.8; P.breathe(t); P.head.rotation.x = -0.32 * E(seg(t, 0.4, 1.6)); P.head.rotation.y = 0.15; const hope = E(seg(t, 1.5, 3)); P.face({ smile: L(-0.3, 0.75, hope), brow: L(-0.3, 0.5, hope), eye: 1 }); P.sh[0].rotation.z = 0.15 + 0.3 * E(seg(t, 5.5, 7)); mouseLook(P, 0.4);
          hud.set('bot', t > 1.5 ? [CARDS[0], CARDS[1], CARDS[2], CARDS[3]].map((c, i) => pill(c[0], t > 3.6 + i * 0.9 ? '' : 'dim')).join('') : '');
          const q = t / D, a = 0.5 * Math.sin(q * 1.8 - 0.3); ctx.view(Math.sin(a) * 8.6, L(2.2, 2.8, q), Math.cos(a) * 8.6 + 0.4, -0.2, L(1.7, 1.9, q), 0);
        }, ex() { cards.children.forEach((c) => { c.scale.setScalar(1); c.userData.gl.material.opacity = 0; }); }
      });

      /* 5 — une carte, un exercice */
      const exName = ['SQUATS', 'POMPES', 'ÉPAULES'];
      sc.push({
        en() { clearFx(); only(['park', 'city'], { sun: 1 }); show([hero]); setSky('morning', [[0, '#5a7ac8'], [0.5, '#e89a8a'], [0.8, '#ffc27a'], [1, '#ffe2b0']]); setLight({ hs: 0xffe0d0, hg: 0x503040, hi: 0.95, kc: 0xffd9a8, ki: 1.2, kp: [-4, 6, 5], rc: 0xff8a5a, ri: 0.5 }); setFog(0xe8a890, 16, 55); setFloor(0x3a6a3a, { r: 0.95, m: 0 }); sun.position.set(-10, 7, -34); sunGlow.position.set(-10, 7, -33); sunGlow.material.opacity = 0.6; sky.material.color.setScalar(1); hero.hold(null); cards.parent !== S && S.add(cards); },
        up(t, D) {
          const P = hero, d1 = D * 0.31, d2 = D * 0.65, ex = t < d1 ? 0 : t < d2 ? 1 : 2;
          const rep = (tt, per) => (1 - Math.cos(tt * Math.PI * 2 / per)) / 2;
          const A = () => { P.reset(); P.setM(0.1); dress(P, 0x8a1538); P.g.position.set(-0.6, 0, 0.5); P.g.rotation.y = 0.45; P.squat(rep(t, 1.7)); P.face({ open: rep(t, 1.7) > 0.6 ? 1 : 0, smile: 0.1, brow: 0.5 }); };
          const Bp = () => { P.reset(); P.setM(0.1); dress(P, 0x8a1538); P.g.position.set(-1.6, 0, 0.5); P.g.rotation.y = Math.PI / 2 - 0.1; P.pushup(rep(t - d1, 1.5)); P.face({ open: 1, brow: 0.8 }); };
          const Cp = () => { P.reset(); P.setM(0.12); dress(P, 0x8a1538); P.g.position.set(-0.6, 0, 0.5); P.g.rotation.y = 0.35; P.press(rep(t - d2, 1.6)); P.face({ open: 1, brow: 0.7 }); };
          const sw = 0.55; if (ex === 0 && t > d1 - sw) mix(P, A, Bp, (t - (d1 - sw)) / sw / 2 + 0.0); else if (ex === 1 && t < d1 + sw) mix(P, A, Bp, 0.5 + (t - d1 + sw * 0) / sw / 2); else if (ex === 1 && t > d2 - sw) mix(P, Bp, Cp, (t - (d2 - sw)) / sw / 2); else if (ex === 2 && t < d2 + sw) mix(P, Bp, Cp, 0.5 + (t - d2) / sw / 2); else if (ex === 0) A(); else if (ex === 1) Bp(); else Cp();
          if (ex !== 2) P.hold(null);
          mouseLook(P, 0.25);
          /* carte flottante à droite */
          const c = cards.children; cards.visible = true; cards.position.set(0, 0, 0); c.forEach((m, i) => { const act = i === (ex === 0 ? 0 : ex === 1 ? 1 : 3); m.visible = act; m.userData.gl.material.opacity = act ? 0.7 : 0; m.scale.setScalar(1.15); m.position.set(1.7, 1.6 + Math.sin(t * 2) * 0.06, 0.2); const since = ex === 0 ? t : ex === 1 ? t - d1 : t - d2; m.rotation.y = -0.3 + (1 - E(since / 0.6)) * Math.PI * 0.9 + Math.sin(t * 1.3) * 0.05; });
          ring.visible = ring2.visible = ped.visible = beam.visible = false;
          const xp = Math.floor(L(0, 34, E(t / D))); hud.set('bot', exName.map((n, j) => pill(n + (j < ex ? ' ✓' : ''), j <= ex ? '' : 'dim')).join('') + '<div>' + pill('+' + xp + ' XP du jour', 'xl') + '</div>');
          dust.pts.visible = true; dust.update(t, drift(0, 0, 9, 6, 4, 0.12)); dust.pts.material.size = 0.05;
          const q = t / D; const ang = L(-0.35, 0.5, q); ctx.view(Math.sin(ang) * 8 + 0.4, L(1.7, 2.1, q), Math.cos(ang) * 8, 0.3, 0.95, 0.4);
        }, ex() { ring.visible = ring2.visible = ped.visible = beam.visible = true; cards.children.forEach((m) => { m.visible = true; m.scale.setScalar(1); }); hero.hold(null); }
      });

      /* 6 — jour après jour : 90 jours en accéléré */
      sc.push({
        en() { clearFx(); only(['park', 'city'], { sun: 1 }); show([hero]); setLight({}); setFog(0xe8a890, 16, 55); setFloor(0x3a6a3a, { r: 0.95, m: 0 }); sky.material.color.setScalar(1); hero.hold(null); },
        up(t, D) {
          const p = E(seg(t, 0.2, D - 0.8)), day = Math.max(1, Math.round(L(1, 90, p))), cyc = p * 7 /* 7 jours-écran */;
          const ph = cyc % 1, ang = ph * Math.PI;                                     // 0 = aube … 1 = nuit
          const dayK = Math.sin(ang); const sk = (a, b, k) => { const x = new THREE.Color(a), y = new THREE.Color(b); return '#' + x.lerp(y, k).getHexString(); };
          const cvs = skyTexs.cycle || (skyTexs.cycle = canv(4, 128, () => { })); const cx = cvs.image.getContext('2d'); const gr = cx.createLinearGradient(0, 0, 0, 128);
          const top = sk('#0a0820', '#4a7ad8', dayK), mid = sk('#2a1040', '#e8a08a', dayK), bot = sk('#5a2a40', '#ffe2b0', Math.pow(dayK, 0.6)); gr.addColorStop(0, top); gr.addColorStop(0.55, mid); gr.addColorStop(1, bot); cx.fillStyle = gr; cx.fillRect(0, 0, 4, 128); cvs.needsUpdate = true; sky.material.map = cvs; sky.material.needsUpdate = true;
          sun.position.set(Math.cos(Math.PI - ang) * 30, Math.sin(ang) * 22 - 2, -34); sunGlow.position.copy(sun.position); sunGlow.position.z += 1; sun.visible = sunGlow.visible = dayK > 0.05; sunGlow.material.opacity = 0.6 * dayK;
          moon.visible = dayK < 0.5; moon.position.set(Math.cos(ang) * -26, 18 - Math.sin(ang) * 6, -36);
          setFog(parseInt(mid.slice(1), 16), 16, 55); hemi.intensity = L(0.35, 1.0, dayK); key.intensity = L(0.3, 1.2, dayK); hemi.color.set(mid);
          const P = hero; P.reset(); P.setM(L(0.03, 1, p)); dress(P, 0x8a1538, p > 0.55); P.g.position.set(0, 0, 0.4); P.g.rotation.y = Math.sin(t * 0.5) * 0.4 + 0.2;
          const kind = Math.floor(cyc * 3) % 3, w = t * 1.0 + cyc * 4; const tt = t * 1.6;
          if (kind === 0) { P.squat(0.5 + 0.5 * Math.sin(tt * 4.2)); } else if (kind === 1) { P.press(0.5 + 0.5 * Math.sin(tt * 4.2)); } else { P.curl(0.5 + 0.5 * Math.sin(tt * 4.2)); P.hold('db'); }
          if (kind === 0) P.hold(null); P.face({ open: 0, smile: L(-0.1, 0.9, p), brow: L(0.2, 0, p), eye: 1 }); mouseLook(P, 0.25);
          hud.set('bot', '<div>' + pill('Jour ' + day + ' / 90', 'xl') + '</div><div>' + pill('<svg class="ic" viewBox="0 0 24 24"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/></svg> ' + day + ' jours de suite') + '</div>');
          hud.set('side', lab([['Force', Math.round(L(24, 88, p)) + '%'], ['Muscles', Math.round(L(21, 92, p)) + '%'], ['Confiance', Math.round(L(20, 96, p)) + '%']]));
          const q = t / D; ctx.view(L(1.5, 3.4, p), L(1.5, 1.8, p), L(5.8, 5.4, p), 0, 1.05, 0.3);
        }, ex() { hero.hold(null); hemi.intensity = 0.9; key.intensity = 1.1; moon.visible = false; }
      });

      /* 7 — le nouveau reflet */
      sc.push({
        en() { clearFx(); only(['room'], { sun: 0 }); show([hero, reflect]); setSky('room2', [[0, '#c8847a'], [1, '#e8b890']]); setLight({ hs: 0xfff0e0, hg: 0x8a5a50, hi: 1.0, kc: 0xffe6c0, ki: 1.15, kp: [-2, 4, 5], rc: 0xffc27a, ri: 0.7, rp: [1.5, 3, -1] }); setFog(0xc8847a, 12, 40); setFloor(0x6a4a3a, { r: 0.7, m: 0 }); sky.material.color.setScalar(1); shafts.forEach((s) => { s.material.opacity = 0.32; }); winGlass.material.color.setScalar(1); wallM.color.setHex(0x7a3a4a); wallM2.color.setHex(0x6a2a3e); },
        up(t, D) {
          const P = hero, R = reflect; [P, R].forEach((Q) => { Q.reset(); Q.setM(1); dress(Q, 0xd81e3c, 1); });
          const fl = E(seg(t, 1.4, 2.4)) * (1 - E(seg(t, 5.6, 6.6))), fl2 = E(seg(t, 6.8, 7.8)) * (1 - E(seg(t, 9.0, 10.0)));
          [P, R].forEach((Q) => { Q.flex(fl); if (fl2 > 0) { Q.flex(0); Q.sh.forEach((x, i) => { x.rotation.z = (i ? -1 : 1) * (0.25 + 0.4 * fl2); Q.el[i].rotation.x = -1.6 * fl2; }); } Q.breathe(t); Q.face({ smile: 0.3 + 0.7 * E(seg(t, 0.8, 3)), brow: 0.15, eye: 1 }); });
          P.g.position.set(1.45, 0, -0.85); P.g.rotation.y = Math.PI - 0.25 + Math.sin(t * 0.7) * 0.12; R.g.position.set(2.2, 0, -2.3); R.g.rotation.y = 0; R.g.scale.set(0.9, 0.9, 0.09); R.look(0, 0.1, 1);
          const items = [['Sourire', 'éclatant'], ['Épaules', 'larges'], ['Pecs', 'dessinés'], ['Abdos', 'ciselés'], ['Bras', 'puissants'], ['Jambes', 'solides']].map((a) => [a[0], a[1] + ' ✓']); hud.set('side', lab(items).split('<small>').slice(0, 1 + Math.min(6, Math.floor(t * 0.75))).join('<small>'));
          hud.set('bub', t > 7.4 ? { t: 'Beau. Sûr de lui.', x: 70, y: 22, r: 1 } : null);
          const q = t / D; ctx.view(L(4.6, 3.6, q), L(1.8, 1.6, q), L(3.6, 2.7, q), 1.95, 1.25, -1.5);
        }, ex() { wallM.color.setHex(0x4a1830); wallM2.color.setHex(0x3a1228); winGlass.material.color.setScalar(1); }
      });

      /* 8 — 90 jours plus tard : les regards se retournent */
      sc.push({
        en() { clearFx(); only(['street', 'city'], { sun: 1 }); show([hero].concat(girls)); setSky('sunset', [[0, '#5a2a6a'], [0.45, '#e8506a'], [0.78, '#ff9a4a'], [1, '#ffe2a0']]); setLight({ hs: 0xffc0a0, hg: 0x503040, hi: 1.0, kc: 0xffc888, ki: 1.2, kp: [-5, 3, 4], rc: 0xff7a5a, ri: 0.7 }); setFog(0xe0705a, 14, 48); setFloor(0x3a3340, { r: 0.4 }); sky.material.color.setScalar(1); sun.position.set(-12, 3.6, -34); sunGlow.position.set(-12, 3.6, -33); sunGlow.material.opacity = 0.85; hero.hold(null); hearts.pts.visible = true; lamps.forEach((l) => { l.au.visible = true; l.au.material.opacity = 0.8; }); },
        up(t, D) {
          const P = hero; P.reset(); P.setM(1); dress(P, 0xd81e3c, 1);
          const w = E(seg(t, 0, 3.4)); P.g.position.set(L(-5.4, -1.2, w), 0, 1.3); P.g.rotation.y = Math.PI / 2 - 0.15 + (1 - w) * 0.0 + E(seg(t, 3.2, 4.4)) * 0.45;
          if (w < 1) P.walk(t, 5.2); else { P.breathe(t); P.sh.forEach((x, i) => { x.rotation.z = (i ? -1 : 1) * 0.35; }); } P.face({ smile: 0.7, brow: 0.1 }); mouseLook(P, 0.3);
          girls.forEach((Q, i) => { Q.reset(); Q.setM(0.1); Q.g.position.set([0.4, 1.2, 2.0][i], 0, 1.0 - i * 0.1); const turn = E(seg(t, 1.6 + i * 0.35, 2.4 + i * 0.35)); Q.g.rotation.y = L(Math.PI / 2 + 0.7 + i * 0.2, -Math.PI / 2 - 0.15 + i * 0.1, turn); Q.breathe(t, i); const j = E(seg(t, 2.6 + i * 0.3, 3.2 + i * 0.3)); Q.face({ open: j > 0.5 ? 1 : 0, smile: 0.9, brow: -0.2, eye: 1 }); if (j > 0) { Q.sh.forEach((s, k) => { s.rotation.z = (k ? -1 : 1) * (0.25 + j * 2.2); }); Q.hips.position.y += Math.max(0, Math.sin(t * 6 + i * 2)) * 0.12 * j; } });
          const n = Math.floor(L(0, 98214, E(seg(t, 2.4, 6.6)))); hud.set('bot', t > 2.4 ? '<div>' + pill('<svg class="ic" viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg> ' + n.toLocaleString('fr-FR').replace(/ | /g, ' ') + ' J’aime') + '</div>' + (t > 4.2 ? '<div>' + pill('Abonnés +' + Math.floor(n * 0.12)) + pill('Messages ' + Math.floor(n * 0.033)) + '</div>' : '') : '');
          hearts.pts.visible = t > 2.6; hearts.update(Math.max(0, t - 2.6), (s, tt) => [-0.4 + (s[0] - 0.5) * 5, 1.4 + ((s[1] * 3 + tt * (0.7 + s[2] * 0.5)) % 3.4), 1.4 + (s[2] - 0.5) * 1.5]); hearts.pts.material.size = 0.42;
          const q = t / D; ctx.view(L(0.6, 0.0, q), L(1.6, 2.0, q), L(11.0, 9.4, q), 0.5, 1.3, 1.2);
        }, ex() { hearts.pts.visible = false; }
      });

      /* 9 — une référence : les autres veulent faire comme lui */
      sc.push({
        en() { clearFx(); only(['plaza', 'city'], { sun: 1 }); show([hero, thin].concat(crowd)); setSky('sunset2', [[0, '#3a1a5a'], [0.45, '#c8406a'], [0.78, '#ff8a4a'], [1, '#ffd890']]); setLight({ hs: 0xffc0a0, hg: 0x503040, hi: 1.0, kc: 0xffc888, ki: 1.2, kp: [-4, 5, 5], rc: 0xff7a5a, ri: 0.7 }); setFog(0xe0705a, 14, 48); setFloor(0x3a2a40, { r: 0.4 }); sky.material.color.setScalar(1); sun.position.set(10, 4, -34); sunGlow.position.set(10, 4, -33); sunGlow.material.opacity = 0.85; confetti.pts.visible = true; crown.visible = true; sparkles.pts.visible = true; },
        up(t, D) {
          const P = hero; P.reset(); P.setM(1); dress(P, 0xd81e3c, 1); P.g.position.set(0, 0.45, 0); P.g.rotation.y = Math.sin(t * 0.8) * 0.3;
          const fl = E(seg(t, 0.5, 1.3)); P.flex(fl); P.breathe(t); P.face({ smile: 1, brow: 0.2 }); mouseLook(P, 0.3);
          crown.visible = t > 1.4; crown.position.set(0, 0.45 + 2.35 + Math.sin(t * 3) * 0.05, 0); crown.rotation.y = t * 2; crown.scale.setScalar(E(seg(t, 1.4, 2.0)));
          crowd.forEach((Q, i) => { Q.reset(); Q.setM(0.25); const a = (i - 1.5) * 0.8, r = 2.3; Q.g.position.set(Math.sin(a) * r, 0, Math.cos(a) * r * 0.55 + 0.6); Q.g.rotation.y = -a * 0.7 + Math.PI * 0 + Math.PI; Q.g.rotation.y = Math.atan2(-Q.g.position.x, -Q.g.position.z + 0) ; Q.g.rotation.y = Math.PI + Math.atan2(Q.g.position.x, Q.g.position.z) * -1 + Math.PI; const k = E(seg(t, 1.6 + i * 0.35, 2.4 + i * 0.35)); Q.flex(k); Q.breathe(t, i); Q.face({ smile: 0.9, brow: 0.3, eye: 1 }); if (k > 0.9) Q.hips.position.y += Math.max(0, Math.sin(t * 5 + i)) * 0.05; });
          thin.reset(); thin.setM(0); dress(thin, 0x8a1538); thin.g.position.set(-3.4, 0, 1.4); thin.g.rotation.y = Math.PI / 2 + 0.5; thin.breathe(t); const w = t > 3.6; if (w) { thin.cheer(t, 0.9); } thin.face({ smile: 0.9, open: w ? 1 : 0, brow: 0.2, eye: 1 }); mouseLook(thin, 0.2);
          hud.set('bub', t > 4.0 ? { t: 'Moi aussi !', x: 14, y: 40 } : null);
          confetti.pts.visible = t > 1.2; confetti.update(Math.max(0, t - 1.2), (s, tt) => [(s[0] - 0.5) * 12 + Math.sin(tt * 2 + s[3] * 9) * 0.4, 7 - ((s[1] * 7 + tt * (1.2 + s[2])) % 8), (s[2] - 0.5) * 6]); confetti.pts.material.size = 0.16;
          sparkles.update(t, (s, tt) => [Math.cos(tt * 0.7 + s[0] * 6.3) * (1 + s[1] * 1.5), 0.6 + ((s[2] * 3 + tt * 0.4) % 3), Math.sin(tt * 0.7 + s[0] * 6.3) * (1 + s[1] * 1.5)]); sparkles.pts.material.size = 0.18;
          const q = t / D, a = L(-0.5, 0.55, q); ctx.view(Math.sin(a) * L(10.6, 9.0, q), L(1.4, 2.8, E(q)), Math.cos(a) * L(10.6, 9.0, q) + 0.5, -0.2, 1.4, 0.4);
        }, ex() { crown.visible = false; confetti.pts.visible = false; hero.g.position.y = 0; }
      });

      /* 10 — « Et toi ? » : la carte tournante */
      sc.push({
        en() { clearFx(); only(['stage'], { sun: 0 }); show([]); setSky('void2', [[0, '#12040b'], [0.55, '#2a0a1a'], [1, '#5a1a3a']]); setLight({ hs: 0xff9ab0, hg: 0x200812, hi: 0.6, kc: 0xffffff, ki: 0.9, kp: [0, 8, 5], rc: 0xff3d6e, ri: 1.1, rp: [-3, 3, 1] }); setFog(0x12040b, 12, 40); setFloor(0x1a0a14, { r: 0.35, m: 0.5 }); sky.material.color.setScalar(1); cards.visible = false; bigCard.visible = true; rays.visible = true; confetti.pts.visible = true; sparkles.pts.visible = true; ring.visible = ring2.visible = ped.visible = beam.visible = true; },
        up(t, D) {
          bigCard.position.set(0, 2.1 + Math.sin(t * 2) * 0.1, 0); bigCard.rotation.y = t * 0.9; bigCard.scale.setScalar(E(seg(t, 0, 1.2)) * 0.7 + 0.3);
          rays.position.copy(bigCard.position); rays.rotation.z = t * 0.12; rays.children.forEach((r, i) => { r.material.opacity = 0.32 + 0.2 * Math.sin(t * 2 + i); });
          ring.scale.setScalar(1 + Math.sin(t * 3) * 0.05); ring2.scale.setScalar(1 + (t * 0.5 % 1) * 0.3); ring2.material.opacity = 0.6 * (1 - (t * 0.5 % 1)); beam.material.opacity = 0.14 + 0.06 * Math.sin(t * 2);
          confetti.update(t, (s, tt) => [(s[0] - 0.5) * 10 + Math.sin(tt * 2 + s[3] * 9) * 0.4, 7 - ((s[1] * 7 + tt * (1 + s[2])) % 8), (s[2] - 0.5) * 5 - 1]); confetti.pts.material.size = 0.15;
          sparkles.update(t, (s, tt) => [Math.cos(tt * 0.6 + s[0] * 6.3) * (1 + s[1] * 2), 0.6 + ((s[2] * 4 + tt * 0.5) % 4), Math.sin(tt * 0.6 + s[0] * 6.3) * (1 + s[1] * 2) - 0.3]); sparkles.pts.material.size = 0.18;
          const q = t / D; ctx.view(Math.sin(q * 0.9) * 1.5, L(2.0, 2.3, q), L(7.5, 6.3, q), 0, 2.0, 0);
        }, ex() { bigCard.visible = false; rays.visible = false; }
      });

      return { sc, show, clearFx, everyone, hero, groups };
    }
  };
})(window);
