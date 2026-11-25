// Mécaniques de jeu : escalade de rebords, roulade, objets à lancer, établis, contrats, tyroliennes,
// barils explosifs, séries d'éliminations et événements de partie.
// G : accès au moteur (voir createPlay(...) dans main.js).
import * as THREE from 'three';

export const THROWS = { frag: { speed: 19, fuse: 2.1, color: 0x4d5f33 }, choc: { speed: 20, fuse: 4, color: 0x38b6ff }, fumi: { speed: 18, fuse: 1.4, color: 0xb9bec7 } };
export const DODGE_CD = 2.4, DODGE_T = 0.46;

export function createPlay(G) {
  const { scene, camera, BOX, matC, addBox, terrainH, queryCols, fx, sfx, sfxAt, showCenter, addXP, chars, MR, rand, pick, clamp, lerp, $, RAR, WEAPONS } = G;
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), _a = V(), _b = V(), _c = V(), cols = [], cols2 = [];

  // ---------------------------------------------------------------- escalade et roulade
  // Un corps tient-il debout ici ? (aucun mur à hauteur du corps)
  function roomAt(x, y, z) {
    queryCols(x, z, 1.2, cols2);
    for (const c of cols2) { if (c.type !== 'box' || !c.alive || c.passable) continue; if (c.maxY <= y + 0.05 || c.minY >= y + 1.8) continue; if (x > c.minX - 0.3 && x < c.maxX + 0.3 && z > c.minZ - 0.3 && z < c.maxZ + 0.3) return false; }
    return true;
  }
  // en l'air, en avançant contre un rebord à hauteur de poitrine : on s'y hisse
  function tryClimb(p, wish) {
    if (p.grounded || p.inWater || p.climb || p.zip || p.vel.y > 5.5 || p.vel.y < -14 || wish.lengthSq() < 0.2) return false;
    const wx = wish.x / wish.length(), wz = wish.z / wish.length(), px = p.pos.x + wx * 0.78, pz = p.pos.z + wz * 0.78;
    queryCols(px, pz, 1.2, cols);
    let top = -1e9, best = null;
    for (const c of cols) {
      if (c.type !== 'box' || !c.alive || c.passable || c.door || c.vehicle) continue;
      if (px < c.minX || px > c.maxX || pz < c.minZ || pz > c.maxZ) continue;
      const rel = c.maxY - p.pos.y; if (rel < 0.62 || rel > 1.5) continue;
      if (c.maxY > top) { top = c.maxY; best = c; }
    }
    if (!best) return false;
    const tx = p.pos.x + wx * 0.95, tz = p.pos.z + wz * 0.95;
    if (!roomAt(tx, top + 0.02, tz) || !roomAt(p.pos.x, top - 0.1 + 0.15, p.pos.z) || terrainH(tx, tz) > top + 0.3) return false;
    p.climb = { t: 0, dur: 0.2 + (top - p.pos.y) * 0.14, x0: p.pos.x, y0: p.pos.y, z0: p.pos.z, x1: tx, y1: top + 0.02, z1: tz, wx, wz };
    p.slideT = 0; p.crouchToggle = false; p.using = null; p.emoting = null;
    if (p.isPlayer) sfx('climb', 0.5); else sfxAt('climb', p.pos, 0.4);
    return true;
  }
  function climbStep(p, dt) {
    const c = p.climb; c.t += dt; const k = Math.min(1, c.t / c.dur), up = Math.min(1, k / 0.62), fw = clamp((k - 0.42) / 0.58, 0, 1), e = (u) => u * u * (3 - 2 * u);
    p.pos.set(lerp(c.x0, c.x1, e(fw)), lerp(c.y0, c.y1, e(up)), lerp(c.z0, c.z1, e(fw))); p.vel.set(0, 0, 0); p.grounded = false;
    if (k >= 1) { p.climb = null; p.vel.set(c.wx * 4.5, 0, c.wz * 4.5); p.grounded = true; p.landV = 0; if (p.isPlayer) G.camKick(0.12); }
  }
  function dodge(p, wx, wz) {
    if (!p.alive || p.downed || p.mode !== 'ground' || !p.grounded || p.inWater || p.climb || p.zip || p.reviving || (p.dodgeCd || 0) > 0 || p.rollT > 0) return false;
    const L = Math.hypot(wx, wz); if (L < 0.1) { wx = -Math.sin(p.yaw); wz = -Math.cos(p.yaw); } else { wx /= L; wz /= L; }
    p.rollT = DODGE_T; p.rollDir = { x: wx, z: wz }; p.dodgeCd = DODGE_CD; p.slideT = 0; p.crouchToggle = false; p.using = null; p.emoting = null; p.sprint = false;
    // sens de la roulade par rapport au regard (avant / arrière / côtés)
    const f = -(wx * Math.sin(p.yaw) + wz * Math.cos(p.yaw)), s = wx * Math.cos(p.yaw) - wz * Math.sin(p.yaw); p.rollF = f; p.rollS = s;
    if (p.isPlayer) sfx('roll', 0.6); else sfxAt('roll', p.pos, 0.4);
    fx.ringDust(p.pos, 8, 0xc8b48a, 2.4);
    return true;
  }

  // ---------------------------------------------------------------- objets à lancer
  const projs = [], smokes = [], ballG = new THREE.SphereGeometry(0.13, 10, 8);
  function projMesh(id) {
    const g = new THREE.Group(), T = THROWS[id];
    if (id === 'fumi') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 10), matC(T.color, { metalness: 0.4, roughness: 0.45 })); g.add(c); addBox(g, 0.21, 0.05, 0.21, 0, 0.05, 0, matC(0x2f6fe8)); }
    else if (id === 'choc') { g.add(new THREE.Mesh(ballG, matC(T.color, { emissive: 0x1a8ae0, emissiveIntensity: 1.2, roughness: 0.2 }))); for (const r of [0, Math.PI / 2]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 6, 18), matC(0xdfe6ee, { metalness: 0.6, roughness: 0.3 })); t.rotation.y = r; g.add(t); } }
    else { const b = new THREE.Mesh(ballG, matC(T.color, { roughness: 0.6 })); b.scale.set(1, 1.2, 1); g.add(b); addBox(g, 0.08, 0.09, 0.08, 0, 0.18, 0, matC(0x2c313c)); addBox(g, 0.03, 0.2, 0.07, 0.09, 0.1, 0, matC(0xb7bcc6)); addBox(g, 0.27, 0.04, 0.27, 0, 0, 0, matC(0x39482a)); }
    return g;
  }
  function launch(p, id, o, d, speed) {
    const m = projMesh(id); m.position.copy(o); scene.add(m);
    projs.push({ id, m, p: m.position, v: V().copy(d).multiplyScalar(speed), t: THROWS[id].fuse, by: p, rest: false, trail: 0 });
    sfxAt('throw', o, 0.8);
  }
  // sol sous un point (terrain, murs, rampes, toits) et obstacle traversé
  function bounce(q, dt) {
    const ox = q.p.x, oy = q.p.y, oz = q.p.z;
    q.p.addScaledVector(q.v, dt);
    let hit = false;
    queryCols(q.p.x, q.p.z, 1, cols);
    for (const c of cols) {
      if (!c.alive || c.passable) continue;
      if (q.p.x < c.minX - 0.12 || q.p.x > c.maxX + 0.12 || q.p.z < c.minZ - 0.12 || q.p.z > c.maxZ + 0.12) continue;
      if (c.type === 'box') {
        if (q.p.y < c.minY - 0.12 || q.p.y > c.maxY + 0.12) continue;
        hit = true;
        if (oy >= c.maxY + 0.1) { q.p.y = c.maxY + 0.13; q.v.y = Math.abs(q.v.y) * 0.38; q.v.x *= 0.7; q.v.z *= 0.7; }
        else if (ox < c.minX - 0.1 || ox > c.maxX + 0.1) { q.p.x = ox; q.v.x *= -0.45; }
        else if (oz < c.minZ - 0.1 || oz > c.maxZ + 0.1) { q.p.z = oz; q.v.z *= -0.45; }
        else { q.p.set(ox, oy, oz); q.v.y *= -0.3; q.v.x *= 0.6; q.v.z *= 0.6; }
      } else { const h = G.surfH(c, q.p.x, q.p.z); if (h !== null && q.p.y < h + 0.13 && oy > h - 0.7) { hit = true; q.p.y = h + 0.13; q.v.y = Math.abs(q.v.y) * 0.3; q.v.x *= 0.75; q.v.z *= 0.75; } }
    }
    const gy = terrainH(q.p.x, q.p.z);
    if (q.p.y < gy + 0.12 && !G.inGrotto(q.p.x, q.p.z)) { hit = true; q.p.y = gy + 0.12; q.v.y = Math.abs(q.v.y) * 0.35; q.v.x *= 0.66; q.v.z *= 0.66; }
    return hit;
  }
  function detonate(q) {
    q.dead = true; scene.remove(q.m);
    if (q.id === 'frag') G.explodeAt(q.p, 78, 5.6, q.by, 'Grenade');
    else if (q.id === 'choc') {
      fx.shock(q.p, 6); sfxAt('shock', q.p, 1);
      for (const c of chars) {
        if (!c.alive || c.mode === 'bus' || c.mode === 'drive') continue; const d = c.pos.distanceTo(q.p); if (d > 6.2) continue;
        const k = 1 - d / 9; _a.copy(c.pos).sub(q.p); _a.y = 0; if (_a.lengthSq() < 0.05) _a.set(-Math.sin(c.yaw), 0, -Math.cos(c.yaw)); _a.normalize();
        c.climb = null; if (c.zip) c.zip = null; c.vel.set(_a.x * 17 * k, 13 * k + 4, _a.z * 17 * k); c.grounded = false; c.noFall = true; c.flyT = 1.2; if (c.isPlayer) G.shakeCam(0.5);
      }
      for (const v of G.vehicles) if (!v.destroyed && v.pos.distanceTo(q.p) < 6) { _a.copy(v.pos).sub(q.p).normalize(); if (v.vel && v.vel.addScaledVector) v.vel.addScaledVector(_a, 9); }
    } else { smokes.push({ p: q.p.clone(), t: 13, e: 0 }); sfxAt('hiss', q.p, 1); }
  }
  function updateProjs(dt) {
    for (const q of projs) {
      let hit = false; const n = Math.max(1, Math.ceil(q.v.length() * dt / 0.2));
      if (!q.rest) for (let i = 0; i < n && !hit; i++) { q.v.y -= 20 * dt / n; hit = bounce(q, dt / n); }
      q.m.rotation.x += q.v.length() * dt * 1.6; q.m.rotation.z += dt * 2;
      if (hit) { if (q.id === 'choc') { detonate(q); continue; } if (q.v.length() > 3) sfxAt('clank', q.p, 0.5); if (q.v.length() < 1.1) { q.v.set(0, 0, 0); q.rest = true; } }
      // contact direct avec un adversaire : l'onde de choc part aussitôt
      if (q.id === 'choc') for (const c of chars) if (c !== q.by && c.alive && c.mode === 'ground' && c.team !== q.by.team && Math.hypot(c.pos.x - q.p.x, c.pos.z - q.p.z) < 0.8 && q.p.y > c.pos.y - 0.2 && q.p.y < c.pos.y + 2) { detonate(q); break; }
      if (q.dead) continue;
      q.trail -= dt; if (q.trail <= 0 && !q.rest) { q.trail = 0.03; if (q.id === 'choc') fx.glow(q.p.x, q.p.y, q.p.z, 0.45, 0x3aa8ff, 1.4, 0.25); else fx.smoke(q.p.x, q.p.y, q.p.z, 1, { s: 0.16, spread: 0.02, up: 0.1, life: 0.4, hex: 0xd8d8d8, a: 0.22 }); }
      if (q.id === 'frag' && q.t < 0.9) { q.blink = (q.blink || 0) - dt; if (q.blink <= 0) { q.blink = 0.14; fx.glow(q.p.x, q.p.y + 0.15, q.p.z, 0.5, 0xff3018, 3, 0.08); sfxAt('tick', q.p, 0.4); } }
      q.t -= dt; if (q.t <= 0 || q.p.y < -8) detonate(q);
    }
    for (let i = projs.length - 1; i >= 0; i--) if (projs[i].dead) projs.splice(i, 1);
    for (const s of smokes) {
      s.t -= dt; s.e -= dt;
      if (s.e <= 0 && s.t > 1.5) { s.e = 0.07; for (let i = 0; i < 2; i++) { const a = MR() * 6.28, r = Math.sqrt(MR()) * 2.6, g = 0.5 + MR() * 0.22; fx.emit('mix', s.p.x + Math.cos(a) * r, s.p.y + 0.4 + MR() * 1.5, s.p.z + Math.sin(a) * r, { vx: Math.cos(a) * 0.5, vy: 0.3, vz: Math.sin(a) * 0.5, life: 2.6 + MR(), s0: 1.6, s1: 4.4, r: g, g: g * 1.01, b: g * 1.05, a: 0.72, tile: 1 + (MR() * 2 | 0), spin: (MR() - 0.5) * 0.6, drag: 0.8, fade: 0.8 }); } }
    }
    for (let i = smokes.length - 1; i >= 0; i--) if (smokes[i].t <= 0) smokes.splice(i, 1);
  }
  // la fumée coupe-t-elle la vue entre a et b ?
  function blocked(a, b) {
    for (const s of smokes) {
      if (s.t < 1 || s.t > 12.6) continue;
      _a.copy(b).sub(a); const L = _a.length(); if (L < 0.5) continue; _a.divideScalar(L);
      _b.copy(s.p); _b.y += 1.4; _b.sub(a); const t = clamp(_b.dot(_a), 0, L); _c.copy(a).addScaledVector(_a, t); _b.add(a);
      if (_c.distanceToSquared(_b) < 7.8 && a.distanceTo(_b) > 1.4) return true;
    }
    return false;
  }
  // visée du lancer : pointillés et cercle d'arrivée
  const DOTS = 26, dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }), DOTS), dm = new THREE.Matrix4();
  dots.frustumCulled = false; dots.visible = false; dots.renderOrder = 9; dots.raycast = () => {}; scene.add(dots);
  const land = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.64, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false })); land.visible = false; land.renderOrder = 10; land.raycast = () => {}; scene.add(land);
  let aim = null;
  function throwRay(p, id, o, d) {
    camera.getWorldDirection(d); o.copy(p.pos); o.y += 1.6; o.x += Math.cos(p.yaw) * 0.3; o.z -= Math.sin(p.yaw) * 0.3;
    d.y += 0.16; d.normalize(); return THROWS[id].speed;
  }
  // appelé chaque image quand l'objet à lancer est en main ; maintenir = viser, relâcher = lancer
  function throwInput(p, it, held, dt) {
    if (p.throwCd > 0) p.throwCd -= dt;
    if (held && !(p.throwCd > 0)) {
      aim = it; const s = throwRay(p, it.id, _a, _b), q = { p: V().copy(_a), v: V().copy(_b).multiplyScalar(s) }; let n = 0, done = false;
      for (let i = 0; i < 110 && !done; i++) { q.v.y -= 20 / 50; const vy = q.v.y, hit = bounce(q, 1 / 50); if (i % 3 === 0 && n < DOTS) { const k = 1 - n / DOTS * 0.5; dm.makeScale(k, k, k).setPosition(q.p); dots.setMatrixAt(n++, dm); } if (hit && vy < 0 || hit && i > 2) done = true; }
      dots.count = n; dots.instanceMatrix.needsUpdate = true; dots.visible = true; land.position.copy(q.p); land.position.y += 0.02; land.visible = true;
    } else if (aim && !held) {
      if (aim === it && it.count > 0 && !(p.throwCd > 0)) {
        const s = throwRay(p, it.id, _a, _b); launch(p, it.id, _a, _b, s); p.throwCd = 0.7; p.throwAnim = 0.35; it.count--; G.breakDisguise(p);
        if (it.count <= 0) { p.slots[p.cur] = null; p.cur = 0; } G.updateHotbar();
      }
      stopAim();
    }
  }
  function stopAim() { aim = null; dots.visible = land.visible = false; }
  // IA : grenade sur une cible immobile ou abritée à moyenne distance
  function botThrow(b, tgt, dt) {
    if (b.hench || !b.armed || (b.nadeCd = (b.nadeCd ?? 8 + MR() * 14) - dt) > 0) return;
    const d = b.pos.distanceTo(tgt.pos); if (d < 11 || d > 27) { b.nadeCd = 1; return; }
    if ((b.nades ?? (b.nades = MR() < 0.5 ? 2 : 0)) <= 0) { b.nadeCd = 60; return; }
    b.nades--; b.nadeCd = 12 + MR() * 14; b.throwAnim = 0.35;
    _a.copy(b.pos); _a.y += 1.6; _b.copy(tgt.pos).sub(b.pos); const h = Math.hypot(_b.x, _b.z), s = 17, g = 20, v2 = s * s, y = _b.y - 1.5, disc = v2 * v2 - g * (g * h * h + 2 * y * v2);
    const ang = disc > 0 ? Math.atan2(v2 - Math.sqrt(disc), g * h) : 0.7, e = 0.09; _b.set(_b.x / h * Math.cos(ang) + (MR() - 0.5) * e, Math.sin(ang), _b.z / h * Math.cos(ang) + (MR() - 0.5) * e);
    launch(b, MR() < 0.8 ? 'frag' : 'fumi', _a, _b, s);
  }

  // ---------------------------------------------------------------- emplacements libres près d'un lieu
  const used = [];
  function freeSpot(x, z, r0, r1, clear, dir = null, flat = 0.9) {
    for (let k = 0; k < 90; k++) {
      const a = dir === null ? rand(6.283) : dir + rand(-0.75, 0.75), r = rand(r0, r1), px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r, h = terrainH(px, pz);
      if (h < 2.4 || h > 38 || G.inGrotto(px, pz)) continue;
      if (Math.abs(terrainH(px + 1.5, pz) - h) + Math.abs(terrainH(px, pz + 1.5) - h) + Math.abs(terrainH(px - 1.5, pz) - h) > flat) continue;
      let ok = true; queryCols(px, pz, clear + 2, cols);
      for (const c of cols) if (px > c.minX - clear && px < c.maxX + clear && pz > c.minZ - clear && pz < c.maxZ + clear && c.maxY > h - 0.5) { ok = false; break; }
      for (const u of used) if (Math.hypot(u.x - px, u.z - pz) < 4.5) ok = false;
      for (const d of G.doors) if (Math.hypot(d.hx - px, d.hz - pz) < 4.5) ok = false;
      for (const c of G.chests) if (Math.hypot(c.x - px, c.z - pz) < 2.5) ok = false;
      if (!ok) continue;
      const s = { x: px, z: pz, y: h }; used.push(s); return s;
    }
    return null;
  }
  const towns = G.POIS.filter((q) => !q.spy);

  // ---------------------------------------------------------------- établis : améliorer l'arme en main
  const benches = [], COST = [{ wood: 60 }, { wood: 80, stone: 40 }, { stone: 90, metal: 50 }, { metal: 140, stone: 60 }], MN = { wood: 'bois', stone: 'pierre', metal: 'métal' };
  function makeBench(s) {
    const g = new THREE.Group(), wood = matC(0x8a5a34, { roughness: 0.8 }), wood2 = matC(0xb98450, { roughness: 0.7 }), steel = matC(0x8d99a8, { metalness: 0.6, roughness: 0.35 }), red = matC(0xc43a2c, { roughness: 0.5 }), glow = matC(0x6fe0ff, { emissive: 0x2fb4ff, emissiveIntensity: 1.6 });
    addBox(g, 2.1, 0.12, 0.95, 0, 0.94, 0, wood2); addBox(g, 2.1, 0.1, 0.06, 0, 0.83, 0.43, wood); for (const x of [-0.92, 0.92]) for (const z of [-0.36, 0.36]) addBox(g, 0.13, 0.9, 0.13, x, 0.45, z, wood);
    addBox(g, 1.8, 0.08, 0.7, 0, 0.24, 0, wood); addBox(g, 0.5, 0.36, 0.42, -0.5, 0.46, 0, red); addBox(g, 0.52, 0.05, 0.44, -0.5, 0.5, 0, steel); addBox(g, 0.42, 0.3, 0.5, 0.5, 0.43, 0, matC(0x3f6b8c));
    addBox(g, 2.1, 1.05, 0.08, 0, 1.55, -0.44, wood); addBox(g, 1.9, 0.86, 0.04, 0, 1.56, -0.39, matC(0x5f7a8c, { roughness: 0.6 }));
    for (const [x, h, w] of [[-0.7, 0.5, 0.06], [-0.45, 0.36, 0.1], [-0.2, 0.46, 0.05], [0.55, 0.42, 0.07]]) { addBox(g, w, h, 0.05, x, 1.6, -0.35, steel); addBox(g, w * 2.4, 0.09, 0.07, x, 1.6 + h / 2, -0.34, wood2); }
    const saw = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 20), steel); saw.rotation.x = Math.PI / 2; saw.position.set(0.22, 1.62, -0.35); g.add(saw);
    addBox(g, 0.3, 0.22, 0.26, 0.72, 1.11, 0.08, steel); addBox(g, 0.1, 0.1, 0.5, 0.72, 1.18, 0.16, matC(0x2c313c)); // étau
    addBox(g, 0.5, 0.06, 0.36, -0.1, 1.03, 0.08, matC(0x22303c)); const core = addBox(g, 0.42, 0.02, 0.28, -0.1, 1.07, 0.08, glow);
    G.bake(g, 'etabli', [core]); const arrow = new THREE.Group(); for (const r of [-0.6, 0.6]) { const b = addBox(arrow, 0.07, 0.3, 0.07, r * 0.17, 0, 0, glow); b.rotation.z = r * 1.35; } arrow.position.set(0, 2.6, 0); g.add(arrow);
    g.position.set(s.x, s.y, s.z); g.rotation.y = s.ry; scene.add(g); g.traverse((o) => { if (o.isMesh) { o.receiveShadow = true; } });
    const c = Math.abs(Math.cos(s.ry)), n = Math.abs(Math.sin(s.ry)); G.propBox(s.x, s.y - 0.4, s.z, 1.05 * c + 0.48 * n, 1.05 * n + 0.48 * c, 1.4);
    const B = { x: s.x, y: s.y, z: s.z, g, arrow, core, t: 0 }; benches.push(B); return B;
  }
  function benchInfo() {
    const it = G.player.item;
    if (!it || it.kind !== 'weapon' || it.id === 'pickaxe') return { ok: false, text: 'Établi : prends une arme en main' };
    if (WEAPONS[it.id].mythic || it.rarity >= 4) return { ok: false, text: 'Établi : cette arme est déjà au maximum' };
    const c = COST[it.rarity], txt = Object.entries(c).map(([m, n]) => `<b style="color:${G.player.mats[m] >= n ? '#9dffb0' : '#ff8a8a'}">${n} ${MN[m]}</b>`).join(' + ');
    return { ok: Object.entries(c).every(([m, n]) => G.player.mats[m] >= n), it, c, text: `Améliorer en <span style="color:${RAR[it.rarity + 1].css}">${RAR[it.rarity + 1].name}</span> · ${txt}` };
  }
  function useBench(B) {
    const i = benchInfo(), p = G.player; if (!i.ok) { sfx('warn', 0.4); showCenter('', i.it ? 'Pas assez de matériaux' : i.text.replace('Établi : ', ''), 1.4); return; }
    for (const m in i.c) p.mats[m] -= i.c[m];
    i.it.rarity++; i.it.mag = Math.min(G.magOf(i.it), i.it.mag + 5); p.reloading = 0; p.equipT = p.equipDur = 0.4;
    sfx('forge', 0.9); fx.pickup(_a.set(B.x, B.y + 0.9, B.z), RAR[i.it.rarity].color); fx.sparks(B.x, B.y + 1.1, B.z, 26, 0xffc060, 6, 0, 0.8, 0, { size: 0.07, life: 0.7 }); fx.ring(B.x, B.y + 1.1, B.z, 2.4, RAR[i.it.rarity].color, 1.6, 0.4);
    showCenter(`<span style="color:${RAR[i.it.rarity].css}">${RAR[i.it.rarity].name.toUpperCase()}</span>`, `${WEAPONS[i.it.id].name} améliorée`, 1.8); addXP('Arme améliorée', 100); G.updateHUDStatic(); G.updateHotbar();
  }

  // ---------------------------------------------------------------- contrats
  const boards = []; let contract = null;
  function makeBoard(s) {
    const g = new THREE.Group(), wood = matC(0x6f4a2c, { roughness: 0.85 }), dark = matC(0x2b2f3a, { metalness: 0.4, roughness: 0.5 });
    for (const x of [-0.75, 0.75]) addBox(g, 0.12, 2.3, 0.12, x, 1.15, 0, dark);
    addBox(g, 1.7, 1.15, 0.08, 0, 1.55, 0, wood); addBox(g, 1.8, 0.1, 0.14, 0, 2.16, 0, dark); addBox(g, 1.8, 0.1, 0.14, 0, 0.95, 0, dark);
    const roof = addBox(g, 2.1, 0.06, 0.7, 0, 2.36, 0.08, matC(0xc8402e)); roof.rotation.x = 0.3;
    const cols3 = [0xf6ecd2, 0xffe08a, 0xd8ecff, 0xffd2c4]; let k = 0;
    for (const [x, y, w, h, r] of [[-0.48, 1.68, 0.42, 0.54, 0.06], [0.06, 1.62, 0.46, 0.6, -0.05], [0.55, 1.72, 0.36, 0.42, 0.09], [0.5, 1.2, 0.46, 0.3, -0.04], [-0.46, 1.2, 0.34, 0.26, 0.03]]) { const b = addBox(g, w, h, 0.02, x, y, 0.06, matC(cols3[k++ % 4], { roughness: 0.9 })); b.rotation.z = r; addBox(g, 0.05, 0.05, 0.04, x, y + h / 2 - 0.05, 0.075, matC(0xe23b3b)); addBox(g, w * 0.6, 0.04, 0.01, x, y, 0.073, matC(0x4a4036)); addBox(g, w * 0.5, 0.04, 0.01, x, y - 0.09, 0.073, matC(0x4a4036)); }
    G.bake(g, 'contrats'); const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), matC(0xffd23f, { emissive: 0xffa800, emissiveIntensity: 1.3 })); gem.position.y = 2.95; g.add(gem);
    g.position.set(s.x, s.y, s.z); g.rotation.y = s.ry; scene.add(g);
    const c = Math.abs(Math.cos(s.ry)), n = Math.abs(Math.sin(s.ry)); G.propBox(s.x, s.y - 0.4, s.z, 0.85 * c + 0.2 * n, 0.85 * n + 0.2 * c, 2.6);
    boards.push({ x: s.x, y: s.y, z: s.z, g, gem, cd: 0 });
  }
  const TYPES = {
    chasse: { name: 'CHASSE', dur: 150 }, butin: { name: 'PILLEUR', dur: 110 }, degats: { name: 'TIREUR', dur: 120 }, recolte: { name: 'BÛCHERON', dur: 90 }, survie: { name: 'TÉMÉRAIRE', dur: 60 },
  };
  function startContract(B, type) {
    if (contract) { showCenter('', 'Un contrat est déjà en cours', 1.4); sfx('warn', 0.3); return; }
    if (B && B.cd > G.gameT) { showCenter('', `Nouveau contrat dans ${Math.ceil(B.cd - G.gameT)} s`, 1.4); return; }
    const p = G.player, foes = chars.filter((c) => c.alive && !c.isPlayer && !c.hench && c.team !== p.team && c.mode === 'ground' && c.pos.distanceTo(p.pos) < 170 && c.pos.distanceTo(p.pos) > 18);
    const list = ['butin', 'degats', 'recolte', 'survie']; if (foes.length) list.push('chasse', 'chasse', 'chasse');
    type = type || pick(list); if (type === 'chasse' && !foes.length) type = 'butin';
    const C = contract = { type, t: TYPES[type].dur, n: 0, goal: 1, base: 0 };
    if (type === 'chasse') { foes.sort((a, b) => a.pos.distanceTo(p.pos) - b.pos.distanceTo(p.pos)); C.target = foes[Math.min(foes.length - 1, MR() * 3 | 0)]; C.text = `Élimine ${C.target.name}`; }
    else if (type === 'butin') { C.goal = 3; C.base = G.stats.chests + G.stats.supply; C.text = 'Ouvre 3 coffres ou largages'; }
    else if (type === 'degats') { C.goal = 150; C.base = G.stats.damage; C.text = 'Inflige 150 dégâts'; }
    else if (type === 'recolte') { C.goal = 120; C.base = G.matTotal(); C.text = 'Récolte 120 matériaux'; }
    else { C.goal = 60; C.text = 'Survis 60 s, ta position est révélée'; for (const b of G.bots) if (b.alive && !b.hench && !b.mate && b.pos.distanceTo(p.pos) < 90) { b.wp = p.pos.clone(); b.wpKind = 'roam'; } }
    if (B) B.cd = G.gameT + 45;
    sfx('contract', 0.8); showCenter(`CONTRAT · ${TYPES[type].name}`, C.text, 2.6);
  }
  function endContract(ok) {
    const C = contract, p = G.player; contract = null; $('contract').classList.remove('on');
    if (!ok) { sfx('warn', 0.4); if (p.alive) showCenter('CONTRAT ÉCHOUÉ', '', 1.6); return; }
    G.stats.contracts = (G.stats.contracts || 0) + 1; addXP('Contrat rempli', 400); sfx('contract', 1); showCenter('CONTRAT REMPLI', 'Récompense à tes pieds', 2.2); fx.pickup(p.pos, 0xffd23f); fx.ring(p.pos.x, p.pos.y + 0.6, p.pos.z, 4, 0xffd23f, 2, 0.5);
    const w = G.randWeaponItem(2); G.spawnLoot(w, p.pos.x, p.pos.y + 1, p.pos.z); G.spawnLoot(G.ammoFor(w.id), p.pos.x, p.pos.y + 1, p.pos.z); G.spawnLoot({ kind: 'consum', id: 'shieldL', count: 1 }, p.pos.x, p.pos.y + 1, p.pos.z); G.spawnLoot({ kind: 'consum', id: pick(['frag', 'choc']), count: 3 }, p.pos.x, p.pos.y + 1, p.pos.z);
  }
  function updateContract(dt) {
    const C = contract; if (!C) return; const p = G.player;
    C.t -= dt;
    if (C.type === 'chasse') { if (!C.target.alive) { endContract(C.target.lastHitBy === p || C.killed); return; } }
    else if (C.type === 'butin') C.n = G.stats.chests + G.stats.supply - C.base;
    else if (C.type === 'degats') C.n = G.stats.damage - C.base;
    else if (C.type === 'recolte') { const m = G.matTotal(); if (m > C.base) C.n += m - C.base; C.base = m; }
    else C.n = TYPES.survie.dur - C.t;
    if (!p.alive) { endContract(false); return; }
    if (C.type !== 'chasse' && C.n >= C.goal) { endContract(true); return; }
    if (C.t <= 0) { endContract(C.type === 'survie'); return; }
    C.ui = (C.ui || 0) - dt; if (C.ui > 0) return; C.ui = 0.15;
    const e = $('contract'), s = Math.ceil(C.t), k = C.type === 'chasse' ? C.t / TYPES.chasse.dur : clamp(C.n / C.goal, 0, 1); e.classList.add('on');
    e.innerHTML = `<b>${TYPES[C.type].name}</b><em>${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</em><span>${C.text}${C.type === 'chasse' ? ` · ${Math.round(C.target.pos.distanceTo(p.pos))} m` : ` · ${Math.min(C.goal, Math.floor(C.n))}/${C.goal}`}</span><i><u style="width:${k * 100}%"></u></i>`;
  }

  // ---------------------------------------------------------------- barils explosifs
  const barrels = [], barG = new THREE.CylinderGeometry(0.42, 0.42, 1.15, 14), bandG = new THREE.CylinderGeometry(0.45, 0.45, 0.07, 14);
  const barTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#c62a1c'; g.fillRect(0, 0, 256, 128); g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 40; i++) g.fillRect((i * 67) % 256, (i * 31) % 128, 3 + i % 9, 2); g.fillStyle = '#ffd23f'; g.fillRect(0, 46, 256, 36); g.fillStyle = '#1c1c1c'; for (let i = -2; i < 14; i++) { g.beginPath(); g.moveTo(i * 24, 82); g.lineTo(i * 24 + 12, 82); g.lineTo(i * 24 + 34, 46); g.lineTo(i * 24 + 22, 46); g.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const barMat = new THREE.MeshLambertMaterial({ map: barTex });
  function makeBarrel(x, z) {
    const y = terrainH(x, z) - 0.05, g = new THREE.Group(); const b = new THREE.Mesh(barG, barMat); b.position.y = 0.575; b.castShadow = b.receiveShadow = true; g.add(b);
    for (const h of [0.06, 0.4, 0.76, 1.1]) { const m = new THREE.Mesh(bandG, matC(0x7a1a12)); m.position.y = h; g.add(m); }
    g.position.set(x, y, z); g.rotation.y = rand(6.28); scene.add(g);
    const col = G.makeStructBox(x, y, z, 0.8, 1.15, 0.8, barMat, { hp: 45, mat: 'metal' });
    col.kind = 'barrel'; scene.remove(col.mesh); col.mesh.updateMatrixWorld(); // boîte invisible, seulement pour les tirs
    const B = { x, y, z, g, col, lit: 0 }; col.barrel = B; barrels.push(B); return B;
  }
  function barrelBoom(B, by) {
    if (B.dead) return; B.dead = true; scene.remove(B.g);
    const o = V(B.x, B.y + 0.6, B.z); G.explodeAt(o, 85, 6, by || null, 'Baril explosif');
  }
  function barrelHurt(col, amount, by) { // renvoie true si le coup est traité ici
    const B = col.barrel; B.by = by || B.by; col.hp -= amount; if (B.dead) return;
    if (col.hp <= 0 && !B.boom) { B.boom = 0.12; } else if (!B.lit) B.lit = 3.2; // percé : il brûle puis explose
  }
  function updateBarrels(dt) {
    for (const B of barrels) {
      if (B.dead) continue;
      if (B.boom > 0) { B.boom -= dt; if (B.boom <= 0) { G.destroyStruct(B.col); barrelBoom(B, B.by); } continue; }
      if (B.lit > 0) { B.lit -= dt; B.fx = (B.fx || 0) - dt; if (B.fx <= 0) { B.fx = 0.05; fx.emit('add', B.x + (MR() - 0.5) * 0.4, B.y + 1.15, B.z + (MR() - 0.5) * 0.4, { vy: 2.2, life: 0.45, s0: 0.6, s1: 0.15, r: 2.4, g: 0.9, b: 0.2, tile: 7, spin: 2, fade: 1 }); fx.smoke(B.x, B.y + 1.5, B.z, 1, { s: 0.5, up: 2, hex: 0x2c2c2c, a: 0.35, life: 1.1 }); } if (B.lit <= 0) B.boom = 0.01; }
    }
  }

  // ---------------------------------------------------------------- tyroliennes
  const zips = [];
  const zipY = (z, t) => lerp(z.a.top, z.b.top, t) - 4 * z.sag * t * (1 - t);
  const zipP = (z, t, o) => o.set(lerp(z.a.x, z.b.x, t), zipY(z, t), lerp(z.a.z, z.b.z, t));
  function zipClear(z) {
    for (let i = 1; i < 60; i++) {
      const t = i / 60; zipP(z, t, _a); if (terrainH(_a.x, _a.z) > _a.y - 4.5 || Math.hypot(_a.x - 200, _a.z - 165) < 72) return false;
      queryCols(_a.x, _a.z, 2, cols); for (const c of cols) if (c.alive && c.maxY > _a.y - 3.2 && c.minY < _a.y + 1 && _a.x > c.minX - 1.4 && _a.x < c.maxX + 1.4 && _a.z > c.minZ - 1.4 && _a.z < c.maxZ + 1.4) return false;
    }
    return true;
  }
  function makeMast(e, other) {
    const g = new THREE.Group(), steel = matC(0x6d7886, { metalness: 0.55, roughness: 0.4 }), yel = matC(0xf2b81f, { roughness: 0.5 }), H = e.top - e.y;
    for (const [x, z] of [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]]) addBox(g, 0.1, H + 0.5, 0.1, x, H / 2, z, steel);
    for (let y = 1.1; y < H; y += 1.5) { addBox(g, 0.78, 0.06, 0.06, 0, y, 0.34, steel); addBox(g, 0.78, 0.06, 0.06, 0, y, -0.34, steel); addBox(g, 0.06, 0.06, 0.78, 0.34, y, 0, steel); addBox(g, 0.06, 0.06, 0.78, -0.34, y, 0, steel); const d = addBox(g, 0.05, 1.6, 0.05, 0, y + 0.7, 0.34, steel); d.rotation.z = 0.46; }
    addBox(g, 1.5, 0.16, 1.5, 0, 0.0, 0, matC(0x4c535d)); addBox(g, 1.1, 0.14, 1.1, 0, H + 0.5, 0, yel); addBox(g, 0.3, 0.3, 1.2, 0, H + 0.2, 0, yel); addBox(g, 0.9, 0.5, 0.05, 0, 1.7, 0.42, yel); addBox(g, 0.5, 0.1, 0.06, 0, 1.7, 0.44, matC(0x22262e));
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), matC(0x6cff9a, { emissive: 0x28ff70, emissiveIntensity: 1.8 })); l.position.y = H + 0.72; g.add(l);
    g.position.set(e.x, e.y, e.z); g.rotation.y = Math.atan2(other.x - e.x, other.z - e.z); G.bake(g, 'mast' + H.toFixed(1)); scene.add(g);
    G.propBox(e.x, e.y - 0.5, e.z, 0.5, 0.5, H + 1);
  }
  function makeZip(q, r) {
    const ang = Math.atan2(r.z - q.z, r.x - q.x), a = freeSpot(q.x, q.z, q.r * 0.55, q.r + 14, 1.6, ang, 1.5), b = a && freeSpot(r.x, r.z, r.r * 0.55, r.r + 14, 1.6, ang + Math.PI, 1.5);
    if (!b) return false;
    const L = Math.hypot(a.x - b.x, a.z - b.z), z = { a: { ...a, top: 0 }, b: { ...b, top: 0 }, sag: Math.min(3, L * 0.016), L };
    for (const h of [13, 17, 22]) {
      z.a.top = a.y + h; z.b.top = b.y + h; if (!zipClear(z)) continue;
      makeMast(z.a, z.b); makeMast(z.b, z.a);
      const pts = []; for (let i = 0; i <= 40; i++) pts.push(zipP(z, i / 40, V())); const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.026, 5), matC(0x20242c, { metalness: 0.5, roughness: 0.5 })); tube.raycast = () => {}; scene.add(tube);
      zips.push(z); return true;
    }
    return false;
  }
  function nearZip() { const p = G.player; if (p.zip || p.zipCd > G.gameT) return null; for (const z of zips) for (const e of ['a', 'b']) if (Math.hypot(z[e].x - p.pos.x, z[e].z - p.pos.z) < 2.6 && Math.abs(z[e].y - p.pos.y) < 2.5) return { z, e }; return null; }
  function rideZip(p, z, e) { p.zip = { z, t: e === 'a' ? 0 : 1, d: e === 'a' ? 1 : -1, k: 0, v: 4, from: p.pos.clone() }; p.slideT = 0; p.crouchToggle = false; p.using = null; p.emoting = null; G.setBuildModeOff(); sfx('zip', 0.7); }
  function zipStep(p, dt) {
    const Z = p.zip, z = Z.z; Z.k = Math.min(1, Z.k + dt * 1.7); Z.v = Math.min(27, Z.v + dt * 16);
    if (Z.k > 0.75) Z.t += Z.d * Z.v * dt / z.L;
    zipP(z, clamp(Z.t, 0.004, 0.996), _a); _a.y -= 2.25; const k = Z.k * Z.k * (3 - 2 * Z.k);
    const ox = p.pos.x, oz = p.pos.z; p.pos.lerpVectors(Z.from, _a, k); p.vel.set((p.pos.x - ox) / Math.max(dt, 1e-3), 0, (p.pos.z - oz) / Math.max(dt, 1e-3)); p.grounded = false;
    Z.s = (Z.s || 0) - dt; if (Z.s <= 0) { Z.s = 0.22; if (p.isPlayer) sfx('zip', 0.25); }
    const end = Z.t <= 0.01 && Z.d < 0 || Z.t >= 0.99 && Z.d > 0;
    if (end) dropZip(p, 5);
  }
  function dropZip(p, up = 3) { const Z = p.zip; if (!Z) return; p.zip = null; p.zipCd = G.gameT + 0.8; const dx = (Z.z.b.x - Z.z.a.x) / Z.z.L * Z.d, dz = (Z.z.b.z - Z.z.a.z) / Z.z.L * Z.d, v = Math.min(13, Z.v * 0.55); p.vel.set(dx * v, up, dz * v); p.noFall = true; p.grounded = false; }

  // ---------------------------------------------------------------- séries d'éliminations
  const SERIES = ['', '', 'DOUBLÉ', 'TRIPLÉ', 'QUADRUPLÉ', 'CARNAGE', 'INARRÊTABLE']; let chain = 0, chainT = 0;
  function medal(title, sub, hex) { const e = $('medal'); e.innerHTML = `<b style="color:${hex}">${title}</b><span>${sub}</span>`; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); }
  function onKill(t, by, head, dist) {
    if (by && by.isPlayer && contract && contract.target === t) contract.killed = true;
    if (!by || !by.isPlayer || t === by || t.hench) return;
    chain = chainT > 0 ? chain + 1 : 1; chainT = 14; const xp = [0, 0, 100, 200, 300, 400, 500][Math.min(6, chain)];
    if (chain > 1) { medal(SERIES[Math.min(6, chain)], `+${xp} XP`, '#ffb547'); sfx('medal', 0.6 + chain * 0.08); addXP(SERIES[Math.min(6, chain)], xp, true); }
    else if (dist > 90) { medal('TIR LOINTAIN', `${Math.round(dist)} m · +150 XP`, '#7fd8ff'); sfx('medal', 0.6); addXP('Tir lointain', 150, true); }
    else if (head) { medal('PLEINE TÊTE', '+75 XP', '#ffe35c'); sfx('medal', 0.5); addXP('Pleine tête', 75, true); }
    else if (by.pos.y - t.pos.y > 8 && !by.grounded) { medal('AIGLE', '+120 XP', '#c9a2ff'); sfx('medal', 0.6); addXP('Aigle', 120, true); }
  }

  // ---------------------------------------------------------------- événements de partie
  const EV = {
    meteores: { name: 'PLUIE DE MÉTÉORITES', sub: 'Elles cachent du butin rare, mais ne reste pas dessous', dur: 26, hex: '#ff9a4a' },
    lune: { name: 'GRAVITÉ LUNAIRE', sub: 'Sauts géants, aucun dégât de chute', dur: 45, hex: '#b9a2ff' },
    or: { name: 'RUÉE VERS L\'OR', sub: 'Les coffres donnent une arme de plus', dur: 60, hex: '#ffd23f' },
    vent: { name: 'VENT ARRIÈRE', sub: 'Tout le monde court plus vite', dur: 45, hex: '#7fffd4' },
  };
  // au hasard pendant la partie ; désactivés dans les navigateurs pilotés par les tests (résultats reproductibles)
  let ev = null, evBag = [], nextEv = 150 + MR() * 40, autoEv = !navigator.webdriver; const meteors = [];
  const mG = new THREE.IcosahedronGeometry(1.3, 1), mM = new THREE.MeshLambertMaterial({ color: 0x3a2a22, emissive: 0xff5a10, emissiveIntensity: 1.1 });
  const warnG = new THREE.RingGeometry(0.93, 1, 40).rotateX(-Math.PI / 2);
  function startEvent(id) {
    if (!id) { if (!evBag.length) { evBag = Object.keys(EV); for (let i = evBag.length - 1; i > 0; i--) { const j = MR() * (i + 1) | 0; [evBag[i], evBag[j]] = [evBag[j], evBag[i]]; } } id = evBag.pop(); }
    ev = { id, ...EV[id], t: EV[id].dur, n: 0 }; sfx('event', 0.9); const b = $('evBanner'); b.innerHTML = `<small>ÉVÉNEMENT</small><b style="color:${ev.hex}">${ev.name}</b><span>${ev.sub}</span>`; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
  }
  function endEvent() { ev = null; $('evTag').classList.remove('on'); }
  function dropMeteor() {
    const p = G.player, s = G.storm, near = MR() < 0.55 && p.alive && !p.inStorm, c = near ? G.randomLandPoint(p.pos.x, p.pos.z, 38) : G.randomLandPoint(s.phase >= 0 ? s.nx : p.pos.x, s.phase >= 0 ? s.nz : p.pos.z, s.phase >= 0 ? Math.max(20, s.nr * 0.9) : 150), y = G.topAt(c.x, c.z);
    const m = new THREE.Mesh(mG, mM); const st = V(c.x + 46 + MR() * 20, y + 95, c.z + (MR() - 0.5) * 60); m.position.copy(st); scene.add(m);
    const w = new THREE.Mesh(warnG, new THREE.MeshBasicMaterial({ color: 0xff5a20, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); w.position.set(c.x, y + 0.15, c.z); w.scale.setScalar(4.5); w.raycast = () => {}; scene.add(w);
    meteors.push({ m, w, st, en: V(c.x, y + 0.4, c.z), t: 0, dur: 2.6, e: 0 }); if (p.pos.distanceTo(c) < 60) sfxAt('meteor', _a.set(c.x, y + 20, c.z), 1.4);
  }
  function updateMeteors(dt) {
    for (const q of meteors) {
      q.t += dt; const k = Math.min(1, q.t / q.dur); q.m.position.lerpVectors(q.st, q.en, k); q.m.rotation.x += dt * 5; q.m.rotation.y += dt * 3; q.w.material.opacity = 0.35 + 0.45 * Math.abs(Math.sin(q.t * 9)); q.w.scale.setScalar(4.5 * (1.15 - 0.15 * k));
      for (let j = 0; j < 3; j++) { const p = _a.lerpVectors(q.st, q.en, Math.max(0, k - j / 3 * dt / q.dur)); fx.emit('mix', p.x, p.y, p.z, { vx: (MR() - 0.5) * 2, vy: 1, vz: (MR() - 0.5) * 2, life: 0.6, s0: 3.2, s1: 0.8, r: 2.6, g: 0.9, b: 0.22, tile: 7, spin: 2, fade: 1.2 }); fx.emit('mix', p.x, p.y, p.z, { life: 1.5, delay: 0.25, s0: 1.2, s1: 3.4, r: 0.13, g: 0.12, b: 0.12, a: 0.4, tile: 1, spin: 0.6, vy: 0.5, fade: 1.2 }); }
      if (k >= 1) {
        q.dead = true; scene.remove(q.m); scene.remove(q.w); q.w.material.dispose(); G.explodeAt(q.en, 48, 4.6, null, 'météorite');
        const w = G.randWeaponItem(2); G.spawnLoot(w, q.en.x, q.en.y + 0.6, q.en.z); G.spawnLoot(G.ammoFor(w.id), q.en.x, q.en.y + 0.6, q.en.z); if (MR() < 0.5) G.spawnLoot({ kind: 'consum', id: pick(['shieldS', 'shieldL', 'frag', 'choc']), count: 2 }, q.en.x, q.en.y + 0.6, q.en.z); else G.spawnLoot({ kind: 'mats', mat: 'metal', amount: 60 }, q.en.x, q.en.y + 0.6, q.en.z);
      }
    }
    for (let i = meteors.length - 1; i >= 0; i--) if (meteors[i].dead) meteors.splice(i, 1);
  }
  function updateEvents(dt) {
    if (!ev && autoEv && G.state === 'playing' && G.gameT > nextEv && chars.filter((c) => c.alive && !c.hench).length > 4) { startEvent(); nextEv = G.gameT + ev.dur + 85 + MR() * 45; }
    if (ev) {
      ev.t -= dt; if (ev.id === 'meteores') { ev.n -= dt; if (ev.n <= 0 && ev.t > 2) { ev.n = 1.1 + MR() * 0.9; dropMeteor(); } }
      ev.ui = (ev.ui || 0) - dt; if (ev.ui <= 0) { ev.ui = 0.2; const e = $('evTag'); e.classList.add('on'); e.innerHTML = `<b style="color:${ev.hex}">${ev.name}</b> ${Math.ceil(ev.t)} s`; }
      if (ev.t <= 0) endEvent();
    }
    updateMeteors(dt);
  }

  // ---------------------------------------------------------------- mise en place
  for (const q of towns) {
    const b = freeSpot(q.x, q.z, 3, q.r * 0.8, 2.2); if (b) { b.ry = Math.atan2(q.x - b.x, q.z - b.z); makeBench(b); }
    const c = freeSpot(q.x, q.z, 3, q.r * 0.85, 2); if (c) { c.ry = Math.atan2(q.x - c.x, q.z - c.z); makeBoard(c); }
    for (let i = 0; i < 2; i++) { const s = freeSpot(q.x, q.z, 4, q.r * 0.95, 1.4); if (!s) continue; makeBarrel(s.x, s.z); if (MR() < 0.6) { const a = rand(6.28), x = s.x + Math.cos(a) * 1.05, z = s.z + Math.sin(a) * 1.05; if (Math.abs(terrainH(x, z) - s.y) < 0.3) makeBarrel(x, z); } }
  }
  { const pairs = []; for (let i = 0; i < towns.length; i++) for (let j = i + 1; j < towns.length; j++) { const d = Math.hypot(towns[i].x - towns[j].x, towns[i].z - towns[j].z); if (d > 70 && d < 290) pairs.push([d, towns[i], towns[j]]); } pairs.sort((a, b) => a[0] - b[0]); const deg = new Map(); for (const [, a, b] of pairs) { if (zips.length >= 6) break; if ((deg.get(a) || 0) > 1 || (deg.get(b) || 0) > 1) continue; if (makeZip(a, b)) { deg.set(a, (deg.get(a) || 0) + 1); deg.set(b, (deg.get(b) || 0) + 1); } } }

  return {
    benches, boards, barrels, zips, projs, smokes, meteors, startEvent, endEvent, startContract, launch, tryClimb, climbStep, dodge, throwInput, stopAim, botThrow, blocked, zipStep, dropZip, rideZip, onKill, barrelHurt, benchInfo,
    get contract() { return contract; }, get event() { return ev; }, set autoEvents(v) { autoEv = v; },
    get gravK() { return ev && ev.id === 'lune' ? 0.42 : 1; }, get runK() { return ev && ev.id === 'vent' ? 1.24 : 1; }, get gold() { return !!ev && ev.id === 'or'; },
    // objets interactifs les plus proches : { type, ref, d }
    nearest(p, best, bd) {
      for (const b of benches) { const d = Math.hypot(b.x - p.pos.x, b.z - p.pos.z) + Math.abs(b.y - p.pos.y) * 0.5; if (d < 2.5 && d < bd) { bd = d; best = { type: 'bench', b }; } }
      for (const b of boards) { const d = Math.hypot(b.x - p.pos.x, b.z - p.pos.z) + Math.abs(b.y - p.pos.y) * 0.5; if (d < 2.4 && d < bd) { bd = d; best = { type: 'board', b }; } }
      if (!best) { const z = nearZip(); if (z) best = { type: 'zip', z }; }
      return best;
    },
    use(t) { if (t.type === 'bench') useBench(t.b); else if (t.type === 'board') startContract(t.b); else rideZip(G.player, t.z.z, t.z.e); },
    prompt(t) { return t.type === 'bench' ? benchInfo().text : t.type === 'board' ? (contract ? 'Contrat en cours' : t.b.cd > G.gameT ? `Nouveau contrat dans ${Math.ceil(t.b.cd - G.gameT)} s` : 'Prendre un contrat') : 'Prendre la tyrolienne'; },
    drawMap(ctx, w2, full) {
      ctx.lineWidth = full ? 2 : 1.6; ctx.strokeStyle = 'rgba(255,214,70,.75)';
      for (const z of zips) { const [x1, y1] = w2(z.a.x, z.a.z), [x2, y2] = w2(z.b.x, z.b.z); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.fillStyle = '#ffd646'; for (const [x, y] of [[x1, y1], [x2, y2]]) { ctx.beginPath(); ctx.arc(x, y, full ? 3 : 2, 0, 7); ctx.fill(); } }
      const sq = (o, c) => { const [x, y] = w2(o.x, o.z), s = full ? 4 : 3; ctx.save(); ctx.translate(x, y); ctx.rotate(0.785); ctx.fillStyle = c; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 1; ctx.fillRect(-s, -s, s * 2, s * 2); ctx.strokeRect(-s, -s, s * 2, s * 2); ctx.restore(); };
      for (const b of benches) sq(b, '#6fe0ff'); for (const b of boards) sq(b, '#ffb02e');
      if (contract && contract.target && contract.target.alive) { const [x, y] = w2(contract.target.pos.x, contract.target.pos.z); ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, full ? 9 : 7, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke(); }
    },
    update(dt) {
      const t = G.gameT, c = camera.position; if (chainT > 0) chainT -= dt;
      for (const b of benches) { const on = (b.x - c.x) ** 2 + (b.z - c.z) ** 2 < 12100; b.g.visible = on; if (on) { b.arrow.position.y = 2.55 + Math.sin(t * 2.4) * 0.1; b.arrow.rotation.y = t * 1.5; } }
      for (const b of boards) { const on = (b.x - c.x) ** 2 + (b.z - c.z) ** 2 < 12100; b.g.visible = on; if (on) { b.gem.rotation.y = t * 1.8; b.gem.position.y = 2.95 + Math.sin(t * 2) * 0.08; b.gem.visible = !(b.cd > t) && !contract; } }
      for (const b of barrels) if (!b.dead) b.g.visible = (b.x - c.x) ** 2 + (b.z - c.z) ** 2 < 8100;
      updateProjs(dt); updateBarrels(dt); updateContract(dt); updateEvents(dt);
      for (const ch of chars) { if (ch.dodgeCd > 0) ch.dodgeCd -= dt; if (ch.rollT > 0) ch.rollT = Math.max(0, ch.rollT - dt); if (ch.throwAnim > 0) ch.throwAnim -= dt; if (ch.flyT > 0) ch.flyT -= dt; }
    },
  };
}
