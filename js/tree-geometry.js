// One reusable mesh per trunk, including its branches: no extra draw calls per tree.
export function treeSpeciesAt(x, z, snow = 0) {
  if (snow > .3) return 'pine';
  const value = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return value - Math.floor(value) < .42 ? 'broadleaf' : 'pine';
}

export function createBroadleafCanopy(THREE, mergeGeometries) {
  const make = (lobes) => {
    const parts = lobes.map(([x, y, z, sx, sy, sz], i) =>
      new THREE.DodecahedronGeometry(1, 0).rotateY(i * .71).scale(sx, sy, sz).translate(x, y, z));
    const geometry = mergeGeometries(parts, false);
    for (const part of parts) part.dispose();
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    geometry.userData = { species: 'broadleaf', lobes: lobes.length };
    return geometry;
  };
  return {
    lower: make([[-1.8, 0, .3, 2, 1.25, 1.85], [1.5, .12, .6, 2, 1.2, 1.85],
      [.1, .2, -1.5, 2, 1.3, 1.85], [-.8, -.1, 1.4, 2.1, 1.2, 1.8], [1, -.12, -.8, 2, 1.2, 1.85]]),
    upper: make([[-1, .35, -.2, 1.8, 1.25, 1.7], [.8, .55, .3, 1.8, 1.2, 1.7],
      [.2, .4, -1.1, 1.7, 1.2, 1.65]])
  };
}

export function createBranchedTrunk(THREE, mergeGeometries) {
  const height = 2.8;
  const parts = [new THREE.CylinderGeometry(.28, .42, height, 6).translate(0, height / 2, 0)];
  const up = new THREE.Vector3(0, 1, 0), samples = [];
  const at = (angle, radius, y) => new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  const segment = (a, b, bottom, top) => {
    const direction = new THREE.Vector3().subVectors(b, a);
    const geometry = new THREE.CylinderGeometry(top, bottom, direction.length(), 5);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, direction.normalize()));
    geometry.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    parts.push(geometry);
  };
  for (let i = 0; i < 4; i++) {
    const angle = .2 + i * 1.64;
    const root = at(angle, .12, 1.10 + i * .14);
    const bend = at(angle + .08, .96 + i % 2 * .18, 1.48 + i * .12);
    const tip = at(angle + .16, 1.94 + i % 2 * .20, 1.88 + i * .12);
    const fork = at(angle - .48, 1.62 + i % 2 * .12, 1.82 + i * .11);
    segment(root, bend, .17 - i * .012, .11);
    segment(bend, tip, .11, .028);
    segment(bend, fork, .075, .018);
    samples.push(new THREE.Vector3().lerpVectors(bend, tip, .5).multiply(new THREE.Vector3(1, 1 / height, 1)).toArray());
  }
  const geometry = mergeGeometries(parts, false);
  for (const part of parts) part.dispose();
  // Keep the existing trunk instance transforms, map RNG and resource IDs untouched.
  geometry.scale(1, 1 / height, 1);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  geometry.userData = { branchCount: 4, branchSegments: 12, branchSamples: samples };
  return geometry;
}
