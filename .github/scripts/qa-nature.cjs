// Shared deterministic detail textures and the existing instanced harvesting pipeline.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewport({ width: 1280, height: 800 });
    await page.evaluateOnNewDocument(() => { window.requestAnimationFrame = () => 0; });
    const cdp = await page.createCDPSession();
    await cdp.send('Network.setBypassServiceWorker', { bypass: true });
    const base = process.env.QA_URL || 'http://127.0.0.1:8090';
    for (const quality of ['basse', 'haute']) {
      const hash = encodeURIComponent(JSON.stringify({ settings: { quality, outline: 0 } }));
      await page.goto(`${base}/game.html?qa_quality=${quality}#${hash}`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForFunction(() => window.__game?.nature && window.__game.player, { polling: 100, timeout: 120000 });
      const result = await page.evaluate(async () => {
        const G = __game, N = G.nature, p = G.player;
        const { createNatureLibrary } = await import('/js/surface-materials.js');
        const second = createNatureLibrary(G.THREE), kinds = ['bark', 'foliage', 'rock'];
        const hash = texture => {
          const c = texture.image, a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
          let h = 2166136261;
          for (const v of a) h = Math.imul(h ^ v, 16777619);
          return h >>> 0;
        };
        const deterministic = kinds.every(k => hash(N.library[k]) === hash(second[k]));
        const distinct = new Set(kinds.map(k => hash(N.library[k]))).size;
        const sizes = kinds.map(k => [N.library[k].image.width, N.library[k].image.height]);
        kinds.forEach(k => second[k].dispose());
        for (const c of G.chars) if (!c.isPlayer) c.alive = false;
        p.mode = 'ground'; p.vel.set(0, 0, 0); p.grounded = true; p.mats.wood = p.mats.stone = 0;
        G.selectSlot(0);
        // Use production ray picking and melee; no direct HP or matrix mutations.
        const hitResource = (resource, type) => {
          const h = G.terrainH(resource.x, resource.z), origin = new G.THREE.Vector3(resource.x, h + 1, resource.z + 2.8);
          p.pos.copy(origin); p.pos.y = h;
          const dir = new G.THREE.Vector3(0, 0, -1);
          G.camera.parent.updateMatrixWorld(true);
          const hit = G.castRay(origin, dir, 4, p);
          if (!hit || hit.type !== type) throw new Error(`Expected ${type}, found ${hit?.type} at ${JSON.stringify({ i: resource.i, x: resource.x, z: resource.z, h })}`);
          const hp = resource.hp;
          for (let i = 0; i < 4; i++) { p.cool = 0; G.fire(p, origin, dir, false); }
          return { hp, after: resource.hp, alive: resource.alive, colliderAlive: resource.col.alive };
        };
        const t = N.trees.find(t => t.i > 0 && t.y > 3);
        const neighbour = N.trees[(t.i + 1) % N.trees.length];
        const tree = hitResource(t, 'tree');
        const hiddenTree = t.ims.every(im => {
          const matrix = new G.THREE.Matrix4(); im.getMatrixAt(t.i, matrix);
          return matrix.elements[0] === 0 && matrix.elements[5] === 0 && matrix.elements[10] === 0;
        });
        const r = N.rocks.find(r => r.i > 0 && r.s > 1.5);
        const rock = hitResource(r, 'rock');
        const matrix = new G.THREE.Matrix4(); N.meshes.rock.getMatrixAt(r.i, matrix);
        const hiddenRock = matrix.elements[0] === 0 && matrix.elements[5] === 0 && matrix.elements[10] === 0;
        p.pos.set(-60, G.terrainH(-60, 32), 32); p.vel.set(0, 0, 0); G.setCam(0, .15); advanceTime(500);
        return { deterministic, distinct, sizes, tree, rock, hiddenTree, hiddenRock, neighbour: neighbour.alive,
          wood: p.mats.wood, stone: p.mats.stone, counts: [N.trees.length, N.rocks.length],
          sharedFoliage: N.meshes.foliage.material === N.meshes.crown.material,
          materials: Object.values(N.meshes).map(im => im.material.userData.natureSurface),
          instanced: Object.values(N.meshes).every(im => im.isInstancedMesh) };
      });
      assert(result.deterministic); assert.equal(result.distinct, 3);
      assert.deepEqual(result.sizes, [[512, 512], [512, 512], [512, 512]]);
      assert(result.hiddenTree && result.hiddenRock && result.neighbour);
      assert(!result.tree.alive && !result.rock.alive);
      assert(!result.tree.colliderAlive && !result.rock.colliderAlive);
      assert(result.wood >= 42 && result.stone >= 48);
      assert(result.sharedFoliage && result.instanced);
      assert.deepEqual(result.materials, ['bark', 'foliage', 'foliage', 'rock']);
      assert.equal(result.counts[1], 110);
      assert.deepEqual(errors, [], `Shader or JS errors at ${quality}`);
      console.log(`Nature ${quality}:`, JSON.stringify(result));
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
