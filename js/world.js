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
  // La Grotte : cratère d'entrée creusé dans le plateau (fond plat à craterY)
  {
    const gd = Math.hypot(x - GROTTO.cx, z - GROTTO.cz);
    if (gd < GROTTO.craterR) h = GROTTO.craterY + (h - GROTTO.craterY) * smooth(GROTTO.craterFlat, GROTTO.craterR, gd);
  }
  // Entaille de la bouche du tunnel : la colline est évidée juste au-dessus du
  // plafond rocheux du tunnel sur les premiers mètres (entrée encastrée, sombre)
  {
    const dx = x - GROTTO.cx, dz = z - GROTTO.cz;
    const along = dx * GROTTO.ux + dz * GROTTO.uz;
    if (along > GROTTO.mouthD - 1 && along < GROTTO.mouthD + 5) {
      const perp = Math.hypot(dx - GROTTO.ux * along, dz - GROTTO.uz * along);
      // l'évidage doit dépasser le PLUS HAUT dessus des dalles couvrantes :
      // indice minimal des dalles qui couvrent ce point (bord à ±0,53 m)
      const step = Math.max(0, Math.min(14, Math.ceil(along - (GROTTO.mouthD + 0.5) - 0.53)));
      // deux phases : (1) approche de la bouche = ravin praticable EXACTEMENT au
      // niveau du cratère et de la première marche (17) — plus haut, le joueur
      // remontant du tunnel serait enterré dans le terrain et chuterait à travers ;
      // (2) au-delà, l'évidage suit le dessus des dalles de plafond (+0,4 m) :
      // les dalles restent enfouies juste sous le fond du ravin, le tunnel reste couvert
      const carve = along < GROTTO.mouthD + 0.5 ? GROTTO.floor0 : GROTTO.floor0 - 0.5 * step + 5.25;
      if (h > carve) h = carve + (h - carve) * smooth(3.7, 4.8, perp);
    }
  }
  return h;
}

export function inPOI(x, z, pad = 0) {
  for (const p of POIS) if (Math.hypot(x - p.x, z - p.z) < p.r + pad) return p;
  return null;
}

// La Grotte : cratère d'entrée + tunnel descendant + caverne (les coordonnées sont
// utilisées par world.js pour le cratère, et par main.js pour la coque rocheuse).
//   cx/cz         : centre du cratère (et du POI)
//   craterY        : fond du cratère (17), à plat jusqu'à craterFlat (8), fondu jusqu'à craterR (17)
//   ux/uz          : direction unitaire du tunnel (plein ouest, aligné aux axes)
//   mouthD/endD    : entrée du tunnel à 9,5 m du centre, il débouche à 25,5 m
//   floor0/floor1  : sol du tunnel : 17 (entrée) -> 10 (caverne), marches de 0,5 m
//   cavernX/Z, cavernR : centre et rayon de la caverne, sol 10, voûte ~21,5
export const GROTTO = {
  cx: 200, cz: 165, craterR: 17, craterFlat: 8, craterY: 17,
  ux: -1, uz: 0, mouthD: 9.5, endD: 25.5, floor0: 17, floor1: 10,
  cavernX: 171, cavernZ: 165, cavernR: 13.5,
};
const _gclamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Empreinte souterraine de la Grotte (cratère + couloir du tunnel + caverne) :
// le moteur s'en sert pour savoir qu'un point SOUS le terrain est dans la grotte
// (le sol y est fait de colliders rocheux, plus de terrain au-dessus de la tête).
export function inGrotto(x, z) {
  const dx = x - GROTTO.cx, dz = z - GROTTO.cz;
  const d = Math.hypot(dx, dz);
  if (d < GROTTO.craterR + 1) return true;
  const t = _gclamp((dx * GROTTO.ux + dz * GROTTO.uz - GROTTO.mouthD) / (GROTTO.endD - GROTTO.mouthD), 0, 1);
  const ad = GROTTO.mouthD + t * (GROTTO.endD - GROTTO.mouthD);
  if (Math.hypot(dx - GROTTO.ux * ad, dz - GROTTO.uz * ad) < 5) return true;
  return Math.hypot(x - GROTTO.cavernX, z - GROTTO.cavernZ) < GROTTO.cavernR + 2;
}

// Plafond caméra de la Grotte : hauteur maximale que la caméra tierce personne peut
// prendre dans le tunnel et la caverne (juste sous les dalles de plafond), pour
// qu'elle ne glisse jamais au-dessus de la voûte dans la roche. Retourne null
// ailleurs (cratère à ciel ouvert, extérieur).
export function grottoCamCeil(x, z) {
  const dx = x - GROTTO.cx, dz = z - GROTTO.cz;
  const along = dx * GROTTO.ux + dz * GROTTO.uz;
  const perp = Math.hypot(dx - GROTTO.ux * along, dz - GROTTO.uz * along);
  // couloir du tunnel (marches + plafond) : prioritaire, il traverse la caverne.
  // Dalle couvrante la PLUS BASSE (indice maximal) : la limite reste sous tous
  // les plafonds présents, y compris dans les zones de recouvrement des dalles.
  if (along >= GROTTO.mouthD - 1 && along <= GROTTO.endD && perp < 5.4) {
    const step = Math.max(0, Math.min(14, Math.floor(along - (GROTTO.mouthD + 0.5) + 0.53)));
    return GROTTO.floor0 - 0.5 * step + 3.45 - 0.4;
  }
  // caverne : voûte à 21,5 (dalles de 21,5 à 22,9)
  if (Math.hypot(x - GROTTO.cavernX, z - GROTTO.cavernZ) < GROTTO.cavernR + 1) return 21.1;
  return null;
}

// Sol rocheux sous la caméra dans la Grotte : marche la PLUS HAUTE qui couvre le
// point (indice minimal des dalles couvrantes), ou dalle du sol de la caverne.
// Sert de plancher caméra pour qu'elle ne s'enfonce jamais dans une marche.
export function grottoCamFloor(x, z) {
  const dx = x - GROTTO.cx, dz = z - GROTTO.cz;
  const along = dx * GROTTO.ux + dz * GROTTO.uz;
  const perp = Math.hypot(dx - GROTTO.ux * along, dz - GROTTO.uz * along);
  if (along >= GROTTO.mouthD - 1 && along <= GROTTO.endD && perp < 5.4) {
    const step = Math.max(0, Math.min(14, Math.ceil(along - (GROTTO.mouthD + 0.5) - 0.53)));
    return GROTTO.floor0 - 0.5 * step;
  }
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
