#!/usr/bin/env node
// Contrôle ciblé de la géométrie ET des circulations. Les touches passent
// réellement par le navigateur ; seuls le placement initial et le temps sont
// déterministes. Le rendu logiciel est limité aux captures de contrôle.
const assert = require('node:assert/strict');
const path = require('node:path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules/puppeteer'));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1100, height: 740 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('response', (r) => { if (r.status() >= 400 && new URL(r.url()).hostname === 'localhost') errors.push(`${r.status()} ${r.url()}`); });
    await page.evaluateOnNewDocument(() => {
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (fn) => raf((t) => { window.__qaFrame = () => fn(t); });
    });
    await page.goto(`${process.env.QA_URL || 'http://localhost:8090'}/game.html?lowq`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__game && window.__game.player && window.__game.player.mode === 'bus', { polling: 200, timeout: 60000 });
    const check = (name, ok, detail) => {
      assert.ok(ok, `${name}: ${JSON.stringify(detail)}`);
      console.log(`PASS | ${name}${detail ? ' | ' + JSON.stringify(detail) : ''}`);
    };
    const initial = await page.evaluate(() => {
      const g = window.__game;
      const p = g.POIS.find((p) => p.key === 'shark');
      const car = g.scene.getObjectByName('agency-service-car');
      const panes = g.scene.children.filter((m) => m.name === 'shark-villa-glass');
      const pier = g.structs.find((c) => Math.abs(c.minX - (p.x - 13.4)) < 0.01 && Math.abs(c.maxZ - (p.z + 33)) < 0.01);
      const counts = [13.45, 17.85, 22.25].map((y) => g.chests.filter((c) => !c.vault && Math.abs(c.x) < 21 && Math.abs(c.z) < 16.5 && Math.abs(c.y - y) < 0.3).length);
      return {
        spies: g.POIS.filter((p) => p.spy).length,
        bosses: g.bosses.filter((c) => c.alive).length,
        vaults: g.vaults.length,
        booths: g.booths.length,
        glass: panes.length,
        transparent: panes.every((m) => m.material.transparent && m.material.opacity < 0.5),
        carScale: car.scale.toArray(),
        carWheels: g.vehicles.find((v) => v.mesh === car).wheels.length,
        carFunctional: g.vehicles.some((v) => v.mesh === car && v.col.vehicle === v && v.windows.length === 6),
        pierStep: pier && pier.maxY - p.h,
        pierPosts: pier && pier.house.deco.filter((e) => e.geo.type === 'CylinderGeometry' && Math.abs(e.m.elements[12] - (p.x - 12)) > 1 && Math.abs(e.m.elements[12] - (p.x - 12)) < 1.3 && e.m.elements[13] < p.h).length,
        floorChests: counts,
      };
    });
    check('5 POI, boss, coffres-forts et cabines conservés', ['spies', 'bosses', 'vaults', 'booths'].every((k) => initial[k] === 5), initial);
    check('14 vraies baies transparentes', initial.glass === 14 && initial.transparent, initial.glass);
    check('voiture GHOST fonctionnelle à l’échelle humaine', initial.carScale.join(',') === '1,1,1' && initial.carFunctional, initial.carScale);
    check('4 roues du modèle de conduite conservées', initial.carWheels === 4);
    check('ponton accessible sans saut et 10 pieux latéraux', initial.pierStep <= 0.6 && initial.pierPosts === 10, initial);
    check('2 coffres par étage à l’Agence', initial.floorChests.every((n) => n >= 2), initial.floorChests);

    await page.evaluate(() => {
      const g = window.__game;
      g.jumpFromBus();
      g.setDisguise(true);
      g.player.hp = g.player.shield = 10000;
    });
    const stage = async (key, dx, dy, dz, yaw = 0) => page.evaluate(({ key, dx, dy, dz, yaw }) => {
      const g = window.__game, p = g.POIS.find((p) => p.key === key);
      g.player.pos.set(p.x + dx, p.h + dy, p.z + dz);
      g.player.vel.set(0, 0, 0);
      g.player.mode = 'ground'; g.player.grounded = true; g.player.alive = true;
      g.setCam(yaw, 0);
    }, { key, dx, dy, dz, yaw });
    const walk = async (key, ms) => {
      await page.keyboard.down(key);
      const state = await page.evaluate((ms) => {
        window.advanceTime(ms);
        const c = window.__game.player;
        return { x: c.pos.x, y: c.pos.y, z: c.pos.z, blocked: c.blocked };
      }, ms);
      await page.keyboard.up(key);
      return state;
    };
    await stage('shark', 10, 0, 9.5);
    let c = await walk('w', 1900);
    check('plage → terrasse par l’escalier extérieur', Math.abs(c.y - 7.5) < 0.15 && c.z < -247, c);
    await stage('shark', 0, 5, -3.5);
    c = await walk('w', 650);
    check('entrée de la villa libre', c.z < -252 && Math.abs(c.y - 7.5) < 0.15, c);
    await stage('shark', -5.2, 5, -6.1);
    await walk('w', 1150);
    c = await walk('d', 550);
    check('salon → premier étage sans plafond bloquant', Math.abs(c.y - 12.1) < 0.15, c);
    await stage('shark', 5, 9.6, -6.8);
    await walk('w', 1100);
    c = await walk('a', 500);
    check('premier étage → toit par la trémie est', Math.abs(c.y - 15.9) < 0.15, c);
    await stage('shark', 0, 9.6, -6.5, Math.PI);
    c = await walk('w', 500);
    check('porte → balcon sans trou dans le plancher', Math.abs(c.y - 12.1) < 0.15 && c.z > -250, c);
    await stage('shark', 0, 13.4, -6, Math.PI);
    c = await walk('w', 800);
    check('garde-corps du toit solide', c.z < -251 && c.z > -252.8 && Math.abs(c.y - 15.9) < 0.15, c);
    await stage('shark', -12, 0, 12, Math.PI);
    c = await walk('w', 2400);
    check('plage → ponton sans saut', Math.abs(c.y - 2.95) < 0.15 && c.z > -222, c);
    await page.evaluate(() => window.__game.setCam(0, 0));
    c = await walk('w', 2400);
    check('ponton → plage sans blocage', c.z < -233 && c.y >= 2.4, c);
    for (const [dy, title] of [[4.45, 'premier étage'], [17.65, 'toit']]) {
      await stage('agency', 0, dy, -9, Math.PI);
      c = await walk('w', 900);
      check(`atrium protégé au ${title}`, c.z < -7.3 && Math.abs(c.y - (9 + dy)) < 0.15, c);
    }
    await stage('shark', 0, 0.45, 5);
    c = await walk('w', 900);
    check('passage central entre les dents de la bouche', c.z < -245 && c.y >= 2.4, c);
    await stage('shark', 17, 0, 6);
    c = await walk('w', 650);
    const doorZ = await page.evaluate(() => window.__game.vaults.find((v) => v.poi.key === 'shark').door.maxZ);
    check('porte du coffre-fort atteignable, fermée et solide', Math.abs(c.z - doorZ - 0.42) < 0.1, c);
    await page.evaluate(() => {
      const g = window.__game;
      const pane = g.scene.children.find((m) => m.name === 'shark-villa-glass' && Math.abs(m.position.z + 261.1) < 0.01 && Math.abs(m.position.x + 295.5) < 0.01);
      const lintel = g.structs.find((c) => Math.abs(c.minY - 10.85) < 0.01 && Math.abs((c.minX + c.maxX) / 2 + 295.5) < 0.01 && Math.abs((c.minZ + c.maxZ) / 2 + 261.1) < 0.01);
      if (!pane || !lintel) throw new Error('Baie nord introuvable');
      g.damageStruct(lintel, 10000, g.player);
      window.advanceTime(20);
      if (pane.visible) throw new Error('Vitrage flottant après destruction du linteau');
    });
    check('vitrage supprimé avec son support détruit', true);
    check('aucune erreur JS, WebGL ou ressource manquante', errors.length === 0, errors);
    console.log('Cohérence des POI : tous les contrôles sont passés.');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
