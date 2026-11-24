#!/usr/bin/env node
// Gameplay d'équipe : mise à terre, réanimation (IA et joueur), élimination en
// cascade, siphon à l'élimination et pings (ennemi / butin / lieu).
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
    await page.evaluateOnNewDocument(() => {
      window.requestAnimationFrame = fn => { window.__qaFrame = fn; return 1; };
    });
    const hash = encodeURIComponent(JSON.stringify({ mode: 'duo', players: 50 }));
    await page.goto(`${process.env.QA_URL || 'http://localhost:8090'}/game.html?lowq#${hash}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__game?.player?.mode === 'bus', { polling: 200, timeout: 60000 });
    const check = (name, ok, detail) => {
      assert.ok(ok, `${name}: ${JSON.stringify(detail)}`); count++;
      console.log(`PASS | ${name}${detail === undefined ? '' : ' | ' + JSON.stringify(detail)}`);
    };

    // Le joueur et son coéquipier IA au sol, côte à côte ; le reste reste dans le bus.
    const setup = await page.evaluate(() => {
      const g = window.__game, p = g.player, m = g.mates[0];
      window.__place = (c, x, z) => { c.mode = 'ground'; c.parts.glider.visible = false; c.pos.set(x, g.terrainH(x, z) + 0.05, z); c.vel.set(0, 0, 0); c.grounded = true; c.mesh.visible = true; };
      // couloir dégagé : ni tronc, ni rocher, ni mur dans une bande de 5 m de large (25 m devant, 8 m derrière)
      window.__clear = (x, h, z) => { g.scene.updateMatrixWorld(); for (const dz of [-2.5, -1.7, -0.9, 0, 0.9, 1.7, 2.5]) for (const [dx, far] of [[1, 25], [-1, 8]]) for (const y of [0.9, 1.4]) if (g.castRay(new g.THREE.Vector3(x, h + y, z + dz), new g.THREE.Vector3(dx, 0, 0), far, null)) return false; return true; };
      window.__findFlat = () => { for (let x = -300; x < 300; x += 12) for (let z = -300; z < 300; z += 12) { const h = g.terrainH(x, z); if (h > 3 && h < 12 && Math.abs(g.terrainH(x + 20, z) - h) < 0.6 && Math.abs(g.terrainH(x, z + 20) - h) < 0.6 && Math.abs(g.terrainH(x - 20, z) - h) < 0.6 && window.__clear(x, h, z)) return { x, z }; } return { x: 0, z: 30 }; };
      const f = window.__findFlat(); window.__flat = f;
      g.jumpFromBus(); window.__place(p, f.x, f.z); window.__place(m, f.x + 6, f.z);
      p.hp = 100; p.shield = 0;
      return { mate: !!m, team: m && m.team === p.team, flat: f };
    });
    check('Duo : un coéquipier IA dans l\'équipe du joueur', setup.mate && setup.team, setup);

    const enemyId = await page.evaluate(() => {
      const g = window.__game, e = g.bots.find(b => !b.mate && b.alive);
      window.__enemy = e; return e.name;
    });

    // 1. Mise à terre du joueur
    const down = await page.evaluate(() => {
      const g = window.__game, p = g.player;
      g.damage(p, 500, window.__enemy, false, 'Test');
      return { alive: p.alive, downed: p.downed, hp: p.hp, downHp: p.downHp, hud: document.getElementById('hud').classList.contains('downed') };
    });
    check('0 PV avec un coéquipier debout : le joueur est à terre, pas éliminé', down.alive && down.downed && down.hp === 0 && down.downHp === 100, down);
    const crawl = await page.evaluate(() => {
      const g = window.__game, p = g.player, m = g.mates[0];
      m.mode = 'bus'; // l'IA attend : on mesure le saignement seul
      g.damage(p, 20, window.__enemy, false, 'Test');
      const afterHit = p.downHp; window.advanceTime(2000);
      g.player.pos.y; m.mode = 'ground';
      return { afterHit, afterBleed: p.downHp, alive: p.alive, prompt: document.getElementById('prompt').textContent };
    });
    check('à terre : les balles et le saignement entament la jauge', crawl.afterHit === 80 && crawl.afterBleed < 72 && crawl.afterBleed > 60 && crawl.alive, crawl);
    check('à terre : message d\'aide affiché', /TERRE/.test(crawl.prompt), crawl.prompt);

    // 2. L'IA vient relever le joueur
    const botRevive = await page.evaluate(() => {
      const g = window.__game, p = g.player, m = g.mates[0];
      window.__place(m, window.__flat.x + 8, window.__flat.z); m.target = null; m.think = 0;
      let revivedAt = -1;
      for (let i = 0; i < 16 * 60 && revivedAt < 0; i++) { g.stepOnly(1 / 60); if (!p.downed) revivedAt = i / 60; }
      return { revivedAt, hp: p.hp, alive: p.alive };
    });
    check('le coéquipier IA rejoint et réanime le joueur (30 PV)', botRevive.revivedAt > 5 && botRevive.alive && botRevive.hp === 30, botRevive);

    // 3. Le joueur relève son coéquipier avec la touche Interagir
    const mateDown = await page.evaluate(() => {
      const g = window.__game, p = g.player, m = g.mates[0];
      window.__place(m, p.pos.x + 1.5, p.pos.z);
      g.damage(m, 500, window.__enemy, false, 'Test');
      window.advanceTime(50);
      return { downed: m.downed, alive: m.alive, prompt: document.getElementById('prompt').textContent, tm: document.querySelector('#teamHud .tm')?.className };
    });
    check('coéquipier à terre : invite « Réanimer » et état visible dans l\'équipe', mateDown.downed && mateDown.alive && /Réanimer/.test(mateDown.prompt) && /down/.test(mateDown.tm), mateDown);
    await page.keyboard.press('e');
    const playerRevive = await page.evaluate(() => {
      const g = window.__game, p = g.player, m = g.mates[0];
      const started = p.reviving === m;
      window.advanceTime(2500);
      const mid = { reviving: p.reviving === m, t: m.reviveT, bar: document.getElementById('useBar').style.display };
      window.advanceTime(3000);
      return { started, mid, downed: m.downed, hp: m.hp, xp: g.xp };
    });
    check('Interagir près du blessé lance la réanimation, barre de progression', playerRevive.started && playerRevive.mid.reviving && playerRevive.mid.t > 2 && playerRevive.mid.bar === 'block', playerRevive.mid);
    check('après 5 s le coéquipier est relevé', !playerRevive.downed && playerRevive.hp === 30, playerRevive);

    // 4. Élimination en cascade : plus personne debout → les blessés tombent
    const wipe = await page.evaluate(() => {
      const g = window.__game, p = g.player, m = g.mates[0];
      p.hp = 1000; // le joueur reste debout pendant que le coéquipier tombe
      g.damage(m, 500, window.__enemy, false, 'Test');
      const mateDowned = m.downed;
      // ennemi : on élimine son coéquipier, puis on le met à 0 → il est éliminé directement
      const e = window.__enemy, eMates = g.bots.filter(b => b !== e && b.team === e.team);
      for (const b of eMates) { b.mode = 'ground'; g.damage(b, 5000, p, false, 'Test'); if (b.downed) g.damage(b, 5000, p, false, 'Test'); }
      window.__place(e, p.pos.x + 30, p.pos.z);
      e.hp = 100; e.shield = 0;
      p.hp = 40; p.shield = 0;
      g.damage(e, 500, p, false, 'Test');
      return { mateDowned, enemyDead: !e.alive, enemyDowned: !!e.downed, hp: p.hp, shield: p.shield };
    });
    check('dernier survivant de son équipe : éliminé sans passer à terre', wipe.enemyDead && !wipe.enemyDowned, wipe);
    check('siphon : +50 à l\'élimination (PV d\'abord)', wipe.hp === 90 && wipe.shield === 0, wipe);

    // 5. Pings
    const pings = await page.evaluate(() => {
      const g = window.__game, p = g.player, THREE = g.THREE;
      const e = g.bots.find(b => !b.mate && b.alive && b.mode === 'bus');
      const aimAt = (x, y, z) => {
        for (let k = 0; k < 3; k++) {
          const c = g.camera.position, dx = x - c.x, dy = y - c.y, dz = z - c.z;
          g.setCam(Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz))); window.advanceTime(17);
        }
      };
      const f = window.__flat;
      const m = g.mates[0]; if (m.downed) g.reviveChar(m, p);
      p.hp = 100; window.__place(p, f.x, f.z); window.__place(m, f.x - 4, f.z - 3); m.think = 99;
      window.__place(e, f.x + 18, f.z); e.think = 99; e.react = 99;
      aimAt(e.pos.x, e.pos.y + 1, e.pos.z);
      g.pingAhead();
      const enemyPing = { on: g.ping.on, kind: g.ping.kind, target: g.ping.target === e };
      window.advanceTime(50);
      const lbl = document.getElementById('pingLbl'), enemyLbl = { shown: lbl.style.display, cls: lbl.className, txt: lbl.textContent };
      // le coéquipier engage l'ennemi signalé
      m.target = null; m.think = 0;
      g.stepOnly(1 / 60);
      const mateTarget = m.target === e;
      e.pos.set(9999, -50, 9999); e.mode = 'bus';
      // ping de butin
      g.ping.on = false;
      const item = g.randWeaponItem();
      g.spawnLoot(item, f.x + 10, g.terrainH(f.x + 10, f.z) + 0.3, f.z);
      window.advanceTime(1200);
      const L = g.loot.find(l => l.item === item && l.alive);
      aimAt(L.pos.x, L.pos.y, L.pos.z);
      g.pingAhead();
      const lootPing = { on: g.ping.on, kind: g.ping.kind, label: g.ping.label };
      // ping de lieu : on vise le sol au loin
      g.ping.on = false; g.marker.on = false;
      aimAt(f.x - 40, g.terrainH(f.x - 40, f.z), f.z);
      g.pingAhead();
      return { enemyPing, enemyLbl, mateTarget, lootPing, marker: g.marker.on };
    });
    check('ping ennemi : cible verrouillée et étiquette rouge', pings.enemyPing.on && pings.enemyPing.kind === 'enemy' && pings.enemyPing.target && pings.enemyLbl.shown === 'block' && pings.enemyLbl.cls === 'p-enemy', pings);
    check('ping ennemi : le coéquipier IA engage la cible', pings.mateTarget, pings);
    check('ping de butin sur une arme au sol', pings.lootPing.on && pings.lootPing.kind === 'loot', pings.lootPing);
    check('ping de lieu : pose le marqueur jaune', pings.marker, pings);

    check('aucune erreur JS pendant le test', errors.length === 0, errors);
    console.log(`\n${count} contrôles OK`);
  } catch (e) {
    console.error('FAIL |', e.message); if (process.env.GITHUB_ACTIONS) console.log('::error title=qa-revive-ping::' + String(e.message).split(String.fromCharCode(10))[0].slice(0, 600)); process.exitCode = 1;
  } finally { await browser.close(); }
})();
