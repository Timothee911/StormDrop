import { vaultPose } from './vault-mechanism.js';

// A real hinged steel vault, not a rectangular wall deleted on interaction.
export function buildAgencyVault(p, at, api) {
  const { THREE, scene, box, mat, collider, removeCollider, target, chest, ammo, spawnLoot, weapon, ammoFor } = api;
  const { x, y, z } = at, front = z + 3.3;
  const steel = new THREE.MeshStandardMaterial({ color: 0x6b797d, metalness: 0.72, roughness: 0.38 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x28353b, metalness: 0.6, roughness: 0.48 });
  const light = new THREE.MeshStandardMaterial({ color: 0xb7c4c6, metalness: 0.8, roughness: 0.3 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xb9a967, metalness: 0.68, roughness: 0.42 });
  const green = new THREE.MeshStandardMaterial({ color: 0x42d79b, emissive: 0x42d79b, emissiveIntensity: 0.7 });
  const red = new THREE.MeshStandardMaterial({ color: 0xf44942, emissive: 0xf44942, emissiveIntensity: 0.8 });
  const group = new THREE.Group(); scene.add(group);
  const mesh = (geo, material, parent, px, py, pz, rx = 0) => {
    const m = new THREE.Mesh(geo, material); m.position.set(px, py, pz); m.rotation.x = rx;
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const cube = (parent, material, px, py, pz, w, h, d) => {
    const m = mesh(new THREE.BoxGeometry(w, h, d), material, parent, px, py + h / 2, pz); return m;
  };
  const solid = (px, py, pz, w, h, d, color = 0x3e4b50) =>
    box(px, py, pz, w, h, d, mat(color), { indestructible: true, mat: 'metal' });
  const v = { poi: p, x, y, z, open: false, state: 'locked', elapsed: 0, door: null };
  // Deep security chamber with steel ribbing, shelving and a lit aisle.
  solid(x, y - 0.08, z, 9.6, 0.13, 7.4, 0x59616a);
  solid(x, y + 3.95, z, 9.6, 0.18, 7.4, 0x2d383f);
  solid(x - 4.7, y, z, 0.45, 4, 7.4);
  solid(x + 4.7, y, z, 0.45, 4, 7.4);
  solid(x, y, z - 3.5, 9.6, 4, 0.45);
  for (const side of [-1, 1]) solid(x + side * 3.45, y, front, 2.6, 4, 0.65, 0x444f52);
  // Header is above the 3.8m opening, not an invisible obstacle at head height.
  solid(x, y + 3.8, front, 4.3, 0.2, 0.65, 0x758185);
  for (let dz = -2.8; dz <= 2.8; dz += 1.4) for (const s of [-1, 1]) {
    cube(group, light, x + s * 4.42, y + 0.2, z + dz, 0.1, 3.6, 0.11);
  }
  for (const s of [-1, 1]) {
    cube(group, green, x + s * 4.2, y + 0.12, z, 0.07, 0.055, 6.2);
    for (let dz = -2.4; dz <= 1.8; dz += 2.1) {
      if (s === -1 && dz > -2) continue; // clear parking area for the hinged leaf
      const sx = x + s * 3.75, sz = z + dz;
      for (const ox of [-0.55, 0.55]) for (const oz of [-0.42, 0.42])
        cube(group, light, sx + ox, y, sz + oz, 0.07, 2.85, 0.07);
      for (const h of [0.45, 1.45, 2.45]) {
        cube(group, steel, sx, y + h, sz, 1.3, 0.08, 1.05);
        // Stacks of gold bars and military supply cases, rather than flat cubes.
        for (const ox of [-0.35, 0, 0.35]) {
          const bar = mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.16, 4), gold, group, sx + ox, y + h + 0.15, sz);
          bar.rotation.y = Math.PI / 4; bar.scale.set(1, 1, 2.2);
        }
      }
      // Shelf base collides, the central aisle stays a generous 5.8m wide.
      collider({ type: 'box', minX: sx - 0.625, maxX: sx + 0.625, minY: y, maxY: y + 2.8, minZ: sz - 0.5, maxZ: sz + 0.5 });
    }
  }
  // Ceiling light housings and visible emissive strips.
  for (const dx of [-2, 2]) {
    cube(group, dark, x + dx, y + 3.65, z, 0.4, 0.12, 5.8);
    cube(group, light, x + dx, y + 3.63, z, 0.22, 0.025, 5.4);
  }
  // Circular frame and its large radial fixing bolts.
  mesh(new THREE.TorusGeometry(1.94, 0.23, 10, 56), light, group, x, y + 1.85, front + 0.15);
  mesh(new THREE.TorusGeometry(1.73, 0.08, 8, 48), dark, group, x, y + 1.85, front + 0.25);
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8;
    mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 6), dark, group,
      x + Math.cos(a) * 1.96, y + 1.85 + Math.sin(a) * 1.96, front + 0.39, Math.PI / 2);
  }
  // Hinge is on the LEFT. The heavy leaf swings into a clear interior parking area.
  const hinge = new THREE.Group(); hinge.position.set(x - 1.86, y + 1.85, front + 0.15); scene.add(hinge);
  const leaf = mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.48, 56), steel, hinge, 1.86, 0, 0, Math.PI / 2);
  mesh(new THREE.TorusGeometry(1.54, 0.08, 8, 48), gold, hinge, 1.86, 0, 0.29);
  mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.12, 48), dark, hinge, 1.86, 0, 0.28, Math.PI / 2);
  // Rear face stays detailed and visible after the leaf opens.
  mesh(new THREE.TorusGeometry(1.48, 0.1, 8, 48), light, hinge, 1.86, 0, -0.27);
  const wheel = new THREE.Group(); wheel.position.set(1.86, 0, 0.47); hinge.add(wheel);
  mesh(new THREE.TorusGeometry(0.58, 0.055, 8, 28), light, wheel, 0, 0, 0);
  mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 16), gold, wheel, 0, 0, 0, Math.PI / 2);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    const spoke = cube(wheel, light, Math.cos(a) * 0.28, Math.sin(a) * 0.28 - 0.025, 0, 0.57, 0.05, 0.055);
    spoke.rotation.z = a;
  }
  const bolts = [];
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, m = cube(hinge, light, 1.86 + Math.cos(a) * 1.35, Math.sin(a) * 1.35 - 0.075, 0.38, 0.5, 0.15, 0.19);
    m.rotation.z = a; bolts.push({ m, a });
  }
  for (const hy of [-1.15, 1.15]) {
    mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.7, 12), light, group, x - 1.86, y + 1.85 + hy, front + 0.15);
    cube(group, dark, x - 2.1, y + 1.65 + hy, front, 0.55, 0.4, 0.6);
  }
  // Scanner to the left of the door, positioned within reach of the original approach.
  v.terminal = { x: x - 1.7, y: y + 1.2, z: front + 1.05 };
  const t = v.terminal;
  cube(group, dark, t.x, y, t.z, 0.6, 1.35, 0.45);
  const display = cube(group, red, t.x, y + 1.3, t.z + 0.18, 0.58, 0.6, 0.09);
  cube(group, light, t.x, y + 1.1, t.z + 0.37, 0.65, 0.08, 0.45);
  const status = mesh(new THREE.SphereGeometry(0.09, 10, 8), red, group, t.x + 0.2, y + 1.77, t.z + 0.25);
  // Hazard-painted threshold and side rails keep the opening immediately legible.
  for (const s of [-1, 1]) {
    solid(x + s * 3.8, y + 0.9, front + 1.2, 0.09, 0.09, 1.4, 0x9aa3a5);
    for (const dz of [0.6, 1.8]) solid(x + s * 3.8, y, front + dz, 0.1, 1.1, 0.1, 0x9aa3a5);
  }
  for (let i = -6; i <= 6; i++) {
    const stripe = cube(group, i % 2 ? dark : gold, x + i * 0.32, y + 0.055, front + 0.5, 0.32, 0.015, 0.36);
    stripe.rotation.y = -0.35;
  }
  // A collider on the animated leaf, reindexed as it moves. It never vanishes.
  const col = collider({ type: 'box', minX: x - 1.82, maxX: x + 1.82, minY: y, maxY: y + 3.7, minZ: front - 0.2, maxZ: front + 0.8 });
  col.indestructible = true; col.kind = 'house'; col.mat = 'metal'; col.mesh = leaf;
  leaf.userData.struct = col; target(leaf); v.door = col;
  function moveCollider(angle) {
    removeCollider(col);
    const cx = x - 1.86 + Math.cos(angle) * 1.86, cz = front + 0.15 - Math.sin(angle) * 1.86;
    const hx = (Math.abs(Math.cos(angle)) * 3.65 + Math.abs(Math.sin(angle)) * 0.8) / 2;
    const hz = (Math.abs(Math.sin(angle)) * 3.65 + Math.abs(Math.cos(angle)) * 0.8) / 2;
    Object.assign(col, { minX: cx - hx, maxX: cx + hx, minZ: cz - hz, maxZ: cz + hz });
    collider(col);
  }
  const chestStart = api.chests.length;
  chest(x - 1.6, y + 0.05, z - 1.25); chest(x + 1.6, y + 0.05, z - 1.25);
  chest(x, y + 0.05, z - 2.7);
  ammo(x - 2.5, y + 0.05, z + 1.9).vaultRef = v;
  ammo(x + 2.5, y + 0.05, z + 1.9).vaultRef = v;
  for (let i = chestStart; i < api.chests.length; i++) { api.chests[i].vault = true; api.chests[i].vaultRef = v; }
  v.seedLoot = () => {
    const w = weapon(3); spawnLoot(w, x, y + 0.22, z); spawnLoot(ammoFor(w.id), x + 0.7, y + 0.22, z);
  };
  v.mechanism = {
    hinge, wheel, leaf, bolts, group,
    begin() { if (v.state !== 'locked') return false; v.state = 'scanning'; v.elapsed = 0; return true; },
    update(dt) {
      if (v.state === 'locked' || v.state === 'open') return false;
      const previous = v.state;
      v.elapsed += dt; const pose = vaultPose(v.elapsed);
      v.state = pose.phase; hinge.rotation.y = pose.angle; wheel.rotation.z = pose.wheel;
      hinge.updateMatrixWorld(true);
      for (const { m, a } of bolts) { const r = 1.35 - pose.bolts * 0.35; m.position.x = 1.86 + Math.cos(a) * r; m.position.y = Math.sin(a) * r; }
      display.material = status.material = pose.open ? green : gold;
      if (pose.angle !== 0) moveCollider(pose.angle);
      if (previous !== v.state && !pose.open) api.sound(v.state === 'unlocking' ? 'vaultrelease' : 'vaultopen', v);
      if (!pose.open) return false;
      v.open = true; v.state = 'open'; return true;
    },
  };
  return v;
}
