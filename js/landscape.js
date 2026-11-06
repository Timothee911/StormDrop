// Shared mobile orientation policy for the lobby AND the standalone game.
// Native orientation locking is best-effort: never fake rotation with CSS,
// which would desynchronise the canvas, safe areas and touch coordinates.
(() => {
  'use strict';
  const coarse = matchMedia('(pointer: coarse)');
  const mobile = () => coarse.matches || (navigator.maxTouchPoints > 0 && !matchMedia('(pointer: fine)').matches);
  let blocked = false, lastFocus = null, busy = false;
  const gate = document.createElement('section');
  gate.id = 'landscapeGate'; gate.hidden = true;
  gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true');
  gate.setAttribute('aria-labelledby', 'landscapeTitle');
  gate.innerHTML = `<div class="orientation-card">
    <div class="orientation-brand">STORM<span>DROP</span></div>
    <svg class="orientation-phone" viewBox="0 0 112 96" fill="none" aria-hidden="true">
      <rect x="22" y="30" width="70" height="42" rx="7" stroke="currentColor" stroke-width="3"/>
      <path d="M82 43v16M17 46C17 23 36 9 57 12m-8-8 9 8-10 8M97 56c0 23-19 37-40 34m8 8-9-8 10-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <h1 id="landscapeTitle">TOURNE TON TÉLÉPHONE</h1>
    <p>Le lobby et les parties se jouent en mode paysage.</p>
    <button type="button" id="landscapeActivate" data-landscape-request>ACTIVER LE PAYSAGE</button>
    <p id="landscapeStatus" role="status" aria-live="polite">Tiens ton appareil à l’horizontale pour continuer.</p>
  </div>`;
  document.body.appendChild(gate);
  const activate = gate.querySelector('button'), status = gate.querySelector('[role=status]');
  function sync() {
    const next = mobile() && innerHeight > innerWidth;
    document.documentElement.classList.toggle('landscape-required', next);
    gate.hidden = !next;
    if (next !== blocked) {
      blocked = next;
      if (next) {
        lastFocus = document.activeElement;
        activate.focus({ preventScroll: true });
      } else if (lastFocus?.isConnected) {
        lastFocus.focus({ preventScroll: true });
      }
      window.dispatchEvent(new CustomEvent('stormorientationchange', { detail: { blocked } }));
    }
    document.querySelectorAll('[data-landscape-request]:not(#landscapeActivate)').forEach(el => { el.hidden = !mobile(); });
  }
  async function enter() {
    if (!mobile() || busy) return;
    busy = true; activate.disabled = true;
    try {
      try {
        const request = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
        if (!document.fullscreenElement && !document.webkitFullscreenElement && request) {
          await request.call(document.documentElement);
        }
      } catch (_) { /* Embed policy or browser may refuse fullscreen. */ }
      try { if (screen.orientation?.lock) await screen.orientation.lock('landscape'); } catch (_) {}
      sync();
      status.textContent = blocked
        ? 'Tourne ton téléphone à l’horizontale. Si nécessaire, désactive le verrouillage de rotation de ton appareil.'
        : 'Mode paysage prêt.';
    } finally { busy = false; activate.disabled = false; }
  }
  const tools = document.querySelector('.tb-right');
  if (tools) {
    const button = document.createElement('button');
    button.id = 'landscapeToggle'; button.type = 'button'; button.dataset.landscapeRequest = '';
    button.className = 'orientation-fullscreen'; button.setAttribute('aria-label', 'Plein écran paysage'); button.title = 'Plein écran paysage';
    button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
    tools.insertBefore(button, document.getElementById('settingsBtn'));
  }
  const pauseSettings = document.getElementById('pauseSettings');
  if (pauseSettings) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'btn-ghost'; button.dataset.landscapeRequest = '';
    button.textContent = 'PLEIN ÉCRAN PAYSAGE'; pauseSettings.before(button);
  }
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-landscape-request]')) return;
    e.preventDefault(); void enter();
  });
  // Keep keyboard focus in the rotation screen while the game is covered.
  document.addEventListener('keydown', e => {
    if (blocked && e.key === 'Tab') { e.preventDefault(); activate.focus(); }
  }, true);
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', sync);
  document.addEventListener('fullscreenchange', sync);
  coarse.addEventListener?.('change', sync);
  window.StormLandscape = { get blocked() { return blocked; }, enter, sync };
  sync();
})();
