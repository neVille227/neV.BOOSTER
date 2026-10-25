/* ==========================================================
   neV.BOOSTER — hero3d.js
   Remplace le héros 2D par le personnage 3D quand l'appareil sait faire de la 3D (WebGL).
   Même interface que NEV.Hero.mount : {setStage, growTo, powerUp, setAura, destroy}.
   La version 2D s'affiche tout de suite ; la 3D la remplace dès que three.js est chargé.
   Sans WebGL, ou si le chargement échoue, le héros 2D reste : rien ne casse.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {});
  if (!NEV.Hero || !NEV.Fig3D) return;
  const orig = NEV.Hero.mount.bind(NEV.Hero);
  const reduce = () => g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hexOf = (id) => { try { const a = NEV.Rewards && NEV.Rewards.aura(id); return a && a.c ? parseInt(String(a.c[0]).replace('#', ''), 16) : 0xff3d6e; } catch (e) { return 0xff3d6e; } };

  NEV.Hero.mount = function (el, o) {
    o = o || {};
    const c2 = orig(el, o);
    if (!NEV.Fig3D.webgl()) return c2;
    let cur = c2, dead = false, k = Math.max(1, Math.min(6, o.stage || 1)), auraId = o.aura || 'none', ctl3 = null;
    const proxy = {
      setStage(n) { k = n; cur.setStage && cur.setStage(n); },
      growTo(n, cb) { k = n; return cur.growTo ? cur.growTo(n, cb) : (cb && cb()); },
      powerUp(cb) { return cur.powerUp ? cur.powerUp(cb) : (cb && cb()); },
      setAura(id) { auraId = id; cur.setAura && cur.setAura(id); },
      destroy() { dead = true; cur.destroy && cur.destroy(); }
    };
    NEV.Fig3D.load().then(function () {
      if (dead) return;
      const T = g.THREE;
      c2.destroy && c2.destroy();
      el.innerHTML = '';
      const cv = el.ownerDocument.createElement('canvas');
      cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Ton personnage en 3D');
      cv.style.cssText = 'width:100%;height:340px;display:block;touch-action:pan-y';
      el.appendChild(cv);
      const X = NEV.Fig3D.stage(cv, { alpha: true, fov: 32, floor: false });
      const hero = X.person(NEV.Fig3D.SKIN, NEV.Fig3D.SHIRT);
      X.cam.position.set(0, 1.35, 5.2); X.cam.lookAt(0, 1.05, 0);
      const disc = new T.Mesh(new T.CylinderGeometry(1, 1.1, 0.08, 32), X.M(0x8a1538, 0x551020)); disc.position.y = -0.04; X.S.add(disc);
      const ring = new T.Mesh(new T.TorusGeometry(0.95, 0.025, 8, 48), X.M(0xff3d6e, 0xff3d6e)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; X.S.add(ring);
      let m = (k - 1) / 5, target = m, pulse = 0, t0 = performance.now(), run = true, drag = 0, lastX = null;
      const setRim = () => { const c = hexOf(auraId); X.rim.color.setHex(c); ring.material.color.setHex(c); ring.material.emissive.setHex(c); };
      setRim();
      const frame = () => {
        if (!run) return;
        const t = (performance.now() - t0) / 1000;
        m += (target - m) * 0.06; hero.setM(m);
        pulse *= 0.93; X.rim.intensity = 1.6 + pulse * 4;
        hero.reset();
        const still = reduce();
        hero.g.rotation.y = (still ? 0.3 : Math.sin(t * 0.5) * 0.55) + drag;
        hero.g.position.y = pulse * 0.25 * Math.abs(Math.sin(t * 14));
        hero.b.position.y = 1 + (still ? 0 : Math.sin(t * 2) * 0.012);
        const flex = 0.18 + 0.25 * m + pulse * 1.1;
        hero.sh.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * flex; });
        hero.el.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * -(0.1 + pulse * 1.6); });
        ring.scale.setScalar(1 + pulse * 0.35); ring.material.emissiveIntensity = 0.6 + pulse;
        X.R.render(X.S, X.cam);
      };
      X.R.setAnimationLoop(frame);
      /* glisser pour tourner le personnage */
      cv.addEventListener('pointerdown', (e) => { lastX = e.clientX; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignoré */ } });
      cv.addEventListener('pointermove', (e) => { if (lastX == null) return; drag += (e.clientX - lastX) * 0.012; lastX = e.clientX; });
      const up = () => { lastX = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      const vis = () => { run = !g.document.hidden; if (run) X.R.setAnimationLoop(frame); else X.R.setAnimationLoop(null); };
      g.document.addEventListener('visibilitychange', vis);
      ctl3 = {
        setStage(n) { target = (Math.max(1, Math.min(6, n)) - 1) / 5; m = target; },
        growTo(n, cb) { target = (Math.max(1, Math.min(6, n)) - 1) / 5; pulse = 1; g.setTimeout(() => cb && cb(), 1400); },
        powerUp(cb) { pulse = 1; g.setTimeout(() => cb && cb(), 1200); },
        setAura(id) { auraId = id; setRim(); },
        destroy() { run = false; g.document.removeEventListener('visibilitychange', vis); X.dispose(); }
      };
      cur = ctl3; if (auraId !== 'none') setRim();
    }).catch(function () { /* on garde la version 2D */ });
    return proxy;
  };
})(window);
