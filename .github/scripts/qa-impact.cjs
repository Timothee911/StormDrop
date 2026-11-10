// Capture de l'effet d'impact de la pioche : un vrai coup au sol, photo au
// moment de l'impact (horloge figée, avance par petits pas).
// Usage: node qa-impact.cjs
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));
const BASE = 'http://localhost:8090';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ headless: true, protocolTimeout: 600000, args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('stormdrop-name', 'QA'); } catch (e) {} });
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await sleep(1200);
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
    try { const x = 120, z = 120; G.player.pos.set(x, G.terrainH(x, z) + 0.1, z); G.player.vel.y = 0; } catch (e) {}
  });
  await frame.evaluate(() => window.advanceTime(1500));
  // pioche en main, caméra plongeante vers le sol devant le joueur
  await frame.evaluate(() => { const G = window.__game; G.player.item = { kind: 'weapon', id: 'pickaxe' }; G.player.refreshHeld(); });
  await frame.evaluate(() => window.__game.setCam(-1.12, -0.45));
  await frame.evaluate(() => window.advanceTime(400));
  await sleep(600);

  // fige l'horloge puis déclenche un vrai coup via fire()
  await frame.evaluate(() => { window.__game.THREE.Clock.prototype.getDelta = () => 0; });
  await frame.evaluate(() => {
    const G = window.__game, p = G.player;
    p.cool = 0; p.swing = 0;
    // coup synthétique : du torse du joueur vers le sol devant lui (côté caméra)
    const dir = new G.THREE.Vector3(-0.6, -0.62, 0.32).normalize();
    G.fire(p, p.pos.clone().add(new G.THREE.Vector3(0, 1.6, 0)), dir);
  });
  console.log('fired');
  // avance l'effet de ~70 ms (anneau à mi-expansion, flash encore visible)
  await frame.evaluate(() => window.advanceTime(40));
  await sleep(400);
  await page.screenshot({ path: '/tmp/impact-40ms.png' });
  console.log('shot 40ms');
  // ~200 ms : anneau en fin d'expansion, flash éteint
  await frame.evaluate(() => window.advanceTime(80));
  await sleep(400);
  await page.screenshot({ path: '/tmp/impact-120ms.png' });
  console.log('shot 120ms');
  await browser.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
