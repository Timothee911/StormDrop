import { GROTTO, grottoRoofContains, terrainH } from './world.js';
import { SURFACE, installTerrainSurface } from './surface-materials.js';

// Original, playable cave architecture: actual excavation, pierced rock roof,
// a vertical hangar shaft and continuous stair routes, not surface bunkers.
export function buildGrotto(p, api) {
  const { THREE, scene, box, deco, mat, collider, target, chest, ammo, lootSpots } = api;
  const L = GROTTO, y = L.floorY, top = L.surfaceY;
  const B = new THREE.BoxGeometry(1, 1, 1);
  const C = new THREE.CylinderGeometry(.5, .5, 1, 12);
  const R = new THREE.DodecahedronGeometry(1, 0);
  R.setIndex(Array.from({ length: R.attributes.position.count }, (_, i) => i));
  const stone = 0x626d78, dark = 0x293c49, steel = 0x718593, yellow = 0xe4b83e;
  const lights = [];
  const solid = (x, bottom, z, w, h, d, color = dark, extra = {}) =>
    box(p.x + x, bottom, p.z + z, w, h, d, mat(color, { roughness: .83 }), { indestructible: true, mat: 'metal', ...extra });
  const detail = (geo, color, x, cy, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) =>
    deco(geo, color, p.x + x, cy, p.z + z, sx, sy, sz, rx, ry, rz);
  const rock = (x, cy, z, sx, sy, sz, a) => {
    const d = detail(R, stone, x, cy, z, sx, sy, sz, .16, a, .13);
    if (d) d.surface = SURFACE.STONE;
  };
  function sign(text, x, cy, z, width, color = '#f3cb64') {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#182b37'; ctx.fillRect(0, 0, 768, 160);
    ctx.fillStyle = color; ctx.fillRect(0, 0, 12, 160); ctx.fillRect(756, 0, 12, 160);
    ctx.font = 'bold 60px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 384, 84, 710);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4.8), new THREE.MeshBasicMaterial({ map: texture }));
    m.position.set(p.x + x, cy, p.z + z); scene.add(m); return m;
  }
  function lamp(x, cy, z, length = 2.6) {
    detail(B, dark, x, cy + .06, z, length + .35, .18, .42);
    const m = new THREE.Mesh(B, new THREE.MeshBasicMaterial({ color: 0xd7f5ff }));
    m.position.set(p.x + x, cy - .06, p.z + z); m.scale.set(length, .08, .28); scene.add(m);
    lights.push({ obj: m, y: -.4, color: 0xb4deff, intensity: 3.2, distance: 13 });
  }
  function pipe(points, radius, color) {
    for (let i = 1; i < points.length; i++) {
      const a = new THREE.Vector3(...points[i - 1]), b = new THREE.Vector3(...points[i]);
      const mid = a.clone().add(b).multiplyScalar(.5), length = a.distanceTo(b);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      const e = new THREE.Euler().setFromQuaternion(q);
      detail(C, color, mid.x, mid.y, mid.z, radius * 2, length, radius * 2, e.x, e.y, e.z);
      const ring = new THREE.TorusGeometry(radius * 1.13, .055, 5, 12);
      // Torus normal +z is rotated to the pipe direction.
      const rq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.clone().sub(a).normalize());
      const re = new THREE.Euler().setFromQuaternion(rq);
      for (const t of [.12, .45, .78]) {
        const v = a.clone().lerp(b, t);
        detail(ring, steel, v.x, v.y, v.z, 1, 1, 1, re.x, re.y, re.z);
      }
    }
  }
  function stairs(x, z0, z1, low, high, width) {
    const count = Math.ceil(Math.abs(high - low) / .24);
    for (let i = 0; i < count; i++) {
      const z = z0 + (z1 - z0) * (i + .5) / count, h = low + (high - low) * (i + 1) / count;
      detail(B, i % 5 ? steel : yellow, x, h - .14, z, width, .24, Math.abs(z1 - z0) / count + .03);
    }
    collider({ type: 'slope', axis: 'z', e0: p.z + z0, e1: p.z + z1, y0: low, y1: high,
      minX: p.x + x - width / 2, maxX: p.x + x + width / 2,
      minZ: p.z + Math.min(z0, z1), maxZ: p.z + Math.max(z0, z1),
      minY: low - .3, maxY: high });
    for (const s of [-1, 1]) {
      for (let i = 0; i <= 9; i++) {
        const z = z0 + (z1 - z0) * i / 9, h = low + (high - low) * i / 9;
        detail(C, yellow, x + s * (width / 2 + .1), h + .55, z, .09, 1.1, .09);
      }
      pipe([[x + s * (width / 2 + .1), low + 1.1, z0], [x + s * (width / 2 + .1), high + 1.1, z1]], .055, yellow);
    }
  }

  // Grass/snow surface over a substantial two-metre rock ceiling. The
  // staircase is an open notch, not an invalid hole crossing a shape edge.
  const m = L.main, e = L.entry, a = p.x - 27, b = p.x - 17, notch = p.z + 24;
  const outline = [[m.x0,m.z0],[m.x1,m.z0],[m.x1,m.z1],[e.x1,m.z1],
    [e.x1,e.z1],[b,e.z1],[b,notch],[a,notch],[a,e.z1],[e.x0,e.z1],[e.x0,m.z1],[m.x0,m.z1]];
  const shape = new THREE.Shape();
  outline.forEach(([x,z], i) => shape[i ? 'lineTo' : 'moveTo'](x - p.x, z - p.z)); shape.closePath();
  for (const hole of [L.shaft, L.vent]) {
    const path = new THREE.Path();
    path.absarc(hole.x - p.x, hole.z - p.z, hole.r, 0, Math.PI * 2, true);
    shape.holes.push(path);
  }
  const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false, curveSegments: 32 });
  const pos = roofGeo.attributes.position, colors = new Float32Array(pos.count * 3);
  const tint = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getY(i), h = pos.getZ(i);
    pos.setXYZ(i, x, h, z);
    tint.setHex(h > 1.99 ? 0x75a34f : stone);
    tint.multiplyScalar(.92 + .08 * Math.sin(x * 1.9 + z * .8));
    colors.set([tint.r, tint.g, tint.b], i * 3);
  }
  roofGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  // Swapping Y/Z reverses winding.
  for (const attr of Object.values(roofGeo.attributes)) {
    for (let i = 0; i < attr.count; i += 3) for (let k = 0; k < attr.itemSize; k++) {
      const v = attr.array[(i + 1) * attr.itemSize + k];
      attr.array[(i + 1) * attr.itemSize + k] = attr.array[(i + 2) * attr.itemSize + k];
      attr.array[(i + 2) * attr.itemSize + k] = v;
    }
    attr.needsUpdate = true;
  }
  roofGeo.computeVertexNormals();
  const roofMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96, emissive: 0x14212b, emissiveIntensity: .3 });
  installTerrainSurface(roofMaterial, api.surfaceLibrary, api.time);
  const roof = new THREE.Mesh(roofGeo, roofMaterial);
  roof.position.set(p.x, top - 2, p.z); roof.castShadow = roof.receiveShadow = true; scene.add(roof);
  const roofCol = collider({ type: 'cavernRoof', contains: grottoRoofContains,
    minX: m.x0, maxX: m.x1, minZ: m.z0, maxZ: e.z1, minY: top - 2, maxY: top,
    indestructible: true, kind: 'house', mat: 'stone', mesh: roof });
  roof.userData.struct = roofCol; target(roof);

  // Sealed, dry floor and irregular wall massing stay below the surface.
  solid(0, y - .4, 0, m.x1 - m.x0 + 1, .4, m.z1 - m.z0 + 1, 0x526472);
  solid(-31, y, 0, 3.5, 14, 55, stone);
  solid(31, y, 0, 3.5, 14, 55, stone);
  solid(0, y, -26, 64, 14, 3, stone);
  solid(7, y, 26, 44, 14, 3, stone);
  solid(-29.2, y, 26, 4, 14, 3, stone);
  for (let i = 0; i < 12; i++) {
    const z = -23 + i * 4.2;
    for (const s of [-1, 1]) rock(s * 30.1, y + 7 + Math.sin(i * 2) * 1.4, z, 2.7 + i % 3 * .3, 6.7, 3.5, i * .61);
  }
  for (let i = 0; i < 11; i++) rock(-27 + i * 5.3, y + 7.5, -25.5, 3.5, 7.5, 2.6, i * .73);
  // Hanging rock shoulders around the shaft, not obstructing its open disk.
  for (let i = 0; i < 16; i++) {
    const t = i / 16 * Math.PI * 2, r = 12.6;
    rock(6 + Math.cos(t) * r, top - 2.6, -3 + Math.sin(t) * r, 2.0, 1.5, 1.9, t);
  }

  // Real vertical shafts: open-ended liners end high above the hangar floor.
  for (const s of [L.shaft, L.vent]) {
    const sx = s.x - p.x, sz = s.z - p.z;
    const tube = new THREE.CylinderGeometry(s.r, s.r + .2, 6, 48, 1, true);
    detail(tube, stone, sx, top - 3, sz, 1, 1, 1);
    // Interior wall normals for the liner.
    const tubeInside = tube.clone(); tubeInside.scale(-1, 1, 1);
    detail(tubeInside, 0x526270, sx, top - 3, sz, 1, 1, 1);
    const rim = new THREE.TorusGeometry(s.r + .18, .22, 7, 64);
    detail(rim, steel, sx, top + .05, sz, 1, 1, 1, Math.PI / 2);
    for (let i = 0; i < 20; i++) {
      const t = i / 20 * Math.PI * 2;
      detail(B, i % 2 ? dark : yellow, sx + Math.cos(t) * (s.r + .45), top + .025, sz + Math.sin(t) * (s.r + .45), .9, .055, .45, 0, -t, 0);
    }
  }
  // Flush pad: no step high enough to block NPCs or the player.
  detail(new THREE.CylinderGeometry(7.6, 7.6, .08, 48), dark, 6, y + .045, -3, 1, 1, 1);
  detail(new THREE.TorusGeometry(6.7, .15, 6, 64), yellow, 6, y + .1, -3, 1, 1, 1, Math.PI / 2);
  for (const dx of [-1.5, 1.5]) detail(B, 0xe8edf0, 6 + dx, y + .105, -3, .55, .02, 4.5);
  detail(B, 0xe8edf0, 6, y + .105, -3, 3, .02, .6);
  for (const z of [-18, 12]) for (let i = 0; i < 8; i++)
    detail(B, yellow, 8 + i * 1.6, y + .035, z, .85, .025, .18);

  // Long southern access route, fully walkable in either direction.
  stairs(-22, 4, 40, y, top, 7.5);
  const end = e.z1 - p.z;
  solid(-22, top - .25, (40 + end + .6) / 2, 10, .25, end - 40 + .6, steel);
  stairs(-22, end + 8, end + .6, terrainH(p.x - 22, p.z + end + 8), top, 7.5);
  for (let z = 25; z < end; z += 2.2) {
    const h = y + (Math.min(z, 40) - 4) / 36 * 14;
    const nextH = y + (Math.min(z + 2.2, 40) - 4) / 36 * 14;
    solid(-22, nextH + 4.2, z + 1.1, 10, 1.1, 2.25, stone);
    for (const side of [-1, 1]) solid(-22 + side * 4.4, h - .4, z + 1.1, 1.1, nextH - h + 5.7, 2.25, stone);
    if (Math.round(z) % 3 === 1) lamp(-22, nextH + 4, z);
  }
  const mouthZ = end + .1;
  sign('LA GROTTE  /  02', -22, top + 3.2, mouthZ, 7.8);
  sign('SORTIE  /  SURFACE', -22, y + 5.1, 24, 6.5, '#b5e4ee');
  // Surface landing and open entrance: no destructible wall sealing access.
  for (const x of [-27, -17]) solid(x, top, mouthZ, 1.2, 5.4, 1.1, steel);
  lamp(-22, top + 4.4, mouthZ - .5, 5);

  // East-side operations gallery and stair route, kept clear of the helipad.
  const galleryY = y + 4.5;
  solid(24, galleryY - .3, -9, 9, .3, 25, steel);
  for (const z of [-20, -12, -4, 2]) {
    for (const x of [20, 28]) solid(x, y, z, .4, 4.2, .4, dark);
    if (z < 2) {
      solid(19.5, galleryY, z + 3, .12, 1.1, .12, yellow);
      detail(B, yellow, 19.5, galleryY + 1.1, z + 3.5, .1, .1, 7);
    }
  }
  stairs(25, 20, 3.5, y, galleryY, 4);
  solid(25, galleryY - .25, 3, 4, .25, 1.2, steel);
  // Control wall: consoles/screens on the gallery, aisle left clear.
  for (const z of [-17, -12, -7]) {
    solid(27, galleryY, z, 1.25, 1, 2.7, dark, { indestructible: false, hp: 200 });
    detail(B, 0x4cbdcf, 26.9, galleryY + 1.7, z, .1, 1.15, 2.3);
    for (let i = 0; i < 3; i++) detail(B, i % 2 ? yellow : 0x66d9bf, 26.2, galleryY + 1.03, z - .7 + i * .7, .15, .06, .15);
  }
  sign('OPERATIONS', 24, galleryY + 2.6, -21.4, 7);
  sign('BRUTUS  /  SECURITE', -11, y + 5.7, -21.5, 10);
  sign('HANGAR  /  NIVEAU -14', 7, y + 7.4, -22.1, 12, '#b5e4ee');

  // Service backbone: overhead pipework, elbows, collars and red handwheels.
  for (const [x, color, radius] of [[-27,0xb76445,.3],[-25.8,0xc8ab62,.22],[28,0x7b9ca9,.4]]) {
    pipe([[x,y+2,-21],[x,y+9,-21],[x,y+9,20],[x,y+4,20]], radius, color);
    for (const z of [-17, -6, 7, 16]) {
      detail(new THREE.TorusGeometry(.4, .065, 6, 16), 0xbf5144, x + .55, y + 3, z, 1, 1, 1, 0, Math.PI / 2);
      detail(C, steel, x + .28, y + 3, z, .1, .6, .1, 0, 0, Math.PI / 2);
    }
  }
  for (const z of [-20, 20]) for (const dy of [8, 9.2])
    pipe([[z > 0 ? -15 : -25,y+dy,z],[-3,y+dy,z],[21,y+dy,z]], .22, dy === 8 ? 0x5a7b91 : 0xb59c69);
  // Generators on the west side, outside the entrance and vault approaches.
  for (const z of [-3, 3]) {
    solid(-28, y, z, 2.1, 2.7, 3.8, dark, { hp: 350, indestructible: false });
    detail(C, 0xa9b5b8, -28, y + 1.6, z, 1.8, 3.4, 1.8, Math.PI / 2);
    for (let i = 0; i < 6; i++) detail(B, steel, -26.9, y + .7 + i * .28, z, .08, .11, 2.6);
  }
  // Cargo containers and stacks provide cover without sealing any route.
  for (const [x,z,color] of [[-7,14,0x42687e],[6,19,0x7c6550],[14,-19,0x6c7b69]]) {
    solid(x,y,z,5.3,2.6,3,color,{indestructible:false,hp:360});
    for (let i = 0; i < 9; i++) detail(B, steel, x - 2.2 + i * .55, y + 1.3, z + 1.52, .07, 2.25, .07);
    detail(B, yellow, x, y + 2.62, z, 4.8, .04, .14);
  }
  for (const [x,z] of [[-10,6],[16,8],[-2,-17]]) {
    solid(x,y,z,1.6,1.45,1.6,0x987b4d,{indestructible:false,hp:160,mat:'wood'});
    detail(B, dark, x, y + .75, z + .81, 1.65, .12, .06);
  }
  for (const [x,z] of [[-11,-21],[7,-21],[-25,12],[23,10],[24,-16]]) lamp(x,y+8.3,z,4);
  // Ventilation exit: an open shaft with a clearly marked updraft at its base.
  for (let i = 0; i < 5; i++) {
    const h = y + 1.5 + i * 2.5;
    for (const s of [-1, 1]) detail(B, 0x8ce9ef, -15 + s * .3, h, -12, .1, .6, .1, 0, 0, s * -.65);
  }
  detail(new THREE.TorusGeometry(2.6,.1,6,40),0x8ce9ef,-15,y+.05,-12,1,1,1,Math.PI/2);
  sign('VENTILATION  /  SORTIE', -15, y + 4.4, -14.8, 7, '#b5e4ee');
  chest(p.x - 25, y + .05, p.z - 19);
  chest(p.x + 23, galleryY + .05, p.z - 19);
  ammo(p.x + 17, y + .05, p.z + 15);
  lootSpots.push({x:p.x-8,y:y+.1,z:p.z+18},{x:p.x+23,y:galleryY+.1,z:p.z-5});
  return {
    ...L, roof, roofCol, lights, galleryY, version: 1,
    vault: { x: p.x - 8, y, z: p.z - 20 },
    boss: { x: p.x - 8, y, z: p.z - 12 },
    patrol: { x: p.x - 8, z: p.z - 11, hx: 3.5, hz: 2.5 },
    posts: [[-22,1,2,2],[15,11,2.5,2.5],[-23,-15,2,2],[23,-11,1,3,galleryY]],
  };
}
