// Nature (nature.js) et meubles (meubles.js) des packs 3D.
// Tout est instancié. Les arbres ont deux niveaux de détail (proche / lointain) ; les petites
// plantes ne sont dessinées qu'autour de la caméra et rapetissent au loin (pas d'apparition brusque).
import * as THREE from 'three';
import { NATURE } from './nature.js';
import { MEUBLES } from './meubles.js';
import { terrainH, ISLAND_R, OVAL_X, OVAL_Z, mulberry32, fbm, inPOI, biomeW, GROTTO } from './world.js';

const buf = (s) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; };
const GEO = new Map();
function partGeo(p) {
  let g = GEO.get(p);
  if (!g) {
    const N = Int8Array.from(new Int8Array(buf(p.n))), C = new Uint8Array(buf(p.c));
    g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(new Int16Array(buf(p.p)), (v) => v / p.q), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(Float32Array.from(N, (v) => v / 127), 3));
    if (p.u) g.setAttribute('uv', new THREE.BufferAttribute(Float32Array.from(new Int16Array(buf(p.u)), (v) => v / 1024), 2));
    g.setAttribute('color', new THREE.BufferAttribute(Float32Array.from(C, (v) => v / 200), 3));
    g.setIndex(new THREE.BufferAttribute(new Uint16Array(buf(p.i)), 1));
    GEO.set(p, g);
  }
  return g;
}
const DATA = { ...NATURE, ...MEUBLES };
export const MEUBLE_SIZE = Object.fromEntries(Object.entries(MEUBLES).map(([k, o]) => [k, o.size]));
const LEAFY = { leaf: 1, leafr: 1, pine: 1 }, CUT = { leaf: 1, leafr: 1, pine: 1, leaves: 1, flowers: 1 };
export const TREE_INFO = Object.fromEntries(Object.entries(NATURE).filter(([, o]) => o.far).map(([k, o]) => [k, { can: o.can, top: o.top }]));

export function createFlora(scene, wind, { lowq = false, highq = false } = {}) {
  const loader = new THREE.TextureLoader(), texC = new Map(), matCache = new Map();
  const uCam = { value: new THREE.Vector3(0, 1e5, 0) };
  const tex = (n) => {
    if (!texC.has(n)) {
      const t = loader.load(new URL(`../img/nature/${n}.webp`, import.meta.url).href);
      t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = lowq ? 1 : 4;
      texC.set(n, t);
    }
    return texC.get(n);
  };
  // o : { sway, fade, snow, tint } — sway = amplitude du vent, fade = distance de disparition
  function material(n, o) {
    const key = [n, o.sway || 0, o.fade || 0, o.snow ? 1 : 0].join('|');
    if (matCache.has(key)) return matCache.get(key);
    const leafy = LEAFY[n], plant = CUT[n] || n === '', plain = n === '' || n[0] === 'f' && n.length < 3; // f, ft : meubles
    const m = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, map: plain ? null : tex(n), side: plant || plain ? THREE.DoubleSide : THREE.FrontSide, alphaTest: CUT[n] ? 0.35 : 0 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = wind; sh.uniforms.uCamP = uCam;
      let head = '\nuniform float uWind; uniform vec3 uCamP;', body = '\nvec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);';
      if (o.fade) body += `\ntransformed *= 1.0 - smoothstep(${(o.fade * 0.88).toFixed(1)}, ${o.fade.toFixed(1)}, distance(ip, uCamP));`;
      if (o.sway) body += `\nfloat sw = sin(uWind * 1.5 + ip.x * 0.13 + ip.z * 0.09 + position.y * 0.5) * 0.6 + sin(uWind * 3.1 + ip.x * 0.4 + position.x * 1.7 + position.z * 1.3) * 0.25;
        float swk = ${o.sway.toFixed(4)} * ${leafy ? 'position.y' : 'position.y * position.y * 2.0'};
        transformed.x += sw * swk; transformed.z += sw * swk * 0.6;`;
      if (o.snow) { head += '\nattribute float aSnowI; varying float vSnow; varying vec3 vSP;'; body += '\nvSnow = aSnowI * smoothstep(-0.25, 0.45, objectNormal.y + color.r * 0.25 - 0.2); vSP = (instanceMatrix * vec4(position, 1.0)).xyz;'; }
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>' + head).replace('#include <begin_vertex>', '#include <begin_vertex>' + body);
      if (o.snow) {
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
          varying float vSnow; varying vec3 vSP;
          float lh(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.7); }
          float ln(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(lh(i), lh(i + vec2(1.0, 0.0)), f.x), mix(lh(i + vec2(0.0, 1.0)), lh(i + vec2(1.0, 1.0)), f.x), f.y); }`)
          .replace('#include <color_fragment>', `#include <color_fragment>
          if (vSnow > 0.01) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.96, 1.0), smoothstep(0.42, 0.62, vSnow + (ln(vSP.xz * 2.4 + vSP.y * 1.9) - 0.5) * 0.6));`);
      }
      // feuillage collé à la caméra : il se dissout (trame) pour ne jamais boucher la vue
      if (leafy) sh.fragmentShader = sh.fragmentShader.replace('#include <alphatest_fragment>', `#include <alphatest_fragment>
        float camD = length(vViewPosition);
        if (camD < 2.0) { float ig = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715)))); if (ig > smoothstep(0.5, 2.0, camD) + 0.04) discard; }`);
      // feuilles : même éclairage des deux côtés (les normales du pack forment une boule douce)
      if (plant) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal *= faceDirection;');
    };
    m.customProgramCacheKey = () => 'flora' + key;
    matCache.set(key, m); return m;
  }

  const kinds = new Map(), dirtyKinds = new Set();
  // jeu de meshes instanciés d'un niveau de détail
  function lod(id, level, parts, o, cast) {
    return { id, level, ims: null, cap: 0, parts: parts.map((p) => ({ p, geo: partGeo(p), o: { ...o, sway: LEAFY[p.t] || CUT[p.t] || p.t === '' ? o.sway : 0, snow: p.t === 'pine' && o.snow }, tinted: !!(LEAFY[p.t] || p.t === '' || p.t === 'ft') })), cast };
  }
  function ensure(L, n) {
    if (L.ims && L.cap >= n) return;
    const cap = Math.max(16, Math.ceil(n * 1.35));
    if (L.ims) for (const im of L.ims) { scene.remove(im); im.dispose(); }
    L.cap = cap;
    L.ims = L.parts.map((q, k) => {
      let g = q.geo;
      if (q.o.snow) { g = g.clone(); g.setAttribute('aSnowI', new THREE.InstancedBufferAttribute(new Float32Array(cap), 1)); }
      const im = new THREE.InstancedMesh(g, material(q.p.t, q.o), cap);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      if (q.tinted) { im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3); im.instanceColor.setUsage(THREE.DynamicDrawUsage); }
      im.frustumCulled = false; im.castShadow = L.cast; im.receiveShadow = true; im.count = 0; im.raycast = () => {}; im.userData.nat = [L.id, L.level, k];
      scene.add(im); return im;
    });
  }
  function fill(L, list) {
    if (!list.length && !L.ims) return;
    ensure(L, list.length);
    L.ims.forEach((im, k) => {
      const A = im.instanceMatrix.array, C = im.instanceColor && im.instanceColor.array, S = L.parts[k].o.snow && im.geometry.attributes.aSnowI;
      for (let i = 0; i < list.length; i++) {
        const it = list[i]; A.set(it.m, i * 16);
        if (C) { C[i * 3] = it.r; C[i * 3 + 1] = it.g; C[i * 3 + 2] = it.b; }
        if (S) S.array[i] = it.snow || 0;
      }
      im.count = list.length; im.visible = list.length > 0; im.instanceMatrix.needsUpdate = true;
      if (C) im.instanceColor.needsUpdate = true;
      if (S) S.needsUpdate = true;
    });
  }
  const CELLS = 24;
  // id : modèle ; o : { R (distance du détail), sway, fade, snow, cast }
  function kind(id, o) {
    const d = DATA[id];
    const K = { id, R: o.R || 0, all: [], cells: null, near: lod(id, 'near', d.near, o, !!o.cast), mid: d.far ? lod(id, 'near', d.near, o, false) : null, far: d.far ? lod(id, 'far', d.far, o, false) : null, whole: !!o.whole };
    if (!d.far && !o.whole) K.cells = new Map();
    kinds.set(id, K); return K;
  }
  const dm = new THREE.Matrix4(), dq = new THREE.Quaternion(), de = new THREE.Euler(), dp = new THREE.Vector3(), ds = new THREE.Vector3();
  function add(id, x, y, z, ry, sx, sy = sx, sz = sx, col = null, snow = 0, rx = 0, rz = 0) {
    const K = kinds.get(id);
    dq.setFromEuler(de.set(rx, ry, rz, 'YXZ')); dm.compose(dp.set(x, y, z), dq, ds.set(sx, sy, sz));
    const it = { K, x, y, z, m: new Float32Array(dm.elements), r: col ? col.r : 1, g: col ? col.g : 1, b: col ? col.b : 1, snow };
    K.all.push(it);
    if (K.cells) { const k = Math.floor(x / CELLS) * 1000 + Math.floor(z / CELLS); let a = K.cells.get(k); if (!a) K.cells.set(k, a = []); a.push(it); }
    dirtyKinds.add(K); return it;
  }
  function remove(it) { const a = it.K.all, i = a.indexOf(it); if (i >= 0) a.splice(i, 1); dirtyKinds.add(it.K); }
  const last = new THREE.Vector3(1e9, 0, 0), N = [], M = [], F = [];
  function refresh(K, c) {
    N.length = 0; M.length = 0; F.length = 0;
    if (K.whole) { fill(K.near, K.all); return; }
    const R2 = K.R * K.R;
    if (K.cells) {
      const n = Math.ceil(K.R / CELLS), cx = Math.floor(c.x / CELLS), cz = Math.floor(c.z / CELLS);
      for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
        const a = K.cells.get((cx + i) * 1000 + cz + j);
        if (a) for (const it of a) if ((it.x - c.x) ** 2 + (it.y - c.y) ** 2 + (it.z - c.z) ** 2 < R2) N.push(it);
      }
      fill(K.near, N); return;
    }
    // arbres : modèle complet jusqu'à R (ombre portée seulement près), puis version allégée, si loin que l'échange ne se voit pas
    for (const it of K.all) { const q = (it.x - c.x) ** 2 + (it.y - c.y) ** 2 + (it.z - c.z) ** 2; (q < Math.min(R2, 6400) ? N : q < R2 ? M : F).push(it); }
    fill(K.near, N); fill(K.mid, M); fill(K.far, F);
  }
  return {
    kind, add, remove,
    // à appeler à chaque image : ne recopie les instances que si la caméra a bougé de 4 m
    update(cam) {
      uCam.value.copy(cam);
      if (last.distanceToSquared(cam) > 16) { last.copy(cam); for (const K of kinds.values()) if (!K.whole || dirtyKinds.has(K)) refresh(K, cam); dirtyKinds.clear(); }
      else if (dirtyKinds.size) { for (const K of dirtyKinds) refresh(K, last); dirtyKinds.clear(); }
    },
    stats() { const o = {}; for (const [k, K] of kinds) o[k] = [K.all.length, (K.near.ims ? K.near.ims[0].count : 0) + (K.mid && K.mid.ims ? K.mid.ims[0].count : 0), K.far && K.far.ims ? K.far.ims[0].count : 0]; return o; },
    // meshes créés (compilation des shaders avant le début de partie)
    warm() { for (const K of kinds.values()) { ensure(K.near, 1); if (K.mid) ensure(K.mid, 1); if (K.far) ensure(K.far, 1); } last.x = 1e9; },
    highq,
  };
}

// Petites plantes : aucune collision, dessinées autour de la caméra seulement.
// dirtW(x, z, pente) : part de terre nue (les plantes poussent dans l'herbe, les cailloux sur la terre)
export function scatterPlants(flora, dirtW, { lowq, highq }) {
  const gr = mulberry32(70707), rr = (a, b) => a + (b - a) * gr(), q = lowq ? 0.3 : highq ? 1 : 0.6, D = lowq ? 0.6 : highq ? 1 : 0.8;
  const K = (id, R, o = {}) => flora.kind(id, { R: R * D, fade: R * D, ...o });
  K('bush', 190, { sway: 0.02, cast: true }); K('bushf', 180, { sway: 0.02, cast: true });
  K('fern', 100, { sway: 0.05 }); K('plant', 95, { sway: 0.03 }); K('plant2', 80, { sway: 0.03 }); K('clover', 45, { sway: 0.03 });
  K('flowA', 80, { sway: 0.05 }); K('flowB', 80, { sway: 0.05 }); K('mush', 60); K('shelf', 60);
  K('wispy', 80, { sway: 0.06 }); K('tall', 85, { sway: 0.07 });
  for (let i = 0; i < 3; i++) K('peb' + i, 70);
  const col = new THREE.Color();
  // pose n plantes là où ok(contexte) l'accepte ; grp = taille d'un petit groupe autour du point
  function scatter(ids, n, ok, size, opt = {}) {
    n = Math.round(n * q); let done = 0, guard = 0;
    while (done < n && guard++ < n * 30) {
      const a = gr() * 6.283, r = Math.sqrt(gr()) * ISLAND_R * 0.96, x0 = Math.cos(a) * r * OVAL_X, z0 = Math.sin(a) * r * OVAL_Z, g = opt.grp ? 1 + ((gr() * opt.grp) | 0) : 1;
      for (let i = 0; i < g && done < n; i++) {
        const x = x0 + (i ? rr(-1.7, 1.7) : 0), z = z0 + (i ? rr(-1.7, 1.7) : 0), h = terrainH(x, z);
        if (h < 1.6 || h > 30 || inPOI(x, z, 1) || Math.hypot(x - GROTTO.cavernX, z - GROTTO.cavernZ) < 60) break;
        const sl = Math.abs(terrainH(x + 1.2, z) - h) + Math.abs(terrainH(x, z + 1.2) - h); if (sl > (opt.sl || 1.5)) break;
        const c = { b: biomeW(x, z), h, dirt: dirtW(x, z, sl), f: fbm(x * 0.045 + 7, z * 0.045 - 3) };
        if (!ok(c)) break;
        const k = rr(size[0], size[1]), hue = opt.hue ? col.setHSL(opt.hue[0] + rr(-0.03, 0.03), opt.hue[1], opt.hue[2] + rr(-0.04, 0.05)) : null;
        flora.add(ids[(gr() * ids.length) | 0], x, h - (opt.sink ?? 0.03), z, gr() * 6.283, k, k * rr(0.9, 1.15), k, hue); done++;
      }
    }
  }
  const green = (c) => c.b.snow < 0.3 && c.b.desert < 0.35 && c.h > 2.4, meadow = (c) => green(c) && c.dirt < 0.4;
  scatter(['bush'], 520, (c) => meadow(c) && c.f > 0.36, [0.75, 1.35], { hue: [0.3, 0.6, 0.29], grp: 3, sink: 0 });
  scatter(['bushf'], 170, (c) => meadow(c) && c.b.forest < 0.6, [0.75, 1.15], { hue: [0.26, 0.62, 0.33], sink: 0 });
  scatter(['fern'], 1300, (c) => meadow(c) && (c.b.forest > 0.25 || gr() < 0.2), [0.8, 1.5], { grp: 4 });
  scatter(['plant', 'plant2'], 420, (c) => meadow(c) && c.f > 0.45, [0.7, 1.2], { grp: 2 });
  scatter(['clover'], 700, (c) => meadow(c), [0.8, 1.3], { grp: 5 });
  scatter(['flowA', 'flowB'], 900, (c) => meadow(c) && c.b.forest < 0.5 && c.f > 0.42, [0.8, 1.3], { grp: 5 });
  scatter(['mush'], 420, (c) => meadow(c) && c.b.forest > 0.2, [0.5, 1.05], { grp: 4 });
  scatter(['shelf'], 90, (c) => meadow(c) && c.b.forest > 0.2, [0.7, 1.1]);
  scatter(['tall', 'tall', 'tall', 'tall', 'wispy'], 2600, (c) => meadow(c) && c.f > 0.3, [0.8, 1.35], { hue: [0.24, 0.3, 0.82], grp: 5 });
  scatter(['wispy'], 260, (c) => c.b.desert > 0.4 && c.h > 2.2, [0.7, 1.1], { hue: [0.12, 0.5, 0.8], grp: 2 });
  scatter(['peb0', 'peb1', 'peb2'], 1500, (c) => c.b.snow < 0.5 && (c.dirt > 0.45 || c.b.desert > 0.4 || c.h < 2.6), [0.6, 1.9], { grp: 4, sl: 2.2, sink: 0.04 });
}
