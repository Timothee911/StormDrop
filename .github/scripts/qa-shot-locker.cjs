#!/usr/bin/env node
// Capture du casier : chaque pioche tenue par le perso et chaque sac à dos porté.
// Usage: node .github/scripts/qa-shot-locker.cjs [cat] (pickaxe | backpack)
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));
const BASE = 'http://localhost:8090';
const CAT = process.argv[2] || 'pickaxe';
const BACK = process.argv[3] === 'back'; // tourner le perso pour voir son dos
const IDS = {
  pickaxe: ['default', 'hache', 'sucre', 'epee', 'marteau', 'faux', 'os', 'banane', 'glace', 'cle', 'flambeau', 'pelle', 'katana', 'raquette', 'guitare', 'trident'],
  backpack: ['sac', 'cape', 'ailes', 'fusee', 'carapace', 'ailesdragon', 'cristal', 'skate', 'lanterne', 'tank', 'tnt', 'champi', 'plush', 'boombox', 'aquarium'],
};
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 640 });
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.readyState === 'complete', { timeout: 30000 });
  await page.waitForFunction(() => window.__lobby, { timeout: 20000 });
  // tout débloquer pour pouvoir équiper chaque objet
  await page.evaluate((ids, cat) => {
    for (const id of ids) window.__lobby.S.owned.add(cat + ':' + id);
  }, IDS[CAT], CAT);
  await page.click('[data-tab="locker"]');
  await page.waitForFunction(() => document.querySelectorAll('.lk-item').length > 0, { timeout: 20000 });
  await page.click(`.lk-slot[data-c="${CAT}"]`);
  await new Promise(r => setTimeout(r, 400));
  if (BACK) await page.evaluate(() => window.__lobby.setYaw(Math.PI)); // perso de face/dos inversé
  for (const id of IDS[CAT]) {
    await page.evaluate((id) => {
      const el = document.querySelector(`.lk-item[data-id="${id}"]`);
      if (el) el.click();
    }, id);
    await new Promise(r => setTimeout(r, 900));
    if (BACK) await page.evaluate(() => window.__lobby.setYaw(Math.PI));
    await page.screenshot({ path: `/tmp/lk-${CAT}-${id}${BACK ? "-back" : ""}.png` });
    console.log('capturé', id);
  }
  await browser.close();
})();
