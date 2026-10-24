// STORMDROP — modèles 3D réalistes des armes.
// Chaque arme est construite à partir de profils latéraux extrudés (crosse, carcasse,
// poignée, chargeur courbe), de cylindres (canons, silencieux, lunettes, tambours) et
// de petites pièces de détail (rails Picatinny, mire, levier d'armement, détente...).
// Toutes les pièces d'un même matériau sont fusionnées en un seul maillage et la
// géométrie est mise en cache : 50 joueurs peuvent tenir des armes sans coût notable.
//
// Repère : le canon pointe vers -Z, +Y est le haut, la poignée est près de l'origine
// (c'est là que la main du personnage se referme). g.userData.muzzle = bouche du canon.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------------------
// Matériaux
// ---------------------------------------------------------------------------
const MATS = {
  receiver: { color: 0x717a87, metalness: 0.3, roughness: 0.48 }, // alu anodisé / acier brossé
  steel: { color: 0x3a4049, metalness: 0.35, roughness: 0.42 }, // canons, pièces mobiles
  bright: { color: 0xb4bcc6, metalness: 0.4, roughness: 0.35 }, // acier poli
  poly: { color: 0x474c55, metalness: 0.05, roughness: 0.75 }, // polymère noir
  tan: { color: 0xa88d5f, metalness: 0.05, roughness: 0.7 }, // polymère sable (FDE)
  olive: { color: 0x59603f, metalness: 0.05, roughness: 0.75 }, // polymère vert armée
  wood: { color: 0x7a4a26, metalness: 0.0, roughness: 0.6 }, // noyer
  woodDark: { color: 0x4e2f18, metalness: 0.0, roughness: 0.65 },
  brass: { color: 0xd1a93f, metalness: 0.45, roughness: 0.38 },
  gold: { color: 0xeab926, metalness: 0.5, roughness: 0.3 },
  goldDark: { color: 0xa8790f, metalness: 0.45, roughness: 0.42 },
  lens: { color: 0x6fd0ff, metalness: 0.2, roughness: 0.08, emissive: 0x1d6fae, emissiveIntensity: 0.65 },
  dot: { color: 0xff3b2f, emissive: 0xff2a1f, emissiveIntensity: 1.6, roughness: 0.4 },
  glow: { color: 0x9fe3ff, emissive: 0x3aa8ff, emissiveIntensity: 0.9, roughness: 0.3 },
  rope: { color: 0xd8cdb4, metalness: 0, roughness: 0.9 },
  string: { color: 0xeeeeee, metalness: 0, roughness: 0.6 },
  fire: { color: 0xff5a3d, emissive: 0xff5a3d, emissiveIntensity: 0.55, roughness: 0.5 },
};
const matCache = new Map();
function mat(name) {
  if (!matCache.has(name)) matCache.set(name, new THREE.MeshStandardMaterial(MATS[name]));
  return matCache.get(name);
}
// Couleur de rareté : fine bande sur le chargeur et la carcasse, légèrement lumineuse.
function accentMat(color) {
  const k = 'acc' + color;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.45, emissive: color, emissiveIntensity: 0.28 }));
  return matCache.get(k);
}

// ---------------------------------------------------------------------------
// Constructeur de pièces
// ---------------------------------------------------------------------------
class Parts {
  constructor() { this.by = new Map(); }
  add(key, geo) {
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n);
    if (!this.by.has(key)) this.by.set(key, []);
    this.by.get(key).push(g);
  }
  // boîte (largeur x, hauteur y, profondeur z) centrée en (x, y, z)
  box(key, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rx || ry || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)));
    g.translate(x, y, z); this.add(key, g); return this;
  }
  // cylindre d'axe 'z' (canon), 'y' (tambour) ou 'x' ; r2 = rayon de l'autre bout (cône)
  cyl(key, r, len, x, y, z, axis = 'z', seg = 12, r2 = r) {
    const g = new THREE.CylinderGeometry(r2, r, len, seg); // r2 en haut (+Y local)
    if (axis === 'z') g.rotateX(-Math.PI / 2); // +Y local -> -Z : r2 vers l'avant
    else if (axis === 'x') g.rotateZ(Math.PI / 2);
    g.translate(x, y, z); this.add(key, g); return this;
  }
  // profil latéral (z, y) extrudé sur la largeur w, centré en x. bevel arrondit les arêtes.
  prof(key, pts, w, x = 0, bevel = 0.006) {
    const sh = new THREE.Shape(); pts.forEach(([a, b], i) => (i ? sh.lineTo(a, b) : sh.moveTo(a, b)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.002, w - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 6 });
    g.translate(0, 0, -(w - bevel * 2) / 2);
    g.rotateY(-Math.PI / 2); // (a, b, e) -> (z = a, y = b, x = -e)
    g.translate(x, 0, 0); this.add(key, g); return this;
  }
  // profil courbe : points de contrôle d'une polyligne épaissie en ruban (chargeur courbe)
  strip(key, path, thick, w, x = 0, bevel = 0.004) {
    const n = path.length, left = [], right = [];
    for (let i = 0; i < n; i++) {
      const p = path[i], a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
      let dz = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dz, dy) || 1; dz /= l; dy /= l;
      left.push([p[0] - dy * thick / 2, p[1] + dz * thick / 2]); right.push([p[0] + dy * thick / 2, p[1] - dz * thick / 2]);
    }
    return this.prof(key, [...left, ...right.reverse()], w, x, bevel);
  }
  // rail Picatinny : une barre avec des encoches régulières
  rail(key, z0, z1, y, w = 0.05) {
    this.box(key, w, 0.018, z1 - z0, 0, y, (z0 + z1) / 2);
    const step = 0.04, n = Math.floor((z1 - z0) / step);
    for (let i = 0; i < n; i++) this.box(key, w * 1.25, 0.012, 0.016, 0, y + 0.012, z0 + 0.02 + i * step);
    return this;
  }
  // anneaux le long d'un canon (ailettes de refroidissement, frein de bouche)
  rings(key, r, z0, z1, n, x = 0, y = 0, thick = 0.014) {
    for (let i = 0; i < n; i++) this.cyl(key, r, thick, x, y, z0 + (z1 - z0) * (n === 1 ? 0 : i / (n - 1)), 'z', 10);
    return this;
  }
}

// Détails communs ----------------------------------------------------------
function sightPost(P, z, y, key = 'steel') { P.box(key, 0.012, 0.05, 0.012, 0, y + 0.025, z); P.box(key, 0.04, 0.012, 0.014, 0, y + 0.045, z); }
function flashHider(P, z, y, r = 0.026, len = 0.1, key = 'steel') {
  P.cyl(key, r, len, 0, y, z - len / 2, 'z', 10);
  for (let i = 0; i < 3; i++) P.box(key, r * 2.5, 0.012, 0.012, 0, y, z - len * 0.2 - i * 0.022, 0, 0, i * Math.PI / 3);
}
function trigger(P, z, y) {
  P.prof('steel', [[z, y], [z + 0.02, y], [z + 0.012, y - 0.05], [z + 0.002, y - 0.05]], 0.012, 0, 0.002); // détente
  // pontet
  P.prof('receiver', [[z - 0.02, y + 0.01], [z + 0.09, y + 0.01], [z + 0.09, y - 0.07], [z + 0.085, y - 0.07], [z + 0.085, y - 0.006], [z - 0.02, y - 0.006]], 0.016, 0, 0.002);
}
function reflexSight(P, z, y) {
  P.box('poly', 0.05, 0.02, 0.11, 0, y + 0.01, z); // embase
  P.box('poly', 0.008, 0.055, 0.1, 0.024, y + 0.045, z); P.box('poly', 0.008, 0.055, 0.1, -0.024, y + 0.045, z); // flasques
  P.box('poly', 0.05, 0.012, 0.075, 0, y + 0.078, z + 0.012); // capot
  P.box('poly', 0.05, 0.05, 0.01, 0, y + 0.05, z + 0.05); // arrière
  P.box('lens', 0.04, 0.045, 0.004, 0, y + 0.048, z - 0.045); // lentille
  P.box('dot', 0.008, 0.008, 0.006, 0, y + 0.05, z - 0.041);
}
function scope(P, z, y, len, r, zoomBig = false) {
  P.cyl('steel', r, len, 0, y, z, 'z', 14);
  P.cyl('steel', r * 1.55, len * 0.22, 0, y, z - len * 0.5 + len * 0.11, 'z', 14); // objectif évasé
  P.cyl('steel', r * 1.4, len * 0.16, 0, y, z + len * 0.5 - len * 0.08, 'z', 14); // oculaire
  P.cyl('lens', r * 1.42, 0.004, 0, y, z - len * 0.5 - 0.001, 'z', 14); // lentille avant
  P.cyl('lens', r * 1.28, 0.004, 0, y, z + len * 0.5 + 0.001, 'z', 14);
  P.box('steel', r * 1.1, r * 1.1, r * 1.2, 0, y + r * 1.3, z + len * 0.05); // tourelle
  P.box('steel', r * 1.1, r * 1.1, r * 1.2, r * 1.3, y, z + len * 0.05);
  // colliers
  P.cyl('receiver', r * 1.18, 0.03, 0, y, z - len * 0.22, 'z', 12); P.cyl('receiver', r * 1.18, 0.03, 0, y, z + len * 0.22, 'z', 12);
  P.box('receiver', r * 1.2, y - r * 1.1, 0.03, 0, (y - r * 1.1) / 2 + 0.0, z - len * 0.22);
}

// ---------------------------------------------------------------------------
// Armes
// ---------------------------------------------------------------------------
const BUILDERS = {
  // ---- Fusil d'assaut (type M4 / AR-15 modernisé) ----
  ar(P, acc) {
    const y = 0.03;
    // carcasse haute + carcasse basse, avec trappe d'éjection et guide-chargeur
    P.prof('receiver', [[-0.22, y + 0.07], [0.2, y + 0.07], [0.2, y - 0.07], [0.04, y - 0.07], [0.02, y - 0.1], [-0.2, y - 0.1], [-0.22, y - 0.06]], 0.085, 0, 0.007);
    P.box('steel', 0.01, 0.04, 0.09, 0.046, y + 0.02, -0.02); // trappe d'éjection
    P.box('steel', 0.09, 0.02, 0.06, 0, y + 0.075, 0.1); // poignée de culasse
    P.prof('poly', [[-0.2, y - 0.1], [-0.2, y - 0.2], [-0.1, y - 0.2], [-0.06, y - 0.1]], 0.07, 0, 0.005); // puits de chargeur
    // poignée pistolet inclinée
    P.prof('poly', [[0.08, y - 0.1], [0.19, y - 0.1], [0.215, y - 0.28], [0.15, y - 0.29]], 0.058, 0, 0.007);
    trigger(P, 0.0, y - 0.1 + 0.005);
    // chargeur courbe (rareté sur la bande)
    P.strip('poly', [[-0.17, y - 0.19], [-0.17, y - 0.3], [-0.19, y - 0.41], [-0.235, y - 0.5]], 0.085, 0.056, 0, 0.004);
    P.strip(acc, [[-0.195, y - 0.4], [-0.235, y - 0.49]], 0.087, 0.058, 0, 0.003);
    // crosse télescopique + tube tampon
    P.cyl('steel', 0.025, 0.28, 0, y + 0.0, 0.34, 'z', 10);
    P.prof('poly', [[0.2, y + 0.06], [0.52, y + 0.045], [0.55, y - 0.14], [0.5, y - 0.2], [0.34, y - 0.12], [0.2, y - 0.06]], 0.055, 0, 0.008);
    P.box('poly', 0.06, 0.2, 0.025, 0, y - 0.06, 0.555); // plaque de couche
    // garde-main avec rail supérieur
    P.cyl('poly', 0.05, 0.62, 0, y - 0.005, -0.54, 'z', 8);
    P.cyl('receiver', 0.056, 0.03, 0, y - 0.005, -0.28, 'z', 8); // écrou de canon
    for (let i = 0; i < 6; i++) P.box('steel', 0.016, 0.03, 0.045, 0.049, y - 0.005 - (i % 2 ? 0.01 : 0), -0.34 - i * 0.09, 0, 0, 0); // fentes de ventilation
    P.rail('steel', -0.84, 0.22, y + 0.082, 0.052);
    P.rail('steel', -0.84, -0.3, y - 0.005 - 0.056, 0.036); // rail inférieur
    // canon, bloc de mire, frein de bouche
    P.cyl('steel', 0.017, 0.16, 0, y, -0.93, 'z', 10);
    P.box('steel', 0.04, 0.09, 0.04, 0, y + 0.05, -0.8); sightPost(P, -0.8, y + 0.09);
    flashHider(P, -1.01, y, 0.024, 0.09);
    // poignée avant verticale courte + point rouge
    P.box('poly', 0.034, 0.12, 0.034, 0, y - 0.1, -0.62);
    reflexSight(P, -0.0, y + 0.092);
    sightPost(P, 0.19, y + 0.075); // hausse
  },

  // ---- Mitraillette (type Uzi / Vector : boîtier compact, chargeur dans la poignée, crosse fil) ----
  smg(P, acc) {
    const y = 0.03;
    // boîtier
    P.prof('receiver', [[-0.3, y + 0.055], [0.2, y + 0.055], [0.2, y - 0.055], [-0.3, y - 0.055]], 0.07, 0, 0.008);
    P.prof('steel', [[-0.3, y + 0.06], [0.2, y + 0.06], [0.2, y + 0.045], [-0.3, y + 0.045]], 0.076, 0, 0.004); // capot supérieur
    for (let i = 0; i < 6; i++) P.box('steel', 0.01, 0.03, 0.03, 0.036, y + 0.0, -0.1 - i * 0.032); // aérations
    P.box('steel', 0.02, 0.025, 0.04, 0.045, y + 0.03, 0.05); // levier d'armement
    // poignée creuse = logement du chargeur (chargeur long qui dépasse)
    P.prof('poly', [[-0.02, y - 0.055], [0.14, y - 0.055], [0.16, y - 0.24], [-0.01, y - 0.24]], 0.06, 0, 0.008);
    P.strip('steel', [[0.075, y - 0.2], [0.082, y - 0.3], [0.09, y - 0.4]], 0.15, 0.052, 0, 0.004); // chargeur 32 coups
    P.strip(acc, [[0.087, y - 0.37], [0.09, y - 0.4]], 0.152, 0.054, 0, 0.003);
    trigger(P, -0.14, y - 0.055 + 0.005);
    // garde-main court + poignée avant verticale
    P.prof('poly', [[-0.3, y + 0.04], [-0.46, y + 0.035], [-0.46, y - 0.045], [-0.3, y - 0.055]], 0.06, 0, 0.01);
    P.prof('poly', [[-0.4, y - 0.04], [-0.35, y - 0.04], [-0.34, y - 0.17], [-0.395, y - 0.17]], 0.04, 0, 0.006);
    // canon + silencieux court
    P.cyl('steel', 0.016, 0.1, 0, y + 0.005, -0.51, 'z', 10);
    P.cyl('poly', 0.036, 0.3, 0, y + 0.005, -0.66, 'z', 14);
    P.rings('receiver', 0.039, -0.53, -0.79, 4, 0, y + 0.005, 0.012);
    P.cyl('steel', 0.03, 0.012, 0, y + 0.005, -0.81, 'z', 14);
    // crosse fil rétractable : deux montants + plaque d'épaule
    P.cyl('steel', 0.009, 0.3, 0.032, y + 0.02, 0.35, 'z', 6); P.cyl('steel', 0.009, 0.3, -0.032, y + 0.02, 0.35, 'z', 6);
    P.cyl('steel', 0.009, 0.18, 0.0, y - 0.14, 0.495, 'y', 6); // jambe
    P.prof('poly', [[0.5, y + 0.03], [0.53, y + 0.03], [0.53, y - 0.14], [0.5, y - 0.14]], 0.07, 0, 0.006);
    P.cyl('steel', 0.009, 0.14, 0.032, y - 0.06, 0.5, 'y', 6); P.cyl('steel', 0.009, 0.14, -0.032, y - 0.06, 0.5, 'y', 6);
    // point rouge + hausse + mire
    P.rail('steel', -0.28, 0.18, y + 0.069, 0.04);
    reflexSight(P, -0.02, y + 0.078);
    sightPost(P, -0.44, y + 0.035);
  },

  // ---- Fusil à pompe (type Remington 870) ----
  shotgun(P, acc) {
    const y = 0.03;
    // boîtier
    P.prof('receiver', [[-0.15, y + 0.06], [0.22, y + 0.06], [0.22, y - 0.07], [0.03, y - 0.075], [-0.15, y - 0.06]], 0.08, 0, 0.008);
    P.box('steel', 0.01, 0.035, 0.1, 0.044, y + 0.025, 0.03); // fenêtre d'éjection
    // canon + tube magasin + garde-main bois à rainures
    P.cyl('steel', 0.025, 0.62, 0, y + 0.03, -0.45, 'z', 12);
    P.cyl('steel', 0.027, 0.5, 0, y - 0.03, -0.41, 'z', 12);
    P.box('steel', 0.018, 0.012, 0.6, 0, y + 0.058, -0.5); // rampe de visée
    sightPost(P, -0.75, y + 0.045, 'brass');
    P.cyl('steel', 0.03, 0.03, 0, y + 0.03, -0.77, 'z', 12);
    P.cyl('steel', 0.03, 0.025, 0, y - 0.03, -0.62, 'z', 12); // bouchon de tube
    // pompe (devant en bois)
    P.prof('wood', [[-0.12, y - 0.0], [-0.12, y - 0.09], [-0.5, y - 0.09], [-0.52, y - 0.0], [-0.5, y + 0.02]], 0.07, 0, 0.012);
    for (let i = 0; i < 7; i++) P.box('woodDark', 0.075, 0.016, 0.012, 0, y - 0.07, -0.16 - i * 0.04); // rainures
    // poignée pistolet + crosse bois
    P.prof('wood', [[0.22, y + 0.06], [0.56, y + 0.07], [0.64, y - 0.1], [0.62, y - 0.17], [0.5, y - 0.15], [0.3, y - 0.1], [0.22, y - 0.075]], 0.06, 0, 0.012);
    P.box('woodDark', 0.065, 0.2, 0.03, 0, y - 0.05, 0.64); // sabot
    P.box('steel', 0.066, 0.16, 0.006, 0, y - 0.04, 0.655);
    trigger(P, 0.07, y - 0.075 + 0.005);
    // cartouches sur le côté (bande)
    for (let i = 0; i < 4; i++) { P.cyl(acc, 0.012, 0.045, 0.046, y - 0.03, 0.12 - i * 0.032, 'z', 8); P.cyl('brass', 0.0125, 0.018, 0.046, y - 0.03, 0.14 - i * 0.032, 'z', 8); }
    P.box(acc, 0.082, 0.014, 0.06, 0, y + 0.062, 0.1); // plaque de culasse
  },

  // ---- Fusil de précision (bolt-action avec lunette) ----
  sniper(P, acc) {
    const y = 0.03;
    // châssis polymère : crosse à joue, garde-main long sous le canon
    P.prof('poly', [[0.74, y + 0.05], [0.56, y + 0.078], [0.24, y + 0.078], [0.2, y + 0.0], [-0.56, y + 0.0], [-0.56, y - 0.075], [0.0, y - 0.085], [0.3, y - 0.085], [0.42, y - 0.14], [0.58, y - 0.12], [0.66, y - 0.2], [0.75, y - 0.2]], 0.066, 0, 0.009);
    for (let i = 0; i < 5; i++) P.cyl('steel', 0.016, 0.07, 0, y - 0.035, -0.12 - i * 0.1, 'x', 10); // trous d'allègement
    P.prof('poly', [[0.06, y - 0.07], [0.15, y - 0.07], [0.18, y - 0.24], [0.11, y - 0.25]], 0.05, 0, 0.007); // poignée
    P.box(acc, 0.07, 0.03, 0.16, 0, y + 0.092, 0.5); // joue réglable
    P.box('steel', 0.07, 0.15, 0.025, 0, y - 0.125, 0.755); // plaque de couche
    // boîtier + chargeur interne
    P.cyl('receiver', 0.05, 0.38, 0, y + 0.02, 0.0, 'z', 12);
    P.box('receiver', 0.075, 0.04, 0.38, 0, y - 0.04, 0.0);
    P.box('steel', 0.01, 0.03, 0.14, 0.05, y + 0.03, 0.06); // fenêtre d'éjection
    // culasse + levier d'armement
    P.cyl('steel', 0.03, 0.14, 0, y + 0.02, 0.26, 'z', 10);
    P.cyl('steel', 0.01, 0.12, 0.09, y + 0.01, 0.2, 'x', 8);
    P.cyl('steel', 0.025, 0.026, 0.158, y + 0.01, 0.2, 'x', 10); // boule
    // long canon lourd + frein de bouche à fentes
    P.cyl('steel', 0.027, 0.75, 0, y + 0.02, -0.66, 'z', 12);
    P.cyl('steel', 0.02, 0.35, 0, y + 0.02, -1.2, 'z', 12);
    P.cyl('steel', 0.04, 0.16, 0, y + 0.02, -1.37, 'z', 12);
    for (let i = 0; i < 3; i++) P.box('poly', 0.085, 0.012, 0.018, 0, y + 0.02, -1.33 - i * 0.04);
    // bipied replié
    P.cyl('steel', 0.009, 0.3, 0.032, y - 0.098, -0.88, 'z', 6); P.cyl('steel', 0.009, 0.3, -0.032, y - 0.098, -0.88, 'z', 6);
    P.box('steel', 0.09, 0.03, 0.04, 0, y - 0.09, -0.74);
    // lunette 10x avec capuchons, tourelles et embase
    P.rail('steel', -0.25, 0.2, y + 0.075, 0.046);
    scope(P, -0.03, y + 0.17, 0.5, 0.037);
    P.cyl('poly', 0.058, 0.07, 0, y + 0.17, -0.31, 'z', 14); // pare-soleil
    P.cyl('lens', 0.05, 0.004, 0, y + 0.17, -0.348, 'z', 14);
  },

  // ---- Mitrailleuse de Midas (SMG à tambour doré, type Thompson) ----
  drum(P, acc) {
    const y = 0.03;
    P.prof('gold', [[-0.2, y + 0.065], [0.22, y + 0.065], [0.22, y - 0.07], [-0.2, y - 0.07]], 0.085, 0, 0.008);
    P.box('goldDark', 0.09, 0.012, 0.42, 0, y + 0.067, 0.01); P.box('goldDark', 0.09, 0.012, 0.42, 0, y - 0.07, 0.01);
    P.cyl('steel', 0.043, 0.5, 0, y + 0.0, -0.46, 'z', 12); // manchon de canon à ailettes
    P.rings('gold', 0.047, -0.25, -0.67, 9, 0, y, 0.016);
    P.cyl('steel', 0.02, 0.14, 0, y, -0.78, 'z', 10);
    P.cyl('gold', 0.034, 0.06, 0, y, -0.84, 'z', 10); // compensateur Cutts
    for (let i = 0; i < 3; i++) P.box('steel', 0.08, 0.012, 0.014, 0, y + 0.03, -0.83 - i * 0.015);
    // tambour plein or
    P.cyl('gold', 0.19, 0.12, 0, y - 0.22, -0.02, 'y', 20);
    P.cyl('steel', 0.2, 0.014, 0, y - 0.22, -0.02, 'y', 20);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P.box('steel', 0.11, 0.024, 0.014, Math.cos(a) * 0.11, y - 0.16, -0.02 + Math.sin(a) * 0.11, 0, -a, 0); } // nervures
    P.cyl('steel', 0.19, 0.012, 0, y - 0.28, -0.02, 'y', 20);
    P.cyl(acc, 0.052, 0.028, 0, y - 0.288, -0.02, 'y', 14);
    P.box('steel', 0.07, 0.18, 0.14, 0, y - 0.1, -0.02); // col du tambour
    // poignées bois (avant + arrière)
    P.prof('wood', [[0.02, y - 0.07], [0.14, y - 0.07], [0.165, y - 0.26], [0.09, y - 0.27]], 0.058, 0, 0.008);
    P.prof('wood', [[-0.3, y - 0.03], [-0.52, y - 0.03], [-0.52, y - 0.2], [-0.42, y - 0.23], [-0.32, y - 0.1]], 0.055, 0, 0.007);
    trigger(P, -0.04, y - 0.07 + 0.005);
    // crosse bois
    P.prof('wood', [[0.22, y + 0.06], [0.56, y + 0.04], [0.62, y - 0.12], [0.57, y - 0.17], [0.4, y - 0.1], [0.22, y - 0.07]], 0.062, 0, 0.01);
    P.box('goldDark', 0.066, 0.17, 0.02, 0, y - 0.06, 0.61);
    // levier d'armement + hausse + bande de rareté
    P.box('steel', 0.03, 0.03, 0.05, 0.05, y + 0.04, -0.08);
    P.box('steel', 0.03, 0.07, 0.02, 0, y + 0.1, 0.18); P.box('steel', 0.05, 0.012, 0.03, 0, y + 0.135, 0.18);
    P.box(acc, 0.09, 0.012, 0.1, 0, y + 0.07, -0.1);
  },

  // ---- Minigun de Brutus (canons rotatifs sur affût) ----
  minigun(P, acc) {
    const y = 0.03;
    // boîtier moteur
    P.cyl('receiver', 0.1, 0.46, 0, y, 0.06, 'z', 16);
    P.cyl('steel', 0.108, 0.04, 0, y, 0.3, 'z', 16);
    P.cyl('steel', 0.1, 0.03, 0, y, -0.18, 'z', 16);
    P.cyl(acc, 0.105, 0.025, 0, y, -0.13, 'z', 16);
    // alimentation + boîte à munitions + bande
    P.box('olive', 0.18, 0.14, 0.2, 0, y - 0.16, 0.06); P.box('steel', 0.19, 0.012, 0.21, 0, y - 0.09, 0.06);
    P.box('olive', 0.22, 0.2, 0.3, 0, y - 0.3, 0.1);
    P.box('steel', 0.23, 0.02, 0.31, 0, y - 0.2, 0.1);
    for (let i = 0; i < 9; i++) P.cyl('brass', 0.012, 0.05, 0.02 * (i % 2), y - 0.12 - i * 0.012, 0.0 + i * 0.012, 'x', 6);
    // poignées arrière + détente
    P.prof('steel', [[0.2, y + 0.0], [0.36, y + 0.0], [0.36, y - 0.04], [0.2, y - 0.04]], 0.2, 0, 0.004);
    P.cyl('poly', 0.02, 0.16, 0.1, y + 0.0, 0.34, 'y', 8); P.cyl('poly', 0.02, 0.16, -0.1, y + 0.0, 0.34, 'y', 8);
    P.prof('poly', [[0.1, y - 0.09], [0.22, y - 0.09], [0.24, y - 0.27], [0.17, y - 0.28]], 0.056, 0, 0.007); // poignée
    trigger(P, 0.02, y - 0.095);
    // faisceau de six canons + brides (tourne autour de l'axe pendant le tir)
    P.cyl('steel@spin', 0.16, 0.02, 0, y, -0.2, 'z', 18);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, cx = Math.cos(a) * 0.075, cy = Math.sin(a) * 0.075; P.cyl('steel@spin', 0.019, 0.72, cx, y + cy, -0.55, 'z', 10); }
    P.cyl('steel@spin', 0.1, 0.05, 0, y, -0.52, 'z', 14);
    P.cyl('receiver@spin', 0.13, 0.05, 0, y, -0.82, 'z', 16);
    P.cyl('steel@spin', 0.04, 0.5, 0, y, -0.56, 'z', 8); // axe central
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P.box('bright@spin', 0.012, 0.012, 0.05, Math.cos(a) * 0.075, y + Math.sin(a) * 0.075, -0.84); } // bouches
    P.cyl('poly', 0.115, 0.07, 0, y, -0.93, 'z', 16);
    P.prof('steel', [[0.0, y + 0.1], [-0.2, y + 0.1], [-0.2, y + 0.14], [0.0, y + 0.14]], 0.03, 0, 0.003); // poignée de transport
  },

  // ---- AR de Skye (type SCAR-H : polymère sable, chargeur droit, lunette ACOG) ----
  scar(P, acc) {
    const y = 0.03;
    P.prof('tan', [[-0.35, y + 0.075], [0.26, y + 0.07], [0.26, y - 0.08], [0.02, y - 0.09], [-0.35, y - 0.08]], 0.08, 0, 0.01);
    P.box('steel', 0.01, 0.04, 0.1, 0.044, y + 0.025, 0.0); // éjection
    P.prof('receiver', [[-0.35, y + 0.075], [-0.82, y + 0.058], [-0.82, y - 0.05], [-0.35, y - 0.06]], 0.075, 0, 0.008); // garde-main
    P.rail('steel', -0.88, 0.26, y + 0.082, 0.05);
    P.rail('steel', -0.8, -0.45, y - 0.06 - 0.016, 0.036);
    for (let i = 0; i < 6; i++) P.box('steel', 0.01, 0.03, 0.04, 0.039, y + 0.0, -0.42 - i * 0.07);
    // poignée + détente
    P.prof('tan', [[0.1, y - 0.09], [0.21, y - 0.09], [0.235, y - 0.28], [0.17, y - 0.29]], 0.058, 0, 0.007);
    trigger(P, 0.0, y - 0.09 + 0.005);
    // chargeur 20 coups légèrement courbe, sable
    P.strip('olive', [[-0.18, y - 0.09], [-0.18, y - 0.22], [-0.2, y - 0.36], [-0.24, y - 0.44]], 0.09, 0.058, 0, 0.004);
    P.strip(acc, [[-0.2, y - 0.34], [-0.24, y - 0.43]], 0.092, 0.06, 0, 0.003);
    // crosse pliable à joue réglable
    P.prof('tan', [[0.26, y + 0.07], [0.5, y + 0.06], [0.58, y + 0.04], [0.6, y - 0.12], [0.5, y - 0.17], [0.4, y - 0.1], [0.26, y - 0.08]], 0.06, 0, 0.01);
    P.box('poly', 0.066, 0.16, 0.025, 0, y - 0.04, 0.6);
    P.box('steel', 0.08, 0.03, 0.04, 0, y + 0.0, 0.26);
    // canon + frein de bouche + mire
    P.cyl('steel', 0.019, 0.3, 0, y, -0.95, 'z', 10);
    P.box('steel', 0.04, 0.08, 0.04, 0, y + 0.04, -0.8); sightPost(P, -0.8, y + 0.08);
    flashHider(P, -1.04, y, 0.026, 0.1);
    P.cyl('receiver', 0.026, 0.06, 0, y, -0.86, 'z', 8); // bloc de gaz
    // lunette de combat courte
    scope(P, 0.0, y + 0.16, 0.22, 0.035);
    P.box('receiver', 0.04, 0.05, 0.14, 0, y + 0.1, 0.0);
  },

  // ---- AR Lourd Peow Peow (type HK 417 / LMG : bipied, long chargeur, optique) ----
  heavyar(P, acc) {
    const y = 0.03;
    P.prof('olive', [[-0.28, y + 0.08], [0.24, y + 0.08], [0.24, y - 0.09], [0.02, y - 0.1], [-0.28, y - 0.09]], 0.09, 0, 0.01);
    P.prof('poly', [[-0.28, y + 0.07], [-0.86, y + 0.058], [-0.86, y - 0.055], [-0.28, y - 0.08]], 0.095, 0, 0.012); // garde-main épais
    for (let i = 0; i < 7; i++) { P.box('steel', 0.012, 0.03, 0.05, 0.048, y, -0.34 - i * 0.07); P.box('steel', 0.012, 0.03, 0.05, -0.048, y, -0.34 - i * 0.07); }
    P.rail('steel', -0.9, 0.24, y + 0.09, 0.056);
    // poignée + détente
    P.prof('poly', [[0.08, y - 0.1], [0.2, y - 0.1], [0.225, y - 0.29], [0.16, y - 0.3]], 0.06, 0, 0.007);
    trigger(P, -0.01, y - 0.1 + 0.005);
    // chargeur quasi droit 40 coups
    P.strip('poly', [[-0.16, y - 0.1], [-0.17, y - 0.26], [-0.2, y - 0.46], [-0.24, y - 0.56]], 0.1, 0.062, 0, 0.004);
    P.strip(acc, [[-0.2, y - 0.46], [-0.24, y - 0.55]], 0.102, 0.064, 0, 0.003);
    // crosse fixe à joue
    P.prof('olive', [[0.24, y + 0.08], [0.55, y + 0.075], [0.64, y - 0.0], [0.64, y - 0.2], [0.58, y - 0.2], [0.45, y - 0.1], [0.24, y - 0.09]], 0.065, 0, 0.012);
    P.box('poly', 0.07, 0.2, 0.025, 0, y - 0.1, 0.65);
    // canon lourd + manchon + bipied
    P.cyl('steel', 0.022, 0.3, 0, y, -0.98, 'z', 10);
    P.cyl('steel', 0.03, 0.14, 0, y, -1.0, 'z', 10); P.rings('receiver', 0.034, -0.94, -1.06, 3, 0, y, 0.012);
    flashHider(P, -1.12, y, 0.03, 0.1);
    P.box('steel', 0.04, 0.09, 0.04, 0, y + 0.06, -0.82); sightPost(P, -0.82, y + 0.1);
    P.box('steel', 0.12, 0.03, 0.06, 0, y - 0.07, -0.78); // embase de bipied
    P.cyl('steel', 0.01, 0.34, 0.05, y - 0.095, -0.9, 'z', 6); P.cyl('steel', 0.01, 0.34, -0.05, y - 0.095, -0.9, 'z', 6); // bipied replié
    // grande optique + télémètre
    P.rail('steel', -0.1, 0.2, y + 0.098, 0.05);
    scope(P, 0.05, y + 0.2, 0.34, 0.04);
    P.box('poly', 0.05, 0.05, 0.16, 0, y + 0.137, 0.05);
  },

  // ---- Arc Ka-Boom (arc à poulies avec flèche explosive) ----
  boombow(P, acc) {
    const y = 0.03;
    // poignée + fenêtre
    P.prof('woodDark', [[0.04, y + 0.2], [-0.06, y + 0.2], [-0.07, y + 0.0], [-0.04, y - 0.2], [0.05, y - 0.2], [0.07, y - 0.02]], 0.05, 0, 0.01);
    P.prof('wood', [[0.05, y + 0.05], [0.14, y + 0.05], [0.14, y - 0.12], [0.05, y - 0.12]], 0.055, 0, 0.012);
    P.box(acc, 0.058, 0.014, 0.05, 0, y + 0.07, 0.0);
    // branches (courbes) vers l'avant, haut et bas
    for (const s of [1, -1]) {
      P.strip('steel', [[-0.06, y + s * 0.2], [-0.13, y + s * 0.38], [-0.27, y + s * 0.52], [-0.45, y + s * 0.57]], 0.04, 0.045, 0, 0.005);
      P.strip('fire', [[-0.2, y + s * 0.45], [-0.27, y + s * 0.52]], 0.042, 0.047, 0, 0.003);
      P.cyl('steel', 0.04, 0.02, 0, y + s * 0.57, -0.45, 'x', 12); // poulie
      P.cyl('fire', 0.012, 0.03, 0, y + s * 0.57, -0.45, 'x', 8);
    }
    // câbles de poulies + corde
    const rope = (y0, z0, y1, z1) => { const dy = y1 - y0, dz = z1 - z0, l = Math.hypot(dy, dz); P.box('string', 0.009, 0.009, l, 0, (y0 + y1) / 2, (z0 + z1) / 2, Math.atan2(-dy, dz), 0, 0); };
    rope(y + 0.57, -0.45, y + 0.0, 0.14); rope(y - 0.57, -0.45, y + 0.0, 0.14);
    // flèche encochée avec pointe explosive, plumes et mire
    P.cyl('wood', 0.008, 0.8, 0, y + 0.0, -0.4, 'z', 6);
    P.cyl('fire', 0.032, 0.14, 0, y + 0.0, -0.87, 'z', 10, 0.006); // ogive
    P.cyl('steel', 0.034, 0.03, 0, y + 0.0, -0.78, 'z', 10);
    for (let i = 0; i < 3; i++) P.box('fire', 0.06, 0.003, 0.09, 0, y, -0.1, 0, 0, i * Math.PI / 3 + 0.5);
    P.box('steel', 0.04, 0.035, 0.012, 0.0, y + 0.03, 0.14); // arrêt de corde
    // stabilisateur
    P.cyl('steel', 0.01, 0.34, 0, y - 0.05, -0.2, 'z', 6); P.cyl('steel', 0.02, 0.03, 0, y - 0.05, -0.4, 'z', 8);
    // mire à pin
    P.cyl('steel', 0.025, 0.04, 0.0, y + 0.1, -0.12, 'x', 12);
    P.box('dot', 0.006, 0.006, 0.006, 0.0, y + 0.1, -0.12);
  },

  // ---- Grappin de Skye (lanceur de grappin avec bobine) ----
  grapple(P, acc) {
    const y = 0.03;
    // corps de pistolet à gros canon
    P.prof('receiver', [[-0.22, y + 0.07], [0.12, y + 0.07], [0.14, y - 0.06], [-0.2, y - 0.07]], 0.09, 0, 0.012);
    P.cyl('steel', 0.055, 0.34, 0, y + 0.02, -0.3, 'z', 14);
    P.cyl('receiver', 0.065, 0.04, 0, y + 0.02, -0.46, 'z', 14);
    P.cyl('steel', 0.04, 0.012, 0, y + 0.02, -0.482, 'z', 14); // bouche
    // crochet chargé
    P.cyl('bright', 0.01, 0.2, 0, y + 0.02, -0.5, 'z', 6);
    for (const a of [0, 2.1, 4.2]) { P.box('bright', 0.012, 0.07, 0.012, Math.sin(a) * 0.04, y + 0.02 + Math.cos(a) * 0.04, -0.62, 0.6 * Math.cos(a), 0, -a); }
    P.cyl('glow', 0.025, 0.04, 0, y + 0.02, -0.58, 'z', 10);
    // poignée + pontet
    P.prof('poly', [[0.02, y - 0.07], [0.13, y - 0.07], [0.16, y - 0.25], [0.09, y - 0.26]], 0.052, 0, 0.007);
    trigger(P, -0.05, y - 0.07 + 0.005);
    // bobine de câble sur le dessus + moteur
    P.cyl('steel', 0.1, 0.1, 0, y + 0.13, -0.05, 'x', 16);
    P.cyl('rope', 0.088, 0.075, 0, y + 0.13, -0.05, 'x', 16);
    P.cyl('steel', 0.025, 0.12, 0, y + 0.13, -0.05, 'x', 8);
    P.cyl('glow', 0.03, 0.01, 0.056, y + 0.13, -0.05, 'x', 10);
    P.cyl('steel', 0.04, 0.1, 0, y + 0.0, 0.2, 'z', 10); // bloc batterie
    P.box(acc, 0.05, 0.03, 0.09, 0, y + 0.075, 0.2);
    P.prof('poly', [[0.14, y + 0.04], [0.32, y + 0.02], [0.32, y - 0.08], [0.14, y - 0.06]], 0.06, 0, 0.01);
    // câble qui sort vers le crochet
    P.cyl('rope', 0.006, 0.4, 0, y + 0.05, -0.25, 'z', 5);
    P.box('steel', 0.02, 0.05, 0.02, 0, y + 0.1, -0.45);
  },
};

// Position de la bouche du canon (le tracer et l'éclair y naissent)
const MUZZLE = { ar: [0, 0.03, -1.1], smg: [0, 0.04, -0.86], shotgun: [0, 0.06, -0.86], sniper: [0, 0.05, -1.46], drum: [0, 0.03, -0.9], minigun: [0, 0.03, -1.0], scar: [0, 0.03, -1.12], heavyar: [0, 0.03, -1.2], boombow: [0, 0.03, -0.96], grapple: [0, 0.05, -0.5] };

const SPIN_Y = 0.03;
const geoCache = new Map();
function buildGeos(id, accKey) {
  const key = id;
  if (geoCache.has(key)) return geoCache.get(key);
  const P = new Parts();
  BUILDERS[id](P, accKey);
  const out = [];
  for (const [mk, list] of P.by) {
    const geo = mergeGeometries(list, false);
    list.forEach((g) => g.dispose());
    if (mk.endsWith('@spin')) geo.translate(0, -SPIN_Y, 0);
    geo.computeBoundingSphere();
    out.push([mk, geo]);
  }
  geoCache.set(key, out);
  return out;
}
export const SHARED_WEAPON_GEOS = new Set();

export const GUN_IDS = Object.keys(BUILDERS);

// Renvoie un Group prêt à être mis en main. rarity : index de couleur (0..5) fourni par le jeu.
export function buildGun(id, rarityColor, opts = {}) {
  const g = new THREE.Group();
  if (!BUILDERS[id]) return g;
  const geos = buildGeos(id, 'accent');
  let spin = null;
  for (const [mk, geo] of geos) {
    SHARED_WEAPON_GEOS.add(geo);
    const base = mk.split('@')[0];
    const m = new THREE.Mesh(geo, base === 'accent' ? accentMat(rarityColor) : mat(base));
    m.castShadow = opts.shadow !== false;
    if (mk.endsWith('@spin')) {
      if (!spin) { spin = new THREE.Object3D(); spin.position.y = SPIN_Y; g.add(spin); }
      spin.add(m);
    } else g.add(m);
  }
  if (spin) g.userData.spin = spin;
  const mz = MUZZLE[id] || [0, 0.03, -0.9];
  const o = new THREE.Object3D(); o.position.set(mz[0], mz[1], mz[2]); g.add(o); g.userData.muzzle = o;
  g.userData.id = id;
  return g;
}
