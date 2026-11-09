// Capture du coup de pioche phase par phase (armé / frappe / rebond / retour).
// L'horloge du jeu est figée (getDelta -> 0) : la boucle de rendu tourne mais
// n'avance plus la simulation, on pose swing directement pour chaque phase.
// Usage: node qa-swing4.cjs [pickaxeId]
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));
const BASE = 'http://localhost:8090';
const PK = process.argv[2] || 'default';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ headless: true, protocolTimeout: 600000, args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('stormdrop-name', 'QA'); } catch (e) {} });
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await sleep(1200);
  await page.evaluate((pk) => {
    window.__lobby.S.owned.add('pickaxe:' + pk);
    window.__lobby.S.loadout.pickaxe = pk;
  }, PK);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /jouer/i.test(x.textContent)); if (b) b.click(); });
  await sleep(3000);
  let frame = page.frames().find((f) => f.url().includes('game.html'));
  if (!frame) { await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /jouer/i.test(x.textContent)); if (b) b.click(); }); await sleep(4000); frame = page.frames().find((f) => f.url().includes('game.html')); }
  if (!frame) { console.error('FAIL: partie non lancée'); await browser.close(); process.exit(1); }
  await frame.waitForFunction(() => window.__game && window.__game.player, { timeout: 60000 }).catch(() => {});
  await sleep(1500);
  await frame.evaluate(() => { try { window.__game.jumpFromBus(); } catch (e) {} });
  await frame.evaluate(() => window.advanceTime(30000));
  await frame.evaluate(() => {
    const G = window.__game;
    try { if (G.outline && 'enabled' in G.outline) G.outline.enabled = false; } catch (e) {}
    try { const x = 20, z = 20; G.player.pos.set(x, G.terrainH(x, z) + 0.1, z); G.player.vel.y = 0; } catch (e) {}
  });
  await frame.evaluate(() => window.advanceTime(1500));
  await frame.evaluate(() => { window.__game.setCam(2.4, -0.25); });
  await frame.evaluate(() => window.advanceTime(400));
  await sleep(600);

  // pioche en main, pose de départ
  await frame.evaluate(() => { const G = window.__game; G.player.item = { kind: 'weapon', id: 'pickaxe' }; G.player.refreshHeld(); });
  await frame.evaluate(() => window.advanceTime(200));
  await sleep(300);

  // FIGE l'horloge : la boucle de rendu continue (pose appliquée chaque frame)
  // mais la simulation n'avance plus, le swing ne retombe pas.
  await frame.evaluate(() => { window.__game.THREE.Clock.prototype.getDelta = () => 0; });
  await sleep(400);
  await page.screenshot({ path: '/tmp/swing-0-idle.png' });
  console.log('shot idle');

  // phases : k = 1 - swing (k = avancée du coup de 0 à 1)
  const phases = [
    ['10-arme-fin', 0.80],
    ['26-descente-debut', 0.74],
    ['34-descente-mi', 0.66],
    ['43-frappe-bas', 0.57],
    ['50-rebond', 0.50],
    ['72-retour', 0.28],
  ];
  for (const [name, swing] of phases) {
    await frame.evaluate((v) => { const q = window.__game.player; q.swing = v; q.cool = 0.6; }, swing);
    await sleep(450);
    await page.screenshot({ path: `/tmp/swing-${name}.png` });
    console.log('shot', name);
  }
  await browser.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
