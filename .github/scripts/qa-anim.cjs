#!/usr/bin/env node
// QA animations STORMDROP : toit des constructions (même texture que les murs),
// chute libre (tête en avant, pioche invisible), parachute (mains accrochées),
// atterrissage (réception puis retour de la pioche) + lobby (skin de base,
// courbe d'XP croissante, boutique avec les 5 catégories).
// Échoue (exit 1) dès qu'une assertion est fausse ou qu'une erreur JS survient.
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
let failed = 0;
const check = (name, cond, extra) => { results.push(`${cond ? 'PASS' : 'FAIL'} | ${name}${extra ? ' | ' + extra : ''}`); if (!cond) failed++; };
const launch = () => puppeteer.launch({ headless: true, protocolTimeout: 600000, args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

// ---------------------------------------------------------------------------
// Jeu (game.html)
// ---------------------------------------------------------------------------
async function gameTests() {
  const browser = await launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:8090/game.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.player, { timeout: 30000 });
  await sleep(1500);

  // --- 1. Toit (cône) : UVs comme les murs, matériau texturé partagé, tous matériaux ---
  const roof = await page.evaluate(() => {
    const G = window.__game;
    G.player.mats.wood = 999; G.player.mats.stone = 999; G.player.mats.metal = 999;
    const out = { placed: true, mats: {} };
    let ci = 0;
    for (const mat of ['wood', 'stone', 'metal']) {
      const cx = 3 + ci * 4, cz = 3 + ci * 4; ci++;
      out.placed = G.placeBuild(G.player, 'wall', cx, cz, 60, 0, mat) && out.placed;
      out.placed = G.placeBuild(G.player, 'cone', cx, cz, 64, 0, mat) && out.placed;
      const cone = [...G.builds.values()].find((c) => c.ptype === 'cone' && c.mat === mat);
      const wall = [...G.builds.values()].find((c) => c.ptype === 'wall' && c.mat === mat);
      const uv = cone && cone.mesh.geometry.attributes.uv;
      out.mats[mat] = {
        uv: uv ? { count: uv.count, pos: cone.mesh.geometry.attributes.position.count, finite: [...uv.array].every(Number.isFinite) } : null,
        sameMat: cone && wall && cone.mesh.material === wall.mesh.material,
        mapped: cone && !!cone.mesh.material.map,
      };
    }
    // cône édité (2 pans retirés) : les UVs doivent survivre à l'édition 3x3
    const full = G.placeBuild(G.player, 'cone', 6, 6, 60, 0, 'wood');
    const cone6 = [...G.builds.values()].find((c) => c.ptype === 'cone' && c.cx === 6 && c.cz === 6);
    G.applyEdit(cone6, 0b0101);
    const uvE = cone6.mesh.geometry.attributes.uv;
    out.edited = full && uvE ? { count: uvE.count, pos: cone6.mesh.geometry.attributes.position.count, finite: [...uvE.array].every(Number.isFinite), sameMat: cone6.mesh.material === [...G.builds.values()].find((c) => c.ptype === 'wall' && c.mat === 'wood').mesh.material } : null;
    return out;
  });
  check('murs et cônes placés (bois, pierre, métal)', roof.placed);
  for (const mat of ['wood', 'stone', 'metal']) {
    const m = roof.mats[mat];
    check(`toit ${mat} : UVs présents, finis, alignés sur les sommets`, !!m.uv && m.uv.count === m.uv.pos && m.uv.finite, JSON.stringify(m.uv));
    check(`toit ${mat} : même matériau texturé que les murs`, m.sameMat === true && m.mapped === true);
  }
  check('toit édité : UVs conservés après édition 3x3', !!roof.edited && roof.edited.count === roof.edited.pos && roof.edited.finite && roof.edited.sameMat, JSON.stringify(roof.edited));

  // --- 2. Chute libre : pioche cachée, tête en avant, pieds plus hauts ---
  const fall = await page.evaluate(() => {
    const G = window.__game, p = G.player, V = G.THREE.Vector3;
    p.mode = 'fall'; p.grounded = false; p.alive = true;
    p.pos.set(30, 300, 30); p.vel.set(0, -10, 0);
    window.advanceTime(400);
    const headY = +p.mesh.localToWorld(new V(0, 1.9, 0)).y.toFixed(2);
    const feetY = +p.mesh.localToWorld(new V(0, 0.15, 0)).y.toFixed(2);
    return {
      hand: p.parts.hand.visible,
      pitch: +p.mesh.rotation.x.toFixed(2),
      armR: +p.parts.shR.rotation.z.toFixed(2),
      legZ: +p.parts.hipL.rotation.z.toFixed(2),
      headY, feetY,
    };
  });
  check('chute libre : pioche invisible', fall.hand === false);
  check('chute libre : tête en avant, pieds plus hauts', fall.pitch < -1.6 && fall.headY < fall.feetY, JSON.stringify(fall));
  check('chute libre : bras écartés, jambes jointes', fall.armR > 0.5 && fall.armR < 1.2 && fall.legZ === 0, JSON.stringify(fall));

  // --- 2b. Chute libre : le plongeon suit le regard, quel que soit le cap ---
  // (le yaw du joueur est piloté par la caméra : on oriente avec setCam et on
  // relit le yaw réel du personnage pour calculer la direction face à lui)
  const yaw = await page.evaluate(() => {
    const G = window.__game, p = G.player, V = G.THREE.Vector3;
    const out = { dives: [] };
    for (const yw of [0, Math.PI / 2, Math.PI]) {
      p.mode = 'fall'; p.grounded = false;
      G.setCam(yw, -0.4);
      p.pos.set(30, 300, 30); p.vel.set(0, -12, 0);
      window.advanceTime(300);
      const head = p.mesh.localToWorld(new V(0, 1.9, 0));
      const feet = p.mesh.localToWorld(new V(0, 0.15, 0));
      const d = head.sub(feet); // pieds → tête
      const facing = new V(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
      out.dives.push(+d.dot(facing).toFixed(2)); // > 0 : la tête plonge devant
    }
    // plongeon rapide : plus vertical
    p.vel.set(0, -60, 0);
    window.advanceTime(300);
    out.fastPitch = +p.mesh.rotation.x.toFixed(2);
    return out;
  });
  check('chute libre : plongeon devant soi à tous les caps', yaw.dives.length === 3 && yaw.dives.every((d) => d > 0.2), JSON.stringify(yaw.dives));
  check('chute libre : plongeon rapide plus vertical', yaw.fastPitch < -2.2, 'pitch=' + yaw.fastPitch);

  // --- 3. Parachute : mains en contact réel avec les poignées pendant tout le cycle ---
  const grip = await page.evaluate(() => {
    const G = window.__game, p = G.player, V = G.THREE.Vector3;
    p.mode = 'glide'; p.grounded = false;
    p.parts.glider.visible = true;
    p.pos.set(30, 250, 30); p.vel.set(0, -6, 0);
    window.advanceTime(600);
    const grips = [];
    p.parts.glider.traverse((o) => { if (o.userData && o.userData.grip) grips.push(o); });
    const hp = new V(), gp = new V(), tmp = new V();
    // distance main (bout du bras, à 0,74 m de l'épaule) <-> poignée, sur tout le balancement
    const dists = [];
    for (let f = 0; f < 8; f++) {
      window.advanceTime(250); // un peu moins qu'une demi-période de balancement
      const d = [];
      for (const sgn of [1, -1]) {
        const g = grips.find((x) => x.userData.grip === sgn);
        const sh = sgn > 0 ? p.parts.shR : p.parts.shL;
        if (!g) { d.push(-1); continue; }
        sh.localToWorld(tmp.set(0, -0.74, 0)); // centre de la main
        g.getWorldPosition(gp);
        d.push(+tmp.distanceTo(gp).toFixed(3)); // main <-> poignée
      }
      dists.push(d);
    }
    return { dists, hand: p.parts.hand.visible, grips: grips.length };
  });
  check('parachute : 2 poignées trouvées', grip.grips === 2, 'grips=' + grip.grips);
  const flat = grip.dists.flat();
  check('parachute : mains sur les poignées tout le cycle (≤ 8 cm)', flat.length >= 16 && flat.every((d) => d >= 0 && d <= 0.08), JSON.stringify(grip.dists));
  check('parachute : pioche invisible', grip.hand === false);

  // --- 4. Atterrissage : réception (pioche cachée, attaques bloquées) puis retour ---
  const land = await page.evaluate(() => {
    const G = window.__game, p = G.player;
    p.mode = 'fall'; p.grounded = false; p.noFall = true;
    p.pos.set(40, 80, 40); p.vel.set(0, 0, 0);
    let n = 0;
    while (p.mode !== 'ground' && n++ < 600) window.advanceTime(100);
    const t0 = { mode: p.mode, landT: +(p.landT || 0).toFixed(2), hand: p.parts.hand.visible, cool: +(p.cool || 0).toFixed(2) };
    window.advanceTime(150); // toujours en réception : pioche cachée
    const t1 = { hand: p.parts.hand.visible };
    window.advanceTime(600); // fin de réception + remontée de la pioche
    const t2 = { hand: p.parts.hand.visible, equipT: +(p.equipT || 0).toFixed(2), legZ: +p.parts.hipL.rotation.z.toFixed(3) };
    window.advanceTime(600); // l'arme finit de sortir
    const t3 = { hand: p.parts.hand.visible, armR: +p.parts.shR.rotation.x.toFixed(2), legZ: +p.parts.hipL.rotation.z.toFixed(3) };
    return { t0, t1, t2, t3 };
  });
  check('atterrissage : mode sol', land.t0.mode === 'ground');
  check('atterrissage : réception en cours, pioche cachée, attaques bloquées', land.t0.landT > 0 && land.t0.hand === false && land.t0.cool > 0, JSON.stringify(land.t0));
  check('atterrissage : pioche encore cachée pendant la réception', land.t1.hand === false, JSON.stringify(land.t1));
  check('atterrissage : pioche de retour après la réception', land.t2.hand === true, JSON.stringify(land.t2));
  check('atterrissage : jambes revenues droites (pas de fuite de pose)', land.t3.legZ === 0, JSON.stringify({ t2: land.t2, t3: land.t3 }));
  check('atterrissage : bras en position de port de la pioche', land.t3.hand === true && land.t3.armR < 1.2, JSON.stringify(land.t3));

  // --- 5. Physique : plus rien ne se traverse (mouvement réel du joueur) ---
  const phys = await page.evaluate(() => {
    const G = window.__game, p = G.player;
    // pas de rendu + joueur maintenu en vie : les bots ne doivent pas tuer le
    // joueur pendant les longues avancées (matchOver figerait la tempête)
    const fast = (ms) => { const n = Math.ceil(ms / 16.67); for (let i = 0; i < n; i++) { G.stepOnly(1 / 60); if (G.player.alive) G.player.hp = 1000; } };
    const out = { props: G.propCols.length, chestCol: !!G.chests[0] && !!G.chests[0].col, chests: [] };
    // marche réelle vers un obstacle : (ox, oz) = décalage de départ depuis le
    // centre. La TRAJECTOIRE complète est échantillonnée : à aucun moment le
    // joueur ne doit entrer dans la boîte (minDist >= 0,35), et sur une
    // approche rectiligne il reste du côté d'arrivée (jamais traversé).
    const walkToward = (col, ox, oz) => {
      const cx = (col.minX + col.maxX) / 2, cz = (col.minZ + col.maxZ) / 2;
      p.mode = 'ground'; p.grounded = true; p.vel.set(0, 0, 0);
      p.pos.set(cx + ox, col.minY + 0.05, cz + oz);
      G.setCam(Math.atan2(-(cx - p.pos.x), -(cz - p.pos.z)), -0.2);
      const x0 = p.pos.x, z0 = p.pos.z;
      G.keys[G.binds.forward] = true;
      const g0 = G.gameT, mo0 = G.matchOver;
      let minD = 9, finalD = 0;
      for (let k = 0; k < 14; k++) {
        fast(50);
        const px = Math.max(col.minX, Math.min(col.maxX, p.pos.x)), pz = Math.max(col.minZ, Math.min(col.maxZ, p.pos.z));
        const dd = Math.hypot(p.pos.x - px, p.pos.z - pz);
        minD = Math.min(minD, dd); finalD = dd;
      }
      G.keys[G.binds.forward] = false;
      // la marche est valide : le temps simulé a avancé (~0,7 s), la partie
      // n'est pas finie (matchOver fige le monde) et le joueur a bougé
      const dt = +(G.gameT - g0).toFixed(2);
      const mo1 = G.matchOver;
      if (mo1 !== false || mo0 !== false) throw new Error('matchOver pendant la marche');
      if (dt < 0.6) throw new Error('temps simulé insuffisant : ' + dt);
      // approche +x : le joueur doit finir côté +x (jamais passé derrière)
      const sideOK = ox > 0 && oz === 0 ? p.pos.x >= col.maxX - 0.05 : true;
      return {
        moved: +Math.hypot(x0 - p.pos.x, z0 - p.pos.z).toFixed(2),
        blocked: p.blocked,
        minD: +minD.toFixed(2),
        finalD: +finalD.toFixed(2),
        sideOK,
        dt,
        matchOver: mo1,
      };
    };
    // coffres : approche de face (+x) ET en diagonale — jamais à travers.
    // Les bots sont mis en pause : leurs tirs/explosions peuvent éjecter le
    // joueur (minD est horizontal : un joueur projeté en l'air passe au-dessus
    // du coffre) et fausseraient l'essai. Note : openChest ne retire JAMAIS le
    // collider d'un coffre — un coffre ouvert reste solide.
    const bots = G.chars.filter((c) => c.isAI);
    const botAlive = bots.map((b) => b.alive);
    bots.forEach((b) => { b.alive = false; });
    for (const ch of G.chests.slice(0, 2)) {
      if (ch.col && !ch.opened) out.chests.push(walkToward(ch.col, 2, 0));
    }
    const ch2 = G.chests.find((c) => c.col && !c.opened); // diagonale sur un coffre
    if (ch2) out.chests.push(walkToward(ch2.col, 1.5, 1.5));
    bots.forEach((b, i) => { b.alive = botAlive[i]; });
    G.player.hp = 1000;
    // 5b. mur fin à 70 m/s : les sous-pas empêchent le passage à travers
    p.mats.wood = 999;
    const placed = G.placeBuild(p, 'wall', 15, 15, 60, 0, 'wood');
    const w = [...G.builds.values()].filter((c) => c.ptype === 'wall').pop(); // dernier mur placé = le nôtre
    if (w) {
      const thinZ = (w.maxZ - w.minZ) < (w.maxX - w.minX);
      p.mode = 'fall'; p.grounded = false; p.vel.set(0, 0, 0);
      if (thinZ) p.pos.set((w.minX + w.maxX) / 2, 60, w.minZ - 0.44);
      else p.pos.set(w.minX - 0.44, 60, (w.minZ + w.maxZ) / 2);
      if (thinZ) p.vel.z = 70; else p.vel.x = 70;
      fast(50);
      out.tunnel = { placed, thinZ, z: +p.pos.z.toFixed(2), x: +p.pos.x.toFixed(2), blocked: p.blocked, wall: { minZ: +w.minZ.toFixed(2), maxZ: +w.maxZ.toFixed(2), minX: +w.minX.toFixed(2), maxX: +w.maxX.toFixed(2) } };
    } else out.tunnel = { placed };
    // 5c. largage aérien : caisse solide à l'atterrissage (avant ouverture)
    G.spawnSupplyDrop();
    let n = 0; while (!G.drops.some((d) => d.landed) && n++ < 400) fast(100);
    const d = G.drops.find((x) => x.landed);
    out.drop = d ? { landed: true, col: !!d.col } : { landed: false };
    if (d && d.col) out.dropWalk = walkToward(d.col, 2.5, 0);
    return out;
  });
  check('physique : colliders sur coffres, caisses, mobilier, pads et vents', phys.props > 20 && phys.chestCol === true, 'props=' + phys.props);
  check('physique : trajectoire vers les coffres jamais à travers (3 marches valides dont la diagonale)', phys.chests.length === 3 && phys.chests.every((c) => c.minD >= 0.35 && c.moved >= 0.5 && c.dt >= 0.6 && c.matchOver === false), JSON.stringify(phys.chests));
  check('physique : au moins un coffre bloque vraiment le joueur', phys.chests.some((c) => c.blocked), JSON.stringify(phys.chests));
  check('physique : mur fin à 70 m/s non traversé (sous-pas ; le grappin plafonne à 28 m/s : cas plus dur que le jeu)', !!phys.tunnel.wall && phys.tunnel.blocked === true && (phys.tunnel.thinZ ? phys.tunnel.z <= phys.tunnel.wall.minZ + 0.05 : phys.tunnel.x <= phys.tunnel.wall.minX + 0.05), JSON.stringify(phys.tunnel));
  check('physique : largage atterri avec caisse solide', phys.drop.landed === true && phys.drop.col === true, JSON.stringify(phys.drop));
  check('physique : la caisse de largage bloque le joueur (marche valide)', phys.dropWalk && phys.dropWalk.blocked === true && phys.dropWalk.minD >= 0.35 && phys.dropWalk.sideOK && phys.dropWalk.moved >= 0.5 && phys.dropWalk.dt >= 0.6 && phys.dropWalk.matchOver === false, JSON.stringify(phys.dropWalk));

  // --- 6. Construction : 5 matériaux exactement ---
  const cost = await page.evaluate(() => {
    const G = window.__game, p = G.player;
    p.mats.wood = 5;
    const ok5 = G.placeBuild(p, 'wall', 20, 20, 60, 0, 'wood');
    const after = p.mats.wood;
    p.mats.wood = 4;
    const ok4 = G.placeBuild(p, 'wall', 21, 20, 60, 0, 'wood');
    const after4 = p.mats.wood;
    return { ok5, after, ok4, after4 };
  });
  check('construction : 5 matériaux acceptés, solde à 0', cost.ok5 === true && cost.after === 0, JSON.stringify(cost));
  check('construction : 4 matériaux refusés, aucun débit', cost.ok4 !== true && cost.after4 === 4, JSON.stringify(cost));

  if (errors.length) console.log('ERREURS JS jeu:\n' + errors.join('\n'));
  else console.log('Aucune erreur JS jeu');
  await browser.close();
  return errors.length;
}

// ---------------------------------------------------------------------------
// Tempête (page neuve, mesures indépendantes) : apparition 1 min après la fin
// du bus, premier mouvement 2 min après activation, dégâts 1 -> 2 -> 5 -> 15
// ---------------------------------------------------------------------------
async function stormTests() {
  const browser = await launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:8090/game.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.player, { timeout: 30000 });
  await sleep(1500);

  const stormT = await page.evaluate(() => {
    const G = window.__game;
    // joueur maintenu en vie : les bots ne doivent pas tuer le joueur pendant
    // les longues avancées (matchOver figerait la tempête)
    const fast = (ms) => { const n = Math.ceil(ms / 16.67); for (let i = 0; i < n; i++) { G.stepOnly(1 / 60); if (G.player.alive) G.player.hp = 1000; } };
    // 1. attends la VRAIE transition fin de bus (bus actif -> terminé)
    let n = 0; while (G.busActive && n++ < 4000) fast(100);
    const busEndT = +G.gameT.toFixed(1);
    // 2. 59 s après la fin du bus : toujours rien
    fast(59000);
    const at59 = { phase: G.storm.phase, r: +G.storm.r.toFixed(1) };
    // 3. +2 s : la zone apparaît (60 s pile après la fin du bus)
    fast(2000);
    const at61 = { phase: G.storm.phase, stage: G.storm.stage, timer: +G.storm.timer.toFixed(1), r: +G.storm.r.toFixed(1) };
    // 4. immobile jusqu'à activation + 117 s (= 119 s après apparition)
    fast(117000);
    const at119 = { stage: G.storm.stage, r: +G.storm.r.toFixed(1) };
    // 5. +3 s : elle bouge pour la première fois (2 min après activation)
    fast(3000);
    const at122 = { stage: G.storm.stage, r: +G.storm.r.toFixed(1) };
    return { busEndT, at59, at61, at119, at122 };
  });
  check('tempête : fin du bus repérée (~32 s)', stormT.busEndT > 30 && stormT.busEndT < 40, 'busEnd=' + stormT.busEndT);
  check('tempête : rien 59 s après la fin du bus', stormT.at59.phase === -1, JSON.stringify(stormT.at59));
  check('tempête : zone apparue 1 min après la fin du bus', stormT.at61.phase === 0 && stormT.at61.stage === 'wait' && stormT.at61.r >= 460, JSON.stringify(stormT.at61));
  check('tempête : premier mouvement 2 min après activation', stormT.at61.timer >= 118 && stormT.at61.timer <= 120, 'timer=' + stormT.at61.timer);
  check('tempête : zone immobile à 1 s du premier mouvement', stormT.at119.stage === 'wait' && stormT.at119.r >= 460, JSON.stringify(stormT.at119));
  check('tempête : zone en mouvement 2 min après activation', stormT.at122.stage === 'shrink' && stormT.at122.r < 460, JSON.stringify(stormT.at122));

  const dmg = await page.evaluate(() => {
    const G = window.__game;
    const fast = (ms) => { const n = Math.ceil(ms / 16.67); for (let i = 0; i < n; i++) { G.stepOnly(1 / 60); if (G.player.alive) G.player.hp = 1000; } };
    const total = G.playerTotal;
    const alive = () => G.chars.filter((c) => c.alive && !c.hench && !c.boss).length;
    const killTo = (target) => {
      let guard = 0;
      while (alive() > target && guard++ < 300) { const c = G.chars.find((x) => x.alive && !x.isPlayer && !x.hench && !x.boss); if (!c) break; G.damage(c, 999999, null); }
      fast(2000);
      return { alive: alive(), dmg: G.storm.dmg };
    };
    const start = { alive: alive(), dmg: G.storm.dmg, phase: G.storm.phase, stage: G.storm.stage, over: G.matchOver, pAlive: G.player.alive };
    const half = killTo(Math.ceil(total / 2));
    const quarter = killTo(Math.floor(total / 4));
    const five = killTo(5);
    const ladder = { at25: G.stormDamageFor(25), at13: G.stormDamageFor(13), at12: G.stormDamageFor(12), at6: G.stormDamageFor(6), at5: G.stormDamageFor(5) };
    return { total, start, half, quarter, five, ladder };
  });
  check('joueurs : 50 par défaut (50 ou 100 uniquement)', dmg.total === 50, 'total=' + dmg.total);
  check('tempête : 1 dégât au départ', dmg.start.dmg === 1, JSON.stringify(dmg.start));
  check('tempête : 2 dégâts à la moitié des joueurs', dmg.half.alive <= 25 && dmg.half.dmg === 2, JSON.stringify(dmg.half));
  check('tempête : 5 dégâts au quart des joueurs', dmg.quarter.alive <= 13 && dmg.quarter.alive >= 5 && dmg.quarter.dmg === 5, JSON.stringify(dmg.quarter));
  check('tempête : 15 dégâts à 5 survivants', dmg.five.alive <= 5 && dmg.five.dmg === 15, JSON.stringify(dmg.five));
  check('tempête : paliers exacts (13->2, 12->5, 6->5, 5->15)', dmg.ladder.at25 === 2 && dmg.ladder.at13 === 2 && dmg.ladder.at12 === 5 && dmg.ladder.at6 === 5 && dmg.ladder.at5 === 15, JSON.stringify(dmg.ladder));

  if (errors.length) console.log('ERREURS JS tempête:\n' + errors.join('\n'));
  else console.log('Aucune erreur JS tempête');
  await browser.close();
  return errors.length;
}

// ---------------------------------------------------------------------------
// Nombre de joueurs : 50 ou 100, rien d'autre (30 -> 50)
// ---------------------------------------------------------------------------
async function playerCountTests() {
  const browser = await launch();
  const out = [];
  for (const [h, want] of [['#%7B%22players%22%3A30%7D', 50], ['#%7B%22players%22%3A100%7D', 100]]) {
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto('http://localhost:8090/game.html' + h, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__game && window.__game.player, { timeout: 30000 });
    const total = await page.evaluate(() => ({ total: window.__game.playerTotal, participants: window.__game.chars.filter((c) => !c.hench && !c.boss).length }));
    out.push({ q: h, total: total.total, participants: total.participants, want, errs: errs.length });
    await page.close();
  }
  await browser.close();
  return out;
}

// ---------------------------------------------------------------------------
// Lobby (index.html) : skin de base, courbe d'XP, boutique complète
// ---------------------------------------------------------------------------
async function lobbyTests() {
  const browser = await launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:8090/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__lobby, { timeout: 30000 });
  await sleep(1000);

  const res = await page.evaluate(() => {
    const L = window.__lobby;
    // skin de base : la Recrue, pas la Tigresse
    const defSkin = L.DEFAULT_LOADOUT.skin === 'recrue' && L.S.loadout.skin === 'recrue';
    // chaque niveau demande plus d'XP que le précédent
    const curve = L.xpNeeded(2) > L.xpNeeded(1) && L.xpNeeded(10) > L.xpNeeded(9) && L.xpNeeded(30) > L.xpNeeded(1);
    // comportement : le coût du niveau 1 fait passer au niveau 2, mais pas du 2 au 3
    const lv0 = L.S.level;
    L.addXP(L.xpNeeded(1));
    const lv1 = L.S.level, xp1 = L.S.xp;
    L.addXP(L.xpNeeded(1)); // au niveau 2, il faut plus que ça
    const lv2 = L.S.level;
    const levelUp = lv0 === 1 && lv1 === 2 && lv2 === 2 && xp1 === 0;
    // franchissement multiple : 1500 + 1950 = 3450 XP → niveau 3 pile
    const multi = L.addXP(L.xpNeeded(2) - L.S.xp);
    const multiOK = L.S.level === 3 && L.S.xp === 0 && multi.levels === 1;
    // boutique : au moins un objet de chaque catégorie chaque jour
    const shop = L.shopToday();
    const cats = new Set([...shop.daily, ...shop.featured].map((p) => p.cat));
    const allCats = ['skin', 'backpack', 'pickaxe', 'glider', 'emote'].every((c) => cats.has(c));
    return { defSkin, curve, levelUp, multiOK, xpNeeded1: L.xpNeeded(1), xpNeeded2: L.xpNeeded(2), cats: [...cats].sort().join(','), allCats, dailyN: shop.daily.length };
  });
  check('skin de base : la Recrue', res.defSkin === true, JSON.stringify(res));
  check('XP : chaque niveau coûte plus que le précédent', res.curve === true, `1=${res.xpNeeded1}, 2=${res.xpNeeded2}`);
  check('XP : le coût du niveau 1 fait passer 1→2 mais pas 2→3', res.levelUp === true, JSON.stringify(res));
  check('XP : 3450 XP d\'un coup → niveau 3 pile', res.multiOK === true, JSON.stringify(res));
  check('boutique : tenues, sacs à dos, pioches, planeurs et emotes présents', res.allCats === true, res.cats);
  check('boutique : 8 objets du jour', res.dailyN === 8, 'daily=' + res.dailyN);

  // nombre de joueurs : 50 ou 100, pas moins pas plus
  const players = await page.evaluate(() => {
    window.__lobby.renderModePick();
    return [...document.querySelectorAll('#mpPlayers .mp-opt')].map((b) => b.dataset.p);
  });
  check('lobby : 50 ou 100 joueurs, pas moins pas plus', players.length === 2 && players.join(',') === '50,100', players.join(','));

  if (errors.length) console.log('ERREURS JS lobby:\n' + errors.join('\n'));
  else console.log('Aucune erreur JS lobby');
  await browser.close();
  return errors.length;
}

(async () => {
  const e1 = await gameTests();
  const e2 = await lobbyTests();
  const e4 = await stormTests();
  const e3 = await playerCountTests();
  const err3 = e3.reduce((a, r) => a + (r.errs || 0), 0);
  for (const r of e3) check(`joueurs ${r.q} -> ${r.want} participants réels`, r.total === r.want && r.participants === r.want && !r.errs, `getter=${r.total}, réels=${r.participants}`);
  if (err3) console.log('ERREURS JS pages joueurs:\n' + err3);
  console.log(results.join('\n'));
  if (failed || e1 || e2 || e4 || err3) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
