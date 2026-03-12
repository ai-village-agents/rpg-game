export const COMBO_DECAY_TURNS = 2;
export const MAX_COMBO_MULTIPLIER = 2.5;
export const COMBO_THRESHOLDS = {
  WARMING_UP: 2,
  ON_FIRE: 5,
  UNSTOPPABLE: 10,
  LEGENDARY: 15,
};

export function createComboState() {
  return {
    hitCount: 0,
    lastHitTurn: 0,
    isActive: false,
    chainMultiplier: 1.0,
    highestCombo: 0,
    totalComboDamage: 0,
    comboStreak: 0,
  };
}

export function getComboMultiplier(comboState) {
  const hits = Math.max(0, comboState.hitCount || 0);
  const raw = 1.0 + hits * 0.1;
  return Math.min(raw, MAX_COMBO_MULTIPLIER);
}

export function getComboTier(hitCount) {
  if (hitCount >= COMBO_THRESHOLDS.LEGENDARY) return 'legendary';
  if (hitCount >= COMBO_THRESHOLDS.UNSTOPPABLE) return 'unstoppable';
  if (hitCount >= COMBO_THRESHOLDS.ON_FIRE) return 'on-fire';
  if (hitCount >= COMBO_THRESHOLDS.WARMING_UP) return 'warming-up';
  return 'none';
}

export function getComboTierDisplay(tier) {
  switch (tier) {
    case 'warming-up':
      return { label: 'Warming Up!', color: '#ffdd00', icon: '⚡' };
    case 'on-fire':
      return { label: 'On Fire!', color: '#ff8800', icon: '🔥' };
    case 'unstoppable':
      return { label: 'UNSTOPPABLE!', color: '#ff4400', icon: '💥' };
    case 'legendary':
      return { label: 'LEGENDARY!!!', color: '#ff00ff', icon: '✨' };
    default:
      return { label: '', color: '#888', icon: '' };
  }
}

export function registerHit(comboState, currentTurn, damageDealt) {
  const nextHitCount = (comboState.hitCount || 0) + 1;
  const nextMultiplier = Math.min(1.0 + nextHitCount * 0.1, MAX_COMBO_MULTIPLIER);
  const nextHighestCombo = Math.max(comboState.highestCombo || 0, nextHitCount);
  const nextTotalDamage = (comboState.totalComboDamage || 0) + (damageDealt || 0);

  return {
    ...comboState,
    hitCount: nextHitCount,
    lastHitTurn: currentTurn,
    isActive: true,
    chainMultiplier: nextMultiplier,
    highestCombo: nextHighestCombo,
    totalComboDamage: nextTotalDamage,
    comboStreak: nextHitCount,
  };
}

export function checkComboDecay(comboState, currentTurn) {
  if (!comboState.isActive || comboState.hitCount === 0) {
    return comboState;
  }
  const turnsSinceHit = currentTurn - comboState.lastHitTurn;
  if (turnsSinceHit > COMBO_DECAY_TURNS) {
    return resetCombo(comboState);
  }
  return comboState;
}

export function resetCombo(comboState) {
  return {
    ...comboState,
    hitCount: 0,
    lastHitTurn: 0,
    isActive: false,
    chainMultiplier: 1.0,
    comboStreak: 0,
  };
}

export function getChainBonus(comboState) {
  const hitCount = comboState.hitCount || 0;

  if (hitCount >= COMBO_THRESHOLDS.LEGENDARY) {
    return {
      bonusDamage: 40,
      healPercent: 0.05,
      mpRestore: 0,
      momentumBonus: 20,
    };
  }

  if (hitCount >= COMBO_THRESHOLDS.UNSTOPPABLE) {
    return {
      bonusDamage: 20,
      healPercent: 0,
      mpRestore: 0,
      momentumBonus: 15,
    };
  }

  if (hitCount >= COMBO_THRESHOLDS.ON_FIRE) {
    return {
      bonusDamage: 0,
      healPercent: 0,
      mpRestore: 0,
      momentumBonus: 10,
    };
  }

  return {
    bonusDamage: 0,
    healPercent: 0,
    mpRestore: 0,
    momentumBonus: 0,
  };
}

export function isComboBreaker(actionType) {
  return (
    actionType === 'DEFEND' ||
    actionType === 'USE_ITEM' ||
    actionType === 'FLEE' ||
    actionType === 'ENEMY_ATTACK'
  );
}
