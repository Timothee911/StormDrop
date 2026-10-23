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
const launch = () => puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

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

  if (errors.length) console.log('ERREURS JS jeu:\n' + errors.join('\n'));
  else console.log('Aucune erreur JS jeu');
  await browser.close();
  return errors.length;
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

  if (errors.length) console.log('ERREURS JS lobby:\n' + errors.join('\n'));
  else console.log('Aucune erreur JS lobby');
  await browser.close();
  return errors.length;
}

(async () => {
  const e1 = await gameTests();
  const e2 = await lobbyTests();
  console.log(results.join('\n'));
  if (failed || e1 || e2) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
