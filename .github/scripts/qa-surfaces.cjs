// Deterministic texture generation, shader compilation and destruction regression.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewport({ width: 1280, height: 800 });
    await page.evaluateOnNewDocument(() => { window.requestAnimationFrame = () => 0; });
    const base = process.env.QA_URL || 'http://127.0.0.1:8090';
    const load = async (quality) => {
      const hash = encodeURIComponent(JSON.stringify({ settings: { quality, outline: 0 } }));
      await page.goto(`${base}/game.html#${hash}`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForFunction(() => window.__game?.player, { polling: 100, timeout: 120000 });
    };
    await load('basse');
    const result = await page.evaluate(async () => {
      const G = __game, L = G.surfaces.library;
      const { createSurfaceLibrary, surfaceForStyle } = await import('/js/surface-materials.js');
      const L2 = createSurfaceLibrary(G.THREE);
      const hash = (c) => {
        const a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let h = 2166136261;
        for (const v of a) h = Math.imul(h ^ v, 16777619);
        return h >>> 0;
      };
      const hashes = [hash(L.atlas.image), hash(L.grass.image)];
      const deterministic = hashes[0] === hash(L2.atlas.image) && hashes[1] === hash(L2.grass.image);
      const distinct = new Set(Object.values(L.tiles).map(hash)).size;
      L2.atlas.dispose(); L2.grass.dispose();
      const houses = [...new Set(G.structs.filter((c) => c.house).map((c) => c.house))];
      const validChunks = () => houses.every((H) => [...H.chunks.values()].every((m) => {
        const a = m.geometry.attributes.surfaceKind;
        return a && a.count === m.geometry.attributes.position.count && [...a.array].every((v) => v >= 0 && v <= 7);
      }));
      const before = validChunks();
      const wall = G.structs.find((c) => c.house && c.surface === 1 && !c.indestructible && c.maxY - c.minY > 2);
      const H = wall.house, oldMesh = H.chunks.get(wall.chunk).uuid;
      G.damageStruct(wall, wall.hp + 10, G.player);
      const rebuilt = !wall.alive && oldMesh !== H.chunks.get(wall.chunk)?.uuid && validChunks();
      const blueWood = G.structs.some((c) => c.surface === 1 && c.mesh.material.color.b > c.mesh.material.color.r + 0.05);
      const stone = G.structs.some((c) => c.surface === 3 && Math.abs(c.mesh.position.x) < 20 && Math.abs(c.mesh.position.z) < 15);
      const curvedStone = houses.some((h) => h.deco.some((d) => d.geo.type === 'CylinderGeometry' && d.surface === 3));
      for (const c of G.chars) if (!c.isPlayer) c.alive = false;
      const p = G.player;
      p.mode = 'ground'; p.pos.set(-60, G.terrainH(-60, 32), 32); p.vel.set(0, 0, 0); p.grounded = true;
      G.setCam(0, -0.15); advanceTime(500);
      return { deterministic, distinct, before, rebuilt, blueWood, stone, curvedStone, flipped: L.atlas.flipY,
        atlas: [L.atlas.image.width, L.atlas.image.height], grass: L.grass.image.width,
        styles: ['wood', 'brick', 'agency', 'adobe'].map(surfaceForStyle),
        terrainVersion: G.surfaces.terrain.userData.surfaceVersion, startZ: p.pos.z };
    });
    assert(result.deterministic); assert.equal(result.distinct, 8);
    assert.equal(result.flipped, false, 'Atlas rows must not swap brick with metal');
    assert.deepEqual(result.atlas, [1024, 512]); assert.equal(result.grass, 512);
    assert.deepEqual(result.styles, [1, 2, 3, 4]);
    assert(result.before && result.rebuilt && result.blueWood && result.stone && result.curvedStone);
    assert.equal(result.terrainVersion, 1);
    await page.keyboard.down('KeyW');
    await page.evaluate(() => { for (let i = 0; i < 36; i++) __game.stepOnly(1 / 60); advanceTime(16); });
    await page.keyboard.up('KeyW');
    assert(await page.evaluate((z) => __game.player.pos.z < z - 2, result.startZ), 'Walk on textured terrain');
    await load('haute');
    await page.evaluate(() => {
      const G = __game, p = G.player;
      for (const c of G.chars) if (!c.isPlayer) c.alive = false;
      p.mode = 'ground'; p.pos.set(10, 6.7, 30); p.vel.set(0, 0, 0); p.grounded = true;
      G.setCam(0, 0); advanceTime(250);
    });
    assert.deepEqual(errors, []);
    console.log('PASS: deterministic original atlas/grass, eight distinct tiles, correct atlas orientation, explicit styles, blue wood, Agency stone, destruction/rebatching, walking and low/high WebGL shaders; no console errors.');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
