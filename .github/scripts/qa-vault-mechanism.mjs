import assert from 'node:assert/strict';
import { vaultPose, VAULT_DURATION } from '../../js/vault-mechanism.js';
assert.equal(vaultPose(0).phase, 'scanning');
assert.equal(vaultPose(0.9).phase, 'unlocking');
assert.equal(vaultPose(2).phase, 'opening');
assert.equal(vaultPose(4).open, false);
assert.equal(vaultPose(VAULT_DURATION + 0.01).phase, 'open');
assert.equal(vaultPose(100).bolts, 1);
assert.equal(vaultPose(-2).angle, 0);
let oldAngle = 0, oldBolts = 0;
for (let t = 0; t < 6; t += 0.025) {
  const p = vaultPose(t);
  assert(Number.isFinite(p.angle) && p.angle >= oldAngle - 1e-10);
  assert(p.bolts >= oldBolts - 1e-10 && p.bolts <= 1);
  oldAngle = p.angle; oldBolts = p.bolts;
}
console.log('PASS: scan, wheel/bolts, smooth hinged opening, monotonic limits and completion');
