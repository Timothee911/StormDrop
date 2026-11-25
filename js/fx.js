// Effets : particules animées par la carte graphique (une écriture à la naissance, plus rien ensuite),
// impacts de balles, explosions, fumigènes, bouclier brisé, bouche des canons.
import * as THREE from 'three';

// planche 4 × 4 dessinée une fois : 0 lueur, 1-2 fumée, 3 étincelle, 4 anneau, 5 éclat, 6 étoile, 7 flamme, 8 feuille, 9 douille, 10 hexagone, 11 débris
function atlas() {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S * 4;
  const g = c.getContext('2d'); let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const cell = (i, f) => { g.save(); g.translate((i % 4) * S + S / 2, Math.floor(i / 4) * S + S / 2); g.beginPath(); g.rect(-S / 2 + 1, -S / 2 + 1, S - 2, S - 2); g.clip(); f(); g.restore(); };
  const soft = (x, y, r, a, mid = 0.5) => { const k = g.createRadialGradient(x, y, 0, x, y, r); k.addColorStop(0, `rgba(255,255,255,${a})`); k.addColorStop(mid, `rgba(255,255,255,${a * 0.45})`); k.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = k; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  cell(0, () => soft(0, 0, 60, 1, 0.3));
  for (const i of [1, 2]) cell(i, () => { for (let k = 0; k < 26; k++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 30; soft(Math.cos(a) * r, Math.sin(a) * r, 12 + rnd() * 18, 0.34, 0.6); } });
  cell(3, () => { const k = g.createLinearGradient(0, -60, 0, 60); k.addColorStop(0, 'rgba(255,255,255,0)'); k.addColorStop(0.65, 'rgba(255,255,255,.9)'); k.addColorStop(0.85, '#fff'); k.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = k; g.beginPath(); g.ellipse(0, 0, 7, 60, 0, 0, 7); g.fill(); });
  cell(4, () => { const k = g.createRadialGradient(0, 0, 34, 0, 0, 60); k.addColorStop(0, 'rgba(255,255,255,0)'); k.addColorStop(0.7, 'rgba(255,255,255,.95)'); k.addColorStop(0.82, 'rgba(255,255,255,.5)'); k.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = k; g.beginPath(); g.arc(0, 0, 60, 0, 7); g.fill(); });
  cell(5, () => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-8, -46); g.lineTo(30, 26); g.lineTo(-26, 40); g.fill(); });
  cell(6, () => { soft(0, 0, 34, 1, 0.35); g.fillStyle = '#fff'; for (let k = 0; k < 6; k++) { g.save(); g.rotate(k * 1.047 + 0.3); g.globalAlpha = k % 2 ? 0.65 : 1; const L = k % 2 ? 44 : 60; g.beginPath(); g.moveTo(0, -L); g.quadraticCurveTo(4, -10, 12, 0); g.lineTo(-12, 0); g.quadraticCurveTo(-4, -10, 0, -L); g.fill(); g.restore(); } });
  cell(7, () => { for (let k = 0; k < 20; k++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 26; soft(Math.cos(a) * r, Math.sin(a) * r, 10 + rnd() * 20, 0.6, 0.45); } });
  cell(8, () => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -44); g.quadraticCurveTo(28, -6, 0, 44); g.quadraticCurveTo(-28, -6, 0, -44); g.fill(); });
  cell(9, () => { g.fillStyle = '#fff'; g.fillRect(-12, -36, 24, 72); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-12, 22, 24, 6); });
  cell(10, () => { g.strokeStyle = '#fff'; g.lineWidth = 7; g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); for (let k = 0; k <= 6; k++) g.lineTo(Math.cos(k * 1.0472) * 48, Math.sin(k * 1.0472) * 48); g.closePath(); g.fill(); g.stroke(); });
  cell(11, () => { g.fillStyle = '#fff'; g.beginPath(); for (let k = 0; k < 7; k++) { const r = 30 + rnd() * 24; g.lineTo(Math.cos(k * 0.9) * r, Math.sin(k * 0.9) * r); } g.closePath(); g.fill(); });
  const t = new THREE.CanvasTexture(c); t.anisotropy = 2; return t;
}

export function createFX(scene, camera, { low = false } = {}) {
  const tex = atlas(), uT = { value: 0 }, uHdr = { value: 1 }, MR = Math.random, Q = low ? 0.55 : 1;
  const VS = `
    attribute vec3 aP; attribute vec3 aV; attribute vec4 aT; attribute vec4 aC; attribute vec4 aX; attribute vec3 aG;
    uniform float uT; varying vec2 vU; varying vec4 vC;
    void main() {
      float t = uT - aT.x, k = t / aT.y;
      if (k < 0.0 || k > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vU = vec2(0.0); vC = vec4(0.0); return; }
      float dr = max(aG.y, 0.001); vec3 p = aP + aV * (1.0 - exp(-dr * t)) / dr; p.y -= 0.5 * aG.x * t * t;
      vec4 mv = viewMatrix * vec4(p, 1.0);
      float s = mix(aT.z, aT.w, 1.0 - (1.0 - k) * (1.0 - k));
      vec2 q = position.xy * s;
      if (aG.z > 0.0) { // étirée le long de sa vitesse
        vec3 vel = aV * exp(-dr * t); vel.y -= aG.x * t; vec2 d = (viewMatrix * vec4(vel, 0.0)).xy; float L = length(d); d = L > 0.001 ? d / L : vec2(0.0, 1.0);
        q = vec2(q.x * d.y + q.y * d.x * (1.0 + L * aG.z), -q.x * d.x + q.y * d.y * (1.0 + L * aG.z));
      } else { float a = aX.y + aX.z * t, c = cos(a), n = sin(a); q = vec2(q.x * c - q.y * n, q.x * n + q.y * c); }
      mv.xy += q; gl_Position = projectionMatrix * mv;
      { // profondeur avancée vers la caméra : les grosses volutes ne sont pas coupées net par le sol
        float f = clamp(s * 0.55, 0.0, 5.0) / max(-mv.z, 0.1); vec4 c2 = projectionMatrix * vec4(mv.xyz * (1.0 - min(f, 0.75)), 1.0); gl_Position.z = c2.z / c2.w * gl_Position.w; }
      vec2 uv = position.xy + 0.5; uv.y = 1.0 - uv.y; float col = mod(aX.x, 4.0), row = floor(aX.x / 4.0);
      vU = vec2((col + uv.x) / 4.0, 1.0 - (row + uv.y) / 4.0);
      float fade = smoothstep(0.0, 0.06, k) * pow(1.0 - k, aX.w) * smoothstep(0.25, 0.9, -mv.z);
      vC = vec4(aC.rgb, aC.a * fade);
    }`;
  const layer = (N, add) => {
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const A = {}; for (const [k, n] of [['aP', 3], ['aV', 3], ['aT', 4], ['aC', 4], ['aX', 4], ['aG', 3]]) { A[k] = new THREE.InstancedBufferAttribute(new Float32Array(N * n), n); A[k].setUsage(THREE.DynamicDrawUsage); g.setAttribute(k, A[k]); }
    A.aT.array.fill(-1000); g.instanceCount = N;
    const m = new THREE.ShaderMaterial({
      uniforms: { uT, map: { value: tex }, lin: uHdr }, vertexShader: VS,
      fragmentShader: `uniform sampler2D map; uniform float lin; varying vec2 vU; varying vec4 vC;
        void main() { float a = texture2D(map, vU).a * vC.a; if (a < 0.004) discard; vec3 c = vC.rgb; if (lin < 0.5) c = pow(clamp(c, 0.0, 1.0), vec3(0.4545)); gl_FragColor = ${add ? 'vec4(c * a, 0.0)' : 'vec4(c, a)'}; }`,
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: add ? THREE.OneFactor : THREE.SrcAlphaFactor, blendDst: add ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor,
      // alpha de l'image = « force du trait » : la fumée efface les contours de ce qu'elle cache
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: add ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor,
    });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = add ? 8 : 7; mesh.raycast = () => {}; scene.add(mesh);
    return { A, N, i: 0, dirty: false, until: -1, mesh };
  };
  const L = { add: layer(low ? 420 : 800, true), mix: layer(low ? 320 : 620, false) };
  // couleurs linéaires, > 1 = lumineux (halo)
  function emit(kind, x, y, z, o) {
    const l = L[kind], i = l.i, A = l.A; l.i = (i + 1) % l.N; l.dirty = true;
    A.aP.array.set([x, y, z], i * 3); A.aV.array.set([o.vx || 0, o.vy || 0, o.vz || 0], i * 3);
    const life = o.life || 0.5; l.until = Math.max(l.until, uT.value + life + 0.1);
    A.aT.array.set([uT.value + (o.delay || 0), life, o.s0 ?? 0.2, o.s1 ?? o.s0 ?? 0.2], i * 4);
    A.aC.array.set([o.r, o.g, o.b, o.a ?? 1], i * 4);
    A.aX.array.set([o.tile || 0, o.rot ?? MR() * 6.28, o.spin || 0, o.fade ?? 1.3], i * 4);
    A.aG.array.set([o.grav || 0, o.drag || 0, o.stretch || 0], i * 3);
  }
  const R = (a) => (MR() - 0.5) * 2 * a, n_ = (n) => Math.max(1, Math.round(n * Q));
  const C = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
  const cache = new Map(), col = (hex) => { let c = cache.get(hex); if (!c) cache.set(hex, c = C(hex)); return c; };
  function smoke(x, y, z, n, { s = 0.6, spread = 0.3, up = 1.2, life = 1.4, hex = 0x8a8a8a, a = 0.45, vx = 0, vz = 0 } = {}) {
    const c = col(hex);
    for (let i = 0; i < n_(n); i++) { const k = 0.8 + MR() * 0.4; emit('mix', x + R(spread), y + R(spread * 0.6), z + R(spread), { vx: vx + R(spread * 2), vy: up * (0.4 + MR()), vz: vz + R(spread * 2), life: life * (0.6 + MR() * 0.7), s0: s * 0.5, s1: s * (1.6 + MR()), r: c[0] * k, g: c[1] * k, b: c[2] * k, a, tile: 1 + (MR() * 2 | 0), spin: R(1), drag: 1.8, fade: 1.2 }); }
  }
  function sparks(x, y, z, n, hex, sp = 6, nx = 0, ny = 0.4, nz = 0, { size = 0.07, life = 0.4, k = 2.6, grav = 12 } = {}) {
    const c = col(hex);
    for (let i = 0; i < n_(n); i++) emit('add', x, y, z, { vx: R(sp * 0.7) + nx * sp, vy: R(sp * 0.7) + ny * sp, vz: R(sp * 0.7) + nz * sp, life: life * (0.5 + MR() * 0.8), s0: size, s1: size * 0.5, r: c[0] * k, g: c[1] * k, b: c[2] * k, tile: 3, grav, drag: 1.2, stretch: 0.28, fade: 0.8 });
  }
  function chips(x, y, z, n, hex, sp, nx, ny, nz, { size = 0.1, life = 0.7, tile = 11 } = {}) {
    const c = col(hex);
    for (let i = 0; i < n_(n); i++) { const k = 0.65 + MR() * 0.6; emit('mix', x, y, z, { vx: R(sp * 0.6) + nx * sp * MR(), vy: R(sp * 0.5) + (ny + 0.5) * sp * MR(), vz: R(sp * 0.6) + nz * sp * MR(), life: life * (0.6 + MR() * 0.6), s0: size * (0.6 + MR()), s1: size * 0.5, r: c[0] * k, g: c[1] * k, b: c[2] * k, tile, spin: R(12), grav: 14, drag: 0.8, fade: 0.35 }); }
  }
  const glow = (x, y, z, s, hex, k = 3, life = 0.12, tile = 0, s1 = null) => { const c = col(hex); emit('add', x, y, z, { life, s0: s, s1: s1 ?? s * 1.25, r: c[0] * k, g: c[1] * k, b: c[2] * k, tile, fade: 1 }); };
  const ring = (x, y, z, s, hex, k = 2, life = 0.35) => { const c = col(hex); emit('add', x, y, z, { life, s0: s * 0.15, s1: s, r: c[0] * k, g: c[1] * k, b: c[2] * k, tile: 4, fade: 1.5, rot: 0 }); };

  // impacts de balles : petites marques sombres collées aux murs
  const DN = low ? 24 : 60, dg = new THREE.PlaneGeometry(1, 1), dc = document.createElement('canvas'); dc.width = dc.height = 64;
  { const g = dc.getContext('2d'), k = g.createRadialGradient(32, 32, 0, 32, 32, 30); k.addColorStop(0, 'rgba(8,6,5,1)'); k.addColorStop(0.28, 'rgba(14,10,8,.95)'); k.addColorStop(0.42, 'rgba(70,60,50,.5)'); k.addColorStop(0.62, 'rgba(30,24,20,.3)'); k.addColorStop(1, 'rgba(30,24,20,0)'); g.fillStyle = k; g.fillRect(0, 0, 64, 64); }
  const dm = new THREE.InstancedMesh(dg, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(dc), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), DN);
  dm.frustumCulled = false; dm.renderOrder = 1; dm.raycast = () => {}; scene.add(dm);
  const dz = new THREE.Matrix4().makeScale(0, 0, 0), dO = new THREE.Object3D(), decals = [], up = new THREE.Vector3(); for (let i = 0; i < DN; i++) { dm.setMatrixAt(i, dz); decals.push(null); }
  let dn = 0, dT = 0;
  function decal(p, n, owner, s = 0.16) {
    dO.position.copy(p).addScaledVector(n, 0.012); up.copy(p).add(n); dO.lookAt(up); dO.rotateZ(MR() * 6.28); dO.scale.setScalar(s * (0.8 + MR() * 0.5)); dO.updateMatrix();
    dm.setMatrixAt(dn, dO.matrix); dm.instanceMatrix.needsUpdate = true; decals[dn] = { owner, t: 25 }; dn = (dn + 1) % DN;
  }
  const MATS = { wood: [0xb98a55, 0xe8c48a], stone: [0xa8a49c, 0xffe2b0], metal: [0x9aa8b8, 0xffd27a], dirt: [0x7a5c3c, 0xd8b080], grass: [0x5a8a2c, 0x9cc04a], tree: [0x7a5230, 0xc08a50], rock: [0x9a968e, 0xffe2b0], sand: [0xd8be82, 0xe8d09a], snow: [0xe8f0fa, 0xffffff] };
  const FX = {
    uT, layers: L, emit, smoke, sparks, chips, glow, ring, decal,
    set linear(v) { uHdr.value = v ? 1 : 0; },
    near: (p, d) => camera.position.distanceToSquared(p) < d * d,
    // bouche du canon : étoile, lueur, petite fumée, douille éjectée à droite
    muzzle(p, d, big = 1, own = false) {
      glow(p.x + d.x * 0.1, p.y + d.y * 0.1, p.z + d.z * 0.1, 0.5 * big, 0xffc050, 4, 0.055, 6); glow(p.x, p.y, p.z, 0.95 * big, 0xff8a2a, 0.9, 0.09);
      sparks(p.x, p.y, p.z, 2 * big, 0xffc870, 7, d.x, d.y, d.z, { size: 0.04, life: 0.14, grav: 2 });
      emit('mix', p.x, p.y, p.z, { vx: d.x * 1.6 + R(0.3), vy: 0.5, vz: d.z * 1.6 + R(0.3), life: 0.55, s0: 0.08, s1: 0.5 * big, r: 0.6, g: 0.6, b: 0.62, a: 0.2, tile: 1, spin: R(2), drag: 3 });
      if (own) emit('mix', p.x - d.x * 0.55, p.y - 0.02, p.z - d.z * 0.55, { vx: -d.z * 2.2 + R(0.4), vy: 2.2 + MR(), vz: d.x * 2.2 + R(0.4), life: 0.6, s0: 0.055, s1: 0.055, r: 0.9, g: 0.6, b: 0.16, tile: 9, spin: 16, grav: 13, fade: 0.2 });
    },
    impact(p, n, mat, owner) {
      const M = MATS[mat] || MATS.dirt, hard = mat === 'metal' || mat === 'stone' || mat === 'rock';
      chips(p.x, p.y, p.z, 4, M[0], 3.2, n.x, n.y, n.z, { size: 0.085, life: 0.5, tile: mat === 'grass' ? 8 : 11 });
      smoke(p.x + n.x * 0.06, p.y + n.y * 0.06, p.z + n.z * 0.06, 2, { s: 0.28, spread: 0.06, up: 0.4, life: 0.55, hex: M[1], a: 0.3, vx: n.x, vz: n.z });
      if (hard) sparks(p.x, p.y, p.z, 3, 0xffc46a, 5, n.x, n.y, n.z, { size: 0.045, life: 0.22 });
      if (owner) decal(p, n, owner);
    },
    hit(p, shield) { const h = shield ? 0x52b8ff : 0xff5a3d; sparks(p.x, p.y, p.z, 5, h, 4.5, 0, 0.2, 0, { size: 0.06, life: 0.28, grav: 5 }); glow(p.x, p.y, p.z, 0.4, h, 1.8, 0.1); if (shield) ring(p.x, p.y, p.z, 0.9, h, 1.2, 0.2); },
    // bouclier brisé : éclats hexagonaux
    shieldBreak(p) {
      ring(p.x, p.y + 1.1, p.z, 3, 0x4cc2ff, 2.6, 0.38); glow(p.x, p.y + 1.1, p.z, 1.8, 0x3aa8ff, 2, 0.16); const c = col(0x62caff);
      for (let i = 0; i < n_(20); i++) { const a = MR() * 6.28, y = R(0.8), q = Math.cos(a), w = Math.sin(a); emit('add', p.x + q * 0.4, p.y + 1.1 + y, p.z + w * 0.4, { vx: q * 4.2 + R(1), vy: 2 + y * 2 + R(1), vz: w * 4.2 + R(1), life: 0.5 + MR() * 0.4, s0: 0.28, s1: 0.1, r: c[0] * 1.7, g: c[1] * 1.7, b: c[2] * 1.7, tile: 10, spin: R(8), grav: 9, drag: 1, fade: 1 }); }
    },
    explosion(p, r = 5) {
      const k = r / 5;
      glow(p.x, p.y + 0.6, p.z, 4.2 * k, 0xffd9a0, 5, 0.1); glow(p.x, p.y + 0.6, p.z, 6 * k, 0xff6a14, 0.75, 0.3); ring(p.x, p.y + 0.5, p.z, r * 2.2, 0xffb070, 0.55, 0.36);
      const f = [col(0xffc24a), col(0xff6a1a), col(0xff3a08)];
      for (let i = 0; i < n_(30); i++) { const c = f[MR() * 3 | 0], q = 2.4 - MR() * 1.2; emit('mix', p.x + R(0.6) * k, p.y + 0.3 + R(0.4) * k, p.z + R(0.6) * k, { vx: R(7) * k, vy: (1 + MR() * 6) * k, vz: R(7) * k, life: 0.32 + MR() * 0.42, s0: 1.2 * k, s1: 2.7 * k, r: c[0] * q, g: c[1] * q, b: c[2] * q, a: 0.85, tile: 7, spin: R(3), drag: 4, fade: 1.1 }); }
      for (let i = 0; i < n_(24); i++) { const d = 0.1 + MR() * 0.25, g = 0.05 + MR() * 0.09; emit('mix', p.x + R(1) * k, p.y + 0.5 + R(0.6) * k, p.z + R(1) * k, { delay: d, vx: R(4) * k, vy: (1.5 + MR() * 3.4) * k, vz: R(4) * k, life: 1.8 + MR() * 1.6, s0: 1.4 * k, s1: 4.6 * k, r: g, g: g * 0.96, b: g * 0.94, a: 0.8, tile: 1 + (MR() * 2 | 0), spin: R(0.7), drag: 1.9, fade: 1.3 }); }
      for (let i = 0; i < n_(10); i++) { const a = MR() * 6.28; emit('mix', p.x, p.y + 0.2, p.z, { vx: Math.cos(a) * 9 * k, vy: 0.6, vz: Math.sin(a) * 9 * k, life: 0.8 + MR() * 0.5, s0: 0.7 * k, s1: 2.6 * k, r: 0.42, g: 0.35, b: 0.27, a: 0.42, tile: 1, spin: R(1), drag: 3.4, fade: 1.3 }); }
      sparks(p.x, p.y + 0.4, p.z, 24, 0xffb040, 13 * k, 0, 0.6, 0, { size: 0.1, life: 0.9, k: 3.2, grav: 15 });
      chips(p.x, p.y + 0.3, p.z, 14, 0x3a2e24, 10 * k, 0, 0.8, 0, { size: 0.24, life: 1.1 });
    },
    shock(p, r = 6) { ring(p.x, p.y + 0.8, p.z, r * 2.2, 0x2fb0ff, 1.5, 0.42); ring(p.x, p.y + 0.8, p.z, r * 1.3, 0x8ae0ff, 1.1, 0.3); glow(p.x, p.y + 0.8, p.z, 4, 0x58c8ff, 1.4, 0.14); sparks(p.x, p.y + 0.8, p.z, 22, 0x8ae4ff, 13, 0, 0.3, 0, { size: 0.09, life: 0.45, grav: 2 }); smoke(p.x, p.y + 0.3, p.z, 8, { s: 1, spread: 1.4, up: 0.6, life: 0.9, hex: 0xd8ecf4, a: 0.28 }); },
    // élimination : colonne de lumière et feuilles de bouclier
    elim(p, hex = 0x7fe0ff) {
      const c = col(hex); glow(p.x, p.y + 1, p.z, 2.6, hex, 2.4, 0.3); ring(p.x, p.y + 1, p.z, 3.4, hex, 1.6, 0.5);
      for (let i = 0; i < n_(34); i++) { const a = MR() * 6.28, q = MR() * 0.55; emit('add', p.x + Math.cos(a) * q, p.y + MR() * 1.7, p.z + Math.sin(a) * q, { vx: R(1.1), vy: 1.5 + MR() * 4.5, vz: R(1.1), life: 0.7 + MR() * 0.8, s0: 0.17, s1: 0.03, r: c[0] * 2.2, g: c[1] * 2.2, b: c[2] * 2.2, tile: MR() < 0.4 ? 10 : 0, spin: R(4), drag: 0.9, fade: 1 }); }
    },
    dust(p, n = 4, hex = 0xc8b48a, s = 0.5, vx = 0, vz = 0) { smoke(p.x, p.y + 0.12, p.z, n, { s, spread: 0.25, up: 0.5, life: 0.7, hex, a: 0.34, vx, vz }); },
    ringDust(p, n, hex, sp = 3) { const c = col(hex); for (let i = 0; i < n_(n); i++) { const a = i / n * 6.28 + R(0.3); emit('mix', p.x + Math.cos(a) * 0.25, p.y + 0.1, p.z + Math.sin(a) * 0.25, { vx: Math.cos(a) * sp, vy: 0.4, vz: Math.sin(a) * sp, life: 0.45 + MR() * 0.35, s0: 0.2, s1: 0.9, r: c[0], g: c[1], b: c[2], a: 0.4, tile: 1, spin: R(1), drag: 4, fade: 1.3 }); } },
    pickup(p, hex) { const c = col(hex); ring(p.x, p.y + 0.5, p.z, 1.3, hex, 1.3, 0.3); for (let i = 0; i < n_(12); i++) { const a = MR() * 6.28; emit('add', p.x + Math.cos(a) * 0.35, p.y + 0.3 + MR() * 0.4, p.z + Math.sin(a) * 0.35, { vx: -Math.cos(a) * 0.5, vy: 1.6 + MR() * 1.6, vz: -Math.sin(a) * 0.5, life: 0.5 + MR() * 0.3, s0: 0.13, s1: 0.02, r: c[0] * 2.4, g: c[1] * 2.4, b: c[2] * 2.4, tile: 0, drag: 1, fade: 1 }); } },
    update(dt) {
      uT.value += dt;
      for (const k in L) { const l = L[k]; if (l.dirty) { for (const a in l.A) l.A[a].needsUpdate = true; l.dirty = false; } l.mesh.visible = uT.value < l.until + 1.2; }
      dT -= dt;
      if (dT <= 0) { dT = 0.4; let ch = false; for (let i = 0; i < DN; i++) { const d = decals[i]; if (d && ((d.t -= 0.4) <= 0 || d.owner.alive === false)) { decals[i] = null; dm.setMatrixAt(i, dz); ch = true; } } if (ch) dm.instanceMatrix.needsUpdate = true; }
    },
    warm() { for (const k in L) L[k].mesh.visible = true; },
  };
  return FX;
}
