// Shield/Break Combat System - AI Village RPG
// Created Day 343.

export const BREAK_DURATION = 2;
export const BREAK_DAMAGE_MULTIPLIER = 1.5;

export const ELEMENT_ICONS = {
  physical: "⚔️",
  fire: "🔥",
  ice: "❄️",
  lightning: "⚡",
  shadow: "🌑",
  nature: "🌿",
  holy: "✨",
};

export const ENEMY_SHIELD_DATABASE = {
  slime: { shieldCount: 2, weaknesses: ["fire", "lightning"] },
  goblin: { shieldCount: 2, weaknesses: ["fire", "holy"] },
  goblin_chief: { shieldCount: 5, weaknesses: ["fire", "holy"] },
  cave_bat: { shieldCount: 1, weaknesses: ["fire", "lightning", "holy"] },
  giant_spider: { shieldCount: 3, weaknesses: ["fire", "lightning"] },
  // Alias: some content uses a dashed id.
  "giant-spider": { shieldCount: 3, weaknesses: ["fire", "lightning"] },
  training_dummy: {
    shieldCount: 2,
    weaknesses: ["physical", "fire", "ice", "lightning", "shadow", "nature", "holy"],
    breakImmune: true,
  },
  wolf: { shieldCount: 2, weaknesses: ["fire", "ice"] },
  skeleton: { shieldCount: 3, weaknesses: ["holy", "fire"], immunities: ["shadow"] },
  orc: { shieldCount: 4, weaknesses: ["fire", "holy"] },
  "fire-spirit": {
    shieldCount: 3,
    weaknesses: ["ice", "holy"],
    immunities: ["fire"],
    absorbs: ["fire"],
  },
  "ice-spirit": {
    shieldCount: 3,
    weaknesses: ["fire", "lightning"],
    immunities: ["ice"],
    absorbs: ["ice"],
  },
  "dark-cultist": {
    shieldCount: 3,
    weaknesses: ["holy", "lightning"],
    immunities: ["shadow"],
  },
  bandit: { shieldCount: 2, weaknesses: ["fire", "holy"] },
  wraith: {
    shieldCount: 4,
    weaknesses: ["holy", "fire"],
    immunities: ["physical", "shadow"],
    absorbs: ["shadow"],
  },
  "stone-golem": {
    shieldCount: 5,
    weaknesses: ["ice", "nature"],
    immunities: ["lightning"],
  },
  "thunder-hawk": { shieldCount: 2, weaknesses: ["ice", "fire"] },
  dragon: { shieldCount: 8, weaknesses: ["ice", "holy"], immunities: ["fire"] },
  abyss_overlord: {
    shieldCount: 10,
    weaknesses: ["holy", "lightning"],
    immunities: ["shadow", "fire"],
    absorbs: ["shadow"],
  },
  "frost-revenant": {
    shieldCount: 4,
    weaknesses: ["fire", "holy"],
    immunities: ["ice"],
    absorbs: ["ice"],
  },
  "blood-fiend": {
    shieldCount: 3,
    weaknesses: ["holy", "fire"],
    immunities: ["shadow"],
  },
  "shadow-weaver": {
    shieldCount: 3,
    weaknesses: ["holy", "lightning"],
    immunities: ["shadow"],
    absorbs: ["shadow"],
  },
  "storm-elemental": {
    shieldCount: 5,
    weaknesses: ["ice", "nature"],
    immunities: ["lightning"],
    absorbs: ["lightning"],
  },
  "plague-bearer": {
    shieldCount: 5,
    weaknesses: ["fire", "holy"],
    immunities: ["nature"],
  },
  "infernal-knight": {
    shieldCount: 6,
    weaknesses: ["ice", "holy"],
    immunities: ["fire"],
  },
  "glacial-wyrm": {
    shieldCount: 7,
    weaknesses: ["fire", "lightning"],
    immunities: ["ice"],
    absorbs: ["ice"],
  },
  "void-stalker": {
    shieldCount: 4,
    weaknesses: ["holy", "lightning"],
    immunities: ["shadow", "physical"],
  },
};

const DEFAULT_ENEMY_SHIELDS = {
  shieldCount: 2,
  weaknesses: [],
  immunities: [],
  absorbs: [],
  breakImmune: false,
};

function normalizeElement(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

export function checkWeakness(element, weaknesses) {
  if (!element || !Array.isArray(weaknesses) || weaknesses.length === 0) return false;
  const normalized = normalizeElement(element);
  if (!normalized) return false;
  return weaknesses.some((entry) => normalizeElement(entry) === normalized);
}

export function applyShieldDamage(enemy, amount) {
  if (!enemy) return { shieldsRemaining: 0, triggeredBreak: false };
  const damage = Number.isInteger(amount) ? amount : 0;
  if (damage <= 0 || enemy.isBroken) {
    return {
      shieldsRemaining: Math.max(0, Number(enemy.currentShields) || 0),
      triggeredBreak: false,
    };
  }

  const current = Math.max(0, Number(enemy.currentShields) || 0);
  const shieldsRemaining = Math.max(0, current - damage);
  const triggeredBreak = shieldsRemaining === 0 && !enemy.isBroken;
  return { shieldsRemaining, triggeredBreak };
}

export function processBreakState(enemy) {
  if (!enemy || !enemy.isBroken) {
    return { stillBroken: false, recoveredThisTurn: false };
  }

  const turnsRemaining = Number(enemy.breakTurnsRemaining) || 0;
  if (turnsRemaining > 1) {
    return {
      stillBroken: true,
      turnsRemaining: turnsRemaining - 1,
      recoveredThisTurn: false,
    };
  }

  return {
    stillBroken: false,
    recoveredThisTurn: true,
    restoredShields: Number(enemy.maxShields) || 0,
  };
}

export function getWeaknessIcons(weaknesses) {
  if (!Array.isArray(weaknesses) || weaknesses.length === 0) return "";
  return weaknesses
    .map((entry) => ELEMENT_ICONS[normalizeElement(entry)])
    .filter(Boolean)
    .join("");
}

export function getEnemyShieldData(enemyId) {
  if (enemyId && Object.prototype.hasOwnProperty.call(ENEMY_SHIELD_DATABASE, enemyId)) {
    const data = ENEMY_SHIELD_DATABASE[enemyId];
    return {
      shieldCount: data.shieldCount ?? DEFAULT_ENEMY_SHIELDS.shieldCount,
      weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
      immunities: Array.isArray(data.immunities) ? data.immunities : [],
      absorbs: Array.isArray(data.absorbs) ? data.absorbs : [],
      breakImmune: Boolean(data.breakImmune),
    };
  }

  return { ...DEFAULT_ENEMY_SHIELDS };
}

export function initializeEnemyShields(enemyId, tier) {
  const data = getEnemyShieldData(enemyId);
  let shieldCount = data.shieldCount;
  if (tier === 4) {
    shieldCount = Math.max(shieldCount, 8);
  }

  return {
    shieldCount,
    maxShields: shieldCount,
    weaknesses: [...data.weaknesses],
    immunities: [...data.immunities],
    absorbs: [...data.absorbs],
    isBroken: false,
    breakTurnsRemaining: 0,
    breakImmune: data.breakImmune,
  };
}
