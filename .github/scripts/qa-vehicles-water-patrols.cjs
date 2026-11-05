#!/usr/bin/env node
// Régression des demandes : circuits distincts, B1, voiture et maintien dans l'eau.
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
    await page.goto(`${process.env.QA_URL || 'http://localhost:8090'}/game.html?lowq`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__game?.player?.mode === 'bus', { polling: 200, timeout: 60000 });
    const check = (name, ok, detail) => {
      assert.ok(ok, `${name}: ${JSON.stringify(detail)}`); count++;
      console.log(`PASS | ${name}${detail === undefined ? '' : ' | ' + JSON.stringify(detail)}`);
    };
    const routes = await page.evaluate(() => {
      const g = window.__game, spies = g.chars.filter(c => c.hench);
      const canon = c => [...new Set(c.route.map(p => `${p.x.toFixed(1)},${p.z.toFixed(1)}`))].sort().join(';');
      const all = spies.map(c => ({ id: c.patrolId, route: canon(c), points: c.route.length }));
      g.jumpFromBus(); g.setDisguise(true); g.player.hp = g.player.shield = 10000;
      g.player.pos.set(0, 9.05, 30); g.player.mode = 'ground'; g.player.grounded = true;
      return all;
    });
    check('22 circuits spatialement différents (5 boss et 17 Ombres)', routes.length === 22 && new Set(routes.map(r => r.route)).size === 22, routes.map(r => r.id));
    check('chaque circuit possède au moins trois points', routes.every(r => r.points >= 3));
    const patrol = await page.evaluate(() => {
      const g = window.__game, agents = g.chars.filter(c => c.hench);
      const before = agents.map(c => ({ pos: c.pos.clone(), i: c.routeIdx }));
      let progressed = agents.map(() => false), maxMove = agents.map(() => 0);
      for (let i = 0; i < 900; i++) {
        g.stepOnly(1 / 60);
        agents.forEach((c, j) => { if (c.routeIdx !== before[j].i) progressed[j] = true; maxMove[j] = Math.max(maxMove[j], c.pos.distanceTo(before[j].pos)); });
      }
      return agents.map((c, i) => ({ id: c.patrolId, moved: maxMove[i], progressed: progressed[i], alive: c.alive }));
    });
    check('tous les agents effectuent leur ronde sans rester au départ', patrol.every(r => r.alive && r.moved > 2), patrol);

    // Véhicule déterministe : voiture de service garée sur le quai de l'Agence.
    await page.evaluate(() => {
      const g = window.__game, v = g.vehicles.find(v => v.mesh.name === 'agency-service-car');
      window.__testCar = v;
      g.player.pos.copy(v.pos).add(new g.THREE.Vector3(0, 0, 2.8));
      g.player.vel.set(0, 0, 0); g.player.mode = 'ground'; g.player.grounded = true;
      window.advanceTime(50);
    });
    await page.keyboard.press('e');
    let car = await page.evaluate(() => {
      const g = window.__game, v = window.__testCar, row = document.getElementById('vehicleRow');
      return { mode: g.player.mode, same: g.player.vehicle === v, hidden: row.hidden, hp: row.getAttribute('aria-valuenow'), orange: getComputedStyle(document.getElementById('vehicleFill')).backgroundImage, above: row.getBoundingClientRect().top < document.querySelector('.barrow:last-child').getBoundingClientRect().top };
    });
    check('touche E : barre orange immédiate au-dessus de la vie', car.mode === 'drive' && car.same && !car.hidden && car.hp === '800' && car.orange.includes('255') && car.above, car);
    await page.keyboard.press('e');
    check('sortie : barre voiture masquée', await page.evaluate(() => window.__game.player.mode === 'ground' && document.getElementById('vehicleRow').hidden));
    const glass = await page.evaluate(() => {
      const g = window.__game, v = window.__testCar;
      g.scene.updateMatrixWorld(true);
      const o = v.mesh.localToWorld(new g.THREE.Vector3(0, 1.43, -8));
      const t = v.mesh.localToWorld(new g.THREE.Vector3(0, 1.43, -0.77));
      const dir = t.clone().sub(o).normalize(), pane = v.windows[0];
      const h = g.castRay(o, dir, 15, g.player);
      g.player.slots[1] = {kind:'weapon',id:'sniper',rarity:3,mag:10}; g.player.cur = 1; g.player.cool = g.player.equipT = g.player.reloading = 0; g.player.bloom = 0;
      const fired = g.fire(g.player, o, dir, true);
      g.scene.updateMatrixWorld(true);
      const after = g.castRay(o, dir, 15, g.player);
      return { panes: v.windows.length, transparent: v.windows.every(p => p.mesh.material.transparent && p.mesh.material.opacity < 0.25 && !p.mesh.material.depthWrite), first: h?.type, fired, broken: pane.broken, visible: pane.mesh.visible, removed: after?.pane !== pane, hp: v.hp };
    });
    check('six vitres réellement transparentes et habitacle creux', glass.panes === 6 && glass.transparent, glass);
    check('balle réelle : pare-brise cassé et retiré du raycast', glass.first === 'vehicleGlass' && glass.fired && glass.broken && !glass.visible && glass.removed, glass);
    check('impact sur vitrage réduit la vie voiture', glass.hp < 800 && glass.hp > 0, glass.hp);
    const destruction = await page.evaluate(() => {
      const g = window.__game, v = window.__testCar, bot = g.bots[0];
      g.enterVehicle(g.player, v);
      bot.slots[1] = {kind:'weapon',id:'sniper',rarity:3,mag:10}; bot.cur = 1; bot.vel.set(0,0,0);
      g.scene.updateMatrixWorld(true);
      const o = v.mesh.localToWorld(new g.THREE.Vector3(0, 0.6, -7));
      const t = v.mesh.localToWorld(new g.THREE.Vector3(0, 0.6, -2));
      const dir = t.clone().sub(o).normalize();
      const hp0 = v.hp;
      for (let i = 0; i < 12; i++) { bot.cool = bot.equipT = bot.reloading = 0; bot.item.mag = 10; bot.bloom = 0; g.fire(bot, o, dir, true); }
      return { hp0, hp: v.hp, destroyed: v.destroyed, ejected: g.player.mode === 'ground' && !g.player.vehicle && !v.driver, hidden: document.getElementById('vehicleRow').hidden, refused: g.enterVehicle(g.player, v) === false };
    });
    check('un autre tireur peut détruire la carrosserie', destruction.hp === 0 && destruction.destroyed, destruction);
    check('épave : conducteur éjecté, barre masquée, entrée refusée', destruction.ejected && destruction.hidden && destruction.refused, destruction);
    // Une vitre différente doit pouvoir casser sous le tir d'un bot également.
    const botGlass = await page.evaluate(() => {
      const g = window.__game, v = g.vehicles.find(v => v.kind === 'car' && !v.destroyed), bot = g.bots[0];
      g.scene.updateMatrixWorld(true);
      const o = v.mesh.localToWorld(new g.THREE.Vector3(-6, 1.43, -0.25));
      const t = v.mesh.localToWorld(new g.THREE.Vector3(-0.91, 1.43, -0.25));
      const dir = t.clone().sub(o).normalize(), pane = v.windows.find(p => p.name.includes('avant gauche')) || v.windows[2];
      const hit = g.castRay(o, dir, 10, bot);
      bot.cool = bot.equipT = bot.reloading = 0; bot.bloom = 0; bot.item.mag = 10;
      g.fire(bot, o, dir, true);
      return { hit: hit?.type, broken: pane.broken };
    });
    check('vitre latérale cassée par un bot', botGlass.hit === 'vehicleGlass' && botGlass.broken, botGlass);

    // EAU : l'entrée et les touches sont réelles ; seule la position initiale est préparée.
    await page.evaluate(() => {
      const g = window.__game, p = g.player;
      p.pos.set(620, -0.9, 0); p.vel.set(0, 0, 0); p.grounded = true; p.mode = 'ground'; p.waterAimT = 0;
      p.slots[1] = {kind:'weapon',id:'ar',rarity:2,mag:30}; p.cur = 1; p.cool = p.equipT = p.reloading = 0;
      window.advanceTime(300);
    });
    const idle0 = await page.evaluate(() => ({ pose: __game.player.waterPose, upright: __game.player.mesh.rotation.x, leg: __game.player.parts.hipL.rotation.x, water: __game.player.inWater }));
    await page.evaluate(() => window.advanceTime(170));
    const idle1 = await page.evaluate(() => ({ pose: __game.player.waterPose, upright: __game.player.mesh.rotation.x, leg: __game.player.parts.hipL.rotation.x }));
    check('immobile dans l’eau : personnage vertical', idle0.water && idle0.pose === 'tread' && idle0.upright === 0, idle0);
    check('immobile dans l’eau : jambes animées en permanence', Math.abs(idle0.leg - idle1.leg) > 0.03, [idle0, idle1]);
    await page.keyboard.down('w'); await page.evaluate(() => window.advanceTime(450)); await page.keyboard.up('w');
    check('déplacement dans l’eau : crawl conservé', await page.evaluate(() => __game.player.waterPose === 'crawl' && __game.player.mesh.rotation.x < -1));
    await page.keyboard.down('w'); await page.mouse.down();
    await page.evaluate(() => window.advanceTime(220));
    const aim = await page.evaluate(() => ({ pose: __game.player.waterPose, rot: __game.player.mesh.rotation.x, weapon: __game.player.parts.hand.visible, mag: __game.player.item.mag, legs: __game.player.parts.hipR.rotation.x }));
    await page.mouse.up(); await page.keyboard.up('w');
    check('tir en mouvement dans l’eau : buste droit et arme visible', aim.pose === 'aim' && aim.rot === 0 && aim.weapon && aim.mag < 30, aim);
    await page.evaluate(() => window.advanceTime(1100));
    check('fin de tir : retour au maintien vertical', await page.evaluate(() => __game.player.waterPose === 'tread'));
    await page.keyboard.press('f'); await page.evaluate(() => window.advanceTime(500));
    check('plongée : pose horizontale préservée', await page.evaluate(() => __game.player.waterPose === 'dive'));
    await page.keyboard.press('f'); await page.evaluate(() => window.advanceTime(600));

    // Les pièces sont matérialisées, éclairées et le scanner reste accessible.
    const basement = await page.evaluate(() => {
      const g = window.__game;
      return { signs: g.scene.children.filter(m => m.name === 'agency-basement-sign').length, fixtures: g.scene.children.filter(m => m.name === 'agency-basement-fixture').length, finite: g.structs.every(c => [c.minX,c.maxX,c.minY,c.maxY,c.minZ,c.maxZ].every(Number.isFinite)) };
    });
    check('B1 : signalétique, luminaires et collisions valides', basement.signs === 4 && basement.fixtures === 5 && basement.finite, basement);
    await page.evaluate(() => {
      const g = window.__game, p = g.player;
      p.pos.set(-15.75, 9.05, 8); p.vel.set(0, 0, 0); p.mode = 'ground'; p.grounded = true; p.hp = p.shield = 10000;
      g.setDisguise(true); g.setCam(0, 0);
    });
    await page.keyboard.down('w'); await page.evaluate(() => window.advanceTime(3500)); await page.keyboard.up('w');
    let b = await page.evaluate(() => ({ x:__game.player.pos.x, y:__game.player.pos.y,z:__game.player.pos.z, ground:__game.player.grounded }));
    check('escalier vers B1 praticable au clavier', b.y < 4.1 && b.ground && b.z < -12, b);
    // Reprend l'itinéraire de la cave, avec une commande orientée vers chaque cible.
    const walkTo = async (x,z,limit=3000) => {
      await page.evaluate(({x,z}) => { const g=__game,p=g.player; g.setCam(Math.atan2(-(x-p.pos.x),-(z-p.pos.z)),0); }, {x,z});
      await page.keyboard.down('w');
      for (let t=0;t<limit;t+=80) {
        const near=await page.evaluate(({x,z}) => { window.advanceTime(80);return Math.hypot(__game.player.pos.x-x,__game.player.pos.z-z)<0.8; }, {x,z});
        if(near) break;
      }
      await page.keyboard.up('w');
    };
    await walkTo(-4,-12.6); await walkTo(-4,-4);
    const vault = await page.evaluate(()=>{const v=__game.vaults.find(v=>v.poi.key==='agency');return{x:v.x,z:v.z+4.5};});
    await walkTo(vault.x,vault.z);
    b = await page.evaluate(({x,z})=>({d:Math.hypot(__game.player.pos.x-x,__game.player.pos.z-z),y:__game.player.pos.y}),vault);
    check('couloir B1 → scanner du coffre libre', b.d < 1 && b.y < 4.1, b);
    await page.evaluate(()=>{ __game.player.keycards.agency=true; });
    await page.keyboard.press('e');
    check('scanner du coffre utilisable avec la carte', await page.evaluate(()=>__game.vaults.find(v=>v.poi.key==='agency').open));
    await walkTo(vault.x,vault.z-6);
    check('entrée dans le coffre après ouverture',await page.evaluate(()=>__game.player.pos.z < -9 && __game.player.pos.y < 4.1));
    await walkTo(vault.x,-2); await walkTo(-6.4,-2); await walkTo(-6.4,9);
    b=await page.evaluate(()=>({x:__game.player.pos.x,z:__game.player.pos.z}));
    check('archives accessibles par leur ouverture',b.x>-8&&b.x<-5&&b.z>8,b);
    await walkTo(-6.4,0); await walkTo(5.8,0); await walkTo(5.8,6.3); await walkTo(12,6.3);
    b=await page.evaluate(()=>({x:__game.player.pos.x,z:__game.player.pos.z}));
    check('local technique accessible par son ouverture',b.x>11&&Math.abs(b.z-6.3)<1,b);
    await walkTo(5.8,6.3); await walkTo(5.8,0); await walkTo(-4,0); await walkTo(-4,-12.6); await walkTo(-15.75,-12.6); await walkTo(-15.75,8,4000);
    b=await page.evaluate(()=>({y:__game.player.pos.y,z:__game.player.pos.z}));
    check('remontée du B1 au hall sans saut',Math.abs(b.y-9.05)<0.15&&b.z>7,b);
    await page.evaluate(()=>{
      const g=__game,v=g.vehicles.find(v=>v.kind==='car'&&!v.destroyed);
      window.__crashCar=v; v.pos.set(12,9.05,19);v.yaw=0;v.speed=22;v.hp=v.maxHp;
      g.enterVehicle(g.player,v);
    });
    await page.keyboard.down('w');await page.evaluate(()=>window.advanceTime(200));await page.keyboard.up('w');
    const crash=await page.evaluate(()=>({hp:__crashCar.hp,z:__crashCar.pos.z,max:__crashCar.maxHp,bar:document.getElementById('vehicleRow').getAttribute('aria-valuenow')}));
    check('collision : dégâts réels et barre actualisée',crash.hp<crash.max&&crash.hp>0&&+crash.bar===Math.ceil(crash.hp),crash);
    const blast=await page.evaluate(()=>{
      const g=__game,v=__crashCar,bot=g.bots[0];g.exitVehicle(g.player);
      bot.slots[1]={kind:'weapon',id:'boombow',rarity:5,mag:1};bot.cur=1;bot.cool=bot.equipT=bot.reloading=0;bot.bloom=0;bot.vel.set(0,0,0);
      g.scene.updateMatrixWorld(true);
      const o=v.mesh.localToWorld(new g.THREE.Vector3(0,.6,-6)),t=v.mesh.localToWorld(new g.THREE.Vector3(0,.6,-2)),hp=v.hp;
      g.fire(bot,o,t.sub(o).normalize(),true);
      return{before:hp,hp:v.hp,glass:v.windows.every(p=>p.broken)};
    });
    check('explosion : carrosserie endommagée et vitrage soufflé',blast.hp<blast.before&&blast.glass,blast);
    await page.setViewport({width:375,height:812});
    await page.evaluate(()=>{const g=__game,v=g.vehicles.find(v=>v.kind==='car'&&!v.destroyed);g.enterVehicle(g.player,v);window.advanceTime(30);});
    const fit = await page.evaluate(()=>{const r=document.getElementById('vehicleRow').getBoundingClientRect(),bars=document.getElementById('bars').getBoundingClientRect(),m=document.getElementById('mats').getBoundingClientRect(),slots=[...document.querySelectorAll('#hotbar .slot')].map(e=>e.getBoundingClientRect());return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:innerWidth,h:innerHeight,separate:bars.bottom<m.top,slots:slots.every(r=>r.left>=0&&r.right<=innerWidth)};});
    check('barre orange lisible sans dépassement ni chevauchement à 375px',fit.left>=0&&fit.right<=fit.w&&fit.top>=0&&fit.bottom<=fit.h&&fit.separate&&fit.slots,fit);
    check('aucune nouvelle erreur JavaScript', errors.length === 0, errors);
    console.log(`${count} contrôles validés.`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
