import * as THREE from 'three';
import { terrainH, POIS, ISLAND_R, OVAL_X, OVAL_Z, WORLD_R, CELL, mulberry32, fbm, vnoise, coastR, inPOI, biomeW, biomeAt, BIOME_NAMES, GROTTO, inGrotto, grottoCamCeil, grottoCamFloor, AGENCY_BASE, AGENCY_K, inAgencyBasement } from './world.js';
import { initAudio, sfx, setVolumes, playMusic, stopMusic } from './audio.js';
import { loadSettings, saveSettings, settingsForm, keyLabel } from './settings.js';
import { createOutline } from './outline.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildGun, SHARED_WEAPON_GEOS } from './weapons.js';
import { SKINS, BACKPACKS, PICKAXES, GLIDERS, EMOTES, DEFAULT_LOADOUT, makeCharMesh as makeCharMeshCos, makePickaxe, poseEmote, relaxJoints } from './cosmetics.js';

// =====================================================================
// Constants & data
// =====================================================================
const RAR = [
  { name: 'Commun', color: 0xb5b9c2, css: '#c9ccd4', mult: 1.0, reload: 1.0, spread: 1.0, mag: 1.0, recoil: 1.0 },
  { name: 'Peu commun', color: 0x4fd04f, css: '#5fe35f', mult: 1.06, reload: 0.94, spread: 0.94, mag: 1.0, recoil: 0.95 },
  { name: 'Rare', color: 0x36a3ff, css: '#4cb2ff', mult: 1.12, reload: 0.88, spread: 0.88, mag: 1.0, recoil: 0.88 },
  { name: 'Épique', color: 0xb558ff, css: '#c27bff', mult: 1.19, reload: 0.82, spread: 0.8, mag: 1.2, recoil: 0.8 },
  { name: 'Légendaire', color: 0xffae2b, css: '#ffbb47', mult: 1.26, reload: 0.76, spread: 0.72, mag: 1.2, recoil: 0.72 },
  { name: 'Mythique', color: 0xffd23f, css: '#ffd23f', mult: 1.4, reload: 0.66, spread: 0.62, mag: 1.0, recoil: 0.6 },
];
const WEAPONS = {
  pickaxe: { name: 'Pioche', melee: true, dmg: 20, rate: 1.8, range: 3.4 },
 ar: { equip: 0.45, kick: 0.016, kickX: 0.006, name: "Fusil d'assaut", ammo: 'medium', mag: 30, dmg: 30, rate: 5.5, spread: 0.03, ads: 0.008, bloom: 0.006, range: 260, reload: 2.3, pellets: 1, fall: [50, 160, 0.65], sfx: 'ar' },
  smg: { equip: 0.3, kick: 0.009, kickX: 0.007, name: 'Mitraillette', ammo: 'light', mag: 30, dmg: 17, rate: 11, spread: 0.045, ads: 0.028, bloom: 0.003, range: 130, reload: 2.0, pellets: 1, fall: [20, 80, 0.6], sfx: 'smg' },
  shotgun: { equip: 0.55, kick: 0.07, kickX: 0.01, name: 'Fusil à pompe', ammo: 'shells', mag: 5, dmg: 10, rate: 1.0, spread: 0.075, ads: 0.06, bloom: 0, range: 55, reload: 4.0, pellets: 10, fall: [7, 30, 0.3], sfx: 'shotgun' },
  sniper: { equip: 0.8, kick: 0.09, kickX: 0.004, name: 'Fusil de précision', ammo: 'heavy', mag: 1, dmg: 105, rate: 0.45, spread: 0.09, ads: 0, bloom: 0, range: 600, reload: 2.6, pellets: 1, head: 2.5, scope: true, fall: [999, 1000, 1], sfx: 'sniper' },
  // Armes mythiques des boss (Chapitre 2 Saison 2)
  drum: { equip: 0.4, kick: 0.011, kickX: 0.006, name: 'Mitrailleuse de Midas', ammo: 'light', mag: 90, dmg: 22, rate: 9, spread: 0.036, ads: 0.02, bloom: 0.0035, range: 170, reload: 3.0, pellets: 1, fall: [20, 90, 0.6], sfx: 'smg', mythic: true },
  minigun: { equip: 0.5, kick: 0.008, kickX: 0.006, name: 'Minigun de Brutus', ammo: 'light', mag: 250, dmg: 17, rate: 12, spread: 0.05, ads: 0.03, bloom: 0.003, range: 150, reload: 4.2, pellets: 1, fall: [20, 90, 0.6], sfx: 'smg', mythic: true },
  scar: { equip: 0.4, kick: 0.014, kickX: 0.005, name: 'AR de Skye', ammo: 'medium', mag: 30, dmg: 34, rate: 6, spread: 0.024, ads: 0.006, bloom: 0.005, range: 280, reload: 2.1, pellets: 1, fall: [50, 160, 0.65], sfx: 'ar', mythic: true },
  heavyar: { equip: 0.5, kick: 0.016, kickX: 0.006, name: 'AR Lourd Peow Peow', ammo: 'medium', mag: 40, dmg: 36, rate: 5, spread: 0.028, ads: 0.008, bloom: 0.006, range: 300, reload: 2.5, pellets: 1, fall: [50, 170, 0.7], sfx: 'ar', mythic: true },
  boombow: { equip: 0.5, kick: 0.05, kickX: 0.004, name: 'Arc Ka-Boom', ammo: 'shells', mag: 1, dmg: 15, rate: 0.8, spread: 0.02, ads: 0, bloom: 0, range: 220, reload: 1.8, pellets: 1, aoe: 5, aoeDmg: 60, fall: [999, 1000, 1], sfx: 'shotgun', mythic: true },
  grapple: { equip: 0.3, kick: 0.004, kickX: 0.002, name: 'Grappin de Skye', ammo: 'medium', mag: 10, dmg: 0, rate: 1.1, spread: 0, ads: 0, bloom: 0, range: 65, reload: 2.0, pellets: 1, grapple: true, fall: [999, 1000, 1], sfx: 'smg', mythic: true },
};
const CONSUM = {
  bandage: { name: 'Bandages', dur: 3.0, hp: 15, maxHp: 75, stack: 15, give: 5 },
  medkit: { name: 'Trousse de soins', dur: 6.0, hp: 100, maxHp: 100, stack: 3, give: 1 },
  shieldS: { name: 'Petite potion', dur: 2.0, sh: 25, maxSh: 50, stack: 6, give: 3 },
  shieldL: { name: 'Potion bouclier', dur: 5.0, sh: 50, maxSh: 100, stack: 3, give: 1 },
};
const AMMO_NAMES = { light: 'Munitions légères', medium: 'Munitions moyennes', shells: 'Cartouches', heavy: 'Munitions lourdes' };
const MAT_HP = { wood: 150, stone: 260, metal: 380 };
const MAT_ORDER = ['wood', 'stone', 'metal'];
const BUILD_COST = 5;
const BUILD_TIME = { wood: 1.0, stone: 2.2, metal: 3.6 }; // seconds to fully reinforce
const START_HP = { wood: 0.33, stone: 0.25, metal: 0.18 };
const GRAV = 30, JUMP_V = 10.2, RUN = 7.6;
const CH_R = 0.42, CH_H = 1.85, STEP = 0.6;
let BOT_COUNT = 29;
const BOT_DMG = 0.28;
const BOT_NAMES_X = ['Zorro', 'Crêpe', 'Pistache', 'Nuage', 'Biscotte', 'Flan', 'Gaufre', 'Merlin', 'Praline', 'Cactus', 'Pingouin', 'Tornade', 'Écureuil', 'Kiwi', 'Mango', 'Comète', 'Fennec', 'Loutre', 'Galette', 'Orage'];
const BOT_NAMES = ['Zéphyr', 'LaCrevette', 'Bastien_77', 'Croissant2Feu', 'NinjaDuDimanche', 'Mamie_Sniper', 'Kévin_TTV', 'Baguette', 'Raclette', 'ToxicTom', 'Luna', 'PixelPaul', 'Gégé', 'Sniperella', 'Choucroute', 'Mistral', 'Tartiflette', 'Chouquette', 'Le_Boss', 'Yasmine', 'Brioche', 'Hugo_Build', 'Noa', 'Flambeur', 'Cassoulet', 'Sardine', 'Léon', 'Ratatouille', 'Inès_GG', 'Patate', 'Moustache'];

let LOAD = { ...DEFAULT_LOADOUT, name: 'Joueur' };
try { const h = decodeURIComponent(location.hash.slice(1)); if (h) Object.assign(LOAD, JSON.parse(h)); } catch (e) {}
const SET = loadSettings();
if (LOAD.settings) { const b = { ...SET.binds, ...(LOAD.settings.binds || {}) }; Object.assign(SET, LOAD.settings); SET.binds = b; }
const BIND = SET.binds;
const TEAM_SIZE = { solo: 1, duo: 2, escouade: 4 }[LOAD.mode || 'solo'] || 1;
const PLAYER_TOTAL = [50, 100].includes(+LOAD.players) ? +LOAD.players : 50;
BOT_COUNT = PLAYER_TOTAL - 1;
setVolumes(SET.volume, SET.music);
const IN_FRAME = window.parent !== window;
const DIFF = { facile: { dmg: 0.5, aim: 0.55, react: 1.6 }, normal: { dmg: 0.72, aim: 0.72, react: 1.35 }, difficile: { dmg: 0.95, aim: 0.9, react: 1.1 } }[LOAD.diff || 'normal'] || { dmg: 0.72, aim: 0.72, react: 1.35 };
const stats = { chests: 0, builds: 0, damage: 0, harvested: 0, headshots: 0, supply: 0 };
let matchXP = 0; const xpLog = {}; let xpFinal = false, wonMatch = false;
function addXP(label, n, quiet) { n = Math.round(n); if (n <= 0) return; matchXP += n; xpLog[label] = (xpLog[label] || 0) + n; if (!quiet) xpPop(label, n); }
function xpPop(label, n) {
  const f = document.getElementById('xpFeed'); if (!f) return;
  const d = document.createElement('div'); d.className = 'xp'; d.innerHTML = `${label} <b>+${n} XP</b>`;
  f.prepend(d); while (f.children.length > 4) f.lastChild.remove(); setTimeout(() => d.remove(), 2400);
}
const R = mulberry32((Date.now() & 0xffff) ^ 20261005);
const rand = (a = 1, b) => (b === undefined ? R() * a : a + R() * (b - a));
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const MR = Math.random;

// =====================================================================
// Renderer / scene
// =====================================================================
const canvas = document.getElementById('game');
// the outline pass resolves its own anti-aliased target, so canvas MSAA would be wasted work
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !SET.outline, powerPreference: 'high-performance' });
const LOWQ = /lowq/.test(location.search) || SET.quality === 'basse';
const HIGHQ = SET.quality === 'haute' && !LOWQ;
function applyPixelRatio() { renderer.setPixelRatio(LOWQ ? Math.min(window.devicePixelRatio, 0.75) : HIGHQ ? Math.min(window.devicePixelRatio, 2.5) : Math.min(window.devicePixelRatio, 1.6)); }
applyPixelRatio();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = !LOWQ;
renderer.shadowMap.type = HIGHQ ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
const FOG_COL = new THREE.Color(0xbfe6ff); // couleur d'horizon (gardée pour le ciel), plus aucun brouillard sur la map
scene.fog = new THREE.Fog(0x16608e, 1e8, 2e8); // brouillard « invisible » au-dessus de l'eau : présent en permanence pour éviter toute recompilation de shader, il devient dense et bleu dès que la caméra plonge
const camera = new THREE.PerspectiveCamera(SET.fov, window.innerWidth / window.innerHeight, 0.1, 30000); // portée très longue : la mer et les décors lointains vont jusqu'à l'horizon
// cartoon outlines (post-process, one extra full-screen pass)
function syncLin() { const l = outline.linear ? 1 : 0; if (skyMat) skyMat.uniforms.lin.value = l; if (storm.mesh) storm.mesh.material.uniforms.lin.value = l; }
const outline = createOutline(renderer, { enabled: !!SET.outline, width: SET.outlineW || 1, fadeNear: 70 * SET.viewDist, fadeFar: 260 * SET.viewDist, samples: LOWQ ? 0 : HIGHQ ? 4 : 2, canvasAA: !SET.outline });
scene.add(camera);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
});

// Sky dome
let skyMat = null, sunDisc = null, stars = null;
{
  const g = new THREE.SphereGeometry(1200, 32, 16);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x3d8ae8) }, mid: { value: new THREE.Color(0xa6dcff) }, bot: { value: FOG_COL }, lin: { value: 0 }, sunDir: { value: new THREE.Vector3(0.5, 0.7, 0.35).normalize() }, glow: { value: 1 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform float lin; uniform vec3 sunDir; uniform float glow; varying vec3 vP;
      void main(){
        float h = vP.y; vec3 u = mix(mid, top, smoothstep(0.05, 0.75, h));
        // halo around the sun, warmer when it is low
        float sd = max(dot(normalize(vP), sunDir), 0.0);
        vec3 gc = mix(vec3(1.0, 0.72, 0.42), vec3(1.0, 0.95, 0.82), smoothstep(0.05, 0.5, sunDir.y));
        u += gc * (pow(sd, 6.0) * 0.28 + pow(sd, 48.0) * 0.45) * glow;
        if (lin > 0.5) u = pow(u, vec3(2.2));
        vec3 c = h > 0.0 ? u : bot;
        c = mix(bot, c, smoothstep(-0.02, 0.3, h)); // wide haze band melting into the fog
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const sky = new THREE.Mesh(g, m); sky.renderOrder = -1; scene.add(sky); skyMat = m;
  // Sun disc
  const sun = new THREE.Mesh(new THREE.CircleGeometry(40, 32), new THREE.MeshBasicMaterial({ color: 0xfff6c8, fog: false }));
  sun.position.set(500, 700, 350); sun.lookAt(0, 0, 0); scene.add(sun); sunDisc = sun;
  // stars (visible at night)
  const sg = new THREE.BufferGeometry(), sp = [];
  for (let i = 0; i < 700; i++) { const a = MR() * 6.283, y = 0.15 + MR() * 0.85, r = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * r * 1100, y * 1100, Math.sin(a) * r * 1100); }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); scene.add(stars);
}

const hemi = new THREE.HemisphereLight(0xc4dcff, 0x9aa57a, 1.15); // cool fill: shadows read bluish against the warm sun
scene.add(hemi);
const sunLight = new THREE.DirectionalLight(0xffe8c4, 2.4);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(HIGHQ ? 2048 : 1024, HIGHQ ? 2048 : 1024);
const SH_R = HIGHQ ? 70 : 50; // half-size of the shadowed area around the player
const sc = sunLight.shadow.camera; sc.left = -SH_R; sc.right = SH_R; sc.top = SH_R; sc.bottom = -SH_R; sc.near = 1; sc.far = 400;
sunLight.shadow.bias = -0.0004; sunLight.shadow.normalBias = 0.03;
scene.add(sunLight); scene.add(sunLight.target);
const SUN_OFF = new THREE.Vector3(70, 120, 50);

// =====================================================================
// Materials helpers
// =====================================================================
const BOX = new THREE.BoxGeometry(1, 1, 1);
const matCache = new Map();
function matC(color, opts = {}) {
  const k = color + JSON.stringify(opts);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0, ...opts }));
  return matCache.get(k);
}
function canvasTex(draw, size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const TEX = {
  wood: canvasTex((g, s) => {
    g.fillStyle = '#b57a3e'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = ['#c48a4a', '#b07438', '#bd8445', '#a96f35'][i]; g.fillRect(0, i * 32 + 2, s, 28);
      g.fillStyle = 'rgba(70,40,15,.5)'; g.fillRect(0, i * 32, s, 3);
      for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(90,50,20,.25)'; g.fillRect(MR() * s, i * 32 + 6 + MR() * 20, 20 + MR() * 30, 2); }
    }
    g.strokeStyle = 'rgba(60,35,10,.7)'; g.lineWidth = 6; g.strokeRect(3, 3, s - 6, s - 6);
  }),
  stone: canvasTex((g, s) => {
    g.fillStyle = '#7f8790'; g.fillRect(0, 0, s, s);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) {
      const off = (r % 2) * 16; const v = 140 + Math.floor(MR() * 40);
      g.fillStyle = `rgb(${v},${v + 6},${v + 12})`; g.fillRect(c * 32 + off - 16 + 2, r * 21.3 + 2, 28, 18);
    }
    g.strokeStyle = 'rgba(40,45,55,.8)'; g.lineWidth = 6; g.strokeRect(3, 3, s - 6, s - 6);
  }),
  metal: canvasTex((g, s) => {
    const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, '#8fa6bf'); gr.addColorStop(1, '#5d7590');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(30,40,55,.6)'; g.lineWidth = 3;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, s); g.stroke(); }
    g.fillStyle = 'rgba(220,235,255,.7)';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { g.beginPath(); g.arc(i * 32 + 16, j * 100 + 14, 3, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(20,30,45,.85)'; g.lineWidth = 6; g.strokeRect(3, 3, s - 6, s - 6);
  }),
};
const BUILD_MATS = {
  wood: new THREE.MeshStandardMaterial({ map: TEX.wood, roughness: 0.9 }),
  stone: new THREE.MeshStandardMaterial({ map: TEX.stone, roughness: 0.95 }),
  metal: new THREE.MeshStandardMaterial({ map: TEX.metal, roughness: 0.45, metalness: 0.5 }),
};
const BUILD_MATS_GHOSTLY = {
  wood: new THREE.MeshStandardMaterial({ map: TEX.wood, roughness: 0.9, transparent: true, opacity: 0.72, emissive: 0x2a6aff, emissiveIntensity: 0.25 }),
  stone: new THREE.MeshStandardMaterial({ map: TEX.stone, roughness: 0.95, transparent: true, opacity: 0.72, emissive: 0x2a6aff, emissiveIntensity: 0.25 }),
  metal: new THREE.MeshStandardMaterial({ map: TEX.metal, roughness: 0.45, metalness: 0.5, transparent: true, opacity: 0.72, emissive: 0x2a6aff, emissiveIntensity: 0.25 }),
};
const GHOST_MAT = new THREE.MeshBasicMaterial({ color: 0x5ab8ff, transparent: true, opacity: 0.38, depthWrite: false });
const GHOST_BAD = new THREE.MeshBasicMaterial({ color: 0xff4d6a, transparent: true, opacity: 0.35, depthWrite: false });

// =====================================================================
// Terrain & water
const waterT = { value: 0 }, windT = { value: 0 };
// ciel partagé avec le shader de l'eau : mis à jour par updateDayNight (reflet jour/nuit)
const WSKY = {
  top: new THREE.Color(0x3d8ae8), mid: new THREE.Color(0xa6dcff),
  sun: new THREE.Vector3(0.5, 0.7, 0.35).normalize(), night: { value: 0 },
};
// =====================================================================
const TERRAIN_SIZE = WORLD_R * 2 + 120;
let terrainMeshRef = null; // exposé à la QA : le maillage rendu doit épouser terrainH
let waterMatRef = null; // exposé au cycle jour/nuit : l'eau reflète le ciel en temps réel
{
  const SEG = 320; // maillage fin : la physique (terrainH) et le rendu restent collés à ~1,5 m près autour des creux de la Grotte (sinon : sol invisible)
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const sand = new THREE.Color(0xf0dc9c), g1 = new THREE.Color(0x76cc4a), g2 = new THREE.Color(0x4fae3f), rock = new THREE.Color(0x8e9196), snow = new THREE.Color(0xf4f8ff), deep = new THREE.Color(0xd9c58a), dirt = new THREE.Color(0xb59262), dsand = new THREE.Color(0xe8c27a), fgreen = new THREE.Color(0x2f8a3a), snowDirt = new THREE.Color(0xc9d3dc);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = terrainH(x, z);
    pos.setY(i, h);
    const sl = Math.abs(terrainH(x + 1.5, z) - h) + Math.abs(terrainH(x, z + 1.5) - h);
    const n = fbm(x * 0.05, z * 0.05);
    if (h < 1.4) c.copy(h < -1 ? deep : sand);
    else { c.copy(g1).lerp(g2, n); if (h < 2.2) c.lerp(sand, (2.2 - h) / 0.8); }
    const bw = biomeW(x, z);
    if (h >= 1.4) { c.lerp(dsand, bw.desert * (0.85 + 0.15 * n)); c.lerp(fgreen, bw.forest * 0.6); c.lerp(snow, bw.snow * (0.75 + 0.25 * n)); }
    if (inPOI(x, z, -4) && h >= 1.4) c.lerp(bw.snow > 0.5 ? snowDirt : dirt, 0.18 + 0.2 * n);
    if (sl > 1.6 || h > 26) c.lerp(rock, clamp(Math.max((sl - 1.6) * 0.8, (h - 26) / 6), 0, 1));
    if (h > 40) c.lerp(snow, clamp((h - 40) / 4, 0, 1));
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const tmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  // per-pixel detail on top of the vertex colours (one vertex every ~3 m): grass patches, fine grain,
  // darker steep slopes and an animated foam line where the island meets the sea
  tmat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = waterT;
    sh.uniforms.uNight = WSKY.night;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vWP; uniform float uT; uniform float uNight;
      float th(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float tn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(th(i), th(i + vec2(1.0, 0.0)), f.x), mix(th(i + vec2(0.0, 1.0)), th(i + vec2(1.0, 1.0)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float patches = tn(vWP.xz * 0.16) * 0.65 + tn(vWP.xz * 0.43 + 17.0) * 0.35;
        float grain = tn(vWP.xz * 2.1 + 3.0);
        diffuseColor.rgb *= 0.84 + patches * 0.27 + (grain - 0.5) * 0.08;
        // drier, yellower grass in large patches (only where the ground is green)
        float dry = smoothstep(0.5, 0.8, tn(vWP.xz * 0.045 + 40.0)) * step(diffuseColor.r * 1.15, diffuseColor.g);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.18, 1.02, 0.62), dry * 0.55);
        vec3 fn = normalize(cross(dFdx(vWP), dFdy(vWP)));
        diffuseColor.rgb *= mix(0.84, 1.0, smoothstep(0.62, 0.92, abs(fn.y)));
        float wl = -0.08 + 0.12 * sin(uT * 1.3 + vWP.x * 0.07 + vWP.z * 0.05);
        float foam = smoothstep(0.32, 0.04, abs(vWP.y - wl)) * (0.75 + 0.25 * tn(vWP.xz * 1.3 + uT * 0.6));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.97, 0.99, 1.0), foam * 0.8);
        // caustiques : la lumière ondoie sur le sol sous l'eau (rivage, grotte) —
        // réseau lumineux dense qui dérive lentement, net en plongée
        float uwF = smoothstep(-0.05, -0.4, vWP.y);
        if (uwF > 0.001) {
          float ca = pow(0.5 + 0.5 * sin(vWP.x * 0.84 + uT * 1.1 + sin(vWP.z * 0.74 - uT * 0.85) * 1.8), 5.0)
                   + pow(0.5 + 0.5 * sin(vWP.z * 0.70 - uT * 1.0 + sin(vWP.x * 0.62 + uT * 0.75) * 1.8), 5.0)
                   + pow(0.5 + 0.5 * sin((vWP.x + vWP.z) * 0.42 + uT * 0.6 + sin((vWP.x - vWP.z) * 0.52 - uT * 0.55) * 1.6), 5.0);
          diffuseColor.rgb += vec3(0.8, 0.93, 1.0) * ca * 0.42 * uwF * (1.0 - uNight);
        }`);
  };
  const terrain = new THREE.Mesh(geo, tmat);
  terrain.receiveShadow = true;
  terrainMeshRef = terrain;
  scene.add(terrain);

  // la mer : plan détaillé autour de l'île — houle animée sommet par sommet et
  // profondeur réelle par sommet (turquoise au rivage, bleu profond au large) —
  // prolongé par 4 bandes lointaines jusqu'à l'horizon
  const WSIZE = 1600, WSEG = 160, WOUT = 40000;
  const wg = new THREE.PlaneGeometry(WSIZE, WSIZE, WSEG, WSEG); wg.rotateX(-Math.PI / 2);
  {
    // distance au rivage : la côte plonge vite sous l'eau (quelques mètres de turquoise
    // seulement), on précalcule donc le rayon de côte par angle (recherche
    // dichotomique sur terrainH) puis la distance de chaque sommet à ce rivage.
    // Résultat : un lagon turquoise large qui suit la vraie forme de l'île.
    const COAST_A = 360;
    const coastR = new Float32Array(COAST_A);
    for (let a = 0; a < COAST_A; a++) {
      const th = a / COAST_A * Math.PI * 2;
      let lo = 200, hi = 700;
      for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (terrainH(Math.cos(th) * m, Math.sin(th) * m) > 0) lo = m; else hi = m; }
      coastR[a] = (lo + hi) / 2;
    }
    const p = wg.attributes.position, dep = new Float32Array(p.count), sho = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      dep[i] = Math.min(8, Math.max(0, -terrainH(x, z)));
      const th = Math.atan2(z, x);
      const ci = ((th / (Math.PI * 2) * COAST_A) + COAST_A) % COAST_A;
      sho[i] = Math.min(280, Math.abs(Math.hypot(x, z) - coastR[ci | 0]));
    }
    wg.setAttribute('aDepth', new THREE.BufferAttribute(dep, 1));
    wg.setAttribute('aShore', new THREE.BufferAttribute(sho, 1));
  }
  // « vraie eau » : houle multi-échelles animée, reflet du ciel par fresnel,
  // tache du soleil qui scintille, turquoise près du rivage -> bleu profond au large.
  // WSKY : les couleurs du ciel y sont copiées à chaque tick du cycle jour/nuit —
  // l'eau reflète le ciel réel (nuit, aube, crépuscule) au lieu d'un midi figé.
  // DoubleSide : la surface se voit aussi d'en dessous (fenêtre de Snell en plongée).
  // depthWrite: false — l'eau n'écrit pas dans le depth buffer, sinon le post-traitement
  // de contour dessinerait un trait noir sur la ligne de flottaison vue d'en dessous.
  const wmat = new THREE.MeshStandardMaterial({ color: 0x1e9fd8, roughness: 0.1, metalness: 0.28, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthWrite: false });
  wmat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = waterT;
    sh.uniforms.uTop = { value: WSKY.top };
    sh.uniforms.uMid = { value: WSKY.mid };
    sh.uniforms.uSun = { value: WSKY.sun };
    sh.uniforms.uNight = WSKY.night; // objet partagé : la valeur se propage à chaque tick jour/nuit
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWP; varying float vDepth; varying float vShore; varying float vWave; uniform float uT; attribute float aDepth; attribute float aShore;
        // houle : les sommets sont réellement déplacés — 4 trains de vagues
        // directionnelles d'angles et longueurs différents + clapot court déformé
        // par la houle (le petit détail suit les grosses crêtes, comme en mer)
        float waveH(vec2 p, float t) {
          float h = sin(dot(p, vec2(0.096, 0.041)) + t * 1.05) * 0.180
                  + sin(dot(p, vec2(-0.071, 0.066)) - t * 0.88) * 0.150
                  + sin(dot(p, vec2(0.047, -0.089)) + t * 1.32) * 0.110
                  + sin(dot(p, vec2(-0.052, -0.058)) + t * 1.71) * 0.070;
          vec2 q = p + vec2(sin(p.y * 0.023 + t * 0.4), sin(p.x * 0.019 - t * 0.33)) * 6.0;
          h += sin(dot(q, vec2(0.213, -0.187)) + t * 2.4) * 0.038
             + sin(dot(q, vec2(-0.249, -0.144)) - t * 2.9) * 0.028;
          return h;
        }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vDepth = aDepth; vShore = aShore;
        // vagues plus molles près du rivage pour ne pas percer la plage ;
        // la houle s'amortit aussi vers le bord du plan détaillé (800 m) pour
        // se raccorder sans couture aux bandes lointaines, plates, de l'horizon
        float wwh = waveH(transformed.xz, uT) * clamp(aDepth / 1.6, 0.12, 1.0)
                  * (1.0 - smoothstep(660.0, 780.0, max(abs(transformed.x), abs(transformed.z))));
        transformed.y += wwh; vWave = wwh;`)
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vWP; varying float vDepth; varying float vShore; varying float vWave; uniform float uT; uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uSun; uniform float uNight;
      // bruit doux pour l'écume animée du rivage
      float wth(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float wtn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(wth(i), wth(i + vec2(1.0, 0.0)), f.x), mix(wth(i + vec2(0.0, 1.0)), wth(i + vec2(1.0, 1.0)), f.x), f.y); }
      // houle fine vue par pixel : gradient analytique -> normales détaillées,
      // indépendantes du maillage (~10 m par sommet), orientées comme la houle
      // qui déplace les sommets
      vec2 swellGrad(vec2 p, float t) {
        vec2 g = vec2(0.0);
        g += vec2(0.096, 0.041) * 0.180 * cos(dot(p, vec2(0.096, 0.041)) * 3.1 + t * 1.35);
        g += vec2(-0.071, 0.066) * 0.150 * cos(dot(p, vec2(-0.071, 0.066)) * 3.4 - t * 1.12);
        g += vec2(0.047, -0.089) * 0.110 * cos(dot(p, vec2(0.047, -0.089)) * 4.6 + t * 1.9);
        // clapot : trains courts entrecroisés
        g += vec2(0.213, -0.187) * 0.038 * cos(dot(p, vec2(0.213, -0.187)) * 9.5 + t * 2.6);
        g += vec2(-0.249, -0.144) * 0.028 * cos(dot(p, vec2(-0.249, -0.144)) * 8.7 - t * 3.1);
        return g;
      }
      // petit ciel procédural (mêmes teintes que le dôme, mises à jour par le cycle
      // jour/nuit) pour le reflet de l'eau
      vec3 skyCol(vec3 dir) {
        vec3 top = uTop, mid = uMid;
        vec3 sd = normalize(uSun);
        vec3 c = mix(mid, top, smoothstep(0.05, 0.75, max(dir.y, 0.0)));
        float g = max(dot(normalize(dir), sd), 0.0);
        vec3 gc = mix(vec3(1.0, 0.72, 0.42), vec3(1.0, 0.95, 0.82), smoothstep(0.05, 0.5, sd.y));
        c += gc * (pow(g, 6.0) * 0.3 + pow(g, 48.0) * 0.6) * (1.0 - uNight * 0.9);
        return c;
      }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        // houle : gradient analytique + clapot fin en bruit, plus marqué vu de
        // dessus (l'éclat des vagues) que depuis le fond
        vec2 swg = swellGrad(vWP.xz, uT);
        float r1 = wtn(vWP.xz * 1.4 + vec2(uT * 0.55, -uT * 0.42)) - 0.5;
        float r2 = wtn(vWP.xz * 1.4 + vec2(31.0 - uT * 0.42, uT * 0.5)) - 0.5;
        vec3 nPert = normalize(vec3(-(swg.x + (r1 - r2) * 0.06), 1.0, -(swg.y + (r1 + r2) * 0.06)));
        normal = normalize(mix(normal, (viewMatrix * vec4(nPert, 0.0)).xyz, gl_FrontFacing ? 0.85 : 0.4));`)
      .replace('#include <opaque_fragment>', `
        vec3 V = normalize(cameraPosition - vWP);
        if (gl_FrontFacing) {
          // vue de dessus
          vec3 N = normalize(normal);
          // couleur d'après la VRAIE profondeur sous la surface (attribut par
          // sommet) : turquoise sur les hauts-fonds, cyan puis bleu profond
          float depthF = smoothstep(0.6, 7.0, vDepth);
          float shoreF = smoothstep(15.0, 190.0, vShore);
          vec3 base = mix(vec3(0.23, 0.78, 0.71), vec3(0.05, 0.44, 0.60), depthF);
          base = mix(base, vec3(0.012, 0.155, 0.36), shoreF) * (1.0 - uNight * 0.62);
          // dispersion : la lumière traverse les crêtes face au soleil (teinte émeraude)
          float sss = clamp(dot(normalize(uSun), -N) * 0.5 + 0.5, 0.0, 1.0);
          base += vec3(0.02, 0.11, 0.08) * sss * (1.0 - depthF) * (1.0 - uNight);
          // reflet du ciel : fresnel de Schlick (F0 de l'eau = 0,02)
          vec3 R = reflect(-V, N);
          R.y = abs(R.y);
          vec3 refl = skyCol(R);
          float fres = 0.02 + 0.98 * pow(1.0 - max(dot(V, N), 0.0), 5.0);
          // chemin du soleil : tache spéculaire serrée + halo qui scintille
          vec3 sunDir = normalize(uSun);
          float sg2 = max(dot(R, sunDir), 0.0);
          float glint = (pow(sg2, 900.0) * 4.5 + pow(sg2, 90.0) * 0.5 + pow(sg2, 18.0) * 0.08) * (1.0 - uNight * 0.85);
          // moutons : écume sur les crêtes de houle + écume animée du rivage
          float crest = smoothstep(0.14, 0.30, vWave) * (0.5 + 0.5 * wtn(vWP.xz * 1.6 + uT * 0.35));
          float foamW = smoothstep(14.0, 2.0, vShore) * (0.4 + 0.6 * wtn(vWP.xz * 0.85 + vec2(uT * 0.45, -uT * 0.3)));
          float foam = clamp(crest * 0.85 + foamW, 0.0, 1.0);
          outgoingLight = mix(outgoingLight, base, 0.78);
          outgoingLight = mix(outgoingLight, refl, clamp(fres * 1.08, 0.0, 1.0));
          outgoingLight += vec3(1.0, 0.95, 0.78) * glint;
          outgoingLight = mix(outgoingLight, vec3(0.96, 0.99, 1.0), foam * 0.7);
          float distF = clamp(length(vWP.xz) / 230.0, 0.0, 1.0);
          outgoingLight = mix(outgoingLight, outgoingLight * vec3(0.55, 0.75, 1.0), smoothstep(0.75, 1.0, distF));
        } else {
          // vue du dessous (plongée) : la surface est un miroir bleu-vert ; en levant
          // les yeux, une fenêtre de Snell laisse voir le ciel plus clair — son bord
          // ondule avec la houle (réfraction) — et le soleil y imprime une tache
          // douce qui ondule ; sous l'horizon, réflexion totale interne du fond
          vec3 vd = normalize(vWP - cameraPosition);
          float up = clamp(vd.y, 0.0, 1.0);
          float wob = sin(vWP.x * 0.5 + uT * 1.2) * 0.5 + sin(vWP.z * 0.43 - uT * 0.9) * 0.5;
          float snell = smoothstep(0.32 + wob * 0.06, 0.86, up);
          vec3 under = mix(vec3(0.07, 0.28, 0.38), skyCol(normalize(vec3(vd.x, 0.45, vd.z))) * 0.9 + vec3(0.03), snell);
          float sg3 = max(dot(normalize(vec3(vd.x, 0.25, vd.z)), normalize(uSun)), 0.0);
          under += vec3(1.0, 0.95, 0.8) * pow(sg3, 24.0) * 0.5 * (1.0 - uNight * 0.9);
          under = mix(under, vec3(0.05, 0.21, 0.27), smoothstep(0.15, 0.0, up) * 0.55);
          under *= 0.86 + 0.14 * 0.5 * (sin(vWP.x * 0.31 + uT * 1.35) + sin(vWP.z * 0.27 - uT * 1.1));
          outgoingLight = under;
          diffuseColor.a = 1.0;
        }
        #include <opaque_fragment>`);
  };
  const water = new THREE.Mesh(wg, wmat);
  waterMatRef = wmat;
  scene.add(water);
  // 4 bandes lointaines (profondeur « océan » constante) prolongent la mer jusqu'à l'horizon ;
  // géométries translatées pour que coordonnées locales = coordonnées monde (houle continue)
  {
    const half = WSIZE / 2, len = WOUT - half;
    const strip = (w, h, x, z) => {
      const g = new THREE.PlaneGeometry(w, h, 1, 1); g.rotateX(-Math.PI / 2); g.translate(x, 0, z);
      g.setAttribute('aDepth', new THREE.BufferAttribute(new Float32Array(4).fill(8), 1));
      g.setAttribute('aShore', new THREE.BufferAttribute(new Float32Array(4).fill(280), 1));
      scene.add(new THREE.Mesh(g, wmat));
    };
    strip(WOUT, len, 0, -(half + len / 2)); strip(WOUT, len, 0, half + len / 2);
    strip(len, WSIZE, -(half + len / 2), 0); strip(len, WSIZE, half + len / 2, 0);
  }
  // fond marin opaque sous toute la mer : sans lui, l'eau translucide laissait voir le ciel au-delà du
  // carré de terrain et formait une bande bleu clair. Même teinte que le fond du terrain => mer uniforme.
  // y = -6 : EXACTEMENT la hauteur du fond du terrain au bord du maillage — sinon la marche de
  // profondeur (0,6 m) était repérée par le post-traitement de contour qui dessinait une
  // ligne noire en plein océan, tout autour de l'île, à la limite du terrain.
  const sg = new THREE.PlaneGeometry(80000, 80000, 1, 1); sg.rotateX(-Math.PI / 2);
  const sbedMat = new THREE.MeshStandardMaterial({ color: 0xd2bf86, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: 6, polygonOffsetUnits: 6 });
  // caustiques : la lumière ondoie sur le fond marin (visible en plongée et à travers l'eau)
  sbedMat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = waterT; sh.uniforms.uNight = WSKY.night;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vWP; uniform float uT; uniform float uNight;
      float caustic(vec3 p) {
        return pow(0.5 + 0.5 * sin(p.x * 0.84 + uT * 1.1 + sin(p.z * 0.74 - uT * 0.85) * 1.8), 5.0)
             + pow(0.5 + 0.5 * sin(p.z * 0.70 - uT * 1.0 + sin(p.x * 0.62 + uT * 0.75) * 1.8), 5.0)
             + pow(0.5 + 0.5 * sin((p.x + p.z) * 0.42 + uT * 0.6 + sin((p.x - p.z) * 0.52 - uT * 0.55) * 1.6), 5.0);
      }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb += vec3(0.8, 0.93, 1.0) * caustic(vWP) * 0.45 * (1.0 - uNight);`);
  };
  const seabed = new THREE.Mesh(sg, sbedMat);
  seabed.position.y = -6; scene.add(seabed);
}

// =====================================================================
// Plongée : VOLUME d'eau visible sous la surface — particules en suspension
// (neige marine) + rais de lumière qui descendent du ciel. Brouillard bleu
// dense déjà géré par la caméra (camUnderwater). Tout n'est visible qu'immergé.
// =====================================================================
const UW_FOG_NEAR = 0.1, UW_FOG_FAR = 20; // assez dense : le fond se fond dans l'eau à ~6 m
const UW_N = 130;
const uwPos = new Float32Array(UW_N * 3);
const uwSeed = [];
for (let i = 0; i < UW_N; i++) uwSeed.push({ x: MR() * 34 - 17, y: MR() * 7 - 5.2, z: MR() * 34 - 17, vx: 0.14 + MR() * 0.22, vy: -(0.04 + MR() * 0.1), vz: 0.1 + MR() * 0.2, ph: MR() * 9 });
const uwGeo = new THREE.BufferGeometry();
uwGeo.setAttribute('position', new THREE.BufferAttribute(uwPos, 3));
const uwMat = new THREE.PointsMaterial({ color: 0xd4f0f7, size: 0.055, sizeAttenuation: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, map: canvasTex((g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }, 64), alphaTest: 0.01 });
const uwPts = new THREE.Points(uwGeo, uwMat);
uwPts.frustumCulled = false; uwPts.visible = false; uwPts.renderOrder = 5;
scene.add(uwPts);
const uwWrap = (v, r) => { v = (v + r) % (2 * r); return v - r; };
// rais : plans verticaux additifs dégradés, plus présents du côté du soleil
const uwRayTex = canvasTex((g, s) => {
  const gr = g.createLinearGradient(0, 0, 0, s);
  // fondu en haut ET en bas : le bord supérieur du plan ne doit jamais tracer
  // une arête lumineuse dure sous la surface (vu en plongée)
  gr.addColorStop(0, 'rgba(198,236,255,0)');
  gr.addColorStop(0.16, 'rgba(198,236,255,0.55)');
  gr.addColorStop(0.55, 'rgba(150,215,240,0.16)');
  gr.addColorStop(1, 'rgba(150,215,240,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  // bords horizontaux fondus pour ne jamais voir de rectangle net
  const gw = g.createLinearGradient(0, 0, s, 0);
  gw.addColorStop(0, 'rgba(0,0,0,1)'); gw.addColorStop(0.25, 'rgba(0,0,0,0)');
  gw.addColorStop(0.75, 'rgba(0,0,0,0)'); gw.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = gw; g.fillRect(0, 0, s, s);
}, 128);
const UW_RAYS = 6;
const uwRays = [];
for (let i = 0; i < UW_RAYS; i++) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2 + (i % 3) * 1.3, 8.4),
    new THREE.MeshBasicMaterial({ map: uwRayTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })
  );
  m.position.y = -4.7; // haut du rais sous la surface (-0,3) jusqu'au fond
  m.visible = false; m.renderOrder = 4;
  scene.add(m);
  uwRays.push({ m, r: 4 + MR() * 10, av: (MR() - 0.5) * 0.05, ph: MR() * 9 });
}
function updateUnderwaterFX() {
  const on = camUnderwater;
  uwMat.opacity = on ? 0.5 * (1 - nightF * 0.75) : 0;
  uwPts.visible = on;
  for (const r of uwRays) r.m.visible = on;
  // les nuages sont des sprites sans brouillard triés « plus proches » que le
  // plan d'eau : sous l'eau ils se dessineraient PAR-DESSUS la surface (fantômes
  // blancs). Physiquement, depuis le fond, on ne les voit pas (réflexion totale
  // interne) — on les masque en plongée.
  for (const c of clouds) c.visible = !on;
  if (!on) return;
  const t = waterT.value;
  const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
  // particules : dérive lente, repliées dans une boîte autour de la caméra
  for (let i = 0; i < UW_N; i++) {
    const s = uwSeed[i];
    uwPos[i * 3] = cx + uwWrap(s.x + t * s.vx, 8.5) + Math.sin(t * 0.4 + s.ph) * 0.5;
    uwPos[i * 3 + 1] = Math.min(-0.1, cy + uwWrap(s.y + t * s.vy, 3.0));
    uwPos[i * 3 + 2] = cz + uwWrap(s.z + t * s.vz, 8.5) + Math.cos(t * 0.37 + s.ph * 1.3) * 0.5;
  }
  uwGeo.attributes.position.needsUpdate = true;
  // rais : autour de la caméra, plus forts du côté du soleil, face à la caméra
  const sunA = Math.atan2(WSKY.sun.x, WSKY.sun.z);
  for (let i = 0; i < UW_RAYS; i++) {
    const r = uwRays[i];
    const a = sunA + Math.sin(t * 0.07 + r.ph) * 1.5 + (i - (UW_RAYS - 1) / 2) * 0.55;
    const rr = r.r * (0.7 + 0.3 * Math.sin(t * 0.11 + r.ph * 2.1));
    const x = cx + Math.sin(a) * rr, z = cz + Math.cos(a) * rr;
    r.m.position.x = x; r.m.position.z = z;
    r.m.rotation.y = Math.atan2(cx - x, cz - z);
    r.m.material.opacity = (0.38 + 0.20 * Math.sin(t * 0.5 + r.ph)) * (1 - nightF) * (0.4 + 0.6 * Math.max(WSKY.sun.y, 0));
  }
}

// =====================================================================
// DÉCORS LOINTAINS (hors map) : îles à relief et plages, pitons rocheux, arches, icebergs, phares,
// chaînes de montagnes à l'horizon. Purement visuels (aucun collider) : les joueurs
// restent bloqués à WORLD_R. Tout est fusionné en 3 maillages (relief lisse, détails facettés,
// écume/lagon translucides) => 3 appels de rendu. Les couleurs sont fondues vers la brume de
// l'horizon avec la distance (perspective atmosphérique).
// =====================================================================
{
  const FR = mulberry32(20261030);
  const fr = (a = 1, b) => (b === undefined ? FR() * a : a + FR() * (b - a));
  const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mixN = (a, b, t) => a + (b - a) * t;
  const HAZE = new THREE.Color(0xc4e4f7);
  let HZ = 0; // part de brume appliquée aux couleurs en cours de création
  const hazeFor = (d, mx = 0.7) => Math.pow(Math.min(1, Math.max(0, (d - 450) / 5200)), 0.85) * mx;
  const _c = new THREE.Color(), _c2 = new THREE.Color();
  const colOf = (hex) => _c.setHex(hex);
  // ---- tampons ----
  const T = { p: [], c: [], i: [] };                 // relief lisse (indexé)
  const PR = { p: [], c: [] };                       // détails facettés (non indexé)
  const FO = { p: [], c: [], i: [] };                // écume / lagon (RGBA)
  function pushCol(arr, c, j = 1) { arr.push(c.r * j, c.g * j, c.b * j); }
  function hazeCol(c) { return HZ > 0 ? c.lerp(HAZE, HZ) : c; }
  // ---- primitives pour les détails (non indexées) ----
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _sc = new THREE.Vector3();
  const mk = {
    cyl: (seg) => new THREE.CylinderGeometry(1, 1, 1, seg, 1).translate(0, 0.5, 0),
    cone: (seg) => new THREE.ConeGeometry(1, 1, seg, 1).translate(0, 0.5, 0),
    box: () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    ico: (d) => new THREE.IcosahedronGeometry(1, d),
  };
  const gcache = {};
  const geo = (k, s) => gcache[k + s] || (gcache[k + s] = (() => { const g = mk[k](s); return g.index ? g.toNonIndexed() : g; })());
  function add(kind, seg, x, y, z, sx, sy, sz, hex, ry = 0, rx = 0, rz = 0, jit = 0.06) {
    const g = geo(kind, seg), pa = g.attributes.position;
    _e.set(rx, ry, rz); _q.setFromEuler(_e); _p.set(x, y, z); _sc.set(sx, sy, sz); _m.compose(_p, _q, _sc);
    const base = new THREE.Color(hex);
    for (let f = 0; f < pa.count; f += 3) {            // une teinte par face (rendu facetté)
      const j = 1 - jit + FR() * jit * 2;
      _c2.copy(base).multiplyScalar(j); hazeCol(_c2);
      for (let k = 0; k < 3; k++) { _p.fromBufferAttribute(pa, f + k).applyMatrix4(_m); PR.p.push(_p.x, _p.y, _p.z); pushCol(PR.c, _c2); }
    }
  }
  function tri(a, b, c, hex, j = 0.05) { // triangle double face
    _c2.setHex(hex).multiplyScalar(1 - j + FR() * j * 2); hazeCol(_c2);
    for (const v of [a, b, c, c, b, a]) { PR.p.push(v[0], v[1], v[2]); pushCol(PR.c, _c2); }
  }
  // ---- relief polaire lisse ----
  // hf(x, z) -> hauteur ; cf(x, z, h, slope, out) -> couleur
  function polarMesh(cx, cz, rcf, nr, ns, dnMax, hf, cf) {
    const base = T.p.length / 3;
    const tmp = new THREE.Color();
    for (let i = 0; i <= nr; i++) {
      const dn = dnMax * Math.pow(i / nr, 0.85);
      for (let j = 0; j < ns; j++) {
        const a = (j / ns) * Math.PI * 2, rho = dn * rcf(a);
        const x = cx + Math.cos(a) * rho, z = cz + Math.sin(a) * rho;
        const h = hf(x, z);
        const sl = (Math.abs(hf(x + 3, z) - h) + Math.abs(hf(x, z + 3) - h)) / 3;
        cf(x, z, h, sl, dn, tmp); hazeCol(tmp);
        T.p.push(x, h, z); pushCol(T.c, tmp);
      }
    }
    for (let i = 0; i < nr; i++) for (let j = 0; j < ns; j++) {
      const a = base + i * ns + j, b = base + i * ns + (j + 1) % ns, c = base + (i + 1) * ns + j, d = base + (i + 1) * ns + (j + 1) % ns;
      if (i === 0) T.i.push(a, c, d); else T.i.push(a, c, b, b, c, d);
    }
  }
  // anneau d'écume + lagon turquoise suivant le trait de côte (alpha déduit de la hauteur du relief)
  function shoreMesh(cx, cz, rcf, ns, dn0, dn1, rows, hf) {
    const base = FO.p.length / 3;
    for (let i = 0; i <= rows; i++) {
      const dn = mixN(dn0, dn1, i / rows);
      for (let j = 0; j < ns; j++) {
        const a = (j / ns) * Math.PI * 2, rho = dn * rcf(a), x = cx + Math.cos(a) * rho, z = cz + Math.sin(a) * rho;
        const h = hf(x, z);
        const foam = sst(-1.1, -0.08, h) * (1 - sst(0.05, 0.7, h));
        const lag = sst(-4.2, -0.3, h) * (1 - sst(-0.1, 0.4, h));
        const al = Math.max(foam * 0.9, lag * 0.42);
        const k = Math.min(1, foam * 1.2);
        _c2.setRGB(mixN(0.26, 1.0, k), mixN(0.82, 1.0, k), mixN(0.8, 1.0, k));
        // la couleur est en espace linéaire (comme le reste) : on la garde claire pour que la brume ne la délave pas
        FO.p.push(x, 0.07, z); FO.c.push(_c2.r, _c2.g, _c2.b, al * (1 - HZ * 0.6));
      }
    }
    for (let i = 0; i < rows; i++) for (let j = 0; j < ns; j++) {
      const a = base + i * ns + j, b = base + i * ns + (j + 1) % ns, c = base + (i + 1) * ns + j, d = base + (i + 1) * ns + (j + 1) % ns;
      FO.i.push(a, c, b, b, c, d);
    }
  }
  function foamDisc(x, z, r0, r1, a0 = 0.8, seg = 20) { // écume simple autour d'un piton / iceberg / bateau
    const base = FO.p.length / 3;
    for (let k = 0; k < 2; k++) for (let j = 0; j < seg; j++) {
      const a = (j / seg) * Math.PI * 2, r = k ? r1 : r0;
      FO.p.push(x + Math.cos(a) * r, 0.07, z + Math.sin(a) * r); FO.c.push(1, 1, 1, k ? 0 : a0 * (1 - HZ * 0.6));
    }
    for (let j = 0; j < seg; j++) { const a = base + j, b = base + (j + 1) % seg, c = base + seg + j, d = base + seg + (j + 1) % seg; FO.i.push(a, c, b, b, c, d); }
  }
  // ---- végétation ----
  const CONIF = [0x2f8f46, 0x3aa052, 0x287a3c, 0x4aa64a];
  const BROAD = [0x5cb348, 0x4aa13c, 0x7bc652, 0x68b845];
  function conifer(x, y, z, k, snow = false) {
    const g = CONIF[Math.floor(fr(CONIF.length))];
    add('cyl', 5, x, y, z, 0.3 * k, 1.5 * k, 0.3 * k, 0x6b4a2b);
    add('cone', 7, x, y + 0.9 * k, z, 1.7 * k, 2.6 * k, 1.7 * k, g, fr(6));
    add('cone', 7, x, y + 2.4 * k, z, 1.3 * k, 2.4 * k, 1.3 * k, g, fr(6));
    add('cone', 7, x, y + 3.8 * k, z, 0.85 * k, 2.2 * k, 0.85 * k, g, fr(6));
    if (snow) add('cone', 7, x, y + 4.6 * k, z, 0.62 * k, 1.4 * k, 0.62 * k, 0xf4f8ff, fr(6));
  }
  function broadleaf(x, y, z, k) {
    add('cyl', 5, x, y, z, 0.32 * k, 2.2 * k, 0.32 * k, 0x7a5a38);
    const g = BROAD[Math.floor(fr(BROAD.length))];
    add('ico', 0, x, y + 3.2 * k, z, 1.9 * k, 1.5 * k, 1.9 * k, g, fr(6));
    add('ico', 0, x + fr(-0.8, 0.8) * k, y + 4.1 * k, z + fr(-0.8, 0.8) * k, 1.35 * k, 1.15 * k, 1.35 * k, BROAD[Math.floor(fr(BROAD.length))], fr(6));
  }
  function palm(x, y, z, k) {
    const lean = fr(-0.35, 0.35), dir = fr(6.28), hh = 1.5 * k;
    let px = x, py = y, pz = z;
    for (let s = 0; s < 3; s++) { // tronc légèrement courbé
      add('cyl', 5, px, py, pz, 0.26 * k * (1 - s * 0.15), hh, 0.26 * k * (1 - s * 0.15), 0x8a6a44, 0, Math.sin(dir) * lean * 0.5, Math.cos(dir) * lean * 0.5);
      px += Math.cos(dir) * lean * hh * 0.5; pz += Math.sin(dir) * lean * hh * 0.5; py += hh * 0.97;
    }
    for (let i = 0; i < 7; i++) {
      const a = i * (Math.PI * 2 / 7) + fr(0.3);
      add('box', 0, px + Math.cos(a) * 0.5 * k, py - 0.15 * k, pz + Math.sin(a) * 0.5 * k, 2.7 * k, 0.1 * k, 0.6 * k, i % 2 ? 0x3f9f43 : 0x54b04a, -a, 0, -0.5);
    }
    add('ico', 0, px, py - 0.1 * k, pz, 0.28 * k, 0.28 * k, 0.28 * k, 0x6b4a2b);
  }
  function cactus(x, y, z, k) { add('cyl', 6, x, y, z, 0.35 * k, 3 * k, 0.35 * k, 0x3f8f4a); add('cyl', 5, x + 0.5 * k, y + 1.2 * k, z, 0.2 * k, 1.1 * k, 0.2 * k, 0x3f8f4a); }
  function boulder(x, y, z, k, hex) { add('ico', 0, x, y, z, k * 1.3, k * 0.8, k, hex, fr(6)); }
  // ---- piton rocheux facetté ----
  function spire(x, z, R, H, cap) {
    const rings = 7, seg = 8, ph = fr(6.28), pts = [];
    for (let r = 0; r <= rings; r++) {
      const t = r / rings, y = mixN(-6.5, H, t), rad = R * (1 - Math.pow(t, 1.15) * 0.88) * (r === rings ? 0.18 : 1);
      const ring = [];
      for (let s = 0; s < seg; s++) { const a = ph + (s / seg) * Math.PI * 2, jr = rad * (0.78 + FR() * 0.44); ring.push([x + Math.cos(a) * jr, y + (FR() - 0.5) * 1.2, z + Math.sin(a) * jr]); }
      pts.push(ring);
    }
    for (let r = 0; r < rings; r++) for (let s = 0; s < seg; s++) {
      const a = pts[r][s], b = pts[r][(s + 1) % seg], c = pts[r + 1][s], d = pts[r + 1][(s + 1) % seg];
      const yy = (a[1] + c[1]) * 0.5, hex = yy < 1.2 ? 0x565b62 : (s % 2 ? 0x8e9196 : 0x7c8189);
      tri(a, c, b, hex); tri(b, c, d, hex);
    }
    if (cap) {
      const top = pts[rings - 1];
      for (let s = 0; s < seg; s++) tri([x, H + 0.3, z], top[s], top[(s + 1) % seg], 0x6cc04a);
      conifer(x, H - 0.2, z, fr(0.8, 1.3));
    }
  }
  // ---- îles ----
  function island(cx, cz, R, type) {
    const seed = fr(300), dist = Math.hypot(cx, cz);
    HZ = hazeFor(dist, 0.62);
    const rcf = (a) => R * (0.82 + 0.34 * vnoise(Math.cos(a) * 1.7 + seed, Math.sin(a) * 1.7 + seed * 0.7));
    const Hrel = (type === 'rock' ? fr(26, 46) : type === 'snow' ? fr(30, 60) : type === 'sand' ? fr(6, 12) : fr(14, 34)) * (0.55 + R / 140);
    const hf = (x, z) => {
      const dx = x - cx, dz = z - cz, rho = Math.hypot(dx, dz), a = Math.atan2(dz, dx), dn = rho / rcf(a);
      const land = sst(0.98, 0.70, dn);
      let h = -6.5 + 7.5 * Math.pow(land, 0.92);
      const ridge = Math.pow(1 - Math.abs(2 * fbm(x * 0.013 + seed, z * 0.013 + seed) - 1), type === 'rock' || type === 'snow' ? 1.4 : 2.2);
      const hills = fbm(x * 0.02 + seed * 1.3, z * 0.02 + seed);
      let rel = type === 'sand' ? (0.4 + 0.6 * hills) * (0.6 + 0.4 * Math.sin(x * 0.07 + z * 0.04 + seed * 3)) : (0.45 * hills + 0.7 * ridge);
      rel *= Hrel * sst(0.74, 0.12, dn);
      h += rel * sst(0.05, 0.6, land) + 0.7 * (fbm(x * 0.13, z * 0.13) - 0.5) * land;
      return h;
    };
    const cf = (x, z, h, sl, dn, out) => {
      const n = fbm(x * 0.06, z * 0.06), n2 = fbm(x * 0.017 + 5, z * 0.017);
      if (h < -0.6) { out.setHex(h < -3 ? 0xc9b57c : 0xddca90); return; }
      if (type === 'rock') {
        out.setHex(h < 1.4 + n ? 0xe2d3a0 : (Math.floor(h * 0.45 + n * 2) % 2 ? 0x8e9196 : 0x7a7f87)); if (h > Hrel * 0.62) out.lerp(_c2.setHex(0xa8a39a), 0.5); return;
      }
      if (type === 'sand') { out.setHex(h < 1.2 + n * 0.6 ? 0xf0dc9c : 0xe8c47a).lerp(_c2.setHex(0xd2a05a), sst(0.35, 0.8, n2) * 0.5); if (sl > 0.55) out.lerp(_c2.setHex(0xb08a56), 0.5); return; }
      // plage -> prairie -> forêt -> roche -> neige
      if (h < 1.5 + n * 0.9) out.setHex(h < 0.7 ? 0xe3d194 : 0xf0dc9c);
      else if (type === 'snow') out.setHex(0x9db890).lerp(_c2.setHex(0xf4f8ff), sst(0.1, 0.35, (h - 3) / Hrel + n * 0.2));
      else {
        out.setHex(0x76cc4a).lerp(_c2.setHex(0x4fae3f), n); out.lerp(_c2.setHex(0x2f8a3c), sst(0.4, 0.8, n2) * 0.55);
        out.lerp(_c2.setHex(0xb59a62), sst(0.62, 0.9, (h - 1.5) / Hrel) * 0.55); // sommet sec
      }
      if (sl > 0.7) out.lerp(_c2.setHex(0x8e9196), Math.min(1, (sl - 0.7) * 1.6));
      if (type === 'snow' && h > Hrel * 0.75) out.lerp(_c2.setHex(0xffffff), 0.7);
    };
    const ns = R > 90 ? 84 : 64;
    polarMesh(cx, cz, rcf, 26, ns, 1.35, hf, cf);
    shoreMesh(cx, cz, rcf, ns * 2, 0.62, 1.22, 22, hf);
    // végétation / rochers posés sur le relief
    const count = type === 'rock' ? 12 : Math.floor(R * (type === 'sand' ? 0.25 : 0.9));
    for (let t = 0, n = 0; n < count && t < count * 6; t++) {
      const a = fr(Math.PI * 2), dn = Math.sqrt(FR()) * 0.74, x = cx + Math.cos(a) * dn * rcf(a), z = cz + Math.sin(a) * dn * rcf(a);
      const h = hf(x, z), sl = (Math.abs(hf(x + 2, z) - h) + Math.abs(hf(x, z + 2) - h)) / 2;
      if (h < 1.3 || sl > 0.65) continue;
      const clump = fbm(x * 0.03 + seed, z * 0.03); if (type !== 'sand' && clump < 0.4) continue;
      const k = fr(1.5, 2.8);
      if (type === 'sand') { if (FR() < 0.5) palm(x, h - 0.2, z, k); else cactus(x, h - 0.1, z, k); }
      else if (type === 'snow') { if (h < Hrel * 0.8) conifer(x, h - 0.2, z, k, true); }
      else if (type === 'rock') boulder(x, h, z, fr(1.5, 4), 0x7c8189);
      else if (h < 4.5 && FR() < 0.35) palm(x, h - 0.2, z, k); else if (FR() < 0.62) conifer(x, h - 0.2, z, k); else broadleaf(x, h - 0.2, z, k * 1.1);
      n++;
    }
    for (let t = 0; t < 10; t++) { // rochers de plage
      const a = fr(Math.PI * 2), rr = rcf(a) * fr(0.66, 0.8), x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = hf(x, z);
      if (h > -0.3 && h < 1.8) boulder(x, h - 0.1, z, fr(0.8, 2.2), 0x8e9196);
    }
    return { hf, rcf, Hrel };
  }
  function lighthouse(isl, cx, cz, R) {
    let best = null;
    for (let t = 0; t < 40; t++) { const a = fr(6.28), r = R * fr(0.1, 0.5), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, h = isl.hf(x, z); if (!best || h > best.h) best = { x, z, h }; }
    const { x, z, h } = best;
    add('cyl', 10, x, h - 0.3, z, 5.5, 3, 5.5, 0xd8d3c8);                 // maison du gardien
    add('cone', 10, x, h + 2.7, z, 6.2, 2.6, 6.2, 0xb53030);
    for (let k = 0; k < 4; k++) add('cyl', 12, x + 5, h - 0.3 + k * 4.4, z, 3.1 - k * 0.32, 4.4, 3.1 - k * 0.32, k % 2 ? 0xd94040 : 0xf6f4ee);
    add('cyl', 12, x + 5, h + 17.3, z, 3.2, 0.7, 3.2, 0x44484f);          // galerie
    add('cyl', 10, x + 5, h + 18, z, 1.9, 2.6, 1.9, 0xfff0a8);            // lanterne
    add('cone', 10, x + 5, h + 20.6, z, 2.6, 2.6, 2.6, 0xb53030);
  }
  // ---- création ----
  const typesPool = ['green', 'green', 'green', 'green', 'sand', 'rock', 'snow', 'green'];
  const spots = [];
  function spot(r, dMin, dMax, tries = 80) {
    for (let t = 0; t < tries; t++) {
      const a = fr(Math.PI * 2), d = 420 + fr(dMin, dMax) + r; // 420 = rayon max. de la côte ; dMin/dMax = écart au-delà du rivage
      const x = Math.cos(a) * d * OVAL_X, z = Math.sin(a) * d * OVAL_Z;
      if (spots.every((o) => Math.hypot(o.x - x, o.z - z) > o.r + r + 30)) { spots.push({ x, z, r }); return { x, z, a }; }
    }
    return null;
  }
  // ---- chaînes de montagnes à l'horizon (relief en crêtes, brume forte) ----
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2 + fr(-0.2, 0.2), d = fr(4300, 6800), R = fr(900, 1700), Hm = fr(420, 950), seed = fr(500);
    const mx = Math.cos(a) * d, mz = Math.sin(a) * d; HZ = hazeFor(d, 0.72);
    const rcf = (an) => R * (0.8 + 0.4 * vnoise(Math.cos(an) * 1.3 + seed, Math.sin(an) * 1.3 + seed));
    const hf = (x, z) => {
      const dn = Math.hypot(x - mx, z - mz) / rcf(Math.atan2(z - mz, x - mx));
      const mask = sst(1.0, 0.05, dn);
      const ridge = Math.pow(1 - Math.abs(2 * fbm(x * 0.0035 + seed, z * 0.0035 + seed) - 1), 1.5);
      const det = fbm(x * 0.012 + seed, z * 0.012);
      return -6.5 + (Hm * Math.pow(mask, 1.25)) * (0.35 + 0.7 * ridge) * (0.85 + 0.3 * det);
    };
    const cf = (x, z, h, sl, dn, out) => {
      const t = (h + 6.5) / Hm;
      out.setHex(t < 0.18 ? 0x3d7b4a : t < 0.4 ? 0x6e8a6a : 0x7d838d).lerp(_c2.setHex(0x9aa0a8), sst(0.4, 0.7, t) * 0.5);
      if (t > 0.5 && sl < 1.6) out.lerp(_c2.setHex(0xffffff), sst(0.5, 0.7, t + (fbm(x * 0.01, z * 0.01) - 0.5) * 0.3) * 0.95);
      if (sl > 1.4) out.lerp(_c2.setHex(0x6c727b), 0.4);
    };
    polarMesh(mx, mz, rcf, 30, 72, 1.15, hf, cf);
  }
  HZ = 0;
  // ---- assemblage ----
  const mats = (smooth) => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: !smooth, roughness: 0.95 });
  const addMesh = (p, c, idx, material, order = 0) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, c === FO.c ? 4 : 3));
    if (idx) g.setIndex(idx);
    g.computeVertexNormals(); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, material); m.frustumCulled = false; m.matrixAutoUpdate = false; m.renderOrder = order; scene.add(m);
  };
  addMesh(T.p, T.c, T.i, mats(true));
  addMesh(PR.p, PR.c, null, mats(false));
  addMesh(FO.p, FO.c, FO.i, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 2);
}

// Clouds — cumulus volumétriques très hauts, très gros, dérive lente au vent
const clouds = [];
{
  // texture de "puff" douce générée à la volée (pas d'image externe)
  const tex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const puff = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); };
    puff(128, 132, 118, .95); puff(82, 148, 78, .8); puff(178, 146, 84, .8);
    puff(128, 106, 68, .9); puff(58, 158, 52, .7); puff(202, 158, 52, .7);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const n = 15;
  for (let i = 0; i < n; i++) {
    const grp = new THREE.Group();
    const puffs = randi(10, 15);
    const W = rand(140, 260); // demi-largeur de l'amas
    for (let k = 0; k < puffs; k++) {
      const t = k / (puffs - 1) - 0.5;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: rand(0.5, 0.85), depthWrite: false, fog: false,
        color: new THREE.Color(1, 1, 1).lerp(new THREE.Color(0.82, 0.87, 0.96), rand(0, 0.6)),
      }));
      s.position.set(t * W * 2 + rand(-18, 18), rand(-12, 12) + Math.cos(t * Math.PI) * 8, rand(-28, 28));
      const w = rand(130, 230); s.scale.set(w, w * rand(0.45, 0.62), 1);
      grp.add(s);
    }
    const a = rand(Math.PI * 2), r = rand(60, 980);
    grp.position.set(Math.cos(a) * r, rand(290, 410), Math.sin(a) * r);
    grp.userData.wind = rand(1.1, 2.4);
    scene.add(grp); clouds.push(grp);
  }
}

// =====================================================================
// Collision grid
// =====================================================================
const GRID = 8;
const cgrid = new Map();
let qstamp = 0;
const gk = (ix, iz) => (ix + 500) * 1000 + (iz + 500);
function addCollider(c) {
  c.cells = []; c.stamp = 0; c.alive = true;
  for (let ix = Math.floor(c.minX / GRID); ix <= Math.floor(c.maxX / GRID); ix++)
    for (let iz = Math.floor(c.minZ / GRID); iz <= Math.floor(c.maxZ / GRID); iz++) {
      const k = gk(ix, iz); let a = cgrid.get(k); if (!a) { a = []; cgrid.set(k, a); }
      a.push(c); c.cells.push(k);
    }
  return c;
}
function removeCollider(c) {
  c.alive = false;
  for (const k of c.cells) { const a = cgrid.get(k); if (!a) continue; const i = a.indexOf(c); if (i >= 0) a.splice(i, 1); }
}
function queryCols(x, z, r, out) {
  out.length = 0; qstamp++;
  for (let ix = Math.floor((x - r) / GRID); ix <= Math.floor((x + r) / GRID); ix++)
    for (let iz = Math.floor((z - r) / GRID); iz <= Math.floor((z + r) / GRID); iz++) {
      const a = cgrid.get(gk(ix, iz)); if (!a) continue;
      for (const c of a) if (c.stamp !== qstamp) { c.stamp = qstamp; out.push(c); }
    }
  return out;
}

// Raycast targets
const rayTargets = [];
function addTarget(m) { rayTargets.push(m); }
function removeTarget(m) { const i = rayTargets.indexOf(m); if (i >= 0) rayTargets.splice(i, 1); }

// Structures (houses + builds)
const structs = [];
// Transformation d'échelle du plan (x, z) active pendant la construction de l'Agence :
// tout le bâtiment est agrandi autour de son centre (hauteurs inchangées).
let AGX = null;
function makeStructBox(x, y, z, w, h, d, mat, o = {}) {
  if (AGX) { x = AGX.X(x); z = AGX.Z(z); w *= AGX.k; d *= AGX.k; }
  const m = new THREE.Mesh(BOX, mat);
  m.scale.set(w, h, d); m.position.set(x, y + h / 2, z);
  m.castShadow = o.shadow !== false; m.receiveShadow = true;
  if (curHouse) { m.updateMatrixWorld(true); } else scene.add(m);
  const col = addCollider({ type: 'box', minX: x - w / 2, maxX: x + w / 2, minY: y, maxY: y + h, minZ: z - d / 2, maxZ: z + d / 2 });
  col.mesh = m; col.hp = col.maxHp = o.hp || 200; col.mat = o.mat || 'wood'; col.indestructible = !!o.indestructible; col.kind = 'house';
  m.userData.struct = col;
  addTarget(m); structs.push(col);
  if (curHouse) { col.house = curHouse; col.chunk = chunkOfY(y + h / 2); curHouse.boxes.push(col); }
  return col;
}
// Static batching: every building is drawn as ONE merged mesh with vertex colours
// (walls + decorations). Destroying a wall rebuilds that building's mesh only.
let curHouse = null;
const HOUSE_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.06 });
// Rendu réaliste style Fortnite Chapitre 2 : bardage bois en lattes (siding), joints de brique,
// tuiles d'ardoise sur les toits, reflets bleutés sur vitres, et dorures étincelantes des agents.
HOUSE_MAT.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWP;\nvarying vec3 vNorm;')
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvNorm = normalize((modelMatrix * vec4(normal, 0.0)).xyz);');

  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', `#include <common>
      varying vec3 vWP;
      varying vec3 vNorm;
      float bHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float bNoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(bHash(i), bHash(i + vec2(1.0, 0.0)), f.x), mix(bHash(i + vec2(0.0, 1.0)), bHash(i + vec2(1.0, 1.0)), f.x), f.y);
      }`)
    .replace('#include <color_fragment>', `#include <color_fragment>
      vec3 fn = normalize(cross(dFdx(vWP), dFdy(vWP)));
      float isVert = smoothstep(0.35, 0.12, abs(fn.y));
      float isRoof = smoothstep(0.18, 0.45, fn.y) * smoothstep(0.96, 0.82, fn.y);

      // Détection des types de surfaces d'après leur teinte
      float isGlass = step(0.1, diffuseColor.b - diffuseColor.r) * step(0.4, diffuseColor.b + diffuseColor.g);
      float isDarkGlass = step(0.05, diffuseColor.b - diffuseColor.r) * step(length(diffuseColor.rgb), 0.35);
      float isGold = step(0.65, diffuseColor.r) * step(0.48, diffuseColor.g) * step(diffuseColor.b, 0.28);
      float isLightGray = step(0.45, diffuseColor.r) * step(0.03, diffuseColor.b - diffuseColor.r) * step(diffuseColor.b - diffuseColor.r, 0.09) * (1.0 - isGlass);
      float isWhiteMarble = max(step(0.82, diffuseColor.r) * step(0.82, diffuseColor.g) * step(0.78, diffuseColor.b), isLightGray);
      float isBrickOrStone = step(0.3, diffuseColor.r) * step(abs(diffuseColor.r - diffuseColor.g), 0.25) * (1.0 - isGold);

      // 1. MURS VERTICAUX : BARDAGE BOIS & BRIQUES FORTNITE
      if (isVert > 0.1 && (isGlass + isDarkGlass) < 0.5) {
        // Bardage en lattes horizontales réaliste (siding Fortnite ~0.38 m par planche)
        float plankY = mod(vWP.y, 0.38);
        float groove = smoothstep(0.0, 0.035, plankY) * (1.0 - smoothstep(0.345, 0.38, plankY));
        float siding = 0.92 + groove * 0.14 + smoothstep(0.035, 0.12, plankY) * 0.05;

        // Briques et pierres appareillées pour les façades de ville / brique
        if (isBrickOrStone > 0.5 && isWhiteMarble < 0.5) {
          float coordX = abs(fn.x) > 0.5 ? vWP.z : vWP.x;
          // pierre de taille rosée de l'Agence : grands blocs appareillés (0,55 x 1,4 m)
          float isAshlar = step(0.05, diffuseColor.r - diffuseColor.g) * step(diffuseColor.r - diffuseColor.g, 0.12) * step(diffuseColor.g, diffuseColor.b);
          float rowH = mix(0.28, 0.55, isAshlar), colW = mix(0.88, 1.4, isAshlar);
          float bRow = floor(vWP.y / rowH);
          float bCol = mod(coordX + bRow * colW * 0.5, colW);
          float mortar = smoothstep(0.0, 0.035, mod(vWP.y, rowH)) * smoothstep(0.0, 0.045, bCol);
          float blockTone = 0.96 + 0.08 * bHash(vec2(floor((coordX + bRow * colW * 0.5) / colW), bRow)) * isAshlar;
          diffuseColor.rgb *= (0.86 + 0.18 * mortar) * blockTone;
        } else if (isWhiteMarble > 0.5) {
          // Marbre blanc lisse de l'Agence avec joints subtils de blocs impériaux (1.5 m)
          float pY = smoothstep(0.0, 0.03, mod(vWP.y, 1.5)) * (1.0 - smoothstep(1.47, 1.5, mod(vWP.y, 1.5)));
          float pX = smoothstep(0.0, 0.03, mod(vWP.x + vWP.z, 2.0)) * (1.0 - smoothstep(1.97, 2.0, mod(vWP.x + vWP.z, 2.0)));
          diffuseColor.rgb *= 0.94 + 0.06 * (pY * pX);
        } else {
          // Bois peint style Pleasant Park
          float grain = (bNoise(vWP.xz * 1.8 + vWP.y * 0.5) - 0.5) * 0.06;
          diffuseColor.rgb *= (siding + grain);
        }

        // Occlusion ambiante de contact au bas des murs (base ancrée dans le terrain)
        float contactAO = smoothstep(0.0, 1.1, mod(vWP.y + 0.1, 4.0));
        diffuseColor.rgb *= 0.87 + 0.13 * contactAO;
      }

      // 2. VITRES & BAIES VITRÉES : REFLETS DYNA-CYAN STYLE FORTNITE
      if (isGlass > 0.5 || isDarkGlass > 0.5) {
        float glGleam = pow(max(0.0, sin((vWP.x + vWP.z) * 0.65 + vWP.y * 1.1)), 10.0) * 0.4;
        vec3 tint = isDarkGlass > 0.5 ? vec3(0.35, 0.5, 0.65) : vec3(0.82, 0.93, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, tint, glGleam * 0.8);
      }

      // 3. TOITURES : STRATES DE TUILES ET BARDEAUX D'ARDOISE
      if (isRoof > 0.2) {
        float shingleY = mod(vWP.y, 0.26);
        float shStep = 0.88 + smoothstep(0.0, 0.03, shingleY) * 0.22;
        float shRow = floor(vWP.y / 0.26);
        float tone = 0.95 + 0.1 * fract(sin(shRow * 91.13) * 43758.5453);
        diffuseColor.rgb *= shStep * tone;
      }

      // 4. DORURES & MÉTAL PRÉCIEUX DES AGENTS (Midas, coffre, yacht, agence)
      if (isGold > 0.5) {
        float shine = pow(max(0.0, sin((vWP.x + vWP.y + vWP.z) * 1.8)), 8.0) * 0.45;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.96, 0.7), shine);
      }
    `);
};
const _hcCache = new Map();
function hcol(hex) { let c = _hcCache.get(hex); if (!c) { c = new THREE.Color(hex); _hcCache.set(hex, c); } return c; }
function colorize(g, c) {
  const n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
const chunkOfY = (y) => Math.floor((y + 1) / 4);
function rebuildHouse(H, only) {
  // a building is split into one mesh per storey: destroying a wall only rebuilds that storey
  if (!H.chunks) H.chunks = new Map();
  const keys = only !== undefined ? [only] : [...new Set([...H.boxes.map((c) => c.chunk), ...H.deco.map((e) => e.chunk)])];
  for (const k of keys) {
    const old = H.chunks.get(k); if (old) { scene.remove(old); old.geometry.dispose(); H.chunks.delete(k); }
    const geos = [];
    for (const c of H.boxes) if (c.chunk === k && c.alive) geos.push(colorize(BOX.clone().applyMatrix4(c.mesh.matrixWorld), c.mesh.material.color));
    for (const e of H.deco) if (e.chunk === k && (!e.parent || e.parent.alive)) geos.push(colorize(e.geo.clone().applyMatrix4(e.m), e.color));
    if (!geos.length) continue;
    const g = mergeGeometries(geos); geos.forEach((x) => x.dispose());
    const m = new THREE.Mesh(g, HOUSE_MAT); m.castShadow = true; m.receiveShadow = true; scene.add(m); H.chunks.set(k, m);
  }
}
function rebuildHouseBatch(H) { rebuildHouse(H); }
function finishHouse(H) { rebuildHouse(H); }
// decoration helpers (no collider). parent = wall collider it is attached to (disappears with it)
const _dm = new THREE.Matrix4(), _dq = new THREE.Quaternion(), _de = new THREE.Euler(), _dp = new THREE.Vector3(), _ds = new THREE.Vector3();
function hdeco(geo, hex, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, parent = null, order = 'XYZ') {
  if (AGX) { x = AGX.X(x); z = AGX.Z(z); if (!rx && !rz) { sx *= AGX.k; sz *= AGX.k; } }
  _de.set(rx, ry, rz, order); _dq.setFromEuler(_de); _dm.compose(_dp.set(x, y, z), _dq, _ds.set(sx, sy, sz));
  curHouse.deco.push({ geo, color: hcol(hex), m: _dm.clone(), parent, chunk: parent ? parent.chunk : chunkOfY(y) });
}
// box whose bottom is at y
function hbox(hex, x, y, z, w, h, d, parent = null, ry = 0) { hdeco(BOX, hex, x, y + h / 2, z, w, h, d, 0, ry, 0, parent); }
// triangular prism (gable roof body): base width 1 on y=0, apex at y=1, length 1 along z
const PRISM_GEO = (() => {
  const P = [], N = [], U = [], I = [];
  const quad = (a, b, c, d, n) => { const k = P.length / 3; P.push(...a, ...b, ...c, ...d); for (let i = 0; i < 4; i++) N.push(...n); U.push(0, 0, 1, 0, 1, 1, 0, 1); I.push(k, k + 1, k + 2, k, k + 2, k + 3); };
  const tri = (a, b, c, n) => { const k = P.length / 3; P.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) N.push(...n); U.push(0, 0, 1, 0, 0.5, 1); I.push(k, k + 1, k + 2); };
  const L = [-0.5, 0, 0.5], Rr = [0.5, 0, 0.5], T = [0, 1, 0.5], Lb = [-0.5, 0, -0.5], Rb = [0.5, 0, -0.5], Tb = [0, 1, -0.5];
  tri(L, Rr, T, [0, 0, 1]); tri(Rb, Lb, Tb, [0, 0, -1]);
  const s = Math.SQRT1_2;
  quad(Rr, Rb, Tb, T, [s, s, 0]); quad(Lb, L, T, Tb, [-s, s, 0]); quad(Lb, Rb, Rr, L, [0, -1, 0]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
  g.computeVertexNormals(); return g;
})();
const CYL_GEO = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const CYL_HI = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); // tours rondes de l'Agence
const SPH_GEO = new THREE.SphereGeometry(0.5, 16, 12);

// =====================================================================
// Grass : touffes de fines lames courbes (dégradé sombre -> clair), très nombreuses, qui ondulent au vent
{
  const N = LOWQ ? 9000 : HIGHQ ? 62000 : 38000;
  const gr = mulberry32(90210); // générateur local : ne modifie pas la génération du reste du monde
  const rr = (a, b) => a + (b - a) * gr();
  // une touffe = 12 lames : chacune a un pied large, un segment médian et une pointe, penchée vers l'extérieur
  const tuft = (() => {
    const pos = [], col = [], nor = [], idx = [];
    const NB = 12;
    for (let i = 0; i < NB; i++) {
      const ang = gr() * 6.283, rad = Math.sqrt(gr()) * 0.26, bx = Math.cos(ang) * rad, bz = Math.sin(ang) * rad;
      const yaw = ang + rr(-0.9, 0.9), lean = rr(0.12, 0.55) * (0.6 + rad * 2.5);
      const h = rr(0.42, 0.85) * (i < 4 ? 1.0 : 0.82), w = rr(0.035, 0.055);
      const dx = Math.sin(yaw), dz = Math.cos(yaw); // direction de la penche
      const wx = Math.cos(yaw), wz = -Math.sin(yaw); // largeur de la lame
      const rows = [[0, w, 0.0, 0.34], [0.52, w * 0.72, lean * 0.45, 0.72], [1.0, 0.0, lean * 1.15, 1.0]];
      const base = pos.length / 3;
      for (const [t, ww, off, br] of rows) {
        const y = t * h, cx = bx + dx * off * h, cz = bz + dz * off * h, yy = y - off * off * h * 0.25;
        if (ww > 0) {
          pos.push(cx - wx * ww, yy, cz - wz * ww, cx + wx * ww, yy, cz + wz * ww); col.push(br, br, br, br, br, br); nor.push(0, 1, 0, 0, 1, 0);
        } else { pos.push(cx, yy, cz); col.push(br, br, br); nor.push(0, 1, 0); }
      }
      idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2, base + 2, base + 3, base + 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
    return g;
  })();
  const flower = (() => {
    const st = new THREE.CylinderGeometry(0.02, 0.025, 0.5, 4); st.translate(0, 0.25, 0); st.deleteAttribute('uv');
    const hd = new THREE.IcosahedronGeometry(0.1, 0); hd.translate(0, 0.54, 0); hd.deleteAttribute('uv');
    const ct = new THREE.IcosahedronGeometry(0.045, 0); ct.translate(0, 0.62, 0); ct.deleteAttribute('uv');
    // tiges vertes, têtes à la couleur de l'instance, coeur jaune
    const mk = (g, v) => { const gg = g.index ? g.toNonIndexed() : g; gg.setAttribute('head', new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count).fill(v), 1)); return gg; };
    return mergeGeometries([mk(st, 0), mk(hd, 1), mk(ct, 2)]);
  })();
  const sway = (sh, isFlower) => {
    sh.uniforms.uWind = windT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;' + (isFlower ? '\nattribute float head; varying float vHead;' : ''))
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        float sw = sin(uWind * 1.6 + ip.x * 0.13 + ip.z * 0.09) * 0.5 + sin(uWind * 2.9 + ip.x * 0.37 + ip.z * 0.21) * 0.22 + sin(uWind * 0.6 + ip.x * 0.03) * 0.3;
        float fl = sin(uWind * 5.0 + position.x * 18.0 + position.z * 14.0 + ip.x) * 0.025;
        transformed.x += (sw * 0.34 + fl) * position.y * position.y * 1.4; transformed.z += (sw * 0.2 + fl) * position.y * position.y * 1.4;` + (isFlower ? '\nvHead = head;' : ''));
    if (isFlower) sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vHead;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(vec3(0.2, 0.5, 0.18), diffuseColor.rgb, step(0.5, vHead)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.82, 0.2), step(1.5, vHead));');
    else sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal *= faceDirection; // éclairage identique sur les deux faces des lames');
  };
  const gm = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, vertexColors: true }); gm.onBeforeCompile = (sh) => sway(sh, false);
  const fm = new THREE.MeshLambertMaterial({ flatShading: true }); fm.onBeforeCompile = (sh) => sway(sh, true);
  const NF = Math.floor(N / 5);
  const grass = new THREE.InstancedMesh(tuft, gm, N), flowers = new THREE.InstancedMesh(flower, fm, NF);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color(), col2 = new THREE.Color();
  const GR = [0x53d241, 0x69df50, 0x44bb38, 0x8ce85c, 0x5ccd46], DRY = new THREE.Color(0xc6c85a), DARK = new THREE.Color(0x2f8a3a);
  const FL = [0xff4d6d, 0xffd23f, 0xff9de0, 0xffffff, 0xa98bff, 0xff8a3d, 0x5ac8ff];
  let ng = 0, nf = 0, guard = 0;
  while ((ng < N || nf < NF) && guard++ < N * 14) {
    const a = gr() * 6.283, r = Math.sqrt(gr()) * ISLAND_R * 0.95, x = Math.cos(a) * r * OVAL_X, z = Math.sin(a) * r * OVAL_Z, h = terrainH(x, z);
    if (h < 2.3 || h > 26) continue;
    const bw = biomeW(x, z); if (bw.snow > 0.35 || bw.desert > 0.35) continue;
    if (Math.abs(terrainH(x + 1.2, z) - h) + Math.abs(terrainH(x, z + 1.2) - h) > 1.7) continue;
    if (inPOI(x, z, -2)) continue;
    const patch = fbm(x * 0.045 + 7, z * 0.045 - 3); // zones denses / clairsemées
    const isF = nf < NF && gr() < 0.2 && bw.forest < 0.5 && patch > 0.4;
    if (!isF && ng >= N) continue;
    if (!isF && patch < 0.3 && gr() < 0.5) continue;
    q.setFromAxisAngle(up, gr() * 6.283);
    if (isF) { const k = 0.8 + gr() * 0.6; sc.set(k, k, k); m4.compose(ps.set(x, h - 0.05, z), q, sc); flowers.setMatrixAt(nf, m4); flowers.setColorAt(nf, col.setHex(FL[(gr() * FL.length) | 0])); nf++; }
    else {
      const tall = gr() < 0.1 ? 1.4 : 1, k = (0.75 + gr() * 0.5) * tall;
      sc.set(k, k * (0.85 + gr() * 0.5), k); m4.compose(ps.set(x, h - 0.04, z), q, sc);
      grass.setMatrixAt(ng, m4);
      col.setHex(GR[(gr() * GR.length) | 0]).lerp(DARK, bw.forest * 0.55);
      col.lerp(DRY, Math.max(0, 0.5 - patch) * 0.5 * (1 - bw.forest)); // quelques zones d'herbe sèche (plus discrètes)
      grass.setColorAt(ng, col); ng++;
    }
  }
  grass.count = ng; flowers.count = nf;
  for (const im of [grass, flowers]) { im.frustumCulled = false; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; scene.add(im); }
}
// Trees, rocks, houses, cars
// =====================================================================
const trees = [], rocks = [], cacti = [];
const dummy = new THREE.Object3D();
const ZERO_M = new THREE.Matrix4().makeScale(0, 0, 0);
let trunkIM, leafIM, leaf2IM, leafBallIM, rockIM, cactusIM;
{
  const pts = [], cpts = [];
  // pas deux arbres l'un dans l'autre : distance minimale entre deux pieds d'arbre/cactus
  // (canopées de ~3-4 m de rayon => 7 m entre les troncs)
  const MIN_D2 = 7 * 7;
  const tooClose = (x, z) => {
    for (const q of pts) if ((q.x - x) ** 2 + (q.z - z) ** 2 < MIN_D2) return true;
    for (const q of cpts) if ((q.x - x) ** 2 + (q.z - z) ** 2 < MIN_D2) return true;
    return false;
  };
  let tries = 0;
  while (pts.length + cpts.length < 620 && tries++ < 12000) {
    const a = rand(Math.PI * 2), r = Math.sqrt(R()) * ISLAND_R;
    const x = Math.cos(a) * r * OVAL_X, z = Math.sin(a) * r * OVAL_Z;
    const h = terrainH(x, z);
    if (h < 2.2 || h > 34 || r > coastR(x / OVAL_X, z / OVAL_Z) * 0.8) continue;
    if (inPOI(x, z, 6)) continue;
    const bw = biomeW(x, z);
    if (bw.desert > 0.5) { if (R() < 0.82) continue; if (tooClose(x, z)) continue; cpts.push({ x, z, h }); continue; }
    const dens = fbm(x * 0.02 + 40, z * 0.02);
    if (dens < 0.42 - bw.forest * 0.25 && R() < 0.8 - bw.forest * 0.4) continue; // forests clustered
    if (tooClose(x, z)) continue;
    pts.push({ x, z, h, snow: bw.snow });
  }
  const trunkG = new THREE.CylinderGeometry(0.28, 0.42, 1, 6); trunkG.translate(0, 0.5, 0);
  const leafG = new THREE.ConeGeometry(1, 1, 7); leafG.translate(0, 0.5, 0);
  // houppier du feuillu : trois boules fusionnées => grosse canopée ronde (arbre « à l'ancienne »)
  const ballG = mergeGeometries([
    new THREE.IcosahedronGeometry(0.72, 1).translate(-0.58, 0.12, 0.22),
    new THREE.IcosahedronGeometry(1, 1).translate(0, 0.55, 0),
    new THREE.IcosahedronGeometry(0.68, 1).translate(0.58, 0.1, -0.25),
  ]);
  trunkIM = new THREE.InstancedMesh(trunkG, matC(0x7a4a26), pts.length);
  leafIM = new THREE.InstancedMesh(leafG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), pts.length);
  leaf2IM = new THREE.InstancedMesh(leafG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), pts.length);
  leafBallIM = new THREE.InstancedMesh(ballG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), pts.length);
  const lc = new THREE.Color(), snowC = new THREE.Color(0xeef6ff);
  pts.forEach((p, i) => {
    const s = rand(0.85, 1.35);
    const round = p.snow < 0.3 && R() < 0.45; // deux espèces : sapin stylisé et feuillu rond
    const tree = { i, x: p.x, z: p.z, y: p.h - 0.2, s, hp: 150, alive: true, ims: null };
    if (round) {
      // feuillu : tronc plus haut, canopée ronde de trois boules
      dummy.position.set(p.x, tree.y, p.z); dummy.rotation.set(0, rand(6.28), 0); dummy.scale.set(s, 3.4 * s, s); dummy.updateMatrix();
      trunkIM.setMatrixAt(i, dummy.matrix);
      leafIM.setMatrixAt(i, ZERO_M); leaf2IM.setMatrixAt(i, ZERO_M);
      dummy.position.set(p.x, tree.y + 3.1 * s, p.z); dummy.rotation.set(0, rand(6.28), 0); dummy.scale.set(2.3 * s, 2.1 * s, 2.3 * s); dummy.updateMatrix(); leafBallIM.setMatrixAt(i, dummy.matrix);
      lc.setHSL(0.27 + rand(-0.035, 0.045), 0.62 + rand(0.13), 0.35 + rand(0.09));
      leafBallIM.setColorAt(i, lc);
      tree.col = addCollider({ type: 'box', minX: p.x - 0.5 * s, maxX: p.x + 0.5 * s, minZ: p.z - 0.5 * s, maxZ: p.z + 0.5 * s, minY: tree.y, maxY: tree.y + 5 * s });
    } else {
      // sapin : deux étages de cônes bien pleins
      dummy.position.set(p.x, tree.y, p.z); dummy.rotation.set(0, rand(6.28), 0); dummy.scale.set(s, 2.8 * s, s); dummy.updateMatrix();
      trunkIM.setMatrixAt(i, dummy.matrix);
      leafBallIM.setMatrixAt(i, ZERO_M);
      dummy.position.set(p.x, tree.y + 2.0 * s, p.z); dummy.scale.set(3.0 * s, 4.6 * s, 3.0 * s); dummy.updateMatrix(); leafIM.setMatrixAt(i, dummy.matrix);
      dummy.position.set(p.x, tree.y + 4.3 * s, p.z); dummy.scale.set(2.2 * s, 3.6 * s, 2.2 * s); dummy.updateMatrix(); leaf2IM.setMatrixAt(i, dummy.matrix);
      lc.setHSL(0.27 + rand(-0.04, 0.05), 0.55 + rand(0.15), 0.32 + rand(0.1));
      if (p.snow > 0.3) { lc.setHSL(0.36, 0.35, 0.28); leafIM.setColorAt(i, lc); leaf2IM.setColorAt(i, lc.lerp(snowC, 0.75 * p.snow)); }
      else { leafIM.setColorAt(i, lc); lc.offsetHSL(0.01, 0, 0.05); leaf2IM.setColorAt(i, lc); }
      tree.col = addCollider({ type: 'box', minX: p.x - 0.5 * s, maxX: p.x + 0.5 * s, minZ: p.z - 0.5 * s, maxZ: p.z + 0.5 * s, minY: tree.y, maxY: tree.y + 3.2 * s });
    }
    tree.col.tree = tree;
    trees.push(tree);
  });
  for (const t of trees) t.ims = [trunkIM, leafIM, leaf2IM, leafBallIM];
  for (const im of [trunkIM, leafIM, leaf2IM, leafBallIM]) { im.castShadow = true; im.receiveShadow = true; im.userData.treeIM = true; im.userData.list = trees; scene.add(im); addTarget(im); }
  // Cacti (desert)
  const cacG = mergeGeometries([
    new THREE.CylinderGeometry(0.42, 0.48, 3.4, 8).translate(0, 1.7, 0),
    new THREE.CylinderGeometry(0.26, 0.26, 1.3, 7).rotateZ(Math.PI / 2).translate(0.75, 1.6, 0),
    new THREE.CylinderGeometry(0.25, 0.25, 1.2, 7).translate(1.3, 2.15, 0),
    new THREE.CylinderGeometry(0.24, 0.24, 1.0, 7).rotateZ(Math.PI / 2).translate(-0.65, 2.2, 0),
    new THREE.CylinderGeometry(0.23, 0.23, 0.9, 7).translate(-1.1, 2.6, 0),
  ]);
  cactusIM = new THREE.InstancedMesh(cacG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, flatShading: true }), Math.max(1, cpts.length));
  cpts.forEach((p, i) => {
    const s = rand(0.8, 1.3);
    dummy.position.set(p.x, p.h - 0.1, p.z); dummy.rotation.set(0, rand(6.28), 0); dummy.scale.set(s, s, s); dummy.updateMatrix();
    cactusIM.setMatrixAt(i, dummy.matrix); cactusIM.setColorAt(i, lc.setHSL(0.3 + rand(0.04), 0.5, 0.33 + rand(0.08)));
    const c = { i, x: p.x, z: p.z, y: p.h, s, hp: 120, alive: true, ims: [cactusIM] };
    c.col = addCollider({ type: 'box', minX: p.x - 0.5 * s, maxX: p.x + 0.5 * s, minZ: p.z - 0.5 * s, maxZ: p.z + 0.5 * s, minY: p.h, maxY: p.h + 3.4 * s }); c.col.tree = c;
    cacti.push(c);
  });
  if (!cpts.length) cactusIM.setMatrixAt(0, ZERO_M);
  cactusIM.castShadow = cactusIM.receiveShadow = true; cactusIM.userData.treeIM = true; cactusIM.userData.list = cacti; scene.add(cactusIM); addTarget(cactusIM);

  // Rocks
  const rg = new THREE.DodecahedronGeometry(1, 0);
  const rpts = [];
  tries = 0;
  while (rpts.length < 110 && tries++ < 4000) {
    const a = rand(Math.PI * 2), r = Math.sqrt(R()) * ISLAND_R * 0.95;
    const x = Math.cos(a) * r * OVAL_X, z = Math.sin(a) * r * OVAL_Z, h = terrainH(x, z);
    if (h < 1.2 || inPOI(x, z, 4)) continue;
    rpts.push({ x, z, h });
  }
  rockIM = new THREE.InstancedMesh(rg, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), rpts.length);
  rpts.forEach((p, i) => {
    const s = rand(0.9, 2.4);
    dummy.position.set(p.x, p.h + s * 0.25, p.z); dummy.rotation.set(rand(3), rand(3), rand(3)); dummy.scale.set(s * 1.2, s * 0.9, s); dummy.updateMatrix();
    rockIM.setMatrixAt(i, dummy.matrix);
    const v = rand(0.5, 0.65); rockIM.setColorAt(i, new THREE.Color(v, v * 1.01, v * 1.05));
    const rock = { i, x: p.x, z: p.z, s, hp: 200, alive: true };
    rock.col = addCollider({ type: 'box', minX: p.x - s, maxX: p.x + s, minZ: p.z - s * 0.8, maxZ: p.z + s * 0.8, minY: p.h - 1, maxY: p.h + s * 1.0 });
    rock.col.rock = rock;
    rocks.push(rock);
  });
  rockIM.castShadow = rockIM.receiveShadow = true; rockIM.userData.rockIM = true; scene.add(rockIM); addTarget(rockIM);
}

// Houses
const chests = [], ammoBoxes = [], lootSpots = [];
let chestHumT = 0;
const WALL_COLS = [0xf3e3c3, 0xbfe0f5, 0xf7c9c9, 0xd7f0c6, 0xffe9a8, 0xe0d3f7];
const ROOF_COLS = [0xd2483a, 0x3b6fd1, 0x6a4a3a, 0x2f9e7a, 0xe08a2e];
const STYLE_COLS = {
  adobe: { walls: [0xe9cfa0, 0xdcb27a, 0xf0d9b5, 0xd99c6a], roofs: [0xc8794a], mat: 'stone', hp: 260 },
  chalet: { walls: [0x9a6238, 0x8a5530, 0xb07848], roofs: [0xf4f8ff], mat: 'wood', hp: 190 },
  beach: { walls: [0x9fe0e8, 0xffd1dc, 0xfff0a8, 0xc8f0c0], roofs: [0xd9b45a], mat: 'wood', hp: 150 },
  brick: { walls: [0xc9705a, 0xb85f4a, 0xd8d0c8, 0xbfe0f5], roofs: ROOF_COLS, mat: 'stone', hp: 260 },
  wood: { walls: WALL_COLS, roofs: ROOF_COLS, mat: 'wood', hp: 170 },
  city: { walls: [0xe8e1d0, 0x9fb4c7, 0xc98b6b], roofs: [0x4a4f5a], mat: 'stone', hp: 280, frame: 0x2f3540 },
  agency: { walls: [0xe8e6de, 0xdedcd4, 0xd2cfc6], roofs: [0x3a4a5c], mat: 'metal', hp: 340, frame: 0xffc400, trim: 0xffc400 },
  bunker: { walls: [0x707684, 0x5d6370, 0x6a7180], roofs: [0x454b56], mat: 'stone', hp: 360, frame: 0x3a4150, trim: 0x8a929e },
};
STYLE_COLS.adobe.frame = 0x6e4a2c; STYLE_COLS.adobe.trim = 0xf0d9b5;
STYLE_COLS.chalet.frame = 0x4a2e1a; STYLE_COLS.chalet.trim = 0x5a3a24;
STYLE_COLS.beach.frame = 0xffffff; STYLE_COLS.beach.trim = 0xffffff;
STYLE_COLS.brick.frame = 0xf4efe4; STYLE_COLS.brick.trim = 0xe8e0d0;
const rampDecoGeo = new THREE.BoxGeometry(4, 0.22, 4 * Math.SQRT2 + 0.1);
function buildHouse(cx, cz, baseY, w, d, rot, style) {
  curHouse = { boxes: [], deco: [], mesh: null };
  buildHouseInner(cx, cz, baseY, w, d, rot, style);
  const H = curHouse; curHouse = null; finishHouse(H);
}
function buildTower(cx, cz, baseY, w, d, floors, rot, pal) {
  curHouse = { boxes: [], deco: [], mesh: null };
  buildTowerInner(cx, cz, baseY, w, d, floors, rot, pal);
  const H = curHouse; curHouse = null; finishHouse(H);
}
// Wall sides of a rectangular footprint. out = outward sign on the normal axis
function footprintSides(cx, cz, w, d) {
  return [
    { ax: 'x', len: w, x: cx, z: cz - d / 2, out: -1 }, // north
    { ax: 'z', len: d, x: cx + w / 2, z: cz, out: 1 },  // east
    { ax: 'x', len: w, x: cx, z: cz + d / 2, out: 1 },  // south
    { ax: 'z', len: d, x: cx - w / 2, z: cz, out: -1 }, // west
  ];
}
// box placed in side-local coordinates: u along the wall, n along the outward normal, y = bottom
function sbox(s, hex, u, y, n, su, sy, sn, parent = null) {
  if (s.ax === 'x') hbox(hex, s.x + u, y, s.z + n * s.out, su, sy, sn, parent);
  else hbox(hex, s.x + n * s.out, y, s.z + u, sn, sy, su, parent);
}
// Builds one storey of a wall with rectangular openings [{u, w, y0, y1, kind}] (u = centre along the wall).
// Returns the openings with the collider of the piece under them (sill) for attaching decorations.
function wallWithOpenings(s, ly, H, T, ops, hex, o) {
  const ext = s.ax === 'x' ? T : -T; // x walls cover the corners
  const L = s.len + ext, a0 = -L / 2, a1 = L / 2;
  ops.sort((p, q) => p.u - q.u);
  const mk = (a, b, y0, y1) => {
    if (b - a < 0.05 || y1 - y0 < 0.05) return null;
    const mid = (a + b) / 2, len = b - a;
    return s.ax === 'x' ? makeStructBox(s.x + mid, ly + y0, s.z, len, y1 - y0, T, matC(hex), o) : makeStructBox(s.x, ly + y0, s.z + mid, T, y1 - y0, len, matC(hex), o);
  };
  let cur = a0;
  for (const op of ops) {
    const l = op.u - op.w / 2, r = op.u + op.w / 2;
    mk(cur, l, 0, H);
    op.sill = mk(l, r, 0, op.y0);
    op.lintel = mk(l, r, op.y1, H);
    op.side = op.sill || op.lintel;
    cur = r;
  }
  mk(cur, a1, 0, H);
  return ops;
}
// =====================================================================
// Portes réelles : elles se ferment, bloquent le passage et s'ouvrent avec E
// (les bots les ouvrent tout seuls en s'en approchant). Cassables comme les murs.
// =====================================================================
const doors = [];
function addDoor(s, ly, op, T, hex) {
  // la porte remplit l'ouverture (juste le jeu fonctionnel de 4 cm) : plus de trou
  // ni au-dessus ni sur les côtés entre la porte et le mur.
  const dw = op.w - 0.04, dh = op.y1 - 0.04;
  const hingeU = op.u - dw / 2;
  const g = new THREE.Group();
  const hinge = s.ax === 'x' ? [s.x + hingeU, s.z] : [s.x, s.z + hingeU];
  g.position.set(hinge[0], ly, hinge[1]);
  const wood = matC(hex, { roughness: 0.68 });
  const groove = matC(new THREE.Color(hex).multiplyScalar(0.7).getHex(), { roughness: 0.78 });
  const panel = new THREE.Mesh(BOX, wood);
  if (s.ax === 'x') { panel.scale.set(dw, dh, 0.12); panel.position.set(dw / 2, dh / 2, 0); }
  else { panel.scale.set(0.12, dh, dw); panel.position.set(0, dh / 2, dw / 2); }
  panel.castShadow = true; panel.receiveShadow = true;
  g.add(panel);
  // panneaux en creux + poignée dorée des deux côtés
  for (let pn = 0; pn < 2; pn++) for (const f of [-1, 1]) {
    const gg = new THREE.Mesh(BOX, groove);
    const gy = 0.32 + pn * (dh * 0.52), gh = dh * 0.3, gw = dw - 0.46;
    if (s.ax === 'x') { gg.scale.set(gw, gh, 0.03); gg.position.set(dw / 2, gy + gh / 2, f * 0.075); }
    else { gg.scale.set(0.03, gh, gw); gg.position.set(f * 0.075, gy + gh / 2, dw / 2); }
    g.add(gg);
  }
  const handle = new THREE.Mesh(BOX, matC(0xffc928, { metalness: 0.4, roughness: 0.4 }));
  if (s.ax === 'x') { handle.scale.set(0.06, 0.3, 0.24); handle.position.set(dw - 0.17, 1.05, 0); }
  else { handle.scale.set(0.24, 0.3, 0.06); handle.position.set(0, 1.05, dw - 0.17); }
  g.add(handle);
  scene.add(g);
  const d = {
    group: g, panel, open: false, broken: false, angle: 0, hx: hinge[0], hz: hinge[1], ly,
    ax: s.ax, dw, sign: s.ax === 'x' ? -s.out : s.out, col: null,
  };
  d.col = addCollider(s.ax === 'x'
    ? { type: 'box', minX: hinge[0] - 0.05, maxX: hinge[0] + dw + 0.05, minY: ly, maxY: ly + dh, minZ: s.z - 0.25, maxZ: s.z + 0.25 }
    : { type: 'box', minX: s.x - 0.25, maxX: s.x + 0.25, minY: ly, maxY: ly + dh, minZ: hinge[1] - 0.05, maxZ: hinge[1] + dw + 0.05 });
  d.col.hp = d.col.maxHp = 140; d.col.mat = 'wood'; d.col.mesh = g; d.col.door = d;
  panel.userData.struct = d.col;
  addTarget(panel);
  doors.push(d);
  return d;
}
function destroyDoor(d) {
  if (matchOver) return; // après le top 1, plus rien ne bouge ni ne se casse
  d.broken = true; d.open = true;
  removeCollider(d.col);
  scene.remove(d.group);
  removeTarget(d.panel);
  burst(_v1.set(d.hx, d.ly + 1.2, d.hz), 0x8a5a30, 14, 6, 0.3, 1, 0.9);
  sfxAt('break', _v1.set(d.hx, d.ly + 1.2, d.hz), 0.7);
}
function toggleDoor(d) {
  if (d.broken || matchOver) return; // après le top 1, les portes restent telles quelles
  d.open = !d.open;
  d.col.passable = d.open; // ouverte : on passe à travers, fermée : elle bloque
  sfx('door', 0.6);
}
function updateDoors(dt) {
  for (const d of doors) {
    if (d.broken) continue;
    // un bot vivant à proximité ouvre la porte tout seul
    if (!d.open) {
      for (const c of chars) {
        if (c.isPlayer || !c.alive) continue;
        if (Math.hypot(c.pos.x - d.hx, c.pos.z - d.hz) < 2.4 && Math.abs(c.pos.y - d.ly) < 3) { d.open = true; d.col.passable = true; break; }
      }
    }
    // EN COURS VERS LA PORTE : elle s'enfonce d'elle-même, pas besoin d'appuyer sur E.
    // Distance au VANTAIL complet (segment gond -> bord opposé), pas seulement au gond :
    // courir sur le milieu ou l'autre bord de la porte marche aussi bien.
    if (!d.open && !matchOver) {
      for (const c of chars) {
        if (!c.alive || c.mode === 'bus' || c.mode === 'drive') continue;
        if (Math.abs(c.pos.y - d.ly) > 3) continue;
        // extrémités du vantail fermé
        const ex = d.ax === 'x' ? d.hx + d.dw : d.hx, ez = d.ax === 'x' ? d.hz : d.hz + d.dw;
        const ux = ex - d.hx, uz = ez - d.hz, n2 = ux * ux + uz * uz || 1;
        const t = clamp(((c.pos.x - d.hx) * ux + (c.pos.z - d.hz) * uz) / n2, 0, 1);
        const px = d.hx + ux * t, pz = d.hz + uz * t;
        const dx = px - c.pos.x, dz = pz - c.pos.z, dist = Math.hypot(dx, dz);
        if (dist > 1.0) continue;
        if (Math.hypot(c.vel.x, c.vel.z) < 3.5) continue;              // il faut courir
        if (c.vel.x * dx + c.vel.z * dz <= 0) continue;                // et foncer dessus
        d.open = true; d.col.passable = true; d.pushT = 0.5;            // porte enfoncée
        sfxAt('door', _v1.set(d.hx, d.ly + 1, d.hz), 1);
        break;
      }
    }
    // ouverture enfoncée : grand écart rapide, puis retour à l'ouverture normale
    let target = d.open ? d.sign * 1.85 : 0, speed = 9;
    if (d.pushT > 0) { d.pushT -= dt; target = d.sign * 2.7; speed = 22; }
    d.angle += (target - d.angle) * Math.min(1, dt * speed);
    if (Math.abs(target - d.angle) < 0.01) d.angle = target;
    d.group.rotation.y = d.angle;
  }
}
function windowFrame(s, ly, op, T, frame, parent) {
  const fw = 0.14, y0 = ly + op.y0, h = op.y1 - op.y0, dn = T + 0.12;
  sbox(s, frame, op.u, y0 - 0.12, 0, op.w + 0.36, 0.16, dn + 0.1, parent); // sill
  sbox(s, frame, op.u, ly + op.y1, 0, op.w + 0.28, fw, dn, parent);        // head
  sbox(s, frame, op.u - op.w / 2 - fw / 2, y0, 0, fw, h, dn, parent);
  sbox(s, frame, op.u + op.w / 2 + fw / 2, y0, 0, fw, h, dn, parent);
  // mullion cross: reads as a window even though it stays open (you can still jump / shoot through)
  sbox(s, frame, op.u, y0 + h / 2 - 0.03, 0, op.w, 0.06, 0.06, parent);
  sbox(s, frame, op.u, y0, 0, 0.06, h * 0.999, 0.06, parent);
  // vitre semi-transparente : vraie fenêtre visuellement (légère réflexion bleutée)
  sbox(s, 0x9fc8e8, op.u, y0 + h / 2, 0, op.w - 0.06, h - 0.06, 0.02, parent);
}
function gableRoof(cx, cz, topY, w, d, roofH, bodyHex, roofHex, opts = {}) {
  const alongZ = w <= d; // ridge direction follows the long side
  const span = (alongZ ? w : d) + 0.5, len = (alongZ ? d : w) + 0.5, hs = span / 2;
  // UN SEUL TOIT : le prisme lui-même, peint en tuiles. Plus de pentes ni de
  // bardeaux superposés qui se mettaient à flotter au-dessus de la maison.
  hdeco(PRISM_GEO, roofHex, cx, topY, cz, alongZ ? span : len, roofH, alongZ ? len : span, 0, alongZ ? 0 : Math.PI / 2, 0, opts.parent);
  const th = Math.atan2(roofH, hs), pl = Math.hypot(hs, roofH) + 0.55, nx = Math.sin(th) * 0.1, ny = Math.cos(th) * 0.1;
  // Physique du toit : deux pentes marchables, chacune bornée à sa moitié de toit
  // (sinon slopeH se clampe à la hauteur du faîte et le joueur flotte au-dessus de la pente).
  if (opts.parent && opts.parent.alive) {
    const axis = alongZ ? 'x' : 'z';
    const y0 = topY + 0.05, y1 = topY + roofH - 0.1;
    const mk = (e0, e1, b) => addCollider(Object.assign({ type: 'slope', axis, e0, e1, y0, y1, minY: topY, maxY: topY + roofH }, b));
    let s1, s2;
    if (alongZ) {
      const zB = { minZ: cz - len / 2 - 0.3, maxZ: cz + len / 2 + 0.3 };
      s1 = mk(cx - hs, cx, Object.assign({ minX: cx - hs - 0.3, maxX: cx + 0.3 }, zB));
      s2 = mk(cx + hs, cx, Object.assign({ minX: cx - 0.3, maxX: cx + hs + 0.3 }, zB));
    } else {
      const xB = { minX: cx - len / 2 - 0.3, maxX: cx + len / 2 + 0.3 };
      s1 = mk(cz - hs, cz, Object.assign({ minZ: cz - hs - 0.3, maxZ: cz + 0.3 }, xB));
      s2 = mk(cz + hs, cz, Object.assign({ minZ: cz - 0.3, maxZ: cz + hs + 0.3 }, xB));
    }
    opts.parent.subs = opts.parent.subs || [];
    opts.parent.subs.push(s1, s2);
  }
  // faîte du toit + gouttières + descentes
  hbox(opts.trim ?? 0x5a3a24, cx, topY + roofH - 0.05, cz, alongZ ? 0.35 : len + 0.8, 0.28, alongZ ? len + 0.8 : 0.35, opts.parent);
  const gutC = 0x9aa2ab;
  if (alongZ) {
    hbox(gutC, cx, topY + 0.15, cz - len / 2 - 0.05, span + 0.4, 0.24, 0.3, opts.parent);
    hbox(gutC, cx, topY + 0.15, cz + len / 2 + 0.05, span + 0.4, 0.24, 0.3, opts.parent);
    if (opts.drain) { hbox(gutC, cx - span / 2 - 0.05, topY - 0.4, cz - len / 2, 0.14, 1.3, 0.14, opts.parent); hbox(gutC, cx + span / 2 + 0.05, topY - 0.4, cz + len / 2, 0.14, 1.3, 0.14, opts.parent); }
  } else {
    hbox(gutC, cx - len / 2 - 0.05, topY + 0.15, cz, 0.3, 0.24, span + 0.4, opts.parent);
    hbox(gutC, cx + len / 2 + 0.05, topY + 0.15, cz, 0.3, 0.24, span + 0.4, opts.parent);
    if (opts.drain) { hbox(gutC, cx - len / 2, topY - 0.4, cz - span / 2 - 0.05, 0.14, 1.3, 0.14, opts.parent); hbox(gutC, cx + len / 2, topY - 0.4, cz + span / 2 + 0.05, 0.14, 1.3, 0.14, opts.parent); }
  }
  if (opts.chimney) {
    const off = (alongZ ? d : w) * 0.22, lat = hs * 0.45;
    const x = cx + (alongZ ? lat : off), z = cz + (alongZ ? off : lat);
    hbox(opts.chimney, x, topY, z, 0.8, roofH + 1.1, 0.8, opts.parent);
    hbox(0x3a3a3a, x, topY + roofH + 1.1, z, 1.0, 0.18, 1.0, opts.parent);
  }
}
function furniture(cx, cz, y, w, d, skipCorner, accent, avoid) {
  // Intérieurs meublés : mobilier varié posé dans les quadrants libres.
  // avoid = [{x, z}] : emplacements à laisser libres (coffres, caisses de munitions)
  const spots = [[-1, -1], [1, -1], [1, 1], [-1, 1]].filter((q) => !(skipCorner && q[0] === -1 && q[1] === -1));
  const kinds = ['table', 'bed', 'sofa', 'shelf', 'rug', 'tv', 'desk', 'wardrobe', 'plant'];
  let placed = 0;
  const maxPieces = Math.min(spots.length, w >= 10 ? 5 : 4); // grandes maisons mieux meublées
  for (let i = 0; i < spots.length && placed < maxPieces; i++) {
    const [qx, qz] = spots[i], x = cx + qx * w / 4, z = cz + qz * d / 4;
    if (avoid && avoid.some((a) => Math.hypot(a.x - x, a.z - z) < 2)) continue;
    const k = kinds[(i + randi(0, kinds.length - 1)) % kinds.length];
    if (k === 'table') {
      hbox(0x9a6a40, x, y + 0.72, z, 1.5, 0.1, 0.95); for (const [a, b] of [[-0.62, -0.38], [0.62, -0.38], [-0.62, 0.38], [0.62, 0.38]]) hbox(0x6e4a2c, x + a, y, z + b, 0.1, 0.72, 0.1); hbox(0xc0392b, x - 1.05, y, z, 0.5, 0.45, 0.5); hbox(0xc0392b, x - 1.05, y + 0.45, z - 0.22, 0.5, 0.55, 0.08);
      propBox(x, y, z, 0.8, 0.55, 0.85); propBox(x - 1.05, y, z, 0.3, 0.3, 1.0); // table + chaise
    }
    else if (k === 'bed') { hbox(0x6e4a2c, x, y, z, 1.4, 0.4, 2.1); hbox(accent, x, y + 0.4, z + 0.15, 1.35, 0.16, 1.7); hbox(0xffffff, x, y + 0.4, z - 0.75, 1.0, 0.2, 0.45); hbox(0x6e4a2c, x, y, z - 1.05, 1.5, 1.0, 0.12); propBox(x, y, z - 0.03, 0.75, 1.08, 1.0); }
    else if (k === 'sofa') { hbox(accent, x, y, z, 2.0, 0.45, 0.85); hbox(accent, x, y + 0.45, z - 0.35, 2.0, 0.5, 0.18); hbox(accent, x - 0.95, y + 0.45, z, 0.16, 0.3, 0.85); hbox(accent, x + 0.95, y + 0.45, z, 0.16, 0.3, 0.85); propBox(x, y, z, 1.05, 0.48, 0.95); }
    else if (k === 'shelf') { hbox(0x7a5232, x, y, z, 1.4, 1.8, 0.4); for (let j = 0; j < 3; j++) hbox(pick([0x3b6fd1, 0xe08a2e, 0x2f9e7a, 0xd2483a]), x + rand(-0.4, 0.4), y + 0.35 + j * 0.55, z + 0.05, 0.5, 0.28, 0.3); propBox(x, y, z, 0.72, 0.22, 1.8); }
    else if (k === 'tv') { // coin télé : meuble + écran + dalle allumée
      hbox(0x6e4a2c, x, y, z, 1.6, 0.5, 0.5);
      hbox(0x14161a, x, y + 0.5, z, 1.35, 0.8, 0.08);
      hbox(0x3b6fd1, x, y + 0.56, z + 0.05, 1.05, 0.6, 0.02);
      propBox(x, y, z, 0.85, 0.28, 1.32);
    }
    else if (k === 'desk') { // bureau + chaise + écran posé
      hbox(0x8a5a30, x, y + 0.72, z, 1.5, 0.08, 0.7); for (const [a, b] of [[-0.65, -0.28], [0.65, -0.28], [-0.65, 0.28], [0.65, 0.28]]) hbox(0x6e4a2c, x + a, y, z + b, 0.08, 0.72, 0.08);
      hbox(0xc0392b, x + 0.95, y, z, 0.45, 0.45, 0.45);
      hbox(0x2b2f36, x - 0.25, y + 0.8, z, 0.3, 0.24, 0.2);
      propBox(x, y, z, 0.8, 0.4, 0.8);
    }
    else if (k === 'wardrobe') { // armoire deux portes
      hbox(0x7a5232, x, y, z, 1.3, 2.1, 0.6);
      hbox(0x9a9690, x - 0.12, y + 1.05, z + 0.31, 0.06, 0.06, 0.04);
      hbox(0x9a9690, x + 0.12, y + 1.05, z + 0.31, 0.06, 0.06, 0.04);
      propBox(x, y, z, 0.68, 0.32, 2.1);
    }
    else if (k === 'plant') { // plante verte en pot
      hbox(0xb3592a, x, y, z, 0.42, 0.4, 0.42);
      for (let j = 0; j < 4; j++) hbox(0x2f9e4a, x + rand(-0.15, 0.15), y + 0.4 + j * 0.26, z + rand(-0.15, 0.15), 0.52 - j * 0.09, 0.28, 0.52 - j * 0.09);
      propBox(x, y, z, 0.24, 0.24, 0.66);
    }
    else hbox(accent, x, y + 0.01, z, 2.4, 0.03, 1.6); // tapis : décor plat, sans collision
    placed++;
  }
  // suspension au plafond : fil + abat-jour chaud, décalée à l'écart de l'escalier
  // et assez haute pour ne masquer ni la porte ni la fenêtre (2,6 m)
  const lx = cx + w / 8, lz = cz + d / 8;
  hbox(0x2b2f36, lx, y + 3.3, lz, 0.05, 0.35, 0.05, null);
  hbox(0xffe8b0, lx, y + 2.98, lz, 0.55, 0.3, 0.55, null);
}
// collider de décor indestructible (mobilier, coffres, caisses, pads…)
const propCols = [];
function propBox(x, y, z, hx, hz, h) {
  if (AGX) { x = AGX.X(x); z = AGX.Z(z); hx *= AGX.k; hz *= AGX.k; }
  const c = addCollider({ type: 'box', minX: x - hx, maxX: x + hx, minZ: z - hz, maxZ: z + hz, minY: y, maxY: y + h, indestructible: true, kind: 'prop' });
  propCols.push(c); return c;
}
function removePropCol(c) {
  if (!c) return;
  removeCollider(c);
  const i = propCols.indexOf(c); if (i >= 0) propCols.splice(i, 1);
}
// AABB englobant un rectangle tourné (coffres, caisses orientés)
// Collision circulaire (cylindre) faite de bandes de boîtes : suit exactement un socle ou un dôme rond, sans coins invisibles
function propDisc(x, y, z, r, h, n = 10) {
  const cols = [], w = (2 * r) / n;
  for (let i = 0; i < n; i++) {
    const x0 = -r + i * w, x1 = x0 + w, far = Math.max(Math.abs(x0), Math.abs(x1)); // bord le plus éloigné : la bande reste dans le cercle
    const hz = Math.sqrt(Math.max(0, r * r - far * far)); if (hz < 0.1) continue;
    cols.push(propBox(x + (x0 + x1) / 2, y, z, w / 2, hz, h));
  }
  return cols;
}
function propBoxRot(x, y, z, hx, hz, h, a) {
  const ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a));
  return propBox(x, y, z, hx * ca + hz * sa, hx * sa + hz * ca, h);
}
function buildHouseInner(cx, cz, baseY, w, d, rot, style) {
  // rot: 0..3 -> door side
  const ST = STYLE_COLS[style] || STYLE_COLS.wood;
  const wallHex = pick(ST.walls), roofHex = pick(ST.roofs), trim = ST.trim ?? 0xf4efe4, frame = ST.frame ?? 0x5a3a24, accent = pick([0xd2483a, 0x3b6fd1, 0x2f9e7a, 0xe08a2e, 0x9b59b6]);
  const mat = ST.mat;
  const twoStory = (style === 'brick' || style === 'wood' || style === 'adobe') && w >= 10 && R() < 0.45;
  const H = twoStory ? 4 : 4.2, T = 0.35, levels = twoStory ? 2 : 1;
  const o = { hp: ST.hp, mat };
  // foundation + floor
  makeStructBox(cx, baseY - 3, cz, w + 0.6, 3.15, d + 0.6, matC(style === 'beach' ? 0xc49a62 : 0x8d8a84), { indestructible: true });
  hbox(style === 'adobe' ? 0xc8a070 : 0xb98a5a, cx, baseY + 0.15, cz, w - 0.3, 0.03, d - 0.3);
  const sides = footprintSides(cx, cz, w, d);
  for (let lv = 0; lv < levels; lv++) {
    const ly = baseY + lv * H;
    sides.forEach((s, i) => {
      const door = lv === 0 && i === rot;
      const ops = [];
      if (door) ops.push({ u: 0, w: 1.8, y0: 0, y1: 2.6, kind: 'door' });
      else if (R() < 0.8) {
        const two = s.len >= 10 && R() < 0.6;
        if (two) ops.push({ u: -s.len / 4, w: 1.5, y0: 1.2, y1: 2.6, kind: 'win' }, { u: s.len / 4, w: 1.5, y0: 1.2, y1: 2.6, kind: 'win' });
        else ops.push({ u: 0, w: 1.6, y0: 1.2, y1: 2.6, kind: 'win' });
      }
      wallWithOpenings(s, ly, H, T, ops, wallHex, o);
      for (const op of ops) {
        const par = op.sill || op.lintel;
        if (op.kind === 'win') {
          windowFrame(s, ly, op, T, frame, par);
          if (style !== 'adobe') { // shutters
            const sh = style === 'chalet' ? 0x2f5a3a : style === 'beach' ? pick([0x3fa9ff, 0xff7aa8, 0x2fc4b2]) : accent;
            sbox(s, sh, op.u - op.w / 2 - 0.45, ly + op.y0, T / 2 + 0.06, 0.55, op.y1 - op.y0, 0.08, par);
            sbox(s, sh, op.u + op.w / 2 + 0.45, ly + op.y0, T / 2 + 0.06, 0.55, op.y1 - op.y0, 0.08, par);
          }
          if (style !== 'brick' && R() < 0.7) { // flower box
            sbox(s, 0x7a4e2c, op.u, ly + op.y0 - 0.55, T / 2 + 0.25, op.w + 0.1, 0.35, 0.4, par);
            for (let f = 0; f < 4; f++) sbox(s, pick([0xff4d6d, 0xffd23f, 0xff9de0, 0xffffff]), op.u - op.w / 2 + 0.25 + f * (op.w - 0.5) / 3, ly + op.y0 - 0.2, T / 2 + 0.25, 0.22, 0.22, 0.22, par);
          }
        } else {
          // porte réelle : elle s'ouvre avec E et bloque le passage fermée
          const doorC = style === 'adobe' ? 0x6e4a2c : style === 'chalet' ? 0x4a2e1a : accent;
          addDoor(s, ly, op, T, doorC);
          sbox(s, frame, 0, ly + op.y1, 0, op.w + 0.4, 0.2, T + 0.14, par);
          sbox(s, frame, -op.w / 2 - 0.08, ly, 0, 0.16, op.y1, T + 0.14, null);
          sbox(s, frame, op.w / 2 + 0.08, ly, 0, 0.16, op.y1, T + 0.14, null);
          sbox(s, 0x9a9690, 0, baseY - 0.25, T / 2 + 0.85, op.w + 1.2, 0.4, 1.3, null);
          if (style === 'wood' || style === 'chalet') {
            sbox(s, roofHex, 0, ly + 2.95, T / 2 + 0.85, op.w + 1.6, 0.16, 1.9, par);
            sbox(s, trim, -op.w / 2 - 0.65, baseY + 0.15, T / 2 + 1.6, 0.18, 2.8, 0.18, null);
            sbox(s, trim, op.w / 2 + 0.65, baseY + 0.15, T / 2 + 1.6, 0.18, 2.8, 0.18, null);
          } else if (style === 'beach') {
            const c1 = pick([0xff5a5a, 0x3fa9ff, 0x2fc4b2]);
            for (let k = 0; k < 5; k++) sbox(s, k % 2 ? 0xffffff : c1, -op.w / 2 - 0.5 + k * (op.w + 1) / 4.6, ly + 2.85, T / 2 + 0.7, (op.w + 1) / 5, 0.12, 1.4, par);
          } else if (style === 'brick') {
            sbox(s, 0xfff2b0, op.w / 2 + 0.55, ly + 1.9, T / 2 + 0.1, 0.22, 0.32, 0.2, par); // lamp
            sbox(s, 0x2b2f36, op.w / 2 + 0.55, ly + 2.2, T / 2 + 0.1, 0.3, 0.08, 0.26, par);
          } else if (style === 'adobe') {
            sbox(s, 0x2fb4a8, 0, ly + op.y1 + 0.2, 0, op.w + 0.7, 0.3, T + 0.2, par);
          }
        }
      }
    });
    // corner posts + floor band
    const ch = H, cy = ly;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) hbox(style === 'adobe' ? 0xc89a68 : trim, cx + sx * (w / 2), cy, cz + sz * (d / 2), 0.55, ch, 0.55);
    if (lv > 0) for (const s of sides) sbox(s, trim, 0, ly - 0.12, 0, s.len + 0.6, 0.24, T + 0.22);
  }
  // skirt band
  for (const s of sides) sbox(s, style === 'adobe' ? 0xb98a5a : 0x6b6560, 0, baseY + 0.15, 0, s.len + 0.5, 0.45, T + 0.12);
  if (twoStory) {
    // interior ramp (rises toward +z) and upper floor with a stair hole
    const x0 = cx - w / 2 + 0.2, z0 = cz - d / 2 + 0.2;
    hdeco(rampDecoGeo, 0x9a7048, x0 + 2, baseY + 2, z0 + 2, 1, 1, 1, Math.PI / 4, Math.PI, 0, null, 'YXZ');
    addCollider({ type: 'ramp', cx: x0 / CELL, cz: z0 / CELL, y: baseY, d: 2, minX: x0, maxX: x0 + CELL, minZ: z0, maxZ: z0 + CELL, minY: baseY, maxY: baseY + CELL });
    const slab = matC(0xd8c8a8);
    const ax0 = x0 + 4, ax1 = cx + w / 2;
    makeStructBox((ax0 + ax1) / 2, baseY + H - 0.12, cz, ax1 - ax0, 0.24, d, slab, { hp: 240, mat, indestructible: true });
    const bx0 = cx - w / 2, bz0 = z0 + 4, bz1 = cz + d / 2;
    makeStructBox((bx0 + ax0) / 2, baseY + H - 0.12, (bz0 + bz1) / 2, ax0 - bx0, 0.24, bz1 - bz0, slab, { hp: 240, mat, indestructible: true });
    // coffre de l'étage placé avant le mobilier : le mobilier évite son emplacement
    const upAvoid = [];
    if (R() < 0.6) { const c = spawnChest(cx + w / 4 + rand(-1, 1), baseY + H + 0.12, cz - d / 4); upAvoid.push({ x: c.x, z: c.z }); }
    furniture(cx, cz, baseY + H + 0.12, w, d, true, accent, upAvoid);
    lootSpots.push({ x: cx + w / 4, y: baseY + H + 0.15, z: cz + rand(-d / 4, d / 4) });
  }
  // coffre / caisse de munitions du rez posés avant le mobilier : plus rien n'apparaît dedans
  const avoid = [];
  if (R() < 0.75) { const c = spawnChest(cx + rand(-w / 4, w / 4), baseY, cz + rand(-d / 4, d / 4) + (twoStory ? 1 : 0)); avoid.push({ x: c.x, z: c.z }); }
  lootSpots.push({ x: cx + rand(0, w / 3), y: baseY + 0.2, z: cz + rand(-d / 3, d / 3) });
  if (R() < 0.5) { const a = spawnAmmoBox(cx + rand(0, w / 3), baseY, cz + rand(-d / 3, d / 3)); ammoBoxes.push(a); avoid.push({ x: a.x, z: a.z }); }
  furniture(cx, cz, baseY + 0.17, w, d, twoStory, accent, avoid);
  const topY = baseY + H * levels;
  // roof slab (walkable) + decorative roof
  const roofCol = makeStructBox(cx, topY, cz, w + 0.8, 0.35, d + 0.8, matC(style === 'adobe' ? 0xd8b080 : 0xe8dcc4), { hp: 220, mat });
  if (style === 'adobe') {
    for (const s of sides) sbox(s, 0xc99a62, 0, topY + 0.35, 0.1, s.len + 0.8, 0.7, 0.35, roofCol); // parapet
    for (const s of sides) for (let u = -s.len / 2 + 1; u < s.len / 2 - 0.5; u += 1.6) sbox(s, 0x6e4a2c, u, topY - 0.45, T / 2 + 0.3, 0.26, 0.26, 0.7, roofCol); // vigas
    if (R() < 0.6) { hdeco(CYL_GEO, 0xb8643a, cx + w / 4, topY + 0.85, cz - d / 4, 0.9, 1.0, 0.9, 0, 0, 0, roofCol); }
  } else {
    const roofH = style === 'chalet' ? 3.6 : style === 'beach' ? 1.8 : 2.6;
    const shadC = style === 'chalet' ? 0x6e4a30 : style === 'brick' ? pick([0x8a4a3a, 0x6b5548, 0x5a6a75]) : style === 'beach' ? pick([0xc98a4a, 0x4a9a7a, 0x7a8a9a]) : pick([0x7a5535, 0x5a4a3a, 0x94553a]);
    gableRoof(cx, cz, topY + 0.35, w, d, roofH, wallHex, roofHex, { parent: roofCol, snow: style === 'chalet', drain: true, shingles: shadC, chimney: style === 'beach' ? 0 : style === 'chalet' ? 0x8d8a84 : 0xa0523d, trim: frame });
    // Lucarnes de toit (dormers) sur grandes toitures pour le charme architectural Fortnite
    if (w >= 10 && d >= 8 && style !== 'adobe') {
      const dormY = topY + roofH * 0.42;
      const dOff = (w <= d ? d : w) * 0.22;
      const alongZ = w <= d;
      const dormHex = wallHex;
      const dormSpan = (alongZ ? d : w) + 0.5;
      if (alongZ) {
        hbox(dormHex, cx - dormSpan / 2 + 0.4, dormY, cz + dOff, 1.4, 1.2, 1.4, roofCol);
        hbox(0x9fc8e8, cx - dormSpan / 2 + 0.15, dormY + 0.2, cz + dOff, 0.1, 0.7, 0.8, roofCol);
        hbox(shadC, cx - dormSpan / 2 + 0.4, dormY + 1.25, cz + dOff, 1.6, 0.15, 1.6, roofCol);
      } else {
        hbox(dormHex, cx + dOff, dormY, cz - dormSpan / 2 + 0.4, 1.4, 1.2, 1.4, roofCol);
        hbox(0x9fc8e8, cx + dOff, dormY + 0.2, cz - dormSpan / 2 + 0.15, 0.8, 0.7, 0.1, roofCol);
        hbox(shadC, cx + dOff, dormY + 1.25, cz - dormSpan / 2 + 0.4, 1.6, 0.15, 1.6, roofCol);
      }
    }
  }
  if (style === 'beach' && R() < 0.8) { // surfboard + deck chair outside
    const s = sides[(rot + 1) % 4];
    sbox(s, pick([0xff5a5a, 0x3fa9ff, 0xffd23f]), 0, baseY + 0.15, T / 2 + 0.2, 0.55, 2.2, 0.1);
  }
  // --- cour réaliste façon Fortnite : allée, boîte aux lettres, buissons taillés, banc ---
  {
    const ds = sides[rot], DW = ds.len;
    const walkC = style === 'adobe' ? 0xc9a570 : 0x9a9a92;
    // allée depuis la porte vers l'extérieur
    for (let k = 0; k < 4; k++) sbox(ds, walkC, 0, baseY + 0.12, T / 2 + 1.8 + k * 1.15, DW * 0.4 + 0.6, 0.04, 1.0, null);
    // boîte aux lettres sur poteau
    const mOff = DW * 0.45 + 1.2;
    sbox(ds, 0x4a3a28, 0, baseY + 0.55, T / 2 + 2.6 + 1.0, 0.1, 0.8, 0.1, null);
    sbox(ds, pick([0x3b6fd1, 0xd2483a, 0x2f9e7a]), 0, baseY + 1.05, T / 2 + 2.6 + 1.0, 0.32, 0.3, 0.45, null);
    // buissons taillés de chaque côté de la porte
    for (const sgn of [-1, 1]) {
      const bx = sgn * (DW * 0.5 + 1.1);
      hbox(0x2f7a3a, ds.x + (ds.ax === 'x' ? bx : ds.out * (T / 2 + 1.2)), baseY + 0.5, ds.z + (ds.ax === 'x' ? ds.out * (T / 2 + 1.2) : bx), 1.1, 1.0, 1.1);
    }
    // banc / table de pique-nique devant, parfois
    if (R() < 0.5) {
      const bOff = DW * 0.5 + 2.6;
      sbox(ds, 0x8a6a42, 0, baseY + 0.5, T / 2 + bOff, 1.7, 0.08, 0.55, null);
      sbox(ds, 0x6b4a2c, 0, baseY + 0.22, T / 2 + bOff - 0.25, 1.7, 0.28, 0.08, null);
    }
  }
  // chest / loot (déplacés avant furniture() : voir plus haut)
}
// Apartment buildings: 3 to 5 storeys, zig-zag interior ramps, rooftop access
const TOWER_PAL = [
  { wall: 0xe8e1d0, trim: 0xb8b0a0, accent: 0xd2483a }, { wall: 0x9fb4c7, trim: 0xf2efe6, accent: 0xffb43a },
  { wall: 0xc98b6b, trim: 0xf2efe6, accent: 0x2f9e7a }, { wall: 0x8fa39a, trim: 0xe9e4d6, accent: 0x3b6fd1 },
  { wall: 0xd9c9a3, trim: 0x6b6560, accent: 0xb65cff },
];
const towers = [];
function buildTowerInner(cx, cz, baseY, w, d, floors, rot, pal) {
  towers.push({ cx, cz, baseY, w, d, floors, X0: cx - w / 2 + 0.25, Z0: cz - d / 2 + 0.25 });
  const PAL = pal || pick(TOWER_PAL), H = 4, T = 0.4, frame = 0x2f3540;
  const o = { hp: 300, mat: 'stone' };
  makeStructBox(cx, baseY - 3, cz, w + 0.8, 3.15, d + 0.8, matC(0x8d8a84), { indestructible: true });
  hbox(0x9aa0a6, cx, baseY + 0.15, cz, w - 0.3, 0.03, d - 0.3);
  const sides = footprintSides(cx, cz, w, d);
  const X0 = cx - w / 2 + T / 2 + 0.05, Z0 = cz - d / 2 + T / 2 + 0.05;
  const cellA = [X0, Z0], cellB = [X0 + 4, Z0 + 4];
  for (let f = 0; f < floors; f++) {
    const ly = baseY + f * H;
    sides.forEach((s, i) => {
      const ops = [];
      const n = Math.max(2, Math.floor((s.len - 1) / 3.2));
      for (let k = 0; k < n; k++) {
        const u = -s.len / 2 + (k + 0.5) * s.len / n;
        if (f === 0 && (i === rot || i === (rot + 2) % 4) && k === Math.floor(n / 2)) ops.push({ u, w: 2.0, y0: 0, y1: 2.8, kind: 'door' });
        else if (f === 0) ops.push({ u, w: 2.0, y0: 0.7, y1: 2.9, kind: 'shop' });
        else ops.push({ u, w: 1.5, y0: 1.0, y1: 2.8, kind: 'win' });
      }
      wallWithOpenings(s, ly, H, T, ops, PAL.wall, o);
      for (const op of ops) {
        const par = op.sill || op.lintel;
        if (op.kind === 'door') {
          sbox(s, frame, op.u, ly + op.y1, 0, op.w + 0.4, 0.2, T + 0.14, par);
          addDoor(s, ly, op, T, 0x6e4a2c); // vraie porte qui s'ouvre avec E
          const c1 = PAL.accent;
          for (let k = 0; k < 5; k++) sbox(s, k % 2 ? 0xffffff : c1, op.u - op.w / 2 - 0.4 + k * (op.w + 0.8) / 4.6, ly + 3.05, T / 2 + 0.75, (op.w + 0.8) / 5, 0.12, 1.5, par);
        } else {
          windowFrame(s, ly, op, T, frame, par);
          if (op.kind === 'win' && R() < 0.15) { // AC unit
            sbox(s, 0xd8dde2, op.u + 0.4, ly + op.y0 - 0.75, T / 2 + 0.3, 0.8, 0.55, 0.5, par);
            sbox(s, 0x6b7177, op.u + 0.4, ly + op.y0 - 0.55, T / 2 + 0.56, 0.5, 0.3, 0.04, par);
          }
          if (op.kind === 'win' && R() < 0.12) { // balcony (walkable)
            const b = s.ax === 'x' ? makeStructBox(s.x + op.u, ly - 0.12, s.z + s.out * (T / 2 + 0.7), op.w + 1.0, 0.18, 1.4, matC(PAL.trim), { hp: 150, mat: 'stone' }) : makeStructBox(s.x + s.out * (T / 2 + 0.7), ly - 0.12, s.z + op.u, 1.4, 0.18, op.w + 1.0, matC(PAL.trim), { hp: 150, mat: 'stone' });
            sbox(s, frame, op.u, ly + 0.06, T / 2 + 1.35, op.w + 1.0, 0.9, 0.06, b);
            sbox(s, frame, op.u - op.w / 2 - 0.47, ly + 0.06, T / 2 + 0.7, 0.06, 0.9, 1.4, b);
            sbox(s, frame, op.u + op.w / 2 + 0.47, ly + 0.06, T / 2 + 0.7, 0.06, 0.9, 1.4, b);
          }
        }
      }
      if (f === 0) sbox(s, PAL.accent, 0, ly + 3.2, T / 2 + 0.05, Math.min(5, s.len * 0.45), 0.6, 0.12); // shop sign band
    });
    // floor ledge + corner pilasters
    for (const s of sides) sbox(s, PAL.trim, 0, ly + H - 0.2, 0, s.len + 0.7, 0.3, T + 0.3);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) hbox(PAL.trim, cx + sx * (w / 2), ly, cz + sz * (d / 2), 0.7, H, 0.7);
    // ramp from storey f to f+1 (alternating cells so the climb zig-zags)
    const even = f % 2 === 0, cell = even ? cellA : cellB, dd = even ? 2 : 0;
    hdeco(rampDecoGeo, 0x8a8f96, cell[0] + 2, ly + 2, cell[1] + 2, 1, 1, 1, Math.PI / 4, even ? Math.PI : 0, 0, null, 'YXZ');
    addCollider({ type: 'ramp', cx: cell[0] / CELL, cz: cell[1] / CELL, y: ly, d: dd, minX: cell[0], maxX: cell[0] + CELL, minZ: cell[1], maxZ: cell[1] + CELL, minY: ly, maxY: ly + CELL });
    // slab of the storey above, with a hole over this ramp
    const sy = ly + H - 0.12, slabM = matC(f === floors - 1 ? 0xb8b4ac : 0xd8d2c4);
    const fx0 = cx - w / 2 + T / 2, fx1 = cx + w / 2 - T / 2, fz0 = cz - d / 2 + T / 2, fz1 = cz + d / 2 - T / 2;
    const hx0 = cell[0], hx1 = cell[0] + CELL, hz0 = cell[1], hz1 = cell[1] + CELL;
    const rect = (a, b, c, e) => { if (b - a > 0.1 && e - c > 0.1) makeStructBox((a + b) / 2, sy, (c + e) / 2, b - a, 0.24, e - c, slabM, { hp: 300, mat: 'stone', indestructible: true }); };
    rect(fx0, hx0, fz0, fz1); rect(hx1, fx1, fz0, fz1); rect(hx0, hx1, fz0, hz0); rect(hx0, hx1, hz1, fz1);
    // loot on each storey
    const fy = f === 0 ? baseY + 0.17 : ly + 0.12;
    if (f > 0) hbox(0xa89a84, cx + w / 4, fy - 0.02, cz + d / 4, w / 2 - 1, 0.03, d / 2 - 1);
    // coffre posé avant le mobilier de l'étage
    const tAvoid = [];
    if (R() < 0.5) { const c = spawnChest(cx + w / 4 + rand(-1, 1), fy - 0.02, cz + rand(-d / 4, d / 4)); tAvoid.push({ x: c.x, z: c.z }); }
    furniture(cx + w / 8, cz + d / 8, fy, w * 0.7, d * 0.7, true, PAL.accent, tAvoid);
    lootSpots.push({ x: cx + rand(0, w / 3), y: fy + 0.05, z: cz + rand(0, d / 3) });
  }
  // rooftop: parapet, water tank, AC units, antenna
  const topY = baseY + floors * H;
  for (const s of sides) {
    if (s.ax === 'x') makeStructBox(s.x, topY + 0.12, s.z, s.len + T, 1.0, T, matC(PAL.wall), o);
    else makeStructBox(s.x, topY + 0.12, s.z, T, 1.0, s.len - T, matC(PAL.wall), o);
    sbox(s, PAL.trim, 0, topY + 1.1, 0, s.len + 0.6, 0.18, T + 0.25);
  }
  const tx = cx + w / 4, tz = cz - d / 4;
  for (const [a, b] of [[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]]) hbox(0x4a4f5a, tx + a, topY + 0.12, tz + b, 0.16, 1.4, 0.16);
  hdeco(CYL_GEO, 0x8a6a4a, tx, topY + 2.4, tz, 2.0, 2.0, 2.0);
  hdeco(CYL_GEO, 0x5a3a24, tx, topY + 3.5, tz, 2.1, 0.2, 2.1);
  hbox(0xd8dde2, cx - w / 4, topY + 0.12, cz + d / 4, 1.6, 0.9, 1.1); hbox(0x6b7177, cx - w / 4, topY + 1.02, cz + d / 4, 1.0, 0.08, 0.8);
  hbox(0x6b7177, cx + w / 3, topY + 0.12, cz + d / 3, 0.1, 4.5, 0.1); hbox(0xff3b3b, cx + w / 3, topY + 4.6, cz + d / 3, 0.25, 0.25, 0.25);
  if (R() < 0.7) spawnChest(cx - w / 4, topY + 0.12, cz - d / 4 + 1);
  lootSpots.push({ x: cx, y: topY + 0.2, z: cz + d / 4 });
}

function spawnChest(x, y, z) {
  const g = new THREE.Group();
  const gold = matC(0xffc93a, { emissive: 0x8a5a00, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.4 });
  const goldDark = matC(0xc98a1c, { emissive: 0x6a3f00, emissiveIntensity: 0.4 });
  const bronze = matC(0x8a5a20, { metalness: 0.55, roughness: 0.45 });
  const dark = matC(0x3a2410, { roughness: 0.6 });
  // CAISSON CREUX : 4 parois + fond, intérieur vraiment vide et visible
  // (les faces intérieures des parois sont rendues : c'est un vrai volume creux).
  addBox(g, 1.1, 0.12, 0.7, 0, 0.06, 0, goldDark);                          // fond
  addBox(g, 1.12, 0.62, 0.08, 0, 0.43, 0.31, goldDark);                     // paroi avant
  addBox(g, 1.12, 0.62, 0.08, 0, 0.43, -0.31, goldDark);                    // paroi arrière
  addBox(g, 0.08, 0.62, 0.54, 0.52, 0.43, 0, goldDark);                     // paroi droite
  addBox(g, 0.08, 0.62, 0.54, -0.52, 0.43, 0, goldDark);                    // paroi gauche
  // fond intérieur sombre (le vide du coffre une fois vidé)
  addBox(g, 0.94, 0.06, 0.54, 0, 0.15, 0, matC(0x241708, { roughness: 0.95 }));
  // couvercle : groupe (les détails suivent l'ouverture)
  const lid = new THREE.Group(); lid.position.y = 0.74;
  const lidTop = new THREE.Mesh(BOX, gold); lidTop.scale.set(1.15, 0.25, 0.75); lid.add(lidTop);
  // chanfre avant + arête du couvercle
  addBox(lid, 1.17, 0.1, 0.14, 0, -0.06, 0.33, gold);
  // charnières arrière
  addBox(lid, 0.14, 0.09, 0.1, -0.42, 0.1, -0.36, bronze);
  addBox(lid, 0.14, 0.09, 0.1, 0.42, 0.1, -0.36, bronze);
  // rivets dorés sur le couvercle
  for (const rx of [-0.48, -0.16, 0.16, 0.48]) { addBox(lid, 0.07, 0.07, 0.07, rx, 0.13, 0.31, gold); addBox(lid, 0.07, 0.07, 0.07, rx, 0.13, -0.31, gold); }
  // corps : coins renforcés extérieurs (rien ne traverse l'intérieur)
  for (const [cx2, cz2] of [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]]) addBox(g, 0.1, 0.64, 0.1, cx2, 0.3, cz2, bronze);
  // plaque de serrure avant avec trou de clé
  addBox(g, 0.32, 0.24, 0.06, 0, 0.55, 0.36, dark);
  addBox(g, 0.07, 0.1, 0.05, 0, 0.57, 0.4, matC(0x120c04));
  addBox(g, 0.16, 0.05, 0.05, 0, 0.66, 0.4, bronze);
  // rivets sur le devant du corps
  for (const rx of [-0.42, 0.42]) { addBox(g, 0.06, 0.06, 0.06, rx, 0.3, 0.36, gold); addBox(g, 0.06, 0.06, 0.06, rx, 0.6, 0.36, gold); }
  g.add(lid); g.position.set(x, y, z); g.rotation.y = rand(6.28);
  // AABB tourné : le coffre (1,15 x 0,75, ~0,9 de haut avec le couvercle) bloque dans toutes les orientations
  const col = propBoxRot(x, y, z, 0.6, 0.42, 0.9, g.rotation.y);
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  const light = { intensity: 0, distance: 6, color: 0xffc240, y: 1.2, obj: g }; // drawn by the light pool
  scene.add(g);
  const c = { x, y, z, mesh: g, lid, light, opened: false, col };
  chests.push(c); return c;
}
function spawnAmmoBox(x, y, z) {
  const g = new THREE.Group();
  const olive = matC(0x4f6b2f, { roughness: 0.75 });
  const oliveDark = matC(0x3d5524, { roughness: 0.75 });
  const steel = matC(0x8a9098, { metalness: 0.6, roughness: 0.4 });
  // CAISSE CREUSE : 4 parois + fond, intérieur vide visible une fois ouverte
  addBox(g, 0.9, 0.1, 0.55, 0, 0.05, 0, olive);                       // fond
  addBox(g, 0.92, 0.4, 0.07, 0, 0.3, 0.24, olive);                    // paroi avant
  addBox(g, 0.92, 0.4, 0.07, 0, 0.3, -0.24, olive);                   // paroi arrière
  addBox(g, 0.07, 0.4, 0.41, 0.415, 0.3, 0, olive);                  // paroi droite
  addBox(g, 0.07, 0.4, 0.41, -0.415, 0.3, 0, olive);                 // paroi gauche
  addBox(g, 0.76, 0.08, 0.4, 0, 0.15, 0, matC(0x1a2010, { roughness: 0.95 })); // fond intérieur sombre (cavité vide)
  // couvercle articulé à l'arrière (s'ouvre comme le coffre)
  const lid = new THREE.Group(); lid.position.set(0, 0.5, -0.24);
  addBox(lid, 0.94, 0.08, 0.6, 0, 0, 0.28, oliveDark);
  addBox(lid, 0.96, 0.05, 0.14, 0, 0.065, 0.28, matC(0xd8c24a));      // sangle jaune
  // munitions visibles sur le dessus (disparaissent quand on vide la caisse)
  const tops = new THREE.Group(); tops.position.y = 0.5;
  addBox(tops, 0.34, 0.1, 0.22, -0.18, 0.06, 0.05, matC(0x2b2f36, { metalness: 0.5, roughness: 0.5 }));
  addBox(tops, 0.3, 0.05, 0.16, 0.2, 0.05, -0.08, matC(0xa8834a));
  const cyl = new THREE.Mesh(CYL_GEO, matC(0xd8b64a, { metalness: 0.5, roughness: 0.4 }));
  cyl.scale.set(0.09, 0.3, 0.09); cyl.rotation.z = Math.PI / 2; cyl.position.set(0.05, 0.1, 0.14); tops.add(cyl);
  // coins métal renforcés
  for (const [cx2, cz2] of [[-0.44, -0.26], [0.44, -0.26], [-0.44, 0.26], [0.44, 0.26]]) addBox(g, 0.08, 0.5, 0.08, cx2, 0.25, cz2, steel);
  // poignées latérales
  addBox(g, 0.06, 0.08, 0.2, -0.47, 0.28, 0, steel);
  addBox(g, 0.06, 0.08, 0.2, 0.47, 0.28, 0, steel);
  // marquage pochoir
  addBox(g, 0.3, 0.22, 0.02, 0, 0.24, 0.29, matC(0xd8c24a, { roughness: 0.9 }));
  g.add(lid, tops); g.position.set(x, y, z); g.rotation.y = rand(6.28); scene.add(g);
  const col = propBoxRot(x, y, z, 0.48, 0.32, 0.6, g.rotation.y); // caisse solide (0,94 x 0,62 x 0,58)
  return { x, y, z, mesh: g, lid, tops, opened: false, col };
}
// ouvre la caisse de munitions : le couvercle bascule, l'intérieur vide reste en place
function openAmmoBox(c) {
  if (c.opened) return;
  c.opened = true;
  c.lid.rotation.x = -1.45;
  c.tops.visible = false; // les munitions du dessus sont emportées
  sfxAt('pickup', _v1.set(c.x, c.y + 0.3, c.z), 0.8);
}

// Cars (metal source)
const cars = [];
function spawnCar(x, z, rot) {
  const y = terrainH(x, z);
  const col = pick([0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0xecf0f1]);
  const body = makeStructBox(x, y + 0.35, z, 2.0, 0.9, 4.2, matC(col, { metalness: 0.4, roughness: 0.4 }), { hp: 300, mat: 'metal' });
  const cab = makeStructBox(x, y + 1.25, z + 0.3, 1.8, 0.75, 2.2, matC(0x9fd8ff, { metalness: 0.2, roughness: 0.2 }), { hp: 300, mat: 'metal' });
  for (const [dx, dz] of [[-1, -1.3], [1, -1.3], [-1, 1.3], [1, 1.3]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 10), matC(0x1d1d22)); w.rotation.z = Math.PI / 2; w.position.set(x + dx, y + 0.38, z + dz); scene.add(w);
    body.deco = body.deco || []; (Array.isArray(body.deco) ? body.deco : []).push(w);
  }
  cars.push(body, cab);
}

// Populate POIs
for (const p of POIS) {
  if (p.spy) continue; // les POI espions sont construits plus bas
  const n = Math.max(3, Math.round(p.r / 5.5));
  const placed = [];
  if (p.style === 'city') {
    // downtown: a ring of tall buildings around a plaza
    const slots = [[-12, -12], [12, -12], [12, 12], [-12, 12], [0, -19], [0, 19]];
    slots.forEach(([ox, oz], k) => {
      const big = k < 4, w = big ? pick([12, 13]) : 10, d = big ? pick([12, 13]) : 9;
      const x = p.x + ox, z = p.z + oz;
      placed.push({ x, z, w, d });
      if (big) buildTower(x, z, p.h, w, d, randi(3, 5), randi(0, 3)); else buildHouse(x, z, p.h, w, d, oz < 0 ? 2 : 0, 'brick');
    });
    // plaza fountain (decorative)
    curHouse = { boxes: [], deco: [], mesh: null };
    hdeco(CYL_GEO, 0xb8b4ac, p.x, p.h + 0.3, p.z, 5, 0.6, 5); hdeco(CYL_GEO, 0x3fb7e8, p.x, p.h + 0.62, p.z, 4.4, 0.05, 4.4);
    hdeco(CYL_GEO, 0xb8b4ac, p.x, p.h + 1.2, p.z, 0.6, 1.8, 0.6); hdeco(CYL_GEO, 0xb8b4ac, p.x, p.h + 2.1, p.z, 1.8, 0.2, 1.8);
    { const H = curHouse; curHouse = null; finishHouse(H); }
  }
  for (let k = 0, tries = 0; p.style !== 'city' && k < n && tries < 80; tries++) {
    const a = rand(Math.PI * 2), r = rand(4, p.r - 6);
    const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
    const w = pick([8, 10, 12]), d = pick([8, 10]);
    if (placed.some((q) => Math.abs(q.x - x) < (q.w + w) / 2 + 3 && Math.abs(q.z - z) < (q.d + d) / 2 + 3)) continue;
    // a few taller apartment buildings in the brick towns
    if (p.style === 'brick' && k < 2 && tries < 40) {
      const tw = 12, td = 12;
      if (placed.some((q) => Math.abs(q.x - x) < (q.w + tw) / 2 + 3 && Math.abs(q.z - z) < (q.d + td) / 2 + 3) || Math.hypot(x - p.x, z - p.z) > p.r - 8) continue;
      placed.push({ x, z, w: tw, d: td }); buildTower(x, z, p.h, tw, td, randi(3, 4), randi(0, 3)); k++; continue;
    }
    placed.push({ x, z, w, d });
    buildHouse(x, z, p.h, w, d, randi(0, 3), p.style);
    k++;
  }
  for (let k = 0; k < 2; k++) {
    const a = rand(6.28), r = rand(4, p.r);
    const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
    if (placed.some((q) => Math.abs(q.x - x) < q.w / 2 + 3 && Math.abs(q.z - z) < q.d / 2 + 4)) continue;
    spawnCar(x, z, 0);
  }
}
// Stray chests / ammo in the wild
for (let i = 0; i < 18; i++) {
  const a = rand(6.28), r = Math.sqrt(R()) * ISLAND_R * 0.8, x = Math.cos(a) * r * OVAL_X, z = Math.sin(a) * r * OVAL_Z, h = terrainH(x, z);
  if (h < 2) continue;
  if (i % 2) spawnChest(x, h - 0.05, z); else ammoBoxes.push(spawnAmmoBox(x, h - 0.05, z));
}

// =====================================================================
// Item meshes
// =====================================================================
function addBox(g, w, h, d, x, y, z, m) { const b = new THREE.Mesh(BOX, m); b.scale.set(w, h, d); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; }
function makeGun(id, rarity = 0) {
  // armes à feu : modèles détaillés de js/weapons.js (géométrie partagée entre toutes les instances)
  if (id !== 'pickaxe') return buildGun(id, RAR[rarity].color);
  const g = new THREE.Group();
  const dark = matC(0x2b2f36, { roughness: 0.5, metalness: 0.4 }), acc = matC(RAR[rarity].color, { roughness: 0.5, emissive: RAR[rarity].color, emissiveIntensity: 0.15 }), wood = matC(0x8a5a32);
  let mz = -0.8;
  if (id === 'pickaxe') {
    addBox(g, 0.07, 0.07, 1.0, 0, 0, -0.2, wood);
    const head = addBox(g, 0.7, 0.12, 0.12, 0, 0, -0.68, matC(0x7d8fa8, { metalness: 0.6, roughness: 0.3 }));
    addBox(g, 0.12, 0.16, 0.16, 0.36, -0.04, -0.68, matC(0x9fe3ff, { emissive: 0x3aa8ff, emissiveIntensity: 0.5 }));
    addBox(g, 0.12, 0.16, 0.16, -0.36, -0.04, -0.68, matC(0x9fe3ff, { emissive: 0x3aa8ff, emissiveIntensity: 0.5 }));
    mz = -0.7;
  } else if (id === 'ar') {
    addBox(g, 0.12, 0.17, 0.75, 0, 0, -0.15, dark); addBox(g, 0.06, 0.06, 0.38, 0, 0.03, -0.7, dark);
    addBox(g, 0.1, 0.24, 0.13, 0, -0.17, -0.18, acc); addBox(g, 0.1, 0.16, 0.3, 0, -0.02, 0.36, acc);
    addBox(g, 0.05, 0.07, 0.25, 0, 0.13, -0.12, dark); mz = -0.9;
  } else if (id === 'smg') {
    addBox(g, 0.12, 0.17, 0.52, 0, 0, -0.1, dark); addBox(g, 0.06, 0.06, 0.2, 0, 0.03, -0.45, dark);
    addBox(g, 0.08, 0.3, 0.1, 0, -0.2, -0.12, acc); addBox(g, 0.08, 0.1, 0.22, 0, 0.0, 0.25, acc); mz = -0.56;
  } else if (id === 'shotgun') {
    addBox(g, 0.13, 0.15, 0.55, 0, 0, -0.05, dark); addBox(g, 0.08, 0.08, 0.55, 0, 0.04, -0.55, dark);
    addBox(g, 0.1, 0.09, 0.3, 0, -0.07, -0.45, wood); addBox(g, 0.11, 0.18, 0.38, 0, -0.04, 0.38, acc); mz = -0.85;
  } else if (id === 'sniper') {
    addBox(g, 0.12, 0.16, 0.8, 0, 0, -0.05, acc); addBox(g, 0.05, 0.05, 0.75, 0, 0.03, -0.8, dark);
    const sc2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), dark); sc2.rotation.x = Math.PI / 2; sc2.position.set(0, 0.16, -0.05); g.add(sc2);
    addBox(g, 0.1, 0.18, 0.3, 0, -0.03, 0.45, dark); mz = -1.18;
  } else if (id === 'drum' || id === 'minigun') {
    addBox(g, 0.16, 0.2, 0.9, 0, 0, -0.1, dark); addBox(g, 0.07, 0.07, 0.4, 0, 0.04, -0.85, dark);
    const dr = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.22, 12), matC(id === 'drum' ? 0xd9a900 : 0x3a4150, { metalness: 0.6 })); dr.rotation.x = Math.PI / 2; dr.position.set(0, -0.22, 0.05); g.add(dr);
    if (id === 'minigun') { const b3 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 8), dark); b3.rotation.x = Math.PI / 2; b3.position.set(0, 0.02, -0.6); g.add(b3); }
    addBox(g, 0.12, 0.1, 0.3, 0, -0.04, 0.4, acc); mz = -1.0;
  } else if (id === 'scar' || id === 'heavyar') {
    addBox(g, 0.13, 0.18, 0.8, 0, 0, -0.1, dark); addBox(g, 0.06, 0.06, 0.42, 0, 0.04, -0.75, dark);
    addBox(g, 0.1, 0.26, 0.14, 0, -0.19, -0.15, acc); addBox(g, 0.1, 0.16, 0.32, 0, -0.02, 0.4, acc);
    if (id === 'heavyar') addBox(g, 0.14, 0.08, 0.5, 0, 0.14, -0.2, dark);
    mz = -0.95;
  } else if (id === 'boombow') {
    const limb = (s) => { const b = addBox(g, 0.06, 0.7, 0.06, s * 0.34, 0.1, -0.5, matC(0x8a5a32)); b.rotation.z = s * 0.5; };
    limb(1); limb(-1);
    addBox(g, 0.05, 0.05, 1.0, 0, 0.1, -0.5, dark); addBox(g, 0.09, 0.12, 0.3, 0, -0.05, -0.35, matC(0xff5a3d, { emissive: 0xff5a3d, emissiveIntensity: 0.4 }));
    mz = -0.95;
  } else if (id === 'grapple') {
    const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 10), dark); rl.rotation.x = Math.PI / 2; rl.position.set(0, 0.02, -0.1); g.add(rl);
    const hk = addBox(g, 0.1, 0.1, 0.18, 0, 0.02, -0.42, matC(0x9fe3ff, { emissive: 0x3aa8ff, emissiveIntensity: 0.6 }));
    addBox(g, 0.05, 0.05, 0.3, 0, 0.02, -0.3, matC(0x7fe0ff, { emissive: 0x2aa8ff, emissiveIntensity: 0.5 }));
    mz = -0.5;
  }
  const m = new THREE.Object3D(); m.position.set(0, 0.03, mz); g.add(m); g.userData.muzzle = m;
  return g;
}
function makeConsumMesh(id) {
  const g = new THREE.Group();
  if (id === 'shieldS' || id === 'shieldL') {
    const s = id === 'shieldL' ? 1.3 : 0.9;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 12, 10), new THREE.MeshStandardMaterial({ color: 0x3db7ff, emissive: 0x1a7fd6, emissiveIntensity: 0.7, transparent: true, opacity: 0.9, roughness: 0.2 }));
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * s, 0.08 * s, 0.2 * s, 8), matC(0xdff4ff)); n.position.y = 0.25 * s;
    g.add(b, n);
  } else if (id === 'medkit') {
    addBox(g, 0.6, 0.4, 0.3, 0, 0, 0, matC(0xffffff)); addBox(g, 0.32, 0.1, 0.32, 0, 0, 0.0, matC(0xe23b3b)).scale.set(0.32, 0.1, 0.31);
    addBox(g, 0.1, 0.3, 0.31, 0, 0, 0, matC(0xe23b3b)); addBox(g, 0.3, 0.1, 0.31, 0, 0, 0, matC(0xe23b3b));
  } else {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.25, 12), matC(0xf2e6d0)); r.rotation.z = Math.PI / 2; g.add(r);
  }
  return g;
}

// =====================================================================
// Loot on the ground
// =====================================================================
const loot = [];
const beamGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6, 1, true); beamGeo.translate(0, 1.3, 0);
const beamMats = RAR.map((r) => new THREE.MeshBasicMaterial({ color: r.color, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
const ringGeo = new THREE.RingGeometry(0.35, 0.5, 20); ringGeo.rotateX(-Math.PI / 2);
function spawnLoot(item, x, y, z, toss = true) {
  const g = new THREE.Group();
  let model;
  if (item.kind === 'weapon') {
    // l'arme est centrée dans un pivot : la rotation de présentation tourne sur elle-même
    const gun = makeGun(item.id, item.rarity); gun.rotation.y = Math.PI / 2; gun.scale.setScalar(item.id === 'minigun' || item.id === 'sniper' ? 0.62 : 0.8); gun.updateMatrix();
    const bc = new THREE.Box3().setFromObject(gun).getCenter(new THREE.Vector3()); gun.position.set(-bc.x, -bc.y, -bc.z);
    model = new THREE.Group(); model.add(gun);
  }
  else if (item.kind === 'consum') model = makeConsumMesh(item.id);
  else if (item.kind === 'ammo') { model = new THREE.Group(); addBox(model, 0.4, 0.25, 0.3, 0, 0, 0, matC(0x6b7f3a)); addBox(model, 0.42, 0.06, 0.32, 0, 0.06, 0, matC(0xe0c04a)); }
  else if (item.kind === 'keycard') { model = new THREE.Group(); addBox(model, 0.6, 0.05, 0.38, 0, 0, 0, matC(0xffc400, { metalness: 0.7, roughness: 0.25, emissive: 0x8a6a00, emissiveIntensity: 0.6 })); addBox(model, 0.12, 0.07, 0.05, 0.16, 0.02, 0.14, matC(0x2c313c)); }
  else { model = new THREE.Group(); addBox(model, 0.5, 0.5, 0.5, 0, 0, 0, BUILD_MATS[item.mat]); }
  model.position.y = 0.55; g.add(model);
  const rar = item.kind === 'weapon' ? item.rarity : item.kind === 'consum' ? (item.id === 'shieldL' || item.id === 'medkit' ? 2 : 1) : item.kind === 'keycard' ? 5 : 0;
  if (item.kind !== 'mats' && item.kind !== 'ammo') {
    const beam = new THREE.Mesh(beamGeo, beamMats[rar]); g.add(beam);
    const ring = new THREE.Mesh(ringGeo, beamMats[rar]); ring.position.y = 0.05; g.add(ring);
  }
  g.position.set(x, y, z);
  g.traverse((o) => { o.castShadow = false; });
  scene.add(g);
  const L = { item, mesh: g, model, pos: g.position, vel: new THREE.Vector3(toss ? rand(-2.5, 2.5) : 0, toss ? 5 : 0, toss ? rand(-2.5, 2.5) : 0), alive: true, t: rand(6) };
  loot.push(L); return L;
}
const SHARED_GEO = new Set();
function removeLoot(L) {
  L.alive = false; scene.remove(L.mesh);
  // free GPU buffers of one-off geometries (shared ones are re-uploaded automatically if reused)
  L.mesh.traverse((o) => { if (o.geometry && !SHARED_GEO.has(o.geometry) && !SHARED_WEAPON_GEOS.has(o.geometry) && o.geometry !== BOX) o.geometry.dispose(); });
}
function randRarity(bonus = 0) {
  const w = [42, 30, 17, 8, 3]; let r = R() * 100, k = 0;
  while (k < 4 && r > w[k]) { r -= w[k]; k++; }
  return clamp(k + bonus, 0, 4);
}
function randWeaponItem(bonus = 0) {
  const r = R(); const id = r < 0.36 ? 'ar' : r < 0.6 ? 'shotgun' : r < 0.86 ? 'smg' : 'sniper';
  const it = { kind: 'weapon', id, rarity: randRarity(bonus), mag: 0 }; it.mag = magOf(it); return it;
}
function randConsum() { const id = pick(['bandage', 'bandage', 'shieldS', 'shieldS', 'shieldL', 'medkit']); return { kind: 'consum', id, count: CONSUM[id].give }; }
function ammoFor(id) { const W = WEAPONS[id]; const amt = { medium: 30, light: 36, shells: 8, heavy: 6 }[W.ammo]; return { kind: 'ammo', type: W.ammo, amount: amt }; }

for (const s of lootSpots) {
  const it = R() < 0.65 ? randWeaponItem() : randConsum();
  spawnLoot(it, s.x, s.y, s.z, false);
  if (it.kind === 'weapon') spawnLoot(ammoFor(it.id), s.x + 0.8, s.y, s.z + 0.3, false);
}
for (let i = 0; i < 40; i++) {
  const a = rand(6.28), r = Math.sqrt(R()) * ISLAND_R * 0.85, x = Math.cos(a) * r * OVAL_X, z = Math.sin(a) * r * OVAL_Z, h = terrainH(x, z);
  if (h < 1.5) continue;
  const it = R() < 0.6 ? randWeaponItem() : randConsum();
  spawnLoot(it, x, h, z, false);
  if (it.kind === 'weapon') spawnLoot(ammoFor(it.id), x + 0.8, h, z + 0.3, false);
}

// =====================================================================
// Characters
// =====================================================================
const hitMatInvisible = new THREE.MeshBasicMaterial({ visible: false });
function makeCharMeshFull(cos) {
  const m = makeCharMeshCos(cos);
  const g = m.group;
  const body = new THREE.Mesh(BOX, hitMatInvisible); body.scale.set(0.85, 1.62, 0.7); body.position.y = 0.81; g.add(body);
  const headHB = new THREE.Mesh(BOX, hitMatInvisible); headHB.scale.set(0.58, 0.58, 0.58); headHB.position.y = 1.97; g.add(headHB);
  body.castShadow = headHB.castShadow = false;
  m.body = body; m.headHB = headHB;
  return m;
}
const SKIN_IDS = Object.keys(SKINS), BP_IDS = Object.keys(BACKPACKS), PK_IDS = Object.keys(PICKAXES), GL_IDS = Object.keys(GLIDERS);
function randomLoadout() { return { skin: pick(SKIN_IDS), backpack: pick(BP_IDS), pickaxe: pick(PK_IDS), glider: pick(GL_IDS), emote: 'danse' }; }

const chars = [];
class Char {
  constructor(name, isPlayer, cos) {
    this.cos = cos;
    this.name = name; this.isPlayer = isPlayer;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.hp = 100; this.shield = 0; this.alive = true;
    this.mode = 'bus'; this.grounded = false; this.inWater = false;
    this.mats = { wood: 0, stone: 0, metal: 0 }; this.matSel = 'wood';
    this.slots = [{ kind: 'weapon', id: 'pickaxe', rarity: 0 }, null, null, null, null, null];
    this.cur = 0;
    this.ammo = { light: 0, medium: 0, shells: 0, heavy: 0 };
    this.cool = 0; this.reloading = 0; this.kills = 0; this.animT = rand(10); this.swing = 0;
    this.bloom = 0; this.using = null; this.lastHitBy = null; this.stormTick = 0;
    this.equipT = 0; this.equipDur = 0.3;
    const m = makeCharMeshFull(cos);
    this.mesh = m.group; this.parts = m; scene.add(this.mesh); this.mesh.visible = false;
    m.body.userData.char = this; m.body.userData.part = 'body';
    m.headHB.userData.char = this; m.headHB.userData.part = 'head';
    addTarget(m.body); addTarget(m.headHB);
    this.heldKey = null; this.held = null;
    chars.push(this);
  }
  get item() { return this.slots[this.cur]; }
  refreshHeld() {
    const it = this.item;
    const key = it ? (it.kind === 'weapon' ? it.id + it.rarity : it.id) : 'none';
    if (key === this.heldKey) return;
    this.heldKey = key;
    if (this.held) this.parts.hand.remove(this.held);
    this.held = null;
    if (!it) return;
    if (it.kind === 'weapon') this.held = it.id === 'pickaxe' ? makePickaxe(this.cos.pickaxe) : makeGun(it.id, it.rarity);
    else { this.held = makeConsumMesh(it.id); this.held.scale.setScalar(0.8); }
    this.parts.hand.add(this.held);
  }
}

// =====================================================================
// Physics
// =====================================================================
const tmpCols = [];
// La Grotte : un point situé sous le terrain mais dans l'empreinte de la grotte
// (cratère, tunnel, caverne) repose sur les colliders rocheux, pas sur le terrain.
function underGrotto(x, z, y) { return y < terrainH(x, z) - 0.35 && inGrotto(x, z); }
function rampH(c, x, z) {
  let t;
  const x0 = c.cx * CELL, z0 = c.cz * CELL;
  if (c.d === 0) t = (z0 + CELL - z) / CELL; else if (c.d === 1) t = (x0 + CELL - x) / CELL;
  else if (c.d === 2) t = (z - z0) / CELL; else t = (x - x0) / CELL;
  return c.y + clamp(t, 0, 1) * CELL;
}
function slopeH(c, x, z) {
  const t = clamp(((c.axis === 'x' ? x : z) - c.e0) / (c.e1 - c.e0), 0, 1);
  return c.y0 + t * (c.y1 - c.y0);
}
function coneH(c, x, z) {
  const half = CELL / 2;
  const lx = Math.abs(x - (c.cx * CELL + half)) / half, lz = Math.abs(z - (c.cz * CELL + half)) / half;
  const quadrant = z < c.cz * CELL + half ? (x < c.cx * CELL + half ? 0 : 1) : (x >= c.cx * CELL + half ? 2 : 3);
  if (c.editMask & (1 << quadrant)) return c.y;
  return c.y + Math.max(0, 1 - Math.max(lx, lz)) * 1.6;
}
function physics(ch, dt) {
  const oldY = ch.pos.y;
  ch.blocked = false;
  queryCols(ch.pos.x, ch.pos.z, 2.5, tmpCols);
  // SOUS-PAS ADAPTATIFS : à grande vitesse (grappin, trampoline, véhicules) on
  // ne doit pas traverser un mur fin entre deux frames — le déplacement
  // horizontal est découpé en sous-pas ~12 cm (8 max, soit ~15 cm à vitesse
  // extrême : toujours < l'épaisseur d'un mur de 22 cm), résolus un par un.
  const disp = Math.hypot(ch.vel.x, ch.vel.z) * dt;
  const nSub = Math.max(1, Math.min(8, Math.ceil(disp / 0.12)));
  for (let sub = 0; sub < nSub; sub++) {
    ch.pos.x += ch.vel.x * dt / nSub;
    ch.pos.z += ch.vel.z * dt / nSub;
    for (const c of tmpCols) {
      if (c.type !== 'box' || c.passable) continue;
      if (oldY + CH_H <= c.minY || oldY + STEP >= c.maxY) continue;
      const px = clamp(ch.pos.x, c.minX, c.maxX), pz = clamp(ch.pos.z, c.minZ, c.maxZ);
      const dx = ch.pos.x - px, dz = ch.pos.z - pz, d2 = dx * dx + dz * dz;
      if (d2 >= CH_R * CH_R) continue;
      ch.blocked = true;
      if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (CH_R - d) / d; ch.pos.x += dx * k; ch.pos.z += dz * k; }
      else {
        const pen = [ch.pos.x - c.minX, c.maxX - ch.pos.x, ch.pos.z - c.minZ, c.maxZ - ch.pos.z];
        const i = pen.indexOf(Math.min(...pen));
        if (i === 0) ch.pos.x = c.minX - CH_R; else if (i === 1) ch.pos.x = c.maxX + CH_R; else if (i === 2) ch.pos.z = c.minZ - CH_R; else ch.pos.z = c.maxZ + CH_R;
      }
    }
  }
  const rr = Math.hypot(ch.pos.x, ch.pos.z);
  if (rr > WORLD_R) { ch.pos.x *= WORLD_R / rr; ch.pos.z *= WORLD_R / rr; }
  ch.pos.y += ch.vel.y * dt;
  let ground = terrainH(ch.pos.x, ch.pos.z), onTerrain = true, gcol = null;
  // dans la grotte souterraine, le "sol terrain" est plus haut que le perso :
  // on ignore le terrain (la voûte rocheuse et les dalles servent de plafond/sol)
  if (underGrotto(ch.pos.x, ch.pos.z, ch.pos.y)) { ground = -1e9; onTerrain = false; }
  const tol = 0.22;
  for (const c of tmpCols) {
    if (!c.alive) continue;
    if (ch.pos.x < c.minX - tol || ch.pos.x > c.maxX + tol || ch.pos.z < c.minZ - tol || ch.pos.z > c.maxZ + tol) continue;
    if (c.type === 'box') {
      if (c.maxY <= oldY + STEP && c.maxY > ground) { ground = c.maxY; onTerrain = false; gcol = c; }
      else if (ch.vel.y > 0 && oldY + CH_H <= c.minY + 0.15 && ch.pos.y + CH_H > c.minY) { ch.pos.y = c.minY - CH_H; ch.vel.y = 0; }
    } else if (c.type === 'ramp' || c.type === 'cone') {
      if (ch.pos.x < c.minX || ch.pos.x > c.maxX || ch.pos.z < c.minZ || ch.pos.z > c.maxZ) continue;
      const h = c.type === 'ramp' ? rampH(c, ch.pos.x, ch.pos.z) : coneH(c, ch.pos.x, ch.pos.z);
      if (c.type === 'cone' && (c.editMask & (1 << (ch.pos.z < c.cz * CELL + CELL / 2 ? (ch.pos.x < c.cx * CELL + CELL / 2 ? 0 : 1) : (ch.pos.x >= c.cx * CELL + CELL / 2 ? 2 : 3))))) continue;
      if (h <= oldY + STEP + 0.35 && h > ground) { ground = h; onTerrain = false; gcol = c; }
      else if (c.type === 'cone' && ch.vel.y > 0 && oldY + CH_H <= c.minY + 0.15 && ch.pos.y + CH_H > c.minY) { ch.pos.y = c.minY - CH_H; ch.vel.y = 0; }
    } else if (c.type === 'slope') {
      // toit à deux pentants : plan incliné marchable
      if (ch.pos.x < c.minX || ch.pos.x > c.maxX || ch.pos.z < c.minZ || ch.pos.z > c.maxZ) continue;
      const h = slopeH(c, ch.pos.x, ch.pos.z);
      if (h <= oldY + STEP + 0.35 && h > ground) { ground = h; onTerrain = false; gcol = c; }
    }
  }
  const wasGrounded = ch.grounded;
  ch.landV = 0;
  if (ch.pos.y <= ground) {
    if (!wasGrounded) ch.landV = -ch.vel.y;
    ch.pos.y = ground; if (ch.vel.y < 0) ch.vel.y = 0; ch.grounded = true;
  } else if (wasGrounded && ch.vel.y <= 0 && ch.pos.y - ground < 0.65) {
    ch.pos.y = ground; ch.vel.y = 0; ch.grounded = true;
  } else ch.grounded = false;
  const wasWater = ch.inWater;
  // NAGE : on est dans l'eau dès que les pieds passent sous la surface (-0,4 m),
  // que l'on patauge sur le fond marin (terrain) ou que l'on marche sur une
  // construction immergée (escalier, dalle posés dans l'eau) — sinon le perso
  // restait debout et descendait sous l'eau au lieu de nager. La grotte est
  // couverte par le même test (son plan d'eau est aussi sous -0,4 m).
  ch.inWater = (onTerrain && ground < -0.4) || (!onTerrain && ch.pos.y < -0.4); ch.gcol = gcol;
  if (ch.inWater && !wasWater) ch.splashV = Math.max(0.4, -ch.vel.y); // vitesse d'entrée dans l'eau -> éclaboussure
  // NAGE : on flotte à la surface (pieds à -0,9 m, tête hors de l'eau) ;
  // la touche « s'accroupir » fait plonger (jusqu'à -1,8 m), on remonte en relâchant.
  if (ch.inWater) {
    const surfY = ch.diving ? -1.8 : -0.9;
    if (ch.pos.y < surfY) { ch.pos.y = surfY; if (ch.vel.y < 0) ch.vel.y = 0; }
    if (ch.pos.y <= surfY + 0.03) ch.grounded = true;
  }
}

// =====================================================================
// Ray casting
// =====================================================================
const raycaster = new THREE.Raycaster();
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
function terrainRay(o, d, maxD) {
  let step = 1.0, t = 0, prevT = 0;
  while (t < maxD) {
    const sx = o.x + d.x * t, sz = o.z + d.z * t, y = o.y + d.y * t, h = terrainH(sx, sz);
    if (y < h) {
      // dans la Grotte souterraine, les tirs traversent le "terrain" ci-dessus :
      // c'est la voûte rocheuse (colliders) qui les arrête, pas la heightmap
      if (y < h - 0.35 && inGrotto(sx, sz)) { prevT = t; t += step; step = Math.min(step * 1.08, 4); continue; }
      let a = prevT, b = t;
      for (let k = 0; k < 8; k++) { const m = (a + b) / 2; if (o.y + d.y * m < terrainH(o.x + d.x * m, o.z + d.z * m)) b = m; else a = m; }
      return b;
    }
    prevT = t; t += step; step = Math.min(step * 1.08, 4);
  }
  return null;
}
function castRay(o, d, range, ignore) {
  raycaster.set(o, d); raycaster.far = range; raycaster.near = 0;
  const hits = raycaster.intersectObjects(rayTargets, false);
  let best = null;
  for (const h of hits) {
    const ud = h.object.userData;
    if (ud.char) { if (ud.char === ignore || !ud.char.alive || ud.char.mode === 'bus' || ud.char.mode === 'drive') continue; best = { type: 'char', char: ud.char, head: ud.part === 'head', point: h.point, distance: h.distance }; break; }
    if (ud.vehicleGlass) {
      const pane = ud.vehicleGlass;
      if (pane.broken || pane.vehicle.driver === ignore) continue;
      best = { type: 'vehicleGlass', pane, vehicle: pane.vehicle, point: h.point, distance: h.distance }; break;
    }
    if (ud.vehicle) {
      if (ud.vehicle.driver === ignore) continue;
      best = { type: 'vehicle', vehicle: ud.vehicle, point: h.point, distance: h.distance }; break;
    }
    if (ud.struct) { if (!ud.struct.alive) continue; best = { type: 'struct', col: ud.struct, point: h.point, distance: h.distance }; break; }
    if (ud.treeIM) { const t = ud.list[h.instanceId]; if (!t || !t.alive) continue; best = { type: 'tree', tree: t, point: h.point, distance: h.distance }; break; }
    if (ud.rockIM) { const r = rocks[h.instanceId]; if (!r || !r.alive) continue; best = { type: 'rock', rock: r, point: h.point, distance: h.distance }; break; }
  }
  const tt = terrainRay(o, d, best ? best.distance : range);
  if (tt !== null && (!best || tt < best.distance)) return { type: 'terrain', point: o.clone().addScaledVector(d, tt), distance: tt };
  return best;
}

// =====================================================================
// FX: particles, tracers, damage numbers
// =====================================================================
const PCOUNT = 500;
const pIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), PCOUNT);
pIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); pIM.frustumCulled = false;
const parts = []; for (let i = 0; i < PCOUNT; i++) { parts.push({ life: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), s: 0.1, g: 1 }); pIM.setMatrixAt(i, ZERO_M); }
pIM.setColorAt(0, new THREE.Color()); scene.add(pIM);
let pNext = 0;
const _c = new THREE.Color();
function burst(p, color, n = 8, speed = 4, size = 0.12, grav = 1, life = 0.6) {
  for (let i = 0; i < n; i++) {
    const q = parts[pNext]; pIM.setColorAt(pNext, _c.set(color)); pNext = (pNext + 1) % PCOUNT;
    q.life = q.max = life * (0.6 + MR() * 0.6); q.p.copy(p); q.v.set((MR() - 0.5) * speed, MR() * speed * 0.9, (MR() - 0.5) * speed); q.s = size * (0.6 + MR() * 0.8); q.g = grav;
  }
  pIM.instanceColor.needsUpdate = true;
}
function updateParticles(dt) {
  for (let i = 0; i < PCOUNT; i++) {
    const q = parts[i];
    if (q.life <= 0) continue;
    q.life -= dt;
    if (q.life <= 0) { pIM.setMatrixAt(i, ZERO_M); continue; }
    q.v.y -= 14 * q.g * dt; q.p.addScaledVector(q.v, dt);
    const s = q.s * (q.life / q.max);
    dummy.position.copy(q.p); dummy.rotation.set(q.life * 7, q.life * 5, 0); dummy.scale.set(s, s, s); dummy.updateMatrix();
    pIM.setMatrixAt(i, dummy.matrix);
  }
  pIM.instanceMatrix.needsUpdate = true;
}
const tracers = [];
const tracerMat = new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
for (let i = 0; i < 50; i++) { const m = new THREE.Mesh(BOX, tracerMat.clone()); m.visible = false; scene.add(m); tracers.push({ m, life: 0 }); }
let tNext = 0;
function tracer(a, b, color = 0xfff1a8) {
  const t = tracers[tNext]; tNext = (tNext + 1) % tracers.length;
  const len = a.distanceTo(b); if (len < 0.5) return;
  t.m.position.copy(a).lerp(b, 0.5); t.m.lookAt(b); t.m.scale.set(0.05, 0.05, len);
  t.m.material.color.set(color); t.m.material.opacity = 0.95; t.m.visible = true; t.life = 0.12;
}
const flash = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
flash.visible = false; scene.add(flash);
const flashLight = new THREE.PointLight(0xffc870, 0, 10); scene.add(flashLight);
let flashT = 0;

const dmgLayer = document.getElementById('dmgNums');
const dmgPool = [];
function dmgNumber(p, amount, cls) {
  let el = dmgPool.find((d) => d.life <= 0);
  if (!el) { if (dmgPool.length > 30) return; el = { e: document.createElement('div'), life: 0, p: new THREE.Vector3() }; dmgLayer.appendChild(el.e); dmgPool.push(el); }
  el.e.className = 'dmg ' + (cls || ''); el.e.textContent = Math.round(amount);
  el.p.copy(p).add(_v1.set(MR() * 0.6 - 0.3, 0.3, MR() * 0.6 - 0.3)); el.life = 0.9; el.e.style.display = 'block';
}
function updateDmgNums(dt) {
  for (const d of dmgPool) {
    if (d.life <= 0) continue;
    d.life -= dt; d.p.y += dt * 1.2;
    _v1.copy(d.p).project(camera);
    if (d.life <= 0 || _v1.z > 1) { d.e.style.display = 'none'; continue; }
    d.e.style.left = ((_v1.x + 1) / 2 * window.innerWidth) + 'px';
    d.e.style.top = ((1 - _v1.y) / 2 * window.innerHeight) + 'px';
    d.e.style.opacity = Math.min(1, d.life * 3);
  }
}

// =====================================================================
// Building
// =====================================================================
const builds = new Map();
const buildList = [];
// Grille de construction modulaire Fortnite : 1 case = 1 cellule CELL (4×4 m)
// Tous les éléments (murs, sols, rampes, cônes) font exactement 1 cellule (4 m).
const wallGeo = new THREE.BoxGeometry(CELL, CELL, 0.22);
const floorGeo = new THREE.BoxGeometry(CELL, 0.22, CELL);
const rampGeo = new THREE.BoxGeometry(CELL, 0.22, CELL * Math.SQRT2 + 0.05);
function makeConeGeometry(mask = 0) {
  const parts = [];
  const half = CELL / 2; // 2 m de rayon = 4 m de base (1 case modulaire exacte)
  const vertices = [
    [[-half, 0, -half], [half, 0, -half], [0, 1.6, 0]],
    [[half, 0, -half], [half, 0, half], [0, 1.6, 0]],
    [[half, 0, half], [-half, 0, half], [0, 1.6, 0]],
    [[-half, 0, half], [-half, 0, -half], [0, 1.6, 0]],
  ];
  for (let i = 0; i < 4; i++) {
    if (mask & (1 << i)) continue;
    const geo = new THREE.BufferGeometry();
    const tri = vertices[i];
    const positions = [...tri[0], ...tri[2], ...tri[1]]; // winding vers l'extérieur pour normals et lumière
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    // UV du toit : la texture se projette sur la pente à la même échelle que sur
    // une face de mur (1 case = texture entière) — même couleur, même grain que
    // les murs, au lieu d'un aplat sans UV.
    const slope = Math.hypot(CELL / 2, 1.6) / CELL;
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0.5, slope, 1, 0], 2));
    geo.computeVertexNormals(); parts.push(geo);
  }
  if (!parts.length) return new THREE.BufferGeometry();
  const geo = mergeGeometries(parts); parts.forEach((p) => p.dispose()); return geo;
}
const coneGeo = makeConeGeometry();
function normWall(cx, cz, d) {
  if (d === 2) return [cx, cz + 1, 0];
  if (d === 3) return [cx + 1, cz, 1];
  return [cx, cz, d];
}
function buildKey(type, cx, cz, y, d) { return type === 'wall' ? `w${cx},${cz},${y},${d}` : `${type[0]}${cx},${cz},${y}`; }
function pieceTransform(type, cx, cz, y, d, obj) {
  obj.rotation.set(0, 0, 0); obj.rotation.order = 'YXZ';
  const half = CELL / 2;
  if (type === 'wall') {
    if (d === 0) obj.position.set(cx * CELL + half, y + half, cz * CELL); else { obj.position.set(cx * CELL, y + half, cz * CELL + half); obj.rotation.y = Math.PI / 2; }
  } else if (type === 'floor') {
    obj.position.set(cx * CELL + half, y - 0.02, cz * CELL + half);
  } else if (type === 'ramp') {
    obj.position.set(cx * CELL + half, y + half, cz * CELL + half); obj.rotation.y = d * Math.PI / 2; obj.rotation.x = Math.PI / 4;
  } else {
    obj.position.set(cx * CELL + half, y, cz * CELL + half);
  }
}
function geoFor(type) { return type === 'wall' ? wallGeo : type === 'floor' ? floorGeo : type === 'ramp' ? rampGeo : coneGeo; }
function overlapsChar(type, cx, cz, y, d) {
  return false;
}
const MAX_BUILD_Y = 68; // hauteur maximale de construction (m) : mur le plus haut = base 64 (sommet 68), impossible de bâtir plus haut
function buildTooHigh(type, y) { return y + (type === 'cone' ? 1.6 : CELL) > MAX_BUILD_Y; }
function placeBuild(owner, type, cx, cz, y, d, mat) {
  if (type === 'wall') [cx, cz, d] = normWall(cx, cz, d);
  if (buildTooHigh(type, y)) return false;
  if (!BUILD_MATS[mat]) return false; // matériau inconnu : ne jamais créer de mesh sans matériau
  const key = buildKey(type, cx, cz, y, d);
  if (builds.has(key)) return false;
  if (owner.mats[mat] < BUILD_COST) return false;
  owner.mats[mat] -= BUILD_COST;
  const m = new THREE.Mesh(geoFor(type), BUILD_MATS[mat]);
  pieceTransform(type, cx, cz, y, d, m);
  m.castShadow = true; m.receiveShadow = true; scene.add(m);
  let col;
  const x0 = cx * CELL, z0 = cz * CELL;
  if (type === 'wall') {
    col = d === 0 ? { type: 'box', minX: x0, maxX: x0 + CELL, minZ: z0 - 0.11, maxZ: z0 + 0.11, minY: y, maxY: y + CELL }
      : { type: 'box', minX: x0 - 0.11, maxX: x0 + 0.11, minZ: z0, maxZ: z0 + CELL, minY: y, maxY: y + CELL };
  } else if (type === 'floor') col = { type: 'box', minX: x0, maxX: x0 + CELL, minZ: z0, maxZ: z0 + CELL, minY: y - 0.13, maxY: y + 0.09 };
  else if (type === 'ramp') col = { type: 'ramp', cx, cz, y, d, minX: x0, maxX: x0 + CELL, minZ: z0, maxZ: z0 + CELL, minY: y, maxY: y + CELL };
  else col = { type: 'cone', cx, cz, y, minX: x0, maxX: x0 + CELL, minZ: z0, maxZ: z0 + CELL, minY: y, maxY: y + 1.6, editMask: 0 };
  addCollider(col);
  col.mesh = m; col.maxHp = MAT_HP[mat]; col.hp = col.maxHp * START_HP[mat]; col.building = 1.0; col.mat = mat; col.kind = 'build'; col.key = key; col.owner = owner; col.ptype = type; col.editMask = 0;
  m.userData.struct = col; m.scale.setScalar(0.3);
  addTarget(m); builds.set(key, col); buildList.push(col); structs.push(col);
  sfxAt('build', _v1.copy(m.position), 0.8);
  return true;
}
function updateBuilds(dt) {
  for (let i = buildList.length - 1; i >= 0; i--) {
    const c = buildList[i];
    if (!c.alive) { buildList.splice(i, 1); continue; }
    if (c.building > 0) {
      const T = BUILD_TIME[c.mat];
      c.building = Math.max(0, c.building - dt / T);
      c.hp = Math.min(c.maxHp, c.hp + c.maxHp * (1 - START_HP[c.mat]) * dt / T);
      const s = 1 - c.building; c.mesh.scale.setScalar(Math.min(1, 0.3 + s * 6));
      if (c.building === 0) { c.mesh.scale.setScalar(1); c.hp = Math.max(c.hp, c.maxHp * 0.999); }
      // reinforcement shimmer: material darkens -> full colour
      if (!c.mesh.userData.bm) { c.mesh.userData.bm = true; c.mesh.material = BUILD_MATS_GHOSTLY[c.mat]; }
      if (c.building === 0) c.mesh.material = BUILD_MATS[c.mat];
    }
  }
}
function damageStruct(col, amount, attacker) {
  if (!col.alive || col.indestructible) return;
  col.hp -= amount;
  if (col.mesh) { col.shake = 0.15; }
  if (col.hp <= 0) destroyStruct(col);
}
function destroyStruct(col) {
  if (!col.alive) return;
  if (col.door) { destroyDoor(col.door); return; } // porte cassée : elle tombe et ne bloque plus
  if (editing && editing.col === col) cancelEdit();
  if (col.subs) { for (const sc of col.subs) removeCollider(sc); col.alive = false; } else removeCollider(col);
  if (col.house) rebuildHouse(col.house, col.chunk);
  scene.remove(col.mesh); removeTarget(col.mesh);
  if (col.deco) { if (Array.isArray(col.deco)) col.deco.forEach((d) => scene.remove(d)); else scene.remove(col.deco); }
  if (col.key) builds.delete(col.key);
  const color = col.mat === 'wood' ? 0xc48a4a : col.mat === 'stone' ? 0x9aa3ad : 0x8fa6bf;
  burst(col.mesh.position, color, 18, 7, 0.35, 1, 1.0);
  sfxAt('break', col.mesh.position, 0.8);
}
// Ghost pieces
const ghosts = {};
for (const t of ['wall', 'floor', 'ramp', 'cone']) { const g = new THREE.Mesh(geoFor(t), GHOST_MAT); g.visible = false; g.renderOrder = 5; scene.add(g); ghosts[t] = g; }
let buildPiece = 'wall', buildMode = false;
let ghostTarget = null;
let buildRot = 0;
function computeTarget(ch, type, pitch, rot = 0) {
  const d0 = ((Math.round(ch.yaw / (Math.PI / 2)) % 4) + 4) % 4;
  const d = type === 'ramp' ? (d0 + rot) % 4 : d0;
  const fx = -Math.sin(ch.yaw), fz = -Math.cos(ch.yaw);
  const baseY = Math.floor((ch.pos.y + 0.6) / CELL) * CELL;
  let cx, cz, y = baseY;
  if (type === 'wall') {
    cx = Math.floor(ch.pos.x / CELL); cz = Math.floor(ch.pos.z / CELL);
    if (pitch > 0.55) y = baseY + CELL;
  } else if (type === 'floor') {
    const tx = ch.pos.x + fx * (pitch < -0.6 ? 0 : CELL * 0.75), tz = ch.pos.z + fz * (pitch < -0.6 ? 0 : CELL * 0.75);
    cx = Math.floor(tx / CELL); cz = Math.floor(tz / CELL);
    if (pitch > 0.35) y = baseY + CELL;
  } else if (type === 'ramp') {
    const tx = ch.pos.x + fx * (pitch < -0.6 ? 0 : CELL * 0.75), tz = ch.pos.z + fz * (pitch < -0.6 ? 0 : CELL * 0.75);
    cx = Math.floor(tx / CELL); cz = Math.floor(tz / CELL);
    if (pitch > 0.6) y = baseY + CELL;
  } else {
    const tx = ch.pos.x + (pitch < -0.3 ? fx * (CELL * 0.75) : 0);
    const tz = ch.pos.z + (pitch < -0.3 ? fz * (CELL * 0.75) : 0);
    cx = Math.floor(tx / CELL); cz = Math.floor(tz / CELL);
    y = pitch < -0.3 ? baseY : baseY + CELL;
  }
  return { type, cx, cz, y, d };
}

// =====================================================================
// Edition type Fortnite : murs/sols en 3×3, cônes en 4 pans (socle 2×2).
// =====================================================================
const editGeoCache = new Map();
const TILE = CELL / 3;
function editGeometry(type, mask) {
  const k = type + mask; if (editGeoCache.has(k)) return editGeoCache.get(k);
  if (type === 'cone') { const geo = makeConeGeometry(mask); editGeoCache.set(k, geo); return geo; }
  const parts = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    if (mask & (1 << (j * 3 + i))) continue;
    const lx = -CELL / 2 + TILE * (i + 0.5), ly = -CELL / 2 + TILE * (j + 0.5);
    const g = type === 'wall' ? new THREE.BoxGeometry(TILE + 0.01, TILE + 0.01, 0.22) : new THREE.BoxGeometry(TILE + 0.01, 0.22, TILE + 0.01);
    const uv = g.attributes.uv; for (let n = 0; n < uv.count; n++) uv.setXY(n, (uv.getX(n) + i) / 3, (uv.getY(n) + j) / 3);
    if (type === 'wall') g.translate(lx, ly, 0); else g.translate(lx, 0, ly);
    parts.push(g);
  }
  const geo = parts.length ? mergeGeometries(parts) : new THREE.BufferGeometry();
  parts.forEach((g) => g.dispose());
  editGeoCache.set(k, geo); return geo;
}
const editTileMat = new THREE.MeshBasicMaterial({ color: 0x5ab8ff, transparent: true, opacity: 0.35, depthTest: false, side: THREE.DoubleSide });
const editTileSel = new THREE.MeshBasicMaterial({ color: 0xff9d2b, transparent: true, opacity: 0.55, depthTest: false, side: THREE.DoubleSide });
const editTileHov = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthTest: false, side: THREE.DoubleSide });
const editGrid = new THREE.Group(); const editTiles = [];
{
  const tg = new THREE.PlaneGeometry(TILE * 0.9, TILE * 0.9);
  for (let n = 0; n < 9; n++) { const m = new THREE.Mesh(tg, editTileMat); m.userData.tile = n; m.renderOrder = 30; editGrid.add(m); editTiles.push(m); }
  // 4 zones éditables distinctes pour le cône 2×2, indexées 0..3 après les 9 cases mur/sol.
  const coneTile = new THREE.PlaneGeometry(CELL * 0.42, CELL * 0.42);
  for (let n = 0; n < 4; n++) { const m = new THREE.Mesh(coneTile, editTileMat); m.userData.tile = 9 + n; m.renderOrder = 31; m.visible = false; editGrid.add(m); editTiles.push(m); }
}
let editing = null;
function layoutEditGrid(type) {
  editTiles.forEach((m, n) => {
    const i = n % 3, j = Math.floor(n / 3), lx = -CELL / 2 + TILE * (i + 0.5), ly = -CELL / 2 + TILE * (j + 0.5);
    if (type === 'wall') { m.visible = n < 9; m.position.set(lx, ly, 0); m.rotation.set(0, 0, 0); }
    else if (type === 'cone') {
      m.visible = n >= 9;
      if (m.visible) { const q = n - 9, x = q === 0 || q === 3 ? -CELL / 4 : CELL / 4, z = q < 2 ? -CELL / 4 : CELL / 4; m.position.set(x, 0.84, z); m.rotation.set(-Math.PI / 2, 0, 0); }
    } else { m.visible = n < 9; m.position.set(lx, 0.13, ly); m.rotation.set(-Math.PI / 2, 0, 0); }
  });
}
function startEdit() {
  if (!player || !player.alive || player.mode !== 'ground') return;
  if (editing) { confirmEdit(); return; }
  const d = _v2; camera.getWorldDirection(d);
  const hit = castRay(camera.position, d, camDistNow + 6, player);
  if (!hit || hit.type !== 'struct' || hit.col.kind !== 'build' || !['wall', 'floor', 'cone'].includes(hit.col.ptype)) { showCenter('', 'Vise un mur, un sol ou un cône construit pour l\'éditer', 1.1); return; }
  if (hit.col.owner && hit.col.owner !== player && !(hit.col.owner.team === player.team)) { showCenter('', 'Tu ne peux éditer que tes propres constructions', 1.1); return; }
  if (buildMode) setBuildMode(false);
  editing = { col: hit.col, mask: hit.col.editMask, paint: null, hover: -1 };
  layoutEditGrid(hit.col.ptype); hit.col.mesh.add(editGrid);
  document.getElementById('crosshair').classList.add('build'); sfx('edit', 0.5);
  document.getElementById('editHint').style.display = 'block';
  document.getElementById('editHint').innerHTML = IS_TOUCH ? 'ÉDITION · CHOISIR les cases · RÉINIT. pour repartir · VALIDER ou ANNULER' : `<b>ÉDITION</b> · clic gauche : sélectionner des cases/pans · clic droit : réinitialiser · <kbd>${keyLabel(BIND.edit)}</kbd> valider`;
}
function cancelEdit() {
  if (!editing) return;
  if (editing.col.mesh) editing.col.mesh.remove(editGrid);
  editing = null; document.getElementById('crosshair').classList.remove('build'); document.getElementById('editHint').style.display = 'none';
}
function confirmEdit() {
  if (!editing) return;
  const { col, mask } = editing; cancelEdit();
  if (mask === (col.ptype === 'cone' ? 0x0f : 0x1ff)) { showCenter('', 'Impossible de retirer toutes les cases', 1); return; }
  if (mask !== col.editMask) { applyEdit(col, mask); sfx('editok', 0.6); }
}
function applyEdit(col, mask) {
  if (!col.alive) return;
  col.editMask = mask;
  col.mesh.geometry = mask ? editGeometry(col.ptype, mask) : geoFor(col.ptype);
  if (col.subs) { for (const sc of col.subs) removeCollider(sc); col.subs = null; } else removeCollider(col);
  col.alive = true;
  if (!mask) { addCollider(col); col.alive = true; return; }
  col.subs = [];
  col.mesh.updateMatrixWorld(true);
  if (col.ptype === 'cone') {
    // Collider par pan : un pan retiré du modèle ne bloque plus les joueurs.
    const half = CELL / 4;
    const centers = [[0, -half], [half, 0], [0, half], [-half, 0]];
    for (let i = 0; i < 4; i++) {
      if (mask & (1 << i)) continue;
      const p = _v1.set(centers[i][0], 0, centers[i][1]); col.mesh.localToWorld(p);
      col.subs.push(addCollider({ type: 'cone', cx: col.cx, cz: col.cz, y: col.y, pan: i, minX: p.x - half, maxX: p.x + half, minY: col.y, maxY: col.y + 1.6, minZ: p.z - half, maxZ: p.z + half, parent: col }));
    }
    return;
  }
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    if (mask & (1 << (j * 3 + i))) continue;
    const lx = -CELL / 2 + TILE * (i + 0.5), ly = -CELL / 2 + TILE * (j + 0.5);
    const c = col.ptype === 'wall' ? _v1.set(lx, ly, 0) : _v1.set(lx, 0, ly);
    col.mesh.localToWorld(c);
    let hx, hy, hz;
    if (col.ptype === 'floor') { hx = TILE / 2; hy = 0.11; hz = TILE / 2; }
    else if (col.mesh.rotation.y === 0) { hx = TILE / 2; hy = TILE / 2; hz = 0.11; } else { hx = 0.11; hy = TILE / 2; hz = TILE / 2; }
    col.subs.push(addCollider({ type: 'box', minX: c.x - hx, maxX: c.x + hx, minY: c.y - hy, maxY: c.y + hy, minZ: c.z - hz, maxZ: c.z + hz, parent: col }));
  }
}
function updateEdit() {
  if (!editing) return;
  if (!editing.col.alive || !player.alive) { cancelEdit(); return; }
  // Input can arrive before the next render, especially on a touch screen.
  // Raycast against this frame's newly attached/edit-scaled tiles, not stale matrices.
  editGrid.updateWorldMatrix(true, true);
  const d = _v2; camera.getWorldDirection(d);
  raycaster.set(camera.position, d); raycaster.far = 12; raycaster.near = 0;
  const h = raycaster.intersectObjects(editTiles.filter((tile) => tile.visible), false)[0];
  const rawHov = h ? h.object.userData.tile : -1;
  const hov = editing.col.ptype === 'cone' ? rawHov - 9 : rawHov;
  if (mouse.l && hov >= 0) {
    const bit = 1 << hov;
    if (editing.paint === null) editing.paint = !(editing.mask & bit);
    const before = editing.mask;
    editing.mask = editing.paint ? editing.mask | bit : editing.mask & ~bit;
    if (before !== editing.mask) sfx('edit', 0.35);
  }
  if (!mouse.l) editing.paint = null;
  if (mouse.r) editing.mask = 0;
  editTiles.forEach((m) => { const raw = m.userData.tile, n = editing.col.ptype === 'cone' ? raw - 9 : raw; m.material = n === hov ? editTileHov : (editing.mask & (1 << n)) ? editTileSel : editTileMat; });
}

// =====================================================================
// Audio positional helper
// =====================================================================
function sfxAt(name, p, vol = 1) {
  if (!player) { return; }
  const ref = state === 'playing' && player.alive ? player.pos : camera.position;
  const dx = p.x - ref.x, dz = p.z - ref.z, dy = p.y - ref.y;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const v = vol / (1 + dist / 18);
  const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
  const pan = dist > 0.1 ? (dx * rx + dz * rz) / dist : 0;
  sfx(name, v, pan * 0.8);
}

// =====================================================================
// Game state
// =====================================================================
let state = 'menu'; // menu | playing | over
let paused = false;
let player = null;
let gameT = 0;
let camYaw = 0, camPitch = -0.2;
const bus = { mesh: null, start: new THREE.Vector3(), end: new THREE.Vector3(), t: 0, dur: 32, active: false, ended: false, pos: new THREE.Vector3(), dir: new THREE.Vector3() };
const storm = { cx: 0, cz: 0, r: 700, nx: 0, nz: 0, nr: 700, sx: 0, sz: 0, sr: 700, phase: -1, stage: 'idle', timer: 0, dmg: 1, delay: 60, mesh: null };
// La zone apparaît 1 min après la FIN du bus. Elle ne bouge pour la
// PREMIÈRE fois que 2 min après son activation (wait phase 0), puis 6
// fermetures bien plus lentes (STORM_SLOWER = durée x2,5). Les dégâts
// sont calculés en direct selon le nombre de joueurs encore en jeu
// (stormDamageFor) : 1, 2 à la moitié, 5 au quart, 15 à 5 survivants.
// La zone de départ (r=460) englobe toute l'île (côte ~400).
const STORM_SLOWER = 2.5;
const PHASES = [
  { wait: 120, shrink: Math.round(28 * STORM_SLOWER), r: 280 },
  { wait: 50, shrink: Math.round(25 * STORM_SLOWER), r: 170 },
  { wait: 38, shrink: Math.round(22 * STORM_SLOWER), r: 95 },
  { wait: 30, shrink: Math.round(20 * STORM_SLOWER), r: 48 },
  { wait: 22, shrink: Math.round(18 * STORM_SLOWER), r: 18 },
  { wait: 15, shrink: Math.round(15 * STORM_SLOWER), r: 0 },
];
// Dégâts de la tempête selon les joueurs encore en jeu (PNJ exclus du
// compteur) : 5 joueurs = 15, quart = 5, moitié = 2, sinon 1.
function stormDamageFor(alive) {
  return alive <= 5 ? 15 : alive <= PLAYER_TOTAL / 4 ? 5 : alive <= PLAYER_TOTAL / 2 ? 2 : 1;
}
let elimBy = null, placement = 0;
const leaderboard = [];

// Ballon captif réutilisable : grand, légèrement ovale (pas trop), segments blanc/bleu.
// Le largage l'utilise en taille normale, le bus de combat en version plus grande.
function makeBallon(r) {
  const g = new THREE.Group();
  const white = matC(0xf2f6fa, { roughness: 0.45, metalness: 0.03, emissive: 0xb9c4d4, emissiveIntensity: 0.4 });
  const blue = matC(0x2f7fd8, { roughness: 0.45, metalness: 0.03, emissive: 0x1c4d8a, emissiveIntensity: 0.4 });
  const blueDark = matC(0x1d5fb0, { roughness: 0.45, metalness: 0.03, emissive: 0x113560, emissiveIntensity: 0.4 });
  const gold = matC(0xffc928, { roughness: 0.38, metalness: 0.35 });
  const dark = matC(0x3a4250, { roughness: 0.6, metalness: 0.3 });
  const segs = 10;
  for (let i = 0; i < segs; i++) {
    const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 18, i / segs * Math.PI * 2, Math.PI * 2 / segs), i % 2 ? (i % 4 === 1 ? blueDark : blue) : white);
    g.add(seg);
  }
  // bande dorée à l'équateur + bonnet rouge + jupe sombre à la bouche
  const band = new THREE.Mesh(new THREE.TorusGeometry(r * 0.995, r * 0.035, 8, 48), gold);
  band.rotation.x = Math.PI / 2; g.add(band);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 0.36, 16, 10), matC(0xe23b3b, { roughness: 0.5 }));
  cap.position.y = r * 1.01; cap.scale.set(1, 0.5, 1); g.add(cap);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.6, r * 0.16, 20), dark);
  skirt.position.y = -r * 0.9; g.add(skirt);
  g.scale.y = 1.15; // un peu ovale, mais pas trop
  return g;
}
// câble d'acier entre deux points (utilisé par le bus de combat)
function cableBetween(parent, x1, y1, z1, x2, y2, z2, r, mat) {
  const a = _v1.set(x1, y1, z1), b = _v2.set(x2, y2, z2);
  const len = a.distanceTo(b);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), mat);
  c.position.copy(a).add(b).multiplyScalar(0.5);
  c.lookAt(b); c.rotateX(Math.PI / 2);
  parent.add(c);
  return c;
}

// Bus de combat : autocar stylisé, ballon captif, haubans et équipements de largage.
{
  const g = new THREE.Group();
  const blue = matC(0x1769d2, { roughness: 0.48, metalness: 0.18 });
  const blueDark = matC(0x10458f, { roughness: 0.55, metalness: 0.22 });
  const glass = matC(0x8bdcff, { roughness: 0.16, metalness: 0.28, emissive: 0x17446a, emissiveIntensity: 0.3 });
  const gold = matC(0xffc928, { roughness: 0.38, metalness: 0.35 });
  const rubber = matC(0x20242b, { roughness: 0.92 });
  const steel = matC(0xa8b8c7, { roughness: 0.32, metalness: 0.7 });
  addBox(g, 3.4, 2.8, 9.2, 0, 0, 0, blue);
  addBox(g, 3.32, 0.22, 9.25, 0, -1.1, 0, blueDark);
  addBox(g, 3.46, 0.28, 9.35, 0, -1.42, 0, gold);
  // Fenêtres séparées et montants sur les deux flancs.
  for (const side of [-1, 1]) {
    addBox(g, 0.05, 0.92, 7.0, side * 1.72, 0.45, -0.1, blueDark);
    for (let i = 0; i < 6; i++) {
      const z = -3.35 + i * 1.28;
      addBox(g, 0.055, 0.95, 0.055, side * 1.76, 0.45, z, steel);
      addBox(g, 0.035, 0.78, 1.12, side * 1.755, 0.46, z + 0.56, glass);
    }
    addBox(g, 0.09, 0.16, 8.8, side * 1.74, -0.55, 0, gold);
    addBox(g, 0.12, 0.12, 0.12, side * 1.9, 0.85, -4.25, steel);
    addBox(g, 0.12, 0.48, 0.12, side * 1.83, 0.72, -4.25, blueDark);
  }
  // Pare-brise, calandre, phares et pare-chocs.
  addBox(g, 2.75, 1.25, 0.06, 0, 0.45, -4.64, glass);
  addBox(g, 2.8, 0.16, 0.12, 0, -0.35, -4.68, blueDark);
  addBox(g, 2.9, 0.24, 0.22, 0, -1.05, -4.7, steel);
  for (const x of [-1.2, 1.2]) {
    addBox(g, 0.48, 0.24, 0.12, x, -0.65, -4.68, gold);
    addBox(g, 0.38, 0.18, 0.08, x, -0.66, -4.76, matC(0xfff4c2, { emissive: 0xffd15a, emissiveIntensity: 1.3 }));
  }
  // Roues et moyeux.
  for (const side of [-1, 1]) for (const z of [-3.0, 3.0]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.28, 16), rubber);
    wheel.rotation.z = Math.PI / 2; wheel.position.set(side * 1.73, -1.03, z); g.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 12), steel);
    hub.rotation.z = Math.PI / 2; hub.position.copy(wheel.position); g.add(hub);
  }
  // Toit, porte arrière et marchepied de largage.
  addBox(g, 3.1, 0.18, 8.8, 0, 1.48, 0, blueDark);
  addBox(g, 1.1, 1.9, 0.12, 0, -0.05, 4.68, blueDark);
  addBox(g, 1.45, 0.22, 0.7, 0, -1.58, 4.95, gold);
  for (const x of [-1.2, 1.2]) addBox(g, 0.08, 0.75, 0.08, x, -0.9, 4.35, steel);
  // Feux arrière rouges visibles pendant le vol.
  for (const x of [-1.3, 1.3]) addBox(g, 0.16, 0.3, 0.08, x, 0.15, 4.66, matC(0xff2a2a, { emissive: 0xd01010, emissiveIntensity: 1.6 }));
  // Grand ballon captif légèrement ovale : même modèle que les largages, en plus grand.
  // Placé haut : la nacelle accroche la jupe du ballon, le bus pend bien dessous.
  {
    const ballon = makeBallon(4.4);
    ballon.position.y = 13.6; g.add(ballon);
    // jupe (bouche) du ballon en coordonnées du groupe : 13.6 - 4.4*0.9*1.15 = ~9.05
  }
  // Nacelle brûleur juste sous la bouche du ballon : cadre sombre + flamme émissive.
  {
    const dark = matC(0x2a2f38, { roughness: 0.6, metalness: 0.35 });
    addBox(g, 1.35, 0.5, 1.35, 0, 8.35, 0, dark);
    addBox(g, 1.0, 0.55, 1.0, 0, 8.75, 0, dark);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.8, 10), matC(0xffa030, { emissive: 0xff7a10, emissiveIntensity: 2.2, roughness: 0.4 }));
    flame.position.set(0, 9.3, 0); g.add(flame);
    // Haubans : bords de la nacelle -> jupe du ballon (attaches réelles sur la bouche).
    for (const [x, z] of [[-0.62, -0.62], [0.62, -0.62], [-0.62, 0.62], [0.62, 0.62]]) {
      cableBetween(g, x * 0.55, 8.7, z * 0.55, x * 2.5, 9.1, z * 2.5, 0.03, steel);
    }
    const frame = matC(0x6a4a28, { roughness: 0.7 });
    addBox(g, 3.2, 0.16, 6.4, 0, 1.62, 0, frame);
    for (const [x, z] of [[-1.5, -3.0], [1.5, -3.0], [-1.5, 3.0], [1.5, 3.0]]) addBox(g, 0.14, 0.14, 0.14, x, 1.75, z, steel);
    // Quatre longs câbles d'acier : cadre du toit -> coins de la nacelle (ancrages
    // réellement DANS la nacelle, pas à côté).
    for (const [x, z] of [[-1.5, -3.0], [1.5, -3.0], [-1.5, 3.0], [1.5, 3.0]]) {
      cableBetween(g, x, 1.75, z, Math.sign(x) * 0.55, 8.2, Math.sign(z) * 0.55, 0.045, steel);
    }
  }
  // Emblème doré sur les flancs de la nacelle.
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 0.18 : 0.42; if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  starShape.closePath();
  const starGeo = new THREE.ShapeGeometry(starShape);
  const starMat = matC(0xffdf43, { side: THREE.DoubleSide, emissive: 0x7c5300, emissiveIntensity: 0.3 });
  for (const side of [-1, 1]) { const star = new THREE.Mesh(starGeo, starMat); star.position.set(side * 0.69, 8.95, 0); star.rotation.y = side * Math.PI / 2; g.add(star); }
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  g.visible = false; scene.add(g); bus.mesh = g;
}

// Storm mesh
{
  const g = new THREE.CylinderGeometry(1, 1, 400, 96, 1, true);
  const m = new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false,
    uniforms: { t: { value: 0 }, lin: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform float t; uniform float lin; varying vec2 vUv; varying vec3 vW;
      float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);} 
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);} 
      void main(){ float a = vUv.x*80.0; float y = vW.y*0.06; float v = n(vec2(a + t*0.6, y - t*0.4))*0.6 + n(vec2(a*2.3 - t, y*2.0+t*0.7))*0.4;
        vec3 c = mix(vec3(0.35,0.1,0.75), vec3(0.75,0.45,1.0), v);
        float edge = smoothstep(0.0,0.02,vUv.y)*(1.0-smoothstep(0.9,1.0,vUv.y));
        if (lin > 0.5) c = pow(c, vec3(2.2));
        gl_FragColor = vec4(c, (0.38 + v*0.25)*edge); }`,
  });
  storm.mesh = new THREE.Mesh(g, m); storm.mesh.position.y = 150; storm.mesh.renderOrder = 10; storm.mesh.visible = false; scene.add(storm.mesh);
}

// =====================================================================
// Input
// =====================================================================
const keys = {};
const mouse = { l: false, r: false, x: window.innerWidth / 2, y: window.innerHeight / 2, inside: false };
let locked = false;
let layoutMap = null;
const AZ = { KeyW: 'Z', KeyA: 'Q', KeyQ: 'A', KeyZ: 'W', KeyM: ',' };
function K(code) {
  if (layoutMap && layoutMap.get(code)) return layoutMap.get(code).toUpperCase();
  if (AZ[code] && navigator.language && navigator.language.startsWith('fr')) return AZ[code];
  return code.replace('Key', '').replace('Digit', '');
}
function refreshLabels() { refreshBindLabels(); }
try { if (navigator.keyboard && navigator.keyboard.getLayoutMap) navigator.keyboard.getLayoutMap().then((m) => { layoutMap = m; refreshLabels(); }).catch(() => {}); } catch (e) {}
refreshLabels();

let lockApi = null;
function tryLock() { if (lockApi && (!IS_TOUCH || matchMedia('(pointer: fine)').matches)) lockApi.lock(); }
let resumeT = 0;
import('./lock.js').then((m) => {
  lockApi = m.init(canvas, (l, kind) => {
    const was = locked; locked = l;
    if (kind === 'error') { if (state === 'playing' && !paused) showLockHint(); return; }
    if (l) { hideLockHint(); return; }
    // only a real "locked -> unlocked" transition (player pressed Échap) opens the pause menu,
    // and never during the short moment right after "Reprendre"
    if (was && state === 'playing' && !paused && !bigmapOpen && !settingsOpen && performance.now() - resumeT > 400) togglePause(true);
  });
}).catch(() => {});
function showLockHint() { if (IS_TOUCH) return; const h = document.getElementById('lockHint'); if (h) h.classList.remove('hidden'); }
function hideLockHint() { const h = document.getElementById('lockHint'); if (h) h.classList.add('hidden'); }
canvas.addEventListener('mousedown', (e) => {
  if (IS_TOUCH) return; // sur téléphone, les contrôles tactiles gèrent tout
  if (state !== 'playing' || paused) return;
  if (!locked) tryLock();
  if (e.button === 0) mouse.l = true; if (e.button === 2) mouse.r = true;
  if (e.button === 1) { e.preventDefault(); keys.Mouse3 = true; onAction('Mouse3'); }
  if (e.button === 3 || e.button === 4) { const c = e.button === 3 ? 'Mouse4' : 'Mouse5'; keys[c] = true; onAction(c); }
  if (e.button === 0) onFirePress();
  if (e.button === 2 && buildMode) { const i = MAT_ORDER.indexOf(player.matSel); player.matSel = MAT_ORDER[(i + 1) % 3]; updateHUDStatic(); sfx('click', 0.5); }
});
window.addEventListener('mouseup', (e) => { if (e.button === 0) mouse.l = false; if (e.button === 2) mouse.r = false; if (e.button === 1) keys.Mouse3 = false; if (e.button === 3) keys.Mouse4 = false; if (e.button === 4) keys.Mouse5 = false; });
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('mousemove', (e) => {
  if (IS_TOUCH && !matchMedia('(pointer: fine)').matches) return;
  mouse.x = e.clientX; mouse.y = e.clientY;
  if (state !== 'playing' || paused) return;
  if (bigmapOpen) return;
  const adsOn = mouse.r && !buildMode && !editing && player && weaponOf(player) && !weaponOf(player).melee;
  const sens = adsOn ? (player.item.id === 'sniper' ? 0.0006 : 0.0015) * SET.adsSens : 0.0024;
  camYaw -= e.movementX * sens * SET.sens; camPitch -= e.movementY * sens * SET.sens;
  camPitch = clamp(camPitch, -1.35, 1.25);
});
canvas.addEventListener('mouseenter', () => { mouse.inside = true; });
canvas.addEventListener('mouseleave', () => { mouse.inside = false; });
window.addEventListener('wheel', (e) => {
  if (state !== 'playing' || !player || !player.alive || paused) return;
  if (editing) return;
  if (buildMode) { const order = ['wall', 'floor', 'ramp', 'cone']; buildPiece = order[(order.indexOf(buildPiece) + (e.deltaY > 0 ? 1 : 3)) % 4]; updateBuildBar(); sfx('click', 0.3); return; }
  let i = player.cur;
  for (let k = 0; k < 6; k++) { i = (i + (e.deltaY > 0 ? 1 : 5)) % 6; if (player.slots[i]) break; }
  selectSlot(i);
}, { passive: true });
const down = (act) => !!keys[BIND[act]];
// =====================================================================
// VERSION TÉLÉPHONE : contrôles tactiles (joystick flottant, boutons,
// caméra au doigt + aim assist léger comme sur Fortnite mobile).
// =====================================================================
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
let touchUIRoot = null, touchResetFn = null, touchSyncFn = null, touchBagOpen = false, touchBagClose = null, touchEmoteOpen = false, touchEmoteClose = null;
function syncTouchUI() {
  if (!touchUIRoot) return;
  if (window.StormLandscape?.blocked && touchEmoteOpen) touchEmoteClose?.(); // la consigne paysage passe devant la roue
  const show = state === 'playing' && !paused && !bigmapOpen && !settingsOpen && !touchBagOpen && !touchEmoteOpen && !window.StormLandscape?.blocked;
  // pas de reset ici quand c'est l'ouverture du sac ou de la roue qui masque les contrôles
  if (!show && !touchUIRoot.classList.contains('hidden') && !touchBagOpen && !touchEmoteOpen) touchResetFn?.();
  touchUIRoot.classList.toggle('hidden', !show);
}
// état du joystick analogique (rempli par touchInit, lu par updatePlayer)
const touchJoy = { x: 0, y: 0, mag: 0, on: false };
window.addEventListener('stormorientationchange', () => {
  touchResetFn?.(); mouse.l = mouse.r = false;
  Object.keys(keys).forEach(k => { keys[k] = false; });
  syncTouchUI();
});
function touchInit() {
  if (!IS_TOUCH || window.__touchDone) return;
  window.__touchDone = true;
  document.body.classList.add('touch');
  // ---- DOM des contrôles ----
  const ui = document.createElement('div');
  ui.id = 'touchUI';
  const icons = {
    tFire: '<circle cx="12" cy="12" r="6"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/>',
    tJump: '<path d="m5 10 7-7 7 7M12 3v16M5 21h14"/>',
    tAds: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="3"/>',
    tInteract: '<path d="M13 3h7v18h-7M3 12h12m-4-4 4 4-4 4"/>',
    tReload: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M20 12a8 8 0 0 0-14-5M4 12a8 8 0 0 0 14 5"/>',
    tBuild: '<path d="m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7"/>',
    tEdit: '<path d="m5 15 10-10 4 4L9 19l-5 1 1-5Zm8-8 4 4"/>',
    tCrouch: '<circle cx="12" cy="4" r="2"/><path d="m7 12 5-4 5 4h4M12 8v7l-6 3 3 3m3-6 6 3v3"/>',
    tMap: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
    tPause: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    tSprint: '<circle cx="15" cy="4" r="2"/><path d="m4 11 5-3 5 2 3 4h4M13 9l-3 6-6 5m6-5 6 2 1 5M2 5h6M1 8h4"/>',
    tMarker: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
    tShoulder: '<path d="m7 4-4 4 4 4M3 8h7m7 12 4-4-4-4m4 4h-7"/><circle cx="12" cy="5" r="2"/><path d="M8 21v-7a4 4 0 0 1 8 0v7"/>',
    tEmote: '<circle cx="12" cy="5" r="2"/><path d="m4 9 5 3h6l5-5M12 12v5m0 0-5 5m5-5 6 4"/>',
    tBag: '<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v12H5V9Z"/><path d="M8 14h8v5H8zM3 11v7m18-7v7"/>',
    tRotate: '<path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/>',
    tMaterial: '<path d="m12 3 10 6-10 6L2 9 12 3Zm-10 12 10 6 10-6M2 12l10 6 10-6"/>',
    tEditReset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
    tEditCancel: '<path d="m5 5 14 14M19 5 5 19"/>',
    tSlide: '<circle cx="17" cy="4" r="2"/><path d="m3 19 6-7 5 2 4-7"/><path d="M2 22h20"/>',
    tHeal: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    tSound: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9a4.2 4.2 0 0 1 0 6"/>',
    tFull: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'
  };
  const control = (id, label, extra = '') => `<button type="button" id="${id}" class="tbtn ${extra}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[id]}</svg><span>${label}</span></button>`;
  ui.innerHTML = `
    <div id="joyBase"><div id="joyKnob"></div></div>
    ${control('tFire', 'TIR', 'big')}
    ${control('tJump', 'SAUT')}
    ${control('tAds', 'VISER')}
    ${control('tInteract', 'AGIR')}
    ${control('tReload', 'RECH.')}
    ${control('tBuild', 'CONSTR.')}
    ${control('tEdit', 'MODIF.')}
    ${control('tCrouch', 'ACCROUPI')}
    ${control('tMap', 'CARTE', 'small')}
    ${control('tPause', 'PAUSE', 'small')}
    ${control('tSprint', 'COURIR')}
    ${control('tMarker', 'MARQUER', 'small')}
    ${control('tShoulder', 'ÉPAULE', 'small')}
    ${control('tEmote', 'EMOTE', 'small')}
    ${control('tBag', 'SAC', 'small')}
    ${control('tRotate', 'PIVOT')}
    ${control('tMaterial', 'MATÉRIAU')}
    ${control('tEditReset', 'RÉINIT.')}
    ${control('tEditCancel', 'ANNULER')}
    ${control('tSlide', 'GLISSER')}
    ${control('tHeal', 'SOIN', 'small')}
    ${control('tSound', 'SON', 'small')}
    ${control('tFull', 'ÉCRAN', 'small')}
    <div id="touchBearing" aria-hidden="true"></div>
    <div id="tPieces" role="group" aria-label="Pièces de construction"><button type="button" class="tp" data-p="wall"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h16v18H4zM4 9h16M4 15h16M12 3v6M8 9v6m8-6v6m-4 0v6"/></svg>MUR</button><button type="button" class="tp" data-p="floor"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 13 10-7 10 7-10 7-10-7Zm5-3 10 7M7 17l10-7"/></svg>SOL</button><button type="button" class="tp" data-p="ramp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21 21 3v18H3Zm5-5h13m-8-5h8"/></svg>RAMPE</button><button type="button" class="tp" data-p="cone"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 19 10-15 10 15H2Zm10-15v15M2 19l10-5 10 5"/></svg>TOIT</button></div>`;
  document.body.appendChild(ui);
  touchUIRoot = ui;
  for (const [id, label] of Object.entries({ tReload: 'Recharger', tBuild: 'Construction', tEdit: 'Modifier une construction', tInteract: 'Interagir ou entrer et sortir du véhicule', tSlide: 'Glisser ou s’accroupir', tHeal: 'Utiliser le meilleur objet de soin', tSound: 'Couper ou remettre le son', tFull: 'Basculer le plein écran' })) {
    document.getElementById(id).setAttribute('aria-label', label);
  }
  // l'aide du menu pause parle de raccourcis clavier : version tactile
  const ch = document.querySelector('#pause .ctl-help');
  if (ch) ch.innerHTML = '<span>Gauche : joystick et COURIR</span><span>Droite : caméra, TIR, VISER, SAUT, ACCROUPI, GLISSER</span><span>AGIR : ouvrir, ramasser, entrer / sortir du véhicule</span><span>SOIN : utiliser le meilleur objet de soin du sac</span><span>CONSTR. : quatre pièces, PIVOT et MATÉRIAU</span><span>MODIF. : sélectionner au tir, VALIDER, RÉINIT. ou ANNULER</span><span>En haut : CARTE, MARQUER, EMOTE, SAC et PAUSE · SON et ÉCRAN sous PAUSE</span><span>EMOTE : roue avec toutes les danses</span><span>SAC : équiper ou déposer · objets en bas : sélectionner</span>';
  const $t = (id) => document.getElementById(id);
  let sprintOn = false;
  const label = (id, text, accessible = text) => {
    const b = $t(id);
    if (b.querySelector('span').textContent !== text) b.querySelector('span').textContent = text;
    b.setAttribute('aria-label', accessible);
  };
  // Construction/edit controls are contextual; the camera stays unobstructed.
  touchSyncFn = () => {
    if (!player) return;
    const driving = player.mode === 'drive', grounded = player.mode === 'ground';
    ui.classList.toggle('building', buildMode);
    ui.classList.toggle('editing', !!editing);
    document.body.classList.toggle('touch-building', buildMode);
    document.body.classList.toggle('touch-editing', !!editing);
    document.body.classList.toggle('touch-notice', centerT > 0);
    document.body.classList.toggle('touch-disguised', !!player.disguise);
    $t('tRotate').hidden = !buildMode || buildPiece !== 'ramp';
    $t('tMaterial').hidden = !buildMode;
    $t('tEditReset').hidden = $t('tEditCancel').hidden = !editing;
    $t('tReload').hidden = buildMode || !!editing;
    $t('tHeal').hidden = buildMode || !!editing;
    $t('tAds').hidden = buildMode || !!editing || driving;
    $t('tShoulder').hidden = buildMode || !!editing || driving;
    $t('tFire').disabled = driving || (!grounded && !editing);
    $t('tBuild').disabled = !grounded;
    $t('tEdit').disabled = !grounded;
    $t('tCrouch').disabled = !grounded;
    $t('tSlide').disabled = !grounded;
    $t('tHeal').disabled = !grounded;
    $t('tEmote').disabled = !grounded || buildMode;
    $t('tInteract').disabled = player.mode === 'bus';
    label('tJump', driving ? 'KLAXON' : player.mode === 'bus' ? 'SAUTER' : ['fall', 'glide'].includes(player.mode) ? 'PLANEUR' : 'SAUT');
    label('tFire', editing ? 'CHOISIR' : buildMode ? 'PLACER' : player.item?.kind === 'consum' ? 'UTILISER' : 'TIR');
    label('tEdit', editing ? 'VALIDER' : 'MODIF.', editing ? 'Valider la modification' : 'Modifier une construction');
    label('tInteract', driving ? 'SORTIR' : 'AGIR', driving ? 'Sortir du véhicule' : 'Interagir ou entrer dans un véhicule');
    label('tSound', SET.volume > 0 ? 'SON' : 'MUET', 'Couper ou remettre le son');
    for (const [id, on] of [['tBuild', buildMode], ['tSprint', sprintOn], ['tAds', mouse.r], ['tCrouch', player.crouchToggle], ['tEmote', !!player.emoting], ['tSound', SET.volume <= 0]]) {
      const value = String(!!on);
      if ($t(id).getAttribute('aria-pressed') !== value) $t(id).setAttribute('aria-pressed', value);
    }
    const heading = ((-camYaw * 180 / Math.PI) % 360 + 360) % 360;
    const bearing = `${['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(heading / 45) % 8]}  |  ${Math.round(heading)}°`;
    if ($t('touchBearing').textContent !== bearing) $t('touchBearing').textContent = bearing;
  };
  const bag = document.createElement('section');
  bag.id = 'touchInventory'; bag.hidden = true; bag.setAttribute('role', 'dialog');
  bag.setAttribute('aria-modal', 'true'); bag.setAttribute('aria-labelledby', 'touchBagTitle');
  bag.innerHTML = '<div class="touch-bag-panel"><header><div><h2 id="touchBagTitle">SAC À DOS</h2><p>La partie est en pause.</p></div><button type="button" id="touchBagClose">FERMER</button></header><div id="touchBagSlots" role="group" aria-label="Objets du sac"></div><p id="touchBagStatus" role="status"></p><footer><button type="button" id="touchBagEquip">ÉQUIPER</button><button type="button" id="touchBagDrop">DÉPOSER</button></footer></div>';
  document.body.appendChild(bag);
  const drawBag = () => {
    $t('touchBagSlots').innerHTML = player.slots.map((s, i) => {
      const name = !s ? 'Vide' : s.kind === 'weapon' ? WEAPONS[s.id].name : CONSUM[s.id].name;
      return `<button type="button" data-invslot="${i}" aria-label="${name}" aria-pressed="${i === player.cur}" ${!s ? 'disabled' : ''}>${s ? ICONS[s.id] || '' : ''}<span>${name}</span>${s?.kind === 'consum' ? `<b>×${s.count}</b>` : ''}</button>`;
    }).join('');
    $t('touchBagDrop').disabled = player.cur === 0 || !player.item;
    $t('touchBagEquip').disabled = !player.item;
  };
  touchBagClose = () => {
    touchBagOpen = false; bag.hidden = true; touchResetFn?.(); syncTouchUI();
    $t('tBag').focus({ preventScroll: true });
  };
  $t('tBag').addEventListener('click', () => {
    if (state !== 'playing' || paused || !player.alive) return;
    touchResetFn?.(); touchBagOpen = true; drawBag(); bag.hidden = false;
    $t('touchBagStatus').textContent = 'Choisis un objet. La pioche ne peut pas être déposée.';
    syncTouchUI(); $t('touchBagClose').focus({ preventScroll: true });
  });
  $t('touchBagSlots').addEventListener('click', e => {
    const b = e.target.closest('[data-invslot]'); if (!b) return;
    selectSlot(+b.dataset.invslot); drawBag();
    $t('touchBagSlots').querySelector(`[data-invslot="${player.cur}"]`).focus({ preventScroll: true });
  });
  $t('touchBagClose').onclick = $t('touchBagEquip').onclick = touchBagClose;
  $t('touchBagDrop').onclick = () => {
    if (player.cur === 0 || !player.item) return;
    camera.getWorldDirection(_v1); _v1.y = 0; _v1.normalize();
    spawnLoot(player.item, player.pos.x + _v1.x * 2, player.pos.y + .4, player.pos.z + _v1.z * 2);
    player.slots[player.cur] = null; player.using = null; player.reloading = 0;
    player.cur = 0; updateHotbar(); drawBag();
    $t('touchBagStatus').textContent = 'Objet déposé devant toi.';
    $t('touchBagEquip').focus({ preventScroll: true });
  };
  bag.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const stops = [...bag.querySelectorAll('button:not(:disabled)')], first = stops[0], last = stops.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // ---- roue d'émotes : toutes les danses du jeu, même celles jamais demandées ----
  const em = document.createElement('section');
  em.id = 'touchEmotes'; em.hidden = true; em.setAttribute('role', 'dialog'); em.setAttribute('aria-modal', 'true'); em.setAttribute('aria-label', 'Choisir une émote');
  em.innerHTML = `<div class="temote-panel"><header><b>EMOTES</b><button type="button" id="touchEmoteClose">FERMER</button></header><div id="touchEmoteGrid" role="group" aria-label="Émotes">${Object.entries(EMOTES).map(([id, e]) => `<button type="button" class="temote" data-e="${id}">${e.name}</button>`).join('')}</div></div>`;
  document.body.appendChild(em);
  touchEmoteClose = () => { touchEmoteOpen = false; em.hidden = true; syncTouchUI(); };
  $t('tEmote').addEventListener('click', () => {
    if (state !== 'playing' || paused || !player || player.mode !== 'ground' || buildMode) return;
    touchResetFn?.(); // stoppe le joystick et les touches maintenues
    touchEmoteOpen = true; em.hidden = false; syncTouchUI();
    const eq = LOAD.emote || 'danse';
    for (const b of em.querySelectorAll('.temote')) b.toggleAttribute('aria-pressed', b.dataset.e === eq);
    $t('touchEmoteClose').focus({ preventScroll: true });
  });
  $t('touchEmoteClose').addEventListener('click', touchEmoteClose);
  for (const b of em.querySelectorAll('.temote')) {
    b.addEventListener('click', () => {
      if (state === 'playing' && !paused && player && player.alive && player.mode === 'ground') {
        // toucher la danse en cours l'arrête, sinon elle démarre
        player.emoting = player.emoting?.id === b.dataset.e ? null : { id: b.dataset.e, t: 0 };
        touchSyncFn?.();
      }
      touchEmoteClose();
    });
  }
  const joyBase = $t('joyBase'), joyKnob = $t('joyKnob');
  // ---- joystick flottant (moitié gauche de l'écran) ----
  let joyId = null, joyCX = 0, joyCY = 0, joyX = 0, joyY = 0;
  let JOY_R = 38;
  function joyApply() {
    // joystick analogique : amplitude du pouce = vitesse (zone morte 15 %)
    const mag = Math.hypot(joyX, joyY);
    const dead = 0.15;
    touchJoy.on = mag > dead;
    touchJoy.x = joyX / (mag || 1); touchJoy.y = joyY / (mag || 1);
    touchJoy.mag = Math.min(1, (mag - dead) / (0.9 - dead));
    // les touches virtuelles restent (dive du bus, émotes, autres systèmes)
    const k = (on, act) => { keys[BIND[act]] = on; };
    const fwd = joyY < -0.3, back = joyY > 0.3, left = joyX < -0.3, right = joyX > 0.3;
    k(fwd, 'forward'); k(back, 'back'); k(left, 'left'); k(right, 'right');
    // joystick à fond = sprint
    const spr = mag > 0.9 || (sprintOn && mag > dead);
    keys[BIND.sprint] = spr; keys.ShiftRight = spr;
  }
  function joyEnd() {
    joyId = null; joyX = joyY = 0;
    touchJoy.on = false; touchJoy.mag = 0;
    for (const a of ['forward', 'back', 'left', 'right', 'sprint']) keys[BIND[a]] = false;
    keys.ShiftRight = false;
    joyBase.classList.remove('on');
    joyBase.style.left = joyBase.style.top = '';
    joyKnob.style.transform = '';
  }
  // ---- caméra : glissement du doigt sur la zone de visée ----
  let lookId = null, lookX = 0, lookY = 0;
  function lookApply(dx, dy) {
    if (state !== 'playing' || paused || bigmapOpen) return;
    const adsOn = mouse.r && !buildMode && !editing && player && weaponOf(player) && !weaponOf(player).melee;
    const sens = (adsOn ? 0.0018 : 0.0048) * SET.sens;
    camYaw -= dx * sens; camPitch -= dy * sens;
    camPitch = clamp(camPitch, -1.35, 1.25);
  }
  // ---- boutons ----
  function press(code) {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
    touchSyncFn?.();
  }
  const hold = (el, on, off) => {
    el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); if (el.disabled) return; el.classList.add('pressed'); on(); }, { passive: false });
    const release = () => { el.classList.remove('pressed'); off && off(); };
    el.addEventListener('touchend', (e) => { e.preventDefault(); if (!e.targetTouches.length) release(); }, { passive: false });
    el.addEventListener('touchcancel', release, { passive: true });
    el.addEventListener('keydown', e => {
      if (!['Space', 'Enter'].includes(e.code)) return;
      e.preventDefault(); e.stopPropagation();
      if (e.repeat || el.disabled) return;
      el.classList.add('pressed'); on();
    });
    el.addEventListener('keyup', e => {
      if (!['Space', 'Enter'].includes(e.code)) return;
      e.preventDefault(); e.stopPropagation(); release();
    });
    el.addEventListener('blur', release);
  };
  hold($t('tFire'), () => { mouse.l = true; onFirePress(); }, () => { mouse.l = false; });
  hold($t('tJump'), () => { press(BIND.jump); keys[BIND.jump] = true; }, () => { keys[BIND.jump] = false; });
  hold($t('tAds'), () => { mouse.r = true; }, () => { mouse.r = false; });
  // The right thumb can keep aiming while holding fire/ADS, not just tap a
  // stationary button. The left thumb remains free to move at the same time.
  const aimWhileHeld = (el) => {
    let id = null, x = 0, y = 0;
    el.addEventListener('touchstart', e => { const t = e.changedTouches[0]; id = t.identifier; x = t.clientX; y = t.clientY; }, { passive: true });
    el.addEventListener('touchmove', e => {
      const t = [...e.changedTouches].find(t => t.identifier === id);
      if (!t || !el.classList.contains('pressed')) return;
      e.preventDefault(); lookApply(t.clientX - x, t.clientY - y); x = t.clientX; y = t.clientY;
    }, { passive: false });
    const end = () => { id = null; };
    el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
  };
  aimWhileHeld($t('tFire')); aimWhileHeld($t('tAds'));
  hold($t('tCrouch'), () => { press(BIND.crouch); keys[BIND.crouch] = true; }, () => { keys[BIND.crouch] = false; });
  // GLISSER : glissade dès qu'on avance (élan forcé), sinon simple accroupissement
  hold($t('tSlide'), () => {
    if (state !== 'playing' || paused || !player || player.mode !== 'ground') return;
    if (player.grounded && Math.hypot(player.vel.x, player.vel.z) > 3) player.sprint = true; // le temps de déclencher la glissade
    crouchOrSlide(player);
  }, null);
  $t('tInteract').addEventListener('touchstart', (e) => { e.preventDefault(); press(BIND.interact); }, { passive: false });
  $t('tReload').addEventListener('touchstart', (e) => { e.preventDefault(); press(BIND.reload); }, { passive: false });
  $t('tBuild').addEventListener('touchstart', (e) => { e.preventDefault(); press(BIND.buildToggle); }, { passive: false });
  hold($t('tEdit'), () => press(BIND.edit), null);
  $t('tSprint').addEventListener('click', () => { sprintOn = !sprintOn; joyApply(); touchSyncFn(); });
  $t('tMarker').addEventListener('click', () => press(BIND.marker));
  $t('tShoulder').addEventListener('click', () => press(BIND.shoulder));
  // SOIN : sélectionne et utilise le meilleur objet de soin du sac (vie d'abord, gros soin en priorité)
  $t('tHeal').addEventListener('click', () => {
    if (state !== 'playing' || paused || !player || !player.alive || player.mode !== 'ground' || buildMode || editing) return;
    const need = (it) => { const C = CONSUM[it.id]; return C.hp ? player.hp < C.maxHp : player.shield < C.maxSh; };
    const rank = (it) => { const C = CONSUM[it.id]; return C.hp ? 100 + C.hp : C.sh; };
    let best = -1;
    player.slots.forEach((s, i) => { if (s && s.kind === 'consum' && need(s) && (best < 0 || rank(s) > rank(player.slots[best]))) best = i; });
    if (best < 0) {
      const full = player.hp >= 100 && player.shield >= 100;
      showCenter('', full ? 'Santé et bouclier au maximum' : 'Aucun objet de soin dans le sac', 1.2);
      return;
    }
    selectSlot(best);
    const it = player.slots[best];
    if (!player.using) player.using = { item: it, t: 0, dur: CONSUM[it.id].dur };
    sfx('click', 0.4);
  });
  // SON : coupe et restaure le volume (réglage mémorisé)
  let volKeep = 0;
  $t('tSound').addEventListener('click', () => {
    if (SET.volume > 0) { volKeep = SET.volume; SET.volume = 0; } else SET.volume = volKeep || 0.8;
    saveSettings(SET); setVolumes(SET.volume, SET.music); touchSyncFn();
  });
  // ÉCRAN : plein écran
  $t('tFull').addEventListener('click', () => {
    const req = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    if (req && req.catch) req.catch(() => {});
  });
  $t('tRotate').addEventListener('click', () => press(BIND.reload));
  $t('tMaterial').addEventListener('click', () => press(BIND.matCycle));
  $t('tEditReset').addEventListener('click', () => { if (editing) { editing.mask = 0; editing.paint = null; sfx('click', .4); } });
  $t('tEditCancel').addEventListener('click', () => { cancelEdit(); touchSyncFn(); });
  // boutons de pièces de construction : gros boutons dédiés au pouce, visibles en mode CONS
  for (const b of ui.querySelectorAll('#tPieces .tp')) {
    const choose = () => {
      if (state !== 'playing' || paused) return;
      cancelEdit(); buildPiece = b.dataset.p; setBuildMode(true); touchSyncFn();
    };
    b.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      choose();
    }, { passive: false });
    b.addEventListener('click', choose);
  }
  $t('tMap').addEventListener('touchstart', (e) => { e.preventDefault(); press(BIND.map); }, { passive: false });
  $t('tPause').addEventListener('touchstart', (e) => { e.preventDefault(); press('Escape'); }, { passive: false });
  // The touch handler suppresses compatibility clicks; native button activation
  // still needs its own click path for a keyboard or assistive technology.
  for (const [id, action] of [['tInteract','interact'],['tReload','reload'],['tBuild','buildToggle'],['tMap','map']]) {
    $t(id).addEventListener('click', () => press(BIND[action]));
  }
  $t('tPause').addEventListener('click', () => press('Escape'));
  // ---- événements tactiles globaux (document) : le calque #touchUI est
  // pointer-events:none, on écoute partout SAUF sur les boutons et le HUD tapable ----
  const skipTarget = (t) => t.closest && t.closest('.tbtn, #tPieces, #hotbar, #buildbar, #mats, #minimap, button, .panel, #bigmap, #pause, #gameSettings, #victory, #endscreen, #spectate, input, select');
  // reset complet des commandes tactiles (pause, carte, onglet caché)
  touchResetFn = () => {
    joyEnd(); lookId = null;
    sprintOn = false;
    mouse.l = mouse.r = false; keys[BIND.jump] = false; keys[BIND.sprint] = false;
    keys[BIND.crouch] = false;
    ui.querySelectorAll('.pressed').forEach(el => el.classList.remove('pressed'));
    keys.KeyW = keys.KeyS = keys.KeyA = keys.KeyD = false; keys.ShiftRight = false;
    touchSyncFn?.();
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) touchResetFn?.(); });
  window.addEventListener('resize', () => touchResetFn?.());
  // fermer la grande carte d'un simple geste sur téléphone
  const bigmapEl = document.getElementById('bigmap');
  if (bigmapEl?.querySelector('.bm-hint')) bigmapEl.querySelector('.bm-hint').textContent = 'Touche la carte ou le fond pour revenir au jeu.';
  if (bigmapEl) bigmapEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (bigmapOpen) { bigmapOpen = false; bigmapEl.classList.add('hidden'); syncTouchUI(); tryLock(); }
  }, { passive: false });
  document.addEventListener('touchstart', (e) => {
    if (state !== 'playing' || paused || bigmapOpen || settingsOpen || touchBagOpen || window.StormLandscape?.blocked) return;
    for (const t of e.changedTouches) {
      if (skipTarget(t.target)) continue;
      // Lower left is movement. Clamp the floating pad to the safe thumb zone.
      if (t.clientX < window.innerWidth * 0.44 && t.clientY > window.innerHeight * 0.42 && joyId === null) {
        const size = joyBase.offsetWidth, half = size / 2;
        const base = joyBase.getBoundingClientRect();
        const minX = base.left + half, maxX = Math.max(minX, $t('tBuild').getBoundingClientRect().left - half - 12);
        const minY = Math.max(half + 12, $t('counts').getBoundingClientRect().bottom + half + 8);
        const maxY = Math.max(minY, Math.min(innerHeight - 74, $t('bars').getBoundingClientRect().top - 12) - half);
        JOY_R = size * .32;
        joyId = t.identifier;
        joyCX = clamp(t.clientX, minX, maxX);
        joyCY = clamp(t.clientY, minY, maxY);
        joyBase.style.left = (joyCX - half) + 'px'; joyBase.style.top = (joyCY - half) + 'px';
        joyBase.classList.add('on');
      } else if (lookId === null) {
        lookId = t.identifier; lookX = t.clientX; lookY = t.clientY;
      }
    }
    if (!skipTarget(e.target)) e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) {
        let dx = t.clientX - joyCX, dy = t.clientY - joyCY;
        const d = Math.hypot(dx, dy);
        if (d > JOY_R) { dx *= JOY_R / d; dy *= JOY_R / d; }
        joyX = dx / JOY_R; joyY = dy / JOY_R;
        joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
        joyApply();
      } else if (t.identifier === lookId) {
        lookApply(t.clientX - lookX, t.clientY - lookY);
        lookX = t.clientX; lookY = t.clientY;
      }
    }
    if (e.touches.length && !skipTarget(e.target)) e.preventDefault();
  }, { passive: false });
  const endT = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) { joyEnd(); joyKnob.style.transform = ''; }
      if (t.identifier === lookId) lookId = null;
    }
  };
  document.addEventListener('touchend', endT);
  document.addEventListener('touchcancel', endT);
  // ---- hotbar / buildbar / mats tapables (utile aussi à la souris) ----
  document.getElementById('hotbar').addEventListener('click', (e) => {
    const s = e.target.closest('.slot'); if (!s || state !== 'playing' || paused) return;
    const i = [...document.getElementById('hotbar').children].indexOf(s);
    if (i >= 0) { cancelEdit(); selectSlot(i); }
  });
  document.getElementById('buildbar').addEventListener('pointerdown', (e) => {
    const p = e.target.closest('.bpiece'); if (!p || state !== 'playing' || paused) return;
    cancelEdit(); buildPiece = p.dataset.p; setBuildMode(true);
  });
  document.getElementById('mats').addEventListener('pointerdown', (e) => {
    const m = e.target.closest('.mat'); if (!m || state !== 'playing' || paused) return;
    player.matSel = m.dataset.mat; updateHUDStatic(); sfx('click', 0.5);
  });
  // l'audio démarre au premier toucher (comme au premier clic clavier)
  document.addEventListener('touchstart', () => initAudio(), { once: true, passive: true, capture: true });
}
touchInit();
// Aim assist tactile : quand on tire sur téléphone, la caméra est doucement
// guidée vers l'ennemi le plus proche du réticule (comme Fortnite mobile).
function touchAimAssist(dt) {
  if (!IS_TOUCH || !mouse.l || buildMode || editing || !player || !player.alive || player.using) return;
  const W = weaponOf(player);
  if (!W || W.melee) return;
  const d = _aimD; camera.getWorldDirection(d);
  let best = null, bestCos = Math.cos(0.17); // ~10° autour du réticule
  for (const c of chars) {
    if (c.isPlayer || !c.alive || c.mode === 'bus' || c.mode === 'drive') continue;
    if (c.team !== undefined && player.team !== undefined && c.team === player.team) continue;
    const dx = c.pos.x - camera.position.x, dy = c.pos.y + 1.15 - camera.position.y, dz = c.pos.z - camera.position.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 2 || dist > 280) continue;
    const cos = (dx * d.x + dy * d.y + dz * d.z) / dist;
    if (cos > bestCos) { bestCos = cos; best = { dx, dy, dz }; }
  }
  if (!best) return;
  const yawT = Math.atan2(-best.dx, -best.dz);
  const pitchT = Math.atan2(best.dy, Math.hypot(best.dx, best.dz));
  const k = Math.min(1, dt * 4.5);
  camYaw = lerpAngle(camYaw, yawT, k);
  camPitch = clamp(lerp(camPitch, pitchT, k), -1.35, 1.25);
}
// sprint + accroupi = glissade (partagé par la touche clavier et le bouton tactile GLISSER)
function crouchOrSlide(ch) {
  if (ch.sprint && ch.grounded && !(ch.slideT > 0) && ch.mode === 'ground') {
    const sp = Math.hypot(ch.vel.x, ch.vel.z) || 1;
    ch.slideT = 0.95; ch.slideDir = new THREE.Vector3(ch.vel.x / sp, 0, ch.vel.z / sp); ch.crouchToggle = false; sfx('land', 0.35);
  } else ch.crouchToggle = !ch.crouchToggle;
}
function onAction(code) {
  if (window.StormLandscape?.blocked) return;
  if (touchBagOpen || touchEmoteOpen) { if (code === 'Escape') { touchBagClose?.(); touchEmoteClose?.(); } return; }
  const is = (a) => BIND[a] === code;
  if (state !== 'playing') return;
  if (code === 'Escape' || code === 'KeyP') { if (editing) { cancelEdit(); return; } if (settingsOpen) return; if (paused) { resumeGame(); return; } if (code === 'KeyP' || !locked) togglePause(true); return; }
  if (paused) return;
  if (is('map')) { bigmapOpen = !bigmapOpen; document.getElementById('bigmap').classList.toggle('hidden', !bigmapOpen); syncTouchUI(); if (bigmapOpen && lockApi) lockApi.unlock(); else tryLock(); }
  if (!player.alive) return;
  if (player.mode === 'drive') { if (is('interact')) exitVehicle(player); if (is('jump') && player.vehicle) sfx('horn', 0.6); return; }
  if (is('jump')) {
    if (player.mode === 'bus') jumpFromBus(player);
    else if (player.mode === 'fall') deployGlider(player);
    else if (player.mode === 'glide') closeGlider(player);
    else if (player.mode === 'ground' && !player.grounded && !player.inWater && player.pos.y - groundBelow(player) > 2.5) deployGlider(player); // planeur à volonté, dès qu'on est en l'air
    else if (player.mode === 'ground') player.jumpBuf = 0.14; // saut mémorisé : déclenché dès qu'on touche le sol
  }
  if (is('buildToggle')) { if (editing) cancelEdit(); setBuildMode(!buildMode); }
  if (is('wall')) { cancelEdit(); buildPiece = 'wall'; setBuildMode(true); }
  if (is('floor')) { cancelEdit(); buildPiece = 'floor'; setBuildMode(true); }
  if (is('ramp')) { cancelEdit(); if (buildMode && buildPiece === 'ramp') buildRot = (buildRot + 1) % 4; buildPiece = 'ramp'; setBuildMode(true); }
  if (is('cone')) { cancelEdit(); buildPiece = 'cone'; setBuildMode(true); }
  if (is('edit')) startEdit();
  if (is('shoulder')) { shoulderSide = -shoulderSide; sfx('click', 0.4); }
  if (is('matCycle')) { const i = MAT_ORDER.indexOf(player.matSel); player.matSel = MAT_ORDER[(i + 1) % 3]; updateHUDStatic(); sfx('click', 0.6); }
  if (is('reload')) { if (buildMode && buildPiece === 'ramp') { buildRot = (buildRot + 1) % 4; sfx('click', 0.4); } else if (!buildMode) startReload(player); }
  if (is('interact')) interact();
  if (is('marker')) placeMarkerAhead();
  if (is('emote') && player.mode === 'ground' && !buildMode) { player.emoting = player.emoting ? null : { id: LOAD.emote || 'danse', t: 0 }; }
  if (is('crouch')) crouchOrSlide(player);
  const dm = code.match(/^Digit([1-6])$/);
  if (dm) { cancelEdit(); selectSlot(+dm[1] - 1); }
}
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.target?.closest?.('button') && ['Space', 'Enter'].includes(e.code)) return;
  keys[e.code] = true;
  if (e.code === 'Tab' || e.code === 'Space' || e.code === 'AltLeft') e.preventDefault();
  if (settingsOpen) return;
  onAction(e.code);
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
let bigmapOpen = false, settingsOpen = false, shoulderSide = 1;

function setBuildMode(on) {
  if (!player || player.mode !== 'ground') { buildMode = false; return; }
  if (buildMode && !on) { player.cool = Math.max(player.cool, 0.12); player.equipT = player.equipDur = 0.15; }
  buildMode = on;
  if (on) { player.using = null; player.reloading = 0; player.emoting = null; }
  document.getElementById('crosshair').classList.toggle('build', on);
  const tp = document.getElementById('tPieces'); if (tp) tp.classList.toggle('on', on); // boutons pièces tactiles
  updateBuildBar(); updateHotbar();
}
function selectSlot(i) {
  if (!player.slots[i]) return;
  if (buildMode) setBuildMode(false);
  if (player.cur !== i) {
    player.cur = i; player.reloading = 0; player.using = null;
    const it = player.slots[i], W = it.kind === 'weapon' ? WEAPONS[it.id] : null;
    const eq = W && W.equip ? W.equip : 0.25;
    player.cool = Math.max(player.cool, eq); player.equipT = eq; player.equipDur = eq; sfx('equip', 0.5);
  }
  updateHotbar();
}
function togglePause(force) {
  if (state !== 'playing') return;
  paused = force === true ? true : !paused;
  document.getElementById('pause').classList.toggle('hidden', !paused);
  if (paused) { mouse.l = mouse.r = false; touchResetFn?.(); }
  syncTouchUI();
}
function resumeGame() { paused = false; resumeT = performance.now(); document.getElementById('pause').classList.add('hidden'); mouse.l = mouse.r = false; syncTouchUI(); tryLock(); }
document.getElementById('resumeBtn').onclick = (e) => { e.stopPropagation(); resumeGame(); };
document.getElementById('quitBtn').onclick = () => { placement = aliveTeams().size; finalizeXP(); sendResult('lobby'); };
document.getElementById('pauseSettings').onclick = () => openGameSettings();
function openGameSettings() {
  settingsOpen = true;
  syncTouchUI();
  const box = $('gameSettings'); box.classList.remove('hidden');
  settingsForm($('gsForm'), SET, (st, k) => {
    setVolumes(st.volume, st.music);
    if (k === 'viewDist' && scene.fog && camUnderwater) { scene.fog.near = UW_FOG_NEAR; scene.fog.far = UW_FOG_FAR; } // l'eau n'est pas affectée par la distance de vue ; le brouillard de plongée garde sa densité
    if (k === 'binds') refreshBindLabels();
    if (k === 'outline') outline.enabled = !!st.outline;
    if (k === 'outlineW') outline.width = st.outlineW;
    if (k === 'viewDist') { outline.uniforms.fadeNear.value = 70 * st.viewDist; outline.uniforms.fadeFar.value = 260 * st.viewDist; }
    if (k === 'quality') $('gsNote').textContent = 'La qualité graphique s\'applique à la prochaine partie.';
  });
}
document.getElementById('gsClose').onclick = () => { settingsOpen = false; $('gameSettings').classList.add('hidden'); syncTouchUI(); };
function refreshBindLabels() { document.querySelectorAll('kbd[data-a]').forEach((k) => { k.textContent = keyLabel(BIND[k.dataset.a]); }); }
document.getElementById('againBtn').onclick = () => sendResult('replay');
document.getElementById('lobbyBtn').onclick = () => sendResult('lobby');
document.getElementById('victoryQuit').onclick = () => endGame(true);
function sendResult(action) {
  finalizeXP();
  const res = { type: 'stormdrop-result', action, won: wonMatch, placement: wonMatch ? 1 : (placement || chars.filter((c) => c.alive && !c.hench).length), kills: player ? player.kills : 0, time: Math.round(gameT), xp: Math.round(matchXP), xpLog, stats };
  if (IN_FRAME) window.parent.postMessage(res, '*');
  else if (action === 'replay') location.reload(); else location.href = 'index.html';
}
function finalizeXP() {
  if (xpFinal || !player) return; xpFinal = true;
  addXP('Temps de survie', gameT * 3, true);
  addXP('Constructions', Math.min(300, stats.builds * 2), true);
  addXP('Dégâts infligés', Math.min(800, stats.damage * 0.5), true);
  const pl = wonMatch ? 1 : placement;
  if (wonMatch) addXP('Victoire', 2500, true);
}

// =====================================================================
// Combat
// =====================================================================
function magOf(it) { const W = WEAPONS[it.id]; return W.mag > 5 ? Math.round(W.mag * RAR[it.rarity].mag) : W.mag; }
function weaponOf(ch) { const it = ch.item; return it && it.kind === 'weapon' ? WEAPONS[it.id] : null; }
function startReload(ch) {
  const it = ch.item; if (!it || it.kind !== 'weapon' || it.id === 'pickaxe') return;
  const W = WEAPONS[it.id];
  if (it.mag >= magOf(it) || ch.reloading > 0) return;
  if (ch.isPlayer && ch.ammo[W.ammo] <= 0) return;
  ch.reloading = W.reload * RAR[it.rarity].reload;
  if (ch.isPlayer) sfx('reload', 0.5);
}
function finishReload(ch) {
  const it = ch.item; if (!it || it.kind !== 'weapon') return;
  const W = WEAPONS[it.id];
  const need = magOf(it) - it.mag;
  if (ch.isPlayer) { const got = Math.min(need, ch.ammo[W.ammo]); it.mag += got; ch.ammo[W.ammo] -= got; }
  else it.mag = magOf(it);
}
function falloff(W, dist) {
  if (!W.fall) return 1;
  const [a, b, c] = W.fall;
  if (dist <= a) return 1; if (dist >= b) return c;
  return lerp(1, c, (dist - a) / (b - a));
}
// Explosion de zone (Arc Ka-Boom) : dégâts + repoussement + casse les structures
function explodeAt(p, dmg, radius, attacker, wname) {
  burst(p, 0xff8a3d, 26, 8, 0.32, 0.6, 0.8);
  burst(p, 0xffd23f, 14, 5, 0.22, 0.5, 0.5);
  sfxAt('break', p, 1);
  if (player && player.alive) { const d = player.pos.distanceTo(p); if (d < radius * 2.5) shake = Math.max(shake, 0.5); }
  let dmgDone = 0;
  for (const c of chars) {
    if (!c.alive || c === attacker || c.mode === 'bus') continue;
    const d = c.pos.distanceTo(p);
    if (d < radius) {
      const k = 1 - (d / radius) * 0.6;
      damageChar(c, dmg * k, attacker, false, wname);
      dmgDone += dmg * k;
      const push = _bw.copy(c.pos).sub(p); push.y = 0; push.normalize();
      c.vel.addScaledVector(push, 6 * k); c.vel.y = Math.max(c.vel.y, 5 * k); c.grounded = false;
    }
  }
  if (attacker && attacker.isPlayer && dmgDone > 0) { stats.damage += dmgDone; showHitmarker(false, false, false); }
  queryCols(p.x, p.z, radius, tmpCols);
  for (const c of tmpCols) {
    if (!c.alive || c.indestructible || c.type !== 'box' || !c.mesh) continue;
    if (Math.abs((c.minY + c.maxY) / 2 - p.y) > radius) continue;
    if (p.x < c.minX - radius || p.x > c.maxX + radius || p.z < c.minZ - radius || p.z > c.maxZ + radius) continue;
    damageStruct(c, dmg * 0.9, attacker);
  }
  for (const v of vehicles) {
    const d = v.pos.distanceTo(p);
    if (!v.destroyed && d < radius + 1) {
      for (const pane of v.windows) if (!pane.broken) { pane.broken = true; pane.mesh.visible = false; removeTarget(pane.mesh); }
      damageVehicle(v, dmg * (1 - 0.5 * Math.min(1, d / radius)), attacker, p);
    }
  }
}
const _dir = new THREE.Vector3(), _o = new THREE.Vector3(), _mz = new THREE.Vector3(), _sA = new THREE.Vector3(), _sB = new THREE.Vector3(), _bw = new THREE.Vector3(), _hp = new THREE.Vector3();
function spreadDir(base, s, out) {
  out.copy(base);
  if (s <= 0) return out;
  const a = MR() * Math.PI * 2, r = Math.sqrt(MR()) * s;
  _sA.set(base.z, 0, -base.x); if (_sA.lengthSq() < 1e-6) _sA.set(1, 0, 0); _sA.normalize();
  _sB.crossVectors(base, _sA).normalize();
  out.addScaledVector(_sA, Math.cos(a) * r).addScaledVector(_sB, Math.sin(a) * r).normalize();
  return out;
}
function fire(ch, origin, dir, ads) {
  const it = ch.item; if (!it || it.kind !== 'weapon') return false;
  const W = WEAPONS[it.id];
  if (ch.cool > 0 || ch.reloading > 0) return false;
  // tirer fait sauter le déguisement d'Ombre
  if (ch.isPlayer && ch.disguise) setDisguise(ch, false, true);
  if (W.melee) return melee(ch, origin, dir);
  if (it.mag <= 0) { startReload(ch); return false; }
  // Grappin de Skye : tire un câble qui attire vers le point d'impact
  if (W.grapple) {
    it.mag--; ch.cool = 1 / W.rate; ch.swing = 0.6;
    const hit = castRay(origin, dir, W.range, ch);
    if (ch.isPlayer) sfx('boing', 0.7); else sfxAt('boing', ch.pos, 0.6);
    if (hit) {
      tracer(origin, hit.point, 0x7fe0ff);
      const pull = _bw.copy(hit.point).sub(ch.pos);
      const dist = pull.length();
      pull.normalize().multiplyScalar(clamp(10 + dist * 0.45, 12, 28));
      ch.vel.copy(pull); ch.vel.y = Math.max(ch.vel.y, 7);
      ch.grounded = false; ch.noFall = true;
      burst(hit.point, 0x7fe0ff, 8, 4, 0.1);
    }
    return true;
  }
  it.mag--;
  ch.waterAimT = 0.8; // maintien vertical après un tir, même avec une arme lente
  ch.cool = 1 / (W.rate * (ch.isPlayer ? 1 : 0.5));
  const muzzle = ch.held && ch.held.userData.muzzle ? ch.held.userData.muzzle.getWorldPosition(_mz) : _mz.copy(ch.pos).add(_v1.set(0, 1.4, 0));
  const RR = RAR[it.rarity];
  let spread = (ads ? W.ads : W.spread) * RR.spread + ch.bloom;
  if (!ch.grounded) spread += 0.03;
  if (ch.crouch) spread *= 0.7;
  if (ch.isPlayer) { const v2 = ch.vel.x * ch.vel.x + ch.vel.z * ch.vel.z; if (v2 > 4) spread += ads ? 0.006 : 0.014; if (ch.sprint) spread += 0.01; }
  if (it.id === 'sniper' && ads) spread = ch.vel.lengthSq() > 4 ? 0.02 : 0;
  ch.bloom = Math.min(0.06, ch.bloom + W.bloom * (ads ? 0.6 : 1));
  let anyHit = false, headHit = false, killed = false, total = 0, lastT = null, shieldHit = false;
  for (let p = 0; p < W.pellets; p++) {
    spreadDir(dir, spread, _dir);
    const hit = castRay(origin, _dir, W.range, ch);
    const end = hit ? hit.point : _v1.copy(origin).addScaledVector(_dir, W.range);
    if (ch.isPlayer || ch.pos.distanceToSquared(player.pos) < 14400) tracer(muzzle, end, ch.isPlayer ? 0xfff1a8 : 0xffb070);
    if (!hit) continue;
    // explosion (Arc Ka-Boom) : dégâts de zone au point d'impact
    if (W.aoe) { explodeAt(hit.point, W.aoeDmg, W.aoe, ch, W.name); anyHit = true; continue; }
    if (hit.type === 'char') {
      const t = hit.char;
      let dmg = W.dmg * RAR[it.rarity].mult * falloff(W, hit.distance) * (hit.head ? (W.head || 2) : 1);
      if (!ch.isPlayer) dmg *= t.isPlayer ? BOT_DMG * DIFF.dmg : 0.9;
      if (t.team !== undefined && t.team === ch.team) continue;
      if (t.shield > 0) shieldHit = true;
      const r = damageChar(t, dmg, ch, hit.head, W.name, true);
      anyHit = true; headHit = headHit || hit.head; total += dmg; killed = killed || r; lastT = t; _hp.copy(hit.point);
      burst(hit.point, t.shield > 0 ? 0x7fd6ff : 0xff5a5a, 3, 3, 0.08);
    } else if (hit.type === 'struct') {
      damageStruct(hit.col, W.dmg * (W.pellets > 1 ? 0.9 : 1), ch);
      burst(hit.point, 0xfff0c0, 3, 3, 0.07);
    } else if (hit.type === 'vehicleGlass') {
      damageVehicleGlass(hit.pane, W.dmg, ch, hit.point);
    } else if (hit.type === 'vehicle') {
      damageVehicle(hit.vehicle, W.dmg, ch, hit.point);
    } else {
      burst(hit.point, hit.type === 'terrain' ? 0xb9a27a : 0xddddcc, 3, 3, 0.08);
    }
  }
  if (ch.isPlayer && anyHit) { stats.damage += total; if (headHit) stats.headshots++; showHitmarker(headHit, killed, shieldHit); dmgNumber(_hp, total, headHit ? (shieldHit ? 'head shield' : 'head') : shieldHit ? 'shield' : ''); }
  sfxAt(W.sfx, muzzle, ch.isPlayer ? 0.9 : 0.8);
  if (ch.isPlayer || ch.pos.distanceToSquared(player.pos) < 6400) { flash.position.copy(muzzle); flash.visible = true; flash.rotation.set(MR() * 3, MR() * 3, 0); flashT = 0.07; flash.scale.setScalar(0.9 + MR() * 0.9); flashLight.position.copy(muzzle); flashLight.intensity = 10; burst(muzzle, 0xaaaaaa, 4, 1.2, 0.09, 0.15, 0.55); burst(muzzle, 0xffc84a, 3, 3, 0.05, 1, 0.45); }
  if (ch.isPlayer) { const k = RR.recoil * (ads ? 0.7 : 1) * (ch.crouch ? 0.75 : 1); recoil += W.kick * k; recoilX += (MR() - 0.5) * 2 * W.kickX * k; }
  ch.shotKick = 1;
  if (it.mag <= 0) startReload(ch);
  return true;
}
let recoil = 0, recoilX = 0;
function melee(ch, origin, dir) {
  ch.cool = 1 / WEAPONS.pickaxe.rate; ch.swing = 1;
  const hit = castRay(origin, dir, ch.isPlayer ? camDistNow + 3.2 : 2.8, ch);
  sfxAt('swing', ch.pos, 0.6);
  if (!hit) return true;
  if (ch.isPlayer && hit.point.distanceTo(ch.pos) > 3.6) return true;
  // sons d'impact différenciés : la signature (pitch, filtration) dépend du
  // matériau frappé et de l'intensité du coup (crit = plus haut, plus fort) ;
  // chaque coup varie légèrement (détune dans audio.js) pour ne jamais
  // sonner deux fois pareil.
  const pickSnd = (mat, cr, vol = 1) => sfxAt((cr ? 'crit' : 'pick') + mat, hit.point, vol * (0.92 + MR() * 0.16));
  if (hit.type === 'char') { damageChar(hit.char, 20, ch, false, 'Pioche'); if (ch.isPlayer) showHitmarker(false, false, 20); sfxAt('pick', hit.point, 1); }
  else if (hit.type === 'tree') { const cr = ch.isPlayer && weakCheck(hit, hit.tree); harvestTree(hit.tree, ch, cr, hit.point); burst(hit.point, 0x9c6a3a, 6, 4, 0.12); pickSnd('Wood', cr); }
  else if (hit.type === 'rock') { const cr = ch.isPlayer && weakCheck(hit, hit.rock); harvestRock(hit.rock, ch, cr, hit.point); burst(hit.point, 0x9aa3ad, 6, 4, 0.12); pickSnd('Stone', cr); }
  else if (hit.type === 'vehicleGlass') { damageVehicleGlass(hit.pane, 25, ch, hit.point); pickSnd('Metal', false, 0.5); }
  else if (hit.type === 'vehicle') { damageVehicle(hit.vehicle, 35, ch, hit.point); pickSnd('Metal', false, 0.8); }
  else if (hit.type === 'struct') {
    const c = hit.col;
    if (!c.indestructible) {
      const cr = ch.isPlayer && c.kind !== 'build' && weakCheck(hit, c);
      const gain = c.kind === 'build' ? 0 : cr ? 18 : 9;
      if (gain) { ch.mats[c.mat] = Math.min(999, ch.mats[c.mat] + gain); if (ch.isPlayer) matGain(c.mat, gain, hit.point); }
      damageStruct(c, c.kind === 'build' ? 60 : cr ? 110 : 55, ch); if (c.hp <= 0 || !c.alive) weakHide();
      burst(hit.point, 0xd0b080, 6, 4, 0.12);
      if (c.mat) pickSnd(c.mat[0].toUpperCase() + c.mat.slice(1), cr);
      else pickSnd('Stone', cr);
    } else { burst(hit.point, 0xd0b080, 6, 4, 0.12); pickSnd('Metal', false, 0.8); }
  } else { burst(hit.point, 0x9c8a5a, 4, 3, 0.1); sfxAt('pick', hit.point, 0.6); }
  // effet d'impact : onde de choc sur la surface, éclat, étincelles,
  // et une micro-secousse de caméra pour le joueur (le coup a du poids)
  pickImpactFX(hit.point, dir, hit.type);
  if (ch.isPlayer) shake = Math.max(shake, 0.22);
  return true;
}
function harvestTree(t, ch, crit, from) {
  if (!t.alive) return;
  const k = crit ? 2 : 1;
  t.hp -= 50 * k; ch.mats.wood = Math.min(999, ch.mats.wood + 14 * k); if (ch.isPlayer) matGain('wood', 14 * k, from || _v1.set(t.x, t.y + 1.5, t.z));
  if (t.hp <= 0 && ch.isPlayer) weakHide();
  t.shake = 0.25;
  if (t.hp <= 0) {
    t.alive = false; removeCollider(t.col);
    for (const im of t.ims) { im.setMatrixAt(t.i, ZERO_M); im.instanceMatrix.needsUpdate = true; }
    burst(_v1.set(t.x, t.y + 3, t.z), 0x4caf50, 22, 6, 0.4, 0.7, 1.2);
    sfxAt('break', _v1, 0.8);
  }
}
function harvestRock(r, ch, crit, from) {
  if (!r.alive) return;
  const k = crit ? 2 : 1;
  r.hp -= 50 * k; ch.mats.stone = Math.min(999, ch.mats.stone + 12 * k); if (ch.isPlayer) matGain('stone', 12 * k, from || _v1.set(r.x, r.y + 0.8, r.z));
  if (r.hp <= 0 && ch.isPlayer) weakHide();
  if (r.hp <= 0) {
    r.alive = false; removeCollider(r.col); rockIM.setMatrixAt(r.i, ZERO_M); rockIM.instanceMatrix.needsUpdate = true;
    burst(_v1.set(r.x, terrainH(r.x, r.z) + 1, r.z), 0x9aa3ad, 20, 6, 0.4, 1, 1.0); sfxAt('break', _v1, 0.8);
  }
}
function damageChar(t, dmg, attacker, head, wname, silent) {
  if (!t.alive) return false;
  if (t.isPlayer && top1Pending) return false; // top 1 scellé : plus rien ne peut te tuer pendant le ralenti
  if (attacker && attacker !== t && attacker.team !== undefined && attacker.team === t.team) return false;
  let shieldHit = t.shield > 0; const orig = dmg;
  if (attacker && attacker.isPlayer && !silent) dmgNumber(_hp.copy(t.pos).add(_v2.set(0, 1.6, 0)), orig, head ? 'head' : shieldHit ? 'shield' : '');
  shieldHit = false;
  if (t.shield > 0) { const s = Math.min(t.shield, dmg); t.shield -= s; dmg -= s; shieldHit = true; if (t.shield <= 0 && attacker && attacker.isPlayer) sfx('break', 0.35); }
  t.hp -= dmg;
  t.lastHitBy = attacker; t.hurtT = 0.3;
  if (t.isPlayer) { hurtFlash = 0.6; sfx('hurt', 0.7); if (attacker) { hurtDir = Math.atan2(attacker.pos.x - t.pos.x, attacker.pos.z - t.pos.z); hurtDirT = 1.3; } if (t.disguise) setDisguise(t, false, true); }
  else onBotDamaged(t, attacker);
  if (t.hp <= 0) { kill(t, attacker, wname); return true; }
  return false;
}
let hurtFlash = 0, hurtDir = 0, hurtDirT = 0, spectateTarget = null;
const milestones = {};
function setBuildModeOff() { buildMode = false; for (const k in ghosts) ghosts[k].visible = false; updateBuildBar(); }
function kill(t, attacker, wname) {
  t.alive = false; t.hp = 0;
  const alive = chars.filter((c) => c.alive && !c.hench).length;
  // les hommes de main ne comptent pas dans les éliminations ni le classement
  if (attacker && attacker !== t && !t.hench) attacker.kills++;
  if (attacker && attacker.isPlayer && t !== attacker && !t.hench) stats.elims = (stats.elims || 0) + 1;
  addKillFeed(attacker, t, wname);
  burst(_v1.copy(t.pos).add(_v2.set(0, 1, 0)), 0x9fe3ff, 30, 6, 0.2, 0.3, 1.2);
  t.dieT = 0.6;
  // drops
  for (let i = 1; i < 6; i++) { const it = t.slots[i]; if (it) spawnLoot(it, t.pos.x, t.pos.y + 0.5, t.pos.z); }
  for (const m of MAT_ORDER) if (t.mats[m] > 0) spawnLoot({ kind: 'mats', mat: m, amount: Math.min(t.mats[m], 100) }, t.pos.x, t.pos.y + 0.5, t.pos.z);
  for (const a in t.ammo) if (t.ammo[a] > 0) spawnLoot({ kind: 'ammo', type: a, amount: t.ammo[a] }, t.pos.x, t.pos.y + 0.5, t.pos.z);
  if (!t.isPlayer) { const w = t.slots.find((s, i) => i > 0 && s && s.kind === 'weapon'); if (w) spawnLoot(ammoFor(w.id), t.pos.x, t.pos.y + 0.5, t.pos.z); }
  // un boss lâche sa carte d'accès au coffre-fort de son POI
  if (t.boss && t.bossPoi) {
    spawnLoot({ kind: 'keycard', poi: t.bossPoi.key }, t.pos.x, t.pos.y + 0.6, t.pos.z);
    if (attacker && attacker.isPlayer) {
      addXP('Boss éliminé', 500);
      showCenter(`${t.name.toUpperCase()} ÉLIMINÉ`, 'Arme mythique + carte d\'accès au coffre-fort', 2.6);
    }
  } else if (t.hench && attacker && attacker.isPlayer) {
    addXP('Ombre éliminée', 60);
  }
  t.slots = [t.slots[0], null, null, null, null, null];
  if (attacker && attacker.isPlayer && t !== attacker && !t.hench) { sfx('elim', 0.7); showCenter(`${t.name} éliminé`, `${alive} joueurs restants`, 1.8); addXP('Élimination', 250); }
  if (player.alive && !t.isPlayer) for (const [n, x] of [[25, 150], [10, 350], [5, 600]]) if (alive <= n && !milestones[n]) { milestones[n] = true; addXP('Top ' + n, x); }
  if (t.vehicle) { t.vehicle.driver = null; t.vehicle = null; updateVehicleHUD(); }
  const teams = aliveTeams();
  if (t.isPlayer) {
    elimBy = attacker && attacker !== t ? attacker.name : 'la tempête'; setBuildModeOff(); cancelEdit();
    const mateAlive = mates.find((m) => m.alive);
    placement = teams.has(0) ? 0 : teams.size + 1;
    spectateTarget = mateAlive || (attacker && attacker !== t && attacker.alive ? attacker : null);
    if (!mateAlive) { finalizeXP(); setTimeout(() => endGame(false), spectateTarget ? 4200 : 1800); }
    else showCenter('ÉLIMINÉ', `Tu regardes ${mateAlive.name} — ton équipe est encore en jeu`, 3);
  } else {
    if (t.hench && teams.size === 1 && teams.has(0)) { /* les hommes de main ne déclenchent pas la victoire */ }
    else if (teams.size === 1 && teams.has(0)) { if (player.alive) beginTop1(); else { wonMatch = true; finalizeXP(); setTimeout(() => endGame(true), 1500); } }
    else if (!teams.has(0) && !player.alive && state === 'playing' && !xpFinal) { placement = teams.size + 1; finalizeXP(); setTimeout(() => endGame(false), 2500); }
    if (!player.alive && spectateTarget === t) spectateTarget = mates.find((m) => m.alive) || (attacker && attacker.alive ? attacker : null);
  }
  leaderboard.push({ name: t.name, kills: t.kills, team: t.team, place: t.hench ? null : (teams.has(t.team) ? null : teams.size + 1), by: attacker && attacker !== t ? attacker.name : 'Tempête' });
}
function addKillFeed(a, t, w) {
  const kf = document.getElementById('killfeed');
  const d = document.createElement('div'); d.className = 'kf' + ((a && a.isPlayer) || (t && t.isPlayer) ? ' mine' : '');
  const nm = (c) => `<b class="${c && c.isPlayer ? 'me' : ''}">${c ? c.name : ''}</b>`;
  d.innerHTML = a && a !== t ? `${nm(a)} <span class="w">a éliminé</span> ${nm(t)} ${w ? `<span class="w">· ${w}</span>` : ''}` : `${nm(t)} <span class="w">a succombé à la tempête</span>`;
  kf.prepend(d);
  while (kf.children.length > 6) kf.lastChild.remove();
  setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 700); }, 6000);
}
let hmT = 0;
function showHitmarker(head, kill, shield) {
  const h = document.getElementById('hitmarker'); h.className = head ? 'head' : shield ? 'shield' : ''; if (kill) h.className += ' kill';
  h.style.opacity = 1; hmT = 0.15; sfx(head ? 'head' : shield ? 'shieldhit' : 'hit', 0.6); if (shield && head) sfx('shieldhit', 0.4);
}

// =====================================================================
// Bots
// =====================================================================
const bots = [];
function onBotDamaged(b, attacker) {
  if (!attacker || attacker === b) return;
  if (b.hench) { alertHenchmen(b.henchPoi, attacker); return; } // pas de construction, juste l'alerte
  if (!b.target || !b.target.alive || MR() < 0.5) { b.target = attacker; b.react = 0.15; }
  b.hitT = 1.4; // pris pour cible : esquive plus vive pendant 1,4 s
  // Les bots construisent peu : cooldown très long, faible probabilité, et une pièce à la fois.
  if (b.mode === 'ground' && b.grounded && b.buildCd <= 0 && !(b.buildQ && b.buildQ.length) && MR() < 0.06 + b.skill * 0.06 * DIFF.aim) {
    b.buildCd = rand(14, 26) / DIFF.aim;
    const mat = botMat(b, 40);
    if (!mat) return;
    const yaw = Math.atan2(-(attacker.pos.x - b.pos.x), -(attacker.pos.z - b.pos.z));
    const fake = { pos: b.pos, yaw };
    if (b.hp + b.shield < 60 && MR() < 0.35) botBox(b, mat, attacker); // box complète seulement en grand danger
    else {
      const t = computeTarget(fake, 'wall', 0); queueBuild(b, 'wall', t.cx, t.cz, t.y, t.d, mat);
      if (MR() < 0.15) { b.rampRush = rand(1.5, 2.5); }
    }
  }
}
function botMat(b, need) { for (const m of ['wood', 'stone', 'metal']) if (b.mats[m] >= need) return m; return null; }
function queueBuild(b, type, cx, cz, y, d, mat) { (b.buildQ || (b.buildQ = [])).push({ type, cx, cz, y, d, mat }); }
// Pose une pièce de la file toutes les ~0.6 s (comme un joueur qui appuie sur la touche), jamais tout d'un coup.
function botBuildQueue(b, dt) {
  if (!b.buildQ || !b.buildQ.length) return;
  b.qCd = (b.qCd || 0) - dt;
  if (b.qCd > 0) return;
  const q = b.buildQ.shift();
  placeBuild(b, q.type, q.cx, q.cz, q.y, q.d, q.mat);
  b.qCd = rand(0.5, 0.8) / Math.max(0.6, DIFF.aim);
}
function botBox(b, mat, attacker) {
  const cx = Math.floor(b.pos.x / CELL), cz = Math.floor(b.pos.z / CELL), y = Math.floor((b.pos.y + 0.6) / CELL) * CELL;
  // Mur face à l'attaquant en premier, puis les autres côtés.
  let first = 0;
  if (attacker) { const dx = attacker.pos.x - b.pos.x, dz = attacker.pos.z - b.pos.z; first = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 3 : 1) : (dz > 0 ? 2 : 0); }
  let n = 0;
  for (let k = 0; k < 4; k++) { const d = (first + k) % 4; const [wx, wz, wd] = normWall(cx, cz, d); if (!builds.has(buildKey('wall', wx, wz, y, wd))) { queueBuild(b, 'wall', cx, cz, y, d, mat); n++; } }
  if (MR() < 0.4) { queueBuild(b, 'cone', cx, cz, y + CELL, 0, mat); n++; }
  b.boxedT = 1e3; b.boxCell = cx * 1000 + cz; b.boxY = y; b.boxFace = first;
  b.editT = rand(0.4, 0.9); b.editStage = 0; b.boxFor = attacker || null;
}
// Édition par les bots : fenêtre pour tirer, puis porte pour sortir.
function botEditWall(b, d, mask) {
  const [wx, wz, wd] = normWall(Math.floor(b.pos.x / CELL), Math.floor(b.pos.z / CELL), d);
  const col = builds.get(buildKey('wall', wx, wz, b.boxY, wd));
  if (!col || !col.alive) return false;
  if (editing && editing.col === col) return false;
  applyEdit(col, mask); sfxAt('editok', col.mesh.position, 0.5); return true;
}
function botBoxEdit(b, dt) {
  if (!(b.boxedT > 0) || b.boxY === undefined) return;
  if (b.buildQ && b.buildQ.length) return; // la box n'est pas finie
  b.editT -= dt;
  if (b.editT > 0) return;
  const face = b.boxFace || 0;
  if (b.editStage === 0) {
    b.editStage = 1; b.editT = rand(1.8, 3.2);
    if ((b.target && b.target.alive) || (b.boxFor && b.boxFor.alive)) { botEditWall(b, face, 0x10); return; } // fenêtre au niveau des yeux
  }
  if (b.editStage === 1) {
    // Sortie : porte dans le mur face à l'ennemi (ou celui de la fenêtre).
    b.editStage = 2; botEditWall(b, face, 0x12); b.boxedT = 0.5; b.boxFor = null;
  }
}
function botRampStep(b, dt) {
  // une rampe à la fois, lentement
  b.rampRush -= dt; b.rampCd = (b.rampCd || 0) - dt;
  if (b.rampCd > 0 || !b.grounded) return;
  const mat = botMat(b, 20); if (!mat) { b.rampRush = 0; return; }
  b.rampCd = rand(0.9, 1.3) / Math.max(0.6, DIFF.aim);
  const fwd = { pos: b.pos, yaw: b.yaw };
  const r = computeTarget(fwd, 'ramp', 0); placeBuild(b, 'ramp', r.cx, r.cz, r.y, r.d, mat);
}
function randomLandPoint(cx, cz, r) {
  for (let k = 0; k < 30; k++) {
    const a = MR() * 6.283, d = Math.sqrt(MR()) * r;
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    if (Math.hypot(x / OVAL_X, z / OVAL_Z) < ISLAND_R && terrainH(x, z) > 1.8) return new THREE.Vector3(x, 0, z);
  }
  return new THREE.Vector3(cx * 0.5, 0, cz * 0.5);
}
function canSee(a, b) {
  _o.copy(a.pos); _o.y += 1.6;
  _v3.copy(b.pos); _v3.y += 1.2;
  const dist = _o.distanceTo(_v3);
  _dir.subVectors(_v3, _o).normalize();
  const h = castRay(_o, _dir, dist + 1, a);
  return h && h.type === 'char' && h.char === b;
}
// =====================================================================
// ÉVITEMENT DES MURS : plus aucun bot ne doit rester bloqué contre un mur.
// pathClear() reprend EXACTEMENT les règles horizontales de physics()
// (CH_R, CH_H, STEP) pour des points situés devant le personnage : un collider
// n'est un mur que s'il dépasse le pas (maxY > pieds + STEP) tout en restant
// sous la tête (minY < pieds + CH_H) — marches et rampes ne comptent donc pas.
// steerWalls() dévie le wish vers la première direction libre (alternance
// gauche/droite, angles croissants) et GARDE cette déviation tant que la voie
// directe reste bloquée : le bot longe le mur au lieu d'osciller, et reprend
// son cap dès que la voie est dégagée.
// =====================================================================
const tmpNavCols = [];
function pathClear(ch, nx, nz) {
  const cx = ch.pos.x + nx * 1.2, cz = ch.pos.z + nz * 1.2;
  queryCols(cx, cz, 2.0, tmpNavCols);
  for (const c of tmpNavCols) {
    if (c.type !== 'box' || !c.alive || c.passable) continue;
    if (ch.pos.y + CH_H <= c.minY || ch.pos.y + STEP >= c.maxY) continue; // même test que physics()
    for (const dist of [0.7, 1.7]) {
      const px = ch.pos.x + nx * dist, pz = ch.pos.z + nz * dist;
      const qx = clamp(px, c.minX, c.maxX), qz = clamp(pz, c.minZ, c.maxZ);
      if ((px - qx) * (px - qx) + (pz - qz) * (pz - qz) < (CH_R + 0.1) * (CH_R + 0.1)) return false;
    }
  }
  return true;
}
function steerWalls(ch, wish) {
  const d = Math.hypot(wish.x, wish.z);
  if (d < 1e-4) return;
  const nx = wish.x / d, nz = wish.z / d;
  if (pathClear(ch, nx, nz)) { ch.avoidX = 0; return; } // voie directe dégagée
  if (ch.avoidX) { // déviation en cours encore praticable : on la garde (pas d'oscillation)
    const l = Math.hypot(ch.avoidX, ch.avoidZ);
    if (l > 1e-4 && pathClear(ch, ch.avoidX / l, ch.avoidZ / l)) { wish.set(ch.avoidX, 0, ch.avoidZ); return; }
  }
  for (const a of [0.5, -0.5, 1.0, -1.0, 1.6, -1.6, 2.2, -2.2, 2.8, -2.8]) {
    const rx = nx * Math.cos(a) - nz * Math.sin(a), rz = nx * Math.sin(a) + nz * Math.cos(a);
    if (pathClear(ch, rx, rz)) { ch.avoidX = rx; ch.avoidZ = rz; wish.set(rx, 0, rz); return; }
  }
  ch.avoidX = 0; // cerné de toutes parts : le débloquage existant (saut/rampe/nouveau cap) prend le relais
}
function botThink(b, dt) {
  b.think -= dt; b.buildCd -= dt; b.react -= dt;
  if (b.think <= 0) {
    b.think = rand(0.3, 0.6);
    // target acquisition
    if (!b.target || !b.target.alive || b.target.pos.distanceTo(b.pos) > 90 || (b.lostT > 3 && !(b.boxedT > 0))) {
      b.target = null; b.lostT = 0;
      // check the 3 nearest enemies in range for line of sight (allocation-free)
      let c1 = null, c2 = null, c3 = null, d1 = 1e9, d2 = 1e9, d3 = 1e9;
      const maxD = b.armed ? 70 : 7;
      for (const c of chars) {
        if (c === b || !c.alive || c.mode === 'bus' || c.team === b.team) continue;
        const d = c.pos.distanceTo(b.pos);
        if (d > maxD) continue;
        if (d < d1) { c3 = c2; d3 = d2; c2 = c1; d2 = d1; c1 = c; d1 = d; } else if (d < d2) { c3 = c2; d3 = d2; c2 = c; d2 = d; } else if (d < d3) { c3 = c; d3 = d; }
      }
      const best = c1 && canSee(b, c1) ? c1 : c2 && canSee(b, c2) ? c2 : c3 && canSee(b, c3) ? c3 : null;
      if (best) { b.target = best; b.react = rand(0.8, 1.6) * DIFF.react; }
    } else {
      b.seeing = canSee(b, b.target);
      if (!b.seeing) b.lostT += 0.45; else b.lostT = 0;
    }
    // waypoint selection
    const outside = Math.hypot(b.pos.x - storm.cx, b.pos.z - storm.cz) > storm.r - 6;
    const outNext = Math.hypot(b.pos.x - storm.nx, b.pos.z - storm.nz) > storm.nr - 4;
    if (storm.phase >= 0 && (outside || (outNext && b.wpKind !== 'storm'))) {
      b.wp = randomLandPoint(storm.nx, storm.nz, Math.max(4, storm.nr * 0.6)); b.wpKind = 'storm';
    } else if (b.lootGoal && b.lootGoal.valid()) {
      b.wp = b.lootGoal.pos; b.wpKind = 'loot';
    } else if (b.mate && player.alive && player.mode !== 'bus' && Math.hypot(player.pos.x - b.pos.x, player.pos.z - b.pos.z) > 10) {
      b.wp = randomLandPoint(player.pos.x, player.pos.z, 5); b.wpKind = 'follow';
    } else if (!b.wp || Math.hypot(b.wp.x - b.pos.x, b.wp.z - b.pos.z) < 3) {
      b.wp = randomLandPoint(storm.phase >= 0 ? storm.nx : b.pos.x, storm.phase >= 0 ? storm.nz : b.pos.z, storm.phase >= 0 ? Math.max(5, storm.nr * 0.8) : 40); b.wpKind = 'roam';
    }
    // pick weapon by distance
    if (b.target) {
      const d = b.target.pos.distanceTo(b.pos);
      let want = d < 12 ? 'shotgun' : d < 30 ? 'smg' : d > 55 ? 'sniper' : 'ar';
      let idx = b.slots.findIndex((s) => s && s.id === want);
      if (idx < 0) idx = b.slots.findIndex((s, i) => i > 0 && s && s.kind === 'weapon');
      if (idx > 0 && idx !== b.cur) { b.cur = idx; b.cool = 0.3; }
    }
    if (b.shield < 50 && !b.target && b.heals > 0 && b.mode === 'ground') { b.heals--; b.shield = Math.min(100, b.shield + 50); }
    if (!b.target) { if (b.mats.wood < 120) b.mats.wood += 4; autoPickups(b); botPickGoal(b); }
  }
  // movement
  const wish = _bw.set(0, 0, 0);
  let speed = RUN * 0.92;
  if (b.boxedT > 0) {
    b.boxedT -= dt;
    if (b.boxedT > 0 && b.heals > 0 && b.shield < 100 && !b.healing) { b.healing = 2.5; }
  }
  // le soin coule aussi hors de la caisse (repli tactique)
  if (b.healing > 0) { b.healing -= dt; if (b.healing <= 0) { b.healing = 0; if (b.heals > 0) { b.heals--; b.shield = Math.min(100, b.shield + 50); } } }
  if (b.hitT > 0) b.hitT = Math.max(0, b.hitT - dt);
  botBuildQueue(b, dt); botBoxEdit(b, dt);
  if (b.rampRush > 0 && b.target && b.target.alive) { botRampStep(b, dt); }
  else if (b.target && b.target.alive && b.mode === 'ground' && b.buildCd <= 0 && b.target.pos.y > b.pos.y + 3 && b.target.pos.distanceTo(b.pos) < 40 && MR() < dt * 0.25 * DIFF.aim) { b.rampRush = rand(1.5, 3); b.buildCd = rand(8, 14); }
  if (b.target && b.target.alive && b.seeing !== false) {
    const tp = b.target.pos;
    const dx = tp.x - b.pos.x, dz = tp.z - b.pos.z, d = Math.hypot(dx, dz);
    b.yaw = lerpAngle(b.yaw, Math.atan2(-dx, -dz), Math.min(1, dt * 8));
    const W = weaponOf(b);
    const pref = !W || W.melee ? 2 : W === WEAPONS.shotgun ? 6 : W === WEAPONS.sniper ? 50 : W === WEAPONS.smg ? 14 : 24;
    const nx = dx / (d || 1), nz = dz / (d || 1);
    let approach = d > pref + 4 ? 1 : d < pref - 3 ? -0.7 : 0;
    // repli tactique : blessé, on garde ses distances et on se soigne au lieu de charger
    if (b.hp + b.shield < 45) {
      approach = d < 30 ? -1 : 0;
      if (b.mode === 'ground' && !b.healing && b.heals > 0) b.healing = 2.5;
    }
    if (b.rampRush > 0) approach = 1;
    if (b.boxedT > 0) approach = 0;
    b.strafeT -= dt; if (b.strafeT <= 0) { b.strafe = MR() < 0.5 ? -1 : 1; b.strafeT = rand(0.5, 1.6); }
    const strafeK = b.rampRush > 0 || b.boxedT > 0 ? 0 : 0.8;
    wish.set(nx * approach - nz * b.strafe * strafeK, 0, nz * approach + nx * b.strafe * strafeK);
    // esquive : sous le feu, on saute et on strafe plus souvent
    if (b.grounded && MR() < dt * (b.hitT > 0 ? 2.2 : 0.6)) b.vel.y = JUMP_V;
    // aim & shoot
    if (b.react <= 0 && W) {
      b.burst -= dt;
      if (b.burst < -rand(1.2, 2.4) * DIFF.react) b.burst = rand(0.5, 1.1);
      if (b.burst > 0 || W.melee) {
        _o.copy(b.pos); _o.y += 1.55;
        _v3.copy(tp); _v3.y += rand(0.9, 1.7);
        const dist = _o.distanceTo(_v3);
        // tir prédictif : on mène la cible mobile comme un vrai joueur
        _v3.addScaledVector(b.target.vel, Math.min(0.7, dist / 110));
        _v2.subVectors(_v3, _o).normalize();
        const err = (0.05 + dist * 0.0009) / (b.skill * DIFF.aim) + (b.target.vel.lengthSq() > 9 ? 0.03 : 0) + (b.target.crouch ? 0.01 : 0);
        _v2.x += (MR() - 0.5) * err * 2; _v2.y += (MR() - 0.5) * err * 2; _v2.z += (MR() - 0.5) * err * 2; _v2.normalize();
        if (W.melee) { if (dist < 2.8) fire(b, _o, _v2, false); }
        else if (dist < W.range) fire(b, _o, _v2, false);
      }
    }
    if (b.reloading <= 0 && b.item && b.item.kind === 'weapon' && b.item.mag === 0) startReload(b);
  } else if (b.wp && !(b.boxedT > 0)) {
    const dx = b.wp.x - b.pos.x, dz = b.wp.z - b.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.5) { wish.set(dx / d, 0, dz / d); b.yaw = lerpAngle(b.yaw, Math.atan2(-dx, -dz), Math.min(1, dt * 5)); }
  }
  // stuck handling
  b.stuckT += dt;
  if (b.stuckT > 1) {
    const moved = Math.hypot(b.pos.x - b.lastP.x, b.pos.z - b.lastP.z);
    if (moved < 1.2 && wish.lengthSq() > 0.1) {
      b.stuckN++;
      if (b.grounded) b.vel.y = JUMP_V;
      if (b.stuckN > 2 && b.mats.wood >= 10 && b.grounded) {
        // ramp over obstacle
        const r = computeTarget(b, 'ramp', 0); placeBuild(b, 'ramp', r.cx, r.cz, r.y, r.d, 'wood');
      }
      if (b.stuckN > 4) { b.wp = randomLandPoint(b.pos.x, b.pos.z, 30); b.stuckN = 0; }
    } else b.stuckN = 0;
    b.lastP.copy(b.pos); b.stuckT = 0;
  }
  if (b.inWater) speed *= 0.55;
  // évitement des murs : appliqué après toutes les décisions de mouvement
  // (poursuite, strafe, waypoint) pour que le bot longe les obstacles
  if (wish.lengthSq() > 0.01) steerWalls(b, wish);
  const acc = b.grounded ? 12 : 3;
  b.vel.x = lerp(b.vel.x, wish.x * speed, Math.min(1, acc * dt));
  b.vel.z = lerp(b.vel.z, wish.z * speed, Math.min(1, acc * dt));
}
function lerpAngle(a, b, t) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; }
// =====================================================================
// Ombres & boss (POI espions) : patrouillent leur POI en suivant une ROUTINE
// FIXE (toujours les mêmes endroits, dans le même ordre), ignorent les joueurs
// déguisés, passent à l'attaque si on les touche, puis reprennent leur circuit.
// =====================================================================
// Circuit de patrouille FIXE de chaque POI espion : points praticables choisis
// à la main sur la surface réelle (hall de l'Agence en évitant bassin et
// escalier, pont du Yacht, plateforme de La Plateforme, caverne de la Grotte,
// tour du manoir du Requin). Les PNJ y spawnent aussi : jamais dans un mur.
function spyPatrol(p, staffIndex = 0) {
  const rel = {
    agency: [[0, 7.5], [8, 7.5], [10, 0], [8, -7], [0, -7.5], [-6, -7], [-10, 5], [-6, 7.5]].map(([dx, dz]) => [dx * AGENCY_K, dz * AGENCY_K]), // plan agrandi
    yacht: [[-18, 0], [-12, 0], [-3, 0], [4, 0], [11, 0], [23, 2], [23, -6.2], [11, -6.2], [-6, -6.1], [-18, -5.5]],
    rig: [[-6, 4], [0, 4.6], [6, 4], [6, -4], [0, -4.6], [-6, -4]],
    grotto: [[-7, 6], [0, 8], [7, 6], [7, -4], [0, -8], [-7, -4]],
    // Le Requin : ronde au sol — plage devant la gueule, hélipad à l'est,
    // passage étroit entre l'escalier et le coffre-fort (points alignés pour
    // que les PNJ le traversent sans se coincer), derrière la falaise,
    // contournement du phare puis retour par la plage ouest
    shark: [[0, 14], [9, 12], [16, 10], [18, 6], [12.5, 5.5], [12.5, 2], [12.5, -7], [11, -17], [5, -19], [-5, -20], [-14, -17], [-16, -6], [-8, 12]],
  }[p.key];
  if (!rel) return null;
  const cx = p.key === 'grotto' ? GROTTO.cavernX : p.x;
  const cz = p.key === 'grotto' ? GROTTO.cavernZ : p.z;
  const network = rel.map(([dx, dz]) => ({ x: cx + dx, z: cz + dz }));
  if (staffIndex === 0) return network;
  // Chaque Ombre garde un secteur distinct, pas le même tour décalé.
  // L'aller-retour suit les arêtes praticables ; aucune diagonale dans un mur.
  const count = SPY_STAFF[p.key].hench;
  const start = Math.floor((staffIndex - 1) * network.length / count);
  const span = Math.min(network.length - 1, Math.max(2, Math.ceil(network.length / count)));
  const sector = [];
  for (let i = 0; i <= span; i++) sector.push({ ...network[(start + i) % network.length] });
  for (let i = span - 1; i > 0; i--) sector.push({ ...network[(start + i) % network.length] });
  return sector;
}
function alertHenchmen(poi, attacker) {
  if (!attacker || !attacker.alive || attacker.hench) return; // jamais de riposte contre son propre camp
  for (const c of chars) {
    if (!c.hench || !c.alive || c.henchPoi !== poi) continue;
    if (!c.target || !c.target.alive) { c.target = attacker; c.react = rand(0.2, 0.6); c.alert = 8; }
  }
}
function henchThink(h, dt) {
  h.think -= dt; h.react -= dt;
  if (h.think <= 0) {
    h.think = rand(0.3, 0.6);
    // cible : ennemi visible du POI (jamais un autre homme de main, jamais un déguisé)
    if (!h.target || !h.target.alive || h.target.disguise || h.target.pos.distanceTo(h.pos) > 80 || h.lostT > 4) {
      if (h.target && h.target.disguise) h.target = null;
      h.target = null; h.lostT = 0;
      for (const c of chars) {
        if (c === h || !c.alive || c.mode === 'bus' || c.hench || c.disguise) continue;
        if (c.team !== undefined && c.team === h.team) continue;
        const d = c.pos.distanceTo(h.pos);
        if (d < 55 && inPOI(c.pos.x, c.pos.z, 10) === h.henchPoi && canSee(h, c)) { h.target = c; h.react = rand(0.6, 1.4); break; }
      }
    } else {
      h.seeing = canSee(h, h.target);
      if (!h.seeing) h.lostT += 0.45; else h.lostT = 0;
    }
    // Patrouille personnelle : boss et Ombres reprennent leur propre circuit ;
    // l'index n'avance qu'en patrouille, le circuit reprend après un combat
    if (!h.target && (!h.wp || Math.hypot(h.wp.x - h.pos.x, h.wp.z - h.pos.z) < 1.1)) {
      if (h.route && h.route.length) {
        h.routeIdx = (h.routeIdx + 1) % h.route.length;
        h.wp = { x: h.route[h.routeIdx].x, z: h.route[h.routeIdx].z };
      } else if (h.wpBox) h.wp = { x: h.wpBox.x + rand(-h.wpBox.hx, h.wpBox.hx), z: h.wpBox.z + rand(-h.wpBox.hz, h.wpBox.hz) };
      else { const p = h.henchPoi; h.wp = { x: p.x + rand(-p.r * 0.8, p.r * 0.8), z: p.z + rand(-p.r * 0.8, p.r * 0.8) }; }
    }
    if (!h.target && h.heals > 0 && h.shield < 50 && h.mode === 'ground') { h.heals--; h.shield = Math.min(100, h.shield + 50); }
  }
  if (h.alert > 0) h.alert -= dt;
  const wish = _bw.set(0, 0, 0);
  let speed = RUN * (h.target ? 0.9 : (h.patrolSpeed || 0.7));
  if (h.target && h.target.alive && h.seeing !== false) {
    const tp = h.target.pos;
    const dx = tp.x - h.pos.x, dz = tp.z - h.pos.z, d = Math.hypot(dx, dz);
    h.yaw = lerpAngle(h.yaw, Math.atan2(-dx, -dz), Math.min(1, dt * 8));
    const W = weaponOf(h);
    const pref = !W || W.melee ? 2 : W === WEAPONS.shotgun ? 6 : W === WEAPONS.sniper ? 40 : W === WEAPONS.smg ? 12 : 20;
    const nx = dx / (d || 1), nz = dz / (d || 1);
    const approach = d > pref + 4 ? 1 : d < pref - 3 ? -0.7 : 0;
    h.strafeT -= dt; if (h.strafeT <= 0) { h.strafe = MR() < 0.5 ? -1 : 1; h.strafeT = rand(0.5, 1.6); }
    wish.set(nx * approach - nz * h.strafe * 0.8, 0, nz * approach + nx * h.strafe * 0.8);
    if (h.grounded && MR() < dt * 0.5) h.vel.y = JUMP_V;
    // visée & tir
    if (h.react <= 0 && W) {
      h.burst -= dt;
      if (h.burst < -rand(1.2, 2.2)) h.burst = rand(0.5, 1.1);
      if (h.burst > 0 || W.melee) {
        _o.copy(h.pos); _o.y += 1.55;
        _v3.copy(tp); _v3.y += rand(0.9, 1.7);
        const dist = _o.distanceTo(_v3);
        _v2.subVectors(_v3, _o).normalize();
        const err = (0.06 + dist * 0.001) / (h.skill * DIFF.aim) + (h.target.vel.lengthSq() > 9 ? 0.03 : 0);
        _v2.x += (MR() - 0.5) * err * 2; _v2.y += (MR() - 0.5) * err * 2; _v2.z += (MR() - 0.5) * err * 2; _v2.normalize();
        if (W.melee) { if (dist < 2.8) fire(h, _o, _v2, false); }
        else if (dist < W.range) fire(h, _o, _v2, false);
      }
    }
    if (h.reloading <= 0 && h.item && h.item.kind === 'weapon' && h.item.mag === 0) startReload(h);
  } else if (h.wp) {
    const dx = h.wp.x - h.pos.x, dz = h.wp.z - h.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.5) { wish.set(dx / d, 0, dz / d); h.yaw = lerpAngle(h.yaw, Math.atan2(-dx, -dz), Math.min(1, dt * 5)); }
  }
  if (h.inWater) speed *= 0.55;
  // évitement des murs (comme les autres bots) : l'ombre longe les obstacles
  if (wish.lengthSq() > 0.01) steerWalls(h, wish);
  const acc = h.grounded ? 12 : 3;
  h.vel.x = lerp(h.vel.x, wish.x * speed, Math.min(1, acc * dt));
  h.vel.z = lerp(h.vel.z, wish.z * speed, Math.min(1, acc * dt));
}

// =====================================================================
// Bus, drop, gliding
// =====================================================================
function jumpFromBus(ch) {
  if (ch.mode !== 'bus') return;
  ch.mode = 'fall'; ch.mesh.visible = true;
  ch.pos.copy(bus.pos).add(_v1.set(0, -3, 0));
  ch.vel.copy(bus.dir).multiplyScalar(12); ch.vel.y = -4;
  if (ch.isPlayer) { mates.forEach((m, i) => { if (m.mode === 'bus') m.jumpAt = Math.min(bus.t / bus.dur + 0.008 * (i + 1), 0.99); });
    sfx('whoosh', 0.6); stopMusic(); document.getElementById('busHint').style.display = 'none'; showCenter('', IS_TOUCH ? 'Regarde vers le bas pour plonger · SAUT ouvre le parachute' : `Plonge en regardant vers le bas · <kbd>${keyLabel(BIND.back)}</kbd> pour freiner · <kbd>${keyLabel(BIND.jump)}</kbd> ouvre le planeur`, 4); }
}
function deployGlider(ch) {
  if (ch.mode !== 'fall' && !(ch.mode === 'ground' && !ch.grounded)) return;
  if (ch.mode === 'ground' && ch.isPlayer) { setBuildModeOff(); cancelEdit(); ch.using = null; ch.reloading = 0; ch.emoting = null; }
  ch.mode = 'glide'; ch.manualFall = false; ch.parts.glider.visible = true; if (ch.isPlayer) { sfx('chute', 0.6); sfx('glide', 0.4); }
}
// referme le planeur à volonté : retour en chute libre (sans réouverture automatique près du sol)
function closeGlider(ch) {
  if (ch.mode !== 'glide') return;
  ch.mode = 'fall'; ch.manualFall = true; ch.parts.glider.visible = false;
  if (ch.isPlayer) sfx('whoosh', 0.4);
}
function groundBelow(ch) {
  let g = underGrotto(ch.pos.x, ch.pos.z, ch.pos.y) ? -1e9 : Math.max(terrainH(ch.pos.x, ch.pos.z), -0.9);
  queryCols(ch.pos.x, ch.pos.z, 1, tmpCols);
  for (const c of tmpCols) if (c.alive && c.maxY < ch.pos.y && c.maxY > g && ch.pos.x > c.minX && ch.pos.x < c.maxX && ch.pos.z > c.minZ && ch.pos.z < c.maxZ) g = c.maxY;
  return g;
}
function airControl(ch, wish, dt) {
  const h = ch.pos.y - groundBelow(ch);
  if (ch.mode === 'fall') {
    // dive: look down + forward = fast; back = air brake
    let dive;
    if (ch.isPlayer) {
      const fwdK = down('forward') ? 1 : down('back') ? -1 : 0;
      dive = clamp(clamp(-camPitch, 0, 1.3) / 1.3 * (fwdK >= 0 ? 1 : 0) + (fwdK > 0 ? 0.25 : 0), 0, 1);
      if (fwdK < 0) dive = -0.6;
    } else dive = ch.diveK ?? 0.7;
    const vy = dive >= 0 ? -(24 + dive * 30) : -18;
    if (ch.launchT > 0) { ch.launchT -= dt; ch.vel.y = 26; } else ch.vel.y = lerp(ch.vel.y, vy, Math.min(1, dt * 1.6));
    const sp = dive >= 0 ? 15 + (1 - dive) * 9 : 10;
    ch.vel.x = lerp(ch.vel.x, wish.x * sp, Math.min(1, dt * 2)); ch.vel.z = lerp(ch.vel.z, wish.z * sp, Math.min(1, dt * 2));
    const descending = ch.vel.y < 0 && !(ch.launchT > 0);
    if (!ch.isPlayer && descending && h < (ch.deployH || 40)) deployGlider(ch);
    // Hauteur max de chute libre : sous 30 m du sol, le planeur s'ouvre d'office —
    // même refermé à la main, impossible de finir la chute sans lui (comme Fortnite).
    if (descending && h < 30) deployGlider(ch);
    ch.windT = (ch.windT || 0) - dt; if (ch.isPlayer && ch.windT <= 0) { ch.windT = 1.1; sfx('whoosh', 0.25 + Math.max(0, dive) * 0.3); }
  } else if (ch.mode === 'glide') {
    const fwdK = ch.isPlayer ? (down('forward') ? 1 : down('back') ? -1 : 0) : 0.5;
    const vy = fwdK > 0 ? -8.5 : fwdK < 0 ? -4.8 : -6.5;
    ch.vel.y = lerp(ch.vel.y, ch.ventT > 0 ? 16 : vy, Math.min(1, dt * 3));
    if (ch.ventT > 0) ch.ventT -= dt;
    const sp = fwdK > 0 ? 16 : fwdK < 0 ? 8 : 13;
    ch.vel.x = lerp(ch.vel.x, wish.x * sp, Math.min(1, dt * 2)); ch.vel.z = lerp(ch.vel.z, wish.z * sp, Math.min(1, dt * 2));
  }
}

// =====================================================================
// Vehicles, launch pads, air vents
// =====================================================================
const vehicles = [];
const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 12); wheelGeo.rotateZ(Math.PI / 2);
function makeVehicleMesh(kind, color) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const wheels = [], windows = [], targets = [];
  if (kind === 'car') {
    addBox(body, 2.0, 0.7, 4.0, 0, 0.75, 0, matC(color, { metalness: 0.35, roughness: 0.35 }));
    // Habitacle creux et six panneaux indépendants, pas un bloc bleu opaque.
    const glass = matC(0xb8e3ee, { transparent: true, opacity: 0.19, metalness: 0.02, roughness: 0.08, depthWrite: false, side: THREE.DoubleSide });
    for (const [name, w, h, d, x, z] of [
      ['pare-brise', 1.68, 0.55, 0.025, 0, -0.77],
      ['lunette arrière', 1.68, 0.55, 0.025, 0, 1.27],
      ['avant gauche', 0.025, 0.55, 0.88, -0.91, -0.25],
      ['arrière gauche', 0.025, 0.55, 0.88, -0.91, 0.75],
      ['avant droite', 0.025, 0.55, 0.88, 0.91, -0.25],
      ['arrière droite', 0.025, 0.55, 0.88, 0.91, 0.75],
    ]) {
      const mesh = addBox(body, w, h, d, x, 1.43, z, glass);
      mesh.name = `car-glass-${name}`; mesh.castShadow = false;
      const pane = { name, mesh, hp: 18, maxHp: 18, broken: false, vehicle: null };
      mesh.userData.vehicleGlass = pane; windows.push(pane);
    }
    for (const x of [-0.88, 0.88]) for (const z of [-0.75, 0.25, 1.25]) addBox(body, 0.08, 0.72, 0.08, x, 1.42, z, matC(color));
    for (const x of [-0.46, 0.46]) {
      addBox(body, 0.66, 0.15, 0.7, x, 1.04, 0.45, matC(0x414b55));
      addBox(body, 0.66, 0.52, 0.14, x, 1.24, 0.83, matC(0x414b55));
    }
    addBox(body, 1.65, 0.18, 0.35, 0, 1.15, -0.52, matC(0x38434b));
    addBox(body, 0.35, 0.08, 0.24, -0.46, 1.33, -0.3, matC(0x202a30));
    addBox(body, 1.84, 0.12, 2.04, 0, 1.78, 0.25, matC(color, { metalness: 0.35, roughness: 0.35 }));
    addBox(body, 2.05, 0.2, 0.3, 0, 0.55, -2.05, matC(0x222228)); addBox(body, 2.05, 0.2, 0.3, 0, 0.55, 2.05, matC(0x222228));
    addBox(body, 0.4, 0.18, 0.08, -0.65, 0.85, -2.02, matC(0xfff6c8, { emissive: 0xfff0a0, emissiveIntensity: 0.8 })); addBox(body, 0.4, 0.18, 0.08, 0.65, 0.85, -2.02, matC(0xfff6c8, { emissive: 0xfff0a0, emissiveIntensity: 0.8 }));
    addBox(body, 0.4, 0.15, 0.08, -0.65, 0.85, 2.02, matC(0xff3030, { emissive: 0xaa0000, emissiveIntensity: 0.6 })); addBox(body, 0.4, 0.15, 0.08, 0.65, 0.85, 2.02, matC(0xff3030, { emissive: 0xaa0000, emissiveIntensity: 0.6 }));
    for (const [x, z] of [[-1, -1.3], [1, -1.3], [-1, 1.3], [1, 1.3]]) { const w = new THREE.Mesh(wheelGeo, matC(0x1d1d22)); w.position.set(x, 0.42, z); w.castShadow = true; g.add(w); wheels.push(w); }
  } else {
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.7, 4.2, 6, 1), matC(color, { roughness: 0.5 }));
    hull.rotation.x = Math.PI / 2; hull.scale.set(1, 1, 0.45); hull.position.y = 0.3; hull.castShadow = true; body.add(hull);
    addBox(body, 1.6, 0.12, 3.2, 0, 0.62, 0.2, matC(0xf2e6d0));
    addBox(body, 0.9, 0.7, 0.9, 0, 1.0, 0.6, matC(0x2b2f36));
    addBox(body, 1.2, 0.5, 0.1, 0, 1.2, -0.5, matC(0x9fd8ff, { roughness: 0.15 }));
    addBox(body, 0.3, 0.5, 0.3, 0, 0.5, 2.2, matC(0x333333));
  }
  g.traverse((m) => { if (m.isMesh && !m.userData.vehicleGlass) targets.push(m); });
  scene.add(g); return { g, body, wheels, windows, targets };
}
function spawnVehicle(kind, x, z, yaw, color = null) {
  const col = color ?? (kind === 'car' ? pick([0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0xff7ab0, 0xffffff]) : pick([0xff6a3d, 0xffd23f, 0x3fa9ff]));
  const m = makeVehicleMesh(kind, col);
  const v = { kind, mesh: m.g, body: m.body, wheels: m.wheels, windows: m.windows, hp: kind === 'car' ? 800 : 600, maxHp: kind === 'car' ? 800 : 600, destroyed: false, pos: new THREE.Vector3(x, kind === 'boat' ? -0.35 : terrainH(x, z), z), yaw, speed: 0, steer: 0, driver: null, col: null, engT: 0 };
  for (const mesh of m.targets) { mesh.userData.vehicle = v; addTarget(mesh); }
  for (const pane of v.windows) { pane.vehicle = v; addTarget(pane.mesh); }
  v.col = addCollider(vehBox(v)); v.col.vehicle = v;
  placeVehicleMesh(v, 0);
  vehicles.push(v); return v;
}
function vehBox(v) {
  const hx = v.kind === 'car' ? 1.1 : 1.2, hz = 2.2;
  const c = Math.abs(Math.cos(v.yaw)), s = Math.abs(Math.sin(v.yaw));
  const rx = hx * c + hz * s, rz = hx * s + hz * c;
  return { type: 'box', minX: v.pos.x - rx, maxX: v.pos.x + rx, minZ: v.pos.z - rz, maxZ: v.pos.z + rz, minY: v.pos.y, maxY: v.pos.y + (v.kind === 'car' ? 1.85 : 1.5) };
}
function updateVehicleHUD() {
  const v = player && player.alive && player.mode === 'drive' && player.vehicle;
  const row = $('vehicleRow'); if (!row) return;
  row.hidden = !v || v.kind !== 'car' || v.destroyed;
  if (row.hidden) return;
  const hp = Math.ceil(v.hp), pct = clamp(hp / v.maxHp * 100, 0, 100);
  $('vehicleFill').style.width = $('vehicleTrail').style.width = pct + '%';
  $('vehicleTxt').innerHTML = `VOITURE ${hp}<small>/${v.maxHp}</small>`;
  row.setAttribute('aria-valuenow', hp); row.setAttribute('aria-valuemax', v.maxHp);
}
function damageVehicleGlass(pane, amount, attacker, point) {
  if (!pane || pane.broken || pane.vehicle.destroyed) return;
  pane.hp = Math.max(0, pane.hp - amount);
  if (pane.hp <= 0) {
    pane.broken = true; pane.mesh.visible = false; removeTarget(pane.mesh);
    const p = point || pane.mesh.getWorldPosition(new THREE.Vector3());
    burst(p, 0xb6ecf4, 12, 4, 0.055, 0.7, 0.65); sfxAt('break', p, 0.35);
  }
  damageVehicle(pane.vehicle, amount * 0.2, attacker, point);
}
function damageVehicle(v, amount, attacker, point) {
  if (!v || v.destroyed || amount <= 0) return;
  v.hp = Math.max(0, v.hp - amount);
  if (point) burst(point, 0xffc46b, 4, 3, 0.06);
  if (v.hp <= 0) {
    v.destroyed = true; v.speed = 0;
    if (v.driver) exitVehicle(v.driver);
    for (const pane of v.windows) { pane.broken = true; pane.mesh.visible = false; removeTarget(pane.mesh); }
    // Ne pas altérer un matériau partagé par d'autres voitures.
    v.body.traverse((m) => { if (m.isMesh && !m.userData.vehicleGlass) m.material = matC(0x41454a, { roughness: 0.95 }); });
    burst(v.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), 0xff9b3d, 28, 7, 0.35, 1, 1.1);
    sfxAt('break', v.pos, 0.9);
  }
  updateVehicleHUD();
}
function placeVehicleMesh(v, dt) {
  v.mesh.position.copy(v.pos); v.mesh.rotation.set(0, v.yaw, 0, 'YXZ');
  if (v.kind === 'car') {
    const fx = -Math.sin(v.yaw), fz = -Math.cos(v.yaw);
    const hf = terrainH(v.pos.x + fx * 1.6, v.pos.z + fz * 1.6), hb = terrainH(v.pos.x - fx * 1.6, v.pos.z - fz * 1.6);
    v.mesh.rotation.x = Math.atan2(hf - hb, 3.2);
    for (const w of v.wheels) w.rotation.x -= v.speed * dt * 2.2;
    v.body.rotation.z = -v.steer * Math.min(1, Math.abs(v.speed) / 20) * 0.06;
  } else {
    v.mesh.position.y += Math.sin(gameT * 2 + v.pos.x) * 0.08;
    v.body.rotation.x = -Math.min(0.15, Math.abs(v.speed) * 0.008); v.body.rotation.z = Math.sin(gameT * 1.6) * 0.04 - v.steer * 0.08;
  }
}
// Spawn cars near POIs on flat land, boats on the coast
{
  let n = 0;
  for (const p of POIS) {
    if (n >= 8) break;
    for (let k = 0; k < 20; k++) {
      const a = rand(6.28), r = p.r + rand(2, 10), x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r, h = terrainH(x, z);
      if (h < 2 || Math.abs(terrainH(x + 2, z) - h) > 0.6 || Math.abs(terrainH(x, z + 2) - h) > 0.6) continue;
      queryCols(x, z, 3, tmpCols); if (tmpCols.some((c) => c.maxY > h + 0.3 && x > c.minX - 2.5 && x < c.maxX + 2.5 && z > c.minZ - 2.5 && z < c.maxZ + 2.5)) continue;
      spawnVehicle('car', x, z, rand(6.28)); n++; break;
    }
  }
  let b = 0;
  for (let k = 0; k < 400 && b < 5; k++) {
    const a = (b / 5) * 6.28 + rand(-0.4, 0.4), cr = coastR(Math.cos(a), Math.sin(a)) ;
    const r = rand(ISLAND_R * 0.86, ISLAND_R * 1.05), x = Math.cos(a) * r * OVAL_X, z = Math.sin(a) * r * OVAL_Z, h = terrainH(x, z);
    if (h > -1.6 || h < -5) continue;
    spawnVehicle('boat', x, z, a + Math.PI / 2); b++;
  }
}
function enterVehicle(ch, v) {
  if (ch.vehicle || v.driver || v.destroyed || v.hp <= 0 || !ch.alive) return false;
  v.driver = ch; ch.vehicle = v; ch.mode = 'drive'; ch.mesh.visible = false; ch.vel.set(0, 0, 0);
  if (ch.isPlayer) { setBuildModeOff(); cancelEdit(); sfx('horn', 0.4); showCenter('', IS_TOUCH ? 'Joystick : accélérer, freiner et tourner · AGIR : descendre' : `<kbd>${keyLabel(BIND.forward)}</kbd>/<kbd>${keyLabel(BIND.back)}</kbd> accélérer/freiner · <kbd>${keyLabel(BIND.interact)}</kbd> descendre`, 2.5); }
  updateVehicleHUD(); return true;
}
function exitVehicle(ch) {
  const v = ch.vehicle; if (!v) return;
  v.driver = null; ch.vehicle = null; ch.mode = 'ground';
  const rx = Math.cos(v.yaw), rz = -Math.sin(v.yaw);
  ch.pos.set(v.pos.x + rx * 2.4, Math.max(v.pos.y, terrainH(v.pos.x + rx * 2.4, v.pos.z + rz * 2.4)) + 0.3, v.pos.z + rz * 2.4);
  ch.vel.set(v.speed * -Math.sin(v.yaw) * 0.3, 2, v.speed * -Math.cos(v.yaw) * 0.3); ch.grounded = false; ch.noFall = true;
  ch.mesh.visible = true;
  updateVehicleHUD();
}
function driveVehicle(p, dt) {
  const v = p.vehicle; if (!v) { p.mode = 'ground'; return; }
  const car = v.kind === 'car';
  const thr = down('forward') ? 1 : down('back') ? -1 : 0, st = (down('left') ? 1 : 0) - (down('right') ? 1 : 0);
  const MAX = car ? 26 : 22, ACC = car ? 14 : 10;
  if (thr > 0) v.speed = Math.min(MAX, v.speed + ACC * dt * (v.speed < 0 ? 2.5 : 1));
  else if (thr < 0) v.speed = Math.max(-MAX * 0.4, v.speed - ACC * dt * (v.speed > 0 ? 2.5 : 1));
  else v.speed -= v.speed * Math.min(1, dt * (car ? 1.2 : 0.7));
  if (down('jump') && car) v.speed -= v.speed * Math.min(1, dt * 4); // handbrake
  v.steer = lerp(v.steer, st, Math.min(1, dt * 6));
  v.yaw += v.steer * dt * (car ? 1.9 : 1.3) * clamp(v.speed / 10, -1, 1);
  const nx = v.pos.x - Math.sin(v.yaw) * v.speed * dt, nz = v.pos.z - Math.cos(v.yaw) * v.speed * dt;
  const h = terrainH(nx, nz);
  let ok = Math.hypot(nx, nz) < WORLD_R;
  if (car && h < -0.7) { ok = false; }
  if (!car && h > -0.25) { v.speed *= 1 - Math.min(1, dt * 3); if (h > 0.6) ok = false; }
  if (ok) {
    removeCollider(v.col);
    const nextBox = vehBox(v), dx = nx - v.pos.x, dz = nz - v.pos.z;
    nextBox.minX += dx; nextBox.maxX += dx; nextBox.minZ += dz; nextBox.maxZ += dz;
    queryCols(nx, nz, 3.2, tmpCols);
    for (const c of tmpCols) {
      if (c.type !== 'box' || c.vehicle === v) continue;
      if (nextBox.maxX < c.minX || nextBox.minX > c.maxX || nextBox.maxZ < c.minZ || nextBox.minZ > c.maxZ) continue;
      const gy = car ? h : -0.35;
      if (c.maxY < gy + 0.7 || c.minY > gy + 1.6) continue;
      if (c.tree && c.tree.alive && Math.abs(v.speed) > 3) { c.tree.hp = 1; harvestTree(c.tree, p, false); v.speed *= 0.6; shake = 0.4; continue; }
      ok = false; v.blockedBy = c;
      if (Math.abs(v.speed) > 12) {
        if (c.mesh && c.mesh.userData.struct && !c.indestructible) damageStruct(c.mesh.userData.struct, Math.abs(v.speed) * 8, p);
        shake = 0.8; sfx('break', 0.5);
      }
      break;
    }
  }
  if (ok) { v.pos.x = nx; v.pos.z = nz; v.pos.y = car ? h : -0.35; }
  else { const impact = Math.abs(v.speed); v.speed *= -0.25; if (impact > 7) damageVehicle(v, (impact - 7) * 5, p); }
  removeCollider(v.col);
  v.col = addCollider(vehBox(v)); v.col.vehicle = v;
  if (v.destroyed || p.vehicle !== v) return;
  // run over opponents
  if (Math.abs(v.speed) > 9) for (const c of chars) {
    if (c === p || !c.alive || c.mode !== 'ground' || (c.team !== undefined && c.team === p.team)) continue;
    if (Math.abs(c.pos.x - v.pos.x) < 2 && Math.abs(c.pos.z - v.pos.z) < 2 && Math.abs(c.pos.y - v.pos.y) < 2) { damageChar(c, Math.abs(v.speed) * 2.4, p, false, car ? 'Voiture' : 'Bateau'); c.vel.set(-Math.sin(v.yaw) * v.speed, 8, -Math.cos(v.yaw) * v.speed); }
  }
  placeVehicleMesh(v, dt);
  p.pos.copy(v.pos).y += 0.6; p.vel.set(0, 0, 0); p.grounded = true;
  v.engT -= dt; if (v.engT <= 0) { v.engT = 0.22; sfx('drive', 0.15 + Math.abs(v.speed) / MAX * 0.35); }
  if (!car && Math.abs(v.speed) > 6 && MR() < dt * 30) burst(_v1.set(v.pos.x + Math.sin(v.yaw) * 2, 0.1, v.pos.z + Math.cos(v.yaw) * 2), 0xffffff, 1, 2.5, 0.18, 0.6, 0.6);
  if (car && Math.abs(v.speed) > 14 && MR() < dt * 12) burst(_v1.set(v.pos.x + Math.sin(v.yaw) * 2, v.pos.y + 0.2, v.pos.z + Math.cos(v.yaw) * 2), 0xc8b088, 1, 1.5, 0.2, 0.3, 0.6);
}
// Launch pads (trampolines) and air vents (chimneys)
const pads = [], vents = []; // vents reste vide (colonnes d'air retirées)
const padTop = matC(0x3fa9ff, { emissive: 0x1a5fd6, emissiveIntensity: 0.5 }), padBase = matC(0xffd23f);
function placePad(x, z) {
  const h = terrainH(x, z); if (h < 2) return null;
  if (Math.abs(x) < 34 && Math.abs(z) < 24) return null; // empreinte de l'Agence (agrandie)
  queryCols(x, z, 2, tmpCols); if (tmpCols.some((c) => c.maxY > h + 0.3 && x > c.minX - 1.6 && x < c.maxX + 1.6 && z > c.minZ - 1.6 && z < c.maxZ + 1.6)) return null;
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.3, 16), padBase); base.position.y = 0.15; base.castShadow = true;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.12, 16), padTop); top.position.y = 0.34;
  g.add(base, top); g.position.set(x, h, z); scene.add(g);
  const pad = { x, z, y: h + 0.4, top, bounce: 0 }; pads.push(pad);
  propBox(x, h, z, 1.35, 1.35, 0.4); // socle solide (marchable, 40 cm, rayon 1,35 comme le modèle)
  return pad;
}
{
  // Les colonnes d'air (cheminées) ont été retirées : il ne reste que les trampolines.
  const spots = [];
  for (const p of POIS) spots.push([p.x + rand(-p.r * 0.5, p.r * 0.5), p.z + rand(-p.r * 0.5, p.r * 0.5)]);
  for (const p of POIS) spots.push([p.x + rand(-p.r, p.r), p.z + rand(-p.r, p.r)]);
  for (let i = 0; i < 14; i++) { const a = rand(6.28), r = rand(30, ISLAND_R * 0.7); spots.push([Math.cos(a) * r * OVAL_X, Math.sin(a) * r * OVAL_Z]); }
  spots.forEach(([x, z], i) => { if (i % 2 === 0) placePad(x, z); });
}
function updateMovers(ch, dt) {
  if (ch.mode !== 'ground' && ch.mode !== 'glide' && ch.mode !== 'fall') return;
  for (const p of pads) {
    if (ch.mode !== 'ground') break;
    const dx = ch.pos.x - p.x, dz = ch.pos.z - p.z;
    if (dx * dx + dz * dz < 1.4 && Math.abs(ch.pos.y - p.y) < 0.7) {
      ch.vel.y = 30; ch.grounded = false; ch.mode = 'fall'; ch.launchT = 0.8; ch.noFall = true; p.bounce = 1;
      if (ch.isPlayer) { sfx('boing', 0.8); setBuildModeOff(); cancelEdit(); } else sfxAt('boing', ch.pos, 0.8);
      if (!ch.isPlayer) ch.dropTarget = randomLandPoint(storm.phase >= 0 ? storm.nx : ch.pos.x, storm.phase >= 0 ? storm.nz : ch.pos.z, 40);
    }
  }
}
function updatePadsVents(dt) {
  for (const p of pads) { if (p.bounce > 0) p.bounce = Math.max(0, p.bounce - dt * 3); p.top.position.y = 0.34 + Math.sin(p.bounce * 12) * p.bounce * 0.25; }
}

// =====================================================================
// POI espions (thème Chapitre 2 Saison 2) : QG, coffres-forts,
// cabines de déguisement. Les hommes de main et boss sont spawnés
// dans startGame() — ils ne comptent pas dans les joueurs restants.
// =====================================================================
const vaults = [], booths = [];
const SPY_STAFF = {
  agency: { boss: 'Midas', skin: 'midas', weapon: 'drum', hp: 550, shield: 350, hench: 4 },
  shark: { boss: 'Skye', skin: 'skye', weapon: 'scar', hp: 450, shield: 300, hench: 3 },
  yacht: { boss: 'Meowscles', skin: 'meowscles', weapon: 'heavyar', hp: 500, shield: 300, hench: 3 },
  grotto: { boss: 'Brutus', skin: 'brutus', weapon: 'minigun', hp: 600, shield: 350, hench: 4 },
  rig: { boss: 'TNTina', skin: 'tntina', weapon: 'boombow', hp: 450, shield: 300, hench: 3 },
};
// Cherche un emplacement libre pour un coffre-fort (évite bâtiments et structures)
function vaultSpot(p) {
  for (let i = 0; i < 16; i++) {
    const a = rand(6.28), d = p.r * (i < 8 ? 0.55 : 0.8);
    const vx = p.x + Math.cos(a) * d, vz = p.z + Math.sin(a) * d;
    const h = Math.max(terrainH(vx, vz), 2.4);
    queryCols(vx, vz, 5, tmpCols);
    if (tmpCols.some((c) => c.alive && c.maxY > h + 0.3 && c.minX < vx + 3.5 && c.maxX > vx - 3.5 && c.minZ < vz + 3.5 && c.maxZ > vz - 3.5)) continue;
    return { x: vx, z: vz };
  }
  return { x: p.x + p.r * 0.55, z: p.z };
}
function buildVault(p, at, style) {
  let vx, vz, vy;
  if (at) { vx = at.x; vz = at.z; vy = at.y; }
  else { const s = vaultSpot(p); vx = s.x; vz = s.z; vy = Math.max(terrainH(vx, vz), 2.4); }
  curHouse = { boxes: [], deco: [], mesh: null };
  const wallM = matC(0xd0d4da, { metalness: 0.0, roughness: 0.65 }); // gris clair mat (plus de noir/acier sombre)
  makeStructBox(vx, vy - 0.35, vz, 7, 0.4, 7, wallM, { indestructible: true });
  makeStructBox(vx, vy, vz - 3.3, 7, 4, 0.6, wallM, { indestructible: true });
  makeStructBox(vx - 3.3, vy, vz, 0.6, 4, 7, wallM, { indestructible: true });
  makeStructBox(vx + 3.3, vy, vz, 0.6, 4, 7, wallM, { indestructible: true });
  makeStructBox(vx, vy + 4, vz, 7.4, style === 'agency' ? 0.95 : 0.6, 7.4, wallM, { indestructible: true }); // Agence : plafond affleurant sous la dalle du RDC (8,6)
  makeStructBox(vx - 2.4, vy, vz + 3.3, 2.6, 4, 0.6, wallM, { indestructible: true });
  makeStructBox(vx + 2.4, vy, vz + 3.3, 2.6, 4, 0.6, wallM, { indestructible: true });
  let door;
  if (style === 'agency') {
    // PORTE CIRCULAIRE DORÉE (icône de l'Agence de Fortnite) : gros disque doré
    // à rayons monté sur la face du mur, groupe scène + collider dédié —
    // openVault la retire proprement (removeCollider + scene.remove)
    const dGrp = new THREE.Group();
    const goldM = matC(0xffc400, { metalness: 0.4, roughness: 0.4, emissive: 0xd9a400, emissiveIntensity: 0.85 });
    const doorL = new THREE.PointLight(0xffd76e, 12, 14); doorL.position.set(vx, vy + 2.4, vz + 5.2); scene.add(doorL); // éclaire la porte depuis l'avant
    const rim = new THREE.Mesh(CYL_GEO, matC(0xb4bac2, { metalness: 0.1, roughness: 0.5 })); rim.scale.set(4.4, 0.7, 4.4); rim.rotation.x = Math.PI / 2; rim.position.set(0, 1.85, 0); dGrp.add(rim);
    const face = new THREE.Mesh(CYL_GEO, goldM); face.scale.set(3.8, 0.5, 3.8); face.rotation.x = Math.PI / 2; face.position.set(0, 1.85, 0.45); dGrp.add(face);
    const hub = new THREE.Mesh(CYL_GEO, matC(0xb4bac2, { metalness: 0.1, roughness: 0.5 })); hub.scale.set(1.1, 0.8, 1.1); hub.rotation.x = Math.PI / 2; hub.position.set(0, 1.85, 0.6); dGrp.add(hub);
    for (let k = 0; k < 4; k++) { const sp = new THREE.Mesh(BOX, goldM); sp.scale.set(0.45, 3.3, 0.55); sp.position.set(0, 1.85, 0.6); sp.rotation.z = k * Math.PI / 4; dGrp.add(sp); } // rayons en relief devant la face
    dGrp.position.set(vx, vy, vz + 3.35); dGrp.traverse((m) => { m.castShadow = true; }); scene.add(dGrp);
    door = addCollider({ type: 'box', minX: vx - 1.4, maxX: vx + 1.4, minY: vy, maxY: vy + 3.7, minZ: vz + 3.05, maxZ: vz + 4.4 }); // couvre toute la porte décalée (face + moyeu)
    door.mesh = dGrp; door.indestructible = true; door.hp = door.maxHp = 9999; // (alive: true par addCollider)
  } else {
    door = makeStructBox(vx, vy, vz + 3.3, 2.2, 3.6, 0.5, matC(0xffc400, { metalness: 0.75, roughness: 0.25 }), { indestructible: true });
  }
  // bandeau lumineux + terminal de scan au-dessus de la porte
  hdeco(BOX, 0xffc400, vx, vy + 3.75, vz + 3.6, 2.4, 0.18, 0.12, 0, 0, 0, null);
  const term = new THREE.Group();
  addBox(term, 0.5, 0.9, 0.4, 0, 0.45, 0, matC(0xb4bac2, { metalness: 0.1, roughness: 0.5 }));
  addBox(term, 0.3, 0.2, 0.06, 0, 0.75, 0.21, matC(0x39ff88, { emissive: 0x39ff88, emissiveIntensity: 1.2 })); // écran côté sud : visible en arrivant de la salle
  term.position.set(vx + 2.1, vy + 1.2, vz + 3.9); scene.add(term);
  const c1 = spawnChest(vx - 1.4, vy + 0.05, vz - 1.2); c1.vault = true;
  const c2 = spawnChest(vx + 1.4, vy + 0.05, vz - 1.2); c2.vault = true;
  ammoBoxes.push(spawnAmmoBox(vx, vy + 0.05, vz - 2.4));
  lootSpots.push({ x: vx, y: vy + 0.6, z: vz + 1 });
  // le grappin de Skye attend dans le coffre-fort du Requin
  if (p.key === 'shark') { const gw = { kind: 'weapon', id: 'grapple', rarity: 5, mag: 0 }; gw.mag = magOf(gw); spawnLoot(gw, vx + 0.8, vy + 0.6, vz + 1.4, false); }
  const H = curHouse; curHouse = null; finishHouse(H);
  const v = { poi: p, x: vx, y: vy, z: vz, door, open: false };
  vaults.push(v); c1.vaultRef = v; c2.vaultRef = v;
}
function buildPhoneBooth(p, at) {
  let bx, bz, by;
  if (at) { bx = at.x; bz = at.z; by = at.y; }
  else {
    let ok = false;
    for (let i = 0; i < 16 && !ok; i++) {
      const a = rand(6.28), d = p.r * (i < 8 ? 0.75 : 0.9);
      bx = p.x + Math.cos(a) * d; bz = p.z + Math.sin(a) * d;
      by = Math.max(terrainH(bx, bz), 2.4);
      queryCols(bx, bz, 3, tmpCols);
      ok = !tmpCols.some((c) => c.alive && c.maxY > by + 0.3 && c.minX < bx + 1.2 && c.maxX > bx - 1.2 && c.minZ < bz + 1.2 && c.maxZ > bz - 1.2);
    }
  }
  const g = new THREE.Group();
  addBox(g, 1.2, 2.6, 1.2, 0, 1.3, 0, matC(0x8f1d1d, { roughness: 0.6 }));
  addBox(g, 0.06, 2.0, 0.06, -0.5, 1.4, -0.55, matC(0xd8dde2, { metalness: 0.7 }));
  addBox(g, 0.06, 2.0, 0.06, 0.5, 1.4, -0.55, matC(0xd8dde2, { metalness: 0.7 }));
  addBox(g, 1.06, 0.3, 1.06, 0, 2.62, 0, matC(0x6e1414));
  addBox(g, 0.86, 0.6, 0.04, 0, 1.9, -0.61, matC(0x9fd8ff, { transparent: true, opacity: 0.4, roughness: 0.1 }));
  addBox(g, 0.86, 0.6, 0.04, 0, 1.2, -0.61, matC(0x9fd8ff, { transparent: true, opacity: 0.4, roughness: 0.1 }));
  addBox(g, 0.9, 0.22, 0.06, 0, 2.45, -0.62, matC(0xffd23f, { emissive: 0xffd23f, emissiveIntensity: 0.5 }));
  g.position.set(bx, by, bz); scene.add(g);
  const col = addCollider({ type: 'box', minX: bx - 0.65, maxX: bx + 0.65, minZ: bz - 0.65, maxZ: bz + 0.65, minY: by, maxY: by + 2.9 });
  col.indestructible = true;
  booths.push({ x: bx, y: by, z: bz, mesh: g, col });
}
const AGENCY_PAL = { wall: 0xe0ded6, trim: 0xffc400, accent: 0xffc400 };
// ---- La Grotte : matériau rocheux dédié + petit batcher (collider invisible +
// roches fusionnées en un seul maillage, mouchetures procédurales par pixel)
const CAVE_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97 });
CAVE_MAT.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', `#include <common>
      varying vec3 vWP;
      float crHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float crNoise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(crHash(i), crHash(i + vec2(1.0, 0.0)), f.x), mix(crHash(i + vec2(0.0, 1.0)), crHash(i + vec2(1.0, 1.0)), f.x), f.y);
      }`)
    .replace('#include <color_fragment>', `#include <color_fragment>
      // strates et mouchetures de la roche, plus sombre dans les anfractuosités
      float strat = crNoise(vec2(vWP.x + vWP.z, vWP.y * 1.7) * 0.55);
      float mott = crNoise(vWP.xz * 1.3 + vWP.y * 0.8) * 0.6 + crNoise(vWP.xz * 3.1 + 9.0) * 0.4;
      diffuseColor.rgb *= 0.78 + strat * 0.3 + (mott - 0.5) * 0.18;
      diffuseColor.rgb *= 0.9 + 0.1 * smoothstep(0.25, 0.9, crNoise(vWP.xz * 0.22 + 31.0));`);
};
const CAVE_HIDDEN = new THREE.MeshStandardMaterial({ visible: false });
const grottoGeos = [];
let grottoWaterfallTex = null, grottoPoolPos = null, grottoSkullBounds = null;
function gdeco(geo, hex, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
  _de.set(rx, ry, rz, 'XYZ'); _dq.setFromEuler(_de);
  _dm.compose(_dp.set(x, y, z), _dq, _ds.set(sx, sy, sz));
  grottoGeos.push({ geo, color: hcol(hex), m: _dm.clone() });
}
// coque rocheuse : collider indestructible invisible + roche visible dans le maillage fusionné
function gshell(x, y, z, w, h, d, hex = 0x5b6472) {
  makeStructBox(x, y, z, w, h, d, CAVE_HIDDEN, { indestructible: true, shadow: false });
  gdeco(BOX, hex, x, y + h / 2, z, w, h, d);
}
let grottoRockMesh = null; // exposé à la QA : raycast vers le haut = « caverne couverte »
function finishGrotto() {
  if (!grottoGeos.length) return;
  const geos = grottoGeos.map((g) => colorize(g.geo.clone().applyMatrix4(g.m), g.color));
  const mesh = new THREE.Mesh(mergeGeometries(geos), CAVE_MAT);
  geos.forEach((x) => x.dispose());
  mesh.castShadow = true; mesh.receiveShadow = true;
  scene.add(mesh);
  grottoRockMesh = mesh;
  grottoGeos.length = 0;
}
// La Plateforme : hauteurs du pont (dessous RIG_DY, dessus RIG_DT) — le POI
// est EN PLEINE MER (plus d'îlot dessous), les pieds s'ancrent sur les fonds.
const RIG_DY = 13.4, RIG_DT = 14.6;
// torchère de La Plateforme : flamme + lumière (animées dans updateWorld)
let rigFlare = null;
// animations vivantes des POI espions (cascade, bateau, bouées, radar,
// projecteurs…) : fonctions (dt, t) appelées depuis updateWorld
const spyFx = [];
function buildSpyPOI(p) {
  if (p.key === 'agency') {
    // ---- L'AGENCE : refonte totale extérieur + intérieur pour coller à
    // l'Agence de Fortnite (Chapitre 2 Saison 2) : grand bâtiment gris-beige
    // clair à bandes dorées, HAUTES FENÊTRES ÉTROITES en niches avec pilastres,
    // portique d'entrée à colonnes sur la façade sud avec fronton et enseigne
    // « THE AGENCY », braseros, tourniquets de sécurité, drapeaux GHOST bleus
    // aux quatre coins du toit, AILES EST/OUEST en retrait (silhouette en
    // gradins comme le vrai bâtiment), statue ATLAS chromée devant l'entrée,
    // HÉLIPAD SURÉLEVÉ au nord-est sur pilotis d'acier avec escalier. INTÉRIEUR
    // : ATRIUM CENTRAL OUVERT DU RDC AU TOIT (le « hollow centre ») en MARBRE
    // CLAIR brillant avec colonnes gris perle et bannières GHOST bleues,
    // statue dorée de Midas agenouillé tenant le globe au-dessus de sa tête
    // dans son bassin lumineux, bureau de Midas (chaise dorée) et salles de
    // réunion aux étages desservis par des ESCALIERS OUVERTS (RDC -> 1er ->
    // 2e -> 3e -> toit). Le COFFRE-FORT est au SOUS-SOL (AGENCY_BASE, voir
    // world.js) derrière la PORTE CIRCULAIRE DORÉE, avec son terminal de scan
    // d'empreinte.
    const A = AGENCY_BASE;
    const BX = p.x, BZ = p.z;                 // centre du bâtiment
    const LV = [9.05, 13.45, 17.85, 22.25, 26.65]; // base de chaque niveau + toit (LV[4], pour le palier de la dernière volée)
    // AGRANDISSEMENT : tout le plan (x, z) du bâtiment, des ailes, de l'hélipad et du parvis
    // est multiplié par K autour du centre (makeStructBox/hdeco/propBox appliquent AGX);
    // les positions posées à la main (lumières, bannières, coffres…) passent par X()/Z().
    const K = AGENCY_K;
    AGX = { k: K, X: (x) => BX + (x - BX) * K, Z: (z) => BZ + (z - BZ) * K };
    const X = AGX.X, Z = AGX.Z;
    // GRIS CLAIR : façade, sols, colonnes et soubassement en gris clair uniforme
    const FH = 4.4, WALL = 0xd6d9de, CORN = 0xb8bdc4, TRIML = 0xe6e9ed, GOLD = 0xffc400, GLASS = 0x27313f;
    const stoneM = () => matC(WALL, { roughness: 0.8 });
    // sol en gris clair brillant (hall et étages — plus aucun noir à l'Agence)
    const floorM = () => matC(0xdcdfe3, { roughness: 0.2, metalness: 0.0 });
    const oStone = { hp: 420, mat: 'stone' };
    curHouse = { boxes: [], deco: [], mesh: null };

    // ---- SOUS-SOL (cave du coffre-fort) : le terrain est creusé jusqu'à
    // 3,45 (world.js). Murs de cave épais (leur face interne affleure le bord
    // de la fouille, aucune bande de terrain ne dépasse), dalle au sol,
    // escalier de 12 marches qui descend du hall, coffre-fort au centre.
    const baseM = matC(0xc4c8ce, { metalness: 0.0, roughness: 0.7 });
    makeStructBox(BX, A.floor, BZ - 10, 26, 8.6 - A.floor, 1.0, baseM, { indestructible: true }); // mur nord
    makeStructBox(BX, A.floor, BZ + 10, 26, 8.6 - A.floor, 1.0, baseM, { indestructible: true }); // mur sud
    makeStructBox(BX - 13, A.floor, BZ, 1.0, 8.6 - A.floor, 20, baseM, { indestructible: true }); // mur ouest
    makeStructBox(BX + 13, A.floor, BZ, 1.0, 8.6 - A.floor, 20, baseM, { indestructible: true }); // mur est
    // dalle du sol de la cave (dessus à 3,65 : les marches y arrivent pile)
    makeStructBox(BX, A.floor, BZ, 25, 0.2, 19, matC(0xd2d5da, { metalness: 0.0, roughness: 0.5 }), { indestructible: true });
    // escalier : 12 marches de 0,45 qui descendent vers le nord, à l'ouest du
    // hall (trou dans la dalle du RDC : x -12,5..-8,5, z -9,5..+1)
    const stairM = matC(0xbfc3c9, { metalness: 0.0, roughness: 0.6 });
    for (let i = 0; i < 12; i++) {
      const top = LV[0] - 0.45 * (i + 1);
      makeStructBox(BX - 10.5, top - 0.9, BZ + 1.0 - (i + 0.5) * 0.85, 4, 0.9, 0.85, stairM, { indestructible: true });
      hdeco(BOX, 0x8a939f, BX - 10.5, top + 0.012, BZ + 1.0 - (i + 1) * 0.85 + 0.06, 3.9, 0.024, 0.08);
    }
    // Garde-corps sur le bord du trou, sans fermer son accès au sud.
    makeStructBox(BX - 8.45, LV[0], BZ - 4.3, 0.16, 1.02, 10.4, matC(0x9da9b4), { indestructible: true });
    hdeco(BOX, GOLD, BX - 8.45, LV[0] + 1.08, BZ - 4.3, 0.2, 0.08, 10.4);

    // SOUS-SOL B1 : couloir central/nord dégagé, archives au sud-ouest,
    // sécurité et équipements au sud-est. Les cloisons possèdent de vraies
    // ouvertures et restent sous la dalle du RDC.
    const FY = A.floor + 0.2, CH = 8.6 - FY;
    const partition = (x, z, w, d) => makeStructBox(BX + x, FY, BZ + z, w, CH, d, baseM, { indestructible: true });
    // Archives : entrée centrale de 3,3 m réels.
    partition(-6.95, 2, 3.1, 0.22);
    partition(-1.85, 2, 2.7, 0.22);
    makeStructBox(BX - 4.3, FY + 2.55, BZ + 2, 2.2, CH - 2.55, 0.22, baseM, { indestructible: true });
    partition(0, 5.7, 0.22, 7.6);
    // Local technique : porte à l'ouest, accessible depuis le couloir sud.
    partition(5, 2.5, 0.22, 1.2);
    partition(5, 7.4, 0.22, 4.2);
    makeStructBox(BX + 5, FY + 2.55, BZ + 4.2, 0.22, CH - 2.55, 2.2, baseM, { indestructible: true });
    partition(8.65, 2, 7.3, 0.22);
    // Poteaux alignés sous les colonnes du hall, socles et retombées de poutres.
    for (const x of [-5.5, 5.5]) for (const z of [-3, 3]) {
      if (x > 0 && z < 0) continue; // au nord-est, le mur porteur du coffre prend le relais
      makeStructBox(BX + x, FY, BZ + z, 0.52, CH, 0.52, baseM, { indestructible: true });
      hdeco(BOX, 0x8d99a4, BX + x, FY + 0.1, BZ + z, 0.7, 0.2, 0.7);
    }
    for (const z of [-3, 3]) {
      hdeco(BOX, 0xadb5bf, BX, 8.4, BZ + z, 25, 0.36, 0.5);
      const underside = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0x7e8a98 }));
      underside.position.set(BX, 8.205, Z(BZ + z)); underside.scale.set(25 * K, 0.025, 0.5 * K); scene.add(underside);
    }
    // Plinthes, joints de dalles et bande de guidage vers le coffre.
    for (const z of [-9.45, 9.45]) hdeco(BOX, 0x8997a4, BX, FY + 0.2, BZ + z, 24.8, 0.4, 0.08);
    for (let x = -12; x <= 12; x += 2) hdeco(BOX, 0xb5bec7, BX + x, FY + 0.009, BZ, 0.025, 0.018, 18.8);
    for (let z = -8; z <= 8; z += 2) hdeco(BOX, 0xb5bec7, BX, FY + 0.01, BZ + z, 24.8, 0.02, 0.025);
    for (const [x, z, w, d] of [[-5.8, -8.35, 6.2, 0.12], [-2.8, -5.6, 0.12, 5.6], [2.6, -2.8, 10.8, 0.12]]) hdeco(BOX, GOLD, BX + x, FY + 0.025, BZ + z, w, 0.025, d);
    // Réseaux au plafond : supports et raccords, jamais à hauteur de tête.
    for (const x of [-7.5, 3]) {
      hdeco(BOX, 0x718393, BX + x, 8.04, BZ, 0.16, 0.16, 18.3);
      for (const z of [-8, -4, 0, 4, 8]) hdeco(BOX, 0x505d69, BX + x, 8.29, BZ + z, 0.45, 0.5, 0.12);
    }
    hdeco(BOX, 0x8e9ba8, BX + 9.8, 8.1, BZ + 7.5, 3.5, 0.45, 0.7);
    // Luminaires émissifs fixés au plafond ; les lumières de la cave sont
    // réutilisées plus bas, sans multiplier les sources WebGL.
    for (const [x, z] of [[-10.5, -4], [-4, -5.8], [2, -1], [-4.5, 6.5], [8.8, 5.5]]) {
      hdeco(BOX, 0x64717e, BX + x, 8.46, BZ + z, 1.9, 0.18, 0.55);
      const lamp = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0xe2edff }));
      lamp.name = 'agency-basement-fixture';
      lamp.scale.set(1.7 * K, 0.04, 0.38 * K); lamp.position.set(X(BX + x), 8.34, Z(BZ + z)); scene.add(lamp);
    }
    const bSign = (text, x, y, z, width = 3.6, ry = 0) => {
      const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = Math.round(1024 * 0.68 / (width * K));
      const g = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
      g.fillStyle = '#344655'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffc400'; g.fillRect(0, h * 0.82, w, h * 0.1);
      g.fillStyle = '#f2f6ff'; g.font = `700 ${Math.floor(h * 0.43)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, w / 2, h * 0.43, w * 0.92);
      const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(width * K, 0.68), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
      sign.name = 'agency-basement-sign';
      sign.position.set(X(BX + x), y, Z(BZ + z)); sign.rotation.y = ry; scene.add(sign);
    };
    bSign('B1 · SECURITE', -6, 6.6, -9.43, 4.4);
    bSign('ARCHIVES', -4.1, 6.5, 1.86, 3.5, Math.PI);
    bSign('LOCAL TECHNIQUE', 4.86, 6.5, 4.1, 3.8, -Math.PI / 2);
    bSign('ACCES COFFRE →', 1.5, 6.6, -9.43, 4.8);
    // Archives : rayonnages métalliques, boîtes et classeurs. Les allées
    // restent larges ; aucune pile décorative devant une porte.
    for (const x of [-7.2, -2]) {
      for (const z of [4.4, 7.5]) {
        makeStructBox(BX + x, FY, BZ + z, 1.1, 2.5, 1.8, matC(0x86929d), { hp: 230, mat: 'metal' });
        for (let s = 0; s < 3; s++) {
          hdeco(BOX, 0xc7b28c, BX + x, FY + 0.4 + s * 0.7, BZ + z, 0.95, 0.48, 1.5);
          hdeco(BOX, 0xf2efdf, BX + x, FY + 0.42 + s * 0.7, BZ + z - 0.77, 0.45, 0.12, 0.025);
        }
      }
    }
    for (const x of [7, 9.3, 11.5]) {
      makeStructBox(BX + x, FY, BZ + 8.4, 1.4, 2.6, 1.1, matC(0x647484), { hp: 260, mat: 'metal' });
      for (let s = 0; s < 5; s++) hdeco(BOX, 0x30485b, BX + x, FY + 0.35 + s * 0.43, BZ + 7.82, 1.15, 0.22, 0.05);
    }
    makeStructBox(BX + 10, FY, BZ + 3.1, 3.6, 0.85, 1.05, matC(0x98a4ae), { hp: 250, mat: 'metal' });
    hdeco(BOX, 0x344655, BX + 10, FY + 1.22, BZ + 3.2, 2.2, 0.65, 0.16);
    hdeco(BOX, 0x76b8b4, BX + 10, FY + 1.22, BZ + 3.3, 1.95, 0.47, 0.025);
    // dalle du rez-de-chaussée (8,6 -> 9,05) avec le trou de l'escalier
    // (marbre clair brillant, comme le hall de l'Agence)
    const ceilingM = new THREE.MeshStandardMaterial({ color: 0xb9c2ce, roughness: 1, emissive: 0x748396, emissiveIntensity: 0.45 });
    const rdcSlab = (x, z, w, d) => {
      const c = makeStructBox(BX + x, 8.6, BZ + z, w, 0.45, d, floorM(), oStone);
      // Sous-face neutre : le sol extérieur de l'éclairage hémisphérique
      // ne doit pas teinter le plafond intérieur en vert olive.
      const lining = new THREE.Mesh(BOX, ceilingM);
      lining.name = 'agency-basement-ceiling';
      lining.position.set(X(BX + x), 8.585, Z(BZ + z));
      lining.scale.set(w * K, 0.025, d * K); scene.add(lining);
      c.deco = [lining];
      return c;
    };
    rdcSlab(2.25, 0, 21.5, 20);          // partie est
    rdcSlab(-10.75, 5.5, 4.5, 9);       // bande ouest au sud du trou
    rdcSlab(-10.75, -9.75, 4.5, 0.5);   // bande ouest au nord du trou
    // seuil de la porte : la dalle du RDC s'étend sous l'épaisseur du mur sud
    makeStructBox(BX, 8.6, BZ + 10.375, 6, 0.45, 0.75, stoneM(), { indestructible: true });
    // soubassement (plinth) : terrasse de pierre autour du bâtiment qui masque
    // la pente du terrain entre la fouille du sous-sol et le plateau du POI
    // (le maillage terrain ne peut pas suivre la falaise verticale de la fouille,
    // il interpole sur 3,4 m : sans plinth, cette pente verte entrerait dans la
    // cave et se verrait derrière l'escalier). Le dessus affleure le sol 9,0.
    makeStructBox(BX, A.floor, BZ + 12.25, 28, 9.0 - A.floor, 3.5, stoneM(), { indestructible: true });   // sud
    makeStructBox(BX, A.floor, BZ - 12.25, 28, 9.0 - A.floor, 3.5, stoneM(), { indestructible: true });   // nord
    makeStructBox(BX + 15.25, A.floor, BZ, 3.5, 9.0 - A.floor, 28, stoneM(), { indestructible: true });   // est
    makeStructBox(BX - 15.25, A.floor, BZ, 3.5, 9.0 - A.floor, 28, stoneM(), { indestructible: true });   // ouest

    // ---- MURS DU BÂTIMENT (4 niveaux, façade sud percée de la porte)
    const cN = [], cS = [], cE = [], cW = [];
    for (let f = 0; f < 4; f++) {
      const ly = LV[f];
      // niveau 0 : murs de 1,0 m d'épaisseur, alignés sur les murs de la cave
      // (sinon une fente verticale reste visible depuis le sous-sol, entre le
      // dessus du mur de cave et la face extérieure du mur du bâtiment)
      const th = f === 0 ? 1.0 : 0.5;
      cN[f] = makeStructBox(BX, ly, BZ - 10, 26, FH, th, stoneM(), oStone);
      // murs est/ouest : aux niveaux 0-1 ils sont percés de portes (hauteur 3,2, centrées sur z = +-7,6)
      // qui relient le bloc central aux ailes latérales. Ouest RDC : une seule porte (l'autre ouvrirait
      // sur l'escalier de la cave).
      const sideWall = (sx) => {
        if (f > 1) return makeStructBox(BX + sx * 13, ly, BZ, th, FH, 20, stoneM(), oStone);
        const doors = (sx < 0 && f === 0) ? [7.6] : [-7.6, 7.6];
        let z0 = -10, first = null;
        for (const dz of doors.concat([11.3])) {
          const z1 = dz > 10 ? 10 : dz - 1.3;
          if (z1 > z0 + 0.05) { const b = makeStructBox(BX + sx * 13, ly, BZ + (z0 + z1) / 2, th, FH, z1 - z0, stoneM(), oStone); first = first || b; }
          if (dz < 10) { makeStructBox(BX + sx * 13, ly + 3.2, BZ + dz, th, 1.2, 2.6, stoneM(), oStone); z0 = dz + 1.3; }
        }
        return first;
      };
      cE[f] = sideWall(1);
      cW[f] = sideWall(-1);
      if (f === 0) {
        // façade sud : grande porte centrale (x -3..3) + segments + linteau
        cS[f] = [makeStructBox(BX - 8, ly, BZ + 10, 10, FH, th, stoneM(), oStone), makeStructBox(BX + 8, ly, BZ + 10, 10, FH, th, stoneM(), oStone)];
        makeStructBox(BX, ly + 3.2, BZ + 10, 6, 1.2, th, stoneM(), oStone); // linteau de la porte
      } else cS[f] = [makeStructBox(BX, ly, BZ + 10, 26, FH, th, stoneM(), oStone)];
    }

    // ---- DALLES EN ANNEAU (niveaux 1-3 + toit) : chaque plancher ceinture
    // l'ATRIUM CENTRAL (trou x ±4,5, z ±4, ouvert du RDC au toit — la statue
    // de Midas monte au centre) et est percé du trou de l'escalier qui y
    // arrive. stairSide : côté du trou d'escalier ('E' : x 8..12,75,
    // 'O' : x -12,75..-8 ; trous z -5,5..5,5)
    const ringSlab = (y, stairSide) => {
      // bords affleurants aux murs (faces internes x ±12,75, z ±9,75) : aucune
      // fente sombre ne reste entre dalle et mur
      const mk = (cx, cz, w, d) => makeStructBox(BX + cx, y, BZ + cz, w, 0.45, d, floorM(), oStone);
      if (stairSide === 'E') {
        mk(-8.625, 0, 8.25, 19.5);      // bande ouest (x -12,75..-4,5)
        mk(6.25, 0, 3.5, 19.5);        // bande est intérieure (x 4,5..8)
        mk(10.375, -7.625, 4.75, 4.25); // nord-est (x 8..12,75, z -9,75..-5,5)
        mk(10.375, 7.625, 4.75, 4.25);  // sud-est
      } else {
        mk(8.625, 0, 8.25, 19.5);       // bande est (x 4,5..12,75)
        mk(-6.25, 0, 3.5, 19.5);       // bande ouest intérieure (x -8..-4,5)
        mk(-10.375, -7.625, 4.75, 4.25); // nord-ouest (x -12,75..-8)
        mk(-10.375, 7.625, 4.75, 4.25);  // sud-ouest
      }
      mk(0, -6.875, 9, 5.75);           // nord de l'atrium (x -4,5..4,5, z -9,75..-4)
      mk(0, 6.875, 9, 5.75);            // sud de l'atrium (z 4..9,75)
    };
    ringSlab(LV[1] - 0.45, 'E'); // plancher du 1er (escalier RDC->1er à l'est)
    ringSlab(LV[2] - 0.45, 'O'); // plancher du 2e (escalier 1er->2e à l'ouest)
    ringSlab(LV[3] - 0.45, 'E'); // plancher du 3e (escalier 2e->3e à l'est)
    ringSlab(26.2, 'O');         // dalle de toit (escalier 3e->toit à l'ouest)

    // ---- ESCALIERS OUVERTS (façon Agence) : 4 volées alternées est/ouest,
    // 11 marches de 0,4 + palier d'arrivée qui s'aligne sur la dalle
    // supérieure. sgn -1 : monte vers le nord ; +1 : vers le sud.
    const stairM2 = matC(0xbfc3c9, { metalness: 0.0, roughness: 0.6 });
    const flight = (cx, sgn, f) => {
      for (let i = 0; i < 11; i++) {
        const top = LV[f] + 0.4 * (i + 1);
        makeStructBox(BX + cx, top - 0.9, BZ + sgn * (4.075 - 0.85 * i), 4, 0.9, 0.85, stairM2, { indestructible: true });
      }
      makeStructBox(BX + cx, LV[f + 1] - 0.45, BZ - sgn * 4.925, 4, 0.45, 1.15, stoneM(), oStone); // palier haut
    };
    flight(10.5, -1, 0);  // RDC -> 1er, à l'est, monte vers le sud
    flight(-10.5, 1, 1);  // 1er -> 2e, à l'ouest, monte vers le nord
    flight(10.5, -1, 2);  // 2e -> 3e, à l'est, monte vers le sud
    flight(-10.5, 1, 3);  // 3e -> toit, à l'ouest, monte vers le nord
    // Garde-corps ancrés SUR les dalles, pas dans le vide de l'atrium.
    // Le remplissage est solide ; le toit est protégé lui aussi.
    for (let f = 1; f <= 4; f++) {
      for (const [hx, hz, w, d] of [[0, -4.65, 9.4, 0.12], [0, 4.65, 9.4, 0.12], [-4.65, 0, 0.12, 9.4], [4.65, 0, 0.12, 9.4]]) {
        makeStructBox(BX + hx, LV[f], BZ + hz, w, 0.88, d, matC(0xaeb8c2), { indestructible: true });
        hdeco(BOX, GOLD, BX + hx, LV[f] + 1.02, BZ + hz, w === 0.12 ? 0.16 : w, 0.09, d === 0.12 ? 0.16 : d);
        for (let i = -2; i <= 2; i++) {
          hdeco(BOX, 0xe6e9ed, BX + hx + (w > d ? i * 2.15 : 0), LV[f] + 0.53, BZ + hz + (d > w ? i * 2.15 : 0), 0.14, 1.06, 0.14);
        }
      }
    }

    // ---- FENÊTRES ÉTROITES (comme la vraie Agence) : hautes niches verticales
    // en verre sombre à encadrement or, séparées par des PILASTRES de pierre,
    // avec meneaux dorés (3 panneaux par fenêtre)
    const win = (wall, u, f) => {
      const ly = LV[f], w = wall === 'N' || wall === 'S';
      // niveau 0 : murs de 1,0 m -> fenêtres affleurant la face extérieure
      const off = f === 0 ? (w ? 10.47 : 13.47) : (w ? 10.28 : 13.28);
      const px = w ? BX + u : (wall === 'E' ? BX + off : BX - off);
      const pz = w ? (wall === 'S' ? BZ + off : BZ - off) : BZ + u;
      const sx = w ? 1.15 : 0.14, sz = w ? 0.14 : 1.15;
      const col = (wall === 'N' ? cN : wall === 'S' ? cS : wall === 'E' ? cE : cW)[f];
      const par = Array.isArray(col) ? null : col;
      hdeco(BOX, GLASS, px, ly + 1.95, pz, sx, 3.1, sz, 0, 0, 0, par);
      hdeco(BOX, GOLD, px, ly + 0.5, pz, w ? 1.45 : 0.18, 0.14, w ? 0.18 : 1.45, 0, 0, 0, par); // allège or
      // meneaux : la fenêtre est divisée en 3 panneaux verticaux
      for (const m of [-0.38, 0.38]) {
        hdeco(BOX, WALL, px + (w ? m : 0), ly + 1.95, pz + (w ? 0 : m), w ? 0.06 : 0.14, 3.1, w ? 0.14 : 0.06, 0, 0, 0, par);
      }
    };
    for (let f = 0; f < 4; f++) {
      const usNS = [-10.5, -7, -3.5, 0, 3.5, 7, 10.5], usEW = [-6, -2, 2, 6];
      for (const u of usNS) { if (f === 0 && Math.abs(u) < 3) continue; win('N', u, f); win('S', u, f); }
      if (f > 1) for (const u of usEW) win('E', u, f), win('W', u, f); // niveaux 0-1 : face intérieure des ailes
    }
    // pilastres de pierre entre les fenêtres (rythme de façade de l'Agence)
    for (let f = 0; f < 4; f++) {
      const ly = LV[f];
      for (const u of [-8.75, -5.25, -1.75, 1.75, 5.25, 8.75]) {
        const off = f === 0 ? 10.44 : 10.25;
        hdeco(BOX, WALL, BX + u, ly + FH / 2, BZ - off, 0.55, FH, 0.14);
        hdeco(BOX, WALL, BX + u, ly + FH / 2, BZ + off, 0.55, FH, 0.14);
      }
      for (const u of [-4, 0, 4]) {
        const off = f === 0 ? 13.44 : 13.25;
        hdeco(BOX, WALL, BX + off, ly + FH / 2, BZ + u, 0.14, FH, 0.55);
        hdeco(BOX, WALL, BX - off, ly + FH / 2, BZ + u, 0.14, FH, 0.55);
      }
    }
    // bandes dorées entre les niveaux + corniche du toit
    for (const y of [13.45, 17.85, 22.25, 26.65]) {
      hdeco(BOX, CORN, BX, y - 0.22, BZ + 10.4, 26.8, 0.44, 0.36);
      hdeco(BOX, CORN, BX, y - 0.22, BZ - 10.4, 26.8, 0.44, 0.36);
      hdeco(BOX, CORN, BX + 13.4, y - 0.22, BZ, 0.36, 0.44, 20.8);
      hdeco(BOX, CORN, BX - 13.4, y - 0.22, BZ, 0.36, 0.44, 20.8);
    }
    // parapet du toit
    makeStructBox(BX, 26.65, BZ - 10, 26, 0.8, 0.5, stoneM(), oStone);
    makeStructBox(BX, 26.65, BZ + 10, 26, 0.8, 0.5, stoneM(), oStone);
    makeStructBox(BX + 13, 26.65, BZ, 0.5, 0.8, 20, stoneM(), oStone);
    makeStructBox(BX - 13, 26.65, BZ, 0.5, 0.8, 20, stoneM(), oStone);
    // garde-corps du bord du trou d'atrium, sur le toit : barres claires à liseré or
    for (const [hx, hz, w, d] of [[0, -4.18, 8.36, 0.1], [0, 4.18, 8.36, 0.1], [-4.18, 0, 0.1, 8.36], [4.18, 0, 0.1, 8.36]]) {
      hdeco(BOX, 0x9aa0a8, BX + hx, 27.0, BZ + hz, w, 0.8, d);
      hdeco(BOX, GOLD, BX + hx, 27.42, BZ + hz, w === 0.1 ? 0.14 : w, 0.08, d === 0.1 ? 0.14 : d);
    }

    // ---- COLONNES MASSIVES GRIS PERLE (comme la vraie Agence) : cylindres
    // clairs qui montent de niveau en niveau autour de l'atrium, encadrant
    // le corridor central et la statue — 4 par niveau (RDC et étages 1-3)
    for (let f = 0; f < 4; f++) {
      for (const [cx, cz] of [[-5.5, -3], [5.5, -3], [-5.5, 3], [5.5, 3]]) {
        hdeco(CYL_GEO, 0xb4b8be, BX + cx, LV[f] + FH / 2, BZ + cz, 0.8, FH, 0.8);
        propBox(BX + cx, LV[f], BZ + cz, 0.42, 0.42, FH); // colonne : solide
        hdeco(BOX, WALL, BX + cx, LV[f] + 0.08, BZ + cz, 1.15, 0.16, 1.15); // base
        hdeco(BOX, WALL, BX + cx, LV[f] + FH - 0.08, BZ + cz, 1.15, 0.16, 1.15); // chapiteau
      }
    }

    // ---- LAMBRIS CLAIR BAS (wainscot) le long des murs intérieurs de
    // chaque niveau (deux tons comme la vraie Agence : soubassement gris perle
    // + murs clairs) ; au RDC, la façade sud laisse la porte libre
    for (let f = 0; f < 4; f++) {
      const ly = LV[f];
      hdeco(BOX, 0xbfc3c9, BX, ly + 0.65, BZ - 9.78, 25.4, 1.3, 0.07); // mur nord
      hdeco(BOX, 0xbfc3c9, BX + 12.78, ly + 0.65, BZ, 0.07, 1.3, 19.4); // mur est
      hdeco(BOX, 0xbfc3c9, BX - 12.78, ly + 0.65, BZ, 0.07, 1.3, 19.4); // mur ouest
      if (f === 0) { // segments de part et d'autre de la porte (x -3..3)
        hdeco(BOX, 0xbfc3c9, BX - 7.875, ly + 0.65, BZ + 9.78, 9.75, 1.3, 0.07);
        hdeco(BOX, 0xbfc3c9, BX + 7.875, ly + 0.65, BZ + 9.78, 9.75, 1.3, 0.07);
      } else hdeco(BOX, 0xbfc3c9, BX, ly + 0.65, BZ + 9.78, 25.4, 1.3, 0.07); // mur sud
    }

    // ---- BANNIÈRES GHOST BLEUES suspendues dans l'atrium (niveaux 1-3,
    // comme les étendards bleus de la vraie Agence)
    {
      const bTex = canvasTex((g, s) => {
        g.fillStyle = '#1f3a8a'; g.fillRect(0, 0, s, s);
        g.strokeStyle = '#ffc400'; g.lineWidth = Math.floor(s * 0.035);
        g.strokeRect(s * 0.07, s * 0.05, s * 0.86, s * 0.9);
        // emblème GHOST : spectre arrondi avec deux yeux
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(s / 2, s * 0.42, s * 0.2, Math.PI, 0);
        g.lineTo(s * 0.7, s * 0.62); g.lineTo(s * 0.62, s * 0.56);
        g.lineTo(s * 0.54, s * 0.62); g.lineTo(s * 0.46, s * 0.56);
        g.lineTo(s * 0.38, s * 0.62); g.lineTo(s * 0.3, s * 0.62);
        g.closePath(); g.fill();
        g.fillStyle = '#1f3a8a';
        g.beginPath(); g.arc(s * 0.44, s * 0.4, s * 0.035, 0, 7); g.arc(s * 0.56, s * 0.4, s * 0.035, 0, 7); g.fill();
      }, 128);
      const bMat = new THREE.MeshBasicMaterial({ map: bTex, side: THREE.DoubleSide });
      const banner = (x, y, z, ry) => {
        const b = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 3.3), bMat);
        b.position.set(X(x), y, Z(z)); b.rotation.y = ry; scene.add(b);
      };
      for (let f = 1; f <= 3; f++) {
        const y = LV[f] + 2.4;
        banner(BX, y, BZ - 4.6, 0); banner(BX, y, BZ + 4.6, Math.PI);
        banner(BX - 4.6, y, BZ, Math.PI / 2); banner(BX + 4.6, y, BZ, -Math.PI / 2);
      }
    }

    // ---- DRAPEAUX GHOST bleus aux quatre coins du toit
    for (const [fx, fz] of [[-11.5, -8.5], [11.5, -8.5], [-11.5, 8.5], [11.5, 8.5]]) {
      hdeco(BOX, 0xb2b7bd, BX + fx, 28.65, BZ + fz, 0.22, 4, 0.22);
      propBox(BX + fx, 26.65, BZ + fz, 0.16, 0.16, 4.4);
      hdeco(BOX, 0x1f3a8a, BX + fx + 1.1, 29.9, BZ + fz, 2.2, 1.4, 0.08);
      hdeco(BOX, 0xffffff, BX + fx + 1.1, 29.9, BZ + fz + 0.05, 0.7, 0.7, 0.02);
    }

    // ---- ATRIUM CENTRAL : statue dorée de Midas agenouillé (pose « Atlas » de
    // la vraie Agence : les deux bras tendus portent le globe au-dessus de la
    // tête), dressée dans son bassin rectangulaire lumineux au centre du hall
    // — l'atrium est ouvert du RDC au toit (le « hollow centre » de l'Agence),
    // la statue dépasse du 1er étage.
    {
      // bassin rectangulaire en pierre + eau lumineuse (le socle au milieu)
      hdeco(BOX, 0xa8adb4, BX, LV[0] + 0.35, BZ, 6.2, 0.7, 5.2);
      hdeco(BOX, 0x3fa9ff, BX, LV[0] + 0.71, BZ, 5.7, 0.08, 4.7); // eau : affleure au-dessus de la pierre (9,78 > 9,75)
      propBox(BX, LV[0], BZ, 3.1, 2.6, 0.8); // bassin : solide (bord haut de 0,8 : infranchissable)
      // anneau doré au sol autour du bassin (emblème du hall)
      hdeco(BOX, GOLD, BX, LV[0] + 0.03, BZ, 9.2, 0.06, 8.2);
      // socle blanc à degrés (posé sur le bassin : visible de 9,75 à 10,15)
      hdeco(BOX, 0xe6e8eb, BX, LV[0] + 0.88, BZ, 2.5, 0.25, 2.0);
      hdeco(BOX, 0xe6e8eb, BX, LV[0] + 1.13, BZ, 1.9, 0.25, 1.5);
      propBox(BX, LV[0] + 0.7, BZ, 0.95, 0.75, 0.45); // socle : solide (9,75-10,2)
      // statue (groupe scène, or métallique) : Midas agenouillé portant le
      // globe au-dessus de lui — origine du groupe = dessus du socle (10,15)
      const st = new THREE.Group();
      const gM = matC(0xffc400, { metalness: 0.85, roughness: 0.2 });
      const dM = matC(0x51607a, { metalness: 0.5 });
      addBox(st, 0.45, 0.9, 0.75, -0.42, 0.45, 0.15, gM);  // jambe agenouillée
      addBox(st, 0.45, 0.75, 0.45, 0.28, 0.375, -0.5, gM); // jambe avant pliée
      addBox(st, 1.3, 1.7, 0.7, 0, 1.75, -0.1, gM);        // torse dressé
      const aL = addBox(st, 0.35, 1.6, 0.35, -0.5, 3.1, -0.1, gM); aL.rotation.x = 0.35; // bras gauche vers le globe
      const aR = addBox(st, 0.35, 1.6, 0.35, 0.5, 3.1, -0.1, gM); aR.rotation.x = 0.35;  // bras droit
      addBox(st, 0.55, 0.6, 0.55, 0, 2.9, 0.05, dM);      // tête (costume sombre)
      addBox(st, 0.8, 0.16, 0.8, 0, 3.3, 0.05, gM);       // col du chapeau
      addBox(st, 1.1, 0.12, 1.1, 0, 3.38, 0.05, gM);      // bord du chapeau
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 14), matC(0x3fa9ff, { metalness: 0.3, roughness: 0.25, emissive: 0x0c3555, emissiveIntensity: 0.4 }));
      globe.position.set(0, 4.6, 0); globe.castShadow = true; st.add(globe);
      st.scale.setScalar(K); st.position.set(BX, LV[0] + 1.1, BZ); scene.add(st);
      // un rayon doré au sol au pied de la statue (les mains de Midas)
      hdeco(BOX, GOLD, BX, LV[0] + 0.035, BZ, 2.6, 0.06, 0.5);
      // éclairage de la statue depuis le bassin + projecteurs sous-marins cyan
      const stL = new THREE.PointLight(0xffd76e, 7, 16 * K); stL.position.set(BX, LV[0] + 4.5 * K, BZ); scene.add(stL);
      const uw1 = new THREE.PointLight(0x3fd0ff, 2.5, 7); uw1.position.set(X(BX - 2), LV[0] + 0.5, Z(BZ - 1.4)); scene.add(uw1);
      const uw2 = new THREE.PointLight(0x3fd0ff, 2.5, 7); uw2.position.set(X(BX + 2), LV[0] + 0.5, Z(BZ + 1.4)); scene.add(uw2);
    }

    // ---- INTÉRIEUR : accueil du RDC + aménagement des étages autour de l'atrium
    // tourniquets de sécurité blancs de part et d'autre de la porte (comme
    // l'entrée de la vraie Agence) avec bandeau LED vert
    for (const tx of [-2.6, 2.6]) {
      hdeco(BOX, 0xe6e8eb, BX + tx, LV[0] + 0.55, BZ + 8.3, 0.9, 1.1, 0.55);
      hdeco(BOX, 0x2bd94a, BX + tx, LV[0] + 1.05, BZ + 8.3, 0.7, 0.08, 0.05);
      propBox(BX + tx, LV[0], BZ + 8.3, 0.45, 0.28, 1.1);
    }
    // accueil (banque d'accueil) entre la porte et l'atrium, côté est du hall
    hdeco(BOX, 0x8a8f98, BX + 4.6, LV[0] + 0.5, BZ + 6.6, 3.2, 1.0, 0.9);
    hdeco(BOX, GOLD, BX + 4.6, LV[0] + 0.99, BZ + 6.6, 3.3, 0.08, 1.0);
    propBox(BX + 4.6, LV[0], BZ + 6.6, 1.6, 0.45, 1.0);
    hdeco(BOX, 0x46536e, BX + 4.6, LV[0] + 1.35, BZ + 7.15, 1.4, 0.8, 0.08);
    hdeco(BOX, 0x3fa9ff, BX + 4.6, LV[0] + 1.35, BZ + 7.1, 1.3, 0.7, 0.04);
    // 1er étage : BUREAU DE MIDAS (aile nord, face à l'atrium)
    hdeco(BOX, 0x8a8f98, BX - 1.4, LV[1] + 0.4, BZ - 6.5, 3.2, 0.8, 1.3);
    hdeco(BOX, GOLD, BX - 1.4, LV[1] + 0.79, BZ - 6.5, 3.3, 0.07, 1.4);
    propBox(BX - 1.4, LV[1], BZ - 6.5, 1.6, 0.65, 0.8);
    hdeco(BOX, 0x46536e, BX - 1.4, LV[1] + 1.15, BZ - 7.2, 2.0, 1.1, 0.08); // écran mural
    hdeco(BOX, 0x3fa9ff, BX - 1.4, LV[1] + 1.15, BZ - 7.14, 1.9, 1.0, 0.04);
    hdeco(CYL_GEO, 0x8a8f98, BX - 3.4, LV[1] + 0.3, BZ - 6.5, 0.7, 0.6, 0.7); // fauteuil de Midas
    // 1er étage : SALLE DE RÉUNION (aile sud) — avec la CHAISE DORÉE de Midas
    // à la tête de la table, un coffre doré sur la table et deux lampes
    // suspendues en globes blancs (comme la salle de briefing de la vraie Agence)
    hdeco(BOX, 0xa8adb4, BX + 1.4, LV[1] + 0.36, BZ + 6.4, 3.4, 0.12, 1.5); // plateau
    hdeco(BOX, 0x8a8f98, BX + 1.4, LV[1] + 0.15, BZ + 6.4, 3.0, 0.3, 0.3);   // pied central
    propBox(BX + 1.4, LV[1], BZ + 6.4, 1.7, 0.75, 0.6);
    for (const s of [-1, 1]) hdeco(BOX, 0x9aa1ab, BX + 1.4 + s * 1.1, LV[1] + 0.3, BZ + 5.3, 0.55, 0.6, 0.55); // chaises
    hdeco(BOX, GOLD, BX + 1.4, LV[1] + 1.0, BZ + 6.4, 0.7, 0.5, 0.45);      // coffre doré sur la table
    { const chL = new THREE.PointLight(0xffd76e, 2.5, 6); chL.position.set(X(BX + 1.4), LV[1] + 1.4, Z(BZ + 6.4)); scene.add(chL); }
    // chaise dorée de Midas à la tête sud de la table (l'icône de l'Agence)
    hdeco(CYL_GEO, GOLD, BX + 1.4, LV[1] + 0.3, BZ + 8.2, 0.55, 0.6, 0.55);
    hdeco(BOX, GOLD, BX + 1.4, LV[1] + 1.1, BZ + 8.55, 0.9, 1.0, 0.16);
    hdeco(BOX, GOLD, BX + 1.4, LV[1] + 0.62, BZ + 8.2, 0.8, 0.08, 0.6);
    propBox(BX + 1.4, LV[1], BZ + 8.2, 0.45, 0.4, 1.2);
    // lampes suspendues : globes blancs au bout de tiges gris perle
    for (const gx of [-0.6, 3.4]) {
      hdeco(BOX, 0xb2b7bd, BX + gx, LV[1] + 3.0, BZ + 6.4, 0.05, 1.4, 0.05);
      const gl = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), matC(0xf4f2ea, { emissive: 0xfff4d6, emissiveIntensity: 0.7 }));
      gl.position.set(X(BX + gx), LV[1] + 2.2, Z(BZ + 6.4)); scene.add(gl);
      const gll = new THREE.PointLight(0xfff0c8, 3, 8); gll.position.set(X(BX + gx), LV[1] + 2.2, Z(BZ + 6.4)); scene.add(gll);
    }
    // bancs blancs et jardinières le long des balcons des niveaux 1-3
    for (let f = 1; f <= 3; f++) {
      for (const s of [-1, 1]) {
        hdeco(BOX, 0xe6e8eb, BX + s * 7.5, LV[f] + 0.28, BZ + 8.6, 2.4, 0.55, 0.6); // banc blanc
        propBox(BX + s * 7.5, LV[f], BZ + 8.6, 1.2, 0.3, 0.5);
        hdeco(BOX, 0x8a8f98, BX + s * 7.5, LV[f] + 0.45, BZ + 7.4, 1.4, 0.9, 1.4); // jardinière
        hdeco(BOX, 0x2d5a35, BX + s * 7.5, LV[f] + 1.0, BZ + 7.4, 1.2, 0.5, 1.2); // plante
        propBox(BX + s * 7.5, LV[f], BZ + 7.4, 0.7, 0.7, 0.9);
      }
    }
    // 2e étage : postes d'agents (bureaux + écrans) dans les quatre coins
    for (const [wx, wz] of [[-6, -6.5], [6, -6.5], [-6, 6.5], [6, 6.5]]) {
      hdeco(BOX, 0xa8adb4, BX + wx, LV[2] + 0.4, BZ + wz, 1.8, 0.08, 0.9);
      hdeco(BOX, 0x8a8f98, BX + wx, LV[2] + 0.2, BZ + wz, 1.6, 0.4, 0.7);
      propBox(BX + wx, LV[2], BZ + wz, 0.9, 0.45, 0.8);
      hdeco(BOX, 0x46536e, BX + wx, LV[2] + 0.75, BZ + wz - 0.5, 1.3, 0.7, 0.06);
      hdeco(BOX, 0x3fa9ff, BX + wx, LV[2] + 0.75, BZ + wz - 0.46, 1.2, 0.6, 0.03);
    }
    // 3e étage : salon des agents (canapés + table basse + plantes)
    for (const s of [-1, 1]) {
      hdeco(BOX, 0x4a3826, BX, LV[3] + 0.35, BZ + s * 6.2, 4.4, 0.7, 1.1); // canapé
      propBox(BX, LV[3], BZ + s * 6.2, 2.2, 0.55, 0.7);
      hdeco(CYL_GEO, 0x2d5a35, BX + s * 8, LV[3] + 0.45, BZ + s * 6.2, 1.0, 0.9, 1.0); // plante
      propBox(BX + s * 8, LV[3], BZ + s * 6.2, 0.5, 0.5, 0.9);
    }
    hdeco(BOX, 0x8a8f98, BX, LV[3] + 0.3, BZ + 4.9, 1.6, 0.1, 0.9); // table basse
    propBox(BX, LV[3], BZ + 4.9, 0.8, 0.45, 0.35);

    // caméras de surveillance aux quatre coins du bâtiment
    for (const [cx2, cz2] of [[-12.8, -9.8], [12.8, -9.8], [-12.8, 9.8], [12.8, 9.8]]) {
      hdeco(BOX, 0x46536e, BX + cx2, 12.2, BZ + cz2, 0.5, 0.4, 0.8);
      hdeco(BOX, 0xff1e42, BX + cx2, 12.2, BZ + cz2 + (cz2 > 0 ? 0.42 : -0.42), 0.18, 0.18, 0.18);
    }

    // ---- AILES EST/OUEST (silhouette en gradins comme la vraie Agence) :
    // ailes basses de 2 niveaux collées aux flancs du bloc central, avec
    // toits plats sombres, fenêtres étroites et plaques GHOST dorées
    for (const s of [-1, 1]) {
      const wx = BX + s * 17; // centre d'aile : x ±17 (de 13 à 21)
      makeStructBox(BX + s * 21, 9.0, BZ, 1.0, 8.85, 20, stoneM(), oStone);   // mur extérieur (x ±21)
      makeStructBox(wx, 9.0, BZ - 10, 8, 8.85, 1.0, stoneM(), oStone);   // mur nord
      makeStructBox(wx, 9.0, BZ + 10, 8, 8.85, 1.0, stoneM(), oStone);   // mur sud
      // toit plat sombre (gravier) + corniche dorée
      makeStructBox(wx, 17.4, BZ, 8.5, 0.45, 21, stoneM(), oStone);
      hdeco(BOX, CORN, wx, 17.86, BZ, 8.4, 0.06, 20.9);
      hdeco(BOX, CORN, wx, 17.78, BZ + 10.15, 8.6, 0.4, 0.3);
      hdeco(BOX, CORN, wx, 17.78, BZ - 10.15, 8.6, 0.4, 0.3);
      // fenêtres étroites sur les deux niveaux, face extérieure (x ±21,5)
      for (let f = 0; f < 2; f++) {
        for (const u of [-6, -2, 2, 6]) {
          hdeco(BOX, GLASS, BX + s * 21.53, 11.0 + f * 4.4, BZ + u, 0.14, 3.1, 1.15);
          hdeco(BOX, GOLD, BX + s * 21.53, 9.5 + f * 4.4, BZ + u, 0.18, 0.14, 1.45);
        }
      }
      // plaque GHOST dorée au centre de l'aile
      hdeco(CYL_GEO, GOLD, BX + s * 21.56, 15.6, BZ, 1.1, 0.22, 1.1, 0, 0, Math.PI / 2);
      hdeco(BOX, 0x1f3a8a, BX + s * 21.6, 15.6, BZ, 0.06, 0.7, 0.7);
      // dalle du 1er étage dans l'aile (marbre clair, comme les mezzanines)
      makeStructBox(wx, 13.0, BZ, 7.5, 0.45, 19.5, floorM(), oStone);
      // fenêtres étroites sur les faces sud et nord de l'aile
      for (let f = 0; f < 2; f++) {
        for (const u of [-2.8, 0, 2.8]) {
          for (const zs of [10.53, -10.53]) {
            hdeco(BOX, GLASS, wx + u, 11.0 + f * 4.4, BZ + zs, 1.15, 3.1, 0.14);
            hdeco(BOX, GOLD, wx + u, 9.5 + f * 4.4, BZ + zs, 1.45, 0.14, 0.18);
          }
        }
      }
      // sol du rez-de-chaussée de l'aile (même dalle claire que le hall)
      makeStructBox(wx, 8.6, BZ, 7.5, 0.45, 19.5, floorM(), oStone);
      const wX = (dx) => wx + s * dx; // dx > 0 : vers l'extérieur de l'aile
      const desk = (x, z, ly, rot) => { // bureau + écran + chaise (rot : le bureau court selon z)
        hdeco(BOX, 0xa8adb4, x, ly + 0.8, z, 1.0, 0.08, 2.2);
        hdeco(BOX, 0x8a8f98, x, ly + 0.4, z, 0.9, 0.8, 2.0);
        hdeco(BOX, 0x46536e, x + s * 0.3, ly + 1.25, z, 0.06, 0.7, 1.3);
        hdeco(BOX, 0x3fa9ff, x + s * 0.26, ly + 1.25, z, 0.03, 0.6, 1.2);
        hdeco(BOX, 0x9aa1ab, x - s * 1.0, ly + 0.3, z, 0.55, 0.6, 0.55);
        propBox(x, ly, z, 0.55, 1.1, 0.85);
      };
      if (s < 0) {
        // RDC ouest : ARMURERIE (râteliers d'armes le long du mur, caisses, coffre)
        for (const z of [-6.5, -2.2, 2.2, 6.5]) {
          hdeco(BOX, 0x929aa5, wX(3.4), 9.05 + 1.15, BZ + z, 0.35, 2.3, 3.2);
          for (let k = 0; k < 3; k++) hdeco(BOX, k % 2 ? GOLD : 0x59606b, wX(3.1), 9.05 + 1.0 + k * 0.5, BZ + z, 0.18, 0.12, 2.6);
          propBox(wX(3.4), 9.05, BZ + z, 0.35, 1.6, 2.3);
        }
        for (const [cx, cz] of [[0.5, -8], [0.5, -6.6], [-0.7, -8]]) { hdeco(BOX, 0x6b5a3a, wX(cx), 9.05 + 0.45, BZ + cz, 1.2, 0.9, 1.2); propBox(wX(cx), 9.05, BZ + cz, 0.6, 0.6, 0.9); }
        hdeco(BOX, 0x8a8f98, wX(0), 9.05 + 0.5, BZ + 0.5, 1.6, 1.0, 3.4); propBox(wX(0), 9.05, BZ + 0.5, 0.8, 1.7, 1.0); // table d'équipement
        spawnChest(X(wX(-0.5)), 9.05, Z(BZ + 5));
      } else {
        // RDC est : SALLE DES SERVEURS (deux rangées de baies avec voyants)
        for (const dx of [-1.6, 1.8]) for (const z of [-7.2, -4.4, -1.6, 1.2, 4.0, 6.8]) {
          if (dx < 0 && Math.abs(z) > 6) continue; // dégage les portes
          hdeco(BOX, 0x9aa3ae, wX(dx), 9.05 + 1.3, BZ + z, 1.1, 2.6, 1.9);
          hdeco(BOX, 0x6b7584, wX(dx), 9.05 + 1.3, BZ + z, 1.0, 2.4, 1.8);
          for (let k = 0; k < 4; k++) hdeco(BOX, k % 2 ? 0x3fff8a : 0x3fa9ff, wX(dx) - s * 0.56, 9.05 + 0.6 + k * 0.55, BZ + z, 0.04, 0.12, 1.4);
          propBox(wX(dx), 9.05, BZ + z, 0.55, 0.95, 2.6);
        }
        spawnChest(X(wX(3.2)), 9.05, Z(BZ + 0.2));
      }
      if (s < 0) {
        // 1er ouest : BUREAUX DES AGENTS (quatre postes le long du mur extérieur)
        for (const z of [-6.8, -2.3, 2.3, 6.8]) desk(wX(3.0), BZ + z, 13.45);
        hdeco(BOX, 0x2d5a35, wX(-1.0), 13.45 + 0.45, BZ + 0.0, 1.0, 0.9, 1.0); propBox(wX(-1.0), 13.45, BZ, 0.5, 0.5, 0.9);
      } else {
        // 1er est : SALLE DE BRIEFING (table holographique centrale + banquettes)
        hdeco(BOX, 0x8a8f98, wX(0), 13.45 + 0.4, BZ, 2.8, 0.8, 4.4);
        hdeco(BOX, 0x3fa9ff, wX(0), 13.45 + 0.85, BZ, 2.4, 0.06, 4.0);
        propBox(wX(0), 13.45, BZ, 1.4, 2.2, 0.85);
        for (const z of [-3.6, 3.6]) { hdeco(BOX, 0xe6e8eb, wX(0), 13.45 + 0.3, BZ + z, 2.6, 0.6, 0.7); propBox(wX(0), 13.45, BZ + z, 1.3, 0.35, 0.6); }
        hdeco(BOX, 0x46536e, wX(3.55), 13.45 + 1.8, BZ, 0.08, 1.8, 4.2); hdeco(BOX, 0x3fa9ff, wX(3.5), 13.45 + 1.8, BZ, 0.04, 1.6, 4.0); // écran mural
        const hl = new THREE.PointLight(0x5fb4ff, 3, 8); hl.position.set(X(wX(0)), 14.9, Z(BZ)); scene.add(hl);
      }
      // éclairage intérieur de l'aile
      const wingL = new THREE.PointLight(0xffe0b8, 5, 14 * K); wingL.position.set(X(wx), 15.8, BZ); scene.add(wingL);
    }

    // ---- TOIT DU BLOC CENTRAL : surface gravier sombre + groupes de
    // climatisation + garde-corps déjà en place ; le gravier est découpé
    // selon les rectangles de la dalle annulaire pour laisser OUVERTS le
    // trou de l'atrium (x ±4,5, z ±4) et la sortie de l'escalier ouest
    for (const [cx, cz, w, d] of [[8.625, 0, 8.25, 19.5], [-6.25, 0, 3.5, 19.5], [-10.375, -7.625, 4.75, 4.25], [-10.375, 7.625, 4.75, 4.25], [0, -6.875, 9, 5.75], [0, 6.875, 9, 5.75]]) {
      hdeco(BOX, 0xb2b7bd, BX + cx, 26.71, BZ + cz, w - 0.3, 0.06, d - 0.3);
    }
    for (const [ax, az] of [[8.5, -7], [-8.5, 6], [2, -7.5], [-2, 7.5]]) {
      hdeco(BOX, 0x9aa0a8, BX + ax, 27.15, BZ + az, 1.3, 0.85, 1.05);
      hdeco(CYL_GEO, 0xa8adb4, BX + ax, 27.62, BZ + az, 0.42, 0.14, 0.42);
    }

    // ---- FAÇADE ET SILHOUETTE À LA FORTNITE : pierre rosée de taille, deux grandes tours rondes
    // (bastions) encadrant l'entrée, haute tour ronde centrale, rotondes sur les ailes, podiums
    // en terrasses avec escaliers et balustrades, quai, bassin et sculpture-fontaine devant.
    {
      const g = p.h, ST = WALL;
      const sM = () => matC(ST, { roughness: 0.85 });
      const sb = (x, y, z, w, h, d) => makeStructBox(BX + x, y, BZ + z, w, h, d, sM(), { hp: 600, mat: 'stone', indestructible: true });
      const drum = (cx, cz, r, y0, y1) => { hdeco(CYL_HI, ST, BX + cx, (y0 + y1) / 2, BZ + cz, 2 * r, y1 - y0, 2 * r); propDisc(BX + cx, y0, BZ + cz, r * 0.96, y1 - y0, 12); };
      const ring = (cx, cz, r, y, h = 0.5, grow = 0.45, hex = CORN) => hdeco(CYL_HI, hex, BX + cx, y + h / 2, BZ + cz, 2 * (r + grow), h, 2 * (r + grow));
      const rail = (x0, z0, x1, z1, y, posts = true) => {
        const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.1)), a = Math.atan2(x1 - x0, z1 - z0);
        if (posts) for (let i = 0; i <= n; i++) hdeco(BOX, TRIML, BX + x0 + (x1 - x0) * i / n, y + 0.4, BZ + z0 + (z1 - z0) * i / n, 0.16, 0.8, 0.16);
        hdeco(BOX, TRIML, BX + (x0 + x1) / 2, y + 0.84, BZ + (z0 + z1) / 2, 0.22, 0.1, L, 0, a, 0);
        hdeco(BOX, TRIML, BX + (x0 + x1) / 2, y + 0.1, BZ + (z0 + z1) / 2, 0.2, 0.12, L, 0, a, 0);
      };
      const circRail = (cx, cz, r, y, n = 28, gapA = null) => {
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
          if (gapA && Math.cos((a0 + a1) / 2 - gapA[0]) > gapA[1]) continue;
          rail(cx + Math.sin(a0) * r, cz + Math.cos(a0) * r, cx + Math.sin(a1) * r, cz + Math.cos(a1) * r, y, false);
          hdeco(BOX, TRIML, BX + cx + Math.sin(a0) * r, y + 0.4, BZ + cz + Math.cos(a0) * r, 0.16, 0.8, 0.16);
        }
      };
      // fenêtres hautes et étroites réparties sur un cylindre (angle 0 = vers le sud)
      const slits = (cx, cz, r, y, h, angs, w = 0.8) => {
        for (const a of angs) {
          const px = cx + Math.sin(a) * (r + 0.05), pz = cz + Math.cos(a) * (r + 0.05);
          hdeco(BOX, TRIML, BX + px, y + h / 2, BZ + pz, w + 0.5, h + 0.5, 0.2, 0, a, 0);
          hdeco(BOX, GLASS, BX + px + Math.sin(a) * 0.1, y + h / 2, BZ + pz + Math.cos(a) * 0.1, w, h, 0.2, 0, a, 0);
        }
      };
      const medallion = (cx, cz, r, y, R) => { // écusson GHOST rond sur la face sud d'une tour
        const zf = cz + r + 0.05;
        hdeco(CYL_HI, 0xc9a24a, BX + cx, y, BZ + zf, 2 * R * K, 0.2, 2 * R * K, Math.PI / 2, 0, 0);
        hdeco(CYL_HI, 0x7fa6d9, BX + cx, y, BZ + zf + 0.12, 1.6 * R * K, 0.2, 1.6 * R * K, Math.PI / 2, 0, 0);
        hdeco(CYL_HI, 0xf2eef0, BX + cx, y, BZ + zf + 0.24, 0.9 * R * K, 0.2, 0.9 * R * K, Math.PI / 2, 0, 0);
      };

      // -- bastions ronds de part et d'autre de l'entrée (2 niveaux), terrasse sommitale à balustrade
      for (const sx of [-1, 1]) {
        const cx = sx * 8.6, cz = 11.2, r = 4.7;
        drum(cx, cz, r, g, 17.85);
        ring(cx, cz, r, g, 0.7, 0.35);                  // socle
        ring(cx, cz, r, 13.15, 0.5, 0.4);               // cordon du 1er niveau
        ring(cx, cz, r, 17.35, 0.5, 0.55);              // corniche
        hdeco(CYL_HI, CORN, BX + cx, 17.9, BZ + cz, 2 * (r + 0.1), 0.1, 2 * (r + 0.1)); // dessus
        circRail(cx, cz, r + 0.2, 17.85, 30);           // balustrade sommitale
        slits(cx, cz, r, 14.6, 2.4, [-0.62, 0.62, 1.25, -1.25, 1.9, -1.9]);
        medallion(cx, cz, r, 14.9, 1.3);
      }
      // -- haute tour ronde centrale (sur le toit, côté sud, hors du trou d'atrium)
      {
        const cx = 0, cz = 6.9, r = 2.9;
        drum(cx, cz, r, 26.65, 36.6);
        for (const y of [30.6, 33.9]) ring(cx, cz, r, y, 0.45, 0.35);
        ring(cx, cz, r, 36.1, 0.7, 0.55);
        hdeco(CYL_HI, CORN, BX + cx, 36.65, BZ + cz, 2 * (r + 0.55), 0.1, 2 * (r + 0.55));
        circRail(cx, cz, r + 0.3, 36.6, 20);
        slits(cx, cz, r, 27.6, 2.6, [-0.7, 0, 0.7], 0.7);
        slits(cx, cz, r, 31.3, 2.2, [-0.5, 0.5], 0.7);
        medallion(cx, cz, r, 34.9, 1.15);
        hdeco(BOX, 0xb2b7bd, BX + cx, 40.6, BZ + cz, 0.14, 8, 0.14);             // mât
        propBox(BX + cx, 36.6, BZ + cz, 0.1, 0.1, 8);
        hdeco(BOX, 0x1f3a8a, BX + cx + 1.1, 42.6, BZ + cz, 2.2, 1.5, 0.06);       // drapeau GHOST
        hdeco(BOX, 0xffffff, BX + cx + 1.1, 42.6, BZ + cz + 0.04, 0.7, 0.7, 0.02);
      }
      // -- rotondes sur les toits des ailes
      for (const sx of [-1, 1]) {
        const cx = sx * 17, cz = 0, r = 3.7;
        drum(cx, cz, r, 17.85, 23.3);
        ring(cx, cz, r, 22.8, 0.55, 0.5);
        hdeco(CYL_HI, CORN, BX + cx, 23.35, BZ + cz, 2 * (r + 0.5), 0.1, 2 * (r + 0.5));
        circRail(cx, cz, r + 0.3, 23.3, 22);
        slits(cx, cz, r, 19.3, 3.0, [sx * Math.PI / 2, sx * Math.PI / 2 + 0.6, sx * Math.PI / 2 - 0.6, 0.0, sx * 0.6], 0.8);
        hdeco(BOX, 0xb2b7bd, BX + cx, 26.2, BZ + cz, 0.12, 5.8, 0.12);          // petit mât
        hdeco(BOX, 0x1f3a8a, BX + cx + 0.9, 27.6, BZ + cz, 1.8, 1.1, 0.05);
      }

      // -- PODIUMS EN TERRASSES devant la façade (deux niveaux), séparés par le passage central
      for (const sx of [-1, 1]) {
        const x0 = 6.6, x1 = 31, cxP = sx * (x0 + x1) / 2, wP = x1 - x0;
        sb(cxP, g, 18.7, wP, 3.15, 7.4);                    // podium bas (dessus à 12,15)
        hdeco(BOX, CORN, BX + cxP, g + 3.15 - 0.15, BZ + 22.5, wP + 0.4, 0.3, 0.4);  // coping
        hdeco(BOX, CORN, BX + cxP, g + 0.3, BZ + 22.45, wP + 0.4, 0.6, 0.3);          // plinthe
        sb(sx * 18.2, g + 3.15, 17.0, 12.4, 3.0, 3.6);      // podium haut (dessus à 15,15)
        hdeco(BOX, CORN, BX + sx * 18.2, g + 6.0, BZ + 18.85, 12.8, 0.3, 0.4);
        // balustrades : bord sud du podium bas (hors escalier), bord sud du podium haut, bout extérieur
        rail(sx * 6.9, 22.3, sx * 23.6, 22.3, g + 3.15);
        rail(sx * 28.4, 22.3, sx * 30.8, 22.3, g + 3.15);
        rail(sx * 30.8, 22.3, sx * 30.8, 15.4, g + 3.15);
        rail(sx * 12.2, 18.6, sx * 24.2, 18.6, g + 6.15);
        rail(sx * 24.2, 18.6, sx * 24.2, 15.4, g + 6.15);
        // escalier extérieur : 7 marches, montée vers le nord, depuis le quai
        for (let k = 1; k <= 7; k++) sb(sx * 26, g, 26.9 - (k - 0.5) * 0.7, 4.2, k * 0.45, 0.7);
        for (const dx of [-2.2, 2.2]) {                      // joues + main courante inclinée
          sb(sx * 26 + dx, g, 24.65, 0.45, 1.2, 4.9);
          hdeco(BOX, TRIML, BX + sx * 26 + dx, g + 2.65, BZ + 24.45, 0.2, 0.12, 8.0, Math.atan2(3.15, 7.35), 0, 0);
        }
        // arbres ronds (houppiers vert vif) et buis taillés sur le podium
        for (const [tx, tz, th] of [[sx * 14.5, 19.2, g + 3.15], [sx * 25.5, 17.6, g + 3.15]]) {
          hdeco(CYL_GEO, 0x6b4a2c, BX + tx, th + 1.6, BZ + tz, 0.38, 3.2, 0.38); propBox(BX + tx, th, BZ + tz, 0.3, 0.3, 3.2);
          hdeco(SPH_GEO, 0x6fb83a, BX + tx, th + 4.4, BZ + tz, 4.2, 3.6, 4.2);
          hdeco(SPH_GEO, 0x82c845, BX + tx + 0.7, th + 5.2, BZ + tz - 0.4, 3.0, 2.4, 3.0);
        }
        for (const [bx, bz] of [[sx * 9.2, 19.8], [sx * 21.5, 20.6]]) hdeco(SPH_GEO, 0x3f8f3a, BX + bx, g + 3.15 + 0.7, BZ + bz, 1.5, 1.4, 1.5);
        // bancs bleus aux deux bouts du quai
        for (const ex of [29.5]) {
          hdeco(BOX, 0x2c6fbb, BX + sx * ex, g + 0.5, BZ + 25.2, 1.0, 0.14, 1.9);
          hdeco(BOX, 0x2c6fbb, BX + sx * (ex + 0.4), g + 0.8, BZ + 25.2, 0.14, 0.6, 1.9);
          propBox(BX + sx * ex, g, BZ + 25.2, 0.6, 1.0, 0.8);
        }
      }
      // -- QUAI de pierre claire + chemin d'entrée, jusqu'au bassin
      hdeco(BOX, TRIML, BX, g + 0.03, BZ + 25.6, 62, 0.07, 7.2);
      hdeco(BOX, 0xe0e3e7, BX, g + 0.04, BZ + 17.6, 12.4, 0.07, 14.4);        // allée centrale
      hdeco(BOX, CORN, BX, g + 0.05, BZ + 29.15, 62.4, 0.5, 0.5);             // bord du quai
      rail(-31, 29.1, -5.9, 29.1, g + 0.3); rail(5.9, 29.1, 31, 29.1, g + 0.3);
      // -- BASSIN (eau turquoise) en ellipse devant le quai
      hdeco(CYL_HI, 0x4fb8d0, BX, g + 0.02, BZ + 34, 2 * 26, 0.05, 2 * 7.4);
      // -- SOCLE ROND DE LA FONTAINE qui avance dans l'eau, avec balustrade circulaire
      {
        const cx = 0, cz = 31.2, r = 5.6;
        hdeco(CYL_HI, 0xc9cdd3, BX + cx, g + 0.35, BZ + cz, 2 * r, 0.7, 2 * r);
        propDisc(BX + cx, g, BZ + cz, r * 0.96, 0.7, 12);
        hdeco(CYL_HI, CORN, BX + cx, g + 0.75, BZ + cz, 2 * (r + 0.25), 0.15, 2 * (r + 0.25));
        circRail(cx, cz, r - 0.4, g + 0.7, 26, [Math.PI, 0.9]);                // ouvert côté quai (nord)
        // sculpture chromée : sphère à emblème et deux lames incurvées
        const cM = matC(0xe9ecf1, { metalness: 0.25, roughness: 0.35 });
        const wx2 = X(BX + cx), wz2 = Z(BZ + cz - 0.6), by = g + 0.8;
        const sph = new THREE.Mesh(new THREE.SphereGeometry(1.7 * K * 0.7, 28, 20), cM); sph.position.set(wx2, by + 2.6, wz2); sph.castShadow = true; scene.add(sph);
        for (const sgn of [-1, 1]) {
          const bl = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), cM);
          bl.scale.set(0.38, 3.9, 1.5); bl.position.set(wx2 + sgn * 1.9, by + 3.0, wz2 + 0.1); bl.rotation.set(0, sgn * 0.5, -sgn * 0.28);
          bl.castShadow = true; scene.add(bl);
        }
        const em = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 24), matC(0xf2eef0, { metalness: 0.5, roughness: 0.3 }));
        em.rotation.x = Math.PI / 2; em.position.set(wx2, by + 2.6, wz2 + 1.55 * K * 0.7); scene.add(em);
        propDisc(BX + cx, g + 0.7, BZ + cz - 0.6, 1.3, 5.2, 8);
        const fl2 = new THREE.PointLight(0xbfd8ff, 3.5, 16); fl2.position.set(wx2, by + 4, Z(BZ + cz + 2)); scene.add(fl2);
      }
    }
    { const H = curHouse; curHouse = null; finishHouse(H); }

    // ---- HÉLIPAD SURÉLEVÉ au nord-est (comme la vraie Agence) : plateforme
    // octogonale sombre sur pilotis d'acier avec escalier, feux jaunes de
    // bord, cercle jaune + H, bidons de carburant rouge et blanc
    {
      const HX = BX + 24, HZ = BZ - 19, PT = 11.05; // plateforme : dessus à 11,45 (au-delà de l'aile est, approche libre)
      curHouse = { boxes: [], deco: [], mesh: null };
      // pilotis d'acier + entretoises
      for (const [lx, lz] of [[-3.6, -3.6], [3.6, -3.6], [-3.6, 3.6], [3.6, 3.6]]) {
        makeStructBox(HX + lx, p.h, HZ + lz, 0.5, PT - p.h, 0.5, matC(0x8a8f98, { metalness: 0.4, roughness: 0.5 }), { indestructible: true });
        hdeco(BOX, 0x8a8f98, HX + lx, p.h + 1.1, HZ, 0.18, 0.18, 7.2);
        hdeco(BOX, 0x8a8f98, HX, p.h + 1.1, HZ + lz, 7.2, 0.18, 0.18);
      }
      // plateforme (dessus à 11,45) + surface gravier
      makeStructBox(HX, PT, HZ, 9.5, 0.4, 9.5, matC(0x8a8f98, { metalness: 0.35, roughness: 0.6 }), { indestructible: true });
      hdeco(BOX, 0xb2b7bd, HX, PT + 0.41, HZ, 9.3, 0.04, 9.3);
      // cercle jaune + H (texture canvas)
      const hTex = canvasTex((g, s) => {
        g.fillStyle = '#8d929a'; g.fillRect(0, 0, s, s);
        g.strokeStyle = '#ffc400'; g.lineWidth = Math.floor(s * 0.05);
        g.beginPath(); g.arc(s / 2, s / 2, s * 0.32, 0, 7); g.stroke();
        g.fillStyle = '#ffc400';
        g.font = `bold ${Math.floor(s * 0.5)}px Arial`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('H', s / 2, s / 2);
      }, 256);
      const hDec = new THREE.Mesh(new THREE.PlaneGeometry(6.4 * K, 6.4 * K), new THREE.MeshBasicMaterial({ map: hTex }));
      hDec.rotation.x = -Math.PI / 2; hDec.position.set(X(HX), PT + 0.46, Z(HZ)); scene.add(hDec);
      // garde-corps périmétriques (ouverture au milieu de la face sud pour l'escalier)
      for (const [hx, hz, w, d] of [[0, -4.5, 9.4, 0.1], [-3.15, 4.5, 2.7, 0.1], [3.15, 4.5, 2.7, 0.1], [-4.5, 0, 0.1, 8.2], [4.5, 0, 0.1, 8.2]]) {
        hdeco(BOX, 0x9aa0a8, HX + hx, PT + 0.75, HZ + hz, w, 0.9, d);
        hdeco(BOX, 0x9aa0a8, HX + hx, PT + 0.5, HZ + hz, w, 0.08, d);
      }
      // feux de bord jaunes aux quatre coins
      for (const [ex, ez] of [[-3.9, -3.9], [3.9, -3.9], [-3.9, 3.9], [3.9, 3.9]]) {
        hdeco(BOX, 0xffc400, HX + ex, PT + 0.5, HZ + ez, 0.22, 0.22, 0.22);
        const el = new THREE.PointLight(0xffc400, 1.2, 5); el.position.set(X(HX + ex), PT + 0.8, Z(HZ + ez)); scene.add(el);
      }
      // bidons de carburant rouge et blanc + cage
      hdeco(BOX, 0xb03a2e, HX + 3.1, PT + 0.65, HZ + 3.2, 0.7, 0.8, 0.7);
      hdeco(BOX, 0xe6e8eb, HX + 2.3, PT + 0.65, HZ + 3.2, 0.7, 0.8, 0.7);
      hdeco(BOX, 0x9aa0a8, HX + 2.7, PT + 1.15, HZ + 3.2, 1.8, 0.08, 1.0);
      // ESCALIER D'ACIER : 5 marches qui descendent vers le chemin (au sud)
      for (let i = 0; i < 5; i++) {
        const top = PT + 0.4 - 0.45 * (i + 1);
        makeStructBox(HX, top - 0.45, HZ + 5.4 + i * 0.9, 3.2, 0.45, 0.9, matC(0x8a8f98, { metalness: 0.4, roughness: 0.55 }), { indestructible: true });
      }
      // rampe de l'escalier
      for (const rx of [-1.7, 1.7]) {
        hdeco(BOX, 0x9aa0a8, HX + rx, PT + 0.35, HZ + 7.4, 0.08, 0.75, 5.2);
      }
      // chemin pavé balisé du parvis nord de l'Agence vers l'escalier
      hdeco(BOX, 0xd3d6db, HX, p.h + 0.03, HZ + 10.5, 3.6, 0.06, 5);
      for (const s of [-1, 1]) {
        hdeco(BOX, 0xe6e8eb, HX + s * 2.1, p.h + 0.45, HZ + 10.5, 0.3, 0.9, 4.6);
        hdeco(BOX, 0xe6e8eb, HX + s * 2.1, p.h + 0.75, HZ + 8.0, 0.3, 0.5, 0.3);
        hdeco(BOX, 0xe6e8eb, HX + s * 2.1, p.h + 0.75, HZ + 12.9, 0.3, 0.5, 0.3);
      }
      { const H = curHouse; curHouse = null; finishHouse(H); }
    }

    // ---- STATUE ATLAS CHROMÉE devant l'entrée (comme la vraie Agence) :
    // figure agenouillée portant le globe au-dessus d'elle, au bout du
    // parvis, encadrée de deux arbres taillés et de deux bancs bleus
    {
      curHouse = { boxes: [], deco: [], mesh: null }; // contexte requis par hdeco
      const st2 = new THREE.Group();
      const cM = matC(0xc8ccd4, { metalness: 0.9, roughness: 0.15 });
      const dS = matC(0x51607a, { metalness: 0.4 });
      addBox(st2, 0.5, 1.0, 0.8, -0.45, 0.5, 0.2, cM);   // jambe agenouillée
      addBox(st2, 0.5, 0.8, 0.5, 0.3, 0.4, -0.55, cM);   // jambe avant pliée
      addBox(st2, 1.4, 1.8, 0.75, 0, 1.85, -0.1, cM);    // torse
      const bL = addBox(st2, 0.38, 1.7, 0.38, -0.55, 3.3, -0.1, cM); bL.rotation.x = 0.3;
      const bR = addBox(st2, 0.38, 1.7, 0.38, 0.55, 3.3, -0.1, cM); bR.rotation.x = 0.3;
      addBox(st2, 0.6, 0.65, 0.6, 0, 3.05, 0.05, dS);    // tête
      const globe2 = new THREE.Mesh(new THREE.SphereGeometry(0.95, 20, 14), matC(0x3fa9ff, { metalness: 0.4, roughness: 0.2, emissive: 0x0c3555, emissiveIntensity: 0.5 }));
      globe2.position.set(0, 4.95, 0); globe2.castShadow = true; st2.add(globe2);
      st2.scale.setScalar(0.65 * K);
      st2.position.set(BX, p.h + 0.9, Z(BZ + 23)); scene.add(st2);
      // socle métallique
      hdeco(BOX, 0xa8adb4, BX, p.h + 0.4, BZ + 23, 2.6, 0.8, 2.6);
      propBox(BX, p.h, BZ + 23, 1.3, 1.3, 0.85);
      const st2L = new THREE.PointLight(0xbfd8ff, 4, 12); st2L.position.set(BX, p.h + 4.2 * K, Z(BZ + 23)); scene.add(st2L);
      // deux arbres taillés sur touffes d'herbe + deux bancs bleus incurvés
      for (const tx of [-3.8, 3.8]) {
        hdeco(CYL_GEO, 0x6b4a2c, BX + tx, p.h + 1.2, BZ + 23, 0.22, 2.4, 0.22);
        hdeco(CYL_GEO, 0x2d5a35, BX + tx, p.h + 2.7, BZ + 23, 1.3, 1.4, 1.3);
        hdeco(CYL_GEO, 0x2d5a35, BX + tx, p.h + 3.7, BZ + 23, 0.9, 0.9, 0.9);
        propBox(BX + tx, p.h, BZ + 23, 0.25, 0.25, 3.9);
      }
      for (const bx of [-3.2, 3.2]) {
        hdeco(BOX, 0x2c6fbb, BX + bx, p.h + 0.3, BZ + 20.8, 1.8, 0.12, 0.6);
        hdeco(BOX, 0x2c6fbb, BX + bx, p.h + 0.55, BZ + 21.1, 0.5, 0.5, 0.12);
        hdeco(BOX, 0x2c6fbb, BX + bx, p.h + 0.55, BZ + 20.5, 0.5, 0.5, 0.12);
        propBox(BX + bx, p.h, BZ + 20.8, 0.9, 0.35, 0.5);
      }
      finishHouse(curHouse); curHouse = null;
    }

    // ---- TAPIS ROUGE : du seuil de la porte, sur la terrasse et le quai,
    // jusqu'à la statue Atlas — bordé de doré (visite officielle de l'Agence)
    curHouse = { boxes: [], deco: [], mesh: null };
    hdeco(BOX, 0x8f1d2c, BX, p.h + 0.08, BZ + 16.3, 4, 0.05, 10.7);
    hdeco(BOX, GOLD, BX - 2.1, p.h + 0.09, BZ + 16.3, 0.12, 0.06, 10.7);
    hdeco(BOX, GOLD, BX + 2.1, p.h + 0.09, BZ + 16.3, 0.12, 0.06, 10.7);
    hdeco(BOX, 0x8f1d2c, BX, LV[0] + 0.06, BZ + 6.75, 4, 0.05, 5.5);
    hdeco(BOX, GOLD, BX - 2.1, LV[0] + 0.07, BZ + 6.75, 0.12, 0.06, 5.5);
    hdeco(BOX, GOLD, BX + 2.1, LV[0] + 0.07, BZ + 6.75, 0.12, 0.06, 5.5);

    // ---- PALMIERS de part et d'autre de l'allée d'entrée : troncs inclinés
    // à segments et couronnes de palmes retombantes
    for (const sx of [-1, 1]) {
      const tx = BX + sx * 4.6, tz = BZ + 21.5, ty = p.h;
      hdeco(CYL_GEO, 0x8a6a45, tx, ty + 0.75, tz, 0.24, 1.5, 0.24);
      hdeco(CYL_GEO, 0x8a6a45, tx + sx * 0.18, ty + 2.1, tz, 0.21, 1.3, 0.21);
      hdeco(CYL_GEO, 0x8a6a45, tx + sx * 0.42, ty + 3.35, tz, 0.18, 1.1, 0.18);
      hdeco(CYL_GEO, 0x7a5c3a, tx + sx * 0.42, ty + 3.35, tz, 0.3, 0.25, 0.3);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + sx * 0.4;
        hdeco(BOX, 0x3f8f3a, tx + sx * 0.42 + Math.sin(a) * 1.05, ty + 4.15, tz + Math.cos(a) * 1.05, 0.5, 0.07, 2.4, -0.45, a, 0, null, 'YXZ');
      }
      propBox(tx, ty, tz, 0.3, 0.3, 3.6);
    }

    // ---- VOITURE GHOST de service : même modèle fonctionnel que les autres
    // voitures, donc habitacle creux, vitres cassables et vraie carrosserie.
    {
      const cx = BX + 14, cz = BZ + 26.8, cy = p.h;
      const v = spawnVehicle('car', X(cx), Z(cz), Math.PI / 2, 0x1c2740);
      v.mesh.name = 'agency-service-car';
      // Une bande sur le capot ne bouche pas les fenêtres.
      const stripe = addBox(v.body, 0.12, 0.025, 0.85, 0, 0.985, -1.45, matC(GOLD));
      stripe.userData.vehicle = v; addTarget(stripe);
    }

    // Deux places de service lisibles, sans barrer l'allée centrale ni les
    // escaliers du quai. Peinture et butées reposent sur le dallage existant.
    for (const cx of [BX + 14, BX + 20]) {
      for (const dz of [-1.35, 1.35]) hdeco(BOX, TRIML, cx, p.h + 0.09, BZ + 26.8 + dz, 5, 0.025, 0.07);
      hdeco(BOX, TRIML, cx - 2.5, p.h + 0.09, BZ + 26.8, 0.07, 0.025, 2.7);
      makeStructBox(cx - 2.1, p.h + 0.07, BZ + 26.8, 0.18, 0.16, 1.6, matC(CORN), { indestructible: true });
    }
    // Jardinières maçonnées sur les podiums, à l'écart des trajets des agents.
    for (const sx of [-1, 1]) {
      makeStructBox(BX + sx * 18.2, 15.15, BZ + 17.0, 5.8, 0.5, 1.2, stoneM(), { indestructible: true });
      hdeco(BOX, 0x584d3c, BX + sx * 18.2, 15.67, BZ + 17.0, 5.5, 0.06, 0.95);
      for (let i = -2; i <= 2; i++) hdeco(SPH_GEO, 0x426943, BX + sx * 18.2 + i, 15.95, BZ + 17.0, 1.25, 0.75, 1.0);
    }

    // ---- PARABOLE RADAR sur le toit (angle nord-ouest) : disque incliné
    // qui tourne lentement sur son mât, comme une base en veille
    {
      const rx2 = BX - 10.8, rz2 = BZ - 6.8;
      hdeco(CYL_GEO, 0x8a8f98, rx2, 27.3, rz2, 0.16, 1.3, 0.16);
      const dish2 = new THREE.Group();
      const disc2 = new THREE.Mesh(CYL_GEO, matC(0xe6e8eb, { roughness: 0.35, metalness: 0.35 }));
      disc2.scale.set(1.9, 0.24, 1.9); disc2.position.y = 0.55; disc2.rotation.x = -0.5; dish2.add(disc2);
      const arm2 = new THREE.Mesh(BOX, matC(0x8a8f98)); arm2.scale.set(0.1, 0.85, 0.1); arm2.position.set(0, 0.85, 0.4); dish2.add(arm2);
      dish2.position.set(X(rx2), 28, Z(rz2)); scene.add(dish2);
      spyFx.push((dt, t) => { dish2.rotation.y = t * 0.5; });
    }

    // ---- PROJECTEURS DE VEILLE sur le toit : deux faisceaux bleu pâle qui
    // balaient le ciel en continu, comme une base d'agents en alerte
    for (const [sx, sz, sp] of [[1, -1, 0.35], [-1, 1, -0.28]]) {
      const bx = BX + sx * 10.8, bz = BZ + sz * 6.5;
      hdeco(CYL_GEO, 0x8a8f98, bx, 26.95, bz, 0.5, 0.5, 0.5);
      hdeco(BOX, 0x6b7584, bx, 27.4, bz, 0.55, 0.45, 0.55);
      const head = new THREE.Group();
      const beam = new THREE.Mesh(new THREE.ConeGeometry(2.1, 22, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      beam.position.y = 11; beam.rotation.x = Math.PI; head.add(beam);
      const lens = new THREE.Mesh(BOX, matC(0xdfe8ff, { emissive: 0x9fc4ff, emissiveIntensity: 1.2 }));
      lens.scale.set(0.5, 0.5, 0.5); head.add(lens);
      head.rotation.z = 0.32;
      head.position.set(X(bx), 27.7, Z(bz)); scene.add(head);
      spyFx.push((dt, t) => {
        head.rotation.y = t * sp;
        beam.material.opacity = 0.012 + nightF * 0.095;
        lens.material.emissiveIntensity = 0.3 + nightF * 0.9;
      });
    }

    // ---- EMBLÈME GHOST PEINT SUR LE TOIT : médaillon bleu à l'effigie du
    // spectre, posé sur le gravier au nord (visible en atterrissant)
    {
      const gTex = canvasTex((g2, s) => {
        g2.fillStyle = '#1f3a8a'; g2.beginPath(); g2.arc(s / 2, s / 2, s * 0.48, 0, 7); g2.fill();
        g2.strokeStyle = '#ffc400'; g2.lineWidth = Math.floor(s * 0.04);
        g2.beginPath(); g2.arc(s / 2, s / 2, s * 0.42, 0, 7); g2.stroke();
        g2.fillStyle = '#ffffff';
        g2.beginPath(); g2.arc(s / 2, s * 0.4, s * 0.2, Math.PI, 0);
        g2.lineTo(s * 0.7, s * 0.62); g2.lineTo(s * 0.62, s * 0.56); g2.lineTo(s * 0.54, s * 0.62);
        g2.lineTo(s * 0.46, s * 0.56); g2.lineTo(s * 0.38, s * 0.62); g2.lineTo(s * 0.3, s * 0.62);
        g2.closePath(); g2.fill();
        g2.fillStyle = '#1f3a8a';
        g2.beginPath(); g2.arc(s * 0.44, s * 0.38, s * 0.035, 0, 7); g2.arc(s * 0.56, s * 0.38, s * 0.035, 0, 7); g2.fill();
      }, 256);
      const gPl = new THREE.Mesh(new THREE.PlaneGeometry(6.5 * K, 6.5 * K), new THREE.MeshBasicMaterial({ map: gTex, transparent: true, depthWrite: false }));
      gPl.rotation.x = -Math.PI / 2; gPl.position.set(X(BX - 3), 26.8, Z(BZ - 6.5)); scene.add(gPl);
    }
    finishHouse(curHouse); curHouse = null;

    // ---- enseigne « THE AGENCY » retirée : la façade reste nue, sans affiche

    // ---- éclairage : hall, étages de l'atrium, sous-sol et façade (portée x K)
    const hallL = new THREE.PointLight(0xffe0b8, 10, 26 * K); hallL.position.set(BX, 12, BZ); scene.add(hallL);
    for (let f = 1; f <= 3; f++) {
      const lE = new THREE.PointLight(0xffe0b8, 6, 18 * K); lE.position.set(X(BX + 7), LV[f] + 3, BZ); scene.add(lE);
      const lW = new THREE.PointLight(0xffe0b8, 6, 18 * K); lW.position.set(X(BX - 7), LV[f] + 3, BZ); scene.add(lW);
    }
    // sous-sol : lumière claire sur toute la cave (plus aucun coin sombre)
    for (const [bx2, bz2, rg] of [[0, 0, 24], [-10.5, -4, 18], [10, 2, 18]]) {
      const baseL = new THREE.PointLight(0xf2f6ff, 8, rg * K); baseL.position.set(X(BX + bx2), 8.15, Z(BZ + bz2)); scene.add(baseL);
    }
    const faceL = new THREE.PointLight(0xffe0b8, 8, 20 * K); faceL.position.set(BX, 14, Z(BZ + 16)); scene.add(faceL);

    // ---- COFFRE-FORT AU SOUS-SOL, comme dans la vraie Agence : en entrant par le
    // sud, premier grand couloir sur la DROITE (côté EST), descente d'escalier d'un
    // niveau et porte circulaire dorée au bout. Salle posée dans l'angle nord-est
    // de la cave (la cave est à 3,65 au-dessus de la dalle), porte tournée vers le sud.
    AGX = null; // la salle du coffre-fort garde ses dimensions (coordonnées absolues)
    buildVault(p, { x: BX + 12, y: 3.65, z: BZ - 9.5 }, 'agency');
    // cabine téléphonique de l'agent près du parvis (côté est de la terrasse)
    buildPhoneBooth(p, { x: X(BX + 11.5), y: p.h, z: Z(BZ + 13) });
    // ---- coffres et butin du hall (le reste est dans le coffre-fort)
    spawnChest(X(BX - 6), LV[0] + 0.05, Z(BZ - 4));
    spawnChest(X(BX + 7), LV[0] + 0.05, Z(BZ + 3));
    // ---- coffres des étages : deux par niveau (1er, 2e, 3e), posés à l'écart
    // du mobilier, des colonnes et des trous d'escalier/atrium
    spawnChest(X(BX - 8), LV[1] + 0.05, Z(BZ - 7));
    spawnChest(X(BX + 7.5), LV[1] + 0.05, Z(BZ + 5.5));
    spawnChest(X(BX - 6.25), LV[2] + 0.05, BZ);
    spawnChest(X(BX + 9), LV[2] + 0.05, Z(BZ + 6.5));
    spawnChest(X(BX - 8), LV[3] + 0.05, BZ);
    spawnChest(BX, LV[3] + 0.05, Z(BZ - 8.5));
    ammoBoxes.push(spawnAmmoBox(X(BX + 2), LV[0] + 0.05, Z(BZ - 6)));
    lootSpots.push({ x: BX, y: LV[0] + 0.6, z: Z(BZ - 5) });
    lootSpots.push({ x: X(BX - 8), y: LV[0] + 0.6, z: Z(BZ + 4) });
    lootSpots.push({ x: X(BX - 8), y: LV[1] + 0.6, z: Z(BZ - 7) });
    lootSpots.push({ x: X(BX + 9), y: LV[2] + 0.6, z: Z(BZ + 6.5) });
    lootSpots.push({ x: X(BX - 8), y: LV[3] + 0.6, z: BZ });
  } else if (p.key === 'shark') {
    // ---- LE REQUIN refait : UNE structure combinée. La gueule béante du
    // requin (mini grotte au niveau de l'îlot, coffre + cristaux) est creusée
    // dans la falaise rocheuse, et la GRANDE MAISON — villa blanche à deux
    // étages, balcon, terrasse sur le toit avec piscine et auvent doré —
    // repose directement sur le dos du requin. Entrée par la bouche (sud),
    // puis grand escalier extérieur à l'est qui grimpe sur la falaise.
    curHouse = { boxes: [], deco: [], mesh: null };
    const M = 0xf4f1ea, GL = 0x2c3a4a, DK = 0x3a3f47, GOLD = 0xffc400;
    const R1 = 0x6b7380, R2 = 0x59606c, R3 = 0x7a828e, RD = 0x4a515c;
    const h0 = p.h;                        // sol de l'îlot
    const CLX = p.x, CLZ = p.z - 10;       // centre de la falaise du requin
    const CT = h0 + 5;                     // sommet de la falaise = plancher de la maison
    const HX = CLX, HZ = CLZ;              // maison centrée sur la falaise
    const wallM = matC(M, { roughness: 0.5 });
    const cragGeo = new THREE.IcosahedronGeometry(0.5, 1);
    // Même format indexé que BOX/CYL pour le batch des bâtiments.
    cragGeo.setIndex(Array.from({ length: cragGeo.attributes.position.count }, (_, i) => i));
    // Toutes les barrières suivent les dimensions des dalles et possèdent
    // un remplissage solide. Les lisses décoratives restent batchées.
    const villaRail = (x, z, w, d, y) => {
      makeStructBox(x, y, z, w, 0.9, d, matC(0x80939c), { indestructible: true });
      hdeco(BOX, GOLD, x, y + 1.02, z, w > d ? w : 0.14, 0.08, d > w ? d : 0.14);
      const n = Math.max(1, Math.ceil(Math.max(w, d) / 2));
      for (let i = 0; i <= n; i++) hdeco(BOX, DK, x + (w > d ? (i / n - 0.5) * w : 0), y + 0.52, z + (d > w ? (i / n - 0.5) * d : 0), 0.12, 1.04, 0.12);
    };
    // Vraies baies : murs percés, allèges, linteaux, verre transparent et
    // meneaux. Le vitrage et sa collision disparaissent avec leur support.
    const glassM = matC(0x91bbc8, { transparent: true, opacity: 0.34, roughness: 0.18, metalness: 0.12, depthWrite: false });
    const villaWall = (ax, x, z, len, ly, height, ops) => {
      const side = { ax, x, z, len, out: 1 };
      wallWithOpenings(side, ly, height, 0.4, ops, M, { hp: 380, mat: 'metal' });
      for (const op of ops.filter((o) => o.kind === 'window')) {
        const px = x + (ax === 'x' ? op.u : 0), pz = z + (ax === 'z' ? op.u : 0);
        const gh = op.y1 - op.y0, support = op.lintel;
        const pane = new THREE.Mesh(BOX, glassM);
        pane.name = 'shark-villa-glass';
        pane.scale.set(ax === 'x' ? op.w : 0.08, gh, ax === 'z' ? op.w : 0.08);
        pane.position.set(px, ly + op.y0 + gh / 2, pz);
        scene.add(pane);
        const col = propBox(px, ly + op.y0, pz, ax === 'x' ? op.w / 2 : 0.04, ax === 'z' ? op.w / 2 : 0.04, gh);
        for (const v of [-0.5, 0, 0.5]) hdeco(BOX, GL, px + (ax === 'x' ? v * op.w : 0), ly + op.y0 + gh / 2, pz + (ax === 'z' ? v * op.w : 0), 0.1, gh, 0.1, 0, 0, 0, support);
        for (const y of [op.y0, op.y1]) hdeco(BOX, GL, px, ly + y, pz, ax === 'x' ? op.w + 0.12 : 0.16, 0.12, ax === 'z' ? op.w + 0.12 : 0.16, 0, 0, 0, support);
        spyFx.push(() => { if (!support.alive && pane.visible) { pane.visible = false; removePropCol(col); } });
      }
    };

    // ============ FALAISE DU REQUIN (coquille rocheuse + grotte) ============
    // murs de la coquille (indestructibles) : la grotte est DANS le rocher,
    // la bouche grande ouverte plein sud, face au boss et à l'escalier.
    const shell = (x, z, w, d) => makeStructBox(x, h0 - 0.7, z, w, 5.1, d, matC(R2, { roughness: 0.95 }), { indestructible: true });
    shell(CLX, CLZ - 5, 20, 2);            // dos du requin (nord)
    shell(CLX - 7, CLZ + 2, 2, 12);        // joue ouest
    shell(CLX + 7, CLZ + 2, 2, 12);        // joue est
    shell(CLX - 5.5, CLZ + 7, 5, 2);       // commissure ouest de la bouche
    shell(CLX + 5.5, CLZ + 7, 5, 2);       // commissure est
    // dalle du sommet de la falaise (plancher de la maison + passage devant).
    // Le grand escalier extérieur reste au SUD du bord de dalle (z CLZ+9) :
    // sa marche du haut affleure la dalle, on débouche dessus en marchant
    // tout droit — et aucune marche ne passe sous ce plafond bas.
    makeStructBox(CLX, h0 + 4.4, CLZ + 1, 22, 0.6, 16, matC(R2, { roughness: 0.95 }), { indestructible: true });
    // roches en surplomb pour casser les faces plates du rocher
    hdeco(BOX, R1, CLX - 8, h0 + 2.2, CLZ - 3, 3, 3.4, 3, 0.12, 0.3, 0.18);
    hdeco(BOX, R3, CLX + 8.5, h0 + 3, CLZ + 1, 2.6, 3.8, 2.6, 0.2, -0.25, 0.1);
    hdeco(BOX, R1, CLX - 6, h0 + 1.4, CLZ + 6.4, 2.2, 2.4, 2.2, 0.08, 0.5, 0.24);
    hdeco(BOX, R3, CLX + 5.5, h0 + 1, CLZ - 4.5, 2.4, 2, 2.4, 0.15, -0.4, 0.2);
    // mâchoire inférieure praticable (petit marchepied devant la bouche)
    makeStructBox(CLX, h0 - 0.25, CLZ + 10.75, 12, 0.7, 5.5, matC(R1, { roughness: 0.95 }), { indestructible: true });
    // mâchoire supérieure relevée, béante (déco au-dessus de l'entrée)
    hdeco(cragGeo, R1, CLX, CT + 0.2, CLZ + 12, 13, 1.6, 5.5, -0.12, 0, 0);
    // dents du haut (pointes en bas, accrochées à la mâchoire supérieure)
    for (let t = -3; t <= 3; t++)
      hdeco(PRISM_GEO, 0xfafcff, CLX + t * 1.35, h0 + 4.35 + (1 - Math.abs(t) / 3.6) * 1.15, CLZ + 13.6, 0.9, 1.6, 0.9, Math.PI, 0, 0);
    // dents du bas (plantées sur la mâchoire inférieure)
    // Une vraie entrée piétonne au milieu : plus de dent traversée par le
    // joueur. Les dents latérales sont solides, hors du couloir central.
    for (const t of [-3, -2, 2, 3]) {
      hdeco(PRISM_GEO, 0xfafcff, CLX + t * 1.5, h0 + 0.45, CLZ + 12.6, 0.85, 1.4, 0.85, 0, 0, 0);
      propBox(CLX + t * 1.5, h0 + 0.45, CLZ + 12.6, 0.33, 0.33, 1.1);
    }
    // yeux dorés furieux + narines + ouïes gravées sur les flancs
    hdeco(BOX, 0x111318, CLX - 6.3, h0 + 3.1, CLZ + 8.1, 1.1, 0.7, 1.3, 0, 0.3, 0);
    hdeco(BOX, 0x111318, CLX + 6.3, h0 + 3.1, CLZ + 8.1, 1.1, 0.7, 1.3, 0, -0.3, 0);
    hdeco(BOX, GOLD, CLX - 6.1, h0 + 3.1, CLZ + 8.75, 0.35, 0.3, 0.1, 0, -0.3, 0);
    hdeco(BOX, GOLD, CLX + 6.1, h0 + 3.1, CLZ + 8.75, 0.35, 0.3, 0.1, 0, 0.3, 0);
    hdeco(BOX, RD, CLX - 1.4, h0 + 3.7, CLZ + 8.15, 0.5, 0.3, 0.5, 0, 0, 0.2);
    hdeco(BOX, RD, CLX + 1.4, h0 + 3.7, CLZ + 8.15, 0.5, 0.3, 0.5, 0, 0, -0.2);
    for (const sgn of [-1, 1]) for (let g = 0; g < 3; g++)
      hdeco(BOX, RD, CLX + sgn * 8.15, h0 + 1.6 + g * 0.15, CLZ + 1 + g * 1.1, 0.15, 2.3, 0.7, 0, 0, sgn * 0.5);

    // Massif facetté : les joues et l'arrière relient la tête au terrain.
    // Les volumes n'empiètent ni sur la bouche centrale ni sur l'escalier est.
    for (const [dx, dz, sx, sy, sz] of [[-8.4, -3, 6, 6, 9], [8.4, -3, 5, 5.8, 8], [-7.6, 6, 4.3, 4.9, 5], [7.6, 6, 3.5, 4.9, 5], [-3, -6, 10, 5.4, 5], [4, -6, 9, 5, 5]]) {
      hdeco(cragGeo, R1, CLX + dx, h0 + sy * 0.4, CLZ + dz, sx, sy, sz, 0, dx * 0.07, 0);
    }
    // Sourcils et nez prolongent la silhouette plutôt que de laisser deux
    // yeux plaqués sous une dalle rectangulaire.
    for (const s of [-1, 1]) {
      hdeco(cragGeo, R3, CLX + s * 5.5, h0 + 4.1, CLZ + 9.3, 4.8, 2.0, 5.8, 0.08, s * 0.15, s * 0.15);
      hdeco(cragGeo, R1, CLX + s * 3.4, h0 + 5.3, CLZ + 11, 7, 1.6, 4, -0.15, s * 0.1, 0);
      hdeco(BOX, 0x20252b, CLX + s * 5.6, h0 + 3.15, CLZ + 10.6, 1.3, 0.55, 0.15, 0, s * 0.15, s * 0.13);
      hdeco(BOX, 0xd4a44b, CLX + s * 5.6, h0 + 3.15, CLZ + 10.71, 0.55, 0.24, 0.06);
    }

    // ============ MINI GROTTE (l'intérieur de la gueule) ============
    makeStructBox(CLX, h0 - 0.1, CLZ + 1, 12.4, 0.16, 10.2, matC(RD, { roughness: 0.95 }), { indestructible: true }); // sol de pierre
    // cristaux turquoise et caisses de matériel
    hdeco(PRISM_GEO, 0x9fe8e8, CLX - 4.4, h0 + 0.1, CLZ - 3.2, 0.7, 1.5, 0.7, 0, 0, 0.2);
    hdeco(PRISM_GEO, 0x9fe8e8, CLX - 3.5, h0 + 0.1, CLZ - 3.7, 0.5, 1.0, 0.5, 0, 0, -0.15);
    hdeco(PRISM_GEO, 0x9fe8e8, CLX + 4.5, h0 + 0.1, CLZ - 2.9, 0.6, 1.2, 0.6, 0, 0, 0.25);
    hdeco(BOX, 0x8a6a45, CLX + 4.2, h0 + 0.1, CLZ + 3.4, 1.2, 1.2, 1.2, 0, 0.3, 0);
    hdeco(BOX, 0x8a6a45, CLX + 4.2, h0 + 1.3, CLZ + 3.4, 1.0, 1.0, 1.0, 0, -0.2, 0);
    hdeco(BOX, 0x7a5c3a, CLX - 4.3, h0 + 0.1, CLZ + 3.2, 1.4, 0.8, 0.9, 0, 0.15, 0);
    const caveL = new THREE.PointLight(0x3fd0ff, 3.5, 9); caveL.position.set(CLX, h0 + 2.6, CLZ + 0.5); scene.add(caveL);
    spawnChest(CLX - 1.6, h0 + 0.2, CLZ - 2.6);
    ammoBoxes.push(spawnAmmoBox(CLX + 1.8, h0 + 0.1, CLZ - 2.4));
    lootSpots.push({ x: CLX, y: h0 + 0.6, z: CLZ + 1 });
    { const H = curHouse; curHouse = null; finishHouse(H); }

    // ============ GRANDE MAISON (villa blanche sur le dos du requin) ============
    curHouse = { boxes: [], deco: [], mesh: null };
    // ---- RDC (grand salon) : porte pleine hauteur au sud, baies vitrées
    const bay = (u, w, y0 = 0.65, y1 = 3.35) => ({ u, w, y0, y1, kind: 'window' });
    villaWall('x', HX, HZ - 5.1, 15, CT, 4.2, [bay(-3.5, 4), bay(3.5, 4)]);
    villaWall('x', HX, HZ + 5.1, 15, CT, 4.2, [bay(-4.35, 4.8), { u: 0, w: 2.4, y0: 0, y1: 3.4, kind: 'door' }, bay(4.35, 4.8)]);
    for (const s of [-1, 1]) villaWall('z', HX + s * 7.3, HZ, 10.2, CT, 4.2, [bay(-2.4, 3.2), bay(2.4, 3.2)]);
    hdeco(BOX, GOLD, HX, CT + 4.25, HZ - 5.1, 15, 0.16, 0.16);
    // ---- dalle du 1er avec trémie d'escalier : la trémie couvre TOUTE la
    // montée de l'escalier ouest (z HZ-4.5 .. HZ+3.6), sinon les marches
    // basses passent sous la dalle et son plafond à CT+4.2 éjecte le joueur
    makeStructBox(HX - 7.15, CT + 4.2, HZ, 1.3, 0.4, 10.6, matC(DK), { indestructible: true });
    makeStructBox(HX + 1.95, CT + 4.2, HZ, 11.7, 0.4, 10.6, matC(DK), { indestructible: true });
    makeStructBox(HX - 5.2, CT + 4.2, HZ - 4.6, 2.6, 0.4, 1.4, matC(DK), { indestructible: true });
    makeStructBox(HX - 5.2, CT + 4.2, HZ + 4.45, 2.6, 0.4, 1.7, matC(DK), { indestructible: true });
    // ---- escalier intérieur RDC -> 1er (le long du mur ouest, vers le nord)
    for (let s = 0; s < 11; s++)
      makeStructBox(HX - 5.2, CT, HZ + 3.2 - s * 0.68, 2.4, 0.2 + s * 0.4, 0.75, matC(0xc9c2b4, { roughness: 0.6 }), { indestructible: true });
    // ---- 1er (chambre + bureau) : porte-fenêtre au sud sur le balcon
    villaWall('x', HX, HZ - 4.3, 13, CT + 4.6, 3.4, [bay(-3.2, 3.6, 0.6, 2.8), bay(3.2, 3.6, 0.6, 2.8)]);
    villaWall('x', HX, HZ + 4.3, 13, CT + 4.6, 3.4, [bay(-3.85, 4.1, 0.6, 2.8), { u: 0, w: 2.4, y0: 0, y1: 2.6, kind: 'door' }, bay(3.85, 4.1, 0.6, 2.8)]);
    for (const s of [-1, 1]) villaWall('z', HX + s * 6.3, HZ, 8.6, CT + 4.6, 3.4, [bay(0, 6.4, 0.6, 2.8)]);
    hdeco(BOX, GOLD, HX, CT + 8.05, HZ - 4.3, 13, 0.16, 0.16);
    // ---- balcon en surplomb au sud du 1er
    makeStructBox(HX, CT + 4.2, HZ + 5.8, 13, 0.4, 3, matC(DK), { indestructible: true });
    villaRail(HX, HZ + 7.2, 12.8, 0.12, CT + 4.6);
    for (const s of [-1, 1]) villaRail(HX + s * 6.4, HZ + 5.8, 0.12, 2.8, CT + 4.6);
    // ---- escalier intérieur 1er -> toit : le long du mur EST (il ne peut pas
    // rester empilé au-dessus de l'escalier du RDC : la superposition des deux
    // montées laisserait 1,6 m de plafond et coincerait la tête du joueur)
    for (let s = 0; s < 10; s++)
      makeStructBox(HX + 5, CT + 4.6, HZ + 2.5 - s * 0.68, 2.2, 0.15 + s * 0.4, 0.75, matC(0xc9c2b4, { roughness: 0.6 }), { indestructible: true });
    // ---- dalle du toit avec écoutille au-dessus de l'escalier est
    makeStructBox(HX - 2.05, CT + 8, HZ, 11.5, 0.4, 10.6, matC(DK), { indestructible: true });
    makeStructBox(HX + 7.05, CT + 8, HZ, 1.5, 0.4, 10.6, matC(DK), { indestructible: true });
    makeStructBox(HX + 5, CT + 8, HZ - 4.8, 2.6, 0.4, 1.0, matC(DK), { indestructible: true });
    makeStructBox(HX + 5, CT + 8, HZ + 4.25, 2.6, 0.4, 2.1, matC(DK), { indestructible: true });
    // parapet plein (avec collider) devant la sortie d'escalier : sans lui, on
    // débouche sur le toit en marchant tout droit et on tombe du bord nord
    makeStructBox(HX + 5, CT + 8.4, HZ - 5.1, 2.6, 1.0, 0.25, wallM, { indestructible: true });
    // ---- terrasse sur le toit : piscine, auvent doré, transats, garde-corps
    hdeco(BOX, 0xffffff, HX + 1, CT + 8.45, HZ - 2, 5, 0.3, 3.5);
    hdeco(BOX, 0x9fe0e8, HX + 1, CT + 8.67, HZ - 2, 4.5, 0.22, 3);
    for (const [px2, pz2] of [[-4, 0.5], [2, 0.5], [-4, 4.2], [2, 4.2]]) makeStructBox(HX + px2, CT + 8.4, HZ + pz2, 0.35, 3, 0.35, matC(GOLD, { metalness: 0.6 }), { indestructible: true });
    makeStructBox(HX - 1, CT + 11.4, HZ + 2.35, 7.6, 0.35, 5.4, matC(DK), { indestructible: true });
    hdeco(BOX, GL, HX - 1, CT + 11.95, HZ + 4.9, 6.5, 1.5, 0.1);
    hdeco(BOX, 0x2c3a4a, HX - 2.5, CT + 8.5, HZ + 2.4, 0.8, 0.35, 1.9, 0, 0.3, 0);
    hdeco(BOX, 0x2c3a4a, HX - 0.5, CT + 8.5, HZ + 2.4, 0.8, 0.35, 1.9, 0, -0.2, 0);
    for (const s of [-1, 1]) {
      villaRail(HX, HZ + s * 5.15, 15.1, 0.12, CT + 8.4);
      villaRail(HX + s * 7.55, HZ, 0.12, 10.3, CT + 8.4);
    }
    // ---- aménagement intérieur : salon (RDC) puis chambre et bureau (1er)
    hdeco(BOX, 0xb99e7a, HX + 1, CT + 0.03, HZ + 1, 11, 0.06, 8);       // parquet RDC
    hdeco(BOX, 0x2c3a4a, HX + 1.5, CT + 0.09, HZ + 1.5, 5, 0.04, 3.4);  // tapis
    hdeco(BOX, 0x3a4a5c, HX + 2.6, CT + 0.2, HZ + 1.5, 1.1, 0.75, 4.2); // canapé
    hdeco(BOX, 0x3a4a5c, HX + 2.6, CT + 0.95, HZ - 0.7, 1.1, 1.5, 0.9); // dossier
    hdeco(BOX, 0x2c3a4a, HX + 1.2, CT + 0.45, HZ + 1.5, 1.4, 0.5, 2.4); // table basse
    hdeco(BOX, 0x59606c, HX - 3, CT + 0.1, HZ - 4.6, 2.6, 2.6, 0.7);    // cheminée
    hdeco(BOX, 0x111318, HX - 3, CT + 0.6, HZ - 4.35, 1.4, 1.2, 0.3);
    hdeco(BOX, 0xff8c3a, HX - 3, CT + 0.5, HZ - 4.3, 0.9, 0.5, 0.2);
    hdeco(BOX, 0x6b4a2e, HX + 6.6, CT + 0.1, HZ + 2.5, 0.8, 2.6, 3);    // bibliothèque
    hdeco(BOX, 0x111318, HX + 4.5, CT + 1.5, HZ - 4.75, 3, 1.7, 0.15);  // écran
    const salonL = new THREE.PointLight(0xffd76e, 6, 13); salonL.position.set(HX + 1, CT + 3, HZ); scene.add(salonL);
    const fireL = new THREE.PointLight(0xff8c3a, 4, 7); fireL.position.set(HX - 3, CT + 1, HZ - 3.5); scene.add(fireL);
    hdeco(BOX, 0xb99e7a, HX + 1, CT + 4.63, HZ, 11, 0.06, 8);           // parquet 1er
    hdeco(BOX, 0xf4f1ea, HX + 2.4, CT + 4.7, HZ - 1.5, 2.6, 0.55, 3.6); // lit
    hdeco(BOX, 0x2c3a4a, HX + 2.4, CT + 5.1, HZ - 1.5, 2.4, 0.25, 2.6); // couette
    hdeco(BOX, 0xf4f1ea, HX + 2.4, CT + 5.25, HZ - 2.6, 2.4, 0.2, 0.6); // oreillers
    hdeco(BOX, 0x6b4a2e, HX + 0.5, CT + 4.7, HZ - 2.9, 0.6, 0.5, 0.6);  // chevet
    hdeco(BOX, 0x8a8f98, HX - 2.5, CT + 4.7, HZ - 3, 2.6, 0.75, 1.1);   // bureau
    hdeco(BOX, 0x111318, HX - 2.5, CT + 5.5, HZ - 3.9, 2.2, 1.3, 0.1);  // écran du bureau
    hdeco(BOX, 0x6b4a2e, HX - 2.5, CT + 5.35, HZ - 2.2, 0.7, 0.35, 0.7);// chaise
    hdeco(BOX, 0x6b4a2e, HX + 2.5, CT + 4.7, HZ + 2.7, 1.2, 2.4, 2.6);  // armoire
    const bedL = new THREE.PointLight(0xffe9b8, 4, 10); bedL.position.set(HX + 1, CT + 6.8, HZ); scene.add(bedL);
    // butin de la maison : coffres au RDC et sur le toit, butin au 1er
    spawnChest(HX + 3.5, CT + 0.2, HZ - 2.5);
    spawnChest(HX + 4.5, CT + 8.5, HZ + 3.5);
    ammoBoxes.push(spawnAmmoBox(HX + 2, CT + 4.7, HZ + 1));
    lootSpots.push({ x: HX + 1, y: CT + 0.6, z: HZ + 2 });
    lootSpots.push({ x: HX - 2, y: CT + 5.2, z: HZ });
    lootSpots.push({ x: HX - 2, y: CT + 8.9, z: HZ - 2.5 });
    { const H = curHouse; curHouse = null; finishHouse(H); }

    // ============ alentours : escalier, phare, hélipad, rochers ============
    curHouse = { boxes: [], deco: [], mesh: null };
    // grand escalier extérieur (à l'est de la falaise) : de la plage sud au
    // bord de la dalle (z CLZ+9). La marche du haut affleure la dalle — on
    // débouche directement sur la terrasse devant la maison, sans marche
    // flottante et sans plafond bas au-dessus de la montée.
    for (let s = 0; s < 13; s++) {
      makeStructBox(CLX + 10, h0 - 0.15, CLZ + 18 - s * 0.75, 3.4, 0.35 + s * 0.4, 0.85, matC(M, { roughness: 0.5 }), { indestructible: true });
      hdeco(BOX, GOLD, CLX + 11.8, h0 + 0.65 + s * 0.4, CLZ + 18 - s * 0.75, 0.12, 0.9, 0.12);
    }
    // Promenade à joints : les trajets bouche/ponton/escalier/hélipad
    // partagent le même dallage, posé au sol sans marche infranchissable.
    for (const [dx, dz, w, d] of [[0, 7, 3.2, 10], [-6, 12, 15, 2.6], [7.5, 12, 12, 2.6], [12.5, 9, 2.8, 6]]) {
      hdeco(BOX, 0xb9b6aa, p.x + dx, h0 + 0.035, p.z + dz, w, 0.07, d);
      const n = Math.floor(Math.max(w, d) / 1.2);
      for (let i = 1; i < n; i++) hdeco(BOX, 0x8e938f, p.x + dx + (w > d ? (i / n - 0.5) * w : 0), h0 + 0.073, p.z + dz + (d > w ? (i / n - 0.5) * d : 0), w > d ? 0.035 : w, 0.006, d > w ? 0.035 : d);
    }
    // Le bunker reste accessible au sud, mais s'encastre désormais dans un
    // affleurement plutôt que d'être un cube posé au milieu de la pelouse.
    for (const [dx, dz, w, h, d] of [[17, -5.3, 9, 4.6, 2.8], [21.5, -0.6, 2.5, 4.1, 7]]) {
      hdeco(cragGeo, R2, p.x + dx, h0 + h * 0.42, p.z + dz, w, h, d, 0, 0.1, 0);
      propBox(p.x + dx, h0, p.z + dz, w * 0.32, d * 0.32, h * 0.7);
    }
    // rochers gris autour de l'île
    for (const [rx, rz, rs] of [[-14, -12, 3], [13, -14, 2.4], [17, 11, 2.8], [-16, 13, 2.2]]) {
      hdeco(BOX, 0x59606c, p.x + rx, p.h - 0.6, p.z + rz, rs, rs * 1.1, rs, 0.1, 0.4, 0.2);
    }
    // phare rouge et blanc
    {
      const lx = p.x - 13, lz = p.z - 9;
      makeStructBox(lx, p.h, lz, 2.6, 1, 2.6, matC(0x8d929a, { roughness: 0.6 }), { indestructible: true });
      for (let s = 0; s < 5; s++) hdeco(CYL_GEO, s % 2 ? 0xd2483a : 0xf4f1ea, lx, p.h + 1 + s * 1.5, lz, 1.7 - s * 0.08, 1.5, 1.7 - s * 0.08);
      hdeco(CYL_GEO, 0x2c3a4a, lx, p.h + 8.8, lz, 1.4, 1.1, 1.4);
      hdeco(BOX, 0xffd23f, lx, p.h + 9.4, lz, 0.9, 0.9, 0.9);
      hdeco(CYL_GEO, 0x3a3f47, lx, p.h + 10.3, lz, 0.2, 1.6, 0.2);
    }
    // hélipad en porte-à-faux au-dessus de l'eau
    {
      const hx = p.x + 17, hz = p.z + 10;
      makeStructBox(hx, p.h - 0.4, hz, 6, 0.5, 6, matC(0x3a3f47), { indestructible: true });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const x = hx + sx * 2.5, z = hz + sz * 2.5, foot = Math.min(p.h - 0.8, terrainH(x, z) - 0.3);
        makeStructBox(x, foot, z, 0.32, p.h - 0.4 - foot, 0.32, matC(0x8a8f98), { indestructible: true });
        hdeco(BOX, 0x8a8f98, x, p.h - 0.62, hz, 0.16, 0.16, 5.3);
      }
      hdeco(CYL_GEO, 0x1f2430, hx, p.h + 0.2, hz, 2.2, 0.5, 2.2);
      hdeco(BOX, 0xffd23f, hx - 0.75, p.h + 0.5, hz, 0.45, 0.06, 1.7);
      hdeco(BOX, 0xffd23f, hx + 0.75, p.h + 0.5, hz, 0.45, 0.06, 1.7);
      hdeco(BOX, 0xffd23f, hx, p.h + 0.5, hz, 1.5, 0.06, 0.45);
    }

    // ---- CASCADE DE LA FALAISE : l'eau déborde du sommet du rocher ouest et
    // retombe dans un bassin turquoise au pied de la falaise (texture
    // défilante + embruns, comme la cascade de la Grotte)
    {
      const wfx = CLX - 8.9, wfz = CLZ + 2.5;
      // Source aménagée alimentée par une conduite, déversoir puis bassin
      // bordé de pierre : l'eau ne naît plus dans le vide au-dessus du rocher.
      makeStructBox(wfx, CT - 0.2, wfz, 2.8, 0.18, 2.7, matC(RD), { indestructible: true });
      hdeco(BOX, 0x73cbd4, wfx, CT + 0.02, wfz, 2.3, 0.06, 2.2);
      hdeco(CYL_GEO, 0x879ca5, wfx + 0.8, CT + 0.28, wfz - 1.0, 0.24, 1.4, 0.24, 0, 0, Math.PI / 2);
      for (const s of [-1, 1]) makeStructBox(wfx, CT - 0.1, wfz + s * 1.25, 2.8, 0.45, 0.22, matC(R1), { indestructible: true });
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2;
        hdeco(cragGeo, R3, wfx + Math.cos(a) * 1.7, h0 + 0.15, wfz + Math.sin(a) * 2.05, 1, 0.6, 1, 0, a, 0);
      }
      const wfTex = canvasTex((g, s) => {
        g.fillStyle = 'rgba(190,230,255,0.9)'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.5})`; g.fillRect(Math.random() * s, Math.random() * s, 2 + Math.random() * 4, 12 + Math.random() * 30); }
      }, 128);
      wfTex.wrapS = wfTex.wrapT = THREE.RepeatWrapping;
      const wf = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.35, 5.6, 12, 1, true), new THREE.MeshBasicMaterial({ map: wfTex, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
      wf.position.set(wfx, h0 + 2.6, wfz); scene.add(wf);
      const pool = new THREE.Mesh(CYL_GEO, matC(0x53d8e8, { transparent: true, opacity: 0.7, roughness: 0.15 }));
      pool.scale.set(2.2, 0.14, 2.8); pool.position.set(wfx, h0 + 0.07, wfz); scene.add(pool);
      spyFx.push((dt) => {
        wfTex.offset.y -= dt * 0.85;
        if (MR() < dt * 2.5) burst(_v1.set(wfx + (MR() - 0.5) * 2.2, h0 + 0.1, wfz + (MR() - 0.5) * 2.4), 0xbfe8ff, 2, 2.2, 0.09, 0.4, 0.5);
      });
    }

    // ---- LANTERNES DE LA BOUCHE : deux mâts lumineux encadrent l'entrée de
    // la gueule (matériau émissif + point light chaude)
    for (const s of [-1, 1]) {
      const lx = CLX + s * 6.8, lz = CLZ + 11.8;
      hdeco(CYL_GEO, 0x3a3f47, lx, h0 + 1.3, lz, 0.12, 2.6, 0.12);
      hdeco(BOX, 0x3a3f47, lx, h0 + 3.05, lz, 0.46, 0.12, 0.46);
      const lamp = new THREE.Mesh(BOX, matC(0xffd9a0, { emissive: 0xff9a2e, emissiveIntensity: 1.6 }));
      lamp.scale.set(0.34, 0.42, 0.34); lamp.position.set(lx, h0 + 2.75, lz); scene.add(lamp);
      const ll = new THREE.PointLight(0xffb45e, 2.2, 7); ll.position.set(lx, h0 + 2.8, lz); scene.add(ll);
    }

    // ---- DRAPEAU GHOST + PARABOLE DE COMMUNICATION sur le toit de la villa
    hdeco(CYL_GEO, 0xb2b7bd, HX - 6.2, CT + 10.4, HZ - 4.6, 0.1, 4, 0.1);
    hdeco(BOX, 0x1f3a8a, HX - 5.1, CT + 11.7, HZ - 4.6, 1.9, 1.2, 0.06);
    hdeco(BOX, 0xffffff, HX - 5.1, CT + 11.7, HZ - 4.54, 0.55, 0.55, 0.02);
    {
      const dx = HX - 5.8, dz = HZ + 4.5;
      hdeco(CYL_GEO, 0x8a8f98, dx, CT + 9.2, dz, 0.14, 1.7, 0.14);
      const dish = new THREE.Group();
      const disc = new THREE.Mesh(CYL_GEO, matC(0xe6e8eb, { roughness: 0.4, metalness: 0.3 }));
      disc.scale.set(1.8, 0.22, 1.8); disc.position.y = 0.55; disc.rotation.x = -0.45; dish.add(disc);
      const arm = new THREE.Mesh(BOX, matC(0x8a8f98)); arm.scale.set(0.1, 0.8, 0.1); arm.position.set(0, 0.8, 0.35); dish.add(arm);
      dish.position.set(dx, CT + 10, dz); scene.add(dish);
      spyFx.push((dt, t) => { dish.rotation.y = t * 0.5; });
    }

    // ---- COIN PLAGE (côté ouest) : parasol, transats, serviette et ballon
    hdeco(CYL_GEO, 0xdac89d, p.x - 6.5, p.h + 0.018, p.z + 17.3, 10.5, 0.03, 7.5);
    hdeco(CYL_GEO, 0xd8d2c4, p.x - 6.2, p.h + 1.15, p.z + 17, 0.09, 2.3, 0.09, 0.22, 0, 0);
    hdeco(SPH_GEO, 0xe8563f, p.x - 6.5, p.h + 2.3, p.z + 17.3, 2.7, 1.0, 2.7);
    hdeco(SPH_GEO, 0xf4f1ea, p.x - 6.5, p.h + 2.85, p.z + 17.3, 0.35, 0.35, 0.35);
    hdeco(BOX, 0x3a4a5c, p.x - 8.8, p.h + 0.28, p.z + 16, 0.8, 0.22, 1.9, 0, 0.35, 0);
    hdeco(BOX, 0x3a4a5c, p.x - 8.15, p.h + 0.75, p.z + 15.5, 0.8, 0.55, 0.65, -0.4, 0.35, 0);
    hdeco(BOX, 0x3a4a5c, p.x - 4.4, p.h + 0.28, p.z + 18.7, 0.8, 0.22, 1.9, 0, -0.3, 0);
    hdeco(BOX, 0x3a4a5c, p.x - 4.75, p.h + 0.75, p.z + 19.25, 0.8, 0.55, 0.65, -0.4, -0.3, 0);
    hdeco(BOX, 0x3fa9ff, p.x - 5.2, p.h + 0.04, p.z + 19.9, 1.1, 0.05, 2.2, 0, 0.3, 0);
    hdeco(SPH_GEO, 0xf4f1ea, p.x - 7.6, p.h + 0.35, p.z + 19.2, 0.55, 0.55, 0.55);
    hdeco(BOX, 0xd2483a, p.x - 7.6, p.h + 0.35, p.z + 19.2, 0.57, 0.18, 0.57);

    // ---- PONTON EN BOIS au sud-ouest + barque amarrée + bouées : le ponton
    // part de la plage et s'avance 20 m au-dessus de l'eau
    {
      const px = p.x - 12, pz0 = p.z + 13, pz1 = p.z + 33;
      const deck = p.h + 0.45;
      makeStructBox(px, deck - 0.3, (pz0 + pz1) / 2, 2.8, 0.3, pz1 - pz0, matC(0x8a6a45, { roughness: 0.9 }), { indestructible: true });
      for (let i = 0; i <= 4; i++) for (const s of [-1, 1]) {
        const x = px + s * 1.18, z = pz0 + i * 5;
        const foot = Math.min(-0.8, terrainH(x, z) - 0.5), top = deck + 0.35;
        hdeco(CYL_GEO, 0x6b4a2c, x, (foot + top) / 2, z, 0.28, top - foot, 0.28);
        propBox(x, deck, z, 0.14, 0.14, 0.35);
        hdeco(BOX, 0x6b4a2c, px, deck - 0.4, z, 2.8, 0.22, 0.25);
      }
      for (let i = 0; i < 40; i++) hdeco(BOX, 0x6b4a2c, px, deck + 0.007, pz0 + 0.25 + i * 0.5, 2.75, 0.014, 0.025);
      hdeco(BOX, 0x6b4a2c, px - 1.45, p.h + 0.62, (pz0 + pz1) / 2, 0.14, 0.1, pz1 - pz0);
      hdeco(BOX, 0x6b4a2c, px + 1.45, p.h + 0.62, (pz0 + pz1) / 2, 0.14, 0.1, pz1 - pz0);
      hdeco(CYL_GEO, 0xffc400, px, p.h + 0.85, pz1 - 0.8, 0.14, 0.6, 0.14);
      // barque amarrée au bout du ponton (flotte, tangue et roule doucement)
      const boat = new THREE.Group();
      addBox(boat, 1.6, 0.5, 3.4, 0, 0.25, 0, matC(0x8a6a45, { roughness: 0.85 }));
      addBox(boat, 1.2, 0.16, 2.6, 0, 0.58, 0, matC(0x9a7a55, { roughness: 0.85 }));
      addBox(boat, 1.1, 0.1, 0.4, 0, 0.66, 0.4, matC(0x7a5c3a, { roughness: 0.9 }));
      addBox(boat, 1.1, 0.1, 0.4, 0, 0.66, -0.5, matC(0x7a5c3a, { roughness: 0.9 }));
      scene.add(boat);
      boat.position.set(px - 2.7, 0.42, pz1 - 3);
      spyFx.push((dt, t) => {
        boat.position.y = 0.42 + Math.sin(t * 1.1) * 0.08;
        boat.rotation.z = Math.sin(t * 0.9) * 0.04;
        boat.rotation.x = Math.sin(t * 0.7 + 1) * 0.03;
      });
      // deux bouées rouge et blanc qui dansent au large
      for (const [bx, bz, ph] of [[-7, 37, 0], [-18, 39, 1.7]]) {
        const bu = new THREE.Mesh(SPH_GEO, matC(0xd2483a)); bu.scale.set(0.78, 0.58, 0.78); bu.position.set(p.x + bx, 0.3, p.z + bz); scene.add(bu);
        const bt = new THREE.Mesh(SPH_GEO, matC(0xf4f1ea)); bt.scale.setScalar(0.34); bt.position.set(p.x + bx, 0.75, p.z + bz); scene.add(bt);
        spyFx.push((dt, t) => { const y = 0.3 + Math.sin(t * 1.4 + ph) * 0.12; bu.position.y = y; bt.position.y = y + 0.45; });
      }
    }
    { const H = curHouse; curHouse = null; finishHouse(H); }
    // aileron dans l'eau au large
    const fa = Math.atan2(p.z, p.x);
    const fin = new THREE.Mesh(PRISM_GEO, matC(0x6b7380));
    fin.scale.set(2.2, 3.2, 3.2); fin.rotation.z = -Math.PI / 2; fin.rotation.y = -fa;
    fin.position.set(p.x + Math.cos(fa) * (p.r + 20), 1.2, p.z + Math.sin(fa) * (p.r + 20));
    scene.add(fin);
  } else if (p.key === 'yacht') {
    // ---- LE YACHT : grand yacht de luxe à 4 niveaux, à flot en pleine mer (plus d'île autour).
    // Repère local (u le long du navire, bout à -u ; v en travers). Ligne de flottaison y = 0.
    const D0 = 2.4, D1 = 6.4, D2 = 10.2, D3 = 13.6; // dessus du pont principal / pont 2 / pont 3 / toit de la timonerie
    curHouse = { boxes: [], deco: [], mesh: null };
    const hullM = matC(0xf2f4f8, { metalness: 0.3, roughness: 0.4 });
    const deckM = matC(0xe9d7b0, { roughness: 0.7 });
    const cabM = matC(0xf4f5f8, { metalness: 0.15, roughness: 0.5 });
    const GL = 0x7fc4ee, GD = 0xffc400;
    const bx = (u0, u1, v0, v1, y0, y1, mat, o) => makeStructBox(p.x + (u0 + u1) / 2, y0, p.z + (v0 + v1) / 2, u1 - u0, y1 - y0, v1 - v0, mat, o || { indestructible: true });
    const dc = (hex, u, y, v, su, sy, sv, ry = 0) => hdeco(BOX, hex, p.x + u, y, p.z + v, su, sy, sv, 0, ry, 0);
    const pb = (u, y, v, hu, hv, h) => propBox(p.x + u, y, p.z + v, hu, hv, h);
    const rail = (u0, v0, u1, v1, y, col = true) => { // balustrade dorée (+ collider invisible)
      const L = Math.hypot(u1 - u0, v1 - v0), n = Math.max(1, Math.round(L / 2.4));
      const ry = Math.atan2(u1 - u0, v1 - v0);
      for (let i = 0; i <= n; i++) dc(GD, u0 + (u1 - u0) * i / n, y + 0.45, v0 + (v1 - v0) * i / n, 0.1, 0.9, 0.1);
      dc(GD, (u0 + u1) / 2, y + 0.9, (v0 + v1) / 2, 0.1, 0.1, L + 0.12, ry);
      dc(GD, (u0 + u1) / 2, y + 0.45, (v0 + v1) / 2, 0.06, 0.06, L + 0.08, ry);
      if (col) pb((u0 + u1) / 2, y, (v0 + v1) / 2, Math.abs(u1 - u0) / 2 + 0.06, Math.abs(v1 - v0) / 2 + 0.06, 1.1);
    };
    // mur avec ouvertures : dir 'v' = mur perpendiculaire à l'axe du navire (u fixe), 'u' = mur le long du navire
    const wall = (dir, c, a0, a1, y0, y1, doors, mat) => {
      const t = 0.5; let a = a0;
      const seg = (s0, s1) => { if (s1 - s0 < 0.05) return; if (dir === 'v') bx(c - t / 2, c + t / 2, s0, s1, y0, y1, mat); else bx(s0, s1, c - t / 2, c + t / 2, y0, y1, mat); };
      for (const d of doors) { seg(a, d - 1.5); if (dir === 'v') bx(c - t / 2, c + t / 2, d - 1.5, d + 1.5, y1 - 0.8, y1, mat); else bx(d - 1.5, d + 1.5, c - t / 2, c + t / 2, y1 - 0.8, y1, mat); a = d + 1.5; }
      seg(a, a1);
    };

    // ---- COQUE (u -28..29) + étrave en gradins + pont principal en teck clair
    bx(-28, 29, -7, 7, -3, 2, hullM);
    bx(-28, 29, -7, 7, 2, D0, deckM);
    for (const [u0, u1, hw] of [[-31, -28, 6.2], [-33.5, -31, 4.6], [-35.5, -33.5, 3.0], [-37, -35.5, 1.4]]) { bx(u0, u1, -hw, hw, -3, 2, hullM); bx(u0, u1, -hw, hw, 2, D0, deckM); }
    dc(0x1f3a8a, 0.5, -0.1, -7.04, 57, 0.5, 0.06); dc(0x1f3a8a, 0.5, -0.1, 7.04, 57, 0.5, 0.06);   // ligne de flottaison bleue
    dc(GD, 0.5, 1.3, -7.06, 57, 0.3, 0.06); dc(GD, 0.5, 1.3, 7.06, 57, 0.3, 0.06);                  // liseré doré
    for (let i = 0; i < 17; i++) { const u = -25 + i * 3.3; dc(0x9fd8ff, u, 0.6, -7.07, 0.7, 0.7, 0.05); dc(0x9fd8ff, u, 0.6, 7.07, 0.7, 0.7, 0.05); }
    // plage arrière : plateforme de bain + 6 marches qui montent jusqu'au pont (on embarque depuis l'eau)
    bx(35, 38, -3.2, 3.2, -1.2, -0.4, deckM);
    for (let k = 1; k <= 6; k++) bx(35 - k, 36 - k, -2.5, 2.5, -1.2, -0.4 + (D0 + 0.4) / 6 * k, deckM);
    dc(GD, 36.5, -0.2, -3.25, 3, 0.1, 0.08); dc(GD, 36.5, -0.2, 3.25, 3, 0.1, 0.08);
    // garde-corps du pont principal (bords latéraux + étrave)
    rail(-28, -6.85, 29, -6.85, D0); rail(-28, 6.85, 29, 6.85, D0);
    rail(-31, -6.05, -28, -6.85, D0, false); rail(-31, 6.05, -28, 6.85, D0, false);
    for (const [u0, u1, hw0, hw1] of [[-31, -33.5, 6.05, 4.45], [-33.5, -35.5, 4.45, 2.85], [-35.5, -37, 2.85, 1.25]]) { rail(u0, -hw0, u1, -hw1, D0, false); rail(u0, hw0, u1, hw1, D0, false); }
    rail(-37, -1.25, -37, 1.25, D0, false);

    // ---- PONT PRINCIPAL : proue (jacuzzi, bains de soleil), SALON, plage arrière avec hélipad
    // jacuzzi
    dc(0xf4f5f8, -33, D0 + 0.35, 0, 3.4, 0.7, 3.4); dc(0x4fd0e0, -33, D0 + 0.72, 0, 2.7, 0.06, 2.7); dc(GD, -33, D0 + 0.74, 0, 3.5, 0.05, 3.5);
    pb(-33, D0, 0, 1.7, 1.7, 0.7);
    for (const v of [-3.2, 3.2]) { dc(0xffffff, -29, D0 + 0.3, v, 2.2, 0.6, 0.9); dc(0x2c6fbb, -29, D0 + 0.64, v, 2.1, 0.08, 0.8); dc(0xffffff, -29.9, D0 + 0.85, v, 0.3, 0.6, 0.85, 0); pb(-29, D0, v, 1.1, 0.45, 0.65); }
    // mât de proue + fanion GHOST
    dc(0xf4f1ea, -36.5, D0 + 2.2, 0, 0.14, 4.4, 0.14); dc(0x1f3a8a, -36.5, D0 + 3.9, 0.9, 0.05, 0.9, 1.7);
    // SALON : murs à portes (proue et poupe), baies vitrées, plafond = sol du pont 2
    wall('u', -5, -16, 8, D0, D1 - 0.4, [], cabM); wall('u', 5, -16, 8, D0, D1 - 0.4, [], cabM);
    wall('v', -16, -5, 5, D0, D1 - 0.4, [0], cabM); wall('v', 8, -5, 5, D0, D1 - 0.4, [0], cabM);
    for (const sv of [-1, 1]) for (let i = 0; i < 4; i++) { dc(GL, -13 + i * 6, D0 + 1.9, sv * 5.27, 4.2, 1.5, 0.06); dc(GD, -13 + i * 6, D0 + 2.7, sv * 5.28, 4.4, 0.1, 0.08); dc(GD, -13 + i * 6, D0 + 1.1, sv * 5.28, 4.4, 0.1, 0.08); }
    for (const u of [-16.3, 8.3]) { dc(GL, u, D0 + 1.8, -3.3, 0.06, 1.8, 1.0); dc(GL, u, D0 + 1.8, 3.3, 0.06, 1.8, 1.0); }
    // plafond du salon + dalle du pont 2 (u -17..9.5)
    bx(-17, 9.5, -6.4, 6.4, D1 - 0.4, D1, deckM);
    dc(0xc6b9a0, 0, D1 - 0.46, 0, 24, 0.06, 10);
    // mobilier du salon (couloir central libre)
    dc(0x8a1f2b, -4, D0 + 0.03, 0, 22, 0.05, 6);                                   // tapis
    for (const sv of [-1, 1]) for (const u of [-11, -3]) {
      dc(0xf1e8d6, u, D0 + 0.45, sv * 4.2, 4.2, 0.9, 0.9); dc(0xf1e8d6, u, D0 + 0.95, sv * 4.6, 4.2, 0.7, 0.2); pb(u, D0, sv * 4.2, 2.1, 0.5, 0.9);
      dc(0xb0873a, u, D0 + 0.3, sv * 2.7, 1.6, 0.6, 1.2); pb(u, D0, sv * 2.7, 0.8, 0.6, 0.6);
    }
    dc(0x5a3a22, 5.4, D0 + 0.55, 3.8, 3.4, 1.1, 1.0); dc(GD, 5.4, D0 + 1.12, 3.8, 3.5, 0.06, 1.1); pb(5.4, D0, 3.8, 1.7, 0.5, 1.1);   // bar
    for (const u of [4.2, 5.4, 6.6]) { dc(0xffc400, u, D0 + 0.4, 2.7, 0.5, 0.8, 0.5); pb(u, D0, 2.7, 0.25, 0.25, 0.8); }
    dc(GD, -4, D1 - 0.9, 0, 1.6, 0.9, 1.6); dc(GD, -4, D1 - 0.5, 0, 0.3, 0.6, 0.3);   // lustre
    // PLAGE ARRIÈRE : hélipad + transats
    hdeco(CYL_GEO, 0x2c313c, p.x + 23.5, D0 + 0.06, p.z, 9.2, 0.06, 9.2);
    hdeco(CYL_GEO, 0xf1c40f, p.x + 23.5, D0 + 0.1, p.z, 7.6, 0.06, 7.6);
    dc(0x22262f, 23.5 - 1.3, D0 + 0.15, 0, 0.5, 0.06, 3.4); dc(0x22262f, 23.5 + 1.3, D0 + 0.15, 0, 0.5, 0.06, 3.4); dc(0x22262f, 23.5, D0 + 0.15, 0, 2.6, 0.06, 0.5);
    for (const sv of [-1, 1]) { dc(0xffffff, 12.2, D0 + 0.3, sv * 5.0, 2.2, 0.6, 0.9); dc(0xffc400, 12.2, D0 + 0.64, sv * 5.0, 2.1, 0.08, 0.8); pb(12.2, D0, sv * 5.0, 1.1, 0.45, 0.65); }
    // escalier extérieur vers le pont 2 (9 marches, de u 17.6 à 9.5 côté tribord)
    const sN = 9, dh = (D1 - D0) / sN;
    for (let k = 1; k <= sN; k++) bx(18.5 - k, 19.5 - k, 2.6, 5.4, D0 - 0.05, D0 + dh * k, hullM);

    // ---- PONT 2 : salon-bar en plein air + SKY LOUNGE (cabine fermée)
    wall('u', -5, -15, -4, D1, D2 - 0.4, [], cabM); wall('u', 5, -15, -4, D1, D2 - 0.4, [], cabM);
    wall('v', -15, -5, 5, D1, D2 - 0.4, [], cabM); wall('v', -4, -5, 5, D1, D2 - 0.4, [0], cabM);
    for (const sv of [-1, 1]) for (let i = 0; i < 2; i++) { dc(GL, -12 + i * 5.2, D1 + 1.8, sv * 5.27, 4.0, 1.4, 0.06); dc(GD, -12 + i * 5.2, D1 + 2.6, sv * 5.28, 4.2, 0.1, 0.08); }
    dc(GL, -15.3, D1 + 1.8, 0, 0.06, 1.5, 7.0); dc(GD, -15.3, D1 + 2.6, 0, 0.08, 0.1, 7.2);
    bx(-15.5, -3.5, -5.5, 5.5, D2 - 0.4, D2, deckM);                              // toit du sky lounge = pont 3
    dc(0x2b6f8a, -9.5, D1 + 0.03, 0, 11, 0.05, 9);                                   // moquette
    dc(0xf1e8d6, -9.5, D1 + 0.5, -4.1, 7, 0.9, 1.0); dc(0xf1e8d6, -9.5, D1 + 1.0, -4.55, 7, 0.7, 0.2); pb(-9.5, D1, -4.1, 3.5, 0.5, 0.9);
    dc(0xf1e8d6, -9.5, D1 + 0.5, 4.1, 7, 0.9, 1.0); dc(0xf1e8d6, -9.5, D1 + 1.0, 4.55, 7, 0.7, 0.2); pb(-9.5, D1, 4.1, 3.5, 0.5, 0.9);
    dc(GD, -9.5, D1 + 0.55, 0, 3.6, 0.1, 2.2); dc(0x5a3a22, -9.5, D1 + 0.3, 0, 3.2, 0.5, 1.8); pb(-9.5, D1, 0, 1.7, 1.0, 0.6);
    // partie ouverte du pont 2 (aft) : banquette en U, table, bar de plein air
    dc(0xffffff, 3, D1 + 0.45, -4.6, 5.6, 0.9, 1.0); dc(0xffffff, 3, D1 + 1.0, -5.1, 5.6, 0.7, 0.2); pb(3, D1, -4.6, 2.8, 0.5, 0.9);
    dc(0xb0873a, 3, D1 + 0.4, -2.4, 2.4, 0.8, 1.4); pb(3, D1, -2.4, 1.2, 0.7, 0.8);
    dc(0x5a3a22, 7.6, D1 + 0.55, -3.6, 1.0, 1.1, 4.0); dc(GD, 7.6, D1 + 1.12, -3.6, 1.1, 0.06, 4.1); pb(7.6, D1, -3.6, 0.5, 2.0, 1.1);
    for (const sv of [4.2]) { dc(0xffffff, 6.5, D1 + 0.3, sv + 1.2, 2.2, 0.6, 0.9); dc(0x2c6fbb, 6.5, D1 + 0.64, sv + 1.2, 2.1, 0.08, 0.8); }
    // garde-corps du pont 2 (le palier d'escalier aft reste ouvert)
    rail(-17, -6.2, 9.5, -6.2, D1); rail(-17, 6.2, 9.5, 6.2, D1); rail(-17, -6.2, -17, 6.2, D1); rail(9.5, -6.2, 9.5, 2.2, D1); rail(9.5, 5.8, 9.5, 6.2, D1);
    // escalier vers le pont 3 (9 marches, côté tribord, jusqu'au toit du sky lounge)
    const s2 = 9, dh2 = (D2 - D1) / s2;
    for (let k = 1; k <= s2; k++) bx(5.5 - k, 6.5 - k, 2.8, 5.4, D1 - 0.05, D1 + dh2 * k, hullM);
    // ---- PONT 3 : solarium + TIMONERIE
    wall('u', -3.7, -14, -7, D2, D3 - 0.4, [], cabM); wall('u', 3.7, -14, -7, D2, D3 - 0.4, [], cabM);
    wall('v', -14, -3.7, 3.7, D2, D3 - 0.4, [], cabM); wall('v', -7, -3.7, 3.7, D2, D3 - 0.4, [0], cabM);
    for (const sv of [-1, 1]) { dc(GL, -10.5, D2 + 1.8, sv * 3.97, 6.4, 1.3, 0.06); dc(GD, -10.5, D2 + 2.55, sv * 3.98, 6.6, 0.1, 0.08); }
    dc(GL, -14.27, D2 + 1.8, 0, 0.06, 1.3, 6.6);
    bx(-14.5, -6.5, -4.2, 4.2, D3 - 0.4, D3, deckM);                                 // toit de la timonerie
    dc(0x39424e, -12.6, D2 + 0.6, 0, 1.2, 1.2, 5.6); dc(0x39ff88, -12.6, D2 + 1.25, 0, 0.9, 0.06, 4.8); pb(-12.6, D2, 0, 0.6, 2.8, 1.2);   // pupitre de pilotage
    dc(0x1f3a8a, -10, D2 + 0.45, 0, 0.8, 0.9, 0.8); pb(-10, D2, 0, 0.4, 0.4, 0.9);
    for (const sv of [-1, 1]) { dc(0xffffff, -5, D2 + 0.3, sv * 3.9, 2.2, 0.6, 0.9); dc(0xffc400, -5, D2 + 0.64, sv * 3.9, 2.1, 0.08, 0.8); pb(-5, D2, sv * 3.9, 1.1, 0.45, 0.65); }
    rail(-15.5, -5.4, -3.5, -5.4, D2); rail(-15.5, 5.4, -3.5, 5.4, D2); rail(-15.5, -5.4, -15.5, 5.4, D2); rail(-3.5, -5.4, -3.5, 2.5, D2);
    // mât radar, antennes, dôme satellite
    dc(0xf4f1ea, -9, D3 + 2.2, -1.5, 0.4, 4.4, 0.4); dc(GD, -9, D3 + 3.0, -1.5, 3.2, 0.2, 0.2); dc(GD, -9, D3 + 4.0, -1.5, 2.2, 0.2, 0.2);
    hdeco(CYL_GEO, 0xf4f1ea, p.x - 9, D3 + 4.6, p.z - 1.5, 1.0, 0.4, 1.0);
    hdeco(SPH_GEO, 0xf4f1ea, p.x - 11, D3 + 0.9, p.z + 2, 2.2, 2.2, 2.2);
    dc(0xb2b7bd, -7.6, D3 + 3.2, 2.5, 0.12, 6.4, 0.12); dc(0x1f3a8a, -7.6 - 0.9, D3 + 5.4, 2.5, 1.8, 1.0, 0.05);
    rail(-14.5, -4.2, -6.5, -4.2, D3, false); rail(-14.5, 4.2, -6.5, 4.2, D3, false);
    // ---- DÉTAILS DE LUXE : cheminée, jet-skis, bouées, mobilier, plantes, ancres, guirlande de pavillons…
    // cheminée profilée sur le toit de la timonerie (bande bleue, liseré doré, sortie noire)
    dc(0xf4f5f8, -12.8, D3 + 1.3, -2.6, 2.4, 2.6, 2.2); dc(0x1f3a8a, -12.8, D3 + 1.9, -2.6, 2.46, 0.55, 2.26); dc(GD, -12.8, D3 + 2.25, -2.6, 2.5, 0.1, 2.3);
    dc(0x22262f, -12.8, D3 + 2.7, -2.6, 2.1, 0.2, 1.9);
    hdeco(CYL_GEO, 0x2c313c, p.x - 12.8, D3 + 3.0, p.z - 2.6, 0.5, 0.7, 0.5);
    // feux de navigation (bâbord rouge / tribord vert), feu de mât blanc, projecteurs
    dc(0xff2a2a, -7.0, D2 + 2.65, -3.95, 0.3, 0.3, 0.12); dc(0x2aff5a, -7.0, D2 + 2.65, 3.95, 0.3, 0.3, 0.12);
    dc(0xfff6c8, -9, D3 + 5.0, -1.5, 0.3, 0.3, 0.3);
    for (const sv of [-1, 1]) { dc(0x39424e, -7.2, D3 + 0.25, sv * 3.6, 0.5, 0.5, 0.5); dc(0xfff6c8, -6.9, D3 + 0.25, sv * 3.6, 0.1, 0.3, 0.3); }
    dc(0xb2b7bd, -13.8, D3 + 2.6, 3.2, 0.08, 5.2, 0.08); dc(0xb2b7bd, -6.9, D3 + 2.0, -3.4, 0.08, 4.0, 0.08);     // antennes fouets
    // pavillons de fête de la proue à la coque (deux guirlandes)
    for (const sv of [-1, 1]) for (let i = 1; i <= 8; i++) {
      const t = i / 9, u = -36.5 + (-29.5 + 36.5) * t, y = D0 + 4.2 + (D0 + 1.4 - D0 - 4.2) * t - 0.55 * Math.sin(Math.PI * t), v = sv * 5.9 * t;
      dc([0xff3b3b, 0xffc400, 0x1f6fff, 0xffffff, 0x2cc56b][i % 5], u, y - 0.14, v, 0.26, 0.26, 0.05, Math.atan2(5.9 * sv, 7));
    }
    // plage arrière : deux jet-skis amarrés + bouée de sauvetage
    for (const [sv, col] of [[-1, 0xffc400], [1, 0x1f6fff]]) {
      dc(col, 36.6, 0.05, sv * 2.2, 2.4, 0.5, 0.9); dc(0xf4f5f8, 37.9, 0.12, sv * 2.2, 0.6, 0.3, 0.7); dc(0x22262f, 36.3, 0.42, sv * 2.2, 1.1, 0.2, 0.5); dc(0x39424e, 37.0, 0.55, sv * 2.2, 0.1, 0.35, 0.7);
    }
    // bouées de sauvetage orange sur les lisses du pont principal (+ filin blanc)
    for (const u of [-24, -10, 2, 14, 22.5]) for (const sv of [-1, 1]) {
      hdeco(CYL_GEO, 0xff5a1f, p.x + u, D0 + 0.55, p.z + sv * 6.92, 0.95, 0.12, 0.95, Math.PI / 2, 0, 0);
      hdeco(CYL_GEO, 0xf4f5f8, p.x + u, D0 + 0.55, p.z + sv * 6.98, 0.5, 0.12, 0.5, Math.PI / 2, 0, 0);
      for (const a of [0, Math.PI / 2]) hdeco(BOX, 0xffffff, p.x + u + Math.cos(a) * 0.36, D0 + 0.55 + Math.sin(a) * 0.36, p.z + sv * 6.95, 0.16, 0.16, 0.14, 0, 0, 0);
    }
    // ancres le long de la coque + guindeaux à la proue
    for (const sv of [-1, 1]) {
      dc(0x39424e, -26, 0.9, sv * 7.12, 0.2, 1.5, 0.1); dc(0x39424e, -26, 1.45, sv * 7.12, 0.9, 0.18, 0.1); dc(0x39424e, -26, 0.25, sv * 7.12, 0.8, 0.14, 0.1);
      hdeco(CYL_GEO, 0x39424e, p.x - 35.4, D0 + 0.25, p.z + sv * 0.8, 0.9, 0.5, 0.9); dc(GD, -35.4, D0 + 0.52, sv * 0.8, 0.5, 0.06, 0.5);
    }
    // taquets d'amarrage le long du pont
    for (let u = -24; u <= 24; u += 8) for (const sv of [-1, 1]) { dc(0xb2b7bd, u, D0 + 0.12, sv * 6.55, 0.5, 0.22, 0.14); dc(0xb2b7bd, u, D0 + 0.26, sv * 6.55, 0.14, 0.1, 0.34); }
    // lattes de teck sur le pont avant et la plage arrière
    for (let k = -6; k <= 6; k++) { dc(0xc9b583, -22.5, D0 + 0.012, k * 1.0 + 0.5, 11, 0.02, 0.05); }
    for (let k = -6; k <= 6; k++) dc(0xc9b583, 19.2, D0 + 0.012, k * 1.0 + 0.5, 20, 0.02, 0.05);
    // coin repas à l'arrière (bâbord) : table ronde, quatre chaises, parasol
    hdeco(CYL_GEO, 0x5a3a22, p.x + 16, D0 + 0.8, p.z - 2.6, 1.9, 0.08, 1.9); dc(0x39424e, 16, D0 + 0.4, -2.6, 0.18, 0.8, 0.18);
    for (const [cu, cv] of [[14.7, -2.6], [17.3, -2.6], [16, -3.9], [16, -1.3]]) { dc(0xf1e8d6, cu, D0 + 0.4, cv, 0.6, 0.1, 0.6); dc(0xf1e8d6, cu + (cu < 16 ? -0.28 : cu > 16 ? 0.28 : 0), D0 + 0.8, cv + (cv < -2.6 ? -0.28 : cv > -2.6 ? 0.28 : 0), cu === 16 ? 0.6 : 0.08, 0.7, cu === 16 ? 0.08 : 0.6); dc(0x5a3a22, cu, D0 + 0.2, cv, 0.1, 0.4, 0.1); }
    dc(0xe8e1d2, 16, D0 + 1.7, -2.6, 0.08, 1.9, 0.08); hdeco(SPH_GEO, 0xf4efe2, p.x + 16, D0 + 2.6, p.z - 2.6, 3.0, 0.8, 3.0); dc(GD, 16, D0 + 2.98, -2.6, 0.14, 0.2, 0.14);
    dc(0xffffff, 16, D0 + 0.86, -2.6, 0.3, 0.2, 0.3); pb(16, D0, -2.6, 0.9, 0.9, 0.8);
    // plantes en pot (palmiers d'intérieur et buissons)
    const plant = (u, y, v, s = 1) => {
      dc(0xb0873a, u, y + 0.3 * s, v, 0.7 * s, 0.6 * s, 0.7 * s); dc(0x5a3a22, u, y + 0.62 * s, v, 0.62 * s, 0.05, 0.62 * s);
      dc(0x6b4b2a, u, y + 1.2 * s, v, 0.14 * s, 1.1 * s, 0.14 * s);
      hdeco(SPH_GEO, 0x2f8f4a, p.x + u, y + 1.9 * s, p.z + v, 1.5 * s, 0.9 * s, 1.5 * s);
      hdeco(SPH_GEO, 0x49b062, p.x + u + 0.25 * s, y + 2.1 * s, p.z + v - 0.2 * s, 1.0 * s, 0.7 * s, 1.0 * s);
    };
    for (const [u, y, v] of [[9.2, D0, -6.0], [27.4, D0, -6.0], [27.4, D0, 6.0], [-17.4, D0, 5.9], [-14.7, D0, 3.9], [-14.7, D0, -3.9], [7.4, D0, -3.4], [-2.5, D0, 3.6], [-14.2, D1, 4.4], [-14.2, D1, -4.4], [8.6, D1, -5.6], [8.6, D1, 5.2], [-14.7, D2, 4.6], [-4.4, D2, -4.8]]) plant(u, y, v, 0.8);
    // cadres de tableau, miroir et enceintes dans le salon
    for (const [u, v, c] of [[-15.6, -3.2, 0x1f3a8a], [-15.6, 3.2, 0xc43b2f]]) { dc(GD, u, D0 + 2.3, v, 0.08, 1.4, 1.8); dc(c, u + 0.04, D0 + 2.3, v, 0.04, 1.2, 1.6); }
    dc(0x22262f, 7.5, D0 + 1.0, -4.5, 0.5, 2.0, 0.5); dc(0x22262f, 7.5, D0 + 1.0, 4.5, 0.5, 2.0, 0.5);
    // lampadaires de pont (feux chauds) le long du pont principal
    for (const u of [-20, -6, 18]) for (const sv of [-1, 1]) { dc(0x39424e, u, D0 + 0.6, sv * 6.5, 0.08, 1.2, 0.08); dc(0xfff0c0, u, D0 + 1.3, sv * 6.5, 0.24, 0.24, 0.24); }
    // plaque de nom « GHOST » sur le tableau arrière (de part et d'autre de l'échelle de bain)
    {
      const nc = document.createElement('canvas'); nc.width = 512; nc.height = 160; const ng = nc.getContext('2d');
      ng.fillStyle = '#10151f'; ng.fillRect(0, 0, 512, 160); ng.strokeStyle = '#ffc400'; ng.lineWidth = 6; ng.strokeRect(6, 6, 500, 148);
      ng.fillStyle = '#ffc400'; ng.font = '900 88px "Lilita One", "Barlow Condensed", Impact, sans-serif'; ng.textAlign = 'center'; ng.textBaseline = 'middle'; ng.fillText('GHOST', 256, 70);
      ng.font = '700 28px "Barlow Condensed", sans-serif'; ng.fillStyle = '#e9edf4'; ng.fillText('MONACO', 256, 132);
      const nt = new THREE.CanvasTexture(nc); nt.colorSpace = THREE.SRGBColorSpace; nt.anisotropy = 4;
      for (const sv of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.25), new THREE.MeshBasicMaterial({ map: nt })); m.position.set(p.x + 29.04, 1.0, p.z + sv * 4.8); m.rotation.y = Math.PI / 2; scene.add(m); }
    }
    // éclairage doux des salons
    for (const [u, y, v, I, d] of [[-4, D0 + 3.3, 0, 7, 16], [-9.5, D1 + 3.2, 0, 6, 13], [-10, D2 + 2.6, 0, 4, 9], [3, D1 + 2.8, -3, 4, 10], [23.5, D0 + 3, 0, 3, 14]]) {
      const L = new THREE.PointLight(0xffe3b0, I, d); L.position.set(p.x + u, y, p.z + v); scene.add(L);
    }
    const H = curHouse; curHouse = null; finishHouse(H);
    // butin : salon, pont 2, timonerie + coffre-fort en proue et cabine téléphonique
    spawnChest(p.x - 7, D0, p.z - 4.2);
    spawnChest(p.x - 7, D0, p.z + 4.2);
    spawnChest(p.x + 3, D1, p.z + 0.2);
    spawnChest(p.x - 5, D2, p.z - 3.8);
    lootSpots.push({ x: p.x - 4, y: D0 + 0.1, z: p.z });
    lootSpots.push({ x: p.x + 3, y: D1 + 0.1, z: p.z - 1 });
    lootSpots.push({ x: p.x - 10, y: D2 + 0.1, z: p.z });
    buildVault(p, { x: p.x - 23, y: D0, z: p.z });
    buildPhoneBooth(p, { x: p.x - 18, y: D0, z: p.z - 6.0 });
  } else if (p.key === 'grotto') {
    // ---- LA GROTTE : caverne SÈCHE (sol 3,4, au-dessus de la mer) entièrement
    // cachée sous la montagne rocheuse — PLUS D'OUVERTURE CÔTÉ ÎLE : la rampe à
    // ciel ouvert et la cheminée (trou béant) sont supprimées, la voûte est
    // PLEINE au-dessus de la salle. La seule entrée est la BOUCHE DU CRÂNE,
    // façade EST face à l'océan, au bout d'un canyon sec qui descend vers la
    // mer (GROTTO.cove*, voir world.js) : on entre à pied sec, plus jamais de
    // natation dans la grotte.
    // =============================================================
    const G = GROTTO;
    const KX = G.cavernX, KZ = G.cavernZ, FY = G.floor1;
    const ROCK_A = 0x5b6472, ROCK_B = 0x4e5663, ROCK_C = 0x67707e;
    // QG de Brutus : plateforme métallique surélevée au nord de la caverne
    const PX = KX + 4, PZ = KZ - 8, PT = FY + 3.6;

    // (plus de rampe creusée dans le terrain côté île : world.js ne creuse plus
    // que l'empreinte cachée sous la voûte — l'île est pleine autour de la
    // montagne, l'entrée n'est plus que la bouche du crâne côté mer)

    // ---- CAVERNE : salle voûtée sous la montagne (sol 3,4 AU-DESSUS de la mer,
    // voûte ~12,9) — dalle et parois descendent sous le terrain pour qu'aucun
    // jour ne paraisse entre la salle et le monde extérieur
    gshell(KX, -2, KZ, 31, 5.4, 31, ROCK_A); // dalle du sol (top à FY = 3,4)
    const WH = 17.9;
    gshell(KX, -2, KZ - 13.5, 28.6, WH, 1.4, ROCK_B); // paroi nord (top 15,9)
    gshell(KX, -2, KZ + 13.5, 28.6, WH, 1.4, ROCK_B); // paroi sud (top 15,9)
    // paroi ouest : PLEINE (l'ancienne bouche de la rampe est condamnée) —
    // la montagne est continue côté île, on ne voit plus le ciel depuis la
    // caverne : la grotte est bien cachée sous la montagne
    gshell(KX - 13.5, -2, KZ, 1.4, WH, 28.6, ROCK_B);
    // paroi est : REMPLACÉE par la FAÇADE CRÂNE (voir plus bas) — la bouche du
    // crâne est l'entrée sèche, face à l'océan
    // ---- MONTAGNE : le relief du terrain (world.js terrainH, pic visible
    // ~38 m) est LA montagne — ces massifs gshell en sont le NOYAU INTERNE :
    // étages 0-1 (voûte, colliders, sommet ~22) et étages 2-3 (dôme/crêtes,
    // sommet ~29) restent entièrement ENTERRÉS sous le terrain. La CHEMINÉE
    // EST FERMÉE : un massif central bouche l'ancien trou béant à chaque
    // étage. La bouche du crâne EST (x 281,8-284,2, z 159,5-170,5) reste
    // libre : c'est l'unique entrée, au fond d'une gorge que le canyon sec
    // découpe dans le flanc est de la montagne.
    {
      const CX = KX, CZ = KZ;
      const ROCK = 0x5b6472, ROCK_D = 0x4e5663;
      // ÉTAGE 0 (base, 12.9 -> 17.9) : les 3 massifs historiques (colliders)
      // + le massif OUEST (condamnation de l'ancienne bouche) + le massif
      // CENTRAL (fermeture de la cheminée : la voûte est pleine).
      // Massif est RACCOURCI : il s'arrête derrière la façade du crâne (est).
      gshell(281.5, 12.9, CZ, 5, 5, 40, ROCK_B);          // massif est (x 279-284)
      gshell(272, 12.9, CZ - 17.2, 36, 5, 16, ROCK_B);    // massif nord (z 139.8-155.8)
      gshell(269, 12.9, CZ + 13.85, 30, 5, 9.3, ROCK_B); // massif sud (z 174.2-183.5)
      gshell(256.5, 12.9, CZ, 4.2, 5, 28.6, ROCK_B);      // massif ouest (x 254.4-258.6)
      gshell(269, 12.9, CZ, 21.5, 5, 19, ROCK_B);         // massif central (x 258.25-279.75, z 155.5-174.5)
      // ÉTAGE 1 (17.9 -> 22.4) : CADRE complet autour du massif central
      gshell(282, 17.9, CZ, 4, 4.5, 40, ROCK_B);          // est (x 280-284)
      gshell(271, 17.9, CZ - 19, 34, 4.5, 14, ROCK_B);   // nord (z 139-153)
      gshell(270, 17.9, CZ + 18.5, 28, 4.5, 9, ROCK_B);   // sud (z 179-188)
      gshell(256.5, 17.9, CZ, 3, 4.5, 34, ROCK_B);        // ouest (x 255-258)
      gshell(269, 17.9, CZ, 22, 4.5, 28, ROCK_B);         // central (x 258-280, z 151-179)
      // ÉTAGE 2 (22.4 -> 26.4) : dômes décalés, crête plus étroite
      gshell(283, 22.4, CZ - 10, 6, 4, 16, ROCK_B);         // dôme NE (x 280-286, z 147-163)
      gshell(265, 22.4, CZ + 14, 8, 4, 10, ROCK_B);         // dôme SO (x 261-269, z 179-189)
      gshell(273, 22.4, CZ - 17, 30, 3.5, 5, ROCK_B);        // crête nord (z 140-145)
      gshell(273, 22.4, CZ + 17, 26, 3.5, 5, ROCK_B);        // crête sud (z 179-184)
      // ÉTAGE 3 (26.4 -> 29.4) : pointes sommitales
      gshell(282, 26.4, CZ - 10, 5, 3, 7, ROCK_B);           // pointe NE (x 279.5-284.5)
      gshell(266, 26.4, CZ + 14, 6, 3, 7, ROCK_B);           // pointe SO (z 179-186)
      // FACETTES : gdeco pour casser les faces planes et donner du relief
      // (plaquées sur les étages, jamais dans la bouche — les facettes est
      // sont calées sur les massifs raccourcis)
      for (const [bx, bz, by2, bs] of [[13, -14, 19.4, 5.5], [14, 2, 20.4, 6.0], [12, 16, 18.4, 5.0], [-13, -13, 19.4, 5.0], [-16, 8, 20.4, 5.5], [6, -19, 20.4, 4.5], [-3, 19, 19.4, 4.0]])
        gdeco(PRISM_GEO, ROCK_D, CX + bx, by2, CZ + bz, bs, bs, bs * 1.3, (MR() - 0.5) * 0.6, (MR() - 0.5) * 0.4, 0);
      // HERBE : tapis vert sur les surfaces supérieures réelles
      gdeco(BOX, 0x4a9b4f, 283, 26.8, CZ - 10, 6, 0.6, 12);   // dôme NE (x 280-286, z 147-163)
      gdeco(BOX, 0x4a9b4f, 265, 26.0, CZ + 14, 6, 0.6, 8);   // dôme SO (x 261-269, z 179-189)
      gdeco(BOX, 0x55884f, 273, 26.2, CZ - 17, 22, 0.5, 4);  // crête nord (z 140-145)
      gdeco(BOX, 0x55884f, 273, 26.2, CZ + 17, 18, 0.5, 4);  // crête sud (z 179-184)
      gdeco(BOX, 0x55884f, 282, 29.6, CZ - 10, 4, 0.5, 5);  // pointe NE (x 280-284)
      gdeco(BOX, 0x55884f, 266, 28.8, CZ + 14, 4.5, 0.5, 5); // pointe SO (z 179-186)
      gdeco(BOX, 0x55884f, 269, 26.2, CZ, 20, 0.5, 26);     // sommet du massif central (22.4 + herbe)
      // SAPINS : sur les crêtes réelles (y du sommet du bloc + 0.5) — les
      // sapins est sont calés sur le massif est raccourci (x 280-284)
      for (const [tx, tz, hy] of [[11, -10, 21.9], [12, -14, 22.4], [13, -12, 22.9], [12, 2, 21.9], [11, 8, 21.4], [12, 16, 20.9], [4, -20, 21.9], [10, -22, 22.9], [-8, 18, 21.4], [-12, 20, 20.9], [-3, 22, 21.4], [-4, -3, 22.4], [5, 4, 22.4], [1, -8, 22.4]]) {
        gdeco(PRISM_GEO, 0x2d5a35, CX + tx, hy + 1.8, CZ + tz, 1.4, 3.6, 1.4, 0, (MR() - 0.5) * 0.3, 0);
        gdeco(PRISM_GEO, 0x4a3423, CX + tx, hy + 0.4, CZ + tz, 0.5, 0.8, 0.5);
      }
      // la cheminée est FERMÉE : les massifs central (étages 0-1) bouchent
      // l'ancien trou béant, plus aucun jour au-dessus de la caverne
    }
    // roches irrégulières plaquées sur les parois
    for (const [bx, bz, by2, bs] of [[12.5, -5, 6.4, 2.4], [-12.4, 4, 8.4, 2.8], [-5, 12.5, 4.4, 2.2], [7, -12.4, 10.4, 2.6], [-12.5, -9, 11.4, 2.4], [12.4, 8, 11.2, 2.2]])
      gdeco(BOX, ROCK_C, KX + bx, by2, KZ + bz, bs, bs * 0.85, bs * 1.2, 0.3, 0.5, 0.2);
    // stalactites suspendues à la voûte (toutes sous les massifs pleins) + stalagmites
    for (const [sx2, sz2, sl] of [[15, -10, 2.6], [8, -15, 3.2], [12, -15, 2.2], [3, 12, 2.8], [-9, 11, 2.4], [16, 3, 2.0]])
      gdeco(PRISM_GEO, 0x8b939e, KX + sx2, 13.0 - sl, KZ + sz2, 1.1, sl, 1.1, Math.PI, 0, 0);
    for (const [sx2, sz2, sl] of [[6, 6, 1.6], [-8, -4, 2.0], [-2, 9, 1.4], [9, -2, 1.8]])
      gdeco(PRISM_GEO, 0x8b939e, KX + sx2, FY, KZ + sz2, 1.0, sl, 1.0, 0, 0, 0);

    // ---- QG DE BRUTUS : plateforme, piliers, escalier, garde-corps
    for (const [ox, oz] of [[-4.5, -2.8], [4.5, -2.8], [-4.5, 2.8], [4.5, 2.8]]) gshell(PX + ox, FY, PZ + oz, 0.7, 3.6, 0.7, 0x5a616c);
    gshell(PX, PT, PZ, 11, 0.55, 7, 0x5a616c);
    // escalier : descend vers l'OUEST le long du bord ouest de la plateforme —
    // il ne doit jamais barrer l'axe de la porte d'eau (couloir z 158-172).
    // Sommet de marche le plus proche de la plateforme à PT+0,55-0,45 (3,1) :
    // dernier dénivelé de 0,45 m gravissable en marchant (STEP 0,6).
    for (let i = 0; i < 8; i++) gshell(PX - 5.5 - 0.475 - i * 0.92, PT - 0.9 - 0.45 * i, PZ, 0.95, 1.0, 2.6, 0x5a616c);
    gdeco(BOX, 0x8a929e, PX, PT + 0.55, PZ - 3.5, 11, 0.9, 0.1);
    gdeco(BOX, 0x8a929e, PX, PT + 0.55, PZ + 3.5, 11, 0.9, 0.1);
    gdeco(BOX, 0x8a929e, PX + 5.5, PT + 0.55, PZ, 0.1, 0.9, 7);
    gdeco(BOX, 0x39424e, PX + 2, PT + 0.55, PZ - 1, 2.6, 0.8, 1.4); // table de commandement
    gdeco(BOX, 0x39ff88, PX + 2, PT + 1.0, PZ - 1, 1.6, 0.06, 0.9); // écran radar
    gdeco(BOX, 0x8a6a3a, PX - 3.2, PT + 0.55, PZ + 2, 1.2, 1.1, 1.2); // caisse
    gdeco(BOX, 0x6b5430, PX - 3.2, PT + 1.65, PZ + 2, 1.0, 0.1, 1.0);

    // ---- CASCADE : elle tombe du bord du massif sud sur le sol de la caverne
    // (cette fois SÈCHE : la salle est au-dessus de la mer, un petit bassin
    // turquoise peu profond reçoit l'eau au pied — purement décoratif)
    {
      const wx = KX + 10.5, wz = KZ + 10.5;
      grottoWaterfallTex = canvasTex((g, s) => {
        g.fillStyle = 'rgba(190,230,255,0.9)'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.5})`; g.fillRect(Math.random() * s, Math.random() * s, 2 + Math.random() * 4, 12 + Math.random() * 30); }
      }, 128);
      grottoWaterfallTex.wrapS = grottoWaterfallTex.wrapT = THREE.RepeatWrapping;
      const wf = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 14, 12, 1, true), new THREE.MeshBasicMaterial({ map: grottoWaterfallTex, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
      wf.position.set(273, 10.4, 173.5); scene.add(wf);
      grottoPoolPos = new THREE.Vector3(273, FY, 173.5); // éclaboussures au pied de la cascade
      const pool = new THREE.Mesh(CYL_GEO, matC(0x53d8e8, { transparent: true, opacity: 0.7, roughness: 0.15 }));
      pool.scale.set(2.4, 0.14, 2.4); pool.position.set(273, FY + 0.07, 173.5); scene.add(pool);
    }

    // ---- CRISTAUX LUMINEUX CYAN (maillage émissif fusionné)
    {
      const crysGeos = [];
      const crys = (x, y, z, s) => {
        _de.set(rand(-0.3, 0.3), 0, rand(-0.3, 0.3), 'XYZ'); _dq.setFromEuler(_de);
        _dm.compose(_dp.set(x, y, z), _dq, _ds.set(s, s * 1.8, s));
        crysGeos.push(colorize(PRISM_GEO.clone().applyMatrix4(_dm), hcol(0x9fe8ff)));
      };
      for (const [cx2, cy2, cz2, s] of [[12.2, 5.4, -6, 0.9], [9, 5.4, -7, 1.1], [-6, 4.4, 12.2, 0.8], [12.2, 11.4, 6, 1.0], [4, 12.3, -12.2, 0.7], [-11, 12.1, 9, 0.9]]) crys(KX + cx2, cy2, KZ + cz2, s);
      const crysMesh = new THREE.Mesh(mergeGeometries(crysGeos), matC(0x53e0ff, { emissive: 0x17a0c8, emissiveIntensity: 1.7, roughness: 0.25 }));
      crysMesh.castShadow = true; scene.add(crysMesh);
    }

    // ---- LANTERNES (entrée) et éclairage de la caverne
    const lampM = matC(0xffd9a0, { emissive: 0xff9a2e, emissiveIntensity: 1.6 });
    const lampAt = (x, y, z) => { const l = new THREE.Mesh(BOX, lampM); l.scale.set(0.32, 0.5, 0.32); l.position.set(x, y, z); scene.add(l); };
    lampAt(279.5, 5.6, 158.0); // entrée de la caverne, sous l'arche rocheuse
    const addCaveLight = (x, y, z, color, intensity, dist) => { const L = new THREE.PointLight(color, intensity, dist); L.position.set(x, y, z); scene.add(L); };
    addCaveLight(KX, 11.4, KZ, 0x66d9ff, 14, 34); // caverne
    addCaveLight(KX + 4, 6.4, KZ + 6.5, 0x7fd0ff, 9, 20); // cascade
    addCaveLight(PX, PT + 2.5, PZ, 0xffc98a, 8, 18); // QG
    addCaveLight(261, 9.4, 158, 0xffd9b0, 5, 12); // crâne de l'Ombre

    // ---- FAÇADE CRÂNE : la bouche du crâne EST l'entrée de la Grotte. Le
    // visage est sculpté dans la face EST de la montagne, FACE À L'OCÉAN
    // (+X, au-dessus du canyon sec), au-dessus d'un palier SÈC à 3,4 (sol de
    // la caverne, au-dessus du niveau de la mer). Comme la référence : une
    // paroi PLEINE gris clair (contraste fort avec la montagne sombre) avec
    // deux grandes orbites NOIRES asymétriques, un nez triangulaire noir, une
    // rangée de grosses dents blanches au-dessus de la bouche-entrée, PAS de
    // mâchoire inférieure : passage libre au sol — on entre à pied sec.
    {
      const skullStart = grottoGeos.length;
      const SK = 0xb6bcc4, SKD = 0x7d858f, SKK = 0x0b0e13;
      const FX = 283.0;   // plan de la façade (face EST de la montagne)
      const FY = 3.4;    // sol de la bouche (au-dessus de la mer)
      const FACE = FX + 1.2; // face avant de la paroi (x = 284.2, côté océan)
      // === STRUCTURE PLEINE : mur supérieur massif au-dessus de la bouche
      // (y 8.8-20.9, z 154-176) + tempes latérales de part et d'autre de la
      // bouche (z 149.5-159.5 et 170.5-180.5, y 3.4-15.4). La bouche (z 159.5-
      // 170.5, y 3.4-8.8) reste un VIDE traversant jusqu'à la caverne.
      gshell(FX, 8.8, 165, 2.4, 12.1, 22, SK);   // mur plein (frontal+lèvre)
      gshell(FX, FY, 154.5, 2.4, 12.0, 10, SK);  // tempe gauche (z 149.5-159.5)
      gshell(FX, FY, 175.5, 2.4, 12.0, 10, SK);  // tempe droite (z 170.5-180.5)
      // === ORBITES : grandes plaques NOIRES plaquées sur la face avant de la
      // paroi pleine, avec un rebord gris plus sombre pour l'effet creusé.
      // GAUCHE : centre z=160, y=14.4 (6.4 de large, 4.6 de haut), inclinée
      // (bord intérieur plus bas, regard menaçant vers l'océan)
      gdeco(BOX, SKD, FACE + 0.05, 14.4, 160.0, 0.2, 5.4, 7.2, 0.15);   // rebord gauche
      gdeco(BOX, SKK, FACE + 0.1, 14.4, 160.0, 0.25, 4.6, 6.4, 0.15);   // orbite noire gauche
      // DROITE (ASYMÉTRIQUE : plus haute, plus étroite), inclinée en miroir
      gdeco(BOX, SKD, FACE + 0.05, 15.0, 170.3, 0.2, 5.2, 6.8, -0.15);  // rebord droit
      gdeco(BOX, SKK, FACE + 0.1, 15.0, 170.3, 0.25, 4.4, 6.0, -0.15); // orbite noire droite
      // === NEZ : triangle noir pointant vers le bas, plaqué sur la face avant,
      // entre les orbites et au-dessus de la bouche (y 10.2-13.6). Rotation
      // Y=+π/2 pour que la FACE TRIANGULAIRE regarde vers +X (l'océan),
      // puis X=π pour pointer le sommet vers le bas.
      gdeco(PRISM_GEO, SKK, FACE + 0.15, 11.6, 165, 2.8, 2.6, 0.3, Math.PI, Math.PI / 2, 0);
      // === DENTS : grosses dents blanches irrégulières suspendues au linteau
      // (haut y 8.8), pointes vers 6.8-7.7, plaquées sur la face avant
      const teeth = [[-5.6, 1.8], [-4.1, 1.2], [-2.6, 2.0], [-1.1, 1.4], [0.4, 1.9], [1.9, 1.1], [3.4, 1.6]];
      for (const [dz, len] of teeth)
        gdeco(PRISM_GEO, 0xf2efe6, FACE + 0.15, 8.8, 165 + dz, 1.45, len, 0.4, Math.PI, Math.PI / 2, 0);
      // DÔME DU CRÂNE : arrondi au-dessus du frontal, large et proéminent
      // (dépasse en avant de la façade = front du crâne) — sommet qui émerge
      // devant la montagne sombre, côté océan, rejoint le massif NE sans
      // trou de ciel
      gdeco(BOX, SK, FX + 1.3, 19.9, 165, 2.2, 2.5, 27, 0, 0, 0);
      gdeco(BOX, SK, FX + 1.1, 22.0, 165, 1.8, 1.6, 19, 0, 0, 0);
      gdeco(BOX, SK, FX + 0.8, 23.3, 165, 1.2, 1.2, 13, 0, 0, 0);
      // éclairage chaud devant la façade pour faire ressortir le visage
      // (au-dessus du canyon, côté océan)
      addCaveLight(288, 12.4, 165, 0xffe0b8, 8, 18);
      // === INTÉRIEUR DE LA BOUCHE : parois latérales sombres dans l'épaisseur
      // du passage (assombrissent l'entrée sans la boucher)
      gdeco(BOX, SKK, 282.2, 5.9, 159.2, 1.6, 5, 0.8);            // paroi gauche
      gdeco(BOX, SKK, 282.2, 5.9, 170.8, 1.6, 5, 0.8);           // paroi droite
      gdeco(BOX, SKK, 282.2, 8.2, 165, 1.6, 1.2, 11.6);          // plafond sombre
      // bornes du crâne exposées à la QA (le relief est bien dans la falaise)
      const sb = new THREE.Box3(), tb = new THREE.Box3();
      for (let i = skullStart; i < grottoGeos.length; i++) {
        if (!grottoGeos[i].geo.boundingBox) grottoGeos[i].geo.computeBoundingBox();
        sb.union(tb.copy(grottoGeos[i].geo.boundingBox).applyMatrix4(grottoGeos[i].m));
      }
      grottoSkullBounds = sb;
    }

    // (l'ancienne ENTRÉE OUEST est condamnée : la paroi ouest de la caverne est
    // pleine et la montagne la recouvre — plus de linteau ni de passage côté île)

    // ---- PASSERELLE MÉTALLIQUE le long du mur sud + conteneurs et cuve :
    // habillage industriel de la base souterraine de l'Ombre
    {
      const WM = 0x5a616c;
      gshell(267.3, 6.7, 176.7, 17.4, 0.5, 2.2, WM); // tablier le long du mur sud
      for (const cxp of [275, 262.4, 258.2]) gdeco(BOX, 0x39424e, cxp, 5.5, 177.3, 0.5, 1.2, 0.4); // consoles
      gdeco(BOX, 0x8a929e, 267.3, 7.9, 175.65, 17.4, 0.9, 0.1); // garde-corps
      for (let i = 0; i < 5; i++) gdeco(BOX, 0x8a929e, 275.5 - i * 4.1, 7.9, 175.65, 0.12, 0.9, 0.12); // poteaux
      // escalier d'accès depuis le sol de la caverne (côté ouest) : les
      // marches MONTENT vers le tablier (dernière marche à 6,75, à 0,45 m
      // sous le dessus du tablier 7,2 — dénivelé gravissable en marchant)
      for (let i = 0; i < 8; i++) gshell(259.8, 2.6 + 0.45 * i, 168.6 + i * 0.92, 2.2, 1.0, 0.95, WM);
      // conteneurs de fret (posés au sec sur le sol de la caverne)
      makeStructBox(274, 3.4, 173.5, 6.5, 2.8, 2.8, matC(0xb03a2e, { metalness: 0.3, roughness: 0.6 }), { hp: 320, mat: 'metal' });
      makeStructBox(277, 3.4, 155.5, 2.8, 2.8, 6.5, matC(0x2980b9, { metalness: 0.3, roughness: 0.6 }), { hp: 320, mat: 'metal' });
      // cuve cylindrique contre le mur nord-est
      const tank = new THREE.Mesh(CYL_GEO, matC(0x8fa3ad, { metalness: 0.4, roughness: 0.5 }));
      tank.scale.set(2.6, 4, 2.6); tank.position.set(280.5, 5.4, 155); tank.castShadow = true; scene.add(tank);
      propBox(280.5, 3.4, 155, 1.3, 1.3, 4); // cuve : solide
    }

    // ---- SURFACE : deux bunkers et un hélipad sur le plateau du POI (13,4, plat)
    // bunker 1 : sud du plateau, hors des massifs de la montagne
    buildHouse(p.x - 5, p.z + 25, p.h, 10, 9, 2, 'bunker');
    // bunker 2 : sud-ouest, sur le plateau plat, à l'écart de la montagne
    buildHouse(p.x - 32, p.z + 15, p.h, 10, 8, 0, 'bunker');
    {
      const hx = p.x - 22, hz = p.z + 18;
      makeStructBox(hx, p.h - 0.35, hz, 6.4, 0.45, 6.4, matC(0x3a3f47, { metalness: 0.3, roughness: 0.6 }), { indestructible: true });
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.1, 20), matC(0x1f2430)); ring.position.set(hx, p.h + 0.2, hz); scene.add(ring);
      for (const [mx, mz, mw, md] of [[-0.7, 0, 0.4, 1.6], [0.7, 0, 0.4, 1.6], [0, 0, 1.4, 0.4]]) { const m = new THREE.Mesh(BOX, matC(0xffd23f)); m.scale.set(mw, 0.05, md); m.position.set(hx + mx, p.h + 0.26, hz + mz); scene.add(m); }
    }
    // blocs erratiques sur le plateau (13,4), loin de la montagne
    for (const [bx, bz, bs] of [[-26, 21, 2.6], [-14, -17, 3.2], [-34, 25, 2.2], [-28, 23, 2.8], [-22, -20, 2.4]])
      gshell(G.cx + bx, terrainH(G.cx + bx, G.cz + bz) - 0.5, G.cz + bz, bs, bs, bs * 1.3, ROCK_C);

    // ---- COFFRE-FORT ET CABINE DANS LA CAVERNE
    buildVault(p, { x: KX - 1.5, y: FY, z: KZ + 5.5 }); // déplacé : libère la face du contrefort pour le crâne
    buildPhoneBooth(p, { x: KX - 6.5, y: FY, z: KZ + 5 }); // déplacée : libère le pied de l'escalier de la passerelle

    // ---- COFFRES, MUNITIONS ET BUTIN
    spawnChest(KX + 9, FY + 0.05, KZ - 6);
    spawnChest(KX - 6, FY + 0.05, KZ + 1);
    spawnChest(PX + 2, PT + 0.55, PZ);
    spawnChest(KX - 6, FY + 0.05, KZ + 8);
    ammoBoxes.push(spawnAmmoBox(KX - 3, FY + 0.05, KZ - 5));
    ammoBoxes.push(spawnAmmoBox(PX - 3, PT + 0.55, PZ - 1));
    lootSpots.push({ x: KX - 1, y: FY + 0.6, z: KZ - 10 });
    lootSpots.push({ x: KX + 10, y: FY + 0.6, z: KZ - 2 });
    lootSpots.push({ x: KX - 5, y: FY + 0.6, z: KZ + 9 });
    lootSpots.push({ x: PX - 2, y: PT + 0.7, z: PZ + 1 });
    lootSpots.push({ x: KX + 11, y: FY + 0.6, z: KZ + 5 });

    // fusion de toutes les roches de la grotte en un seul maillage
    finishGrotto();
  } else if (p.key === 'rig') {
    // LA PLATEFORME — refonte totale : vraie plate-forme pétrolière EN PLEINE
    // MER (l'îlot dessous a été retiré du terrain). Quatre pieds géants ancrés
    // sur les fonds marins, entretoisements en X, pont principal 32x24 avec
    // garde-corps jaunes, tour de forage à croisillons, grue rouge, hélipad en
    // porte-à-faux, torchère allumée, canot de sauvetage et passerelle vers
    // la station de contrôle.
    const DY = RIG_DY, DT = RIG_DT; // dessous / dessus du pont
    curHouse = { boxes: [], deco: [], mesh: null };
    const STEEL = (m) => matC(0x46586a, Object.assign({ metalness: 0.4, roughness: 0.55 }, m));
    // entretoise / diagonale décorative entre deux points (coordonnées absolues)
    const brace = (x1, y1, z1, x2, y2, z2, hex = 0x3d4c5c) => {
      const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, L = Math.hypot(dx, dy, dz);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, mz = (z1 + z2) / 2;
      if (Math.abs(dx) >= Math.abs(dz)) hdeco(BOX, hex, mx, my, mz, L, 0.24, 0.24, 0, 0, Math.atan2(dy, dx));
      else hdeco(BOX, hex, mx, my, mz, 0.24, 0.24, L, -Math.atan2(dy, dz), 0, 0);
    };
    // ---- STRUCTURE SOUS-MARINE : 4 pieds du fond marin (-6,5) au pont (DY)
    const LEGS = [[-12, -9], [12, -9], [-12, 9], [12, 9]];
    for (const [lx, lz] of LEGS) {
      makeStructBox(p.x + lx, -6.5, p.z + lz, 2.6, 21.1, 2.6, STEEL(), { indestructible: true });
      hdeco(CYL_GEO, 0x46586a, p.x + lx, 0.8, p.z + lz, 3.1, 1.5, 3.1); // jupe de flottaison
      hdeco(CYL_GEO, 0xf1c40f, p.x + lx, 0.1, p.z + lz, 3.1, 0.45, 3.1); // bande jaune à la ligne de flottaison
      hdeco(CYL_GEO, 0x8fa3ad, p.x + lx, DY - 1.4, p.z + lz, 3.3, 0.5, 3.3); // collier de jonction sous le pont
    }
    // entretoisements horizontaux (visibles à travers l'eau) + diagonales en X
    for (const y of [-2.5, 5.5]) {
      brace(p.x - 12, y, p.z - 9, p.x + 12, y, p.z - 9); brace(p.x - 12, y, p.z + 9, p.x + 12, y, p.z + 9);
      brace(p.x - 12, y, p.z - 9, p.x - 12, y, p.z + 9); brace(p.x + 12, y, p.z - 9, p.x + 12, y, p.z + 9);
    }
    for (const [ax, az] of [[-12, -9], [12, 9]]) {
      brace(p.x + ax, 0.5, p.z + az, p.x + ax, DY - 0.8, p.z - az, 0x51657a);
      brace(p.x + ax, DY - 0.8, p.z + az, p.x + ax, 0.5, p.z - az, 0x51657a);
      brace(p.x + ax, 0.5, p.z + az, p.x - ax, DY - 0.8, p.z + az, 0x51657a);
      brace(p.x + ax, DY - 0.8, p.z + az, p.x - ax, 0.5, p.z + az, 0x51657a);
    }
    // ---- PONT PRINCIPAL : plaque 32x24, dessus à DT (14,6)
    makeStructBox(p.x, DY, p.z, 32, 1.2, 24, matC(0x3d4c5c, { metalness: 0.35, roughness: 0.6 }), { indestructible: true });
    // jupe de coque sous le pont + hublots dorés sur les deux longs côtés
    const skirt = (sx2, sz2, w2, d2) => makeStructBox(p.x + sx2, DY - 2.1, p.z + sz2, w2, 2.1, d2, STEEL(), { indestructible: true });
    skirt(0, -11.8, 32, 1.2); skirt(0, 11.8, 32, 1.2); skirt(-15.4, 0, 1.2, 24); skirt(15.4, 0, 1.2, 24);
    for (let i = 0; i < 11; i++) {
      hdeco(BOX, 0xffd23f, p.x - 12.5 + i * 2.5, DY - 1.05, p.z - 12.5, 0.55, 0.55, 0.15);
      hdeco(BOX, 0xffd23f, p.x - 12.5 + i * 2.5, DY - 1.05, p.z + 12.5, 0.55, 0.55, 0.15);
    }
    // lignes de sécurité jaunes peintes au sol, le long des bords du pont
    for (const [rx, rz, rw, rd] of [[0, 11.6, 30, 0.5], [0, -11.6, 30, 0.5], [15.6, 0, 0.5, 23], [-15.6, 0, 0.5, 23]])
      hdeco(BOX, 0xf1c40f, p.x + rx, DT + 0.015, p.z + rz, rw, 0.03, rd);
    // ---- GARDE-CORPS JAUNES (décoratifs) : poteaux + deux lisses, trous
    // laissés pour l'hélipad (ouest), la passerelle (est) et la grue
    const rail = (x1, z1, x2, z2) => {
      const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz);
      const n = Math.max(2, Math.round(L / 3)), ry = -Math.atan2(dz, dx);
      const mx = p.x + (x1 + x2) / 2, mz = p.z + (z1 + z2) / 2;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        hdeco(BOX, 0xf1c40f, p.x + x1 + dx * t, DT + 0.55, p.z + z1 + dz * t, 0.12, 1.1, 0.12);
      }
      for (const rh of [0.45, 0.95]) hdeco(BOX, 0xf1c40f, mx, DT + rh, mz, L, 0.07, 0.07, 0, ry, 0);
    };
    rail(-15.6, 11.6, 15.6, 11.6); // sud
    rail(-15.6, -11.6, 15.6, -11.6); // nord
    rail(-15.6, -11.6, -15.6, -7); rail(-15.6, -1, -15.6, 11.6); // ouest (trou hélipad)
    rail(15.6, -11.6, 15.6, 4); rail(15.6, 9.5, 15.6, 11.6); // est (trou passerelle)
    // ---- CONTENEURS INDUSTRIELS le long du bord sud (le coffre-fort garde sa place)
    const CC = [0xc0392b, 0x2980b9, 0xf1c40f, 0x27ae60];
    for (let k = 0; k < 3; k++)
      makeStructBox(p.x - 10 + k * 7, DT, p.z + 9, 6.5, 2.8, 2.8, matC(CC[k], { metalness: 0.3, roughness: 0.6 }), { hp: 320, mat: 'metal' });
    makeStructBox(p.x - 12, DT, p.z - 2, 6.5, 2.8, 2.8, matC(0xecf0f1, { metalness: 0.3, roughness: 0.6 }), { hp: 320, mat: 'metal' });
    // barils
    for (const [bx, bz, c] of [[-4.5, -8.5, 0xb03a2e], [-3.4, -8.9, 0x2c5f8a], [-4.1, -7.6, 0xf1c40f], [12.5, 8.5, 0xb03a2e], [13.4, 7.8, 0x2c5f8a]]) {
      hdeco(CYL_GEO, c, p.x + bx, DT + 0.55, p.z + bz, 0.9, 1.1, 0.9);
      hdeco(CYL_GEO, 0x22262f, p.x + bx, DT + 1.12, p.z + bz, 0.95, 0.08, 0.95);
    }
    // ---- CONDUITES JAUNES + ÉVENTS le long du bord nord
    hdeco(BOX, 0xf1c40f, p.x - 3, DT + 1.35, p.z - 10.9, 22, 0.35, 0.35);
    hdeco(BOX, 0xf1c40f, p.x - 3, DT + 1.75, p.z - 10.9, 22, 0.35, 0.35);
    propBox(p.x - 3, DT + 1.2, p.z - 10.9, 11, 0.25, 0.7); propBox(p.x - 3, DT + 1.6, p.z - 10.9, 11, 0.25, 0.7); // conduites-garde-corps solides
    for (const [vx, vz] of [[-11, -8], [-11, -10.2]]) {
      hdeco(CYL_GEO, 0x8fa3ad, p.x + vx, DT + 3.2, p.z + vz, 0.7, 3.6, 0.7);
      hdeco(CYL_GEO, 0xf1c40f, p.x + vx, DT + 5.2, p.z + vz, 0.85, 0.5, 0.85);
      propBox(p.x + vx, DT + 1.4, p.z + vz, 0.85, 0.85, 4.3); // cheminée : solide
    }
    // ---- TOUR DE FORAGE (nord-est du pont) : 4 montants + croisillons + couronne
    {
      const dx = p.x + 10.5, dz = p.z - 9.5;
      for (const [ox, oz] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]])
        makeStructBox(dx + ox, DT, dz + oz, 0.9, 17, 0.9, matC(0x9aa7b4, { metalness: 0.5, roughness: 0.45 }), { indestructible: true });
      for (let lv = 0; lv < 4; lv++) {
        const y0 = DT + 1 + lv * 4, y1 = y0 + 4;
        brace(dx - 2.6, y0, dz - 2.6, dx - 2.6, y1, dz + 2.6, 0x8fa3ad); brace(dx - 2.6, y1, dz - 2.6, dx - 2.6, y0, dz + 2.6, 0x8fa3ad);
        brace(dx + 2.6, y0, dz - 2.6, dx + 2.6, y1, dz + 2.6, 0x8fa3ad); brace(dx + 2.6, y1, dz - 2.6, dx + 2.6, y0, dz + 2.6, 0x8fa3ad);
        brace(dx - 2.6, y0, dz - 2.6, dx + 2.6, y1, dz - 2.6, 0x8fa3ad); brace(dx - 2.6, y1, dz - 2.6, dx + 2.6, y0, dz - 2.6, 0x8fa3ad);
        brace(dx - 2.6, y0, dz + 2.6, dx + 2.6, y1, dz + 2.6, 0x8fa3ad); brace(dx - 2.6, y1, dz + 2.6, dx + 2.6, y0, dz + 2.6, 0x8fa3ad);
        // lisses horizontales de niveau
        for (const s of [-1, 1]) { hdeco(BOX, 0x8fa3ad, dx, y1, dz + s * 2.6, 5.2, 0.16, 0.16); hdeco(BOX, 0x8fa3ad, dx + s * 2.6, y1, dz, 0.16, 0.16, 5.2); }
      }
      // couronne + cabine de couronnement + balise
      hdeco(BOX, 0x9aa7b4, dx, DT + 17.6, dz, 6, 0.7, 6);
      hdeco(BOX, 0xbcd8e8, dx, DT + 18.7, dz, 2.6, 1.6, 2.6);
      hdeco(CYL_GEO, 0x22262f, dx, DT + 21.4, dz, 0.3, 1.9, 0.3);
      const beacon = new THREE.Mesh(CYL_GEO, new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
      beacon.scale.set(0.4, 0.4, 0.4); beacon.position.set(dx, DT + 22.6, dz); scene.add(beacon);
      // colonne de forage : traverse le pont jusqu'à la mer
      hdeco(CYL_GEO, 0x22262f, dx, DT - 2.6, dz, 0.6, 22, 0.6);
      propBox(dx, DT - 13, dz, 0.35, 0.35, 20); // colonne : solide
      // panneau rayé d'avertissement au pied
      for (let i = 0; i < 5; i++) hdeco(BOX, i % 2 ? 0x22262f : 0xf1c40f, dx - 2.6 + i * 1.3, DT + 1.4, dz + 3.1, 1.3, 2.8, 0.1);
    }
    // ---- GRUE ROUGE : mât + flèche inclinée + contrepoids + câble + crochet
    {
      const cx = p.x + 10, cz = p.z + 5, base = DT;
      makeStructBox(cx, base, cz, 1.3, 17, 1.3, matC(0xb03a2e, { metalness: 0.3, roughness: 0.5 }), { indestructible: true });
      hdeco(BOX, 0xb03a2e, cx - 5.5, base + 16.2, cz, 12, 0.7, 0.9, 0, 0, 0.1);
      hdeco(BOX, 0xb03a2e, cx + 2.2, base + 15.4, cz, 2.4, 1.4, 1.6);
      hdeco(BOX, 0xf1c40f, cx, base + 8.5, cz, 1.5, 1.2, 1.5); // cabine de grue
      propBox(cx - 5.5, base + 15.5, cz, 6, 0.45, 1.4); // flèche inclinée : solide
      propBox(cx + 2.2, base + 14.7, cz, 1.2, 0.8, 1.4); // contrepoids : solide
      hdeco(BOX, 0x22262f, cx - 10.6, base + 9, cz, 0.12, 12, 0.12);
      hdeco(BOX, 0x3a3f47, cx - 10.6, base + 2.6, cz, 0.7, 0.5, 0.7);
      propBox(cx - 10.6, base + 3, cz, 0.1, 0.1, 12); // câble : solide
      propBox(cx - 10.6, base + 2.35, cz, 0.35, 0.35, 0.5); // crochet : solide
    }
    // ---- TORCHÈRE (sud-ouest) : cheminée + flamme vivante + lumière
    {
      const fx = p.x - 14, fz = p.z + 10.5;
      propBox(fx, DT, fz, 0.6, 0.6, 12); // cheminée : solide
      hdeco(CYL_GEO, 0x8fa3ad, fx, DT + 6, fz, 1.1, 12, 1.1);
      hdeco(CYL_GEO, 0x3a3f47, fx, DT + 12.3, fz, 1.5, 0.6, 1.5); // couronne
      hdeco(CYL_GEO, 0xb03a2e, fx, DT + 0.4, fz, 1.6, 0.25, 1.6); // collier rouge
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.6, 8), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.95 }));
      flame.position.set(fx, DT + 13.8, fz); scene.add(flame);
      const fl = new THREE.PointLight(0xff8c2a, 2.4, 26, 2); fl.position.set(fx, DT + 13.5, fz); scene.add(fl);
      rigFlare = { flame, light: fl };
    }
    // feux de navigation sur les coins du pont (rouge ouest / vert est)
    for (const [nx, nz, c] of [[-15.5, -11.5, 0xff3b30], [-15.5, 11.5, 0xff3b30], [15.5, -11.5, 0x2ecc71], [15.5, 11.5, 0x2ecc71]]) {
      hdeco(BOX, 0x3a3f47, p.x + nx, DT + 0.45, p.z + nz, 0.1, 0.9, 0.1);
      const dot = new THREE.Mesh(CYL_GEO, new THREE.MeshBasicMaterial({ color: c }));
      dot.scale.set(0.28, 0.28, 0.28); dot.position.set(p.x + nx, DT + 1, p.z + nz); scene.add(dot);
    }
    // ---- CANOT DE SAUVETAGE (sud-est) sur ses daviers
    {
      const bx = p.x + 13, bz = p.z + 10.8;
      hdeco(BOX, 0x8fa3ad, bx - 1.6, DT + 1.3, bz, 0.15, 1.5, 0.15); hdeco(BOX, 0x8fa3ad, bx + 1.6, DT + 1.3, bz, 0.15, 1.5, 0.15);
      hdeco(BOX, 0xe67e22, bx, DT + 1.05, bz, 3.4, 0.9, 1.3); // coque
      hdeco(BOX, 0xf5f6fa, bx, DT + 1.6, bz, 3.0, 0.3, 1.0); // cabine
      propBox(bx, DT + 0.7, bz, 1.7, 0.65, 0.5); // canot : solide
    }
    // ---- HÉLIPAD JAUNE en porte-à-faux à l'ouest (niveau du pont), marquage H
    makeStructBox(p.x - 20, DY + 0.4, p.z - 4, 8, 0.8, 8, matC(0x2b3a4a, { metalness: 0.3, roughness: 0.6 }), { indestructible: true });
    hdeco(BOX, 0xf1c40f, p.x - 20, DT + 0.02, p.z - 4, 7.2, 0.05, 7.2); // liseré jaune
    hdeco(BOX, 0x22262f, p.x - 20 - 0.9, DT + 0.07, p.z - 4, 0.55, 0.1, 2.6);
    hdeco(BOX, 0x22262f, p.x - 20 + 0.9, DT + 0.07, p.z - 4, 0.55, 0.1, 2.6);
    hdeco(BOX, 0x22262f, p.x - 20, DT + 0.07, p.z - 4, 1.8, 0.1, 0.55);
    // balises d'angle de l'hélipad
    for (const [hx, hz] of [[-3.4, -3.4], [3.4, -3.4], [-3.4, 3.4], [3.4, 3.4]]) {
      const dot = new THREE.Mesh(CYL_GEO, new THREE.MeshBasicMaterial({ color: 0xffd23f }));
      dot.scale.set(0.25, 0.25, 0.25); dot.position.set(p.x - 20 + hx, DT + 0.35, p.z - 4 + hz); scene.add(dot);
      hdeco(BOX, 0x3a3f47, p.x - 20 + hx, DT + 0.15, p.z - 4 + hz, 0.1, 0.5, 0.1);
    }
    // sous-structure de l'hélipad : poutre + diagonales
    makeStructBox(p.x - 18.5, DY - 2.4, p.z - 4, 5, 0.8, 1.2, STEEL(), { indestructible: true });
    brace(p.x - 16, DY - 1, p.z - 8, p.x - 20, DY - 1.6, p.z - 4, 0x51657a);
    brace(p.x - 16, DY - 1, p.z + 0, p.x - 20, DY - 1.6, p.z - 4, 0x51657a);
    // ---- PASSERELLE vers la station de contrôle (est) + station sur pied propre
    makeStructBox(p.x + 17, DY + 0.4, p.z + 7, 9, 0.8, 2.6, matC(0x2b3a4a, { metalness: 0.3, roughness: 0.6 }), { indestructible: true });
    hdeco(BOX, 0xf1c40f, p.x + 17, DT + 0.05, p.z + 7, 8.6, 0.06, 0.5); // ligne de sécurité centrale
    for (const [fx, fz] of [[-2.6, -1], [2.6, 1], [-2.6, 1], [2.6, -1]]) {
      hdeco(BOX, 0xf1c40f, p.x + 17 + fx, DT + 0.55, p.z + 7 + fz, 0.15, 1.1, 0.15);
      propBox(p.x + 17 + fx, DT, p.z + 7 + fz, 0.1, 0.1, 1.1); // poteaux : solides
    }
    for (const rh of [0.45, 0.95]) hdeco(BOX, 0xf1c40f, p.x + 17, DT + rh, p.z + 7, 8.6, 0.07, 0.07);
    makeStructBox(p.x + 24, -6.5, p.z + 7, 2.4, 21.1, 2.4, STEEL(), { indestructible: true });
    brace(p.x + 12, 0.5, p.z + 7, p.x + 24, DY - 0.8, p.z + 7, 0x51657a);
    makeStructBox(p.x + 24, DY + 0.2, p.z + 7, 7, 1, 7, matC(0x9fb4c7, { metalness: 0.2, roughness: 0.5 }), { indestructible: true });
    makeStructBox(p.x + 24, DT, p.z + 7, 4.6, 3, 3.6, matC(0xbcd8e8, { metalness: 0.1, roughness: 0.4 }), { indestructible: true });
    hdeco(BOX, 0x2c5f8a, p.x + 24, DT + 1.3, p.z + 5.15, 4.2, 0.8, 0.1); // baies vitrées
    hdeco(BOX, 0x2c5f8a, p.x + 24, DT + 1.3, p.z + 8.85, 4.2, 0.8, 0.1);
    hdeco(CYL_GEO, 0xf1c40f, p.x + 24, DT + 4.4, p.z + 7, 0.25, 3, 0.25); // antenne
    // radar satellite tourné vers le ciel
    hdeco(CYL_GEO, 0xd8e4ee, p.x + 21.5, DT + 4.6, p.z + 9.5, 2.2, 0.35, 2.2, 0.9, 0, 0);
    hdeco(BOX, 0x8fa3ad, p.x + 21.5, DT + 3.6, p.z + 9.5, 0.2, 1.6, 0.2);
    propBox(p.x + 24, DT + 2.9, p.z + 7, 0.25, 0.25, 3); // antenne : solide
    { const H = curHouse; curHouse = null; finishHouse(H); }
    spawnChest(p.x - 5, DT + 0.1, p.z + 6);
    spawnChest(p.x + 8, DT + 0.1, p.z + 6);
    spawnChest(p.x - 6, DT + 0.1, p.z - 6.5);
    lootSpots.push({ x: p.x, y: DT + 0.7, z: p.z });
    lootSpots.push({ x: p.x - 8, y: DT + 0.7, z: p.z - 2 });
    lootSpots.push({ x: p.x + 5, y: DT + 0.7, z: p.z - 3 });
    buildVault(p, { x: p.x, y: DT, z: p.z - 5 });
    buildPhoneBooth(p, { x: p.x - 8, y: DT, z: p.z + 5 });
    placePad(p.x + 16, p.z);
    placePad(p.x - 16, p.z);
  }
  if (p.key === 'shark') { // îlot réduit : le coffre-fort reste à l'est, à sa place (sinon vaultSpot le collerait à l'escalier)
    buildVault(p, { x: p.x + 17, y: 2.45, z: p.z }); buildPhoneBooth(p);
  } else if (p.key !== 'yacht' && p.key !== 'rig' && p.key !== 'grotto' && p.key !== 'agency') { buildVault(p); buildPhoneBooth(p); }
  if (p.key === 'agency') placePad(p.x - 44, p.z + 12);
}
const spySpot0 = lootSpots.length;
for (const p of POIS) if (p.spy) buildSpyPOI(p);
// le loot des nouveaux emplacements (le spawn général a déjà tourné plus haut)
for (const s of lootSpots.slice(spySpot0)) {
  const it = R() < 0.65 ? randWeaponItem() : randConsum();
  spawnLoot(it, s.x, s.y, s.z, false);
  if (it.kind === 'weapon') spawnLoot(ammoFor(it.id), s.x + 0.8, s.y, s.z + 0.3, false);
}

// =====================================================================
// POI banner & map markers
// =====================================================================
let poiNow = null, poiAcc = 0;
function checkPOIBanner() {
  poiAcc += 1 / 60; if (poiAcc < 0.3) return; poiAcc = 0;
  const p = inPOI(player.pos.x, player.pos.z, 4);
  const h = terrainH(player.pos.x, player.pos.z);
  const name = p ? p.name : (h < 1.6 && h > -0.5 ? BIOME_NAMES.beach : BIOME_NAMES[biomeAt(player.pos.x, player.pos.z)]);
  if (name !== poiNow) {
    const named = !!p; poiNow = name;
    const el = document.getElementById('poiBanner');
    el.innerHTML = named ? `<small>VOUS ENTREZ DANS</small>${name.toUpperCase()}` : `<small>ZONE</small>${name.toUpperCase()}`;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); el.classList.toggle('minor', !named);
  }
}
const marker = { on: false, pos: new THREE.Vector3(), mesh: null };
{
  const g = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 120, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  beam.position.y = 60; g.add(beam);
  const dia = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), new THREE.MeshBasicMaterial({ color: 0xffd23f })); dia.position.y = 2; g.add(dia);
  g.visible = false; scene.add(g); marker.mesh = g; marker.dia = dia;
}
function setMarker(x, z) {
  if (marker.on && Math.hypot(marker.pos.x - x, marker.pos.z - z) < 4) { marker.on = false; marker.mesh.visible = false; sfx('click', 0.5); return; }
  marker.on = true; marker.pos.set(x, terrainH(x, z), z); marker.mesh.position.copy(marker.pos); marker.mesh.visible = true; sfx('edit', 0.6);
}
function placeMarkerAhead() {
  const d = _v2; camera.getWorldDirection(d);
  const hit = castRay(camera.position, d, 700, player);
  const pt = hit ? hit.point : _v1.copy(camera.position).addScaledVector(d, 300);
  setMarker(pt.x, pt.z);
}
function updateMarker(dt) {
  const el = document.getElementById('markerLbl');
  if (!marker.on || !player) { el.style.display = 'none'; return; }
  marker.dia.rotation.y += dt * 2; marker.dia.position.y = 2 + Math.sin(gameT * 3) * 0.3;
  _v1.copy(marker.pos).setY(marker.pos.y + 3).project(camera);
  if (_v1.z > 1) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.style.left = clamp((_v1.x + 1) / 2 * window.innerWidth, 20, window.innerWidth - 20) + 'px';
  el.style.top = clamp((1 - _v1.y) / 2 * window.innerHeight, 20, window.innerHeight - 20) + 'px';
  el.textContent = Math.round(Math.hypot(marker.pos.x - player.pos.x, marker.pos.z - player.pos.z)) + ' m';
}

// =====================================================================
// Game start
// =====================================================================
const mates = [];
function warmupShaders() {
  // compile every material once (gliders, skins...) so the first jumps do not stutter
  const vis = [];
  for (const c of chars) { vis.push([c.mesh, c.mesh.visible], [c.parts.glider, c.parts.glider.visible]); c.mesh.visible = true; c.parts.glider.visible = true; }
  impIM.count = 1; dummy.position.set(0, -50, 0); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); impIM.setMatrixAt(0, dummy.matrix); impIM.setColorAt(0, _c.set(0xffffff));
  try { outline.compile(scene, camera); } catch (e) {}
  for (const [o, v] of vis) o.visible = v;
  impIM.count = 0;
}
function startGame() {
  document.getElementById('hud').classList.remove('hidden');
  state = 'playing'; gameT = 0;
  top1Pending = false; victoryCam = false; // reset de la séquence TOP 1
  player = new Char(LOAD.name || 'Joueur', true, LOAD);
  player.team = 0;
  player.keycards = {};
  player.mats.wood = 60;
  const used = new Set();
  const allNames = BOT_NAMES.concat(BOT_NAMES_X);
  for (let i = 0; i < BOT_COUNT; i++) {
    let nm = pick(allNames), k = 0; while (used.has(nm) && k++ < 40) nm = pick(allNames); if (used.has(nm)) nm = pick(allNames) + randi(2, 99); used.add(nm);
    if (Math.floor((i + 1) / TEAM_SIZE) === 0 && LOAD.mateNames && LOAD.mateNames[i]) { nm = String(LOAD.mateNames[i]).slice(0, 16); used.add(nm); }
    const b = new Char(nm, false, randomLoadout());
    // teams: first (TEAM_SIZE-1) bots are the player's squad mates
    b.team = Math.floor((i + 1) / TEAM_SIZE);
    b.mate = b.team === 0;
    b.jumpAt = rand(0.08, 0.92); b.think = rand(0.5); b.buildCd = 0; b.react = 0; b.strafe = 1; b.strafeT = 0; b.burst = 0; b.stuckT = 0; b.stuckN = 0; b.lastP = new THREE.Vector3(); b.lostT = 0;
    b.skill = rand(0.45, 0.85) * (b.mate ? 1.1 : 1); b.heals = randi(0, 2); b.mats.wood = randi(60, 200); if (R() < 0.4) b.mats.stone = randi(30, 120);
    b.lootDelay = rand(3, 9); b.armed = false; b.deployH = rand(22, 75); b.diveK = rand(0.3, 1); b.lodAcc = 0; b.lodPhase = i % 4;
    bots.push(b);
    if (b.mate) mates.push(b);
  }
  // ombres & boss des POI espions (hors compteur de joueurs) : ils spawnent
  // sur les points de leur circuit de patrouille fixe (jamais dans un mur)
  for (const p of POIS) {
    if (!p.spy) continue;
    const cfg = SPY_STAFF[p.key];
    const route = spyPatrol(p);
    // point d'appui : le pont du Yacht ou la plateforme de La Plateforme, sinon le terrain
    let sy, wpBox = null;
    if (p.key === 'yacht') { sy = 2.4 + 1.5; wpBox = { x: p.x - 4, z: p.z, hx: 3, hz: 1 }; }
    else if (p.key === 'rig') { sy = RIG_DT + 0.1; wpBox = { x: p.x, z: p.z, hx: 8, hz: 6 }; } // TNTina patrouille le pont
    // La Grotte : Brutus et ses ombres gardent la caverne souterraine
    else if (p.key === 'grotto') { sy = GROTTO.floor1 + 3.6 + 0.1; wpBox = { x: GROTTO.cavernX, z: GROTTO.cavernZ, hx: 10, hz: 10 }; }
    // L'Agence : le boss garde le hall du rez-de-chaussée (le coffre-fort est en sous-sol)
    else if (p.key === 'agency') { sy = p.h + 0.15; wpBox = { x: p.x, z: p.z, hx: 10 * AGENCY_K, hz: 7 * AGENCY_K }; }
    else sy = null; // terrain : hauteur calculée au point de spawn
    const spawnAt = (w) => {
      if (sy !== null && sy !== undefined) return sy;
      return Math.max(terrainH(w.x, w.z), 2.4) + 0.1;
    };
    const bossW = route ? route[0] : { x: p.x + rand(-6, 6), z: p.z + rand(-3, 3) };
    const boss = new Char(cfg.boss, false, { skin: cfg.skin, backpack: 'none', pickaxe: 'default', glider: 'default', emote: 'danse' });
    boss.hench = true; boss.boss = true; boss.bossPoi = p; boss.henchPoi = p; boss.wpBox = wpBox;
    boss.lodPhase = 0; boss.lodAcc = 0; // sinon les PNJ éloignés de la caméra ne pensent plus (NaN % 4)
    if (route) { boss.route = route; boss.routeIdx = 0; }
    boss.patrolId = `${p.key}-boss`; boss.patrolSpeed = 0.62;
    boss.pos.set(bossW.x, spawnAt(bossW), bossW.z);
    boss.mode = 'ground'; boss.grounded = true; boss.mesh.visible = true;
    boss.hp = cfg.hp; boss.shield = cfg.shield; boss.heals = 3;
    boss.slots[1] = { kind: 'weapon', id: cfg.weapon, rarity: 5, mag: 0 }; boss.slots[1].mag = magOf(boss.slots[1]);
    boss.cur = 1; boss.armed = true; boss.ammo[WEAPONS[cfg.weapon].ammo] = 400;
    boss.mats.wood = 300;
    boss.skill = 1.05; boss.think = rand(0.5); boss.react = 0; boss.strafe = 1; boss.strafeT = 0; boss.burst = 0; boss.stuckT = 0; boss.stuckN = 0; boss.lastP = new THREE.Vector3(); boss.lostT = 0; boss.buildCd = 0; boss.alert = 0;
    addNameTag(boss, cfg.boss);
    for (let i = 0; i < cfg.hench; i++) {
      const h = new Char('Ombre', false, { skin: 'ombre', backpack: 'none', pickaxe: 'default', glider: 'default', emote: 'danse' });
      h.hench = true; h.henchPoi = p; h.bossRef = boss; h.wpBox = wpBox;
      h.lodPhase = i % 4; h.lodAcc = 0; // mise à jour des PNJ éloignés (comme les bots)
      // spawn sur le circuit (décalé pour ne pas s'empiler) : jamais dans un mur
      const ownRoute = spyPatrol(p, i + 1);
      const w = ownRoute ? ownRoute[1 % ownRoute.length] : (() => { const bp = randomLandPoint(p.x, p.z, p.r * 0.8); return { x: bp.x, z: bp.z }; })();
      if (ownRoute) { h.route = ownRoute; h.routeIdx = 1 % ownRoute.length; }
      h.patrolId = `${p.key}-ombre-${i + 1}`; h.patrolSpeed = 0.67 + i * 0.045;
      h.pos.set(w.x, spawnAt(w), w.z);
      h.mode = 'ground'; h.grounded = true; h.mesh.visible = true;
      h.hp = 100; h.shield = 50; h.heals = 1;
      h.slots[1] = randWeaponItem(1); h.cur = 1; h.armed = true;
      h.ammo[WEAPONS[h.slots[1].id].ammo] = 200;
      h.mats.wood = 100;
      h.skill = 0.85; h.think = rand(0.5); h.react = 0; h.strafe = 1; h.strafeT = 0; h.burst = 0; h.stuckT = 0; h.stuckN = 0; h.lastP = new THREE.Vector3(); h.lostT = 0; h.buildCd = 0; h.alert = 0;
    }
  }
  // squads share their jump point and landing zone
  const teamPlan = new Map();
  // bus route (changes every match)
  const a = rand(Math.PI * 2), off = rand(-70, 70);
  const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
  const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(off);
  bus.start.copy(dir).multiplyScalar(-WORLD_R - 20).add(perp).setY(240);
  bus.end.copy(dir).multiplyScalar(WORLD_R + 20).add(perp).setY(240);
  bus.dir.copy(dir); bus.t = 0; bus.active = true; bus.ended = false; bus.mesh.visible = true;
  bus.mesh.rotation.y = Math.atan2(-dir.x, -dir.z); // le pare-brise pointe dans le sens du vol
  camYaw = Math.atan2(-dir.x, -dir.z) - 0.6; camPitch = -0.35;
  for (const b of bots) {
    if (b.mate) { b.jumpAt = 2; continue; } // mates follow the player
    let plan = TEAM_SIZE > 1 ? teamPlan.get(b.team) : null;
    if (!plan) {
      const jumpAt = rand(0.08, 0.92);
      const tgt = R() < 0.65 ? (() => { const p = pick(POIS); return randomLandPoint(p.x, p.z, p.r); })() : randomLandPoint(bus.start.x + (bus.end.x - bus.start.x) * jumpAt, bus.start.z + (bus.end.z - bus.start.z) * jumpAt, 60);
      plan = { jumpAt, tgt }; teamPlan.set(b.team, plan);
    }
    b.jumpAt = plan.jumpAt + (TEAM_SIZE > 1 ? rand(0, 0.02) : 0);
    b.dropTarget = TEAM_SIZE > 1 ? randomLandPoint(plan.tgt.x, plan.tgt.z, 8) : plan.tgt;
  }
  document.getElementById('busHint').style.display = 'block';
  document.getElementById('busHint').innerHTML = IS_TOUCH ? 'Appuie sur <b>SAUT</b> pour sauter du bus' : `Appuie sur <kbd>${keyLabel(BIND.jump)}</kbd> pour sauter du bus · <kbd>${keyLabel(BIND.map)}</kbd> carte`;
  showCenter('LE BUS DÉCOLLE', 'Choisis ton point d\'atterrissage', 3);
  const modeName = { 1: 'Solo', 2: 'Duo', 4: 'Escouade' }[TEAM_SIZE];
  setTimeout(() => showCenter(`${modeName.toUpperCase()} · ${PLAYER_TOTAL} JOUEURS`, 'Personne n\'a d\'arme : fonce vers le butin', 2.6), 3200);
  updateHotbar(); updateHUDStatic(); updateBuildBar(); buildTeamHUD();
  warmupShaders(); playMusic('bus');
  tryLock();
}
function aliveTeams() { const s = new Set(); for (const c of chars) if (c.alive && !c.hench) s.add(c.team); return s; }
function buildTeamHUD() {
  const el = document.getElementById('teamHud');
  if (!mates.length) { el.style.display = 'none'; return; }
  el.innerHTML = mates.map((m, i) => `<div class="tm" id="tm${i}"><span class="tm-n">${m.name}</span><div class="tm-bars"><i class="s"></i><i class="h"></i></div></div>`).join('');
}
function updateTeamHUD() {
  mates.forEach((m, i) => {
    const e = document.getElementById('tm' + i); if (!e) return;
    e.classList.toggle('dead', !m.alive);
    e.querySelector('.s').style.width = (m.alive ? m.shield : 0) + '%';
    e.querySelector('.h').style.width = (m.alive ? Math.max(0, m.hp) : 0) + '%';
  });
}
window.addEventListener('pointerdown', () => initAudio());
window.addEventListener('keydown', () => initAudio());

let matchOver = false; // vrai dès qu'un top 1 est décidé : la zone s'arrête, plus rien ne bouge sauf le perso
// ---- Séquence TOP 1 : ralenti de 1,4 s puis caméra de face + stats ----
let top1Pending = false, top1Until = 0; // ralenti cinématique, déclenché sur l'horloge réelle
let victoryCam = false, victoryYaw = 0; // caméra devant le perso pour l'écran TOP 1
function beginTop1() {
  if (state !== 'playing' || !player.alive || top1Pending) return; // une seule fois : une mort de coéquipier ne relance pas le chrono
  top1Pending = true;
  top1Until = performance.now() + 1400; // 1,4 seconde de ralenti (temps réel, indépendant du framerate)
  showCenter('TOP 1', 'Dernier survivant…', 1.4);
}
function startVictory() {
  if (state !== 'playing' || !player.alive) return;
  state = 'victory'; wonMatch = true; matchOver = true;
  // la caméra passe devant le perso : on le voit de face pendant les stats
  victoryCam = true; victoryYaw = camYaw;
  // stoppe l'emote (elle ferait tourner le dos du perso à la caméra) et ferme les menus ouverts
  if (player.emoting) player.emoting = null;
  if (paused) { paused = false; document.getElementById('pause').classList.add('hidden'); }
  if (settingsOpen) { settingsOpen = false; $('gameSettings').classList.add('hidden'); }
  mouse.l = mouse.r = false; setBuildModeOff(); cancelEdit(); player.using = null;
  if (player.mode !== 'ground') { player.mode = 'ground'; player.parts.glider.visible = false; }
  finalizeXP();
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('bigmap').classList.add('hidden');
  startConfetti();
  sfx('victory', 0.9); playMusic('victory');
  endGame(true); // les stats s'affichent directement, avec TOP 1 en gros
}
function endGame(won) {
  if (state === 'over') return;
  matchOver = true; // la partie est finie : le monde se fige
  state = 'over';
  if (lockApi) lockApi.unlock(); // libère la souris pour cliquer sur les boutons
  document.getElementById('victoryQuit').classList.add('hidden');
  document.getElementById('victory').classList.add('hidden');
  document.getElementById('spectate').style.display = 'none';
  document.getElementById('endXp').textContent = `+${Math.round(matchXP)} XP gagnés cette partie`;
  mouse.l = mouse.r = false; buildMode = false;
  const es = document.getElementById('endscreen');
  es.classList.remove('hidden'); es.classList.toggle('lose', !won); es.classList.toggle('win', won);
  document.getElementById('endPlace').textContent = won ? 'TOP 1' : '#' + placement;
  document.getElementById('endTitle').textContent = won ? 'VICTOIRE ROYALE' : 'ÉLIMINÉ';
  document.getElementById('endSub').textContent = won ? "Tu es le dernier survivant de l'île. Bien joué" + (LOAD.name ? ', ' + LOAD.name : '') + "." : `Éliminé par ${elimBy}`;
  const m = Math.floor(gameT / 60), s = Math.floor(gameT % 60);
  const nTeams = Math.ceil(PLAYER_TOTAL / TEAM_SIZE);
  document.getElementById('endStats').innerHTML = `<div><b>${player.kills}</b>Éliminations</div><div><b>${m}:${String(s).padStart(2, '0')}</b>Temps survécu</div><div><b>${won ? 1 : placement}/${nTeams}</b>Classement</div><div><b>${Math.round(stats.damage)}</b>Dégâts</div>`;
  const top = chars.filter((c) => !c.hench).slice().sort((a, b) => b.kills - a.kills || (b.alive - a.alive)).slice(0, 8);
  document.getElementById('endBoard').innerHTML = `<div class="lb-h">MEILLEURS ÉLIMINATEURS</div>` + top.map((c, i) => `<div class="lb ${c.isPlayer ? 'me' : c.team === 0 ? 'mate' : ''}"><span>${i + 1}</span><b>${c.name}</b><em>${c.alive ? 'en vie' : 'éliminé'}</em><i>${c.kills} élim.</i></div>`).join('');
  const xl = Object.entries(xpLog).sort((a, b) => b[1] - a[1]).slice(0, 6);
  document.getElementById('endXpList').innerHTML = xl.map(([k, v]) => `<div><span>${k}</span><b>+${Math.round(v)}</b></div>`).join('');
  if (won) playMusic('victory');
  document.getElementById('hud').classList.add('hidden');
}

// =====================================================================
// Interaction / pickup
// =====================================================================
function itemLabel(it) {
  if (it.kind === 'weapon') return `<span class="rar" style="color:${RAR[it.rarity].css}">${WEAPONS[it.id].name}</span> <span style="opacity:.75">${RAR[it.rarity].name}</span>`;
  if (it.kind === 'keycard') return `<span class="rar" style="color:#ffd23f">Carte d'accès</span> <span style="opacity:.75">${(POIS.find((p) => p.key === it.poi) || {}).name || ''}</span>`;
  if (it.kind === 'consum') return `${CONSUM[it.id].name} ×${it.count}`;
  if (it.kind === 'ammo') return `${AMMO_NAMES[it.type]} ×${it.amount}`;
  return `${it.mat} ×${it.amount}`;
}
function weaponCard(it) {
  if (it.kind !== 'weapon') return '';
  const W = WEAPONS[it.id], RR = RAR[it.rarity];
  const dmg = Math.round(W.dmg * RR.mult * (W.pellets || 1));
  const cur = player.slots.find((x) => x && x.kind === 'weapon' && x.id === it.id);
  const cmp = cur && cur !== it ? (it.rarity > cur.rarity ? ' <b class="up">▲</b>' : it.rarity < cur.rarity ? ' <b class="dn">▼</b>' : '') : '';
  return `<div class="wcard" style="border-color:${RR.css}"><span>Dégâts <b>${dmg}</b>${cmp}</span><span>Cadence <b>${W.rate}</b></span><span>Chargeur <b>${magOf(it)}</b></span><span>Recharge <b>${(W.reload * RR.reload).toFixed(1)} s</b></span></div>`;
}
function nearestInteract() {
  let best = null, bd = 2.6;
  for (const L of loot) {
    if (!L.alive || L.item.kind === 'ammo' || L.item.kind === 'mats') continue;
    const d = Math.hypot(L.pos.x - player.pos.x, L.pos.z - player.pos.z) + Math.abs(L.pos.y - player.pos.y) * 0.5;
    if (d < bd) { bd = d; best = { type: 'loot', L }; }
  }
  for (const c of chests) { if (c.opened) continue; const d = Math.hypot(c.x - player.pos.x, c.z - player.pos.z) + Math.abs(c.y - player.pos.y) * 0.5; if (d < bd + 0.3) { bd = d; best = { type: 'chest', c }; } }
  for (const c of drops) { if (!c.landed || c.opened) continue; const d = Math.hypot(c.x - player.pos.x, c.z - player.pos.z) + Math.abs(c.y - player.pos.y) * 0.5; if (d < bd + 0.6) { bd = d; best = { type: 'drop', c }; } }
  for (const c of ammoBoxes) { if (c.opened) continue; const d = Math.hypot(c.x - player.pos.x, c.z - player.pos.z) + Math.abs(c.y - player.pos.y) * 0.5; if (d < bd) { bd = d; best = { type: 'ammo', c }; } }
  for (const v of vaults) { if (v.open) continue; const d = Math.hypot(v.x - player.pos.x, (v.z + 3.6) - player.pos.z) + Math.abs(v.y - player.pos.y) * 0.5; if (d < 3.2 && d < bd) { bd = d; best = { type: 'vault', v }; } }
  for (const b of booths) { const d = Math.hypot(b.x - player.pos.x, b.z - player.pos.z) + Math.abs(b.y - player.pos.y) * 0.5; if (d < 2.8 && d < bd) { bd = d; best = { type: 'booth', b }; } }
  for (const dr of doors) { if (dr.broken || matchOver) continue; const d = Math.hypot(dr.hx - player.pos.x, dr.hz - player.pos.z) + Math.abs(dr.ly - player.pos.y) * 0.5; if (d < 2.4 && d < bd) { bd = d; best = { type: 'door', dr }; } }
  if (!best) for (const v of vehicles) { if (v.driver || v.destroyed) continue; const d = Math.hypot(v.pos.x - player.pos.x, v.pos.z - player.pos.z) + Math.abs(v.pos.y - player.pos.y) * 0.3; if (d < 3.6) { best = { type: 'vehicle', v }; break; } }
  return best;
}
function interact() {
  if (!player.alive || player.mode !== 'ground') return;
  const t = nearestInteract(); if (!t) return;
  if (t.type === 'chest') openChest(t.c);
  else if (t.type === 'door') toggleDoor(t.dr);
  else if (t.type === 'vault') openVault(t.v);
  else if (t.type === 'booth') setDisguise(player, !player.disguise);
  else if (t.type === 'drop') openDrop(t.c);
  else if (t.type === 'vehicle') enterVehicle(player, t.v);
  else if (t.type === 'ammo') { openAmmoBox(t.c); addXP('Caisse de munitions', 20); for (let i = 0; i < 2; i++) { const id = pick(['ar', 'smg', 'shotgun', 'sniper']); spawnLoot(ammoFor(id), t.c.x, t.c.y + 0.5, t.c.z); } }
  else pickupItem(player, t.L);
}
function openChest(c, by = player) {
  // les coffres intérieurs d'un coffre-fort restent scellés tant qu'il est verrouillé
  if (c.vault && c.vaultRef && !c.vaultRef.open) {
    if (by === player) { sfx('warn', 0.6); showCenter('COFFRE-FORT VERROUILLÉ', `Élimine le boss de ${c.vaultRef.poi.name} pour sa carte d'accès`, 2.2); }
    return;
  }
  c.opened = true; c.lid.rotation.x = -1.2; c.lid.position.z = 0.3; c.lid.position.y = 0.95; c.light.intensity = 0;
  if (by === player) { stats.chests++; addXP('Coffre ouvert', 80); sfx('chest', 0.7); } else sfxAt('chest', _v1.set(c.x, c.y, c.z), 0.8);
  const w = randWeaponItem(c.vault ? 3 : 1);
  spawnLoot(w, c.x, c.y + 0.8, c.z); spawnLoot(ammoFor(w.id), c.x, c.y + 0.8, c.z);
  spawnLoot(randConsum(), c.x, c.y + 0.8, c.z);
  spawnLoot({ kind: 'mats', mat: pick(MAT_ORDER), amount: 30 }, c.x, c.y + 0.8, c.z);
  // butin bonus des coffres-forts
  if (c.vault) {
    const w2 = randWeaponItem(2);
    spawnLoot(w2, c.x + 0.8, c.y + 0.8, c.z + 0.4); spawnLoot(ammoFor(w2.id), c.x + 0.8, c.y + 0.8, c.z + 0.4);
    spawnLoot({ kind: 'consum', id: 'shieldL', count: 2 }, c.x - 0.8, c.y + 0.8, c.z + 0.4);
    spawnLoot({ kind: 'mats', mat: pick(MAT_ORDER), amount: 60 }, c.x, c.y + 0.8, c.z + 0.6);
  }
}
function openVault(v) {
  if (!(player.keycards && player.keycards[v.poi.key])) {
    sfx('warn', 0.6);
    showCenter('COFFRE-FORT VERROUILLÉ', `Élimine le boss de ${v.poi.name} pour sa carte d'accès`, 2.4);
    return;
  }
  v.open = true;
  if (v.door && v.door.alive) {
    removeCollider(v.door); v.door.alive = false;
    scene.remove(v.door.mesh); removeTarget(v.door.mesh);
    if (v.door.house) rebuildHouse(v.door.house);
  }
  burst(_v1.set(v.x, v.y + 2.2, v.z + 3), 0xffc400, 26, 6, 0.22, 0.5, 1);
  sfxAt('break', _v1, 1); sfx('chest', 0.9);
  addXP('Coffre-fort ouvert', 300);
  showCenter('COFFRE-FORT OUVERT', `Le butin de ${v.poi.name} est à toi`, 2.2);
}
// Déguisement d'Ombre (cabine téléphonique rouge)
function setDisguise(ch, on, broke) {
  if (!ch || !ch.isPlayer || ch.disguise === on) return;
  ch.disguise = on;
  // enfilant le costume, les hommes de main perdent ta trace
  if (on) { for (const c of chars) if (c.hench && c.target === ch) c.target = null; }
  if (!ch.disguiseMesh) {
    const g = new THREE.Group();
    addBox(g, 0.82, 0.92, 0.52, 0, 1.28, 0, matC(0x17171f));
    addBox(g, 0.64, 0.22, 0.48, 0, 1.72, 0, matC(0x17171f));
    addBox(g, 0.68, 0.09, 0.68, 0, 2.08, 0, matC(0x101016));
    addBox(g, 0.46, 0.26, 0.46, 0, 2.2, 0, matC(0x101016));
    g.visible = false;
    ch.mesh.add(g);
    ch.disguiseMesh = g;
  }
  ch.disguiseMesh.visible = on;
  const el = document.getElementById('disguiseTag');
  if (el) el.classList.toggle('on', on);
  if (broke && !on) { showCenter('DÉGUISEMENT ROMPU', 'Les hommes de main t\'ont repéré', 1.6); sfx('warn', 0.5); }
  else sfx('click', 0.5);
}
function addNameTag(ch, text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(10,12,18,.55)';
  g.fillRect(24, 6, 208, 50);
  g.strokeStyle = 'rgba(255,200,60,.9)'; g.lineWidth = 3; g.strokeRect(24, 6, 208, 50);
  g.font = '700 30px "Barlow Condensed", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#ffd23f'; g.fillText(String(text).toUpperCase(), 128, 32);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
  s.scale.set(2.4, 0.6, 1); s.position.y = 2.75;
  ch.mesh.add(s); ch.nameTag = s;
}
function pickupItem(ch, L) {
  const it = L.item;
  if (it.kind === 'keycard') {
    ch.keycards = ch.keycards || {};
    ch.keycards[it.poi] = true;
    removeLoot(L);
    if (ch.isPlayer) { sfx('pickup', 0.6); showCenter('CARTE D\'ACCÈS', 'Suis la ligne bleue sur la carte jusqu\'au coffre-fort', 3); }
    return;
  }
  if (it.kind === 'consum') {
    const ex = ch.slots.findIndex((s) => s && s.kind === 'consum' && s.id === it.id && s.count < CONSUM[it.id].stack);
    if (ex > 0) { const add = Math.min(it.count, CONSUM[it.id].stack - ch.slots[ex].count); ch.slots[ex].count += add; it.count -= add; if (it.count <= 0) removeLoot(L); if (ch.isPlayer) { sfx('pickup', 0.5); updateHotbar(); } return; }
  }
  let slot = ch.slots.findIndex((s, i) => i > 0 && !s);
  if (slot < 0) {
    if (ch.cur === 0) { if (ch.isPlayer) showCenter('', 'Inventaire plein : sélectionne un objet à remplacer', 1.5); return; }
    slot = ch.cur;
    const old = ch.slots[slot];
    spawnLoot(old, ch.pos.x, ch.pos.y + 0.3, ch.pos.z);
  }
  ch.slots[slot] = it; removeLoot(L);
  if (ch.isPlayer) {
    sfx('pickup', 0.5);
    if (it.kind === 'weapon' && (ch.cur === 0 || slot === ch.cur)) { ch.cur = slot; }
    ch.reloading = 0; updateHotbar();
  }
}
function autoPickups(ch) {
  for (const L of loot) {
    if (!L.alive || (L.item.kind !== 'ammo' && L.item.kind !== 'mats')) continue;
    // ramassage automatique élargi : il suffit d'être juste à côté (2,6 m, la portée du E),
    // même si l'objet vient d'être lâché et n'est pas encore posé
    if (Math.hypot(L.pos.x - ch.pos.x, L.pos.z - ch.pos.z) < 2.6 && Math.abs(L.pos.y - ch.pos.y) < 2.2) {
      if (L.item.kind === 'ammo') { ch.ammo[L.item.type] = Math.min(999, ch.ammo[L.item.type] + L.item.amount); if (ch.isPlayer) showCenter('', `+${L.item.amount} ${AMMO_NAMES[L.item.type]}`, 0.9); }
      else { ch.mats[L.item.mat] = Math.min(999, ch.mats[L.item.mat] + L.item.amount); if (ch.isPlayer) matGain(L.item.mat, L.item.amount, L.pos); }
      removeLoot(L); if (ch.isPlayer) sfx('pickup', 0.35);
    }
  }
}
function botPickGoal(b) {
  if (b.goalCd > gameT) return; b.goalCd = gameT + 1.2;
  if (b.lootGoal && b.lootGoal.valid()) return;
  b.lootGoal = null;
  const free = b.slots.filter((x, i) => i > 0 && !x).length;
  if (b.armed && (free < 3 || storm.stage === 'shrink')) return;
  let best = null, bd = b.armed ? 22 : 45;
  for (const c of chests) { if (c.opened || Math.abs(c.y - b.pos.y) > 5) continue; const d = Math.hypot(c.x - b.pos.x, c.z - b.pos.z); if (d < bd) { bd = d; best = { kind: 'chest', ref: c }; } }
  for (const L of loot) { if (!L.alive || L.item.kind !== 'weapon' || L.claimed && L.claimed !== b) continue; if (b.slots.some((x) => x && x.id === L.item.id)) continue; const d = Math.hypot(L.pos.x - b.pos.x, L.pos.z - b.pos.z); if (d < bd) { bd = d; best = { kind: 'loot', ref: L }; } }
  if (!best) return;
  const r = best.ref;
  if (best.kind === 'loot') r.claimed = b;
  best.pos = new THREE.Vector3(best.kind === 'chest' ? r.x : r.pos.x, 0, best.kind === 'chest' ? r.z : r.pos.z);
  best.valid = () => best.kind === 'chest' ? !r.opened : r.alive;
  b.lootGoal = best; b.wp = best.pos; b.wpKind = 'loot';
}
function botLoot(b, dt) {
  b.lootT = (b.lootT || 0) + dt;
  const g = b.lootGoal;
  if (g && g.valid()) {
    const r = g.ref, gx = g.kind === 'chest' ? r.x : r.pos.x, gz = g.kind === 'chest' ? r.z : r.pos.z, gy = g.kind === 'chest' ? r.y : r.pos.y;
    if (Math.hypot(gx - b.pos.x, gz - b.pos.z) < 1.9 && Math.abs(gy - b.pos.y) < 2.5) {
      if (g.kind === 'chest') { openChest(r, b); b.goalCd = gameT + 0.9; }
      else { pickupItem(b, r); if (!b.ammo[WEAPONS[r.item.id].ammo]) b.ammo[WEAPONS[r.item.id].ammo] = 60; }
      b.lootGoal = null;
    }
  }
  if (b.armed) return;
  const wi = b.slots.findIndex((x, i) => i > 0 && x && x.kind === 'weapon');
  if (wi > 0) { b.armed = true; b.cur = wi; return; }
  if (b.lootT < 24 + b.lootDelay) return;
  // fallback so that no bot stays unarmed forever
  b.armed = true;
  b.slots[1] = randWeaponItem(); if (R() < 0.6) { let w2 = randWeaponItem(); while (w2.id === b.slots[1].id) w2 = randWeaponItem(); b.slots[2] = w2; }
  if (R() < 0.5) b.slots[3] = randConsum();
  b.cur = 1; b.shield = R() < 0.5 ? randi(25, 75) : 0;
}

// =====================================================================
// Player update
// =====================================================================
let camDistNow = 3.6, fovNow = 72, shoulderNow = 0.85;
const camTarget = new THREE.Vector3();
function onFirePress() {
  if (!player || !player.alive) return;
  if (buildMode) tryPlace();
}
let placeCd = 0;
function tryPlace() {
  if (!ghostTarget || placeCd > 0) return;
  const t = ghostTarget;
  if (buildTooHigh(t.type, t.y)) { placeCd = 0.3; showCenter('', 'Hauteur maximale atteinte', 0.8); return; }
  if (placeBuild(player, t.type, t.cx, t.cz, t.y, t.d, player.matSel)) { placeCd = 0.06; stats.builds++; updateHUDStatic(); }
  else if (player.mats[player.matSel] < BUILD_COST) { placeCd = 0.3; showCenter('', 'Pas assez de matériaux', 0.8); }
}
const _wish = new THREE.Vector3(), _fwd = new THREE.Vector3(), _right = new THREE.Vector3(), _aimD = new THREE.Vector3(), _aimO = new THREE.Vector3();
function updatePlayer(dt) {
  const p = player;
  if (!p.alive) return;
  if (state !== 'playing' && state !== 'victory') { p.vel.x *= 0.8; p.vel.z *= 0.8; p.vel.y -= GRAV * dt; physics(p, dt); if (p.emoting) p.emoting.t += dt; return; }
  p.yaw = camYaw; p.pitch = camPitch;
  if (IS_TOUCH) touchAimAssist(dt);
  const fwd = _fwd.set(-Math.sin(camYaw), 0, -Math.cos(camYaw));
  const right = _right.set(Math.cos(camYaw), 0, -Math.sin(camYaw));
  const wish = _wish.set(0, 0, 0);
  const blocked = bigmapOpen;
  if (!blocked) {
    if (down('forward')) wish.add(fwd); if (down('back')) wish.sub(fwd);
    if (down('right')) wish.add(right); if (down('left')) wish.sub(right);
  }
  if (wish.lengthSq() > 0) wish.normalize();
  // joystick analogique : la vitesse suit l'inclinaison du pouce (0 → 1)
  if (IS_TOUCH && touchJoy.on && !blocked) {
    wish.set(0, 0, 0).addScaledVector(fwd, -touchJoy.y).addScaledVector(right, touchJoy.x).multiplyScalar(touchJoy.mag);
  }
  if (p.mode === 'bus') return;
  if (p.mode === 'drive') { driveVehicle(p, dt); return; }
  if (p.mode === 'fall' || p.mode === 'glide') {
    airControl(p, wish, dt); physics(p, dt);
    if (p.grounded) { p.mode = 'ground'; p.manualFall = false; p.parts.glider.visible = false; p.landT = 0.5; p.cool = Math.max(p.cool, 0.3); p.vel.y = 0; sfx('land', 0.6); const poi = inPOI(p.pos.x, p.pos.z, 10); showCenter(poi ? poi.name.toUpperCase() : '', 'Fouille les maisons et les coffres', 2.2); }
    return;
  }
  const W = weaponOf(p);
  if (p.equipT > 0) p.equipT = Math.max(0, p.equipT - dt);
  const ads = mouse.r && !buildMode && !editing && W && !W.melee && p.reloading <= 0 && p.equipT <= 0;
  p.ads = ads;
  if (p.emoting) { p.emoting.t += dt; if (wish.lengthSq() > 0 || mouse.l || down('jump') || buildMode) p.emoting = null; }
  const sliding = p.slideT > 0 && p.grounded && !p.inWater;
  if (p.slideT > 0) { p.slideT -= dt; if (!p.grounded && p.vel.y > 0) p.slideT = 0; }
  p.crouch = (!!p.crouchToggle || sliding) && p.grounded;
  p.sprint = !sliding && (down('sprint') || keys.ShiftRight) && !ads && !p.using && !p.crouch && wish.lengthSq() > 0 && !mouse.l;
  let speed = RUN * 0.88;
  if (p.sprint) speed = RUN * 1.18;
  if (p.crouch && !sliding) speed *= 0.5;
  if (ads) speed *= 0.6; if (p.using) speed *= 0.45; if (p.inWater) speed *= 0.55;
  const acc = p.grounded ? 14 : 4;
  if (sliding) {
    // slight steering, speed decays over the slide; dust under the feet
    if (wish.lengthSq() > 0) { p.slideDir.lerp(_v1.set(wish.x, 0, wish.z).normalize(), Math.min(1, dt * 2.2)).normalize(); }
    const k = p.slideT / 0.95, sp = RUN * (1.05 + 0.85 * k);
    p.vel.x = p.slideDir.x * sp; p.vel.z = p.slideDir.z * sp;
    p.slideFx = (p.slideFx || 0) - dt; if (p.slideFx <= 0) { p.slideFx = 0.06; burst(_v2.set(p.pos.x, p.pos.y + 0.1, p.pos.z), 0xd9c9a8, 2, 2.2, 0.1, 0.6, 0.4); }
  } else {
    p.vel.x = lerp(p.vel.x, wish.x * speed, Math.min(1, acc * dt));
    p.vel.z = lerp(p.vel.z, wish.z * speed, Math.min(1, acc * dt));
  }
  // saut : tenu, mémorisé 0,14 s avant l'atterrissage, et toléré 0,12 s après avoir quitté le sol (même en courant)
  p.coyote = p.grounded ? 0.12 : Math.max(0, (p.coyote || 0) - dt);
  p.jumpBuf = Math.max(0, (p.jumpBuf || 0) - dt);
  // plongeon : « s'accroupir » (F) dans l'eau fait couler, on remonte en le relâchant
  p.diving = p.inWater && !!p.crouchToggle;
  if ((down('jump') || p.jumpBuf > 0) && (p.grounded || p.coyote > 0) && p.vel.y <= 2 && !p.inWater && !blocked) { p.vel.y = JUMP_V * (sliding ? 1.08 : 1); p.grounded = false; p.coyote = 0; p.jumpBuf = 0; p.crouchToggle = false; p.slideT = 0; }
  // petit bond de nage : sauter en surface fait sortir la tête de l'eau (grimper
  // sur la berge) — une seule impulsion par appui, pas de saut répété en
  // maintenant Espace (le bond ne se relance qu'en retombant, après le délai)
  p.swimHopCd = Math.max(0, (p.swimHopCd || 0) - dt);
  if (p.inWater && !p.diving && (down('jump') || p.jumpBuf > 0) && !blocked && p.swimHopCd <= 0 && p.vel.y < 0.8) { p.vel.y = 3.4; p.swimHopCd = 0.85; p.jumpBuf = 0; }
  // dans l'eau : gravité réduite + frein vertical -> flottaison naturelle vers la surface
  p.vel.y -= GRAV * dt * (p.inWater ? 0.22 : 1);
  if (p.inWater) p.vel.y *= Math.max(0, 1 - 2.6 * dt);
  physics(p, dt);
  if (p.landV > 26 && !p.noFall) { const d = (p.landV - 26) * 6; damageChar(p, d, null, false, 'chute'); }
  if (p.grounded) p.noFall = false;
  autoPickups(p);
  updateEdit();
  // build or fire
  placeCd -= dt;
  if (editing) { ghostTarget = null; }
  else if (buildMode) {
    ghostTarget = computeTarget(p, buildPiece, camPitch, buildRot);
    if (mouse.l) tryPlace();
  } else {
    ghostTarget = null;
    const it = p.item;
    if (it && it.kind === 'consum') {
      if (mouse.l && !p.using) {
        const C = CONSUM[it.id];
        const needed = C.hp ? p.hp < C.maxHp : p.shield < C.maxSh;
        if (needed) p.using = { item: it, t: 0, dur: C.dur };
        else if (!p.useWarnT || p.useWarnT < gameT) { showCenter('', C.hp ? 'Santé déjà au maximum' : 'Bouclier déjà au maximum', 1); p.useWarnT = gameT + 1.2; }
      }
    } else if (mouse.l && W && !blocked && p.equipT <= 0) {
      const d = _aimD; camera.getWorldDirection(d);
      if (W.melee) fire(p, _aimO.copy(camera.position), d, false);
      else {
        // aim ray from camera, then fire from the character's shoulder toward the aim point
        const o = _aimO.copy(camera.position).addScaledVector(d, camDistNow * 0.9 + 0.3);
        fire(p, o, d, ads);
      }
    }
  }
  // consumable use
  if (p.using) {
    p.using.t += dt;
    if (p.slots[p.cur] !== p.using.item) p.using = null;
    else if (p.using.t >= p.using.dur) {
      const it = p.using.item, C = CONSUM[it.id];
      if (C.hp) p.hp = Math.min(C.maxHp, p.hp + C.hp); else p.shield = Math.min(C.maxSh, p.shield + C.sh);
      it.count--; sfx('heal', 0.6);
      if (it.count <= 0) { p.slots[p.cur] = null; p.cur = 0; }
      p.using = null; updateHotbar();
    }
  }
  checkPOIBanner();
}

// =====================================================================
// Character common update
// =====================================================================
function updateChar(ch, dt) {
  if (!ch.alive) {
    if (ch.dieT > 0) { ch.dieT -= dt; ch.mesh.scale.setScalar(Math.max(0.01, ch.dieT / 0.6)); ch.mesh.rotation.x = (1 - ch.dieT / 0.6) * -1.4; if (ch.dieT <= 0) ch.mesh.visible = false; }
    return;
  }
  ch.cool -= dt; ch.bloom = Math.max(0, ch.bloom - dt * 0.08);
  ch.waterAimT = Math.max(0, (ch.waterAimT || 0) - dt);
  if (ch.reloading > 0) { ch.reloading -= dt; if (ch.reloading <= 0) { ch.reloading = 0; finishReload(ch); } }
  // décroissance du coup de pioche : ~0,36 s pour laisser respirer les 4 temps
  // (armé → frappe → rebond d'impact → retour) sans ralentir le rythme de minage
  if (ch.swing > 0) ch.swing = Math.max(0, ch.swing - dt * 2.8);
  // particules vertes de soin pendant l'utilisation d'un bandage / d'une potion
  if (ch.using && ch.alive) { ch.healFxT = (ch.healFxT || 0) - dt; if (ch.healFxT <= 0) { ch.healFxT = 0.16; burst(_v1.set(ch.pos.x, ch.pos.y + 1.15, ch.pos.z), 0x5fe35f, 2, 1.4, 0.1, 0.55, 0.9); } }
  if (!ch.isPlayer) {
    if (ch.mode === 'bus') {
      if (bus.t / bus.dur >= ch.jumpAt) jumpFromBus(ch);
    } else if (ch.mode === 'fall' || ch.mode === 'glide') {
      if (ch.mate && player.alive) { if (!ch.dropTarget || ch.dropTarget === ch._dt0) ch.dropTarget = ch._dt0 = new THREE.Vector3(); ch.dropTarget.set(player.pos.x + (ch.team * 0 + mates.indexOf(ch) - 1) * 4, 0, player.pos.z + 3); if (player.mode === 'glide' && ch.mode === 'fall') deployGlider(ch); }
      if (!ch.dropTarget) ch.dropTarget = randomLandPoint(ch.pos.x, ch.pos.z, 20);
      const dx = ch.dropTarget.x - ch.pos.x, dz = ch.dropTarget.z - ch.pos.z, d = Math.hypot(dx, dz);
      const wish = _v1.set(d > 2 ? dx / d : 0, 0, d > 2 ? dz / d : 0);
      ch.yaw = Math.atan2(-dx, -dz);
      airControl(ch, wish, dt); physics(ch, dt);
      if (ch.grounded) { ch.mode = 'ground'; ch.parts.glider.visible = false; ch.landT = 0.5; ch.cool = Math.max(ch.cool || 0, 0.3); ch.wp = randomLandPoint(ch.pos.x, ch.pos.z, 25); }
    } else {
      if (!ch.hench) botLoot(ch, dt);
      if (ch.hench) henchThink(ch, dt); else botThink(ch, dt);
      ch.vel.y -= GRAV * dt;
      physics(ch, dt);
      if (ch.landV > 26) damageChar(ch, (ch.landV - 26) * 6, null, false, 'chute');
    }
  }
  updateMovers(ch, dt);
  // storm damage
  if (storm.phase >= 0 && ch.mode !== 'bus') {
    const out = !matchOver && Math.hypot(ch.pos.x - storm.cx, ch.pos.z - storm.cz) > storm.r;
    ch.inStorm = out;
    if (out) { ch.stormTick -= dt; if (ch.stormTick <= 0) { ch.stormTick = 1; ch.hp -= storm.dmg; if (ch.isPlayer) { sfx('storm', 0.5); hurtFlash = 0.3; } if (ch.hp <= 0) kill(ch, null, 'tempête'); } }
    else ch.stormTick = 0.5;
  }
  ch.refreshHeld();
  if (ch.mode === 'ground' && ch.grounded && !ch.inWater) {
    const hs = Math.hypot(ch.vel.x, ch.vel.z);
    if (hs > 3) { ch.stepT = (ch.stepT || 0) - dt * hs / 7; if (ch.stepT <= 0) { ch.stepT = 0.36; if (ch.isPlayer) sfx(stepSound(ch), 0.16); else if (player && ch.camD2 < 900) sfxAt(stepSound(ch), ch.pos, 0.6); } }
  } else if (ch.mode === 'ground' && ch.inWater) {
    const hs = Math.hypot(ch.vel.x, ch.vel.z);
    if (hs > 2) { ch.stepT = (ch.stepT || 0) - dt * hs / 7; if (ch.stepT <= 0) { ch.stepT = 0.5; if (ch.isPlayer) sfx('step_water', 0.25); else if (ch.camD2 < 900) sfxAt('step_water', ch.pos, 0.6); if (ch.camD2 < 3600) { burst(_v1.set(ch.pos.x, -0.3, ch.pos.z), 0xd8f4ff, 3, 2.5, 0.12, 0.8, 0.5); ripple(ch.pos.x, ch.pos.z, 0.55 + hs * 0.06); } } }
  }
  // éclaboussure à l'entrée dans l'eau : plus la chute est rapide, plus le plouf est gros
  if (ch.inWater && !ch.wasInWaterFX && ch.mode === 'ground') {
    const k = Math.min(1, (ch.splashV || 1) / 14);
    if (ch.isPlayer || ch.camD2 < 6400) splashFX(ch.pos.x, ch.pos.z, k);
    if (ch.isPlayer) sfx('splash', 0.4 + 0.6 * k); else if (ch.camD2 < 3600) sfxAt('splash', ch.pos, 0.8);
  }
  ch.wasInWaterFX = ch.inWater;
  animateChar(ch, dt);
}
function stepSound(ch) {
  const c = ch.gcol;
  if (c) { const m = c.parent ? c.parent.mat : c.mat; return m === 'metal' ? 'step_metal' : m === 'stone' ? 'step_stone' : 'step_wood'; }
  const h = terrainH(ch.pos.x, ch.pos.z);
  if (h < 1.6) return 'step_sand';
  const b = biomeAt(ch.pos.x, ch.pos.z);
  return b === 'snow' ? 'step_snow' : b === 'desert' ? 'step_sand' : 'step_grass';
}
function animateChar(ch, dt) {
  const P = ch.parts, m = ch.mesh;
  // ordre yaw→pitch→roulis : l'inclinaison de chute/planeur se fait dans le
  // repère du personnage (plongeon devant lui), pas selon l'axe mondial X
  m.rotation.order = 'YXZ';
  // le recul de tir décroit toujours, même si le perso est invisible/loin
  ch.shotKick = Math.max(0, (ch.shotKick || 0) - dt * 6);
  // minigun : le faisceau de canons tourne pendant le tir et ralentit ensuite
  if (ch.held && ch.held.userData.spin) { ch.spinV = Math.max(ch.shotKick > 0.05 ? 34 : 0, (ch.spinV || 0) - dt * 22); ch.held.userData.spin.rotation.z += ch.spinV * dt; }
  // temps de dégagement d'arme des bots (celui du joueur est géré dans updatePlayerPhysics)
  if (!ch.isPlayer && ch.equipT > 0) ch.equipT = Math.max(0, ch.equipT - dt);
  if (ch.mode === 'bus' || ch.mode === 'drive') { m.visible = false; return; }
  if (!(ch.isPlayer && scopeOn)) m.visible = ch.isPlayer || ch.camD2 < FULL_D2;
  const sh = ch.isPlayer || ch.camD2 < SHADOW_D2;
  if (sh !== ch.shadowOn) { ch.shadowOn = sh; m.traverse((o) => { if (o.isMesh && o.material !== hitMatInvisible) o.castShadow = sh; }); }
  m.position.copy(ch.pos);
  m.rotation.set(0, ch.yaw, 0);
  if (!m.visible) return; // far: hitboxes follow the position, the pose is not animated
  const hs = Math.hypot(ch.vel.x, ch.vel.z);
  ch.animT += dt * (4 + hs * 1.3);
  // intensité du pas (0 = immobile) et allure (0 = marche, 1 = course) lissées :
  // départs et arrêts s'enchaînent sans à-coup
  const gk = 1 - Math.exp(-dt * 8);
  ch.ampS = lerp(ch.ampS || 0, ch.grounded ? Math.min(1, hs / 6) : 0, gk);
  ch.runS = lerp(ch.runS || 0, clamp((hs - 4.5) / 4, 0, 1), gk);
  const sw = Math.sin(ch.animT) * ch.ampS * 0.8;
  P.torso.rotation.set(0, 0, 0);
  // remet les hanches à zéro chaque frame : la pose chute libre écarte les
  // jambes (rotation.z) et elle ne doit pas fuiter sur les autres animations
  P.hipL.rotation.z = 0; P.hipR.rotation.z = 0;
  relaxJoints(P); // coudes et genoux : chaque pose ci-dessous fixe sa propre flexion
  if (ch.mode === 'fall') {
    // CHUTE LIBRE façon Fortnite : tête en avant, pieds un peu plus hauts,
    // plongeon plus vertical quand on fonce vers le bas. Mains vides : la pioche
    // reste au sac pendant tout le saut, elle ne sort qu'après la réception.
    P.hand.visible = false;
    const fast = Math.min(1, Math.max(0, (-ch.vel.y - 24) / 30));
    m.rotation.x = -1.95 - fast * 0.55;
    m.rotation.z = Math.sin(ch.animT * 0.6) * 0.06; // léger roulis au vent
    const flap = Math.sin(ch.animT * 2.4) * 0.1;
    // jambes jointes qui traînent derrière, bras écartés du corps ramenés en arrière
    P.hipL.rotation.x = 0.3 + flap * 0.3; P.hipR.rotation.x = 0.3 - flap * 0.3;
    P.kneeL.rotation.x = -0.45 - flap * 0.4; P.kneeR.rotation.x = -0.3 + flap * 0.4; // genoux souples dans le vent
    P.shL.rotation.set(-0.55 + flap * 0.25, 0, -0.9); P.shR.rotation.set(-0.55 - flap * 0.25, 0, 0.9);
    P.elL.rotation.set(0.35, 0, 0); P.elR.rotation.set(0.35, 0, 0);
    P.head.rotation.set(0.55, 0, 0); // regarde dans la direction du saut
    return;
  }
  if (ch.mode === 'glide') {
    // PARACHUTE : suspendu sous la toile, jambes ballantes, léger balancement.
    // Les mains sont accrochées aux poignées des sangles : les bras suivent les
    // poignées (fixées à ±1 m du centre) même quand la toile balance.
    P.hand.visible = false;
    m.rotation.x = 0;
    const swing = Math.sin(gameT * 1.3) * 0.07;
    m.rotation.z = swing;
    P.hipL.rotation.x = 0.45 + Math.sin(gameT * 1.8) * 0.08; P.hipR.rotation.x = 0.25 - Math.sin(gameT * 1.8) * 0.08;
    // jambes ballantes : les genoux pendent sous les cuisses relevées
    P.kneeL.rotation.x = -0.55 - Math.sin(gameT * 1.8 + 0.6) * 0.12; P.kneeR.rotation.x = -0.35 + Math.sin(gameT * 1.8 + 0.6) * 0.12;
    P.elL.rotation.set(0, 0, 0); P.elR.rotation.set(0, 0, 0); // bras tendus vers les poignées
    P.head.rotation.set(-0.25, 0, 0);
    // la toile ne pivote PAS indépendamment du corps : les poignées restent
    // exactement sous les mains pendant le balancement (le corps entier oscille)
    const phi = 0;
    for (const sgn of [1, -1]) {
      const hx = sgn * Math.cos(phi) - 2.0 * Math.sin(phi);
      const hy = sgn * Math.sin(phi) + 2.0 * Math.cos(phi);
      (sgn > 0 ? P.shR : P.shL).rotation.set(0, 0, Math.atan2(hx - sgn * 0.385, -(hy - 1.54)));
    }
    return;
  }
  // RÉCEPTION : genoux pliés et bras en équilibre juste après l'atterrissage.
  // La pioche reste au sac 0,3 s (attaques bloquées via ch.cool), puis elle
  // remonte en douceur (animation de dégagement) — elle ne saute pas à l'écran.
  if (ch.landT > 0 && !ch.inWater) {
    ch.landT -= dt;
    P.hand.visible = ch.landT <= 0.2;
    const k = Math.min(1, ch.landT / 0.5);
    // cuisses vers l'avant, genoux fléchis : les pieds restent au sol (0,24 m d'amorti)
    m.position.y -= 0.24 * k;
    P.torso.rotation.x = -0.3 * k;
    P.hipL.rotation.x = 0.85 * k; P.hipR.rotation.x = 0.85 * k;
    P.kneeL.rotation.x = -1.5 * k; P.kneeR.rotation.x = -1.5 * k;
    P.shR.rotation.set(0.5 * k, 0, 0.9 * k); P.shL.rotation.set(0.5 * k, 0, -0.9 * k);
    P.elR.rotation.set(0.5 * k, 0, 0); P.elL.rotation.set(0.5 * k, 0, 0);
    P.head.rotation.set(0, 0, 0);
    if (ch.landT <= 0.2 && ch.item && ch.item.kind === 'weapon' && ch.equipT <= 0) ch.equipT = ch.equipDur = 0.3;
    return;
  }
  m.rotation.x = 0;
  P.hand.visible = !ch.emoting;
  if (ch.emoting) {
    const y = poseEmote(P, ch.emoting.id, ch.emoting.t);
    m.position.y += y;
    if (ch.isPlayer) m.rotation.y = state === 'victory' && ch.emoting ? (ch.emoteYaw ?? (ch.emoteYaw = camYaw + Math.PI)) : camYaw + Math.PI;
    return;
  }
  P.head.rotation.set(0, 0, 0);
  // NAGE façon crawl : corps à plat dans l'eau, roulis des épaules à chaque
  // passage de bras, battements de jambes alternés, tête hors de l'eau pour
  // respirer. En plongée : corps allongé, bras le long du corps. Sur place :
  // on reste à flot, petits mouvements de bras et de jambes.
  if (ch.inWater && ch.mode === 'ground') {
    const dive = ch.pos.y < -1.25;
    const moving = Math.min(1, hs / 5); // 0 = sur place, 1 = nage à fond
    const ranged = ch.item && ch.item.kind === 'weapon' && ch.item.id !== 'pickaxe';
    const aiming = ranged && ((ch.waterAimT || 0) > 0 || (ch.isPlayer && (mouse.l || mouse.r)));
    const tread = !dive && (hs < 0.7 || aiming);
    if (tread) {
      // Maintien vertical : jambes en battements continus, pas un crawl
      // horizontal à l'arrêt. Le buste reste stable quand l'arme tire/vise.
      m.rotation.x = 0; m.rotation.z = 0;
      m.position.y += Math.sin(ch.animT * 1.5) * 0.025;
      P.torso.rotation.set(0, 0, 0);
      const k = Math.sin(ch.animT * 2.6);
      P.hipL.rotation.x = 0.16 + k * 0.3; P.hipR.rotation.x = 0.16 - k * 0.3;
      P.kneeL.rotation.x = -0.35 - Math.max(0, k) * 0.35;
      P.kneeR.rotation.x = -0.35 - Math.max(0, -k) * 0.35;
      P.hand.visible = !!aiming;
      if (aiming) {
        const pitch = ch.isPlayer ? ch.pitch * 0.8 : 0, kick = (ch.shotKick || 0) * 0.24;
        P.shR.rotation.set(Math.PI / 2 + pitch - 0.55 + kick, 0, 0);
        P.elR.rotation.set(0.55 + kick * 0.4, 0, 0);
        P.shL.rotation.set(Math.PI / 2 + pitch - 0.55 + kick, 0, -0.55);
        P.elL.rotation.set(0.45, 0, 0);
        if (ch.held) { ch.held.rotation.set(0, 0, 0); ch.held.position.set(0, 0, kick * 0.25); }
      } else {
        const a = Math.sin(ch.animT * 1.2) * 0.2;
        P.shL.rotation.set(0.4 + a, 0, -0.5); P.shR.rotation.set(0.4 - a, 0, 0.5);
        P.elL.rotation.x = P.elR.rotation.x = 0.65;
      }
      P.head.rotation.set(aiming && ch.isPlayer ? -ch.pitch * 0.2 : 0, 0, 0);
      ch.waterPose = aiming ? 'aim' : 'tread';
      return;
    }
    ch.waterPose = dive ? 'dive' : 'crawl';
    P.hand.visible = false; // on nage : l'arme reste au dos, bras libres
    // corps : à plat en surface (poitrine relevée pour garder la tête hors de
    // l'eau), bien allongé en plongée
    m.rotation.x = dive ? -1.45 : -1.12 - moving * 0.1;
    m.position.y += (dive ? 0 : 0.25) + Math.sin(ch.animT * 1.6) * 0.035; // léger tangage de flottaison
    const st = ch.animT * 1.05;
    // roulis du buste au rythme des bras (crawl)
    P.torso.rotation.set(0.1, 0, dive ? 0 : Math.sin(st) * 0.22 * (0.35 + moving));
    // jambes : battements alternés, plus amples et plus vifs quand on nage
    const kick = 0.22 + 0.5 * moving + (dive ? 0.15 : 0);
    const kf = Math.sin(st * 2.4);
    P.hipL.rotation.x = kf * kick; P.hipR.rotation.x = -kf * kick;
    P.kneeL.rotation.x = -0.25 - Math.max(0, kf) * 0.55 * kick; // le talon remonte quand la jambe monte
    P.kneeR.rotation.x = -0.25 - Math.max(0, -kf) * 0.55 * kick;
    if (dive) {
      // plongée : bras serrés le long du corps, mains qui poussent vers l'arrière
      P.shL.rotation.set(0.35, 0, -0.12); P.shR.rotation.set(0.35, 0, 0.12);
      P.elL.rotation.x = 0.15; P.elR.rotation.x = 0.15;
    } else {
      // bras : moulinets alternés — la main sort de l'eau en avant, revient le
      // long du corps coude plié ; sur place, petits cercles pour rester à flot
      const aL = Math.sin(st), aR = Math.sin(st + Math.PI);
      const sw = 0.7 + 1.0 * moving;
      P.shL.rotation.set(-0.35 + aL * sw, 0, -0.15 - Math.max(0, aL) * 0.2);
      P.shR.rotation.set(-0.35 + aR * sw, 0, 0.15 + Math.max(0, aR) * 0.2);
      P.elL.rotation.x = 0.2 + Math.max(0, -aL) * 1.2 * (0.3 + moving); // coude plié au retour
      P.elR.rotation.x = 0.2 + Math.max(0, -aR) * 1.2 * (0.3 + moving);
    }
    // tête : hors de l'eau en surface pour respirer, dans l'axe du corps en plongée
    P.head.rotation.x = dive ? 0.25 : -0.5;
    P.head.rotation.z = dive ? 0 : -Math.sin(st) * 0.06; // compense le roulis du buste
    return;
  }
  ch.waterPose = null;
  const amp = ch.ampS, run = ch.runS, ph = ch.animT, sp = Math.sin(ph);
  // bras : balancent à l'opposé des jambes (jambe gauche devant = bras droit devant),
  // avec un léger retard de phase ; les coudes pompent en course
  const ap = Math.sin(ph - 0.3), armA = lerp(0.5, 0.95, run) * amp;
  const elBase = 0.22 + lerp(0.12, 1.2, run) * amp, armOut = 0.07 + 0.06 * run;
  let lean = 0;
  if (!ch.grounded) { // saut : une jambe repliée devant, l'autre tendue derrière
    P.hipL.rotation.x = 0.6; P.kneeL.rotation.x = -1.2; P.hipR.rotation.x = -0.25; P.kneeR.rotation.x = -0.5;
    P.torso.rotation.x = -0.08;
  } else {
    // JAMBES : foulée plus ample en course, cuisses légèrement portées vers l'avant ;
    // le genou se plie fort quand la jambe repasse devant (talon sous la fesse en sprint)
    // et reste fléchi en appui pour amortir
    const hipA = lerp(0.5, 0.78, run) * amp, fwd = 0.1 * run * amp, cph = Math.cos(ph + 0.35), kA = lerp(0.95, 1.65, run);
    P.hipL.rotation.x = sp * hipA + fwd; P.hipR.rotation.x = -sp * hipA + fwd;
    P.kneeL.rotation.x = -(0.06 + amp * (0.14 + kA * Math.max(0, cph)));
    P.kneeR.rotation.x = -(0.06 + amp * (0.14 + kA * Math.max(0, -cph)));
    // CORPS : rebond deux fois par cycle (haut au croisement des jambes en marche,
    // bas à l'appui en course), buste penché vers l'avant selon l'allure, épaules en
    // contre-rotation des hanches, transfert du poids d'une jambe sur l'autre ;
    // respiration légère à l'arrêt
    const c2 = Math.cos(2 * ph);
    m.position.y += amp * (lerp(0.03, -0.045, run) * c2 + 0.02 * run);
    lean = -(0.05 + 0.2 * run) * amp;
    P.torso.rotation.set(lean + Math.sin(gameT * 1.8) * 0.012 * (1 - amp), sp * lerp(0.14, 0.2, run) * amp, sp * 0.04 * amp);
    // la tête compense : regard stable droit devant
    P.head.rotation.set(-lean * 0.8, -P.torso.rotation.y * 0.75, -P.torso.rotation.z * 0.8);
  }
  const it = ch.item;
  const aimP = ch.isPlayer ? ch.pitch * 0.8 : 0;
  if (it && it.kind === 'weapon' && it.id === 'pickaxe') {
    // PIOCHE : portée le manche incliné vers l'avant et le haut, tête devant ; le coup part en diagonale
    // (de l'épaule droite, en haut, vers la hanche gauche, en bas) avec rotation du buste et fouetté du poignet.
    const s = ch.swing;
    const eq = ch.equipT > 0 ? clamp(ch.equipT / (ch.equipDur || 0.3), 0, 1) : 0;
    let ang, roll, el, tilt, hroll = 0.5, twist = 0, lean = 0, dip = 0;
    if (s > 0) {
      // COUP DE PIOCHE en 4 temps : armé (anticipation), frappe (accélération
      // franche, ease-in cubique : la tête part lentement puis claque), impact
      // (le choc rebondit : petit recul du bras, du manche et du buste), retour
      // (ease-out avec léger dépassement façon ressort, puis pose détendue).
      const k = 1 - s;                        // 0 = début du coup, 1 = fin
      const wind = Math.min(1, k / 0.2);
      const windE = 1 - (1 - wind) * (1 - wind);           // ease-out : l'armé s'installe vite
      const hit = clamp((k - 0.15) / 0.28, 0, 1);
      const eh = hit * hit;                                // ease-in : la descente démarre tôt puis claque
      const imp = clamp((k - 0.43) / 0.14, 0, 1);
      const impE = Math.sin(imp * Math.PI);                // bosse courte : rebond d'impact
      const rec = clamp((k - 0.57) / 0.43, 0, 1);
      const recE = 1 - Math.pow(1 - rec, 3);               // ease-out : freinage en douceur
      const over = Math.sin(rec * Math.PI) * 0.09;         // léger dépassement avant la pose
      ang  = lerp(lerp(0.55, 2.7, windE), 0.16, eh); ang  = lerp(ang, 0.55, recE) + impE * 0.3 + over * 0.5;
      roll = lerp(lerp(0.12, 0.95, windE), -0.78, eh); roll = lerp(roll, 0.12, recE) - impE * 0.18;
      el   = lerp(lerp(0.4, 1.35, windE), 0.06, eh); el   = lerp(el, 0.4, recE) + impE * 0.55;
      tilt = lerp(lerp(2.0, 3.0, windE), 1.0, eh); tilt = lerp(tilt, 2.0, recE) + impE * 0.22 + over;
      hroll = lerp(lerp(0.5, 1.0, windE), 1.42, eh); hroll = lerp(hroll, 0.5, recE) + impE * 0.12;
      twist = lerp(lerp(0, 0.6, windE), -0.55, eh); twist = lerp(twist, 0, recE) + impE * 0.12;
      lean = -0.16 * eh + 0.16 * recE + 0.1 * impE;        // le buste plonge dans la frappe, se relève au rebond
      dip = 0.05 * Math.max(0, eh - recE);                 // petit tassement des jambes pendant le coup
    } else {
      ang = lerp(0.55 + sw * 0.25, 2.3, eq); roll = 0.12; el = 0.4; tilt = 2.0;
    }
    P.shR.rotation.set(ang - el * 0.4, 0, roll); P.elR.rotation.set(el, 0, 0);
    P.shL.rotation.set(-ap * armA, 0, -armOut); P.elL.rotation.set(elBase + Math.max(0, -ap) * 0.45 * amp, 0, 0);
    if (ch.held) ch.held.rotation.set(tilt, 0, hroll); // hroll : la tête de la pioche penche en diagonale
    if (twist) P.torso.rotation.y += twist;
    if (lean) P.torso.rotation.x += lean;
    if (dip) m.position.y -= dip;
  } else if (it && it.kind === 'weapon') {
    let rel = 0, tilt = 0, low = 0, k = 0, eq = 0;
    if (ch.reloading > 0) { const tot = WEAPONS[it.id].reload * RAR[it.rarity].reload; const rp = 1 - ch.reloading / tot; k = Math.sin(clamp(rp, 0, 1) * Math.PI); rel = k * 0.35; tilt = k * 0.9; }
    // CHANGEMENT D'ARME : l'arme descend le long de la cuisse, pivote (on la
    // retourne en main) puis remonte en position de tir.
    if (ch.equipT > 0) { low = (ch.equipT / (ch.equipDur || 0.3)) * 1.2; eq = Math.sin(clamp(1 - ch.equipT / (ch.equipDur || 0.3), 0, 1) * Math.PI); }
    // recul visible à chaque tir (joueur ET bots) : le bras et l'arme partent en arrière
    const kick = (ch.shotKick || 0) * 0.32;
    // balancement de l'arme en marchant (comme dans la vidéo) : le canon suit le pas
    const sway = sw * 0.15;
    // épaule abaissée de la flexion du coude : l'avant-bras (et donc le canon) garde
    // exactement la même direction, mais l'arme est tenue près du corps, coude plié
    const eR = 0.55, eL = 0.45 + k * 0.6;
    P.shR.rotation.set(Math.PI / 2 + aimP - rel - low + kick - sway - eR, 0, eq * 0.25); P.elR.rotation.set(eR + kick * 0.4, 0, 0);
    if (k > 0) P.shL.rotation.set(Math.PI / 2 + aimP - 0.1 - k * 1.5 - eL, 0, -0.55 + k * 0.45); // left hand goes to the belt for a new mag
    else P.shL.rotation.set(Math.PI / 2 + aimP - 0.1 - low + kick - sway - eL, 0, -0.55 - eq * 0.2);
    P.elL.rotation.set(eL, 0, 0);
    // l'arme reste pointée vers la cible : on annule l'inclinaison du buste et on
    // réduit sa rotation (les bras sont portés par le torse)
    P.shR.rotation.x -= lean; P.shL.rotation.x -= lean; P.torso.rotation.y *= 0.35;
    // SPRINT arme en main : arme abaissée en travers du corps, coudes repliés
    if (ch.sprint && k === 0) { const lo = run * 0.8; P.shR.rotation.x -= lo; P.shL.rotation.x -= lo; P.elR.rotation.x += lo * 0.4; P.elL.rotation.x += lo * 0.4; }
    if (ch.held) { ch.held.rotation.z = tilt + sw * 0.06 + (ch.sprint ? run * 0.5 : 0); ch.held.rotation.x = eq * 0.8; ch.held.position.z = kick * 0.3; ch.held.position.y = -sway * 0.2; }
  } else if (it) {
    if (ch.using) {
      // SOIN : l'objet remonte devant le torse, la tête s'incline dessus,
      // petit tremblement pendant l'application + particules vertes (updateChar).
      P.shR.rotation.set(1.2 + Math.sin(gameT * 9) * 0.06, 0, -0.3); P.elR.rotation.set(0.95, 0, 0);
      P.shL.rotation.set(1.0 - Math.sin(gameT * 9) * 0.06, 0, 0.3); P.elL.rotation.set(0.9, 0, 0);
      P.head.rotation.set(0.3, 0, 0);
      if (ch.held) { ch.held.rotation.z = Math.sin(gameT * 8) * 0.08; }
    } else {
      const u = Math.sin(gameT * 10) * 0.2;
      P.shR.rotation.set(1.0 + u, 0, 0); P.elR.rotation.set(0.4, 0, 0); P.shL.rotation.set(0.8 - u, 0, -0.4); P.elL.rotation.set(0.4, 0, 0);
    }
  } else { // mains vides : bras décollés du corps, coude plus plié quand le bras passe devant
    P.shR.rotation.set(ap * armA, 0, armOut); P.shL.rotation.set(-ap * armA, 0, -armOut);
    P.elR.rotation.set(elBase + Math.max(0, ap) * 0.45 * amp, 0, 0); P.elL.rotation.set(elBase + Math.max(0, -ap) * 0.45 * amp, 0, 0);
  }
  if (buildMode && ch.isPlayer) { P.shR.rotation.set(0.7, 0, 0); P.elR.rotation.set(0.6, 0, 0); P.shL.rotation.set(0.7, 0, -0.3); P.elL.rotation.set(0.6, 0, 0); }
  // glissade : jambe avant tendue, l'autre repliée dessous
  if (ch.crouch && ch.slideT > 0) { m.position.y -= 0.55; P.hipL.rotation.x = 1.25; P.kneeL.rotation.x = -0.15; P.hipR.rotation.x = 0.9; P.kneeR.rotation.x = -1.4; P.torso.rotation.x = -0.45; }
  // accroupi : cuisses vers l'avant, genoux pliés (les pieds restent sous le corps)
  else if (ch.crouch) { m.position.y -= 0.32; P.hipL.rotation.x += 0.95; P.hipR.rotation.x += 0.95; P.kneeL.rotation.x -= 1.65; P.kneeR.rotation.x -= 1.65; P.torso.rotation.x = -0.3; }
  if (ch.hurtT > 0) { ch.hurtT -= dt; }
  // traînée de frappe : arc lumineux qui suit la tête de la pioche
  updatePickTrail(ch, dt);
}

// =====================================================================
// Storm & bus update
// =====================================================================
function updateStorm(dt) {
  storm.mesh.material.uniforms.t.value += dt;
  if (storm.phase === -1) {
    // La zone apparaît 1 min après la FIN du bus (repli : à l'atterrissage
    // si le joueur est resté dans le bus jusqu'au bout, il est de toute
    // façon éjecté à la fin du bus — le compte à rebours démarre là).
    if (bus.ended) {
      storm.delay -= dt;
      if (storm.delay <= 0) { storm.phase = 0; startPhase(0); }
    }
  } else {
    // dégâts recalculés en direct selon les joueurs encore en jeu (phase
    // finale incluse)
    storm.dmg = stormDamageFor(chars.filter((c) => c.alive && !c.hench && !c.boss).length);
    if (storm.phase < PHASES.length) {
    storm.timer -= dt;
    const P = PHASES[storm.phase];
    if (storm.stage === 'wait' && storm.timer <= 0) { storm.stage = 'shrink'; storm.timer = P.shrink; storm.sx = storm.cx; storm.sz = storm.cz; storm.sr = storm.r; showCenter('LA TEMPÊTE SE REFERME', '', 2.5); sfx('warn', 0.6); }
    else if (storm.stage === 'shrink') {
      const t = 1 - Math.max(0, storm.timer) / P.shrink;
      storm.cx = lerp(storm.sx, storm.nx, t); storm.cz = lerp(storm.sz, storm.nz, t); storm.r = lerp(storm.sr, storm.nr, t);
      if (storm.timer <= 0) { storm.phase++; if (storm.phase < PHASES.length) startPhase(storm.phase); }
    }
    }
  }
  storm.mesh.visible = storm.phase >= 0;
  storm.mesh.position.set(storm.cx, 150, storm.cz);
  storm.mesh.scale.set(Math.max(0.1, storm.r), 1, Math.max(0.1, storm.r));
}
function startPhase(i) {
  const P = PHASES[i];
  if (i > 0 && player && player.alive) addXP('Tempête survécue', 120);
  if (i === 1 || i === 3) setTimeout(spawnSupplyDrop, 4000);
  storm.stage = 'wait'; storm.timer = P.wait;
  const maxOff = Math.max(0, (i === 0 ? 70 : storm.r) - P.r);
  for (let k = 0; k < 40; k++) {
    const a = MR() * 6.283, d = Math.sqrt(MR()) * maxOff;
    const x = (i === 0 ? 0 : storm.cx) + Math.cos(a) * d, z = (i === 0 ? 0 : storm.cz) + Math.sin(a) * d;
    if (terrainH(x, z) > 2 || k === 39) { storm.nx = x; storm.nz = z; break; }
  }
  storm.nr = P.r;
  // la zone commence en dehors de la carte : rayon 460 > côte (~400),
  // toute l'île est au sec au moment de la révélation
  if (i === 0) { storm.cx = 0; storm.cz = 0; storm.r = 460; }
  showCenter('ZONE SÛRE RÉVÉLÉE', `La tempête arrive dans ${P.wait} s — regarde la carte (${keyLabel(BIND.map)})`, 3);
  sfx('warn', 0.5);
}
function updateBus(dt) {
  if (!bus.active) return;
  bus.t += dt;
  const t = bus.t / bus.dur;
  bus.pos.lerpVectors(bus.start, bus.end, t);
  bus.mesh.position.copy(bus.pos);
  bus.mesh.position.y += Math.sin(bus.t * 1.5) * 0.4;
  if (t >= 1) {
    for (const c of chars) if (c.mode === 'bus' && c.alive) jumpFromBus(c);
    bus.active = false; bus.ended = true; bus.mesh.visible = false;
  }
}

// =====================================================================
// Camera
// =====================================================================
let scopeOn = false, camColDist = 4, shake = 0;
const _camO = new THREE.Vector3(), _camD = new THREE.Vector3();
function updateCamera(dt) {
  if (state === 'menu') {
    const t = performance.now() * 0.00004;
    camera.position.set(Math.cos(t) * 170, 70, Math.sin(t) * 170);
    camera.lookAt(0, 10, 0);
    return;
  }
  // TOP 1 : caméra devant le perso, on le voit de face derrière les stats
  if (victoryCam && player && player.alive && (state === 'victory' || state === 'over')) {
    const pivot = _v3.copy(player.pos).add(_v1.set(0, 1.5, 0));
    const fx = -Math.sin(victoryYaw), fz = -Math.cos(victoryYaw);
    // collision : un mur devant le perso ne doit ni cacher son visage ni être traversé
    // (marge 0,3 m ; plancher 0,2 m pour rester devant même un mur collé au visage)
    let cd = 5;
    _camO.copy(pivot); _camO.y += 0.2; _camD.set(fx, 0, fz);
    raycaster.set(_camO, _camD); raycaster.far = cd + 0.3; raycaster.near = 0;
    const hs = raycaster.intersectObjects(rayTargets, false);
    for (const h of hs) { const ud = h.object.userData; if (ud.struct && ud.struct.alive) { cd = Math.max(0.2, Math.min(cd, h.distance - 0.3)); break; } }
    const gy = Math.max(pivot.y + 0.5, terrainH(pivot.x + fx * cd, pivot.z + fz * cd) + 0.4);
    camera.position.set(pivot.x + fx * cd, gy, pivot.z + fz * cd);
    camTarget.copy(pivot).add(_v1.set(0, -0.15, 0));
    camera.lookAt(camTarget);
    if (Math.abs(camera.fov - SET.fov) > 0.01) { camera.fov = SET.fov; camera.updateProjectionMatrix(); }
    player.mesh.visible = true;
    camDistNow = cd; shoulderNow = 0;
    return;
  }
  // edge-turn fallback when the browser refuses pointer lock
  if (!locked && state === 'playing' && !paused && mouse.inside && player.alive) {
    const ex = mouse.x / window.innerWidth, ey = mouse.y / window.innerHeight;
    if (ex < 0.06) camYaw += dt * 2.4 * (1 - ex / 0.06);
    if (ex > 0.94) camYaw -= dt * 2.4 * ((ex - 0.94) / 0.06);
    if (ey < 0.06) camPitch = Math.min(1.25, camPitch + dt * 1.4);
    if (ey > 0.94) camPitch = Math.max(-1.35, camPitch - dt * 1.4);
  }
  recoil = Math.max(0, recoil - dt * (0.25 + recoil * 6)); recoilX -= recoilX * Math.min(1, dt * 6);
  const W = player && player.alive ? weaponOf(player) : null;
  const ads = player && player.alive && player.ads && player.mode === 'ground';
  scopeOn = ads && W.scope;
  const BF = SET.fov;
  let dist = 4.3, sh = 1.0, fov = BF, up = 1.75;
  let pivot;
  if (!player.alive && spectateTarget && spectateTarget.alive && state === 'playing') {
    pivot = _v3.copy(spectateTarget.pos).add(_v1.set(0, 1.6, 0));
    camYaw = lerpAngle(camYaw, spectateTarget.yaw, Math.min(1, dt * 3)); camPitch = lerp(camPitch, -0.15, dt * 3); dist = 5; sh = 0.6;
    const sp = document.getElementById('spectate'); sp.style.display = 'block'; sp.textContent = `Spectateur : ${spectateTarget.name}`;
  } else if (!player.alive || state === 'over') {
    pivot = _v3.copy(player.pos).add(_v1.set(0, 1.5, 0));
    camYaw += dt * 0.15; dist = 9; sh = 0;
  } else if (player.mode === 'bus') { pivot = _v3.copy(bus.pos); dist = 22; sh = 0; }
  else if (player.mode === 'drive' && player.vehicle) { pivot = _v3.copy(player.vehicle.pos).add(_v1.set(0, 2.2, 0)); dist = player.vehicle.kind === 'boat' ? 8.5 : 7.5; sh = 0; fov = BF + Math.min(10, Math.abs(player.vehicle.speed) * 0.4); }
  else if (player.mode === 'fall' || player.mode === 'glide') { pivot = _v3.copy(player.pos).add(_v1.set(0, 1.4, 0)); dist = 7; sh = 0; fov = player.mode === 'fall' ? BF + 8 + Math.max(0, -player.vel.y - 30) * 0.3 : BF + 2; }
  else { pivot = _v3.copy(player.pos).add(_v1.set(0, player.crouch ? up - 0.4 : up, 0)); if (player.emoting) { dist = 6; sh = 0; } if (ads) { dist = 2.0; sh = 0.75; fov = W.scope ? 16 : BF * 0.68; } if (player.sprint) fov = BF + 6; if (editing || buildMode) dist = 4.6; }
  sh *= shoulderSide;
  camDistNow = lerp(camDistNow, dist, Math.min(1, dt * 10));
  shoulderNow = lerp(shoulderNow, sh, Math.min(1, dt * 10));
  fovNow = lerp(fovNow, fov, Math.min(1, dt * (scopeOn ? 20 : 10)));
  if (Math.abs(camera.fov - fovNow) > 0.01) { camera.fov = fovNow; camera.updateProjectionMatrix(); }
  const pitch = camPitch + recoil, yawR = camYaw + recoilX;
  const d = _v2.set(-Math.sin(yawR) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yawR) * Math.cos(pitch));
  const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
  let cd = camDistNow;
  if (state === 'playing' && player.alive && player.mode === 'ground') {
    // origine du raycast avec le même décalage d'épaule réduit que la position finale
    // (utilise la distance lissée de la frame précédente), sinon le coin d'un mur
    // côté épaule peut être raté et laissait la caméra le traverser.
    const shRay = shoulderNow * Math.min(1, camColDist / 2.5);
    _camO.set(pivot.x + rx * shRay, pivot.y, pivot.z + rz * shRay); _camD.copy(d).negate();
    raycaster.set(_camO, _camD); raycaster.far = cd + 0.3; raycaster.near = 0;
    const hs = raycaster.intersectObjects(rayTargets, false);
    // Mur collé : CH_R (0.42 m) garantit que la caméra reste devant la face du mur
    // (le joueur ne peut pas s'approcher plus près que son rayon de collision).
    for (const h of hs) { const ud = h.object.userData; if (ud.struct && ud.struct.alive) { cd = Math.max(0.42, h.distance - 0.3); break; } }
  }
  camColDist = cd < camColDist ? cd : lerp(camColDist, cd, Math.min(1, dt * 4));
  cd = Math.min(cd, camColDist);
  // caméra très proche (mur derrière le joueur) : on réduit aussi le décalage d'épaule
  // pour que le joueur reste bien dans le cadre au lieu de sortir de l'écran.
  const shEff = shoulderNow * Math.min(1, cd / 2.5);
  camera.position.set(pivot.x - d.x * cd + rx * shEff, pivot.y - d.y * cd, pivot.z - d.z * cd + rz * shEff);
  const th = terrainH(camera.position.x, camera.position.z) + 0.4;
  // Grotte : la caméra reste entre le sol rocheux et le plafond du tunnel/de la
  // caverne. Uniquement quand le JOUEUR est lui-même sous la voûte — en surface
  // au-dessus de la grotte, la caméra garde son comportement normal. Hors du
  // volume couvert (cratère ouvert, ravin d'entrée côté cratère), l'exception
  // terrain ne s'applique pas : la caméra ne peut pas plonger sous le sol.
  const pInCave = player.alive && player.mode !== 'bus' && player.mode !== 'drive'
    && (() => { const pc = grottoCamCeil(player.pos.x, player.pos.z); return pc !== null && player.pos.y < pc; })();
  let gClamped = false;
  if (pInCave) {
    const gc = grottoCamCeil(camera.position.x, camera.position.z);
    if (gc !== null) {
      const gf = grottoCamFloor(camera.position.x, camera.position.z);
      if (gf !== null && camera.position.y < gf + 0.3) camera.position.y = gf + 0.3;
      if (camera.position.y > gc) camera.position.y = gc;
      gClamped = true;
    }
  }
  // Agence : le joueur est dans le sous-sol (coffre-fort) — la caméra reste
  // sous le plancher du rez-de-chaussée, sinon elle traverse le bâtiment.
  const pInBase = player.alive && player.mode !== 'bus' && player.mode !== 'drive'
    && player.pos.y < AGENCY_BASE.camCeil && inAgencyBasement(player.pos.x, player.pos.z);
  let aClamped = false;
  if (pInBase) {
    if (camera.position.y > AGENCY_BASE.camCeil) camera.position.y = AGENCY_BASE.camCeil;
    if (camera.position.y < AGENCY_BASE.floor + 0.4) camera.position.y = AGENCY_BASE.floor + 0.4;
    aClamped = true;
  }
  // dans le volume couvert de la Grotte, la caméra peut passer sous le niveau du
  // terrain au-dessus (le plafond rocheux la protège déjà)
  const camUnder = gClamped && camera.position.y < th - 0.75 && inGrotto(camera.position.x, camera.position.z);
  // idem dans le sous-sol de l'Agence : le plancher du RDC protège la caméra
  const camUnderAgency = aClamped && inAgencyBasement(camera.position.x, camera.position.z);
  if (camera.position.y < th && !camUnder && !camUnderAgency) camera.position.y = th;
  // plongée : la caméra suit sous la surface -> vue sous-marine (teinte bleue)
  if (player.alive && player.diving && camera.position.y > -0.45) camera.position.y = -0.45;
  camTarget.copy(camera.position).add(d);
  camera.lookAt(camTarget);
  if (player.alive) player.mesh.visible = !scopeOn && player.mode !== 'bus' && player.mode !== 'drive';
  if (shake > 0) { shake = Math.max(0, shake - dt * 3); camera.position.x += (MR() - 0.5) * shake * 0.3; camera.position.y += (MR() - 0.5) * shake * 0.3; }
  // teinte sous-marine : la caméra passe sous la surface (mer ou eau de la Grotte)
  const uw = camera.position.y < -0.08 && (terrainH(camera.position.x, camera.position.z) < -0.35 || inGrotto(camera.position.x, camera.position.z));
  if (uw !== camUnderwater) camUnderwater = uw;
  $('uwTint').style.opacity = camUnderwater ? 0.55 : 0;
  // brouillard de plongée : présent en permanence (pas de recompilation de shader) mais
  // invisible au-dessus de l'eau — il devient bleu et dense dès qu'on est immergé,
  // on voit alors de l'eau tout autour, y compris sous la surface
  if (camUnderwater) { scene.fog.near = UW_FOG_NEAR; scene.fog.far = UW_FOG_FAR; scene.fog.color.copy(UW_FOG_DAY).lerp(UW_FOG_NIGHT, nightF); }
  else { scene.fog.near = 1e8; scene.fog.far = 2e8; }
}
let camUnderwater = false;
const UW_FOG_DAY = new THREE.Color(0x16608e), UW_FOG_NIGHT = new THREE.Color(0x03101c);

// =====================================================================
// HUD
// =====================================================================
const $ = (id) => document.getElementById(id);
const ICONS = {
  ar: '<svg viewBox="0 0 64 32"><path fill-rule="evenodd" d="M2.0 15.5L2.9 15.5L4.4 17.2L10.5 14.2L14.8 12.4L20.8 12.5L20.8 12.8L19.1 12.8L19.1 13.1L15.3 13.2L14.4 20.0L17.1 20.4L18.9 15.7L19.4 15.7L19.4 14.2L19.7 13.4L21.4 13.4L21.7 13.5L21.9 15.0L22.4 14.9L22.5 13.5L24.5 13.5L25.9 17.0L26.9 17.1L26.9 20.9L27.6 24.9L29.5 28.6L32.4 27.1L32.4 26.6L31.0 23.5L30.7 23.3L30.2 20.5L30.2 16.5L29.8 16.4L29.8 13.5L30.6 11.7L33.2 11.9L33.2 12.2L44.1 12.2L44.2 15.5L45.3 15.5L45.4 12.2L52.6 12.2L52.6 11.7L53.0 11.7L53.0 10.3L58.8 10.3L58.8 10.6L60.0 10.6L60.0 10.8L60.8 10.6L60.8 10.8L61.2 10.8L61.2 10.6L62.0 10.6L62.0 8.9L61.2 8.9L61.2 8.7L60.5 8.9L60.4 8.7L60.0 8.7L60.0 8.9L58.8 8.9L58.8 9.1L53.0 9.1L53.0 8.1L51.9 8.1L51.9 7.1L52.6 7.1L52.6 6.5L52.3 6.5L52.2 6.2L51.4 6.3L51.4 4.7L51.0 4.7L51.0 6.1L50.2 6.2L50.2 6.5L49.4 6.5L49.3 6.2L48.8 6.2L48.8 6.5L47.9 6.5L47.9 6.2L47.3 6.2L47.3 6.5L46.5 6.5L46.4 6.2L45.9 6.2L45.9 6.5L45.0 6.5L45.0 6.2L44.5 6.2L44.4 6.5L43.6 6.5L43.5 6.2L43.0 6.2L43.0 6.5L42.2 6.5L42.1 6.2L41.6 6.2L41.5 6.5L40.7 6.5L40.7 6.2L40.2 6.2L40.1 6.5L39.3 6.5L39.2 6.2L38.7 6.2L38.7 6.5L37.8 6.5L37.8 6.2L37.3 6.2L37.2 6.5L36.4 6.5L36.4 6.2L35.8 6.2L35.8 6.5L35.0 6.5L34.9 6.2L34.4 6.2L34.3 6.5L33.5 6.5L33.5 6.2L33.0 6.2L32.9 6.5L32.1 6.5L32.0 6.2L31.5 6.2L31.4 6.5L30.7 6.5L30.6 6.2L30.1 6.2L30.0 6.5L29.2 6.5L29.1 6.2L28.6 6.2L28.6 6.5L27.8 6.5L27.7 6.2L27.2 6.2L27.1 6.5L26.3 6.5L26.3 6.2L25.7 6.2L25.7 6.5L24.9 6.5L24.9 6.2L24.4 6.2L24.4 5.7L24.2 5.7L24.2 3.8L23.3 3.8L23.3 3.4L20.7 3.4L20.7 3.7L20.5 3.7L20.5 6.1L20.0 6.2L19.9 6.5L19.1 6.5L19.1 6.2L18.6 6.2L18.5 6.5L17.7 6.5L17.6 6.2L17.1 6.2L17.0 6.5L16.2 6.5L16.2 6.2L15.8 6.1L15.8 5.2L15.3 5.2L15.4 6.4L14.5 6.5L14.5 7.3L3.5 7.8L3.1 10.0L2.9 9.9L2.9 8.3L2.0 8.3zM30.6 7.1L50.5 7.1L50.5 8.1L33.0 8.1L33.0 7.9L32.0 7.9L31.9 8.1L30.6 8.1z"/></svg>',
  smg: '<svg viewBox="0 0 64 32"><path fill-rule="evenodd" d="M2.0 17.0L3.4 17.0L3.4 20.7L4.2 20.7L4.2 12.7L4.0 12.7L4.0 10.0L16.5 10.0L16.6 13.2L19.2 13.3L18.3 21.4L18.8 21.5L18.3 28.1L25.2 28.7L25.8 21.5L26.6 21.4L27.0 13.2L27.9 13.3L27.9 15.9L28.3 15.9L28.3 13.2L31.1 13.2L31.4 15.0L32.0 15.0L32.1 13.2L41.0 13.2L40.6 18.3L43.5 18.3L43.7 13.1L46.6 12.9L46.7 11.0L48.4 11.0L48.5 11.8L49.0 11.8L49.1 12.0L49.5 12.0L49.6 11.8L52.9 11.8L52.9 12.0L53.4 12.0L53.4 11.8L56.7 11.8L56.8 12.0L57.2 12.0L57.3 11.8L60.6 11.8L60.6 12.0L61.1 12.0L61.1 11.8L61.7 11.8L61.7 11.6L62.0 11.6L62.0 9.0L61.7 8.9L61.7 8.7L61.1 8.6L49.1 8.6L48.5 8.7L48.4 9.6L46.7 9.6L46.6 8.5L45.6 8.4L45.6 6.7L45.0 6.7L45.0 8.5L39.5 8.3L39.4 7.7L38.2 7.7L38.2 7.0L37.7 7.0L37.6 6.7L37.0 6.7L37.0 7.0L35.9 7.0L35.9 6.7L35.2 6.7L35.2 7.0L34.2 7.0L34.1 6.7L33.4 6.7L33.4 7.0L32.4 7.0L32.3 6.7L31.7 6.7L31.6 7.0L30.6 7.0L30.6 6.7L29.9 6.7L29.8 7.0L29.1 7.0L29.1 6.2L28.9 6.1L28.9 3.8L27.8 3.8L27.8 3.3L24.5 3.3L24.5 3.6L24.3 3.7L24.3 5.9L24.5 5.9L24.5 6.1L24.3 6.2L24.2 7.0L23.5 7.0L23.4 6.7L22.8 6.7L22.8 7.0L21.7 7.0L21.7 6.7L21.0 6.7L21.0 7.0L19.9 7.0L19.9 6.7L19.2 6.7L19.2 7.0L17.8 7.0L17.8 7.7L16.6 7.7L16.5 9.2L3.9 9.2L3.8 8.9L2.0 8.9z"/></svg>',
  shotgun: '<svg viewBox="0 0 64 32"><path fill-rule="evenodd" d="M62.0 11.6L60.2 11.6L60.2 10.3L59.7 10.3L59.7 11.6L37.3 11.6L37.3 12.0L35.6 12.0L35.5 11.4L20.5 11.4L20.4 11.2L5.7 10.9L3.5 15.4L3.3 15.4L3.3 12.2L2.1 12.2L2.1 20.4L2.9 20.4L3.3 21.7L8.6 20.9L17.0 18.8L20.4 17.7L20.5 17.4L22.4 17.5L22.4 20.0L22.8 20.0L22.8 17.4L25.3 17.5L25.6 19.2L26.2 19.2L26.3 17.5L28.2 17.6L32.9 17.1L33.5 17.2L33.5 18.4L50.0 18.4L50.5 16.5L54.1 16.5L54.1 16.7L56.2 16.5L56.2 14.4L55.1 14.4L55.1 14.0L60.1 14.0L60.2 14.2L61.4 14.2L61.4 12.1L62.0 12.0zM51.0 14.0L54.1 14.0L54.1 14.3L51.0 14.4z"/></svg>',
  sniper: '<svg viewBox="0 0 64 32"><path fill-rule="evenodd" d="M42.3 17.8L42.3 18.6L50.6 18.6L50.6 18.2L43.3 18.2L43.3 17.8zM2.0 21.1L2.2 21.2L2.2 21.4L5.0 21.4L7.1 19.2L11.5 19.7L14.7 18.3L18.3 18.3L18.4 18.7L17.7 22.4L19.9 22.7L21.1 18.3L38.1 18.0L38.2 15.9L50.8 15.9L50.8 15.7L57.7 15.7L57.7 16.3L62.0 16.3L62.0 14.1L57.7 14.1L57.7 14.7L50.8 14.7L50.8 14.5L30.5 14.5L30.5 15.5L27.9 15.5L27.9 14.0L29.5 13.9L29.5 13.5L29.2 13.5L29.2 13.2L28.8 13.2L28.8 13.5L28.1 13.5L28.1 13.2L27.7 13.2L27.7 13.5L27.0 13.5L27.0 12.2L27.4 12.2L27.4 12.7L32.1 12.7L32.2 12.5L32.2 9.8L32.1 9.6L27.4 9.6L27.3 10.2L27.0 10.2L27.0 10.0L26.2 10.0L26.1 10.2L23.5 10.2L23.5 9.3L22.3 9.3L22.3 10.2L21.0 10.2L21.0 10.0L20.2 10.0L20.2 10.2L19.0 10.2L19.0 9.8L16.8 9.8L16.8 12.5L19.0 12.5L19.0 12.1L20.2 12.1L20.2 12.3L21.0 12.3L21.0 12.1L26.1 12.1L26.2 13.2L25.5 13.2L25.5 13.5L24.9 13.5L24.9 13.2L24.5 13.2L24.4 13.5L23.8 13.5L23.8 13.2L23.4 13.2L23.3 13.5L22.7 13.5L22.7 13.2L22.3 13.2L22.3 13.5L21.6 13.5L21.6 13.2L21.2 13.2L21.1 13.5L20.6 13.5L20.5 13.2L20.1 13.2L20.1 13.5L19.5 13.5L19.4 13.2L19.0 13.2L19.0 13.5L18.4 13.5L18.4 13.2L18.0 13.2L17.9 13.5L17.4 13.5L17.4 13.9L17.6 14.0L17.6 14.4L17.0 14.4L16.4 13.4L11.4 13.4L11.3 12.9L7.1 12.9L7.0 13.5L2.5 14.2L2.4 17.0L2.0 17.1z"/></svg>',
  drum: '<svg viewBox="0 0 64 32"><path fill-rule="evenodd" d="M2.0 17.7L2.5 18.1L2.5 18.6L2.9 18.6L4.4 20.0L11.5 17.1L18.8 15.9L21.2 15.9L20.9 19.0L20.8 19.2L20.5 19.2L20.5 21.3L20.1 21.3L20.1 21.8L20.5 21.9L20.3 23.2L20.5 24.2L25.9 24.2L26.0 24.9L30.1 24.9L30.1 24.2L35.6 24.2L35.6 21.9L36.0 21.8L36.0 21.3L35.6 21.3L35.6 19.2L34.7 19.2L34.6 18.7L30.8 18.7L30.9 15.9L35.5 15.9L35.6 14.5L36.9 14.5L37.0 14.7L37.5 14.7L37.6 14.5L39.0 14.5L39.2 14.8L39.8 16.9L44.0 22.3L48.3 21.0L48.3 14.5L49.5 14.5L49.5 14.7L50.1 14.7L50.2 14.5L51.6 14.5L51.6 14.7L52.2 14.7L52.3 14.5L53.7 14.5L53.7 14.7L54.3 14.7L54.4 14.5L55.6 14.5L55.6 13.5L59.6 13.5L59.6 14.1L62.0 14.1L62.0 11.4L59.6 11.4L59.6 12.0L55.6 12.0L55.6 11.1L54.4 11.1L54.3 11.0L53.7 11.0L53.7 11.1L52.3 11.1L52.2 11.0L51.6 11.0L51.6 11.1L50.2 11.1L50.1 11.0L49.5 11.0L49.5 11.1L48.1 11.1L48.0 11.0L47.4 11.0L47.4 11.1L46.0 11.1L45.9 11.0L45.3 11.0L45.3 11.1L43.9 11.1L43.8 11.0L43.2 11.0L43.2 11.1L41.8 11.1L41.7 11.0L41.1 11.0L41.1 11.1L39.7 11.1L39.6 11.0L39.0 11.0L39.0 11.1L37.6 11.1L37.5 11.0L35.6 11.1L35.5 9.9L20.5 9.9L20.4 7.6L20.6 7.6L20.6 7.1L19.4 7.1L19.4 7.6L19.7 7.6L19.6 9.9L4.6 10.8L3.5 13.7L3.2 13.6L3.2 11.8L2.5 11.8L2.5 16.5z"/></svg>',
  minigun: '<svg viewBox="0 0 64 32"><path fill-rule="evenodd" d="M2.2 7.0L2.2 10.4L2.0 10.4L2.2 14.2L3.9 14.2L4.0 15.4L5.7 15.4L5.8 15.1L8.1 15.1L7.6 19.2L7.0 19.2L7.0 20.0L7.1 20.1L7.1 28.6L20.7 28.6L20.7 20.1L20.9 20.0L20.9 19.2L20.2 19.1L20.3 15.1L23.7 15.1L23.7 15.3L24.9 15.3L24.9 15.1L27.0 15.1L27.0 17.8L27.9 17.8L27.9 14.4L40.8 14.4L40.8 15.1L43.0 15.1L43.0 14.4L54.3 14.4L54.4 16.4L56.6 16.4L56.6 14.4L58.9 14.4L58.9 15.7L62.0 15.7L62.0 5.4L58.9 5.4L58.9 6.8L56.6 6.8L56.6 4.8L54.4 4.8L54.3 6.8L43.0 6.8L43.0 6.1L40.8 6.1L40.8 6.8L27.9 6.8L27.9 3.4L27.0 3.4L27.0 4.1L18.3 4.1L18.3 6.1L5.8 6.1L5.7 5.7L4.0 5.7L3.9 7.0zM43.0 12.4L54.3 12.4L54.4 12.6L43.0 12.7zM56.6 11.4L58.9 11.4L58.9 12.6L56.6 12.7zM27.9 11.4L32.4 11.4L32.5 12.4L40.8 12.4L40.8 12.6L27.9 12.7zM56.6 8.5L58.9 8.5L58.9 9.7L56.6 9.7zM43.0 8.5L54.3 8.5L54.4 8.8L43.0 8.8zM27.9 9.7L27.9 8.5L40.8 8.5L40.8 8.8L32.5 8.8L32.4 9.7z"/></svg>',
  scar: '<svg viewBox="0 0 64 32"><path fill-rule="evenodd" d="M2.0 16.0L2.1 16.2L5.9 18.1L9.4 15.6L13.8 15.0L15.5 15.0L14.7 21.6L17.3 22.1L19.6 15.4L19.8 15.4L19.8 17.2L20.1 17.2L20.1 15.2L22.3 15.3L22.5 16.6L23.0 16.6L23.0 15.2L27.4 15.1L27.5 19.7L28.2 24.5L29.8 27.8L32.7 26.3L32.6 25.7L31.2 22.7L30.8 19.6L30.9 15.0L35.3 15.0L35.3 14.2L38.4 14.1L38.4 14.8L50.4 14.8L50.4 14.2L50.0 14.2L49.9 13.9L51.3 13.8L51.3 12.8L53.4 12.8L53.5 12.5L58.6 12.5L58.6 12.8L59.8 12.8L59.8 12.9L60.2 12.9L60.3 12.8L60.6 12.8L60.6 12.9L62.0 12.8L62.0 11.0L61.0 11.0L61.0 10.9L60.3 11.0L60.2 10.9L59.8 10.9L59.8 11.0L58.6 11.0L58.6 11.2L53.5 11.2L53.4 11.0L51.3 11.0L51.3 9.6L51.1 9.6L51.0 9.4L53.1 9.3L53.1 8.8L52.7 8.8L52.7 8.5L52.2 8.5L52.1 8.8L51.3 8.8L51.3 8.5L50.6 8.5L50.6 7.4L50.2 7.4L50.2 8.4L49.4 8.5L49.4 8.8L48.6 8.8L48.6 8.5L48.1 8.5L48.0 8.8L47.2 8.8L47.2 8.5L46.7 8.5L46.7 8.8L45.9 8.8L45.8 8.5L45.3 8.5L45.3 8.8L44.5 8.8L44.5 8.5L44.0 8.5L43.9 8.8L43.1 8.8L43.1 8.5L42.6 8.5L42.5 8.8L41.8 8.8L41.7 8.5L41.2 8.5L41.1 8.8L40.4 8.8L40.4 8.5L39.8 8.5L39.8 8.8L39.0 8.8L39.0 8.5L38.5 8.5L38.4 8.8L37.6 8.8L37.6 8.5L37.1 8.5L37.0 8.8L36.3 8.8L36.2 8.5L35.7 8.5L35.7 8.8L34.9 8.8L34.9 8.5L34.4 8.5L34.3 8.8L33.5 8.8L33.5 8.5L33.0 8.5L33.0 8.8L32.2 8.8L32.1 8.5L31.6 8.5L31.6 8.8L30.8 8.8L30.8 8.5L30.3 8.5L30.2 8.8L29.4 8.8L29.4 8.5L28.9 8.5L28.9 8.8L28.1 8.8L28.0 8.5L27.5 8.5L27.4 8.8L26.7 8.8L26.7 4.6L25.1 4.6L25.0 5.0L24.1 5.0L24.1 5.2L23.3 5.2L23.3 4.2L21.9 4.2L21.8 5.0L20.8 5.0L20.8 5.2L20.4 5.2L20.4 4.8L19.2 4.8L19.1 4.9L19.1 7.9L19.2 8.1L20.6 8.1L20.6 8.8L19.8 8.8L19.8 8.5L19.3 8.5L19.2 8.8L18.5 8.8L18.4 8.5L17.9 8.5L17.9 8.8L17.1 8.8L17.0 8.5L16.6 8.5L16.5 8.8L15.7 8.8L15.7 8.5L15.2 8.5L15.1 8.8L14.1 8.8L14.0 9.1L5.8 9.5L2.9 10.2L2.7 10.5L2.0 10.5zM47.2 14.0L48.0 13.9L48.1 14.2L47.2 14.2zM45.8 14.0L46.7 13.9L46.7 14.2L45.9 14.2zM48.6 13.9L49.4 13.9L49.4 14.2L48.6 14.2zM25.3 8.3L26.1 8.2L26.1 8.8L25.4 8.8z"/></svg>',
  heavyar: '<svg viewBox="0 0 64 32"><path fill-rule="evenodd" d="M2.0 17.4L2.3 17.5L2.3 17.8L4.8 17.8L8.9 14.6L16.5 14.3L15.7 20.5L18.1 20.9L20.3 15.4L20.5 15.5L20.5 16.4L20.8 16.4L20.8 14.5L22.8 14.6L23.0 15.7L23.4 15.7L23.5 14.5L26.5 14.4L26.9 19.7L27.8 26.2L29.3 29.6L32.4 28.4L32.4 28.0L31.1 25.2L30.2 19.3L29.9 14.8L30.0 14.3L32.3 14.2L32.4 13.9L47.0 13.3L47.0 13.8L46.4 13.8L46.4 14.4L57.2 14.4L57.2 13.8L49.0 13.8L48.9 13.3L50.9 13.1L51.0 11.7L52.8 11.7L52.9 12.1L53.2 12.1L53.3 12.0L54.8 12.0L54.9 12.1L55.1 12.1L55.2 12.0L56.7 12.0L56.8 12.1L57.1 12.1L57.2 11.7L58.8 11.7L58.9 12.0L60.0 12.0L60.0 12.2L60.3 12.2L60.4 12.0L60.7 12.0L60.7 12.2L61.0 12.2L61.1 12.0L62.0 12.0L62.0 10.1L61.1 10.1L61.0 10.0L60.4 10.1L60.3 10.0L60.0 10.0L60.0 10.1L58.9 10.1L58.8 10.4L57.2 10.4L57.1 10.0L52.9 10.0L52.8 10.4L51.0 10.4L50.9 8.9L49.9 8.9L49.9 8.5L51.8 8.5L51.8 7.9L51.4 7.9L51.4 7.6L51.0 7.6L50.9 7.9L50.2 7.9L50.1 7.6L49.5 7.6L49.4 6.3L49.0 6.3L49.1 7.6L48.4 7.6L48.4 7.9L47.6 7.9L47.6 7.6L47.1 7.6L47.0 7.9L46.4 7.9L46.3 7.6L45.8 7.6L45.8 7.9L45.1 7.9L45.0 7.6L44.6 7.6L44.5 7.9L43.8 7.9L43.7 7.6L43.3 7.6L43.2 7.9L42.5 7.9L42.5 7.6L42.0 7.6L42.0 7.9L41.2 7.9L41.2 7.6L40.8 7.6L40.7 7.9L40.0 7.9L39.9 7.6L39.4 7.6L39.4 7.9L38.7 7.9L38.7 7.6L38.2 7.6L38.1 7.9L37.4 7.9L37.4 7.6L36.9 7.6L36.9 7.9L36.1 7.9L36.1 7.6L35.6 7.6L35.6 7.9L34.9 7.9L34.8 7.6L34.4 7.6L34.3 7.9L33.6 7.9L33.5 7.6L33.1 7.6L33.0 7.9L32.3 7.9L32.3 7.6L31.8 7.6L31.8 7.9L31.0 7.9L31.0 7.6L30.5 7.6L30.5 7.9L29.8 7.9L29.7 7.6L29.2 7.6L29.2 7.9L28.5 7.9L28.5 7.6L28.0 7.6L27.9 7.9L27.2 7.9L27.1 7.6L26.7 7.6L26.7 7.9L26.3 7.9L26.3 7.7L25.9 7.6L25.9 7.4L25.4 7.4L25.4 7.7L24.7 7.7L24.6 7.4L24.4 7.3L24.4 6.7L26.9 6.7L27.0 6.5L26.9 2.7L24.6 2.7L24.5 3.2L23.4 3.2L23.4 3.4L21.8 3.4L21.7 2.4L20.2 2.4L20.2 3.4L19.6 3.4L19.6 3.2L18.7 3.2L18.6 3.4L17.8 3.4L17.8 2.9L16.1 2.9L16.0 3.1L16.1 6.5L17.8 6.5L17.8 5.9L18.6 5.9L18.7 6.2L19.0 6.2L19.0 7.7L18.3 7.7L18.2 7.4L17.8 7.4L17.7 7.7L16.5 7.6L16.5 7.9L15.5 7.9L15.4 8.2L5.4 8.3L2.4 10.8L2.3 11.1L2.0 11.1zM44.6 8.5L48.6 8.5L48.7 8.8L44.7 8.8z"/></svg>',
  boombow: '<svg viewBox="0 0 64 32"><path fill-rule="evenodd" d="M31.8 16.7L31.8 17.6L32.5 17.6L32.5 16.7zM25.7 13.2L25.2 13.4L25.2 13.8L25.4 14.2L25.8 14.2L26.2 14.0L26.2 13.6L26.0 13.2zM33.3 2.0L32.8 2.2L32.4 2.6L28.8 3.6L25.5 7.0L23.9 11.1L21.8 11.2L21.5 14.2L21.1 14.6L19.5 14.6L19.5 19.0L21.4 19.0L21.6 20.8L23.9 20.9L25.5 25.0L28.8 28.4L32.4 29.4L32.8 29.8L33.3 30.0L33.8 29.8L34.1 29.5L34.1 28.6L33.8 28.3L33.3 28.2L32.6 28.3L25.1 21.1L24.8 20.3L24.4 20.4L24.2 20.2L24.6 17.3L31.4 17.3L31.4 16.9L24.7 16.9L24.7 16.7L26.2 16.7L26.3 16.2L40.5 16.2L40.5 16.8L41.2 16.8L44.5 16.1L44.4 15.8L41.2 15.2L40.5 15.2L40.5 15.8L26.3 15.8L26.2 15.3L24.8 15.3L24.6 11.8L24.8 11.7L25.1 10.9L32.6 3.7L33.3 3.8L33.8 3.7L34.1 3.4L34.1 2.5L33.8 2.2zM25.5 22.0L25.8 21.9L31.9 27.8L31.9 28.0L29.5 27.5L26.4 24.4zM31.9 4.0L31.9 4.2L25.8 10.1L25.5 10.0L26.4 7.6L29.5 4.5z"/></svg>',
  grapple: '<svg viewBox="0 0 64 32"><path fill-rule="evenodd" d="M58.2 13.7L58.0 13.7L57.4 16.1L57.9 16.2L58.7 13.9zM9.5 9.9L9.5 11.6L14.5 11.6L14.5 9.9zM57.1 9.8L56.7 10.2L58.9 13.3L59.4 12.9zM4.7 20.0L14.4 18.9L15.4 18.9L13.8 29.3L18.4 30.0L21.0 22.8L21.3 22.6L21.3 21.8L22.3 19.2L24.9 19.2L25.2 21.5L26.0 21.5L26.1 19.2L35.0 19.5L35.4 16.9L47.9 16.9L47.9 17.4L50.1 17.4L50.1 16.1L50.6 16.0L50.6 14.3L54.6 14.3L54.7 15.2L56.9 15.2L56.9 12.4L54.7 12.4L54.6 13.3L50.6 13.3L50.6 11.6L50.1 11.6L50.1 10.2L49.0 10.2L49.0 7.9L47.9 7.9L47.9 10.8L36.3 10.8L36.2 10.4L31.0 10.4L31.6 7.7L31.1 5.4L30.0 3.7L28.2 2.5L26.0 2.0L23.7 2.5L22.1 3.6L20.9 5.4L20.4 7.8L21.0 10.4L15.9 10.3L15.6 12.2L10.6 12.7L9.1 12.7L9.0 12.9L4.6 13.3z"/></svg>',
  keycard: '<svg viewBox="0 0 64 32"><rect x="16" y="4" width="30" height="24" rx="3"/></svg>',
  pickaxe: '<svg viewBox="0 0 64 32"><path d="M14 4c12-4 26-2 36 6l-3 3c-6-4-12-6-17-6L16 30h-6L26 8c-4 0-8 0-12 2z"/></svg>',
  bandage: '<svg viewBox="0 0 64 32"><rect x="18" y="6" width="28" height="20" rx="10"/></svg>',
  medkit: '<svg viewBox="0 0 64 32"><path d="M16 6h32v20H16zM29 9v5h-5v4h5v5h6v-5h5v-4h-5V9z" fill-rule="evenodd"/></svg>',
  shieldS: '<svg viewBox="0 0 64 32"><circle cx="32" cy="19" r="10"/><rect x="29" y="3" width="6" height="7"/></svg>',
  shieldL: '<svg viewBox="0 0 64 32"><path d="M24 4h16v6l6 8v12H18V18l6-8z"/></svg>',
};
function updateHotbar() {
  if (!player) return;
  const hb = $('hotbar');
  hb.innerHTML = player.slots.map((s, i) => {
    if (!s) return IS_TOUCH ? '<button type="button" class="slot" disabled aria-label="Emplacement vide"></button>' : `<div class="slot"><span class="num">${i + 1}</span></div>`;
    const r = s.kind === 'weapon' ? s.rarity : (s.id === 'shieldL' || s.id === 'medkit') ? 2 : 1;
    const nm = s.kind === 'weapon' ? WEAPONS[s.id].name : CONSUM[s.id].name;
    const cnt = s.kind === 'consum' ? `<span class="cnt">${s.count}</span>` : s.kind === 'weapon' && s.id !== 'pickaxe' ? `<span class="cnt">${s.mag}</span>` : '';
    const tag = IS_TOUCH ? 'button' : 'div';
    const attrs = IS_TOUCH ? `type="button" aria-label="${nm}" aria-pressed="${i === player.cur && !buildMode}"` : '';
    return `<${tag} ${attrs} class="slot r${s.id === 'pickaxe' ? 0 : r} ${i === player.cur && !buildMode ? 'sel' : ''}"><span class="num">${i + 1}</span>${cnt}${ICONS[s.id] || ''}<span class="nm">${nm}</span></${tag}>`;
  }).join('');
}
function updateBuildBar() {
  $('buildbar').classList.toggle('on', buildMode);
  document.querySelectorAll('.bpiece').forEach((e) => e.classList.toggle('sel', e.dataset.p === buildPiece));
  document.querySelectorAll('#tPieces .tp').forEach(e => {
    const selected = e.dataset.p === buildPiece;
    e.classList.toggle('sel', selected); e.setAttribute('aria-pressed', String(selected));
  });
}
function updateHUDStatic() {
  if (!player) return;
  // le compteur affiche matShown, qui suit player.mats avec le léger
  // retard des matériaux en cours d'aspiration (ils volent en arc vers
  // le compteur) ; une dépense recolle immédiatement, sans attendre,
  // et un gain direct (bois de départ, debug) saute le vol.
  for (const m of MAT_ORDER) {
    if (player.mats[m] < matShown[m]) matShown[m] = player.mats[m];
    else if (player.mats[m] > matShown[m] + matPending[m]) matShown[m] = player.mats[m] - matPending[m];
    matEl(m).textContent = matShown[m];
  }
  document.querySelectorAll('.mat').forEach((e) => e.classList.toggle('sel', e.dataset.mat === player.matSel));
}
// ---------------------------------------------------------------------
// Aspiration du loot : les matériaux récoltés ne s'affichent pas d'un coup,
// ils volent en arc (Bézier quadratique) depuis le point de récolte jusqu'à
// leur compteur HUD, qui pulse à chaque arrivée. Le total affiché rattrape
// la valeur réelle au fil des arrivées.
// ---------------------------------------------------------------------
const matShown = { wood: 0, stone: 0, metal: 0 };
const matPending = { wood: 0, stone: 0, metal: 0 }; // en vol vers le compteur
const matFlights = [];
const matTickT = { v: -1 };
const MAT_ICON = {
  wood: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="6" rx="1"/><rect x="2" y="13" width="20" height="6" rx="1"/></svg>',
  stone: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="9" height="7" rx="1"/><rect x="13" y="4" width="9" height="7" rx="1"/><rect x="6" y="13" width="12" height="7" rx="1"/></svg>',
  metal: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="7" cy="7" r="1.3"/><circle cx="17" cy="7" r="1.3"/><circle cx="7" cy="17" r="1.3"/><circle cx="17" cy="17" r="1.3"/></svg>',
};
function matEl(mat) { return $('mat' + mat[0].toUpperCase() + mat.slice(1)); }
const _mfp = new THREE.Vector3();
function matGain(mat, n, from) {
  stats.harvested += n;
  matFly(mat, n, from);
}
function matFly(mat, n, from) {
  const layer = $('matFly');
  if (!layer || !player || !player.alive || state !== 'playing') { if (player) { matShown[mat] = player.mats[mat]; matPending[mat] = 0; updateHUDStatic(); } return; }
  // point de départ écran : le point de récolte projeté (bord de l'écran si derrière la caméra)
  let sx = innerWidth / 2, sy = innerHeight * 0.6;
  if (from) {
    _mfp.set(from.x, from.y, from.z).project(camera);
    if (_mfp.z < 1) { sx = (_mfp.x * 0.5 + 0.5) * innerWidth; sy = (-_mfp.y * 0.5 + 0.5) * innerHeight; }
  }
  sx = Math.min(innerWidth - 30, Math.max(30, sx)); sy = Math.min(innerHeight - 30, Math.max(30, sy));
  // cible : le centre du compteur concerné
  const dst = matEl(mat).getBoundingClientRect();
  const tx = dst.left + dst.width / 2, ty = dst.top + dst.height / 2;
  const k = Math.max(2, Math.min(5, 2 + Math.floor(n / 8)));
  const per = Math.floor(n / k);
  matPending[mat] += n;
  for (let i = 0; i < k; i++) {
    const d = document.createElement('div');
    d.className = 'mf mf-' + mat;
    d.innerHTML = MAT_ICON[mat];
    layer.appendChild(d);
    matFlights.push({
      d, mat, amt: i === k - 1 ? n - per * (k - 1) : per,
      t: -i * 0.055, dur: 0.5 + i * 0.045,
      sx, sy: sy - i * 5, tx, ty,
      cx: (sx + tx) / 2 + (MR() - 0.5) * 170, cy: Math.min(sy, ty) - 90 - MR() * 80,
    });
  }
}
function updateMatFly(dt) {
  if (!matFlights.length) return;
  const flush = !player.alive || state !== 'playing';
  for (let i = matFlights.length - 1; i >= 0; i--) {
    const f = matFlights[i];
    if (flush) { // fin de partie : tout arrive d'un coup
      matShown[f.mat] = Math.min(player.mats[f.mat], matShown[f.mat] + f.amt);
      matPending[f.mat] = Math.max(0, matPending[f.mat] - f.amt);
      f.d.remove(); matFlights.splice(i, 1); continue;
    }
    f.t += dt;
    if (f.t < 0) { f.d.style.opacity = 0; continue; }
    const kk = f.t / f.dur;
    if (kk >= 1) { // arrivée : le compteur pulse et monte
      matShown[f.mat] = Math.min(player.mats[f.mat], matShown[f.mat] + f.amt);
      matPending[f.mat] = Math.max(0, matPending[f.mat] - f.amt);
      const el = matEl(f.mat);
      el.textContent = matShown[f.mat];
      el.parentElement.classList.remove('pulse'); void el.parentElement.offsetWidth; el.parentElement.classList.add('pulse');
      if (gameT - matTickT.v > 0.09) { matTickT.v = gameT; sfx('plip', 0.22); }
      f.d.remove(); matFlights.splice(i, 1); continue;
    }
    const e = Math.pow(kk, 1.6); // accélère en approche : effet d'aspiration
    const u = 1 - e;
    const x = u * u * f.sx + 2 * u * e * f.cx + e * e * f.tx;
    const y = u * u * f.sy + 2 * u * e * f.cy + e * e * f.ty;
    f.d.style.opacity = Math.min(1, f.t * 10);
    f.d.style.transform = `translate(${x}px,${y}px) scale(${1 - e * 0.35})`;
  }
  if (flush) updateHUDStatic();
}
let centerT = 0;
function showCenter(title, sub, dur = 2) {
  const c = $('centerMsg'); c.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ''}`; c.style.opacity = 1; centerT = dur;
}
let hudAcc = 0, lastSlotsSig = '';
function updateHUD(dt) {
  if (!player) return;
  touchSyncFn?.();
  updateMatFly(dt);
  if (hmT > 0) { hmT -= dt; if (hmT <= 0) $('hitmarker').style.opacity = 0; }
  if (centerT > 0) { centerT -= dt; if (centerT <= 0) $('centerMsg').style.opacity = 0; }
  hurtFlash = Math.max(0, hurtFlash - dt);
  $('vignette').style.opacity = Math.min(1, hurtFlash * 1.4);
  $('hud').classList.toggle('dead', !player.alive);
  updateVehicleHUD();
  hurtDirT = Math.max(0, hurtDirT - dt);
  const dd = $('dmgDir'); dd.style.opacity = Math.min(1, hurtDirT * 1.5);
  if (hurtDirT > 0) dd.style.transform = `rotate(${(-(hurtDir - camYaw - Math.PI)) * 180 / Math.PI}deg)`;
  $('stormOverlay').style.opacity = player.inStorm && player.alive ? 1 : 0;
  $('scope').style.display = scopeOn ? 'block' : 'none';
  $('crosshair').style.display = scopeOn || player.mode === 'bus' ? 'none' : 'block';
  // crosshair spread
  const W = weaponOf(player);
  let g = 9;
  if (W && !W.melee) g = 6 + ((mouse.r ? W.ads : W.spread) + player.bloom) * 260;
  $('crosshair').style.setProperty('--g', Math.min(40, g) + 'px');
  hudAcc += dt;
  if (hudAcc < 0.1) return;
  hudAcc = 0;
  { // the trail lags behind the fill (CSS transition delay) to show how much a hit took
    const hp = Math.max(0, Math.ceil(player.hp)), sh = Math.ceil(player.shield);
    $('hpFill').style.width = $('hpTrail').style.width = hp + '%'; $('hpTxt').innerHTML = `${hp}<small>/100</small>`;
    $('shieldFill').style.width = $('shieldTrail').style.width = sh + '%'; $('shieldTxt').innerHTML = `${sh}<small>/100</small>`;
    $('bars').classList.toggle('low', hp <= 30 && hp > 15); $('bars').classList.toggle('crit', hp <= 15);
  }
  { let n = 0; for (const c of chars) if (c.alive && !c.hench) n++; $('aliveN').textContent = n; }
  $('killsN').textContent = player.kills;
  { let tk = 0; for (const c of chars) if (!c.hench && c.team === player.team) tk += c.kills; $('teamKillsN').textContent = tk; }
  updateTeamHUD();
  updateHUDStatic();
  const it = player.item;
  if (buildMode) $('ammoInfo').innerHTML = `${player.mats[player.matSel]} <small>${player.matSel === 'wood' ? 'bois' : player.matSel === 'stone' ? 'pierre' : 'métal'} · ${keyLabel(BIND.matCycle)} changer · clic droit</small>`;
  else if (it && it.kind === 'weapon' && it.id !== 'pickaxe') { const Wd = WEAPONS[it.id]; $('ammoInfo').innerHTML = `<span class="wn" style="color:${RAR[it.rarity].css}">${Wd.name}</span>` + (player.reloading > 0 ? `<small>Rechargement…</small>` : IS_TOUCH ? `<span class="touch-ammo-values">${it.mag}<small>/ ${player.ammo[Wd.ammo]}</small></span>` : `${it.mag} <small>/ ${player.ammo[Wd.ammo]}</small>`); }
  else $('ammoInfo').innerHTML = '';
  const sig = player.slots.map((s) => s ? (s.id + (s.mag ?? '') + (s.count ?? '')) : '-').join() + player.cur + buildMode;
  if (sig !== lastSlotsSig) { lastSlotsSig = sig; updateHotbar(); }
  // storm text
  let st = '';
  if (storm.phase === -1) st = 'Zone en préparation';
  else if (storm.phase >= PHASES.length) st = 'Zone finale';
  else { const s = Math.max(0, Math.ceil(storm.timer)); const tt = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; st = storm.stage === 'wait' ? `Fermeture dans ${tt}` : `Se referme · ${tt}`; }
  { const mt = st.match(/\d+:\d\d/); const si = $('stormInfo'); $('stormText').textContent = mt ? mt[0] : '--'; si.title = st; si.dataset.full = st; }
  $('stormInfo').classList.toggle('closing', storm.phase >= 0 && storm.phase < PHASES.length && storm.stage !== 'wait');
  // prompt
  const pr = $('prompt');
  if (player.alive && player.mode === 'ground') {
    const t = nearestInteract();
    if (t) { pr.style.display = 'block'; pr.innerHTML = `<kbd>${keyLabel(BIND.interact)}</kbd> ${t.type === 'drop' ? 'Ouvrir le largage' : t.type === 'chest' ? 'Ouvrir le coffre' : t.type === 'door' ? (t.dr.open ? 'Fermer la porte' : 'Ouvrir la porte') : t.type === 'ammo' ? 'Ouvrir la caisse de munitions' : t.type === 'vault' ? (player.keycards && player.keycards[t.v.poi.key] ? 'Ouvrir le coffre-fort' : `Coffre-fort · carte de ${t.v.poi.name} requise`) : t.type === 'booth' ? (player.disguise ? 'Retirer le déguisement' : 'Se déguiser en homme de main') : t.type === 'vehicle' ? (t.v.kind === 'car' ? 'Conduire la voiture' : 'Piloter le bateau') : 'Ramasser ' + itemLabel(t.L.item) + weaponCard(t.L.item)}`; }
    else pr.style.display = 'none';
  } else if (player.alive && player.mode === 'drive') { pr.style.display = 'block'; pr.innerHTML = `<kbd>${keyLabel(BIND.interact)}</kbd> Descendre · ${Math.round(Math.abs(player.vehicle.speed) * 3.6)} km/h`; }
  else pr.style.display = 'none';
  const ub = $('useBar');
  if (player.using) { ub.style.display = 'block'; $('useLabel').textContent = CONSUM[player.using.item.id].name + '…'; $('useFill').style.width = (player.using.t / player.using.dur * 100) + '%'; }
  else if (player.reloading > 0 && W && !W.melee) { ub.style.display = 'block'; $('useLabel').textContent = 'Rechargement'; $('useFill').style.width = (100 - player.reloading / (W.reload * RAR[player.item.rarity].reload) * 100) + '%'; }
  else ub.style.display = 'none';
  $('busHint').style.display = player.mode === 'bus' ? 'block' : 'none';
}

// Minimap — carte pré-rendue haute résolution (1024px) : relief ombré
// (hillshade lumière nord-ouest), biomes, forêts mouchetées, écume sur la
// ligne de rivage, empreintes des bâtiments (dont ceux des POI espions).
const mapCanvas = document.createElement('canvas'); mapCanvas.width = mapCanvas.height = 1024;
{
  const g = mapCanvas.getContext('2d');
  const N = 1024, S = WORLD_R * 2 + 40;
  const img = g.createImageData(N, N);
  const H = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++)
    H[j * N + i] = terrainH((i / N - 0.5) * S, (j / N - 0.5) * S);
  const step = S / N;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const h = H[j * N + i];
    const x = (i / N - 0.5) * S, z = (j / N - 0.5) * S;
    let r, gg, b;
    if (h < 0) {
      const d = clamp(-h / 6, 0, 1);
      r = 36 - d * 12; gg = 150 - d * 46; b = 205 - d * 38;
      if (h > -0.55) { r += 70; gg += 60; b += 42; } // écume près de la rive
    } else if (h < 1.6) { r = 236; gg = 216; b = 150; }
    else if (h > 40) { r = 235; gg = 240; b = 250; }
    else if (h > 26) { r = 140; gg = 145; b = 150; }
    else {
      const n = fbm(x * 0.05, z * 0.05); r = 100 - n * 20; gg = 190 - n * 30; b = 70;
      const bw = biomeW(x, z);
      r = lerp(r, 232, bw.desert); gg = lerp(gg, 196, bw.desert); b = lerp(b, 120, bw.desert);
      r = lerp(r, 50, bw.forest * 0.6); gg = lerp(gg, 140, bw.forest * 0.6); b = lerp(b, 60, bw.forest * 0.6);
      r = lerp(r, 236, bw.snow); gg = lerp(gg, 242, bw.snow); b = lerp(b, 250, bw.snow);
      // feuillage sombre moucheté dans les forêts
      if (bw.forest > 0.35 && h < 32 && vnoise(i * 0.77 + 13, j * 0.77 + 31) > 0.82) { r *= 0.55; gg *= 0.68; b *= 0.55; }
    }
    if (h >= 0) {
      // relief : lumière venant du nord-ouest (pentes exposées éclaircies)
      const hx = (H[j * N + Math.min(N - 1, i + 1)] - H[j * N + Math.max(0, i - 1)]) / (2 * step);
      const hz = (H[Math.min(N - 1, j + 1) * N + i] - H[Math.max(0, j - 1) * N + i]) / (2 * step);
      const sh = clamp(1 + (hx + hz) * 0.4, 0.55, 1.45);
      r *= sh; gg *= sh; b *= sh;
    }
    const k = (j * N + i) * 4; img.data[k] = r; img.data[k + 1] = gg; img.data[k + 2] = b; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // empreintes des bâtiments : maisons destructibles (brun) et structures des
  // POI espions, indestructibles (gris acier) — pont de La Plateforme inclus
  for (const s of structs) {
    if (s.kind !== 'house') continue;
    const x = (s.minX / S + 0.5) * N, z = (s.minZ / S + 0.5) * N;
    const w = Math.max(1, (s.maxX - s.minX) / S * N), d = Math.max(1, (s.maxZ - s.minZ) / S * N);
    g.fillStyle = s.indestructible ? 'rgba(52,62,78,.92)' : 'rgba(110,84,58,.92)';
    g.fillRect(x, z, w, d);
    g.strokeStyle = s.indestructible ? 'rgba(170,190,210,.55)' : 'rgba(60,44,28,.6)';
    g.lineWidth = 0.6;
    g.strokeRect(x, z, w, d);
  }
  mapCanvas.S = S; mapCanvas.N = N;
}
const mm = $('minimap').getContext('2d');
// Grande carte zoomable : la molette grossit la carte (centrée sur le curseur),
// le glisser-déplacer la fait défiler, le clic place un marqueur.
const bigView = { cx: 0, cz: 0, w: WORLD_R * 2 + 30 };
function clampBigView() {
  const lim = WORLD_R + 20;
  bigView.cx = Math.max(-lim, Math.min(lim, bigView.cx));
  bigView.cz = Math.max(-lim, Math.min(lim, bigView.cz));
}
const bigmapCanvas = $('bigmapCanvas');
let bmDrag = null;
bigmapCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const r = bigmapCanvas.getBoundingClientRect();
  const oldW = bigView.w;
  const mx = ((e.clientX - r.left) / r.width - 0.5) * oldW + bigView.cx;
  const mz = ((e.clientY - r.top) / r.height - 0.5) * oldW + bigView.cz;
  const nw = Math.max(140, Math.min(WORLD_R * 2 + 30, oldW * Math.exp(e.deltaY * 0.0014)));
  bigView.cx = mx - (mx - bigView.cx) * (nw / oldW);
  bigView.cz = mz - (mz - bigView.cz) * (nw / oldW);
  bigView.w = nw;
  clampBigView();
  if (bigmapOpen) drawMap(bm, 720, bigView.cx, bigView.cz, bigView.w, true);
}, { passive: false });
bigmapCanvas.addEventListener('mousedown', (e) => {
  bmDrag = { x: e.clientX, y: e.clientY, cx: bigView.cx, cz: bigView.cz, moved: false };
});
window.addEventListener('mousemove', (e) => {
  if (!bmDrag || !bigmapOpen) return;
  const dx = e.clientX - bmDrag.x, dy = e.clientY - bmDrag.y;
  if (Math.hypot(dx, dy) > 4) bmDrag.moved = true;
  if (bmDrag.moved) {
    const r = bigmapCanvas.getBoundingClientRect();
    const s = r.width / bigView.w;
    bigView.cx = bmDrag.cx - dx / s;
    bigView.cz = bmDrag.cz - dy / s;
    clampBigView();
    drawMap(bm, 720, bigView.cx, bigView.cz, bigView.w, true);
  }
});
window.addEventListener('mouseup', (e) => {
  if (!bmDrag) return;
  const drag = bmDrag; bmDrag = null;
  if (drag.moved || !bigmapOpen) return;
  const r = bigmapCanvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width - 0.5) * bigView.w + bigView.cx;
  const z = ((e.clientY - r.top) / r.height - 0.5) * bigView.w + bigView.cz;
  setMarker(x, z);
});
const bm = $('bigmapCanvas').getContext('2d');
function w2m(x, z, cx, cz, scale, size) { return [(x - cx) * scale + size / 2, (z - cz) * scale + size / 2]; }
// Icône de POI dessiné à la main : forme dédiée pour chaque POI espion
// (derrick, aileron, yacht, crâne, étoile), point blanc pour les autres.
function drawPOIIcon(ctx, p, x, z, s) {
  ctx.save(); ctx.translate(x, z);
  ctx.lineWidth = Math.max(1, s * 0.16); ctx.strokeStyle = '#0a2a4a';
  ctx.fillStyle = p.spy ? '#ffd23f' : '#ffffff';
  if (p.key === 'rig') { // derrick de forage
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s, s); ctx.lineTo(-s, s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke();
  } else if (p.key === 'shark') { // aileron de requin
    ctx.beginPath(); ctx.moveTo(-s, s); ctx.quadraticCurveTo(0, -s, s * 0.5, s); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (p.key === 'yacht') { // coque + voile
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.6, s * 0.3); ctx.lineTo(0, s * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillRect(-s, s * 0.3, 2 * s, s * 0.5); ctx.strokeRect(-s, s * 0.3, 2 * s, s * 0.5);
  } else if (p.key === 'grotto') { // crâne
    ctx.beginPath(); ctx.arc(0, 0, s * 0.85, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0a2a4a';
    ctx.beginPath(); ctx.arc(-s * 0.32, -s * 0.12, s * 0.2, 0, 7); ctx.arc(s * 0.32, -s * 0.12, s * 0.2, 0, 7); ctx.fill();
    ctx.fillRect(-s * 0.1, s * 0.28, s * 0.2, s * 0.3);
  } else if (p.key === 'agency') { // étoile de l'Agence
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? s * 0.45 : s; const a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else { // lieu classique
    ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, 7); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
function drawMap(ctx, size, cx, cz, viewW, full) {
  const S = mapCanvas.S, N = mapCanvas.N, scale = size / viewW;
  ctx.save(); ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#12406b'; ctx.fillRect(0, 0, size, size);
  const sx = ((cx - viewW / 2) / S + 0.5) * N, sz = ((cz - viewW / 2) / S + 0.5) * N, sw = viewW / S * N;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(mapCanvas, sx, sz, sw, sw, 0, 0, size, size);
  // grille discrète (grande carte : 100 m)
  if (full) {
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1;
    const g0 = Math.ceil(-viewW / 2 / 100) * 100;
    for (let gx = g0; gx <= viewW / 2; gx += 100) { const [x] = w2m(gx, 0, cx, cz, scale, size); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke(); }
    for (let gz = g0; gz <= viewW / 2; gz += 100) { const [, z] = w2m(0, gz, cx, cz, scale, size); ctx.beginPath(); ctx.moveTo(0, z); ctx.lineTo(size, z); ctx.stroke(); }
  }
  // tempête : dégradé violet + double liseré
  if (storm.phase >= 0) {
    const [scx, scz] = w2m(storm.cx, storm.cz, cx, cz, scale, size);
    const R = Math.max(0, storm.r * scale);
    const grd = ctx.createRadialGradient(scx, scz, R * 0.5, scx, scz, Math.max(R, size * 1.6));
    grd.addColorStop(0, 'rgba(120,40,220,.16)'); grd.addColorStop(0.8, 'rgba(110,30,210,.42)'); grd.addColorStop(1, 'rgba(95,20,195,.55)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.rect(0, 0, size, size); ctx.arc(scx, scz, R, 0, Math.PI * 2, true); ctx.fill();
    ctx.strokeStyle = '#d6b3ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(scx, scz, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(214,179,255,.4)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(scx, scz, Math.max(0, R - 4), 0, Math.PI * 2); ctx.stroke();
    if (storm.phase < PHASES.length) {
      const [nx, nz] = w2m(storm.nx, storm.nz, cx, cz, scale, size);
      // zone sûre suivante : anneau blanc net + halo pour bien la marquer
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,.95)'; ctx.shadowBlur = 14;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(nx, nz, Math.max(2, storm.nr * scale), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(nx, nz, Math.max(2, storm.nr * scale), 0, Math.PI * 2); ctx.stroke();
      if (player.alive && Math.hypot(player.pos.x - storm.nx, player.pos.z - storm.nz) > storm.nr) {
        const [px, pz] = w2m(player.pos.x, player.pos.z, cx, cz, scale, size);
        ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.moveTo(px, pz); ctx.lineTo(nx, nz); ctx.stroke(); ctx.setLineDash([]);
      }
    }
  }
  if (full) {
    ctx.font = `800 ${Math.round(size / 30)}px "Barlow Condensed", sans-serif`; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
    ctx.fillText(document.getElementById('stormInfo').dataset.full || '', 14, 30);
  }
  // icônes des POI (toutes les cartes) + noms (grande carte)
  for (const p of POIS) {
    const [x, z] = w2m(p.x, p.z, cx, cz, scale, size);
    if (x < -24 || z < -24 || x > size + 24 || z > size + 24) continue;
    drawPOIIcon(ctx, p, x, z, full ? 10 : (p.spy ? 5.5 : 3.5));
    if (full) {
      ctx.font = `700 ${Math.round(size / 44)}px "Barlow Condensed", sans-serif`; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillText(p.name.toUpperCase(), x + 1, z + 15);
      ctx.fillStyle = p.spy ? '#ffd23f' : '#fff'; ctx.fillText(p.name.toUpperCase(), x, z + 14);
    }
  }
  // trajectoire du bus (pointillés) sur toutes les cartes
  if (bus.active) {
    const [a1, b1] = w2m(bus.start.x, bus.start.z, cx, cz, scale, size), [a2, b2] = w2m(bus.end.x, bus.end.z, cx, cz, scale, size);
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a1, b1); ctx.lineTo(a2, b2); ctx.stroke(); ctx.setLineDash([]);
  }
  // grande carte : nord + échelle
  if (full) {
    ctx.font = `800 ${Math.round(size / 26)}px "Barlow Condensed", sans-serif`; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 3;
    ctx.strokeText('N', size / 2, size / 26 + 8); ctx.fillStyle = '#fff'; ctx.fillText('N', size / 2, size / 26 + 8);
    const L = 100 * scale;
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.fillRect(18, size - 22, L, 3); ctx.fillRect(18, size - 26, 3, 8); ctx.fillRect(18 + L - 3, size - 26, 3, 8);
    ctx.font = `700 ${Math.round(size / 52)}px "Barlow Condensed", sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('100 m', 18 + L / 2, size - 30);
  } else {
    // mini-carte : rose nord discrète en haut
    ctx.font = '800 12px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2.5;
    ctx.strokeText('N', size / 2, 14); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillText('N', size / 2, 14);
  }
  // ligne bleue pointillée vers le coffre-fort quand on a la carte
  for (const v of vaults) {
    if (v.open || !(player.keycards && player.keycards[v.poi.key])) continue;
    const [px, pz] = w2m(player.pos.x, player.pos.z, cx, cz, scale, size);
    const [vx, vz] = w2m(v.x, v.z, cx, cz, scale, size);
    ctx.setLineDash([7, 7]); ctx.strokeStyle = 'rgba(63,169,255,.95)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(px, pz); ctx.lineTo(vx, vz); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#0a2a4a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(vx, vz, 5, 0, 7); ctx.fill(); ctx.stroke();
  }
  for (const v of vehicles) { const [x, z] = w2m(v.pos.x, v.pos.z, cx, cz, scale, size); if (x < 0 || z < 0 || x > size || z > size) continue; ctx.fillStyle = v.kind === 'car' ? '#ff6a3d' : '#ffffff'; ctx.beginPath(); ctx.arc(x, z, full ? 4 : 3, 0, 7); ctx.fill(); }
  for (const m of mates) { if (!m.alive || m.mode === 'bus') continue; const [x, z] = w2m(m.pos.x, m.pos.z, cx, cz, scale, size); ctx.fillStyle = '#5fe3ff'; ctx.strokeStyle = '#003a55'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, z, 5, 0, 7); ctx.fill(); ctx.stroke(); }
  if (marker.on) { const [x, z] = w2m(marker.pos.x, marker.pos.z, cx, cz, scale, size); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, z - 12); ctx.lineTo(x + 6, z - 4); ctx.lineTo(x, z + 2); ctx.lineTo(x - 6, z - 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  for (const d of drops) { if (d.opened) continue; const [x, z] = w2m(d.x, d.z, cx, cz, scale, size); ctx.fillStyle = '#3fa9ff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.fillRect(x - 5, z - 5, 10, 10); ctx.strokeRect(x - 5, z - 5, 10, 10); }
  // bus
  if (bus.active) { const [x, z] = w2m(bus.pos.x, bus.pos.z, cx, cz, scale, size); ctx.fillStyle = '#3fa9ff'; ctx.beginPath(); ctx.arc(x, z, 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.stroke(); }
  // player arrow
  const pp = player.mode === 'bus' ? bus.pos : player.pos;
  const [px, pz] = w2m(pp.x, pp.z, cx, cz, scale, size);
  ctx.translate(px, pz); ctx.rotate(-camYaw);
  ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 3); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
let mapAcc = 0;
function updateMaps(dt) {
  mapAcc += dt; if (mapAcc < 0.066) return; mapAcc = 0;
  const pp = player.mode === 'bus' ? bus.pos : player.pos;
  drawMap(mm, 200, pp.x, pp.z, player.mode === 'bus' ? 260 : 120, false);
  if (bigmapOpen) drawMap(bm, 720, bigView.cx, bigView.cz, bigView.w, true);
}

// =====================================================================
// Ghost update & world animation
// =====================================================================
function updateGhost() {
  for (const k in ghosts) ghosts[k].visible = false;
  if (!buildMode || !ghostTarget || !player.alive) return;
  const t = ghostTarget;
  let { cx, cz, d } = t;
  if (t.type === 'wall') [cx, cz, d] = normWall(cx, cz, d);
  const g = ghosts[t.type];
  pieceTransform(t.type, cx, cz, t.y, d, g);
  const exists = builds.has(buildKey(t.type, cx, cz, t.y, d));
  const tooHigh = buildTooHigh(t.type, t.y);
  g.material = tooHigh || player.mats[player.matSel] < BUILD_COST || exists ? GHOST_BAD : GHOST_MAT;
  g.visible = !exists || true;
}
function updateWorld(dt) {
  // torchère de La Plateforme : flamme et lumière vivantes
  if (rigFlare) {
    rigFlare.light.intensity = 2.3 + Math.sin(gameT * 17) * 0.5 + Math.sin(gameT * 7.3) * 0.4;
    const s = 1 + Math.sin(gameT * 11) * 0.1 + Math.sin(gameT * 23) * 0.05;
    rigFlare.flame.scale.set(s, 1 + Math.sin(gameT * 9) * 0.12, s);
  }
  // animations des POI espions (cascade du Requin, barque, bouées, radar et
  // projecteurs de l'Agence)
  for (const a of spyFx) a(dt, gameT);
  for (const L of loot) {
    if (!L.alive) continue;
    L.t += dt;
    const lTh = terrainH(L.pos.x, L.pos.z);
    // dans la Grotte, le butin tombe sur les dalles rocheuses (colliders), pas sur le terrain au-dessus
    const lUnder = underGrotto(L.pos.x, L.pos.z, L.pos.y);
    if (L.vel.lengthSq() > 0.01 || L.pos.y > lTh + 0.05 || lUnder) {
      L.vel.y -= 20 * dt; L.pos.addScaledVector(L.vel, dt);
      let gy = lUnder ? -1e9 : lTh;
      queryCols(L.pos.x, L.pos.z, 0.5, tmpCols);
      for (const c of tmpCols) if (c.type === 'box' && L.pos.x > c.minX && L.pos.x < c.maxX && L.pos.z > c.minZ && L.pos.z < c.maxZ && c.maxY <= L.pos.y + 0.5 && c.maxY > gy) gy = c.maxY;
      if (L.pos.y <= gy) { L.pos.y = gy; L.vel.set(0, 0, 0); }
    }
    L.model.rotation.y += dt * 1.4;
    L.model.position.y = 0.55 + Math.sin(L.t * 2.2) * 0.1;
  }
  chestHumT -= dt;
  // cascade de la Grotte : défilement de la texture + embruns au pied
  if (grottoWaterfallTex) {
    grottoWaterfallTex.offset.y -= dt * 0.85;
    if (grottoPoolPos && MR() < dt * 2.5) burst(_v1.set(grottoPoolPos.x + (MR() - 0.5) * 2.4, 0.1, grottoPoolPos.z + (MR() - 0.5) * 2.4), 0xbfe8ff, 2, 2.2, 0.09, 0.4, 0.5);
  }
  let nearC = null, nearD = 11;
  const pp = player.pos;
  for (const c of chests) {
    if (c.opened) continue;
    const dx = c.x - pp.x, dz = c.z - pp.z, d2 = dx * dx + dz * dz;
    if (d2 > 3600) { if (c.light.intensity) c.light.intensity = 0; continue; }
    const d = Math.sqrt(d2), near = clamp(1 - (d - 3) / 12, 0, 1);
    c.light.intensity = (0.4 + near * 2.6) * (1 + Math.sin(gameT * 5 + c.x) * 0.25);
    c.light.distance = 4 + near * 5;
    c.lid.position.y = 0.72 + Math.max(0, Math.sin(gameT * 9 + c.z)) * 0.05 * near;
    if (near > 0.3 && MR() < dt * 6 * near) burst(_v1.set(c.x + (MR() - 0.5), c.y + 0.9, c.z + (MR() - 0.5)), 0xffd23f, 1, 1.2, 0.07, -0.15, 0.9);
    if (d < nearD && Math.abs(c.y - pp.y) < 6) { nearD = d; nearC = c; }
  }
  if (nearC && chestHumT <= 0 && player.alive) { chestHumT = 1.5; sfxAt('hum', _v1.set(nearC.x, nearC.y, nearC.z), 1.6); }
  for (const t of tracers) if (t.life > 0) { t.life -= dt; t.m.material.opacity = Math.max(0, t.life / 0.07) * 0.9; if (t.life <= 0) t.m.visible = false; }
  if (flashT > 0) { flashT -= dt; if (flashT <= 0) { flash.visible = false; flashLight.intensity = 0; } }
  for (const s of buildList) if (s.shake > 0) { s.shake -= dt; }
}

// =====================================================================
// Supply drops
// =====================================================================
const drops = [];
const beamDropGeo = new THREE.CylinderGeometry(0.35, 0.35, 160, 10, 1, true); beamDropGeo.translate(0, 80, 0);
const beamDropMat = new THREE.MeshBasicMaterial({ color: 0x3fa9ff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
function spawnSupplyDrop() {
  if (state !== 'playing') return;
  const p = randomLandPoint(storm.nx, storm.nz, Math.max(6, storm.nr * 0.7));
  const g = new THREE.Group();
  const crate = new THREE.Group();
  addBox(crate, 1.5, 1.2, 1.5, 0, 0.6, 0, matC(0x2f6fe8, { emissive: 0x0a2a70, emissiveIntensity: 0.4 }));
  addBox(crate, 1.56, 0.18, 1.56, 0, 1.15, 0, matC(0xffd23f, { metalness: 0.4, roughness: 0.4 }));
  addBox(crate, 1.56, 0.18, 1.56, 0, 0.1, 0, matC(0xffd23f, { metalness: 0.4, roughness: 0.4 }));
  addBox(crate, 0.2, 1.24, 1.56, 0, 0.6, 0, matC(0xffd23f));
  g.add(crate);
  // Grand ballon ovale (même modèle que le bus de combat, en plus petit) qui porte la caisse.
  const balloon = makeBallon(2.9); balloon.position.y = 5.2; g.add(balloon);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cableBetween(g, x * 0.75, 1.24, z * 0.75, x * 2.0, 2.0, z * 2.0, 0.03, matC(0x333333));
  const light = { intensity: 2, distance: 10, color: 0x3fa9ff, y: 2, obj: g };
  g.position.set(p.x, 125, p.z); scene.add(g);
  const beam = new THREE.Mesh(beamDropGeo, beamDropMat); beam.position.set(p.x, terrainH(p.x, p.z), p.z); scene.add(beam);
  drops.push({ x: p.x, z: p.z, y: 125, mesh: g, balloon, beam, light, landed: false, opened: false });
  if (player.alive) { showCenter('LARGAGE EN APPROCHE', 'Repère le faisceau bleu sur la carte', 2.6); sfx('warn', 0.5); }
}
// A fixed number of real point lights follows the closest glowing chests / drops.
// Keeping the count constant means shaders never recompile when chests or drops appear, and each pixel only loops over a few lights.
const LIGHT_POOL = Array.from({ length: LOWQ ? 2 : 4 }, () => { const l = new THREE.PointLight(0xffffff, 0, 6); scene.add(l); return l; });
const _lc = [];
function updateLightPool() {
  _lc.length = 0;
  const pp = player ? player.pos : camera.position;
  for (const c of chests) if (!c.opened && c.light.intensity > 0) _lc.push(c.light);
  for (const d of drops) if (!d.opened && d.light.intensity > 0) _lc.push(d.light);
  for (const v of _lc) { const o = v.obj.position; v.d2 = (o.x - pp.x) ** 2 + (o.z - pp.z) ** 2; }
  _lc.sort((a, b) => a.d2 - b.d2);
  for (let i = 0; i < LIGHT_POOL.length; i++) {
    const L = LIGHT_POOL[i], v = _lc[i];
    if (!v) { L.intensity = 0; continue; }
    L.position.copy(v.obj.position); L.position.y += v.y; L.color.setHex(v.color); L.intensity = v.intensity; L.distance = v.distance;
  }
}
function updateDrops(dt) {
  for (const d of drops) {
    if (d.opened) continue;
    if (!d.landed) {
      d.y -= 5 * dt; d.sway = (d.sway || 0) + dt;
      d.mesh.rotation.z = Math.sin(d.sway * 1.3) * 0.08; d.mesh.rotation.x = Math.cos(d.sway * 1.1) * 0.06;
      let gy = terrainH(d.x, d.z), sup = null, sl = null;
      queryCols(d.x, d.z, 1, tmpCols);
      for (const c of tmpCols) {
        if (!c.alive) continue;
        if (d.x <= c.minX || d.x >= c.maxX || d.z <= c.minZ || d.z >= c.maxZ) continue;
        if (c.type === 'box') { if (c.maxY > gy && c.maxY < d.y + 0.5) { gy = c.maxY; sup = c; sl = null; } }
        else if (c.type === 'slope') {
          // toit à deux pentants : la caisse se pose sur la pente, pas dans la toiture
          const h = slopeH(c, d.x, d.z);
          if (h > gy && h < d.y + 0.5) { gy = h; sup = c; sl = c; }
        }
      }
      // le faisceau désigne la surface sur laquelle la caisse va se poser (toit inclus)
      if (d.beam) d.beam.position.y = gy;
      d.mesh.position.y = d.y; d.mesh.rotation.y += dt * 0.4;
      if (d.y <= gy) {
        d.y = gy; d.landed = true; d.sup = sup;
        const yaw = d.mesh.rotation.y; // cap capturé avant toute réorientation
        d.mesh.rotation.set(0, yaw, 0);
        if (sl) {
          // caisse posée à plat sur la pente du toit : on aligne sa base sur
          // la normale de pente (gradient signé — le second versant a une
          // amplitude négative), puis on conserve son cap autour de cet axe.
          const s = (sl.y1 - sl.y0) / (sl.e1 - sl.e0);
          const n = new THREE.Vector3(sl.axis === 'x' ? -s : 0, 1, sl.axis === 'z' ? -s : 0).normalize();
          const up = new THREE.Vector3(0, 1, 0);
          d.mesh.quaternion.setFromUnitVectors(up, n);
          d.mesh.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(up, yaw));
        }
        // le repère bleu a rempli son rôle : la caisse et sa lumière prennent le relais
        if (d.beam) { scene.remove(d.beam); d.beam = null; }
        sfxAt('land', d.mesh.position, 1); burst(_v1.set(d.x, gy + 0.3, d.z), 0xd8c8a0, 16, 6, 0.25, 1, 0.8);
        // collision ajustée aux bornes mondiales de la caisse seule (sans ballon
        // ni câbles) : une caisse inclinée dépasse la boîte de 1,06/1,3 d'origine
        d.mesh.updateMatrixWorld(true);
        const bb = new THREE.Box3().setFromObject(d.mesh.children[0]);
        d.col = propBox((bb.min.x + bb.max.x) / 2, gy, (bb.min.z + bb.max.z) / 2, Math.max(0.75, (bb.max.x - bb.min.x) / 2), Math.max(0.75, (bb.max.z - bb.min.z) / 2), Math.max(1.2, bb.max.y - gy));
      } // caisse 1,5 m carrée : la boîte englobe le modèle quelle que soit l'inclinaison
    } else if (d.sup && !d.sup.alive) {
      // le support a été détruit (toit cassé sous la caisse) : elle retombe au sol
      d.landed = false; d.sup = null;
      if (d.col) { removePropCol(d.col); d.col = null; }
      d.mesh.rotation.set(0, d.mesh.rotation.y, 0);
    } else if (d.balloon.visible) {
      // canopy collapses and drifts away
      d.cT = (d.cT || 0) + dt;
      d.balloon.position.y = Math.max(2.0, 5.2 - d.cT * 3); d.balloon.position.x += dt * 1.5; d.balloon.scale.y = Math.max(0.06, 1.15 * (1 - d.cT * 0.8));
      if (d.cT > 1.6) d.balloon.visible = false;
    }
    d.light.intensity = 1.5 + Math.sin(gameT * 5) * 0.8;
  }
}
function openDrop(d) {
  d.opened = true; stats.supply++; addXP('Largage ouvert', 150);
  if (d.beam) { scene.remove(d.beam); d.beam = null; } d.light.intensity = 0;
  d.mesh.children[0].scale.set(1, 0.4, 1);
  sfx('chest', 0.8);
  const w = randWeaponItem(3); spawnLoot(w, d.x, d.y + 1, d.z); spawnLoot(ammoFor(w.id), d.x, d.y + 1, d.z); spawnLoot(ammoFor(w.id), d.x, d.y + 1, d.z);
  spawnLoot({ kind: 'consum', id: 'shieldL', count: 2 }, d.x, d.y + 1, d.z);
  spawnLoot({ kind: 'mats', mat: 'wood', amount: 100 }, d.x, d.y + 1, d.z); spawnLoot({ kind: 'mats', mat: 'stone', amount: 100 }, d.x, d.y + 1, d.z); spawnLoot({ kind: 'mats', mat: 'metal', amount: 100 }, d.x, d.y + 1, d.z);
  // la caisse aplatie reste visible 1,5 s : la collision part avec le modèle
  setTimeout(() => { removePropCol(d.col); scene.remove(d.mesh); }, 1500);
}

// =====================================================================
// Harvest weak points
// =====================================================================
const weakTex = canvasTex((g, s) => {
  g.clearRect(0, 0, s, s);
  g.strokeStyle = '#7fe0ff'; g.lineWidth = 12; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 10, 0, 7); g.stroke();
  g.fillStyle = 'rgba(80,190,255,.55)'; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 22, 0, 7); g.fill();
  g.fillStyle = '#e6fbff'; g.beginPath(); g.arc(s / 2, s / 2, 12, 0, 7); g.fill();
});
const weak = { key: null, pos: new THREE.Vector3(), t: 0, sprite: new THREE.Sprite(new THREE.SpriteMaterial({ map: weakTex, depthTest: false, transparent: true })) };
weak.sprite.scale.set(0.55, 0.55, 1); weak.sprite.visible = false; weak.sprite.renderOrder = 20; scene.add(weak.sprite);
function weakHide() { weak.sprite.visible = false; weak.key = null; }
function weakCheck(hit, key) {
  let crit = false;
  if (weak.key === key && weak.sprite.visible) {
    _v1.copy(weak.pos).project(camera);
    const px = _v1.x * window.innerWidth / 2, py = _v1.y * window.innerHeight / 2;
    if (Math.hypot(px, py) < 46) crit = true;
  }
  weak.key = key;
  const right = _v2.set(Math.cos(camYaw), 0, -Math.sin(camYaw));
  weak.pos.copy(hit.point).addScaledVector(right, (MR() - 0.5) * 0.9);
  weak.pos.y += (MR() - 0.5) * 1.1;
  _v3.copy(camera.position).sub(hit.point).normalize();
  weak.pos.addScaledVector(_v3, 0.25);
  weak.sprite.position.copy(weak.pos); weak.sprite.visible = true; weak.t = 3.5;
  if (crit) { burst(hit.point, 0x7fe0ff, 10, 5, 0.12, 0.6, 0.6); }
  return crit;
}
function updateWeak(dt) {
  if (!weak.sprite.visible) return;
  weak.t -= dt;
  const it = player && player.item;
  if (weak.t <= 0 || !player.alive || !it || it.id !== 'pickaxe' || buildMode) weakHide();
  else weak.sprite.material.rotation += dt * 2;
}

// =====================================================================
// Confetti (victory)
// =====================================================================
const confCanvas = document.getElementById('confetti');
const confCtx = confCanvas.getContext('2d');
let confetti = [], confOn = false, confSpawn = 0;
const CONF_COLS = ['#ffd23f', '#ff4d6a', '#3fa9ff', '#5fe35f', '#c27bff', '#ffffff', '#ff9d00'];
function startConfetti() {
  confOn = true; confCanvas.style.display = 'block';
  confCanvas.width = window.innerWidth; confCanvas.height = window.innerHeight;
  for (let i = 0; i < 260; i++) addConfetti(true);
}
function addConfetti(burstMode) {
  const W = confCanvas.width, H = confCanvas.height;
  confetti.push({
    x: burstMode ? W / 2 + (MR() - 0.5) * 200 : MR() * W, y: burstMode ? H * 0.45 : -20,
    vx: burstMode ? (MR() - 0.5) * 1400 : (MR() - 0.5) * 60, vy: burstMode ? -400 - MR() * 900 : 80 + MR() * 120,
    r: MR() * 6, vr: (MR() - 0.5) * 12, w: 6 + MR() * 8, h: 10 + MR() * 10, c: CONF_COLS[Math.floor(MR() * CONF_COLS.length)], life: 6 + MR() * 3,
  });
}
function updateConfetti(dt) {
  if (!confOn) return;
  confSpawn += dt;
  if (state === 'victory' || state === 'over') while (confSpawn > 0.02) { confSpawn -= 0.02; if (confetti.length < 500) addConfetti(false); }
  const ctx = confCtx; ctx.clearRect(0, 0, confCanvas.width, confCanvas.height);
  for (let i = confetti.length - 1; i >= 0; i--) {
    const p = confetti[i];
    p.vy += 600 * dt; p.vx *= 1 - dt * 1.8; p.vy = Math.min(p.vy, 160 + p.w * 6);
    p.x += p.vx * dt + Math.sin(p.r) * 20 * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= dt;
    if (p.y > confCanvas.height + 30 || p.life <= 0) { confetti.splice(i, 1); continue; }
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.abs(Math.cos(p.r * 1.3)) + 0.15);
    ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
  }
}

// =====================================================================
// VIE AMBIANTE : oiseaux posés qui s'envolent quand on approche, papillons
// au-dessus de l'herbe (jour), lucioles (nuit), poissons qui sautent avec
// leur plouf, anneaux à la surface de l'eau (plongeons, sillage de nage).
// =====================================================================
const AMB = { t: 0, fishT: 4 };

// ---- anneaux à la surface de l'eau ----
const ripples = [];
{
  const rg = new THREE.RingGeometry(0.38, 0.6, 26); rg.rotateX(-Math.PI / 2); // anneau épais, lisible de loin
  for (let i = 0; i < 20; i++) {
    const m = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xf4fbff, transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false; m.renderOrder = 2; scene.add(m);
    ripples.push({ m, life: 0, max: 0.8, s: 1 });
  }
}
function ripple(x, z, scale = 1) {
  const r = ripples.find((q) => q.life <= 0) || ripples[0];
  r.life = r.max = 0.7 + 0.25 * scale; r.s = scale;
  r.m.position.set(x, 0.03, z); r.m.visible = true;
}
function updateRipples(dt) {
  for (const r of ripples) {
    if (r.life <= 0) continue;
    r.life -= dt;
    if (r.life <= 0) { r.m.visible = false; continue; }
    const k = 1 - r.life / r.max;
    r.m.scale.setScalar((0.6 + k * 3.6) * r.s);
    r.m.material.opacity = (1 - k) * 0.65;
  }
}
// éclaboussure : gerbe blanche + anneau à la surface
function splashFX(x, z, k = 1) {
  burst(_v1.set(x, 0.15, z), 0xeaf8ff, 14 + Math.round(16 * k), 3.4 + 3.8 * k, 0.18, 0.95, 0.7);
  burst(_v1.set(x, 0.1, z), 0xffffff, 6 + Math.round(6 * k), 5 + 4 * k, 0.1, 1, 0.5); // gouttelettes hautes
  ripple(x, z, 0.9 + k);
}

// ---- impact de pioche : onde de choc + éclat + étincelles ----
// L'effet claque au moment du contact : anneau additif qui s'étend sur la
// surface frappée, flash court et gerbe d'étincelles chaudes.
const pickShocks = [];
{
  const sg = new THREE.RingGeometry(0.3, 0.52, 22);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: 0xfff3d6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.visible = false; m.renderOrder = 3; scene.add(m);
    pickShocks.push({ m, life: 0, max: 0.3 });
  }
}
const pickFlashes = [];
{
  const fg = new THREE.OctahedronGeometry(0.3, 0);
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.visible = false; m.renderOrder = 3; scene.add(m);
    pickFlashes.push({ m, life: 0, max: 0.16 });
  }
}
function pickImpactFX(point, dir, type) {
  // orientation de l'onde de choc : couchée sur la surface frappée.
  // Terrain : normale de la pente locale (l'anneau suit le sol). Autres
  // surfaces (murs, arbres, rochers, persos) : face au joueur.
  const n = _v2.copy(dir).multiplyScalar(-1);
  if (type === 'terrain') {
    const e = 0.4;
    const hL = terrainH(point.x - e, point.z), hR = terrainH(point.x + e, point.z);
    const hD = terrainH(point.x, point.z - e), hU = terrainH(point.x, point.z + e);
    n.set(-(hR - hL) / (2 * e), 1, -(hU - hD) / (2 * e)).normalize();
  }
  // onde de choc : anneau posé sur la surface, légèrement décollé
  const s = pickShocks.find((q) => q.life <= 0) || pickShocks[0];
  s.life = s.max = 0.3;
  s.m.position.copy(point).addScaledVector(n, 0.05);
  s.m.lookAt(_v1.copy(point).add(n));
  s.m.visible = true;
  // éclat d'impact : flash court qui gonfle puis s'éteint
  const f = pickFlashes.find((q) => q.life <= 0) || pickFlashes[0];
  f.life = f.max = 0.16;
  f.m.position.copy(point).addScaledVector(n, 0.06);
  f.m.rotation.set(MR() * 3, MR() * 3, 0);
  f.m.visible = true;
  // étincelles chaudes projetées hors de la surface
  burst(point, 0xffe2a8, 8, 6, 0.1, 1, 0.4);
  burst(point, 0xfff6d8, 5, 8, 0.08, 1, 0.3);
}
function updatePickFX(dt) {
  for (const s of pickShocks) {
    if (s.life <= 0) continue;
    s.life -= dt;
    if (s.life <= 0) { s.m.visible = false; continue; }
    const k = 1 - s.life / s.max;
    s.m.scale.setScalar(0.5 + k * 2.6);
    s.m.material.opacity = (1 - k) * 0.9;
  }
  for (const f of pickFlashes) {
    if (f.life <= 0) continue;
    f.life -= dt;
    if (f.life <= 0) { f.m.visible = false; continue; }
    const k = 1 - f.life / f.max;
    f.m.scale.setScalar(0.6 + k * 1.2);
    f.m.material.opacity = (1 - k) * 0.95;
  }
}

// ---- traînée de frappe : arc lumineux qui suit la tête de la pioche ----
// Ruban en éventail (étroit à la queue, large à la tête), additif comme
// l'anneau d'impact : il reste lisible même à distance. Chaque personnage
// qui frappe un coup de pioche réutilise un slot du pool.
const PICK_TRAIL_MAX = 16;
const pickTrailPool = [];
function makePickTrail() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PICK_TRAIL_MAX * 2 * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(PICK_TRAIL_MAX * 2 * 3), 3));
  const idx = [];
  for (let i = 0; i < PICK_TRAIL_MAX - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.visible = false; m.renderOrder = 3; m.frustumCulled = false;
  scene.add(m);
  const tr = { m, g, ch: null, samples: [], fade: 0 };
  pickTrailPool.push(tr);
  return tr;
}
const _pt = new THREE.Vector3(), _ptD = new THREE.Vector3(), _ptC = new THREE.Vector3(), _ptS = new THREE.Vector3();
function updatePickTrail(ch, dt) {
  const it = ch.item;
  const on = ch.alive && ch.mode === 'ground' && ch.swing > 0.02 && it && it.kind === 'weapon' && it.id === 'pickaxe' && ch.held;
  let tr = ch._pickTrail;
  if (on && (!tr || tr.ch !== ch)) {
    tr = ch._pickTrail = pickTrailPool.find((q) => q.ch === null) || makePickTrail();
    tr.ch = ch; tr.samples.length = 0; tr.fade = 1;
  }
  if (!tr || tr.ch !== ch) return;
  if (on) {
    if (tr.fade < 1) tr.samples.length = 0; // nouveau coup : on repart de zéro
    tr.fade = 1;
    // position monde de la tête de la pioche (elle pivote avec le manche) ;
    // on rafraîchit la chaîne de matrices pour échantillonner la pose
    // exacte du coup en cours, même quand le rendu n'a pas encore tourné
    ch.held.updateWorldMatrix(true, false);
    _pt.set(0, 0, -0.68); ch.held.localToWorld(_pt);
    const last = tr.samples[tr.samples.length - 1];
    if (!last || _pt.distanceToSquared(last.p) > 0.0004) {
      tr.samples.push({ p: _pt.clone(), age: 0 });
      if (tr.samples.length > PICK_TRAIL_MAX) tr.samples.shift();
    }
  } else {
    tr.fade -= dt * 7; // le coup est fini : la traînée s'éteint vite
  }
  const n = tr.samples.length;
  if (n < 2 || tr.fade <= 0) {
    tr.m.visible = false;
    if (tr.fade <= 0) tr.ch = null;
    return;
  }
  // enveloppe d'intensité : discrète à l'armé, pleine pendant la frappe,
  // elle retombe doucement au retour — l'arc "claque" au moment du contact
  let env = 1;
  if (ch.swing > 0) {
    const k = 1 - ch.swing;
    env = k < 0.12 ? 0.3 + (k / 0.12) * 0.7 : k < 0.6 ? 1 : Math.max(0.25, 1 - (k - 0.6) * 1.5);
  }
  const I = env * tr.fade;
  const pos = tr.g.attributes.position.array, col = tr.g.attributes.color.array;
  for (let i = 0; i < n; i++) {
    const s = tr.samples[i];
    s.age += dt;
    const k = i / (n - 1); // 0 = queue, 1 = tête
    _ptD.subVectors(tr.samples[Math.min(n - 1, i + 1)].p, tr.samples[Math.max(0, i - 1)].p);
    _ptC.subVectors(camera.position, s.p);
    _ptS.crossVectors(_ptD, _ptC);
    if (_ptS.lengthSq() < 1e-6) _ptS.set(0, 1, 0); else _ptS.normalize();
    // éventail : quasi rien à la queue, large à la tête (l'arc couvre le geste)
    const w = 0.05 + 0.5 * k * k;
    pos[i * 6] = s.p.x + _ptS.x * w; pos[i * 6 + 1] = s.p.y + _ptS.y * w; pos[i * 6 + 2] = s.p.z + _ptS.z * w;
    pos[i * 6 + 3] = s.p.x - _ptS.x * w; pos[i * 6 + 4] = s.p.y - _ptS.y * w; pos[i * 6 + 5] = s.p.z - _ptS.z * w;
    const a = Math.pow(k, 1.6) * I; // queue éteinte, tête brillante (additif)
    col[i * 6] = a; col[i * 6 + 1] = a * 0.93; col[i * 6 + 2] = a * 0.76;
    col[i * 6 + 3] = a; col[i * 6 + 4] = a * 0.93; col[i * 6 + 5] = a * 0.76;
  }
  tr.g.setDrawRange(0, (n - 1) * 6);
  tr.g.attributes.position.needsUpdate = true;
  tr.g.attributes.color.needsUpdate = true;
  tr.m.visible = true;
}

// ---- oiseaux : posés au sol, ils s'envolent quand un personnage approche,
// tournent en croissant puis vont se poser plus loin ----
const birdBodyG = new THREE.BoxGeometry(0.09, 0.08, 0.24);
const birdTailG = new THREE.BoxGeometry(0.05, 0.03, 0.12).translate(0, 0, 0.17);
const birdWingLG = new THREE.BoxGeometry(0.24, 0.016, 0.11).translate(-0.12, 0, 0.02);
const birdWingRG = new THREE.BoxGeometry(0.24, 0.016, 0.11).translate(0.12, 0, 0.02);
const BIRD_COLS = [0x4a4f5c, 0xe8e8ec, 0x8a6a4a, 0x5c6b4a];
const birds = [];
function birdPerchSpot(b, farFromPlayer) {
  const px = player ? player.pos.x : 0, pz = player ? player.pos.z : 0;
  for (let k = 0; k < 14; k++) {
    const a = MR() * 6.283, r = (farFromPlayer ? 70 : 25) + MR() * 110;
    const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
    if (Math.hypot(x, z) > WORLD_R - 40) continue;
    const h = terrainH(x, z);
    if (h < 0.8 || h > 32) continue;
    b.p.set(x, h + 0.12, z); return true;
  }
  return false;
}
function makeBird() {
  const grp = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: BIRD_COLS[Math.floor(MR() * BIRD_COLS.length)] });
  const wl = new THREE.Mesh(birdWingLG, mat), wr = new THREE.Mesh(birdWingRG, mat);
  grp.add(new THREE.Mesh(birdBodyG, mat), new THREE.Mesh(birdTailG, mat), wl, wr);
  scene.add(grp);
  const b = {
    grp, wl, wr, state: 'perch', landing: false, p: new THREE.Vector3(), v: new THREE.Vector3(),
    target: new THREE.Vector3(), t: MR() * 20, cruiseT: 0, flapV: 12,
    cx: 0, cz: 0, cr: 25, cw: 0.3, alt: 18,
  };
  if (!birdPerchSpot(b, false)) b.p.set(MR() * 100, 6, MR() * 100);
  birds.push(b); return b;
}
function updateBirds(dt) {
  while (birds.length < 12) makeBird();
  for (const b of birds) {
    b.t += dt;
    if (b.state === 'perch') {
      // un personnage à moins de 11 m : envol !
      for (const ch of chars) {
        if (!ch.alive || ch.mode === 'bus') continue;
        const dx = ch.pos.x - b.p.x, dz = ch.pos.z - b.p.z, d2 = dx * dx + dz * dz;
        if (d2 < 121) {
          const d = Math.max(0.6, Math.sqrt(d2));
          b.state = 'fly'; b.landing = false; b.cruiseT = 0; b.flapV = 16;
          b.v.set(-dx / d * 7, 6.5 + MR() * 3, -dz / d * 7);
          const px = player ? player.pos.x : 0, pz = player ? player.pos.z : 0;
          b.cx = px + (MR() - 0.5) * 130; b.cz = pz + (MR() - 0.5) * 130;
          b.cr = 18 + MR() * 26; b.cw = (MR() < 0.5 ? -1 : 1) * (0.22 + MR() * 0.28); b.alt = 14 + MR() * 13;
          break;
        }
      }
      if (b.state === 'perch') {
        b.grp.position.copy(b.p);
        b.grp.rotation.set(0, b.t * 0.1, 0); // tourne tranquillement la tête
        b.wl.rotation.z = -0.12; b.wr.rotation.z = 0.12; // ailes pliées
        continue;
      }
    }
    // en vol : croissant autour d'un centre, puis descente vers un nouveau perchoir
    b.cruiseT += dt;
    if (b.cruiseT > 21 && !b.landing) { b.landing = true; if (!birdPerchSpot(b, true)) b.cruiseT = 0, b.landing = false; else b.target.copy(b.p); }
    let tx, ty, tz;
    if (b.landing) { tx = b.target.x; ty = b.target.y + 0.12; tz = b.target.z; }
    else { const a = b.t * b.cw; tx = b.cx + Math.cos(a) * b.cr; ty = b.alt; tz = b.cz + Math.sin(a) * b.cr; }
    const dx = tx - b.p.x, dy = ty - b.p.y, dz = tz - b.p.z;
    const d = Math.hypot(dx, dy, dz) || 1, sp = b.landing ? 7.5 : 11.5;
    b.v.lerp(_v1.set(dx / d * sp, dy / d * sp, dz / d * sp), Math.min(1, dt * 2.4));
    if (b.landing && d < 2.6) {
      b.state = 'perch'; b.landing = false; b.flapV = 12;
      b.p.copy(b.target); b.grp.position.copy(b.p);
      continue;
    }
    b.p.addScaledVector(b.v, dt);
    if (!b.landing) b.p.y = Math.max(b.p.y, terrainH(b.p.x, b.p.z) + 2.5); // jamais sous le sol
    b.flapV = b.landing ? 7 : 13;
    b.grp.position.copy(b.p);
    b.grp.rotation.order = 'YXZ';
    const hs = Math.hypot(b.v.x, b.v.z);
    if (hs > 0.3) b.grp.rotation.y = Math.atan2(-b.v.x, -b.v.z);
    b.grp.rotation.x = Math.atan2(b.v.y, Math.max(hs, 0.3));
    const f = Math.sin(b.t * b.flapV) * 0.85;
    b.wl.rotation.z = -f; b.wr.rotation.z = f;
  }
}

// ---- papillons : volettent au-dessus de l'herbe, le jour seulement ----
const bflyBodyG = new THREE.BoxGeometry(0.018, 0.018, 0.07);
const bflyWingLG = new THREE.PlaneGeometry(0.085, 0.065).rotateX(-Math.PI / 2).translate(-0.048, 0, 0);
const bflyWingRG = new THREE.PlaneGeometry(0.085, 0.065).rotateX(-Math.PI / 2).translate(0.048, 0, 0);
const BFLY_COLS = [0xfff2b0, 0xffb84d, 0x7ec8ff, 0xff8ad4, 0xfff5f5];
const bflies = [];
function makeBfly() {
  const grp = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: BFLY_COLS[Math.floor(MR() * BFLY_COLS.length)], side: THREE.DoubleSide });
  const wl = new THREE.Mesh(bflyWingLG, mat), wr = new THREE.Mesh(bflyWingRG, mat);
  grp.add(new THREE.Mesh(bflyBodyG, mat), wl, wr);
  scene.add(grp);
  const b = { grp, wl, wr, hx: 0, hz: 0, ph: MR() * 9, sp: 0.6 + MR() * 0.6, t: MR() * 9 };
  bflies.push(b); return b;
}
function updateBflies(dt) {
  const show = !!player && nightF < 0.45 && player.mode !== 'bus';
  while (bflies.length < 12) makeBfly();
  for (const b of bflies) {
    b.t += dt;
    b.grp.visible = show;
    if (!show) continue;
    const px = player.pos.x, pz = player.pos.z;
    // « maison » près du joueur : les papillons suivent la zone de jeu
    const dx = b.hx - px, dz = b.hz - pz;
    if (dx * dx + dz * dz > 3600) { b.hx = px + (MR() - 0.5) * 55; b.hz = pz + (MR() - 0.5) * 55; b.ph = MR() * 9; }
    const x = b.hx + Math.sin(b.t * 0.55 + b.ph) * 5.5 + Math.sin(b.t * 1.3 + b.ph * 2) * 2;
    const z = b.hz + Math.cos(b.t * 0.48 + b.ph) * 5.5;
    const g = terrainH(x, z);
    if (g < -0.25) { b.hx = px + (MR() - 0.5) * 40; b.hz = pz + (MR() - 0.5) * 40; continue; } // au-dessus de l'eau : on déménage
    const y = Math.max(g, 0.2) + 0.55 + Math.sin(b.t * 1.7 + b.ph) * 0.35;
    const mvx = x - b.grp.position.x, mvz = z - b.grp.position.z;
    b.grp.position.set(x, y, z);
    if (Math.hypot(mvx, mvz) > 0.002) b.grp.rotation.y = Math.atan2(-mvx, -mvz);
    const f = Math.sin(b.t * 17 * b.sp) * 1.05;
    b.wl.rotation.z = -f; b.wr.rotation.z = f;
  }
}

// ---- lucioles : points lumineux qui dérivent au-dessus de l'herbe, la nuit ----
const FF_N = 42;
const ffPos = new Float32Array(FF_N * 3);
const ffHome = []; for (let i = 0; i < FF_N; i++) ffHome.push({ x: 0, z: 0, ph: MR() * 9, ph2: MR() * 9 });
const ffGeo = new THREE.BufferGeometry();
ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
const ffMat = new THREE.PointsMaterial({ color: 0xd6ff9e, size: 0.12, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const ffPts = new THREE.Points(ffGeo, ffMat); ffPts.frustumCulled = false; scene.add(ffPts);
function updateFireflies() {
  ffMat.opacity = nightF * 0.9;
  ffPts.visible = nightF > 0.06 && !!player;
  if (!ffPts.visible) return;
  const px = player.pos.x, pz = player.pos.z, t = AMB.t;
  for (let i = 0; i < FF_N; i++) {
    const h = ffHome[i];
    const dx = h.x - px, dz = h.z - pz;
    if (dx * dx + dz * dz > 2500) { h.x = px + (MR() - 0.5) * 65; h.z = pz + (MR() - 0.5) * 65; h.ph = MR() * 9; }
    const x = h.x + Math.sin(t * 0.7 + h.ph) * 4;
    const z = h.z + Math.cos(t * 0.6 + h.ph * 1.3) * 4;
    ffPos[i * 3] = x; ffPos[i * 3 + 2] = z;
    ffPos[i * 3 + 1] = Math.max(terrainH(x, z), 0.15) + 0.6 + Math.sin(t * 1.1 + h.ph2) * 0.7;
  }
  ffGeo.attributes.position.needsUpdate = true;
}

// ---- poissons : sautent en arc hors de l'eau avec un plouf à chaque bout ----
const fishGeo = mergeGeometries([
  new THREE.BoxGeometry(0.07, 0.16, 0.3),
  new THREE.BoxGeometry(0.045, 0.1, 0.14).translate(0, 0.02, 0.24), // queue
]);
const fishMat = new THREE.MeshStandardMaterial({ color: 0xa8ccd6, roughness: 0.3, metalness: 0.55 });
const fishes = [];
function spawnFish() {
  if (!player) return;
  for (let k = 0; k < 8; k++) {
    const a = MR() * 6.283, r = 13 + MR() * 38;
    const x = player.pos.x + Math.cos(a) * r, z = player.pos.z + Math.sin(a) * r;
    if (Math.hypot(x, z) > WORLD_R + 30 || inGrotto(x, z)) continue;
    if (terrainH(x, z) > -1.5) continue;
    const m = new THREE.Mesh(fishGeo, fishMat); scene.add(m);
    const dir = MR() * 6.283;
    fishes.push({ m, p: new THREE.Vector3(x, -1.15, z), v: new THREE.Vector3(Math.cos(dir) * 1.4, 6.2 + MR() * 2.4, Math.sin(dir) * 1.4), wet: true, t: 0 });
    return;
  }
}
function updateFishes(dt) {
  AMB.fishT -= dt;
  if (AMB.fishT <= 0) { AMB.fishT = 2.5 + MR() * 5; if (state === 'playing') spawnFish(); }
  for (let i = fishes.length - 1; i >= 0; i--) {
    const q = fishes[i];
    q.t += dt;
    q.v.y -= 21 * dt;
    q.p.addScaledVector(q.v, dt);
    q.m.position.copy(q.p);
    q.m.rotation.order = 'YXZ';
    const hs = Math.hypot(q.v.x, q.v.z);
    if (hs > 0.05) q.m.rotation.y = Math.atan2(-q.v.x, -q.v.z);
    q.m.rotation.x = Math.atan2(q.v.y, Math.max(hs, 0.05));
    if (q.wet && q.p.y > 0) { // sortie de l'eau : petit plouf
      q.wet = false; ripple(q.p.x, q.p.z, 0.5);
      burst(_v1.set(q.p.x, 0.1, q.p.z), 0xeaf8ff, 5, 2.2, 0.1, 0.9, 0.4);
    }
    if (!q.wet && q.p.y < -0.1 && q.v.y < 0) { // retombée : plouf final
      ripple(q.p.x, q.p.z, 0.7);
      burst(_v1.set(q.p.x, 0.1, q.p.z), 0xeaf8ff, 7, 2.6, 0.11, 0.9, 0.45);
      if (player && (player.pos.x - q.p.x) ** 2 + (player.pos.z - q.p.z) ** 2 < 2500) sfx('plip', 0.35);
      scene.remove(q.m); fishes.splice(i, 1); continue;
    }
    if (q.t > 4.5) { scene.remove(q.m); fishes.splice(i, 1); }
  }
}

function updateAmbient(dt) {
  AMB.t += dt;
  updateBirds(dt);
  updateBflies(dt);
  updateFireflies();
  updateFishes(dt);
}

// =====================================================================
// Day / night cycle
// =====================================================================
const TOD_KEYS = [
  // t, skyTop, skyMid, fog, sun colour, sun int, hemi int
  [0.0, 0x0a1030, 0x1c2a5a, 0x2a3866, 0x8fa8ff, 0.55, 0.55],
  [0.22, 0x2a3f8f, 0xff9a6a, 0xf0b090, 0xffb070, 1.4, 0.8],
  [0.32, 0x3d8ae8, 0xa6dcff, 0xbfe6ff, 0xffe8c4, 2.4, 1.15],
  [0.68, 0x3d8ae8, 0xa6dcff, 0xbfe6ff, 0xffe8c4, 2.4, 1.15],
  [0.78, 0x3a3f9f, 0xff7a4a, 0xffb080, 0xff9050, 1.5, 0.85],
  [0.88, 0x0a1030, 0x1c2a5a, 0x2a3866, 0x8fa8ff, 0.55, 0.55],
  [1.0, 0x0a1030, 0x1c2a5a, 0x2a3866, 0x8fa8ff, 0.55, 0.55],
];
let tod = pick([0.3, 0.42, 0.5, 0.62, 0.7, 0.74]); // starting time of day changes every match
const DAY_LEN = 900; // seconds for a full day
let nightF = 0; // facteur nuit (0 = plein jour, 1 = nuit noire) : lucioles, papillons, eau
const _ca = new THREE.Color(), _cb = new THREE.Color();
let todAcc = 1;
function lerpHex(a, b, t, out) { return out.set(a).lerp(_cb.set(b), t); }
function updateDayNight(dt) {
  tod = (tod + dt / DAY_LEN) % 1; todAcc += dt; if (todAcc < 0.25) return; todAcc = 0;
  let i = 0; while (i < TOD_KEYS.length - 2 && TOD_KEYS[i + 1][0] <= tod) i++;
  const A = TOD_KEYS[i], B = TOD_KEYS[i + 1], t = (tod - A[0]) / (B[0] - A[0]);
  if (skyMat) { lerpHex(A[1], B[1], t, skyMat.uniforms.top.value); lerpHex(A[2], B[2], t, skyMat.uniforms.mid.value); }
  lerpHex(A[3], B[3], t, FOG_COL); if (skyMat) skyMat.uniforms.bot.value.copy(FOG_COL);
  lerpHex(A[4], B[4], t, sunLight.color); sunLight.intensity = lerp(A[5], B[5], t); hemi.intensity = lerp(A[6], B[6], t);
  const night = clamp(1 - sunLight.intensity / 1.2, 0, 1);
  nightF = night;
  // l'eau reflète le ciel du moment (plein jour, crépuscule aurore/rouge ou nuit)
  if (skyMat) { WSKY.top.copy(skyMat.uniforms.top.value); WSKY.mid.copy(skyMat.uniforms.mid.value); WSKY.sun.copy(skyMat.uniforms.sunDir.value); }
  WSKY.night.value = night;
  if (stars) stars.material.opacity = night;
  // sun path (moon at night keeps light from above)
  const ang = (tod - 0.25) * Math.PI * 2, el = Math.sin(ang);
  const sx = Math.cos(ang) * 110, sy = Math.max(35, Math.abs(el) * 130), sz = 50;
  SUN_OFF.set(sx, sy, sz);
  if (skyMat) { skyMat.uniforms.sunDir.value.set(Math.cos(ang) * 800, Math.abs(el) * 800, el > 0 ? 350 : -350).normalize(); skyMat.uniforms.glow.value = el > 0 ? 1 : 0.2; }
  if (sunDisc) { sunDisc.position.set(Math.cos(ang) * 800, Math.max(-100, el * 800), 350); sunDisc.lookAt(0, 0, 0); sunDisc.material.color.set(el > 0 ? 0xfff6c8 : 0xdfe8ff); if (el <= 0) sunDisc.position.set(-Math.cos(ang) * 800, -el * 800, -350); }
  renderer.toneMappingExposure = 1.1 + night * 0.25;
  const lampOn = night > 0.4;
  for (const c of chests) if (!c.opened && lampOn && c.light.intensity) c.light.intensity *= 1.4;
}

// =====================================================================
// Main loop
// =====================================================================
const clock = new THREE.Clock();
let frameN = 0;
// Persos visibles de loin : maillage complet jusqu'à ~105 m (au lieu de 75)
const FULL_D = LOWQ ? 70 : HIGHQ ? 130 : 105, FULL_D2 = FULL_D * FULL_D, SHADOW_D2 = (HIGHQ ? 60 : 40) ** 2, LOD_D2 = 110 * 110, IMP_D2 = (650 * SET.viewDist) ** 2;
// Silhouettes lointaines : formes humanoïdes à la vraie taille du perso (~1,8 m :
// jambes, torse, bras, tête) dans un seul mesh instancié (un draw call).
// Visibles jusqu'à 650 m : même à la lunette du sniper (portée 600), on voit les persos.
const impGeo = mergeGeometries([
  new THREE.BoxGeometry(0.16, 0.85, 0.16).translate(-0.13, 0.425, 0),
  new THREE.BoxGeometry(0.16, 0.85, 0.16).translate(0.13, 0.425, 0),
  new THREE.BoxGeometry(0.52, 0.62, 0.3).translate(0, 1.16, 0),
  new THREE.BoxGeometry(0.14, 0.55, 0.14).translate(-0.35, 1.12, 0),
  new THREE.BoxGeometry(0.14, 0.55, 0.14).translate(0.35, 1.12, 0),
  new THREE.SphereGeometry(0.19, 6, 5).translate(0, 1.66, 0),
]);
const impIM = new THREE.InstancedMesh(impGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), 128);
impIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); impIM.frustumCulled = false; impIM.count = 0; scene.add(impIM);
const IMP_COLS = [0xff6a3d, 0x3fa9ff, 0xffd23f, 0x5fe35f, 0xc27bff, 0xff4d8a, 0x40e0d0, 0xffffff];
function updateImpostors() {
  let n = 0;
  for (const c of chars) {
    if (c.isPlayer || !c.alive || c.mode === 'bus' || c.mode === 'drive' || c.camD2 < FULL_D2 || c.camD2 > IMP_D2 || n >= 128) continue;
    dummy.position.copy(c.pos); dummy.rotation.set(c.mode === 'fall' ? -1.1 : 0, c.yaw, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); // silhouette humanoïde à taille réelle
    impIM.setMatrixAt(n, dummy.matrix);
    if (c.impC === undefined) c.impC = IMP_COLS[chars.indexOf(c) % IMP_COLS.length];
    impIM.setColorAt(n, _c.set(c.team === 0 ? 0x5fe3ff : c.impC));
    n++;
  }
  impIM.count = n; impIM.instanceMatrix.needsUpdate = true; if (impIM.instanceColor) impIM.instanceColor.needsUpdate = true;
}
let fpsAcc = 0, fpsN = 0;
function step(dt) {
  if (state === 'menu' || paused || touchBagOpen || window.StormLandscape?.blocked) return;
  gameT += dt;
  if (matchOver) {
    // Un top 1 est décidé : la zone et le monde entier sont figés, seul le perso bouge encore.
    // (les portes aussi sont gelées : plus rien ne bouge)
    updatePlayer(dt);
    updateMarker(dt);
    frameN++;
    for (const c of chars) if (c.isPlayer) updateChar(c, dt);
    return;
  }
  waterT.value += dt; windT.value += dt;
  updateBus(dt);
  updateStorm(dt);
  if (player.mode === 'bus' && bus.active) { player.pos.copy(bus.pos); }
  updatePlayer(dt);
  updateDoors(dt);
  frameN++;
  for (const c of chars) {
    const cp = camera.position, dx = c.pos.x - cp.x, dz = c.pos.z - cp.z;
    c.camD2 = dx * dx + dz * dz;
    // far bots: simplified, updated every 4th frame with accumulated time (staggered)
    if (!c.isPlayer && c.alive && c.mode === 'ground' && c.camD2 > LOD_D2 && !(c.target && c.target.isPlayer)) {
      c.lodAcc += dt;
      if ((frameN + c.lodPhase) % 4 !== 0) continue;
      const d = Math.min(c.lodAcc, 0.1); c.lodAcc = 0; updateChar(c, d); continue;
    }
    c.lodAcc = 0;
    updateChar(c, dt);
  }
  updateImpostors();
  if (frameN % 180 === 0 && loot.length > 150) { let j = 0; for (let i = 0; i < loot.length; i++) if (loot[i].alive) loot[j++] = loot[i]; loot.length = j; }
  updatePadsVents(dt);
  updateMarker(dt);
  updateDayNight(dt);
  updateAmbient(dt);
  updateRipples(dt);
  updatePickFX(dt);
  updateBuilds(dt);
  updateWorld(dt);
  // dérive des nuages au vent (retour en boucle de l'autre côté du ciel)
  for (const c of clouds) { c.position.x += c.userData.wind * dt; if (c.position.x > 1180) c.position.x = -1180; }
  updateParticles(dt);
  updateDrops(dt);
  updateLightPool();
  updateWeak(dt);
}
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  // ralenti du top 1 : 1,4 s sur l'horloge réelle, le monde tourne au ralenti
  let sdt = dt;
  if (top1Pending) {
    if (performance.now() >= top1Until) { top1Pending = false; startVictory(); }
    else sdt = dt * 0.22;
  }
  // sur téléphone, les contrôles tactiles disparaissent devant les menus + reset des commandes
  syncTouchUI();
  step(sdt);
  updateCamera(dt);
  updateUnderwaterFX();
  if (state !== 'menu') {
    updateGhost();
    updateHUD(dt);
    updateDmgNums(dt);
    updateMaps(dt);
    const lp = player.alive ? player.pos : camera.position;
    sunLight.position.copy(lp).add(SUN_OFF); sunLight.target.position.copy(lp);
  } else { sunLight.position.copy(SUN_OFF).multiplyScalar(1.5); sunLight.target.position.set(0, 0, 0); }
  syncLin(); outline.render(scene, camera);
  updateConfetti(dt);
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 0.5) { $('perf').textContent = Math.round(fpsN / fpsAcc) + ' fps'; fpsAcc = 0; fpsN = 0; }
}
requestAnimationFrame(frame);

// Testing hooks
// advanceTime : hook d'avance rapide POUR LES TESTS UNIQUEMENT. Les scripts QA
// (qa-c2s2, qa-anim) l'appellent des milliers de fois et ne lisent que l'état du
// jeu (positions, modes, DOM) — jamais les pixels. Le rendu complet de la scène
// coûtait plusieurs secondes par appel sur les runners CI en headless (1 seule
// frame = 1 à 6 s en logiciel) : un evaluate pouvait dépasser les 30 min du
// protocolTimeout et tuer le workflow. On simule donc sans rendre ; la boucle
// rAF normale continue de rendre la scène en temps réel de son côté.
window.advanceTime = (ms) => { const n = Math.ceil(ms / 16.67); for (let i = 0; i < n; i++) { step(1 / 60); updateCamera(1 / 60); } updateGhost(); updateHUD(0.2); updateMaps(0.2); syncLin(); scene.updateMatrixWorld(); };
window.render_game_to_text = () => JSON.stringify({
  state, t: Math.round(gameT), player: player && { pos: player.pos.toArray().map((v) => +v.toFixed(1)), mode: player.mode, hp: Math.round(player.hp), shield: player.shield, kills: player.kills, mats: player.mats, slots: player.slots.map((s) => s && (s.id + (s.mag !== undefined ? ':' + s.mag : ''))), cur: player.cur, buildMode },
  build: { piece: buildPiece, rotation: buildRot, editing: !!editing }, marker: { on: marker.on, pos: marker.pos.toArray() }, shoulder: shoulderSide, inventoryOpen: touchBagOpen,
  alive: chars.filter((c) => c.alive && !c.hench).length, storm: { phase: storm.phase, r: Math.round(storm.r), stage: storm.stage }, builds: builds.size,
});
window.__game = { structs, rebuildHouse, towers, outline,
  ambient: { get birds() { return birds; }, get bflies() { return bflies; }, get fishes() { return fishes; }, get fireflies() { return ffPts; }, get ripples() { return ripples; }, get nightF() { return nightF; }, splashFX, ripple, spawnFish, updateDayNight }, vehicles, enterVehicle, exitVehicle, startEdit, confirmEdit, applyEdit, builds, mates, setMarker, pads, vents, get editing() { return editing; }, botBox, leaderboard, get tod() { return tod; }, set tod(v) { tod = v; }, drops, spawnSupplyDrop, weak, stats, get xp() { return matchXP; }, chests, ammoBoxes, get gameT() { return gameT; }, get busActive() { return bus.active; },  damage: (...a) => damageChar(...a), damageStruct, info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geo: renderer.info.memory.geometries, targets: rayTargets.length }), stepOnly: (dt) => step(dt), castRay, terrainH: terrainH, camera, THREE, POIS, loot, bots, spawnLoot, randWeaponItem, pickupItem, interact, selectSlot, fire, terrainH, get player() { return player; }, chars, keys, mouse, setCam: (y, p) => { camYaw = y; camPitch = p; }, startGame, jumpFromBus: () => jumpFromBus(player), setBuildMode, placeBuild, computeTarget, storm, vaults, booths, SPY_STAFF, openVault, openChest, setDisguise: (on) => setDisguise(player, on), get bosses() { return chars.filter((c) => c.boss); }, get henchmen() { return chars.filter((c) => c.hench); }, doors, toggleDoor, win: () => startVictory(), get matchOver() { return matchOver; }, get grottoSkullBounds() { return grottoSkullBounds; }, get terrainMesh() { return terrainMeshRef; }, get grottoRockMesh() { return grottoRockMesh; }, inGrotto, get scene() { return scene; },
  PHASES, stormDamageFor, get playerTotal() { return PLAYER_TOTAL; }, propCols, binds: BIND, settings: SET, get busEnded() { return bus.ended; }, matGain, matFlights: () => matFlights.length, pickTrailPool };
// storm est aussi exposé directement : window.__game.storm

// Auto-start the match once everything is built
refreshLabels();
setTimeout(() => {
  startGame();
  const ld = document.getElementById('loading'); if (ld) { ld.classList.add('done'); setTimeout(() => ld.remove(), 600); }
  window.focus();
}, 250);
