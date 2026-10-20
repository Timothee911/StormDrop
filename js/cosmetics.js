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
  jardin: { name: 'Jardinière', rarity: 'uncommon', shirt: 0x6fbf4a, pants: 0x7a4e2b, skin: 0xf5d3b5, hat: 0xf2e1a0, style: 'straw', desc: 'Plante des pièges.' },
  surf: { name: 'Surfeur Solaire', rarity: 'uncommon', shirt: 0x00c2c7, pants: 0xffa52d, skin: 0xc68b5e, hat: 0xffffff, style: 'none', extra: 'shades', desc: 'Toujours sur la vague.' },
  // Agents du Chapitre 2 Saison 2
  ombre: { name: 'Homme de Main', rarity: 'rare', shirt: 0x1a1a22, pants: 0x14141c, skin: 0xb07a52, hat: 0x111118, style: 'fedora', extra: 'shades', desc: 'L’uniforme parfait de l’ombre.' },
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
// Sphère / cylindre / cône : formes organiques pour un rendu moins cubique.
export function sph(g, r, x, y, z, m, sx = 1, sy = 1, sz = 1) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m);
  s.scale.set(sx, sy, sz); s.position.set(x, y, z); s.castShadow = true; g.add(s); return s;
}
export function cyl(g, rt, rb, h, x, y, z, m, seg = 10) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  c.position.set(x, y, z); c.castShadow = true; g.add(c); return c;
}

function buildHead(head, s) {
  const skinM = mat(s.skin, { roughness: 0.55 });
  const hat = mat(s.hat), dark = mat(0x14141c);
  const acc = s.accent !== undefined ? mat(s.accent, { emissive: s.accent, emissiveIntensity: 0.6 }) : hat;
  const st = s.style;
  if (st === 'astro') {
    // tête réaliste sous le casque
    box(head, 0.4, 0.4, 0.4, 0, 0.24, 0, skinM);
    box(head, 0.34, 0.14, 0.36, 0, 0.03, -0.01, skinM);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 14), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.3 }));
    glass.position.y = 0.24; glass.castShadow = true; head.add(glass);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.05, 8, 20), mat(0xdfe4ee, { metalness: 0.4, roughness: 0.4 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = -0.04; ring.castShadow = true; head.add(ring);
    box(head, 0.12, 0.12, 0.05, 0.28, 0.08, -0.2, hat); // lampe du casque
    box(head, 0.1, 0.2, 0.1, -0.28, 0.3, 0.05, mat(0xdfe4ee)); // module latéral
  } else if (st === 'knight') {
    const steel = mat(0x9aa3ad, { metalness: 0.65, roughness: 0.3 });
    box(head, 0.48, 0.5, 0.46, 0, 0.24, 0, steel);
    box(head, 0.5, 0.08, 0.48, 0, 0.46, 0, steel); // crête du heaume
    box(head, 0.34, 0.05, 0.02, 0, 0.28, -0.24, dark); // fente de vision
    box(head, 0.06, 0.22, 0.02, 0, 0.1, -0.24, steel); // nasal
    for (let i = 0; i < 3; i++) box(head, 0.34, 0.02, 0.02, 0, 0.06 + i * 0.05, -0.235, dark); // grille
    box(head, 0.1, 0.34, 0.4, 0, 0.68, 0.04, hat); // panache
  } else {
    // tête réaliste : crâne, mâchoire, nez, oreilles, yeux détaillés
    box(head, 0.4, 0.4, 0.4, 0, 0.24, 0, skinM); // crâne
    box(head, 0.34, 0.14, 0.36, 0, 0.03, -0.01, skinM); // mâchoire
    box(head, 0.07, 0.1, 0.06, 0, 0.19, -0.22, skinM); // nez
    box(head, 0.05, 0.12, 0.06, -0.21, 0.2, 0.01, skinM); // oreille G
    box(head, 0.05, 0.12, 0.06, 0.21, 0.2, 0.01, skinM); // oreille D
    const white = mat(0xf5f7ff, { roughness: 0.25 });
    box(head, 0.085, 0.055, 0.02, -0.095, 0.27, -0.203, white); // œil G
    box(head, 0.085, 0.055, 0.02, 0.095, 0.27, -0.203, white); // œil D
    box(head, 0.038, 0.048, 0.015, -0.095, 0.265, -0.216, dark); // pupille G
    box(head, 0.038, 0.048, 0.015, 0.095, 0.265, -0.216, dark); // pupille D
    if (s.extra !== 'shades' && s.extra !== 'visor') {
      box(head, 0.11, 0.025, 0.02, -0.095, 0.335, -0.205, dark).rotation.z = 0.1; // sourcil G
      box(head, 0.11, 0.025, 0.02, 0.095, 0.335, -0.205, dark).rotation.z = -0.1; // sourcil D
    }
    if (s.extra !== 'mask') box(head, 0.11, 0.022, 0.02, 0, 0.09, -0.195, mat(0x8a3a3a, { roughness: 0.4 })); // bouche
  }
  // cheveux (sous les couvre-chefs ouverts)
  const hairC = s.hair || 0x2f2318;
  if (st === 'none' || st === 'cap' || st === 'ears' || st === 'crown') {
    box(head, 0.42, 0.1, 0.41, 0, 0.44, 0.01, mat(hairC)); // dessus
    box(head, 0.42, 0.3, 0.1, 0, 0.3, 0.17, mat(hairC)); // arrière
  }
  if (s.hair) { box(head, 0.44, 0.12, 0.43, 0, 0.45, 0.01, mat(s.hair)); box(head, 0.44, 0.34, 0.12, 0, 0.28, 0.18, mat(s.hair)); }
  if (st === 'cap') { box(head, 0.46, 0.15, 0.44, 0, 0.5, 0.02, hat); box(head, 0.34, 0.05, 0.2, 0, 0.44, -0.3, hat); box(head, 0.08, 0.04, 0.08, 0, 0.58, 0.02, hat); }
  if (st === 'beanie') { box(head, 0.46, 0.2, 0.44, 0, 0.5, 0, hat); box(head, 0.48, 0.07, 0.46, 0, 0.41, 0, mat(s.hat, { roughness: 0.95 })); const pom = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(0xffffff)); pom.position.y = 0.64; pom.castShadow = true; head.add(pom); }
  if (st === 'helmet') {
    const helm = mat(0x2a3a2e, { metalness: 0.3, roughness: 0.5 });
    box(head, 0.48, 0.26, 0.46, 0, 0.48, 0, helm);
    box(head, 0.5, 0.05, 0.48, 0, 0.36, 0, hat);
    box(head, 0.06, 0.14, 0.2, -0.23, 0.3, 0, helm); box(head, 0.06, 0.14, 0.2, 0.23, 0.3, 0, helm); // protège-oreilles
  }
  if (st === 'hood') { box(head, 0.5, 0.28, 0.48, 0, 0.48, 0.04, hat); box(head, 0.1, 0.46, 0.48, -0.22, 0.24, 0.04, hat); box(head, 0.1, 0.46, 0.48, 0.22, 0.24, 0.04, hat); box(head, 0.5, 0.46, 0.1, 0, 0.24, 0.23, hat); }
  if (st === 'mohawk') { box(head, 0.42, 0.06, 0.41, 0, 0.44, 0, mat(hairC)); box(head, 0.08, 0.28, 0.4, 0, 0.58, 0.02, mat(s.hat, { emissive: s.hat, emissiveIntensity: 0.4 })); }
  if (st === 'tricorn') { box(head, 0.62, 0.07, 0.54, 0, 0.46, 0, hat); box(head, 0.4, 0.2, 0.36, 0, 0.58, 0, hat); box(head, 0.63, 0.02, 0.55, 0, 0.5, 0, mat(0xd9b86a)); box(head, 0.08, 0.08, 0.08, 0, 0.6, -0.19, mat(0xffffff)); }
  if (st === 'ears') {
    box(head, 0.1, 0.4, 0.07, -0.13, 0.66, 0, hat); box(head, 0.1, 0.4, 0.07, 0.13, 0.66, 0, hat);
    box(head, 0.05, 0.28, 0.02, -0.13, 0.66, -0.04, mat(0xffd3e6)); box(head, 0.05, 0.28, 0.02, 0.13, 0.66, -0.04, mat(0xffd3e6));
  }
  if (st === 'crown') {
    const gold = mat(0xffc400, { metalness: 0.7, roughness: 0.25, emissive: 0x6a4a00, emissiveIntensity: 0.3 });
    box(head, 0.44, 0.1, 0.42, 0, 0.5, 0, gold);
    for (const [x, z] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17], [0, -0.19]]) box(head, 0.08, 0.14, 0.08, x, 0.61, z, gold);
  }
  if (st === 'horns') {
    box(head, 0.46, 0.12, 0.44, 0, 0.46, 0.02, mat(0x3a0a14));
    const h1 = box(head, 0.08, 0.3, 0.08, -0.18, 0.62, 0, acc); h1.rotation.z = 0.4;
    const h2 = box(head, 0.08, 0.3, 0.08, 0.18, 0.62, 0, acc); h2.rotation.z = -0.4;
  }
  if (st === 'straw') { const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.04, 14), hat); disc.position.y = 0.44; disc.castShadow = true; head.add(disc); box(head, 0.38, 0.14, 0.38, 0, 0.53, 0, hat); box(head, 0.39, 0.04, 0.39, 0, 0.48, 0, mat(0xd94848)); }
  if (st === 'fedora') { box(head, 0.58, 0.05, 0.56, 0, 0.45, 0.01, hat); box(head, 0.4, 0.22, 0.38, 0, 0.57, 0.01, hat); box(head, 0.42, 0.05, 0.4, 0, 0.5, 0.01, mat(0x2c313c)); }
  if (s.extra === 'visor') box(head, 0.42, 0.09, 0.04, 0, 0.27, -0.22, mat(s.accent || s.hat, { emissive: s.accent || s.hat, emissiveIntensity: 1.2 }));
  if (s.extra === 'shades') { box(head, 0.4, 0.08, 0.04, 0, 0.27, -0.21, mat(0x050505, { metalness: 0.8, roughness: 0.1 })); box(head, 0.06, 0.02, 0.02, 0, 0.27, -0.22, mat(0x050505)); }
  if (s.extra === 'mask') box(head, 0.42, 0.18, 0.04, 0, 0.1, -0.21, mat(s.shirt));
}
function buildBackpack(torso, id) {
  const B = BACKPACKS[id]; if (!B || id === 'none') return;
  const c = mat(B.color);
  if (id === 'sac') { box(torso, 0.5, 0.55, 0.22, 0, 0.42, 0.3, c); box(torso, 0.4, 0.15, 0.06, 0, 0.3, 0.42, mat(0xffd23f)); }
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
export function makeCharMesh(cos) {
  const s = SKINS[cos.skin] || SKINS.recrue;
  const g = new THREE.Group();
  const shirt = mat(s.shirt, { roughness: 0.85 }), pants = mat(s.pants, { roughness: 0.9 });
  const skinM = mat(s.skin, { roughness: 0.55 }), dark = mat(0x1a1a22, { roughness: 0.6 });
  const bootM = mat(0x23232f, { roughness: 0.4 });
  const armored = s.style === 'astro' || s.style === 'knight';
  const gloveM = armored ? mat(0xdfe4ee, { roughness: 0.5 }) : skinM;
  const metal = mat(0xc0c8d0, { metalness: 0.7, roughness: 0.35 });

  // --- jambes : cuisse, genouillère, mollet, botte + semelle ---
  const hipL = new THREE.Group(), hipR = new THREE.Group();
  hipL.position.set(-0.155, 0.88, 0); hipR.position.set(0.155, 0.88, 0);
  for (const hip of [hipL, hipR]) {
    box(hip, 0.23, 0.42, 0.26, 0, -0.2, 0, pants); // cuisse
    box(hip, 0.24, 0.09, 0.27, 0, -0.43, 0, dark); // genouillère
    box(hip, 0.19, 0.32, 0.22, 0, -0.62, 0, pants); // mollet
    box(hip, 0.23, 0.11, 0.3, 0, -0.82, 0.0, bootM); // botte
    box(hip, 0.21, 0.08, 0.1, 0, -0.83, -0.18, bootM); // bout de la botte
    box(hip, 0.25, 0.045, 0.42, 0, -0.858, -0.05, dark); // semelle
  }
  // --- torse : bassin, ceinture, torse en deux volumes, col, détails ---
  const torso = new THREE.Group(); torso.position.y = 0.88;
  box(torso, 0.58, 0.22, 0.36, 0, 0.09, 0, pants); // bassin
  box(torso, 0.62, 0.09, 0.40, 0, 0.21, 0, s.accent !== undefined ? mat(s.accent) : dark); // ceinture
  box(torso, 0.09, 0.07, 0.05, 0, 0.21, -0.21, metal); // boucle
  box(torso, 0.14, 0.12, 0.05, -0.2, 0.1, -0.17, dark); // poche de cuisse
  box(torso, 0.62, 0.28, 0.38, 0, 0.33, 0, shirt); // torse bas
  box(torso, 0.68, 0.28, 0.4, 0, 0.56, 0, shirt); // torse haut (épaules)
  box(torso, 0.03, 0.48, 0.02, 0, 0.44, -0.205, dark); // fermeture
  box(torso, 0.13, 0.1, 0.03, -0.17, 0.36, -0.2, dark); // poche poitrine G
  box(torso, 0.13, 0.1, 0.03, 0.17, 0.36, -0.2, dark); // poche poitrine D
  box(torso, 0.34, 0.07, 0.26, 0, 0.71, 0, dark); // col
  if (s.extra === 'scarf') { box(torso, 0.5, 0.13, 0.44, 0, 0.74, 0, mat(s.accent || 0xd94848)); box(torso, 0.12, 0.3, 0.06, 0.12, 0.55, 0.2, mat(s.accent || 0xd94848)); }
  box(torso, 0.16, 0.14, 0.16, 0, 0.78, 0, armored ? mat(s.shirt) : skinM); // cou
  buildBackpack(torso, cos.backpack);
  const head = new THREE.Group(); head.position.y = 0.82; torso.add(head);
  buildHead(head, s);
  // --- bras : épaulière, bras, coude, avant-bras, manchette, main ---
  const shL = new THREE.Group(), shR = new THREE.Group();
  shL.position.set(-0.42, 0.66, 0); shR.position.set(0.42, 0.66, 0);
  for (const sh of [shL, shR]) {
    box(sh, 0.22, 0.16, 0.24, 0, -0.02, 0, shirt); // épaulière
    box(sh, 0.18, 0.34, 0.19, 0, -0.22, 0, shirt); // haut du bras
    box(sh, 0.17, 0.08, 0.17, 0, -0.41, 0, dark); // coudière
    box(sh, 0.15, 0.28, 0.15, 0, -0.55, 0, shirt); // avant-bras
    box(sh, 0.16, 0.05, 0.16, 0, -0.67, 0, dark); // manchette
    box(sh, 0.15, 0.12, 0.16, 0, -0.74, 0, gloveM); // main
  }
  torso.add(shL, shR);
  const hand = new THREE.Group(); hand.position.set(0, -0.74, 0); hand.rotation.x = -Math.PI / 2; shR.add(hand);
  g.add(hipL, hipR, torso);
  const glider = makeGlider(cos.glider); glider.visible = false; g.add(glider);
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return { group: g, hipL, hipR, torso, head, shL, shR, hand, glider };
}

// Emote poses. Returns vertical offset for the whole body.
export function poseEmote(P, id, t) {
  P.torso.rotation.set(0, 0, 0); P.head.rotation.set(0, 0, 0);
  let y = 0;
  const s = Math.sin, c = Math.cos;
  switch (id) {
    case 'salut':
      P.shR.rotation.set(0, 0, 2.6 + s(t * 10) * 0.35); P.shL.rotation.set(0, 0, -0.15);
      P.hipL.rotation.set(0, 0, 0); P.hipR.rotation.set(0, 0, 0); break;
    case 'robot': {
      const k = Math.floor(t * 4) % 4;
      P.shR.rotation.set(k % 2 ? 1.57 : 0, 0, 0.1); P.shL.rotation.set(k % 2 ? 0 : 1.57, 0, -0.1);
      P.torso.rotation.y = [0.4, 0, -0.4, 0][k]; P.head.rotation.y = [-0.4, 0, 0.4, 0][k];
      P.hipL.rotation.set(k === 1 ? -0.4 : 0, 0, 0); P.hipR.rotation.set(k === 3 ? -0.4 : 0, 0, 0); break;
    }
    case 'flex':
      P.shR.rotation.set(0, 0, 1.6); P.shL.rotation.set(0, 0, -1.6);
      P.shR.children[0] && (P.shR.rotation.x = s(t * 6) * 0.2); P.torso.rotation.y = s(t * 3) * 0.3;
      y = Math.abs(s(t * 6)) * 0.05; P.hipL.rotation.set(0, 0, -0.15); P.hipR.rotation.set(0, 0, 0.15); break;
    case 'disco':
      P.shR.rotation.set(0, 0, (s(t * 4) > 0 ? 2.7 : 0.4)); P.shL.rotation.set(0, 0, -0.3 - Math.max(0, -s(t * 4)) * 0.5);
      P.torso.rotation.z = s(t * 4) * 0.15; y = Math.abs(s(t * 8)) * 0.12;
      P.hipL.rotation.set(s(t * 8) * 0.3, 0, 0); P.hipR.rotation.set(-s(t * 8) * 0.3, 0, 0); break;
    case 'fil': {
      const a = s(t * 9);
      P.shR.rotation.set(a > 0 ? -0.5 : 0.5, 0, 0.35); P.shL.rotation.set(a > 0 ? -0.5 : 0.5, 0, -0.35);
      P.torso.rotation.y = a * 0.35; P.hipL.rotation.set(0, 0, a * 0.12); P.hipR.rotation.set(0, 0, a * 0.12); y = Math.abs(a) * 0.04; break;
    }
    default: { // danse
      const a = s(t * 7);
      P.shR.rotation.set(0, 0, 1.4 + a * 0.9); P.shL.rotation.set(0, 0, -1.4 + a * 0.9);
      P.torso.rotation.z = a * 0.15; P.head.rotation.z = -a * 0.2;
      P.hipL.rotation.set(Math.max(0, a) * 0.6, 0, 0); P.hipR.rotation.set(Math.max(0, -a) * 0.6, 0, 0);
      y = Math.abs(c(t * 7)) * 0.12;
    }
  }
  return y;
}
export function poseIdle(P, t) {
  P.torso.rotation.set(0, 0, 0); P.head.rotation.set(0, Math.sin(t * 0.7) * 0.15, 0);
  P.shR.rotation.set(Math.sin(t * 1.3) * 0.05, 0, 0.12); P.shL.rotation.set(-Math.sin(t * 1.3) * 0.05, 0, -0.12);
  P.hipL.rotation.set(0, 0, -0.04); P.hipR.rotation.set(0, 0, 0.04);
  return Math.sin(t * 1.8) * 0.012;
}
