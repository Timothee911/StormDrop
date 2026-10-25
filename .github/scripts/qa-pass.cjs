#!/usr/bin/env node
// QA passe de combat STORMDROP : non-régression du bug « le passe casse après
// avoir joué ». Historique : la case débloquée (badge ✓) perdait sa balise
// fermante </div> dans renderPass(), le innerHTML de la piste devenait mal
// formé et tout le DOM s'imbriquait de travers (vignette flottant sur le
// titre, cases déplacées, clics interceptés). Vérifie aussi que la case
// sélectionnée porte .sel dès le premier rendu (passSel initialisé en retard).
// Scénario : gain d'XP (message 'stormdrop-result' comme le jeu en iframe),
// structure du DOM, badges ✓/cadenas, clic UTILISATEUR réel sur une case.
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));
const BASE = 'http://localhost:8090';
const fail = (m) => { console.error('ECHEC:', m); process.exitCode = 1; };
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  page.on('pageerror', (e) => fail('erreur page: ' + e.message));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.readyState === 'complete', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-tab="pass"]').length > 0, { timeout: 20000 });
  await page.click('[data-tab="pass"]');
  await page.waitForFunction(() => document.querySelectorAll('.reward[data-t]').length > 0, { timeout: 20000 });

  // --- 0) Premier rendu (niveau 1) : une seule case .sel, cohérente avec l'aperçu
  const first = await page.evaluate(() => {
    const sels = document.querySelectorAll('.reward.sel');
    const pp = document.getElementById('passPreview').innerText;
    return { selCount: sels.length, sel: sels[0] ? sels[0].dataset.t + '/' + sels[0].dataset.k : null, pp };
  });
  console.log('premier rendu:', JSON.stringify(first));
  if (first.selCount !== 1 || first.sel !== '1/prem') fail('case sélectionnée absente ou incorrecte au 1er rendu: ' + JSON.stringify(first));
  if (!/brutus/i.test(first.pp)) fail("l'aperçu du 1er rendu ne montre pas Brutus: " + first.pp);
  if (!/Débloqué au niveau 1/.test(first.pp)) fail("niveau de déblocage absent du 1er rendu: " + first.pp);

  // --- 1) Une partie jouée : +12000 XP -> niveau 2 (10 000 XP par niveau), sans acheter le passe
  await page.evaluate((xp) => {
    window.postMessage({ type: 'stormdrop-result', action: 'lobby', won: false, placement: 12, kills: 2, time: 240, xp, xpLog: {}, stats: { damage: 300, chests: 4, harvested: 50, builds: 10, supply: 1, headshots: 2 } }, '*');
  }, 12000);
  await new Promise(r => setTimeout(r, 900));
  const cont = await page.$('#rsContinue');
  if (cont) { await cont.click(); await new Promise(r => setTimeout(r, 500)); }
  await page.click('[data-tab="home"]');
  await new Promise(r => setTimeout(r, 200));
  await page.click('[data-tab="pass"]');
  await new Promise(r => setTimeout(r, 600));

  const lvl = await page.evaluate(() => document.getElementById('lvlNum').textContent.trim());
  const r1 = await page.evaluate(() => {
    const tr = document.getElementById('passTrack');
    const tiers = [...tr.children];
    let structure = 'ok';
    if (tiers.length !== 30 || tiers.some(t => !t.classList.contains('tier'))) structure = 'track: ' + tiers.length + ' enfants';
    const badTier = tiers.find(t => t.children.length !== 5);
    if (badTier) structure = 'tier à ' + badTier.children.length + ' enfants';
    for (const rw of tr.querySelectorAll('.reward')) if (rw.parentElement.classList.contains('reward')) { structure = 'reward imbriquée'; break; }
    for (const t of tiers) if (t.parentElement.classList.contains('tier')) { structure = 'tier imbriquée'; break; }
    // numéros de palier : 1 à 30, premier enfant de chaque colonne, palier courant en jaune
    const nums = tiers.map((t, i) => { const n = t.querySelector(':scope > .tier-num'); return n ? n.textContent.trim() : null; });
    const cur = tr.querySelector('.tier.cur');
    return { structure, nums: nums.every((n, i) => n === String(i + 1)), curNum: cur ? cur.querySelector('.tier-num').textContent.trim() : null, checks: tr.querySelectorAll('.reward .check').length, locks: tr.querySelectorAll('.reward .lock').length, cells: tr.querySelectorAll('.reward[data-t]').length };
  });
  console.log('niveau ' + lvl + ' apres partie:', JSON.stringify(r1));
  if (lvl !== '2') fail('niveau attendu 2, obtenu ' + lvl);
  if (r1.structure !== 'ok') fail('structure DOM cassée après gain d\'XP: ' + r1.structure);
  if (!r1.nums) fail('numéros de palier 1-30 manquants ou incorrects');
  if (r1.curNum !== lvl) fail('palier courant non mis en évidence: attendu ' + lvl + ', obtenu ' + r1.curNum);
  if (r1.checks !== 1) fail('exactement 1 coche ✓ attendue (palier 2 gratuit), obtenu ' + r1.checks);
  if (r1.checks + r1.locks !== r1.cells) fail('badges incohérents: ' + r1.checks + '+' + r1.locks + '!=' + r1.cells);
  await page.screenshot({ path: '/tmp/qa-pass-lvl2.png' });

  // --- 2) Clic UTILISATEUR réel sur la case Midas (palier 30 premium, verrouillée)
  await page.evaluate(() => { const c = document.querySelector('.reward[data-t="30"][data-k="prem"]'); c.scrollIntoView({ block: 'center', inline: 'center' }); });
  await new Promise(r => setTimeout(r, 300));
  await page.click('.reward[data-t="30"][data-k="prem"]');
  await new Promise(r => setTimeout(r, 500));
  const click = await page.evaluate(() => ({
    selCount: document.querySelectorAll('.reward.sel').length,
    sel: (s => s ? s.dataset.t + '/' + s.dataset.k : null)(document.querySelector('.reward.sel')),
    pp: document.getElementById('passPreview').innerText,
  }));
  console.log('apres clic Midas:', JSON.stringify(click));
  if (click.selCount !== 1 || click.sel !== '30/prem') fail('clic réel: sélection incorrecte ' + JSON.stringify(click));
  if (!/midas/i.test(click.pp)) fail("l'aperçu ne montre pas Midas après le clic réel: " + click.pp);
  if (!/Débloqué au niveau 30/.test(click.pp)) fail("le niveau de déblocage manque dans l'aperçu: " + click.pp);
  // la structure doit rester intacte après le re-rendu déclenché par le clic
  const r2 = await page.evaluate(() => {
    const tr = document.getElementById('passTrack');
    return { ok: tr.children.length === 30 && [...tr.children].every(t => t.children.length === 5) };
  });
  if (!r2.ok) fail('structure DOM cassée après le clic');

  // --- 3) Beaucoup d'XP + passe achetée : niveau 9 (12 000 + 58 000 + 14 700 XP
  // de défis = 84 700 XP cumulés), structure et badges
  await page.evaluate((xp) => {
    window.postMessage({ type: 'stormdrop-result', action: 'lobby', won: true, placement: 1, kills: 8, time: 600, xp, xpLog: {}, stats: { damage: 2000, chests: 10, harvested: 500, builds: 80, supply: 3, headshots: 6 } }, '*');
  }, 58000);
  await new Promise(r => setTimeout(r, 900));
  const cont2 = await page.$('#rsContinue');
  if (cont2) { await cont2.click(); await new Promise(r => setTimeout(r, 500)); }
  await page.evaluate(() => { document.getElementById('passBuyBtn').click(); });
  await page.click('[data-tab="home"]');
  await new Promise(r => setTimeout(r, 200));
  await page.click('[data-tab="pass"]');
  await new Promise(r => setTimeout(r, 600));
  const r3 = await page.evaluate(() => {
    const tr = document.getElementById('passTrack');
    const tiers = [...tr.children];
    let structure = 'ok';
    if (tiers.length !== 30) structure = 'track: ' + tiers.length;
    const badTier = tiers.find(t => t.children.length !== 5);
    if (badTier) structure = 'tier à ' + badTier.children.length + ' enfants';
    for (const rw of tr.querySelectorAll('.reward')) if (rw.parentElement.classList.contains('reward')) { structure = 'reward imbriquée'; break; }
    return { structure, checks: tr.querySelectorAll('.reward .check').length, locks: tr.querySelectorAll('.reward .lock').length, cells: tr.querySelectorAll('.reward[data-t]').length, level: document.getElementById('lvlNum').textContent.trim() };
  });
  console.log('niveau ' + r3.level + ' + passe premium:', JSON.stringify(r3));
  if (r3.structure !== 'ok') fail('structure DOM cassée niveau 9: ' + r3.structure);
  if (r3.level !== '9') fail('niveau attendu 9 après les deux parties, obtenu ' + r3.level);
  if (r3.checks === 0) fail('aucune coche ✓ après achat du passe');
  if (r3.checks + r3.locks !== r3.cells) fail('badges incohérents: ' + r3.checks + '+' + r3.locks + '!=' + r3.cells);
  await page.screenshot({ path: '/tmp/qa-pass-lvl9.png' });

  // --- 4) Rechargement (retour niveau 1) : DOM intact, aucune coche
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-tab="pass"]').length > 0, { timeout: 20000 });
  await page.click('[data-tab="pass"]');
  await page.waitForFunction(() => document.querySelectorAll('.reward[data-t]').length > 0, { timeout: 20000 });
  const r4 = await page.evaluate(() => {
    const tr = document.getElementById('passTrack');
    return { tiers: tr.children.length, checks: tr.querySelectorAll('.reward .check').length, ok: [...tr.children].every(t => t.children.length === 5) };
  });
  console.log('apres rechargement:', JSON.stringify(r4));
  if (r4.tiers !== 30 || !r4.ok) fail('DOM cassé après rechargement');
  if (r4.checks !== 0) fail('coche inattendue au niveau 1: ' + r4.checks);

  console.log(process.exitCode ? 'QA PASSE: ECHEC' : 'QA PASSE: OK');
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
