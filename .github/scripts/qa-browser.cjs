#!/usr/bin/env node
// QA navigateur pour STORMDROP : charge le lobby et le jeu, détecte les erreurs JS,
// les 404 et les ressources manquantes. Vérifie que l'application s'est réellement
// initialisée : une interaction du lobby (onglets) et une boucle de rendu WebGL
// qui progresse réellement (instrumentée), pas seulement la présence du HTML statique.
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));

(async () => {
  const errors = [], missingAssets = [], notReady = [];
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
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

  // Instrumente la boucle de rendu WebGL AVANT la navigation (before-goto via evaluateOnNewDocument)
  await page.evaluateOnNewDocument(() => {
    window.__qa_gl_draw_calls = 0;
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      const ctx = origGetContext.call(this, type, ...args);
      if (ctx && (type === 'webgl' || type === 'webgl2')) {
        // Surveille les vrais appels de rendu, pas juste getContext
        const origDrawArrays = ctx.drawArrays ? ctx.drawArrays.bind(ctx) : null;
        const origDrawElements = ctx.drawElements ? ctx.drawElements.bind(ctx) : null;
        if (origDrawArrays) ctx.drawArrays = (...a) => { window.__qa_gl_draw_calls++; return origDrawArrays(...a); };
        if (origDrawElements) ctx.drawElements = (...a) => { window.__qa_gl_draw_calls++; return origDrawElements(...a); };
      }
      return ctx;
    };
  });

  // Lobby : vérifie une interaction réelle (les onglets changent l'état du DOM)
  {
    const url = 'http://localhost:8090/index.html';
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Polling explicite (et pas rAF) : la boucle de rendu du jeu sature les
      // requestAnimationFrame et l'attente par défaut de Puppeteer ne s'exécute jamais.
      const t0 = Date.now();
      while (Date.now() - t0 < 15000) {
        const st = await page.evaluate(() => document.readyState).catch(() => null);
        if (st === 'complete') break;
        await new Promise(r => setTimeout(r, 500));
      }
      if ((await page.evaluate(() => document.readyState)) !== 'complete')
        notReady.push({ url, reason: 'document pas complet après 15s' });
      await new Promise(r => setTimeout(r, 3000));

      // Vérifie que la boucle de rendu WebGL progresse réellement
      const before = await page.evaluate(() => window.__qa_gl_draw_calls || 0);
      await new Promise(r => setTimeout(r, 2000));
      const after = await page.evaluate(() => window.__qa_gl_draw_calls || 0);
      if (after - before <= 0) notReady.push({ url, reason: 'aucun appel de rendu WebGL observé entre deux mesures' });

      // Vérifie une interaction réelle du lobby : cliquer sur un onglet différent du courant
      // doit changer body.dataset.tab (prouve que le JS du lobby s'est attaché et s'exécute)
      const beforeTab = await page.evaluate(() => document.body.dataset.tab);
      const otherTabIdx = await page.evaluate((current) => {
        const btns = Array.from(document.querySelectorAll('#tabs button'));
        const idx = btns.findIndex(b => b.dataset.tab !== current);
        return idx;
      }, beforeTab);
      if (otherTabIdx < 0) {
        notReady.push({ url, reason: "aucun bouton dans #tabs — le lobby n'est pas initialisé" });
      } else {
        await (await page.$$('#tabs button'))[otherTabIdx].click();
        await new Promise(r => setTimeout(r, 500));
        const afterTab = await page.evaluate(() => document.body.dataset.tab);
        if (beforeTab === afterTab) notReady.push({ url, reason: "clic sur un onglet n'a pas changé body.dataset.tab — le JS du lobby ne s'exécute pas" });
      }
    } catch (e) {
      errors.push({ type: 'goto', url, message: e.message });
    }
  }

  // Jeu : vérifie que la boucle de rendu WebGL progresse réellement sur le canvas #game
  {
    const url = 'http://localhost:8090/game.html';
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const t0 = Date.now();
      while (Date.now() - t0 < 30000) {
        const st = await page.evaluate(() => document.readyState).catch(() => null);
        if (st === 'complete') break;
        await new Promise(r => setTimeout(r, 500));
      }
      if ((await page.evaluate(() => document.readyState)) !== 'complete')
        notReady.push({ url, reason: 'document pas complet après 30s' });
      await new Promise(r => setTimeout(r, 5000));

      const canvas = await page.$('#game');
      if (!canvas) {
        notReady.push({ url, reason: "canvas #game absent" });
      } else {
        const before = await page.evaluate(() => window.__qa_gl_draw_calls || 0);
        await new Promise(r => setTimeout(r, 2000));
        const after = await page.evaluate(() => window.__qa_gl_draw_calls || 0);
        if (after - before <= 0) notReady.push({ url, reason: 'aucun appel de rendu WebGL observé entre deux mesures — le jeu ne boucle pas' });
      }

      // Vérifie que le HUD est rendu
      const hud = await page.$('#hud');
      if (!hud) notReady.push({ url, reason: "#hud absent — le jeu ne s'est pas initialisé" });
    } catch (e) {
      errors.push({ type: 'goto', url, message: e.message });
    }
  }

  await browser.close();
  console.log(JSON.stringify({ errors, missingAssets, notReady }, null, 2));
  if (errors.length > 0 || missingAssets.length > 0 || notReady.length > 0) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
