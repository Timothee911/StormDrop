// QA des trois ajouts : sons d'impact différenciés (câblage + définitions),
// aspiration du loot (icônes en vol + compteur retardé puis rattrapé) et
// traînée de frappe (ruban éventail visible pendant le coup, éteint après).
// Usage: node .github/scripts/qa-loot-trail.cjs
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));
const BASE = 'http://localhost:8090';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, label) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + label); if (!ok) fails++; };
(async () => {
  const browser = await puppeteer.launch({ headless: true, protocolTimeout: 600000, args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
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
    const G = window.__game, p = G.player;
    const x = 20, z = 20;
    p.pos.set(x, G.terrainH(x, z) + 0.1, z); p.vel.y = 0;
    G.player.cool = 0; G.player.swing = 0;
  });
  await frame.evaluate(() => window.advanceTime(1500));

  // --- 1. traînée de frappe : ruban visible en pleine frappe, éteint après ---
  const trail = await frame.evaluate(() => {
    const G = window.__game, p = G.player;
    const dir = new G.THREE.Vector3(0.2, -0.8, 0.55).normalize();
    p.cool = 0; p.swing = 0;
    G.fire(p, p.pos.clone().add(new G.THREE.Vector3(0, 1.6, 0)), dir);
    window.advanceTime(160); // pleine frappe
    const active = G.pickTrailPool.filter((t) => t.ch);
    const mid = active.map((t) => ({ visible: t.m.visible, count: t.m.geometry.drawRange.count, samples: t.samples.length }));
    window.advanceTime(1500); // le coup est retombé
    const end = G.pickTrailPool.map((t) => ({ ch: !!t.ch, visible: t.m.visible }));
    return { mid, end };
  });
  check(trail.mid.length > 0 && trail.mid.some((t) => t.visible && t.count > 6 && t.samples >= 2),
    'traînée visible en pleine frappe (éventail > 1 segment)');
  check(trail.end.every((t) => !t.ch && !t.visible), 'traînée relâchée et éteinte après le coup');

  // --- 2. aspiration du loot : icônes en vol, compteur retardé puis rattrapé ---
  const fly = await frame.evaluate(() => {
    const G = window.__game, p = G.player;
    const shown0 = Number(document.getElementById('matWood').textContent);
    // vrai chemin de gain : les mats entrent dans l'inventaire, puis matGain
    p.mats.wood = Math.min(999, p.mats.wood + 15);
    G.matGain('wood', 15, p.pos.clone().add(new G.THREE.Vector3(0.5, 1, 0.5)));
    window.advanceTime(80); // les icônes sont en plein vol
    const icons = document.querySelectorAll('#matFly .mf').length;
    const shownMid = Number(document.getElementById('matWood').textContent);
    // rattrapage : chaque appel d'advanceTime fait vivre updateHUD de 0,2 s
    let shownEnd = shownMid, i = 0;
    for (; i < 12 && G.matFlights() > 0; i++) { window.advanceTime(200); shownEnd = Number(document.getElementById('matWood').textContent); }
    return {
      icons, lagged: shownMid <= shown0, shownMid, shown0, loops: i,
      shownEnd,
      real: p.mats.wood, flights: G.matFlights(),
    };
  });
  check(fly.icons > 0, 'icônes de matériaux en vol (#matFly .mf)');
  check(fly.lagged, `compteur retardé pendant le vol (${fly.shown0} -> ${fly.shownMid})`);
  check(fly.shownEnd === fly.real && fly.flights === 0, `compteur rattrapé après le vol (affiché ${fly.shownEnd} / réel ${fly.real})`);

  // --- 3. sons différenciés : 6 variantes définies dans audio.js + câblées dans melee ---
  const src = await frame.evaluate(async () => ({
    audio: await fetch('js/audio.js').then((r) => r.text()),
    main: await fetch('js/main.js').then((r) => r.text()),
  }));
  const wanted = ['pickWood', 'pickStone', 'pickMetal', 'critWood', 'critStone', 'critMetal'];
  check(wanted.every((w) => src.audio.includes("case '" + w + "'")), 'audio.js définit les 6 sons différenciés');
  // câblage : melee() construit (cr?'crit':'pick')+Mat à partir du matériau frappé
  check(src.main.includes("pickSnd('Wood'") && src.main.includes("pickSnd('Stone'") && src.main.includes("c.mat[0].toUpperCase()"),
    'melee() choisit le son selon le matériau et le crit');
  // variation d'intensité : détune aléatoire dans les nouveaux sons
  check(/pickWood': \{ const p = 0\.93 \+ Math\.random\(\) \* 0\.13/.test(src.audio), 'variation de pitch aléatoire dans les impacts');

  // --- erreurs de page ---
  check(errors.length === 0, 'aucune erreur console/page (' + errors.slice(0, 3).join(' | ') + ')');

  await browser.close();
  console.log(fails === 0 ? 'ALL PASS' : fails + ' FAILURES');
  process.exit(fails === 0 ? 0 : 1);
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
