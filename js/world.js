// Terrain, noise and map data (deterministic)
// Une île ~2,3x plus large que la version initiale pour retrouver l'échelle
// d'une grande carte battle royale, sans changer l'échelle des bâtiments.
export const ISLAND_R = 400;
export const WORLD_R = 480;
export const CELL = 4;

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(i, j) {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function vnoise(x, z) {
  const i = Math.floor(x), j = Math.floor(z);
  const fx = x - i, fz = z - j;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z) {
  let s = 0, a = 0.5, f = 1;
  for (let k = 0; k < 4; k++) { s += a * vnoise(x * f, z * f); f *= 2.03; a *= 0.5; }
  return s / 0.9375;
}
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function coastR(x, z) {
  const ang = Math.atan2(z, x);
  return ISLAND_R * (0.86 + 0.14 * vnoise(Math.cos(ang) * 2.2 + 5, Math.sin(ang) * 2.2 + 5));
}

function rawH(x, z) {
  const r = Math.hypot(x, z);
  const coast = coastR(x, z);
  const m = 1 - smooth(coast * 0.72, coast, r);
  const hills = fbm(x * 0.011 + 3, z * 0.011 + 7);
  const mount = Math.max(0, fbm(x * 0.006 + 11, z * 0.006 + 2) - 0.48) * 2.2;
  const h = 2.2 + hills * 9 + mount * mount * 46;
  return h * m + (1 - m) * -6;
}

// Carte inspirée du Chapitre 2 Saison 2 : cinq POI espions (L'Agence au
// centre, Le Requin, Le Yacht, La Grotte, La Plateforme) + lieux classiques.
export const POIS = [
  { name: "L'Agence", key: 'agency', spy: true, x: 0, z: 0, r: 62, style: 'agency' },
  { name: 'Le Requin', key: 'shark', spy: true, x: -292, z: -246, r: 31, style: 'shark' },
  { name: 'Le Yacht', key: 'yacht', spy: true, x: 412, z: -82, r: 24, style: 'yacht' },
  // La Grotte est sur la grande île : une caverne SÈCHE cachée sous une
  // montagne rocheuse, entrée par la bouche du crâne géant face à l'océan.
  { name: 'La Grotte', key: 'grotto', spy: true, x: 200, z: 165, r: 46, style: 'grotto' },
  { name: 'La Plateforme', key: 'rig', spy: true, x: -356, z: 192, r: 30, style: 'rig' },
  { name: 'Bois-Joli', x: -164, z: -132, r: 34, style: 'wood' },
  { name: 'Port-Rouillé', x: 219, z: 87, r: 37, style: 'brick' },
  { name: 'Ferme Fumante', x: -96, z: 187, r: 32, style: 'wood' },
  { name: 'Colline Cobalt', x: 78, z: -210, r: 32, style: 'adobe' },
  { name: 'Oasis Sèche', x: 237, z: -132, r: 30, style: 'adobe' },
  { name: 'Plage Coquillage', x: -265, z: 164, r: 29, style: 'beach' },
  { name: 'Docks Dorés', x: -256, z: 41, r: 32, style: 'brick' },
  { name: 'Village Vent', x: 119, z: 101, r: 34, style: 'wood' },
  { name: 'Mont Grêle', x: 160, z: 247, r: 28, style: 'chalet' },
  { name: 'Chalets Givrés', x: 41, z: 256, r: 28, style: 'chalet' },
];
for (const p of POIS) p.h = Math.max(2.5, rawH(p.x, p.z));
// La Grotte : le POI reste un plateau (13,4) côté île mais la caverne est
// désormais SÈCHE (sol 3,4, au-dessus de la mer) et entièrement CACHÉE sous
// la montagne rocheuse : plus de rampe à ciel ouvert ni de cheminée — la seule
// entrée est la bouche du crâne (façade EST face à l'océan), au bout d'un
// canyon sec qui descend vers la mer.
POIS.find((p) => p.key === 'grotto').h = 13.4;
// L'Agence : légèrement surélevée (9) pour que son sous-sol (coffre-fort) reste
// au-dessus du niveau de la mer.
POIS.find((p) => p.key === 'agency').h = 9;

export function terrainH(x, z) {
  let h = rawH(x, z);
  for (let i = 0; i < POIS.length; i++) {
    const p = POIS[i];
    const dx = x - p.x, dz = z - p.z;
    const d2 = dx * dx + dz * dz, lim = p.r * 1.7;
    if (d2 < lim * lim) {
      const t = 1 - smooth(p.r, lim, Math.sqrt(d2));
      h += (p.h - h) * t;
    }
  }
  // La Grotte : le terrain s'abaisse légèrement sous l'empreinte de la caverne
  // pour ne jamais traverser son sol — ce creusement est CACHÉ sous la voûte
  // rocheuse (plus de cheminée : la montagne est pleine au-dessus de la salle).
  {
    const dx = Math.max(0, Math.abs(x - GROTTO.holeX) - GROTTO.holeHX);
    const dz = Math.max(0, Math.abs(z - GROTTO.holeZ) - GROTTO.holeHZ);
    const d = Math.hypot(dx, dz);
    if (d < GROTTO.holeBlend) {
      const t = smooth(0, GROTTO.holeBlend, d);
      h = GROTTO.holeY + (h - GROTTO.holeY) * t * t * t;
    }
  }
  // Canyon sec de la Grotte : palier plat à floor1 devant la façade du crâne
  // puis pente continue qui descend vers la mer — on entre à pied sec, sans
  // jamais nager (l'eau de mer s'arrête au bas de la pente).
  {
    if (x > GROTTO.coveX0 && x < GROTTO.coveX1) {
      const t = (x - GROTTO.coveX0) / (GROTTO.coveX1 - GROTTO.coveX0);
      const w = GROTTO.coveW0 + (GROTTO.coveW1 - GROTTO.coveW0) * t;
      const perp = Math.abs(z - GROTTO.cz);
      if (perp < w + GROTTO.coveBlend) {
        const slope = smooth(GROTTO.coveFlatX1, GROTTO.coveX1, x);
        const floor = GROTTO.floor1 + (GROTTO.coveSeaFloor - GROTTO.floor1) * slope;
        h = floor + (h - floor) * smooth(w, w + GROTTO.coveBlend, perp);
      }
    }
  }
  // Sous-sol de l'Agence : le terrain s'abaisse sous le bâtiment (la cave du
  // coffre-fort) — les dalles et escaliers du bâtiment servent de sol.
  {
    if (x > AGENCY_BASE.x0 && x < AGENCY_BASE.x1 && z > AGENCY_BASE.z0 && z < AGENCY_BASE.z1)
      h = Math.min(h, AGENCY_BASE.floor);
  }
  return h;
}

export function inPOI(x, z, pad = 0) {
  for (const p of POIS) if (Math.hypot(x - p.x, z - p.z) < p.r + pad) return p;
  return null;
}

// La Grotte : caverne SÈCHE (sol 3,4, au-dessus du niveau de la mer) entièrement
// cachée sous la montagne rocheuse. PLUS D'OUVERTURE CÔTÉ ÎLE : la rampe à ciel
// ouvert et la cheminée sont supprimées, la voûte est pleine. La seule entrée
// est la bouche du crâne géant (façade EST face à l'océan), au bout d'un canyon
// sec qui descend vers la mer.
//   bowlH          : hauteur du plateau du POI (13,4)
//   holeX/Z, holeHX/HZ, holeY : creusement du terrain SOUS la caverne (empreinte
//                              cachée sous la voûte rocheuse, jamais visible)
//   cavernX/Z, cavernR, floor1 : caverne (sol 3,4 AU-DESSUS de la mer,
//                              voûte ~12,9 : on n'y nage plus jamais)
//   mouthHalfZ : demi-largeur de la bouche du crâne (passage dans la façade)
//   coveX0/X1, coveFlatX1, coveW0/W1, coveBlend, coveSeaFloor : canyon sec —
//       palier plat à floor1 devant la façade (jusqu'à coveFlatX1) puis pente
//       continue qui descend vers la mer (sous le niveau de l'eau à coveX1)
export const GROTTO = {
  cx: 240, cz: 165, bowlH: 13.4,
  holeX: 269, holeZ: 165, holeHX: 9.9, holeHZ: 9.2, holeY: 2.6, holeBlend: 10,
  cavernX: 269, cavernZ: 165, cavernR: 13.5, floor1: 3.4,
  mouthHalfZ: 5.5,
  coveX0: 280, coveX1: 303, coveFlatX1: 287, coveW0: 9, coveW1: 16, coveBlend: 8, coveSeaFloor: -3.5,
};
// Sous-sol de l'Agence (bâtiment centré en 0,0) : empreinte de la cave et
// hauteur du plancher de la cave. Le terrain y est abaissé (AGENCY_BASE.floor)
// sous les dalles du bâtiment — la physique y est celle des colliders.
// L'Agence est agrandie d'un facteur AGENCY_K (x, z) : mêmes hauteurs, plan 1,5x plus grand.
export const AGENCY_K = 1.5;
// Les bornes sont calées sur la grille du maillage terrain (cellule 3,375 m) : le dernier sommet creusé
// tombe sous le mur de la cave (x ±20,25) ou sous le soubassement (z ±16,875), jamais dans la salle.
export const AGENCY_BASE = { x0: -20.4, x1: 20.4, z0: -17.0, z1: 17.0, floor: 3.45, camCeil: 8.5 };
export function inAgencyBasement(x, z) {
  return x > AGENCY_BASE.x0 && x < AGENCY_BASE.x1 && z > AGENCY_BASE.z0 && z < AGENCY_BASE.z1;
}
// Empreinte souterraine de la Grotte (caverne sous la voûte + bouche du crâne
// et son palier sec) : le moteur s'en sert pour savoir qu'un point SOUS le
// terrain est dans la grotte (le sol y est fait de colliders rocheux).
export function inGrotto(x, z) {
  if (Math.hypot(x - GROTTO.cavernX, z - GROTTO.cavernZ) < GROTTO.cavernR + 2) return true;
  // bouche du crâne + palier sec devant la façade (côté océan)
  return x > GROTTO.coveX0 - 1 && x < GROTTO.coveFlatX1 && Math.abs(z - GROTTO.cz) < GROTTO.mouthHalfZ + 1.5;
}

// Plafond caméra de la Grotte : hauteur maximale que la caméra tierce personne
// peut prendre dans la caverne et la bouche du crâne (juste sous les massifs de
// plafond), pour qu'elle ne glisse jamais au-dessus de la voûte dans la roche.
// Retourne null ailleurs (extérieur, canyon à ciel ouvert).
export function grottoCamCeil(x, z) {
  // bouche du crâne : le mur frontal (y 8,8) coiffe le passage, la caméra
  // reste sous le visage (x 281,3-284,7, côté océan)
  if (x > GROTTO.coveX0 + 1.3 && x < GROTTO.coveX0 + 4.7 && Math.abs(z - GROTTO.cz) < GROTTO.mouthHalfZ + 1) return 7.9;
  // caverne : massifs de voûte de 12,9 à 17,9 — la voûte est PLEINE (plus de
  // cheminée), la caméra reste sous les massifs
  if (Math.hypot(x - GROTTO.cavernX, z - GROTTO.cavernZ) < GROTTO.cavernR + 2) return 12;
  return null;
}

// Sol rocheux sous la caméra dans la Grotte : marche la PLUS HAUTE qui couvre le
// point (indice minimal des dalles couvrantes), ou dalle du sol de la caverne.
// Sert de plancher caméra pour qu'elle ne s'enfonce jamais dans une marche.
export function grottoCamFloor(x, z) {
  // caverne : dalle du sol
  if (Math.hypot(x - GROTTO.cavernX, z - GROTTO.cavernZ) < GROTTO.cavernR + 1) return GROTTO.floor1;
  // palier de la bouche du crâne (côté océan) : sol plat
  if (x > GROTTO.coveX0 - 0.5 && x < GROTTO.coveFlatX1 && Math.abs(z - GROTTO.cz) < GROTTO.mouthHalfZ + 1) return GROTTO.floor1;
  return null;
}

// Biomes: snow (south-east hills), desert (north-east), forest (west), plains, beach (coast)
export function biomeW(x, z) {
  const n = (vnoise(x * 0.02 + 50, z * 0.02 + 9) - 0.5) * 30;
  const snow = smooth(40, 75, z + n) * smooth(-25, 5, x + n);
  const desert = smooth(-40, -70, z + n) * smooth(-5, 25, x - n);
  const forest = smooth(-30, -60, x + n) * (1 - snow) * (1 - desert);
  return { snow, desert, forest };
}
export function biomeAt(x, z) {
  const b = biomeW(x, z);
  if (b.snow > 0.5) return 'snow';
  if (b.desert > 0.5) return 'desert';
  if (b.forest > 0.5) return 'forest';
  return 'plains';
}
export const BIOME_NAMES = { snow: 'Toundra', desert: 'Désert', forest: 'Forêt', plains: 'Prairies', beach: 'Plage' };
