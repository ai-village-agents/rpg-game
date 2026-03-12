import { selectEnemyAction } from './enemy-abilities.js';
import { getAbility } from './combat/abilities.js';
import { getBossAbility } from './data/bosses.js';

export const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  EXTREME: 'extreme',
};

export const ELEMENT_ICONS = {
  physical: '⚔️',
  fire: '🔥',
  ice: '❄️',
  lightning: '⚡',
  shadow: '🌙',
  nature: '🍃',
  holy: '✨',
  default: '💥',
};

export function getTelegraphIcon(action, abilityId) {
  if (action === 'defend') return '🛡️';
  if (action === 'attack') return '⚔️';
  if (action === 'ability') {
    const ability = getBossAbility(abilityId) ?? getAbility(abilityId);
    const element = ability?.element;
    return ELEMENT_ICONS[element] ?? '🔮';
  }
  return '🔮';
}

export function getTelegraphLabel(action, abilityId) {
  if (action === 'defend') return 'Preparing Defense';
  if (action === 'attack') return 'Basic Attack';
  if (action === 'ability') {
    const ability = getBossAbility(abilityId) ?? getAbility(abilityId);
    return ability?.name ?? 'Unknown Ability';
  }
  return 'Unknown Ability';
}

export function getTelegraphUrgency(action, abilityId, enemy) {
  if (action === 'defend') return URGENCY_LEVELS.LOW;
  if (action === 'attack') {
    const atk = enemy?.atk ?? 0;
    if (atk >= 30) return URGENCY_LEVELS.HIGH;
    if (atk >= 20) return URGENCY_LEVELS.MEDIUM;
    return URGENCY_LEVELS.LOW;
  }
  if (action === 'ability') {
    const bossAbility = getBossAbility(abilityId);
    if (bossAbility) {
      if (bossAbility.type === 'heal' || bossAbility.type === 'buff') {
        return URGENCY_LEVELS.LOW;
      }
      const power = bossAbility.power ?? 0;
      if (power >= 40) return URGENCY_LEVELS.EXTREME;
      if (power >= 25) return URGENCY_LEVELS.HIGH;
      if (power >= 15) return URGENCY_LEVELS.MEDIUM;
      return URGENCY_LEVELS.LOW;
    }

    const ability = getAbility(abilityId);
    if (ability) {
      const power = ability.power ?? 0;
      if (power >= 2.0) return URGENCY_LEVELS.EXTREME;
      if (power >= 1.5) return URGENCY_LEVELS.HIGH;
      if (power >= 1.0) return URGENCY_LEVELS.MEDIUM;
      return URGENCY_LEVELS.LOW;
    }

    return URGENCY_LEVELS.MEDIUM;
  }
  return URGENCY_LEVELS.MEDIUM;
}

export function getTelegraphDescription(action, abilityId, enemy) {
  if (action === 'defend') {
    return 'The enemy is bracing for impact. Consider using buffs or healing.';
  }
  if (action === 'attack') {
    const atk = enemy?.atk ?? 0;
    const minDamage = Math.floor(atk * 0.8);
    const maxDamage = Math.floor(atk * 1.2);
    return `Preparing a basic attack. ~${minDamage}-${maxDamage} physical damage.`;
  }
  if (action === 'ability') {
    const ability = getBossAbility(abilityId) ?? getAbility(abilityId);
    return ability?.description ?? 'Preparing an unknown ability...';
  }
  return 'Preparing an unknown ability...';
}

export function predictEnemyTelegraph(enemy, rngSeed) {
  if (!enemy) return null;
  const { action, abilityId } = selectEnemyAction(enemy, null, rngSeed);
  return {
    action,
    abilityId,
    icon: getTelegraphIcon(action, abilityId),
    label: getTelegraphLabel(action, abilityId),
    description: getTelegraphDescription(action, abilityId, enemy),
    urgency: getTelegraphUrgency(action, abilityId, enemy),
  };
}

export function getBossPhaseWarning(boss) {
  if (!boss?.isBoss || !Array.isArray(boss.phases)) return null;

  const hpValue = boss.hp ?? boss.currentHp ?? 0;
  const maxHp = boss.maxHp ?? 1;
  const hpPercent = maxHp > 0 ? hpValue / maxHp : 0;
  const currentPhase = boss.currentPhase ?? 1;

  const nextPhases = boss.phases
    .filter((phase) => phase.hpThreshold < hpPercent && phase.phase > currentPhase)
    .sort((a, b) => a.phase - b.phase);

  const nextPhase = nextPhases[0];
  if (!nextPhase) return null;

  if (hpPercent > nextPhase.hpThreshold && hpPercent <= nextPhase.hpThreshold + 0.15) {
    const thresholdPercent = Math.round(nextPhase.hpThreshold * 100);
    return {
      isWarning: true,
      nextPhaseName: nextPhase.name,
      threshold: nextPhase.hpThreshold,
      hpPercent,
      message: `Phase transition at ${thresholdPercent}% HP! Incoming: ${nextPhase.name}`,
    };
  }

  return null;
}
