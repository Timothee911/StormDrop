#!/usr/bin/env node
// QA passe de combat STORMDROP : non-régression du bug « le passe casse après
// avoir joué ». Historique : la case débloquée (badge ✓) perdait sa balise
// fermante </div> dans renderPass(), le innerHTML de la piste devenait mal
// formé et tout le DOM s'imbriquait de travers (vignette flottant sur le
// titre, cases déplacées, clics interceptés). Vérifie aussi que la case
// sélectionnée porte .sel dès le premier rendu (passSel initialisé en retard).
// Scénario : gain d'XP (message 'stormdrop-result' comme le jeu en iframe),
// structure du DOM, badges ✓/cadenas, clic UTILISATEUR réel sur une case.
// Le passe est organisé en pages de 6 récompenses (une par niveau) : 2 gratuites
// (niveau suffisant) et 4 premium (niveau + Passe Premium), affichées en bas.
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));
const BASE = 'http://localhost:8090';
const fail = (m) => { console.error('ECHEC:', m); process.exitCode = 1; };
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('stormdrop-name', 'QA'); } catch (e) {} }); // pseudo présent : le bouton JOUER lance la partie
  await page.setViewport({ width: 1600, height: 900 });
  page.on('pageerror', (e) => fail('erreur page: ' + e.message));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.readyState === 'complete', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-tab="pass"]').length > 0, { timeout: 20000 });
  await page.click('[data-tab="pass"]');
  await page.waitForFunction(() => document.querySelectorAll('.reward[data-t]').length > 0, { timeout: 20000 });

  // --- A) Accueil du passe : progression, niveau, achats et 5 catégories
  const home = await page.evaluate(() => ({
    visible: getComputedStyle(document.getElementById('passHome')).display !== 'none',
    tiles: [...document.querySelectorAll('#bpTiles [data-open-pass]')].map(t => t.dataset.openPass).join(','),
    rew: document.getElementById('bpRew').textContent, pages: document.getElementById('bpPages').textContent,
    lvl: document.getElementById('bpLvl').textContent, segs: document.querySelectorAll('#bpSeg i').length,
    next: document.getElementById('bpUpNext').innerText, hero: document.getElementById('bpHero').innerText,
  }));
  console.log('accueil du passe:', JSON.stringify(home));
  if (!home.visible) fail("l'accueil du passe n'est pas affiché");
  if (home.tiles !== 'main,free,premium,bonus,quete') fail('catégories inattendues: ' + home.tiles);
  if (home.rew !== '0 / 50' || home.pages !== '0 / 7' || home.lvl !== '1' || home.segs !== 10) fail('progression incorrecte: ' + JSON.stringify(home));
  if (!/Niveau 2/.test(home.next) || !/Brutus/.test(home.hero)) fail('prochaine récompense / héros incorrects: ' + JSON.stringify(home));
  // acheter un niveau depuis l'accueil : niveau 2, 100 Éclats gratuits obtenus
  await page.click('#bpBuyLvl');
  await new Promise(r => setTimeout(r, 300));
  const bought = await page.evaluate(() => ({ lvl: document.getElementById('bpLvl').textContent, rew: document.getElementById('bpRew').textContent, cur: document.getElementById('curVal').textContent.replace(/\s/g, '') }));
  console.log('après achat de niveau:', JSON.stringify(bought));
  if (bought.lvl !== '2' || bought.rew !== '1 / 50' || bought.cur !== '1150') fail("achat de niveau depuis l'accueil: " + JSON.stringify(bought));
  // retour au niveau 1 pour la suite du scénario
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-tab="pass"]').length > 0, { timeout: 20000 });
  await page.click('[data-tab="pass"]');
  await page.waitForFunction(() => document.querySelectorAll('.reward[data-t]').length > 0, { timeout: 20000 });
  await page.click('#bpTiles [data-open-pass="main"]');
  await new Promise(r => setTimeout(r, 300));

  // structure d'une page : 6 cases directement dans la piste, 2 gratuites + 4 premium
  const pageState = () => page.evaluate(() => {
    const tr = document.getElementById('passTrack'), cells = [...tr.children];
    let structure = 'ok';
    if (cells.length < 1 || cells.length > 6 || cells.some(c => !c.classList.contains('reward'))) structure = 'piste: ' + cells.length + ' enfants';
    for (const rw of tr.querySelectorAll('.reward')) if (rw.parentElement !== tr) { structure = 'reward imbriquée'; break; }
    return {
      structure, label: document.getElementById('ppLabel').textContent,
      tiers: cells.map(c => c.dataset.t).join(','), free: tr.querySelectorAll('.reward.free').length, prem: tr.querySelectorAll('.reward.prem').length,
      lvls: cells.every(c => c.querySelector('.pc-lvl')?.textContent === 'NIV. ' + c.dataset.t),
      checks: tr.querySelectorAll('.reward .check').length, locks: tr.querySelectorAll('.reward .lock').length,
      cur: tr.querySelector('.reward.cur')?.dataset.t || null, visible: tr.getBoundingClientRect().top > innerHeight * 0.45,
    };
  });

  // --- 0) Premier rendu (niveau 1) : une seule case .sel, cohérente avec l'aperçu
  const first = await page.evaluate(() => {
    const sels = document.querySelectorAll('.reward.sel');
    const pp = document.getElementById('passPreview').innerText;
    return { selCount: sels.length, sel: sels[0] ? sels[0].dataset.t + '/' + sels[0].dataset.k : null, pp };
  });
  const p0 = await pageState();
  console.log('premier rendu:', JSON.stringify(first), JSON.stringify(p0));
  if (first.selCount !== 1 || first.sel !== '1/prem') fail('case sélectionnée absente ou incorrecte au 1er rendu: ' + JSON.stringify(first));
  if (!/brutus/i.test(first.pp)) fail("l'aperçu du 1er rendu ne montre pas Brutus: " + first.pp);
  if (!/Débloqué au niveau 1/.test(first.pp)) fail("niveau de déblocage absent du 1er rendu: " + first.pp);
  if (p0.structure !== 'ok' || p0.label !== 'PAGE 1 / 5' || p0.tiers !== '1,2,3,4,5,6' || p0.free !== 2 || p0.prem !== 4 || !p0.lvls) fail('page 1 incorrecte: ' + JSON.stringify(p0));
  if (!p0.visible) fail('les récompenses ne sont pas en bas de l\'écran');
  // toutes les pages : 6 cases, 2 gratuites + 4 premium
  for (let i = 2; i <= 5; i++) {
    await page.click('#ptR'); await new Promise(r => setTimeout(r, 150));
    const pi = await pageState();
    if (pi.structure !== 'ok' || pi.label !== `PAGE ${i} / 5` || pi.free !== 2 || pi.prem !== 4 || !pi.lvls) fail(`page ${i} incorrecte: ` + JSON.stringify(pi));
  }
  await page.click('#ppDots [data-pg="0"]'); await new Promise(r => setTimeout(r, 150));

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
  const r1 = await pageState();
  console.log('niveau ' + lvl + ' apres partie:', JSON.stringify(r1));
  if (lvl !== '2') fail('niveau attendu 2, obtenu ' + lvl);
  if (r1.structure !== 'ok') fail("structure DOM cassée après gain d'XP: " + r1.structure);
  if (r1.cur !== lvl) fail('niveau courant non mis en évidence: attendu ' + lvl + ', obtenu ' + r1.cur);
  if (r1.checks !== 1) fail('exactement 1 coche ✓ attendue (niveau 2 gratuit), obtenu ' + r1.checks);
  if (r1.checks + r1.locks !== 6) fail('badges incohérents: ' + r1.checks + '+' + r1.locks);
  await page.screenshot({ path: '/tmp/qa-pass-lvl2.png' });

  // --- 2) Clic UTILISATEUR réel sur la case Midas (niveau 30 premium, page 5)
  await page.click('#ppDots [data-pg="4"]'); await new Promise(r => setTimeout(r, 200));
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
  if ((await pageState()).structure !== 'ok') fail('structure DOM cassée après le clic');

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
  await page.click('#ppDots [data-pg="0"]'); await new Promise(r => setTimeout(r, 150));
  const r3a = await pageState();
  await page.click('#ppDots [data-pg="1"]'); await new Promise(r => setTimeout(r, 150));
  const r3b = await pageState();
  const r3 = await page.evaluate(() => ({ level: document.getElementById('lvlNum').textContent.trim(), dot0: document.querySelector('#ppDots [data-pg="0"]').classList.contains('done') }));
  console.log('niveau ' + r3.level + ' + passe premium:', JSON.stringify({ page1: r3a, page2: r3b, ...r3 }));
  if (r3a.structure !== 'ok' || r3b.structure !== 'ok') fail('structure DOM cassée niveau 9');
  if (r3.level !== '9') fail('niveau attendu 9 après les deux parties, obtenu ' + r3.level);
  if (r3a.checks !== 6 || !r3.dot0) fail('page 1 entièrement débloquée attendue: ' + JSON.stringify(r3a));
  if (r3b.checks !== 3 || r3b.locks !== 3) fail('page 2 : niveaux 7 à 9 débloqués attendus: ' + JSON.stringify(r3b));
  await page.screenshot({ path: '/tmp/qa-pass-lvl9.png' });

  // --- 4) Rechargement (retour niveau 1) : DOM intact, aucune coche
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-tab="pass"]').length > 0, { timeout: 20000 });
  await page.click('[data-tab="pass"]');
  await page.waitForFunction(() => document.querySelectorAll('.reward[data-t]').length > 0, { timeout: 20000 });
  await page.click('#bpTiles [data-open-pass="main"]');
  const r4 = await pageState();
  console.log('apres rechargement:', JSON.stringify(r4));
  if (r4.structure !== 'ok' || r4.tiers !== '1,2,3,4,5,6') fail('DOM cassé après rechargement');
  if (r4.checks !== 0) fail('coche inattendue au niveau 1: ' + r4.checks);

  console.log(process.exitCode ? 'QA PASSE: ECHEC' : 'QA PASSE: OK');
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
