#!/usr/bin/env node
// QA gameplay "Saison Espions" pour STORMDROP : vérifie les POI espions, les boss,
// les hommes de main, les coffres-forts, les cartes d'accès et les déguisements.
// Échoue (exit 1) dès qu'une assertion est fausse ou qu'une erreur JS survient.
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: true, protocolTimeout: 600000, args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:8090/index.html', { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  let launched = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /jouer/i.test(x.textContent)); if (b) { b.click(); return true; } return false; });
  await sleep(2500);
  let frame = page.frames().find((f) => f.url().includes('game.html'));
  if (!frame) { // une deuxième tentative (chargement lent)
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /jouer/i.test(x.textContent)); if (b) b.click(); });
    await sleep(3000);
    frame = page.frames().find((f) => f.url().includes('game.html'));
  }
  if (!frame) { console.log('FAIL | chargement de la partie (launched=' + launched + ')'); await browser.close(); process.exit(1); }
  await frame.waitForSelector('#hud', { timeout: 15000 }).catch(() => {});
  await sleep(2500);

  const results = [];
  let failed = 0;
  const check = (name, cond, extra) => { results.push(`${cond ? 'PASS' : 'FAIL'} | ${name}${extra ? ' | ' + extra : ''}`); if (!cond) failed++; };

  // --- 1. POI espions, coffres-forts, cabines ---
  const world = await frame.evaluate(() => {
    const G = window.__game;
    const spies = G.POIS.filter((p) => p.spy);
    return {
      spies: spies.map((p) => p.key + ':' + p.name),
      vaults: G.vaults.map((v) => ({ poi: v.poi.key, open: v.open, doorAlive: v.door.alive })),
      booths: G.booths.length,
      agencyCenter: (() => { const a = spies.find((p) => p.key === 'agency'); return a && Math.abs(a.x) < 1 && Math.abs(a.z) < 1; })(),
    };
  });
  check('5 POI espions', world.spies.length === 5, world.spies.join(','));
  check('5 coffres-forts fermés', world.vaults.length === 5 && world.vaults.every((v) => !v.open && v.doorAlive), JSON.stringify(world.vaults));
  check('5 cabines téléphoniques', world.booths === 5);
  check("L'Agence au centre", world.agencyCenter === true);

  // --- 2. Boss & hommes de main (spawn sur leur structure) ---
  const staff = await frame.evaluate(() => {
    const G = window.__game;
    return {
      bosses: G.bosses.map((b) => ({ name: b.name, poi: b.bossPoi.key, hp: b.hp, shield: b.shield, w: b.slots[1] && b.slots[1].id, alive: b.alive, tag: !!b.nameTag, y: +b.pos.y.toFixed(1), ground: +G.terrainH(b.pos.x, b.pos.z).toFixed(1) })),
      hench: G.henchmen.length,
      henchAlive: G.henchmen.filter((h) => h.alive).length,
    };
  });
  check('5 boss vivants + étiquette', staff.bosses.length === 5 && staff.bosses.every((b) => b.alive && b.tag), JSON.stringify(staff.bosses.map((b) => b.name + ':' + b.w)));
  check('hommes de main spawnés', staff.henchAlive >= 14, 'total=' + staff.hench + ' vivants=' + staff.henchAlive);
  const yachtRig = staff.bosses.filter((b) => b.poi === 'yacht' || b.poi === 'rig');
  // pont du Yacht à sol+1,4 m ; plateforme de La Plateforme à sol+12,2 m
  check('boss du Yacht/Plateforme sur leur structure', yachtRig.length === 2 && yachtRig.every((b) => b.poi === 'yacht' ? Math.abs(b.y - (b.ground + 1.4)) < 0.8 : Math.abs(b.y - (b.ground + 12.2)) < 1), JSON.stringify(yachtRig.map((b) => b.poi + ':y=' + b.y + '/sol=' + b.ground)));

  // --- 3. Compteur : les PNJ ne comptent pas comme joueurs ---
  const counts = await frame.evaluate(() => {
    const G = window.__game;
    const aliveAll = G.chars.filter((c) => c.alive).length;
    const alivePlayers = G.chars.filter((c) => c.alive && !c.hench).length;
    return { aliveAll, alivePlayers, hud: +document.getElementById('aliveN').textContent, bots: G.bots.length };
  });
  check('aliveN exclut les PNJ', counts.hud === counts.alivePlayers && counts.aliveAll > counts.alivePlayers, JSON.stringify(counts));

  // --- atterrissage ---
  await frame.evaluate(() => {
    window.__game.jumpFromBus();
    let n = 0;
    while (window.__game.player.mode !== 'ground' && n++ < 400) window.advanceTime(100);
  });
  check('joueur au sol', (await frame.evaluate(() => window.__game.player.mode)) === 'ground');

  // --- 4. Déguisement : contrôle positif, puis abandon de cible, puis rupture au tir ---
  const dis = await frame.evaluate(() => {
    const G = window.__game;
    // contrôle positif : on se place près d'un homme de main et on le blesse -> riposte ciblée
    const h = G.henchmen.find((c) => c.alive && !c.boss);
    const px = h.pos.x + 8, pz = h.pos.z;
    G.player.pos.set(px, Math.max(G.terrainH(px, pz), 2.4) + 0.1, pz);
    G.player.vel.set(0, 0, 0); G.player.mode = 'ground'; G.player.grounded = true;
    window.advanceTime(100);
    // nouveau : les colonnes/décos ont un collider — on dégage le joueur s'il
    // est coincé ou éjecté (le tir exige le mode sol)
    let unstick = 0;
    while ((G.player.blocked || G.player.mode !== 'ground' || !G.player.grounded) && unstick++ < 30) {
      G.player.pos.x += 1.5; G.player.vel.set(0, 0, 0); G.player.mode = 'ground'; G.player.grounded = true;
      window.advanceTime(50);
    }
    G.damage(h, 5, G.player, false, 'test');
    window.advanceTime(600);
    const targeted0 = G.henchmen.filter((c) => c.alive && c.target && c.target.isPlayer).length;
    // déguisement -> les cibles sont abandonnées
    G.setDisguise(true);
    window.advanceTime(600);
    const targeted1 = G.henchmen.filter((c) => c.alive && c.target && c.target.isPlayer).length;
    const tagOn = document.getElementById('disguiseTag').classList.contains('on');
    // tir -> déguisement rompu (le chargeur doit baisser : preuve du tir)
    G.player.slots[1] = { kind: 'weapon', id: 'ar', rarity: 2, mag: 30 };
    G.selectSlot(1); G.player.ammo.medium = 200;
    window.advanceTime(800);
    const magBefore = G.player.slots[1].mag;
    G.mouse.l = true; window.advanceTime(120); G.mouse.l = false;
    const magAfter = G.player.slots[1].mag;
    return { targeted0, targeted1, tagOn, magBefore, magAfter, after: { disguise: G.player.disguise, tag: document.getElementById('disguiseTag').classList.contains('on'), blocked: G.player.blocked, mode: G.player.mode } };
  });
  check('blessé sans déguisement -> ciblé', dis.targeted0 >= 1, 'ciblés=' + dis.targeted0);
  check('déguisement -> cibles abandonnées', dis.targeted1 === 0, 'ciblés=' + dis.targeted1);
  check('tag HUD déguisement', dis.tagOn === true);
  check('tir effectif pendant l\'essai (chargeur baissé)', dis.magBefore !== undefined && dis.magAfter < dis.magBefore, 'mag ' + dis.magBefore + ' -> ' + dis.magAfter);
  check('tir casse le déguisement', dis.after.disguise === false && dis.after.tag === false, JSON.stringify(dis.after));

  // --- 5. Arc Ka-Boom : dégâts de zone (tir déterministe) ---
  const myth = await frame.evaluate(() => {
    const G = window.__game;
    const p = G.player;
    p.slots[1] = { kind: 'weapon', id: 'boombow', rarity: 5, mag: 1 };
    G.selectSlot(1); p.ammo.shells = 50;
    window.advanceTime(800);
    // cherche un homme de main avec ligne de vue dégagée depuis 4 m
    let h = null, o = null, d = null;
    for (const c of G.henchmen) {
      if (!c.alive || c.boss) continue;
      const px = c.pos.x + 4;
      const py = Math.max(c.pos.y, G.terrainH(px, c.pos.z)) + 0.1;
      const oo = new G.THREE.Vector3(px, py + 1.5, c.pos.z);
      const dd = c.pos.clone().add(new G.THREE.Vector3(0, 1.2, 0)).sub(oo).normalize();
      const ray = G.castRay(oo, dd, 100, p);
      if (ray && ray.type === 'char' && ray.char === c) { h = c; o = oo; d = dd; break; }
    }
    if (!h) return { res: false, reason: 'aucune ligne de vue' };
    p.pos.set(o.x, o.y - 1.5, o.z); p.vel.set(0, 0, 0); p.mode = 'ground'; p.grounded = true; p.cool = 0; p.equipT = 0;
    const hp0 = h.hp + h.shield;
    const res = G.fire(p, o, d, false);
    const hpMid = h.hp + h.shield;
    return { res, hp0: Math.round(hp0), hpMid: Math.round(hpMid), alive: h.alive };
  });
  check('Arc Ka-Boom dégâts de zone', myth.res === true && myth.hpMid < myth.hp0, JSON.stringify(myth));

  // --- 5bis. Tir via les contrôles (visée caméra) sur un homme de main en terrain découvert ---
  const aim = await frame.evaluate(() => {
    const G = window.__game;
    const p = G.player;
    // terrain découvert : essaie plusieurs points, avec visée ajustée sur le torse
    let placed = false;
    const h = G.henchmen.find((c) => c.alive && !c.boss);
    const V3 = G.THREE.Vector3;
    const aimCam = (h2) => {
      // vise le torse : itère yaw+pitch depuis la position réelle de la caméra
      // (la caméra est décalée sur l'épaule, il faut converger)
      const target = h2.pos.clone().add(new V3(0, 1.0, 0));
      G.setCam(Math.atan2(-(h2.pos.x - p.pos.x), -(h2.pos.z - p.pos.z)), -0.2);
      window.advanceTime(60);
      for (let k = 0; k < 3; k++) {
        const to = target.clone().sub(G.camera.position);
        G.setCam(Math.atan2(-to.x, -to.z), Math.asin(clampN(to.y / to.length(), -1, 1)));
        window.advanceTime(60);
      }
    };
    const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
    outer:
    for (const [cx2, cz2] of [[40, 40], [-40, 60], [90, -30], [-60, -110], [20, 150], [-170, -30], [150, 60], [-100, 0], [60, -90], [-20, -150]]) {
      const th = G.terrainH(cx2, cz2);
      if (th < 1.5 || th > 15) continue; // ni eau ni montagne
      const py2 = Math.max(th, 2.4) + 0.1;
      p.pos.set(cx2, py2, cz2); p.vel.set(0, 0, 0); p.mode = 'ground'; p.grounded = true;
      for (const [dx, dz] of [[7, 0], [0, 7], [-7, 0], [0, -7]]) {
        h.pos.set(cx2 + dx, Math.max(G.terrainH(cx2 + dx, cz2 + dz), 2.4) + 0.1, cz2 + dz);
        h.vel.set(0, 0, 0); h.mode = 'ground';
        h.think = 1e9; h.target = null; h.wp = { x: h.pos.x, z: h.pos.z }; // figé
        aimCam(h);
        const o = new V3().copy(G.camera.position);
        const dd = new V3(); G.camera.getWorldDirection(dd);
        const ray = G.castRay(o, dd, 30, p);
        if (ray && ray.type === 'char' && ray.char === h) { placed = true; break outer; }
      }
    }
    if (!placed) return { placed: false };
    p.slots[1] = { kind: 'weapon', id: 'ar', rarity: 3, mag: 30 };
    G.selectSlot(1); p.ammo.medium = 300;
    p.cool = 0; p.reloading = 0; p.equipT = 0;
    const hp0 = h.hp + h.shield;
    const mag0 = p.slots[1].mag;
    G.mouse.l = true; window.advanceTime(500); G.mouse.l = false;
    window.advanceTime(300);
    return { placed: true, hp0: Math.round(hp0), hp1: Math.round(h.hp + h.shield), mag0, mag1: p.slots[1].mag };
  });
  check('tir via les contrôles touche la cible', aim.placed !== false && aim.mag1 < aim.mag0 && aim.hp1 < aim.hp0, JSON.stringify(aim));

  // --- 6. Boss éliminé -> carte d'accès ---
  const boss = await frame.evaluate(() => {
    const G = window.__game;
    const b = G.bosses.find((x) => x.alive);
    const key0 = b.bossPoi.key;
    const xp0 = G.xp;
    G.damage(b, 999999, G.player, false, 'test');
    window.advanceTime(400);
    const keyLoot = G.loot.find((l) => l.alive && l.item.kind === 'keycard');
    return { alive: b.alive, keyDropped: !!keyLoot, keyPoi: keyLoot && keyLoot.item.poi, xpGain: G.xp - xp0, key0 };
  });
  check('boss éliminé lâche la carte + XP au joueur', boss.alive === false && boss.keyDropped === true && boss.keyPoi === boss.key0 && boss.xpGain >= 500, JSON.stringify(boss));

  // --- 6bis. Boss éliminé par un bot : butin présent, XP joueur inchangée ---
  const bossBot = await frame.evaluate(() => {
    const G = window.__game;
    const b = G.bosses.find((x) => x.alive);
    const bot = G.chars.find((c) => c.alive && !c.hench && !c.isPlayer && !c.boss);
    if (!b || !bot) return { skip: true };
    const xp0 = G.xp;
    const pos = { x: b.pos.x, z: b.pos.z };
    G.damage(b, 999999, bot, false, 'test');
    window.advanceTime(400);
    const keyLoot = G.loot.find((l) => l.alive && l.item.kind === 'keycard' && l.item.poi === b.bossPoi.key);
    return { alive: b.alive, keyDropped: !!keyLoot, keyPoi: keyLoot && keyLoot.item.poi, key0: b.bossPoi.key, xpGain: G.xp - xp0, near: keyLoot ? Math.round(Math.hypot(keyLoot.pos.x - pos.x, keyLoot.pos.z - pos.z)) : -1 };
  });
  check('boss tué par un bot : carte lâchée, XP joueur inchangée', bossBot.skip !== true && bossBot.alive === false && bossBot.keyDropped === true && bossBot.keyPoi === bossBot.key0 && bossBot.xpGain === 0, JSON.stringify(bossBot));

  // --- 7. Coffre-fort : coffres scellés, verrouillage, ouverture ---
  const vault = await frame.evaluate(() => {
    const G = window.__game;
    // les hommes de main alertés ne doivent pas tuer le joueur pendant ce test
    G.setDisguise(true); G.player.hp = 100; G.player.shield = 100;
    const vA = G.vaults.find((v) => v.poi.key === 'agency');
    // 1) les coffres intérieurs restent scellés tant que le coffre-fort est fermé
    const vChest = G.chests.find((c) => c.vault && c.vaultRef === vA && !c.opened);
    const refused = (() => { G.openChest(vChest); return !vChest.opened; })();
    // 2) sans carte : l'ouverture est refusée
    const hadNoKey = !G.player.keycards.agency;
    G.player.pos.set(vA.x, vA.y, vA.z + 5);
    window.advanceTime(60);
    G.interact();
    const lockedStayed = !vA.open;
    // 3) ramasse la vraie carte du boss puis ouvre
    const keyLoot = G.loot.find((l) => l.alive && l.item.kind === 'keycard');
    if (keyLoot) { G.player.pos.set(keyLoot.pos.x, keyLoot.pos.y, keyLoot.pos.z); G.pickupItem(G.player, keyLoot); }
    const pickedUp = !!(G.player.keycards && G.player.keycards[bossKey()]);
    function bossKey() { return keyLoot ? keyLoot.item.poi : 'agency'; }
    G.player.pos.set(vA.x, vA.y, vA.z + 5);
    window.advanceTime(60);
    const t = G.interact();
    window.advanceTime(400);
    const openedWithKey = vA.open && !vA.door.alive;
    // 4) les coffres intérieurs s'ouvrent maintenant
    let chestAfter = null;
    for (const c of G.chests.filter((x) => x.vaultRef === vA && !x.opened)) { G.openChest(c); chestAfter = c.opened; break; }
    return { refused, hadNoKey, lockedStayed, pickedUp, interType: t && t.type, openedWithKey, chestAfter };
  });
  check('coffres intérieurs scellés avant ouverture', vault.refused === true);
  check('coffre-fort verrouillé sans carte', vault.hadNoKey === true && vault.lockedStayed === true, JSON.stringify(vault));
  check('carte ramassée', vault.pickedUp === true);
  check('coffre-fort ouvert avec la carte', vault.openedWithKey === true, JSON.stringify(vault));
  check('coffres intérieurs ouvrables après', vault.chestAfter === true);

  // --- 8. Grappin : tiré depuis l'arrêt, impulsion vers le point d'impact ---
  const grap = await frame.evaluate(() => {
    const G = window.__game;
    const p = G.player;
    p.slots[1] = { kind: 'weapon', id: 'grapple', rarity: 5, mag: 10 };
    G.selectSlot(1); p.ammo.medium = 100;
    window.advanceTime(800);
    // en terrain découvert, vise la tour de l'Agence à l'horizontale
    p.pos.set(60, Math.max(G.terrainH(60, 0), 2.4) + 0.1, 0);
    p.vel.set(0, 0, 0); p.mode = 'ground'; p.grounded = true;
    // vise le sol devant : cible garantie (le terrain ne bouge pas), le test ne
    // dépend ainsi pas des structures/bots aléatoires sur la trajectoire
    G.setCam(Math.PI / 2, -1.0);
    window.advanceTime(80);
    // vérifie le point d'impact visé
    const o = new G.THREE.Vector3().copy(G.camera.position);
    const d = new G.THREE.Vector3(); G.camera.getWorldDirection(d);
    const ray = G.castRay(o, d, 65, p);
    const mag0 = p.slots[1].mag;
    G.mouse.l = true; window.advanceTime(34); G.mouse.l = false;
    const vel = p.vel.length();
    return { fired: p.slots[1].mag < mag0, vel: +vel.toFixed(1), hit: ray && ray.type, dist: ray && +ray.distance.toFixed(1) };
  });
  check('grappin tiré et propulse le joueur', grap.fired === true && grap.vel > 8, JSON.stringify(grap));

  // --- 9bis. La Grotte : plateau abaissé, rampe à ciel ouvert, caverne voûtée ---
  const cave = await frame.evaluate(() => {
    const G = window.__game, p = G.player, R = [];
    G.storm.dmg = 0; // test ciblé : la tempête ne doit pas tuer le joueur ici
    // la montagne est retirée : le plateau du POI est à ~24 (avant : 35,8)
    const t1 = G.terrainH(205, 150), t2 = G.terrainH(230, 165);
    R.push(['montagne retirée, plateau à 24', t1 > 22.5 && t1 < 25.5 && t2 > 22.5 && t2 < 25.5, 'y=' + t1.toFixed(1) + '/' + t2.toFixed(1)]);
    // la grande rampe est creusée dans le plateau (mi-parcours)
    R.push(['rampe creusée dans le plateau', G.terrainH(190, 165) < 22, 'y=' + G.terrainH(190, 165).toFixed(1)]);
    // le trou béant traverse la voûte : le terrain s'effondre jusqu'au sol de la caverne
    R.push(["trou béant dans la voûte", G.terrainH(171, 165) < 11, 'y=' + G.terrainH(171, 165).toFixed(1)]);
    // ANTI « SOL INVISIBLE » : le maillage rendu doit épouser terrainH (±2 m).
    // Si le rendu et la physique divergent, le joueur marche dans le vide ou
    // traverse le sol — c'est exactement le bug signalé sur la grotte.
    {
      const tm = G.terrainMesh, TH = G.THREE, rc = new TH.Raycaster(), dn = new TH.Vector3(0, -1, 0);
      let worst = 0, n = 0;
      for (const [sx, sz] of [[230,165],[222,160],[210,165],[205,150],[200,158],[200,172],[190,165],[190,159],[186,165],[183,165],[171,165],[177,155],[166,160],[172,185],[226,152],[222,183],[183,147],[176,160]]) {
        rc.set(new TH.Vector3(sx, 45, sz), dn);
        const hit = rc.intersectObject(tm, false)[0];
        if (hit) { worst = Math.max(worst, Math.abs(hit.point.y - G.terrainH(sx, sz))); n++; }
      }
      R.push(['sol rendu = sol physique', n >= 14 && worst < 2.5, n + ' pts, écart max ' + worst.toFixed(2) + ' m']);
    }
    // les hommes de main ne perturbent pas la marche de test (Brutus reste en place)
    for (const c of G.chars) if (c.alive && c.hench && !c.boss) G.damage(c, 999999, null, false, 'test');
    // DESCENTE RÉELLE : on marche depuis le plateau (pas de téléport au fil de la
    // pente), le joueur doit rester au sol tout du long et atteindre la caverne
    let walkOK = true, airFrames = 0;
    p.pos.set(228, 24.4, 165); p.vel.set(0, 0, 0); p.mode = 'ground'; p.grounded = true;
    G.setCam(Math.PI / 2, -0.25); // regarde plein ouest (bas de la rampe)
    G.keys.KeyW = true;
    for (let i = 0; i < 90; i++) {
      window.advanceTime(150);
      if (!p.alive) { walkOK = false; R.push(['joueur vivant dans la rampe', false, 'mort au pas ' + i]); break; }
      if (p.mode === 'ground' && !p.grounded) airFrames++;
      if (p.pos.x < 172) break;
    }
    G.keys.KeyW = false;
    R.push(['descente de la rampe au sol', walkOK && airFrames < 3 && p.pos.x < 175 && p.pos.y < 11.6, 'x=' + p.pos.x.toFixed(1) + ' y=' + p.pos.y.toFixed(1) + ' air=' + airFrames]);
    // REMONTÉE RÉELLE : la rampe se monte dans l'autre sens jusqu'au plateau
    G.setCam(-Math.PI / 2, -0.1); // regarde plein est (haut de la rampe)
    G.keys.KeyW = true;
    for (let i = 0; i < 90; i++) {
      window.advanceTime(150);
      if (!p.alive || p.pos.x > 231) break;
    }
    G.keys.KeyW = false;
    R.push(['remontée de la rampe', p.alive && p.pos.y > 23 && p.pos.x > 226, 'x=' + p.pos.x.toFixed(1) + ' y=' + p.pos.y.toFixed(1)]);
    // le joueur est bien SOUS la voûte dans la caverne : un raycast vertical
    // depuis le sol de la caverne doit toucher la roche de la voûte (la caverne
    // est bien couverte, « en dessous de la carte »)
    p.pos.set(159, 10.6, 165); p.vel.set(0, 0, 0); p.mode = 'ground'; p.grounded = true;
    window.advanceTime(300);
    {
      const TH = G.THREE, rc = new TH.Raycaster();
      rc.set(new TH.Vector3(156, 11, 165), new TH.Vector3(0, 1, 0));
      rc.far = 14;
      const hit = rc.intersectObject(G.grottoRockMesh, false)[0];
      R.push(['caverne couverte par la voûte', p.grounded && !!hit && hit.distance < 13, 'roche à ' + (hit ? hit.distance.toFixed(1) : 'aucune') + ' m au-dessus']);
    }
    // sol de la caverne : dalle plate à 10
    p.pos.set(171, 10.3, 165); p.vel.set(0, 0, 0); p.mode = 'ground'; p.grounded = true;
    window.advanceTime(300);
    R.push(['sol de la caverne à y=10', p.grounded && Math.abs(p.pos.y - 10) < 0.5, 'y=' + p.pos.y.toFixed(1) + ' grounded=' + p.grounded]);
    // saut dans le trou béant : chute de 14 m, dégâts de chute négligeables
    p.pos.set(171, 23.5, 165); p.vel.set(0, 0, 0); p.mode = 'ground';
    window.advanceTime(1500);
    R.push(['chute dans le trou béant survivable', p.alive && p.hp > 70 && p.grounded && Math.abs(p.pos.y - 10) < 1, 'hp=' + p.hp.toFixed(0) + ' y=' + p.pos.y.toFixed(1)]);
    // Brutus garde la caverne depuis son QG
    const brutus = G.henchmen.find((c) => c.alive && c.boss && c.name === 'Brutus');
    R.push(['Brutus garde la caverne', !!brutus && brutus.pos.y < 16, brutus ? 'y=' + brutus.pos.y.toFixed(1) : 'absent']);
    // coffre-fort de la Grotte au sol de la caverne
    const vg = G.vaults.find((v) => v.poi.key === 'grotto');
    R.push(['coffre-fort dans la caverne', !!vg && vg.y < 16, vg ? 'y=' + vg.y.toFixed(1) : 'absent']);
    // crâne de l'Ombre : façade PLEINE sur la face est de la montagne, la
    // bouche du crâne EST l'entrée de la caverne (paroi x 183-187, tempes
    // z 149.5-180.5, dôme jusqu'à y 30.5 : émerge devant la montagne)
    const sb = G.grottoSkullBounds;
    R.push(["crâne de l'Ombre sculpté dans le contrefort", !!sb && sb.min.x >= 183 && sb.max.x <= 188 && sb.min.y <= 10.05 && sb.max.y >= 29 && sb.min.z <= 155 && sb.max.z >= 175, sb ? 'x ' + sb.min.x.toFixed(1) + '-' + sb.max.x.toFixed(1) + ' y ' + sb.min.y.toFixed(1) + '-' + sb.max.y.toFixed(1) + ' z ' + sb.min.z.toFixed(1) + '-' + sb.max.z.toFixed(1) : 'absent']);
    // les maisons (bunkers) sont bien posées : terrain plat sous toute l'emprise
    {
      let flat = true, worst = 0;
      for (const [bx, bz, w, d] of [[205, 190, 10, 9], [226, 146, 10, 8]]) {
        for (const [cx, cz] of [[bx, bz], [bx - w / 2, bz - d / 2], [bx + w / 2, bz - d / 2], [bx - w / 2, bz + d / 2], [bx + w / 2, bz + d / 2]]) {
          const e = Math.abs(G.terrainH(cx, cz) - 24); worst = Math.max(worst, e); if (e > 1.2) flat = false;
        }
      }
      R.push(['bunkers posés sur terrain plat', flat, 'écart max ' + worst.toFixed(2) + ' m']);
    }
    // passerelle métallique du mur sud : praticable
    p.pos.set(172.7, 14.2, 176.7); p.vel.set(0, 0, 0); p.mode = 'ground'; p.grounded = true;
    window.advanceTime(200);
    R.push(['passerelle du mur sud praticable', p.grounded && Math.abs(p.pos.y - 13.8) < 0.5, 'y=' + p.pos.y.toFixed(1) + ' grounded=' + p.grounded]);
    // escalier d'accès de la passerelle : marches praticables
    p.pos.set(180.2, 12.2, 173.5); p.vel.set(0, 0, 0); p.mode = 'ground'; p.grounded = true;
    window.advanceTime(200);
    R.push(['escalier de la passerelle praticable', p.grounded && p.pos.y > 11 && p.pos.y < 13.5, 'y=' + p.pos.y.toFixed(1) + ' grounded=' + p.grounded]);
    // conteneur de fret : solide (cover au bord du bassin)
    p.pos.set(166, 13.4, 173.5); p.vel.set(0, 0, 0); p.mode = 'ground'; p.grounded = true;
    window.advanceTime(200);
    R.push(['conteneur de fret solide', p.grounded && Math.abs(p.pos.y - 12.8) < 0.6, 'y=' + p.pos.y.toFixed(1) + ' grounded=' + p.grounded]);
    // pas de dégâts de zone en début de partie : on doit rester en vie
    // (Brutus riposte — seule la survie est vérifiée)
    window.advanceTime(1500);
    R.push(['joueur vivant', p.alive, 'hp=' + p.hp.toFixed(0)]);
    return R.map((r) => (r[1] ? 'PASS' : 'FAIL') + '|' + r[0] + '|' + (r[2] ?? '')).join('\n');
  });
  // --- 9. Victoire possible avec des hommes de main vivants ---
  const board = await frame.evaluate(() => {
    const G = window.__game;
    for (const c of G.chars) if (c.alive && !c.hench && !c.isPlayer) G.damage(c, 999999, null, false, 'test');
    window.advanceTime(1000);
    const s = JSON.parse(window.render_game_to_text());
    return { alive: s.alive, henchAlive: G.henchmen.filter((h) => h.alive).length, hud: +document.getElementById('aliveN').textContent };
  });
  let boardState = 'playing';
  for (let i = 0; i < 12; i++) { // la victoire passe par un setTimeout réel de 700 ms
    await sleep(450);
    boardState = await frame.evaluate(() => JSON.parse(window.render_game_to_text()).state);
    if (boardState !== 'playing') break;
  }
  check('victoire déclenchée, PNJ exclus du classement', boardState !== 'playing' && board.alive === 1, JSON.stringify(board) + ' state=' + boardState);

  for (const line of cave.split('\n')) { const i = line.indexOf('|'); check(line.slice(i + 1), line.startsWith('PASS'), line.slice(line.indexOf('|', i + 1) + 1)); }

  console.log(results.join('\n'));
  console.log('---');
  console.log(errors.length ? 'JS ERRORS:\n' + errors.slice(0, 10).join('\n') : 'AUCUNE ERREUR JS');
  await browser.close();
  if (failed > 0 || errors.length > 0) { console.error(failed + ' assertion(s) en échec'); process.exit(1); }
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
