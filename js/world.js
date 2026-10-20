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
  { name: 'La Grotte', key: 'grotto', spy: true, x: 292, z: 169, r: 34, style: 'grotto' },
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
  return h;
}

export function inPOI(x, z, pad = 0) {
  for (const p of POIS) if (Math.hypot(x - p.x, z - p.z) < p.r + pad) return p;
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
