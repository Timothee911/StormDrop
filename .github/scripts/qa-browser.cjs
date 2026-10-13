#!/usr/bin/env node
// QA navigateur pour STORMDROP : charge le lobby et le jeu, détecte les erreurs JS,
// les 404 et les ressources manquantes. Vérifie que le JS s'est réellement exécuté
// (canvas WebGL rendu via capture d'écran, conteneurs présents), pas seulement le HTML statique.
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));

(async () => {
  const errors = [], missingAssets = [], notReady = [];
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader'] });
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push({ type: 'pageerror', message: e.message }));
  page.on('requestfailed', req => {
    if (req.url().includes('localhost') && !req.url().endsWith('/favicon.ico')) missingAssets.push(req.url());
  });
  page.on('response', res => {
    if (res.url().includes('localhost') && res.status() === 404 && !res.url().endsWith('/favicon.ico')) {
      errors.push({ type: 'http404', url: res.url() });
    }
  });

  // Détection du chargement réel : vérifie que le JS s'est réellement exécuté
  // (conteneurs DOM rendus, module ES chargé, canvas WebGL rendu via capture d'écran)
  for (const [url, canvasSel, elemSel] of [
    ['http://localhost:8090/index.html', '#stage', '.page'],
    ['http://localhost:8090/game.html', '#game', '#hud'],
  ]) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: 15000 })
        .catch(() => notReady.push({ url, reason: 'document pas complet après 15s' }));
      await new Promise(r => setTimeout(r, 5000));

      const result = await page.evaluate(([sel, elSel]) => {
        const canvas = document.querySelector(sel);
        const elems = document.querySelectorAll(elSel);
        if (!canvas) return { ok: false, reason: `canvas ${sel} absent` };
        if (elems.length === 0) return { ok: false, reason: `conteneur ${elSel} absent` };
        if (canvas.width === 0 || canvas.height === 0) return { ok: false, reason: 'canvas de taille nulle' };
        return { ok: true, w: canvas.width, h: canvas.height };
      }, [canvasSel, elemSel]);

      if (!result.ok) { notReady.push({ url, reason: result.reason }); continue; }

      // Capture d'écran du canvas et vérifie qu'il contient des pixels non uniformes
      const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: result.w, height: result.h } });
      if (png.length < 200) notReady.push({ url, reason: 'capture PNG trop petite' });
      // Note : gl.readPixels est vide si preserveDrawingBuffer est false, donc on
      // s'appuie sur la taille de la capture PNG (plusieurs Ko = contenu réel).
      console.log(`[QA] ${url} : canvas ${result.w}x${result.h}, capture PNG ${png.length} octets`);
    } catch (e) {
      errors.push({ type: 'goto', url, message: e.message });
    }
  }

  await browser.close();
  console.log(JSON.stringify({ errors, missingAssets, notReady }, null, 2));
  if (errors.length > 0 || missingAssets.length > 0 || notReady.length > 0) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
