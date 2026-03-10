/**
 * Game Statistics Tracking Module
 * Tracks combat stats, items used, and progression metrics.
 * All functions are pure — they return new stats objects.
 */

export function createGameStats() {
  return {
    enemiesDefeated: 0,
    enemyKills: {},
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    itemsUsed: 0,
    abilitiesUsed: 0,
    goldEarned: 0,
    xpEarned: 0,
    battlesWon: 0,
    battlesFled: 0,
    turnsPlayed: 0,
    shieldsBroken: 0,
    weaknessHits: 0,
    defeatedWhileBroken: 0,
  };
}

export function recordEnemyDefeated(stats, enemyName) {
  const kills = { ...stats.enemyKills };
  kills[enemyName] = (kills[enemyName] || 0) + 1;
  return {
    ...stats,
    enemiesDefeated: stats.enemiesDefeated + 1,
    enemyKills: kills,
  };
}

export function recordDamageDealt(stats, amount) {
  return {
    ...stats,
    totalDamageDealt: stats.totalDamageDealt + amount,
  };
}

export function recordDamageReceived(stats, amount) {
  return {
    ...stats,
    totalDamageReceived: stats.totalDamageReceived + amount,
  };
}

export function recordItemUsed(stats, itemName) {
  return {
    ...stats,
    itemsUsed: stats.itemsUsed + 1,
  };
}

export function recordAbilityUsed(stats, abilityId) {
  return {
    ...stats,
    abilitiesUsed: stats.abilitiesUsed + 1,
  };
}

export function recordGoldEarned(stats, amount) {
  return {
    ...stats,
    goldEarned: stats.goldEarned + amount,
  };
}

export function recordXPEarned(stats, amount) {
  return {
    ...stats,
    xpEarned: stats.xpEarned + amount,
  };
}

export function recordBattleWon(stats) {
  return {
    ...stats,
    battlesWon: stats.battlesWon + 1,
  };
}

export function recordBattleFled(stats) {
  return {
    ...stats,
    battlesFled: stats.battlesFled + 1,
  };
}

export function recordTurnPlayed(stats) {
  return {
    ...stats,
    turnsPlayed: stats.turnsPlayed + 1,
  };
}

export function recordShieldBroken(stats) {
  return {
    ...stats,
    shieldsBroken: stats.shieldsBroken + 1,
  };
}

export function recordWeaknessHit(stats) {
  return {
    ...stats,
    weaknessHits: stats.weaknessHits + 1,
  };
}

export function recordDefeatedWhileBroken(stats) {
  return {
    ...stats,
    defeatedWhileBroken: stats.defeatedWhileBroken + 1,
  };
}

export function getStatsSummary(stats) {
  const topEnemy = Object.entries(stats.enemyKills)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    enemiesDefeated: stats.enemiesDefeated,
    mostDefeated: topEnemy ? `${topEnemy[0]} (${topEnemy[1]})` : 'None',
    totalDamageDealt: stats.totalDamageDealt,
    totalDamageReceived: stats.totalDamageReceived,
    damageRatio: stats.totalDamageReceived > 0
      ? (stats.totalDamageDealt / stats.totalDamageReceived).toFixed(1)
      : stats.totalDamageDealt > 0 ? '∞' : '0.0',
    itemsUsed: stats.itemsUsed,
    abilitiesUsed: stats.abilitiesUsed,
    goldEarned: stats.goldEarned,
    xpEarned: stats.xpEarned,
    battlesWon: stats.battlesWon,
    battlesFled: stats.battlesFled,
    turnsPlayed: stats.turnsPlayed,
  };
}
