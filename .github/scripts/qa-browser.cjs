#!/usr/bin/env node
// QA navigateur pour STORMDROP : charge le lobby et le jeu, détecte les erreurs JS,
// les 404 et les ressources manquantes. Vérifie que les pages sont réellement opérationnelles.
const path = require('path');
// Résout puppeteer depuis le dépôt racine (installé avec npm --prefix <repo> en CI)
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));

(async () => {
  const errors = [], missingAssets = [], notReady = [];
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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

  // Détection du chargement réel : sélecteurs observés dans le DOM réel du dépôt
  for (const [url, readyCheck] of [
    ['http://localhost:8090/index.html',
      () => document.querySelector('#stage, .page') !== null
        && document.querySelectorAll('script[type="module"]').length > 0],
    ['http://localhost:8090/game.html',
      () => document.querySelector('#game, #hud') !== null
        && document.querySelectorAll('script[type="module"]').length > 0],
  ]) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Attends réellement que le DOM soit complet et que les modules ES soient résolus
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: 15000 })
        .catch(() => notReady.push({ url, reason: 'document pas complet après 15s' }));
      await new Promise(r => setTimeout(r, 5000));
      // Vérifie la condition de disponibilité réelle (canvas / conteneur principal présent)
      const ok = await page.evaluate(readyCheck);
      if (!ok) notReady.push({ url, reason: 'conteneur principal ou modules ES non détectés' });
    } catch (e) {
      errors.push({ type: 'goto', url, message: e.message });
    }
  }

  await browser.close();
  console.log(JSON.stringify({ errors, missingAssets, notReady }, null, 2));
  if (errors.length > 0 || missingAssets.length > 0 || notReady.length > 0) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
