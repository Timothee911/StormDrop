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
  { name: "L'Agence", key: 'agency', spy: true, x: 0, z: 0, r: 42, style: 'agency' },
  { name: 'Le Requin', key: 'shark', spy: true, x: -292, z: -246, r: 31, style: 'shark' },
  { name: 'Le Yacht', key: 'yacht', spy: true, x: 412, z: -82, r: 24, style: 'yacht' },
  // La Grotte est sur la grande île : un cratère creusé dans la colline de la toundra
  // descend vers une vraie caverne souterraine (tunnel + salle voûtée sous le plateau).
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
// La Grotte : la montagne est retirée — tout le POI s'abaisse à 24 (GROTTO.bowlH).
// La caverne reste souterraine sous sa voûte, mais le plateau au-dessus n'est plus
// une colline : la grotte vit « en dessous de la carte », à flanc de terrain plat.
POIS.find((p) => p.key === 'grotto').h = 24;

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
  // La Grotte : grand trou béant dans la voûte — le terrain s'y effondre en
  // cheminée jusqu'au sol de la caverne : 2e entrée (on peut y sauter depuis le
  // plateau). Profil en deux étages : plat au fond (la caverne reste en roche,
  // pas d'herbe), pente douce sur 4 m, puis falaise raide (cachée derrière les
  // murs de la caverne) qui remonte au plateau 24. La physique reste continue
  // avec le maillage rendu (pas de sol invisible : transition lisse).
  {
    const dx = Math.max(0, Math.abs(x - GROTTO.holeX) - GROTTO.holeHX);
    const dz = Math.max(0, Math.abs(z - GROTTO.holeZ) - GROTTO.holeHZ);
    const d = Math.hypot(dx, dz);
    if (d < GROTTO.holeBlend) {
      const t = smooth(0, GROTTO.holeBlend, d);
      h = GROTTO.holeY + (h - GROTTO.holeY) * t * t * t;
    }
  }
  // Rampe d'accès à ciel ouvert : grande tranchée qui descend du plateau (24)
  // jusqu'à la caverne (10,4) — la partie x 180-184 passe sous l'arche rocheuse
  // (bande est de la voûte), bords fondus sur 5 m — aucune façade, aucune porte :
  // le début de la grotte est grand ouvert
  {
    if (x > GROTTO.rampX0 && x < GROTTO.rampX1 + 2) {
      const t = Math.min(1, Math.max(0, (GROTTO.rampX1 - x) / (GROTTO.rampX1 - GROTTO.rampX0)));
      const floor = GROTTO.rampH0 + (GROTTO.rampH1 - GROTTO.rampH0) * t;
      const perp = Math.abs(z - GROTTO.cz);
      if (perp < GROTTO.rampHalfZ + GROTTO.rampBlend)
        h = floor + (h - floor) * smooth(GROTTO.rampHalfZ, GROTTO.rampHalfZ + GROTTO.rampBlend, perp);
    }
  }
  return h;
}

export function inPOI(x, z, pad = 0) {
  for (const p of POIS) if (Math.hypot(x - p.x, z - p.z) < p.r + pad) return p;
  return null;
}

// La Grotte : plateau abaissé à 24 (montagne retirée) + grande rampe à ciel
// ouvert + caverne voûtée percée d'un trou béant. Solide mais sous la carte.
//   bowlH          : hauteur du plateau du POI (24)
//   holeX/Z, holeHX/HZ, holeY : trou béant dans la voûte (rectangle) et fond de
//                              la cheminée (9,6 = sol de la caverne)
//   rampX0/X1, rampHalfZ, rampH0/H1 : tranchée de la rampe (x 184->222, sol 24->10,4)
//   cavernX/Z, cavernR, floor1 : caverne (sol 10, voûte ~21,5)
export const GROTTO = {
  cx: 200, cz: 165, bowlH: 24,
  holeX: 171, holeZ: 165, holeHX: 9.9, holeHZ: 9.2, holeY: 9.6, holeBlend: 10,
  rampX0: 180, rampX1: 222, rampHalfZ: 5.5, rampBlend: 7, rampH0: 24, rampH1: 10.4,
  cavernX: 171, cavernZ: 165, cavernR: 13.5, floor1: 10,
};
// Empreinte souterraine de la Grotte (caverne sous la voûte + bouche de la
// rampe sous l'arche rocheuse) : le moteur s'en sert pour savoir qu'un point SOUS
// le terrain est dans la grotte (le sol y est fait de colliders rocheux).
export function inGrotto(x, z) {
  if (Math.hypot(x - GROTTO.cavernX, z - GROTTO.cavernZ) < GROTTO.cavernR + 2) return true;
  return x > GROTTO.rampX0 - 1 && x < GROTTO.cavernX + GROTTO.cavernR + 1 && Math.abs(z - GROTTO.cz) < 6;
}

// Plafond caméra de la Grotte : hauteur maximale que la caméra tierce personne peut
// prendre dans le tunnel et la caverne (juste sous les massifs de plafond), pour
// qu'elle ne glisse jamais au-dessus de la voûte dans la roche. Retourne null
// ailleurs (cratère à ciel ouvert, extérieur).
export function grottoCamCeil(x, z) {
  // caverne : massifs de voûte de 19,5 à 24,5 — le trou béant central est
  // couvert par la cheminée du terrain, la caméra reste sous les massifs
  if (Math.hypot(x - GROTTO.cavernX, z - GROTTO.cavernZ) < GROTTO.cavernR + 2) return 18.6;
  return null;
}

// Sol rocheux sous la caméra dans la Grotte : marche la PLUS HAUTE qui couvre le
// point (indice minimal des dalles couvrantes), ou dalle du sol de la caverne.
// Sert de plancher caméra pour qu'elle ne s'enfonce jamais dans une marche.
export function grottoCamFloor(x, z) {
  // caverne : dalle du sol à 10 ; la rampe est un vrai terrain, pas besoin
  if (Math.hypot(x - GROTTO.cavernX, z - GROTTO.cavernZ) < GROTTO.cavernR + 1) return GROTTO.floor1;
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
