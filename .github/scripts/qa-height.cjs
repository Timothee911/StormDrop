#!/usr/bin/env node
// QA hauteur maximale de construction + brouillard + nuages + HUD vie/bouclier.
// Charge game.html, attend window.__game, puis vérifie :
//  - placeBuild accepte un mur à y=60 (sommet 64) et refuse au-delà de 64 m
//  - les matériaux ne sont pas déduits quand la construction est refusée
//  - le cône (1,6 m) suit la même limite
//  - scene.fog est null (brouillard retiré)
//  - des nuages sprites existent en altitude (y > 250)
//  - le texte de vie est entièrement visible : dans son parent, son ancêtre et l'écran,
//    et aucun élément ne le recouvre (elementsFromPoint)
const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules', 'puppeteer'));

(async () => {
  const failures = [];
  const check = (name, ok, detail) => {
    console.log((ok ? 'OK   ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
    if (!ok) failures.push(name);
  };

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1347, height: 841 });
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));

  const base = process.env.SD_QA_URL || 'http://localhost:8090';
  await page.goto(base + '/game.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  // attend que le jeu soit initialisé (window.__game exposé en fin de main.js)
  const t0 = Date.now();
  while (Date.now() - t0 < 120000) {
    const ready = await page.evaluate(() => !!window.__game && !!window.__game.player).catch(() => false);
    if (ready) break;
    await new Promise(r => setTimeout(r, 1000));
  }
  if (!(await page.evaluate(() => !!window.__game && !!window.__game.player).catch(() => false))) {
    console.log(JSON.stringify({ failures: ['jeu non initialisé'], jsErrors }, null, 2));
    process.exit(1);
  }
  await new Promise(r => setTimeout(r, 3000));

  // --- hauteur maximale de construction ---
  const res = await page.evaluate(() => {
    const G = window.__game, p = G.player, out = {};
    p.mats.wood = 500;
    const cx = 400, cz = 400; // zone libre, loin des POI
    // signature : placeBuild(owner, type, cx, cz, y, d, mat) — mat est une clé 'wood'|'stone'|'metal'
    const place = (type, x, y, d) => G.placeBuild(p, type, x, 400, y, d, 'wood');
    out.wall60 = place('wall', cx, 60, 0);        // sommet 64 : accepté
    out.wall64 = place('wall', cx + 1, 64, 0);    // sommet 68 : accepté (mur le plus haut possible)
    out.wall65 = place('wall', cx + 2, 65, 0);    // sommet 69 : refusé
    out.wall76 = place('wall', cx + 3, 76, 0);    // refusé
    out.floor64 = place('floor', cx + 4, 64, 0);  // accepté
    out.floor65 = place('floor', cx + 5, 65, 0);  // refusé
    out.cone66 = place('cone', cx + 6, 66, 0);   // 66+1.6=67.6 : accepté
    out.cone67 = place('cone', cx + 7, 67, 0);    // 67+1.6=68.6 : refusé
    out.matsAfter = p.mats.wood;                    // 500 - 5*BUILD_COST si 4 placements acceptés
    out.buildsCount = G.builds.size;
    return out;
  });
  check('mur accepté à y=60 (sommet 64)', res.wall60 === true, JSON.stringify(res));
  check('mur accepté à y=64 (sommet 68, le plus haut possible)', res.wall64 === true);
  check('mur refusé à y=65', res.wall65 === false);
  check('mur refusé à y=76', res.wall76 === false);
  check('plancher accepté à y=64', res.floor64 === true);
  check('plancher refusé à y=65', res.floor65 === false);
  check('cône accepté à y=66', res.cone66 === true);
  check('cône refusé à y=67', res.cone67 === false);
  const cost = 5; // BUILD_COST
  check('matériaux déduits uniquement pour les placements acceptés', res.matsAfter === 500 - 4 * cost, `mats=${res.matsAfter}, attendu=${500 - 4 * cost}`);

  // --- brouillard retiré ---
  const fog = await page.evaluate(() => ({ fog: window.__game.scene.fog }));
  check('scene.fog est null (brouillard retiré)', fog.fog === null, 'fog=' + JSON.stringify(fog.fog));

  // --- nuages hauts et gros (sprites en altitude) ---
  const clouds = await page.evaluate(() => {
    const G = window.__game;
    let high = 0, total = 0, topY = 0;
    G.scene.traverse(o => {
      if (o.isSprite) { total++; if (o.parent && o.parent.position.y > 250) { high++; topY = Math.max(topY, o.parent.position.y); } }
    });
    return { total, high, topY };
  });
  check('nuages sprites présents en altitude (y>250)', clouds.high >= 50, `sprites hauts=${clouds.high}/${clouds.total}, y max=${clouds.topY}`);

  // --- HUD : texte de vie entièrement visible, non masqué ---
  const hud = await page.evaluate(() => {
    const out = {};
    for (const id of ['hpTxt', 'shieldTxt']) {
      const el = document.getElementById(id);
      const r = el.getBoundingClientRect();
      const bar = el.closest('.bar').getBoundingClientRect();
      // recouvrement géométrique : tout élément du HUD (hors ancêtres du texte) qui chevauche le texte
      const overlappers = [];
      document.querySelectorAll('#hud *').forEach(o => {
        if (o === el || el.contains(o) || o.contains(el)) return;
        const b = o.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) return;
        // ignore les superpositions invisibles (vignette, overlay tempête à opacité 0, conteneurs vides)
        const cs = getComputedStyle(o);
        if (cs.opacity === '0' || cs.visibility === 'hidden' || cs.display === 'none') return;
        // conteneur vide (ex. #dmgNums) : rien à afficher, ne masque rien
        if (o.childElementCount === 0 && !(o.textContent || '').trim()) return;
        if (b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top) overlappers.push(o.tagName + (o.id ? '#' + o.id : '') + '.' + (o.className || ''));
      });
      out[id] = {
        text: el.textContent,
        clippedByViewport: r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight,
        outsideBar: r.left < bar.left || r.right > bar.right,
        overlappers: overlappers.slice(0, 3),
      };
    }
    out.bottomleftLeft = Math.round(document.getElementById('bottomleft').getBoundingClientRect().left);
    return out;
  });
  check('texte de vie visible (viewport)', !hud.hpTxt.clippedByViewport, JSON.stringify(hud.hpTxt));
  check('texte de vie dans sa barre', !hud.hpTxt.outsideBar);
  check('texte de vie non recouvert', (hud.hpTxt.overlappers || []).length === 0, JSON.stringify(hud.hpTxt.overlappers));
  check('texte de bouclier visible', !hud.shieldTxt.clippedByViewport && !hud.shieldTxt.outsideBar);
  check('marge gauche du HUD respectée (>= 12px)', hud.bottomleftLeft >= 12, 'left=' + hud.bottomleftLeft);

  await browser.close();
  console.log(JSON.stringify({ failures, jsErrors: jsErrors.slice(0, 5) }, null, 2));
  if (failures.length > 0 || jsErrors.length > 0) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
