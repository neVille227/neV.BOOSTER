/* ==========================================================
   neV.BOOSTER — story-rig.js
   Personnages 3D de « l'histoire animée » : corps lisse (capsules), visage expressif
   (yeux qui suivent, sourcils, bouche, clignements), muscles réglables, vêtements, accessoires.
   Tout est piloté par des fonctions du temps (aucune horloge interne) : l'animation peut donc
   être rejouée image par image pour fabriquer la vidéo MP4.
   Convention : le personnage regarde vers +z, sa gauche est du côté +x.
   Rotation x positive d'un membre qui pend = il part vers l'arrière ; négative = vers l'avant.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});

  NEV.StoryRig = {
    create(THREE) {
      const V2 = THREE.Vector2;
      const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
      const mat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0 }, o || {}));
      const geoCache = {};

      /* capsule dont le centre haut est en (0,0) et le centre bas en (0,-len) : pivote autour de son sommet */
      function limbGeo(r0, r1, len) {
        const k = [r0, r1, len].join('_');
        if (geoCache[k]) return geoCache[k];
        const pts = [], n = 7;
        for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * (Math.PI / 2); pts.push(new V2(r1 * Math.cos(a), -len + r1 * Math.sin(a))); }
        for (let i = 1; i <= n; i++) { const a = (i / n) * (Math.PI / 2); pts.push(new V2(r0 * Math.cos(a), r0 * Math.sin(a))); }
        pts[0].x = 0.0001; pts[pts.length - 1].x = 0.0001;
        return (geoCache[k] = new THREE.LatheGeometry(pts, 14));
      }
      function torsoGeo() {
        if (geoCache.torso) return geoCache.torso;
        const spline = new THREE.SplineCurve([[0.0001, -0.03], [0.1, -0.02], [0.135, 0.05], [0.147, 0.16], [0.17, 0.32], [0.19, 0.44], [0.185, 0.52], [0.14, 0.585], [0.06, 0.63], [0.0001, 0.645]].map((p) => new V2(p[0], p[1])));
        return (geoCache.torso = new THREE.LatheGeometry(spline.getPoints(34), 22));
      }
      const sph = (r, m, p, x, y, z, sx, sy, sz, ws, hs) => {
        const k = 's' + r + (ws || 14) + (hs || 10);
        const geo = geoCache[k] || (geoCache[k] = new THREE.SphereGeometry(r, ws || 14, hs || 10));
        const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.scale.set(sx || 1, sy || 1, sz || 1); if (p) p.add(o); return o;
      };
      const cyl = (a, b, h, m, p, x, y, z, seg) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(a, b, h, seg || 12), m); o.position.set(x || 0, y || 0, z || 0); if (p) p.add(o); return o; };
      const limb = (r0, r1, len, m, p) => { const o = new THREE.Mesh(limbGeo(r0, r1, len), m); if (p) p.add(o); return o; };

      /* ombre douce sous les pieds */
      let shadowTex = null;
      function shadowTexture() {
        if (shadowTex) return shadowTex;
        const c = g.document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
        const gr = x.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return (shadowTex = new THREE.CanvasTexture(c));
      }

      /* petit générateur pseudo-aléatoire : mêmes cheveux à chaque lancement */
      function rnd(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

      /* options : skin, hair ('curly'|'braids'|'short'|'bun'|'none'), hairColor, top, topStyle ('tee'|'tank'|'crop'|'none'), shorts, shoes, female, scale, seed */
      function person(o) {
        o = o || {};
        const female = !!o.female, S = o.scale || 1, R = rnd(o.seed || 7);
        const skin = o.skin || 0x8a5232, skinMat = mat(skin, { roughness: 0.55, emissive: new THREE.Color(skin).multiplyScalar(0.06) });
        const topMat = mat(o.top == null ? 0x8a1538 : o.top, { roughness: 0.75 }), shortsMat = mat(o.shorts == null ? 0x1d1424 : o.shorts, { roughness: 0.8 });
        const shoeMat = mat(o.shoes == null ? 0xf2f2f2 : o.shoes, { roughness: 0.5 }), hairMat = mat(o.hairColor == null ? 0x140b07 : o.hairColor, { roughness: 0.9 });
        const dark = mat(0x120808, { roughness: 0.4 }), white = mat(0xffffff, { roughness: 0.3 });
        const P = { sh: [], el: [], wr: [], hp: [], kn: [], an: [], arm: [], fore: [], thigh: [], shin: [], deltoid: [], sleeve: [], legs: [], M: 0 };
        const g0 = P.g = new THREE.Group();                   // position + cap (rotation y)
        const b = P.b = new THREE.Group(); g0.add(b);          // pivot aux pieds (pompes, chute…)
        const hips = P.hips = new THREE.Group(); hips.position.y = 0.92; b.add(hips);
        const shoulderW = female ? 0.19 : 0.215, hipW = female ? 0.115 : 0.1;

        /* bassin + short */
        P.pelvis = sph(0.165, shortsMat, hips, 0, -0.04, 0, female ? 1.2 : 1.1, 0.8, 0.85);
        const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.17, 0.16, 20), shortsMat); waist.position.y = 0.0; waist.scale.set(female ? 1.1 : 1.0, 1, 0.8); hips.add(waist);
        /* tronc */
        const spine = P.spine = new THREE.Group(); spine.position.y = 0.04; hips.add(spine);
        P.topMat = topMat; P.skinMat = skinMat;
        const torso = P.torso = new THREE.Mesh(torsoGeo(), topMat); torso.scale.set(female ? 1.02 : 1.12, 1, female ? 0.72 : 0.78); spine.add(torso);
        /* muscles visibles torse nu */
        P.pecs = [1, -1].map((s) => sph(0.085, skinMat, spine, 0.085 * s, 0.4, 0.105, 1.05, 0.8, 0.55)); P.pecs.forEach((p) => { p.visible = false; });
        P.abs = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) { const a = sph(0.04, skinMat, spine, (c ? -1 : 1) * 0.04, 0.3 - r * 0.075, 0.118 - r * 0.004, 1.0, 0.82, 0.5, 10, 8); a.visible = false; P.abs.push(a); }
        P.lats = [1, -1].map((s) => sph(0.1, skinMat, spine, 0.13 * s, 0.34, -0.02, 0.8, 1.6, 0.9, 10, 8)); P.lats.forEach((p) => { p.visible = false; });
        cyl(0.055, 0.062, 0.14, skinMat, spine, 0, 0.66, 0, 10);                                   // cou

        /* tête */
        const head = P.head = new THREE.Group(); head.position.set(0, 0.82, 0); spine.add(head);
        sph(0.2, skinMat, head, 0, 0.02, 0, 0.94, 1.07, 1.0, 20, 14);
        [1, -1].forEach((s) => sph(0.04, skinMat, head, 0.19 * s, 0.0, -0.01, 0.55, 1, 0.8, 8, 6));    // oreilles
        sph(0.032, skinMat, head, 0, -0.02, 0.2, 1, 0.9, 0.9, 8, 6);                                   // nez
        P.eyeW = []; P.pupil = []; P.brow = [];
        [1, -1].forEach((s, i) => {
          P.eyeW[i] = sph(0.04, white, head, 0.075 * s, 0.045, 0.176, 1.1, 1, 0.55, 10, 8);
          P.pupil[i] = sph(0.024, dark, head, 0.075 * s, 0.045, 0.2, 1, 1, 0.45, 8, 6); P.pupil[i].userData.b = [0.075 * s, 0.045];
          const br = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.016, 0.014), hairMat); br.position.set(0.078 * s, 0.108, 0.186); head.add(br); P.brow[i] = br;
        });
        const mouth = P.mouth = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.0095, 6, 16, Math.PI), mat(female ? 0x8a2a3a : 0x3a1410, { roughness: 0.5 }));
        mouth.position.set(0, -0.082, 0.186); head.add(mouth);
        P.open = sph(0.04, mat(0x2a0808, { roughness: 0.6 }), head, 0, -0.1, 0.18, 1, 0.7, 0.4, 10, 8); P.open.visible = false;
        /* cheveux */
        const hair = P.hair = new THREE.Group(); head.add(hair);
        const hs = o.hair || 'curly';
        if (hs === 'curly' || hs === 'short' || hs === 'braids' || hs === 'bun') {
          const nb = hs === 'curly' ? 34 : 22, rr = hs === 'curly' ? 0.065 : 0.075;
          for (let i = 0; i < nb; i++) {
            const th = R() * Math.PI * 2, ph = Math.acos(1 - R() * 0.95);            // calotte sup.
            const x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th);
            if (z > 0.35 && y < 0.55) continue;                                       // laisse le front dégagé
            sph(rr * (0.8 + R() * 0.5), hairMat, hair, x * 0.185, 0.06 + y * 0.19, z * 0.18 - 0.015, 1, 1, 1, 8, 6);
          }
          sph(0.2, hairMat, hair, 0, 0.05, -0.045, 0.98, 1.0, 0.95, 14, 10);
          if (hs === 'braids') { for (let i = 0; i < 9; i++) { const a = -0.85 + i * 0.21; const L = limb(0.022, 0.016, 0.52 + R() * 0.14, hairMat, hair); L.position.set(Math.sin(a) * 0.2, 0.02, -0.07 - Math.cos(a) * 0.04 - 0.02); L.rotation.z = -a * 0.18; L.rotation.x = 0.06; } }
          if (hs === 'bun') { sph(0.085, hairMat, hair, 0, 0.27, -0.09, 1, 1, 1, 10, 8); }
        }
        /* bras */
        [1, -1].forEach((s, i) => {
          const sh = new THREE.Group(); sh.position.set(shoulderW * s, 0.52, 0); spine.add(sh); P.sh[i] = sh;
          P.deltoid[i] = sph(0.072, o.topStyle === 'tee' || o.topStyle == null ? topMat : skinMat, sh, 0, 0, 0, 1, 1, 1, 12, 8);
          const up = P.arm[i] = limb(0.058, 0.05, 0.3, skinMat, sh);
          if (o.topStyle === 'tee' || o.topStyle == null) { const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.067, 0.071, 0.15, 12), topMat); sl.position.y = -0.075; sh.add(sl); P.sleeve[i] = sl; }
          const el = new THREE.Group(); el.position.y = -0.3; sh.add(el); P.el[i] = el; sph(0.05, skinMat, el, 0, 0, 0, 1, 1, 1, 10, 8);
          P.fore[i] = limb(0.05, 0.04, 0.27, skinMat, el);
          const wr = new THREE.Group(); wr.position.y = -0.27; el.add(wr); P.wr[i] = wr;
          sph(0.05, skinMat, wr, 0, -0.06, 0, 0.9, 1.3, 0.62, 10, 8);
        });
        /* jambes */
        [1, -1].forEach((s, i) => {
          const hp = new THREE.Group(); hp.position.set(hipW * s, -0.04, 0); hips.add(hp); P.hp[i] = hp;
          const th = P.thigh[i] = limb(0.092, 0.066, 0.44, skinMat, hp);
          const sh2 = new THREE.Mesh(limbGeo(0.108, 0.098, 0.28), shortsMat); hp.add(sh2); P.legs[i] = sh2;
          const kn = new THREE.Group(); kn.position.y = -0.44; hp.add(kn); P.kn[i] = kn; sph(0.066, skinMat, kn, 0, 0, 0, 1, 1, 1, 10, 8);
          P.shin[i] = limb(0.066, 0.045, 0.4, skinMat, kn);
          const an = new THREE.Group(); an.position.y = -0.4; kn.add(an); P.an[i] = an;
          const foot = sph(0.062, shoeMat, an, 0, -0.025, 0.07, 1.05, 0.75, 2.1, 12, 8);
          sph(0.058, mat(0x1d1424, { roughness: 0.9 }), an, 0, -0.058, 0.07, 1.05, 0.28, 2.15, 10, 6);
        });
        P.hips.position.y = 0.92;

        /* accessoires */
        const db = [], rose = new THREE.Group();
        [1, -1].forEach((s, i) => {
          const d = new THREE.Group(); d.visible = false; cyl(0.014, 0.014, 0.3, mat(0x999999, { metalness: 0.7, roughness: 0.3 }), d, 0, 0, 0, 8).rotation.z = Math.PI / 2;
          [-0.14, 0.14].forEach((x) => { const p = cyl(0.07, 0.07, 0.05, mat(0x2a1a22, { metalness: 0.4, roughness: 0.4 }), d, x, 0, 0, 14); p.rotation.z = Math.PI / 2; });
          d.position.set(0, -0.1, 0.0); P.wr[i].add(d); db[i] = d;
        });
        P.db = db;
        cyl(0.008, 0.008, 0.34, mat(0x2a7a3a), rose, 0, 0.16, 0, 6); sph(0.05, mat(0xff2a4a, { emissive: new THREE.Color(0x550010) }), rose, 0, 0.35, 0, 1, 0.9, 1, 10, 8); sph(0.035, mat(0xff5a7a), rose, 0, 0.37, 0.01, 1, 1, 1, 8, 6);
        rose.position.set(0, -0.08, 0.02); rose.rotation.x = -0.5; rose.visible = false; P.wr[1].add(rose); P.rose = rose;
        /* ombre */
        const sh = P.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
        sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; sh.renderOrder = 1; g0.add(sh);
        g0.scale.setScalar(S);

        /* ---------- réglages ---------- */
        /* masse musculaire 0..1 */
        P.setM = (m) => {
          m = clamp(m, 0, 1); P.M = m; const f = female ? 0.6 : 1;
          P.torso.scale.set((female ? 1.02 : 1.12) * (1 + 0.3 * m * f), 1.0 + 0.03 * m, (female ? 0.72 : 0.78) * (1 + 0.2 * m * f));
          P.deltoid.forEach((d) => d.scale.setScalar(1 + 0.65 * m * f));
          P.arm.forEach((a) => a.scale.set(1 + 0.75 * m * f, 1, 1 + 0.75 * m * f)); P.fore.forEach((a) => a.scale.set(1 + 0.5 * m * f, 1, 1 + 0.5 * m * f));
          P.sleeve.forEach((a) => a.scale.set(1 + 0.75 * m * f, 1, 1 + 0.75 * m * f));
          P.thigh.forEach((a) => a.scale.set(1 + 0.4 * m * f, 1, 1 + 0.4 * m * f)); P.legs.forEach((a) => a.scale.set(1 + 0.4 * m * f, 1, 1 + 0.4 * m * f)); P.shin.forEach((a) => a.scale.set(1 + 0.25 * m * f, 1, 1 + 0.25 * m * f));
          P.sh.forEach((x, i) => { x.position.x = shoulderW * (1 + 0.32 * m * f) * (i ? -1 : 1); });
          P.hp.forEach((x, i) => { x.position.x = hipW * (1 + 0.1 * m) * (i ? -1 : 1); });
          const shirtless = !P._shirt;
          P.pecs.forEach((p, i) => { p.visible = shirtless && m > 0.45; p.scale.set(1.05 * (0.7 + 0.5 * m), 0.8 * (0.7 + 0.5 * m), 0.55 * (0.7 + 0.5 * m)); p.position.x = (i ? -1 : 1) * 0.085 * (1 + 0.3 * m); });
          P.abs.forEach((a) => { a.visible = shirtless && m > 0.6; }); P.lats.forEach((a) => { a.visible = shirtless && m > 0.6; a.scale.y = 1.3 * (0.5 + m); });
          return P;
        };
        /* haut : couleur, ou null = torse nu */
        P._shirt = true; P._sl = o.topStyle === 'tee' || o.topStyle == null;
        P.shirt = (c) => {
          if (c !== undefined) { P._shirt = c !== null; if (c !== null) P.topMat.color.setHex(c); }
          const on = P._shirt; P.torso.material = on ? P.topMat : P.skinMat;
          P.sleeve.forEach((s) => { s.visible = on && P._sl; }); P.deltoid.forEach((d) => { d.material = (on && P._sl) ? P.topMat : P.skinMat; });
          return P.setM(P.M);
        };
        P.sleeves = (v) => { P._sl = v; return P.shirt(); };
        P.tint = (c) => { P.topMat.color.setHex(c); return P; };
        /* expression : smile −1..1, brow −1 (triste/inquiet) .. 1 (déterminé : sourcils bas) , open 0..1 (bouche ouverte), eye 0..1 (ouverture) */
        P.face = (f) => {
          f = f || {}; const sm = f.smile || 0, br = f.brow || 0, op = f.open || 0, ey = f.eye == null ? 1 : f.eye;
          P.mouth.visible = op < 0.3; P.mouth.rotation.z = sm >= 0 ? Math.PI : 0; P.mouth.scale.set(1 + Math.abs(sm) * 0.15, Math.max(0.04, Math.abs(sm)), 1); P.mouth.position.y = -0.082 + (sm < 0 ? -0.025 * -sm : 0.005 * sm);
          P.open.visible = op >= 0.3; P.open.scale.set(1 + 0.3 * op, 0.5 + 0.9 * op, 0.4); P.open.position.y = -0.1 - 0.012 * op;
          P.brow.forEach((x, i) => { const s = i ? -1 : 1; x.rotation.z = s * 0.5 * br; x.position.y = 0.108 - 0.012 * Math.max(0, br); });
          P.eyeW.forEach((e) => { e.scale.y = Math.max(0.08, ey); }); P.pupil.forEach((p) => { p.visible = ey > 0.35; });
          return P;
        };
        /* regard : x,y dans [-1,1] ; la tête suit un peu, les yeux davantage */
        P.look = (x, y, amt) => {
          amt = amt == null ? 1 : amt; P._lx = x * amt; P._ly = y * amt;
          P.pupil.forEach((p) => { p.position.x = p.userData.b[0] + x * amt * 0.016; p.position.y = p.userData.b[1] + y * amt * 0.012; });
          return P;
        };
        P.blink = (t) => { const k = (t * 0.29 + (o.seed || 0) * 0.37) % 1; return k < 0.035 ? 0.1 : 1; };
        P.hold = (what) => { db.forEach((d) => { d.visible = what === 'db'; }); rose.visible = what === 'rose'; return P; };
        /* position de repos */
        P.reset = () => {
          g0.position.set(0, 0, 0); g0.rotation.set(0, 0, 0); b.rotation.set(0, 0, 0); b.position.set(0, 0, 0); hips.position.set(0, 0.92, 0); hips.rotation.set(0, 0, 0);
          spine.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0);
          P.sh.forEach((x, i) => { x.rotation.set(0, 0, (i ? -1 : 1) * 0.09); }); P.el.forEach((x) => x.rotation.set(-0.12, 0, 0)); P.wr.forEach((x) => x.rotation.set(0, 0, 0));
          P.hp.forEach((x) => x.rotation.set(0, 0, 0)); P.kn.forEach((x) => x.rotation.set(0, 0, 0)); P.an.forEach((x) => x.rotation.set(0, 0, 0));
          P.face({}); P.look(0, 0, 0); g0.visible = true; P.shadow.visible = true;
          return P;
        };
        P.reset(); P.setM(o.muscle || 0); if (o.topStyle === 'none') P.shirt(null);

        /* ---------- poses (fonctions pures du temps / de la progression) ---------- */
        const sd = (i) => (i ? -1 : 1);
        P.breathe = (t) => { const k = Math.sin(t * 2.1); spine.rotation.x += 0.012 * k; P.sh.forEach((x, i) => { x.rotation.z += sd(i) * 0.012 * k; }); hips.position.y += 0.004 * k; };
        P.walk = (t, speed) => {
          const ph = t * (speed || 6.2);
          P.hp.forEach((h, i) => { const q = ph + i * Math.PI; h.rotation.x = Math.sin(q) * 0.62; P.kn[i].rotation.x = Math.max(0, -Math.cos(q)) * 0.95 + 0.06; P.an[i].rotation.x = -Math.max(0, Math.sin(q)) * 0.2; });
          P.sh.forEach((x, i) => { const q = ph + i * Math.PI; x.rotation.x = -Math.sin(q) * 0.55; x.rotation.z = sd(i) * 0.1; P.el[i].rotation.x = -0.35 - Math.max(0, Math.sin(q)) * 0.4; });
          hips.position.y = 0.92 - 0.012 + Math.abs(Math.cos(ph)) * 0.035; spine.rotation.x = 0.05; spine.rotation.y = Math.sin(ph) * 0.12; head.rotation.y = -Math.sin(ph) * 0.06;
        };
        /* lever le bras (côté i), saluer */
        P.wave = (t, i) => { i = i == null ? 0 : i; P.sh[i].rotation.z = sd(i) * 2.55; P.sh[i].rotation.x = 0; P.el[i].rotation.z = sd(i) * (0.4 + Math.sin(t * 9) * 0.55); P.el[i].rotation.x = 0; };
        /* squat : s 0..1 (les pieds restent au sol) */
        P.squat = (s) => {
          const a = 0.95 * s, th = a * 1.15, kn = a * 2.05;
          P.hp.forEach((h) => { h.rotation.x = -th; }); P.kn.forEach((k) => { k.rotation.x = kn; }); P.an.forEach((x) => { x.rotation.x = -(kn - th); });
          hips.position.y = 0.04 + 0.44 * Math.cos(th) + 0.4 * Math.cos(th - kn) + 0.065; hips.position.z = -(0.44 * Math.sin(th) - 0.4 * Math.sin(kn - th));
          spine.rotation.x = 0.3 * s; P.sh.forEach((x, i) => { x.rotation.x = -1.35 * s; x.rotation.z = sd(i) * 0.12; P.el[i].rotation.x = -0.1; });
        };
        /* pompe : s 0 (haut) .. 1 (bas) ; sol y=0, mains à z=zh devant les pieds */
        P.pushup = (s) => {
          const Lb = 1.47 /* des chevilles à l'épaule */, l1 = 0.3, l2 = 0.27 + 0.1, hs = 0.66 - s * 0.4 + 0.0 /* hauteur de l'épaule */;
          const hsh = clamp(0.35 + (1 - s) * 0.33, 0.3, 0.68) + 0.0;
          const phi = Math.asin(clamp((hsh - 0.05) / Lb, 0, 1)); const th = Math.PI / 2 - phi;   // inclinaison depuis la verticale
          b.rotation.x = th; b.position.set(0, 0.04, 0);
          const zS = Lb * Math.cos(phi); const zH = Lb * Math.cos(Math.asin((0.68 - 0.05) / Lb)) + 0.05; // mains fixes
          const dz = zH - zS, dy = 0.045 - hsh; const dd = clamp(Math.hypot(dz, dy), 0.1, l1 + l2 - 0.001);
          const cosE = (l1 * l1 + l2 * l2 - dd * dd) / (2 * l1 * l2); const E = Math.acos(clamp(cosE, -1, 1));   // angle interne du coude
          const bend = Math.PI - E;
          const base = Math.atan2(-dz, -dy);                                          // direction épaule → main
          const cs = (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd); const al = Math.acos(clamp(cs, -1, 1));
          const aU = base + al * 1.0;                                                   // le coude part en arrière
          P.sh.forEach((x, i) => { x.rotation.x = aU - th; x.rotation.z = sd(i) * 0.15; P.el[i].rotation.x = -bend; });
          P.hp.forEach((x) => { x.rotation.x = 0; }); P.kn.forEach((x) => { x.rotation.x = 0; }); P.an.forEach((x) => { x.rotation.x = 1.2; });
          head.rotation.x = -0.55; spine.rotation.x = 0;
        };
        /* développé épaules avec haltères : s 0 (bas) .. 1 (haut) */
        P.press = (s) => {
          P.hold('db');
          P.sh.forEach((x, i) => { x.rotation.z = sd(i) * (1.15 + s * 1.2); x.rotation.x = 0; P.el[i].rotation.z = sd(i) * (2.0 - s * 1.95); P.el[i].rotation.x = 0; P.wr[i].rotation.z = sd(i) * 0.0; });
          P.hp.forEach((h) => { h.rotation.x = 0; }); hips.position.y = 0.92;
        };
        /* biceps : s 0..1 (curl) */
        P.curl = (s) => { P.hold('db'); P.sh.forEach((x, i) => { x.rotation.z = sd(i) * 0.12; x.rotation.x = 0.05; P.el[i].rotation.x = -2.1 * s - 0.1; }); };
        /* pose « muscles » : bras levés pliés. k 0..1 */
        P.flex = (k) => {
          P.sh.forEach((x, i) => { x.rotation.z = sd(i) * (0.2 + 1.15 * k); x.rotation.x = 0; P.el[i].rotation.z = sd(i) * (1.9 * k); P.el[i].rotation.x = 0; });
          spine.rotation.x = -0.04 * k; head.rotation.z = 0.04 * k;
        };
        /* acclamation : bras en l'air */
        P.cheer = (t, k) => { k = k == null ? 1 : k; P.sh.forEach((x, i) => { x.rotation.z = sd(i) * (0.4 + 2.2 * k + 0.25 * Math.sin(t * 9 + i)); x.rotation.x = 0; P.el[i].rotation.z = sd(i) * -0.25 * k; }); hips.position.y = 0.92 + Math.abs(Math.sin(t * 6 + (o.seed || 0))) * 0.07 * k; P.hp.forEach((h) => h.rotation.x = 0); };
        /* dos voûté, bras ballants (tristesse) */
        P.slump = (s) => { spine.rotation.x = 0.28 * s; head.rotation.x = 0.4 * s; P.sh.forEach((x, i) => { x.rotation.x = 0.1 * s; x.rotation.z = sd(i) * (0.06); P.el[i].rotation.x = -0.15; }); };
        return P;
      }
      return { person, mat, rnd, clamp };
    }
  };
})(window);
