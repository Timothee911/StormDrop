// Deterministic mechanical sequence, shared by rendering and regression tests.
export const VAULT_DURATION = 4.6;
const clamp = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
export function vaultPose(seconds) {
  const t = Math.max(0, seconds);
  return {
    phase: t < 0.8 ? 'scanning' : t < 1.6 ? 'unlocking' : t < VAULT_DURATION ? 'opening' : 'open',
    wheel: smooth((t - 0.8) / 0.8) * Math.PI * 1.5,
    bolts: smooth((t - 1) / 0.6),
    angle: t <= 1.6 ? 0 : smooth((t - 1.6) / 3) * Math.PI * 0.61,
    open: t >= VAULT_DURATION,
  };
}
