/**
 * Enemy AI — Tactical Decision Engine — AI Village RPG
 * Owner: Claude Opus 4.6
 *
 * Provides context-aware enemy action selection that considers:
 * - HP/MP thresholds for both enemy and player
 * - Current status effects on both sides
 * - Turn count for rotation-based patterns
 * - Ability categorization (damage vs debuff vs self-buff vs heal)
 * - Behavior-specific strategies (basic, aggressive, caster, support, boss)
 */

import { getAbility } from './combat/abilities.js';

// ── RNG helper (must match combat.js deterministic RNG) ──────────────
const RNG_MOD = 2147483647;
const RNG_MULT = 48271;

function nextSeed(seed) {
  const safeSeed = Number.isFinite(seed) && seed > 0 ? seed : 1;
  const next = (safeSeed * RNG_MULT) % RNG_MOD;
  return { seed: next, value: next / RNG_MOD };
}

// ── Utility helpers ──────────────────────────────────────────────────

export function getHpPercent(entity) {
  if (!entity || !entity.maxHp || entity.maxHp <= 0) return 1;
  return Math.max(0, Math.min(1, entity.hp / entity.maxHp));
}

export function getMpPercent(entity) {
  if (!entity || !entity.maxMp || entity.maxMp <= 0) return 0;
  return Math.max(0, Math.min(1, (entity.mp ?? 0) / entity.maxMp));
}

export function hasStatusEffect(entity, effectType) {
  return (entity?.statusEffects ?? []).some(
    (e) => e.type === effectType && (e.duration ?? 0) > 0
  );
}

export function hasAnyDebuff(entity) {
  const debuffTypes = [
    'poison', 'burn', 'bleed', 'curse', 'blind', 'silence',
    'stun', 'freeze', 'spd-down', 'atk-down', 'def-down',
  ];
  return debuffTypes.some((t) => hasStatusEffect(entity, t));
}

export function hasAnyBuff(entity) {
  const buffTypes = ['atk-up', 'def-up', 'spd-up', 'regen', 'shield'];
  return buffTypes.some((t) => hasStatusEffect(entity, t));
}

/**
 * Get usable abilities (enough MP to cast).
 */
export function getUsableAbilities(enemy) {
  const currentMp = enemy?.mp ?? 0;
  const abilityIds = enemy?.abilities ?? [];
  return abilityIds
    .map((id) => getAbility(id))
    .filter((a) => a && currentMp >= (a.mpCost ?? 0));
}

/**
 * Categorize abilities by tactical role.
 */
export function categorizeAbilities(abilities) {
  const result = { damage: [], debuff: [], selfBuff: [], selfHeal: [] };
  for (const a of abilities) {
    if (!a) continue;
    const targetsSelf = a.targetType === 'self';
    const hasStatus = a.statusEffect != null;
    const hasHeal = (a.healPower ?? 0) > 0;
    const hasRegen = hasStatus && a.statusEffect.type === 'regen';

    if (targetsSelf && (hasHeal || hasRegen)) {
      result.selfHeal.push(a);
    } else if (targetsSelf && hasStatus) {
      result.selfBuff.push(a);
    } else if (!targetsSelf && hasStatus && (a.power ?? 0) <= 0.5) {
      // Low/no damage + status effect = primarily a debuff
      result.debuff.push(a);
    } else if (!targetsSelf && hasStatus) {
      // Damage + status = counts as both damage and debuff
      result.damage.push(a);
      result.debuff.push(a);
    } else {
      result.damage.push(a);
    }
  }
  return result;
}

/**
 * Pick a random ability from a list using the RNG seed.
 * Returns { ability, newSeed } or { ability: null, newSeed } if list is empty.
 */
function pickRandomAbility(abilities, seed) {
  if (!abilities || abilities.length === 0) {
    return { ability: null, newSeed: seed };
  }
  const { seed: newSeed, value } = nextSeed(seed);
  const index = Math.floor(value * abilities.length);
  return { ability: abilities[index], newSeed };
}

/**
 * Pick the strongest (highest power) ability from a list.
 * Falls back to first ability if powers are equal.
 */
function pickStrongestAbility(abilities) {
  if (!abilities || abilities.length === 0) return null;
  return abilities.reduce((best, a) => {
    return (a.power ?? 0) > (best.power ?? 0) ? a : best;
  }, abilities[0]);
}

// ── Behavior-specific strategies ─────────────────────────────────────

function basicStrategy(enemy, player, turnCount, seed) {
  const hpPct = getHpPercent(enemy);
  const usable = getUsableAbilities(enemy);
  const { seed: s1, value: roll } = nextSeed(seed);

  // Low HP: defend more often (30% defend, 50% attack, 20% ability)
  if (hpPct < 0.3) {
    if (roll < 0.3) {
      return { action: 'defend', abilityId: null, newSeed: s1 };
    }
    if (roll >= 0.8 && usable.length > 0) {
      const { ability, newSeed } = pickRandomAbility(usable, s1);
      return ability
        ? { action: 'ability', abilityId: ability.id, newSeed }
        : { action: 'attack', abilityId: null, newSeed };
    }
    return { action: 'attack', abilityId: null, newSeed: s1 };
  }

  // Normal: 65% attack, 25% ability, 10% defend
  if (roll >= 0.9) {
    return { action: 'defend', abilityId: null, newSeed: s1 };
  }
  if (roll >= 0.65 && usable.length > 0) {
    const { ability, newSeed } = pickRandomAbility(usable, s1);
    return ability
      ? { action: 'ability', abilityId: ability.id, newSeed }
      : { action: 'attack', abilityId: null, newSeed };
  }
  return { action: 'attack', abilityId: null, newSeed: s1 };
}

function aggressiveStrategy(enemy, player, turnCount, seed) {
  const hpPct = getHpPercent(enemy);
  const usable = getUsableAbilities(enemy);
  const categories = categorizeAbilities(usable);
  const { seed: s1, value: roll } = nextSeed(seed);

  // Berserk mode: below 50% HP — never defend, prefer strongest attacks
  if (hpPct < 0.5) {
    if (categories.damage.length > 0 && roll < 0.6) {
      const strongest = pickStrongestAbility(categories.damage);
      return { action: 'ability', abilityId: strongest.id, newSeed: s1 };
    }
    if (usable.length > 0 && roll < 0.8) {
      const { ability, newSeed } = pickRandomAbility(usable, s1);
      return ability
        ? { action: 'ability', abilityId: ability.id, newSeed }
        : { action: 'attack', abilityId: null, newSeed };
    }
    return { action: 'attack', abilityId: null, newSeed: s1 };
  }

  // Player defending: use ability to bypass defense or deal ability damage
  if (player?.defending && usable.length > 0 && roll < 0.7) {
    const { ability, newSeed } = pickRandomAbility(usable, s1);
    return ability
      ? { action: 'ability', abilityId: ability.id, newSeed }
      : { action: 'attack', abilityId: null, newSeed };
  }

  // Normal aggressive: 45% attack, 45% ability, 10% defend
  if (roll < 0.45) {
    return { action: 'attack', abilityId: null, newSeed: s1 };
  }
  if (roll < 0.9 && usable.length > 0) {
    const { ability, newSeed } = pickRandomAbility(usable, s1);
    return ability
      ? { action: 'ability', abilityId: ability.id, newSeed }
      : { action: 'attack', abilityId: null, newSeed };
  }
  if (roll >= 0.9) {
    return { action: 'defend', abilityId: null, newSeed: s1 };
  }
  return { action: 'attack', abilityId: null, newSeed: s1 };
}

function casterStrategy(enemy, player, turnCount, seed) {
  const hpPct = getHpPercent(enemy);
  const mpPct = getMpPercent(enemy);
  const usable = getUsableAbilities(enemy);
  const categories = categorizeAbilities(usable);
  const { seed: s1, value: roll } = nextSeed(seed);

  // Low HP: try self-heal/buff first
  if (hpPct < 0.35) {
    if (categories.selfHeal.length > 0) {
      const { ability, newSeed } = pickRandomAbility(categories.selfHeal, s1);
      if (ability) return { action: 'ability', abilityId: ability.id, newSeed };
    }
    if (categories.selfBuff.length > 0 && !hasAnyBuff(enemy)) {
      const { ability, newSeed } = pickRandomAbility(categories.selfBuff, s1);
      if (ability) return { action: 'ability', abilityId: ability.id, newSeed };
    }
    // Defend if can't heal
    if (roll < 0.4) {
      return { action: 'defend', abilityId: null, newSeed: s1 };
    }
  }

  // Low MP: conserve, mostly basic attacks
  if (mpPct < 0.3 && usable.length <= 1) {
    if (roll < 0.75) {
      return { action: 'attack', abilityId: null, newSeed: s1 };
    }
    if (roll < 0.9 && usable.length > 0) {
      const { ability, newSeed } = pickRandomAbility(usable, s1);
      return ability
        ? { action: 'ability', abilityId: ability.id, newSeed }
        : { action: 'attack', abilityId: null, newSeed };
    }
    return { action: 'defend', abilityId: null, newSeed: s1 };
  }

  // Player has no debuffs: prioritize debuff abilities
  if (!hasAnyDebuff(player) && categories.debuff.length > 0 && roll < 0.55) {
    const { ability, newSeed } = pickRandomAbility(categories.debuff, s1);
    if (ability) return { action: 'ability', abilityId: ability.id, newSeed };
  }

  // Normal caster: 15% attack, 70% ability, 15% defend
  if (roll < 0.15) {
    return { action: 'attack', abilityId: null, newSeed: s1 };
  }
  if (roll < 0.85 && usable.length > 0) {
    const { ability, newSeed } = pickRandomAbility(usable, s1);
    return ability
      ? { action: 'ability', abilityId: ability.id, newSeed }
      : { action: 'attack', abilityId: null, newSeed };
  }
  if (usable.length === 0) {
    return { action: 'attack', abilityId: null, newSeed: s1 };
  }
  return { action: 'defend', abilityId: null, newSeed: s1 };
}

function supportStrategy(enemy, player, turnCount, seed) {
  const hpPct = getHpPercent(enemy);
  const usable = getUsableAbilities(enemy);
  const categories = categorizeAbilities(usable);
  const { seed: s1, value: roll } = nextSeed(seed);

  // Low HP: try self-heal/regen first
  if (hpPct < 0.4) {
    if (categories.selfHeal.length > 0) {
      const { ability, newSeed } = pickRandomAbility(categories.selfHeal, s1);
      if (ability) return { action: 'ability', abilityId: ability.id, newSeed };
    }
    // Defend to buy time
    if (roll < 0.35) {
      return { action: 'defend', abilityId: null, newSeed: s1 };
    }
  }

  // If no self-buff active: apply one
  if (!hasAnyBuff(enemy) && categories.selfBuff.length > 0 && roll < 0.5) {
    const { ability, newSeed } = pickRandomAbility(categories.selfBuff, s1);
    if (ability) return { action: 'ability', abilityId: ability.id, newSeed };
  }

  // Mix: debuff player if no debuffs, otherwise attack/ability
  if (!hasAnyDebuff(player) && categories.debuff.length > 0 && roll < 0.45) {
    const { ability, newSeed } = pickRandomAbility(categories.debuff, s1);
    if (ability) return { action: 'ability', abilityId: ability.id, newSeed };
  }

  // Normal support: 25% attack, 45% ability, 30% defend
  if (roll < 0.25) {
    return { action: 'attack', abilityId: null, newSeed: s1 };
  }
  if (roll < 0.7 && usable.length > 0) {
    const { ability, newSeed } = pickRandomAbility(usable, s1);
    return ability
      ? { action: 'ability', abilityId: ability.id, newSeed }
      : { action: 'attack', abilityId: null, newSeed };
  }
  if (usable.length === 0 && roll >= 0.25) {
    return roll < 0.7
      ? { action: 'attack', abilityId: null, newSeed: s1 }
      : { action: 'defend', abilityId: null, newSeed: s1 };
  }
  return { action: 'defend', abilityId: null, newSeed: s1 };
}

function bossStrategy(enemy, player, turnCount, seed) {
  const hpPct = getHpPercent(enemy);
  const usable = getUsableAbilities(enemy);
  const categories = categorizeAbilities(usable);
  const { seed: s1, value: roll } = nextSeed(seed);

  // Signature ability = first ability in the enemy's list
  const signatureId = (enemy?.abilities ?? [])[0] ?? null;
  const signatureAbility = signatureId ? getAbility(signatureId) : null;
  const canUseSignature =
    signatureAbility && (enemy?.mp ?? 0) >= (signatureAbility.mpCost ?? 0);

  // Desperate mode: below 25% HP — all-out strongest abilities
  if (hpPct < 0.25) {
    if (categories.damage.length > 0) {
      const strongest = pickStrongestAbility(categories.damage);
      return { action: 'ability', abilityId: strongest.id, newSeed: s1 };
    }
    return { action: 'attack', abilityId: null, newSeed: s1 };
  }

  // Enraged mode: below 50% HP — prefer strong abilities, no defending
  if (hpPct < 0.5) {
    // Use signature ability 40% of the time
    if (canUseSignature && roll < 0.4) {
      return { action: 'ability', abilityId: signatureId, newSeed: s1 };
    }
    if (categories.damage.length > 0 && roll < 0.75) {
      const strongest = pickStrongestAbility(categories.damage);
      return { action: 'ability', abilityId: strongest.id, newSeed: s1 };
    }
    if (usable.length > 0 && roll < 0.9) {
      const { ability, newSeed } = pickRandomAbility(usable, s1);
      return ability
        ? { action: 'ability', abilityId: ability.id, newSeed }
        : { action: 'attack', abilityId: null, newSeed };
    }
    return { action: 'attack', abilityId: null, newSeed: s1 };
  }

  // Normal boss rotation based on turn count
  const phase = turnCount % 4;

  if (phase === 0 || phase === 1) {
    // Turns 1-2: Use abilities
    if (canUseSignature && roll < 0.35) {
      return { action: 'ability', abilityId: signatureId, newSeed: s1 };
    }
    if (usable.length > 0) {
      const { ability, newSeed } = pickRandomAbility(usable, s1);
      return ability
        ? { action: 'ability', abilityId: ability.id, newSeed }
        : { action: 'attack', abilityId: null, newSeed };
    }
    return { action: 'attack', abilityId: null, newSeed: s1 };
  }

  if (phase === 2) {
    // Turn 3: Heavy ability (signature or strongest)
    if (canUseSignature) {
      return { action: 'ability', abilityId: signatureId, newSeed: s1 };
    }
    if (categories.damage.length > 0) {
      const strongest = pickStrongestAbility(categories.damage);
      return { action: 'ability', abilityId: strongest.id, newSeed: s1 };
    }
    return { action: 'attack', abilityId: null, newSeed: s1 };
  }

  // Turn 4: Defend or self-buff
  if (categories.selfBuff.length > 0 && !hasAnyBuff(enemy)) {
    const { ability, newSeed } = pickRandomAbility(categories.selfBuff, s1);
    if (ability) return { action: 'ability', abilityId: ability.id, newSeed };
  }
  if (categories.selfHeal.length > 0 && hpPct < 0.7) {
    const { ability, newSeed } = pickRandomAbility(categories.selfHeal, s1);
    if (ability) return { action: 'ability', abilityId: ability.id, newSeed };
  }
  return { action: 'defend', abilityId: null, newSeed: s1 };
}

// ── Strategy dispatch table ──────────────────────────────────────────

const STRATEGIES = {
  basic: basicStrategy,
  aggressive: aggressiveStrategy,
  caster: casterStrategy,
  support: supportStrategy,
  boss: bossStrategy,
};

// ── Main export ──────────────────────────────────────────────────────

/**
 * Select an enemy action using tactical AI.
 *
 * Drop-in replacement for selectEnemyAction from enemy-abilities.js,
 * with the same return shape: { action, abilityId, newSeed }.
 *
 * @param {Object} enemy - The enemy combatant
 * @param {Object} player - The player combatant
 * @param {number} rngSeed - Current RNG seed
 * @param {number} [turnCount=0] - Current combat turn number
 * @returns {{ action: 'attack'|'ability'|'defend', abilityId: string|null, newSeed: number }}
 */
export function selectTacticalAction(enemy, player, rngSeed, turnCount = 0) {
  const behavior = enemy?.aiBehavior ?? 'basic';
  const strategyFn = STRATEGIES[behavior] ?? STRATEGIES.basic;
  return strategyFn(enemy, player, turnCount, rngSeed);
}
