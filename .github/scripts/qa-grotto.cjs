// Physical underground routes and keycard/loot loop; real keyboard input.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.stack));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewport({ width: 1280, height: 800 });
    await page.evaluateOnNewDocument(() => { requestAnimationFrame = () => 0; });
    const cdp = await page.createCDPSession();
    await cdp.send('Network.setBypassServiceWorker', { bypass: true });
    const walk = async (key, frames) => {
      await page.keyboard.down(key);
      const result = await page.evaluate(n => {
        for (let i = 0; i < n; i++) __game.stepOnly(1 / 60);
        const p = __game.player;
        return { x:p.pos.x, y:p.pos.y, z:p.pos.z, water:p.inWater, hp:p.hp };
      }, frames);
      await page.keyboard.up(key); return result;
    };
    const stage = async (x, z, level = 'floorY', yaw = 0) => page.evaluate(({x,z,level,yaw}) => {
      const G = __game, L = G.grottoLayout, p = G.player;
      p.pos.set(L.x + x, L[level], L.z + z); p.vel.set(0,0,0);
      p.grounded = true; p.mode = 'ground'; G.setCam(yaw,0);
    }, {x,z,level,yaw});
    for (const quality of ['basse', 'haute']) {
      const hash = encodeURIComponent(JSON.stringify({settings:{quality,outline:0}}));
      await page.goto(`${process.env.QA_URL || 'http://127.0.0.1:8090'}/game.html?grotto=${quality}#${hash}`, {waitUntil:'load',timeout:120000});
      await page.waitForFunction(() => window.__game?.player, {polling:100,timeout:120000});
      const info = await page.evaluate(() => {
        const G = __game, L = G.grottoLayout, v = G.vaults.find(v=>v.poi.key==='grotto');
        const npcs = G.henchmen.filter(c=>c.henchPoi?.key==='grotto');
        const result = {floor:L.floorY,surface:L.surfaceY,gallery:L.galleryY,x:L.x,z:L.z,
          boss:npcs.find(c=>c.boss).pos.toArray(),bossWeapon:npcs.find(c=>c.boss).slots[1].id,
          guards:npcs.filter(c=>!c.boss).map(c=>c.pos.y),vaults:G.vaults.length,
          grottoVaults:G.vaults.filter(v=>v.poi.key==='grotto').length,vaultY:v.y,
          roofSolid:L.roofCol.contains(L.x-5,L.z+5),shaftOpen:!L.roofCol.contains(L.shaft.x,L.shaft.z),
          vertices:L.roof.geometry.attributes.position.count};
        for (const c of G.chars) if (!c.isPlayer) {c.alive=false;c.mesh.visible=false;}
        return result;
      });
      assert.equal(info.vaults,5); assert.equal(info.grottoVaults,1);
      assert.equal(info.bossWeapon,'minigun'); assert.equal(info.boss[1],info.floor);
      assert.equal(info.guards.length,4); assert(info.guards.every(y=>y<info.surface));
      assert.equal(info.vaultY,info.floor); assert(info.surface-info.floor>=14);
      assert(info.roofSolid&&info.shaftOpen&&info.vertices>200);
      // Walk from outside the surface portal, down 14m and back up.
      await stage(-22,49,'surfaceY');
      const down = await walk('KeyW',430);
      assert(Math.abs(down.y-info.floor)<.25,`Stairs down: ${JSON.stringify(down)}`);
      assert(down.z<info.z+5); assert.equal(down.water,false);
      const up = await walk('KeyS',430);
      assert(up.y>info.surface-2.5&&up.y<info.surface+.2,`Stairs up onto exterior approach: ${JSON.stringify(up)}`);
      assert(up.z>info.z+43);
      // The gallery has a second continuous staircase, not a decorative ladder.
      await stage(25,22);
      const gallery = await walk('KeyW',180);
      assert(Math.abs(gallery.y-info.gallery)<.3,`Gallery: ${JSON.stringify(gallery)}`);
      const galleryDown = await walk('KeyS',180);
      assert(Math.abs(galleryDown.y-info.floor)<.3);
      // Walkable roof and a real drop through the circular hole.
      await stage(-5,5,'surfaceY');
      const roof = await walk('KeyA',6); assert(Math.abs(roof.y-info.surface)<.1);
      await stage(6,-3,'surfaceY');
      await page.evaluate(()=>{__game.player.grounded=false;__game.player.manualFall=true;for(let i=0;i<140;i++)__game.stepOnly(1/60);});
      assert(Math.abs(await page.evaluate(()=>__game.player.pos.y)-info.floor)<.3,'Drop through shaft reaches hangar');
      // Updraft exits above the roof; moving out of it lands on the surface.
      await stage(-15,-12);
      await page.evaluate(()=>{for(let i=0;i<70;i++)__game.stepOnly(1/60);});
      assert(await page.evaluate(()=>__game.player.pos.y>__game.grottoLayout.surfaceY+2),'Vent exit rises above ground');
      // Ceiling is solid outside the openings and not a raycast-only visual.
      const rays = await page.evaluate(()=>{
        const G=__game,L=G.grottoLayout,up=new G.THREE.Vector3(0,1,0);
        G.camera.parent.updateMatrixWorld(true);
        const solid=G.castRay(new G.THREE.Vector3(L.x-5,L.floorY+2,L.z+5),up,30,G.player);
        const hole=G.castRay(new G.THREE.Vector3(L.shaft.x,L.floorY+2,L.shaft.z),up,30,G.player);
        return {solid:solid?.type,hole:hole?.type};
      });
      assert.equal(rays.solid,'struct'); assert.notEqual(rays.hole,'struct');
      // Stage a low-headroom jump beneath the ceiling and use the jump key.
      await stage(-5,5,'surfaceY');
      await page.evaluate(()=>{__game.player.pos.y-=4;});
      await page.keyboard.down('Space');
      const head = await page.evaluate(()=>{
        let max = -Infinity;
        for(let i=0;i<35;i++){__game.stepOnly(1/60);max=Math.max(max,__game.player.pos.y);}
        return max+1.85;
      });
      await page.keyboard.up('Space');
      assert(head<=info.surface-2+.02,`Solid underside stops jump: ${head}`);
      await stage(-8,-13.7);
      await page.keyboard.press('KeyE');
      assert.equal(await page.evaluate(()=>__game.vaults.find(v=>v.poi.key==='grotto').state),'locked');
      await page.evaluate(()=>{__game.player.keycards.agency=true;});
      await page.keyboard.press('KeyE');
      assert.equal(await page.evaluate(()=>__game.vaults.find(v=>v.poi.key==='grotto').state),'locked');
      await page.evaluate(()=>{__game.player.keycards.grotto=true;});
      await page.keyboard.press('KeyE');
      assert.equal(await page.evaluate(()=>__game.vaults.find(v=>v.poi.key==='grotto').state),'scanning');
      await page.evaluate(()=>{
        const G=__game,v=G.vaults.find(v=>v.poi.key==='grotto');
        G.openChest(G.chests.find(c=>c.vaultRef===v));
        if(G.chests.some(c=>c.vaultRef===v&&c.opened))throw Error('Sealed loot escaped');
        for(let i=0;i<300;i++)G.stepOnly(1/60);
      });
      assert.equal(await page.evaluate(()=>__game.vaults.find(v=>v.poi.key==='grotto').open),true);
      const inside = await walk('KeyW',65);
      assert(inside.z<info.z-18,`Enter vault ${JSON.stringify(inside)}`);
      await page.keyboard.press('KeyE'); await page.keyboard.press('KeyE'); await page.keyboard.press('KeyE');
      assert(await page.evaluate(()=>__game.chests.some(c=>c.vaultRef?.poi.key==='grotto'&&c.opened)), 'Loot a chest after picking up the entrance weapon');
      const end = await walk('KeyS',65); assert(end.z>info.z-16);
      console.log(`PASS Grotto ${quality}: stairs down/up, gallery, roof/shaft, updraft, interior Brutus/vault/card/loot.`);
    }
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
