// Herbe : une prairie continue dessinée autour de la caméra, entièrement par le GPU.
// Le terrain est découpé en carrés de CELL mètres ; chaque carré visible réutilise les mêmes
// touffes, et le shader leur donne leur hauteur, leur couleur et leur densité en lisant trois
// textures (relief, couleur du sol, masque des bâtiments). Rien à recopier à chaque image.
import * as THREE from 'three';
import { mulberry32 } from './world.js';

// Teinte de l'herbe, partagée par le sol et les brins : c'est ce qui les fait se fondre l'un dans l'autre.
export const GRASS_GLSL = `
  float gh2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float gn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(gh2(i), gh2(i + vec2(1.0, 0.0)), f.x), mix(gh2(i + vec2(0.0, 1.0)), gh2(i + vec2(1.0, 1.0)), f.x), f.y); }
  vec3 grassTone(vec3 c, vec2 p) {
    float big = gn2(p * 0.028 + 40.0), mid = gn2(p * 0.1 + 9.0), sm = gn2(p * 0.42 + 17.0);
    c *= 0.88 + 0.24 * mid;
    c = mix(c, c * vec3(1.26, 1.08, 0.62), smoothstep(0.5, 0.85, big) * 0.42);   // prairies dorées
    c = mix(c, c * vec3(0.68, 0.9, 0.82), smoothstep(0.52, 0.2, big) * 0.55);    // creux plus frais
    return c * (0.93 + 0.14 * sm);
  }
  float grassGust(vec2 p, float t) { return gn2(p * 0.045 - t * vec2(0.34, 0.19)) * 0.7 + gn2(p * 0.13 - t * vec2(0.62, 0.4)) * 0.3; }
`;

// T : { SEG, SIZE, pos (Float32 xyz), cols (rgb linéaire), dens, len } par sommet du terrain
export function createGrass(scene, T, { lowq = false, highq = false, weak = false, wind, heightAt }) {
  const NV = T.SEG + 1, STEP = T.SIZE / T.SEG, HALF = T.SIZE / 2, CELL = 10;
  if (weak) highq = false;
  const R = lowq ? 34 : highq ? 74 : 52, HI_D = lowq ? 0 : highq ? 26 : 20;
  const N_HI = highq ? 900 : 580, N_LO = lowq ? 300 : highq ? 330 : 270, N_FL = lowq ? 10 : highq ? 34 : 24;

  // ---- textures lues par le shader
  const hg = new Float32Array(NV * NV * 2), cg = new Uint8Array(NV * NV * 4);
  for (let i = 0; i < NV * NV; i++) {
    hg[i * 2] = T.pos[i * 3 + 1]; hg[i * 2 + 1] = T.len[i];
    for (let k = 0; k < 3; k++) cg[i * 4 + k] = Math.round(Math.sqrt(Math.min(1, T.cols[i * 3 + k])) * 255); // racine carrée : précise dans les verts sombres
    cg[i * 4 + 3] = Math.round(T.dens[i] * 255);
  }
  const hTex = new THREE.DataTexture(hg, NV, NV, THREE.RGFormat, THREE.FloatType); hTex.needsUpdate = true;
  const cTex = new THREE.DataTexture(cg, NV, NV, THREE.RGBAFormat, THREE.UnsignedByteType); cTex.magFilter = cTex.minFilter = THREE.LinearFilter; cTex.needsUpdate = true;
  const MN = 2048, mask = new Uint8Array(MN * MN).fill(255);
  const mTex = new THREE.DataTexture(mask, MN, MN, THREE.RedFormat, THREE.UnsignedByteType); mTex.magFilter = mTex.minFilter = THREE.LinearFilter; mTex.unpackAlignment = 1; mTex.needsUpdate = true;

  // ---- touffes
  const gr = mulberry32(90210), rr = (a, b) => a + (b - a) * gr();
  // brins : position = (x, hauteur relative, z), aT = (t le long du brin, hasard du brin)
  function tuftGeo(blades, segs, wide) {
    const pos = [], at = [], idx = [];
    for (let b = 0; b < blades; b++) {
      const ang = gr() * 6.283, rad = Math.sqrt(gr()) * 0.3, bx = Math.cos(ang) * rad, bz = Math.sin(ang) * rad;
      const yaw = ang + rr(-1.1, 1.1), lean = rr(0.16, 0.5), h = rr(0.62, 1.05), w = rr(0.026, 0.042) * wide, rnd = gr();
      const dx = Math.sin(yaw), dz = Math.cos(yaw), wx = Math.cos(yaw), wz = -Math.sin(yaw), o = pos.length / 3;
      for (let s = 0; s <= segs; s++) {
        const t = s / segs, off = lean * t * t, ww = w * (1 - t * t * 0.55), cx = bx + dx * off, cz = bz + dz * off, y = t * h;
        if (s < segs) { pos.push(cx - wx * ww, y, cz - wz * ww, cx + wx * ww, y, cz + wz * ww); at.push(t, rnd, t, rnd); }
        else { pos.push(cx, y, cz); at.push(t, rnd); }
        if (s < segs - 1) idx.push(o + s * 2, o + s * 2 + 1, o + s * 2 + 2, o + s * 2 + 1, o + s * 2 + 3, o + s * 2 + 2);
        else if (s === segs - 1) idx.push(o + s * 2, o + s * 2 + 1, o + s * 2 + 2);
      }
    }
    return { pos, at, idx };
  }
  // fleur : tige, 6 pétales, cœur ; aT.y : 2 = tige, 3 = pétale, 4 = cœur
  function flowerGeo() {
    const pos = [], at = [], idx = [], H = 1;
    pos.push(-0.014, 0, 0, 0.014, 0, 0, 0, H, 0); at.push(0, 2, 0, 2, 1, 2); idx.push(0, 1, 2);
    pos.push(0, 0, -0.014, 0, 0, 0.014, 0, H, 0); at.push(0, 2, 0, 2, 1, 2); idx.push(3, 4, 5);
    for (let i = 0; i < 6; i++) { // pétales en losange, légèrement relevés
      const a = i / 6 * 6.283, c = Math.cos(a), s = Math.sin(a), o = pos.length / 3;
      pos.push(0, H, 0, c * 0.07 - s * 0.042, H + 0.03, s * 0.07 + c * 0.042, c * 0.135, H + 0.035, s * 0.135, c * 0.07 + s * 0.042, H + 0.03, s * 0.07 - c * 0.042);
      at.push(0.75, 3, 1, 3, 1, 3, 1, 3); idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
    const o = pos.length / 3; pos.push(0, H + 0.065, 0); at.push(1, 4);
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; pos.push(Math.cos(a) * 0.045, H + 0.03, Math.sin(a) * 0.045); at.push(0.8, 4); idx.push(o, o + 1 + i, o + 1 + (i + 1) % 5); }
    return { pos, at, idx };
  }
  // instances : décalage dans le carré + 4 hasards. Les premières sont bien réparties (version lointaine = début de la liste).
  function scatterSet(n) {
    const off = new Float32Array(n * 2), rnd = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      let best = null, bd = -1; // 4 essais, on garde le plus éloigné de quelques voisins : pas de trous ni de paquets
      for (let k = 0; k < 4; k++) {
        const x = gr() * CELL, z = gr() * CELL; let d = 1e9;
        for (let j = Math.max(0, i - 160); j < i; j++) { let ax = Math.abs(off[j * 2] - x), az = Math.abs(off[j * 2 + 1] - z); ax = Math.min(ax, CELL - ax); az = Math.min(az, CELL - az); d = Math.min(d, ax * ax + az * az); }
        if (d > bd) { bd = d; best = [x, z]; }
      }
      off[i * 2] = best[0]; off[i * 2 + 1] = best[1];
      rnd[i * 4] = gr(); rnd[i * 4 + 1] = gr() * 6.283; rnd[i * 4 + 2] = gr(); rnd[i * 4 + 3] = i / n;
    }
    return { off, rnd };
  }
  const setHi = scatterSet(Math.max(N_HI, N_LO)), setFl = scatterSet(N_FL);
  function inst(g, set, n) {
    const G = new THREE.InstancedBufferGeometry();
    G.setAttribute('position', new THREE.Float32BufferAttribute(g.pos, 3)); G.setAttribute('aT', new THREE.Float32BufferAttribute(g.at, 2)); G.setIndex(g.idx);
    G.setAttribute('aOff', new THREE.InstancedBufferAttribute(set.off.subarray(0, n * 2), 2)); G.setAttribute('aRnd', new THREE.InstancedBufferAttribute(set.rnd.subarray(0, n * 4), 4));
    G.instanceCount = n; G.boundingSphere = new THREE.Sphere(new THREE.Vector3(CELL / 2, 0.5, CELL / 2), CELL * 0.75 + 5);
    G.boundingBox = new THREE.Box3(new THREE.Vector3(-1, -6, -1), new THREE.Vector3(CELL + 1, 7, CELL + 1));
    return G;
  }
  const gHi = lowq ? null : inst(tuftGeo(6, 2, 1), setHi, N_HI), gLo = inst(tuftGeo(lowq ? 6 : 7, 1, 1.75), setHi, N_LO), gFl = inst(flowerGeo(), setFl, N_FL);

  // ---- matériau
  const uni = {
    uWind: wind, tH: { value: hTex }, tC: { value: cTex }, tM: { value: mTex }, uCam: { value: new THREE.Vector3() },
    uR: { value: R }, uBend: { value: Array.from({ length: 4 }, () => new THREE.Vector4(1e6, 1e6, 1, 0)) },
  };
  function material(kind) { // kind : 'hi' | 'lo' | 'fl'
    const m = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, color: 0xffffff });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uni);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
        attribute vec2 aT; attribute vec2 aOff; attribute vec4 aRnd;
        uniform float uWind, uR; uniform vec3 uCam; uniform vec4 uBend[4];
        uniform highp sampler2D tH; uniform sampler2D tC; uniform sampler2D tM;
        varying vec3 vGC; varying float vGT;
        ${GRASS_GLSL}
        // relief : exactement les triangles du terrain affiché
        vec4 terr(vec2 p) {
          vec2 q = clamp((p + ${HALF.toFixed(1)}) / ${STEP.toFixed(6)}, vec2(0.0), vec2(${(T.SEG - 0.001).toFixed(3)}));
          ivec2 i = ivec2(floor(q)); vec2 f = q - vec2(i);
          vec2 a = texelFetch(tH, i, 0).rg, b = texelFetch(tH, i + ivec2(0, 1), 0).rg, c = texelFetch(tH, i + ivec2(1, 1), 0).rg, d = texelFetch(tH, i + ivec2(1, 0), 0).rg;
          vec2 g; vec2 h;
          if (f.x + f.y < 1.0) { g = vec2(d.x - a.x, b.x - a.x); h = a + f.x * (d - a) + f.y * (b - a); }
          else { g = vec2(c.x - b.x, c.x - d.x); h = c + (1.0 - f.x) * (b - c) + (1.0 - f.y) * (d - c); }
          return vec4(h.x, g / ${STEP.toFixed(6)}, h.y);
        }`)
        .replace('#include <beginnormal_vertex>', `
        vec3 org = modelMatrix[3].xyz; vec2 gw = org.xz + aOff;
        gw += (vec2(gh2(gw + 3.1), gh2(gw + 7.7)) - 0.5) * 0.9;                         // aucun carré n'est identique à son voisin
        vec4 tr = terr(gw);
        vec2 guv = (gw + ${HALF.toFixed(1)}) / ${T.SIZE.toFixed(1)};
        vec4 gcd = texture2D(tC, guv * ${(T.SEG / NV).toFixed(6)} + ${(0.5 / NV).toFixed(6)});
        float gm = texture2D(tM, guv).r, gd = distance(gw, uCam.xz);
        float patchy = gn2(gw * 0.075 + 3.0) * 0.7 + gn2(gw * 0.31 + 8.0) * 0.3;
        float dens = gcd.a * smoothstep(0.55, 0.95, gm);
        ${kind === 'hi' ? `dens *= mix(1.0, ${(N_LO / N_HI).toFixed(3)}, smoothstep(${(HI_D * 0.45).toFixed(1)}, ${(HI_D * 0.85).toFixed(1)}, gd)) ;` : ''}
        ${kind === 'lo' ? `dens *= ${(N_LO / Math.max(N_HI, N_LO)).toFixed(3)};` : ''}
        ${kind === 'fl' ? 'dens *= smoothstep(0.5, 0.72, gn2(gw * 0.05 + 63.0)) * (0.35 + 0.65 * step(0.35, gn2(gw * 0.4 + 2.0)));' : ''}
        float keep = 1.0 - smoothstep(dens - 0.06, dens + 0.02, aRnd.w);
        keep *= step(0.02, dens) * (1.0 - smoothstep(uR * 0.72, uR, gd * (0.9 + 0.2 * aRnd.x)));
        float hgt = ${kind === 'fl' ? '(0.4 + 0.24 * aRnd.z) * (0.55 + 0.45 * tr.w)' : '(mix(0.36, 0.2 + 0.36 * patchy, smoothstep(0.5, 0.95, tr.w)) + 0.12 * aRnd.z) * tr.w * (aRnd.x > 0.94 ? 1.5 : 1.0)'};
        hgt *= keep;
        float cy = cos(aRnd.y), sy = sin(aRnd.y);
        vec3 lp = vec3(position.x * cy - position.z * sy, position.y, position.x * sy + position.z * cy);
        float bladeT = aT.y > 1.5 ? position.y : aT.x;
        float sz = ${kind === 'fl' ? '(0.75 + 0.5 * aRnd.x) * min(1.0, keep * 2.0)' : `(0.85 + 0.4 * aRnd.z) * min(1.0, keep * 3.0) * (1.0 + gd * ${kind === 'lo' ? '0.012' : '0.008'})`};
        lp.xz *= sz * (0.78 + 0.22 * tr.w); ${kind === 'fl' ? 'lp.y = lp.y * hgt;' : 'lp.y *= hgt;'}
        // vent : grandes rafales qui traversent la prairie + frémissement
        float gust = grassGust(gw, uWind), fl = sin(uWind * 4.2 + gw.x * 2.1 + gw.y * 1.7 + aT.y * 6.0);
        vec2 push = vec2(0.86, 0.5) * ((gust - 0.28) * 0.62 + fl * 0.035);
        // couchée sous les pas et les roues
        float flat_ = 0.0;
        for (int i = 0; i < 4; i++) { vec2 dv = gw + lp.xz - uBend[i].xy; float dl = length(dv), k = smoothstep(uBend[i].z, uBend[i].z * 0.25, dl) * step(abs(tr.x - uBend[i].w), 1.6); push += dv / max(dl, 0.05) * k * 1.1; flat_ = max(flat_, k); }
        float bt = bladeT * bladeT;
        lp.xz += push * bt * hgt * 1.5; lp.y *= 1.0 - flat_ * 0.55;
        lp.y -= dot(push, push) * bt * hgt * 0.5;
        vec3 objectNormal = normalize(vec3(-tr.y, 1.0, -tr.z) + vec3(push.x, 0.0, push.y) * 0.25 * bladeT);
        // couleur : celle du sol au pied, plus claire et plus chaude vers la pointe
        vec3 gcol = grassTone(gcd.rgb * gcd.rgb, gw);
        float far_ = smoothstep(uR * 0.3, uR * 0.95, gd);
        vec3 root = gcol * mix(0.5, 0.96, far_), tip = gcol * mix(vec3(1.5, 1.42, 1.12), vec3(1.08), far_) * (0.86 + 0.28 * aT.y * step(aT.y, 1.5));
        tip = mix(tip, tip * vec3(1.22, 1.08, 0.7), step(0.8, aRnd.z) * 0.5 * (1.0 - far_));
        vGC = mix(root, tip, bladeT * (0.55 + 0.45 * bladeT));
        vGC += gcol * vec3(0.5, 0.5, 0.32) * smoothstep(0.5, 0.82, gust) * bladeT * 0.55; // reflet de la rafale
        ${kind === 'fl' ? `
        float hue = gn2(gw * 0.06 + 90.0) + (aRnd.z - 0.5) * 0.3;
        vec3 pet = hue < 0.36 ? vec3(0.92, 0.9, 0.86) : hue < 0.5 ? vec3(0.95, 0.62, 0.06) : hue < 0.64 ? vec3(0.86, 0.12, 0.08) : vec3(0.42, 0.2, 0.78);
        if (aT.y > 3.5) vGC = hue < 0.5 && hue >= 0.36 ? vec3(0.62, 0.26, 0.04) : vec3(0.95, 0.66, 0.08); else if (aT.y > 2.5) vGC = pet * (0.7 + 0.3 * aT.x); else vGC = gcol * (0.7 + 0.5 * bladeT);` : ''}
        vGT = bladeT;`)
        .replace('#include <begin_vertex>', 'vec3 transformed = vec3(gw.x - org.x + lp.x, tr.x - org.y - 0.02 + lp.y, gw.y - org.z + lp.z);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGC; varying float vGT;')
        .replace('#include <color_fragment>', 'diffuseColor.rgb = vGC;')
        .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal *= faceDirection; // éclairage identique sur les deux faces')
        // alpha 0 = « pas de trait de contour » pour le post-traitement (voir outline.js) : un trait par brin noircirait la prairie
        .replace('#include <opaque_fragment>', '#include <opaque_fragment>\ngl_FragColor.a = 0.0;');
    };
    m.customProgramCacheKey = () => 'grass-' + kind + R;
    return m;
  }
  const mats = { hi: lowq ? null : material('hi'), lo: material('lo'), fl: material('fl') };

  // ---- carrés autour de la caméra
  const ring = []; const nR = Math.ceil(R / CELL) + 1;
  for (let i = -nR; i <= nR; i++) for (let j = -nR; j <= nR; j++) ring.push([i, j]);
  const pool = { hi: [], lo: [], fl: [] }, used = { hi: 0, lo: 0, fl: 0 }, cells = new Map();
  function take(kind) {
    let m = pool[kind][used[kind]];
    if (!m) { m = new THREE.Mesh(kind === 'hi' ? gHi : kind === 'lo' ? gLo : gFl, mats[kind]); m.receiveShadow = true; m.castShadow = false; m.raycast = () => {}; m.userData.grass = kind; m.matrixAutoUpdate = false; scene.add(m); pool[kind].push(m); }
    used[kind]++; m.visible = true; return m;
  }
  // hauteur moyenne du carré, et y a-t-il de l'herbe ?
  function cellInfo(ci, cj) {
    const k = ci * 4096 + cj; let c = cells.get(k);
    if (!c) {
      const x = (ci + 0.5) * CELL, z = (cj + 0.5) * CELL; let any = 0;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const ix = Math.round((x + i * 6 + HALF) / STEP), iz = Math.round((z + j * 6 + HALF) / STEP);
        if (ix >= 0 && iz >= 0 && ix < NV && iz < NV) any = Math.max(any, T.dens[iz * NV + ix]);
      }
      c = { y: any ? heightAt(x, z) : 0, any: any > 0.03 }; if (cells.size > 6000) cells.clear(); cells.set(k, c);
    }
    return c;
  }
  let lastKey = '';
  function update(cam) {
    uni.uCam.value.copy(cam);
    const ci = Math.floor(cam.x / CELL), cj = Math.floor(cam.z / CELL), key = Math.floor(cam.x / 2.5) + '|' + Math.floor(cam.z / 2.5) + '|' + (cam.y > 120);
    if (key === lastKey) return; lastKey = key;
    used.hi = used.lo = used.fl = 0;
    if (cam.y < 120 + R) for (const [i, j] of ring) { // vue d'avion : pas de brins, le sol suffit
      const x = (ci + i) * CELL, z = (cj + j) * CELL, dx = Math.max(x - cam.x, 0, cam.x - x - CELL), dz = Math.max(z - cam.z, 0, cam.z - z - CELL), d = Math.hypot(dx, dz);
      if (d > R + 3) continue;
      const c = cellInfo(ci + i, cj + j); if (!c.any || cam.y - c.y > 110) continue;
      const put = (kind) => { const m = take(kind); m.position.set(x, c.y, z); m.updateMatrix(); m.updateMatrixWorld(true); };
      put(d < HI_D && mats.hi ? 'hi' : 'lo');
      if (d < R * 0.8) put('fl');
    }
    for (const k of ['hi', 'lo', 'fl']) for (let i = used[k]; i < pool[k].length; i++) pool[k][i].visible = false;
  }
  return {
    R, uniforms: uni, update,
    // corps qui couchent l'herbe : [{ x, y, z, r }], 4 au plus
    bend(list) { for (let i = 0; i < 4; i++) { const b = list[i]; if (b) uni.uBend.value[i].set(b.x, b.z, b.r, b.y); else uni.uBend.value[i].set(1e6, 1e6, 1, 0); } },
    // zone sans herbe (bâtiment, allée, rocher…)
    cut(x0, x1, z0, z1) {
      const f = (v) => (v + HALF) / T.SIZE * MN - 0.5, a = Math.max(0, Math.ceil(f(x0))), b = Math.min(MN - 1, Math.floor(f(x1))), c = Math.max(0, Math.ceil(f(z0))), d = Math.min(MN - 1, Math.floor(f(z1)));
      for (let j = c; j <= d; j++) mask.fill(0, j * MN + a, j * MN + b + 1);
    },
    done() { mTex.needsUpdate = true; },
    // meshes créés avant la partie (compilation des shaders)
    warm() { lastKey = ''; for (const k of ['hi', 'lo', 'fl']) if (mats[k] && !pool[k].length) { used[k] = 0; take(k).visible = true; } },
    stats: () => ({ ...used }),
  };
}
