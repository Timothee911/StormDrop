#!/usr/bin/env node
// Eau et neige : flottaison sur la houle, plongeon sans dégâts, plongée profonde et
// remontée, sortie de l'eau en pataugeant, poses de nage ; neige au sol, flocons
// et traces de pas dans le massif enneigé.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  let count = 0;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.evaluateOnNewDocument(() => { window.requestAnimationFrame = fn => { window.__qaFrame = fn; return 1; }; });
    await page.goto(`${process.env.QA_URL || 'http://localhost:8090'}/game.html?lowq`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__game?.player?.mode === 'bus', { polling: 200, timeout: 60000 });
    const check = (name, ok, detail) => {
      assert.ok(ok, `${name}: ${JSON.stringify(detail)}`); count++;
      console.log(`PASS | ${name}${detail === undefined ? '' : ' | ' + JSON.stringify(detail)}`);
    };
    const r = await page.evaluate(() => {
      const g = window.__game, p = g.player, out = {};
      g.jumpFromBus(); window.advanceTime(20000);
      g.setDisguise(true); p.hp = p.shield = 10000;
      // 1. flottaison : la ligne de flottaison suit la houle
      p.mode = 'ground'; p.pos.set(450, -0.9, 0); p.vel.set(0, 0, 0); p.grounded = true;
      window.advanceTime(2500);
      const rel = [], surf = [];
      for (let i = 0; i < 20; i++) { window.advanceTime(100); rel.push(p.pos.y - p.waterSurf); surf.push(p.waterSurf); }
      out.float = { inWater: p.inWater, relMin: Math.min(...rel), relMax: Math.max(...rel), surfRange: Math.max(...surf) - Math.min(...surf), pose: p.waterPose };
      // 2. plongeon de 20 m : on s'enfonce puis on remonte, sans dégâts
      p.pos.set(450, 20, 10); p.vel.set(0, 0, 0); p.grounded = false;
      const hp0 = p.hp; let minY = 99;
      for (let i = 0; i < 80; i++) { window.advanceTime(50); minY = Math.min(minY, p.pos.y); }
      out.plunge = { minY, endRel: p.pos.y - p.waterSurf, lost: hp0 - p.hp, inWater: p.inWater };
      // 3. plongée profonde puis remontée en relâchant
      p.crouchToggle = true; window.advanceTime(3000);
      out.dive = { y: p.pos.y, pose: p.waterPose, cam: g.camera.position.y < g.waveAt(g.camera.position.x, g.camera.position.z) };
      p.crouchToggle = false; window.advanceTime(4500);
      out.up = { rel: p.pos.y - p.waterSurf, pose: p.waterPose };
      // 4. vers la plage : nage -> pataugeage -> terre ferme
      p.pos.set(395, -0.9, 0); p.vel.set(0, 0, 0);
      g.setCam(Math.PI / 2, 0); g.keys.KeyW = true;
      const seen = new Set(); let wadeSpeed = 0, landSpeed = 0;
      for (let i = 0; i < 70; i++) {
        window.advanceTime(200);
        const st = p.inWater ? 'S' : p.wadeD > 0.3 ? 'W' : p.wadeD > 0 ? 'w' : 'L';
        seen.add(st); if (i % 10 === 0) (out.tr = out.tr || []).push([+p.pos.x.toFixed(1), +p.pos.y.toFixed(2), st]);
        const hs = Math.hypot(p.vel.x, p.vel.z);
        if (st === 'W') wadeSpeed = Math.max(wadeSpeed, hs);
        if (st === 'L') landSpeed = Math.max(landSpeed, hs);
      }
      g.keys.KeyW = false;
      out.shore = { seen: [...seen].join(''), wadeSpeed, landSpeed, x: p.pos.x, y: p.pos.y, tr: out.tr };
      // 5. neige : flocons et empreintes dans le massif enneigé
      p.pos.set(12, g.terrainH(12, 120) + 0.1, 120); p.vel.set(0, 0, 0);
      g.setCam(Math.PI / 2, -0.3); window.advanceTime(4000);
      const f0 = g.footprints;
      g.keys.KeyW = true; window.advanceTime(2500); g.keys.KeyW = false;
      out.snow = { snowfall: g.snowfall, prints: g.footprints - f0, step: p.pos.x };
      p.pos.set(-300, g.terrainH(-300, 0) + 0.1, 0); window.advanceTime(6000);
      out.noSnow = { snowfall: g.snowfall, h: g.terrainH(-300, 0) };
      const geo = g.terrainMesh.geometry;
      out.snowAttr = !!geo.attributes.aSnow && Array.from(geo.attributes.aSnow.array).some(v => v > 0.9);
      return out;
    });
    check('flottaison : nageur à flot, épaules hors de l\'eau, suit la houle', r.float.inWater && r.float.relMin > -1.25 && r.float.relMax < -0.65 && r.float.surfRange > 0.01 && r.float.pose === 'tread', r.float);
    check('plongeon de 20 m : on s\'enfonce, on remonte, aucun dégât', r.plunge.minY < -1.6 && r.plunge.lost === 0 && r.plunge.inWater && r.plunge.endRel > -1.3, r.plunge);
    check('plongée : on descend sous la surface, caméra sous l\'eau', r.dive.y < -3 && r.dive.pose === 'dive' && r.dive.cam, r.dive);
    check('relâcher la plongée : remontée jusqu\'à la surface', r.up.rel > -1.3 && r.up.rel < -0.6 && r.up.pose === 'tread', r.up);
    check('vers la plage : nage, pataugeage puis terre ferme', r.shore.seen.includes('S') && r.shore.seen.includes('W') && r.shore.seen.includes('L') && r.shore.wadeSpeed < r.shore.landSpeed, r.shore);
    check('neige : flocons qui tombent dans le massif enneigé', r.snow.snowfall > 0.5, r.snow);
    check('neige : chaque pas laisse une empreinte', r.snow.prints >= 4, r.snow);
    check('pas de flocons hors du massif enneigé', r.noSnow.snowfall < 0.1, r.noSnow);
    check('couche de neige du sol présente (attribut aSnow)', r.snowAttr);
    check('aucune nouvelle erreur JavaScript', errors.length === 0, errors);
    console.log(`${count} contrôles validés.`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
