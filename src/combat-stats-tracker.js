/**
 * Combat Stats Tracker — Records detailed statistics during each combat encounter.
 * Tracks damage dealt/received, abilities used, shields broken, turns taken,
 * healing done, and generates a detailed post-combat summary.
 */

/**
 * Create a fresh combat stats object for a new encounter.
 * @param {string} enemyName - Name of the enemy being fought
 * @param {boolean} isBoss - Whether this is a boss encounter
 * @returns {object} Initial combat stats state
 */
export function createCombatStats(enemyName, isBoss = false) {
  return {
    enemyName: enemyName || 'Unknown',
    isBoss: Boolean(isBoss),
    startTime: Date.now(),
    endTime: null,
    turnsTotal: 0,
    playerTurns: 0,
    enemyTurns: 0,

    // Damage tracking
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    maxSingleHit: 0,
    maxSingleHitAbility: '',
    totalHealingDone: 0,

    // Action counts
    attackCount: 0,
    defendCount: 0,
    abilityUses: {},      // { abilityName: count }
    itemUses: {},         // { itemName: count }
    potionCount: 0,
    weaknessHits: 0,
    fleeAttempts: 0,

    // Shield/break tracking
    shieldsDestroyed: 0,
    timesEnemyBroken: 0,
    breakDamageDealt: 0,

    // Companion tracking
    companionDamageDealt: 0,
    companionAbilityUses: 0,
    companionHealing: 0,

    // Status effects
    statusEffectsInflicted: [],
    statusEffectsReceived: [],

    // Outcome
    outcome: null, // 'victory', 'defeat', 'fled'
    finalPlayerHp: 0,
    finalPlayerMaxHp: 0,
  };
}

/**
 * Record a player attack action.
 * @param {object} stats - Combat stats object
 * @param {number} damage - Damage dealt
 * @returns {object} Updated stats
 */
export function recordPlayerAttack(stats, damage) {
  if (!stats) return stats;
  const dmg = Math.max(0, Number(damage) || 0);
  stats.attackCount++;
  stats.totalDamageDealt += dmg;
  if (dmg > stats.maxSingleHit) {
    stats.maxSingleHit = dmg;
    stats.maxSingleHitAbility = 'Basic Attack';
  }
  return stats;
}

/**
 * Record a player defend action.
 * @param {object} stats - Combat stats object
 * @returns {object} Updated stats
 */
export function recordPlayerDefend(stats) {
  if (!stats) return stats;
  stats.defendCount++;
  return stats;
}

/**
 * Record player ability use.
 * @param {object} stats - Combat stats object
 * @param {string} abilityName - Name of ability used
 * @param {number} damage - Damage dealt (0 if healing/buff)
 * @param {number} healing - Healing done (0 if damaging)
 * @returns {object} Updated stats
 */
export function recordAbilityUse(stats, abilityName, damage = 0, healing = 0) {
  if (!stats) return stats;
  const name = abilityName || 'Unknown Ability';
  const dmg = Math.max(0, Number(damage) || 0);
  const heal = Math.max(0, Number(healing) || 0);

  stats.abilityUses[name] = (stats.abilityUses[name] || 0) + 1;
  stats.totalDamageDealt += dmg;
  // Offensive abilities count as attacks for summary purposes
  if (dmg > 0) stats.attackCount++;
  stats.totalHealingDone += heal;

  if (dmg > stats.maxSingleHit) {
    stats.maxSingleHit = dmg;
    stats.maxSingleHitAbility = name;
  }
  return stats;
}

/**
 * Record item use in combat.
 * @param {object} stats - Combat stats object
 * @param {string} itemName - Name of item used
 * @param {number} healing - Healing value if applicable
 * @returns {object} Updated stats
 */
export function recordItemUse(stats, itemName, healing = 0) {
  if (!stats) return stats;
  const name = itemName || 'Unknown Item';
  const heal = Math.max(0, Number(healing) || 0);

  stats.itemUses[name] = (stats.itemUses[name] || 0) + 1;
  stats.totalHealingDone += heal;
  return stats;
}

/**
 * Record potion use.
 * @param {object} stats - Combat stats object
 * @param {number} healing - HP restored
 * @returns {object} Updated stats
 */
export function recordPotionUse(stats, healing = 0) {
  if (!stats) return stats;
  stats.potionCount++;
  stats.totalHealingDone += Math.max(0, Number(healing) || 0);
  return stats;
}

/**
 * Record damage received from enemy.
 * @param {object} stats - Combat stats object
 * @param {number} damage - Damage received
 * @returns {object} Updated stats
 */
export function recordDamageReceived(stats, damage) {
  if (!stats) return stats;
  stats.totalDamageReceived += Math.max(0, Number(damage) || 0);
  return stats;
}

/**
 * Record a shield being destroyed.
 * @param {object} stats - Combat stats object
 * @returns {object} Updated stats
 */
export function recordShieldDestroyed(stats) {
  if (!stats) return stats;
  stats.shieldsDestroyed++;
  return stats;
}

/**
 * Record enemy entering break state.
 * @param {object} stats - Combat stats object
 * @returns {object} Updated stats
 */
export function recordEnemyBroken(stats) {
  if (!stats) return stats;
  stats.timesEnemyBroken++;
  return stats;
}

/**
 * Record damage dealt during break state.
 * @param {object} stats - Combat stats object
 * @param {number} damage - Break-boosted damage dealt
 * @returns {object} Updated stats
 */
export function recordBreakDamage(stats, damage) {
  if (!stats) return stats;
  stats.breakDamageDealt += Math.max(0, Number(damage) || 0);
  return stats;
}

/**
 * Record a flee attempt.
 * @param {object} stats - Combat stats object
 * @returns {object} Updated stats
 */
export function recordFleeAttempt(stats) {
  if (!stats) return stats;
  stats.fleeAttempts++;
  return stats;
}

/**
 * Record an elemental weakness hit on the enemy.
 * @param {object} stats - Combat stats object
 * @returns {object} Updated stats
 */
export function recordWeaknessHit(stats) {
  if (!stats) return stats;
  stats.weaknessHits++;
  return stats;
}

/**
 * Record a companion action.
 * @param {object} stats - Combat stats object
 * @param {number} damage - Damage dealt by companion
 * @param {number} healing - Healing done by companion
 * @returns {object} Updated stats
 */
export function recordCompanionAction(stats, damage = 0, healing = 0) {
  if (!stats) return stats;
  stats.companionAbilityUses++;
  stats.companionDamageDealt += Math.max(0, Number(damage) || 0);
  stats.companionHealing += Math.max(0, Number(healing) || 0);
  return stats;
}

/**
 * Record a status effect being inflicted on enemy.
 * @param {object} stats - Combat stats object
 * @param {string} effectName - Name of the status effect
 * @returns {object} Updated stats
 */
export function recordStatusInflicted(stats, effectName) {
  if (!stats || !effectName) return stats;
  if (!stats.statusEffectsInflicted.includes(effectName)) {
    stats.statusEffectsInflicted.push(effectName);
  }
  return stats;
}

/**
 * Record a status effect received by player.
 * @param {object} stats - Combat stats object
 * @param {string} effectName - Name of the status effect
 * @returns {object} Updated stats
 */
export function recordStatusReceived(stats, effectName) {
  if (!stats || !effectName) return stats;
  if (!stats.statusEffectsReceived.includes(effectName)) {
    stats.statusEffectsReceived.push(effectName);
  }
  return stats;
}

/**
 * Increment turn counters.
 * @param {object} stats - Combat stats object
 * @param {string} turnType - 'player' or 'enemy'
 * @returns {object} Updated stats
 */
export function recordTurn(stats, turnType) {
  if (!stats) return stats;
  stats.turnsTotal++;
  if (turnType === 'player') {
    stats.playerTurns++;
  } else if (turnType === 'enemy') {
    stats.enemyTurns++;
  }
  return stats;
}

/**
 * Finalize combat stats when the encounter ends.
 * @param {object} stats - Combat stats object
 * @param {string} outcome - 'victory', 'defeat', or 'fled'
 * @param {number} playerHp - Player's final HP
 * @param {number} playerMaxHp - Player's max HP
 * @returns {object} Finalized stats
 */
export function finalizeCombatStats(stats, outcome, playerHp, playerMaxHp) {
  if (!stats) return stats;
  stats.endTime = Date.now();
  stats.outcome = outcome || 'unknown';
  stats.finalPlayerHp = Number(playerHp) || 0;
  stats.finalPlayerMaxHp = Number(playerMaxHp) || 0;
  return stats;
}

/**
 * Calculate derived statistics from raw combat data.
 * @param {object} stats - Finalized combat stats
 * @returns {object} Computed statistics
 */
export function computeDerivedStats(stats) {
  if (!stats) return {};

  const durationMs = (stats.endTime || Date.now()) - (stats.startTime || Date.now());
  const durationSec = Math.max(1, Math.round(durationMs / 1000));

  const totalActions = stats.attackCount + stats.defendCount +
    Object.values(stats.abilityUses).reduce((sum, n) => sum + n, 0) +
    Object.values(stats.itemUses).reduce((sum, n) => sum + n, 0) +
    stats.potionCount + stats.fleeAttempts;

  const avgDamagePerTurn = stats.playerTurns > 0
    ? Math.round(stats.totalDamageDealt / stats.playerTurns)
    : 0;

  const avgDamageReceivedPerTurn = stats.enemyTurns > 0
    ? Math.round(stats.totalDamageReceived / stats.enemyTurns)
    : 0;

  const netDamage = stats.totalDamageDealt - stats.totalDamageReceived;

  const hpRemainingPercent = stats.finalPlayerMaxHp > 0
    ? Math.round((stats.finalPlayerHp / stats.finalPlayerMaxHp) * 100)
    : 0;

  // Performance rating: S/A/B/C/D based on efficiency
  let rating = 'C';
  if (stats.outcome === 'victory') {
    const efficiencyScore =
      (hpRemainingPercent * 0.4) +
      (Math.min(100, (stats.totalDamageDealt / Math.max(1, stats.turnsTotal)) * 5) * 0.3) +
      (Math.max(0, 100 - stats.turnsTotal * 8) * 0.3);

    if (efficiencyScore >= 85) rating = 'S';
    else if (efficiencyScore >= 70) rating = 'A';
    else if (efficiencyScore >= 50) rating = 'B';
    else if (efficiencyScore >= 30) rating = 'C';
    else rating = 'D';
  } else if (stats.outcome === 'fled') {
    rating = 'D';
  } else {
    rating = '-';
  }

  return {
    durationSec,
    totalActions,
    avgDamagePerTurn,
    avgDamageReceivedPerTurn,
    netDamage,
    hpRemainingPercent,
    rating,
    mostUsedAbility: getMostUsed(stats.abilityUses),
    mostUsedItem: getMostUsed(stats.itemUses),
  };
}

/**
 * Get the most-used entry from a usage map.
 * @param {object} usageMap - { name: count } object
 * @returns {string|null} Most-used entry name, or null
 */
function getMostUsed(usageMap) {
  if (!usageMap || Object.keys(usageMap).length === 0) return null;
  let maxName = null;
  let maxCount = 0;
  for (const [name, count] of Object.entries(usageMap)) {
    if (count > maxCount) {
      maxCount = count;
      maxName = name;
    }
  }
  return maxName;
}

/**
 * Format combat stats for display as structured HTML-ready data.
 * @param {object} stats - Finalized combat stats
 * @returns {object} Display-ready formatted data
 */
export function formatCombatStatsDisplay(stats) {
  if (!stats) return { sections: [] };

  const derived = computeDerivedStats(stats);
  const sections = [];

  // Header
  sections.push({
    type: 'header',
    title: stats.isBoss ? 'Boss Battle Complete!' : 'Battle Complete!',
    subtitle: `vs ${stats.enemyName}`,
    rating: derived.rating,
    outcome: stats.outcome,
  });

  // Core Stats
  sections.push({
    type: 'stats',
    title: 'Combat Overview',
    rows: [
      { label: 'Turns', value: String(stats.turnsTotal) },
      { label: 'Duration', value: `${derived.durationSec}s` },
      { label: 'Damage Dealt', value: String(stats.totalDamageDealt), style: 'good' },
      { label: 'Damage Received', value: String(stats.totalDamageReceived), style: 'bad' },
      { label: 'Healing Done', value: String(stats.totalHealingDone), style: 'good' },
      { label: 'HP Remaining', value: `${stats.finalPlayerHp}/${stats.finalPlayerMaxHp} (${derived.hpRemainingPercent}%)` },
    ],
  });

  // Averages
  sections.push({
    type: 'stats',
    title: 'Performance',
    rows: [
      { label: 'Avg DMG/Turn', value: String(derived.avgDamagePerTurn) },
      { label: 'Avg Recv/Turn', value: String(derived.avgDamageReceivedPerTurn) },
      { label: 'Max Single Hit', value: stats.maxSingleHit > 0
          ? `${stats.maxSingleHit} (${stats.maxSingleHitAbility})`
          : 'N/A' },
      { label: 'Net Damage', value: String(derived.netDamage), style: derived.netDamage >= 0 ? 'good' : 'bad' },
    ],
  });

  // Actions breakdown
  const actionRows = [
    { label: 'Attacks', value: String(stats.attackCount) },
    { label: 'Defends', value: String(stats.defendCount) },
    { label: 'Potions Used', value: String(stats.potionCount) },
  ];

  if (derived.mostUsedAbility) {
    actionRows.push({ label: 'Most Used Ability', value: derived.mostUsedAbility });
  }
  if (derived.mostUsedItem) {
    actionRows.push({ label: 'Most Used Item', value: derived.mostUsedItem });
  }
  if (stats.weaknessHits > 0) {
    actionRows.push({ label: 'Weakness Hits', value: String(stats.weaknessHits), style: 'good' });
  }
  if (stats.fleeAttempts > 0) {
    actionRows.push({ label: 'Flee Attempts', value: String(stats.fleeAttempts) });
  }

  sections.push({
    type: 'stats',
    title: 'Actions',
    rows: actionRows,
  });

  // Shield/Break section (only if relevant)
  if (stats.shieldsDestroyed > 0 || stats.timesEnemyBroken > 0) {
    sections.push({
      type: 'stats',
      title: 'Shield Break',
      rows: [
        { label: 'Shields Destroyed', value: String(stats.shieldsDestroyed) },
        { label: 'Times Broken', value: String(stats.timesEnemyBroken) },
        { label: 'Break Damage', value: String(stats.breakDamageDealt), style: 'good' },
      ],
    });
  }

  // Companion section (only if companion was active)
  if (stats.companionAbilityUses > 0) {
    sections.push({
      type: 'stats',
      title: 'Companion',
      rows: [
        { label: 'Actions', value: String(stats.companionAbilityUses) },
        { label: 'Damage Dealt', value: String(stats.companionDamageDealt) },
        { label: 'Healing Done', value: String(stats.companionHealing) },
      ],
    });
  }

  // Status effects
  if (stats.statusEffectsInflicted.length > 0 || stats.statusEffectsReceived.length > 0) {
    const effectRows = [];
    if (stats.statusEffectsInflicted.length > 0) {
      effectRows.push({ label: 'Inflicted', value: stats.statusEffectsInflicted.join(', ') });
    }
    if (stats.statusEffectsReceived.length > 0) {
      effectRows.push({ label: 'Received', value: stats.statusEffectsReceived.join(', ') });
    }
    sections.push({
      type: 'stats',
      title: 'Status Effects',
      rows: effectRows,
    });
  }

  return { sections };
}
