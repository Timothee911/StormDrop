import assert from 'node:assert/strict';
import { BOT_PROFILES, BOT_PROFILE_IDS, preferredDistance, combatIntent } from '../../js/bot-profiles.js';

assert.equal(BOT_PROFILE_IDS.length, 5);
const assault = BOT_PROFILES.assaut, sniper = BOT_PROFILES.sniper;
assert(preferredDistance(assault, 'ar') < preferredDistance(sniper, 'ar'));
assert.equal(preferredDistance(sniper, 'shotgun'), 6);
assert.equal(preferredDistance(sniper, 'pickaxe'), 2);
for (const p of Object.values(BOT_PROFILES)) {
  assert(combatIntent(p, 20, 24, 10, false).retreat, `${p.label}: retreat on low health`);
  assert(combatIntent(p, 10, 24, 200, true).retreat, `${p.label}: retreat while reloading close up`);
  assert.equal(combatIntent(p, 80, 24, 200, false).approach, 1);
}
assert(BOT_PROFILES.constructeur.build > assault.build);
assert(BOT_PROFILES.prudent.retreat > assault.retreat);
assert(BOT_PROFILES.flanqueur.flank > 0);
assert.equal(assault.flank, 0);
console.log('PASS: 5 tactical profiles, weapon ranges, retreat, building and flank decisions');
