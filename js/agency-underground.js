// Two-level industrial headquarters: pipes are routed above head height or at walls.
export function buildUnderground(p, a) {
  const { THREE, solid, detail, slab, stairs, deco, scene, collider } = a;
  const b1 = p.h - 4, b2 = b1 - 4.2;
  const color = { wall: 0x687274, dark: 0x283a42, steel: 0x7f9194, blue: 0x386477, red: 0x8f463c, brass: 0xafa06a, light: 0xd1e4da };
  const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
  let pipeRuns = 0, valves = 0;
  const pipe = (points, radius, hex = color.steel) => {
    const vectors = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const path = new THREE.CatmullRomCurve3(vectors, false, 'centripetal');
    const tube = new THREE.TubeGeometry(path, Math.max(6, points.length * 5), radius, 8, false);
    deco(tube, hex, p.x, 0, p.z, 1, 1, 1); pipeRuns++;
    // Compression collars give long runs mechanical rhythm.
    const length = path.getLength(), n = Math.floor(length / 2.2);
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 1; i < n; i++) {
      const t = i / n, v = path.getPoint(t), q = new THREE.Quaternion().setFromUnitVectors(up, path.getTangent(t).normalize());
      const e = new THREE.Euler().setFromQuaternion(q);
      deco(CYL, color.dark, p.x + v.x, v.y, p.z + v.z, radius * 2.45, 0.1, radius * 2.45, e.x, e.y, e.z);
    }
  };
  function valve(x, y, z, r = 0.3) {
    const ring = new THREE.TorusGeometry(r, 0.045, 8, 16);
    deco(ring, color.red, p.x + x, y, p.z + z, 1, 1, 1);
    for (const angle of [0, Math.PI / 2]) detail(x, y - 0.025, z, r * 1.8, 0.05, 0.07, color.red, 0, angle);
    deco(CYL, color.brass, p.x + x, y, p.z + z - 0.08, 0.15, 0.16, 0.15, Math.PI / 2);
    valves++;
  }
  function sign(text, sub, x, y, z, w = 3.4) {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#18303b'; ctx.fillRect(0, 0, 768, 256);
    ctx.fillStyle = '#ceb778'; ctx.fillRect(0, 0, 16, 256);
    ctx.fillStyle = '#edf5ed'; ctx.font = 'bold 70px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(text, 390, 116, 710);
    ctx.fillStyle = '#9db6be'; ctx.font = '32px sans-serif'; ctx.fillText(sub, 390, 185, 700);
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 3),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    m.position.set(p.x + x, y, p.z + z); scene.add(m);
  }
  // Lower foundation and solid dry floor. The B1 floor has a genuine stairwell.
  slab(b2, -20, 20, -15, 15, [], 0x56656a);
  for (const z of [-15, 15]) solid(0, b2, z, 40.5, 4.2, 0.65, color.dark, true);
  for (const x of [-20, 20]) solid(x, b2, 0, 0.65, 4.2, 30.5, color.dark, true);
  slab(b1, -20, 20, -15, 15, [[13.9, 18.1, -2, 8.5]], 0x69777b);
  slab(b1 + 4, -19.5, 19.5, -14.5, 14.5, [[-18.1, -13.9, -2, 8.5]], color.dark);
  slab(b2 + 4, -19.5, 19.5, -14.5, 14.5, [[13.9, 18.1, -2, 8.5]], color.dark);
  stairs(16, 0, 8, b2, b1);
  // Broad north-south corridor and rooms with real door openings.
  for (const [z, d] of [[-6, 15], [12, 4]]) solid(-2, b1, z, 0.4, 3.95, d, color.wall, true);
  for (const [x, w] of [[2.5, 8], [15, 9]]) solid(x, b1, -3, w, 3.95, 0.35, color.wall, true);
  // B2 equipment hall: keep the lower stair landing and cross-corridor unobstructed.
  for (const [z, d] of [[-9, 10], [7, 3]]) solid(4, b2, z, 0.35, 4, d, color.wall, true);
  for (const [x, w] of [[-12, 15], [0.5, 5]]) solid(x, b2, -3, w, 4, 0.35, color.wall, true);
  // Route stripes and a grated drain down the centre of the lower service hall.
  for (const x of [5.5, 11.5]) detail(x, b2 + 0.015, 1, 0.1, 0.02, 22, color.brass);
  for (let z = -13; z < 14; z += 0.5) detail(8.5, b2 + 0.015, z, 0.5, 0.025, 0.2, color.dark);
  for (const y of [b1, b2]) {
    // Parallel mains under both ceilings; turns run down walls, not across stairs.
    for (const [x, r, c] of [[-18.7, 0.25, color.steel], [-18, 0.15, color.blue], [18.9, 0.22, color.red]]) {
      pipe([[x, y + 0.5, -12], [x, y + 2.9, -12], [x, y + 3.3, -11.5], [x, y + 3.3, 11.2], [x, y + 2.9, 12], [x, y + 0.5, 12]], r, c);
    }
    for (const [z, r, c] of [[12.8, 0.22, color.steel], [11.9, 0.13, color.blue], [-13.3, 0.23, color.red]]) {
      pipe([[-18, y + 3.35, z], [0, y + 3.35, z], [18.5, y + 3.35, z]], r, c);
    }
    for (const [x, c] of [[5.8, color.steel], [10.5, color.red], [-5, color.blue], [-3.2, color.steel]]) {
      pipe([[x, y + 2.8, -13], [x, y + 3.2, -12], [x, y + 3.2, 11], [x + 0.7, y + 3.2, 12]], 0.17, c);
    }
    // Cable trays above the free walking route, with evenly spaced supports.
    detail(8.5, y + 3.6, 0, 0.85, 0.08, 25, color.dark);
    for (let z = -12; z <= 12; z += 3) {
      detail(8.5, y + 3.45, z, 1, 0.08, 0.1, color.steel);
      detail(8.5, y + 3.7, z, 0.06, 0.45, 0.06, color.dark);
    }
    // Industrial strip lights and framing ribs.
    for (const z of [-10, -3, 5, 12]) {
      detail(0, y + 3.75, z, z === 5 ? 26.5 : 38, 0.18, 0.18, color.dark);
      for (const x of [-15, 1, 10]) {
        if (z === 5 && x === -15) continue;
        detail(x, y + 3.58, z, 2.5, 0.08, 0.45, color.dark);
        detail(x, y + 3.55, z, 2.15, 0.025, 0.25, color.light);
      }
    }
    for (const [x, z] of [[-18, 10], [18.8, -10], [18.8, 10]]) valve(x, y + 1.5, z + 0.3);
  }
  // B1 security control centre: cabinets, screens, wiring and a long console.
  for (const x of [3, 6, 9, 12, 15]) {
    solid(x, b1, -12.8, 2.2, 2.6, 1.1, color.dark, true);
    detail(x, b1 + 0.35, -12.2, 1.75, 2, 0.06, color.steel);
    for (let k = 0; k < 4; k++) detail(x - 0.5 + k * 0.32, b1 + 1.9, -12.15, 0.12, 0.1, 0.03, k === 3 ? 0xaad0ac : color.brass);
    pipe([[x, b1 + 2.5, -12.8], [x, b1 + 3.2, -12.8], [x + 0.6, b1 + 3.2, -13.3]], 0.055, color.dark);
  }
  solid(8, b1, -8.8, 9, 0.95, 1.3, color.dark, true);
  for (const x of [5, 8, 11]) {
    detail(x, b1 + 0.95, -9.1, 1.7, 1, 0.15, color.dark);
    detail(x, b1 + 1.05, -8.99, 1.45, 0.72, 0.035, color.blue);
    for (let k = 0; k < 4; k++) detail(x - 0.5 + k * 0.3, b1 + 1.15, -8.96, 0.12, 0.1 + k * 0.08, 0.01, color.light);
  }
  // B2 power and pump rooms: two large generators on concrete plinths.
  for (const x of [-13, -6]) {
    solid(x, b2, -8, 4.4, 0.35, 5.6, 0x7b7b73, true);
    solid(x, b2 + 0.35, -8, 3.6, 1.8, 4.8, color.dark, true);
    for (let z = -9.8; z < -6; z += 0.5) detail(x, b2 + 2.15, z, 3.35, 0.12, 0.15, color.steel);
    for (const dx of [-0.8, 0.8]) {
      deco(CYL, color.steel, p.x + x + dx, b2 + 1.5, p.z - 5.55, 0.9, 0.2, 0.9, Math.PI / 2);
      valve(x + dx, b2 + 1.5, -5.38, 0.22);
    }
    pipe([[x, b2 + 2, -9.6], [x, b2 + 3.3, -9.6], [x, b2 + 3.3, -12.8], [x + 3, b2 + 3.3, -12.8]], 0.24);
    pipe([[x, b2 + 0.8, -10.5], [x, b2 + 0.8, -12], [x, b2 + 3.1, -12]], 0.16, color.red);
  }
  // Boiler bank and big vertical feed pipes to the lower plant room.
  for (const z of [-11, -7, -3.5]) {
    deco(CYL, color.steel, p.x + 16.5, b2 + 1.45, p.z + z, 1.7, 2.9, 1.7);
    collider({ type: 'box', minX: p.x + 15.65, maxX: p.x + 17.35, minY: b2, maxY: b2 + 2.9, minZ: p.z + z - 0.85, maxZ: p.z + z + 0.85 });
    pipe([[16.5, b2 + 2.8, z], [16.5, b2 + 3.3, z], [18.5, b2 + 3.3, z]], 0.18);
    valve(16.5, b2 + 1.6, z + 0.95);
  }
  for (const x of [7, 9.5, 12]) {
    pipe([[x, b2 + 0.3, -13.7], [x, b2 + 2.9, -13.7], [x, b2 + 3.25, -13], [x, b2 + 3.25, -11]], 0.23);
    valve(x, b2 + 1.45, -13.3);
  }
  // B1 doorway trim and clear wayfinding from the original hall staircase.
  sign('B1 / COFFRE-FORT', 'CARTE MIDAS REQUISE', -9, b1 + 3.5, 1.8, 3);
  sign('SECURITE', 'CONTROLE / SURVEILLANCE', 8.5, b1 + 2.75, -2.8);
  sign('B2 / MAINTENANCE', 'ESCALIER  →', 16, b1 + 2.65, 13.9, 3.8);
  sign('GENERATEURS', 'ZONE TECHNIQUE / B2', -7, b2 + 2.7, -2.78, 4.2);
  sign('POMPES / VANNES', 'PRESSION 04 / ALIMENTATION', 12, b2 + 2.8, -13.9, 4.2);
  sign('B1 / SORTIE', 'ESCALIER  →', 16, b2 + 2.7, -2.5, 3.8);
  const lights = [];
  for (const y of [b1, b2]) for (const [x, z, hex] of [[8.5, -9, 0xb4d9e2], [8.5, 3, 0xb4d9e2], [-9, -6, 0xffd19a], [-9, 3, 0xb4d9e2]]) {
    lights.push({ obj: { position: new THREE.Vector3(p.x + x, y + 3.1, p.z + z) }, y: 0, intensity: 9, distance: 12, color: hex });
  }
  return { lowerY: b2, lowerStairs: { x: p.x + 16, bottomZ: p.z, topZ: p.z + 8 }, pipeRuns, valves, lights };
}
