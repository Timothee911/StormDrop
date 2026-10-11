// Shared settings (lobby + match), persisted in localStorage when available
export const ACTIONS = [
  ['forward', 'Avancer', 'KeyW'], ['back', 'Reculer', 'KeyS'], ['left', 'Gauche', 'KeyA'], ['right', 'Droite', 'KeyD'],
  ['jump', 'Sauter / planeur', 'Space'], ['sprint', 'Sprinter', 'ShiftLeft'], ['crouch', 'S\u2019accroupir', 'KeyF'],
  ['interact', 'Interagir / véhicule', 'KeyE'], ['reload', 'Recharger', 'KeyR'], ['buildToggle', 'Mode construction', 'KeyQ'],
  ['wall', 'Mur', 'KeyZ'], ['floor', 'Sol', 'KeyX'], ['ramp', 'Rampe', 'KeyC'], ['cone', 'Toit', 'KeyV'],
  ['edit', 'Éditer une pièce', 'KeyG'], ['matCycle', 'Changer de matériau', 'KeyT'], ['shoulder', 'Changer d\u2019épaule', 'KeyH'],
  ['emote', 'Emote', 'KeyB'], ['map', 'Grande carte', 'KeyM'], ['marker', 'Placer un marqueur', 'KeyN'],
];
export const DEFAULTS = { sens: 1, adsSens: 1, fov: 80, volume: 0.8, music: 0.5, quality: 'moyenne', viewDist: 1, outline: 1, outlineW: 1, binds: Object.fromEntries(ACTIONS.map((a) => [a[0], a[2]])) };
const KEY = 'stormdrop-settings-v2';
export function loadSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  return { ...DEFAULTS, ...s, binds: { ...DEFAULTS.binds, ...(s.binds || {}) } };
}
export function saveSettings(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
export function keyLabel(code) {
  if (!code) return '—';
  const fr = navigator.language && navigator.language.startsWith('fr');
  const AZ = { KeyW: 'Z', KeyA: 'Q', KeyQ: 'A', KeyZ: 'W', KeyM: ',' };
  if (fr && AZ[code]) return AZ[code];
  const N = { Space: 'Espace', ShiftLeft: 'Maj', ShiftRight: 'Maj D', ControlLeft: 'Ctrl', AltLeft: 'Alt', Tab: 'Tab', CapsLock: 'Verr.Maj', Backquote: '²', Mouse3: 'Molette', Mouse4: 'Souris 4', Mouse5: 'Souris 5' };
  return N[code] || code.replace('Key', '').replace('Digit', '').replace('Numpad', 'Pav ');
}
// Builds the settings form (used in lobby modal and in-game pause menu)
export function settingsForm(root, s, onChange) {
  const q = ['basse', 'moyenne', 'haute'];
  root.innerHTML = `
  <div class="st-tabs"><button data-t="gen" class="on">GÉNÉRAL</button><button data-t="keys">TOUCHES</button></div>
  <div class="st-page" data-p="gen">
    <label>Sensibilité de la souris <b data-v="sens"></b><input data-k="sens" type="range" min="0.2" max="3" step="0.05"></label>
    <label>Sensibilité en visée <b data-v="adsSens"></b><input data-k="adsSens" type="range" min="0.2" max="2" step="0.05"></label>
    <label>Champ de vision (FOV) <b data-v="fov"></b><input data-k="fov" type="range" min="60" max="110" step="1"></label>
    <label>Volume général <b data-v="volume"></b><input data-k="volume" type="range" min="0" max="1" step="0.05"></label>
    <label>Musique <b data-v="music"></b><input data-k="music" type="range" min="0" max="1" step="0.05"></label>
    <label>Qualité graphique <select data-k="quality">${q.map((x) => `<option value="${x}">${x[0].toUpperCase() + x.slice(1)}</option>`).join('')}</select></label>
    <label>Contours cartoon <select data-k="outline"><option value="1">Activés</option><option value="0">Désactivés</option></select></label>
    <label>Épaisseur des contours <b data-v="outlineW"></b><input data-k="outlineW" type="range" min="0.5" max="2.5" step="0.1"></label>
    <label>Distance d’affichage <b data-v="viewDist"></b><input data-k="viewDist" type="range" min="0.5" max="1.5" step="0.05"></label>
  </div>
  <div class="st-page hidden" data-p="keys"><div class="st-keys"></div><button class="ghost-btn st-reset" type="button">TOUCHES PAR DÉFAUT</button></div>`;
  const fmt = (k, v) => k === 'fov' ? Math.round(v) + '°' : k === 'volume' || k === 'music' ? Math.round(v * 100) + '%' : k === 'viewDist' ? Math.round(v * 100) + '%' : k === 'outlineW' ? (+v).toFixed(1) + ' px' : (+v).toFixed(2);
  root.querySelectorAll('[data-k]').forEach((el) => {
    const k = el.dataset.k; el.value = s[k];
    const lab = root.querySelector(`[data-v="${k}"]`); if (lab) lab.textContent = fmt(k, s[k]);
    el.oninput = el.onchange = () => { s[k] = el.tagName === 'SELECT' ? (k === 'outline' ? +el.value : el.value) : +el.value; if (lab) lab.textContent = fmt(k, s[k]); saveSettings(s); onChange && onChange(s, k); };
  });
  root.querySelectorAll('.st-tabs button').forEach((b) => b.onclick = () => {
    root.querySelectorAll('.st-tabs button').forEach((x) => x.classList.toggle('on', x === b));
    root.querySelectorAll('.st-page').forEach((p) => p.classList.toggle('hidden', p.dataset.p !== b.dataset.t));
  });
  const keysEl = root.querySelector('.st-keys');
  let waiting = null;
  const draw = () => {
    keysEl.innerHTML = ACTIONS.map(([id, name]) => `<div class="st-key"><span>${name}</span><button type="button" data-a="${id}" class="${waiting === id ? 'wait' : ''}">${waiting === id ? 'Appuie sur une touche…' : keyLabel(s.binds[id])}</button></div>`).join('');
    keysEl.querySelectorAll('button').forEach((b) => b.onclick = (e) => { e.stopPropagation(); waiting = b.dataset.a; draw(); });
  };
  draw();
  const onKey = (e) => {
    if (!waiting || !root.isConnected) return;
    e.preventDefault(); e.stopPropagation();
    if (e.code !== 'Escape') {
      for (const a in s.binds) if (s.binds[a] === e.code) s.binds[a] = s.binds[waiting];
      s.binds[waiting] = e.code; saveSettings(s); onChange && onChange(s, 'binds');
    }
    waiting = null; draw();
  };
  window.addEventListener('keydown', onKey, true);
  root.querySelector('.st-reset').onclick = () => { s.binds = { ...DEFAULTS.binds }; saveSettings(s); onChange && onChange(s, 'binds'); draw(); };
}
