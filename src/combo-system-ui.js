import { getComboMultiplier, getComboTier, getComboTierDisplay } from './combo-system.js';

export function renderComboDisplay(comboState) {
  if (!comboState || comboState.hitCount === 0 || !comboState.isActive) {
    return '';
  }

  const tier = getComboTier(comboState.hitCount);
  const display = getComboTierDisplay(tier);
  const multiplier = getComboMultiplier(comboState);

  return `
    <div class="combo-display combo-${tier}" style="border-color: ${display.color}; color: ${display.color};">
      <span class="combo-icon">${display.icon}</span>
      <span class="combo-count">${comboState.hitCount} HIT COMBO</span>
      <span class="combo-tier-label">${display.label}</span>
      <span class="combo-multiplier">×${multiplier.toFixed(1)}</span>
    </div>
  `;
}

export function renderComboHistory(comboState) {
  if (!comboState || (comboState.highestCombo || 0) === 0) {
    return '';
  }

  return `
    <div class="combo-history">
      Best combo: ${comboState.highestCombo} | Total combo damage: ${comboState.totalComboDamage}
    </div>
  `;
}
