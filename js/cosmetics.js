// Cosmetics catalog + procedural character / pickaxe / glider / backpack models + emote poses
import * as THREE from 'three';
import { SQUELETTE } from './squelette.js';

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
const SPHERE = new THREE.SphereGeometry(1, 16, 12);
const DOME = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
function part(g, geometry, m, x, y, z, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(geometry, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; g.add(o); return o;
}
export function rbox(g, w, h, d, x, y, z, m, r = Math.min(w, h, d) * 0.3) { return part(g, roundedBoxGeo(w, h, d, r), m, x, y, z); }
function dome(g, r, x, y, z, m, sx = 1, sy = 1, sz = 1) { return part(g, DOME, m, x, y, z, r * sx, r * sy, r * sz); }
// Sphère / cylindre / cône : formes organiques pour un rendu moins cubique.
export function sph(g, r, x, y, z, m, sx = 1, sy = 1, sz = 1) { return part(g, SPHERE, m, x, y, z, r * sx, r * sy, r * sz); }
export function cyl(g, rt, rb, h, x, y, z, m, seg = 12) {
  return part(g, geo(`cy${r3(rt)},${r3(rb)},${r3(h)},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), m, x, y, z);
}

// Volume de tête de référence (0,4 × 0,5 × 0,42 m) sur lequel sont dessinées coiffes et
// cheveux ; makeCharMesh le ramène à la taille de la tête du mannequin.
const HEAD_RINGS = [
  [0.0, 0.05, 0.14, 0.02], [0.035, 0.1, 0.185, 0.07], [0.1, 0.152, 0.2, 0.15], [0.18, 0.182, 0.205, 0.19],
  [0.26, 0.196, 0.205, 0.215], [0.34, 0.2, 0.198, 0.222], [0.42, 0.18, 0.168, 0.2], [0.475, 0.12, 0.11, 0.14], [0.5, 0.03, 0.03, 0.04],
];
const HEAD_N = 2.25;
// head : repère des coiffes (0,4 × 0,5 × 0,42 m) ; bare : tête du mannequin (visage, cheveux)
function buildHead(head, s, bare) {
  const hat = mat(s.hat), dark = mat(0x14141c);
  const acc = s.accent !== undefined ? mat(s.accent, { emissive: s.accent, emissiveIntensity: 0.6 }) : hat;
  const st = s.style;
  if (st !== 'knight' && st !== 'balaclava') buildFace(bare, s);
  if (st === 'astro') {
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
  }
  // cheveux : coque ajustée au crâne qui dégage le front et descend sur la nuque, mèches en volume
  const scalp = (m, front = 0.262, back = 0.1) => part(bare, sqHeadShell(`h${front},${back}`, hairline(front, back), 0.013), m, 0, 0, 0);
  const hairC = s.hair || 0x2f2318;
  if (st === 'none' || st === 'cap' || st === 'capback' || st === 'ears' || st === 'crown' || st === 'mohawk' || s.hair) {
    const hairM = mat(hairC, { roughness: 0.9 });
    st === 'mohawk' ? scalp(hairM, 0.285, 0.24) : scalp(hairM);
    if (st === 'none') for (const [x, rz] of [[-0.09, 0.5], [0.0, 0.2], [0.09, -0.35]]) { // mèches sur le front
      const m = sph(head, 0.075, x, 0.5, -0.1, hairM, 1, 0.55, 1.5); m.rotation.set(-0.5, 0, rz);
    }
  }
  else if (['fedora', 'peaked', 'tricorn', 'straw', 'beanie', 'helmet'].includes(st)) scalp(mat(hairC, { roughness: 0.9 }), 0.28, 0.125);
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
    scalp(mat(0x3a0a14));
    cyl(head, 0.012, 0.05, 0.32, -0.18, 0.62, 0, acc, 10).rotation.z = 0.4;
    cyl(head, 0.012, 0.05, 0.32, 0.18, 0.62, 0, acc, 10).rotation.z = -0.4;
  }
  if (st === 'straw') {
    cyl(head, 0.38, 0.4, 0.04, 0, 0.47, 0, hat, 20);
    cyl(head, 0.19, 0.2, 0.14, 0, 0.55, 0, hat, 16);
    cyl(head, 0.203, 0.203, 0.04, 0, 0.51, 0, mat(0xd94848), 16);
  }
  if (st === 'peaked') { // casquette d'officier : calotte large, bandeau, visière vernie, insigne
    const band = mat(s.accent || 0xc9a227, { metalness: 0.6, roughness: 0.3 });
    cyl(head, 0.255, 0.235, 0.12, 0, 0.47, 0.0, hat, 20).scale.z = 1.08;
    cyl(head, 0.32, 0.27, 0.07, 0, 0.56, 0.01, hat, 20).scale.z = 1.1; // plateau évasé
    cyl(head, 0.258, 0.258, 0.04, 0, 0.45, 0, band, 20).scale.z = 1.09;
    const vis = rbox(head, 0.3, 0.025, 0.14, 0, 0.42, -0.27, mat(0x050507, { metalness: 0.5, roughness: 0.15 }), 0.01); vis.rotation.x = 0.28;
    sph(head, 0.045, 0, 0.5, -0.27, band, 1, 1, 0.4);
    sph(head, 0.026, 0, 0.5, -0.29, mat(0xc0141e, { emissive: 0x700008, emissiveIntensity: 0.5 }), 1, 1, 0.5);
  }
  if (st === 'balaclava') { // cagoule tactique + lunettes de vision nocturne relevées
    const fab = mat(s.hat, { roughness: 1 });
    part(bare, sqHeadShell('cagoule', () => 0.06, 0.007), fab, 0, 0, 0);
    part(bare, sqFacePatch(0.172, 0.216, 1.3, 0.014), mat(0x0d1a14, { metalness: 0.4, roughness: 0.15, emissive: 0x0b3a1c, emissiveIntensity: 0.5, side: THREE.DoubleSide }), 0, 0, 0);
    rbox(head, 0.2, 0.06, 0.07, 0, 0.47, -0.2, mat(0x22252b, { metalness: 0.5, roughness: 0.4 }), 0.02).rotation.x = -0.5; // support de casque
    for (const sx of [-1, 1]) cyl(head, 0.032, 0.036, 0.09, sx * 0.05, 0.53, -0.23, mat(0x1a1d22, { metalness: 0.5, roughness: 0.35 }), 10).rotation.x = -1.1; // tubes relevés
    for (const sx of [-1, 1]) cyl(head, 0.07, 0.07, 0.05, sx * 0.22, 0.25, 0.02, mat(0x202329, { roughness: 0.6 }), 12).rotation.z = Math.PI / 2; // casque radio
    rbox(head, 0.03, 0.22, 0.03, 0.21, 0.4, 0.02, mat(0x202329), 0.01).rotation.z = -0.15;
  }
  if (st === 'fedora') {
    cyl(head, 0.3, 0.3, 0.03, 0, 0.47, 0.01, hat, 20).scale.z = 0.95;
    cyl(head, 0.18, 0.21, 0.2, 0, 0.58, 0.01, hat, 16).scale.z = 1.1;
    cyl(head, 0.212, 0.212, 0.045, 0, 0.51, 0.01, mat(0x2c313c), 16).scale.z = 1.1;
  }
  if (s.extra === 'visor') part(bare, sqFacePatch(0.168, 0.224, 1.45, 0.02), mat(s.accent || s.hat, { emissive: s.accent || s.hat, emissiveIntensity: 1.2, side: THREE.DoubleSide }), 0, 0, 0);
  if (s.extra === 'shades') part(bare, sqFacePatch(0.174, 0.214, 1.35, 0.017), mat(0x050505, { metalness: 0.8, roughness: 0.1, side: THREE.DoubleSide }), 0, 0, 0);
  if (s.extra === 'mask') part(bare, sqFacePatch(0.058, 0.162, 1.75, 0.013), mat(s.shirt, { side: THREE.DoubleSide }), 0, 0, 0);
}
// Bretelles partagées : deux sangles visibles dans le dos, plaquées sur la face
// arrière du sac (comme un vrai sac à dos porté).
function backpackStraps(torso, color, z, yTop = 0.72, yBot = 0.3, sx = 0.15, ry = 0, rx = 0.05) {
  const m = mat(color, { roughness: 0.7 });
  const h = Math.max(0.2, yTop - yBot), cy = (yTop + yBot) / 2;
  for (const s of [-1, 1]) {
    const b = rbox(torso, 0.06, h, 0.03, s * sx, cy, z, m, 0.012); // sangle sur le sac
    b.rotation.x = rx; b.rotation.y = s * ry; // ry : épouse les objets ronds
  }
}
// Sac à dos seul (vignettes)
export function makeBackpack(id) {
  const g = new THREE.Group(); buildBackpack(g, id);
  return g;
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
// Géométrie du bras du mannequin (côté droit, repère du perso) : épaule, main au repos
// depuis l'épaule, et poignée du parachute à portée exacte de la main, bras tendu.
export const ARM = (() => {
  const { shR, elR, hand } = SQUELETTE.pivots;
  const sh = [shR[0], SQUELETTE.torsoY + shR[1], shR[2]], reach = [elR[0] + hand[0], elR[1] + hand[1]];
  const L = Math.hypot(reach[0], reach[1]);
  return { sh, reach, grip: [sh[0] + L * 0.8, sh[1] + L * 0.6, sh[2]] };
})();
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
  for (const sgn of [1, -1]) line(0, 2.05, 0, sgn * 0.17, ARM.sh[1] + 0.1, ARM.sh[2]);
  // poignées de commande : deux risers qui partent du harnais vers l'extérieur,
  // exactement là où les mains du personnage viennent s'accrocher (ARM.grip) — voir animateChar, mode 'glide'.
  for (const sgn of [1, -1]) {
    line(0, 2.05, 0, sgn * ARM.grip[0], ARM.grip[1], ARM.grip[2]);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 8), mat(0x2a303c));
    grip.rotation.z = Math.PI / 2; grip.position.set(sgn * ARM.grip[0], ARM.grip[1], ARM.grip[2]); grip.castShadow = true; grip.userData.grip = sgn; g.add(grip);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
// ---------------------------------------------------------------------------
// MANNEQUIN COMMUN (squelette.js, généré depuis squelette.glb) : tous les skins
// partagent ce corps, découpé sur le squelette du perso (hanches/genoux/épaules/
// coudes/tête/torse) pour que toutes les animations et emotes fonctionnent.
// Chaque skin le teinte (haut, pantalon, peau, mains, chaussures) et y ajoute
// sa coiffe, ses accessoires et son sac à dos.
// ---------------------------------------------------------------------------
const SQ_GEO = new Map();
function sqBuf(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
function sqGeo(bone, i) {
  const k = bone + i; let g = SQ_GEO.get(k);
  if (!g) {
    const p = SQUELETTE.parts[bone][i];
    g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(new Int16Array(sqBuf(p.p)), (v) => v / SQUELETTE.Q), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(Float32Array.from(new Int8Array(sqBuf(p.n)), (v) => v / 127), 3));
    g.setIndex(new THREE.BufferAttribute(new Uint16Array(sqBuf(p.i)), 1));
    g.computeBoundingSphere();
    SQ_GEO.set(k, g);
  }
  return g;
}
// tête visible : l'avant est rentré, le visage sculpté (faceGeo) le recouvre
function headCore(i) {
  return geo('headcore' + i, () => {
    const g = sqGeo('head', i).clone(), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k) - SQ_HC.z, a = Math.abs(Math.atan2(x, -z));
      const f = 1 - 0.2 * sst(1.68, 1.4, a) * sst(0.288, 0.262, y) * sst(0.05, 0.066, y);
      p.setXYZ(k, x * f, y, SQ_HC.z + z * f);
    }
    return g;
  });
}
function sqFill(group, bone, M) {
  (SQUELETTE.parts[bone] || []).forEach((p, i) => { const m = new THREE.Mesh(bone === 'head' ? headCore(i) : sqGeo(bone, i), M[p.m]); m.castShadow = true; group.add(m); });
}
// --- Surface du mannequin : lancer de rayon sur les pièces, pour poser visage, cheveux
// et vêtements exactement dessus (calculé une seule fois, puis gardé en cache).
const SQ_TRI = new Map();
function sqTris(bone) {
  let T = SQ_TRI.get(bone);
  if (!T) {
    T = [];
    (SQUELETTE.parts[bone] || []).forEach((p, i) => { const g = sqGeo(bone, i), a = g.attributes.position, x = g.index; for (let k = 0; k < x.count; k += 3) T.push([0, 1, 2].map((c) => new THREE.Vector3().fromBufferAttribute(a, x.getX(k + c)))); });
    SQ_TRI.set(bone, T);
  }
  return T;
}
const _ray = new THREE.Ray(), _hit = new THREE.Vector3();
// dernière face touchée en partant de o vers d (la peau extérieure), ou null
function sqCast(bone, o, d) {
  _ray.origin.copy(o); _ray.direction.copy(d).normalize();
  let best = null, bd = -1;
  for (const t of sqTris(bone)) if (_ray.intersectTriangle(t[0], t[1], t[2], false, _hit)) { const l = _hit.distanceTo(o); if (l > bd) { bd = l; best = _hit.clone(); } }
  return best;
}
const SQ_Z = new Map();
// z de la surface avant (dir = -1) ou arrière (dir = 1) d'une pièce en (x, y)
function sqZ(bone, x, y, dir = -1) {
  const k = `${bone},${r3(x)},${r3(y)},${dir}`; let z = SQ_Z.get(k);
  if (z === undefined) { const h = sqCast(bone, new THREE.Vector3(x, y, dir * 0.015), new THREE.Vector3(0, 0, dir)); z = h ? h.z : dir * 0.1; SQ_Z.set(k, z); }
  return z;
}
// Détail plaqué sur une surface : posé dessus et incliné selon sa courbure
function sqOn(group, bone, w, h, d, x, y, m, r, dir = -1) {
  const e = 0.015, zx = sqZ(bone, x + e, y, dir) - sqZ(bone, x - e, y, dir), zy = sqZ(bone, x, y + e, dir) - sqZ(bone, x, y - e, dir);
  const b = rbox(group, w, h, d, x, y, sqZ(bone, x, y, dir), m, r);
  b.rotation.y = -Math.atan(zx / (2 * e)); b.rotation.x = Math.atan(zy / (2 * e));
  return b;
}
// Bande qui épouse une pièce entre y0 et y1 (ceinture, col, manchette, semelle…)
function sqBand(bone, y0, y1, off, n = 3, seg = 28) {
  return geo(`sqb${bone},${y0},${y1},${off}`, () => {
    const pos = [], idx = [];
    const ring = (y, o) => {
      let x0 = 9, x1 = -9, z0 = 9, z1 = -9;
      for (const t of sqTris(bone)) for (let k = 0; k < 3; k++) {
        const a = t[k], b = t[(k + 1) % 3]; if ((a.y >= y) === (b.y >= y)) continue;
        const u = (y - a.y) / (b.y - a.y), x = a.x + (b.x - a.x) * u, z = a.z + (b.z - a.z) * u;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
      }
      const c = new THREE.Vector3((x0 + x1) / 2, y, (z0 + z1) / 2);
      for (let j = 0; j <= seg; j++) {
        const a = j / seg * Math.PI * 2, d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), h = sqCast(bone, c, d);
        const l = (h ? h.distanceTo(c) : Math.hypot((x1 - x0) / 2 * d.x, (z1 - z0) / 2 * d.z)) + o;
        pos.push(c.x + d.x * l, y, c.z + d.z * l);
      }
    };
    ring(y0, -0.004); for (let i = 0; i <= n; i++) ring(y0 + (y1 - y0) * i / n, off); ring(y1, -0.004);
    for (let i = 0; i < n + 2; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, b + 1, a, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  });
}
// Coque autour de la tête (cheveux, cagoule) : du sommet jusqu'à la lisière low(a),
// hauteur du bord selon le cap a (0 = visage, π = nuque)
const SQ_HC = new THREE.Vector3(0, 0.2, -0.025);
function sqHeadShell(key, low, off, seg = 36, n = 12) {
  return geo('sqh' + key, () => {
    const pos = [], idx = [];
    for (let j = 0; j <= seg; j++) {
      const a = j / seg * Math.PI * 2, end = Math.PI / 2 + Math.atan((SQ_HC.y - low(Math.min(a, Math.PI * 2 - a))) / 0.1);
      for (let i = 0; i <= n + 1; i++) {
        const th = Math.max(0.001, end * Math.min(1, i / n)), d = new THREE.Vector3(Math.sin(th) * Math.sin(a), Math.cos(th), -Math.sin(th) * Math.cos(a));
        const h = sqCast('head', SQ_HC, d), l = (h ? h.distanceTo(SQ_HC) : 0.1) + (i > n ? -0.006 : off * (0.55 + 0.45 * Math.min(1, (n - i) / 2)));
        pos.push(SQ_HC.x + d.x * l, SQ_HC.y + d.y * l, SQ_HC.z + d.z * l);
      }
    }
    const w = n + 2;
    for (let j = 0; j < seg; j++) for (let i = 0; i < n + 1; i++) { const a = j * w + i, b = a + w; idx.push(a, b + 1, a + 1, a, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  });
}
function sqGrid(key, nu, nv, f) { // surface (u, v) dans [0, 1]², avec un bord rentrant d'un cran
  return geo('sqg' + key, () => {
    const pos = [], idx = [], w = nu + 3;
    for (let j = -1; j <= nv + 1; j++) for (let i = -1; i <= nu + 1; i++) {
      const rim = i < 0 || j < 0 || i > nu || j > nv;
      pos.push(...f(Math.min(1, Math.max(0, i / nu)), Math.min(1, Math.max(0, j / nv)), rim));
    }
    for (let j = 0; j < nv + 2; j++) for (let i = 0; i < w - 1; i++) { const a = j * w + i, b = a + w; idx.push(a, b, b + 1, a, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  });
}
// bande courbe sur le visage entre y0 et y1, de -amax à +amax autour de la tête
function sqFacePatch(y0, y1, amax, off) {
  return sqGrid(`f${y0},${y1},${amax},${off}`, 22, 4, (u, v, rim) => {
    const y = y0 + (y1 - y0) * v, a = (u * 2 - 1) * amax, o = new THREE.Vector3(0, Math.max(y, 0.08), SQ_HC.z), d = new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)); // sous le menton : tombe droit
    faceZ(0, 0.2);
    const h = sqCast('head', o, d), f = sqCast('face', o, d), l = Math.max(h ? h.distanceTo(o) : 0.09, f ? f.distanceTo(o) : 0) + (rim ? -0.004 : off);
    return [d.x * l, y, SQ_HC.z + d.z * l];
  });
}
// plaque sur le torse : centre cx(v), demi-largeur w(v), face avant (dir = -1) ou dos (1)
function sqTorsoPatch(key, y0, y1, cx, w, off, dir = -1, nu = 4, nv = 12) {
  return sqGrid(`t${key}${dir}`, nu, nv, (u, v, rim) => {
    const y = y0 + (y1 - y0) * v, x = cx(v) - dir * (u * 2 - 1) * w(v);
    return [x, y, sqZ('torso', x, y, dir) + dir * (rim ? -0.004 : off)];
  });
}
// Lisière des cheveux : front dégagé, pattes devant les oreilles, nuque couverte
const hairline = (front, back) => (a) => { const t = Math.min(1, Math.max(0, (a - 0.75) / 0.75)); return front + (back - front) * t * t * (3 - 2 * t); };

const sqNeckZ = () => { let z0 = 9, z1 = -9; for (const t of sqTris('head')) for (const v of t) if (v.y < 0.045) { z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z); } return SQUELETTE.pivots.head[2] + (z0 + z1) / 2; };

// --- Visage : une seule surface sculptée sur l'avant de la tête (arcades, orbites, nez,
// pommettes, lèvres, menton, mâchoire), teintée par sommet (lèvres, joues, ombres des yeux),
// plus des yeux sphériques sous paupières, des sourcils et des oreilles.
const EYE = { x: 0.0365, y: 0.193, r: 0.0222 };
const gau = (v, s) => Math.exp(-v * v / (2 * s * s));
const sst = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
// relief du visage : poussée vers l'avant (z) et vers l'extérieur (r) au point (x, y)
function faceRelief(x, y) {
  const X = Math.abs(x); let z = 0, r = 0;
  // nez : arête qui s'élargit vers le bout, dessous net, ailes
  const t = Math.min(1, Math.max(0, (0.203 - y) / 0.058));
  const h = (0.003 + 0.019 * Math.pow(t, 1.35)) * sst(0.1295, 0.1395, y) * sst(0.216, 0.196, y);
  z += h * Math.exp(-Math.pow(X / (0.0082 + 0.0042 * t), 2.4));
  z += 0.0095 * gau(X - 0.0135, 0.0052) * gau(y - 0.1425, 0.0058);
  z -= 0.005 * gau(X - 0.0068, 0.0028) * gau(y - 0.1335, 0.0026); // narines
  // arcades, orbites, coin interne de l'œil
  z += 0.0065 * gau(X - 0.034, 0.024) * gau(y - 0.2235, 0.0085) - 0.002 * gau(X, 0.006) * gau(y - 0.22, 0.008);
  z -= 0.0125 * Math.exp(-Math.pow((X - EYE.x) / 0.0225, 4) - Math.pow((y - EYE.y) / 0.0165, 4));
  z -= 0.004 * gau(X - 0.0145, 0.005) * gau(y - 0.193, 0.011);
  // pommettes, creux des joues, sillon
  r += 0.0055 * gau(X - 0.064, 0.018) * gau(y - 0.166, 0.013);
  r -= 0.0008 * gau(X - 0.058, 0.018) * gau(y - 0.126, 0.014);
  z -= 0.0005 * gau(X - 0.027 - (0.135 - y) * 0.28, 0.003) * sst(0.1, 0.112, y) * sst(0.145, 0.13, y);
  const m = y - 5 * X * X; // commissures légèrement relevées
  // bouche : volume, lèvres, fente, commissures
  z += 0.004 * gau(X, 0.024) * gau(m - 0.103, 0.016);
  z += 0.0048 * gau(X, 0.0155) * gau(m - 0.1088 + X * 0.07, 0.0038) - 0.0012 * gau(X, 0.0028) * gau(m - 0.1115, 0.004);
  z += 0.0068 * gau(X, 0.0135) * gau(m - 0.0955 - X * 0.05, 0.0046);
  z -= 0.0052 * Math.exp(-Math.pow(X / 0.0225, 6)) * gau(m - 0.1025, 0.0016);
  z -= 0.0026 * gau(X - 0.0235, 0.0035) * gau(m - 0.1025, 0.004);
  z -= 0.0035 * gau(X, 0.016) * gau(y - 0.0865, 0.0038); // pli sous la lèvre
  z += 0.0085 * gau(X, 0.0165) * gau(y - 0.0735, 0.0095); // menton
  r += 0.0055 * gau(X - 0.07, 0.02) * gau(y - 0.108, 0.02); // angle de la mâchoire
  r += 0.004 * gau(X - 0.045, 0.02) * gau(y - 0.078, 0.012);
  return [z, r];
}
// teinte par sommet (multiplie la couleur de peau)
function faceTint(x, y) {
  const X = Math.abs(x), c = [1, 1, 1], mix = (k, r, g, b) => { c[0] *= 1 + (r - 1) * k; c[1] *= 1 + (g - 1) * k; c[2] *= 1 + (b - 1) * k; };
  mix(gau(X - 0.052, 0.015) * gau(y - 0.148, 0.013) * 0.8, 1, 0.8, 0.76); // joues
  mix(gau(X, 0.012) * gau(y - 0.143, 0.008) * 0.55, 1, 0.84, 0.8); // bout du nez
  mix(Math.exp(-Math.pow((X - EYE.x) / 0.024, 4) - Math.pow((y - EYE.y) / 0.017, 4)), 0.9, 0.78, 0.74); // orbites
  const m = y - 5 * X * X;
  const up = 0.1125 - 0.0028 * gau(X, 0.003) - 5 * X * X, lo = 0.0905 + 8 * X * X;
  mix(sst(up + 0.0016, up - 0.0006, m) * sst(lo - 0.0016, lo + 0.0006, m) * sst(0.0255, 0.022, X), 0.84, 0.53, 0.5); // lèvres
  mix(sst(0.0248, 0.021, X) * gau(m - 0.1025, 0.0014), 0.36, 0.2, 0.2); // fente
  mix(gau(X - 0.0068, 0.0026) * gau(y - 0.1335, 0.0022) * 0.85, 0.4, 0.26, 0.24); // narines
  mix(gau(X, 0.013) * gau(y - 0.0862, 0.003) * 0.3, 0.8, 0.7, 0.68);
  mix(gau(X - 0.058, 0.02) * gau(y - 0.118, 0.014) * 0.12, 0.82, 0.74, 0.72); // creux des joues
  return c;
}
function faceGeo() {
  return geo('sqface', () => {
    const nu = 52, AM = 1.75, rows = [];
    for (let y = 0.29; y > 0.058;) { rows.push(y); y -= 0.0024 + 0.0018 * sst(0.11, 0.17, y) + 0.0012 * sst(0.086, 0.07, y) + 0.0034 * sst(0.225, 0.26, y); }
    const nv = rows.length, L = [], A = [];
    for (let i = 0; i <= nu; i++) { const q = i / nu * 2 - 1; A.push(AM * (0.5 * q + 0.5 * q * q * q)); }
    // surface de départ : tête du mannequin, adoucie pour effacer ses facettes
    const low = (a) => 0.06 + 0.032 * sst(0.75, 1.5, Math.abs(a)); // bas du visage : menton puis ligne de mâchoire
    const yAt = (j, a) => (rows[j] >= 0.125 ? rows[j] : low(a) + (rows[j] - 0.058) * (0.125 - low(a)) / 0.067);
    for (let j = 0; j < nv; j++) { L.push([]); for (let i = 0; i <= nu; i++) {
      const y = Math.max(0.073, yAt(j, A[i])), o = new THREE.Vector3(0, y, SQ_HC.z), h = sqCast('head', o, new THREE.Vector3(Math.sin(A[i]), 0, -Math.cos(A[i])));
      L[j].push(h ? h.distanceTo(o) : 0.085);
    } }
    const B0 = L.map((r) => r.slice());
    for (let k = 0; k < 36; k++) { const S = L.map((r) => r.slice());
      for (let j = 1; j < nv - 1; j++) for (let i = 1; i < nu; i++) L[j][i] = (S[j][i] * 2 + S[j - 1][i] + S[j + 1][i] + S[j][i - 1] + S[j][i + 1]) / 6; }
    const pos = [], col = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const jj = Math.min(j, nv - 1), a = A[i], y = yAt(jj, a), sn = Math.sin(a), cs = Math.cos(a);
      const edge = sst(0, 0.1, 1 - Math.abs(a) / AM) * sst(0.29, 0.262, y); // raccord avec le crâne
      let l = B0[jj][i] + (L[jj][i] - B0[jj][i]) * edge;
      const x0 = l * sn, rel = cs > -0.1 ? faceRelief(x0, y) : [0, 0];
      const jaw = sst(low(a) + 0.02, low(a), y);
      l += rel[1] * edge + 0.0008;
      const chin = sst(1.35, 0.7, Math.abs(a));
      l *= 1 - 0.13 * jaw * jaw * chin; // arrondi sous le menton et la mâchoire
      let x = l * sn, z = SQ_HC.z - l * cs - rel[0] * edge * (1 - 0.6 * jaw), yy = y;
      if (i === 0 || i === nu || j === 0) { x -= sn * 0.004; z += cs * 0.004; }
      if (j === nv) { const q = 0.06 + 0.36 * chin; x *= 1 - q; z = SQ_HC.z + (z - SQ_HC.z) * (1 - q * 1.15); yy = y + 0.004 * chin; } // dessous du menton
      const c = faceTint(x0, y); pos.push(x, yy, z); col.push(1 + (c[0] - 1) * edge, 1 + (c[1] - 1) * edge, 1 + (c[2] - 1) * edge);
    }
    const w = nu + 1;
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * w + i, b = a + w; idx.push(a, b + 1, a + 1, a, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  });
}
// z du visage sculpté (repli : la tête) et distance de la peau dans la direction a
function faceZ(x, y) {
  if (!SQ_TRI.has('face')) { const g = faceGeo(), a = g.attributes.position, x2 = g.index, T = []; for (let k = 0; k < x2.count; k += 3) T.push([0, 1, 2].map((c) => new THREE.Vector3().fromBufferAttribute(a, x2.getX(k + c)))); SQ_TRI.set('face', T); }
  return Math.min(sqZ('face', x, y), sqZ('head', x, y));
}
const IRIS = [0x3f7fb8, 0x6b4a2a, 0x4d8a55, 0x7a8a96, 0x8a6a2c];
function buildFace(head, s) {
  const skin = mat(s.skin, { roughness: 0.55 }), base = new THREE.Color(s.skin);
  const tone = (c, k) => mat(base.clone().lerp(new THREE.Color(c), k).getHex(), { roughness: 0.55 });
  part(head, faceGeo(), mat(s.skin, { roughness: 0.55, vertexColors: true, side: THREE.DoubleSide }), 0, 0, 0);
  faceZ(0, 0.2); // prépare la surface pour les accessoires
  for (const sx of [-1, 1]) { // oreilles : pavillon, creux, lobe
    const e = new THREE.Group(); e.position.set(sx * 0.099, 0.183, -0.004); e.rotation.set(-0.12, sx * 0.45, sx * -0.1); head.add(e);
    part(e, SPHERE_LO, skin, 0, 0.003, 0, 0.0095, 0.031, 0.0205);
    part(e, SPHERE_LO, tone(0x7a2a1a, 0.3), sx * 0.0055, 0.004, -0.002, 0.005, 0.02, 0.0115);
    part(e, SPHERE_LO, skin, 0, -0.021, -0.004, 0.008, 0.011, 0.0105);
  }
  if (s.extra === 'shades' || s.extra === 'visor') return; // yeux cachés
  const id = [...(s.name || '')].reduce((n, c) => n + c.charCodeAt(0), 0), ec = new THREE.Color(s.eyes || IRIS[id % IRIS.length]);
  const white = mat(0xf4f5f8, { roughness: 0.2 }), iris = mat(ec.getHex(), { roughness: 0.12 }), ring = mat(ec.clone().lerp(new THREE.Color(0x05060a), 0.65).getHex(), { roughness: 0.2 });
  const pupil = mat(0x050507, { roughness: 0.08 }), shine = mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.7 });
  const lash = mat(0x17100d, { roughness: 0.8 }), brow = mat(s.brows || s.hair || 0x2f2318, { roughness: 0.95 }), lid = tone(0x7a3a2c, 0.12);
  const R = EYE.r;
  for (const sx of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(sx * EYE.x, EYE.y, faceZ(sx * EYE.x, EYE.y) + 0.0105); head.add(e);
    part(e, EYE_GEO.ball(), white, 0, 0, 0, R, R, R);
    const g = new THREE.Group(); g.rotation.set(-0.02, -sx * 0.06, 0); e.add(g); // regard droit devant
    part(g, EYE_GEO.cap(0.74), ring, 0, 0, 0, R * 1.008, R * 1.008, R * 1.008);
    part(g, EYE_GEO.cap(0.64), iris, 0, 0, 0, R * 1.02, R * 1.02, R * 1.02);
    part(g, EYE_GEO.cap(0.33), pupil, 0, 0, 0, R * 1.032, R * 1.032, R * 1.032);
    part(g, SPHERE_LO, shine, 0.0052, 0.0058, -R * 0.965, 0.0028, 0.0028, 0.0016);
    const k = R * 1.09, tilt = sx * 0.05; // paupières : coques autour de l'œil, coin externe un peu relevé
    part(e, EYE_GEO.shell(0, 1.04), lid, 0, 0, 0, k, k, k).rotation.z = tilt;
    part(e, EYE_GEO.shell(0.99, 0.13), lash, 0, 0, 0, k * 1.035, k * 1.035, k * 1.035).rotation.z = tilt;
    part(e, EYE_GEO.shell(Math.PI - 1.08, 1.08), lid, 0, 0, 0, k * 0.99, k * 0.99, k * 0.99).rotation.z = tilt * 0.6;
    part(head, sqGrid('brow' + sx, 14, 3, (u, v, rim) => { // sourcil : arc effilé collé à l'arcade
      const q = sx > 0 ? u : 1 - u, x = sx * (0.0155 + q * 0.046), th = 0.0062 * (1 - 0.62 * Math.pow(q, 2.2)) * Math.sqrt(sst(-0.12, 0.2, q));
      const y = 0.2275 + 0.0052 * Math.sin(Math.min(1, q * 1.1) * Math.PI * 0.72) - 0.0055 * sst(0.6, 1, q) + (v * 2 - 1) * th;
      return [x, y, faceZ(x, y) + (rim ? 0.003 : -0.0032)];
    }), brow, 0, 0, 0);
  }
}
const SPHERE_LO = new THREE.SphereGeometry(1, 12, 8);
const EYE_GEO = {
  ball: () => geo('eyeball', () => new THREE.SphereGeometry(1, 18, 12)),
  cap: (t) => geo('eyecap' + t, () => new THREE.SphereGeometry(1, 20, 4, 0, Math.PI * 2, 0, t).rotateX(-Math.PI / 2)),
  shell: (a, l) => geo(`eyelid${r3(a)},${r3(l)}`, () => new THREE.SphereGeometry(1, 20, 6, 0, Math.PI * 2, a, l)),
};

// --- Vêtements communs : ceinture, col, fermeture, poches, manchettes, genouillères, baskets
function buildOutfit(s, P) {
  const { torso, hipL, hipR, kneeL, kneeR, elL, elR } = P;
  const shade = (c, k) => new THREE.Color(c).lerp(new THREE.Color(k < 0 ? 0x05050a : 0xffffff), Math.abs(k)).getHex();
  const trim = mat(shade(s.shirt, new THREE.Color(s.shirt).getHSL({}).l < 0.16 ? 0.025 : -0.42), { roughness: 0.8 }), seam = mat(shade(s.pants, new THREE.Color(s.pants).getHSL({}).l < 0.16 ? 0.025 : -0.35), { roughness: 0.9 });
  const belt = mat(s.accent !== undefined && s.accent !== s.shirt ? s.accent : 0x1a1a22, { roughness: 0.6 }), metal = mat(0xc0c8d0, { metalness: 0.7, roughness: 0.35 });
  const sole = mat(s.shoes !== undefined ? s.shoes : 0xd8d4c8, { roughness: 0.7 }), shoeTop = mat(s.shoes !== undefined ? s.shoes : 0x3a3a4a, { roughness: 0.5 });
  part(torso, sqBand('torso', 0.052, 0.1, 0.009), belt, 0, 0, 0);
  sqOn(torso, 'torso', 0.06, 0.052, 0.034, 0, 0.076, metal, 0.01); // boucle
  part(torso, sqBand('torso', 0.752, 0.79, 0.009), trim, 0, 0, 0); // col
  if (s.outfit) buildShadowOutfit(s, torso);
  else if (s.extra === 'tiger') { // rayures de tigre
    const st = mat(0x241009, { roughness: 0.7 });
    [[-0.1, 0.22, 0.14], [0.1, 0.22, 0.14], [-0.045, 0.34, 0.18], [0.05, 0.4, 0.17], [-0.14, 0.46, 0.14], [0.14, 0.5, 0.14]].forEach(([x, y, h], i) => { for (const d of [-1, 1]) part(torso, sqTorsoPatch('tig' + i, y - h / 2, y + h / 2, (v) => x + Math.sin(v * 5) * 0.01, (v) => 0.004 + Math.sin(v * Math.PI) * 0.016, 0.005, d), st, 0, 0, 0); });
  } else {
    part(torso, sqTorsoPatch('zip', 0.1, 0.74, () => 0, () => 0.008, 0.005, -1, 2, 18), trim, 0, 0, 0); // fermeture
  }
  for (const [el, b] of [[elL, 'fore_L'], [elR, 'fore_R']]) part(el, sqBand(b, -0.272, -0.235, 0.008), trim, 0, 0, 0); // manchettes
  for (const [hip, b, sx] of [[hipL, 'hip_L', -1], [hipR, 'hip_R', 1]]) { // poches cargo
    const h = sqCast(b, new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(sx, 0, 0)), x = h ? h.x : sx * 0.08;
    rbox(hip, 0.034, 0.13, 0.1, x, -0.2, 0, seam, 0.014); rbox(hip, 0.042, 0.032, 0.106, x, -0.15, 0, seam, 0.012);
  }
  for (const [kn, b, sx] of [[kneeL, 'knee_L', -1], [kneeR, 'knee_R', 1]]) {
    sqOn(kn, b, 0.085, 0.1, 0.03, 0, -0.035, seam, 0.014); // genouillère
    part(kn, sqBand(b, -0.524, -0.498, 0.007), sole, 0, 0, 0); // semelle
    part(kn, sqBand(b, -0.41, -0.375, 0.011), shoeTop, 0, 0, 0); // tige
    for (const z of [-0.075, -0.1, -0.125]) { const h = sqCast(b, new THREE.Vector3(sx * 0.02, -0.5, z), new THREE.Vector3(0, 1, 0)); if (h && h.y < -0.36) rbox(kn, 0.046, 0.009, 0.013, sx * 0.02, h.y, z, sole, 0.004); } // lacets
  }
}
// Tenues de l'Ombre : costume, gilet tactique ou uniforme d'officier sur le mannequin
function buildShadowOutfit(s, torso) {
  const black = mat(0x08080b, { roughness: 0.5 }), white = mat(0xeef0f4, { roughness: 0.6 }), gold = mat(0xc9a227, { metalness: 0.65, roughness: 0.3 });
  const red = mat(0xc0141e, { roughness: 0.4, emissive: 0x5a0008, emissiveIntensity: 0.35 }), vest = mat(0x2b2f36, { roughness: 0.8 });
  if (s.outfit === 'suit') {
    part(torso, sqTorsoPatch('plastron', 0.47, 0.75, () => 0, (v) => 0.006 + v * 0.055, 0.004), white, 0, 0, 0);
    part(torso, sqTorsoPatch('cravate', 0.46, 0.75, () => 0, (v) => (v < 0.12 ? 0.004 + v * 0.14 : v > 0.9 ? 0.022 : 0.02 - v * 0.008), 0.01), black, 0, 0, 0);
    for (const y of [0.28, 0.38]) sqOn(torso, 'torso', 0.018, 0.018, 0.016, 0, y, black, 0.008);
  } else if (s.outfit === 'tactical') {
    part(torso, sqBand('torso', 0.22, 0.44, 0.024, 5), vest, 0, 0, 0); // gilet
    for (const d of [-1, 1]) part(torso, sqTorsoPatch('plaque', 0.42, 0.68, () => 0, (v) => 0.15 - v * 0.03, 0.026, d, 10), vest, 0, 0, 0);
    for (const x of [-0.09, 0, 0.09]) sqOn(torso, 'torso', 0.065, 0.1, 0.085, x, 0.3, black, 0.014); // chargeurs
  } else {
    for (const sx of [-1, 1]) for (const y of [0.28, 0.38, 0.48, 0.58]) sqOn(torso, 'torso', 0.02, 0.02, 0.016, sx * 0.055, y, gold, 0.009); // boutons
    part(torso, sqTorsoPatch('echarpe', 0.11, 0.72, (v) => -0.1 + v * 0.22, () => 0.026, 0.007, -1, 4, 20), red, 0, 0, 0); // écharpe
  }
  sqOn(torso, 'torso', 0.045, 0.045, 0.016, 0.1, s.outfit === 'officer' ? 0.6 : 0.56, red, 0.02); // insigne
}
export function makeCharMesh(cos) {
  const s = cos.skinDef || SKINS[cos.skin] || SKINS.recrue;
  const pv = SQUELETTE.pivots, at = (grp, v) => { grp.position.set(v[0], v[1], v[2]); return grp; };
  const armored = s.style === 'astro' || s.style === 'knight';
  // double face : l'intérieur d'un membre reste plein là où une articulation s'ouvre en se pliant
  const body = (c, roughness) => mat(c, { roughness, side: THREE.DoubleSide });
  const M = {
    shirt: body(s.shirt, 0.85),
    pants: body(s.pants, 0.9),
    skin: body(s.skin, 0.55),
    hand: s.gloves !== undefined ? body(s.gloves, 0.45) : armored ? body(0xdfe4ee, 0.5) : body(s.skin, 0.55),
    shoe: body(s.shoes !== undefined ? s.shoes : 0x23232f, 0.4),
  };
  const g = new THREE.Group();
  const hipL = at(new THREE.Group(), pv.hipL), hipR = at(new THREE.Group(), pv.hipR);
  const kneeL = at(new THREE.Group(), pv.kneeL), kneeR = at(new THREE.Group(), pv.kneeR);
  hipL.add(kneeL); hipR.add(kneeR);
  const torso = new THREE.Group(); torso.position.y = SQUELETTE.torsoY;
  const head = at(new THREE.Group(), pv.head); torso.add(head);
  const shL = at(new THREE.Group(), pv.shL), shR = at(new THREE.Group(), pv.shR);
  const elL = at(new THREE.Group(), pv.elL), elR = at(new THREE.Group(), pv.elR);
  shL.add(elL); shR.add(elR); torso.add(shL, shR);
  sqFill(torso, 'torso', M); sqFill(head, 'head', M);
  sqFill(hipL, 'hip_L', M); sqFill(hipR, 'hip_R', M); sqFill(kneeL, 'knee_L', M); sqFill(kneeR, 'knee_R', M);
  sqFill(shL, 'arm_L', M); sqFill(shR, 'arm_R', M); sqFill(elL, 'fore_L', M); sqFill(elR, 'fore_R', M);
  // coiffe et accessoires du skin : dessinés pour une tête de 0,4 × 0,5 × 0,42 m,
  // ramenés à la boîte de la tête du mannequin
  const H = SQUELETTE.head, wear = new THREE.Group();
  wear.position.set(0, H.chin, H.z); wear.scale.set(H.w / 0.4, (H.top - H.chin) / 0.5, H.d / 0.42);
  head.add(wear); buildHead(wear, s, head);
  head.position.y -= 0.007;
  part(torso, loftGeo('cou', [[0, 0.062, 0.05, 0.06], [0.07, 0.052, 0.04, 0.05], [0.11, 0.04, 0.03, 0.03]], 2, 16, 2), M.skin, 0, 0.745, sqNeckZ());
  head.scale.setScalar(1.12); // tête un peu plus présente, centrée sur sa zone de touche
  buildOutfit(s, { torso, hipL, hipR, kneeL, kneeR, elL, elR });
  if (s.extra === 'scarf') { // écharpe autour du cou + pan sur la poitrine
    const sc = mat(s.accent || 0xd94848);
    cyl(torso, 0.085, 0.105, 0.08, 0, 0.72, 0.01, sc, 16).scale.z = 1.1;
    rbox(torso, 0.07, 0.2, 0.035, 0.06, 0.6, -0.11, sc, 0.015).rotation.x = -0.12;
  }
  // sac à dos : prévu pour le buste large de l'ancien perso, resserré pour le mannequin
  const pack = new THREE.Group(); pack.scale.set(0.75, 1, 0.85); pack.position.z = -0.01; torso.add(pack);
  buildBackpack(pack, cos.backpack);
  const hand = at(new THREE.Group(), pv.hand); hand.rotation.x = -Math.PI / 2; elR.add(hand);
  g.add(hipL, hipR, torso);
  const glider = makeParachute(cos.glider); glider.visible = false; g.add(glider);
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return { group: g, hipL, hipR, kneeL, kneeR, torso, head, shL, shR, elL, elR, hand, glider };
}
// ---------------------------------------------------------------------------
// TENUES DE L'OMBRE (déguisement en partie, via les cabines téléphoniques, et
// uniformes des hommes de main) : teintes et coiffes appliquées au mannequin commun.
export const SHADOW_OUTFITS = {
  agent: { name: 'Agent de l’Ombre', outfit: 'suit', shirt: 0x17181f, pants: 0x121319, skin: 0xb07a52, hat: 0x0e0e13, shoes: 0x0a0a0c, gloves: 0x0c0c10, style: 'fedora', extra: 'shades', accent: 0x0c0c10 },
  garde: { name: 'Garde de l’Ombre', outfit: 'tactical', shirt: 0x1d2026, pants: 0x181b20, skin: 0xb07a52, hat: 0x121418, shoes: 0x141518, gloves: 0x101114, style: 'balaclava', accent: 0x101114 },
  officier: { name: 'Officier de l’Ombre', outfit: 'officer', shirt: 0x101015, pants: 0x0f0f14, skin: 0xc58c64, hat: 0x0d0d12, shoes: 0x060608, gloves: 0x0b0b0e, style: 'peaked', extra: 'shades', accent: 0xc9a227 },
};
export const SHADOW_OUTFIT_IDS = Object.keys(SHADOW_OUTFITS);

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

