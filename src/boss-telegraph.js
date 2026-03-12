/**
 * Boss Move Telegraphing System
 * Predicts and displays upcoming boss actions to help players prepare tactically
 */

import { getBossAbility } from './data/bosses.js';

/**
 * Types of telegraphed abilities
 */
export const TELEGRAPH_TYPES = {
  ATTACK: 'attack',
  SPECIAL: 'special',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  HEAL: 'heal',
  CHARGE: 'charge',
};

/**
 * Severity levels for warnings
 */
export const TELEGRAPH_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Classify an ability into a telegraph type
 * @param {Object} ability - The ability data
 * @returns {string} Telegraph type
 */
export function classifyAbilityType(ability) {
  if (!ability) return TELEGRAPH_TYPES.ATTACK;

  switch (ability.type) {
    case 'buff':
      return TELEGRAPH_TYPES.BUFF;
    case 'heal':
      return TELEGRAPH_TYPES.HEAL;
    case 'debuff':
      return TELEGRAPH_TYPES.DEBUFF;
    case 'drain':
      return TELEGRAPH_TYPES.SPECIAL;
    case 'physical':
    case 'magical':
      // High power moves are special attacks
      if (ability.power >= 40) {
        return TELEGRAPH_TYPES.SPECIAL;
      }
      return TELEGRAPH_TYPES.ATTACK;
    default:
      return TELEGRAPH_TYPES.ATTACK;
  }
}

/**
 * Determine severity of an ability based on damage potential
 * @param {Object} ability - The ability data
 * @param {Object} boss - The boss state
 * @param {Object} player - The player state
 * @returns {string} Severity level
 */
export function determineSeverity(ability, boss, player) {
  if (!ability || !boss || !player) {
    return TELEGRAPH_SEVERITY.LOW;
  }

  // Non-damaging abilities are low severity
  if (ability.type === 'buff' || ability.type === 'heal') {
    return TELEGRAPH_SEVERITY.LOW;
  }

  // Calculate estimated damage
  const power = ability.power || 0;
  const bossAtk = boss.atk || 10;
  const playerDef = player.def || 0;
  const playerMaxHp = player.maxHp || player.hp || 100;

  // Estimate damage using simplified formula
  const estimatedDamage = Math.max(1, Math.floor((power * bossAtk / 10) - playerDef / 2));
  const damagePercent = estimatedDamage / playerMaxHp;

  if (damagePercent >= 0.50) {
    return TELEGRAPH_SEVERITY.CRITICAL;
  } else if (damagePercent >= 0.30) {
    return TELEGRAPH_SEVERITY.HIGH;
  } else if (damagePercent >= 0.15) {
    return TELEGRAPH_SEVERITY.MEDIUM;
  }
  return TELEGRAPH_SEVERITY.LOW;
}

/**
 * Predict the most likely next move for a boss
 * @param {Object} boss - The boss state
 * @param {Object} player - The player state (optional, for better predictions)
 * @returns {Object} Prediction { ability, confidence, type, severity }
 */
export function predictNextMove(boss, player = null) {
  if (!boss || !boss.abilities || boss.abilities.length === 0) {
    return {
      ability: null,
      confidence: 0.5,
      type: TELEGRAPH_TYPES.ATTACK,
      severity: TELEGRAPH_SEVERITY.MEDIUM,
    };
  }

  // Get available abilities (with enough MP)
  const availableAbilities = boss.abilities
    .map(id => ({ id, ability: getBossAbility(id) }))
    .filter(({ ability }) => ability && ability.mpCost <= (boss.mp || 0));

  if (availableAbilities.length === 0) {
    return {
      ability: null,
      confidence: 0.8,
      type: TELEGRAPH_TYPES.ATTACK,
      severity: TELEGRAPH_SEVERITY.LOW,
    };
  }

  const behavior = boss.aiBehavior || 'basic';
  let predictedAbility = null;
  let confidence = 0.5;

  // AI behavior influences prediction
  if (behavior === 'aggressive') {
    // Aggressive bosses prefer damage
    const damageAbilities = availableAbilities.filter(({ ability }) =>
      ability.type === 'physical' || ability.type === 'magical'
    );
    if (damageAbilities.length > 0) {
      // Pick highest power
      predictedAbility = damageAbilities.reduce((best, current) =>
        (current.ability.power > best.ability.power) ? current : best
      );
      confidence = 0.7;
    }
  } else if (behavior === 'caster') {
    // Casters prefer magical
    const magicAbilities = availableAbilities.filter(({ ability }) =>
      ability.type === 'magical'
    );
    if (magicAbilities.length > 0) {
      predictedAbility = magicAbilities[Math.floor(Math.random() * magicAbilities.length)];
      confidence = 0.65;
    }
  }

  // Default: random from available
  if (!predictedAbility && availableAbilities.length > 0) {
    predictedAbility = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
    confidence = 1 / availableAbilities.length;
  }

  if (!predictedAbility) {
    return {
      ability: null,
      confidence: 0.5,
      type: TELEGRAPH_TYPES.ATTACK,
      severity: TELEGRAPH_SEVERITY.MEDIUM,
    };
  }

  const abilityType = classifyAbilityType(predictedAbility.ability);
  const severity = determineSeverity(predictedAbility.ability, boss, player || { hp: 100, maxHp: 100, def: 5 });

  return {
    ability: predictedAbility.ability,
    abilityId: predictedAbility.id,
    confidence,
    type: abilityType,
    severity,
  };
}

/**
 * Generate warning text for a predicted move
 * @param {Object} prediction - Prediction from predictNextMove
 * @param {Object} boss - The boss state
 * @returns {string} Warning text
 */
export function generateWarningText(prediction, boss) {
  if (!prediction || !prediction.ability) {
    return `${boss?.name || 'Boss'} is preparing an attack...`;
  }

  const ability = prediction.ability;
  const bossName = boss?.name || 'Boss';

  switch (prediction.severity) {
    case TELEGRAPH_SEVERITY.CRITICAL:
      return `DANGER! ${bossName} is charging ${ability.name}!`;
    case TELEGRAPH_SEVERITY.HIGH:
      return `Warning: ${bossName} prepares ${ability.name}!`;
    case TELEGRAPH_SEVERITY.MEDIUM:
      return `${bossName} readies ${ability.name}.`;
    default:
      return `${bossName} focuses...`;
  }
}

/**
 * Generate tactical hints based on predicted move
 * @param {Object} prediction - Prediction from predictNextMove
 * @returns {string} Tactical hint
 */
export function generateTacticalHint(prediction) {
  if (!prediction) {
    return 'Stay alert!';
  }

  const ability = prediction.ability;

  // Check for status effects
  if (ability?.effect) {
    const effectType = ability.effect.type;
    if (effectType === 'burn') return 'Consider using fire resistance!';
    if (effectType === 'poison') return 'Prepare antidotes!';
    if (effectType === 'stun') return 'Guard against stun effects!';
    if (effectType === 'sleep') return 'Stay awake - counter sleep!';
  }

  switch (prediction.type) {
    case TELEGRAPH_TYPES.BUFF:
      return 'Good time to attack while boss buffs!';
    case TELEGRAPH_TYPES.HEAL:
      return 'Deal damage to negate healing!';
    case TELEGRAPH_TYPES.SPECIAL:
      return prediction.severity === TELEGRAPH_SEVERITY.CRITICAL
        ? 'Defend now or use damage reduction!'
        : 'Prepare to defend!';
    case TELEGRAPH_TYPES.DEBUFF:
      return 'Use status protection if available!';
    default:
      return prediction.severity === TELEGRAPH_SEVERITY.HIGH
        ? 'Guard or use a defensive item!'
        : 'Attack while maintaining HP!';
  }
}

/**
 * Get a complete telegraph summary for display
 * @param {Object} boss - The boss state
 * @param {Object} player - The player state
 * @returns {Object} Telegraph summary
 */
export function getTelegraphSummary(boss, player) {
  const prediction = predictNextMove(boss, player);

  return {
    prediction,
    warningText: generateWarningText(prediction, boss),
    tacticalHint: generateTacticalHint(prediction),
    confidencePercent: Math.round(prediction.confidence * 100),
    severityClass: `telegraph-${prediction.severity}`,
    typeIcon: getTypeIcon(prediction.type),
  };
}

/**
 * Get icon for telegraph type
 * @param {string} type - Telegraph type
 * @returns {string} Icon character
 */
function getTypeIcon(type) {
  switch (type) {
    case TELEGRAPH_TYPES.ATTACK: return '\u2694'; // crossed swords
    case TELEGRAPH_TYPES.SPECIAL: return '\u26A0'; // warning sign
    case TELEGRAPH_TYPES.BUFF: return '\u2B06'; // up arrow
    case TELEGRAPH_TYPES.HEAL: return '\u2764'; // heart
    case TELEGRAPH_TYPES.DEBUFF: return '\u2B07'; // down arrow
    case TELEGRAPH_TYPES.CHARGE: return '\u26A1'; // lightning
    default: return '\u2753'; // question mark
  }
}
