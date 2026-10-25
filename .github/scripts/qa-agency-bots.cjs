// Run with a local HTTP server on 8090 and Puppeteer installed (same as the other QA scripts).
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.setViewport({ width: 1280, height: 800 });
    // Deterministic stepping avoids overloading software GPUs in CI.
    await page.evaluateOnNewDocument(() => { window.requestAnimationFrame = () => 0; });
    const options = encodeURIComponent(JSON.stringify({ settings: { quality: 'basse', outline: 0 } }));
    await page.goto(`${process.env.QA_URL || 'http://localhost:8090'}/game.html#${options}`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.__game?.player, { polling: 100, timeout: 120000 });
    const info = await page.evaluate(() => {
      const G = __game, a = G.agencyLayout;
      const result = { profiles: [...new Set(G.bots.map((b) => b.profile))], vaults: G.vaults.length,
        vault: G.vaults[0].y, basement: a.basementY, lobby: a.lobbyY, lower: a.lowerY, pipes: a.pipeRuns, valves: a.valves,
        bossY: G.chars.find((b) => b.boss && b.bossPoi.key === 'agency').pos.y };
      for (const c of G.chars) if (!c.isPlayer) c.alive = false;
      const p = G.player;
      p.mode = 'ground'; p.pos.set(1.7, a.lobbyY, 21); p.vel.set(0, 0, 0); p.grounded = true;
      G.setCam(0, 0);
      return result;
    });
    assert.equal(info.profiles.length, 5); assert.equal(info.vaults, 5);
    assert.equal(info.vault, info.basement); assert(info.vault > 0, 'Dry basement above sea level');
    assert.equal(info.bossY, info.lobby); assert(info.vault < info.lobby - 3);
    assert(info.lower < info.basement - 4 && info.pipes >= 20 && info.valves >= 10);
    const drySea = await page.evaluate(() => {
      const water = __game.camera.parent.children.find((m) => m.isMesh && m.material.color?.getHex() === 0x23a3e0);
      return { shape: water.geometry.type, holes: water.geometry.parameters.shapes.holes.length };
    });
    assert.equal(drySea.shape, 'ShapeGeometry'); assert.equal(drySea.holes, 1, 'Sea has a real foundation cutout');
    const walk = async (key, frames) => {
      await page.keyboard.down(key);
      const result = await page.evaluate((n) => {
        for (let i = 0; i < n; i++) __game.stepOnly(1 / 60);
        const p = __game.player;
        return { x: p.pos.x, y: p.pos.y, z: p.pos.z, water: p.inWater };
      }, frames);
      await page.keyboard.up(key);
      return result;
    };
    await walk('KeyW', 90); await walk('KeyA', 160);
    const down = await walk('KeyW', 105);
    assert(Math.abs(down.y - info.basement) < 0.2, 'Walk down interior staircase');
    assert.equal(down.water, false);
    await walk('KeyD', 65); await walk('KeyW', 8);
    await page.keyboard.press('KeyE');
    assert.equal(await page.evaluate(() => __game.vaults[0].open), false, 'No card');
    await page.evaluate(() => { __game.player.keycards.shark = true; });
    await page.keyboard.press('KeyE');
    assert.equal(await page.evaluate(() => __game.vaults[0].open), false, 'Wrong card');
    await page.evaluate(() => { __game.player.keycards.agency = true; });
    await page.keyboard.press('KeyE');
    assert.equal(await page.evaluate(() => __game.vaults[0].state), 'scanning');
    assert.equal(await page.evaluate(() => __game.vaults[0].open), false, 'Not instantly open');
    await page.evaluate(() => {
      const G = __game, v = G.vaults[0], c = G.chests.find((c) => c.vaultRef === v);
      G.openChest(c); if (c.opened) throw new Error('Chest opened before door completed');
      G.openVault(v);
      for (let i = 0; i < 120; i++) G.stepOnly(1 / 60);
    });
    assert.equal(await page.evaluate(() => __game.vaults[0].state), 'opening');
    assert(await page.evaluate(() => __game.vaults[0].mechanism.hinge.rotation.y > 0));
    const frozenAt = await page.evaluate(() => __game.vaults[0].elapsed);
    await page.keyboard.press('KeyP');
    await page.evaluate(() => { for (let i = 0; i < 120; i++) __game.stepOnly(1 / 60); });
    assert.equal(await page.evaluate(() => __game.vaults[0].elapsed), frozenAt, 'Pause freezes the mechanism');
    await page.keyboard.press('KeyP');
    await page.evaluate(() => { for (let i = 0; i < 180; i++) __game.stepOnly(1 / 60); });
    assert.equal(await page.evaluate(() => __game.vaults[0].open), true, 'Midas card');
    assert(await page.evaluate(() => __game.vaults[0].door.alive && !!__game.vaults[0].mechanism.leaf.parent), 'Door stays visible and solid');
    const xp = await page.evaluate(() => __game.xp);
    await page.evaluate(() => { __game.openVault(__game.vaults[0]); for (let i = 0; i < 30; i++) __game.stepOnly(1 / 60); });
    assert.equal(await page.evaluate(() => __game.xp), xp, 'No duplicate reward');
    const inside = await walk('KeyW', 48);
    assert(inside.z < -5 && Math.abs(inside.y - info.basement) < 0.3, `Enter vault: ${JSON.stringify(inside)}`);
    await page.keyboard.press('KeyE'); await page.keyboard.press('KeyE'); await page.keyboard.press('KeyE');
    assert(await page.evaluate(() => __game.chests.some((c) => c.opened && c.y < __game.agencyLayout.lobbyY)), 'Loot vault chest');
    await walk('KeyS', 50); await walk('KeyA', 65);
    const up = await walk('KeyS', 108);
    assert(Math.abs(up.y - info.lobby) < 0.2, `Return upstairs: ${JSON.stringify(up)}`);
    await page.evaluate(() => {
      const p = __game.player; p.pos.set(12, __game.agencyLayout.basementY, 9.3); p.vel.set(0, 0, 0);
    });
    await walk('KeyD', 36);
    const lower = await walk('KeyW', 102);
    assert(Math.abs(lower.y - info.lower) < 0.2, `Walk down to B2: ${JSON.stringify(lower)}`);
    assert.equal(lower.water, false, 'Dry technical basement below sea level');
    const upper = await walk('KeyS', 106);
    assert(Math.abs(upper.y - info.basement) < 0.2, 'Walk back to B1');
    const decisions = await page.evaluate(() => {
      const G = __game, p = G.player; p.pos.set(100, 10, 90);
      return G.bots.slice(0, 5).map((b) => {
        Object.assign(b, { alive: true, mode: 'ground', target: p, seeing: true, think: 100,
          react: 100, hp: 10, shield: 0, buildCd: 100, buildQ: [], boxedT: 0, rampRush: 0, healing: 0, reloading: 0 });
        b.pos.set(130, 10, 90); b.wp = p.pos.clone(); b.slots[1] = { kind: 'weapon', id: 'ar', rarity: 1, mag: 30 }; b.cur = 1;
        G.botThink(b, 1 / 60); const result = b.tactic; b.alive = false; return result;
      });
    });
    assert(decisions.every((d) => d === 'repli'), 'All profiles retreat at critical health');
    const priority = await page.evaluate(() => {
      const G = __game, b = G.bots[0];
      Object.assign(b, { alive: true, hp: 100, shield: 100, think: 100, boxedT: 2, buildQ: [], rampRush: 2 });
      b.pos.set(130, 10, 90); b.wp = G.player.pos.clone();
      Object.assign(G.storm, { phase: 0, cx: 100, cz: 90, r: 10 });
      G.botThink(b, 1 / 60);
      return { tactic: b.tactic, boxedT: b.boxedT, rampRush: b.rampRush };
    });
    assert.equal(priority.tactic, 'zone');
    assert.equal(priority.boxedT, 0); assert.equal(priority.rampRush, 0);
    assert.deepEqual(errors, []);
    console.log('PASS: dry B1/B2 stairs, pipes/valves, scan/unlock/swing, persistent door, sealed loot and one-time XP, keycards, five bot profiles and storm priority; no page errors.');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
