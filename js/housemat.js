// Maisons : surfaces (brique, bardage, rondins, crépi, tuiles…) et formes de toit.
// Chaque morceau de bâtiment porte un numéro de surface (attribut aM) ; 0 = ancien rendu,
// qui devine la matière d'après la couleur (Agence, Yacht, Requin… inchangés).
import * as THREE from 'three';

export const M = {
  SIDING: 1, BRICK: 2, STUCCO: 3, LOGS: 4, BOARDS: 5, STONE: 6, SHINGLE: 7, TILE: 8, SEAM: 9, THATCH: 10, SNOW: 11,
  PLASTER: 12, FLOOR: 13, TRIM: 14, IRON: 15, WOOD: 16, LOUVER: 17, CONCRETE: 18, CLOTH: 19, PANE: 20, PAVE: 21, LEAF: 22, WALLPAPER: 23, HALFT: 24,
};
// couleur + surface dans un seul nombre (les 24 bits bas restent la couleur)
export const S = (m, hex) => m * 0x1000000 + hex;

// simple : éclairage mat, bien plus léger (puces graphiques intégrées)
export function houseMaterial(lowq, simple) {
  const mat = simple ? new THREE.MeshLambertMaterial({ vertexColors: true }) : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.06 });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aM;\nvarying vec3 vWP;\nvarying vec2 vHU;\nvarying float vM;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vHU = uv; vM = aM;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
      varying vec3 vWP; varying vec2 vHU; varying float vM;
      float hBump = 0.0, hRough = 0.0;
      float bHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float bNoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(bHash(i), bHash(i + vec2(1.0, 0.0)), f.x), mix(bHash(i + vec2(0.0, 1.0)), bHash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      // bord adouci selon la distance : le joint s'estompe au lieu de scintiller au loin
      float edge(float d, float w, float aa) { return smoothstep(w, w + max(aa, 0.004) * 1.5, d); }
      vec2 blk(vec2 p, float w, float h, float shift, out vec2 id) { float r = floor(p.y / h); p.x += r * shift * w; id = vec2(floor(p.x / w), r); return vec2(fract(p.x / w) * w, fract(p.y / h) * h); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      vec3 fn = normalize(cross(dFdx(vWP), dFdy(vWP)));
      float hM = floor(vM + 0.5);
      if (hM > 0.5) {
        vec3 an = abs(fn);
        float u = an.x > an.z ? vWP.z : vWP.x, v = vWP.y;
        if (an.y > 0.9 && hM != 13.0) v = an.x > an.z ? vWP.x : vWP.z;
        float aau = fwidth(u), aav = fwidth(v), px = max(aau, aav), det = 1.0 - smoothstep(0.06, 0.3, px);
        vec3 c = diffuseColor.rgb;
        if (hM == 1.0) {            // bardage : lames horizontales peintes, ombre sous chaque lame
          float p = 0.23, f = fract(v / p), r = floor(v / p), j = bHash(vec2(r, 3.0)) * 3.1;
          c *= 0.965 + 0.07 * bHash(vec2(r, floor((u + j) / 3.1)));
          c *= mix(1.0, 0.64 + 0.36 * edge(f * p, 0.016, aav), det) * (1.0 + 0.05 * f * det);
          hBump = (1.0 - f) * 0.016 * det;
        } else if (hM == 2.0) {     // brique
          vec2 id; vec2 q = blk(vec2(u, v), 0.56, 0.21, 0.5, id);
          float k = edge(min(q.x, 0.56 - q.x), 0.011, aau) * edge(min(q.y, 0.21 - q.y), 0.011, aav);
          float t = bHash(id); vec3 br = c * (0.82 + 0.3 * t); br = mix(br, br * vec3(0.72, 0.66, 0.68), step(0.86, bHash(id + 9.0)));
          vec3 mo = mix(c, vec3(0.72, 0.68, 0.62), 0.62);
          c = mix(c * 0.98, mix(mo, br, k), det); hBump = k * 0.012 * det;
        } else if (hM == 3.0) {     // crépi : grain, larges nuances, pied de mur patiné
          float n = bNoise(vec2(u, v) * 0.55) * 0.6 + bNoise(vec2(u, v) * 2.3) * 0.4;
          c *= 0.9 + 0.17 * n; float g = bNoise(vec2(u, v) * 9.0); c *= 1.0 + (g - 0.5) * 0.07 * det; hBump = g * 0.008 * det + n * 0.02;
        } else if (hM == 4.0) {     // rondins empilés
          float p = 0.44, f = fract(v / p), r = floor(v / p), b = sin(f * 3.14159);
          float gr = bNoise(vec2(u * 1.3 + r * 7.0, v * 17.0));
          c *= (0.56 + 0.5 * pow(b, 0.55)) * (0.86 + 0.26 * gr) * (0.92 + 0.16 * bHash(vec2(r, 1.0)));
          c = mix(c, c * vec3(1.15, 1.05, 0.88), bNoise(vec2(u * 0.4, r * 3.0)) * 0.5);
          hBump = pow(b, 0.5) * 0.09 * det;
        } else if (hM == 5.0) {     // planches verticales et couvre-joints
          float p = 0.46, f = fract(u / p) * p, bat = 1.0 - edge(abs(f - p * 0.5), 0.045, aau), sh = 1.0 - edge(abs(f - p * 0.5), 0.075, aau);
          c *= 0.95 + 0.1 * bHash(vec2(floor(u / p), 2.0)); c *= 1.0 - 0.26 * sh * (1.0 - bat) * det; c *= 1.0 + 0.08 * bat;
          c *= 0.97 + 0.06 * bNoise(vec2(u * 22.0, v * 1.1)) * det; hBump = bat * 0.02 * det;
        } else if (hM == 6.0) {     // moellons : rangs de pierres inégales
          float r = floor(v / 0.34), w = 0.5 + 0.35 * bHash(vec2(r, 5.0)); vec2 id; vec2 q = blk(vec2(u + bHash(vec2(r, 8.0)) * 2.0, v), w, 0.34, 0.0, id);
          float k = smoothstep(0.0, 0.05, min(min(q.x, w - q.x), min(q.y, 0.34 - q.y)));
          c *= mix(1.0, (0.55 + 0.45 * k) * (0.8 + 0.36 * bHash(id)) * (0.92 + 0.16 * bNoise(vec2(u, v) * 6.0)), det); hBump = k * 0.03 * det;
        } else if (hM == 7.0) {     // bardeaux : vHU.x = mètres le long du faîte, vHU.y = rang
          float r = floor(vHU.y), w = 0.36, x = vHU.x + r * 0.18 + bHash(vec2(r, 2.0)) * 0.1, id = floor(x / w), q = fract(x / w) * w, f = fract(vHU.y);
          float ax = fwidth(vHU.x);
          c *= mix(1.0, 0.8 + 0.36 * bHash(vec2(id, r)), det) * mix(1.0, 0.6 + 0.4 * edge(min(q, w - q), 0.012, ax), det);
          c *= 0.86 + 0.18 * f; hBump = bHash(vec2(id, r)) * 0.02 * det;
        } else if (hM == 8.0) {     // tuiles canal
          float w = 0.3, q = fract(vHU.x / w), id = floor(vHU.x / w), r = floor(vHU.y), b = sin(q * 3.14159);
          c *= (0.62 + 0.46 * b) * (0.84 + 0.28 * bHash(vec2(id, r))) * (0.86 + 0.2 * fract(vHU.y)); hBump = b * 0.06 * det;
        } else if (hM == 9.0) {     // bac acier à joints debout
          float w = 0.5, q = abs(fract(vHU.x / w) - 0.5) * w, s = 1.0 - edge(0.25 - q, 0.03, fwidth(vHU.x));
          c *= 1.0 + 0.22 * s * det; c *= 1.0 - 0.2 * (1.0 - edge(abs(0.25 - q - 0.045), 0.015, fwidth(vHU.x))) * det; c *= 0.95 + 0.09 * bNoise(vHU * vec2(1.2, 0.35)); hBump = s * 0.04 * det; hRough = -0.25;
        } else if (hM == 10.0) {    // chaume / palme
          float n = bNoise(vec2(vHU.x * 13.0, vHU.y * 1.6)), n2 = bNoise(vec2(vHU.x * 34.0, vHU.y * 2.5));
          c *= 0.66 + 0.4 * n + 0.2 * n2; c *= 0.8 + 0.28 * fract(vHU.y); hBump = n2 * 0.02 * det;
        } else if (hM == 11.0) {    // neige
          float n = bNoise(vWP.xz * 0.9 + vWP.y) * 0.6 + bNoise(vWP.xz * 3.1) * 0.4; c = mix(c * vec3(0.8, 0.87, 0.98), c, smoothstep(0.2, 0.75, n)); hBump = n * 0.05;
        } else if (hM == 12.0) {    // plâtre peint
          c *= 0.97 + 0.05 * bNoise(vec2(u, v) * 1.3);
        } else if (hM == 13.0) {    // parquet
          if (an.y > 0.5) { float p = 0.26, r = floor(vWP.z / p), f = fract(vWP.z / p) * p, x = vWP.x + bHash(vec2(r, 4.0)) * 2.4, id = floor(x / 2.4), q = fract(x / 2.4) * 2.4, a2 = fwidth(vWP.z);
            c *= 0.82 + 0.3 * bHash(vec2(id, r)); c *= 0.9 + 0.2 * bNoise(vec2(vWP.x * 1.6 + r * 5.0, vWP.z * 24.0));
            c *= mix(1.0, 0.6 + 0.4 * edge(min(f, p - f), 0.007, a2) * edge(min(q, 2.4 - q), 0.007, fwidth(vWP.x)), 1.0 - smoothstep(0.05, 0.2, a2)); hRough = -0.2; }
        } else if (hM == 14.0) {    // boiserie peinte
          c *= 0.97 + 0.05 * bNoise(vec2(u * 2.0, v * 2.0));
        } else if (hM == 15.0) { hRough = -0.35;
        } else if (hM == 16.0) {    // bois brut : veines dans le sens de la pièce
          vec2 q = fwidth(vHU.x) * 1.0 > fwidth(vHU.y) ? vec2(u * 2.0, v * 22.0) : vec2(u * 22.0, v * 2.0); c *= 0.8 + 0.34 * bNoise(q) ;
        } else if (hM == 17.0) {    // persienne
          float f = fract(v / 0.1); c *= mix(1.0, 0.62 + 0.45 * f, 1.0 - smoothstep(0.02, 0.07, aav)); hBump = f * 0.015;
        } else if (hM == 18.0) {    // béton banché
          vec2 q = abs(fract(vec2(u / 2.4, v / 2.0)) - 0.5); float k = edge(0.5 - q.x, 0.005, aau * 0.4) * edge(0.5 - q.y, 0.006, aav * 0.5);
          c *= mix(1.0, 0.72 + 0.28 * k, det); c *= 0.92 + 0.14 * bNoise(vec2(u, v) * 0.8) + 0.03 * bNoise(vec2(u * 3.0, v * 0.5));
        } else if (hM == 19.0) {    // toile rayée
          float s = step(0.5, fract(vHU.x)); c = mix(vec3(0.93, 0.91, 0.86), c, s);
        } else if (hM == 20.0) {    // carreau sombre (combles)
          float gl = smoothstep(0.1, 0.0, abs(fract((u + v) * 0.55) - 0.4)); c = mix(c * (0.75 + 0.4 * vHU.y), vec3(0.75, 0.88, 1.0), gl * 0.5); hRough = -0.55;
        } else if (hM == 21.0) {    // dallage
          vec2 id; vec2 q = blk(vWP.xz, 0.8, 0.55, 0.5, id); float k = smoothstep(0.0, 0.03, min(min(q.x, 0.8 - q.x), min(q.y, 0.55 - q.y))); if (an.y > 0.5) c *= mix(1.0, (0.65 + 0.35 * k) * (0.86 + 0.24 * bHash(id)), det);
        } else if (hM == 22.0) {    // feuillage
          float n = bNoise(vWP.xz * 5.0 + vWP.y * 6.0); c *= 0.66 + 0.62 * n; hBump = n * 0.06;
        } else if (hM == 23.0) {    // papier peint à rayures
          float s = step(0.5, fract(u / 0.36)); c *= mix(1.0, mix(0.93, 1.0, s), det); c *= 0.98 + 0.04 * bNoise(vec2(u, v) * 2.0);
        }
        if (an.y < 0.6 && hM < 6.5) c *= 0.95 + 0.1 * bNoise(vec2(u * 0.35, v * 0.12 + 4.0)); // grandes nuances de façade
        diffuseColor.rgb = c;
      } else {
      float isVert = smoothstep(0.35, 0.12, abs(fn.y));
      float isRoof = smoothstep(0.18, 0.45, fn.y) * smoothstep(0.96, 0.82, fn.y);
      // ---- ancien rendu : matière devinée d'après la teinte
      float isGlass = step(0.1, diffuseColor.b - diffuseColor.r) * step(0.4, diffuseColor.b + diffuseColor.g);
      float isDarkGlass = step(0.05, diffuseColor.b - diffuseColor.r) * step(length(diffuseColor.rgb), 0.35);
      float isGold = step(0.65, diffuseColor.r) * step(0.48, diffuseColor.g) * step(diffuseColor.b, 0.28);
      float isLightGray = step(0.45, diffuseColor.r) * step(0.03, diffuseColor.b - diffuseColor.r) * step(diffuseColor.b - diffuseColor.r, 0.09) * (1.0 - isGlass);
      float isWhiteMarble = max(step(0.82, diffuseColor.r) * step(0.82, diffuseColor.g) * step(0.78, diffuseColor.b), isLightGray);
      float isBrickOrStone = step(0.3, diffuseColor.r) * step(abs(diffuseColor.r - diffuseColor.g), 0.25) * (1.0 - isGold);
      if (isVert > 0.1 && (isGlass + isDarkGlass) < 0.5) {
        float plankY = mod(vWP.y, 0.38);
        float groove = smoothstep(0.0, 0.035, plankY) * (1.0 - smoothstep(0.345, 0.38, plankY));
        float siding = 0.92 + groove * 0.14 + smoothstep(0.035, 0.12, plankY) * 0.05;
        if (isBrickOrStone > 0.5 && isWhiteMarble < 0.5) {
          float coordX = abs(fn.x) > 0.5 ? vWP.z : vWP.x;
          // pierre de taille rosée de l'Agence : grands blocs appareillés (0,55 x 1,4 m)
          float isAshlar = step(0.05, diffuseColor.r - diffuseColor.g) * step(diffuseColor.r - diffuseColor.g, 0.12) * step(diffuseColor.g, diffuseColor.b);
          float rowH = mix(0.28, 0.55, isAshlar), colW = mix(0.88, 1.4, isAshlar);
          float bRow = floor(vWP.y / rowH);
          float bCol = mod(coordX + bRow * colW * 0.5, colW);
          float mortar = smoothstep(0.0, 0.035, mod(vWP.y, rowH)) * smoothstep(0.0, 0.045, bCol);
          float blockTone = 0.96 + 0.08 * bHash(vec2(floor((coordX + bRow * colW * 0.5) / colW), bRow)) * isAshlar;
          diffuseColor.rgb *= (0.86 + 0.18 * mortar) * blockTone;
        } else if (isWhiteMarble > 0.5) {
          float pY = smoothstep(0.0, 0.03, mod(vWP.y, 1.5)) * (1.0 - smoothstep(1.47, 1.5, mod(vWP.y, 1.5)));
          float pX = smoothstep(0.0, 0.03, mod(vWP.x + vWP.z, 2.0)) * (1.0 - smoothstep(1.97, 2.0, mod(vWP.x + vWP.z, 2.0)));
          diffuseColor.rgb *= 0.94 + 0.06 * (pY * pX);
        } else {
          float grain = (bNoise(vWP.xz * 1.8 + vWP.y * 0.5) - 0.5) * 0.06;
          diffuseColor.rgb *= (siding + grain);
        }
        float contactAO = smoothstep(0.0, 1.1, mod(vWP.y + 0.1, 4.0));
        diffuseColor.rgb *= 0.87 + 0.13 * contactAO;
      }
      if (isGlass > 0.5 || isDarkGlass > 0.5) {
        float glGleam = pow(max(0.0, sin((vWP.x + vWP.z) * 0.65 + vWP.y * 1.1)), 10.0) * 0.4;
        vec3 tint = isDarkGlass > 0.5 ? vec3(0.35, 0.5, 0.65) : vec3(0.82, 0.93, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, tint, glGleam * 0.8);
      }
      if (isRoof > 0.2) {
        float shingleY = mod(vWP.y, 0.26);
        float shStep = 0.88 + smoothstep(0.0, 0.03, shingleY) * 0.22;
        float shRow = floor(vWP.y / 0.26);
        float tone = 0.95 + 0.1 * fract(sin(shRow * 91.13) * 43758.5453);
        diffuseColor.rgb *= shStep * tone;
      }
      if (isGold > 0.5) {
        float shine = pow(max(0.0, sin((vWP.x + vWP.y + vWP.z) * 1.8)), 8.0) * 0.45;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.96, 0.7), shine);
      }
      }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + hRough, 0.12, 1.0);');
    // relief : la hauteur dessinée plus haut incline la lumière
    if (!lowq) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      if (vM > 0.5) {
        vec3 sX = dFdx(-vViewPosition), sY = dFdy(-vViewPosition), r1 = cross(sY, normal), r2 = cross(normal, sX);
        float dt = dot(sX, r1); vec3 gr = sign(dt) * (clamp(dFdx(hBump), -0.04, 0.04) * r1 + clamp(dFdy(hBump), -0.04, 0.04) * r2);
        normal = normalize(abs(dt) * normal - gr * 0.8);
      }`);
  };
  return mat;
}
// vitres : vraiment transparentes, avec des reflets en biais
export function glassMaterial() {
  const mat = new THREE.MeshLambertMaterial({ color: 0xbfe2f5, transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <color_fragment>', `#include <color_fragment>
      float s = vWP.x + vWP.z + vWP.y * 0.9, st = smoothstep(0.16, 0.1, abs(fract(s * 0.42) - 0.3)) * 0.8 + smoothstep(0.05, 0.02, abs(fract(s * 0.42) - 0.52)) * 0.6;
      vec3 vd = normalize(cameraPosition - vWP); float fr = 1.0 - abs(dot(normalize(cross(dFdx(vWP), dFdy(vWP))), vd));
      diffuseColor.a = 0.13 + st * 0.2 + fr * fr * 0.35; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), st * 0.7);`);
  };
  return mat;
}

// ---------------------------------------------------------------- formes
function build(tris) { // [[ [x,y,z] x 3 ou 4, [uv] x 3 ou 4 ]]
  const P = [], N = [], U = [], I = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (const [p, u] of tris) {
    a.fromArray(p[0]); b.fromArray(p[1]).sub(a); c.fromArray(p[2]).sub(a); b.cross(c).normalize();
    const k = P.length / 3;
    for (let i = 0; i < p.length; i++) { P.push(...p[i]); N.push(b.x, b.y, b.z); U.push(...(u ? u[i] : [i === 1 || i === 2 ? 1 : 0, i > 1 ? 1 : 0])); }
    I.push(k, k + 1, k + 2); if (p.length === 4) I.push(k, k + 2, k + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
  return g;
}
// prisme : polygone convexe (x, y) — sens inverse des aiguilles — extrudé de z0 à z1
export function prism(poly, z0, z1) {
  const T = [], n = poly.length;
  for (let i = 1; i < n - 1; i++) {
    T.push([[[...poly[0], z1], [...poly[i], z1], [...poly[i + 1], z1]]]);
    T.push([[[...poly[0], z0], [...poly[i + 1], z0], [...poly[i], z0]]]);
  }
  for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; T.push([[[...a, z1], [...a, z0], [...b, z0], [...b, z1]]]); }
  return build(T);
}
// Couverture d'un pan : rangs de tuiles qui se recouvrent (vraies marches), du rebord (xe, ye) au faîte (xr, yr).
export function tileRows(xe, ye, xr, yr, z0, z1, rows, lift = 0.07, zt0 = z0, zt1 = z1) {
  const T = [], L = Math.hypot(xr - xe, yr - ye), nx = -(yr - ye) / L, ny = (xr - xe) / L, sg = ny < 0 ? -1 : 1, ux = nx * sg * lift, uy = ny * sg * lift, flip = xe > xr;
  const q = (a, b, c, d, uv) => T.push(flip ? [[a, d, c, b], [uv[0], uv[3], uv[2], uv[1]]] : [[a, b, c, d], uv]);
  for (let i = 0; i < rows; i++) {
    const t0 = i / rows, t1 = (i + 1) / rows, x0 = xe + (xr - xe) * t0, y0 = ye + (yr - ye) * t0, x1 = xe + (xr - xe) * t1, y1 = ye + (yr - ye) * t1;
    const za0 = z0 + (zt0 - z0) * t0, zb0 = z1 + (zt1 - z1) * t0, za1 = z0 + (zt0 - z0) * t1, zb1 = z1 + (zt1 - z1) * t1;
    // le bas du rang est relevé, le haut se glisse sous le suivant
    q([x0 + ux, y0 + uy, za0], [x0 + ux, y0 + uy, zb0], [x1, y1, zb1], [x1, y1, za1], [[za0, i], [zb0, i], [zb1, i + 0.98], [za1, i + 0.98]]);
    q([x0, y0, za0], [x0, y0, zb0], [x0 + ux, y0 + uy, zb0], [x0 + ux, y0 + uy, za0], [[za0, i], [zb0, i], [zb0, i + 0.1], [za0, i + 0.1]]);
    T.push([[[x0, y0, zb0], [x1, y1, zb1], [x0 + ux, y0 + uy, zb0]].slice(0, 3), [[0, i], [0, i + 0.9], [0.1, i]]]);
    T.push([[[x0, y0, za0], [x0 + ux, y0 + uy, za0], [x1, y1, za1]], [[0, i], [0.1, i], [0, i + 0.9]]]);
  }
  return build(T);
}
// Toit à deux pans, faîte le long de z, centré. hs : demi-largeur du mur, y0 : hauteur au mur, rise : montée, over : débord bas, L : demi-longueur
export function gableParts({ hs, y0, rise, over, L, th = 0.18, rows = 8, lift = 0.07, board = 0.3 }) {
  const k = rise / hs, xe = hs + over, ye = y0 - over * k, yr = y0 + rise, tv = th * Math.hypot(1, k);
  const body = [], boards = [], tiles = [];
  for (const s of [-1, 1]) {
    const P = [[0, yr - 0.012], [0, yr - tv], [s * xe, ye - tv], [s * xe, ye - 0.012]];
    body.push(prism(s > 0 ? P.slice().reverse() : P, -L, L));
    const B = [[0, yr + 0.05], [0, yr - board], [s * (xe + 0.03), ye - board], [s * (xe + 0.03), ye + 0.05]];
    for (const e of [-1, 1]) boards.push(prism(s > 0 ? B.slice().reverse() : B, e > 0 ? L : -L - 0.09, e > 0 ? L + 0.09 : -L));
    tiles.push(tileRows(s * xe, ye, 0, yr, -L, L, rows, lift));
  }
  return { body, boards, tiles, xe, ye, yr, k };
}
// arc plein cintre : poly du remplissage au-dessus d'une ouverture de largeur w (pour linteaux en arc)
export function archPoly(w, h, n = 8) { const p = [[-w / 2, 0], [w / 2, 0]]; for (let i = 1; i < n; i++) { const a = i / n * Math.PI; p.push([Math.cos(a) * w / 2, Math.sin(a) * h]); } return p; }
// store banne : toile inclinée + lambrequin, u le long du mur, +z vers l'extérieur, rayures tous les 0,5 m
export function awningGeo(w, out, drop, val = 0.28) {
  const a = -w / 2, b = w / 2, n = Math.max(2, Math.round(w / 0.5)), U = (x) => (x - a) / w * n, T = [];
  T.push([[[a, 0, 0], [a, -drop, out], [b, -drop, out], [b, 0, 0]], [[0, 0], [0, 1], [n, 1], [n, 0]]]);
  T.push([[[a, -0.03, 0], [b, -0.03, 0], [b, -drop - 0.03, out], [a, -drop - 0.03, out]], [[0, 0], [n, 0], [n, 1], [0, 1]]]);
  T.push([[[a, -drop - val, out], [b, -drop - val, out], [b, -drop, out], [a, -drop, out]], [[0, 0], [n, 0], [n, 1], [0, 1]]]);
  T.push([[[b, -drop - val, out - 0.02], [a, -drop - val, out - 0.02], [a, -drop, out - 0.02], [b, -drop, out - 0.02]], [[0, 0], [n, 0], [n, 1], [0, 1]]]);
  for (const x of [a, b]) { const p = [[x, 0, 0], [x, -drop, out], [x, -drop - val, out]]; T.push([x === a ? [p[0], p[2], p[1]] : p, [[0.6, 0], [0.7, 0], [0.7, 1]]]); T.push([x === a ? p : [p[0], p[2], p[1]], [[0.6, 0], [0.7, 0], [0.7, 1]]]); }
  return build(T);
}
