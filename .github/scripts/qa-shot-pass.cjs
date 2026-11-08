#!/usr/bin/env node
// Capture d'écran du passe de combat pour revue visuelle (QA manuel).
// Usage: node .github/scripts/qa-shot-pass.cjs [largeur] [hauteur] [fichier]
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));
const BASE = 'http://localhost:8090';
const W = +(process.argv[2] || 1600), H = +(process.argv[3] || 900);
const OUT = process.argv[4] || `/tmp/pass-${W}x${H}.png`;
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.readyState === 'complete', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-tab="pass"]').length > 0, { timeout: 20000 });
  await page.click('[data-tab="pass"]');
  await page.waitForFunction(() => document.querySelectorAll('.reward[data-t]').length > 0, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 1600)); // laisser la caméra se stabiliser
  await page.screenshot({ path: OUT });
  // mesures de chevauchement
  const m = await page.evaluate(() => {
    const vp = { w: innerWidth, h: innerHeight };
    const rects = (sel) => [...document.querySelectorAll(sel)].map(e => e.getBoundingClientRect());
    const track = document.querySelector('.pass-track-wrap').getBoundingClientRect();
    const right = document.querySelector('.pass-right').getBoundingClientRect();
    const left = document.querySelector('.pass-left').getBoundingClientRect();
    const nav = document.querySelector('.pass-nav').getBoundingClientRect();
    const overlap = (a, b) => !(a.bottom <= b.top + 1 || b.bottom <= a.top + 1 || a.right <= b.left + 1 || b.right <= a.left + 1);
    const rightOverTrack = overlap(right, track);
    // le perso : canvas plein écran ; on estime via la position 3D projetée (pas dispo) -> juste bounding boxes UI
    return { vp, track: { t: track.top, b: track.bottom }, right: { t: right.top, b: right.bottom, h: right.height }, left: { b: left.bottom }, nav: { t: nav.top, b: nav.bottom }, rightOverTrack };
  });
  console.log(JSON.stringify(m, null, 1));
  console.log('capture:', OUT);
  await browser.close();
})();
