#!/usr/bin/env node
// Capture en jeu : le joueur vu de dos avec sa pioche et son sac à dos.
// Usage: node .github/scripts/qa-shot-game.cjs [pickaxeId] [backpackId] [fichier]
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));
const BASE = 'http://localhost:8090';
const PK = process.argv[2] || 'default';
const BP = process.argv[3] || 'sac';
const OUT = process.argv[4] || '/tmp/game-shot.png';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ headless: true, protocolTimeout: 600000, args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('stormdrop-name', 'QA'); } catch (e) {} });
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await sleep(1200);
  await page.evaluate((pk, bp) => {
    window.__lobby.S.owned.add('pickaxe:' + pk, 'backpack:' + bp);
    window.__lobby.S.loadout.pickaxe = pk; window.__lobby.S.loadout.backpack = bp;
  }, PK, BP);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /jouer/i.test(x.textContent)); if (b) b.click(); });
  await sleep(3000);
  let frame = page.frames().find((f) => f.url().includes('game.html'));
  if (!frame) { await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /jouer/i.test(x.textContent)); if (b) b.click(); }); await sleep(4000); frame = page.frames().find((f) => f.url().includes('game.html')); }
  if (!frame) { console.error('FAIL: partie non lancée'); await browser.close(); process.exit(1); }
  await frame.waitForFunction(() => window.__game && window.__game.player, { timeout: 30000 }).catch(() => {});
  await sleep(1500);
  // sauter du bus et attendre l'atterrissage
  await frame.evaluate(() => { try { window.__game.jumpFromBus(); } catch (e) {} });
  await frame.evaluate(() => window.advanceTime(30000));
  // sur terre, près de l'Agence, contours désactivés (artefact headless)
  await frame.evaluate(() => {
    const G = window.__game;
    try { if (G.outline && 'enabled' in G.outline) G.outline.enabled = false; } catch (e) {}
    try { const x = 20, z = 20; G.player.pos.set(x, G.terrainH(x, z) + 0.1, z); G.player.vel.y = 0; } catch (e) {}
  });
  await frame.evaluate(() => window.advanceTime(1500));
  await sleep(800);
  // caméra légèrement de côté pour bien voir pioche + sac
  await frame.evaluate(() => { window.__game.setCam(2.4, -0.25); });
  await frame.evaluate(() => window.advanceTime(400));
  await sleep(600);
  await page.screenshot({ path: OUT });
  console.log('capture:', OUT);
  await browser.close();
})();
