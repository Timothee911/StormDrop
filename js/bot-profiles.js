// Tactical personalities change decisions, not damage or unfair aim bonuses.
export const BOT_PROFILES = Object.freeze({
  assaut: { label: 'Assaut', range: 0.65, strafe: 0.95, speed: 1.06, retreat: 30, build: 0.12, jump: 0.7, flank: 0, burst: 1.3, weapon: 'smg' },
  sniper: { label: 'Sniper', range: 1.85, strafe: 0.25, speed: 0.9, retreat: 60, build: 0.18, jump: 0.08, flank: 0, burst: 0.7, weapon: 'sniper' },
  constructeur: { label: 'Constructeur', range: 1.05, strafe: 0.5, speed: 0.95, retreat: 50, build: 0.7, jump: 0.35, flank: 0, burst: 0.9, weapon: 'ar' },
  prudent: { label: 'Prudent', range: 1.4, strafe: 0.4, speed: 0.92, retreat: 90, build: 0.35, jump: 0.15, flank: 0, burst: 0.65, weapon: 'ar' },
  flanqueur: { label: 'Flanqueur', range: 0.95, strafe: 0.9, speed: 1.02, retreat: 45, build: 0.15, jump: 0.35, flank: 1.2, burst: 1, weapon: 'smg' },
});
export const BOT_PROFILE_IDS = Object.keys(BOT_PROFILES);
export function profileOf(bot) { return BOT_PROFILES[bot.profile] || BOT_PROFILES.assaut; }
export function preferredDistance(profile, weaponId) {
  if (!weaponId || weaponId === 'pickaxe') return 2;
  // A sniper personality carrying a shotgun must still use shotgun range.
  const base = weaponId === 'shotgun' ? 6 : weaponId === 'sniper' ? 50 : weaponId === 'smg' ? 14 : 24;
  return weaponId === 'shotgun' ? base : Math.min(65, base * profile.range);
}
export function combatIntent(profile, distance, preferred, health, reloading) {
  const retreat = health < profile.retreat || (reloading && distance < preferred);
  return {
    retreat,
    approach: retreat ? -1 : distance > preferred + 4 ? 1 : distance < preferred - 3 ? -0.7 : 0,
    strafe: retreat ? profile.strafe * 0.5 : profile.strafe,
    flank: retreat ? 0 : profile.flank,
  };
}
