#!/usr/bin/env node
// Real touch input, simultaneous fingers, responsive lobby and HUD regressions.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const base = process.env.QA_URL || 'http://localhost:8090';
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'], protocolTimeout: 180000 });
  let count = 0;
  const check = (name, ok, detail) => {
    assert.ok(ok, `${name}: ${JSON.stringify(detail)}`);
    console.log(`PASS | ${name}`); count++;
  };
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // CDP tap does not auto-wait for modal scale transitions like Playwright.
    // Keep real touch events, but don't aim at a button while it is moving.
    const touchTap = page.tap.bind(page);
    page.tap = async selector => {
      await page.$eval(selector, e => e.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
      await page.evaluate(() => Promise.all(document.getAnimations()
        .filter(a => Number.isFinite(a.effect?.getComputedTiming().iterations))
        .map(a => a.finished.catch(() => {}))));
      return touchTap(selector);
    };
    await page.evaluateOnNewDocument(() => { window.requestAnimationFrame = fn => { window.__qaFrame = fn; return 1; }; });
    const viewport = async (w, h) => page.setViewport({ width: w, height: h, isMobile: true, hasTouch: true });
    await viewport(375, 812);
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__lobby, { polling: 50 });
    await page.evaluate(() => document.fonts.ready);
    check('portrait : écran paysage obligatoire dans le lobby', await page.evaluate(() => StormLandscape.blocked && !document.getElementById('landscapeGate').hidden));
    await page.tap('#landscapeActivate');
    await page.waitForFunction(() => !document.getElementById('landscapeActivate').disabled, { polling: 50 });
    check('activation native : refus ou absence pris en charge sans erreur', await page.$eval('#landscapeStatus', e => /Tourne|prêt/.test(e.textContent)));
    await page.evaluate(async () => { if (document.fullscreenElement) await document.exitFullscreen().catch(() => {}); });
    const tabTo = async tab => {
      await page.tap(`#tabs [data-tab="${tab}"]`);
      await page.waitForFunction(tab => document.getElementById(`page-${tab}`).classList.contains('on'), { polling: 50 }, tab);
    };
    for (const [w, h] of [[667, 320], [667, 375], [844, 390], [932, 430]]) {
      await viewport(w, h);
      await page.waitForFunction(() => !StormLandscape.blocked, { polling: 50 });
      for (const tab of ['home', 'pass', 'career', 'locker', 'shop']) {
        await tabTo(tab);
        const layout = await page.evaluate(tab => {
          const p = document.getElementById(`page-${tab}`), nav = [...document.querySelectorAll('#tabs button')];
          return {
            fits: p.scrollWidth <= p.clientWidth + 1,
            nav: nav.every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight; }),
            parent: document.getElementById('stage').parentElement.id,
            settings: (() => { const r = document.getElementById('settingsBtn').getBoundingClientRect(); return r.right <= innerWidth; })()
          };
        }, tab);
        const host = { home: 'homeStage', pass: 'passStage', locker: 'lockerStage' }[tab];
        check(`${w}×${h} ${tab} : contenu et navigation sans débordement`, layout.fits && layout.nav && layout.settings && (!host || layout.parent === host), layout);
        if (tab === 'home') check(`${w}×${h} : JOUER visible sans défiler`, await page.$eval('#playBtn', e => e.getBoundingClientRect().bottom <= innerHeight));
      }
    }
    await viewport(667, 375);
    await tabTo('locker');
    const skin = await page.$$eval('#lkGrid .lk-item:not(.locked)', es => es[1].dataset.id);
    await page.$eval(`#lkGrid [data-id="${skin}"]`, e => e.scrollIntoView({ block: 'center' }));
    await page.waitForFunction(id => document.querySelector(`#lkGrid [data-id="${id}"]`).getBoundingClientRect().bottom <= innerHeight, { polling: 50 }, skin);
    await page.tap(`#lkGrid [data-id="${skin}"]`);
    check('casier : équiper une tenue au toucher', await page.$eval(`#lkGrid [data-id="${skin}"]`, e => e.classList.contains('eq')));
    await tabTo('pass');
    await page.$eval('#passTrack', e => e.scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => document.getElementById('passTrack').getBoundingClientRect().top < innerHeight, { polling: 50 });
    await page.$eval('#passTrack [data-k="free"]', e => e.scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => document.querySelector('#passTrack [data-k="free"]').getBoundingClientRect().bottom <= innerHeight, { polling: 50 });
    await page.tap('#passTrack [data-k="free"]');
    check('passe : sélectionner une récompense au toucher', await page.$eval('#passTrack [data-k="free"]', e => e.classList.contains('sel')));
    await tabTo('home');
    await page.$eval('#homeGift', el => el.scrollIntoView({ block: 'center' }));
    const beforeGift = await page.$eval('#curVal', e => e.textContent);
    await page.tap('#homeGift');
    check('cadeau du lobby accessible au toucher', await page.$eval('#curVal', e => e.textContent) !== beforeGift);
    check('actualités et défis conservés sur téléphone', await page.$eval('.home-left', e => getComputedStyle(e).display !== 'none') && await page.$eval('#quickChallenges', e => e.children.length > 0));
    await tabTo('shop');
    await page.tap('.sitem');
    const buy = await page.$eval('#buyModal .modal-box', e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; });
    check('achat : aperçu et boutons dans un dialogue adapté', buy);
    await page.$eval('#bmClose', el => el.scrollIntoView({ block: 'center' }));
    await page.tap('#bmClose');
    await page.waitForFunction(() => document.getElementById('buyModal').classList.contains('hidden'), { polling: 50 });
    await page.tap('#settingsBtn');
    await page.waitForFunction(() => !document.getElementById('settingsModal').classList.contains('hidden'), { polling: 50 });
    await page.$eval('#setName', e => e.value = '');
    await page.type('#setName', 'QA Mobile');
    await page.tap('#setSave');
    await page.waitForFunction(() => document.getElementById('settingsModal').classList.contains('hidden'), { polling: 50 });
    await tabTo('home');
    check('pseudo enregistré dans le lobby', await page.$eval('#npName', e => e.textContent) === 'QA Mobile');
    await page.$eval('#page-home', e => e.scrollTop = 0);
    await page.waitForFunction(() => {
      const r = document.getElementById('diffBtn').getBoundingClientRect();
      return r.width > 0 && r.top >= document.getElementById('topbar').getBoundingClientRect().bottom && r.bottom <= innerHeight;
    }, { polling: 50 }).catch(async e => {
      console.error('Mode layout', await page.$eval('#page-home', el => ({ page: el.getBoundingClientRect().toJSON(), scroll: el.scrollTop, active: el.className, button: document.getElementById('diffBtn').getBoundingClientRect().toJSON() })));
      throw e;
    });
    await page.tap('#diffBtn');
    await page.waitForFunction(() => !document.getElementById('modeModal').classList.contains('hidden'), { polling: 50 });
    check('choix du mode accessible', await page.$eval('#modeModal', e => !e.classList.contains('hidden')));
    await page.tap('#mpOk');
    await page.waitForFunction(() => document.getElementById('modeModal').classList.contains('hidden'), { polling: 50 });
    await page.setViewport({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.getElementById('stage').parentElement === document.body, { polling: 50 });
    check('retour bureau : scène plein écran restaurée', await page.$eval('#stage', e => e.parentElement === document.body && e.getBoundingClientRect().width === innerWidth));

    // One game instance; rAF is frozen for deterministic software-WebGL CI.
    await viewport(844, 390);
    await page.goto(`${base}/game.html?lowq`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__game?.player?.mode === 'bus', { polling: 200, timeout: 90000 });
    await page.evaluate(() => advanceTime(20));
    await page.tap('#tJump');
    await page.waitForFunction(() => __game.player.mode === 'fall', { polling: 50 });
    check('SAUT tactile quitte le bus sans verrouiller le pointeur', await page.evaluate(() => __game.player.mode === 'fall' && !document.pointerLockElement));
    await page.evaluate(() => {
      const g = __game, p = g.player;
      p.mode = 'ground'; p.pos.set(0, 9.05, 30); p.vel.set(0, 0, 0); p.grounded = true;
      p.hp = p.shield = 10000; g.setDisguise(true);
      p.slots[1] = { kind: 'weapon', id: 'ar', rarity: 2, mag: 30 }; p.cur = 1;
      p.ammo.medium = 90;
      p.cool = p.equipT = p.reloading = 0; advanceTime(20);
    });
    const hitLayout = async () => page.evaluate(() => {
      const selectors = ['#joyBase', '#bars', '#minimap', '#counts', '#mats', '#hotbar', '#ammoInfo', '#tPieces', ...[...document.querySelectorAll('.tbtn')].map(e => '#' + e.id)];
      const visible = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
      const boxes = selectors.filter(s => visible(document.querySelector(s))).map(s => ({ s, r: document.querySelector(s).getBoundingClientRect() }));
      const outside = boxes.filter(({ r }) => r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1).map(b => b.s);
      const overlap = [];
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left) > 1 && Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top) > 1) overlap.push([a.s, b.s]);
      }
      return { outside, overlap, targetSize: [...document.querySelectorAll('.tbtn, #hotbar .slot, .mat')].filter(visible).every(e => { const r = e.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; }) };
    });
    for (const [w, h] of [[667, 375], [667, 320], [844, 390], [932, 430], [844, 390]]) {
      await viewport(w, h);
      const boxes = await hitLayout();
      check(`${w}×${h} : touches, vie, carte et inventaire séparés`, !boxes.outside.length && !boxes.overlap.length && boxes.targetSize, boxes);
    }
    const cdp = await page.createCDPSession();
    const point = async (selector, id) => page.$eval(selector, (e, id) => { const r = e.getBoundingClientRect(); return { id, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }, id);
    const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
    const joy = await point('#joyBase', 1), aim = { id: 2, x: 422, y: 164 }, fire = await point('#tFire', 3);
    const initial = await page.evaluate(() => ({ pos: __game.player.pos.toArray(), camera: __game.camera.rotation.y }));
    await touch('touchStart', [joy, aim, fire]);
    await touch('touchMove', [{ ...joy, y: joy.y - 38 }, { ...aim, x: aim.x + 28 }, fire]);
    await page.waitForFunction(() => __game.mouse.l && __game.keys[__game.binds.forward], { polling: 50 });
    await page.evaluate(() => advanceTime(500));
    const moved = await page.evaluate(() => ({ pos: __game.player.pos.toArray(), camera: __game.camera.rotation.y, shooting: __game.mouse.l, mag: __game.player.slots[1].mag }));
    check('trois doigts : déplacement, caméra et tir simultanés', Math.hypot(moved.pos[0] - initial.pos[0], moved.pos[2] - initial.pos[2]) > 1 && moved.camera !== initial.camera && moved.shooting && moved.mag < 30, moved);
    await touch('touchEnd', []);
    await page.waitForFunction(() => !__game.mouse.l && !__game.keys[__game.binds.forward], { polling: 50 });
    check('relâchement : tir et déplacement arrêtés', await page.evaluate(() => !__game.mouse.l && !__game.keys[__game.binds.forward]));
    const beforeDrag = await page.evaluate(() => ({ camera: __game.camera.rotation.y, mag: __game.player.slots[1].mag }));
    await touch('touchStart', [joy, fire]);
    await touch('touchMove', [{ ...joy, y: joy.y - 38 }, { ...fire, x: fire.x - 25 }]);
    await page.waitForFunction(() => __game.mouse.l && __game.keys[__game.binds.forward], { polling: 50 });
    await page.evaluate(() => advanceTime(350));
    check('deux pouces : viser en glissant sur TIR tout en avançant', await page.evaluate(({ camera, mag }) => __game.camera.rotation.y !== camera && __game.player.slots[1].mag < mag && __game.keys[__game.binds.forward], beforeDrag));
    await touch('touchEnd', []);
    await page.tap('#tReload');
    await page.waitForFunction(() => __game.player.reloading > 0, { polling: 50 });
    check('rechargement tactile', await page.evaluate(() => __game.player.reloading > 0));
    const ads = await point('#tAds', 4);
    await touch('touchStart', [ads]);
    await page.waitForFunction(() => __game.mouse.r, { polling: 50 });
    check('visée maintenue au toucher', await page.evaluate(() => __game.mouse.r));
    await viewport(390, 844);
    await page.waitForFunction(() => StormLandscape.blocked, { polling: 50 });
    await page.waitForFunction(() => !__game.mouse.r && !__game.mouse.l && !__game.keys[__game.binds.forward], { polling: 50 });
    check('rotation : aucune visée ni touche coincée', await page.evaluate(() => !__game.mouse.r && !__game.mouse.l && !__game.keys[__game.binds.forward]));
    await touch('touchCancel', []);
    const frozen = await page.evaluate(() => { const t = __game.gameT; advanceTime(500); return t === __game.gameT; });
    check('portrait en partie : simulation suspendue derrière la consigne', frozen);
    await viewport(844, 390);
    await page.waitForFunction(() => !StormLandscape.blocked, { polling: 50 });
    const resumed = await page.evaluate(() => { const t = __game.gameT; advanceTime(20); return __game.gameT > t; });
    check('retour paysage : reprise de la simulation', resumed);
    await page.tap('#tBuild');
    await page.waitForFunction(() => document.getElementById('tPieces').classList.contains('on'), { polling: 50 });
    check('construction : les quatre pièces accessibles', await page.$eval('#tPieces', e => e.classList.contains('on') && e.children.length === 4));
    for (const piece of ['wall', 'floor', 'ramp', 'cone']) {
      await page.tap(`#tPieces [data-p=${piece}]`);
      await page.waitForFunction(piece => document.querySelector(`#tPieces [data-p=${piece}]`).classList.contains('sel'), { polling: 50 }, piece);
      check(`construction tactile : sélection ${piece}`, await page.$eval(`#tPieces [data-p=${piece}]`, e => e.classList.contains('sel')));
    }
    await page.tap('#tBuild');
    await page.waitForFunction(() => !document.getElementById('tPieces').classList.contains('on'), { polling: 50 });
    await page.tap('#tMap');
    await page.waitForFunction(() => !document.getElementById('bigmap').classList.contains('hidden'), { polling: 50 });
    check('carte : contrôles masqués et lisibles', await page.$eval('#bigmap', e => !e.classList.contains('hidden')) && await page.$eval('#touchUI', e => e.classList.contains('hidden')));
    await page.touchscreen.tap(10, 180);
    await page.waitForFunction(() => document.getElementById('bigmap').classList.contains('hidden'), { polling: 50 });
    check('fermer la carte restaure les touches', await page.$eval('#bigmap', e => e.classList.contains('hidden')) && await page.$eval('#touchUI', e => !e.classList.contains('hidden')));
    await page.tap('#tPause');
    await page.waitForFunction(() => !document.getElementById('pause').classList.contains('hidden'), { polling: 50 });
    check('pause tactile et commandes arrêtées', await page.$eval('#pause', e => !e.classList.contains('hidden')) && await page.evaluate(() => !__game.mouse.r && !__game.mouse.l));
    await page.tap('#resumeBtn');
    await page.waitForFunction(() => document.getElementById('pause').classList.contains('hidden'), { polling: 50 });
    check('reprise tactile sans pointer lock', await page.$eval('#pause', e => e.classList.contains('hidden')) && await page.evaluate(() => !document.pointerLockElement));
    await page.evaluate(() => {
      const g = __game, v = g.vehicles.find(v => v.mesh.name === 'agency-service-car');
      g.player.mode = 'ground'; g.player.pos.copy(v.pos).add(new g.THREE.Vector3(0, 0, 2.8));
      // Random floor loot otherwise correctly takes interaction priority.
      for (const item of g.loot) if (item.pos.distanceTo(v.pos) < 6) { item.alive = false; item.mesh.visible = false; }
      g.player.vel.set(0, 0, 0); g.player.grounded = true; advanceTime(20);
    });
    await page.tap('#tInteract');
    await page.waitForFunction(() => __game.player.mode === 'drive', { polling: 50 });
    const car = await page.evaluate(() => ({ mode: __game.player.mode, hidden: document.getElementById('vehicleRow').hidden, above: document.getElementById('vehicleRow').getBoundingClientRect().top < document.querySelector('.barrow:last-child').getBoundingClientRect().top, prompt: document.getElementById('prompt').textContent, occupied: !!__game.vehicles.find(v => v.mesh.name === 'agency-service-car').driver }));
    check('AGIR : entrer dans la voiture avec vie orange au-dessus du joueur', car.mode === 'drive' && !car.hidden && car.above, car);
    const driving = await hitLayout();
    check('voiture : troisième barre sans chevauchement tactile', !driving.outside.length && !driving.overlap.length, driving);
    await page.tap('#tInteract');
    await page.waitForFunction(() => __game.player.mode === 'ground', { polling: 50 });
    check('AGIR : sortir du véhicule au toucher', await page.evaluate(() => __game.player.mode === 'ground'));
    await page.evaluate(() => {
      const g = __game, p = g.player;
      p.mode = 'ground'; p.pos.set(2, 9.05, 30); p.vel.set(0, 0, 0); p.grounded = true;
      p.mats = { wood: 300, stone: 300, metal: 300 }; p.cur = 1;
      p.slots[1] = { kind: 'weapon', id: 'ar', rarity: 2, mag: 30 };
      p.slots[2] = { kind: 'weapon', id: 'shotgun', rarity: 3, mag: 5 };
      p.slots[3] = { kind: 'consum', id: 'shieldS', count: 3 };
      g.selectSlot(1); g.setCam(0, -.1); advanceTime(500);
    });
    check('photo : carte en haut gauche, vie en bas gauche, objets en bas', await page.evaluate(() => {
      const r = id => document.getElementById(id).getBoundingClientRect();
      return r('minimap').left < 30 && r('minimap').top < 30 && r('bars').bottom > innerHeight - 30 &&
        r('bars').left < 30 && r('hotbar').bottom > innerHeight - 30 && r('tJump').bottom < r('tFire').bottom &&
        r('tFire').left > innerWidth * .7;
    }));
    check('toutes les commandes réelles présentes', await page.evaluate(() => ['tSprint','tMarker','tShoulder','tEmote','tBag','tRotate','tMaterial','tEditReset','tEditCancel'].every(id => document.getElementById(id)?.getAttribute('aria-label'))));
    await page.tap('#tSprint');
    check('COURIR : activation explicite', await page.$eval('#tSprint', e => e.getAttribute('aria-pressed') === 'true'));
    await page.tap('#tSprint');
    check('COURIR : désactivation sans touche bloquée', await page.$eval('#tSprint', e => e.getAttribute('aria-pressed') === 'false') && await page.evaluate(() => !__game.keys[__game.binds.sprint]));
    await page.tap('#tMarker');
    check('MARQUER : vrai repère dans le monde', await page.evaluate(() => JSON.parse(render_game_to_text()).marker.on));
    await page.tap('#tMarker');
    check('MARQUER : second toucher retire le repère', await page.evaluate(() => !JSON.parse(render_game_to_text()).marker.on));
    const shoulder = await page.evaluate(() => JSON.parse(render_game_to_text()).shoulder);
    await page.tap('#tShoulder');
    check('ÉPAULE : changement réel de côté', await page.evaluate(v => JSON.parse(render_game_to_text()).shoulder === -v, shoulder));
    await page.tap('#tShoulder');
    check('ÉPAULE : retour au côté initial', await page.evaluate(v => JSON.parse(render_game_to_text()).shoulder === v, shoulder));
    await page.tap('#tEmote');
    check('EMOTE : lancer une animation', await page.evaluate(() => !!__game.player.emoting));
    await page.tap('#tEmote');
    check('EMOTE : arrêter une animation', await page.evaluate(() => !__game.player.emoting));
    await page.tap('#tBag');
    check('SAC : six objets, dialogue et commandes de jeu masquées', await page.evaluate(() => !document.getElementById('touchInventory').hidden && document.querySelectorAll('[data-invslot]').length === 6 && document.getElementById('touchUI').classList.contains('hidden')));
    check('SAC : simulation vraiment en pause', await page.evaluate(() => { const t = __game.gameT; advanceTime(500); return __game.gameT === t; }));
    await page.tap('[data-invslot="2"]');
    check('SAC : sélectionner un objet', await page.evaluate(() => __game.player.cur === 2 && document.querySelector('[data-invslot="2"]').getAttribute('aria-pressed') === 'true'));
    await page.tap('#touchBagEquip');
    check('SAC : équiper et reprendre', await page.evaluate(() => { const t = __game.gameT; advanceTime(20); return document.getElementById('touchInventory').hidden && __game.gameT > t && __game.player.cur === 2; }));
    await page.tap('#tBag');
    const lootCount = await page.evaluate(() => __game.loot.length);
    await page.tap('#touchBagDrop');
    check('SAC : dépôt réel au sol sans perdre la pioche', await page.evaluate(n => !__game.player.slots[2] && __game.player.cur === 0 && __game.loot.length === n + 1 && __game.loot.at(-1).item.id === 'shotgun' && __game.player.slots[0].id === 'pickaxe', lootCount));
    check('SAC : pioche protégée par un bouton désactivé', await page.$eval('#touchBagDrop', e => e.disabled));
    await page.keyboard.press('Tab');
    check('SAC : focus clavier reste dans le dialogue', await page.evaluate(() => document.getElementById('touchInventory').contains(document.activeElement)));
    await page.tap('#touchBagClose');
    await page.tap('#hotbar .slot:nth-child(2)');
    check('inventaire rapide : vrais boutons accessibles et sélection', await page.evaluate(() => __game.player.cur === 1 && document.querySelector('#hotbar .slot:nth-child(2)').getAttribute('aria-pressed') === 'true'));
    await page.focus('#hotbar .slot:first-child'); await page.keyboard.press('Enter');
    check('inventaire rapide : activation clavier native', await page.evaluate(() => __game.player.cur === 0));
    await page.tap('#hotbar .slot:nth-child(2)');
    await page.tap('#tBuild');
    await page.tap('#tPieces [data-p=ramp]');
    const rotation = await page.evaluate(() => JSON.parse(render_game_to_text()).build.rotation);
    await page.tap('#tRotate');
    check('PIVOT : rotation de la rampe', await page.evaluate(r => JSON.parse(render_game_to_text()).build.rotation === (r + 1) % 4, rotation));
    for (let i = 0; i < 3; i++) await page.tap('#tRotate');
    check('PIVOT : cycle complet', await page.evaluate(r => JSON.parse(render_game_to_text()).build.rotation === r, rotation));
    const material = await page.evaluate(() => __game.player.matSel);
    await page.tap('#tMaterial');
    check('MATÉRIAU : changer vraiment de ressource', await page.evaluate(m => __game.player.matSel !== m, material));
    await page.tap('#tMaterial'); await page.tap('#tMaterial');
    check('MATÉRIAU : revenir à la ressource initiale', await page.evaluate(m => __game.player.matSel === m, material));
    for (const [w,h] of [[667,320],[844,390]]) {
      await viewport(w,h); await page.evaluate(() => advanceTime(20));
      const boxes = await hitLayout();
      check(`${w}×${h} : construction sans collision avec les objets ou boutons`, !boxes.outside.length && !boxes.overlap.length && boxes.targetSize, boxes);
    }
    await page.tap('#tBuild');
    await page.evaluate(() => {
      const g = __game, p = g.player;
      p.pos.set(2,9.05,20); p.vel.set(0,0,0); p.grounded = true; g.setCam(0,0);
      g.placeBuild(p,'wall',0,4,8,0,'wood'); advanceTime(1100);
      window.qaEditCol = [...g.builds.values()].find(c => c.ptype === 'wall' && c.owner === p);
      // Stage a visible owned wall; all editing actions below use real taps.
      g.camera.position.set(2,10,20); g.camera.lookAt(2,10,16); g.camera.updateMatrixWorld(); g.scene.updateMatrixWorld(true);
    });
    await page.tap('#tEdit');
    check('MODIF. : ouvrir une vraie construction', await page.evaluate(() => !!__game.editing && document.getElementById('tEdit').textContent.includes('VALIDER')));
    const editFire = await point('#tFire', 8);
    await touch('touchStart',[editFire]); await page.evaluate(() => advanceTime(50)); await touch('touchEnd',[]);
    check('CHOISIR : sélectionner des cases au toucher', await page.evaluate(() => __game.editing.mask > 0));
    await page.tap('#tEditReset');
    check('RÉINIT. : effacer les cases sélectionnées', await page.evaluate(() => __game.editing.mask === 0));
    await page.tap('#tEditCancel');
    check('ANNULER : sortir sans changer le mur', await page.evaluate(() => !__game.editing && qaEditCol.editMask === 0));
    await page.evaluate(() => { __game.camera.position.set(2,10,20); __game.camera.lookAt(2,10,16); __game.camera.updateMatrixWorld(); __game.scene.updateMatrixWorld(true); });
    await page.tap('#tEdit');
    await touch('touchStart',[editFire]); await page.evaluate(() => advanceTime(50)); await touch('touchEnd',[]);
    await page.tap('#tEdit');
    check('VALIDER : modification appliquée au mur', await page.evaluate(() => !__game.editing && qaEditCol.editMask > 0));
    await viewport(667,320);
    await page.evaluate(() => {
      document.body.style.setProperty('--touch-left','47px');
      document.body.style.setProperty('--touch-right','47px');
      document.body.style.setProperty('--touch-low','34px');
      advanceTime(20);
    });
    const notched = await hitLayout();
    check('petit paysage avec encoches : vie, armes et touches séparées', !notched.outside.length && !notched.overlap.length && notched.targetSize, notched);
    await page.evaluate(() => ['--touch-left','--touch-right','--touch-low'].forEach(k => document.body.style.removeProperty(k)));
    await viewport(844,390);
    // Exercise the native API contract without pretending this desktop browser
    // is real phone hardware. Only fullscreen/orientation services are stubbed.
    const native = await browser.newPage();
    native.on('pageerror', e => errors.push(e.message));
    await native.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await native.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><body></body>');
    await native.evaluate(() => {
      window.calls = [];
      document.documentElement.requestFullscreen = async () => { calls.push('fullscreen'); };
      Object.defineProperty(screen.orientation, 'lock', { configurable: true, writable: true, value: async mode => { calls.push(mode); } });
    });
    await native.addScriptTag({ url: base + '/js/landscape.js' });
    await native.tap('#landscapeActivate');
    await native.waitForFunction(() => calls.length === 2, { polling: 50 });
    check('API native : plein écran demandé avant verrouillage paysage', await native.evaluate(() => calls.join(',') === 'fullscreen,landscape'));
    await native.evaluate(() => {
      document.documentElement.requestFullscreen = async () => { throw new Error('Fullscreen refused'); };
      screen.orientation.lock = async () => { throw new Error('Orientation refused'); };
    });
    await native.tap('#landscapeActivate');
    await native.waitForFunction(() => !document.getElementById('landscapeActivate').disabled, { polling: 50 });
    check('API refusée : consigne manuelle et bouton toujours utilisable', await native.evaluate(() => StormLandscape.blocked && document.getElementById('landscapeStatus').textContent.includes('verrouillage')));
    await native.close();
    check('aucune nouvelle erreur JavaScript', errors.length === 0, errors);
    console.log(`\n${count} contrôles mobiles réussis.`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
