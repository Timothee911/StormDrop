// Pointer lock helper (game) + iframe preparation (lobby)
export function init(canvas, onChange) {
  const api = {
    lock() {
      if (document.pointerLockElement === canvas) return;
      const fail = () => onChange(false, 'error');
      const plain = () => { try { const r2 = canvas.requestPointerLock(); if (r2 && r2.catch) r2.catch(fail); } catch (e) { fail(); } };
      try {
        const r = canvas.requestPointerLock({ unadjustedMovement: true });
        if (r && r.catch) r.catch(plain); // unadjustedMovement unsupported -> plain request
      } catch (e) { plain(); }
    },
    unlock() { try { document.exitPointerLock(); } catch (e) {} },
  };
  document.addEventListener('pointerlockchange', () => onChange(document.pointerLockElement === canvas, 'change'));
  // a refused request (browser cooldown right after Échap, or a sandboxed frame) is NOT a pause request
  document.addEventListener('pointerlockerror', () => onChange(false, 'error'));
  return api;
}
export function prepareFrame(fr) { fr.setAttribute('allow', 'pointer-lock; autoplay; fullscreen'); fr.setAttribute('allowfullscreen', ''); }
export function onPlay() {}
