// STORMDROP lobby: stage, battle pass, challenges, locker, shop, match launcher
import * as THREE from 'three';
import { createOutline } from './outline.js';
import { loadSettings, saveSettings, settingsForm } from './settings.js';
import { initAudio, playMusic, stopMusic, setVolumes, sfx } from './audio.js';
import { RARITIES, SKINS, BACKPACKS, PICKAXES, GLIDERS, EMOTES, CATS, DEFAULT_LOADOUT, makeCharMesh, makePickaxe, makeGlider, poseEmote, poseIdle, mat } from './cosmetics.js';

const $ = (id) => document.getElementById(id);
const XP_PER_LEVEL = 1500;
const MAX_TIER = 30;

// ---------------------------------------------------------------------------
// Player profile (kept in memory for this page session)
// ---------------------------------------------------------------------------
const S = {
  name: 'Tim', eclats: 1200, level: 1, xp: 0, passOwned: false, sens: 1, diff: 'normal', mode: 'solo', players: 50, party: [],
  settings: loadSettings(),
  owned: new Set(['skin:recrue', 'skin:recrue2', 'backpack:none', 'backpack:sac', 'pickaxe:default', 'glider:default', 'emote:danse', 'emote:salut']),
  fresh: new Set(),
  loadout: { ...DEFAULT_LOADOUT },
  claimed: new Set(),
  giftDay: null,
  career: { matches: 0, wins: 0, kills: 0, top10: 0, damage: 0, time: 0, best: 99, chests: 0, supply: 0, harvested: 0, builds: 0, headshots: 0 },
  prog: {},
  doneCh: new Set(),
  last: null,
};

// Battle pass rewards: tier -> { free, prem }
const R = (cat, id) => ({ cat, id });
const E = (n) => ({ cat: 'eclats', amount: n });
const PASS = {
  1: { prem: R('skin', 'brutus') }, 2: { free: E(100) }, 3: { prem: R('backpack', 'cape') }, 4: { free: R('emote', 'robot') },
  5: { prem: R('pickaxe', 'sucre') }, 6: { free: R('glider', 'nuage') }, 7: { prem: E(100) }, 8: { free: E(100), prem: R('skin', 'tntina') },
  9: { prem: R('glider', 'aigle') }, 10: { free: R('skin', 'jardin') }, 11: { prem: R('emote', 'flex') }, 12: { free: R('pickaxe', 'hache') },
  13: { prem: E(100) }, 14: { free: E(100) }, 15: { prem: R('skin', 'meowscles') }, 16: { free: R('backpack', 'carapace') },
  17: { prem: R('backpack', 'fusee') }, 18: { free: E(100) }, 19: { prem: R('pickaxe', 'marteau') }, 20: { free: R('skin', 'surf') },
  21: { prem: E(100) }, 22: { free: E(100), prem: R('skin', 'skye') }, 23: { prem: R('glider', 'neon') }, 24: { free: E(200) },
  25: { prem: R('skin', 'ombre') }, 26: { prem: E(300) }, 27: { prem: R('emote', 'fil') }, 28: { free: E(200), prem: R('glider', 'dragon') },
  29: { prem: R('backpack', 'ailesdragon') }, 30: { prem: R('skin', 'midas') },
};
const PASS_ITEMS = new Set();
for (const t in PASS) for (const k of ['free', 'prem']) { const r = PASS[t][k]; if (r && r.cat !== 'eclats') PASS_ITEMS.add(r.cat + ':' + r.id); }

// Shop pool (everything not in the pass and not default)
const PRICE = {
  skin: { uncommon: 800, rare: 1200, epic: 1500, legendary: 2000 },
  backpack: { uncommon: 400, rare: 800, epic: 1200, legendary: 1500 },
  pickaxe: { uncommon: 500, rare: 800, epic: 1200, legendary: 1500 },
  glider: { uncommon: 500, rare: 800, epic: 1200, legendary: 1500 },
  emote: { uncommon: 300, rare: 500, epic: 800, legendary: 800 },
};
const SHOP_POOL = [];
for (const cat in CATS) for (const id in CATS[cat].items) {
  const key = cat + ':' + id, it = CATS[cat].items[id];
  if (PASS_ITEMS.has(key) || S.owned.has(key) || it.rarity === 'common') continue;
  SHOP_POOL.push({ cat, id, price: PRICE[cat][it.rarity] || 800 });
}
const TYPE_NAME = { skin: 'Tenue', backpack: 'Sac à dos', pickaxe: 'Pioche', glider: 'Planeur', emote: 'Emote', eclats: 'Éclats' };

// Challenges
const DAILY = [
  { id: 'd_chests', name: 'Ouvre des coffres', stat: 'chests', goal: 5, xp: 1500 },
  { id: 'd_kills', name: 'Élimine des adversaires', stat: 'kills', goal: 3, xp: 1500 },
  { id: 'd_harvest', name: 'Récolte des matériaux', stat: 'harvested', goal: 300, xp: 1200 },
];
const WEEKLY = [
  { id: 'w_damage', name: 'Inflige des dégâts aux adversaires', stat: 'damage', goal: 2000, xp: 3000 },
  { id: 'w_builds', name: 'Construis des éléments', stat: 'builds', goal: 100, xp: 2500 },
  { id: 'w_top10', name: 'Termine dans le top 10', stat: 'top10', goal: 3, xp: 3000 },
  { id: 'w_win', name: 'Remporte une partie', stat: 'wins', goal: 1, xp: 5000 },
  { id: 'w_supply', name: 'Ouvre des largages de ravitaillement', stat: 'supply', goal: 2, xp: 2500 },
  { id: 'w_heads', name: 'Réalise des tirs à la tête', stat: 'headshots', goal: 10, xp: 2500 },
  { id: 'w_survive', name: 'Survis au total (minutes)', stat: 'minutes', goal: 30, xp: 3000 },
];
for (const c of [...DAILY, ...WEEKLY]) S.prog[c.id] = 0;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function itemOf(cat, id) { return CATS[cat] && CATS[cat].items[id]; }
function rarityOf(cat, id) { const it = itemOf(cat, id); return it ? it.rarity : 'rare'; }
function fmt(n) { return Math.round(n).toLocaleString('fr-FR'); }
let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400); }
function rarBadge(el, r) { const R = RARITIES[r]; el.textContent = R.name.toUpperCase(); el.style.background = R.color; el.style.color = r === 'common' ? '#12123a' : '#fff'; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function seeded(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function untilMidnight() {
  const d = new Date(), m = new Date(d); m.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((m - d) / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
const LOCK_SVG = '<svg viewBox="0 0 24 24"><path fill="#fff" d="M17 9V7A5 5 0 0 0 7 7v2H5v13h14V9zm-8 0V7a3 3 0 0 1 6 0v2z"/></svg>';

// ---------------------------------------------------------------------------
// Thumbnails (rendered once per item with an offscreen renderer)
// ---------------------------------------------------------------------------
const thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
thumbR.setSize(256, 256, false); thumbR.setPixelRatio(1);
thumbR.outputColorSpace = THREE.SRGBColorSpace;
const thumbScene = new THREE.Scene();
thumbScene.add(new THREE.HemisphereLight(0xffffff, 0x6a6aa0, 1.4));
const tl = new THREE.DirectionalLight(0xffffff, 1.6); tl.position.set(3, 5, -6); thumbScene.add(tl);
const thumbCam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
const thumbCache = new Map();
function thumb(cat, id) {
  const key = cat + ':' + id;
  if (thumbCache.has(key)) return thumbCache.get(key);
  const g = new THREE.Group();
  let camPos = [0, 1.25, -5.2], look = [0, 1.05, 0];
  if (cat === 'skin') { const m = makeCharMesh({ skin: id, backpack: 'none' }); poseIdle(m, 0.4); m.group.rotation.y = 0.35; g.add(m.group); }
  else if (cat === 'backpack') {
    if (id === 'none') { const s = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 8, 24), mat(0xffffff)); s.position.y = 1.2; g.add(s); const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.4), mat(0xffd23f)); b.position.set(0, 0.36, 0.32); g.add(b); }
    else { const m = makeCharMesh({ skin: 'recrue', backpack: id }); m.group.rotation.y = Math.PI + 0.6; m.group.traverse((o) => { if (o.isMesh && o.parent !== m.torso && !['cristal'].includes(id)) o.castShadow = true; }); g.add(m.group); }
  } else if (cat === 'pickaxe') { const w = new THREE.Group(); const p = makePickaxe(id); p.rotation.x = Math.PI / 2; p.position.y = -0.25; w.add(p); w.rotation.z = 0.6; w.scale.setScalar(1.5); w.position.y = 0.1; g.add(w); }
  else if (cat === 'glider') { const gl = makeGlider(id); gl.rotation.set(-0.5, 0.3, 0); gl.position.set(0, -1.6, 0); g.add(gl); camPos = [0, 2.2, -7.5]; look = [0, 0.6, 0]; }
  else if (cat === 'emote') { const m = makeCharMesh({ skin: 'recrue2', backpack: 'none' }); const y = poseEmote(m, id, { danse: 0.2, salut: 0.15, robot: 0.3, flex: 0.1, disco: 0.15, fil: 0.1 }[id] || 0.2); m.group.position.y = y; m.group.rotation.y = 0.35; g.add(m.group); }
  thumbScene.add(g);
  thumbCam.position.set(...camPos); thumbCam.lookAt(...look);
  thumbR.render(thumbScene, thumbCam);
  const url = thumbR.domElement.toDataURL('image/png');
  thumbScene.remove(g);
  thumbCache.set(key, url);
  return url;
}
function rewardHTML(r, cls = '') {
  if (!r) return `<div class="reward empty ${cls}"></div>`;
  if (r.cat === 'eclats') return `<div class="reward r-eclats ${cls}"><div class="eclats-art"><i class="coin"></i><b>${r.amount}</b></div><div class="rw-label">${r.amount} Éclats</div></div>`;
  const it = itemOf(r.cat, r.id);
  return `<div class="reward r-${it.rarity} ${cls}"><img alt="" src="${thumb(r.cat, r.id)}"><div class="rw-label">${it.name}</div></div>`;
}

// ---------------------------------------------------------------------------
// 3D stage
// ---------------------------------------------------------------------------
const canvas = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
renderer.setClearColor(0x000000, 0);
const stageOutline = createOutline(renderer, { alpha: true, width: 2, fadeNear: 40, fadeFar: 120, strength: 0.95 });
scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x3b2a9e, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(-3, 6, -5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 4; key.shadow.camera.bottom = -2; scene.add(key);
const rim = new THREE.DirectionalLight(0x8fd8ff, 1.6); rim.position.set(4, 3, 5); scene.add(rim);
const fill = new THREE.PointLight(0xffb0ff, 2, 8); fill.position.set(2.5, 1.5, -2); scene.add(fill);

// platform
const plat = new THREE.Group(); scene.add(plat);
const pd = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.22, 48), new THREE.MeshStandardMaterial({ color: 0x2a3a9e, roughness: 0.5, metalness: 0.2 }));
pd.position.y = -0.11; pd.receiveShadow = true; plat.add(pd);
const ringMat = new THREE.MeshBasicMaterial({ color: 0x8fe6ff, transparent: true, opacity: 0.9 });
const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.035, 8, 64), ringMat); ring.rotation.x = Math.PI / 2; ring.position.y = 0.0; plat.add(ring);
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
glow.rotation.x = -Math.PI / 2; glow.position.y = 0.01; plat.add(glow);
const top = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), new THREE.MeshStandardMaterial({ color: 0x3550d0, roughness: 0.6 })); top.rotation.x = -Math.PI / 2; top.position.y = 0.002; top.receiveShadow = true; plat.add(top);
// floating sparkles
const sparkGeo = new THREE.BufferGeometry(); const SP = 70; const sp = new Float32Array(SP * 3);
for (let i = 0; i < SP; i++) { const a = Math.random() * 6.28, r = 1 + Math.random() * 3; sp[i * 3] = Math.cos(a) * r; sp[i * 3 + 1] = Math.random() * 3.5; sp[i * 3 + 2] = Math.sin(a) * r + 1; }
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xcff4ff, size: 0.07, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(sparks);

let charM = null, charYaw = 0, emoteT = -1, emoteId = null, heldPick = null;
function buildChar() {
  if (charM) plat.remove(charM.group);
  charM = makeCharMesh(S.loadout);
  plat.add(charM.group);
  heldPick = makePickaxe(S.loadout.pickaxe); heldPick.visible = false; charM.hand.add(heldPick);
  charM.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
}
function playEmote(id) { emoteId = id; emoteT = 0; }
let previewMode = null; // 'pickaxe' | 'glider'
// camera placement per tab: [charScreenX offset (world units), cam distance, look height]
const VIEWS = { home: { x: 0, d: 9.2, h: 1.2 }, pass: { x: -1.2, d: 11, h: 0.5 }, challenges: { x: 0, d: 9, h: 1.1 }, career: { x: 0, d: 9, h: 1.1 }, locker: { x: -1.5, d: 9.5, h: 1.1 }, shop: { x: 0, d: 9, h: 1.1 } };
let view = { ...VIEWS.home }, viewT = VIEWS.home, curTab = 'home';
let dragging = false, lastX = 0, spinV = 0;
canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; });
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; charYaw += dx * 0.012; spinV = dx * 0.012; });
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

// passPreviewObj: when viewing a battle pass reward we show it on the stage
let stageItem = null;
function showStageItem(r) {
  if (stageItem) { plat.remove(stageItem); stageItem = null; }
  if (charM) charM.group.visible = true;
  if (!r || r.cat === 'eclats' || r.cat === 'skin' || r.cat === 'backpack' || r.cat === 'emote') {
    if (r && (r.cat === 'skin' || r.cat === 'backpack')) {
      plat.remove(charM.group); charM = makeCharMesh({ ...S.loadout, [r.cat]: r.id }); plat.add(charM.group);
      heldPick = makePickaxe(S.loadout.pickaxe); heldPick.visible = false; charM.hand.add(heldPick);
      if (r.cat === 'backpack') charYaw = Math.PI * 0.8;
    }
    if (r && r.cat === 'emote') playEmote(r.id);
    return;
  }
  if (r.cat === 'pickaxe') { stageItem = new THREE.Group(); const pk = makePickaxe(r.id); pk.rotation.x = Math.PI / 2; pk.position.y = -0.25; const w = new THREE.Group(); w.add(pk); w.rotation.z = 0.4; stageItem.add(w); }
  if (r.cat === 'glider') { stageItem = makeGlider(r.id); stageItem.position.set(0, -1.4, 0); stageItem.scale.setScalar(0.85); }
  charM.group.visible = false; plat.add(stageItem);
}
function resetStage() { if (stageItem) { plat.remove(stageItem); stageItem = null; } buildChar(); }

let running = true, lastT = performance.now(), clockT = 0;
function loop() {
  if (!running) return;
  requestAnimationFrame(loop);
  const now = performance.now(); const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; clockT += dt;
  // camera
  view.x += (viewT.x - view.x) * Math.min(1, dt * 6); view.d += (viewT.d - view.d) * Math.min(1, dt * 6); view.h += (viewT.h - view.h) * Math.min(1, dt * 6);
  camera.position.set(-view.x, view.h + 0.35, -view.d); camera.lookAt(-view.x, view.h, 0);
  plat.position.set(0, 0, 0);
  // character
  if (!dragging) { spinV *= 0.92; charYaw += spinV; }
  if (charM) {
    let y;
    if (emoteT >= 0) {
      emoteT += dt; heldPick.visible = false; y = poseEmote(charM, emoteId, emoteT);
      if (emoteT > 5) emoteT = -1;
    } else if (previewMode === 'pickaxe') {
      y = poseIdle(charM, clockT); heldPick.visible = true; charM.shR.rotation.set(0.6 + Math.sin(clockT * 2) * 0.1, 0, 0.1);
    } else { y = poseIdle(charM, clockT); heldPick.visible = false; }
    charM.group.position.y = y;
    charM.group.rotation.y = charYaw;
    charM.torso.traverse((o) => { if (o.userData.float) o.position.y = 0.55 + Math.sin(clockT * 2) * 0.06; });
  }
  if (stageItem) stageItem.rotation.y += dt * 0.6;
  ring.material.opacity = 0.6 + Math.sin(clockT * 2) * 0.3;
  sparks.rotation.y += dt * 0.05;
  const pa = sparkGeo.attributes.position; for (let i = 0; i < SP; i++) { let yy = pa.getY(i) + dt * 0.25; if (yy > 3.6) yy = 0; pa.setY(i, yy); } pa.needsUpdate = true;
  stageOutline.enabled = !!S.settings.outline; stageOutline.width = 2 * (S.settings.outlineW || 1);
  stageOutline.render(scene, camera);
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------
function grantItem(cat, id) { const k = cat + ':' + id; if (!S.owned.has(k)) { S.owned.add(k); S.fresh.add(k); } }
function unlockTiers() {
  const got = [];
  for (let t = 1; t <= Math.min(S.level, MAX_TIER); t++) {
    for (const k of ['free', 'prem']) {
      const r = PASS[t] && PASS[t][k]; if (!r) continue;
      if (k === 'prem' && !S.passOwned) continue;
      const ck = t + k; if (S.claimed.has(ck)) continue;
      S.claimed.add(ck);
      if (r.cat === 'eclats') S.eclats += r.amount; else grantItem(r.cat, r.id);
      got.push(r);
    }
  }
  return got;
}
function addXP(n) {
  const before = S.level;
  S.xp += n;
  while (S.xp >= XP_PER_LEVEL) { S.xp -= XP_PER_LEVEL; S.level++; }
  return { levels: S.level - before, rewards: unlockTiers() };
}
function updateTopbar() {
  $('curVal').textContent = fmt(S.eclats);
  $('lvlNum').textContent = S.level; $('npLvl').textContent = S.level; $('npName').textContent = S.name;
  $('lvlFill').style.width = (S.xp / XP_PER_LEVEL * 100) + '%';
  const lockerTab = document.querySelector('[data-tab=locker]');
  lockerTab.querySelector('.dot')?.remove();
  if (S.fresh.size) lockerTab.insertAdjacentHTML('beforeend', '<i class="dot"></i>');
  $('diffLabel').textContent = { facile: 'Facile', normal: 'Normal', difficile: 'Difficile' }[S.diff];
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
function setTab(t) {
  curTab = t; document.body.dataset.tab = t;
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
  document.querySelectorAll('.page').forEach((p) => p.classList.toggle('on', p.id === 'page-' + t));
  viewT = VIEWS[t] || VIEWS.home;
  canvas.style.visibility = t === 'shop' || t === 'challenges' || t === 'career' ? 'hidden' : 'visible';
  previewMode = null; resetStage(); charYaw = 0;
  if (t === 'home') renderHome();
  if (t === 'pass') renderPass();
  if (t === 'challenges') renderChallenges();
  if (t === 'career') renderCareer();
  if (t === 'locker') renderLocker();
  if (t === 'shop') renderShop();
}
document.querySelectorAll('#tabs button').forEach((b) => b.onclick = () => setTab(b.dataset.tab));

// HOME -----------------------------------------------------------------------
function chalHTML(c, compact) {
  const v = Math.min(c.goal, Math.floor(S.prog[c.id])), done = S.doneCh.has(c.id);
  if (compact) return `<div class="qc ${done ? 'done' : ''}"><div class="qc-top"><span>${c.name}</span><b>${done ? 'TERMINÉ' : fmt(c.xp) + ' XP'}</b></div><div class="bar"><i style="width:${v / c.goal * 100}%"></i></div></div>`;
  return `<div class="chal ${done ? 'done' : ''}"><div class="chal-main"><div class="chal-name">${c.name}</div><div class="chal-prog">${fmt(v)} / ${fmt(c.goal)}</div><div class="bar"><i style="width:${v / c.goal * 100}%"></i></div></div><div class="chal-xp">${done ? 'TERMINÉ ✓' : '+' + fmt(c.xp) + ' XP'}</div></div>`;
}
function renderHome() {
  $('quickChallenges').innerHTML = DAILY.map((c) => chalHTML(c, true)).join('');
  const L = S.last, lm = $('lastMatch');
  if (L) { lm.classList.remove('hidden'); lm.innerHTML = `DERNIÈRE PARTIE<br><b>${L.won ? 'VICTOIRE ROYALE' : 'Top ' + L.placement}</b> · ${L.kills} élim. · +${fmt(L.xp)} XP`; }
  drawModeArt();
}
function drawModeArt() {
  const c = $('modeArt'), g = c.getContext('2d'), W = c.width, H = c.height;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#5cc8ff'); gr.addColorStop(1, '#2a6fd6'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(160,90,255,.35)'; g.beginPath(); g.arc(W * 0.5, H * 0.75, 190, 0, 7); g.arc(W * 0.5, H * 0.75, 130, 0, 7, true); g.fill();
  g.fillStyle = '#e8d38a'; g.beginPath(); g.ellipse(W * 0.5, H * 0.78, 120, 42, 0, 0, 7); g.fill();
  g.fillStyle = '#5fbf4a'; g.beginPath(); g.ellipse(W * 0.5, H * 0.74, 106, 34, 0, 0, 7); g.fill();
  g.fillStyle = '#3f9a3a'; for (let i = 0; i < 9; i++) { const x = W * 0.5 - 80 + i * 20, y = H * 0.7 + Math.sin(i) * 6; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x - 7, y); g.lineTo(x + 7, y); g.closePath(); g.fill(); }
  g.fillStyle = '#d96a3a'; g.fillRect(W * 0.5 + 24, H * 0.62, 18, 12); g.fillStyle = '#8a3a2a'; g.beginPath(); g.moveTo(W * 0.5 + 21, H * 0.62); g.lineTo(W * 0.5 + 33, H * 0.55); g.lineTo(W * 0.5 + 45, H * 0.62); g.fill();
  // bus
  g.fillStyle = '#3fa9ff'; g.fillRect(40, 22, 46, 16); g.fillStyle = '#ffd23f'; g.fillRect(40, 18, 46, 6);
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(90, 30); g.lineTo(W - 20, 60); g.stroke(); g.setLineDash([]);
}


// PASS -----------------------------------------------------------------------
let passSel = null;
function renderPass() {
  const tr = $('passTrack');
  let h = '';
  for (let t = 1; t <= MAX_TIER; t++) {
    const P = PASS[t] || {};
    const cell = (k) => {
      const r = P[k]; if (!r) return rewardHTML(null);
      const unlocked = S.level >= t && (k === 'free' || S.passOwned);
      const cls = `${k === 'prem' ? 'prem' : ''} ${unlocked ? '' : 'locked'} ${passSel && passSel.t === t && passSel.k === k ? 'sel' : ''}`;
      return rewardHTML(r, cls).replace('class="reward', `data-t="${t}" data-k="${k}" class="reward`).replace('</div></div>', '</div>' + (unlocked ? '<i class="check">✓</i>' : `<i class="lock">${LOCK_SVG}</i></div>`));
    };
    h += `<div class="tier ${S.level === t ? 'cur' : ''}"><div class="row-tag">${t === 1 ? 'PREMIUM' : '&nbsp;'}</div>${cell('prem')}${cell('free')}<div class="row-tag">${t === 1 ? 'GRATUIT' : '&nbsp;'}</div></div>`;
  }
  tr.innerHTML = h;
  tr.querySelectorAll('.reward[data-t]').forEach((el) => el.onclick = () => { passSel = { t: +el.dataset.t, k: el.dataset.k }; renderPass(); });
  if (!passSel) passSel = { t: 1, k: 'prem' };
  const r = PASS[passSel.t][passSel.k];
  const pp = $('passPreview');
  if (r.cat === 'eclats') pp.innerHTML = `<span class="pp-rar" style="background:#3fa9ff">MONNAIE</span><div class="pp-name">${r.amount} Éclats</div><div class="pp-type">Utilisables dans la boutique</div>`;
  else { const it = itemOf(r.cat, r.id), RR = RARITIES[it.rarity]; pp.innerHTML = `<span class="pp-rar" style="background:${RR.color}">${RR.name.toUpperCase()}</span><div class="pp-name">${it.name}</div><div class="pp-type">${TYPE_NAME[r.cat]}</div>`; }
  showStageItem(r);
  const pb = $('passBuy');
  pb.classList.toggle('owned', S.passOwned);
  pb.querySelector('.pb-title').textContent = S.passOwned ? 'PASSE PREMIUM ACTIF' : 'PASSE PREMIUM';
  $('passBuyBtn').style.display = S.passOwned ? 'none' : '';
  // keep current tier visible
  const cur = tr.children[Math.max(0, Math.min(MAX_TIER, S.level) - 3)];
  if (cur && !renderPass.scrolled) { tr.scrollLeft = cur.offsetLeft - tr.offsetLeft; renderPass.scrolled = true; }
}
$('ptL').onclick = () => { $('passTrack').scrollLeft -= 600; };
$('ptR').onclick = () => { $('passTrack').scrollLeft += 600; };
$('passBuyBtn').onclick = () => {
  if (S.passOwned) return;
  if (S.eclats < 950) { toast('Pas assez d’Éclats'); return; }
  S.eclats -= 950; S.passOwned = true;
  const got = unlockTiers();
  updateTopbar(); renderPass();
  toast(`Passe premium débloqué · ${got.length} récompense${got.length > 1 ? 's' : ''} obtenue${got.length > 1 ? 's' : ''}`);
};

// CHALLENGES (accueil) --------------------------------------------------------
function renderChallenges() { /* page défis supprimée : les 3 défis du jour restent sur l'accueil */ }

// CAREER : tableau de statistiques détaillées ---------------------------------
function renderCareer() {
  const C = S.career;
  const mins = Math.floor(C.time / 60);
  const timeTxt = mins >= 60 ? Math.floor(mins / 60) + ' h ' + String(mins % 60).padStart(2, '0') : mins + ' min';
  const perMatch = (v) => C.matches ? (Math.round(v / C.matches * 10) / 10).toLocaleString('fr-FR') : '—';
  const pct = (v) => C.matches ? Math.round(v / C.matches * 100) + ' %' : '—';
  const deaths = Math.max(0, C.matches - C.wins);
  $('crLvl').textContent = S.level; $('crName').textContent = S.name; $('crWins').textContent = C.wins;
  const put = (id, rows) => { const el = $(id); if (el) el.innerHTML = rows.map(([a, b]) => `<div class="stat"><span>${a}</span><b>${b}</b></div>`).join(''); };
  put('careerStats', [
    ['Parties jouées', C.matches], ['Victoires royales', C.wins], ['Taux de victoire', pct(C.wins)],
    ['Top 10', C.top10], ['Taux de Top 10', pct(C.top10)], ['Meilleur classement', C.best < 99 ? '#' + C.best : '—'],
    ['Temps de jeu', timeTxt], ['Niveau du passe', S.level],
  ]);
  put('careerCombat', [
    ['Éliminations', C.kills], ['Élim. par partie', perMatch(C.kills)], ['Ratio élim. / mort', deaths ? (Math.round(C.kills / deaths * 100) / 100).toLocaleString('fr-FR') : (C.kills ? '∞' : '—')],
    ['Dégâts infligés', fmt(C.damage)], ['Dégâts par partie', perMatch(C.damage)], ['Tirs à la tête', C.headshots],
  ]);
  put('careerLoot', [
    ['Coffres ouverts', C.chests], ['Largages ouverts', C.supply], ['Matériaux récoltés', fmt(C.harvested)], ['Constructions', C.builds],
  ]);
}

// LOCKER ---------------------------------------------------------------------
let lkCat = 'skin';
function renderLocker() {
  $('lkSlots').innerHTML = Object.keys(CATS).map((c) => {
    const id = S.loadout[c], r = rarityOf(c, id);
    return `<div class="lk-slot r-${r} ${c === lkCat ? 'on' : ''}" data-c="${c}"><img alt="" src="${thumb(c, id)}"><span>${CATS[c].name.toUpperCase()}</span></div>`;
  }).join('');
  $('lkSlots').querySelectorAll('.lk-slot').forEach((el) => el.onclick = () => { lkCat = el.dataset.c; renderLocker(); });
  $('lkTitle').textContent = CATS[lkCat].name.toUpperCase();
  const ids = Object.keys(CATS[lkCat].items);
  const ownedIds = ids.filter((id) => S.owned.has(lkCat + ':' + id));
  const lockedIds = ids.filter((id) => !S.owned.has(lkCat + ':' + id));
  $('lkCount').textContent = `${ownedIds.length} / ${ids.length} obtenus`;
  $('lkGrid').innerHTML = [...ownedIds, ...lockedIds].map((id) => {
    const k = lkCat + ':' + id, own = S.owned.has(k);
    return `<div class="lk-item r-${rarityOf(lkCat, id)} ${S.loadout[lkCat] === id ? 'eq' : ''} ${own ? '' : 'locked'}" data-id="${id}" title="${itemOf(lkCat, id).name}"><img alt="" src="${thumb(lkCat, id)}"></div>`;
  }).join('');
  $('lkGrid').querySelectorAll('.lk-item').forEach((el) => {
    el.onmouseenter = () => lockerDetail(el.dataset.id);
    el.onclick = () => {
      const id = el.dataset.id, k = lkCat + ':' + id;
      if (!S.owned.has(k)) { toast(PASS_ITEMS.has(k) ? 'Débloque cet objet dans le Passe de combat' : 'Disponible dans la boutique'); return; }
      S.loadout[lkCat] = id; S.fresh.delete(k);
      buildChar();
      previewMode = lkCat === 'pickaxe' ? 'pickaxe' : null;
      if (lkCat === 'emote') playEmote(id);
      if (lkCat === 'backpack') { charYaw = Math.PI * 0.8; }
      if (lkCat === 'glider') { showStageItem({ cat: 'glider', id }); setTimeout(() => { if (curTab === 'locker') resetStage(); }, 2500); }
      updateTopbar(); renderLocker();
    };
  });
  lockerDetail(S.loadout[lkCat]);
}
function lockerDetail(id) {
  const it = itemOf(lkCat, id), RR = RARITIES[it.rarity];
  const own = S.owned.has(lkCat + ':' + id);
  $('lkDetail').innerHTML = `<span class="pp-rar" style="background:${RR.color};color:${it.rarity === 'common' ? '#12123a' : '#fff'}">${RR.name.toUpperCase()}</span><div class="pp-name">${it.name}</div>`;
}

// SHOP -----------------------------------------------------------------------
function shopToday() {
  const rnd = seeded(hashStr(todayKey()));
  const pool = SHOP_POOL.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const skins = pool.filter((p) => p.cat === 'skin');
  const featured = skins.slice(0, 2).map((p) => ({ ...p, featured: true }));
  const rest = pool.filter((p) => !featured.some((f) => f.cat === p.cat && f.id === p.id)).slice(0, 8);
  return { featured, daily: rest };
}
function shopCard(p) {
  const it = itemOf(p.cat, p.id), own = S.owned.has(p.cat + ':' + p.id), RR = RARITIES[it.rarity];
  return `<div class="sitem r-${it.rarity}" style="--rc:${RR.color}" data-c="${p.cat}" data-id="${p.id}" data-p="${p.price}"><img alt="" src="${thumb(p.cat, p.id)}">${own ? '<span class="si-owned">POSSÉDÉ</span>' : ''}<div class="si-bottom"><div class="si-name">${it.name}</div><div class="si-price"><i class="coin"></i><span>${fmt(p.price)}</span></div></div></div>`;
}
function renderShop() {
  const { featured, daily } = shopToday();
  $('shopFeatured').innerHTML = featured.map(shopCard).join('');
  $('shopDaily').innerHTML = daily.map(shopCard).join('');
  document.querySelectorAll('.sitem').forEach((el) => el.onclick = () => openBuy(el.dataset.c, el.dataset.id, +el.dataset.p));
  const gifted = S.giftDay === todayKey();
  $('giftBtn').disabled = gifted; $('giftBtn').textContent = gifted ? 'RÉCUPÉRÉ' : 'RÉCUPÉRER';
}
$('giftBtn').onclick = () => { if (S.giftDay === todayKey()) return; S.giftDay = todayKey(); S.eclats += 300; updateTopbar(); renderShop(); toast('+300 Éclats'); };
let buying = null;
function openBuy(cat, id, price) {
  buying = { cat, id, price };
  const it = itemOf(cat, id), own = S.owned.has(cat + ':' + id);
  $('bmArt').className = 'bm-art r-' + it.rarity;
  $('bmArt').innerHTML = `<img alt="" src="${thumb(cat, id)}">`;
  rarBadge($('bmRar'), it.rarity);
  $('bmName').textContent = it.name; $('bmType').textContent = TYPE_NAME[cat];
  $('bmDesc').textContent = it.desc || 'Objet cosmétique : ne donne aucun avantage en jeu.';
  const b = $('bmBuy'); b.disabled = own;
  b.innerHTML = own ? 'POSSÉDÉ' : `ACHETER <i class="coin"></i> ${fmt(price)}`;
  $('bmMsg').textContent = '';
  $('buyModal').classList.remove('hidden');
}
$('bmClose').onclick = () => $('buyModal').classList.add('hidden');
$('buyModal').onclick = (e) => { if (e.target.id === 'buyModal') $('buyModal').classList.add('hidden'); };
$('bmBuy').onclick = () => {
  if (!buying) return;
  const k = buying.cat + ':' + buying.id; if (S.owned.has(k)) return;
  if (S.eclats < buying.price) { $('bmMsg').textContent = `Il te manque ${fmt(buying.price - S.eclats)} Éclats. Joue des parties et monte de niveau pour en gagner.`; return; }
  S.eclats -= buying.price; grantItem(buying.cat, buying.id);
  updateTopbar(); $('buyModal').classList.add('hidden'); renderShop();
  toast(`${itemOf(buying.cat, buying.id).name} ajouté à ton casier`);
};

// SETTINGS -------------------------------------------------------------------
$('settingsBtn').onclick = () => {
  $('setName').value = S.name; $('setDiff').value = S.diff; $('settingsModal').classList.remove('hidden');
  settingsForm($('setForm'), S.settings, (st) => { S.sens = st.sens; setVolumes(st.volume, st.music); });
};
$('setSave').onclick = () => { S.name = ($('setName').value.trim() || 'Tim').slice(0, 16); S.diff = $('setDiff').value; S.sens = S.settings.sens; saveSettings(S.settings); $('settingsModal').classList.add('hidden'); updateTopbar(); };
setVolumes(S.settings.volume, S.settings.music); S.sens = S.settings.sens;

// ---------------------------------------------------------------------------
// Game modes, party and friends (friends play as AI teammates)
// ---------------------------------------------------------------------------
const MODES = { solo: { name: 'SOLO', size: 1, desc: 'Chacun pour soi' }, duo: { name: 'DUO', size: 2, desc: '1 coéquipier' }, escouade: { name: 'ESCOUADE', size: 4, desc: '3 coéquipiers' } };
const FRIENDS = [
  { name: 'Lina_Storm', st: 'online', lvl: 42, skin: 'neon' }, { name: 'KevBuild', st: 'online', lvl: 17 }, { name: 'Sacha.exe', st: 'online', lvl: 63 },
  { name: 'Noa', st: 'game', lvl: 8 }, { name: 'MaxRampe', st: 'online', lvl: 29 }, { name: 'Ines_Gold', st: 'game', lvl: 55 },
  { name: 'Yanis', st: 'off', lvl: 12 }, { name: 'Chloé', st: 'off', lvl: 31 },
];
const AI_MATES = ['Bot Écho', 'Bot Nova', 'Bot Pixel'];
function partySize() { return MODES[S.mode].size; }
function matesList() { const n = partySize() - 1, out = []; for (let i = 0; i < n; i++) out.push(S.party[i] ? { name: S.party[i], friend: true } : { name: AI_MATES[i], friend: false }); return out; }
function renderParty() {
  const mates = matesList(), pos = ['s1', 's2', 's3'];
  let html = '';
  for (let i = 0; i < 3; i++) {
    const m = mates[i];
    if (m) html += `<div class="slot member ${pos[i]}"><div class="sl-fig ${m.friend ? 'fr' : 'ai'}"></div><b>${m.name}</b><em>${m.friend ? 'AMI · PRÊT' : 'COÉQUIPIER IA'}</em></div>`;
    else html += `<div class="slot invite ${pos[i]}" data-inv="1"><span>+</span><em>Inviter</em></div>`;
  }
  $('party').innerHTML = html;
  $('party').querySelectorAll('[data-inv]').forEach((el) => el.onclick = () => openFriends());
  $('party').querySelectorAll('.sl-kick').forEach((el) => el.onclick = (e) => { e.stopPropagation(); S.party.splice(+el.dataset.k, 1); renderParty(); renderFriends(); });
  $('modeName').textContent = MODES[S.mode].name;
  $('playersLabel').textContent = S.players;
  const fn = $('friendsN'); if (fn) fn.textContent = FRIENDS.filter((f) => f.st === 'online').length;
}
function renderFriends() {
  const stL = { online: 'En ligne', game: 'En partie', off: 'Hors ligne' };
  $('partyList').innerHTML = `<div class="fr-sub">GROUPE (${1 + S.party.length}/${Math.max(partySize(), 1 + S.party.length)})</div><div class="fr-row me"><i class="dot online"></i><b>${S.name}</b></div>`;
  $('friendsList').innerHTML = FRIENDS.map((f) => { const inP = S.party.includes(f.name); return `<div class="fr-row"><i class="dot ${f.st}"></i><b>${f.name}</b><span>Niv. ${f.lvl} · ${stL[f.st]}</span>${inP ? '' : `<button data-n="${f.name}">INVITER</button>`}</div>`; }).join('');
  $('friendsList').querySelectorAll('button[data-n]').forEach((b) => b.onclick = () => {
    if (S.party.length >= 3) { toast('Le groupe est complet'); return; }
    S.party.push(b.dataset.n);
    if (partySize() < 1 + S.party.length) { S.mode = S.party.length >= 2 ? 'escouade' : 'duo'; toast('Mode ' + MODES[S.mode].name + ' sélectionné'); }
    else toast(b.dataset.n + ' a rejoint le groupe');
    sfx('pickup', 0.6); renderParty(); renderFriends();
  });
}
function openFriends() { renderFriends(); $('friendsPanel').classList.remove('hidden'); }
$('friendsBtn').onclick = () => $('friendsPanel').classList.contains('hidden') ? openFriends() : $('friendsPanel').classList.add('hidden');
$('friendsClose').onclick = () => $('friendsPanel').classList.add('hidden');
function renderModePick() {
  $('mpModes').innerHTML = Object.entries(MODES).map(([k, m]) => `<button class="mp-opt ${S.mode === k ? 'on' : ''}" data-m="${k}"><b>${m.name}</b><span>${m.desc}</span></button>`).join('');
  $('mpPlayers').innerHTML = [30, 50, 100].map((n) => `<button class="mp-opt ${S.players === n ? 'on' : ''}" data-p="${n}"><b>${n}</b></button>`).join('');
  $('mpDiff').innerHTML = [['facile', 'Facile'], ['normal', 'Normal'], ['difficile', 'Difficile']].map(([k, n]) => `<button class="mp-opt ${S.diff === k ? 'on' : ''}" data-d="${k}"><b>${n}</b></button>`).join('');
  document.querySelectorAll('#modeModal .mp-opt').forEach((b) => b.onclick = () => {
    if (b.dataset.m) { S.mode = b.dataset.m; if (S.party.length > partySize() - 1) S.party.length = partySize() - 1; }
    if (b.dataset.p) S.players = +b.dataset.p;
    if (b.dataset.d) S.diff = b.dataset.d;
    renderModePick();
  });
}
$('diffBtn').onclick = () => { renderModePick(); $('modeModal').classList.remove('hidden'); };
$('modeCard').onclick = (e) => { if (e.target.id !== 'diffBtn') $('diffBtn').onclick(); };
$('mpOk').onclick = () => { $('modeModal').classList.add('hidden'); updateTopbar(); renderParty(); toast(`${MODES[S.mode].name} · ${S.players} joueurs · bots ${$('diffLabel').textContent}`); };
// lobby music starts with the first interaction (browser autoplay rules)
let audioOn = false;
window.addEventListener('pointerdown', () => { if (audioOn) return; audioOn = true; initAudio(); setVolumes(S.settings.volume, S.settings.music); if (!inMatch) playMusic('lobby'); }, { capture: true });
renderParty();
$('settingsModal').onclick = (e) => { if (e.target.id === 'settingsModal') $('settingsModal').classList.add('hidden'); };

// ---------------------------------------------------------------------------
// Match flow
// ---------------------------------------------------------------------------
const TIPS = [
  'Frappe le <b>cercle bleu</b> avec ta pioche pour récolter deux fois plus vite.',
  'Les <b>largages</b> tombent pendant la tempête : ils contiennent des armes épiques ou légendaires.',
  'Accroupis-toi avec <b>F</b> pour tirer plus précisément.',
  'Sprinte avec <b>Maj</b>, mais tu ne peux pas tirer en sprintant.',
  'Appuie sur <b>B</b> pour lancer ton emote en pleine partie.',
  'Construis une rampe (<b>C</b>) pour prendre l’avantage de la hauteur.',
  'Un indicateur rouge autour du viseur montre d’où viennent les tirs.',
];
let mmTimer = 0, inMatch = false, mmTimeout = 0;
function bindPlay() {
  $('playBtn').onclick = () => {
    if (inMatch) { cancelMM2(); toast('Recherche annulée'); return; }
    inMatch = true; if (lockMod && lockMod.onPlay) lockMod.onPlay();
    $('playBtn').querySelector('span').textContent = 'ANNULE'; $('matchmaking').classList.remove('hidden');
    let t = 0; $('mmTime').textContent = '0:00';
    mmTimer = setInterval(() => { t++; const mm = Math.floor(t / 60), ss = t % 60; $('mmTime').textContent = mm + ':' + String(ss).padStart(2, '0'); }, 1000);
    mmTimeout = setTimeout(() => { if (inMatch) launchMatch(); }, 900);
  };
}
function cancelMM2() { clearInterval(mmTimer); clearTimeout(mmTimeout); inMatch = false; $('matchmaking').classList.add('hidden'); $('playBtn').querySelector('span').textContent = 'JOUER'; }
bindPlay();

function launchMatch() {
  $('matchmaking').classList.add('hidden');
  const ls = $('loadScreen'); ls.classList.remove('hidden');
  $('lsArt').innerHTML = `<div class="ls-logo">STORM<b>DROP</b></div><div class="ls-season">SAISON 2 · TOP SECRET</div>`;
  $('lsTip').innerHTML = 'Astuce : ' + TIPS[Math.floor(Math.random() * TIPS.length)];
  let p = 0; $('lsFill').style.width = '0%';
  const iv = setInterval(() => { p = Math.min(90, p + 7 + Math.random() * 10); $('lsFill').style.width = p + '%'; }, 120);
  running = false;
  const fr = document.createElement('iframe');
  fr.id = 'matchFrame';
  const loadout = { ...S.loadout, name: S.name, sens: S.settings.sens, diff: S.diff, mode: S.mode, players: S.players, settings: S.settings, mateNames: matesList().map((m) => m.name) };
  stopMusic();
  fr.src = 'game.html#' + encodeURIComponent(JSON.stringify(loadout));
  fr.style.visibility = 'hidden';
  fr.onload = () => {
    setTimeout(() => {
      clearInterval(iv); $('lsFill').style.width = '100%';
      setTimeout(() => { fr.style.visibility = 'visible'; ls.classList.add('hidden'); try { fr.contentWindow.focus(); } catch (e) {} fr.focus(); }, 350);
    }, 900);
  };
  if (lockMod && lockMod.prepareFrame) lockMod.prepareFrame(fr);
  document.body.appendChild(fr);
}
let lockMod = null;
import('./lock.js').then((m) => { lockMod = m; }).catch(() => {});

window.addEventListener('message', (e) => {
  const d = e.data; if (!d || d.type !== 'stormdrop-result') return;
  const fr = $('matchFrame'); if (fr) fr.remove();
  inMatch = false; cancelMM2(); if (audioOn) playMusic('lobby');
  running = true; lastT = performance.now(); requestAnimationFrame(loop);
  const summary = applyResult(d);
  if (d.action === 'replay') { toast(`+${fmt(summary.total)} XP · niveau ${S.level}`); setTimeout(() => { inMatch = true; launchMatch(); }, 400); }
  else showResult(d, summary);
});

function applyResult(d) {
  const st = d.stats || {};
  const placement = d.placement || 30;
  const C = S.career;
  C.matches++; if (d.won) C.wins++; C.kills += d.kills || 0; if (placement <= 10) C.top10++; C.damage += st.damage || 0; C.time += d.time || 0; C.best = Math.min(C.best, placement);
  C.chests += st.chests || 0; C.supply += st.supply || 0; C.harvested += st.harvested || 0; C.builds += st.builds || 0; C.headshots += st.headshots || 0;
  const inc = { chests: st.chests || 0, kills: d.kills || 0, harvested: st.harvested || 0, damage: st.damage || 0, builds: st.builds || 0, top10: placement <= 10 ? 1 : 0, wins: d.won ? 1 : 0, supply: st.supply || 0, headshots: st.headshots || 0, minutes: Math.floor((d.time || 0) / 60) };
  const lines = Object.entries(d.xpLog || {}).map(([k, v]) => [k, v]);
  let chXP = 0; const doneNow = [];
  for (const c of [...DAILY, ...WEEKLY]) {
    if (S.doneCh.has(c.id)) continue;
    S.prog[c.id] += inc[c.stat] || 0;
    if (S.prog[c.id] >= c.goal) { S.doneCh.add(c.id); chXP += c.xp; doneNow.push(c); }
  }
  for (const c of doneNow) lines.push(['Défi : ' + c.name, c.xp]);
  const matchXP = d.xp || 0;
  const startLevel = S.level, startXP = S.xp;
  const res = addXP(matchXP + chXP);
  S.last = { won: d.won, placement, kills: d.kills || 0, xp: matchXP + chXP };
  updateTopbar();
  return { lines, total: matchXP + chXP, startLevel, startXP, rewards: res.rewards, levels: res.levels, inc };
}
function showResult(d, sm) {
  const pl = d.won ? 1 : d.placement;
  $('rsPlace').textContent = '#' + pl; $('rsPlace').classList.toggle('lose', !d.won);
  $('rsTitle').textContent = d.won ? 'VICTOIRE ROYALE' : pl <= 10 ? `TOP ${pl} — BIEN JOUÉ` : 'ÉLIMINÉ';
  const m = Math.floor((d.time || 0) / 60), s = (d.time || 0) % 60, st = d.stats || {};
  $('rsStats').innerHTML = [['Éliminations', d.kills || 0], ['Temps survécu', `${m}:${String(s).padStart(2, '0')}`], ['Dégâts infligés', fmt(st.damage || 0)], ['Coffres ouverts', st.chests || 0]].map(([a,b]) => `<div class="stat"><span>${a}</span><b>${b}</b></div>`).join('');
  $('rsXpList').innerHTML = sm.lines.map(([k, v], i) => `<div style="animation-delay:${i * 0.08}s"><span>${k}</span><b>+${fmt(v)}</b></div>`).join('');
  $('rsXpTotal').textContent = '+' + fmt(sm.total) + ' XP';
  // animated level bar
  let lvl = sm.startLevel, xp = sm.startXP, remaining = sm.total;
  $('rsLvl').textContent = lvl; $('rsFill').style.transition = 'none'; $('rsFill').style.width = (xp / XP_PER_LEVEL * 100) + '%';
  const stepAnim = () => {
    if (remaining <= 0) return;
    const need = XP_PER_LEVEL - xp, take = Math.min(need, remaining);
    remaining -= take; xp += take;
    $('rsFill').style.transition = 'width .6s ease'; $('rsFill').style.width = (xp / XP_PER_LEVEL * 100) + '%';
    setTimeout(() => {
      if (xp >= XP_PER_LEVEL) { lvl++; xp = 0; $('rsLvl').textContent = lvl; $('rsFill').style.transition = 'none'; $('rsFill').style.width = '0%'; }
      setTimeout(stepAnim, 60);
    }, 650);
  };
  setTimeout(stepAnim, 500);
  $('rsRewards').innerHTML = sm.rewards.length ? sm.rewards.map((r) => rewardHTML(r)).join('') : '';
  $('resultModal').classList.remove('hidden');
}
$('rsContinue').onclick = () => { $('resultModal').classList.add('hidden'); setTab(curTab); };

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
const tickClocks = () => { const t = untilMidnight(); $('shopTimer').textContent = t; $('dailyReset').textContent = t; const d2 = $('dailyReset2'); if (d2) d2.textContent = 'Réinitialisation dans ' + t; };
setInterval(tickClocks, 1000);
tickClocks();
buildChar(); updateTopbar(); renderHome();
requestAnimationFrame(loop);
// pre-render thumbnails in the background so tabs open instantly
(() => { const q = []; for (const c in CATS) for (const id in CATS[c].items) q.push([c, id]); const tick = () => { for (let i = 0; i < 3 && q.length; i++) { const [c, id] = q.shift(); thumb(c, id); } if (q.length) setTimeout(tick, 30); }; tick(); })();
window.__lobby = { S, setTab, addXP, applyResult, showResult, launchMatch };

// ---------------------------------------------------------------------------
// Installable app (PWA): offline cache + install button
// ---------------------------------------------------------------------------
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; $('installBtn').classList.remove('hidden'); });
window.addEventListener('appinstalled', () => { $('installBtn').classList.add('hidden'); toast('STORMDROP est installé : lance-le depuis ton bureau'); });
$('installBtn').onclick = async () => { if (!installEvt) return; installEvt.prompt(); const r = await installEvt.userChoice; installEvt = null; if (r.outcome === 'accepted') $('installBtn').classList.add('hidden'); };

// Parallax of the lobby art with the mouse
{
  const bgImg = document.getElementById('bgImg');
  document.body.dataset.tab = document.body.dataset.tab || 'home';
  window.addEventListener('pointermove', (e) => {
    if (!bgImg || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    bgImg.style.setProperty('--px', (-nx * 22).toFixed(1) + 'px'); bgImg.style.setProperty('--py', (-ny * 14).toFixed(1) + 'px');
  });
}
