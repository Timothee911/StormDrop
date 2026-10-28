// Cosmetics catalog + procedural character / pickaxe / glider / backpack models + emote poses
import * as THREE from 'three';

export const RARITIES = {
  common: { name: 'Commun', color: '#9aa3b5', grad: ['#b9c0cc', '#6e7687'] },
  uncommon: { name: 'Peu commun', color: '#5fd35f', grad: ['#7fe36c', '#2a8f3a'] },
  rare: { name: 'Rare', color: '#3fa9ff', grad: ['#5cc0ff', '#1d5fc4'] },
  epic: { name: 'Épique', color: '#b65cff', grad: ['#c77dff', '#6a22b8'] },
  legendary: { name: 'Légendaire', color: '#ffb43a', grad: ['#ffc65a', '#c26a12'] },
};

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
export const SKINS = {
  recrue: { name: 'Recrue', rarity: 'common', shirt: 0xff6b3d, pants: 0x2d3561, skin: 0xf2c6a0, hat: 0xffd23f, style: 'cap', desc: 'Prête pour le premier saut.' },
  recrue2: { name: 'Recrue Azur', rarity: 'common', shirt: 0x3dd6ff, pants: 0x1e2a44, skin: 0xc68b5e, hat: 0xff3d77, style: 'beanie', desc: 'Toujours au chaud.' },
  commando: { name: 'Commando Néon', rarity: 'rare', shirt: 0x2b2b3a, pants: 0x1a1a22, skin: 0xe0b08a, hat: 0x39ff88, style: 'helmet', extra: 'visor', desc: 'Brille dans la tempête.' },
  chevalier: { name: 'Chevalier Rouille', rarity: 'rare', shirt: 0x8f99a6, pants: 0x4b5260, skin: 0xf2c6a0, hat: 0xd94848, style: 'knight', desc: 'Armure d’occasion, courage neuf.' },
  punk: { name: 'Crête Électrique', rarity: 'rare', shirt: 0x1c1c1c, pants: 0x6a1b9a, skin: 0xf5d3b5, hat: 0x00e5ff, style: 'mohawk', extra: 'scarf', desc: 'Volume maximum.' },
  pirate: { name: 'Capitaine Sel', rarity: 'epic', shirt: 0x8b1e2d, pants: 0x2a1d14, skin: 0xd9a77c, hat: 0x1d1d1d, style: 'tricorn', desc: 'Le trésor, c’est la victoire.' },
  lapin: { name: 'Lapin Rebelle', rarity: 'epic', shirt: 0xff8fc7, pants: 0xffffff, skin: 0xffe3ef, hat: 0xff8fc7, style: 'ears', desc: 'Doux mais redoutable.' },
  ninja: { name: 'Ombre Ninja', rarity: 'epic', shirt: 0x15151f, pants: 0x15151f, skin: 0xe8b48c, hat: 0x15151f, style: 'hood', extra: 'mask', accent: 0xff2e4d, desc: 'On ne l’entend jamais arriver.' },
  yeti: { name: 'Yéti Givré', rarity: 'epic', shirt: 0xd8f1ff, pants: 0xb9e3ff, skin: 0x8ec9ff, hat: 0xffffff, style: 'hood', desc: 'Garde son sang-froid.' },
  astro: { name: 'Astronaute Lunaire', rarity: 'legendary', shirt: 0xf4f6fb, pants: 0xdfe4ee, skin: 0xf2c6a0, hat: 0xff7a1a, style: 'astro', desc: 'Atterrissage en douceur garanti.' },
  roi: { name: 'Roi Banane', rarity: 'legendary', shirt: 0xffe14d, pants: 0xffd11a, skin: 0xffe98a, hat: 0xffb000, style: 'crown', desc: 'Un règne plein de potassium.' },
  cyber: { name: 'Renard Cyber', rarity: 'legendary', shirt: 0xff7a1a, pants: 0x1a1d2e, skin: 0xffa64d, hat: 0xff7a1a, style: 'ears', extra: 'visor', accent: 0x00f0ff, desc: 'Récompense du Passe de combat.' },
  dragon: { name: 'Dragonnier Écarlate', rarity: 'legendary', shirt: 0xb3122e, pants: 0x3a0a14, skin: 0xf2c6a0, hat: 0xffb000, style: 'horns', extra: 'scarf', accent: 0xffb000, desc: 'Palier final du Passe de combat.' },
  agent: { name: 'Agent Minuit', rarity: 'rare', shirt: 0x1f2440, pants: 0x1f2440, skin: 0xb07a52, hat: 0x111111, style: 'none', extra: 'shades', desc: 'Lunettes noires, même la nuit.' },
  tigresse: { name: 'Tigresse', rarity: 'epic', shirt: 0xd94f2b, pants: 0x2a2f38, skin: 0xf2c6a0, hat: 0x1d2430, hair: 0x6b4a2a, style: 'capback', extra: 'tiger', desc: 'Rayures dans la jungle.' },
  jardin: { name: 'Jardinière', rarity: 'uncommon', shirt: 0x6fbf4a, pants: 0x7a4e2b, skin: 0xf5d3b5, hat: 0xf2e1a0, style: 'straw', desc: 'Plante des pièges.' },
  surf: { name: 'Surfeur Solaire', rarity: 'uncommon', shirt: 0x00c2c7, pants: 0xffa52d, skin: 0xc68b5e, hat: 0xffffff, style: 'none', extra: 'shades', desc: 'Toujours sur la vague.' },
  // Agents du Chapitre 2 Saison 2
  ombre: { name: 'Ombre', rarity: 'rare', shirt: 0x1a1a22, pants: 0x14141c, skin: 0xb07a52, hat: 0x111118, style: 'fedora', extra: 'shades', desc: 'L’uniforme parfait de l’ombre.' },
  midas: { name: 'Midas', rarity: 'legendary', shirt: 0xd9a900, pants: 0x8a6a00, skin: 0xf2c6a0, hat: 0x1a1a1a, style: 'fedora', extra: 'shades', accent: 0xffc400, desc: 'Tout ce qu’il touche devient or.' },
  brutus: { name: 'Brutus', rarity: 'epic', shirt: 0x3a4a5a, pants: 0x2a3a4a, skin: 0xd9a77c, hat: 0x222831, style: 'helmet', extra: 'visor', accent: 0x39ff88, desc: 'Le colosse de La Grotte.' },
  skye: { name: 'Skye', rarity: 'epic', shirt: 0xff8fc7, pants: 0xffffff, skin: 0xf2c6a0, hair: 0x6b4226, hat: 0xff8fc7, style: 'beanie', desc: 'Toujours accompagnée d’Ollie.' },
  tntina: { name: 'TNTina', rarity: 'epic', shirt: 0xff5a3d, pants: 0x2b2b3a, skin: 0xf2c6a0, hat: 0xffd23f, style: 'beanie', extra: 'shades', accent: 0xff5a3d, desc: 'Explosive, littéralement.' },
  meowscles: { name: 'Meowscles', rarity: 'epic', shirt: 0x8fa3ad, pants: 0x2b2b3a, skin: 0x9fb4c7, hat: 0x8fa3ad, style: 'ears', accent: 0x39ff88, desc: 'Muscles et moustaches.' },
};
export const BACKPACKS = {
  none: { name: 'Aucun', rarity: 'common' },
  sac: { name: 'Sac de recrue', rarity: 'common', color: 0x8a5a32 },
  cape: { name: 'Cape Royale', rarity: 'rare', color: 0x5b2bd6 },
  ailes: { name: 'Ailes d’Ange', rarity: 'epic', color: 0xffffff },
  fusee: { name: 'Réacteurs', rarity: 'epic', color: 0xb0b8c4 },
  carapace: { name: 'Carapace', rarity: 'uncommon', color: 0x2f9e5a },
  ailesdragon: { name: 'Ailes de Dragon', rarity: 'legendary', color: 0xb3122e },
  cristal: { name: 'Cristal Flottant', rarity: 'legendary', color: 0x7af0ff },
};
export const PICKAXES = {
  default: { name: 'Pioche standard', rarity: 'common' },
  hache: { name: 'Hache Bûcheronne', rarity: 'uncommon' },
  sucre: { name: 'Sucre d’Orge', rarity: 'rare' },
  epee: { name: 'Lame Néon', rarity: 'epic' },
  marteau: { name: 'Marteau Tonnerre', rarity: 'epic' },
  faux: { name: 'Faux Lunaire', rarity: 'legendary' },
};
export const GLIDERS = {
  default: { name: 'Planeur standard', rarity: 'common', c1: 0xffd23f, c2: 0xff6b3d, shape: 'delta' },
  nuage: { name: 'Nuage Rose', rarity: 'uncommon', c1: 0xff9ad5, c2: 0xffffff, shape: 'delta' },
  aigle: { name: 'Aigle Royal', rarity: 'rare', c1: 0x6b3d1f, c2: 0xffd23f, shape: 'wide' },
  parapluie: { name: 'Parapluie Pop', rarity: 'epic', c1: 0x3fa9ff, c2: 0xffffff, shape: 'umbrella' },
  dragon: { name: 'Envol Écarlate', rarity: 'legendary', c1: 0xb3122e, c2: 0xffb000, shape: 'wide' },
  neon: { name: 'Aile Néon', rarity: 'epic', c1: 0x111122, c2: 0x39ff88, shape: 'delta' },
};
export const EMOTES = {
  danse: { name: 'Danse de la victoire', rarity: 'common' },
  salut: { name: 'Salut', rarity: 'common' },
  robot: { name: 'Robot', rarity: 'uncommon' },
  flex: { name: 'Gros bras', rarity: 'rare' },
  disco: { name: 'Disco Fever', rarity: 'epic' },
  fil: { name: 'Fil dentaire', rarity: 'legendary' },
};
export const CATS = {
  skin: { name: 'Tenue', items: SKINS },
  backpack: { name: 'Sac à dos', items: BACKPACKS },
  pickaxe: { name: 'Pioche', items: PICKAXES },
  glider: { name: 'Planeur', items: GLIDERS },
  emote: { name: 'Emote', items: EMOTES },
};
export const DEFAULT_LOADOUT = { skin: 'recrue', backpack: 'sac', pickaxe: 'default', glider: 'default', emote: 'danse' };

// ---------------------------------------------------------------------------
// Model builders
// ---------------------------------------------------------------------------
const BOX = new THREE.BoxGeometry(1, 1, 1);
const cache = new Map();
export function mat(color, opts = {}) {
  const k = color + JSON.stringify(opts);
  if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...opts }));
  return cache.get(k);
}
// Matériaux réalistes : légère variation de rugosité/métallicité pour casser
// l'aspect plastique uniforme et donner un grain de surface.
export function matR(color, roughness = 0.7, metalness = 0.0, opts = {}) {
  const k = 'R' + color + roughness + metalness + JSON.stringify(opts);
  if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color, roughness, metalness, ...opts }));
  return cache.get(k);
}
export function box(g, w, h, d, x, y, z, m) { const b = new THREE.Mesh(BOX, m); b.scale.set(w, h, d); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; }
// Géométries organiques partagées (cache) : une centaine de personnages réutilisent
// les mêmes buffers, seule la transformation change.
const GEO = new Map();
function geo(k, fn) { let g = GEO.get(k); if (!g) { g = fn(); GEO.set(k, g); } return g; }
const r3 = (v) => Math.round(v * 1000) / 1000;
// Boîte aux arêtes arrondies : grille 6×6 par face, les deux segments extérieurs
// de chaque axe sont projetés sur un quart de cercle de rayon r.
function roundedBoxGeo(w, h, d, r) {
  w = r3(w); h = r3(h); d = r3(d); r = r3(Math.min(r, w / 2, h / 2, d / 2) * 0.999);
  return geo(`rb${w},${h},${d},${r}`, () => {
    const g = new THREE.BoxGeometry(1, 1, 1, 6, 6, 6);
    const p = g.attributes.position, n = g.attributes.normal;
    const half = [w / 2 - r, h / 2 - r, d / 2 - r], v = [0, 0, 0], c = [0, 0, 0], o = [0, 0, 0];
    for (let i = 0; i < p.count; i++) {
      v[0] = p.getX(i); v[1] = p.getY(i); v[2] = p.getZ(i);
      let len = 0;
      for (let a = 0; a < 3; a++) {
        const u = Math.abs(v[a]), s = Math.sign(v[a]);
        const q = u <= 1 / 6 + 1e-6 ? u * 6 * half[a] : half[a] + (u - 1 / 6) * 3 * r;
        c[a] = s * Math.min(q, half[a]); o[a] = s * q - c[a]; len += o[a] * o[a];
      }
      len = Math.sqrt(len);
      if (len > 1e-6) {
        for (let a = 0; a < 3; a++) o[a] /= len;
        p.setXYZ(i, c[0] + o[0] * r, c[1] + o[1] * r, c[2] + o[2] * r); n.setXYZ(i, o[0], o[1], o[2]);
      } else p.setXYZ(i, c[0], c[1], c[2]);
    }
    return g;
  });
}
// Segment de membre : capsule effilée verticale, haut à y=0 (articulation), bas à y=-len.
function limbGeo(r1, r2, len) {
  return geo(`lb${r3(r1)},${r3(r2)},${r3(len)}`, () => {
    const pts = [];
    for (let i = 0; i <= 4; i++) { const a = -Math.PI / 2 + i / 4 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(0, Math.cos(a) * r2), -len + r2 + Math.sin(a) * r2)); }
    for (let i = 0; i <= 4; i++) { const a = i / 4 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(0, Math.cos(a) * r1), -r1 + Math.sin(a) * r1)); }
    return new THREE.LatheGeometry(pts, 12);
  });
}
// Volume sculpté par sections : chaque anneau [y, demi-largeur, profondeur avant (-z),
// profondeur arrière (+z)] est une super-ellipse d'exposant n (2 = ellipse, plus = plus carré).
// Les anneaux sont interpolés en Catmull-Rom pour une silhouette lisse (torse, tête, bassin).
const crm = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
function loftGeo(key, rings, n = 2.5, seg = 24, steps = 4) {
  return geo(key, () => {
    const R = [], L = rings.length;
    for (let i = 0; i < L - 1; i++) for (let k = 0; k < steps; k++) {
      const p0 = rings[Math.max(0, i - 1)], p1 = rings[i], p2 = rings[i + 1], p3 = rings[Math.min(L - 1, i + 2)];
      R.push(p1.map((_, c) => crm(p0[c], p1[c], p2[c], p3[c], k / steps)));
    }
    R.push(rings[L - 1]);
    const pos = [], idx = [], e = 2 / n;
    const pole = ([y, , f, b]) => pos.push(0, y, (b - f) / 2);
    pole(R[0]);
    for (const [y, rx, f, b] of R) for (let j = 0; j < seg; j++) {
      const a = j / seg * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      pos.push(rx * Math.sign(c) * Math.abs(c) ** e, y, (sn < 0 ? f : b) * Math.sign(sn) * Math.abs(sn) ** e);
    }
    pole(R[R.length - 1]);
    const v = (r, j) => 1 + r * seg + (j % seg), top = 1 + R.length * seg;
    for (let j = 0; j < seg; j++) {
      idx.push(0, v(0, j), v(0, j + 1));
      for (let r = 0; r < R.length - 1; r++) idx.push(v(r, j), v(r + 1, j), v(r + 1, j + 1), v(r, j), v(r + 1, j + 1), v(r, j + 1));
      idx.push(v(R.length - 1, j), top, v(R.length - 1, j + 1));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  });
}
// point de la surface avant (-z) d'un loft en (x, y), interpolation linéaire des anneaux
function loftFront(rings, n, x, y) {
  let rx = rings[0][1], f = rings[0][2];
  for (let i = 1; i < rings.length; i++) {
    const a = rings[i - 1], b = rings[i];
    if (y >= a[0] && y <= b[0]) { const t = (y - a[0]) / (b[0] - a[0]); rx = a[1] + (b[1] - a[1]) * t; f = a[2] + (b[2] - a[2]) * t; break; }
  }
  return -f * Math.max(0, 1 - Math.abs(x / rx) ** n) ** (1 / n);
}
const SPHERE = new THREE.SphereGeometry(1, 16, 12);
const DOME = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
// Bande courbe autour du visage (lunettes, visière, masque) : arc de cylindre ouvert face à -z.
function arcGeo(r, h, ang) { return geo(`arc${r3(r)},${r3(h)},${r3(ang)}`, () => new THREE.CylinderGeometry(r, r, h, 16, 1, true, Math.PI - ang / 2, ang)); }
function part(g, geometry, m, x, y, z, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(geometry, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; g.add(o); return o;
}
export function rbox(g, w, h, d, x, y, z, m, r = Math.min(w, h, d) * 0.3) { return part(g, roundedBoxGeo(w, h, d, r), m, x, y, z); }
function limb(g, r1, r2, len, x, y, z, m, sz = 1) { return part(g, limbGeo(r1, r2, len), m, x, y, z, 1, 1, sz); }
function dome(g, r, x, y, z, m, sx = 1, sy = 1, sz = 1) { return part(g, DOME, m, x, y, z, r * sx, r * sy, r * sz); }
// Sphère / cylindre / cône : formes organiques pour un rendu moins cubique.
export function sph(g, r, x, y, z, m, sx = 1, sy = 1, sz = 1) { return part(g, SPHERE, m, x, y, z, r * sx, r * sy, r * sz); }
export function cyl(g, rt, rb, h, x, y, z, m, seg = 12) {
  return part(g, geo(`cy${r3(rt)},${r3(rb)},${r3(h)},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), m, x, y, z);
}

// Tête façon Fortnite : crâne et visage sculptés d'un seul volume (mâchoire carrée,
// pommettes, menton), grands yeux expressifs avec ligne de cils, nez modelé, lèvres.
const HEAD_RINGS = [
  [0.0, 0.05, 0.14, 0.02], [0.035, 0.1, 0.185, 0.07], [0.1, 0.152, 0.2, 0.15], [0.18, 0.182, 0.205, 0.19],
  [0.26, 0.196, 0.205, 0.215], [0.34, 0.2, 0.198, 0.222], [0.42, 0.18, 0.168, 0.2], [0.475, 0.12, 0.11, 0.14], [0.5, 0.03, 0.03, 0.04],
];
const HEAD_N = 2.25;
const faceZ = (x, y) => loftFront(HEAD_RINGS, HEAD_N, x, y);
// Coque de cheveux : le crâne gonflé d'une épaisseur au-dessus d'une ligne inclinée
// (yFront au front, yBack à la nuque) ; en dessous, la coque rentre en douceur sous la
// peau, ce qui donne une lisière nette sans marches d'escalier.
function hairGeo(yFront, yBack, th = 0.016) {
  return geo(`hair${yFront},${yBack},${th}`, () => {
    const out = loftGeo(`hairshell${th}`, HEAD_RINGS.map(([y, rx, f, b]) => [y * 1.04 + th * 0.6, rx + th, f + th, b + th * 1.4]), HEAD_N, 32, 6);
    const inn = loftGeo('hairinner', HEAD_RINGS.map(([y, rx, f, b]) => [y * 0.99, rx - 0.008, f - 0.008, b - 0.008]), HEAD_N, 32, 6);
    const g = out.clone(), p = g.attributes.position, q = inn.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const d = p.getY(i) - (yFront + (p.getZ(i) + 0.22) / 0.46 * (yBack - yFront));
      const t = Math.min(1, Math.max(0, (d + 0.012) / 0.024)), w = t * t * (3 - 2 * t);
      p.setXYZ(i, q.getX(i) + (p.getX(i) - q.getX(i)) * w, q.getY(i) + (p.getY(i) - q.getY(i)) * w, q.getZ(i) + (p.getZ(i) - q.getZ(i)) * w);
    }
    g.computeVertexNormals();
    return g;
  });
}
function buildFace(head, s, skinM, dark) {
  part(head, loftGeo('head', HEAD_RINGS, HEAD_N, 24, 4), skinM, 0, 0, 0); // crâne + visage
  limb(head, 0.016, 0.021, 0.09, 0, 0.27, faceZ(0, 0.27) + 0.002, skinM).rotation.x = 0.34; // arête du nez
  sph(head, 0.024, 0, 0.183, faceZ(0, 0.183) - 0.018, skinM, 1, 0.9, 1); // bout du nez
  for (const sx of [-1, 1]) sph(head, 0.015, sx * 0.022, 0.176, faceZ(0.022, 0.176) - 0.004, skinM); // ailes du nez
  for (const sx of [-1, 1]) sph(head, 0.055, sx * 0.194, 0.24, 0.03, skinM, 0.4, 1, 0.7); // oreilles
  if (s.extra === 'shades' || s.extra === 'visor') return;
  const white = mat(0xf7f8ff, { roughness: 0.2 }), iris = mat(s.eyes || 0x4a2e1a, { roughness: 0.15 });
  const pupil = mat(0x07070a, { roughness: 0.1 }), shine = mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 });
  for (const sx of [-1, 1]) {
    const x = sx * 0.08, z = faceZ(x, 0.27);
    sph(head, 0.046, x, 0.27, z + 0.016, white, 1, 0.78, 0.5); // globe
    sph(head, 0.028, x, 0.268, z - 0.004, iris, 1, 1, 0.42); // iris
    sph(head, 0.014, x, 0.268, z - 0.009, pupil, 1, 1, 0.4); // pupille
    sph(head, 0.007, x + sx * -0.009, 0.279, z - 0.015, shine); // reflet
    sph(head, 0.048, x, 0.296, z + 0.012, dark, 1.06, 0.26, 0.55); // ligne de cils
    const brow = rbox(head, 0.105, 0.03, 0.035, sx * 0.085, 0.335, faceZ(sx * 0.085, 0.335) + 0.006, mat(s.brows || s.hair || 0x2f2318), 0.013);
    brow.rotation.z = -sx * 0.12; brow.rotation.y = sx * 0.25; // sourcils épais
  }
  if (s.extra !== 'mask') {
    const lip = mat(new THREE.Color(s.skin).lerp(new THREE.Color(0xa83a3a), 0.4).getHex(), { roughness: 0.4 });
    sph(head, 0.042, 0, 0.106, faceZ(0, 0.106) + 0.004, lip, 1, 0.3, 0.45); // lèvre supérieure
    sph(head, 0.038, 0, 0.084, faceZ(0, 0.084) + 0.006, lip, 1, 0.38, 0.5); // lèvre inférieure
    rbox(head, 0.07, 0.007, 0.012, 0, 0.096, faceZ(0, 0.096) - 0.004, mat(0x3a1414), 0.003); // commissure
  }
}
function buildHead(head, s) {
  const skinM = mat(s.skin, { roughness: 0.55 });
  const hat = mat(s.hat), dark = mat(0x14141c);
  const acc = s.accent !== undefined ? mat(s.accent, { emissive: s.accent, emissiveIntensity: 0.6 }) : hat;
  const st = s.style;
  if (st === 'astro') {
    buildFace(head, s, skinM, dark);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 14), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.3 }));
    glass.position.y = 0.24; glass.castShadow = true; head.add(glass);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.05, 8, 20), mat(0xdfe4ee, { metalness: 0.4, roughness: 0.4 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = -0.04; ring.castShadow = true; head.add(ring);
    rbox(head, 0.12, 0.12, 0.05, 0.28, 0.08, -0.2, hat); // lampe du casque
    rbox(head, 0.1, 0.2, 0.1, -0.28, 0.3, 0.05, mat(0xdfe4ee)); // module latéral
  } else if (st === 'knight') {
    const steel = mat(0x9aa3ad, { metalness: 0.65, roughness: 0.3 });
    rbox(head, 0.48, 0.5, 0.46, 0, 0.24, 0, steel, 0.13); // heaume arrondi
    rbox(head, 0.08, 0.1, 0.5, 0, 0.47, 0, steel, 0.035); // crête du heaume
    rbox(head, 0.34, 0.05, 0.02, 0, 0.28, -0.232, dark, 0.008); // fente de vision
    rbox(head, 0.06, 0.22, 0.03, 0, 0.1, -0.232, steel, 0.012); // nasal
    for (let i = 0; i < 3; i++) rbox(head, 0.3, 0.02, 0.02, 0, 0.06 + i * 0.05, -0.228, dark, 0.008); // grille
    rbox(head, 0.1, 0.34, 0.4, 0, 0.66, 0.04, hat, 0.05); // panache
  } else buildFace(head, s, skinM, dark);
  // cheveux : coque qui dégage le front et descend sur la nuque, mèches en volume
  const hairC = s.hair || 0x2f2318;
  if (st === 'none' || st === 'cap' || st === 'capback' || st === 'ears' || st === 'crown' || st === 'mohawk' || s.hair) {
    const hairM = mat(hairC, { roughness: 0.9 });
    part(head, st === 'mohawk' ? hairGeo(0.39, 0.3, 0.008) : hairGeo(0.37, 0.12), hairM, 0, 0, 0);
    if (st === 'none') for (const [x, rz] of [[-0.09, 0.5], [0.0, 0.2], [0.09, -0.35]]) { // mèches sur le front
      const m = sph(head, 0.075, x, 0.5, -0.1, hairM, 1, 0.55, 1.5); m.rotation.set(-0.5, 0, rz);
    }
  }
  if (s.hair) sph(head, 0.2, 0, 0.2, 0.1, mat(s.hair, { roughness: 0.9 }), 1.1, 1.25, 0.8); // chevelure longue
  if (st === 'cap' || st === 'capback') {
    dome(head, 0.252, 0, 0.34, 0.01, hat, 1, 0.9, 1.08).rotation.x = 0.12;
    const brim = rbox(head, 0.3, 0.03, 0.2, 0, 0.37, st === 'cap' ? -0.295 : 0.295, hat, 0.012); brim.rotation.x = st === 'cap' ? -0.12 : 0.12; // visière (derrière si à l'envers)
    sph(head, 0.025, 0, 0.566, 0.03, hat); // bouton
  }
  if (st === 'beanie') {
    dome(head, 0.248, 0, 0.32, 0, mat(s.hat, { roughness: 0.95 }), 1, 1.02, 1.07);
    cyl(head, 0.252, 0.252, 0.08, 0, 0.35, 0, mat(s.hat, { roughness: 1 }), 16).scale.z = 1.07; // revers
    sph(head, 0.07, 0, 0.62, 0, mat(0xffffff, { roughness: 1 })); // pompon
  }
  if (st === 'helmet') {
    const helm = mat(0x2a3a2e, { metalness: 0.3, roughness: 0.5 });
    dome(head, 0.25, 0, 0.33, 0, helm, 1, 0.9, 1.08);
    cyl(head, 0.253, 0.253, 0.05, 0, 0.355, 0, hat, 16).scale.z = 1.08;
    rbox(head, 0.06, 0.16, 0.2, -0.23, 0.27, 0, helm, 0.025); rbox(head, 0.06, 0.16, 0.2, 0.23, 0.27, 0, helm, 0.025); // protège-oreilles
  }
  if (st === 'hood') {
    dome(head, 0.25, 0, 0.27, 0.01, hat, 1.02, 1.15, 1.12).rotation.x = 0.3; // capuche
    sph(head, 0.25, 0, 0.17, 0.1, hat, 1.0, 0.95, 0.85); // tombé sur la nuque et les joues
  }
  if (st === 'mohawk') rbox(head, 0.07, 0.26, 0.42, 0, 0.56, 0.02, mat(s.hat, { emissive: s.hat, emissiveIntensity: 0.4 }), 0.03);
  if (st === 'tricorn') {
    rbox(head, 0.62, 0.06, 0.54, 0, 0.48, 0, hat, 0.03);
    rbox(head, 0.4, 0.2, 0.36, 0, 0.6, 0, hat, 0.08);
    rbox(head, 0.63, 0.02, 0.55, 0, 0.515, 0, mat(0xd9b86a), 0.01);
    sph(head, 0.045, 0, 0.6, -0.19, mat(0xffffff));
  }
  if (st === 'ears') {
    const pink = mat(0xffd3e6);
    for (const sx of [-1, 1]) {
      sph(head, 0.06, sx * 0.12, 0.66, 0.02, hat, 0.95, 3.2, 0.6).rotation.z = -sx * 0.12;
      sph(head, 0.045, sx * 0.122, 0.66, -0.008, pink, 0.6, 2.8, 0.3).rotation.z = -sx * 0.12;
    }
  }
  if (st === 'crown') {
    const gold = mat(0xffc400, { metalness: 0.7, roughness: 0.25, emissive: 0x6a4a00, emissiveIntensity: 0.3 });
    cyl(head, 0.2, 0.19, 0.1, 0, 0.5, 0, gold, 16).scale.z = 1.05;
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cyl(head, 0, 0.04, 0.14, Math.sin(a) * 0.18, 0.62, Math.cos(a) * 0.19, gold, 8); }
  }
  if (st === 'horns') {
    part(head, hairGeo(0.37, 0.12), mat(0x3a0a14), 0, 0, 0);
    cyl(head, 0.012, 0.05, 0.32, -0.18, 0.62, 0, acc, 10).rotation.z = 0.4;
    cyl(head, 0.012, 0.05, 0.32, 0.18, 0.62, 0, acc, 10).rotation.z = -0.4;
  }
  if (st === 'straw') {
    cyl(head, 0.38, 0.4, 0.04, 0, 0.47, 0, hat, 20);
    cyl(head, 0.19, 0.2, 0.14, 0, 0.55, 0, hat, 16);
    cyl(head, 0.203, 0.203, 0.04, 0, 0.51, 0, mat(0xd94848), 16);
  }
  if (st === 'fedora') {
    cyl(head, 0.3, 0.3, 0.03, 0, 0.47, 0.01, hat, 20).scale.z = 0.95;
    cyl(head, 0.18, 0.21, 0.2, 0, 0.58, 0.01, hat, 16).scale.z = 1.1;
    cyl(head, 0.212, 0.212, 0.045, 0, 0.51, 0.01, mat(0x2c313c), 16).scale.z = 1.1;
  }
  if (s.extra === 'visor') part(head, arcGeo(0.222, 0.09, 2.2), mat(s.accent || s.hat, { emissive: s.accent || s.hat, emissiveIntensity: 1.2, side: THREE.DoubleSide }), 0, 0.28, 0, 1, 1, 1.06);
  if (s.extra === 'shades') part(head, arcGeo(0.22, 0.07, 1.9), mat(0x050505, { metalness: 0.8, roughness: 0.1, side: THREE.DoubleSide }), 0, 0.28, 0, 1, 1, 1.05);
  if (s.extra === 'mask') part(head, arcGeo(0.178, 0.16, 2.6), mat(s.shirt, { side: THREE.DoubleSide }), 0, 0.11, -0.03);
}
function buildBackpack(torso, id) {
  const B = BACKPACKS[id]; if (!B || id === 'none') return;
  const c = mat(B.color);
  if (id === 'sac') {
    rbox(torso, 0.48, 0.55, 0.22, 0, 0.42, 0.27, c, 0.07); rbox(torso, 0.38, 0.15, 0.06, 0, 0.3, 0.39, mat(0xffd23f), 0.025);
    for (const sx of [-1, 1]) onChest(torso, 0.055, 0.34, 0.022, sx * 0.17, 0.49, mat(0x5a3a20), 0.01); // bretelles
  }
  if (id === 'carapace') { const s = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), c); s.rotation.x = Math.PI / 2; s.position.set(0, 0.42, 0.22); s.castShadow = true; torso.add(s); }
  if (id === 'cape') { const cp = box(torso, 0.7, 1.1, 0.05, 0, 0.18, 0.28, mat(B.color, { side: THREE.DoubleSide })); cp.rotation.x = 0.15; box(torso, 0.74, 0.08, 0.1, 0, 0.74, 0.24, mat(0xffd23f)); }
  if (id === 'ailes' || id === 'ailesdragon') {
    const m = id === 'ailes' ? mat(0xffffff, { emissive: 0xfff6d0, emissiveIntensity: 0.25 }) : mat(0xb3122e);
    for (const sgn of [-1, 1]) {
      const w = new THREE.Group(); w.position.set(sgn * 0.15, 0.6, 0.28); w.rotation.y = sgn * 0.5; w.rotation.z = sgn * -0.35; torso.add(w);
      box(w, 0.9, 0.5, 0.05, sgn * 0.45, 0.1, 0, m); box(w, 0.6, 0.35, 0.05, sgn * 0.7, -0.25, 0, m);
      if (id === 'ailesdragon') box(w, 0.95, 0.06, 0.07, sgn * 0.47, 0.36, 0, mat(0xffb000));
    }
  }
  if (id === 'fusee') {
    for (const x of [-0.16, 0.16]) {
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.6, 10), mat(0xb0b8c4, { metalness: 0.6, roughness: 0.3 })); cyl.position.set(x, 0.42, 0.32); torso.add(cyl);
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 8), mat(0xff8a2a, { emissive: 0xff6a00, emissiveIntensity: 1.5 })); fl.rotation.x = Math.PI; fl.position.set(x, 0.0, 0.32); torso.add(fl);
    }
  }
  if (id === 'cristal') {
    const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mat(0x7af0ff, { emissive: 0x2ad0ff, emissiveIntensity: 0.9, roughness: 0.1, metalness: 0.2 }));
    cr.scale.set(0.8, 1.3, 0.8); cr.position.set(0, 0.55, 0.55); cr.userData.float = true; torso.add(cr);
  }
}
export function makePickaxe(id = 'default') {
  const g = new THREE.Group();
  const wood = mat(0x8a5a32);
  if (id === 'hache') {
    box(g, 0.07, 0.07, 1.0, 0, 0, -0.2, wood);
    box(g, 0.05, 0.4, 0.3, 0, 0.12, -0.6, mat(0xc0c8d0, { metalness: 0.7, roughness: 0.3 }));
  } else if (id === 'sucre') {
    const h = box(g, 0.08, 0.08, 1.0, 0, 0, -0.2, mat(0xffffff)); for (let i = 0; i < 5; i++) box(g, 0.085, 0.085, 0.06, 0, 0, -0.6 + i * 0.2, mat(0xff2e4d));
    const top = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 6, 12, Math.PI), mat(0xff2e4d)); top.rotation.y = Math.PI / 2; top.position.set(0, 0.18, -0.7); g.add(top);
  } else if (id === 'epee') {
    box(g, 0.06, 0.06, 0.3, 0, 0, 0.05, mat(0x222222)); box(g, 0.3, 0.06, 0.06, 0, 0, -0.1, mat(0xffd23f));
    box(g, 0.05, 0.12, 0.85, 0, 0, -0.55, mat(0x39ff88, { emissive: 0x39ff88, emissiveIntensity: 1.3 }));
  } else if (id === 'marteau') {
    box(g, 0.08, 0.08, 1.0, 0, 0, -0.2, mat(0x333344));
    box(g, 0.45, 0.28, 0.28, 0, 0, -0.68, mat(0x6a7fa0, { metalness: 0.7, roughness: 0.3 }));
    box(g, 0.47, 0.06, 0.3, 0, 0, -0.68, mat(0x5ad8ff, { emissive: 0x3ab8ff, emissiveIntensity: 1.2 }));
  } else if (id === 'faux') {
    box(g, 0.06, 0.06, 1.2, 0, 0, -0.3, mat(0x2a2a3a));
    const bl = box(g, 0.04, 0.12, 0.7, 0, 0.3, -0.75, mat(0xcfe0ff, { emissive: 0x6a8aff, emissiveIntensity: 0.8, metalness: 0.5 })); bl.rotation.x = -1.1;
  } else {
    box(g, 0.07, 0.07, 1.0, 0, 0, -0.2, wood);
    box(g, 0.7, 0.12, 0.12, 0, 0, -0.68, mat(0x7d8fa8, { metalness: 0.6, roughness: 0.3 }));
    box(g, 0.12, 0.16, 0.16, 0.36, -0.04, -0.68, mat(0x9fe3ff, { emissive: 0x3aa8ff, emissiveIntensity: 0.5 }));
    box(g, 0.12, 0.16, 0.16, -0.36, -0.04, -0.68, mat(0x9fe3ff, { emissive: 0x3aa8ff, emissiveIntensity: 0.5 }));
  }
  const m = new THREE.Object3D(); m.position.set(0, 0, -0.7); g.add(m); g.userData.muzzle = m;
  return g;
}
export function makeGlider(id = 'default') {
  const G = GLIDERS[id] || GLIDERS.default;
  const g = new THREE.Group();
  const m1 = new THREE.MeshStandardMaterial({ color: G.c1, side: THREE.DoubleSide, roughness: 0.7 });
  const m2 = new THREE.MeshStandardMaterial({ color: G.c2, side: THREE.DoubleSide, roughness: 0.7, emissive: id === 'neon' ? G.c2 : 0x000000, emissiveIntensity: id === 'neon' ? 1 : 0 });
  if (G.shape === 'umbrella') {
    const u = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.8, 8, 1, true), m1); u.position.y = 3.2; g.add(u);
    const u2 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.27, 8, 1, true), m2); u2.position.y = 3.47; g.add(u2);
    box(g, 0.05, 1.6, 0.05, 0, 2.4, 0, mat(0x222222));
  } else {
    const wide = G.shape === 'wide' ? 1.35 : 1;
    const gs = new THREE.Shape(); gs.moveTo(0, -1.4); gs.lineTo(2.2 * wide, 0.8); gs.lineTo(0, 0.3); gs.lineTo(-2.2 * wide, 0.8); gs.closePath();
    const a = new THREE.Mesh(new THREE.ShapeGeometry(gs), m1); a.rotation.x = -Math.PI / 2; a.position.y = 2.9; g.add(a);
    const b = new THREE.Mesh(new THREE.ShapeGeometry(gs), m2); b.scale.set(0.5, 0.5, 1); b.rotation.x = -Math.PI / 2; b.position.y = 2.92; g.add(b);
    box(g, 0.04, 1.2, 0.04, -0.5, 2.3, 0, mat(0x222222)); box(g, 0.04, 1.2, 0.04, 0.5, 2.3, 0, mat(0x222222));
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
// Parachute de descente : toile en demi-sphère à rayures + suspentes vers
// les épaules. Utilise les couleurs du planeur choisi (cosmétique conservée).
export function makeParachute(id = 'default') {
  const G = GLIDERS[id] || GLIDERS.default;
  const g = new THREE.Group();
  const segs = 8;
  for (let i = 0; i < segs; i++) {
    const gore = new THREE.Mesh(
      new THREE.SphereGeometry(2.3, 3, 8, i / segs * Math.PI * 2, Math.PI * 2 / segs, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: i % 2 ? G.c2 : G.c1, side: THREE.DoubleSide, roughness: 0.8 })
    );
    gore.position.y = 5.2; g.add(gore);
  }
  // bonnet central + cordon de suspension
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8), mat(0x222831)); cap.position.y = 5.35; g.add(cap);
  const line = (x1, y1, z1, x2, y2, z2) => {
    const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2), d = b.clone().sub(a);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, d.length(), 4), mat(0x222831));
    l.position.copy(a).addScaledVector(d, 0.5); l.lookAt(b); l.rotateX(Math.PI / 2); g.add(l);
  };
  // 8 suspentes du bord de la toile vers le harnais au-dessus de la tête
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    line(Math.cos(a) * 2.25, 5.25, Math.sin(a) * 2.25, 0, 2.05, 0);
  }
  // deux sangles vers les épaules
  line(0, 2.05, 0, 0.385, 1.55, 0);
  line(0, 2.05, 0, -0.385, 1.55, 0);
  // poignées de commande : deux risers qui partent du harnais vers l'extérieur,
  // exactement là où les mains du personnage viennent s'accrocher (±1 m, à
  // hauteur des épaules levées) — voir animateChar, mode 'glide'.
  for (const sgn of [1, -1]) {
    line(0, 2.05, 0, sgn * 1.0, 2.0, 0);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 8), mat(0x2a303c));
    grip.rotation.z = Math.PI / 2; grip.position.set(sgn * 1.0, 2.0, 0); grip.castShadow = true; grip.userData.grip = sgn; g.add(grip);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
// Anneaux [y, demi-largeur, avant, arrière] du torse (repère du groupe torse, y=0 aux hanches) :
// silhouette en V façon Fortnite, taille fine, pectoraux et trapèzes marqués.
const PELVIS_RINGS = [[-0.07, 0.1, 0.08, 0.09], [-0.03, 0.2, 0.135, 0.15], [0.04, 0.25, 0.155, 0.172], [0.13, 0.258, 0.155, 0.168], [0.2, 0.256, 0.152, 0.16], [0.25, 0.24, 0.14, 0.15]];
const CHEST_RINGS = [[0.15, 0.24, 0.14, 0.14], [0.24, 0.252, 0.152, 0.148], [0.34, 0.275, 0.168, 0.152], [0.45, 0.315, 0.2, 0.162], [0.54, 0.33, 0.206, 0.17], [0.62, 0.335, 0.183, 0.17], [0.68, 0.275, 0.143, 0.15], [0.735, 0.17, 0.1, 0.11], [0.77, 0.08, 0.065, 0.07]];
const CHEST_N = 2.6;
// Basket sculptée le long du pied (loft couché : y du loft = du talon vers la pointe,
// « avant » = sous le pied, « arrière » = dessus) : talon, tige montante, cou-de-pied, pointe.
const SHOE_RINGS = [[0, 0.055, 0.035, 0.06], [0.03, 0.088, 0.048, 0.11], [0.1, 0.094, 0.05, 0.135], [0.18, 0.091, 0.05, 0.095], [0.26, 0.097, 0.05, 0.068], [0.32, 0.09, 0.048, 0.058], [0.36, 0.05, 0.035, 0.035]];
const SOLE_RINGS = [[-0.005, 0.06, 0.03, 0.03], [0.03, 0.097, 0.032, 0.032], [0.18, 0.095, 0.032, 0.032], [0.27, 0.102, 0.032, 0.032], [0.34, 0.093, 0.03, 0.03], [0.372, 0.05, 0.024, 0.024]];
// z de la surface avant du buste en (x, y) : pour poser poches, fermeture, rayures
const chestFront = (x, y) => loftFront(CHEST_RINGS, CHEST_N, x, y);
// détail plaqué sur le buste : posé sur la surface et tourné selon sa courbure
function onChest(torso, w, h, d, x, y, m, r) {
  const b = rbox(torso, w, h, d, x, y, chestFront(x, y) - d * 0.15, m, r);
  b.rotation.y = -Math.atan((chestFront(x + 0.01, y) - chestFront(x - 0.01, y)) / 0.02);
  b.rotation.x = Math.atan((chestFront(x, y + 0.01) - chestFront(x, y - 0.01)) / 0.02);
  return b;
}
export function makeCharMesh(cos) {
  const s = SKINS[cos.skin] || SKINS.recrue;
  const g = new THREE.Group();
  const shirt = mat(s.shirt, { roughness: 0.85 }), pants = mat(s.pants, { roughness: 0.9 });
  const skinM = mat(s.skin, { roughness: 0.55 }), dark = mat(0x1a1a22, { roughness: 0.6 });
  const bootM = mat(0x23232f, { roughness: 0.4 }), soleM = mat(0xd8d4c8, { roughness: 0.7 });
  const armored = s.style === 'astro' || s.style === 'knight';
  const gloveM = armored ? mat(0xdfe4ee, { roughness: 0.5 }) : skinM;
  const metal = mat(0xc0c8d0, { metalness: 0.7, roughness: 0.35 });

  // --- jambes : pantalon cargo (cuisse, poche latérale), genouillère, mollet, grosse chaussure ---
  const hipL = new THREE.Group(), hipR = new THREE.Group();
  hipL.position.set(-0.155, 0.88, 0); hipR.position.set(0.155, 0.88, 0);
  // genou : articulation à 0,42 m sous la hanche ; rotation.x < 0 replie la jambe vers l'arrière
  const kneeL = new THREE.Group(), kneeR = new THREE.Group();
  const shoeM = mat(s.shoes || 0x2a2d38, { roughness: 0.55 }), stripeM = mat(s.shirt, { roughness: 0.6 }), laceM = mat(0xf2f2f2, { roughness: 0.8 });
  for (const hip of [hipL, hipR]) {
    const outer = hip === hipL ? -1 : 1, knee = hip === hipL ? kneeL : kneeR;
    limb(hip, 0.13, 0.095, 0.46, 0, 0.02, 0, pants, 1.05); // cuisse
    rbox(hip, 0.05, 0.15, 0.14, outer * 0.112, -0.22, 0, pants, 0.02); // poche cargo
    rbox(hip, 0.052, 0.035, 0.145, outer * 0.114, -0.15, 0, dark, 0.012); // rabat
    knee.position.set(0, -0.42, 0); hip.add(knee);
    sph(knee, 0.093, 0, 0, 0, pants, 1, 1, 1.05); // rotule (raccord cuisse/jambe quand le genou plie)
    limb(knee, 0.1, 0.07, 0.36, 0, 0, 0, pants, 1.08); // jambe et mollet
    rbox(knee, 0.15, 0.14, 0.06, 0, -0.01, -0.085, dark, 0.028).rotation.x = -0.1; // genouillère
    // basket montante : tige rembourrée, empeigne sculptée, semelle en gomme, lacets, bande latérale
    cyl(knee, 0.084, 0.09, 0.08, 0, -0.31, 0.005, shoeM, 12); // col rembourré
    part(knee, loftGeo('shoe', SHOE_RINGS, 2.3, 20, 4), shoeM, 0, -0.37, 0.12).rotation.x = -Math.PI / 2; // empeigne
    part(knee, loftGeo('sole', SOLE_RINGS, 3.2, 20, 3), soleM, 0, -0.428, 0.122).rotation.x = -Math.PI / 2; // semelle
    for (const [y, z] of [[-0.236, 0.0], [-0.259, -0.04], [-0.278, -0.08]]) rbox(knee, 0.075, 0.012, 0.024, 0, y, z, laceM, 0.005).rotation.x = -0.45; // lacets
    for (const sx of [-1, 1]) rbox(knee, 0.012, 0.035, 0.15, sx * 0.093, -0.38, -0.02, stripeM, 0.005).rotation.x = -0.25; // bande latérale
  }
  // --- torse : bassin, ceinture, buste en V, col montant, détails ---
  const torso = new THREE.Group(); torso.position.y = 0.88;
  part(torso, loftGeo('pelvis', PELVIS_RINGS, 2.4), pants, 0, 0, 0); // bassin
  part(torso, loftGeo('belt', [[0.18, 0.268, 0.165, 0.172], [0.245, 0.268, 0.165, 0.172]], 2.4, 24, 1), s.accent !== undefined ? mat(s.accent) : dark, 0, 0, 0); // ceinture
  rbox(torso, 0.09, 0.07, 0.03, 0, 0.212, -0.17, metal, 0.012); // boucle
  rbox(torso, 0.1, 0.12, 0.07, 0.19, 0.17, 0.11, dark, 0.025).rotation.y = -0.6; // pochette de ceinture
  part(torso, loftGeo('chest', CHEST_RINGS, CHEST_N), shirt, 0, 0, 0); // buste
  for (let i = 0; i < 6; i++) onChest(torso, 0.02, 0.085, 0.014, 0, 0.29 + i * 0.07, dark, 0.006); // fermeture éclair
  if (cos.backpack !== 'sac') for (const sx of [-1, 1]) onChest(torso, 0.12, 0.11, 0.03, sx * 0.15, 0.49, dark, 0.014); // poches poitrine
  part(torso, loftGeo('collar', [[0.68, 0.2, 0.15, 0.16], [0.75, 0.155, 0.12, 0.13], [0.8, 0.15, 0.118, 0.128]], 2.3, 24, 3), dark, 0, 0, 0); // col montant
  if (s.extra === 'tiger') { // rayures de tigre sur le t-shirt
    const stripe = mat(0x241009, { roughness: 0.7 });
    for (const [x, y, h] of [[-0.22, 0.34, 0.2], [0.22, 0.34, 0.2], [-0.07, 0.46, 0.3], [0.09, 0.5, 0.26], [-0.24, 0.57, 0.16], [0.24, 0.57, 0.16]])
      onChest(torso, 0.06, h, 0.02, x, y, stripe, 0.009);
  }
  if (s.extra === 'scarf') { cyl(torso, 0.17, 0.2, 0.13, 0, 0.76, 0, mat(s.accent || 0xd94848), 16).scale.z = 0.85; rbox(torso, 0.12, 0.3, 0.06, 0.12, 0.55, 0.2, mat(s.accent || 0xd94848), 0.025); }
  cyl(torso, 0.072, 0.08, 0.16, 0, 0.79, 0, armored ? mat(s.shirt) : skinM, 12); // cou
  buildBackpack(torso, cos.backpack);
  // tête légèrement réduite : proportions héroïques (~1/7 de la taille)
  const head = new THREE.Group(); head.position.y = 0.83; head.scale.setScalar(0.9); torso.add(head);
  buildHead(head, s);
  // --- bras : deltoïde, biceps, coudière, avant-bras galbé, manchette, main (paume, doigts, pouce) ---
  const shL = new THREE.Group(), shR = new THREE.Group();
  shL.position.set(-0.385, 0.66, 0); shR.position.set(0.385, 0.66, 0);
  // coude : articulation à 0,42 m sous l'épaule ; rotation.x > 0 replie l'avant-bras vers l'avant
  const elL = new THREE.Group(), elR = new THREE.Group();
  for (const sx of [-1, 1]) sph(torso, 0.092, sx * 0.295, 0.6, 0, shirt, 1.1, 0.85, 1.1); // masse d'épaule : prolonge les trapèzes
  for (const sh of [shL, shR]) {
    const inner = sh === shL ? 1 : -1, el = sh === shL ? elL : elR; // côté du corps
    sph(sh, 0.092, inner * 0.01, -0.06, 0, shirt, 1.08, 1.32, 1.1).rotation.z = -inner * 0.35; // deltoïde allongé, incliné vers le cou
    limb(sh, 0.09, 0.072, 0.42, 0, -0.03, 0, shirt); // haut du bras
    el.position.set(0, -0.42, 0); sh.add(el);
    sph(el, 0.074, 0, 0, 0, shirt); // articulation
    sph(el, 0.074, 0, 0, 0.014, dark, 1, 0.8, 1); // coudière
    limb(el, 0.08, 0.06, 0.26, 0, 0, 0, shirt); // avant-bras
    cyl(el, 0.068, 0.066, 0.05, 0, -0.245, 0, dark, 12); // manchette
    rbox(el, 0.085, 0.11, 0.12, 0, -0.31, 0, gloveM, 0.038); // paume
    rbox(el, 0.08, 0.09, 0.11, 0, -0.38, -0.006, gloveM, 0.034).rotation.x = 0.18; // doigts repliés
    limb(el, 0.025, 0.021, 0.08, inner * 0.045, -0.28, -0.045, gloveM).rotation.z = inner * 0.5; // pouce
  }
  torso.add(shL, shR);
  const hand = new THREE.Group(); hand.position.set(0, -0.32, 0); hand.rotation.x = -Math.PI / 2; elR.add(hand);
  g.add(hipL, hipR, torso);
  const glider = makeParachute(cos.glider); glider.visible = false; g.add(glider);
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return { group: g, hipL, hipR, kneeL, kneeR, torso, head, shL, shR, elL, elR, hand, glider };
}

// Emote poses. Returns vertical offset for the whole body.
// Remet coudes et genoux à leur flexion naturelle (légèrement pliés).
export function relaxJoints(P) {
  P.elL.rotation.set(0.12, 0, 0); P.elR.rotation.set(0.12, 0, 0);
  P.kneeL.rotation.set(-0.04, 0, 0); P.kneeR.rotation.set(-0.04, 0, 0);
}
export function poseEmote(P, id, t) {
  P.torso.rotation.set(0, 0, 0); P.head.rotation.set(0, 0, 0); relaxJoints(P);
  let y = 0;
  const s = Math.sin, c = Math.cos;
  switch (id) {
    case 'salut': // bras levé, l'avant-bras fait coucou depuis le coude
      P.shR.rotation.set(0, 0, 2.3); P.elR.rotation.set(0, 0, 0.55 + s(t * 10) * 0.45); P.shL.rotation.set(0, 0, -0.15);
      P.hipL.rotation.set(0, 0, 0); P.hipR.rotation.set(0, 0, 0); break;
    case 'robot': { // bras à angle droit et genou levé, par à-coups
      const k = Math.floor(t * 4) % 4;
      P.shR.rotation.set(k % 2 ? 0.25 : -0.1, 0, 0.1); P.elR.rotation.set(k % 2 ? 1.5 : 0.35, 0, 0);
      P.shL.rotation.set(k % 2 ? -0.1 : 0.25, 0, -0.1); P.elL.rotation.set(k % 2 ? 0.35 : 1.5, 0, 0);
      P.torso.rotation.y = [0.4, 0, -0.4, 0][k]; P.head.rotation.y = [-0.4, 0, 0.4, 0][k];
      P.hipL.rotation.set(k === 1 ? 0.7 : 0, 0, 0); P.kneeL.rotation.x = k === 1 ? -1.2 : -0.04;
      P.hipR.rotation.set(k === 3 ? 0.7 : 0, 0, 0); P.kneeR.rotation.x = k === 3 ? -1.2 : -0.04; break;
    }
    case 'flex': { // gros bras : bras à l'horizontale, avant-bras dressés, biceps contractés
      const p = s(t * 6) * 0.15;
      P.shR.rotation.set(0, 0, 1.55); P.shL.rotation.set(0, 0, -1.55);
      P.elR.rotation.set(0, 0, 1.75 + p); P.elL.rotation.set(0, 0, -1.75 - p);
      P.torso.rotation.y = s(t * 3) * 0.3;
      y = Math.abs(s(t * 6)) * 0.03; P.hipL.rotation.set(0.1, 0, -0.15); P.hipR.rotation.set(0.1, 0, 0.15);
      P.kneeL.rotation.x = P.kneeR.rotation.x = -0.25; break;
    }
    case 'disco': { // index pointé vers le ciel puis vers le sol, genoux qui rebondissent
      const up = s(t * 4) > 0, b = Math.abs(s(t * 8));
      P.shR.rotation.set(0, 0, up ? 2.7 : 0.4); P.elR.rotation.set(up ? 0 : 0.4, 0, 0);
      P.shL.rotation.set(0.3, 0, -0.3 - Math.max(0, -s(t * 4)) * 0.5); P.elL.rotation.set(1.2, 0, 0);
      P.torso.rotation.z = s(t * 4) * 0.15; y = b * 0.06 - 0.03;
      P.hipL.rotation.set(s(t * 8) * 0.3 + 0.2, 0, 0); P.hipR.rotation.set(-s(t * 8) * 0.3 + 0.2, 0, 0);
      P.kneeL.rotation.x = P.kneeR.rotation.x = -0.35 - b * 0.25; break;
    }
    case 'fil': { // floss : bras tendus qui passent devant/derrière, hanches en opposition
      const a = s(t * 9);
      P.shR.rotation.set(a > 0 ? -0.5 : 0.5, 0, 0.35); P.shL.rotation.set(a > 0 ? -0.5 : 0.5, 0, -0.35);
      P.elR.rotation.set(0.05, 0, 0); P.elL.rotation.set(0.05, 0, 0);
      P.torso.rotation.y = a * 0.35; P.hipL.rotation.set(0, 0, a * 0.12); P.hipR.rotation.set(0, 0, a * 0.12);
      P.kneeL.rotation.x = P.kneeR.rotation.x = -0.15; y = Math.abs(a) * 0.04; break;
    }
    default: { // danse : bras levés pliés au coude, genoux montés à tour de rôle
      const a = s(t * 7);
      P.shR.rotation.set(0, 0, 1.4 + a * 0.9); P.shL.rotation.set(0, 0, -1.4 + a * 0.9);
      P.elR.rotation.set(0, 0, 0.6 + a * 0.3); P.elL.rotation.set(0, 0, -0.6 + a * 0.3);
      P.torso.rotation.z = a * 0.15; P.head.rotation.z = -a * 0.2;
      P.hipL.rotation.set(Math.max(0, a) * 0.7, 0, 0); P.hipR.rotation.set(Math.max(0, -a) * 0.7, 0, 0);
      P.kneeL.rotation.x = -0.05 - Math.max(0, a) * 1.2; P.kneeR.rotation.x = -0.05 - Math.max(0, -a) * 1.2;
      y = Math.abs(c(t * 7)) * 0.1;
    }
  }
  return y;
}
export function poseIdle(P, t) {
  P.torso.rotation.set(0, 0, 0); P.head.rotation.set(0, Math.sin(t * 0.7) * 0.15, 0); relaxJoints(P);
  P.elR.rotation.x = 0.2 + Math.sin(t * 1.3) * 0.04; P.elL.rotation.x = 0.2 - Math.sin(t * 1.3) * 0.04;
  P.shR.rotation.set(Math.sin(t * 1.3) * 0.05, 0, 0.12); P.shL.rotation.set(-Math.sin(t * 1.3) * 0.05, 0, -0.12);
  P.hipL.rotation.set(0, 0, -0.04); P.hipR.rotation.set(0, 0, 0.04);
  return Math.sin(t * 1.8) * 0.012;
}

