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
  skate: { name: 'Skate Rétro', rarity: 'uncommon', color: 0xff6b3d },
  lanterne: { name: 'Lanterne de Mineur', rarity: 'uncommon', color: 0xffd23f },
  tank: { name: 'Bonbonne d’Oxygène', rarity: 'rare', color: 0x3fa9ff },
  tnt: { name: 'Baril de TNT', rarity: 'rare', color: 0xd94848 },
  champi: { name: 'Champignon Spot', rarity: 'rare', color: 0xff5a3d },
  plush: { name: 'Peluche Ours', rarity: 'epic', color: 0xb07a52 },
  boombox: { name: 'Boombox', rarity: 'epic', color: 0x2b2b3a },
  aquarium: { name: 'Aquarium Vivant', rarity: 'legendary', color: 0x3fd6ff },
};
export const PICKAXES = {
  default: { name: 'Pioche standard', rarity: 'common' },
  hache: { name: 'Hache Bûcheronne', rarity: 'uncommon' },
  sucre: { name: 'Sucre d’Orge', rarity: 'rare' },
  epee: { name: 'Lame Néon', rarity: 'epic' },
  marteau: { name: 'Marteau Tonnerre', rarity: 'epic' },
  faux: { name: 'Faux Lunaire', rarity: 'legendary' },
  os: { name: 'Fémur Brut', rarity: 'uncommon' },
  banane: { name: 'Banane Explosive', rarity: 'uncommon' },
  glace: { name: 'Pioche Polaire', rarity: 'rare' },
  cle: { name: 'Clé à Molette Géante', rarity: 'rare' },
  flambeau: { name: 'Flambeau Éternel', rarity: 'rare' },
  pelle: { name: 'Pelle du Roi', rarity: 'epic' },
  katana: { name: 'Katana Rose Néon', rarity: 'epic' },
  raquette: { name: 'Raquette de Match', rarity: 'epic' },
  guitare: { name: 'Guitare Foudre', rarity: 'epic' },
  trident: { name: 'Trident des Abysses', rarity: 'legendary' },
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
  clap: { name: 'Ovation', rarity: 'uncommon' },
  zombie: { name: 'Marche Zombie', rarity: 'uncommon' },
  squat: { name: 'Squats', rarity: 'uncommon' },
  boxe: { name: 'Jab-Jab', rarity: 'rare' },
  pirouette: { name: 'Pirouette', rarity: 'rare' },
  kungfu: { name: 'Kata du Dragon', rarity: 'epic' },
  corde: { name: 'Corde à Sauter', rarity: 'epic' },
  airguitar: { name: 'Air Guitar', rarity: 'legendary' },
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
// Bretelles partagées : deux sangles visibles dans le dos, plaquées sur la face
// arrière du sac (comme un vrai sac à dos porté), + deux sangles sur la poitrine.
function backpackStraps(torso, color, z, yTop = 0.72, yBot = 0.3, sx = 0.15, ry = 0, rx = 0.05) {
  const m = mat(color, { roughness: 0.7 });
  const h = Math.max(0.2, yTop - yBot), cy = (yTop + yBot) / 2;
  for (const s of [-1, 1]) {
    const b = rbox(torso, 0.06, h, 0.03, s * sx, cy, z, m, 0.012); // sangle sur le sac
    b.rotation.x = rx; b.rotation.y = s * ry; // ry : épouse les objets ronds
    onChest(torso, 0.05, 0.34, 0.022, s * 0.16, 0.49, m, 0.008); // sangle poitrine
  }
}
function buildBackpack(torso, id) {
  const B = BACKPACKS[id]; if (!B || id === 'none') return;
  const c = mat(B.color);
  if (id === 'sac') {
    rbox(torso, 0.48, 0.55, 0.22, 0, 0.42, 0.27, c, 0.07); rbox(torso, 0.38, 0.15, 0.06, 0, 0.3, 0.39, mat(0xffd23f), 0.025);
    backpackStraps(torso, 0x24242e, 0.435); // bretelles
  }
  if (id === 'carapace') { const s = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), c); s.rotation.x = Math.PI / 2; s.position.set(0, 0.42, 0.22); s.castShadow = true; torso.add(s); }
  if (id === 'cape') { const cp = box(torso, 0.7, 1.1, 0.05, 0, 0.18, 0.28, mat(B.color, { side: THREE.DoubleSide })); cp.rotation.x = 0.15; box(torso, 0.74, 0.08, 0.1, 0, 0.74, 0.24, mat(0xffd23f)); }
  if (id === 'ailes' || id === 'ailesdragon') {
    const m = id === 'ailes' ? mat(0xffffff, { emissive: 0xfff6d0, emissiveIntensity: 0.25 }) : mat(0xb3122e);
    for (const sgn of [-1, 1]) {
      const w = new THREE.Group(); w.position.set(sgn * 0.15, 0.6, 0.33); w.rotation.y = sgn * 0.5; w.rotation.z = sgn * -0.35; torso.add(w);
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
    cr.scale.set(0.8, 1.3, 0.8); cr.position.set(0, 0.55, 0.46); cr.userData.float = true; torso.add(cr);
  }
  if (id === 'skate') { // planche verticale dans le dos avec roues
    backpackStraps(torso, 0x24242e, 0.42, 0.85, 0.05);
    const deck = rbox(torso, 0.42, 1.0, 0.07, 0, 0.42, 0.3, mat(B.color, { roughness: 0.5 }), 0.05); deck.rotation.z = 0.12;
    rbox(torso, 0.44, 0.08, 0.09, 0, 0.42, 0.3, mat(0x1a1a22), 0.03);
    for (const [y, x] of [[0.12, 0.03], [0.72, -0.03]]) for (const sx of [-1, 1])
      cyl(torso, 0.05, 0.05, 0.05, x + sx * 0.16, y, 0.35, mat(0xffd23f, { roughness: 0.4 }), 10).rotation.x = Math.PI / 2;
  }
  if (id === 'lanterne') { // lanterne de mineur à grille + coeur lumineux
    backpackStraps(torso, 0xc9a05c, 0.425, 0.66, 0.3, 0.09);
    const frame = mat(0x3a3a44, { metalness: 0.5, roughness: 0.4 });
    rbox(torso, 0.26, 0.34, 0.18, 0, 0.42, 0.3, frame, 0.03);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(0xfff2b8, { emissive: 0xffd23f, emissiveIntensity: 1.6 }));
    core.position.set(0, 0.42, 0.3); torso.add(core);
    for (const x of [-0.09, 0, 0.09]) rbox(torso, 0.025, 0.34, 0.02, x, 0.42, 0.4, frame, 0.008);
    cyl(torso, 0.05, 0.07, 0.06, 0, 0.62, 0.3, frame, 10);
  }
  if (id === 'tank') { // bonbonne d'oxygène avec robinet
    backpackStraps(torso, 0x24242e, 0.445, 0.7, 0.25, 0.09, 0.6);
    const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.62, 14), mat(B.color, { metalness: 0.4, roughness: 0.35 }));
    tl.position.set(0, 0.42, 0.3); tl.castShadow = true; torso.add(tl);
    cyl(torso, 0.16, 0.16, 0.05, 0, 0.14, 0.3, mat(0xffd23f), 14);
    cyl(torso, 0.04, 0.04, 0.12, 0, 0.78, 0.3, mat(0xc0c8d0, { metalness: 0.7 }), 8);
    cyl(torso, 0.02, 0.02, 0.14, 0.06, 0.84, 0.3, mat(0xc0c8d0, { metalness: 0.7 }), 8).rotation.z = Math.PI / 2;
  }
  if (id === 'tnt') { // baril de TNT avec mèche et bandes
    backpackStraps(torso, 0x24242e, 0.49, 0.72, 0.28, 0.11, 0.56);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.56, 14), mat(0x8a3a2a, { roughness: 0.7 }));
    bar.position.set(0, 0.48, 0.3); bar.castShadow = true; torso.add(bar);
    for (const y of [0.33, 0.61]) cyl(torso, 0.21, 0.21, 0.05, 0, y, 0.3, mat(0xd94848), 14);
    rbox(torso, 0.3, 0.16, 0.02, 0, 0.48, 0.51, mat(0xffe14d), 0.008);
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 6), mat(0x2a2a2a));
    fuse.rotation.z = 0.4; fuse.position.set(0.06, 0.82, 0.3); torso.add(fuse);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), mat(0xffb43a, { emissive: 0xff7a1a, emissiveIntensity: 1.8 }));
    spark.position.set(0.12, 0.89, 0.3); torso.add(spark);
  }
  if (id === 'champi') { // gros champignon à pois
    backpackStraps(torso, 0x24242e, 0.575, 0.62, 0.48, 0.15, 0.52, -0.24); // sangles sur le dôme
    cyl(torso, 0.11, 0.14, 0.42, 0, 0.28, 0.3, mat(0xf2e1a0), 10);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(B.color));
    cap.position.set(0, 0.48, 0.3); cap.castShadow = true; torso.add(cap);
    for (const [x, y, z] of [[-0.14, 0.62, 0.34], [0.12, 0.66, 0.28], [0, 0.7, 0.44], [-0.05, 0.64, 0.12]])
      sph(torso, 0.045, x, y, z, mat(0xfff6d0), 1, 0.7, 1);
  }
  if (id === 'plush') { // peluche ours accrochée dans le dos
    backpackStraps(torso, 0x24242e, 0.5, 0.68, 0.32, 0.11, 0.58); // sangles sur la tête de l'ours
    const fur = mat(B.color, { roughness: 0.9 });
    sph(torso, 0.2, 0, 0.5, 0.32, fur); // tête
    for (const sx of [-1, 1]) sph(torso, 0.08, sx * 0.17, 0.66, 0.32, fur); // oreilles
    rbox(torso, 0.3, 0.34, 0.2, 0, 0.22, 0.3, fur, 0.08); // corps
    for (const sx of [-1, 1]) { sph(torso, 0.07, sx * 0.18, 0.1, 0.32, fur); sph(torso, 0.065, sx * 0.15, 0.4, 0.3, fur); } // pattes
    sph(torso, 0.05, 0, 0.46, 0.5, mat(0xf2d0b0)); // museau
    for (const sx of [-1, 1]) sph(torso, 0.022, sx * 0.07, 0.55, 0.5, mat(0x1a1a22)); // yeux
  }
  if (id === 'boombox') { // boombox avec haut-parleurs et poignée
    backpackStraps(torso, 0xc9a05c, 0.40, 0.62, 0.28);
    rbox(torso, 0.52, 0.34, 0.18, 0, 0.42, 0.3, mat(B.color, { roughness: 0.6 }), 0.04);
    for (const x of [-0.14, 0.14]) {
      cyl(torso, 0.09, 0.09, 0.03, x, 0.42, 0.4, mat(0x111118), 14).rotation.x = Math.PI / 2;
      cyl(torso, 0.035, 0.035, 0.035, x, 0.42, 0.41, mat(0x39ff88, { emissive: 0x39ff88, emissiveIntensity: 0.8 }), 10).rotation.x = Math.PI / 2;
    }
    rbox(torso, 0.4, 0.04, 0.05, 0, 0.63, 0.3, mat(0x111118), 0.02);
    for (const sx of [-1, 1]) box(torso, 0.05, 0.1, 0.03, sx * 0.2, 0.57, 0.4, mat(0x111118));
  }
  if (id === 'aquarium') { // bocal en verre avec poisson rouge qui flotte
    backpackStraps(torso, 0x24242e, 0.585, 0.68, 0.34, 0.12, 0.52); // harnais métal
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), new THREE.MeshStandardMaterial({ color: 0x9fdfff, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.1 }));
    glass.position.set(0, 0.5, 0.36); torso.add(glass);
    const water = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), new THREE.MeshStandardMaterial({ color: 0x2a9fd6, transparent: true, opacity: 0.5, roughness: 0.2 }));
    water.position.set(0, 0.48, 0.36); torso.add(water);
    const fish = new THREE.Group();
    const fb = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 6), mat(0xff6b3d)); fb.rotation.z = Math.PI / 2; fish.add(fb);
    const ft = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 4), mat(0xff6b3d)); ft.rotation.z = -Math.PI / 2; ft.position.x = -0.1; fish.add(ft);
    fish.position.set(0, 0.5, 0.36); fish.userData.float = true; torso.add(fish);
    cyl(torso, 0.03, 0.03, 0.1, 0, 0.76, 0.36, mat(0xc0c8d0, { metalness: 0.6 }), 8);
  }
}
export function makePickaxe(id = 'default') {
  const g = new THREE.Group();
  // Aides de construction : segments effilés entre deux points (manches cintrés,
  // pointes courbes) — bien moins « boîtes » que des cubes empilés.
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const UP = V(0, 1, 0);
  const link = (a, b, r1, r2, m, seg = 10) => {
    const d = V(b.x - a.x, b.y - a.y, b.z - a.z), len = d.length();
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, seg), m);
    o.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    o.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / len));
    o.castShadow = true; g.add(o); return o;
  };
  const tube = (pts, rs, m) => { for (let i = 0; i < pts.length - 1; i++) link(pts[i], pts[i + 1], rs[i], rs[i + 1] ?? rs[rs.length - 1], m); };
  const wood = matR(0x8a5a32, 0.75), woodDark = matR(0x5a3a20, 0.8);
  const leather = matR(0x3a2a1a, 0.9), steel = matR(0x9aa4b0, 0.35, 0.85), gold = matR(0xffc400, 0.25, 0.85);
  if (id === 'hache') {
    // hache de bûcheron : manche en frêne légèrement cintré, fer en acier
    // à joue bombée et tranchant courbe, déporté sur le côté qui frappe
    tube([V(0, 0, 0.12), V(0, -0.01, -0.3), V(0, 0.01, -0.6), V(0, 0.02, -0.92)], [0.034, 0.042, 0.046, 0.038], wood);
    for (let i = 0; i < 3; i++) cyl(g, 0.046, 0.046, 0.045, 0, 0, 0.03 - i * 0.055, leather, 8).rotation.x = Math.PI / 2; // grip
    cyl(g, 0.054, 0.054, 0.1, 0, 0.01, -0.92, steel, 12).rotation.x = Math.PI / 2; // œil
    // fer : profil de lame extrudé mince, biseauté (tranchant)
    const shp = new THREE.Shape();
    shp.moveTo(0, 0.13);
    shp.quadraticCurveTo(0.2, 0.15, 0.32, 0.08);
    shp.quadraticCurveTo(0.41, 0.03, 0.42, -0.08);
    shp.quadraticCurveTo(0.43, -0.24, 0.38, -0.33);
    shp.quadraticCurveTo(0.2, -0.37, 0.05, -0.28);
    shp.quadraticCurveTo(0, -0.18, 0, 0.13);
    const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(shp, { depth: 0.024, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 }), steel);
    blade.rotation.set(0, Math.PI, -0.5); // lame du côté qui frappe, relevée vers l'avant
    blade.scale.set(0.92, 0.95, 1); // fer bien visible mais à distance du visage
    blade.position.set(-0.024, 0.01, -0.91); g.add(blade);
    box(g, 0.06, 0.08, 0.09, 0.045, 0.01, -0.91, steel); // talon opposé
  } else if (id === 'epee') {
    // lame néon : poignée gainée, pommeau, garde à quillons, lame effilée
    // plate avec arêtes néon vertes
    const dark = matR(0x1c1c24, 0.5, 0.3);
    const neon = matR(0x39ff88, 0.3, 0.2, { emissive: 0x39ff88, emissiveIntensity: 1.4 });
    cyl(g, 0.032, 0.032, 0.28, 0, 0, 0.0, dark, 10).rotation.x = Math.PI / 2; // poignée
    for (let i = 0; i < 5; i++) cyl(g, 0.037, 0.037, 0.02, 0, 0, -0.1 + i * 0.05, leather, 8).rotation.x = Math.PI / 2; // gainage
    sph(g, 0.05, 0, 0, 0.17, dark); // pommeau
    box(g, 0.32, 0.045, 0.055, 0, 0, -0.2, steel); // quillons
    // lame : effilée du fort à la pointe, section losange aplatie
    const bl = cyl(g, 0.075, 0.026, 0.74, 0, 0.028, -0.59, dark, 4);
    bl.rotation.x = Math.PI / 2; bl.scale.x = 0.3;
    const tp = cyl(g, 0.026, 0.004, 0.16, 0, 0.028, -1.04, dark, 4);
    tp.rotation.x = Math.PI / 2; tp.scale.x = 0.3;
    box(g, 0.012, 0.05, 0.74, 0.024, 0.028, -0.57, neon); // arêtes néon
    box(g, 0.012, 0.05, 0.74, -0.024, 0.028, -0.57, neon);
  } else if (id === 'marteau') {
    // marteau-tonnerre : grosse tête d'acier aux angles adoucis, faces de
    // frappe bombées, bandeaux runiques lumineux, manche gainé cuir
    const dark = matR(0x2a2a34, 0.5, 0.4);
    const hammerSteel = matR(0x6a7484, 0.3, 0.8);
    const glow = matR(0x5ad8ff, 0.2, 0.1, { emissive: 0x3ab8ff, emissiveIntensity: 1.2 });
    tube([V(0, 0, 0.1), V(0, 0, -0.45), V(0, 0, -0.8)], [0.036, 0.042, 0.046], dark); // manche
    for (let i = 0; i < 4; i++) cyl(g, 0.05, 0.05, 0.045, 0, 0, -0.01 - i * 0.06, leather, 10).rotation.x = Math.PI / 2; // grip
    rbox(g, 0.38, 0.26, 0.26, 0, -0.02, -0.97, hammerSteel, 0.05); // tête
    for (const sx of [-1, 1]) sph(g, 0.11, sx * 0.18, -0.02, -0.97, hammerSteel, 1, 1.15, 0.95); // faces bombées
    box(g, 0.4, 0.05, 0.065, 0, 0.09, -0.97, glow); // bandeau runique haut
    for (const sx of [-1, 1]) box(g, 0.02, 0.045, 0.18, sx * 0.195, 0, -0.97, glow); // runes latérales
    sph(g, 0.045, 0, -0.16, -0.97, glow); // cœur électrique
  } else if (id === 'faux') {
    // faux lunaire : long manche sombre cintré, lame croissant très effilée
    // qui balaie le côté gauche et revient vers le porteur
    const dark = matR(0x242432, 0.45, 0.5);
    const bladeM = matR(0xcfe0ff, 0.15, 0.55, { emissive: 0x6a8aff, emissiveIntensity: 0.8 });
    tube([V(0, 0, 0.18), V(0, 0, -0.5), V(0.02, 0.04, -0.95)], [0.03, 0.035, 0.04], dark);
    cyl(g, 0.038, 0.038, 0.14, 0.05, 0, -0.3, leather, 8).rotation.x = Math.PI / 2; // poignée basse
    cyl(g, 0.05, 0.05, 0.07, 0.01, 0.04, -0.88, matR(0xffc400, 0.25, 0.85), 10).rotation.x = Math.PI / 2; // collier
    // lame croissant : chaîne effilée partant du sommet du manche, balaie
    // l'avant puis revient vers l'extérieur (profil de faux vu de dessus)
    tube([V(0.02, 0.04, -0.9), V(0.05, 0.05, -1.12), V(0.14, 0.04, -1.28), V(0.28, 0, -1.34), V(0.4, -0.05, -1.3)], [0.04, 0.036, 0.03, 0.02, 0.004], bladeM);
  } else if (id === 'sucre') {
    // sucre d'orge : canne en J laquée, rayures rouges en spirale
    const caneM = mat(0xfff6f0, { roughness: 0.12 });
    const redM = mat(0xff2e4d, { roughness: 0.2 });
    // tige droite (grip à l'origine)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.92, 14), caneM);
    shaft.rotation.x = Math.PI / 2; shaft.position.set(0, 0, -0.44); g.add(shaft);
    // rayures diagonales enroulées autour de la tige
    for (let i = 0; i < 7; i++) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.09, 14, 1, true), redM);
      st.rotation.x = Math.PI / 2 + 0.4; st.position.set(0, 0, -0.08 - i * 0.13); g.add(st);
    }
    // crosse en J au sommet (demi-tore, ventre vers le haut)
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.058, 10, 14, Math.PI), caneM);
    hook.rotation.x = -Math.PI / 2; hook.position.set(0.17, 0, -0.86); g.add(hook);
    // rayures rouges sur la crosse (segments d'arc)
    for (const a of [0.3, 1.2, 2.1]) {
      const seg = new THREE.TorusGeometry(0.17, 0.062, 10, 6, 0.5);
      seg.rotateZ(a); seg.rotateX(-Math.PI / 2);
      const sm = new THREE.Mesh(seg, redM); sm.position.set(0.17, 0, -0.86); g.add(sm);
    }
    // boule blanche au bout libre de la crosse
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), caneM);
    knob.position.set(0.34, 0, -0.86); g.add(knob);
  } else if (id === 'os') {
    // fémur : os long tenu par la diaphyse — tête fémorale au bout avant
    // (côté qui frappe), double condyle qui dépasse sous la main
    const boneM = matR(0xf2ead8, 0.6);
    tube([V(0, 0, 0.16), V(0, 0, 0.0), V(0, -0.02, -0.4), V(0, -0.05, -0.78)], [0.038, 0.042, 0.046, 0.05], boneM);
    // col + tête fémorale (grosse boule du bout avant, dégagée de l'épaule)
    link(V(0, 0, -0.78), V(0.04, 0.03, -0.9), 0.05, 0.062, boneM);
    sph(g, 0.085, 0.06, 0.04, -0.94, boneM);
    sph(g, 0.055, -0.03, 0.0, -0.8, boneM); // grand trochanter (bosse)
    // condyles doubles sous la main
    sph(g, 0.062, 0.045, 0, 0.23, boneM);
    sph(g, 0.062, -0.045, 0, 0.23, boneM);
  } else if (id === 'banane') {
    // banane explosive : tenue par la tige (grip à l'origine), la banane se
    // courbe au-dessus de la main comme une lame — mèche allumée au sommet
    const R = 0.52;
    const bg = new THREE.TorusGeometry(R, 0.1, 10, 20, 2.1);
    bg.rotateZ(Math.PI / 2); bg.rotateY(Math.PI); bg.rotateX(Math.PI / 2);
    // l'arc part de la main (0,0,0) et monte vers la tête de l'outil (-z)
    const bn = new THREE.Mesh(bg, mat(0xffd23f, { roughness: 0.45 }));
    bn.position.set(0, 0.02, -R); g.add(bn);
    // tige marron qui dépasse sous la main
    const stem = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), mat(0x6b4a2a));
    stem.rotation.x = Math.PI / 2; stem.position.set(0, 0.02, 0.1); g.add(stem);
    // pointe marron au sommet + mèche + étincelle (banane explosive)
    const end = new THREE.Vector3(0.87 * R, 0.02, -1.5 * R);
    const dir = new THREE.Vector3(0.87, 0, -0.5).normalize();
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 6), mat(0x6b4a2a));
    tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    tip.position.copy(end).addScaledVector(dir, 0.07); g.add(tip);
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 5), mat(0x3a2a1a));
    fuse.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    fuse.position.copy(end).addScaledVector(dir, 0.2); g.add(fuse);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0xffb43a, { emissive: 0xff7a1a, emissiveIntensity: 1.8 }));
    spark.position.copy(end).addScaledVector(dir, 0.28); g.add(spark);
  } else if (id === 'glace') {
    // piolet polaire : manche isolé, tête acier avec pic courbe d'un côté et
    // lame plate de l'autre, cristaux de givre lumineux
    const shaftM = matR(0x3a4250, 0.5, 0.3);
    const iceM = matR(0xbfeaff, 0.15, 0.3, { emissive: 0x4ab8ff, emissiveIntensity: 0.5 });
    tube([V(0, 0, 0.1), V(0, 0, -0.5), V(0, 0, -0.83)], [0.032, 0.038, 0.042], shaftM);
    for (let i = 0; i < 4; i++) cyl(g, 0.046, 0.046, 0.035, 0, 0, -0.02 - i * 0.05, leather, 8).rotation.x = Math.PI / 2; // grip
    cyl(g, 0.056, 0.056, 0.07, 0, 0, -0.85, steel, 10).rotation.x = Math.PI / 2; // œil
    // pic courbe (côté qui frappe) : s'écarte peu et file vers l'avant/haut
    tube([V(-0.03, 0, -0.85), V(-0.1, 0.01, -0.97), V(-0.18, -0.02, -1.1), V(-0.22, -0.06, -1.2)], [0.042, 0.036, 0.022, 0.004], iceM);
    box(g, 0.19, 0.02, 0.09, 0.12, 0.01, -0.86, iceM); // lame-adze plate de l'autre côté
    // cristaux de givre accrochés au manche
    for (const [x, y, z, s] of [[0.08, 0.09, -0.6, 1], [-0.09, -0.06, -0.7, 0.7]]) {
      const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.08 * s, 0), iceM); cr.position.set(x, y, z); g.add(cr);
    }
  } else if (id === 'cle') {
    // clé à molette géante : manche plat d'acier, tête en C avec vis de
    // réglage moletée — les mâchoires s'ouvrent vers l'avant
    const brightSteel = matR(0xc8d0da, 0.3, 0.45); // acier clair, lisible sans éclairage d'ambiance
    box(g, 0.055, 0.11, 0.9, 0, 0, -0.35, brightSteel); // manche plat z [-0.8, +0.1]
    sph(g, 0.09, 0, 0, 0.14, brightSteel, 1, 1.5, 0.5); // pommeau aplati au bout du manche
    rbox(g, 0.1, 0.28, 0.22, 0, 0.03, -0.95, brightSteel, 0.03); // bloc de tête
    const jaw = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.048, 8, 14, 4.4), brightSteel);
    jaw.position.set(0, 0.05, -0.95); jaw.rotation.y = Math.PI / 2; g.add(jaw); // mâchoire en C
    box(g, 0.05, 0.2, 0.06, 0, -0.11, -0.95, brightSteel); // mâchoire mobile
    cyl(g, 0.055, 0.055, 0.06, 0, -0.03, -0.82, brightSteel, 12).rotation.z = Math.PI / 2; // vis moletée
  } else if (id === 'flambeau') {
    // flambeau : manche de bois cerclé, coupelle évasée vers l'avant,
    // flamme à trois cœurs qui pointe vers le haut (axe -z de l'outil)
    tube([V(0, 0, 0.14), V(0, 0, -0.3), V(0, 0, -0.6)], [0.03, 0.036, 0.042], wood);
    for (const z of [-0.04, -0.3]) cyl(g, 0.05, 0.05, 0.03, 0, 0, z, steel, 10).rotation.x = Math.PI / 2; // cerclages
    cyl(g, 0.1, 0.15, 0.16, 0, 0.04, -0.7, steel, 14).rotation.x = Math.PI / 2; // coupelle évasée vers l'avant
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 10), matR(0xffb43a, 0.4, 0, { emissive: 0xff7a1a, emissiveIntensity: 1.6 }));
    fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.05, -0.88); g.add(fl);
    const fl2 = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.2, 10), matR(0xfff6d0, 0.4, 0, { emissive: 0xffe98a, emissiveIntensity: 1.8 }));
    fl2.rotation.x = -Math.PI / 2; fl2.position.set(0, 0.05, -0.93); g.add(fl2);
    sph(g, 0.03, 0, 0.05, -0.78, matR(0xffd23f, 0.3, 0, { emissive: 0xffa03a, emissiveIntensity: 1.4 })); // braise
  } else if (id === 'pelle') {
    // pelle du roi : manche de frêne à poignée en T, fer doré bombé à
    // pointe arrondie — la face du fer regarde vers l'avant
    tube([V(0, 0, 0.1), V(0, 0, -0.8)], [0.028, 0.036], wood);
    box(g, 0.24, 0.045, 0.045, 0, 0.02, 0.14, woodDark); // poignée en T
    cyl(g, 0.05, 0.05, 0.08, 0, 0, -0.83, gold, 10).rotation.x = Math.PI / 2; // douille
    // fer : profil de pelle extrudé (arrondi en haut, pointe en bas),
    // face tournée vers l'avant, bords biseautés
    const sp = new THREE.Shape();
    sp.moveTo(-0.19, 0.08);
    sp.quadraticCurveTo(0, 0.12, 0.19, 0.08);
    sp.quadraticCurveTo(0.23, -0.1, 0.1, -0.26);
    sp.quadraticCurveTo(0, -0.42, -0.1, -0.26);
    sp.quadraticCurveTo(-0.23, -0.1, -0.19, 0.08);
    const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(sp, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 }), gold);
    blade.rotation.z = Math.PI; // la pointe du fer retombe vers le sol
    blade.position.set(0, -0.03, -0.92); g.add(blade); // z ∈ [-0.89, -0.96]
    box(g, 0.03, 0.42, 0.045, 0, 0.14, -0.93, gold); // rigidôlage central (dos du fer)
    box(g, 0.32, 0.035, 0.05, 0, -0.12, -0.9, gold); // marche-pied (replié du fer)
  } else if (id === 'katana') {
    // katana rose néon : tsuka gainée à losanges croisés, tsuba circulaire,
    // lame courbée (arc de tore aplati) à tranchant néon
    const dark = matR(0x1a1030, 0.5, 0.2);
    const wrap = matR(0xff2e7d, 0.6, 0);
    const edge = matR(0xffd6ec, 0.2, 0.3, { emissive: 0xff2e7d, emissiveIntensity: 1.4 });
    // poignée (tsuka) : losanges de soie croisés
    cyl(g, 0.032, 0.032, 0.3, 0, 0, 0.02, dark, 8).rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) { const b = box(g, 0.014, 0.058, 0.05, 0, 0, -0.1 + i * 0.052, wrap); b.rotation.z = 0.6; }
    sph(g, 0.042, 0, 0, 0.19, dark, 1, 1, 0.8); // pommeau (kashira)
    cyl(g, 0.055, 0.055, 0.025, 0, 0, -0.14, matR(0x2a2a3a, 0.35, 0.6), 14).rotation.x = Math.PI / 2; // tsuba
    // lame courbe : arc de tore aplati, corde le long de l'axe, bombé léger
    const bg = new THREE.TorusGeometry(2.6, 0.05, 8, 20, 0.42);
    bg.rotateX(Math.PI / 2); // corde le long de z
    bg.rotateZ(-Math.PI / 2); // bombé vers -y (le tranchant)
    const blade = new THREE.Mesh(bg, matR(0x3a3a4e, 0.3, 0.5));
    blade.scale.set(0.55, 1, 1); // lame plate (fine en x)
    blade.position.set(0, 2.52, -0.68); g.add(blade); // z ∈ [-1.2, -0.14]
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.13, 8), edge);
    tip.rotation.x = -Math.PI / 2; tip.position.set(0, -0.05, -1.26); tip.scale.x = 0.6; g.add(tip); // pointe (kissaki)
    // tranchant néon : suit le bombé de la lame en trois segments
    box(g, 0.016, 0.045, 0.4, 0, -0.034, -0.32, edge);
    box(g, 0.016, 0.045, 0.4, 0, -0.066, -0.7, edge);
    box(g, 0.016, 0.045, 0.4, 0, -0.034, -1.08, edge);
  } else if (id === 'raquette') {
    // raquette de match : manche long avec grip néon, jonc en V, tamis ovale
    // incliné vers l'avant (plus lisible de trois quarts, pas un plateau plat)
    const dark = mat(0x232328, { roughness: 0.5 });
    const neon = mat(0x39ff88, { emissive: 0x1fc46a, emissiveIntensity: 0.7 });
    box(g, 0.055, 0.055, 0.85, 0, 0, -0.38, dark); // manche z [-0.805, +0.045]
    for (let i = 0; i < 4; i++) box(g, 0.063, 0.063, 0.03, 0, 0, -0.05 - i * 0.08, neon); // grip
    // jonc en V : deux branches du haut du manche vers le bas du cadre
    for (const sx of [-1, 1]) { const v = box(g, 0.03, 0.03, 0.34, sx * 0.1, 0, -0.93, dark); v.rotation.y = sx * 0.32; }
    // tête : cadre ovale néon + cordage croisé, incliné
    const head = new THREE.Group(); head.position.set(0, 0.06, -1.1); head.rotation.x = -0.3; g.add(head);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 10, 26), neon);
    frame.scale.set(0.85, 1.12, 1); head.add(frame);
    const strM = mat(0xf2fff6, { emissive: 0xffffff, emissiveIntensity: 0.12 });
    for (let i = -3; i <= 3; i++) box(head, 0.012, 0.56, 0.012, i * 0.072, 0, 0, strM);
    for (let i = -2; i <= 2; i++) box(head, 0.42, 0.012, 0.012, 0, i * 0.11, 0, strM);
  } else if (id === 'guitare') {
    // guitare foudre : tenue par le manche près de la caisse — la caisse part
    // vers l'avant (c'est elle qui frappe), la tête dépasse sous la main.
    // Corps fin tourné vers l'avant, micros, cordes et éclair néon.
    const bodyM = matR(0xb3122e, 0.35, 0.1);
    const darkM = matR(0x1a1a22, 0.5, 0.2);
    const strM = matR(0xdfe4ee, 0.3, 0.6);
    // manche : de la main vers la caisse (z ∈ [-0.7, +0.1]) — la caisse part
    // au-dessus de l'épaule, loin du corps, la tête dépasse sous la main
    box(g, 0.06, 0.05, 0.8, 0, 0.02, -0.3, darkM);
    for (let i = 0; i < 5; i++) box(g, 0.066, 0.056, 0.03, 0, 0.02, -0.12 - i * 0.11, matR(0x2a2a3a, 0.7, 0)); // repères de touche
    // caisse au bout du manche (z ∈ [-0.63, -1.01]), face tournée vers l'avant
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.08, 22), bodyM);
    body.rotation.x = Math.PI / 2; body.position.set(0, 0.03, -0.82); g.add(body);
    const cut = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), darkM);
    cut.rotation.x = Math.PI / 2; cut.position.set(0.07, -0.08, -0.92); g.add(cut); // pan coupé
    // tête + mécaniques sous la main
    box(g, 0.09, 0.045, 0.12, 0, 0.03, 0.15, darkM);
    for (const sx of [-1, 1]) cyl(g, 0.018, 0.018, 0.04, sx * 0.05, 0.05, 0.19, steel, 6);
    // micros + chevalet + éclair
    for (const z of [-0.7, -0.88]) box(g, 0.15, 0.035, 0.045, 0, 0.08, z, steel);
    box(g, 0.13, 0.03, 0.04, 0, 0.075, -0.97, darkM);
    const boltM = matR(0x39ff88, 0.3, 0, { emissive: 0x1fc46a, emissiveIntensity: 1.2 });
    for (const [x, y, z] of [[0.02, 0.02, -0.8], [0.07, -0.03, -0.85], [0.05, -0.08, -0.9]]) box(g, 0.014, 0.014, 0.09, x, y, z, boltM);
    // cordes du sillet au chevalet
    for (const x of [-0.045, -0.015, 0.015, 0.045]) box(g, 0.007, 0.007, 1.05, x, 0.085, -0.43, strM);
  } else if (id === 'trident') {
    // trident des abysses : hampe bleu profond lisible, collier doré, trois
    // fourches courbes — la centrale plus haute (silhouette de trident)
    const steel = mat(0x2a6a94, { metalness: 0.55, roughness: 0.35 });
    box(g, 0.055, 0.055, 1.1, 0, 0, -0.33, steel); // hampe z [-0.88, +0.22]
    const gold = mat(0xffc400, { metalness: 0.85, roughness: 0.25 });
    cyl(g, 0.1, 0.13, 0.09, 0, 0, -0.92, gold, 12).rotation.x = Math.PI / 2;
    const tipC = mat(0x5ad8ff, { emissive: 0x2ab8ff, emissiveIntensity: 1.3, metalness: 0.4, roughness: 0.2 });
    // fourche centrale (la plus haute)
    box(g, 0.05, 0.05, 0.46, 0, 0.04, -1.15, steel);
    const ct = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.26, 8), tipC);
    ct.rotation.x = -Math.PI / 2; ct.position.set(0, 0.04, -1.51); g.add(ct);
    // fourches latérales : aile courbe (extérieur puis haut) + prong droit
    for (const sx of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.042, 8, 12, Math.PI / 2), steel);
      wing.geometry.rotateZ(Math.PI / 2); wing.geometry.rotateX(-Math.PI / 2);
      wing.scale.x = sx; wing.position.set(sx * 0.28, 0.03, -0.92); g.add(wing);
      box(g, 0.045, 0.045, 0.3, sx * 0.28, 0.03, -1.28, steel);
      const st = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 6), tipC);
      st.rotation.x = -Math.PI / 2; st.position.set(sx * 0.28, 0.03, -1.53); g.add(st);
    }
  } else {
    // pioche standard : manche en frêne cintré et gainé, tête d'acier à
    // deux pointes recourbées qui plongent vers l'avant (le coup part de la pointe)
    tube([V(0, 0, 0.14), V(0, 0, 0.02), V(0, 0, -0.2), V(0, 0, -0.55), V(0, 0, -0.92)], [0.034, 0.034, 0.04, 0.044, 0.028], wood);
    for (let i = 0; i < 3; i++) cyl(g, 0.048, 0.048, 0.045, 0, 0, 0.03 - i * 0.055, leather, 8).rotation.x = Math.PI / 2; // grip
    cyl(g, 0.06, 0.06, 0.1, 0, 0, -0.88, steel, 12).rotation.x = Math.PI / 2; // œil métallique
    for (const sx of [-1, 1]) {
      // pointe courbe : s'écarte peu de l'œil et file haut vers l'avant
      // (les pointes passent au-dessus de la tête, jamais devant le visage)
      tube([V(0, 0.01, -0.88), V(sx * 0.14, 0.03, -0.98), V(sx * 0.28, 0, -1.1), V(sx * 0.36, -0.07, -1.18)], [0.05, 0.044, 0.028, 0.004], steel);
    }
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
    case 'clap': { // ovation : mains qui se rejoignent devant, petit rebond
      const cl = Math.abs(s(t * 8));
      P.shR.rotation.set(0.75, 0, 0.2); P.shL.rotation.set(0.75, 0, -0.2);
      P.elR.rotation.set(1.0 + cl * 0.4, 0, 0.12); P.elL.rotation.set(1.0 + cl * 0.4, 0, -0.12);
      P.head.rotation.x = 0.12; P.torso.rotation.y = s(t * 8) * 0.06;
      P.hipL.rotation.set(0, 0, 0); P.hipR.rotation.set(0, 0, 0);
      P.kneeL.rotation.x = P.kneeR.rotation.x = -0.1; y = cl * 0.02; break;
    }
    case 'zombie': { // marche zombie : bras tendus, tête penchée, pas traînants
      const w = s(t * 2.5);
      P.shR.rotation.set(1.5, 0, 0.1); P.shL.rotation.set(1.5, 0, -0.1);
      P.elR.rotation.set(0.04, 0, 0); P.elL.rotation.set(0.04, 0, 0);
      P.head.rotation.set(0.08, 0.1, 0.25); P.torso.rotation.set(0.08, w * 0.1, 0);
      P.hipL.rotation.set(Math.max(0, w) * 0.45, 0, 0); P.hipR.rotation.set(Math.max(0, -w) * 0.45, 0, 0);
      P.kneeL.rotation.x = -0.05 - Math.max(0, w) * 0.7; P.kneeR.rotation.x = -0.05 - Math.max(0, -w) * 0.7;
      y = Math.abs(w) * 0.02; break;
    }
    case 'squat': { // squats : descente sur les talons, bras tendus devant
      const d = (1 - c(t * 4)) / 2;
      P.shR.rotation.set(0.55 + d * 0.55, 0, 0.25); P.shL.rotation.set(0.55 + d * 0.55, 0, -0.25);
      P.elR.rotation.set(1.25, 0, 0); P.elL.rotation.set(1.25, 0, 0);
      P.torso.rotation.x = d * 0.25; P.head.rotation.x = -d * 0.1;
      P.hipL.rotation.set(-d * 1.45, 0, 0); P.hipR.rotation.set(-d * 1.45, 0, 0);
      P.kneeL.rotation.x = P.kneeR.rotation.x = -0.1 - d * 2.1;
      y = -d * 0.48; break;
    }
    case 'boxe': { // jab-jab : coups de poing alternés, garde haute
      const a = s(t * 10), jr = Math.max(0, a), jl = Math.max(0, -a);
      P.shR.rotation.set(0.45 + jr * 1.05, 0, 0.15); P.shL.rotation.set(0.45 + jl * 1.05, 0, -0.15);
      P.elR.rotation.set(1.35 - jr * 1.25, 0, 0); P.elL.rotation.set(1.35 - jl * 1.25, 0, 0);
      P.torso.rotation.y = a * 0.22; P.head.rotation.y = -a * 0.15;
      P.hipL.rotation.set(0.05, 0, -0.06); P.hipR.rotation.set(0.05, 0, 0.06);
      P.kneeL.rotation.x = P.kneeR.rotation.x = -0.18;
      y = Math.abs(s(t * 20)) * 0.015; break;
    }
    case 'pirouette': { // pirouette : bras en couronne, sur les pointes, buste qui tourne
      const sp = s(t * 6);
      P.shR.rotation.set(0.3, 0, 2.45); P.shL.rotation.set(0.3, 0, -2.45);
      P.elR.rotation.set(0, 0, 0.55); P.elL.rotation.set(0, 0, -0.55);
      P.torso.rotation.y = sp * 0.45; P.head.rotation.y = sp * 0.3;
      P.hipL.rotation.set(0.15, 0, -0.28); P.hipR.rotation.set(0.15, 0, 0.28);
      P.kneeL.rotation.x = P.kneeR.rotation.x = -1.35;
      y = 0.06 + Math.abs(sp) * 0.02; break;
    }
    case 'kungfu': { // kata du dragon : blocages et coups tranchants, sur les gardes
      const k = Math.floor(t * 3) % 4, f = Math.min(1, (t * 3) % 1 * 3);
      if (k === 0) { P.shR.rotation.set(0.4 + f * 1.2, 0, 0.9); P.elR.rotation.set(1.6 - f * 1.4, 0, 0); P.shL.rotation.set(0.4, 0, -0.35); P.elL.rotation.set(1.3, 0, 0); }
      else if (k === 1) { P.shL.rotation.set(0.4 + f * 1.2, 0, -0.9); P.elL.rotation.set(1.6 - f * 1.4, 0, 0); P.shR.rotation.set(0.4, 0, 0.35); P.elR.rotation.set(1.3, 0, 0); }
      else if (k === 2) { P.shR.rotation.set(1.3, 0, 0.2); P.shL.rotation.set(1.3, 0, -0.2); P.elR.rotation.set(0.1, 0, 0); P.elL.rotation.set(0.1, 0, 0); }
      else { P.shR.rotation.set(0.2, 0, 1.1); P.shL.rotation.set(0.2, 0, -1.1); P.elR.rotation.set(1.7, 0, 0); P.elL.rotation.set(1.7, 0, 0); }
      P.torso.rotation.y = [0.35, -0.35, 0, 0][k]; P.head.rotation.y = [0.3, -0.3, 0, 0][k];
      P.hipL.rotation.set(0.12, 0, -0.22); P.hipR.rotation.set(0.12, 0, 0.22);
      P.kneeL.rotation.x = P.kneeR.rotation.x = -0.4;
      y = k === 3 ? 0.03 : 0; break;
    }
    case 'corde': { // corde à sauter : petits sauts, poignets qui tournent
      const ph = t * 9, hop = Math.abs(c(ph)), arm = s(ph);
      P.shR.rotation.set(0.25, 0, 0.85); P.shL.rotation.set(0.25, 0, -0.85);
      P.elR.rotation.set(0.7, 0, 0.25 + arm * 0.2); P.elL.rotation.set(0.7, 0, -0.25 + arm * 0.2);
      P.torso.rotation.set(0.12, 0, 0); P.head.rotation.x = 0.05;
      P.hipL.rotation.set(0.1 + (1 - hop) * 0.5, 0, 0); P.hipR.rotation.set(0.1 + (1 - hop) * 0.5, 0, 0);
      P.kneeL.rotation.x = P.kneeR.rotation.x = -0.15 - (1 - hop) * 0.9;
      y = hop * 0.14; break;
    }
    case 'airguitar': { // air guitar : gratte frénétique, jambe qui pompe
      const strum = s(t * 16), lean = 0.35 + s(t * 2) * 0.1;
      P.shR.rotation.set(0.5 - strum * 0.35, 0, 0.5); P.elR.rotation.set(1.5 + strum * 0.3, 0, 0);
      P.shL.rotation.set(0.9, 0, -0.75); P.elL.rotation.set(1.35, 0, -0.2);
      P.torso.rotation.set(0.18, -0.4, -lean * 0.4); P.head.rotation.set(-0.1, -0.3, s(t * 4) * 0.1);
      P.hipL.rotation.set(0.15, 0, -0.2); P.hipR.rotation.set(0.15, 0, 0.2);
      P.kneeL.rotation.x = -0.35 + strum * 0.12; P.kneeR.rotation.x = -0.35 - strum * 0.12;
      y = Math.abs(strum) * 0.02; break;
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

