/**
 * Boss Battle System
 * Handles boss fights with multiple phases, transitions, and special mechanics
 */

import { getBoss, getBossAbility, BOSSES } from './data/bosses.js';

/**
 * Create a boss encounter state from boss data
 * @param {string} bossId - The boss identifier
 * @returns {Object} Boss encounter state
 */
export function createBossEncounter(bossId) {
  const bossData = getBoss(bossId);
  if (!bossData) {
    return null;
  }
  
  const phase1 = bossData.phases[0];
  
  return {
    bossId: bossId,
    id: bossData.id,
    name: bossData.name,
    description: bossData.description,
    isBoss: true,
    element: bossData.element,
    
    // Current stats (from phase 1)
    currentHp: phase1.maxHp,
    hp: phase1.maxHp,
    maxHp: phase1.maxHp,
    mp: phase1.mp,
    maxMp: phase1.maxMp,
    atk: phase1.atk,
    def: phase1.def,
    spd: phase1.spd,
    abilities: [...phase1.abilities],
    aiBehavior: phase1.aiBehavior,
    
    // Phase tracking
    currentPhase: 1,
    totalPhases: bossData.phases.length,
    phases: bossData.phases,
    phaseJustChanged: false,
    phaseChangeDialogue: null,
    
    // Status effects
    statusEffects: [],
    
    // Rewards
    xpReward: bossData.xpReward,
    goldReward: bossData.goldReward,
    drops: bossData.drops
  };
}

/**
 * Check if the boss should transition to a new phase
 * @param {Object} boss - The boss state
 * @returns {boolean} True if a phase transition should occur
 */
export function checkPhaseTransition(boss) {
  if (!isBoss(boss)) return false;

  const phases = Array.isArray(boss.phases) ? boss.phases : [];
  const currentPhase = boss.currentPhase || 1;
  const hpPercent = boss.maxHp > 0 ? boss.currentHp / boss.maxHp : 0;

  let targetPhase = currentPhase;
  for (let i = phases.length - 1; i >= 0; i--) {
    const phase = phases[i];
    if (hpPercent <= phase.hpThreshold && phase.phase > targetPhase) {
      targetPhase = phase.phase;
    }
  }

  return targetPhase > currentPhase;
}

/**
 * Transition boss to a new phase
 * @param {Object} boss - The boss state
 * @param {number} phaseNum - Target phase number
 * @returns {Object} Updated boss state
 */
export function transitionToPhase(boss, phaseNum) {
  const phaseIndex = phaseNum - 1;
  if (phaseIndex < 0 || phaseIndex >= boss.phases.length) {
    return boss;
  }
  
  const newPhase = boss.phases[phaseIndex];
  
  return {
    ...boss,
    currentPhase: phaseNum,
    atk: newPhase.atk,
    def: newPhase.def,
    spd: newPhase.spd,
    abilities: [...newPhase.abilities],
    aiBehavior: newPhase.aiBehavior,
    phaseJustChanged: true,
    phaseChangeDialogue: newPhase.dialogue || null
  };
}

/**
 * Get the current phase data for a boss
 * @param {Object} boss - The boss state
 * @returns {Object} Current phase data
 */
export function getCurrentPhase(boss) {
  if (!boss.isBoss || !boss.phases) return null;
  return boss.phases[boss.currentPhase - 1] || null;
}

/**
 * Get the phase name for display
 * @param {Object} boss - The boss state
 * @returns {string} Phase name
 */
export function getPhaseName(boss) {
  const phase = getCurrentPhase(boss);
  return phase ? phase.name : 'Unknown';
}

/**
 * Calculate boss ability damage
 * @param {Object} boss - The boss state
 * @param {string} abilityId - Ability to use
 * @param {Object} target - Target state (player)
 * @returns {Object} Damage result { damage, isCrit, element, effect }
 */
export function calculateBossAbilityDamage(boss, abilityId, target) {
  const ability = getBossAbility(abilityId);
  if (!ability) {
    return { damage: 0, isCrit: false, element: null, effect: null };
  }
  
  if (ability.type === 'buff' || ability.type === 'heal') {
    return { damage: 0, isCrit: false, element: null, effect: ability.effect };
  }
  
  let damage = 0;
  const isCrit = Math.random() < 0.1; // 10% crit chance for bosses
  
  if (ability.type === 'physical') {
    // Physical damage: (atk * power / 50) - def/2
    damage = Math.floor((boss.atk * ability.power / 50) - (target.def / 2));
  } else if (ability.type === 'magical' || ability.type === 'drain') {
    // Magical damage: power * 1.2 - def/4 (less defense impact)
    damage = Math.floor(ability.power * 1.2 - (target.def / 4));
  }
  
  // Apply crit multiplier
  if (isCrit) {
    damage = Math.floor(damage * 1.5);
  }
  
  // Minimum 1 damage
  damage = Math.max(1, damage);
  
  // Check for effect application
  let appliedEffect = null;
  if (ability.effect && ability.effect.chance) {
    if (Math.random() < ability.effect.chance) {
      appliedEffect = { ...ability.effect };
    }
  } else if (ability.effect && !ability.effect.chance) {
    appliedEffect = { ...ability.effect };
  }
  
  return {
    damage,
    isCrit,
    element: ability.element || null,
    effect: appliedEffect,
    healAmount: ability.type === 'drain' ? Math.floor(damage * (ability.healPercent || 0.5)) : 0
  };
}

/**
 * Select a boss ability based on AI behavior and current state
 * @param {Object} boss - The boss state
 * @returns {string|null} Selected ability ID or null for basic attack
 */
export function selectBossAbility(boss) {
  if (!boss.abilities || boss.abilities.length === 0) {
    return null; // Basic attack
  }
  
  const availableAbilities = boss.abilities.filter(abilityId => {
    const ability = getBossAbility(abilityId);
    return ability && ability.mpCost <= boss.mp;
  });
  
  if (availableAbilities.length === 0) {
    return null; // Basic attack if no MP
  }
  
  // AI behavior influences ability selection
  const behavior = boss.aiBehavior || 'basic';
  
  if (behavior === 'aggressive') {
    // Prefer high-damage abilities
    const damageAbilities = availableAbilities.filter(id => {
      const ab = getBossAbility(id);
      return ab && (ab.type === 'physical' || ab.type === 'magical');
    });
    if (damageAbilities.length > 0) {
      return damageAbilities[Math.floor(Math.random() * damageAbilities.length)];
    }
  } else if (behavior === 'caster') {
    // Prefer magical abilities
    const magicAbilities = availableAbilities.filter(id => {
      const ab = getBossAbility(id);
      return ab && ab.type === 'magical';
    });
    if (magicAbilities.length > 0) {
      return magicAbilities[Math.floor(Math.random() * magicAbilities.length)];
    }
  }
  
  // Default: random selection
  return availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
}

/**
 * Apply damage to boss and check for phase transition
 * @param {Object} boss - The boss state
 * @param {number} damage - Damage to apply
 * @returns {Object} Updated boss state
 */
export function applyDamageToBoss(boss, damage) {
  const newHp = Math.max(0, boss.currentHp - damage);
  const updatedBoss = { ...boss, currentHp: newHp, hp: newHp };
  
  // Check for phase transition after damage
  const phaseChanged = checkPhaseTransition(updatedBoss);
  return { boss: updatedBoss, phaseChanged };
}

/**
 * Check if boss is defeated
 * @param {Object} boss - The boss state
 * @returns {boolean} True if defeated
 */
export function isBossDefeated(boss) {
  return boss.currentHp <= 0;
}

/**
 * Get boss victory rewards
 * @param {Object} boss - The defeated boss state
 * @returns {Object} Rewards { xp, gold, items }
 */
export function getBossRewards(boss) {
  const items = [];
  
  if (boss.drops) {
    for (const drop of boss.drops) {
      if (Math.random() < drop.chance) {
        items.push(drop.itemId);
      }
    }
  }
  
  return {
    exp: boss.xpReward || 0,
    gold: boss.goldReward || 0,
    items
  };
}

/**
 * Get HP bar segments for boss display
 * Each segment represents a phase threshold
 * @param {Object} boss - The boss state
 * @returns {Array} Array of segment objects { start, end, phase }
 */
export function getBossHpSegments(boss) {
  if (!boss.isBoss || !boss.phases) {
    return [{ start: 0, end: 1, phase: 1 }];
  }
  
  const segments = [];
  const phases = boss.phases.slice().sort((a, b) => b.hpThreshold - a.hpThreshold);
  
  let prevThreshold = 1;
  for (const phase of phases) {
    if (phase.hpThreshold < prevThreshold) {
      segments.push({
        start: phase.hpThreshold,
        end: prevThreshold,
        phase: phase.phase
      });
      prevThreshold = phase.hpThreshold;
    }
  }
  
  // Add final segment if needed
  if (prevThreshold > 0) {
    segments.push({
      start: 0,
      end: prevThreshold,
      phase: phases[phases.length - 1].phase
    });
  }
  
  return segments;
}

/**
 * Check if an enemy is a boss
 * @param {Object} enemy - Enemy object to check
 * @returns {boolean} True if boss
 */
export function isBoss(enemy) {
  if (!enemy || typeof enemy !== 'object') {
    return false;
  }

  return enemy.isBoss === true;
}
