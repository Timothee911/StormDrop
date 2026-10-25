// Bespoke Agency headquarters. All dimensions are in metres relative to the POI.
// Reference silhouette: pale limestone, stepped wings, round bastions and blue GHOST flags.
export function buildAgency(p, api) {
  const { THREE, box, deco, mat, collider, sides, wall, frame, chest, ammo, lootSpots, disc } = api;
  const C = { stone: 0xd8d7cf, trim: 0xf0eee4, seam: 0xb7b6af, dark: 0x333d47, blue: 0x234e86, glass: 0x527587, floor: 0xb8b4a9 };
  const g = p.h + 0.2, basement = p.h - 4;
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 40);
  const solid = (x, y, z, w, h, d, color = C.stone, fixed = false) =>
    box(p.x + x, y, p.z + z, w, h, d, mat(color), { hp: 350, mat: 'stone', indestructible: fixed });
  const detail = (x, y, z, w, h, d, color = C.trim, ry = 0) =>
    deco(BOX, color, p.x + x, y + h / 2, p.z + z, w, h, d, 0, ry, 0);
  const cylinder = (x, y, z, diameter, h, color) =>
    deco(CYL, color, p.x + x, y + h / 2, p.z + z, diameter, h, diameter);

  // Slabs are split around real stairwells, never covered by an invisible floor.
  function slab(y, x0, x1, z0, z1, holes = []) {
    let rects = [[x0, x1, z0, z1]];
    for (const [a, b, c, d] of holes) {
      const next = [];
      for (const [l, r, n, s] of rects) {
        const u = Math.max(l, a), v = Math.min(r, b), w = Math.max(n, c), t = Math.min(s, d);
        if (u >= v || w >= t) { next.push([l, r, n, s]); continue; }
        next.push([l, u, n, s], [v, r, n, s], [u, v, n, w], [u, v, t, s]);
      }
      rects = next.filter(([l, r, n, s]) => r - l > 0.02 && s - n > 0.02);
    }
    for (const [l, r, n, s] of rects) solid((l + r) / 2, y - 0.22, (n + s) / 2, r - l, 0.22, s - n, C.floor, true);
  }
  function stairs(x, z0, z1, low, high, width = 3.4) {
    // Visual stair treads + a continuous slope for smooth collision in both directions.
    for (let i = 0; i < 20; i++) {
      const z = z0 + (z1 - z0) * (i + 0.5) / 20;
      const top = low + (high - low) * (i + 1) / 20;
      detail(x, top - 0.18, z, width, 0.18, (z1 - z0) / 20 + 0.02, C.floor);
    }
    collider({ type: 'slope', axis: 'z', e0: p.z + z0, e1: p.z + z1, y0: low, y1: high,
      minX: p.x + x - width / 2, maxX: p.x + x + width / 2,
      minZ: p.z + z0, maxZ: p.z + z1, minY: low, maxY: high });
    // Low side stringers do not obstruct the player.
    for (const sx of [-1, 1]) for (let i = 0; i < 20; i++) {
      const top = low + (high - low) * (i + 1) / 20;
      detail(x + sx * (width / 2 + 0.08), top, z0 + (z1 - z0) * (i + 0.5) / 20, 0.12, 0.35, (z1 - z0) / 20, C.dark);
    }
  }
  function facade(cx, cz, w, d, y, height, entrances = false) {
    for (const [i, side] of sides(p.x + cx, p.z + cz, w, d).entries()) {
      const count = Math.max(2, Math.floor(side.len / 3.3));
      const openings = [];
      for (let k = 0; k < count; k++) {
        const u = -side.len / 2 + (k + 0.5) * side.len / count;
        const door = entrances && (i === 0 || i === 2) && Math.abs(u) < 2.2;
        openings.push({ u, w: door ? 2.8 : 1.25, y0: door ? 0 : 0.85, y1: door ? 3.3 : height - 0.65 });
      }
      wall(side, y, height, 0.55, openings, C.stone, { hp: 350, mat: 'stone' });
      for (const op of openings) {
        if (op.y0 === 0) continue;
        frame(side, y, op, 0.55, C.dark, op.side);
      }
      // Thin horizontal masonry joints rather than oversized gold decoration.
      for (let h = 0.7; h < height; h += 0.75) {
        if (side.ax === 'x') detail(cx, y + h, side.z - p.z + side.out * 0.285, w, 0.025, 0.015, C.seam);
        else detail(side.x - p.x + side.out * 0.285, y + h, cz, 0.015, 0.025, d, C.seam);
      }
    }
  }

  // Sealed lower storey: the vault is below the lobby, surrounded by foundation walls.
  slab(basement, -20, 20, -15, 15);
  for (const z of [-15, 15]) solid(0, basement, z, 40.5, g - basement, 0.65, C.dark, true);
  for (const x of [-20, 20]) solid(x, basement, 0, 0.65, g - basement, 30.5, C.dark, true);
  const basementHole = [-18.1, -13.9, -2, 8.5];
  slab(g, -20, 20, -15, 15, [basementHole]);
  stairs(-16, 0, 8, basement, g);
  // Basement security partition with a 3m-wide passage to the vault corridor.
  solid(-2, basement, -2, 0.4, 3.9, 25, C.dark, true);
  detail(-9, basement + 0.02, 0, 2.3, 0.025, 7, C.blue);
  for (const z of [-10, -4, 3, 10]) detail(-18.8, basement + 3.3, z, 0.18, 0.12, 1.8, 0x97c8d8);
  // Interior wayfinding: arrow at the stairs and a blue runner to the security door.
  detail(-12, g + 0.02, 9.5, 8, 0.025, 1.2, C.blue);
  detail(-16, g + 0.03, 8.8, 2.5, 0.03, 0.35, 0xf4d078);

  // Two broad floors, an open double-height lobby and internal upper staircase.
  facade(0, 0, 40, 30, g, 4.2, true);
  facade(0, 0, 40, 30, g + 4.2, 4.2);
  const upperHole = [13.9, 18.1, -2, 8.5];
  slab(g + 4.2, -20, 20, -15, 15, [upperHole, [-5, 5, -4, 6]]);
  stairs(16, 0, 8, g, g + 4.2);
  slab(g + 8.4, -20.4, 20.4, -15.4, 15.4, [[13.9, 18.1, -2, 8.5]]);
  stairs(16, 0, 8, g + 4.2, g + 8.4);
  for (const x of [-20.2, 20.2]) solid(x, g + 8.4, 0, 0.3, 0.8, 30.8, C.trim);
  for (const z of [-15.2, 15.2]) solid(0, g + 8.4, z, 40.8, 0.8, 0.3, C.trim);
  // Reception, central emblem and office furniture kept out of the routes.
  solid(0, g, -7.5, 8, 1.1, 1.5, C.dark);
  detail(0, g + 1.1, -7.5, 8.4, 0.12, 1.8);
  for (const x of [-10, -6, 6, 10]) {
    solid(x, g + 4.2, -10, 2.2, 0.85, 1.1, C.dark);
    detail(x, g + 5.05, -10.2, 0.8, 0.55, 0.12, C.glass);
  }
  for (const x of [-5.5, 5.5]) solid(x, g, 1, 0.75, 7.9, 0.75, C.trim);

  // Stepped central block: tall narrow window bays and inset uppermost floor.
  for (let f = 0; f < 3; f++) {
    const y = g + 8.4 + f * 4.2;
    const w = f === 2 ? 16 : 21, d = f === 2 ? 15 : 20;
    facade(0, -2.5, w, d, y, 4.2, f === 0);
    const hole = [-8.5, -4.5, -7, 3.5];
    slab(y + 4.2, -w / 2, w / 2, -2.5 - d / 2, -2.5 + d / 2, [hole]);
    stairs(-6.5, -5, 3, y, y + 4.2, 3.2);
    if (f === 0) {
      chest(p.x + 5, y + 0.05, p.z - 7);
    }
    for (const z of [-2.5 - d / 2, -2.5 + d / 2]) {
      detail(0, y + 3.95, z, w + 0.8, 0.3, 0.9, C.trim);
    }
  }
  // Long vertical window bays on the main frontage.
  for (const x of [-5.7, -2.2, 2.2, 5.7]) {
    detail(x, g + 8.85, 7.82, 1.2, 7.1, 0.04, C.dark);
    for (let y = 9.4; y < 16; y += 1.1) detail(x, g + y, 7.86, 1.2, 0.06, 0.06, C.trim);
  }
  for (const x of [-7.6, -3.8, 3.8, 7.6]) {
    detail(x, g + 8.4, 7.85, 0.42, 8.4, 0.65);
    detail(x, g + 16.65, 7.85, 0.75, 0.2, 0.9);
  }
  // Roof hatch stays over a real opening.
  for (const x of [-8, 8]) detail(x, g + 21, -2.5, 0.2, 0.65, 15, C.trim);

  // Rounded front bastions, attached to the wings. Rear opening permits entry.
  function bastion(cx, cz, radius, height) {
    const SEG = 40;
    const shell = new THREE.CylinderGeometry(radius, radius, height, SEG, 1, true, -Math.PI / 2, Math.PI);
    deco(shell, C.stone, p.x + cx, g + height / 2, p.z + cz, 1, 1, 1);
    for (let i = 0; i < SEG / 2; i++) {
      const a = -Math.PI / 2 + (i + 0.5) * Math.PI / (SEG / 2);
      const x = cx + Math.sin(a) * radius, z = cz + Math.cos(a) * radius;
      const tangent = Math.PI * radius / (SEG / 2);
      // AABBs closely follow the curved visible shell.
      collider({ type: 'box', minX: p.x + x - (Math.abs(Math.cos(a)) * tangent + 0.45) / 2,
        maxX: p.x + x + (Math.abs(Math.cos(a)) * tangent + 0.45) / 2,
        minZ: p.z + z - (Math.abs(Math.sin(a)) * tangent + 0.45) / 2,
        maxZ: p.z + z + (Math.abs(Math.sin(a)) * tangent + 0.45) / 2,
        minY: g, maxY: g + height });
    }
    cylinder(cx, g + height, cz, radius * 2 + 0.5, 0.3, C.trim);
    disc(p.x + cx, g + height, p.z + cz, radius + 0.25, 0.3);
    for (let y = 0.75; y < height; y += 0.75) {
      const ring = new THREE.CylinderGeometry(radius + 0.015, radius + 0.015, 0.025, SEG, 1, true, -Math.PI / 2, Math.PI);
      deco(ring, C.seam, p.x + cx, g + y, p.z + cz, 1, 1, 1);
    }
    // Blue banners on the round fronts.
    detail(cx, g + height - 3.7, cz + radius + 0.04, 1.7, 2.5, 0.08, C.blue);
    detail(cx, g + height - 3.1, cz + radius + 0.1, 0.7, 0.9, 0.04);
  }
  bastion(-15, 14, 5.7, 7);
  bastion(15, 14, 5.7, 8.4);
  // Round facade medallions are a defining feature of the original headquarters.
  for (const [x, y, z, r] of [[-15, g + 4.7, 19.78, 1.1], [0, g + 19.4, 5.09, 0.8]]) {
    const badge = new THREE.CylinderGeometry(r, r, 0.12, 32);
    deco(badge, C.trim, p.x + x, y, p.z + z, 1, 1, 1, Math.PI / 2);
    detail(x, y - 0.4, z + 0.1, r * 0.7, 0.8, 0.06, C.blue, Math.PI / 4);
  }
  // Front steps and paved forecourt.
  solid(0, p.h - 0.2, 22, 23, 0.2, 12, C.floor, true);
  for (let i = 0; i < 3; i++) solid(0, p.h - 0.15 + i * 0.12, 17.5 - i * 0.7, 12, 0.12, 0.9, C.trim, true);
  // Flagpoles and white GHOST-like insignia, without oversized golden columns.
  for (const [x, z, y] of [[0, -2.5, g + 21.25], [-15, 14, g + 7.3], [15, 14, g + 8.7]]) {
    solid(x, y, z, 0.12, 5, 0.12, C.dark);
    detail(x + 1.1, y + 3.3, z, 2.2, 1.5, 0.06, C.blue);
    detail(x + 1.1, y + 3.65, z + 0.05, 0.65, 0.8, 0.03);
    for (const dx of [-0.16, 0.16]) detail(x + 1.1 + dx, y + 4.1, z + 0.08, 0.1, 0.1, 0.03, C.blue);
  }
  // Heliport to the side, away from the entrance and basement approach.
  cylinder(-30, p.h + 0.03, 4, 12, 0.1, C.dark);
  disc(p.x - 30, p.h + 0.03, p.z + 4, 6, 0.1);
  for (const x of [-31.2, -28.8]) detail(x, p.h + 0.14, 4, 0.35, 0.02, 3.5, 0xffffff);
  detail(-30, p.h + 0.14, 4, 2.4, 0.02, 0.35, 0xffffff);
  chest(p.x + 10, g + 0.05, p.z - 10);
  chest(p.x - 9, g + 4.25, p.z - 10);
  ammo(p.x + 9, g + 4.25, p.z + 9);
  lootSpots.push({ x: p.x + 8, y: g + 0.3, z: p.z + 5 }, { x: p.x - 7, y: g + 4.5, z: p.z + 10 });
  return {
    vault: { x: p.x - 9, y: basement, z: p.z - 7 },
    lobbyY: g, basementY: basement,
    basementStairs: { x: p.x - 16, bottomZ: p.z, topZ: p.z + 8 },
    patrol: { x: p.x, z: p.z + 1, hx: 4, hz: 4 },
  };
}
